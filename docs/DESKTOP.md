# Creator Studio cho Windows

Bản portable dành cho **Windows 10/11 x64**. Giải nén toàn bộ ZIP, mở `Creator Studio.exe`. Không cần cài Java, Node.js, PostgreSQL hay Docker. Không cần đăng nhập ứng dụng.

## Lần đầu sử dụng

1. Giải nén `Creator-Studio-1.0.1-Windows-x64.zip` vào một thư mục có quyền đọc và ghi. Không chạy trực tiếp bên trong ZIP.
2. Mở `Creator Studio.exe`. Cửa sổ Cài đặt cho phép nhập khóa Gemini và RapidAPI của bạn. Có thể chọn **Để sau** rồi bổ sung bằng nút **Cài đặt** hoặc `Ctrl+,`.
3. Khóa Gemini cần được cấp quyền sử dụng model đã chọn. RapidAPI cần đăng ký dịch vụ `tiktok-scraper7.p.rapidapi.com`. Phí, hạn mức và quyền truy cập do nhà cung cấp quy định.
4. Khi lưu thay đổi, ứng dụng tự kết nối lại dịch vụ trên máy. Không đổi cài đặt khi đang tạo kịch bản hoặc phân tích kênh.

Tạo kịch bản và nghiên cứu TikTok cần Internet. Xem lại kho kịch bản đã lưu không cần gọi dịch vụ AI. Bản phát hành không chứa khóa API hay dữ liệu cá nhân của người phát triển.

Giao diện máy tính vừa khung cửa sổ, nút tạo kịch bản luôn ở đáy bảng thiết lập. Kịch bản dài, danh sách và các tùy chọn mở rộng cuộn trong vùng riêng. Khi cửa sổ hẹp, dùng **Thiết lập / Kịch bản** để chuyển vùng làm việc. Bản web vẫn dùng bố cục thích ứng theo màn hình.

## Dữ liệu và sao lưu

Thư mục lưu là `%APPDATA%\Creator Studio`, mở từ **Cài đặt → Thư mục dữ liệu** hoặc menu **Ứng dụng**.

- `data/creator-studio.mv.db`: kịch bản, video tham khảo và thông tin kênh đã lưu.
- `settings.json`: model và khóa API đã mã hóa bằng cơ chế của Windows. Không sửa thủ công; khóa đã mã hóa chỉ đọc được trong tài khoản Windows tương ứng.
- `server-port.txt`: cổng dịch vụ cục bộ. Giữ nguyên để bảo toàn địa chỉ lưu bản nhập.
- `logs/backend.log`: nhật ký vận hành, tối đa khoảng 5 MB trước khi chuyển sang tệp dự phòng.
- Các thư mục Chromium: bản nhập tự lưu và thiết lập cửa sổ.

Để sao lưu, **đóng ứng dụng trước**, rồi sao chép thư mục dữ liệu. Để chuyển thư viện sang máy khác, chạy và đóng ứng dụng ở máy mới, sao chép thư mục `data` vào cùng vị trí ở máy đó, sau đó mở lại và nhập khóa API của máy mới. Không ghi đè thư viện đã có ở máy đích nếu chưa sao lưu. Bản portable này dùng thư viện H2 riêng, không tự chuyển dữ liệu từ PostgreSQL của bản web.

Cập nhật phiên bản bằng cách đóng ứng dụng, giải nén ZIP mới vào thư mục khác và chạy bản mới. Thư mục dữ liệu nằm ngoài bộ ứng dụng nên vẫn được giữ. Phiên bản này chưa có tự động cập nhật.

## Xử lý sự cố

- Bản hiện tại chưa có chứng chỉ ký mã. Windows có thể hiển thị thông báo về nhà phát hành chưa được xác minh; chỉ sử dụng tệp từ nguồn bạn tin cậy.
- Nếu ứng dụng không mở, kiểm tra đã giải nén **toàn bộ** ZIP và tệp `resources/java/bin/java.exe` vẫn tồn tại. Xem nhật ký trong thư mục dữ liệu.
- Khi thư mục ứng dụng có dấu tiếng Việt, ứng dụng tạo bộ đệm Java riêng trong `%TEMP%/creator-studio-runtime`. Nếu cả đường dẫn tạm Windows có dấu và Java không mở được, giải nén vào thư mục không dấu như `D:\CreatorStudio`. Bộ đệm chỉ chứa thành phần chạy, không chứa khóa API hay thư viện kịch bản.
- Nếu Gemini báo lỗi, kiểm tra khóa, quyền truy cập model và hạn mức tại Google AI Studio. Khóa được điền không đồng nghĩa nhà cung cấp đã xác thực thành công.
- Nếu dữ liệu TikTok không tải, kiểm tra gói RapidAPI và kết nối mạng.
- Ứng dụng chỉ mở dịch vụ trên `127.0.0.1`; không dùng làm máy chủ chia sẻ trong mạng.

## Tự tạo bản phát hành từ mã nguồn

Máy dựng cần Windows x64, Node.js 22+ và JDK 21. Máy sử dụng bản phát hành không cần các công cụ này.

```powershell
npm ci
npm --prefix frontend ci
npm test
npm run desktop:build
```

Kết quả: `release/Creator-Studio-1.0.1-Windows-x64.zip`. Lệnh kiểm tra frontend, biên dịch và kiểm tra backend, tải JRE Eclipse Temurin đã ghim SHA-256, tạo biểu tượng và đóng gói Electron. Cấu hình build chỉ cho phép đưa các tệp chạy cần thiết vào ứng dụng, không sao chép `.env`, cơ sở dữ liệu hay nhật ký. Lệnh build luôn đặt `--publish never`.

`npm run desktop:dev` chạy thử sau `npm run desktop:prepare`. Có thể đặt `CREATOR_STUDIO_DATA_DIR` trỏ tới thư mục thử nghiệm riêng để không ảnh hưởng dữ liệu sử dụng. Java kèm giấy phép và các thông báo pháp lý trong `resources/java`; font Be Vietnam Pro kèm OFL.
