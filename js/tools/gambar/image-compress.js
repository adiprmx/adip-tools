import { h as T, utils, LOCAL_NOTE, canvasToBlob, fileInput, fmtBytes, imgEl, loadImage } from '../../core.js?v=6.12.2';

// Cari kualitas tertinggi (0..1) yang hasilnya <= targetBytes.
// ukur(q) -> Promise<number|null> ukuran byte pada kualitas q.
// Mengembalikan {q, size} atau null bila kualitas terendah pun masih di atas target.
// Murni (tanpa DOM), bisa diuji di Node dengan fungsi ukur tiruan.
export async function cariKualitasPas(ukur, targetBytes, batas) {
  const n = batas == null ? 7 : batas;
  let lo = 0.05, hi = 0.95;
  const sizeHi = await ukur(hi);
  if (sizeHi != null && sizeHi <= targetBytes) return { q: hi, size: sizeHi };
  const sizeLo = await ukur(lo);
  if (sizeLo == null || sizeLo > targetBytes) return null;
  let best = { q: lo, size: sizeLo };
  for (let i = 0; i < n; i++) {
    const mid = (lo + hi) / 2;
    const s = await ukur(mid);
    if (s == null) break;
    if (s <= targetBytes) { best = { q: mid, size: s }; lo = mid; } else { hi = mid; }
  }
  return best;
}

