import { h as T, fmtBytes, errBox } from '../../core.js';

// Pratinjau font dari file TTF/OTF/WOFF/WOFF2: tampilkan contoh huruf
// dengan font itu + info dari tabel namanya. 100% client-side.
// Batas jujur: info detail (nama, pembuat) untuk WOFF2 tidak bisa dibaca
// tanpa decoder WOFF2 — pratinjau tetap jalan lewat FontFace browser.
const u16 = (b, o) => (b[o] << 8) | b[o + 1];
const u32 = (b, o) => ((b[o] << 24) | (b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3]) >>> 0;

export function jenisFontFile(byte) {
  if (!byte || byte.length < 4) return null;
  if (byte[0] === 0x00 && byte[1] === 0x01 && byte[2] === 0x00 && byte[3] === 0x00) return 'TTF';
  if (byte[0] === 0x74 && byte[1] === 0x72 && byte[2] === 0x75 && byte[3] === 0x65) return 'TTF'; // 'true'
  if (byte[0] === 0x4F && byte[1] === 0x54 && byte[2] === 0x54 && byte[3] === 0x4F) return 'OTF'; // OTTO
  if (byte[0] === 0x77 && byte[1] === 0x4F && byte[2] === 0x46 && byte[3] === 0x46) return 'WOFF'; // wOFF
  if (byte[0] === 0x77 && byte[1] === 0x4F && byte[2] === 0x46 && byte[3] === 0x32) return 'WOFF2'; // wOF2
  return null;
}

// Daftar tabel sfnt: [{tag, offset, length}].
export function daftarTabelSfnt(byte) {
  if (!byte || byte.length < 12) return [];
  const jumlah = u16(byte, 4);
  const keluar = [];
  for (let i = 0; i < jumlah; i++) {
    const o = 12 + i * 16;
    if (o + 16 > byte.length) break;
    const tag = String.fromCharCode(byte[o], byte[o + 1], byte[o + 2], byte[o + 3]);
    keluar.push({ tag, offset: u32(byte, o + 8), length: u32(byte, o + 12) });
  }
  return keluar;
}

function dekodeNama(byte, platform) {
  try {
    if (platform === 3 || platform === 0) return new TextDecoder('utf-16be').decode(byte);
    return new TextDecoder('iso-8859-1').decode(byte);
  } catch (e) {
    return '';
  }
}

// Parse tabel 'name' sfnt (byte = isi tabel name saja).
export function parseTabelNama(tabel) {
  const hasil = {};
  if (!tabel || tabel.length < 6) return hasil;
  const jumlah = u16(tabel, 2);
  const awalString = u16(tabel, 4);
  const ID_NAMA = { 0: 'hakCipta', 1: 'keluarga', 2: 'gaya', 4: 'lengkap', 5: 'versi', 8: 'pembuat', 9: 'perancang' };
  const kandidat = {}; // nameID -> [{skor, nilai}]
  for (let i = 0; i < jumlah; i++) {
    const o = 6 + i * 12;
    if (o + 12 > tabel.length) break;
    const platform = u16(tabel, o);
    const nameID = u16(tabel, o + 6);
    const panjang = u16(tabel, o + 8);
    const off = u16(tabel, o + 10);
    const kunci = ID_NAMA[nameID];
    if (!kunci) continue;
    const awal = awalString + off;
    if (awal + panjang > tabel.length) continue;
    const nilai = dekodeNama(tabel.slice(awal, awal + panjang), platform).replace(/\0/g, '').trim();
    if (!nilai) continue;
    const skor = platform === 3 || platform === 0 ? 2 : 1;
    if (!kandidat[kunci]) kandidat[kunci] = [];
    kandidat[kunci].push({ skor, nilai });
  }
  for (const kunci of Object.keys(kandidat)) {
    kandidat[kunci].sort((a, b) => b.skor - a.skor);
    hasil[kunci] = kandidat[kunci][0].nilai;
  }
  return hasil;
}

// Parse info font TTF/OTF dari byte file utuh. Murni, bisa diuji di Node.
export function parseSfnt(byte) {
  const format = jenisFontFile(byte);
  if (format !== 'TTF' && format !== 'OTF') return null;
  const tabel = daftarTabelSfnt(byte);
  const cari = (tag) => tabel.find((t) => t.tag === tag);
  const nama = {};
  const tNama = cari('name');
  if (tNama && tNama.offset + tNama.length <= byte.length) {
    Object.assign(nama, parseTabelNama(byte.slice(tNama.offset, tNama.offset + tNama.length)));
  }
  let jumlahGlyph = null;
  const tMaxp = cari('maxp');
  if (tMaxp && tMaxp.offset + 6 <= byte.length) jumlahGlyph = u16(byte, tMaxp.offset + 4);
  let unitsPerEm = null;
  const tHead = cari('head');
  if (tHead && tHead.offset + 20 <= byte.length) unitsPerEm = u16(byte, tHead.offset + 18);
  return { format, nama, jumlahGlyph, unitsPerEm, jumlahTabel: tabel.length, daftarTabel: tabel.map((t) => t.tag) };
}

