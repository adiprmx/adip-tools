/* ============================================================
   ADIP Tools v6.0 — app shell + router (liquid glass edition)
   Tetap murni: vanilla JS, tanpa framework, tanpa build step.

   STRUKTUR BARU v6 (anti scroll-fatigue):
   - Beranda PENDEK: hero sapaan + search besar, kartu "Lanjutkan",
     carousel Populer, grid Kategori 4 kolom, carousel Riwayat,
     tombol "Semua tools", footer 1 baris.
   - Direktori vertikal pindah ke view #/semua (dengan filter)
     dan #/k/<kategori> (view per kategori).
   - Hero search mengetik -> lompat ke #/semua?q=...

   YANG TIDAK BERUBAH dari v5.2:
   - Smart search (typo-tolerant + keyword + prioritas judul, v4.5.1)
   - Favorit + riwayat localStorage (format [{id,t}], auto-migrasi)
   - Command palette (Ctrl+K), shortcut "/" fokus search
   - Tracking pencarian populer via Supabase (best-effort)
   - Kontrak: tool = 1 file; tool dilarang import tool lain;
     fungsi bersama -> core.js; manifest.js generated (jangan edit manual).
   ============================================================ */
import { manifest, VERSION } from './manifest.js?v=6.9.13';
import * as T from './core.js?v=6.9.5';

const SB_URL = 'https://jebafddwupyqpwevhsqn.supabase.co';
const SB_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJic3VwYWJhc2UiLCJyZWYiOiJqZWJhZmRkd3VweXFwd2V2aHNxbiIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzc1NzQ1MDQzLCJleHAiOjIwOTI5NjEwNDN9.HY9zA3H3cC6cT9aN5b_8R3fJ5m7Y4pQ2wE9rT1uI4oP6sD8fG';
const SEARCH_DENY = ['muse-test'];

const CATS = [
  ['semua','Semua'],['keamanan','Keamanan'],['converter','Converter'],['developer','Dev & Web'],
  ['desain','Desain'],['indonesia','Indonesia'],['musik','Musik'],['gambar','Gambar'],
  ['teks','Teks'],['bisnis','Bisnis'],['sehari','Sehari-hari'],['fun','Fun'],
  ['produktivitas','Produktivitas'],['pelajar','Pelajar'],['liveapi','Live API'],
  ['fakesos','Fake Sosmed'],
];
const CAT_ICON = {
  keamanan: '🔐', converter: '🔁', developer: '🧑‍💻', desain: '🎨', indonesia: '🇮🇩',
  musik: '🎧', gambar: '🖼️', teks: '🔤', bisnis: '💼', sehari: '🏠',
  fun: '🎲', produktivitas: '⚡', pelajar: '📚', liveapi: '🌐', semua: '🧰',
  fakesos: '🎭',
};
const catLabel = (id) => (CATS.find((c) => c[0] === id) || ['?','Lainnya'])[1];
const byId = (id) => manifest.find((m) => m.id === id);
const visibleTools = () => manifest.filter((m) => !SEARCH_DENY.includes(m.id));

/* ---------------- sapaan waktu ---------------- */
function greet() {
  const h = new Date().getHours();
  if (h >= 4 && h < 11) return 'Selamat pagi';
  if (h >= 11 && h < 15) return 'Selamat siang';
  if (h >= 15 && h < 19) return 'Selamat sore';
  return 'Selamat malam';
}
const timeAgo = (ts) => {
  const s = (Date.now() - ts) / 1000;
  if (s < 60) return 'baru saja';
  if (s < 3600) return Math.floor(s / 60) + ' mnt lalu';
  if (s < 86400) return Math.floor(s / 3600) + ' jam lalu';
  return Math.floor(s / 86400) + ' hari lalu';
};

