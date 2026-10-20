let currentTab = 'overview';
let cachedClasses = [];
let cachedCourses = [];
let cachedStudents = [];
let cachedGrades = [];

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatDateVN(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr).substring(0, 10);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerText = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function switchTab(tabName) {
  currentTab = tabName;
  document.querySelectorAll('.tab-panel').forEach(panel => {
    panel.classList.remove('active');
  });
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });

  const targetPanel = document.getElementById(`tab-${tabName}`);
  if (targetPanel) {
    targetPanel.classList.add('active');
  }

  const titles = {
    overview: 'Tổng quan Quản lý',
    students: 'Danh sách & Hồ sơ Sinh viên',
    classes: 'Danh mục Lớp chuyên ngành',
    grades: 'Bảng điểm & Đánh giá Học phần'
  };
  document.getElementById('page-title').innerText = titles[tabName] || 'Hệ thống Quản lý Sinh viên';

  if (tabName === 'overview') loadOverview();
  if (tabName === 'students') loadStudents();
  if (tabName === 'classes') loadClasses();
  if (tabName === 'grades') loadGrades();
}

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add('active');
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('active');
}

async function loadOverview() {
  try {
    const res = await fetch('/api/stats');
    if (!res.ok) throw new Error('Không thể tải dữ liệu thống kê');
    const data = await res.json();

    document.getElementById('stat-students').innerText = data.totalStudents;
    document.getElementById('stat-classes').innerText = data.totalClasses;
    document.getElementById('stat-courses').innerText = data.totalCourses;
    document.getElementById('stat-gpa').innerText = data.avgGPA.toFixed(2);

    const gradeContainer = document.getElementById('grade-distribution-container');
    if (data.gradeDistribution.length === 0) {
      gradeContainer.innerHTML = '<div class="empty-state">Chưa có dữ liệu điểm</div>';
    } else {
      const maxCount = Math.max(...data.gradeDistribution.map(d => d.count), 1);
      gradeContainer.innerHTML = data.gradeDistribution.map(item => `
        <div class="stat-bar-row">
          <div class="stat-bar-header">
            <span>Điểm ${escapeHtml(item.letter_grade)}</span>
            <strong>${item.count} sinh viên</strong>
          </div>
          <div class="stat-bar-track">
            <div class="stat-bar-fill" style="width: ${(item.count / maxCount) * 100}%;"></div>
          </div>
        </div>
      `).join('');
    }

    const statusContainer = document.getElementById('status-distribution-container');
    if (data.statusDistribution.length === 0) {
      statusContainer.innerHTML = '<div class="empty-state">Chưa có dữ liệu trạng thái</div>';
    } else {
      statusContainer.innerHTML = data.statusDistribution.map(item => `
        <div class="stat-bar-row">
          <div class="stat-bar-header">
            <span>${escapeHtml(item.status)}</span>
            <strong>${item.count}</strong>
          </div>
          <div class="stat-bar-track">
            <div class="stat-bar-fill" style="width: ${(item.count / (data.totalStudents || 1)) * 100}%; background-color: ${item.status === 'Đang học' ? '#10b981' : item.status === 'Bảo lưu' ? '#f59e0b' : '#3b82f6'};"></div>
          </div>
        </div>
      `).join('');
    }

    const studentsRes = await fetch('/api/students');
    const students = await studentsRes.json();
    const previewList = students.slice(0, 5);
    const tbody = document.getElementById('overview-students-tbody');
    if (previewList.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center">Chưa có sinh viên nào.</td></tr>';
    } else {
      tbody.innerHTML = previewList.map(s => `
        <tr>
          <td><strong>${escapeHtml(s.student_code)}</strong></td>
          <td>${escapeHtml(s.full_name)}</td>
          <td>${escapeHtml(s.class_code || 'Chưa phân')}</td>
          <td>${escapeHtml(s.email)}</td>
          <td>${renderStatusBadge(s.status)}</td>
          <td><strong>${s.gpa !== null ? s.gpa : '-'}</strong></td>
        </tr>
      `).join('');
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function renderStatusBadge(status) {
  if (status === 'Đang học') return `<span class="badge badge-active">${escapeHtml(status)}</span>`;
  if (status === 'Bảo lưu') return `<span class="badge badge-reserved">${escapeHtml(status)}</span>`;
  return `<span class="badge badge-graduated">${escapeHtml(status)}</span>`;
}

function renderGradeBadge(letter) {
  const map = {
    'A': 'badge-grade-a',
    'B+': 'badge-grade-b',
    'B': 'badge-grade-b',
    'C+': 'badge-grade-c',
    'C': 'badge-grade-c',
    'D+': 'badge-grade-d',
    'D': 'badge-grade-d',
    'F': 'badge-grade-f'
  };
  const cls = map[letter] || 'badge-grade-c';
  return `<span class="badge badge-grade ${cls}">${escapeHtml(letter)}</span>`;
}

async function loadStudents() {
  try {
    const q = document.getElementById('student-search-input').value;
    const classId = document.getElementById('student-filter-class').value;
    const status = document.getElementById('student-filter-status').value;

    const params = new URLSearchParams();
    if (q) params.append('q', q);
    if (classId) params.append('class_id', classId);
    if (status) params.append('status', status);

    const res = await fetch(`/api/students?${params.toString()}`);
    if (!res.ok) throw new Error('Không thể tải danh sách sinh viên');
    cachedStudents = await res.json();

    const tbody = document.getElementById('students-table-body');
    if (cachedStudents.length === 0) {
      tbody.innerHTML = '<tr><td colspan="10" class="text-center">Không tìm thấy sinh viên phù hợp.</td></tr>';
      return;
    }

    tbody.innerHTML = cachedStudents.map(s => `
      <tr>
        <td><strong>${escapeHtml(s.student_code)}</strong></td>
        <td>${escapeHtml(s.full_name)}</td>
        <td>${escapeHtml(formatDateVN(s.birth_date))}</td>
        <td>${escapeHtml(s.gender)}</td>
        <td>${escapeHtml(s.class_name || s.class_code || 'Chưa gán')}</td>
        <td>${escapeHtml(s.email)}</td>
        <td>${escapeHtml(s.phone)}</td>
        <td><strong>${s.gpa !== null ? s.gpa : '-'}</strong></td>
        <td>${renderStatusBadge(s.status)}</td>
        <td class="text-right">
          <div class="action-buttons">
            <button class="btn btn-secondary btn-sm" onclick="editStudent(${s.id})">Sửa</button>
            <button class="btn btn-danger btn-sm" onclick="deleteStudent(${s.id}, '${escapeHtml(s.full_name)}')">Xóa</button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function loadClasses() {
  try {
    const res = await fetch('/api/classes');
    if (!res.ok) throw new Error('Không thể tải danh sách lớp học');
    cachedClasses = await res.json();

    const selectFilter = document.getElementById('student-filter-class');
    const selectForm = document.getElementById('student-class');
    const optionsHtml = '<option value="">-- Chọn Lớp học --</option>' +
      cachedClasses.map(c => `<option value="${c.id}">${escapeHtml(c.class_code)} - ${escapeHtml(c.class_name)}</option>`).join('');
    
    if (selectFilter) {
      const curVal = selectFilter.value;
      selectFilter.innerHTML = '<option value="">-- Tất cả Lớp học --</option>' +
        cachedClasses.map(c => `<option value="${c.id}">${escapeHtml(c.class_code)}</option>`).join('');
      selectFilter.value = curVal;
    }
    if (selectForm) {
      selectForm.innerHTML = optionsHtml;
    }

    const tbody = document.getElementById('classes-table-body');
    if (!tbody) return;
    if (cachedClasses.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center">Chưa có lớp học nào.</td></tr>';
      return;
    }

    tbody.innerHTML = cachedClasses.map(c => `
      <tr>
        <td><strong>${escapeHtml(c.class_code)}</strong></td>
        <td>${escapeHtml(c.class_name)}</td>
        <td>${escapeHtml(c.faculty)}</td>
        <td>${escapeHtml(c.academic_year)}</td>
        <td><strong>${c.current_students || 0}</strong> / ${c.max_students}</td>
        <td class="text-right">
          <div class="action-buttons">
            <button class="btn btn-secondary btn-sm" onclick="editClass(${c.id})">Sửa</button>
            <button class="btn btn-danger btn-sm" onclick="deleteClass(${c.id}, '${escapeHtml(c.class_code)}')">Xóa</button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function loadGrades() {
  try {
    const [gradesRes, coursesRes] = await Promise.all([
      fetch('/api/grades'),
      fetch('/api/courses')
    ]);
    const grades = await gradesRes.json();
    cachedGrades = grades;
    cachedCourses = await coursesRes.json();

    const courseSelect = document.getElementById('grade-course-select');
    if (courseSelect) {
      courseSelect.innerHTML = '<option value="">-- Chọn Môn học --</option>' +
        cachedCourses.map(co => `<option value="${co.id}">${escapeHtml(co.course_code)} - ${escapeHtml(co.course_name)} (${co.credits} tín chỉ)</option>`).join('');
    }

    const studentSelect = document.getElementById('grade-student-select');
    if (studentSelect) {
      if (cachedStudents.length === 0) {
        const sRes = await fetch('/api/students');
        cachedStudents = await sRes.json();
      }
      studentSelect.innerHTML = '<option value="">-- Chọn Sinh viên --</option>' +
        cachedStudents.map(s => `<option value="${s.id}">${escapeHtml(s.student_code)} - ${escapeHtml(s.full_name)}</option>`).join('');
    }

    const tbody = document.getElementById('grades-table-body');
    if (grades.length === 0) {
      tbody.innerHTML = '<tr><td colspan="12" class="text-center">Chưa có kết quả điểm học phần nào.</td></tr>';
      return;
    }

    tbody.innerHTML = grades.map(g => `
      <tr>
        <td><strong>${escapeHtml(g.student_code)}</strong></td>
        <td>${escapeHtml(g.full_name)}</td>
        <td>${escapeHtml(g.class_code || '-')}</td>
        <td>${escapeHtml(g.course_name)} (${escapeHtml(g.course_code)})</td>
        <td>${g.credits}</td>
        <td>${Number(g.attendance_score).toFixed(1)}</td>
        <td>${Number(g.midterm_score).toFixed(1)}</td>
        <td>${Number(g.final_score).toFixed(1)}</td>
        <td><strong>${Number(g.total_score).toFixed(2)}</strong></td>
        <td>${renderGradeBadge(g.letter_grade)}</td>
        <td><strong>${Number(g.gpa_score).toFixed(2)}</strong></td>
        <td class="text-right">
          <button class="btn btn-secondary btn-sm" onclick="editGrade(${g.id})">Sửa</button>
          <button class="btn btn-danger btn-sm" onclick="deleteGrade(${g.id})">Xóa</button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function editStudent(id) {
  const student = cachedStudents.find(s => s.id === id);
  if (!student) return;
  document.getElementById('student-modal-title').innerText = 'Cập nhật Thông tin Sinh viên';
  document.getElementById('student-form-id').value = student.id;
  document.getElementById('student-code').value = student.student_code;
  document.getElementById('student-name').value = student.full_name;
  document.getElementById('student-birth').value = student.birth_date ? student.birth_date.substring(0, 10) : '';
  document.getElementById('student-gender').value = student.gender;
  document.getElementById('student-class').value = student.class_id || '';
  document.getElementById('student-status').value = student.status;
  document.getElementById('student-email').value = student.email;
  document.getElementById('student-phone').value = student.phone;
  openModal('student-modal');
}

async function deleteStudent(id, name) {
  if (!confirm(`Bạn có chắc chắn muốn xóa sinh viên "${name}" khỏi hệ thống?`)) return;
  try {
    const res = await fetch(`/api/students/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Không thể xóa sinh viên');
    showToast(`Đã xóa sinh viên ${name}`, 'success');
    loadStudents();
    loadOverview();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function editClass(id) {
  const cls = cachedClasses.find(c => c.id === id);
  if (!cls) return;
  document.getElementById('class-modal-title').innerText = 'Cập nhật Lớp học';
  document.getElementById('class-form-id').value = cls.id;
  document.getElementById('class-code').value = cls.class_code;
  document.getElementById('class-name').value = cls.class_name;
  document.getElementById('class-faculty').value = cls.faculty;
  document.getElementById('class-year').value = cls.academic_year;
  document.getElementById('class-max').value = cls.max_students;
  openModal('class-modal');
}

async function deleteClass(id, code) {
  if (!confirm(`Bạn có chắc chắn muốn xóa lớp "${code}"?`)) return;
  try {
    const res = await fetch(`/api/classes/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Không thể xóa lớp học');
    showToast(`Đã xóa lớp ${code}`, 'success');
    loadClasses();
    loadOverview();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deleteGrade(id) {
  if (!confirm('Bạn có chắc chắn muốn xóa bản ghi điểm này?')) return;
  try {
    const res = await fetch(`/api/grades/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Không thể xóa bản ghi điểm');
    showToast('Đã xóa bản ghi điểm', 'success');
    loadGrades();
    loadOverview();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function editGrade(id) {
  const g = cachedGrades.find(x => x.id === id);
  if (!g) return;
  const titleEl = document.getElementById('grade-modal-title');
  if (titleEl) titleEl.innerText = 'Cập nhật Điểm Học phần';
  const idEl = document.getElementById('grade-form-id');
  if (idEl) idEl.value = g.id;
  
  const studentSelect = document.getElementById('grade-student-select');
  if (studentSelect) studentSelect.value = g.student_id;
  
  const courseSelect = document.getElementById('grade-course-select');
  if (courseSelect) courseSelect.value = g.course_id;
  
  document.getElementById('grade-att').value = g.attendance_score;
  document.getElementById('grade-mid').value = g.midterm_score;
  document.getElementById('grade-fin').value = g.final_score;
  
  updateGradePreview();
  openModal('grade-modal');
}

function updateGradePreview() {
  const att = parseFloat(document.getElementById('grade-att').value) || 0;
  const mid = parseFloat(document.getElementById('grade-mid').value) || 0;
  const fin = parseFloat(document.getElementById('grade-fin').value) || 0;

  const total = Number((att * 0.1 + mid * 0.3 + fin * 0.6).toFixed(2));
  let gpa = 0.0;
  let letter = 'F';

  if (total >= 8.5) { gpa = 4.0; letter = 'A'; }
  else if (total >= 8.0) { gpa = 3.5; letter = 'B+'; }
  else if (total >= 7.0) { gpa = 3.0; letter = 'B'; }
  else if (total >= 6.5) { gpa = 2.5; letter = 'C+'; }
  else if (total >= 5.5) { gpa = 2.0; letter = 'C'; }
  else if (total >= 5.0) { gpa = 1.5; letter = 'D+'; }
  else if (total >= 4.0) { gpa = 1.0; letter = 'D'; }

  document.getElementById('preview-total').innerText = total.toFixed(2);
  document.getElementById('preview-letter').innerText = letter;
  document.getElementById('preview-gpa').innerText = gpa.toFixed(2);
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  const searchBtn = document.getElementById('student-search-btn');
  if (searchBtn) searchBtn.addEventListener('click', loadStudents);

  const searchInput = document.getElementById('student-search-input');
  if (searchInput) {
    searchInput.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') loadStudents();
    });
  }

  const filterClass = document.getElementById('student-filter-class');
  if (filterClass) filterClass.addEventListener('change', loadStudents);

  const filterStatus = document.getElementById('student-filter-status');
  if (filterStatus) filterStatus.addEventListener('change', loadStudents);

  const openAddStudentBtn = document.getElementById('open-add-student-modal-btn');
  if (openAddStudentBtn) {
    openAddStudentBtn.addEventListener('click', () => {
      document.getElementById('student-modal-title').innerText = 'Thêm Sinh viên Mới';
      document.getElementById('student-form').reset();
      document.getElementById('student-form-id').value = '';
      openModal('student-modal');
    });
  }

  const openAddClassBtn = document.getElementById('open-add-class-modal-btn');
  if (openAddClassBtn) {
    openAddClassBtn.addEventListener('click', () => {
      document.getElementById('class-modal-title').innerText = 'Thêm Lớp học Mới';
      document.getElementById('class-form').reset();
      document.getElementById('class-form-id').value = '';
      openModal('class-modal');
    });
  }

  const openAddGradeBtn = document.getElementById('open-add-grade-modal-btn');
  if (openAddGradeBtn) {
    openAddGradeBtn.addEventListener('click', () => {
      const titleEl = document.getElementById('grade-modal-title');
      if (titleEl) titleEl.innerText = 'Nhập Điểm Học phần cho Sinh viên';
      const idEl = document.getElementById('grade-form-id');
      if (idEl) idEl.value = '';
      document.getElementById('grade-form').reset();
      updateGradePreview();
      openModal('grade-modal');
    });
  }

  ['grade-att', 'grade-mid', 'grade-fin'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', updateGradePreview);
  });

  const studentForm = document.getElementById('student-form');
  if (studentForm) {
    studentForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('student-form-id').value;
      const payload = {
        student_code: document.getElementById('student-code').value.trim(),
        full_name: document.getElementById('student-name').value.trim(),
        birth_date: document.getElementById('student-birth').value,
        gender: document.getElementById('student-gender').value,
        class_id: document.getElementById('student-class').value || null,
        status: document.getElementById('student-status').value,
        email: document.getElementById('student-email').value.trim(),
        phone: document.getElementById('student-phone').value.trim()
      };

      try {
        const method = id ? 'PUT' : 'POST';
        const url = id ? `/api/students/${id}` : '/api/students';
        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Thao tác thất bại');
        }
        showToast(id ? 'Cập nhật sinh viên thành công' : 'Thêm sinh viên mới thành công', 'success');
        closeModal('student-modal');
        loadStudents();
        loadOverview();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

  const classForm = document.getElementById('class-form');
  if (classForm) {
    classForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('class-form-id').value;
      const payload = {
        class_code: document.getElementById('class-code').value.trim(),
        class_name: document.getElementById('class-name').value.trim(),
        faculty: document.getElementById('class-faculty').value.trim(),
        academic_year: document.getElementById('class-year').value.trim(),
        max_students: parseInt(document.getElementById('class-max').value, 10) || 50
      };

      try {
        const method = id ? 'PUT' : 'POST';
        const url = id ? `/api/classes/${id}` : '/api/classes';
        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Thao tác thất bại');
        }
        showToast(id ? 'Cập nhật lớp thành công' : 'Thêm lớp mới thành công', 'success');
        closeModal('class-modal');
        loadClasses();
        loadOverview();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

  const gradeForm = document.getElementById('grade-form');
  if (gradeForm) {
    gradeForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('grade-form-id').value;
      const payload = {
        student_id: parseInt(document.getElementById('grade-student-select').value, 10),
        course_id: parseInt(document.getElementById('grade-course-select').value, 10),
        attendance_score: parseFloat(document.getElementById('grade-att').value),
        midterm_score: parseFloat(document.getElementById('grade-mid').value),
        final_score: parseFloat(document.getElementById('grade-fin').value)
      };

      try {
        const method = id ? 'PUT' : 'POST';
        const url = id ? `/api/grades/${id}` : '/api/grades';
        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Thao tác lưu điểm thất bại');
        }
        showToast(id ? 'Cập nhật điểm học phần thành công' : 'Đã lưu kết quả học phần thành công', 'success');
        closeModal('grade-modal');
        loadGrades();
        loadOverview();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

  loadClasses();
  loadOverview();
});
