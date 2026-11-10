// View 3D: trụ sở công ty dạng tòa tháp cắt lớp mặt trước, mỗi phòng ban một tầng.
// Nhân viên là người có khung xương và hoạt ảnh (Kenney Mini Characters, CC0), nội thất là Kenney Furniture Kit (CC0).
// Kết cấu tòa nhà, biển hiệu và phụ kiện đồng phục dựng bằng hình khối.
import * as THREE from 'three';
import { OrbitControls } from './vendor/OrbitControls.js';
import { GLTFLoader } from './vendor/loaders/GLTFLoader.js';
import { clone as cloneSkinned } from './vendor/utils/SkeletonUtils.js';
import { RoomEnvironment } from './vendor/environments/RoomEnvironment.js';

const KS = 1.9;               // tỉ lệ phóng nội thất Kenney vào tòa nhà
const PS = 1.9;               // tỉ lệ phóng nhân vật, cùng tỉ lệ với nội thất
const SEAT_LIFT = 0.34;       // nâng người lên mặt ghế khi ngồi (hoạt ảnh gốc ngồi xuống sàn)
const SEAT_BACK = 0.76;       // ghế nằm sau tâm bàn bao xa
const AISLE_Z = 3.75;         // lối đi trước dãy bàn
const WALK_SPEED = 1.7;       // đơn vị mỗi giây
const FADE = 0.22;
const PERSON_H = 0.67 * PS;
const CONFETTI = ['#e4572e', '#f2b134', '#3f9a5a', '#3273c4', '#c8497a', '#7c5cbf'];
const FURNITURE = [
  'desk', 'chairDesk', 'computerScreen', 'computerKeyboard', 'laptop', 'kitchenCoffeeMachine', 'kitchenBar',
  'loungeSofa', 'loungeSofaLong', 'loungeChair', 'tableCoffee', 'tableRound', 'stoolBar', 'pottedPlant',
  'bookcaseOpen', 'bookcaseClosedWide', 'rugRound', 'rugRectangle', 'lampRoundFloor', 'lampSquareTable',
  'televisionModern', 'sideTableDrawers', 'coatRackStanding', 'trashcan',
];
// Mỗi nhân vật dùng vài ô trên bảng màu chung (ô = [cột, hàng], mỗi ô 64x128 điểm ảnh).
// Tô lại ô là đổi màu áo, quần, tóc, da. Chỉ khai báo ô nào nhân vật dùng riêng cho phần đó.
const LOOKS = {
  'female-b': { shirt: [0, 3], pants: [2, 1], hair: [0, 2], skin: [2, 2] },
  'female-c': { shirt: [0, 1], hair: [1, 3], skin: [0, 2] },
  'female-d': { shirt: [1, 3], hair: [0, 2], skin: [2, 2] },                 // mặc vest
  'female-e': { shirt: [7, 3], skin: [2, 2] },
  'female-f': { shirt: [0, 3], pants: [0, 1], hair: [1, 2], skin: [2, 2] },
  'male-a': { shirt: [4, 2], pants: [0, 1], shoes: [0, 3], belt: [0, 2], skin: [1, 2] },
  'male-b': { shirt: [7, 2], pants: [0, 1], hair: [0, 2], skin: [2, 2] },
  'male-d': { shirt: [3, 3], tie: [7, 2], hair: [0, 2], skin: [2, 2] },      // mặc vest, cà vạt
};
const CAST = {
  staff: { m: ['male-a', 'male-b'], f: ['female-b', 'female-c', 'female-e', 'female-f'] },
  formal: { m: ['male-d'], f: ['female-d'] },   // trưởng phòng và CEO
};
const IDLE_SPOTS = [[-0.9, 0.3], [0.9, 0.5], [0, 1.2], [-0.8, 1.6], [0.9, 1.7], [0.1, -0.1], [-1.6, 0.9], [1.7, 1.1]];
const mix = (a, b, t) => '#' + new THREE.Color(a).lerp(new THREE.Color(b), t).getHexString();

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function hash(str, n) {
  let h = 0;
  for (const ch of String(str)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h % n;
}

export class View3D {
  // Nạp mô hình xong mới dựng cảnh. Lỗi nạp hoặc không có WebGL thì ném ra để app.js chuyển sang bản 2D.
  static async create(container, roster) {
    const loader = new GLTFLoader();
    const cast = Object.keys(LOOKS);
    const [people, furniture] = await Promise.all([
      Promise.all(cast.map((name) => loader.loadAsync(`/assets/people/${name}.glb`))),
      Promise.all(FURNITURE.map((name) => loader.loadAsync(`/assets/office/${name}.glb`))),
    ]);
    return new View3D(container, roster, {
      people: Object.fromEntries(cast.map((name, i) => [name, people[i]])),
      models: Object.fromEntries(FURNITURE.map((name, i) => [name, furniture[i].scene])),
    });
  }

  constructor(container, roster, assets) {
    this.roster = roster;
    this.assets = assets;
    const b = roster.brand || {};
    this.brand = {
      name: b.name || 'T-outbox', logoText: b.logoText || '',
      primary: (b.colors && b.colors.primary) || '#1f3a8a',
      secondary: (b.colors && b.colors.secondary) || '#1b2238',
      accent: (b.colors && b.colors.accent) || '#ff8a1f',
      trousers: (b.uniform && b.uniform.trousers) || '#2a3042',
    };
    const g = roster.building || {};
    this.FW = g.floorWidth || 16;
    this.FD = g.floorDepth || 7;
    this.FH = g.floorHeight || 3;
    this.floors = roster.floors || [];
    this.H = this.floors.length * this.FH;
    this.actors = new Map();
    this.vacant = [];
    this.effects = [];
    this.mats = new Map();
    this.textures = new Map();
    this.center = new THREE.Vector3(this.FW / 2, this.H / 2 + 0.8, this.FD / 2);
    this.userMoved = false;
    this.fitDist = 40;

    this.el = document.createElement('div');
    this.el.className = 'stage3d';
    this.labels = document.createElement('div');
    this.labels.className = 'labels3d';
    container.appendChild(this.el);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.el.append(this.renderer.domElement, this.labels);

    this.scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environmentIntensity = 0.6;
    pmrem.dispose();

    this.camera = new THREE.PerspectiveCamera(30, 1.4, 0.5, 220);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    Object.assign(this.controls, {
      enableDamping: true, dampingFactor: 0.08, minDistance: 3, maxDistance: 110,
      maxPolarAngle: Math.PI * 0.5, minPolarAngle: 0.2,
    });
    this.controls.target.copy(this.center);
    this.controls.addEventListener('start', () => { this.userMoved = true; this.goal = null; });

    this.buildLights();
    this.buildSite();
    this.floors.forEach((f, i) => this.buildFloor(i, f));
    this.buildRoof();

    this.clock = new THREE.Clock();
    this.resize();
    this.resetCamera();
    this.renderer.setAnimationLoop(() => this.frame());
  }

  // ---- Dựng hình cơ bản ---------------------------------------------------------
  mat(color, opts) {
    const key = color + (opts ? JSON.stringify(opts) : '');
    if (!this.mats.has(key)) this.mats.set(key, new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0, ...opts }));
    return this.mats.get(key);
  }

  box(w, h, d, color, x, y, z, parent = this.scene, opts) {
    const o = opts || {};
    const material = o.material || this.mat(color, o.mat);
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    m.position.set(x, y, z);
    m.castShadow = !(o.transparent || o.noShadow);
    m.receiveShadow = true;
    parent.add(m);
    return m;
  }

  // Đặt một món nội thất, canh tâm theo mặt bằng và đặt đáy xuống sàn. tint = { tênVậtLiệu: màu }.
  prop(name, x, y, z, { ry = 0, scale = KS, tint, parent = this.scene } = {}) {
    const src = this.assets.models[name];
    if (!src.userData.fit) {
      const bb = new THREE.Box3().setFromObject(src);
      src.userData.fit = { cx: (bb.min.x + bb.max.x) / 2, cz: (bb.min.z + bb.max.z) / 2, y: bb.min.y };
    }
    const fit = src.userData.fit;
    const colors = { wood: '#dcb98f', woodDark: '#b98c60', ...tint }; // gỗ ấm hơn màu gốc của bộ mô hình
    const inner = src.clone(true);
    inner.position.set(-fit.cx, -fit.y, -fit.cz);
    inner.traverse((m) => {
      if (!m.isMesh) return;
      m.castShadow = true; m.receiveShadow = true;
      {
        const swap = (mt) => (colors[mt.name] ? this.mat(colors[mt.name], { roughness: mt.roughness }) : mt);
        m.material = Array.isArray(m.material) ? m.material.map(swap) : swap(m.material);
      }
    });
    const o = new THREE.Group();
    o.add(inner);
    o.position.set(x, y, z);
    o.rotation.y = ry;
    o.scale.setScalar(scale);
    parent.add(o);
    return o;
  }

  // Chiều cao một món nội thất sau khi phóng, để đặt đồ lên mặt bàn, mặt quầy.
  topOf(name, scale = KS) {
    const src = this.assets.models[name];
    if (!src.userData.h) src.userData.h = new THREE.Box3().setFromObject(src).getSize(new THREE.Vector3()).y;
    return src.userData.h * scale;
  }

  text(str, { w, h, color = '#3a3226' }) {
    const c = document.createElement('canvas');
    c.width = 1024; c.height = Math.round(1024 * h / w);
    const g = c.getContext('2d');
    let size = c.height * 0.66;
    do { g.font = `800 ${size}px system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif`; size -= 2; }
    while (g.measureText(str).width > c.width - 24 && size > 10);
    g.fillStyle = color;
    g.textBaseline = 'middle';
    g.fillText(str, 12, c.height / 2 + 1);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false }));
  }

  // Biển tên công ty: logo chữ trên nền màu chính, bên cạnh là tên.
  brandSign(x, y, z, width) {
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
    this.box(width + 0.12, h + 0.12, 0.06, brand.secondary, x, y, z - 0.035);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(width, h), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
    m.position.set(x, y, z);
    this.scene.add(m);
  }

  buildLights() {
    this.hemi = new THREE.HemisphereLight('#fff6e6', '#b7a688', 0.85);
    this.sun = new THREE.DirectionalLight('#ffe9c9', 2.4);
    const sun = this.sun, R = Math.max(this.H, this.FW) * 0.75 + 4;
    sun.position.set(this.FW / 2 + 14, this.H + 16, this.FD / 2 + 22);
    sun.target.position.set(this.FW / 2, this.H / 2, this.FD / 2);
    sun.castShadow = true;
    sun.shadow.mapSize.set(4096, 4096);
    Object.assign(sun.shadow.camera, { left: -R, right: R, top: R, bottom: -R, near: 1, far: 120 });
    sun.shadow.bias = -0.0006;
    sun.shadow.normalBias = 0.04;
    sun.shadow.radius = 4;
    this.scene.add(this.hemi, sun, sun.target);
    this.lamps = [];
    this.glass = new THREE.MeshStandardMaterial({ color: '#a8d4ee', transparent: true, opacity: 0.34, roughness: 0.08, metalness: 0.1 });
  }

  setNight(on) {
    this.hemi.intensity = on ? 0.14 : 0.85;
    this.sun.intensity = on ? 0.25 : 2.4;
    this.sun.color.set(on ? '#8fa6ff' : '#ffe9c9');
    this.scene.environmentIntensity = on ? 0.1 : 0.6;
    for (const lamp of this.lamps) lamp.intensity = on ? 9 : 0;
    this.glass.color.set(on ? '#1d2a55' : '#a8d4ee');
    this.glass.opacity = on ? 0.6 : 0.34;
    if (this.skyline) this.skyline.color.set(on ? '#1b2444' : '#c9d6e4');
    this.el.classList.toggle('night', on);
  }

  // ---- Khuôn viên, tầng, mái ----------------------------------------------------------
  tree(x, z, s = 1) {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12 * s, 0.16 * s, 1.1 * s, 8), this.mat('#8a6a4a'));
    trunk.position.set(x, 0.55 * s - 0.3, z);
    trunk.castShadow = true;
    this.scene.add(trunk);
    for (const [dy, r] of [[1.4, 0.85], [2.1, 0.62], [2.7, 0.4]]) {
      const leaf = new THREE.Mesh(new THREE.IcosahedronGeometry(r * s, 1), this.mat('#57a866', { flatShading: true }));
      leaf.position.set(x, dy * s - 0.3, z);
      leaf.castShadow = true;
      this.scene.add(leaf);
    }
  }

  buildSite() {
    const { FW, FD } = this;
    // Quảng trường trước tòa nhà.
    this.box(FW + 22, 0.4, FD + 20, '#d9d2c4', FW / 2, -0.5, FD / 2 + 3);
    this.box(FW + 4, 0.1, 9, '#ebe5d8', FW / 2, -0.26, FD + 4.6);
    this.box(FW + 1.2, 0.16, 1.2, '#f4efe4', FW / 2, -0.22, FD + 0.9);          // bậc thềm
    this.box(3.2, 0.03, 8, this.brand.primary, FW / 2, -0.2, FD + 5.2, this.scene, { noShadow: true }); // thảm lối vào
    for (const x of [-4.5, -2.2, FW + 2.2, FW + 4.5]) for (const z of [FD + 2.5, FD + 6.5]) this.tree(x, z, 1 + hash(x + ':' + z, 4) * 0.12);
    for (const x of [2.5, FW - 2.5]) this.tree(x, FD + 8.2, 0.9);
    // Vài khối nhà xa phía sau cho cảm giác khu trung tâm.
    this.skyline = new THREE.MeshBasicMaterial({ color: '#c9d6e4' });
    [[-9, -12, 6, 16], [-2, -16, 7, 27], [7, -14, 6, 20], [15, -17, 8, 31], [24, -12, 6, 14]].forEach(([x, z, w, h]) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, w), this.skyline);
      m.position.set(x, h / 2 - 0.3, z);
      this.scene.add(m);
    });
  }

  buildFloor(i, f) {
    const { FW, FD, FH, brand } = this;
    const y = i * FH;
    const dept = (this.roster.departments || []).find((d) => d.id === f.dept);
    const color = dept ? dept.color : brand.primary;
    const name = f.name || (dept ? dept.name : f.id);
    const wallH = FH - 0.3;

    // Sàn bê tông, thảm, và dầm mặt trước mang biển tầng.
    this.box(FW + 0.7, 0.3, FD + 0.5, '#e7e2d8', FW / 2, y - 0.15, FD / 2 - 0.05);
    const carpet = f.kind === 'lobby' ? '#efe9de' : f.dept === 'executive' ? '#cdb596' : mix('#f1ece2', color, 0.3);
    this.box(FW - 0.1, 0.02, FD - 0.2, carpet, FW / 2, y + 0.01, FD / 2, this.scene, { noShadow: true });
    this.box(FW + 0.7, 0.07, 0.1, color, FW / 2, y - 0.265, FD + 0.21, this.scene, { noShadow: true });
    const sign = this.text(`TẦNG ${i + 1}  ·  ${name.toUpperCase()}`, { w: 7.4, h: 0.25, color: '#3f362a' });
    sign.position.set(4.0, y - 0.115, FD + 0.206);
    this.scene.add(sign);

    // Vách kính phía sau và bên phải, lõi thang máy bên trái, cột trước.
    this.box(FW, wallH, 0.06, null, FW / 2, y + wallH / 2, -0.03, this.scene, { material: this.glass, transparent: true });
    for (let x = 0; x <= FW + 0.01; x += 2) this.box(0.08, wallH, 0.12, '#f4f1ea', x, y + wallH / 2, -0.03);
    this.box(FW, 0.08, 0.12, '#f4f1ea', FW / 2, y + wallH * 0.5, -0.03);
    this.box(0.06, wallH, FD, null, FW + 0.03, y + wallH / 2, FD / 2, this.scene, { material: this.glass, transparent: true });
    this.box(0.24, wallH, FD + 0.2, '#f2ece1', -0.12, y + wallH / 2, FD / 2);
    this.box(0.02, 0.16, FD, color, 0.012, y + wallH - 0.2, FD / 2, this.scene, { noShadow: true });
    for (const x of [0.16, FW - 0.14]) this.box(0.3, wallH, 0.3, '#f7f4ee', x, y + wallH / 2, FD - 0.2);
    // Cửa thang máy trên lõi bên trái.
    this.box(0.05, 1.7, 1.5, '#8f9aa3', 0.02, y + 0.85, 2.4, this.scene, { mat: { roughness: 0.3, metalness: 0.7 } });
    this.box(0.06, 1.7, 0.03, '#59636b', 0.03, y + 0.85, 2.4);
    this.box(0.06, 0.08, 1.7, '#59636b', 0.03, y + 1.75, 2.4);
    this.box(0.03, 0.1, 0.22, null, 0.03, y + 1.95, 2.4, this.scene, { material: new THREE.MeshBasicMaterial({ color: brand.accent, toneMapped: false }) });

    const lamp = new THREE.PointLight('#ffd9a8', 0, 16, 1.2);
    lamp.position.set(FW / 2, y + wallH - 0.3, FD / 2 + 0.5);
    this.scene.add(lamp);
    this.lamps.push(lamp);

    const sofaTint = { carpet: mix('#ffffff', brand.primary, 0.75) };
    const lounge = (cx, cz) => { // góc tiếp khách: thảm tròn, sofa, bàn trà, ghế, đèn
      this.prop('rugRound', cx, y + 0.02, cz, { scale: KS * 1.7, tint: { carpet: mix('#ffffff', color, 0.5), carpetDarker: mix('#ffffff', color, 0.75) } });
      this.prop('loungeSofa', cx, y, cz - 2.2, { tint: sofaTint });
      this.prop('tableCoffee', cx, y, cz - 1.05);
      this.prop('loungeChair', cx + 2.0, y, cz - 0.3, { ry: -Math.PI / 2, tint: sofaTint });
      this.prop('lampRoundFloor', cx - 1.5, y, cz - 2.3);
    };

    if (f.kind === 'lobby') {
      // Sảnh: tường thương hiệu, quầy lễ tân, khu chờ; bàn cho cộng tác viên ở bên phải.
      this.box(5.4, 2.3, 0.14, '#b8946a', 6.2, y + 1.15, 0.16);
      this.brandSign(6.2, y + 1.55, 0.26, 4.2);
      for (const dx of [-0.82, 0, 0.82]) this.prop('kitchenBar', 6.2 + dx, y, 2.6, { tint: { wood: '#fbf7ef', woodDark: brand.primary } });
      this.prop('laptop', 6.2, y + this.topOf('kitchenBar'), 2.6, { ry: Math.PI });
      this.prop('pottedPlant', 4.5, y, 2.6);
      this.prop('pottedPlant', 7.9, y, 2.6);
      lounge(3.0, 4.6);
      this.prop('pottedPlant', FW - 0.8, y, 0.7);
      this.prop('coatRackStanding', 0.9, y, 5.6);
    } else if (f.dept === 'executive') {
      // Tầng điều hành: tường gỗ với biển công ty sau bàn CEO, tủ sách, khu tiếp khách, bàn họp.
      this.box(6.4, 2.3, 0.14, '#9c7a55', FW / 2, y + 1.15, 0.16);
      this.brandSign(FW / 2, y + 1.6, 0.26, 4.6);
      this.prop('rugRectangle', FW / 2, y + 0.02, 3.0, { scale: KS * 1.9, tint: { carpet: mix('#ffffff', brand.primary, 0.55), carpetDarker: brand.primary } });
      for (const x of [1.4, 3.0]) this.prop('bookcaseClosedWide', x, y, 0.55);
      this.prop('pottedPlant', 4.3, y, 0.7);
      this.prop('pottedPlant', FW - 4.3, y, 0.7);
      lounge(13.2, 4.4);
      this.prop('tableRound', 3.0, y, 4.9);
      for (const [dx, dz] of [[-0.9, 0], [0.9, 0], [0, 0.9], [0, -0.9]]) this.prop('stoolBar', 3.0 + dx, y, 4.9 + dz, { scale: KS * 0.85 });
    } else {
      // Tầng phòng ban: tủ sách, màn hình số liệu, bàn họp nhanh, góc tiếp khách, quầy cà phê.
      this.prop('bookcaseClosedWide', 1.4, y, 0.55);
      this.prop('bookcaseOpen', 2.75, y, 0.55);
      this.prop('sideTableDrawers', FW / 2, y, 0.55);
      this.prop('televisionModern', FW / 2, y + this.topOf('sideTableDrawers'), 0.55, { scale: KS * 1.2 });
      this.prop('pottedPlant', 3.7, y, 0.7);
      this.prop('pottedPlant', FW - 0.8, y, 0.7);
      this.prop('tableRound', 2.2, y, 5.2);
      for (const [dx, dz] of [[-0.85, 0], [0.85, 0], [0, 0.85]]) this.prop('stoolBar', 2.2 + dx, y, 5.2 + dz, { scale: KS * 0.85 });
      lounge(13.4, 4.4);
      this.prop('kitchenBar', 10.6, y, 0.55, { tint: { woodDark: color } });
      this.prop('kitchenCoffeeMachine', 10.6, y + this.topOf('kitchenBar'), 0.55);
      this.prop('trashcan', 9.8, y, 0.55, { scale: KS * 0.7 });
    }
  }

  buildRoof() {
    const { FW, FD, H, brand } = this;
    this.box(FW + 0.7, 0.3, FD + 0.5, '#e7e2d8', FW / 2, H - 0.15, FD / 2 - 0.05);
    this.box(FW + 0.7, 0.5, 0.14, '#f4f1ea', FW / 2, H + 0.25, FD + 0.13);
    this.box(FW + 0.7, 0.5, 0.14, '#f4f1ea', FW / 2, H + 0.25, -0.23);
    this.box(0.14, 0.5, FD + 0.5, '#f4f1ea', -0.28, H + 0.25, FD / 2 - 0.05);
    this.box(0.14, 0.5, FD + 0.5, '#f4f1ea', FW + 0.28, H + 0.25, FD / 2 - 0.05);
    this.box(FW + 0.7, 0.1, 0.16, brand.primary, FW / 2, H + 0.55, FD + 0.13);
    // Biển công ty trên mái.
    for (const x of [FW / 2 - 2.6, FW / 2 + 2.6]) this.box(0.14, 1.0, 0.14, '#7d858c', x, H + 0.5, FD - 1.2);
    this.brandSign(FW / 2, H + 1.75, FD - 1.1, 7.2);
    this.box(2.2, 0.9, 1.6, '#d7d2c7', 3, H + 0.45, 2);
    this.box(1.4, 0.6, 1.4, '#c9c4b8', FW - 3, H + 0.3, 2.2);
  }

  // ---- Nhân viên ------------------------------------------------------------------------
  // Tô lại một ô trên bảng màu, giữ nguyên độ đậm nhạt gốc của từng điểm ảnh.
  recolor(ctx, [col, row], hex) {
    const x0 = col * 64, y0 = row * 128;
    const img = ctx.getImageData(x0, y0, 64, 128), d = img.data;
    const base = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
    let max = 1;
    for (let i = 0; i < d.length; i += 4) max = Math.max(max, d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11);
    for (let i = 0; i < d.length; i += 4) {
      const k = (d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11) / max;
      d[i] = base[0] * k; d[i + 1] = base[1] * k; d[i + 2] = base[2] * k;
    }
    ctx.putImageData(img, x0, y0);
  }

  outfit(s) {
    const { brand } = this;
    const hex = (v) => (/^#[0-9a-f]{6}$/i.test(v) ? v : null);
    const gender = s.gender === 'f' || s.gender === 'm' ? s.gender : hash(s.id, 2) ? 'f' : 'm';
    const formal = Boolean(s.lead || s.fixed);
    const pool = CAST[formal ? 'formal' : 'staff'][gender];
    const model = LOOKS[s.model] ? s.model : pool[(s.slot + hash(s.id, 7)) % pool.length];
    const cells = LOOKS[model];
    const colors = {
      shirt: hex(formal ? brand.secondary : brand.primary), pants: hex(brand.trousers), tie: hex(brand.accent),
      shoes: '#2a2a30', belt: '#2a2a30', hair: hex(s.hair), skin: hex(s.skin),
    };
    const key = model + JSON.stringify(colors);
    if (!this.textures.has(key)) {
      const gltf = this.assets.people[model];
      let src = null;
      gltf.scene.traverse((o) => { if (o.isMesh && o.material.map && !src) src = o.material.map; });
      const c = document.createElement('canvas');
      c.width = src.image.width; c.height = src.image.height;
      const ctx = c.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(src.image, 0, 0);
      for (const part of Object.keys(colors)) if (colors[part] && cells[part]) this.recolor(ctx, cells[part], colors[part]);
      const tex = new THREE.CanvasTexture(c);
      tex.flipY = src.flipY;
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.magFilter = src.magFilter; tex.minFilter = src.minFilter;
      tex.wrapS = src.wrapS; tex.wrapT = src.wrapT;
      this.textures.set(key, tex);
    }
    return { model, map: this.textures.get(key), formal };
  }

  // Đồng phục: áo màu chính của brand, dây thẻ màu nhấn, thẻ có vạch màu phòng ban.
  // Trưởng phòng và CEO mặc áo màu phụ (như áo khoác), cổ trắng, cà vạt màu nhấn.
  buildCharacter(s) {
    const { brand } = this;
    const look = this.outfit(s);
    const gltf = this.assets.people[look.model];
    const root = cloneSkinned(gltf.scene);
    let torso = null;
    const arms = [];
    root.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true;
        o.frustumCulled = false; // khung xương đưa lưới ra ngoài hộp bao gốc
        o.material = o.material.clone();
        o.material.map = look.map;
        o.material.roughness = 0.8;
      }
      if (o.isBone && o.name === 'torso') torso = o;
      if (o.isBone && (o.name === 'arm-left' || o.name === 'arm-right')) arms.push(o);
    });
    if (torso) {
      const kit = new THREE.Group();
      const piece = (w, h, color, x, y, rz = 0, dz = 0) => {
        const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.012), this.mat(color, { roughness: 0.6 }));
        m.position.set(x, y, 0.092 + dz);
        m.rotation.z = rz;
        kit.add(m);
      };
      if (!look.formal) { // người mặc vest đã có sẵn cổ áo, cà vạt trong mô hình
        piece(0.01, 0.09, brand.accent, -0.018, 0.315, -0.38);
        piece(0.01, 0.09, brand.accent, 0.018, 0.315, 0.38);
        piece(0.05, 0.046, '#ffffff', 0, 0.252, 0, 0.003);
        piece(0.05, 0.014, s.color, 0, 0.268, 0, 0.006);
      }
      root.add(kit);
      root.updateMatrixWorld(true);
      torso.attach(kit);
    }

    const g = new THREE.Group();
    root.scale.setScalar(PS);
    g.add(root);
    // Dấu chấm than đỏ: nhân viên đang chờ sếp duyệt quyền.
    const alert = new THREE.Group();
    const red = new THREE.MeshBasicMaterial({ color: '#e0352b', toneMapped: false });
    alert.add(new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.22, 0.08), red));
    const dot = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.08), red);
    dot.position.y = -0.19;
    alert.add(dot);
    alert.position.y = PERSON_H + 0.42; alert.visible = false;
    g.add(alert);
    this.scene.add(g);

    const mixer = new THREE.AnimationMixer(root);
    const actions = {};
    for (const clip of gltf.animations) actions[clip.name] = mixer.clipAction(clip);
    if (actions.walk) actions.walk.timeScale = 1.15;
    return { g, root, mixer, actions, arms, alert, current: null };
  }

  // Chuyển hoạt ảnh có hòa trộn, không khởi động lại nếu đang chạy đúng hoạt ảnh đó.
  play(a, name) {
    const b = a.body;
    const next = b.actions[name];
    if (!next || b.current === name) return;
    const prev = b.actions[b.current];
    next.reset().fadeIn(FADE).play();
    if (prev) prev.fadeOut(FADE);
    b.current = name;
  }

  // Vị trí bàn trên tầng theo thứ tự xếp chỗ.
  deskSpot(s) {
    const f = this.floors[s.floor] || {};
    const row = Math.floor(s.slot / 4), k = s.slot % 4;
    if (f.dept === 'executive') return { x: this.FW / 2 + 0.4 + s.slot * 2.6, z: 3.0 };
    if (f.kind === 'lobby') return { x: 10.4 + k * 1.8, z: 2.7 + row * 2.4 };
    return { x: 5.4 + k * 2.05, z: 2.7 + row * 2.4 };
  }

  buildDesk(s, x, y, z) {
    const g = new THREE.Group();
    g.position.set(x, y, z);
    g.rotation.y = Math.PI / 2; // bàn xoay ngang: người ngồi nhìn sang phải, máy quay thấy nghiêng mặt
    this.scene.add(g);
    const big = s.fixed ? 1.35 : s.lead ? 1.15 : 1;
    const top = this.topOf('desk');
    const desk = this.prop('desk', 0, 0, 0, { parent: g });
    desk.scale.set(KS * big, KS, KS);
    this.prop('chairDesk', 0, 0, -SEAT_BACK, { parent: g, tint: { carpet: s.off ? '#b9b9b9' : s.color } });
    this.prop('computerScreen', 0, top, 0.16, { parent: g, ry: Math.PI });
    this.prop('computerKeyboard', 0, top, -0.16, { parent: g, ry: Math.PI, scale: KS * 0.9 });
    // Vạch sáng sau màn hình: sáng màu phòng ban khi người ngồi bàn đang làm việc.
    const strip = new THREE.MeshBasicMaterial({ color: '#59636b', toneMapped: false });
    this.box(0.4, 0.06, 0.012, null, 0, top + 0.32, 0.215, g, { material: strip, noShadow: true });
    if (s.lead || s.fixed) {
      this.prop('lampSquareTable', 0.36 * big * KS - 0.18, top, 0.12, { parent: g }); // góc bàn phía tường sau, không che mặt
      this.box(0.3, 0.09, 0.05, this.brand.accent, -0.22 * big * KS, top + 0.045, -0.2, g);
    }
    return { strip, half: 0.36 * big };
  }

  label(cls, html) {
    const el = document.createElement('div');
    el.className = cls;
    el.innerHTML = html;
    this.labels.appendChild(el);
    return el;
  }

  addStaff(s) {
    const f = this.floors[s.floor] || {};
    const y = s.floor * this.FH;
    const desk = this.deskSpot(s);
    const seat = { x: desk.x - SEAT_BACK, z: desk.z };
    const built = this.buildDesk(s, desk.x, y, desk.z);
    const platePos = new THREE.Vector3(desk.x, y + 0.2, desk.z + built.half * KS + 0.25);
    if (s.off) { // vị trí đang trống: chỉ có bàn và biển "Đang tuyển"
      const plate = this.label('plate3 vacant', 'Đang tuyển');
      plate.title = s.title || '';
      this.vacant.push({ plate, pos: platePos });
      return;
    }
    // Đường đi từ góc tiếp khách tới ghế: ra lối đi, dọc lối đi, vòng qua cạnh bàn rồi vào ghế.
    let path = [seat];
    if (!s.fixed) {
      const cx = f.kind === 'lobby' ? 3.0 : 13.4, cz = f.kind === 'lobby' ? 4.6 : 4.4;
      const o = IDLE_SPOTS[s.slot % IDLE_SPOTS.length];
      const start = { x: cx + o[0], z: cz + o[1] };
      path = [start, { x: start.x, z: AISLE_Z }, { x: seat.x, z: AISLE_Z }];
      path.push(seat);
    }
    const lens = [0];
    for (let i = 1; i < path.length; i++) lens.push(lens[i - 1] + Math.hypot(path[i].x - path[i - 1].x, path[i].z - path[i - 1].z));

    const a = {
      s, y, path, lens, total: lens[lens.length - 1],
      u: 0, wantDesk: Boolean(s.fixed), status: 'idle', alert: false,
      phase: Math.random() * 6, cheer: 0, gesture: 4 + Math.random() * 14, gestureEnd: 0, heading: 0, seated: false,
      desk: built, body: this.buildCharacter(s),
      bubble: this.label('bubble3', '<span></span>'),
      plate: this.label('plate3', esc(s.name)),
      name: this.label('name3', esc(s.name)),
      deskPos: platePos,
    };
    a.bubble.style.setProperty('--c', s.color);
    a.plate.style.setProperty('--c', s.color);
    a.plate.title = s.title || '';
    a.body.g.position.y = y;
    a.body.mixer.setTime(Math.random() * 3); // lệch nhịp để cả tầng không cử động đồng loạt
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
    a.body.g.position.x = p.x;
    a.body.g.position.z = p.z;
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
    a.desk.strip.color.set(s.status === 'working' ? s.color : '#59636b');
    a.body.alert.visible = s.alert;
  }

  // ---- Hiệu ứng ------------------------------------------------------------------------
  // Tờ giấy giao việc: bay vòng ra ngoài mặt tiền để đi giữa các tầng.
  paper(from, to, color) {
    const A = this.actors.get(from.id), B = this.actors.get(to.id);
    if (!A || !B || A === B) return;
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.016, 0.4), new THREE.MeshBasicMaterial({ color: '#ffffff', toneMapped: false }));
    if (color) { // viền màu của phiên Claude Code
      const edge = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.018, 0.08), new THREE.MeshBasicMaterial({ color, toneMapped: false }));
      edge.position.z = -0.16;
      m.add(edge);
    }
    this.scene.add(m);
    const p0 = A.body.g.position.clone(); p0.y += 1.1;
    const p1 = new THREE.Vector3(B.deskPos.x, B.y + 0.75, B.deskPos.z - 0.9);
    const sameFloor = A.y === B.y;
    const out = sameFloor ? 0 : this.FD - Math.min(p0.z, p1.z) + 1.2;
    this.effects.push({
      t: 0, dur: sameFloor ? 1.0 : 1.5,
      step: (k) => {
        m.position.lerpVectors(p0, p1, k);
        const arc = Math.sin(Math.PI * k);
        m.position.z += arc * out;
        m.position.y += arc * (sameFloor ? 1.0 : 0.4);
        m.rotation.set(k * 5, k * 7, 0);
      },
      end: () => { this.scene.remove(m); m.geometry.dispose(); },
    });
  }

  celebrate(s) {
    const a = this.actors.get(s.id);
    if (!a) return;
    a.cheer = 1.8;
    const origin = a.body.g.position.clone(); origin.y += PERSON_H + 0.1;
    const bits = [];
    for (let i = 0; i < 30; i++) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(0.09, 0.05), new THREE.MeshBasicMaterial({ color: CONFETTI[i % CONFETTI.length], side: THREE.DoubleSide, toneMapped: false }));
      m.position.copy(origin);
      this.scene.add(m);
      const ang = Math.random() * Math.PI * 2, sp = 0.5 + Math.random() * 1.0;
      bits.push({ m, v: new THREE.Vector3(Math.cos(ang) * sp, 1.6 + Math.random() * 1.3, Math.sin(ang) * sp), r: Math.random() * 8 });
    }
    let last = 0;
    this.effects.push({
      t: 0, dur: 1.8,
      step: (k) => {
        const dt = (k - last) * 1.8; last = k;
        for (const b of bits) {
          b.v.y -= 4.2 * dt;
          b.m.position.addScaledVector(b.v, dt);
          if (b.m.position.y < a.y + 0.05) { b.m.position.y = a.y + 0.05; b.v.set(0, 0, 0); }
          b.m.rotation.set(b.r + k * 9, b.r * 2 + k * 7, 0);
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
    let heading = 0, typing = false, lift = 0;
    a.cheer = Math.max(0, a.cheer - dt);

    if (moving) {
      const dir = Math.sign(diff);
      a.u += dir * Math.min(Math.abs(diff), WALK_SPEED * dt);
      const p = this.place(a);
      heading = Math.atan2(p.dx * dir, p.dz * dir);
      this.play(a, 'walk');
    } else if (a.wantDesk) {
      heading = Math.PI / 2; lift = SEAT_LIFT;
      // Ngồi vào bàn. Xong việc thì gật đầu, chờ duyệt thì giơ tay gọi sếp, đang làm thì gõ phím.
      if (a.alert) this.play(a, 'interact-right');
      else if (a.cheer > 0) this.play(a, 'emote-yes');
      else { this.play(a, 'sit'); typing = a.status === 'working'; }
    } else {
      // Đứng ở góc tiếp khách: quay nhìn quanh, thỉnh thoảng gật đầu hoặc ra hiệu với người bên cạnh.
      heading = Math.sin(time * 0.3 + a.phase) * 0.9 + (a.path[0].x > this.FW / 2 ? -0.5 : 0.5);
      if (a.cheer > 0) this.play(a, 'jump');
      else {
        a.gesture -= dt;
        if (a.gesture < 0) {
          a.gesture = 8 + Math.random() * 16;
          a.gestureEnd = time + 1.6;
          this.play(a, Math.random() < 0.5 ? 'emote-yes' : 'interact-left');
        } else if (time > a.gestureEnd) this.play(a, 'idle');
      }
    }

    body.mixer.update(dt);
    if (typing) { // gõ phím: hai tay nhấp nhô sau khi hoạt ảnh ngồi đã áp vào xương
      a.phase += dt * 14;
      body.arms.forEach((bone, i) => { bone.rotation.x += Math.sin(a.phase + i * 2.3) * 0.2; });
    }
    if (a.alert) body.alert.position.y = PERSON_H + 0.42 + Math.sin(time * 6) * 0.05;

    // Quay người theo đường ngắn nhất.
    let d = heading - a.heading;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    a.heading += d * Math.min(1, dt * 9);
    body.g.rotation.y = a.heading;
    a.seated = !moving && a.wantDesk;
    body.g.position.y += (a.y + lift - body.g.position.y) * Math.min(1, dt * 8);
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
    if (this.goal) { // máy quay lướt mượt tới điểm cần xem
      const k = 1 - Math.exp(-dt * 3.0);
      this.controls.target.lerp(this.goal.target, k);
      this.camera.position.lerp(this.goal.pos, k);
      if (this.camera.position.distanceTo(this.goal.pos) < 0.03) this.goal = null;
    }
    this.controls.update();
    this.renderer.render(this.scene, this.camera);

    const head = this.head || (this.head = new THREE.Vector3());
    // Biển tên bàn và tên dưới chân chỉ hiện khi tới gần; ở toàn cảnh chỉ còn bong bóng việc và biển tầng.
    this.labels.classList.toggle('near', this.camera.position.distanceTo(this.controls.target) < this.fitDist * 0.62);
    for (const a of this.actors.values()) {
      const g = a.body.g.position;
      const top = (a.seated ? PERSON_H * 0.98 : PERSON_H + 0.1) + (a.alert ? 0.5 : 0);
      this.project(head.set(g.x, a.y + top, g.z), a.bubble);
      this.project(a.deskPos, a.plate);
      a.name.classList.toggle('show', !a.seated);
      if (!a.seated) this.project(head.set(g.x, a.y, g.z + 0.12), a.name, 4);
    }
    for (const v of this.vacant) this.project(v.pos, v.plate);
  }

  // ---- Khung nhìn ---------------------------------------------------------------------------
  // Lùi máy quay cho tới khi cả tòa nhà, biển trên mái và thềm trước nằm gọn trong khung.
  fitCamera(dir) {
    const { FW, FD, H } = this;
    const pts = [];
    for (const x of [-0.8, FW + 0.8]) for (const z of [-0.4, FD + 1.6]) for (const y of [-0.4, H + 2.9]) pts.push(new THREE.Vector3(x, y, z));
    const v = new THREE.Vector3();
    for (let dist = 12; dist < 110; dist += 0.5) {
      this.camera.position.copy(this.center).addScaledVector(dir, dist);
      this.camera.lookAt(this.center);
      this.camera.updateMatrixWorld();
      this.fitDist = dist;
      if (pts.every((p) => { v.copy(p).project(this.camera); return Math.abs(v.x) < 0.96 && Math.abs(v.y) < 0.95; })) return;
    }
  }

  // Lướt tới gần một nhân viên (góc thấp, nhìn rõ mặt).
  focusStaff(id) {
    const a = this.actors.get(id);
    if (!a) return;
    const target = new THREE.Vector3(a.deskPos.x - 0.2, a.y + 0.95, a.deskPos.z - 0.9);
    this.goal = { target, pos: target.clone().add(new THREE.Vector3(3.0, 0.9, 4.6)) };
    this.userMoved = true;
  }

  // Lướt tới một tầng: nhận mã phòng ban, mã tầng hoặc số thứ tự tầng.
  focusFloor(id) {
    const i = typeof id === 'number' ? id : this.floors.findIndex((f) => f.dept === id || f.id === id);
    if (i < 0 || i >= this.floors.length) return;
    const target = new THREE.Vector3(this.FW / 2, i * this.FH + 1.0, this.FD / 2 - 0.4);
    const back = (this.FW / 2 + 1.2) / Math.tan(Math.atan(Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2)) * this.camera.aspect));
    this.goal = { target, pos: target.clone().add(new THREE.Vector3(back * 0.2, 2.3, back)) };
    this.userMoved = true;
  }

  overview() {
    const pos = this.camera.position.clone(), target = this.controls.target.clone();
    this.resetCamera();
    this.goal = { target: this.controls.target.clone(), pos: this.camera.position.clone() };
    this.camera.position.copy(pos);
    this.controls.target.copy(target);
    this.controls.update();
  }

  resetCamera() {
    const yaw = THREE.MathUtils.degToRad(24), pitch = THREE.MathUtils.degToRad(11);
    const dir = new THREE.Vector3(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch));
    this.fitCamera(dir);
    this.controls.target.copy(this.center);
    this.controls.update();
    this.userMoved = false;
    this.goal = null;
  }

  resize() {
    const width = this.el.parentElement.clientWidth || 800;
    this.w = width;
    this.h = Math.round(Math.min(Math.max(width * 0.78, 420), Math.max(420, window.innerHeight * 0.86)));
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
    for (const t of this.textures.values()) t.dispose();
    this.renderer.dispose();
    this.el.remove();
  }
}