/* ---------------- supabase: tracking + populer ---------------- */
function sbHeaders() {
  return { 'apikey': SB_ANON, 'Authorization': 'Bearer ' + SB_ANON, 'Content-Type': 'application/json' };
}
const SB_POPULAR = [];
async function sbFetchPopular() {
  try {
    const r = await fetch(SB_URL + '/rest/v1/rpc/popular_tools', { method: 'POST', headers: sbHeaders(), body: '{}' });
    if (!r.ok) return;
    const data = await r.json();
    if (Array.isArray(data)) SB_POPULAR.push(...data.map((x) => String(x.term || x).trim()).filter(Boolean));
  } catch (e) { /* silent */ }
  renderPopuler();
}
async function sbTrack(q) {
  try {
    await fetch(SB_URL + '/rest/v1/search_logs', {
      method: 'POST', headers: sbHeaders(),
      body: JSON.stringify({ term: q.toLowerCase().slice(0, 80) }),
    });
  } catch (e) { /* silent */ }
}
let sbT;
function sbTrackDeb(q) { clearTimeout(sbT); sbT = setTimeout(() => sbTrack(q), 1200); }

/* ---------------- favorit + riwayat ---------------- */
const FKEY = 'adip_fav', RKEY = 'adip_recent';
const loadJson = (k, fb) => { try { const v = JSON.parse(localStorage.getItem(k)); return Array.isArray(v) ? v : fb; } catch { return fb; } };
const saveJson = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
// migrasi otomatis format lama [id] -> [{id,t}]
const getFav = () => loadJson(FKEY, []).map((x) => (typeof x === 'string' ? { id: x, t: 0 } : x));
const isFav = (id) => getFav().some((x) => x.id === id);
function toggleFav(id) {
  let f = getFav();
  if (f.some((x) => x.id === id)) f = f.filter((x) => x.id !== id);
  else { f.unshift({ id, t: Date.now() }); if (f.length > 50) f.length = 50; }
  saveJson(FKEY, f);
}
const getRecent = () => loadJson(RKEY, []).map((x) => (typeof x === 'string' ? { id: x, t: 0 } : x));
function touchRecent(id) {
  let r = getRecent().filter((x) => x.id !== id);
  r.unshift({ id, t: Date.now() }); if (r.length > 20) r.length = 20;
  saveJson(RKEY, r);
}
let toastT;
function toast(msg) {
  const app = document.getElementById('app');
  let el = app.querySelector('.toast');
  if (!el) { el = document.createElement('div'); el.className = 'toast'; el.setAttribute('role', 'status'); app.appendChild(el); }
  el.textContent = msg; el.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('show'), 2200);
}
function bindFav(root) {
  root.querySelectorAll('.fav').forEach((b) => {
    b.addEventListener('click', (e) => {
      e.preventDefault(); e.stopPropagation();
      const id = b.dataset.id;
      toggleFav(id);
      const on = isFav(id);
      b.classList.toggle('on', on);
      b.setAttribute('aria-label', on ? 'Hapus dari favorit' : 'Tambah ke favorit');
      b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop');
      toast(on ? 'Masuk favorit' : 'Dihapus dari favorit');
      if (document.body.dataset.route === 'fav') favPage();
    });
  });
}

