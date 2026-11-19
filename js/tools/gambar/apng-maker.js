import { h as T, crc32 as crc32Apng, loadImage, fileInput, canvasToBlob, fmtBytes, LOCAL_NOTE } from '../../core.js';

// APNG Maker: gabung beberapa foto jadi gambar animasi APNG. Encoder
// APNG ditulis sendiri: tiap foto diubah jadi PNG oleh canvas, lalu
// chunk PNG-nya disusun ulang menjadi APNG (acTL + fcTL + fdAT) dengan
// CRC32 yang benar. Tanpa pustaka luar, tanpa CDN.
// Berbeda dari GIF Maker yang hasilnya GIF 256 warna, dan dari Video ke
// APNG yang sumbernya video lewat ffmpeg.
export const meta = {"id": "apng-maker", "name": "APNG Maker", "cat": "gambar", "icon": "🎞️", "desc": "Gabung beberapa foto jadi gambar animasi APNG yang jernih.", "keywords": "apng,animasi,foto bergerak,png animasi,stiker", "since": "6.19.0"};

// CRC32 standar PNG (polinomial 0xEDB88320) memakai crc32() core,
// sama persis dengan crc32Apng lama (kanonis, G4 C1G4-R).
export { crc32Apng };

function tulis32BE(out, off, v) {
  out[off] = (v >>> 24) & 255; out[off + 1] = (v >>> 16) & 255;
  out[off + 2] = (v >>> 8) & 255; out[off + 3] = v & 255;
}

function baca32BE(b, off) {
  return ((b[off] << 24) | (b[off + 1] << 16) | (b[off + 2] << 8) | b[off + 3]) >>> 0;
}

// Buat satu chunk PNG: panjang + nama + data + CRC.
export function buatChunk(nama, data) {
  const out = new Uint8Array(12 + data.length);
  tulis32BE(out, 0, data.length);
  for (let i = 0; i < 4; i++) out[4 + i] = nama.charCodeAt(i);
  out.set(data, 8);
  const crcData = new Uint8Array(4 + data.length);
  for (let i = 0; i < 4; i++) crcData[i] = nama.charCodeAt(i);
  crcData.set(data, 4);
  tulis32BE(out, 8 + data.length, crc32Apng(crcData));
  return out;
}

// Urai byte PNG menjadi daftar chunk. Kembalikan null bila bukan PNG.
// Tiap chunk: {nama, data, crcOk}. idatGabung = semua data IDAT digabung.
export function parsePngChunks(bytes) {
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  if (b.length < 8) return null;
  const sig = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
  for (let i = 0; i < 8; i++) if (b[i] !== sig[i]) return null;
  const chunks = [];
  let off = 8;
  let lebar = 0, tinggi = 0;
  let idatTotal = 0;
  while (off + 8 <= b.length) {
    const len = baca32BE(b, off);
    if (off + 12 + len > b.length) return null;
    const nama = String.fromCharCode(b[off + 4], b[off + 5], b[off + 6], b[off + 7]);
    const data = b.subarray(off + 8, off + 8 + len);
    const crcTersimpan = baca32BE(b, off + 8 + len);
    const crcData = new Uint8Array(4 + len);
    crcData.set(b.subarray(off + 4, off + 8), 0);
    crcData.set(data, 4);
    chunks.push({ nama, data, crcOk: crc32Apng(crcData) === crcTersimpan });
    if (nama === 'IHDR' && len >= 8) {
      lebar = baca32BE(b, off + 8);
      tinggi = baca32BE(b, off + 12);
    }
    if (nama === 'IDAT') idatTotal += len;
    off += 12 + len;
    if (nama === 'IEND') break;
  }
  const idatGabung = new Uint8Array(idatTotal);
  let pos = 0;
  chunks.forEach((c) => {
    if (c.nama === 'IDAT') { idatGabung.set(c.data, pos); pos += c.data.length; }
  });
  const ihdr = chunks.find((c) => c.nama === 'IHDR');
  return { lebar, tinggi, chunks, idatGabung, ihdr: ihdr ? ihdr.data : null };
}

