/* Aurora-LAB — Mặt Trời, gió Mặt Trời và từ quyển Trái Đất trong không gian 3D.
 * Kéo để xoay, cuộn để phóng to, nhấp đúp để quay về góc nhìn ban đầu.
 * Khoảng cách và kích thước KHÔNG theo tỉ lệ thật (thật ra Mặt Trời cách ~150 triệu km, rộng gấp ~109 lần Trái Đất).
 * Mô hình định tính: gió Mặt Trời → sóng xung kích (bow shock) → từ quyển bị ép phía ngày, kéo dài thành đuôi phía đêm
 * → electron trượt dọc đường sức xuống hai vành cực quang. Gió càng mạnh, từ quyển càng bị ép và cực quang càng sáng. */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const AL = window.AL;
const TEX = 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r160/examples/textures/planets/earth_atmos_2048.jpg';
const SUN_X = -30, RE = 1;

export function create(host, getState) {
  const wrap = document.createElement('div');
  wrap.className = 'se3d';
  wrap.innerHTML = `
    <div class="se3d-legend">
      <span><i style="background:#ffd27a"></i>Gió Mặt Trời</span>
      <span><i style="background:#7fb6ff"></i>Đường sức từ</span>
      <span><i style="background:#ff9c5a;opacity:.6"></i>Sóng xung kích</span>
      <span><i class="se3d-au"></i>Vành cực quang</span>
    </div>
    <div class="se3d-hint">Kéo để xoay · cuộn để phóng to · nhấp đúp để đặt lại<br><span>Kích thước, khoảng cách và tốc độ quỹ đạo không theo tỉ lệ thật (1 vòng ≈ 80 giây thay vì 1 năm)</span></div>`;
  host.append(wrap);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  wrap.prepend(renderer.domElement);

  const scene = new THREE.Scene();
  // Góc nhìn hẹp (28°) để vật thể hình cầu không bị méo ở mép khung
  const cam = new THREE.PerspectiveCamera(28, 1, 0.1, 600);
  const ctl = new OrbitControls(cam, renderer.domElement);
  ctl.enableDamping = true; ctl.minDistance = 4; ctl.maxDistance = 220;
  let follow = true; // true: bám theo Trái Đất · false: toàn cảnh quỹ đạo
  const sys = new THREE.Group(); scene.add(sys); // hệ Trái Đất + từ quyển + gió, trục −x luôn hướng về Mặt Trời
  const home = () => {
    if (follow) { const p = sys.position; ctl.target.set(p.x - Math.cos(orbitA) * 10, 0, p.z + Math.sin(orbitA) * 10); cam.position.set(ctl.target.x + 18, 16, ctl.target.z + 44); }
    else { ctl.target.set(0, 0, 0); cam.position.set(0, 70, 105); }
    ctl.update();
  };
  renderer.domElement.addEventListener('pointerdown', () => (ctl.autoRotate = false));
  renderer.domElement.addEventListener('dblclick', home);
  const modeBtn = document.createElement('button');
  modeBtn.type = 'button'; modeBtn.className = 'se3d-btn se3d-mode';
  const paintMode = () => (modeBtn.textContent = follow ? '🔭 Toàn cảnh quỹ đạo' : '🌍 Bám theo Trái Đất');
  modeBtn.onclick = () => { follow = !follow; paintMode(); home(); };
  paintMode(); wrap.append(modeBtn);

  // ---- nền sao ----
  {
    const n = 1400, pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const v = new THREE.Vector3().randomDirection().multiplyScalar(160 + Math.random() * 80);
      pos.set([v.x, v.y, v.z], i * 3);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    scene.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: 0.6, sizeAttenuation: true, transparent: true, opacity: 0.7 })));
  }

  // ---- Mặt Trời (tại gốc tọa độ) ----
  const sun = new THREE.Mesh(new THREE.SphereGeometry(5, 64, 48), new THREE.MeshBasicMaterial({ color: 0xffc35a }));
  scene.add(sun);
  // quỹ đạo Trái Đất (vòng mờ)
  {
    const pts = []; for (let i = 0; i <= 256; i++) { const a = (i / 256) * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(a) * -SUN_X, 0, -Math.sin(a) * -SUN_X)); }
    scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0x8fa6c8, transparent: true, opacity: 0.25 })));
  }
  let orbitA = 0;
  const glowTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const x = c.getContext('2d'), g = x.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, 'rgba(255,240,200,1)'); g.addColorStop(0.25, 'rgba(255,190,90,.75)'); g.addColorStop(0.6, 'rgba(255,120,30,.18)'); g.addColorStop(1, 'rgba(255,100,0,0)');
    x.fillStyle = g; x.fillRect(0, 0, 256, 256);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  })();
  const sunGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  sunGlow.scale.set(26, 26, 1); sun.add(sunGlow);
  const sunLight = new THREE.PointLight(0xffffff, 3.2, 0, 0); scene.add(sunLight); // ánh sáng tỏa từ Mặt Trời
  scene.add(new THREE.AmbientLight(0x404a66, 0.35));

  // ---- Trái Đất (nghiêng trục ~23,4°) ----
  const earthTilt = new THREE.Group(); sys.add(earthTilt);
  const TILT_Q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -0.41); // trục giữ hướng cố định trong không gian
  const earthMat = new THREE.MeshStandardMaterial({ color: 0x3a6fd0, roughness: 0.85, metalness: 0 });
  const earth = new THREE.Mesh(new THREE.SphereGeometry(RE, 96, 64), earthMat); earthTilt.add(earth);
  new THREE.TextureLoader().setCrossOrigin('anonymous').load(TEX, (t) => { t.colorSpace = THREE.SRGBColorSpace; earthMat.map = t; earthMat.color.set(0xffffff); earthMat.needsUpdate = true; });
  const atmo = new THREE.Mesh(new THREE.SphereGeometry(RE * 1.06, 48, 32), new THREE.MeshBasicMaterial({ color: 0x6fb4ff, transparent: true, opacity: 0.12, side: THREE.BackSide, depthWrite: false }));
  earthTilt.add(atmo);

  // ---- vành cực quang (cố định theo cực từ, gần trùng trục quay để đơn giản) ----
  const ovalMat = new THREE.MeshBasicMaterial({ color: 0x7dff72, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false });
  const ovals = [1, -1].map((s) => {
    const m = new THREE.Mesh(new THREE.TorusGeometry(RE * 0.42, 0.045, 10, 80), ovalMat);
    m.rotation.x = Math.PI / 2; m.position.y = s * RE * 0.92; sys.add(m); return m;
  });
  const ovalHalo = [1, -1].map((s) => {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0x7dff72, transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending }));
    sp.scale.set(1.6, 1.6, 1); sp.position.y = s * RE * 1.0; sys.add(sp); return sp;
  });

  // ---- từ quyển: đường sức dạng lưỡng cực, bị ép phía ngày (hướng Mặt Trời, x < 0), kéo dài phía đêm ----
  const fieldGroup = new THREE.Group(); sys.add(fieldGroup); // từ quyển định hướng theo gió Mặt Trời
  const fieldMat = new THREE.LineBasicMaterial({ color: 0x7fb6ff, transparent: true, opacity: 0.45 });
  const bowMat = new THREE.MeshBasicMaterial({ color: 0xff9c5a, transparent: true, opacity: 0.045, side: THREE.DoubleSide, depthWrite: false, wireframe: false });
  const bowWire = new THREE.LineBasicMaterial({ color: 0xff9c5a, transparent: true, opacity: 0.12 });
  let bow = null, bowLines = null, lastR0 = -1;
  const fieldLines = []; // [{pts:[Vector3]}] để electron trượt theo
  const buildField = (r0) => {
    fieldGroup.clear(); fieldLines.length = 0;
    const Ls = [1.6, 2.3, 3.2, 4.4, 6];
    for (let k = 0; k < 10; k++) {
      const phi = (k / 10) * Math.PI * 2;
      for (const L of Ls) {
        const pts = [];
        for (let th = 0.08; th <= Math.PI - 0.08; th += 0.04) {
          let r = L * Math.sin(th) ** 2;
          let x = r * Math.sin(th) * Math.cos(phi), z = r * Math.sin(th) * Math.sin(phi);
          const y = r * Math.cos(th);
          if (x < 0) { const f = Math.min(1, r0 / (r0 + Math.max(0, L - r0 * 0.75) * 1.6)); x *= f; } // phía ngày bị nén
          else x *= 1 + (L / 6) ** 2 * 2.4; // phía đêm kéo dài thành đuôi
          if (Math.hypot(x, y, z) < RE * 1.01) continue;
          pts.push(new THREE.Vector3(x, y, z));
        }
        if (pts.length < 4) continue;
        const ln = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), fieldMat);
        fieldGroup.add(ln);
        if (L >= 3.2) fieldLines.push(pts);
      }
    }
    // sóng xung kích + ranh giới từ quyển (mặt paraboloid quanh trục Mặt Trời – Trái Đất)
    if (bow) { sys.remove(bow, bowLines); bow.geometry.dispose(); bowLines.geometry.dispose(); }
    const prof = [];
    const sx = r0 * 1.35;
    for (let i = 0; i <= 24; i++) { const y = (i / 24) * 7.5; prof.push(new THREE.Vector2(y, -sx + (y * y) / (4.2 * sx) * 1.0)); }
    const geo = new THREE.LatheGeometry(prof, 64); geo.rotateZ(Math.PI / 2);
    geo.scale(-1, 1, 1);
    bow = new THREE.Mesh(geo, bowMat);
    bowLines = new THREE.LineSegments(new THREE.WireframeGeometry(new THREE.LatheGeometry(prof.filter((_, i) => i % 4 === 0), 16).rotateZ(Math.PI / 2).scale(-1, 1, 1)), bowWire);
    sys.add(bow, bowLines);
  };

  // ---- gió Mặt Trời: hạt bay từ Mặt Trời, vòng qua từ quyển; một phần đổ theo đường sức xuống cực ----
  const N = 900, pPos = new Float32Array(N * 3), pCol = new Float32Array(N * 3);
  const pg = new THREE.BufferGeometry();
  pg.setAttribute('position', new THREE.BufferAttribute(pPos, 3)); pg.setAttribute('color', new THREE.BufferAttribute(pCol, 3));
  const dotTex = (() => { // hạt tròn, mép mềm
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.45, 'rgba(255,255,255,.85)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.beginPath(); x.arc(32, 32, 32, 0, Math.PI * 2); x.fill();
    return new THREE.CanvasTexture(c);
  })();
  const pts = new THREE.Points(pg, new THREE.PointsMaterial({ size: 0.42, map: dotTex, alphaTest: 0.02, vertexColors: true, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false }));
  pts.frustumCulled = false; // vị trí thay đổi liên tục, không dùng khối bao cố định
  sys.add(pts);
  const P =Array.from({ length: N }, () => ({ alive: false }));
  const WIND = new THREE.Color(0xffd27a), DOWN = new THREE.Color(0x9dffb0);
  const spawn = (p) => {
    p.alive = true; p.mode = 'wind'; p.t = 0;
    p.x = SUN_X + 5.5 + Math.random() * 2; p.y = (Math.random() - 0.5) * 12; p.z = (Math.random() - 0.5) * 12;
    p.v = 9 + Math.random() * 4;
  };

  let running = false, raf = 0, last = performance.now(), T = 0;
  const auroraCol = new THREE.Color();
  const step = (dt) => {
    const st = getState(), flux = st.flux, r0 = 4.6 - 1.7 * flux;
    if (Math.abs(r0 - lastR0) > 0.05) { buildField(r0); lastR0 = r0; }
    // màu cực quang theo màu chủ đạo của thí nghiệm
    auroraCol.setRGB(st.rgb[0] / 255, st.rgb[1] / 255, st.rgb[2] / 255);
    ovalMat.color.copy(auroraCol); ovalHalo.forEach((s) => { s.material.color.copy(auroraCol); s.material.opacity = 0.25 + 0.6 * flux; });
    ovalMat.opacity = 0.4 + 0.55 * flux;
    ovals.forEach((o) => { const k = 0.42 + 0.14 * flux; o.scale.set(k / 0.42, k / 0.42, 1); }); // bão mạnh → vành mở rộng về phía xích đạo
    earth.rotation.y += dt * 0.12;
    // Trái Đất quay quanh Mặt Trời (rất nhanh so với thực tế: 1 vòng ≈ 80 s thay vì 1 năm)
    const prev = sys.position.clone();
    orbitA += dt * (Math.PI * 2 / 80);
    sys.position.set(Math.cos(orbitA) * -SUN_X, 0, -Math.sin(orbitA) * -SUN_X);
    sys.rotation.y = orbitA; // trục −x của hệ luôn chỉ về Mặt Trời
    earthTilt.quaternion.copy(sys.quaternion).invert().multiply(TILT_Q);
    if (follow) { const d = sys.position.clone().sub(prev); cam.position.add(d); ctl.target.add(d); }
    // hạt
    const rate = 120 + 360 * flux; let toSpawn = rate * dt;
    for (let i = 0; i < N; i++) {
      const p = P[i];
      if (!p.alive) { if (toSpawn >= 1 || Math.random() < toSpawn) { spawn(p); toSpawn -= 1; } else { pPos.set([0, -999, 0], i * 3); continue; } }
      p.t += dt;
      if (p.mode === 'wind') {
        p.x += p.v * dt;
        const d = Math.hypot(p.x, p.y, p.z), bs = r0 * 1.35;
        // gặp sóng xung kích: chậm lại và bị lái vòng qua hai bên
        const front = -bs + (p.y * p.y + p.z * p.z) / (4.2 * bs);
        if (p.x > front && d < 14) {
          const ry = p.y || 0.01, rz = p.z || 0.01, rr = Math.hypot(ry, rz);
          p.y += (ry / rr) * dt * 3.2; p.z += (rz / rr) * dt * 3.2; p.x -= p.v * dt * 0.45;
          if (Math.random() < dt * (0.08 + 0.5 * flux) && fieldLines.length) { // một phần “lọt” vào từ quyển
            p.mode = 'down'; p.line = fieldLines[(Math.random() * fieldLines.length) | 0]; p.k = Math.random() < 0.5 ? 0 : p.line.length - 1; p.dir = p.k ? -1 : 1; p.u = Math.floor(p.line.length / 2);
          }
        }
        if (p.x > 40 || Math.abs(p.y) > 22 || Math.abs(p.z) > 22) p.alive = false;
        pCol.set([WIND.r, WIND.g, WIND.b], i * 3);
        pPos.set([p.x, p.y, p.z], i * 3);
      } else {
        // trượt dọc đường sức từ giữa vòng về phía một cực
        p.u += (p.dir > 0 ? -1 : 1) * dt * 22;
        const idx = Math.round(p.u);
        if (idx <= 0 || idx >= p.line.length - 1) { p.alive = false; continue; }
        const q = p.line[idx];
        pCol.set([DOWN.r, DOWN.g, DOWN.b], i * 3);
        pPos.set([q.x, q.y, q.z], i * 3);
      }
    }
    pg.attributes.position.needsUpdate = true; pg.attributes.color.needsUpdate = true;
    sunGlow.material.rotation += dt * 0.05;
  };

  const fit = () => {
    const r = wrap.getBoundingClientRect(); if (!r.width) return;
    renderer.setSize(r.width, r.height, false); cam.aspect = r.width / r.height; cam.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(fit); ro.observe(wrap);
  const loop = (now) => {
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000); last = now; T += dt;
    step(dt); ctl.update(); renderer.render(scene, cam);
    raf = requestAnimationFrame(loop);
  };
  sys.position.set(-SUN_X, 0, 0);
  home();
  const show = (on) => {
    wrap.hidden = !on; cancelAnimationFrame(raf); running = on;
    if (on) { fit(); last = performance.now(); raf = requestAnimationFrame(loop); }
  };
  const place = (r) => { Object.assign(wrap.style, { left: r.x + 'px', top: r.y + 'px', width: r.w + 'px', height: r.h + 'px' }); fit(); };
  const destroy = () => { show(false); ro.disconnect(); ctl.dispose(); renderer.dispose(); wrap.remove(); };
  return { show, place, destroy, el: wrap };
}
