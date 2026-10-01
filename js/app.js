/* ADIP Tools — v5.2 shell + router.
   Tema v5.1 "Arang & Coral" dipertahankan. v5.2 menambah:
   kartu "Lanjutkan", smart search (fuzzy typo-tolerant + keywords),
   label visual-first (Populer/Riwayat), grid kategori berikon,
   ikon tab bar lebih besar, urutan cerdas (favorit & riwayat naik).
   Kelas CSS memakai kontrak style.css v5.2. */
import { h as T, utils } from './core.js?v=5.2.0';
import { manifest, VERSION } from './manifest.js?v=5.2.0';

/* ============ sapaan waktu-aware ============ */
function greet() {
  const hr = new Date().getHours();
  if (hr < 11) return 'Selamat pagi';
  if (hr < 15) return 'Selamat siang';
  if (hr < 18) return 'Selamat sore';
  return 'Selamat malam';
}

/* ============ kata kunci penolakan chip ============ */
/* Kata ini tidak boleh muncul sebagai chip. Jika muncul dari Supabase,
   langsung hapus permanen dari tool_search_terms (bukan sekadar filter). */
const SEARCH_DENY = ['muse-test'];
/* Id kategori WAJIB sama persis dengan nilai "cat" di manifest
   (v5.2: perbaiki bug v5.1 — id 'dev'/'harian'/'produktif'/'api' tidak
   cocok dengan manifest 'developer'/'sehari'/'produktivitas'/'liveapi'
   sehingga 25 tool tak pernah muncul di filter kategori). */
const CATS = [
  ['semua', 'Semua'], ['indonesia', 'Indonesia'], ['keamanan', 'Keamanan'],
  ['converter', 'Converter'], ['developer', 'Dev & Web'], ['desain', 'Desain'],
  ['musik', 'Musik & Audio'], ['gambar', 'Gambar'], ['teks', 'Teks'],
  ['bisnis', 'Bisnis'], ['sehari', 'Sehari-hari'], ['fun', 'Fun'],
  ['produktivitas', 'Produktivitas'], ['pelajar', 'Pelajar'], ['liveapi', 'Live API'],
];
const CAT_ICON = {
  semua: '🗂️', indonesia: '🇮🇩', keamanan: '🛡️', converter: '🔄',
  developer: '💻', desain: '🎨', musik: '🎵', gambar: '🖼️', teks: '✏️',
  bisnis: '💼', sehari: '🏠', fun: '🎉', produktivitas: '⚡',
  pelajar: '🎓', liveapi: '🌐',
};
const catLabel = id => (CATS.find(c => c[0] === id) || [id, id])[1];

/* ============ Supabase: trending + pencatatan search ============ */
const SB_URL = 'https://jebafddwupyqpwevhsqn.supabase.co';
const SB_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmVuZXNlLCJyb2xlIjoiYW5vbiIsImV4cCI6MjA0NzIzMzc4M30.NzGv3XvBvXQJX3Pz8wKf9m2n4p6q8r0s1t3u5v7w9x0y1z2';
let SB_POPULAR = [];
async function sbFetchPopular() {
  try {
    const r = await fetch(`${SB_URL}/rest/v1/rpc/trending_terms`, {
      method: 'POST', headers: { apikey: SB_ANON, Authorization: `Bearer ${SB_ANON}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_days: 7, p_limit: 10 }),
    });
    if (!r.ok) return;
    const rows = await r.json();
    SB_POPULAR = (rows || [])
      .map(x => x.term)
      .filter(t => t && !SEARCH_DENY.some(d => String(t).toLowerCase().includes(d)));
    /* penghapus permanen: jika kata terlarang lolos, delete dari tabel */
    (rows || []).forEach(async x => {
      if (x.term && SEARCH_DENY.some(d => String(x.term).toLowerCase().includes(d))) {
        try {
          await fetch(`${SB_URL}/rest/v1/tool_search_terms?term=eq.${encodeURIComponent(x.term)}`, {
            method: 'DELETE', headers: { apikey: SB_ANON, Authorization: `Bearer ${SB_ANON}` },
          });
        } catch (e) { /* abaikan */ }
      }
    });
    if (SB_POPULAR.length) renderSug();
  } catch (e) { /* diam: situs tetap jalan tanpa trending */ }
}
function sbTrack(q) {
  if (!q || SEARCH_DENY.some(d => String(q).toLowerCase().includes(d))) return;
  fetch(`${SB_URL}/rest/v1/rpc/track_search`, {
    method: 'POST', headers: { apikey: SB_ANON, Authorization: `Bearer ${SB_ANON}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ p_term: q.slice(0, 80) }),
  }).catch(() => {});
}

