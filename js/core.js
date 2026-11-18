/* ADIP Tools — core module (ESM).
 * Menyediakan: helper UI (h), daftar kategori (cats), registry tools (tools),
 * fungsi murni berbagi antar tool (utils), dan callback cleanup (leaveCbs).
 *
 * Kontrak untuk modul tools:
 *   import { h as T, tools, utils } from './core.js';
 *   tools.push({ id:'contoh', name:'Contoh', cat:'converter', icon:'🔧',
 *     desc:'Deskripsi singkat satu baris.',
 *     render(root){ root.appendChild(T.el('<p>Halo</p>')); } });
 * Aturan: render(root) membangun DOM di dalam root memakai helper T.
 * Jangan akses document.body langsung. Bersihkan timer/audio via T.onLeave(fn).
 * Fungsi murni yang dipakai >1 tool didaftarkan di utils (bukan duplikat).
 */
export const cats = [
  ['keamanan', 'Keamanan'],
  ['converter', 'Converter'],
  ['developer', 'Developer'],
  ['desain', 'Desain'],
  ['indonesia', 'Indonesia'],
  ['musik', 'Musik & Audio'],
  ['gambar', 'Gambar'],
  ['teks', 'Teks'],
  ['bisnis', 'Bisnis'],
  ['sehari', 'Sehari-hari'],
  ['fun', 'Fun'],
  ['produktivitas', 'Produktivitas'],
  ['pelajar', 'Pelajar'],
  ['liveapi', 'Live API'],
  ['fakesos', 'Fake Sosmed'],
  ['kesehatan', 'Kesehatan'],
  ['kreator', 'Kreator'],
  ['masak', 'Masak'],
  ['travel', 'Travel'],
];

/** Registry semua tool — diisi modul tools via tools.push({...}). */
export const tools = [];
/** Fungsi murni yang dipakai >1 tool — diisi modul tools via utils.nama = fn. */
export const utils = {};
/** Callback cleanup saat pindah halaman — via onLeave(fn). */
export const leaveCbs = [];

const escMap = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => escMap[c]);
}

export function el(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

export function toast(msg) {
  let n = document.querySelector('.toast');
  if (!n) {
    n = document.createElement('div');
    n.className = 'toast';
    n.setAttribute('role', 'status');
    document.body.appendChild(n);
  }
  n.textContent = msg;
  n.classList.add('show');
  clearTimeout(n._t);
  n._t = setTimeout(() => n.classList.remove('show'), 2200);
}

export function copy(text) {
  const done = () => toast('Tersalin!');
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(String(text)).then(done, () => fallback());
  } else fallback();
  function fallback() {
    const ta = document.createElement('textarea');
    ta.value = String(text);
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); done(); } catch (e) { toast('Gagal menyalin, coba lagi'); }
    ta.remove();
  }
}

export function dl(filename, content, mime) {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mime || 'text/plain;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}

const fmtN = new Intl.NumberFormat('id-ID');
// P4-08: Intl mencetak nilai finite raksasa penuh digit demi digit
// (1e300 = 300+ karakter di UI). Di atas 1e21, pakai notasi eksponen
// singkat ("1e+300") — informasinya utuh, panjangnya terkunci.
// Ambang 1e21 aman untuk semua tampilan wajar (rumah/sewa maks ~1e16).
const fmtEksponen = (v) => String(v).replace('.', ',');
// Angka di luar jangkauan (Infinity/NaN) tidak boleh tampil sebagai "∞"
// atau "NaN" yang menyesatkan (P4-04: sisa kelas RT2-08 di jalur T.fmt —
// T.rp sudah dimitigasi di P2, T.fmt disamakan di sini).
export function fmt(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return 'di luar jangkauan';
  if (Math.abs(v) >= 1e21) return fmtEksponen(v);
  return fmtN.format(v);
}
// Angka di luar jangkauan (Infinity/NaN) tidak boleh tampil sebagai "Rp∞"
// atau "Rp0" yang menyesatkan — tampilkan pesan jujur.
export function rp(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return 'di luar jangkauan';
  if (Math.abs(v) >= 1e21) return 'Rp' + fmtEksponen(Math.round(v));
  return 'Rp' + fmtN.format(Math.round(v || 0));
}

// Parse angka ala Indonesia: "1.500.000,50" -> 1500000.5 ; "1.500" -> 1500 ; "1.5" -> 1.5
export function num(v) {
  if (typeof v === 'number') return v;
  let s = String(v == null ? '' : v).trim().replace(/\s/g, '');
  if (!s) return NaN;
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  else if (/^[+-]?\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
  const n = Number(s);
  return n;
}

export function btn(label, onClick, primary, disabled) {
  const b = el(`<button type="button" class="btn${primary ? ' primary' : ''}">${esc(label)}</button>`);
  if (disabled) b.disabled = true;
  b.addEventListener('click', onClick);
  return b;
}

export function field(labelText, inputEl, hint) {
  const f = el('<div class="fld"></div>');
  if (!inputEl.id) inputEl.id = 'f' + Math.random().toString(36).slice(2, 9);
  const lb = el(`<label for="${inputEl.id}">${esc(labelText)}</label>`);
  f.appendChild(lb);
  f.appendChild(inputEl);
  if (hint) f.appendChild(el(`<div class="hint">${esc(hint)}</div>`));
  return f;
}

export function input(type, placeholder, value) {
  const i = document.createElement('input');
  i.className = 'inp';
  i.type = type || 'text';
  if (placeholder) i.placeholder = placeholder;
  if (value != null) i.value = value;
  if (type === 'number' || type === 'text') i.inputMode = type === 'number' ? 'decimal' : 'text';
  return i;
}

export function select(pairs, value) {
  const s = el('<select class="inp"></select>');
  pairs.forEach(([v, l]) => {
    const o = document.createElement('option');
    o.value = v; o.textContent = l;
    if (String(v) === String(value)) o.selected = true;
    s.appendChild(o);
  });
  return s;
}

export function ta(rows, placeholder, value) {
  const t = document.createElement('textarea');
  t.className = 'inp';
  t.rows = rows || 4;
  if (placeholder) t.placeholder = placeholder;
  if (value != null) t.value = value;
  return t;
}

export function out() {
  const d = el('<div class="out" hidden></div>');
  d.setAttribute('aria-live', 'polite');
  return d;
}
export function show(box, html) {
  box.hidden = false;
  box.innerHTML = html;
}
export function hide(box) { box.hidden = true; box.innerHTML = ''; }

export function copyBtn(getText, label) {
  const b = btn(label || 'Salin', null);
  const orig = b.textContent;
  b.addEventListener('click', () => {
    const t = getText();
    if (t == null || String(t) === '') { toast('Belum ada yang bisa disalin nih'); return; }
    const done = () => {
      b.textContent = '✓ Tersalin';
      b.classList.add('done');
      clearTimeout(b._rt);
      b._rt = setTimeout(() => { b.textContent = orig; b.classList.remove('done'); }, 1600);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(String(t)).then(done, () => fallback());
    } else fallback();
    function fallback() {
      const ta = document.createElement('textarea');
      ta.value = String(t);
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); done(); } catch (e) { toast('Gagal menyalin'); }
      ta.remove();
    }
  });
  return b;
}

export function dlBtn(filename, getContent, mime, label) {
  return btn(label || 'Unduh', () => dl(filename, getContent(), mime));
}

/* PNG export untuk fake-sosmed: render node DOM -> PNG via html2canvas (CDN).
   Dipakai >1 tool (10 tools fakesos), jadi tinggal di core.js per kontrak. */
const H2C_CDN = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
export async function dlNodePng(node, filename) {
  const ok = await loadScript(H2C_CDN);
  if (!ok || typeof window.html2canvas !== 'function') { toast('Gagal memuat pustaka export. Cek koneksi lalu coba lagi.'); return false; }
  // html2canvas mengabaikan backdrop-filter: pakai class png-export agar CSS tool
  // mengganti efek kaca jadi background solid selama capture; dihapus lagi di finally
  // supaya preview DOM normal tidak terpengaruh (termasuk bila capture gagal).
  const hasCls = !!(node && node.classList);
  if (hasCls) { node.classList.add('png-export'); void node.offsetHeight; } // paksa reflow: override CSS harus terpasang sebelum capture
  try {
    const canvas = await window.html2canvas(node, { backgroundColor: null, scale: 2, useCORS: true, logging: false });
    const blob = await canvasToBlob(canvas, 'image/png');
    if (!blob) { toast('Gagal membuat PNG.'); return false; }
    dl(filename || 'fake.png', blob, 'image/png');
    return true;
  } catch (e) { toast('Gagal export: ' + (e && e.message ? e.message : e)); return false; }
  finally { if (hasCls) node.classList.remove('png-export'); }
}

/* Scroll ke preview setelah tombol "Contoh" dimuat (di HP user langsung lihat hasil).
   Guard: tidak error bila elemen preview belum ada / belum di-render. */
export function scrollToPreview(elm) {
  try { if (elm && typeof elm.scrollIntoView === 'function') elm.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e) {}
}

export function row(...children) {
  const r = el('<div class="row"></div>');
  children.forEach((c) => c && r.appendChild(c));
  return r;
}

export function grid2(...children) {
  const g = el('<div class="grid2"></div>');
  children.forEach((c) => c && g.appendChild(c));
  return g;
}

export function onLeave(fn) { leaveCbs.push(fn); }

// Shared AudioContext (dibuat saat user gesture pertama)
let _actx = null;
export function actx() {
  if (!_actx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    _actx = new AC();
  }
  if (_actx.state === 'suspended') { const r = _actx.resume(); if (r && r.catch) r.catch(() => {}); }
  return _actx;
}
export function beep(freq, dur, type, delay) {
  try {
    const c = actx(), t = c.currentTime + (delay || 0);
    const o = c.createOscillator(), g = c.createGain();
    o.type = type || 'sine'; o.frequency.value = freq || 440;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.5, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + (dur || 0.2));
    o.connect(g); g.connect(c.destination);
    o.start(t); o.stop(t + (dur || 0.2) + 0.05);
  } catch (e) { /* audio tidak tersedia */ }
}

// Pasang handler error pada <img data-err="hide|remove"> TANPA atribut
// handler inline di string HTML (atribut handler inline diblokir CSP
// script-src tanpa 'unsafe-inline'). Panggil sesaat setelah HTML dimasukkan ke DOM —
// event error gambar selalu asinkron, jadi wiring sinkron tidak pernah
// ketinggalan. Dipakai meta-generator, apod-harian, cari-buku,
// resep-makanan (P5 v6.12.2).
export function wireImgErr(container) {
  if (!container || !container.querySelectorAll) return;
  container.querySelectorAll('img[data-err]').forEach((im) => {
    if (im.dataset.errWired) return;
    im.dataset.errWired = '1';
    im.addEventListener('error', () => {
      if (im.dataset.err === 'remove') im.remove();
      else im.style.display = 'none';
    });
  });
}

