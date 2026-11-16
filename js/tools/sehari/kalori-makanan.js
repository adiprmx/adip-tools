import { h as T, utils } from '../../core.js?v=6.12.2';

// Logika murni (bisa di-test di Node).
// Kalori per porsi umum dari Tabel Kalori Makanan sehari-hari (acuan TKPI
// Kemenkes). Angka dibulatkan ke satuan terdekat. Resep rumahan bisa beda.
utils.MAKANAN_KALORI = [
  { nama: 'Nasi putih', gram: 100, kkal: 175 }, { nama: 'Nasi goreng', gram: 100, kkal: 267 },
  { nama: 'Nasi uduk', gram: 200, kkal: 506 }, { nama: 'Nasi tim', gram: 100, kkal: 88 },
  { nama: 'Bubur', gram: 200, kkal: 44 }, { nama: 'Bubur ayam', gram: 200, kkal: 165 },
  { nama: 'Roti tawar', gram: 50, kkal: 128 }, { nama: 'Mie instan', gram: 50, kkal: 168 },
  { nama: 'Mie goreng', gram: 200, kkal: 321 }, { nama: 'Bihun goreng', gram: 150, kkal: 296 },
  { nama: 'Soun goreng', gram: 100, kkal: 263 }, { nama: 'Kentang goreng', gram: 150, kkal: 211 },
  { nama: 'Singkong rebus', gram: 100, kkal: 146 }, { nama: 'Ubi rebus', gram: 100, kkal: 125 },
  { nama: 'Ketan putih', gram: 120, kkal: 217 }, { nama: 'Makaroni', gram: 25, kkal: 91 },
  { nama: 'Crackers', gram: 50, kkal: 229 },
  { nama: 'Ayam panggang', gram: 100, kkal: 164 }, { nama: 'Ayam bakar bumbu kuning', gram: 100, kkal: 129 },
  { nama: 'Ayam goreng kecap', gram: 75, kkal: 359 }, { nama: 'Ayam pop', gram: 200, kkal: 265 },
  { nama: 'Ati ayam goreng', gram: 50, kkal: 98 }, { nama: 'Telur ayam rebus', gram: 60, kkal: 97 },
  { nama: 'Telur asin rebus', gram: 75, kkal: 138 }, { nama: 'Bakso daging sapi', gram: 100, kkal: 260 },
  { nama: 'Rendang daging', gram: 75, kkal: 286 }, { nama: 'Sate ayam', gram: 100, kkal: 466 },
  { nama: 'Sate kambing', gram: 180, kkal: 729 }, { nama: 'Ikan lele goreng', gram: 60, kkal: 58 },
  { nama: 'Ikan patin goreng', gram: 200, kkal: 253 }, { nama: 'Kerang rebus', gram: 100, kkal: 59 },
  { nama: 'Udang goreng besar', gram: 80, kkal: 68 }, { nama: 'Tahu goreng', gram: 100, kkal: 111 },
  { nama: 'Tahu bacem', gram: 100, kkal: 147 }, { nama: 'Tahu isi', gram: 150, kkal: 124 },
  { nama: 'Tahu sumedang', gram: 100, kkal: 113 }, { nama: 'Tempe goreng', gram: 50, kkal: 118 },
  { nama: 'Tempe bacem', gram: 50, kkal: 157 }, { nama: 'Sambal goreng tempe', gram: 50, kkal: 116 },
  { nama: 'Perkedel jagung', gram: 50, kkal: 108 }, { nama: 'Macaroni schootel', gram: 50, kkal: 177 },
  { nama: 'Pu yung hai', gram: 50, kkal: 114 }, { nama: 'Siomay', gram: 100, kkal: 361 },
  { nama: 'Bening bayam', gram: 50, kkal: 18 }, { nama: 'Sayur asam', gram: 100, kkal: 88 },
  { nama: 'Sop ayam', gram: 100, kkal: 95 }, { nama: 'Sayur lodeh', gram: 100, kkal: 61 },
  { nama: 'Cah jagung putren', gram: 100, kkal: 59 }, { nama: 'Cah kacang panjang', gram: 100, kkal: 72 },
  { nama: 'Tumis buncis', gram: 100, kkal: 52 }, { nama: 'Tumis daun singkong', gram: 120, kkal: 151 },
  { nama: 'Gudeg', gram: 150, kkal: 132 }, { nama: 'Sop sapi', gram: 260, kkal: 227 },
  { nama: 'Sop oyong telur puyuh', gram: 100, kkal: 134 }, { nama: 'Tumis kacang panjang jagung', gram: 125, kkal: 118 },
  { nama: 'Soto ayam', gram: 100, kkal: 101 }, { nama: 'Soto padang', gram: 100, kkal: 127 },
  { nama: 'Soto betawi', gram: 150, kkal: 135 }, { nama: 'Soto makasar', gram: 150, kkal: 525 },
  { nama: 'Mie bakso', gram: 200, kkal: 302 }, { nama: 'Nasi tim ayam', gram: 420, kkal: 588 },
  { nama: 'Asinan', gram: 250, kkal: 208 }, { nama: 'Toge goreng', gram: 250, kkal: 243 },
  { nama: 'Apel', gram: 160, kkal: 92 }, { nama: 'Alpukat', gram: 100, kkal: 85 },
  { nama: 'Pisang barangan', gram: 200, kkal: 236 }, { nama: 'Rambutan', gram: 100, kkal: 69 },
  { nama: 'Mangga manalagi', gram: 100, kkal: 72 }, { nama: 'Nanas', gram: 200, kkal: 104 },
  { nama: 'Jambu biji', gram: 320, kkal: 157 }, { nama: 'Jambu air', gram: 60, kkal: 35 },
  { nama: 'Sawo', gram: 100, kkal: 134 }
];
utils.cariMakanan = function (kata) {
  const q = String(kata || '').trim().toLowerCase();
  if (!q) return utils.MAKANAN_KALORI;
  return utils.MAKANAN_KALORI.filter((m) => m.nama.toLowerCase().includes(q));
};
utils.totalKalori = function (daftar) {
  return (daftar || []).reduce((a, d) => a + d.kkal * d.porsi, 0);
};

