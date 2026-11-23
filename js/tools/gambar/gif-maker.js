import { h as T, loadImage, fileInput, canvasToBlob, fmtBytes, LOCAL_NOTE } from '../../core.js';

// GIF Maker: buat GIF animasi dari beberapa foto. Urutan bisa diubah,
// kecepatan bisa diatur. Encoder-nya gifenc (murni JavaScript, tanpa
// worker): tiap foto di-quantize jadi palet 256 warna lalu ditulis
// sebagai frame GIF89a dengan loop selamanya (NETSCAPE2.0).
export const meta = {"id": "gif-maker", "name": "GIF Maker", "cat": "gambar", "icon": "🎞️", "desc": "Gabung beberapa foto jadi GIF bergerak, atur urutan dan kecepatannya.", "keywords": "gif,animasi,foto bergerak,meme,frames", "since": "6.16.0", "online": true};

const GIFENC_CDN = 'https://cdn.jsdelivr.net/npm/gifenc@1.0.3/dist/gifenc.esm.js';
const MAKS_FOTO = 20;

export function render(root) {
  const fi = fileInput('image/*');
  fi.multiple = true;
  const kecepatan = T.input('range');
  kecepatan.min = '100'; kecepatan.max = '2000'; kecepatan.step = '100'; kecepatan.value = '500';
  const kecepatanVal = T.el('<b>0,5 detik per foto</b>');
  const lebarSel = T.select([['480', 'Sedang (lebar 480)'], ['320', 'Kecil (lebar 320)'], ['asli', 'Ukuran asli foto']], '480');
  const box = T.out();
  const statusBox = T.out();
  const hasilBox = T.out();

  let daftar = []; // [{file, img, nama, url}]
  let gifencSiap = null;

  const muatGifenc = () => {
    if (!gifencSiap) {
      gifencSiap = import(/* @vite-ignore */ GIFENC_CDN).then((m) => {
        if (typeof m.GIFEncoder !== 'function' || typeof m.quantize !== 'function' || typeof m.applyPalette !== 'function') {
          throw new Error('api gifenc tidak lengkap');
        }
        return m;
      }).catch((e) => { gifencSiap = null; throw e; });
    }
    return gifencSiap;
  };

  kecepatan.addEventListener('input', () => {
    const ms = parseInt(kecepatan.value, 10);
    kecepatanVal.textContent = (ms / 1000).toString().replace('.', ',') + ' detik per foto';
  });

  function gambarDaftar() {
    T.show(box, '');
    if (!daftar.length) {
      box.appendChild(T.el('<p class="dim">Belum ada foto. Pilih minimal 2 foto untuk dibuat GIF.</p>'));
      return;
    }
    daftar.forEach((item, i) => {
      const baris = T.el('<div class="row" style="align-items:center;justify-content:space-between"></div>');
      const kiri = T.el('<div style="display:flex;gap:10px;align-items:center;min-width:0"></div>');
      const thumb = document.createElement('img');
      thumb.src = item.url; thumb.alt = item.nama;
      thumb.style.cssText = 'width:56px;height:56px;object-fit:cover;border-radius:8px;flex:none';
      const nama = T.el(`<div style="word-break:break-word"><b>${i + 1}. ${T.esc(item.nama)}</b><div class="dim" style="font-size:12px">${item.img.naturalWidth}×${item.img.naturalHeight}</div></div>`);
      kiri.appendChild(thumb); kiri.appendChild(nama);
      const tombol = T.el('<div style="display:flex;gap:6px;flex:none"></div>');
      const naikB = T.btn('↑', () => { if (i > 0) { const t = daftar[i - 1]; daftar[i - 1] = daftar[i]; daftar[i] = t; gambarDaftar(); } }, false, i === 0);
      const turunB = T.btn('↓', () => { if (i < daftar.length - 1) { const t = daftar[i + 1]; daftar[i + 1] = daftar[i]; daftar[i] = t; gambarDaftar(); } }, false, i === daftar.length - 1);
      const hapusB = T.btn('Hapus', () => { URL.revokeObjectURL(daftar[i].url); daftar.splice(i, 1); gambarDaftar(); });
      [naikB, turunB, hapusB].forEach((b) => { b.classList.add('small'); tombol.appendChild(b); });
      baris.appendChild(kiri); baris.appendChild(tombol);
      box.appendChild(baris);
    });
  }

  fi.addEventListener('change', async () => {
    const files = [...(fi.files || [])];
    if (!files.length) return;
    T.hide(hasilBox); T.hide(statusBox);
    const sisa = MAKS_FOTO - daftar.length;
    if (sisa <= 0) { T.toast(`Maksimal ${MAKS_FOTO} foto`); fi.value = ''; return; }
    const batch = files.slice(0, sisa);
    T.show(statusBox, '<span class="dim">Membuka foto…</span>');
    let gagal = 0;
    for (const f of batch) {
      try {
        const img = await loadImage(f);
        daftar.push({ file: f, img, nama: f.name || 'foto', url: URL.createObjectURL(f) });
      } catch (e) { gagal++; }
    }
    T.hide(statusBox);
    if (gagal) T.toast(`${gagal} foto tidak bisa dibuka, dilewati`);
    if (files.length > batch.length) T.toast(`Hanya ${batch.length} foto pertama yang dipakai (maksimal ${MAKS_FOTO})`);
    fi.value = '';
    buatB.disabled = daftar.length < 2;
    gambarDaftar();
  });

  async function buat() {
    if (daftar.length < 2) { T.toast('Pilih minimal 2 foto dulu'); return; }
    T.hide(hasilBox);
    buatB.disabled = true;
    T.show(statusBox, '<span class="dim">Memuat pembuat GIF… (perlu internet sekali saja)</span>');
    let lib;
    try {
      lib = await muatGifenc();
    } catch (e) {
      T.show(statusBox, '<div class="err">Pembuat GIF gagal dimuat. Cek koneksi internetmu lalu coba lagi.</div> <button class="btn" type="button">Coba lagi</button>');
      statusBox.querySelector('button').addEventListener('click', buat);
      buatB.disabled = false;
      return;
    }
    const delay = parseInt(kecepatan.value, 10);
    const targetLebar = lebarSel.value === 'asli' ? null : parseInt(lebarSel.value, 10);
    // Semua frame disamakan ke ukuran frame pertama (GIF butuh ukuran sama).
    const pertama = daftar[0].img;
    const skala = targetLebar ? Math.min(1, targetLebar / pertama.naturalWidth) : 1;
    const W = Math.max(2, Math.round(pertama.naturalWidth * skala));
    const H = Math.max(2, Math.round(pertama.naturalHeight * skala));
    try {
      const gif = lib.GIFEncoder();
      const c = document.createElement('canvas');
      c.width = W; c.height = H;
      const ctx = c.getContext('2d', { willReadFrequently: true });
      for (let i = 0; i < daftar.length; i++) {
        T.show(statusBox, `<span class="dim">Membuat GIF… foto ${i + 1} dari ${daftar.length}</span>`);
        // Beri napas ke UI antar frame supaya status sempat tampil.
        await new Promise((r) => setTimeout(r, 0));
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, W, H);
        ctx.drawImage(daftar[i].img, 0, 0, W, H);
        const data = ctx.getImageData(0, 0, W, H).data;
        const palet = lib.quantize(data, 256);
        const indeks = lib.applyPalette(data, palet);
        gif.writeFrame(indeks, W, H, { palette: palet, delay });
      }
      gif.finish();
      const bytes = gif.bytes();
      const blob = new Blob([bytes], { type: 'image/gif' });
      const url = URL.createObjectURL(blob);
      T.onLeave(() => URL.revokeObjectURL(url));
      T.hide(statusBox);
      T.show(hasilBox, '');
      const im = document.createElement('img');
      im.src = url; im.alt = 'GIF hasil';
      im.style.cssText = 'max-width:100%;height:auto;border-radius:10px;display:block';
      hasilBox.appendChild(im);
      hasilBox.appendChild(T.el(`<p class="dim">${daftar.length} foto, ${fmtBytes(blob.size)}.</p>`));
      hasilBox.appendChild(T.btn('Unduh GIF', () => { T.dl('animasi.gif', blob, 'image/gif'); T.toast('Berhasil diunduh'); }, true));
      T.scrollToPreview(hasilBox);
    } catch (e) {
      T.show(statusBox, '<div class="err">Gagal membuat GIF. Coba kurangi jumlah foto atau pilih ukuran lebih kecil.</div> <button class="btn" type="button">Coba lagi</button>');
      statusBox.querySelector('button').addEventListener('click', buat);
    } finally {
      buatB.disabled = daftar.length < 2;
    }
  }

  const buatB = T.btn('Buat GIF', buat, true, true);
  const tambahB = T.btn('Tambah Foto Lagi', () => fi.click());

  root.appendChild(T.el(`<p class="note">🔒 ${LOCAL_NOTE}</p>`));
  root.appendChild(T.field('Pilih foto (bisa banyak sekaligus)', fi, `Minimal 2, maksimal ${MAKS_FOTO} foto. Urutannya bisa diubah di bawah.`));
  root.appendChild(T.field('Kecepatan', (() => { const d = T.el('<div class="row" style="align-items:center"></div>'); d.appendChild(kecepatan); d.appendChild(kecepatanVal); return d; })(), 'Makin kecil angkanya, makin cepat geraknya.'));
  root.appendChild(T.field('Ukuran GIF', lebarSel, 'Ukuran asli bikin file GIF besar.'));
  root.appendChild(statusBox);
  root.appendChild(box);
  root.appendChild(T.row(tambahB, buatB));
  root.appendChild(hasilBox);
  gambarDaftar();
}
