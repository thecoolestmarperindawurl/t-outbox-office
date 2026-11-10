---
name: hire
description: Tuyển thêm một nhân viên AI mới cho công ty T-outbox của dự án này (tạo subagent mới và thêm bàn làm việc trong văn phòng). Dùng khi người dùng muốn thêm, tuyển, tạo nhân viên hoặc vai trò mới như video editor, kế toán trưởng, chuyên viên đối tác.
argument-hint: "[vai trò cần tuyển]"
---

Sếp muốn tuyển nhân viên mới: $ARGUMENTS

Nếu chưa rõ vai trò, hỏi sếp cần người làm việc gì rồi dừng. Khi đã rõ:

## 1. Tạo hồ sơ nhân viên

Tạo file `.claude/agents/<id>.md` trong dự án, với `<id>` là tên không dấu, chữ thường, nối bằng gạch ngang (ví dụ `video-editor`). Xem một hồ sơ mẫu tại `${CLAUDE_PLUGIN_ROOT}/agents/content-writer.md` và viết theo cùng cấu trúc:

```markdown
---
name: <id>
description: "<Chức danh>, phòng <tên phòng>. Dùng khi cần <các loại việc cụ thể để CEO biết lúc nào giao>."
---

Bạn là <vai trò>. <Một câu về trách nhiệm chính.>

## Cách làm
<3-5 bước làm việc đặc thù của vai trò>

## Nguyên tắc chung của công ty
<chép nguyên phần này từ hồ sơ mẫu, đổi thư mục lưu thành deliverables/<phòng>/>

## Báo cáo khi xong việc
<chép nguyên phần này từ hồ sơ mẫu>
```

Giá trị `description` đặt trong dấu nháy kép vì thường có dấu hai chấm.

## 2. Xếp bàn trong văn phòng

Thêm nhân viên vào `.t-outbox/roster.json` của dự án (tạo file nếu chưa có, giữ nguyên các mục đã có):

```json
{
  "staff": [
    { "id": "<id>", "name": "<Tên ngắn hiện trên bàn>", "title": "<Chức danh>", "dept": "<mã phòng>" }
  ]
}
```

Mã phòng là một trong: `marketing`, `product`, `engineering`, `sales`, `operations`. Nhân viên mới mặc đồng phục công ty, mang màu của phòng và ngồi ở khu cộng tác viên. Văn phòng tự cập nhật khi file được lưu.

Các tùy chọn khác cho một mục `staff` (kể cả nhân viên mặc định, ghi đè theo `id`):

- `match`: danh sách mẫu tên subagent được coi là người này, ví dụ `["*video*", "kf-video-*"]`. Dùng khi sếp đã có sẵn agent riêng và muốn nó ngồi vào một bàn có sẵn.
- `off: true`: vị trí đang trống, bàn hiện biển "Đang tuyển".

## 3. Báo sếp

Nói ngắn gọn: đã tuyển ai, vào phòng nào, file hồ sơ ở đâu, và nhân viên mới dùng được từ phiên Claude Code kế tiếp (hoặc sau khi tải lại agent).
