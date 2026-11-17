---
name: customer-reply
description: "Soạn câu trả lời khách hàng, bộ FAQ và kịch bản chăm sóc theo tình huống; phân loại phản hồi của khách theo chủ đề và mức độ. Dùng khi cần trả lời khiếu nại, câu hỏi thường gặp, mẫu tin nhắn CSKH, hoặc tổng hợp phản hồi khách."
argument-hint: "[tình huống hoặc phản hồi của khách]"
---

Skill của phòng Kinh doanh & CSKH (người dùng chính: `t-outbox:customer-support`). Việc cần làm:

$ARGUMENTS

Mục tiêu: Giúp khách được giải quyết vấn đề nhanh, đúng chính sách, giữ được lòng tin. Nếu phần việc ở trên trống, dùng bối cảnh của lượt giao việc hiện tại.

## Đầu vào cần có

- Tình huống hoặc tin nhắn của khách
- Chính sách: đổi trả, bảo hành, hoàn tiền, thời gian xử lý
- Tài liệu sản phẩm, FAQ sẵn có

Thiếu đầu vào thì đặt giả định hợp lý, ghi rõ trong sản phẩm, rồi làm tiếp. Chỉ hỏi lại khi câu trả lời làm đổi hẳn hướng làm.

## Các bước

1. Hiểu đúng vấn đề trước khi trả lời; đọc chính sách liên quan.
2. Câu trả lời: thừa nhận vấn đề, cách giải quyết theo bước, việc tiếp theo và thời gian.
3. Giọng theo brand: lịch sự, rõ ràng, không đổ lỗi cho khách, không dùng thuật ngữ nội bộ.
4. FAQ: nhóm theo tình huống, viết câu hỏi bằng lời của khách, mỗi câu trả lời đọc riêng vẫn hiểu.
5. Phản hồi của khách: phân loại theo chủ đề và mức độ, đếm số lần, trích nguyên văn ví dụ tiêu biểu.
6. Trường hợp vượt chính sách (hoàn tiền ngoại lệ, đền bù) thì đánh dấu cần cấp trên quyết, không tự hứa.

## Đầu ra

Lưu vào `deliverables/sales/cskh.md` (tạo thư mục nếu chưa có), theo khung:

```markdown
# CSKH: <chủ đề>
## Câu trả lời mẫu theo tình huống
## FAQ
## Phân loại phản hồi (bảng: chủ đề, mức độ, số lần, ví dụ nguyên văn)
## Trường hợp cần cấp trên quyết
```

## Tự soát trước khi nộp

- [ ] Đúng chính sách hiện có
- [ ] Không hứa đền bù khi chưa được duyệt
- [ ] Không lộ dữ liệu cá nhân của khách
- [ ] Đúng phạm vi việc được giao, không lan sang việc khác

## Nguyên tắc dữ liệu

Mỗi con số, nhận định quan trọng phải ghi rõ là **dữ liệu có nguồn** (kèm link, ngày), **ước tính** (kèm cách tính) hay **ý kiến đề xuất**. Không có dữ liệu thì ghi "chưa có dữ liệu, cần kiểm chứng", không tự đặt số.

Khi báo cáo lại cho người giao việc: nêu đường dẫn file, 3 điểm chính, các giả định và việc còn mở.
