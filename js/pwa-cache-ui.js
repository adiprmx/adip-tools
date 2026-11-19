/* ============================================================
   ADIP Tools v6.20.0 — pwa-cache-ui.js (P17: UI manajemen cache)
   Kewajiban Fase 9 (F11) + D8 S9: "tampilkan ukuran cache +
   tombol hapus cache offline" (r12-history.md §4.3b, roster
   D-PWA-08/D-PWA-11). Dimiliki P17; JANGAN diedit tim lain.

   KONTRAK (gaya R11 §3 — untuk P10/js/pwa.js):
   - mountCacheEntry({ toast, onCleared }) — pasang entri di
     footer. Idempotent; P10 memanggilnya di initPWA + tiap
     hashchange (footer di-render ulang tiap route, sama seperti
     mountInstallEntry R11 §3.2). Toast disuntik P10 (pola
     initPWA({ toast })); bila tidak disuntik, modul memakai
     toast() dari core.js agar tetap jalan mandiri.
   - unmountCacheEntry() — cabut entri bila ada (no-op bila tidak).
   - refreshCacheEntry({ force }) — ukur ulang + perbarui label;
     P10 boleh memanggilnya sesudah update SW diterapkan.
   - measureCacheUsage({ force }) — hasil ukur mentah (untuk
     P10/tes): { measurable, totalBytes, quotaBytes,
     estimateUsage, source ('caches'|'estimate'|'none'),
     caches: [{ name, entries, bytes, unmeasured }], measuredAt }.
   - clearOfflineCache() — hapus SEMUA cache `adip-tools-*` TANPA
     dialog (operasi mentah untuk P10/tes). Tombol di footer
     selalu lewat konfirmasi dulu (lihat onClearClick).
   - getCacheEntryState() / isCacheEntryMounted() — baca status.
   - CACHE_PREFIX = 'adip-tools-' (nama cache D-PWA-11:
     adip-tools-precache-v6.20.0, adip-tools-runtime-v6.20.0,
     adip-tools-cdn-v1 — semuanya berprefix ini).

   YANG DILAKUKAN MODUL INI (dan yang TIDAK):
   - Ukuran utama = jumlah byte cache `adip-tools-*` yang
     terukur dari Cache Storage API (angka PASTI, langsung
     berubah begitu cache dihapus). navigator.storage.estimate()
     dipakai sebagai CADANGAN bila Cache Storage API tidak ada
     — BUKAN sebagai angka utama, karena TERBUKTI 20 Nov 2026
     estimate().usage TIDAK turun sesudah caches.delete()
     (masih 1.048.664 B sepuluh detik sesudah hapus 1 MiB):
     label akan bohong ("masih 1 MB") padahal cache sudah
     hilang. Rincian per cache (jumlah item + byte bila
     terukur) tampil di tooltip label. Bila KEDUA API tidak
     ada: pesan jujur "tidak bisa diukur di browser ini" —
     BUKAN angka palsu.
   - Tombol "Hapus data offline" menghapus SEMUA cache
     `adip-tools-*` via caches.delete() sesudah konfirmasi
     (confirmDialog components.js — pola impor P8 R11 §3.2).
     Service worker TIDAK di-unregister dari tombol ini: shell
     diunduh ulang saat kunjungan berikut (rollback/unregister
     adalah prosedur deploy P15/P16, bukan aksi tombol ini).
   - Gagal tertutup (fail-closed, pola components.js): footer
     belum dirender / API tidak tersedia / ukur gagal -> modul
     diam atau menampilkan pesan jujur, TIDAK PERNAH melempar.
     Tanpa Cache Storage API, tombol hapus tidak dirender
     (tidak ada yang bisa dihapus) — hanya teks ukuran.
   - Copy bahasa sehari-hari (R11 §4: kata "cache", "PWA",
     "service worker", "reload" DILARANG tampil ke pengguna).
     Semua string tampil terkumpul di COPY di bawah.

   STYLE — class yang SUDAH ADA saja (pola footer/schip):
   - .rs-chips (baris flex, item rata tengah) + .prevline
     (teks 13px redup + margin atas 14px) untuk baris entri;
     .schip untuk tombol hapus. NOL CSS baru di modul ini.
   - Class BARU yang didaftarkan untuk P8 (css/pwa.css):
     .pwa-cache (baris entri), .pwa-cache-size (teks ukuran),
     .pwa-cache-clear (tombol hapus) — P8 boleh memolesnya;
     tanpa CSS P8 pun entrinya sudah tampil benar.
   ============================================================ */
import { toast as coreToast } from './core.js';

/* Prefix nama cache PWA (D-PWA-11). Semua cache SW ronde ini
   berawalan ini; penghapusan memakai prefix, bukan daftar nama
   — cache versi lama (v6.20.0 -> v6.20.1) ikut terhapus. */
