import { h as T, loadImage, fileInput, canvasToBlob, fmtBytes, LOCAL_NOTE } from '../../core.js';

// Pembuat Year in Review: rangkuman setahun jadi satu poster:
// angka tahun besar, grid foto pilihan pengguna, dan sorotan yang
// ditulis pengguna sendiri. BEDA dari Pembuat Photo Dump
// (pembuat-photo-dump.js) yang membuat satu slide per foto dengan
// gaya scrapbook/polaroid, dan dari Kolase Foto (kolase-foto.js)
// yang hanya menata foto ke template tanpa tahun dan sorotan.
// Tanpa foto pengguna, tidak ada poster contoh: empty state jujur.
export const meta = {"id": "pembuat-year-in-review", "name": "Pembuat Year in Review", "cat": "gambar", "icon": "📅", "desc": "Rangkuman setahunmu jadi satu poster: tahun, foto, dan sorotanmu.", "keywords": "year in review,rangkuman tahun,poster,foto,tahun,review", "since": "6.19.0"};

const LEBAR = 1080, TINGGI = 1350;
const MAKS_FOTO = 9;

// Tata letak grid foto di dalam area poster (murni): kolom dipilih
// dari jumlah foto, baris mengikuti.
export function tataLetakReview(jumlahFoto, x, y, lebar, tinggi, jarak) {
  const n = Math.max(1, Math.min(MAKS_FOTO, jumlahFoto || 1));
  const kolom = n <= 1 ? 1 : n <= 4 ? 2 : 3;
  const baris = Math.ceil(n / kolom);
  const g = Math.max(0, jarak || 0);
  const cw = (lebar - g * (kolom - 1)) / kolom;
  const ch = (tinggi - g * (baris - 1)) / baris;
  const kotak = [];
  for (let i = 0; i < n; i++) {
    const k = i % kolom, b = Math.floor(i / kolom);
    kotak.push({ x: x + k * (cw + g), y: y + b * (ch + g), w: cw, h: ch });
  }
  return { kotak, kolom, baris };
}

function gambarCover(ctx, img, x, y, w, h) {
  const iw = img.naturalWidth, ih = img.naturalHeight;
  const s = Math.max(w / iw, h / ih);
  const dw = iw * s, dh = ih * s;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
  ctx.restore();
}

