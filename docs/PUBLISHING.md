# Phát hành Creator Studio

Bản quyền © 2026 TonyDuongg. Mã nguồn sử dụng [MIT License](../LICENSE); các bản phân phối phải giữ thông báo bản quyền và giấy phép. MIT cho phép cả mục đích thương mại. Xem [thông báo thành phần bên thứ ba](../THIRD-PARTY-NOTICES.md).

## Bản Windows

[Trang tải bản phát hành mới nhất](https://github.com/TonyDuongg/tiktok-content-intelligence/releases/latest).

Mỗi release bao gồm ZIP Windows x64, mã SHA-256, `LICENSE.txt` và hướng dẫn. Người tải không cần tài khoản ứng dụng. Khóa API và dữ liệu riêng không nằm trong tệp phát hành.

Để dựng bản mới trên Windows, cài Node.js 24 và JDK 21, rồi chạy:

```powershell
npm ci
npm --prefix frontend ci
npm run desktop:build
```

Thay đổi `version` trong `package.json` và cập nhật lockfile trước khi phát hành phiên bản mới. Không ghi đè release cũ bằng chương trình khác phiên bản. Kiểm tra `docs/DESKTOP.md` và bản ZIP trước khi tải lên GitHub Releases. Bản hiện tại chưa ký số.

Workflow **Windows release** trong GitHub Actions cho phép dựng lại từ mã nguồn. Mặc định workflow chỉ tạo artifact. Chỉ bật **Publish a new GitHub release** khi muốn tạo bản phát hành công khai mới.

## Bản web trên Railway

Đã chuẩn bị `Dockerfile`, `.dockerignore`, `railway.json` và profile Spring `production`. Repository không chứa khóa API thật. Việc triển khai cần tài khoản hosting đang hoạt động; đây là cấu hình triển khai, không đồng nghĩa website đã online.

1. Tạo project Railway, thêm PostgreSQL.
2. Thêm service từ repository `TonyDuongg/tiktok-content-intelligence`, nhánh `main`, thư mục gốc `/`.
3. Giữ Dockerfile ở gốc project. Image biên dịch React và đưa giao diện vào Spring Boot, nên chỉ cần một service ứng dụng.
4. Đặt các biến môi trường sau trên **service ứng dụng**. Thay `Postgres` bằng đúng tên service database nếu khác:

```text
SPRING_PROFILES_ACTIVE=production
SPRING_DATASOURCE_URL=jdbc:postgresql://${{Postgres.PGHOST}}:${{Postgres.PGPORT}}/${{Postgres.PGDATABASE}}
SPRING_DATASOURCE_USERNAME=${{Postgres.PGUSER}}
SPRING_DATASOURCE_PASSWORD=${{Postgres.PGPASSWORD}}
AI_PROVIDER=gemini
GEMINI_API_KEY=<khóa Gemini của chủ website>
GEMINI_MODEL=<model được khóa API cấp quyền>
SCRAPER_PROVIDER=rapidapi
RAPIDAPI_KEY=<khóa RapidAPI của chủ website>
S3_ARCHIVE_ENABLED=false
SQS_WORKER_ENABLED=false
```

5. Triển khai, chờ `/actuator/health` trả trạng thái `UP`, sau đó dùng **Settings → Networking → Generate Domain** để tạo địa chỉ công khai. Spring tự đọc biến `PORT` của Railway.
6. Kiểm tra danh mục, kho kịch bản, tạo kịch bản và nghiên cứu kênh trên địa chỉ mới.

Không dùng profile `desktop` khi chạy trên hosting: profile đó chỉ lắng nghe trên máy cục bộ và dùng H2. Maven profile `bundle-web` chỉ đóng gói giao diện, khác với runtime profile `production`.

Bản web được thiết kế theo lựa chọn của chủ dự án: **không đăng nhập, dùng chung kho kịch bản và khóa API của máy chủ**. Người truy cập có thể xem và thay đổi trạng thái các kịch bản trong kho chung. Không nhập thông tin cần giữ riêng vào bản public. Chi phí gọi API sử dụng hạn mức của chủ website. Dữ liệu web và dữ liệu bản Windows không tự đồng bộ.

Mọi khóa API phải đặt trong biến môi trường hosting; không đưa vào `VITE_*`, mã frontend, Docker build arguments hoặc commit Git.

## Kiểm tra Docker cục bộ

```powershell
docker build -t creator-studio:latest .
```

Khi chạy container, cung cấp kết nối PostgreSQL và các biến API bằng tệp môi trường riêng hoặc cấu hình môi trường của Docker. Không commit tệp đó. Container phục vụ cả UI và API, mặc định cổng 8080; healthcheck ở `/actuator/health`.
