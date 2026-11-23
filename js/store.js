/* ============================================================
   ADIP Tools v6.14.0 — store.js (P0-C)
   State lokal pengunjung (favorit + riwayat buka) di localStorage,
   dipindah verbatim dari app.js (v6.13.0). Tanpa DOM — hanya
   localStorage — jadi aman diimpor dari modul view mana pun.

   FORMAT (jangan diubah — data pengunjung lama bergantung padanya):
   - adip_fav / adip_recent : [{ id, t }] (t = timestamp ms).
   - Migrasi otomatis: format lama [id] dibaca sebagai { id, t: 0 }.
   - Batas: favorit maks 50 (terbaru di depan), riwayat maks 20.
   - Migrasi v6.21.0: ID tool pensiun (merge) dipetakan ke penyintas
     lewat resolveToolAlias saat dibaca (in-memory); tersimpan permanen
     saat pengguna berikutnya mengubah favorit/riwayat.

   S-U9 (v6.22.0, S-A11 F-03/F-04): modul ini juga rumah standar
   ekspor/impor per-tracker (exportJson/importJsonValidated), sinkron
   antar tab (onStoreChange), dan penanganan kuota (quotaHelp).
   Helper DOM (downloadTextFile) dijaga inert tanpa DOM, jadi impor
   modul ini tetap aman di Node/harness seperti sebelumnya.
   ============================================================ */

import { resolveToolAlias } from './routes.js';

const FKEY = 'adip_fav', RKEY = 'adip_recent';
const loadJson = (k, fb) => { try { const v = JSON.parse(localStorage.getItem(k)); return Array.isArray(v) ? v : fb; } catch { return fb; } };
// S-U9: saveJson mencatat nama error tulis terakhir (null bila sukses),
// supaya pemanggil bisa membedakan kuota penuh dari gagal lain.
let lastSaveErr = null;
const saveJson = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); lastSaveErr = null; return true; } catch (e) { lastSaveErr = (e && e.name) || 'Error'; return false; } };
const lastSaveError = () => lastSaveErr;
/* Firefox memakai nama lain untuk kuota penuh. */
const lastSaveWasQuota = () => lastSaveErr === 'QuotaExceededError' || lastSaveErr === 'NS_ERROR_DOM_QUOTA_REACHED';
// S-F1 (v6.22.0, S-A11 F-01): saveJson MENGEMBALIKAN status tulis
// (true = tersimpan, false = ditolak, mis. kuota penuh). Dulu `catch {}`
// menelan gagal simpan tanpa nilai balik, sehingga pemanggil tidak
// pernah tahu tulisnya gagal.
// migrasi otomatis format lama [id] -> [{id,t}]
// P2-QA (RED-01, 17 Nov 2026): buang entri null/bukan-objek. loadJson hanya
// menjamin array; entri `null` di dalamnya lolos .map lalu melempar
// TypeError di SEMUA pembaca (isFav/searchCtx/renderFavSection/favPage —
// semuanya membaca x.id), sehingga beranda + #/favorit blank total dan
// pengunjung tidak bisa memakai situs tanpa menghapus storage manual.
// String (format lama) tetap dimigrasi; angka/boolean ikut terbuang karena
// tidak pernah menghasilkan tool valid (byId(undefined) -> undefined).
const normList = (list) => {
  const seen = new Set();
  return list
    .map((x) => (typeof x === 'string' ? { id: x, t: 0 } : x))
    .filter((x) => x && typeof x === 'object')
    // v6.21.0: ID tool pensiun (merge) dipetakan ke penyintas lewat
    // resolveToolAlias (query ?tab=/?dir= dibuang — favorit/riwayat
    // menyimpan ID murni). Dedup: pensiun + penyintas yang sama-sama
    // tersimpan jadi satu entri (yang terbaru dipertahankan).
    .map((x) => {
      if (typeof x.id !== 'string') return x;
      const alias = resolveToolAlias(x.id);
      return alias ? { ...x, id: alias.split('?')[0] } : x;
    })
    .filter((x) => { if (seen.has(x.id)) return false; seen.add(x.id); return true; });
};
const getFav = () => normList(loadJson(FKEY, []));
const isFav = (id) => getFav().some((x) => x.id === id);
/* S-F1 (v6.22.0, S-A11 F-01): toggleFav MENGEMBALIKAN { ok, added }.
   ok=false berarti tulis ditolak localStorage (mis. kuota penuh);
   added = arah ketukan (true = tambah, false = hapus). Pemanggil WAJIB
   cek ok dulu: JANGAN ubah ikon/toast seolah berhasil bila ok=false.
   Dulu: gagal simpan ditelan + pemanggil membaca ulang state, sehingga
   tambah yang gagal terbaca sebagai hapus dan toast berbohong
   "Dihapus dari favorit". */
