/* Aurora-LAB — Sên phi hành gia: người đồng hành xuyên suốt hệ thống.
 *  - Bấm vào Sên: mở menu (gợi ý bước tiếp, giải thích điều đang thấy, kiểm tra nhanh, học khái niệm, bật/tắt nhắc).
 *  - Phản ứng theo ngữ cảnh: chuyển thí nghiệm, chọn nguyên tố/vạch phổ, mở bài USACodex, làm bài kiểm tra.
 *  - Đi theo người học vào các cửa sổ (USACodex, Kiểm tra nhanh, Hướng dẫn…) để không bao giờ “biến mất”.
 *  - Nhắc nhẹ khi người học đứng yên quá lâu (có thể tắt; lựa chọn được ghi nhớ). */
(function () {
  'use strict';
  const AL = window.AL, D = AL.DATA, h = AL.h, fmt = AL.fmt;
  const $ = (s) => document.querySelector(s);
  const KEY = 'aurora-buddy-mute';
  const muted = () => { try { return localStorage.getItem(KEY) === '1'; } catch (e) { return false; } };
  const setMuted = (v) => { try { localStorage.setItem(KEY, v ? '1' : '0'); } catch (e) { /* bỏ qua */ } };

  const say = (t, mood) => AL.app && AL.app.say(t, mood);
  const mood = (m) => AL.Mascot3D && AL.Mascot3D.mood(m);

  // ---------- Lời thoại theo thí nghiệm ----------
  const INTRO = {
    atom: 'Phòng Nguyên tử đây! Chọn một nguyên tố rồi bấm “Cấp năng lượng”. Mỗi lần electron rơi xuống là một photon bay ra, để lại một vạch trên thanh phổ.',
    aurora: 'Lên vùng cực nào! Kéo thanh “Năng lượng mỗi electron” và để ý: electron càng mạnh, dải sáng càng xuống thấp và đổi màu.',
    flame: 'Phòng thí nghiệm ngọn lửa! Chọn một muối, xem màu lửa, rồi đưa kính phân quang vào để thấy “dấu vân tay ánh sáng” của nó.',
  };
  const NEXT = {
    atom: [
      'Thử chọn Hydrogen và bắt đủ 4 vạch Balmer nhìn thấy được nhé: 656,3 · 486,1 · 434,0 · 410,2 nm.',
      'Bấm thẳng vào một mức trên sơ đồ để đưa electron lên đúng mức đó, rồi xem nó rơi xuống theo những đường nào.',
      'Với Oxygen, electron rơi hai bậc liên tiếp: một photon xanh lục 557,7 nm rồi một photon đỏ 630 nm. Đó chính là hai màu cực quang!',
      'Bật chế độ “Đầy đủ” ở góc trên để xem năng lượng từng mức và bảng các chuyển mức.',
    ],
    aurora: [
      'Kéo năng lượng xuống thấp (dưới 1 keV): electron dừng ở trên 200 km, nơi oxygen phát màu đỏ.',
      'Bây giờ kéo lên thật cao (trên 10 keV): dải sáng xuống dưới 100 km, màu tím-lam của N₂⁺ xuất hiện.',
      'Chuyển sang “Từ mặt đất” để thấy cực quang giống như khi bạn đứng ngắm thật.',
      'Bấm vào một dải sáng để biết nó do nguyên tử nào phát ra và ở độ cao bao nhiêu.',
    ],
    flame: [
      'Lithium và strontium đều cho lửa đỏ. Đưa kính vào và so sánh: một bên chỉ có một vạch, bên kia là cả một dải!',
      'Barium và copper đều xanh lục. Gợi ý: copper có thêm một dải lam rộng quanh 435 nm.',
      'Sẵn sàng chưa? Bấm “Bắt đầu” ở ô Thử thách để phân tích mẫu muối chưa biết.',
      'Nhìn kỹ khung kính: đồ thị cường độ ở trên, vạch thật ở giữa, phổ liên tục để đối chiếu ở dưới.',
    ],
  };
  const CONCEPT = { atom: 'emit', aurora: 'quench', flame: 'spectra' };
  const nextIx = { atom: 0, aurora: 0, flame: 0 };
  const tab = () => (AL.store && AL.store.state.tab) || 'atom';

  // ---------- Menu ----------
  let menu;
  const item = (ic, label, fn) => h('button', { type: 'button', role: 'menuitem', class: 'bd-item', onclick: () => { close(); fn(); } }, h('span', { class: 'bd-ic', 'aria-hidden': 'true' }, ic), h('span', null, label));
  function build() {
    menu = h('div', { class: 'bd-menu', id: 'buddy-menu', role: 'menu', hidden: true, 'aria-label': 'Sên phi hành gia' },
      h('div', { class: 'bd-head' }, h('b', null, 'Sên phi hành gia'), h('span', null, 'Mình đi cùng bạn suốt chuyến thí nghiệm')),
      item('💡', 'Gợi ý bước tiếp theo', hint),
      item('🔍', 'Điều gì đang xảy ra?', explain),
      item('🧪', 'Kiểm tra nhanh 3 câu', () => AL.app.openQuiz()),
      item('📚', 'Học khái niệm liên quan', () => AL.app.openCodex(CONCEPT[tab()])),
      h('button', { type: 'button', role: 'menuitemcheckbox', class: 'bd-item bd-mute', onclick: toggleMute }));
    paintMute();
    $('#mascot').after(menu);
  }
  const paintMute = () => {
    const b = menu.querySelector('.bd-mute'), m = muted();
    b.setAttribute('aria-checked', String(!m));
    b.replaceChildren(h('span', { class: 'bd-ic', 'aria-hidden': 'true' }, m ? '🔕' : '🔔'), h('span', null, m ? 'Bật lời nhắc tự động' : 'Tắt lời nhắc tự động'));
  };
  function toggleMute() { setMuted(!muted()); paintMute(); say(muted() ? 'Mình sẽ im lặng. Cần gì cứ bấm vào mình nhé!' : 'Mình sẽ nhắc bạn khi cần.'); }
  function open() {
    const host = $('#mascot').parentElement; if (menu.parentElement !== host) host.append(menu);
    menu.hidden = false; $('#mascot').setAttribute('aria-expanded', 'true'); mood('talk');
    menu.querySelector('.bd-item').focus({ preventScroll: true });
  }
  function close() { if (menu) { menu.hidden = true; $('#mascot').setAttribute('aria-expanded', 'false'); } }

  function hint() { const t = tab(), l = NEXT[t]; say(l[nextIx[t]++ % l.length], 'think'); }
  function explain() {
    const dlg = document.querySelector('dialog[open]');
    if (dlg && dlg.id === 'codex') { const k = $('#cx-key'); say('Điều quan trọng nhất của bài này: ' + (k ? k.textContent : ''), 'think'); return; }
    const ex = document.querySelector('.panel .explain-b');
    const p = ex && ex.querySelector('p');
    const txt = p ? (p.textContent || '').replace(/\s+/g, ' ').trim() : '';
    say(txt ? txt : 'Bạn hãy thực hiện bước 1 ở bảng điều khiển, mình sẽ giải thích ngay điều xảy ra.', 'think');
  }

  // ---------- Phản ứng theo ngữ cảnh ----------
  const seenTab = {};
  let lastLine = null, lastSay = 0, lineTimer = 0;
  const throttled = (fn, gap = 2500) => { const n = performance.now(); if (n - lastSay < gap) return; lastSay = n; fn(); };
  function onState(s, ch) {
    if (ch.tab && !seenTab[s.tab]) { seenTab[s.tab] = true; if (!muted()) setTimeout(() => say(INTRO[s.tab]), 500); }
    if (ch.line && s.line && s.line !== lastLine) {
      lastLine = s.line;
      clearTimeout(lineTimer);
      lineTimer = setTimeout(() => {
        const info = D.line(s.line); if (!info || muted()) return;
        const sp = D.sp(info.sp) || {}, E = AL.eV(info.nm), reg = AL.region(info.nm);
        const where = reg === 'VIS' ? 'màu ' + AL.colorName(info.nm) : reg === 'UV' ? 'tử ngoại, mắt không thấy' : 'hồng ngoại, mắt không thấy';
        const who = info.mol ? 'phân tử ' + info.mol : (sp.name || sp.sym || '');
        throttled(() => say(`${fmt(info.nm, 1)} nm của ${who}: mỗi photon mang ${fmt(E, 2)} eV, ${where}.${info.alt ? ' Phát ra ở độ cao ' + info.alt + '.' : ''}`));
      }, 350);
    }
  }

  // Bài USACodex mới → nhắc câu hỏi dẫn dắt
  function watchCodex() {
    const t = $('#cx-title'); if (!t) return;
    new MutationObserver(() => {
      if (muted() || !$('#codex').open) return;
      const q = $('#cx-q').textContent;
      throttled(() => say('Câu hỏi của bài này: ' + q + ' Thử điều khiển mô phỏng trước khi đọc giải thích nhé!', 'think'), 1200);
    }).observe(t, { childList: true, characterData: true, subtree: true });
  }
  // Kết quả kiểm tra nhanh
  function watchQuiz() {
    const body = $('#quiz-body'); if (!body) return;
    new MutationObserver(() => {
      const sc = body.querySelector('.quiz-score'); if (!sc || !sc.textContent || sc.dataset.said) return;
      sc.dataset.said = '1';
      const m = sc.textContent.match(/(\d)\/(\d)/); if (!m) return;
      if (m[1] === m[2]) say('Đúng hết rồi, giỏi quá! Bạn đã nắm chắc phần này.', 'win');
      else if (+m[1] === 0) say('Không sao đâu! Quay lại mô phỏng thử thêm một lần, rồi làm lại, mình tin bạn làm được.', 'sad');
      else say(`Đúng ${m[1]}/${m[2]} câu, sắp được rồi! Đọc phần giải thích dưới các câu sai rồi thử lại nhé.`, 'think');
    }).observe(body, { childList: true, subtree: true, characterData: true });
  }

  // Sên đi theo vào cửa sổ đang mở (dialog nằm ở lớp trên cùng, nên phải chuyển Sên vào trong)
  function follow() {
    const m = $('#mascot'), b = $('#mascot-bubble'), home = document.body;
    const place = () => {
      const open = [...document.querySelectorAll('dialog[open]')].pop();
      const host = open || home;
      if (m.parentElement !== host) { host.append(m); if (menu) host.append(menu); }
      m.classList.toggle('in-dialog', !!open);
      if (menu) menu.classList.toggle('in-dialog', !!open);
    };
    document.querySelectorAll('dialog').forEach((d) => {
      new MutationObserver(place).observe(d, { attributes: true, attributeFilter: ['open'] });
      d.addEventListener('close', () => { close(); setTimeout(place, 0); });
    });
    place();
    void b;
  }

  // Nhắc khi đứng yên quá lâu
  function idle() {
    let t = 0;
    const reset = () => { clearTimeout(t); t = setTimeout(nudge, 55000); };
    const nudge = () => {
      if (muted() || document.hidden || (menu && !menu.hidden)) return reset();
      const dlg = document.querySelector('dialog[open]');
      if (dlg && dlg.id === 'codex') say('Bạn đang đọc bài à? Khi sẵn sàng, bấm nút màu cam ở cuối bài để thử ngay trong phòng thí nghiệm.', 'think');
      else if (!dlg) hint();
      reset();
    };
    ['pointerdown', 'keydown', 'wheel'].forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();
  }

  function mount() {
    if (!AL.app || !$('#mascot')) return setTimeout(mount, 100);
    build();
    const m = $('#mascot');
    m.setAttribute('aria-haspopup', 'menu'); m.setAttribute('aria-expanded', 'false');
    m.setAttribute('aria-label', 'Sên phi hành gia, người đồng hành: bấm để mở menu');
    // thay hành vi cũ (đọc mẹo) bằng menu
    m.addEventListener('click', (e) => { e.stopImmediatePropagation(); menu.hidden ? open() : close(); }, true);
    document.addEventListener('click', (e) => { if (menu && !menu.hidden && !e.target.closest('#buddy-menu, #mascot')) close(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && menu && !menu.hidden) { e.stopPropagation(); close(); m.focus(); } }, true);
    AL.store.on(onState);
    seenTab[tab()] = true; // thí nghiệm đầu tiên đã có lời chào mừng riêng
    watchCodex(); watchQuiz(); follow(); idle();
    AL.Buddy = { say, hint, explain, open, close };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
})();