// Header WOFF (44 byte): flavor, jumlah tabel, ukuran sfnt total.
export function parseWoff(byte) {
  if (!byte || byte.length < 44 || jenisFontFile(byte) !== 'WOFF') return null;
  const flavor = String.fromCharCode(byte[4], byte[5], byte[6], byte[7]);
  return {
    format: 'WOFF',
    flavor: flavor === '\0\x01\0\0' ? 'TTF' : (flavor === 'OTTO' ? 'OTF' : flavor),
    length: u32(byte, 8),
    numTables: u16(byte, 12),
    totalSfntSize: u32(byte, 16),
    majorVersion: u16(byte, 20),
    minorVersion: u16(byte, 22),
  };
}

// Header WOFF2 (48 byte).
export function parseWoff2(byte) {
  if (!byte || byte.length < 48 || jenisFontFile(byte) !== 'WOFF2') return null;
  const flavor = String.fromCharCode(byte[4], byte[5], byte[6], byte[7]);
  return {
    format: 'WOFF2',
    flavor: flavor === '\0\x01\0\0' ? 'TTF' : (flavor === 'OTTO' ? 'OTF' : flavor),
    length: u32(byte, 8),
    numTables: u16(byte, 12),
    totalSfntSize: u32(byte, 16),
    totalCompressedSize: u32(byte, 20),
    majorVersion: u16(byte, 24),
    minorVersion: u16(byte, 26),
  };
}

// Baca tabel 'name' dari file WOFF (tabelnya dikompres zlib).
// Mengembalikan objek nama atau null bila tidak bisa dibaca.
export async function bacaNamaWoff(byte) {
  if (typeof DecompressionStream === 'undefined') return null;
  if (!byte || byte.length < 44) return null;
  const jumlah = u16(byte, 12);
  for (let i = 0; i < jumlah; i++) {
    const o = 44 + i * 20;
    if (o + 20 > byte.length) break;
    const tag = String.fromCharCode(byte[o], byte[o + 1], byte[o + 2], byte[o + 3]);
    if (tag !== 'name') continue;
    const off = u32(byte, o + 4);
    const compLen = u32(byte, o + 8);
    const origLen = u32(byte, o + 12);
    if (off + compLen > byte.length || origLen > 1024 * 1024) return null;
    try {
      const stream = new Blob([byte.slice(off, off + compLen)]).stream().pipeThrough(new DecompressionStream('deflate'));
      const buf = new Uint8Array(await new Response(stream).arrayBuffer());
      if (buf.length !== origLen) return null;
      return parseTabelNama(buf);
    } catch (e) {
      return null;
    }
  }
  return null;
}

export const meta = { id: 'pratinjau-font', name: 'Pratinjau Font', cat: 'developer', icon: '🔤', desc: 'Lihat pratinjau dan info font dari file TTF, OTF, WOFF, atau WOFF2 milikmu: contoh huruf, nama, gaya, dan jumlah glyph.', keywords: 'font,pratinjau font,ttf,otf,woff,woff2,tipografi,cek font', since: '6.19.0' };

