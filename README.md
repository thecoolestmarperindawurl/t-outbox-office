# T-outbox

Biến Claude Code thành một tập đoàn. Bạn là sếp, Claude là CEO, các subagent là trưởng phòng và nhân viên. Trụ sở là một tòa tháp 3D chạy trên máy bạn: mỗi phòng ban một tầng, nhân viên đi lại, ngồi bàn, giao việc cho nhau theo thời gian thực, và tất cả mặc đồng phục theo brand bạn nạp vào.

![Trụ sở T-outbox](docs/screenshot.png)

![Các tầng phòng ban](docs/floor.png)

![Cận cảnh một trưởng phòng](docs/closeup.png)

Ảnh chụp ở chế độ diễn thử, nội dung công việc trong ảnh là ví dụ minh họa.

## Cơ cấu công ty

CEO là phiên Claude Code chính. CEO giao việc cho trưởng phòng, trưởng phòng chia tiếp cho nhân viên trong phòng; việc gọn của một chuyên môn thì CEO giao thẳng cho nhân viên.

| Phòng | Trưởng phòng | Nhân viên |
| --- | --- | --- |
| Marketing | `marketing-lead` | `content-writer`, `seo-specialist`, `ads-specialist` |
| Sản phẩm & Thiết kế | `product-manager` | `designer`, `researcher` |
| Kỹ thuật & Dữ liệu | `tech-lead` | `web-developer`, `data-analyst`, `qa-reviewer` |
| Kinh doanh & CSKH | `sales-lead` | `customer-support` |
| Vận hành | `operations-lead` | `finance-analyst`, `legal-counsel`, `hr-specialist` |

Khi gọi đích danh, thêm tiền tố plugin: `t-outbox:content-writer`.

Tòa nhà có 7 tầng: tầng 1 là sảnh đón tiếp (cũng là chỗ ngồi của cộng tác viên), tầng 2 Kinh doanh & CSKH, tầng 3 Vận hành, tầng 4 Kỹ thuật & Dữ liệu, tầng 5 Sản phẩm & Thiết kế, tầng 6 Marketing, tầng 7 Ban điều hành. Mái có biển tên công ty. Thứ tự tầng nằm trong `office/roster.json`.

Đây là cơ cấu của một doanh nghiệp điển hình, không phải bản sao sơ đồ tổ chức của công ty nào. Mọi nhân viên theo chung nguyên tắc: không bịa số liệu, số liệu phải có nguồn, tách rõ dữ liệu đã kiểm chứng, ước tính và nhận định. Sản phẩm được lưu vào `deliverables/<phòng>/` trong dự án của bạn. Chuyên viên tài chính và pháp chế luôn ghi rõ sản phẩm của họ là bản tham khảo, cần người có chứng chỉ hành nghề xác nhận.

## Yêu cầu

- Claude Code (đã thử với bản 2.1.322)
- Node.js 18 trở lên
- Trình duyệt có WebGL cho bản 3D; không có thì trang tự chuyển sang sơ đồ 2D

## Cài đặt

Trong Claude Code, thêm repo này làm marketplace rồi cài plugin:

```
/plugin marketplace add thecoolestmarperindawurl/t-outbox-office
/plugin install t-outbox@t-outbox
```

Hoặc dùng thử ngay từ bản clone, không cần cài:

```bash
claude --plugin-dir /đường/dẫn/tới/t-outbox
```

## Cách dùng

| Lệnh | Việc nó làm |
| --- | --- |
| `/t-outbox:open` | Mở trụ sở (mặc định `http://127.0.0.1:4747`) |
| `/t-outbox:brief <yêu cầu>` | Giao một đầu việc lớn: CEO chia theo phòng ban, giao người, cho QA soát, rồi báo cáo |
| `/t-outbox:brand <nguồn brand>` | Nạp tên, logo chữ và màu thương hiệu để đổi đồng phục và văn phòng |
| `/t-outbox:hire <vai trò>` | Tuyển thêm nhân viên mới cho dự án |

Ví dụ:

```
/t-outbox:brief Ra mắt khóa học mới trong 30 ngày, ngân sách 50 triệu: cần kế hoạch marketing, landing page và dự toán
```

Việc nhỏ thì cứ nói bình thường. Khi plugin bật, mỗi phiên được nhắc ngắn gọn rằng Claude đang là CEO và nên giao việc chuyên môn cho đúng phòng; việc nhỏ Claude vẫn tự làm.

### Xem thử không cần Claude

```bash
node scripts/server.js --project /tmp/t-outbox-demo --open
```

Khi chưa có việc thật trong 10 phút gần nhất, văn phòng tự diễn một buổi làm việc mẫu và ghi rõ "Demo" ở góc trên. Ngay khi Claude Code bắt đầu làm việc, văn phòng chuyển sang việc thật.

## Trụ sở cho thấy gì

