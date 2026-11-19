import { h as T, utils, kv } from '../../core.js';

// Torsi (momen gaya): tau = F x r x sin(sudut). F gaya dalam newton,
// r panjang lengan dalam meter, sudut antara arah gaya dan lengan.
// Satuan hasil: newton-meter (N.m). Konversi: 1 kgf.m = 9,80665 N.m;
// 1 lbf.ft = 1,35582 N.m. Bila sudut 90 derajat, sin = 1, torsi maksimal.
// Mode balik: gaya = tau / (r x sin sudut); lengan = tau / (F x sin sudut).
export function hitungTorsi(o) {
  const sin = Math.sin((Math.max(0, Math.min(180, Number(o.sudut) || 0)) * Math.PI) / 180);
  if (o.mode === 'gaya') {
    const tau = Math.max(0, Number(o.torsi) || 0);
    const r = Math.max(0, Number(o.lengan) || 0);
    return { hasil: (r > 0 && sin > 0) ? tau / (r * sin) : 0, satuan: 'N', sin };
  }
  if (o.mode === 'lengan') {
    const tau = Math.max(0, Number(o.torsi) || 0);
    const f = Math.max(0, Number(o.gaya) || 0);
    return { hasil: (f > 0 && sin > 0) ? tau / (f * sin) : 0, satuan: 'm', sin };
  }
  const f = Math.max(0, Number(o.gaya) || 0);
  const r = Math.max(0, Number(o.lengan) || 0);
  const nm = f * r * sin;
  return { hasil: nm, satuan: 'N.m', ncm: nm * 100, kgfm: nm / 9.80665, lbfft: nm / 1.35582, sin };
}
utils.kalkulatorTorsi = hitungTorsi;

export const meta = {"id": "kalkulator-torsi", "name": "Kalkulator Torsi", "cat": "otomotif", "icon": "🔧", "desc": "Torsi dari gaya dan panjang lengan, atau sebaliknya. Buat kunci momen, baut roda, dan kerja bengkel.", "keywords": "torsi,momen,gaya,lengan,newton meter,kunci momen,baut,roda", "since": "6.19.0"};
export function render(root) {
  const modeSel = T.select([
    ['torsi', 'Hitung torsi (dari gaya + lengan)'],
    ['gaya', 'Hitung gaya (dari torsi + lengan)'],
    ['lengan', 'Hitung lengan (dari torsi + gaya)'],
  ], 'torsi');
  const gayaI = T.input('text', 'cth: 200', '200'); gayaI.inputMode = 'decimal';
  const lenganI = T.input('text', 'cth: 0,5', '0,5'); lenganI.inputMode = 'decimal';
  const sudutI = T.input('text', 'cth: 90', '90'); sudutI.inputMode = 'decimal';
  const torsiI = T.input('text', 'cth: 100', '100'); torsiI.inputMode = 'decimal';
  const box = T.out();
  const fldGaya = T.field('Gaya (newton)', gayaI, 'Berat 1 kg kira-kira 9,8 newton');
  const fldLengan = T.field('Panjang lengan (meter)', lenganI, 'Jarak dari titik putar ke tempat gaya bekerja');
  const fldTorsi = T.field('Torsi (N.m)', torsiI);
  fldTorsi.hidden = true;

  const aturMode = () => {
    const m = modeSel.value;
    fldGaya.hidden = m === 'gaya';
    fldLengan.hidden = m === 'lengan';
    fldTorsi.hidden = m === 'torsi';
    hitung();
  };
  modeSel.addEventListener('change', aturMode);

  const hitung = () => {
    const m = modeSel.value;
    const r = hitungTorsi({
      mode: m, gaya: T.num(gayaI.value), lengan: T.num(lenganI.value),
      sudut: T.num(sudutI.value), torsi: T.num(torsiI.value),
    });
    if (!(r.hasil > 0)) {
      if (r.sin <= 0) T.show(box, '<p class="mut center">Sudut 0° atau 180° tidak menghasilkan putaran sama sekali, gaya sejajar dengan lengan.</p>');
      else T.hide(box);
      return;
    }
    const label = m === 'torsi' ? 'Torsi' : m === 'gaya' ? 'Gaya yang dibutuhkan' : 'Panjang lengan yang dibutuhkan';
    const angka = m === 'lengan' ? T.fmt(Math.round(r.hasil * 1000) / 1000) : T.fmt(Math.round(r.hasil * 100) / 100);
    T.show(box,
      '<div class="big">' + angka + ' ' + r.satuan + '</div>' +
      '<p class="center mut">' + label + '.</p>' +
      (m === 'torsi'
        ? kv('Dalam N.cm', T.fmt(Math.round(r.ncm * 100) / 100) + ' N.cm') +
          kv('Dalam kgf.m', T.fmt(Math.round(r.kgfm * 100) / 100) + ' kgf.m') +
          kv('Dalam lbf.ft', T.fmt(Math.round(r.lbfft * 100) / 100) + ' lbf.ft')
        : '') +
      '<p class="hint">Torsi paling besar saat gaya tegak lurus lengan (90°). Makin miring sudutnya, makin kecil putarannya. Contoh: baut roda mobil umumnya dikencangkan sekitar 100–120 N.m, cek buku panduan mobilmu untuk angka pastinya.</p>');
  };
  [gayaI, lenganI, sudutI, torsiI].forEach((i) => i.addEventListener('input', hitung));

  root.appendChild(T.el('<p class="note">Seberapa kuat putaran yang dihasilkan gaya pada sebuah lengan? Atau sebaliknya: gaya sebesar apa yang dibutuhkan untuk torsi tertentu?</p>'));
  root.appendChild(T.field('Yang mau dihitung', modeSel));
  root.appendChild(fldGaya);
  root.appendChild(fldLengan);
  root.appendChild(fldTorsi);
  root.appendChild(T.field('Sudut antara gaya dan lengan (derajat)', sudutI, '90° = tegak lurus, torsi maksimal'));
  root.appendChild(box);
  hitung();
}
