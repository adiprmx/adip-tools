import { h as T, utils, LOCAL_NOTE, canvasToBlob, fileInput, fmtBytes, imgEl, loadImage } from '../../core.js';

// Canvas -> file BMP 24-bit (tanpa kompresi). Hanya butuh getImageData,
// jadi bisa diuji di Node dengan canvas tiruan.
export function canvasKeBmp(canvas) {
  const w = canvas.width, h = canvas.height;
  const ctx = canvas.getContext('2d');
  const data = ctx.getImageData(0, 0, w, h).data;
  const baris = Math.floor((24 * w + 31) / 32) * 4;
  const ukuranPx = baris * h;
  const buf = new ArrayBuffer(54 + ukuranPx);
  const dv = new DataView(buf);
  dv.setUint8(0, 0x42); dv.setUint8(1, 0x4d); // BM
  dv.setUint32(2, 54 + ukuranPx, true);
  dv.setUint32(10, 54, true);
  dv.setUint32(14, 40, true);
  dv.setInt32(18, w, true); dv.setInt32(22, h, true);
  dv.setUint16(26, 1, true); dv.setUint16(28, 24, true);
  dv.setUint32(30, 0, true);
  dv.setUint32(34, ukuranPx, true);
  dv.setInt32(38, 2835, true); dv.setInt32(42, 2835, true);
  const px = new Uint8Array(buf, 54);
  for (let y = 0; y < h; y++) {
    const barisAsal = (h - 1 - y) * w * 4;
    const barisTujuan = y * baris;
    for (let x = 0; x < w; x++) {
      const s = barisAsal + x * 4, d = barisTujuan + x * 3;
      px[d] = data[s + 2]; px[d + 1] = data[s + 1]; px[d + 2] = data[s];
    }
  }
  return new Blob([buf], { type: 'image/bmp' });
}

// Canvas -> file TIFF 24-bit tanpa kompresi (1 strip, little-endian).
// Tag diurutkan menaik sesuai spesifikasi TIFF; hanya butuh getImageData,
// jadi bisa diuji di Node dengan canvas tiruan.
export function canvasKeTiff(canvas) {
  const w = canvas.width, h = canvas.height;
  const ctx = canvas.getContext('2d');
  const data = ctx.getImageData(0, 0, w, h).data;
  const pxLen = w * h * 3;
  const nTag = 10;
  const pxOff = 8 + 2 + nTag * 12 + 4;
  const bpsOff = pxOff + pxLen;
  const buf = new ArrayBuffer(bpsOff + 6);
  const dv = new DataView(buf);
  dv.setUint8(0, 0x49); dv.setUint8(1, 0x49); // II (little-endian)
  dv.setUint16(2, 42, true);
  dv.setUint32(4, 8, true); // offset IFD
  dv.setUint16(8, nTag, true);
  const tag = (i, id, type, count, val) => {
    const o = 10 + i * 12;
    dv.setUint16(o, id, true);
    dv.setUint16(o + 2, type, true);
    dv.setUint32(o + 4, count, true);
    if (type === 3 && count === 1) dv.setUint16(o + 8, val, true);
    else dv.setUint32(o + 8, val, true);
  };
  tag(0, 256, 4, 1, w);        // ImageWidth
  tag(1, 257, 4, 1, h);        // ImageLength
  tag(2, 258, 3, 3, bpsOff);   // BitsPerSample [8,8,8]
  tag(3, 259, 3, 1, 1);        // Compression: none
  tag(4, 262, 3, 1, 2);        // Photometric: RGB
  tag(5, 273, 4, 1, pxOff);    // StripOffsets
  tag(6, 277, 3, 1, 3);        // SamplesPerPixel
  tag(7, 278, 4, 1, h);        // RowsPerStrip
  tag(8, 279, 4, 1, pxLen);    // StripByteCounts
  tag(9, 284, 3, 1, 1);        // PlanarConfiguration: chunky
  dv.setUint32(10 + nTag * 12, 0, true); // tidak ada IFD berikutnya
  dv.setUint16(bpsOff, 8, true);
  dv.setUint16(bpsOff + 2, 8, true);
  dv.setUint16(bpsOff + 4, 8, true);
  const px = new Uint8Array(buf, pxOff, pxLen);
  for (let i = 0, j = 0; i < data.length; i += 4, j += 3) {
    px[j] = data[i]; px[j + 1] = data[i + 1]; px[j + 2] = data[i + 2];
  }
  return new Blob([buf], { type: 'image/tiff' });
}

