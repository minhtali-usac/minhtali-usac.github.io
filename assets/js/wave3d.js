/* Aurora-LAB — Sóng điện từ 3D (USACodex, bài 1).
 * Điện trường E (màu theo bước sóng) dao động trong mặt phẳng đứng, từ trường B dao động trong
 * mặt phẳng ngang, vuông góc với E và cùng pha; cả hai vuông góc với phương truyền (trục x).
 * Kéo để xoay, cuộn để phóng to. Bước sóng trên hình tỉ lệ log với λ thật để dễ so sánh. */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const AL = window.AL;
const LEN = 12, N = 64, AMP = 1.4;

export function create(stage) {
  const wrap = document.createElement('div');
  wrap.className = 'wave3d';
  wrap.innerHTML = `
    <div class="w3-legend">
      <span><i class="w3-e"></i>Điện trường $\\vec E$</span>
      <span><i class="w3-b"></i>Từ trường $\\vec B$</span>
      <span><i class="w3-k"></i>Phương truyền</span>
    </div>
    <div class="w3-hint">Kéo để xoay · cuộn để phóng to</div>`;
  stage.append(wrap);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  wrap.prepend(renderer.domElement);

  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(40, 2, 0.1, 100);
  cam.position.set(-5.5, 4.2, 9.5);
  const ctl = new OrbitControls(cam, renderer.domElement);
  ctl.enableDamping = true; ctl.target.set(0, 0, 0); ctl.minDistance = 5; ctl.maxDistance = 22;

  // trục truyền + mũi tên
  const axisMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.45 });
  scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-LEN / 2 - 0.3, 0, 0), new THREE.Vector3(LEN / 2 + 0.3, 0, 0)]), axisMat));
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.4, 20), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  cone.rotation.z = -Math.PI / 2; cone.position.x = LEN / 2 + 0.5; scene.add(cone);

  // mặt phẳng dao động (mờ)
  const plane = (rotX, color) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(LEN, AMP * 2.4), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.05, side: THREE.DoubleSide, depthWrite: false }));
    m.rotation.x = rotX; scene.add(m); return m;
  };
  const pE = plane(0, 0xffffff), pB = plane(Math.PI / 2, 0x6fb4ff);

  // đường bao + các vectơ (đoạn thẳng từ trục ra)
  const mkField = (color) => {
    const curveGeo = new THREE.BufferGeometry();
    curveGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
    const curve = new THREE.Line(curveGeo, new THREE.LineBasicMaterial({ color, linewidth: 2 }));
    const vecGeo = new THREE.BufferGeometry();
    vecGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 6), 3));
    const vecs = new THREE.LineSegments(vecGeo, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.55 }));
    scene.add(curve, vecs);
    return { curve, vecs };
  };
  const fE = mkField(0x7dff72), fB = mkField(0x6fb4ff);

  let lam = 557.7, running = true, raf = 0, T = 0, last = performance.now();
  const set = (nm) => {
    lam = nm;
    const rgb = nm < 380 ? [176, 140, 255] : nm > 780 ? [230, 80, 70] : AL.nmRGB(nm);
    const col = new THREE.Color(rgb[0] / 255, rgb[1] / 255, rgb[2] / 255);
    fE.curve.material.color.copy(col); fE.vecs.material.color.copy(col); pE.material.color.copy(col);
    wrap.style.setProperty('--w3e', `rgb(${rgb.join(',')})`);
  };

  const update = () => {
    // bước sóng hiển thị: 100 nm → 1,4 đơn vị, 1500 nm → 6 đơn vị (thang log)
    const k = Math.log(lam / 100) / Math.log(15), lw = 1.4 + k * 4.6;
    const ph = T * 2.2;
    const e = fE.curve.geometry.attributes.position.array, ev = fE.vecs.geometry.attributes.position.array;
    const b = fB.curve.geometry.attributes.position.array, bv = fB.vecs.geometry.attributes.position.array;
    for (let i = 0; i < N; i++) {
      const x = -LEN / 2 + (LEN * i) / (N - 1), s = Math.sin((2 * Math.PI * x) / lw - ph) * AMP;
      e[i * 3] = x; e[i * 3 + 1] = s; e[i * 3 + 2] = 0;
      b[i * 3] = x; b[i * 3 + 1] = 0; b[i * 3 + 2] = s * 0.8;
      ev.set([x, 0, 0, x, s, 0], i * 6); bv.set([x, 0, 0, x, 0, s * 0.8], i * 6);
    }
    for (const g of [fE.curve, fE.vecs, fB.curve, fB.vecs]) g.geometry.attributes.position.needsUpdate = true;
  };

  const fit = () => {
    const r = stage.getBoundingClientRect();
    if (!r.width) return;
    renderer.setSize(r.width, r.height, false);
    cam.aspect = r.width / r.height; cam.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(fit); ro.observe(stage); fit();

  const loop = (now) => {
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000); last = now; T += dt;
    update(); ctl.update(); renderer.render(scene, cam);
    raf = requestAnimationFrame(loop);
  };
  const show = (on) => {
    wrap.hidden = !on;
    cancelAnimationFrame(raf);
    running = on;
    if (on) { fit(); last = performance.now(); raf = requestAnimationFrame(loop); }
  };
  const destroy = () => { show(false); ro.disconnect(); ctl.dispose(); renderer.dispose(); wrap.remove(); };
  set(lam);
  return { set, show, destroy };
}