function toggleFav(id) {
  let f = getFav();
  const adding = !f.some((x) => x.id === id);
  if (adding) { f.unshift({ id, t: Date.now() }); if (f.length > 50) f.length = 50; }
  else f = f.filter((x) => x.id !== id);
  return { ok: saveJson(FKEY, f), added: adding };
}
const getRecent = () => normList(loadJson(RKEY, []));
function touchRecent(id) {
  let r = getRecent().filter((x) => x.id !== id);
  r.unshift({ id, t: Date.now() }); if (r.length > 20) r.length = 20;
  return saveJson(RKEY, r); /* S-F1: kembalikan status tulis (dulu diam). */
}

/* ============================================================
   S-U9 (v6.22.0): standar ekspor/impor per-tracker, sinkron
   antar tab, dan penanganan kuota. Dipakai backup.js (salinan
   global) dan, sesudah integrasi lanjutan, tiap tracker.
   ============================================================ */

/* Unduh teks sebagai file. Satu-satunya tempat yang memicu unduh
   di modul data (backup.js memakai ini juga). Tanpa DOM (Node),
   kembalikan false tanpa melempar. */
function downloadTextFile(filename, text, mime = 'application/json') {
  if (typeof document === 'undefined' || typeof URL === 'undefined' || typeof Blob === 'undefined') return false;
  try {
    const blob = new Blob([text], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    try { a.remove(); } catch { /* bersih-bersih gagal tidak membatalkan unduhan */ }
    setTimeout(() => { try { URL.revokeObjectURL(url); } catch { /* abaikan */ } }, 1000);
    return true;
  } catch { return false; }
}

/* Nama file aman lintas OS: kunci storage boleh berisi ':' dan '/'
   yang tidak sah sebagai nama file di Windows. */
const safeFilename = (name) => String(name).replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+/, '').slice(0, 120) || 'data.json';

/* Format amplop ekspor satu kunci (beda dari salinan global di
   backup.js yang memakai 'adip-tools-backup'). */
const DATA_FORMAT = 'adip-tools-data';

/* Standar ekspor per-tracker: unduh isi satu kunci sebagai file JSON
   beramplop { format, key, exportedAt, data }. Nilai yang bukan JSON
   ikut terunduh apa adanya dengan penanda raw: true.
   Mengembalikan { ok, filename } atau { ok: false, reason }:
   'empty' = kunci tidak ada/kosong, 'failed' = unduh tidak bisa dipicu. */
function exportJson(key, filename) {
  let raw = null;
  try { raw = localStorage.getItem(key); } catch { return { ok: false, reason: 'failed' }; }
  if (raw === null || raw === '') return { ok: false, reason: 'empty' };
  let data = raw;
  let isRaw = false;
  try { data = JSON.parse(raw); } catch { isRaw = true; }
  const envelope = { format: DATA_FORMAT, key, exportedAt: new Date().toISOString(), ...(isRaw ? { raw: true } : {}), data };
  const name = safeFilename(filename || `${key}-salinan.json`);
  const ok = downloadTextFile(name, JSON.stringify(envelope, null, 2));
  return ok ? { ok: true, filename: name } : { ok: false, reason: 'failed' };
}

/* Standar impor per-tracker, tervalidasi: baca file, urai JSON, lalu
   serahkan ke validator milik tracker. Validator mengembalikan
   { ok: true, key, value } bila isi sah, atau { ok: false, reason }
   bila tidak. TIDAK ADA yang ditulis sebelum validator lolos.
   Mengembalikan { ok, key } atau { ok: false, reason } ('format',
   'invalid', 'write-failed'; 'quota: true' bila gagal karena kuota). */
