/* Aurora-LAB — Mô phỏng 3: NGỌN LỬA → KÍNH PHÂN QUANG
 * Câu hỏi: Làm sao nhận ra nguyên tố chỉ từ ánh sáng của nó?
 * Thả muối kim loại vào lửa → lửa đổi màu → đưa kính phân quang vào tia sáng →
 * màu lửa tách thành các vạch riêng lẻ ("dấu vân tay ánh sáng"). */
(function () {
  'use strict';
  const AL = window.AL, D = AL.DATA, { fmt, clamp, lerp, ease } = AL;
  const ORDER = D.FLAME_ORDER;
  const MONO = '"JetBrains Mono", ui-monospace, monospace';
  const BODY = '"Be Vietnam Pro", system-ui, sans-serif';
  const DISP = '"Chakra Petch", system-ui, sans-serif';
  const FUEL_RGB = [80, 125, 255];

  const HINTS = [
    [['Li', 'Sr'], 'Li và Sr đều cho lửa đỏ. Li có MỘT vạch đỏ 670,8 nm gần như đứng một mình; Sr có dải đỏ rộng 640–690 nm kèm vạch lam 460,7 nm.'],
    [['Ca', 'Sr'], 'Ca đỏ gạch có dải rộng ~622 nm và ~554 nm; Sr có dải đỏ sâu hơn, 640–690 nm.'],
    [['Ba', 'Cu'], 'Ba và Cu đều xanh lục. Cu có thêm một dải lam rộng quanh 435 nm; Ba thì không.'],
    [['Ca', 'Na'], 'Na chỉ có vạch đôi vàng 589 nm, còn Ca có hai dải rộng ở 554 và 622 nm.'],
  ];

  const F = (AL.SimFlame = {
    id: 'flame',
    question: 'Làm sao nhận ra nguyên tố chỉ từ ánh sáng của nó?',
    salt: null, pending: 'Na', loopT: 0, m: 0,
    scope: { x: 0, y: 0, on: false, drag: false, p: 0, dx: 0, dy: 0 },
    opt: { rays: true, scale: true, names: true },
    parts: [], sprites: new Map(), myst: null, lastMyst: null, score: 0, won: false, refHover: null,
    W: 0, H: 0, stars: new AL.Stars(80, 23),
  });

  F.init = function () {};

  // ---------- Bố cục ----------
  F.resize = function (w, h) {
    const first = !this.W;
    this.W = w; this.H = h; this.layout();
    const t = this.scope.on ? this.slot : this.dock;
    if (first || !this.scope.drag) { this.scope.x = t.x; this.scope.y = t.y; }
    this.parts = [];
  };
  F.layout = function () {
    const w = this.W, h = this.H, wide = (this.wide = w >= h * 1.1);
    if (wide) {
      this.bx = w * 0.2; this.mouth = h * 0.74; this.fh = h * 0.46;
      this.scr = { x0: w * 0.5, x1: w * 0.975, y0: h * 0.09, y1: h * 0.56 };
      this.slot = { x: w * 0.43, y: this.mouth - this.fh * 0.42 };
      this.dock = { x: w * 0.43, y: h * 0.86 };
    } else {
      this.bx = w * 0.3; this.mouth = h * 0.86; this.fh = h * 0.34;
      const y0 = Math.max(h * 0.17, 116); // dưới ô "Câu hỏi"
      this.scr = { x0: w * 0.04, x1: w * 0.96, y0, y1: y0 + h * 0.3 };
      this.slot = { x: w * 0.66, y: this.mouth - this.fh * 0.42 };
      this.dock = { x: w * 0.84, y: h * 0.9 };
    }
    this.tableY = this.mouth + h * (wide ? 0.13 : 0.06); // mặt bàn thí nghiệm
    this.ps = clamp(Math.min(w, h) * 0.11, 42, 72); // cạnh lăng kính
    this.fw = clamp(this.fh * 0.26, 24, 76);
  };
  F.sx = function (nm) { const s = this.scr, pad = 14; return s.x0 + pad + ((nm - 380) / 400) * (s.x1 - s.x0 - pad * 2); };

  // ---------- Muối & màu lửa ----------
  F.cur = function () { return this.salt ? D.flame[this.salt] : null; };
  F.flameRGB = function () {
    const f = this.cur();
    return f ? AL.mixRGB(FUEL_RGB, AL.hexRGB(f.glow), this.m) : FUEL_RGB;
  };
  F.choose = function (id) {
    if (this.myst) return this.guess(id);
    this.pending = id;
    if (id && D.species[id]) AL.store.set({ el: id, line: null });
    AL.app.refreshPanel();
  };

  F.sprite = function (rgb) {
    const key = rgb.map((v) => v | 0).join(',');
    let s = this.sprites.get(key);
    if (!s) {
      if (this.sprites.size > 40) this.sprites.clear();
      s = document.createElement('canvas'); s.width = s.height = 64;
      const c = s.getContext('2d'), g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
      g.addColorStop(0, `rgba(${key},1)`); g.addColorStop(0.4, `rgba(${key},.45)`); g.addColorStop(1, `rgba(${key},0)`);
      c.fillStyle = g; c.fillRect(0, 0, 64, 64);
      this.sprites.set(key, s);
    }
    return s;
  };

  // ---------- Cập nhật ----------
  F.update = function (dt, t) {
    if (!this.W) return;
    // đổi muối: rút que ra → thay muối → đưa vào → lửa đổi màu
    if (this.pending !== this.salt) {
      this.loopT = Math.max(0, this.loopT - dt * 3); this.m = Math.max(0, this.m - dt * 3);
      if (this.loopT <= 0 && this.m <= 0) { this.salt = this.pending; this.status(); this.updateExplain(); }
    } else if (this.salt) {
      this.loopT = Math.min(1, this.loopT + dt * 2.4);
      if (this.loopT >= 1) this.m = Math.min(1, this.m + dt * 1.4);
    }
    // kính phân quang
    const S = this.scope;
    if (!S.drag) {
      const tg = S.on ? this.slot : this.dock, k = Math.min(1, dt * 9);
      S.x += (tg.x - S.x) * k; S.y += (tg.y - S.y) * k;
    }
    const inSlot = S.on && Math.hypot(S.x - this.slot.x, S.y - this.slot.y) < 6;
    S.p = clamp(S.p + (inSlot ? dt / 0.6 : -dt / 0.25), 0, 1);

    // hạt lửa
    const f = this.cur(), bright = f ? lerp(0.6, f.bright, this.m) : 0.6;
    const rate = 240, n = Math.min(12, Math.round(rate * dt + Math.random()));
    for (let i = 0; i < n && this.parts.length < 340; i++) {
      this.parts.push({ x: this.bx + (Math.random() - 0.5) * this.fw * 0.7, y: this.mouth, vx: (Math.random() - 0.5) * 14, vy: -(this.fh * (1.2 + Math.random() * 0.9)), t: 0, life: 0.45 + Math.random() * 0.45, s: this.fw * (0.55 + Math.random() * 0.5), sp: Math.random() < 0.05 * this.m });
    }
    for (const p of this.parts) {
      p.t += dt; p.vy -= this.fh * 0.6 * dt;
      p.vx += ((this.bx - p.x) * 2.2 + Math.sin(t * 7 + p.y * 0.05) * 20) * dt;
      p.x += p.vx * dt; p.y += p.vy * dt * 0.5;
    }
    this.parts = this.parts.filter((p) => p.t < p.life);
    this.bright = bright;
  };

  // ---------- Vẽ ----------
  F.draw = function (c, w, h, t) {
    c.fillStyle = '#030408'; c.fillRect(0, 0, w, h);
    this.stars.draw(c, 0, 0, w, h * 0.5, t, 0.25);
    const col = this.flameRGB(), S = this.scope, f = this.cur(), m = this.m;
    // bàn thí nghiệm
    const table = this.tableY;
    const tg = c.createLinearGradient(0, table, 0, h);
    tg.addColorStop(0, '#0d1018'); tg.addColorStop(1, '#05060a');
    c.fillStyle = tg; c.fillRect(0, table, w, h - table);
    c.fillStyle = 'rgba(255,255,255,.06)'; c.fillRect(0, table, w, 1);
    // quầng sáng lửa
    const fc = this.mouth - this.fh * 0.42;
    const halo = c.createRadialGradient(this.bx, fc, 0, this.bx, fc, this.fh * 1.6);
    halo.addColorStop(0, AL.rgba(col, 0.2 * this.bright)); halo.addColorStop(1, AL.rgba(col, 0));
    c.fillStyle = halo; c.fillRect(0, 0, w, h);

    // tia sáng vào kính
    if (S.p > 0) {
      const p = ease.out(S.p), x0 = this.bx + this.fw * 0.3, x1 = lerp(x0, S.x - this.ps * 0.28, p), y = S.y;
      c.globalCompositeOperation = 'lighter';
      const bg = c.createLinearGradient(0, y - 7, 0, y + 7);
      bg.addColorStop(0, AL.rgba(col, 0)); bg.addColorStop(0.5, AL.rgba(col, 0.45 * this.bright)); bg.addColorStop(1, AL.rgba(col, 0));
      c.fillStyle = bg; c.fillRect(x0, y - 7, x1 - x0, 14);
      c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(x0, y - 0.6, x1 - x0, 1.2);
      c.globalCompositeOperation = 'source-over';
    } else if (!S.drag) {
      c.setLineDash([3, 6]); c.strokeStyle = 'rgba(255,255,255,.12)';
      c.beginPath(); c.moveTo(this.bx + this.fw * 0.4, this.slot.y); c.lineTo(this.slot.x - this.ps * 0.6, this.slot.y); c.stroke();
      c.setLineDash([]);
    }
    if (!S.on || S.drag) this.prismPath(c, this.slot.x, this.slot.y, 1, true);

    this.drawBurner(c);
    this.drawFlame(c, t, col);
    this.drawLoop(c, t);
    this.drawScreen(c, t);
    this.drawRays(c);
    this.prismPath(c, S.x, S.y, 1, false);

    // nhãn
    if (this.opt.names) {
      const label = this.salt ? (this.myst ? '?' : f.salt) : 'chưa có muối';
      const sub = this.salt && m > 0.5 ? (this.myst ? 'mẫu chưa biết' : `lửa ${f.look}`) : 'lửa đèn khí · xanh lam nhạt';
      const lc = this.myst ? '#ffb066' : this.salt ? AL.rgba(col, 1) : '#9db4ff';
      if (this.wide) {
        AL.tag(c, label, this.bx, table + 22, { align: 'center', font: `700 13px ${DISP}`, color: lc });
        AL.tag(c, sub, this.bx, table + 44, { align: 'center', font: `500 11px ${BODY}`, color: '#c9d2df' });
      } else {
        // màn hẹp: gộp một nhãn dưới mặt bàn, căn trái để không tràn mép
        AL.tag(c, `${label} · ${sub}`, 10, table + 20, { font: `600 11.5px ${BODY}`, color: lc });
      }
      if (!S.on && !S.drag) {
        AL.tag(c, 'kính phân quang · kéo lên tia sáng', S.x, S.y + this.ps * 0.62, { align: 'center', font: `500 11px ${BODY}`, color: '#ffd2a8', border: 'rgba(255,138,43,.35)' });
        AL.tag(c, 'đặt kính vào đây', this.slot.x, this.slot.y + this.ps * 0.6, { align: 'center', font: `500 10.5px ${BODY}`, color: 'rgba(210,220,235,.6)', bg: 'rgba(6,8,13,.5)' });
      }
    }
  };

  F.drawBurner = function (c) {
    const bx = this.bx, top = this.mouth, bw = this.fw * 0.42, base = this.tableY;
    const g = c.createLinearGradient(bx - bw, 0, bx + bw, 0);
    g.addColorStop(0, '#3a414f'); g.addColorStop(0.45, '#aab3c2'); g.addColorStop(1, '#2a303b');
    c.fillStyle = g; c.fillRect(bx - bw / 2, top, bw, base - top - 8);
    c.fillStyle = '#20252f'; c.beginPath(); c.roundRect(bx - bw * 1.6, base - 10, bw * 3.2, 10, 3); c.fill();
    c.fillStyle = '#0b0e14'; c.fillRect(bx - bw * 0.2, top + (base - top) * 0.62, bw * 0.4, 7);
  };

  F.drawFlame = function (c, t, col) {
    const bx = this.bx, mouth = this.mouth, fh = this.fh, br = this.bright;
    c.globalCompositeOperation = 'lighter';
    // nón trong màu lam (khí cháy với không khí)
    const cone = c.createLinearGradient(0, mouth, 0, mouth - fh * 0.32);
    cone.addColorStop(0, 'rgba(110,160,255,.85)'); cone.addColorStop(1, 'rgba(80,120,255,0)');
    c.fillStyle = cone;
    c.beginPath(); c.moveTo(bx - this.fw * 0.25, mouth);
    c.quadraticCurveTo(bx - this.fw * 0.18, mouth - fh * 0.2, bx, mouth - fh * 0.32);
    c.quadraticCurveTo(bx + this.fw * 0.18, mouth - fh * 0.2, bx + this.fw * 0.25, mouth); c.fill();
    // lõi lửa sáng hơn nhưng vẫn mang màu của muối (tránh cháy trắng thành một khối)
    const core = AL.mixRGB(col, [255, 245, 230], 0.3);
    const sOut = this.sprite(col), sCore = this.sprite(core);
    for (const p of this.parts) {
      const k = p.t / p.life, sz = p.s * (0.7 + k * 0.5) * (1 - k * 0.6);
      const a = Math.pow(1 - k, 1.2) * (k < 0.2 ? 0.14 : 0.24) * br;
      c.globalAlpha = Math.min(1, a * (p.sp ? 3 : 1));
      c.drawImage(k < 0.2 ? sCore : sOut, p.x - sz / 2, p.y - sz / 2, sz, sz);
    }
    c.globalAlpha = 1;
    c.globalCompositeOperation = 'source-over';
  };

  F.drawLoop = function (c, t) {
    const k = ease.inOut(this.loopT); if (k <= 0) return;
    const tipX = lerp(this.bx + this.W * 0.3, this.bx + this.fw * 0.1, k), tipY = this.mouth - this.fh * 0.12;
    const hx = tipX + this.W * 0.13, hy = tipY + this.fh * 0.22;
    c.strokeStyle = 'rgba(200,190,180,.75)'; c.lineWidth = 1.4;
    c.beginPath(); c.moveTo(tipX + 5, tipY); c.lineTo(hx, hy); c.stroke();
    c.fillStyle = '#5a3d2a'; c.save(); c.translate(hx, hy); c.rotate(Math.atan2(hy - tipY, hx - tipX)); c.fillRect(0, -3, this.W * 0.07, 6); c.restore();
    c.strokeStyle = this.m > 0.2 ? 'rgba(255,170,90,.95)' : 'rgba(210,200,190,.9)'; c.lineWidth = 1.6;
    c.beginPath(); c.arc(tipX, tipY, 4.5, 0, Math.PI * 2); c.stroke();
    if (this.m < 0.6) {
      c.fillStyle = `rgba(245,245,250,${0.85 * (1 - this.m / 0.6)})`;
      for (let i = 0; i < 6; i++) c.fillRect(tipX - 4 + ((i * 37) % 9), tipY - 4 + ((i * 53) % 9), 2, 2);
    }
  };

  F.prismPath = function (c, x, y, a, ghost) {
    const s = this.ps, hgt = (s * Math.sqrt(3)) / 2;
    c.beginPath();
    c.moveTo(x, y - hgt * 0.62); c.lineTo(x + s / 2, y + hgt * 0.38); c.lineTo(x - s / 2, y + hgt * 0.38); c.closePath();
    if (ghost) {
      c.setLineDash([4, 4]); c.strokeStyle = 'rgba(255,255,255,.22)'; c.lineWidth = 1; c.stroke(); c.setLineDash([]);
      return;
    }
    const g = c.createLinearGradient(x - s / 2, y - hgt, x + s / 2, y + hgt);
    g.addColorStop(0, 'rgba(200,230,255,.28)'); g.addColorStop(0.5, 'rgba(255,255,255,.06)'); g.addColorStop(1, 'rgba(160,200,255,.2)');
    c.fillStyle = g; c.fill();
    c.strokeStyle = this.scope.drag ? 'rgba(255,170,100,.95)' : 'rgba(225,238,255,.75)'; c.lineWidth = 1.5; c.stroke();
    c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 1;
    c.beginPath(); c.moveTo(x - s * 0.08, y - hgt * 0.42); c.lineTo(x - s * 0.3, y + hgt * 0.26); c.stroke();
  };

  // các vạch đang phát ra (muối × độ hòa trộn + nền khí đốt)
  F.lines = function () {
    const out = [], f = this.cur(), m = this.m;
    for (const l of D.extra.fuel.lines) out.push({ id: l.id, nm: l.nm, w: l.w || 0, I: l.I * (this.salt ? lerp(0.8, 0.25, m) : 0.8) });
    if (f) for (const l of f.lines) out.push({ id: l.id, nm: l.nm, w: l.w || 0, I: l.I * m * f.bright });
    return out;
  };

  // Ảnh qua thị kính, đọc từ trên xuống theo nhiều lớp:
  //  ① màu tổng hợp mắt thấy  ② đồ thị cường độ I(λ)  ③ vạch phát xạ (bước sóng · nguồn gốc · năng lượng)
  //  ④ phổ liên tục để đối chiếu  ⑤ thang bước sóng. Thị kính chỉ cho thấy dải 380–780 nm.
  F.drawScreen = function (c, t) {
    const s = this.scr, S = this.scope, p = S.p, W = s.x1 - s.x0, H = s.y1 - s.y0;
    const f = this.cur(), lines = this.lines().filter((l) => l.nm >= 380 && l.nm <= 780);
    const small = H < 190, pad = 14, hdr = 22, sc = this.opt.scale ? 20 : 6;
    const X = (nm) => this.sx(nm);
    // thân kính + mặt thị kính
    c.save(); c.shadowColor = 'rgba(0,0,0,.6)'; c.shadowBlur = 24;
    const bodyG = c.createLinearGradient(0, s.y0, 0, s.y1);
    bodyG.addColorStop(0, '#171c27'); bodyG.addColorStop(1, '#090c12');
    c.fillStyle = bodyG; c.beginPath(); c.roundRect(s.x0 - 6, s.y0 - 6, W + 12, H + 12, 16); c.fill();
    c.restore();
    c.strokeStyle = 'rgba(255,255,255,.12)'; c.lineWidth = 1; c.stroke();
    c.fillStyle = '#010103'; c.beginPath(); c.roundRect(s.x0, s.y0, W, H, 11); c.fill();

    const gy0 = s.y0 + hdr + 4, gy1 = gy0 + (H - hdr - sc) * (small ? 0.26 : 0.3);
    const ly0 = gy1 + 6, ly1 = s.y1 - sc - (small ? 14 : 20) - 4;
    const ry0 = ly1 + 4, ry1 = s.y1 - sc;

    // tiêu đề + chip “mắt thấy”
    c.font = `700 10px ${DISP}`; c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillStyle = 'rgba(190,200,215,.8)';
    c.fillText('ẢNH QUA THỊ KÍNH', s.x0 + pad, s.y0 + hdr / 2 + 3);
    if (p > 0.05) {
      const rgb = this.flameRGB(), name = f ? (this.myst ? 'màu chưa rõ nguồn' : 'lửa ' + f.look) : 'lửa đèn khí';
      c.font = `500 10.5px ${BODY}`; const tw = c.measureText(name).width;
      const cx = s.x1 - pad - tw - 22, cy = s.y0 + hdr / 2 + 3;
      c.fillStyle = 'rgba(150,160,175,.75)'; c.textAlign = 'right'; c.font = `600 9.5px ${DISP}`; c.fillText('MẮT THẤY', cx - 6, cy);
      const sw = c.createRadialGradient(cx + 6, cy, 0, cx + 6, cy, 9); sw.addColorStop(0, '#fff'); sw.addColorStop(0.35, AL.rgba(rgb, 1)); sw.addColorStop(1, AL.rgba(rgb, 0));
      c.fillStyle = sw; c.beginPath(); c.arc(cx + 6, cy, 9, 0, Math.PI * 2); c.fill();
      c.font = `500 10.5px ${BODY}`; c.textAlign = 'left'; c.fillStyle = '#dfe6f0'; c.fillText(name, cx + 18, cy);
    }
    // lưới thước ngắm
    c.strokeStyle = 'rgba(255,255,255,.05)'; c.lineWidth = 1;
    for (let nm = 400; nm <= 750; nm += 50) { const x = Math.round(X(nm)) + 0.5; c.beginPath(); c.moveTo(x, gy0); c.lineTo(x, ry1); c.stroke(); }

    if (p <= 0.01) {
      c.textAlign = 'center'; c.textBaseline = 'middle';
      c.font = `500 12px ${BODY}`; c.fillStyle = 'rgba(190,200,215,.5)'; c.fillText('Chưa có ánh sáng đi vào kính', (s.x0 + s.x1) / 2, (gy0 + ly1) / 2 - 8);
      c.font = `500 10.5px ${BODY}`; c.fillStyle = 'rgba(190,200,215,.35)'; c.fillText('Kéo lăng kính vào tia sáng để tách màu', (s.x0 + s.x1) / 2, (gy0 + ly1) / 2 + 10);
    } else {
      // ② đồ thị cường độ: tổng các đỉnh Gauss (vạch hẹp ~1,6 nm; dải phân tử theo bề rộng thật)
      const pts = [], step = 2; let max = 0.6;
      for (let x = X(380); x <= X(780); x += step) {
        const nm = 380 + ((x - X(380)) / (X(780) - X(380))) * 400;
        let I = 0;
        for (const l of lines) { const sg = l.w ? l.w / 2.355 : 1.6; I += l.I * Math.exp(-((nm - l.nm) ** 2) / (2 * sg * sg)); }
        pts.push([x, nm, I]); if (I > max) max = I;
      }
      const gh = gy1 - gy0, yI = (I) => gy1 - (Math.min(I, max) / max) * gh * 0.9 * p;
      for (const [x, nm, I] of pts) {
        if (I < 0.004) continue;
        c.fillStyle = AL.rgba(AL.nmRGB(nm), 0.55 * AL.nmVis(nm) + 0.15);
        c.fillRect(x, yI(I), step + 0.5, gy1 - yI(I));
      }
      c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 1.2; c.beginPath();
      pts.forEach(([x, , I], i) => (i ? c.lineTo(x, yI(I)) : c.moveTo(x, yI(I)))); c.stroke();
      c.fillStyle = 'rgba(255,255,255,.1)'; c.fillRect(s.x0 + pad, gy1, W - pad * 2, 1);
      c.font = `500 9px ${MONO}`; c.textAlign = 'left'; c.textBaseline = 'top'; c.fillStyle = 'rgba(170,180,195,.6)';
      c.fillText('cường độ I(λ)', s.x0 + pad, gy0);

      // ③ vạch phát xạ
      c.save(); c.beginPath(); c.rect(s.x0 + 2, ly0, W - 4, ly1 - ly0); c.clip();
      c.globalCompositeOperation = 'lighter';
      const flick = 0.92 + 0.08 * Math.sin((t || 0) * 9);
      for (const l of lines) {
        const a = Math.min(1, l.I * p * flick) * (0.4 + 0.6 * AL.nmVis(l.nm)); if (a < 0.01) continue;
        const x = X(l.nm), rgb = AL.nmRGB(l.nm);
        if (l.w) {
          const ww = Math.max(6, (l.w / 400) * W);
          const g = c.createLinearGradient(x - ww, 0, x + ww, 0);
          g.addColorStop(0, AL.rgba(rgb, 0)); g.addColorStop(0.5, AL.rgba(rgb, a * 0.8)); g.addColorStop(1, AL.rgba(rgb, 0));
          c.fillStyle = g; c.fillRect(x - ww, ly0, ww * 2, ly1 - ly0);
        } else {
          const g = c.createLinearGradient(x - 12, 0, x + 12, 0);
          g.addColorStop(0, AL.rgba(rgb, 0)); g.addColorStop(0.5, AL.rgba(rgb, a * 0.55)); g.addColorStop(1, AL.rgba(rgb, 0));
          c.fillStyle = g; c.fillRect(x - 12, ly0, 24, ly1 - ly0);
          c.fillStyle = AL.rgba(AL.mixRGB(rgb, [255, 255, 255], 0.4 * a), a); c.fillRect(x - 1, ly0, 2, ly1 - ly0);
        }
      }
      c.restore();
      // nhãn: bước sóng · nguồn gốc (nguyên tử / phân tử) · năng lượng photon
      if (this.opt.names && p > 0.6) {
        const placed = [];
        lines.filter((l) => l.I > 0.25).sort((a, b) => b.I - a.I).slice(0, small ? 3 : 5).forEach((l) => {
          const x = X(l.nm); if (placed.some((q) => Math.abs(q - x) < 54)) return; placed.push(x);
          const info = D.line(l.id) || {}, mol = info.mol;
          const who = this.myst ? (mol ? 'dải phân tử' : 'vạch nguyên tử') : (mol ? mol + ' (phân tử)' : ((D.sp(info.sp) || {}).sym || '') + ' (nguyên tử)');
          c.textAlign = x > s.x1 - 70 ? 'right' : x < s.x0 + 70 ? 'left' : 'center'; c.textBaseline = 'top';
          c.font = `700 10.5px ${MONO}`; c.fillStyle = '#fff'; c.fillText(fmt(l.nm, l.w ? 0 : 1) + ' nm', x, ly0 + 4);
          c.font = `500 9.5px ${BODY}`; c.fillStyle = mol ? '#ffcf8a' : '#a9e7ff'; c.fillText(who, x, ly0 + 18);
          if (!small) { c.font = `500 9.5px ${MONO}`; c.fillStyle = 'rgba(200,210,225,.65)'; c.fillText(fmt(AL.eV(l.nm), 2) + ' eV', x, ly0 + 31); }
        });
      }
    }
    // ④ phổ liên tục tham chiếu
    for (let x = X(380); x < X(780); x += 2) {
      const nm = 380 + ((x - X(380)) / (X(780) - X(380))) * 400;
      c.fillStyle = AL.rgba(AL.nmRGB(nm), 0.45 * AL.nmVis(nm) + 0.05); c.fillRect(x, ry0, 2, ry1 - ry0);
    }
    if (!small) {
      c.font = `500 9px ${BODY}`; c.textAlign = 'right'; c.textBaseline = 'bottom'; c.fillStyle = 'rgba(170,180,195,.55)';
      c.fillText('phổ liên tục để đối chiếu', s.x1 - pad, ry0 - 2);
    }
    // ⑤ thang bước sóng
    if (this.opt.scale) {
      c.font = `500 9.5px ${MONO}`; c.textAlign = 'center'; c.textBaseline = 'bottom';
      for (let nm = 400; nm <= 750; nm += 50) {
        const x = X(nm);
        c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(x - 0.5, ry1, 1, 4);
        c.fillStyle = 'rgba(190,200,215,.6)'; c.fillText(nm, x, s.y1 - 3);
      }
    }
    // tối mép như nhìn qua ống kính
    const v = c.createLinearGradient(s.x0, 0, s.x1, 0);
    v.addColorStop(0, 'rgba(1,1,3,.85)'); v.addColorStop(0.035, 'rgba(1,1,3,0)'); v.addColorStop(0.965, 'rgba(1,1,3,0)'); v.addColorStop(1, 'rgba(1,1,3,.85)');
    c.fillStyle = v; c.fillRect(s.x0, gy0, W, ry1 - gy0);
    c.strokeStyle = 'rgba(255,255,255,.14)'; c.lineWidth = 1; c.beginPath(); c.roundRect(s.x0 + 0.5, s.y0 + 0.5, W - 1, H - 1, 11); c.stroke();
  };

  F.drawRays = function (c) {
    const S = this.scope; if (S.p <= 0 || !this.opt.rays) return;
    const p = ease.out(S.p), ox = S.x + this.ps * 0.16, oy = S.y - this.ps * 0.06, ty = this.scr.y1;
    c.globalCompositeOperation = 'lighter';
    for (const l of this.lines()) {
      if (l.nm < 380 || l.nm > 780) continue;
      const a = Math.min(1, l.I) * 0.45 * p * (0.35 + 0.65 * AL.nmVis(l.nm)); if (a < 0.01) continue;
      const rgb = AL.nmRGB(l.nm), tx = this.sx(l.nm);
      const ex = lerp(ox, tx, p), ey = lerp(oy, ty, p);
      if (l.w) {
        const half = ((l.w / 400) * (this.scr.x1 - this.scr.x0)) / 2;
        c.fillStyle = AL.rgba(rgb, a * 0.55);
        c.beginPath(); c.moveTo(ox, oy); c.lineTo(lerp(ox, tx - half, p), ey); c.lineTo(lerp(ox, tx + half, p), ey); c.closePath(); c.fill();
      } else {
        c.strokeStyle = AL.rgba(rgb, a); c.lineWidth = 1.6;
        c.beginPath(); c.moveTo(ox, oy); c.lineTo(ex, ey); c.stroke();
      }
    }
    c.globalCompositeOperation = 'source-over';
  };

  // ---------- Tương tác ----------
  F.toggleScope = function (on) {
    const S = this.scope;
    S.on = on == null ? !S.on : on;
    AL.app.refreshPanel(); this.status(); this.updateExplain();
  };
  F.primary = function () { this.toggleScope(); };
  F.pointer = function (type, x, y) {
    const S = this.scope, near = Math.hypot(x - S.x, y - S.y) < this.ps * 0.7;
    if (type === 'down' && near) { S.drag = true; S.dx = S.x - x; S.dy = S.y - y; AL.app.cursor('grabbing'); return true; }
    if (type === 'move') {
      if (S.drag) { S.x = x + S.dx; S.y = y + S.dy; return true; }
      AL.app.cursor(near ? 'grab' : 'default');
    }
    if ((type === 'up' || type === 'leave') && S.drag) {
      S.drag = false;
      const wasOn = S.on;
      S.on = Math.hypot(S.x - this.slot.x, S.y - this.slot.y) < this.ps * 1.3;
      if (S.on !== wasOn) { AL.app.refreshPanel(); this.status(); this.updateExplain(); }
      AL.app.cursor('default');
    }
  };

  // ---------- Mẫu chưa biết ----------
  F.startMystery = function () {
    const opts = ORDER.filter((s) => s !== this.salt && s !== this.lastMyst);
    const sp = opts[Math.floor(Math.random() * opts.length)];
    this.myst = { sp, wrong: new Set() }; this.lastMyst = sp; this.pending = sp;
    AL.store.set({ line: null });
    AL.app.refreshPanel(); this.status(); this.updateExplain(); AL.app.accent();
    AL.app.say('Mẫu chưa biết đã được đưa vào ngọn lửa. Hãy phân tích ánh sáng qua kính phân quang để xác định kim loại.');
  };
  F.guess = function (id) {
    const M = this.myst; if (!M) return;
    if (id === M.sp) {
      this.score++;
      const f = D.flame[id], sp = D.species[id];
      this.myst = null; this.refHover = null;
      AL.store.set({ el: id, line: null });
      if (this.score >= 3 && !this.won) { this.won = true; AL.app.win(`Chính xác: ${sp.name} (${f.salt})! Bạn đã xác định đúng 3 mẫu dựa trên quang phổ phát xạ.`); }
      else AL.app.say(`Chính xác! Đó là ${sp.name} (${f.salt}). ${f.tip}`, 'win');
      AL.app.renderChallenge();
    } else {
      M.wrong.add(id);
      const pair = HINTS.find(([ab]) => ab.includes(id) && ab.includes(M.sp));
      AL.app.say(pair ? `Chưa chính xác. ${pair[1]}` : 'Chưa chính xác. Hãy so sánh vạch chuẩn của từng nguyên tố với các vạch quan sát được trên thanh phổ.', 'hmm');
    }
    AL.app.refreshPanel(); this.status(); this.updateExplain(); AL.app.accent();
  };
  F.skipMystery = function () {
    const M = this.myst; if (!M) return;
    const sp = D.species[M.sp];
    this.myst = null; this.refHover = null;
    AL.store.set({ el: M.sp, line: null });
    AL.app.say(`Đáp án là ${sp.name} (${D.flame[M.sp].salt}). ${D.flame[M.sp].tip}`);
    AL.app.refreshPanel(); this.status(); this.updateExplain(); AL.app.accent();
  };

  // ---------- Thanh phổ ----------
  F.spectrum = function () {
    const p = this.scope.p;
    const lines = p > 0 ? this.lines().map((l) => ({ ...l, I: l.I * ease.inOut(p) })) : [];
    let refs = [];
    const ref = this.refHover || (AL.store.state.mode === 'full' && !this.myst ? this.salt : null);
    if (ref && D.flame[ref]) refs = D.flame[ref].lines.map((l) => ({ id: l.id, nm: l.nm, w: l.w || 0 }));
    return { lines, refs, anon: !!this.myst, empty: 'Ánh sáng chưa được tách — đưa kính phân quang vào tia sáng' };
  };

  // ---------- Trạng thái & giải thích ----------
  F.status = function () {
    const f = this.cur(), on = this.scope.on, sel = AL.store.state.line, info = sel && D.line(sel);
    const hint = on ? 'Bấm vào một vạch trên thanh phổ để xem chi tiết' : 'Kéo lăng kính lên tia sáng · hoặc bấm <b>Qua kính phân quang</b> (<kbd>Space</kbd>)';
    if (this.myst) { AL.app.status('<span class="rk">?</span> Mẫu chưa biết<span class="rs">so sánh vạch phổ để xác định kim loại</span>', hint); return; }
    if (info && f && info.sp === this.salt && on) { AL.app.status(AL.app.readout(sel, `${f.salt}${info.mol ? ' · ' + info.mol : ''}`), hint); return; }
    if (!f) { AL.app.status('Lửa đèn khí<span class="rs">chưa có muối · xanh lam nhạt</span>', 'Chọn một muối kim loại ở bước 1'); return; }
    const sp = D.species[this.salt];
    const main = f.lines.reduce((a, b) => (b.I > a.I ? b : a));
    const mainTxt = main.mol ? `dải mạnh nhất ~${fmt(main.nm, 0)} nm (${main.mol})` : `vạch mạnh nhất ${fmt(main.nm, 1)} nm`;
    AL.app.status(`<span class="rk">${f.salt}</span> · lửa ${f.look}<span class="rs">${on ? mainTxt : sp.name}</span>`, hint);
  };

  F.explainHTML = function () {
    const T = AL.term, f = this.cur(), on = this.scope.on;
    if (this.myst) return `<p>Màu ngọn lửa chưa đủ để kết luận vì nhiều kim loại cho màu gần giống nhau. Hãy đưa ${T('kính phân quang', 'spectroscope')} vào chùm sáng, sau đó so sánh vạch chuẩn của từng nguyên tố ở bước 1 với các vạch quan sát được trên thanh phổ.</p>`;
    if (!f) return `<p>Ngọn lửa đèn khí có màu xanh lam nhạt do phát xạ của các gốc CH và C₂ sinh ra trong quá trình cháy. Hãy chọn một muối kim loại để đưa vào ngọn lửa.</p><p class="muted">Nhiệt của ngọn lửa kích thích electron hóa trị của kim loại; khi electron chuyển về mức thấp hơn, nguyên tố phát ra bức xạ có màu đặc trưng.</p>`;
    const sp = D.species[this.salt];
    const lines = f.lines.filter((l) => !l.mol).map((l) => fmt(l.nm, 1)).join(' / ');
    const bands = f.lines.filter((l) => l.mol).map((l) => `${l.mol} ~${fmt(l.nm, 0)}`).join(', ');
    if (!on) return `<p><b>${sp.name}</b> (${f.salt}) cho lửa màu <b>${f.look}</b>. Mắt chỉ thấy màu tổng hợp. Hãy cho ánh sáng đi qua ${T('kính phân quang', 'spectroscope')} để xem màu này gồm những vạch nào.</p>`;
    return `<p>Màu ${f.look} thực ra gồm: vạch <b>${lines} nm</b>${bands ? ` và ${T('dải phân tử', 'band')} ${bands} nm` : ''}. Bộ vạch này là ${T('“dấu vân tay ánh sáng”', 'linespec')} riêng của ${sp.name}.</p><p class="muted">${AL.esc(f.tip)}</p><p class="src">Nguồn: NIST ASD (vạch nguyên tử); Gaydon (1974), <i>The Spectroscopy of Flames</i> (dải phân tử)</p>`;
  };
  F.updateExplain = function () { if (this.explainEl) this.explainEl.innerHTML = this.explainHTML(); };

  F.panel = function () {
    const ui = AL.ui, full = AL.store.state.mode === 'full', M = this.myst;
    const exp = ui.explain(M ? 'Hướng dẫn phân tích' : 'Quan sát', this.explainHTML(), 'spectra');
    this.explainEl = exp.body;
    const grid = ui.elGrid(ORDER, M ? null : this.pending, (id) => this.choose(id), {
      sub: (id) => D.flame[id].salt,
      onHover: (id) => { this.refHover = id; },
      wrong: M ? M.wrong : null,
    });
    const step1 = M
      ? ui.step(1, 'Xác định kim loại', ui.linkBtn('Bỏ qua', () => this.skipMystery()), grid, ui.note('Rê chuột (hoặc chạm) lên từng nguyên tố để hiện vạch chuẩn trên thanh phổ và so sánh.'))
      : ui.step(1, 'Chọn muối kim loại', this.salt ? ui.linkBtn('Lấy ra', () => this.choose(null)) : null, grid);
    return [
      step1,
      ui.step(2, 'Qua kính phân quang', null,
        ui.primary(this.scope.on ? 'Bỏ kính ra' : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 2 20h20z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>Qua kính phân quang', () => this.toggleScope(), 'Space'),
        ui.note('Hoặc kéo lăng kính trên hình vào tia sáng.')),
      ui.step(3, 'Hiện trên mô phỏng', null,
        ui.check('Tia sáng bị tách', this.opt.rays, (v) => (this.opt.rays = v)),
        ui.check('Thang bước sóng', this.opt.scale, (v) => (this.opt.scale = v)),
        ui.check('Nhãn trên hình', this.opt.names, (v) => (this.opt.names = v))),
      exp,
      M ? null : ui.mystery(this.score, () => this.startMystery()),
      full ? ui.block('Bảng thử màu ngọn lửa', this.table(), ui.note('Vạch nguyên tử theo NIST ASD; với dải phân tử (CaOH, SrOH, BaOH/BaCl, CuCl/CuOH), bảng ghi vị trí cực đại của dải. Dấu * chỉ dải phân tử.')) : null,
    ];
  };

  F.table = function () {
    const rows = ORDER.map((id) => {
      const f = D.flame[id];
      const main = f.lines.slice().sort((a, b) => b.I - a.I).slice(0, 2).map((l) => `<span class="sw" style="background:${AL.nmCSS(l.nm)}"></span>${fmt(l.nm, l.w ? 0 : 1)}${l.w ? '*' : ''}`).join(' ');
      return { key: id, cells: [`<b style="color:${D.species[id].color}">${f.salt}</b>`, f.look, main], click: this.myst ? null : () => this.choose(id) };
    });
    return AL.ui.table(['Muối', 'Màu lửa', 'Vạch chính (nm)'], rows, this.myst ? null : this.pending);
  };

  F.challenge = function () {
    return { text: 'Xác định đúng 3 mẫu muối chưa biết', prog: `${Math.min(3, this.score)}/3`, done: this.won, action: this.myst ? null : { label: 'Bắt đầu', fn: () => this.startMystery() } };
  };

  F.onState = function (s, ch) {
    if (ch.el && !this.myst && D.flame[s.el] && s.el !== this.pending) { this.pending = s.el; return true; }
    if (ch.line) this.status();
    return ch.mode;
  };
  F.enter = function () {
    const el = AL.store.state.el;
    if (!this.myst && D.flame[el] && el !== this.pending) this.pending = el;
    this.status();
  };
  F.leave = function () { this.refHover = null; };
  F.accent = function () {
    if (this.myst) return '#ff8a2b';
    const id = this.pending || this.salt;
    return id ? D.flame[id].glow : '#6f96ff';
  };
  F.reset = function () {
    this.salt = null; this.pending = 'Na'; this.loopT = 0; this.m = 0; this.myst = null; this.score = 0; this.won = false;
    this.scope.on = false; this.scope.p = 0; this.opt = { rays: true, scale: true, names: true };
    if (this.dock) { this.scope.x = this.dock.x; this.scope.y = this.dock.y; }
  };
  F.peek = function () {
    const ui = AL.ui;
    return [ui.primary(this.scope.on ? 'Bỏ kính ra' : 'Qua kính phân quang', () => this.toggleScope())];
  };
})();
