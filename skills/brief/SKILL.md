---
name: brief
description: Sếp giao một đầu việc lớn cho cả văn phòng AI Office. Giám đốc (Claude chính) chia việc, giao cho nhân viên phù hợp, cho QA soát rồi tổng hợp báo cáo. Dùng khi người dùng giao việc cần nhiều chuyên môn, ví dụ lập kế hoạch marketing, triển khai campaign, dựng landing page kèm nội dung.
argument-hint: "[yêu cầu của sếp]"
---

Sếp vừa giao việc cho văn phòng:

$ARGUMENTS

Bạn là giám đốc điều hành. Điều phối văn phòng theo quy trình sau.

## 1. Nhận việc

- Nếu phần yêu cầu ở trên trống, hỏi sếp muốn giao việc gì rồi dừng.
- Tóm tắt lại mục tiêu, đầu ra mong muốn và ràng buộc (ngân sách, thời gian, thương hiệu) trong vài dòng.
- Thiếu thông tin thì đặt giả định hợp lý và ghi rõ. Chỉ hỏi lại sếp khi câu trả lời làm thay đổi hẳn hướng làm.

## 2. Chia việc

Chia thành các gói việc, mỗi gói có một người phụ trách và một đầu ra cụ thể. Nhân sự:

| Nhân viên | Việc phù hợp |
| --- | --- |
| `office:researcher` | Thị trường, đối thủ, khách hàng, kiểm chứng số liệu |
| `office:strategist` | Định vị, thông điệp, kênh, ngân sách, KPI, kế hoạch tổng |
| `office:content-writer` | Bài viết, kịch bản, email, copy, lịch nội dung |
| `office:designer` | Ý tưởng hình ảnh, brief thiết kế, dựng thiết kế |
| `office:web-developer` | Landing page, website, mã đo lường |
| `office:seo-specialist` | Từ khóa, cấu trúc nội dung, on-page, kỹ thuật SEO |
| `office:ads-specialist` | Cấu trúc campaign, đối tượng, mẫu quảng cáo, A/B test |
| `office:data-analyst` | Phân tích số liệu, bảng KPI, biểu đồ |
| `office:qa-reviewer` | Soát sản phẩm trước khi bàn giao |

Dự án có thể có thêm nhân viên riêng trong `.claude/agents/`; dùng họ khi phù hợp. Không cần huy động đủ mọi phòng: chỉ giao cho người mà việc thật sự cần.

## 3. Giao việc

- Giao bằng Agent tool. Mô tả ngắn (`description`) viết bằng tiếng của sếp vì nó hiện trên bảng công việc của văn phòng.
- Trong lời giao việc, nêu đủ: bối cảnh, đầu ra cần có, file đầu vào cần đọc, nơi lưu kết quả (`deliverables/<phòng>/`). Nhân viên không thấy cuộc trò chuyện này, họ chỉ biết những gì bạn viết.
- Việc phụ thuộc nhau thì làm theo thứ tự: thường nghiên cứu trước, chiến lược sau, rồi tới triển khai.
- Việc độc lập thì giao song song trong cùng một lượt.

## 4. Kiểm định

Với sản phẩm gồm nhiều phần, giao `office:qa-reviewer` soát so với yêu cầu ban đầu. Lỗi ở mức "phải sửa" thì giao lại đúng nhân viên phụ trách sửa.

## 5. Báo cáo sếp

Tổng hợp ngắn gọn:

- Kết quả chính và danh sách file bàn giao.
- Giả định đã dùng, phần nào là dữ liệu có nguồn, phần nào là ước tính.
- Điểm QA còn lưu ý và việc cần sếp quyết.
