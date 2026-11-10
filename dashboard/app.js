// AI Office dashboard: dựng sơ đồ văn phòng từ roster, rồi diễn lại các sự kiện
// do hook ghi lại để cho thấy ai đang làm gì.
'use strict';

const DONE_SHOW_MS = 7000;          // giữ trạng thái "xong" trước khi về pantry
const STALE_MS = 30 * 60 * 1000;    // quá lâu không có tín hiệu thì coi như đã nghỉ
const MIN_SCALE = 0.62;
const FEED_MAX = 80;
const TASKS_MAX = 40;
const GUEST_COLORS = ['#6b7a90', '#9a6b4f', '#4f8a6b', '#8a4f7d', '#4f6b9a', '#9a8a4f'];
const FEED_TOOLS = new Set(['Write', 'Edit', 'NotebookEdit', 'WebSearch', 'WebFetch', 'Skill']);

const $ = (id) => document.getElementById(id);
const floor = $('floor');

const S = {
  roster: null,
  staff: new Map(),     // id -> nhân viên
  tasks: [],
  feed: [],
  live: false,          // false khi đang diễn lại lịch sử: không chạy hiệu ứng
  loungeCount: 0,
  guestCount: 0,
  doneCount: 0,
};

// ---- Tiện ích ---------------------------------------------------------------
function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function staffId(type) {
  return String(type || 'general-purpose').replace(/^office:/, '');
}
function clock(t) {
  return new Date(t).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}
function duration(ms) {
  const s = Math.max(1, Math.round(ms / 1000));
  return s < 60 ? `${s} giây` : `${Math.floor(s / 60)} phút ${s % 60 ? (s % 60) + ' giây' : ''}`.trim();
}
function hashIndex(str, n) {
  let h = 0;
  for (const ch of str) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h % n;
}

function describeTool(ev) {
  const d = ev.detail;
  switch (ev.tool) {
    case 'Write': return d ? `Đang viết ${d}` : 'Đang viết tài liệu';
    case 'Edit': case 'NotebookEdit': return d ? `Đang sửa ${d}` : 'Đang chỉnh sửa';
    case 'Read': return d ? `Đang đọc ${d}` : 'Đang đọc tài liệu';
    case 'WebSearch': return d ? `Đang tìm: ${d}` : 'Đang tìm trên web';
    case 'WebFetch': return d ? `Đang xem ${d}` : 'Đang xem trang web';
    case 'Bash': return d || 'Đang chạy lệnh';
    case 'Grep': case 'Glob': return 'Đang lục hồ sơ dự án';
    case 'Skill': return d ? `Đang dùng skill ${d}` : 'Đang dùng skill';
    case 'AskUserQuestion': return 'Đang hỏi ý kiến sếp';
    default: {
      const m = /^mcp__(.+?)__/.exec(ev.tool || '');
      if (m) return `Đang dùng ${m[1].replace(/_/g, ' ')}`;
      return 'Đang xử lý';
    }
  }
}

// ---- Dựng văn phòng -----------------------------------------------------------
function avatarSvg(s) {
  const hairColor = ['#3a2a20', '#1f1f24', '#6b4226'][(s.hair ?? 0) % 3];
  const hair = [
    '<path d="M8 19a14 14 0 0 1 28 0c-4-5-9-7-14-7s-10 2-14 7z"/>',
    '<path d="M7 30V18a15 15 0 0 1 30 0v12h-4V19c-3-4-7-6-11-6s-8 2-11 6v11z"/>',
    '<circle cx="22" cy="3.5" r="5"/><path d="M8 19a14 14 0 0 1 28 0c-4-5-9-7-14-7s-10 2-14 7z"/>',
  ][(s.hair ?? 0) % 3];
  return `<svg viewBox="0 -2 44 60" width="44" height="60" aria-hidden="true">
    <rect x="5" y="31" width="34" height="27" rx="11" fill="${esc(s.color)}"/>
    <circle cx="22" cy="19" r="13" fill="${esc(s.skin || '#f1c9a5')}"/>
    <g fill="${hairColor}">${hair}</g>
    <circle cx="17" cy="21" r="1.6" fill="#2a2a2a"/><circle cx="27" cy="21" r="1.6" fill="#2a2a2a"/>
    <path class="mouth" d="M18.5 26.5q3.5 2.5 7 0" fill="none" stroke="#2a2a2a" stroke-width="1.3" stroke-linecap="round"/>
  </svg>`;
}

