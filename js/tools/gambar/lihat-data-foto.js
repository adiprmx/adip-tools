import { h as T, utils, esc, fileInput, fmtBytes, LOCAL_NOTE, kvRows } from '../../core.js?v=6.12.1';

// Parser EXIF JPEG minimal, ditulis sendiri (tanpa pustaka luar).
// Membaca IFD0 + ExifIFD + GPS IFD. Mengembalikan null bila tidak ada EXIF.
utils.parseExif = function (buf) {
  const view = buf instanceof DataView ? buf : new DataView(buf);
  if (view.byteLength < 4 || view.getUint16(0) !== 0xFFD8) return null;
  let off = 2, exifStart = -1;
  while (off + 4 <= view.byteLength) {
    if (view.getUint8(off) !== 0xFF) break;
    const marker = view.getUint8(off + 1);
    if (marker === 0xDA || marker === 0xD9) break;
    const len = view.getUint16(off + 2);
    if (marker === 0xE1 && off + 10 <= view.byteLength &&
        view.getUint32(off + 4) === 0x45786966 && view.getUint16(off + 8) === 0) {
      exifStart = off + 10;
      break;
    }
    off += 2 + len;
  }
  if (exifStart < 0) return null;
  const tiff = exifStart;
  const le = view.getUint16(tiff) === 0x4949;
  if (view.getUint16(tiff + 2, le) !== 42) return null;
  const get16 = (o) => view.getUint16(tiff + o, le);
  const get32 = (o) => view.getUint32(tiff + o, le);
  const ukuranTipe = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 7: 1, 9: 4, 10: 8 };
  function bacaNilai(tipe, jumlah, offNilai) {
    const ukuran = (ukuranTipe[tipe] || 1) * jumlah;
    const pos = ukuran <= 4 ? offNilai : get32(offNilai);
    if (tipe === 2) {
      let s = '';
      for (let i = 0; i < jumlah; i++) {
        const c = view.getUint8(tiff + pos + i);
        if (c === 0) break;
        s += String.fromCharCode(c);
      }
      return s.trim();
    }
    if (tipe === 3) {
      const arr = [];
      for (let i = 0; i < jumlah; i++) arr.push(get16(pos + i * 2));
      return jumlah === 1 ? arr[0] : arr;
    }
    if (tipe === 4 || tipe === 9) {
      const arr = [];
      for (let i = 0; i < jumlah; i++) arr.push(get32(pos + i * 4));
      return jumlah === 1 ? arr[0] : arr;
    }
    if (tipe === 5 || tipe === 10) {
      const arr = [];
      for (let i = 0; i < jumlah; i++) {
        const a = get32(pos + i * 8), b = get32(pos + i * 8 + 4);
        arr.push(b === 0 ? 0 : a / b);
      }
      return jumlah === 1 ? arr[0] : arr;
    }
    return null;
  }
  function bacaIfd(offIfd) {
    const out = {};
    if (offIfd <= 0 || tiff + offIfd + 2 > view.byteLength) return out;
    const n = get16(offIfd);
    for (let i = 0; i < n; i++) {
      const e = offIfd + 2 + i * 12;
      if (tiff + e + 12 > view.byteLength) break;
      const tag = get16(e), tipe = get16(e + 2), jumlah = get32(e + 4);
      out[tag] = bacaNilai(tipe, jumlah, e + 8);
    }
    return out;
  }
  const ifd0 = bacaIfd(get32(4));
  const hasil = {
    kamera: [ifd0[0x010F], ifd0[0x0110]].filter(Boolean).join(' ') || null,
    tanggal: ifd0[0x0132] || null,
    deskripsi: ifd0[0x010E] || null,
    software: ifd0[0x0131] || null,
    artis: ifd0[0x013B] || null
  };
  if (ifd0[0x8769]) {
    const ex = bacaIfd(ifd0[0x8769]);
    hasil.tanggalJepret = ex[0x9003] || ex[0x9004] || null;
    hasil.exposure = typeof ex[0x829A] === 'number' && ex[0x829A] > 0
      ? (ex[0x829A] >= 1 ? ex[0x829A] + ' detik' : '1/' + Math.round(1 / ex[0x829A]) + ' detik') : null;
    hasil.bukaan = typeof ex[0x829D] === 'number' ? 'f/' + (Math.round(ex[0x829D] * 10) / 10) : null;
    hasil.iso = ex[0x8827] || null;
    hasil.focal = typeof ex[0x920A] === 'number' ? ex[0x920A] + ' mm' : null;
    hasil.dimensi = (ex[0xA002] && ex[0xA003]) ? ex[0xA002] + ' x ' + ex[0xA003] : null;
  }
  if (ifd0[0x8825]) {
    const g = bacaIfd(ifd0[0x8825]);
    const keDerajat = (arr) => (Array.isArray(arr) && arr.length >= 3) ? arr[0] + arr[1] / 60 + arr[2] / 3600 : null;
    const lat = keDerajat(g[0x0002]), lon = keDerajat(g[0x0004]);
    if (lat !== null && lon !== null) {
      hasil.gps = {
        lat: (g[0x0001] === 'S' ? -lat : lat),
        lon: (g[0x0003] === 'W' ? -lon : lon)
      };
    }
  }
  return hasil;
};

