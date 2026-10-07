/* Aurora-LAB — Mô phỏng 2: CỰC QUANG THEO ĐỘ CAO
 * Câu hỏi: Vì sao cực quang có màu xanh lục, đỏ và tím?
 * Bên trái: Mặt Trời → gió Mặt Trời → từ quyển dẫn hạt về vùng cực.
 * Bên phải: mặt cắt khí quyển; năng lượng hạt quyết định độ cao hạt dừng lại,
 * độ cao quyết định chất nào phát sáng và màu gì.
 * Độ cao đỉnh phát xạ theo năng lượng hạt dùng giá trị điển hình. */
(function () {
  'use strict';
  const AL = window.AL, D = AL.DATA, { fmt, clamp, lerp } = AL;

  const AMIN = 60, AMAX = 420, STEP = 2, N = (AMAX - AMIN) / STEP + 1, AXIS_TOP = 420;
  const ALT = Float32Array.from({ length: N }, (_, i) => AMIN + i * STEP);
  const MONO = '"JetBrains Mono", ui-monospace, monospace';
  const BODY = '"Be Vietnam Pro", system-ui, sans-serif';
  const DISP = '"Chakra Petch", system-ui, sans-serif';
  const ORANGE = '#ff8a2b';

  // Độ cao đỉnh hấp thụ năng lượng theo năng lượng electron (log10 keV → km), gần đúng.
  const PEAK = [[-1, 260], [-0.523, 200], [0, 150], [0.477, 122], [1, 106], [1.477, 92]];
  const peakAlt = (E) => {
    const x = clamp(Math.log10(E), PEAK[0][0], PEAK[PEAK.length - 1][0]);
    for (let i = 1; i < PEAK.length; i++) if (x <= PEAK[i][0]) {
      const [a, ha] = PEAK[i - 1], [b, hb] = PEAK[i];
      return lerp(ha, hb, (x - a) / (b - a));
    }
    return PEAK[PEAK.length - 1][1];
  };
  const sig = (x) => 1 / (1 + Math.exp(-x));
  const nfrac = (h) => sig((175 - h) / 30); // N₂ chiếm ưu thế ở tầng thấp, O ở tầng cao
  // Hiệu suất phát xạ theo độ cao (dập tắt do va chạm ở tầng thấp)
  const LINES = [
    { id: 'O-557.7', g: 'green', eye: 1.0, rgb: [110, 255, 125], eff: (h) => sig((h - 99) / 3.2) * (1 - 0.72 * sig((h - 170) / 22)) },
    { id: 'O-630.0', g: 'red', eye: 0.75, rgb: [255, 58, 66], eff: (h) => 0.9 * sig((h - 178) / 16) },
    { id: 'O-636.4', g: 'red', eye: 0.75, rgb: [255, 52, 60], eff: (h) => 0.29 * sig((h - 178) / 16) },
    { id: 'N2p-427.8', g: 'violet', eye: 0.55, rgb: [125, 92, 255], eff: (h) => 0.62 * nfrac(h) },
    { id: 'N2p-391.4', g: 'violet', eye: 0.15, rgb: [150, 92, 255], eff: (h) => 1.0 * nfrac(h) },
  ];
  const GROUPS = {
    green: { name: 'xanh lục', sp: 'O', label: 'O · 557,7 nm', main: 'O-557.7', rgb: [110, 255, 125] },
    red: { name: 'đỏ', sp: 'O', label: 'O · 630,0 nm', main: 'O-630.0', rgb: [255, 70, 70] },
    violet: { name: 'tím-lam', sp: 'N2p', label: 'N₂⁺ · 427,8 / 391,4 nm', main: 'N2p-427.8', rgb: [140, 105, 255] },
  };

  const AU = (AL.SimAurora = {
    id: 'aurora',
    question: 'Vì sao cực quang có màu xanh lục, đỏ và tím?',
    s: 60, E: 3, flux: 0.5, view: 'section', opt: { layers: true, field: true, labels: true },
    wind: [], rain: [], glows: [], polar: [0, 0], wonA: false, wonB: false,
    stars: new AL.Stars(170, 11), W: 0, H: 0,
  });

  AU.init = function () { this.setE(this.s); };

  AU.setE = function (s) {
    this.s = s; this.E = 0.1 * Math.pow(300, s / 100);
    this.compute();
  };

  AU.compute = function () {
    const hp = (this.hp = peakAlt(this.E));
    const sl = 0.06 * hp, su = 0.2 * hp; // phía trên đỉnh trải dài hơn (tia cực quang vươn lên)
    const q = new Float32Array(N), em = LINES.map(() => new Float32Array(N)), tot = LINES.map(() => 0);
    let qs = 0;
    for (let i = 0; i < N; i++) {
      const h = ALT[i], z = (h - hp) / (h < hp ? sl : su);
      q[i] = Math.exp(-0.5 * z * z); qs += q[i];
      LINES.forEach((L, k) => { const v = q[i] * L.eff(h); em[k][i] = v; tot[k] += v; });
    }
    // phân bố độ cao dừng lại của hạt (để lấy mẫu)
    const cdf = new Float32Array(N); let acc = 0;
    for (let i = 0; i < N; i++) { acc += q[i] / qs; cdf[i] = acc; }
    this.cdf = cdf; this.em = em;
    // độ sáng cảm nhận theo độ cao
    const per = new Float32Array(N); let M = 0;
    for (let i = 0; i < N; i++) { let s = 0; LINES.forEach((L, k) => (s += em[k][i] * L.eye)); per[i] = s; if (s > M) M = s; }
    this.M = M;
    // màu theo độ cao: hàng 0 = trên cùng (AMAX)
    const rgb = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      // sắc màu: ưu tiên vạch trội (trọng số mũ 2) để màu không bị pha nhạt
      let r = 0, g = 0, b = 0, s = 0, sw = 0;
      LINES.forEach((L, k) => { const v = em[k][i] * L.eye, w = v * v; r += L.rgb[0] * w; g += L.rgb[1] * w; b += L.rgb[2] * w; sw += w; s += v; });
      const lum = 1 - Math.exp(-2.6 * (s / M));
      const row = N - 1 - i;
      rgb[row * 3] = sw ? (r / sw) * lum : 0; rgb[row * 3 + 1] = sw ? (g / sw) * lum : 0; rgb[row * 3 + 2] = sw ? (b / sw) * lum : 0;
    }
    this.rgb = rgb;
    const cv = this.prof || (this.prof = document.createElement('canvas'));
    cv.width = 1; cv.height = N;
    const cx = cv.getContext('2d'), img = cx.createImageData(1, N);
    for (let r = 0; r < N; r++) { img.data[r * 4] = rgb[r * 3]; img.data[r * 4 + 1] = rgb[r * 3 + 1]; img.data[r * 4 + 2] = rgb[r * 3 + 2]; img.data[r * 4 + 3] = 255; }
    cx.putImageData(img, 0, 0);
    // tổng theo từng vạch và theo nhóm màu
    const mx = Math.max(...tot);
    this.tot = tot.map((v) => v / mx);
    // mỗi nhóm màu: tổng cường độ + nơi nó "lộ" rõ nhất (mạnh và chiếm ưu thế)
    const gs = {};
    for (const gk in GROUPS) gs[gk] = { sum: 0, peak: 0, alt: 0 };
    for (let i = 0; i < N; i++) {
      const acc2 = {}; let all = 0;
      LINES.forEach((L, k) => { const v = em[k][i] * L.eye; acc2[L.g] = (acc2[L.g] || 0) + v; all += v; });
      for (const gk in acc2) {
        const v = acc2[gk], vis = all ? v * (v / all) ** 2 : 0;
        gs[gk].sum += v;
        if (vis > gs[gk].peak) { gs[gk].peak = vis; gs[gk].alt = ALT[i]; }
      }
    }
    this.groups = gs;
    this.dom = Object.keys(gs).reduce((a, b) => (gs[a].sum >= gs[b].sum ? a : b));
    this.ground = null;
    this.checkChallenge();
  };

  AU.sampleStop = function () {
    const r = Math.random(), c = this.cdf;
    let lo = 0, hi = N - 1;
    while (lo < hi) { const m = (lo + hi) >> 1; c[m] < r ? (lo = m + 1) : (hi = m); }
    return ALT[lo] + (Math.random() - 0.5) * STEP;
  };
  AU.colorAt = function (h) {
    const i = clamp(Math.round((h - AMIN) / STEP), 0, N - 1), row = N - 1 - i;
    return [this.rgb[row * 3], this.rgb[row * 3 + 1], this.rgb[row * 3 + 2]];
  };
  AU.lineAt = function (h) {
    const i = clamp(Math.round((h - AMIN) / STEP), 0, N - 1);
    let best = -1, bv = 0, tot = 0;
    LINES.forEach((L, k) => { const v = this.em[k][i] * L.eye; tot += v; if (v > bv) { bv = v; best = k; } });
    return tot < this.M * 0.04 ? null : LINES[best];
  };

  // ---------- Bố cục ----------
  AU.resize = function (w, h) { this.W = w; this.H = h; this.layout(); };
  AU.layout = function () {
    const w = this.W, h = this.H; if (!w) return;
    const wide = (this.wide = w >= h * 1.25);
    this.inset = wide ? { x: 0, y: 0, w: Math.round(w * 0.34), h } : { x: 0, y: 0, w, h: Math.round(h * 0.3) };
    this.col = wide ? { x: this.inset.w, y: 0, w: w - this.inset.w, h } : { x: 0, y: this.inset.h, w, h: h - this.inset.h };
    const C = this.col, right = wide ? 176 : 12;
    this.P = { x: C.x + 56, y: C.y + (wide ? 34 : 18), w: C.w - 56 - right, h: C.h - (wide ? 34 : 18) - 30 };
    this.ground = null;
    this.wind = []; this.rain = []; this.glows = [];
  };
  AU.yAlt = function (km) { const P = this.P; return P.y + P.h - (km / AXIS_TOP) * P.h; };
  AU.altY = function (y) { const P = this.P; return ((P.y + P.h - y) / P.h) * AXIS_TOP; };

  // Góc nhìn từ mặt đất: độ cao → góc ngẩng → vị trí trên trời
  const DIST = 280, ELMAX = (62 * Math.PI) / 180;
  AU.gGeom = function () {
    const C = this.col;
    return { yT: C.y + 12, yH: C.y + C.h * 0.8 };
  };
  AU.gY = function (km) { const { yT, yH } = this.gGeom(); return yH - (Math.atan(km / DIST) / ELMAX) * (yH - yT); };
  AU.gAlt = function (y) { const { yT, yH } = this.gGeom(); const el = ((yH - y) / (yH - yT)) * ELMAX; return el <= 0 ? -1 : DIST * Math.tan(el); };
  AU.buildGround = function () {
    const { yT, yH } = this.gGeom(), rows = Math.max(2, Math.round(yH - yT));
    const cv = this.gcv || (this.gcv = document.createElement('canvas'));
    cv.width = 1; cv.height = rows;
    const cx = cv.getContext('2d'), img = cx.createImageData(1, rows);
    for (let r = 0; r < rows; r++) {
      const hkm = this.gAlt(yT + r);
      let c = [0, 0, 0];
      if (hkm >= AMIN && hkm <= AMAX) c = this.colorAt(hkm);
      img.data[r * 4] = c[0]; img.data[r * 4 + 1] = c[1]; img.data[r * 4 + 2] = c[2]; img.data[r * 4 + 3] = 255;
    }
    cx.putImageData(img, 0, 0);
    this.ground = { rows };
  };

  // ---------- Cập nhật ----------
  AU.geo = function () {
    const I = this.inset, cy = I.y + I.h * 0.52;
    const re = clamp(Math.min(I.w, I.h) * 0.06, 8, 20);
    return { cy, rs: Math.min(I.h * 0.2, I.w * 0.22), ex: I.x + I.w * 0.66, ey: cy, re, r0: re * (4.6 - 1.7 * this.flux) };
  };
  const rmp = (r0, phi) => r0 * Math.pow(2 / (1 + Math.cos(Math.min(phi, 2.6))), 0.62);

  AU.update = function (dt, t) {
    if (!this.W) return;
    const G = this.geo(), I = this.inset, v = I.w * 0.32 + 40;
    // gió Mặt Trời
    if (this.wind.length < 170 && Math.random() < dt * (24 + 70 * this.flux)) {
      for (let n = 0; n < 2; n++) this.wind.push({ x: I.x + G.rs * 0.5, y: I.y + 8 + Math.random() * (I.h - 16), vy: (Math.random() - 0.5) * 8, st: 'wind', a: 0 });
    }
    for (const p of this.wind) {
      p.a = Math.min(1, p.a + dt * 3);
      if (p.st === 'wind' || p.st === 'tail') {
        p.x += v * dt; p.y += p.vy * dt;
        if (p.st === 'wind') {
          const dx = p.x - G.ex, dy = p.y - G.ey, r = Math.hypot(dx, dy), phi = Math.atan2(Math.abs(dy), -dx);
          if (r < rmp(G.r0, phi)) {
            const side = dy < 0 ? -1 : 1;
            if (Math.random() < 0.07 + 0.22 * this.flux && phi < 1.6) {
              p.st = 'funnel'; p.t = 0; p.side = side;
              p.p0 = [p.x, p.y]; p.p1 = [G.ex - G.re * 0.6, G.ey + side * G.re * 2.6]; p.p2 = [G.ex - G.re * 0.18, G.ey + side * G.re * 0.98];
            } else { p.st = 'slide'; p.phi = phi; p.side = side; }
          }
        }
      } else if (p.st === 'slide') {
        p.phi += (v / rmp(G.r0, p.phi)) * dt;
        const r = rmp(G.r0, p.phi);
        p.x = G.ex - r * Math.cos(p.phi); p.y = G.ey + p.side * r * Math.sin(p.phi);
        if (p.phi > 2.3) { p.st = 'tail'; p.vy = p.side * 6; }
      } else if (p.st === 'funnel') {
        p.t += dt / 0.9;
        const T = Math.min(1, p.t), u = 1 - T;
        p.x = u * u * p.p0[0] + 2 * u * T * p.p1[0] + T * T * p.p2[0];
        p.y = u * u * p.p0[1] + 2 * u * T * p.p1[1] + T * T * p.p2[1];
        if (T >= 1) { p.dead = true; this.polar[p.side < 0 ? 0 : 1] = 1; }
      }
      if (p.x > I.x + I.w + 4 || p.y < I.y - 10 || p.y > I.y + I.h + 10) p.dead = true;
    }
    this.wind = this.wind.filter((p) => !p.dead);
    this.polar = this.polar.map((x) => Math.max(0, x - dt * 1.5));

    // electron lao xuống khí quyển
    const P = this.P;
    if (this.view === 'section') {
      if (this.rain.length < 200 && Math.random() < dt * (30 + 110 * this.flux)) {
        for (let n = 0; n < 2; n++) this.rain.push({ u: Math.random(), h: AMAX + Math.random() * 20, stop: this.sampleStop(), v: 360 + Math.random() * 160, ph: Math.random() * 6 });
      }
      for (const p of this.rain) {
        p.h -= p.v * dt;
        if (p.h <= p.stop) { p.dead = true; this.glows.push({ x: this.rainX(p), y: this.yAlt(p.stop), c: this.colorAt(p.stop), t: 0 }); }
      }
      this.rain = this.rain.filter((p) => !p.dead);
    } else this.rain = [];
    for (const g of this.glows) g.t += dt;
    this.glows = this.glows.filter((g) => g.t < 0.6);
  };
  AU.rainX = function (p) { const P = this.P; return P.x + p.u * P.w * 0.92 + P.w * 0.04 + P.w * 0.05 * (1 - (p.h - AMIN) / (AMAX - AMIN)); };

  const fold = (x, t) => {
    const a = 0.5 + 0.5 * Math.sin(x * 0.011 + t * 0.33 + 1.6 * Math.sin(x * 0.0037 - t * 0.21));
    const r = 0.72 + 0.28 * Math.sin(x * 0.13 + t * 1.9) * Math.sin(x * 0.051 - t * 1.1);
    return (0.16 + 0.84 * a * a) * r;
  };
  AU.bright = function () { return 0.3 + 0.7 * this.flux; };

  // ---------- Vẽ ----------
  AU.draw = function (c, w, h, t) {
    c.fillStyle = '#020307'; c.fillRect(0, 0, w, h);
    this.drawInset(c, t);
    if (this.view === 'section') this.drawSection(c, t); else this.drawGround(c, t);
  };

  AU.drawInset = function (c, t) {
    const I = this.inset, G = this.geo();
    c.save(); c.beginPath(); c.rect(I.x, I.y, I.w, I.h); c.clip();
    this.stars.draw(c, I.x, I.y, I.w, I.h, t, 0.7);
    // Mặt Trời (chỉ thấy một phần ở mép trái)
    const sx = I.x - G.rs * 0.45, sy = G.cy;
    const sg = c.createRadialGradient(sx, sy, G.rs * 0.3, sx, sy, G.rs * 1.9);
    sg.addColorStop(0, 'rgba(255,248,220,1)'); sg.addColorStop(0.42, 'rgba(255,205,90,.95)'); sg.addColorStop(0.55, 'rgba(255,140,40,.32)'); sg.addColorStop(1, 'rgba(255,120,30,0)');
    c.fillStyle = sg; c.beginPath(); c.arc(sx, sy, G.rs * 1.9, 0, Math.PI * 2); c.fill();
    // Từ quyển: cung sốc và màng từ quyển
    c.lineWidth = 1;
    c.setLineDash([3, 5]); c.strokeStyle = 'rgba(255,200,140,.22)';
    c.beginPath();
    for (let phi = -2.3; phi <= 2.3; phi += 0.05) { const r = rmp(G.r0 * 1.38, Math.abs(phi)) * 1.05, x = G.ex - r * Math.cos(phi), y = G.ey + r * Math.sin(phi); phi === -2.3 ? c.moveTo(x, y) : c.lineTo(x, y); }
    c.stroke(); c.setLineDash([]);
    c.strokeStyle = 'rgba(140,190,255,.45)'; c.lineWidth = 1.4;
    c.beginPath();
    for (let phi = -2.35; phi <= 2.35; phi += 0.05) { const r = rmp(G.r0, Math.abs(phi)), x = G.ex - r * Math.cos(phi), y = G.ey + r * Math.sin(phi); phi === -2.35 ? c.moveTo(x, y) : c.lineTo(x, y); }
    c.stroke();
    // Đường sức từ dạng lưỡng cực
    c.strokeStyle = 'rgba(140,190,255,.2)'; c.lineWidth = 1;
    for (const L of [1.7, 2.5, 3.4]) for (const side of [-1, 1]) {
      c.beginPath();
      for (let th = 0.18; th <= Math.PI - 0.18; th += 0.04) {
        const r = L * G.re * Math.sin(th) ** 2, sc = side < 0 ? 0.8 : 1.5;
        const x = G.ex + side * r * Math.sin(th) * sc, y = G.ey - r * Math.cos(th);
        th === 0.18 ? c.moveTo(x, y) : c.lineTo(x, y);
      }
      c.stroke();
    }
    // hạt gió Mặt Trời
    for (const p of this.wind) {
      c.fillStyle = p.st === 'funnel' ? `rgba(150,255,170,${p.a})` : `rgba(255,214,150,${0.75 * p.a})`;
      c.fillRect(p.x - 1, p.y - 1, p.st === 'funnel' ? 2.6 : 2, p.st === 'funnel' ? 2.6 : 2);
    }
    // Trái Đất
    const eg = c.createRadialGradient(G.ex - G.re * 0.4, G.ey - G.re * 0.4, G.re * 0.1, G.ex, G.ey, G.re);
    eg.addColorStop(0, '#9fd3ff'); eg.addColorStop(0.55, '#2f6fd1'); eg.addColorStop(1, '#0b2257');
    c.fillStyle = eg; c.beginPath(); c.arc(G.ex, G.ey, G.re, 0, Math.PI * 2); c.fill();
    c.fillStyle = 'rgba(0,0,0,.45)'; c.beginPath(); c.arc(G.ex, G.ey, G.re, -Math.PI / 2, Math.PI / 2); c.fill();
    // vành cực quang ở hai cực
    const dc = GROUPS[this.dom].rgb;
    c.globalCompositeOperation = 'lighter';
    [-1, 1].forEach((side, k) => {
      const a = 0.35 + 0.4 * this.flux + 0.5 * this.polar[k];
      const py = G.ey + side * G.re * 0.96;
      const gg = c.createRadialGradient(G.ex, py, 0, G.ex, py, G.re * 0.9);
      gg.addColorStop(0, AL.rgba(dc, a)); gg.addColorStop(1, AL.rgba(dc, 0));
      c.fillStyle = gg; c.fillRect(G.ex - G.re, py - G.re, G.re * 2, G.re * 2);
    });
    c.globalCompositeOperation = 'source-over';
    // khung phóng to vùng cực
    const bx = G.ex - G.re * 0.7, by = G.ey - G.re * 1.55, bw = G.re * 1.4, bh = G.re * 0.9;
    c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 1; c.strokeRect(bx, by, bw, bh);
    c.restore();
    if (this.wide) {
      const C = this.col;
      c.setLineDash([3, 4]); c.strokeStyle = 'rgba(255,255,255,.16)';
      c.beginPath(); c.moveTo(bx + bw, by); c.lineTo(C.x, C.y + 8); c.moveTo(bx + bw, by + bh); c.lineTo(C.x, C.y + C.h - 8); c.stroke();
      c.setLineDash([]);
    }
    // nhãn
    if (this.opt.labels) {
      const f = `500 11px ${BODY}`;
      AL.tag(c, 'Mặt Trời', I.x + 10, this.wide ? I.y + I.h - 22 : I.y + I.h - 14, { font: f, color: '#ffd59a' });
      AL.tag(c, 'gió Mặt Trời →', I.x + Math.max(G.rs * 0.75, I.w * 0.2), G.cy - Math.min(I.h * 0.3, 90), { font: f, color: '#ffe0b8' });
      AL.tag(c, 'từ quyển', G.ex - G.r0 * 0.4, G.ey + G.r0 * 1.1 + 6, { font: f, color: '#a9cbff', align: 'center' });
      AL.tag(c, 'Trái Đất', G.ex + G.re + 6, G.ey, { font: f, color: '#cfe3ff' });
    }
    if (this.wide) { c.fillStyle = 'rgba(255,255,255,.07)'; c.fillRect(I.x + I.w - 1, 0, 1, I.h); }
    else { c.fillStyle = 'rgba(255,255,255,.07)'; c.fillRect(0, I.y + I.h - 1, I.w, 1); }
  };

  AU.drawSection = function (c, t) {
    const C = this.col, P = this.P, B = this.bright(), full = AL.store.state.mode === 'full';
    // nền khí quyển
    const sky = c.createLinearGradient(0, this.yAlt(0), 0, this.yAlt(AXIS_TOP));
    sky.addColorStop(0, '#0d1b3a'); sky.addColorStop(0.08, '#081229'); sky.addColorStop(0.25, '#040915'); sky.addColorStop(1, '#020307');
    c.fillStyle = sky; c.fillRect(C.x, C.y, C.w, C.h);
    this.stars.draw(c, P.x, P.y, P.w, (this.yAlt(110) - P.y), t, 0.35);

    // tầng khí quyển
    if (this.opt.layers) {
      const L = [[0, 12, 'Tầng đối lưu'], [12, 50, 'Bình lưu'], [50, 85, 'Trung lưu'], [85, AXIS_TOP, 'Nhiệt quyển']];
      c.font = `500 10.5px ${BODY}`; c.textAlign = 'left'; c.textBaseline = 'middle';
      L.forEach(([a, b, name], k) => {
        const ya = this.yAlt(a), yb = this.yAlt(b);
        if (k) { c.setLineDash([2, 5]); c.strokeStyle = 'rgba(160,190,240,.16)'; c.beginPath(); c.moveTo(P.x, ya); c.lineTo(P.x + P.w, ya); c.stroke(); c.setLineDash([]); }
        c.fillStyle = 'rgba(160,185,225,.5)';
        const y = k === 3 ? this.yAlt(360) : (ya + yb) / 2;
        c.fillText(name + (k === 3 ? ' (> 85 km)' : ''), P.x + 8, y);
      });
      if (full) {
        c.fillStyle = 'rgba(160,185,225,.45)'; c.font = `500 10px ${BODY}`;
        c.fillText('← N₂ chiếm ưu thế', P.x + 8, this.yAlt(118));
        c.fillText('← O chiếm ưu thế', P.x + 8, this.yAlt(270));
      }
    }
    // đường sức từ
    if (this.opt.field) {
      c.setLineDash([4, 6]); c.strokeStyle = 'rgba(140,190,255,.14)'; c.lineWidth = 1;
      for (let k = 0; k < 6; k++) {
        const x = P.x + P.w * (0.06 + k * 0.18);
        c.beginPath(); c.moveTo(x, this.yAlt(AMAX)); c.lineTo(x + P.w * 0.05, this.yAlt(AMIN)); c.stroke();
      }
      c.setLineDash([]);
      if (this.opt.labels) {
        c.save(); c.translate(P.x + P.w * 0.6 + 6, this.yAlt(395)); c.rotate(Math.atan2(this.yAlt(AMIN) - this.yAlt(AMAX), P.w * 0.05));
        c.font = `500 10px ${BODY}`; c.fillStyle = 'rgba(160,200,255,.5)'; c.textAlign = 'left'; c.fillText('đường sức từ', 0, -4); c.restore();
      }
    }

    // màn cực quang
    const yTop = this.yAlt(AMAX), yBot = this.yAlt(AMIN), sw = 3;
    c.save(); c.beginPath(); c.rect(P.x, P.y - 4, P.w, P.h + 4); c.clip();
    c.globalCompositeOperation = 'lighter';
    c.imageSmoothingEnabled = true;
    // lớp quầng mờ rộng
    for (let x = P.x; x < P.x + P.w; x += 12) {
      const u = (x - P.x) / P.w, edge = Math.min(1, u / 0.08, (1 - u) / 0.08);
      c.globalAlpha = Math.min(1, 0.32 * B * fold(x - P.x, t) * edge);
      c.drawImage(this.prof, 0, 0, 1, N, x - 6, yTop - 8, 24, yBot - yTop + 16);
    }
    // các tia sáng dọc theo đường sức từ
    for (let x = P.x; x < P.x + P.w; x += sw) {
      const u = (x - P.x) / P.w, edge = Math.min(1, u / 0.08, (1 - u) / 0.08);
      const ray = 0.55 + 0.45 * Math.sin(x * 0.31 + t * 2.4 + 2 * Math.sin(x * 0.045 - t * 0.7));
      const a = 1.5 * B * fold(x - P.x, t) * edge * ray;
      if (a < 0.01) continue;
      c.globalAlpha = Math.min(1, a);
      const dy = 4 * Math.sin(x * 0.02 + t * 0.6);
      c.drawImage(this.prof, 0, 0, 1, N, x, yTop + dy, sw + 0.6, yBot - yTop);
    }
    c.globalAlpha = 1;
    // electron đang lao xuống
    for (const p of this.rain) {
      const x = this.rainX(p) + Math.sin(p.h * 0.5 + p.ph) * 1.6, y = this.yAlt(p.h);
      c.fillStyle = 'rgba(200,230,255,.6)'; c.fillRect(x - 0.8, y - 0.8, 1.6, 1.6);
      c.fillStyle = 'rgba(200,230,255,.12)'; c.fillRect(x - 0.5, y - 8, 1, 7);
    }
    for (const g of this.glows) {
      const a = (1 - g.t / 0.6) * 0.55, r = 3 + g.t * 9;
      const gr = c.createRadialGradient(g.x, g.y, 0, g.x, g.y, r);
      gr.addColorStop(0, AL.rgba([Math.min(255, g.c[0] + 90), Math.min(255, g.c[1] + 90), Math.min(255, g.c[2] + 90)], a)); gr.addColorStop(1, AL.rgba(g.c, 0));
      c.fillStyle = gr; c.fillRect(g.x - r, g.y - r, r * 2, r * 2);
    }
    c.globalCompositeOperation = 'source-over';
    c.restore();

    // mặt đất
    const yG = this.yAlt(0);
    c.fillStyle = '#04060b'; c.fillRect(C.x, yG, C.w, C.y + C.h - yG);
    c.fillStyle = 'rgba(120,150,200,.25)'; c.fillRect(C.x, yG, C.w, 1);
    c.font = `500 10.5px ${BODY}`; c.fillStyle = 'rgba(170,185,210,.55)'; c.textAlign = 'left'; c.textBaseline = 'middle';
    c.fillText('Mặt đất · vùng cực', P.x + 8, yG + 13);

    // trục độ cao
    c.strokeStyle = 'rgba(255,255,255,.2)'; c.beginPath(); c.moveTo(P.x - 0.5, P.y); c.lineTo(P.x - 0.5, yG); c.stroke();
    c.font = `500 10.5px ${MONO}`; c.textAlign = 'right';
    for (let km = 0; km <= 400; km += 50) {
      const y = this.yAlt(km);
      if (Math.abs(y - this.yAlt(this.hp)) < 9) continue;
      c.fillStyle = 'rgba(255,255,255,.25)'; c.fillRect(P.x - 5, y, 5, 1);
      c.fillStyle = 'rgba(190,200,215,.65)'; c.fillText(km, P.x - 9, y);
    }
    c.fillStyle = 'rgba(190,200,215,.5)'; c.fillText('km', P.x - 9, P.y - 10);
    // đỉnh phát sáng (màu cam, liên kết với thanh trượt)
    const yp = this.yAlt(this.hp);
    c.fillStyle = ORANGE;
    c.beginPath(); c.moveTo(P.x - 1, yp); c.lineTo(P.x - 9, yp - 5); c.lineTo(P.x - 9, yp + 5); c.fill();
    c.font = `700 10.5px ${MONO}`; c.fillText(Math.round(this.hp), P.x - 12, yp);
    c.setLineDash([2, 4]); c.strokeStyle = 'rgba(255,138,43,.35)';
    c.beginPath(); c.moveTo(P.x, yp); c.lineTo(P.x + P.w, yp); c.stroke(); c.setLineDash([]);

    // mốc tham chiếu
    if (this.opt.labels) {
      const ix = P.x + P.w * (this.wide ? 0.8 : 0.55), iy = this.yAlt(408);
      c.fillStyle = 'rgba(220,230,245,.85)'; c.fillRect(ix - 3, iy - 2, 6, 4);
      c.fillStyle = 'rgba(120,170,255,.8)'; c.fillRect(ix - 14, iy - 1.5, 9, 3); c.fillRect(ix + 5, iy - 1.5, 9, 3);
      c.font = `500 10px ${BODY}`; c.textAlign = 'left'; c.fillStyle = 'rgba(200,210,225,.6)'; c.fillText('Trạm ISS ~ 410 km', ix + 18, iy);
      const px = P.x + P.w * 0.3, py = this.yAlt(11);
      c.fillStyle = 'rgba(200,210,225,.65)';
      c.beginPath(); c.moveTo(px + 9, py); c.lineTo(px - 7, py - 3); c.lineTo(px - 7, py + 3); c.fill();
      c.fillText('máy bay ~ 10 km', px + 14, py);
      this.drawLabels(c, (km) => this.yAlt(km), this.wide ? P.x + P.w + 14 : P.x + P.w - 6, !this.wide);
    }
  };

  AU.drawLabels = function (c, yFor, x, inside) {
    const gs = this.groups, M = this.M, items = [];
    for (const gk in gs) {
      const g = gs[gk], s = g.peak / M;
      if (s < 0.07) continue;
      items.push({ gk, y: yFor(g.alt), alt: g.alt, s });
    }
    items.sort((a, b) => a.y - b.y);
    for (let i = 1; i < items.length; i++) if (items[i].y - items[i - 1].y < 40) items[i].y = items[i - 1].y + 40;
    for (const it of items) {
      const G = GROUPS[it.gk], col = AL.rgba(G.rgb, 0.95), a = clamp(0.4 + it.s, 0.5, 1);
      c.globalAlpha = a;
      if (!inside) {
        c.strokeStyle = AL.rgba(G.rgb, 0.45); c.lineWidth = 1;
        c.beginPath(); c.moveTo(x - 12, yFor(it.alt)); c.lineTo(x - 2, it.y); c.stroke();
      }
      const al = inside ? 'right' : 'left';
      AL.tag(c, `${G.label}`, x, it.y - 10, { color: col, font: `700 11.5px ${MONO}`, align: al, border: AL.rgba(G.rgb, 0.25) });
      AL.tag(c, `${G.name} · ≈ ${Math.round(it.alt)} km`, x, it.y + 11, { color: '#dfe6f0', font: `500 11px ${BODY}`, align: al });
      c.globalAlpha = 1;
    }
  };

  AU.drawGround = function (c, t) {
    const C = this.col, { yT, yH } = this.gGeom(), B = this.bright();
    if (!this.ground) this.buildGround();
    const sky = c.createLinearGradient(0, C.y, 0, yH);
    sky.addColorStop(0, '#020307'); sky.addColorStop(0.75, '#06102a'); sky.addColorStop(1, '#0f1d40');
    c.fillStyle = sky; c.fillRect(C.x, C.y, C.w, yH - C.y);
    this.stars.draw(c, C.x, C.y, C.w, yH - C.y, t, 0.85);
    c.save(); c.beginPath(); c.rect(C.x, C.y, C.w, yH - C.y); c.clip();
    c.globalCompositeOperation = 'lighter';
    const sw = 3, rows = this.ground.rows;
    for (let x = C.x; x < C.x + C.w; x += sw) {
      const u = (x - C.x) / C.w, edge = Math.min(1, u / 0.05, (1 - u) / 0.05);
      const a = B * fold((x - C.x) * 0.8 + 40, t * 0.8) * edge * 1.1;
      if (a < 0.01) continue;
      const dy = 12 * Math.sin(x * 0.006 + t * 0.25) + 6 * Math.sin(x * 0.017 - t * 0.5);
      c.globalAlpha = Math.min(1, a);
      c.drawImage(this.gcv, 0, 0, 1, rows, x, yT + dy, sw + 0.6, rows);
    }
    c.globalAlpha = 1;
    // ánh phản chiếu nhẹ phía chân trời
    const dc = GROUPS[this.dom].rgb, hg = c.createLinearGradient(0, yH - 70, 0, yH);
    hg.addColorStop(0, AL.rgba(dc, 0)); hg.addColorStop(1, AL.rgba(dc, 0.12 * B));
    c.fillStyle = hg; c.fillRect(C.x, yH - 70, C.w, 70);
    c.globalCompositeOperation = 'source-over';
    c.restore();
    // núi và rừng thông
    const r = AL.rng(5);
    c.fillStyle = '#03050a';
    c.beginPath(); c.moveTo(C.x, yH);
    for (let x = C.x; x <= C.x + C.w + 20; x += 20) c.lineTo(x, yH - 10 - 26 * (0.5 + 0.5 * Math.sin(x * 0.011)) * (0.6 + 0.4 * Math.sin(x * 0.0043 + 1)));
    c.lineTo(C.x + C.w, C.y + C.h); c.lineTo(C.x, C.y + C.h); c.fill();
    for (let x = C.x + 4; x < C.x + C.w; x += 7 + r() * 9) {
      const th = 10 + r() * 22, y = yH + 4 + r() * 6;
      c.beginPath(); c.moveTo(x, y - th); c.lineTo(x - th * 0.28, y); c.lineTo(x + th * 0.28, y); c.fill();
    }
    c.fillRect(C.x, yH + 8, C.w, C.y + C.h - yH - 8);
    c.font = `500 11px ${BODY}`; c.fillStyle = 'rgba(170,185,210,.55)'; c.textAlign = 'left'; c.textBaseline = 'middle';
    c.fillText('Nhìn về phía cực · màn cực quang cách ~ 300 km', C.x + 14, C.y + C.h - 14);
    if (this.opt.labels) this.drawLabels(c, (km) => this.gY(km), C.x + C.w - 14, true);
  };

  // ---------- Tương tác ----------
  AU.pointer = function (type, x, y) {
    const inCol = x >= this.col.x && y >= this.col.y;
    let km = -1;
    if (inCol) km = this.view === 'section' ? (x >= this.P.x && x <= this.P.x + this.P.w ? this.altY(y) : -1) : this.gAlt(y);
    if (type === 'move') AL.app.cursor(km >= AMIN && km <= AMAX ? 'pointer' : 'default');
    if (type !== 'down' || km < 0) return;
    if (km < AMIN || km > AMAX) { AL.app.hint(`Ở ${Math.max(0, Math.round(km))} km gần như không có cực quang`); return; }
    const L = this.lineAt(km);
    if (!L) { AL.app.hint(`Ở ${Math.round(km)} km gần như không phát sáng với năng lượng này`); return; }
    const info = D.line(L.id);
    AL.store.set({ el: info.sp, line: L.id });
  };

  AU.spectrum = function () {
    const B = 0.35 + 0.65 * this.flux;
    return {
      lines: LINES.map((L, k) => ({ id: L.id, nm: D.line(L.id).nm, I: this.tot[k] * B })),
      refs: AL.store.state.mode === 'full' ? LINES.map((L) => ({ id: L.id, nm: D.line(L.id).nm })) : [],
      empty: '',
    };
  };

  AU.kp = function () { return Math.round(1 + 8 * this.flux); };
  AU.windName = function () { const f = this.flux; return f < 0.2 ? 'yên tĩnh' : f < 0.5 ? 'hoạt động nhẹ' : f < 0.75 ? 'bão từ' : 'bão từ mạnh'; };

  AU.status = function () {
    const G = GROUPS[this.dom], sel = AL.store.state.line, info = sel && D.line(sel);
    const peak = `Đỉnh ≈ ${Math.round(this.hp)} km · màu chủ đạo: <b style="color:${AL.rgba(G.rgb, 1)}">${G.name}</b>`;
    if (info && info.aurora) AL.app.status(AL.app.readout(sel, `${(D.sp(info.sp) || {}).sym} · ${info.alt}`), peak);
    else AL.app.status(`Đỉnh phát sáng ≈ <span class="rk">${Math.round(this.hp)} km</span> · <span style="color:${AL.rgba(G.rgb, 1)}">${G.label}</span><span class="rs">E ≈ ${fmt(this.E, this.E < 1 ? 2 : 1)} keV · Kp ≈ ${this.kp()}</span>`,
      'Kéo thanh trượt năng lượng · bấm vào dải sáng để xem vạch');
  };

  AU.explainHTML = function () {
    const T = AL.term, d = this.dom;
    const p = {
      red: `Hạt năng lượng thấp dừng lại ở trên cao (> 200 km), nơi không khí rất loãng. Nguyên tử O ở ${T('trạng thái giả bền', 'meta')} ¹D có đủ thời gian (~110 s) để phát vạch <b style="color:#ff6b6b">đỏ 630 nm</b> trước khi bị va chạm.`,
      green: `Hạt dừng ở khoảng 100–150 km. Tại đây O phát vạch <b style="color:#7dff8a">xanh lục 557,7 nm</b>, màu cực quang phổ biến nhất. Vạch đỏ gần như bị ${T('dập tắt', 'quench')} vì ở độ cao này va chạm quá nhiều.`,
      violet: `Hạt năng lượng rất cao xuyên sâu xuống ~90–100 km, nơi N₂ chiếm ưu thế. Ion N₂⁺ phát vạch <b style="color:#a993ff">tím-lam 391,4 / 427,8 nm</b>; vạch xanh lục của O cũng bị dập tắt ở độ sâu này.`,
    }[d];
    const more = AL.store.state.mode === 'full'
      ? `<p class="muted">${T('Gió Mặt Trời', 'solarwind')} mang hạt mang điện tới Trái Đất; ${T('từ quyển', 'magnetosphere')} dẫn chúng theo ${T('đường sức từ', 'fieldline')} xuống hai vùng cực, vào ${T('nhiệt quyển', 'thermosphere')}.</p>` : '';
    return `<p>${p}</p>${more}<div class="formula">năng lượng hạt ↑ <span>→ dải sáng xuống thấp, đổi màu</span></div>`;
  };
  AU.updateExplain = function () { if (this.explainEl) this.explainEl.innerHTML = this.explainHTML(); };

  AU.panel = function () {
    const ui = AL.ui, full = AL.store.state.mode === 'full', T = AL.term;
    const hTxt = () => `Hạt dừng lại, phát sáng mạnh nhất ở ≈ <b>${Math.round(this.hp)} km</b>`;
    const kTxt = () => `Kp ≈ ${this.kp()} · ${this.windName()}`;
    const eS = ui.slider({ value: this.s, label: 'Năng lượng mỗi hạt', valueText: this.eTxt(), ends: ['thấp · 0,1 keV', '30 keV · cao'],
      onInput: (v) => { this.setE(v); this.afterChange(eS); } });
    const hNote = full ? ui.note(hTxt()) : null; // Cơ bản: độ cao đỉnh đã hiện trên hình và thanh trạng thái
    this.eSliders = [eS]; this.hNote = hNote && (() => (hNote.innerHTML = hTxt()));
    const fS = ui.slider({ value: this.flux * 100, label: 'Cường độ', valueText: kTxt(), ends: ['yên tĩnh', 'bão từ'],
      onInput: (v) => { this.flux = v / 100; fS.setValue(kTxt()); this.afterChange(); } });
    const exp = ui.explain('Vì sao lại là màu này?', this.explainHTML(), 'quench');
    this.explainEl = exp.body;
    const chart = full ? this.chartEl() : null;
    return [
      ui.step(1, 'Năng lượng hạt', null, eS, hNote),
      ui.step(2, 'Gió Mặt Trời', null, fS, full ? ui.note(`Gió mạnh → nhiều hạt hơn → cực quang sáng hơn, ${T('chỉ số Kp', 'kp')} tăng; từ quyển bị ép sát Trái Đất hơn.`) : null),
      ui.step(3, 'Hiện trên mô phỏng', null,
        ui.seg([['section', 'Mặt cắt khí quyển'], ['ground', 'Từ mặt đất']], this.view, (v) => { this.view = v; this.ground = null; this.status(); }),
        ui.check('Tầng khí quyển', this.opt.layers, (v) => (this.opt.layers = v)),
        ui.check('Đường sức từ', this.opt.field, (v) => (this.opt.field = v)),
        ui.check('Nhãn trên hình', this.opt.labels, (v) => (this.opt.labels = v))),
      exp,
      full ? ui.block('Cường độ phát xạ theo độ cao', chart) : null,
      full ? ui.block('Bảng vạch cực quang', this.table(), ui.note('Độ cao là giá trị điển hình, phụ thuộc phổ năng lượng của dòng hạt và mật độ khí quyển tầng cao.')) : null,
    ];
  };

  AU.eTxt = function () { return `${fmt(this.E, this.E < 1 ? 2 : 1)} keV`; };
  AU.afterChange = function () {
    for (const s of (this.eSliders || []).concat(this.peekSlider || [])) if (s.isConnected) s.sync(this.s, this.eTxt());
    if (this.hNote) this.hNote();
    this.status(); this.updateExplain(); this.drawChart();
    AL.app.accent(); AL.app.renderChallenge();
  };

  AU.table = function () {
    const rows = [
      ['O-557.7', 'O ¹S → ¹D', '≈ 100–150 km', '0,74 s'],
      ['O-630.0', 'O ¹D → ³P', '> 200 km', '≈ 110 s'],
      ['N2p-427.8', 'N₂⁺ B → X', '≈ 90–110 km', '≈ 60 ns'],
      ['N2p-391.4', 'N₂⁺ B → X', '≈ 90–110 km', '≈ 60 ns'],
    ].map(([id, tr, alt, tau]) => {
      const nm = D.line(id).nm;
      return { key: id, cells: [`<span class="sw" style="background:${AL.nmCSS(nm)}"></span>${fmt(nm, 1)} nm`, tr, alt, tau], click: () => AL.store.set({ el: D.line(id).sp, line: AL.store.state.line === id ? null : id }) };
    });
    return AL.ui.table(['Vạch', 'Chuyển mức', 'Độ cao', 'τ'], rows, AL.store.state.line);
  };

  AU.chartEl = function () {
    const cv = AL.h('canvas', { class: 'mini-chart', 'aria-label': 'Biểu đồ cường độ phát xạ theo độ cao' });
    this.chartCv = cv;
    requestAnimationFrame(() => this.drawChart());
    return cv;
  };
  AU.drawChart = function () {
    const cv = this.chartCv; if (!cv || !cv.isConnected) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1), w = cv.clientWidth, h = cv.clientHeight;
    cv.width = w * dpr; cv.height = h * dpr;
    const c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0);
    const L = 34, R = 8, T = 8, Bm = 18, pw = w - L - R, ph = h - T - Bm;
    c.clearRect(0, 0, w, h);
    c.font = `500 10px ${MONO}`; c.fillStyle = 'rgba(190,200,215,.6)'; c.textAlign = 'right'; c.textBaseline = 'middle';
    for (let km = 100; km <= 400; km += 100) {
      const y = T + ph - ((km - AMIN) / (AMAX - AMIN)) * ph;
      c.fillText(km, L - 6, y); c.fillStyle = 'rgba(255,255,255,.06)'; c.fillRect(L, y, pw, 1); c.fillStyle = 'rgba(190,200,215,.6)';
    }
    c.textAlign = 'left'; c.textBaseline = 'top'; c.fillText('km', 2, 0);
    c.textAlign = 'right'; c.fillText('cường độ →', w - R, h - 13);
    const curves = {};
    for (const gk in GROUPS) curves[gk] = new Float32Array(N);
    LINES.forEach((Ln, k) => { for (let i = 0; i < N; i++) curves[Ln.g][i] += this.em[k][i] * Ln.eye; });
    const M = this.M;
    for (const gk of ['red', 'green', 'violet']) {
      const cu = curves[gk], col = GROUPS[gk].rgb;
      c.beginPath(); c.moveTo(L, T + ph);
      for (let i = 0; i < N; i++) c.lineTo(L + (cu[i] / M) * pw, T + ph - (i / (N - 1)) * ph);
      c.lineTo(L, T); c.closePath();
      c.fillStyle = AL.rgba(col, 0.16); c.fill();
      c.beginPath();
      for (let i = 0; i < N; i++) { const x = L + (cu[i] / M) * pw, y = T + ph - (i / (N - 1)) * ph; i ? c.lineTo(x, y) : c.moveTo(x, y); }
      c.strokeStyle = AL.rgba(col, 0.95); c.lineWidth = 1.6; c.stroke();
    }
    const yp = T + ph - ((this.hp - AMIN) / (AMAX - AMIN)) * ph;
    c.setLineDash([2, 3]); c.strokeStyle = 'rgba(255,138,43,.6)'; c.beginPath(); c.moveTo(L, yp); c.lineTo(L + pw, yp); c.stroke(); c.setLineDash([]);
  };

  // ---------- Thử thách ----------
  AU.checkChallenge = function () {
    if (!this.wonA && this.dom === 'red') { this.wonA = true; AL.app && AL.app.win('Chuẩn rồi! Hạt năng lượng thấp dừng ở trên cao, nơi oxygen phát vạch đỏ 630 nm.'); }
    else if (this.wonA && !this.wonB && this.hp < 100) { this.wonB = true; AL.app && AL.app.win('Xuất sắc! Dải sáng xuống dưới 100 km, nơi N₂⁺ phát màu tím-lam.'); }
  };
  AU.challenge = function () {
    if (!this.wonA) return { text: 'Làm cho cực quang chuyển sang màu đỏ', prog: null, done: false };
    if (!this.wonB) return { text: 'Kéo dải sáng xuống dưới 100 km', prog: '1/2', done: false };
    return { text: 'Đã hoàn thành cả hai thử thách cực quang', prog: '2/2', done: true };
  };

  AU.onState = function (s, ch) { if (ch.line || ch.el) this.status(); return ch.mode || ch.line; };
  AU.enter = function () { this.status(); };
  AU.leave = function () {};
  AU.primary = function () { this.view = this.view === 'section' ? 'ground' : 'section'; this.ground = null; AL.app.refreshPanel(); this.status(); };
  AU.accent = function () {
    const sel = AL.store.state.line, info = sel && D.line(sel);
    if (info && info.aurora) return GROUPS[LINES.find((l) => l.id === sel).g].rgb;
    return GROUPS[this.dom].rgb;
  };
  AU.reset = function () {
    this.view = 'section'; this.opt = { layers: true, field: true, labels: true }; this.flux = 0.5;
    this.wonA = false; this.wonB = false; this.setE(60); this.layout();
  };
  AU.peek = function () {
    const ui = AL.ui;
    const s = ui.slider({ value: this.s, label: 'Năng lượng hạt', valueText: this.eTxt(),
      onInput: (v) => { this.setE(v); this.afterChange(); } });
    s.classList.add('compact');
    this.peekSlider = s;
    return [s];
  };
})();
