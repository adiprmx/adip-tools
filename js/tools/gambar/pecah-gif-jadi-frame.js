import { h as T, fileInput, fmtBytes, LOCAL_NOTE } from '../../core.js';

// Pecah GIF jadi Frame: ekstrak semua frame GIF animasi jadi gambar PNG
// satu per satu, bisa diunduh satuan atau sekaligus dalam ZIP.
// Pembaca GIF-nya gifuct-js (parser GIF murni JavaScript). Tiap frame
// disusun lengkap (bukan potongan mentah), jadi gambarnya utuh.
export const meta = {"id": "pecah-gif-jadi-frame", "name": "Pecah GIF jadi Frame", "cat": "gambar", "icon": "🎞️", "desc": "Ambil semua gambar di dalam GIF animasi, unduh satu per satu atau sekaligus.", "keywords": "gif,frame,ekstrak,animasi,pecah gif,gambar", "since": "6.17.0"};

const GIFUCT_CDN = 'https://esm.sh/gifuct-js@2.1.2';
const ZIP_CDN = 'https://cdn.jsdelivr.net/npm/jszip@3.10.2/dist/jszip.min.js';
const MAKS_FRAME = 300;

// Susun frame-frame GIF mentah jadi gambar utuh per frame (murni, tanpa DOM).
// frames: hasil decompressFrames gifuct-js ({dims, patch, disposalType}).
// Menghormati disposal: 2 = bersihkan area frame sesudahnya, 3 = kembali
// ke gambar sebelum frame ini. Return array Uint8ClampedArray RGBA ukuran w*h.
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
          if (patch[pi + 3] === 0) continue; // piksel transparan: biarkan yang lama
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

