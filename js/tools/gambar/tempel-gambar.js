import { h as T, LOCAL_NOTE, canvasToBlob, fileInput, loadImage } from '../../core.js';

// Tempel Gambar di Atas Gambar: letakkan satu gambar di atas gambar lain
// (logo, stempel, tanda air, atau foto kecil). Posisi bisa dipilih dari
// sembilan titik, digeser halus, diubah ukuran dan transparansinya.
export const meta = {"id": "tempel-gambar", "name": "Tempel Gambar di Atas Gambar", "cat": "gambar", "icon": "🖼️", "desc": "Tempel logo atau gambar kecil di atas foto, atur posisi, ukuran, dan transparansinya.", "keywords": "overlay,tempel,logo,watermark,tanda air,lapis,gambar di atas gambar", "since": "6.19.0"};

// Hitung posisi dan ukuran tempelan di atas gambar dasar.
// posisi: 'kiriatas'|'tengah-atash'|'kananatas'|'kiritengah'|'tengah'|'kanantengah'|'kiribawah'|'tengah-bawah'|'kananbawah'.
// skala: lebar tempelan sebagai persen lebar dasar (1-100).
// geserX/geserY: geseran piksel dari titik posisi. Fungsi murni.
export function hitungPosisiTempel(dasarW, dasarH, tempelW, tempelH, posisi, skala, geserX, geserY) {
  const s = Math.max(1, Math.min(100, skala)) / 100;
  const w = Math.max(1, Math.round(dasarW * s));
  const h = Math.max(1, Math.round(w * tempelH / tempelW));
  const margin = Math.round(dasarW * 0.03);
  let x, y;
  if (posisi.includes('kiri')) x = margin;
  else if (posisi.includes('kanan')) x = dasarW - w - margin;
  else x = Math.round((dasarW - w) / 2);
  if (posisi.includes('atas')) y = margin;
  else if (posisi.includes('bawah')) y = dasarH - h - margin;
  else y = Math.round((dasarH - h) / 2);
  return { x: x + (geserX || 0), y: y + (geserY || 0), lebar: w, tinggi: h };
}

const POSISI = [
  ['kiriatas', 'Kiri atas'], ['tengah-atas', 'Tengah atas'], ['kananatas', 'Kanan atas'],
  ['kiritengah', 'Kiri tengah'], ['tengah', 'Tengah'], ['kanantengah', 'Kanan tengah'],
  ['kiribawah', 'Kiri bawah'], ['tengah-bawah', 'Tengah bawah'], ['kananbawah', 'Kanan bawah'],
];

