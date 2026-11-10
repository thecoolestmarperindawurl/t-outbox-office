// View 3D: văn phòng dạng mô hình thu nhỏ bằng three.js.
// Nhân viên là robot có khung xương và hoạt ảnh (RobotExpressive, CC0), nội thất là bộ KayKit Furniture Bits (CC0).
// Tường, sàn, màn hình và phụ kiện đồng phục dựng bằng hình khối. Tọa độ lấy từ roster: 100 px = 1 đơn vị.
import * as THREE from 'three';
import { OrbitControls } from './vendor/OrbitControls.js';
import { GLTFLoader } from './vendor/loaders/GLTFLoader.js';
import { clone as cloneSkinned } from './vendor/utils/SkeletonUtils.js';
import { RoomEnvironment } from './vendor/environments/RoomEnvironment.js';

const U = (px) => px / 100;
const WALL_H = 2.1;
const ROBOT_HEIGHT = 0.9;      // chiều cao robot trong văn phòng
const SEAT_BACK = 0.52;        // ghế nằm sau tâm bàn bao xa
const SEAT_LIFT = 0.2;         // nâng robot lên mặt ghế khi ngồi (hoạt ảnh gốc ngồi xuống sàn)
const WALK_SPEED = 1.5;        // đơn vị mỗi giây
const FADE = 0.25;
const CONFETTI = ['#e4572e', '#f2b134', '#3f9a5a', '#3273c4', '#c8497a', '#7c5cbf'];
const FURNITURE = [
  'table_medium_long', 'table_low', 'chair_A', 'couch_pillows', 'armchair_pillows', 'rug_oval_A', 'rug_rectangle_A',
  'shelf_B_large_decorated', 'cabinet_medium_decorated', 'cabinet_small_decorated', 'cactus_medium_A', 'cactus_small_A',
  'lamp_standing', 'lamp_table', 'pictureframe_large_A', 'pictureframe_large_B', 'pictureframe_medium', 'book_set',
];
const mix = (a, b, t) => '#' + new THREE.Color(a).lerp(new THREE.Color(b), t).getHexString();

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export class View3D {
  // Nạp mô hình xong mới dựng cảnh. Lỗi nạp hoặc không có WebGL thì ném ra để app.js chuyển sang bản 2D.
  static async create(container, roster) {
    const loader = new GLTFLoader();
    const [robot, ...furniture] = await Promise.all([
      loader.loadAsync('/assets/robot.glb'),
      ...FURNITURE.map((name) => loader.loadAsync(`/assets/furniture/${name}.gltf`)),
    ]);
    const models = Object.fromEntries(FURNITURE.map((name, i) => [name, furniture[i].scene]));
    return new View3D(container, roster, { robot, models });
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
    };
    this.aisleTop = U((roster.aisles && roster.aisles.top) || 234);
    this.aisleBottom = U((roster.aisles && roster.aisles.bottom) || 510);
    this.actors = new Map();
    this.vacant = [];
    this.effects = [];
    this.mats = new Map();
    this.W = U(roster.floor.width);
    this.D = U(roster.floor.height);
    this.center = new THREE.Vector3(this.W / 2, 0.35, this.D / 2);
    this.userMoved = false;
    this.fitDist = 20;

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
    this.renderer.toneMappingExposure = 1.08;
    this.el.append(this.renderer.domElement, this.labels);

    this.scene = new THREE.Scene();
    // Ánh sáng môi trường cho vật liệu của mô hình (phản chiếu mềm, không cần ảnh HDR).
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environmentIntensity = 0.55;
    pmrem.dispose();

    this.camera = new THREE.PerspectiveCamera(30, 1.8, 0.5, 90);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    Object.assign(this.controls, {
      enableDamping: true, dampingFactor: 0.08, minDistance: 3.5, maxDistance: 50,
      maxPolarAngle: Math.PI * 0.47, minPolarAngle: 0.15,
    });
    this.controls.target.copy(this.center);
    this.controls.addEventListener('start', () => { this.userMoved = true; this.goal = null; });

    this.prepareRobot();
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
    if (!this.mats.has(key)) this.mats.set(key, new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0, ...opts }));
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

  // Đặt một món nội thất từ bộ mô hình. size = [rộng, cao, sâu] mong muốn; bỏ trống chiều nào thì giữ tỉ lệ.
  prop(name, x, z, { ry = 0, y = 0, scale = 0.45, size, parent = this.scene } = {}) {
    const src = this.assets.models[name];
    const o = src.clone(true);
    if (size) {
      const bb = src.userData.bb || (src.userData.bb = new THREE.Box3().setFromObject(src).getSize(new THREE.Vector3()));
      o.scale.set(size[0] / bb.x, (size[1] || size[0] * bb.y / bb.x) / bb.y, (size[2] || size[0] * bb.z / bb.x) / bb.z);
    } else o.scale.setScalar(scale);
    o.position.set(x, y, z);
    o.rotation.y = ry;
    o.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
    parent.add(o);
    return o;
  }

  buildLights() {
    this.hemi = new THREE.HemisphereLight('#fff6e6', '#b7a688', 0.75);
    this.sun = new THREE.DirectionalLight('#ffe9c9', 2.6);
    const sun = this.sun;
    sun.position.set(this.W / 2 + 6, 13, this.D / 2 + 7);
    sun.target.position.copy(this.center);
    sun.castShadow = true;
    sun.shadow.mapSize.set(4096, 4096);
    Object.assign(sun.shadow.camera, { left: -11, right: 11, top: 11, bottom: -11, near: 1, far: 44 });
    sun.shadow.bias = -0.0005;
    sun.shadow.normalBias = 0.03;
    sun.shadow.radius = 5;
    this.scene.add(this.hemi, sun, sun.target);
    // Đèn trần: chỉ bật buổi tối.
    this.lamps = [];
    for (const r of this.roster.rooms) {
      const lamp = new THREE.PointLight('#ffd49a', 0, 8, 1.4);
      lamp.position.set(U(r.x + r.w / 2), 1.8, U(r.y + r.h / 2));
      this.scene.add(lamp);
      this.lamps.push(lamp);
    }
    this.glass = new THREE.MeshStandardMaterial({ color: '#bfe3f2', emissive: '#8fd0ea', emissiveIntensity: 0.5, roughness: 0.2 });
  }

  setNight(on) {
    this.hemi.intensity = on ? 0.16 : 0.75;
    this.sun.intensity = on ? 0.3 : 2.6;
    this.sun.color.set(on ? '#8fa6ff' : '#ffe9c9');
    this.scene.environmentIntensity = on ? 0.12 : 0.55;
    for (const lamp of this.lamps) lamp.intensity = on ? 3.4 : 0;
    this.glass.color.set(on ? '#27345c' : '#bfe3f2');
    this.glass.emissive.set(on ? '#101a3a' : '#8fd0ea');
    this.el.classList.toggle('night', on);
  }

  woodTexture() {
    const c = document.createElement('canvas');
    c.width = 512; c.height = 512;
    const g = c.getContext('2d');
    g.fillStyle = '#d9c19a';
    g.fillRect(0, 0, 512, 512);
    const tones = ['#d3b98f', '#dcc6a2', '#cfb489', '#e0cba8', '#d6bd94'];
    for (let row = 0; row < 8; row++) {
      const y = row * 64, shift = (row % 2) * 128;
      for (let col = -1; col < 3; col++) {
        g.fillStyle = tones[(row * 3 + col + 5) % tones.length];
        g.fillRect(col * 256 + shift + 1, y + 1, 254, 62);
      }
    }
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(this.W / 2.4, this.D / 2.4);
    tex.anisotropy = 8;
    return tex;
  }

  window(x) {
    this.box(1.3, 0.72, 0.03, '#ffffff', x, 1.25, 0.012);
    this.box(1.18, 0.6, 0.03, null, x, 1.25, 0.03, this.scene, { material: this.glass });
    this.box(0.03, 0.6, 0.035, '#ffffff', x, 1.25, 0.035);
    this.box(1.36, 0.04, 0.1, '#ffffff', x, 0.88, 0.05);
  }

  buildShell() {
    const { W, D, brand } = this;
    // Đế và sàn gỗ.
    this.box(W + 0.5, 0.4, D + 0.5, '#bfa67c', W / 2, -0.22, D / 2);
    const floor = new THREE.Mesh(new THREE.BoxGeometry(W + 0.3, 0.04, D + 0.3), new THREE.MeshStandardMaterial({ map: this.woodTexture(), roughness: 0.7 }));
    floor.position.set(W / 2, -0.02, D / 2);
    floor.receiveShadow = true;
    this.scene.add(floor);
    // Tường sau và tường trái; hai mặt còn lại để trống cho dễ nhìn vào. Viền trên tường mang màu thương hiệu.
    this.box(W + 0.3, WALL_H, 0.14, '#f3ebdc', W / 2, WALL_H / 2, -0.07);
    this.box(0.14, WALL_H, D + 0.16, '#ece2cf', -0.07, WALL_H / 2, D / 2 - 0.01);
    this.box(W + 0.32, 0.14, 0.17, brand.primary, W / 2, WALL_H + 0.07, -0.07);
    this.box(0.17, 0.14, D + 0.18, brand.primary, -0.07, WALL_H + 0.07, D / 2 - 0.01);
    this.box(W + 0.3, 0.05, 0.02, brand.accent, W / 2, WALL_H - 0.07, 0.012);
    this.box(W + 0.3, 0.1, 0.03, '#ffffff', W / 2, 0.05, 0.016);
    this.box(0.03, 0.1, D + 0.1, '#ffffff', 0.016, 0.05, D / 2);
    // Cửa ra vào và cửa sổ trên tường trái.
    this.box(0.03, 1.3, 0.76, '#a9825a', 0.012, 0.65, D / 2);
    this.box(0.05, 0.06, 0.06, '#f2c14e', 0.04, 0.62, D / 2 + 0.27);
    this.box(0.03, 0.72, 1.3, '#ffffff', 0.012, 1.25, D - 1.25);
    this.box(0.03, 0.6, 1.18, null, 0.03, 1.25, D - 1.25, this.scene, { material: this.glass });
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
    const m = new THREE.Mesh(new THREE.PlaneGeometry(width, h), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
    m.position.set(x, y, 0.032);
    this.scene.add(m);
  }

  floorText(text, x, z) {
    const c = document.createElement('canvas');
    c.width = 768; c.height = 80;
    const g = c.getContext('2d');
    g.font = '700 42px system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif';
    g.fillStyle = 'rgba(70, 58, 40, 0.78)';
    g.textBaseline = 'middle';
    try { g.letterSpacing = '3px'; } catch { /* trình duyệt cũ */ }
    g.fillText(text.toUpperCase(), 6, 42);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.27), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false }));
    m.rotation.x = -Math.PI / 2;
    m.position.set(x + 1.3, 0.03, z);
    this.scene.add(m);
  }

  buildRooms() {
    const rooms = this.roster.rooms;
    for (const r of rooms) {
      const x = U(r.x), z = U(r.y), w = U(r.w), d = U(r.h);
      const dept = (this.roster.departments || []).find((k) => k.id === r.dept);
      // Phòng ban trải thảm màu của phòng; khu chung để lộ sàn gỗ.
      if (dept) this.box(w, 0.025, d, mix('#efe6d4', dept.color, 0.22), x + w / 2, 0.01, z + d / 2, this.scene, { roughness: 1 });
      this.floorText(r.name, x + 0.14, z + 0.3);
    }
    // Vách kính giữa hai phòng nằm cạnh nhau (trừ khu giữa, nơi mọi người đi lại).
    const glass = new THREE.MeshStandardMaterial({ color: '#d6ecf3', transparent: true, opacity: 0.28, roughness: 0.1 });
    for (const a of rooms) for (const b of rooms) {
      if (a === b || a.kind || b.kind) continue;
      const gap = b.x - (a.x + a.w);
      if (gap < 0 || gap > 30 || a.y !== b.y) continue;
      const x = U(a.x + a.w + gap / 2), z0 = U(a.y), d = U(a.h);
      this.box(0.04, 0.9, d, null, x, 0.46, z0 + d / 2, this.scene, { material: glass, transparent: true });
      this.box(0.07, 0.05, d, '#8f8576', x, 0.93, z0 + d / 2);
      this.box(0.07, 0.07, d, '#8f8576', x, 0.035, z0 + d / 2);
    }
  }

  buildDecor() {
    const room = (id) => this.roster.rooms.find((r) => r.id === id);
    const { brand } = this;
    const lounge = this.roster.rooms.find((r) => r.kind === 'lounge');
    if (lounge) {
      const x0 = U(lounge.x), z0 = U(lounge.y), w = U(lounge.w), d = U(lounge.h);
      const rug = this.prop('rug_oval_A', x0 + w * 0.48, z0 + d * 0.55, { size: [w * 0.82, 0.03, d * 0.74] });
      rug.traverse((m) => { if (m.isMesh) { m.material = m.material.clone(); m.material.color.set(mix('#ffffff', brand.primary, 0.35)); m.castShadow = false; } });
      this.prop('couch_pillows', x0 + 0.42, z0 + d * 0.5, { ry: Math.PI / 2, scale: 0.5 });
      this.prop('lamp_standing', x0 + 0.34, z0 + 0.34, { scale: 0.5 });
      // Quầy cà phê ở mép phải khu pantry.
      const cx = x0 + w - 0.36, cz = z0 + d / 2;
      this.prop('cabinet_medium_decorated', cx, cz - 0.42, { ry: -Math.PI / 2, size: [0.84, 0.5, 0.46] });
      this.prop('cabinet_medium_decorated', cx, cz + 0.42, { ry: -Math.PI / 2, size: [0.84, 0.5, 0.46] });
      this.box(0.26, 0.32, 0.24, '#3f434c', cx, 0.66, cz - 0.5, this.scene, { roughness: 0.4, metalness: 0.3 });
      this.box(0.02, 0.05, 0.08, null, cx - 0.135, 0.72, cz - 0.5, this.scene, { material: new THREE.MeshBasicMaterial({ color: brand.accent }) });
      for (let i = 0; i < 3; i++) {
        const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.03, 0.07, 12), this.mat(i === 1 ? brand.accent : '#ffffff'));
        cup.position.set(cx - 0.06 + (i % 2) * 0.1, 0.54, cz + 0.1 + i * 0.16); cup.castShadow = true;
        this.scene.add(cup);
      }
      this.prop('cactus_medium_A', cx, z0 + 0.3, { scale: 0.5 });
    }
    const guests = this.roster.rooms.find((r) => r.kind === 'guests');
    if (guests) {
      const gx = U(guests.x + guests.w), gz = U(guests.y);
      this.prop('cactus_medium_A', gx - 0.35, gz + 0.35, { scale: 0.55 });
      this.prop('rug_rectangle_A', U(guests.x + guests.w / 2), gz + 0.95, { size: [U(guests.w) * 0.6, 0.03, 0.9] });
      this.prop('armchair_pillows', U(guests.x) + 1.1, gz + 0.8, { scale: 0.45 });
      this.prop('table_low', U(guests.x + guests.w / 2), gz + 0.9, { scale: 0.42 });
      this.prop('armchair_pillows', gx - 1.3, gz + 0.8, { scale: 0.45 });
    }

    // Tường sau: biển công ty ở phòng điều hành, bảng trắng ở Marketing, tranh ở Sản phẩm, còn lại là cửa sổ.
    const exec = room('executive');
    if (exec) {
      this.brandSign(U(exec.x + exec.w / 2), 1.32, Math.min(1.9, U(exec.w) - 0.4));
      this.prop('cabinet_small_decorated', U(exec.x) + 0.34, 0.26, { scale: 0.42 });
      this.prop('cactus_medium_A', U(exec.x + exec.w) - 0.34, 0.34, { scale: 0.5 });
    }
    const marketing = room('marketing');
    if (marketing) {
      const x = U(marketing.x + marketing.w / 2);
      this.box(1.76, 0.8, 0.03, '#d9d2c3', x, 1.25, 0.016);
      this.box(1.68, 0.72, 0.03, '#ffffff', x, 1.25, 0.024);
      const notes = ['#f2b134', '#e4572e', '#7c5cbf', '#3f9a5a', '#3273c4', '#f2b134'];
      notes.forEach((c, i) => this.box(0.16, 0.16, 0.012, c, x - 0.62 + (i % 3) * 0.25, 1.39 - Math.floor(i / 3) * 0.24, 0.044));
      this.box(0.5, 0.02, 0.012, '#3b4a6b', x + 0.45, 1.35, 0.044);
      this.box(0.36, 0.02, 0.012, '#3b4a6b', x + 0.38, 1.23, 0.044);
      this.window(U(marketing.x) + 1.0);
      this.window(U(marketing.x + marketing.w) - 1.0);
    }
    const product = room('product');
    if (product) {
      const x = U(product.x + product.w / 2);
      this.prop('pictureframe_large_A', x - 0.62, 0.02, { y: 1.28, scale: 0.6 });
      this.prop('pictureframe_large_B', x + 0.05, 0.02, { y: 1.28, scale: 0.6 });
      this.prop('pictureframe_medium', x + 0.66, 0.02, { y: 1.28, scale: 0.6 });
      this.window(U(product.x) + 1.0);
      this.window(U(product.x + product.w) - 1.0);
    }
    const tech = room('engineering');
    if (tech) {
      const z = U(tech.y + tech.h) - 0.45;
      this.box(0.36, 1.0, 0.44, '#33373f', 0.24, 0.5, z, this.scene, { roughness: 0.5, metalness: 0.4 });
      for (let i = 0; i < 5; i++) {
        this.box(0.012, 0.03, 0.3, null, 0.426, 0.22 + i * 0.16, z, this.scene, {
          material: new THREE.MeshBasicMaterial({ color: i % 2 ? '#6fe39a' : '#5ab0ff' }),
        });
      }
    }
    for (const id of ['sales', 'operations']) {
      const r = room(id);
      if (r) this.prop('cactus_medium_A', U(r.x + r.w) - 0.34, U(r.y) + 0.36, { scale: 0.5 });
    }
  }

  // ---- Robot nhân viên ----------------------------------------------------------------
  // Đo mô hình gốc một lần: tỉ lệ thu nhỏ và vị trí ngực để gắn phụ kiện đồng phục.
  prepareRobot() {
    const { scene } = this.assets.robot;
    scene.updateMatrixWorld(true);
    const all = new THREE.Box3().setFromObject(scene);
    let torso = null;
    scene.traverse((o) => { if (o.name === 'Torso') torso = o; });
    const tb = new THREE.Box3().setFromObject(torso || scene);
    this.robot = {
      scale: ROBOT_HEIGHT / (all.max.y - all.min.y),
      chest: { x: (tb.min.x + tb.max.x) / 2, y: tb.min.y + (tb.max.y - tb.min.y) * 0.62, z: tb.max.z, w: tb.max.x - tb.min.x, h: tb.max.y - tb.min.y },
      clips: Object.fromEntries(this.assets.robot.animations.map((c) => [c.name, c])),
    };
  }

  // Đồng phục: thân robot sơn màu chính của brand, đeo dây thẻ màu nhấn và thẻ có vạch màu phòng ban.
  // Trưởng phòng và CEO sơn màu phụ (như áo khoác) và đeo cà vạt màu nhấn.
  buildCharacter(s) {
    const { brand, robot } = this;
    const formal = Boolean(s.lead || s.fixed);
    const root = cloneSkinned(this.assets.robot.scene);
    const paint = new THREE.Color(formal ? brand.secondary : brand.primary);
    let head = null, torso = null;
    const lowerArms = [];
    root.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true;
        o.frustumCulled = false; // xương di chuyển xa khỏi hộp bao gốc
        if (o.material.name === 'Main') {
          o.material = o.material.clone();
          o.material.color.copy(paint);
          o.material.roughness = 0.55;
        }
        if (o.morphTargetDictionary && !head) head = o;
      }
      if (o.name === 'Torso') torso = o;
      if (o.name === 'LowerArmL' || o.name === 'LowerArmR') lowerArms.push(o);
    });

    // Phụ kiện đặt theo tọa độ gốc của mô hình rồi gắn vào thân, để chúng chuyển động cùng hoạt ảnh.
    if (torso) {
      const c = robot.chest, kit = new THREE.Group();
      const piece = (w, h, color, x, y, rz = 0, dz = 0) => {
        const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.06), this.mat(color, { roughness: 0.6 }));
        m.position.set(c.x + x, c.y + y, c.z + 0.03 + dz);
        m.rotation.z = rz;
        m.castShadow = true;
        kit.add(m);
      };
      if (formal) {
        piece(c.w * 0.22, c.h * 0.16, brand.accent, 0, c.h * 0.2);                     // nút cà vạt
        piece(c.w * 0.16, c.h * 0.52, brand.accent, 0, -c.h * 0.1);                   // thân cà vạt
        piece(c.w * 0.3, c.h * 0.12, '#ffffff', -c.w * 0.2, c.h * 0.27, -0.5, -0.02); // cổ áo
        piece(c.w * 0.3, c.h * 0.12, '#ffffff', c.w * 0.2, c.h * 0.27, 0.5, -0.02);
      } else {
        piece(c.w * 0.06, c.h * 0.5, brand.accent, -c.w * 0.13, c.h * 0.08, -0.32);   // dây đeo thẻ
        piece(c.w * 0.06, c.h * 0.5, brand.accent, c.w * 0.13, c.h * 0.08, 0.32);
        piece(c.w * 0.36, c.h * 0.34, '#ffffff', 0, -c.h * 0.28, 0, 0.02);            // thẻ nhân viên
        piece(c.w * 0.36, c.h * 0.1, s.color, 0, -c.h * 0.17, 0, 0.05);               // vạch màu phòng ban
      }
      root.add(kit);
      root.updateMatrixWorld(true);
      torso.attach(kit);
    }

    const g = new THREE.Group();
    root.scale.setScalar(robot.scale);
    g.add(root);
    // Dấu chấm than đỏ: nhân viên đang chờ sếp duyệt quyền.
    const alert = new THREE.Group();
    const red = new THREE.MeshBasicMaterial({ color: '#e0352b', toneMapped: false });
    alert.add(new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.2, 0.07), red));
    const dot = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 0.07), red);
    dot.position.y = -0.17;
    alert.add(dot);
    alert.position.y = ROBOT_HEIGHT + 0.36; alert.visible = false;
    g.add(alert);
    this.scene.add(g);

    const mixer = new THREE.AnimationMixer(root);
    const actions = {};
    for (const [name, clip] of Object.entries(robot.clips)) actions[name] = mixer.clipAction(clip);
    for (const name of ['Sitting', 'ThumbsUp', 'Jump', 'Yes', 'Wave']) {
      if (!actions[name]) continue;
      actions[name].setLoop(THREE.LoopOnce, 1);
      actions[name].clampWhenFinished = true;
    }
    if (actions.Walking) actions.Walking.timeScale = 1.25;
    return { g, root, mixer, actions, head, lowerArms, alert, current: null };
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

  face(a, name, value) {
    const h = a.body.head;
    if (!h) return;
    const i = h.morphTargetDictionary[name];
    if (i === undefined) return;
    h.morphTargetInfluences[i] += (value - h.morphTargetInfluences[i]) * 0.2;
  }

  buildDesk(s) {
    const x = U(s.desk.x), z = U(s.desk.y);
    const w = s.fixed ? 1.36 : s.lead ? 1.18 : 1.02;
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    this.scene.add(g);
    // Thảm bàn mang màu phòng ban.
    this.box(w + 0.34, 0.012, 1.42, mix('#ffffff', s.off ? '#9a9a9a' : s.color, 0.62), 0, 0.03, -0.18, g, { roughness: 1 }).castShadow = false;
    this.prop('table_medium_long', 0, 0, { size: [w, 0.44, 0.6], parent: g });
    this.prop('chair_A', 0, -SEAT_BACK, { scale: 0.44, parent: g, ry: 0 });
    // Màn hình quay về phía người ngồi; mặt sau có vạch sáng màu phòng ban khi đang làm việc.
    this.box(0.16, 0.02, 0.1, '#2b2e35', 0, 0.45, 0.16, g);
    this.box(0.04, 0.1, 0.03, '#2b2e35', 0, 0.5, 0.17, g);
    this.box(0.5, 0.3, 0.03, '#23262c', 0, 0.68, 0.16, g, { roughness: 0.35 });
    const screen = new THREE.MeshBasicMaterial({ color: '#10131a', toneMapped: false });
    this.box(0.45, 0.25, 0.006, null, 0, 0.68, 0.142, g, { material: screen });
    const strip = new THREE.MeshBasicMaterial({ color: '#4a4f5a', toneMapped: false });
    this.box(0.26, 0.045, 0.006, null, 0, 0.68, 0.178, g, { material: strip });
    this.box(0.32, 0.016, 0.11, '#e9e2d3', 0, 0.448, -0.1, g);
    if (s.lead || s.fixed) {
      this.prop('lamp_table', -w / 2 + 0.16, 0.12, { y: 0.44, scale: 0.26, parent: g });
      this.prop('book_set', w / 2 - 0.2, 0.08, { y: 0.5, scale: 0.3, parent: g, ry: 0.3 });
      this.box(0.22, 0.07, 0.03, this.brand.accent, -w / 2 + 0.42, 0.475, -0.2, g);
    }
    return { strip, screen, w };
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
    const built = this.buildDesk(s);
    const platePos = new THREE.Vector3(desk.x, 0.12, desk.z + 0.36);
    if (s.off) { // vị trí đang trống: chỉ có bàn và biển "Đang tuyển"
      const plate = this.label('plate3 vacant', 'Đang tuyển');
      plate.title = s.title || '';
      this.vacant.push({ plate, pos: platePos });
      return;
    }
    // Đường đi từ pantry tới ghế: ra lối đi, dọc lối đi, rồi vào ghế (dãy trên phải vòng qua cạnh bàn).
    let path = [seat];
    if (!s.fixed) {
      const start = { x: U(s.lounge.x), z: U(s.lounge.y) };
      const aisle = desk.z > this.aisleBottom ? this.aisleBottom : this.aisleTop;
      const side = desk.x + built.w / 2 + 0.24;
      path = [start, { x: start.x, z: aisle }];
      if (aisle > seat.z) path.push({ x: side, z: aisle }, { x: side, z: seat.z });
      else path.push({ x: desk.x, z: aisle });
      path.push(seat);
    }
    const lens = [0];
    for (let i = 1; i < path.length; i++) lens.push(lens[i - 1] + Math.hypot(path[i].x - path[i - 1].x, path[i].z - path[i - 1].z));

    const a = {
      s, path, lens, total: lens[lens.length - 1],
      u: 0, wantDesk: Boolean(s.fixed), status: 'idle', alert: false,
      phase: Math.random() * 6, cheer: 0, gesture: 4 + Math.random() * 14, heading: 0,
      desk: built, body: this.buildCharacter(s),
      bubble: this.label('bubble3', '<span></span>'),
      plate: this.label('plate3', esc(s.name)),
      name: this.label('name3', esc(s.name)),
      deskPos: platePos,
    };
    a.bubble.style.setProperty('--c', s.color);
    a.plate.style.setProperty('--c', s.color);
    a.plate.title = s.title || '';
    a.body.mixer.setTime(Math.random() * 3); // lệch nhịp để cả phòng không cử động đồng loạt
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
    const on = s.status === 'working';
    a.desk.strip.color.set(on ? s.color : '#4a4f5a');
    a.desk.screen.color.set(on ? mix('#10131a', s.color, 0.55) : '#10131a');
    a.body.alert.visible = s.alert;
  }

  // ---- Hiệu ứng ------------------------------------------------------------------------
  paper(from, to, color) {
    const A = this.actors.get(from.id), B = this.actors.get(to.id);
    if (!A || !B || A === B) return;
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.012, 0.3), new THREE.MeshBasicMaterial({ color: '#ffffff', toneMapped: false }));
    if (color) { // viền màu của phiên Claude Code
      const edge = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.014, 0.06), new THREE.MeshBasicMaterial({ color, toneMapped: false }));
      edge.position.z = -0.12;
      m.add(edge);
    }
    this.scene.add(m);
    const p0 = A.body.g.position.clone().setY(0.95);
    const p1 = new THREE.Vector3(B.deskPos.x, 0.5, B.deskPos.z - 0.45);
    const high = 1.2 + p0.distanceTo(p1) * 0.12;
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
    a.cheer = 1.9;
    const origin = a.body.g.position.clone().setY(ROBOT_HEIGHT + 0.1);
    const bits = [];
    for (let i = 0; i < 30; i++) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(0.07, 0.04), new THREE.MeshBasicMaterial({ color: CONFETTI[i % CONFETTI.length], side: THREE.DoubleSide, toneMapped: false }));
      m.position.copy(origin);
      this.scene.add(m);
      const ang = Math.random() * Math.PI * 2, sp = 0.5 + Math.random() * 0.9;
      bits.push({ m, v: new THREE.Vector3(Math.cos(ang) * sp, 1.7 + Math.random() * 1.4, Math.sin(ang) * sp), r: Math.random() * 8 });
    }
    let last = 0;
    this.effects.push({
      t: 0, dur: 1.8,
      step: (k) => {
        const dt = (k - last) * 1.8; last = k;
        for (const b of bits) {
          b.v.y -= 4.2 * dt;
          b.m.position.addScaledVector(b.v, dt);
          if (b.m.position.y < 0.04) { b.m.position.y = 0.04; b.v.set(0, 0, 0); }
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
    let heading = 0, typing = false;
    a.cheer = Math.max(0, a.cheer - dt);

    if (moving) {
      const dir = Math.sign(diff);
      a.u += dir * Math.min(Math.abs(diff), WALK_SPEED * dt);
      const p = this.place(a);
      heading = Math.atan2(p.dx * dir, p.dz * dir);
      this.play(a, 'Walking');
    } else if (a.wantDesk) {
      // Ngồi vào bàn. Xong việc thì giơ ngón cái, chờ duyệt thì vẫy tay gọi sếp, đang làm thì gõ phím.
      if (a.cheer > 0) this.play(a, 'ThumbsUp');
      else if (a.alert) this.play(a, 'Wave');
      else { this.play(a, 'Sitting'); typing = a.status === 'working'; }
      if (a.alert && body.actions.Wave && !body.actions.Wave.isRunning()) body.actions.Wave.reset().play();
    } else {
      // Đứng ở pantry: thỉnh thoảng vẫy tay hoặc gật đầu với người bên cạnh.
      heading = Math.sin(time * 0.35 + a.phase) * 0.6;
      if (a.cheer > 0) this.play(a, 'Dance');
      else {
        a.gesture -= dt;
        if (a.gesture < 0) {
          a.gesture = 9 + Math.random() * 16;
          a.gestureEnd = time + 1.7;
          this.play(a, Math.random() < 0.5 ? 'Wave' : 'Yes');
        } else if (!(time < a.gestureEnd)) this.play(a, 'Idle');
      }
    }

    body.mixer.update(dt);
    if (typing) { // gõ phím: cẳng tay nhấp nhô sau khi hoạt ảnh ngồi đã áp vào xương
      a.phase += dt * 15;
      body.lowerArms.forEach((bone, i) => { bone.rotation.x += -0.75 + Math.sin(a.phase + i * 2.1) * 0.22; });
    }
    this.face(a, 'Surprised', a.alert ? 1 : 0);
    if (a.alert) body.alert.position.y = ROBOT_HEIGHT + 0.36 + Math.sin(time * 6) * 0.04;

    // Quay người theo đường ngắn nhất.
    let d = heading - a.heading;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    a.heading += d * Math.min(1, dt * 9);
    body.g.rotation.y = a.heading;
    a.seated = !moving && a.wantDesk;
    body.g.position.y += ((a.seated ? SEAT_LIFT : 0) - body.g.position.y) * Math.min(1, dt * 8);
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
      const k = 1 - Math.exp(-dt * 3.2);
      this.controls.target.lerp(this.goal.target, k);
      this.camera.position.lerp(this.goal.pos, k);
      if (this.camera.position.distanceTo(this.goal.pos) < 0.02) this.goal = null;
    }
    this.controls.update();
    this.renderer.render(this.scene, this.camera);

    const head = this.head || (this.head = new THREE.Vector3());
    // Tên dưới chân người ở pantry chỉ hiện khi phóng gần, để không chồng chữ ở góc nhìn toàn cảnh.
    this.labels.classList.toggle('near', this.camera.position.distanceTo(this.controls.target) < this.fitDist * 0.8);
    for (const a of this.actors.values()) {
      const g = a.body.g.position;
      const top = (a.seated ? 0.98 : ROBOT_HEIGHT + 0.08) + (a.alert ? 0.42 : 0);
      this.project(head.set(g.x, top, g.z), a.bubble);
      this.project(a.deskPos, a.plate);
      a.name.classList.toggle('show', !a.seated);
      if (!a.seated) this.project(head.set(g.x, 0, g.z + 0.1), a.name, 4);
    }
    for (const v of this.vacant) this.project(v.pos, v.plate);
  }

  // ---- Khung nhìn ---------------------------------------------------------------------------
  // Lùi máy quay cho tới khi cả mặt sàn lẫn đỉnh tường nằm gọn trong khung.
  fitCamera(dir) {
    const { W, D } = this;
    const pts = [];
    for (const x of [-0.3, W + 0.3]) for (const z of [-0.2, D + 0.3]) pts.push(new THREE.Vector3(x, 0, z));
    pts.push(new THREE.Vector3(-0.2, WALL_H + 0.3, -0.2), new THREE.Vector3(W + 0.2, WALL_H + 0.3, -0.2), new THREE.Vector3(-0.2, WALL_H + 0.3, D));
    const v = new THREE.Vector3();
    for (let dist = 8; dist < 50; dist += 0.25) {
      this.camera.position.copy(this.center).addScaledVector(dir, dist);
      this.camera.lookAt(this.center);
      this.camera.updateMatrixWorld();
      this.fitDist = dist;
      if (pts.every((p) => { v.copy(p).project(this.camera); return Math.abs(v.x) < 0.975 && v.y < 0.92 && v.y > -0.95; })) return;
    }
  }

  // Lướt tới gần một nhân viên (góc thấp, nhìn rõ mặt) hoặc một phòng.
  focusStaff(id) {
    const a = this.actors.get(id);
    if (!a) return;
    const target = new THREE.Vector3(a.deskPos.x, 0.6, a.deskPos.z - 0.7);
    this.goal = { target, pos: target.clone().add(new THREE.Vector3(1.5, 1.25, 3.5)) };
    this.userMoved = true;
  }

  focusRoom(id) {
    const r = this.roster.rooms.find((k) => k.id === id || k.dept === id);
    if (!r) return;
    const target = new THREE.Vector3(U(r.x + r.w / 2), 0.5, U(r.y + r.h / 2));
    const back = Math.max(4.2, U(r.w) * 0.95);
    this.goal = { target, pos: target.clone().add(new THREE.Vector3(back * 0.28, back * 0.42, back)) };
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
    const yaw = THREE.MathUtils.degToRad(12), pitch = THREE.MathUtils.degToRad(33);
    const dir = new THREE.Vector3(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch));
    this.fitCamera(dir);
    this.controls.target.copy(this.center);
    this.controls.update();
    this.userMoved = false;
  }

  resize() {
    const width = this.el.parentElement.clientWidth || 800;
    this.w = width;
    this.h = Math.round(Math.min(Math.max(width * 0.52, 280), Math.max(280, window.innerHeight * 0.8)));
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
