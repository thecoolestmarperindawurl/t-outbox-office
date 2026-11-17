---
name: design-brief
description: "Viết brief thiết kế và dựng bản thiết kế theo brand: mục đích, kích thước, bố cục, thứ bậc thông tin, nội dung chữ, màu, font, hình ảnh; dựng bằng công cụ sẵn có (Canva nếu kết nối, hoặc SVG/HTML). Dùng cho bộ hình ra mắt, banner, bài đăng, giao diện trang."
argument-hint: "[hạng mục thiết kế, kênh, kích thước]"
---

Skill của phòng Sản phẩm & Thiết kế (người dùng chính: `t-outbox:designer`). Việc cần làm:

$ARGUMENTS

Mục tiêu: Ra bộ thiết kế đúng brand, hoặc brief đủ chi tiết để người khác dựng được ngay. Nếu phần việc ở trên trống, dùng bối cảnh của lượt giao việc hiện tại.

## Đầu vào cần có

- Brand guideline (màu, font, logo, giọng hình ảnh)
- Nội dung chữ từ Marketing, phạm vi từ brief sản phẩm
- Kênh dùng và kích thước

Thiếu đầu vào thì đặt giả định hợp lý, ghi rõ trong sản phẩm, rồi làm tiếp. Chỉ hỏi lại khi câu trả lời làm đổi hẳn hướng làm.

## Các bước

1. Đọc brand guideline. Không có thì đề xuất hệ màu, font kèm lý do.
2. Liệt kê hạng mục: tên, kênh, kích thước, mục đích, nội dung chữ chính xác.
3. Phác bố cục cho từng hạng mục: thứ bậc thông tin (người xem thấy gì đầu tiên), vùng an toàn của nền tảng.
4. Dựng bằng công cụ sẵn có: Canva nếu phiên có kết nối, nếu không thì SVG hoặc HTML/CSS lưu file.
5. Kiểm tra: độ tương phản chữ, chữ không bị cắt, khoảng thở, đọc được trên điện thoại.
6. Không dùng hình ảnh, logo hay chân dung không có quyền sử dụng.

## Đầu ra

Lưu vào `deliverables/product/brief-hinh-anh.md` (tạo thư mục nếu chưa có), theo khung:

```markdown
# Thiết kế: <bộ>
## Hệ nhận diện dùng
## Danh sách hạng mục (bảng: tên, kênh, kích thước, mục đích)
## Bố cục và nội dung từng hạng mục
## File đã dựng
## Việc còn lại / cần tài nguyên
```

## Tự soát trước khi nộp

- [ ] Đúng màu, font của brand
- [ ] Tương phản chữ đủ đọc
- [ ] Đủ kích thước cho từng kênh
- [ ] Không dùng tài sản không có quyền
- [ ] Đúng phạm vi việc được giao, không lan sang việc khác

## Nguyên tắc dữ liệu

Mỗi con số, nhận định quan trọng phải ghi rõ là **dữ liệu có nguồn** (kèm link, ngày), **ước tính** (kèm cách tính) hay **ý kiến đề xuất**. Không có dữ liệu thì ghi "chưa có dữ liệu, cần kiểm chứng", không tự đặt số.

Khi báo cáo lại cho người giao việc: nêu đường dẫn file, 3 điểm chính, các giả định và việc còn mở.