// Muat script CDN sekali, resolve true/false.
// Janji disimpan (bukan status string): pemanggil bersamaan ikut menunggu
// janji yang sama, dan kegagalan tidak di-cache — tombol "Coba Lagi" bisa
// mencoba jaringan lagi (T02 B2, v6.12.0).
/* ---- Subresource Integrity (SRI) untuk script CDN klasik (P5 v6.12.2) ----
   Hash SHA-384 dari isi file yang diunduh langsung dari CDN pada 16 Nov 2026
   (bukti: p5-sri-hashes.json di folder ronde). docx@8.5.0 ditambahkan
   18 Nov 2026 (RED-02, G1) — hash diverifikasi dari 3 sumber independen
   (jsDelivr + unpkg + tarball registry npm), ketiganya identik. loadScript() memasang
   integrity + crossorigin="anonymous" bila URL-nya ada di peta ini; URL yang
   tidak ada di peta tetap dimuat seperti biasa (tanpa integrity).
   TIDAK tercakup (keterbatasan browser, bukan kelalaian): import() ESM
   dinamis (ffmpeg, mp4-muxer, tasks-vision, smol-toml, fast-xml-parser,
   background-removal, potrace) — tidak ada mekanisme integrity untuk
   dynamic import; worker (pdf.worker.min.js, tesseract) — Worker tidak
   mendukung integrity; SDK Puter (js.puter.com/v2/ — tanpa versi, isinya
   bisa berubah sewaktu-waktu); file yang diambil via fetch (WASM, font,
   core ffmpeg) — pemuatannya ada di dalam pustaka pihak ketiga. Bila versi
   pustaka di-bump, hash WAJIB dihitung ulang (p5-sri-hash.py). */
const SRI_HASH = {
  'https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation@0.1.1675465747/selfie_segmentation.js': 'sha384-J/3LshwuX+2viPOY3En4QiZvdvlffDhZYH5MsMuLGdwcoGcYSA7EV1jXFsys0gIb',
  'https://cdn.jsdelivr.net/npm/bcryptjs@2.4.3/dist/bcrypt.min.js': 'sha384-qGFE4FIJLgCFuYs3nzg39XpCtvT5AZUhaBdjB3e1+vpKQa03AkyWOyBSFb9OcQ/g',
  'https://cdn.jsdelivr.net/npm/crypto-js@4.2.0/core.js': 'sha384-3A37xiTEGc3Zqy86dMabK6n4gI2IlaxQCzFvIqYkGIQo9cjViBef01VB+M2rxrGN',
  'https://cdn.jsdelivr.net/npm/crypto-js@4.2.0/md5.js': 'sha384-d1CObtu+m84BOBkhvh9UQrgQroe5v+Evl4ljDWwExrtFCXWmms0hzTsuP3d7N/fs',
  'https://cdn.jsdelivr.net/npm/crypto-js@4.2.0/ripemd160.js': 'sha384-5JJi32IV0QXIQJZgizc0cpkpnC5VB+JdRI3EOP8Gqjd1DjvqqNVYhzI9vrdrnFjx',
  'https://cdn.jsdelivr.net/npm/crypto-js@4.2.0/sha224.js': 'sha384-WIvzLGDZGRa/39EpDkqPhFiganB9X/V33oSv5/sX86gQqYH2z+j2FuIOJh5m7Gm+',
  'https://cdn.jsdelivr.net/npm/crypto-js@4.2.0/sha256.js': 'sha384-LPPFe0O6zZ1MvB0WgJxODyqtDrbtP7yQfidEE/rU29peFuxGudufuPYIxWrD9vnj',
  'https://cdn.jsdelivr.net/npm/docx@8.5.0/build/index.umd.js': 'sha384-4xaIisuLEy2lo2HkB2C4rEf7v8jbTb2kuogX6TkuEt9feTWKBSFSOzsqNNbV+sKh',
  'https://cdn.jsdelivr.net/npm/exifreader@4.23.5/dist/exif-reader.js': 'sha384-lV3Kc4L1YkqB4DCasecdSWo5RQEXp9Mc9eeiV6opSzVKpk2Id2jELgNodSyTCDqq',
  'https://cdn.jsdelivr.net/npm/heic2any@0.0.4/dist/heic2any.min.js': 'sha384-OTofQ0MEeiSgh62havBcemCIK0gqj809wX6UA0uPISNMRnR6NZyCdGzX3SbLrgwL',
  'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js': 'sha384-ZZ1pncU3bQe8y31yfZdMFdSpttDoPmOZg2wguVK9almUodir1PghgT0eY7Mrty8H',
  'https://cdn.jsdelivr.net/npm/js-sha3@0.9.3/build/sha3.min.js': 'sha384-+JAeTqUiH9WuByObPHouP4rQKYUTLQ9AQW4HHJZ4uNmkA2+nkDpbssQNGsVXnJpe',
  'https://cdn.jsdelivr.net/npm/js-yaml@4.1.0/dist/js-yaml.min.js': 'sha384-+pxiN6T7yvpryuJmE1gM9PX7yQit15auDb+ZwwvJOd/4be2Cie5/IuVXgQb/S9du',
  'https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js': 'sha384-Kk5SjBOKprEnGfyBWfD2zROFd1Cu8kwOXxG2GIhYPcoDL2rBJS9P8Ud1ZMy4412a',
  'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js': 'sha384-JcnsjUPPylna1s1fvi1u12X5qjY5OL56iySh75FdtrwhO/SWXgMjoVqcKyIIWOLk',
  'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js': 'sha384-b5Ya4Bq3qCyz39m2ISh+4DxjAIljdeFwK/BsXLuj9gugaNwAcj/ia15fxNZL9Nlx',
  'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js': 'sha384-+mbV2IY1Zk/X1p/nWllGySJSUN8uMs+gUAN10Or95UBH0fpj6GfKgPmgC5EXieXG',
  'https://cdn.jsdelivr.net/npm/jszip@3.10.2/dist/jszip.min.js': 'sha384-DdGlNq+wVXAn83gXqwyeFHB7iyXy6L0rLrNzgDmhKWPjiJLg9vj6qosYmZmkMfQ+',
  'https://cdn.jsdelivr.net/npm/marked@12.0.2/marked.min.js': 'sha384-/TQbtLCAerC3jgaim+N78RZSDYV7ryeoBCVqTuzRrFec2akfBkHS7ACQ3PQhvMVi',
  'https://cdn.jsdelivr.net/npm/opentype.js@1.3.4/dist/opentype.min.js': 'sha384-3TaxGqyHrMuRIWY5Z5WHNIzgNRqGIUJE+mk6tm+g1wkm9Ux2kUyOLfy9AsNWXA6u',
  'https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js': 'sha384-weMABwrltA6jWR8DDe9Jp5blk+tZQh7ugpCsF3JwSA53WZM9/14PjS5LAJNHNjAI',
  'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js': 'sha384-/1qUCSGwTur9vjf/z9lmu/eCUYbpOTgSjmpbMQZ1/CtX2v/WcAIKqRv+U1DUCG6e',
  'https://cdn.jsdelivr.net/npm/qrcode@1.4.4/build/qrcode.min.js': 'sha384-0RsG1yo/crf/1Qc14sho26SXXOTngNCjgJw7fuvXBt9W/OChF/Ijx+aUuBDqQwEk',
  'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js': 'sha384-GJqSu7vueQ9qN0E9yLPb3Wtpd7OrgK8KmYzC8T1IysG1bcvxvIO4qtYR/D3A991F',
  'https://cdn.jsdelivr.net/npm/utif@3.1.0/UTIF.js': 'sha384-RyBmXHdfZ/Uon+ud+/AqSyWpUWnKYt2tkRG/P4gWoRUGDU+qIAV3tGBPNlYTBZEF',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js': 'sha384-ZZ1pncU3bQe8y31yfZdMFdSpttDoPmOZg2wguVK9almUodir1PghgT0eY7Mrty8H',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js': 'sha384-JcnsjUPPylna1s1fvi1u12X5qjY5OL56iySh75FdtrwhO/SWXgMjoVqcKyIIWOLk',
  'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js': 'sha384-+mbV2IY1Zk/X1p/nWllGySJSUN8uMs+gUAN10Or95UBH0fpj6GfKgPmgC5EXieXG',
  'https://cdnjs.cloudflare.com/ajax/libs/marked/12.0.2/marked.min.js': 'sha384-/TQbtLCAerC3jgaim+N78RZSDYV7ryeoBCVqTuzRrFec2akfBkHS7ACQ3PQhvMVi',
  'https://unpkg.com/jspdf@2.5.1/dist/jspdf.umd.min.js': 'sha384-JcnsjUPPylna1s1fvi1u12X5qjY5OL56iySh75FdtrwhO/SWXgMjoVqcKyIIWOLk',
};
// Cari hash untuk sebuah URL script (query string diabaikan — retry
// heic-ke-jpg menambahkan ?coba=N ke URL yang isinya identik).
export function scriptIntegrity(src) {
  if (!src) return null;
  return SRI_HASH[String(src).split('?')[0]] || null;
}

const _loaded = {};
export function loadScript(src) {
  if (_loaded[src]) return _loaded[src];
  const p = new Promise((resolve) => {
    const s = document.createElement('script');
    s.src = src; s.async = true;
    const hash = scriptIntegrity(src);
    if (hash) { s.integrity = hash; s.crossOrigin = 'anonymous'; }
    s.onload = () => resolve(true);
    s.onerror = () => { delete _loaded[src]; resolve(false); };
    document.head.appendChild(s);
  });
  _loaded[src] = p;
  return p;
}

/** Namespace kompatibel pola lama (const T = NS.h) — cukup import { h as T }. */
export const h = {
  el, esc, btn, field, input, select, ta, out, show, hide,
  copy, copyBtn, dl, dlBtn, toast, row, grid2, onLeave,
  fmt, rp, num, actx, beep, loadScript, sysbar, scrollToPreview,
  calcResult, nextSteps, zipFiles, dlZip, zipBtn, crc32, wireImgErr,
  scriptIntegrity,
};

/* ---- Status bar HP per platform & merk (dipakai tool fake sosmed) ----
   iPhone = Dynamic Island; Android = punch-hole + ikon gaya tiap merk. */
const SYSBAR_FONTS = {
  iphone: '-apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",Roboto,Helvetica,Arial,sans-serif',
  xiaomi: '"MiSans","Segoe UI",system-ui,Roboto,Helvetica,Arial,sans-serif',
  samsung: '"One UI Sans","Segoe UI",system-ui,Roboto,Helvetica,Arial,sans-serif',
  oppo: 'system-ui,"Segoe UI",Roboto,Helvetica,Arial,sans-serif',
  vivo: 'system-ui,"Segoe UI",Roboto,Helvetica,Arial,sans-serif',
  realme: 'system-ui,"Segoe UI",Roboto,Helvetica,Arial,sans-serif',
  oneplus: 'system-ui,"Segoe UI",Roboto,Helvetica,Arial,sans-serif',
  infinix: 'system-ui,"Segoe UI",Roboto,Helvetica,Arial,sans-serif',
  tecno: 'system-ui,"Segoe UI",Roboto,Helvetica,Arial,sans-serif',
  motorola: 'system-ui,"Segoe UI",Roboto,Helvetica,Arial,sans-serif',
  nothing: 'system-ui,"Segoe UI",Roboto,Helvetica,Arial,sans-serif',
  pixel: 'Roboto,system-ui,"Segoe UI",Helvetica,Arial,sans-serif',
  huawei: '"HarmonyOS Sans",system-ui,"Segoe UI",Roboto,Helvetica,Arial,sans-serif',
  honor: 'system-ui,"Segoe UI",Roboto,Helvetica,Arial,sans-serif',
};

