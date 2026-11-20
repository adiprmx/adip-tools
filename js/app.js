/* ============================================================
   ADIP Tools v6.0 — app shell + router (liquid glass edition)
   Tetap murni: vanilla JS, tanpa framework. Build: Vite v6.14.0+
   (bundling + hash nama file menggantikan ?v= manual — lihat
   vite.config.js dan laporan P0-A di ~/workspace/adip-tools-upgrade/).

   PENTING (loader tool): tool dimuat lewat import.meta.glob di bawah.
   Vite mengubah glob ini menjadi dynamic import per tool (satu chunk
   ber-hash per tool di build, file sumber langsung di dev). Kunci glob
   adalah './' + m.file dari manifest — JANGAN ubah format field `file`
   di manifest tanpa menyesuaikan glob ini.

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

   TAMBAHAN v6.12.0 (riset 13 Nov 2026 bag. 3, ide UX #7/#8/#9/#13):
   - Koleksi berdasarkan masalah di beranda (#/c/<id>)
   - Rantai "Lanjut ke" di halaman tool (peta NEXT)
   - Filter "Favorit" di #/semua + tombol ♥ di palette
   - Halaman Metodologi (#/metodologi, anchor per tool)

   STRUKTUR MODUL v6.14.0 (P0-C — refactor shell, NOL perubahan
   perilaku/tampilan; lihat laporan p0-shell.md):
   - app.js ......... orkestrasi: view, palette, tab bar, boot.
   - routes.js ...... tabel route (SATU sumber kebenaran) + matcher.
   - catalog.js ..... data kurasi (CATS, COLLECTIONS, NEXT, METHOD).
   - store.js ....... favorit + riwayat (localStorage).
   - supabase.js .... tracking + istilah Populer (best-effort).
   - shell-ui.js .... helper tampilan bersama (hcard, fade, footer).
   - beranda.js ..... view beranda + helpernya (renderContinue dkk).
   ============================================================ */
import { manifest, VERSION } from './manifest.js';
import * as T from './core.js';
import { CATS, CAT_ICON, catLabel, byId, visibleTools, isNew, COLLECTIONS, collectionById, NEXT, METHOD, METHOD_IDS } from './catalog.js';
import { getFav, isFav, toggleFav, getRecent, touchRecent } from './store.js';
import { fetchPopularTerms, trackSearch, trackSearchDebounced } from './supabase.js';
import { hcardHTML, watchFadeX, footerHTML } from './shell-ui.js';
import { matchRoute, queryParam, resolveToolAlias } from './routes.js';
import { renderBaru, renderSpotlight, renderCatIntro, pickRandomTool, acakButtonHTML, greet, PH_EXAMPLES, startPlaceholderRotation, stopPlaceholderRotation, renderContinue, renderPopuler, renderRecent } from './beranda.js';
import { isNewVisitor, maybeShowOnboarding, heroProofHTML, mulaiDariSiniHTML, HERO_SUB } from './onboarding.js';
import { recentLineHTML, prevToolChip, catMoreLink } from './detail-riwayat.js';
import { initSeoShare, bindShareButtons, shareButtonHTML } from './seo-share.js';
import { rankedSearchPlus, assessQuery, suggestDidYouMean, getRecentSearches, addRecentSearch } from './search-plus.js';
/* P2-B2 (v6.14.0): komponen UI hasil audit — navbar shell,
   breadcrumb, dialog, toolbar #/semua, dsb. (js/components.js).
   Satu-satunya titik sambung: initComponents di boot +
   enhanceRoute di route() + renderToolError di catch toolPage. */
import { initComponents, enhanceRoute, renderToolError } from './components.js';
/* PWA v6.20.0 (P10): registrasi SW + orkestrasi install/update.
   initPWA menunda kerja berat sampai sesudah event load (ZB-6). */
import { initPWA } from './pwa.js';

/* Peta lazy-load semua tool (Vite: import.meta.glob).
   - Dev: tiap nilai adalah () => import('<file sumber>') — dilayani Vite
     langsung dari js/tools/, HMR per file tetap jalan.
   - Build: tiap tool jadi satu chunk ber-hash (assets/<id>-<hash>.js);
     core.js + ffmpeg-loader.js otomatis jadi chunk bersama (shared).
   - Kunci: './tools/<kategori>/<id>.js' = './' + m.file dari manifest.
   - JANGAN ganti dengan import() string dinamis: Vite tidak bisa
     me-resolve path dinamis murni dan tool tidak akan masuk build. */
const toolModules = import.meta.glob('./tools/**/*.js');

/* Data katalog (CATS, COLLECTIONS, NEXT, METHOD + aksesor) tinggal di
   catalog.js; Supabase di supabase.js; favorit/riwayat di store.js. */

/* ---------------- populer: istilah Supabase -> rail beranda ----------------
   Pengambilan istilah tinggal di supabase.js; di sini hanya state-nya
   (istilah terakhir yang berhasil diambil) + pemicu awal. Percabangan
   meniru sbFetchPopular() lama: sukses -> simpan + render ulang rail;
   respons tidak OK -> diam (rail tetap fallback); galat jaringan ->
   render ulang rail (fallback). */
let popularTerms = [];
function sbFetchPopular() {
  fetchPopularTerms()
    .then((terms) => { if (terms) { popularTerms = terms; renderPopuler(popularTerms, manifest); } })
    .catch(() => { renderPopuler(popularTerms, manifest); });
}