/* ---------------- smart search (port v4.5.1, tidak diubah) ---------------- */
function lev(a, b) {
  if (a === b) return 0;
  const m = a.length, n = b.length;
  if (!m) return n; if (!n) return m;
  if (Math.abs(m - n) > 2) return 3;
  const d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 1; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[m][n];
}
function fuzzyScore(q, t) {
  if (!q || !t) return 0;
  if (t === q) return 100;
  if (t.startsWith(q)) return 90;
  if (t.includes(q)) return 70;
  const dist = lev(q, t);
  if (q.length >= 4 && dist <= 1) return 55;
  if (q.length >= 5 && dist <= 2) return 40;
  let qi = 0, score = 0, last = -1;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) { score += last + 1 === ti ? 6 : 4; last = ti; qi++; }
  }
  return qi === q.length ? Math.min(30, score / q.length) : 0;
}
function wordScore(q, text) {
  const words = String(text).toLowerCase().split(/\s+/);
  let best = 0;
  for (const w of words) best = Math.max(best, fuzzyScore(q, w));
  return best;
}
function searchScore(q, m) {
  const name = m.name.toLowerCase();
  const desc = (m.desc || '').toLowerCase();
  const kws = String(m.keywords || '').split(',').map((k) => k.trim().toLowerCase()).filter(Boolean);
  const nameHit = Math.max(fuzzyScore(q, name), wordScore(q, name));
  const descHit = Math.max(fuzzyScore(q, desc), wordScore(q, desc)) * 0.6;
  const kwHit = kws.reduce((a, k) => Math.max(a, Math.max(fuzzyScore(q, k), wordScore(q, k))), 0) * 0.8;
  return Math.max(nameHit, descHit, kwHit);
}
const FAV_BOOST = 8, REC_BOOST = 6, TITLE_BONUS = 12;
function smartBoost(m, q) {
  let b = 0;
  const fav = getFav().findIndex((x) => x.id === m.id);
  if (fav >= 0) b += FAV_BOOST - Math.min(fav, 5);
  const rec = getRecent().findIndex((x) => x.id === m.id);
  if (rec >= 0) b += REC_BOOST - Math.min(rec, 5);
  if (m.name.toLowerCase().includes(q)) b += TITLE_BONUS;
  return b;
}
function searchCtx() { return { favIds: new Set(getFav().map((x) => x.id)), recIds: new Set(getRecent().map((x) => x.id)) }; }
function rankedSearch(q) {
  const ql = q.trim().toLowerCase();
  if (!ql) return visibleTools();
  const terms = ql.split(/\s+/);
  const ctx = searchCtx();
  return visibleTools()
    .map((m) => ({ m, s: Math.max(...terms.map((t) => searchScore(t, m))) }))
    .filter((x) => x.s > 15)
    .map((x) => ({
      m: x.m,
      s: x.s + (ctx.favIds.has(x.m.id) ? FAV_BOOST : 0) + (ctx.recIds.has(x.m.id) ? REC_BOOST : 0)
        + (x.m.name.toLowerCase().includes(ql) ? TITLE_BONUS : 0),
    }))
    .sort((a, b) => b.s - a.s)
    .slice(0, 24)
    .map((x) => x.m);
}

