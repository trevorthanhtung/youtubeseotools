# Youtube SEO Tools

Youtube SEO Tools là ứng dụng web lưu trữ cục bộ, hỗ trợ tạo bộ SEO cho video YouTube bằng HTML, CSS và JavaScript thuần. Ứng dụng không dùng npm, máy chủ hoặc API ngoài; toàn bộ dữ liệu được lưu bằng `localStorage` trên trình duyệt.

## Cách mở ứng dụng

- Cách nhanh: double click `index.html`.
- Cách dành cho chỉnh sửa: mở thư mục bằng VS Code và chạy bằng Live Server.
- Để dùng như ứng dụng web có thể mở ngoại tuyến: mở bằng `http://localhost` hoặc Live Server, sau đó cài đặt từ trình duyệt nếu cần. Service Worker không chạy ổn định khi mở trực tiếp bằng `file://`.

## Tính năng

- Tổng quan thống kê số bộ SEO đã tạo, bộ cần tối ưu và từ khóa được dùng nhiều nhất.
- Biểu mẫu tạo bộ SEO theo chủ đề, loại video, từ khóa, đối tượng xem và giọng điệu nội dung.
- Bộ tạo nội dung mẫu gồm 10 tiêu đề, mô tả SEO, hashtag, thẻ từ khóa, câu chữ ảnh bìa, câu mở đầu, bình luận ghim, mô tả video ngắn và danh sách kiểm tra.
- Điểm SEO `/100` dựa trên nguyên tắc chính thống, ưu tiên tiêu đề, ảnh bìa, mô tả, tỷ lệ giữ chân và độ an toàn chống spam; thẻ từ khóa chỉ là tín hiệu phụ.
- Mục đã lưu cho phép xem lại, xóa, sao chép từng phần và xuất file `.txt`.
- Kho từ khóa cho phép tạo nhóm theo ngách nội dung, thêm/xóa từ khóa và lưu cục bộ.
- Chế độ sáng/tối, giao diện ưu tiên thiết bị di động, thanh bên trên máy tính và điều hướng dưới trên điện thoại.
- Tệp cấu hình ứng dụng web, biểu tượng cục bộ và Service Worker giúp mở lại khi ngoại tuyến.

## Cơ sở SEO

Logic SEO trong ứng dụng là phương án tối ưu theo nguyên tắc chính thống từ tài liệu hỗ trợ của YouTube:

- Tiêu đề và ảnh bìa là tín hiệu người xem thấy đầu tiên, nên điểm đánh giá ưu tiên tính chính xác, độ ngắn gọn, từ khóa xuất hiện sớm và câu chữ ảnh bìa dễ đọc.
- Mô tả nên có từ khóa/chủ đề ở vài dòng đầu, viết tự nhiên, khác biệt và có lời kêu gọi hành động phù hợp.
- Hashtag nên ngắn gọn, liên quan; tối đa 3 hashtag nổi bật là đủ cho phần hiển thị.
- Thẻ từ khóa có vai trò nhỏ hơn tiêu đề, ảnh bìa và mô tả; hữu ích nhất khi có biến thể hoặc từ dễ viết sai.
- Không có công cụ nào bảo đảm “lên top”; sau khi đăng vẫn cần theo dõi tỷ lệ nhấp, tỷ lệ giữ chân và tối ưu bằng YouTube Analytics.

## Lưu ý

- App chạy hoàn toàn offline sau khi mở file.
- Dữ liệu nằm trong `localStorage` của trình duyệt hiện tại, nên đổi trình duyệt hoặc xóa site data sẽ không thấy dữ liệu cũ.
