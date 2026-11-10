# AI Office

Biến Claude Code thành một văn phòng. Bạn là sếp, Claude là giám đốc điều hành, còn các subagent là nhân viên content, design, web, SEO, ads, data, QA. Một dashboard chạy trên máy bạn cho thấy ai đang ngồi bàn làm việc gì, theo thời gian thực.

![Dashboard AI Office](docs/screenshot.png)

## Có gì trong repo

| Thành phần | Vị trí | Việc nó làm |
| --- | --- | --- |
| 9 nhân viên | `agents/` | Subagent chuyên môn, mỗi người một hồ sơ (system prompt) riêng |
| Lệnh `/office:brief` | `skills/brief/` | Sếp giao việc lớn, giám đốc chia việc, giao người, cho QA soát, rồi báo cáo |
| Lệnh `/office:open` | `skills/open/` | Mở dashboard văn phòng |
| Lệnh `/office:hire` | `skills/hire/` | Tuyển thêm nhân viên mới cho dự án |
| Hooks | `hooks/`, `scripts/record-event.js` | Ghi lại hoạt động của phiên làm việc vào `.ai-office/events.jsonl` |
| Dashboard | `scripts/server.js`, `dashboard/` | Server local không cần cài thư viện, vẽ sơ đồ văn phòng |
| Sơ đồ và nhân sự | `office/roster.json` | Phòng, bàn, tên, màu của từng nhân viên |

## Nhân sự mặc định

| Nhân viên | Tên gọi khi giao việc | Chuyên môn |
| --- | --- | --- |
| Chiến lược | `office:strategist` | Định vị, thông điệp, kênh, ngân sách, KPI, kế hoạch tổng |
| Nghiên cứu | `office:researcher` | Thị trường, đối thủ, khách hàng, kiểm chứng số liệu |
| Content | `office:content-writer` | Bài viết, kịch bản, email, copy, lịch nội dung |
| Design | `office:designer` | Ý tưởng hình ảnh, brief thiết kế, dựng thiết kế |
| Web | `office:web-developer` | Landing page, website, mã đo lường |
| SEO | `office:seo-specialist` | Từ khóa, cấu trúc nội dung, on-page, kỹ thuật |
| Ads | `office:ads-specialist` | Cấu trúc campaign, đối tượng, mẫu quảng cáo, A/B test |
| Data | `office:data-analyst` | Phân tích số liệu, bảng KPI, biểu đồ |
| QA | `office:qa-reviewer` | Soát sản phẩm trước khi bàn giao |

Mọi nhân viên theo chung một nguyên tắc: không bịa số liệu, số liệu phải có nguồn, tách rõ dữ liệu đã kiểm chứng, ước tính và nhận định. Sản phẩm được lưu vào `deliverables/<phòng>/` trong dự án của bạn.

## Yêu cầu

- Claude Code (đã thử với bản 2.1.322)
- Node.js 18 trở lên

## Cài đặt

Trong Claude Code, thêm repo này làm marketplace rồi cài plugin (thay `<owner>/<repo>` bằng địa chỉ GitHub của repo):

```
/plugin marketplace add <owner>/<repo>
/plugin install office@ai-office
```

Hoặc dùng thử ngay từ bản clone, không cần cài:

```bash
claude --plugin-dir /đường/dẫn/tới/ai-office
```

## Cách dùng

1. Mở Claude Code trong thư mục dự án của bạn.
2. Gõ `/office:open` để mở dashboard (mặc định `http://127.0.0.1:4747`).
3. Giao việc. Việc lớn thì dùng `/office:brief`:

   ```
   /office:brief Lập kế hoạch marketing 30 ngày ra mắt quán cà phê mới, ngân sách 50 triệu
   ```

   Việc nhỏ thì cứ nói bình thường, hoặc gọi đích danh: "giao cho office:content-writer viết 3 caption".
