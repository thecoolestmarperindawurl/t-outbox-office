#!/usr/bin/env node
// Hook của T-outbox: đọc payload hook từ stdin, ghi một dòng sự kiện gọn vào
// <project>/.t-outbox/events.jsonl. Không bao giờ chặn Claude: mọi lỗi đều thoát mã 0.
'use strict';
const fs = require('fs');
const path = require('path');

const MAX_LOG_BYTES = 5 * 1024 * 1024;

const OFFICE_CONTEXT = [
  'Plugin T-outbox đang bật. Người dùng là sếp (chủ doanh nghiệp), bạn là CEO điều hành công ty.',
  'Nhân sự là các subagent có tên bắt đầu bằng "t-outbox:", chia theo phòng ban, mỗi phòng có trưởng phòng:',
  'Marketing (marketing-lead; content-writer, seo-specialist, ads-specialist);',
  'Sản phẩm & Thiết kế (product-manager; designer, researcher);',
  'Kỹ thuật & Dữ liệu (tech-lead; web-developer, data-analyst, qa-reviewer);',
  'Kinh doanh & CSKH (sales-lead; customer-support);',
  'Vận hành (operations-lead; finance-analyst, legal-counsel, hr-specialist).',
  'Việc cần nhiều người trong một phòng thì giao cho trưởng phòng để họ tự chia; việc gọn của một chuyên môn thì giao thẳng cho nhân viên đó.',
  'Giao bằng Agent tool với mô tả ngắn, rõ đầu ra; việc độc lập thì giao song song; việc lớn thì cho t-outbox:qa-reviewer soát trước khi báo cáo sếp.',
  'Việc nhỏ, hỏi đáp nhanh thì tự làm, không cần giao. Sếp xem văn phòng bằng lệnh /t-outbox:open.',
].join(' ');

function clip(value, max) {
  if (typeof value !== 'string') return undefined;
  const s = value.replace(/\s+/g, ' ').trim();
  return s.length > max ? s.slice(0, max - 1) + '…' : s;
}

function relPath(p, projectDir) {
  if (typeof p !== 'string') return undefined;
  const rel = path.relative(projectDir, p);
  return clip(rel && !rel.startsWith('..') ? rel : path.basename(p), 160);
}

function host(url) {
  try { return new URL(url).hostname; } catch { return undefined; }
}

// Chỉ giữ chi tiết đủ để mô tả việc đang làm. Không lưu nội dung file hay câu lệnh shell.
function toolDetail(name, input, projectDir) {
  const i = input || {};
  switch (name) {
    case 'Write': case 'Edit': case 'Read': case 'NotebookEdit':
      return relPath(i.file_path || i.notebook_path, projectDir);
    case 'WebSearch': return clip(i.query, 160);
    case 'WebFetch': return host(i.url);
    case 'Bash': return clip(i.description, 160);
    case 'Grep': case 'Glob': return clip(i.pattern, 80);
    case 'Skill': return clip(i.skill, 80);
    default: return undefined;
  }
}

function build(p, projectDir) {
  const ev = { t: Date.now(), sid: p.session_id };
  if (p.agent_id) ev.agent_id = p.agent_id;
  if (p.agent_type) ev.agent_type = p.agent_type;

  switch (p.hook_event_name) {
    case 'SessionStart':
      return { ...ev, e: 'session_start', source: p.source };
    case 'UserPromptSubmit':
      return { ...ev, e: 'prompt', text: clip(p.prompt, 280) };
    case 'PreToolUse': {
      const name = p.tool_name;
      if (name === 'Agent' || name === 'Task') {
        const i = p.tool_input || {};
        return { ...ev, e: 'assign', to: i.subagent_type || 'general-purpose', desc: clip(i.description, 160) };
      }
      return { ...ev, e: 'tool', tool: name, detail: toolDetail(name, p.tool_input, projectDir) };
    }
    case 'PermissionRequest':
      return { ...ev, e: 'wait', tool: p.tool_name };
    case 'SubagentStart':
      return p.agent_type ? { ...ev, e: 'agent_start' } : null;
    case 'SubagentStop':
      return p.agent_type ? { ...ev, e: 'agent_stop', msg: clip(p.last_assistant_message, 280) } : null;
    case 'Stop':
      return { ...ev, e: 'stop', msg: clip(p.last_assistant_message, 280) };
    case 'SessionEnd':
      return { ...ev, e: 'session_end' };
    default:
      return null;
  }
}

function main() {
  if (process.env.T_OUTBOX_DISABLED === '1') return;
  let raw = '';
  try { raw = fs.readFileSync(0, 'utf8'); } catch { return; }
  let p;
  try { p = JSON.parse(raw); } catch { return; }

  const projectDir = process.env.CLAUDE_PROJECT_DIR || p.cwd || process.cwd();
  const dir = path.join(projectDir, '.t-outbox');
  const file = path.join(dir, 'events.jsonl');
  const ev = build(p, projectDir);

  if (ev) {
    fs.mkdirSync(dir, { recursive: true });
    const ignore = path.join(dir, '.gitignore');
    if (!fs.existsSync(ignore)) fs.writeFileSync(ignore, 'events*.jsonl\n');
    if (ev.e === 'session_start') {
      try {
        if (fs.statSync(file).size > MAX_LOG_BYTES) fs.renameSync(file, path.join(dir, 'events.old.jsonl'));
      } catch { /* chưa có file */ }
    }
    fs.appendFileSync(file, JSON.stringify(ev) + '\n');
  }

  // Trong subagent, agent_type là tên subagent: không nhắc lại vai trò giám đốc ở đó.
  if (p.hook_event_name === 'SessionStart' && !p.agent_id) {
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: OFFICE_CONTEXT },
    }));
  }
}

try { main(); } catch { /* không bao giờ làm hỏng phiên làm việc */ }
process.exit(0);
