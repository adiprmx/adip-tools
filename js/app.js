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
   - Hero search: Enter -> #/semua?q=... (lompat otomatis 700ms
     DICABUT v6.22.0 S-U1, F-04: merebut ketikan di tengah pengguna
     masih merangkai kata; Enter sudah menangani niat eksplisit).

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
import { CATS, CAT_ICON, catLabel, byId, visibleTools, isNew, isOnline, COLLECTIONS, collectionById, NEXT, METHOD, METHOD_IDS, relatedTools, subgroupsFor } from './catalog.js';
import { getFav, isFav, toggleFav, getRecent, touchRecent, onStoreChange, lastSaveWasQuota, quotaHelp } from './store.js';
/* S-Q8 (v6.22.0, wiring S-U9 §5.1): salinan + pemulihan data global.
   Modul 100% lokal (tanpa jaringan); tombolnya di baris kelola
   Favorit (components.js renderFavManage), dialog kuota di bawah. */
import { downloadBackup } from './backup.js';
import { fetchPopularTerms, trackSearch, trackSearchDebounced } from './supabase.js';
import { hcardHTML, watchFadeX, footerHTML } from './shell-ui.js';
import { matchRoute, queryParam, resolveToolAlias } from './routes.js';
import { renderBaru, renderSpotlight, renderCatIntro, pickRandomTool, acakButtonHTML, greet, PH_EXAMPLES, startPlaceholderRotation, stopPlaceholderRotation, renderContinue, renderPopuler, renderRecent, afterFirstPaint } from './beranda.js';
import { isNewVisitor, maybeShowOnboarding, dismissOnboarding, showOnboardingAgain, heroProofHTML, mulaiDariSiniHTML, HERO_SUB } from './onboarding.js';
import { recentLineHTML, prevToolChip, catMoreLink } from './detail-riwayat.js';
import { initSeoShare, bindShareButtons, shareButtonHTML } from './seo-share.js';
import { rankedSearchPlus, assessQuery, suggestDidYouMean, getRecentSearches, addRecentSearch, removeRecentSearch } from './search-plus.js';
/* P2-B2 (v6.14.0): komponen UI hasil audit — navbar shell,
   breadcrumb, dialog, toolbar #/semua, dsb. (js/components.js).
   Satu-satunya titik sambung: initComponents di boot +
   enhanceRoute di route() + renderToolError di catch toolPage. */
import { initComponents, enhanceRoute, renderToolError, openDialog, fillCardDescs } from './components.js';
/* S-FIXUP (v6.22.0, F1): pemanas indeks penuh untuk deep-link ?q=
   + pendeteksi manifest ramping (lihat allPage). */
import { loadManifestDetails, needsDetails, onManifestDetails } from './manifest-boot.js';
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
   render ulang rail (fallback).
   S-U1 (v6.22.0, F-06 + handoff S-U4): status pengambilan ikut dicatat
   dan diteruskan ke renderPopuler, supaya rail bisa jujur soal
   sumbernya: 'live' = istilah dari Supabase, 'stale' = pengambilan
   gagal (respons tidak OK maupun galat jaringan) sehingga rail
   menampilkan fallback lokal + pesan "Populer tidak diperbarui.",
   'pending' = pengambilan belum selesai (render awal, tanpa pesan —
   menampilkan "tidak diperbarui" sebelum fetch selesai adalah klaim
   yang salah). */
let popularTerms = [];
let popularStatus = 'pending';
function sbFetchPopular() {
  fetchPopularTerms()
    .then((terms) => {
      if (terms) { popularTerms = terms; popularStatus = 'live'; renderPopuler(popularTerms, manifest, 'live'); }
      else { popularStatus = 'stale'; renderPopuler(popularTerms, manifest, 'stale'); }
    })
    .catch(() => { popularStatus = 'stale'; renderPopuler(popularTerms, manifest, 'stale'); });
}

/* Favorit + riwayat (getFav/isFav/toggleFav/getRecent/touchRecent)
   tinggal di store.js — format localStorage tidak berubah. */