export const meta = {"id": "image-compress", "name": "Kompres Gambar", "cat": "gambar", "icon": "🗜️", "desc": "Kecilkan ukuran foto langsung di HP.", "keywords": "kompres,gambar,foto,kecil,ukuran,heic,avif,tiff,batch"};
export function render(root) {

      const ZIP_CDN = 'https://cdn.jsdelivr.net/npm/jszip@3.10.2/dist/jszip.min.js';
      const HEIC_CDN = 'https://cdn.jsdelivr.net/npm/heic2any@0.0.4/dist/heic2any.min.js';
      const UTIF_CDN = 'https://cdn.jsdelivr.net/npm/utif@3.1.0/UTIF.js';
      const MAKS_JUMLAH = 20;
      let zipSiap = null, heicSiap = null, utifSiap = null;
      const pastZip = () => {
        if (!zipSiap) zipSiap = T.loadScript(ZIP_CDN).then((ok) => ok && typeof window.JSZip === 'function');
        return zipSiap;
      };
      const pastHeic = () => {
        if (!heicSiap) heicSiap = T.loadScript(HEIC_CDN).then((ok) => ok && typeof window.heic2any === 'function');
        return heicSiap;
      };
      const pastUtif = () => {
        if (!utifSiap) utifSiap = T.loadScript(UTIF_CDN).then((ok) => ok && !!window.UTIF);
        return utifSiap;
      };

      const fileI = fileInput('image/*,.heic,.heif,.tif,.tiff');
      fileI.multiple = true;
      const modeSel = T.select([['kualitas', 'Kualitas (geser sendiri)'], ['target', 'Target ukuran pas']], 'kualitas');
      const qRange = T.input('range'); qRange.min = '10'; qRange.max = '100'; qRange.value = '80';
      const qVal = T.el('<b>80%</b>');
      const targetSel = T.select([['200', '200 KB (CPNS)'], ['500', '500 KB'], ['1024', '1 MB'], ['bebas', 'Angka bebas…']], '200');
      const targetCustom = T.input('text', 'cth: 300', ''); targetCustom.inputMode = 'decimal';
      const maxDim = T.input('number', 'cth: 1600', '1600'); maxDim.inputMode = 'numeric';
      const fmtSel = T.select([['jpeg', 'JPEG'], ['webp', 'WebP'], ['avif', 'AVIF'], ['png', 'PNG']], 'jpeg');
      const box = T.out();
      const infoBox = T.out();
      const statusBox = T.out();
      let cur = null; // {blob, name, w, h}
      let hasilBatch = []; // [{blob, name, asal, hemat}]

      qRange.addEventListener('input', () => { qVal.textContent = qRange.value + '%'; });

      // AVIF keluar hanya bila browser ini bisa menyimpannya; kalau tidak, opsinya dihapus.
      const avifCatatan = T.el('<p class="dim" style="font-size:12px" hidden>Browser ini belum bisa menyimpan AVIF, jadi pilihan AVIF disembunyikan.</p>');
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

      const jenisMasukan = (file) => {
        const t = (file.type || '').toLowerCase();
        const n = (file.name || '').toLowerCase();
        if (t === 'image/heic' || t === 'image/heif' || n.endsWith('.heic') || n.endsWith('.heif')) return 'heic';
        if (t === 'image/tiff' || t === 'image/x-tiff' || n.endsWith('.tif') || n.endsWith('.tiff')) return 'tiff';
        return 'biasa';
      };

      // File apa pun -> {el, w, h} yang bisa digambar ke canvas.
      async function muatSumber(file) {
        const jenis = jenisMasukan(file);
        if (jenis === 'heic') {
          if (!(await pastHeic())) throw new Error('pengubah HEIC gagal dimuat, cek koneksi');
          const keluar = await window.heic2any({ blob: file, toType: 'image/jpeg', quality: 0.92 });
          const blob = Array.isArray(keluar) ? keluar[0] : keluar;
          if (!blob) throw new Error('file HEIC tidak terbaca');
          const img = await loadImage(blob);
          return { el: img, w: img.naturalWidth, h: img.naturalHeight };
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
          return { el: c, w: c.width, h: c.height };
        }
        const img = await loadImage(file);
        return { el: img, w: img.naturalWidth, h: img.naturalHeight };
      }

      const qField = T.field('Kualitas', (() => { const d = T.el('<div class="row"></div>'); d.appendChild(qRange); d.appendChild(qVal); return d; })());
      const targetField = T.field('Target ukuran', targetSel);
      const customField = T.field('Target ukuran (KB)', targetCustom, 'Isi angka saja, contoh: 300.');
      customField.hidden = true;
      const aturMode = () => {
        const target = modeSel.value === 'target';
        qField.style.display = target ? 'none' : '';
        targetField.style.display = target ? '' : 'none';
        customField.hidden = !(target && targetSel.value === 'bebas');
      };
      modeSel.addEventListener('change', aturMode);
      targetSel.addEventListener('change', aturMode);

      const targetBytes = () => {
        if (modeSel.value !== 'target') return null;
        let kb;
        if (targetSel.value === 'bebas') {
          kb = T.num(targetCustom.value);
          if (!kb || kb <= 0) { T.toast('Isi target ukuran dulu (angka KB)'); return -1; }
        } else kb = parseInt(targetSel.value, 10);
        if (kb > 10240) { T.toast('Target maksimal 10 MB (10240 KB)'); return -1; }
        return Math.round(kb * 1024);
      };

      const gambarKeCanvas = (img, w, h, isiPutih) => {
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        const ctx = c.getContext('2d');
        if (isiPutih) { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h); }
        ctx.drawImage(img, 0, 0, w, h);
        return c;
      };

      // Satu file -> hasil kompres (mode kualitas atau target ukuran).
      async function prosesSatu(file, target) {
        let img, w, h;
        try {
          const s = await muatSumber(file);
          img = s.el; w = s.w; h = s.h;
        }
        catch (e) { throw new Error(e.message || 'bukan gambar yang valid'); }
        const origW = w, origH = h;
        const max = parseInt(maxDim.value, 10);
        if (max > 0 && Math.max(w, h) > max) {
          const s = max / Math.max(w, h);
          w = Math.round(w * s); h = Math.round(h * s);
        }
        const mime = fmtSel.value === 'png' ? 'image/png' : fmtSel.value === 'webp' ? 'image/webp' : fmtSel.value === 'avif' ? 'image/avif' : 'image/jpeg';
        const isiPutih = fmtSel.value !== 'png';
        const base = (file.name || 'gambar').replace(/\.[^.]*$/, '');
        const ext = fmtSel.value === 'jpeg' ? 'jpg' : fmtSel.value;
        const nama = base + '-kompres.' + ext;

        if (target == null) {
          const q = fmtSel.value === 'png' ? undefined : (parseInt(qRange.value, 10) / 100);
          const blob = await canvasToBlob(gambarKeCanvas(img, w, h, isiPutih), mime, q);
          if (!blob) throw new Error('gagal memproses gambar');
          return { blob, name: nama, w, h, origW: origW, origH: origH, origSize: file.size, catatan: '' };
        }

        // Mode target ukuran.
        if (fmtSel.value === 'png') {
          // PNG tidak punya pengaturan kualitas: capai target dengan memperkecil dimensi bila perlu.
          let skala = 1, blob = null, cw = w, ch = h;
          for (let i = 0; i < 6; i++) {
            cw = Math.max(1, Math.round(w * skala)); ch = Math.max(1, Math.round(h * skala));
            blob = await canvasToBlob(gambarKeCanvas(img, cw, ch, false), mime, undefined);
            if (!blob) throw new Error('gagal memproses gambar');
            if (blob.size <= target) break;
            skala *= 0.8;
          }
          return { blob, name: nama, w: cw, h: ch, origW: origW, origH: origH, origSize: file.size,
            catatan: blob.size > target ? 'Tetap di atas target, ini hasil terkecil yang bisa dibuat.' : (skala < 1 ? 'Dimensi diperkecil supaya muat di target.' : '') };
        }
        let skala = 1, cw = w, ch = h, ketemu = null, diperkecil = false;
        for (let percobaan = 0; percobaan < 5 && !ketemu; percobaan++) {
          cw = Math.max(1, Math.round(w * skala)); ch = Math.max(1, Math.round(h * skala));
          const canvas = gambarKeCanvas(img, cw, ch, isiPutih);
          const ukur = async (q) => {
            const b = await canvasToBlob(canvas, mime, q);
            return b ? b.size : null;
          };
          const pas = await cariKualitasPas(ukur, target);
          if (pas) {
            const blob = await canvasToBlob(canvas, mime, pas.q);
            if (blob) ketemu = { blob, q: pas.q };
          }
          if (!ketemu) { skala *= 0.8; diperkecil = true; }
        }
        if (!ketemu) {
          // Terakhir: kualitas terendah di dimensi terkecil, hasilnya tetap dikasih dengan catatan jujur.
          const canvas = gambarKeCanvas(img, cw, ch, isiPutih);
          const blob = await canvasToBlob(canvas, mime, 0.05);
          if (!blob) throw new Error('gagal memproses gambar');
          return { blob, name: nama, w: cw, h: ch, origW: origW, origH: origH, origSize: file.size,
            catatan: 'Tetap di atas target (' + fmtBytes(blob.size) + '), ini hasil terkecil yang bisa dibuat. Coba naikkan targetnya.' };
        }
        return { blob: ketemu.blob, name: nama, w: cw, h: ch, origW: origW, origH: origH, origSize: file.size,
          catatan: diperkecil ? 'Dimensi diperkecil supaya muat di target.' : '' };
      }

      async function process() {
        T.hide(infoBox); T.hide(box); T.hide(statusBox);
        const files = [...(fileI.files || [])].slice(0, MAKS_JUMLAH);
        if (!files.length) { T.toast('Pilih gambar dulu'); return; }
        const target = targetBytes();
        if (target === -1) return;
        hasilBatch = [];
        cur = null;
        // Pesan gagal buatan tool ini sudah Bahasa Indonesia — tampilkan apa adanya.
        // Error lain (dari browser/library) diganti pesan ramah.
        const pesanGagal = (er) => {
          const m = (er && er.message) || '';
          if (/^(pengubah HEIC|pembaca TIFF|file HEIC tidak terbaca|file TIFF tidak terbaca|gagal memproses gambar|bukan gambar yang valid)/.test(m)) return m;
          return 'tidak bisa diproses';
        };
        const gagal = [];
        for (let i = 0; i < files.length; i++) {
          if (files.length > 1) T.show(statusBox, '<span class="dim">Memproses ' + (i + 1) + ' dari ' + files.length + '…</span>');
          try {
            hasilBatch.push(await prosesSatu(files[i], target));
          } catch (e) {
            gagal.push((files[i].name || 'gambar ' + (i + 1)) + ' (' + pesanGagal(e) + ')');
          }
        }
        T.hide(statusBox);
        if (!hasilBatch.length) { T.toast('Tidak ada gambar yang berhasil diproses'); return; }
        cur = hasilBatch[0];

        if (hasilBatch.length === 1) {
          // Tampilan lama: ringkasan + pratinjau + tombol Unduh Hasil.
          const r = hasilBatch[0];
          const pct = Math.round((1 - r.blob.size / r.origSize) * 100);
          T.show(infoBox,
            `<div class="kv"><span>Asli</span><b>${fmtBytes(r.origSize)} (${r.origW}×${r.origH})</b></div>` +
            `<div class="kv"><span>Hasil</span><b>${fmtBytes(r.blob.size)} (${r.w}×${r.h})</b></div>` +
            `<div class="kv"><span>Hemat</span><b>${pct >= 0 ? pct + '%' : 'malah ' + Math.abs(pct) + '% lebih besar'}</b></div>` +
            (r.catatan ? `<p class="dim" style="font-size:12px">${T.esc(r.catatan)}</p>` : ''));
          T.show(box, '');
          const imgObjUrl = URL.createObjectURL(r.blob);
          box.appendChild(imgEl(imgObjUrl, 'Hasil kompres'));
          T.onLeave(() => URL.revokeObjectURL(imgObjUrl));
        } else {
          // Tampilan batch: daftar per foto + ZIP.
          const totalAsli = hasilBatch.reduce((a, r) => a + r.origSize, 0);
          const totalHasil = hasilBatch.reduce((a, r) => a + r.blob.size, 0);
          const pctTotal = Math.round((1 - totalHasil / totalAsli) * 100);
          T.show(infoBox,
            `<div class="kv"><span>Foto berhasil</span><b>${hasilBatch.length} dari ${files.length}</b></div>` +
            `<div class="kv"><span>Total asli</span><b>${fmtBytes(totalAsli)}</b></div>` +
            `<div class="kv"><span>Total hasil</span><b>${fmtBytes(totalHasil)}</b></div>` +
            `<div class="kv"><span>Hemat</span><b>${pctTotal >= 0 ? pctTotal + '%' : 'malah ' + Math.abs(pctTotal) + '% lebih besar'}</b></div>`);
          T.show(box, '');
          hasilBatch.forEach((r) => {
            const pct = Math.round((1 - r.blob.size / r.origSize) * 100);
            const row = T.el('<div class="row" style="align-items:center;justify-content:space-between"></div>');
            row.appendChild(T.el('<div style="word-break:break-word"><b>' + T.esc(r.name) + '</b><div class="dim" style="font-size:12px">' + fmtBytes(r.origSize) + ' → ' + fmtBytes(r.blob.size) + ' (' + (pct >= 0 ? 'hemat ' + pct + '%' : 'lebih besar ' + Math.abs(pct) + '%') + ')' + (r.catatan ? '<br>' + T.esc(r.catatan) : '') + '</div></div>'));
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
              T.dl('foto-kompres.zip', blob, 'application/zip');
              T.hide(statusBox);
              T.toast('ZIP berhasil diunduh');
            } catch (e) {
              T.show(statusBox, '<span class="dim">Gagal membuat ZIP. Unduh fotonya satu per satu.</span>');
            }
          }, true);
          box.appendChild(T.row(zipB));
        }
        if (gagal.length) {
          box.appendChild(T.el('<p class="dim" style="font-size:12px">Gagal: ' + T.esc(gagal.join('; ')) + '</p>'));
        }
        T.scrollToPreview(infoBox);
      }

      const dlB = T.btn('Unduh Hasil', () => {
        if (!cur) { T.toast('Proses dulu gambarnya'); return; }
        T.dl(cur.name, cur.blob, cur.blob.type);
        T.toast('Berhasil diunduh');
      }, true);

      root.appendChild(T.el(`<p class="note">🔒 ${LOCAL_NOTE}</p>`));
      root.appendChild(T.field('Pilih gambar (bisa banyak sekaligus)', fileI, 'Maksimal ' + MAKS_JUMLAH + ' foto sekali proses. Foto iPhone (HEIC) dan TIFF juga bisa.'));
      root.appendChild(T.field('Cara kompres', modeSel, 'Target ukuran pas: hasil diusahakan tepat di bawah ukuran yang dipilih.'));
      root.appendChild(qField);
      root.appendChild(targetField);
      root.appendChild(customField);
      root.appendChild(T.grid2(
        T.field('Format output', fmtSel),
        T.field('Maksimal dimensi (px, sisi terpanjang)', maxDim, 'Dikosongkan = ukuran asli.')
      ));
      root.appendChild(avifCatatan);
      root.appendChild(T.row(T.btn('Kompres', process, true), dlB));
      root.appendChild(statusBox);
      root.appendChild(infoBox);
      root.appendChild(box);
      aturMode();
    
}
