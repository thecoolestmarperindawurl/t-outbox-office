---
name: hiring-plan
description: "Lập kế hoạch tuyển dụng một vị trí: kết quả cần đạt, mô tả công việc, tiêu chí bắt buộc/điểm cộng, câu hỏi phỏng vấn kèm thang chấm, kế hoạch onboarding 30-60-90 ngày. Dùng khi cần tuyển người, viết JD, phỏng vấn hoặc đón nhân sự mới."
argument-hint: "[vị trí, ngân sách, hình thức làm việc]"
---

Skill của phòng Vận hành (người dùng chính: `t-outbox:hr-specialist`). Việc cần làm:

$ARGUMENTS

Mục tiêu: Tuyển đúng người cho kết quả cần đạt, đánh giá công bằng và thống nhất giữa người phỏng vấn. Nếu phần việc ở trên trống, dùng bối cảnh của lượt giao việc hiện tại.

## Đầu vào cần có

- Vị trí và kết quả mong đợi sau 3-6 tháng
- Ngân sách lương, hình thức (toàn thời gian, bán thời gian, từ xa)
- Đội nhóm và người quản lý trực tiếp

Thiếu đầu vào thì đặt giả định hợp lý, ghi rõ trong sản phẩm, rồi làm tiếp. Chỉ hỏi lại khi câu trả lời làm đổi hẳn hướng làm.

## Các bước

1. Kết quả cần đạt sau 3-6 tháng (đo được), từ đó suy ra năng lực cần có.
2. Mô tả công việc theo kết quả; tách yêu cầu bắt buộc khỏi điểm cộng.
3. Câu hỏi phỏng vấn gắn với từng năng lực, kèm thang chấm 1-4 có mô tả từng mức.
4. Bài kiểm tra thực tế ngắn (nếu phù hợp), trả phí nếu dài.
5. Kế hoạch onboarding 30-60-90 ngày: mục tiêu, người kèm, tài liệu.
6. Mức lương thị trường là ước tính, ghi nguồn và ngày. Tiêu chí chỉ dựa trên năng lực và kết quả, không dựa trên tuổi, giới tính, tình trạng hôn nhân; quy định lao động đối chiếu luật hiện hành.

## Đầu ra

Lưu vào `deliverables/operations/tuyen-dung-<vi-tri>.md` (tạo thư mục nếu chưa có), theo khung:

```markdown
# Tuyển dụng: <vị trí>
## Kết quả cần đạt
## Mô tả công việc (JD)
## Tiêu chí (bắt buộc / điểm cộng)
## Câu hỏi phỏng vấn và thang chấm
## Bài kiểm tra thực tế
## Onboarding 30-60-90
## Lương tham khảo (nguồn, ngày)
```

## Tự soát trước khi nộp

- [ ] Không có tiêu chí phân biệt đối xử
- [ ] Thang chấm có mô tả từng mức
- [ ] Lương tham khảo có nguồn hoặc ghi là ước tính
- [ ] Đúng phạm vi việc được giao, không lan sang việc khác

## Nguyên tắc dữ liệu

Mỗi con số, nhận định quan trọng phải ghi rõ là **dữ liệu có nguồn** (kèm link, ngày), **ước tính** (kèm cách tính) hay **ý kiến đề xuất**. Không có dữ liệu thì ghi "chưa có dữ liệu, cần kiểm chứng", không tự đặt số.

Khi báo cáo lại cho người giao việc: nêu đường dẫn file, 3 điểm chính, các giả định và việc còn mở.
