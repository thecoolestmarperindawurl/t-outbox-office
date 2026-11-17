---
name: landing-page
description: "Dựng landing page tĩnh hoàn chỉnh (HTML/CSS/JS) theo brand và nội dung có sẵn: hero, lợi ích, bằng chứng, form đăng ký, SEO cơ bản, responsive, đo lường. Dùng khi cần trang đăng ký sớm, trang ra mắt, trang sự kiện."
argument-hint: "[mục tiêu trang, nội dung, brand]"
---

Skill của phòng Kỹ thuật & Dữ liệu (người dùng chính: `t-outbox:web-developer`). Việc cần làm:

$ARGUMENTS

Mục tiêu: Ra một landing page chạy được, nhanh, đúng brand, đo được chuyển đổi. Nếu phần việc ở trên trống, dùng bối cảnh của lượt giao việc hiện tại.

## Đầu vào cần có

- Nội dung chữ (Marketing), brief hình ảnh (Design), brand guideline
- Mục tiêu chuyển đổi (đăng ký, mua, gọi)
- Nơi nhận dữ liệu form (nếu chưa có thì để chỗ và ghi rõ)

Thiếu đầu vào thì đặt giả định hợp lý, ghi rõ trong sản phẩm, rồi làm tiếp. Chỉ hỏi lại khi câu trả lời làm đổi hẳn hướng làm.

## Các bước

1. Chốt cấu trúc: hero (lời hứa + CTA), vấn đề, lợi ích, cách hoạt động, bằng chứng, câu hỏi thường gặp, CTA cuối.
2. Dựng HTML ngữ nghĩa, CSS theo màu/font của brand, ưu tiên điện thoại trước. Không dùng thư viện nặng khi không cần.
3. Form: nhãn rõ, kiểm tra dữ liệu, thông báo thành công/lỗi; không gửi dữ liệu đi đâu khi chưa có nơi nhận được duyệt.
4. SEO cơ bản: title, meta description, Open Graph, một H1, alt ảnh.
5. Đo lường: gắn chỗ cho sự kiện chuyển đổi và UTM, ghi rõ cần ID công cụ đo nào.
6. Mở thử trên trình duyệt (máy tính và khổ điện thoại), sửa lỗi hiển thị, ghi kết quả.

## Đầu ra

Lưu vào `deliverables/engineering/index.html` (tạo thư mục nếu chưa có), theo khung:

```text
deliverables/engineering/
  index.html      trang chính
  styles.css      (nếu tách)
  README.md       cách chạy, chỗ cần điền (ID đo lường, nơi nhận form), kết quả thử
```

## Tự soát trước khi nộp

- [ ] Chạy được khi mở file, không lỗi console
- [ ] Hiển thị tốt ở khổ 390px
- [ ] Không có số liệu hay lời chứng thực bịa trên trang
- [ ] Form không gửi dữ liệu tới nơi chưa được duyệt
- [ ] Đúng phạm vi việc được giao, không lan sang việc khác

## Nguyên tắc dữ liệu

Mỗi con số, nhận định quan trọng phải ghi rõ là **dữ liệu có nguồn** (kèm link, ngày), **ước tính** (kèm cách tính) hay **ý kiến đề xuất**. Không có dữ liệu thì ghi "chưa có dữ liệu, cần kiểm chứng", không tự đặt số.

Khi báo cáo lại cho người giao việc: nêu đường dẫn file, 3 điểm chính, các giả định và việc còn mở.
