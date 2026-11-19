import { h as T, loadImage, fileInput, canvasToBlob, fmtBytes, LOCAL_NOTE } from '../../core.js';

// Generator Paint by Numbers: foto disederhanakan jadi beberapa
// warna datar, tiap wilayah diberi nomor, lengkap dengan daftar
// warna. BEDA dari Pixel Art (pixel-art.js) yang hanya mengotak-
// kotakkan foto tanpa nomor dan tanpa daftar warna, dan dari Foto
// Sketsa (foto-sketca.js) yang menggambar garis sketsa.
export const meta = {"id": "generator-paint-by-numbers", "name": "Generator Paint by Numbers", "cat": "gambar", "icon": "🎨", "desc": "Ubah foto jadi pola mewarnai bernomor lengkap dengan daftar warnanya.", "keywords": "paint by numbers,mewarnai,nomor,foto,pola,warna", "since": "6.19.0"};

// Kuantisasi median-cut: bagi kotak warna di kanal dengan rentang
// terbesar sampai dapat jumlah warna yang diminta (murni).
export function kuantisasiMedianCut(piksel, jumlahWarna) {
  const target = Math.max(2, Math.min(24, Math.round(jumlahWarna) || 8));
  let kotak = [piksel.slice()];
  const rentang = (k) => {
    let r0 = 255, r1 = 0, g0 = 255, g1 = 0, b0 = 255, b1 = 0;
    for (const p of k) {
      if (p[0] < r0) r0 = p[0]; if (p[0] > r1) r1 = p[0];
      if (p[1] < g0) g0 = p[1]; if (p[1] > g1) g1 = p[1];
      if (p[2] < b0) b0 = p[2]; if (p[2] > b1) b1 = p[2];
    }
    return [[r1 - r0, 0], [g1 - g0, 1], [b1 - b0, 2]];
  };
  while (kotak.length < target) {
    let bagi = -1, kanalBagi = 0, rentangBagi = 0;
    kotak.forEach((k, i) => {
      if (k.length < 2) return;
      const rr = rentang(k);
      const terbesar = rr.reduce((a, b) => (b[0] > a[0] ? b : a));
      if (terbesar[0] > rentangBagi) { rentangBagi = terbesar[0]; bagi = i; kanalBagi = terbesar[1]; }
    });
    if (bagi < 0 || rentangBagi === 0) break;
    const k = kotak[bagi].slice().sort((a, b) => a[kanalBagi] - b[kanalBagi]);
    const tengah = Math.max(1, Math.floor(k.length / 2));
    kotak.splice(bagi, 1, k.slice(0, tengah), k.slice(tengah));
  }
  return kotak.map((k) => {
    let r = 0, g = 0, b = 0;
    for (const p of k) { r += p[0]; g += p[1]; b += p[2]; }
    const n = Math.max(1, k.length);
    return [Math.round(r / n), Math.round(g / n), Math.round(b / n)];
  });
}

// Petakan tiap piksel ke indeks palet terdekat (murni).
export function petakanWarna(piksel, palet) {
  const cache = new Map();
  return piksel.map((p) => {
    const kunci = ((p[0] >> 3) << 10) | ((p[1] >> 3) << 5) | (p[2] >> 3);
    const ada = cache.get(kunci);
    if (ada !== undefined) return ada;
    let terbaik = 0, jarakTerbaik = Infinity;
    for (let i = 0; i < palet.length; i++) {
      const dr = p[0] - palet[i][0], dg = p[1] - palet[i][1], db = p[2] - palet[i][2];
      const d = dr * dr + dg * dg + db * db;
      if (d < jarakTerbaik) { jarakTerbaik = d; terbaik = i; }
    }
    cache.set(kunci, terbaik);
    return terbaik;
  });
}