4. Xem văn phòng: nhân viên được giao việc sẽ rời pantry về bàn, bong bóng cho biết họ đang đọc, viết hay tìm gì. Bảng công việc và nhật ký nằm bên phải.

Khi plugin bật, mỗi phiên làm việc được nhắc ngắn gọn rằng Claude đang đóng vai giám đốc và nên giao việc chuyên môn cho nhân viên. Việc nhỏ Claude vẫn tự làm.

### Xem thử không cần Claude

```bash
node scripts/server.js --project /tmp/office-demo --open
```

```bash
node scripts/demo.js --project /tmp/office-demo
```

Lệnh thứ hai diễn một buổi làm việc mẫu dài khoảng 50 giây. Nội dung trong kịch bản là ví dụ minh họa.

## Tùy biến

**Tuyển thêm nhân viên.** Gõ `/office:hire video editor`. Claude tạo hồ sơ tại `.claude/agents/<id>.md` và thêm bàn vào `.ai-office/roster.json` của dự án. Nhân viên chưa có bàn riêng ngồi ở khu cộng tác viên, kể cả các subagent sẵn có của Claude Code như `Explore` hay `general-purpose`.

**Đổi tên, màu, chức danh.** Tạo `.ai-office/roster.json` trong dự án và ghi đè theo `id`:

```json
{
  "staff": [
    { "id": "content-writer", "name": "Mai", "title": "Content lead", "color": "#b5651d" }
  ]
}
```

**Sửa hồ sơ nhân viên.** Mỗi file trong `agents/` là một system prompt viết bằng tiếng Việt. Sửa trực tiếp để đổi cách làm việc, hoặc thêm trường `model`, `tools` vào phần đầu file để giới hạn mô hình và công cụ.

**Vẽ lại văn phòng.** Phòng và tọa độ bàn nằm trong `office/roster.json` (mặt sàn 1200 x 720).

## Cách hoạt động

```
Claude Code ── hooks ──> scripts/record-event.js ──> <dự án>/.ai-office/events.jsonl
                                                              │
                              trình duyệt <── SSE ── scripts/server.js
```

Hook lắng nghe các sự kiện `SessionStart`, `UserPromptSubmit`, `PreToolUse`, `SubagentStart`, `SubagentStop`, `Stop`, `SessionEnd` và ghi mỗi sự kiện thành một dòng JSON. Server đọc phần mới của file rồi đẩy sang trình duyệt; toàn bộ trạng thái văn phòng được dựng lại từ file này, nên tải lại trang không mất gì.

## Dữ liệu và quyền riêng tư

- Mọi thứ nằm trên máy bạn. Dashboard chỉ nghe ở `127.0.0.1` và không gửi dữ liệu đi đâu.
- File sự kiện lưu: 280 ký tự đầu của lời bạn giao việc và của câu trả lời cuối, mô tả ngắn của việc được giao, tên công cụ, đường dẫn file, câu truy vấn tìm kiếm, tên miền trang được mở. Nó không lưu nội dung file hay câu lệnh shell.
- `.ai-office/events.jsonl` tự được thêm vào `.gitignore` của thư mục đó. File tự xoay vòng khi vượt 5 MB.
- Tắt ghi sự kiện tạm thời bằng biến môi trường `AI_OFFICE_DISABLED=1`.

## Giới hạn hiện tại

- Dashboard theo dõi từng thư mục dự án. Nhiều phiên Claude Code cùng dự án sẽ dùng chung một văn phòng và một giám đốc trên màn hình.
- Trạng thái "đang làm" dựa vào sự kiện hook. Nếu một phiên bị tắt đột ngột, nhân viên của phiên đó ở lại bàn tối đa 30 phút rồi mới về pantry.
- Phòng Design chỉ dựng được bản thiết kế thật khi phiên làm việc có công cụ thiết kế kết nối (ví dụ Canva qua MCP); nếu không, kết quả là brief hoặc file SVG/HTML.

## Giấy phép

MIT. Xem [LICENSE](LICENSE).
