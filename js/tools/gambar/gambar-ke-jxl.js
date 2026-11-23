import { h as T, loadImage, fileInput, canvasToBlob, fmtBytes, LOCAL_NOTE } from '../../core.js';
import { browserBisaJxl, muatJxl } from './jxl-ke-jpg-png.js';

// Gambar ke JXL: ubah foto jadi file JPEG XL (.jxl) langsung di
// browser, lewat mesin JXL tambahan (@jsquash/jxl 1.3.0, WASM libjxl
// — loadernya di jxl-ke-jpg-png.js). Foto diproses di perangkatmu,
// tidak diunggah. Perintah cjxl tetap tersedia sebagai alternatif
// (untuk foto yang terlalu besar bagi mesin ini).
// GERBANG (F10, 20 Nov 2026): jalur encode BELUM teruji live (egress
// mati) — gelombang 4 WAJIB membuktikan modul + file .wasm-nya
// benar-benar termuat dari kedua CDN dan hasil .jxl-nya valid
// (decode balik + deteksiJxl) sebelum fitur ini diklaim live.
export const meta = {"id": "gambar-ke-jxl", "name": "Gambar ke JXL", "cat": "gambar", "icon": "📦", "desc": "Ubah foto jadi JXL (JPEG XL), format gambar baru yang lebih kecil.", "keywords": "jxl,jpeg xl,konversi,gambar,foto,cjxl", "since": "6.19.0"};

export function namaDasar(nama) {
  return (nama || 'foto').replace(/\.[^.]*$/, '') || 'foto';
}

// Perintah cjxl untuk konversi asli di komputer (murni).
export function perintahCjxl(namaFile) {
  const dasar = namaDasar(namaFile);
  return 'cjxl "' + dasar + '.png" "' + dasar + '.jxl"';
}

// Batas ukuran foto untuk mesin JXL ini: encoder @jsquash/jxl
// dilaporkan gagal di atas ~12-16 megapiksel (RuntimeError, bukan
// sekadar lambat) — ditolak jujur dengan pesan, bukan dibiarkan crash.
export const JXL_MAKS_MEGAPIKSEL = 12;
export function melebihiBatasJxl(lebar, tinggi) {
  return (Number(lebar) || 0) * (Number(tinggi) || 0) > JXL_MAKS_MEGAPIKSEL * 1000000;
}

// Petakan kontrol UI ke opsi encoder libjxl (murni, bisa diuji Node):
// kualitas 0-100 (kualitas 100 = tanpa rugi penuh via lossless),
// effort 1-9 (makin besar = file makin kecil tapi makin lama).
export function opsiEncodeJxl(kualitas, effort, tanpaRugi) {
  const eMentah = Number(effort);
  const e = Math.max(1, Math.min(9, Math.round(Number.isFinite(eMentah) ? eMentah : 5)));
  if (tanpaRugi) return { lossless: true, effort: e };
  const qMentah = Number(kualitas);
  const q = Math.max(0, Math.min(100, Math.round(Number.isFinite(qMentah) ? qMentah : 90)));
  return { quality: q, effort: e };
}

