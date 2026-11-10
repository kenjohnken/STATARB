/* 遊戲：找一找(聽音找圖)、翻翻樂(翻牌配對) */
(() => {
  'use strict';
  const KL = window.KL;
  const h = KL.h;
  const icon = KL.icon;
  const state = KL.state;
  const ui = KL.DATA.ui;

  /* ---------- 找一找：聽到詞，點出正確的圖 ---------- */
  KL.register('find', (view, p) => {
    let dead = false;
    const pool = p.cat === 'all' ? KL.words.slice() : (KL.DATA.categories[p.cat] || KL.DATA.categories[0]).words.slice();
    const targets = KL.shuffle(pool).slice(0, Math.min(8, pool.length));
    const total = targets.length;
    let round = 0;
    let target = null;
    let wrong = 0;
    let locked = false;
    let cards = [];

    const dots = h('div', { class: 'dots' });
    const promptText = h('div', { class: 'prompt-text' });
    const replay = h('button', { class: 'big-btn hear mid', 'aria-label': '再聽一次', on: { click: () => ask() } }, icon(ui.speaker));
    const grid = h('div', { class: 'choice-grid' });
    view.append(
      h('div', { class: 'game-top' }, dots),
      h('div', { class: 'prompt-row' }, replay, promptText),
      grid
    );

    const isColor = (w) => w.cat === 'colors';
    const promptFor = (w) => (state.lang === 'zh' ? '找找看，' + w.zh + '在哪裡？' : 'Find ' + KL.enRef(w.en, isColor(w)) + '!');
    const wrongFor = (w) => (state.lang === 'zh' ? '這是' + w.zh + '，再找找看' : 'That is ' + KL.enRef(w.en, isColor(w)) + '. Try again!');
    const conflicts = (a, b) => a === b || a.en === b.en || a.zh === b.zh;

    function ask() {
      if (!target) return Promise.resolve(false);
      promptText.textContent = promptFor(target);
      return KL.speak(promptFor(target), KL.LANG[state.lang]);
    }

    function nextRound() {
      if (dead) return;
      if (round >= total) {
        KL.renderDots(dots, total, -1, () => true);
        KL.reward({ title: { zh: '全部找到了！', en: 'You found them all!' }, again: () => KL.go('find', p) });
        return;
      }
      target = targets[round];
      wrong = 0;
      locked = false;
      const n = round < 4 ? 3 : 4;
      let opts = KL.shuffle(pool.filter((w) => !conflicts(w, target))).slice(0, n - 1);
      if (opts.length < n - 1) {
        const extra = KL.shuffle(KL.words.filter((w) => !conflicts(w, target) && !opts.includes(w))).slice(0, n - 1 - opts.length);
        opts = opts.concat(extra);
      }
      const choices = KL.shuffle([target].concat(opts));
      grid.textContent = '';
      grid.className = 'choice-grid n' + choices.length;
      cards = choices.map((w) => {
        const b = h('button', { class: 'choice', 'aria-label': w.en, 'data-id': w.id }, icon(w.img, 'anim'));
        b.addEventListener('click', () => pick(w, b));
        grid.append(b);
        return { w, b };
      });
      KL.renderDots(dots, total, round, (i) => i < round);
      ask();
    }

    async function pick(w, b) {
      if (locked || dead) return;
      if (w === target) {
        locked = true;
        b.classList.add('correct');
        KL.burst(b);
        KL.confetti(14);
        round += 1;
        await Promise.all([KL.speak(KL.pick(KL.PHRASE.praise[state.lang]), KL.LANG[state.lang]), KL.wait(700)]);
        nextRound();
      } else {
        wrong += 1;
        KL.shake(b);
        if (wrong >= 2) {
          const c = cards.find((x) => x.w === target);
          if (c) c.b.classList.add('hintpulse');
        }
        KL.speak(wrongFor(w), KL.LANG[state.lang]);
      }
    }

    nextRound();
    return {
      destroy() { dead = true; },
      onLang() { KL.cancelAll(); if (!locked) ask(); }
    };
  }, () => ['cats', { mode: 'find' }]);

  /* ---------- 翻翻樂：翻牌配對 ---------- */
  KL.register('memory', (view, p) => {
    if (!p.pairs) {
      const levels = [
        { pairs: 3, zh: '簡單', en: 'Easy' },
        { pairs: 4, zh: '普通', en: 'Normal' },
        { pairs: 6, zh: '挑戰', en: 'Hard' }
      ];
      const box = h('div', { class: 'diff-list' });
      levels.forEach((lv) => {
        const minis = h('div', { class: 'mini-cards' });
        for (let i = 0; i < lv.pairs * 2; i++) minis.append(h('span', { class: 'mini' }));
        box.append(h('button', {
          class: 'diff-btn', 'aria-label': lv.zh + ' ' + lv.en,
          on: { click: () => KL.go('memory', { pairs: lv.pairs }) }
        }, h('div', { class: 'diff-name' }, h('span', { class: 'zh' }, lv.zh), h('span', { class: 'en' }, lv.en)), minis));
      });
      view.append(KL.titleEl({ zh: '翻翻樂', en: 'Memory' }), box);
      return {};
    }

    let dead = false;
    const pairs = p.pairs;
    const chosen = [];
    KL.shuffle(KL.words).forEach((w) => {
      if (chosen.length < pairs && !chosen.some((c) => c.img === w.img)) chosen.push(w);
    });
    const deck = KL.shuffle(chosen.concat(chosen)).map((w, i) => ({ w, i, matched: false, el: null }));
    const grid = h('div', { class: 'mem-grid cols' + (pairs === 3 ? 3 : 4) });
    let open = [];
    let lock = false;
    let matched = 0;

    deck.forEach((c) => {
      c.el = h('button', { class: 'mcard', 'aria-label': '翻牌', 'data-id': c.w.id },
        h('div', { class: 'inner' },
          h('div', { class: 'face back' }, icon(ui.star)),
          h('div', { class: 'face front' }, icon(c.w.img))
        )
      );
      c.el.addEventListener('click', () => flip(c));
      grid.append(c.el);
    });
    view.append(KL.titleEl({ zh: '翻翻樂', en: 'Memory' }), grid);

    async function flip(c) {
      if (dead || lock || c.matched || open.includes(c)) return;
      c.el.classList.add('flip');
      open.push(c);
      const sp = KL.speak(KL.wordText(c.w, state.lang), KL.LANG[state.lang]);
      if (open.length < 2) return;
      lock = true;
      await Promise.all([sp, KL.wait(900)]);
      if (dead) return;
      const a = open[0];
      const b = open[1];
      if (a.w === b.w) {
        a.matched = true;
        b.matched = true;
        a.el.classList.add('matched');
        b.el.classList.add('matched');
        KL.burst(a.el);
        KL.burst(b.el);
        KL.confetti(8);
        matched += 1;
        open = [];
        if (matched === pairs) {
          await KL.speak(KL.pick(KL.PHRASE.praise[state.lang]), KL.LANG[state.lang]);
          if (dead) return;
          KL.reward({ title: { zh: '全部配對完成！', en: 'All matched!' }, again: () => KL.go('memory', { pairs }) });
        } else {
          lock = false;
          KL.speak(KL.PHRASE.match[state.lang], KL.LANG[state.lang]);
        }
      } else {
        a.el.classList.remove('flip');
        b.el.classList.remove('flip');
        open = [];
        await KL.wait(450);
        lock = false;
      }
    }

    return { destroy() { dead = true; }, onLang() {} };
  }, (p) => (p.pairs ? ['memory', {}] : ['home']));
})();
