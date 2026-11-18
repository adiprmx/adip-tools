import { h as T, LOCAL_NOTE } from '../../core.js';

export const meta = { id: 'cek-jenis-file-asli', name: 'Cek Jenis File Asli', cat: 'developer', icon: '🔍', desc: 'Kenali format asli file dari isi byte pertamanya, bukan dari nama belakangnya. Ketahuan kalau ada file yang pura-pura.', keywords: 'magic bytes,jenis file,format file,signature file,cek file,ekstensi palsu,forensik', since: '6.17.0' };

// Tabel signature format umum. offset: posisi byte awal signature.
// cocok: fungsi khusus bila signature tidak cukup (mis. RIFF butuh cek subtipe).
export const SIGNATURE = [
  { nama: 'PNG (gambar)', ekstensi: ['png'], byte: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] },
  { nama: 'JPEG (gambar)', ekstensi: ['jpg', 'jpeg'], byte: [0xFF, 0xD8, 0xFF] },
  { nama: 'GIF (gambar)', ekstensi: ['gif'], teks: 'GIF8' },
  { nama: 'WebP (gambar)', ekstensi: ['webp'], cek: (b) => teksDi(b, 0, 'RIFF') && teksDi(b, 8, 'WEBP') },
  { nama: 'BMP (gambar)', ekstensi: ['bmp'], teks: 'BM' },
  { nama: 'TIFF (gambar)', ekstensi: ['tif', 'tiff'], cek: (b) => teksDi(b, 0, 'II*\0') || teksDi(b, 0, 'MM\0*') },
  { nama: 'Ikon Windows (ICO)', ekstensi: ['ico'], byte: [0x00, 0x00, 0x01, 0x00] },
  { nama: 'HEIC/HEIF (foto iPhone)', ekstensi: ['heic', 'heif'], cek: (b) => teksDi(b, 4, 'ftyp') && /heic|heix|hevc|mif1/.test(teksAmbil(b, 8, 4)) },
  { nama: 'PDF (dokumen)', ekstensi: ['pdf'], teks: '%PDF' },
  { nama: 'RTF (dokumen)', ekstensi: ['rtf'], teks: '{\\rtf' },
  { nama: 'ZIP (arsip)', ekstensi: ['zip', 'docx', 'xlsx', 'pptx', 'apk', 'jar', 'epub'], cek: (b) => teksDi(b, 0, 'PK\x03\x04') || teksDi(b, 0, 'PK\x05\x06') || teksDi(b, 0, 'PK\x07\x08'), catatan: 'DOCX, XLSX, APK, dan EPUB juga memakai wadah ZIP, jadi tidak bisa dibedakan dari byte awalnya saja.' },
  { nama: 'RAR (arsip)', ekstensi: ['rar'], cek: (b) => teksDi(b, 0, 'Rar!\x1A\x07\x00') || teksDi(b, 0, 'Rar!\x1A\x07\x01\x00') },
  { nama: '7-Zip (arsip)', ekstensi: ['7z'], byte: [0x37, 0x7A, 0xBC, 0xAF, 0x27, 0x1C] },
  { nama: 'GZIP (arsip)', ekstensi: ['gz'], byte: [0x1F, 0x8B] },
  { nama: 'BZIP2 (arsip)', ekstensi: ['bz2'], teks: 'BZh' },
  { nama: 'XZ (arsip)', ekstensi: ['xz'], byte: [0xFD, 0x37, 0x7A, 0x58, 0x5A, 0x00] },
  { nama: 'Zstandard (arsip)', ekstensi: ['zst'], byte: [0x28, 0xB5, 0x2F, 0xFD] },
  { nama: 'TAR (arsip)', ekstensi: ['tar'], cek: (b) => teksDi(b, 257, 'ustar') },
  { nama: 'MP3 (audio)', ekstensi: ['mp3'], cek: (b) => teksDi(b, 0, 'ID3') || (b[0] === 0xFF && (b[1] & 0xE0) === 0xE0) },
  { nama: 'WAV (audio)', ekstensi: ['wav'], cek: (b) => teksDi(b, 0, 'RIFF') && teksDi(b, 8, 'WAVE') },
  { nama: 'OGG (audio/video)', ekstensi: ['ogg', 'ogv', 'opus'], teks: 'OggS' },
  { nama: 'FLAC (audio)', ekstensi: ['flac'], teks: 'fLaC' },
  { nama: 'MP4 (video)', ekstensi: ['mp4', 'm4v', 'm4a'], cek: (b) => teksDi(b, 4, 'ftyp') && /isom|iso2|mp4|M4V|M4A|dash/.test(teksAmbil(b, 8, 4)) },
  { nama: 'QuickTime MOV (video)', ekstensi: ['mov'], cek: (b) => teksDi(b, 4, 'ftyp') && teksDi(b, 8, 'qt  ') },
  { nama: 'MKV/WebM (video)', ekstensi: ['mkv', 'webm'], byte: [0x1A, 0x45, 0xDF, 0xA3], catatan: 'MKV dan WebM memakai wadah EBML yang sama, tidak bisa dibedakan dari byte awalnya saja.' },
  { nama: 'AVI (video)', ekstensi: ['avi'], cek: (b) => teksDi(b, 0, 'RIFF') && teksDi(b, 8, 'AVI ') },
  { nama: 'SQLite (database)', ekstensi: ['db', 'sqlite', 'sqlite3'], teks: 'SQLite format 3\0' },
  { nama: 'Parquet (data)', ekstensi: ['parquet'], teks: 'PAR1' },
  { nama: 'WOFF (font)', ekstensi: ['woff'], teks: 'wOFF' },
  { nama: 'WOFF2 (font)', ekstensi: ['woff2'], teks: 'wOF2' },
  { nama: 'TrueType (font)', ekstensi: ['ttf'], byte: [0x00, 0x01, 0x00, 0x00, 0x00] },
  { nama: 'OpenType (font)', ekstensi: ['otf'], teks: 'OTTO' },
  { nama: 'Program Windows (EXE/DLL)', ekstensi: ['exe', 'dll'], teks: 'MZ' },
  { nama: 'Program Linux (ELF)', ekstensi: [''], teks: '\x7FELF' },
  { nama: 'Program macOS (Mach-O)', ekstensi: [''], cek: (b) => (b[0] === 0xFE && b[1] === 0xED && b[2] === 0xFA) || (b[0] === 0xCF && b[1] === 0xFA && b[2] === 0xED && b[3] === 0xFE) },
  { nama: 'Kelas Java / Mach-O universal', ekstensi: ['class'], byte: [0xCA, 0xFE, 0xBA, 0xBE], catatan: 'Byte awal ini dipakai dua format: file kelas Java dan Mach-O universal macOS.' },
  { nama: 'WebAssembly (WASM)', ekstensi: ['wasm'], byte: [0x00, 0x61, 0x73, 0x6D] },
  { nama: 'DEX Android', ekstensi: ['dex'], teks: 'dex\n' },
  { nama: 'Photoshop (PSD)', ekstensi: ['psd'], teks: '8BPS' },
  { nama: 'Class/Objek Java (serialisasi)', ekstensi: ['ser'], byte: [0xAC, 0xED] },
];

