---
name: product-brief
description: "Viết brief sản phẩm: vấn đề cần giải quyết, khách hàng, phạm vi phải có/nên có/để sau, luồng người dùng, tiêu chí nghiệm thu, chỉ số thành công và lộ trình. Dùng khi chốt phạm vi sản phẩm, tính năng mới, hoặc đợt ra mắt."
argument-hint: "[sản phẩm hoặc tính năng]"
---

Skill của phòng Sản phẩm & Thiết kế (người dùng chính: `t-outbox:product-manager`). Việc cần làm:

$ARGUMENTS

Mục tiêu: Ra một brief đủ cụ thể để Design, Kỹ thuật và Marketing cùng làm theo mà không phải hỏi lại. Nếu phần việc ở trên trống, dùng bối cảnh của lượt giao việc hiện tại.

## Đầu vào cần có

- Ý tưởng hoặc yêu cầu của sếp
- Nghiên cứu khách hàng (`deliverables/product/`) nếu có
- Ràng buộc: thời gian, ngân sách, công nghệ

Thiếu đầu vào thì đặt giả định hợp lý, ghi rõ trong sản phẩm, rồi làm tiếp. Chỉ hỏi lại khi câu trả lời làm đổi hẳn hướng làm.

## Các bước

1. Vấn đề: của ai, hiện họ xử lý thế nào, vì sao chưa ổn. Ghi rõ đâu là bằng chứng, đâu là giả thuyết.
2. Chỉ số thành công đo được và cách đo.
3. Phạm vi theo ba mức: phải có, nên có, để sau. Ghi rõ những gì không làm.
4. Luồng người dùng chính theo bước, kèm trường hợp biên.
5. Tiêu chí nghiệm thu cho từng hạng mục phải có (viết dạng kiểm tra được).
6. Lộ trình theo mốc, phụ thuộc giữa các phòng, rủi ro và cách giảm.

## Đầu ra

Lưu vào `deliverables/product/product-brief.md` (tạo thư mục nếu chưa có), theo khung:

```markdown
# Brief sản phẩm: <tên>
## Vấn đề và bằng chứng
## Khách hàng mục tiêu
## Chỉ số thành công
## Phạm vi (phải có / nên có / để sau / không làm)
## Luồng người dùng
## Tiêu chí nghiệm thu
## Lộ trình và phụ thuộc
## Rủi ro
```

## Tự soát trước khi nộp

- [ ] Mọi hạng mục phải có đều có tiêu chí nghiệm thu
- [ ] Giả thuyết được đánh dấu là giả thuyết
- [ ] Có mục "không làm"
- [ ] Đúng phạm vi việc được giao, không lan sang việc khác

## Nguyên tắc dữ liệu

Mỗi con số, nhận định quan trọng phải ghi rõ là **dữ liệu có nguồn** (kèm link, ngày), **ước tính** (kèm cách tính) hay **ý kiến đề xuất**. Không có dữ liệu thì ghi "chưa có dữ liệu, cần kiểm chứng", không tự đặt số.

Khi báo cáo lại cho người giao việc: nêu đường dẫn file, 3 điểm chính, các giả định và việc còn mở.