| Trong tòa nhà | Claude Code đang |
| --- | --- |
| CEO ngồi bàn ở tầng trên cùng, bong bóng ghi việc đang làm | Nhận yêu cầu, đọc, viết, chạy lệnh |
| Tờ giấy bay vòng ra mặt tiền, từ tầng người giao tới bàn người nhận | Gọi một subagent |
| Nhân viên rời góc tiếp khách đi về bàn, ngồi gõ phím, màn hình sáng màu phòng ban | Subagent đang chạy |
| Giơ tay, dấu chấm than đỏ trên đầu, bong bóng "Chờ sếp duyệt quyền" | Chờ bạn cấp quyền cho một công cụ |
| Gật đầu hoặc nhảy mừng, kèm pháo giấy | Subagent xong việc, hoặc CEO xong một lượt |
| Biển "Đang tuyển" trên bàn | Vị trí đang để trống |

Các nút phía trên:

- **Tùy biến:** đổi tên công ty, khẩu hiệu, logo chữ, ba màu brand, tên từng nhân viên, đánh dấu vị trí đang tuyển. Lưu xong trụ sở đổi ngay.
- **Sôi nổi** (mặc định bật): việc CEO tự làm cũng được một nhân viên đúng chuyên môn hỗ trợ, để cả tòa nhà chuyển động. Tìm trên web thì Research hỗ trợ, viết file `.md` thì Content, viết mã thì Web, file số liệu thì Data. Tắt đi thì chỉ CEO và subagent thật chuyển động.
- **Theo việc** (mặc định bật): máy quay tự lướt tới gần người vừa nhận việc, xong lượt thì lùi về toàn cảnh. Kéo chuột là máy quay trả quyền điều khiển cho bạn.
- **Ẩn chi tiết:** ẩn tên file, câu tìm kiếm và nội dung việc trong bong bóng, bảng việc và nhật ký, dùng khi quay màn hình.
- **Buổi tối:** đổi ánh sáng ngày và tối.
- **Góc nhìn mặc định, Xem 2D:** kéo chuột để xoay, lăn chuột để phóng. Tới gần sẽ hiện biển tên trên bàn. Bấm tên một phòng trong danh sách **Phòng ban** để lướt tới tầng đó.

Bên dưới là **bảng công việc** ba cột (chờ nhận, đang làm, đã xong). Mỗi thẻ ghi người làm, phòng ban, người giao, đồng hồ chạy và việc đang làm lúc này; bấm vào thẻ để xem từng bước. Khi nhiều phiên Claude Code cùng làm trong một dự án, mỗi phiên có một màu riêng trên thẻ và trên tờ giấy giao việc.

## Đồng phục theo brand

Nhân viên mặc áo màu chính của brand, đeo dây thẻ màu nhấn, thẻ nhân viên có vạch màu phòng ban. Trưởng phòng và CEO mặc vest màu phụ; cà vạt mang màu nhấn. Sảnh, tầng điều hành và mái nhà có biển tên công ty; thảm, sofa và viền mái mang màu brand.

Brand mặc định của repo là **LanhMar**: tím xanh `#2D2FEF` (áo), tím than `#241F45` (vest, quần), cam `#FF7A45` (dây thẻ, cà vạt), nền giao diện lavender `#F3F1FD`. Các mã màu lấy từ brand guideline LanhMar. Chữ dùng Montserrat nếu máy đã cài, không thì dùng font hệ thống (trang không tải font từ mạng). Logo chữ "T" là dạng tạm, chưa phải logo LanhMar.

Cách nạp brand:

1. `/t-outbox:brand` kèm nguồn, ví dụ `/t-outbox:brand theo brand guideline trong docs/brand.md`. Claude đọc guideline và ghi `.t-outbox/brand.json`.
2. Hoặc bấm **Tùy biến** trong văn phòng.
3. Hoặc tự sửa `.t-outbox/brand.json`:

```json
{
  "name": "Tên công ty",
  "tagline": "Khẩu hiệu ngắn",
  "logoText": "T",
  "colors": { "primary": "#1f3a8a", "secondary": "#1b2238", "accent": "#ff8a1f" },
  "uniform": { "style": "polo" }
}
```

`uniform.trousers` (tùy chọn) đổi màu quần. `theme` (tùy chọn) đổi màu giao diện trang: `bg`, `panel`, `ink`, `muted`, `line`.

## Tùy biến nhân sự

Tạo `.t-outbox/roster.json` trong dự án và ghi đè theo `id`, hoặc thêm người mới:

```json
{
  "staff": [
    { "id": "content-writer", "name": "Mai" },
    { "id": "seo-specialist", "off": true },
    { "id": "designer", "match": ["*creative*", "kf-design-*"] },
    { "id": "video-editor", "name": "Video", "title": "Dựng video", "dept": "marketing", "gender": "f", "hair": "#6b3f26", "skin": "#e2ab85" }
  ]
}
```

- `match`: các subagent bạn đã có sẵn, tên khớp mẫu, sẽ ngồi vào bàn của người này. Subagent không khớp ai thì ngồi khu cộng tác viên.
- `off: true`: vị trí để trống, bàn hiện biển "Đang tuyển".
- Người mới có `dept` được xếp bàn kế tiếp trên tầng của phòng đó; không có `dept` thì ngồi ở sảnh tầng 1.
- `gender` (`m` hoặc `f`), `hair`, `skin` (mã màu hex) đổi ngoại hình; `model` chọn đích danh một nhân vật (ví dụ `female-f`). Hai nhân vật `male-a` và `female-e` giữ màu tóc gốc vì tóc dùng chung ô màu với phần khác.

