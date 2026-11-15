import { h as T, utils, LOCAL_NOTE, canvasToBlob, fileInput, fmtBytes, imgEl, loadImage } from '../../core.js?v=6.11.5';

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

export const meta = {"id": "image-convert", "name": "Convert Gambar", "cat": "gambar", "icon": "🔁", "desc": "Convert WebP/JPG/PNG/HEIC/TIFF/AVIF/BMP/ICO/SVG di browser.", "keywords": "convert,gambar,webp,jpg,png,format,heic,tiff,avif,bmp,ico,svg"};
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
      const fmtSel = T.select([['jpeg', 'JPEG (.jpg)'], ['png', 'PNG'], ['webp', 'WebP'], ['avif', 'AVIF'], ['bmp', 'BMP'], ['ico', 'ICO (ikon)']], 'jpeg');
      const qRange = T.input('range'); qRange.min = '10'; qRange.max = '100'; qRange.value = '90';
      const qVal = T.el('<b>90%</b>');
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
        if (fmt === 'bmp') {
          const c = document.createElement('canvas');
          c.width = canvas.width; c.height = canvas.height;
          const ctx = c.getContext('2d');
          ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
          ctx.drawImage(canvas, 0, 0);
          return { blob: canvasKeBmp(c), ext: 'bmp' };
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
        const gagal = [];
        const q = parseInt(qRange.value, 10) / 100;
        for (let i = 0; i < files.length; i++) {
          if (files.length > 1) T.show(statusBox, '<span class="dim">Convert ' + (i + 1) + ' dari ' + files.length + ': ' + T.esc(files[i].name || '') + '…</span>');
          try {
            let canvas = await fileKeCanvas(files[i]);
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
            const base = (files[i].name || 'gambar').replace(/\.[^.]*$/, '');
            hasilBatch.push({ blob: r.blob, name: base + '.' + r.ext, asal: files[i].name, w: canvas.width, h: canvas.height });
          } catch (e) {
            gagal.push((files[i].name || 'gambar ' + (i + 1)) + ' (' + (e.message || 'gagal') + ')');
          }
        }
        T.hide(statusBox);
        if (!hasilBatch.length) { T.toast('Tidak ada gambar yang berhasil di-convert'); return; }
        cur = hasilBatch[0];

        if (hasilBatch.length === 1) {
          const r = hasilBatch[0];
          T.show(box, '');
          const row2 = T.el('<div class="row"></div>');
          row2.appendChild(T.el(`<div><div class="hint">Ukuran hasil: <b>${fmtBytes(r.blob.size)}</b> (${r.w}×${r.h})</div></div>`));
          box.appendChild(row2);
          const url = URL.createObjectURL(r.blob);
          box.appendChild(imgEl(url, 'Hasil convert'));
          T.onLeave(() => URL.revokeObjectURL(url));
        } else {
          T.show(infoBox, `<div class="kv"><span>Berhasil</span><b>${hasilBatch.length} dari ${files.length} gambar</b></div>`);
          T.show(box, '');
          hasilBatch.forEach((r) => {
            const row = T.el('<div class="row" style="align-items:center;justify-content:space-between"></div>');
            row.appendChild(T.el('<div style="word-break:break-word"><b>' + T.esc(r.name) + '</b><div class="dim" style="font-size:12px">' + fmtBytes(r.blob.size) + ' (' + r.w + '×' + r.h + ')</div></div>'));
            row.appendChild(T.btn('Unduh', () => { T.dl(r.name, r.blob, r.blob.type); }, true));
            box.appendChild(row);
          });
          const zipB = T.btn('Unduh semua (ZIP)', async () => {
            T.show(statusBox, '<span class="dim">Menyiapkan ZIP…</span>');
            if (!(await pastZip())) { T.show(statusBox, '<span class="dim">Pembuat ZIP gagal dimuat. Cek koneksi lalu coba lagi, atau unduh satu per satu.</span>'); return; }
            try {
              const zip = new window.JSZip();
              hasilBatch.forEach((r) => zip.file(r.name, r.blob));
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
        T.field('Kualitas', (() => { const d = T.el('<div class="row"></div>'); d.appendChild(qRange); d.appendChild(qVal); return d; })(), 'Tidak berlaku untuk PNG, BMP, dan ICO.')
      ));
      root.appendChild(avifCatatan);
      root.appendChild(T.el('<p class="dim" style="font-size:12px;line-height:1.5">Belum bisa menyimpan ke HEIC, TIFF, atau SVG, karena tidak ada pengubahnya di browser. Untuk foto jadi gambar vektor SVG, pakai <a href="#/t/imagevectorizer">Image Vectorizer</a>.</p>'));
      root.appendChild(T.row(
        T.btn('Convert', process, true),
        T.btn('Unduh Hasil', () => {
          if (!cur) { T.toast('Convert dulu gambarnya'); return; }
          T.dl(cur.name, cur.blob, cur.blob.type);
          T.toast('Berhasil diunduh');
        }, true)
      ));
      root.appendChild(statusBox);
      root.appendChild(infoBox);
      root.appendChild(box);
    
}