/* --- pembangun ikon kecil --- */
function sbBars(list, vbw) {
  var r = '';
  list.forEach(function(b) { r += '<rect x="' + b[0] + '" y="' + b[1] + '" width="' + b[2] + '" height="' + b[3] + '" rx="' + b[4] + '"/>'; });
  return '<svg width="' + vbw + '" height="12" viewBox="0 0 ' + vbw + ' 12" fill="currentColor" aria-hidden="true">' + r + '</svg>';
}
var SB_SIG = {
  chunky: function() { return sbBars([[0,7,3.6,5,.8],[4.9,4.5,3.6,7.5,.8],[9.8,2,3.6,10,.8],[14.7,0,3.3,12,.8]], 18); },
  round: function() { return sbBars([[0,7,3.4,5,1.7],[5,4.5,3.4,7.5,1.7],[10,2,3.4,10,1.7],[15,0,3.4,12,1.7]], 19); },
  sharp: function() { return sbBars([[0,8.5,3,3.5,.4],[4.5,6,3,6,.4],[9,3,3,9,.4],[13.5,0,3,12,.4]], 17); },
  slim: function() { return sbBars([[0,8,2.2,4,.4],[3.8,5.5,2.2,6.5,.4],[7.6,3,2.2,9,.4],[11.4,.5,2.2,11.5,.4]], 16); },
  med: function() { return sbBars([[0,8.2,3,3.8,.6],[4.4,5.8,3,6.2,.6],[8.8,3.2,3,8.8,.6],[13.2,.6,3,11.4,.6]], 17); },
  std: function() { return sbBars([[0,8,3,4,.6],[4.4,5.5,3,6.5,.6],[8.8,3,3,9,.6],[13.2,.5,3,11.5,.6]], 17); },
};
var SB_WIFI = {
  std: '<svg width="16" height="12" viewBox="0 0 16 12" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><path d="M1.5 4.5a10 10 0 0 1 13 0"/><path d="M4.2 7a6.2 6.2 0 0 1 7.6 0"/><circle cx="8" cy="9.7" r="1.35" fill="currentColor" stroke="none"/></svg>',
  bold: '<svg width="17" height="12" viewBox="0 0 17 12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M1.8 4.5a10 10 0 0 1 13.4 0"/><path d="M4.5 7a6.4 6.4 0 0 1 8 0"/><circle cx="8.5" cy="9.8" r="1.5" fill="currentColor" stroke="none"/></svg>',
  thin: '<svg width="15" height="12" viewBox="0 0 15 12" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" aria-hidden="true"><path d="M1.5 4.2a9.5 9.5 0 0 1 12 0"/><path d="M4 6.8a6 6 0 0 1 7 0"/><circle cx="7.5" cy="9.6" r="1.1" fill="currentColor" stroke="none"/></svg>',
  aosp: '<svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor" aria-hidden="true"><path d="M8 9.6a1.6 1.6 0 1 1 0 3.2 1.6 1.6 0 0 1 0-3.2zM8 5.4c1.8 0 3.4.7 4.6 1.9l-1.5 1.5A4.4 4.4 0 0 0 8 7.6c-1.2 0-2.3.5-3.1 1.2L3.4 7.3A6.4 6.4 0 0 1 8 5.4zM8 1c2.9 0 5.6 1.2 7.6 3.1l-1.5 1.5A8.6 8.6 0 0 0 8 3.2c-2.3 0-4.4.9-6.1 2.4L.4 4.1A11 11 0 0 1 8 1z" transform="translate(0,-1)"/></svg>',
};
function sbBatPill() {
  return '<svg width="27" height="12" viewBox="0 0 27 12" fill="none" aria-hidden="true"><rect x="0.5" y="0.5" width="23" height="11" rx="5.5" fill="currentColor" opacity="0.28"/><rect x="2.5" y="2.5" width="14" height="7" rx="3.5" fill="currentColor"/><path d="M25.2 4.2v3.6a2 2 0 0 0 0-3.6z" fill="currentColor" opacity="0.45"/></svg>';
}
function sbBatOutline(rx, sw) {
  return '<svg width="25" height="12" viewBox="0 0 25 12" fill="none" aria-hidden="true"><rect x="0.5" y="0.5" width="21" height="11" rx="' + rx + '" stroke="currentColor" opacity="0.5" stroke-width="' + sw + '"/><rect x="2.5" y="2.5" width="13" height="7" rx="1.2" fill="currentColor"/><path d="M23.5 4v4a2 2 0 0 0 0-4z" fill="currentColor" opacity="0.5"/></svg>';
}
function sbBatSamsung(dark) {
  var tc = dark ? '#111B21' : '#FFFFFF';
  return '<span style="position:relative;display:inline-flex;line-height:1">' +
    '<svg width="28" height="13" viewBox="0 0 28 13" fill="none" aria-hidden="true"><rect x="0.6" y="0.6" width="23" height="11.8" rx="4" stroke="currentColor" opacity="0.6" stroke-width="1.6"/><rect x="3" y="3" width="13" height="7" rx="2" fill="currentColor"/><path d="M25.8 4.5v4a2.2 2.2 0 0 0 0-4z" fill="currentColor" opacity="0.6"/></svg>' +
    '<span style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:700;color:' + tc + ';line-height:1">77</span></span>';
}
var SB_DUALSIG = '<svg width="19" height="12" viewBox="0 0 19 12" fill="currentColor" aria-hidden="true"><rect x="0" y="6.5" width="2.2" height="2.5" rx="0.4"/><rect x="3" y="5" width="2.2" height="4" rx="0.4"/><rect x="6" y="3.5" width="2.2" height="5.5" rx="0.4"/><rect x="9.5" y="6.5" width="2.2" height="2.5" rx="0.4" opacity="0.4"/><rect x="12.5" y="5" width="2.2" height="4" rx="0.4" opacity="0.4"/><rect x="15.5" y="3.5" width="2.2" height="5.5" rx="0.4" opacity="0.4"/></svg>';
function sbTag(t) { return '<span style="font-size:10px;font-weight:700;letter-spacing:.3px;line-height:1">' + t + '</span>'; }
function sbPct() { return '<span style="font-size:11px;font-weight:600;line-height:1">77</span>'; }
var SB_NOTIF_APPS = '<span style="display:inline-flex;gap:6px;align-items:center">' +
  '<span style="width:15px;height:15px;border-radius:4px;background:#25D366;display:inline-flex;align-items:center;justify-content:center"><svg width="9" height="9" viewBox="0 0 24 24" fill="#fff" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2z"/></svg></span>' +
  '<span style="width:15px;height:15px;border-radius:4px;background:#1D9BF0;display:inline-flex;align-items:center;justify-content:center"><svg width="8" height="8" viewBox="0 0 24 24" fill="#fff" aria-hidden="true"><path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z"/></svg></span></span>';
var SB_NOTIF_DOTS = '<span style="display:inline-flex;gap:5px;align-items:center"><span style="width:6px;height:6px;border-radius:50%;background:currentColor;opacity:.85"></span><span style="width:6px;height:6px;border-radius:50%;background:currentColor;opacity:.5"></span></span>';

/* --- definisi per merk: punch, kiri (notif), kanan (urutan ikon) --- */
var SYSBAR_BRAND = {
  xiaomi: { punch: 10, left: SB_NOTIF_APPS, right: function() { return [SB_SIG.chunky(), sbTag('5G'), sbTag('VoLTE'), SB_WIFI.std, sbPct(), sbBatPill()]; } },
  samsung: { punch: 12, left: SB_NOTIF_DOTS, right: function(d) { return [SB_SIG.round(), sbTag('5G'), SB_WIFI.bold, sbBatSamsung(d)]; } },
  oppo: { punch: 11, left: '', right: function() { return [SB_SIG.med(), sbTag('4G'), sbTag('HD'), SB_WIFI.std, sbPct(), sbBatOutline(2.8, 1.2)]; } },
  vivo: { punch: 11, left: '', right: function() { return [SB_SIG.slim(), sbTag('5G'), sbTag('HD'), SB_WIFI.thin, sbPct(), sbBatOutline(2, 1)]; } },
  realme: { punch: 11, left: '', right: function() { return [SB_SIG.med(), sbTag('4G'), sbTag('HD'), SB_WIFI.std, sbPct(), sbBatOutline(2.8, 1.2)]; } },
  oneplus: { punch: 11, left: '', right: function() { return [SB_SIG.med(), sbTag('5G'), sbTag('HD'), SB_WIFI.std, sbPct(), sbBatOutline(2.8, 1.2)]; } },
  infinix: { punch: 11, left: '', right: function() { return [SB_SIG.std(), sbTag('4G'), sbTag('HD'), SB_WIFI.std, sbBatOutline(2.5, 1.2), sbPct()]; } },
  tecno: { punch: 11, left: '', right: function() { return [SB_SIG.std(), sbTag('5G'), sbTag('HD'), SB_WIFI.std, sbBatOutline(2.5, 1.2), sbPct()]; } },
  motorola: { punch: 12, left: SB_NOTIF_APPS, right: function() { return [SB_SIG.std(), sbTag('5G'), SB_WIFI.std, sbBatOutline(2.5, 1.2), sbPct()]; } },
  nothing: { punch: 12, left: '', right: function() { return [SB_SIG.std(), sbTag('5G'), SB_WIFI.std, sbBatOutline(2.5, 1.2), sbPct()]; } },
  pixel: { punch: 12, left: '', right: function() { return [SB_WIFI.aosp, SB_SIG.sharp(), sbBatOutline(2.5, 1.2), sbPct()]; } },
  huawei: { punch: 12, left: '', right: function() { return [SB_WIFI.std, SB_DUALSIG, sbBatPill(), sbPct()]; } },
  honor: { punch: 'pill', left: '', right: function() { return [SB_SIG.med(), sbTag('5G'), sbTag('VoLTE'), SB_WIFI.std, sbBatPill(), sbPct()]; } },
};

var SYSBAR_IPHONE = {
  sig: '<svg width="17" height="12" viewBox="0 0 17 12" fill="currentColor" aria-hidden="true"><rect x="0" y="8" width="3" height="4" rx="0.7"/><rect x="4.5" y="5.5" width="3" height="6.5" rx="0.7"/><rect x="9" y="3" width="3" height="9" rx="0.7"/><rect x="13.5" y="0" width="3" height="12" rx="0.7"/></svg>',
  wifi: '<svg width="16" height="12" viewBox="0 0 16 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M1.5 4.2a10 10 0 0 1 13 0"/><path d="M4 6.8a6.4 6.4 0 0 1 8 0"/><circle cx="8" cy="9.6" r="1.3" fill="currentColor" stroke="none"/></svg>',
  bat: '<svg width="25" height="12" viewBox="0 0 25 12" fill="none" aria-hidden="true"><rect x="0.5" y="0.5" width="21" height="11" rx="3" stroke="currentColor" opacity="0.45"/><rect x="2.5" y="2.5" width="14" height="7" rx="1.5" fill="currentColor"/><path d="M23.5 4v4a2.2 2.2 0 0 0 0-4z" fill="currentColor" opacity="0.45"/></svg>',
};

export function sysbar(platform, brand, dark) {
  var fontI = SYSBAR_FONTS.iphone;
  var clockI = '<span style="font-family:' + fontI + ';font-weight:600;font-size:14px;letter-spacing:-.2px;line-height:1">9:41</span>';
  if (platform === 'iphone') {
    var iconsI = '<span style="display:inline-flex;align-items:center;gap:5px;line-height:1">' + SYSBAR_IPHONE.sig + SYSBAR_IPHONE.wifi + SYSBAR_IPHONE.bat + '</span>';
    return clockI +
      '<span style="position:absolute;left:50%;top:11px;transform:translateX(-50%);width:122px;height:36px;background:#000;border-radius:18px;box-shadow:inset 0 0 0 1.5px rgba(255,255,255,.12)"></span>' +
      iconsI;
  }
  var b = SYSBAR_BRAND[brand] || SYSBAR_BRAND.xiaomi;
  var key = SYSBAR_BRAND[brand] ? brand : 'xiaomi';
  var leftHtml = b.left ? '<span style="display:inline-flex;align-items:center;gap:8px"><span style="font-family:' + SYSBAR_FONTS[key] + ';font-weight:600;font-size:14px;letter-spacing:-.2px;line-height:1">9:41</span>' + b.left + '</span>'
    : '<span style="font-family:' + SYSBAR_FONTS[key] + ';font-weight:600;font-size:14px;letter-spacing:-.2px;line-height:1">9:41</span>';
  var rightHtml = '<span style="display:inline-flex;align-items:center;gap:5px;line-height:1">' + b.right(!!dark).join('') + '</span>';
  var punchHtml;
  if (b.punch === 'pill') {
    punchHtml = '<span style="position:absolute;left:50%;top:15px;transform:translateX(-50%);width:40px;height:12px;background:#000;border-radius:6px;box-shadow:0 0 0 2px rgba(255,255,255,.06)"></span>';
  } else {
    punchHtml = '<span style="position:absolute;left:50%;top:15px;transform:translateX(-50%);width:' + b.punch + 'px;height:' + b.punch + 'px;background:#000;border-radius:50%;box-shadow:0 0 0 2px rgba(255,255,255,.06)"></span>';
  }
  return punchHtml + leftHtml + rightHtml;
}


