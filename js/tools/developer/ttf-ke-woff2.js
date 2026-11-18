import { h as T, LOCAL_NOTE } from '../../core.js';

export const meta = { id: 'ttf-ke-woff2', name: 'TTF ke WOFF2', cat: 'developer', icon: '🔤', desc: 'Ubah font TTF jadi WOFF2 yang ringan untuk website. Prosesnya di browser, font tidak diunggah ke mana-mana.', keywords: 'ttf,woff2,font,konversi font,webfont,kompres font,otf', since: '6.17.0' };

// Encoder WOFF2 asli di browser: wawoff2 2.0.1 (port WebAssembly dari
// pustaka referensi woff2 Google, oleh fontello, MIT).
// build/compress_binding.js adalah build Emscripten mandiri: WASM-nya
// tertanam sebagai data URI di dalam file itu sendiri, jadi tidak butuh
// file pendamping. Setelah dimuat lewat <script>, global Module tersedia
// dan Module.compress(Uint8Array) mengembalikan Uint8Array hasil atau false.
// Diverifikasi 18 Nov 2026: file 948.640 byte dari jsDelivr + unpkg identik,
// WASM tertanam binernya valid (magic \0asm) dan mengandung simbol compress.
// Hash SRI dibaca dari peta core.js (T.scriptIntegrity) — satu sumber
// kebenaran, bukan konstanta lokal (RED-G2-13).
const WAWOFF2_URL = 'https://cdn.jsdelivr.net/npm/wawoff2@2.0.1/build/compress_binding.js';

let wawoffPromise = null;
function muatWawoff2() {
  if (wawoffPromise) return wawoffPromise;
  wawoffPromise = new Promise((resolve) => {
    // Sudah dimuat sebelumnya?
    if (typeof window.Module !== 'undefined' && typeof window.Module.compress === 'function') {
      resolve(window.Module);
      return;
    }
    // Pasang onRuntimeInitialized SEBELUM script dimuat: preamble
    // Emscripten mengambil override dari Module yang sudah ada.
    const sebelum = window.Module;
    const timeout = setTimeout(() => resolve(null), 30000);
    window.Module = Object.assign({}, sebelum, {
      onRuntimeInitialized() {
        clearTimeout(timeout);
        resolve(typeof window.Module.compress === 'function' ? window.Module : null);
      },
    });
    const s = document.createElement('script');
    s.src = WAWOFF2_URL;
    s.async = true;
    const hashWoff2 = T.scriptIntegrity(WAWOFF2_URL);
    if (hashWoff2) { s.integrity = hashWoff2; s.crossOrigin = 'anonymous'; }
    s.onerror = () => { clearTimeout(timeout); wawoffPromise = null; resolve(null); };
    document.head.appendChild(s);
  });
  return wawoffPromise;
}

// Cek header font: TTF diawali 00 01 00 00 00, OTF diawali "OTTO".
// wawoff2 menerima TTF dan OTF (keduanya sfnt).
export function jenisFont(byte) {
  if (byte.length < 4) return null;
  if (byte[0] === 0x00 && byte[1] === 0x01 && byte[2] === 0x00 && byte[3] === 0x00) return 'TTF';
  if (byte[0] === 0x4F && byte[1] === 0x54 && byte[2] === 0x54 && byte[3] === 0x4F) return 'OTF';
  return null;
}

export function cekWoff2(byte) {
  return byte.length >= 4 && byte[0] === 0x77 && byte[1] === 0x4F && byte[2] === 0x46 && byte[3] === 0x32;
}

function fmtBytes(n) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1).replace('.', ',') + ' KB';
  return (n / 1024 / 1024).toFixed(2).replace('.', ',') + ' MB';
}

