/* ============================================================
   ADIP Tools v6.14.0 — components.js (P2-B2: komponen UI audit)
   SATU sumber untuk komponen chrome yang ditambahkan ronde P2
   (hasil audit p1p2-riset-desain.md §4 + copy p1p2-copy.md §5-§6):

   - Navbar shell di SEMUA halaman (N-01) + dropdown Kategori /
     Koleksi desktop (N-03, D-02) + breadcrumb (N-04) +
     back-to-top (N-05)
   - Pencarian terakhir (S-05), filter kategori (S-06), sortir
     (S-07, Populer per D-03), load-more 48 (S-08) di #/semua
   - Dialog generik (D-01) + konfirmasi hapus (D-04), CTA empty
     state favorit (E-01), tombol coba lagi (E-04), kelola data
     minimal (P-01), cari di halaman kategori (P-08), daftar
     lompat Metodologi (P-09), hapus massal favorit (P-10)
   - Tooltip selektif (D-03, CSS-only lewat [data-tip])

   CARA KERJA (kontrak dengan tim P2-B1, yang sedang me-redesign
   dashboard secara paralel): modul ini TIDAK mengedit fungsi
   view mana pun. app.js hanya memanggil enhanceRoute() sekali
   dari route() sesudah view dirender; semua komponen di atas
   dipasang sebagai enhancement pasca-render pada DOM yang sudah
   ada. Bila elemen yang dicari tidak ada (view berubah), tiap
   enhancement diam-diam tidak melakukan apa-apa — tidak pernah
   melempar, tidak pernah menampilkan UI mati.
   ID/kelas DOM yang dipakai (kontrak untuk P2-B1, jangan ganti
   tanpa memberi tahu): #app, .wrap, header.top, a.back,
   #allGrid, #aq, .fchips, #allCount, .sechead, #catGrid,
   #catIntro, .cat-head, #favGrid, #toolbox, #prevChip,
   article[id^="m-"], .pal-wrap, #palQ, #palList, .tcard (.nm,
   .ct), .empty.

   Design Read (taste §0.B + antislop Part 3): chrome utilitas
   untuk direktori 627 tools, pengunjung Indonesia yang
   kebanyakan memakai HP, dalam bahasa visual terkunci "Arang &
   Coral" (bg #161311, aksen coral #ff6f61, Bricolage Grotesque).
   Dial ENERGY 1 / RHYTHM 1 / MOTION 1: tenang, seragam, gerak
   hanya hover dan buka/tutup 0,18 dtk. Komponen meniru pola
   visual yang sudah ada (.top, .pal, .schip, .allbtn) — tidak
   ada bahasa visual baru. Alasan tiap keputusan dicatat di
   tempatnya (antislop R-31).

   Modul ini aman diimpor di Node (tanpa DOM di top-level):
   fungsi murni (breadcrumbHTML, sortTools, cmpSemver,
   popularOrderFromTerms) dites langsung di Node.
   ============================================================ */
import { manifest } from './manifest.js';
import { esc } from './core.js';
import { CATS, CAT_ICON, catLabel, byId, COLLECTIONS, collectionById } from './catalog.js';
import { getFav, getRecent, FKEY, RKEY } from './store.js';
import { fetchPopularTerms } from './supabase.js';
import { getRecentSearches, addRecentSearch, clearRecentSearches, rankedSearchPlus } from './search-plus.js';

/* ---------------- ikon chrome: SVG inline stroke 1,5 --------------
   Satu keluarga dengan feather "share-2" yang sudah dipakai
   seo-share.js (riset §5.3.10): ketebalan goresan dan bahasa
   bentuk yang sama di semua chrome. Emoji tetap dipakai sebagai
   ikon tool/kategori (identitas produk), bukan di chrome. */
