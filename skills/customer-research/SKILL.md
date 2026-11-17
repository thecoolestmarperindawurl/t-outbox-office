---
name: customer-research
description: "Nghiên cứu thị trường, đối thủ và khách hàng có dẫn nguồn: quy mô, xu hướng, bảng so sánh đối thủ, nhu cầu và nỗi đau khách hàng, khoảng trống cơ hội. Dùng khi cần nghiên cứu trước khi ra quyết định sản phẩm hoặc marketing."
argument-hint: "[câu hỏi nghiên cứu, thị trường]"
---

Skill của phòng Sản phẩm & Thiết kế (người dùng chính: `t-outbox:researcher`). Việc cần làm:

$ARGUMENTS

Mục tiêu: Trả lời câu hỏi nghiên cứu bằng bằng chứng có nguồn, chỉ rõ chỗ còn thiếu dữ liệu. Nếu phần việc ở trên trống, dùng bối cảnh của lượt giao việc hiện tại.

## Đầu vào cần có

- Câu hỏi nghiên cứu và quyết định phụ thuộc vào nó
- Thị trường, phân khúc, đối thủ đã biết
- Dữ liệu nội bộ nếu có (phản hồi khách, số bán)

Thiếu đầu vào thì đặt giả định hợp lý, ghi rõ trong sản phẩm, rồi làm tiếp. Chỉ hỏi lại khi câu trả lời làm đổi hẳn hướng làm.

## Các bước

1. Viết lại câu hỏi nghiên cứu và quyết định cần ra. Giới hạn phạm vi.
2. Tìm trên web khi cần thông tin hiện tại. Ưu tiên nguồn gốc: báo cáo, trang chính thức, dữ liệu công khai; bài tổng hợp chỉ là đầu mối.
3. Đối chiếu ít nhất hai nguồn cho số liệu quan trọng, ghi ngày của dữ liệu. Số liệu không truy được nguồn gốc thì loại.
4. Bảng đối thủ: sản phẩm, giá, định vị, kênh, điểm mạnh, điểm yếu (nguồn cho từng ô quan trọng).
5. Khách hàng: nhu cầu, nỗi đau, lời nói thật của khách (trích nguồn: đánh giá, diễn đàn, phỏng vấn).
6. Kết luận: phát hiện chính, ý nghĩa với dự án, khoảng trống dữ liệu và cách lấp.

## Đầu ra

Lưu vào `deliverables/product/nghien-cuu.md` (tạo thư mục nếu chưa có), theo khung:

```markdown
# Nghiên cứu: <câu hỏi>
## Tóm tắt (3-5 phát hiện)
## Thị trường
## Đối thủ (bảng)
## Khách hàng: nhu cầu và nỗi đau
## Cơ hội
## Khoảng trống dữ liệu
## Nguồn (link, ngày truy cập)
```

## Tự soát trước khi nộp

- [ ] Mọi con số có link nguồn và ngày
- [ ] Không có nguồn bịa hoặc trích dẫn không mở được
- [ ] Phân biệt rõ dữ liệu, ước tính, nhận định
- [ ] Đúng phạm vi việc được giao, không lan sang việc khác

## Nguyên tắc dữ liệu

Mỗi con số, nhận định quan trọng phải ghi rõ là **dữ liệu có nguồn** (kèm link, ngày), **ước tính** (kèm cách tính) hay **ý kiến đề xuất**. Không có dữ liệu thì ghi "chưa có dữ liệu, cần kiểm chứng", không tự đặt số.

Khi báo cáo lại cho người giao việc: nêu đường dẫn file, 3 điểm chính, các giả định và việc còn mở.
