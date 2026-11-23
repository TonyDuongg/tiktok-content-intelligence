# Master Implementation Plan (Roadmap)
## TikTok Content Intelligence & AI Script Generator

Dự án được phân chia thành **6 giai đoạn triển khai (Phases)** có tính kế thừa chặt chẽ, tuân thủ nguyên tắc Clean Code và Test-Driven Development (TDD).

---

## 🎯 Tổng quan lộ trình triển khai

```
[Phase 1: Foundation & Database Layer]
                 │
                 ▼
[Phase 2: Authentication & Security (JWT)]
                 │
                 ▼
[Phase 3: Scraper Client & Cloud Storage (S3)]
                 │
                 ▼
[Phase 4: Async Engine & AWS SQS Integration]
                 │
                 ▼
[Phase 5: Generative AI & Script Engine (Spring AI)]
                 │
                 ▼
[Phase 6: Enterprise Hardening, Tests & CI/CD]
```

---

## 📋 Chi tiết các giai đoạn thực hiện

### 🟢 Giai đoạn 1: Nền tảng dự án & Tầng dữ liệu (Foundation & Domain Layer)
* [ ] **1.1. Scaffolding Project:**
  * Khởi tạo dự án Maven/Gradle với **Java 21** và **Spring Boot 3.3+**.
  * Cài đặt dependencies: Spring Data JPA, PostgreSQL Driver, Lombok, Validation, Flyway.
* [ ] **1.2. Domain Models & JPA Entities:**
  * Xây dựng Entity classes theo đúng ERD: `User`, `Category`, `TikTokChannel`, `TikTokVideo`, `AnalysisJob`, `AiScript`, `ScriptReferenceVideo`.
  * Thiết lập quan hệ `@ManyToOne`, `@OneToMany`, `@ManyToMany` kèm khóa ngoại và Index.
* [ ] **1.3. Database Migration:**
  * Cấu hình kết nối PostgreSQL Docker Local (`localhost:5432`).
  * Nạp dữ liệu mẫu ban đầu (Seed data) cho bảng `categories` (Mỹ phẩm, Thời trang, Công nghệ...).
* [ ] **1.4. Verification:** Viết Unit Test cho JPA Repositories để đảm bảo mapping Entity & Query hoạt động chính xác.

---

### 🟢 Giai đoạn 2: Xác thực & Phân quyền (Security & JWT)
* [ ] **2.1. Spring Security 6 Configuration:**
  * Thiết lập `SecurityFilterChain` không lưu trạng thái (Stateless Session).
  * Cấu hình `BCryptPasswordEncoder` để mã hóa mật khẩu an toàn.
* [ ] **2.2. JWT Engine:**
  * Tạo `JwtService` để sinh (sign) và giải mã (verify) Access Token (HS256 hoặc RS256).
  * Viết `JwtAuthenticationFilter` chặn các request đến các endpoint được bảo vệ.
* [ ] **2.3. Auth REST API:**
  * Xây dựng `POST /api/v1/auth/register` (kiểm tra email trùng, cấp 50 credit ban đầu).
  * Xây dựng `POST /api/v1/auth/login` (kiểm tra password, trả về Bearer Token).
* [ ] **2.4. Global Exception Handler:**
  * Chuẩn hóa lỗi bằng `@RestControllerAdvice` (Validation errors, BadCredentials, ResourceNotFound).

---

### 🟢 Giai đoạn 3: Thu thập dữ liệu & Lưu trữ Cloud (Data Ingestion & S3)
* [ ] **3.1. AWS SDK for Java v2 Configuration:**
  * Tạo `AwsConfig.java` cấu hình `S3Client` kết nối LocalStack (Local) hoặc AWS S3 thật.
* [ ] **3.2. S3 Storage Service:**
  * Viết service lưu trữ JSON raw payload: `uploadJsonPayload(String key, Object data)`.
  * Hỗ trợ tạo `Presigned URL` cho frontend tải dữ liệu báo cáo/ảnh.
