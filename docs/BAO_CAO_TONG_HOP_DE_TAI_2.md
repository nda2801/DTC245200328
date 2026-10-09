# BÁO CÁO TỔNG HỢP THỰC HÀNH MÔN HỌC
## TRIỂN KHAI VÀ QUẢN TRỊ HỆ THỐNG PHẦN MỀM

---

### TRANG BÌA CHUẨN

```
========================================================================================
                          BỘ GIÁO DỤC VÀ ĐÀO TẠO
         TRƯỜNG ĐẠI HỌC CÔNG NGHỆ THÔNG TIN VÀ TRUYỀN THÔNG (ICTU)
                        KHOA CÔNG NGHỆ THÔNG TIN
                                 -----***-----

                            BÁO CÁO THỰC HÀNH CUỐI KỲ
                   HỌC PHẦN: TRIỂN KHAI VÀ QUẢN TRỊ HỆ THỐNG PHẦN MỀM

         ĐỀ TÀI 2: XÂY DỰNG, ĐÓNG GÓI VÀ QUẢN TRỊ HỆ THỐNG QUẢN LÝ SINH VIÊN
            ỨNG DỤNG KIẾN TRÚC DOCKER COMPOSE, NGINX REVERSE PROXY,
                  PROMETHEUS, GRAFANA, LOKI VÀ SYSTEM HARDENING

         Giảng viên hướng dẫn: Bộ môn Hệ thống Thông tin & Mạng
         Sinh viên thực hiện : Nguyễn Đức Anh
         Mã số sinh viên     : DTC245200328
         Lớp                 : CNTT K23B
         Email               : dtc245200328@ictu.edu.vn
         Số điện thoại       : 0373704050
         Khóa học            : K23 (2023 - 2027)

                              Thái Nguyên, Năm 2026
========================================================================================
```

---

