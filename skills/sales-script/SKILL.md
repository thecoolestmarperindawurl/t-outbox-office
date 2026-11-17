---
name: sales-script
description: "Soạn tài liệu bán hàng theo hành trình mua: kịch bản tiếp cận, câu hỏi khám phá nhu cầu, trình bày giải pháp, xử lý từ chối, chốt; kèm mẫu báo giá/đề xuất và chỉ số pipeline. Dùng khi chuẩn bị bán sản phẩm mới hoặc chuẩn hóa cách bán của đội."
argument-hint: "[sản phẩm, khách hàng mục tiêu, kênh bán]"
---

Skill của phòng Kinh doanh & CSKH (người dùng chính: `t-outbox:sales-lead`). Việc cần làm:

$ARGUMENTS

Mục tiêu: Cho đội bán một bộ kịch bản dùng được ngay, bám vấn đề thật của khách. Nếu phần việc ở trên trống, dùng bối cảnh của lượt giao việc hiện tại.

## Đầu vào cần có

- Sản phẩm, giá, điều kiện bán (phần nào sếp đã duyệt)
- Khách hàng mục tiêu và người ra quyết định
- Nghiên cứu khách hàng, kế hoạch marketing nếu có

Thiếu đầu vào thì đặt giả định hợp lý, ghi rõ trong sản phẩm, rồi làm tiếp. Chỉ hỏi lại khi câu trả lời làm đổi hẳn hướng làm.

## Các bước

1. Chân dung người mua: vấn đề họ trả tiền để giải quyết, người ra quyết định, tiêu chí chọn.
2. Kịch bản tiếp cận theo kênh (gọi, tin nhắn, email): câu mở ngắn, lý do liên hệ cụ thể.
3. Câu hỏi khám phá nhu cầu: mở, theo thứ tự hiện trạng, vấn đề, tác động, mong muốn.
4. Trình bày giải pháp nối vào đúng vấn đề khách vừa nói, kèm bằng chứng có thật.
5. Xử lý từ chối: 6-8 lời từ chối thường gặp, mỗi cái có cách hỏi lại và câu trả lời.
6. Chốt và bước tiếp theo; mẫu báo giá/đề xuất (phần giá, điều kiện chưa duyệt thì đánh dấu).
7. Chỉ số pipeline và nhịp chăm sóc khách.

## Đầu ra

Lưu vào `deliverables/sales/kich-ban-ban-hang.md` (tạo thư mục nếu chưa có), theo khung:

```markdown
# Kịch bản bán hàng: <sản phẩm>
## Người mua và tiêu chí chọn
## Tiếp cận (theo kênh)
## Câu hỏi khám phá
## Trình bày giải pháp
## Xử lý từ chối (bảng: lời từ chối, hỏi lại, trả lời)
## Chốt và bước tiếp theo
## Mẫu báo giá / đề xuất
## Chỉ số pipeline
```

## Tự soát trước khi nộp

- [ ] Không hứa điều sản phẩm không làm được
- [ ] Giá, khuyến mãi chưa duyệt được đánh dấu
- [ ] Bằng chứng (case, số) có thật và có nguồn
- [ ] Đúng phạm vi việc được giao, không lan sang việc khác

## Nguyên tắc dữ liệu

Mỗi con số, nhận định quan trọng phải ghi rõ là **dữ liệu có nguồn** (kèm link, ngày), **ước tính** (kèm cách tính) hay **ý kiến đề xuất**. Không có dữ liệu thì ghi "chưa có dữ liệu, cần kiểm chứng", không tự đặt số.

Khi báo cáo lại cho người giao việc: nêu đường dẫn file, 3 điểm chính, các giả định và việc còn mở.
