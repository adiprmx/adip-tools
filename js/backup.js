/* ============================================================
   ADIP Tools v6.22.0: backup.js (S-U9, S-A11 F-03)
   Salinan + pemulihan data aplikasi.

   PRIVASI: 100% lokal. Modul ini TIDAK PERNAH mengirim data ke
   mana pun: salinan hanya diunduh sebagai file ke perangkat
   pengunjung, pemulihan hanya membaca file yang pengunjung pilih
   sendiri. Tidak ada fetch, tidak ada beacon, tidak ada cloud.

   ISI SALINAN: semua kunci localStorage yang ada di origin ini
   pada saat disalin, KECUALI daftar pengecualian di bawah. Nilai
   disimpan mentah (string persis seperti di storage), jadi
   pulihkan mengembalikan data byte-per-byte, tanpa peduli bentuk
   JSON di dalamnya.

   PENGECUALIAN (tidak pernah ikut salinan, S-A11 §10.2):
   - 'brankas.vault' ..... brankas sandi terenkripsi (tetap di perangkat)
   - 'locknote.*' ......... catatan terkunci terenkripsi (satu kunci per catatan)
   - 'adipTools_key_*' ... kunci API milik pengunjung (BYOK, plaintext)
   - 'adip-pdflab-tab' ... sinyal sekali pakai antar alat, dihapus sesudah
                           dibaca pdflab.js:2951; memulihkannya bisa
                           memicu ulang handoff yang sudah selesai
   'adip-ttd-png' (gambar tanda tangan) IKUT disalin: tidak pernah
   dihapus sesudah dibaca, jadi itu data milik pengunjung.

   PEMULIHAN ATOMIK: validasi penuh dulu (format, versi, bentuk tiap
   kunci, batas ukuran), lalu minta konfirmasi, baru tulis. Bila
   tulis gagal di tengah jalan, semua kunci dikembalikan ke nilai
   sebelum pemulihan (snapshot + rollback). Pemulihan menimpa hanya
   kunci yang ada di salinan; kunci lain dibiarkan apa adanya.

   COPY: semua kalimat tampil tinggal di COPY di bawah, bahasa
   sehari-hari, tanpa jargon, tanpa em dash. Label kanonis:
   "Simpan salinan dataku" (bukan "ekspor") dan "Pulihkan dari
   salinan" (bukan "impor").

   Modul ini belum di-wire ke app.js (wiring milik S-Q8, lihat
   spesifikasi di laporan S-U9). Semua fungsi bisa dipakai langsung
   dari konsol/harness: import('./js/backup.js').
   ============================================================ */

import { FKEY, RKEY, downloadTextFile } from './store.js';
import { VERSION } from './manifest.js';

export const BACKUP_FORMAT = 'adip-tools-backup';
export const BACKUP_VERSION = 1;
/* Batas ukuran salinan yang diterima (8 MB). localStorage satu origin
   muat sekitar 5 MB, jadi salinan yang sah tidak pernah sebesar ini;
   batas ini hanya menahan file raksasa sebelum dibaca/ditulis. */
export const BACKUP_MAX_BYTES = 8 * 1024 * 1024;

const SEARCH_KEY = 'adip_search_hist';
/* Kunci shell yang isinya pengaturan, bukan data alat. */
const SETTINGS_KEYS = new Set(['adip_onb', 'pwa:install-dismissed', 'pwa:update-seen', 'pwa:installed']);

const EXCLUDED_EXACT = new Set(['brankas.vault', 'adip-pdflab-tab']);
const EXCLUDED_PREFIX = ['adipTools_key_', 'locknote.'];

export function isExcludedKey(key) {
  if (typeof key !== 'string') return true;
  if (EXCLUDED_EXACT.has(key)) return true;
  return EXCLUDED_PREFIX.some((p) => key.startsWith(p));
}

/* Semua kalimat yang tampil ke pengunjung, satu tempat. */
export const COPY = {
  SAVE_LABEL: 'Simpan salinan dataku',
  RESTORE_LABEL: 'Pulihkan dari salinan',
  EMPTY: 'Belum ada data yang bisa disimpan.',
  INVALID: 'File ini bukan salinan Adip Tools, atau filenya rusak. Datamu tidak berubah.',
  TOO_NEW: 'Salinan ini dibuat aplikasi yang lebih baru. Perbarui dulu aplikasinya, lalu coba lagi.',
  TOO_BIG: 'Salinan ini terlalu besar untuk dipulihkan di perangkat ini.',
  EMPTY_BACKUP: 'Salinan ini kosong. Tidak ada data yang dipulihkan.',
  WRITE_FAILED: 'Pemulihan gagal di tengah jalan. Datamu yang lama sudah dikembalikan seperti semula.',
  DOWNLOAD_FAILED: 'Salinan tidak bisa diunduh. Coba lagi.',
  CANCELLED: 'Pemulihan dibatalkan. Datamu tidak berubah.',
  NO_CONFIRM: 'Pemulihan butuh konfirmasi. Datamu tidak berubah.',
};

