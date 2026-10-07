/* Aurora-LAB — THANH PHỔ 380–780 nm dùng chung cho cả 3 mô phỏng.
 * Mô phỏng đang mở cung cấp danh sách vạch {id, nm, I}; thanh phổ tự làm mượt cường độ,
 * vẽ glow, nhận hover/bấm để chọn vạch (đồng bộ qua store). */
(function () {
  'use strict';
  const AL = window.AL;
  const PAD = 40, AXIS = 16, SPAN = 400;

  const S = (AL.Spectrum = {
    disp: new Map(), flashes: [], uvG: 0, irG: 0,
    hover: null, w: 0, h: 0, dpr: 1, last: null,
    onSelect: null,

    mount(cv, tip) {
      this.cv = cv; this.ctx = cv.getContext('2d'); this.tip = tip;
      this.bg = document.createElement('canvas');
      this.bg.width = SPAN; this.bg.height = 1;
      const b = this.bg.getContext('2d');
      for (let i = 0; i < SPAN; i++) {
        const nm = 380 + i, [r, g, bl] = AL.nmRGB(nm), v = AL.nmVis(nm);
        b.fillStyle = `rgba(${r},${g},${bl},${(0.2 * v).toFixed(3)})`;
        b.fillRect(i, 0, 1, 1);
      }
      new ResizeObserver(() => this.resize()).observe(cv);
      this.resize();
      const pos = (e) => { const r = cv.getBoundingClientRect(); return e.clientX - r.left; };
      cv.addEventListener('pointermove', (e) => this.setHover(this.hit(pos(e))));
      cv.addEventListener('pointerleave', () => this.setHover(null));
      cv.addEventListener('pointerdown', (e) => {
        const id = this.hit(pos(e));
        this.setHover(id);
        if (id && this.onSelect) this.onSelect(id);
        if (e.pointerType !== 'mouse') { clearTimeout(this._tt); this._tt = setTimeout(() => this.setHover(null), 2600); }
      });
    },

    resize() {
      const r = this.cv.getBoundingClientRect();
      this.dpr = Math.min(2, window.devicePixelRatio || 1);
      this.w = r.width; this.h = r.height;
      this.cv.width = Math.round(r.width * this.dpr); this.cv.height = Math.round(r.height * this.dpr);
    },

    xFor(nm) {
      if (nm < 380) return PAD / 2;
      if (nm > 780) return this.w - PAD / 2;
      return PAD + ((nm - 380) / SPAN) * (this.w - PAD * 2);
    },
    viewportPoint(nm) {
      const r = this.cv.getBoundingClientRect();
      return { x: r.left + this.xFor(nm), y: r.top + (this.h - AXIS) / 2 };
    },
    flash(nm) {
      if (nm < 380) this.uvG = 1; else if (nm > 780) this.irG = 1;
      else this.flashes.push({ nm, t: 0 });
    },
    reset() { this.disp.clear(); this.flashes = []; },

    hit(x) {
      const L = this.last; if (!L) return null;
      let best = null, bd = 12;
      const cand = L.lines.filter((l) => (this.disp.get(l.id) || 0) > 0.04).concat(L.refs || []);
      for (const l of cand) {
        if (l.nm < 380 || l.nm > 780) continue;
        const d = Math.abs(this.xFor(l.nm) - x) - (l.w ? (l.w / SPAN) * (this.w - PAD * 2) * 0.5 : 0);
        if (d < bd) { bd = d; best = l.id; }
      }
      return best;
    },

    setHover(id) {
      this.hover = id;
      const tip = this.tip;
      const info = id && AL.DATA.line(id);
      if (!info) { tip.hidden = true; return; }
      const sp = AL.DATA.sp(info.sp) || {};
      const eV = AL.eV(info.nm);
      const sel = AL.store.state.line === id;
      tip.innerHTML =
        `<div class="tip-h"><i style="background:${AL.nmCSS(info.nm)}"></i><b>${AL.fmt(info.nm, 1)} nm</b><span>${AL.colorName(info.nm)}</span></div>` +
        `<div class="tip-sp"><b style="color:${sp.color || '#fff'}">${sp.sym || ''}</b> ${AL.esc(sp.name || '')}${info.tr ? ' · ' + info.tr : ''}${info.mol ? ' · ' + info.mol : ''}</div>` +
        `<div class="tip-kv">ΔE = ${AL.fmt(eV, 2)} eV${info.alt ? ' · độ cao ' + info.alt : ''}${info.w ? ' · rộng ~' + info.w + ' nm' : ''}</div>` +
        (info.d ? `<div class="tip-d">${AL.esc(info.d)}</div>` : '') +
        `<div class="tip-f">${sel ? 'Đang chọn · bấm lần nữa để bỏ chọn' : 'Bấm để chọn vạch này'}</div>`;
      tip.hidden = false;
      const x = this.xFor(info.nm), tw = tip.offsetWidth || 260;
      tip.style.left = AL.clamp(x, tw / 2 + 4, this.w - tw / 2 - 4) + 'px';
    },

    /* data: { lines:[{id,nm,I}], refs:[{id,nm}], uv, ir, empty } */
    draw(dt, data) {
      this.last = data;
      const c = this.ctx, w = this.w, H = this.h - AXIS, x0 = PAD, x1 = w - PAD;
      if (!w) return;
      c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      c.clearRect(0, 0, w, this.h);
      c.fillStyle = '#020306'; c.fillRect(0, 0, w, H);
      c.imageSmoothingEnabled = true;
      c.drawImage(this.bg, x0, 0, x1 - x0, H);
      const vg = c.createLinearGradient(0, 0, 0, H);
      vg.addColorStop(0, 'rgba(2,3,6,.55)'); vg.addColorStop(0.5, 'rgba(2,3,6,0)'); vg.addColorStop(1, 'rgba(2,3,6,.55)');
      c.fillStyle = vg; c.fillRect(x0, 0, x1 - x0, H);

      // Hai ô tử ngoại / hồng ngoại
      this.uvG = Math.max(0, this.uvG - dt * 1.4); this.irG = Math.max(0, this.irG - dt * 1.4);
      this.edge(c, 0, PAD, H, 'UV', data.uv, this.uvG, [176, 140, 255]);
      this.edge(c, x1, PAD, H, 'IR', data.ir, this.irG, [220, 70, 60]);

      // Làm mượt cường độ
      const target = new Map();
      for (const l of data.lines) target.set(l.id, l);
      for (const id of target.keys()) if (!this.disp.has(id)) this.disp.set(id, 0);
      const k = Math.min(1, dt * 5);
      let any = false;
      c.save();
      c.beginPath(); c.rect(x0, 0, x1 - x0, H); c.clip();
      c.globalCompositeOperation = 'lighter';
      const labels = [];
      for (const [id, v] of this.disp) {
        const l = target.get(id), I = l ? l.I : 0;
        const nv = v + (I - v) * k;
        if (nv < 0.004 && !l) { this.disp.delete(id); continue; }
        this.disp.set(id, nv);
        const info = AL.DATA.line(id); if (!info || info.nm < 380 || info.nm > 780) continue;
        if (nv > 0.02) any = true;
        this.line(c, info, nv, H);
        if (nv > 0.28 && !info.w) labels.push({ x: this.xFor(info.nm), v: nv, nm: info.nm });
      }
      // Chớp sáng khi photon chạm thanh phổ
      for (const f of this.flashes) {
        f.t += dt; const a = 1 - f.t / 0.6; if (a <= 0) continue;
        const x = this.xFor(f.nm), [r, g, b] = AL.nmRGB(f.nm), rad = 6 + f.t * 60;
        const gr = c.createRadialGradient(x, H / 2, 0, x, H / 2, rad);
        gr.addColorStop(0, `rgba(255,255,255,${a})`); gr.addColorStop(0.3, `rgba(${r},${g},${b},${a * 0.8})`); gr.addColorStop(1, `rgba(${r},${g},${b},0)`);
        c.fillStyle = gr; c.fillRect(x - rad, H / 2 - rad, rad * 2, rad * 2);
      }
      this.flashes = this.flashes.filter((f) => f.t < 0.6);
      c.globalCompositeOperation = 'source-over';

      // Vạch tham chiếu (chế độ Đầy đủ / so sánh)
      for (const r of data.refs || []) {
        if (r.nm < 380 || r.nm > 780) continue;
        const x = this.xFor(r.nm);
        c.fillStyle = AL.nmCSS(r.nm, 0.95);
        c.fillRect(x - 0.75, H - 9, 1.5, 9); c.fillRect(x - 0.75, 0, 1.5, 5);
        if (r.w) { c.fillStyle = AL.nmCSS(r.nm, 0.18); const ww = (r.w / SPAN) * (x1 - x0); c.fillRect(x - ww / 2, H - 4, ww, 4); }
      }

      // Nhãn bước sóng của các vạch sáng
      labels.sort((a, b) => b.v - a.v);
      const placed = [];
      c.font = '600 10px "JetBrains Mono", ui-monospace, monospace'; c.textAlign = 'center'; c.textBaseline = 'top';
      for (const L of labels) {
        if (placed.some((p) => Math.abs(p - L.x) < 34)) continue;
        placed.push(L.x);
        c.fillStyle = `rgba(255,255,255,${(0.45 + 0.5 * L.v).toFixed(2)})`;
        c.fillText(AL.fmt(L.nm, 1), L.x, 3);
      }

      // Vạch đang chọn và vạch đang hover
      const sel = AL.store.state.line && AL.DATA.line(AL.store.state.line);
      if (sel && sel.nm >= 380 && sel.nm <= 780) this.marker(c, this.xFor(sel.nm), H, true);
      const hv = this.hover && AL.DATA.line(this.hover);
      if (hv && (!sel || hv.id !== sel.id)) this.marker(c, this.xFor(hv.nm), H, false);
      c.restore();

      if (!any && data.empty) {
        // co cỡ chữ cho vừa bề rộng thanh phổ (màn hẹp)
        let fs = 12.5;
        c.font = `500 ${fs}px "Be Vietnam Pro", system-ui, sans-serif`;
        const tw = c.measureText(data.empty).width, room = x1 - x0 - 16;
        if (tw > room) { fs = Math.max(9.5, (fs * room) / tw); c.font = `500 ${fs}px "Be Vietnam Pro", system-ui, sans-serif`; }
        c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillStyle = 'rgba(200,210,225,.6)';
        c.fillText(data.empty, w / 2, H / 2, room);
      }

      // Trục bước sóng
      c.strokeStyle = 'rgba(255,255,255,.1)'; c.lineWidth = 1;
      c.beginPath(); c.moveTo(0, H + 0.5); c.lineTo(w, H + 0.5); c.stroke();
      c.font = '500 10px "JetBrains Mono", ui-monospace, monospace'; c.textBaseline = 'top'; c.textAlign = 'center';
      for (let nm = 400; nm <= 750; nm += 50) {
        const x = this.xFor(nm);
        c.fillStyle = 'rgba(255,255,255,.22)'; c.fillRect(x - 0.5, H, 1, 4);
        c.fillStyle = 'rgba(190,200,215,.6)'; c.fillText(nm, x, H + 4);
      }
      c.textAlign = 'right'; c.fillStyle = 'rgba(190,200,215,.4)'; c.fillText('nm', w - 4, H + 4);
    },

    line(c, info, v, H) {
      const x = this.xFor(info.nm), [r, g, b] = AL.nmRGB(info.nm), vis = 0.45 + 0.55 * AL.nmVis(info.nm);
      const a = Math.min(1, v) * vis;
      if (info.w) {
        const ww = Math.max(6, (info.w / SPAN) * (this.w - PAD * 2));
        const gr = c.createLinearGradient(x - ww, 0, x + ww, 0);
        gr.addColorStop(0, `rgba(${r},${g},${b},0)`); gr.addColorStop(0.5, `rgba(${r},${g},${b},${a * 0.85})`); gr.addColorStop(1, `rgba(${r},${g},${b},0)`);
        c.fillStyle = gr; c.fillRect(x - ww, 0, ww * 2, H);
        return;
      }
      const gw = 9 + 10 * v;
      const gr = c.createLinearGradient(x - gw, 0, x + gw, 0);
      gr.addColorStop(0, `rgba(${r},${g},${b},0)`); gr.addColorStop(0.5, `rgba(${r},${g},${b},${a * 0.6})`); gr.addColorStop(1, `rgba(${r},${g},${b},0)`);
      c.fillStyle = gr; c.fillRect(x - gw, 0, gw * 2, H);
      const [cr, cg, cb] = AL.mixRGB([r, g, b], [255, 255, 255], Math.min(0.75, v * 0.6));
      c.fillStyle = `rgba(${cr | 0},${cg | 0},${cb | 0},${a})`;
      c.fillRect(x - 1, 0, 2, H);
    },

    marker(c, x, H, solid) {
      c.strokeStyle = solid ? 'rgba(255,255,255,.85)' : 'rgba(255,255,255,.45)';
      c.lineWidth = 1; c.setLineDash(solid ? [] : [3, 3]);
      c.strokeRect(x - 9.5, 1.5, 19, H - 3);
      c.setLineDash([]);
      if (solid) {
        c.fillStyle = '#fff';
        c.beginPath(); c.moveTo(x - 5, 0); c.lineTo(x + 5, 0); c.lineTo(x, 6); c.fill();
        c.beginPath(); c.moveTo(x - 5, H); c.lineTo(x + 5, H); c.lineTo(x, H - 6); c.fill();
      }
    },

    edge(c, x, w, H, lab, n, glow, rgb) {
      c.fillStyle = '#05060a'; c.fillRect(x, 0, w, H);
      if (glow > 0) {
        const gr = c.createRadialGradient(x + w / 2, H / 2, 0, x + w / 2, H / 2, w);
        gr.addColorStop(0, AL.rgba(rgb, 0.55 * glow)); gr.addColorStop(1, AL.rgba(rgb, 0));
        c.fillStyle = gr; c.fillRect(x, 0, w, H);
      }
      c.fillStyle = 'rgba(255,255,255,.08)'; c.fillRect(lab === 'UV' ? x + w - 1 : x, 0, 1, H);
      c.textAlign = 'center'; c.textBaseline = 'middle';
      c.font = '700 10px "Chakra Petch", system-ui, sans-serif';
      c.fillStyle = AL.rgba(rgb, 0.55 + 0.45 * glow);
      c.fillText(lab, x + w / 2, H / 2 - (n ? 7 : 0));
      if (n) { c.font = '600 10px "JetBrains Mono", monospace'; c.fillStyle = 'rgba(220,225,235,.6)'; c.fillText('×' + n, x + w / 2, H / 2 + 8); }
    },
  });
})();
