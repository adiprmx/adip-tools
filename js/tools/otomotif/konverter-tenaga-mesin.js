import { h as T, utils, kv } from '../../core.js';

// Konversi tenaga mesin. 1 HP (tenaga kuda mekanis) = 745,7 watt;
// 1 PS (Pferdestarke, tenaga kuda metrik) = 735,49875 watt; 1 kW = 1.000 watt.
// Jadi 1 HP = 1,01387 PS. Torsi dari tenaga dan putaran mesin:
// T (N.m) = P (watt) x 60 / (2 x pi x RPM).
export function konversiTenaga(nilai, dari) {
  const v = Math.max(0, Number(nilai) || 0);
  const keWatt = { w: 1, kw: 1000, hp: 745.7, ps: 735.49875 };
  const w = v * (keWatt[dari] || 1);
  return { w, kw: w / 1000, hp: w / 745.7, ps: w / 735.49875 };
}
export function torsiDariTenaga(watt, rpm) {
  const r = Math.max(0, Number(rpm) || 0);
  return r > 0 ? watt * 60 / (2 * Math.PI * r) : 0;
}
utils.konversiTenagaMesin = konversiTenaga;

export const meta = {"id": "konverter-tenaga-mesin", "name": "Konverter Tenaga Mesin", "cat": "otomotif", "icon": "🐎", "desc": "HP, PS, kW, watt: ubah satuan tenaga mesin dan lihat torsinya pada putaran tertentu.", "keywords": "hp,ps,kw,watt,tenaga,mesin,horsepower,daya,torsi,rpm,konversi", "since": "6.19.0"};
export function render(root) {
  const nilaiI = T.input('text', 'cth: 150', '150'); nilaiI.inputMode = 'decimal';
  const dariSel = T.select([['hp', 'HP (tenaga kuda)'], ['ps', 'PS (tenaga kuda metrik)'], ['kw', 'kW (kilowatt)'], ['w', 'W (watt)']], 'hp');
  const rpmI = T.input('text', 'cth: 6000', ''); rpmI.inputMode = 'decimal';
  const box = T.out();

  const hitung = () => {
    const nilai = T.num(nilaiI.value) || 0;
    if (!(nilai > 0)) { T.hide(box); return; }
    const r = konversiTenaga(nilai, dariSel.value);
    const rpm = T.num(rpmI.value) || 0;
    const torsi = torsiDariTenaga(r.w, rpm);
    const f = (x) => T.fmt(Math.round(x * 100) / 100);
    T.show(box,
      '<div class="big">' + f(r.hp) + ' HP</div>' +
      '<p class="center mut">Tenaga mesinmu dalam semua satuan.</p>' +
      kv('PS (tenaga kuda metrik)', f(r.ps) + ' PS') +
      kv('Kilowatt', f(r.kw) + ' kW') +
      kv('Watt', f(r.w) + ' W') +
      (rpm > 0 ? kv('Torsi pada ' + T.fmt(rpm) + ' RPM', f(torsi) + ' N.m') : '') +
      '<p class="hint">HP dan PS beda tipis: 1 HP = 1,014 PS. Spesifikasi mobil Eropa umumnya memakai PS (atau kW), mobil Amerika dan Jepang sering memakai HP. Torsi dihitung dari tenaga pada putaran itu; torsi puncak mesin biasanya tercapai di putaran yang berbeda dari tenaga puncak.</p>');
  };
  [nilaiI, dariSel, rpmI].forEach((i) => i.addEventListener('input', hitung));
  dariSel.addEventListener('change', hitung);

  root.appendChild(T.el('<p class="note">Brosur bilang 150 PS, forum bilang 148 HP. Sama saja, cuma beda satuan. Masukkan angkanya dan isi RPM kalau mau tahu torsinya.</p>'));
  root.appendChild(T.grid2(
    T.field('Tenaga mesin', nilaiI),
    T.field('Satuan asal', dariSel)
  ));
  root.appendChild(T.field('Putaran mesin (RPM, opsional)', rpmI, 'Diisi kalau mau menghitung torsi pada putaran itu'));
  root.appendChild(box);
  hitung();
}