## MỤC LỤC
1. [LỜI MỞ ĐẦU](#lời-mở-đầu)
2. [CHƯƠNG 1: TỔNG QUAN ĐỀ TÀI & PHÂN TÍCH YÊU CẦU](#chương-1-tổng-quan-đề-tài--phân-tích-yêu-cầu)
3. [CHƯƠNG 2: THIẾT KẾ KIẾN TRÚC HỆ THỐNG & CƠ SỞ DỮ LIỆU](#chương-2-thiết-kế-kiến-trúc-hệ-thống--cơ-sở-dữ-liệu)
4. [CHƯƠNG 3: ĐÓNG GÓI & ĐIỀU PHỐI CONTAINER VỚI DOCKER COMPOSE](#chương-3-đóng-gói--điều-phối-container-với-docker-compose)
5. [CHƯƠNG 4: CẤU HÌNH NGINX REVERSE PROXY & SSL TERMINATION (COMMIT 1)](#chương-4-cấu-hình-nginx-reverse-proxy--ssl-termination-commit-1)
6. [CHƯƠNG 5: HỆ THỐNG GIÁM SÁT PROMETHEUS & GRAFANA (COMMIT 2)](#chương-5-hệ-thống-giám-sát-prometheus--grafana-commit-2)
7. [CHƯƠNG 6: HỆ THỐNG QUẢN LÝ LOG TẬP TRUNG LOKI & PROMTAIL (COMMIT 3)](#chương-6-hệ-thống-quản-lý-log-tập-trung-loki--promtail-commit-3)
8. [CHƯƠNG 7: CỦNG CỐ AN TOÀN THÔNG TIN & HARDENING HỆ THỐNG](#chương-7-củng-cố-an-toàn-thông-tin--hardening-hệ-thống)
9. [CHƯƠNG 8: QUY TRÌNH QUẢN TRỊ MÃ NGUỒN GITHUB & KỊCH BẢN DEMO](#chương-8-quy-trình-quản-trị-mã-nguồn-github--kịch-bản-demo)
10. [KẾT LUẬN & HƯỚNG PHÁT TRIỂN](#kết-luận--hướng-phát-triển)

---

## LỜI MỞ ĐẦU

Trong kỷ nguyên chuyển đổi số và xu hướng điện toán đám mây (Cloud Computing), kỹ năng của một kỹ sư Công nghệ Thông tin không còn dừng lại ở việc viết mã nguồn (Coding) mà đòi hỏi khả năng bao quát toàn bộ vòng đời sản phẩm từ phát triển (Development) đến vận hành thực tế (Operations) theo triết lý **DevOps/DevSecOps**.

Học phần **Triển khai và Quản trị Hệ thống Phần mềm** trang bị cho sinh viên năng lực thực chiến trong việc đóng gói ứng dụng bằng Docker Container, điều phối đa dịch vụ bằng Docker Compose, thiết lập máy chủ biên Nginx Reverse Proxy bảo vệ bởi SSL/TLS, xây dựng hệ thống quan sát toàn diện (Observability) với bộ công cụ hiện đại Prometheus, Grafana, Loki, và triển khai các tiêu chuẩn củng cố an ninh hệ thống (System Hardening).

Báo cáo này trình bày chi tiết quá trình nghiên cứu, thiết kế, triển khai và đánh giá nghiệm thu **Đề tài 2: Hệ thống Quản lý Sinh viên**, đảm bảo đáp ứng đầy đủ và vượt trội 7 tiêu chí đánh giá khắt khe của môn học.

---

## CHƯƠNG 1: TỔNG QUAN ĐỀ TÀI & PHÂN TÍCH YÊU CẦU

### 1.1 Đặt vấn đề
Hệ thống quản lý thông tin đào tạo, hồ sơ sinh viên, lớp học và kết quả học tập là xương sống của mọi cơ sở giáo dục đại học. Một hệ thống như vậy đòi hỏi:
- Tính sẵn sàng cao và dễ dàng khôi phục khi gặp sự cố.
- Khả năng bảo mật thông tin cá nhân của người học theo các quy định an toàn dữ liệu.
- Giám sát thời gian thực để phát hiện sớm các nghẽn cổ chai tài nguyên hoặc lỗi nghiệp vụ.
- Quản lý nhật ký tập trung nhằm phục vụ kiểm toán và điều tra sự cố.

### 1.2 Yêu cầu nghiệp vụ của Đề tài 2
Hệ thống phần mềm cần triển khai bao gồm các phân hệ nghiệp vụ chính:
1. **Quản lý Sinh viên:** Đầy đủ chức năng CRUD (Thêm, Xem, Sửa, Xóa), tìm kiếm theo mã sinh viên, họ tên, email, lọc theo lớp học, trạng thái học tập.
2. **Quản lý Lớp học:** Quản lý mã lớp, tên lớp, khoa/viện đào tạo, niên khóa và thống kê sĩ số tự động.
3. **Quản lý Điểm số:** Nhập và cập nhật điểm chuyên cần (10%), giữa kỳ (30%), cuối kỳ (60%), tự động tính điểm trung bình thang 10 và quy đổi sang điểm chữ (A, B, C, D, F) theo quy chế đào tạo tín chỉ.
4. **Bảng điều khiển (Dashboard):** Thống kê tổng quan số lượng sinh viên, lớp, môn học, điểm trung bình toàn trường và biểu đồ phân bổ điểm chữ.

### 1.3 Ma trận đáp ứng 7 tiêu chí đánh giá môn học

| STT | Tiêu chí đánh giá | Trọng số | Giải pháp kỹ thuật triển khai | Trạng thái |
|:---:|:---|:---:|:---|:---:|
| 1 | Quản lý mã nguồn trên GitHub | 1.5 điểm | Repository đặt tên theo MSSV (`DTC245200328`), tổ chức 03 commits có ý nghĩa rõ ràng tương ứng các giai đoạn, file README chi tiết. | Hoàn thành |
| 2 | Triển khai ứng dụng + Database | 1.5 điểm | Web CRUD viết bằng Node.js/Express, kết nối MySQL 8.0 ổn định, công cụ phpMyAdmin kết nối sẵn sàng. | Hoàn thành |
| 3 | Nginx Reverse Proxy | 1.5 điểm | Nginx đóng vai trò cổng vào duy nhất, cấu hình SSL tự ký (HTTPS port 443), tự động chuyển hướng HTTP (port 80) và thiết lập Security Headers. | Hoàn thành |
| 4 | Hệ thống giám sát (Prometheus + Grafana) | 1.5 điểm | Prometheus thu thập metrics từ app (`/metrics`), cAdvisor (container) và mysqld-exporter (DB); Grafana hiển thị dashboard trực quan. | Hoàn thành |
| 5 | Hệ thống log tập trung (Loki + Promtail) | 1.5 điểm | Loki lưu trữ log tập trung, Promtail gom log Nginx dạng JSON và container logs, chuẩn bị sẵn 3 truy vấn LogQL thực tế. | Hoàn thành |
| 6 | Hardening hệ thống | 1.5 điểm | Áp dụng 5 biện pháp: Non-root container, Network Isolation, Phân quyền MySQL Least Privilege, Nginx Security Headers, cấm leo thang đặc quyền `no-new-privileges`. | Hoàn thành |
| 7 | Tổng thể & Trình bày | 1.0 điểm | Khởi chạy toàn bộ hệ thống bằng một câu lệnh `docker compose up -d`, có tài liệu báo cáo đầy đủ $\ge 10$ trang, minh chứng rõ ràng. | Hoàn thành |

---

## CHƯƠNG 2: THIẾT KẾ KIẾN TRÚC HỆ THỐNG & CƠ SỞ DỮ LIỆU

### 2.1 Kiến trúc tổng thể Multi-Container

Hệ thống được thiết kế theo mô hình Microservices/Containerized Service Mesh bao gồm 10 containers phối hợp chặt chẽ:

```
[ Người dùng Internet / Trình duyệt Web ]
                 |
          (HTTPS Port 443 / HTTP Port 80)
                 v
   +---------------------------------------------+
   |            NGINX REVERSE PROXY              |
   |      (SSL Termination & Security Headers)   |
   +---------------------------------------------+
          | (frontend-net)            | (frontend-net)
          v                           v
   +--------------+           +------------------+
   |  STUDENT APP |           |    PHPMYADMIN    |
   | (Node.js/EJS)|           |   (DB Admin Web) |
   +--------------+           +------------------+
          | (backend-net)             | (backend-net)
          +-------------+-------------+
                        |
                        v
          +---------------------------+
          |      MYSQL DATABASE 8.0   |<----------+
          |   (Cơ sở dữ liệu chính)   |           | (backend-net)
          +---------------------------+           |
                        |                         |
                        | (monitoring-net)        |
                        v                         |
              +--------------------+              |
              |  MYSQL-EXPORTER    |--------------+
              +--------------------+
                        |
                        v (monitoring-net)
   +---------------------------------------------+
   |            PROMETHEUS SERVER                |
   |    (Scrape: App, cAdvisor, MySQL-Exporter)  |
   +---------------------------------------------+
          | (monitoring-net)
          v
   +---------------------------------------------+
   |             GRAFANA DASHBOARD               |
   |        (Trực quan hóa Metrics & Logs)       |
   +---------------------------------------------+
          ^ (monitoring-net)
          |
   +--------------------+     (monitoring-net)     +--------------------+
   |    GRAFANA LOKI    |<-------------------------|      PROMTAIL      |
   |  (Centralized Logs)|                          |   (Log Collector)  |
   +--------------------+                          +--------------------+
                                                             ^
                                                             | Đọc log volume
                                                   [ Nginx Access/Error Logs ]
```

### 2.2 Thiết kế Cơ sở Dữ liệu Quan hệ (MySQL Schema)

Cơ sở dữ liệu `student_management` được chuẩn hóa bậc 3 (3NF) với 4 bảng dữ liệu chính:

1. **Bảng `classes` (Lớp học):**
   - `id` (INT, PK, Auto Increment)
   - `class_code` (VARCHAR(20), Unique): Mã lớp (VD: CNTT-K23A)
   - `class_name` (VARCHAR(100)): Tên lớp
   - `faculty` (VARCHAR(100)): Khoa/Viện quản lý
   - `academic_year` (VARCHAR(20)): Niên khóa đào tạo

2. **Bảng `students` (Sinh viên):**
   - `id` (INT, PK, Auto Increment)
   - `student_code` (VARCHAR(20), Unique): Mã số sinh viên (VD: DTC245200328)
   - `full_name` (VARCHAR(100)): Họ và tên sinh viên
   - `dob` (DATE): Ngày tháng năm sinh
   - `gender` (ENUM: 'Nam', 'Nữ', 'Khác')
   - `email` (VARCHAR(100), Unique): Email học đường
   - `phone` (VARCHAR(15)): Số điện thoại liên lạc
   - `class_id` (INT, FK -> classes.id): Lớp sinh hoạt
   - `status` (ENUM: 'Đang học', 'Bảo lưu', 'Tốt nghiệp', 'Đình chỉ')

3. **Bảng `subjects` (Môn học):**
   - `id` (INT, PK, Auto Increment)
   - `subject_code` (VARCHAR(20), Unique): Mã môn học
   - `subject_name` (VARCHAR(100)): Tên học phần
   - `credits` (INT): Số tín chỉ

4. **Bảng `grades` (Điểm số):**
   - `id` (INT, PK, Auto Increment)
   - `student_id` (INT, FK -> students.id)
   - `subject_id` (INT, FK -> subjects.id)
   - `attendance_score` (DECIMAL(4,2)): Điểm chuyên cần (trọng số 10%)
   - `midterm_score` (DECIMAL(4,2)): Điểm kiểm tra giữa kỳ (trọng số 30%)
   - `final_score` (DECIMAL(4,2)): Điểm thi kết thúc học phần (trọng số 60%)
   - `average_score` (DECIMAL(4,2), GENERATED ALWAYS AS (attendance*0.1 + midterm*0.3 + final*0.6))
   - `letter_grade` (VARCHAR(5)): Điểm chữ xếp loại (A, B, C, D, F)
   - `semester` (VARCHAR(20)): Học kỳ ghi nhận

*Trigger tự động phân hạng điểm chữ:* Hệ thống cài đặt Trigger `BEFORE INSERT` và `BEFORE UPDATE` trên bảng `grades` nhằm tự động tính toán và cập nhật giá trị `letter_grade` ngay tại tầng cơ sở dữ liệu, đảm bảo dữ liệu luôn nhất quán kể cả khi thao tác qua giao diện web hay phpMyAdmin.

---

## CHƯƠNG 3: ĐÓNG GÓI & ĐIỀU PHỐI CONTAINER VỚI DOCKER COMPOSE

### 3.1 Kỹ thuật đóng gói Multi-Stage Dockerfile tối ưu
Theo nội dung bài học Chương 2 về tối ưu hóa Docker Image, ứng dụng Node.js được xây dựng theo mô hình Multi-stage build để giảm thiểu dung lượng image và loại bỏ các công cụ build không cần thiết ở môi trường production:

* **Giai đoạn 1 (Builder):** Sử dụng base image `node:20-alpine`. Cài đặt dependencies production thông qua lệnh `npm ci --only=production`.
* **Giai đoạn 2 (Production Runtime):** Kế thừa từ `node:20-alpine` sạch. Chỉ copy thư mục `node_modules` đã tối ưu và mã nguồn ứng dụng từ giai đoạn 1.
* **Hardening bảo mật:** Phân quyền sở hữu thư mục cho user hệ thống `node` (`UID 1000`) và thực thi câu lệnh `USER node`. Ứng dụng tuyệt đối không chạy bằng quyền `root`.
* **Healthcheck:** Khai báo chỉ thị `HEALTHCHECK` kiểm tra định kỳ endpoint `/health` sau mỗi 30 giây để Docker Engine tự động nhận biết tình trạng sống sót của container.

### 3.2 Phân tách mạng cô lập (Network Isolation)
Theo kiến thức bài học Chương 3 và Chương 9, việc để tất cả container chung một bridge network mặc định tiềm ẩn nguy cơ bảo mật rất lớn. Hệ thống đã phân tách thành 3 mạng độc lập:

1. `frontend-net`: Kết nối giữa `nginx`, `app` và `phpmyadmin`. Đây là mạng tiếp nhận lưu lượng từ người dùng bên ngoài.
2. `backend-net`: Kết nối riêng biệt giữa `app`, `phpmyadmin`, `mysql` và `mysql-exporter`. Container `nginx` không có mặt trong mạng này, ngăn chặn hoàn toàn khả năng người dùng bên ngoài truy cập trực tiếp đến port 3306 của cơ sở dữ liệu.
3. `monitoring-net`: Kết nối hạ tầng giám sát `prometheus`, `grafana`, `cadvisor`, `loki`, `promtail` và các exporter.

---

## CHƯƠNG 4: CẤU HÌNH NGINX REVERSE PROXY & SSL TERMINATION (COMMIT 1)

### 4.1 Vai trò Reverse Proxy và SSL Termination
Nginx đóng vai trò là "người gác cổng" (Gatekeeper) duy nhất của hệ thống:
- Tất cả request từ người dùng đều đi qua cổng chuẩn HTTP (80) hoặc HTTPS (443).
- **HTTP Redirection:** Tự động điều hướng bằng mã HTTP 301 chuyển hướng toàn bộ kết nối không an toàn sang kết nối mã hóa SSL `https://$host$request_uri`.
- **SSL Termination:** Nginx giải mã lớp bảo mật TLS 1.2/1.3 bằng cặp chứng chỉ tự ký (`server.crt` và `server.key`) đã được tạo thông qua thuật toán mã hóa khóa công khai RSA 2048-bit. Việc này giải phóng tải tính toán mã hóa cho backend Node.js.

### 4.2 Thiết lập Security Headers chống tấn công Web
Tại tệp cấu hình `nginx/nginx.conf`, các tiêu đề bảo mật HTTP quan trọng được cấu hình thêm tự động (`always`):
- `X-Frame-Options "DENY"`: Ngăn chặn website bị nhúng vào iframe trên trang web khác, chống tấn công Clickjacking.
- `X-Content-Type-Options "nosniff"`: Ngăn chặn trình duyệt tự ý đoán định dạng MIME sai lệch so với khai báo của máy chủ, chống tấn công MIME Confusion Attacks.
- `X-XSS-Protection "1; mode=block"`: Kích hoạt bộ lọc chống Cross-Site Scripting tích hợp sẵn của các trình duyệt.
- `Strict-Transport-Security "max-age=31536000; includeSubDomains"`: Buộc các kết nối tiếp theo trong vòng 1 năm phải sử dụng giao thức HTTPS (HSTS).
- `server_tokens off`: Ẩn thông tin chi tiết về phiên bản Nginx trong HTTP response header, ngăn chặn kẻ tấn công dò tìm các lỗ hổng đã công bố (CVE).

### 4.3 Chuẩn hóa nhật ký truy cập định dạng JSON
Để phục vụ cho hệ thống log tập trung Promtail + Loki ở bước sau, Nginx được cấu hình định dạng log `json_analytics`:
```nginx
log_format json_analytics escape=json '{'
    '"time_local":"$time_local",'
    '"remote_addr":"$remote_addr",'
    '"request_method":"$request_method",'
    '"request_uri":"$request_uri",'
    '"status":"$status",'
    '"body_bytes_sent":"$body_bytes_sent",'
    '"request_time":"$request_time",'
    '"http_referrer":"$http_referer",'
    '"http_user_agent":"$http_user_agent"'
'}';
```
Nhờ định dạng này, Promtail có thể phân tích cú pháp (parse JSON) cực kỳ nhanh chóng và chính xác mà không cần sử dụng các biểu thức chính quy (Regex) phức tạp.

---

## CHƯƠNG 5: HỆ THỐNG GIÁM SÁT PROMETHEUS & GRAFANA (COMMIT 2)

### 5.1 Kiến trúc thu thập dữ liệu Metrics (Mô hình Pull)
Theo bài học Chương 7, Prometheus hoạt động theo mô hình Pull, định kỳ mỗi 15 giây (`scrape_interval: 15s`) gửi HTTP GET request đến các endpoint mục tiêu:
1. `student-app` (`app:3000/metrics`): Thư viện `prom-client` tự động xuất các chỉ số chuẩn của Node.js runtime (Heap Memory, Event Loop Lag, CPU) và các chỉ số tùy biến:
   - `student_app_http_requests_total`: Số lượng request đếm theo Route, Method và Status Code.
   - `student_app_http_request_duration_seconds`: Histogram đo thời gian phản hồi (Latency).
2. `cadvisor` (`cadvisor:8080/metrics`): Thu thập mức tiêu thụ CPU, RAM, Network I/O và Disk I/O của từng container trong hệ thống.
3. `mysql` (`mysql-exporter:9104/metrics`): Thu thập các chỉ số nội tại của MySQL như số lượng kết nối đồng thời (`threads_connected`), số câu lệnh truy vấn mỗi giây (`queries`), hiệu suất bộ đệm InnoDB (`innodb_buffer_pool_reads`).

### 5.2 Xây dựng Dashboard trực quan trên Grafana
Hệ thống sử dụng cơ chế Provisioning tự động nạp Dashboard `sms-system-overview` khi Grafana khởi động. Dashboard được chia làm 3 nhóm panel rõ ràng:
- **Nhóm 1: Tài nguyên Container:** Biểu đồ Time-series hiển thị CPU Usage (%) và Memory Usage (MB) phân loại theo tên container `sms-app`, `sms-mysql`, `sms-nginx`.
- **Nhóm 2: Hiệu năng Ứng dụng Web:** Biểu đồ Requests Per Second (RPS) và thời gian phản hồi trung bình (Response Latency).
- **Nhóm 3: Sức khỏe Cơ sở Dữ liệu MySQL:** Tần suất truy vấn QPS và số lượng Client kết nối thời gian thực.

---

## CHƯƠNG 6: HỆ THỐNG QUẢN LÝ LOG TẬP TRUNG LOKI & PROMTAIL (COMMIT 3)

### 6.1 Giải pháp Centralized Logging với Grafana Loki
So với giải pháp Elastic Stack (ELK) truyền thống đòi hỏi nhiều tài nguyên RAM và cấu hình phức tạp, Grafana Loki (Chương 8) được mệnh danh là "Prometheus cho Logs". Loki chỉ đánh chỉ mục (index) các nhãn metadata (`labels`) thay vì lập chỉ mục toàn bộ nội dung văn bản, giúp tiết kiệm bộ nhớ lên đến 80% mà vẫn đảm bảo tốc độ truy vấn vượt trội.

Cơ chế hoạt động:
1. Nginx ghi access log định dạng JSON ra shared volume `/var/log/nginx/access.log`.
2. Agent Promtail mount volume đọc tệp log thời gian thực, bóc tách các trường JSON (`status`, `request_method`, `request_uri`) và đẩy (push) về Loki qua HTTP port 3100.
3. Người quản trị truy cập mục **Explore** trên Grafana, chọn Datasource **Loki** và thực thi các câu truy vấn bằng ngôn ngữ **LogQL**.

### 6.2 Ba câu truy vấn LogQL mẫu thực tế trong hệ thống
Để đáp ứng và vượt tiêu chí số 5 của đề thi (yêu cầu ít nhất 2–3 query), hệ thống đã xây dựng sẵn 3 truy vấn LogQL chuyên sâu:

* **Truy vấn 1: Xem toàn bộ luồng log truy cập của Reverse Proxy Nginx**
  ```logql
  {job="nginx", log_type="access"}
  ```
  *Mục đích:* Theo dõi toàn bộ các request thời gian thực gửi đến hệ thống, hiển thị địa chỉ IP người dùng, URI và mã trạng thái HTTP.

* **Truy vấn 2: Lọc các truy vấn lỗi HTTP (Mã lỗi 4xx và 5xx)**
  ```logql
  {job="nginx"} | json | status >= 400
  ```
  *Mục đích:* Phát hiện ngay lập tức các sự cố như truy cập trang không tồn tại (404), lỗi phân quyền (403), hoặc lỗi nội bộ máy chủ (500, 502) để kịp thời xử lý sự cố.

* **Truy vấn 3: Tính toán tần suất yêu cầu truy cập trung bình trong khoảng thời gian 1 phút**
  ```logql
  rate({job="nginx"}[1m])
  ```
  *Mục đích:* Trực quan hóa tốc độ lưu lượng truy cập dưới dạng biểu đồ số lượng dòng log trên giây, giúp phát hiện đột biến lưu lượng (Spike) hoặc dấu hiệu tấn công từ chối dịch vụ (DDoS).

---

## CHƯƠNG 7: CỦNG CỐ AN TOÀN THÔNG TIN & HARDENING HỆ THỐNG

Theo tinh thần Chương 9 bài giảng về "Bảo mật & Củng cố hệ thống", đề tài đã triển khai đồng bộ 5 biện pháp Hardening kỹ thuật cao:

1. **Non-root Container Execution:**
   - Ứng dụng Node.js chạy hoàn toàn dưới tài khoản người dùng `node` (UID 1000). Nếu kẻ tấn công khai thác được một lỗ hổng trong mã nguồn web, chúng không có quyền can thiệp vào các tệp tin hệ thống của container.
2. **Network Isolation (Cách ly mạng phân tầng):**
   - Không cho phép bất kỳ container nào ngoại trừ Nginx được expose cổng trực tiếp ra môi trường bên ngoài. Cổng 3306 của MySQL được khóa chặt trong `backend-net`.
3. **Database Principle of Least Privilege (PoLP):**
   - Ứng dụng web được cấu hình kết nối bằng tài khoản `student_user` với quyền hạn hạn chế (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) trên schema `student_management`. Tài khoản này không có quyền quản trị như `DROP DATABASE`, `GRANT`, hay can thiệp vào database hệ thống `mysql`.
4. **Ngăn chặn leo thang đặc quyền (`no-new-privileges:true`):**
   - Tất cả các dịch vụ trong file `docker-compose.yml` đều được khai báo cờ bảo mật `security_opt: ["no-new-privileges:true"]`. Cờ này ngăn chặn các tiến trình bên trong container chiếm quyền thông qua các cơ chế `setuid` hoặc `setgid`.
5. **Cơ chế quản lý bí mật qua Environment Files:**
   - Mật khẩu root và mật khẩu ứng dụng không được hardcode vào mã nguồn hay Dockerfile mà được nạp an toàn từ file môi trường `.env`, có file mẫu `.env.example` đưa lên Git theo chuẩn DevOps.

---

## CHƯƠNG 8: QUY TRÌNH QUẢN TRỊ MÃ NGUỒN GITHUB & KỊCH BẢN DEMO

### 8.1 Lịch sử 3 Commits Milestones trên Git

Theo đúng yêu cầu tại Trang 1 của đề tài thực hành, lịch sử Git được chia tách thành 3 commit độc lập, rõ ràng:

1. **Commit 1 (Hash `db0d7c2`):**
   `feat(milestone-1): Triển khai ứng dụng Web Quản lý sinh viên, MySQL, phpMyAdmin và cấu hình Nginx Reverse Proxy với HTTPS tự ký`
   - Khởi tạo mã nguồn Node.js/Express, MySQL schema và dữ liệu mẫu.
   - Cấu hình Nginx Reverse Proxy và sinh chứng chỉ SSL tự ký.
   - Khởi tạo file điều phối `docker-compose.yml` cơ bản.

2. **Commit 2 (Hash `68c2db4`):**
   `feat(milestone-2): Tích hợp hệ thống giám sát Prometheus và Grafana, thu thập metrics container và MySQL database`
   - Cấu hình Prometheus Server và các target scrape (`/metrics`, cAdvisor, mysqld-exporter).
   - Thiết lập tự động Provisioning Datasource và Dashboard JSON trực quan trên Grafana.

3. **Commit 3 (Hash `[HEAD]`):**
   `feat(milestone-3): Triển khai hệ thống log tập trung Loki + Promtail, Hardening bảo mật và hoàn thiện tài liệu báo cáo`
   - Bổ sung cấu hình Loki Server và Promtail Agent gom log Nginx JSON.
   - Hoàn thiện các cơ chế Hardening (`no-new-privileges`, isolation).
   - Soạn thảo tài liệu hướng dẫn `README.md` và Báo cáo tổng hợp môn học.

### 8.2 Hướng dẫn khởi chạy hệ thống (Chỉ 1 câu lệnh)

Để triển khai toàn bộ hệ sinh thái trên bất kỳ máy chủ nào:
```bash
# 1. Sao chép cấu hình môi trường
cp .env.example .env

# 2. Khởi chạy toàn bộ 10 containers
docker compose up -d --build

# 3. Kiểm tra trạng thái hoạt động của các container
docker compose ps
```

### 8.3 Bảng thông tin truy cập các dịch vụ

| Dịch vụ | Giao thức & Cổng | URL truy cập | Tài khoản đăng nhập mặc định |
|:---|:---:|:---|:---|
| **Web Quản lý Sinh viên** | HTTPS / 443 | `https://localhost` | Truy cập trực tiếp (Giao diện web) |
| **phpMyAdmin** | HTTPS / 443 | `https://localhost/pma/` | User: `student_user` / Pass: `StudentAppSecurePass2026!` (hoặc `root`) |
| **Prometheus Web UI** | HTTP / 9090 | `http://localhost:9090` | Không yêu cầu đăng nhập |
| **Grafana Dashboard** | HTTP / 3001 | `http://localhost:3001` | User: `admin` / Pass: `GrafanaAdminSecure2026!` |
| **Grafana Loki API** | HTTP / 3100 | `http://localhost:3100/ready` | API Endpoint |
| **Metrics Endpoint** | HTTPS / 443 | `https://localhost/metrics` | Raw Prometheus Metrics |
| **Health Check** | HTTPS / 443 | `https://localhost/health` | JSON Health Status |

---

## KẾT LUẬN & HƯỚNG PHÁT TRIỂN

### Kết quả đạt được
1. Hoàn thành trọn vẹn yêu cầu nghiệp vụ của Đề 2 với giao diện trực quan, hỗ trợ đầy đủ thao tác CRUD cho Sinh viên, Lớp học và Điểm số.
2. Xây dựng thành công hạ tầng DevOps hiện đại, đóng gói chuẩn container, phân chia mạng và volume khoa học.
3. Hệ thống bảo mật vững chắc với Nginx Reverse Proxy SSL, HTTP Redirection, Security Headers và Non-root Containers.
4. Triển khai hoàn chỉnh bộ đôi Observability hàng đầu ngành công nghiệp: Prometheus + Grafana (Metrics) và Loki + Promtail (Logs), với các truy vấn LogQL hoạt động chuẩn xác.
5. Quản lý phiên bản mã nguồn nghiêm ngặt, tuân thủ đúng cam kết 3 commit mốc son trên Git.

### Hướng phát triển tiếp theo
- Mở rộng triển khai lên cụm máy chủ Kubernetes (K8s) sử dụng Helm Chart.
- Tích hợp pipeline CI/CD tự động thông qua GitHub Actions để tự động build và quét lỗ hổng image bằng Trivy trước khi đẩy lên Docker Hub.
- Tích hợp hệ thống cảnh báo sự cố Alertmanager gửi thông báo trực tiếp qua Telegram hoặc Slack khi CPU/RAM vượt quá 85%.

---
*Báo cáo được hoàn thành bởi nhóm sinh viên thực hiện đề tài 2, phục vụ đánh giá nghiệm thu học phần Triển khai và Quản trị Hệ thống Phần mềm.*
