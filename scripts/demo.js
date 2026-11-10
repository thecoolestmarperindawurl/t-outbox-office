#!/usr/bin/env node
// Diễn thử một buổi làm việc mẫu để xem dashboard chuyển động mà không cần chạy Claude.
// Dùng: node scripts/demo.js [--project <thư mục>] [--fast]
// Dữ liệu trong kịch bản là ví dụ minh họa, không phải kết quả thật.
'use strict';
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const pi = args.indexOf('--project');
const projectDir = path.resolve(pi >= 0 ? args[pi + 1] : process.cwd());
const speed = args.includes('--fast') ? 0.15 : 1;

const dir = path.join(projectDir, '.ai-office');
const file = path.join(dir, 'events.jsonl');
fs.mkdirSync(dir, { recursive: true });

const sid = 'demo-' + Date.now();
const A = (type, id) => ({ agent_type: 'office:' + type, agent_id: id });

// [giây chờ trước sự kiện, sự kiện]
const SCRIPT = [
  [0.5, { e: 'session_start', source: 'startup' }],
  [1.5, { e: 'prompt', text: 'Lập kế hoạch marketing ra mắt quán cà phê mới trong 30 ngày' }],
  [2, { e: 'assign', to: 'office:researcher', desc: 'Nghiên cứu thị trường và đối thủ quanh khu vực' }],
  [0.6, { e: 'agent_start', ...A('researcher', 'r1') }],
  [1.5, { e: 'tool', tool: 'WebSearch', detail: 'xu hướng quán cà phê 2026', ...A('researcher', 'r1') }],
  [2, { e: 'tool', tool: 'WebFetch', detail: 'example.com', ...A('researcher', 'r1') }],
  [2, { e: 'tool', tool: 'Write', detail: 'deliverables/research/thi-truong.md', ...A('researcher', 'r1') }],
  [1.5, { e: 'agent_stop', msg: 'Đã tổng hợp nghiên cứu.', ...A('researcher', 'r1') }],
  [1.5, { e: 'assign', to: 'office:strategist', desc: 'Định vị, thông điệp và kế hoạch 30 ngày' }],
  [0.6, { e: 'agent_start', ...A('strategist', 's1') }],
  [1.5, { e: 'tool', tool: 'Read', detail: 'deliverables/research/thi-truong.md', ...A('strategist', 's1') }],
  [2.5, { e: 'tool', tool: 'Write', detail: 'deliverables/strategy/ke-hoach-30-ngay.md', ...A('strategist', 's1') }],
  [1.5, { e: 'agent_stop', msg: 'Đã có kế hoạch.', ...A('strategist', 's1') }],
  [1.5, { e: 'assign', to: 'office:content-writer', desc: 'Lịch nội dung 4 tuần cho Facebook và TikTok' }],
  [0.3, { e: 'assign', to: 'office:designer', desc: 'Bộ nhận diện hình ảnh cho bài ra mắt' }],
  [0.3, { e: 'assign', to: 'office:web-developer', desc: 'Landing page nhận ưu đãi khai trương' }],
  [0.3, { e: 'assign', to: 'office:ads-specialist', desc: 'Cấu trúc campaign quảng cáo khai trương' }],
  [0.5, { e: 'agent_start', ...A('content-writer', 'c1') }],
  [0.2, { e: 'agent_start', ...A('designer', 'd1') }],
  [0.2, { e: 'agent_start', ...A('web-developer', 'w1') }],
  [0.2, { e: 'agent_start', ...A('ads-specialist', 'a1') }],
  [1.5, { e: 'tool', tool: 'Read', detail: 'deliverables/strategy/ke-hoach-30-ngay.md', ...A('content-writer', 'c1') }],
  [0.6, { e: 'tool', tool: 'Write', detail: 'deliverables/design/brief-hinh-anh.md', ...A('designer', 'd1') }],
  [0.6, { e: 'tool', tool: 'Write', detail: 'deliverables/web/index.html', ...A('web-developer', 'w1') }],
  [0.8, { e: 'tool', tool: 'WebSearch', detail: 'chính sách quảng cáo đồ uống', ...A('ads-specialist', 'a1') }],
  [1.5, { e: 'tool', tool: 'Write', detail: 'deliverables/content/lich-noi-dung.md', ...A('content-writer', 'c1') }],
  [1, { e: 'tool', tool: 'Edit', detail: 'deliverables/web/index.html', ...A('web-developer', 'w1') }],
  [1.2, { e: 'tool', tool: 'Write', detail: 'deliverables/ads/cau-truc-campaign.md', ...A('ads-specialist', 'a1') }],
  [1.5, { e: 'agent_stop', msg: 'Xong lịch nội dung.', ...A('content-writer', 'c1') }],
  [0.8, { e: 'agent_stop', msg: 'Xong brief hình ảnh.', ...A('designer', 'd1') }],
  [1, { e: 'agent_stop', msg: 'Xong campaign.', ...A('ads-specialist', 'a1') }],
  [1.2, { e: 'agent_stop', msg: 'Xong landing page.', ...A('web-developer', 'w1') }],
  [1.5, { e: 'assign', to: 'office:qa-reviewer', desc: 'Soát toàn bộ sản phẩm so với yêu cầu của sếp' }],
  [0.6, { e: 'agent_start', ...A('qa-reviewer', 'q1') }],
  [1.5, { e: 'tool', tool: 'Read', detail: 'deliverables/content/lich-noi-dung.md', ...A('qa-reviewer', 'q1') }],
  [1.5, { e: 'tool', tool: 'Read', detail: 'deliverables/web/index.html', ...A('qa-reviewer', 'q1') }],
  [1.5, { e: 'tool', tool: 'Write', detail: 'deliverables/qa/bao-cao-kiem-dinh.md', ...A('qa-reviewer', 'q1') }],
  [1.5, { e: 'agent_stop', msg: 'Đã soát xong.', ...A('qa-reviewer', 'q1') }],
  [2, { e: 'stop', msg: 'Đã tổng hợp báo cáo.' }],
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  console.log(`Đang diễn thử vào ${file}`);
  for (const [wait, ev] of SCRIPT) {
    await sleep(wait * 1000 * speed);
    fs.appendFileSync(file, JSON.stringify({ t: Date.now(), sid, ...ev }) + '\n');
  }
  console.log('Xong buổi diễn thử.');
})();