export const meta = {"id": "lihat-data-foto", "name": "Lihat Data Foto", "cat": "gambar", "icon": "🔍", "desc": "Intip data tersembunyi di foto: kamera, tanggal, lokasi.", "keywords": "exif,metadata,foto,gps,kamera,lokasi,privasi", "since": "6.11.0"};

export function render(root) {
  const fileI = fileInput('image/jpeg,image/png,image/webp');
  const box = T.out();

  async function proses() {
    const f = fileI.files && fileI.files[0];
    if (!f) { T.show(box, '<div class="hint">Pilih foto dulu.</div>'); return; }
    T.show(box, '<span class="dim">Membaca data foto…</span>');
    let buf;
    try { buf = await f.arrayBuffer(); }
    catch (e) { T.show(box, '<div style="color:#ef4444;font-size:13px;line-height:1.5">File tidak bisa dibaca. Coba foto lain.</div>'); return; }
    const ex = utils.parseExif(buf);
    const baris = [
      ['Nama file', f.name || '-'],
      ['Ukuran file', fmtBytes(f.size)],
      ['Jenis file', f.type || '-']
    ];
    let adaData = false;
    if (ex) {
      if (ex.kamera) { baris.push(['Kamera', ex.kamera]); adaData = true; }
      if (ex.tanggalJepret || ex.tanggal) { baris.push(['Tanggal jepret', ex.tanggalJepret || ex.tanggal]); adaData = true; }
      if (ex.dimensi) { baris.push(['Ukuran foto', ex.dimensi + ' piksel']); adaData = true; }
      if (ex.bukaan) { baris.push(['Bukaan lensa', ex.bukaan]); adaData = true; }
      if (ex.exposure) { baris.push(['Waktu pajanan', ex.exposure]); adaData = true; }
      if (ex.iso) { baris.push(['ISO', String(ex.iso)]); adaData = true; }
      if (ex.focal) { baris.push(['Panjang fokus', ex.focal]); adaData = true; }
      if (ex.software) { baris.push(['Aplikasi pengolah', ex.software]); adaData = true; }
      if (ex.artis) { baris.push(['Fotografer', ex.artis]); adaData = true; }
      if (ex.deskripsi) { baris.push(['Keterangan', ex.deskripsi]); adaData = true; }
    }
    let gpsHtml = '';
    if (ex && ex.gps) {
      adaData = true;
      const lat = ex.gps.lat.toFixed(6), lon = ex.gps.lon.toFixed(6);
      const urlPeta = 'https://www.openstreetmap.org/?mlat=' + lat + '&mlon=' + lon + '#map=15/' + lat + '/' + lon;
      gpsHtml = `<div class="kv"><span>Lokasi foto (GPS)</span><b>${lat}, ${lon}</b></div>` +
        `<p style="font-size:13px"><a href="${urlPeta}" target="_blank" rel="noopener">Lihat lokasi ini di peta</a></p>`;
    }
    T.show(box,
      kvRows(baris) + gpsHtml +
      (adaData
        ? `<div class="note" style="border-color:#facc15">Foto ini menyimpan data di atas. Lokasi GPS dan tanggal jepret bisa dilihat siapa pun yang menerima fotonya. Hapus datanya dulu sebelum dibagikan ke orang yang tidak dikenal.</div>`
        : `<div class="hint">Foto ini tidak menyimpan data EXIF. Bisa karena sudah dibersihkan, hasil screenshot, atau diunduh dari aplikasi yang menghapus datanya.</div>`) +
      `<p style="font-size:13px"><a href="#/t/exif-clean">Buka tool Hapus EXIF untuk membersihkan data ini</a></p>`
    );
  }

  root.appendChild(T.el(`<p class="note">${LOCAL_NOTE}</p>`));
  root.appendChild(T.field('Pilih foto', fileI));
  root.appendChild(T.btn('Lihat datanya', proses, true));
  root.appendChild(box);
}