/* Kumpulkan semua data yang boleh disalin. Nilai mentah (string).
   '__proto__' dilewati: bukan kunci aplikasi, dan penugasan
   data['__proto__'] pada objek biasa diam-diam tidak tersimpan. */
export function collectBackupData() {
  const data = {};
  const included = [];
  const skipped = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key === null || key === '__proto__') continue;
      if (isExcludedKey(key)) { skipped.push(key); continue; }
      const value = localStorage.getItem(key);
      if (value === null) continue;
      data[key] = value;
      included.push(key);
    }
  } catch { /* storage tidak bisa dibaca: kembalikan yang terkumpul */ }
  return { data, included, skipped };
}

/* Ringkasan isi salinan untuk ditampilkan sebelum pulihkan.
   Hitungan diambil dari nilai yang berhasil diurai; kunci yang
   nilainya bukan JSON tetap dihitung sebagai 1 kunci di totalKeys. */
export function summarizeBackupData(data) {
  const countArray = (key) => {
    try {
      const v = JSON.parse(data[key]);
      return Array.isArray(v) ? v.length : 0;
    } catch { return 0; }
  };
  const keys = Object.keys(data);
  let settings = 0;
  let bytes = 0;
  for (const key of keys) {
    if (SETTINGS_KEYS.has(key)) settings++;
    bytes += (key.length + String(data[key]).length) * 2; /* UTF-16 */
  }
  const fav = FKEY in data ? countArray(FKEY) : 0;
  const recent = RKEY in data ? countArray(RKEY) : 0;
  const search = SEARCH_KEY in data ? countArray(SEARCH_KEY) : 0;
  const shellKeys = (FKEY in data ? 1 : 0) + (RKEY in data ? 1 : 0)
    + (SEARCH_KEY in data ? 1 : 0) + settings;
  return {
    fav, recent, search, settings,
    trackers: keys.length - shellKeys,
    totalKeys: keys.length,
    bytes,
  };
}

/* Susun ringkasan jadi satu frasa bahasa sehari-hari:
   "5 favorit, 12 riwayat buka, dan data 8 alat". */
export function describeSummary(s) {
  const parts = [];
  if (s.fav) parts.push(`${s.fav} favorit`);
  if (s.recent) parts.push(`${s.recent} riwayat buka`);
  if (s.search) parts.push(`${s.search} kata pencarian`);
  if (s.trackers) parts.push(`data ${s.trackers} alat`);
  if (s.settings) parts.push('pengaturan aplikasi');
  if (!parts.length) return 'datamu';
  if (parts.length === 1) return parts[0];
  return parts.slice(0, -1).join(', ') + ' dan ' + parts[parts.length - 1];
}

export function backupFilename(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `adip-tools-salinan-${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}.json`;
}

/* Bangun amplop salinan lengkap (murni, tanpa DOM). */
export function buildBackup() {
  const { data, included, skipped } = collectBackupData();
  if (included.length === 0) return { ok: false, reason: 'empty', message: COPY.EMPTY };
  const summary = summarizeBackupData(data);
  const backup = {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    appVersion: VERSION,
    createdAt: new Date().toISOString(),
    counts: {
      fav: summary.fav, recent: summary.recent, search: summary.search,
      trackers: summary.trackers, settings: summary.settings,
      totalKeys: summary.totalKeys, bytes: summary.bytes,
    },
    skipped,
    data,
  };
  return { ok: true, backup, filename: backupFilename(), summary, skipped };
}

/* Simpan salinan: bangun amplop lalu unduh sebagai file.
   Mengembalikan { ok, filename, summary } atau
   { ok: false, reason, message } (reason 'empty' bila tidak ada data). */
export function downloadBackup() {
  const built = buildBackup();
  if (!built.ok) return { ok: false, reason: built.reason, message: built.message };
  const ok = downloadTextFile(built.filename, JSON.stringify(built.backup, null, 2));
  if (!ok) return { ok: false, reason: 'failed', message: COPY.DOWNLOAD_FAILED };
  return { ok: true, filename: built.filename, summary: built.summary, skipped: built.skipped };
}

/* Perkiraan pemakaian localStorage origin ini, dalam byte (UTF-16).
   Dipakai wiring kuota untuk menunjukkan angka jujur. */
export function estimateStorageBytes() {
  let bytes = 0;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key === null) continue;
      bytes += (key.length + (localStorage.getItem(key) || '').length) * 2;
    }
  } catch { /* abaikan: perkiraan terbaik */ }
  return bytes;
}

const fail = (reason, message) => ({ ok: false, reason, message });

