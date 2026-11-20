/* G-2 (v6.19.1) — pratinjau HTML user lewat /preview.html + postMessage.
 *
 * Pengganti iframe srcdoc langsung. srcdoc MEWARISI CSP dokumen induk,
 * sehingga begitu CSP ditegakkan, <script> inline di HTML user diblokir.
 * /preview.html adalah dokumen navigasi biasa dengan CSP SENDIRI yang
 * permisif (vercel.json, entri /preview.html), jadi skrip user tetap jalan.
 *
 * Model keamanan (jangan dilonggarkan tanpa review):
 * - Mode 'preview' (default): sandbox="allow-scripts" TANPA
 *   allow-same-origin -> origin OPAK. Kode user tidak bisa membaca
 *   localStorage/cookie/DOM origin utama, dan tidak bisa mencapai parent.
 * - Mode 'render' (HANYA untuk frame capture htmlvideo): sejak Blue-B
 *   (19 Nov 2026, perbaikan R-01) frame ini OPAK seperti mode preview —
 *   sandbox="allow-scripts" TANPA allow-same-origin. Postur lama
 *   (allow-same-origin) memberi JS user akses penuh origin situs
 *   (termasuk BYOK key di localStorage — terbukti P2 T3) demi capture
 *   piksel yang TERBUKTI tidak jalan di browser mana pun (P2 §8.1:
 *   drawImage(iframe) TypeError di Chromium + Firefox). Risiko murni
 *   tanpa imbalan — diturunkan ke opak, nol pengorbanan fungsional
 *   karena render HTML memang sudah gagal sebelum perubahan ini.
 *   Mode 'render' dipertahankan sebagai label (bukan postur berbeda)
 *   agar pemanggil tidak berubah; JANGAN kembalikan allow-same-origin.
 * - Setiap frame/tab diikat token sekali-pakai (?t=...) + origin check dua
 *   arah. Parent hanya menerima pesan 'at-preview-ready' dari
 *   frame.contentWindow yang sama (origin 'null' untuk frame opak adalah
 *   NORMAL — itulah bukti originnya opak).
 * - Tab baru dibuka TANPA noopener karena handle window dibutuhkan untuk
 *   postMessage; preview.html memutus window.opener sendiri sebelum kode
 *   user apa pun dimuat, jadi kode user tidak bisa mencapai tab induk.
 */

function randomToken() {
  // R-12 (Blue-B, 19 Nov 2026): gagal TERTUTUP bila crypto tidak tersedia —
  // fallback Math.random() lama dihapus (token mudah ditebak). Di browser
  // modern (secure context) jalur ini tidak pernah terpukul.
  if (window.crypto && typeof window.crypto.randomUUID === 'function') return window.crypto.randomUUID();
  if (window.crypto && window.crypto.getRandomValues) {
    const b = new Uint8Array(16);
    window.crypto.getRandomValues(b);
    return Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
  }
  throw new Error('crypto tidak tersedia — pratinjau dibatalkan');
}

/** URL absolut /preview.html relatif terhadap root aplikasi (jalan di domain
 *  root maupun subpath GitHub Pages /adip-tools/ karena base './'). */
export function previewPageUrl() {
  return new URL('preview.html', document.baseURI).href;
}

/** Buat iframe pratinjau. Kembalikan { frame, setHtml(html), dispose() }.
 *  setHtml() boleh dipanggil sebelum frame siap — HTML diantre dan dikirim
 *  begitu host membalas 'at-preview-ready'. */
