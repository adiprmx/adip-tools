import { h as T, loadImage, fileInput, canvasToBlob, LOCAL_NOTE } from '../../core.js';

// Banding Foto: bandingkan dua foto. Mode geser menampilkan foto pertama
// dan kedua berdampingan dengan garis yang bisa diseret; mode sorot beda
// menandai piksel yang warnanya berbeda.
export const meta = {"id": "banding-foto", "name": "Banding Foto", "cat": "gambar", "icon": "🔀", "desc": "Bandingkan dua foto: geser garis pembanding, atau sorot bagian yang berbeda.", "keywords": "banding foto,bandingkan,perbandingan,sebelum sesudah,beda piksel,diff", "since": "6.18.0"};

// Hitung berapa piksel yang berbeda (selisih kanal terbesar > ambang).
// Murni, bisa diuji tanpa DOM.
export function hitungBeda(dataA, dataB, ambang) {
  const n = Math.min(dataA.length, dataB.length);
  let beda = 0;
  const total = Math.floor(n / 4);
  for (let i = 0; i < n; i += 4) {
    const d = Math.max(
      Math.abs(dataA[i] - dataB[i]),
      Math.abs(dataA[i + 1] - dataB[i + 1]),
      Math.abs(dataA[i + 2] - dataB[i + 2]),
    );
    if (d > ambang) beda++;
  }
  return { beda, total, persen: total ? (beda / total) * 100 : 0 };
}

// Buat gambar sorotan beda: piksel yang berbeda jadi coral terang, sisanya
// abu-abu redup. Murni, bisa diuji tanpa DOM.
export function buatGambarBeda(dataA, dataB, ambang) {
  const n = Math.min(dataA.length, dataB.length);
  const keluar = new Uint8ClampedArray(n);
  for (let i = 0; i < n; i += 4) {
    const d = Math.max(
      Math.abs(dataA[i] - dataB[i]),
      Math.abs(dataA[i + 1] - dataB[i + 1]),
      Math.abs(dataA[i + 2] - dataB[i + 2]),
    );
    if (d > ambang) {
      keluar[i] = 255; keluar[i + 1] = 111; keluar[i + 2] = 97; keluar[i + 3] = 255;
    } else {
      const abu = Math.round((0.299 * dataA[i] + 0.587 * dataA[i + 1] + 0.114 * dataA[i + 2]) * 0.35);
      keluar[i] = abu; keluar[i + 1] = abu; keluar[i + 2] = abu; keluar[i + 3] = 255;
    }
  }
  return keluar;
}

