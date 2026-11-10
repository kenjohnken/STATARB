/* 共用核心：資料、儲存、語音、辨識、路由、獎勵 */
(() => {
  'use strict';

  const DATA = window.KL_DATA;
  const KL = (window.KL = {});
  KL.DATA = DATA;
  KL.STORIES = window.KL_STORIES || [];
  KL.LANG = { zh: 'zh-TW', en: 'en-US' };
  const LANG = KL.LANG;
  const $ = (KL.$ = (s) => document.querySelector(s));
  const IMG = (KL.IMG = (code) => 'assets/twemoji/' + code + '.svg');

  KL.words = [];
  KL.wordById = {};
  DATA.categories.forEach((c) => c.words.forEach((w) => { w.cat = c.id; KL.words.push(w); KL.wordById[w.id] = w; }));
  KL.stickerById = {};
  DATA.stickers.forEach((s) => { KL.stickerById[s.id] = s; });

  KL.PHRASE = {
    praise: { zh: ['太棒了！', '好厲害！', '你真棒！'], en: ['Great job!', 'Well done!', 'Awesome!'] },
    again: { zh: '再試一次喔', en: 'Try again!' },
    goodTry: { zh: '你很棒喔，我們繼續', en: "Good try! Let's keep going" },
    match: { zh: '一樣！', en: 'Match!' }
  };

  /* ---------- 儲存(localStorage 可能不可用，全部包 try/catch) ---------- */
  const LS_KEY = 'kl.v1';
  function load() { try { const raw = localStorage.getItem(LS_KEY); if (raw) return JSON.parse(raw); } catch (e) { /* ignore */ } return null; }
  function save(s) { try { localStorage.setItem(LS_KEY, JSON.stringify(s)); } catch (e) { /* ignore */ } }
  const defaults = () => ({
    stars: {},
    stats: { zh: { tries: 0, hits: 0 }, en: { tries: 0, hits: 0 } },
    settings: { zhuyin: true, rate: 0.8, micMode: 'auto', showHeard: true },
    lang: 'zh',
    stickers: [],
    storiesDone: {}
  });
  const saved = load() || {};
  const state = Object.assign(defaults(), saved);
  state.settings = Object.assign(defaults().settings, saved.settings || {});
  state.stats = {
    zh: Object.assign({ tries: 0, hits: 0 }, saved.stats && saved.stats.zh),
    en: Object.assign({ tries: 0, hits: 0 }, saved.stats && saved.stats.en)
  };
  if (!state.stars || typeof state.stars !== 'object') state.stars = {};
  if (!Array.isArray(state.stickers)) state.stickers = [];
  if (!state.storiesDone || typeof state.storiesDone !== 'object') state.storiesDone = {};
  if (state.lang !== 'en') state.lang = 'zh';
  KL.state = state;
  KL.persist = () => save(state);
  KL.resetProgress = () => {
    const d = defaults();
    state.stars = d.stars;
    state.stats = d.stats;
    state.stickers = d.stickers;
    state.storiesDone = d.storiesDone;
    KL.persist();
  };
  KL.L = (obj) => (obj ? obj[state.lang] : '');

  /* ---------- DOM 小工具 ---------- */
  KL.h = function h(tag, attrs) {
    const e = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach((k) => {
        const v = attrs[k];
        if (v === null || v === undefined || v === false) return;
        if (k === 'class') e.className = v;
        else if (k === 'on') Object.keys(v).forEach((ev) => e.addEventListener(ev, v[ev]));
        else if (k === 'style') e.style.cssText = v;
        else e.setAttribute(k, v === true ? '' : v);
      });
    }
    for (let i = 2; i < arguments.length; i++) {
      const kids = [].concat(arguments[i]);
      kids.forEach((k) => {
        if (k === null || k === undefined || k === false) return;
        e.append(k.nodeType ? k : String(k));
      });
    }
    return e;
  };
  const h = KL.h;
  KL.icon = (code, cls) => {
    const im = document.createElement('img');
    im.src = IMG(code);
    im.alt = '';
    im.draggable = false;
    if (cls) im.className = cls;
    return im;
  };
  KL.shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  };
  KL.pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  KL.wait = (ms) => new Promise((r) => setTimeout(r, ms));
  KL.titleEl = (obj) => h('div', { class: 'title-block' }, h('h1', null, obj.zh), h('p', { class: 'sub' }, obj.en));
  KL.wordText = (w, lang) => (lang === 'zh' ? w.zh : w.en);
  /* 英文指稱：顏色和專有名稱不加 the */
  KL.enRef = (en, isColor) => (isColor || /^[A-Z]/.test(en) ? en : 'the ' + en);
  KL.enArticle = (en) => (/^[aeio]/i.test(en) ? 'an ' : 'a ') + en;

  KL.zhNode = (w, withZy) => {
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
  };

  KL.renderDots = (box, n, cur, doneFn) => {
    box.textContent = '';
    for (let i = 0; i < n; i++) {
      box.append(h('span', { class: 'dot' + (i === cur ? ' cur' : '') + (doneFn && doneFn(i) ? ' done' : '') }));
    }
  };

  /* ---------- 中斷機制：換畫面或換詞時取消進行中的語音流程 ---------- */
  let token = 0;
  let activeRec = null;
  let activeRecorder = null;
  let activeAudio = null;
  KL.alive = () => { const t = token; return () => t === token; };
  KL.cancelAll = () => {
    token++;
    try { window.speechSynthesis.cancel(); } catch (e) { /* ignore */ }
    if (activeRec) { try { activeRec.abort(); } catch (e) { /* ignore */ } activeRec = null; }
    if (activeRecorder && activeRecorder.state !== 'inactive') { try { activeRecorder.stop(); } catch (e) { /* ignore */ } }
    if (activeAudio) { try { activeAudio.a.pause(); } catch (e) { /* ignore */ } activeAudio.fin(); }
  };

  /* ---------- 語音合成 ---------- */
  let voices = [];
  function loadVoices() { try { voices = window.speechSynthesis.getVoices() || []; } catch (e) { voices = []; } }
  if ('speechSynthesis' in window) {
    loadVoices();
    try { window.speechSynthesis.onvoiceschanged = loadVoices; } catch (e) { /* ignore */ }
  }
  const normLang = (v) => String(v.lang || '').replace('_', '-').toLowerCase();
  function pickVoice(lang) {
    const l = lang.toLowerCase();
    return voices.find((v) => normLang(v) === l) || voices.find((v) => normLang(v).startsWith(l.slice(0, 2))) || null;
  }
  KL.speak = (text, lang) => new Promise((resolve) => {
    if (!text || !('speechSynthesis' in window)) { resolve(false); return; }
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
      timer = setTimeout(() => fin(false), 8000);
      window.speechSynthesis.speak(u);
    } catch (e) { resolve(false); }
  });
  /* 依目前語言念出 {zh, en} 物件 */
  KL.speakL = (obj) => KL.speak(KL.L(obj), LANG[state.lang]);

  /* ---------- 語音辨識 / 錄音 ---------- */
  const getSR = (KL.getSR = () => window.SpeechRecognition || window.webkitSpeechRecognition || null);

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
        if (activeRec === rec) activeRec = null;
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
        activeRec = rec;
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
      activeRecorder = rec;
      rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
      rec.onstop = () => {
        if (activeRecorder === rec) activeRecorder = null;
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
      let done = false;
      const fin = () => {
        if (done) return;
        done = true;
        if (activeAudio && activeAudio.a === a) activeAudio = null;
        URL.revokeObjectURL(url);
        resolve();
      };
      activeAudio = { a, fin };
      a.onended = fin;
      a.onerror = fin;
      a.play().catch(fin);
    });
  }

  /* ---------- 辨識比對(刻意放寬) ---------- */
  const normZh = (s) => String(s).replace(/[\s，。、！？,.!?]/g, '');
  KL.matchZh = (target, alts, extra) => {
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
  };
  const normEn = (s) => String(s).toLowerCase().replace(/[^a-z\s]/g, ' ').replace(/\s+/g, ' ').trim();
  KL.lev = (a, b) => {
    const m = a.length, n = b.length;
    if (!m) return n;
    if (!n) return m;
    let prev = Array.from({ length: n + 1 }, (_, j) => j);
    for (let i = 1; i <= m; i++) {
      const cur = [i];
      for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = cur;
    }
    return prev[n];
  };
  const sameInitial = (a, b) => { const f = (x) => (x[0] === 'k' ? 'c' : x[0]); return f(a) === f(b); };
  KL.matchEn = (target, alts) => {
    const t = normEn(target);
    if (!t) return false;
    const max = t.length <= 5 ? 1 : t.length <= 7 ? 2 : 3;
    for (const a of alts) {
      const na = normEn(a);
      if (!na) continue;
      if ((' ' + na + ' ').includes(' ' + t + ' ')) return true;
      const cands = na.split(' ').concat([na.replace(/ /g, '')]);
      for (const w of cands) if (w && sameInitial(w, t) && KL.lev(w, t) <= max) return true;
    }
    return false;
  };

  KL.heardText = (alts) => {
    if (!state.settings.showHeard) return '';
    return alts ? '聽到：' + alts.slice(0, 3).join(' / ') : '沒有聽到聲音';
  };

  /* 錄音後播放示範 + 小孩的聲音 */
  async function recordAndReplay(w, lang) {
    const alive = KL.alive();
    const r = await recordClip(3000);
    if (!r.ok) {
      KL.showMsg(r.error === 'denied' ? '麥克風被封鎖了，請在瀏覽器網址列允許使用麥克風' : '這個瀏覽器無法錄音：' + r.error);
      return { status: 'blocked' };
    }
    if (!alive()) { URL.revokeObjectURL(r.url); return { status: 'aborted' }; }
    await KL.speak(KL.wordText(w, lang), LANG[lang]);
    if (!alive()) { URL.revokeObjectURL(r.url); return { status: 'aborted' }; }
    await playUrl(r.url);
    return { status: 'recorded' };
  }

  /* 跟讀一次：pass / fail / nospeech / blocked / recorded / aborted */
  async function sayOnce(w, lang) {
    const useSR = state.settings.micMode === 'auto' && !!getSR();
    if (!useSR) return recordAndReplay(w, lang);
    const res = await listen(LANG[lang]);
    if (res.ok) {
      const st = state.stats[lang];
      st.tries += 1;
      const ok = lang === 'zh' ? KL.matchZh(w.zh, res.alts, w.altZh) : KL.matchEn(w.en, res.alts);
      if (ok) st.hits += 1;
      KL.persist();
      return { status: ok ? 'pass' : 'fail', heard: res.alts };
    }
    if (res.error === 'no-speech' || res.error === 'aborted') return { status: 'nospeech' };
    if (res.error === 'not-allowed' || res.error === 'service-not-allowed') {
      KL.showMsg('麥克風被封鎖了，請在瀏覽器網址列允許使用麥克風');
      return { status: 'blocked' };
    }
    KL.showMsg('語音辨識無法使用(' + res.error + ')，改用錄音回放');
    return recordAndReplay(w, lang);
  }

  /* 跟讀流程(含失敗計數)：回傳 {result: pass|try|again|blocked} 或 null(被中斷)
   * 失敗兩次也算完成(try)，不讓小孩卡關 */
  KL.sayAttempt = async (w, lang, fails, onHeard) => {
    const alive = KL.alive();
    const r = await sayOnce(w, lang);
    if (!alive() || r.status === 'aborted') return null;
    if (onHeard && (r.heard || r.status === 'nospeech')) onHeard(r.heard || null);
    if (r.status === 'pass') { fails.n = 0; return { result: 'pass' }; }
    if (r.status === 'recorded') return { result: 'try' };
    if (r.status === 'blocked') return { result: 'blocked' };
    if (r.status === 'fail') {
      fails.n += 1;
      if (fails.n >= 2) { fails.n = 0; return { result: 'try' }; }
      await KL.speak(KL.wordText(w, lang), LANG[lang]);
      if (!alive()) return null;
      await KL.speak(KL.PHRASE.again[lang], LANG[lang]);
      return { result: 'again' };
    }
    await KL.speak(KL.PHRASE.again[lang], LANG[lang]);
    return { result: 'again' };
  };

  /* ---------- 星星 / 貼紙 ---------- */
  KL.starTotal = () => Object.keys(state.stars).length;
  KL.hasStar = (w) => !!(state.stars[w.id + ':zh'] || state.stars[w.id + ':en']);
  KL.award = (w, lang, kind) => {
    const k = w.id + ':' + lang;
    if (state.stars[k] === 'pass') return;
    state.stars[k] = kind;
    KL.persist();
    KL.updateHeader();
  };
  KL.giveSticker = (preferredId) => {
    const owned = new Set(state.stickers);
    let pick = preferredId && KL.stickerById[preferredId] && !owned.has(preferredId) ? preferredId : null;
    if (!pick) {
      const pool = DATA.stickers.filter((s) => !owned.has(s.id) && !s.story);
      if (pool.length) pick = KL.pick(pool).id;
    }
    if (!pick) {
      const rest = DATA.stickers.filter((s) => !owned.has(s.id));
      if (rest.length) pick = rest[0].id;
    }
    if (!pick) return null;
    state.stickers.push(pick);
    KL.persist();
    return KL.stickerById[pick];
  };

  /* ---------- 特效 / 訊息 ---------- */
  let msgTimer = null;
  KL.showMsg = (text) => {
    const el = $('#msg');
    el.textContent = text;
    el.classList.add('show');
    clearTimeout(msgTimer);
    msgTimer = setTimeout(() => el.classList.remove('show'), 4500);
  };
  const replayAnim = (el, cls) => {
    if (!el) return;
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
    el.addEventListener('animationend', () => el.classList.remove(cls), { once: true });
  };
  KL.burst = (el) => replayAnim(el, 'burst');
  KL.shake = (el) => replayAnim(el, 'shake');
  KL.confetti = (n) => {
    const fx = $('#fx');
    const icons = ['2b50', '1f31f', '2728'];
    for (let i = 0; i < n; i++) {
      const c = h('div', { class: 'confetti' });
      c.style.backgroundImage = 'url(' + IMG(icons[i % icons.length]) + ')';
      const ang = Math.random() * Math.PI * 2;
      const dist = 90 + Math.random() * 150;
      c.style.setProperty('--dx', Math.round(Math.cos(ang) * dist) + 'px');
      c.style.setProperty('--dy', Math.round(Math.sin(ang) * dist - 40) + 'px');
      c.style.setProperty('--rot', Math.round(Math.random() * 360 - 180) + 'deg');
      fx.append(c);
      setTimeout(() => c.remove(), 1300);
    }
  };

  /* ---------- 獎勵畫面 ---------- */
  KL.hideOverlay = () => {
    const ov = $('#overlay');
    ov.classList.add('hidden');
    ov.textContent = '';
  };
  KL.reward = (opts) => {
    const s = KL.giveSticker(opts.stickerId);
    const lang = state.lang;
    const ov = $('#overlay');
    ov.textContent = '';
    const nameLine = s
      ? (lang === 'zh' ? '新貼紙：' + s.zh : 'New sticker: ' + s.en)
      : (lang === 'zh' ? '貼紙全部收集完了！' : 'You have every sticker!');
    const btn = (code, label, fn) => h('button', { class: 'round-btn big', 'aria-label': label, on: { click: fn } }, KL.icon(code));
    ov.append(h('div', { class: 'reward' },
      h('div', { class: 'reward-title' }, KL.L(opts.title)),
      KL.icon(s ? s.img : DATA.ui.trophy, 'reward-sticker'),
      h('div', { class: 'reward-name' }, nameLine),
      h('div', { class: 'reward-actions' },
        opts.again ? btn(DATA.ui.again, '再玩一次', () => { KL.hideOverlay(); opts.again(); }) : null,
        btn(DATA.ui.book, '貼紙簿', () => KL.go('book')),
        btn(DATA.ui.home, '回首頁', () => KL.go('home'))
      )
    ));
    ov.classList.remove('hidden');
    KL.confetti(30);
    KL.updateHeader();
    KL.speak(s
      ? (lang === 'zh' ? '太棒了！你得到' + s.zh + '貼紙！' : 'Great job! You got ' + KL.enArticle(s.en) + ' sticker!')
      : KL.pick(KL.PHRASE.praise[lang]), LANG[lang]);
    return s;
  };

  /* ---------- 路由 ---------- */
  const screens = {};
  let current = null;
  KL.register = (name, render, parent) => { screens[name] = { render, parent }; };
  KL.current = () => current;
  KL.parentOf = (name, params) => {
    const scr = screens[name];
    return scr && scr.parent ? scr.parent(params || {}) : null;
  };
  KL.go = (name, params) => {
    params = params || {};
    KL.cancelAll();
    KL.hideOverlay();
    if (current && current.api && current.api.destroy) { try { current.api.destroy(); } catch (e) { /* ignore */ } }
    const view = $('#view');
    view.textContent = '';
    view.className = 'view v-' + name;
    current = { name, params, api: {} };
    current.api = screens[name].render(view, params) || {};
    KL.updateHeader();
    try { window.scrollTo(0, 0); } catch (e) { /* ignore */ }
  };
  KL.back = () => {
    if (!current) { KL.go('home'); return; }
    const par = KL.parentOf(current.name, current.params);
    if (par) KL.go(par[0], par[1]); else KL.go('home');
  };
  KL.toggleLang = () => {
    state.lang = state.lang === 'zh' ? 'en' : 'zh';
    KL.persist();
    KL.updateHeader();
    if (!current) return;
    if (current.api.onLang) current.api.onLang();
    else KL.go(current.name, current.params);
  };
  KL.updateHeader = () => {
    $('#starCount').textContent = String(KL.starTotal());
    $('#btnLang').textContent = state.lang === 'zh' ? '中文' : 'English';
    const btn = $('#btnHome');
    const onHome = !current || current.name === 'home';
    btn.classList.toggle('invisible', onHome);
    const par = current ? KL.parentOf(current.name, current.params) : null;
    const img = btn.querySelector('img');
    const code = !par || par[0] === 'home' ? DATA.ui.home : DATA.ui.prev;
    if (img && img.dataset.code !== code) { img.src = IMG(code); img.dataset.code = code; }
  };
})();