export function render(root) {
  const fi = fileInput('image/*');
  fi.multiple = true;
  const tahunI = T.input('number', '2026', '2026');
  const judulI = T.input('text', 'Year in Review', 'Year in Review');
  const sorotanI = T.ta(4, 'Satu sorotan per baris, maksimal 4 baris.\nContoh: Lulus kuliah\nContoh: Pertama kali naik gunung', '');
  const gayaSel = T.select([
    ['gelap', 'Latar gelap'],
    ['terang', 'Latar terang'],
  ], 'gelap');
  const box = T.out();
  const infoBox = T.out();
  const cv = document.createElement('canvas');
  let imgs = [];

  function sorotan() {
    return sorotanI.value.split('\n').map((s) => s.trim()).filter(Boolean).slice(0, 4);
  }

  function make() {
    T.hide(infoBox); T.hide(box);
    if (!imgs.length) return;
    const gelap = gayaSel.value === 'gelap';
    cv.width = LEBAR; cv.height = TINGGI;
    const ctx = cv.getContext('2d');
    ctx.fillStyle = gelap ? '#16130f' : '#faf7f0';
    ctx.fillRect(0, 0, LEBAR, TINGGI);
    const warnaTeks = gelap ? '#ffffff' : '#16130f';
    const warnaRedup = gelap ? '#b8b0a4' : '#6b655c';
    const tahun = (tahunI.value || '').trim() || '2026';
    const judul = (judulI.value || '').trim() || 'Year in Review';
    ctx.fillStyle = warnaTeks;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.font = '800 150px system-ui, sans-serif';
    ctx.fillText(tahun, LEBAR / 2, 190);
    ctx.font = '600 44px system-ui, sans-serif';
    ctx.fillStyle = warnaRedup;
    ctx.fillText(judul.toUpperCase(), LEBAR / 2, 255);
    ctx.fillStyle = gelap ? '#ffffff33' : '#16130f33';
    ctx.fillRect(60, 295, LEBAR - 120, 2);
    const daftarSorotan = sorotan();
    const areaBawah = daftarSorotan.length ? 300 : 120;
    const area = tataLetakReview(imgs.length, 60, 330, LEBAR - 120, TINGGI - 330 - areaBawah, 14);
    area.kotak.forEach((k, i) => {
      if (imgs[i]) gambarCover(ctx, imgs[i], k.x, k.y, k.w, k.h);
    });
    if (daftarSorotan.length) {
      ctx.textAlign = 'left';
      ctx.fillStyle = warnaTeks;
      ctx.font = '600 36px system-ui, sans-serif';
      let y = TINGGI - 60 - (daftarSorotan.length - 1) * 52;
      daftarSorotan.forEach((s) => {
        ctx.fillText('•  ' + s, 60, y);
        y += 52;
      });
    }
    cv.style.cssText = 'max-width:100%;height:auto;border-radius:10px;border:1px solid #ffffff20;display:block';
    T.show(box, '');
    box.appendChild(cv);
    T.show(infoBox, '<div class="kv"><span>Poster</span><b>' + LEBAR + 'x' + TINGGI + ' px</b></div>' +
      '<div class="kv"><span>Foto</span><b>' + imgs.length + '</b></div>' +
      '<div class="kv"><span>Sorotan</span><b>' + daftarSorotan.length + '</b></div>');
  }

  async function onPick() {
    T.hide(infoBox); T.hide(box);
    const files = [...(fi.files || [])].filter((f) => /^image\//.test(f.type));
    if (!files.length) { T.toast('Pilih foto dulu'); return; }
    if (files.length > MAKS_FOTO) T.toast('Maksimal 9 foto, yang dipakai 9 pertama aja ya');
    try { imgs = await Promise.all(files.slice(0, MAKS_FOTO).map(loadImage)); }
    catch (e) { T.toast('Ada file yang bukan gambar valid'); return; }
    make();
    T.toast('Poster jadi!');
  }

  const dlB = T.btn('Unduh PNG', async () => {
    if (!imgs.length) { T.toast('Pilih foto dulu'); return; }
    const blob = await canvasToBlob(cv, 'image/png');
    if (!blob) { T.toast('Gagal membuat file'); return; }
    const tahun = (tahunI.value || '').trim() || '2026';
    T.dl('year-in-review-' + tahun + '.png', blob, 'image/png');
    T.toast('Berhasil diunduh (' + fmtBytes(blob.size) + ')');
  }, true);

  tahunI.addEventListener('input', make);
  judulI.addEventListener('input', make);
  sorotanI.addEventListener('input', make);
  gayaSel.addEventListener('change', make);

  root.appendChild(T.el('<p class="note">🔒 ' + LOCAL_NOTE + '</p>'));
  root.appendChild(T.el('<p class="mut" style="font-size:13.5px;line-height:1.6">Pilih foto terbaikmu tahun ini, tulis tahun dan sorotanmu, lalu poster rangkuman jadi satu gambar siap dibagikan.</p>'));
  root.appendChild(T.field('Pilih 1-9 foto (bisa multi-select)', fi, 'Belum ada foto? Poster belum bisa dibuat, pilih foto dulu.'));
  root.appendChild(T.grid2(T.field('Tahun', tahunI), T.field('Gaya poster', gayaSel)));
  root.appendChild(T.field('Judul poster', judulI));
  root.appendChild(T.field('Sorotan tahunmu (opsional)', sorotanI, 'Satu sorotan per baris, maksimal 4 baris.'));
  root.appendChild(T.row(T.btn('Pilih ulang foto', () => fi.click()), dlB));
  root.appendChild(infoBox);
  root.appendChild(box);
  fi.addEventListener('change', onPick);
}
