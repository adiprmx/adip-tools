import { h as T, kv } from '../../core.js';

export const meta = {"id": "kalkulator-cap-rate-properti", "name": "Kalkulator Cap Rate Properti", "cat": "bisnis", "icon": "🏠", "desc": "Tingkat hasil properti sewa dari pemasukan bersih dan harga belinya.", "keywords": "cap rate,properti,sewa,noi,investasi properti,imbal hasil", "since": "6.17.0"};

// NOI = sewa setahun - biaya operasional setahun.
// Cap rate = NOI / harga beli x 100%.
export function hitungCapRate(hargaBeli, sewaBulanan, biayaTahunan) {
  const h = Number(hargaBeli), s = Number(sewaBulanan), b = Number(biayaTahunan);
  if (![h, s, b].every(isFinite) || h <= 0 || s < 0 || b < 0) return null;
  const noi = s * 12 - b;
  const cap = (noi / h) * 100;
  if (![noi, cap].every(isFinite)) return null;
  return { noi, cap };
}

const fmtPersen = (x) => x.toFixed(2).replace('.', ',') + '%';

export function render(root) {
  const hI = T.input('text', 'cth: 500000000', '');
  const sI = T.input('text', 'cth: 5000000', '');
  const bI = T.input('text', 'cth: 6000000', '');
  const box = T.out();

  const hitung = () => {
    const h = T.num(hI.value);
    const s = T.num(sI.value);
    const b = T.num(bI.value);
    if (!isFinite(h) || h <= 0) { T.show(box, '<div class="err">Harga beli harus diisi angka lebih dari 0.</div>'); return; }
    if (!isFinite(s) || s < 0) { T.show(box, '<div class="err">Sewa bulanan harus diisi angka 0 atau lebih.</div>'); return; }
    if (!isFinite(b) || b < 0) { T.show(box, '<div class="err">Biaya operasional setahun harus diisi angka 0 atau lebih.</div>'); return; }
    const hasil = hitungCapRate(h, s, b);
    if (hasil === null) { T.show(box, '<div class="err">Angkanya terlalu besar untuk dihitung. Coba pakai angka yang lebih kecil.</div>'); return; }
    const balik = hasil.noi > 0 ? h / hasil.noi : null;
    const pesan = hasil.noi <= 0
      ? 'Pemasukan sewanya tidak menutup biaya operasional, jadi properti ini merugi tiap tahun sebelum cicilan.'
      : 'Properti ini menghasilkan ' + fmtPersen(hasil.cap) + ' dari harga belinya setiap tahun, sebelum cicilan dan pajak.';
    T.show(box,
      '<div class="big center">' + fmtPersen(hasil.cap) + '</div>' +
      '<p class="center">cap rate per tahun</p>' +
      kv('Pemasukan bersih setahun (NOI)', T.rp(hasil.noi)) +
      kv('Pemasukan bersih per bulan', T.rp(hasil.noi / 12)) +
      kv('Sewa kotor setahun', T.rp(s * 12)) +
      kv('Balik modal dari sewa', balik == null ? 'tidak balik modal' : String(balik.toFixed(1)).replace('.', ',') + ' tahun') +
      '<p class="' + (hasil.noi <= 0 ? 'err' : 'info') + '">' + pesan + '</p>' +
      '<p class="hint">Cap rate tidak menghitung cicilan KPR dan pajak. Gunanya membandingkan dua properti sewa dengan cepat: cap rate lebih tinggi artinya hasil sewanya lebih besar dibanding harga belinya.</p>');
  };

  root.appendChild(T.el('<p class="note">Cap rate mengukur hasil properti sewa: pemasukan bersih setahun dibagi harga beli. Angka ini memudahkan membandingkan properti yang harganya beda jauh.</p>'));
  root.appendChild(T.field('Harga beli properti (Rp)', hI, 'Harga yang kamu bayar untuk properti ini.'));
  root.appendChild(T.field('Sewa yang diterima per bulan (Rp)', sI, 'Sewa bulanan dari penyewa.'));
  root.appendChild(T.field('Biaya operasional setahun (Rp)', bI, 'Pajak, perawatan, asuransi, dan biaya lain di luar cicilan.'));
  root.appendChild(T.row(T.btn('Hitung Cap Rate', hitung, true)));
  root.appendChild(box);
}
