/* 首頁選單、貼紙簿、家長設定、啟動 */
(() => {
  'use strict';
  const KL = window.KL;
  const h = KL.h;
  const icon = KL.icon;
  const state = KL.state;
  const ui = KL.DATA.ui;
  const $ = KL.$;

  /* ---------- 首頁 ---------- */
  KL.register('home', (view) => {
    const total = KL.DATA.stickers.length;
    const tiles = [
      { key: 'learn', img: ui.learn, zh: '學單字', en: 'Words', go: () => KL.go('cats', { mode: 'learn' }) },
      { key: 'find', img: ui.find, zh: '找一找', en: 'Find It', go: () => KL.go('cats', { mode: 'find' }) },
      { key: 'memory', img: ui.memory, zh: '翻翻樂', en: 'Memory', go: () => KL.go('memory', {}) },
      { key: 'story', img: ui.story, zh: '聽故事', en: 'Stories', go: () => KL.go('stories', {}) },
      { key: 'book', img: ui.book, zh: '貼紙簿', en: 'Stickers', go: () => KL.go('book', {}), wide: true, extra: state.stickers.length + ' / ' + total }
    ];
    const grid = h('div', { class: 'menu-grid' });
    tiles.forEach((t) => {
      grid.append(h('button', {
        class: 'menu-tile tile-' + t.key + (t.wide ? ' wide' : ''), 'aria-label': t.zh + ' ' + t.en, 'data-key': t.key,
        on: { click: () => { t.go(); KL.speak(state.lang === 'zh' ? t.zh : t.en, KL.LANG[state.lang]); } }
      },
      icon(t.img),
      h('div', { class: 'menu-label' }, h('div', { class: 'zh' }, t.zh), h('div', { class: 'en' }, t.en), t.extra ? h('div', { class: 'prog' }, t.extra) : null)));
    });
    view.append(KL.titleEl({ zh: '小小學習樂園', en: 'Little Learner' }), grid);
    return {};
  });

  /* ---------- 貼紙簿 ---------- */
  KL.register('book', (view) => {
    const owned = new Set(state.stickers);
    const grid = h('div', { class: 'sticker-grid' });
    KL.DATA.stickers.forEach((s) => {
      const has = owned.has(s.id);
      const b = h('button', { class: 'sticker' + (has ? '' : ' locked'), 'aria-label': has ? s.zh + ' ' + s.en : '還沒拿到', 'data-id': s.id }, icon(s.img));
      b.addEventListener('click', () => {
        if (!has) {
          KL.speakL({ zh: '還沒拿到喔，去玩遊戲或聽故事吧！', en: 'Not yet! Play a game or read a story.' });
          return;
        }
        KL.burst(b);
        KL.speak(state.lang === 'zh' ? s.zh : s.en, KL.LANG[state.lang]);
      });
      grid.append(b);
    });
    view.append(
      KL.titleEl({ zh: '我的貼紙簿', en: 'My Stickers' }),
      h('p', { class: 'book-count' }, owned.size + ' / ' + KL.DATA.stickers.length),
      grid
    );
    return {};
  }, () => ['home']);

  /* ---------- 家長設定 ---------- */
  let gateAnswer = 0;
  function openGate() {
    const a = 3 + Math.floor(Math.random() * 7);
    const b = 3 + Math.floor(Math.random() * 7);
    gateAnswer = a + b;
    $('#gateQ').textContent = a + ' + ' + b + ' = ?';
    $('#gateA').value = '';
    $('#gate').showModal();
  }

  function statLine(lang, label) {
    const s = state.stats[lang];
    const pct = s.tries ? Math.round((s.hits / s.tries) * 100) : 0;
    return label + '辨識 ' + s.tries + ' 次，通過 ' + s.hits + ' 次(' + pct + '%)';
  }

  function openSettings() {
    $('#optZhuyin').checked = state.settings.zhuyin;
    $('#optHeard').checked = state.settings.showHeard;
    $('#optRate').value = String(state.settings.rate);
    $('#optRateVal').textContent = Number(state.settings.rate).toFixed(2);
    $('#optMic').value = state.settings.micMode;
    const storiesDone = Object.keys(state.storiesDone).length;
    $('#statText').textContent =
      '星星 ' + KL.starTotal() + ' 顆，貼紙 ' + state.stickers.length + ' / ' + KL.DATA.stickers.length +
      '，故事看完 ' + storiesDone + ' / ' + KL.STORIES.length + '。' +
      statLine('zh', '中文') + '；' + statLine('en', '英文') + '。';
    $('#settings').showModal();
  }

  function refreshCurrent() {
    const cur = KL.current();
    if (!cur) return;
    if (cur.api && cur.api.settingsChanged) cur.api.settingsChanged();
  }

  function bind() {
    $('#btnHome').addEventListener('click', () => KL.back());
    $('#btnLang').addEventListener('click', () => KL.toggleLang());
    $('#btnGear').addEventListener('click', openGate);

    $('#gateForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const ok = Number($('#gateA').value) === gateAnswer;
      $('#gate').close();
      if (ok) openSettings(); else KL.showMsg('答案不對喔');
    });
    $('#gateCancel').addEventListener('click', () => $('#gate').close());

    $('#optZhuyin').addEventListener('change', (e) => { state.settings.zhuyin = e.target.checked; KL.persist(); refreshCurrent(); });
    $('#optHeard').addEventListener('change', (e) => { state.settings.showHeard = e.target.checked; KL.persist(); });
    $('#optRate').addEventListener('input', (e) => {
      state.settings.rate = Number(e.target.value);
      $('#optRateVal').textContent = state.settings.rate.toFixed(2);
      KL.persist();
    });
    $('#optMic').addEventListener('change', (e) => { state.settings.micMode = e.target.value; KL.persist(); });
    let resetArmed = false;
    $('#btnReset').addEventListener('click', () => {
      const btn = $('#btnReset');
      if (!resetArmed) {
        resetArmed = true;
        btn.textContent = '再按一次確認清除';
        setTimeout(() => { resetArmed = false; btn.textContent = '清除進度'; }, 4000);
        return;
      }
      resetArmed = false;
      btn.textContent = '清除進度';
      KL.resetProgress();
      $('#settings').close();
      KL.go('home');
    });
    $('#btnCloseSettings').addEventListener('click', () => $('#settings').close());
  }

  function init() {
    document.querySelectorAll('img[data-ui]').forEach((el) => {
      const code = ui[el.dataset.ui];
      if (code) { el.src = KL.IMG(code); el.dataset.code = code; }
    });
    bind();
    KL.go('home');
    if ('serviceWorker' in navigator && location.protocol === 'https:') {
      navigator.serviceWorker.register('sw.js').catch(() => { /* ignore */ });
    }
  }

  init();
})();
