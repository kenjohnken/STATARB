/* 互動故事：故事清單 + 故事引擎(點選 / 拖曳 / 跟讀 任務) */
(() => {
  'use strict';
  const KL = window.KL;
  const h = KL.h;
  const icon = KL.icon;
  const state = KL.state;
  const ui = KL.DATA.ui;

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  KL.register('stories', (view) => {
    const list = h('div', { class: 'story-list' });
    KL.STORIES.forEach((s) => {
      list.append(h('button', {
        class: 'story-card', 'aria-label': s.title.zh + ' ' + s.title.en,
        on: { click: () => { KL.go('story', { id: s.id }); } }
      },
      icon(s.cover, 'story-cover'),
      h('div', { class: 'story-info' }, h('div', { class: 'zh' }, s.title.zh), h('div', { class: 'en' }, s.title.en)),
      state.storiesDone[s.id] ? icon(ui.check, 'story-done') : null));
    });
    view.append(KL.titleEl({ zh: '聽故事', en: 'Stories' }), list);
    return {};
  }, () => ['home']);

  KL.register('story', (view, p) => {
    const story = KL.STORIES.find((s) => s.id === p.id) || KL.STORIES[0];
    let dead = false;
    let pageIdx = 0;
    let busy = false;
    const doneTasks = new Set();

    /* 目前頁面狀態 */
    let page = null;
    let task = null;
    let done = true;
    let fails = { n: 0 };
    let elById = {};

    const scene = h('div', { class: 'scene' });
    const textMain = h('div', { class: 'story-text' });
    const textSub = h('div', { class: 'story-sub' });
    const replay = h('button', { class: 'round-btn', 'aria-label': '再聽一次', on: { click: () => narrate() } }, icon(ui.speaker));
    const taskText = h('div', { class: 'task-text' });
    const micBtn = h('button', { class: 'big-btn say mid', 'aria-label': '跟我唸', on: { click: () => onSay() } }, icon(ui.mic));
    const taskBox = h('div', { class: 'task-box' }, icon(ui.point, 'task-icon'), taskText, micBtn);
    const heard = h('div', { class: 'heard' });
    const prev = h('button', { class: 'nav-btn', 'aria-label': '上一頁', on: { click: () => turn(-1) } }, icon(ui.prev));
    const next = h('button', { class: 'nav-btn', 'aria-label': '下一頁', on: { click: () => turn(1) } }, icon(ui.next));
    const dots = h('div', { class: 'dots' });

    view.append(
      h('div', { class: 'story-head' }, h('span', { class: 'zh' }, story.title.zh), h('span', { class: 'en' }, story.title.en)),
      scene,
      h('div', { class: 'story-textbox' }, h('div', { class: 'story-lines' }, textMain, textSub), replay),
      taskBox,
      heard,
      h('nav', { class: 'nav' }, prev, dots, next)
    );

    const itemName = (it) => {
      if (it.word && KL.wordById[it.word]) { const w = KL.wordById[it.word]; return { zh: w.zh, en: w.en, color: w.cat === 'colors' }; }
      return it.name ? { zh: it.name.zh, en: it.name.en, color: false } : null;
    };
    const imgOf = (id) => (elById[id] ? elById[id].querySelector('img') : null);

    function placeAt(wrap, x, y) {
      wrap.classList.add('moving');
      wrap.style.left = x + '%';
      wrap.style.top = y + '%';
      setTimeout(() => wrap.classList.remove('moving'), 600);
    }

    function renderPage() {
      KL.cancelAll();
      busy = false;
      page = story.pages[pageIdx];
      task = page.task || null;
      done = !task || doneTasks.has(pageIdx);
      fails = { n: 0 };
      elById = {};

      scene.className = 'scene bg-' + (page.bg || 'meadow');
      scene.textContent = '';
      page.items.forEach((it) => {
        const img = h('img', { class: 'item-img anim', src: KL.IMG(it.img), alt: '', draggable: 'false' });
        if (it.anim) img.dataset.anim = it.anim;
        const wrap = h('div', {
          class: 'item' + (it.flip ? ' mirror' : ''),
          style: 'left:' + it.x + '%;top:' + it.y + '%;width:' + it.s + '%',
          'data-id': it.id
        }, h('div', { class: 'flipper' }, img));
        wrap.addEventListener('click', () => onItem(it, wrap));
        scene.append(wrap);
        elById[it.id] = wrap;
      });

      /* 已完成的頁面回來看時，維持完成後的樣子 */
      if (task && done) {
        if (task.type === 'drag') {
          const to = page.items.find((i) => i.id === task.to);
          const w = elById[task.item];
          if (to && w) { w.style.left = to.x + '%'; w.style.top = to.y + '%'; w.classList.add('front'); }
        }
        if (task.type === 'tap' && task.moveTo && elById[task.target]) elById[task.target].classList.add('gone');
      }
      if (task && task.type === 'drag' && !done) setupDrag();

      textMain.textContent = KL.L(page.text);
      textSub.textContent = state.lang === 'zh' ? page.text.en : page.text.zh;
      taskBox.classList.toggle('hidden', !task);
      taskBox.classList.toggle('done', !!task && done);
      taskText.textContent = task ? KL.L(task.prompt) : '';
      micBtn.classList.toggle('hidden', !task || task.type !== 'say' || done);
      micBtn.classList.remove('listening');
      heard.textContent = '';

      KL.renderDots(dots, story.pages.length, pageIdx, (i) => i < pageIdx);
      prev.disabled = pageIdx === 0;
      next.disabled = !done;
      next.classList.remove('hint');
      narrate();
    }

    async function narrate() {
      KL.cancelAll();
      busy = false;
      micBtn.classList.remove('listening');
      const alive = KL.alive();
      await KL.speakL(page.text);
      if (!alive() || dead) return;
      if (task && !done) await KL.speakL(task.prompt);
      else if (!task) next.classList.add('hint');
    }

    function onItem(it, wrap) {
      if (dead) return;
      if (wrap.dataset.dragged === '1') { wrap.dataset.dragged = ''; return; }
      const name = itemName(it);
      if (task && !done && task.type === 'tap') {
        if (it.id === task.target) { success(); return; }
        if (!name) return;
        fails.n += 1;
        KL.shake(wrap.querySelector('img'));
        if (fails.n >= 2) { const t = imgOf(task.target); if (t) t.classList.add('hintpulse'); }
        const line = state.lang === 'zh'
          ? '這是' + name.zh + '，再找找看'
          : 'That is ' + KL.enRef(name.en, name.color) + '. Try again!';
        KL.speak(line, KL.LANG[state.lang]);
        return;
      }
      if (!name) return;
      KL.burst(wrap.querySelector('img'));
      KL.speak(state.lang === 'zh' ? name.zh : name.en, KL.LANG[state.lang]);
    }

    function setupDrag() {
      const it = page.items.find((i) => i.id === task.item);
      const to = page.items.find((i) => i.id === task.to);
      const wrap = elById[task.item];
      if (!it || !to || !wrap) return;
      wrap.classList.add('draggable');
      let st = null;
      wrap.addEventListener('pointerdown', (e) => {
        if (done || dead) return;
        e.preventDefault();
        try { wrap.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
        st = { r: scene.getBoundingClientRect(), sx: e.clientX, sy: e.clientY, moved: false };
        wrap.classList.add('dragging');
      });
      wrap.addEventListener('pointermove', (e) => {
        if (!st) return;
        if (!st.moved && Math.hypot(e.clientX - st.sx, e.clientY - st.sy) > 8) st.moved = true;
        if (!st.moved) return;
        const x = clamp(((e.clientX - st.r.left) / st.r.width) * 100, 0, 100);
        const y = clamp(((e.clientY - st.r.top) / st.r.height) * 100, 0, 100);
        wrap.style.left = x + '%';
        wrap.style.top = y + '%';
      });
      const end = () => {
        if (!st) return;
        const r = st.r;
        const moved = st.moved;
        st = null;
        wrap.classList.remove('dragging');
        if (!moved) return;
        wrap.dataset.dragged = '1';
        setTimeout(() => { wrap.dataset.dragged = ''; }, 0);
        const x = parseFloat(wrap.style.left);
        const y = parseFloat(wrap.style.top);
        const dist = Math.hypot(((x - to.x) * r.width) / 100, ((y - to.y) * r.height) / 100);
        const thr = Math.max(r.width * 0.15, ((r.width * to.s) / 100) * 0.75);
        if (dist <= thr) {
          placeAt(wrap, to.x, to.y);
          wrap.classList.add('front');
          success();
          return;
        }
        fails.n += 1;
        placeAt(wrap, it.x, it.y);
        if (fails.n >= 2) { const t = imgOf(task.to); if (t) t.classList.add('hintpulse'); }
        if (fails.n >= 4) {
          setTimeout(() => {
            if (dead || done) return;
            placeAt(wrap, to.x, to.y);
            wrap.classList.add('front');
            success();
          }, 650);
          return;
        }
        KL.speakL(task.prompt);
      };
      wrap.addEventListener('pointerup', end);
      wrap.addEventListener('pointercancel', end);
    }

    async function onSay() {
      if (busy || done || !task || task.type !== 'say') return;
      busy = true;
      micBtn.classList.add('listening');
      heard.textContent = '';
      const myPage = pageIdx;
      try {
        const w = KL.wordById[task.word];
        const lang = state.lang;
        const r = await KL.sayAttempt(w, lang, fails, (alts) => { heard.textContent = KL.heardText(alts); });
        if (!r || dead || myPage !== pageIdx) return;
        if (r.result === 'pass') KL.award(w, lang, 'pass');
        if (r.result === 'pass' || r.result === 'try' || r.result === 'blocked') await success();
      } finally {
        busy = false;
        micBtn.classList.remove('listening');
      }
    }

    async function success() {
      if (done || dead) return;
      done = true;
      doneTasks.add(pageIdx);
      KL.cancelAll();
      taskBox.classList.add('done');
      micBtn.classList.add('hidden');
      let focusId = null;
      if (task.type === 'tap') focusId = task.target;
      else if (task.type === 'drag') focusId = task.item;
      else if (task.type === 'say') { const it = page.items.find((i) => i.word === task.word); if (it) focusId = it.id; }
      page.items.forEach((i) => { const im = imgOf(i.id); if (im) im.classList.remove('hintpulse'); });
      if (focusId) KL.burst(imgOf(focusId));
      if (task.type === 'tap' && task.moveTo) {
        const t = page.items.find((i) => i.id === task.moveTo);
        const el = elById[task.target];
        if (t && el) {
          setTimeout(() => {
            if (dead) return;
            el.classList.add('front');
            placeAt(el, t.x, t.y);
            setTimeout(() => el.classList.add('gone'), 550);
          }, 350);
        }
      }
      KL.confetti(12);
      next.disabled = false;
      next.classList.add('hint');
      await KL.speakL(task.done);
    }

    function turn(d) {
      if (dead) return;
      if (d > 0 && !done) return;
      const n = pageIdx + d;
      if (n < 0) return;
      if (n >= story.pages.length) { finish(); return; }
      pageIdx = n;
      renderPage();
    }

    function finish() {
      state.storiesDone[story.id] = true;
      KL.persist();
      KL.cancelAll();
      KL.reward({ title: { zh: '故事說完了！', en: 'The End!' }, stickerId: story.sticker, again: () => KL.go('story', { id: story.id }) });
    }

    renderPage();
    return {
      destroy() { dead = true; },
      onLang() { renderPage(); }
    };
  }, () => ['stories', {}]);
})();