export const CACHE_PREFIX = 'adip-tools-';
export const CACHE_ENTRY_ID = 'pwaCacheEntry';
export const CACHE_SIZE_ID = 'pwaCacheSize';
export const CACHE_CLEAR_ID = 'pwaCacheClear';

/* Hasil ukur di-cache di memori 60 dtk: footer di-mount ulang
   tiap hashchange, dan membaca ulang isi cache tiap navigasi
   hanya membuang kerja (angka tidak berubah secepat itu). */
const MEASURE_TTL_MS = 60_000;

/* Copy tampil — bahasa sehari-hari, tanpa istilah teknis. */
const COPY = {
  measuring: 'Penyimpanan offline: mengukur…',
  unmeasurable: 'Penyimpanan offline: tidak bisa diukur di browser ini',
  empty: 'Penyimpanan offline: belum ada data',
  size: (s) => `Penyimpanan offline: ${s}`,
  clear: 'Hapus data offline',
  clearing: 'Menghapus…',
  confirmTitle: 'Hapus data offline?',
  confirmBody: 'Aplikasi akan mengunduh ulang saat dibuka lagi.',
  confirmLabel: 'Ya, hapus',
  cleared: 'Data offline dihapus.',
  clearedPartial: 'Sebagian data offline gagal dihapus.',
  clearFailed: 'Gagal menghapus data offline.',
};

let toastFn = null; /* toast yang disuntik P10; null -> coreToast */
let onClearedCb = null; /* callback P10 sesudah penghapusan */
let lastMeasure = null; /* { at, result } — cache ukur 60 dtk */
let clearing = false; /* penghapusan sedang berjalan */

/* Format byte ke satuan yang dibaca manusia, koma desimal
   Indonesia: 0 -> "0 B", 1536 -> "1,5 KB", 12 MB -> "12 MB".
   Kembalikan null bila input bukan angka valid (pemanggil
   menampilkan pesan jujur, bukan "NaN"). */
export function formatBytes(bytes) {
  if (bytes == null || !Number.isFinite(bytes) || bytes < 0) return null;
  const units = ['B', 'KB', 'MB', 'GB'];
  let v = bytes;
  let u = 0;
  while (v >= 1024 && u < units.length - 1) { v /= 1024; u++; }
  if (u === 0) return `${Math.round(v)} B`;
  const s = (v >= 10 ? v.toFixed(0) : v.toFixed(1))
    .replace('.', ',')
    .replace(/,0$/, '');
  return `${s} ${units[u]}`;
}

/* Ukur satu cache: jumlah item + jumlah byte. content-length
   dipakai bila ada (gratis, tanpa baca isi); bila tidak ada,
   baca blob untuk respons same-origin. Respons opaque
   (library CDN tanpa CORS) isinya tidak bisa dibaca dari
   halaman — dihitung di `unmeasured`, BUKAN ditebak angkanya. */
async function measureOneCache(name) {
  const out = { name, entries: 0, bytes: 0, unmeasured: 0 };
  try {
    const cache = await caches.open(name);
    const keys = await cache.keys();
    out.entries = keys.length;
    for (const req of keys) {
      let res = null;
      try { res = await cache.match(req); } catch { out.unmeasured++; continue; }
      if (!res) { out.unmeasured++; continue; }
      const len = res.headers.get('content-length');
      if (len !== null && Number.isFinite(Number(len))) { out.bytes += Number(len); continue; }
      if (res.type === 'opaque' || res.type === 'opaqueredirect') { out.unmeasured++; continue; }
      try { out.bytes += (await res.clone().blob()).size; }
      catch { out.unmeasured++; }
    }
  } catch { /* satu cache gagal dibaca: kembalikan apa adanya */ }
  return out;
}

/* Ukur penyimpanan offline situs ini.
   - totalBytes: jumlah byte cache adip-tools-* yang terukur
     (source 'caches') — angka pasti yang langsung berubah
     begitu cache dihapus. estimate() HANYA cadangan bila
     Cache Storage API tidak ada (source 'estimate'): angka
     estimate tidak turun sesudah caches.delete() (terbukti
     20 Nov 2026: masih 1.048.664 B 10 dtk sesudah hapus),
     jadi tidak boleh jadi angka utama UI ini.
   - estimateUsage/quotaBytes ikut dicatat bila tersedia
     (untuk P10/QA), tapi TIDAK dipakai sebagai angka tampil
     saat source 'caches'.
   - measurable false HANYA bila kedua API tidak tersedia /
     keduanya gagal — pemanggil menampilkan pesan jujur. */
