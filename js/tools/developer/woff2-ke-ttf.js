import { h as T, LOCAL_NOTE } from '../../core.js';

// Decoder WOFF2 asli di browser: wawoff2 2.0.1 (port WebAssembly dari
// pustaka referensi woff2 Google, oleh fontello, MIT).
// build/decompress_binding.js adalah build Emscripten mandiri: WASM-nya
// tertanam sebagai data URI di dalam file itu sendiri, jadi tidak butuh
// file pendamping. Setelah dimuat lewat <script>, global Module tersedia
// dan Module.decompress(Uint8Array) mengembalikan Uint8Array hasil atau
// false. Cermin dari ttf-ke-woff2.js (yang memakai compress_binding.js).
// CATATAN SRI / GERBANG INTEGRASI (G4 Blue R1, RED-02): hash
// decompress_binding.js BELUM ada di peta SRI_HASH core.js (egress mati
// saat G4, hash belum bisa diukur) — tool ini MENOLAK memuat decoder
// sampai hash itu masuk (lihat muatWawoff2: tanpa hash dari
// T.scriptIntegrity, pemuatan tidak dimulai dan pengguna melihat pesan
// jujur bahwa fitur belum bisa dipakai). Ini gerbang sementara, BUKAN
// penonaktifan permanen: begitu koordinator mengukur hash 2x saat
// egress pulih dan memasukkannya ke SRI_HASH, tool jalan normal dengan
// integrity terpasang — tanpa perubahan kode lagi. JANGAN PERNAH
// memasukkan hash yang tidak terukur langsung dari CDN.
const WAWOFF2_URL = 'https://cdn.jsdelivr.net/npm/wawoff2@2.0.1/build/decompress_binding.js';

let wawoffPromise = null;
let wawoffTanpaHash = false;
function muatWawoff2() {
  if (wawoffPromise) return wawoffPromise;
  wawoffPromise = new Promise((resolve) => {
    // Gerbang RED-02: hash WAJIB ada sebelum script disentuh. Dicek
    // duluan (sebelum cek window.Module) supaya tidak ada jalur yang
    // bisa memakai decoder tanpa integritas.
    const hashWoff2 = T.scriptIntegrity(WAWOFF2_URL);
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
    s.src = WAWOFF2_URL;
    s.async = true;
    s.integrity = hashWoff2;
    s.crossOrigin = 'anonymous';
    s.onerror = () => { clearTimeout(timeout); wawoffPromise = null; resolve(null); };
    document.head.appendChild(s);
  });
  return wawoffPromise;
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

function fmtBytes(n) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1).replace('.', ',') + ' KB';
  return (n / 1024 / 1024).toFixed(2).replace('.', ',') + ' MB';
}

export const meta = { id: 'woff2-ke-ttf', name: 'WOFF2 ke TTF', cat: 'developer', icon: '🔤', desc: 'Ubah font web WOFF2 kembali jadi TTF (atau OTF) untuk dipakai di aplikasi desktop. Prosesnya di browser, font tidak diunggah ke mana-mana.', keywords: 'woff2,ttf,otf,font,konversi font,webfont,dekompres font', since: '6.19.0' };

export function render(root) {
  root.appendChild(T.el('<p class="hint">Font WOFF2 diubah kembali jadi TTF langsung di browser pakai decoder WOFF2 asli (port WebAssembly dari pustaka referensi Google). Hasilnya bisa dipakai di aplikasi desktop yang tidak mendukung WOFF2. ' + T.esc(LOCAL_NOTE) + '</p>'));

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
    const mod = await muatWawoff2();
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

  root.append(
    T.field('Pilih file font (.woff2)', fileI),
    statusEl,
    box,
    T.el('<p class="hint" style="margin-top:14px">TTF hasil konversi biasanya lebih besar dari WOFF2 karena tidak terkompres lagi. Font hasil konversi tetap milikmu sepenuhnya dan tidak pernah meninggalkan perangkatmu.</p>'),
  );
}
