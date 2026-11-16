import { h as T, utils, fileInput, loadImage, canvasToBlob, LOCAL_NOTE } from '../../core.js?v=6.12.2';

// Logika murni (bisa di-test di Node): rata-rata warna dari piksel (data RGBA).
utils.warnaRataRata = function (data) {
  let r = 0, g = 0, b = 0, n = 0;
  for (let i = 0; i < data.length; i += 4) { r += data[i]; g += data[i + 1]; b += data[i + 2]; n++; }
  if (n === 0) return [30, 30, 30];
  return [Math.round(r / n), Math.round(g / n), Math.round(b / n)];
};
utils.rgbKeHex = function (rgb) {
  return '#' + rgb.map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('');
};

export const meta = {"id": "kartu-lirik", "name": "Kartu Lirik Lagu", "cat": "musik", "icon": "🎵", "desc": "Buat kartu lirik lagu 9:16 untuk dibagikan ke status.", "keywords": "lirik,lagu,musik,kartu,story,status,spotify,quote", "since": "6.11.0"};

export function render(root) {
  const judul = T.input('text', 'Contoh: Laskar Pelangi', '');
  const artis = T.input('text', 'Contoh: Nidji', '');
  const lirik = T.ta(5, 'Tulis lirik yang mau ditampilkan, satu baris per baris lirik.', '');
  const fileI = fileInput('image/*');
  const box = T.out();
  const kanvas = document.createElement('canvas');
  kanvas.style.cssText = 'width:100%;max-width:360px;height:auto;display:block;border-radius:12px;margin:12px auto 0';
  let sampul = null;
  let warnaLatar = '#141414';

  fileI.addEventListener('change', async () => {
    const f = fileI.files && fileI.files[0];
    if (!f) { sampul = null; return; }
    try { sampul = await loadImage(f); }
    catch (e) { T.toast('File bukan gambar yang valid'); sampul = null; return; }
    // Ambil warna dominan sampul untuk latar kartu.
    try {
      const tmp = document.createElement('canvas');
      tmp.width = 32; tmp.height = 32;
      const tctx = tmp.getContext('2d');
      tctx.drawImage(sampul, 0, 0, 32, 32);
      const d = tctx.getImageData(0, 0, 32, 32).data;
      const rata = utils.warnaRataRata(d).map((v) => Math.round(v * 0.45));
      warnaLatar = utils.rgbKeHex(rata);
    } catch (e) { /* abaikan, pakai warna default */ }
    gambar();
  });

  function gambar() {
    const W = 1080, H = 1920;
    kanvas.width = W; kanvas.height = H;
    const ctx = kanvas.getContext('2d');
    ctx.fillStyle = warnaLatar;
    ctx.fillRect(0, 0, W, H);
    let y = 220;
    if (sampul) {
      const sisi = 620;
      const x0 = (W - sisi) / 2;
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(x0, 180, sisi, sisi, 28);
      ctx.clip();
      const s = Math.min(sampul.naturalWidth, sampul.naturalHeight);
      ctx.drawImage(sampul, (sampul.naturalWidth - s) / 2, (sampul.naturalHeight - s) / 2, s, s, x0, 180, sisi, sisi);
      ctx.restore();
      y = 180 + sisi + 90;
    }
    const barisLirik = lirik.value.trim().split(/\r?\n/).filter((b) => b.trim()).slice(0, 8);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = '600 56px Inter, system-ui, sans-serif';
    barisLirik.forEach((b) => {
      ctx.fillText(b, W / 2, y, W - 160);
      y += 78;
    });
    y += 40;
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.font = '500 44px Inter, system-ui, sans-serif';
    if (judul.value.trim()) { ctx.fillText(judul.value.trim(), W / 2, y, W - 160); y += 62; }
    if (artis.value.trim()) {
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.font = '400 38px Inter, system-ui, sans-serif';
      ctx.fillText(artis.value.trim(), W / 2, y, W - 160);
    }
    if (!barisLirik.length && !judul.value.trim()) {
      T.show(box, '<div class="hint">Isi judul dan lirik dulu, lalu tekan Buat kartu.</div>');
    } else {
      T.show(box, '<div class="hint">Kartu siap. Warna latar diambil dari sampul yang kamu unggah.</div>');
    }
  }

  [judul, artis, lirik].forEach((el) => el.addEventListener('input', gambar));

  root.appendChild(T.el(`<p class="note">${LOCAL_NOTE}</p>`));
  root.appendChild(T.grid2(
    T.field('Judul lagu', judul),
    T.field('Penyanyi / band', artis)
  ));
  root.appendChild(T.field('Lirik yang ditampilkan', lirik));
  root.appendChild(T.field('Sampul lagu (opsional)', fileI));
  root.appendChild(T.row(
    T.btn('Buat kartu', gambar, true),
    T.btn('Unduh gambar', async () => {
      if (!kanvas.width) { T.toast('Buat dulu kartunya'); return; }
      const blob = await canvasToBlob(kanvas, 'image/png');
      if (!blob) { T.toast('Gagal membuat gambar'); return; }
      T.dl('kartu-lirik.png', blob, 'image/png');
      T.toast('Kartu berhasil diunduh');
    })
  ));
  root.appendChild(box);
  root.appendChild(kanvas);
}