export async function measureCacheUsage({ force = false } = {}) {
  const now = Date.now();
  if (!force && lastMeasure && now - lastMeasure.at < MEASURE_TTL_MS) {
    return lastMeasure.result;
  }
  const result = {
    measurable: false,
    totalBytes: null,
    quotaBytes: null,
    estimateUsage: null,
    source: 'none',
    caches: [],
    measuredAt: now,
  };
  let cacheSum = null;
  try {
    if (typeof caches !== 'undefined' && caches && typeof caches.keys === 'function') {
      const names = (await caches.keys()).filter((n) => n.startsWith(CACHE_PREFIX));
      let sum = 0;
      for (const name of names) {
        const m = await measureOneCache(name);
        result.caches.push(m);
        sum += m.bytes;
      }
      cacheSum = sum;
      result.measurable = true;
    }
  } catch { /* Cache Storage gagal: lanjut ke estimate */ }
  try {
    if (typeof navigator !== 'undefined' && navigator.storage
      && typeof navigator.storage.estimate === 'function') {
      const est = await navigator.storage.estimate();
      if (est && Number.isFinite(est.usage)) {
        result.estimateUsage = est.usage;
        result.quotaBytes = Number.isFinite(est.quota) ? est.quota : null;
        result.measurable = true;
      }
    }
  } catch { /* estimate gagal: pakai jumlah cache bila ada */ }
  if (cacheSum != null) {
    result.totalBytes = cacheSum;
    result.source = 'caches';
  } else if (result.estimateUsage != null) {
    result.totalBytes = result.estimateUsage;
    result.source = 'estimate';
  }
  lastMeasure = { at: now, result };
  return result;
}

/* Hapus SEMUA cache `adip-tools-*` (SEMUA versi, termasuk cache
   versi lama yang yatim). TIDAK menyentuh registrasi service
   worker dan TIDAK menampilkan dialog/toast — operasi mentah
   untuk P10/tes; alur tombol (konfirmasi + toast) ada di
   onClearClick. Kembalikan { deleted, failed } berisi nama. */
export async function clearOfflineCache() {
  const deleted = [];
  const failed = [];
  try {
    if (typeof caches !== 'undefined' && caches && typeof caches.keys === 'function') {
      const names = (await caches.keys()).filter((n) => n.startsWith(CACHE_PREFIX));
      for (const name of names) {
        try {
          /* delete() false = cache sudah tidak ada (balapan
             hapus) — keadaan akhir sama: cache hilang. */
          await caches.delete(name);
          deleted.push(name);
        } catch { failed.push(name); }
      }
    }
  } catch { /* gagal tertutup */ }
  lastMeasure = null; /* ukuran berubah — ukur ulang lain kali */
  return { deleted, failed };
}

/* Rincian per cache untuk tooltip label (title): nama singkat
   tanpa prefix + ukuran + jumlah item. Kosong bila belum ada
   cache adip-tools-* (tidak ada tooltip — angka total dari
   estimate sudah cukup). */
function buildBreakdownTitle(result) {
  if (!result.caches.length) return '';
  return result.caches.map((c) => {
    const short = c.name.slice(CACHE_PREFIX.length);
    let s = `${short}: ${formatBytes(c.bytes)} (${c.entries} item)`;
    if (c.unmeasured > 0) s += `, ${c.unmeasured} item tidak terukur`;
    return s;
  }).join(' · ');
}

function renderSize(result) {
  if (typeof document === 'undefined') return;
  const size = document.getElementById(CACHE_SIZE_ID);
  if (!size) return;
  if (!result.measurable || result.totalBytes == null) {
    size.textContent = COPY.unmeasurable;
    size.removeAttribute('title');
    return;
  }
  if (result.totalBytes === 0) {
    /* 0 byte + ada item cache = isinya tidak terukur (respons
       opaque CDN) — katakan tidak bisa diukur, jangan klaim
       "belum ada data" padahal ada. 0 byte + tanpa cache =
       memang belum ada data offline. */
    const entries = result.caches.reduce((n, c) => n + c.entries, 0);
    size.textContent = entries > 0 ? COPY.unmeasurable : COPY.empty;
    const title = buildBreakdownTitle(result);
    if (title) size.setAttribute('title', title);
    else size.removeAttribute('title');
    return;
  }
  size.textContent = COPY.size(formatBytes(result.totalBytes));
  const title = buildBreakdownTitle(result);
  if (title) size.setAttribute('title', title);
  else size.removeAttribute('title');
}

/* Ukur ulang + perbarui label bila entri terpasang. Aman
   dipanggil saat entri tidak terpasang (hanya mengukur). */
export async function refreshCacheEntry({ force = false } = {}) {
  const result = await measureCacheUsage({ force });
  renderSize(result);
  return result;
}

