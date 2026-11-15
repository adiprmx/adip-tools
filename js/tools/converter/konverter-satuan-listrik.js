import { h as T, utils } from '../../core.js?v=6.12.1';

// Logika murni (bisa di-test di Node): hukum Ohm V = I x R dan daya P = V x I.
// Isi dua nilai apa pun, dua sisanya dihitung.
utils.hitungListrik = function (o) {
  let V = Number(o.v), I = Number(o.i), P = Number(o.p), R = Number(o.r);
  V = isFinite(V) && V > 0 ? V : null;
  I = isFinite(I) && I > 0 ? I : null;
  P = isFinite(P) && P > 0 ? P : null;
  R = isFinite(R) && R > 0 ? R : null;
  const isi = [V, I, P, R].filter((x) => x !== null).length;
  if (isi < 2) return null;
  if (V !== null && I !== null) { P = V * I; R = V / I; }
  else if (V !== null && P !== null) { I = P / V; R = (V * V) / P; }
  else if (V !== null && R !== null) { I = V / R; P = (V * V) / R; }
  else if (I !== null && P !== null) { V = P / I; R = P / (I * I); }
  else if (I !== null && R !== null) { V = I * R; P = I * I * R; }
  else if (P !== null && R !== null) { I = Math.sqrt(P / R); V = Math.sqrt(P * R); }
  return { v: V, i: I, p: P, r: R };
};

// kWh = watt x jam x hari / 1000
utils.hitungKwh = function (o) {
  const watt = Math.max(0, Number(o.watt) || 0);
  const jam = Math.max(0, Number(o.jam) || 0);
  const hari = Math.max(0, Number(o.hari) || 0);
  const tarif = Math.max(0, Number(o.tarif) || 0);
  const kwh = (watt * jam * hari) / 1000;
  return { kwh, rupiah: kwh * tarif };
};

export const meta = {"id": "konverter-satuan-listrik", "name": "Konverter Satuan Listrik", "cat": "converter", "icon": "⚡", "desc": "Volt, ampere, watt, ohm, dan hitung kWh pemakaian.", "keywords": "volt,ampere,watt,ohm,kwh,listrik,hukum ohm,daya", "since": "6.11.0"};

export function render(root) {
  const v = T.input('text', 'Contoh: 220', ''); v.inputMode = 'decimal';
  const i = T.input('text', 'Contoh: 2', ''); i.inputMode = 'decimal';
  const p = T.input('text', 'Contoh: 440', ''); p.inputMode = 'decimal';
  const r = T.input('text', 'Contoh: 110', ''); r.inputMode = 'decimal';
  const box = T.out();

  const watt = T.input('text', 'Contoh: 350', ''); watt.inputMode = 'decimal';
  const jam = T.input('text', 'Contoh: 8', ''); jam.inputMode = 'decimal';
  const hari = T.input('text', 'Contoh: 30', '30'); hari.inputMode = 'decimal';
  const tarif = T.input('text', 'Contoh: 1444,70', '1444,70'); tarif.inputMode = 'decimal';
  const box2 = T.out();

  function calc() {
    const hasil = utils.hitungListrik({ v: T.num(v.value), i: T.num(i.value), p: T.num(p.value), r: T.num(r.value) });
    if (!hasil) { T.show(box, '<div class="hint">Isi dua nilai apa pun. Dua nilai lainnya akan dihitung.</div>'); return; }
    T.show(box,
      `<div class="kv"><span>Tegangan (volt)</span><b style="color:#fff">${T.fmt(Math.round(hasil.v * 100) / 100)} V</b></div>` +
      `<div class="kv"><span>Arus (ampere)</span><b>${T.fmt(Math.round(hasil.i * 100) / 100)} A</b></div>` +
      `<div class="kv"><span>Daya (watt)</span><b>${T.fmt(Math.round(hasil.p * 100) / 100)} W</b></div>` +
      `<div class="kv"><span>Hambatan (ohm)</span><b>${T.fmt(Math.round(hasil.r * 100) / 100)} Ω</b></div>` +
      `<div class="hint">Rumusnya: daya = volt x ampere, dan volt = ampere x ohm. Listrik rumah di Indonesia umumnya 220 volt.</div>`
    );
  }

  function calcKwh() {
    const w = T.num(watt.value), j = T.num(jam.value);
    if (!(w > 0) || !(j > 0)) { T.show(box2, '<div class="hint">Isi daya alat (watt) dan lama pakai per hari (jam).</div>'); return; }
    const hasil = utils.hitungKwh({ watt: w, jam: j, hari: T.num(hari.value) || 30, tarif: T.num(tarif.value) });
    T.show(box2,
      `<div class="kv"><span>Pemakaian</span><b style="color:#fff">${T.fmt(Math.round(hasil.kwh * 100) / 100)} kWh</b></div>` +
      `<div class="kv"><span>Perkiraan biaya</span><b>${T.rp(hasil.rupiah)}</b></div>` +
      `<div class="hint">Tarif di atas adalah contoh untuk golongan 1.300 VA ke atas (Rp1.444,70 per kWh). Ubah sesuai tarif di struk listrikmu. Biaya ini belum termasuk pajak penerangan jalan.</div>`
    );
  }

  root.appendChild(T.el('<p class="note">Isi dua nilai apa pun dari empat ini, dua sisanya dihitung otomatis.</p>'));
  root.appendChild(T.grid2(
    T.field('Tegangan (volt)', v),
    T.field('Arus (ampere)', i)
  ));
  root.appendChild(T.grid2(
    T.field('Daya (watt)', p),
    T.field('Hambatan (ohm)', r)
  ));
  root.appendChild(T.btn('Hitung', calc, true));
  root.appendChild(box);
  root.appendChild(T.el('<h3 style="margin-top:24px">Hitung pemakaian kWh</h3>'));
  root.appendChild(T.grid2(
    T.field('Daya alat (watt)', watt),
    T.field('Lama pakai per hari (jam)', jam)
  ));
  root.appendChild(T.grid2(
    T.field('Jumlah hari', hari),
    T.field('Tarif listrik (Rp per kWh)', tarif)
  ));
  root.appendChild(T.btn('Hitung kWh', calcKwh, true));
  root.appendChild(box2);
}
