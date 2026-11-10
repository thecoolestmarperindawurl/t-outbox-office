// View 3D: văn phòng dạng mô hình thu nhỏ, dựng hoàn toàn bằng hình khối của three.js
// (không dùng mô hình 3D bên ngoài). Tọa độ lấy từ roster: 100 px trên sơ đồ = 1 đơn vị.
import * as THREE from 'three';
import { OrbitControls } from './vendor/OrbitControls.js';

const U = (px) => px / 100;
const SEAT_BACK = 0.45;       // ghế nằm sau bàn bao xa
const WALK_SPEED = 1.7;       // đơn vị mỗi giây
const HAIR = ['#3a2a20', '#1f1f24', '#6b4226'];
const CONFETTI = ['#e4572e', '#f2b134', '#3f9a5a', '#3273c4', '#c8497a', '#7c5cbf'];
const ROOM_FLOOR = { lounge: '#eadcbd', guests: '#ece3cf', default: '#f4ecdb' };
const WALL_H = 2.0;
const mix = (a, b, t) => '#' + new THREE.Color(a).lerp(new THREE.Color(b), t).getHexString();

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export class View3D {
  constructor(container, roster) {
    this.roster = roster;
    const b = roster.brand || {};
    this.brand = {
      name: b.name || 'T-outbox', logoText: b.logoText || '', style: (b.uniform && b.uniform.style) || 'polo',
      primary: (b.colors && b.colors.primary) || '#1f3a8a',
      secondary: (b.colors && b.colors.secondary) || '#1b2238',
      accent: (b.colors && b.colors.accent) || '#ff8a1f',
      trousers: (b.uniform && b.uniform.trousers) || '#2a3042',
    };
    this.aisleTop = U((roster.aisles && roster.aisles.top) || 234);
    this.aisleBottom = U((roster.aisles && roster.aisles.bottom) || 510);
    this.actors = new Map();
    this.effects = [];
    this.mats = new Map();
    this.W = U(roster.floor.width);
    this.D = U(roster.floor.height);
    this.center = new THREE.Vector3(this.W / 2, 0.3, this.D / 2);
    this.userMoved = false;

    this.el = document.createElement('div');
    this.el.className = 'stage3d';
    this.labels = document.createElement('div');
    this.labels.className = 'labels3d';
    container.appendChild(this.el);

    // WebGL không có thì ném lỗi ở đây; app.js sẽ chuyển sang bản 2D.
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.el.append(this.renderer.domElement, this.labels);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(32, 1.6, 0.5, 80);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    Object.assign(this.controls, {
      enableDamping: true, dampingFactor: 0.08, minDistance: 5, maxDistance: 46,
      maxPolarAngle: Math.PI * 0.46, minPolarAngle: 0.15,
    });
    this.controls.target.copy(this.center);
    this.controls.addEventListener('start', () => { this.userMoved = true; });

    this.buildLights();
    this.buildShell();
    this.buildRooms();
    this.buildDecor();

    this.clock = new THREE.Clock();
    this.resize();
    this.resetCamera();
    this.renderer.setAnimationLoop(() => this.frame());
  }

  // ---- Dựng hình cơ bản ---------------------------------------------------------
  mat(color, opts) {
    const key = color + (opts ? JSON.stringify(opts) : '');
    if (!this.mats.has(key)) this.mats.set(key, new THREE.MeshLambertMaterial({ color, ...opts }));
    return this.mats.get(key);
  }

  box(w, h, d, color, x, y, z, parent = this.scene, opts) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), opts && opts.material ? opts.material : this.mat(color, opts));
    m.position.set(x, y, z);
    m.castShadow = !(opts && opts.transparent);
    m.receiveShadow = true;
    parent.add(m);
    return m;
  }

  buildLights() {
    this.hemi = new THREE.HemisphereLight('#fff7ea', '#b8a98c', 1.15);
    this.sun = new THREE.DirectionalLight('#fff1dc', 1.9);
    const sun = this.sun;
    sun.position.set(this.W / 2 + 5, 14, this.D / 2 + 8);
    sun.target.position.copy(this.center);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -11, right: 11, top: 11, bottom: -11, near: 1, far: 44 });
    sun.shadow.bias = -0.0006;
    sun.shadow.normalBias = 0.02;
    this.scene.add(this.hemi, sun, sun.target);
    // Đèn trần: chỉ bật buổi tối.
    this.lamps = [];
    for (const r of this.roster.rooms) {
      const lamp = new THREE.PointLight('#ffd9a0', 0, 7, 1.6);
      lamp.position.set(U(r.x + r.w / 2), 1.7, U(r.y + r.h / 2));
      this.scene.add(lamp);
      this.lamps.push(lamp);
    }
    this.glass = new THREE.MeshLambertMaterial({ color: '#bfe3f2', emissive: '#8fd0ea', emissiveIntensity: 0.35 });
  }

  setNight(on) {
    this.hemi.intensity = on ? 0.32 : 1.15;
    this.sun.intensity = on ? 0.22 : 1.9;
    this.sun.color.set(on ? '#9fb4ff' : '#fff1dc');
    for (const lamp of this.lamps) lamp.intensity = on ? 2.6 : 0;
    this.glass.color.set(on ? '#27345c' : '#bfe3f2');
    this.glass.emissive.set(on ? '#101a3a' : '#8fd0ea');
    this.el.classList.toggle('night', on);
  }

  window(x) {
    this.box(1.3, 0.62, 0.03, '#ffffff', x, 1.18, 0.012);
    this.box(1.18, 0.5, 0.03, null, x, 1.18, 0.03, this.scene, { material: this.glass });
    this.box(0.03, 0.5, 0.035, '#ffffff', x, 1.18, 0.035);
  }

  buildShell() {
    const { W, D, brand } = this;
    // Sàn và đế.
    this.box(W + 0.5, 0.36, D + 0.5, '#cdb893', W / 2, -0.2, D / 2);
    this.box(W + 0.3, 0.04, D + 0.3, '#e2d4b6', W / 2, -0.02, D / 2);
    // Tường sau và tường trái; hai mặt còn lại để trống cho dễ nhìn vào. Viền trên tường mang màu thương hiệu.
    this.box(W + 0.3, WALL_H, 0.14, '#efe6d6', W / 2, WALL_H / 2, -0.07);
    this.box(0.14, WALL_H, D + 0.16, '#e9dfcc', -0.07, WALL_H / 2, D / 2 - 0.01);
    this.box(W + 0.32, 0.12, 0.16, brand.primary, W / 2, WALL_H + 0.06, -0.07);
    this.box(0.16, 0.12, D + 0.18, brand.primary, -0.07, WALL_H + 0.06, D / 2 - 0.01);
    this.box(W + 0.3, 0.04, 0.02, brand.accent, W / 2, WALL_H - 0.06, 0.012);
    // Cửa ra vào và cửa sổ trên tường trái.
    this.box(0.03, 1.2, 0.72, '#a9825a', 0.012, 0.6, D / 2);
    this.box(0.04, 0.06, 0.06, '#f2c14e', 0.04, 0.6, D / 2 + 0.26);
    for (const z of [D - 1.2]) {
      this.box(0.03, 0.62, 1.3, '#ffffff', 0.012, 1.18, z);
      this.box(0.03, 0.5, 1.18, null, 0.03, 1.18, z, this.scene, { material: this.glass });
    }
  }

  // Biển tên công ty: logo chữ trên nền màu chính, bên cạnh là tên.
  brandSign(x, y, width) {
    const { brand } = this;
    const c = document.createElement('canvas');
    c.width = 1024; c.height = 256;
    const g = c.getContext('2d');
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, 1024, 256);
    g.fillStyle = brand.primary;
    g.beginPath(); g.roundRect(28, 28, 200, 200, 44); g.fill();
    g.fillStyle = brand.accent;
    g.beginPath(); g.arc(196, 60, 22, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#ffffff';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = '800 132px system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif';
    g.fillText(brand.logoText.slice(0, 2), 128, 136);
    g.fillStyle = brand.secondary;
    g.textAlign = 'left';
    let size = 112;
    do { g.font = `800 ${size}px system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif`; size -= 6; }
    while (g.measureText(brand.name).width > 730 && size > 40);
    g.fillText(brand.name, 262, 136);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    const h = width / 4;
    this.box(width + 0.08, h + 0.08, 0.03, brand.secondary, x, y, 0.014);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(width, h), new THREE.MeshBasicMaterial({ map: tex }));
    m.position.set(x, y, 0.032);
    this.scene.add(m);
  }

  floorText(text, x, z) {
    const c = document.createElement('canvas');
    c.width = 768; c.height = 80;
    const g = c.getContext('2d');
    g.font = '700 42px system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif';
    g.fillStyle = 'rgba(92, 78, 56, 0.72)';
    g.textBaseline = 'middle';
    try { g.letterSpacing = '3px'; } catch { /* trình duyệt cũ */ }
    g.fillText(text.toUpperCase(), 6, 42);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.27), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
    m.rotation.x = -Math.PI / 2;
    m.position.set(x + 1.3, 0.024, z);
    this.scene.add(m);
  }

  buildRooms() {
    const rooms = this.roster.rooms;
    for (const r of rooms) {
      const x = U(r.x), z = U(r.y), w = U(r.w), d = U(r.h);
      const dept = (this.roster.departments || []).find((k) => k.id === r.dept);
      const tint = dept ? mix(ROOM_FLOOR.default, dept.color, 0.13) : ROOM_FLOOR[r.kind] || ROOM_FLOOR.default;
      this.box(w, 0.02, d, tint, x + w / 2, 0.008, z + d / 2);
      this.floorText(r.name, x + 0.14, z + 0.3);
    }
    // Vách kính giữa hai phòng nằm cạnh nhau (trừ khu giữa, nơi mọi người đi lại).
    const glass = new THREE.MeshLambertMaterial({ color: '#cfe6ee', transparent: true, opacity: 0.32 });
    for (const a of rooms) for (const b of rooms) {
      if (a === b || a.kind || b.kind) continue;
      const gap = b.x - (a.x + a.w);
      if (gap < 0 || gap > 30 || a.y !== b.y) continue;
      const x = U(a.x + a.w + gap / 2), z0 = U(a.y), d = U(a.h);
      this.box(0.04, 0.85, d, null, x, 0.43, z0 + d / 2, this.scene, { material: glass, transparent: true });
      this.box(0.06, 0.04, d, '#b9ad97', x, 0.87, z0 + d / 2);
      this.box(0.06, 0.06, d, '#b9ad97', x, 0.03, z0 + d / 2);
    }
  }

  plant(x, z, s = 1) {
    const g = new THREE.Group();
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.11 * s, 0.085 * s, 0.2 * s, 12), this.mat('#b56b45'));
    pot.position.y = 0.1 * s;
    g.add(pot);
    for (const [dx, dy, dz, r] of [[0, 0.36, 0, 0.17], [0.09, 0.27, 0.05, 0.12], [-0.09, 0.29, -0.04, 0.12], [0.02, 0.5, 0.02, 0.11]]) {
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(r * s, 10, 8), this.mat('#4f9a5a'));
      leaf.position.set(dx * s, dy * s, dz * s);
      g.add(leaf);
    }
    g.traverse((o) => { o.castShadow = true; });
    g.position.set(x, 0, z);
    this.scene.add(g);
  }

  buildDecor() {
    const room = (id) => this.roster.rooms.find((r) => r.id === id);
    const lounge = this.roster.rooms.find((r) => r.kind === 'lounge');
    if (lounge) {
      const x0 = U(lounge.x), z0 = U(lounge.y), w = U(lounge.w), d = U(lounge.h);
      const rug = new THREE.Mesh(new THREE.CircleGeometry(1, 40), this.mat(mix('#e6d3ad', this.brand.primary, 0.3)));
      rug.rotation.x = -Math.PI / 2; rug.scale.set(w * 0.4, d * 0.34, 1);
      rug.position.set(x0 + w * 0.47, 0.022, z0 + d * 0.55); rug.receiveShadow = true;
      this.scene.add(rug);
      // Sofa sát tường trái.
      this.box(0.5, 0.2, 1.3, '#c27d5c', x0 + 0.32, 0.12, z0 + 1.25);
      this.box(0.14, 0.42, 1.3, '#b06e4f', x0 + 0.1, 0.25, z0 + 1.25);
      this.box(0.5, 0.3, 0.12, '#b06e4f', x0 + 0.32, 0.19, z0 + 0.6);
      this.box(0.5, 0.3, 0.12, '#b06e4f', x0 + 0.32, 0.19, z0 + 1.9);
      // Quầy cà phê ở mép phải khu pantry.
      const cx = x0 + w - 0.36, cz = z0 + d / 2;
      this.box(0.46, 0.46, 1.5, '#a9825a', cx, 0.23, cz);
      this.box(0.52, 0.04, 1.56, '#f1e7d3', cx, 0.48, cz);
      this.box(0.26, 0.3, 0.24, '#4b4f59', cx, 0.65, cz - 0.4);
      this.box(0.06, 0.05, 0.02, null, cx - 0.14, 0.7, cz - 0.4, this.scene, { material: new THREE.MeshBasicMaterial({ color: '#f2b134' }) });
      for (let i = 0; i < 3; i++) {
        const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.03, 0.07, 10), this.mat(i === 1 ? this.brand.accent : '#ffffff'));
        cup.position.set(cx - 0.05 + (i % 2) * 0.1, 0.535, cz + 0.1 + i * 0.14); cup.castShadow = true;
        this.scene.add(cup);
      }
      this.plant(cx, z0 + 0.24, 1.2);
    }
    const guests = this.roster.rooms.find((r) => r.kind === 'guests');
    if (guests) this.plant(U(guests.x + guests.w) - 0.3, U(guests.y) + 0.3, 1.2);

    // Tường sau: biển công ty ở phòng điều hành, bảng trắng ở Marketing, tranh ở Sản phẩm, còn lại là cửa sổ.
    const exec = room('executive');
    if (exec) {
      this.brandSign(U(exec.x + exec.w / 2), 1.2, Math.min(1.9, U(exec.w) - 0.4));
      this.plant(U(exec.x + exec.w) - 0.32, 0.34);
      this.plant(U(exec.x) + 0.3, 0.34);
    }
    const marketing = room('marketing');
    if (marketing) {
      const x = U(marketing.x + marketing.w / 2);
      this.box(1.7, 0.72, 0.03, '#ffffff', x, 1.18, 0.02);
      const notes = ['#f2b134', '#e4572e', '#7c5cbf', '#3f9a5a', '#3273c4', '#f2b134'];
      notes.forEach((c, i) => this.box(0.16, 0.16, 0.012, c, x - 0.62 + (i % 3) * 0.25, 1.32 - Math.floor(i / 3) * 0.24, 0.04));
      this.box(0.5, 0.02, 0.012, '#3b4a6b', x + 0.45, 1.28, 0.04);
      this.box(0.36, 0.02, 0.012, '#3b4a6b', x + 0.38, 1.16, 0.04);
      this.window(U(marketing.x) + 1.0);
      this.window(U(marketing.x + marketing.w) - 1.0);
    }
    const product = room('product');
    if (product) {
      const x = U(product.x + product.w / 2);
      [[this.brand.primary, -0.62, 0.5], [this.brand.accent, 0, 0.62], ['#2a8fb0', 0.66, 0.5]].forEach(([c, dx, w]) => {
        this.box(w + 0.06, 0.66, 0.02, '#ffffff', x + dx, 1.18, 0.02);
        this.box(w, 0.6, 0.012, c, x + dx, 1.18, 0.035);
      });
      this.window(U(product.x) + 1.0);
      this.window(U(product.x + product.w) - 1.0);
    }
    const tech = room('engineering');
    if (tech) {
      const z = U(tech.y + tech.h) - 0.4;
      this.box(0.36, 0.95, 0.42, '#3a3f4a', 0.22, 0.475, z);
      for (let i = 0; i < 5; i++) {
        this.box(0.012, 0.03, 0.3, null, 0.405, 0.2 + i * 0.16, z, this.scene, {
          material: new THREE.MeshBasicMaterial({ color: i % 2 ? '#6fe39a' : '#5ab0ff' }),
        });
      }
    }
    for (const id of ['sales', 'operations']) {
      const r = room(id);
      if (r) this.plant(U(r.x + r.w) - 0.3, U(r.y) + 0.34);
    }
  }

  // ---- Bàn và nhân vật ---------------------------------------------------------------
  buildDesk(s) {
    const x = U(s.desk.x), z = U(s.desk.y);
    const w = s.fixed ? 1.3 : s.lead ? 1.14 : 1.0;
    const chair = s.off ? '#9a9a9a' : s.color;
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    this.scene.add(g);
    this.box(w, 0.05, 0.52, '#c9a577', 0, 0.36, 0, g);
    this.box(0.05, 0.34, 0.46, '#a9825a', -w / 2 + 0.05, 0.17, 0, g);
    this.box(0.05, 0.34, 0.46, '#a9825a', w / 2 - 0.05, 0.17, 0, g);
    this.box(w - 0.12, 0.2, 0.03, '#b8915f', 0, 0.24, 0.2, g);
    // Màn hình quay về phía người ngồi; mặt sau có vạch sáng màu của nhân viên khi đang làm việc.
    this.box(0.06, 0.1, 0.06, '#2b2e35', 0, 0.43, 0.12, g);
    this.box(0.46, 0.28, 0.035, '#2b2e35', 0, 0.6, 0.12, g);
    const strip = new THREE.MeshBasicMaterial({ color: '#4a4f5a' });
    this.box(0.26, 0.05, 0.01, null, 0, 0.6, 0.142, g, { material: strip });
    this.box(0.3, 0.015, 0.12, '#e9e2d3', 0, 0.392, -0.1, g);
    // Ghế.
    this.box(0.32, 0.05, 0.3, chair, 0, 0.14, -SEAT_BACK, g);
    this.box(0.32, 0.36, 0.05, chair, 0, 0.32, -SEAT_BACK - 0.17, g);
    if (s.lead || s.fixed) this.box(0.2, 0.07, 0.03, this.brand.accent, -w / 2 + 0.2, 0.42, -0.12, g); // biển chức danh
    this.box(0.06, 0.13, 0.06, '#4b4f59', 0, 0.065, -SEAT_BACK, g);
    return { strip };
  }

  // Nhân vật mặc đồng phục công ty: áo màu chính của brand, dây đeo thẻ màu nhấn, thẻ mang màu phòng ban.
  // Trưởng phòng và CEO mặc áo khoác màu phụ, sơ mi trắng, cà vạt màu nhấn.
  buildCharacter(s) {
    const { brand } = this;
    const formal = Boolean(s.lead || s.fixed);
    const top = formal ? brand.secondary : brand.primary;
    const g = new THREE.Group();
    const add = (geo, color, x, y, z, parent = g) => {
      const m = new THREE.Mesh(geo, this.mat(color));
      m.position.set(x, y, z); m.castShadow = true; parent.add(m);
      return m;
    };
    const bx = (w, h, d, color, x, y, z, parent = g) => add(new THREE.BoxGeometry(w, h, d), color, x, y, z, parent);
    const limb = (color, len, x, y, hand) => {
      const pivot = new THREE.Group();
      pivot.position.set(x, y, 0);
      add(new THREE.CapsuleGeometry(0.042, len, 4, 8), color, 0, -len / 2 - 0.02, 0, pivot);
      if (hand) add(new THREE.SphereGeometry(0.04, 8, 8), s.skin || '#f1c9a5', 0, -len - 0.065, 0, pivot);
      g.add(pivot);
      return pivot;
    };
    const legL = limb(brand.trousers, 0.1, -0.065, 0.17);
    const legR = limb(brand.trousers, 0.1, 0.065, 0.17);
    add(new THREE.CapsuleGeometry(0.135, 0.12, 6, 14), top, 0, 0.3, 0);
    const armL = limb(top, 0.12, -0.165, 0.38, true);
    const armR = limb(top, 0.12, 0.165, 0.38, true);
    if (formal) {
      bx(0.085, 0.2, 0.02, '#ffffff', 0, 0.33, 0.128);                 // sơ mi lộ ra giữa hai vạt áo khoác
      bx(0.034, 0.16, 0.02, brand.accent, 0, 0.32, 0.14);               // cà vạt
      bx(0.05, 0.035, 0.02, brand.accent, 0, 0.415, 0.138);
    } else {
      if (brand.style !== 'tshirt') {                                   // cổ áo
        const collar = brand.style === 'shirt' ? '#ffffff' : mix(brand.primary, '#ffffff', 0.75);
        const cl = bx(0.085, 0.035, 0.02, collar, -0.045, 0.428, 0.118); cl.rotation.z = -0.5;
        const cr = bx(0.085, 0.035, 0.02, collar, 0.045, 0.428, 0.118); cr.rotation.z = 0.5;
      }
      if (brand.style === 'shirt') for (let i = 0; i < 3; i++) bx(0.014, 0.014, 0.01, '#ffffff', 0, 0.38 - i * 0.055, 0.137);
      const ll = bx(0.014, 0.15, 0.012, brand.accent, -0.035, 0.36, 0.136); ll.rotation.z = -0.3;   // dây đeo thẻ
      const lr = bx(0.014, 0.15, 0.012, brand.accent, 0.035, 0.36, 0.136); lr.rotation.z = 0.3;
      bx(0.075, 0.09, 0.012, '#ffffff', 0, 0.255, 0.142);                // thẻ nhân viên
      bx(0.075, 0.028, 0.014, s.color, 0, 0.286, 0.143);                 // vạch màu phòng ban trên thẻ
    }
    bx(0.2, 0.03, 0.2, brand.trousers, 0, 0.185, 0);                     // thắt lưng
    const head = new THREE.Group();
    head.position.y = 0.6;
    g.add(head);
    add(new THREE.SphereGeometry(0.16, 20, 16), s.skin || '#f1c9a5', 0, 0, 0, head);
    const hairColor = HAIR[(s.hair ?? 0) % 3];
    const style = (s.hair ?? 0) % 3;
    const cap = add(new THREE.SphereGeometry(0.172, 20, 12, 0, Math.PI * 2, 0, Math.PI * (style === 1 ? 0.62 : 0.46)), hairColor, 0, 0.012, -0.018, head);
    cap.rotation.x = -0.32;
    if (style === 2) add(new THREE.SphereGeometry(0.07, 12, 10), hairColor, 0, 0.19, -0.03, head);
    for (const ex of [-0.058, 0.058]) add(new THREE.SphereGeometry(0.019, 8, 8), '#26221c', ex, -0.012, 0.15, head);
    // Dấu chấm than đỏ: nhân viên đang chờ sếp duyệt quyền.
    const alert = new THREE.Group();
    const red = new THREE.MeshBasicMaterial({ color: '#e0352b' });
    alert.add(new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.17, 0.06), red));
    const dot = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.06), red);
    dot.position.y = -0.14;
    alert.add(dot);
    alert.position.y = 1.02; alert.visible = false;
    g.add(alert);
    g.scale.setScalar(1.18);
    this.scene.add(g);
    return { g, legL, legR, armL, armR, head, alert };
  }

  label(cls, html) {
    const el = document.createElement('div');
    el.className = cls;
    el.innerHTML = html;
    this.labels.appendChild(el);
    return el;
  }

  addStaff(s) {
    const desk = { x: U(s.desk.x), z: U(s.desk.y) };
    const seat = { x: desk.x, z: desk.z - SEAT_BACK };
    // Đường đi từ pantry tới ghế: ra lối đi, dọc lối đi, rồi vào ghế (dãy trên phải vòng qua cạnh bàn).
    if (s.off) { // vị trí đang trống: chỉ có bàn và biển "Đang tuyển"
      this.buildDesk(s);
      const plate = this.label('plate3 vacant', 'Đang tuyển');
      plate.title = s.title || '';
      this.vacant = this.vacant || [];
      this.vacant.push({ plate, pos: new THREE.Vector3(desk.x, 0.1, desk.z + 0.3) });
      return;
    }
    let path = [seat];
    if (!s.fixed) {
      const start = { x: U(s.lounge.x), z: U(s.lounge.y) };
      const aisle = desk.z > this.aisleBottom ? this.aisleBottom : this.aisleTop;
      path = [start, { x: start.x, z: aisle }];
      if (aisle > seat.z) path.push({ x: desk.x + 0.72, z: aisle }, { x: desk.x + 0.72, z: seat.z });
      else path.push({ x: desk.x, z: aisle });
      path.push(seat);
    }
    const lens = [0];
    for (let i = 1; i < path.length; i++) lens.push(lens[i - 1] + Math.hypot(path[i].x - path[i - 1].x, path[i].z - path[i - 1].z));

    const a = {
      s, path, lens, total: lens[lens.length - 1],
      u: 0, wantDesk: Boolean(s.fixed), status: 'idle', alert: false,
      phase: Math.random() * 6, jump: 0, heading: 0,
      desk: this.buildDesk(s), body: this.buildCharacter(s),
      bubble: this.label('bubble3', '<span></span>'),
      plate: this.label('plate3', esc(s.name)),
      name: this.label('name3', esc(s.name)),
      deskPos: new THREE.Vector3(desk.x, 0.1, desk.z + 0.3),
    };
    a.bubble.style.setProperty('--c', s.color);
    a.plate.style.setProperty('--c', s.color);
    a.plate.title = s.title || '';
    this.actors.set(s.id, a);
    this.place(a);
  }

  pointAt(a, u) {
    const { path, lens } = a;
    if (path.length === 1) return { x: path[0].x, z: path[0].z, dx: 0, dz: 1 };
    let i = 1;
    while (i < path.length - 1 && lens[i] < u) i++;
    const p0 = path[i - 1], p1 = path[i];
    const seg = lens[i] - lens[i - 1] || 1;
    const t = Math.min(1, Math.max(0, (u - lens[i - 1]) / seg));
    return { x: p0.x + (p1.x - p0.x) * t, z: p0.z + (p1.z - p0.z) * t, dx: (p1.x - p0.x) / seg, dz: (p1.z - p0.z) / seg };
  }

  place(a) {
    const p = this.pointAt(a, a.u);
    a.body.g.position.set(p.x, a.body.g.position.y, p.z);
    return p;
  }

  sync(s, text, animate) {
    const a = this.actors.get(s.id);
    if (!a) return;
    a.wantDesk = Boolean(s.fixed) || s.status !== 'idle';
    a.status = s.status;
    a.alert = s.alert;
    if (!animate) { a.u = a.wantDesk ? a.total : 0; this.place(a); }
    const n = s.instances.size;
    a.bubble.firstChild.textContent = text ? (n > 1 ? `×${n} · ` : '') + text : '';
    a.bubble.classList.toggle('show', Boolean(text));
    a.bubble.classList.toggle('done', s.status === 'done' && !s.alert);
    a.bubble.classList.toggle('alert', s.alert);
    a.desk.strip.color.set(s.status === 'working' ? s.color : '#4a4f5a');
    a.body.alert.visible = s.alert;
  }

  // ---- Hiệu ứng ------------------------------------------------------------------------
  paper(from, to, color) {
    const A = this.actors.get(from.id), B = this.actors.get(to.id);
    if (!A || !B || A === B) return;
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.012, 0.27), new THREE.MeshBasicMaterial({ color: '#ffffff' }));
    if (color) { // viền màu của phiên Claude Code
      const edge = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.014, 0.05), new THREE.MeshBasicMaterial({ color }));
      edge.position.z = -0.11;
      m.add(edge);
    }
    this.scene.add(m);
    const p0 = A.body.g.position.clone().setY(0.75);
    const p1 = new THREE.Vector3(B.deskPos.x, 0.45, B.deskPos.z - 0.35);
    const high = 1.1 + p0.distanceTo(p1) * 0.12;
    this.effects.push({
      t: 0, dur: 1.0,
      step: (k) => {
        m.position.lerpVectors(p0, p1, k);
        m.position.y += Math.sin(Math.PI * k) * high;
        m.rotation.set(k * 5, k * 7, 0);
      },
      end: () => { this.scene.remove(m); m.geometry.dispose(); },
    });
  }

  celebrate(s) {
    const a = this.actors.get(s.id);
    if (!a) return;
    a.jump = 1.1;
    const origin = a.body.g.position.clone().setY(0.95);
    const bits = [];
    for (let i = 0; i < 28; i++) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.035), new THREE.MeshBasicMaterial({ color: CONFETTI[i % CONFETTI.length], side: THREE.DoubleSide }));
      m.position.copy(origin);
      this.scene.add(m);
      const ang = Math.random() * Math.PI * 2, sp = 0.5 + Math.random() * 0.9;
      bits.push({ m, v: new THREE.Vector3(Math.cos(ang) * sp, 1.6 + Math.random() * 1.4, Math.sin(ang) * sp), r: Math.random() * 8 });
    }
    let last = 0;
    this.effects.push({
      t: 0, dur: 1.7,
      step: (k) => {
        const dt = (k - last) * 1.7; last = k;
        for (const b of bits) {
          b.v.y -= 4.2 * dt;
          b.m.position.addScaledVector(b.v, dt);
          if (b.m.position.y < 0.03) { b.m.position.y = 0.03; b.v.set(0, 0, 0); }
          b.m.rotation.set(b.r + k * 9, b.r * 2 + k * 7, 0);
          b.m.material.opacity = 1;
        }
      },
      end: () => bits.forEach((b) => { this.scene.remove(b.m); b.m.geometry.dispose(); b.m.material.dispose(); }),
    });
  }

  // ---- Vòng lặp vẽ -----------------------------------------------------------------------
  animate(a, dt, time) {
    const { body } = a;
    const target = a.wantDesk ? a.total : 0;
    const diff = target - a.u;
    const moving = Math.abs(diff) > 0.001;
    let heading = 0, y = 0, swing = 0, armL = 0, armR = 0, legs = 0, headTilt = 0;

    if (moving) {
      const dir = Math.sign(diff);
      a.u += dir * Math.min(Math.abs(diff), WALK_SPEED * dt);
      const p = this.place(a);
      heading = Math.atan2(p.dx * dir, p.dz * dir);
      a.phase += dt * 11;
      swing = Math.sin(a.phase) * 0.7;
      y = Math.abs(Math.sin(a.phase)) * 0.035;
      armL = -swing; armR = swing;
    } else if (a.wantDesk) {
      // Ngồi vào bàn: chân duỗi dưới gầm, tay gõ phím khi đang làm việc.
      legs = -1.35;
      if (a.status === 'working' && !a.alert) {
        a.phase += dt * 16;
        armL = -1.15 + Math.sin(a.phase) * 0.16;
        armR = -1.15 + Math.cos(a.phase * 1.13) * 0.16;
        headTilt = 0.16;
      } else {
        armL = armR = -0.5;
      }
    } else {
      // Đứng ở pantry: đung đưa nhẹ, thỉnh thoảng quay sang người bên cạnh.
      a.phase += dt * 1.3;
      heading = Math.sin(a.phase * 0.5 + a.s.id.length) * 0.5;
      y = Math.sin(a.phase * 1.6) * 0.006;
      armL = Math.sin(a.phase) * 0.08; armR = -armL;
    }

    if (a.jump > 0) { // ăn mừng: nhảy hai lần, giơ tay
      a.jump = Math.max(0, a.jump - dt);
      y += Math.abs(Math.sin(a.jump * Math.PI * 2 / 1.1)) * 0.2;
      armL = armR = -2.7;
      legs = moving ? 0 : legs * 0.3;
    }
    if (a.alert) body.alert.position.y = 1.02 + Math.sin(time * 6) * 0.04;

    // Quay người theo đường ngắn nhất.
    let d = heading - a.heading;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    a.heading += d * Math.min(1, dt * 10);
    body.g.rotation.y = a.heading;
    body.g.position.y = y;
    body.legL.rotation.x = legs + swing;
    body.legR.rotation.x = legs - swing;
    body.armL.rotation.x = armL;
    body.armR.rotation.x = armR;
    body.head.rotation.x = headTilt;
    a.seated = !moving && a.wantDesk;
  }

  project(v, el, dy = 0) {
    this.tmp = this.tmp || new THREE.Vector3();
    const p = this.tmp.copy(v).project(this.camera);
    if (p.z > 1) { el.style.display = 'none'; return; }
    el.style.display = '';
    el.style.transform = `translate(${((p.x * 0.5 + 0.5) * this.w).toFixed(1)}px, ${((-p.y * 0.5 + 0.5) * this.h + dy).toFixed(1)}px)`;
  }

  frame() {
    const dt = Math.min(this.clock.getDelta(), 0.1);
    const time = this.clock.elapsedTime;
    for (const a of this.actors.values()) this.animate(a, dt, time);
    this.effects = this.effects.filter((e) => {
      e.t += dt;
      const k = Math.min(1, e.t / e.dur);
      e.step(k);
      if (k >= 1) { e.end(); return false; }
      return true;
    });
    this.controls.update();
    this.renderer.render(this.scene, this.camera);

    const head = this.head || (this.head = new THREE.Vector3());
    // Tên dưới chân người ở pantry chỉ hiện khi phóng gần, để không chồng chữ ở góc nhìn toàn cảnh.
    this.labels.classList.toggle('near', this.camera.position.distanceTo(this.controls.target) < this.fitDist * 0.8);
    for (const a of this.actors.values()) {
      const g = a.body.g.position;
      this.project(head.set(g.x, g.y + (a.alert ? 1.38 : 1.0), g.z), a.bubble);
      this.project(a.deskPos, a.plate);
      a.name.classList.toggle('show', !a.seated);
      if (!a.seated) this.project(head.set(g.x, 0, g.z + 0.08), a.name, 4);
    }
    for (const v of this.vacant || []) this.project(v.pos, v.plate);
  }

  // ---- Khung nhìn ---------------------------------------------------------------------------
  // Lùi máy quay cho tới khi cả mặt sàn lẫn đỉnh tường nằm gọn trong khung.
  fitCamera(dir) {
    const { W, D } = this;
    const pts = [];
    for (const x of [-0.3, W + 0.3]) for (const z of [-0.2, D + 0.3]) pts.push(new THREE.Vector3(x, 0, z));
    pts.push(new THREE.Vector3(-0.2, WALL_H + 0.3, -0.2), new THREE.Vector3(W + 0.2, WALL_H + 0.3, -0.2), new THREE.Vector3(-0.2, WALL_H + 0.3, D));
    const v = new THREE.Vector3();
    for (let dist = 8; dist < 46; dist += 0.25) {
      this.camera.position.copy(this.center).addScaledVector(dir, dist);
      this.camera.lookAt(this.center);
      this.camera.updateMatrixWorld();
      this.fitDist = dist;
      if (pts.every((p) => { v.copy(p).project(this.camera); return Math.abs(v.x) < 0.975 && v.y < 0.9 && v.y > -0.95; })) return;
    }
  }

  resetCamera() {
    const yaw = THREE.MathUtils.degToRad(9), pitch = THREE.MathUtils.degToRad(50);
    const dir = new THREE.Vector3(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch));
    this.fitCamera(dir);
    this.controls.target.copy(this.center);
    this.controls.update();
    this.userMoved = false;
  }

  resize() {
    const width = this.el.parentElement.clientWidth || 800;
    this.w = width;
    this.h = Math.round(Math.min(Math.max(width * 0.5, 280), Math.max(280, window.innerHeight * 0.8)));
    this.labels.classList.toggle('small', width < 700); // khung hẹp: biển tên bàn chỉ hiện khi phóng gần
    this.el.style.height = this.h + 'px';
    this.renderer.setSize(this.w, this.h);
    this.camera.aspect = this.w / this.h;
    this.camera.updateProjectionMatrix();
    if (!this.userMoved) this.resetCamera();
  }

  dispose() {
    this.renderer.setAnimationLoop(null);
    this.controls.dispose();
    this.scene.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
    this.renderer.dispose();
    this.el.remove();
  }
}
