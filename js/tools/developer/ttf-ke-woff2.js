// MERGE B27 (v6.21.0, D2): satu tool dua arah. Mesin kedua arah
// dipertahankan berdampingan di file ini (NOL fungsi hilang):
// arah A = ttf-ke-woff2 (survivor), arah B = woff2-ke-ttf (dipensiunkan,
// diserap ke sini). Sakelar arah ada di paling atas render().

import { h as T, LOCAL_NOTE } from '../../core.js';

export const meta = {"id": "ttf-ke-woff2", "name": "TTF ↔ WOFF2", "cat": "developer", "icon": "🔤", "desc": "Ubah font TTF/OTF jadi WOFF2 yang ringan, atau WOFF2 kembali jadi TTF/OTF.", "keywords": "ttf,woff2,font,konversi font,webfont,kompres font,dekompres font,otf,ttf ke woff2,woff2 ke ttf", "since": "6.17.0", "online": true};


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



function fmtBytes(n) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1).replace('.', ',') + ' KB';
  return (n / 1024 / 1024).toFixed(2).replace('.', ',') + ' MB';
}

// ---------- Mesin arah B: WOFF2 → TTF (dari woff2-ke-ttf.js) ----------
const WAWOFF2_DEC_URL = 'https://cdn.jsdelivr.net/npm/wawoff2@2.0.1/build/decompress_binding.js';

let wawoffDecPromise = null;
let wawoffTanpaHash = false;
function muatWawoff2Dec() {
  if (wawoffDecPromise) return wawoffDecPromise;
  wawoffDecPromise = new Promise((resolve) => {
    // Gerbang RED-02: hash WAJIB ada sebelum script disentuh. Dicek
    // duluan (sebelum cek window.Module) supaya tidak ada jalur yang
    // bisa memakai decoder tanpa integritas.
    const hashWoff2 = T.scriptIntegrity(WAWOFF2_DEC_URL);
    if (!hashWoff2) { wawoffTanpaHash = true; resolve(null); return; }
    if (typeof window.Module !== 'undefined' && typeof window.Module.decompress === 'function') {
      resolve(window.Module);
      return;
    }
    const sebelum = window.Module;
    const timeout = setTimeout(() => resolve(null), 30000);
    window.Module = Object.assign({}, sebelum, {
      onRuntimeInitialized() {
        clearTimeout(timeout);
        resolve(typeof window.Module.decompress === 'function' ? window.Module : null);
      },
    });
    const s = document.createElement('script');
    s.src = WAWOFF2_DEC_URL;
    s.async = true;
    s.integrity = hashWoff2;
    s.crossOrigin = 'anonymous';
    s.onerror = () => { clearTimeout(timeout); wawoffDecPromise = null; resolve(null); };
    document.head.appendChild(s);
  });
  return wawoffDecPromise;
}

export function cekWoff2(byte) {
  return !!byte && byte.length >= 4 && byte[0] === 0x77 && byte[1] === 0x4F && byte[2] === 0x46 && byte[3] === 0x32;
}

const u16 = (b, o) => (b[o] << 8) | b[o + 1];
const u32 = (b, o) => ((b[o] << 24) | (b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3]) >>> 0;

// Parse header WOFF2 (48 byte). Mengembalikan null bila bukan WOFF2.
export function parseHeaderWoff2(byte) {
  if (!cekWoff2(byte) || byte.length < 48) return null;
  const flavor = String.fromCharCode(byte[4], byte[5], byte[6], byte[7]);
  return {
    flavor: flavor === '\0\x01\0\0' ? 'TTF' : (flavor === 'OTTO' ? 'OTF' : flavor),
    flavorMentah: flavor,
    length: u32(byte, 8),
    numTables: u16(byte, 12),
    totalSfntSize: u32(byte, 16),
    totalCompressedSize: u32(byte, 20),
    majorVersion: u16(byte, 24),
    minorVersion: u16(byte, 26),
  };
}

// Cek hasil dekompresi: TTF (00 01 00 00 / 'true') atau OTF ('OTTO').
export function cekTtf(byte) {
  if (!byte || byte.length < 4) return null;
  if (byte[0] === 0x00 && byte[1] === 0x01 && byte[2] === 0x00 && byte[3] === 0x00) return 'TTF';
  if (byte[0] === 0x74 && byte[1] === 0x72 && byte[2] === 0x75 && byte[3] === 0x65) return 'TTF';
  if (byte[0] === 0x4F && byte[1] === 0x54 && byte[2] === 0x54 && byte[3] === 0x4F) return 'OTF';
  return null;
}