export const meta = {"id": "kalori-makanan", "name": "Kalori Makanan Indonesia", "cat": "sehari", "icon": "🍚", "desc": "Cari kalori makanan Indonesia dan jumlahkan kalori seharianmu.", "keywords": "kalori,makanan,gizi,diet,nasi,rendang,bakso,tkpi", "since": "6.11.0"};

export function render(root) {
  const cari = T.input('text', 'Cari makanan, contoh: rendang', '');
  const target = T.input('text', 'Contoh: 2000', '2000'); target.inputMode = 'decimal';
  const hasilCari = T.el('<div></div>');
  const daftarHariIni = T.el('<div></div>');
  const totalBox = T.out();
  const KUNCI = 'at-kalori-' + new Date().toISOString().slice(0, 10);
  let dimakan = [];
  try { dimakan = JSON.parse(localStorage.getItem(KUNCI) || '[]'); } catch (e) { dimakan = []; }

  function simpan() {
    try { localStorage.setItem(KUNCI, JSON.stringify(dimakan)); } catch (e) { /* abaikan */ }
  }

  function tampilHasil() {
    const daftar = utils.cariMakanan(cari.value).slice(0, 12);
    hasilCari.innerHTML = '';
    if (daftar.length === 0) {
      hasilCari.appendChild(T.el('<div class="hint">Tidak ketemu. Coba kata lain, atau tambahkan makanan sendiri di bawah.</div>'));
      return;
    }
    daftar.forEach((m) => {
      const row = T.el('<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid #2a2a2a"></div>');
      row.appendChild(T.el(`<span style="font-size:14px">${m.nama} <span style="color:#a1a1aa">(${m.gram} g)</span></span>`));
      const kanan = T.el('<span style="display:flex;gap:8px;align-items:center"></span>');
      kanan.appendChild(T.el(`<b style="font-size:14px">${m.kkal} kkal</b>`));
      kanan.appendChild(T.btn('Tambah', () => {
        const ada = dimakan.find((d) => d.nama === m.nama);
        if (ada) ada.porsi += 1;
        else dimakan.push({ nama: m.nama, kkal: m.kkal, porsi: 1 });
        simpan();
        tampilHariIni();
        T.toast(m.nama + ' ditambahkan');
      }));
      row.appendChild(kanan);
      hasilCari.appendChild(row);
    });
  }

  function tampilHariIni() {
    daftarHariIni.innerHTML = '';
    if (dimakan.length === 0) {
      daftarHariIni.appendChild(T.el('<div class="hint">Belum ada makanan hari ini. Cari dan tambahkan dari daftar di atas.</div>'));
    }
    dimakan.forEach((d, i) => {
      const row = T.el('<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid #2a2a2a"></div>');
      row.appendChild(T.el(`<span style="font-size:14px">${d.nama} x ${d.porsi}</span>`));
      const kanan = T.el('<span style="display:flex;gap:6px;align-items:center"></span>');
      kanan.appendChild(T.el(`<b style="font-size:14px">${Math.round(d.kkal * d.porsi)} kkal</b>`));
      const kurangBtn = T.btn('-', () => {
        d.porsi -= 0.5;
        if (d.porsi <= 0) dimakan.splice(i, 1);
        simpan();
        tampilHariIni();
      });
      kurangBtn.setAttribute('aria-label', 'Kurangi porsi ' + d.nama);
      kanan.appendChild(kurangBtn);
      kanan.appendChild(T.btn('Hapus', () => { dimakan.splice(i, 1); simpan(); tampilHariIni(); }));
      row.appendChild(kanan);
      daftarHariIni.appendChild(row);
    });
    const total = utils.totalKalori(dimakan);
    const t = T.num(target.value);
    T.show(totalBox,
      `<div class="kv"><span>Total kalori hari ini</span><b style="color:#fff">${T.fmt(Math.round(total))} kkal</b></div>` +
      (t > 0 ? `<div class="kv"><span>Target harian</span><b>${T.fmt(t)} kkal (sisa ${T.fmt(Math.max(0, Math.round(t - total)))} kkal)</b></div>` : '') +
      `<div class="hint">Angka kalori memakai porsi umum dari tabel gizi. Masakan rumahan bisa beda karena takaran minyak, santan, dan gula. Untuk kebutuhan kalori harian yang pas untukmu, hitung di Kalkulator BMI.</div>`
    );
  }

  const namaBaru = T.input('text', 'Nama makanan', '');
  const kkalBaru = T.input('text', 'Kalori per porsi', ''); kkalBaru.inputMode = 'decimal';

  cari.addEventListener('input', tampilHasil);
  target.addEventListener('input', tampilHariIni);

  root.appendChild(T.el('<p class="note">Cari makanan Indonesia, tambahkan yang kamu makan hari ini, dan lihat total kalorinya.</p>'));
  root.appendChild(T.field('Cari makanan', cari));
  root.appendChild(hasilCari);
  root.appendChild(T.el('<h3 style="margin-top:24px">Yang dimakan hari ini</h3>'));
  root.appendChild(daftarHariIni);
  root.appendChild(T.field('Target kalori harian (kkal)', target));
  root.appendChild(totalBox);
  root.appendChild(T.el('<h3 style="margin-top:24px">Tambah makanan sendiri</h3>'));
  root.appendChild(T.grid2(
    T.field('Nama makanan', namaBaru),
    T.field('Kalori per porsi (kkal)', kkalBaru)
  ));
  root.appendChild(T.row(
    T.btn('Tambah ke daftar hari ini', () => {
      const n = namaBaru.value.trim(), k = T.num(kkalBaru.value);
      if (!n || !(k > 0)) { T.toast('Isi nama dan kalorinya dulu'); return; }
      dimakan.push({ nama: n, kkal: k, porsi: 1 });
      simpan();
      namaBaru.value = ''; kkalBaru.value = '';
      tampilHariIni();
    }),
    T.btn('Kosongkan hari ini', () => { dimakan = []; simpan(); tampilHariIni(); })
  ));
  tampilHasil();
  tampilHariIni();
}
