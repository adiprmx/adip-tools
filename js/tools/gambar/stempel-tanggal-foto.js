import { h as T, fileInput, loadImage, canvasToBlob, LOCAL_NOTE } from '../../core.js';

export const meta = {"id": "stempel-tanggal-foto", "name": "Stempel Tanggal di Foto", "cat": "gambar", "icon": "📷", "desc": "Tambah stempel tanggal oranye ala kamera film ke fotomu.", "keywords": "stempel tanggal,kamera film,analog,disposable,vintage,foto,tanggal", "since": "6.11.0"};

export function render(root) {
  const fileI = fileInput('image/*');
  const tgl = T.input('date', '', new Date().toISOString().slice(0, 10));
  const posisi = T.select([['kanan-bawah', 'Kanan bawah'], ['kiri-bawah', 'Kiri bawah'], ['kanan-atas', 'Kanan atas'], ['kiri-atas', 'Kiri atas']], 'kanan-bawah');
  const warna = T.select([['oranye', 'Oranye (khas kamera film)'], ['putih', 'Putih'], ['kuning', 'Kuning'], ['merah', 'Merah']], 'oranye');
  const box = T.out();
  const kanvas = document.createElement('canvas');
  kanvas.style.cssText = 'width:100%;height:auto;display:block;border-radius:8px;margin-top:12px';
  let imgAsli = null;

  const WARNA = { oranye: '#ff9500', putih: '#ffffff', kuning: '#ffe600', merah: '#ff3b30' };

  function formatTanggal(iso) {
    if (!iso) return '';
    const [thn, bln, hari] = iso.split('-');
    return hari + ' ' + ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'][Number(bln) - 1] + ' ' + thn;
  }

  function proses() {
    if (!imgAsli) return;
    kanvas.width = imgAsli.naturalWidth;
    kanvas.height = imgAsli.naturalHeight;
    const ctx = kanvas.getContext('2d');
    ctx.drawImage(imgAsli, 0, 0);
    const teks = formatTanggal(tgl.value);
    if (!teks) return;
    const ukuran = Math.max(24, Math.round(kanvas.width / 22));
    ctx.font = 'bold ' + ukuran + 'px "Courier New", monospace';
    ctx.fillStyle = WARNA[warna.value] || WARNA.oranye;
    ctx.shadowColor = 'rgba(0,0,0,0.55)';
    ctx.shadowBlur = Math.round(ukuran / 6);
    const pad = Math.round(ukuran * 0.9);
    const lebarTeks = ctx.measureText(teks).width;
    let x = kanvas.width - lebarTeks - pad, y = kanvas.height - pad;
    if (posisi.value.startsWith('kiri')) x = pad;
    if (posisi.value.endsWith('atas')) y = pad + ukuran;
    ctx.fillText(teks, x, y);
    T.show(box, '<div class="hint">Stempel ditambahkan. Ubah tanggal atau posisi lalu hasilnya diperbarui otomatis.</div>');
  }

  fileI.addEventListener('change', async () => {
    const f = fileI.files && fileI.files[0];
    if (!f) return;
    try { imgAsli = await loadImage(f); }
    catch (e) { T.toast('File itu bukan gambar. Pilih file gambar.'); return; }
    proses();
  });
  [tgl, posisi, warna].forEach((el) => el.addEventListener('change', proses));

  root.appendChild(T.el(`<p class="note">${LOCAL_NOTE}</p>`));
  root.appendChild(T.field('Pilih foto', fileI));
  root.appendChild(T.grid2(
    T.field('Tanggal yang dicap', tgl),
    T.field('Posisi stempel', posisi)
  ));
  root.appendChild(T.field('Warna stempel', warna));
  root.appendChild(T.row(
    T.btn('Unduh hasil', async () => {
      if (!kanvas.width) { T.toast('Pilih foto dulu'); return; }
      const blob = await canvasToBlob(kanvas, 'image/jpeg', 0.92);
      if (!blob) { T.toast('Gambarnya tidak bisa dibuat. Coba lagi.'); return; }
      T.dl('foto-stempel.jpg', blob, 'image/jpeg');
      T.toast('Foto berhasil diunduh');
    }, true)
  ));
  root.appendChild(box);
  root.appendChild(kanvas);
}
