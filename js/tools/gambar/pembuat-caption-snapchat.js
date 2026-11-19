import { h as T, loadImage, fileInput, canvasToBlob, fmtBytes, LOCAL_NOTE } from '../../core.js';

// Pembuat Caption Snapchat: tulisan di atas foto dengan gaya khas
// Snapchat, yaitu bar hitam transparan membulat dengan tulisan putih
// tebal di tengah. BEDA dari Teks di Foto (teks-di-foto.js) yang
// menaruh tulisan bebas di posisi mana saja dengan outline; di sini
// gayanya dikunci seperti caption Snapchat asli (bar + teks tengah).
export const meta = {"id": "pembuat-caption-snapchat", "name": "Pembuat Caption Snapchat", "cat": "gambar", "icon": "👻", "desc": "Tulisan gaya caption Snapchat di atas fotomu: bar hitam dan teks putih.", "keywords": "snapchat,caption,foto,tulisan,bar,snap", "since": "6.19.0"};

// Bagi teks jadi baris sesuai lebar maksimum (murni). ukur(teks)
// mengembalikan lebar teks dalam piksel; di browser diisi
// ctx.measureText, di harness diisi estimator.
export function bagiBaris(teks, lebarMaks, ukur) {
  const kata = (teks || '').split(/\s+/).filter(Boolean);
  const baris = [];
  let jalan = '';
  for (const k of kata) {
    const coba = jalan ? jalan + ' ' + k : k;
    if (ukur(coba) <= lebarMaks || !jalan) jalan = coba;
    else { baris.push(jalan); jalan = k; }
  }
  if (jalan) baris.push(jalan);
  return baris.slice(0, 3);
}

// Hitung kotak bar caption (murni): posisi atas/tengah/bawah,
// tinggi bar mengikuti jumlah baris.
export function hitungBar(lebar, tinggi, jumlahBaris, posisi, ukuranFont) {
  const fs = Math.max(12, ukuranFont || 32);
  const padX = Math.round(lebar * 0.06);
  const padY = Math.round(fs * 0.45);
  const tinggiBar = Math.max(1, jumlahBaris) * Math.round(fs * 1.35) + padY * 2;
  const bw = Math.round(lebar * 0.88);
  const x = Math.round((lebar - bw) / 2);
  let y;
  if (posisi === 'atas') y = Math.round(tinggi * 0.08);
  else if (posisi === 'tengah') y = Math.round((tinggi - tinggiBar) / 2);
  else y = Math.round(tinggi * 0.92) - tinggiBar;
  return { x, y: Math.max(0, y), w: bw, h: tinggiBar, fontSize: fs, padX, padY };
}