export function render(root) {
  const fileI = document.createElement('input');
  fileI.type = 'file';
  fileI.accept = '.ttf,.otf,.woff,.woff2';
  fileI.className = 'inp';
  const teksI = T.input('text', 'Tulis contoh teks…', 'Huruf besar kecil 123');
  const ukuranSel = T.select([['16', '16px'], ['24', '24px'], ['32', '32px'], ['48', '48px'], ['72', '72px']], '32');
  const box = T.out();
  const infoBox = T.out();

  let namaKeluarga = null;
  let teksContoh = 'Huruf besar kecil 123';

  const gambarPratinjau = () => {
    if (!namaKeluarga) return;
    const ukuran = ukuranSel.value;
    const sampel = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ\nabcdefghijklmnopqrstuvwxyz\n0123456789 !?.,:;()[]{}+-*/=@#$%&';
    T.show(box,
      '<div style="font-family:\'' + T.esc(namaKeluarga) + '\',sans-serif;font-size:' + ukuran + 'px;line-height:1.4;word-break:break-word">' + T.esc(teksContoh || '(teks kosong)') + '</div>' +
      '<div style="font-family:\'' + T.esc(namaKeluarga) + '\',sans-serif;font-size:14px;line-height:1.8;word-break:break-all;margin-top:12px;color:var(--dim)">' + T.esc(sampel).replace(/\n/g, '<br>') + '</div>');
  };

  teksI.addEventListener('input', () => { teksContoh = teksI.value; gambarPratinjau(); });
  ukuranSel.addEventListener('change', gambarPratinjau);

  fileI.addEventListener('change', async () => {
    const f = fileI.files && fileI.files[0];
    if (!f) return;
    if (f.size > 30 * 1024 * 1024) { T.toast('Filenya terlalu besar (maksimal 30 MB)'); return; }
    const byte = new Uint8Array(await f.arrayBuffer());
    const jenis = jenisFontFile(byte);
    if (!jenis) {
      T.show(infoBox, errBox('File ini bukan font TTF, OTF, WOFF, atau WOFF2 yang dikenali.'));
      T.hide(box);
      return;
    }
    // Info dari byte file (tanpa memuat font).
    let info = null;
    let nama = {};
    let catatan = '';
    if (jenis === 'TTF' || jenis === 'OTF') {
      info = parseSfnt(byte);
      nama = (info && info.nama) || {};
    } else if (jenis === 'WOFF') {
      info = parseWoff(byte);
      nama = (await bacaNamaWoff(byte)) || {};
      if (!Object.keys(nama).length) catatan = 'Tabel nama font ini tidak bisa dibaca (terkompres). Pratinjau tetap jalan.';
    } else {
      info = parseWoff2(byte);
      catatan = 'WOFF2 menyimpan tabel namanya dalam bentuk terkompres khusus, jadi nama dan pembuat tidak bisa dibaca di sini. Pratinjau tetap jalan.';
    }
    // Muat font untuk pratinjau lewat FontFace.
    namaKeluarga = 'PratinjauFont_' + Date.now().toString(36);
    let muatOk = false;
    try {
      const face = new FontFace(namaKeluarga, byte);
      document.fonts.add(face);
      await face.load();
      muatOk = true;
    } catch (e) {
      muatOk = false;
    }
    if (muatOk) gambarPratinjau();
    else T.show(box, errBox('Font ini tidak bisa dimuat browser untuk pratinjau (formatnya mungkin rusak), tapi infonya di bawah tetap dari file aslinya.'));

    const kv = (k, v) => '<div class="kv"><span class="k">' + T.esc(k) + '</span><span class="v">' + T.esc(v == null || v === '' ? 'tidak ada' : String(v)) + '</span></div>';
    let html = kv('Format', jenis) + kv('Ukuran file', fmtBytes(f.size));
    if (nama.keluarga) html += kv('Keluarga', nama.keluarga);
    if (nama.lengkap) html += kv('Nama lengkap', nama.lengkap);
    if (nama.gaya) html += kv('Gaya', nama.gaya);
    if (nama.versi) html += kv('Versi', nama.versi);
    if (nama.pembuat) html += kv('Pembuat', nama.pembuat);
    if (nama.perancang) html += kv('Perancang', nama.perancang);
    if (nama.hakCipta) html += kv('Hak cipta', nama.hakCipta);
    if (info && info.jumlahGlyph != null) html += kv('Jumlah glyph', T.fmt(info.jumlahGlyph));
    if (info && info.unitsPerEm != null) html += kv('Units per em', T.fmt(info.unitsPerEm));
    if (info && info.jumlahTabel != null) html += kv('Jumlah tabel', T.fmt(info.jumlahTabel));
    if (info && info.flavor) html += kv('Isi', info.flavor);
    if (info && info.totalSfntSize != null) html += kv('Ukuran sfnt total', fmtBytes(info.totalSfntSize));
    if (catatan) html += '<p class="hint" style="margin-top:8px">' + T.esc(catatan) + '</p>';
    T.show(infoBox, html);
  });

  root.appendChild(T.el('<p class="hint">Pilih file font, lalu ketik contoh teks untuk melihat tampilannya dalam berbagai ukuran. Info font dibaca langsung dari isi file.</p>'));
  root.appendChild(T.field('Pilih file font (.ttf, .otf, .woff, .woff2)', fileI));
  root.appendChild(T.grid2(T.field('Contoh teks', teksI), T.field('Ukuran', ukuranSel)));
  root.appendChild(box);
  root.appendChild(infoBox);
  root.appendChild(T.el('<p class="hint" style="margin-top:12px">Font dibaca di browser saja, tidak diunggah ke mana-mana.</p>'));
}