// Sakelar arah: dua tombol besar di paling atas. Arah yang aktif tampil
// terbalik (putih di atas hitam) supaya langsung kelihatan tanpa membaca
// kecil-kecil. Kedua panel tetap hidup berdampingan — pindah arah tidak
// menghapus isian di panel yang ditinggalkan.
/* R1 (v6.21.0): alias redirect — kunjungan dari tautan lama arah B
   (#/t/<id-pensiun>) mendarat di sini dengan ?dir=b; buka langsung
   panel arah B. Tanpa ?dir=b, perilaku lama (arah A) tidak berubah. */
function mintaArahB() {
  try {
    const q = (typeof location !== 'undefined' && location.hash.split('?')[1]) || '';
    return /(?:^|&)dir=b(?:&|$)/.test(q);
  } catch {
    return false;
  }
}

function buatSakelarArah(labelA, labelB, panelA, panelB) {
  const bungkus = T.el('<div role="tablist" aria-label="Arah konversi" style="display:flex;gap:8px;margin:2px 0 16px"></div>');
  const GAYA_AKTIF = 'flex:1;min-height:48px;padding:12px 8px;border-radius:10px;border:1px solid #ffffff;font-size:15px;font-weight:700;background:#ffffff;color:#000000;cursor:pointer;transition:background .15s,color .15s,border-color .15s';
  const GAYA_MATI = 'flex:1;min-height:48px;padding:12px 8px;border-radius:10px;border:1px solid #ffffff33;font-size:15px;font-weight:600;background:transparent;color:#a1a1aa;cursor:pointer;transition:background .15s,color .15s,border-color .15s';
  const tombolA = document.createElement('button');
  tombolA.type = 'button';
  tombolA.textContent = labelA;
  tombolA.setAttribute('role', 'tab');
  const tombolB = document.createElement('button');
  tombolB.type = 'button';
  tombolB.textContent = labelB;
  tombolB.setAttribute('role', 'tab');
  const atur = (keA) => {
    tombolA.style.cssText = keA ? GAYA_AKTIF : GAYA_MATI;
    tombolB.style.cssText = keA ? GAYA_MATI : GAYA_AKTIF;
    tombolA.setAttribute('aria-selected', keA ? 'true' : 'false');
    tombolB.setAttribute('aria-selected', keA ? 'false' : 'true');
    panelA.hidden = !keA;
    panelB.hidden = keA;
  };
  tombolA.addEventListener('click', () => atur(true));
  tombolB.addEventListener('click', () => atur(false));
  bungkus.appendChild(tombolA);
  bungkus.appendChild(tombolB);
  atur(!mintaArahB());
  return bungkus;
}

function renderTtfKeWoff2(panel) {
  panel.appendChild(T.el('<p class="hint">Font TTF diubah jadi WOFF2 langsung di browser pakai encoder WOFF2 asli (port WebAssembly dari pustaka referensi Google). Hasilnya biasanya jauh lebih kecil dan siap dipakai di website. ' + T.esc(LOCAL_NOTE) + '</p>'));

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

  panel.append(
    T.field('Pilih file font (.ttf atau .otf)', fileI),
    statusEl,
    box,
    T.el('<p class="hint" style="margin-top:14px">WOFF2 didukung semua browser modern. Font hasil konversi tetap milikmu sepenuhnya dan tidak pernah meninggalkan perangkatmu.</p>'),
  );
}

