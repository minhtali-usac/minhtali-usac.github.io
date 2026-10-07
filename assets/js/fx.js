/* Aurora-LAB — lớp hiệu ứng phủ toàn màn hình: photon bay từ mô phỏng xuống thanh phổ,
 * và pháo sáng nhỏ khi hoàn thành thử thách. */
(function () {
  'use strict';
  const AL = window.AL;

  const bez = (p0, p1, p2, p3, t) => {
    const u = 1 - t;
    return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
  };

  AL.FX = {
    ps: [], rings: [], sparks: [],
    mount(cv) {
      this.cv = cv; this.ctx = cv.getContext('2d');
      const fit = () => {
        this.dpr = Math.min(2, window.devicePixelRatio || 1);
        this.w = window.innerWidth; this.h = window.innerHeight;
        cv.width = Math.round(this.w * this.dpr); cv.height = Math.round(this.h * this.dpr);
      };
      window.addEventListener('resize', fit); fit();
    },

    /* {x0,y0,x1,y1,nm,onArrive} — tọa độ theo viewport */
    photon(o) {
      const dx = o.x1 - o.x0, dy = o.y1 - o.y0, dist = Math.hypot(dx, dy);
      const out = Math.min(140, dist * 0.35);
      this.ps.push({
        ...o, t: 0, dur: AL.clamp(0.55 + dist / 1400, 0.7, 1.25),
        c1x: o.x0 + (dx > 0 ? 1 : -1) * out * 0.6, c1y: o.y0 - out * 0.35,
        c2x: o.x1, c2y: o.y1 - Math.max(90, Math.abs(dy) * 0.45),
        rgb: AL.nmRGB(o.nm), reg: AL.region(o.nm), ph: Math.random() * 6,
      });
    },

    burst(x, y, colors) {
      for (let i = 0; i < 46; i++) {
        const a = Math.random() * Math.PI * 2, v = 80 + Math.random() * 260;
        this.sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 80, t: 0, life: 0.7 + Math.random() * 0.6, rgb: AL.hexRGB(colors[i % colors.length]) });
      }
    },

    pos(p, t) { return [bez(p.x0, p.c1x, p.c2x, p.x1, t), bez(p.y0, p.c1y, p.c2y, p.y1, t)]; },

    busy() { return this.ps.length || this.rings.length || this.sparks.length; },

    draw(dt) {
      const c = this.ctx;
      c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      c.clearRect(0, 0, this.w, this.h);
      if (!this.busy()) return;
      c.globalCompositeOperation = 'lighter';

      for (const p of this.ps) {
        p.t += dt / p.dur;
        const T = AL.ease.inOut(Math.min(1, p.t));
        const [r, g, b] = p.rgb, dim = p.reg === 'VIS' ? 1 : 0.6;
        const lamPx = AL.clamp(p.nm / 36, 6, 30); // bước sóng "nhìn thấy": đỏ lượn dài, tím lượn ngắn
        // đuôi sóng hình sin
        const N = 26, pts = [];
        let acc = 0, prev = null;
        for (let i = 0; i <= N; i++) {
          const tt = Math.max(0, T - i * 0.0075);
          const [x, y] = this.pos(p, tt);
          if (prev) acc += Math.hypot(x - prev[0], y - prev[1]);
          prev = [x, y];
          const [nx, ny] = this.pos(p, Math.max(0, tt - 0.004));
          let tx = x - nx, ty = y - ny; const L = Math.hypot(tx, ty) || 1; tx /= L; ty /= L;
          const amp = 4.2 * (1 - i / N);
          const off = Math.sin((acc / lamPx) * Math.PI * 2 + p.ph + p.t * 18) * amp;
          pts.push([x - ty * off, y + tx * off, 1 - i / N]);
        }
        c.lineWidth = 2; c.lineCap = 'round';
        for (let i = 1; i < pts.length; i++) {
          c.strokeStyle = `rgba(${r},${g},${b},${(pts[i][2] * 0.85 * dim).toFixed(3)})`;
          c.beginPath(); c.moveTo(pts[i - 1][0], pts[i - 1][1]); c.lineTo(pts[i][0], pts[i][1]); c.stroke();
        }
        const [hx, hy] = this.pos(p, T);
        const gr = c.createRadialGradient(hx, hy, 0, hx, hy, 16);
        gr.addColorStop(0, `rgba(255,255,255,${0.95 * dim})`); gr.addColorStop(0.25, `rgba(${r},${g},${b},${0.85 * dim})`); gr.addColorStop(1, `rgba(${r},${g},${b},0)`);
        c.fillStyle = gr; c.fillRect(hx - 16, hy - 16, 32, 32);
        if (p.reg !== 'VIS') {
          c.globalCompositeOperation = 'source-over';
          c.font = '700 10px "Chakra Petch", system-ui'; c.textAlign = 'center'; c.textBaseline = 'bottom';
          c.fillStyle = `rgba(${r},${g},${b},.95)`; c.fillText(p.reg, hx, hy - 10);
          c.globalCompositeOperation = 'lighter';
        }
        if (p.t >= 1) {
          this.rings.push({ x: p.x1, y: p.y1, rgb: p.rgb, t: 0 });
          try { p.onArrive && p.onArrive(); } catch (e) { console.error(e); }
        }
      }
      this.ps = this.ps.filter((p) => p.t < 1);

      for (const R of this.rings) {
        R.t += dt; const a = 1 - R.t / 0.5;
        if (a <= 0) continue;
        c.strokeStyle = AL.rgba(R.rgb, a); c.lineWidth = 2;
        c.beginPath(); c.arc(R.x, R.y, 4 + R.t * 50, 0, Math.PI * 2); c.stroke();
      }
      this.rings = this.rings.filter((R) => R.t < 0.5);

      for (const s of this.sparks) {
        s.t += dt; s.vy += 420 * dt; s.x += s.vx * dt; s.y += s.vy * dt; s.vx *= 0.985;
        const a = Math.max(0, 1 - s.t / s.life);
        c.fillStyle = AL.rgba(s.rgb, a);
        c.fillRect(s.x - 1.5, s.y - 1.5, 3, 3);
      }
      this.sparks = this.sparks.filter((s) => s.t < s.life);
      c.globalCompositeOperation = 'source-over';
    },
  };
})();
