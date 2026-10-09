-- =======================================================
-- FILE KHỞI TẠO CƠ SỞ DỮ LIỆU: student_management
-- Đề tài 2: Hệ thống Quản lý Sinh viên
-- Môn học: Triển khai và Quản trị Hệ thống Phần mềm
-- =======================================================

CREATE DATABASE IF NOT EXISTS `student_management`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `student_management`;

-- 1. Bảng Lớp học (classes)
CREATE TABLE IF NOT EXISTS `classes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `class_code` VARCHAR(20) NOT NULL UNIQUE,
  `class_name` VARCHAR(100) NOT NULL,
  `faculty` VARCHAR(100) NOT NULL,
  `academic_year` VARCHAR(20) DEFAULT '2023-2027',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Bảng Sinh viên (students)
CREATE TABLE IF NOT EXISTS `students` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `student_code` VARCHAR(20) NOT NULL UNIQUE,
  `full_name` VARCHAR(100) NOT NULL,
  `dob` DATE NOT NULL,
  `gender` ENUM('Nam', 'Nữ', 'Khác') DEFAULT 'Nam',
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `phone` VARCHAR(15),
  `class_id` INT,
  `status` ENUM('Đang học', 'Bảo lưu', 'Tốt nghiệp', 'Đình chỉ') DEFAULT 'Đang học',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Bảng Môn học (subjects)
CREATE TABLE IF NOT EXISTS `subjects` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `subject_code` VARCHAR(20) NOT NULL UNIQUE,
  `subject_name` VARCHAR(100) NOT NULL,
  `credits` INT NOT NULL DEFAULT 3,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Bảng Điểm số (grades)
CREATE TABLE IF NOT EXISTS `grades` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `student_id` INT NOT NULL,
  `subject_id` INT NOT NULL,
  `attendance_score` DECIMAL(4,2) DEFAULT 0.00,
  `midterm_score` DECIMAL(4,2) DEFAULT 0.00,
  `final_score` DECIMAL(4,2) DEFAULT 0.00,
  `average_score` DECIMAL(4,2) GENERATED ALWAYS AS (ROUND((attendance_score * 0.1) + (midterm_score * 0.3) + (final_score * 0.6), 2)) STORED,
  `letter_grade` VARCHAR(5) DEFAULT 'F',
  `semester` VARCHAR(20) DEFAULT 'Học kỳ 1 - 2026',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_student_subject` (`student_id`, `subject_id`, `semester`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Trigger tự động cập nhật điểm chữ
DELIMITER //
CREATE TRIGGER before_grade_insert_update
BEFORE INSERT ON `grades`
FOR EACH ROW
BEGIN
  DECLARE avg_val DECIMAL(4,2);
  SET avg_val = (NEW.attendance_score * 0.1) + (NEW.midterm_score * 0.3) + (NEW.final_score * 0.6);
  IF avg_val >= 8.5 THEN
    SET NEW.letter_grade = 'A';
  ELSEIF avg_val >= 7.0 THEN
    SET NEW.letter_grade = 'B';
  ELSEIF avg_val >= 5.5 THEN
    SET NEW.letter_grade = 'C';
  ELSEIF avg_val >= 4.0 THEN
    SET NEW.letter_grade = 'D';
  ELSE
    SET NEW.letter_grade = 'F';
  END IF;
END//

CREATE TRIGGER before_grade_update
BEFORE UPDATE ON `grades`
FOR EACH ROW
BEGIN
  DECLARE avg_val DECIMAL(4,2);
  SET avg_val = (NEW.attendance_score * 0.1) + (NEW.midterm_score * 0.3) + (NEW.final_score * 0.6);
  IF avg_val >= 8.5 THEN
    SET NEW.letter_grade = 'A';
  ELSEIF avg_val >= 7.0 THEN
    SET NEW.letter_grade = 'B';
  ELSEIF avg_val >= 5.5 THEN
    SET NEW.letter_grade = 'C';
  ELSEIF avg_val >= 4.0 THEN
    SET NEW.letter_grade = 'D';
  ELSE
    SET NEW.letter_grade = 'F';
  END IF;
END//
DELIMITER ;

-- =======================================================
-- CHÈN DỮ LIỆU MẪU (SEED DATA)
-- =======================================================

-- 1. Lớp học mẫu
INSERT INTO `classes` (`class_code`, `class_name`, `faculty`, `academic_year`) VALUES
('CNTT-K23B', 'Công nghệ Thông tin K23B', 'Khoa Công nghệ Thông tin', '2023-2027'),
('KTPM-K23B', 'Kỹ thuật Phần mềm K23B', 'Khoa Công nghệ Thông tin', '2023-2027'),
('HTTT-K23A', 'Hệ thống Thông tin K23A', 'Khoa Hệ thống Thông tin', '2023-2027'),
('ATTT-K23A', 'An toàn Thông tin K23A', 'Khoa An toàn Thông tin', '2023-2027');

-- 2. Môn học mẫu
INSERT INTO `subjects` (`subject_code`, `subject_name`, `credits`) VALUES
('TKQT2026', 'Triển khai và Quản trị Hệ thống Phần mềm', 3),
('LTW2024', 'Lập trình Web nâng cao', 3),
('CSDL101', 'Hệ Quản trị Cơ sở Dữ liệu', 3),
('MMT2023', 'Mạng máy tính và An ninh mạng', 3),
('KTPM301', 'Kiến trúc và Thiết kế Phần mềm', 4);

-- 3. Sinh viên mẫu
INSERT INTO `students` (`student_code`, `full_name`, `dob`, `gender`, `email`, `phone`, `class_id`, `status`) VALUES
('DTC245200328', 'Nguyễn Đức Anh', '2006-01-28', 'Nam', 'dtc245200328@ictu.edu.vn', '0373704050', 1, 'Đang học'),
('DTC245200329', 'Trần Thị Bình', '2005-08-25', 'Nữ', 'binh.tran@student.edu.vn', '0923456789', 1, 'Đang học'),
('DTC245200330', 'Lê Hoàng Cường', '2005-01-15', 'Nam', 'cuong.le@student.edu.vn', '0934567890', 2, 'Đang học'),
('DTC245200331', 'Phạm Minh Đức', '2004-11-30', 'Nam', 'duc.pham@student.edu.vn', '0945678901', 2, 'Đang học'),
('DTC245200332', 'Vũ Thị Hoa', '2005-06-18', 'Nữ', 'hoa.vu@student.edu.vn', '0956789012', 3, 'Đang học'),
('DTC245200333', 'Đặng Quốc Huy', '2005-09-09', 'Nam', 'huy.dang@student.edu.vn', '0967890123', 3, 'Đang học'),
('DTC245200334', 'Hoàng Ngọc Lan', '2005-03-22', 'Nữ', 'lan.hoang@student.edu.vn', '0978901234', 4, 'Đang học'),
('DTC245200335', 'Bùi Anh Tuấn', '2005-12-05', 'Nam', 'tuan.bui@student.edu.vn', '0989012345', 4, 'Đang học');

-- 4. Điểm số mẫu
INSERT INTO `grades` (`student_id`, `subject_id`, `attendance_score`, `midterm_score`, `final_score`, `letter_grade`, `semester`) VALUES
(1, 1, 9.5, 9.0, 9.0, 'A', 'Học kỳ 1 - 2026'),
(1, 2, 8.5, 8.0, 8.5, 'A', 'Học kỳ 1 - 2026'),
(1, 3, 9.0, 7.5, 8.0, 'B', 'Học kỳ 1 - 2026'),
(2, 1, 8.0, 8.5, 8.0, 'B', 'Học kỳ 1 - 2026'),
(2, 2, 9.0, 9.5, 9.0, 'A', 'Học kỳ 1 - 2026'),
(3, 1, 7.0, 6.5, 7.0, 'C', 'Học kỳ 1 - 2026'),
(3, 4, 8.5, 8.0, 7.5, 'B', 'Học kỳ 1 - 2026'),
(4, 1, 9.0, 8.5, 9.0, 'A', 'Học kỳ 1 - 2026'),
(5, 3, 8.0, 7.0, 6.5, 'C', 'Học kỳ 1 - 2026'),
(6, 1, 6.5, 5.0, 5.5, 'D', 'Học kỳ 1 - 2026'),
(7, 4, 9.5, 9.0, 9.5, 'A', 'Học kỳ 1 - 2026'),
(8, 1, 8.5, 8.0, 8.0, 'B', 'Học kỳ 1 - 2026');

-- =======================================================
-- BẢO MẬT & PHÂN QUYỀN (PRINCIPLE OF LEAST PRIVILEGE)
-- Tạo user dành riêng cho ứng dụng web, không dùng root
-- =======================================================
CREATE USER IF NOT EXISTS 'student_user'@'%' IDENTIFIED BY 'StudentAppSecurePass2026!';
GRANT SELECT, INSERT, UPDATE, DELETE ON `student_management`.* TO 'student_user'@'%';
FLUSH PRIVILEGES;