/* Validasi PENUH sebelum menulis apa pun. Mengembalikan
   { ok, keys, skipped, summary } atau { ok: false, reason, message }.
   Kunci yang dikecualikan (brankas/BYOK/catatan terkunci) di dalam
   file dilewati dan dilaporkan, bukan menggagalkan seluruh file. */
export function validateBackup(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return fail('format', COPY.INVALID);
  if (obj.format !== BACKUP_FORMAT) return fail('format', COPY.INVALID);
  if (typeof obj.version !== 'number' || obj.version < 1) return fail('version', COPY.INVALID);
  if (obj.version > BACKUP_VERSION) return fail('version-new', COPY.TOO_NEW);
  if (!obj.data || typeof obj.data !== 'object' || Array.isArray(obj.data)) return fail('data', COPY.INVALID);
  const keys = Object.keys(obj.data);
  const restorable = [];
  const skipped = [];
  let bytes = 0;
  for (const key of keys) {
    const value = obj.data[key];
    if (typeof value !== 'string') return fail('value', COPY.INVALID);
    if (key.length === 0 || key.length > 256 || key === '__proto__') return fail('key', COPY.INVALID);
    bytes += (key.length + value.length) * 2;
    if (bytes > BACKUP_MAX_BYTES) return fail('too-big', COPY.TOO_BIG);
    if (isExcludedKey(key)) { skipped.push(key); continue; }
    restorable.push(key);
  }
  if (restorable.length === 0) return fail('empty', COPY.EMPTY_BACKUP);
  const data = {};
  for (const key of restorable) data[key] = obj.data[key];
  return { ok: true, keys: restorable, skipped, summary: summarizeBackupData(data) };
}

/* Urai teks file menjadi salinan tervalidasi. */
export function parseBackupText(text) {
  let obj;
  try { obj = JSON.parse(text); } catch { return fail('not-json', COPY.INVALID); }
  const v = validateBackup(obj);
  if (!v.ok) return v;
  return { ok: true, backup: obj, keys: v.keys, skipped: v.skipped, summary: v.summary };
}

/* Baca file pilihan pengunjung (input file) lalu validasi. */
export async function readBackupFile(file) {
  if (!file || typeof file.text !== 'function') return fail('file', COPY.INVALID);
  if (typeof file.size === 'number' && file.size > BACKUP_MAX_BYTES) return fail('too-big', COPY.TOO_BIG);
  let text;
  try { text = await file.text(); } catch { return fail('read', COPY.INVALID); }
  return parseBackupText(text);
}

export function confirmMessageFor(summary) {
  return `Pulihkan ${describeSummary(summary)} dari salinan ini? Data yang ada sekarang akan diganti.`;
}

export function restoredMessageFor(summary, skipped = []) {
  let msg = `Datamu sudah kembali: ${describeSummary(summary)}.`;
  if (skipped.length) msg += ` ${skipped.length} data sensitif tidak ikut dipulihkan.`;
  return msg;
}

/* Pulihkan salinan tervalidasi. Alur: validasi penuh -> ringkasan ->
   konfirmasi (pola confirm() S-F2) -> snapshot -> tulis -> bila gagal,
   rollback ke snapshot. TIDAK PERNAH menulis tanpa konfirmasi.
   confirmFn bisa di-inject (tes, atau dialog custom wiring); default
   confirm() bawaan. Bila tidak ada confirm yang tersedia, gagal
   tertutup (fail-closed): tidak ada yang ditulis.
   Mengembalikan { ok, summary, skipped, message } atau
   { ok: false, reason, message, rolledBack? }. */
export async function restoreBackup(parsed, { confirmFn = null } = {}) {
  const v = validateBackup(parsed);
  if (!v.ok) return { ok: false, reason: v.reason, message: v.message };
  const ask = confirmFn || (typeof confirm === 'function' ? confirm : null);
  if (!ask) return { ok: false, reason: 'no-confirm', message: COPY.NO_CONFIRM, summary: v.summary };
  let lanjut;
  try { lanjut = await ask(confirmMessageFor(v.summary)); } catch { lanjut = false; }
  if (!lanjut) return { ok: false, reason: 'cancelled', message: COPY.CANCELLED, summary: v.summary };
  const snapshot = new Map();
  for (const key of v.keys) {
    try { snapshot.set(key, localStorage.getItem(key)); } catch { snapshot.set(key, null); }
  }
  try {
    for (const key of v.keys) localStorage.setItem(key, parsed.data[key]);
  } catch {
    for (const [key, prev] of snapshot) {
      try {
        if (prev === null) localStorage.removeItem(key);
        else localStorage.setItem(key, prev);
      } catch { /* rollback terbaik; laporkan tetap gagal */ }
    }
    return { ok: false, reason: 'write-failed', message: COPY.WRITE_FAILED, rolledBack: true };
  }
  return { ok: true, summary: v.summary, skipped: v.skipped, message: restoredMessageFor(v.summary, v.skipped) };
}
