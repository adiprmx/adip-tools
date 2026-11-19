import { h as T, utils, LOCAL_NOTE, fileInput, loadImage, canvasToBlob } from '../../core.js';

export const meta = {"id":"pembuat-pola-sulam","name":"Pembuat Pola Sulam","cat":"desain","icon":"🧵","desc":"Ubah foto jadi pola cross stitch dengan warna benang DMC.","keywords":"sulam,cross stitch,dmc,benang,pola,jahit,skein","since":"6.19.0"};

// Palet benang DMC yang umum. Kode dan nama mengikuti katalog DMC; nilai hex
// adalah pendekatan warna benang asli.
export const PALET_DMC = [
  ['310', 'Hitam', '#000000'], ['B5200', 'Putih Salju', '#FFFFFF'], ['3865', 'Putih Musim Dingin', '#F5F5F0'],
  ['321', 'Merah', '#C1272D'], ['666', 'Merah Terang', '#E30613'], ['349', 'Korali', '#E94E4E'],
  ['604', 'Merah Muda Terang', '#F48FB1'], ['602', 'Merah Muda', '#E87A9B'], ['3806', 'Pink', '#E84393'],
  ['3688', 'Mauve', '#C48BB8'], ['963', 'Rose Berdebu', '#E8A0A8'], ['224', 'Pink Kerang', '#F5C6C6'],
  ['720', 'Oranye', '#F28C28'], ['970', 'Oranye Terang', '#FF7F2A'], ['973', 'Kuning', '#F2C200'],
  ['726', 'Kuning Terang', '#FFD900'], ['3823', 'Kuning Pucat', '#F9E076'], ['437', 'Tan', '#C19A6B'],
  ['839', 'Cokelat Beige', '#8B6F4E'], ['840', 'Cokelat', '#7A5C3E'], ['3031', 'Cokelat Mocha', '#6B4226'],
  ['801', 'Cokelat Kopi', '#4B2E1A'], ['702', 'Hijau Kelly', '#1B7A43'], ['3346', 'Hijau Hunter', '#1E5B3A'],
  ['937', 'Hijau Alpukat', '#5C7A3A'], ['3348', 'Hijau Kuning', '#B5C65B'], ['3819', 'Hijau Lumut', '#7A9A4A'],
  ['798', 'Biru Delft Gelap', '#1B3A6B'], ['820', 'Biru Royal', '#1B2F9C'], ['799', 'Biru Delft', '#2E5AAC'],
  ['800', 'Biru Delft Pucat', '#7FA8D9'], ['995', 'Biru Elektrik Gelap', '#0072BC'], ['996', 'Biru Elektrik', '#00A0DC'],
  ['3766', 'Biru Merak', '#5B9BD5'], ['597', 'Toska', '#0097A7'], ['3808', 'Toska Muda', '#4ECDC4'],
  ['959', 'Hijau Laut', '#5BA8A0'], ['552', 'Ungu', '#5B2C8C'], ['550', 'Ungu Tua', '#7B2D8B'],
  ['209', 'Lavender', '#C3A6D9'], ['554', 'Ungu Muda', '#9B59B6'], ['3607', 'Plum', '#8E44AD'],
  ['948', 'Persik', '#FFDAB9'], ['844', 'Abu Berang', '#8A7A6B'], ['413', 'Abu Pewter', '#6E6E6E'],
  ['415', 'Abu Mutiara', '#B8B8B8'], ['318', 'Abu Baja', '#A9A9A9'], ['317', 'Abu Pewter Gelap', '#7F7F7F'],
  ['535', 'Abu Ash', '#5A5A5A'],
];
const SIMBOL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*+-=?'.split('');
// Perkiraan tusuk per skein DMC (kain 14 count, 2 helai benang).
export const TUSUK_PER_SKEIN = 2000;

const HEX_DMC = PALET_DMC.map((e) => e[2]);

// Warna DMC terdekat (jarak RGB berbobot). Fungsi murni.
// Memakai utils.indeksWarnaTerdekat (kanonis, G4 C1G4-R).
export function warnaDmcTerdekat(r, g, b) {
  return utils.indeksWarnaTerdekat(r, g, b, HEX_DMC);
}

export function pikselKePolaSulam(data, w, h) {
  const pola = new Array(w * h);
  for (let i = 0; i < w * h; i++) {
    pola[i] = warnaDmcTerdekat(data[i * 4], data[i * 4 + 1], data[i * 4 + 2]);
  }
  return pola;
}

export function hitungBenang(pola) {
  const hitung = {};
  pola.forEach((idx) => { hitung[idx] = (hitung[idx] || 0) + 1; });
  return Object.keys(hitung).map((k) => {
    const jumlah = hitung[k];
    return { idx: parseInt(k, 10), jumlah, skein: Math.max(1, Math.ceil(jumlah / TUSUK_PER_SKEIN)) };
  }).sort((a, b) => b.jumlah - a.jumlah);
}

