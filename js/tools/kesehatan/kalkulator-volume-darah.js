import { h as T, esc, utils } from '../../core.js';

// Volume darah (Nadler dkk., Surgery 1962), tinggi dalam meter,
// berat dalam kg, hasil dalam liter:
// pria:   BV = 0,3669 x H^3 + 0,03219 x W + 0,6041
// wanita: BV = 0,3561 x H^3 + 0,03308 x W + 0,1833
// Perkiraan sederhana yang juga umum dipakai: 70 mL/kg (pria) dan
// 65 mL/kg (wanita).
export function volumeDarahNadler(beratKg, tinggiCm, wanita) {
  const h = tinggiCm / 100;
  const h3 = h * h * h;
  if (wanita) return 0.3561 * h3 + 0.03308 * beratKg + 0.1833;
  return 0.3669 * h3 + 0.03219 * beratKg + 0.6041;
}

export function volumeDarahSederhana(beratKg, wanita) {
  return (beratKg * (wanita ? 65 : 70)) / 1000;
}
utils.volumeDarahNadler = volumeDarahNadler;
utils.volumeDarahSederhana = volumeDarahSederhana;

export const meta = {"id": "kalkulator-volume-darah", "name": "Kalkulator Volume Darah", "cat": "kesehatan", "icon": "🩸", "desc": "Perkiraan jumlah darah di tubuhmu dari berat dan tinggi badan, dengan rumus Nadler yang dipakai tenaga medis.", "keywords": "volume darah,jumlah darah,nadler,donor darah,transfusi,darah", "since": "6.19.0"};
export function render(root) {
  const berat = T.input('number', 'Berat badan (kg)', '70');
  const tinggi = T.input('number', 'Tinggi badan (cm)', '170');
  const gender = T.select([['pria', 'Pria'], ['wanita', 'Wanita']], 'pria');
  const box = T.out();

  const hitung = () => {
    const br = T.num(berat.value);
    const tg = T.num(tinggi.value);
    if (!(br >= 20 && br <= 300)) {
      T.show(box, '<span class="err">Isi berat badan antara 20 sampai 300 kg.</span>');
      return;
    }
    if (!(tg >= 100 && tg <= 250)) {
      T.show(box, '<span class="err">Isi tinggi badan antara 100 sampai 250 cm.</span>');
      return;
    }
    const wanita = gender.value === 'wanita';
    const nadler = volumeDarahNadler(br, tg, wanita);
    const sederhana = volumeDarahSederhana(br, wanita);
    T.show(box,
      '<div class="center"><div class="dim">Perkiraan volume darah (rumus Nadler)</div>' +
      '<div class="big">' + utils.fmtDes(nadler, 2) + ' L</div>' +
      '<div class="dim">sekitar ' + T.fmt(Math.round(nadler * 1000)) + ' mL</div></div>' +
      '<div class="kv"><span class="k">Perkiraan sederhana (' + (wanita ? '65' : '70') + ' mL/kg)</span><span class="v">' + utils.fmtDes(sederhana, 2) + ' L</span></div>' +
      '<div class="kv"><span class="k">Donor darah sekali (350 mL)</span><span class="v">sekitar ' + utils.fmtDes(350 / (nadler * 1000) * 100, 1) + '% dari darahmu</span></div>' +
      '<p class="hint">Rumus Nadler dipakai tenaga medis sebagai perkiraan, misalnya untuk donor darah, transfusi, dan perkiraan kehilangan darah. ' +
      'Angka ini BUKAN diagnosis dan bukan pengukuran langsung. Volume darah nyata bervariasi menurut hidrasi, kehamilan, dan kondisi kesehatan. ' +
      'Untuk keperluan medis (donor, operasi, transfusi), tim medis yang menentukan angkanya.</p>');
  };

  root.appendChild(T.grid2(
    T.field('Berat badan (kg)', berat),
    T.field('Tinggi badan (cm)', tinggi),
  ));
  root.appendChild(T.field('Jenis kelamin', gender));
  root.appendChild(T.btn('Hitung', hitung, true));
  root.appendChild(box);
  hitung();
}
