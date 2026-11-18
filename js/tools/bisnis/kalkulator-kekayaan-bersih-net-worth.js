import { h as T, kv } from '../../core.js';

export const meta = {"id": "kalkulator-kekayaan-bersih-net-worth", "name": "Kalkulator Kekayaan Bersih (Net Worth)", "cat": "bisnis", "icon": "🏦", "desc": "Kekayaan bersihmu: semua aset dikurangi semua utang.", "keywords": "net worth,kekayaan bersih,aset,utang,total aset,total utang", "since": "6.17.0"};

// Net worth = total aset - total utang.
export function hitungNetWorth(aset, utang) {
  const a = Number(aset), u = Number(utang);
  if (![a, u].every(isFinite) || a < 0 || u < 0) return null;
  const nw = a - u;
  const rasioUtang = a > 0 ? (u / a) * 100 : (u > 0 ? Infinity : 0);
  return { netWorth: nw, rasioUtang };
}

export function render(root) {
  const tunaiI = T.input('text', 'cth: 20000000', '');
  const investasiI = T.input('text', 'cth: 50000000', '');
  const propertiI = T.input('text', 'cth: 500000000', '');
  const kendaraanI = T.input('text', 'cth: 150000000', '');
  const asetLainI = T.input('text', 'cth: 10000000', '');
  const kprI = T.input('text', 'cth: 300000000', '');
  const kartuI = T.input('text', 'cth: 5000000', '');
  const pinjamI = T.input('text', 'cth: 20000000', '');
  const box = T.out();

  const ambil = (inp) => {
    const v = inp.value.trim();
    return v === '' ? 0 : T.num(v);
  };

  const hitung = () => {
    const daftar = [
      ['Tunai dan tabungan', ambil(tunaiI)],
      ['Investasi', ambil(investasiI)],
      ['Properti', ambil(propertiI)],
      ['Kendaraan', ambil(kendaraanI)],
      ['Aset lain', ambil(asetLainI)],
      ['Sisa KPR atau KPA', ambil(kprI)],
      ['Kartu kredit', ambil(kartuI)],
      ['Pinjaman lain', ambil(pinjamI)],
    ];
    for (const [nama, v] of daftar) {
      if (!isFinite(v) || v < 0) { T.show(box, '<div class="err">' + T.esc(nama) + ' harus diisi angka 0 atau lebih, atau dikosongkan.</div>'); return; }
    }
    const totalAset = daftar.slice(0, 5).reduce((a, [, v]) => a + v, 0);
    const totalUtang = daftar.slice(5).reduce((a, [, v]) => a + v, 0);
    const hasil = hitungNetWorth(totalAset, totalUtang);
    if (hasil === null) { T.show(box, '<div class="err">Angkanya terlalu besar untuk dihitung. Coba pakai angka yang lebih kecil.</div>'); return; }
    const pesan = hasil.netWorth < 0
      ? 'Utangmu masih lebih besar dari asetmu. Fokus melunasi utang berbunga tinggi dulu, lalu bangun aset sedikit demi sedikit.'
      : hasil.netWorth === 0
        ? 'Aset dan utangmu pas sama besar. Setiap rupiah utang yang lunas mulai sekarang langsung menambah kekayaan bersihmu.'
        : 'Kekayaan bersihmu positif. Lacak angka ini tiap beberapa bulan untuk melihat apakah kamu makin kaya atau jalan di tempat.';
    T.show(box,
      '<div class="big center">' + T.rp(hasil.netWorth) + '</div>' +
      '<p class="center">kekayaan bersihmu</p>' +
      kv('Total aset', T.rp(totalAset)) +
      kv('Total utang', T.rp(totalUtang)) +
      kv('Utang dibanding aset', totalAset > 0 ? hasil.rasioUtang.toFixed(1).replace('.', ',') + '%' : (totalUtang > 0 ? 'tidak ada aset' : '0%')) +
      '<p class="' + (hasil.netWorth < 0 ? 'err' : 'info') + '">' + pesan + '</p>');
  };

  root.appendChild(T.el('<p class="note">Kekayaan bersih itu sederhananya: kalau semua yang kamu punya dijual hari ini dan semua utang dilunasi, berapa sisanya. Isi yang ada saja, yang kosong boleh dibiarkan.</p>'));
  root.appendChild(T.el('<p class="note">Aset yang kamu punya</p>'));
  root.appendChild(T.field('Tunai dan tabungan (Rp)', tunaiI, 'Uang tunai, rekening, dan deposito.'));
  root.appendChild(T.field('Investasi (Rp)', investasiI, 'Saham, reksa dana, emas, dan sejenisnya.'));
  root.appendChild(T.field('Properti (Rp)', propertiI, 'Nilai pasar rumah atau tanah yang kamu miliki.'));
  root.appendChild(T.field('Kendaraan (Rp)', kendaraanI, 'Nilai jual mobil atau motor saat ini.'));
  root.appendChild(T.field('Aset lain (Rp)', asetLainI, 'Barang berharga lain yang bisa dijual.'));
  root.appendChild(T.el('<p class="note">Utang yang masih berjalan</p>'));
  root.appendChild(T.field('Sisa KPR atau KPA (Rp)', kprI, 'Sisa pokok cicilan rumah atau apartemen.'));
  root.appendChild(T.field('Kartu kredit (Rp)', kartuI, 'Total tagihan kartu kredit yang belum dibayar.'));
  root.appendChild(T.field('Pinjaman lain (Rp)', pinjamI, 'Kredit motor, pinjaman online, dan utang lain.'));
  root.appendChild(T.row(T.btn('Hitung Kekayaan Bersih', hitung, true)));
  root.appendChild(box);
}
