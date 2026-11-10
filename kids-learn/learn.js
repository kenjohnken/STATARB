/* 分類選單 + 學單字 */
(() => {
  'use strict';
  const KL = window.KL;
  const h = KL.h;
  const icon = KL.icon;
  const state = KL.state;
  const ui = KL.DATA.ui;

  /* 分類選單：mode = learn(學單字) 或 find(找一找) */
  KL.register('cats', (view, p) => {
    const mode = p.mode === 'find' ? 'find' : 'learn';
    const title = mode === 'find' ? { zh: '找一找', en: 'Find It' } : { zh: '學單字', en: 'Words' };
    const grid = h('div', { class: 'cat-grid' });
    KL.DATA.categories.forEach((cat, i) => {
      let prog = null;
      if (mode === 'learn') {
        const done = cat.words.filter((w) => KL.hasStar(w)).length;
        prog = h('div', { class: 'prog' }, done + ' / ' + cat.words.length);
      }
      grid.append(h('button', {
        class: 'cat-card', 'aria-label': cat.zh + ' ' + cat.en,
        on: { click: () => { KL.go(mode, { cat: i }); } }
      }, icon(cat.icon), h('div', { class: 'zh' }, cat.zh), h('div', { class: 'en' }, cat.en), prog));
    });
    if (mode === 'find') {
      grid.append(h('button', {
        class: 'cat-card', 'aria-label': '全部 All',
        on: { click: () => KL.go('find', { cat: 'all' }) }
      }, icon(ui.mixed), h('div', { class: 'zh' }, '全部'), h('div', { class: 'en' }, 'All')));
    }
    view.append(KL.titleEl(title), grid);
    return {};
  }, () => ['home']);

  /* 學單字 */
  KL.register('learn', (view, p) => {
    const cat = KL.DATA.categories[p.cat] || KL.DATA.categories[0];
    let idx = 0;
    let busy = false;
    const fails = { n: 0 };

    const img = h('img', { class: 'wordimg anim', alt: '', draggable: 'false' });
    const imgBtn = h('button', { class: 'img-btn', 'aria-label': '聽發音', on: { click: () => hear() } }, img);
    const main = h('div', { class: 'word-main' });
    const sub = h('div', { class: 'word-sub' });
    const hearBtn = h('button', { class: 'big-btn hear', 'aria-label': '聽', on: { click: () => hear() } }, icon(ui.speaker));
    const sayBtn = h('button', { class: 'big-btn say', 'aria-label': '跟我唸', on: { click: () => onSay() } }, icon(ui.mic));
    const heard = h('div', { class: 'heard' });
    const prev = h('button', { class: 'nav-btn', 'aria-label': '上一個', on: { click: () => step(-1) } }, icon(ui.prev));
    const next = h('button', { class: 'nav-btn', 'aria-label': '下一個', on: { click: () => step(1) } }, icon(ui.next));
    const dots = h('div', { class: 'dots' });
    view.append(
      h('div', { class: 'card' }, imgBtn, main, sub),
      h('div', { class: 'actions' }, hearBtn, sayBtn),
      heard,
      h('nav', { class: 'nav' }, prev, dots, next)
    );

    const word = () => cat.words[idx];
    const renderDots = () => KL.renderDots(dots, cat.words.length, idx, (i) => KL.hasStar(cat.words[i]));

    function render() {
      const w = word();
      img.src = KL.IMG(w.img);
      img.alt = w.en;
      img.dataset.anim = w.anim || 'bounce';
      main.textContent = '';
      sub.textContent = '';
      main.classList.toggle('en', state.lang === 'en');
      if (state.lang === 'zh') {
        main.append(KL.zhNode(w, state.settings.zhuyin));
        sub.textContent = w.en;
      } else {
        main.textContent = w.en;
        sub.append(KL.zhNode(w, false));
      }
      renderDots();
      prev.disabled = idx === 0;
      next.classList.remove('hint');
      heard.textContent = '';
      fails.n = 0;
    }

    function hear() {
      KL.burst(img);
      return KL.speak(KL.wordText(word(), state.lang), KL.LANG[state.lang]);
    }

    async function onSay() {
      if (busy) return;
      busy = true;
      sayBtn.classList.add('listening');
      heard.textContent = '';
      const alive = KL.alive();
      try {
        const w = word();
        const lang = state.lang;
        const r = await KL.sayAttempt(w, lang, fails, (alts) => { heard.textContent = KL.heardText(alts); });
        if (!r || !alive()) return;
        if (r.result === 'pass' || r.result === 'try') {
          KL.award(w, lang, r.result);
          KL.burst(img);
          KL.confetti(r.result === 'pass' ? 22 : 10);
          next.classList.add('hint');
          renderDots();
          await KL.speak(r.result === 'pass' ? KL.pick(KL.PHRASE.praise[lang]) : KL.PHRASE.goodTry[lang], KL.LANG[lang]);
        }
      } finally {
        busy = false;
        sayBtn.classList.remove('listening');
      }
    }

    function step(d) {
      const n = idx + d;
      if (n < 0) return;
      KL.cancelAll();
      if (n >= cat.words.length) { KL.go('cats', { mode: 'learn' }); return; }
      idx = n;
      busy = false;
      sayBtn.classList.remove('listening');
      render();
      hear();
    }

    render();
    hear();
    return {
      onLang() { KL.cancelAll(); busy = false; sayBtn.classList.remove('listening'); render(); hear(); },
      settingsChanged() { render(); }
    };
  }, () => ['cats', { mode: 'learn' }]);
})();
