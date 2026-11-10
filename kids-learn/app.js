(() => {
  'use strict';

  const DATA = window.KL_DATA;
  const LS_KEY = 'kl.v1';
  const LANG = { zh: 'zh-TW', en: 'en-US' };
  const PRAISE = {
    zh: ['太棒了！', '好厲害！', '你真棒！'],
    en: ['Great job!', 'Well done!', 'Awesome!']
  };
  const AGAIN = { zh: '再試一次喔', en: 'Try again!' };
  const GOOD_TRY = { zh: '你很棒喔，我們繼續', en: 'Good try! Let us keep going' };

  const $ = (s) => document.querySelector(s);
  const IMG = (code) => 'assets/twemoji/' + code + '.svg';

  /* ---------- 儲存(localStorage 可能不可用, 全部包 try/catch) ---------- */
  const store = {
    load() { try { const raw = localStorage.getItem(LS_KEY); if (raw) return JSON.parse(raw); } catch (e) { /* ignore */ } return null; },
    save(s) { try { localStorage.setItem(LS_KEY, JSON.stringify(s)); } catch (e) { /* ignore */ } }
  };
  const defaults = () => ({
    stars: {},
    stats: { zh: { tries: 0, hits: 0 }, en: { tries: 0, hits: 0 } },
    settings: { zhuyin: true, rate: 0.8, micMode: 'auto', showHeard: true },
    lang: 'zh'
  });
  const saved = store.load() || {};
  const state = Object.assign(defaults(), saved);
  state.settings = Object.assign(defaults().settings, saved.settings || {});
  state.stats = Object.assign(defaults().stats, saved.stats || {});
  state.stats.zh = Object.assign({ tries: 0, hits: 0 }, state.stats.zh);
  state.stats.en = Object.assign({ tries: 0, hits: 0 }, state.stats.en);
  const persist = () => store.save(state);

  const ui = { cat: 0, idx: 0, busy: false, fails: 0, msgTimer: null };

  /* ---------- 辨識比對(刻意放寬) ---------- */
  function normZh(s) { return String(s).replace(/[\s，。、！？,.!?]/g, ''); }

  function matchZh(target, alts, extra) {
    const t = normZh(target);
    if (!t) return false;
    const stem = t.length > 1 && t.endsWith('色') ? t.slice(0, -1) : t;
    const cands = [t, stem].concat((extra || []).map(normZh)).filter(Boolean);
    const chars = Array.from(stem);
    for (const a of alts) {
      const na = normZh(a);
      if (!na) continue;
      if (cands.some((c) => na.includes(c))) return true;
      if (chars.length > 1) {
        const hits = chars.filter((c) => na.includes(c)).length;
        if (hits / chars.length >= 0.5) return true;
      }
    }
    return false;
  }

  function normEn(s) { return String(s).toLowerCase().replace(/[^a-z\s]/g, ' ').replace(/\s+/g, ' ').trim(); }

  function lev(a, b) {
    const m = a.length, n = b.length;
    if (!m) return n;
    if (!n) return m;
    let prev = Array.from({ length: n + 1 }, (_, j) => j);
    for (let i = 1; i <= m; i++) {
      const cur = [i];
      for (let j = 1; j <= n; j++) {
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      }
      prev = cur;
    }
    return prev[n];
  }

  function sameInitial(a, b) {
    const f = (x) => (x[0] === 'k' ? 'c' : x[0]);
    return f(a) === f(b);
  }

  function matchEn(target, alts) {
    const t = normEn(target);
    if (!t) return false;
    const max = t.length <= 5 ? 1 : t.length <= 7 ? 2 : 3;
    for (const a of alts) {
      const na = normEn(a);
      if (!na) continue;
      if ((' ' + na + ' ').includes(' ' + t + ' ')) return true;
      const cands = na.split(' ').concat([na.replace(/ /g, '')]);
      for (const w of cands) {
        if (w && sameInitial(w, t) && lev(w, t) <= max) return true;
      }
    }
    return false;
  }

  /* ---------- 語音合成 ---------- */
  let voices = [];
  function loadVoices() { try { voices = window.speechSynthesis.getVoices() || []; } catch (e) { voices = []; } }
  if ('speechSynthesis' in window) {
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }
  function normLang(v) { return String(v.lang || '').replace('_', '-').toLowerCase(); }
  function pickVoice(lang) {
    const l = lang.toLowerCase();
    return voices.find((v) => normLang(v) === l) ||
      voices.find((v) => normLang(v).startsWith(l.slice(0, 2))) || null;
  }
  function speak(text, lang) {
    return new Promise((resolve) => {
      if (!('speechSynthesis' in window)) { resolve(false); return; }
      try {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = lang;
        u.rate = state.settings.rate;
        u.pitch = 1.1;
        const v = pickVoice(lang);
        if (v) u.voice = v;
        let done = false;
        let timer = null;
        const fin = (ok) => { if (!done) { done = true; clearTimeout(timer); resolve(ok); } };
        u.onend = () => fin(true);
        u.onerror = () => fin(false);
        timer = setTimeout(() => fin(false), 6000);
        window.speechSynthesis.speak(u);
      } catch (e) { resolve(false); }
    });
  }

  /* ---------- 語音辨識 / 錄音 ---------- */
  const getSR = () => window.SpeechRecognition || window.webkitSpeechRecognition || null;

  function listen(lang) {
    return new Promise((resolve) => {
      const SR = getSR();
      if (!SR) { resolve({ ok: false, error: 'unsupported' }); return; }
      let done = false;
      let timer = null;
      let rec = null;
      const finish = (res) => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        try { rec.stop(); } catch (e) { /* ignore */ }
        resolve(res);
      };
      try {
        rec = new SR();
        rec.lang = lang;
        rec.interimResults = false;
        rec.continuous = false;
        rec.maxAlternatives = 5;
        rec.onresult = (e) => {
          const alts = [];
          for (const r of e.results) for (let i = 0; i < r.length; i++) alts.push(r[i].transcript);
          finish({ ok: true, alts });
        };
        rec.onerror = (e) => finish({ ok: false, error: e.error || 'error' });
        rec.onend = () => finish({ ok: false, error: 'no-speech' });
        timer = setTimeout(() => finish({ ok: false, error: 'no-speech' }), 7000);
        rec.start();
      } catch (e) { finish({ ok: false, error: 'start-failed' }); }
    });
  }

  async function recordClip(ms) {
    if (!navigator.mediaDevices || !window.MediaRecorder) return { ok: false, error: 'unsupported' };
    let stream;
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); }
    catch (e) { return { ok: false, error: 'denied' }; }
    return new Promise((resolve) => {
      const chunks = [];
      let rec;
      try { rec = new MediaRecorder(stream); }
      catch (e) { stream.getTracks().forEach((t) => t.stop()); resolve({ ok: false, error: 'unsupported' }); return; }
      rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunks, { type: rec.mimeType || 'audio/webm' });
        resolve({ ok: true, url: URL.createObjectURL(blob) });
      };
      rec.start();
      setTimeout(() => { if (rec.state !== 'inactive') rec.stop(); }, ms);
    });
  }

  function playUrl(url) {
    return new Promise((resolve) => {
      const a = new Audio(url);
      const fin = () => { URL.revokeObjectURL(url); resolve(); };
      a.onended = fin;
      a.onerror = fin;
      a.play().catch(fin);
    });
  }

  /* ---------- 資料存取 / 星星 ---------- */
  const curCat = () => DATA.categories[ui.cat];
  const curWord = () => curCat().words[ui.idx];
  const textFor = (w, lang) => (lang === 'zh' ? w.zh : w.en);
  const starKey = (w, lang) => w.id + ':' + lang;

  function starTotal() { return Object.keys(state.stars).length; }
  function updateStars() { $('#starCount').textContent = String(starTotal()); }

  function award(w, lang, kind) {
    const k = starKey(w, lang);
    if (state.stars[k] === 'pass') return;
    state.stars[k] = kind;
    persist();
    updateStars();
  }

  /* ---------- 畫面 ---------- */
  function showMsg(text) {
    const el = $('#msg');
    el.textContent = text;
    el.classList.add('show');
    clearTimeout(ui.msgTimer);
    ui.msgTimer = setTimeout(() => el.classList.remove('show'), 4500);
  }

  function setHeard(text) {
    $('#heard').textContent = state.settings.showHeard && text ? text : '';
  }

  function zhNode(w, withZy) {
    const frag = document.createDocumentFragment();
    const chars = Array.from(w.zh);
    const zys = w.zy.split(' ');
    chars.forEach((ch, i) => {
      if (withZy && zys[i]) {
        const r = document.createElement('ruby');
        r.append(ch);
        const rt = document.createElement('rt');
        rt.textContent = zys[i];
        r.append(rt);
        frag.append(r);
      } else {
        frag.append(ch);
      }
    });
    return frag;
  }

  function showScreen(name) {
    $('#home').classList.toggle('hidden', name !== 'home');
    $('#learn').classList.toggle('hidden', name !== 'learn');
  }

  function renderHome() {
    const grid = $('#catGrid');
    grid.textContent = '';
    DATA.categories.forEach((cat, i) => {
      const done = cat.words.filter((w) => state.stars[starKey(w, 'zh')] || state.stars[starKey(w, 'en')]).length;
      const b = document.createElement('button');
      b.className = 'cat-card';
      b.setAttribute('aria-label', cat.zh + ' ' + cat.en);
      const im = document.createElement('img');
      im.src = IMG(cat.icon);
      im.alt = '';
      im.width = 84;
      im.height = 84;
      const zh = document.createElement('div'); zh.className = 'zh'; zh.textContent = cat.zh;
      const en = document.createElement('div'); en.className = 'en'; en.textContent = cat.en;
      const pr = document.createElement('div'); pr.className = 'prog'; pr.textContent = done + ' / ' + cat.words.length;
      b.append(im, zh, en, pr);
      b.addEventListener('click', () => openCategory(i));
      grid.append(b);
    });
    updateStars();
  }

  function renderWord() {
    const w = curWord();
    const img = $('#wordImg');
    img.src = IMG(w.img);
    img.alt = w.en;
    img.dataset.anim = w.anim || 'bounce';
    img.classList.remove('burst');

    const main = $('#wordMain');
    const sub = $('#wordSub');
    main.textContent = '';
    sub.textContent = '';
    main.classList.toggle('en', state.lang === 'en');
    if (state.lang === 'zh') {
      main.append(zhNode(w, state.settings.zhuyin));
      sub.textContent = w.en;
    } else {
      main.textContent = w.en;
      sub.append(zhNode(w, false));
    }

    $('#langZh').classList.toggle('on', state.lang === 'zh');
    $('#langEn').classList.toggle('on', state.lang === 'en');

    renderDotsOnly();

    $('#btnPrev').disabled = ui.idx === 0;
    $('#btnNext').classList.remove('hint');
    setHeard('');
    ui.fails = 0;
    updateStars();
  }

  function burstImage() {
    const img = $('#wordImg');
    img.classList.remove('burst');
    void img.offsetWidth;
    img.classList.add('burst');
    img.addEventListener('animationend', () => img.classList.remove('burst'), { once: true });
  }

  function confetti(n) {
    const fx = $('#fx');
    const icons = ['2b50', '1f31f', '2728'];
    for (let i = 0; i < n; i++) {
      const c = document.createElement('div');
      c.className = 'confetti';
      c.style.backgroundImage = 'url(' + IMG(icons[i % icons.length]) + ')';
      const ang = Math.random() * Math.PI * 2;
      const dist = 90 + Math.random() * 150;
      c.style.setProperty('--dx', Math.round(Math.cos(ang) * dist) + 'px');
      c.style.setProperty('--dy', Math.round(Math.sin(ang) * dist - 40) + 'px');
      c.style.setProperty('--rot', Math.round(Math.random() * 360 - 180) + 'deg');
      fx.append(c);
      setTimeout(() => c.remove(), 1300);
    }
  }

  function setListening(on) {
    $('#btnSay').classList.toggle('listening', on);
    $('#btnSay').disabled = false;
  }

  /* ---------- 流程 ---------- */
  function openCategory(i) {
    ui.cat = i;
    ui.idx = 0;
    showScreen('learn');
    renderWord();
    hear();
  }

  function goHome() {
    try { window.speechSynthesis.cancel(); } catch (e) { /* ignore */ }
    showScreen('home');
    renderHome();
  }

  function hear() {
    burstImage();
    return speak(textFor(curWord(), state.lang), LANG[state.lang]);
  }

  function pickPraise(lang) {
    const list = PRAISE[lang];
    return list[Math.floor(Math.random() * list.length)];
  }

  async function celebrate(w, lang, kind) {
    award(w, lang, kind);
    burstImage();
    confetti(kind === 'pass' ? 22 : 10);
    $('#btnNext').classList.add('hint');
    renderDotsOnly();
    await speak(kind === 'pass' ? pickPraise(lang) : GOOD_TRY[lang], LANG[lang]);
  }

  function renderDotsOnly() {
    const cat = curCat();
    const dots = $('#dots');
    dots.textContent = '';
    cat.words.forEach((x, i) => {
      const d = document.createElement('span');
      d.className = 'dot' + (i === ui.idx ? ' cur' : '') + ((state.stars[starKey(x, 'zh')] || state.stars[starKey(x, 'en')]) ? ' done' : '');
      dots.append(d);
    });
  }

  async function handleHeard(alts) {
    const w = curWord();
    const lang = state.lang;
    const st = state.stats[lang];
    st.tries += 1;
    setHeard('聽到：' + alts.slice(0, 3).join(' / '));
    const ok = lang === 'zh' ? matchZh(w.zh, alts, w.altZh) : matchEn(w.en, alts);
    if (ok) {
      st.hits += 1;
      persist();
      ui.fails = 0;
      await celebrate(w, lang, 'pass');
      return;
    }
    persist();
    ui.fails += 1;
    if (ui.fails >= 2) {
      ui.fails = 0;
      await celebrate(w, lang, 'try');
    } else {
      await speak(textFor(w, lang), LANG[lang]);
      await speak(AGAIN[lang], LANG[lang]);
    }
  }

  async function recordFlow() {
    const w = curWord();
    const lang = state.lang;
    const r = await recordClip(3000);
    if (!r.ok) {
      showMsg(r.error === 'denied'
        ? '麥克風被封鎖了，請在瀏覽器網址列允許使用麥克風'
        : '這個瀏覽器無法錄音：' + r.error);
      return;
    }
    await speak(textFor(w, lang), LANG[lang]);
    await playUrl(r.url);
    await celebrate(w, lang, 'try');
  }

  async function onSay() {
    if (ui.busy) return;
    ui.busy = true;
    setListening(true);
    setHeard('');
    try {
      const useSR = state.settings.micMode === 'auto' && !!getSR();
      if (!useSR) {
        await recordFlow();
      } else {
        const res = await listen(LANG[state.lang]);
        if (res.ok) {
          await handleHeard(res.alts);
        } else if (res.error === 'no-speech' || res.error === 'aborted') {
          setHeard('沒有聽到聲音');
          await speak(AGAIN[state.lang], LANG[state.lang]);
        } else if (res.error === 'not-allowed' || res.error === 'service-not-allowed') {
          showMsg('麥克風被封鎖了，請在瀏覽器網址列允許使用麥克風');
        } else {
          showMsg('語音辨識無法使用(' + res.error + ')，改用錄音回放');
          await recordFlow();
        }
      }
    } finally {
      ui.busy = false;
      setListening(false);
    }
  }

  function step(delta) {
    const words = curCat().words;
    const n = ui.idx + delta;
    if (n < 0) return;
    if (n >= words.length) { goHome(); return; }
    ui.idx = n;
    renderWord();
    hear();
  }

  function setLang(lang) {
    if (state.lang === lang) return;
    state.lang = lang;
    persist();
    renderWord();
    hear();
  }

  /* ---------- 家長區 ---------- */
  function openGate() {
    const a = 3 + Math.floor(Math.random() * 7);
    const b = 3 + Math.floor(Math.random() * 7);
    ui.gateAnswer = a + b;
    $('#gateQ').textContent = a + ' + ' + b + ' = ?';
    $('#gateA').value = '';
    $('#gate').showModal();
  }

  function statLine(lang, label) {
    const s = state.stats[lang];
    const pct = s.tries ? Math.round((s.hits / s.tries) * 100) : 0;
    return label + '：辨識 ' + s.tries + ' 次，通過 ' + s.hits + ' 次(' + pct + '%)';
  }

  function openSettings() {
    $('#optZhuyin').checked = state.settings.zhuyin;
    $('#optHeard').checked = state.settings.showHeard;
    $('#optRate').value = String(state.settings.rate);
    $('#optRateVal').textContent = state.settings.rate.toFixed(2);
    $('#optMic').value = state.settings.micMode;
    $('#statText').textContent = '星星 ' + starTotal() + ' 顆。' + statLine('zh', '中文') + '；' + statLine('en', '英文');
    $('#settings').showModal();
  }

  function bind() {
    $('#btnHome').addEventListener('click', goHome);
    $('#btnGear').addEventListener('click', openGate);
    $('#imgBtn').addEventListener('click', hear);
    $('#btnHear').addEventListener('click', hear);
    $('#btnSay').addEventListener('click', onSay);
    $('#btnPrev').addEventListener('click', () => step(-1));
    $('#btnNext').addEventListener('click', () => step(1));
    $('#langZh').addEventListener('click', () => setLang('zh'));
    $('#langEn').addEventListener('click', () => setLang('en'));

    $('#gateForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const ok = Number($('#gateA').value) === ui.gateAnswer;
      $('#gate').close();
      if (ok) openSettings(); else showMsg('答案不對喔');
    });
    $('#gateCancel').addEventListener('click', () => $('#gate').close());

    $('#optZhuyin').addEventListener('change', (e) => { state.settings.zhuyin = e.target.checked; persist(); if (!$('#learn').classList.contains('hidden')) renderWord(); });
    $('#optHeard').addEventListener('change', (e) => { state.settings.showHeard = e.target.checked; persist(); setHeard(''); });
    $('#optRate').addEventListener('input', (e) => { state.settings.rate = Number(e.target.value); $('#optRateVal').textContent = state.settings.rate.toFixed(2); persist(); });
    $('#optMic').addEventListener('change', (e) => { state.settings.micMode = e.target.value; persist(); });
    $('#btnReset').addEventListener('click', () => {
      if (!window.confirm('確定清除所有星星與統計？')) return;
      state.stars = {};
      state.stats = defaults().stats;
      persist();
      $('#settings').close();
      renderHome();
      if (!$('#learn').classList.contains('hidden')) renderWord();
    });
    $('#btnCloseSettings').addEventListener('click', () => $('#settings').close());
  }

  function init() {
    document.querySelectorAll('img[data-ui]').forEach((el) => {
      const code = DATA.ui[el.dataset.ui];
      if (code) el.src = IMG(code);
      el.width = 32; el.height = 32;
    });
    bind();
    renderHome();
    showScreen('home');
    if ('serviceWorker' in navigator && location.protocol === 'https:') {
      navigator.serviceWorker.register('sw.js').catch(() => { /* ignore */ });
    }
  }

  /* 供測試使用 */
  window.KL = { matchZh, matchEn, lev, state, getSR };

  init();
})();
