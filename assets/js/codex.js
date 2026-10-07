/* Aurora-LAB — USACodex: thư viện mô phỏng khái niệm có sẵn.
 * Mỗi bài dạy đúng một khái niệm nền tảng, có một điều khiển, phần "Ghi nhớ"
 * và lối sang thí nghiệm chính tương ứng. */
(function () {
  'use strict';
  const AL = window.AL, D = AL.DATA, h = AL.h, { fmt, clamp, lerp, ease } = AL;
  const MONO = '"JetBrains Mono", ui-monospace, monospace';
  const BODY = '"Be Vietnam Pro", system-ui, sans-serif';
  const DISP = '"Chakra Petch", system-ui, sans-serif';
  const ORANGE = [255, 138, 43];
  const TAU = Math.PI * 2;

  // ---------- Tiện ích vẽ ----------
  const glow = (c, x, y, r, rgb, a = 1) => {
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(255,255,255,${a})`); g.addColorStop(0.3, AL.rgba(rgb, a * 0.9)); g.addColorStop(1, AL.rgba(rgb, 0));
    c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2);
  };
  const txt = (c, s, x, y, o = {}) => {
    c.font = o.font || `500 12px ${BODY}`; c.fillStyle = o.color || 'rgba(220,228,240,.85)';
    c.textAlign = o.align || 'left'; c.textBaseline = o.base || 'middle'; c.fillText(s, x, y);
  };
  const arrow = (c, x0, y0, x1, y1, col, lw = 2) => {
    const a = Math.atan2(y1 - y0, x1 - x0);
    c.strokeStyle = col; c.fillStyle = col; c.lineWidth = lw;
    c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1 - Math.cos(a) * 7, y1 - Math.sin(a) * 7); c.stroke();
    c.beginPath(); c.moveTo(x1, y1); c.lineTo(x1 - Math.cos(a - 0.45) * 9, y1 - Math.sin(a - 0.45) * 9); c.lineTo(x1 - Math.cos(a + 0.45) * 9, y1 - Math.sin(a + 0.45) * 9); c.fill();
  };
  const nmCol = (nm) => (nm < 380 ? [176, 140, 255] : nm > 780 ? [210, 70, 60] : AL.nmRGB(nm));
  // Thanh phổ có vùng UV / khả kiến / IR; trả về hàm đổi nm → x
  const strip = (c, x, y, w, hh, lo, hi, log, opt = {}) => {
    const L = (v) => (log ? Math.log(v) : v), span = L(hi) - L(lo);
    const X = (nm) => x + ((L(nm) - L(lo)) / span) * w;
    for (let i = 0; i < w; i += 2) {
      const nm = log ? Math.exp(L(lo) + (span * i) / w) : lo + (span * i) / w;
      if (opt.dark) c.fillStyle = '#020306';
      else if (nm < 380) c.fillStyle = 'rgba(120,90,220,.16)';
      else if (nm > 780) c.fillStyle = 'rgba(200,60,50,.14)';
      else { const [r, g, b] = AL.nmRGB(nm); c.fillStyle = `rgba(${r},${g},${b},${(opt.bright || 0.32) * AL.nmVis(nm)})`; }
      c.fillRect(x + i, y, 2, hh);
    }
    c.strokeStyle = 'rgba(255,255,255,.15)'; c.lineWidth = 1; c.strokeRect(x + 0.5, y + 0.5, w - 1, hh - 1);
    c.font = `500 10px ${MONO}`; c.textAlign = 'center'; c.textBaseline = 'top'; c.fillStyle = 'rgba(190,200,215,.6)';
    for (const t of opt.ticks || []) { const tx = X(t); c.fillRect(tx - 0.5, y + hh, 1, 4); c.fillText(t, tx, y + hh + 5); }
    if (lo < 380) txt(c, 'UV', (X(Math.max(lo, lo)) + X(Math.min(380, hi))) / 2, y + hh / 2, { align: 'center', font: `700 10px ${DISP}`, color: 'rgba(190,160,255,.75)' });
    if (hi > 780) txt(c, 'IR', (X(Math.max(780, lo)) + X(hi)) / 2, y + hh / 2, { align: 'center', font: `700 10px ${DISP}`, color: 'rgba(255,130,110,.7)' });
    return X;
  };
  const markLine = (c, x, y, hh, nm, a = 1, w = 2) => {
    const rgb = nmCol(nm);
    c.save(); c.globalCompositeOperation = 'lighter';
    const g = c.createLinearGradient(x - 10, 0, x + 10, 0);
    g.addColorStop(0, AL.rgba(rgb, 0)); g.addColorStop(0.5, AL.rgba(rgb, 0.6 * a)); g.addColorStop(1, AL.rgba(rgb, 0));
    c.fillStyle = g; c.fillRect(x - 10, y, 20, hh);
    c.fillStyle = AL.rgba(AL.mixRGB(rgb, [255, 255, 255], 0.4), a); c.fillRect(x - w / 2, y, w, hh);
    c.restore();
  };
  const bg = (c, w, hh) => { c.fillStyle = '#03050a'; c.fillRect(0, 0, w, hh); };

  // ---------- Thành phần điều khiển ----------
  const slider = (label, min, max, step, value, fmtv, onInput) => {
    const out = h('output', { class: 'sl-v' }, fmtv(value));
    const input = h('input', { type: 'range', class: 'range', min, max, step, value, 'aria-label': label });
    const paint = () => input.style.setProperty('--p', ((input.value - min) / (max - min)) * 100 + '%');
    input.addEventListener('input', () => { paint(); out.textContent = fmtv(+input.value); onInput(+input.value); });
    paint();
    const el = h('div', { class: 'slider cx-slider' }, h('div', { class: 'sl-h' }, h('span', null, label), out), input);
    el.set = (v) => { input.value = v; paint(); out.textContent = fmtv(v); };
    return el;
  };
  const chips = (items, onPick) => h('div', { class: 'cx-chips' }, items.map(([label, v]) => h('button', { type: 'button', class: 'cx-chip', onclick: () => onPick(v) }, label)));
  const seg = (opts, value, onChange) => AL.ui.seg(opts, value, onChange);

  // ======================================================================
  // CÁC BÀI MÔ PHỎNG
  // ======================================================================
  const concepts = [];

  // 1 — Bước sóng, màu sắc và năng lượng photon
  concepts.push({
    id: 'wave', group: 'Ánh sáng và nguyên tử', title: 'Bước sóng, màu sắc và năng lượng photon',
    q: 'Vì sao ánh sáng tím mang nhiều năng lượng hơn ánh sáng đỏ?',
    lab: ['Thử trong thí nghiệm Nguyên tử', () => AL.app.goLab('atom', { el: 'O' })],
    init(ctl) {
      const s = (this.s = { lam: 557.7 });
      const toPos = (nm) => (Math.log(nm / 100) / Math.log(15)) * 100, toNm = (p) => 100 * Math.pow(15, p / 100);
      const read = h('div', { class: 'cx-read' });
      const upd = () => { const nm = s.lam, reg = AL.region(nm); read.innerHTML = `λ = <b style="color:${AL.rgba(nmCol(nm), 1)}">${AL.fmtNm(nm)}</b> · f = ${AL.sci(AL.freq(nm))} Hz · E = <b>${fmt(AL.eV(nm), 2)} eV</b> · ${reg === 'VIS' ? AL.colorName(nm) : reg === 'UV' ? 'tử ngoại' : 'hồng ngoại'}`; };
      const sl = slider('Bước sóng λ', 0, 100, 0.1, toPos(s.lam), (p) => AL.fmtNm(toNm(p)), (p) => { s.lam = toNm(p); upd(); });
      ctl.append(sl, chips([['Hα 656,3', 656.3], ['Na 589,0', 589], ['O 557,7', 557.7], ['Hβ 486,1', 486.1], ['N₂⁺ 427,8', 427.8], ['UV 250', 250], ['IR 1000', 1000]], (v) => { s.lam = v; sl.set(toPos(v)); upd(); }), read);
      upd();
    },
    draw(c, w, hh, t) {
      bg(c, w, hh);
      const nm = this.s.lam, rgb = nmCol(nm), lamPx = nm / 7, y0 = hh * 0.38, amp = hh * 0.16;
      // sóng truyền sang phải
      c.save(); c.globalCompositeOperation = 'lighter';
      for (const [lw, a] of [[8, 0.12], [3, 0.9]]) {
        c.strokeStyle = AL.rgba(rgb, a); c.lineWidth = lw; c.beginPath();
        for (let x = 20; x <= w - 20; x += 2) { const y = y0 - Math.sin(((x - t * 90) / lamPx) * TAU) * amp; x === 20 ? c.moveTo(x, y) : c.lineTo(x, y); }
        c.stroke();
      }
      c.restore();
      // thước đo một bước sóng
      const ph = (t * 90) % lamPx, xa = 20 + ((lamPx / 4 + ph) % lamPx) + lamPx, xb = xa + lamPx;
      if (xb < w - 20) {
        c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 1; c.setLineDash([3, 3]);
        c.beginPath(); c.moveTo(xa, y0 - amp - 4); c.lineTo(xa, y0 - amp - 22); c.moveTo(xb, y0 - amp - 4); c.lineTo(xb, y0 - amp - 22); c.stroke(); c.setLineDash([]);
        arrow(c, (xa + xb) / 2, y0 - amp - 16, xb, y0 - amp - 16, 'rgba(255,255,255,.7)', 1); arrow(c, (xa + xb) / 2, y0 - amp - 16, xa, y0 - amp - 16, 'rgba(255,255,255,.7)', 1);
        txt(c, 'λ', (xa + xb) / 2, y0 - amp - 30, { align: 'center', font: `700 13px ${MONO}`, color: '#fff' });
      }
      // thanh năng lượng photon
      const E = AL.eV(nm), bx = w - 46, bh = hh * 0.5, by = hh * 0.12, f = clamp(E / 6, 0, 1);
      c.fillStyle = 'rgba(255,255,255,.06)'; c.fillRect(bx, by, 14, bh);
      c.fillStyle = AL.rgba(ORANGE, 0.9); c.fillRect(bx, by + bh * (1 - f), 14, bh * f);
      txt(c, 'E', bx + 7, by - 10, { align: 'center', font: `700 11px ${MONO}`, color: '#ffb066' });
      txt(c, `${fmt(E, 2)} eV`, bx + 7, by + bh + 12, { align: 'center', font: `600 10.5px ${MONO}` });
      // thanh phổ log 100–1500 nm
      const sy = hh * 0.74, X = strip(c, 30, sy, w - 60, 26, 100, 1500, true, { ticks: [200, 400, 700, 1000], bright: 0.75 });
      const mx = X(nm);
      c.fillStyle = '#fff'; c.beginPath(); c.moveTo(mx - 6, sy - 9); c.lineTo(mx + 6, sy - 9); c.lineTo(mx, sy - 1); c.fill();
      txt(c, 'vùng mắt người nhìn thấy: 380–780 nm', (X(380) + X(780)) / 2, sy - 18, { align: 'center', font: `500 11px ${BODY}`, color: 'rgba(210,220,235,.7)' });
    },
    text: 'Ánh sáng vừa là sóng điện từ, vừa là dòng các hạt photon. Bước sóng λ quyết định màu sắc và năng lượng của mỗi photon theo hệ thức E = hc/λ. Mắt người chỉ cảm nhận được bức xạ có λ trong khoảng 380–780 nm; ngắn hơn là tử ngoại (UV), dài hơn là hồng ngoại (IR).',
    key: 'λ càng ngắn thì tần số càng lớn và photon càng nhiều năng lượng. Ánh sáng tím (≈ 400 nm) mang khoảng 3,1 eV; ánh sáng đỏ (≈ 700 nm) khoảng 1,8 eV.',
  });

  // 2 — Năng lượng lượng tử hóa: chỉ hấp thụ đúng ΔE
  const H_LV = [[2, 10.204], [3, 12.094], [4, 12.755], [5, 13.061], [6, 13.228]];
  concepts.push({
    id: 'absorb', group: 'Ánh sáng và nguyên tử', title: 'Năng lượng bị lượng tử hóa',
    q: 'Nguyên tử có hấp thụ mọi photon chiếu vào nó không?',
    lab: ['Thử trong thí nghiệm Nguyên tử (H)', () => AL.app.goLab('atom', { el: 'H' })],
    init(ctl) {
      const s = (this.s = { lam: 600, ps: [], cur: 0, hold: 0, fire: 0, dark: {}, msg: '' });
      const sl = slider('Bước sóng photon chiếu vào', 380, 700, 0.1, s.lam, (v) => fmt(v, 1) + ' nm', (v) => (s.lam = v));
      ctl.append(sl, chips([['656,3 nm', 656.3], ['600,0 nm', 600], ['486,1 nm', 486.1], ['434,0 nm', 434.0], ['410,2 nm', 410.2]], (v) => { s.lam = v; sl.set(v); }));
    },
    draw(c, w, hh, t, dt) {
      bg(c, w, hh);
      const s = this.s, ax = w < 560 ? w * 0.6 : w * 0.66, top = hh * 0.12, bot = hh * 0.62;
      const yE = (E) => bot - ((E - 10.0) / 3.45) * (bot - top);
      // các mức
      H_LV.forEach(([n, E], i) => {
        const y = yE(E), on = i === s.cur;
        c.strokeStyle = on ? '#ff6f91' : 'rgba(235,240,250,.4)'; c.lineWidth = on ? 2.4 : 1.4;
        c.beginPath(); c.moveTo(ax - 70, y); c.lineTo(ax + 120, y); c.stroke();
        txt(c, `n = ${n}`, ax - 78, y, { align: 'right', font: `600 11.5px ${MONO}`, color: on ? '#ff6f91' : 'rgba(205,213,226,.75)' });
        if (i && w >= 560) txt(c, `ΔE = ${fmt(E - H_LV[0][1], 2)} eV`, ax + 128, y, { font: `500 10.5px ${MONO}`, color: 'rgba(170,180,195,.7)' });
      });
      txt(c, 'nguyên tử hydrogen (electron ở mức n = 2)', ax + 25, bot + 22, { align: 'center', font: `500 11px ${BODY}`, color: 'rgba(170,180,195,.7)' });
      // bắn photon liên tục
      s.fire -= dt;
      if (s.fire <= 0 && s.cur === 0) { s.fire = 0.55; s.ps.push({ x: 20, lam: s.lam, y: yE(H_LV[0][1]) - 26 }); }
      for (const p of s.ps) {
        p.x += dt * 560;
        if (!p.done && p.x >= ax - 10) {
          p.done = true;
          const hit = H_LV.findIndex(([, e], i) => i > 0 && Math.abs(AL.HC / (e - H_LV[0][1]) - p.lam) < 1.6);
          if (hit > 0 && s.cur === 0) { p.dead = true; s.cur = hit; s.hold = 1.1; s.msg = `Hấp thụ! ${fmt(p.lam, 1)} nm khớp với chuyển mức n = 2 → n = ${H_LV[hit][0]}`; s.dark[Math.round(p.lam * 10)] = Math.min(1, (s.dark[Math.round(p.lam * 10)] || 0) + 0.35); }
          else s.msg = `${fmt(p.lam, 1)} nm không khớp với khoảng cách nào giữa các mức → photon đi xuyên qua`;
        }
        const rgb = nmCol(p.lam), yy = p.y + Math.sin(p.x / (p.lam / 22)) * 4;
        if (!p.dead) { c.save(); c.globalCompositeOperation = 'lighter'; glow(c, p.x, yy, 11, rgb, p.done ? 0.55 : 1); c.restore(); }
      }
      s.ps = s.ps.filter((p) => !p.dead && p.x < w + 20);
      if (s.cur > 0) { s.hold -= dt; if (s.hold <= 0) s.cur = 0; }
      // electron
      const ey = yE(H_LV[s.cur][1]);
      c.save(); c.globalCompositeOperation = 'lighter'; glow(c, ax + 10, ey, 12, [255, 111, 145]); c.restore();
      if (s.msg) txt(c, s.msg, 20, hh * 0.04 + 8, { font: `600 12px ${BODY}`, color: s.cur ? '#7dffa0' : 'rgba(220,228,240,.8)' });
      // phổ hấp thụ tích lũy
      const sy = hh * 0.78, X = strip(c, 30, sy, w - 60, 26, 380, 700, false, { ticks: [400, 450, 500, 550, 600, 650, 700], bright: 0.85 });
      for (const k in s.dark) { const x = X(k / 10); c.fillStyle = `rgba(2,3,6,${0.95 * s.dark[k]})`; c.fillRect(x - 1.5, sy + 1, 3, 24); }
      c.fillStyle = '#fff'; const mx = X(s.lam); c.beginPath(); c.moveTo(mx - 5, sy - 8); c.lineTo(mx + 5, sy - 8); c.lineTo(mx, sy - 1); c.fill();
      txt(c, 'phổ ánh sáng sau khi đi qua khí hydrogen (vạch tối = bị hấp thụ)', 30, sy - 14, { font: `500 10.5px ${BODY}`, color: 'rgba(190,200,215,.6)' });
    },
    text: 'Năng lượng của electron trong nguyên tử chỉ nhận những giá trị xác định. Một photon chỉ bị hấp thụ khi năng lượng của nó đúng bằng khoảng cách ΔE giữa mức hiện tại và một mức cao hơn; mọi photon khác đi xuyên qua nguyên tử. Kéo thanh trượt để tìm những bước sóng mà hydrogen hấp thụ.',
    key: 'Nguyên tử chỉ nhận “trọn gói” đúng ΔE, không nhận một phần. Những bước sóng bị hấp thụ tạo thành các vạch tối trong quang phổ.',
  });

  // 3 — Phát xạ photon: ΔE quyết định màu
  concepts.push({
    id: 'emit', group: 'Ánh sáng và nguyên tử', title: 'Phát xạ photon khi electron chuyển mức',
    q: 'Điều gì quyết định màu của ánh sáng mà nguyên tử phát ra?',
    lab: ['Thử trong thí nghiệm Nguyên tử', () => AL.app.goLab('atom', { el: 'Na' })],
    init(ctl) {
      const s = (this.s = { dE: 2.104, ph: 0, ps: [], hist: [] });
      ctl.append(slider('Khoảng cách giữa hai mức ΔE', 1.6, 3.3, 0.005, s.dE, (v) => `${fmt(v, 2)} eV → λ ≈ ${fmt(AL.HC / v, 0)} nm`, (v) => (s.dE = v)),
        chips([['Na 2,10 eV', 2.104], ['O 2,22 eV', 2.223], ['O 1,97 eV', 1.968], ['N₂⁺ 2,90 eV', 2.898]], (v) => { s.dE = v; ctl.querySelector('.cx-slider').set(v); }));
    },
    draw(c, w, hh, t, dt) {
      bg(c, w, hh);
      const s = this.s, lam = AL.HC / s.dE, rgb = nmCol(lam);
      const ax = w * 0.24, low = hh * 0.62, gap = (s.dE / 3.3) * hh * 0.48, up = low - gap;
      // vòng lặp: lên → dừng → rơi + phát photon
      s.ph += dt / 1.6; if (s.ph >= 1) { s.ph = 0; }
      const k = s.ph;
      let ey = low;
      if (k < 0.25) ey = lerp(low, up, ease.inOut(k / 0.25));
      else if (k < 0.55) ey = up;
      else if (k < 0.7) ey = lerp(up, low, ease.in((k - 0.55) / 0.15));
      if (k >= 0.7 && !s.emitted) { s.emitted = true; s.ps.push({ x: ax + 60, y: low - gap / 2, lam }); }
      if (k < 0.7) s.emitted = false;
      for (const [y, lb] of [[up, 'mức kích thích'], [low, 'mức thấp']]) {
        c.strokeStyle = 'rgba(235,240,250,.55)'; c.lineWidth = 2; c.beginPath(); c.moveTo(ax - 70, y); c.lineTo(ax + 70, y); c.stroke();
        txt(c, lb, ax - 78, y, { align: 'right', font: `500 11px ${BODY}`, color: 'rgba(190,200,215,.7)' });
      }
      arrow(c, ax + 40, up, ax + 40, low, AL.rgba(rgb, 0.85), 2.4);
      txt(c, `ΔE = ${fmt(s.dE, 2)} eV`, ax + 50, (up + low) / 2, { font: `700 12px ${MONO}`, color: '#fff' });
      c.save(); c.globalCompositeOperation = 'lighter'; glow(c, ax - 10, ey, 12, [140, 200, 255]); c.restore();
      // photon bay sang thanh phổ
      const sy = hh * 0.8, X = strip(c, 30, sy, w - 60, 26, 380, 780, false, { dark: true, ticks: [400, 500, 600, 700] });
      for (const p of s.ps) {
        p.t = (p.t || 0) + dt / 1.1; const T = ease.inOut(Math.min(1, p.t));
        const tx = X(p.lam), x = lerp(p.x, tx, T), y = lerp(p.y, sy, T) - Math.sin(T * Math.PI) * 40;
        c.save(); c.globalCompositeOperation = 'lighter'; glow(c, x, y, 12, nmCol(p.lam)); c.restore();
        if (p.t >= 1 && !p.hit) { p.hit = true; s.hist.push({ lam: p.lam, a: 1 }); }
      }
      s.ps = s.ps.filter((p) => !p.hit);
      for (const m of s.hist) { m.a -= dt * 0.12; if (m.a > 0) markLine(c, X(m.lam), sy, 26, m.lam, m.a); }
      s.hist = s.hist.filter((m) => m.a > 0);
      txt(c, `λ = 1240 / ${fmt(s.dE, 2)} ≈ ${fmt(lam, 1)} nm · ${AL.colorName(lam)}`, w < 560 ? 16 : w * 0.55, w < 560 ? 18 : hh * 0.32, { font: `700 ${w < 560 ? 13 : 15}px ${MONO}`, color: AL.rgba(rgb, 1) });
    },
    text: 'Electron ở trạng thái kích thích không bền. Khi chuyển về mức thấp hơn, nó giải phóng phần năng lượng chênh lệch ΔE dưới dạng một photon. Hai mức càng cách xa nhau, photon càng mang nhiều năng lượng và bước sóng càng ngắn (lệch về phía xanh, tím).',
    key: 'λ (nm) ≈ 1240 / ΔE (eV). Mỗi nguyên tố có bộ khoảng cách ΔE riêng, nên phát ra bộ màu riêng.',
  });

  // 4 — Các dãy phổ của hydrogen
  concepts.push({
    id: 'series', group: 'Ánh sáng và nguyên tử', title: 'Các dãy phổ của hydrogen',
    q: 'Vì sao hydrogen có vạch tử ngoại, khả kiến và hồng ngoại?',
    lab: ['Thử trong thí nghiệm Nguyên tử (H)', () => AL.app.goLab('atom', { el: 'H', ghost: true })],
    init(ctl) {
      this.s = { n: 2 };
      ctl.append(seg([[1, 'Lyman (về n = 1)'], [2, 'Balmer (về n = 2)'], [3, 'Paschen (về n = 3)']], 2, (v) => (this.s.n = v)));
    },
    draw(c, w, hh, t) {
      bg(c, w, hh);
      const nl = this.s.n, E = (n) => 13.606 * (1 - 1 / (n * n));
      const top = hh * 0.08, bot = hh * 0.58, x0 = 90, x1 = w - 30;
      const yE = (e) => (e < 5 ? bot : top + (1 - (e - 9.9) / 3.75) * (bot - top - 20));
      for (let n = 1; n <= 6; n++) {
        const y = yE(E(n));
        c.strokeStyle = n === nl ? '#ff6f91' : 'rgba(235,240,250,.4)'; c.lineWidth = n === nl ? 2.2 : 1.3;
        c.beginPath(); c.moveTo(x0, y); c.lineTo(x1, y); c.stroke();
        txt(c, `n = ${n}`, n === 6 ? x0 - 54 : x0 - 10, n === 6 ? y - 6 : y, { align: 'right', font: `600 11px ${MONO}`, color: n === nl ? '#ff6f91' : 'rgba(205,213,226,.75)' });
      }
      txt(c, '≈', 40, (bot + yE(E(2))) / 2, { font: `700 14px ${MONO}`, color: 'rgba(255,255,255,.4)' });
      const lines = [];
      for (let u = nl + 1; u <= 6; u++) {
        const vac = 1e7 / (109678 * (1 / (nl * nl) - 1 / (u * u))), lam = vac > 200 ? vac / 1.000277 : vac; // bước sóng trong không khí
        const x = x0 + 60 + (u - nl - 1) * ((x1 - x0 - 120) / 4);
        const pulse = 0.55 + 0.45 * Math.sin(t * 3 - u);
        arrow(c, x, yE(E(u)), x, yE(E(nl)), AL.rgba(nmCol(lam), pulse), 2.2);
        txt(c, AL.fmtNm(lam), x + 6, (yE(E(u)) + yE(E(nl))) / 2, { font: `600 10.5px ${MONO}`, color: AL.rgba(nmCol(lam), 1) });
        lines.push(lam);
      }
      const sy = hh * 0.74, X = strip(c, 30, sy, w - 60, 28, 80, 2000, true, { ticks: [100, 200, 400, 700, 1000, 2000], bright: 0.7 });
      for (const lam of lines) markLine(c, X(lam), sy, 28, lam, 1, 2);
      const name = { 1: 'Dãy Lyman: toàn bộ nằm trong vùng tử ngoại', 2: 'Dãy Balmer: bốn vạch nằm trong vùng khả kiến', 3: 'Dãy Paschen: toàn bộ nằm trong vùng hồng ngoại' }[nl];
      txt(c, name, 30, sy - 14, { font: `600 11.5px ${BODY}`, color: 'rgba(220,228,240,.85)' });
    },
    text: 'Các vạch của hydrogen được xếp thành dãy theo mức cuối của chuyển mức. Về n = 1, khoảng cách năng lượng rất lớn nên photon thuộc vùng tử ngoại (dãy Lyman). Về n = 2, ΔE vừa đủ để photon nằm trong vùng khả kiến (dãy Balmer). Về n = 3, ΔE nhỏ nên photon thuộc vùng hồng ngoại (dãy Paschen).',
    key: 'Chỉ dãy Balmer nhìn thấy được: 656,3 · 486,1 · 434,0 · 410,2 nm. Vạch Hα 656,3 nm tạo màu hồng đỏ của các tinh vân phát xạ.',
  });

  // 5 — Quang phổ liên tục, phát xạ và hấp thụ
  const SPEC_EL = { H: [656.3, 486.1, 434.0, 410.2], Na: [589.0, 589.6, 568.8, 616.1] };
  concepts.push({
    id: 'spectra', group: 'Quang phổ học', title: 'Quang phổ liên tục, phát xạ và hấp thụ',
    q: 'Làm sao các nhà thiên văn biết một ngôi sao chứa nguyên tố gì?',
    lab: ['Thử trong thí nghiệm Ngọn lửa', () => AL.app.goLab('flame', { el: 'Na', scope: true })],
    init(ctl) {
      this.s = { mode: 'abs', el: 'H', ps: [] };
      ctl.append(seg([['cont', 'Vật rắn nóng sáng'], ['emis', 'Khí nóng'], ['abs', 'Khí lạnh chắn trước nguồn sáng']], 'abs', (v) => (this.s.mode = v)),
        seg([['H', 'Hydrogen'], ['Na', 'Sodium']], 'H', (v) => (this.s.el = v)));
    },
    draw(c, w, hh, t, dt) {
      bg(c, w, hh);
      const s = this.s, cy = hh * 0.42, srcX = w * 0.1, prX = w * 0.42, lines = SPEC_EL[s.el];
      const gasCol = s.el === 'H' ? [255, 111, 160] : [255, 180, 60];
      // nguồn sáng
      if (s.mode !== 'emis') { glow(c, srcX, cy, 46, [255, 230, 180], 1); txt(c, 'nguồn nóng sáng', srcX, cy + 58, { align: 'center', font: `500 11px ${BODY}` }); }
      if (s.mode === 'emis') {
        c.save(); c.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 5; i++) glow(c, srcX - 10 + i * 6, cy, 28, gasCol, 0.4);
        c.restore();
        c.strokeStyle = 'rgba(255,255,255,.35)'; c.strokeRect(srcX - 30, cy - 16, 72, 32);
        txt(c, `ống khí ${s.el === 'H' ? 'hydrogen' : 'sodium'} nóng`, srcX + 6, cy + 58, { align: 'center', font: `500 11px ${BODY}` });
      }
      if (s.mode === 'abs') {
        const gx = w * 0.25;
        c.fillStyle = AL.rgba(gasCol, 0.08); c.beginPath(); c.ellipse(gx, cy, 34, 56, 0, 0, TAU); c.fill();
        c.strokeStyle = AL.rgba(gasCol, 0.35); c.setLineDash([3, 4]); c.stroke(); c.setLineDash([]);
        for (let i = 0; i < 14; i++) { const a = i * 2.4, r = 10 + ((i * 37) % 24); c.fillStyle = AL.rgba(gasCol, 0.6); c.beginPath(); c.arc(gx + Math.cos(a + t * 0.3) * r * 0.7, cy + Math.sin(a + t * 0.3) * r * 1.6, 2, 0, TAU); c.fill(); }
        txt(c, 'đám khí lạnh', gx, cy + 70, { align: 'center', font: `500 11px ${BODY}`, color: AL.rgba(gasCol, 0.9) });
      }
      // chùm sáng → lăng kính
      c.strokeStyle = s.mode === 'emis' ? AL.rgba(gasCol, 0.5) : 'rgba(255,240,220,.45)'; c.lineWidth = 4;
      c.beginPath(); c.moveTo(srcX + 40, cy); c.lineTo(prX - 18, cy); c.stroke();
      const ps = 46, hp = ps * 0.87;
      c.beginPath(); c.moveTo(prX, cy - hp * 0.62); c.lineTo(prX + ps / 2, cy + hp * 0.38); c.lineTo(prX - ps / 2, cy + hp * 0.38); c.closePath();
      c.fillStyle = 'rgba(200,230,255,.15)'; c.fill(); c.strokeStyle = 'rgba(225,238,255,.7)'; c.lineWidth = 1.4; c.stroke();
      // màn hứng phổ
      const sx0 = w * 0.55, sw = w * 0.41, sy = hh * 0.2, sh = hh * 0.36;
      const X = (nm) => sx0 + ((nm - 380) / 400) * sw;
      if (s.mode === 'emis') { c.fillStyle = '#010103'; c.fillRect(sx0, sy, sw, sh); }
      else for (let i = 0; i < sw; i += 2) { const nm = 380 + (i / sw) * 400, [r, g, b] = AL.nmRGB(nm); c.fillStyle = `rgba(${r},${g},${b},${0.85 * AL.nmVis(nm)})`; c.fillRect(sx0 + i, sy, 2, sh); }
      // tia tán sắc
      c.save(); c.globalCompositeOperation = 'lighter';
      const rays = s.mode === 'emis' ? lines : [400, 450, 500, 550, 600, 650, 700, 750];
      for (const nm of rays) { c.strokeStyle = AL.rgba(nmCol(nm), 0.35); c.lineWidth = 1.2; c.beginPath(); c.moveTo(prX + 10, cy - 4); c.lineTo(X(nm), sy + sh); c.stroke(); }
      c.restore();
      if (s.mode === 'emis') for (const nm of lines) markLine(c, X(nm), sy, sh, nm, nm === 589.6 ? 0.6 : 1, 3);
      if (s.mode === 'abs') for (const nm of lines) { c.fillStyle = 'rgba(2,3,6,.95)'; c.fillRect(X(nm) - 1.5, sy, 3, sh); }
      c.strokeStyle = 'rgba(255,255,255,.2)'; c.strokeRect(sx0 + 0.5, sy + 0.5, sw - 1, sh - 1);
      c.font = `500 10px ${MONO}`; c.textAlign = 'center'; c.fillStyle = 'rgba(190,200,215,.6)'; c.textBaseline = 'top';
      for (let nm = 400; nm <= 750; nm += 50) c.fillText(nm, X(nm), sy + sh + 5);
      const label = { cont: 'Quang phổ liên tục: đủ mọi màu, không có vạch', emis: 'Quang phổ vạch phát xạ: vạch sáng trên nền tối', abs: 'Quang phổ vạch hấp thụ: vạch tối trên nền liên tục' }[s.mode];
      txt(c, label, sx0, sy - 14, { font: `600 12px ${BODY}`, color: '#e8edf5' });
      txt(c, 'các vạch tối nằm đúng vị trí vạch sáng của cùng nguyên tố', sx0, hh * 0.9, { font: `500 11px ${BODY}`, color: s.mode === 'abs' ? 'rgba(255,190,130,.9)' : 'rgba(0,0,0,0)' });
    },
    text: 'Vật rắn hoặc khí đặc nóng sáng phát ra quang phổ liên tục. Khí loãng bị nung nóng chỉ phát ra một số bước sóng xác định (quang phổ vạch phát xạ). Khi ánh sáng liên tục đi qua một đám khí nguội hơn, chính những bước sóng đó bị hấp thụ, tạo thành các vạch tối (quang phổ vạch hấp thụ).',
    key: 'Vạch tối và vạch sáng của cùng một nguyên tố nằm ở cùng bước sóng. Nhờ vậy, các vạch tối trong quang phổ Mặt Trời và các ngôi sao cho biết thành phần hóa học của chúng.',
  });

  // 6 — Vạch nguyên tử và dải phân tử
  concepts.push({
    id: 'bands', group: 'Quang phổ học', title: 'Vạch nguyên tử và dải phân tử',
    q: 'Vì sao calcium và strontium trong ngọn lửa cho cả một dải màu?',
    lab: ['Thử trong thí nghiệm Ngọn lửa (Sr)', () => AL.app.goLab('flame', { el: 'Sr', scope: true })],
    init(ctl) {
      this.s = { v: 0 };
      ctl.append(slider('Số mức dao động của phân tử', 0, 6, 1, 0, (v) => (v ? `${v} mức (phân tử)` : 'không có (nguyên tử)'), (v) => (this.s.v = v)));
    },
    draw(c, w, hh, t) {
      bg(c, w, hh);
      const nv = this.s.v, base = 2.05, au = 0.045, al = 0.055;
      const x0 = 70, x1 = w * 0.42, yU = hh * 0.14, yL = hh * 0.56, gap = 9;
      for (const [y, a, lb] of [[yU, au, 'trạng thái kích thích'], [yL, al, 'trạng thái thấp']]) {
        c.strokeStyle = 'rgba(235,240,250,.7)'; c.lineWidth = 2; c.beginPath(); c.moveTo(x0, y); c.lineTo(x1, y); c.stroke();
        for (let v = 1; v <= nv; v++) { c.strokeStyle = 'rgba(235,240,250,.3)'; c.lineWidth = 1; c.beginPath(); c.moveTo(x0, y - v * gap); c.lineTo(x1, y - v * gap); c.stroke(); }
        txt(c, lb, x0, y + 13, { font: `500 10.5px ${BODY}`, color: 'rgba(190,200,215,.7)' });
        void a;
      }
      const lines = [];
      for (let vu = 0; vu <= nv; vu++) for (let vl = 0; vl <= nv; vl++) {
        const wgt = Math.exp(-((vu - vl) ** 2) / 1.2) * Math.exp(-vu * 0.25);
        if (wgt < 0.08) continue;
        lines.push({ lam: AL.HC / (base + vu * au - vl * al), wgt, vu, vl });
      }
      lines.slice(0, 24).forEach((L, i) => {
        const x = x0 + 20 + (i % 24) * ((x1 - x0 - 30) / Math.max(1, Math.min(24, lines.length)));
        c.globalAlpha = 0.35 + 0.65 * L.wgt;
        arrow(c, x, yU - L.vu * gap, x, yL - L.vl * gap, AL.rgba(nmCol(L.lam), 0.9), 1.4);
        c.globalAlpha = 1;
      });
      // phổ phóng to
      const sx = w * 0.5, sw = w * 0.46, sy = hh * 0.18, sh = hh * 0.4;
      c.fillStyle = '#010103'; c.fillRect(sx, sy, sw, sh);
      const X = (nm) => sx + ((nm - 560) / 100) * sw;
      for (const L of lines) if (L.lam > 560 && L.lam < 660) markLine(c, X(L.lam), sy, sh, L.lam, L.wgt, 1.6);
      c.strokeStyle = 'rgba(255,255,255,.2)'; c.strokeRect(sx + 0.5, sy + 0.5, sw - 1, sh - 1);
      c.font = `500 10px ${MONO}`; c.textAlign = 'center'; c.textBaseline = 'top'; c.fillStyle = 'rgba(190,200,215,.6)';
      for (let nm = 570; nm <= 650; nm += 20) c.fillText(nm, X(nm), sy + sh + 5);
      txt(c, nv ? `${lines.length} vạch sát nhau → một dải` : '1 vạch duy nhất', sx, sy - 14, { font: `600 12px ${BODY}`, color: '#e8edf5' });
      // nhìn qua kính có độ phân giải hữu hạn
      const by = hh * 0.8;
      txt(c, 'qua kính phân quang thông thường:', sx, by - 12, { font: `500 10.5px ${BODY}`, color: 'rgba(190,200,215,.65)' });
      c.fillStyle = '#010103'; c.fillRect(sx, by, sw, 24);
      c.save(); c.globalCompositeOperation = 'lighter';
      for (const L of lines) if (L.lam > 560 && L.lam < 660) { const x = X(L.lam), g = c.createLinearGradient(x - 14, 0, x + 14, 0), rgb = nmCol(L.lam); g.addColorStop(0, AL.rgba(rgb, 0)); g.addColorStop(0.5, AL.rgba(rgb, 0.5 * L.wgt)); g.addColorStop(1, AL.rgba(rgb, 0)); c.fillStyle = g; c.fillRect(x - 14, by, 28, 24); }
      c.restore();
    },
    text: 'Nguyên tử tự do chỉ có các mức năng lượng điện tử, nên mỗi chuyển mức cho một vạch hẹp. Phân tử (như CaOH, SrOH hình thành trong ngọn lửa) còn dao động và quay, nên trên mỗi mức điện tử có thêm nhiều mức con. Các chuyển mức giữa những mức con này cho rất nhiều vạch nằm sát nhau.',
    key: 'Nguyên tử → vạch hẹp; phân tử → dải rộng. Màu đỏ gạch của calcium và đỏ thẫm của strontium trong ngọn lửa chủ yếu đến từ dải phân tử.',
  });

  // 7 — Trạng thái giả bền và dập tắt do va chạm
  concepts.push({
    id: 'quench', group: 'Cực quang', title: 'Trạng thái giả bền và dập tắt do va chạm',
    q: 'Vì sao vạch đỏ của oxygen chỉ xuất hiện ở trên cao?',
    lab: ['Thử trong thí nghiệm Cực quang', () => AL.app.goLab('aurora', { s: 12 })],
    init(ctl) {
      const s = (this.s = { d: 0.15, gas: [], O: [], fx: [], tick: 0 });
      const rng = AL.rng(3);
      for (let i = 0; i < 260; i++) s.gas.push({ x: rng(), y: rng(), vx: (rng() - 0.5) * 0.2, vy: (rng() - 0.5) * 0.2 });
      for (let i = 0; i < 16; i++) s.O.push({ x: rng(), y: rng(), vx: (rng() - 0.5) * 0.1, vy: (rng() - 0.5) * 0.1, st: 0, age: 0 });
      ctl.append(slider('Mật độ khí (độ cao)', 0, 1, 0.01, s.d, (v) => `≈ ${Math.round(300 - 200 * v)} km`, (v) => (s.d = v)));
    },
    draw(c, w, hh, t, dt) {
      bg(c, w, hh);
      const s = this.s, narrow = w < 560, bw = narrow ? w - 32 : w * 0.62, bx = 16, by = 16, bH = narrow ? hh * 0.58 : hh - 32;
      const rate = 6 * Math.pow(s.d, 1.5); // tần suất va chạm (1/s)
      const TAU_G = 0.8, TAU_R = 4; // thời gian sống theo tỉ lệ
      c.strokeStyle = 'rgba(255,255,255,.12)'; c.strokeRect(bx + 0.5, by + 0.5, bw, bH);
      const nGas = Math.round(10 + 250 * s.d);
      c.fillStyle = 'rgba(150,170,200,.45)';
      for (let i = 0; i < nGas; i++) {
        const p = s.gas[i]; p.x = (p.x + p.vx * dt + 1) % 1; p.y = (p.y + p.vy * dt + 1) % 1;
        c.fillRect(bx + p.x * bw, by + p.y * bH, 2, 2);
      }
      s.tick -= dt;
      if (s.tick <= 0) { s.tick = 0.28; const g = s.O.filter((o) => !o.st); if (g.length) { const o = g[Math.floor(Math.random() * g.length)]; o.st = Math.random() < 0.5 ? 1 : 2; o.age = 0; } }
      for (const o of s.O) {
        o.x = (o.x + o.vx * dt + 1) % 1; o.y = (o.y + o.vy * dt + 1) % 1;
        const x = bx + o.x * bw, y = by + o.y * bH;
        if (o.st) {
          const tau = o.st === 1 ? TAU_G : TAU_R, col = o.st === 1 ? [110, 255, 125] : [255, 70, 70];
          if (Math.random() < dt / tau) { s.fx.push({ x, y, col, t: 0, emit: true }); o.st = 0; }
          else if (Math.random() < dt * rate) { s.fx.push({ x, y, col: [150, 160, 175], t: 0 }); o.st = 0; }
          else { c.strokeStyle = AL.rgba(col, 0.75); c.lineWidth = 1.5; c.beginPath(); c.arc(x, y, 7 + Math.sin(t * 8) * 1.2, 0, TAU); c.stroke(); }
        }
        c.fillStyle = '#ff9a4d'; c.beginPath(); c.arc(x, y, 4, 0, TAU); c.fill();
      }
      for (const f of s.fx) {
        f.t += dt; const a = 1 - f.t / 0.7; if (a <= 0) continue;
        if (f.emit) { c.save(); c.globalCompositeOperation = 'lighter'; glow(c, f.x, f.y, 10 + f.t * 40, f.col, a); c.restore(); }
        else { c.fillStyle = `rgba(150,160,175,${a * 0.5})`; c.beginPath(); c.arc(f.x, f.y, 4 + f.t * 14, 0, TAU); c.fill(); }
      }
      s.fx = s.fx.filter((f) => f.t < 0.7);
      // tỉ lệ phát sáng (lý thuyết): (1/τ) / (1/τ + tần suất va chạm)
      const effG = 1 / TAU_G / (1 / TAU_G + rate), effR = 1 / TAU_R / (1 / TAU_R + rate);
      const px = narrow ? bx : bx + bw + 30, pw = narrow ? w - 32 : w - px - 20, py = narrow ? by + bH + 14 : by;
      txt(c, 'Tỉ lệ nguyên tử kịp phát sáng', px, py + 8, { font: `600 12px ${BODY}`, color: '#e8edf5' });
      [[effG, [110, 255, 125], 'xanh lục 557,7 nm · τ ≈ 0,74 s'], [effR, [255, 70, 70], 'đỏ 630,0 nm · τ ≈ 110 s']].forEach(([e, col, lb], i) => {
        const y = py + (narrow ? 40 + i * 44 : 44 + i * 70);
        txt(c, lb, px, y - 12, { font: `500 11px ${BODY}`, color: AL.rgba(col, 0.95) });
        c.fillStyle = 'rgba(255,255,255,.07)'; c.fillRect(px, y, pw, 16);
        c.fillStyle = AL.rgba(col, 0.85); c.fillRect(px, y, pw * e, 16);
        txt(c, `${Math.round(e * 100)}%`, px + pw - 4, y + 8, { align: 'right', font: `700 11px ${MONO}`, color: '#fff' });
      });
      if (!narrow) txt(c, '● nguyên tử O   ○ đang kích thích   · phân tử khí', px, by + 200, { font: `500 10.5px ${BODY}`, color: 'rgba(190,200,215,.6)' });
      txt(c, `≈ ${Math.round(300 - 200 * s.d)} km`, bx + 10, by + 14, { font: `700 12px ${MONO}`, color: '#ffb066' });
    },
    text: 'Nguyên tử oxygen bị kích thích lên trạng thái ¹S hoặc ¹D cần một khoảng thời gian trước khi phát xạ (thời gian sống τ). Trong lúc chờ, nếu va chạm với phân tử khác, nó mất năng lượng mà không phát ra photon. Khí càng đặc, va chạm càng thường xuyên; trạng thái sống càng lâu càng dễ bị dập tắt.',
    key: 'Ở trên cao (≈ 300 km), khí rất loãng nên cả hai vạch đều phát sáng. Xuống thấp, vạch đỏ (τ ≈ 110 s) bị dập tắt trước, chỉ còn vạch xanh lục (τ ≈ 0,74 s). Đó là lý do cực quang đỏ ở trên, xanh lục ở dưới.',
  });

  // 8 — Hạt mang điện trong từ trường Trái Đất
  concepts.push({
    id: 'field', group: 'Cực quang', title: 'Hạt mang điện trong từ trường Trái Đất',
    q: 'Vì sao cực quang chủ yếu xuất hiện ở vùng gần hai cực?',
    lab: ['Thử trong thí nghiệm Cực quang', () => AL.app.goLab('aurora', { s: 60 })],
    init(ctl) {
      this.s = { on: true, ps: [], hits: [], spawn: 0 };
      ctl.append(seg([[true, 'Có từ trường'], [false, 'Không có từ trường']], true, (v) => { this.s.on = v; this.s.ps = []; }));
    },
    draw(c, w, hh, t, dt) {
      bg(c, w, hh);
      const s = this.s, ex = w * 0.62, ey = hh * 0.5, re = Math.min(w, hh) * 0.13;
      // đường sức lưỡng cực
      if (s.on) {
        c.strokeStyle = 'rgba(140,190,255,.25)'; c.lineWidth = 1;
        for (const L of [1.6, 2.2, 3, 4]) for (const side of [-1, 1]) {
          c.beginPath();
          for (let th = 0.12; th <= Math.PI - 0.12; th += 0.03) { const r = L * re * Math.sin(th) ** 2, x = ex + side * r * Math.sin(th), y = ey - r * Math.cos(th); th === 0.12 ? c.moveTo(x, y) : c.lineTo(x, y); }
          c.stroke();
        }
      }
      // Trái Đất
      const g = c.createRadialGradient(ex - re * 0.4, ey - re * 0.4, re * 0.1, ex, ey, re);
      g.addColorStop(0, '#9fd3ff'); g.addColorStop(0.55, '#2f6fd1'); g.addColorStop(1, '#0b2257');
      c.fillStyle = g; c.beginPath(); c.arc(ex, ey, re, 0, TAU); c.fill();
      txt(c, 'Trái Đất', ex, ey + re + 14, { align: 'center', font: `500 11px ${BODY}` });
      // vành đai cực quang quanh hai cực, sáng dần khi hạt đổ về
      s.aur = Math.max(0, (s.aur || 0) - dt * 0.15);
      if (s.on && s.aur > 0.01) {
        c.save(); c.globalCompositeOperation = 'lighter';
        for (const side of [-1, 1]) {
          c.strokeStyle = `rgba(110,255,140,${0.75 * s.aur})`; c.lineWidth = 4; c.shadowColor = '#6eff8c'; c.shadowBlur = 14;
          c.beginPath(); c.ellipse(ex, ey + side * re * 0.9, re * 0.42, re * 0.12, 0, 0, TAU); c.stroke();
        }
        c.restore();
        txt(c, 'vành đai cực quang', ex + re * 0.6, ey - re * 1.15, { font: `600 11px ${BODY}`, color: `rgba(140,255,160,${Math.min(1, s.aur * 2)})` });
      }
      txt(c, 'gió Mặt Trời →', 20, 20, { font: `600 11.5px ${BODY}`, color: '#ffd59a' });
      // sinh hạt
      s.spawn -= dt;
      if (s.spawn <= 0) { s.spawn = 0.09; s.ps.push({ x: 10, y: ey + (Math.random() - 0.5) * re * 6, st: 'fly', t: 0 }); }
      const Lcap = 3.4;
      for (const p of s.ps) {
        if (p.st === 'fly') {
          p.x += dt * 180;
          const dx = p.x - ex, dy = p.y - ey, r = Math.hypot(dx, dy);
          if (!s.on && r < re) { p.dead = true; s.hits.push({ x: p.x, y: p.y, t: 0, col: [255, 200, 120] }); }
          if (s.on && r < Lcap * re * 1.05 && dx < 0) {
            // θ: góc tính từ cực Bắc; đường sức lưỡng cực r = L·sin²θ đi qua vị trí hiện tại
            const th0 = Math.atan2(-dx, -dy), L = clamp(r / re / Math.sin(th0) ** 2, 1.3, 9), foot = Math.asin(Math.sqrt(1 / L));
            Object.assign(p, { st: 'guide', t: 0, L, th0, thEnd: dy < 0 ? foot : Math.PI - foot });
          }
        } else {
          // chạy dọc đường sức về chân đường sức gần cực, xoắn quanh nó
          p.t += dt / 1.3; const T = Math.min(1, p.t);
          const th = lerp(p.th0, p.thEnd, ease.inOut(T)), r = p.L * re * Math.sin(th) ** 2;
          const bx = ex - r * Math.sin(th), by = ey - r * Math.cos(th);
          const wob = Math.sin(p.t * 60) * 5 * (1 - T);
          p.x = bx + wob * Math.cos(th); p.y = by - wob * Math.sin(th);
          if (T >= 1) { p.dead = true; s.hits.push({ x: bx, y: by, t: 0, col: [110, 255, 125] }); s.aur = Math.min(1, (s.aur || 0) + 0.12); }
        }
        if (p.x > w + 10) p.dead = true;
        c.fillStyle = p.st === 'guide' ? 'rgba(170,255,190,.95)' : 'rgba(255,214,150,.9)';
        c.beginPath(); c.arc(p.x, p.y, 2.2, 0, TAU); c.fill();
      }
      s.ps = s.ps.filter((p) => !p.dead);
      c.save(); c.globalCompositeOperation = 'lighter';
      for (const hh2 of s.hits) { hh2.t += dt; const a = 1 - hh2.t / 1.2; if (a > 0) glow(c, hh2.x, hh2.y, 10 + hh2.t * 16, hh2.col, a); }
      c.restore();
      s.hits = s.hits.filter((x) => x.t < 1.2);
      txt(c, s.on ? 'hạt bị dẫn theo đường sức, đổ về hai vùng cực' : 'không có từ trường: hạt lao thẳng vào phía ngày, ở mọi vĩ độ', 20, hh - 18, { font: `600 11.5px ${BODY}`, color: s.on ? '#9dffb0' : '#ffd59a' });
    },
    text: 'Gió Mặt Trời là dòng hạt mang điện. Trong từ trường, lực Lorentz khiến hạt chuyển động xoắn quanh các đường sức từ thay vì đi thẳng. Từ trường Trái Đất có dạng gần giống một thanh nam châm: các đường sức hội tụ về hai cực, nên hạt bị dẫn xuống khí quyển ở các vùng vĩ độ cao.',
    key: 'Từ trường vừa che chắn Trái Đất khỏi phần lớn gió Mặt Trời, vừa dẫn một phần hạt về hai cực, tạo thành vành đai cực quang quanh vùng cực.',
  });

  // ======================================================================
  // ĐIỀU KHIỂN USACODEX
  // ======================================================================
  const CX = (AL.Codex = {
    concepts, cur: null, running: false, W: 0, H: 0,
    mount() {
      this.dlg = document.getElementById('codex');
      this.cv = document.getElementById('cx-canvas'); this.ctx = this.cv.getContext('2d');
      const list = document.getElementById('cx-list');
      let group = '';
      concepts.forEach((cp, i) => {
        if (cp.group !== group) { group = cp.group; list.append(h('div', { class: 'cx-group' }, group)); }
        cp.btn = h('button', { type: 'button', class: 'cx-item', onclick: () => this.show(cp.id) }, h('span', { class: 'cx-i' }, String(i + 1)), h('span', null, cp.title));
        list.append(cp.btn);
      });
      this.dlg.querySelectorAll('.cx-tabs [data-pane]').forEach((b) => b.addEventListener('click', () => this.pane(b.dataset.pane)));
      document.getElementById('cx-prev').onclick = () => this.step(-1);
      document.getElementById('cx-next').onclick = () => this.step(1);
      document.getElementById('cx-lab').onclick = () => { const cp = this.cur; this.dlg.close(); cp.lab[1](); };
      new ResizeObserver(() => this.fit()).observe(document.getElementById('cx-stage'));
      this.dlg.addEventListener('close', () => (this.running = false));
    },
    fit() {
      const r = this.cv.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
      this.W = r.width; this.H = r.height; this.dpr = dpr;
      this.cv.width = Math.round(r.width * dpr); this.cv.height = Math.round(r.height * dpr);
    },
    pane(p) {
      this.dlg.querySelectorAll('.cx-tabs [data-pane]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.pane === p)));
      this.dlg.querySelectorAll('.cx-pane').forEach((el) => (el.hidden = el.dataset.pane !== p));
      if (p === 'sims') { this.fit(); this.start(); }
    },
    show(id) {
      const i = Math.max(0, concepts.findIndex((c) => c.id === id)), cp = concepts[i];
      this.cur = cp;
      concepts.forEach((c) => c.btn.setAttribute('aria-current', String(c === cp)));
      document.getElementById('cx-num').textContent = `Bài ${i + 1}/${concepts.length} · ${cp.group}`;
      document.getElementById('cx-title').textContent = cp.title;
      document.getElementById('cx-q').textContent = cp.q;
      document.getElementById('cx-text').textContent = cp.text;
      document.getElementById('cx-key').textContent = cp.key;
      document.getElementById('cx-lab').textContent = cp.lab[0] + ' →';
      document.getElementById('cx-prev').disabled = i === 0;
      document.getElementById('cx-next').disabled = i === concepts.length - 1;
      this.cv.setAttribute('aria-label', 'Mô phỏng: ' + cp.title);
      const ctl = document.getElementById('cx-controls'); ctl.replaceChildren();
      cp.init(ctl);
      cp.btn.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      document.getElementById('cx-view').scrollTop = 0;
      this.pane('sims');
    },
    step(d) { const i = concepts.indexOf(this.cur) + d; if (concepts[i]) this.show(concepts[i].id); },
    start() {
      if (this.running) return;
      this.running = true;
      let last = performance.now(), T = 0;
      const frame = (now) => {
        if (!this.running || !this.dlg.open) { this.running = false; return; }
        const dt = Math.min(0.05, (now - last) / 1000); last = now; T += dt;
        if (this.cur && this.W) {
          const c = this.ctx; c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
          this.cur.draw(c, this.W, this.H, T, dt);
        }
        requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    },
    open(target) {
      if (!this.dlg.open) this.dlg.showModal();
      if (['data', 'ex', 'ref'].includes(target)) this.pane(target);
      else this.show(target || (this.cur && this.cur.id) || concepts[0].id);
    },
  });
})();
