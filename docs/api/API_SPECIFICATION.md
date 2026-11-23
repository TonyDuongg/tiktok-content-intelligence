# RESTful API Specification (OpenAPI 3.0 Standard)
## TikTok Content Intelligence & AI Script Generator

Mọi phản hồi từ API đều được chuẩn hóa theo định dạng **JSend / Standard Envelope**:
```json
{
  "success": true,
  "message": "Thông báo trạng thái",
  "data": { ... },
  "timestamp": "2026-11-23T23:45:00Z"
}
```

---

## 1. Authentication & User (`/api/v1/auth`)

### 1.1. Đăng ký tài khoản mới
* **Endpoint:** `POST /api/v1/auth/register`
* **Public:** Yes
* **Request Body:**
```json
{
  "email": "creator@example.com",
  "password": "SecurePassword123@",
  "fullName": "Nguyen Van A"
}
```
* **Response (201 Created):**
```json
{
  "success": true,
  "message": "Đăng ký thành công",
  "data": {
    "userId": "d3b07384-d113-4a11-8e3b-9a48d867c4d5",
    "email": "creator@example.com",
    "fullName": "Nguyen Van A",
    "creditsBalance": 50
  }
}
```

### 1.2. Đăng nhập lấy JWT Token
* **Endpoint:** `POST /api/v1/auth/login`
* **Public:** Yes
* **Request Body:**
```json
{
  "email": "creator@example.com",
  "password": "SecurePassword123@"
}
```
* **Response (200 OK):**
```json
{
  "success": true,
  "message": "Đăng nhập thành công",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenType": "Bearer",
    "expiresIn": 86400,
    "user": {
      "id": "d3b07384-d113-4a11-8e3b-9a48d867c4d5",
      "email": "creator@example.com",
      "creditsBalance": 50,
      "role": "ROLE_USER"
    }
  }
}
```

---

## 2. Categories / Niches (`/api/v1/categories`)

### 2.1. Lấy danh sách các ngành hàng hỗ trợ
* **Endpoint:** `GET /api/v1/categories`
* **Headers:** `Authorization: Bearer <token>`
* **Response (200 OK):**
```json
{
  "success": true,
  "data": [
    { "id": 1, "name": "Mỹ phẩm & Skincare", "slug": "my-pham-skincare" },
    { "id": 2, "name": "Thời trang & Phối đồ", "slug": "thoi-trang-phoi-do" },
    { "id": 3, "name": "Công nghệ & Setup", "slug": "cong-nghe-setup" }
  ]
}
```

---

## 3. Analysis & Generation Jobs (`/api/v1/jobs`)

### 3.1. Khởi tạo tác vụ phân tích & sinh kịch bản (Async Dispatch)
* **Endpoint:** `POST /api/v1/jobs`
* **Headers:** `Authorization: Bearer <token>`
* **Request Body:**
```json
{
  "jobType": "ANALYZE_AND_GENERATE_SCRIPT",
  "filterParams": {
    "categoryId": 1,
    "nicheKeyword": "review kem chống nắng",
    "targetChannels": ["beautytips_vn", "skincare_guru"],
    "minViews": 50000,
    "dateRangeDays": 30,
    "tone": "Chân thực, cảnh báo, giáo dục người xem",
    "targetAudience": "Phụ nữ 20-30 tuổi da dầu nhạy cảm"
  }
}
```
* **Response (202 Accepted):**
```json
{
  "success": true,
  "message": "Tác vụ đã được tiếp nhận và đưa vào hàng đợi xử lý",
  "data": {
    "jobId": "e4a11589-3df2-4822-92bb-182312d8a6ef",
    "status": "PENDING",
    "estimatedWaitSeconds": 30,
    "createdAt": "2026-11-23T23:45:00Z"
  }
}
```

### 3.2. Kiểm tra tiến trình & trạng thái Job (Polling Status)
* **Endpoint:** `GET /api/v1/jobs/{jobId}`
* **Headers:** `Authorization: Bearer <token>`
* **Response (200 OK - Khi đang xử lý):**
```json
{
  "success": true,
  "data": {
    "jobId": "e4a11589-3df2-4822-92bb-182312d8a6ef",
    "status": "PROCESSING",
    "startedAt": "2026-11-23T23:45:02Z",
    "completedAt": null
  }
}
```
* **Response (200 OK - Khi đã hoàn thành):**
```json
{
  "success": true,
  "data": {
    "jobId": "e4a11589-3df2-4822-92bb-182312d8a6ef",
    "status": "COMPLETED",
    "startedAt": "2026-11-23T23:45:02Z",
    "completedAt": "2026-11-23T23:45:28Z",
    "result": {
      "scriptId": 42,
      "videosAnalyzedCount": 15,
      "topEngagementScore": 8.45,
      "s3RawDataUrl": "s3://tiktok-intelligence-bucket/jobs/e4a11589-3df2-4822-92bb-182312d8a6ef/raw.json"
    }
  }
}
```

---

## 4. AI Scripts Management (`/api/v1/scripts`)

### 4.1. Lấy chi tiết kịch bản video do AI sáng tạo
* **Endpoint:** `GET /api/v1/scripts/{scriptId}`
* **Headers:** `Authorization: Bearer <token>`
* **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 42,
    "title": "3 Sai lầm chết người khi thoa kem chống nắng khiến da sạm đen",
    "targetAudience": "Phụ nữ 20-30 tuổi da dầu nhạy cảm",
    "estimatedDurationSeconds": 35,
    "scriptStructure": {
      "hook3s": "Đừng bao giờ thoa kem chống nắng trực tiếp lên da khô nếu bạn không muốn mặt mình mốc xì và nổi mụn!",
      "bodyContent": "Rất nhiều bạn nghĩ cứ bôi càng dày càng tốt. Nhưng sai lầm số 1 là không dưỡng ẩm lót. Sai lầm số 2 là thoa miết thay vì vỗ nhẹ, khiến lớp màng chống nắng bị vỡ tan tành...",
      "callToAction": "Lưu video này lại để kiểm tra xem bạn có đang mắc phải 1 trong 3 lỗi này không. Đừng quên follow để dưỡng da chuẩn y khoa nhé!"
    },
    "visualAndSoundCues": "Góc quay cận cảnh texture kem bị vón cục trên da; nhạc nền suspense mở đầu sau đó chuyển sang beat lofi hiện đại.",
    "suggestedHashtags": ["#kemchongnang", "#skincaretips", "#chamsocda", "#reviewmypham"],
    "aiModelUsed": "claude-3-5-sonnet",
    "referenceVideos": [
      {
        "tiktokVideoId": "734281928471928",
        "videoUrl": "https://tiktok.com/@beautytips_vn/video/734281928471928",
        "viewCount": 1250000,
        "engagementRate": 8.45,
        "insightNote": "Học theo hook mở đầu cảnh báo nguy cơ thường gặp"
      }
    ],
    "createdAt": "2026-11-23T23:45:28Z"
  }
}
```

### 4.2. Cập nhật trạng thái kịch bản (Đánh dấu Yêu thích / Lưu trữ)
* **Endpoint:** `PATCH /api/v1/scripts/{scriptId}/status`
* **Headers:** `Authorization: Bearer <token>`
* **Request Body:**
```json
{
  "status": "FAVORITE"
}
```
