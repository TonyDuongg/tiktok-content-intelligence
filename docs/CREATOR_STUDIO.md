# Creator Studio

## Luồng làm việc

1. **Nghiên cứu kênh:** nhập `@username` hoặc link hồ sơ đầy đủ, chọn lĩnh vực và lấy 10, 20 hoặc 50 video. Xếp hạng chỉ áp dụng cho số video đã thu thập, không phải toàn bộ TikTok.
2. **Tham khảo:** chọn tối đa 5 video. Các ID video được gửi vào backend, đưa vào prompt và lưu cùng kịch bản. Chủ đề bạn nhập vẫn là yêu cầu chính.
   Nguồn scraping hiện trả caption và số liệu; caption không được coi là transcript lời nói. Bạn có thể mở video gốc để tự xem thêm cách quay và kể chuyện.
3. **Xưởng kịch bản:** điền chủ đề, người xem, giọng điệu và thời lượng video. Chọn nhanh 15, 30, 60 giây, 2 hoặc 3 phút; mục Tùy chỉnh cho nhập theo giây/phút, từ 15 giây đến 10 phút (hỗ trợ 1,5 phút = 90 giây). Lựa chọn được giữ trong bản nhập dở.
   AI nhận ngân sách lời thoại và mốc quay theo thời lượng, gồm mở đầu, nội dung và CTA. Kết quả lưu riêng `requestedDurationSeconds` (mục tiêu) và `estimatedDurationSeconds` (AI ước tính); bản xuất `.txt` có cả hai. Kịch bản cũ chưa có mục tiêu vẫn mở được. Thời gian quay thực phụ thuộc nhịp nói và chuyển cảnh, nên cần đọc thử.
4. **Kho kịch bản:** tìm theo tiêu đề/người xem; lọc bản nháp, yêu thích, lưu trữ; mở lại, khôi phục, sao chép hoặc tải `.txt` từ màn hình chi tiết.

## Kết nối dữ liệu thật

- `SCRAPER_PROVIDER=rapidapi`: cần `RAPIDAPI_KEY`. Thiếu khóa hoặc nhà cung cấp lỗi sẽ trả lỗi có thể thử lại; không thay dữ liệu thật bằng số liệu mẫu.
- `AI_PROVIDER=gemini`: cần `GEMINI_API_KEY`; model lấy từ `GEMINI_MODEL` (mặc định `gemini-3.5-flash`). Có thể chọn `bedrock` khi đã cấu hình AWS tương ứng.
- Gemini/Bedrock lỗi, hết quota hoặc trả nội dung không đầy đủ sẽ báo lỗi; không tạo và không lưu khung minh họa thay thế.
- Gemini có tối đa 120 giây để phản hồi; web chờ 150 giây để nhận cả thông báo lỗi từ backend. Không tự gửi lại yêu cầu khi hết giờ, tránh phát sinh thêm lượt gọi AI. Log ghi thời gian xử lý, không ghi khóa API hay nội dung brief.
- `POST /api/v1/scripts/generate` nhận `requestedDurationSeconds` là số nguyên 15–600; thiếu trường này dùng 60 giây để tương thích client cũ. Schema đang dùng Hibernate `ddl-auto: update`, tự thêm cột nullable `requested_duration_seconds` mà không sửa các kịch bản cũ. DDL cho database mới đã cập nhật ở `docs/database/schema.sql`.
- Các lớp mock chỉ được nạp trong profile `test`. Ứng dụng thông thường không có lựa chọn chế độ mẫu.
- `GET /api/v1/workspace/status` cung cấp trạng thái nguồn dữ liệu, không trả khóa API. Trạng thái cấu hình không thay thế kiểm tra sức khỏe của nhà cung cấp.
- Chạy `start.bat` hoặc `./start.ps1`: launcher đọc `.env`, kiểm tra cấu hình nhà cung cấp thực, khởi động dịch vụ ẩn và lưu log ở `logs/`. Có thể dùng `./start.ps1 -NoBrowser` nếu không muốn tự mở trình duyệt.
- Luồng web trực tiếp không cần AWS. Chỉ bật `S3_ARCHIVE_ENABLED=true` hoặc `SQS_WORKER_ENABLED=true` khi đã cấu hình dịch vụ AWS tương ứng. LocalStack là hạ tầng phát triển tùy chọn trong Compose profile `aws-local`, không nằm trong luồng khởi động mặc định.

## Lưu dữ liệu

