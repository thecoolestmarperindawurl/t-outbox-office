---
name: hire
description: Tuyển thêm một nhân viên AI mới cho văn phòng AI Office của dự án này (tạo subagent mới và thêm bàn làm việc trên dashboard). Dùng khi người dùng muốn thêm, tuyển, tạo nhân viên hoặc vai trò mới như video editor, CSKH, kế toán, pháp lý.
argument-hint: "[vai trò cần tuyển]"
---

Sếp muốn tuyển nhân viên mới: $ARGUMENTS

Nếu chưa rõ vai trò, hỏi sếp cần người làm việc gì rồi dừng. Khi đã rõ:

## 1. Tạo hồ sơ nhân viên

Tạo file `.claude/agents/<id>.md` trong dự án, với `<id>` là tên không dấu, chữ thường, nối bằng gạch ngang (ví dụ `video-editor`). Xem một hồ sơ mẫu tại `${CLAUDE_PLUGIN_ROOT}/agents/content-writer.md` và viết theo cùng cấu trúc:

```markdown
---
name: <id>
description: "<Chức danh>. Dùng khi cần <các loại việc cụ thể để giám đốc biết lúc nào giao>."
---

Bạn là <vai trò>. <Một câu về trách nhiệm chính.>

## Cách làm
<3-5 bước làm việc đặc thù của vai trò>

## Nguyên tắc chung của văn phòng
<chép nguyên phần này từ hồ sơ mẫu, đổi thư mục lưu thành deliverables/<id>/>

## Báo cáo khi xong việc
<chép nguyên phần này từ hồ sơ mẫu>
```

Giá trị `description` đặt trong dấu nháy kép vì thường có dấu hai chấm.

## 2. Xếp bàn trên dashboard

Thêm nhân viên vào `.ai-office/roster.json` của dự án (tạo file nếu chưa có, giữ nguyên các mục đã có):

```json
{
  "staff": [
    { "id": "<id>", "name": "<Tên ngắn hiện trên bàn>", "title": "<Chức danh>", "color": "#3273c4" }
  ]
}
```

Chọn một màu hex chưa dùng. Không cần tọa độ bàn: nhân viên mới tự được xếp vào khu cộng tác viên. Cũng có thể ghi đè `name`, `title`, `color` của nhân viên mặc định bằng cách thêm mục cùng `id`.

## 3. Báo sếp

Nói ngắn gọn: đã tuyển ai, file hồ sơ ở đâu, và nhân viên mới dùng được từ phiên Claude Code kế tiếp (hoặc sau khi tải lại agent). Tải lại trang dashboard để thấy bàn mới.