Hồ sơ từng nhân viên là một file tiếng Việt trong `agents/`; sửa trực tiếp để đổi cách làm việc. Kích thước tòa nhà, thứ tự tầng và phòng ban nằm trong `office/roster.json`.

## Cách hoạt động

```
Claude Code ── hooks ──> scripts/record-event.js ──> <dự án>/.t-outbox/events.jsonl
                                                              │
                              trình duyệt <── SSE ── scripts/server.js
```

Hook lắng nghe `SessionStart`, `UserPromptSubmit`, `PreToolUse`, `PermissionRequest`, `SubagentStart`, `SubagentStop`, `Stop`, `SessionEnd` và ghi mỗi sự kiện thành một dòng JSON. Server đẩy phần mới của file sang trình duyệt; trạng thái văn phòng được dựng lại từ file này nên tải lại trang không mất gì.

Trụ sở 3D dựng bằng [three.js](https://threejs.org) (giấy phép MIT, đã kèm trong `dashboard/vendor/` để chạy offline).

### Mô hình 3D và ghi công

| Mô hình | Tác giả | Giấy phép | Vị trí |
| --- | --- | --- | --- |
| Kenney Mini Characters 2.0 (8 nhân vật, mỗi người 32 hoạt ảnh) | Kenney (www.kenney.nl) | CC0 1.0 | `dashboard/assets/people/` |
| Kenney Furniture Kit 2.0 (bàn làm việc, ghế xoay, màn hình, sofa, tủ sách, quầy, cây) | Kenney (www.kenney.nl) | CC0 1.0 | `dashboard/assets/office/` |

Hai bộ được tải trực tiếp từ kenney.nl; file `License.txt` gốc của từng bộ nằm cùng thư mục. Kết cấu tòa nhà, biển hiệu, cây ngoài quảng trường và dây đeo thẻ dựng bằng hình khối trong mã nguồn.

Repo dùng 8 trong 13 nhân vật đời thường của bộ gốc, chọn những người hợp bối cảnh văn phòng: 6 người cho nhân viên (`female-b`, `female-c`, `female-e`, `female-f`, `male-a`, `male-b`) và 2 người mặc vest cho trưởng phòng, CEO (`female-d`, `male-d`). Áo, quần, cà vạt, tóc và màu da được đổi bằng cách tô lại bảng màu của nhân vật ngay trong trình duyệt; bảng gán vùng màu là `LOOKS` trong `dashboard/view3d.js`.

## Dữ liệu và quyền riêng tư

- Mọi thứ nằm trên máy bạn. Server chỉ nghe ở `127.0.0.1`, không gửi dữ liệu đi đâu và trang không tải gì từ mạng.
- Server chỉ ghi vào `.t-outbox/brand.json` và `.t-outbox/roster.json`, khi bạn bấm Lưu trong bảng Tùy biến. Yêu cầu ghi từ trang web khác bị từ chối.
- File sự kiện lưu: 280 ký tự đầu của lời bạn giao việc và của câu trả lời cuối, mô tả ngắn của việc được giao, tên công cụ, đường dẫn file, câu truy vấn tìm kiếm, tên miền trang được mở. Nó không lưu nội dung file hay câu lệnh shell.
- `events.jsonl` tự được loại khỏi git và tự xoay vòng khi vượt 5 MB.
- Tắt ghi sự kiện tạm thời bằng biến môi trường `T_OUTBOX_DISABLED=1`.

## Giới hạn hiện tại

- Trưởng phòng chỉ giao tiếp được cho nhân viên khi Claude Code cho phép subagent gọi subagent. Nếu môi trường đặt `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH=1`, trưởng phòng sẽ tự làm phần việc đó và ghi rõ trong báo cáo.
- Dấu chờ duyệt quyền chỉ tắt khi nhân viên đó có hoạt động kế tiếp, nên có thể còn hiện một lúc sau khi bạn đã duyệt.
- Phiên bị tắt đột ngột: nhân viên của phiên đó ở lại bàn tối đa 30 phút rồi mới về góc tiếp khách.
- Nhân vật theo phong cách khối vuông đơn giản; có 8 dáng người.
- Nhân viên đứng chờ ở góc tiếp khách của tầng mình; chưa có cảnh đi thang máy giữa các tầng.
- Chưa có chụp ảnh, quay clip và tour trong trang; danh sách việc riêng của Claude (TodoWrite) chưa hiện thành thẻ.
- Design chỉ dựng được bản thiết kế thật khi phiên làm việc có công cụ thiết kế kết nối (ví dụ Canva qua MCP); nếu không, kết quả là brief hoặc file SVG/HTML.

## Giấy phép

Mã nguồn: MIT, xem [LICENSE](LICENSE). three.js giữ giấy phép riêng tại `dashboard/vendor/LICENSE-three.txt`. Mô hình 3D: CC0, xem bảng ghi công ở trên và các file `License.txt` trong `dashboard/assets/`.
