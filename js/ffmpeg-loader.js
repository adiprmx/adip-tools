// js/ffmpeg-loader.js: pemuat bersama ffmpeg.wasm untuk tool video/audio Adip Tools.
// Self-contained: tanpa import core.js atau file lokal lain, supaya bisa dipakai
// semua tool ffmpeg tanpa rantai dependensi. Hanya jalan di browser (butuh
// Worker, WebAssembly, fetch, dynamic import).
//
// ARSITEKTUR (final, 14 Nov 2026 — setelah 3 bug beruntun, semua dibuktikan
// di browser sungguhan; JANGAN diubah tanpa membaca riwayat ini):
//   - Kelas FFmpeg: build ESM dari CDN (dynamic import). Build UMD DITOLAK:
//     (1) @ffmpeg/util UMD memanggil require()/exports di browser -> global
//     tidak terbentuk; (2) FFmpeg UMD membuat Worker klasik dari chunk CDN
//     814.ffmpeg.js -> Chrome menolak Worker lintas-origin walau CDN kirim
//     CORS; (3) chunk 814 sebagai blob + module worker gagal karena chunk
//     UMD memakai importScripts (tidak ada di module worker) -> fallback
//     melempar "Cannot find module 'blob:...'".
//   - Worker: file ESM worker.js di-VENDOR same-origin (js/ffmpeg-worker/,
//     + const.js & errors.js yang di-import-nya) dan diteruskan sebagai
//     classWorkerURL absolut. Worker TIDAK BOLEH dari CDN (lintas-origin)
//     dan TIDAK BOLEH blob URL (import relatif ./const.js gagal resolve).
//   - Core: build ESM @ffmpeg/core (punya `export default`, wajib karena
//     module worker memuat core via import(), bukan importScripts), diunduh
//     jadi blob URL (pola resmi toBlobURL).
//   - fetchFile ditulis ulang lokal (fetchFileLokal) — @ffmpeg/util tidak
//     dipakai sama sekali.
// Core multi-thread (@ffmpeg/core-mt) sengaja TIDAK dipakai: butuh halaman
// cross-origin isolated yang hosting statis ini tidak sediakan.
// Referensi: https://ffmpegwasm.netlify.app/docs/getting-started/usage/
// Encoder yang tersedia di core ini (string konfigurasi build):
//   libx264, libx265, libvpx, libmp3lame, libtheora, libvorbis, libopus,
//   libwebp, libfreetype, libfribidi, libass, libzimg + encoder bawaan
//   FFmpeg (aac, flac, pcm_s16le, gif) dan filter palettegen/paletteuse.
//
// Versi pin (terverifikasi 14 Nov 2026 via jsDelivr, semua URL 200):
//   @ffmpeg/ffmpeg 0.12.15 (ESM) + @ffmpeg/core 0.12.10 (ESM, single-thread,
//   ~31 MB, TANPA SharedArrayBuffer, jadi jalan di hosting statis).

export const FFMPEG_VERSIONS = { ffmpeg: '0.12.15', core: '0.12.10' };

const CDN = 'https://cdn.jsdelivr.net/npm';
const URL_FFMPEG_ESM = CDN + '/@ffmpeg/ffmpeg@0.12.15/dist/esm/index.js';
const URL_CORE_JS = CDN + '/@ffmpeg/core@0.12.10/dist/esm/ffmpeg-core.js';
const URL_CORE_WASM = CDN + '/@ffmpeg/core@0.12.10/dist/esm/ffmpeg-core.wasm';
// Worker ESM yang di-vendor same-origin (lihat js/ffmpeg-worker/). URL-nya
// WAJIB di-resolve terhadap import.meta.url loader ini (bukan path absolut
// '/js/...' dan bukan location.href): preview GitHub Pages hidup di subpath
// /adip-tools/, jadi path absolut '/js/...' mengarah ke root domain dan 404
// (bug nyata 15 Nov 2026: worker 404 -> FFmpeg tidak mendengarkan error
// worker -> load() diam selamanya -> timeout 90 detik tanpa pesan jelas).
// import.meta.url benar di preview (subpath) maupun produksi (domain root).
const WORKER_URL = new URL('./ffmpeg-worker/worker.js', import.meta.url).href;

