---
name: ad-campaign
description: "Thiết kế chiến dịch quảng cáo trả phí: mục tiêu, cấu trúc campaign/nhóm quảng cáo, đối tượng, ngân sách, mẫu quảng cáo theo giới hạn ký tự, kế hoạch A/B test và ngưỡng dừng/tăng ngân sách. Dùng cho Meta, Google, TikTok và các nền tảng quảng cáo khác."
argument-hint: "[nền tảng, mục tiêu, ngân sách, thời gian]"
---

Skill của phòng Marketing (người dùng chính: `t-outbox:ads-specialist`). Việc cần làm:

$ARGUMENTS

Mục tiêu: Ra một chiến dịch quảng cáo có cấu trúc rõ, đo được, biết lúc nào dừng và lúc nào tăng tiền. Nếu phần việc ở trên trống, dùng bối cảnh của lượt giao việc hiện tại.

## Đầu vào cần có

- Mục tiêu (nhận biết, lead, đơn hàng) và sự kiện chuyển đổi đo được
- Ngân sách, thời gian, thị trường
- Kế hoạch marketing và nội dung sẵn có

Thiếu đầu vào thì đặt giả định hợp lý, ghi rõ trong sản phẩm, rồi làm tiếp. Chỉ hỏi lại khi câu trả lời làm đổi hẳn hướng làm.

## Các bước

1. Chốt mục tiêu chiến dịch khớp với sự kiện chuyển đổi đo được thật (pixel, form, UTM).
2. Dựng cấu trúc: campaign, nhóm quảng cáo, đối tượng (mới, tương tự, bám đuổi), vị trí, ngân sách từng phần và lý do.
3. Viết 3-5 biến thể mẫu quảng cáo đúng giới hạn ký tự của nền tảng; mỗi biến thể kiểm tra một giả thuyết.
4. Kế hoạch A/B: biến số kiểm tra, thời gian chạy tối thiểu, chỉ số quyết định.
5. Ngưỡng hành động: khi nào dừng, khi nào tăng ngân sách, lịch xem lại.
6. Dự báo CPM/CPC/CPA chỉ là ước tính: ghi cách tính và nguồn benchmark kèm ngày. Chính sách quảng cáo nhạy cảm (sức khỏe, tài chính) thì tra lại trước khi viết.

## Đầu ra

Lưu vào `deliverables/marketing/campaign.md` (tạo thư mục nếu chưa có), theo khung:

```markdown
# Chiến dịch quảng cáo: <tên>
## Mục tiêu và đo lường
## Cấu trúc (bảng: campaign, nhóm, đối tượng, vị trí, ngân sách)
## Mẫu quảng cáo (bảng: biến thể, tiêu đề, nội dung, CTA, giả thuyết)
## Kế hoạch A/B
## Ngưỡng dừng / tăng ngân sách
## Dự báo (ước tính, cách tính, nguồn)
```

## Tự soát trước khi nộp

- [ ] Ngân sách cộng đúng tổng
- [ ] Mẫu quảng cáo đúng giới hạn ký tự
- [ ] Dự báo ghi rõ là ước tính
- [ ] Không hứa hẹn kết quả quá mức hoặc vi phạm chính sách nền tảng
- [ ] Đúng phạm vi việc được giao, không lan sang việc khác

## Nguyên tắc dữ liệu

Mỗi con số, nhận định quan trọng phải ghi rõ là **dữ liệu có nguồn** (kèm link, ngày), **ước tính** (kèm cách tính) hay **ý kiến đề xuất**. Không có dữ liệu thì ghi "chưa có dữ liệu, cần kiểm chứng", không tự đặt số.

Khi báo cáo lại cho người giao việc: nêu đường dẫn file, 3 điểm chính, các giả định và việc còn mở.