/* ================= FASE 2: shared helpers (dipakai >1 tool) =================
   Dipindah otomatis dari tools-*.js oleh scripts/split-tools.py. Jangan edit manual;
   edit di file tool asalnya lalu jalankan ulang generator bila perlu. */
const T = h; // alias untuk helper pindahan yang memakai T.*
export function preHtml(text, cls) {
    return '<pre class="' + (cls || '') + '" style="white-space:pre-wrap;word-break:break-word;background:#12100d;border:1px solid #2e2823;border-radius:8px;padding:12px;font-size:12.5px;line-height:1.5;overflow-x:auto">' + esc(text) + '</pre>';
  }

export function errBox(msg) { return '<div style="color:var(--err);font-size:13px;line-height:1.5">' + esc(msg) + '</div>'; }

export function kvRows(pairs) {
    return '<table style="width:100%;border-collapse:collapse;font-size:13px">' +
      pairs.map(([k, v]) => '<tr><td style="padding:7px 8px;color:#c9bda9;border-bottom:1px solid #251f18;vertical-align:top;white-space:nowrap">' + esc(k) + '</td><td style="padding:7px 8px;border-bottom:1px solid #251f18;font-family:monospace;word-break:break-all">' + esc(v) + '</td></tr>').join('') +
      '</table>';
  }

export function tabs(buttons, pages) {
    // buttons: [[label, idx]], pages: [el...]
    const bar = T.el('<div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap"></div>');
    bar.classList.add('tabbar'); // kait CSS: font tab 12px di HP (P3-4)
    const set = (i) => {
      pages.forEach((p, j) => { p.hidden = j !== i; });
      bar.querySelectorAll('button').forEach((b, j) => b.classList.toggle('primary', j === i));
    };
    buttons.forEach(([label, i]) => {
      const b = T.btn(label, () => set(i));
      b.style.flex = '1';
      // Jaring pengaman (v6.12.2, P2-A1): min-width EKSPLISIT min-content.
      // Aturan "min-width otomatis -> 0 bila overflow non-visible" hanya
      // berlaku saat min-width:auto; nilai eksplisit min-content KEBAL
      // terhadap perubahan overflow, jadi tombol tab tidak bisa menyusut
      // bila ada kode lain yang mengubah overflow-nya (akar bug ripple x
      // tab). Nilai ini SAMA dengan lantai otomatis semula, jadi layout
      // diam tidak berubah sama sekali — JANGAN ganti ke px tetap:
      // min-width 80px sempat dicoba dan MERUSAK layout (baris tab
      // kalkulator-waktu yang semula wrap 2 baris jadi 1 baris rapat,
      // label "Tambah/kurang" terpotong jadi "Tambah/kura").
      b.style.minWidth = 'min-content';
      bar.appendChild(b);
    });
    set(0);
    return bar;
  }

export const U = utils;

export const _NI = { C: 0, 'B#': 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, Fb: 4, 'E#': 5, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11, Cb: 11 };

export const _normAcc = (a) => (a === '♯' ? '#' : a === '♭' ? 'b' : a || '');

export const money = (inpEl, ph, val) => { const i = T.input('text', ph, val); i.inputMode = 'decimal'; return i; };

export const kv = (k, v) => '<div class="kv"><span class="k">' + T.esc(k) + '</span><span class="v">' + v + '</span></div>';
// PERINGATAN (RED-03, v6.16.0 — diputuskan TIDAK diubah): value `v` di atas
// SENGAJA tidak di-escape — 78 pemanggilan di 33 file mengandalkan HTML di
// value (<b>, <span class="ok">, ...). JANGAN pernah melewatkan data
// tak terpercaya (API/user) ke `v` tanpa T.esc() dulu — itu langsung XSS.
// Bila butuh value teks murni, escape di pemanggil: kv('Nama', T.esc(nama)).

export const LOCAL_NOTE = 'Semua diproses 100% lokal di HP kamu, file tidak diupload ke mana-mana.';

export function loadImage(file) {
    return new Promise((res, rej) => {
      if (!file || !/^image\//.test(file.type)) return rej(new Error('not-image'));
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => { URL.revokeObjectURL(url); res(img); };
      img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('bad-image')); };
      img.src = url;
    });
  }

export function fmtBytes(n) {
    if (!n && n !== 0) return '-';
    if (n < 1024) return n + ' B';
    if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
    return (n / 1024 / 1024).toFixed(2) + ' MB';
  }

export function canvasToBlob(canvas, type, q) {
    return new Promise((res) => canvas.toBlob((b) => res(b), type, q));
  }

export function fileInput(accept) {
    const i = document.createElement('input');
    i.type = 'file';
    i.accept = accept || 'image/*';
    return i;
  }

export function imgEl(src, alt) {
    const im = document.createElement('img');
    im.src = src; im.alt = alt || '';
    im.style.cssText = 'max-width:100%;height:auto;border-radius:10px;border:1px solid #ffffff20;display:block';
    return im;
  }

utils.extractEmails = function (s) {
    const m = String(s == null ? '' : s).match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
    return [...new Set(m || [])];
  };

utils.extractPhones = function (s) {
    const str = String(s == null ? '' : s);
    const m = str.match(/(?:\+?62|0)8\d{7,11}\b/g);
    return [...new Set((m || []).map((x) => x.replace(/^\+/, '')))];
  };

export function p2(n) { return String(n).padStart(2, '0'); }

export function todayISO() {
    const d = new Date();
    return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
  }

export function parseISO(s) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || '').trim());
    if (!m) return null;
    const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
    if (d.getUTCFullYear() !== +m[1] || d.getUTCMonth() !== +m[2] - 1 || d.getUTCDate() !== +m[3]) return null;
    return d;
  }

utils.ageParts = function (birthISO, refISO) {
    const b = parseISO(birthISO), r = parseISO(refISO);
    if (!b || !r || r < b) return null;
    let tahun = r.getUTCFullYear() - b.getUTCFullYear();
    let bulan = r.getUTCMonth() - b.getUTCMonth();
    let hari = r.getUTCDate() - b.getUTCDate();
    if (hari < 0) {
      bulan -= 1;
      hari += new Date(Date.UTC(r.getUTCFullYear(), r.getUTCMonth(), 0)).getUTCDate();
    }
    if (bulan < 0) { tahun -= 1; bulan += 12; }
    return { tahun, bulan, hari, totalHari: Math.floor((r - b) / 86400000) };
  };

/* ================= Pola "bawa kredensial sendiri" (BYOK) =================
   Untuk tool yang butuh API key / akun milik user. Key disimpan HANYA di
   localStorage browser user — tidak pernah dikirim ke server Adip Tools.
   Semua request dikirim langsung dari browser ke penyedia layanan resmi. */
utils.byok = {
  LS_PREFIX: 'adipTools_key_',
  get(toolId) {
    try { return localStorage.getItem(utils.byok.LS_PREFIX + toolId) || ''; }
    catch (e) { return ''; }
  },
  set(toolId, v) {
    try {
      if (v) localStorage.setItem(utils.byok.LS_PREFIX + toolId, v);
      else localStorage.removeItem(utils.byok.LS_PREFIX + toolId);
    } catch (e) {}
  },
  // Membangun kolom key milik user. Mengembalikan { box, input, get(), has(), paint }.
  // opts: { tool, label, placeholder, hint, docUrl, docLabel }
  field(opts) {
    const t = opts.tool, label = opts.label || 'API key';
    const box = el('<div style="border:1px solid #ffffff20;border-radius:10px;padding:12px;margin-bottom:12px"></div>');
    const inp = document.createElement('input');
    inp.className = 'inp'; inp.type = 'password'; inp.autocomplete = 'off'; inp.spellcheck = false;
    inp.placeholder = opts.placeholder || 'Tempel API key milikmu di sini';
    inp.value = utils.byok.get(t);
    const status = el('<div class="dim" style="font-size:12px;margin-top:6px;line-height:1.6"></div>');
    const saveBtn = btn('💾 Simpan key', () => {
      utils.byok.set(t, inp.value.trim());
      paint(); toast('Key tersimpan di browser ini saja');
    }, true);
    const clearBtn = btn('Hapus', () => {
      inp.value = ''; utils.byok.set(t, '');
      paint(); toast('Key dihapus dari browser ini');
    });
    function paint() {
      const v = inp.value.trim();
      status.innerHTML = v
        ? '✅ <b>Key tersimpan</b> — hanya di browser ini (localStorage). Request dikirim langsung ke penyedia layanan, tidak lewat server kami.'
        : '🔑 Masukkan ' + esc(label) + ' <b>milikmu sendiri</b> untuk memakai tool ini. Tanpa key, tool tidak bisa jalan.';
      saveBtn.disabled = !v;
    }
    inp.addEventListener('input', paint);
    box.appendChild(el('<div style="font-weight:700;font-size:13px;margin-bottom:8px">🔑 ' + esc(label) + '</div>'));
    box.appendChild(field('', inp, opts.hint || 'Key tidak pernah dikirim ke mana pun kecuali ke penyedia layanan resmi saat kamu menekan tombol proses.'));
    const rw = row(saveBtn, clearBtn);
    if (opts.docUrl) {
      const dw = el('<div style="margin-top:10px"></div>');
      dw.appendChild(el('<a href="' + esc(opts.docUrl) + '" target="_blank" rel="noopener" style="font-size:12.5px">📖 ' + esc(opts.docLabel || 'Cara mendapatkan key') + '</a>'));
      rw.appendChild(dw);
    }
    box.appendChild(rw);
    box.appendChild(status);
    paint();
    return {
      box, input: inp, paint,
      get() { return inp.value.trim() || utils.byok.get(t); },
      has() { return !!(inp.value.trim() || utils.byok.get(t)); },
    };
  },
};

/* Unduh dari URL (hasil AI dsb.): coba fetch→blob, fallback buka tab baru. */
utils.dlUrl = async function (url, filename) {
  try {
    const r = await fetch(url);
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const b = await r.blob();
    dl(filename || 'hasil', b, b.type || 'application/octet-stream');
    return true;
  } catch (e) {
    try { const w = window.open(url, '_blank', 'noopener'); if (!w) { toast('Gagal mengunduh — izinkan popup untuk situs ini'); return false; } return true; }
    catch (e2) { toast('Gagal mengunduh'); return false; }
  }
};

/* ================= Pola akun Puter milik user (Puter.js) =================
   AI dipakai dari akun Puter user sendiri (gratis, tanpa API key).
   Wajib atribusi "Powered by Puter" (syarat docs Puter) — sudah termasuk
   di panel bawah. SDK: https://js.puter.com/v2/ */