// Label wilayah terhubung (4-arah) dari peta indeks warna (murni).
// Mengembalikan label per piksel, jumlah wilayah, dan info tiap
// wilayah: warna, ukuran piksel, dan titik tengahnya.
export function labelWilayah(indeks, lebar, tinggi) {
  const label = new Int32Array(lebar * tinggi).fill(-1);
  const wilayah = [];
  const antre = [];
  for (let s = 0; s < lebar * tinggi; s++) {
    if (label[s] !== -1) continue;
    const warna = indeks[s];
    const id = wilayah.length;
    let ukuran = 0, sx = 0, sy = 0;
    antre.length = 0;
    antre.push(s);
    label[s] = id;
    while (antre.length) {
      const p = antre.pop();
      const x = p % lebar, y = (p / lebar) | 0;
      ukuran++; sx += x; sy += y;
      if (x > 0 && label[p - 1] === -1 && indeks[p - 1] === warna) { label[p - 1] = id; antre.push(p - 1); }
      if (x + 1 < lebar && label[p + 1] === -1 && indeks[p + 1] === warna) { label[p + 1] = id; antre.push(p + 1); }
      if (y > 0 && label[p - lebar] === -1 && indeks[p - lebar] === warna) { label[p - lebar] = id; antre.push(p - lebar); }
      if (y + 1 < tinggi && label[p + lebar] === -1 && indeks[p + lebar] === warna) { label[p + lebar] = id; antre.push(p + lebar); }
    }
    wilayah.push({ warna, ukuran, cx: sx / ukuran, cy: sy / ukuran });
  }
  return { label, wilayah };
}

function hexWarna(c) {
  return '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
}

