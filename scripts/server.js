#!/usr/bin/env node
// Dashboard AI Office: server tĩnh + luồng sự kiện (SSE) đọc từ <project>/.ai-office/events.jsonl.
// Không phụ thuộc thư viện ngoài. Chỉ nghe trên 127.0.0.1.
'use strict';
const fs = require('fs');
const http = require('http');
const path = require('path');
const { spawn } = require('child_process');

const args = process.argv.slice(2);
function arg(name, fallback) {
  const i = args.indexOf('--' + name);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : fallback;
}

const projectDir = path.resolve(arg('project', process.cwd()));
const startPort = Number(arg('port', process.env.AI_OFFICE_PORT || 4747));
const shouldOpen = args.includes('--open');

const pluginRoot = path.resolve(__dirname, '..');
const dashboardDir = path.join(pluginRoot, 'dashboard');
const officeDir = path.join(projectDir, '.ai-office');
const eventsFile = path.join(officeDir, 'events.jsonl');

const BACKLOG_LINES = 3000;
const POLL_MS = 400;
const STATIC = {
  '/': ['index.html', 'text/html; charset=utf-8'],
  '/app.js': ['app.js', 'text/javascript; charset=utf-8'],
  '/style.css': ['style.css', 'text/css; charset=utf-8'],
};

function readJson(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; }
}

// Roster mặc định của plugin, cho phép dự án ghi đè hoặc thêm nhân viên theo id.
function roster() {
  const base = readJson(path.join(pluginRoot, 'office', 'roster.json')) || { staff: [] };
  const custom = readJson(path.join(officeDir, 'roster.json')) || {};
  const staff = base.staff.map((s) => ({ ...s }));
  for (const c of Array.isArray(custom.staff) ? custom.staff : []) {
    if (!c || typeof c.id !== 'string') continue;
    const found = staff.find((s) => s.id === c.id);
    if (found) Object.assign(found, c); else staff.push({ ...c });
  }
  return { ...base, ...custom, staff, project: path.basename(projectDir) };
}

// ---- Theo dõi file sự kiện -------------------------------------------------
const clients = new Set();
let offset = 0;
let partial = '';

function send(res, event, data) {
  res.write((event ? `event: ${event}\n` : '') + `data: ${data}\n\n`);
}

function backlog() {
  let text = '';
  try { text = fs.readFileSync(eventsFile, 'utf8'); } catch { return []; }
  const lines = text.split('\n').filter(Boolean);
  return lines.slice(-BACKLOG_LINES);
}

function poll() {
  let size;
  try { size = fs.statSync(eventsFile).size; } catch { size = 0; }
  if (size < offset) { // file bị xoay vòng hoặc xóa
    offset = 0; partial = '';
    for (const res of clients) send(res, 'reset', '{}');
  }
  if (size === offset) return;
  const fd = fs.openSync(eventsFile, 'r');
  const buf = Buffer.alloc(size - offset);
  fs.readSync(fd, buf, 0, buf.length, offset);
  fs.closeSync(fd);
  offset = size;
  const lines = (partial + buf.toString('utf8')).split('\n');
  partial = lines.pop();
  for (const line of lines) {
    if (!line) continue;
    for (const res of clients) send(res, null, line);
  }
}

try { offset = fs.statSync(eventsFile).size; } catch { offset = 0; }
setInterval(poll, POLL_MS);
setInterval(() => { for (const res of clients) res.write(': ping\n\n'); }, 20000);

// ---- HTTP ------------------------------------------------------------------
const server = http.createServer((req, res) => {
  const url = req.url.split('?')[0];
  if (req.method !== 'GET') { res.writeHead(405); return res.end(); }

  if (url === '/api/roster') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    return res.end(JSON.stringify(roster()));
  }

  if (url === '/api/events') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-store',
      Connection: 'keep-alive',
    });
    poll(); // đồng bộ offset trước khi gửi phần đã có
    for (const line of backlog()) send(res, null, line);
    send(res, 'ready', '{}');
    clients.add(res);
    req.on('close', () => clients.delete(res));
    return;
  }

  const entry = STATIC[url];
  if (!entry) { res.writeHead(404); return res.end('Not found'); }
  fs.readFile(path.join(dashboardDir, entry[0]), (err, data) => {
    if (err) { res.writeHead(500); return res.end('Missing dashboard file'); }
    res.writeHead(200, { 'Content-Type': entry[1], 'Cache-Control': 'no-store' });
    res.end(data);
  });
});

function openBrowser(url) {
  const cmd = process.platform === 'darwin' ? ['open', [url]]
    : process.platform === 'win32' ? ['cmd', ['/c', 'start', '', url]]
    : ['xdg-open', [url]];
  try {
    const child = spawn(cmd[0], cmd[1], { stdio: 'ignore', detached: true });
    child.on('error', () => {});
    child.unref();
  } catch { /* không có trình duyệt: người dùng tự mở */ }
}

function listen(port, attemptsLeft) {
  server.once('error', (err) => {
    if (err.code === 'EADDRINUSE' && attemptsLeft > 0) return listen(port + 1, attemptsLeft - 1);
    console.error('AI Office không khởi động được: ' + err.message);
    process.exit(1);
  });
  server.listen(port, '127.0.0.1', () => {
    const url = `http://127.0.0.1:${port}`;
    console.log(`AI Office: ${url}`);
    console.log(`Dự án: ${projectDir}`);
    if (shouldOpen) openBrowser(url);
  });
}

listen(startPort, 20);
