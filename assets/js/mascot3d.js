/* Aurora-LAB — Linh vật 3D: chú sên phi hành gia của CLB Thiên văn USAC.
 * Dựng bằng three.js từ các khối cơ bản. Chú lơ lửng như trong không trọng lực,
 * nhìn theo con trỏ, chớp mắt, ngọ nguậy râu; nhảy mừng khi người học hoàn thành thử thách.
 * Nếu trình duyệt không hỗ trợ WebGL, ảnh assets/img/mascot.png được giữ nguyên. */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const AL = (window.AL = window.AL || {});

function buildMascot() {
  const root = new THREE.Group();   // lơ lửng
  const body = new THREE.Group();   // bộ đồ
  const head = new THREE.Group();   // mũ + sên (quay theo con trỏ)
  root.add(body, head);

  const white = new THREE.MeshPhysicalMaterial({ color: 0xf2f3f8, roughness: 0.34, clearcoat: 1, clearcoatRoughness: 0.18 });
  const grey = new THREE.MeshPhysicalMaterial({ color: 0xc9cdda, roughness: 0.3, metalness: 0.35, clearcoat: 0.6 });

  // ---- bộ đồ phi hành gia ----
  const torso = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32), white);
  torso.scale.set(1.28, 0.78, 0.95); torso.position.set(0, -1.38, -0.05);
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.64, 0.13, 20, 72), grey);
  collar.rotation.x = Math.PI / 2; collar.position.y = -0.84;
  const badge = new THREE.Mesh(new THREE.CircleGeometry(0.13, 40), new THREE.MeshStandardMaterial({ color: 0xff8a2b, emissive: 0xff6a10, emissiveIntensity: 0.55, roughness: 0.4 }));
  badge.position.set(0.42, -1.12, 0.84); badge.rotation.set(-0.35, 0.42, 0);
  body.add(torso, collar, badge);

  // ---- mũ bảo hiểm (có lỗ phía trước) ----
  const OPEN = 0.66;
  const shellGeo = new THREE.SphereGeometry(1, 72, 48, 0, Math.PI * 2, OPEN, Math.PI - OPEN);
  shellGeo.rotateX(Math.PI / 2);
  const shell = new THREE.Mesh(shellGeo, white);
  const inner = new THREE.Mesh(new THREE.SphereGeometry(0.955, 48, 32), new THREE.MeshStandardMaterial({ color: 0x1b1e3d, roughness: 0.85, side: THREE.BackSide }));
  const rim = new THREE.Mesh(new THREE.TorusGeometry(Math.sin(OPEN), 0.06, 20, 96), grey);
  rim.position.z = Math.cos(OPEN);
  const glassGeo = new THREE.SphereGeometry(1.012, 64, 24, 0, Math.PI * 2, 0, OPEN);
  glassGeo.rotateX(Math.PI / 2);
  const glass = new THREE.Mesh(glassGeo, new THREE.MeshPhysicalMaterial({ color: 0xb8c4ff, transparent: true, opacity: 0.14, roughness: 0.04, clearcoat: 1, envMapIntensity: 2.2, depthWrite: false }));
  const shine = new THREE.Mesh(new THREE.TorusGeometry(0.47, 0.022, 10, 48, 1.1), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55 }));
  shine.position.z = 0.9; shine.rotation.z = 1.75;
  for (const s of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.14, 40), grey);
    ear.rotation.z = Math.PI / 2; ear.position.set(s * 1.0, 0.04, 0);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.16, 32), white);
    cap.rotation.z = Math.PI / 2; cap.position.set(s * 1.04, 0.04, 0);
    head.add(ear, cap);
  }

  // ---- chú sên ----
  const slug = new THREE.Group();
  const prof = [[0, -0.46], [0.4, -0.46], [0.49, -0.42], [0.53, -0.32], [0.52, -0.18], [0.47, -0.02], [0.39, 0.13], [0.29, 0.25], [0.16, 0.33], [0, 0.36]].map(([x, y]) => new THREE.Vector2(x, y));
  const purple = new THREE.MeshPhysicalMaterial({ color: 0x6a45c8, roughness: 0.5, clearcoat: 0.35, clearcoatRoughness: 0.4, sheen: 0.35, sheenColor: new THREE.Color(0xb89cff), envMapIntensity: 0.7 });
  const bodyMesh = new THREE.Mesh(new THREE.LatheGeometry(prof, 64), purple);
  slug.add(bodyMesh);
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.55, roughness: 0.25 });
  const eyes = [];
  for (const s of [-1, 1]) {
    const e = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), eyeMat);
    e.scale.set(0.055, 0.088, 0.04); e.position.set(s * 0.115, 0.07, 0.405); e.rotation.y = s * 0.3;
    eyes.push(e);
    const cheek = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), new THREE.MeshStandardMaterial({ color: 0xff8cc6, emissive: 0xff5fae, emissiveIntensity: 0.35, roughness: 0.6 }));
    cheek.scale.set(0.08, 0.05, 0.025); cheek.position.set(s * 0.27, -0.08, 0.425); cheek.rotation.y = s * 0.6;
    slug.add(e, cheek);
  }
  const antennae = [];
  const stalkMat = new THREE.MeshStandardMaterial({ color: 0x6847c2, roughness: 0.5 });
  for (const s of [-1, 1]) {
    const pivot = new THREE.Group(); pivot.position.set(s * 0.09, 0.3, 0.04);
    const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(0, 0, 0), new THREE.Vector3(s * 0.02, 0.2, 0), new THREE.Vector3(s * 0.13, 0.33, 0.03));
    pivot.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 20, 0.02, 10), stalkMat));
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.047, 20, 14), purple);
    tip.position.copy(curve.getPoint(1)); pivot.add(tip);
    slug.add(pivot); antennae.push(pivot);
  }
  slug.position.set(0, -0.26, 0.06);
  const glowLight = new THREE.PointLight(0xc4adff, 1.2, 2.4); glowLight.position.set(0, 0.15, 0.55);

  head.add(shell, inner, rim, slug, glass, shine, glowLight);
  return { root, body, head, slug, eyes, antennae };
}

