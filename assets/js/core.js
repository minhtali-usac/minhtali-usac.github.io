/* Aurora-LAB — tiện ích dùng chung: định dạng số kiểu Việt Nam, màu theo bước sóng,
 * state chung (store), tạo DOM và nền sao. */
(function () {
  'use strict';
  const AL = (window.AL = window.AL || {});

  AL.HC = 1239.84198; // h·c theo eV·nm
  AL.C = 299792458;

  // ---------- Số ----------
  AL.fmt = (x, d = 1) => (Number.isFinite(x) ? x.toFixed(d).replace('.', ',') : '–');
  // Dạng khoa học, trả về HTML (dùng <sup> vì phông mono thiếu chữ số mũ ⁴–⁹)
  AL.sci = (x, d = 2) => {
    if (!x) return '0';
    let e = Math.floor(Math.log10(Math.abs(x)));
    let m = x / 10 ** e;
    if (Math.abs(m) >= 9.995) { m /= 10; e += 1; }
    return `${AL.fmt(m, d)} × 10<sup>${String(e).replace('-', '−')}</sup>`;
  };
  AL.eV = (nm) => AL.HC / nm;
  AL.freq = (nm) => AL.C / (nm * 1e-9);
  AL.region = (nm) => (nm < 380 ? 'UV' : nm > 780 ? 'IR' : 'VIS');
  AL.fmtNm = (nm) => (nm >= 1000 ? AL.fmt(nm / 1000, 2) + ' µm' : AL.fmt(nm, 1) + ' nm');

  AL.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  AL.lerp = (a, b, t) => a + (b - a) * t;
  AL.ease = {
    inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    out: (t) => 1 - Math.pow(1 - t, 3),
    in: (t) => t * t * t,
  };
  AL.rng = (seed) => () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  AL.pick = (items, weight) => {
    const ws = items.map(weight), tot = ws.reduce((a, b) => a + b, 0);
    let r = Math.random() * tot;
    for (let i = 0; i < items.length; i++) { r -= ws[i]; if (r <= 0) return items[i]; }
    return items[items.length - 1];
  };

  // ---------- Màu ----------
  // Màu gần đúng của ánh sáng đơn sắc (thuật toán Dan Bruton), trả [r, g, b] 0..255.
  AL.nmRGB = (nm) => {
    if (nm < 380) return [176, 140, 255];
    if (nm > 780) return [150, 40, 40];
    let r = 0, g = 0, b = 0;
    if (nm < 440) { r = (440 - nm) / 60; b = 1; }
    else if (nm < 490) { g = (nm - 440) / 50; b = 1; }
    else if (nm < 510) { g = 1; b = (510 - nm) / 20; }
    else if (nm < 580) { r = (nm - 510) / 70; g = 1; }
    else if (nm < 645) { r = 1; g = (645 - nm) / 65; }
    else r = 1;
    return [r, g, b].map((v) => Math.round(255 * Math.pow(v, 0.8)));
  };
  // Độ sáng cảm nhận ở rìa vùng khả kiến (mắt kém nhạy ở hai đầu).
  AL.nmVis = (nm) => (nm < 380 || nm > 780 ? 0 : nm < 420 ? 0.3 + (0.7 * (nm - 380)) / 40 : nm > 700 ? 0.3 + (0.7 * (780 - nm)) / 80 : 1);
  AL.nmCSS = (nm, a = 1) => { const [r, g, b] = AL.nmRGB(nm); return `rgba(${r},${g},${b},${a})`; };
  AL.colorName = (nm) => {
    if (nm < 380) return 'tử ngoại';
    if (nm > 780) return 'hồng ngoại';
    const T = [[420, 'tím'], [450, 'tím-lam'], [490, 'xanh lam'], [520, 'xanh ngọc'], [565, 'xanh lục'], [580, 'vàng lục'], [595, 'vàng'], [620, 'cam'], [700, 'đỏ'], [781, 'đỏ sẫm']];
    for (const [lim, n] of T) if (nm < lim) return n;
    return 'đỏ sẫm';
  };
  AL.hexRGB = (hex) => { const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  AL.rgba = (rgb, a) => `rgba(${rgb[0] | 0},${rgb[1] | 0},${rgb[2] | 0},${a})`;
  AL.hexA = (hex, a) => AL.rgba(AL.hexRGB(hex), a);
  AL.mixRGB = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);

  // ---------- DOM ----------
  AL.h = (tag, props, ...kids) => {
    const el = document.createElement(tag);
    if (props) {
      for (const [k, v] of Object.entries(props)) {
        if (v == null || v === false) continue;
        if (k === 'class') el.className = v;
        else if (k === 'style' && typeof v === 'object') {
          for (const [sk, sv] of Object.entries(v)) sk.startsWith('--') ? el.style.setProperty(sk, sv) : (el.style[sk] = sv);
        } else if (k === 'html') el.innerHTML = v;
        else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
        else if (typeof v === 'boolean') el[k] = v;
        else el.setAttribute(k, v);
      }
    }
    for (const kid of kids.flat(Infinity)) {
      if (kid == null || kid === false) continue;
      el.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
    }
    return el;
  };
  AL.esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  AL.term = (text, key) => `<span class="term" tabindex="0" data-term="${key}">${text}</span>`;

  // ---------- State chung giữa các tab ----------
  AL.store = (() => {
    const state = { tab: 'atom', mode: 'basic', el: 'O', line: null };
    const subs = new Set();
    return {
      state,
      set(patch) {
        const changed = {};
        for (const k in patch) if (state[k] !== patch[k]) { state[k] = patch[k]; changed[k] = true; }
        if (Object.keys(changed).length) subs.forEach((fn) => fn(state, changed));
      },
      on(fn) { subs.add(fn); return () => subs.delete(fn); },
    };
  })();

  // ---------- Nền sao ----------
  AL.Stars = function (n, seed) {
    const r = AL.rng(seed);
    this.s = Array.from({ length: n }, () => ({ x: r(), y: r(), m: r() ** 3, p: r() * 6.283, v: 0.4 + r() * 1.4 }));
  };
  AL.Stars.prototype.draw = function (c, x, y, w, h, t, a = 1) {
    for (const s of this.s) {
      const tw = 0.6 + 0.4 * Math.sin(t * s.v + s.p);
      c.fillStyle = `rgba(215,225,255,${((0.12 + 0.8 * s.m) * tw * a).toFixed(3)})`;
      const z = 0.6 + s.m * 1.5;
      c.fillRect(x + s.x * w, y + s.y * h, z, z);
    }
  };

  // Khung chữ có nền mờ trên canvas (nhãn trực tiếp).
  AL.tag = (c, text, x, y, opt = {}) => {
    const { color = '#e9eef6', bg = 'rgba(6,8,13,.78)', font = '600 12px "Be Vietnam Pro", system-ui, sans-serif', align = 'left', pad = 6, border } = opt;
    c.font = font;
    const w = c.measureText(text).width + pad * 2, hgt = 20;
    const x0 = align === 'right' ? x - w : align === 'center' ? x - w / 2 : x;
    c.fillStyle = bg;
    c.beginPath(); c.roundRect(x0, y - hgt / 2, w, hgt, 6); c.fill();
    if (border) { c.strokeStyle = border; c.lineWidth = 1; c.stroke(); }
    c.fillStyle = color; c.textAlign = 'left'; c.textBaseline = 'middle';
    c.fillText(text, x0 + pad, y + 0.5);
    return w;
  };
})();
