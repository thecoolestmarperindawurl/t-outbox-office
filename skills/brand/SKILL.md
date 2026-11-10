---
name: brand
description: Nạp bộ nhận diện thương hiệu vào văn phòng T-outbox để nhân viên mặc đồng phục công ty và văn phòng mang màu, tên, logo của thương hiệu. Dùng khi người dùng muốn đổi brand, đổi đồng phục, đổi màu văn phòng, đặt tên công ty, hoặc áp brand guideline vào văn phòng.
argument-hint: "[tên thương hiệu, file guideline, hoặc mô tả màu]"
---

Sếp muốn nạp thương hiệu cho văn phòng: $ARGUMENTS

## 1. Lấy thông tin thương hiệu

Tìm theo thứ tự, dừng ở nguồn đầu tiên có đủ thông tin:

1. File hoặc đường dẫn sếp chỉ ra trong yêu cầu.
2. Brand guideline có sẵn trong phiên làm việc: một skill về brand guideline, hoặc file trong dự án (tìm `brand*`, `guideline*`, `design-system*`, file CSS có biến màu).
3. Mô tả bằng lời của sếp (ví dụ "xanh navy với cam").

Cần lấy: tên công ty, khẩu hiệu ngắn, 1-2 ký tự làm logo chữ, và ba màu dạng hex 6 ký tự:

- `primary`: màu chính của thương hiệu, dùng cho áo đồng phục.
- `secondary`: màu tối đi kèm, dùng cho áo khoác của trưởng phòng và CEO.
- `accent`: màu nhấn, dùng cho dây đeo thẻ, cà vạt, chi tiết trang trí.

Chỉ dùng màu có trong nguồn. Nguồn thiếu màu nào thì đề xuất màu hài hòa với các màu đã có và nói rõ với sếp đó là màu bạn đề xuất, không phải màu của guideline. Không có nguồn nào thì hỏi sếp tên công ty và màu chính rồi dừng.

## 2. Ghi file brand

Ghi `.t-outbox/brand.json` trong dự án (tạo thư mục nếu chưa có):

```json
{
  "name": "Tên công ty",
  "tagline": "Khẩu hiệu ngắn",
  "logoText": "T",
  "colors": { "primary": "#1f3a8a", "secondary": "#1b2238", "accent": "#ff8a1f" },
  "uniform": { "style": "polo" }
}
```

`uniform.style` nhận `polo` (áo polo có cổ), `shirt` (sơ mi) hoặc `tshirt` (áo thun). Chọn kiểu hợp với văn hóa thương hiệu, hoặc theo ý sếp.

Văn phòng đang mở sẽ tự tải lại với đồng phục, biển tên và màu mới ngay khi file được lưu.

## 3. Báo sếp

Một vài dòng: tên và ba màu đã nạp (ghi rõ màu nào lấy từ guideline, màu nào do bạn đề xuất), kiểu đồng phục, và nhắc sếp có thể chỉnh tiếp bằng nút "Tùy biến" trong văn phòng.
