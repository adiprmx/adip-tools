import { h as T, loadImage, fileInput, canvasToBlob, fmtBytes, LOCAL_NOTE } from '../../core.js';

// Pembuat Mosaik LEGO: foto diubah jadi mosaik bata LEGO dengan
// stud (tonjolan bundar) dan daftar kebutuhan bata per warna. BEDA
// dari Pixel Art (pixel-art.js) yang hanya mengotakkan foto tanpa
// palet warna khusus dan tanpa stud maupun daftar bata.
export const meta = {"id": "pembuat-mosaik-lego", "name": "Pembuat Mosaik LEGO", "cat": "gambar", "icon": "🧱", "desc": "Ubah foto jadi mosaik bata LEGO lengkap dengan daftar kebutuhan bata.", "keywords": "lego,mosaik,bata,foto,stud,daftar bata", "since": "6.19.0"};

// Palet warna bata LEGO yang umum (nama + hex). Murni.
export const PALET_LEGO = [
  ['Putih', '#F4F4F4'],
  ['Hitam', '#1B1F23'],
  ['Merah', '#C91A09'],
  ['Biru', '#0055BF'],
  ['Kuning', '#F2CD37'],
  ['Hijau tua', '#237841'],
  ['Hijau', '#4B9F4A'],
  ['Oranye', '#FE8A18'],
  ['Ungu', '#81007B'],
  ['Cokelat', '#582A12'],
  ['Abu-abu sedang', '#6C6E68'],
  ['Abu-abu gelap', '#595D60'],
  ['Krem', '#E4CD9E'],
  ['Abu-abu muda', '#A3A2A4'],
  ['Biru sedang', '#5A93DB'],
  ['Hijau limau', '#BBE90B'],
  ['Merah muda', '#FC97AC'],
  ['Merah tua', '#720E0F'],
  ['Biru tua', '#0A3463'],
  ['Kuning muda', '#F8BB3D'],
  ['Hijau pasir', '#A0BCAC'],
  ['Cokelat muda', '#B48455'],
  ['Abu-abu biru muda', '#B4D2E4'],
  ['Magenta', '#923978'],
];

function hexKeRgb(hex) {
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
}

const PALET_RGB = PALET_LEGO.map(([nama, hex]) => ({ nama, hex, rgb: hexKeRgb(hex) }));

// Cari warna LEGO terdekat (jarak kuadrat RGB). Murni.
export function warnaLegoTerdekat(r, g, b) {
  let terbaik = 0, jarakTerbaik = Infinity;
  for (let i = 0; i < PALET_RGB.length; i++) {
    const p = PALET_RGB[i].rgb;
    const dr = r - p[0], dg = g - p[1], db = b - p[2];
    const d = dr * dr + dg * dg + db * db;
    if (d < jarakTerbaik) { jarakTerbaik = d; terbaik = i; }
  }
  return terbaik;
}

// Kuantisasi foto jadi grid mosaik (murni): tiap sel diambil warna
// rata-ratanya lalu dipetakan ke warna LEGO terdekat.
export function kuantisasiMosaik(data, lebar, tinggi, kolom) {
  const c = Math.max(8, Math.min(96, Math.round(kolom) || 32));
  const baris = Math.max(1, Math.round((c * tinggi) / lebar));
  const indeks = new Uint8Array(c * baris);
  for (let y = 0; y < baris; y++) {
    for (let x = 0; x < c; x++) {
      const x0 = Math.floor((x * lebar) / c), x1 = Math.floor(((x + 1) * lebar) / c);
      const y0 = Math.floor((y * tinggi) / baris), y1 = Math.floor(((y + 1) * tinggi) / baris);
      let r = 0, g = 0, b = 0, n = 0;
      for (let yy = y0; yy < Math.max(y0 + 1, y1); yy++) {
        for (let xx = x0; xx < Math.max(x0 + 1, x1); xx++) {
          const i = (yy * lebar + xx) * 4;
          r += data[i]; g += data[i + 1]; b += data[i + 2]; n++;
        }
      }
      indeks[y * c + x] = warnaLegoTerdekat(r / n, g / n, b / n);
    }
  }
  return { indeks, kolom: c, baris };
}

