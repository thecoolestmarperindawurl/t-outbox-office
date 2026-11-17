---
name: qa-check
description: "Soát chất lượng đầu ra trước khi bàn giao cho sếp: đối chiếu yêu cầu, kiểm số liệu có nguồn, mâu thuẫn giữa các tài liệu, chính tả, link và file, chạy thử trang/mã; xếp lỗi theo mức độ. Dùng sau khi các phòng làm xong, trước khi báo cáo."
argument-hint: "[yêu cầu ban đầu, các file cần soát]"
---

Skill của phòng Kỹ thuật & Dữ liệu (người dùng chính: `t-outbox:qa-reviewer`). Việc cần làm:

$ARGUMENTS

Mục tiêu: Bắt lỗi trước khi sếp thấy, báo cáo rõ cái gì đạt, cái gì phải sửa. Nếu phần việc ở trên trống, dùng bối cảnh của lượt giao việc hiện tại.

## Đầu vào cần có

- Yêu cầu ban đầu của sếp và tiêu chí nghiệm thu
- Các sản phẩm trong `deliverables/`

Thiếu đầu vào thì đặt giả định hợp lý, ghi rõ trong sản phẩm, rồi làm tiếp. Chỉ hỏi lại khi câu trả lời làm đổi hẳn hướng làm.

## Các bước

1. Đọc lại yêu cầu ban đầu, lập danh sách đối chiếu.
2. Đối chiếu từng yêu cầu: đạt, đạt một phần, thiếu (chỉ ra vị trí trong file).
3. Số liệu: có nguồn không, nguồn mở được không, có ghi là ước tính không.
4. Nhất quán giữa các tài liệu: thông điệp, ngày, ngân sách, tên gọi, giá.
5. Chính tả, giọng văn theo brand; link và đường dẫn file tồn tại.
6. Trang web hoặc mã: chạy thử, ghi lỗi thấy tận mắt (kèm bước tái hiện).
7. Xếp lỗi: phải sửa trước khi bàn giao, nên sửa, gợi ý. Không thấy lỗi thì nói không thấy, không bịa lỗi.

## Đầu ra

Lưu vào `deliverables/engineering/bao-cao-qa.md` (tạo thư mục nếu chưa có), theo khung:

```markdown
# Báo cáo QA: <dự án>
## Kết luận: đạt / đạt có điều kiện / chưa đạt
## Đối chiếu yêu cầu (bảng: yêu cầu, trạng thái, vị trí, ghi chú)
## Lỗi phải sửa
## Nên sửa
## Gợi ý
## Đã kiểm những gì, bằng cách nào
```

## Tự soát trước khi nộp

- [ ] Mỗi lỗi có vị trí cụ thể
- [ ] Không tự sửa sản phẩm của người khác khi chưa được giao
- [ ] Ghi rõ phạm vi đã kiểm
- [ ] Đúng phạm vi việc được giao, không lan sang việc khác

## Nguyên tắc dữ liệu

Mỗi con số, nhận định quan trọng phải ghi rõ là **dữ liệu có nguồn** (kèm link, ngày), **ước tính** (kèm cách tính) hay **ý kiến đề xuất**. Không có dữ liệu thì ghi "chưa có dữ liệu, cần kiểm chứng", không tự đặt số.

Khi báo cáo lại cho người giao việc: nêu đường dẫn file, 3 điểm chính, các giả định và việc còn mở.