function addStaff(def) {
  const r = S.roster;
  const s = {
    skin: '#f1c9a5', hair: 0, title: 'Cộng tác viên', ...def,
    name: def.name || def.id,
    instances: new Map(), status: 'idle', activity: '', lastTs: 0, doneAt: 0,
  };
  if (!s.color) s.color = GUEST_COLORS[hashIndex(s.id, GUEST_COLORS.length)];
  if (!s.desk) { // chưa có bàn riêng: ngồi khu cộng tác viên
    const desks = r.guestDesks || [];
    const base = desks[S.guestCount % Math.max(1, desks.length)] || { x: 900, y: 420 };
    const lap = Math.floor(S.guestCount / Math.max(1, desks.length));
    s.desk = { x: base.x - lap * 14, y: base.y - lap * 90 };
    S.guestCount++;
  }
  if (!s.fixed) {
    const L = r.loungeSpots;
    const i = S.loungeCount++;
    s.lounge = { x: L.x + (i % L.columns) * L.stepX, y: L.y + Math.floor(i / L.columns) * L.stepY };
  }

  const desk = document.createElement('div');
  desk.className = 'desk';
  desk.style.left = s.desk.x + 'px';
  desk.style.top = s.desk.y + 'px';
  desk.style.setProperty('--c', s.color);
  desk.innerHTML = `<div class="monitor"><i></i><i></i><i></i></div><div class="plate" title="${esc(s.title)}">${esc(s.name)}</div>`;
  floor.appendChild(desk);

  const el = document.createElement('div');
  el.className = 'person';
  el.style.setProperty('--c', s.color);
  el.innerHTML = `<div class="bubble"><span></span></div><div class="avatar">${avatarSvg(s)}</div><div class="count"></div><div class="label">${esc(s.name)}</div>`;
  floor.appendChild(el);

  s.el = el; s.deskEl = desk;
  s.bubble = el.querySelector('.bubble span');
  s.countEl = el.querySelector('.count');
  S.staff.set(s.id, s);
  placeStaff(s);
  return s;
}

function getStaff(type) {
  const id = staffId(type);
  return S.staff.get(id) || addStaff({ id, name: id });
}

function buildFloor() {
  const r = S.roster;
  floor.style.width = r.floor.width + 'px';
  floor.style.height = r.floor.height + 'px';
  for (const room of r.rooms) {
    const el = document.createElement('div');
    el.className = 'room ' + (room.kind || '');
    Object.assign(el.style, { left: room.x + 'px', top: room.y + 'px', width: room.w + 'px', height: room.h + 'px' });
    el.innerHTML = `<span class="room-name">${esc(room.name)}</span>` +
      (room.kind === 'lounge' ? '<div class="sofa"></div><div class="coffee"><b></b></div><div class="plant"></div>' : '');
    floor.appendChild(el);
  }
  for (const def of r.staff) addStaff(def);
  fit();
}

function fit() {
  const wrap = $('floor-wrap');
  // Màn hình hẹp: giữ sơ đồ đủ lớn để đọc được và cho cuộn ngang trong khung.
  const scale = Math.max(wrap.clientWidth / S.roster.floor.width, MIN_SCALE);
  floor.style.transform = `scale(${scale})`;
  wrap.style.height = S.roster.floor.height * scale + 'px';
  $('floor-sizer').style.width = S.roster.floor.width * scale + 'px';
}