export function render(root) {
  const fiDasar = fileInput('image/*');
  const fiTempel = fileInput('image/*');
  const posisiSel = T.select(POSISI, 'kananbawah');
  const skalaR = T.input('range'); skalaR.min = '5'; skalaR.max = '100'; skalaR.value = '25';
  const skalaV = T.el('<b>25%</b>');
  const opasitasR = T.input('range'); opasitasR.min = '10'; opasitasR.max = '100'; opasitasR.value = '100';
  const opasitasV = T.el('<b>100%</b>');
  const geserXR = T.input('range'); geserXR.min = '-200'; geserXR.max = '200'; geserXR.value = '0';
  const geserXV = T.el('<b>0 px</b>');
  const geserYR = T.input('range'); geserYR.min = '-200'; geserYR.max = '200'; geserYR.value = '0';
  const geserYV = T.el('<b>0 px</b>');
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'max-width:100%;height:auto;border-radius:12px;display:block;margin:12px auto';
  const statusBox = T.out();
  const hasilBox = T.out();
  let dasar = null, tempel = null, nama = 'foto';

  function bacaPengaturan() {
    return {
      posisi: posisiSel.value,
      skala: parseInt(skalaR.value, 10),
      opasitas: parseInt(opasitasR.value, 10) / 100,
      gx: parseInt(geserXR.value, 10),
      gy: parseInt(geserYR.value, 10),
    };
  }

  function gambarKe(ctx, W, H) {
    ctx.drawImage(dasar, 0, 0, W, H);
    const p = bacaPengaturan();
    const pos = hitungPosisiTempel(W, H, tempel.naturalWidth, tempel.naturalHeight, p.posisi, p.skala, p.gx, p.gy);
    ctx.save();
    ctx.globalAlpha = p.opasitas;
    ctx.drawImage(tempel, pos.x, pos.y, pos.lebar, pos.tinggi);
    ctx.restore();
    return pos;
  }

  function gambar() {
    if (!dasar || !tempel) return;
    const skala = Math.min(1, 360 / dasar.naturalWidth);
    canvas.width = Math.max(1, Math.round(dasar.naturalWidth * skala));
    canvas.height = Math.max(1, Math.round(dasar.naturalHeight * skala));
    const ctx = canvas.getContext('2d');
    const p = bacaPengaturan();
    const pos = hitungPosisiTempel(canvas.width, canvas.height, tempel.naturalWidth, tempel.naturalHeight, p.posisi, p.skala, Math.round(p.gx * skala), Math.round(p.gy * skala));
    ctx.drawImage(dasar, 0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.globalAlpha = p.opasitas;
    ctx.drawImage(tempel, pos.x, pos.y, pos.lebar, pos.tinggi);
    ctx.restore();
  }

  const segarkan = () => gambar();
  posisiSel.addEventListener('change', segarkan);
  skalaR.addEventListener('input', () => { skalaV.textContent = skalaR.value + '%'; segarkan(); });
  opasitasR.addEventListener('input', () => { opasitasV.textContent = opasitasR.value + '%'; segarkan(); });
  geserXR.addEventListener('input', () => { geserXV.textContent = geserXR.value + ' px'; segarkan(); });
  geserYR.addEventListener('input', () => { geserYV.textContent = geserYR.value + ' px'; segarkan(); });

  const dlB = T.btn('Unduh hasil (PNG)', async () => {
    if (!dasar || !tempel) { T.toast('Pilih kedua gambar dulu.'); return; }
    const c = document.createElement('canvas');
    c.width = dasar.naturalWidth; c.height = dasar.naturalHeight;
    const ctx = c.getContext('2d');
    gambarKe(ctx, c.width, c.height);
    const blob = await canvasToBlob(c, 'image/png');
    if (!blob) { T.toast('Gagal membuat PNG.'); return; }
    T.dl(`${nama}-tempel.png`, blob, 'image/png');
  }, true);

  async function muat(file, mana) {
    T.show(statusBox, '<span class="dim">Membuka gambar…</span>');
    try {
      const img = await loadImage(file);
      if (mana === 'dasar') {
        dasar = img;
        nama = (file.name || 'foto').replace(/\.[^.]+$/, '').replace(/[^\w\- ]+/g, '').trim() || 'foto';
      } else tempel = img;
      T.hide(statusBox);
      if (dasar && tempel) {
        T.show(hasilBox, '');
        hasilBox.appendChild(canvas);
        hasilBox.appendChild(dlB);
        gambar();
      } else {
        T.show(statusBox, `<span class="dim">${dasar ? 'Foto dasar terpilih. Sekarang pilih gambar tempelannya.' : 'Gambar tempelan terpilih. Sekarang pilih foto dasarnya.'}</span>`);
      }
    } catch (e) {
      T.show(statusBox, '<div class="err">Gambar tidak bisa dibuka. Coba file gambar lain (JPG, PNG, atau WebP).</div>');
    }
  }

  fiDasar.addEventListener('change', () => { const f = fiDasar.files && fiDasar.files[0]; if (f) muat(f, 'dasar'); fiDasar.value = ''; });
  fiTempel.addEventListener('change', () => { const f = fiTempel.files && fiTempel.files[0]; if (f) muat(f, 'tempel'); fiTempel.value = ''; });

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Pilih foto dasar, lalu gambar yang ditempel di atasnya. Gambar tempelan berformat PNG dengan latar transparan paling bagus hasilnya (misalnya logo).</p>'));
  root.appendChild(T.field('Foto dasar', fiDasar));
  root.appendChild(T.field('Gambar tempelan (logo / stempel)', fiTempel));
  root.appendChild(T.field('Posisi tempelan', posisiSel));
  root.appendChild(T.field('Ukuran tempelan', T.row(skalaR, skalaV), 'Persen dari lebar foto dasar.'));
  root.appendChild(T.field('Transparansi', T.row(opasitasR, opasitasV), '100% = tempelan jelas, makin kecil makin samar.'));
  root.appendChild(T.field('Geser kiri-kanan', T.row(geserXR, geserXV)));
  root.appendChild(T.field('Geser atas-bawah', T.row(geserYR, geserYV)));
  root.appendChild(statusBox);
  root.appendChild(hasilBox);
  root.appendChild(T.el('<p class="dim" style="font-size:12px">' + LOCAL_NOTE + '</p>'));
}