export function render(root) {
  const fiA = fileInput('image/*');
  const fiB = fileInput('image/*');
  const modeSel = T.select([['geser', 'Geser pembanding (sebelum/sesudah)'], ['beda', 'Sorot bagian yang berbeda']], 'geser');
  const fmtSel = T.select([['png', 'PNG (tanpa pecah)'], ['jpeg', 'JPG (ukuran kecil)']], 'png');
  const statusBox = T.out();
  const box = T.out();
  const infoBox = T.out();

  const posR = T.input('range');
  posR.min = '0'; posR.max = '100'; posR.value = '50';
  const posV = T.el('<b>50%</b>');
  const posWrap = T.el('<div class="row" style="align-items:center"></div>');
  posWrap.appendChild(posR); posWrap.appendChild(posV);
  const posField = T.field('Posisi garis', posWrap, 'Kiri foto pertama, kanan foto kedua. Garisnya juga bisa diseret langsung di foto.');

  const ambR = T.input('range');
  ambR.min = '0'; ambR.max = '100'; ambR.value = '30';
  const ambV = T.el('<b>30</b>');
  const ambWrap = T.el('<div class="row" style="align-items:center"></div>');
  ambWrap.appendChild(ambR); ambWrap.appendChild(ambV);
  const ambField = T.field('Seberapa beda baru disorot', ambWrap, 'Nilai kecil menyorot beda halus, nilai besar hanya menyorot beda yang jelas.');
  ambField.hidden = true;

  const kanvas = document.createElement('canvas');
  kanvas.style.cssText = 'max-width:100%;height:auto;border-radius:10px;display:block;touch-action:none;cursor:ew-resize';
  let ctx = null;
  let offA = null, offB = null; // canvas foto A dan B (ukuran kerja sama)
  let dataA = null, dataB = null;
  let W = 0, H = 0;
  let namaFile = 'banding-foto';
  let sedangSeret = false;

  function muatKeKanvas(img, w, h) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    c.getContext('2d').drawImage(img, 0, 0, w, h);
    return c;
  }

  function gambar() {
    if (!offA || !offB || !ctx) return;
    if (modeSel.value === 'beda') {
      const ambang = parseInt(ambR.value, 10);
      const hasil = buatGambarBeda(dataA.data, dataB.data, ambang);
      const imgData = new ImageData(new Uint8ClampedArray(hasil), W, H);
      ctx.putImageData(imgData, 0, 0);
      const s = hitungBeda(dataA.data, dataB.data, ambang);
      T.show(infoBox, '<span class="dim">' + s.persen.toFixed(1).replace('.', ',') + '% piksel berbeda (' + T.fmt(s.beda) + ' dari ' + T.fmt(s.total) + ' piksel)</span>');
      return;
    }
    T.hide(infoBox);
    const x = Math.round((parseInt(posR.value, 10) / 100) * W);
    ctx.drawImage(offA, 0, 0);
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, 0, W - x, H);
    ctx.clip();
    ctx.drawImage(offB, 0, 0);
    ctx.restore();
    ctx.fillStyle = '#ff6f61';
    ctx.fillRect(x - 1, 0, 2, H);
    ctx.beginPath();
    ctx.arc(x, H / 2, 16, 0, Math.PI * 2);
    ctx.fillStyle = '#ff6f61';
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('‹ ›', x, H / 2 + 1);
  }

  function aturPosDariEvent(e) {
    const r = kanvas.getBoundingClientRect();
    const cx = (e.touches && e.touches[0] ? e.touches[0] : e).clientX;
    const p = Math.max(0, Math.min(100, Math.round(((cx - r.left) / r.width) * 100)));
    posR.value = String(p);
    posV.textContent = p + '%';
    gambar();
  }
  kanvas.addEventListener('pointerdown', (e) => {
    if (modeSel.value !== 'geser' || !offA) return;
    sedangSeret = true;
    try { kanvas.setPointerCapture(e.pointerId); } catch (err) {}
    aturPosDariEvent(e);
  });
  kanvas.addEventListener('pointermove', (e) => { if (sedangSeret) aturPosDariEvent(e); });
  kanvas.addEventListener('pointerup', () => { sedangSeret = false; });
  kanvas.addEventListener('pointercancel', () => { sedangSeret = false; });

  posR.addEventListener('input', () => { posV.textContent = posR.value + '%'; gambar(); });
  ambR.addEventListener('input', () => { ambV.textContent = ambR.value; gambar(); });
  modeSel.addEventListener('change', () => {
    const beda = modeSel.value === 'beda';
    posField.hidden = beda;
    ambField.hidden = !beda;
    kanvas.style.cursor = beda ? 'default' : 'ew-resize';
    gambar();
  });

  async function muatUlang() {
    const fA = fiA.files && fiA.files[0];
    const fB = fiB.files && fiB.files[0];
    if (!fA || !fB) return;
    T.hide(box); T.hide(infoBox);
    T.show(statusBox, '<span class="dim">Membuka kedua foto…</span>');
    try {
      const [imgA, imgB] = await Promise.all([loadImage(fA), loadImage(fB)]);
      namaFile = (fA.name || 'foto').replace(/\.[^.]*$/, '');
      const skala = Math.min(1, 1200 / Math.max(imgA.naturalWidth, imgA.naturalHeight));
      W = Math.max(1, Math.round(imgA.naturalWidth * skala));
      H = Math.max(1, Math.round(imgA.naturalHeight * skala));
      offA = muatKeKanvas(imgA, W, H);
      offB = muatKeKanvas(imgB, W, H);
      const cA = offA.getContext('2d', { willReadFrequently: true });
      const cB = offB.getContext('2d', { willReadFrequently: true });
      dataA = cA.getImageData(0, 0, W, H);
      dataB = cB.getImageData(0, 0, W, H);
      kanvas.width = W; kanvas.height = H;
      ctx = kanvas.getContext('2d');
      T.hide(statusBox);
      T.show(box, '');
      box.appendChild(kanvas);
      unduhB.disabled = false;
      gambar();
    } catch (e) {
      offA = null; offB = null;
      T.show(statusBox, '<div class="err">Salah satu foto tidak bisa dibuka. Pastikan keduanya gambar yang benar (JPG/PNG/WebP).</div>');
      unduhB.disabled = true;
    }
  }
  fiA.addEventListener('change', muatUlang);
  fiB.addEventListener('change', muatUlang);

  async function unduh() {
    if (!offA || !offB) { T.toast('Pilih kedua foto dulu'); return; }
    unduhB.disabled = true;
    T.show(statusBox, '<span class="dim">Menyiapkan hasil…</span>');
    try {
      const mime = fmtSel.value === 'png' ? 'image/png' : 'image/jpeg';
      let sumber = kanvas;
      if (mime === 'image/jpeg') {
        const putih = document.createElement('canvas');
        putih.width = W; putih.height = H;
        const px = putih.getContext('2d');
        px.fillStyle = '#ffffff'; px.fillRect(0, 0, W, H);
        px.drawImage(kanvas, 0, 0);
        sumber = putih;
      }
      const blob = await canvasToBlob(sumber, mime, 0.92);
      if (!blob) throw new Error('gagal');
      T.dl(`${namaFile}-banding.${fmtSel.value === 'png' ? 'png' : 'jpg'}`, blob, mime);
      T.toast('Berhasil diunduh');
    } catch (e) {
      T.toast('Gagal membuat hasil, coba lagi');
    } finally {
      T.hide(statusBox);
      unduhB.disabled = false;
    }
  }

  const unduhB = T.btn('Unduh Hasil', unduh, true, true);

  root.appendChild(T.el(`<p class="note">🔒 ${LOCAL_NOTE}</p>`));
  root.appendChild(T.field('Foto pertama', fiA));
  root.appendChild(T.field('Foto kedua', fiB));
  root.appendChild(T.field('Cara membandingkan', modeSel));
  root.appendChild(posField);
  root.appendChild(ambField);
  root.appendChild(T.field('Format hasil', fmtSel));
  root.appendChild(statusBox);
  root.appendChild(box);
  root.appendChild(infoBox);
  root.appendChild(T.row(unduhB));
  root.appendChild(T.el('<p class="hint">Foto kedua menyesuaikan ukuran foto pertama supaya perbandingannya sejajar.</p>'));
}
