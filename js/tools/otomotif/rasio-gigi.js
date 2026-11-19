import { h as T, utils, kv } from '../../core.js';

// Rasio gigi: rasio = jumlah gigi gir yang digerakkan (belakang) / jumlah
// gigi gir penggerak (depan). Rasio 3,5:1 artinya gir depan berputar 3,5 kali
// untuk satu putaran gir belakang. Putaran keluar = putaran masuk / rasio.
// Torsi keluar = torsi masuk x rasio (mengabaikan rugi gesekan).
// Kecepatan = keliling roda x putaran roda: v (km/jam) = pi x D (m) x RPM
// roda x 60 / 1000. Rasio besar = tarikan kuat, top speed rendah; rasio
// kecil = sebaliknya.
export function hitungRasioGigi(o) {
  const depan = Math.max(0, Number(o.depan) || 0);
  const belakang = Math.max(0, Number(o.belakang) || 0);
  const rasio = depan > 0 ? belakang / depan : 0;
  const rpmIn = Math.max(0, Number(o.rpm) || 0);
  const rpmOut = rasio > 0 ? rpmIn / rasio : 0;
  const torsiIn = Math.max(0, Number(o.torsi) || 0);
  const torsiOut = torsiIn * rasio;
  const dM = Math.max(0, Number(o.diameterBan) || 0) / 100;
  const kec = dM > 0 && rpmOut > 0 ? Math.PI * dM * rpmOut * 60 / 1000 : 0;
  return { rasio, rpmOut, torsiOut, kecepatan: kec };
}
utils.rasioGigi = hitungRasioGigi;

export const meta = {"id": "rasio-gigi", "name": "Rasio Gigi", "cat": "otomotif", "icon": "⚙️", "desc": "Rasio gir dari jumlah gigi depan-belakang, plus putaran roda, torsi ke roda, dan kecepatan.", "keywords": "rasio,gigi,gir,gear,rantai,sprocket,final drive,putaran,torsi", "since": "6.19.0"};
export function render(root) {
  const depanI = T.input('text', 'cth: 14', '14'); depanI.inputMode = 'decimal';
  const belakangI = T.input('text', 'cth: 42', '42'); belakangI.inputMode = 'decimal';
  const rpmI = T.input('text', 'cth: 8000', ''); rpmI.inputMode = 'decimal';
  const torsiI = T.input('text', 'cth: 20', ''); torsiI.inputMode = 'decimal';
  const banI = T.input('text', 'cth: 60', ''); banI.inputMode = 'decimal';
  const box = T.out();

  const hitung = () => {
    const depan = T.num(depanI.value) || 0;
    const belakang = T.num(belakangI.value) || 0;
    if (!(depan > 0) || !(belakang > 0)) { T.hide(box); return; }
    const r = hitungRasioGigi({
      depan, belakang, rpm: T.num(rpmI.value), torsi: T.num(torsiI.value), diameterBan: T.num(banI.value),
    });
    const f = (x) => T.fmt(Math.round(x * 100) / 100);
    T.show(box,
      '<div class="big">' + f(r.rasio) + ' : 1</div>' +
      '<p class="center mut">Gir depan berputar ' + f(r.rasio) + ' kali untuk satu putaran gir belakang.</p>' +
      ((T.num(rpmI.value) || 0) > 0 ? kv('Putaran roda', f(r.rpmOut) + ' RPM') : '') +
      ((T.num(torsiI.value) || 0) > 0 ? kv('Torsi ke roda', f(r.torsiOut) + ' N.m') : '') +
      (r.kecepatan > 0 ? kv('Kecepatan', f(r.kecepatan) + ' km/jam') : '') +
      '<p class="hint">Ganti gir belakang lebih besar = rasio naik = tarikan bawah lebih galak tapi top speed turun. Ganti gir depan satu mata efeknya kira-kira setara ganti gir belakang tiga mata. Torsi ke roda dihitung tanpa rugi gesekan rantai dan transmisi, jadi angka sebenarnya sedikit lebih kecil.</p>');
  };
  [depanI, belakangI, rpmI, torsiI, banI].forEach((i) => i.addEventListener('input', hitung));

  root.appendChild(T.el('<p class="note">Mau ganti gir motor atau mobil? Masukkan jumlah gigi gir depan dan belakang. Isi juga putaran mesin, torsi, dan diameter ban kalau mau hasil lengkap.</p>'));
  root.appendChild(T.grid2(
    T.field('Gigi gir depan (penggerak)', depanI),
    T.field('Gigi gir belakang (yang digerakkan)', belakangI)
  ));
  root.appendChild(T.grid2(
    T.field('Putaran mesin (RPM, opsional)', rpmI),
    T.field('Torsi mesin (N.m, opsional)', torsiI)
  ));
  root.appendChild(T.field('Diameter luar ban (cm, opsional)', banI, 'Diukur dari ujung ke ujung ban, untuk hitung kecepatan'));
  root.appendChild(box);
  hitung();
}
