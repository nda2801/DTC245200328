# HỆ THỐNG QUẢN LÝ SINH VIÊN - ĐỀ TÀI 2
**Môn học**: Triển khai và Quản trị Hệ thống Phần mềm  
**Cơ sở đào tạo**: Trường Đại học Công nghệ Thông tin và Truyền thông - ICTU  
**Sinh viên thực hiện**: Nguyễn Đức Anh (MSSV: DTC245200328 - Lớp: CNTT - K23B)  
**Năm thực hiện**: 2026  

---

## 1. Giới thiệu Tổng quan
Dự án triển khai một hệ thống quản lý sinh viên toàn diện theo kiến trúc Microservices container hóa với Docker Compose, kết hợp cổng Reverse Proxy bảo mật, giám sát hiệu năng thời gian thực và quản lý nhật ký (log) tập trung.

### Các thành phần chính của hệ thống:
1. **Ứng dụng Web (student_webapp)**: Xây dựng bằng Node.js / Express, giao diện Enterprise Dashboard phục vụ đầy đủ nghiệp vụ CRUD Sinh viên, Lớp học, Điểm số và thống kê học tập.
2. **Cơ sở dữ liệu (student_mysql)**: MySQL 8.0 lưu trữ quan hệ với charset UTF8MB4, thiết kế chuẩn 3NF, phân quyền người dùng ứng dụng riêng biệt.
3. **Công cụ quản trị Database (phpmyadmin)**: phpMyAdmin kết nối an toàn trong mạng nội bộ, truy cập qua URL Reverse Proxy `/pma/`.
4. **Reverse Proxy (nginx_proxy)**: Nginx đóng vai trò Ingress Gateway, hỗ trợ HTTPS (SSL tự ký) với bộ Security Headers chống tấn công Web phổ biến.
5. **Hệ thống Giám sát (Prometheus & Grafana)**: Thu thập metrics từ ứng dụng, tài nguyên container (cAdvisor) và cơ sở dữ liệu (mysqld_exporter), trực quan hóa qua Grafana Dashboard.
6. **Hệ thống Log tập trung (Loki & Promtail)**: Tự động thu thập log container và phân tích truy vấn qua ngôn ngữ LogQL.
7. **Hạ tầng Hardening**: Ứng dụng chạy dưới quyền non-root (UID 10001), phân tách mạng Docker 3 tầng (`frontend_net`, `backend_net`, `monitoring_net`), cơ chế bảo mật biến môi trường `.env`.

---

## 2. Yêu cầu Tiên quyết
- **Docker Engine**: Phiên bản 24.0+ hoặc Docker Desktop mới nhất.
- **Docker Compose**: Phiên bản v2.20+.
- **Trình duyệt Web**: Chrome, Edge, Firefox hoặc Safari.

---

## 3. Hướng dẫn Cài đặt & Khởi chạy Hệ thống

### Bước 1: Sao chép tệp cấu hình môi trường
```bash
cp .env.example .env
```
*(Tùy chỉnh các mật khẩu và thông số nếu cần thiết).*

### Bước 2: Khởi chạy toàn bộ hệ thống bằng Docker Compose
```bash
docker compose up -d --build
```

### Bước 3: Kiểm tra trạng thái hoạt động của các dịch vụ
```bash
docker compose ps
```
Đảm bảo tất cả 10 container đều ở trạng thái `running` (healthy).

---

## 4. Danh mục Cổng & Đường dẫn Truy cập

| Dịch vụ | Đường dẫn / Cổng | Thông tin Đăng nhập Mặc định | Chức năng |
| :--- | :--- | :--- | :--- |
| **Website Quản lý Sinh viên** | `https://localhost/` hoặc `http://localhost/` | Trực tiếp | Giao diện CRUD Sinh viên, Lớp, Điểm |
| **Quản trị phpMyAdmin** | `https://localhost/pma/` | User: `student_user`<br>Pass: `StudentSecurePass2026!` | Quản trị giao diện MySQL |
| **Grafana Dashboard** | `http://localhost:3001` | User: `admin`<br>Pass: `AdminSecurePass2026!` | Giám sát CPU/RAM, Web, DB |
| **Prometheus Server** | `http://localhost:9090` | Trực tiếp | Tra cứu trạng thái Targets & Raw Metrics |
| **Metrics Ứng dụng** | `https://localhost/metrics` | Trực tiếp | Dữ liệu Prometheus định dạng text |
| **Loki Log Engine** | `http://localhost:3100/ready` | Trực tiếp | API kiểm tra trạng thái Loki ready |

> **Lưu ý về SSL Tự ký**: Khi truy cập qua trình duyệt lần đầu tại `https://localhost`, trình duyệt sẽ hiển thị cảnh báo chứng chỉ tự ký. Chọn **Nâng cao (Advanced)** &rarr; **Tiếp tục truy cập localhost (Proceed to localhost)**.

---

## 5. Tiến độ Quản lý Mã nguồn (Commit Milestones)
Kho mã nguồn tuân thủ nghiêm ngặt tiến trình triển khai theo rubric chấm thi:
- **Commit 1**: Triển khai Nginx reverse proxy (SSL tự ký + Security Headers), Ứng dụng Web, MySQL và phpMyAdmin.
- **Commit 2**: Tích hợp hệ thống giám sát Prometheus + Grafana (Container, Web server, Database).
- **Commit 3**: Tích hợp hệ thống Log tập trung Loki + Promtail và xác thực 3 truy vấn LogQL.