export function render(root) {
  const fi = fileInput('.gif,image/gif');
  const statusBox = T.out();
  const infoBox = T.out();
  const daftarBox = T.out();

  let gifuctSiap = null;
  let zipSiap = null;
  let namaFile = 'gif';
  let gambarFrame = []; // [{blob, url, w, h}]

  const muatGifuct = () => {
    if (!gifuctSiap) {
      gifuctSiap = import(/* @vite-ignore */ GIFUCT_CDN).then((m) => {
        if (typeof m.parseGIF !== 'function' || typeof m.decompressFrames !== 'function') {
          throw new Error('api gifuct tidak lengkap');
        }
        return m;
      }).catch((e) => { gifuctSiap = null; throw e; });
    }
    return gifuctSiap;
  };
  const muatZip = () => {
    if (!zipSiap) zipSiap = T.loadScript(ZIP_CDN).then((ok) => ok && typeof window.JSZip === 'function');
    return zipSiap;
  };

  function gambarDaftar() {
    T.show(daftarBox, '');
    if (!gambarFrame.length) {
      daftarBox.appendChild(T.el('<p class="dim">Belum ada GIF yang dibuka.</p>'));
      return;
    }
    gambarFrame.forEach((g, i) => {
      const baris = T.el('<div class="row" style="align-items:center;justify-content:space-between"></div>');
      const kiri = T.el('<div style="display:flex;gap:10px;align-items:center;min-width:0"></div>');
      const thumb = document.createElement('img');
      thumb.src = g.url; thumb.alt = 'Frame ' + (i + 1);
      thumb.style.cssText = 'width:64px;height:64px;object-fit:contain;border-radius:8px;flex:none;background-image:linear-gradient(45deg,#3a332c 25%,transparent 25%),linear-gradient(-45deg,#3a332c 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#3a332c 75%),linear-gradient(-45deg,transparent 75%,#3a332c 75%);background-size:12px 12px;background-color:#221e19';
      const nama = T.el(`<div style="word-break:break-word"><b>Frame ${i + 1}</b><div class="dim" style="font-size:12px">${g.w} × ${g.h}, ${fmtBytes(g.blob.size)}</div></div>`);
      kiri.appendChild(thumb); kiri.appendChild(nama);
      const unduhB = T.btn('Unduh', () => { T.dl(`${namaFile}-frame-${String(i + 1).padStart(3, '0')}.png`, g.blob, 'image/png'); }, false);
      unduhB.classList.add('small');
      baris.appendChild(kiri); baris.appendChild(unduhB);
      daftarBox.appendChild(baris);
    });
  }

  fi.addEventListener('change', async () => {
    const f = fi.files && fi.files[0];
    if (!f) return;
    T.hide(infoBox); T.hide(daftarBox);
    gambarFrame.forEach((g) => URL.revokeObjectURL(g.url));
    gambarFrame = [];
    zipB.disabled = true;
    namaFile = (f.name || 'gif').replace(/\.[^.]*$/, '');
    T.show(statusBox, '<span class="dim">Memuat pembaca GIF… (perlu internet sekali saja)</span>');
    let lib;
    try {
      lib = await muatGifuct();
    } catch (e) {
      T.show(statusBox, '<div class="err">Pembaca GIF gagal dimuat. Cek koneksi internetmu lalu coba lagi.</div>');
      return;
    }
    try {
      T.show(statusBox, '<span class="dim">Membaca GIF…</span>');
      const buf = await f.arrayBuffer();
      const gif = lib.parseGIF(buf);
      const frames = lib.decompressFrames(gif, true);
      if (!frames.length) throw new Error('tidak ada frame');
      const w = gif.lsd.width, h = gif.lsd.height;
      const pakai = frames.slice(0, MAKS_FRAME);
      const susun = susunFrame(pakai, w, h);
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      const ctx = c.getContext('2d');
      for (let i = 0; i < susun.length; i++) {
        const imgData = new ImageData(new Uint8ClampedArray(susun[i]), w, h);
        ctx.putImageData(imgData, 0, 0);
        const blob = await new Promise((res) => c.toBlob(res, 'image/png'));
        if (!blob) continue;
        gambarFrame.push({ blob, url: URL.createObjectURL(blob), w, h });
        if (i % 10 === 9) {
          T.show(statusBox, `<span class="dim">Membuat gambar… frame ${i + 1} dari ${susun.length}</span>`);
          await new Promise((r) => setTimeout(r, 0));
        }
      }
      T.hide(statusBox);
      const lebih = frames.length > MAKS_FRAME ? ` Hanya ${MAKS_FRAME} frame pertama yang diambil.` : '';
      T.show(infoBox, `<div class="kv"><span>Jumlah frame</span><b>${frames.length}</b></div><div class="kv"><span>Ukuran GIF</span><b>${w} × ${h}</b></div>${lebih ? `<p class="dim">${lebih}</p>` : ''}`);
      gambarDaftar();
      zipB.disabled = gambarFrame.length === 0;
      T.scrollToPreview(daftarBox);
    } catch (e) {
      T.show(statusBox, '<div class="err">File ini bukan GIF yang bisa dibaca. Pastikan filenya GIF asli.</div>');
    }
  });

  async function unduhZip() {
    if (!gambarFrame.length) { T.toast('Belum ada frame'); return; }
    zipB.disabled = true;
    T.show(statusBox, '<span class="dim">Menyiapkan ZIP…</span>');
    try {
      const ok = await muatZip();
      if (!ok) throw new Error('zip gagal dimuat');
      const zip = new window.JSZip();
      for (let i = 0; i < gambarFrame.length; i++) {
        zip.file(`${namaFile}-frame-${String(i + 1).padStart(3, '0')}.png`, gambarFrame[i].blob);
      }
      const blob = await zip.generateAsync({ type: 'blob' });
      T.dl(`${namaFile}-semua-frame.zip`, blob, 'application/zip');
      T.toast('Berhasil diunduh');
    } catch (e) {
      T.toast('Gagal membuat ZIP, coba lagi');
    } finally {
      T.hide(statusBox);
      zipB.disabled = gambarFrame.length === 0;
    }
  }

  const zipB = T.btn('Unduh Semua (ZIP)', unduhZip, true, true);

  root.appendChild(T.el(`<p class="note">🔒 ${LOCAL_NOTE}</p>`));
  root.appendChild(T.field('Pilih file GIF', fi, 'GIF animasi dengan banyak gambar di dalamnya.'));
  root.appendChild(statusBox);
  root.appendChild(infoBox);
  root.appendChild(daftarBox);
  root.appendChild(zipB);
  gambarDaftar();
}
