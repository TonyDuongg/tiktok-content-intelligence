# TikTok Content Intelligence & AI Script Generator 🚀

[![Java](https://img.shields.io/badge/Java-21-orange.svg)](https://adoptium.net/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3.5-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![AWS SDK](https://img.shields.io/badge/AWS%20SDK%20v2-2.29.19-blue.svg)](https://aws.amazon.com/sdk-for-java/)
[![Security](https://img.shields.io/badge/Firewall-agent--redact-purple.svg)](https://github.com/TonyDuongg/agent-redact)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Hệ thống phân tích xu hướng video TikTok theo ngành hàng (Mỹ phẩm, Thời trang, v.v.), nghiên cứu kênh đối thủ và tự động sinh kịch bản video viral 3 phần (Hook 3s, Body, CTA) bằng Generative AI (AWS Bedrock / Claude 3.5 Sonnet).

---

## 🏗 Kiến trúc tổng thể (Architecture)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             CLIENT / FRONTEND                               │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ HTTP / REST APIs (JWT Auth)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SPRING BOOT 3 ENTERPRISE BACKEND                         │
│                                                                             │
│  [ Spring Security 6 ] ──► [ Auth & User Service (BCrypt + JWT) ]           │
│                                      │                                      │
│  [ Scraper Client ]    ──► [ Data Ingestion Service ]                       │
│    (RapidAPI / Mock)                 │                                      │
│                                      ├──► [ AWS S3 Storage ] (Raw Scrape)   │
│                                      └──► [ PostgreSQL DB ] (Metrics/Videos)│
│                                                                             │
│  [ Job Dispatcher ]    ──► [ AWS SQS Message Queue ]                        │
│                                      │ (Async Polling)                      │
│                                      ▼                                      │
│                            [ SQS Consumer Worker ]                          │
│                                      │                                      │
│                                      ▼                                      │
│                        [ AI Script Generator Engine ]                       │
│                          (AWS Bedrock Claude 3.5 / Mock)                    │
│                                      │                                      │
│                                      ▼                                      │
│                        [ AiScript & Reference Videos ]                      │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
        ┌──────────────────────────────┼──────────────────────────────┐
        ▼                              ▼                              ▼
┌──────────────┐              ┌────────────────┐              ┌──────────────┐
│  PostgreSQL  │              │     Redis      │              │  LocalStack  │
│  Port: 5432  │              │   Port: 6379   │              │ (S3 & SQS)   │
│              │              │                │              │  Port: 4566  │
└──────────────┘              └────────────────┘              └──────────────┘
```

---

## 🛠 Tech Stack

* **Ngôn ngữ & Framework:** Java 21 LTS, Spring Boot 3.3.5.
* **Bảo mật & Phân quyền:** Spring Security 6, Stateless JWT (JJWT 0.12.6), BCrypt Password Hashing, RBAC (`ROLE_USER`, `ROLE_ADMIN`), phòng chống lỗ hổng **IDOR**.
* **Tường lửa mã nguồn:** [agent-redact](https://github.com/TonyDuongg/agent-redact) quét tự động ngăn chặn rò rỉ secret, key và PII qua Git Pre-commit Hook & CI.
* **Message Queue & Async Worker:** AWS SDK v2 SQS Producer/Consumer, Dead Letter Queue (DLQ), cơ chế tự động hoàn lại Credit khi tác vụ thất bại.
* **Lưu trữ đám mây & Dữ liệu:**
  * **Amazon S3 (AWS SDK v2):** Lưu trữ raw JSON payloads và video metadata.
  * **PostgreSQL 16:** Bảng dữ liệu chuẩn hóa, Foreign Keys, Indexes, Native JSON mapping.
  * **Redis 7:** Cache và rate limiting.
* **Generative AI & Prompt Engineering:** AWS Bedrock Runtime Client (Claude 3.5 Sonnet / Amazon Titan) & Mock Smart Fallback Engine.
* **API Documentation:** SpringDoc OpenAPI 3.0 / Swagger UI.
* **DevOps & CI/CD:** Docker Compose, LocalStack, GitHub Actions CI Pipeline.

---

## 📂 Cấu trúc thư mục dự án

```
tiktok-content-intelligence/
├── .agentredactrc.json          # Cấu hình bảo mật quét PII & Secret với agent-redact
├── .github/
│   └── workflows/
│       └── ci.yml               # GitHub Actions CI: Scan PII, Setup Java 21, Run Tests
├── docker/
│   └── docker-compose.yml       # Môi trường Local: PostgreSQL, Redis, LocalStack
├── docs/
│   ├── database/
│   │   ├── schema.sql           # Script DDL khởi tạo Database PostgreSQL
│   │   └── ERD.md               # Sơ đồ quan hệ thực thể (ERD) Mermaid
├── backend/
│   ├── pom.xml                  # Cấu hình Maven, Dependencies Spring Boot 3 & AWS SDK
│   ├── mvnw / mvnw.cmd          # Maven Wrapper cross-platform
│   └── src/
│       ├── main/
│       │   ├── java/com/tiktok/intelligence/
│       │   │   ├── config/      # Security, JWT Filter, AWS, OpenAPI Configs
│       │   │   ├── controller/  # REST API Controllers (Auth, Channels, Jobs, Scripts, Categories)
│       │   │   ├── domain/      # JPA Entities & Enums
│       │   │   ├── dto/         # Request / Response Immutable Records
│       │   │   ├── exception/   # GlobalExceptionHandler & Custom Exceptions
│       │   │   ├── repository/  # Spring Data JPA Repositories
│       │   │   └── service/     # Business Services (Auth, S3, SQS Worker, Scraper, AI Engine)
│       │   └── resources/
│       │       └── application.yml
│       └── test/                # Unit & Integration Tests (16/16 Passed)
└── package.json                 # Cấu hình npm script chạy agent-redact
```

---

## ⚡ Bắt đầu nhanh (Quick Start)

### 1. Yêu cầu môi trường
* **Java 21 LTS** (`java -version`)
* **Node.js 18+** (`node -v`)
* **Docker & Docker Desktop** (`docker compose version`)

### 2. Khởi động hạ tầng Local (PostgreSQL, Redis, LocalStack)
```bash
cd docker
docker compose up -d
```
* **PostgreSQL:** `localhost:5432` (User: `dev_user`, Pass: `dev_password`, DB: `tiktok_intelligence`)
* **Redis:** `localhost:6379`
* **LocalStack:** `http://localhost:4566` (Giả lập S3 Bucket & SQS Queue miễn phí)

### 3. Cài đặt tường lửa bảo mật agent-redact
```bash
# Tại thư mục gốc dự án
npm install
npm run scan:secrets
```

### 4. Chạy ứng dụng Backend
```bash
cd backend

# Trên Windows
.\mvnw.cmd spring-boot:run

# Trên Linux / macOS
chmod +x ./mvnw
./mvnw spring-boot:run
```

Ứng dụng sẽ khởi chạy tại: `http://localhost:8080`

---

## 📖 Tài liệu API & Giám sát

* **Swagger UI:** [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)
* **OpenAPI 3 JSON Spec:** [http://localhost:8080/api-docs](http://localhost:8080/api-docs)
* **Actuator Health Check:** [http://localhost:8080/actuator/health](http://localhost:8080/actuator/health)

---

## 🧪 Hướng dẫn kiểm thử toàn diện End-to-End (cURL Walkthrough)

Dưới đây là chuỗi lệnh cURL kiểm thử toàn bộ các giai đoạn từ Authentication, Cào kênh, Tạo tác vụ bất đồng bộ qua AWS SQS đến Sinh kịch bản video AI.

### Bước 1: Đăng ký tài khoản người dùng mới (Tặng kèm 50 credit ban đầu)
```bash
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "creator@example.com",
    "password": "SecurePassword123@",
    "fullName": "Nguyen Van Creator"
  }'
```

### Bước 2: Đăng nhập để nhận JWT Token
```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "creator@example.com",
    "password": "SecurePassword123@"
  }'
```
> **Ghi chú:** Lưu lại giá trị `accessToken` trả về để gán vào biến môi trường:
> ```bash
> export TOKEN="eyJhbGciOiJIUzI1NiJ9..."
> ```

### Bước 3: Lấy thông tin tài khoản & số dư Credit hiện tại
```bash
curl -X GET http://localhost:8080/api/v1/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

### Bước 4: Lấy danh sách các ngành hàng (Categories & Niches)
```bash
curl -X GET http://localhost:8080/api/v1/categories \
  -H "Authorization: Bearer $TOKEN"
```

### Bước 5: Cào dữ liệu kênh TikTok & Video (Lưu Raw JSON vào S3)
```bash
curl -X POST "http://localhost:8080/api/v1/channels/ingest?username=beauty_queen&categoryId=1&maxVideos=10" \
  -H "Authorization: Bearer $TOKEN"
```

### Bước 6: Xem top video viral nhất của kênh theo Engagement Rate
```bash
curl -X GET "http://localhost:8080/api/v1/channels/beauty_queen/top-videos?limit=5" \
  -H "Authorization: Bearer $TOKEN"
```

### Bước 7: Khởi tạo tác vụ phân tích bất đồng bộ qua AWS SQS (Trừ 5 credit)
```bash
curl -X POST http://localhost:8080/api/v1/jobs \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "jobType": "ANALYZE_AND_GENERATE_SCRIPT",
    "targetUsername": "beauty_queen",
    "categoryId": 1,
    "targetAudience": "Gen Z da dầu mụn",
    "tone": "Thuyết phục, lôi cuốn, hài hước",
    "maxVideos": 10
  }'
```
> Trả về HTTP `202 ACCEPTED` kèm `jobId`. Worker chạy nền tự động cào dữ liệu, đẩy S3 và kích hoạt sinh kịch bản AI.

### Bước 8: Kiểm tra trạng thái tác vụ
```bash
curl -X GET http://localhost:8080/api/v1/jobs/{jobId} \
  -H "Authorization: Bearer $TOKEN"
```

### Bước 9: Sinh kịch bản video AI trực tiếp theo chủ đề
```bash
curl -X POST http://localhost:8080/api/v1/scripts/generate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "categoryId": 1,
    "topic": "3 Sai lầm chết người khi dùng Retinol",
    "targetAudience": "Người mới bắt đầu skincare",
    "tone": "Chuyên gia, lôi cuốn, cảnh báo",
    "referenceVideoIds": []
  }'
```

### Bước 10: Xem chi tiết kịch bản 3 phần (Hook, Body, CTA) & Video tham khảo
```bash
curl -X GET http://localhost:8080/api/v1/scripts/{scriptId} \
  -H "Authorization: Bearer $TOKEN"
```

### Bước 11: Đánh dấu yêu thích kịch bản (Favorite)
```bash
curl -X PATCH "http://localhost:8080/api/v1/scripts/{scriptId}/status?status=FAVORITE" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🛡️ Bảo mật & Tường lửa agent-redact

Dự án tích hợp cơ chế bảo mật nghiêm ngặt chống rò rỉ bí mật, API key, AWS access key và dữ liệu nhạy cảm PII:
1. **Git Pre-commit Hook:** Tự động chặn lệnh commit nếu phát hiện secret hoặc PII chưa được xử lý.
2. **Bộ quy tắc `.agentredactrc.json`:** Áp dụng preset `vn-pii`, bộ phát hiện entropy cao và danh sách an toàn cho môi trường test.
3. **CI Security Gate:** Mỗi lần Push hoặc Pull Request đều được quét độc lập trên máy ảo GitHub Actions trước khi build.

---

## ⚙️ Biến môi trường cấu hình (Environment Variables)

| Tên biến | Mặc định | Mô tả |
|---|---|---|
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://localhost:5432/tiktok_intelligence` | URL kết nối PostgreSQL |
| `SPRING_DATASOURCE_USERNAME`| `dev_user` | Tài khoản Database |
| `SPRING_DATASOURCE_PASSWORD`| `dev_password` | Mật khẩu Database |
| `JWT_SECRET_KEY` | Hex 256-bit key | Khóa bí mật ký JWT Token |
| `AWS_REGION` | `ap-southeast-1` | AWS Region (Singapore) |
| `AWS_ENDPOINT` | `http://localhost:4566` | Endpoint LocalStack (Local) hoặc AWS Cloud |
| `AWS_S3_BUCKET` | `tiktok-intelligence-bucket` | Tên S3 Bucket lưu trữ Scrape JSON |
| `AWS_SQS_QUEUE_NAME` | `tiktok-job-queue` | Tên SQS Queue xử lý tác vụ |
| `AWS_SQS_DLQ_NAME` | `tiktok-job-dlq` | Tên Dead Letter Queue khi lỗi quá 3 lần |
| `SCRAPER_PROVIDER` | `mock` | `mock` (miễn phí) hoặc `rapidapi` (production) |
| `AI_PROVIDER` | `mock` | `mock` (miễn phí) hoặc `bedrock` (AWS Bedrock) |
| `AI_MODEL_ID` | `anthropic.claude-3-5-sonnet-20240620-v1:0` | ID mô hình AI trên AWS Bedrock |

---

## 👥 Tác giả & Giấy phép
* **Author:** haiduong2102 (<nguyenhaiduong052005@gmail.com>)
* **Repository:** [TonyDuongg/tiktok-content-intelligence](https://github.com/TonyDuongg/tiktok-content-intelligence)
* **License:** MIT