/* ============ favorit & riwayat (localStorage) ============ */
const LS_FAV = 'adip-tools:fav', LS_REC = 'adip-tools:recent';
const getFav = () => { try { return JSON.parse(localStorage.getItem(LS_FAV)) || []; } catch (e) { return []; } };
const isFav = id => getFav().includes(id);
function toggleFav(id) {
  let f = getFav();
  f = f.includes(id) ? f.filter(x => x !== id) : [...f, id];
  localStorage.setItem(LS_FAV, JSON.stringify(f));
  return f.includes(id);
}
const getRecent = () => {
  try {
    const r = JSON.parse(localStorage.getItem(LS_REC)) || [];
    /* v5.2: format [{id, t}] dengan timestamp; migrasi otomatis dari format lama [id] */
    return r.map(x => (typeof x === 'string' ? { id: x, t: 0 } : x)).filter(x => x && x.id);
  } catch (e) { return []; }
};
function pushRecent(id) {
  const r = [{ id, t: Date.now() }, ...getRecent().filter(x => x.id !== id)].slice(0, 12);
  localStorage.setItem(LS_REC, JSON.stringify(r));
}
/* "dibuka X lalu" — Bahasa Indonesia */
function ago(ts) {
  if (!ts) return '';
  const s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return 'baru saja';
  const m = Math.floor(s / 60);
  if (m < 60) return m + ' mnt lalu';
  const h = Math.floor(m / 60);
  if (h < 24) return h + ' jam lalu';
  const d = Math.floor(h / 24);
  if (d < 30) return d + ' hari lalu';
  return Math.floor(d / 30) + ' bln lalu';
}
const byId = id => manifest.find(m => m.id === id);

/* ============ toast ============ */
let toastT;
function toast(msg) {
  let el = document.querySelector('.toast');
  if (!el) { el = document.createElement('div'); el.className = 'toast'; document.body.appendChild(el); }
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastT);
  toastT = setTimeout(() => el.classList.remove('show'), 2200);
}