async function importJsonValidated(file, validator) {
  if (!file || typeof file.text !== 'function') return { ok: false, reason: 'file' };
  let parsed;
  try { parsed = JSON.parse(await file.text()); } catch { return { ok: false, reason: 'format' }; }
  let verdict;
  try { verdict = validator(parsed); } catch { return { ok: false, reason: 'validator' }; }
  if (!verdict || verdict.ok !== true || typeof verdict.key !== 'string' || !('value' in verdict)) {
    return { ok: false, reason: (verdict && verdict.reason) || 'invalid' };
  }
  const saved = saveJson(verdict.key, verdict.value);
  if (!saved) return { ok: false, reason: 'write-failed', quota: lastSaveWasQuota() };
  return { ok: true, key: verdict.key };
}

/* ============================================================
   Sinkron antar tab (S-A11 F-04). Event 'storage' hanya menyala
   di tab LAIN (bukan tab yang menulis), persis yang dibutuhkan:
   favorit/riwayat yang berubah di satu tab langsung tercermin di
   tab lain tanpa reload. Daftarkan sekali saat boot (wiring S-Q8);
   callback menerima { key, fav, recent } yang sudah dibaca ulang.
   Selain callback, modul ini juga menembakkan CustomEvent
   'adip-tools:store-changed' di document, supaya view yang tidak
   mengimpor store.js tetap bisa mendengarkan. Listener window
   dipasang malas (baru saat ada pendaftar pertama) dan dijaga
   tanpa DOM, supaya impor modul tetap aman di Node.
   ============================================================ */
const STORE_CHANGED_EVENT = 'adip-tools:store-changed';
const _storeListeners = new Set();
let _storageBound = false;
function _onStorageEvent(e) {
  /* e.key null = clear(): semua kunci berubah, beri tahu juga. */
  if (e.key !== null && e.key !== FKEY && e.key !== RKEY) return;
  const detail = { key: e.key, fav: getFav(), recent: getRecent() };
  _storeListeners.forEach((cb) => { try { cb(detail); } catch { /* satu pendengar rusak tidak boleh mematikan yang lain */ } });
  if (typeof document !== 'undefined' && typeof CustomEvent !== 'undefined' && document.dispatchEvent) {
    try { document.dispatchEvent(new CustomEvent(STORE_CHANGED_EVENT, { detail })); } catch { /* abaikan */ }
  }
}
function onStoreChange(cb) {
  if (typeof cb !== 'function') return () => {};
  _storeListeners.add(cb);
  if (!_storageBound && typeof window !== 'undefined' && window.addEventListener) {
    window.addEventListener('storage', _onStorageEvent);
    _storageBound = true;
  }
  return () => { _storeListeners.delete(cb); };
}

/* ============================================================
   Penanganan kuota (S-A11 F-01/F-08, bangun di atas S-F1).
   Dipanggil pemanggil sesudah saveJson/toggleFav mengembalikan
   false + lastSaveWasQuota() true. Satu pesan + satu tombol aksi:
   tombolnya menjalankan downloadBackup() dari backup.js (wiring
   S-Q8). Pesan juga menyebut langkah kedua (hapus data lama)
   dengan kata-kata; penghapusan memakai alur hapus yang sudah ada
   + confirm() pola S-F2, bukan helper baru di sini.
   Catatan: label aksi ini sama dengan COPY.SAVE_LABEL di backup.js
   (duplikasi disengaja: store.js tidak boleh mengimpor backup.js
   karena backup.js mengimpor store.js). Bila label berubah, ubah
   di kedua tempat.
   ============================================================ */
function quotaHelp() {
  return {
    message: 'Penyimpanan browser penuh. Simpan salinan datamu dulu, lalu hapus data lama supaya ada ruang.',
    action: 'backup',
    actionLabel: 'Simpan salinan dataku',
  };
}

export { FKEY, RKEY, getFav, isFav, toggleFav, getRecent, touchRecent,
  lastSaveError, lastSaveWasQuota, downloadTextFile, DATA_FORMAT,
  exportJson, importJsonValidated, STORE_CHANGED_EVENT, onStoreChange,
  quotaHelp };
