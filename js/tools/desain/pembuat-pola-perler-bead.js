import { h as T, utils, LOCAL_NOTE, fileInput, loadImage, canvasToBlob } from '../../core.js';

export const meta = {"id":"pembuat-pola-perler-bead","name":"Pembuat Pola Perler Bead","cat":"desain","icon":"🧩","desc":"Ubah gambar jadi pola manik Perler/Hama dengan hitungan manik.","keywords":"perler,hama,manik,bead,pola,pegboard,kerajinan","since":"6.19.0"};

// Palet manik Perler/Hama yang umum dijual. Nilai hex adalah pendekatan
// warna manik asli (warna manik bisa sedikit berbeda antar batch produksi).
export const PALET_PERLER = [
  ['Hitam', '#1B1B1B'], ['Putih', '#FFFFFF'], ['Merah', '#D62828'], ['Merah Muda', '#F5A9C0'],
  ['Merah Muda Terang', '#F9C6D3'], ['Oranye', '#F58220'], ['Oranye Neon', '#FF6700'],
  ['Kuning', '#FCD116'], ['Kuning Neon', '#FFFF33'], ['Emas', '#FFC20E'],
  ['Hijau Tua', '#1E7A34'], ['Hijau', '#3CB371'], ['Hijau Muda', '#7BC950'],
  ['Hijau Neon', '#39FF14'], ['Kiwi', '#8EE53F'], ['Mint', '#98FF98'],
  ['Biru Tua', '#1B4F9C'], ['Biru', '#2E7FC4'], ['Biru Muda', '#5BA8E6'],
  ['Biru Neon', '#00BFFF'], ['Langit', '#87CEEB'], ['Toska', '#40E0D0'],
  ['Teal', '#008080'], ['Ungu', '#7B2D8B'], ['Ungu Tua', '#5B2C6F'],
  ['Lavender', '#C9A0DC'], ['Plum', '#8E4585'], ['Cokelat', '#6B4226'],
  ['Cokelat Muda', '#A67C52'], ['Krem', '#FFFDD0'], ['Tan', '#D2B48C'],
  ['Persik', '#FFDAB9'], ['Coral', '#FF7F50'], ['Abu Tua', '#555555'],
  ['Abu', '#9E9E9E'], ['Abu Muda', '#D3D3D3'], ['Perak', '#C0C0C0'],
  ['Burgundy', '#800020'], ['Pink Neon', '#FF5DA2'],
];
const SIMBOL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*+-=?'.split('');

const HEX_PERLER = PALET_PERLER.map((e) => e[1]);

// Warna palet terdekat (jarak RGB berbobot). Fungsi murni.
// Memakai utils.indeksWarnaTerdekat (kanonis, G4 C1G4-R).
export function warnaTerdekat(r, g, b) {
  return utils.indeksWarnaTerdekat(r, g, b, HEX_PERLER);
}

// Piksel menjadi pola indeks palet (fungsi murni).
export function pikselKePola(data, w, h) {
  const pola = new Array(w * h);
  for (let i = 0; i < w * h; i++) {
    pola[i] = warnaTerdekat(data[i * 4], data[i * 4 + 1], data[i * 4 + 2]);
  }
  return pola;
}

export function hitungManik(pola) {
  const hitung = {};
  pola.forEach((idx) => { hitung[idx] = (hitung[idx] || 0) + 1; });
  return Object.keys(hitung).map((k) => ({ idx: parseInt(k, 10), jumlah: hitung[k] }))
    .sort((a, b) => b.jumlah - a.jumlah);
}