// Hitung ukuran baru dengan menjaga rasio. mode: 'tetap' | 'lebar' | 'tinggi' | 'persen'.
export function hitungUkuranBaru(w, h, mode, nilai) {
  const n = Number(nilai);
  if (!(w > 0 && h > 0) || !(n > 0)) return { w, h };
  if (mode === 'lebar') { const s = n / w; return { w: Math.round(n), h: Math.max(1, Math.round(h * s)) }; }
  if (mode === 'tinggi') { const s = n / h; return { w: Math.max(1, Math.round(w * s)), h: Math.round(n) }; }
  if (mode === 'persen') { const s = n / 100; return { w: Math.max(1, Math.round(w * s)), h: Math.max(1, Math.round(h * s)) }; }
  return { w, h };
}

// Nama hasil dari pola: awalan + nama asli + akhiran + nomor urut (opsional).
export function namaDariPola(awalan, akhiran, base, idx, pakaiNomor, ext) {
  const nomor = pakaiNomor ? '-' + String(idx + 1).padStart(2, '0') : '';
  const bersih = (s) => String(s || '').replace(/[\\/:*?"<>|]/g, '').trim();
  return bersih(awalan) + bersih(base) + bersih(akhiran) + nomor + '.' + ext;
}

// CRC32 (IEEE) untuk membangun chunk PNG.
const CRC_TABEL = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
export function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) c = CRC_TABEL[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

// Ambil data TIFF mentah dari segmen EXIF JPEG (APP1 "Exif\0\0"), atau null.
export function ambilTiffDariJpeg(bytes) {
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  if (b.length < 4 || b[0] !== 0xFF || b[1] !== 0xD8) return null;
  let i = 2;
  while (i + 3 < b.length) {
    if (b[i] !== 0xFF) return null;
    const marker = b[i + 1];
    if (marker === 0xD9 || marker === 0xDA) return null;
    if (marker === 0x01 || (marker >= 0xD0 && marker <= 0xD7)) { i += 2; continue; }
    const len = (b[i + 2] << 8) | b[i + 3];
    if (len < 2 || i + 2 + len > b.length) return null;
    if (marker === 0xE1 && b[i + 4] === 0x45 && b[i + 5] === 0x78 && b[i + 6] === 0x69 && b[i + 7] === 0x66 && b[i + 8] === 0 && b[i + 9] === 0) {
      return b.slice(i + 10, i + 2 + len);
    }
    i += 2 + len;
  }
  return null;
}

// Ambil data TIFF mentah dari chunk eXIf PNG, atau null.
export function ambilTiffDariPng(bytes) {
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  const sig = [137, 80, 78, 71, 13, 10, 26, 10];
  if (b.length < 8 || !sig.every((v, i) => b[i] === v)) return null;
  let i = 8;
  while (i + 12 <= b.length) {
    const len = ((b[i] << 24) | (b[i + 1] << 16) | (b[i + 2] << 8) | b[i + 3]) >>> 0;
    const tipe = String.fromCharCode(b[i + 4], b[i + 5], b[i + 6], b[i + 7]);
    if (i + 12 + len > b.length) return null;
    if (tipe === 'eXIf') return b.slice(i + 8, i + 8 + len);
    i += 12 + len;
    if (tipe === 'IEND') break;
  }
  return null;
}

// Sisipkan data EXIF (TIFF) ke JPEG hasil sebagai segmen APP1 baru.
// Kembalikan Uint8Array baru, atau null bila tidak bisa.
export function sisipExifKeJpeg(jpegBytes, tiffBytes) {
  const j = jpegBytes instanceof Uint8Array ? jpegBytes : new Uint8Array(jpegBytes);
  const t = tiffBytes instanceof Uint8Array ? tiffBytes : new Uint8Array(tiffBytes);
  if (j.length < 2 || j[0] !== 0xFF || j[1] !== 0xD8 || !t.length) return null;
  const app1Len = 6 + t.length + 2;
  if (app1Len > 65533) return null;
  const out = new Uint8Array(2 + 2 + app1Len + (j.length - 2));
  out[0] = 0xFF; out[1] = 0xD8;
  let p = 2;
  out[p++] = 0xFF; out[p++] = 0xE1;
  out[p++] = (app1Len >> 8) & 0xFF; out[p++] = app1Len & 0xFF;
  out[p++] = 0x45; out[p++] = 0x78; out[p++] = 0x69; out[p++] = 0x66; out[p++] = 0; out[p++] = 0;
  out.set(t, p);
  out.set(j.subarray(2), p + t.length);
  return out;
}

// Sisipkan data EXIF (TIFF) ke PNG hasil sebagai chunk eXIf setelah IHDR.
export function sisipExifKePng(pngBytes, tiffBytes) {
  const p = pngBytes instanceof Uint8Array ? pngBytes : new Uint8Array(pngBytes);
  const t = tiffBytes instanceof Uint8Array ? tiffBytes : new Uint8Array(tiffBytes);
  const sig = [137, 80, 78, 71, 13, 10, 26, 10];
  if (p.length < 33 || !sig.every((v, i) => p[i] === v) || !t.length) return null;
  const ihdrLen = ((p[8] << 24) | (p[9] << 16) | (p[10] << 8) | p[11]) >>> 0;
  const ihdrAkhir = 8 + 12 + ihdrLen;
  if (ihdrAkhir > p.length) return null;
  const chunk = new Uint8Array(12 + t.length);
  const dv = new DataView(chunk.buffer);
  dv.setUint32(0, t.length, false);
  chunk[4] = 0x65; chunk[5] = 0x58; chunk[6] = 0x49; chunk[7] = 0x66; // eXIf
  chunk.set(t, 8);
  dv.setUint32(8 + t.length, crc32(chunk.subarray(4, 8 + t.length)), false);
  const out = new Uint8Array(p.length + chunk.length);
  out.set(p.subarray(0, ihdrAkhir), 0);
  out.set(chunk, ihdrAkhir);
  out.set(p.subarray(ihdrAkhir), ihdrAkhir + chunk.length);
  return out;
}

export const meta = {"id": "image-convert", "name": "Convert Gambar", "cat": "gambar", "icon": "🔁", "desc": "Convert gambar antar format (WebP, JPG, PNG, dan lainnya) di browser.", "keywords": "convert,gambar,webp,jpg,png,format,heic,tiff,avif,bmp,ico,svg"};
export function render(root) {

      const HEIC_CDN = 'https://cdn.jsdelivr.net/npm/heic2any@0.0.4/dist/heic2any.min.js';
      const UTIF_CDN = 'https://cdn.jsdelivr.net/npm/utif@3.1.0/UTIF.js';
      const ZIP_CDN = 'https://cdn.jsdelivr.net/npm/jszip@3.10.2/dist/jszip.min.js';
      const MAKS_JUMLAH = 20;
      let heicSiap = null, utifSiap = null, zipSiap = null;
      const pastHeic = () => {
        if (!heicSiap) heicSiap = T.loadScript(HEIC_CDN).then((ok) => ok && typeof window.heic2any === 'function');
        return heicSiap;
      };
      const pastUtif = () => {
        if (!utifSiap) utifSiap = T.loadScript(UTIF_CDN).then((ok) => ok && !!window.UTIF);
        return utifSiap;
      };
      const pastZip = () => {
        if (!zipSiap) zipSiap = T.loadScript(ZIP_CDN).then((ok) => ok && typeof window.JSZip === 'function');
        return zipSiap;
      };

      const fileI = fileInput('image/*,.heic,.heif,.tif,.tiff,.svg,.ico,.bmp,.avif');
      fileI.multiple = true;
      const fmtSel = T.select([['jpeg', 'JPEG (.jpg)'], ['png', 'PNG'], ['webp', 'WebP'], ['avif', 'AVIF'], ['bmp', 'BMP'], ['tiff', 'TIFF'], ['svg', 'SVG (foto dibungkus)'], ['ico', 'ICO (ikon)']], 'jpeg');
      const qRange = T.input('range'); qRange.min = '10'; qRange.max = '100'; qRange.value = '90';
      const qVal = T.el('<b>90%</b>');
      const resizeSel = T.select([['tetap', 'Ukuran tetap'], ['lebar', 'Atur lebar (px)'], ['tinggi', 'Atur tinggi (px)'], ['persen', 'Skala persen (%)']], 'tetap');
      const resizeInp = T.input('text', 'cth: 800', ''); resizeInp.inputMode = 'decimal';
      const resizeWrap = T.field('Nilai ukuran', resizeInp, 'Rasio gambar dijaga, tidak gepeng.');
      resizeWrap.hidden = true;
      resizeSel.addEventListener('change', () => {
        resizeWrap.hidden = resizeSel.value === 'tetap';
        resizeInp.placeholder = resizeSel.value === 'persen' ? 'cth: 50 (= setengah ukuran)' : 'cth: 800';
      });
      const awalInp = T.input('text', 'cth: foto-', '');
      const akhirInp = T.input('text', 'cth: -web', '');
      const nomorChk = T.el('<label style="display:flex;gap:8px;align-items:center;font-size:13px;cursor:pointer"><input type="checkbox" id="ic-nomor"> Beri nomor urut (…-01, …-02)</label>');
      const nomorCek = nomorChk.querySelector('#ic-nomor');
      const exifSel = T.select([['buang', 'Buang data foto'], ['tahan', 'Pertahankan data foto']], 'buang');
      const box = T.out();
      const infoBox = T.out();
      const statusBox = T.out();
      let cur = null;
      let hasilBatch = [];

      qRange.addEventListener('input', () => { qVal.textContent = qRange.value + '%'; });

      // AVIF keluar hanya bila browser ini bisa menyimpannya; kalau tidak, opsinya dihapus.
      try {
        const tes = document.createElement('canvas');
        tes.width = 1; tes.height = 1;
        tes.toBlob((b) => {
          if (!b) {
            const opt = fmtSel.querySelector('option[value="avif"]');
            if (opt) opt.remove();
            avifCatatan.hidden = false;
          }
        }, 'image/avif');
      } catch (e) { /* abaikan, AVIF tetap dicoba saat proses */ }
      const avifCatatan = T.el('<p class="dim" style="font-size:12px" hidden>Browser ini belum bisa menyimpan AVIF, jadi pilihan AVIF disembunyikan.</p>');

      const jenisMasukan = (file) => {
        const t = (file.type || '').toLowerCase();
        const n = (file.name || '').toLowerCase();
        if (t === 'image/heic' || t === 'image/heif' || n.endsWith('.heic') || n.endsWith('.heif')) return 'heic';
        if (t === 'image/tiff' || t === 'image/x-tiff' || n.endsWith('.tif') || n.endsWith('.tiff')) return 'tiff';
        if (t === 'image/svg+xml' || n.endsWith('.svg')) return 'svg';
        return 'biasa';
      };
      const TIPE_EKSTENSI = { '.bmp': 'image/bmp', '.ico': 'image/x-icon', '.avif': 'image/avif', '.webp': 'image/webp', '.gif': 'image/gif', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png' };

      // Muat gambar apa pun yang didukung browser, termasuk file yang tipenya kosong.
      async function muatGambarFleksibel(file) {
        try { return await loadImage(file); }
        catch (e) {
          const n = (file.name || '').toLowerCase();
          const ext = Object.keys(TIPE_EKSTENSI).find((k) => n.endsWith(k));
          if (ext) {
            const berlabel = new Blob([file], { type: TIPE_EKSTENSI[ext] });
            return loadImage(berlabel);
          }
          throw e;
        }
      }

      const gambarKeCanvas = (img, isiPutih) => {
        const c = document.createElement('canvas');
        c.width = img.naturalWidth; c.height = img.naturalHeight;
        const ctx = c.getContext('2d');
        if (isiPutih) { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height); }
        ctx.drawImage(img, 0, 0);
        return c;
      };

      // File apa pun yang masuk -> canvas (atau throw dengan pesan yang jelas).
      async function fileKeCanvas(file) {
        const jenis = jenisMasukan(file);
        if (jenis === 'heic') {
          if (!(await pastHeic())) throw new Error('pengubah HEIC gagal dimuat, cek koneksi');
          const keluar = await window.heic2any({ blob: file, toType: 'image/jpeg', quality: 0.92 });
          const blob = Array.isArray(keluar) ? keluar[0] : keluar;
          if (!blob) throw new Error('file HEIC tidak terbaca');
          return gambarKeCanvas(await loadImage(blob), true);
        }
        if (jenis === 'tiff') {
          if (!(await pastUtif())) throw new Error('pembaca TIFF gagal dimuat, cek koneksi');
          const buffer = await file.arrayBuffer();
          const ifds = window.UTIF.decode(buffer);
          if (!ifds || !ifds.length) throw new Error('file TIFF tidak terbaca');
          window.UTIF.decodeImage(buffer, ifds[0]);
          const rgba = window.UTIF.toRGBA8(ifds[0]);
          const c = document.createElement('canvas');
          c.width = ifds[0].width; c.height = ifds[0].height;
          c.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(rgba), c.width, c.height), 0, 0);
          return c;
        }
        if (jenis === 'svg') {
          let blob = file;
          if ((file.type || '').toLowerCase() !== 'image/svg+xml') {
            blob = new Blob([await file.text()], { type: 'image/svg+xml' });
          }
          const img = await loadImage(blob);
          if (!img.naturalWidth || !img.naturalHeight) throw new Error('SVG ini tidak punya ukuran, tidak bisa diubah');
          return gambarKeCanvas(img, false);
        }
        const img = await muatGambarFleksibel(file);
        return gambarKeCanvas(img, false);
      }

      // Canvas -> file ICO berisi satu gambar PNG (maks 256px).
      async function canvasKeIco(canvas) {
        const s = Math.min(1, 256 / Math.max(canvas.width, canvas.height));
        const c = document.createElement('canvas');
        c.width = Math.max(1, Math.round(canvas.width * s));
        c.height = Math.max(1, Math.round(canvas.height * s));
        c.getContext('2d').drawImage(canvas, 0, 0, c.width, c.height);
        const png = await canvasToBlob(c, 'image/png');
        if (!png) throw new Error('gagal membuat ICO');
        const pngBuf = new Uint8Array(await png.arrayBuffer());
        const buf = new ArrayBuffer(6 + 16 + pngBuf.length);
        const dv = new DataView(buf);
        dv.setUint16(0, 0, true); dv.setUint16(2, 1, true); dv.setUint16(4, 1, true);
        dv.setUint8(6, c.width >= 256 ? 0 : c.width);
        dv.setUint8(7, c.height >= 256 ? 0 : c.height);
        dv.setUint8(8, 0); dv.setUint8(9, 0);
        dv.setUint16(10, 1, true); dv.setUint16(12, 32, true);
        dv.setUint32(14, pngBuf.length, true);
        dv.setUint32(18, 22, true);
        new Uint8Array(buf, 22).set(pngBuf);
        return new Blob([buf], { type: 'image/x-icon' });
      }

      async function encodeHasil(canvas, fmt, q) {
        if (fmt === 'bmp' || fmt === 'tiff') {
          const c = document.createElement('canvas');
          c.width = canvas.width; c.height = canvas.height;
          const ctx = c.getContext('2d');
          ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
          ctx.drawImage(canvas, 0, 0);
          return fmt === 'bmp'
            ? { blob: canvasKeBmp(c), ext: 'bmp' }
            : { blob: canvasKeTiff(c), ext: 'tiff' };
        }
        if (fmt === 'svg') {
          // SVG di sini membungkus foto (data PNG), bukan mengubah jadi vektor.
          const png = await canvasToBlob(canvas, 'image/png');
          if (!png) throw new Error('gagal membuat SVG');
          const dataUrl = await new Promise((res, rej) => {
            const r = new FileReader();
            r.onload = () => res(r.result);
            r.onerror = () => rej(new Error('gagal membaca gambar'));
            r.readAsDataURL(png);
          });
          const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + canvas.width + '" height="' + canvas.height + '" viewBox="0 0 ' + canvas.width + ' ' + canvas.height + '"><image width="100%" height="100%" href="' + dataUrl + '"/></svg>';
          return { blob: new Blob([svg], { type: 'image/svg+xml' }), ext: 'svg' };
        }
        if (fmt === 'ico') return { blob: await canvasKeIco(canvas), ext: 'ico' };
        const mime = fmt === 'png' ? 'image/png' : fmt === 'webp' ? 'image/webp' : fmt === 'avif' ? 'image/avif' : 'image/jpeg';
        const blob = await canvasToBlob(canvas, mime, fmt === 'png' ? undefined : q);
        if (!blob) throw new Error(fmt === 'avif' ? 'browser ini belum bisa menyimpan AVIF' : 'gagal convert');
        return { blob, ext: fmt === 'jpeg' ? 'jpg' : fmt };
      }

      async function process() {
        T.hide(box); T.hide(infoBox); T.hide(statusBox);
        const files = [...(fileI.files || [])].slice(0, MAKS_JUMLAH);
        if (!files.length) { T.toast('Pilih gambar dulu'); return; }
        hasilBatch = [];
        cur = null;
        dlB.disabled = true; // belum ada hasil baru (P2-2)
        // Pesan gagal buatan tool ini sudah Bahasa Indonesia — tampilkan apa adanya.
        // Error lain (dari browser/library) diganti pesan ramah.
        const pesanGagal = (er) => {
          const m = (er && er.message) || '';
          if (/^(pengubah HEIC|pembaca TIFF|file HEIC tidak terbaca|file TIFF tidak terbaca|gagal membuat ICO|gagal membuat SVG|gagal membaca gambar|browser ini belum bisa menyimpan AVIF|gagal convert)/.test(m)) return m;
          return 'tidak bisa diproses';
        };
        const gagal = [];
        const q = parseInt(qRange.value, 10) / 100;
        for (let i = 0; i < files.length; i++) {
          if (files.length > 1) T.show(statusBox, '<span class="dim">Convert ' + (i + 1) + ' dari ' + files.length + ': ' + T.esc(files[i].name || '') + '…</span>');
          try {
            let canvas = await fileKeCanvas(files[i]);
            const asalW = canvas.width, asalH = canvas.height;
            // Ubah ukuran (jaga rasio).
            const target = hitungUkuranBaru(asalW, asalH, resizeSel.value, parseFloat(String(resizeInp.value).replace(',', '.')));
            const diubahUkuran = target.w !== asalW || target.h !== asalH;
            if (diubahUkuran) {
              const kecil = document.createElement('canvas');
              kecil.width = target.w; kecil.height = target.h;
              kecil.getContext('2d').drawImage(canvas, 0, 0, target.w, target.h);
              canvas = kecil;
            }
            if (fmtSel.value === 'jpeg' || fmtSel.value === 'webp' || fmtSel.value === 'avif') {
              // Format ini tidak punya transparansi: timpa di atas latar putih.
              const putih = document.createElement('canvas');
              putih.width = canvas.width; putih.height = canvas.height;
              const pctx = putih.getContext('2d');
              pctx.fillStyle = '#fff'; pctx.fillRect(0, 0, putih.width, putih.height);
              pctx.drawImage(canvas, 0, 0);
              canvas = putih;
            }
            const r = await encodeHasil(canvas, fmtSel.value, q);
            // Opsi data foto (EXIF): canvas selalu membuangnya, jadi bila user
            // memilih "pertahankan", pindahkan data EXIF dari file asli.
            let blobHasil = r.blob, exifCatatan = '';
            if (exifSel.value === 'tahan') {
              const bisaTahan = r.ext === 'jpg' || r.ext === 'png';
              if (bisaTahan) {
                try {
                  const srcBytes = new Uint8Array(await files[i].arrayBuffer());
                  const tiff = ambilTiffDariJpeg(srcBytes) || ambilTiffDariPng(srcBytes);
                  if (tiff) {
                    const outBytes = new Uint8Array(await r.blob.arrayBuffer());
                    const sisip = r.ext === 'jpg' ? sisipExifKeJpeg(outBytes, tiff) : sisipExifKePng(outBytes, tiff);
                    if (sisip) {
                      blobHasil = new Blob([sisip], { type: r.blob.type });
                      exifCatatan = diubahUkuran ? 'data foto dipertahankan (ukuran di data foto masih ukuran lama)' : 'data foto dipertahankan';
                    } else exifCatatan = 'data foto tidak bisa dipindahkan ke hasil ini';
                  } else exifCatatan = 'file asli tidak menyimpan data foto';
                } catch (e) { exifCatatan = 'data foto tidak bisa dipindahkan'; }
              } else exifCatatan = 'data foto tidak bisa disimpan ke format ' + r.ext.toUpperCase();
            }
            const base = (files[i].name || 'gambar').replace(/\.[^.]*$/, '');
            const nama = files.length > 1 || awalInp.value.trim() || akhirInp.value.trim() || nomorCek.checked
              ? namaDariPola(awalInp.value, akhirInp.value, base, i, nomorCek.checked, r.ext)
              : base + '.' + r.ext;
            hasilBatch.push({ blob: blobHasil, name: nama, asal: files[i].name, asalSize: files[i].size, asalW, asalH, w: canvas.width, h: canvas.height, exifCatatan });
          } catch (e) {
            gagal.push((files[i].name || 'gambar ' + (i + 1)) + ' (' + pesanGagal(e) + ')');
          }
        }
        T.hide(statusBox);
        if (!hasilBatch.length) { T.toast('Tidak ada gambar yang berhasil di-convert'); return; }
        cur = hasilBatch[0];
        dlB.disabled = false; // hasil sudah ada, tombol Unduh aktif (P2-2)

        if (hasilBatch.length === 1) {
          const r = hasilBatch[0];
          const selisih = r.asalSize ? Math.round((1 - r.blob.size / r.asalSize) * 100) : 0;
          T.show(box, '');
          const row2 = T.el('<div class="row"></div>');
          row2.appendChild(T.el(`<div><div class="hint">Asal: <b>${r.asalW}×${r.asalH}</b> · ${fmtBytes(r.asalSize)}</div><div class="hint">Hasil: <b>${fmtBytes(r.blob.size)}</b> (${r.w}×${r.h})` + (selisih !== 0 ? ' · ' + (selisih > 0 ? 'lebih kecil ' + selisih + '%' : 'lebih besar ' + Math.abs(selisih) + '%') : '') + `</div>` + (r.exifCatatan ? '<div class="hint">' + T.esc(r.exifCatatan) + '</div>' : '') + `</div>`));
          box.appendChild(row2);
          const url = URL.createObjectURL(r.blob);
          box.appendChild(imgEl(url, 'Hasil convert'));
          T.onLeave(() => URL.revokeObjectURL(url));
        } else {
          T.show(infoBox, `<div class="kv"><span>Berhasil</span><b>${hasilBatch.length} dari ${files.length} gambar</b></div>`);
          T.show(box, '');
          hasilBatch.forEach((r) => {
            const selisih = r.asalSize ? Math.round((1 - r.blob.size / r.asalSize) * 100) : 0;
            const row = T.el('<div class="row" style="align-items:center;justify-content:space-between"></div>');
            row.appendChild(T.el('<div style="word-break:break-word"><b>' + T.esc(r.name) + '</b><div class="dim" style="font-size:12px">' + r.asalW + '×' + r.asalH + ' · ' + fmtBytes(r.asalSize) + ' → ' + r.w + '×' + r.h + ' · ' + fmtBytes(r.blob.size) + (selisih !== 0 ? ' (' + (selisih > 0 ? '−' + selisih + '%' : '+' + Math.abs(selisih) + '%') + ')' : '') + (r.exifCatatan ? ' · ' + T.esc(r.exifCatatan) : '') + '</div></div>'));
            row.appendChild(T.btn('Unduh', () => { T.dl(r.name, r.blob, r.blob.type); }, true));
            box.appendChild(row);
          });
          const zipB = T.btn('Unduh semua (ZIP)', async () => {
            T.show(statusBox, '<span class="dim">Menyiapkan ZIP…</span>');
            if (!(await pastZip())) { T.show(statusBox, '<span class="dim">Pembuat ZIP gagal dimuat. Cek koneksi lalu coba lagi, atau unduh satu per satu.</span>'); return; }
            try {
              const zip = new window.JSZip();
              const pakaiNama = new Set();
              const namaUnik = (nama) => {
                if (!pakaiNama.has(nama)) { pakaiNama.add(nama); return nama; }
                const i = nama.lastIndexOf('.');
                const dasar = i > 0 ? nama.slice(0, i) : nama;
                const ext = i > 0 ? nama.slice(i) : '';
                let k = 2, coba;
                do { coba = dasar + ' (' + k + ')' + ext; k++; } while (pakaiNama.has(coba));
                pakaiNama.add(coba);
                return coba;
              };
              hasilBatch.forEach((r) => zip.file(namaUnik(r.name), r.blob));
              const blob = await zip.generateAsync({ type: 'blob' });
              T.dl('gambar-convert.zip', blob, 'application/zip');
              T.hide(statusBox);
              T.toast('ZIP berhasil diunduh');
            } catch (e) {
              T.show(statusBox, '<span class="dim">Gagal membuat ZIP. Unduh gambarnya satu per satu.</span>');
            }
          }, true);
          box.appendChild(T.row(zipB));
        }
        if (gagal.length) {
          box.appendChild(T.el('<p class="dim" style="font-size:12px">Gagal: ' + T.esc(gagal.join('; ')) + '</p>'));
        }
        T.scrollToPreview(box);
      }

      root.appendChild(T.el(`<p class="note">🔒 ${LOCAL_NOTE}</p>`));
      root.appendChild(T.field('Pilih gambar (bisa banyak sekaligus)', fileI, 'Masuk: JPG, PNG, WebP, GIF, BMP, AVIF, ICO, SVG, HEIC, TIFF. Maksimal ' + MAKS_JUMLAH + ' file.'));
      root.appendChild(T.grid2(
        T.field('Format tujuan', fmtSel),
        T.field('Kualitas', (() => { const d = T.el('<div class="row"></div>'); d.appendChild(qRange); d.appendChild(qVal); return d; })(), 'Tidak berlaku untuk PNG, BMP, TIFF, SVG, dan ICO.')
      ));
      root.appendChild(T.grid2(T.field('Ubah ukuran', resizeSel, 'Ukuran gambar hasil. Rasio dijaga supaya tidak gepeng.'), resizeWrap));
      root.appendChild(T.grid2(T.field('Awalan nama file (opsional)', awalInp), T.field('Akhiran nama file (opsional)', akhirInp)));
      root.appendChild(nomorChk);
      root.appendChild(T.field('Data foto (EXIF)', exifSel, 'Bawaan: data foto dibuang (lebih aman dibagikan). “Pertahankan” hanya bisa ke JPG/PNG dan hanya bila file asli memang menyimpan data foto.'));
      root.appendChild(avifCatatan);
      root.appendChild(T.el('<p class="dim" style="font-size:12px;line-height:1.5">Belum bisa menyimpan ke HEIC, karena tidak ada pengubahnya di browser. SVG di sini membungkus foto (bukan vektor asli) — untuk foto jadi gambar vektor SVG, pakai <a href="#/t/imagevectorizer">Image Vectorizer</a>.</p>'));
      // "Unduh Hasil" sekunder + nonaktif sampai hasil benar-benar ada (P2-2):
      // sebelumnya primary coral berdampingan dengan "Convert" dan aktif sejak
      // awal padahal belum ada hasil (ditekan hanya memunculkan toast).
      const dlB = T.btn('Unduh Hasil', () => {
        if (!cur) { T.toast('Convert dulu gambarnya'); return; }
        T.dl(cur.name, cur.blob, cur.blob.type);
        T.toast('Berhasil diunduh');
      }, false, true);
      root.appendChild(T.row(
        T.btn('Convert', process, true),
        dlB
      ));
      root.appendChild(statusBox);
      root.appendChild(infoBox);
      root.appendChild(box);
    
}
