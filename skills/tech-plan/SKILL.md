---
name: tech-plan
description: "Lập kế hoạch kỹ thuật: kiến trúc, lựa chọn công nghệ kèm lý do, chia việc cho web, dữ liệu, QA, ước lượng, rủi ro, cách triển khai và kiểm thử. Dùng trước khi dựng website, landing page, tích hợp hoặc công cụ nội bộ."
argument-hint: "[sản phẩm kỹ thuật cần làm]"
---

Skill của phòng Kỹ thuật & Dữ liệu (người dùng chính: `t-outbox:tech-lead`). Việc cần làm:

$ARGUMENTS

Mục tiêu: Ra kế hoạch kỹ thuật gọn mà phòng làm theo được, chọn cách đơn giản nhất đáp ứng yêu cầu. Nếu phần việc ở trên trống, dùng bối cảnh của lượt giao việc hiện tại.

## Đầu vào cần có

- Brief sản phẩm và tiêu chí nghiệm thu
- Ràng buộc: hosting, ngân sách, hệ thống sẵn có
- Mã nguồn hiện có trong dự án

Thiếu đầu vào thì đặt giả định hợp lý, ghi rõ trong sản phẩm, rồi làm tiếp. Chỉ hỏi lại khi câu trả lời làm đổi hẳn hướng làm.

## Các bước

1. Đọc yêu cầu và mã sẵn có. Ghi lại những gì đã có thể dùng lại.
2. Đề xuất kiến trúc đơn giản nhất đáp ứng tiêu chí nghiệm thu; nêu phương án đã cân nhắc và lý do bỏ.
3. Chia việc: web, dữ liệu/đo lường, QA; ghi đầu vào, đầu ra, phụ thuộc.
4. Kế hoạch kiểm thử: cái gì kiểm tự động, cái gì kiểm tay, tiêu chí đạt.
5. Triển khai: môi trường, cách đưa lên, cách quay lui nếu lỗi.
6. Rủi ro (bảo mật, dữ liệu cá nhân, hiệu năng) và cách kiểm soát.

## Đầu ra

Lưu vào `deliverables/engineering/ke-hoach-ky-thuat.md` (tạo thư mục nếu chưa có), theo khung:

```markdown
# Kế hoạch kỹ thuật: <tên>
## Yêu cầu và tiêu chí nghiệm thu
## Kiến trúc (và phương án đã bỏ)
## Chia việc (bảng: việc, người, đầu ra, phụ thuộc)
## Kiểm thử
## Triển khai và quay lui
## Rủi ro
```

## Tự soát trước khi nộp

- [ ] Mỗi tiêu chí nghiệm thu có việc và cách kiểm tương ứng
- [ ] Không chọn công nghệ phức tạp hơn mức cần
- [ ] Có tính tới bảo mật và dữ liệu cá nhân
- [ ] Đúng phạm vi việc được giao, không lan sang việc khác

## Nguyên tắc dữ liệu

Mỗi con số, nhận định quan trọng phải ghi rõ là **dữ liệu có nguồn** (kèm link, ngày), **ước tính** (kèm cách tính) hay **ý kiến đề xuất**. Không có dữ liệu thì ghi "chưa có dữ liệu, cần kiểm chứng", không tự đặt số.

Khi báo cáo lại cho người giao việc: nêu đường dẫn file, 3 điểm chính, các giả định và việc còn mở.