export function render(root) {
  root.appendChild(T.el('<p class="note">🔒 ' + LOCAL_NOTE + '</p>'));
  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Pilih foto, lalu alat ini mengubahnya menjadi pola cross stitch dengan warna benang DMC terdekat. Hitungan tusuk dan perkiraan skein tampil di bawah. Perkiraan skein memakai patokan 1 skein untuk 2.000 tusuk (kain 14 count, 2 helai).</p>'));

  const fileI = fileInput('image/*');
  const ukuranSel = T.select([['50', '50 tusuk (kecil)'], ['100', '100 tusuk (sedang)'], ['150', '150 tusuk (besar)']], '100');
  root.appendChild(T.field('Pilih foto', fileI));
  root.appendChild(T.field('Lebar pola', ukuranSel));

  const box = T.out();
  const infoBox = T.out();
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'max-width:100%;height:auto;border-radius:12px;display:block;margin:0 auto;image-rendering:pixelated';
  let polaAktif = null, lebarAktif = 0, tinggiAktif = 0;

  function gambarChart() {
    if (!polaAktif) return;
    const sel = Math.max(4, Math.min(18, Math.floor(600 / Math.max(lebarAktif, tinggiAktif))));
    canvas.width = lebarAktif * sel;
    canvas.height = tinggiAktif * sel;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    polaAktif.forEach((idx, i) => {
      const x = (i % lebarAktif) * sel, y = Math.floor(i / lebarAktif) * sel;
      ctx.fillStyle = PALET_DMC[idx][2];
      ctx.fillRect(x, y, sel, sel);
      if (sel >= 10) {
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.strokeRect(x + 0.5, y + 0.5, sel - 1, sel - 1);
      }
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
    const daftar = hitungBenang(polaAktif);
    const total = polaAktif.length;
    const totalSkein = daftar.reduce((s, d) => s + d.skein, 0);
    let html = '<div style="font-size:13.5px;margin-bottom:10px">Total <b>' + total + ' tusuk</b> dalam ' + daftar.length + ' warna, perkiraan <b>' + totalSkein + ' skein</b> benang.</div>';
    html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:8px">';
    daftar.forEach(({ idx, jumlah, skein }) => {
      const [kode, nama, hex] = PALET_DMC[idx];
      html += '<div style="display:flex;align-items:center;gap:8px;border:1px solid var(--line);border-radius:10px;padding:8px">' +
        '<span style="width:22px;height:22px;border-radius:6px;background:' + hex + ';border:1px solid rgba(255,255,255,0.2);flex:none"></span>' +
        '<span style="font-size:12.5px;line-height:1.3"><b>DMC ' + T.esc(kode) + '</b> ' + T.esc(nama) + ' (' + (SIMBOL[idx] || '?') + ')<br>' + jumlah + ' tusuk, ' + skein + ' skein</span></div>';
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
    polaAktif = pikselKePolaSulam(d.data, w, h);
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
    if (!polaAktif) { T.toast('Pilih foto dulu'); return; }
    try {
      const blob = await canvasToBlob(canvas, 'image/png');
      if (!blob) { T.toast('Gambarnya tidak bisa dibuat. Coba lagi.'); return; }
      T.dl('pola-sulam.png', blob, 'image/png');
      T.toast('Berhasil diunduh');
    } catch (e) { T.toast('Gambarnya tidak bisa diunduh. Coba lagi.'); }
  }, true);
  const dlCsv = T.btn('Unduh Daftar Benang (CSV)', () => {
    if (!polaAktif) { T.toast('Pilih foto dulu'); return; }
    const daftar = hitungBenang(polaAktif);
    let csv = 'Simbol,Kode DMC,Warna,Hex,Tusuk,Skein\n';
    daftar.forEach(({ idx, jumlah, skein }) => {
      csv += (SIMBOL[idx] || '?') + ',' + PALET_DMC[idx][0] + ',' + PALET_DMC[idx][1] + ',' + PALET_DMC[idx][2] + ',' + jumlah + ',' + skein + '\n';
    });
    T.dl('daftar-benang-dmc.csv', csv, 'text/csv');
    T.toast('Berhasil diunduh');
  });

  root.appendChild(T.row(dlPng, dlCsv));
  root.appendChild(box);
  root.appendChild(infoBox);
  T.show(box, '<div class="dim center" style="padding:14px 0">Chart polamu akan tampil di sini.</div>');
  T.onLeave(() => { polaAktif = null; imgTerakhir = null; });
}