/* Favorit + riwayat (getFav/isFav/toggleFav/getRecent/touchRecent)
   tinggal di store.js — format localStorage tidak berubah. */
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
      toast(on ? 'Disimpan ke favorit.' : 'Dihapus dari favorit.'); /* copy FINAL TOAST-FAV-ADD/REMOVE (p1p2-copy.md §5) — "Masuk favorit" pra-P2 dicabut (P2-QA). */
      if (document.body.dataset.route === 'fav') favPage();
      /* P2-B1 (v6.14.0): toggle ♥ di beranda ikut me-render ulang
         seksi Favorit beranda supaya isinya selalu sinkron. */
      if (document.body.dataset.route === 'home') renderFavSection();
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
function searchCtx() { return { favIds: new Set(getFav().map((x) => x.id)), recIds: new Set(getRecent().map((x) => x.id)) }; }
/* rankedSearch + FAV/REC/TITLE_BOOST DIHAPUS v6.14.0 (P0-C): 0 pemanggil
   (palette memakai rankedSearchPlus dari search-plus.js). Helper skor
   (searchScore/fuzzyScore/wordScore) DIPERTAHANKAN untuk kerja pencarian P2. */

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
  /* cari di string yang sudah di-escape (T02 B4): indeks dari teks mentah
     membelah entitas HTML seperti &amp; bila diterapkan ke teks ter-escape. */
  const qEsc = T.esc(q.trim()).toLowerCase();
  const idx = safe.toLowerCase().indexOf(qEsc);
  if (idx < 0) return safe;
  return safe.slice(0, idx) + '<mark>' + safe.slice(idx, idx + qEsc.length) + '</mark>' + safe.slice(idx + qEsc.length);
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
    const res = rankedSearchPlus(q, manifest, searchCtx());
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
      const sug = q.trim() ? suggestDidYouMean(q, manifest) : null;
      list.innerHTML = sug
        ? `<div class="pal-empty">Tidak ketemu.<br>Maksud Anda: <button class="schip" data-sug="${T.esc(sug.id)}">${T.esc(sug.name)}</button>?</div>`
        : '<div class="pal-empty">Tidak ketemu.<br>Coba kata lain, mis. "kalkulator".</div>';
      list.querySelector('[data-sug]')?.addEventListener('click', (e) => { touchRecent(e.target.dataset.sug); location.hash = '#/t/' + e.target.dataset.sug; closePalette(); });
      return;
    }
    palSel = 0;
    html += palItems.map((m, i) => `
      <div class="pal-item${i === 0 ? ' act' : ''}" data-i="${i}" role="option" tabindex="-1">
        <span class="pic">${T.esc(m.icon)}</span>
        <span class="ptx"><span class="pnm">${hiMark(m.name, q)}</span>
        <span class="pds">${T.esc(m.desc || '')}</span></span>
        <span class="pct">${catLabel(m.cat)}</span>
        <button class="pal-fav" data-fid="${T.esc(m.id)}" aria-label="${isFav(m.id) ? 'Hapus dari favorit' : 'Tambah ke favorit'}" style="flex:none;width:44px;height:44px;border:0;background:none;cursor:pointer;font-size:18px;border-radius:8px;color:${isFav(m.id) ? 'var(--acc)' : 'var(--dim)'};opacity:${isFav(m.id) ? '1' : '0.6'}">♥</button>
      </div>`).join('');
    list.innerHTML = html;
    list.querySelectorAll('.pal-item').forEach((b) => {
      b.addEventListener('click', () => { touchRecent(palItems[+b.dataset.i].id); location.hash = '#/t/' + palItems[+b.dataset.i].id; closePalette(); });
    });
    list.querySelectorAll('.pal-fav').forEach((b) => {
      b.addEventListener('click', (e) => {
        e.preventDefault(); e.stopPropagation();
        const id = b.dataset.fid;
        toggleFav(id);
        const on = isFav(id);
        b.style.color = on ? 'var(--acc)' : 'var(--dim)';
        b.style.opacity = on ? '1' : '0.6';
        b.setAttribute('aria-label', on ? 'Hapus dari favorit' : 'Tambah ke favorit');
        toast(on ? 'Disimpan ke favorit.' : 'Dihapus dari favorit.'); /* copy FINAL TOAST-FAV-ADD/REMOVE — selaras dengan bindFav. */
        /* P2-B1 (v6.14.0): palette melayang di atas beranda — seksi
           Favorit di belakangnya ikut diperbarui. */
        if (document.body.dataset.route === 'home') renderFavSection();
      });
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
      if (inp.value.trim()) addRecentSearch(inp.value.trim());
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

/* ---------------- kartu ----------------
   hideCat (v6.14.0, V-05): di halaman kategori + Sejenis, label
   kategori di kartu mubazir (semua kartu satu kategori) — sembunyikan
   labelnya, tapi badge BARU tetap tampil bila ada. */
function cardEl(m, hl, { hideCat = false } = {}) {
  const a = document.createElement('a');
  a.className = 'tcard glass';
  a.href = '#/t/' + m.id;
  a.setAttribute('aria-label', m.name);
  const fav = isFav(m.id);
  const newBadge = isNew(m) ? `<span class="newb" style="color:var(--txt);border:1px solid rgba(255,255,255,.35);background:rgba(255,255,255,.06);border-radius:999px;padding:2px 7px${hideCat ? '' : ';margin-left:6px'}">BARU</span>` : '';
  const ctInner = (hideCat ? '' : catLabel(m.cat)) + newBadge;
  a.innerHTML = `
    <span class="tic" aria-hidden="true">${T.esc(m.icon)}</span>
    <span class="nm">${hl ? hiMark(m.name, hl) : T.esc(m.name)}</span>
    <span class="ds">${T.esc(m.desc || '')}</span>
    ${ctInner ? `<span class="ct">${ctInner}</span>` : ''}
    <button class="fav${fav ? ' on' : ''}" data-id="${T.esc(m.id)}" aria-label="${fav ? 'Hapus dari favorit' : 'Tambah ke favorit'}">♥</button>`;
  a.addEventListener('click', () => touchRecent(m.id));
  bindFav(a);
  return a;
}
/* hcardHTML + watchFadeX + footerHTML tinggal di shell-ui.js. */

/* ---------------- BERANDA (v6: pendek, tanpa direktori vertikal) ----------------
   v6.14.0 (P2-B1): urutan seksi pengunjung kembali — Lanjutkan,
   Favorit (grid, baru), Populer (rail), Baru ditambahkan (grid),
   Spotlight "Tool pilihan" (v6.19.1 P8, 1 kartu), Kategori (ubin),
   Koleksi (kartu lebar), Riwayat (rail).
   Pengunjung baru: Mulai dari sini menggantikan Lanjutkan/Favorit/
   Riwayat (ketiganya kosong). */

/* Seksi "Favorit" di beranda (§5.3.3): grid tcard (bukan rail —
   keluarga layout kedua di beranda, V-07), maks 8 kartu + tautan
   "Lihat semua favorit" bila lebih dari 8. Disembunyikan seluruhnya
   bila belum ada favorit (state kosong hidup di #/favorit, bukan
   di beranda). Dipanggil ulang dari bindFav()/palette tiap toggle
   ♥ di beranda supaya isinya selalu sinkron. */
function renderFavSection() {
  const sec = document.getElementById('favSec');
  if (!sec) return;
  const favs = getFav().map((x) => byId(x.id)).filter(Boolean);
  if (!favs.length) { sec.style.display = 'none'; sec.innerHTML = ''; return; }
  sec.style.display = '';
  const shown = favs.slice(0, 8);
  sec.innerHTML = `
      <div class="sechead"><h2>Favorit</h2><span class="n">${favs.length}</span></div>
      <div class="tgrid" id="favHomeGrid"></div>
      ${favs.length > 8 ? `<a class="secmore" href="#/favorit">Lihat semua favorit →</a>` : ''}`;
  const grid = sec.querySelector('#favHomeGrid');
  shown.forEach((m) => grid.appendChild(cardEl(m, null)));
}
function home() {
  document.body.dataset.route = 'home';
  setTabActive('home');
  document.title = 'Butuh apa? - ADIP Tools';
  const n = manifest.length;
  /* P1 (v6.14.0): beranda dua keadaan. Pengunjung baru (tanpa
     riwayat, tanpa favorit) melihat subheadline + bukti singkat
     + seksi "Mulai dari sini" + lembar orientasi; pengunjung
     kembali melihat hero persis seperti sebelumnya. */
  const baru = isNewVisitor();
  const app = document.getElementById('app');
  const cats = CATS.filter((c) => c[0] !== 'semua');
  const tiles = cats
    .map(([id, label]) => {
      const cnt = manifest.filter((m) => m.cat === id).length;
      return `<a class="cattile glass" href="#/k/${id}">
        <span class="ci" aria-hidden="true">${CAT_ICON[id] || '🧰'}</span>
        <span class="cl">${label}</span>
        <span class="cn">${cnt}</span>
      </a>`;
    }).join('');
  /* P2-B1 (v6.14.0, V-07): Koleksi bukan lagi ubin copy-paste
     kategori — kartu lebar dengan deskripsi nyata + jumlah tool. */
  const colTiles = COLLECTIONS
    .map((c) => `<a class="colcard glass" href="#/c/${c.id}">
      <span class="cic" aria-hidden="true">${c.icon}</span>
      <span class="ctx">
        <span class="cnm">${T.esc(c.name)}</span>
        <span class="cds">${T.esc(c.desc)}</span>
        <span class="cnt">${c.tools.filter((id) => byId(id)).length} tools <span class="arr" aria-hidden="true">→</span></span>
      </span>
    </a>`).join('');
  app.innerHTML = `
  <div class="wrap view">
    <header class="top">
      <a class="brand" href="#/"><span class="mark" aria-hidden="true">a</span><span class="wm">ADIP <em>Tools</em></span></a>
      <div class="top-right">
        <span class="topcount"><b>${n}</b> tools</span>
        <button class="icobtn" id="palBtn" aria-label="Cari cepat (Ctrl+K)">⌕</button>
      </div>
    </header>
    <section class="hero rise" style="--i:0">
      <p class="hi">${greet()}, butuh bantuan apa?</p>
      <h1><span class="w" style="--i:0"><span class="mask"><span class="mi">Butuh</span></span></span> <span class="w" style="--i:1"><span class="mask"><span class="mi"><span class="qm">apa?</span></span></span></span></h1>${baru ? `\n      <p class="hero-sub">${HERO_SUB}</p>` : ''}
      <div class="hsearch glass">
        <span class="glyph" aria-hidden="true">⌕</span>
        <input id="q" type="search" placeholder="${T.esc(PH_EXAMPLES[0])}" autocomplete="off" aria-label="Cari tools">
      </div>
      <p class="dim" style="font-size:11.5px;margin:8px 2px 0">Kata yang kamu cari dicatat tanpa nama untuk daftar Populer.</p>${baru ? `\n      ${heroProofHTML(n)}` : ''}
    </section>
    <div id="contd"></div>${baru ? `\n    ${mulaiDariSiniHTML(manifest)}` : ''}
    <section class="sec rise" style="--i:2" id="favSec" aria-label="Favorit"></section>
    <section class="sec rise" style="--i:3" aria-label="Populer">
      <div class="sechead"><h2>🔥 Populer</h2><span class="n rail-hint">geser →</span></div>
      <div class="hscroll" id="popRail"></div>
    </section>
    <section class="sec rise" style="--i:4" id="baruSec" aria-label="Baru ditambahkan"></section>
    <section class="sec rise" style="--i:5" id="spotSec" aria-label="Tool pilihan"></section>
    <section class="sec rise" style="--i:6" aria-label="Kategori">
      <div class="sechead"><h2>Kategori</h2><span class="n">${cats.length}</span></div>
      <div class="catgrid">${tiles}</div>
    </section>
    <section class="sec rise" style="--i:7" aria-label="Koleksi">
      <div class="sechead"><h2>Koleksi</h2><span class="n">berdasarkan masalah</span></div>
      <div class="colgrid">${colTiles}</div>
    </section>
    <section class="sec rise" style="--i:8" id="recSec" aria-label="Riwayat">
      <div class="sechead"><h2>🕐 Riwayat</h2></div>
      <div class="hscroll" id="recRail"></div>
    </section>
    <a class="allbtn glass rise" style="--i:9" href="#/semua">
      <span>Semua tools <span class="an">${n}</span></span>
      <span class="ago" aria-hidden="true">→</span>
    </a>
    ${acakButtonHTML(10)}
    ${footerHTML(n, { rise: 11 })}
  </div>`;
  app.querySelector('#palBtn').addEventListener('click', openPalette);
  const inp = app.querySelector('#q');
  startPlaceholderRotation(inp);
  let goT;
  inp.addEventListener('input', () => {
    clearTimeout(goT);
    const v = inp.value.trim();
    if (v.length >= 2) goT = setTimeout(() => {
      if (document.body.contains(inp) && document.body.dataset.route === 'home')
        location.hash = '#/semua?q=' + encodeURIComponent(v);
    }, 700);
  });
  inp.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const v = inp.value.trim();
      if (v) trackSearch(v);
      location.hash = '#/semua' + (v ? '?q=' + encodeURIComponent(v) : '');
    }
  });
  renderContinue();
  renderFavSection();
  renderPopuler(popularTerms, manifest);
  renderBaru(document.getElementById('baruSec'), manifest, VERSION);
  renderSpotlight(document.getElementById('spotSec'), manifest);
  renderRecent();
  /* P1: lembar orientasi sekali tampil (hanya pengunjung baru,
     hanya di beranda, tidak pernah di atas deep link — semua
     penjaga ada di dalam maybeShowOnboarding). */
  maybeShowOnboarding(manifest);
  document.getElementById('acakBtn')?.addEventListener('click', () => {
    const m = pickRandomTool(manifest);
    if (m) location.hash = '#/t/' + m.id;
  });
  /* P3 (v6.14.0): count-up angka tools PINDAH ke js/fx.js
     (initPillCountUp, menyasar pill shell). Blok count-up lama di
     sini MATI sejak P2-B2: renderNavbar() menghapus header.top
     home() sebelum rAF pertamanya jalan, jadi ia hanya mengupdate
     node yang sudah lepas dari DOM. */
}

