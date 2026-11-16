import { h as T, utils, kv } from '../../core.js?v=6.13.0';

export const meta = {"id": "kalkulator-nilai-pelanggan", "name": "Kalkulator Nilai Pelanggan (LTV)", "cat": "bisnis", "icon": "👥", "desc": "Hitung nilai satu pelanggan seumur hidup (LTV) untuk menentukan budget promosi yang masuk akal.", "keywords": "ltv,nilai pelanggan,customer lifetime value,pelanggan,promosi,budget iklan,repeat order", "since": "6.13.0"};

// LTV = nilai rata-rata order x frekuensi beli per tahun x masa pelanggan (tahun).
// LTV laba = LTV x margin. Patokan umum: biaya mendapatkan satu pelanggan baru
// (CAC) sebaiknya tidak lebih dari 1/3 LTV (rasio LTV:CAC 3:1).
function hitungLTV(order, frekuensi, tahun, marginPersen) {
  const ltv = order * frekuensi * tahun;
  const ltvLaba = ltv * (marginPersen / 100);
  const cacMaks = ltv / 3;
  const perTahun = order * frekuensi;
  return { ltv, ltvLaba, cacMaks, perTahun };
}

utils.nilaiPelangganHitung = hitungLTV;

export function render(root) {
  const orderI = T.input('text', 'cth: 75000', '');
  const freqI = T.input('text', 'cth: 12', '');
  const tahunI = T.input('text', 'cth: 3', '');
  const marginI = T.input('text', 'cth: 40', '40');
  [orderI, freqI, tahunI, marginI].forEach((i) => { i.inputMode = 'decimal'; });
  const box = T.out();

  const hitung = () => {
    const order = T.num(orderI.value);
    const freq = T.num(freqI.value);
    const tahun = T.num(tahunI.value);
    const margin = T.num(marginI.value);
    if (!isFinite(order) || order <= 0) {
      T.toast('Isi nilai rata-rata order dengan angka lebih dari 0.'); return;
    }
    if (!isFinite(freq) || freq <= 0) {
      T.toast('Isi berapa kali pelanggan belanja dalam setahun.'); return;
    }
    if (!isFinite(tahun) || tahun <= 0 || tahun > 50) {
      T.toast('Isi berapa tahun pelanggan biasanya tetap belanja (1–50 tahun).'); return;
    }
    if (!isFinite(margin) || margin < 0 || margin > 100) {
      T.toast('Isi margin keuntungan dengan angka 0 sampai 100 persen.'); return;
    }
    const h = hitungLTV(order, freq, tahun, margin);
    // Guard hasil: order raksasa meluberkan LTV ke Infinity (RT2-08: "Rp∞").
    if (![h.ltv, h.ltvLaba, h.cacMaks, h.perTahun].every(Number.isFinite)) {
      T.toast('Angkanya terlalu besar untuk dihitung — coba pakai nilai order atau frekuensi yang lebih kecil.'); return;
    }
    T.show(box,
      '<div class="center"><div class="dim">Nilai satu pelanggan seumur hidup (LTV)</div>' +
      '<div class="big">' + T.rp(h.ltv) + '</div></div>' +
      kv('Nilai pelanggan per tahun', T.rp(h.perTahun)) +
      kv('Laba dari satu pelanggan', T.rp(h.ltvLaba) + ' <span class="dim">(margin ' + margin.toString().replace('.', ',') + '%)</span>') +
      kv('Batas wajar biaya dapat pelanggan baru', T.rp(h.cacMaks)) +
      '<p class="info"><b>Cara pakai angkanya:</b> satu pelanggan bernilai ' + T.rp(h.ltv) + ' selama ' + tahun.toString().replace('.', ',') + ' tahun. ' +
      'Jadi wajar keluar sampai sekitar ' + T.rp(h.cacMaks) + ' untuk mendapatkan satu pelanggan baru — misalnya lewat iklan, diskon pertama, atau sampel gratis — ' +
      'selama biayanya tidak lewat dari angka itu, promosimu masih menguntungkan. Patokan umum: biaya dapat pelanggan baru maksimal sepertiga dari nilai pelanggan (rasio 3:1).</p>' +
      '<p class="hint">Rumus: ' + T.rp(order) + ' per order × ' + freq.toString().replace('.', ',') + ' kali/tahun × ' + tahun.toString().replace('.', ',') + ' tahun.</p>');
  };

  root.appendChild(T.el('<p class="note">Pelanggan yang bolak-balik belanja jauh lebih berharga dari yang cuma beli sekali. Hitung berapa nilai satu pelanggan selama dia tetap belanja di tempatmu — angkanya jadi patokan berapa wajarnya keluar uang untuk promosi.</p>'));
  root.appendChild(T.field('Nilai rata-rata tiap order (Rp)', orderI, 'Rata-rata uang yang dihabiskan pelanggan dalam sekali belanja.'));
  root.appendChild(T.field('Berapa kali belanja dalam setahun', freqI, 'Cth: pelanggan yang belanja tiap bulan = 12 kali.'));
  root.appendChild(T.field('Berapa tahun pelanggan biasanya bertahan', tahunI, 'Perkiraan berapa lama pelanggan tetap belanja sebelum berhenti.'));
  root.appendChild(T.field('Margin keuntungan (%)', marginI, 'Dari tiap rupiah penjualan, berapa persen yang jadi laba bersih.'));
  root.appendChild(T.row(T.btn('Hitung Nilai Pelanggan', hitung, true)));
  root.appendChild(box);
}
