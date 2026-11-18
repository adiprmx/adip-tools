import { h as T, utils } from '../../core.js';

// Logika murni (bisa di-test di Node).
// Kebutuhan pendinginan = luas (m2) x 500 BTU (teduh) s.d. x 600 BTU (kena matahari).
// 1 PK = 9.000 BTU/jam. Tiap orang tambahan di atas 2 orang = +600 BTU/jam.
// Plafon di atas 3 m menaikkan kebutuhan sebanding tingginya.
utils.PK_AC = [
  { pk: '1/2', btu: 5000, watt: 400 },
  { pk: '3/4', btu: 7000, watt: 600 },
  { pk: '1', btu: 9000, watt: 850 },
  { pk: '1 1/2', btu: 12000, watt: 1150 },
  { pk: '2', btu: 18000, watt: 1700 },
  { pk: '2 1/2', btu: 24000, watt: 2200 }
];
utils.hitungPkAc = function (o) {
  const luas = Math.max(0, Number(o.luas) || 0);
  const faktor = Number(o.faktor) || 500;
  const orang = Math.max(0, Number(o.orang) || 0);
  const jam = Math.max(0, Number(o.jam) || 0);
  const hari = Math.max(0, Number(o.hari) || 0);
  const tarif = Math.max(0, Number(o.tarif) || 0);
  const tinggi = Math.max(0, Number(o.tinggi) || 3);
  const faktorTinggi = Math.max(1, tinggi / 3);
  let btu = luas * faktor * faktorTinggi + Math.max(0, orang - 2) * 600;
  if (o.alatPanas) btu += 1000;
  const pilih = utils.PK_AC.find((x) => x.btu >= btu) || null;
  const kwh = pilih ? (pilih.watt * jam * hari) / 1000 : 0;
  return { btu, pilih, kwh, biaya: kwh * tarif };
};

/* Patokan umum teknisi AC: 500 BTU per m2 (teduh), 550 (sedang), 600 (terik).
   Tambah 600 BTU per orang di atas 2 orang. Ini perkiraan kasar, bukan ganti hitungan teknisi. */
export const FAKTOR_MATAHARI = { teduh: 500, sedang: 550, terik: 600 };

export function hitungBtu(luasM2, tinggiM, jumlahOrang, matahari, banyakAlatPanas) {
  const faktor = FAKTOR_MATAHARI[matahari] || 500;
  const faktorTinggi = Math.max(1, tinggiM / 3);
  let btu = luasM2 * faktor * faktorTinggi;
  if (jumlahOrang > 2) btu += (jumlahOrang - 2) * 600;
  if (banyakAlatPanas) btu += 1000;
  return Math.round(btu);
}

const PK_TABEL = [
  { maks: 5000, pk: '½ PK', btu: 5000 },
  { maks: 7000, pk: '¾ PK', btu: 7000 },
  { maks: 9000, pk: '1 PK', btu: 9000 },
  { maks: 12000, pk: '1½ PK', btu: 12000 },
  { maks: 18000, pk: '2 PK', btu: 18000 },
  { maks: 24000, pk: '2½ PK', btu: 24000 },
];

export function rekomendasiPk(btu) {
  for (const p of PK_TABEL) {
    if (btu <= p.maks) return p;
  }
  return null;
}

export const meta = {"id": "hitung-pk-ac", "name": "PK AC & Biaya Listrik", "cat": "sehari", "icon": "❄️", "desc": "Ukuran AC yang pas untuk ruanganmu (BTU + PK), plus biaya listriknya.", "keywords": "ac,pk ac,btu,pendingin ruangan,air conditioner,ukuran ac,kebutuhan btu,plafon", "since": "6.11.0"};

