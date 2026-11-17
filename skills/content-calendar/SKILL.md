---
name: content-calendar
description: "Lập lịch nội dung theo tuần/tháng kèm brief từng bài: ngày, kênh, trụ cột nội dung, định dạng, hook, thông điệp, CTA. Dùng khi cần kế hoạch đăng bài, lịch nội dung, chuỗi bài cho chiến dịch."
argument-hint: "[giai đoạn, kênh, mục tiêu]"
---

Skill của phòng Marketing (người dùng chính: `t-outbox:content-writer`). Việc cần làm:

$ARGUMENTS

Mục tiêu: Ra một lịch nội dung cân bằng, đúng giọng thương hiệu, sẵn để viết và lên lịch đăng. Nếu phần việc ở trên trống, dùng bối cảnh của lượt giao việc hiện tại.

## Đầu vào cần có

- Kế hoạch marketing (`deliverables/marketing/`) và brand guideline nếu có
- Kênh đăng, tần suất có thể duy trì
- Giai đoạn và mục tiêu của chuỗi nội dung

Thiếu đầu vào thì đặt giả định hợp lý, ghi rõ trong sản phẩm, rồi làm tiếp. Chỉ hỏi lại khi câu trả lời làm đổi hẳn hướng làm.

## Các bước

1. Chốt 3-5 trụ cột nội dung từ định vị (chủ đề riêng của thương hiệu, không phải "giáo dục/giải trí/bán hàng" chung chung).
2. Chọn nhịp đăng theo năng lực thật của đội, không theo con số lý tưởng.
3. Cân bằng mục đích: phần lớn là giá trị (dạy, kể chuyện, bằng chứng), phần nhỏ là bán.
4. Lập bảng lịch. Mỗi dòng có hook cụ thể, không chỉ ghi chủ đề.
5. Viết brief cho 3 bài quan trọng nhất: người đọc, ý chính, cấu trúc, CTA, hình ảnh cần có (ghi brief ngắn cho Design).
6. Đánh dấu bài cần số liệu hoặc lời chứng thực thật để xin nguồn, không tự viết.

## Đầu ra

Lưu vào `deliverables/marketing/lich-noi-dung.md` (tạo thư mục nếu chưa có), theo khung:

```markdown
# Lịch nội dung: <giai đoạn>
## Trụ cột nội dung
## Lịch (bảng: ngày, kênh, trụ cột, định dạng, hook, thông điệp, CTA)
## Brief các bài trọng điểm
## Cần xin nguồn / tài nguyên
```

## Tự soát trước khi nộp

- [ ] Lịch không dồn toàn bài bán hàng
- [ ] Mỗi bài có hook và CTA
- [ ] Đúng giọng thương hiệu
- [ ] Không có số liệu hay lời khách hàng tự bịa
- [ ] Đúng phạm vi việc được giao, không lan sang việc khác

## Nguyên tắc dữ liệu

Mỗi con số, nhận định quan trọng phải ghi rõ là **dữ liệu có nguồn** (kèm link, ngày), **ước tính** (kèm cách tính) hay **ý kiến đề xuất**. Không có dữ liệu thì ghi "chưa có dữ liệu, cần kiểm chứng", không tự đặt số.

Khi báo cáo lại cho người giao việc: nêu đường dẫn file, 3 điểm chính, các giả định và việc còn mở.