// Rakit APNG dari daftar byte PNG (tiap frame satu PNG, ukuran sama).
// durasiMs = lama tiap frame tampil (50..10000), putar = jumlah pengulangan
// (0 = selamanya). Kembalikan Uint8Array APNG, atau throw Error bila
// frame tidak valid.
export function rakitApng(framePngs, opsi) {
  const o = opsi || {};
  if (!Array.isArray(framePngs) || framePngs.length < 1) {
    throw new Error('Minimal 1 frame untuk membuat APNG.');
  }
  const durasi = Math.max(50, Math.min(10000, Math.round(o.durasiMs == null ? 500 : o.durasiMs)));
  const putar = Math.max(0, Math.min(65535, Math.round(o.putar == null ? 0 : o.putar)));
  const frames = framePngs.map((p) => parsePngChunks(p));
  frames.forEach((f, i) => {
    if (!f || !f.ihdr || f.idatGabung.length === 0) throw new Error('Frame ke-' + (i + 1) + ' bukan PNG yang valid.');
    if (f.lebar !== frames[0].lebar || f.tinggi !== frames[0].tinggi) {
      throw new Error('Semua frame harus berukuran sama (' + frames[0].lebar + 'x' + frames[0].tinggi + ').');
    }
  });
  const W = frames[0].lebar, H = frames[0].tinggi;
  const potongan = [];
  let total = 8;
  function tambah(chunk) { potongan.push(chunk); total += chunk.length; }
  const acTL = new Uint8Array(8);
  tulis32BE(acTL, 0, frames.length);
  tulis32BE(acTL, 4, putar);
  let seq = 0;
  function fcTL() {
    const d = new Uint8Array(26);
    tulis32BE(d, 0, seq++);
    tulis32BE(d, 4, W);
    tulis32BE(d, 8, H);
    tulis32BE(d, 12, 0);
    tulis32BE(d, 16, 0);
    d[20] = (durasi >> 8) & 255; d[21] = durasi & 255;
    d[22] = (1000 >> 8) & 255; d[23] = 1000 & 255;
    d[24] = 0;
    d[25] = 0;
    return buatChunk('fcTL', d);
  }
  tambah(buatChunk('IHDR', frames[0].ihdr));
  tambah(buatChunk('acTL', acTL));
  tambah(fcTL());
  tambah(buatChunk('IDAT', frames[0].idatGabung));
  for (let i = 1; i < frames.length; i++) {
    tambah(fcTL());
    const fd = new Uint8Array(4 + frames[i].idatGabung.length);
    tulis32BE(fd, 0, seq++);
    fd.set(frames[i].idatGabung, 4);
    tambah(buatChunk('fdAT', fd));
  }
  tambah(buatChunk('IEND', new Uint8Array(0)));
  const keluar = new Uint8Array(total);
  keluar.set([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A], 0);
  let pos = 8;
  potongan.forEach((c) => { keluar.set(c, pos); pos += c.length; });
  return keluar;
}

// Periksa byte APNG: struktur chunk, CRC, acTL, dan urutan fcTL/fdAT.
// Kembalikan {ok, frame, putar, lebar, tinggi, alasan}.
export function validasiApng(bytes) {
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  const hasil = { ok: false, frame: 0, putar: 0, lebar: 0, tinggi: 0, alasan: '' };
  const parsed = parsePngChunks(b);
  if (!parsed) { hasil.alasan = 'Bukan file PNG.'; return hasil; }
  const buruk = parsed.chunks.find((c) => !c.crcOk);
  if (buruk) { hasil.alasan = 'CRC chunk ' + buruk.nama + ' tidak cocok.'; return hasil; }
  const acTL = parsed.chunks.find((c) => c.nama === 'acTL');
  if (!acTL || acTL.data.length !== 8) { hasil.alasan = 'Tidak ada chunk acTL (bukan APNG).'; return hasil; }
  const fcTLs = parsed.chunks.filter((c) => c.nama === 'fcTL');
  const fdATs = parsed.chunks.filter((c) => c.nama === 'fdAT');
  const jumlah = baca32BE(acTL.data, 0);
  hasil.frame = jumlah;
  hasil.putar = baca32BE(acTL.data, 4);
  hasil.lebar = parsed.lebar;
  hasil.tinggi = parsed.tinggi;
  if (fcTLs.length !== jumlah) { hasil.alasan = 'Jumlah fcTL (' + fcTLs.length + ') tidak cocok dengan acTL (' + jumlah + ').'; return hasil; }
  if (fdATs.length !== jumlah - 1) { hasil.alasan = 'Jumlah fdAT (' + fdATs.length + ') tidak cocok dengan frame (' + jumlah + ').'; return hasil; }
  let seqHarap = 0;
  for (const c of parsed.chunks) {
    if (c.nama === 'fcTL' || c.nama === 'fdAT') {
      const seq = baca32BE(c.data, 0);
      if (seq !== seqHarap) { hasil.alasan = 'Nomor urut chunk ' + c.nama + ' salah (dapat ' + seq + ', harus ' + seqHarap + ').'; return hasil; }
      seqHarap++;
    }
  }
  hasil.ok = true;
  return hasil;
}