// Pengganti lokal fetchFile dari @ffmpeg/util (lihat catatan di atas).
// File/Blob -> Uint8Array via FileReader; string URL/data URI -> fetch.
export async function fetchFileLokal(data) {
  if (typeof data === 'string') {
    const m = data.match(/^data:_data\/([a-zA-Z]*);base64,(.*)$/);
    if (m) {
      const bin = atob(m[2]);
      const out = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
      return out;
    }
    return new Uint8Array(await (await fetch(data)).arrayBuffer());
  }
  if (data instanceof URL) return new Uint8Array(await (await fetch(data)).arrayBuffer());
  if (data instanceof File || data instanceof Blob) {
    return new Uint8Array(await new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result instanceof ArrayBuffer ? r.result : new Uint8Array());
      r.onerror = () => reject(new Error('File tidak bisa dibaca.'));
      r.readAsArrayBuffer(data);
    }));
  }
  return new Uint8Array();
}

// Ukuran mesin yang diunduh sekali (~31 MB, angka dari dokumentasi resmi
// ffmpeg.wasm, bukan perkiraan). Dipakai untuk label jujur di UI.
export const CORE_SIZE_LABEL = 'sekitar 31 MB';

let instance = null;      // instance FFmpeg yang sedang hidup
let loadPromise = null;   // janji load yang sedang berjalan (anti dobel)
let ffmpegClass = null;   // kelas FFmpeg hasil dynamic import ESM (di-cache)
let coreBlobs = null;     // { coreURL, wasmURL } blob URL, dipertahankan antar load
let loadAbort = null;     // AbortController untuk fase unduh
let runCancel = null;     // penolak janji run yang sedang berjalan
let lastLogLine = '';     // baris log terakhir, untuk pesan error yang jelas

export function cancelledError() {
  const e = new Error('Dibatalkan');
  e.code = 'BATAL';
  return e;
}
export function isCancelled(err) {
  return !!err && (err.code === 'BATAL' || err.name === 'AbortError');
}

// Cek dukungan browser sebelum mengunduh apa pun. Mengembalikan
// { ok: true } atau { ok: false, reason } dengan alasan berbahasa Indonesia.
export function supportsFFmpeg() {
  if (typeof window === 'undefined') return { ok: false, reason: 'Kode ini hanya jalan di browser.' };
  if (typeof WebAssembly === 'undefined') return { ok: false, reason: 'Browser ini tidak mendukung WebAssembly. Coba Chrome, Edge, Firefox, atau Safari versi terbaru.' };
  if (typeof Worker === 'undefined') return { ok: false, reason: 'Browser ini tidak mendukung Web Worker. Coba Chrome, Edge, Firefox, atau Safari versi terbaru.' };
  if (typeof Blob === 'undefined' || typeof URL === 'undefined' || !URL.createObjectURL) return { ok: false, reason: 'Browser ini tidak mendukung Blob URL. Coba perbarui browsermu.' };
  if (typeof fetch === 'undefined') return { ok: false, reason: 'Browser ini tidak mendukung fetch. Coba perbarui browsermu.' };
  return { ok: true };
}

// Dynamic import modul ESM dari CDN dengan timeout. Melempar Error
// berbahasa Indonesia bila gagal / habis waktu.
async function importModule(src, timeoutMs) {
  let timer = null;
  try {
    const done = import(/* @vite-ignore */ src);
    const timeout = new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error('Waktu habis saat mengunduh ' + src)), timeoutMs || 30000);
    });
    return await Promise.race([done, timeout]);
  } catch (e) {
    if (/Waktu habis/.test(e && e.message)) throw e;
    throw new Error('Gagal mengunduh ' + src + ' (' + (e && e.message ? e.message : 'kesalahan jaringan') + ')');
  } finally {
    if (timer) clearTimeout(timer);
  }
}

