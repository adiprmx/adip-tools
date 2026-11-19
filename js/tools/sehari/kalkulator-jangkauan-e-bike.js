import { h as T, kv, utils } from '../../core.js';

// Jangkauan e-bike: kapasitas baterai (Wh) dibagi pemakaian (Wh per km).
// Baterai dari volt x ampere-jam: Wh = V x Ah. Pemakaian umum: eco sekitar
// 5, normal sekitar 8, turbo sekitar 12 Wh per km (bisa diubah).
export const PAKAI_EBIKE = { eco: 5, normal: 8, turbo: 12 };

export function whBaterai(volt, ah) {
  const v = Number(volt), a = Number(ah);
  if (!(v > 0) || !(a > 0)) return null;
  return v * a;
}

export function jangkauanEBike(wh, pakaiPerKm) {
  const w = Number(wh), p = Number(pakaiPerKm);
  if (!(w > 0) || !(p > 0)) return null;
  return w / p;
}
utils.jangkauanEBike = jangkauanEBike;
utils.whBaterai = whBaterai;

export const meta = {"id": "kalkulator-jangkauan-e-bike", "name": "Kalkulator Jangkauan E-Bike", "cat": "sehari", "icon": "🚴", "desc": "Perkiraan jarak tempuh sepeda listrik dari kapasitas baterai dan mode bantuan kayuh.", "keywords": "e-bike,sepeda listrik,jangkauan,baterai,wh,km,eco,turbo", "since": "6.19.0"};
export function render(root) {
  const cara = T.select([
    ['wh', 'Saya tahu kapasitas baterai (Wh)'],
    ['va', 'Hitung dari volt dan ampere-jam'],
  ], 'wh');
  const wh = T.input('text', 'cth: 500', '500');
  wh.inputMode = 'decimal';
  const volt = T.input('text', 'cth: 36', '36');
  volt.inputMode = 'decimal';
  const ah = T.input('text', 'cth: 14', '14');
  ah.inputMode = 'decimal';
  const pakai = T.input('text', 'cth: 8', '8');
  pakai.inputMode = 'decimal';
  const box = T.out();

  const wrapWh = T.el('<div></div>');
  wrapWh.appendChild(T.field('Kapasitas baterai (Wh)', wh));
  const wrapVa = T.el('<div></div>');
  wrapVa.appendChild(T.grid2(
    T.field('Volt baterai (V)', volt),
    T.field('Ampere-jam (Ah)', ah),
  ));
  const aturTampil = () => {
    wrapWh.hidden = cara.value !== 'wh';
    wrapVa.hidden = cara.value !== 'va';
  };
  cara.addEventListener('change', aturTampil);
  aturTampil();

  const hitung = () => {
    let w;
    if (cara.value === 'wh') w = T.num(wh.value);
    else {
      w = whBaterai(T.num(volt.value), T.num(ah.value));
      if (w === null) { T.show(box, '<span class="err">Isi volt dan ampere-jam dengan angka lebih dari 0.</span>'); return; }
    }
    const p = T.num(pakai.value);
    const j = jangkauanEBike(w, p);
    if (j === null) { T.show(box, '<span class="err">Isi kapasitas baterai dan pemakaian dengan angka lebih dari 0.</span>'); return; }
    let mode = '';
    for (const [nama, pk] of Object.entries(PAKAI_EBIKE)) {
      mode += kv('Mode ' + nama + ' (' + pk + ' Wh/km)', utils.fmtDes(w / pk, 1) + ' km');
    }
    T.show(box,
      '<div class="center"><div class="dim">Perkiraan jangkauan</div>' +
      '<div class="big">' + utils.fmtDes(j, 1) + ' km</div>' +
      '<div class="dim">Baterai ' + utils.fmtDes(w, 0) + ' Wh, pemakaian ' + utils.fmtDes(p, 1) + ' Wh per km</div></div>' +
      '<div class="dim" style="margin-top:12px">Perkiraan di tiap mode (baterai yang sama)</div>' +
      mode +
      '<p class="hint">Ini perkiraan, jarak sebenarnya tergantung tanjakan, berat pengendara, angin, dan umur baterai. Baterai tua bisa kehilangan 20 sampai 30 persen kapasitasnya. Angka mode di atas nilai umum, ubah kolom pemakaian sesuai pengalamanmu untuk hasil yang lebih dekat.</p>');
  };

  root.appendChild(T.el('<p class="note">Masukkan kapasitas baterai dan seberapa boros pemakaian listriknya. Hasilnya perkiraan jarak yang bisa ditempuh dalam sekali cas.</p>'));
  root.appendChild(T.field('Cara isi kapasitas baterai', cara));
  root.appendChild(wrapWh);
  root.appendChild(wrapVa);
  root.appendChild(T.field('Pemakaian listrik (Wh per km)', pakai, 'Eco sekitar 5, normal sekitar 8, turbo sekitar 12. Ubah sesuai pengalamanmu.'));
  root.appendChild(T.btn('Hitung Jangkauan', hitung, true));
  root.appendChild(box);
  hitung();
}