function teksDi(b, offset, s) {
  if (b.length < offset + s.length) return false;
  for (let i = 0; i < s.length; i++) {
    if (b[offset + i] !== s.charCodeAt(i)) return false;
  }
  return true;
}
function teksAmbil(b, offset, n) {
  let s = '';
  for (let i = 0; i < n && offset + i < b.length; i++) s += String.fromCharCode(b[offset + i]);
  return s;
}

function cocokByte(b, sig) {
  if (sig.cek) return sig.cek(b);
  if (sig.teks) return teksDi(b, 0, sig.teks);
  if (sig.byte) {
    if (b.length < sig.byte.length) return false;
    return sig.byte.every((v, i) => b[i] === v);
  }
  return false;
}

// Kenali format dari byte awal (Uint8Array). Kembalikan entri SIGNATURE atau null.
export function kenaliFormat(byte) {
  for (const sig of SIGNATURE) {
    if (cocokByte(byte, sig)) return sig;
  }
  return null;
}

// Cek apakah byte tampak seperti teks biasa (UTF-8/ASCII).
export function tampakTeks(byte) {
  if (!byte.length) return false;
  let teks = 0;
  for (let i = 0; i < Math.min(byte.length, 512); i++) {
    const v = byte[i];
    if (v === 9 || v === 10 || v === 13 || (v >= 32 && v < 127) || v >= 128) teks++;
  }
  return teks / Math.min(byte.length, 512) > 0.95;
}