export function render(root) {
  root.appendChild(T.el('<p class="hint">Font TTF diubah jadi WOFF2 langsung di browser pakai encoder WOFF2 asli (port WebAssembly dari pustaka referensi Google). Hasilnya biasanya jauh lebih kecil dan siap dipakai di website. ' + T.esc(LOCAL_NOTE) + '</p>'));

  const fileI = document.createElement('input');
  fileI.type = 'file';
  fileI.accept = '.ttf,.otf';
  fileI.className = 'inp';
  const statusEl = T.el('<p class="hint"></p>');
  const box = T.out();

  let hasilBlob = null;
  let namaHasil = 'font.woff2';

  async function proses() {
    const f = fileI.files && fileI.files[0];
    if (!f) return;
    if (f.size > 30 * 1024 * 1024) { T.toast('Filenya terlalu besar (maksimal 30 MB)'); return; }
    statusEl.textContent = 'Memeriksa file font...';
    const buf = new Uint8Array(await f.arrayBuffer());
    const jenis = jenisFont(buf);
    if (!jenis) {
      statusEl.textContent = '';
      T.toast('File ini bukan font TTF atau OTF yang valid.');
      return;
    }
    statusEl.textContent = 'Memuat encoder WOFF2 (sekali saja, sekitar 1 MB)...';
    const mod = await muatWawoff2();
    if (!mod) {
      statusEl.textContent = '';
      T.toast('Encoder WOFF2 gagal dimuat. Cek koneksi internet lalu coba lagi.');
      return;
    }
    statusEl.textContent = 'Mengubah ' + jenis + ' ke WOFF2...';
    // Beri jeda supaya status sempat tampil sebelum proses berat jalan.
    await new Promise((r) => setTimeout(r, 30));
    let keluar;
    try {
      keluar = mod.compress(buf);
    } catch (e) {
      statusEl.textContent = '';
      T.toast('Konversi gagal: ' + (e && e.message ? e.message : 'font tidak bisa dibaca encoder.'));
      return;
    }
    if (!keluar || keluar === false) {
      statusEl.textContent = '';
      T.toast('Konversi gagal. Font ini mungkin memakai format yang tidak didukung encoder.');
      return;
    }
    const hasil = new Uint8Array(keluar);
    if (!cekWoff2(hasil)) {
      statusEl.textContent = '';
      T.toast('Hasil konversi tidak valid (bukan file WOFF2). Konversi dibatalkan.');
      return;
    }
    statusEl.textContent = '';
    hasilBlob = new Blob([hasil], { type: 'font/woff2' });
    namaHasil = f.name.replace(/\.(ttf|otf)$/i, '') + '.woff2';
    const hemat = Math.round((1 - hasil.length / buf.length) * 100);
    const namaFont = f.name.replace(/\.(ttf|otf)$/i, '');
    T.show(box,
      '<p class="big">' + fmtBytes(buf.length) + ' jadi ' + fmtBytes(hasil.length) + '</p>' +
      '<p>Ukuran menyusut ' + hemat + '%. File WOFF2-nya sudah dicek dan valid (diawali signature wOF2).</p>' +
      '<p class="hint">Cara pakai di website:</p>' +
      '<pre style="white-space:pre-wrap;word-break:break-word;background:#12100d;border:1px solid #2e2823;border-radius:8px;padding:12px;font-size:12.5px;line-height:1.5">@font-face {\n  font-family: \'' + T.esc(namaFont) + '\';\n  src: url(\'' + T.esc(namaHasil) + '\') format(\'woff2\');\n  font-display: swap;\n}</pre>');
    const aksi = T.el('<div class="row" style="flex-wrap:wrap;margin-top:10px"></div>');
    aksi.append(
      T.btn('Unduh ' + namaHasil, () => T.dl(namaHasil, hasilBlob, 'font/woff2'), true),
      T.copyBtn(() => "@font-face {\n  font-family: '" + namaFont + "';\n  src: url('" + namaHasil + "') format('woff2');\n  font-display: swap;\n}", 'Salin kode @font-face'),
    );
    box.appendChild(aksi);
  }

  fileI.addEventListener('change', proses);

  root.append(
    T.field('Pilih file font (.ttf atau .otf)', fileI),
    statusEl,
    box,
    T.el('<p class="hint" style="margin-top:14px">WOFF2 didukung semua browser modern. Font hasil konversi tetap milikmu sepenuhnya dan tidak pernah meninggalkan perangkatmu.</p>'),
  );
}