export function render(root) {
  const fi = fileInput('image/*');
  const teksI = T.ta(2, 'Tulis caption di sini...', '');
  const posisiSel = T.select([['atas', 'Atas'], ['tengah', 'Tengah'], ['bawah', 'Bawah']], 'tengah');
  const ukuranR = T.el('<input type="range" min="20" max="64" value="36" class="inp">');
  const ukuranV = T.el('<span class="hint" style="min-width:44px;text-align:right">36px</span>');
  const warnaSel = T.select([
    ['hitam', 'Bar hitam (khas Snapchat)'],
    ['putih', 'Bar putih'],
  ], 'hitam');
  const box = T.out();
  const infoBox = T.out();
  const cv = document.createElement('canvas');
  let img = null;

  function make() {
    T.hide(infoBox); T.hide(box);
    if (!img) return;
    const maksSisi = 1600;
    const s = Math.min(1, maksSisi / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * s));
    const h = Math.max(1, Math.round(img.naturalHeight * s));
    cv.width = w; cv.height = h;
    const ctx = cv.getContext('2d');
    ctx.drawImage(img, 0, 0, w, h);
    const teks = teksI.value.trim();
    let baris = [];
    if (teks) {
      let fs = Math.round(+ukuranR.value * s);
      ctx.font = '700 ' + fs + 'px system-ui, sans-serif';
      const ukur = (t) => ctx.measureText(t).width;
      baris = bagiBaris(teks, w * 0.8, ukur);
      while (baris.length > 2 && fs > 14) {
        fs -= 2;
        ctx.font = '700 ' + fs + 'px system-ui, sans-serif';
        baris = bagiBaris(teks, w * 0.8, ukur);
      }
      const bar = hitungBar(w, h, baris.length, posisiSel.value, fs);
      ctx.fillStyle = warnaSel.value === 'putih' ? 'rgba(255,255,255,0.82)' : 'rgba(0,0,0,0.62)';
      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') ctx.roundRect(bar.x, bar.y, bar.w, bar.h, Math.round(bar.h / 2));
      else ctx.rect(bar.x, bar.y, bar.w, bar.h);
      ctx.fill();
      ctx.font = '700 ' + bar.fontSize + 'px system-ui, sans-serif';
      ctx.fillStyle = warnaSel.value === 'putih' ? '#111111' : '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const tinggiBaris = Math.round(bar.fontSize * 1.35);
      baris.forEach((b, i) => {
        ctx.fillText(b, w / 2, bar.y + bar.padY + tinggiBaris / 2 + i * tinggiBaris);
      });
    }
    cv.style.cssText = 'max-width:100%;height:auto;border-radius:10px;border:1px solid #ffffff20;display:block';
    T.show(box, '');
    box.appendChild(cv);
    T.show(infoBox, '<div class="kv"><span>Ukuran hasil</span><b>' + w + 'x' + h + ' px</b></div>' +
      (teks ? '<div class="kv"><span>Baris caption</span><b>' + baris.length + '</b></div>' : '<p class="hint">Tulis caption dulu supaya bar-nya muncul.</p>'));
  }

  const muat = async () => {
    if (!fi.files[0]) { T.toast('Pilih foto dulu'); return; }
    try { img = await loadImage(fi.files[0]); }
    catch (e) { T.toast('File itu bukan gambar. Pilih file gambar.'); return; }
    make();
    T.toast('Foto siap diberi caption!');
  };

  const dlB = T.btn('Unduh PNG', async () => {
    if (!img) { T.toast('Pilih foto dulu'); return; }
    const blob = await canvasToBlob(cv, 'image/png');
    if (!blob) { T.toast('Gagal membuat file'); return; }
    const base = (fi.files[0].name || 'foto').replace(/\.[^.]*$/, '');
    T.dl(base + '-snapchat.png', blob, 'image/png');
    T.toast('Berhasil diunduh (' + fmtBytes(blob.size) + ')');
  }, true);

  teksI.addEventListener('input', make);
  posisiSel.addEventListener('change', make);
  ukuranR.addEventListener('input', () => { ukuranV.textContent = ukuranR.value + 'px'; make(); });
  warnaSel.addEventListener('change', make);

  root.appendChild(T.el('<p class="note">🔒 ' + LOCAL_NOTE + '</p>'));
  root.appendChild(T.el('<p class="mut" style="font-size:13.5px;line-height:1.6">Tulis caption, lalu caption itu muncul di atas foto dalam bar membulat seperti di Snapchat.</p>'));
  root.appendChild(T.field('Pilih foto', fi));
  root.appendChild(T.field('Caption', teksI, 'Maksimal 3 baris, baris kelebihannya dipotong.'));
  root.appendChild(T.grid2(T.field('Posisi bar', posisiSel), T.field('Ukuran tulisan', (() => { const w = T.el('<div style="display:flex;gap:8px;align-items:center"></div>'); w.appendChild(ukuranR); w.appendChild(ukuranV); return w; })())));
  root.appendChild(T.field('Warna bar', warnaSel));
  root.appendChild(T.row(T.btn('Buat Caption', muat, true), dlB));
  root.appendChild(infoBox);
  root.appendChild(box);
  fi.addEventListener('change', muat);
}
