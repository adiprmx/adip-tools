import { h as T, fileInput, fmtBytes, LOCAL_NOTE, utils } from '../../core.js';

// Kompres GIF: kecilkan ukuran file GIF animasi dengan mengurangi jumlah
// warna, ukuran gambar, atau jumlah frame. Ukuran sebelum dan sesudah
// yang ditampilkan adalah ukuran file BENAR-BENAR (diukur dari Blob),
// bukan perkiraan. Pembaca GIF-nya gifuct-js, penulisnya gifenc —
// keduanya murni JavaScript, sama seperti tool GIF lain di sini.
export const meta = {"id": "kompres-gif", "name": "Kompres GIF", "cat": "gambar", "icon": "🗜️", "desc": "Kecilkan ukuran GIF animasi. Lihat ukuran sebelum dan sesudah yang sebenarnya.", "keywords": "kompres gif,kecilkan gif,ukuran gif,optimasi gif", "since": "6.17.0", "online": true};

const GIFUCT_CDN = 'https://esm.sh/gifuct-js@2.1.2';
const GIFENC_CDN = 'https://cdn.jsdelivr.net/npm/gifenc@1.0.3/dist/gifenc.esm.js';
const MAKS_FRAME = 300;

// Susun frame-frame GIF mentah jadi gambar utuh per frame (murni, tanpa DOM).
// Sama seperti di pecah-gif-jadi-frame: menghormati disposal 2 dan 3.
// susunFrame kanonis tinggal di utils (core.js).

// Hitung persen penghematan dari ukuran nyata (murni, bisa diuji).
export function persenHemat(sebelum, sesudah) {
  if (!sebelum || sebelum <= 0) return 0;
  return Math.round((1 - sesudah / sebelum) * 100);
}

