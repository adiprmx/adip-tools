import { h as T, loadImage, fileInput, canvasToBlob, fmtBytes, LOCAL_NOTE } from '../../core.js';
import { browserBisaJxl } from './jxl-ke-jpg-png.js';

// Gambar ke JXL: menyiapkan foto untuk format JPEG XL.
// BATASAN JUJUR (ditulis juga di UI): browser belum bisa membuat
// file JXL. Encoder-nya (libjxl, pustaka @jsquash/jxl) belum bisa
// dibundel dan diuji dari VM ini karena egress mati total, jadi hash
// SRI-nya tidak bisa diukur. Tool ini TIDAK berpura-pura mengubah
// ke JXL. Yang bisa dilakukan di sini: cek apakah browser bisa
// membuka JXL, lihat info foto, simpan foto sebagai PNG/WebP
// tanpa rugi (format terdekat yang bisa dibuat browser), dan salin
// perintah cjxl untuk konversi asli di komputer.
export const meta = {"id": "gambar-ke-jxl", "name": "Gambar ke JXL", "cat": "gambar", "icon": "📦", "desc": "Siapkan foto untuk JXL dan cek dukungan browser (konversi langsung belum tersedia).", "keywords": "jxl,jpeg xl,konversi,gambar,foto,cjxl", "since": "6.19.0"};

export function namaDasar(nama) {
  return (nama || 'foto').replace(/\.[^.]*$/, '') || 'foto';
}

// Perintah cjxl untuk konversi asli di komputer (murni).
export function perintahCjxl(namaFile) {
  const dasar = namaDasar(namaFile);
  return 'cjxl "' + dasar + '.png" "' + dasar + '.jxl"';
}

export function render(root) {
  const fi = fileInput('image/*');
  const formatSel = T.select([
    ['png', 'PNG tanpa rugi (paling aman)'],
    ['webp', 'WebP tanpa rugi (lebih kecil)'],
  ], 'png');
  const box = T.out();
  const infoBox = T.out();
  const cv = document.createElement('canvas');
  let img = null, dukungan = null, namaFile = 'foto.png';

  async function onPick() {
    T.hide(infoBox); T.hide(box);
    const f = fi.files && fi.files[0];
    if (!f) { T.toast('Pilih foto dulu'); return; }
    namaFile = f.name || 'foto.png';
    try { img = await loadImage(f); }
    catch (e) { T.toast('File itu bukan gambar. Pilih file gambar.'); return; }
    const w = img.naturalWidth, h = img.naturalHeight;
    cv.width = w; cv.height = h;
    cv.getContext('2d').drawImage(img, 0, 0);
    cv.style.cssText = 'max-width:100%;height:auto;border-radius:10px;border:1px solid #ffffff20;display:block';
    T.show(box, '');
    box.appendChild(cv);
    let info = '<div class="kv"><span>File</span><b>' + T.esc(f.name) + ' (' + fmtBytes(f.size) + ')</b></div>' +
      '<div class="kv"><span>Ukuran</span><b>' + w + 'x' + h + ' px</b></div>';
    T.show(infoBox, info + '<p class="hint">Lagi mengecek dukungan JXL browser ini...</p>');
    if (dukungan === null) dukungan = await browserBisaJxl();
    info += '<div class="kv"><span>Browser ini bisa buka JXL</span><b>' + (dukungan ? 'Ya' : 'Belum') + '</b></div>' +
      '<p class="hint">Konversi langsung ke JXL belum bisa dilakukan di browser. Encoder JXL masih perlu pustaka tambahan yang belum tersedia di sini. Sementara itu, foto bisa disimpan sebagai PNG atau WebP tanpa rugi di bawah, lalu diubah ke JXL di komputer dengan perintah ini:</p>' +
      '<p class="mono" style="word-break:break-all;background:#ffffff10;border:1px solid #ffffff20;border-radius:8px;padding:10px 12px">' + T.esc(perintahCjxl(namaFile)) + '</p>' +
      '<p class="hint">Perintah itu memakai cjxl dari libjxl (gratis, untuk Windows, Mac, dan Linux).' + (dukungan ? '' : ' Browser yang sudah bisa buka JXL: Chrome 155 ke atas, Safari 17 ke atas, Firefox 158 ke atas.') + '</p>';
    T.show(infoBox, info);
    T.toast('Foto siap!');
  }

  const dlB = T.btn('Unduh PNG/WebP', async () => {
    if (!img) { T.toast('Pilih foto dulu'); return; }
    const fmt = formatSel.value;
    const blob = await canvasToBlob(cv, fmt === 'webp' ? 'image/webp' : 'image/png', 1);
    if (!blob) { T.toast('Gagal membuat file'); return; }
    T.dl(namaDasar(namaFile) + '.' + fmt, blob, blob.type);
    T.toast('Berhasil diunduh (' + fmtBytes(blob.size) + '). Ini file ' + fmt.toUpperCase() + ', bukan JXL.');
  }, true);

  const salinB = T.btn('Salin perintah cjxl', () => {
    if (!img) { T.toast('Pilih foto dulu'); return; }
    T.copy(perintahCjxl(namaFile));
  });

  root.appendChild(T.el('<p class="note">🔒 ' + LOCAL_NOTE + '</p>'));
  root.appendChild(T.el('<p class="mut" style="font-size:13.5px;line-height:1.6">Sejujurnya: file JXL belum bisa dibuat langsung dari browser. Tool ini menyiapkan foto kamu dan memberi perintah yang benar untuk konversi asli.</p>'));
  root.appendChild(T.field('Pilih foto', fi));
  root.appendChild(T.field('Simpan sementara sebagai', formatSel, 'PNG atau WebP tanpa rugi, bahan untuk diubah ke JXL nanti.'));
  root.appendChild(T.row(T.btn('Siapkan foto', onPick, true), dlB));
  root.appendChild(T.row(salinB));
  root.appendChild(infoBox);
  root.appendChild(box);
  fi.addEventListener('change', onPick);
}
