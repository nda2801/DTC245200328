const express = require('express');
const cors = require('cors');
const path = require('path');
const winston = require('winston');
const client = require('prom-client');
const { pool, testConnection } = require('./db');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'student-webapp' },
  transports: [new winston.transports.Console()]
});

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

client.collectDefaultMetrics({ prefix: 'student_app_' });

const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests processed',
  labelNames: ['method', 'route', 'status']
});

const httpRequestDurationSeconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5]
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  const start = process.hrtime();
  res.on('finish', () => {
    const elapsed = process.hrtime(start);
    const duration = elapsed[0] + elapsed[1] / 1e9;
    const route = req.route ? req.route.path : req.path;
    
    httpRequestsTotal.inc({ method: req.method, route, status: res.statusCode });
    httpRequestDurationSeconds.observe({ method: req.method, route, status: res.statusCode }, duration);

    logger.info('HTTP Request', {
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      duration: Number(duration.toFixed(4)),
      ip: req.ip || req.headers['x-forwarded-for']
    });
  });
  next();
});

app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'UP', database: 'connected', timestamp: new Date().toISOString() });
  } catch (err) {
    logger.error('Database healthcheck failed', { error: err.message });
    res.status(503).json({ status: 'DOWN', database: 'disconnected', error: err.message });
  }
});

app.get('/api/stats', async (req, res, next) => {
  try {
    const [[{ totalStudents }]] = await pool.query('SELECT COUNT(*) AS totalStudents FROM students');
    const [[{ totalClasses }]] = await pool.query('SELECT COUNT(*) AS totalClasses FROM classes');
    const [[{ totalCourses }]] = await pool.query('SELECT COUNT(*) AS totalCourses FROM courses');
    const [[{ avgGPA }]] = await pool.query('SELECT IFNULL(AVG(gpa_score), 0) AS avgGPA FROM grades');

    const [statusDistribution] = await pool.query(
      'SELECT status, COUNT(*) AS count FROM students GROUP BY status'
    );

    const [gradeDistribution] = await pool.query(
      'SELECT letter_grade, COUNT(*) AS count FROM grades GROUP BY letter_grade ORDER BY count DESC'
    );

    res.json({
      totalStudents,
      totalClasses,
      totalCourses,
      avgGPA: Number(Number(avgGPA).toFixed(2)),
      statusDistribution,
      gradeDistribution
    });
  } catch (err) {
    next(err);
  }
});

app.get('/api/classes', async (req, res, next) => {
  try {
    const [rows] = await pool.query(`
      SELECT c.*, COUNT(s.id) AS current_students
      FROM classes c
      LEFT JOIN students s ON c.id = s.class_id
      GROUP BY c.id
      ORDER BY c.class_code ASC
    `);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

app.post('/api/classes', async (req, res, next) => {
  try {
    const { class_code, class_name, faculty, academic_year, max_students } = req.body;
    if (!class_code || !class_name || !faculty || !academic_year) {
      return res.status(400).json({ error: 'Missing required class fields' });
    }
    const [result] = await pool.query(
      'INSERT INTO classes (class_code, class_name, faculty, academic_year, max_students) VALUES (?, ?, ?, ?, ?)',
      [class_code.trim(), class_name.trim(), faculty.trim(), academic_year.trim(), max_students || 50]
    );
    logger.info('[AUDIT] Created class', { class_id: result.insertId, class_code });
    res.status(201).json({ id: result.insertId, message: 'Class created successfully' });
  } catch (err) {
    next(err);
  }
});

app.put('/api/classes/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { class_code, class_name, faculty, academic_year, max_students } = req.body;
    await pool.query(
      'UPDATE classes SET class_code = ?, class_name = ?, faculty = ?, academic_year = ?, max_students = ? WHERE id = ?',
      [class_code, class_name, faculty, academic_year, max_students, id]
    );
    logger.info('[AUDIT] Updated class', { class_id: id });
    res.json({ message: 'Class updated successfully' });
  } catch (err) {
    next(err);
  }
});

app.delete('/api/classes/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM classes WHERE id = ?', [id]);
    logger.info('[AUDIT] Deleted class', { class_id: id });
    res.json({ message: 'Class deleted successfully' });
  } catch (err) {
    next(err);
  }
});

