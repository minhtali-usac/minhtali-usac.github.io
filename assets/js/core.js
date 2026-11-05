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
    return `$${AL.fmt(m, d).replace(',', '{,}')} \\times 10^{${e}}$`;
  };

  // ---------- Quả địa cầu thật: ảnh bề mặt Trái Đất (ghép từ NASA Blue Marble, qua bộ ví dụ three.js)
  // chiếu trực giao lên hình tròn, tự quay chậm, chiếu sáng từ phía Mặt Trời (bên trái).
  const EARTH = { img: null, px: null, W: 1024, H: 512, cv: null, r: 0 };
  (() => {
    const im = new Image(); im.crossOrigin = 'anonymous';
    im.onload = () => {
      try {
        const cv = document.createElement('canvas'); cv.width = EARTH.W; cv.height = EARTH.H;
        const x = cv.getContext('2d'); x.drawImage(im, 0, 0, EARTH.W, EARTH.H);
        EARTH.px = x.getImageData(0, 0, EARTH.W, EARTH.H).data;
      } catch (e) { EARTH.px = null; }
    };
    im.src = 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r160/examples/textures/planets/earth_atmos_2048.jpg';
  })();
  const TILT = 0.41; // nghiêng trục ~23,4°
  AL.drawEarth = (c, ex, ey, re, t, opt = {}) => {
    // khí quyển phát sáng mờ
    if (opt.halo !== false) {
    const halo = c.createRadialGradient(ex, ey, re * 0.95, ex, ey, re * 1.18);
    halo.addColorStop(0, 'rgba(120,180,255,.35)'); halo.addColorStop(1, 'rgba(120,180,255,0)');
    c.fillStyle = halo; c.beginPath(); c.arc(ex, ey, re * 1.18, 0, (Math.PI * 2)); c.fill(); }
    if (!EARTH.px) {
      const g = c.createRadialGradient(ex - re * 0.4, ey - re * 0.4, re * 0.1, ex, ey, re);
      g.addColorStop(0, '#9fd3ff'); g.addColorStop(0.55, '#2f6fd1'); g.addColorStop(1, '#0b2257');
      c.fillStyle = g; c.beginPath(); c.arc(ex, ey, re, 0, (Math.PI * 2)); c.fill(); return;
    }
    const R = Math.max(8, Math.round(re)), D = R * 2;
    if (!EARTH.cv || EARTH.r !== R) {
      EARTH.cv = document.createElement('canvas'); EARTH.cv.width = EARTH.cv.height = D; EARTH.r = R;
      EARTH.ctx = EARTH.cv.getContext('2d'); EARTH.out = EARTH.ctx.createImageData(D, D);
    }
    const o = EARTH.out.data, src = EARTH.px, W = EARTH.W, H = EARTH.H;
    const rot = t * 0.12, ct = Math.cos(TILT), st = Math.sin(TILT);
    const Lx = -0.75, Ly = -0.3, Lz = 0.59; // hướng ánh sáng Mặt Trời
    for (let j = 0; j < D; j++) {
      const y = (j + 0.5 - R) / R;
      for (let i = 0; i < D; i++) {
        const k = (j * D + i) * 4, x = (i + 0.5 - R) / R, rr = x * x + y * y;
        if (rr > 1) { o[k + 3] = 0; continue; }
        const z = Math.sqrt(1 - rr);
        // bỏ nghiêng trục (quay quanh trục z của màn hình) → tọa độ địa lý
        const xr = x * ct + y * st, yr = -x * st + y * ct;
        const lat = Math.asin(-yr), lon = Math.atan2(xr, z) + rot;
        let u = ((lon / (Math.PI * 2) + 0.5) % 1 + 1) % 1, v = 0.5 - lat / Math.PI;
        const p = ((Math.min(H - 1, (v * H) | 0) * W) + ((u * W) | 0)) * 4;
        const lam = Math.max(0, x * Lx + y * Ly + z * Lz), sh = 0.16 + 0.95 * lam, rim = 1 - 0.35 * (1 - z) ** 2;
        o[k] = Math.min(255, src[p] * sh * rim + 10 * (1 - z));
        o[k + 1] = Math.min(255, src[p + 1] * sh * rim + 22 * (1 - z));
        o[k + 2] = Math.min(255, src[p + 2] * sh * rim + 48 * (1 - z));
        o[k + 3] = rr > 0.985 ? 255 * (1 - rr) / 0.015 : 255;
      }
    }
    EARTH.ctx.putImageData(EARTH.out, 0, 0);
    c.drawImage(EARTH.cv, ex - R, ey - R);
  };

  // ---------- Công thức toán học (KaTeX) ----------
  // Công thức viết bằng LaTeX giữa hai dấu $...$ (hoặc $$...$$ cho dòng riêng) trong mọi nội dung HTML.
  // Ngoài ra, các ký hiệu Unicode quen thuộc (λ, ΔE, τ, Eₙ, ¹S₀, 2p⁴, n = 2, …) — kể cả trong dữ liệu
  // dùng chung với canvas — được tự chuyển sang LaTeX trước khi hiển thị.
  const SUP = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁺': '+', '⁻': '-' };
  const SUB = { '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4', '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9' };
  const sup = (s) => [...s].map((ch) => SUP[ch] || ch).join('');
  const sub = (s) => [...s].map((ch) => SUB[ch] || ch).join('');
  const GREEK = { 'α': '\\alpha', 'β': '\\beta', 'γ': '\\gamma', 'δ': '\\delta', 'ε': '\\varepsilon' };
  const RULES = [
    [/×\s?10([⁻⁺]?[⁰¹²³⁴⁵⁶⁷⁸⁹]+)/g, (m, e) => `$\\times 10^{${sup(e)}}$`],
    [/([¹²³⁴⁵⁶])([SPDF])((?:[₀-₉](?:\/[₀-₉])?)?)/g, (m, a, L, j) => `$^{${sup(a)}}\\mathrm{${L}}${j ? `_{${sub(j)}}` : ''}$`],
    [/(\d)([spdf])([⁰¹²³⁴⁵⁶⁷⁸⁹]+)/g, (m, n, l, e) => `$${n}\\mathrm{${l}}^{${sup(e)}}$`],
    [/H([αβγδε])/g, (m, g) => `$\\mathrm{H}${GREEK[g]}$`],
    [/(Lyman|Paschen|Balmer) ([αβγδε])/g, (m, s, g) => `${s} $${GREEK[g]}$`],
    [/ΔE/g, '$\\Delta E$'],
    [/Eₙ/g, '$E_n$'],
    [/λ/g, '$\\lambda$'],
    [/τ/g, '$\\tau$'],
    [/(^|[^\p{L}\d])([nZ]) = (\d+)/gu, (m, p, v, n) => `${p}$${v} = ${n}$`],
    [/(^|[^\p{L}\d])([fE]) (?=[=≈])/gu, (m, p, v) => `${p}$${v}$ `],
  ];
  AL.texify = (s) => s.split(/(\$\$[\s\S]*?\$\$|\$[^$]*\$)/).map((part, i) => {
    if (i % 2) return part; // đã là LaTeX
    for (const [re, rep] of RULES) part = part.replace(re, rep);
    return part;
  }).join('');
  const SKIP = /^(SCRIPT|STYLE|TEXTAREA|INPUT|SELECT|OPTION|CANVAS|SVG|CODE|PRE)$/;
  const MATHY = /[λτΔₙ¹²³⁴⁵⁶⁷⁸⁹⁰⁻αβγδε$]|[nZ] = \d|[fE] [=≈]/;
  AL.renderMath = (root) => {
    if (!root || !window.renderMathInElement) return;
    const el = root.nodeType === 3 ? root.parentElement : root;
    if (!el || el.closest('.katex') || SKIP.test(el.nodeName)) return;
    const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => (n.parentElement.closest('.katex, script, style, textarea, canvas, svg') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
    });
    const nodes = []; let found = false;
    while (walk.nextNode()) nodes.push(walk.currentNode);
    for (const n of nodes) {
      if (!MATHY.test(n.data)) continue;
      const t = AL.texify(n.data);
      if (t !== n.data) n.data = t;
      if (n.data.includes('$')) found = true;
    }
    if (found) window.renderMathInElement(el, {
      delimiters: [{ left: '$$', right: '$$', display: true }, { left: '$', right: '$', display: false }],
      ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code', 'option'],
      ignoredClasses: ['katex'], throwOnError: false, strict: 'ignore',
    });
  };
  const startMath = () => {
    if (!window.renderMathInElement) return;
    AL.renderMath(document.body);
    const pending = new Set(); let raf = 0;
    new MutationObserver((muts) => {
      for (const m of muts) {
        if (m.target.nodeType === 1 && m.target.closest && m.target.closest('.katex')) continue;
        if (m.type === 'characterData') pending.add(m.target.parentElement);
        else m.addedNodes.forEach((n) => pending.add(n.nodeType === 3 ? n.parentElement : n));
      }
      if (!raf && pending.size) raf = requestAnimationFrame(() => {
        raf = 0; const list = [...pending]; pending.clear();
        list.forEach((n) => n && n.isConnected && AL.renderMath(n));
      });
    }).observe(document.body, { childList: true, subtree: true, characterData: true });
  };
  if (document.readyState === 'complete') startMath(); else window.addEventListener('load', startMath);
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
