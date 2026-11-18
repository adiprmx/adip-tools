import { h as T, fileInput, fmtBytes, LOCAL_NOTE } from '../../core.js';

// GIF ke Video: GIF animasi jadi video yang bisa diputar di mana saja.
// Caranya: tiap frame GIF digambar ke canvas sesuai jedanya, lalu canvas
// direkam dengan perekam bawaan browser (MediaRecorder) — tanpa server,
// tanpa ffmpeg. Format MP4 hanya bisa bila browsernya mendukung; kalau
// tidak, hasilnya WebM dan itu dijelaskan jujur di layar.
export const meta = {"id": "gif-ke-video", "name": "GIF ke Video", "cat": "gambar", "icon": "🎬", "desc": "GIF animasi jadi video. Pilih MP4 atau WebM, lalu unduh.", "keywords": "gif ke video,mp4,webm,animasi,ubah gif", "since": "6.17.0"};

const GIFUCT_CDN = 'https://esm.sh/gifuct-js@2.1.2';
const MAKS_FRAME = 300;
const MAKS_DURASI_MS = 60000;

// Susun frame-frame GIF mentah jadi gambar utuh per frame (murni, tanpa DOM).
// Sama seperti di pecah-gif-jadi-frame: menghormati disposal 2 dan 3.
export function susunFrame(frames, w, h) {
  const hasil = [];
  let penuh = new Uint8ClampedArray(w * h * 4);
  for (const f of frames) {
    const d = f.dims || { width: w, height: h, top: 0, left: 0 };
    const fw = d.width, fh = d.height, fx = d.left || 0, fy = d.top || 0;
    const simpan = f.disposalType === 3 ? penuh.slice() : null;
    const patch = f.patch;
    if (patch) {
      for (let y = 0; y < fh; y++) {
        const gy = fy + y;
        if (gy < 0 || gy >= h) continue;
        for (let x = 0; x < fw; x++) {
          const gx = fx + x;
          if (gx < 0 || gx >= w) continue;
          const pi = (y * fw + x) * 4;
          if (patch[pi + 3] === 0) continue;
          const gi = (gy * w + gx) * 4;
          penuh[gi] = patch[pi];
          penuh[gi + 1] = patch[pi + 1];
          penuh[gi + 2] = patch[pi + 2];
          penuh[gi + 3] = patch[pi + 3];
        }
      }
    }
    hasil.push(penuh.slice());
    if (f.disposalType === 2) {
      for (let y = 0; y < fh; y++) {
        const gy = fy + y;
        if (gy < 0 || gy >= h) continue;
        for (let x = 0; x < fw; x++) {
          const gx = fx + x;
          if (gx < 0 || gx >= w) continue;
          const gi = (gy * w + gx) * 4;
          penuh[gi + 3] = 0;
        }
      }
    } else if (f.disposalType === 3 && simpan) {
      penuh = simpan;
    }
  }
  return hasil;
}

// Total durasi dari jeda tiap frame (murni, bisa diuji). Jeda di bawah
// 20ms dinaikkan ke 20ms supaya video tidak kelewat cepat.
export function totalDurasi(jedas) {
  return jedas.reduce((s, j) => s + Math.max(20, Number(j) || 100), 0);
}