app.get('/api/students', async (req, res, next) => {
  try {
    const { q, class_id, status } = req.query;
    let query = `
      SELECT s.*, c.class_name, c.class_code,
             ROUND(AVG(g.gpa_score), 2) AS gpa
      FROM students s
      LEFT JOIN classes c ON s.class_id = c.id
      LEFT JOIN grades g ON s.id = g.student_id
      WHERE 1=1
    `;
    const params = [];

    if (q) {
      query += ' AND (s.student_code LIKE ? OR s.full_name LIKE ? OR s.email LIKE ?)';
      const term = `%${q.trim()}%`;
      params.push(term, term, term);
    }
    if (class_id) {
      query += ' AND s.class_id = ?';
      params.push(class_id);
    }
    if (status) {
      query += ' AND s.status = ?';
      params.push(status);
    }

    query += ' GROUP BY s.id ORDER BY s.id DESC';
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

app.get('/api/students/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      `SELECT s.*, c.class_name, c.class_code
       FROM students s
       LEFT JOIN classes c ON s.class_id = c.id
       WHERE s.id = ?`,
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    const [grades] = await pool.query(
      `SELECT g.*, co.course_code, co.course_name, co.credits
       FROM grades g
       JOIN courses co ON g.course_id = co.id
       WHERE g.student_id = ?`,
      [id]
    );
    res.json({ ...rows[0], grades });
  } catch (err) {
    next(err);
  }
});

app.post('/api/students', async (req, res, next) => {
  try {
    const { student_code, full_name, birth_date, gender, class_id, email, phone, status } = req.body;
    if (!student_code || !full_name || !birth_date || !email || !phone) {
      return res.status(400).json({ error: 'Missing required student fields' });
    }
    const [result] = await pool.query(
      `INSERT INTO students (student_code, full_name, birth_date, gender, class_id, email, phone, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [student_code.trim(), full_name.trim(), birth_date, gender || 'Nam', class_id || null, email.trim(), phone.trim(), status || 'Đang học']
    );
    logger.info('[AUDIT] Created student', { student_id: result.insertId, student_code });
    res.status(201).json({ id: result.insertId, message: 'Student created successfully' });
  } catch (err) {
    next(err);
  }
});

app.put('/api/students/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { student_code, full_name, birth_date, gender, class_id, email, phone, status } = req.body;
    await pool.query(
      `UPDATE students
       SET student_code = ?, full_name = ?, birth_date = ?, gender = ?, class_id = ?, email = ?, phone = ?, status = ?
       WHERE id = ?`,
      [student_code, full_name, birth_date, gender, class_id || null, email, phone, status, id]
    );
    logger.info('[AUDIT] Updated student', { student_id: id, student_code });
    res.json({ message: 'Student updated successfully' });
  } catch (err) {
    next(err);
  }
});

app.delete('/api/students/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM students WHERE id = ?', [id]);
    logger.info('[AUDIT] Deleted student', { student_id: id });
    res.json({ message: 'Student deleted successfully' });
  } catch (err) {
    next(err);
  }
});

