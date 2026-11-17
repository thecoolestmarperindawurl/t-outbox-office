---
name: budget-estimate
description: "Lập dự toán ngân sách và mô hình tài chính đơn giản: bảng chi phí theo hạng mục, doanh thu dự kiến, điểm hòa vốn, ba kịch bản thận trọng/cơ sở/lạc quan, biến số nhạy nhất. Dùng khi cần dự toán chiến dịch, dự án, ra mắt sản phẩm."
argument-hint: "[dự án, khung thời gian, số liệu đầu vào]"
---

Skill của phòng Vận hành (người dùng chính: `t-outbox:finance-analyst`). Việc cần làm:

$ARGUMENTS

Mục tiêu: Cho sếp biết cần bao nhiêu tiền, kỳ vọng thu về bao nhiêu, và giả định nào quyết định kết quả. Nếu phần việc ở trên trống, dùng bối cảnh của lượt giao việc hiện tại.

## Đầu vào cần có

- Kế hoạch các phòng (marketing, kỹ thuật, nhân sự) kèm chi phí đã biết
- Giá bán, giá vốn, tỷ lệ chuyển đổi nếu có
- Khung thời gian

Thiếu đầu vào thì đặt giả định hợp lý, ghi rõ trong sản phẩm, rồi làm tiếp. Chỉ hỏi lại khi câu trả lời làm đổi hẳn hướng làm.

## Các bước

1. Liệt kê hạng mục chi phí từ kế hoạch các phòng; hạng mục chưa có giá thì ghi cần báo giá.
2. Tách đầu vào (giả định) khỏi kết quả; mỗi giả định ghi nguồn hoặc ghi là ước tính kèm cách tính.
3. Dựng bảng tính có công thức truy được: lưu CSV và script tính, hoặc bảng có cột công thức.
4. Chạy ba kịch bản thận trọng, cơ sở, lạc quan; tính điểm hòa vốn nếu có doanh thu.
5. Chỉ ra biến số nhạy nhất (đổi 10-20% thì kết quả đổi bao nhiêu).
6. Kết luận ngắn: tổng ngân sách, rủi ro, khuyến nghị. Thuế và sổ sách pháp lý cần kế toán có chứng chỉ xác nhận.

## Đầu ra

Lưu vào `deliverables/operations/du-toan.md` (tạo thư mục nếu chưa có), theo khung:

```markdown
# Dự toán: <dự án>
## Kết luận (tổng ngân sách, kỳ vọng, khuyến nghị)
## Giả định (bảng: giả định, giá trị, nguồn / cách ước tính)
## Chi phí theo hạng mục
## Doanh thu và hòa vốn
## Ba kịch bản
## Độ nhạy
## File tính: deliverables/operations/du-toan.csv
```

## Tự soát trước khi nộp

- [ ] Tổng cộng khớp từng dòng
- [ ] Mọi giả định có nguồn hoặc ghi là ước tính
- [ ] Có ghi chú giới hạn (không phải tư vấn thuế/kế toán chính thức)
- [ ] Đúng phạm vi việc được giao, không lan sang việc khác

## Nguyên tắc dữ liệu

Mỗi con số, nhận định quan trọng phải ghi rõ là **dữ liệu có nguồn** (kèm link, ngày), **ước tính** (kèm cách tính) hay **ý kiến đề xuất**. Không có dữ liệu thì ghi "chưa có dữ liệu, cần kiểm chứng", không tự đặt số.

Khi báo cáo lại cho người giao việc: nêu đường dẫn file, 3 điểm chính, các giả định và việc còn mở.
