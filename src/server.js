const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const path = require('path');
const client = require('prom-client');
const { pool, checkDatabaseConnection } = require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;

// ==========================================
// PROMETHEUS METRICS SETUP
// ==========================================
const register = new client.Registry();
client.collectDefaultMetrics({ register, prefix: 'student_app_' });

const httpRequestCounter = new client.Counter({
  name: 'student_app_http_requests_total',
  help: 'Tổng số HTTP requests đến ứng dụng quản lý sinh viên',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

const httpRequestDuration = new client.Histogram({
  name: 'student_app_http_request_duration_seconds',
  help: 'Thời gian xử lý HTTP request tính bằng giây',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
  registers: [register]
});

// Middleware ghi nhận metrics cho mỗi request
app.use((req, res, next) => {
  const start = process.hrtime();
  res.on('finish', () => {
    const diff = process.hrtime(start);
    const duration = diff[0] + diff[1] / 1e9;
    const route = req.route ? req.route.path : req.path;
    httpRequestCounter.inc({ method: req.method, route, status_code: res.statusCode });
    httpRequestDuration.observe({ method: req.method, route, status_code: res.statusCode }, duration);
  });
  next();
});

// ==========================================
// MIDDLEWARES CƠ BẢN
// ==========================================
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Cấu hình View Engine EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layout');

// Endpoint Prometheus Scrape
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    res.status(500).end(err);
  }
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const [result] = await pool.query('SELECT 1 as is_alive');
    res.json({
      status: 'UP',
      timestamp: new Date().toISOString(),
      database: result[0].is_alive === 1 ? 'CONNECTED' : 'DISCONNECTED'
    });
  } catch (err) {
    res.status(503).json({
      status: 'DOWN',
      timestamp: new Date().toISOString(),
      error: err.message
    });
  }
});

// ==========================================
// 1. DASHBOARD TỔNG QUAN
// ==========================================
app.get('/', async (req, res) => {
  try {
    const [[{ totalStudents }]] = await pool.query('SELECT COUNT(*) as totalStudents FROM students');
    const [[{ totalClasses }]] = await pool.query('SELECT COUNT(*) as totalClasses FROM classes');
    const [[{ totalSubjects }]] = await pool.query('SELECT COUNT(*) as totalSubjects FROM subjects');
    const [[{ avgScore }]] = await pool.query('SELECT COALESCE(AVG(average_score), 0) as avgScore FROM grades');

    const [recentStudents] = await pool.query(`
      SELECT s.id, s.student_code, s.full_name, s.gender, s.email, c.class_name, s.status
      FROM students s
      LEFT JOIN classes c ON s.class_id = c.id
      ORDER BY s.id DESC LIMIT 5
    `);

    const [gradeStats] = await pool.query(`
      SELECT letter_grade, COUNT(*) as count
      FROM grades
      GROUP BY letter_grade
      ORDER BY letter_grade
    `);

    res.render('dashboard', {
      title: 'Bảng Điều Khiển - Hệ Thống Quản Lý Sinh Viên',
      stats: {
        totalStudents,
        totalClasses,
        totalSubjects,
        avgScore: parseFloat(avgScore).toFixed(2)
      },
      recentStudents,
      gradeStats
    });
  } catch (err) {
    console.error('Lỗi tải dashboard:', err);
    res.status(500).render('error', { title: 'Lỗi', error: err.message });
  }
});