// ---- Trạng thái nhân viên ------------------------------------------------------
function placeStaff(s) {
  const atDesk = s.fixed || s.status !== 'idle';
  const pos = atDesk ? { x: s.desk.x, y: s.desk.y - 46 } : s.lounge;
  const el = s.el;
  const moved = el.dataset.x !== String(pos.x) || el.dataset.y !== String(pos.y);
  if (moved) {
    el.dataset.x = pos.x; el.dataset.y = pos.y;
    el.style.left = pos.x + 'px';
    el.style.top = pos.y + 'px';
    if (S.live) {
      el.classList.add('walking');
      setTimeout(() => el.classList.remove('walking'), 1200);
    }
  }
  el.classList.toggle('at-desk', atDesk);
  el.classList.toggle('working', s.status === 'working');
  el.classList.toggle('done', s.status === 'done');
  s.deskEl.classList.toggle('on', s.status === 'working');

  const text = s.status === 'working' ? (s.activity || 'Đang làm việc')
    : s.status === 'done' ? (s.fixed ? 'Đã báo cáo sếp' : 'Xong việc')
    : '';
  s.bubble.textContent = text;
  el.classList.toggle('talking', Boolean(text));
  const n = s.instances.size;
  s.countEl.textContent = n > 1 ? '×' + n : '';
}

function setWorking(s, activity, t) {
  s.status = 'working';
  if (activity) s.activity = activity;
  s.lastTs = t;
}
function setDone(s, t) {
  s.status = 'done';
  s.doneAt = t;
  s.lastTs = t;
}

function flyPaper(from, to) {
  if (!S.live || from === to) return;
  const p = document.createElement('div');
  p.className = 'paper';
  p.style.left = from.desk.x + 'px';
  p.style.top = from.desk.y - 20 + 'px';
  floor.appendChild(p);
  requestAnimationFrame(() => requestAnimationFrame(() => {
    p.style.left = to.desk.x + 'px';
    p.style.top = to.desk.y - 20 + 'px';
  }));
  setTimeout(() => p.remove(), 1300);
}

function addFeed(t, who, text, kind) {
  S.feed.unshift({ t, who, text, kind });
  if (S.feed.length > FEED_MAX) S.feed.length = FEED_MAX;
}

// ---- Xử lý sự kiện -------------------------------------------------------------
function apply(ev) {
  const t = ev.t || Date.now();
  const manager = S.staff.get('manager');
  // Sự kiện phát sinh bên trong subagent mang agent_id; còn lại là của Claude chính.
  const actor = ev.agent_id ? getStaff(ev.agent_type) : manager;

  switch (ev.e) {
    case 'prompt':
      setWorking(manager, 'Nhận việc từ sếp', t);
      addFeed(t, 'Sếp', ev.text || 'giao việc mới', 'boss');
      break;

    case 'assign': {
      const to = getStaff(ev.to);
      setWorking(actor, `Giao việc cho ${to.name}`, t);
      S.tasks.unshift({ sid: ev.sid, staff: to.id, desc: ev.desc || 'Việc mới', by: actor.name, status: 'assigned', t0: t });
      if (S.tasks.length > TASKS_MAX) S.tasks.length = TASKS_MAX;
      addFeed(t, actor.name, `giao cho ${to.name}: ${ev.desc || 'việc mới'}`, 'assign');
      flyPaper(actor, to);
      break;
    }

    case 'agent_start': {
      const task = [...S.tasks].reverse().find((k) => k.staff === actor.id && k.status === 'assigned' && k.sid === ev.sid);
      const desc = task ? task.desc : 'Việc tiếp nối';
      if (task) { task.status = 'working'; task.agent_id = ev.agent_id; task.t0 = t; }
      else S.tasks.unshift({ sid: ev.sid, staff: actor.id, desc, by: manager.name, status: 'working', agent_id: ev.agent_id, t0: t });
      actor.instances.set(ev.agent_id, { desc, t });
      setWorking(actor, desc, t);
      break;
    }

    case 'tool': {
      const text = describeTool(ev);
      if (ev.agent_id && !actor.instances.has(ev.agent_id)) actor.instances.set(ev.agent_id, { desc: '', t });
      setWorking(actor, text, t);
      if (FEED_TOOLS.has(ev.tool) || /^mcp__/.test(ev.tool || '')) addFeed(t, actor.name, text.replace(/^Đang /, ''), 'tool');
      break;
    }

    case 'agent_stop': {
      actor.instances.delete(ev.agent_id);
      const task = S.tasks.find((k) => k.agent_id === ev.agent_id);
      if (task && task.status !== 'done') {
        task.status = 'done'; task.t1 = t; task.result = ev.msg;
        S.doneCount++;
        addFeed(t, actor.name, `hoàn thành: ${task.desc}`, 'done');
      }
      if (actor.instances.size === 0) setDone(actor, t);
      else actor.lastTs = t;
      break;
    }

    case 'stop':
      setDone(manager, t);
      addFeed(t, manager.name, 'đã báo cáo sếp', 'done');
      break;

    case 'session_end':
      for (const k of S.tasks) if (k.sid === ev.sid && k.status === 'assigned') k.status = 'cancelled';
      if (manager.status === 'working') manager.status = 'idle';
      break;
  }
}