const MAKS_FRAME = 30;

export function render(root) {
  const fi = fileInput('image/*');
  fi.multiple = true;
  const putarSel = T.select([['0', 'Selamanya'], ['1', '1 kali'], ['2', '2 kali'], ['3', '3 kali'], ['5', '5 kali']], '0');
  const lebarSel = T.select([['480', 'Sedang (lebar 480)'], ['320', 'Kecil (lebar 320)'], ['asli', 'Ukuran asli foto']], '480');
  const statusBox = T.out();
  const box = T.out();
  const hasilBox = T.out();
  const infoBox = T.out();

  const durR = T.input('range');
  durR.min = '100'; durR.max = '2000'; durR.step = '100'; durR.value = '500';
  const durV = T.el('<b>0,5 detik per foto</b>');
  const durWrap = T.el('<div class="row" style="align-items:center"></div>');
  durWrap.appendChild(durR); durWrap.appendChild(durV);

  let daftar = []; // [{img, nama}]
  let blobHasil = null;

  function gambarDaftar() {
    if (!daftar.length) {
      T.show(box, '<span class="dim">Pilih 2 foto atau lebih, urutannya jadi urutan geraknya.</span>');
      buatB.disabled = true;
      return;
    }
    let html = '<div style="display:flex;flex-direction:column;gap:8px">';
    daftar.forEach((item, i) => {
      html += '<div style="display:flex;align-items:center;gap:10px;border:1px solid #27272a;border-radius:10px;padding:8px">' +
        '<span style="min-width:24px;text-align:center;font-weight:700">' + (i + 1) + '</span>' +
        '<span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13px">' + T.esc(item.nama) + '</span>' +
        '<span class="dim" style="font-size:12px">' + item.img.naturalWidth + 'x' + item.img.naturalHeight + '</span>' +
        '<button type="button" data-aksi="naik" data-i="' + i + '" style="min-width:36px;min-height:36px;border-radius:8px;border:1px solid #27272a;background:#1c1c1c;color:#fff;font-size:16px" ' + (i === 0 ? 'disabled' : '') + '>↑</button>' +
        '<button type="button" data-aksi="turun" data-i="' + i + '" style="min-width:36px;min-height:36px;border-radius:8px;border:1px solid #27272a;background:#1c1c1c;color:#fff;font-size:16px" ' + (i === daftar.length - 1 ? 'disabled' : '') + '>↓</button>' +
        '<button type="button" data-aksi="hapus" data-i="' + i + '" style="min-width:36px;min-height:36px;border-radius:8px;border:1px solid #27272a;background:#1c1c1c;color:#fff;font-size:16px">✕</button>' +
        '</div>';
    });
    html += '</div>';
    T.show(box, html);
    box.querySelectorAll('button[data-aksi]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const i = parseInt(btn.getAttribute('data-i'), 10);
        const aksi = btn.getAttribute('data-aksi');
        if (aksi === 'naik' && i > 0) { const t = daftar[i - 1]; daftar[i - 1] = daftar[i]; daftar[i] = t; }
        if (aksi === 'turun' && i < daftar.length - 1) { const t = daftar[i + 1]; daftar[i + 1] = daftar[i]; daftar[i] = t; }
        if (aksi === 'hapus') daftar.splice(i, 1);
        blobHasil = null;
        T.hide(hasilBox); T.hide(infoBox);
        gambarDaftar();
      });
    });
    buatB.disabled = daftar.length < 2;
  }

  durR.addEventListener('input', () => {
    const dtk = (parseInt(durR.value, 10) / 1000).toFixed(1).replace('.', ',');
    durV.textContent = dtk + ' detik per foto';
  });

  fi.addEventListener('change', async () => {
    const files = [...(fi.files || [])].filter((f) => /^image\//.test(f.type));
    if (!files.length) { T.toast('Pilih foto dulu'); return; }
    if (files.length > MAKS_FRAME) T.toast('Maksimal ' + MAKS_FRAME + ' foto, yang dipakai ' + MAKS_FRAME + ' pertama');
    T.hide(hasilBox); T.hide(infoBox);
    T.show(statusBox, '<span class="dim">Membuka foto…</span>');
    try {
      const potong = files.slice(0, MAKS_FRAME);
      const imgs = await Promise.all(potong.map(loadImage));
      daftar = imgs.map((img, i) => ({ img, nama: potong[i].name || 'foto-' + (i + 1) }));
      blobHasil = null;
      T.hide(statusBox);
      gambarDaftar();
    } catch (e) {
      daftar = [];
      T.show(statusBox, '<div class="err">Ada foto yang tidak bisa dibuka. Pastikan semuanya gambar yang benar (JPG/PNG/WebP).</div>');
      gambarDaftar();
    }
  });

  async function buat() {
    if (daftar.length < 2) { T.toast('Pilih minimal 2 foto dulu'); return; }
    buatB.disabled = true;
    unduhB.disabled = true;
    T.show(statusBox, '<span class="dim">Merakit APNG…</span>');
    try {
      const lebarTarget = lebarSel.value === 'asli'
        ? Math.max.apply(null, daftar.map((d) => d.img.naturalWidth))
        : parseInt(lebarSel.value, 10);
      const tinggiTarget = Math.max.apply(null, daftar.map((d) => {
        const sk = lebarTarget / d.img.naturalWidth;
        return Math.round(d.img.naturalHeight * sk);
      }));
      const framePngs = [];
      for (const item of daftar) {
        const c = document.createElement('canvas');
        c.width = lebarTarget; c.height = tinggiTarget;
        const ctx = c.getContext('2d');
        const sk = Math.min(lebarTarget / item.img.naturalWidth, tinggiTarget / item.img.naturalHeight);
        const dw = Math.max(1, Math.round(item.img.naturalWidth * sk));
        const dh = Math.max(1, Math.round(item.img.naturalHeight * sk));
        ctx.drawImage(item.img, Math.round((lebarTarget - dw) / 2), Math.round((tinggiTarget - dh) / 2), dw, dh);
        const blob = await canvasToBlob(c, 'image/png');
        if (!blob) throw new Error('gagal png');
        framePngs.push(new Uint8Array(await blob.arrayBuffer()));
      }
      const apng = rakitApng(framePngs, { durasiMs: parseInt(durR.value, 10), putar: parseInt(putarSel.value, 10) });
      const cek = validasiApng(apng);
      if (!cek.ok) throw new Error(cek.alasan);
      blobHasil = new Blob([apng], { type: 'image/png' });
      const url = URL.createObjectURL(blobHasil);
      T.hide(statusBox);
      T.show(hasilBox, '');
      const imgEl = document.createElement('img');
      imgEl.src = url;
      imgEl.alt = 'Pratinjau APNG';
      imgEl.style.cssText = 'max-width:100%;height:auto;border-radius:10px;display:block';
      hasilBox.appendChild(imgEl);
      T.show(infoBox, '<div class="kv"><span>Frame</span><b>' + cek.frame + ' foto</b></div>' +
        '<div class="kv"><span>Ukuran</span><b>' + cek.lebar + ' x ' + cek.tinggi + ' px</b></div>' +
        '<div class="kv"><span>Ukuran file</span><b>' + fmtBytes(blobHasil.size) + '</b></div>' +
        '<div class="kv"><span>Durasi total</span><b>' + ((cek.frame * parseInt(durR.value, 10)) / 1000).toFixed(1).replace('.', ',') + ' detik</b></div>');
      unduhB.disabled = false;
      T.toast('APNG jadi!');
    } catch (e) {
      T.show(statusBox, '<div class="err">Gagal membuat APNG: ' + T.esc(e.message || 'coba lagi') + '</div>');
    } finally {
      buatB.disabled = daftar.length < 2;
    }
  }

  function unduh() {
    if (!blobHasil) { T.toast('Buat APNG dulu'); return; }
    T.dl('animasi.apng', blobHasil, 'image/png');
    T.toast('Berhasil diunduh');
  }

  const buatB = T.btn('Buat APNG', buat, true, true);
  const unduhB = T.btn('Unduh APNG', unduh, false, true);

  root.appendChild(T.el('<p class="note">🔒 ' + LOCAL_NOTE + '</p>'));
  root.appendChild(T.field('Pilih 2-30 foto (bisa banyak sekaligus)', fi, 'Di HP: tahan dan pilih beberapa foto sekaligus. Urutan foto bisa diubah dengan tombol panah di bawah.'));
  root.appendChild(T.field('Lama tiap foto tampil', durWrap, 'Makin singkat, geraknya makin cepat.'));
  root.appendChild(T.grid2(T.field('Diulang berapa kali', putarSel), T.field('Ukuran hasil', lebarSel)));
  root.appendChild(statusBox);
  root.appendChild(box);
  root.appendChild(hasilBox);
  root.appendChild(infoBox);
  root.appendChild(T.row(buatB, unduhB));
  root.appendChild(T.el('<p class="hint">APNG warnanya lebih jernih dari GIF dan mendukung latar transparan. Semua foto disamakan ukurannya supaya geraknya tidak goyang.</p>'));
  gambarDaftar();
}