export function hexDump(byte, n) {
  const ambil = byte.slice(0, n || 32);
  return Array.from(ambil).map((v) => v.toString(16).padStart(2, '0')).join(' ').toUpperCase();
}

export function render(root) {
  root.appendChild(T.el('<p class="hint">Pilih file apa saja. Tool ini membaca 512 byte pertamanya dan mencocokkannya dengan daftar signature format yang dikenal. Pemeriksaan ini hanya membaca byte awal; file yang sengaja dibuat bisa memalsukan byte awalnya, jadi ini bukan jaminan file tersebut benar-benar format itu. ' + T.esc(LOCAL_NOTE) + '</p>'));

  const fileI = document.createElement('input');
  fileI.type = 'file';
  fileI.className = 'inp';
  const box = T.out();

  async function periksa() {
    const f = fileI.files && fileI.files[0];
    if (!f) return;
    const potong = f.slice(0, 512);
    const buf = await potong.arrayBuffer();
    const byte = new Uint8Array(buf);
    const sig = kenaliFormat(byte);
    const ekstensi = (f.name.split('.').pop() || '').toLowerCase();
    let isi = '';
    if (sig) {
      const cocokEkstensi = sig.ekstensi.includes(ekstensi);
      isi = '<p class="big">' + T.esc(sig.nama) + '</p>' +
        '<p>Nama file: <b>' + T.esc(f.name) + '</b> (' + T.fmt(f.size) + ' byte).</p>' +
        (sig.ekstensi.length && sig.ekstensi[0]
          ? '<p>Ekstensi yang biasa dipakai format ini: <b>.' + sig.ekstensi.join(', .') + '</b>.</p>'
          : '') +
        (cocokEkstensi
          ? '<p>Ekstensi file cocok dengan isinya.</p>'
          : '<p style="color:var(--err);font-weight:700">Hati-hati: ekstensi .' + T.esc(ekstensi) + ' tidak cocok dengan isi file ini. File ini aslinya ' + T.esc(sig.nama) + ', bukan file .' + T.esc(ekstensi) + '.</p>') +
        (sig.catatan ? '<p class="hint">' + T.esc(sig.catatan) + '</p>' : '');
    } else if (tampakTeks(byte)) {
      isi = '<p class="big">Berkas teks biasa</p>' +
        '<p>Byte awalnya tampak seperti teks (tidak ada signature biner yang dikenal). Bisa jadi TXT, JSON, XML, HTML, CSV, atau kode sumber.</p>';
    } else {
      isi = '<p class="big">Format tidak dikenal</p>' +
        '<p>Byte awal file ini tidak cocok dengan format apa pun di daftar kami (' + SIGNATURE.length + ' format). File ini mungkin format langka, terenkripsi, atau rusak.</p>';
    }
    isi += '<p class="hint">32 byte pertama (hex):</p><pre style="white-space:pre-wrap;word-break:break-all;background:#12100d;border:1px solid #2e2823;border-radius:8px;padding:12px;font-size:12px;line-height:1.6">' + hexDump(byte, 32) + '</pre>';
    T.show(box, isi);
  }

  fileI.addEventListener('change', periksa);

  // Tabel referensi semua signature.
  const tabel = T.el('<div style="margin-top:20px"></div>');
  tabel.appendChild(T.el('<p style="font-weight:700;font-size:16px;margin:0 0 8px">Daftar format yang dikenali (' + SIGNATURE.length + ' format)</p>'));
  const rows = SIGNATURE.map((s) => {
    const sig = s.teks ? '"' + s.teks.replace(/\0/g, '\\0') + '"' : s.byte ? s.byte.map((v) => v.toString(16).padStart(2, '0')).join(' ').toUpperCase() : 'khusus (cek posisi byte)';
    return '<tr><td style="padding:6px 8px;border-bottom:1px solid #251f18">' + T.esc(s.nama) + '</td><td style="padding:6px 8px;border-bottom:1px solid #251f18;font-family:monospace;font-size:12px;word-break:break-all">' + T.esc(sig) + '</td></tr>';
  }).join('');
  tabel.appendChild(T.el('<table style="width:100%;border-collapse:collapse;font-size:13px"><tr><th style="text-align:left;padding:6px 8px;border-bottom:1px solid #251f18">Format</th><th style="text-align:left;padding:6px 8px;border-bottom:1px solid #251f18">Byte awal</th></tr>' + rows + '</table>'));

  root.append(
    T.field('Pilih file', fileI),
    box,
    tabel,
  );
}
