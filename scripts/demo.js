#!/usr/bin/env node
// Diễn thử một buổi làm việc mẫu bằng cách ghi sự kiện vào file của dự án,
// đúng đường đi của sự kiện thật (hook -> file -> server -> trình duyệt).
// Dùng: node scripts/demo.js [--project <thư mục>] [--fast]
// Kịch bản nằm ở office/demo-script.json và chỉ là ví dụ minh họa.
'use strict';
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const pi = args.indexOf('--project');
const projectDir = path.resolve(pi >= 0 ? args[pi + 1] : process.cwd());
const speed = args.includes('--fast') ? 0.15 : 1;

const dir = path.join(projectDir, '.t-outbox');
const file = path.join(dir, 'events.jsonl');
fs.mkdirSync(dir, { recursive: true });

const script = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'office', 'demo-script.json'), 'utf8'));
const sid = 'demo-' + Date.now();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  console.log(`Đang diễn thử vào ${file}`);
  for (const [wait, ev] of script) {
    await sleep(wait * 1000 * speed);
    fs.appendFileSync(file, JSON.stringify({ t: Date.now(), sid, ...ev }) + '\n');
  }
  console.log('Xong buổi diễn thử.');
})();