/* ---------------- command palette ---------------- */
let palEl = null, palItems = [], palSel = 0;
function closePalette() {
  if (!palEl) return;
  palEl.remove(); palEl = null; palItems = [];
  document.body.style.overflow = '';
}
function hiMark(text, q) {
  const safe = T.esc(text);
  const ql = q.trim().toLowerCase();
  if (!ql) return safe;
  const idx = text.toLowerCase().indexOf(ql);
  if (idx < 0) return safe;
  return safe.slice(0, idx) + '<mark>' + safe.slice(idx, idx + ql.length) + '</mark>' + safe.slice(idx + ql.length);
}
function openPalette() {
  if (palEl) { closePalette(); return; }
  palEl = document.createElement('div');
  palEl.className = 'pal-wrap';
  palEl.innerHTML = `
    <div class="pal-backdrop"></div>
    <div class="pal" role="dialog" aria-modal="true" aria-label="Cari cepat">
      <div class="pal-bar">
        <span class="glyph">⌕</span>
        <input id="palQ" type="search" placeholder="Cari tools..." autocomplete="off" aria-label="Cari tools">
        <kbd>esc</kbd>
      </div>
      <div class="pal-list" id="palList" role="listbox"></div>
      <div class="pal-hint"><span><kbd>↑↓</kbd>pindah</span><span><kbd>↵</kbd>buka</span><span><kbd>esc</kbd>tutup</span></div>
    </div>`;
  document.body.appendChild(palEl);
  document.body.style.overflow = 'hidden';
  const inp = palEl.querySelector('#palQ');
  const list = palEl.querySelector('#palList');
  palEl.querySelector('.pal-backdrop').addEventListener('click', closePalette);
  function paint(q) {
    const res = rankedSearch(q);
    const recents = !q.trim() ? getRecent().slice(0, 4).map((x) => byId(x.id)).filter(Boolean) : [];
    const showRecent = recents.length && !q.trim();
    const showFav = !q.trim() && !showRecent && getFav().length;
    const favs = showFav ? getFav().slice(0, 4).map((x) => byId(x.id)).filter(Boolean) : [];
    palItems = [];
    let html = '';
    if (showRecent) {
      html += '<div class="pal-sec">Baru dibuka</div>';
      palItems.push(...recents);
    } else if (showFav) {
      html += '<div class="pal-sec">Favorit</div>';
      palItems.push(...favs);
    }
    palItems.push(...res.slice(0, 10));
    if (!palItems.length) {
      list.innerHTML = '<div class="pal-empty">Tidak ketemu.<br>Coba kata lain, mis. "kalkulator".</div>';
      return;
    }
    palSel = 0;
    html += palItems.map((m, i) => `
      <button class="pal-item${i === 0 ? ' act' : ''}" data-i="${i}" role="option">
        <span class="pic">${m.icon}</span>
        <span class="ptx"><span class="pnm">${hiMark(m.name, q)}</span>
        <span class="pds">${T.esc(m.desc || '')}</span></span>
        <span class="pct">${catLabel(m.cat)}</span>
      </button>`).join('');
    list.innerHTML = html;
    list.querySelectorAll('.pal-item').forEach((b) => {
      b.addEventListener('click', () => { touchRecent(palItems[+b.dataset.i].id); location.hash = '#/t/' + palItems[+b.dataset.i].id; closePalette(); });
    });
    scrollPal();
  }
  function scrollPal() {
    list.querySelectorAll('.pal-item').forEach((b, i) => b.classList.toggle('act', i === palSel));
    const act = list.querySelector('.pal-item.act');
    if (act) act.scrollIntoView({ block: 'nearest' });
  }
  inp.addEventListener('input', () => paint(inp.value));
  inp.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); palSel = Math.min(palSel + 1, palItems.length - 1); scrollPal(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); palSel = Math.max(palSel - 1, 0); scrollPal(); }
    else if (e.key === 'Enter' && palItems[palSel]) {
      e.preventDefault();
      const m = palItems[palSel];
      touchRecent(m.id);
      location.hash = '#/t/' + m.id;
      closePalette();
    }
  });
  paint('');
  setTimeout(() => inp.focus(), 30);
}

/* ---------------- bottom tab bar + indikator geser ---------------- */
function ensureTabs() {
  let nav = document.querySelector('.tabs');
  if (nav) return nav;
  nav = document.createElement('nav');
  nav.className = 'tabs';
  nav.setAttribute('aria-label', 'Navigasi utama');
  nav.innerHTML = `
    <span class="tab-ind" aria-hidden="true" style="opacity:0"></span>
    <a class="tab" data-tab="home" href="#/"><span class="ti">🏠</span><span>Beranda</span></a>
    <button class="tab" data-tab="search" id="tabSearch" aria-label="Cari cepat"><span class="ti">⌕</span><span>Cari</span></button>
    <a class="tab" data-tab="fav" href="#/favorit"><span class="ti">♥</span><span>Favorit</span></a>`;
  document.body.appendChild(nav);
  nav.querySelector('#tabSearch').addEventListener('click', openPalette);
  return nav;
}
function setTabActive(name) {
  const nav = ensureTabs();
  const ind = nav.querySelector('.tab-ind');
  nav.querySelectorAll('.tab').forEach((t) => t.classList.toggle('on', t.dataset.tab === name));
  const i = ['home', 'search', 'fav'].indexOf(name);
  if (i < 0) { ind.style.opacity = '0'; }
  else { ind.style.opacity = '1'; ind.style.transform = `translateX(${i * 100}%)`; }
}

