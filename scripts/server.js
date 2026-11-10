#!/usr/bin/env node
// Server của T-outbox: phục vụ trang văn phòng, đẩy sự kiện (SSE) đọc từ <project>/.t-outbox/events.jsonl,
// và lưu tùy biến (brand, tên nhân viên) của dự án. Không phụ thuộc thư viện ngoài. Chỉ nghe trên 127.0.0.1.
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
const startPort = Number(arg('port', process.env.T_OUTBOX_PORT || 4747));
const shouldOpen = args.includes('--open');

const pluginRoot = path.resolve(__dirname, '..');
const dashboardDir = path.join(pluginRoot, 'dashboard');
const officeDir = path.join(projectDir, '.t-outbox');
const eventsFile = path.join(officeDir, 'events.jsonl');
const rosterFile = path.join(officeDir, 'roster.json');
const brandFile = path.join(officeDir, 'brand.json');

const BACKLOG_LINES = 3000;
const POLL_MS = 400;
const MAX_BODY = 64 * 1024;
const HEX = /^#[0-9a-fA-F]{6}$/;
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

function readJson(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; }
}

// Cấu hình mặc định của plugin, cho phép dự án ghi đè brand và thêm/sửa nhân viên theo id.
function config() {
  const base = readJson(path.join(pluginRoot, 'office', 'roster.json')) || { staff: [] };
  const custom = readJson(rosterFile) || {};
  const staff = base.staff.map((s) => ({ ...s }));
  for (const c of Array.isArray(custom.staff) ? custom.staff : []) {
    if (!c || typeof c.id !== 'string') continue;
    const found = staff.find((s) => s.id === c.id);
    if (found) Object.assign(found, c); else staff.push({ ...c });
  }
  const baseBrand = readJson(path.join(pluginRoot, 'office', 'brand.json')) || {};
  const b = readJson(brandFile) || {};
  const brand = {
    ...baseBrand, ...b,
    colors: { ...baseBrand.colors, ...(b.colors || {}) },
    uniform: { ...baseBrand.uniform, ...(b.uniform || {}) },
  };
  return { ...base, staff, brand, project: path.basename(projectDir) };
}

// ---- Theo dõi file sự kiện và file cấu hình --------------------------------------
const clients = new Set();
let offset = 0;
let partial = '';

function send(res, event, data) {
  res.write((event ? `event: ${event}\n` : '') + `data: ${data}\n\n`);
}

function backlog() {
  let text = '';
  try { text = fs.readFileSync(eventsFile, 'utf8'); } catch { return []; }
  return text.split('\n').filter(Boolean).slice(-BACKLOG_LINES);
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

function stamp() {
  return [rosterFile, brandFile].map((f) => { try { return fs.statSync(f).mtimeMs; } catch { return 0; } }).join(':');
}
let lastStamp = stamp();
function pollConfig() { // sửa brand.json hay roster.json là văn phòng đổi ngay
  const now = stamp();
  if (now === lastStamp) return;
  lastStamp = now;
  for (const res of clients) send(res, 'config', '{}');
}

try { offset = fs.statSync(eventsFile).size; } catch { offset = 0; }
setInterval(poll, POLL_MS);
setInterval(pollConfig, 1000);
setInterval(() => { for (const res of clients) res.write(': ping\n\n'); }, 20000);

// ---- Lưu tùy biến từ bảng "Tùy biến" ------------------------------------------------
function text(v, max) {
  return typeof v === 'string' ? v.replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max) : undefined;
}

function saveCustomization(body) {
  const b = body.brand || {};
  const brand = readJson(brandFile) || {};
  for (const key of ['name', 'tagline']) { const v = text(b[key], 60); if (v !== undefined) brand[key] = v; }
  const logo = text(b.logoText, 3); if (logo !== undefined) brand.logoText = logo;
  brand.colors = { ...(brand.colors || {}) };
  for (const key of ['primary', 'secondary', 'accent']) {
    const v = b.colors && b.colors[key];
    if (typeof v === 'string' && HEX.test(v)) brand.colors[key] = v;
  }
  if (b.uniform && ['polo', 'shirt', 'tshirt'].includes(b.uniform.style)) brand.uniform = { ...(brand.uniform || {}), style: b.uniform.style };

  const roster = readJson(rosterFile) || {};
  roster.staff = Array.isArray(roster.staff) ? roster.staff : [];
  for (const s of Array.isArray(body.staff) ? body.staff.slice(0, 80) : []) {
    const id = text(s && s.id, 64);
    if (!id || !/^[\w.:-]+$/.test(id)) continue;
    let entry = roster.staff.find((x) => x.id === id);
    if (!entry) { entry = { id }; roster.staff.push(entry); }
    const name = text(s.name, 24); if (name) entry.name = name;
    if (typeof s.off === 'boolean') entry.off = s.off;
  }
  fs.mkdirSync(officeDir, { recursive: true });
  fs.writeFileSync(brandFile, JSON.stringify(brand, null, 2) + '\n');
  fs.writeFileSync(rosterFile, JSON.stringify(roster, null, 2) + '\n');
}

// Chỉ chính trang văn phòng trên máy này mới được ghi; trang web khác mở trong trình duyệt thì không.
function sameOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return false;
  try { return new URL(origin).host === req.headers.host && /^(127\.0\.0\.1|localhost)(:\d+)?$/.test(req.headers.host); } catch { return false; }
}

// ---- HTTP ------------------------------------------------------------------
const server = http.createServer((req, res) => {
  const url = req.url.split('?')[0];
  const json = (code, obj) => {
    res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify(obj));
  };

  if (req.method === 'POST' && url === '/api/customize') {
    if (!sameOrigin(req) || !/^application\/json/.test(req.headers['content-type'] || '')) return json(403, { error: 'forbidden' });
    let raw = '';
    req.on('data', (c) => { raw += c; if (raw.length > MAX_BODY) req.destroy(); });
    req.on('end', () => {
      try { saveCustomization(JSON.parse(raw)); json(200, { ok: true }); }
      catch (err) { json(400, { error: String(err.message || err) }); }
    });
    return;
  }
  if (req.method !== 'GET') { res.writeHead(405); return res.end(); }

  if (url === '/api/roster') return json(200, config());
  if (url === '/api/demo') return json(200, readJson(path.join(pluginRoot, 'office', 'demo-script.json')) || []);

  if (url === '/api/events') {
    res.writeHead(200, { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-store', Connection: 'keep-alive' });
    poll(); // đồng bộ offset trước khi gửi phần đã có
    for (const line of backlog()) send(res, null, line);
    send(res, 'ready', '{}');
    clients.add(res);
    req.on('close', () => clients.delete(res));
    return;
  }

  // File tĩnh: chỉ phục vụ file nằm trong thư mục dashboard, đúng các đuôi đã biết.
  let rel;
  try { rel = decodeURIComponent(url === '/' ? '/index.html' : url); } catch { rel = ''; }
  const file = path.join(dashboardDir, rel);
  const type = TYPES[path.extname(file)];
  if (!type || !file.startsWith(dashboardDir + path.sep)) { res.writeHead(404); return res.end('Not found'); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store' });
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
    console.error('T-outbox không khởi động được: ' + err.message);
    process.exit(1);
  });
  server.listen(port, '127.0.0.1', () => {
    const url = `http://127.0.0.1:${port}`;
    console.log(`T-outbox: ${url}`);
    console.log(`Dự án: ${projectDir}`);
    if (shouldOpen) openBrowser(url);
  });
}

listen(startPort, 20);
