---
name: data-report
description: "Phân tích dữ liệu và viết báo cáo số liệu: làm sạch dữ liệu, tính bằng script chạy lại được, chỉ số chính, xu hướng, kết luận kèm mức chắc chắn và giới hạn. Dùng cho báo cáo kết quả kênh, chiến dịch, bán hàng, hoặc thiết lập bộ chỉ số theo dõi."
argument-hint: "[câu hỏi cần trả lời, file dữ liệu]"
---

Skill của phòng Kỹ thuật & Dữ liệu (người dùng chính: `t-outbox:data-analyst`). Việc cần làm:

$ARGUMENTS

Mục tiêu: Trả lời câu hỏi kinh doanh bằng số liệu kiểm tra lại được, nói rõ kết luận chắc tới đâu. Nếu phần việc ở trên trống, dùng bối cảnh của lượt giao việc hiện tại.

## Đầu vào cần có

- Câu hỏi và quyết định phụ thuộc vào nó
- File dữ liệu (CSV, XLSX, JSON) hoặc nguồn truy vấn
- Định nghĩa chỉ số đang dùng

Thiếu đầu vào thì đặt giả định hợp lý, ghi rõ trong sản phẩm, rồi làm tiếp. Chỉ hỏi lại khi câu trả lời làm đổi hẳn hướng làm.

## Các bước

1. Viết lại câu hỏi. Chốt định nghĩa từng chỉ số trước khi tính.
2. Kiểm tra dữ liệu: số dòng, khoảng thời gian, giá trị thiếu, trùng lặp, đơn vị. Ghi lại vấn đề tìm thấy.
3. Tính bằng script lưu cùng báo cáo (Python hoặc Node), không nhẩm.
4. Trình bày: kết luận trước, số liệu chứng minh sau, biểu đồ chỉ khi giúp đọc nhanh hơn.
5. Ghi mức chắc chắn của từng kết luận; tương quan không phải nhân quả.
6. Không có dữ liệu thì nói rõ cần thu thêm gì, không suy ra số.

## Đầu ra

Lưu vào `deliverables/engineering/bao-cao-so-lieu.md` (tạo thư mục nếu chưa có), theo khung:

```markdown
# Báo cáo số liệu: <câu hỏi>
## Kết luận chính (kèm mức chắc chắn)
## Số liệu (bảng, biểu đồ)
## Dữ liệu dùng và vấn đề dữ liệu
## Cách tính (script: deliverables/engineering/<tên>.py)
## Giới hạn và việc cần làm tiếp
```

## Tự soát trước khi nộp

- [ ] Script chạy lại ra đúng số trong báo cáo
- [ ] Định nghĩa chỉ số rõ ràng
- [ ] Không có số tự đặt
- [ ] Đúng phạm vi việc được giao, không lan sang việc khác

## Nguyên tắc dữ liệu

Mỗi con số, nhận định quan trọng phải ghi rõ là **dữ liệu có nguồn** (kèm link, ngày), **ước tính** (kèm cách tính) hay **ý kiến đề xuất**. Không có dữ liệu thì ghi "chưa có dữ liệu, cần kiểm chứng", không tự đặt số.

Khi báo cáo lại cho người giao việc: nêu đường dẫn file, 3 điểm chính, các giả định và việc còn mở.
