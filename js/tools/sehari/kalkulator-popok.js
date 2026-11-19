import { h as T, kv, utils } from '../../core.js';

// Popok: jumlah per hari tergantung umur (angka umum, bisa diubah).
// Per bulan = per hari x 30. Biaya = jumlah x harga per lembar.
// Kain vs sekali pakai: kain = modal awal + biaya cuci per bulan.
export const POPOK_PER_HARI = { '0-3': 10, '3-6': 8, '6-12': 6, '12-24': 5, '24-36': 4 };

export function popok(perHari, hargaPerLembar) {
  const p = Number(perHari), h = Number(hargaPerLembar);
  if (!(p >= 0) || !(h >= 0)) return null;
  const perBulan = Math.round(p * 30);
  const biayaBulan = Math.round(perBulan * h);
  return { perBulan, biayaBulan, perTahun: perBulan * 12, biayaTahun: biayaBulan * 12 };
}

export function popokKain(modalAwal, cuciPerBulan, bulan) {
  const m = Number(modalAwal) || 0, c = Number(cuciPerBulan) || 0, b = Number(bulan);
  if (m < 0 || c < 0 || !(b > 0)) return null;
  return Math.round(m + c * b);
}
utils.popok = popok;
utils.popokKain = popokKain;

export const meta = {"id": "kalkulator-popok", "name": "Kalkulator Popok", "cat": "sehari", "icon": "🍼", "desc": "Jumlah popok yang dibutuhkan per bulan dan biayanya, plus bandingkan dengan popok kain.", "keywords": "popok,diaper,bayi,jumlah popok,biaya popok,popok kain,sekali pakai", "since": "6.19.0"};
export function render(root) {
  const umur = T.select([
    ['0-3', '0 sampai 3 bulan (sekitar 10 per hari)'],
    ['3-6', '3 sampai 6 bulan (sekitar 8 per hari)'],
    ['6-12', '6 sampai 12 bulan (sekitar 6 per hari)'],
    ['12-24', '1 sampai 2 tahun (sekitar 5 per hari)'],
    ['24-36', '2 sampai 3 tahun (sekitar 4 per hari)'],
  ], '3-6');
  const perHari = T.input('text', 'cth: 8', '8');
  perHari.inputMode = 'decimal';
  const harga = T.input('text', 'cth: 2500', '2500');
  harga.inputMode = 'decimal';
  const modalKain = T.input('text', 'cth: 1500000', '1500000');
  modalKain.inputMode = 'decimal';
  const cuci = T.input('text', 'cth: 100000', '100000');
  cuci.inputMode = 'decimal';
  const box = T.out();

  umur.addEventListener('change', () => { perHari.value = String(POPOK_PER_HARI[umur.value]); });

  const hitung = () => {
    const r = popok(T.num(perHari.value), T.num(harga.value));
    if (!r) { T.show(box, '<span class="err">Isi jumlah per hari dan harga per lembar dengan angka 0 atau lebih.</span>'); return; }
    const kain12 = popokKain(T.num(modalKain.value), T.num(cuci.value), 12);
    let banding = '';
    if (kain12 !== null) {
      const hemat = r.biayaTahun - kain12;
      banding = kv('Popok kain setahun', T.rp(kain12) + ' (modal + cuci)') +
        '<p>' + (hemat > 0 ? 'Popok kain lebih hemat ' + T.rp(hemat) + ' dalam setahun, tapi perlu waktu mencuci dan menjemur tiap hari.' : hemat < 0 ? 'Popok sekali pakai lebih hemat ' + T.rp(-hemat) + ' dalam setahun dibanding popok kain dengan angka ini.' : 'Biaya keduanya sama dalam setahun dengan angka ini.') + '</p>';
    }
    T.show(box,
      '<div class="center"><div class="dim">Popok sekali pakai per bulan</div>' +
      '<div class="big">' + T.fmt(r.perBulan) + ' lembar</div>' +
      '<div class="dim">' + T.rp(r.biayaBulan) + ' per bulan, ' + T.rp(r.biayaTahun) + ' per tahun</div></div>' +
      kv('Per tahun', T.fmt(r.perTahun) + ' lembar') +
      kv('Harga per lembar', T.rp(T.num(harga.value))) +
      banding +
      '<p class="hint">Ini perkiraan, jumlah sebenarnya tergantung bayi dan merek popoknya. Jumlah per hari di atas angka umum, ubah sesuai pemakaian bayimu. Harga per lembar bisa dihitung dari harga satu pak dibagi isinya.</p>');
  };

  root.appendChild(T.el('<p class="note">Pilih umur bayi, lalu isi harga popok per lembar. Hasilnya jumlah popok per bulan dan biayanya, plus perbandingan dengan popok kain.</p>'));
  root.appendChild(T.grid2(
    T.field('Umur bayi', umur),
    T.field('Jumlah popok per hari', perHari, 'Ubah kalau pemakaian bayimu berbeda.'),
    T.field('Harga per lembar (Rp)', harga),
  ));
  root.appendChild(T.field('Popok kain: modal awal (Rp)', modalKain, 'Harga beli stok popok kain. Kosongkan dengan 0 kalau tidak mau membandingkan.'));
  root.appendChild(T.field('Popok kain: biaya cuci per bulan (Rp)', cuci, 'Sabun, air, dan listrik untuk mencuci.'));
  root.appendChild(T.btn('Hitung Popok', hitung, true));
  root.appendChild(box);
  hitung();
}