utils.puter = {
  SDK: 'https://js.puter.com/v2/',
  ok() { return typeof window !== 'undefined' && !!window.puter && !!window.puter.ai; },
  // Muat SDK sekali; resolve true bila siap dipakai.
  load() {
    if (utils.puter.ok()) return Promise.resolve(true);
    return loadScript(utils.puter.SDK).then((ok) => ok && utils.puter.ok());
  },
  // Ambil src dari hasil puter.ai.* (bisa HTMLImageElement / string data-URL).
  srcOf(res) {
    if (!res) return '';
    if (typeof res === 'string') return res;
    if (res.src) return res.src;
    return '';
  },
  usageText(m) {
    try {
      const u = (m && m.usage) || m || {};
      if (typeof u.used === 'number' && typeof u.allowance === 'number' && u.allowance > 0)
        return 'Kuota bulan ini: ' + u.used + ' / ' + u.allowance + ' terpakai.';
    } catch (e) {}
    return '';
  },
  poweredBy() {
    return '<div class="dim" style="font-size:11.5px;margin-top:10px">AI oleh akun Putermu · Didukung <a href="https://developer.puter.com" target="_blank" rel="noopener">Puter</a></div>';
  },
  // Panel "Hubungkan akun Puter". Mengembalikan { box, state, refresh(), signedIn(), need(fn) }.
  panel() {
    const box = el('<div style="border:1px solid #ffffff20;border-radius:10px;padding:12px;margin-bottom:12px"></div>');
    const state = { signedIn: false, user: '', usage: '' };
    async function onBtn() {
      if (!utils.puter.ok()) {
        const l = await utils.puter.load();
        if (!l) { toast('Gagal memuat Puter.js — cek koneksi lalu coba lagi'); return; }
      }
      if (state.signedIn) {
        try { await window.puter.auth.signOut(); } catch (e) {}
        await refresh(); return;
      }
      try { await window.puter.auth.signIn(); }
      catch (e) { toast('Login dibatalkan atau gagal'); return; }
      await refresh();
    }
    function paint() {
      let html;
      if (!utils.puter.ok()) {
        html = '<div style="font-weight:700;font-size:13px;margin-bottom:6px">🔌 Akun Puter</div>' +
          '<div class="dim" style="font-size:12.5px;line-height:1.6;margin-bottom:8px">Tool ini memakai <b>akun Puter milikmu sendiri</b> (gratis). ' +
          'AI & kuota dipakai dari akunmu — tanpa API key, tanpa server perantara.</div>';
      } else if (state.signedIn) {
        html = '<div style="font-weight:700;font-size:13px;margin-bottom:6px">✅ Terhubung' +
          (state.user ? ' — ' + esc(state.user) : '') + '</div>' +
          (state.usage ? '<div class="dim" style="font-size:12.5px;margin-bottom:8px">' + esc(state.usage) + '</div>' : '');
      } else {
        html = '<div style="font-weight:700;font-size:13px;margin-bottom:6px">🔌 Akun Puter</div>' +
          '<div class="dim" style="font-size:12.5px;line-height:1.6;margin-bottom:8px">Login dengan akun Putermu untuk memakai AI. Kuota dipakai dari akunmu sendiri.</div>';
      }
      box.innerHTML = html + utils.puter.poweredBy();
      box.appendChild(btn(state.signedIn ? '🚪 Keluar' : '🔌 Hubungkan akun Puter', onBtn, !state.signedIn));
    }
    async function refresh() {
      if (!utils.puter.ok()) { state.signedIn = false; state.user = ''; state.usage = ''; paint(); return false; }
      try {
        state.signedIn = !!(await window.puter.auth.isSignedIn());
        if (state.signedIn) {
          try {
            const u = await window.puter.auth.getUser();
            state.user = (u && (u.username || u.email)) || '';
          } catch (e) {}
          try { state.usage = utils.puter.usageText(await window.puter.auth.getMonthlyUsage()); }
          catch (e) { state.usage = ''; }
        } else { state.user = ''; state.usage = ''; }
      } catch (e) { state.signedIn = false; }
      paint();
      return state.signedIn;
    }
    paint();
    return {
      box, state, refresh,
      signedIn() { return state.signedIn; },
      // Jalankan fn hanya bila sudah login; bila belum, minta login dulu.
      async need(fn) {
        const ok = await refresh();
        if (!ok) { toast('Hubungkan akun Putermu dulu ya'); return; }
        return fn();
      },
    };
  },
  // Muat daftar model chat Puter untuk <select>. resolve [] bila gagal.
  async chatModels() {
    try {
      const list = await window.puter.ai.listModels();
      const arr = Array.isArray(list) ? list : (list && list.models) || [];
      return arr.map((m) => (typeof m === 'string' ? m : (m.id || m.name || ''))).filter(Boolean);
    } catch (e) { return []; }
  },
};

/* ================= ALIGHT MOTION toolkit (R3: 6 generator teks/logo) =================
   Helper bersama untuk generator XML Alight Motion (100% client-side, tanpa server).
   Ditulis clean-room dari spesifikasi perilaku. Pola shell bersama:
   palet 30 preset + 15 custom (localStorage), history per tool (maks 10),
   validasi root <scene> via DOMParser, unduh XML.
   NOTE: blok ini ditulis manual — bukan bagian auto-generated split-tools.py. */
const AL = (utils.alight = {});

/* ---- XML dasar ---- */
AL.xmlDecl = () => '<?xml version="1.0" encoding="utf-8"?>\n';
AL.escXml = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
AL.f6 = (n) => (Math.round(Number(n) * 1e6) / 1e6).toFixed(6);

/* Validasi: root harus <scene> (cerminan aturan tool acuan). */
AL.validate = (xml) => {
  const s = String(xml || '');
  if (typeof DOMParser !== 'undefined') {
    try {
      const doc = new DOMParser().parseFromString(s, 'application/xml');
      if (doc.querySelector('parsererror')) return { ok: false, error: 'XML tidak valid secara struktural.' };
      const root = doc.documentElement;
      if (!root || root.tagName !== 'scene') return { ok: false, error: 'Root XML harus <scene>.' };
      return { ok: true };
    } catch (e) { return { ok: false, error: 'Gagal memvalidasi XML.' }; }
  }
  // Fallback Node (tanpa DOM): cek root + tag berpasangan sederhana.
  if (!/<scene[\s>]/.test(s)) return { ok: false, error: 'Root XML harus <scene>.' };
  if (!/<\/scene\s*>/.test(s)) return { ok: false, error: 'Tag <scene> tidak ditutup.' };
  return { ok: true };
};