let toastT;
function toast(msg, ms = 2200) {
  /* S-FIXUP (v6.22.0, F-Q5-01 + F-Q2-01): toast tinggal di
     document.body, BUKAN anak #app. Dulu favPage()/refreshFavPage()
     (app.innerHTML) menghapus elemen .toast dalam task yang sama
     sebelum paint, jadi toast restore + toast hapus-favorit tidak
     pernah terlihat. Pola ini MENIRU toast() core.js (satu elemen
     .toast bersama di body, position:fixed — tidak ada perubahan
     visual; CSS .toast tidak memakai selektor #app). Elemen yang
     sama dipakai ulang antar route; tidak ada kebocoran DOM. */
  let el = document.querySelector('.toast');
  if (!el) { el = document.createElement('div'); el.className = 'toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
  el.textContent = msg; el.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('show'), ms);
}
function bindFav(root) {
  root.querySelectorAll('.fav').forEach((b) => {
    b.addEventListener('click', (e) => {
      e.preventDefault(); e.stopPropagation();
      const id = b.dataset.id;
      /* S-F1 (v6.22.0, S-A11 F-01): klaim sukses HANYA bila tulis
         benar-benar tersimpan (toggleFav kembalikan { ok, added }).
         Bila gagal (kuota penuh): ikon/state DIBIARKAN apa adanya,
         toast jujur + saran konkret, dan JANGAN render ulang seksi
         favorit seolah ada yang berubah. Dulu: baca ulang state
         sesudah tulis gagal, tambah terbaca sebagai hapus + toast
         berbohong "Dihapus dari favorit". */
      const res = toggleFav(id);
      if (!res.ok) {
        /* S-Q8 (v6.22.0, wiring S-U9 §5.4): gagal karena kuota penuh
           -> dialog penyelamatan, bukan sekadar toast. Tombolnya
           mengunduh salinan (downloadBackup); openDialog menutup
           dialog dulu sebelum onClick jalan, jadi tidak perlu
           closeDialog eksplisit di sini. */
        if (lastSaveWasQuota()) {
          const help = quotaHelp();
          openDialog({
            title: 'Penyimpanan penuh',
            body: `<p>${T.esc(help.message)}</p>`,
            actions: [
              { label: 'Nanti', onClick: () => {} },
              { label: help.actionLabel, primary: true, onClick: () => downloadBackup() },
            ],
          });
          return;
        }
        toast(res.added
          ? 'Favorit tidak tersimpan, penyimpanan penuh, coba hapus sebagian data.'
          : 'Favorit tidak terhapus, penyimpanan penuh, coba hapus sebagian data.', 5000);
        return;
      }
      const on = res.added;
      b.classList.toggle('on', on);
      b.setAttribute('aria-label', on ? 'Hapus dari favorit' : 'Tambah ke favorit');
      b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop');
      toast(on ? 'Disimpan ke favorit.' : 'Dihapus dari favorit.'); /* copy FINAL TOAST-FAV-ADD/REMOVE (p1p2-copy.md §5) — "Masuk favorit" pra-P2 dicabut (P2-QA). */
      if (document.body.dataset.route === 'fav') refreshFavPage(); /* S-Q8: favPage() mentah menghapus navbar (temuan P1) */
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
let palEl = null, palItems = [], palSel = 0, palReturnFocus = null;
function closePalette() {
  if (!palEl) return;
  palEl.remove(); palEl = null; palItems = [];
  document.body.style.overflow = '';
  /* S-F10 (v6.22.0, A-01): kembalikan fokus ke pemicu — pola yang
     sama dengan closeDialog di components.js. Tanpa ini fokus
     jatuh ke body sesudah Esc (terukur). Bila tutupnya karena
     navigasi (klik opsi/Enter), route() akan memfokuskan H1
     sesudahnya, jadi kembalian ini tidak berebut. */
  const ret = palReturnFocus; palReturnFocus = null;
  if (ret && document.body.contains(ret) && typeof ret.focus === 'function') ret.focus();
  /* S-Q8 (v6.22.0, S-U3 §7.5): tab kembali mengikuti route kini. */
  syncTabActive();
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
  /* S-Q8 (v6.22.0): palet + lembar kategori saling menutup (tidak
     pernah dua lapis), dan pengantar ditutup dulu supaya backdrop-
     nya (z-onb 90) tidak mencegat klik palet (z-pal 80) — utang S-U1. */
  closeCatSheet();
  dismissOnboarding();
  setTabActive('search');
  palReturnFocus = document.activeElement;
  palEl = document.createElement('div');
  palEl.className = 'pal-wrap';
  palEl.innerHTML = `
    <div class="pal-backdrop"></div>
    <div class="pal" role="dialog" aria-modal="true" aria-label="Cari cepat">
      <div class="pal-bar">
        <span class="glyph">⌕</span>
        <input id="palQ" type="search" placeholder="Cari tools..." autocomplete="off" aria-label="Cari tools" role="combobox" aria-expanded="false" aria-controls="palList" aria-autocomplete="list">
        <kbd>esc</kbd>
      </div>
      <div class="pal-sug" id="palSug" role="status" style="display:none;padding:10px 14px 2px;font-size:13px;color:var(--mut);line-height:1.6"></div>
      <div class="pal-list" id="palList" role="listbox"></div>
      <div class="pal-hint"><span><kbd>↑↓</kbd>pindah</span><span><kbd>↵</kbd>buka</span><span><kbd>esc</kbd>tutup</span></div>
    </div>`;
  document.body.appendChild(palEl);
  document.body.style.overflow = 'hidden';
  const inp = palEl.querySelector('#palQ');
  const list = palEl.querySelector('#palList');
  palEl.querySelector('.pal-backdrop').addEventListener('click', closePalette);
  function paint(q) {
    /* S-U2 (v6.22.0): palet memakai assessQuery saat ada kueri, bukan
       rankedSearchPlus mentah — biayanya sama (satu scoreAll), tapi
       keyakinan + saran ikut terbaca. Tanpa ini palet menampilkan 10
       hasil fuzzy tanpa penanda, dan chip "Maksud kamu" hampir tak
       pernah muncul karena fuzzy hampir selalu menemukan hasil
       (S-F10 C-03). Kueri kosong tetap rankedSearchPlus('') —
       perilaku lama (Baru dibuka / Favorit + 10 teratas). */
    const a = q.trim() ? assessQuery(q, manifest, searchCtx()) : null;
    const res = a ? a.results : rankedSearchPlus(q, manifest, searchCtx());
    const sug = a && !a.confident ? a.suggestion : null;
    const sugEl = palEl.querySelector('#palSug');
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
    /* S-U2: saran "Maksud kamu" tampil DI ATAS hasil fuzzy saat kueri
       tidak yakin tapi ada saran — cermin cabang saran #/semua (S-F9).
       Wadahnya di luar #palList supaya listbox tetap berisi option
       saja; chipnya tombol biasa, ikut siklus Tab (trap S-F10). */
    if (sug && palItems.length) {
      sugEl.style.display = '';
      sugEl.innerHTML = `Maksud kamu: <button class="schip" data-sug="${T.esc(sug.id)}">${T.esc(sug.name)}</button>?`;
      sugEl.querySelector('[data-sug]').addEventListener('click', (e) => { touchRecent(e.target.dataset.sug); location.hash = '#/t/' + e.target.dataset.sug; closePalette(); });
    } else {
      sugEl.style.display = 'none';
      sugEl.innerHTML = '';
    }
    if (!palItems.length) {
      const sug0 = sug || (q.trim() ? suggestDidYouMean(q, manifest) : null);
      list.innerHTML = sug0
        ? `<div class="pal-empty">Tidak ketemu.<br>Maksud kamu: <button class="schip" data-sug="${T.esc(sug0.id)}">${T.esc(sug0.name)}</button>?</div>`
        : '<div class="pal-empty">Tidak ketemu.<br>Coba kata lain, mis. "kalkulator".</div>';
      /* S-F10 (v6.22.0, A-01): daftar kosong = tidak ada pilihan aktif. */
      inp.setAttribute('aria-expanded', 'false');
      inp.removeAttribute('aria-activedescendant');
      list.querySelector('[data-sug]')?.addEventListener('click', (e) => { touchRecent(e.target.dataset.sug); location.hash = '#/t/' + e.target.dataset.sug; closePalette(); });
      return;
    }
    palSel = 0;
    /* S-F10 (v6.22.0, A-07): tombol favorit adalah SAUDARA opsi,
       bukan anaknya — tombol di dalam role="option" adalah
       interaktif bersarang. .pal-item jadi pembungkus baris
       (sorot .act tetap di sini supaya seluruh baris menyala);
       .pal-opt adalah option-nya (id unik untuk
       aria-activedescendant). Catatan: option menjadi cucu
       listbox, bukan anak langsung — aria-activedescendant
       tetap mengarah lewat id, pola ini dipakai umum. */
    /* S-U1 (v6.22.0, handoff S-U6): hati palet yang belum favorit
       opacity 0.8 (bukan 0.6), selaras hati .fav pasca K-01. */
    html += palItems.map((m, i) => `
      <div class="pal-item${i === 0 ? ' act' : ''}" data-i="${i}">
        <div class="pal-opt" id="pal-opt-${i}" role="option" tabindex="-1" data-i="${i}" aria-selected="${i === 0 ? 'true' : 'false'}">
          <span class="pic">${T.esc(m.icon)}</span>
          <span class="ptx"><span class="pnm">${hiMark(m.name, q)}</span>
          <span class="pds">${T.esc(m.desc || '')}</span></span>
          <span class="pct">${catLabel(m.cat)}</span>
        </div>
        <button class="pal-fav" data-fid="${T.esc(m.id)}" aria-label="${isFav(m.id) ? 'Hapus dari favorit' : 'Tambah ke favorit'}" style="flex:none;width:44px;height:44px;border:0;background:none;cursor:pointer;font-size:18px;border-radius:8px;color:${isFav(m.id) ? 'var(--acc)' : 'var(--dim)'};opacity:${isFav(m.id) ? '1' : '0.8'}">♥</button>
      </div>`).join('');
    list.innerHTML = html;
    list.querySelectorAll('.pal-opt').forEach((b) => {
      b.addEventListener('click', () => { touchRecent(palItems[+b.dataset.i].id); location.hash = '#/t/' + palItems[+b.dataset.i].id; closePalette(); });
    });
    list.querySelectorAll('.pal-fav').forEach((b) => {
      b.addEventListener('click', (e) => {
        e.preventDefault(); e.stopPropagation();
        const id = b.dataset.fid;
        /* S-F1 (v6.22.0, S-A11 F-01): sama seperti bindFav — klaim
           sukses HANYA bila tulis benar-benar tersimpan; bila gagal,
           warna/ikon tombol DIBIARKAN apa adanya + toast jujur. */
        const res = toggleFav(id);
        if (!res.ok) {
          /* S-Q8 (v6.22.0, wiring S-U9 §5.4): dialog kuota yang sama
             seperti bindFav — gagal karena penuh menawarkan salinan. */
          if (lastSaveWasQuota()) {
            const help = quotaHelp();
            openDialog({
              title: 'Penyimpanan penuh',
              body: `<p>${T.esc(help.message)}</p>`,
              actions: [
                { label: 'Nanti', onClick: () => {} },
                { label: help.actionLabel, primary: true, onClick: () => downloadBackup() },
              ],
            });
            return;
          }
          toast(res.added
            ? 'Favorit tidak tersimpan, penyimpanan penuh, coba hapus sebagian data.'
            : 'Favorit tidak terhapus, penyimpanan penuh, coba hapus sebagian data.', 5000);
          return;
        }
        const on = res.added;
        b.style.color = on ? 'var(--acc)' : 'var(--dim)';
        b.style.opacity = on ? '1' : '0.8'; /* S-U1 (v6.22.0, handoff S-U6): 0.6 -> 0.8, selaras hati .fav (K-01: 3,62:1, lolos 3:1) */
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
    /* S-F10 (v6.22.0, A-01): kabarkan pilihan aktif ke screen
       reader lewat aria-activedescendant + aria-selected. */
    list.querySelectorAll('.pal-opt').forEach((o, i) => o.setAttribute('aria-selected', i === palSel ? 'true' : 'false'));
    if (palItems.length) {
      inp.setAttribute('aria-activedescendant', `pal-opt-${palSel}`);
      inp.setAttribute('aria-expanded', 'true');
    } else {
      inp.removeAttribute('aria-activedescendant');
      inp.setAttribute('aria-expanded', 'false');
    }
  }
  /* S-F9 (v6.22.0, S-A5 F2): debounce 150 ms, pola yang sama dengan
     #/semua (180 ms). Tanpa ini tiap ketikan = satu rankedSearchPlus
     penuh atas 1.262 tool. Timer di-clear tiap ketikan, jadi
     pencarian hanya jalan sesudah pengguna berhenti mengetik. */
  let palT;
  inp.addEventListener('input', () => {
    clearTimeout(palT);
    palT = setTimeout(() => { palT = null; paint(inp.value); }, 150);
  });
  inp.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); palSel = Math.min(palSel + 1, palItems.length - 1); scrollPal(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); palSel = Math.max(palSel - 1, 0); scrollPal(); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      /* S-FIXUP (v6.22.0, F-Q2-02): paint() me-reset palSel=0 — jalankan
         HANYA bila ada debounce yang tertunda (palT masih aktif).
         Bila daftar sudah settle, pakai palSel apa adanya supaya
         navigasi panah tidak sia-sia (dulu Enter selalu membuka
         hasil ke-0 apa pun posisi sorotan). */
      if (palT) {
        clearTimeout(palT);
        palT = null;
        paint(inp.value);
      }
      if (!palItems[palSel]) return;
      if (inp.value.trim()) addRecentSearch(inp.value.trim());
      const m = palItems[palSel];
      touchRecent(m.id);
      location.hash = '#/t/' + m.id;
      closePalette();
    }
  });
  /* S-F10 (v6.22.0, A-01): focus trap — Tab bersepeda di dalam
     palet, meniru pola openDialog di components.js. Daftar fokus
     dihitung tiap Tab karena isi daftar berubah tiap paint
     (debounce) + injeksi components.js (.rs-chip). Opsi .pal-opt
     (tabindex -1) sengaja tidak masuk urutan Tab: navigasi opsi
     memakai panah, bukan Tab. */
  palEl.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    const focusables = [...palEl.querySelectorAll('input, button')]
      .filter((el) => !el.disabled && el.offsetParent !== null);
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  paint('');
  setTimeout(() => inp.focus(), 30);
}

/* ---------------- lembar kategori (S-Q8, v6.22.0, S-U3 §7.3) ----------------
   Tab ke-4 "Kategori" membuka lembar 22 kategori — cermin dropdown
   Kategori desktop yang hanya ada ≥1024px. Pola yang sama dengan
   palet Cari: kerangka .pal-wrap/.pal yang sama, backdrop + Esc
   menutup, fokus kembali ke pemicu, aria-expanded di tombol.
   Barisnya memakai .drop-item yang sama dengan dropdown desktop
   (ikon + label + jumlah tool live dari manifest, bukan angka mati).
   Kategori aktif TIDAK ditandai coral di sini: lembar adalah jalan
   masuk, bukan penanda posisi (posisi ditandai tab bawah sendiri). */
let catEl = null, catReturnFocus = null;
function openCatSheet() {
  if (catEl) { closeCatSheet(); return; }
  closePalette();
  dismissOnboarding();
  catReturnFocus = document.activeElement;
  const cats = CATS.filter((c) => c[0] !== 'semua');
  catEl = document.createElement('div');
  catEl.className = 'pal-wrap catsheet';
  catEl.innerHTML = `
    <div class="pal-backdrop"></div>
    <div class="pal" role="dialog" aria-modal="true" aria-label="Kategori">
      <div class="pal-bar">
        <span class="glyph" aria-hidden="true">🧰</span>
        <span style="font-weight:700;font-size:15px;padding:15px 0">Kategori</span>
        <kbd>esc</kbd>
      </div>
      <div class="pal-list" id="catList">${cats.map(([id, label]) => {
        const cnt = manifest.filter((m) => m.cat === id).length;
        return `<a class="drop-item" href="#/k/${id}"><span class="di-ic" aria-hidden="true">${CAT_ICON[id] || '🧰'}</span><span class="di-lb">${T.esc(label)}</span><span class="di-n">${cnt}</span></a>`;
      }).join('')}</div>
    </div>`;
  document.body.appendChild(catEl);
  document.body.style.overflow = 'hidden';
  catEl.querySelector('.pal-backdrop').addEventListener('click', closeCatSheet);
  catEl.querySelectorAll('.drop-item').forEach((a) => a.addEventListener('click', closeCatSheet));
  /* Focus trap — pola yang sama dengan palet (S-F10 A-01): Tab
     bersepeda di dalam lembar, tidak jatuh ke halaman di belakang. */
  catEl.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    const focusables = [...catEl.querySelectorAll('a[href], button')]
      .filter((el) => !el.disabled && el.offsetParent !== null);
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  document.getElementById('tabKategori')?.setAttribute('aria-expanded', 'true');
  setTabActive('kategori');
}
function closeCatSheet() {
  if (!catEl) return;
  catEl.remove(); catEl = null;
  document.body.style.overflow = '';
  document.getElementById('tabKategori')?.setAttribute('aria-expanded', 'false');
  const ret = catReturnFocus; catReturnFocus = null;
  if (ret && document.body.contains(ret) && typeof ret.focus === 'function') ret.focus();
  /* S-Q8 (v6.22.0, S-U3 §7.5): tab kembali mengikuti route kini. */
  syncTabActive();
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
    <button class="tab" data-tab="kategori" id="tabKategori" aria-label="Kategori" aria-expanded="false"><span class="ti">🧰</span><span>Kategori</span></button>
    <a class="tab" data-tab="fav" href="#/favorit"><span class="ti">♥</span><span>Favorit</span></a>`;
  document.body.appendChild(nav);
  nav.querySelector('#tabSearch').addEventListener('click', openPalette);
  nav.querySelector('#tabKategori').addEventListener('click', openCatSheet);
  return nav;
}
function setTabActive(name) {
  const nav = ensureTabs();
  const ind = nav.querySelector('.tab-ind');
  nav.querySelectorAll('.tab').forEach((t) => t.classList.toggle('on', t.dataset.tab === name));
  const i = ['home', 'search', 'kategori', 'fav'].indexOf(name);
  if (i < 0) { ind.style.opacity = '0'; }
  else { ind.style.opacity = '1'; ind.style.transform = `translateX(${i * 100}%)`; }
}
/* S-Q8 (v6.22.0, S-U3 §7.5): turunkan tab aktif dari route kini —
   dipakai closePalette + closeCatSheet supaya tab kembali ke
   tempat pengguna berada (bukan ke tab terakhir yang dibuka).
   #/c/* + metodologi tetap null: tidak ada tab yang memilikinya. */
function syncTabActive() {
  const r = document.body.dataset.route;
  setTabActive(r === 'home' ? 'home' : r === 'semua' ? 'search' : (r === 'kategori' || r === 'tool') ? 'kategori' : r === 'fav' ? 'fav' : null);
}

/* ---------------- kartu ----------------
   hideCat (v6.14.0, V-05): di halaman kategori + Yang mirip, label
   kategori di kartu mubazir (semua kartu satu kategori) — sembunyikan
   labelnya, tapi badge BARU tetap tampil bila ada. */
function cardEl(m, hl, { hideCat = false } = {}) {
  /* S-F10 (v6.22.0, A-07): tautan dan tombol favorit adalah
     SAUDARA di dalam .tcard-wrap, bukan induk-anak — <button>
     di dalam <a> adalah interaktif bersarang (tidak valid,
     membingungkan screen reader + keyboard). Tombol diposisikan
     absolut oleh CSS (.tcard-wrap .fav), tampilan tidak berubah.
     Pemanggil yang mengumpulkan kartu (components.js) memakai
     .tcard-wrap; href/nama dibaca dari .tcard di dalamnya. */
  const wrap = document.createElement('div');
  wrap.className = 'tcard-wrap';
  /* S-Q8 (v6.22.0): min-width 0 pada item grid — tanpa ini lebar
     minimum konten kartu (pil kategori + lencana "Butuh internet")
     memaksa trek grid 2 kolom melebar dan halaman meluber 28px
     di 360px (G1 S-U2 gagal sebelum perbaikan ini). .tcard sendiri
     sudah punya min-width 0; pembungkusnya yang belum. Pil
     membungkus ke 2 baris di kartu sempit, tetap di dalam kartu. */
  wrap.style.minWidth = '0';
  const a = document.createElement('a');
  a.className = 'tcard glass';
  a.href = '#/t/' + m.id;
  a.setAttribute('aria-label', m.name);
  const fav = isFav(m.id);
  const newBadge = isNew(m) ? `<span class="newb" style="color:var(--txt);border:1px solid rgba(255,255,255,.35);background:rgba(255,255,255,.06);border-radius:999px;padding:2px 7px${hideCat ? '' : ';margin-left:6px'}">BARU</span>` : '';
  /* S-Q8 (v6.22.0, konsumsi flag S-U8 §6.1): tool yang butuh
     jaringan memakai lencana "Butuh internet" — pil redup yang
     sama bahasanya dengan BARU, tanpa warna baru. Tool tanpa
     flag tidak memakai lencana: absennya flag sudah berarti
     bisa dipakai offline, dan 974 lencana "bisa offline" hanya
     jadi kebisingan. Lencana tidak terbelah antar baris
     (white-space:nowrap); pil .ct dibatasi max-width:100% —
     tanpa itu pil satu baris "Produktivitas + lencana" melebar
     163px di kartu 133px dan meluberkan halaman koleksi 2px
     di 360px (pil adalah flex-start di kolom flex, lebarnya
     tidak dijepit wadahnya). Lencana inline-block (bukan
     inline): tanpa spasi antara label dan lencana, keduanya
     satu gugus tak terbelah — inline + nowrap membuat lencana
     meluber 59px keluar pil. Inline-block memberi titik belah
     sebelum lencana sehingga ia pindah utuh ke baris 2. */
  const beforeBadge = (hideCat ? '' : catLabel(m.cat)) + newBadge;
  const onlineBadge = isOnline(m) ? `<span class="netb" style="display:inline-block;color:var(--mut);border:1px solid rgba(255,255,255,.22);background:rgba(255,255,255,.04);border-radius:999px;padding:2px 7px;white-space:nowrap${beforeBadge ? ';margin-left:6px' : ''}">Butuh internet</span>` : '';
  const ctInner = beforeBadge + onlineBadge;
  a.innerHTML = `
    <span class="tic" aria-hidden="true">${T.esc(m.icon)}</span>
    <span class="nm">${hl ? hiMark(m.name, hl) : T.esc(m.name)}</span>
    <span class="ds">${T.esc(m.desc || '')}</span>
    ${ctInner ? `<span class="ct" style="max-width:100%">${ctInner}</span>` : ''}`;
  const btn = document.createElement('button');
  btn.className = `fav${fav ? ' on' : ''}`;
  btn.dataset.id = m.id;
  btn.setAttribute('aria-label', fav ? 'Hapus dari favorit' : 'Tambah ke favorit');
  btn.textContent = '♥';
  a.addEventListener('click', () => touchRecent(m.id));
  wrap.append(a, btn);
  bindFav(wrap);
  return wrap;
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
  /* S-U1 (v6.22.0, F-04): lompat otomatis 700ms DICABUT — mengetik
     lalu diam 700ms dulu memindahkan halaman sendiri ke #/semua di
     tengah pengguna masih merangkai kata. Enter di bawah sudah
     menangani niat eksplisit; tidak ada jalan kedua yang berebut. */
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
  renderBaru(document.getElementById('baruSec'), manifest, VERSION);
  renderRecent();
  /* S-F9 (v6.22.0, S-A5 F1): Populer + Spotlight JANGAN jalan sinkron
     di sini lagi. renderPopuler menjalankan 6x rankedSearchPlus
     sebelum konten pertama (warm ~1-1,4 dtk, dingin ~1,3-4,7 dtk di
     VM ukur) dan pilihSpotlight memindai manifest 84x. Keduanya
     ditunda sampai sesudah paint pertama (afterFirstPaint: dua rAF
     + requestIdleCallback), jadi beranda tampil dulu, rail Populer
     dan Spotlight menyusul. renderBaru/renderRecent/renderContinue
     tetap sinkron: ketiganya cuma filter/ambil dari store (<5 ms). */
  afterFirstPaint(() => {
    renderPopuler(popularTerms, manifest, popularStatus);
    renderSpotlight(document.getElementById('spotSec'), manifest);
    /* S-FIXUP F3 (v6.22.0): kartu favorit beranda di-paint sinkron
       saat manifest masih ramping, jadi .ds-nya kosong — dan tidak
       ada yang mengisinya (home sengaja skip ensureDetailsForCards
       demi boot cepat, S-U5). Berlangganan merge detail (TANPA
       memicu fetch — pemicunya tetap rail di atas, sesuai
       keputusan S-U5) lalu isi .ds yang masih kosong di tempat,
       tanpa render ulang (posisi/status favorit tidak terganggu).
       Dijaga route: bila pengunjung sudah pindah, rute tujuan
       punya ensureDetailsForCards-nya sendiri. */
    onManifestDetails(() => {
      if (document.body.dataset.route === 'home') fillCardDescs();
    });
  });
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
  setTabActive('search'); /* S-Q8 (v6.22.0, S-U3 §7.5): halaman hasil pencarian — satu alur dengan palet Cari. */
  document.title = 'Semua tools - ADIP Tools';
  const n = manifest.length;
  const app = document.getElementById('app');
  /* chip filter: gaya meniru .schip (token yang sama), tanpa sentuh CSS.
     Chip hanya muncul bila ada tool baru, supaya tidak jadi tombol mati. */
  const hasNew = manifest.some(isNew);
  /* B-05 (v6.14.0, P2-B1): chip 38px -> min-height 44px (R-03).
     .fchip di upgrade-612.css ikut diupdate — inline menang.
     S-F1 (v6.22.0, S-A6 F-01): CHIP_ON pakai coral (var(--acc-line) /
     var(--acc-soft)), BUKAN putih — inline menang atas CSS, jadi
     nilai coral di sinilah yang tampil. Catatan: aturan CSS
     .fchip[aria-pressed="true"] di upgrade-612.css masih putih;
     file CSS itu bukan milik batch ini, dicatat sebagai utang
     (bila inline dicabut nanti, CSS itu yang harus ikut coral). */
  const CHIP = 'font:inherit;font-size:13px;font-weight:600;color:var(--mut);cursor:pointer;border:1px solid var(--line-ui);border-radius:999px;padding:8px 14px;background:var(--surface);min-height:44px';
  const CHIP_ON = 'font:inherit;font-size:13px;font-weight:600;color:var(--txt);cursor:pointer;border:1px solid var(--acc-line);border-radius:999px;padding:8px 14px;background:var(--acc-soft);min-height:44px';
  let filter = 'all';
  /* S-U2 (v6.22.0): filter offline adalah TOGGLE terpisah, bukan opsi
     radio keempat — ia berpotongan dengan Semua/Terbaru/Favorit
     (mis. Terbaru + Bisa offline), jadi tidak masuk `filter`. */
  let offlineOnly = false;
  app.innerHTML = `
  <div class="wrap view">
    <a class="back" href="#/">← Beranda</a>
    <h1 class="pagetitle rise" style="--i:0">Semua tools</h1>
    <div class="hsearch glass rise" style="--i:1">
      <span class="glyph" aria-hidden="true">⌕</span>
      <input id="aq" type="search" placeholder="Cari ${n} tools..." value="${T.esc(q)}" autocomplete="off" aria-label="Cari semua tools">
    </div>
    <div class="fchips" style="display:flex;flex-wrap:wrap;gap:8px;margin-top:14px" role="group" aria-label="Filter tools">
      <button class="fchip" data-f="all" aria-pressed="true" style="${CHIP_ON}">Semua</button>
      ${hasNew ? `<button class="fchip" data-f="new" aria-pressed="false" style="${CHIP}">Terbaru</button>` : ''}
      <button class="fchip" data-f="fav" aria-pressed="false" style="${CHIP}">♥ Favorit</button>
      <button class="fchip" id="offChip" aria-pressed="false" style="${CHIP}">Bisa offline</button>
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
  /* S-U2 (v6.22.0): satu sumber tampilan chip — dipakai klik chip
     maupun tombol aksi di empty state (yang melonggarkan filter). */
  const syncChips = () => {
    app.querySelectorAll('.fchip[data-f]').forEach((c) => {
      const on = c.dataset.f === filter;
      c.style.cssText = on ? CHIP_ON : CHIP;
      c.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    const off = app.querySelector('#offChip');
    if (off) {
      off.style.cssText = offlineOnly ? CHIP_ON : CHIP;
      off.setAttribute('aria-pressed', offlineOnly ? 'true' : 'false');
    }
  };
  /* S-U2: daftar hasil dari state saat ini (kueri + radio + offline) —
     dipakai paint() dan pemulih label saat kembali ke "Semua kategori"
     (lihat handler klik .cat-chip di bawah). */
  const computeList = (qq) => {
    const ql = qq.trim();
    const a = ql ? assessQuery(ql, manifest, searchCtx()) : null;
    let list = a ? a.results : visibleTools();
    if (filter === 'new') list = list.filter(isNew);
    if (filter === 'fav') {
      const favIds = new Set(getFav().map((x) => x.id));
      list = list.filter((m) => favIds.has(m.id));
    }
    /* Filter "Bisa offline" — tool tanpa flag `online` dianggap bisa
       offline (kontrak defensif catalog.isOnline, flag dari S-U8).
       Filter ini berpotongan dengan radio di atas + kategori/sortir
       components.js (yang bekerja di atas kartu hasil paint ini). */
    if (offlineOnly) list = list.filter((m) => !isOnline(m));
    /* B-01 (v6.14.0, P2-B1): bila kueri tidak yakin + tanpa saran +
       tanpa kecocokan persis, yang tampil adalah state kosong —
       label harus "0 hasil", bukan jumlah hasil fuzzy (24) yang
       tidak jadi ditampilkan. */
    const noResults = Boolean(a && !a.confident && !a.suggestion && !a.topExact);
    return { ql, a, list, noResults };
  };
  const paint = (qq) => {
    /* Mulai paint ke-2, grid jadi "mantap" (.tgrid.fx-steady di
       fx-p3.css): kartu tidak memutar ulang stagger 48 kartu tiap
       ketikan (debounce 180ms) atau ganti filter — itu kedip,
       bukan umpan balik. Hitungan "N hasil" sudah mengabarkan
       perubahan. Load-more (components.js) ikut tenang. */
    if (paints++ > 0) grid.classList.add('fx-steady');
    const { ql, a, list, noResults } = computeList(qq);
    count.parentElement.querySelector('.sug-hint')?.remove();
    grid.innerHTML = '';
    if (noResults) {
      count.textContent = '0 hasil';
      grid.innerHTML = `<div class="empty" style="grid-column:1/-1"><b>Tidak ada tool yang pas untuk "${T.esc(ql)}".</b><p>Coba kata lain, mis. "kalkulator".</p>
        <div class="sugx">${['kalkulator', 'qr', 'weton'].map((s) => `<button class="schip">${s}</button>`).join('')}</div></div>`;
      grid.querySelectorAll('.schip').forEach((b) => b.addEventListener('click', () => { inp.value = b.textContent; paint(inp.value); }));
      return;
    }
    if (!list.length) {
      /* S-U2: empty state jujur per kombinasi filter. Judul menyebut
         filter yang aktif (bukan "Tidak ketemu" generik yang
         menyembunyikan bahwa kuerinya sebenarnya ada hasilnya),
         dan tombol aksi melonggarkan filter yang paling mungkin
         jadi penyebab — offline dulu, baru filter radio — sambil
         mempertahankan kueri. Label hitungan memakai format yang
         sama dengan cabang B-01 ("0 hasil untuk ..."). */
      count.textContent = ql ? `0 hasil untuk "${ql}"` : '0 tools';
      if (filter === 'fav' && !ql && !offlineOnly) {
        grid.innerHTML = `<div class="empty" style="grid-column:1/-1"><b>Belum ada favorit.</b><p>Ketuk ♥ di kartu tools buat nyimpen.</p></div>`;
        return;
      }
      let title, body;
      if (offlineOnly && filter === 'new') {
        title = ql ? `Tidak ada tool baru yang bisa dipakai offline untuk "${T.esc(ql)}".` : 'Tidak ada tool baru yang bisa dipakai offline.';
        body = 'Coba matikan filter offline, atau cari dengan kata lain.';
      } else if (offlineOnly && filter === 'fav') {
        title = ql ? `Tidak ada favorit yang bisa dipakai offline untuk "${T.esc(ql)}".` : 'Tidak ada favorit yang bisa dipakai offline.';
        body = 'Favorit kamu yang cocok mungkin butuh internet.';
      } else if (offlineOnly) {
        title = ql ? `Tidak ada tool yang bisa dipakai offline untuk "${T.esc(ql)}".` : 'Tidak ada tool yang bisa dipakai offline.';
        body = 'Tool yang cocok mungkin butuh internet.';
      } else if (filter === 'new') {
        title = ql ? `Tidak ada tool baru yang pas untuk "${T.esc(ql)}".` : 'Belum ada tool baru di versi ini.';
        body = 'Coba matikan filter Terbaru, atau cari dengan kata lain.';
      } else if (filter === 'fav') {
        title = `Tidak ada favorit yang pas untuk "${T.esc(ql)}".`;
        body = 'Coba matikan filter Favorit, atau cari dengan kata lain.';
      } else {
        title = 'Tidak ketemu.';
        body = 'Coba kata lain, mis. "kalkulator".';
      }
      /* Bila ada saran nama terdekat, tawarkan sebagai jalan pintas —
         kasus ini hanya terjadi saat hasil fuzzy 0 tapi saran ada
         (cabang noResults di atas sudah menangani tanpa-saran). */
      const sugLine = a && a.suggestion
        ? `<p style="margin-top:10px">Maksud kamu: <button class="schip" data-sug="${a.suggestion.id}">${T.esc(a.suggestion.name)}</button>?</p>` : '';
      const action = offlineOnly
        ? { label: 'Tampilkan yang butuh internet juga', run: () => { offlineOnly = false; } }
        : (filter !== 'all'
          ? { label: 'Tampilkan semua hasil', run: () => { filter = 'all'; } }
          : null);
      const actionLine = action ? `<div class="sugx"><button class="schip" data-clear-filter>${action.label}</button></div>` : '';
      const genericChips = !action && !sugLine
        ? `<div class="sugx">${['kalkulator', 'qr', 'weton'].map((s) => `<button class="schip">${s}</button>`).join('')}</div>` : '';
      grid.innerHTML = `<div class="empty" style="grid-column:1/-1"><b>${title}</b><p>${body}</p>${sugLine}${actionLine}${genericChips}</div>`;
      grid.querySelector('[data-sug]')?.addEventListener('click', (e) => { location.hash = '#/t/' + e.target.dataset.sug; });
      grid.querySelector('[data-clear-filter]')?.addEventListener('click', () => { action.run(); syncChips(); paint(inp.value); });
      grid.querySelectorAll('.sugx .schip:not([data-clear-filter])').forEach((b) => b.addEventListener('click', () => { inp.value = b.textContent; paint(inp.value); }));
      return;
    }
    count.textContent = ql ? `${list.length} hasil` : `${list.length} tools`;
    if (a && !a.confident && a.suggestion) {
      /* S-F9 (v6.22.0, utang S-F3 §5 butir 2): kueri tidak yakin tapi
         ada saran. Dulu labelnya "N hasil" seolah 24 hasil fuzzy itu
         jawaban yang cocok, padahal belum tentu. Dipilih label jujur
         (bukan sembunyikan grid): chip saran tetap jalan pintas
         utama, tapi hitungan jadi "N hasil mirip" + catatan bahwa
         hasil di bawah cuma mirip-mirip. Grid disembunyikan hanya
         bila tidak ada saran sama sekali (cabang noResults di atas),
         supaya hasil fuzzy yang kebetulan tepat tetap bisa dibuka. */
      count.textContent = `${list.length} hasil mirip`;
      count.insertAdjacentHTML('afterend', `<p class="sug-hint" style="margin:8px 0 0;font-size:13px;color:var(--mut)">Maksud kamu: <button class="schip" data-sug="${a.suggestion.id}">${T.esc(a.suggestion.name)}</button>? Hasil di bawah ini cuma mirip-mirip, belum tentu yang kamu cari.</p>`);
      count.parentElement.querySelector('[data-sug]').addEventListener('click', (e) => { location.hash = '#/t/' + e.target.dataset.sug; });
    }
    list.forEach((m) => grid.appendChild(cardEl(m, ql || null)));
  };
  let t;
  inp.addEventListener('input', () => {
    clearTimeout(t);
    syncHistoryEmpty();
    t = setTimeout(() => { if (inp.value.trim()) trackSearchDebounced(inp.value.trim()); paint(inp.value); }, 180);
  });
  inp.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && inp.value.trim()) { addRecentSearch(inp.value.trim()); trackSearch(inp.value.trim()); }
    /* S-U2: panah bawah dari kotak cari masuk ke kartu pertama. */
    else if (e.key === 'ArrowDown') {
      const first = grid.querySelector('.tcard');
      if (first) { e.preventDefault(); first.focus(); }
    }
  });
  /* S-U2: navigasi keyboard di hasil — panah atas/bawah pindah antar
     kartu, Esc kembali ke kotak cari. Enter pada kartu sudah jalan
     sendiri (kartu adalah tautan). Cincin fokus coral berasal dari
     :focus-visible yang sudah dipasang S-F10 — tidak diduplikasi.
     Panah dihitung dari .tcard-wrap yang ADA di DOM (components.js
     hanya memasang 48 kartu terlihat; sisanya belum di DOM, jadi
     panah tidak pernah mendarat di kartu yang tidak tampil). */
  grid.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp' && e.key !== 'Escape') return;
    if (e.key === 'Escape') { inp.focus(); return; }
    const wraps = [...grid.querySelectorAll('.tcard-wrap')];
    if (!wraps.length) return;
    const cur = e.target.closest('.tcard-wrap');
    const i = cur ? wraps.indexOf(cur) : -1;
    e.preventDefault();
    if (e.key === 'ArrowDown') {
      const next = i < 0 ? 0 : Math.min(i + 1, wraps.length - 1);
      wraps[next].querySelector('.tcard')?.focus();
    } else if (i <= 0) {
      inp.focus();
    } else {
      wraps[i - 1].querySelector('.tcard')?.focus();
    }
  });
  const chips = app.querySelectorAll('.fchip[data-f]');
  chips.forEach((b) => b.addEventListener('click', () => {
    filter = b.dataset.f;
    syncChips();
    paint(inp.value);
  }));
  app.querySelector('#offChip')?.addEventListener('click', () => {
    offlineOnly = !offlineOnly;
    syncChips();
    paint(inp.value);
  });
  /* S-Q8 (v6.22.0): jembatan S-U2 "pulihkan label hitungan" DICABUT
     — perbaikan permanen S-U5 sudah mendarat (semuaRender memulihkan
     paintCountLabel, components.js; terverifikasi skrip S-U2 tanpa
     jembatan, lihat laporan S-Q8). */
  /* S-FIXUP F1 (v6.22.0): deep-link ?q= JANGAN di-paint dari indeks
     nama-saja (boot manifest) — "weton" jadi "Kalkulator Baja"
     + saran yang salah (temuan S-Q4 F1). Bila kueri ada dan detail
     belum menempel, tunjukkan status "Mencari…" lalu paint sesudah
     details merge (~200-800 ms). Bila detail gagal dimuat, paint
     tetap jalan dengan indeks nama-saja — hasil seadanya lebih
     baik dari halaman yang diam. Paint memakai inp.value saat itu
     (bukan q awal) supaya ketikan selama pemanasan tidak tertimpa;
     penjaga route + isConnected mencegah paint ke DOM yang sudah
     ditinggalkan. Kotak interim memakai .empty supaya semuaCollect
     (components.js) tidak menimpanya dengan kotak "tidak cocok". */
  if (q.trim() && needsDetails(manifest)) {
    count.textContent = 'Mencari…';
    grid.innerHTML = `<div class="empty" style="grid-column:1/-1"><b>Mencari…</b><p>Hasil pencarian sedang dimuat.</p></div>`;
    loadManifestDetails().then(() => {
      if (document.body.dataset.route !== 'semua' || !grid.isConnected) return;
      paint(inp.value);
    });
  } else {
    paint(q);
  }
  /* Baris kosong riwayat ("Belum ada pencarian tersimpan.") hanya bisa
     diputuskan sesudah enhanceRoute memasang chip riwayat — dijadwalkan
     satu tick sesudah render (lihat syncHistoryEmpty). */
  setTimeout(syncHistoryEmpty, 0);
}

/* ---------------- VIEW: kategori penuh (#/k/<id>) ---------------- */
function catPage(id) {
  const cat = CATS.find((c) => c[0] === id && id !== 'semua');
  const app = document.getElementById('app');
  if (!cat) { location.hash = '#/'; return; }
  document.body.dataset.route = 'kategori';
  setTabActive('kategori'); /* S-Q8 (v6.22.0, S-U3 §7.5): halaman ini ADALAH kategori. */
  document.title = cat[1] + ' - ADIP Tools';
  const n = manifest.length;
  const tools = visibleTools().filter((m) => m.cat === id);
  app.innerHTML = `
  <div class="wrap view">
    <a class="back" href="#/">← Beranda</a>
    <div class="cat-head rise" style="--i:0">
      <span class="ctic" aria-hidden="true">${CAT_ICON[id] || '🧰'}</span>
      <div><h1>${cat[1]}</h1><p class="csub">${tools.length} tools</p></div>
    </div>
    <div id="catIntro"></div>
    <div class="tgrid" id="catGrid"></div>
    ${footerHTML(n)}
  </div>`;
  const grid = app.querySelector('#catGrid');
  const groups = subgroupsFor(id);
  if (!groups) {
    tools.forEach((m) => grid.appendChild(cardEl(m, null, { hideCat: true })));
  } else {
    /* S-Q8 (v6.22.0, rendering S-U3 §7.2): kategori besar dibagi
       subgrup berjudul + jumlah. #catGrid kehilangan kelas tgrid
       supaya tiap <section> menumpuk vertikal (bukan jadi sel
       grid); tiap subgrup punya .tgrid-nya sendiri. Satu tool
       muncul sekali — SUBGROUP_OVERLAPS hanya dicatat, tidak
       digandakan tampilannya. */
    grid.classList.remove('tgrid');
    grid.classList.add('grouped');
    /* Jangkar lompat: TOMBOL (bukan tautan) — route #/k/ tidak
       punya stripAnchor (routes.js, bukan milik S-Q8), jadi
       href #sg-* akan dibaca sebagai id kategori dan melempar
       ke beranda. Tombol menggulir langsung tanpa ubah hash. */
    const jump = document.createElement('div');
    jump.className = 'jumpchips';
    jump.setAttribute('role', 'navigation');
    jump.setAttribute('aria-label', 'Lompat ke subgrup');
    jump.innerHTML = groups.map((g) => `<button class="schip jumpchip" type="button" data-sg="${T.esc(g.id)}">${T.esc(g.label)}</button>`).join('');
    jump.querySelectorAll('[data-sg]').forEach((b) => b.addEventListener('click', () => {
      document.getElementById('sg-' + b.dataset.sg)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }));
    grid.appendChild(jump);
    for (const g of groups) {
      const sec = document.createElement('section');
      sec.className = 'sec';
      sec.id = `sg-${g.id}`;
      sec.style.scrollMarginTop = '16px';
      sec.innerHTML = `<div class="sechead"><h2>${T.esc(g.label)}</h2><span class="csub">${g.tools.length} tools</span></div><div class="tgrid"></div>`;
      const sg = sec.querySelector('.tgrid');
      g.tools.map(byId).filter(Boolean)
        .forEach((m) => sg.appendChild(cardEl(m, null, { hideCat: true })));
      grid.appendChild(sec);
    }
  }
  renderCatIntro(document.getElementById('catIntro'), id, manifest);
}

/* ---------------- FAVORIT ---------------- */
/* S-Q8 (v6.22.0, temuan P1 — bug pra-ada): me-render ulang halaman
   Favorit DI LUAR route() WAJIB lewat helper ini, bukan favPage()
   mentah. favPage() mengganti seluruh #app — navbar + breadcrumb
   (yang dipasang enhanceRoute) ikut terhapus. route() memanggil
   enhanceRoute sesudah view, tapi pemanggil langsung (bindFav,
   onStoreChange, onBackupRestored) tidak — akibatnya navbar
   MENGHILANG sesudah ketuk ♥ di #/favorit (terbukti tes P1:
   header.top 1 → 0). Helper ini memulihkan chrome-nya. */
function refreshFavPage() {
  favPage();
  enhanceRoute('favorit', {});
}
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
      <div><h1>Favorit</h1><p class="csub">${favs.length ? `${favs.length} tersimpan di perangkat ini` : 'Belum ada yang tersimpan'}</p></div>
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
      <div><h1>${T.esc(col.name)}</h1><p class="csub">${tools.length} tools</p></div>
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
    <h1 class="pagetitle rise" style="--i:0">Metodologi</h1>
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
          <a href="#/t/${T.esc(m.id)}" style="margin-left:auto;font-size:12.5px;white-space:nowrap;display:inline-flex;align-items:center;min-height:44px">Buka tool →</a>
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
    setTabActive('kategori'); /* S-Q8 (v6.22.0, S-U3 §7.5): halaman "tidak ditemukan" tetap di bawah payung kategori. */
    document.title = 'Tidak ditemukan - ADIP Tools';
    /* S-FIXUP F5+F12 (v6.22.0): judul halaman ini h1 (dulu tanpa
       heading sama sekali — hanya <b>), dan tautan "← Beranda"
       pindah ke ATAS kotak error supaya breadcrumb yang
       menggantikannya tampil di atas seperti halaman lain (dulu
       breadcrumb jatuh di bawah kotak). */
    app.innerHTML = `<div class="wrap view"><a class="back" href="#/">← Beranda</a><div class="empty"><h1>Tools tidak ditemukan.</h1>
      <p>Mungkin alamatnya berubah.</p>
      <div class="sugx"><a class="schip" href="#/">Cari tools</a><a class="schip" href="#/semua">Lihat semua tools</a></div></div>${footerHTML(manifest.length)}</div>`;
    return;
  }
  setTabActive('kategori'); /* S-Q8 (v6.22.0, S-U3 §7.5): tool berada di dalam satu kategori. */
  document.title = m.name + ' - ADIP Tools';
  window.scrollTo(0, 0);
  /* S-Q8 (v6.22.0, konsumsi flag S-U8 §6): lencana + peringatan
     di kepala halaman tool. Tanggal dataValidUntil yang lewat
     = peringatan saja, TIDAK PERNAH memblokir tool. */
  const todayStr = new Date().toISOString().slice(0, 10);
  const dataExpired = Boolean(m.dataValidUntil && m.dataValidUntil < todayStr);
  const toolOnlineBadge = isOnline(m) ? `<span class="netb" style="font-size:10.5px;font-weight:700;letter-spacing:0.09em;text-transform:uppercase;color:var(--mut);border:1px solid rgba(255,255,255,.22);background:rgba(255,255,255,.04);border-radius:var(--r-pill);padding:4px 11px">Butuh internet</span>` : '';
  const toolWarns = [
    (m.online && typeof navigator !== 'undefined' && !navigator.onLine)
      ? 'Tool ini butuh internet. Cek koneksimu lalu coba lagi.' : '',
    dataExpired
      ? `Tarif acuan di tool ini sudah lewat tanggal berlakunya (${m.dataValidUntil}). Hasilnya mungkin tidak akurat lagi.` : '',
  ].filter(Boolean).map((w) => `<p class="toolwarn" style="font-size:13px;line-height:1.55;color:var(--mut);margin:0">${T.esc(w)}</p>`).join('');
  app.innerHTML = `
  <div class="wrap narrow view">
    <a class="back" href="#/">← Beranda</a><span id="prevChip"></span>
    <div class="tool-head">
      <div class="th-top">
        <span class="tic" aria-hidden="true">${T.esc(m.icon)}</span>
        <div class="th">
          <h1>${T.esc(m.name)}</h1>
        </div>
        <div class="tacts"><button class="fav icobtn${isFav(m.id) ? ' on' : ''}" data-id="${T.esc(m.id)}" aria-label="${isFav(m.id) ? 'Hapus dari favorit' : 'Tambah ke favorit'}">♥</button>${shareButtonHTML(m)}</div>
      </div>
      <div class="meta">
        <span style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><span class="tag">${catLabel(m.cat)}</span>${toolOnlineBadge}</span>
        <span class="ds">${T.esc(m.desc || '')}</span>
        ${toolWarns}
      </div>
    </div>
    <div class="tool glass" id="toolbox"><div class="skel" role="status" aria-label="Memuat tool"><span class="sk-line w45"></span><span class="sk-line h-inp"></span><span class="sk-line w70"></span><span class="sk-line h-inp"></span><span class="sk-line h-area"></span></div></div>
    <div id="methLink"></div>
    <div id="nextSec"></div>
    <div class="related">
      <div class="sechead"><h2>Yang mirip</h2></div>
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
  /* S-Q8 (v6.22.0, wiring S-U3 §7.1): "Yang mirip" memakai
     relatedTools — NEXT kurasi dulu, lalu skor token, lalu
     pengisi satu kategori. Bukan lagi 4 alfabetis pertama.
     Jumlah kartu tetap maks 4 (bisa kurang; JANGAN diisi paksa). */
  const grid = document.getElementById('relGrid');
  if (grid) {
    relatedTools(m.id, 4)
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
    methHost.innerHTML = `<a href="#/metodologi#${T.esc(m.id)}" style="display:flex;align-items:center;min-height:44px;margin-top:14px;font-size:13px;color:var(--mut)">📖 Cara hitungnya: lihat rumus, asumsi &amp; batasannya di halaman Metodologi →</a>`;
  }
  /* V-08 (v6.14.0, P2-B1): riwayat di halaman tool bukan lagi
     carousel ketiga — satu baris teks "Terakhir dibuka: A · B · C"
     di bawah Yang mirip (§5.3.5.3). */
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
/* S-U1 (v6.22.0, F-03): error boundary tingkat halaman. Bila render
   view gagal (modul/manifest bermasalah, bug render), pengguna
   melihat pesan + tombol muat ulang, bukan halaman putih. Pola
   renderToolError (components.js) untuk halaman tool; bedanya di
   sini wadahnya #app dan tidak ada "coba lagi" tanpa reload —
   impor modul yang gagal tidak bisa diulang dalam halaman yang
   sama (alasan yang sama seperti di toolPage). */
function renderBootError(app, err) {
  console.error('[ADIP Tools] render gagal:', err);
  if (!app) return;
  document.title = 'Tidak bisa dimuat - ADIP Tools';
  app.innerHTML = `<div class="wrap view"><div class="empty"><b>Halaman tidak bisa dimuat.</b>
    <p>Terjadi kesalahan saat memuat halaman ini. Coba muat ulang.</p>
    <div class="sugx"><button class="schip" id="bootRetry" type="button">Muat ulang</button></div></div></div>`;
  document.getElementById('bootRetry')?.addEventListener('click', () => location.reload());
}
let vtNext = false;
function route() {
  stopPlaceholderRotation();
  runLeaveCbs(); closePalette(); closeCatSheet();
  const run = () => {
    /* S-U1 (v6.22.0, F-03): try/catch HARUS di dalam run(), bukan
       di sekeliling pemanggilan route() — saat ViewTransition
       dipakai, run() dieksekusi browser secara asinkron dan
       pengecualian di dalamnya tidak sampai ke pemanggil route().
       Tanpa ini, render yang gagal = halaman putih tanpa pesan. */
    try {
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
    } catch (e) {
      vtNext = false;
      renderBootError(document.getElementById('app'), e);
      /* S-Q8 (v6.22.0, utang S-U1): navbar ikut tampil di halaman
         error — renderBootError menyediakan .wrap, jadi
         enhanceRoute bisa memasang navbar + breadcrumb di atas
         pesan error. Dijaga try/catch sendiri: bila chrome ikut
         gagal, pesan + tombol "Muat ulang" tetap tampil. */
      try {
        const mm = matchRoute(location.hash || '#/');
        enhanceRoute(mm.name, mm.params);
      } catch { /* chrome gagal: halaman error tetap berfungsi */ }
    }
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

/* ---------------- riwayat kata pencarian: hapus per item (S-U2, v6.22.0) ----------------
   Chip "Terakhir dicari" dirender components.js (S-05, bukan file ini),
   jadi tombol × per chip dipasang dari sini lewat observer: tiap .rs-wrap
   / .pal-rs yang muncul, tiap .rs-chip dibungkus span + tombol ×.
   Tombol × memakai kelas .schip (cincin fokus + hover sudah ada di CSS)
   dan BUKAN .rs-chip, supaya kliknya tidak memicu pencarian ulang
   (handler components.js hanya merespons .rs-chip / [data-rs-clear]).
   Hapus per item TIDAK memakai confirm() — satu kata mudah dicari ulang;
   confirm() hanya untuk "Hapus" semua (sudah ada di components.js, S-F3).
   Data tetap di store yang sama (adip_search_hist, search-plus.js);
   tidak ada sistem storage baru. */
function wrapHistoryChip(chip) {
  if (!chip || chip.parentElement?.classList.contains('rs-chipwrap')) return;
  const term = chip.dataset.term || chip.textContent.trim();
  const wrap = document.createElement('span');
  wrap.className = 'rs-chipwrap';
  wrap.style.cssText = 'display:inline-flex;align-items:center;gap:4px';
  chip.before(wrap);
  wrap.appendChild(chip);
  const del = document.createElement('button');
  del.type = 'button';
  del.className = 'schip rs-del';
  del.dataset.term = term;
  del.setAttribute('aria-label', `Hapus "${term}" dari riwayat`);
  del.style.cssText = 'padding:8px 10px;min-width:44px';
  del.textContent = '×';
  del.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    removeRecentSearch(term);
    const host = wrap.closest('.rs-wrap, .pal-rs');
    wrap.remove();
    if (host && !host.querySelector('.rs-chip')) host.remove();
    syncHistoryEmpty();
  });
  wrap.appendChild(del);
}
/* Baris kosong jujur di #/semua saat belum ada riwayat: satu baris redup
   di bawah kotak cari (tempat yang sama dengan chip riwayat). Muncul
   hanya saat input kosong; hilang begitu ada riwayat / ketikan. */
function syncHistoryEmpty() {
  const input = document.getElementById('aq');
  const hsearch = document.querySelector('#app .hsearch');
  if (!input || !hsearch) return;
  let line = document.querySelector('#app .rs-empty');
  const show = input.value.trim() === '' && getRecentSearches().length === 0
    && !document.querySelector('#app .rs-wrap');
  if (show && !line) {
    line = document.createElement('p');
    line.className = 'rs-empty';
    line.style.cssText = 'font-size:12.5px;color:var(--faint);margin:14px 0 0';
    line.textContent = 'Belum ada pencarian tersimpan.';
    hsearch.insertAdjacentElement('afterend', line);
  } else if (!show && line) {
    line.remove();
  }
}
/* S-Q8 (v6.22.0): jembatan S-U2 syncMoreButton() DICABUT — perbaikan
   permanen S-U5 sudah mendarat (CSS .morebtn[hidden]{display:none} +
   style display eksplisit di semuaRender; terverifikasi skrip S-U2
   tanpa jembatan, lihat laporan S-Q8). initHistoryChips() sendiri
   dipertahankan: observer yang sama menangani chip riwayat. */
function initHistoryChips() {
  const obs = new MutationObserver((muts) => {
    for (const m of muts) {
      for (const n of m.addedNodes) {
        if (n.nodeType !== 1) continue;
        if (n.classList.contains('rs-chip')) wrapHistoryChip(n);
        else if (n.classList.contains('rs-wrap') || n.classList.contains('pal-rs')) {
          n.querySelectorAll('.rs-chip').forEach(wrapHistoryChip);
        }
      }
    }
    syncHistoryEmpty();
  });
  obs.observe(document.body, { childList: true, subtree: true });
}

/* ---------------- boot ---------------- */
ensureTabs();
initComponents({ openPalette, toast, onBackupRestored: () => { /* S-Q8 (v6.22.0, wiring S-U9 §5.3): sesudah pulihkan salinan, grid Favorit/beranda me-render ulang dari storage yang baru — pola yang sama seperti onStoreChange di bawah. */
  if (document.body.dataset.route === 'fav') refreshFavPage();
  if (document.body.dataset.route === 'home') renderFavSection();
} }); /* P2-B2: navbar, dialog, back-to-top */
initHistoryChips(); /* S-U2 (v6.22.0): tombol × per chip riwayat + baris kosong riwayat */
initPWA({ toast }); /* PWA v6.20.0 (P10): SW + install/update — kerja berat ditunda sampai load */
/* S-Q8 (v6.22.0, wiring S-U9 §5.2): sinkron antar tab — tab lain
   mengubah favorit/riwayat, tab ini me-render ulang seksi yang
   sama (pola yang sama seperti sesudah toggleFav di bindFav). */
onStoreChange(() => {
  if (document.body.dataset.route === 'fav') refreshFavPage();
  if (document.body.dataset.route === 'home') renderFavSection();
});
sbFetchPopular();
window.addEventListener('hashchange', route);
document.addEventListener('keydown', (e) => {
  const inField = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || '');
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openPalette(); return; }
  /* S-Q8 (v6.22.0): Esc saat dialog terbuka (mis. dialog kuota di
     atas palet) hanya menutup dialog — components.js sudah
     menanganinya; tanpa penjaga ini palet ikut tertutup. */
  if (palEl && e.key === 'Escape' && !document.querySelector('.dlg-wrap')) { closePalette(); return; }
  if (catEl && e.key === 'Escape' && !document.querySelector('.dlg-wrap')) { closeCatSheet(); return; }
  if (e.key === '/' && !palEl && !inField) {
    const q = document.getElementById('q') || document.getElementById('aq');
    if (q) { e.preventDefault(); q.focus(); }
  }
});
/* S-FIXUP F6 (v6.22.0): tombol footer "Lihat panduan lagi"
   membuka kembali lembar onboarding (delegasi: footer di-render
   ulang tiap rute, jadi listener di document). */
document.addEventListener('click', (e) => {
  if (e.target.closest('[data-act="reopen-onboarding"]')) showOnboardingAgain();
});
route();
initSeoShare({ manifest, catLabel, onToast: (msg) => toast(msg) });