// Unduh satu file jadi blob URL, dengan laporan progres byte.
// onBytes(loaded, total|null). Mengembalikan blob URL.
async function fetchBlobURL(url, mime, onBytes, signal) {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error('Server mengembalikan kode ' + res.status + ' untuk ' + url);
  const total = +(res.headers.get('content-length') || 0) || null;
  if (!res.body || typeof res.body.getReader !== 'function') {
    const blob = await res.blob();
    if (onBytes) onBytes(blob.size, total || blob.size);
    return URL.createObjectURL(new Blob([blob], { type: mime }));
  }
  const reader = res.body.getReader();
  const chunks = [];
  let loaded = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    loaded += value.byteLength;
    if (onBytes) onBytes(loaded, total);
  }
  return URL.createObjectURL(new Blob(chunks, { type: mime }));
}

// Muat (atau pakai ulang) instance ffmpeg.
// onStage dipanggil dengan { stage, pct, label }:
//   stage 'mesin'  = mengunduh wrapper JS (kecil)
//   stage 'unduh'  = mengunduh mesin ~31 MB, pct 0-100 bila total diketahui
//   stage 'siap'   = memuat mesin ke memori
// Mengembalikan { ffmpeg, fetchFile }. Melempar Error berbahasa Indonesia
// bila gagal, atau error code 'BATAL' bila dibatalkan lewat cancelFFmpeg().
export function loadFFmpeg(onStage) {
  if (instance) return Promise.resolve({ ffmpeg: instance, fetchFile: fetchFileLokal });
  if (loadPromise) return loadPromise;
  const report = (stage, pct, label) => { if (onStage) { try { onStage({ stage, pct, label }); } catch (e) {} } };
  loadPromise = (async () => {
    const sup = supportsFFmpeg();
    if (!sup.ok) throw new Error(sup.reason);
    loadAbort = new AbortController();
    const signal = loadAbort.signal;
    try {
      report('mesin', 0, 'Menyiapkan mesin…');
      if (!ffmpegClass) {
        const mod = await importModule(URL_FFMPEG_ESM, 30000);
        if (!mod || !mod.FFmpeg) throw new Error('Mesin gagal dimuat dari internet. Cek koneksi lalu coba lagi.');
        ffmpegClass = mod.FFmpeg;
      }
      if (!coreBlobs) {
        // Unduh inti mesin (ESM) dengan progres, jadi blob URL (pola resmi
        // toBlobURL). Core ESM wajib: module worker memuat core via
        // import(), dan hanya build ESM yang punya `export default`.
        report('unduh', 0, 'Mengunduh mesin (' + CORE_SIZE_LABEL + ')…');
        const coreURL = await fetchBlobURL(URL_CORE_JS, 'text/javascript', null, signal);
        const wasmURL = await fetchBlobURL(URL_CORE_WASM, 'application/wasm', (loaded, total) => {
          // content-length CDN adalah ukuran TERKOMPRESI (~7 MB) sementara
          // loaded menghitung byte hasil dekompresi (~31 MB) — persen bisa
          // tembus 100% bila tidak dibatasi, jadi dibatasi di 100.
          const pct = total ? Math.min(100, Math.round((loaded / total) * 100)) : 0;
          report('unduh', pct, total && loaded <= total
            ? 'Mengunduh mesin ' + pct + '% (' + (loaded / 1048576).toFixed(1) + ' dari ' + (total / 1048576).toFixed(1) + ' MB)…'
            : 'Mengunduh mesin (' + (loaded / 1048576).toFixed(1) + ' MB)…');
        }, signal);
        coreBlobs = { coreURL, wasmURL };
      }
      report('siap', 0, 'Memuat mesin ke memori…');
      const ffmpeg = new ffmpegClass();
      ffmpeg.on('log', ({ message }) => { if (message) lastLogLine = String(message).slice(-300); });
      // Worker ESM same-origin yang di-vendor (URL absolut hasil resolve
      // terhadap import.meta.url — lihat catatan WORKER_URL di atas).
      const loaded = ffmpeg.load({ classWorkerURL: WORKER_URL, coreURL: coreBlobs.coreURL, wasmURL: coreBlobs.wasmURL });
      const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Mesin lama dimuat. Coba muat ulang halaman ini, atau pakai Chrome versi terbaru.')), 90000));
      await Promise.race([loaded, timeout]);
      instance = ffmpeg;
      return { ffmpeg, fetchFile: fetchFileLokal };
    } catch (e) {
      if (isCancelled(e) || (signal && signal.aborted)) throw cancelledError();
      throw e;
    } finally {
      loadAbort = null;
      loadPromise = null;
    }
  })();
  return loadPromise;
}

