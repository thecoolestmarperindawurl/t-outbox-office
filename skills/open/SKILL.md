---
name: open
description: Mở dashboard văn phòng AI Office để xem nhân viên (subagent) đang làm gì. Dùng khi người dùng muốn mở, xem hoặc khởi động văn phòng, dashboard, màn hình theo dõi agent.
---

Khởi động dashboard văn phòng cho dự án hiện tại.

1. Chạy lệnh sau ở chế độ nền (background), để nó tiếp tục chạy suốt phiên làm việc:

   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/scripts/server.js" --project "$PWD" --open
   ```

2. Đọc dòng đầu ra có dạng `AI Office: http://127.0.0.1:<cổng>` để lấy địa chỉ thật. Cổng mặc định là 4747; nếu cổng bận, server tự chọn cổng kế tiếp.
3. Báo cho người dùng địa chỉ đó trong một dòng. Nếu trình duyệt không tự mở (ví dụ khi chạy trên máy chủ từ xa), bảo họ tự mở địa chỉ này.

Dashboard chỉ nghe trên 127.0.0.1 và chỉ đọc file `.ai-office/events.jsonl` của dự án. Nếu server đã chạy sẵn cho dự án này thì chỉ cần nhắc lại địa chỉ, không khởi động thêm.