export function render(root) {
  const fi = fileInput('.gif,image/gif');
  const warnaSel = T.select([['256', '256 warna (kualitas penuh)'], ['128', '128 warna'], ['64', '64 warna'], ['32', '32 warna (paling kecil)']], '128');
  const ukuranSel = T.select([['100', 'Ukuran asli'], ['75', '75% dari asli'], ['50', 'Setengah dari asli']], '100');
  const frameSel = T.select([['semua', 'Semua frame'], ['setengah', 'Setengah frame (gerak lebih kasar)']], 'semua');
  const statusBox = T.out();
  const infoBox = T.out();
  const hasilBox = T.out();

  let gifuctSiap = null;
  let gifencSiap = null;
  let fileAsli = null;
  let namaFile = 'gif';

  const muatGifuct = () => {
    if (!gifuctSiap) {
      gifuctSiap = import(/* @vite-ignore */ GIFUCT_CDN).then((m) => {
        if (typeof m.parseGIF !== 'function' || typeof m.decompressFrames !== 'function') throw new Error('api gifuct tidak lengkap');
        return m;
      }).catch((e) => { gifuctSiap = null; throw e; });
    }
    return gifuctSiap;
  };
  const muatGifenc = () => {
    if (!gifencSiap) {
      gifencSiap = import(/* @vite-ignore */ GIFENC_CDN).then((m) => {
        if (typeof m.GIFEncoder !== 'function' || typeof m.quantize !== 'function' || typeof m.applyPalette !== 'function') throw new Error('api gifenc tidak lengkap');
        return m;
      }).catch((e) => { gifencSiap = null; throw e; });
    }
    return gifencSiap;
  };

  fi.addEventListener('change', async () => {
    const f = fi.files && fi.files[0];
    if (!f) return;
    fileAsli = f;
    namaFile = (f.name || 'gif').replace(/\.[^.]*$/, '');
    T.hide(hasilBox); T.hide(statusBox);
    T.show(infoBox, `<div class="kv"><span>Ukuran asli</span><b>${fmtBytes(f.size)}</b></div><p class="dim">Pilih pengaturan di bawah lalu tekan tombolnya.</p>`);
    kompresB.disabled = false;
  });

  async function kompres() {
    if (!fileAsli) { T.toast('Pilih file GIF dulu'); return; }
    T.hide(hasilBox);
    kompresB.disabled = true;
    T.show(statusBox, '<span class="dim">Memuat alat GIF… (perlu internet sekali saja)</span>');
    let dec, enc;
    try {
      [dec, enc] = await Promise.all([muatGifuct(), muatGifenc()]);
    } catch (e) {
      T.show(statusBox, '<div class="err">Alat GIF gagal dimuat. Cek koneksi internetmu lalu coba lagi.</div> <button class="btn" type="button">Coba lagi</button>');
      statusBox.querySelector('button').addEventListener('click', kompres);
      kompresB.disabled = false;
      return;
    }
    try {
      T.show(statusBox, '<span class="dim">Membaca GIF…</span>');
      const buf = await fileAsli.arrayBuffer();
      const gif = dec.parseGIF(buf);
      const frames = dec.decompressFrames(gif, true);
      if (!frames.length) throw new Error('tidak ada frame');
      const w0 = gif.lsd.width, h0 = gif.lsd.height;
      const pakai = frames.slice(0, MAKS_FRAME);
      const susun = utils.susunFrame(pakai, w0, h0);
      // Pilih frame: 'setengah' = ambil tiap frame genap, jeda digandakan.
      const indeksPakai = [];
      pakai.forEach((fr, i) => {
        if (frameSel.value === 'setengah' && i % 2 === 1) return;
        indeksPakai.push(i);
      });
      const pengaliJeda = frameSel.value === 'setengah' ? 2 : 1;
      const skalaUkuran = parseInt(ukuranSel.value, 10) / 100;
      const W = Math.max(2, Math.round(w0 * skalaUkuran));
      const H = Math.max(2, Math.round(h0 * skalaUkuran));
      const jumlahWarna = parseInt(warnaSel.value, 10);
      const gifOut = enc.GIFEncoder();
      const cAsli = document.createElement('canvas');
      cAsli.width = w0; cAsli.height = h0;
      const ctxAsli = cAsli.getContext('2d');
      const cKecil = document.createElement('canvas');
      cKecil.width = W; cKecil.height = H;
      const ctxKecil = cKecil.getContext('2d', { willReadFrequently: true });
      for (let k = 0; k < indeksPakai.length; k++) {
        const i = indeksPakai[k];
        T.show(statusBox, `<span class="dim">Mengompres… frame ${k + 1} dari ${indeksPakai.length}</span>`);
        await new Promise((r) => setTimeout(r, 0));
        ctxAsli.putImageData(new ImageData(new Uint8ClampedArray(susun[i]), w0, h0), 0, 0);
        ctxKecil.fillStyle = '#ffffff';
        ctxKecil.fillRect(0, 0, W, H);
        ctxKecil.drawImage(cAsli, 0, 0, W, H);
        const data = ctxKecil.getImageData(0, 0, W, H).data;
        const palet = enc.quantize(data, jumlahWarna);
        const indeks = enc.applyPalette(data, palet);
        const jeda = Math.max(20, (pakai[i].delay || 100) * pengaliJeda);
        gifOut.writeFrame(indeks, W, H, { palette: palet, delay: jeda });
      }
      gifOut.finish();
      const blob = new Blob([gifOut.bytes()], { type: 'image/gif' });
      const url = URL.createObjectURL(blob);
      T.onLeave(() => URL.revokeObjectURL(url));
      T.hide(statusBox);
      const hemat = persenHemat(fileAsli.size, blob.size);
      const hematTeks = hemat > 0 ? `lebih kecil ${hemat}%` : hemat < 0 ? `malah lebih besar ${-hemat}%` : 'ukurannya sama';
      T.show(hasilBox, '');
      const im = document.createElement('img');
      im.src = url; im.alt = 'GIF hasil kompres';
      im.style.cssText = 'max-width:100%;height:auto;border-radius:10px;display:block';
      hasilBox.appendChild(im);
      hasilBox.appendChild(T.el(`<div class="kv"><span>Sebelum</span><b>${fmtBytes(fileAsli.size)}</b></div><div class="kv"><span>Sesudah</span><b>${fmtBytes(blob.size)}</b></div><p class="dim">Hasilnya ${hematTeks}. ${hemat <= 0 ? 'Coba kurangi warna atau ukuran supaya lebih kecil.' : ''}</p>`));
      hasilBox.appendChild(T.btn('Unduh GIF Hasil', () => { T.dl(`${namaFile}-kecil.gif`, blob, 'image/gif'); T.toast('Berhasil diunduh'); }, true));
      T.scrollToPreview(hasilBox);
    } catch (e) {
      T.show(statusBox, '<div class="err">Gagal mengompres GIF. Pastikan filenya GIF asli, lalu coba lagi.</div> <button class="btn" type="button">Coba lagi</button>');
      statusBox.querySelector('button').addEventListener('click', kompres);
    } finally {
      kompresB.disabled = false;
    }
  }

  const kompresB = T.btn('Kompres GIF', kompres, true, true);

  root.appendChild(T.el(`<p class="note">🔒 ${LOCAL_NOTE}</p>`));
  root.appendChild(T.field('Pilih file GIF', fi));
  root.appendChild(T.field('Jumlah warna', warnaSel, 'Warna lebih sedikit = file lebih kecil, tapi gambar bisa kelihatan kurang halus.'));
  root.appendChild(T.field('Ukuran gambar', ukuranSel));
  root.appendChild(T.field('Jumlah frame', frameSel, 'Setengah frame bikin gerak lebih kasar tapi file jauh lebih kecil.'));
  root.appendChild(statusBox);
  root.appendChild(infoBox);
  root.appendChild(kompresB);
  root.appendChild(hasilBox);
}
