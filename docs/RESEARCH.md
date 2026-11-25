# Hồ sơ khách hàng và nghiên cứu kênh

## Sử dụng

1. Vào **Nghiên cứu kênh → Hồ sơ của tôi**. Lưu tên hồ sơ, kênh TikTok của bạn, tệp mục tiêu, giá trị cung cấp, mục tiêu và từ khóa. Có thể lưu nhiều hồ sơ cho các sản phẩm hoặc nhóm khách hàng khác nhau.
2. Nhập 1–15 từ/cụm từ về nhu cầu và nội dung, phân cách bằng dấu phẩy, dấu chấm phẩy hoặc xuống dòng. Mỗi cụm dài 2–80 ký tự. Thêm từ đồng nghĩa, tên sản phẩm và hashtag viết liền khi cần. Có thể cấu hình từ khóa muốn tránh.
3. Phân tích một kênh TikTok công khai hoặc chọn **Mở kênh đã lưu**. Mở bản đã lưu không gọi lại RapidAPI. Chọn **Đổi kênh / Cập nhật** rồi **Phân tích kênh** để thu thập lại; thao tác này sử dụng hạn mức RapidAPI.
4. Vào **Khách hàng & xu hướng**, chọn hồ sơ để xem mức liên quan nội dung, bằng chứng, nhóm hashtag và các thử nghiệm video đề xuất. Nút **Dùng để viết kịch bản** điền chủ đề, khách hàng mục tiêu, thời lượng và một video tham khảo vào bản nhập; chưa tự gọi Gemini.
5. Có thể tải báo cáo JSON. Ghi chú từ TikTok Studio do bạn tự nhập được giữ trong hồ sơ, không được dùng để suy nhân khẩu học của kênh khác.

Hồ sơ, kênh và mốc đo được lưu trong database: bản Windows lưu trên máy, bản web dùng cùng thư viện cho mọi người truy cập và không có đăng nhập. Hồ sơ không chứa mật khẩu TikTok, cookie đăng nhập hay quyền truy cập Analytics của người khác. Dữ liệu giữa Windows và web không tự đồng bộ.

## Cách tính

- Mẫu phân tích gồm tối đa 50 video đã lưu theo ngày đăng giảm dần. Không đảm bảo bao phủ toàn bộ kênh hoặc cùng thời điểm cập nhật cho mọi video; video cũ đã lưu có thể vẫn nằm trong mẫu.
- Nội dung đọc được là mô tả, hashtag hoặc bản chép lời có sẵn từ nguồn dữ liệu. Tool không tự xem hình ảnh, nghe âm thanh, tải bình luận hay nhận diện người xem.
- So khớp không phân biệt hoa thường và dấu tiếng Việt, theo ranh giới từ/cụm từ. Không có mô hình ngữ nghĩa hoặc nhận diện từ đồng nghĩa. Một video khớp khi chứa ít nhất một từ khóa.
- Tỷ lệ khớp = số video khớp / số video có nội dung đọc được × 100%, làm tròn đến số nguyên. Không công bố tỷ lệ khi có ít hơn ba video đọc được. Mẫu dưới 10 video được nhắc là còn ít dữ liệu.
- Từ khóa muốn tránh được báo riêng; video chứa chúng không được chọn làm thử nghiệm. Chúng không làm thay đổi công thức tỷ lệ khớp.
- Hashtag cụ thể phải xuất hiện ở ít nhất hai video. Mỗi hashtag chỉ tính một lần/video; bỏ các nhãn chung như `fyp`, `viral`, `xuhuong`. Các nhóm này chỉ gợi ý mối quan tâm qua nội dung, không xác nhận người xem.
- Nhóm thời lượng: đến 30 giây, 31–60 giây, trên 60 giây; dùng trung vị lượt xem tích lũy. Chênh lệch có thể đến từ tuổi video, chủ đề và các yếu tố khác; không chứng minh thời lượng gây hiệu suất tốt.
- Mỗi lần thu thập lưu một mốc lượt xem cho từng video có bộ đếm hợp lệ. Tăng trưởng dùng các mốc trong 30 ngày gần nhất: mốc cuối và mốc gần nhất trước nó ít nhất một giờ. Lượt xem/giờ = chênh lệch bộ đếm / số giờ thực tế. Bỏ trường hợp bộ đếm giảm; không ngoại suy từ tổng lượt xem hoặc ngày đăng. Lịch đo không tự chạy nền: cần cập nhật kênh ở các thời điểm khác nhau.
- Thử nghiệm ưu tiên video khớp mục tiêu, không chứa từ khóa cần tránh, có tốc độ tăng quan sát được cao hơn; nếu chưa có mốc đo thì tham khảo lượt xem tích lũy. Tối đa ba từ khóa khác nhau, không sao chép lời thoại gốc. Đánh giá A/B sau cùng thời gian đăng trong TikTok Studio của bạn.

## Có thể xem tệp người xem của kênh khác không?

Với nguồn công khai đang tích hợp, tool không có số liệu tuổi, giới tính, nơi ở, thu nhập, giữ chân hay chuyển đổi của người xem kênh khác. TikTok Display API công bố các trường video và bộ đếm như lượt xem, thích, chia sẻ, bình luận, không phải một hồ sơ khách hàng xác thực. Muốn đối chiếu nhân khẩu học thực tế cần dữ liệu Analytics do chủ kênh có quyền truy cập chia sẻ.

[Video Object của TikTok](https://developers.tiktok.com/doc/tiktok-api-v2-video-object/) · [TikTok Studio](https://support.tiktok.com/en/using-tiktok/creating-videos/tiktok-studio)

## Có dự đoán video lên xu hướng được không?

Chưa có mô hình dự báo đã hiệu chuẩn hoặc kiểm chứng hồi cứu. Tool không công bố xác suất viral, số lượt xem tương lai, nhạc đang thịnh hành toàn nền tảng hay giờ đăng tối ưu. Báo cáo dùng bằng chứng trong mẫu để đề xuất thử nghiệm có mục tiêu. TikTok cho biết đề xuất còn phụ thuộc hành vi người dùng, thời gian xem, thông tin nội dung và nhiều yếu tố mà nguồn hiện tại không cung cấp đầy đủ.

[Cách TikTok đề xuất nội dung](https://support.tiktok.com/en/using-tiktok/exploring-videos/how-tiktok-recommends-content)

## API

- `GET/POST /api/v1/research-profiles`: danh sách/tạo hồ sơ.
- `PUT/DELETE /api/v1/research-profiles/{id}`: sửa/xóa hồ sơ. Xóa không xóa kênh hoặc kịch bản.
- `GET /api/v1/channels`: các kênh đã lưu, mới thu thập trước.
- `GET /api/v1/channels/{username}/insights?profileId={id}`: báo cáo từ dữ liệu đã lưu, không gọi nhà cung cấp bên ngoài.

Hai bảng mới `research_profiles` và `video_observations` được thêm bằng cấu hình schema update hiện tại. Không xóa hoặc thay đổi các kịch bản/kênh cũ. Sao lưu database khi đóng app trước khi cập nhật theo hướng dẫn Windows.
