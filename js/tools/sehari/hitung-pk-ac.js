import { h as T, utils } from '../../core.js?v=6.12.1';

// Logika murni (bisa di-test di Node).
// Kebutuhan pendinginan = luas (m2) x 500 BTU (teduh) s.d. x 600 BTU (kena matahari).
// 1 PK = 9.000 BTU/jam. Tiap orang tambahan di atas 2 orang = +600 BTU/jam.
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
  const btu = luas * faktor + Math.max(0, orang - 2) * 600;
  const pilih = utils.PK_AC.find((x) => x.btu >= btu) || null;
  const kwh = pilih ? (pilih.watt * jam * hari) / 1000 : 0;
  return { btu, pilih, kwh, biaya: kwh * tarif };
};

export const meta = {"id": "hitung-pk-ac", "name": "PK AC & Biaya Listrik", "cat": "sehari", "icon": "❄️", "desc": "Ukuran AC yang pas untuk ruanganmu, plus biaya listriknya.", "keywords": "ac,pk ac,btu,pendingin ruangan,air conditioner,ukuran ac", "since": "6.11.0"};

export function render(root) {
  const panjang = T.input('text', 'Contoh: 4', '4'); panjang.inputMode = 'decimal';
  const lebar = T.input('text', 'Contoh: 3', '3'); lebar.inputMode = 'decimal';
  const kondisi = T.select([['500', 'Teduh, jarang kena matahari langsung'], ['600', 'Kena matahari langsung / banyak jendela']], '500');
  const orang = T.input('text', 'Contoh: 2', '2'); orang.inputMode = 'decimal';
  const jam = T.input('text', 'Contoh: 8', '8'); jam.inputMode = 'decimal';
  const tarif = T.input('text', 'Contoh: 1444,70', '1444,70'); tarif.inputMode = 'decimal';
  const box = T.out();

  function calc() {
    const p = T.num(panjang.value), l = T.num(lebar.value);
    if (!(p > 0) || !(l > 0)) { T.show(box, '<div class="hint">Isi dulu panjang dan lebar ruangan.</div>'); return; }
    const r = utils.hitungPkAc({
      luas: p * l, faktor: T.num(kondisi.value), orang: T.num(orang.value),
      jam: T.num(jam.value), hari: 30, tarif: T.num(tarif.value)
    });
    if (!r.pilih) {
      T.show(box, '<div class="hint">Ruangan ini butuh pendinginan ' + T.fmt(Math.round(r.btu)) + ' BTU/jam, di atas kapasitas AC split terbesar (2 1/2 PK). Pertimbangkan memakai dua unit AC atau AC cassette/standing.</div>');
      return;
    }
    T.show(box,
      `<div class="kv"><span>Luas ruangan</span><b>${T.fmt(p * l)} m²</b></div>` +
      `<div class="kv"><span>Kebutuhan pendinginan</span><b>${T.fmt(Math.round(r.btu))} BTU/jam</b></div>` +
      `<div class="kv"><span>AC yang disarankan</span><b style="color:#fff">${r.pilih.pk} PK (kapasitas ${T.fmt(r.pilih.btu)} BTU/jam)</b></div>` +
      `<div class="kv"><span>Perkiraan daya AC</span><b>sekitar ${T.fmt(r.pilih.watt)} watt</b></div>` +
      `<div class="kv"><span>Perkiraan biaya listrik per bulan</span><b>${T.rp(r.biaya)} (${T.fmt(Math.round(r.kwh * 10) / 10)} kWh)</b></div>` +
      `<div class="hint">AC yang kekecilan akan bekerja terus-menerus dan boros listrik, sedangkan yang kebesaran buang uang di harga beli. Daya watt di atas adalah perkiraan untuk AC standar non-inverter, AC inverter biasanya lebih hemat. Biaya listrik dihitung 30 hari dengan tarif yang kamu isi.</div>`
    );
  }

  root.appendChild(T.grid2(
    T.field('Panjang ruangan (meter)', panjang),
    T.field('Lebar ruangan (meter)', lebar)
  ));
  root.appendChild(T.field('Kondisi ruangan', kondisi));
  root.appendChild(T.grid2(
    T.field('Jumlah orang di ruangan', orang),
    T.field('AC menyala per hari (jam)', jam)
  ));
  root.appendChild(T.field('Tarif listrik (Rp per kWh)', tarif));
  root.appendChild(T.btn('Hitung', calc, true));
  root.appendChild(box);
}
