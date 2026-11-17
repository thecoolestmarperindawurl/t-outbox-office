---
name: contract-check
description: "Rà soát hợp đồng, điều khoản sử dụng, chính sách bảo mật, quy định quảng cáo: xếp rủi ro từng điều khoản và đề xuất lời văn thay thế; trích văn bản pháp luật kèm ngày tra. Dùng trước khi ký hợp đồng, công bố chính sách hoặc chạy chương trình khuyến mãi."
argument-hint: "[văn bản cần rà, các bên, luật áp dụng]"
---

Skill của phòng Vận hành (người dùng chính: `t-outbox:legal-counsel`). Việc cần làm:

$ARGUMENTS

Mục tiêu: Chỉ ra điều khoản rủi ro và cách sửa, để sếp mang đi trao đổi với luật sư nhanh hơn. Nếu phần việc ở trên trống, dùng bối cảnh của lượt giao việc hiện tại.

## Đầu vào cần có

- Văn bản cần rà (file trong dự án)
- Các bên, vai trò của công ty, luật và địa bàn áp dụng
- Mục tiêu thương mại của giao dịch

Thiếu đầu vào thì đặt giả định hợp lý, ghi rõ trong sản phẩm, rồi làm tiếp. Chỉ hỏi lại khi câu trả lời làm đổi hẳn hướng làm.

## Các bước

1. Xác định loại văn bản, các bên, luật áp dụng. Không rõ thì nêu giả định.
2. Rà từng nhóm điều khoản: nghĩa vụ, thanh toán, thời hạn và chấm dứt, trách nhiệm và bồi thường, bảo mật và dữ liệu cá nhân, sở hữu trí tuệ, giải quyết tranh chấp.
3. Xếp rủi ro: cao, trung bình, thấp; nêu vì sao bất lợi.
4. Đề xuất lời văn thay thế cụ thể cho từng điểm rủi ro cao và trung bình.
5. Trích tên văn bản pháp luật và điều khoản; thông tin hiện hành thì tra nguồn chính thức và ghi ngày tra.
6. Ghi rõ đây là bản rà soát tham khảo, không phải ý kiến pháp lý chính thức; liệt kê điểm cần luật sư hành nghề xác nhận.

## Đầu ra

Lưu vào `deliverables/operations/ra-soat-phap-ly.md` (tạo thư mục nếu chưa có), theo khung:

```markdown
# Rà soát pháp lý: <văn bản>
## Tóm tắt rủi ro
## Rà soát theo điều khoản (bảng: điều, nội dung, rủi ro, lý do, đề xuất sửa)
## Căn cứ pháp luật (văn bản, điều, ngày tra)
## Cần luật sư xác nhận
> Bản rà soát tham khảo, không thay thế ý kiến pháp lý chính thức.
```

## Tự soát trước khi nộp

- [ ] Có câu miễn trừ trách nhiệm
- [ ] Căn cứ pháp luật có tên văn bản và ngày tra
- [ ] Mỗi rủi ro cao có đề xuất sửa
- [ ] Đúng phạm vi việc được giao, không lan sang việc khác

## Nguyên tắc dữ liệu

Mỗi con số, nhận định quan trọng phải ghi rõ là **dữ liệu có nguồn** (kèm link, ngày), **ước tính** (kèm cách tính) hay **ý kiến đề xuất**. Không có dữ liệu thì ghi "chưa có dữ liệu, cần kiểm chứng", không tự đặt số.

Khi báo cáo lại cho người giao việc: nêu đường dẫn file, 3 điểm chính, các giả định và việc còn mở.
