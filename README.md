# TikTok Content Intelligence & AI Script Generator 🚀

Hệ thống phân tích xu hướng video TikTok theo ngành hàng (Mỹ phẩm, Thời trang, v.v.), nghiên cứu kênh đối thủ và tự động sinh kịch bản video viral bằng Generative AI (LLMs).

## 🛠 Tech Stack
* **Backend:** Java 21, Spring Boot 3.3+, Spring Data JPA, Spring AI.
* **Message Queue & Async Worker:** AWS SQS, Spring Boot Scheduling / Listener.
* **Storage:** PostgreSQL (Amazon RDS), Amazon S3 (Lưu trữ raw JSON, media thumbnails).
* **AI Model:** AWS Bedrock (Claude 3.5 Sonnet) hoặc OpenAI API thông qua Spring AI.
* **Caching & Rate Limiting:** Redis.
* **DevOps & Cloud:** Docker, AWS ECS Fargate, LocalStack (môi trường Local Dev).

---

## 📂 Cấu trúc thư mục dự án

```
d:\Project\ProjectSinhVien\tiktok-content-intelligence\
├── docs/
│   └── database/
│       ├── schema.sql      # DDL Script khởi tạo Database PostgreSQL đầy đủ
│       └── ERD.md          # Sơ đồ Mermaid ERD và phân tích nghiệp vụ
├── docker/
│   └── docker-compose.yml  # Môi trường chạy Local: PostgreSQL + Redis + LocalStack (S3/SQS)
├── backend/                # Source code Spring Boot Backend (sẽ khởi tạo tiếp theo)
└── README.md
```

---

## ⚡ Bắt đầu nhanh môi trường Local (Quick Start)

Yêu cầu đã cài Docker & Docker Desktop trên máy:

```bash
cd docker
docker compose up -d
```

Sau khi chạy xong:
* **PostgreSQL:** `localhost:5432` (User: `dev_user`, Pass: `dev_password`, Database: `tiktok_intelligence` - đã tự động nạp bảng từ `schema.sql`)
* **Redis:** `localhost:6379`
* **LocalStack (AWS S3 & SQS giả lập):** `http://localhost:4566`