/* ============ tombol favorit: sinkronisasi lintas tampilan ============ */
function bindFav(btn, id) {
  btn.classList.toggle('on', isFav(id));
  btn.setAttribute('aria-pressed', isFav(id) ? 'true' : 'false');
  btn.onclick = e => {
    e.preventDefault(); e.stopPropagation();
    const on = toggleFav(id);
    btn.classList.remove('pop'); void btn.offsetWidth; btn.classList.add('pop');
    syncFavBtns(id, on);
    toast(on ? 'Ditambahkan ke favorit' : 'Dihapus dari favorit');
    if (document.body.dataset.route === 'favorit') renderFavList();
    else renderQuick();
  };
}
function syncFavBtns(id, on) {
  document.querySelectorAll(`[data-fav="${id}"]`).forEach(b => {
    b.classList.toggle('on', on);
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
}

/* ============ placeholder contoh bergilir ============ */
const PH_EXAMPLES = ['Coba "gaji"...', 'Coba "qr"...', 'Coba "weton"...', 'Coba "kompres foto"...', 'Coba "thr"...', 'Coba "meme"...'];
let phIdx = 0, phTimer;
function rotatePh(input) {
  clearInterval(phTimer);
  phTimer = setInterval(() => {
    if (document.activeElement === input) return;
    input.placeholder = PH_EXAMPLES[phIdx++ % PH_EXAMPLES.length];
  }, 2800);
}

/* ============ reveal saat scroll ============ */
let rvObs;
function observeRv(root) {
  if (!('IntersectionObserver' in window)) { root.querySelectorAll('.rv').forEach(el => el.classList.add('in')); return; }
  rvObs = rvObs || new IntersectionObserver(es => es.forEach(en => {
    if (en.isIntersecting) { en.target.classList.add('in'); rvObs.unobserve(en.target); }
  }), { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
  root.querySelectorAll('.rv').forEach(el => rvObs.observe(el));
}
/* fade tepi rel horizontal saat konten terpotong */
function paintFadeX(box) {
  const max = box.scrollWidth - box.clientWidth;
  if (max <= 2) { box.classList.remove('fx-l', 'fx-r'); return; }
  const x = box.scrollLeft;
  box.classList.toggle('fx-l', x > 4);
  box.classList.toggle('fx-r', x < max - 4);
}
function watchFadeX(box) {
  if (!box) return;
  const paint = () => paintFadeX(box);
  box.addEventListener('scroll', paint, { passive: true });
  new ResizeObserver(paint).observe(box);
  setTimeout(paint, 60);
}

/* ============ smart search: typo-tolerant + keywords + urutan cerdas ============ */
/* Levenshtein distance untuk toleransi typo ("kalkultor" -> "kalkulator") */
function lev(a, b) {
  a = a.toLowerCase(); b = b.toLowerCase();
  if (a === b) return 0;
  const m = a.length, n = b.length;
  if (!m) return n; if (!n) return m;
  let prev = new Array(n + 1), cur = new Array(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    cur[0] = i;
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    const t = prev; prev = cur; cur = t;
  }
  return prev[n];
}
function fuzzyScore(q, text) {
  q = q.toLowerCase().trim(); text = text.toLowerCase();
  if (!q) return 0;
  if (text.includes(q)) return 1000 + q.length;
  let qi = 0, score = 0, consec = 0;
  for (let i = 0; i < text.length && qi < q.length; i++) {
    if (text[i] === q[qi]) { score += 10 + consec * 5; consec++; qi++; } else consec = 0;
  }
  return qi === q.length ? score : 0;
}
/* skor satu token query terhadap daftar kata (nama/keywords/deskripsi) */
function wordScore(tok, words) {
  let best = 0;
  for (const w of words) {
    if (!w || w.length < 2) continue;
    if (w === tok) return 500;
    if (w.startsWith(tok)) best = Math.max(best, 400 + tok.length);
    else if (w.includes(tok)) best = Math.max(best, 300 + tok.length);
    else {
      const d = lev(tok, w);
      const tol = w.length >= 6 ? 2 : w.length >= 4 ? 1 : 0;
      if (d > 0 && d <= tol) best = Math.max(best, 200 - d * 60 + tok.length);
    }
  }
  return best;
}
const splitWords = s => String(s || '').toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length > 1);
function searchScore(q, m) {
  const toks = q.toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (!toks.length) return 0;
  const nameW = splitWords(m.name);
  const kwW = String(m.keywords || '').split(',').map(s => s.trim().toLowerCase()).filter(w => w.length > 1);
  const descW = splitWords(m.desc);
  let total = 0;
  for (const t of toks) {
    const s = Math.max(wordScore(t, nameW), wordScore(t, kwW) * 0.9, wordScore(t, descW) * 0.5);
    if (s > 0) { total += s; continue; }
    /* fallback: subsequence di teks gabungan (pola lama) */
    const fb = fuzzyScore(t, `${m.name} ${m.desc}`);
    if (fb <= 0) return 0;
    total += fb * 0.3;
  }
  return total;
}
/* urutan cerdas: favorit & yang baru/sering dibuka naik ke atas */
function smartBoost(m, base, favSet, recIdx) {
  let s = base;
  if (favSet.has(m.id)) s += 250;
  const ri = recIdx.get(m.id);
  if (ri !== undefined) s += 200 - ri * 12;
  return s;
}
function searchCtx() {
  return { favSet: new Set(getFav()), recIdx: new Map(getRecent().map((x, i) => [x.id, i])) };
}
function rankedSearch(q) {
  const ql = (q || '').trim().toLowerCase();
  if (!ql) return [];
  const { favSet, recIdx } = searchCtx();
  return manifest
    .map(m => ({ m, s: smartBoost(m, searchScore(ql, m), favSet, recIdx) }))
    .filter(x => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .map(x => x.m);
}
function palResults(q) {
  q = (q || '').trim();
  if (!q) {
    const { favSet } = searchCtx();
    const recIds = new Set(getRecent().map(x => x.id));
    return {
      recent: getRecent().map(x => byId(x.id)).filter(Boolean).slice(0, 5),
      favs: getFav().map(byId).filter(m => m && !recIds.has(m.id)).slice(0, 5),
      all: [],
    };
  }
  return { recent: [], favs: [], all: rankedSearch(q).slice(0, 12) };
}
function hiMark(text, q) {
  if (!q) return T.esc(text);
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return T.esc(text);
  return T.esc(text.slice(0, i)) + '<mark>' + T.esc(text.slice(i, i + q.length)) + '</mark>' + T.esc(text.slice(i + q.length));
}

/* ============ command palette ============ */
let palEl, palQ = '', palActive = 0;
function openPalette() {
  closePalette();
  document.body.style.overflow = 'hidden';
  palQ = ''; palActive = 0;
  palEl = document.createElement('div');
  palEl.className = 'pal-wrap';
  palEl.innerHTML = `
    <div class="pal-backdrop"></div>
    <div class="pal" role="dialog" aria-modal="true" aria-label="Cari tool">
      <div class="pal-bar">
        <span class="glyph">⌕</span>
        <input id="palIn" type="text" placeholder="Ketik nama tool..." autocomplete="off" spellcheck="false" aria-label="Cari tool">
        <kbd>esc</kbd>
      </div>
      <div class="pal-list" id="palList"></div>
      <div class="pal-hint"><span><kbd>↑↓</kbd> pilih</span><span><kbd>↵</kbd> buka</span><span><kbd>esc</kbd> tutup</span></div>
    </div>`;
  document.body.appendChild(palEl);
  const inp = palEl.querySelector('#palIn');
  palEl.querySelector('.pal-backdrop').onclick = closePalette;
  inp.oninput = () => { palQ = inp.value; palActive = 0; renderPalList(); };
  inp.onkeydown = e => {
    const items = palEl.querySelectorAll('.pal-item');
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      palActive = (palActive + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % Math.max(items.length, 1);
      renderPalList();
    } else if (e.key === 'Enter') {
      const it = items[palActive];
      if (it) it.click();
    }
  };
  renderPalList();
  setTimeout(() => inp.focus(), 40);
}
function closePalette() {
  if (!palEl) return;
  palEl.remove(); palEl = null;
  document.body.style.overflow = '';
}
function palItem(m, i) {
  return `<button class="pal-item${i === palActive ? ' act' : ''}" data-go="${m.id}">
    <span class="pic">${m.icon}</span>
    <span class="ptx"><span class="pnm">${hiMark(m.name, palQ)}</span><span class="pds">${T.esc(m.desc)}</span></span>
    <span class="pct">${catLabel(m.cat)}</span>
  </button>`;
}
function renderPalList() {
  if (!palEl) return;
  const box = palEl.querySelector('#palList');
  const { recent, favs, all } = palResults(palQ);
  let html = '', idx = 0;
  if (palQ.trim()) {
    if (!all.length) {
      html = `<div class="pal-empty">Tidak ketemu.<br>Coba kata lain, atau lihat daftar kategori di beranda.</div>`;
    } else {
      html = `<div class="pal-sec">${all.length} hasil</div>` + all.map(m => palItem(m, idx++)).join('');
    }
  } else {
    if (recent.length) html += `<div class="pal-sec">🕐 Riwayat</div>` + recent.map(m => palItem(m, idx++)).join('');
    if (favs.length) html += `<div class="pal-sec">⭐ Favorit</div>` + favs.map(m => palItem(m, idx++)).join('');
    if (!recent.length && !favs.length) html = `<div class="pal-empty">Ketik untuk mencari ${manifest.length} tools.<br>Misal: gaji, qr, weton.</div>`;
  }
  box.innerHTML = html;
  box.querySelectorAll('.pal-item').forEach(el => {
    el.onclick = () => { closePalette(); location.hash = '#/t/' + el.dataset.go; };
    el.onmouseenter = () => {
      palActive = [...box.querySelectorAll('.pal-item')].indexOf(el);
      box.querySelectorAll('.pal-item').forEach(x => x.classList.remove('act'));
      el.classList.add('act');
    };
  });
  const act = box.querySelectorAll('.pal-item')[palActive];
  if (act) act.scrollIntoView({ block: 'nearest' });
}

/* ============ bottom tab bar persisten ============ */
function ensureTabs() {
  let nav = document.querySelector('.tabs');
  if (nav) return nav;
  nav = document.createElement('nav');
  nav.className = 'tabs';
  nav.setAttribute('aria-label', 'Navigasi utama');
  nav.innerHTML = `
    <a class="tab" data-tab="home" href="#/"><span class="ti">🏠</span><span>Beranda</span></a>
    <button class="tab" data-tab="search" id="tabSearch" aria-label="Cari cepat"><span class="ti">🔍</span><span>Cari</span></button>
    <a class="tab" data-tab="fav" href="#/favorit"><span class="ti">⭐</span><span>Favorit</span></a>`;
  document.body.appendChild(nav);
  nav.querySelector('#tabSearch').onclick = openPalette;
  return nav;
}
function setTabActive(name) {
  const nav = ensureTabs();
  nav.querySelectorAll('.tab').forEach(t => t.classList.toggle('on', t.dataset.tab === name));
}

/* ============ kartu grid direktori ============ */
function cardEl(m, i, showCat) {
  const a = document.createElement('a');
  a.className = 'tcard rv';
  a.style.setProperty('--i', Math.min(i % 12, 12));
  a.href = '#/t/' + m.id;
  a.innerHTML = `
    <span class="tic">${m.icon}</span>
    <span class="nm">${T.esc(m.name)}</span>
    <span class="ds">${T.esc(m.desc)}</span>
    ${showCat ? `<span class="ct">${catLabel(m.cat)}</span>` : ''}
    <button class="fav" data-fav="${m.id}" aria-label="Favorit ${T.esc(m.name)}">★</button>`;
  bindFav(a.querySelector('.fav'), m.id);
  return a;
}

/* ============ home ============ */
let homeState = { q: '', cat: 'semua' };
function renderSug() {
  const box = document.getElementById('sug');
  if (!box) return;
  const chips = SB_POPULAR.length ? SB_POPULAR : ['kalkulator thr', 'weton jawa', 'kompres gambar', 'password aman', 'camelot wheel'];
  box.innerHTML = `<span class="lbl">🔥 Populer</span>` +
    chips.map(c => `<button class="schip" data-q="${T.esc(c)}">${T.esc(c)}</button>`).join('');
  box.querySelectorAll('.schip').forEach(b => {
    b.onclick = () => {
      const inp = document.getElementById('q');
      inp.value = b.dataset.q;
      onSearch(inp.value);
      document.querySelector('.sbar').scrollIntoView({ behavior: 'smooth' });
    };
  });
}
function renderQuick() {
  const box = document.getElementById('quick');
  if (!box) return;
  const favs = getFav().map(byId).filter(Boolean);
  const recs = getRecent().map(x => byId(x.id)).filter(Boolean);
  const frag = document.createDocumentFragment();
  if (favs.length) {
    const sec = document.createElement('section');
    sec.className = 'sec';
    sec.innerHTML = `<div class="sechead"><h2>⭐ Favorit</h2><span class="n">${favs.length}</span></div>`;
    const rail = document.createElement('div');
    rail.className = 'frail';
    favs.forEach(m => {
      const a = document.createElement('a');
      a.className = 'fcard rv';
      a.href = '#/t/' + m.id;
      a.innerHTML = `<span class="fic">${m.icon}</span><span class="ftx"><span class="fnm">${T.esc(m.name)}</span><span class="fct">${catLabel(m.cat)}</span></span><button class="fav" data-fav="${m.id}" aria-label="Hapus dari favorit">★</button>`;
      bindFav(a.querySelector('.fav'), m.id);
      rail.appendChild(a);
    });
    sec.appendChild(rail);
    frag.appendChild(sec);
    watchFadeX(rail);
  }
  if (recs.length) {
    const sec = document.createElement('section');
    sec.className = 'sec';
    sec.innerHTML = `<div class="sechead"><h2>🕐 Riwayat</h2></div>`;
    const chips = document.createElement('div');
    chips.className = 'rchips';
    recs.forEach(m => {
      const a = document.createElement('a');
      a.className = 'rchip';
      a.href = '#/t/' + m.id;
      a.innerHTML = `<span class="ric">${m.icon}</span>${T.esc(m.name)}`;
      chips.appendChild(a);
    });
    sec.appendChild(chips);
    frag.appendChild(sec);
    watchFadeX(chips);
  }
  const quick = document.getElementById('quick');
  quick.innerHTML = '';
  quick.appendChild(frag);
  observeRv(quick);
}
function home() {
  document.body.dataset.route = 'home';
  setTabActive('home');
  const app = document.getElementById('app');
  const total = manifest.length;
  const catTiles = CATS.map(([id, label]) => {
    const n = id === 'semua' ? total : manifest.filter(m => m.cat === id).length;
    return `<button class="cattile${homeState.cat === id ? ' on' : ''}" data-cat="${id}" aria-label="Kategori ${label}">
      <span class="ci">${CAT_ICON[id] || '🧰'}</span><span class="cl">${label}</span><span class="cn">${n}</span>
    </button>`;
  }).join('');
  app.innerHTML = `
  <div class="wrap view">
    <header class="top">
      <a class="brand" href="#/"><span class="mark">A</span><span class="wm">ADIP <em>Tools</em></span></a>
      <div class="top-right">
        <span class="topcount"><b>${total}</b> tools</span>
        <button class="icobtn" id="palBtn" aria-label="Cari cepat (Ctrl+K)">⌕</button>
      </div>
    </header>
    <div class="sbar">
      <div class="box">
        <span class="glyph">⌕</span>
        <input id="q" type="search" placeholder='${T.esc(PH_EXAMPLES[0])}' autocomplete="off" spellcheck="false" aria-label="Cari tools">
        <button class="clear" id="qClear" aria-label="Hapus pencarian">✕</button>
      </div>
    </div>
    <section class="hero">
      <p class="hi">${greet()}, butuh bantuan apa?</p>
      <h1>Butuh <span class="qm">apa?</span></h1>
      <p class="sub"><b>${total} tools gratis</b> yang jalan langsung di browser. Tanpa daftar, tanpa ribet.</p>
      <div class="sug" id="sug"></div>
    </section>
    <div id="contd"></div>
    <div class="catgrid" id="cats">${catTiles}</div>
    <div id="quick"></div>
    <div id="dir"></div>
    <footer class="foot">
      <div class="fmark">A</div><br>
      <b>ADIP Tools</b> · ${total} tools · jalan 100% lokal di browser<br>
      dibuat dengan teliti, gratis selamanya
    </footer>
  </div>`;
  /* events */
  const inp = document.getElementById('q');
  const clearBtn = document.getElementById('qClear');
  inp.value = homeState.q;
  if (homeState.q) clearBtn.classList.add('show');
  inp.addEventListener('input', () => {
    clearBtn.classList.toggle('show', !!inp.value);
    onSearch(inp.value);
  });
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') sbTrack(inp.value.trim()); });
  clearBtn.onclick = () => { inp.value = ''; clearBtn.classList.remove('show'); onSearch(''); inp.focus(); };
  rotatePh(inp);
  document.getElementById('palBtn').onclick = openPalette;
  document.getElementById('cats').querySelectorAll('.cattile').forEach(b => {
    b.onclick = () => {
      const next = homeState.cat === b.dataset.cat ? 'semua' : b.dataset.cat;
      homeState.cat = next;
      document.getElementById('cats').querySelectorAll('.cattile').forEach(x => x.classList.toggle('on', x.dataset.cat === next));
      renderDir();
      document.getElementById('dir').scrollIntoView({ behavior: 'smooth' });
    };
  });
  renderSug();
  sbFetchPopular();
  renderContinue();
  renderQuick();
  renderDir();
  observeRv(app);
}
/* kartu "Lanjutkan": tool terakhir dibuka, satu tap langsung pakai lagi */
function renderContinue() {
  const box = document.getElementById('contd');
  if (!box) return;
  const r = getRecent()[0];
  const t = r && byId(r.id);
  if (!t) { box.innerHTML = ''; return; }
  box.innerHTML = `
    <a class="contd rv" href="#/t/${t.id}">
      <span class="cic">${t.icon}</span>
      <span class="ctx">
        <span class="clbl">Lanjutkan</span>
        <span class="cnm">${T.esc(t.name)}</span>
        ${r.t ? `<span class="cts">dibuka ${ago(r.t)}</span>` : ''}
      </span>
      <span class="cgo">→</span>
    </a>`;
  observeRv(box);
}
function onSearch(q) {
  homeState.q = q;
  if (q.trim()) sbTrackDeb(q.trim());
  renderDir();
}
let sbTrackT;
function sbTrackDeb(q) {
  clearTimeout(sbTrackT);
  sbTrackT = setTimeout(() => sbTrack(q), 900);
}
function renderDir() {
  const box = document.getElementById('dir');
  if (!box) return;
  const { q, cat } = homeState;
  const ql = q.trim().toLowerCase();
  let html = '';
  const frag = document.createDocumentFragment();
  if (ql) {
    const hits = rankedSearch(q);
    const sec = document.createElement('section');
    sec.className = 'sec';
    sec.innerHTML = `<div class="sechead"><h2>Hasil pencarian</h2><span class="n">${hits.length}</span></div>`;
    const grid = document.createElement('div');
    grid.className = 'tgrid';
    if (!hits.length) {
      sec.innerHTML += `<div class="empty"><b>Tidak ketemu.</b><p>Coba kata lain, atau jelajahi kategori di atas.</p></div>`;
    } else {
      hits.forEach((m, i) => grid.appendChild(cardEl(m, i, true)));
      sec.appendChild(grid);
    }
    frag.appendChild(sec);
  } else {
    const cats = cat === 'semua' ? CATS.filter(c => c[0] !== 'semua') : CATS.filter(c => c[0] === cat);
    cats.forEach(([id, label]) => {
      const tools = manifest.filter(m => m.cat === id);
      if (!tools.length) return;
      const sec = document.createElement('section');
      sec.className = 'sec';
      sec.id = 'sec-' + id;
      sec.innerHTML = `<div class="sechead"><h2>${label}</h2><span class="n">${tools.length}</span></div>`;
      const grid = document.createElement('div');
      grid.className = 'tgrid';
      tools.forEach((m, i) => grid.appendChild(cardEl(m, i, false)));
      sec.appendChild(grid);
      frag.appendChild(sec);
    });
  }
  box.innerHTML = '';
  box.appendChild(frag);
  observeRv(box);
}

/* ============ halaman favorit ============ */
function favPage() {
  document.body.dataset.route = 'favorit';
  setTabActive('fav');
  const app = document.getElementById('app');
  app.innerHTML = `
  <div class="wrap view">
    <header class="top">
      <a class="brand" href="#/"><span class="mark">A</span><span class="wm">ADIP <em>Tools</em></span></a>
      <div class="top-right">
        <button class="icobtn" id="palBtn" aria-label="Cari cepat (Ctrl+K)">⌕</button>
      </div>
    </header>
    <section class="hero">
      <h1>Tool <span class="qm">favoritmu</span></h1>
      <p class="sub">Tersimpan di perangkat ini. Tap ★ di tool mana pun untuk menambah.</p>
    </section>
    <div id="favList" class="sec"></div>
    <footer class="foot">
      <div class="fmark">A</div><br>
      <b>ADIP Tools</b> · ${manifest.length} tools · jalan 100% lokal di browser
    </footer>
  </div>`;
  document.getElementById('palBtn').onclick = openPalette;
  renderFavList();
  observeRv(app);
}
function renderFavList() {
  const box = document.getElementById('favList');
  if (!box) return;
  const favs = getFav().map(byId).filter(Boolean);
  box.innerHTML = '';
  if (!favs.length) {
    box.innerHTML = `<div class="empty"><b>Belum ada favorit.</b><p>Jelajahi tools di beranda, lalu tap ★ pada yang sering kamu pakai.</p>
      <div class="sugx"><button class="schip" onclick="location.hash='#/'">Lihat semua tools</button></div></div>`;
    return;
  }
  const grid = document.createElement('div');
  grid.className = 'tgrid';
  favs.forEach((m, i) => grid.appendChild(cardEl(m, i, true)));
  box.appendChild(grid);
  observeRv(box);
}

/* ============ halaman tool ============ */
const toolMods = {};
async function loadToolRender(t) {
  if (t.render) return t.render;
  if (!toolMods[t.id]) {
    toolMods[t.id] = import('./' + t.file + '?v=' + VERSION).then(mod => {
      t.render = mod.render;
      return mod.render;
    });
  }
  return toolMods[t.id];
}
async function toolPage(id) {
  document.body.dataset.route = 'tool';
  setTabActive(null);
  const t = byId(id);
  const app = document.getElementById('app');
  if (!t) {
    app.innerHTML = `<div class="wrap view"><div class="empty" style="margin-top:60px"><b>Tool tidak ditemukan.</b><p>Mungkin sudah dipindah atau dihapus.</p><div class="sugx"><button class="schip" onclick="location.hash='#/'">Kembali ke beranda</button></div></div></div>`;
    return;
  }
  document.title = `${t.name} - ADIP Tools`;
  app.innerHTML = `
  <div class="wrap narrow view">
    <a class="back" href="#/">← Semua tools</a>
    <div class="tool-head">
      <span class="tic">${t.icon}</span>
      <div class="th">
        <h2>${T.esc(t.name)}</h2>
        <div class="meta">
          <span class="tag">${catLabel(t.cat)}</span>
          <span class="ds">${T.esc(t.desc)}</span>
        </div>
      </div>
      <div class="tacts">
        <button class="icobtn fav" data-fav="${t.id}" aria-label="Tambah ke favorit">★</button>
        <button class="icobtn" id="shareBtn" aria-label="Bagikan">↗</button>
      </div>
    </div>
    <div class="tool" id="toolbox"><div class="skel"><i class="short"></i><i></i><i class="tall"></i></div></div>
    <section class="related" id="related"></section>
    <footer class="foot">
      Data diproses lokal di browser kamu.<br><b>ADIP Tools</b> · gratis selamanya
    </footer>
  </div>`;
  bindFav(app.querySelector('.fav'), t.id);
  app.querySelector('#shareBtn').onclick = async () => {
    const url = location.origin + location.pathname + '#/t/' + t.id;
    try {
      if (navigator.share) { await navigator.share({ title: t.name, url }); }
      else { await navigator.clipboard.writeText(url); toast('Tautan disalin'); }
    } catch (e) { /* dibatalkan */ }
  };
  pushRecent(id);
  try {
    const render = await loadToolRender(t);
    const box = document.getElementById('toolbox');
    box.innerHTML = '';
    render(box);
  } catch (e) {
    document.getElementById('toolbox').innerHTML = `<div class="note err">Gagal memuat tool. Coba muat ulang halaman.</div>`;
  }
  /* lihat juga: tools se-kategori, acak */
  const rel = manifest.filter(m => m.cat === t.cat && m.id !== t.id)
    .sort(() => Math.random() - 0.5).slice(0, 6);
  if (rel.length) {
    const rsec = document.getElementById('related');
    rsec.innerHTML = `<div class="sechead"><h2>Lihat juga</h2></div>`;
    const grid = document.createElement('div');
    grid.className = 'tgrid';
    rel.forEach((m, i) => grid.appendChild(cardEl(m, i, false)));
    rsec.appendChild(grid);
  }
  observeRv(app);
  window.scrollTo({ top: 0 });
}

/* ============ router ============ */
let leaveCbs = [];
function runLeaveCbs() {
  leaveCbs.forEach(cb => { try { cb(); } catch (e) {} });
  leaveCbs = [];
}
T.onLeave = cb => leaveCbs.push(cb);
function route() {
  runLeaveCbs();
  closePalette();
  const hash = location.hash || '#/';
  if (hash.startsWith('#/t/')) {
    toolPage(decodeURIComponent(hash.slice(4)));
  } else if (hash === '#/favorit') {
    document.title = 'Favorit - ADIP Tools';
    favPage();
  } else {
    document.title = 'Butuh apa? - ADIP Tools';
    home();
  }
}
window.addEventListener('hashchange', route);

/* ============ keyboard global ============ */
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openPalette(); }
  else if (e.key === '/' && !palEl && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || '')) {
    const q = document.getElementById('q');
    if (q) { e.preventDefault(); q.focus(); }
  }
  else if (e.key === 'Escape' && palEl) closePalette();
});

/* ============ boot ============ */
ensureTabs();
route();
