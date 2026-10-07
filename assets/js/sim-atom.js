/* Aurora-LAB — Mô phỏng 1: NGUYÊN TỬ PHÁT PHOTON
 * Câu hỏi: Vì sao mỗi nguyên tố phát ra ánh sáng có màu riêng?
 * Electron nhận năng lượng → nhảy lên mức cao → dừng một nhịp → rơi xuống, bắn ra photon
 * có đúng λ = hc/ΔE → photon bay xuống thanh phổ và để lại vạch sáng. */
(function () {
  'use strict';
  const AL = window.AL, D = AL.DATA, { fmt, lerp, ease, clamp } = AL;

  const ORDER = ['O', 'H', 'Na', 'Li', 'K', 'Ca', 'Sr', 'Ba', 'Cu', 'N2p'];
  const BALMER = ['H-656.3', 'H-486.1', 'H-434.0', 'H-410.2'];
  const ORANGE = '#ff8a2b';
  const MONO = '"JetBrains Mono", ui-monospace, monospace';
  const BODY = '"Be Vietnam Pro", system-ui, sans-serif';
  const DISP = '"Chakra Petch", system-ui, sans-serif';

  const S = (AL.SimAtom = {
    id: 'atom',
    question: 'Vì sao mỗi nguyên tố phát ra ánh sáng có màu riêng?',
    opt: { showE: true, ghost: false, model: true, auto: false },
    hits: {}, uvir: {}, balmer: new Set(), won: false,
    sp: null, lv: [], tr: [], downs: [],
    cur: 0, seq: null, queue: 0, autoT: 0,
    eX: 0, eY: 0, eR: 0, theta: 0,
    marks: [], last: null, hoverLv: -1, W: 0, H: 0,
    stars: new AL.Stars(120, 7),
  });

  S.init = function () { this.load(AL.store.state.el in D.species ? AL.store.state.el : 'O'); };

  S.load = function (id) {
    const sp = D.species[id];
    this.sp = sp;
    this.lv = sp.levels.slice().sort((a, b) => a.E - b.E);
    const li = {}; this.lv.forEach((l, i) => (li[l.id] = i));
    this.tr = sp.trans.map((t) => ({ ...t, ui: li[t.u], li: li[t.l] }));
    for (const t of this.tr) t.dE = t.nr ? this.lv[t.ui].E - this.lv[t.li].E : AL.HC / t.nm;
    // Cột trên sơ đồ xếp theo bước sóng: UV bên trái → IR bên phải, giống thanh phổ.
    this.tr.slice().sort((a, b) => (a.nr ? 1e6 + a.ui : a.nm) - (b.nr ? 1e6 + b.ui : b.nm)).forEach((t, k) => (t.col = k));
    this.downs = this.lv.map((_, i) => this.tr.filter((t) => t.ui === i));
    this.cur = 0; this.seq = null; this.queue = 0; this.marks = []; this.last = null; this.hoverLv = -1;
    this.hits[id] = this.hits[id] || {};
    this.uvir[id] = this.uvir[id] || { uv: 0, ir: 0 };
    this.layout();
  };

  // ---------- Bố cục ----------
  S.resize = function (w, h) { this.W = w; this.H = h; this.layout(); };
  S.layout = function () {
    const w = this.W, h = this.H; if (!w || !this.sp) return;
    const wide = w >= h * 1.15, model = this.opt.model;
    this.wide = wide;
    let d;
    if (!model) { this.bohr = null; d = { x: 0, y: 0, w, h }; }
    else if (wide) { this.bohr = { x: 0, y: 0, w: w * 0.4, h }; d = { x: w * 0.4, y: 0, w: w * 0.6, h }; }
    else { this.bohr = { x: 0, y: 0, w, h: h * 0.4 }; d = { x: 0, y: h * 0.4, w, h: h * 0.6 }; }
    this.diag = d;
    const padT = wide || !model ? 74 : 50, padB = 34;
    this.pl = { x0: d.x + 84, x1: d.x + d.w - (this.opt.showE ? 84 : 28), top: d.y + padT, bot: d.y + d.h - padB };
    this.idleX = this.pl.x0 + 18;
    const sp = this.sp, top = this.lv[this.lv.length - 1].E;
    this.showIon = AL.store.state.mode === 'full' && sp.ion && sp.ion <= top * 2.5;
    const Emax = this.showIon ? sp.ion * 1.03 : top * 1.07;
    this.segs = sp.axis ? sp.axis.map((s) => s.slice()) : [[0, Emax, 1]];
    const last = this.segs[this.segs.length - 1]; last[1] = Math.max(last[1], Emax);
    if (this.bohr) {
      const b = this.bohr;
      // màn hẹp: chừa chỗ cho ô "Câu hỏi" ở phía trên
      const top = wide ? 0 : 78;
      this.cx = b.x + b.w * 0.5; this.cy = b.y + top + (b.h - top) * 0.5;
      this.R = Math.min(b.w * 0.4, (b.h - top) * 0.4);
    }
    if (this.seq == null) { this.eY = this.yE(this.lv[this.cur].E); this.eR = this.ringR(this.cur); this.eX = this.idleX; }
  };

  S.yE = function (E) {
    const { top, bot } = this.pl, segs = this.segs, gap = segs.length > 1 ? 0.05 : 0;
    const tot = segs.reduce((s, g) => s + g[2], 0) + gap * (segs.length - 1);
    let off = 0;
    for (let i = 0; i < segs.length; i++) {
      const [a, b, k] = segs[i];
      if (E <= b || i === segs.length - 1) return bot - ((off + clamp((E - a) / (b - a), 0, 1) * k) / tot) * (bot - top);
      off += k + gap;
    }
    return bot;
  };
  S.ringR = function (i) { const n = this.lv.length; return (this.R || 100) * (0.42 + 0.58 * (n === 1 ? 0 : i / (n - 1))); };
  S.colX = function (col) { const n = this.tr.length, a = this.pl.x0 + 50, b = this.pl.x1 - 10; return a + ((col + 0.5) * (b - a)) / n; };
  S.electronXY = function () {
    const mol = this.sp.model === 'molecule';
    return { x: this.cx + Math.cos(this.theta) * this.eR * (mol ? 1.3 : 1), y: this.cy + Math.sin(this.theta) * this.eR };
  };

  // ---------- Vạch đang chọn (đồng bộ từ các tab khác) ----------
  S.selTrans = function () {
    const id = AL.store.state.line;
    return id ? this.tr.find((t) => t.id === id) || null : null;
  };

  // ---------- Hành động ----------
  S.primary = function () { this.excite(); };

  S.excite = function (target) {
    if (this.seq) { if (this.queue < 3) this.queue++; return; }
    const sel = this.selTrans();
    let to, forced = null;
    if (target != null) to = target;
    else if (sel) { to = sel.ui; forced = sel; }
    else to = this.lv.indexOf(AL.pick(this.lv.slice(1), (l) => l.x || 0.05));
    if (to <= 0) return;
    this.seq = { ph: 'hit', t: 0, dur: 0.3, to, forced };
    AL.app.hint('Electron đang hấp thụ năng lượng…');
  };

  S.update = function (dt) {
    if (!this.sp) return;
    const R0 = this.ringR(0);
    this.theta += dt * 1.7 * Math.pow(R0 / Math.max(R0, this.eR), 1.5);
    for (const m of this.marks) m.t += dt;
    this.marks = this.marks.filter((m) => m.t < m.life);
    const q = this.seq;
    if (!q) {
      this.eX += (this.idleX - this.eX) * Math.min(1, dt * 6);
      if (this.queue > 0) { this.queue--; this.excite(); }
      else if (this.opt.auto) { this.autoT += dt; if (this.autoT > 0.7) { this.autoT = 0; this.excite(); } }
      return;
    }
    q.t += dt;
    const k = Math.min(1, q.t / q.dur);
    const lv = this.lv;
    if (q.ph === 'hit') {
      if (k >= 1) { q.ph = 'up'; q.t = 0; q.dur = 0.55; q.from = this.cur; }
    } else if (q.ph === 'up') {
      const e = ease.inOut(k);
      this.eY = lerp(this.yE(lv[q.from].E), this.yE(lv[q.to].E), e);
      this.eR = lerp(this.ringR(q.from), this.ringR(q.to), e);
      if (k >= 1) {
        this.marks.push({ type: 'up', from: q.from, to: q.to, t: 0, life: 2.2 });
        this.cur = q.to; this.toDwell(q);
      }
    } else if (q.ph === 'dwell') {
      this.eX = lerp(q.x0, q.x1, ease.inOut(Math.min(1, q.t / 0.4)));
      if (k >= 1) { q.ph = 'down'; q.t = 0; q.dur = q.tr.nr ? 0.6 : 0.36; }
    } else if (q.ph === 'down') {
      const e = q.tr.nr ? ease.inOut(k) : ease.in(k), tr = q.tr;
      this.eY = lerp(this.yE(lv[tr.ui].E), this.yE(lv[tr.li].E), e);
      this.eR = lerp(this.ringR(tr.ui), this.ringR(tr.li), e);
      if (k >= 1) this.land(tr);
    } else if (q.ph === 'settle') {
      if (k >= 1) { this.seq = null; this.status(); }
    }
  };

  S.toDwell = function (q) {
    const downs = this.downs[this.cur];
    if (!downs.length) { q.ph = 'settle'; q.t = 0; q.dur = 0.3; return; }
    const tr = q.forced && q.forced.ui === this.cur ? q.forced : AL.pick(downs, (t) => t.p || 1);
    q.forced = null; q.tr = tr; q.ph = 'dwell'; q.t = 0;
    q.dur = this.lv[this.cur].meta ? 1.5 : 0.5;
    q.x0 = this.eX; q.x1 = this.colX(tr.col);
  };

  S.land = function (tr) {
    this.cur = tr.li;
    this.marks.push({ type: tr.nr ? 'nr' : 'down', tr, t: 0, life: 2.8 });
    if (!tr.nr) this.emit(tr);
    const q = this.seq;
    if (this.cur === 0) { q.ph = 'settle'; q.t = 0; q.dur = 0.35; }
    else this.toDwell(q);
  };

  S.emit = function (tr) {
    const sid = this.sp.id, reg = AL.region(tr.nm);
    const from = this.bohr ? this.electronXY() : { x: this.colX(tr.col), y: this.yE(this.lv[tr.li].E) };
    const p0 = AL.app.toViewport(from.x, from.y), p1 = AL.Spectrum.viewportPoint(tr.nm);
    this.last = tr;
    AL.FX.photon({
      x0: p0.x, y0: p0.y, x1: p1.x, y1: p1.y, nm: tr.nm,
      onArrive: () => {
        if (reg === 'VIS') { const hs = this.hits[sid]; hs[tr.id] = (hs[tr.id] || 0) + 1; }
        else this.uvir[sid][reg === 'UV' ? 'uv' : 'ir']++;
        AL.Spectrum.flash(tr.nm);
        if (sid === 'H' && BALMER.includes(tr.id) && !this.balmer.has(tr.id)) {
          this.balmer.add(tr.id);
          if (this.balmer.size === BALMER.length && !this.won) {
            this.won = true;
            AL.app.win('Hoàn thành! Bạn đã ghi nhận đủ 4 vạch Balmer của hydrogen: 656,3; 486,1; 434,0 và 410,2 nm.');
          }
          AL.app.renderChallenge();
        }
      },
    });
    this.status();
    this.updateExplain();
  };

  S.clear = function () {
    const sid = this.sp.id;
    this.hits[sid] = {}; this.uvir[sid] = { uv: 0, ir: 0 }; this.last = null;
    this.status(); this.updateExplain();
  };

  S.reset = function () {
    this.hits = {}; this.uvir = {}; this.balmer.clear(); this.won = false;
    this.opt = { showE: true, ghost: false, model: true, auto: false };
    this.load('O');
  };

  S.onState = function (s, ch) {
    if (ch.el && s.el in D.species && s.el !== this.sp.id) this.load(s.el);
    if (ch.mode) this.layout();
    if (ch.el || ch.line || ch.mode) { this.status(); }
    return ch.el || ch.mode || ch.line;
  };

  S.enter = function () {
    const el = AL.store.state.el;
    if (el in D.species && el !== this.sp.id) this.load(el);
    this.status();
  };
  S.leave = function () { this.opt.auto = false; };
  S.accent = function () { return this.sp.color; };

  // ---------- Con trỏ: bấm vào một mức để kích thích lên đúng mức đó ----------
  S.levelAt = function (x, y) {
    if (x < this.pl.x0 - 80 || x > this.pl.x1 + 10) return -1;
    let best = -1, bd = 12;
    this.lv.forEach((l, i) => { const d = Math.abs(this.yE(l.E) - y); if (d < bd) { bd = d; best = i; } });
    return best;
  };
  S.pointer = function (type, x, y) {
    const i = this.levelAt(x, y);
    if (type === 'move') { this.hoverLv = i; AL.app.cursor(i > 0 && !this.seq ? 'pointer' : 'default'); }
    if (type === 'leave') this.hoverLv = -1;
    if (type === 'down' && i > 0 && !this.seq) this.excite(i);
  };

  // ---------- Vẽ ----------
  S.draw = function (c, w, h, t) {
    c.fillStyle = '#020307'; c.fillRect(0, 0, w, h);
    this.stars.draw(c, 0, 0, w, h, t, 0.55);
    if (this.bohr) this.drawBohr(c, t);
    this.drawDiag(c, t);
  };

  S.drawBohr = function (c, t) {
    const b = this.bohr, { cx, cy, R, sp } = this, mol = sp.model === 'molecule';
    const accRGB = AL.hexRGB(sp.color);
    const halo = c.createRadialGradient(cx, cy, 0, cx, cy, R * 1.35);
    halo.addColorStop(0, AL.rgba(accRGB, 0.12)); halo.addColorStop(1, AL.rgba(accRGB, 0));
    c.fillStyle = halo; c.fillRect(b.x, b.y, b.w, b.h);

    // Quỹ đạo ứng với từng mức năng lượng
    this.lv.forEach((l, i) => {
      const r = this.ringR(i), on = i === this.cur, hov = i === this.hoverLv;
      c.beginPath();
      mol ? c.ellipse(cx, cy, r * 1.3, r, 0, 0, Math.PI * 2) : c.arc(cx, cy, r, 0, Math.PI * 2);
      c.setLineDash(on ? [] : [3, 6]);
      c.strokeStyle = on ? AL.rgba(accRGB, 0.6) : hov ? 'rgba(255,255,255,.35)' : 'rgba(255,255,255,.13)';
      c.lineWidth = on ? 1.6 : 1; c.stroke();
    });
    c.setLineDash([]);
    // chỉ ghi nhãn quỹ đạo cơ bản, quỹ đạo đang có electron và quỹ đạo đang trỏ chuột
    c.font = `500 10.5px ${MONO}`; c.textAlign = 'left'; c.textBaseline = 'middle';
    this.lv.forEach((l, i) => {
      if (i !== 0 && i !== this.cur && i !== this.hoverLv) return;
      const r = this.ringR(i) * (mol ? 1.3 : 1), a = -0.62;
      c.fillStyle = i === this.cur ? sp.color : 'rgba(200,210,225,.55)';
      c.fillText(l.t, cx + Math.cos(a) * r + 5, cy + Math.sin(a) * r - 2);
    });

    // Lõi: các lớp electron bên trong (mờ)
    const core = sp.core || [];
    core.forEach((n, k) => {
      const r = R * (0.12 + (0.26 * (k + 1)) / (core.length + 0.4));
      c.strokeStyle = 'rgba(255,255,255,.06)'; c.lineWidth = 1;
      c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.stroke();
      c.fillStyle = 'rgba(170,200,255,.45)';
      for (let j = 0; j < n; j++) {
        const a = (j / n) * Math.PI * 2 + t * 0.35 * (k % 2 ? -1 : 1);
        c.beginPath(); c.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 1.4, 0, Math.PI * 2); c.fill();
      }
    });

    // Hạt nhân
    const nuc = mol ? [[-R * 0.11, 0], [R * 0.11, 0]] : [[0, 0]];
    for (const [ox, oy] of nuc) {
      const g = c.createRadialGradient(cx + ox, cy + oy, 0, cx + ox, cy + oy, 16);
      g.addColorStop(0, 'rgba(255,240,220,1)'); g.addColorStop(0.35, 'rgba(255,150,90,.9)'); g.addColorStop(1, 'rgba(255,120,60,0)');
      c.fillStyle = g; c.beginPath(); c.arc(cx + ox, cy + oy, 16, 0, Math.PI * 2); c.fill();
    }
    if (mol) { c.strokeStyle = 'rgba(255,200,160,.5)'; c.lineWidth = 2; c.beginPath(); c.moveTo(cx - R * 0.11, cy); c.lineTo(cx + R * 0.11, cy); c.stroke(); }

    // Tia năng lượng (va chạm / nhiệt) lao vào electron
    const q = this.seq;
    if (q && q.ph === 'hit') {
      const e = this.electronXY(), k = ease.out(Math.min(1, q.t / q.dur));
      const sx = b.x + 10, sy = cy - R * 0.9, x = lerp(sx, e.x, k), y = lerp(sy, e.y, k);
      c.globalCompositeOperation = 'lighter';
      const g = c.createRadialGradient(x, y, 0, x, y, 14);
      g.addColorStop(0, 'rgba(255,240,210,1)'); g.addColorStop(0.4, 'rgba(255,138,43,.9)'); g.addColorStop(1, 'rgba(255,138,43,0)');
      c.fillStyle = g; c.fillRect(x - 14, y - 14, 28, 28);
      c.strokeStyle = 'rgba(255,138,43,.5)'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(lerp(sx, x, 0.6), lerp(sy, y, 0.6)); c.lineTo(x, y); c.stroke();
      c.globalCompositeOperation = 'source-over';
    }

    // Electron đang xét
    const e = this.electronXY();
    c.globalCompositeOperation = 'lighter';
    const eg = c.createRadialGradient(e.x, e.y, 0, e.x, e.y, 13);
    const excited = this.cur > 0 || (q && q.ph !== 'hit');
    eg.addColorStop(0, '#ffffff'); eg.addColorStop(0.3, excited ? AL.rgba(accRGB, 0.95) : 'rgba(140,200,255,.95)'); eg.addColorStop(1, 'rgba(120,180,255,0)');
    c.fillStyle = eg; c.fillRect(e.x - 13, e.y - 13, 26, 26);
    c.globalCompositeOperation = 'source-over';

    // Nhãn nguyên tố
    const lx = b.x + 18, ly = b.y + b.h - (this.wide ? 26 : 16);
    c.textAlign = 'left'; c.textBaseline = 'alphabetic';
    c.font = `700 22px ${DISP}`; c.fillStyle = sp.color; c.fillText(sp.sym, lx, ly);
    const sw = c.measureText(sp.sym).width;
    c.font = `500 12.5px ${BODY}`; c.fillStyle = 'rgba(220,228,240,.85)'; c.fillText(sp.name, lx + sw + 10, ly - 1);
    if (this.wide) { c.font = `400 11px ${BODY}`; c.fillStyle = 'rgba(160,170,185,.6)'; c.fillText('Mô hình Bohr · biểu diễn các mức năng lượng của electron hóa trị', lx, ly + 17); }
  };

  S.drawDiag = function (c, t) {
    const p = this.pl, d = this.diag, sp = this.sp, lv = this.lv, full = AL.store.state.mode === 'full';
    const accRGB = AL.hexRGB(sp.color), sel = this.selTrans(), q = this.seq;

    // Tiêu đề
    c.textBaseline = 'alphabetic';
    c.font = `600 11px ${DISP}`; c.fillStyle = 'rgba(170,180,195,.75)';
    // khi không có mô hình nguyên tử, ô "Câu hỏi" nằm góc trái nên đặt tiêu đề sang phải
    c.textAlign = this.bohr ? 'left' : 'right';
    c.fillText('SƠ ĐỒ MỨC NĂNG LƯỢNG', this.bohr ? d.x + 18 : d.x + d.w - 18, this.bohr && !this.wide ? d.y + 18 : d.y + 30);
    c.textAlign = 'left';
    if (this.bohr && this.wide) { c.fillStyle = 'rgba(255,255,255,.06)'; c.fillRect(d.x, 18, 1, d.h - 36); }

    // Trục E
    const axX = d.x + 22;
    c.strokeStyle = 'rgba(255,255,255,.22)'; c.lineWidth = 1;
    c.beginPath(); c.moveTo(axX, p.bot + 6); c.lineTo(axX, p.top - 14); c.stroke();
    c.fillStyle = 'rgba(255,255,255,.35)';
    c.beginPath(); c.moveTo(axX - 4, p.top - 10); c.lineTo(axX + 4, p.top - 10); c.lineTo(axX, p.top - 18); c.fill();
    c.font = `600 11px ${MONO}`; c.fillStyle = 'rgba(200,210,225,.6)'; c.fillText('E', axX + 7, p.top - 12);
    if (this.segs.length > 1) {
      const y = (this.yE(this.segs[0][1]) + this.yE(this.segs[1][0])) / 2;
      c.fillStyle = '#020307'; c.fillRect(axX - 5, y - 5, 10, 10);
      c.strokeStyle = 'rgba(255,255,255,.4)';
      c.beginPath(); c.moveTo(axX - 6, y - 1); c.lineTo(axX + 6, y - 5); c.moveTo(axX - 6, y + 5); c.lineTo(axX + 6, y + 1); c.stroke();
      c.setLineDash([2, 4]); c.strokeStyle = 'rgba(255,255,255,.1)';
      c.beginPath(); c.moveTo(p.x0, y); c.lineTo(p.x1, y); c.stroke(); c.setLineDash([]);
    }

    // Ngưỡng ion hóa
    if (this.showIon || (sp.axis && full)) {
      const y = this.yE(sp.ion);
      c.setLineDash([5, 5]); c.strokeStyle = 'rgba(255,255,255,.25)';
      c.beginPath(); c.moveTo(p.x0, y); c.lineTo(p.x1, y); c.stroke(); c.setLineDash([]);
      c.font = `500 10.5px ${BODY}`; c.fillStyle = 'rgba(200,210,225,.55)'; c.textAlign = 'left';
      c.fillText(`ion hóa · ${fmt(sp.ion, 2)} eV`, p.x0 + 6, y - 5);
    }

    // Các mức năng lượng
    lv.forEach((l, i) => {
      const y = Math.round(this.yE(l.E)) + 0.5, on = i === this.cur, hov = i === this.hoverLv && i > 0 && !q;
      if (on || hov) {
        c.fillStyle = on ? AL.rgba(accRGB, 0.08) : 'rgba(255,255,255,.04)';
        c.fillRect(p.x0, y - 7, p.x1 - p.x0, 14);
      }
      c.strokeStyle = on ? sp.color : hov ? 'rgba(255,255,255,.75)' : i === 0 ? 'rgba(235,240,250,.55)' : 'rgba(235,240,250,.32)';
      c.lineWidth = on ? 2.4 : 1.6;
      if (on) { c.shadowColor = sp.color; c.shadowBlur = 10; }
      c.beginPath(); c.moveTo(p.x0, y); c.lineTo(p.x1, y); c.stroke();
      c.shadowBlur = 0;
      c.font = `${on ? 700 : 500} 12px ${MONO}`; c.textAlign = 'right'; c.textBaseline = 'middle';
      c.fillStyle = on ? sp.color : 'rgba(205,213,226,.8)';
      c.fillText(l.t, p.x0 - 10, y);
      if (this.opt.showE) {
        c.textAlign = 'left'; c.font = `500 11.5px ${MONO}`; c.fillStyle = on ? '#fff' : 'rgba(170,180,195,.75)';
        c.fillText(`${fmt(l.E, 2)} eV`, p.x1 + 10, y);
      }
      if (l.meta && full) {
        c.textAlign = 'right'; c.font = `500 10px ${BODY}`; c.fillStyle = 'rgba(255,205,120,.75)';
        c.fillText(`giả bền · τ ${l.tau}`, p.x1 - 4, y - 9);
      }
      if (hov) {
        c.textAlign = 'left'; c.font = `500 11px ${BODY}`; c.fillStyle = 'rgba(255,190,130,.95)';
        c.fillText(`bấm để kích thích lên mức này · +${fmt(l.E - lv[this.cur].E, 2)} eV`, p.x0 + 34, y - 10);
      }
    });

    // Bước nhảy có thể (mờ) và bước nhảy đang chọn
    for (const tr of this.tr) {
      const isSel = sel && sel.id === tr.id;
      if (!this.opt.ghost && !isSel) continue;
      const x = this.colX(tr.col), y0 = this.yE(lv[tr.ui].E), y1 = this.yE(lv[tr.li].E);
      const col = tr.nr ? 'rgba(160,170,185,.6)' : AL.nmCSS(tr.nm, isSel ? 1 : 0.6);
      this.arrow(c, x, y0, y1, col, isSel ? 2.4 : 1.2, !isSel, isSel ? AL.nmCSS(tr.nm) : null);
      c.font = `${isSel ? 700 : 500} 9.5px ${MONO}`; c.textAlign = 'center'; c.textBaseline = 'top';
      c.fillStyle = col;
      c.fillText(tr.nr ? '·' : tr.nm >= 1000 ? AL.fmt(tr.nm / 1000, 1) + 'µ' : Math.round(tr.nm), x, y1 + 4 + (tr.col % 2) * 10);
      if (isSel && !(q && q.tr === tr && q.ph === 'down')) this.label(c, x, (y0 + y1) / 2, tr, 0.9, 'đã chọn');
    }

    // Dấu vết các bước vừa xảy ra
    for (const m of this.marks) {
      const a = Math.max(0, 1 - m.t / m.life);
      if (m.type === 'up') {
        const y0 = this.yE(lv[m.from].E), y1 = this.yE(lv[m.to].E);
        this.arrow(c, this.idleX, y0, y1, AL.hexA(ORANGE, 0.85 * a), 2.2, false);
        c.font = `700 11.5px ${MONO}`; c.textAlign = 'left'; c.textBaseline = 'middle';
        c.fillStyle = AL.hexA(ORANGE, a);
        c.fillText(`+${fmt(lv[m.to].E - lv[m.from].E, 2)} eV`, this.idleX + 9, (y0 + y1) / 2);
      } else {
        const tr = m.tr, x = this.colX(tr.col), y0 = this.yE(lv[tr.ui].E), y1 = this.yE(lv[tr.li].E);
        const col = tr.nr ? `rgba(160,170,185,${0.8 * a})` : AL.nmCSS(tr.nm, a);
        this.arrow(c, x, y0, y1, col, 2.6, tr.nr, tr.nr ? null : AL.nmCSS(tr.nm, a));
        if (m === this.marks[this.marks.length - 1] || m.t < 0.9) this.label(c, x, (y0 + y1) / 2, tr, a);
      }
    }

    // Bước đang diễn ra
    if (q && (q.ph === 'up' || q.ph === 'down')) {
      if (q.ph === 'up') this.arrow(c, this.idleX, this.yE(lv[q.from].E), this.eY, AL.hexA(ORANGE, 0.9), 2.2, false, null, true);
      else { const tr = q.tr; this.arrow(c, this.colX(tr.col), this.yE(lv[tr.ui].E), this.eY, tr.nr ? 'rgba(160,170,185,.8)' : AL.nmCSS(tr.nm), 2.6, tr.nr, null, true); }
    }
    if (q && q.ph === 'dwell' && lv[this.cur].meta) {
      const y = this.yE(lv[this.cur].E);
      c.globalAlpha = 0.65 + 0.35 * Math.sin(t * 8);
      AL.tag(c, `⏳ trạng thái giả bền · τ ${lv[this.cur].tau}`, p.x0 + 30, y - 16, { color: '#ffcf80', font: `600 11px ${BODY}` });
      c.globalAlpha = 1;
    }

    // Electron trên sơ đồ
    c.globalCompositeOperation = 'lighter';
    const g = c.createRadialGradient(this.eX, this.eY, 0, this.eX, this.eY, 12);
    g.addColorStop(0, '#fff'); g.addColorStop(0.35, AL.rgba(accRGB, 0.9)); g.addColorStop(1, AL.rgba(accRGB, 0));
    c.fillStyle = g; c.fillRect(this.eX - 12, this.eY - 12, 24, 24);
    c.globalCompositeOperation = 'source-over';
    c.font = `600 10px ${BODY}`; c.textAlign = 'center'; c.textBaseline = 'top'; c.fillStyle = 'rgba(200,215,235,.7)';
    if (!q && this.cur === 0) c.fillText('e⁻', this.eX, this.eY + 7);
  };

  S.arrow = function (c, x, y0, y1, color, lw, dashed, glow, noHead) {
    if (Math.abs(y1 - y0) < 2) return;
    const dir = Math.sign(y1 - y0);
    c.strokeStyle = color; c.lineWidth = lw;
    if (dashed) c.setLineDash([3, 4]);
    if (glow) { c.shadowColor = glow; c.shadowBlur = 12; }
    c.beginPath(); c.moveTo(x, y0); c.lineTo(x, y1 - dir * (noHead ? 0 : 6)); c.stroke();
    c.setLineDash([]);
    if (!noHead) {
      c.fillStyle = color;
      c.beginPath(); c.moveTo(x - 4.5, y1 - dir * 8); c.lineTo(x + 4.5, y1 - dir * 8); c.lineTo(x, y1); c.fill();
    }
    c.shadowBlur = 0;
  };

  S.label = function (c, x, y, tr, a, prefix) {
    if (a <= 0.02) return;
    const right = x < this.pl.x1 - 130;
    const ax = right ? x + 10 : x - 10;
    c.globalAlpha = a;
    if (tr.nr) {
      AL.tag(c, 'va chạm · không phát sáng', ax, y, { color: 'rgba(200,205,215,.9)', align: right ? 'left' : 'right', font: `500 11px ${BODY}` });
      c.globalAlpha = 1; return;
    }
    const reg = AL.region(tr.nm);
    const l1 = `${prefix ? prefix + ' · ' : ''}λ = ${AL.fmtNm(tr.nm)}${reg !== 'VIS' ? ' (' + reg + ')' : ''}`;
    const l2 = `ΔE = ${fmt(tr.dE, 2)} eV`;
    AL.tag(c, l1, ax, y - 11, { color: reg === 'VIS' ? AL.nmCSS(tr.nm) : '#c9b8ff', align: right ? 'left' : 'right', font: `700 11.5px ${MONO}`, border: 'rgba(255,255,255,.08)' });
    AL.tag(c, l2, ax, y + 11, { color: '#e8edf5', align: right ? 'left' : 'right', font: `500 11px ${MONO}` });
    c.globalAlpha = 1;
  };

  // ---------- Thanh phổ ----------
  S.spectrum = function () {
    const sid = this.sp.id, hs = this.hits[sid] || {}, lines = [];
    for (const id in hs) { const info = D.line(id); lines.push({ id, nm: info.nm, I: 1 - Math.exp(-hs[id] / 2.2) }); }
    const full = AL.store.state.mode === 'full', sel = this.selTrans();
    const refs = full ? this.tr.filter((t) => !t.nr).map((t) => ({ id: t.id, nm: t.nm })) : sel ? [{ id: sel.id, nm: sel.nm }] : [];
    return { lines, refs, uv: this.uvir[sid].uv, ir: this.uvir[sid].ir, empty: 'Chưa có photon nào — bấm “Cấp năng lượng” để vẽ quang phổ' };
  };

  // ---------- Thanh trạng thái ----------
  S.status = function () {
    const sp = this.sp, sel = this.selTrans(), tr = sel || this.last;
    if (!tr) {
      AL.app.status(`<span class="rk">${sp.sym}</span> ${AL.esc(sp.name)}<span class="rs">electron ở trạng thái cơ bản ${this.lv[0].t}</span>`,
        'Bấm <b>Cấp năng lượng</b> (phím <kbd>Space</kbd>) · hoặc bấm vào một mức');
      return;
    }
    const reg = AL.region(tr.nm);
    AL.app.status(AL.app.readout(tr.id, `${sp.sym} ${this.lv[tr.ui].t} → ${this.lv[tr.li].t}`),
      sel ? 'Vạch đã chọn · bấm <b>Cấp năng lượng</b> để thực hiện lại chuyển mức này'
        : reg !== 'VIS' ? `Photon ${reg === 'UV' ? 'tử ngoại' : 'hồng ngoại'}: nằm ngoài vùng khả kiến, ghi nhận ở ô ${reg}`
          : 'Bấm vào vạch trên thanh phổ để xem chi tiết');
  };

  // ---------- Thẻ giải thích ----------
  S.explainHTML = function () {
    const sp = this.sp, tr = this.last, T = AL.term;
    let p1;
    if (!tr) {
      p1 = `${T('Electron', 'electron')} chỉ tồn tại ở những ${T('mức năng lượng', 'level')} xác định. Khi hấp thụ năng lượng (nhiệt, va chạm), electron chuyển lên ${T('trạng thái kích thích', 'excited')}. Trạng thái này kém bền: electron chuyển về mức thấp hơn và phát ra một ${T('photon', 'photon')} mang đúng năng lượng ΔE.`;
    } else {
      const reg = AL.region(tr.nm), u = this.lv[tr.ui].t, l = this.lv[tr.li].t;
      p1 = `Electron chuyển từ mức <b>${u}</b> về <b>${l}</b>, giải phóng <b>${fmt(tr.dE, 2)} eV</b> dưới dạng photon <b style="color:${reg === 'VIS' ? AL.nmCSS(tr.nm) : '#c9b8ff'}">${AL.fmtNm(tr.nm)}</b>` +
        (reg === 'VIS' ? ` (${AL.colorName(tr.nm)}).` : `, thuộc vùng ${reg === 'UV' ? T('tử ngoại', 'uv') : T('hồng ngoại', 'ir')}, nằm ngoài vùng khả kiến.`) +
        (tr.d ? ` ${AL.esc(tr.d)}` : '');
    }
    const full = AL.store.state.mode === 'full';
    return `<p>${p1}</p>${full ? `<p class="muted">${AL.esc(sp.note)}</p>` : ''}<div class="formula">ΔE = hc / λ <span>≈ 1240 / λ(nm) eV</span></div>`;
  };
  S.updateExplain = function () { if (this.explainEl) this.explainEl.innerHTML = this.explainHTML(); };

  // ---------- Panel điều khiển ----------
  S.panel = function () {
    const ui = AL.ui, sp = this.sp, full = AL.store.state.mode === 'full', sel = this.selTrans();
    const relayout = () => { this.layout(); };
    const exp = ui.explain('Điều gì đang xảy ra?', this.explainHTML(), 'emit');
    this.explainEl = exp.body;
    return [
      ui.step(1, 'Chọn nguyên tố', null,
        ui.elGrid(ORDER, sp.id, (id) => AL.store.set({ el: id, line: null }))),
      ui.step(2, 'Cấp năng lượng', null,
        ui.primary('<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2 4 14h7l-1 8 9-12h-7z" fill="currentColor"/></svg>Cấp năng lượng', () => this.excite(), 'Space'),
        sel ? ui.target(sel, () => AL.store.set({ line: null })) : null,
        ui.row(ui.check('Tự động', this.opt.auto, (v) => (this.opt.auto = v)), ui.linkBtn('Xóa phổ', () => this.clear())),
        full ? ui.note('Có thể bấm trực tiếp vào một mức trên sơ đồ để kích thích electron lên đúng mức đó.') : null),
      ui.step(3, 'Hiện trên mô phỏng', null,
        ui.check('Giá trị năng lượng (eV)', this.opt.showE, (v) => { this.opt.showE = v; relayout(); }),
        ui.check(`Các chuyển mức khả dĩ`, this.opt.ghost, (v) => (this.opt.ghost = v)),
        ui.check('Mô hình nguyên tử', this.opt.model, (v) => { this.opt.model = v; relayout(); })),
      exp,
      full ? ui.block('Bảng chuyển mức · ' + sp.sym, this.table(), ui.note('Bước sóng theo NIST ASD, đo trong không khí (dưới 200 nm: trong chân không).')) : null,
    ];
  };

  S.table = function () {
    const rows = this.tr.slice().sort((a, b) => (a.nr ? 1e6 : a.nm) - (b.nr ? 1e6 : b.nm)).map((t) => ({
      key: t.id,
      cells: [
        `${this.lv[t.ui].t} → ${this.lv[t.li].t}`,
        t.nr ? '—' : `<span class="sw" style="background:${AL.nmCSS(t.nm)}"></span>${AL.fmtNm(t.nm)}`,
        fmt(t.dE, 2),
        t.nr ? 'va chạm' : AL.region(t.nm) === 'VIS' ? AL.colorName(t.nm) : AL.region(t.nm),
      ],
      click: t.nr ? null : () => AL.store.set({ line: AL.store.state.line === t.id ? null : t.id }),
    }));
    return AL.ui.table(['Chuyển mức', 'λ', 'ΔE (eV)', 'Vùng'], rows, AL.store.state.line);
  };

  S.peek = function () {
    const ui = AL.ui;
    return [ui.miniEl(this.sp), ui.primary('Cấp năng lượng', () => this.excite())];
  };

  S.challenge = function () {
    const n = this.balmer.size;
    return {
      text: 'Ghi nhận đủ 4 vạch Balmer khả kiến của hydrogen',
      prog: `${n}/4`, done: this.won,
      action: this.sp.id !== 'H' ? { label: 'Chọn H', fn: () => AL.store.set({ el: 'H', line: null }) } : null,
    };
  };
})();