const svgIcon = (inner, size = 18) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${inner}</svg>`;
const ICON = {
  search: svgIcon('<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>'),
  chevron: svgIcon('<polyline points="6 9 12 15 18 9"/>', 15),
  up: svgIcon('<line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>'),
};

/* ---------------- util kecil ---------------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const PAGE_SIZE = 48; /* kelipatan 2, 3, dan 4 kolom: baris terakhir
  selalu penuh di semua lebar (riset §5.3.4). */
const ID_OK = /^[a-z0-9-]+$/;

/* hitungan tool per kategori, dihitung sekali dari manifest. */
let catCounts = null;
function getCatCounts() {
  if (catCounts) return catCounts;
  catCounts = new Map(CATS.map(([id]) => [id, 0]));
  for (const m of manifest) {
    if (m && catCounts.has(m.cat)) catCounts.set(m.cat, catCounts.get(m.cat) + 1);
  }
  return catCounts;
}

/* banding semver (dipakai sortir Terbaru; salinan lokal supaya
   modul ini tidak bergantung ke beranda.js milik P2-B1). */
function cmpSemver(a, b) {
  const pa = String(a || '0').split('.').map((x) => parseInt(x, 10) || 0);
  const pb = String(b || '0').split('.').map((x) => parseInt(x, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d) return d > 0 ? 1 : -1;
  }
  return 0;
}

/* ---------------- state modul ----------------
   shell: callback dari app.js (openPalette + toast tinggal di
   app.js; komponen ini tidak menduplikasi keduanya).
   Semua listener global dipasang SEKALI di initComponents
   (tidak per route) supaya tidak bocor tiap navigasi. */
const shell = { openPalette: null, toast: null };
let booted = false;
let currentDialog = null; /* { wrap, returnFocus } */
let openDrop = null; /* { btn, panel } */
let semua = null; /* controller #/semua, hidup satu kunjungan route */
let gridObserver = null;
let routeObserver = null; /* observer per-route (tool/favorit) */
let palObserver = null;

function sayToast(msg) { if (shell.toast) shell.toast(msg); }

/* ============================================================
   NAVBAR (N-01 + N-03 + D-02)
   Satu header .top yang dirender di SEMUA view oleh route(),
   menggantikan header yang dulu hanya ada di home(). Isi:
   brand | Semua tools, Kategori▾, Koleksi▾, Metodologi
   (desktop ≥1024px) | pill jumlah tools (tanpa titik live,
   V-10) + tombol cari. Di bawah 1024px hanya brand + pill +
   cari; navigasi mobile tetap bottom tab bar (N-02) — tanpa
   hamburger terpisah (sengaja tidak).
   ============================================================ */
function dropdownItemHTML(href, icon, label, count) {
  return `<a class="drop-item" href="${href}" role="menuitem"><span class="di-ic" aria-hidden="true">${icon}</span><span class="di-lb">${esc(label)}</span>${count !== undefined ? `<span class="di-n">${count}</span>` : ''}</a>`;
}

function navbarHTML(routeName) {
  const n = manifest.length;
  const counts = getCatCounts();
  const cats = CATS.filter(([id]) => id !== 'semua');
  const catItems = cats.map(([id, label]) =>
    dropdownItemHTML('#/k/' + id, CAT_ICON[id] || '🧰', label, counts.get(id) || 0)).join('');
  const colItems = COLLECTIONS.map((c) =>
    dropdownItemHTML('#/c/' + c.id, c.icon, c.name, c.tools.filter((id) => byId(id)).length)).join('');
  const cur = (name) => (routeName === name ? ' aria-current="page"' : '');
  const dropOn = (name) => (routeName === name ? ' on' : '');
  return `<header class="top top-shell">
      <a class="brand" href="#/"><span class="mark" aria-hidden="true">a</span><span class="wm">ADIP <em>Tools</em></span></a>
      <nav class="topnav" aria-label="Menu utama">
        <a class="navlink" href="#/semua"${cur('semua')}>Semua tools</a>
        <div class="navdrop">
          <button class="navlink navdrop-btn${dropOn('kategori')}" type="button" id="navCatBtn" aria-haspopup="true" aria-expanded="false" aria-label="Pilih kategori">Kategori<span class="chev" aria-hidden="true">${ICON.chevron}</span></button>
          <div class="drop drop-cat" role="menu" aria-labelledby="navCatBtn" hidden>
            <div class="drop-grid">${dropdownItemHTML('#/', '🧰', 'Semua kategori')}${catItems}</div>
            <div class="drop-foot">
              ${dropdownItemHTML('#/t/bantuan', '❓', 'Bantuan')}
              ${dropdownItemHTML('#/t/beri-masukan', '💬', 'Beri Masukan')}
            </div>
          </div>
        </div>
        <div class="navdrop">
          <button class="navlink navdrop-btn${dropOn('koleksi')}" type="button" id="navColBtn" aria-haspopup="true" aria-expanded="false">Koleksi<span class="chev" aria-hidden="true">${ICON.chevron}</span></button>
          <div class="drop drop-col" role="menu" aria-labelledby="navColBtn" hidden>
            <div class="drop-list">${colItems}</div>
          </div>
        </div>
        <a class="navlink" href="#/favorit"${cur('favorit')}>Favorit</a>
        <a class="navlink" href="#/metodologi"${cur('metodologi')}>Metodologi</a>
      </nav>
      <div class="top-right">
        <span class="topcount"><b>${n}</b> tools</span>
        <button class="icobtn" id="shellPalBtn" type="button" aria-label="Cari cepat (Ctrl+K)" data-tip="Cari cepat (Ctrl+K)">${ICON.search}</button>
      </div>
    </header>`;
}

/* --- dropdown: buka/tutup + keyboard (panah, Home/End, Esc) --- */
function closeDropdown(focusBtn) {
  if (!openDrop) return;
  const { btn, panel } = openDrop;
  openDrop = null;
  panel.hidden = true;
  btn.setAttribute('aria-expanded', 'false');
  if (focusBtn && document.body.contains(btn)) btn.focus();
}
function openDropdown(btn, panel) {
  if (openDrop && openDrop.btn !== btn) closeDropdown(false);
  openDrop = { btn, panel };
  panel.hidden = false;
  btn.setAttribute('aria-expanded', 'true');
}
function toggleDropdown(btn, panel) {
  if (openDrop && openDrop.btn === btn) closeDropdown(false);
  else openDropdown(btn, panel);
}
function dropItems(panel) {
  return $$('[role="menuitem"]', panel).filter((el) => el.offsetParent !== null || el.getClientRects().length);
}
function bindDropdown(btn, panel) {
  btn.addEventListener('click', () => toggleDropdown(btn, panel));
  btn.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      /* Enter/Space di button juga memicu click; cegah toggle ganda
         dengan hanya menangani ArrowDown di sini (Enter/Space lewat
         click). ArrowDown membuka lalu fokus ke item pertama. */
      if (e.key !== 'ArrowDown') return;
      e.preventDefault();
      openDropdown(btn, panel);
      dropItems(panel)[0]?.focus();
    }
  });
  panel.addEventListener('keydown', (e) => {
    const items = dropItems(panel);
    const i = items.indexOf(document.activeElement);
    if (e.key === 'ArrowDown') { e.preventDefault(); items[Math.min(i + 1, items.length - 1)]?.focus(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); (i <= 0 ? items[items.length - 1] : items[i - 1])?.focus(); }
    else if (e.key === 'Home') { e.preventDefault(); items[0]?.focus(); }
    else if (e.key === 'End') { e.preventDefault(); items[items.length - 1]?.focus(); }
  });
  /* memilih item menutup panel (navigasi hash ikut menutup lewat
     enhanceRoute, tapi tutup langsung terasa lebih responsif). */
  panel.addEventListener('click', (e) => { if (e.target.closest('[role="menuitem"]')) closeDropdown(false); });
  /* P2-QA (C22b, 17 Nov 2026): Tab yang melewati panel harus menutupnya.
     Tanpa ini, pengguna keyboard yang men-Tab melewati item terakhir
     meninggalkan panel melayang terbuka sementara fokus sudah jauh di
     konten — panel menutupi konten tanpa ada yang memintanya. focusout
     dengan relatedTarget di luar .navdrop = fokus benar-benar pergi
     (Tab antar item di dalam panel tidak memicu tutup). */
  btn.closest('.navdrop').addEventListener('focusout', (e) => {
    const drop = btn.closest('.navdrop');
    if (openDrop && openDrop.btn === btn && !(e.relatedTarget && drop.contains(e.relatedTarget))) {
      closeDropdown(false);
    }
  });
}

/* Pasang navbar shell: hapus header .top milik view (saat ini
   hanya home() yang punya; bila P2-B1 sudah mencabutnya, langkah
   ini tidak menemukan apa-apa dan tidak melakukan apa-apa),
   lalu sisipkan navbar sebagai anak pertama .wrap. */
function renderNavbar(routeName) {
  const wrap = $('#app .wrap') || document.getElementById('app');
  if (!wrap) return;
  wrap.querySelector(':scope > header.top')?.remove();
  wrap.insertAdjacentHTML('afterbegin', navbarHTML(routeName));
  const palBtn = $('#shellPalBtn', wrap);
  if (palBtn && shell.openPalette) palBtn.addEventListener('click', shell.openPalette);
  const catBtn = $('#navCatBtn', wrap);
  const colBtn = $('#navColBtn', wrap);
  if (catBtn) bindDropdown(catBtn, catBtn.closest('.navdrop').querySelector('.drop'));
  if (colBtn) bindDropdown(colBtn, colBtn.closest('.navdrop').querySelector('.drop'));
}

/* ============================================================
   BREADCRUMB (N-04)
   Satu baris di atas judul: Beranda / Kategori / Nama tool.
   Menggantikan tautan "← Beranda" (fungsinya diambil alih
   segmen pertama). Segmen terakhir bukan tautan
   (aria-current="page").
   ============================================================ */
function breadcrumbHTML(segments) {
  if (!segments || segments.length < 2) return '';
  const items = segments.map((s, i) => {
    const last = i === segments.length - 1;
    return last
      ? `<li aria-current="page"><span>${esc(s.label)}</span></li>`
      : `<li><a href="${esc(s.href)}">${esc(s.label)}</a></li>`;
  }).join('');
  return `<nav class="crumbs" aria-label="Breadcrumb"><ol>${items}</ol></nav>`;
}

function breadcrumbFor(routeName, params) {
  const home = { label: 'Beranda', href: '#/' };
  if (routeName === 'semua') return [home, { label: 'Semua tools' }];
  if (routeName === 'favorit') return [home, { label: 'Favorit' }];
  if (routeName === 'metodologi') return [home, { label: 'Metodologi' }];
  if (routeName === 'kategori') {
    const id = params && params.id;
    if (!id || !ID_OK.test(id)) return null;
    return [home, { label: catLabel(id) }];
  }
  if (routeName === 'koleksi') {
    const col = collectionById(params && params.id);
    if (!col) return null;
    return [home, { label: 'Koleksi', href: '#/' }, { label: col.name }];
  }
  if (routeName === 'tool') {
    const m = byId(params && params.id);
    if (!m) return null;
    return [home, { label: catLabel(m.cat), href: '#/k/' + m.cat }, { label: m.name }];
  }
  return null;
}

/* Ganti tautan "← Beranda" pertama di .wrap dengan breadcrumb;
   di halaman tanpa tautan itu (Favorit) sisipkan sebelum kepala
   halaman. Tautan "← Beranda" di posisi lain (mis. bawah halaman
   "tidak ditemukan") dibiarkan apa adanya. */
function insertBreadcrumb(routeName, params) {
  const segments = breadcrumbFor(routeName, params);
  if (!segments) return;
  const wrap = $('#app .wrap');
  if (!wrap) return;
  const html = breadcrumbHTML(segments);
  const back = $(':scope > a.back', wrap);
  if (back) { back.insertAdjacentHTML('afterend', html); back.remove(); return; }
  const head = $('.cat-head', wrap);
  if (head) head.insertAdjacentHTML('beforebegin', html);
}

/* ============================================================
   BACK-TO-TOP (N-05)
   Tombol melayang 44px, muncul setelah scroll 800px. Posisi di
   atas tab bar di HP (bottom 96px), di pojok di desktop
   (bottom 24px, ≥1024px). Scroll listener pasif + throttle
   rAF: satu cek per frame, bukan per event.
   ============================================================ */
function initBackToTop() {
  if ($('#bttBtn')) return;
  const btn = document.createElement('button');
  btn.id = 'bttBtn';
  btn.className = 'btt';
  btn.type = 'button';
  btn.setAttribute('aria-label', 'Kembali ke atas');
  btn.setAttribute('data-tip', 'Kembali ke atas');
  btn.innerHTML = ICON.up;
  btn.addEventListener('click', () => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  });
  document.body.appendChild(btn);
  let ticking = false;
  const upd = () => {
    ticking = false;
    btn.classList.toggle('show', window.scrollY > 800);
  };
  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(upd); }
  }, { passive: true });
  upd();
}

/* ============================================================
   DIALOG GENERIK (D-01) — dipakai ulang semua konfirmasi
   Visual meniru panel palet (.pal): backdrop 0.62, panel
   #211b16 radius 18px, garis halus, masuk spring 0,32 dtk.
   Esc + klik backdrop menutup; fokus masuk ke panel, Tab
   terkunci di dalam, fokus kembali ke pemicu saat ditutup;
   scroll body dikunci selama dialog terbuka.
   ============================================================ */
function openDialog({ title, body, actions = [] }) {
  closeDialog();
  const returnFocus = document.activeElement;
  const wrap = document.createElement('div');
  wrap.className = 'dlg-wrap';
  wrap.innerHTML = `<div class="dlg-backdrop"></div>
    <div class="dlg" role="dialog" aria-modal="true" aria-labelledby="dlgTitle">
      <h2 class="dlg-title" id="dlgTitle">${esc(title)}</h2>
      <div class="dlg-body">${body}</div>
      <div class="dlg-actions">${actions.map((a, i) =>
        `<button type="button" class="dlg-btn${a.danger ? ' danger' : ''}${a.primary ? ' primary' : ''}" data-i="${i}">${esc(a.label)}</button>`).join('')}</div>
    </div>`;
  document.body.appendChild(wrap);
  document.body.classList.add('dlg-open');
  currentDialog = { wrap, returnFocus };
  const btns = $$('.dlg-btn', wrap);
  btns.forEach((b) => b.addEventListener('click', () => {
    const act = actions[Number(b.dataset.i)];
    closeDialog();
    if (act && act.onClick) act.onClick();
  }));
  wrap.querySelector('.dlg-backdrop').addEventListener('click', closeDialog);
  /* kunci fokus: Tab dari tombol terakhir kembali ke pertama. */
  wrap.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab' || btns.length < 2) return;
    const first = btns[0];
    const last = btns[btns.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  /* fokus awal ke aksi aman (bukan aksi berbahaya) — default
     fokus browser ke elemen pertama; bila aksi pertama berbahaya,
     fokus ke tombol kedua. */
  (actions[0] && actions[0].danger && btns[1] ? btns[1] : btns[0])?.focus();
  return wrap;
}
function closeDialog() {
  if (!currentDialog) return;
  const { wrap, returnFocus } = currentDialog;
  currentDialog = null;
  wrap.remove();
  document.body.classList.remove('dlg-open');
  if (returnFocus && document.body.contains(returnFocus) && typeof returnFocus.focus === 'function') {
    returnFocus.focus();
  }
}
/* Konfirmasi dua tombol (Batal / Ya, …): resolve true bila aksi
   berbahaya dikonfirmasi. Teks dari p1p2-copy.md §6. */
function confirmDialog({ title, body, confirmLabel = 'Ya, hapus' }) {
  return new Promise((resolve) => {
    openDialog({
      title,
      body: `<p>${esc(body)}</p>`,
      actions: [
        { label: 'Batal', onClick: () => resolve(false) },
        { label: confirmLabel, danger: true, onClick: () => resolve(true) },
      ],
    });
  });
}

/* ============================================================
   PENCARIAN TERAKHIR (S-05)
   Data sudah dicatat addRecentSearch sejak lama (localStorage
   adip_search_hist, maks 8), tapi getRecentSearches tidak
   pernah dipakai. Chip di #/semua + bagian di palet.
   ============================================================ */
function recentSearchesHTML(terms) {
  if (!terms || !terms.length) return '';
  return `<div class="rs-wrap">
      <span class="rs-label">Terakhir dicari</span>
      <div class="rs-chips">${terms.map((t) =>
        `<button type="button" class="schip rs-chip" data-term="${esc(t)}">${esc(t)}</button>`).join('')}
      <button type="button" class="rs-clear" data-rs-clear>Hapus</button></div>
    </div>`;
}
/* Jalankan pencarian dari chip: isi input, lalu tembak event
   input yang sama seperti ketikan pengguna — paint() view yang
   menangani sisanya (debounce view tetap jalan). */
function runRecentSearch(input, term) {
  input.value = term;
  addRecentSearch(term);
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.focus();
}

function enhanceRecentSearchesSemua() {
  const input = document.getElementById('aq');
  const hsearch = document.querySelector('#app .hsearch');
  if (!input || !hsearch || document.querySelector('#app .rs-wrap')) return;
  const render = () => {
    let wrap = document.querySelector('#app .rs-wrap');
    const terms = getRecentSearches().slice(0, 5);
    const show = input.value.trim() === '' && terms.length > 0;
    if (!show) { wrap?.remove(); return; }
    if (!wrap) {
      hsearch.insertAdjacentHTML('afterend', recentSearchesHTML(terms));
      wrap = document.querySelector('#app .rs-wrap');
      wrap.addEventListener('click', (e) => {
        const chip = e.target.closest('.rs-chip');
        if (chip) { runRecentSearch(input, chip.dataset.term); return; }
        if (e.target.closest('[data-rs-clear]')) { clearRecentSearches(); render(); }
      });
    }
  };
  render();
  /* input listener kedua (setelah milik view): menyembunyikan
     chip saat pengguna mengetik, menampilkannya lagi saat input
     dikosongkan. */
  input.addEventListener('input', render);
}

/* Bagian "Terakhir dicari" di palet: palet dibuat dinamis oleh
   openPalette, jadi observer menunggu .pal-wrap muncul. */
function injectPaletteRecent() {
  const list = document.getElementById('palList');
  const input = document.getElementById('palQ');
  if (!list || !input || input.value.trim() !== '') return;
  if (list.querySelector('.pal-rs')) return;
  const terms = getRecentSearches().slice(0, 5);
  if (!terms.length) return;
  const sec = document.createElement('div');
  sec.className = 'pal-rs';
  sec.innerHTML = `<div class="pal-sec">Terakhir dicari</div>
    <div class="rs-chips">${terms.map((t) =>
      `<button type="button" class="schip rs-chip" data-term="${esc(t)}">${esc(t)}</button>`).join('')}
    <button type="button" class="rs-clear" data-rs-clear>Hapus</button></div>`;
  sec.addEventListener('click', (e) => {
    const chip = e.target.closest('.rs-chip');
    if (chip) { runRecentSearch(input, chip.dataset.term); return; }
    if (e.target.closest('[data-rs-clear]')) { clearRecentSearches(); sec.remove(); }
  });
  list.appendChild(sec);
}
function initPaletteObserver() {
  if (palObserver) return;
  palObserver = new MutationObserver((muts) => {
    for (const m of muts) {
      for (const n of m.addedNodes) {
        if (n.nodeType === 1 && n.classList && n.classList.contains('pal-wrap')) {
          const input = document.getElementById('palQ');
          if (input && !input.dataset.rsBound) {
            input.dataset.rsBound = '1';
            input.addEventListener('input', () => {
              /* paint() palet menghapus isi list tiap ketikan,
                 jadi bagian ini disisipkan ulang tiap kali. */
              injectPaletteRecent();
            });
          }
          injectPaletteRecent();
        }
      }
    }
  });
  palObserver.observe(document.body, { childList: true });
}

/* ============================================================
   #/semua: filter kategori (S-06) + sortir (S-07) +
   load-more 48 (S-08) + perbaikan B-01
   View allPage() milik P2-B1 tidak diedit. Controller ini
   mengawasi #allGrid dengan MutationObserver: tiap paint view
   (awal + tiap ketikan) memicu pengumpulan ulang kartu, lalu
   controller melepas SEMUA kartu dari DOM dan hanya memasang
   kembali subset yang terlihat (maks 48). Node DOM yang hidup
   benar-benar berkurang — bukan sekadar disembunyikan (V-04:
   3.859 node jadi ±340). Melepas/memasuk kartu tidak memutus
   listener-nya (bindFav + klik kartu tetap menempel di node).
   ============================================================ */
function cardCatId(card) {
  /* kategori dibaca dari teks pertama .ct (label sebelum badge
     BARU); dipetakan balik ke id lewat CATS. */
  const ct = card.querySelector('.ct');
  if (!ct) return null;
  const first = ct.firstChild;
  const label = (first && first.nodeValue ? first.nodeValue : ct.textContent).trim();
  const hit = CATS.find(([, l]) => l === label);
  return hit ? hit[0] : null;
}
function cardMeta(card) {
  const href = card.getAttribute('href') || '';
  const id = href.replace('#/t/', '');
  const m = byId(id);
  return {
    el: card,
    id,
    name: (card.querySelector('.nm')?.textContent || '').trim(),
    since: m ? m.since : '0',
  };
}
function sortTools(list, mode, popularOrder) {
  /* list: [{id, name, since}]. Murni, dites di Node. */
  const arr = list.slice();
  if (mode === 'new') {
    arr.sort((a, b) => cmpSemver(b.since, a.since) || a.name.localeCompare(b.name, 'id'));
  } else if (mode === 'pop' && popularOrder && popularOrder.length) {
    const rank = new Map(popularOrder.map((id, i) => [id, i]));
    arr.sort((a, b) => {
      const ra = rank.has(a.id) ? rank.get(a.id) : 1e9;
      const rb = rank.has(b.id) ? rank.get(b.id) : 1e9;
      return ra - rb || a.name.localeCompare(b.name, 'id');
    });
  } else {
    arr.sort((a, b) => a.name.localeCompare(b.name, 'id'));
  }
  return arr;
}
/* urutan populer dari istilah pencarian Supabase: istilah
   teratas → hasil pertama rankedSearchPlus, dedup, maks 8
   (pola yang sama dipakai renderPopuler di app.js). */
function popularOrderFromTerms(terms, list) {
  const out = [];
  if (!terms) return out;
  for (const term of terms.slice(0, 8)) {
    const hit = rankedSearchPlus(term, list)[0];
    if (hit && !out.includes(hit.id)) out.push(hit.id);
  }
  return out;
}

function semuaState() {
  return {
    grid: document.getElementById('allGrid'),
    input: document.getElementById('aq'),
    countEl: document.getElementById('allCount'),
    cat: 'semua',
    sort: 'az',
    all: [], /* meta kartu hasil paint terakhir */
    shown: PAGE_SIZE,
    popular: null, /* null = belum dimuat; [] = gagal/jatuh ke A-Z */
    popularLoading: false,
  };
}

function semuaVisible() {
  const s = semua;
  const filtered = s.all.filter((c) => s.cat === 'semua' || c.cat === s.cat);
  const ordered = sortTools(filtered, s.sort, s.popular);
  return { filtered, ordered };
}

function semuaRender(appendOnly) {
  const s = semua;
  if (!s || !s.grid) return;
  const { filtered, ordered } = semuaVisible();
  const total = filtered.length;
  const visible = ordered.slice(0, s.shown);
  /* tulis DOM sendiri dengan observer dimatikan sementara: flag
     tidak cukup karena callback observer adalah microtask. */
  if (gridObserver) gridObserver.disconnect();
  if (appendOnly) {
    const have = s.grid.querySelectorAll('.tcard').length;
    const batch = ordered.slice(have, s.shown);
    s.grid.append(...batch.map((c) => c.el));
  } else {
    s.grid.replaceChildren(...visible.map((c) => c.el));
  }
  if (gridObserver && s.grid) gridObserver.observe(s.grid, { childList: true });
  /* teks "Menampilkan X dari Y tools" + tombol muat lagi */
  const line = document.getElementById('semuaMoreLine');
  const btn = document.getElementById('semuaMoreBtn');
  const shownNow = Math.min(s.shown, total);
  if (line) line.textContent = `Menampilkan ${shownNow} dari ${total} tools`;
  if (btn) {
    const rest = total - shownNow;
    btn.hidden = rest <= 0;
    btn.textContent = `Muat ${Math.min(PAGE_SIZE, rest)} lagi`;
  }
  /* label hitungan ikut filter aktif (format yang sama seperti
     paint view: "N hasil" saat mencari, "N tools" bila tidak). */
  if (s.countEl && s.cat !== 'semua') {
    const q = s.input && s.input.value.trim();
    s.countEl.textContent = q ? `${total} hasil` : `${total} tools`;
  }
}

function semuaEnsurePopular() {
  const s = semua;
  if (!s || s.popular !== null || s.popularLoading) return;
  s.popularLoading = true;
  /* D-03: Supabase tidak terjangkau → jatuh diam-diam ke A-Z
     (popular = []), tanpa UI error — sortir tetap jalan. */
  fetchPopularTerms()
    .then((terms) => { s.popular = popularOrderFromTerms(terms || [], manifest); })
    .catch(() => { s.popular = []; })
    .finally(() => {
      s.popularLoading = false;
      /* bila pengguna sedang menunggu mode Populer, terapkan
         urutannya begitu data tiba. */
      if (s.sort === 'pop' && document.getElementById('allGrid')) semuaRender(false);
    });
}

/* dipanggil tiap paint view: kumpulkan kartu segar, lalu render
   ulang sesuai state filter/sortir saat ini. */
function semuaCollect() {
  const s = semua;
  if (!s || !s.grid) return;
  /* cabang tidak-yakin (B-01): view menampilkan kotak kosong
     tapi label hitungan masih "24 hasil". Label dikoreksi jadi
     "0 hasil untuk ..." dan UI muat-lagi disembunyikan. */
  const empty = s.grid.querySelector('.empty');
  if (empty) {
    const b = empty.querySelector('b');
    const q = s.input ? s.input.value.trim() : '';
    if (b && b.textContent.startsWith('Tidak ada tool yang pas') && s.countEl) {
      s.countEl.textContent = q ? `0 hasil untuk "${q}"` : '0 hasil';
    }
    s.all = [];
    const line = document.getElementById('semuaMoreLine');
    const btn = document.getElementById('semuaMoreBtn');
    if (line) line.textContent = '';
    if (btn) btn.hidden = true;
    return;
  }
  s.all = $$('.tcard', s.grid).map((el) => ({ ...cardMeta(el), cat: cardCatId(el) }));
  /* kartu hasil paint baru mulai dari 48 pertama lagi — kecuali
     panggilan ini datang dari pengetikan yang sama persis
     (diabaikan: paint selalu berarti daftar baru). */
  s.shown = PAGE_SIZE;
  semuaRender(false);
}

function semuaBuildToolbar() {
  const s = semua;
  if (!s || !s.grid) return;
  /* 1) chip filter kategori setelah .fchips */
  const fchips = document.querySelector('#app .fchips');
  if (fchips && !document.getElementById('semuaCatChips')) {
    const counts = getCatCounts();
    const chips = [`<button type="button" class="fchip cat-chip" data-cat="semua" aria-pressed="true">Semua kategori</button>`] /* P2-QA: label
      "Semua" menduplikasi chip status di baris .fchips di atasnya (dua chip
      "Semua" aktif bersamaan — membingungkan). "Semua kategori" memakai
      kata copy FINAL DD-CAT-ALL; fungsi tidak berubah (data-cat="semua"). */
      .concat(CATS.filter(([id]) => id !== 'semua').map(([id, label]) =>
        `<button type="button" class="fchip cat-chip" data-cat="${id}" aria-pressed="false">${CAT_ICON[id] || '🧰'} ${esc(label)} <span class="chip-n">${counts.get(id) || 0}</span></button>`))
      .join('');
    fchips.insertAdjacentHTML('afterend',
      `<div class="catchips" id="semuaCatChips" role="group" aria-label="Saring tools">${chips}</div>`);
    document.getElementById('semuaCatChips').addEventListener('click', (e) => {
      const chip = e.target.closest('.cat-chip');
      if (!chip) return;
      s.cat = chip.dataset.cat;
      $$('.cat-chip', document.getElementById('semuaCatChips'))
        .forEach((c) => c.setAttribute('aria-pressed', c === chip ? 'true' : 'false'));
      s.shown = PAGE_SIZE;
      semuaRender(false);
    });
  }
  /* 2) sortir di .sechead, di samping #allCount */
  const sechead = document.querySelector('#app .sechead');
  if (sechead && !document.getElementById('semuaSort')) {
    sechead.insertAdjacentHTML('beforeend',
      `<label class="sortwrap"><span>Urutkan</span><select id="semuaSort" class="inp sortsel" aria-label="Urutkan tools">
        <option value="az">Nama A sampai Z</option>
        <option value="new">Yang terbaru dulu</option>
        <option value="pop">Yang paling sering dipakai</option>
      </select></label>`);
    document.getElementById('semuaSort').addEventListener('change', (e) => {
      s.sort = e.target.value;
      s.shown = PAGE_SIZE;
      if (s.sort === 'pop') semuaEnsurePopular();
      semuaRender(false);
    });
  }
  /* 3) baris "Menampilkan …" + tombol muat lagi setelah grid */
  if (!document.getElementById('semuaMoreLine')) {
    s.grid.insertAdjacentHTML('afterend',
      `<p class="moreline" id="semuaMoreLine"></p>
       <button type="button" class="allbtn morebtn" id="semuaMoreBtn" hidden>Muat 48 lagi</button>`);
    document.getElementById('semuaMoreBtn').addEventListener('click', () => {
      s.shown += PAGE_SIZE;
      semuaRender(true); /* tambah batch baru saja: kartu yang
        sudah tampil tidak di-render ulang (tanpa animasi ulang). */
    });
  }
}

function enhanceSemua() {
  semua = semuaState();
  if (!semua.grid) { semua = null; return; }
  semuaBuildToolbar();
  /* observer: paint view menghapus/menambah anak grid; panggil
     collect (microtask, jadi kartu segar sudah lengkap). */
  if (gridObserver) gridObserver.disconnect();
  gridObserver = new MutationObserver(() => semuaCollect());
  gridObserver.observe(semua.grid, { childList: true });
  semuaCollect(); /* paint awal sudah jalan sebelum hook ini */
}
function teardownSemua() {
  if (gridObserver) { gridObserver.disconnect(); gridObserver = null; }
  semua = null;
}

/* ============================================================
   CARI DI HALAMAN KATEGORI (P-08)
   Input kecil di bawah intro kategori; menyaring kartu grid
   yang sudah dirender (nama + deskripsi, substring) tanpa
   memuat ulang. Baris hitungan muncul hanya saat menyaring.
   ============================================================ */
function enhanceKategori() {
  const grid = document.getElementById('catGrid');
  if (!grid || document.getElementById('catSearch')) return;
  const anchor = document.getElementById('catIntro') || document.querySelector('#app .cat-head');
  if (!anchor) return;
  const total = $$('.tcard', grid).length;
  anchor.insertAdjacentHTML('afterend',
    `<div class="catsearch">
      <input id="catSearch" class="inp" type="search" placeholder="Cari di kategori ini" aria-label="Cari di kategori ini" autocomplete="off">
      <p class="catcount" id="catCount" aria-live="polite"></p>
    </div>`);
  const input = document.getElementById('catSearch');
  const countEl = document.getElementById('catCount');
  input.addEventListener('input', () => {
    /* P3 susulan (koordinator, 17 Nov): kartu yang display-nya
       diubah none->'' memutar ulang entrance tiap ketikan (sama
       seperti paint() #/semua — lihat pola fx-steady di app.js).
       Sekali pengguna mengetik, grid jadi "mantap": entrance
       pertama saat muat tetap ber-stagger, filter tidak berkedip. */
    grid.classList.add('fx-steady');
    const q = input.value.trim().toLowerCase();
    let shown = 0;
    $$('.tcard', grid).forEach((card) => {
      const hay = ((card.querySelector('.nm')?.textContent || '') + ' ' +
        (card.querySelector('.ds')?.textContent || '')).toLowerCase();
      const ok = !q || hay.includes(q);
      card.style.display = ok ? '' : 'none';
      if (ok) shown++;
    });
    countEl.textContent = q ? `${shown} dari ${total} tools` : '';
  });
}

/* ============================================================
   DAFTAR LOMPAT METODOLOGI (P-09)
   Chip dari article yang BENAR-BENAR dirender (bukan angka
   yang dihafal — jumlah entri METHOD pernah dicatat 11 di
   audit padahal file-nya 12). Klik chip memakai mekanisme
   anchor yang sudah ada di methodPage (#/metodologi#<id>).
   ============================================================ */
function enhanceMetodologi() {
  const articles = $$('#app article[id^="m-"]');
  if (!articles.length || document.querySelector('#app .jumpchips')) return;
  const chips = articles.map((a) => {
    const id = a.id.slice(2);
    const label = a.querySelector('h3')?.textContent.trim() || id;
    return `<a class="schip jumpchip" href="#/metodologi#${id}">${esc(label)}</a>`;
  }).join('');
  const parent = articles[0].parentElement;
  if (parent) {
    parent.insertAdjacentHTML('beforebegin',
      `<div class="jumpchips" role="navigation" aria-label="Lompat ke kalkulator">${chips}</div>`);
  }
}

/* ============================================================
   KELOLA FAVORIT + RIWAYAT (P-01, P-10) + CTA empty state
   Catatan: CTA "Cari tools" di empty state favorit dan teks
   "Belum ada yang tersimpan" SUDAH ADA di favPage (P2-B1) —
   yang ditambahkan di sini hanya baris kelola: "Hapus semua
   favorit" dan "Hapus riwayat", masing-masing dengan dialog
   konfirmasi (D-04). Tombol hanya tampil bila datanya ada —
   tombol yang tidak melakukan apa-apa adalah UI mati (R-26).
   ============================================================ */
function favEmptyHTML() {
  return `<div class="empty"><b>Belum ada favorit.</b><p>Ketuk ♥ di kartu tools buat nyimpen.</p><div class="sugx"><a class="schip" href="#/semua">Cari tools</a></div></div>`;
}
function renderFavManage() {
  const grid = document.getElementById('favGrid');
  if (!grid) return;
  document.querySelector('#app .favmanage')?.remove();
  const hasFav = getFav().length > 0;
  const hasHist = getRecent().length > 0;
  if (!hasFav && !hasHist) return;
  const btns = [];
  if (hasFav) btns.push('<button type="button" class="favmanage-btn" data-act="clear-fav">Hapus semua favorit</button>');
  if (hasHist) btns.push('<button type="button" class="favmanage-btn" data-act="clear-hist">Hapus riwayat</button>');
  grid.insertAdjacentHTML('afterend',
    `<div class="favmanage">${btns.join('<span class="favmanage-sep" aria-hidden="true">·</span>')}</div>`);
  const row = document.querySelector('#app .favmanage');
  row.addEventListener('click', async (e) => {
    const btn = e.target.closest('.favmanage-btn');
    if (!btn) return;
    if (btn.dataset.act === 'clear-fav') {
      const yes = await confirmDialog({
        title: 'Hapus semua favorit?',
        body: 'Favorit yang tersimpan di perangkat ini akan hilang. Riwayat kamu tidak ikut terhapus.',
        confirmLabel: 'Ya, hapus',
      });
      if (!yes) return;
      localStorage.removeItem(FKEY);
      /* perbarui DOM tanpa memuat ulang: grid kosong, tampilkan
         empty state + CTA, perbarui subjudul, bangun ulang baris. */
      grid.replaceChildren();
      const sub = document.querySelector('#app .csub');
      if (sub) sub.textContent = 'Belum ada yang tersimpan';
      grid.insertAdjacentHTML('afterend', favEmptyHTML());
      renderFavManage();
      sayToast('Semua favorit dihapus.');
    } else {
      const yes = await confirmDialog({
        title: 'Hapus semua riwayat?',
        body: 'Riwayat tools yang kamu buka akan hilang. Favorit kamu tidak ikut terhapus.',
        confirmLabel: 'Ya, hapus',
      });
      if (!yes) return;
      localStorage.removeItem(RKEY);
      renderFavManage();
      sayToast('Riwayat dihapus.');
    }
  });
}
function enhanceFavorit() {
  /* favPage dirender ulang oleh bindFav tiap toggle ♥ (bukan
     lewat route), jadi observer memasang ulang baris kelola
     bila grid diganti. renderFavManage idempotent: menghapus
     baris lama lalu membangun dari state saat ini. */
  renderFavManage();
  const app = document.getElementById('app');
  if (app && !routeObserver) {
    routeObserver = new MutationObserver(() => {
      if (!document.getElementById('favGrid')) return;
      /* baris hilang karena favPage render ulang → pasang lagi */
      if (!document.querySelector('#app .favmanage') && (getFav().length || getRecent().length)) {
        renderFavManage();
      }
    });
    routeObserver.observe(app, { childList: true, subtree: true });
  }
}

/* ============================================================
   HALAMAN TOOL: tombol coba lagi (E-04) + pindah chip "Balik ke"
   renderToolError dipakai catch toolPage di app.js.
   TEMUAN (terbukti Playwright 17 Nov 2026): impor chunk yang
   gagal karena jaringan TIDAK BISA diulang dalam halaman yang
   sama — Chromium mengingat kegagalan impor dinamis di module
   map dan menolak impor ulang URL yang sama TANPA mem-fetch
   lagi (fetch() biasa ke URL itu mengembalikan 200, import()
   tetap gagal). Satu-satunya retry yang benar-benar bekerja
   adalah muat ulang halaman (module map baru; hash #/t/<id>
   tetap, jadi pengunjung kembali ke tool yang sama). Karena
   itu callback retry di app.js adalah location.reload(),
   BUKAN toolPage(id) — memanggil toolPage lagi hanya
   menampilkan error yang sama (tombol mati).
   Chip "← Balik ke …" dipindah dari atas judul ke satu baris
   kecil di bawah kotak tool (riset §5.3.5.2); breadcrumb sudah
   mengambil alih fungsi "kembali" di atas.
   ============================================================ */
function renderToolError(box, retry) {
  box.innerHTML = `<div class="empty"><b>Gagal memuat.</b><p>Tool ini belum berhasil dimuat.</p><p><button type="button" class="allbtn" data-retry>Coba lagi</button></p></div>`;
  const btn = box.querySelector('[data-retry]');
  if (btn) btn.addEventListener('click', () => { btn.disabled = true; retry(); });
}
function enhanceTool() {
  const move = () => {
    const chip = document.getElementById('prevChip');
    if (!chip) return false;
    const a = chip.querySelector('a.back');
    if (!a) return false;
    const name = a.textContent.replace(/^\s*←\s*Balik ke\s*/, '').trim();
    const href = a.getAttribute('href') || '#/';
    const box = document.getElementById('toolbox');
    if (box && !document.querySelector('#app .prevline')) {
      box.insertAdjacentHTML('afterend',
        `<p class="prevline">← Balik ke <a href="${esc(href)}">${esc(name)}</a></p>`); /* redaksi
      "Terakhir dibuka:" dicabut 17 Nov (koordinator): V-08 P2-B1
      sudah menampilkan baris riwayat "Terakhir dibuka: A · B · C"
      — dua elemen dengan redaksi sama membingungkan. Chip ini
      kembali ke fungsi asalnya: navigasi balik ke tool sebelumnya. */
    }
    chip.replaceChildren();
    return true;
  };
  if (move()) return;
  /* chip diisi sesudah impor tool selesai (async) — tunggu. */
  if (!routeObserver) {
    routeObserver = new MutationObserver(() => {
      if (move() && routeObserver) { routeObserver.disconnect(); routeObserver = null; }
    });
    routeObserver.observe(document.getElementById('app'), { childList: true, subtree: true });
  }
}

/* ============================================================
   TITIK MASUK: dipanggil app.js
   enhanceRoute(name, params) — satu panggilan di route()
   sesudah view dirender. initComponents({openPalette, toast})
   — satu panggilan di boot, sebelum route() pertama.
   ============================================================ */
function enhanceRoute(routeName, params) {
  teardownSemua();
  if (routeObserver) { routeObserver.disconnect(); routeObserver = null; }
  closeDialog();
  closeDropdown(false);
  const app = document.getElementById('app');
  if (!app) return;
  renderNavbar(routeName);
  insertBreadcrumb(routeName, params);
  if (routeName === 'semua') { enhanceSemua(); enhanceRecentSearchesSemua(); }
  else if (routeName === 'kategori') enhanceKategori();
  else if (routeName === 'favorit') enhanceFavorit();
  else if (routeName === 'tool') enhanceTool();
  else if (routeName === 'metodologi') enhanceMetodologi();
}

function initComponents({ openPalette, toast } = {}) {
  if (typeof openPalette === 'function') shell.openPalette = openPalette;
  if (typeof toast === 'function') shell.toast = toast;
  if (booted) return;
  booted = true;
  initBackToTop();
  initPaletteObserver();
  /* klik di luar dropdown menutupnya (satu listener global). */
  document.addEventListener('click', (e) => {
    if (openDrop && !e.target.closest('.navdrop')) closeDropdown(false);
  });
  /* Esc: dialog dulu, lalu dropdown (fokus kembali ke tombol). */
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (currentDialog) { closeDialog(); return; }
    if (openDrop) closeDropdown(true);
  });
}

export {
  initComponents,
  enhanceRoute,
  openDialog,
  confirmDialog,
  closeDialog,
  renderToolError,
  /* fungsi murni — dites langsung di Node: */
  breadcrumbHTML,
  navbarHTML,
  recentSearchesHTML,
  cmpSemver,
  sortTools,
  popularOrderFromTerms,
  PAGE_SIZE,
};
