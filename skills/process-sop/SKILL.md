---
name: process-sop
description: "Viết quy trình vận hành chuẩn (SOP) cho một việc lặp lại: mục tiêu, vai trò, các bước có đầu vào/đầu ra, công cụ, tiêu chí hoàn thành, điểm kiểm soát và chỉ số đo. Dùng khi chuẩn hóa cách làm, đóng gói một quy trình đã chạy tốt, hoặc bàn giao việc."
argument-hint: "[quy trình cần chuẩn hóa]"
---

Skill của phòng Vận hành (người dùng chính: `t-outbox:operations-lead`). Việc cần làm:

$ARGUMENTS

Mục tiêu: Biến một cách làm đã hiệu quả thành quy trình người khác làm theo được và cho ra cùng chất lượng. Nếu phần việc ở trên trống, dùng bối cảnh của lượt giao việc hiện tại.

## Đầu vào cần có

- Việc cần chuẩn hóa và ví dụ lần làm tốt gần nhất
- Người tham gia, công cụ đang dùng
- Ràng buộc về thời gian, chi phí

Thiếu đầu vào thì đặt giả định hợp lý, ghi rõ trong sản phẩm, rồi làm tiếp. Chỉ hỏi lại khi câu trả lời làm đổi hẳn hướng làm.

## Các bước

1. Mục tiêu và phạm vi: quy trình bắt đầu từ đâu, kết thúc ở đâu, không bao gồm gì.
2. Vai trò: ai làm, ai duyệt, ai được báo (bảng RACI ngắn).
3. Các bước đánh số: hành động, đầu vào, đầu ra, công cụ, thời gian chuẩn.
4. Tiêu chí hoàn thành cho từng bước và cho cả quy trình.
5. Điểm kiểm soát và rủi ro: chỗ hay sai, cách phát hiện, cách xử lý.
6. Chỉ số đo và nhịp rà soát quy trình. Mẫu biểu, checklist đi kèm.
7. Giữ ngắn: quy trình người thật làm theo được hơn quy trình đầy đủ mà không ai đọc.

## Đầu ra

Lưu vào `deliverables/operations/sop-<ten-quy-trinh>.md` (tạo thư mục nếu chưa có), theo khung:

```markdown
# SOP: <tên quy trình>
## Mục tiêu và phạm vi
## Vai trò (RACI)
## Các bước (bảng: bước, việc, đầu vào, đầu ra, công cụ, thời gian)
## Tiêu chí hoàn thành
## Điểm kiểm soát và rủi ro
## Chỉ số và nhịp rà soát
## Checklist / mẫu biểu
```

## Tự soát trước khi nộp

- [ ] Mỗi bước có người làm và đầu ra
- [ ] Người mới đọc làm theo được
- [ ] Có tiêu chí hoàn thành đo được
- [ ] Đúng phạm vi việc được giao, không lan sang việc khác

## Nguyên tắc dữ liệu

Mỗi con số, nhận định quan trọng phải ghi rõ là **dữ liệu có nguồn** (kèm link, ngày), **ước tính** (kèm cách tính) hay **ý kiến đề xuất**. Không có dữ liệu thì ghi "chưa có dữ liệu, cần kiểm chứng", không tự đặt số.

Khi báo cáo lại cho người giao việc: nêu đường dẫn file, 3 điểm chính, các giả định và việc còn mở.
