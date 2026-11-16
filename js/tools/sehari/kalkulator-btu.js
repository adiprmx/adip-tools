import { h as T, kv } from '../../core.js?v=6.12.2';

export const meta = {"id":"kalkulator-btu","name":"Kebutuhan BTU AC","cat":"sehari","icon":"❄️","desc":"Berapa BTU dan PK AC yang cocok untuk ukuran ruanganmu.","keywords":"btu,ac,pk,air conditioner,ruangan,dingin","since":"6.11.0"};

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

export function render(root) {
  const panjangInp = T.input('text', 'mis. 4', ''); panjangInp.inputMode = 'decimal';
  const lebarInp = T.input('text', 'mis. 3', ''); lebarInp.inputMode = 'decimal';
  const tinggiInp = T.input('text', 'mis. 3', '3'); tinggiInp.inputMode = 'decimal';
  const orangInp = T.input('text', 'mis. 2', '2'); orangInp.inputMode = 'numeric';
  const matahariSel = T.select([
    ['teduh', 'Teduh: tidak kena matahari langsung'],
    ['sedang', 'Sedang: kena matahari sebagian hari'],
    ['terik', 'Terik: kena matahari langsung, banyak kaca'],
  ], 'sedang');
  const alatCek = document.createElement('input');
  alatCek.type = 'checkbox'; alatCek.id = 'btu-alat';
  const out = T.out();

  const hitung = () => {
    const pj = T.num(panjangInp.value), lb = T.num(lebarInp.value);
    const tg = T.num(tinggiInp.value), org = T.num(orangInp.value);
    if (!isFinite(pj) || !(pj > 0) || !isFinite(lb) || !(lb > 0)) {
      T.show(out, '<p class="err">Isi panjang dan lebar ruangan dengan angka lebih dari 0.</p>'); return;
    }
    if (!isFinite(tg) || !(tg > 0) || tg > 10) { T.show(out, '<p class="err">Tinggi plafon isi 0 sampai 10 meter.</p>'); return; }
    if (!isFinite(org) || !(org >= 1) || !Number.isInteger(org)) { T.show(out, '<p class="err">Jumlah orang isi angka bulat 1 atau lebih.</p>'); return; }
    const luas = pj * lb;
    const btu = hitungBtu(luas, tg, org, matahariSel.value, alatCek.checked);
    const pk = rekomendasiPk(btu);
    T.show(out,
      '<div class="center"><div class="dim">Kebutuhan pendinginan</div>' +
      '<div class="big">' + T.fmt(btu) + ' BTU/jam</div></div>' +
      kv('Luas ruangan', String(Math.round(luas * 100) / 100).replace('.', ',') + ' m²') +
      (pk
        ? kv('AC yang cocok', '<b>' + pk.pk + ' (' + T.fmt(pk.btu) + ' BTU/jam)</b>') +
          '<p class="hint">Dipilih kapasitas terdekat di atas kebutuhan supaya ruangan cepat dingin tanpa kerja terlalu keras.</p>'
        : '<p class="warn">Kebutuhan di atas 24.000 BTU/jam. Ruangan sebesar ini biasanya butuh 2 unit AC atau AC kapasitas besar, sebaiknya tanya teknisi.</p>') +
      '<p class="hint">Perkiraan kasar dari patokan umum. Hasil akhir bisa berbeda tergantung isolasi ruangan dan jenis AC.</p>');
  };

  root.appendChild(T.el('<p class="hint">AC yang terlalu kecil bikin ruangan tidak dingin dan listrik boros karena kompresor kerja terus. Hitung dulu sebelum beli.</p>'));
  root.appendChild(T.grid2(
    T.field('Panjang ruangan (meter)', panjangInp),
    T.field('Lebar ruangan (meter)', lebarInp)
  ));
  root.appendChild(T.grid2(
    T.field('Tinggi plafon (meter)', tinggiInp, 'Biasanya 3 meter'),
    T.field('Jumlah orang di ruangan', orangInp)
  ));
  root.appendChild(T.field('Paparan matahari', matahariSel));
  const lbl = T.el('<label style="display:flex;gap:8px;align-items:center;font-size:14px;margin:4px 0 10px"></label>');
  lbl.appendChild(alatCek);
  lbl.appendChild(document.createTextNode('Banyak peralatan yang panas (komputer, dapur, lampu sorot)'));
  root.appendChild(lbl);
  root.appendChild(T.row(T.btn('Hitung BTU', hitung, true)));
  root.appendChild(out);
}
