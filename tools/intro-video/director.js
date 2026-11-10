// Đạo diễn video intro T-outbox: mỗi khung hình gọi DIR.at(t) để đặt máy quay và lớp chữ phủ.
(() => {
  const V = window.tOutboxView;
  // khung quay cố định 1280×720
  V.resize = function () {
    this.w = 1280; this.h = 720;
    this.el.style.height = '720px';
    this.renderer.setSize(1280, 720);
    this.camera.aspect = 1280 / 720;
    this.camera.updateProjectionMatrix();
  };
  document.getElementById('stage').style.cssText = 'position:fixed;left:0;top:0;width:1280px;height:720px;margin:0;z-index:50';
  V.resize();
  const Vec = V.camera.position.constructor;
  const v3 = (x, y, z) => new Vec(x, y, z);
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const ease = (x) => { x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const out = (x) => 1 - Math.pow(1 - clamp(x), 3);
  const back = (x) => { x = clamp(x); const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
  const span = (t, a, b) => clamp((t - a) / (b - a));
  const mix = (A, B, k) => A.clone().lerp(B, k);
  const FW = V.FW, FD = V.FD;

  // ---- máy quay cho từng góc ----
  const grab = (fn) => { fn(); const g = V.goal; V.goal = null; return { pos: g.pos.clone(), target: g.target.clone() }; };
  V.controls.enableDamping = false;
  V.userMoved = true;
  const OV = grab(() => V.overview());
  const floor = (id) => grab(() => V.focusFloor(id));
  const staff = (id) => grab(() => V.focusStaff(id));
  const SH = {
    ceo: staff('manager'), product: floor('product'), marketing: floor('marketing'), sales: floor('sales'),
    engineering: floor('engineering'), lobby: floor('lobby'), operations: floor('operations'),
    parking: floor('parking'), qa: staff('qa-reviewer'), exec: floor('executive'),
  };
  const g = V.gate;
  SH.street = { pos: v3(g.cwX + 9.0, 2.6, g.zStreet + 15.5), target: v3(g.cwX - 0.5, 0.9, g.zStreet + 3.2) };
  const orbit = (S, yawDeg, distK = 1, lift = 0) => {
    const d = S.pos.clone().sub(S.target);
    const a = yawDeg * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
    const r = v3(d.x * c + d.z * s, d.y, -d.x * s + d.z * c).multiplyScalar(distK);
    r.y += lift;
    return { pos: S.target.clone().add(r), target: S.target.clone() };
  };
  const low = (S, dy = -0.95) => ({ pos: S.pos.clone().add(v3(0, dy, 0)), target: S.target.clone().add(v3(0, dy, 0)) });
  for (const k of ['product', 'marketing', 'sales', 'engineering', 'lobby', 'operations', 'exec']) SH[k] = low(SH[k]);
  const tween = (A, B, k) => ({ pos: mix(A.pos, B.pos, k), target: mix(A.target, B.target, k) });

  // ---- dàn nhân vật (cảnh mở đầu), đặt trên cao, không có gì phía sau ----
  const BASE = v3(FW / 2, 80, FD / 2);
  const LINE = ['content-writer', 'marketing-lead', 'designer', 'product-manager', 'web-developer', 'manager',
    'tech-lead', 'qa-reviewer', 'sales-lead', 'finance-analyst', 'operations-lead'];
  const DEPT = { executive: 'Ban điều hành', marketing: 'Marketing', product: 'Sản phẩm', engineering: 'Kỹ thuật', sales: 'Kinh doanh', operations: 'Vận hành' };
  const GAP = 0.98;
  const lineup = LINE.map((id, i) => {
    const a = V.actors.get(id);
    const b = V.buildCharacter(a.s);
    const x = (i - (LINE.length - 1) / 2) * GAP;
    const ceo = id === 'manager';
    b.g.position.set(BASE.x + x, BASE.y, BASE.z + (ceo ? 0.35 : 0) - Math.abs(x) * 0.05);
    b.g.rotation.y = -x * 0.05;
    b.g.scale.setScalar(0.0001);
    (b.actions.idle || Object.values(b.actions)[0]).play();
    b.mixer.setTime(i * 0.37);
    const delay = ceo ? 0.5 : a.s.lead ? 1.3 + 0.12 * [1, 3, 6, 8, 10].indexOf(i) : 2.2 + 0.1 * i;
    return { id, a, b, delay, ceo, x };
  });
  const simulate = V.simulate.bind(V);
  V.simulate = (dt) => { simulate(dt); for (const l of lineup) if (l.b.g.visible) l.b.mixer.update(dt); };
  const LCAM = { pos: BASE.clone().add(v3(0, 1.15, 13.8)), target: BASE.clone().add(v3(0, 0.62, 0)) };
  const LCAM2 = { pos: BASE.clone().add(v3(0, 1.1, 12.6)), target: BASE.clone().add(v3(0, 0.66, 0)) };

  // ---- lớp chữ phủ ----
  const root = document.createElement('div');
  root.id = 'vid';
  document.body.appendChild(root);
  const brand = '#2D2FEF', orange = '#FF7A45', ink = '#241F45';
  root.innerHTML = `
  <div id="v-title"><div class="logo"><b>T</b><i></i></div><div><h1>T-outbox</h1><p>Công ty AI của bạn, ngay trong Claude Code</p></div></div>
  <div id="v-tags"></div>
  <div id="v-count"><span>1 CEO</span><em>·</em><span>5 phòng ban</span><em>·</em><span>17 nhân viên AI</span></div>
  <div id="v-mark"><div class="logo sm"><b>T</b><i></i></div>T-outbox</div>
  <div id="v-foot">lanhmar.id.vn</div>
  <div id="v-chip"><i></i><span></span></div>
  <div id="v-cmd"><div class="who">Claude Code</div><div class="box"><span class="pr">❯</span><span class="tx"></span><span class="caret"></span><span class="send">↑</span></div></div>
  <div id="v-card"><div class="l"><small></small><h2></h2><p></p></div><div class="r"><small>Nhân viên AI</small><div class="chips"></div></div></div>
  <div id="v-end"><div class="logo lg"><b>T</b><i></i></div><h2>Lập công ty AI<br><em>của riêng bạn</em></h2>
    <p>Cài plugin T-outbox vào Claude Code. Bạn giao việc, cả đội làm.</p>
    <pre>/plugin marketplace add thecoolestmarperindawurl/t-outbox-office
/plugin install t-outbox@t-outbox</pre>
    <div class="cta">▶ Xem văn phòng 3D: lanhmar.id.vn/apps/t-outbox</div>
    <small>Mã nguồn mở · MIT · github.com/thecoolestmarperindawurl/t-outbox-office</small></div>
  <div id="v-dip"></div>`;
  const css = document.createElement('style');
  css.textContent = `
  @import url("vfonts/montserrat.css");
  html, body { overflow: hidden !important; }
  #stage { position: fixed !important; left: 0; top: 0; width: 1280px; height: 720px; margin: 0; z-index: 50; }
  .stage3d { border-radius: 0 !important; border: 0 !important; box-shadow: none !important; }
  .stage3d.cream { background: radial-gradient(900px 520px at 50% 40%, #fffdf8, #f3efe6 70%, #ebe4d6) !important; }
  .bubble3 span { font-size: 13px !important; max-width: 210px !important; padding: 6px 11px !important; font-family: Montserrat, sans-serif; font-weight: 600; }
  .plate3, .name3 { font-family: Montserrat, sans-serif; }
  #vid { position: fixed; inset: 0; width: 1280px; height: 720px; z-index: 100; pointer-events: none; font-family: Montserrat, sans-serif; color: ${ink}; }
  #vid > div { position: absolute; opacity: 0; }
  .logo { width: 64px; height: 64px; border-radius: 18px; background: ${brand}; position: relative; box-shadow: 0 10px 26px rgba(45,47,239,.35); flex: none; }
  .logo b { position: absolute; inset: 0; display: grid; place-items: center; color: #fff; font-weight: 800; font-size: 38px; }
  .logo i { position: absolute; right: -5px; top: -5px; width: 18px; height: 18px; border-radius: 50%; background: ${orange}; border: 3px solid #fff; }
  .logo.sm { width: 30px; height: 30px; border-radius: 9px; box-shadow: none; } .logo.sm b { font-size: 18px; } .logo.sm i { width: 9px; height: 9px; border-width: 2px; right: -3px; top: -3px; }
  .logo.lg { width: 76px; height: 76px; border-radius: 22px; margin: 0 auto 14px; } .logo.lg b { font-size: 46px; }
  #v-title { left: 0; right: 0; top: 70px; display: flex; gap: 18px; align-items: center; justify-content: center; }
  #v-title h1 { margin: 0; font-size: 58px; font-weight: 800; color: ${brand}; letter-spacing: -.01em; line-height: 1; }
  #v-title p { margin: 8px 0 0; font-size: 21px; font-weight: 600; color: ${ink}; }
  #v-tags { inset: 0; }
  .tag { position: absolute; transform: translate(-50%, 0); text-align: center; white-space: nowrap; }
  .tag b { display: inline-block; background: #fff; border: 2.5px solid var(--c); color: ${ink}; border-radius: 99px; padding: 4px 11px; font-size: 13px; font-weight: 700; box-shadow: 0 6px 14px rgba(36,31,69,.12); }
  .tag.ceo b { background: ${brand}; border-color: ${brand}; color: #fff; font-size: 15px; padding: 6px 16px; }
  .tag small { display: block; margin-top: 4px; font-size: 11px; font-weight: 600; color: #6d6790; }
  #v-count { left: 0; right: 0; bottom: 64px; display: flex; justify-content: center; gap: 14px; font-size: 22px; font-weight: 800; color: ${ink}; }
  #v-count em { color: ${orange}; font-style: normal; }
  #v-count span:nth-child(5) { color: ${brand}; }
  #v-mark { left: 26px; top: 22px; display: flex; gap: 10px; align-items: center; font-weight: 800; font-size: 18px; color: ${brand}; background: rgba(255,255,255,.86); padding: 7px 14px 7px 8px; border-radius: 14px; box-shadow: 0 6px 18px rgba(45,47,239,.16); }
  #v-foot { right: 22px; bottom: 16px; font-size: 13px; font-weight: 700; color: #fff; background: rgba(36,31,69,.55); padding: 4px 10px; border-radius: 8px; }
  #v-chip { right: 26px; top: 24px; display: flex; gap: 10px; align-items: center; background: #fff; border-radius: 99px; padding: 10px 20px 10px 14px; font-size: 18px; font-weight: 700; box-shadow: 0 10px 26px rgba(45,47,239,.2); max-width: 760px; }
  #v-chip i { width: 12px; height: 12px; border-radius: 50%; background: ${orange}; flex: none; }
  #v-cmd { left: 50%; bottom: 46px; width: 820px; margin-left: -410px; }
  #v-cmd .who { display: inline-block; font-size: 13px; font-weight: 700; color: #fff; background: ${ink}; padding: 4px 12px; border-radius: 8px 8px 0 0; margin-left: 22px; }
  #v-cmd .box { display: flex; align-items: center; gap: 12px; background: #fff; border-radius: 18px; padding: 16px 16px 16px 22px; box-shadow: 0 16px 40px rgba(45,47,239,.28); border: 2px solid #e4e1fb; font-size: 20px; font-weight: 600; }
  #v-cmd .pr { color: ${orange}; font-weight: 800; }
  #v-cmd .tx b { color: ${brand}; font-weight: 800; }
  #v-cmd .caret { width: 2.5px; height: 24px; background: ${brand}; margin-left: -10px; }
  #v-cmd .send { margin-left: auto; width: 40px; height: 40px; border-radius: 50%; background: #d9d7f3; color: #fff; display: grid; place-items: center; font-weight: 800; font-size: 22px; flex: none; }
  #v-cmd.ready .send { background: ${brand}; }
  #v-card { left: 36px; right: 36px; bottom: 30px; display: flex; gap: 28px; align-items: center; background: rgba(255,255,255,.96); border-radius: 22px; padding: 20px 26px; box-shadow: 0 18px 44px rgba(45,47,239,.24); border-left: 8px solid var(--c, ${brand}); }
  #v-card .l { flex: 1; min-width: 0; }
  #v-card small { font-size: 12px; font-weight: 800; letter-spacing: .12em; color: #b8441a; text-transform: uppercase; }
  #v-card h2 { margin: 4px 0 4px; font-size: 34px; font-weight: 800; color: ${ink}; line-height: 1.1; }
  #v-card p { margin: 0; font-size: 16px; font-weight: 500; color: #514b70; }
  #v-card .r { flex: none; max-width: 560px; }
  #v-card .r small { color: #6d6790; }
  #v-card .chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
  #v-card .chips span { font-family: ui-monospace, Menlo, monospace; font-size: 14px; font-weight: 600; padding: 6px 11px; border-radius: 9px; background: #f1effc; color: ${ink}; border: 1.5px solid #e1ddf7; }
  #v-card .chips span.on { background: ${brand}; color: #fff; border-color: ${brand}; }
  #v-card .chips span.on::before { content: "● "; color: ${orange}; }
  #v-card .chips span.ok { background: #e6f6ee; border-color: #9fd8bc; }
  #v-card .chips span.ok::before { content: "✓ "; color: #1d8a57; }
  #v-end { left: 50%; top: 50%; width: 720px; margin-left: -360px; transform: translateY(-50%); background: #fff; border-radius: 28px; padding: 34px 40px 26px; text-align: center; box-shadow: 0 30px 80px rgba(45,47,239,.3); }
  #v-end h2 { margin: 0; font-size: 42px; font-weight: 800; color: ${ink}; line-height: 1.12; }
  #v-end h2 em { font-style: normal; color: ${brand}; }
  #v-end p { margin: 12px 0 16px; font-size: 18px; font-weight: 500; color: #514b70; }
  #v-end pre { text-align: left; margin: 0 auto 18px; background: ${ink}; color: #f3f1fd; border-radius: 14px; padding: 14px 18px; font-size: 15px; line-height: 1.6; }
  #v-end .cta { display: inline-block; background: ${orange}; color: #fff; font-weight: 800; font-size: 18px; padding: 13px 24px; border-radius: 99px; box-shadow: 0 12px 26px rgba(255,122,69,.4); }
  #v-end small { display: block; margin-top: 16px; font-size: 12.5px; color: #8a85a8; font-weight: 600; }
  #v-dip { inset: 0; background: #f3f1fd; }
  `;
  document.head.appendChild(css);
  const $ = (id) => document.getElementById(id);
  const tags = lineup.map((l) => {
    const el = document.createElement('div');
    el.className = 'tag' + (l.ceo ? ' ceo' : '');
    el.style.setProperty('--c', l.a.s.color);
    el.innerHTML = `<b>${l.a.s.name}</b>${l.ceo ? '' : `<small>${DEPT[l.a.s.dept] || ''}</small>`}`;
    $('v-tags').appendChild(el);
    return el;
  });

  // ---- kịch bản ----
  const DEPTS = [
    { at: 13.0, shot: 'product', floor: 6, name: 'Sản phẩm & Thiết kế', desc: 'Chốt phạm vi, nghiên cứu khách hàng, bộ hình ảnh ra mắt', c: '#7c5cbf', ids: ['product-manager', 'researcher', 'designer'] },
    { at: 15.0, shot: 'marketing', floor: 5, name: 'Marketing', desc: 'Kế hoạch 30 ngày, lịch nội dung, SEO, quảng cáo', c: '#e4572e', ids: ['marketing-lead', 'content-writer', 'seo-specialist', 'ads-specialist'] },
    { at: 17.2, shot: 'sales', floor: 4, name: 'Kinh doanh & CSKH', desc: 'Bán hàng và chăm sóc khách hàng sau ra mắt', c: '#2f9e6e', ids: ['sales-lead', 'customer-support'] },
    { at: 19.2, shot: 'engineering', floor: 7, name: 'Kỹ thuật & Dữ liệu', desc: 'Landing page, đo lường dữ liệu, kiểm thử chất lượng', c: '#2f7fd1', ids: ['tech-lead', 'web-developer', 'data-analyst', 'qa-reviewer'] },
    { at: 21.4, yaw: -22, shot: 'lobby', floor: 1, name: 'Sảnh đón tiếp', desc: 'Lễ tân, bảo vệ, hai thang máy, thang bộ thoát hiểm và hệ thống PCCC', c: '#4b4f9c', ids: [], kicker: 'Tầng 1 · Sảnh' },
    { at: 23.5, shot: 'operations', floor: 8, name: 'Vận hành', desc: 'Dự toán ngân sách, pháp chế, nhân sự', c: '#b8860b', ids: ['operations-lead', 'finance-analyst', 'legal-counsel', 'hr-specialist'] },
  ];
  const DEPT_END = 26.0;
  const CUTS = [5.0, ...DEPTS.map((d) => d.at), DEPT_END, 29.0];
  const PROMPT = '/t-outbox:brief Lập kế hoạch ra mắt sản phẩm mới trong 30 ngày';
  const ACT = { prompt: 7.9 };
  let lastDept = -1;

  function camAt(t) {
    if (t < 5) return tween(LCAM, LCAM2, ease(span(t, 0, 5)));
    if (t < 10) return orbit(OV, 10 - 16 * ease(span(t, 5, 10.6)), 1.06 - 0.06 * ease(span(t, 5, 10)));
    if (t < 13) return tween(orbit(OV, -6, 1.0), orbit(SH.exec, -4, 0.9), ease(span(t, 10, 11.8)));
    if (t < DEPT_END) {
      const i = DEPTS.findLastIndex((d) => t >= d.at);
      const d = DEPTS[i], end = (DEPTS[i + 1] || { at: DEPT_END }).at, S = SH[d.shot];
      const k = out(span(t, d.at, end + 0.6));
      const y = d.yaw || 0;
      return tween(orbit(S, y + 7, 1.0, 0.4), orbit(S, y - 3, 0.86), k);
    }
    if (t < 29) { const k = span(t, DEPT_END, 29); return { pos: SH.street.pos.clone().add(v3(-4.2 * k, 0, 0)), target: SH.street.target.clone().add(v3(-2.2 * k, 0, 0)) }; }
    if (t < 35) {
      if (t < 31.6) return tween(orbit(SH.engineering, 6, 0.95, 0.3), orbit(SH.engineering, -2, 0.86), out(span(t, 29, 31.8)));
      return tween(orbit(SH.engineering, -2, 0.86), orbit(OV, 6, 1.0), ease(span(t, 31.6, 33.6)));
    }
    return orbit(OV, 6 - 5 * span(t, 35, 40), 1.0);
  }

  function show(id, o, y = 0, s = 1) {
    const el = $(id);
    el.style.opacity = o.toFixed(3);
    el.style.translate = `0 ${y.toFixed(1)}px`;
    el.style.scale = String(s);
  }
  const fade = (t, a, b, f = 0.35) => Math.min(span(t, a, a + f), 1 - span(t, b - f, b));

  function at(t) {
    const c = camAt(t);
    V.camera.position.copy(c.pos);
    V.controls.target.copy(c.target);
    V.camera.lookAt(c.target);
    V.goal = null;

    // cảnh mở đầu
    const intro = t < 5;
    V.el.classList.toggle('cream', intro);
    V.labels.style.visibility = intro || t >= 35 ? 'hidden' : 'visible';
    for (const l of lineup) {
      const k = back(span(t, l.delay, l.delay + 0.45));
      l.b.g.visible = intro;
      l.b.g.scale.setScalar(Math.max(0.0001, k));
    }
    show('v-title', fade(t, 0.15, 5, 0.4), 14 * (1 - out(span(t, 0.15, 0.75))));
    show('v-count', fade(t, 2.9, 5, 0.4), 12 * (1 - out(span(t, 2.9, 3.4))));
    $('v-tags').style.opacity = intro ? 1 : 0;
    if (intro) {
      const p = v3(0, 0, 0);
      lineup.forEach((l, i) => {
        p.copy(l.b.g.position); p.y -= 0.08; p.project(V.camera);
        const k = span(t, l.delay + 0.25, l.delay + 0.6);
        tags[i].style.left = ((p.x * 0.5 + 0.5) * 1280).toFixed(1) + 'px';
        tags[i].style.top = ((-p.y * 0.5 + 0.5) * 720 + 6 + 10 * (1 - out(k))).toFixed(1) + 'px';
        tags[i].style.opacity = Math.min(k, 1 - span(t, 4.6, 5)).toFixed(3);
      });
    }

    // dấu thương hiệu luôn có sau phần mở đầu
    show('v-mark', fade(t, 5.2, 35.2, 0.4));
    show('v-foot', fade(t, 5.2, 35.2, 0.4));

    // gõ lệnh
    const typed = Math.round(PROMPT.length * span(t, 5.7, 7.5));
    const txt = PROMPT.slice(0, typed);
    $('v-cmd').querySelector('.tx').innerHTML = txt.startsWith('/t-outbox:brief') ? `<b>/t-outbox:brief</b>${txt.slice(15)}` : `<b>${txt}</b>`;
    $('v-cmd').querySelector('.caret').style.opacity = Math.floor(t * 2.4) % 2 || t < 7.5 ? 1 : 0;
    $('v-cmd').classList.toggle('ready', t > 7.5);
    const sent = span(t, ACT.prompt, ACT.prompt + 0.5);
    show('v-cmd', Math.min(span(t, 5.3, 5.7), 1 - sent), 20 * (1 - out(span(t, 5.3, 5.8))) + 30 * sent);

    // câu dẫn góc trên
    const chips = [
      [5.6, 10.0, 'Bạn là sếp: giao một việc lớn'],
      [10.2, 13.0, 'CEO chia việc cho các phòng ban'],
      [26.2, 29.0, 'Tòa nhà sống: xe chạy đúng luật, nhường người qua đường'],
      [29.2, 31.8, 'QA soát chéo trước khi nộp'],
      [31.8, 35.0, 'CEO tổng hợp, báo cáo lại cho bạn'],
    ];
    const ch = chips.find(([a, b]) => t >= a && t < b);
    if (ch) { $('v-chip').querySelector('span').textContent = ch[2]; show('v-chip', fade(t, ch[0], ch[1], 0.3), -10 * (1 - out(span(t, ch[0], ch[0] + 0.4)))); }
    else show('v-chip', 0);

    // thẻ phòng ban
    if (t >= 13 && t < DEPT_END) {
      const i = DEPTS.findLastIndex((d) => t >= d.at), d = DEPTS[i];
      const end = (DEPTS[i + 1] || { at: DEPT_END }).at;
      const card = $('v-card');
      if (i !== lastDept) {
        lastDept = i;
        card.style.setProperty('--c', d.c);
        card.querySelector('.l small').textContent = d.kicker || `Tầng ${d.floor} · Phòng ban`;
        card.querySelector('h2').textContent = d.name;
        card.querySelector('p').textContent = d.desc;
        card.querySelector('.r').style.display = d.ids.length ? '' : 'none';
        card.querySelector('.chips').innerHTML = d.ids.map((id) => `<span data-id="${id}">${id}</span>`).join('');
      }
      for (const el of card.querySelectorAll('.chips span')) {
        const a = V.actors.get(el.dataset.id);
        el.classList.toggle('on', Boolean(a && a.status === 'working'));
        el.classList.toggle('ok', Boolean(a && a.status === 'done'));
      }
      show('v-card', Math.min(span(t, d.at + 0.1, d.at + 0.45), 1 - span(t, end - 0.2, end)), 26 * (1 - out(span(t, d.at + 0.1, d.at + 0.55))));
    } else show('v-card', 0);

    // cảnh kết
    const e = span(t, 35, 35.8);
    V.el.style.filter = e > 0 ? `blur(${(7 * e).toFixed(2)}px) saturate(${(1 - 0.25 * e).toFixed(3)})` : '';
    show('v-end', out(span(t, 35.4, 36.0)), 0, 0.92 + 0.08 * back(span(t, 35.4, 36.0)));

    // chớp chuyển cảnh
    let dip = 0;
    for (const c of CUTS) dip = Math.max(dip, 1 - Math.abs(t - c) / 0.18);
    if (t < 0.4) dip = Math.max(dip, 1 - t / 0.4);
    if (t > 39.1) dip = Math.max(dip, span(t, 39.1, 39.6));
    $('v-dip').style.opacity = clamp(dip * (t > 39 ? 1 : 0.9)).toFixed(3);
    $('v-dip').style.background = t > 39 ? '#ffffff' : '#f3f1fd';
  }

  window.DIR = { at, LEN: 39.6, CUTS };
})();