// Hitung daftar kebutuhan bata dari peta indeks (murni), urut dari
// yang terbanyak.
export function daftarBata(indeks) {
  const hitung = new Map();
  for (const i of indeks) hitung.set(i, (hitung.get(i) || 0) + 1);
  const daftar = [...hitung.entries()].map(([i, jumlah]) => ({
    nama: PALET_RGB[i].nama, hex: PALET_RGB[i].hex, jumlah,
  }));
  daftar.sort((a, b) => b.jumlah - a.jumlah);
  return { daftar, total: indeks.length };
}

export function render(root) {
  const fi = fileInput('image/*');
  const ukuranSel = T.select([
    ['16', '16 bata (kecil)'],
    ['32', '32 bata (sedang)'],
    ['48', '48 bata (besar)'],
    ['64', '64 bata (sangat besar)'],
  ], '32');
  const studCk = T.el('<input type="checkbox" checked style="width:20px;height:20px;accent-color:#fff">');
  const gridCk = T.el('<input type="checkbox" style="width:20px;height:20px;accent-color:#fff">');
  const box = T.out();
  const infoBox = T.out();
  const daftarBox = T.out();
  const cv = document.createElement('canvas');
  let img = null, hasilDaftar = null;

  function make() {
    T.hide(infoBox); T.hide(box); T.hide(daftarBox);
    if (!img) return;
    const maksSisi = 1200;
    const s = Math.min(1, maksSisi / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * s));
    const h = Math.max(1, Math.round(img.naturalHeight * s));
    const tmp = document.createElement('canvas');
    tmp.width = w; tmp.height = h;
    const tx = tmp.getContext('2d');
    tx.drawImage(img, 0, 0, w, h);
    const data = tx.getImageData(0, 0, w, h).data;
    const hasil = kuantisasiMosaik(data, w, h, +ukuranSel.value);
    const STUD = 24;
    cv.width = hasil.kolom * STUD;
    cv.height = hasil.baris * STUD;
    const ctx = cv.getContext('2d');
    for (let y = 0; y < hasil.baris; y++) {
      for (let x = 0; x < hasil.kolom; x++) {
        const warna = PALET_RGB[hasil.indeks[y * hasil.kolom + x]];
        const px = x * STUD, py = y * STUD;
        ctx.fillStyle = warna.hex;
        ctx.fillRect(px, py, STUD, STUD);
        if (studCk.checked) {
          ctx.fillStyle = 'rgba(255,255,255,0.28)';
          ctx.beginPath();
          ctx.arc(px + STUD / 2, py + STUD / 2, STUD * 0.3, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = 'rgba(0,0,0,0.18)';
          ctx.beginPath();
          ctx.arc(px + STUD / 2, py + STUD / 2 + 1, STUD * 0.3, 0, Math.PI);
          ctx.fill();
        }
        if (gridCk.checked) {
          ctx.strokeStyle = 'rgba(0,0,0,0.25)';
          ctx.lineWidth = 1;
          ctx.strokeRect(px + 0.5, py + 0.5, STUD - 1, STUD - 1);
        }
      }
    }
    cv.style.cssText = 'max-width:100%;height:auto;border-radius:10px;border:1px solid #ffffff20;display:block';
    T.show(box, '');
    box.appendChild(cv);
    hasilDaftar = daftarBata(hasil.indeks);
    let daftarHtml = '<p class="hint" style="margin-bottom:8px">Daftar bata yang dibutuhkan (total ' + hasilDaftar.total.toLocaleString('id-ID') + ' bata):</p><div style="display:flex;flex-wrap:wrap;gap:8px">';
    for (const d of hasilDaftar.daftar) {
      daftarHtml += '<div style="display:flex;align-items:center;gap:6px;border:1px solid #ffffff20;border-radius:8px;padding:4px 8px 4px 4px"><span style="width:24px;height:24px;border-radius:6px;background:' + d.hex + ';display:inline-block"></span><b>' + T.esc(d.nama) + '</b><span class="hint">x' + d.jumlah.toLocaleString('id-ID') + '</span></div>';
    }
    daftarHtml += '</div>';
    T.show(daftarBox, daftarHtml);
    T.show(infoBox, '<div class="kv"><span>Ukuran mosaik</span><b>' + hasil.kolom + 'x' + hasil.baris + ' bata</b></div>' +
      '<div class="kv"><span>Total bata</span><b>' + hasilDaftar.total.toLocaleString('id-ID') + '</b></div>' +
      '<div class="kv"><span>Warna dipakai</span><b>' + hasilDaftar.daftar.length + ' dari ' + PALET_LEGO.length + '</b></div>');
  }

  const muat = async () => {
    if (!fi.files[0]) { T.toast('Pilih foto dulu'); return; }
    try { img = await loadImage(fi.files[0]); }
    catch (e) { T.toast('File itu bukan gambar. Pilih file gambar.'); return; }
    make();
    T.toast('Mosaik LEGO jadi!');
  };

  const dlB = T.btn('Unduh PNG', async () => {
    if (!img) { T.toast('Pilih foto dulu'); return; }
    const blob = await canvasToBlob(cv, 'image/png');
    if (!blob) { T.toast('Gagal membuat file'); return; }
    const base = (fi.files[0].name || 'foto').replace(/\.[^.]*$/, '');
    T.dl(base + '-lego.png', blob, 'image/png');
    T.toast('Berhasil diunduh (' + fmtBytes(blob.size) + ')');
  }, true);

  const salinB = T.btn('Salin daftar bata', () => {
    if (!hasilDaftar) { T.toast('Buat dulu mosaiknya'); return; }
    const teks = hasilDaftar.daftar.map((d) => d.nama + ' (' + d.hex + '): ' + d.jumlah + ' bata').join('\n') +
      '\nTotal: ' + hasilDaftar.total + ' bata';
    T.copy(teks);
  });

  ukuranSel.addEventListener('change', make);
  studCk.addEventListener('change', make);
  gridCk.addEventListener('change', make);

  root.appendChild(T.el('<p class="note">🔒 ' + LOCAL_NOTE + '</p>'));
  root.appendChild(T.el('<p class="mut" style="font-size:13.5px;line-height:1.6">Foto diubah jadi mosaik bata lengkap dengan stud-nya. Di bawah gambar ada daftar berapa bata tiap warna yang dibutuhkan.</p>'));
  root.appendChild(T.field('Pilih foto', fi));
  root.appendChild(T.grid2(T.field('Lebar mosaik', ukuranSel, 'Makin banyak bata, makin detail tapi makin banyak bata yang dibutuhkan.'), T.field('Opsi', (() => {
    const w = T.el('<div style="display:flex;flex-direction:column;gap:10px;padding-top:8px"></div>');
    const a = T.el('<label style="display:flex;gap:8px;align-items:center;cursor:pointer"></label>');
    a.appendChild(studCk); a.appendChild(T.el('<span>Tonjolan stud</span>'));
    const b = T.el('<label style="display:flex;gap:8px;align-items:center;cursor:pointer"></label>');
    b.appendChild(gridCk); b.appendChild(T.el('<span>Garis antar bata</span>'));
    w.appendChild(a); w.appendChild(b);
    return w;
  })())));
  root.appendChild(T.row(T.btn('Buat Mosaik', muat, true), dlB));
  root.appendChild(T.row(salinB));
  root.appendChild(infoBox);
  root.appendChild(box);
  root.appendChild(daftarBox);
  fi.addEventListener('change', muat);
}