export function render(root) {
  const panjang = T.input('text', 'Contoh: 4', '4'); panjang.inputMode = 'decimal';
  const lebar = T.input('text', 'Contoh: 3', '3'); lebar.inputMode = 'decimal';
  const tinggi = T.input('text', 'mis. 3', '3'); tinggi.inputMode = 'decimal';
  const kondisi = T.select([
    ['teduh', 'Teduh: tidak kena matahari langsung'],
    ['sedang', 'Sedang: kena matahari sebagian hari'],
    ['terik', 'Terik: kena matahari langsung, banyak kaca'],
  ], 'teduh');
  const orang = T.input('text', 'Contoh: 2', '2'); orang.inputMode = 'decimal';
  const jam = T.input('text', 'Contoh: 8', '8'); jam.inputMode = 'decimal';
  const tarif = T.input('text', 'Contoh: 1444,70', '1444,70'); tarif.inputMode = 'decimal';
  const alatCek = document.createElement('input');
  alatCek.type = 'checkbox'; alatCek.id = 'btu-alat';
  const box = T.out();

  function calc() {
    const p = T.num(panjang.value), l = T.num(lebar.value);
    if (!(p > 0) || !(l > 0)) { T.show(box, '<div class="hint">Isi dulu panjang dan lebar ruangan.</div>'); return; }
    const tg = T.num(tinggi.value), org = T.num(orang.value);
    if (!isFinite(tg) || !(tg > 0) || tg > 10) { T.show(box, '<p class="err">Tinggi plafon isi 0 sampai 10 meter.</p>'); return; }
    if (!isFinite(org) || !(org >= 1) || !Number.isInteger(org)) { T.show(box, '<p class="err">Jumlah orang isi angka bulat 1 atau lebih.</p>'); return; }
    const r = utils.hitungPkAc({
      luas: p * l, faktor: FAKTOR_MATAHARI[kondisi.value] || 500, orang: org,
      jam: T.num(jam.value), hari: 30, tarif: T.num(tarif.value),
      tinggi: tg, alatPanas: alatCek.checked
    });
    if (!r.pilih) {
      T.show(box, '<div class="hint">Ruangan ini butuh pendinginan ' + T.fmt(Math.round(r.btu)) + ' BTU/jam, di atas kapasitas AC split terbesar (2 1/2 PK). Pertimbangkan memakai dua unit AC atau AC cassette/standing.</div>');
      return;
    }
    T.show(box,
      '<div class="center"><div class="dim">Kebutuhan pendinginan</div>' +
      '<div class="big">' + T.fmt(Math.round(r.btu)) + ' BTU/jam</div></div>' +
      `<div class="kv"><span>Luas ruangan</span><b>${T.fmt(p * l)} m²</b></div>` +
      `<div class="kv"><span>AC yang disarankan</span><b style="color:#fff">${r.pilih.pk} PK (kapasitas ${T.fmt(r.pilih.btu)} BTU/jam)</b></div>` +
      `<div class="kv"><span>Perkiraan daya AC</span><b>sekitar ${T.fmt(r.pilih.watt)} watt</b></div>` +
      `<div class="kv"><span>Perkiraan biaya listrik per bulan</span><b>${T.rp(r.biaya)} (${T.fmt(Math.round(r.kwh * 10) / 10)} kWh)</b></div>` +
      `<div class="hint">Dipilih kapasitas terdekat di atas kebutuhan supaya ruangan cepat dingin tanpa kerja terlalu keras. AC yang kekecilan akan bekerja terus-menerus dan boros listrik, sedangkan yang kebesaran buang uang di harga beli. Daya watt di atas adalah perkiraan untuk AC standar non-inverter, AC inverter biasanya lebih hemat. Biaya listrik dihitung 30 hari dengan tarif yang kamu isi.</div>` +
      `<div class="hint">Perkiraan kasar dari patokan umum. Hasil akhir bisa berbeda tergantung isolasi ruangan dan jenis AC.</div>`
    );
  }

  root.appendChild(T.el('<p class="hint">AC yang terlalu kecil bikin ruangan tidak dingin dan listrik boros karena kompresor kerja terus. Hitung dulu sebelum beli.</p>'));
  root.appendChild(T.grid2(
    T.field('Panjang ruangan (meter)', panjang),
    T.field('Lebar ruangan (meter)', lebar)
  ));
  root.appendChild(T.grid2(
    T.field('Tinggi plafon (meter)', tinggi, 'Biasanya 3 meter'),
    T.field('Jumlah orang di ruangan', orang)
  ));
  root.appendChild(T.field('Paparan matahari', kondisi));
  const lbl = T.el('<label style="display:flex;gap:8px;align-items:center;font-size:14px;margin:4px 0 10px"></label>');
  lbl.appendChild(alatCek);
  lbl.appendChild(document.createTextNode('Banyak peralatan yang panas (komputer, dapur, lampu sorot)'));
  root.appendChild(lbl);
  root.appendChild(T.field('AC menyala per hari (jam)', jam));
  root.appendChild(T.field('Tarif listrik (Rp per kWh)', tarif));
  root.appendChild(T.btn('Hitung', calc, true));
  root.appendChild(box);
}
