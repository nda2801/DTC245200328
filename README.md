# HỆ THỐNG QUẢN LÝ SINH VIÊN (STUDENT MANAGEMENT SYSTEM)

[![Docker Compose](https://img.shields.io/badge/Orchestration-Docker_Compose-blue?logo=docker)](https://docs.docker.com/compose/)
[![Nginx](https://img.shields.io/badge/Reverse_Proxy-Nginx_SSL-green?logo=nginx)](https://nginx.org/)
[![MySQL](https://img.shields.io/badge/Database-MySQL_8.0-orange?logo=mysql)](https://www.mysql.com/)
[![Prometheus](https://img.shields.io/badge/Monitoring-Prometheus-red?logo=prometheus)](https://prometheus.io/)
[![Grafana](https://img.shields.io/badge/Visualization-Grafana_11-F46800?logo=grafana)](https://grafana.com/)
[![Loki](https://img.shields.io/badge/Logging-Grafana_Loki-yellow?logo=grafana)](https://grafana.com/oss/loki/)

> **Học phần:** Triển khai và Quản trị Hệ thống Phần mềm  
> **Trường:** Đại học Công nghệ Thông tin & Truyền thông (ICTU)  
> **Đề tài 2:** Website Quản lý Sinh viên (CRUD Sinh viên, Lớp, Điểm số)  
> **Sinh viên thực hiện:** Nguyễn Đức Anh  
> **Mã số sinh viên:** `DTC245200328`  
> **Lớp:** CNTT K23B  
> **Email:** `dtc245200328@ictu.edu.vn` | **SĐT:** 0373704050  
> **Repository GitHub:** Đặt tên theo mã số sinh viên theo yêu cầu đề bài  

---

## 📌 1. TỔNG QUAN KIẾN TRÚC HỆ THỐNG

Toàn bộ hệ thống được container hóa và điều phối bằng **Docker Compose**, phân tách mạng độc lập (**Network Isolation**) và bảo vệ qua cổng đơn **Nginx Reverse Proxy** với chứng chỉ SSL/TLS tự ký:

```
                                [ Trình duyệt Web ]
                                         │
                                  Port 80/443 (HTTPS)
                                         ▼
                            ┌────────────────────────┐
                            │   Nginx Reverse Proxy  │
                            │   (SSL & Sec Headers)  │
                            └───────────┬────────────┘
                         (frontend-net) │
             ┌──────────────────────────┴──────────────────────────┐
             ▼                                                     ▼
   ┌───────────────────┐                                 ┌───────────────────┐
   │    student-app    │                                 │    phpmyadmin     │
   │  (Node.js Express)│                                 │ (DB Web GUI Admin)│
   └─────────┬─────────┘                                 └─────────┬─────────┘
             │                                                     │
             │ (backend-net)                                       │ (backend-net)
             └──────────────────────────┬──────────────────────────┘
                                        ▼
                             ┌─────────────────────┐
                             │     MySQL 8.0 DB    │
                             │ (student_management)│
                             └──────────┬──────────┘
                                        │ (backend-net)
                                        ▼
                             ┌─────────────────────┐
                             │   mysql-exporter    │
                             └──────────┬──────────┘
                                        │
┌───────────────────────────────────────┴───────────────────────────────────────┐
│                           monitoring-net                                      │
│                                                                               │
│  ┌────────────────┐     Scrapes      ┌───────────────┐      Query     ┌────┐  │
│  │   Prometheus   │ ◄─────────────── │  student-app  │ ◄───────────── │    │  │
│  │ (Metrics Svr)  │ ◄─────────────── │  cadvisor     │                │ G  │  │
│  │                │ ◄─────────────── │ mysql-exporter│                │ R  │  │
│  └────────┬───────┘                  └───────────────┘                │ A  │  │
│           │                                                           │ F  │  │
│           └───────────────────────────┬──────────────────────────────►│ A  │  │
│                                       │                               │ N  │  │
│  ┌────────────────┐     Pushes       ┌┴──────────────┐      LogQL     │ A  │  │
│  │  Grafana Loki  │ ◄─────────────── │   Promtail    │ ◄───────────── │    │  │
│  │ (Log Storage)  │                  │(Log Collector)│                │    │  │
│  └────────────────┘                  └───────────────┘                └────┘  │
└───────────────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 2. HƯỚNG DẪN KHỞI CHẠY HỆ THỐNG (1 LỆNH DUY NHẤT)

### Yêu cầu tiên quyết:
- Đã cài đặt **Docker** và **Docker Compose** (hoặc Docker Desktop trên Windows/macOS/Linux).
- Cổng 80, 443, 3001, 9090 trên máy chủ chưa bị chiếm dụng.

### Các bước thực hiện chung:
```bash
# Bước 1: Clone mã nguồn từ GitHub
git clone https://github.com/nda2801/DTC245200328.git
cd DTC245200328

# Bước 2: Tạo tệp biến môi trường từ tệp mẫu
cp .env.example .env

# Bước 3: Khởi chạy toàn bộ hệ thống
docker compose up -d --build

# Bước 4: Kiểm tra trạng thái toàn bộ containers
docker compose ps
```

### 🐧 Hướng dẫn đặc thù triển khai trên CachyOS / Arch Linux (Kernel 6.x+, cgroups v2):
CachyOS là bản phân phối dựa trên Arch Linux với nhân Linux tối ưu hóa (BORE scheduler, cgroup v2). Để hệ thống hoạt động trơn tru:

1. **Cài đặt Docker & Docker Compose qua pacman:**
   ```bash
   sudo pacman -Syu
   sudo pacman -S docker docker-compose git
   ```
2. **Kích hoạt Systemd Daemon và cấp quyền user:**
   ```bash
   sudo systemctl enable --now docker
   sudo usermod -aG docker $USER
   newgrp docker   # Hoặc đăng xuất rồi đăng nhập lại để áp dụng group
   ```
3. **Mở cổng Firewall (nếu bật UFW hoặc firewalld):**
   ```bash
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw allow 3001/tcp
   sudo ufw allow 9090/tcp
   ```
4. **Khởi chạy dự án:**
   ```bash
   git clone https://github.com/nda2801/DTC245200328.git
   cd DTC245200328
   cp .env.example .env
   docker compose up -d --build
   ```
> **Đã tối ưu sẵn cho CachyOS:** 
> - **cgroup v2:** Container `cadvisor` đã được cấu hình gắn kết volume `- /sys/fs/cgroup:/sys/fs/cgroup:ro` tương thích hoàn toàn kiến trúc cgroup v2 của Arch/CachyOS.
> - **Socket Permission:** Container `promtail` đã thiết lập `user: root` đảm bảo đọc được log Nginx và Docker socket `/var/run/docker.sock` mà không gặp lỗi Permission Denied.

---

## 🌐 3. BẢNG THÔNG TIN CÁC DỊCH VỤ & TÀI KHOẢN ĐĂNG NHẬP

| Dịch vụ | URL Truy cập | Tài khoản / Mật khẩu | Chức năng |
|:---|:---|:---|:---|
| **Website Quản lý Sinh viên** | `https://localhost` | Không yêu cầu đăng nhập | CRUD Sinh viên, Lớp học, Điểm số, Bảng điều khiển |
| **phpMyAdmin** | `https://localhost/pma/` | User: `student_user`<br>Pass: `StudentAppSecurePass2026!`<br>*(Hoặc User: `root` / Pass: `RootAdminSecurePass2026!`)* | Quản trị cơ sở dữ liệu MySQL qua giao diện Web |
| **Prometheus Server** | `http://localhost:9090` | Truy cập trực tiếp | Kiểm tra các Target Scrape metrics và truy vấn PromQL |
| **Grafana Dashboard** | `http://localhost:3001` | User: `admin`<br>Pass: `GrafanaAdminSecure2026!` | Xem Dashboard hiệu năng Container, Ứng dụng & MySQL |
| **Raw Metrics Endpoint** | `https://localhost/metrics` | Truy cập trực tiếp | Dữ liệu thô Prometheus Metrics từ ứng dụng Node.js |
| **Health Check Endpoint** | `https://localhost/health` | Truy cập trực tiếp | Kiểm tra trạng thái hoạt động ứng dụng và Database |

> **Lưu ý về SSL:** Do sử dụng chứng chỉ SSL tự ký (**Self-signed Certificate**) để phục vụ học tập, trình duyệt sẽ hiển thị cảnh báo bảo mật lần đầu truy cập. Nhấn **Nâng cao (Advanced) -> Tiếp tục truy cập localhost (Proceed to localhost)** để vào trang web bình thường.

---

## 🔍 4. HƯỚNG DẪN TRUY VẤN LOG TẬP TRUNG (LOGQL)

Hệ thống tích hợp cụm **Grafana Loki** và **Promtail** tự động thu thập nhật ký truy cập Nginx định dạng JSON.

### Các bước thực hiện:
1. Mở trình duyệt truy cập Grafana: `http://localhost:3001` (Đăng nhập: `admin` / `GrafanaAdminSecure2026!`).
2. Vào mục **Explore** (Biểu tượng chiếc la bàn ở thanh menu bên trái).
3. Tại ô chọn Datasource, chọn **Loki**.
4. Thực thi ít nhất 3 truy vấn sau:

### Truy vấn 1: Xem toàn bộ luồng Access Logs của Nginx
```logql
{job="nginx", log_type="access"}
```

### Truy vấn 2: Lọc các truy vấn phát sinh lỗi HTTP (Mã trạng thái 4xx hoặc 5xx)
```logql
{job="nginx"} | json | status >= 400
```

### Truy vấn 3: Thống kê tần suất truy cập trung bình (Rate)
```logql
rate({job="nginx"}[1m])
```

---

## 🛡️ 5. BIỆN PHÁP HARDENING ĐÃ ÁP DỤNG (BẢO MẬT HỆ THỐNG)

Hệ thống đã triển khai đầy đủ 5 tiêu chuẩn an toàn thông tin:
1. **Non-root Container Execution:** `Dockerfile` chuyển quyền sang tài khoản không đặc quyền `USER node` (UID 1000).
2. **Network Isolation:** Phân chia 3 bridge networks (`frontend-net`, `backend-net`, `monitoring-net`). Cổng `3306` của MySQL không expose ra host bên ngoài.
3. **Database Principle of Least Privilege (PoLP):** Tạo tài khoản riêng `student_user` chỉ cấp quyền `SELECT, INSERT, UPDATE, DELETE` trên database `student_management`. Tuyệt đối không dùng `root` cho ứng dụng.
4. **Nginx Security Headers & SSL Termination:** Cấu hình `X-Frame-Options DENY`, `X-Content-Type-Options nosniff`, `Strict-Transport-Security`, `X-XSS-Protection` và ẩn phiên bản Nginx (`server_tokens off`).
5. **Cấm leo thang đặc quyền:** Toàn bộ services trong `docker-compose.yml` được trang bị `security_opt: ["no-new-privileges:true"]`.

---

## 📜 6. LỊCH SỬ 3 COMMITS THEO QUY CHUẨN ĐỀ THI

Theo yêu cầu tiêu chí 1 tại Trang 1 của đề tài, các commit được tổ chức rõ ràng theo từng mốc:
1. **Commit 1:** `feat(milestone-1): Triển khai ứng dụng Web Quản lý sinh viên, MySQL, phpMyAdmin và cấu hình Nginx Reverse Proxy với HTTPS tự ký`
2. **Commit 2:** `feat(milestone-2): Tích hợp hệ thống giám sát Prometheus và Grafana, thu thập metrics container và MySQL database`
3. **Commit 3:** `feat(milestone-3): Triển khai hệ thống log tập trung Loki + Promtail, Hardening bảo mật và hoàn thiện tài liệu báo cáo`

---

## 📁 7. CẤU TRÚC THƯ MỤC DỰ ÁN

```
.
├── .env.example                     # Tệp biến môi trường mẫu
├── .gitignore                       # Danh sách các tệp/thư mục bỏ qua Git
├── Dockerfile                       # Multi-stage Dockerfile tối ưu non-root
├── docker-compose.yml               # File điều phối toàn bộ 10 container
├── README.md                        # Hướng dẫn chi tiết triển khai & vận hành
├── docs/
│   ├── BAO_CAO_TONG_HOP_DE_TAI_2.md # Báo cáo tổng hợp môn học >= 10 trang
│   └── chapter01.pdf ...            # Tài liệu bài giảng môn học
├── mysql/
│   └── init.sql                     # Script tạo database, tables, triggers, seed data & grant
├── nginx/
│   ├── nginx.conf                   # Cấu hình Reverse Proxy, SSL, JSON log, Sec Headers
│   └── ssl/                         # Cặp chứng chỉ SSL tự ký (server.crt & server.key)
├── monitoring/
│   ├── prometheus/
│   │   └── prometheus.yml           # Cấu hình scrape targets Prometheus
│   └── grafana/
│       ├── dashboards/
│       │   └── system-overview.json # Dashboard JSON giám sát Container, App, MySQL
│       └── provisioning/            # Tự động nạp datasources và dashboards
├── logging/
│   ├── loki/
│   │   └── loki-config.yml          # Cấu hình lưu trữ và truy vấn Grafana Loki
│   └── promtail/
│       └── promtail-config.yml      # Cấu hình thu thập log Nginx và Container
└── src/                             # Mã nguồn ứng dụng Web Node.js Express CRUD
    ├── package.json
    ├── server.js                    # Khởi tạo Express, Prometheus metrics, CRUD routes
    ├── config/db.js                 # Kết nối MySQL Connection Pool
    └── views/                       # Giao diện EJS + Bootstrap 5 (Dashboard, Sinh viên, Lớp, Điểm)
```

---
*Dự án hoàn thành phục vụ đánh giá kết thúc học phần Triển khai và Quản trị Hệ thống Phần mềm.*