/* ---- Warna ---- */
AL.hexToRgb = (hex) => {
  let h = String(hex || '').trim().replace(/^#/, '');
  if (/^[0-9a-fA-F]{3}$/.test(h)) h = h.split('').map((c) => c + c).join('');
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
};
/* '#rrggbb' -> '#FFrrggbb' (format ARGB ala XML Alight Motion). */
AL.argb = (hex) => {
  const rgb = AL.hexToRgb(hex);
  if (!rgb) return '#FFFFFFFF';
  return '#FF' + rgb.map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase();
};
AL.lerpHex = (a, b, t) => {
  const ra = AL.hexToRgb(a) || [255, 255, 255], rb = AL.hexToRgb(b) || [255, 255, 255];
  t = Math.max(0, Math.min(1, Number(t) || 0));
  const m = ra.map((v, i) => Math.round(v + (rb[i] - v) * t));
  return '#' + m.map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase();
};
/* mode: single | repeat | mirror | linear */
AL.colorFor = (mode, palette, i, n, repeatEvery) => {
  const cols = (palette && palette.length ? palette : ['#FFFFFF']).map((c) => String(c).toUpperCase());
  if (mode === 'repeat') { const k = Math.max(1, repeatEvery | 0 || 1); return cols[Math.floor(i / k) % cols.length]; }
  if (mode === 'mirror') {
    if (cols.length === 1) return cols[0];
    const cyc = 2 * cols.length - 2; let p = i % cyc; if (p >= cols.length) p = cyc - p;
    return cols[p];
  }
  if (mode === 'linear') {
    if (n <= 1 || cols.length === 1) return cols[0];
    const pos = (i / (n - 1)) * (cols.length - 1);
    const k0 = Math.floor(pos), k1 = Math.min(cols.length - 1, k0 + 1);
    return AL.lerpHex(cols[k0], cols[k1], pos - k0);
  }
  return cols[0];
};

/* ---- RNG deterministik (untuk opsi random + seed) ---- */
AL.mulberry32 = (seed) => {
  let a = (Number(seed) || 1) >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/* ---- Nama file & project ---- */
AL.slug = (s, fallback) => {
  const out = String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9#_-]+/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '').slice(0, 64);
  return out || fallback || 'animasi-teks';
};
AL.projectName = (s, fallback) => {
  const out = String(s || '').replace(/[ -]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80);
  return out || fallback || 'Adip Tools';
};

/* ---- Palet: 30 preset + 15 custom (localStorage) ---- */
AL.PALETTES = [
  { name: 'Jingga Klasik', colors: ['#FFFFFF', '#FFB300', '#FF8A00', '#E2571D', '#7A2E0E'] },
  { name: 'Pagi Hutan', colors: ['#FFF8E1', '#DCE9B5', '#8FAE6B', '#4C6B3C', '#1E2E1A'] },
  { name: 'Permen Neon', colors: ['#FFF6B0', '#FF7BAC', '#FF2E88', '#B01ECC', '#4A1078'] },
  { name: 'Samudra Limau', colors: ['#E4FF7A', '#59D6F2', '#0E9BE8', '#F2338A', '#F25C05'] },
  { name: 'Malam Biru', colors: ['#F2F2F2', '#8FBFFF', '#3A72C4', '#22377A', '#0C1030'] },
  { name: 'Emas Mocha', colors: ['#FFF4D6', '#F2D06B', '#C07A2E', '#6E3A1B', '#201207'] },
  { name: 'Toska Persik', colors: ['#FFEAD9', '#7FD8CC', '#0F9490', '#FFBE73', '#B0472E'] },
  { name: 'Krim Delima', colors: ['#FFF2DC', '#FFD166', '#F04E6D', '#A31245', '#5C0E2C'] },
  { name: 'Mint Batu', colors: ['#EDF9ED', '#C2E6DC', '#8CB3AE', '#5A6172', '#232A35'] },
  { name: 'Ungu Pop', colors: ['#F7EFFF', '#A394FF', '#6C63FF', '#7B2DCC', '#3C096C'] },
  { name: 'Mangga Siber', colors: ['#F9FFF2', '#F2FF00', '#FFB000', '#FF4D00', '#161616'] },
  { name: 'Es Neon', colors: ['#F7FFFF', '#A5E9FF', '#2FB9F2', '#0072CC', '#001E44'] },
  { name: 'Bayang Mawar', colors: ['#FFF8F9', '#FFB9CC', '#FF4D6D', '#C9184A', '#590D22'] },
  { name: 'Lemon Tinta', colors: ['#FFFFF2', '#F6F32E', '#F2B705', '#333A45', '#0C0A0B'] },
  { name: 'Lava Aqua', colors: ['#F0FFFE', '#00F5D4', '#00BBF9', '#F15BB5', '#FEE440'] },
  { name: 'Tembaga Royal', colors: ['#F9F5FF', '#BDBDFF', '#5A4FCF', '#C77D3A', '#4A1F0E'] },
  { name: 'Hijau Racun', colors: ['#F8FFE8', '#CDFF40', '#70E000', '#38B000', '#004B23'] },
  { name: 'Anggur Senja', colors: ['#FFF4E2', '#FFB703', '#FB8500', '#8338EC', '#3A0CA3'] },
  { name: 'Baja Awan', colors: ['#F8FAFC', '#CBD5E1', '#94A3B8', '#475569', '#0F172A'] },
  { name: 'Api Permen', colors: ['#FFF6F8', '#FF93B0', '#FB2576', '#FF7B00', '#7B2CBF'] },
  { name: 'Bara Gelap', colors: ['#FFF2D8', '#FF6A00', '#B83200', '#3A0C00', '#0A0403'] },
  { name: 'Api Hitam', colors: ['#FFEDD6', '#FF3D00', '#9D0208', '#370617', '#060606'] },
  { name: 'Asap Api', colors: ['#F9F3E9', '#FF9F1C', '#C1121F', '#3D1F1F', '#121212'] },
  { name: 'Kristal Es', colors: ['#FFFFFF', '#D2FFFF', '#7FDBFF', '#2D9CDB', '#073C64'] },
  { name: 'Es Dalam', colors: ['#F1FDFF', '#9AE6FF', '#38BDF8', '#2563EB', '#0C1126'] },
  { name: 'Mint Beku', colors: ['#F8FFFF', '#BCFFF9', '#64DFDF', '#5390D9', '#102A43'] },
  { name: 'Pink Ceria', colors: ['#FFF1F9', '#FF9AD5', '#FF4FB3', '#D1008F', '#4A0033'] },
  { name: 'Pink Bludru', colors: ['#FFF6FB', '#F7A8C7', '#E84A8A', '#8A0F4D', '#2B0618'] },
  { name: 'Legenda Biru-Jingga', colors: ['#FFF8E9', '#FF9F1C', '#FF6B00', '#0077FF', '#002154'] },
  { name: 'Malam Legenda', colors: ['#F8FAFF', '#00A3FF', '#0057FF', '#FF7A00', '#141414'] },
];
AL.customPalettes = {
  key: 'adip-alight-palettes-v1', limit: 15,
  list() {
    try { const a = JSON.parse(localStorage.getItem(this.key) || '[]'); return Array.isArray(a) ? a : []; }
    catch (e) { return []; }
  },
  save(list) { try { localStorage.setItem(this.key, JSON.stringify(list.slice(0, this.limit))); } catch (e) {} },
  parse(text) {
    const parts = String(text || '').split(/[\s,;|]+/).map((s) => s.trim()).filter(Boolean);
    const colors = [];
    for (const p of parts) {
      const rgb = AL.hexToRgb(p.startsWith('#') ? p : '#' + p);
      if (!rgb) return { ok: false, error: 'Warna tidak valid: ' + p + ' (pakai format #rrggbb).' };
      colors.push('#' + rgb.map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase());
    }
    if (colors.length < 2) return { ok: false, error: 'Minimal 2 warna.' };
    if (colors.length > 8) return { ok: false, error: 'Maksimal 8 warna.' };
    return { ok: true, colors };
  },
  add(name, colors) {
    const list = this.list();
    if (list.length >= this.limit) return { ok: false, error: 'Palet custom penuh (' + this.limit + '). Hapus salah satu dulu.' };
    const p = { id: 'c' + Date.now().toString(36), name: String(name || '').slice(0, 24) || 'Custom ' + (list.length + 1), colors };
    list.push(p); this.save(list);
    return { ok: true, palette: p };
  },
  remove(id) { this.save(this.list().filter((p) => p.id !== id)); },
};

/* ---- History per tool (maks 10, metadata + XML bila muat) ---- */
AL.history = {
  key: 'adip-alight-history-v1', limit: 10,
  _all() { try { const o = JSON.parse(localStorage.getItem(this.key) || '{}'); return o && typeof o === 'object' ? o : {}; } catch (e) { return {}; } },
  _save(o) { try { localStorage.setItem(this.key, JSON.stringify(o)); return true; } catch (e) { return false; } },
  list(toolId) { return this._all()[toolId] || []; },
  push(toolId, entry) {
    const all = this._all();
    const arr = [Object.assign({ id: 'h' + Date.now().toString(36), at: Date.now() }, entry)]
      .concat(all[toolId] || []).slice(0, this.limit);
    if (!this._save(Object.assign(all, { [toolId]: arr }))) { // kuota penuh: simpan metadata saja
      const slim = arr.map(({ xml, ...m }) => m);
      this._save(Object.assign(all, { [toolId]: slim }));
    }
  },
  remove(toolId, id) { const all = this._all(); all[toolId] = (all[toolId] || []).filter((e) => e.id !== id); this._save(all); },
  clear(toolId) { const all = this._all(); delete all[toolId]; this._save(all); },
};

/* ---- Rencana timing: stagger antar unit + spread + jitter seed ---- */
AL.timingPlan = (n, o) => {
  o = o || {};
  const stagger = Math.max(0, +o.stagger || 0);
  const spread = Math.max(0, +o.spread || 0);
  const random = Math.max(0, Math.min(100, +o.random || 0));
  const layerMs = Math.max(200, Math.round(+o.layerMs || 2000));
  const endHold = Math.max(0, Math.round(+o.endHold || 0));
  const rng = AL.mulberry32(+o.seed || 1);
  const starts = [], ends = [];
  for (let i = 0; i < n; i++) {
    const base = n > 1 ? i * stagger + (spread * i) / (n - 1) : 0;
    const jit = random > 0 && stagger > 0 ? (rng() * 2 - 1) * (random / 100) * stagger : 0;
    const st = Math.max(0, Math.round(base + jit));
    starts.push(st); ends.push(st + layerMs);
  }
  let total = n ? Math.max(...ends) + endHold : 0;
  if (o.extend) for (let i = 0; i < n; i++) ends[i] = total;
  return { starts, ends, total };
};

/* ---- Pembangun XML ---- */
AL.kf = (timeMs, value, ease) =>
  '<kf time="' + AL.f6(timeMs) + '" value="' + AL.escXml(value) + '"' + (ease ? ' ease="' + AL.escXml(ease) + '"' : '') + '/>';
AL.prop = (name, kfs) => '      <' + name + '>\n        ' + kfs.join('\n        ') + '\n      </' + name + '>';
AL.xform = (p) => {
  const parts = [];
  if (p.location) parts.push(AL.prop('location', p.location));
  if (p.scale) parts.push(AL.prop('scale', p.scale));
  if (p.rotation) parts.push(AL.prop('rotation', p.rotation));
  if (p.opacity) parts.push(AL.prop('opacity', p.opacity));
  if (p.blur) parts.push(AL.prop('blur', p.blur));
  if (p.trimStart) parts.push(AL.prop('trimStart', p.trimStart));
  if (p.trimEnd) parts.push(AL.prop('trimEnd', p.trimEnd));
  return parts.join('\n');
};
AL.textLayer = (o) =>
  '  <text id="' + o.id + '" parent="' + o.parent + '" label="' + AL.escXml(o.label) + '" startTime="' + o.startMs +
  '" endTime="' + o.endMs + '" size="' + o.size + '" font="' + AL.escXml(o.font) + '">\n' +
  '    <content>' + AL.escXml(o.content) + '</content>\n' +
  '    <transform>\n' + o.transform + '\n    </transform>\n' +
  (o.fillArgb ? '    <fillColor value="' + o.fillArgb + '"/>\n' : '') +
  (o.strokeArgb ? '    <strokeColor value="' + o.strokeArgb + '" width="' + (o.strokeW || 1) + '"/>\n' : '') +
  '  </text>';
AL.nullLayer = (o) =>
  '  <nullobj id="' + o.id + '" label="' + AL.escXml(o.label || 'Null') + '" startTime="' + o.startMs +
  '" endTime="' + o.endMs + '" hidden="' + (o.hidden === false ? 'false' : 'true') + '" fillType="none">\n' +
  '    <transform>\n      <location value="' + AL.f6(o.x == null ? 540 : o.x) + ',' + AL.f6(o.y == null ? 540 : o.y) + ',0.000000"/>\n    </transform>\n' +
  '  </nullobj>';
AL.pathLayer = (o) =>
  '  <path id="' + o.id + '" parent="' + o.parent + '" label="' + AL.escXml(o.label) + '" startTime="' + o.startMs +
  '" endTime="' + o.endMs + '" d="' + AL.escXml(o.d) + '">\n' +
  '    <transform>\n' + o.transform + '\n    </transform>\n' +
  (o.fillArgb ? '    <fillColor value="' + o.fillArgb + '"/>\n' : '') +
  (o.strokeArgb ? '    <strokeColor value="' + o.strokeArgb + '" width="' + (o.strokeW || 1) + '"/>\n' : '') +
  '  </path>';
AL.buildScene = (o) =>
  AL.xmlDecl() +
  '<scene title="' + AL.escXml(o.title || 'Adip Tools') + '" totalTime="' + Math.round(o.totalMs || 0) +
  '" modifiedTime="' + Date.now() + '" width="' + (o.width || 1080) + '" height="' + (o.height || 1080) +
  '" fps="' + (o.fps || 30) + '">\n' + o.inner + '\n</scene>';

/* Unduh XML (validasi dulu; kembalikan pesan error atau null bila sukses). */
AL.downloadXml = (filename, xml) => {
  const v = AL.validate(xml);
  if (!v.ok) return v.error;
  dl(filename, xml, 'text/xml;charset=utf-8');
  return null;
};
AL.fileFor = (filename, presetId, project) =>
  AL.slug(filename || (AL.slug(project, 'teks') + '#' + presetId), 'animasi') + '.xml';

/* ---- Vektorisasi teks (marching squares, 100% lokal) ----
   Dipakai textvector + trimpath. rasterizeChar butuh browser (canvas);
   di Node kembalikan null dengan jujur. */
AL.rasterizeChar = (ch, fontCss, px, pad) => {
  if (typeof document === 'undefined') return null;
  pad = Math.max(0, Math.round(pad || 0));
  const cv = document.createElement('canvas');
  const cx = cv.getContext('2d', { willReadFrequently: true });
  cx.font = fontCss;
  const mw = cx.measureText(ch).width;
  const w = Math.max(4, Math.ceil(mw) + pad * 2 + 4);
  const h = Math.max(4, Math.ceil(px * 1.5) + pad * 2 + 4);
  cv.width = w; cv.height = h;
  const c2 = cv.getContext('2d');
  c2.font = fontCss; c2.textBaseline = 'alphabetic'; c2.fillStyle = '#fff';
  c2.fillText(ch, pad + 2, pad + 2 + px);
  const img = c2.getImageData(0, 0, w, h).data;
  const mask = new Uint8Array(w * h);
  for (let i = 0; i < mask.length; i++) mask[i] = img[i * 4 + 3];
  return { mask, w, h, advance: mw };
};
AL.traceContours = (mask, w, h, threshold) => {
  threshold = threshold == null ? 128 : threshold;
  const at = (x, y) => (x < 0 || y < 0 || x >= w || y >= h) ? 0 : (mask[y * w + x] >= threshold ? 1 : 0);
  const segs = [];
  const P = (x, y) => [x, y];
  for (let y = 0; y < h - 1; y++) for (let x = 0; x < w - 1; x++) {
    const code = at(x, y) * 8 + at(x + 1, y) * 4 + at(x + 1, y + 1) * 2 + at(x, y + 1);
    if (code === 0 || code === 15) continue;
    const Tp = P(x + .5, y), R = P(x + 1, y + .5), B = P(x + .5, y + 1), L = P(x, y + .5);
    const add = (p, q) => segs.push([p, q]);
    switch (code) {
      case 1: case 14: add(L, B); break;
      case 2: case 13: add(B, R); break;
      case 3: case 12: add(L, R); break;
      case 4: case 11: add(Tp, R); break;
      case 6: case 9: add(Tp, B); break;
      case 7: case 8: add(Tp, L); break;
      case 5: add(Tp, L); add(B, R); break;
      case 10: add(Tp, R); add(L, B); break;
    }
  }
  // Gabung segmen jadi poligon (cocokkan ujung dua arah).
  const key = (p) => p[0].toFixed(2) + ',' + p[1].toFixed(2);
  const starts = new Map(), ends = new Map();
  segs.forEach((s, i) => {
    const a = key(s[0]), b = key(s[1]);
    if (!starts.has(a)) starts.set(a, []); starts.get(a).push(i);
    if (!ends.has(b)) ends.set(b, []); ends.get(b).push(i);
  });
  const used = new Array(segs.length).fill(false);
  const polys = [];
  for (let i = 0; i < segs.length; i++) {
    if (used[i]) continue;
    used[i] = true;
    const poly = [segs[i][0].slice(), segs[i][1].slice()];
    let grew = true;
    while (grew) {
      grew = false;
      const head = key(poly[poly.length - 1]);
      const cands = (starts.get(head) || []).concat(ends.get(head) || []);
      for (const j of cands) {
        if (used[j]) continue;
        used[j] = true;
        const s = segs[j];
        poly.push((key(s[0]) === head ? s[1] : s[0]).slice());
        grew = true; break;
      }
    }
    if (poly.length > 3) polys.push(poly);
  }
  return polys;
};
AL.chaikin = (pts) => {
  const out = [];
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i], q = pts[(i + 1) % pts.length];
    out.push([p[0] * .75 + q[0] * .25, p[1] * .75 + q[1] * .25]);
    out.push([p[0] * .25 + q[0] * .75, p[1] * .25 + q[1] * .75]);
  }
  return out;
};
AL.polysToPath = (polys, smooth) =>
  polys.map((poly) => {
    const pts = smooth ? AL.chaikin(poly) : poly;
    return 'M' + pts.map((p) => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L') + 'Z';
  }).join('');
/* Vektorisasi satu karakter -> {d, w, h, advance} atau null (di luar browser). */
AL.vectorizeChar = (ch, fontCss, px, pad, smooth) => {
  const r = AL.rasterizeChar(ch, fontCss, px, pad);
  if (!r) return null;
  const polys = AL.traceContours(r.mask, r.w, r.h, 128);
  if (!polys.length) return { d: '', w: r.w, h: r.h, advance: r.advance };
  return { d: AL.polysToPath(polys, smooth !== false), w: r.w, h: r.h, advance: r.advance };
};

/* ---- UI bersama: pemilih palet (30 preset + custom) ----
   state: {mode, paletteIndex, repeatEvery, customId}; onChange(state) dipanggil tiap ganti. */
AL.paletteUI = (state, onChange) => {
  const wrap = el('<div class="al-pal"></div>');
  const activeColors = () => {
    if (state.customId) {
      const cp = AL.customPalettes.list().find((p) => p.id === state.customId);
      if (cp) return cp.colors;
    }
    return AL.PALETTES[Math.max(0, Math.min(AL.PALETTES.length - 1, state.paletteIndex | 0))].colors;
  };
  const swatches = (colors) => colors.map((c) =>
    '<span style="flex:1;height:100%;background:' + c + '"></span>').join('');
  function draw() {
    const customs = AL.customPalettes.list();
    const cards = AL.PALETTES.map((p, i) =>
      '<button type="button" class="al-palcard' + (!state.customId && i === state.paletteIndex ? ' on' : '') + '" data-i="' + i + '" title="' + esc(p.name) + '">' +
      '<span class="al-sw">' + swatches(p.colors) + '</span><span class="al-nm">' + esc(p.name) + '</span></button>').join('');
    const ccards = customs.map((p) =>
      '<button type="button" class="al-palcard' + (state.customId === p.id ? ' on' : '') + '" data-c="' + p.id + '" title="' + esc(p.name) + '">' +
      '<span class="al-sw">' + swatches(p.colors) + '</span><span class="al-nm">' + esc(p.name) + ' ✎<i class="al-del" data-del="' + p.id + '" title="Hapus">×</i></span></button>').join('');
    wrap.innerHTML =
      '<div class="row" style="margin-bottom:8px">' +
      '<label class="dim" style="font-size:12.5px">Mode warna</label>' +
      '<select class="inp" data-m style="max-width:170px">' +
      [['single', 'Satu warna'], ['repeat', 'Ulangi'], ['mirror', 'Cermin'], ['linear', 'Gradasi']]
        .map(([v, l]) => '<option value="' + v + '"' + (state.mode === v ? ' selected' : '') + '>' + l + '</option>').join('') +
      '</select>' +
      (state.mode === 'repeat' ? '<label class="dim" style="font-size:12.5px">Tiap</label><input class="inp" data-r type="number" min="1" max="12" value="' + (state.repeatEvery || 1) + '" style="max-width:70px">' : '') +
      '</div>' +
      '<div class="al-grid">' + cards + '</div>' +
      (ccards ? '<div class="al-grid" style="margin-top:8px">' + ccards + '</div>' : '') +
      '<div class="dim" style="font-size:12px;margin:8px 0 4px">Palet custom (' + customs.length + '/' + AL.customPalettes.limit + ') — tempel 2–8 warna hex, mis. <span style="font-family:monospace">#FF6B00, #FFD166, #111111</span></div>' +
      '<div class="row"><input class="inp" data-ci placeholder="#FF6B00, #FFD166, #111111" style="flex:1;min-width:0"><button type="button" class="btn" data-ca>+ Tambah</button></div>' +
      '<style>.al-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(88px,1fr));gap:6px}' +
      '.al-palcard{border:1px solid #ffffff20;border-radius:8px;background:#14110d;padding:4px;cursor:pointer;text-align:left}' +
      '.al-palcard.on{border-color:#ff7a59;box-shadow:0 0 0 1px #ff7a59}' +
      '.al-sw{display:flex;height:22px;border-radius:5px;overflow:hidden}' +
      '.al-nm{display:block;font-size:10.5px;color:#c9bda9;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
      '.al-del{font-style:normal;color:#ef4444;margin-left:4px;font-size:13px}</style>';
    wrap.querySelector('[data-m]').addEventListener('change', (e) => { state.mode = e.target.value; draw(); onChange(state); });
    const ri = wrap.querySelector('[data-r]');
    if (ri) ri.addEventListener('change', (e) => { state.repeatEvery = Math.max(1, Math.min(12, +e.target.value || 1)); onChange(state); });
    wrap.querySelectorAll('[data-i]').forEach((b) => b.addEventListener('click', () => {
      state.paletteIndex = +b.dataset.i; state.customId = null; draw(); onChange(state);
    }));
    wrap.querySelectorAll('[data-c]').forEach((b) => b.addEventListener('click', (e) => {
      const del = e.target.closest('[data-del]');
      if (del) { e.stopPropagation(); AL.customPalettes.remove(del.dataset.del); if (state.customId === del.dataset.del) { state.customId = null; state.paletteIndex = 0; } draw(); onChange(state); return; }
      state.customId = b.dataset.c; draw(); onChange(state);
    }));
    wrap.querySelector('[data-ca]').addEventListener('click', () => {
      const inp = wrap.querySelector('[data-ci]');
      const parsed = AL.customPalettes.parse(inp.value);
      if (!parsed.ok) { toast(parsed.error); return; }
      const added = AL.customPalettes.add('', parsed.colors);
      if (!added.ok) { toast(added.error); return; }
      inp.value = ''; state.customId = added.palette.id; draw(); onChange(state);
      toast('Palet custom tersimpan');
    });
  }
  state.activeColors = activeColors;
  draw();
  return wrap;
};

/* ---- UI bersama: riwayat hasil ---- */
AL.historyUI = (toolId, onPick) => {
  const wrap = el('<div class="al-hist"></div>');
  function draw() {
    const items = AL.history.list(toolId);
    if (!items.length) { wrap.innerHTML = '<p class="dim" style="font-size:12.5px">Belum ada riwayat. Hasil generate akan tersimpan di sini (maks 10).</p>'; return; }
    wrap.innerHTML = '<div class="dim" style="font-size:12.5px;margin-bottom:6px">Riwayat (' + items.length + '/10) <button type="button" class="btn" data-clear style="margin-left:8px;font-size:11px;padding:3px 10px">Bersihkan</button></div>' +
      '<div style="display:grid;gap:6px">' + items.map((it) =>
        '<div style="border:1px solid #ffffff18;border-radius:8px;padding:8px 10px;display:flex;gap:8px;align-items:center">' +
        '<div style="flex:1;min-width:0"><div style="font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(it.filename || '(tanpa nama)') + '</div>' +
        '<div class="dim" style="font-size:11.5px">' + esc(it.preset || '') + ' · ' + new Date(it.at).toLocaleString('id-ID') + (it.xml ? '' : ' · (XML tidak tersimpan)') + '</div></div>' +
        (it.xml ? '<button type="button" class="btn" data-pick="' + it.id + '" style="font-size:11px;padding:4px 10px">Buka</button>' : '') +
        '<button type="button" class="btn" data-dl="' + it.id + '" style="font-size:11px;padding:4px 10px">⬇</button>' +
        '<button type="button" class="btn" data-rm="' + it.id + '" style="font-size:11px;padding:4px 10px">×</button></div>').join('') + '</div>';
    wrap.querySelector('[data-clear]').addEventListener('click', () => { AL.history.clear(toolId); draw(); });
    wrap.querySelectorAll('[data-pick]').forEach((b) => b.addEventListener('click', () => {
      const it = AL.history.list(toolId).find((x) => x.id === b.dataset.pick);
      if (it && it.xml) onPick(it.xml, it);
    }));
    wrap.querySelectorAll('[data-dl]').forEach((b) => b.addEventListener('click', () => {
      const it = AL.history.list(toolId).find((x) => x.id === b.dataset.dl);
      if (it && it.xml) { const err = AL.downloadXml(it.filename || 'animasi.xml', it.xml); toast(err || 'Mengunduh…'); }
      else toast('XML item ini tidak tersimpan.');
    }));
    wrap.querySelectorAll('[data-rm]').forEach((b) => b.addEventListener('click', () => { AL.history.remove(toolId, b.dataset.rm); draw(); }));
  }
  draw();
  wrap.refresh = draw;
  return wrap;
};

/* ================= REPLIKA R2 (12 Okt 2026, manual) =================
   Shared loader engine hapus-background @imgly/background-removal 1.7.0
   (AGPL-3.0 — dulu salah dilabeli MIT; lihat LICENSES.md,
   tanpa key, 100% client-side). Dipakai 2 tool: nexoraautocut &
   removebg — per kontrak Fase 2 fungsi dipakai >1 tool tinggal di core.js.
   Dynamic import (bukan import statis) agar check-tools & halaman lain
   tidak ikut memuat WASM. */
const _imglyCache = { ok: null, mod: null };
export async function imglyRemoval() {
  if (_imglyCache.ok !== null) {
    if (_imglyCache.ok) return _imglyCache.mod;
    throw new Error('imgly-gagal');
  }
  const srcs = [
    'https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.7.0/+esm',
    'https://esm.sh/@imgly/background-removal@1.7.0?bundle',
  ];
  for (const s of srcs) {
    try {
      const mod = await import(/* @vite-ignore */ s);
      if (mod && typeof mod.removeBackground === 'function') {
        _imglyCache.ok = true; _imglyCache.mod = mod;
        return mod;
      }
    } catch (e) { /* coba sumber berikutnya */ }
  }
  _imglyCache.ok = false;
  throw new Error('imgly-gagal');
}

/* Layout teks -> unit [{ch, word, x, y}] di kanvas 1080. Dipakai text2d + textfxanimation.
   o: {maxLines, mode:'char'|'word', font, weight, size, spacing, lineGap, measure(ch)->px} */
AL.layoutText = (text, o) => {
  o = o || {};
  const size = +o.size || 64;
  const fontCss = (o.weight || '700') + ' ' + size + 'px "' + (o.font || 'Lexend') + '", sans-serif';
  const measure = o.measure || ((ch) => String(ch).length * size * 0.62);
  const lines = String(text || '').split('\n').slice(0, Math.max(1, o.maxLines || 2));
  const units = [];
  lines.forEach((ln, li) => {
    const parts = o.mode === 'word'
      ? String(ln).split(/(\s+)/).filter((p) => p && !/^\s+$/.test(p))
      : [...String(ln)];
    const widths = parts.map((p) => [...p].reduce((a, c) => a + measure(c, fontCss, size), 0));
    const gap = o.mode === 'word' ? size * 0.35 : 0;
    const spacing = Math.max(0, +o.spacing || 0);
    const totalW = widths.reduce((a, b) => a + b, 0) + spacing * Math.max(0, parts.length - 1) + gap * Math.max(0, parts.length - 1);
    let cx = 540 - totalW / 2;
    const cy = 540 + (li - (lines.length - 1) / 2) * (Math.max(20, +o.lineGap || size * 1.4));
    parts.forEach((p, pi) => {
      let px = cx;
      [...p].forEach((c) => {
        if (c !== ' ' || o.mode === 'word') units.push({ ch: c, word: p, x: px, y: cy });
        px += measure(c, fontCss, size) + spacing;
      });
      cx += widths[pi] + spacing + gap;
    });
  });
  return units;
};

/* Vektorisasi satu string pada posisi baseline (bx, by) -> {d, advance, w, h}.
   Dipakai textvector + trimpath. Kembalikan null di luar browser. */
AL.vectorizeText = (s, fontCss, px, pad, smooth, bx, by, shear) => {
  const r = AL.rasterizeChar(s, fontCss, px, pad);
  if (!r) return null;
  const polys = AL.traceContours(r.mask, r.w, r.h, 128);
  if (!polys.length) return { d: '', advance: r.advance, w: r.w, h: r.h };
  const sh = +shear || 0;
  const dx = bx - pad - 2, dy = by - (pad + 2 + px);
  const moved = polys.map((poly) => poly.map((p) => [p[0] + dx + sh * p[1], p[1] + dy]));
  return { d: AL.polysToPath(moved, smooth !== false), advance: r.advance, w: r.w, h: r.h };
};

/* ================= v6.12.0 — pola hasil kalkulator, rantai antar-tool, ZIP =================
   Dari riset 13 Nov 2026 bagian 3 (ide UX #6, #7, #11, #13). Ditulis manual —
   bukan bagian auto-generated split-tools.py. */

/* --- Pola hasil Calculator.net (ide UX #6) ---
   Form di atas (punya tool sendiri), lalu hasil: angka besar + tabel rincian
   + penjelasan bahasa sederhana + asumsi/batasan. Dipakai tool kalkulator
   di dalam render() setelah menghitung, mis.:
     const box = T.out();
     T.show(box, '');
     box.appendChild(T.calcResult({
       big: T.rp(total), label: 'Total yang harus dibayar',
       rows: [['Pokok', T.rp(pokok)], ['Bunga', T.rp(bunga)]],
       explain: 'Dari Rp5.000.000 yang kamu pinjam, ...',
       note: 'Bunga diasumsikan tetap selama tenor.',
       actions: [T.copyBtn(() => '...', 'Salin hasil')],
     }));
   big/label/explain/note di-escape (teks polos); rows memakai kvRows yang
   juga meng-escape kunci & nilai. actions: elemen DOM opsional (tombol dsb). */
export function calcResult(o) {
  o = o || {};
  const wrap = el('<div></div>');
  let html = '';
  if (o.big != null && String(o.big) !== '') {
    html += '<div class="center" style="padding:12px 8px 4px"><div class="big">' + esc(o.big) + '</div>'
      + (o.label ? '<div class="hint" style="margin-top:4px">' + esc(o.label) + '</div>' : '') + '</div>';
  }
  const rows = (Array.isArray(o.rows) ? o.rows : []).filter((r) => Array.isArray(r) && r.length >= 2);
  if (rows.length) html += kvRows(rows);
  if (o.explain) html += '<p style="font-size:13.5px;line-height:1.65;margin:12px 2px 0">' + esc(o.explain) + '</p>';
  if (o.note) html += '<p class="hint" style="margin:10px 2px 0;line-height:1.6"><b style="color:var(--mut)">Asumsi &amp; batasan:</b> ' + esc(o.note) + '</p>';
  wrap.innerHTML = html;
  if (Array.isArray(o.actions) && o.actions.length) {
    const rw = row(...o.actions.filter(Boolean));
    rw.style.marginTop = '12px';
    wrap.appendChild(rw);
  }
  return wrap;
}

/* --- Rantai antar-tool (ide UX #7) ---
   Shell menampilkan rantai otomatis di halaman tool (peta NEXT di app.js).
   Tool yang mau menaruh rantai DI DALAM area hasilnya — tepat setelah user
   selesai menghitung/memproses — bisa memanggil helper ini sendiri:
     box.appendChild(T.nextSteps([
       { id: 'ubah-ukuran-foto', icon: '🖼️', name: 'Ubah Ukuran Foto', desc: 'Kecilkan dimensinya' },
     ]));
   id hanya boleh [a-z0-9-] (selain itu item dilewati) supaya href aman.
   Maks 4 item yang ditampilkan. */
export function nextSteps(items) {
  const list = (Array.isArray(items) ? items : []).filter((it) => it && /^[a-z0-9-]+$/.test(it.id || '')).slice(0, 4);
  const wrap = el('<div style="margin-top:16px"></div>');
  if (!list.length) return wrap;
  wrap.innerHTML = '<div style="font-weight:700;font-size:14px;margin-bottom:8px">Lanjut ke</div>'
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">' + list.map((it) =>
      '<a href="#/t/' + it.id + '" style="display:flex;gap:10px;align-items:center;border:1px solid var(--line);border-radius:12px;padding:10px 12px;text-decoration:none;color:inherit;background:var(--surface)">'
      + '<span style="font-size:20px;flex:none">' + esc(it.icon || '🧰') + '</span>'
      + '<span style="min-width:0"><span style="display:block;font-weight:650;font-size:13.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(it.name || it.id) + '</span>'
      + (it.desc ? '<span class="hint" style="display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(it.desc) + '</span>' : '')
      + '</span></a>').join('') + '</div>';
  return wrap;
}

/* --- Batch + unduh ZIP (ide UX #11) ---
   ZIP "store" (tanpa kompresi) murni JavaScript — tanpa library, tanpa CDN,
   jadi tetap jalan offline. Cocok untuk batch gambar/PDF/audio yang memang
   sudah terkompresi (ukuran ZIP ≈ jumlah ukuran file). Untuk teks mentah
   yang ingin dikecilkan, pakai JSZip via CDN bila perlu (DEFLATE).
   files: [{ name: 'a.png', data: Blob | string | ArrayBuffer | Uint8Array }]
   Nama boleh mengandung subfolder ('foto/a.png'); '..' dan '/' di awal dibuang. */
const _CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c >>> 0;
  }
  return t;
})();
export function crc32(u8) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < u8.length; i++) c = _CRC_TABLE[(c ^ u8[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}
function _dosDateTime(d) {
  const y = Math.max(1980, d.getFullYear());
  return {
    time: ((d.getHours() & 31) << 11) | ((d.getMinutes() & 63) << 5) | ((d.getSeconds() >> 1) & 31),
    date: (((y - 1980) & 127) << 9) | (((d.getMonth() + 1) & 15) << 5) | (d.getDate() & 31),
  };
}
function _zipName(name) {
  const n = String(name || '').replace(/\\/g, '/').split('/').filter((p) => p && p !== '.' && p !== '..').join('/');
  return (n || 'file').slice(0, 200);
}
export async function zipFiles(files) {
  const list = Array.isArray(files) ? files : [];
  const enc = new TextEncoder();
  const parts = [], central = [];
  let offset = 0, count = 0;
  const dos = _dosDateTime(new Date());
  for (const f of list) {
    if (!f || f.data == null) continue;
    let data = f.data;
    if (typeof data === 'string') data = enc.encode(data);
    else if (typeof Blob !== 'undefined' && data instanceof Blob) data = new Uint8Array(await data.arrayBuffer());
    else if (data instanceof ArrayBuffer) data = new Uint8Array(data);
    else if (!(data instanceof Uint8Array)) continue;
    const nameBytes = enc.encode(_zipName(f.name));
    const crc = crc32(data);
    const lh = new DataView(new ArrayBuffer(30));
    lh.setUint32(0, 0x04034b50, true);
    lh.setUint16(4, 20, true);       // versi minimum
    lh.setUint16(6, 0x0800, true);   // nama UTF-8
    lh.setUint16(8, 0, true);        // method 0 = store
    lh.setUint16(10, dos.time, true);
    lh.setUint16(12, dos.date, true);
    lh.setUint32(14, crc, true);
    lh.setUint32(18, data.length, true);
    lh.setUint32(22, data.length, true);
    lh.setUint16(26, nameBytes.length, true);
    lh.setUint16(28, 0, true);
    parts.push(lh.buffer, nameBytes, data);
    const cd = new DataView(new ArrayBuffer(46));
    cd.setUint32(0, 0x02014b50, true);
    cd.setUint16(4, 20, true);       // versi pembuat
    cd.setUint16(6, 20, true);       // versi minimum
    cd.setUint16(8, 0x0800, true);
    cd.setUint16(10, 0, true);
    cd.setUint16(12, dos.time, true);
    cd.setUint16(14, dos.date, true);
    cd.setUint32(16, crc, true);
    cd.setUint32(20, data.length, true);
    cd.setUint32(24, data.length, true);
    cd.setUint16(28, nameBytes.length, true);
    cd.setUint32(42, offset, true);  // offset header lokal
    central.push(cd.buffer, nameBytes);
    offset += 30 + nameBytes.length + data.length;
    count++;
  }
  const cdSize = central.reduce((a, p) => a + p.byteLength, 0);
  const eocd = new DataView(new ArrayBuffer(22));
  eocd.setUint32(0, 0x06054b50, true);
  eocd.setUint16(8, count, true);
  eocd.setUint16(10, count, true);
  eocd.setUint32(12, cdSize, true);
  eocd.setUint32(16, offset, true);
  return new Blob([...parts, ...central, eocd.buffer], { type: 'application/zip' });
}
export async function dlZip(filename, files) {
  const list = (Array.isArray(files) ? files : []).filter((f) => f && f.name != null && f.data != null);
  if (!list.length) { toast('Belum ada file untuk diunduh'); return false; }
  try {
    const blob = await zipFiles(list);
    dl(filename || 'hasil.zip', blob, 'application/zip');
    return true;
  } catch (e) { toast('Gagal membuat ZIP. Coba lagi.'); return false; }
}
export function zipBtn(filename, getFiles, label) {
  const b = btn(label || 'Unduh semua (ZIP)', null);
  b.addEventListener('click', async () => {
    const files = typeof getFiles === 'function' ? getFiles() : getFiles;
    b.disabled = true;
    const ok = await dlZip(filename, files);
    if (ok) toast('ZIP diunduh');
    b.disabled = false;
  });
  return b;
}