export function createPreviewFrame(opts = {}) {
  const mode = opts.mode === 'render' ? 'render' : 'preview';
  const token = randomToken();
  const pageUrl = previewPageUrl();
  const origin = new URL(pageUrl).origin;
  const frame = document.createElement('iframe');
  // R-01 (Blue-B): KEDUA mode opak — allow-same-origin dihapus dari mode
  // render (lihat komentar header). allow-scripts tetap (skrip user jalan).
  frame.setAttribute('sandbox', 'allow-scripts');
  frame.setAttribute('referrerpolicy', 'no-referrer');

  let ready = false;
  let pending = null;
  let disposed = false;
  let fallbackTries = 0;
  // RACE FIX (v6.20.1): HTML terakhir yang diserahkan ke setHtml + penanda
  // fallback sudah menembak. Fallback 5 dtk TIDAK definitif: bila
  // preview.html/preview.js belum termuat saat fallback menembak, flush-nya
  // hilang ke frame yang belum siap mendengarkan. Saat 'at-preview-ready'
  // akhirnya tiba, HTML terakhir dikirim ULANG (idempotent — preview.js
  // hanya menimpa srcdoc yang sama, jadi kirim ganda tidak berbahaya).
  let lastHtml = null;
  let fallbackFired = false;

  const send = (html) => {
    if (!frame.contentWindow) return;
    // Target origin: frame OPAK serialisasinya 'null' — postMessage MENOLAK
    // targetOrigin 'null' (SyntaxError, terbukti di Chromium) dan menolak
    // origin situs (mismatch 'null'). '*' satu-satunya yang jalan untuk
    // frame opak; autentikasi tetap dipegang token + cek origin pengirim
    // di dalam preview.html. Sejak R-01 (Blue-B) KEDUA mode opak, jadi
    // target selalu '*' (dulu mode render same-origin memakai origin).
    frame.contentWindow.postMessage({ type: 'at-preview', token, mode, html }, '*');
  };
  const flush = () => {
    if (pending !== null) { send(pending); pending = null; }
  };
  // Pengaman: bila pesan ready hilang (tidak seharusnya terjadi — listener
  // dipasang sebelum src di-set), coba kirim juga setelah 5 detik. Dibatasi
  // 3x percobaan agar tidak berputar selamanya bila frame gagal dimuat.
  // CATATAN v6.20.1: tembakan ini TIDAK definitif — bila frame ternyata
  // belum siap, kirimannya hilang dan dikirim ulang saat ready tiba (lihat
  // onMsg). Jangan pernah menganggap fallback = frame siap.
  const armFallback = () => {
    setTimeout(() => {
      if (disposed || ready) return;
      fallbackTries++;
      if (frame.contentWindow) { fallbackFired = true; ready = true; flush(); }
      else if (fallbackTries < 3) armFallback();
    }, 5000);
  };
  const onMsg = (e) => {
    if (disposed) return;
    if (e.source !== frame.contentWindow) return;
    // Frame opak mengirim dengan origin 'null' — itu BUKTI opaknya, bukan
    // alasan menolak. Source check di atas yang mengikat pengirim.
    if (e.origin !== 'null' && e.origin !== origin) return;
    const d = e.data;
    if (!d || d.type !== 'at-preview-ready' || d.token !== token) return;
    ready = true;
    // RACE FIX (v6.20.1): bila fallback sudah menembak sebelum frame siap,
    // flush-nya hilang ke frame yang belum mendengarkan (pending sudah
    // terhapus) — kirim ulang HTML terakhir sekarang, saat frame BENAR-BENAR
    // siap. Bila fallback ternyata tidak hilang (frame sudah siap, hanya
    // pesan ready-nya yang telat), kirim ulang ini idempotent: preview.js
    // menimpa srcdoc dengan HTML yang sama. Flag dibersihkan supaya ready
    // duplikat tidak mengirim berulang.
    if (fallbackFired) {
      fallbackFired = false;
      if (lastHtml !== null) send(lastHtml);
    } else {
      flush();
    }
  };
  window.addEventListener('message', onMsg);
  frame.src = pageUrl + '?t=' + encodeURIComponent(token);
  armFallback();

  return {
    frame,
    setHtml(html) {
      if (disposed) return;
      lastHtml = html;
      if (ready) send(html);
      else pending = html;
    },
    dispose() {
      disposed = true;
      window.removeEventListener('message', onMsg);
      frame.remove();
    },
  };
}

/** Buka HTML user di tab baru lewat /preview.html (pengganti blob: URL —
 *  dokumen blob: mewarisi CSP pembuatnya sehingga skrip user ikut diblokir
 *  saat CSP ditegakkan). Kembalikan handle window, atau null bila pop-up
 *  diblokir (panggil onBlocked bila ada). */
export function openPreviewTab(html, opts = {}) {
  const token = randomToken();
  const pageUrl = previewPageUrl();
  const origin = new URL(pageUrl).origin;
  const w = window.open(pageUrl + '?t=' + encodeURIComponent(token), '_blank');
  if (!w) {
    if (typeof opts.onBlocked === 'function') opts.onBlocked();
    return null;
  }
  const onMsg = (e) => {
    if (e.source !== w) return;
    if (e.origin !== origin) return;
    const d = e.data;
    if (!d || d.type !== 'at-preview-ready' || d.token !== token) return;
    window.removeEventListener('message', onMsg);
    try { w.postMessage({ type: 'at-preview', token, mode: 'preview', html }, origin); } catch (err) { /* tab sudah ditutup */ }
  };
  window.addEventListener('message', onMsg);
  // Lepas listener bila tab tidak pernah siap (pengguna menutupnya cepat).
  setTimeout(() => window.removeEventListener('message', onMsg), 30000);
  return w;
}