function renderWoff2KeTtf(panel) {
  panel.appendChild(T.el('<p class="hint">Font WOFF2 diubah kembali jadi TTF langsung di browser pakai decoder WOFF2 asli (port WebAssembly dari pustaka referensi Google). Hasilnya bisa dipakai di aplikasi desktop yang tidak mendukung WOFF2. ' + T.esc(LOCAL_NOTE) + '</p>'));

  const fileI = document.createElement('input');
  fileI.type = 'file';
  fileI.accept = '.woff2';
  fileI.className = 'inp';
  const statusEl = T.el('<p class="hint"></p>');
  const box = T.out();

  let hasilBlob = null;
  let namaHasil = 'font.ttf';

  async function proses() {
    const f = fileI.files && fileI.files[0];
    if (!f) return;
    if (f.size > 30 * 1024 * 1024) { T.toast('Filenya terlalu besar (maksimal 30 MB)'); return; }
    statusEl.textContent = 'Memeriksa file font...';
    const buf = new Uint8Array(await f.arrayBuffer());
    const header = parseHeaderWoff2(buf);
    if (!header) {
      statusEl.textContent = '';
      T.toast('File ini bukan font WOFF2 yang valid.');
      return;
    }
    statusEl.textContent = 'Memuat decoder WOFF2 (sekali saja, sekitar 1 MB)...';
    const mod = await muatWawoff2Dec();
    if (!mod) {
      statusEl.textContent = '';
      T.toast(wawoffTanpaHash
        ? 'Fitur ini belum bisa dipakai: decoder WOFF2 belum terverifikasi keamanannya. Coba lagi nanti.'
        : 'Decoder WOFF2 gagal dimuat. Cek koneksi internet lalu coba lagi.');
      return;
    }
    statusEl.textContent = 'Mengubah WOFF2 ke ' + header.flavor + '...';
    await new Promise((r) => setTimeout(r, 30));
    let keluar;
    try {
      keluar = mod.decompress(buf);
    } catch (e) {
      statusEl.textContent = '';
      T.toast('Konversi gagal: ' + (e && e.message ? e.message : 'font tidak bisa dibaca decoder.'));
      return;
    }
    if (!keluar || keluar === false) {
      statusEl.textContent = '';
      T.toast('Konversi gagal. Font ini mungkin memakai format yang tidak didukung decoder.');
      return;
    }
    const hasil = new Uint8Array(keluar);
    const jenisHasil = cekTtf(hasil);
    if (!jenisHasil) {
      statusEl.textContent = '';
      T.toast('Hasil konversi tidak valid (bukan file TTF/OTF). Konversi dibatalkan.');
      return;
    }
    statusEl.textContent = '';
    const ekstensi = jenisHasil === 'OTF' ? '.otf' : '.ttf';
    hasilBlob = new Blob([hasil], { type: jenisHasil === 'OTF' ? 'font/otf' : 'font/ttf' });
    namaHasil = f.name.replace(/\.woff2$/i, '') + ekstensi;
    const namaFont = f.name.replace(/\.woff2$/i, '');
    T.show(box,
      '<p class="big">' + fmtBytes(buf.length) + ' jadi ' + fmtBytes(hasil.length) + '</p>' +
      '<p>WOFF2 berhasil diubah jadi ' + jenisHasil + ' (' + header.numTables + ' tabel). File hasilnya sudah dicek dan valid.</p>' +
      '<p class="hint">Cara pakai di website (bila perlu format TTF):</p>' +
      '<pre style="white-space:pre-wrap;word-break:break-word;background:#12100d;border:1px solid #2e2823;border-radius:8px;padding:12px;font-size:12.5px;line-height:1.5">@font-face {\n  font-family: \'' + T.esc(namaFont) + '\';\n  src: url(\'' + T.esc(namaHasil) + '\') format(\'' + (jenisHasil === 'OTF' ? 'opentype' : 'truetype') + '\');\n  font-display: swap;\n}</pre>');
    const aksi = T.el('<div class="row" style="flex-wrap:wrap;margin-top:10px"></div>');
    aksi.append(
      T.btn('Unduh ' + namaHasil, () => T.dl(namaHasil, hasilBlob, hasilBlob.type), true),
      T.copyBtn(() => "@font-face {\n  font-family: '" + namaFont + "';\n  src: url('" + namaHasil + "') format('" + (jenisHasil === 'OTF' ? 'opentype' : 'truetype') + "');\n  font-display: swap;\n}", 'Salin kode @font-face'),
    );
    box.appendChild(aksi);
  }

  fileI.addEventListener('change', proses);

  panel.append(
    T.field('Pilih file font (.woff2)', fileI),
    statusEl,
    box,
    T.el('<p class="hint" style="margin-top:14px">TTF hasil konversi biasanya lebih besar dari WOFF2 karena tidak terkompres lagi. Font hasil konversi tetap milikmu sepenuhnya dan tidak pernah meninggalkan perangkatmu.</p>'),
  );
}

export function render(root) {
  const panelA = T.el('<div></div>');
  const panelB = T.el('<div></div>');
  renderTtfKeWoff2(panelA);
  renderWoff2KeTtf(panelB);
  root.appendChild(buatSakelarArah('TTF → WOFF2', 'WOFF2 → TTF', panelA, panelB));
  root.appendChild(panelA);
  root.appendChild(panelB);
}