/* ---------------- kartu ---------------- */
function cardEl(m, hl) {
  const a = document.createElement('a');
  a.className = 'tcard glass';
  a.href = '#/t/' + m.id;
  a.setAttribute('aria-label', m.name);
  const fav = isFav(m.id);
  a.innerHTML = `
    <span class="tic" aria-hidden="true">${m.icon}</span>
    <span class="nm">${hl ? hiMark(m.name, hl) : T.esc(m.name)}</span>
    <span class="ds">${T.esc(m.desc || '')}</span>
    <span class="ct">${catLabel(m.cat)}</span>
    <button class="fav${fav ? ' on' : ''}" data-id="${m.id}" aria-label="${fav ? 'Hapus dari favorit' : 'Tambah ke favorit'}">♥</button>`;
  a.addEventListener('click', () => touchRecent(m.id));
  bindFav(a);
  return a;
}
const hcardHTML = (m) => `
  <a class="hcard glass" href="#/t/${m.id}" aria-label="${T.esc(m.name)}">
    <span class="hic" aria-hidden="true">${m.icon}</span>
    <span class="hnm">${T.esc(m.name)}</span>
    <span class="hct">${catLabel(m.cat)}</span>
  </a>`;

/* fade tepi carousel saat konten terpotong */
function watchFadeX(rail) {
  const upd = () => {
    rail.classList.toggle('fx-r', rail.scrollWidth - rail.scrollLeft - rail.clientWidth > 4);
    rail.classList.toggle('fx-l', rail.scrollLeft > 4);
  };
  rail.addEventListener('scroll', upd, { passive: true });
  upd();
}

/* placeholder hero: contoh nyata, rotasi 3 dtk */
const PH_EXAMPLES = [
  'Coba "gaji"...', 'Coba "weton"...', 'Coba "gaji pokok"...', 'Coba "kompres foto"...',
  'Coba "qr"...', 'Coba "password"...', 'Coba "camelot"...', 'Coba "THR"...',
];
function rotatePh(input) {
  let i = 0;
  return setInterval(() => { if (document.body.contains(input)) { i = (i + 1) % PH_EXAMPLES.length; input.placeholder = PH_EXAMPLES[i]; } }, 3000);
}

/* ---------------- BERANDA (v6: pendek, tanpa direktori vertikal) ---------------- */
function home() {
  document.body.dataset.route = 'home';
  setTabActive('home');
  document.title = 'Butuh apa? - ADIP Tools';
  const n = manifest.length;
  const app = document.getElementById('app');
  const tiles = CATS.filter((c) => c[0] !== 'semua')
    .map(([id, label]) => {
      const cnt = manifest.filter((m) => m.cat === id).length;
      return `<a class="cattile glass" href="#/k/${id}">
        <span class="ci" aria-hidden="true">${CAT_ICON[id] || '🧰'}</span>
        <span class="cl">${label}</span>
        <span class="cn">${cnt}</span>
      </a>`;
    }).join('');
  app.innerHTML = `
  <div class="wrap view">
    <header class="top">
      <a class="brand" href="#/"><span class="mark" aria-hidden="true">a</span><span class="wm">ADIP <em>Tools</em></span></a>
      <div class="top-right">
        <span class="topcount"><span class="livedot" aria-hidden="true"></span><b data-countup="${n}">0</b> tools</span>
        <button class="icobtn" id="palBtn" aria-label="Cari cepat (Ctrl+K)">⌕</button>
      </div>
    </header>
    <section class="hero rise" style="--i:0">
      <p class="hi">${greet()}, butuh bantuan apa?</p>
      <h1><span class="w" style="--i:0"><span class="mask"><span class="mi">Butuh</span></span></span> <span class="w" style="--i:1"><span class="mask"><span class="mi"><span class="qm">apa?</span></span></span></span></h1>
      <div class="hsearch glass">
        <span class="glyph" aria-hidden="true">⌕</span>
        <input id="q" type="search" placeholder="${PH_EXAMPLES[0]}" autocomplete="off" aria-label="Cari tools">
      </div>
    </section>
    <div id="contd"></div>
    <section class="sec rise" style="--i:2" aria-label="Populer">
      <div class="sechead"><h2>🔥 Populer</h2></div>
      <div class="hscroll" id="popRail"></div>
    </section>
    <section class="sec rise" style="--i:3" aria-label="Kategori">
      <div class="sechead"><h2>Kategori</h2><span class="n">14</span></div>
      <div class="catgrid">${tiles}</div>
    </section>
    <section class="sec rise" style="--i:4" id="recSec" aria-label="Riwayat">
      <div class="sechead"><h2>🕐 Riwayat</h2></div>
      <div class="hscroll" id="recRail"></div>
    </section>
    <a class="allbtn glass rise" style="--i:5" href="#/semua">
      <span>Semua tools <span class="an">${n}</span></span>
      <span class="ago" aria-hidden="true">→</span>
    </a>
    <footer class="foot rise" style="--i:6"><b>ADIP Tools</b> · ${n} tools, gratis selamanya</footer>
  </div>`;
  app.querySelector('#palBtn').addEventListener('click', openPalette);
  const inp = app.querySelector('#q');
  rotatePh(inp);
  let goT;
  inp.addEventListener('input', () => {
    clearTimeout(goT);
    const v = inp.value.trim();
    if (v.length >= 2) goT = setTimeout(() => { location.hash = '#/semua?q=' + encodeURIComponent(v); }, 700);
  });
  inp.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const v = inp.value.trim();
      if (v) sbTrack(v);
      location.hash = '#/semua' + (v ? '?q=' + encodeURIComponent(v) : '');
    }
  });
  renderContinue();
  renderPopuler();
  renderRecent();
  // count-up angka tools
  const cb = app.querySelector('[data-countup]');
  if (cb) {
    const target = parseInt(cb.dataset.countup, 10) || 0;
    const t0 = performance.now(), dur = 900;
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / dur);
      cb.textContent = Math.round(target * (1 - Math.pow(1 - p, 4)));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
}