export function render(root) {
  const fi = fileInput('image/*');
  const kualitasR = T.el('<input type="range" min="50" max="100" value="90" class="inp">');
  const kualitasV = T.el('<span class="hint" style="min-width:44px;text-align:right">90%</span>');
  const effortSel = T.select([
    ['3', 'Cepat — file agak besar'],
    ['5', 'Seimbang'],
    ['7', 'Paling kecil — lebih lama'],
  ], '5');
  const tanpaRugiChk = T.el('<input type="checkbox" style="width:18px;height:18px;accent-color:#ff6f61">');
  const formatSel = T.select([
    ['png', 'PNG tanpa rugi (paling aman)'],
    ['webp', 'WebP tanpa rugi (lebih kecil)'],
  ], 'png');
  const box = T.out();
  const infoBox = T.out();
  const cv = document.createElement('canvas');
  let img = null, dukungan = null, namaFile = 'foto.png', sedangUbah = false;

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
    info += '<div class="kv"><span>Browser ini bisa buka JXL</span><b>' + (dukungan ? 'Ya' : 'Belum') + '</b></div>';
    if (melebihiBatasJxl(w, h)) {
      info += '<p class="err">Foto ini di atas ' + JXL_MAKS_MEGAPIKSEL + ' megapiksel — mesin JXL di browser tidak kuat mengubah foto sebesar ini. Kecilkan dulu fotonya, atau ubah di komputer dengan perintah di bawah.</p>';
    } else {
      info += '<p class="hint">Atur kualitas di bawah lalu tekan "Ubah ke JXL". Hasilnya file .jxl standar — bisa dibuka di browser yang sudah mendukung JXL (Chrome 155 ke atas, Safari 17 ke atas, Firefox 158 ke atas) atau aplikasi foto yang mendukungnya.' + (dukungan ? '' : ' Browser ini belum bisa menampilkan hasil JXL, tapi file-nya tetap bisa dipakai di tempat lain.') + '</p>';
    }
    info += '<p class="hint">Alternatif di komputer (perintah cjxl dari libjxl, gratis):</p>' +
      '<p class="mono" style="word-break:break-all;background:#ffffff10;border:1px solid #ffffff20;border-radius:8px;padding:10px 12px">' + T.esc(perintahCjxl(namaFile)) + '</p>';
    T.show(infoBox, info);
    T.toast('Foto siap!');
  }

  const ubahB = T.btn('Ubah ke JXL', async () => {
    if (!img) { T.toast('Pilih foto dulu'); return; }
    if (sedangUbah) return;
    const w = cv.width, h = cv.height;
    if (melebihiBatasJxl(w, h)) {
      T.show(infoBox, '<p class="err">Foto ini di atas ' + JXL_MAKS_MEGAPIKSEL + ' megapiksel — mesin JXL di browser tidak kuat mengubah foto sebesar ini. Kecilkan dulu fotonya, atau ubah di komputer dengan perintah cjxl.</p>');
      return;
    }
    sedangUbah = true;
    ubahB.disabled = true;
    T.show(infoBox, '<p class="dim">Mengubah ke JXL... (pertama kali perlu internet untuk mengunduh mesin JXL; foto besar bisa butuh waktu agak lama)</p>');
    try {
      const jxl = await muatJxl();
      const imageData = cv.getContext('2d').getImageData(0, 0, w, h);
      const buf = await jxl.encode(imageData, opsiEncodeJxl(+kualitasR.value, +effortSel.value, tanpaRugiChk.checked));
      if (!buf || !buf.byteLength) throw new Error('hasil encode kosong');
      const blob = new Blob([buf], { type: 'image/jxl' });
      T.dl(namaDasar(namaFile) + '.jxl', blob, 'image/jxl');
      T.show(infoBox, '<div class="kv"><span>File JXL</span><b>' + T.esc(namaDasar(namaFile)) + '.jxl (' + fmtBytes(blob.size) + ')</b></div>' +
        '<p class="hint">Foto berhasil diubah ke JXL.</p>');
      T.toast('Berhasil diunduh (' + fmtBytes(blob.size) + ')');
    } catch (e) {
      T.show(infoBox, '<p class="err">Foto gagal diubah ke JXL. Cek koneksi internetmu lalu coba lagi.</p>');
    } finally {
      sedangUbah = false;
      ubahB.disabled = false;
    }
  }, true);

  const dlB = T.btn('Unduh PNG/WebP', async () => {
    if (!img) { T.toast('Pilih foto dulu'); return; }
    const fmt = formatSel.value;
    const blob = await canvasToBlob(cv, fmt === 'webp' ? 'image/webp' : 'image/png', 1);
    if (!blob) { T.toast('Gagal membuat file'); return; }
    T.dl(namaDasar(namaFile) + '.' + fmt, blob, blob.type);
    T.toast('Berhasil diunduh (' + fmtBytes(blob.size) + '). Ini file ' + fmt.toUpperCase() + ', bukan JXL.');
  });

  const salinB = T.btn('Salin perintah cjxl', () => {
    if (!img) { T.toast('Pilih foto dulu'); return; }
    T.copy(perintahCjxl(namaFile));
  });

  kualitasR.addEventListener('input', () => { kualitasV.textContent = kualitasR.value + '%'; });
  tanpaRugiChk.addEventListener('change', () => {
    const mati = tanpaRugiChk.checked;
    kualitasR.disabled = mati;
    kualitasV.style.opacity = mati ? '0.4' : '1';
  });

  root.appendChild(T.el('<p class="note">🔒 ' + LOCAL_NOTE + '</p>'));
  root.appendChild(T.el('<p class="mut" style="font-size:13.5px;line-height:1.6">Pilih foto, atur kualitasnya, lalu ubah jadi JXL. Semua diproses di perangkatmu — foto tidak diunggah.</p>'));
  root.appendChild(T.field('Pilih foto', fi));
  root.appendChild(T.grid2(T.field('Kualitas JXL', (() => { const w = T.el('<div style="display:flex;gap:8px;align-items:center"></div>'); w.appendChild(kualitasR); w.appendChild(kualitasV); return w; })(), 'Makin tinggi, makin bagus tapi file makin besar.'), T.field('Usaha kompresi', effortSel, 'Makin kecil hasilnya, makin lama prosesnya.')));
  root.appendChild(T.field('Tanpa rugi', (() => { const w = T.el('<label style="display:flex;gap:8px;align-items:center;cursor:pointer"></label>'); w.appendChild(tanpaRugiChk); w.appendChild(T.el('<span>Simpan kualitas asli 100% (file lebih besar, kualitas tidak dipakai)</span>')); return w; })()));
  root.appendChild(T.row(T.btn('Siapkan foto', onPick, true), ubahB));
  root.appendChild(T.field('Simpan sementara sebagai', formatSel, 'PNG atau WebP tanpa rugi, bahan untuk diubah ke JXL nanti.'));
  root.appendChild(T.row(dlB));
  root.appendChild(T.row(salinB));
  root.appendChild(infoBox);
  root.appendChild(box);
  fi.addEventListener('change', onPick);
}