* [ ] **3.3. Scraper Client (Strategy Pattern):**
  * Định nghĩa interface `TikTokScraperClient` với phương thức `fetchChannelVideos(String username, FilterCriteria criteria)`.
  * **Implementation 1:** `MockTikTokScraperClient` (Phục vụ dev/test độc lập mà không lo bị TikTok rate-limit).
  * **Implementation 2:** `RapidApiTikTokScraperClient` (Gọi HTTP API bên thứ ba bằng Spring `RestClient` / `WebClient`).
* [ ] **3.4. Video Analytics Engine:**
  * Tính toán chỉ số `engagement_rate` tự động khi lưu video vào DB.
  * Lọc ra top video viral nhất dựa trên công thức tương tác.

---

### 🟢 Giai đoạn 4: Kiến trúc bất đồng bộ với AWS SQS (Async Processing)
* [ ] **4.1. SQS Client & Message Queue Setup:**
  * Khởi tạo hàng đợi chính `tiktok-job-queue` và hàng đợi lỗi `tiktok-job-dlq` trên LocalStack / AWS.
* [ ] **4.2. Job Dispatcher (Producer):**
  * Viết `SqsProducerService` để serialize Job DTO thành JSON và bắn vào SQS.
  * API `POST /api/v1/jobs` lưu trạng thái `PENDING` và trả về ngay mã `jobId` trong < 100ms.
* [ ] **4.3. Job Consumer Worker (Listener):**
  * Xây dựng Worker lắng nghe SQS với cơ chế `@Scheduled` hoặc Spring Cloud AWS SQS Listener.
  * Quản lý trạng thái Job: `PENDING` $\rightarrow$ `PROCESSING` $\rightarrow$ `COMPLETED` / `FAILED`.
* [ ] **4.4. Dead-Letter Queue & Error Handling:**
  * Cấu hình retry 3 lần; nếu lỗi vượt quá giới hạn thì đẩy sang DLQ và hoàn lại credit cho User.

---

### 🟢 Giai đoạn 5: Tích hợp Generative AI & Sinh kịch bản (Spring AI)
* [ ] **5.1. Spring AI Configuration:**
  * Cài đặt `spring-ai-starter-model-provider` (hỗ trợ AWS Bedrock Claude 3.5 Sonnet hoặc OpenAI GPT-4o).
  * Thiết lập `ChatClient` với cấu hình nhiệt độ (temperature) tối ưu cho việc sáng tạo nội dung.
* [ ] **5.2. Prompt Engineering:**
  * Thiết kế Prompt Template trích xuất "công thức viral" từ các video top engagement (Hook, Visual, Tone).
  * Thiết kế Prompt Template sinh kịch bản mới 3 phần (Hook 3s, Body, CTA) dành riêng cho ngành hàng người dùng chọn.
* [ ] **5.3. Structured Output Parsing:**
  * Dùng Spring AI `BeanOutputConverter<ScriptOutputDto>` để ép AI trả về đúng cấu trúc JSON chuẩn xác thay vì văn bản tự do.
* [ ] **5.4. Lưu trữ & Quản lý Script:**
  * Lưu kịch bản vào bảng `AI_SCRIPTS` và ghi nhận các video tham khảo vào `SCRIPT_REFERENCE_VIDEOS`.

---

### 🟢 Giai đoạn 6: Hoàn thiện chuẩn Enterprise, Kiểm thử & CI/CD
* [ ] **6.1. Swagger / OpenAPI 3 Documentation:**
  * Tích hợp `springdoc-openapi-starter-webmvc-ui`.
  * Mô tả chi tiết từng Endpoint, Request Body, Schema và mã lỗi tại `/swagger-ui.html`.
* [ ] **6.2. Caching & Rate Limiting:**
  * Cấu hình Redis Cache cho danh mục và thông tin kênh đã cào gần đây để tiết kiệm chi phí scraping.
* [ ] **6.3. Automated Testing:**
  * Unit Testing (JUnit 5 + Mockito) cho tầng Service.
  * Integration Testing với **Testcontainers** (khởi chạy container PostgreSQL và LocalStack tự động khi chạy `mvn test`).
* [ ] **6.4. CI/CD Pipeline:**
  * Viết file `.github/workflows/ci.yml`: Tự động checkout code $\rightarrow$ cài Java 21 $\rightarrow$ chạy test $\rightarrow$ build Docker image.