// Dọn trạng thái theo thời gian: "xong" một lúc rồi về pantry, im quá lâu thì coi như đã nghỉ.
function settle(now) {
  let changed = false;
  for (const s of S.staff.values()) {
    if (s.status === 'done' && now - s.doneAt > DONE_SHOW_MS) { s.status = 'idle'; changed = true; }
    if (s.status === 'working' && now - s.lastTs > STALE_MS) { s.status = 'idle'; s.instances.clear(); changed = true; }
  }
  return changed;
}

// ---- Vẽ --------------------------------------------------------------------------
const STATUS_LABEL = { assigned: 'Chờ nhận', working: 'Đang làm', done: 'Xong', cancelled: 'Đã hủy' };
const STATUS_ORDER = { working: 0, assigned: 1, done: 2, cancelled: 3 };

function render() {
  for (const s of S.staff.values()) placeStaff(s);

  const working = [...S.staff.values()].filter((s) => s.status === 'working').length;
  $('stat-working').textContent = working;
  $('stat-done').textContent = S.doneCount;

  const tasks = [...S.tasks].sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || b.t0 - a.t0);
  $('tasks').innerHTML = tasks.length ? tasks.map((k) => {
    const s = S.staff.get(k.staff);
    const time = k.status === 'done' ? duration(k.t1 - k.t0) : clock(k.t0);
    return `<li class="task ${k.status}" style="--c:${esc(s ? s.color : '#888')}">
      <div class="task-top"><span class="who">${esc(s ? s.name : k.staff)}</span><span class="badge">${STATUS_LABEL[k.status]}</span></div>
      <div class="task-desc">${esc(k.desc)}</div>
      <div class="task-meta">${esc(k.by)} giao · ${esc(time)}</div>
    </li>`;
  }).join('') : '<li class="empty">Chưa có việc nào được giao. Hãy giao việc cho Claude, ví dụ bằng <code>/office:brief</code>.</li>';

  $('feed').innerHTML = S.feed.length ? S.feed.map((f) =>
    `<li class="${esc(f.kind)}"><time>${clock(f.t)}</time><span><b>${esc(f.who)}</b> ${esc(f.text)}</span></li>`
  ).join('') : '<li class="empty">Văn phòng đang yên tĩnh.</li>';
}

// ---- Kết nối -----------------------------------------------------------------------
function setLive(ok, text) {
  $('live').classList.toggle('on', ok);
  $('live-text').textContent = text;
}

async function start() {
  S.roster = await (await fetch('/api/roster')).json();
  $('project').textContent = S.roster.project || '';
  document.title = `AI Office · ${S.roster.project || ''}`;
  buildFloor();
  render();

  const es = new EventSource('/api/events');
  es.onmessage = (m) => {
    let ev;
    try { ev = JSON.parse(m.data); } catch { return; }
    apply(ev);
    if (S.live) render();
  };
  es.addEventListener('ready', () => {
    settle(Date.now());
    render();
    // Bật hiệu ứng sau khi vị trí ban đầu đã được vẽ, để không ai "chạy" từ góc màn hình ra.
    requestAnimationFrame(() => { S.live = true; floor.classList.add('live'); });
    setLive(true, 'Đang theo dõi');
  });
  es.addEventListener('reset', () => location.reload());
  es.onerror = () => setLive(false, 'Mất kết nối, đang thử lại');
  es.onopen = () => { if (S.live) setLive(true, 'Đang theo dõi'); };

  setInterval(() => { if (settle(Date.now())) render(); }, 1000);
  window.addEventListener('resize', fit);
}

start().catch((err) => {
  setLive(false, 'Không tải được văn phòng');
  console.error(err);
});