/* Alur tombol hapus: konfirmasi dulu (dialog generik — impor
   dinamis agar graf statis modul ini tetap ringan dan aman
   diimpor di Node untuk validasi ESM), lalu hapus, lalu ukur
   ulang + toast. Tanpa konfirmasi, TIDAK ADA penghapusan —
   bila dialog gagal dibuka, alur berhenti diam. */
async function onClearClick() {
  if (clearing) return;
  const btn = document.getElementById(CACHE_CLEAR_ID);
  let yes = false;
  try {
    const { confirmDialog } = await import('./components.js');
    yes = await confirmDialog({
      title: COPY.confirmTitle,
      body: COPY.confirmBody,
      confirmLabel: COPY.confirmLabel,
    });
  } catch {
    return; /* dialog gagal: jangan hapus tanpa konfirmasi */
  }
  if (!yes) return;
  clearing = true;
  if (btn) { btn.disabled = true; btn.textContent = COPY.clearing; }
  const { deleted, failed } = await clearOfflineCache();
  clearing = false;
  await refreshCacheEntry({ force: true });
  const showToast = toastFn || coreToast;
  try {
    if (failed.length === 0) showToast(COPY.cleared);
    else if (deleted.length > 0) showToast(COPY.clearedPartial);
    else showToast(COPY.clearFailed);
  } catch { /* toast gagal: bukan alasan melempar */ }
  if (btn && document.body.contains(btn)) {
    btn.disabled = false;
    btn.textContent = COPY.clear;
  }
  if (onClearedCb) {
    try { onClearedCb({ deleted, failed }); } catch { /* diam */ }
  }
}

/* Pasang entri manajemen cache di footer, tepat sesudah
   .foot-links (di bawah entri install P8). Idempotent: bila
   entri sudah ada di footer saat ini, tidak menambah lagi.
   No-op bila footer belum dirender — P10 memanggil ulang di
   hashchange berikutnya (pola mountInstallEntry R11 §3.2). */
export function mountCacheEntry({ toast, onCleared } = {}) {
  if (typeof document === 'undefined') return;
  if (typeof toast === 'function') toastFn = toast;
  if (typeof onCleared === 'function') onClearedCb = onCleared;
  const links = document.querySelector('.foot-links');
  if (!links) return;
  if (document.getElementById(CACHE_ENTRY_ID)) return;
  const wrap = document.createElement('div');
  /* .rs-chips = baris flex rata tengah; .prevline = teks 13px
     redup + margin atas; .pwa-cache = kait gaya untuk P8. */
  wrap.className = 'rs-chips prevline pwa-cache';
  wrap.id = CACHE_ENTRY_ID;
  const size = document.createElement('span');
  size.className = 'pwa-cache-size';
  size.id = CACHE_SIZE_ID;
  size.textContent = COPY.measuring;
  wrap.appendChild(size);
  /* Tanpa Cache Storage API tidak ada yang bisa dihapus —
     tombol tidak dirender, hanya teks ukuran (yang akan
     menampilkan pesan jujur bila estimate pun tidak ada). */
  if (typeof caches !== 'undefined' && caches && typeof caches.delete === 'function') {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'schip pwa-cache-clear';
    btn.id = CACHE_CLEAR_ID;
    btn.textContent = COPY.clear;
    btn.addEventListener('click', onClearClick);
    wrap.appendChild(btn);
  }
  links.insertAdjacentElement('afterend', wrap);
  /* Ukur PAKSA (bypass cache TTL 60 dtk): mount baru berarti
     footer baru — label tidak boleh menampilkan angka basi dari
     pengukuran boot (terbukti 20 Nov 2026: ukur boot 0 byte
     menempel 60 dtk padahal cache sudah terisi). Biaya satu
     pengukuran penuh per navigasi tidak berarti (async,
     korpus cache ~6 MB). TTL tetap berlaku untuk pemanggilan
     refreshCacheEntry() biasa dari P10. */
  void refreshCacheEntry({ force: true });
}

/* Cabut entri dari footer (dipakai P10 bila fitur dimatikan /
   dibersihkan). No-op bila tidak ada. */
export function unmountCacheEntry() {
  if (typeof document === 'undefined') return;
  document.getElementById(CACHE_ENTRY_ID)?.remove();
}

export function isCacheEntryMounted() {
  if (typeof document === 'undefined') return false;
  return Boolean(document.getElementById(CACHE_ENTRY_ID));
}

/* Status baca-murni untuk P10/tes (tanpa efek samping). */
export function getCacheEntryState() {
  return {
    mounted: isCacheEntryMounted(),
    clearing,
    lastMeasurement: lastMeasure ? lastMeasure.result : null,
  };
}