/* renderContinue/renderPopuler/renderRecent tinggal di beranda.js. */

/* ---------------- VIEW: semua tools + filter (#/semua) ---------------- */
function allPage(q) {
  document.body.dataset.route = 'semua';
  setTabActive(null);
  document.title = 'Semua tools - ADIP Tools';
  const n = manifest.length;
  const app = document.getElementById('app');
  /* chip filter: gaya meniru .schip (token yang sama), tanpa sentuh CSS.
     Chip hanya muncul bila ada tool baru, supaya tidak jadi tombol mati. */
  const hasNew = manifest.some(isNew);
  /* B-05 (v6.14.0, P2-B1): chip 38px -> min-height 44px (R-03).
     .fchip di upgrade-612.css ikut diupdate — inline menang. */
  const CHIP = 'font:inherit;font-size:13px;font-weight:600;color:var(--mut);cursor:pointer;border:1px solid var(--line);border-radius:999px;padding:8px 14px;background:var(--surface);min-height:44px';
  const CHIP_ON = 'font:inherit;font-size:13px;font-weight:600;color:var(--txt);cursor:pointer;border:1px solid rgba(255,255,255,.5);border-radius:999px;padding:8px 14px;background:rgba(255,255,255,.08);min-height:44px';
  let filter = 'all';
  app.innerHTML = `
  <div class="wrap view">
    <a class="back" href="#/">← Beranda</a>
    <h2 class="pagetitle rise" style="--i:0">Semua tools</h2>
    <div class="hsearch glass rise" style="--i:1">
      <span class="glyph" aria-hidden="true">⌕</span>
      <input id="aq" type="search" placeholder="Cari ${n} tools..." value="${T.esc(q)}" autocomplete="off" aria-label="Cari semua tools">
    </div>
    <div class="fchips" style="display:flex;flex-wrap:wrap;gap:8px;margin-top:14px" role="group" aria-label="Filter tools">
      <button class="fchip" data-f="all" aria-pressed="true" style="${CHIP_ON}">Semua</button>
      ${hasNew ? `<button class="fchip" data-f="new" aria-pressed="false" style="${CHIP}">Terbaru</button>` : ''}
      <button class="fchip" data-f="fav" aria-pressed="false" style="${CHIP}">♥ Favorit</button>
    </div>
    <div class="sechead" style="margin-top:18px"><h2 id="allCount"></h2></div>
    <div class="tgrid" id="allGrid"></div>
    ${footerHTML(n)}
  </div>`;
  const inp = app.querySelector('#aq');
  const grid = app.querySelector('#allGrid');
  const count = app.querySelector('#allCount');
  /* P3 (v6.14.0): entrance kartu hanya pada paint pertama. */
  let paints = 0;
  const paint = (qq) => {
    /* Mulai paint ke-2, grid jadi "mantap" (.tgrid.fx-steady di
       fx-p3.css): kartu tidak memutar ulang stagger 48 kartu tiap
       ketikan (debounce 180ms) atau ganti filter — itu kedip,
       bukan umpan balik. Hitungan "N hasil" sudah mengabarkan
       perubahan. Load-more (components.js) ikut tenang. */
    if (paints++ > 0) grid.classList.add('fx-steady');
    const ql = qq.trim();
    const a = ql ? assessQuery(ql, manifest, searchCtx()) : null;
    let list = a ? a.results : visibleTools();
    if (filter === 'new') list = list.filter(isNew);
    if (filter === 'fav') {
      const favIds = new Set(getFav().map((x) => x.id));
      list = list.filter((m) => favIds.has(m.id));
    }
    /* B-01 (v6.14.0, P2-B1): bila kueri tidak yakin + tanpa saran +
       tanpa kecocokan persis, yang tampil adalah state kosong —
       label harus "0 hasil", bukan jumlah hasil fuzzy (24) yang
       tidak jadi ditampilkan. */
    const noResults = Boolean(a && !a.confident && !a.suggestion && !a.topExact);
    count.textContent = noResults ? '0 hasil' : (ql ? `${list.length} hasil` : `${list.length} tools`);
    count.parentElement.querySelector('.sug-hint')?.remove();
    if (a && !a.confident && a.suggestion) {
      count.insertAdjacentHTML('afterend', `<p class="sug-hint" style="margin:8px 0 0;font-size:13px;color:var(--mut)">Maksud Anda: <button class="schip" data-sug="${a.suggestion.id}">${T.esc(a.suggestion.name)}</button>?</p>`);
      count.parentElement.querySelector('[data-sug]').addEventListener('click', (e) => { location.hash = '#/t/' + e.target.dataset.sug; });
    }
    grid.innerHTML = '';
    if (noResults) {
      grid.innerHTML = `<div class="empty" style="grid-column:1/-1"><b>Tidak ada tool yang pas untuk "${T.esc(ql)}".</b><p>Coba kata lain, mis. "kalkulator".</p>
        <div class="sugx">${['kalkulator', 'qr', 'weton'].map((s) => `<button class="schip">${s}</button>`).join('')}</div></div>`;
      grid.querySelectorAll('.schip').forEach((b) => b.addEventListener('click', () => { inp.value = b.textContent; paint(inp.value); }));
      return;
    }
    if (!list.length) {
      if (filter === 'fav' && !ql) {
        grid.innerHTML = `<div class="empty" style="grid-column:1/-1"><b>Belum ada favorit.</b><p>Ketuk ♥ di kartu tools buat nyimpen.</p></div>`;
        return;
      }
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
    t = setTimeout(() => { if (inp.value.trim()) trackSearchDebounced(inp.value.trim()); paint(inp.value); }, 180);
  });
  inp.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && inp.value.trim()) { addRecentSearch(inp.value.trim()); trackSearch(inp.value.trim()); }
  });
  const chips = app.querySelectorAll('.fchip');
  chips.forEach((b) => b.addEventListener('click', () => {
    filter = b.dataset.f;
    chips.forEach((c) => {
      const on = c === b;
      c.style.cssText = on ? CHIP_ON : CHIP;
      c.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    paint(inp.value);
  }));
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
  const tools = visibleTools().filter((m) => m.cat === id);
  app.innerHTML = `
  <div class="wrap view">
    <a class="back" href="#/">← Beranda</a>
    <div class="cat-head rise" style="--i:0">
      <span class="ctic" aria-hidden="true">${CAT_ICON[id] || '🧰'}</span>
      <div><h2>${cat[1]}</h2><p class="csub">${tools.length} tools</p></div>
    </div>
    <div id="catIntro"></div>
    <div class="tgrid" id="catGrid"></div>
    ${footerHTML(n)}
  </div>`;
  const grid = app.querySelector('#catGrid');
  tools.forEach((m) => grid.appendChild(cardEl(m, null, { hideCat: true })));
  renderCatIntro(document.getElementById('catIntro'), id, manifest);
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
      <div><h2>Favorit</h2><p class="csub">${favs.length ? `${favs.length} tersimpan di perangkat ini` : 'Belum ada yang tersimpan'}</p></div>
    </div>
    <div class="tgrid" id="favGrid"></div>
    ${favs.length ? '' : `<div class="empty"><b>Belum ada favorit.</b><p>Ketuk ♥ di kartu tools buat nyimpen.</p><div class="sugx"><a class="schip" href="#/semua">Cari tools</a></div></div>`}
    ${footerHTML(n)}
  </div>`;
  const grid = app.querySelector('#favGrid');
  favs.forEach((m) => grid.appendChild(cardEl(m, null)));
}

/* ---------------- VIEW: koleksi (#/c/<id>) ---------------- */
function collectionPage(id) {
  const col = collectionById(id);
  const app = document.getElementById('app');
  if (!col) { location.hash = '#/'; return; }
  document.body.dataset.route = 'koleksi';
  setTabActive(null);
  document.title = col.name + ' - ADIP Tools';
  const n = manifest.length;
  const tools = col.tools.map(byId).filter(Boolean);
  app.innerHTML = `
  <div class="wrap view">
    <a class="back" href="#/">← Beranda</a>
    <div class="cat-head rise" style="--i:0">
      <span class="ctic" aria-hidden="true">${col.icon}</span>
      <div><h2>${T.esc(col.name)}</h2><p class="csub">${tools.length} tools</p></div>
    </div>
    <p class="rise" style="--i:1;font-size:14px;line-height:1.6;color:var(--mut);margin:-6px 0 16px">${T.esc(col.desc)}</p>
    <div class="tgrid" id="colGrid"></div>
    ${footerHTML(n)}
  </div>`;
  const grid = app.querySelector('#colGrid');
  tools.forEach((m) => grid.appendChild(cardEl(m, null)));
}

/* ---------------- HALAMAN METODOLOGI (#/metodologi) ----------------
   Desain jujur ala alatbantu.app: tiap kalkulator dijelaskan cara hitungnya
   + asumsi & batasannya. Konten dari METHOD (ditulis dari kode tool-nya).
   Anchor per tool: #/metodologi#thr — router memanggil methodPage lalu
   scroll ke entri yang dimaksud. */
function methodPage() {
  document.body.dataset.route = 'metodologi';
  setTabActive(null);
  document.title = 'Metodologi - ADIP Tools';
  const n = manifest.length;
  const app = document.getElementById('app');
  const entries = METHOD.map((x) => ({ x, m: byId(x.id) })).filter((e) => e.m);
  app.innerHTML = `
  <div class="wrap view">
    <a class="back" href="#/">← Beranda</a>
    <h2 class="pagetitle rise" style="--i:0">Metodologi</h2>
    <p class="rise" style="--i:1;font-size:14px;line-height:1.7;color:var(--mut);margin:-4px 0 8px">Cara tiap hitungan bekerja, ditulis dengan jujur, termasuk asumsi dan batasannya. Kalau ada yang tidak sesuai dengan aturan terbaru, itu karena tarif dan aturan mengikuti peraturan saat tool-nya ditulis.</p>
    <div class="glass rise" style="--i:1;border-radius:14px;padding:14px 16px;margin:12px 0 20px;font-size:13.5px;line-height:1.7">
      <b>Prinsip yang berlaku untuk semua kalkulator di sini:</b>
      <ul style="margin:8px 0 0;padding-left:18px;display:grid;gap:6px">
        <li>Semua hitungan jalan 100% di browser kamu. Angka yang kamu isi tidak dikirim ke mana pun.</li>
        <li>Angka di sini adalah <b>estimasi</b> untuk membantu mengambil keputusan, bukan nasihat pajak, hukum, atau medis.</li>
        <li>Hasil dibulatkan ke rupiah terdekat; selisih beberapa rupiah dari hitungan lain adalah wajar.</li>
      </ul>
    </div>
    <div style="display:grid;gap:12px">
      ${entries.map(({ x, m }, i) => `
      <article class="glass rise" id="m-${T.esc(m.id)}" style="--i:${i};border-radius:14px;padding:16px;scroll-margin-top:16px">
        <div style="display:flex;gap:10px;align-items:center;margin-bottom:8px">
          <span style="font-size:22px" aria-hidden="true">${T.esc(m.icon)}</span>
          <h3 style="font-size:16px;font-weight:750;letter-spacing:-.01em">${T.esc(m.name)}</h3>
          <a href="#/t/${T.esc(m.id)}" style="margin-left:auto;font-size:12.5px;white-space:nowrap">Buka tool →</a>
        </div>
        <p style="font-size:13.5px;line-height:1.7;margin:0 0 8px">${T.esc(x.rumus)}</p>
        <p class="hint" style="line-height:1.65;margin:0"><b style="color:var(--mut)">Asumsi &amp; batasan:</b> ${T.esc(x.batas)}</p>
      </article>`).join('')}
    </div>
    ${footerHTML(n, { methodLink: false })}
  </div>`;
  // anchor per tool: #/metodologi#thr
  const anchor = (location.hash.split('#')[2] || '').replace(/[^a-z0-9-]/g, '');
  if (anchor) {
    const target = document.getElementById('m-' + anchor);
    if (target) setTimeout(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  }
}

/* ---------------- HALAMAN TOOL ---------------- */
let toolCb = [];
function onToolLeave(cb) { toolCb.push(cb); }
/* Kuras JUGA leaveCbs core.js (T.onLeave): 107 tool mendaftarkan cleanup
   lewat T.onLeave, tapi sebelum v6.13.0 tidak ada yang menguras array itu —
   cleanup mereka mati semua. try/catch per callback dipertahankan. */
function runLeaveCbs() {
  toolCb.forEach((cb) => { try { cb(); } catch {} }); toolCb = [];
  T.leaveCbs.forEach((cb) => { try { cb(); } catch {} }); T.leaveCbs.length = 0;
}
/* token navigasi per pemanggilan toolPage (T02 B1): import tool A yang lambat
   tidak boleh me-render ke halaman tool B bila user sudah pindah. */
let toolSeq = 0;
async function toolPage(id) {
  /* R1 (v6.21.0): alias redirect — ID tool pensiun gelombang 3 mendarat
     di survivor-nya (peta TOOL_ALIASES di routes.js). location.replace:
     entri riwayat DIGANTI (bukan ditambah), jadi tombol kembali tidak
     mengulang redirect; hashchange memicu route() lagi dan survivor
     dirender normal, termasuk query-nya (?tab= / ?dir=b). Dicek SEBELUM
     byId() — route hidup tidak pernah menyentuh peta ini, ID tak dikenal
     tetap jatuh ke "Tools tidak ditemukan" di bawah. */
  const alias = resolveToolAlias(id);
  if (alias) { location.replace('#/t/' + alias); return; }
  const mySeq = ++toolSeq;
  const m = byId(id);
  const app = document.getElementById('app');
  document.body.dataset.route = 'tool';
  if (!m) {
    setTabActive(null);
    document.title = 'Tidak ditemukan - ADIP Tools';
    app.innerHTML = `<div class="wrap view"><div class="empty"><b>Tools tidak ditemukan.</b>
      <p>Mungkin alamatnya berubah.</p>
      <div class="sugx"><a class="schip" href="#/">Cari tools</a><a class="schip" href="#/semua">Lihat semua tools</a></div></div><a class="back" href="#/">← Beranda</a>${footerHTML(manifest.length)}</div>`;
    return;
  }
  setTabActive(null);
  document.title = m.name + ' - ADIP Tools';
  window.scrollTo(0, 0);
  app.innerHTML = `
  <div class="wrap narrow view">
    <a class="back" href="#/">← Beranda</a><span id="prevChip"></span>
    <div class="tool-head">
      <div class="th-top">
        <span class="tic" aria-hidden="true">${T.esc(m.icon)}</span>
        <div class="th">
          <h2>${T.esc(m.name)}</h2>
        </div>
        <div class="tacts"><button class="fav icobtn${isFav(m.id) ? ' on' : ''}" data-id="${T.esc(m.id)}" aria-label="${isFav(m.id) ? 'Hapus dari favorit' : 'Tambah ke favorit'}">♥</button>${shareButtonHTML(m)}</div>
      </div>
      <div class="meta">
        <span class="tag">${catLabel(m.cat)}</span>
        <span class="ds">${T.esc(m.desc || '')}</span>
      </div>
    </div>
    <div class="tool glass" id="toolbox"><div class="skel" role="status" aria-label="Memuat alat"><span class="sk-line w45"></span><span class="sk-line h-inp"></span><span class="sk-line w70"></span><span class="sk-line h-inp"></span><span class="sk-line h-area"></span></div></div>
    <div id="methLink"></div>
    <div id="nextSec"></div>
    <div class="related">
      <div class="sechead"><h2>Sejenis</h2></div>
      <div class="tgrid" id="relGrid"></div>
      <div id="catMore"></div>
    </div>
    <div id="recentLine"></div>
    ${footerHTML(manifest.length)}
  </div>`;
  touchRecent(m.id);
  /* binding di sini (bukan setelah render): tombol ♥ & bagikan tetap hidup
     walau import tool gagal (T02 B8). */
  bindFav(app);
  bindShareButtons(app);
  try {
    /* Loader tool via peta glob (bukan import() string dinamis — lihat
       catatan import.meta.glob di atas). Nama file ber-hash hasil build
       di-resolve Vite; ?v= manual sudah tidak dipakai lagi. */
    const loadTool = toolModules['./' + m.file];
    if (!loadTool) throw new Error('Tool tidak terdaftar di glob: ' + m.id);
    const mod = await loadTool();
    if (mySeq !== toolSeq || document.body.dataset.route !== 'tool') return;
    const box = document.getElementById('toolbox');
    box.querySelector('.skel')?.remove();
    mod.render(box, onToolLeave, T, m);
  } catch (e) {
    if (mySeq !== toolSeq) return; // jangan timpa halaman tool lain dengan pesan error tool ini
    const box = document.getElementById('toolbox');
    /* P2-B2 (E-04): tombol "Coba lagi" memuat ulang halaman.
       Alasan: impor chunk yang gagal TIDAK BISA diulang dalam
       halaman yang sama (Chromium mengingat kegagalan impor di
       module map — terbukti Playwright 17 Nov 2026); memanggil
       toolPage lagi hanya menampilkan error yang sama. Reload
       memakai hash #/t/<id> yang sama, jadi pengunjung kembali
       ke tool ini. */
    if (box) renderToolError(box, () => location.reload());
  }
  const grid = document.getElementById('relGrid');
  if (grid) {
    manifest
      .filter((x) => x.cat === m.cat && x.id !== m.id)
      .slice(0, 4)
      .forEach((x) => grid.appendChild(cardEl(x, null, { hideCat: true })));
  }
  // rantai "Lanjut ke" (ide UX #7): langkah berikut yang relevan, dari peta NEXT
  const nextHost = document.getElementById('nextSec');
  const nextTools = (NEXT[m.id] || []).map(byId).filter(Boolean);
  if (nextHost && nextTools.length) {
    nextHost.innerHTML = `
    <section class="sec" aria-label="Lanjut ke" style="margin-top:22px">
      <div class="sechead"><h2>Lanjut ke</h2></div>
      <div class="hscroll" id="nextRail">${nextTools.map(hcardHTML).join('')}</div>
    </section>`;
    const rail = nextHost.querySelector('#nextRail');
    if (rail) watchFadeX(rail);
  }
  // tautan metodologi untuk kalkulator yang rumusnya didokumentasikan
  const methHost = document.getElementById('methLink');
  if (methHost && METHOD_IDS.has(m.id)) {
    methHost.innerHTML = `<a href="#/metodologi#${T.esc(m.id)}" style="display:block;margin-top:14px;font-size:13px;color:var(--mut)">📖 Cara hitungnya: lihat rumus, asumsi &amp; batasannya di halaman Metodologi →</a>`;
  }
  /* V-08 (v6.14.0, P2-B1): riwayat di halaman tool bukan lagi
     carousel ketiga — satu baris teks "Terakhir dibuka: A · B · C"
     di bawah Sejenis (§5.3.5.3). */
  const recHost = document.getElementById('recentLine');
  if (recHost) recHost.innerHTML = recentLineHTML(m.id, getRecent(), byId, T.esc);
  const prevHost = document.getElementById('prevChip');
  if (prevHost) prevHost.innerHTML = prevToolChip(m.id, getRecent(), byId, T.esc);
  const catHost = document.getElementById('catMore');
  if (catHost) catHost.innerHTML = catMoreLink(m.cat, catLabel);
}

/* ---------------- ROUTER ----------------
   Tabel route tinggal di routes.js (SATU sumber kebenaran: pola +
   prioritas pencocokan); di sini hanya peta dispatch nama -> view.
   Menambah route baru = 1 baris di ROUTES + 1 entri di VIEWS +
   fungsi view-nya — tidak perlu bedah router. */
const VIEWS = {
  tool: (p) => toolPage(p.id),
  kategori: (p) => catPage(p.id),
  koleksi: (p) => collectionPage(p.id),
  metodologi: () => methodPage(),
  semua: (p, q) => allPage(queryParam(q, 'q') ?? ''),
  favorit: () => favPage(),
  home: () => home(),
};
/* P3 (v6.14.0): true hanya selama update callback transisi
   ViewTransition berjalan — dipakai run() untuk mematikan animasi
   masuk .view (lihat .view.fx-vt-in di fx-p3.css). */
let vtNext = false;
function route() {
  stopPlaceholderRotation();
  runLeaveCbs(); closePalette();
  const run = () => {
    window.scrollTo(0, 0);
    const m = matchRoute(location.hash || '#/');
    (VIEWS[m.name] || VIEWS.home)(m.params, m.query);
    /* P3: saat transisi ViewTransition berjalan, .view lahir tanpa
       animasi fx-view — snapshot baru sudah difade-in vt-in, animasi
       masuk kedua di dalam snapshot hanya menggandakan gerakan.
       Kelas menempel di .view ini saja (dibuang saat navigasi
       berikut), jadi tidak ada toggle-balik yang memicu animasi
       terlambat. */
    if (vtNext) {
      vtNext = false;
      document.querySelector('#app .view')?.classList.add('fx-vt-in');
    }
    /* P2-B2: pasang komponen chrome (navbar shell, breadcrumb,
       enhancement per-route) sesudah view dirender. */
    enhanceRoute(m.name, m.params);
    /* pindah fokus ke judul halaman (T24 P1-6): pengguna keyboard tidak
       perlu Tab dari atas tiap ganti view. */
    const appEl = document.getElementById('app');
    const h = appEl && appEl.querySelector('h1, h2');
    if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
  };
  // transisi halaman ala aplikasi native (fallback: render biasa)
  // .ready.catch(): navigasi cepat (< ~0,5 dtk) membuat transisi di-skip
  // dan promise ready melempar — tanpa catch, rejection tak tertangani
  // memenuhi console (temuan P0-D1, non-pemblokir, diperbaiki 1 baris).
  // P3: lewati ViewTransition bila pengguna minta kurangi gerak —
  // pseudo-element ::view-transition-* tidak terjangkau aturan `*`
  // di blok reduced-motion CSS, jadi geraknya harus dimatikan dari
  // sini (aturan di fx-p3.css §E hanya pertahanan lapis kedua).
  if (document.startViewTransition && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    try {
      vtNext = true;
      const t = document.startViewTransition(run);
      t.ready.catch(() => {});
    } catch {
      vtNext = false;
      run();
    }
  } else run();
}

/* ---------------- boot ---------------- */
ensureTabs();
initComponents({ openPalette, toast }); /* P2-B2: navbar, dialog, back-to-top */
initPWA({ toast }); /* PWA v6.20.0 (P10): SW + install/update — kerja berat ditunda sampai load */
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
initSeoShare({ manifest, catLabel, onToast: (msg) => toast(msg) });