export function render(root) {
  const fi = fileInput('.gif,image/gif');
  const fmtSel = T.select([['webm', 'WebM (bisa di semua browser)'], ['mp4', 'MP4 (bila browser mendukung)']], 'webm');
  const statusBox = T.out();
  const infoBox = T.out();
  const hasilBox = T.out();

  let gifuctSiap = null;
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

  fi.addEventListener('change', async () => {
    const f = fi.files && fi.files[0];
    if (!f) return;
    fileAsli = f;
    namaFile = (f.name || 'gif').replace(/\.[^.]*$/, '');
    T.hide(hasilBox); T.hide(statusBox);
    T.show(infoBox, `<div class="kv"><span>Ukuran GIF</span><b>${fmtBytes(f.size)}</b></div><p class="dim">Tekan tombolnya untuk mengubah jadi video. Prosesnya memutar GIF sekali penuh, jadi tunggu sampai selesai.</p>`);
    buatB.disabled = false;
  });

  async function buat() {
    if (!fileAsli) { T.toast('Pilih file GIF dulu'); return; }
    if (typeof MediaRecorder === 'undefined' || !HTMLCanvasElement.prototype.captureStream) {
      T.show(statusBox, '<div class="err">Browser ini tidak bisa merekam video dari canvas. Coba browser lain yang lebih baru.</div>');
      return;
    }
    T.hide(hasilBox);
    buatB.disabled = true;
    T.show(statusBox, '<span class="dim">Memuat pembaca GIF… (perlu internet sekali saja)</span>');
    let lib;
    try {
      lib = await muatGifuct();
    } catch (e) {
      T.show(statusBox, '<div class="err">Pembaca GIF gagal dimuat. Cek koneksi internetmu lalu coba lagi.</div> <button class="btn" type="button">Coba lagi</button>');
      statusBox.querySelector('button').addEventListener('click', buat);
      buatB.disabled = false;
      return;
    }
    try {
      T.show(statusBox, '<span class="dim">Membaca GIF…</span>');
      const buf = await fileAsli.arrayBuffer();
      const gif = lib.parseGIF(buf);
      const frames = lib.decompressFrames(gif, true);
      if (!frames.length) throw new Error('tidak ada frame');
      const w = gif.lsd.width, h = gif.lsd.height;
      const pakai = frames.slice(0, MAKS_FRAME);
      const jedas = pakai.map((f) => f.delay);
      let durasi = totalDurasi(jedas);
      let jumlah = pakai.length;
      // GIF yang durasinya kelewat panjang dipotong supaya perekaman tidak menggantung.
      if (durasi > MAKS_DURASI_MS) {
        let akumulasi = 0;
        jumlah = 0;
        for (const j of jedas) {
          akumulasi += Math.max(20, Number(j) || 100);
          if (akumulasi > MAKS_DURASI_MS) break;
          jumlah++;
        }
        jumlah = Math.max(1, jumlah);
        durasi = totalDurasi(jedas.slice(0, jumlah));
      }
      const susun = susunFrame(pakai.slice(0, jumlah), w, h);
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      const ctx = c.getContext('2d');
      // Pilih format yang benar-benar didukung browser ini.
      let mime = '';
      let ekstensi = 'webm';
      if (fmtSel.value === 'mp4' && window.MediaRecorder.isTypeSupported('video/mp4')) {
        mime = 'video/mp4'; ekstensi = 'mp4';
      } else if (fmtSel.value === 'mp4') {
        T.show(statusBox, '<div class="err">Browser ini belum bisa merekam MP4, jadi hasilnya WebM. Videonya tetap bisa diputar di mana saja.</div>');
        await new Promise((r) => setTimeout(r, 1200));
        mime = 'video/webm;codecs=vp9';
        if (!window.MediaRecorder.isTypeSupported(mime)) mime = 'video/webm';
      } else {
        mime = 'video/webm;codecs=vp9';
        if (!window.MediaRecorder.isTypeSupported(mime)) mime = 'video/webm';
      }
      const stream = c.captureStream(30);
      const rekam = new MediaRecorder(stream, mime ? { mimeType: mime, videoBitsPerSecond: 5000000 } : { videoBitsPerSecond: 5000000 });
      const potongan = [];
      rekam.ondataavailable = (e) => { if (e.data && e.data.size) potongan.push(e.data); };
      const selesai = new Promise((res, rej) => {
        rekam.onstop = res;
        rekam.onerror = () => rej(new Error('rekam gagal'));
      });
      // Gambar frame pertama dulu supaya perekam tidak mulai dari hitam.
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
      ctx.putImageData(new ImageData(new Uint8ClampedArray(susun[0]), w, h), 0, 0);
      rekam.start(250);
      const mulai = performance.now();
      const jedaKumulatif = [];
      let ak = 0;
      for (let i = 0; i < jumlah; i++) { jedaKumulatif.push(ak); ak += Math.max(20, Number(jedas[i]) || 100); }
      await new Promise((res) => {
        let idx = 0;
        const langkah = () => {
          const berlalu = performance.now() - mulai;
          while (idx + 1 < jumlah && berlalu >= jedaKumulatif[idx + 1]) idx++;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, w, h);
          ctx.putImageData(new ImageData(new Uint8ClampedArray(susun[idx]), w, h), 0, 0);
          if (berlalu < durasi) {
            T.show(statusBox, `<span class="dim">Merekam video… ${Math.min(100, Math.round((berlalu / durasi) * 100))}%</span>`);
            requestAnimationFrame(langkah);
          } else res();
        };
        requestAnimationFrame(langkah);
      });
      // Beri sedikit waktu supaya frame terakhir ikut terekam.
      await new Promise((r) => setTimeout(r, 300));
      rekam.stop();
      await selesai;
      stream.getTracks().forEach((t) => t.stop());
      const blob = new Blob(potongan, { type: rekam.mimeType || mime || 'video/webm' });
      if (!blob.size) throw new Error('video kosong');
      const url = URL.createObjectURL(blob);
      T.onLeave(() => URL.revokeObjectURL(url));
      T.hide(statusBox);
      T.show(hasilBox, '');
      const vid = document.createElement('video');
      vid.src = url; vid.controls = true; vid.loop = true; vid.playsInline = true;
      vid.style.cssText = 'max-width:100%;height:auto;border-radius:10px;display:block;background:#000';
      hasilBox.appendChild(vid);
      hasilBox.appendChild(T.el(`<p class="dim">Video ${ekstensi.toUpperCase()}, ${fmtBytes(blob.size)}.${jumlah < frames.length ? ' GIF dipotong karena durasinya panjang.' : ''}</p>`));
      hasilBox.appendChild(T.btn('Unduh Video', () => { T.dl(`${namaFile}.${ekstensi}`, blob, blob.type); T.toast('Berhasil diunduh'); }, true));
      T.scrollToPreview(hasilBox);
    } catch (e) {
      T.show(statusBox, '<div class="err">Gagal membuat video. Pastikan filenya GIF asli, lalu coba lagi.</div> <button class="btn" type="button">Coba lagi</button>');
      statusBox.querySelector('button').addEventListener('click', buat);
    } finally {
      buatB.disabled = false;
    }
  }

  const buatB = T.btn('Ubah jadi Video', buat, true, true);

  root.appendChild(T.el(`<p class="note">🔒 ${LOCAL_NOTE}</p>`));
  root.appendChild(T.field('Pilih file GIF', fi));
  root.appendChild(T.field('Format video', fmtSel, 'MP4 lebih luas dipakai, tapi tidak semua browser bisa merekamnya.'));
  root.appendChild(statusBox);
  root.appendChild(infoBox);
  root.appendChild(buatB);
  root.appendChild(hasilBox);
}