/* kartu "Lanjutkan": alat terakhir dibuka */
function renderContinue() {
  const host = document.getElementById('contd');
  if (!host) return;
  const r = getRecent()[0];
  const m = r && byId(r.id);
  if (!m) { host.innerHTML = ''; return; }
  host.innerHTML = `
    <a class="contd glass rise" style="--i:1" href="#/t/${m.id}">
      <span class="cic" aria-hidden="true">${m.icon}</span>
      <span class="ctx">
        <span class="clbl">Lanjutkan</span>
        <span class="cnm">${T.esc(m.name)}</span>
        <span class="cts">dibuka ${timeAgo(r.t)}</span>
      </span>
      <span class="cgo" aria-hidden="true">→</span>
    </a>`;
}

/* Populer: istilah Supabase -> tool teratas tiap istilah */
function renderPopuler() {
  const rail = document.getElementById('popRail');
  if (!rail) return;
  const terms = SB_POPULAR.length ? SB_POPULAR : ['kalkulator thr', 'weton jawa', 'kompres gambar', 'password aman', 'camelot wheel', 'qr code'];
  const seen = new Set(), tools = [];
  for (const t of terms) {
    const hit = rankedSearch(t)[0];
    if (hit && !seen.has(hit.id) && !SEARCH_DENY.includes(hit.id)) { seen.add(hit.id); tools.push(hit); }
    if (tools.length >= 8) break;
  }
  rail.innerHTML = tools.map(hcardHTML).join('');
  watchFadeX(rail);
}

/* Riwayat: carousel tool terakhir dibuka */
function renderRecent() {
  const rail = document.getElementById('recRail');
  const sec = document.getElementById('recSec');
  if (!rail || !sec) return;
  const recs = getRecent().map((x) => byId(x.id)).filter(Boolean).slice(0, 10);
  if (!recs.length) { sec.style.display = 'none'; return; }
  sec.style.display = '';
  rail.innerHTML = recs.map(hcardHTML).join('');
  watchFadeX(rail);
}

