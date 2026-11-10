// Quay video intro: node render.js <out.mp4> [--stills t1,t2,...] [--from a --to b]
// Chạy qua tools/intro-video/make.sh (dựng site demo, phục vụ ở cổng 4820 rồi quay từng khung hình với đồng hồ giả của Playwright).
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs');
const OUT = process.argv[2];
const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const STILLS = arg('--stills') ? arg('--stills').split(',').map(Number) : null;
const FPS = 30;
const URL0 = 'http://127.0.0.1:4820/';
const script = JSON.parse(fs.readFileSync(__dirname + '/site/data/demo-script.json', 'utf8'));
// Dồn kịch bản demo cho khớp video: lệnh giao việc lúc 8.0 s, báo cáo cuối lúc 33.4 s.
function retime() {
  let c = 0; const cum = script.map(([w]) => (c += w));
  const s = (33.4 - 8.0) / (cum[cum.length - 1] - cum[1]);
  return script.map(([w, ev], i) => [i === 0 ? 7.0 : i === 1 ? 1.0 : w * s, ev]);
}
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  p.on('pageerror', (e) => console.error('pageerror', e.message));
  await p.addInitScript(() => { try { localStorage.clear(); } catch {} });
  await p.clock.install();
  let release; const gate = new Promise((r) => (release = r));
  await p.route('**/data/demo-script.json', async (route) => { await gate; await route.fulfill({ json: retime() }); });
  await p.goto(URL0);
  await p.waitForFunction(() => window.tOutboxView && window.tOutboxView.actors && window.tOutboxView.actors.size > 10, null, { timeout: 120000 });
  await p.waitForTimeout(1500);
  await p.addScriptTag({ url: URL0 + 'director.js' });
  await p.evaluate(() => document.fonts.ready);
  const now = await p.evaluate(() => Date.now());
  await p.clock.pauseAt(now + 1000);
  release();
  await p.waitForTimeout(1500); // để fetch kịch bản xong, demo đặt bộ hẹn giờ đầu tiên
  // chỉ vẽ ở nhịp rAF cuối của mỗi khung hình
  await p.evaluate(() => { const r = window.tOutboxView.renderer, f = r.render.bind(r); window.__skip = false; r.render = (s, c) => { if (!window.__skip) f(s, c); }; });
  const STEP = 1000 / FPS;
  let ff = null;
  if (!STILLS) {
    ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', OUT], { stdio: ['pipe', 'inherit', 'inherit'] });
  }
  const total = Math.round(await p.evaluate(() => DIR.LEN) * FPS);
  const want = STILLS ? new Set(STILLS.map((t) => Math.round(t * FPS))) : null;
  const last = STILLS ? Math.max(...want) : total - 1;
  const t0 = Date.now();
  for (let f = 0; f <= last; f++) {
    const t = f / FPS;
    const shoot = !want || want.has(f);
    await p.evaluate((t) => DIR.at(t), t);
    await p.evaluate((s) => { window.__skip = s; }, true);
    await p.clock.runFor(STEP / 2);
    await p.evaluate((s) => { window.__skip = s; }, !shoot);
    await p.clock.runFor(STEP / 2);
    if (shoot) {
      const buf = await p.screenshot({ type: 'jpeg', quality: 93 });
      if (ff) ff.stdin.write(buf); else fs.writeFileSync(`${OUT}-${t.toFixed(2)}.jpg`, buf);
    }
    if (f % 60 === 0) console.log(`frame ${f}/${last} t=${t.toFixed(1)} ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  if (ff) { ff.stdin.end(); await new Promise((r) => ff.on('close', r)); }
  await b.close();
})();
