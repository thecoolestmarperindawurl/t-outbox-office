---
name: marketing-plan
description: "Lập kế hoạch marketing từ mục tiêu kinh doanh: chân dung khách hàng, định vị, thông điệp, chọn kênh, giai đoạn, ngân sách và KPI đo được. Dùng khi cần chiến lược hoặc kế hoạch marketing cho sản phẩm, chiến dịch, đợt ra mắt."
argument-hint: "[mục tiêu, sản phẩm, ngân sách, thời gian]"
---

Skill của phòng Marketing (người dùng chính: `t-outbox:marketing-lead`). Việc cần làm:

$ARGUMENTS

Mục tiêu: Biến mục tiêu kinh doanh thành một kế hoạch marketing mà cả phòng triển khai được ngay. Nếu phần việc ở trên trống, dùng bối cảnh của lượt giao việc hiện tại.

## Đầu vào cần có

- Mục tiêu kinh doanh (doanh số, lead, nhận biết) và thời hạn
- Sản phẩm/dịch vụ, giá, điểm khác biệt
- Ngân sách và nhân lực
- Tài liệu sẵn có: brand guideline, nghiên cứu trong `deliverables/product/`

Thiếu đầu vào thì đặt giả định hợp lý, ghi rõ trong sản phẩm, rồi làm tiếp. Chỉ hỏi lại khi câu trả lời làm đổi hẳn hướng làm.

## Các bước

1. Đọc tài liệu sẵn có trong dự án trước. Thiếu thông tin thì đặt giả định và ghi rõ.
2. Chân dung khách hàng: 1-2 nhóm chính, vấn đề họ có, nơi họ tìm thông tin, lý do họ chần chừ.
3. Định vị và thông điệp chủ đạo: một câu định vị, 3 thông điệp hỗ trợ có bằng chứng đi kèm.
4. Chọn kênh: bảng kênh ưu tiên kèm lý do chọn, kênh bỏ kèm lý do bỏ. Ít kênh làm tới nơi hơn nhiều kênh dàn trải.
5. Kế hoạch theo giai đoạn (ví dụ: chuẩn bị, ra mắt, duy trì): đầu việc, người làm (content, SEO, ads), mốc thời gian.
6. Ngân sách chia theo kênh/giai đoạn và KPI cho từng kênh (chỉ số, mục tiêu, cách đo, tần suất xem lại).
7. Rủi ro lớn nhất và cách kiểm chứng sớm (thử nhỏ trước khi dồn tiền).

## Đầu ra

Lưu vào `deliverables/marketing/ke-hoach-marketing.md` (tạo thư mục nếu chưa có), theo khung:

```markdown
# Kế hoạch marketing: <tên>
## 1. Mục tiêu và giả định
## 2. Khách hàng mục tiêu
## 3. Định vị và thông điệp
## 4. Kênh (chọn / bỏ, lý do)
## 5. Kế hoạch theo giai đoạn (bảng: giai đoạn, việc, người, hạn)
## 6. Ngân sách
## 7. KPI (bảng: kênh, chỉ số, mục tiêu, cách đo)
## 8. Rủi ro và cách kiểm chứng
## Nguồn
```

## Tự soát trước khi nộp

- [ ] Mỗi lựa chọn chiến lược có lý do
- [ ] KPI đo được, có cách đo, không phải chỉ số hão (chỉ lượt thích)
- [ ] Ngân sách cộng đúng tổng
- [ ] Số liệu thị trường có nguồn hoặc ghi là ước tính
- [ ] Đúng phạm vi việc được giao, không lan sang việc khác

## Nguyên tắc dữ liệu

Mỗi con số, nhận định quan trọng phải ghi rõ là **dữ liệu có nguồn** (kèm link, ngày), **ước tính** (kèm cách tính) hay **ý kiến đề xuất**. Không có dữ liệu thì ghi "chưa có dữ liệu, cần kiểm chứng", không tự đặt số.

Khi báo cáo lại cho người giao việc: nêu đường dẫn file, 3 điểm chính, các giả định và việc còn mở.