- Brief nhập dở lưu trên trình duyệt bằng localStorage; không chứa khóa API. Máy/trình duyệt khác sẽ có brief riêng.
- Profile `local` dùng H2 lưu trên đĩa ở `backend/data/creator-studio`, giữ lại dữ liệu khi backend khởi động lại. Thư mục này đã được loại khỏi Git. Khi Docker chạy, launcher dùng PostgreSQL theo cấu hình hiện có.
- PostgreSQL Docker của project dùng cổng host `15432`, tránh xung đột PostgreSQL cài sẵn trên máy. URL mặc định: `jdbc:postgresql://127.0.0.1:15432/tiktok_intelligence`; có thể thay bằng `SPRING_DATASOURCE_URL`.
- Tool dùng một kho kịch bản và lịch sử job chung, không có đăng ký, đăng nhập hay phiên người dùng. Frontend không đọc token cũ và không gửi thông tin xác thực; header Authorization của client cũ không chặn hoặc chuyển kho làm việc. Các đường dẫn `/api/v1/auth/*` không còn được cung cấp.
- Bản ghi chủ sở hữu nội bộ và các khóa ngoại hiện có được giữ để bảo toàn dữ liệu. Đây là định danh lưu trữ của workspace, không phải tài khoản đăng nhập. Không cần cấu hình JWT hay tạo tài khoản để chạy tool.
- Sau lỗi hết thời gian chờ khi tạo, làm mới kho trước khi thử lại: backend có thể đã hoàn tất yêu cầu.

## Kiểm tra

```powershell
cd frontend
npm ci
npm run lint
npm test
npm run build
cd ../backend
.\mvnw.cmd verify
```

CI chạy kiểm tra frontend và backend. Test tự động dùng profile `test`, H2 trong bộ nhớ và các mock riêng; không gọi AI trả phí. Kiểm tra kết nối thật dùng các khóa từ `.env`, không in chúng ra log.

Các test hồi quy bao gồm mở kho/tạo/đọc/cập nhật kịch bản không cần token, bỏ qua header xác thực cũ, API đăng nhập không tồn tại, giới hạn người xem 300 ký tự qua database, kiểu số nguyên của thời lượng AI, lỗi HTTP 400/404/405/415 và chặn lĩnh vực không tồn tại trước khi gọi scraper.

## Những phần cần hoàn thiện trước khi mở rộng

- Luồng SQS hiện tắt mặc định và chưa được kiểm thử end-to-end với AWS trong bộ CI. Worker cần chống xử lý/hoàn credit trùng, tách transaction khỏi các lời gọi nội bộ cùng bean, điều phối gửi queue sau khi lưu DB và xử lý riêng từng `jobType`. Các bộ lọc `minViews`, `dateRangeDays`, `nicheKeyword` đang có trong request nhưng chưa được áp dụng đầy đủ vào worker.
- Tool được thiết kế dùng trực tiếp với một workspace chung. Có thể bổ sung hạn mức đồng thời, bộ nhớ đệm và ngân sách AI/scraper cho toàn tool để kiểm soát lượt gọi, không cần cơ chế tài khoản. Thông báo 429 ở frontend hiện chỉ là xử lý phản hồi lỗi, chưa phải giới hạn được triển khai ở backend.
- Kho hiện tải toàn bộ kịch bản rồi phân trang trên trình duyệt; backend truy vấn video tham khảo theo từng kịch bản. Khi kho lớn, cần phân trang/tìm kiếm phía server và tải chi tiết khi mở.
- Nếu nguồn TikTok thiếu `create_time`, scraper hiện thay bằng thời gian thu thập (`Instant.now()`), chưa phản ánh đúng ngày đăng gốc. Cần giữ trạng thái không xác định và thêm test phản hồi thiếu trường này trước khi dùng bộ lọc ngày hoặc thống kê theo thời gian.
- Thời lượng là mục tiêu trong prompt, chưa có bộ kiểm tra đầy đủ mốc quay/độ dài lời thoại. JSON hợp lệ không chứng minh nội dung chính xác: vẫn cần biên tập, kiểm chứng các tuyên bố/số liệu AI tạo ra. Nên bổ sung sửa kịch bản và lưu phiên bản trước khi xuất.
- Test database tự động hiện dùng H2, chưa thay thế kiểm thử PostgreSQL, migration, tải đồng thời, refresh giữa lúc tạo kịch bản hoặc Bedrock/SQS/S3 thật.