export function render(root) {
  root.appendChild(T.el('<p class="note">🔒 ' + LOCAL_NOTE + '</p>'));
  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Pilih gambar, lalu alat ini mengubahnya menjadi pola manik dengan warna Perler/Hama yang paling mirip. Hitungan manik dan chart pegboard tampil di bawah. Warna hex adalah pendekatan warna manik asli.</p>'));

  const fileI = fileInput('image/*');
  const ukuranSel = T.select([['15', '15 x 15 (mini)'], ['29', '29 x 29 (papan standar)'], ['49', '49 x 49 (papan besar)']], '29');
  root.appendChild(T.field('Pilih gambar', fileI));
  root.appendChild(T.field('Ukuran papan', ukuranSel));

  const box = T.out();
  const infoBox = T.out();
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'max-width:100%;height:auto;border-radius:12px;display:block;margin:0 auto;image-rendering:pixelated';
  let polaAktif = null, lebarAktif = 0, tinggiAktif = 0;

  function gambarChart() {
    if (!polaAktif) return;
    const sel = Math.max(8, Math.min(24, Math.floor(600 / Math.max(lebarAktif, tinggiAktif))));
    canvas.width = lebarAktif * sel;
    canvas.height = tinggiAktif * sel;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    polaAktif.forEach((idx, i) => {
      const x = (i % lebarAktif) * sel, y = Math.floor(i / lebarAktif) * sel;
      ctx.fillStyle = PALET_PERLER[idx][1];
      ctx.fillRect(x, y, sel, sel);
      ctx.strokeStyle = 'rgba(0,0,0,0.25)';
      ctx.strokeRect(x + 0.5, y + 0.5, sel - 1, sel - 1);
      if (sel >= 14) {
        ctx.fillStyle = '#000';
        ctx.font = 'bold ' + Math.floor(sel * 0.55) + 'px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(SIMBOL[idx] || '?', x + sel / 2, y + sel / 2 + 1);
      }
    });
  }

  function tampilInfo() {
    const daftar = hitungManik(polaAktif);
    const total = polaAktif.length;
    let html = '<div style="font-size:13.5px;margin-bottom:10px">Total <b>' + total + ' manik</b> dalam ' + daftar.length + ' warna.</div>';
    html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px">';
    daftar.forEach(({ idx, jumlah }) => {
      const [nama, hex] = PALET_PERLER[idx];
      html += '<div style="display:flex;align-items:center;gap:8px;border:1px solid var(--line);border-radius:10px;padding:8px">' +
        '<span style="width:22px;height:22px;border-radius:6px;background:' + hex + ';border:1px solid rgba(255,255,255,0.2);flex:none"></span>' +
        '<span style="font-size:12.5px;line-height:1.3"><b>' + T.esc(nama) + '</b> (' + (SIMBOL[idx] || '?') + ')<br>' + jumlah + ' manik</span></div>';
    });
    html += '</div>';
    T.show(infoBox, html);
  }

  async function proses(img) {
    const ukuran = parseInt(ukuranSel.value, 10);
    const rasio = img.naturalWidth / img.naturalHeight;
    let w, h;
    if (rasio >= 1) { w = ukuran; h = Math.max(1, Math.round(ukuran / rasio)); }
    else { h = ukuran; w = Math.max(1, Math.round(ukuran * rasio)); }
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    if (!ctx) { T.toast('Gambar tidak bisa diproses di perangkat ini'); return; }
    ctx.drawImage(img, 0, 0, w, h);
    const d = ctx.getImageData(0, 0, w, h);
    polaAktif = pikselKePola(d.data, w, h);
    lebarAktif = w; tinggiAktif = h;
    gambarChart();
    T.show(box, '');
    box.appendChild(canvas);
    tampilInfo();
  }

  let imgTerakhir = null;
  fileI.addEventListener('change', async () => {
    if (!fileI.files[0]) return;
    try {
      imgTerakhir = await loadImage(fileI.files[0]);
      proses(imgTerakhir);
    } catch (e) { T.toast('File itu bukan gambar. Pilih file gambar.'); }
  });
  ukuranSel.addEventListener('change', () => { if (imgTerakhir) proses(imgTerakhir); });

  const dlPng = T.btn('Unduh Chart PNG', async () => {
    if (!polaAktif) { T.toast('Pilih gambar dulu'); return; }
    try {
      const blob = await canvasToBlob(canvas, 'image/png');
      if (!blob) { T.toast('Gambarnya tidak bisa dibuat. Coba lagi.'); return; }
      T.dl('pola-perler.png', blob, 'image/png');
      T.toast('Berhasil diunduh');
    } catch (e) { T.toast('Gambarnya tidak bisa diunduh. Coba lagi.'); }
  }, true);
  const dlCsv = T.btn('Unduh Daftar Manik (CSV)', () => {
    if (!polaAktif) { T.toast('Pilih gambar dulu'); return; }
    const daftar = hitungManik(polaAktif);
    let csv = 'Simbol,Warna,Hex,Jumlah\n';
    daftar.forEach(({ idx, jumlah }) => {
      csv += (SIMBOL[idx] || '?') + ',' + PALET_PERLER[idx][0] + ',' + PALET_PERLER[idx][1] + ',' + jumlah + '\n';
    });
    T.dl('daftar-manik-perler.csv', csv, 'text/csv');
    T.toast('Berhasil diunduh');
  });

  root.appendChild(T.row(dlPng, dlCsv));
  root.appendChild(box);
  root.appendChild(infoBox);
  T.show(box, '<div class="dim center" style="padding:14px 0">Chart polamu akan tampil di sini.</div>');
  T.onLeave(() => { polaAktif = null; imgTerakhir = null; });
}