// Jalankan satu perintah ffmpeg. onProgress menerima 0-1 (bisa tetap 0 bila
// durasi tidak terbaca, mis. langkah pembuatan palet GIF).
// Resolve dengan kode keluar 0; reject bila kode bukan 0 (pesan berisi baris
// log terakhir) atau bila dibatalkan lewat cancelFFmpeg().
export function runFFmpeg(ffmpeg, args, onProgress) {
  return new Promise((resolve, reject) => {
    let done = false;
    const onP = (ev) => {
      if (!onProgress) return;
      const p = ev && typeof ev.progress === 'number' ? ev.progress : 0;
      onProgress(Math.max(0, Math.min(1, p || 0)));
    };
    ffmpeg.on('progress', onP);
    const finish = (fn, val) => {
      if (done) return;
      done = true;
      try { ffmpeg.off('progress', onP); } catch (e) {}
      if (runCancel === cancelMe) runCancel = null;
      fn(val);
    };
    const cancelMe = () => finish(reject, cancelledError());
    runCancel = cancelMe;
    ffmpeg.exec(args).then((code) => {
      if (code === 0) finish(resolve, code);
      else finish(reject, new Error('Proses gagal (kode ' + code + ')' + (lastLogLine ? ': ' + lastLogLine : '')));
    }).catch((e) => finish(reject, e));
  });
}

// Batalkan apa pun yang sedang berjalan: unduhan mesin atau proses.
// Instance dimatikan; load berikutnya membuat instance baru (blob URL mesin
// dipertahankan, jadi tidak mengunduh ulang ~31 MB).
export function cancelFFmpeg() {
  if (loadAbort) { try { loadAbort.abort(); } catch (e) {} }
  if (runCancel) { const c = runCancel; runCancel = null; c(); }
  if (instance) { try { instance.terminate(); } catch (e) {} instance = null; }
  loadPromise = null;
}

// Hapus file dari memori virtual ffmpeg; gagal diabaikan.
export async function cleanupFFmpeg(ffmpeg, names) {
  for (const n of names || []) {
    try { await ffmpeg.deleteFile(n); } catch (e) {}
  }
}

// Ubah error teknis jadi pesan yang bisa dipahami pengguna.
export function friendlyError(err) {
  if (isCancelled(err)) return 'Dibatalkan.';
  const m = (err && err.message) || String(err || '');
  if (/network|fetch|Failed to fetch|Load failed|ERR_/i.test(m)) return 'Tidak bisa mengunduh mesin dari internet. Cek koneksi lalu coba lagi.';
  if (/memory|out of memory|OOM|wasm|WebAssembly/i.test(m)) return 'Memori browser tidak cukup untuk file ini. Coba file yang lebih kecil atau tutup tab lain.';
  if (/Invalid data|Invalid argument|moov atom not found|could not find/i.test(m)) return 'File ini tidak bisa dibaca sebagai video/audio. Coba file lain.';
  if (/Unknown encoder|Encoder .* not found/i.test(m)) return 'Format ini tidak didukung mesin di browser ini.';
  return m || 'Terjadi kesalahan yang tidak diketahui.';
}