function makeScene() {
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xc9d8ff, 0x10121f, 0.7));
  const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(2.2, 3, 4); scene.add(key);
  const rimV = new THREE.DirectionalLight(0x9a86ff, 1.6); rimV.position.set(-3.5, 1.2, -2); scene.add(rimV);
  const rimO = new THREE.DirectionalLight(0xff8a2b, 0.9); rimO.position.set(3.5, -1, -2); scene.add(rimO);
  const m = buildMascot(); scene.add(m.root);
  const cam = new THREE.PerspectiveCamera(28, 1, 0.1, 30);
  cam.position.set(0, -0.12, 6.4); cam.lookAt(0, -0.32, 0);
  return { scene, cam, m };
}

function makeRenderer(size, opts = {}) {
  const r = new THREE.WebGLRenderer({ alpha: true, antialias: true, ...opts });
  r.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  r.setSize(size, size, false);
  r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.05;
  r.outputColorSpace = THREE.SRGBColorSpace;
  return r;
}

function withEnv(renderer, scene) {
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
}

// Ảnh tĩnh (dùng làm ảnh dự phòng / ảnh minh họa)
function snapshot(size = 256) {
  const r = makeRenderer(size, { preserveDrawingBuffer: true });
  r.setPixelRatio(1);
  const { scene, cam } = makeScene(); withEnv(r, scene);
  r.render(scene, cam);
  const url = r.domElement.toDataURL('image/png');
  r.dispose();
  return url;
}

function mount() {
  const btn = document.getElementById('mascot'); if (!btn) return;
  const size = () => btn.clientWidth || 72;
  let renderer;
  try { renderer = makeRenderer(size()); } catch (e) { return; } // không có WebGL: giữ ảnh tĩnh
  const { scene, cam, m } = makeScene(); withEnv(renderer, scene);
  renderer.domElement.className = 'mascot-3d';
  btn.prepend(renderer.domElement);
  btn.classList.add('m3d');
  new ResizeObserver(() => renderer.setSize(size(), size(), false)).observe(btn);

  let tx = 0, ty = 0, yaw = 0, pitch = 0, blinkAt = 2.5, mood = null, moodT = 0;
  window.addEventListener('pointermove', (e) => {
    const r = btn.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    tx = Math.max(-1, Math.min(1, (e.clientX - cx) / 500)); ty = Math.max(-1, Math.min(1, (e.clientY - cy) / 400));
  }, { passive: true });

  const clock = new THREE.Clock();
  const loop = () => {
    const dt = Math.min(0.05, clock.getDelta()), t = clock.elapsedTime;
    yaw += (tx * 0.55 - yaw) * Math.min(1, dt * 4); pitch += (ty * 0.35 - pitch) * Math.min(1, dt * 4);
    m.root.position.y = Math.sin(t * 1.3) * 0.06;
    m.root.rotation.z = Math.sin(t * 0.9) * 0.05;
    m.head.rotation.set(pitch, yaw, 0); m.body.rotation.y = yaw * 0.3;
    m.slug.position.y = -0.26 + Math.sin(t * 2.1) * 0.015;
    m.antennae.forEach((a, i) => { a.rotation.z = Math.sin(t * 3.2 + i * 1.7) * 0.16; a.rotation.x = Math.sin(t * 2.3 + i) * 0.08; });
    // chớp mắt
    blinkAt -= dt;
    const b = blinkAt < 0.12 ? 0.12 : 1;
    if (blinkAt < 0) blinkAt = 2.5 + Math.random() * 3;
    m.eyes.forEach((e) => (e.scale.y = 0.088 * b));
    // cảm xúc
    if (mood) {
      moodT += dt;
      if (mood === 'win') { const k = Math.min(1, moodT / 1.1); m.root.position.y += Math.sin(k * Math.PI) * 0.45; m.root.rotation.y = k * Math.PI * 2; if (k >= 1) { mood = null; m.root.rotation.y = 0; } }
      else { m.head.rotation.x += Math.sin(moodT * 12) * 0.08 * Math.max(0, 1 - moodT / 1.2); if (moodT > 1.2) mood = null; }
    }
    renderer.render(scene, cam);
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);

  AL.Mascot3D = { mood(x) { mood = x; moodT = 0; }, snapshot };
}

AL.Mascot3D = { mood() {}, snapshot };
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