// ==========================================
// 2. CRUD QUẢN LÝ SINH VIÊN
// ==========================================
app.get('/students', async (req, res) => {
  try {
    const search = req.query.q || '';
    let query = `
      SELECT s.id, s.student_code, s.full_name, s.dob, s.gender, s.email, s.phone, c.class_name, s.status
      FROM students s
      LEFT JOIN classes c ON s.class_id = c.id
    `;
    const params = [];

    if (search) {
      query += ` WHERE s.student_code LIKE ? OR s.full_name LIKE ? OR s.email LIKE ?`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    query += ` ORDER BY s.id DESC`;

    const [students] = await pool.query(query, params);
    res.render('students/index', {
      title: 'Danh Sách Sinh Viên',
      students,
      search
    });
  } catch (err) {
    console.error('Lỗi lấy danh sách sinh viên:', err);
    res.status(500).render('error', { title: 'Lỗi', error: err.message });
  }
});

app.get('/students/create', async (req, res) => {
  try {
    const [classes] = await pool.query('SELECT id, class_code, class_name FROM classes ORDER BY class_name');
    res.render('students/form', {
      title: 'Thêm Mới Sinh Viên',
      student: null,
      classes
    });
  } catch (err) {
    res.status(500).render('error', { title: 'Lỗi', error: err.message });
  }
});

app.post('/students/create', async (req, res) => {
  const { student_code, full_name, dob, gender, email, phone, class_id, status } = req.body;
  try {
    await pool.query(
      `INSERT INTO students (student_code, full_name, dob, gender, email, phone, class_id, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [student_code, full_name, dob, gender, email, phone, class_id || null, status || 'Đang học']
    );
    res.redirect('/students');
  } catch (err) {
    console.error('Lỗi tạo sinh viên:', err);
    const [classes] = await pool.query('SELECT id, class_code, class_name FROM classes ORDER BY class_name');
    res.render('students/form', {
      title: 'Thêm Mới Sinh Viên',
      student: req.body,
      classes,
      errorMessage: 'Lỗi: ' + err.message
    });
  }
});

app.get('/students/edit/:id', async (req, res) => {
  try {
    const [students] = await pool.query('SELECT * FROM students WHERE id = ?', [req.params.id]);
    if (students.length === 0) return res.redirect('/students');
    const [classes] = await pool.query('SELECT id, class_code, class_name FROM classes ORDER BY class_name');
    res.render('students/form', {
      title: 'Cập Nhật Sinh Viên',
      student: students[0],
      classes
    });
  } catch (err) {
    res.status(500).render('error', { title: 'Lỗi', error: err.message });
  }
});

app.post('/students/edit/:id', async (req, res) => {
  const { student_code, full_name, dob, gender, email, phone, class_id, status } = req.body;
  try {
    await pool.query(
      `UPDATE students
       SET student_code = ?, full_name = ?, dob = ?, gender = ?, email = ?, phone = ?, class_id = ?, status = ?
       WHERE id = ?`,
      [student_code, full_name, dob, gender, email, phone, class_id || null, status, req.params.id]
    );
    res.redirect('/students');
  } catch (err) {
    const [classes] = await pool.query('SELECT id, class_code, class_name FROM classes ORDER BY class_name');
    res.render('students/form', {
      title: 'Cập Nhật Sinh Viên',
      student: { ...req.body, id: req.params.id },
      classes,
      errorMessage: 'Lỗi: ' + err.message
    });
  }
});

app.post('/students/delete/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM students WHERE id = ?', [req.params.id]);
    res.redirect('/students');
  } catch (err) {
    res.status(500).render('error', { title: 'Lỗi', error: err.message });
  }
});

// ==========================================
// 3. CRUD QUẢN LÝ LỚP HỌC
// ==========================================
app.get('/classes', async (req, res) => {
  try {
    const [classes] = await pool.query(`
      SELECT c.*, COUNT(s.id) as student_count
      FROM classes c
      LEFT JOIN students s ON c.id = s.class_id
      GROUP BY c.id
      ORDER BY c.id DESC
    `);
    res.render('classes/index', {
      title: 'Danh Sách Lớp Học',
      classes
    });
  } catch (err) {
    res.status(500).render('error', { title: 'Lỗi', error: err.message });
  }
});

app.get('/classes/create', (req, res) => {
  res.render('classes/form', {
    title: 'Thêm Lớp Học Mới',
    c: null
  });
});

app.post('/classes/create', async (req, res) => {
  const { class_code, class_name, faculty, academic_year } = req.body;
  try {
    await pool.query(
      'INSERT INTO classes (class_code, class_name, faculty, academic_year) VALUES (?, ?, ?, ?)',
      [class_code, class_name, faculty, academic_year || '2023-2027']
    );
    res.redirect('/classes');
  } catch (err) {
    res.render('classes/form', {
      title: 'Thêm Lớp Học Mới',
      c: req.body,
      errorMessage: 'Lỗi: ' + err.message
    });
  }
});

app.get('/classes/edit/:id', async (req, res) => {
  try {
    const [classes] = await pool.query('SELECT * FROM classes WHERE id = ?', [req.params.id]);
    if (classes.length === 0) return res.redirect('/classes');
    res.render('classes/form', {
      title: 'Cập Nhật Lớp Học',
      c: classes[0]
    });
  } catch (err) {
    res.status(500).render('error', { title: 'Lỗi', error: err.message });
  }
});

app.post('/classes/edit/:id', async (req, res) => {
  const { class_code, class_name, faculty, academic_year } = req.body;
  try {
    await pool.query(
      'UPDATE classes SET class_code = ?, class_name = ?, faculty = ?, academic_year = ? WHERE id = ?',
      [class_code, class_name, faculty, academic_year, req.params.id]
    );
    res.redirect('/classes');
  } catch (err) {
    res.render('classes/form', {
      title: 'Cập Nhật Lớp Học',
      c: { ...req.body, id: req.params.id },
      errorMessage: 'Lỗi: ' + err.message
    });
  }
});

app.post('/classes/delete/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM classes WHERE id = ?', [req.params.id]);
    res.redirect('/classes');
  } catch (err) {
    res.status(500).render('error', { title: 'Lỗi', error: err.message });
  }
});

// ==========================================
// 4. CRUD QUẢN LÝ ĐIỂM SỐ
// ==========================================
app.get('/grades', async (req, res) => {
  try {
    const [grades] = await pool.query(`
      SELECT g.*, s.student_code, s.full_name as student_name, sub.subject_name, sub.subject_code
      FROM grades g
      JOIN students s ON g.student_id = s.id
      JOIN subjects sub ON g.subject_id = sub.id
      ORDER BY g.id DESC
    `);
    res.render('grades/index', {
      title: 'Bảng Điểm Sinh Viên',
      grades
    });
  } catch (err) {
    res.status(500).render('error', { title: 'Lỗi', error: err.message });
  }
});

app.get('/grades/create', async (req, res) => {
  try {
    const [students] = await pool.query('SELECT id, student_code, full_name FROM students ORDER BY student_code');
    const [subjects] = await pool.query('SELECT id, subject_code, subject_name FROM subjects ORDER BY subject_name');
    res.render('grades/form', {
      title: 'Nhập Điểm Sinh Viên',
      grade: null,
      students,
      subjects
    });
  } catch (err) {
    res.status(500).render('error', { title: 'Lỗi', error: err.message });
  }
});

app.post('/grades/create', async (req, res) => {
  const { student_id, subject_id, attendance_score, midterm_score, final_score, semester } = req.body;
  try {
    await pool.query(
      `INSERT INTO grades (student_id, subject_id, attendance_score, midterm_score, final_score, semester)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [student_id, subject_id, attendance_score || 0, midterm_score || 0, final_score || 0, semester || 'Học kỳ 1 - 2026']
    );
    res.redirect('/grades');
  } catch (err) {
    const [students] = await pool.query('SELECT id, student_code, full_name FROM students ORDER BY student_code');
    const [subjects] = await pool.query('SELECT id, subject_code, subject_name FROM subjects ORDER BY subject_name');
    res.render('grades/form', {
      title: 'Nhập Điểm Sinh Viên',
      grade: req.body,
      students,
      subjects,
      errorMessage: 'Lỗi: ' + err.message
    });
  }
});

app.get('/grades/edit/:id', async (req, res) => {
  try {
    const [grades] = await pool.query('SELECT * FROM grades WHERE id = ?', [req.params.id]);
    if (grades.length === 0) return res.redirect('/grades');
    const [students] = await pool.query('SELECT id, student_code, full_name FROM students ORDER BY student_code');
    const [subjects] = await pool.query('SELECT id, subject_code, subject_name FROM subjects ORDER BY subject_name');
    res.render('grades/form', {
      title: 'Cập Nhật Điểm Sinh Viên',
      grade: grades[0],
      students,
      subjects
    });
  } catch (err) {
    res.status(500).render('error', { title: 'Lỗi', error: err.message });
  }
});

app.post('/grades/edit/:id', async (req, res) => {
  const { student_id, subject_id, attendance_score, midterm_score, final_score, semester } = req.body;
  try {
    await pool.query(
      `UPDATE grades
       SET student_id = ?, subject_id = ?, attendance_score = ?, midterm_score = ?, final_score = ?, semester = ?
       WHERE id = ?`,
      [student_id, subject_id, attendance_score, midterm_score, final_score, semester, req.params.id]
    );
    res.redirect('/grades');
  } catch (err) {
    const [students] = await pool.query('SELECT id, student_code, full_name FROM students ORDER BY student_code');
    const [subjects] = await pool.query('SELECT id, subject_code, subject_name FROM subjects ORDER BY subject_name');
    res.render('grades/form', {
      title: 'Cập Nhật Điểm Sinh Viên',
      grade: { ...req.body, id: req.params.id },
      students,
      subjects,
      errorMessage: 'Lỗi: ' + err.message
    });
  }
});

app.post('/grades/delete/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM grades WHERE id = ?', [req.params.id]);
    res.redirect('/grades');
  } catch (err) {
    res.status(500).render('error', { title: 'Lỗi', error: err.message });
  }
});

// Khởi động server sau khi thử kết nối DB
checkDatabaseConnection().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[APP] 🚀 Server đang chạy trên cổng ${PORT}`);
    console.log(`[APP] 👉 URL Dashboard: http://localhost:${PORT}`);
    console.log(`[APP] 📊 Metrics: http://localhost:${PORT}/metrics`);
    console.log(`[APP] 🩺 Health: http://localhost:${PORT}/health`);
  });
});