export function render(root) {
  const fi = fileInput('image/*');
  const warnaSel = T.select([
    ['6', '6 warna'], ['8', '8 warna'], ['10', '10 warna'],
    ['12', '12 warna'], ['16', '16 warna'],
  ], '8');
  const nomorCk = T.el('<input type="checkbox" checked style="width:20px;height:20px;accent-color:#fff">');
  const garisCk = T.el('<input type="checkbox" checked style="width:20px;height:20px;accent-color:#fff">');
  const box = T.out();
  const infoBox = T.out();
  const legendaBox = T.out();
  const cv = document.createElement('canvas');
  let img = null, palet = [], wilayahInfo = [];

  function make() {
    T.hide(infoBox); T.hide(box); T.hide(legendaBox);
    if (!img) return;
    const maksSisi = 900;
    const s = Math.min(1, maksSisi / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * s));
    const h = Math.max(1, Math.round(img.naturalHeight * s));
    const tmp = document.createElement('canvas');
    tmp.width = w; tmp.height = h;
    const tx = tmp.getContext('2d');
    tx.drawImage(img, 0, 0, w, h);
    const data = tx.getImageData(0, 0, w, h).data;
    const piksel = [];
    for (let i = 0; i < w * h; i++) piksel.push([data[i * 4], data[i * 4 + 1], data[i * 4 + 2]]);
    palet = kuantisasiMedianCut(piksel, +warnaSel.value);
    const indeks = petakanWarna(piksel, palet);
    const hasil = labelWilayah(indeks, w, h);
    wilayahInfo = hasil.wilayah;
    cv.width = w; cv.height = h;
    const ctx = cv.getContext('2d');
    const imgData = ctx.createImageData(w, h);
    for (let i = 0; i < w * h; i++) {
      const c = palet[indeks[i]];
      imgData.data[i * 4] = c[0]; imgData.data[i * 4 + 1] = c[1]; imgData.data[i * 4 + 2] = c[2]; imgData.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(imgData, 0, 0);
    if (garisCk.checked) {
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const i = y * w + x;
          const batas = (x + 1 < w && hasil.label[i + 1] !== hasil.label[i]) ||
            (y + 1 < h && hasil.label[i + w] !== hasil.label[i]);
          if (batas) ctx.fillRect(x, y, 1, 1);
        }
      }
    }
    if (nomorCk.checked) {
      const fs = Math.max(9, Math.round(Math.min(w, h) / 55));
      ctx.font = '700 ' + fs + 'px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      hasil.wilayah.forEach((wl) => {
        if (wl.ukuran < 25) return;
        const c = palet[wl.warna];
        const terang = (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) / 255;
        ctx.fillStyle = terang > 0.6 ? '#000000' : '#ffffff';
        ctx.fillText(String(wl.warna + 1), wl.cx, wl.cy);
      });
    }
    cv.style.cssText = 'max-width:100%;height:auto;border-radius:10px;border:1px solid #ffffff20;display:block';
    T.show(box, '');
    box.appendChild(cv);
    const hitung = palet.map(() => 0);
    for (const i of indeks) hitung[i]++;
    let legenda = '<p class="hint" style="margin-bottom:8px">Daftar warna (nomor = nomor di gambar):</p><div style="display:flex;flex-wrap:wrap;gap:8px">';
    palet.forEach((c, i) => {
      legenda += '<div style="display:flex;align-items:center;gap:6px;border:1px solid #ffffff20;border-radius:8px;padding:4px 8px 4px 4px"><span style="width:24px;height:24px;border-radius:6px;background:' + hexWarna(c) + ';display:inline-block"></span><b>' + (i + 1) + '</b><span class="hint">' + hexWarna(c).toUpperCase() + '</span></div>';
    });
    legenda += '</div>';
    T.show(legendaBox, legenda);
    T.show(infoBox, '<div class="kv"><span>Ukuran hasil</span><b>' + w + 'x' + h + ' px</b></div>' +
      '<div class="kv"><span>Warna</span><b>' + palet.length + '</b></div>' +
      '<div class="kv"><span>Wilayah bernomor</span><b>' + wilayahInfo.length.toLocaleString('id-ID') + '</b></div>');
  }

  const muat = async () => {
    if (!fi.files[0]) { T.toast('Pilih foto dulu'); return; }
    try { img = await loadImage(fi.files[0]); }
    catch (e) { T.toast('File itu bukan gambar. Pilih file gambar.'); return; }
    make();
    T.toast('Pola mewarnai jadi!');
  };

  const dlB = T.btn('Unduh PNG', async () => {
    if (!img) { T.toast('Pilih foto dulu'); return; }
    const blob = await canvasToBlob(cv, 'image/png');
    if (!blob) { T.toast('Gagal membuat file'); return; }
    const base = (fi.files[0].name || 'foto').replace(/\.[^.]*$/, '');
    T.dl(base + '-paint-by-numbers.png', blob, 'image/png');
    T.toast('Berhasil diunduh (' + fmtBytes(blob.size) + ')');
  }, true);

  warnaSel.addEventListener('change', make);
  nomorCk.addEventListener('change', make);
  garisCk.addEventListener('change', make);

  root.appendChild(T.el('<p class="note">🔒 ' + LOCAL_NOTE + '</p>'));
  root.appendChild(T.el('<p class="mut" style="font-size:13.5px;line-height:1.6">Foto disederhanakan jadi beberapa warna datar. Tiap wilayah diberi nomor yang cocok dengan daftar warna di bawah gambar.</p>'));
  root.appendChild(T.field('Pilih foto', fi));
  root.appendChild(T.grid2(T.field('Jumlah warna', warnaSel), T.field('Opsi', (() => {
    const w = T.el('<div style="display:flex;flex-direction:column;gap:10px;padding-top:8px"></div>');
    const a = T.el('<label style="display:flex;gap:8px;align-items:center;cursor:pointer"></label>');
    a.appendChild(nomorCk); a.appendChild(T.el('<span>Tampilkan nomor</span>'));
    const b = T.el('<label style="display:flex;gap:8px;align-items:center;cursor:pointer"></label>');
    b.appendChild(garisCk); b.appendChild(T.el('<span>Garis batas wilayah</span>'));
    w.appendChild(a); w.appendChild(b);
    return w;
  })())));
  root.appendChild(T.row(T.btn('Buat Pola', muat, true), dlB));
  root.appendChild(infoBox);
  root.appendChild(box);
  root.appendChild(legendaBox);
  fi.addEventListener('change', muat);
}
