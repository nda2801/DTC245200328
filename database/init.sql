SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

CREATE DATABASE IF NOT EXISTS student_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE student_db;

CREATE TABLE IF NOT EXISTS classes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_code VARCHAR(20) NOT NULL UNIQUE,
    class_name VARCHAR(100) NOT NULL,
    faculty VARCHAR(100) NOT NULL,
    academic_year VARCHAR(20) NOT NULL,
    max_students INT DEFAULT 50,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_code VARCHAR(20) NOT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    birth_date DATE NOT NULL,
    gender ENUM('Nam', 'Nữ') NOT NULL DEFAULT 'Nam',
    class_id INT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'Đang học',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_students_class FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_code VARCHAR(20) NOT NULL UNIQUE,
    course_name VARCHAR(100) NOT NULL,
    credits INT NOT NULL DEFAULT 3,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS grades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    course_id INT NOT NULL,
    attendance_score DECIMAL(4,2) NOT NULL DEFAULT 0.00,
    midterm_score DECIMAL(4,2) NOT NULL DEFAULT 0.00,
    final_score DECIMAL(4,2) NOT NULL DEFAULT 0.00,
    total_score DECIMAL(4,2) NOT NULL DEFAULT 0.00,
    gpa_score DECIMAL(3,2) NOT NULL DEFAULT 0.00,
    letter_grade VARCHAR(3) NOT NULL DEFAULT 'F',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_grades_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    CONSTRAINT fk_grades_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    CONSTRAINT uq_student_course UNIQUE (student_id, course_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_student_code ON students(student_code);
CREATE INDEX idx_student_class ON students(class_id);
CREATE INDEX idx_grades_student ON grades(student_id);

INSERT INTO classes (class_code, class_name, faculty, academic_year, max_students) VALUES
('CNTT-K23B', 'Công nghệ Thông tin K23B', 'Công nghệ Thông tin', '2024-2028', 45),
('CNTT-K23A', 'Công nghệ Thông tin K23A', 'Công nghệ Thông tin', '2024-2028', 45),
('ATTT-K23', 'An toàn Thông tin K23', 'Công nghệ Thông tin', '2024-2028', 40),
('DTVT-K23', 'Kỹ thuật Điện tử Viễn thông K23', 'Điện tử Viễn thông', '2024-2028', 40)
ON DUPLICATE KEY UPDATE class_name=VALUES(class_name);

INSERT INTO courses (course_code, course_name, credits) VALUES
('INT3101', 'Triển khai & Quản trị Hệ thống Phần mềm', 3),
('INT3102', 'Lập trình Web Nâng cao', 3),
('INT3103', 'Hệ Quản trị Cơ sở Dữ liệu Phân tán', 3),
('INT3104', 'An toàn và Bảo mật Hệ thống Thông tin', 3),
('INT3105', 'Kiến trúc Hướng Dịch vụ & Cloud Native', 3)
ON DUPLICATE KEY UPDATE course_name=VALUES(course_name);

INSERT INTO students (student_code, full_name, birth_date, gender, class_id, email, phone, status) VALUES
('DTC245200328', 'Nguyễn Đức Anh', '2004-03-15', 'Nam', 1, 'dtc245200328@ictu.edu.vn', '0912345678', 'Đang học'),
('DTC245200301', 'Trần Thị Thu Trang', '2004-05-20', 'Nữ', 1, 'thutrang.cntt@ictu.edu.vn', '0987654321', 'Đang học'),
('DTC245200302', 'Lê Hoàng Nam', '2003-11-08', 'Nam', 1, 'hoangnam.le@ictu.edu.vn', '0934567890', 'Đang học'),
('DTC245200303', 'Phạm Quỳnh Nga', '2004-08-12', 'Nữ', 2, 'quynhnga.pham@ictu.edu.vn', '0945678901', 'Đang học'),
('DTC245200304', 'Vũ Đức Thịnh', '2004-01-25', 'Nam', 2, 'ducthinh.vu@ictu.edu.vn', '0967890123', 'Đang học'),
('DTC245200305', 'Đỗ Mai Anh', '2004-09-30', 'Nữ', 2, 'maianh.do@ictu.edu.vn', '0978901234', 'Đang học'),
('DTC245200306', 'Hoàng Tuấn Kiệt', '2003-07-14', 'Nam', 3, 'tuankiet.hoang@ictu.edu.vn', '0911223344', 'Đang học'),
('DTC245200307', 'Ngô Bảo Châu', '2004-12-05', 'Nữ', 3, 'baochau.ngo@ictu.edu.vn', '0922334455', 'Đang học'),
('DTC245200308', 'Bùi Văn Hùng', '2003-04-18', 'Nam', 3, 'vanhung.bui@ictu.edu.vn', '0933445566', 'Bảo lưu'),
('DTC245200309', 'Đặng Thùy Dương', '2004-02-28', 'Nữ', 4, 'thuyduong.dang@ictu.edu.vn', '0944556677', 'Đang học'),
('DTC245200310', 'Dương Quốc Huy', '2003-10-10', 'Nam', 4, 'quochuy.duong@ictu.edu.vn', '0955667788', 'Tốt nghiệp')
ON DUPLICATE KEY UPDATE full_name=VALUES(full_name);

INSERT INTO grades (student_id, course_id, attendance_score, midterm_score, final_score, total_score, gpa_score, letter_grade) VALUES
(1, 1, 9.5, 9.0, 9.5, 9.35, 4.0, 'A'),
(1, 2, 9.0, 8.5, 9.0, 8.85, 3.8, 'A'),
(1, 3, 8.5, 9.0, 8.5, 8.65, 3.7, 'A'),
(2, 1, 8.5, 8.0, 8.5, 8.35, 3.5, 'B+'),
(2, 2, 8.0, 7.5, 8.0, 7.85, 3.0, 'B'),
(3, 1, 7.0, 7.5, 7.0, 7.15, 2.5, 'C+'),
(3, 3, 8.0, 8.0, 8.5, 8.30, 3.5, 'B+'),
(4, 2, 9.0, 9.0, 9.0, 9.00, 4.0, 'A'),
(5, 1, 6.5, 7.0, 6.5, 6.65, 2.0, 'C'),
(6, 2, 8.5, 8.5, 9.0, 8.80, 3.8, 'A'),
(7, 4, 9.0, 9.5, 9.0, 9.15, 4.0, 'A'),
(8, 4, 8.0, 8.0, 8.0, 8.00, 3.5, 'B+'),
(9, 4, 5.0, 5.5, 5.0, 5.15, 1.5, 'D+'),
(10, 5, 8.5, 8.0, 8.5, 8.35, 3.5, 'B+')
ON DUPLICATE KEY UPDATE total_score=VALUES(total_score);

CREATE USER IF NOT EXISTS 'student_user'@'%' IDENTIFIED BY 'StudentSecurePass2026!';
GRANT SELECT, INSERT, UPDATE, DELETE ON student_db.* TO 'student_user'@'%';
FLUSH PRIVILEGES;