app.get('/api/courses', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM courses ORDER BY course_code ASC');
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

function calculateGrade(attendance, midterm, final) {
  const total = Number((attendance * 0.1 + midterm * 0.3 + final * 0.6).toFixed(2));
  let gpa = 0.0;
  let letter = 'F';

  if (total >= 8.5) {
    gpa = 4.0;
    letter = 'A';
  } else if (total >= 8.0) {
    gpa = 3.5;
    letter = 'B+';
  } else if (total >= 7.0) {
    gpa = 3.0;
    letter = 'B';
  } else if (total >= 6.5) {
    gpa = 2.5;
    letter = 'C+';
  } else if (total >= 5.5) {
    gpa = 2.0;
    letter = 'C';
  } else if (total >= 5.0) {
    gpa = 1.5;
    letter = 'D+';
  } else if (total >= 4.0) {
    gpa = 1.0;
    letter = 'D';
  }

  return { total, gpa, letter };
}

app.get('/api/grades', async (req, res, next) => {
  try {
    const [rows] = await pool.query(`
      SELECT g.*, s.student_code, s.full_name, c.class_code, co.course_code, co.course_name, co.credits
      FROM grades g
      JOIN students s ON g.student_id = s.id
      LEFT JOIN classes c ON s.class_id = c.id
      JOIN courses co ON g.course_id = co.id
      ORDER BY g.id DESC
    `);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

app.post('/api/grades', async (req, res, next) => {
  try {
    const { student_id, course_id, attendance_score, midterm_score, final_score } = req.body;
    const att = parseFloat(attendance_score || 0);
    const mid = parseFloat(midterm_score || 0);
    const fin = parseFloat(final_score || 0);
    const { total, gpa, letter } = calculateGrade(att, mid, fin);

    const [result] = await pool.query(
      `INSERT INTO grades (student_id, course_id, attendance_score, midterm_score, final_score, total_score, gpa_score, letter_grade)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       attendance_score = VALUES(attendance_score),
       midterm_score = VALUES(midterm_score),
       final_score = VALUES(final_score),
       total_score = VALUES(total_score),
       gpa_score = VALUES(gpa_score),
       letter_grade = VALUES(letter_grade)`,
      [student_id, course_id, att, mid, fin, total, gpa, letter]
    );

    logger.info('[AUDIT] Recorded grade', { student_id, course_id, total, letter });
    res.status(201).json({ id: result.insertId, message: 'Grade recorded successfully' });
  } catch (err) {
    next(err);
  }
});

app.put('/api/grades/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { student_id, course_id, attendance_score, midterm_score, final_score } = req.body;
    const att = parseFloat(attendance_score || 0);
    const mid = parseFloat(midterm_score || 0);
    const fin = parseFloat(final_score || 0);
    const { total, gpa, letter } = calculateGrade(att, mid, fin);

    const [existing] = await pool.query('SELECT * FROM grades WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy bản ghi điểm học phần' });
    }

    const sId = student_id ? parseInt(student_id, 10) : existing[0].student_id;
    const cId = course_id ? parseInt(course_id, 10) : existing[0].course_id;

    await pool.query(
      `UPDATE grades 
       SET student_id = ?, course_id = ?, attendance_score = ?, midterm_score = ?, final_score = ?, total_score = ?, gpa_score = ?, letter_grade = ?
       WHERE id = ?`,
      [sId, cId, att, mid, fin, total, gpa, letter, id]
    );

    logger.info('[AUDIT] Updated grade record', { grade_id: id, student_id: sId, course_id: cId, total, letter, gpa });
    res.json({ message: 'Cập nhật điểm học phần thành công' });
  } catch (err) {
    next(err);
  }
});

app.delete('/api/grades/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM grades WHERE id = ?', [id]);
    logger.info('[AUDIT] Deleted grade record', { grade_id: id });
    res.json({ message: 'Grade deleted successfully' });
  } catch (err) {
    next(err);
  }
});

app.use((err, req, res, next) => {
  logger.error('Unhandled Application Error', {
    error: err.message,
    stack: err.stack,
    path: req.originalUrl
  });
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

async function startServer() {
  try {
    await testConnection();
    logger.info('Connected to MySQL database successfully');
    app.listen(port, () => {
      logger.info(`Student Management Service listening on port ${port}`);
    });
  } catch (err) {
    logger.error('Failed to initialize server connection to database', { error: err.message });
    process.exit(1);
  }
}

startServer();