/* ---------------- VIEW: semua tools + filter (#/semua) ---------------- */
function allPage(q) {
  document.body.dataset.route = 'semua';
  setTabActive(null);
  document.title = 'Semua tools - ADIP Tools';
  const n = manifest.length;
  const app = document.getElementById('app');
  app.innerHTML = `
  <div class="wrap view">
    <a class="back" href="#/">← Beranda</a>
    <h2 class="pagetitle rise" style="--i:0">Semua tools</h2>
    <div class="hsearch glass rise" style="--i:1">
      <span class="glyph" aria-hidden="true">⌕</span>
      <input id="aq" type="search" placeholder="Cari ${n} tools..." value="${T.esc(q)}" autocomplete="off" aria-label="Cari semua tools">
    </div>
    <div class="sechead" style="margin-top:18px"><h2 id="allCount"></h2></div>
    <div class="tgrid" id="allGrid"></div>
    <footer class="foot"><b>ADIP Tools</b> · ${n} tools, gratis selamanya</footer>
  </div>`;
  const inp = app.querySelector('#aq');
  const grid = app.querySelector('#allGrid');
  const count = app.querySelector('#allCount');
  const paint = (qq) => {
    const ql = qq.trim();
    const list = ql ? rankedSearch(ql) : manifest;
    count.textContent = ql ? `${list.length} hasil` : `${list.length} tools`;
    grid.innerHTML = '';
    if (!list.length) {
      grid.innerHTML = `<div class="empty" style="grid-column:1/-1">
        <b>Tidak ketemu.</b><p>Coba kata lain, mis. "kalkulator".</p>
        <div class="sugx">${['kalkulator', 'qr', 'weton'].map((s) => `<button class="schip">${s}</button>`).join('')}</div>
      </div>`;
      grid.querySelectorAll('.schip').forEach((b) => b.addEventListener('click', () => { inp.value = b.textContent; paint(inp.value); }));
      return;
    }
    list.forEach((m) => grid.appendChild(cardEl(m, ql || null)));
  };
  let t;
  inp.addEventListener('input', () => {
    clearTimeout(t);
    t = setTimeout(() => { if (inp.value.trim()) sbTrackDeb(inp.value.trim()); paint(inp.value); }, 180);
  });
  inp.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && inp.value.trim()) sbTrack(inp.value.trim());
  });
  paint(q);
}

/* ---------------- VIEW: kategori penuh (#/k/<id>) ---------------- */
function catPage(id) {
  const cat = CATS.find((c) => c[0] === id && id !== 'semua');
  const app = document.getElementById('app');
  if (!cat) { location.hash = '#/'; return; }
  document.body.dataset.route = 'kategori';
  setTabActive(null);
  document.title = cat[1] + ' - ADIP Tools';
  const n = manifest.length;
  const tools = manifest.filter((m) => m.cat === id);
  app.innerHTML = `
  <div class="wrap view">
    <a class="back" href="#/">← Beranda</a>
    <div class="cat-head rise" style="--i:0">
      <span class="ctic" aria-hidden="true">${CAT_ICON[id] || '🧰'}</span>
      <div><h2>${cat[1]}</h2><p class="csub">${tools.length} tools</p></div>
    </div>
    <div class="tgrid" id="catGrid"></div>
    <footer class="foot"><b>ADIP Tools</b> · ${n} tools, gratis selamanya</footer>
  </div>`;
  const grid = app.querySelector('#catGrid');
  tools.forEach((m) => grid.appendChild(cardEl(m, null)));
}

/* ---------------- FAVORIT ---------------- */
function favPage() {
  document.body.dataset.route = 'fav';
  setTabActive('fav');
  document.title = 'Favorit - ADIP Tools';
  const n = manifest.length;
  const app = document.getElementById('app');
  const favs = getFav().map((x) => byId(x.id)).filter(Boolean);
  app.innerHTML = `
  <div class="wrap view">
    <div class="cat-head rise" style="--i:0">
      <span class="ctic" aria-hidden="true">♥</span>
      <div><h2>Favorit</h2><p class="csub">${favs.length} tersimpan di perangkat ini</p></div>
    </div>
    <div class="tgrid" id="favGrid"></div>
    ${favs.length ? '' : `<div class="empty"><b>Belum ada favorit.</b><p>Ketuk ♥ di kartu tools buat nyimpen.</p></div>`}
    <footer class="foot"><b>ADIP Tools</b> · ${n} tools, gratis selamanya</footer>
  </div>`;
  const grid = app.querySelector('#favGrid');
  favs.forEach((m) => grid.appendChild(cardEl(m, null)));
}

