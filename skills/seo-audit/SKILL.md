---
name: seo-audit
description: "Nghiên cứu từ khóa theo ý định tìm kiếm và rà soát SEO on-page cho trang hoặc website: tiêu đề, mô tả, heading, cấu trúc nội dung, liên kết nội bộ, kỹ thuật cơ bản. Dùng khi cần kế hoạch từ khóa, tối ưu bài viết hoặc kiểm tra SEO một trang."
argument-hint: "[trang/URL hoặc chủ đề cần làm SEO]"
---

Skill của phòng Marketing (người dùng chính: `t-outbox:seo-specialist`). Việc cần làm:

$ARGUMENTS

Mục tiêu: Chỉ ra từ khóa nên nhắm và những sửa đổi on-page có tác động lớn nhất, xếp theo thứ tự ưu tiên. Nếu phần việc ở trên trống, dùng bối cảnh của lượt giao việc hiện tại.

## Đầu vào cần có

- Trang hoặc file cần rà (trong dự án hoặc URL)
- Sản phẩm, khách hàng mục tiêu, thị trường/ngôn ngữ
- Công cụ dữ liệu từ khóa nếu phiên làm việc có kết nối

Thiếu đầu vào thì đặt giả định hợp lý, ghi rõ trong sản phẩm, rồi làm tiếp. Chỉ hỏi lại khi câu trả lời làm đổi hẳn hướng làm.

## Các bước

1. Nhóm từ khóa theo ý định: tìm hiểu, so sánh, mua, điều hướng. Mỗi trang nhắm một ý định chính.
2. Lượng tìm kiếm và độ khó chỉ ghi khi có công cụ dữ liệu; không có thì xếp hạng ưu tiên theo mức liên quan và ghi "chưa có số liệu lượng tìm kiếm".
3. Rà on-page: title (độ dài, từ khóa ở đầu), meta description, một H1, cấu trúc H2/H3, đoạn mở trả lời ngay câu hỏi, ảnh có alt, liên kết nội bộ, URL.
4. Rà kỹ thuật cơ bản nếu có mã nguồn: thẻ canonical, robots, sitemap, dữ liệu có cấu trúc, tốc độ tải (ghi điều quan sát được).
5. Đề xuất sửa bằng văn bản thay thế cụ thể (title mới, heading mới), không chỉ nhận xét.
6. Xếp ưu tiên: tác động cao, công sức thấp làm trước.

## Đầu ra

Lưu vào `deliverables/marketing/seo-audit.md` (tạo thư mục nếu chưa có), theo khung:

```markdown
# SEO: <trang/chủ đề>
## Bộ từ khóa theo ý định (bảng: từ khóa, ý định, trang nhắm, ghi chú dữ liệu)
## Rà soát on-page (bảng: hạng mục, hiện trạng, đề xuất, ưu tiên)
## Kỹ thuật
## Việc làm ngay (top 5)
```

## Tự soát trước khi nộp

- [ ] Không có số liệu lượng tìm kiếm tự đặt
- [ ] Mỗi lỗi có đề xuất sửa cụ thể
- [ ] Không đề xuất nhồi từ khóa
- [ ] Đúng phạm vi việc được giao, không lan sang việc khác

## Nguyên tắc dữ liệu

Mỗi con số, nhận định quan trọng phải ghi rõ là **dữ liệu có nguồn** (kèm link, ngày), **ước tính** (kèm cách tính) hay **ý kiến đề xuất**. Không có dữ liệu thì ghi "chưa có dữ liệu, cần kiểm chứng", không tự đặt số.

Khi báo cáo lại cho người giao việc: nêu đường dẫn file, 3 điểm chính, các giả định và việc còn mở.
