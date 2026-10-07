/* Aurora-LAB — khung ứng dụng: header, tab, panel đánh số, thanh trạng thái,
 * thanh phổ, state chung, quiz, linh vật, bottom sheet trên điện thoại. */
(function () {
  'use strict';
  const AL = window.AL, D = AL.DATA, store = AL.store, h = AL.h, { fmt } = AL;


  const SIMS = { atom: AL.SimAtom, aurora: AL.SimAurora, flame: AL.SimFlame };
  const HASH = { atom: 'nguyen-tu', aurora: 'cuc-quang', flame: 'ngon-lua' };
  const $ = (s) => document.querySelector(s);
  const mobile = () => window.matchMedia('(max-width: 860px)').matches;
  const storage = {
    get(k) { try { return localStorage.getItem('auroralab:' + k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem('auroralab:' + k, v); } catch (e) { /* bỏ qua */ } },
  };

  let sim = null, cv, ctx, W = 0, H = 0, DPR = 1, T = 0;
  let uid = 0;

  // ================= Thành phần giao diện dùng chung =================
  const ui = (AL.ui = {
    step(n, title, aside, ...kids) {
      return h('section', { class: 'step' },
        h('div', { class: 'step-h' }, h('span', { class: 'step-n' }, String(n)), h('h3', { class: 'step-t' }, title), aside ? h('span', { class: 'step-aside' }, aside) : null),
        ...kids);
    },
    elGrid(ids, active, onPick, opt = {}) {
      return h('div', { class: 'el-grid', role: 'group' }, ids.map((id) => {
        const s = D.sp(id);
        const b = h('button', {
          type: 'button', class: 'el-chip' + (opt.wrong && opt.wrong.has(id) ? ' wrong' : ''), 'aria-pressed': String(id === active),
          style: { '--c': s.color }, title: `${s.name}${s.vi ? ' (' + s.vi + ')' : ''}`,
          onclick: () => onPick(id),
        }, h('span', { class: 'sym' }, s.sym), h('span', { class: 'nm' }, opt.sub ? opt.sub(id) : s.name));
        if (opt.onHover) {
          ['pointerenter', 'focus'].forEach((ev) => b.addEventListener(ev, () => opt.onHover(id)));
          ['pointerleave', 'blur'].forEach((ev) => b.addEventListener(ev, () => opt.onHover(null)));
        }
        return b;
      }));
    },
    primary(html, onClick, kbd) {
      return h('button', { type: 'button', class: 'btn-primary', onclick: onClick }, h('span', { class: 'bp-l', html }), kbd ? h('kbd', null, kbd) : null);
    },
    check(label, val, onChange) {
      const id = 'ck' + ++uid;
      return h('label', { class: 'check', for: id },
        h('input', { type: 'checkbox', id, checked: !!val, onchange: (e) => onChange(e.target.checked) }),
        h('span', { html: label }));
    },
    slider({ value, label, valueText, ends, onInput, min = 0, max = 100, step = 0.5 }) {
      const out = h('output', { class: 'sl-v' }, valueText);
      const input = h('input', { type: 'range', class: 'range', min, max, step, value, 'aria-label': label });
      const paint = () => input.style.setProperty('--p', ((input.value - min) / (max - min)) * 100 + '%');
      input.addEventListener('input', () => { paint(); onInput(+input.value); });
      paint();
      const el = h('div', { class: 'slider' },
        h('div', { class: 'sl-h' }, h('span', null, label), out), input,
        ends ? h('div', { class: 'sl-ends' }, h('span', null, ends[0]), h('span', null, ends[1])) : null);
      el.setValue = (t) => (out.textContent = t);
      el.sync = (v, t) => { input.value = v; paint(); out.textContent = t; };
      return el;
    },
    seg(options, value, onChange) {
      const wrap = h('div', { class: 'seg seg-wide', role: 'radiogroup' });
      options.forEach(([v, label]) => {
        const b = h('button', { type: 'button', role: 'radio', 'aria-checked': String(v === value), onclick: () => {
          wrap.querySelectorAll('button').forEach((x) => x.setAttribute('aria-checked', 'false'));
          b.setAttribute('aria-checked', 'true'); onChange(v);
        } }, label);
        wrap.append(b);
      });
      return wrap;
    },
    // Thẻ giải thích ngắn + lối vào lớp chuyên sâu (USACodex) và 3 câu kiểm tra nhanh
    explain(title, html, codexId) {
      const body = h('div', { class: 'explain-b', html });
      const el = h('section', { class: 'explain' },
        h('div', { class: 'explain-h' }, title), body,
        h('div', { class: 'explain-f' },
          codexId ? h('button', { type: 'button', class: 'more', onclick: () => app.openCodex(codexId) }, 'Tìm hiểu thêm →') : null,
          h('button', { type: 'button', class: 'quiz-link', onclick: () => app.openQuiz() }, h('span', { class: 'qc-ic' }, '?'), 'Kiểm tra nhanh · 3 câu')));
      el.body = body;
      return el;
    },
    block(title, ...kids) { return h('section', { class: 'block' }, h('h4', { class: 'block-h' }, title), ...kids); },
    table(cols, rows, active) {
      return h('div', { class: 'table-wrap' }, h('table', { class: 'data' },
        h('thead', null, h('tr', null, cols.map((c) => h('th', null, c)))),
        h('tbody', null, rows.map((r) => h('tr', {
          class: (r.click ? 'clickable' : '') + (r.key === active ? ' on' : ''), tabindex: r.click ? '0' : null,
          onclick: r.click || null, onkeydown: r.click ? (e) => { if (e.key === 'Enter') r.click(); } : null,
        }, r.cells.map((c) => h('td', { html: c })))))));
    },
    note(html) { return h('p', { class: 'note', html }); },
    row(...kids) { return h('div', { class: 'row' }, ...kids); },
    linkBtn(label, fn) { return h('button', { type: 'button', class: 'link-btn', onclick: fn }, label); },
    target(tr, onClear) {
      return h('div', { class: 'target' },
        h('span', { class: 'sw', style: { background: AL.nmCSS(tr.nm) } }),
        h('span', { html: `Đã chọn chuyển mức <b>${AL.fmtNm(tr.nm)}</b>` }),
        h('button', { type: 'button', class: 'x', 'aria-label': 'Bỏ chọn vạch', onclick: onClear }, '✕'));
    },
    mystery(score, onStart) {
      return h('section', { class: 'block mystery' },
        h('div', { class: 'mys-h' }, h('b', null, 'Mẫu chưa biết'), h('span', null, `đúng ${Math.min(3, score)}/3`)),
        h('p', { class: 'note' }, 'Một mẫu muối chưa biết được đưa vào ngọn lửa. Xác định kim loại dựa trên quang phổ phát xạ.'),
        h('button', { type: 'button', class: 'btn-ghost', onclick: onStart }, 'Phân tích mẫu chưa biết'));
    },
    miniEl(sp) {
      return h('button', { type: 'button', class: 'mini-el', style: { '--c': sp.color }, onclick: () => app.sheet(true), 'aria-label': 'Đổi nguyên tố' },
        h('b', null, sp.sym), h('span', null, 'đổi'));
    },
  });

  // ================= Ứng dụng =================
  const app = (AL.app = {
    status(main, hint) { $('#readout').innerHTML = main; if (hint != null) $('#hint').innerHTML = hint; },
    hint(html) { $('#hint').innerHTML = html; },
    readout(id, sub) {
      const info = D.line(id); if (!info) return '';
      const full = store.state.mode === 'full', nm = info.nm, reg = AL.region(nm);
      const col = reg === 'VIS' ? AL.nmCSS(nm) : '#c9b8ff';
      return `λ = <b style="color:${col}">${AL.fmtNm(nm)}</b> · ΔE = <b>${fmt(AL.eV(nm), 2)} eV</b>` +
        (full ? ` · f = ${AL.sci(AL.freq(nm))} Hz` : '') +
        `<span class="rs">${sub ? AL.esc(sub) + ' · ' : ''}${reg === 'VIS' ? AL.colorName(nm) : reg === 'UV' ? 'tử ngoại' : 'hồng ngoại'}</span>`;
    },
    toViewport(x, y) { const r = cv.getBoundingClientRect(); return { x: r.left + x, y: r.top + y }; },
    cursor(c) { if (cv.style.cursor !== c) cv.style.cursor = c; },
    refreshPanel() { renderPanel(); },
    say(text, mood) { mascotSay(text, mood); },
    win(text) {
      mascotSay(text, 'win');
      const chip = $('#challenge'), r = (mobile() ? $('#mascot') : chip).getBoundingClientRect();
      AL.FX.burst(r.left + r.width / 2, r.top + r.height / 2, ['#ff8a2b', '#7dff72', '#ffd166', '#9a86ff']);
      chip.classList.remove('pop'); void chip.offsetWidth; chip.classList.add('pop');
      this.renderChallenge();
    },
    accent() {
      const a = sim.accent(), rgb = Array.isArray(a) ? a : AL.hexRGB(a);
      const key = rgb.map((v) => v | 0).join(',');
      if (key === this._acc) return;
      this._acc = key;
      document.documentElement.style.setProperty('--accent-rgb', key);
      document.documentElement.style.setProperty('--accent', `rgb(${key})`);
    },
    renderChallenge() {
      const c = sim.challenge(), chip = $('#challenge');
      chip.classList.toggle('done', !!c.done);
      chip.innerHTML = `<span class="ch-ic">${c.done ? '✓' : '🎯'}</span><span class="ch-t"><small>Thử thách</small>${AL.esc(c.text)}</span>` +
        (c.prog ? `<span class="ch-p">${c.prog}</span>` : '') + (c.action && !c.done ? `<span class="ch-a">${AL.esc(c.action.label)} →</span>` : '');
      chip.onclick = c.action && !c.done ? c.action.fn : null;
      chip.style.cursor = c.action && !c.done ? 'pointer' : 'default';
      const mob = $('#panel-body .challenge-m');
      if (mob) mob.replaceWith(challengeMobile());
    },
    // id: mã bài mô phỏng trong USACodex ('emit', 'quench'…) hoặc 'data' | 'ex' | 'ref'
    openCodex(id) { AL.Codex.open(id); },
    // Chuyển sang thí nghiệm chính với thông số đặt sẵn (dùng từ USACodex)
    goLab(tab, o = {}) {
      switchTab(tab, true);
      store.set({ ...(o.el ? { el: o.el } : {}), line: null });
      if (tab === 'atom' && o.ghost) AL.SimAtom.opt.ghost = true;
      if (tab === 'aurora' && o.s != null) { AL.SimAurora.setE(o.s); AL.SimAurora.afterChange(); }
      if (tab === 'flame' && o.scope) setTimeout(() => AL.SimFlame.toggleScope(true), 500);
      renderPanel();
    },
    openQuiz() { renderQuiz(); $('#dlg-quiz').showModal(); },
    sheet(open) {
      const p = $('#panel'); const o = open == null ? !p.classList.contains('open') : open;
      p.classList.toggle('open', o); $('#sheet-handle').setAttribute('aria-expanded', String(o));
    },
  });

  function challengeMobile() {
    const c = sim.challenge();
    const el = h('button', { type: 'button', class: 'challenge challenge-m' + (c.done ? ' done' : ''), onclick: c.action && !c.done ? c.action.fn : null },
      h('span', { class: 'ch-ic' }, c.done ? '✓' : '🎯'),
      h('span', { class: 'ch-t' }, h('small', null, 'Thử thách'), c.text),
      c.prog ? h('span', { class: 'ch-p' }, c.prog) : null);
    return el;
  }

  // ================= Panel =================
  function renderPanel() {
    const body = $('#panel-body'), top = body.scrollTop;
    body.replaceChildren(challengeMobile(), ...sim.panel().filter(Boolean));
    body.scrollTop = top;
    $('#peek-body').replaceChildren(...sim.peek().filter(Boolean));
  }

  // ================= Tab =================
  function switchTab(id, instant) {
    if (!SIMS[id]) id = 'atom';
    const wrap = $('#canvas-wrap');
    const go = () => {
      if (sim) sim.leave();
      sim = SIMS[id];
      store.set({ tab: id });
      document.querySelectorAll('.tab').forEach((t) => t.setAttribute('aria-selected', String(t.dataset.tab === id)));
      $('#stage').setAttribute('aria-labelledby', 'tab-' + id);
      $('#stage-q').textContent = sim.question;
      cv.setAttribute('aria-label', 'Thí nghiệm: ' + sim.question);
      sim.resize(W, H);
      sim.enter();
      renderPanel(); app.renderChallenge(); app.accent();
      wrap.classList.remove('fading');
      storage.set('tab', id);
      if (location.hash.slice(1) !== HASH[id]) history.replaceState(null, '', '#' + HASH[id]);
    };
    if (instant || !sim) go();
    else { wrap.classList.add('fading'); setTimeout(go, 160); }
  }

  // ================= Chế độ Cơ bản / Đầy đủ =================
  function setMode(m) {
    store.set({ mode: m });
    document.body.classList.toggle('mode-full', m === 'full');
    document.body.classList.toggle('mode-basic', m !== 'full');
    document.querySelectorAll('.mode-toggle button').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.mode === m)));
    storage.set('mode', m);
  }

  // ================= Linh vật =================
  let bubbleT = 0, tipIx = 0;
  function mascotSay(text, mood) {
    const m = $('#mascot'), b = $('#mascot-bubble');
    b.textContent = text; m.classList.add('talk');
    m.classList.toggle('win', mood === 'win');
    if (AL.Mascot3D) AL.Mascot3D.mood(mood === 'win' ? 'win' : 'talk');
    clearTimeout(bubbleT);
    bubbleT = setTimeout(() => m.classList.remove('talk', 'win'), Math.max(3500, text.length * 55));
  }

  // ================= Quiz =================
  function renderQuiz() {
    const qs = D.quiz[store.state.tab], body = $('#quiz-body');
    const names = { atom: 'Nguyên tử phát photon', aurora: 'Cực quang theo độ cao', flame: 'Ngọn lửa → kính phân quang' };
    $('#quiz-title').textContent = 'Kiểm tra nhanh · ' + names[store.state.tab];
    let right = 0, answered = 0;
    const score = h('p', { class: 'quiz-score' });
    const list = qs.map((q, i) => {
      const why = h('p', { class: 'quiz-why', hidden: true });
      const opts = q.a.map((a, k) => h('button', { type: 'button', class: 'quiz-opt', onclick: (e) => {
        const box = e.currentTarget.parentElement;
        if (box.dataset.done) return;
        box.dataset.done = '1'; answered++;
        box.querySelectorAll('button').forEach((b, j) => { b.disabled = true; if (j === q.c) b.classList.add('ok'); });
        if (k === q.c) right++; else e.currentTarget.classList.add('bad');
        why.hidden = false; why.innerHTML = (k === q.c ? '<b>Đúng rồi.</b> ' : '<b>Chưa đúng.</b> ') + AL.esc(q.why);
        if (answered === qs.length) score.innerHTML = `Bạn trả lời đúng <b>${right}/${qs.length}</b>. ${right === qs.length ? 'Tuyệt vời!' : 'Thử lại mô phỏng rồi làm lại nhé.'}`;
      } }, h('span', { class: 'qo-k' }, 'ABCD'[k]), a));
      return h('div', { class: 'quiz-q' }, h('p', { class: 'quiz-t' }, h('b', null, `Câu ${i + 1}. `), q.q), h('div', { class: 'quiz-opts' }, opts), why);
    });
    body.replaceChildren(...list, score, h('div', { class: 'quiz-foot' }, h('button', { type: 'button', class: 'btn-ghost', onclick: renderQuiz }, 'Làm lại')));
  }

  // ================= USACodex: bảng số liệu & máy tính =================
  function buildCodex() {
    const rows = Object.values(D.index).filter((l) => l.nm).map((l) => ({ ...l, s: D.sp(l.sp) }));
    let sortK = 'sp', dir = 1;
    const cols = [['sp', 'Chất'], ['nm', 'λ (nm)'], ['eV', 'ΔE (eV)'], ['tr', 'Bước chuyển / nguồn gốc'], ['reg', 'Vùng'], ['src', 'Loại']];
    const order = Object.keys(D.species).concat(['fuel']);
    const val = (r, k) => (k === 'sp' ? order.indexOf(r.sp) * 1e4 + r.nm : k === 'nm' || k === 'eV' ? (k === 'eV' ? -r.nm : r.nm) : String(k === 'tr' ? r.tr || r.mol || '' : k === 'reg' ? AL.region(r.nm) : r.src || ''));
    const table = $('#codex-table');
    const draw = () => {
      const sorted = rows.slice().sort((a, b) => { const x = val(a, sortK), y = val(b, sortK); return (x > y ? 1 : x < y ? -1 : 0) * dir; });
      table.replaceChildren(
        h('thead', null, h('tr', null, cols.map(([k, n]) => h('th', { class: 'sortable' + (k === sortK ? ' on' : ''), onclick: () => { dir = k === sortK ? -dir : 1; sortK = k; draw(); } }, n, k === sortK ? (dir > 0 ? ' ▲' : ' ▼') : '')))),
        h('tbody', null, sorted.map((r) => h('tr', null,
          h('td', { html: `<b style="color:${r.s.color}">${r.s.sym}</b> <span class="muted">${AL.esc(r.s.name)}</span>` }),
          h('td', { html: `<span class="sw" style="background:${AL.nmCSS(r.nm)}"></span>${fmt(r.nm, 1)}${r.w ? ' <span class="muted">±' + r.w / 2 + '</span>' : ''}` }),
          h('td', null, fmt(AL.eV(r.nm), 2)),
          h('td', { html: AL.esc(r.tr || (r.mol ? 'dải ' + r.mol : '')) + (r.alt ? ` <span class="muted">· ${r.alt}</span>` : '') }),
          h('td', null, AL.region(r.nm) === 'VIS' ? AL.colorName(r.nm) : AL.region(r.nm)),
          h('td', null, r.src === '≈' ? 'Dải phân tử' : 'NIST ASD')))));
    };
    draw();
    const inp = $('#calc-nm'), out = $('#calc-out');
    const calc = () => {
      const nm = parseFloat(String(inp.value).replace(',', '.'));
      if (!(nm > 0)) { out.textContent = 'Nhập bước sóng lớn hơn 0.'; return; }
      out.innerHTML = `ΔE ≈ <b>${fmt(AL.eV(nm), 3)} eV</b> · f ≈ <b>${AL.sci(AL.freq(nm))} Hz</b> · <span style="color:${AL.region(nm) === 'VIS' ? AL.nmCSS(nm) : '#c9b8ff'}">${AL.colorName(nm)}</span>`;
    };
    inp.addEventListener('input', calc); calc();
  }

  // ================= Tooltip thuật ngữ =================
  function initTerms() {
    const tip = $('#term-tip');
    let cur = null;
    const show = (el) => {
      const txt = D.terms[el.dataset.term]; if (!txt) return;
      cur = el; tip.innerHTML = `<b>${AL.esc(el.textContent)}</b> ${AL.esc(txt)}`; tip.hidden = false;
      const r = el.getBoundingClientRect(), tw = tip.offsetWidth, th = tip.offsetHeight;
      let x = AL.clamp(r.left + r.width / 2 - tw / 2, 8, window.innerWidth - tw - 8), y = r.top - th - 8;
      if (y < 8) y = r.bottom + 8;
      tip.style.left = x + 'px'; tip.style.top = y + 'px';
    };
    const hide = () => { tip.hidden = true; cur = null; };
    document.addEventListener('pointerover', (e) => { const el = e.target.closest('[data-term]'); if (el && el !== cur && e.pointerType === 'mouse') show(el); else if (!el && cur && e.pointerType === 'mouse') hide(); });
    document.addEventListener('focusin', (e) => { const el = e.target.closest && e.target.closest('[data-term]'); el ? show(el) : hide(); });
    document.addEventListener('click', (e) => { const el = e.target.closest('[data-term]'); if (el) { el === cur ? hide() : show(el); } else if (cur) hide(); });
    document.addEventListener('scroll', hide, true);
  }

  // ================= Bottom sheet (điện thoại) =================
  function initSheet() {
    $('#sheet-handle').addEventListener('click', () => app.sheet());
    // vuốt lên/xuống trên phần đầu sheet để mở/đóng
    let y0 = null;
    $('#sheet-peek').addEventListener('pointerdown', (e) => {
      if (!mobile() || e.target.closest('input,button:not(.sheet-handle)')) return;
      y0 = e.clientY;
    });
    window.addEventListener('pointerup', (e) => {
      if (y0 == null) return;
      const dy = e.clientY - y0; y0 = null;
      if (Math.abs(dy) > 30) app.sheet(dy < 0);
    });
  }

  // ================= Khởi động =================
  function init() {
    cv = $('#sim'); ctx = cv.getContext('2d');
    AL.Spectrum.mount($('#spec'), $('#spec-tip'));
    AL.FX.mount($('#fx'));

    AL.Spectrum.onSelect = (id) => {
      const data = AL.Spectrum.last;
      if (data && data.anon) { app.hint('Đang phân tích mẫu chưa biết: chưa thể chọn vạch'); return; }
      const info = D.line(id), same = store.state.line === id;
      const patch = { line: same ? null : id };
      if (!same && info && D.species[info.sp] && store.state.tab !== 'flame') patch.el = info.sp;
      store.set(patch);
      AL.Spectrum.setHover(id);
    };

    // Kích thước canvas mô phỏng
    const wrap = $('#canvas-wrap');
    const fit = () => {
      const r = wrap.getBoundingClientRect();
      DPR = Math.min(2, window.devicePixelRatio || 1);
      W = Math.max(1, r.width); H = Math.max(1, r.height);
      cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
      if (sim) sim.resize(W, H);
    };
    new ResizeObserver(fit).observe(wrap);
    fit();

    // Con trỏ trên canvas
    const local = (e) => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    cv.addEventListener('pointerdown', (e) => { cv.setPointerCapture(e.pointerId); sim.pointer && sim.pointer('down', ...local(e)); });
    cv.addEventListener('pointermove', (e) => sim.pointer && sim.pointer('move', ...local(e)));
    cv.addEventListener('pointerup', (e) => sim.pointer && sim.pointer('up', ...local(e)));
    cv.addEventListener('pointerleave', (e) => sim.pointer && sim.pointer('leave', ...local(e)));

    Object.values(SIMS).forEach((s) => s.init());

    // State chung → các mô phỏng
    store.on((s, ch) => {
      if (!sim) return;
      if (sim.onState(s, ch)) renderPanel();
      if (ch.mode) { app.renderChallenge(); }
      app.accent();
    });

    // Header
    document.querySelectorAll('.mode-toggle button').forEach((b) => b.addEventListener('click', () => setMode(b.dataset.mode)));
    document.querySelectorAll('[data-action]').forEach((b) => b.addEventListener('click', () => {
      $('#hdr-menu').classList.remove('open'); $('#menu-btn').setAttribute('aria-expanded', 'false');
      const a = b.dataset.action;
      if (a === 'reset') {
        Object.values(SIMS).forEach((s) => s.reset());
        AL.Spectrum.reset();
        store.set({ el: 'O', line: null });
        sim.resize(W, H); sim.enter(); renderPanel(); app.renderChallenge(); app.accent();
        mascotSay('Phòng thí nghiệm đã được đặt lại về trạng thái ban đầu.');
      } else if (a === 'codex') app.openCodex();
      else if (a === 'help') $('#dlg-help').showModal();
      else if (a === 'about') $('#dlg-about').showModal();
    }));
    $('#menu-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      const m = $('#hdr-menu'), o = !m.classList.contains('open');
      m.classList.toggle('open', o); $('#menu-btn').setAttribute('aria-expanded', String(o));
    });
    document.addEventListener('click', (e) => { if (!e.target.closest('#hdr-menu')) $('#hdr-menu').classList.remove('open'); });
    document.querySelectorAll('.tab').forEach((t) => t.addEventListener('click', () => { if (store.state.tab !== t.dataset.tab || !sim) switchTab(t.dataset.tab); }));
    document.querySelectorAll('dialog').forEach((d) => {
      d.addEventListener('click', (e) => { if (e.target === d || e.target.closest('[data-close]')) d.close(); });
    });

    // Linh vật: bấm để nhận mẹo
    $('#mascot').addEventListener('click', () => { const t = D.tips[store.state.tab]; mascotSay(t[tipIx++ % t.length]); });

    // Phím tắt
    document.addEventListener('keydown', (e) => {
      if (document.querySelector('dialog[open]') || e.ctrlKey || e.metaKey || e.altKey) return;
      const tag = (e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      if (['1', '2', '3'].includes(e.key)) { switchTab(['atom', 'aurora', 'flame'][+e.key - 1]); return; }
      if (e.key === '?') { $('#dlg-help').showModal(); return; }
      if (e.key === ' ' && (tag === 'body' || tag === 'canvas' || !e.target.closest('button,a,[tabindex]'))) { e.preventDefault(); sim.primary(); }
    });
    window.addEventListener('hashchange', () => {
      const id = Object.keys(HASH).find((k) => HASH[k] === location.hash.slice(1));
      if (id && id !== store.state.tab) switchTab(id);
    });

    buildCodex(); AL.Codex.mount(); initTerms(); initSheet();

    // Khôi phục lựa chọn của người xem
    setMode(storage.get('mode') === 'full' ? 'full' : 'basic');
    const fromHash = Object.keys(HASH).find((k) => HASH[k] === location.hash.slice(1));
    switchTab(fromHash || storage.get('tab') || 'atom', true);
    if (!storage.get('seen')) { setTimeout(() => mascotSay('Chào mừng đến với Aurora-LAB! Thực hiện các bước 1 → 2 → 3 ở bảng điều khiển, rồi quan sát quang phổ hình thành ở phía dưới. Bấm USACodex để học các khái niệm qua mô phỏng có sẵn.'), 900); storage.set('seen', '1'); }

    // Vòng lặp vẽ (tạm dừng khi tab trình duyệt bị ẩn)
    let last = performance.now(), running = true;
    const frame = (now) => {
      if (!running) return;
      const dt = Math.min(0.05, (now - last) / 1000); last = now; T += dt;
      sim.update(dt, T);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      sim.draw(ctx, W, H, T);
      AL.Spectrum.draw(dt, sim.spectrum());
      AL.FX.draw(dt);
      requestAnimationFrame(frame);
    };
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) running = false;
      else if (!running) { running = true; last = performance.now(); requestAnimationFrame(frame); }
    });
    requestAnimationFrame(frame);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => AL.Spectrum.resize());
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