/* ---------------- HALAMAN TOOL ---------------- */
let toolCb = [];
function onToolLeave(cb) { toolCb.push(cb); }
function runLeaveCbs() { toolCb.forEach((cb) => { try { cb(); } catch {} }); toolCb = []; }
async function toolPage(id) {
  const m = byId(id);
  const app = document.getElementById('app');
  document.body.dataset.route = 'tool';
  if (!m) {
    setTabActive(null);
    document.title = 'Tidak ditemukan - ADIP Tools';
    app.innerHTML = `<div class="wrap view"><div class="empty"><b>Tools tidak ditemukan.</b>
      <p>Mungkin alamatnya berubah.</p></div><a class="back" href="#/">← Beranda</a></div>`;
    return;
  }
  setTabActive(null);
  document.title = m.name + ' - ADIP Tools';
  window.scrollTo(0, 0);
  app.innerHTML = `
  <div class="wrap narrow view">
    <a class="back" href="#/">← Beranda</a>
    <div class="tool-head">
      <span class="tic" aria-hidden="true">${m.icon}</span>
      <div class="th">
        <h2>${T.esc(m.name)}</h2>
        <div class="meta">
          <span class="tag">${catLabel(m.cat)}</span>
          <span class="ds">${T.esc(m.desc || '')}</span>
        </div>
      </div>
      <div class="tacts"><button class="fav icobtn${isFav(m.id) ? ' on' : ''}" data-id="${m.id}" aria-label="${isFav(m.id) ? 'Hapus dari favorit' : 'Tambah ke favorit'}">♥</button></div>
    </div>
    <div class="tool glass" id="toolbox"><div class="skel"><i class="short"></i><i></i><i class="tall"></i></div></div>
    <div class="related">
      <div class="sechead"><h2>Sejenis</h2></div>
      <div class="tgrid" id="relGrid"></div>
    </div>
    <footer class="foot"><b>ADIP Tools</b> · ${manifest.length} tools, gratis selamanya</footer>
  </div>`;
  touchRecent(m.id);
  try {
    const mod = await import('./' + m.file + '?v=' + VERSION);
    if (document.body.dataset.route !== 'tool') return;
    const box = document.getElementById('toolbox');
    box.querySelector('.skel')?.remove();
    mod.render(box, onToolLeave, T, m);
    bindFav(app);
  } catch (e) {
    const box = document.getElementById('toolbox');
    if (box) box.innerHTML = `<div class="empty"><b>Gagal memuat.</b><p>Coba muat ulang halaman.</p></div>`;
  }
  const grid = document.getElementById('relGrid');
  if (grid) {
    manifest
      .filter((x) => x.cat === m.cat && x.id !== m.id)
      .slice(0, 4)
      .forEach((x) => grid.appendChild(cardEl(x, null)));
  }
}

/* ---------------- ROUTER ---------------- */
function route() {
  runLeaveCbs(); closePalette();
  const run = () => {
    const hash = location.hash || '#/';
    if (hash.startsWith('#/t/')) toolPage(decodeURIComponent(hash.slice(4).split('?')[0]));
    else if (hash.startsWith('#/k/')) catPage(decodeURIComponent(hash.slice(4).split('?')[0]));
    else if (hash.startsWith('#/semua')) {
      const mm = hash.match(/[?&]q=([^&]*)/);
      allPage(mm ? decodeURIComponent(mm[1]) : '');
    }
    else if (hash === '#/favorit') favPage();
    else home();
  };
  // transisi halaman ala aplikasi native (fallback: render biasa)
  if (document.startViewTransition) document.startViewTransition(run);
  else run();
}

/* ---------------- boot ---------------- */
ensureTabs();
sbFetchPopular();
window.addEventListener('hashchange', route);
document.addEventListener('keydown', (e) => {
  const inField = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || '');
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openPalette(); return; }
  if (palEl && e.key === 'Escape') { closePalette(); return; }
  if (e.key === '/' && !palEl && !inField) {
    const q = document.getElementById('q') || document.getElementById('aq');
    if (q) { e.preventDefault(); q.focus(); }
  }
});
route();
