import { h as T, kv } from '../../core.js';

export const meta = {"id": "kalkulator-pelunasan-kartu-kredit", "name": "Kalkulator Pelunasan Kartu Kredit", "cat": "bisnis", "icon": "💳", "desc": "Bandingkan bayar minimum dan cicilan tetap: berapa lama lunas dan berapa bunganya.", "keywords": "kartu kredit,pelunasan,pembayaran minimum,cicilan tetap,bunga kartu kredit,lunas", "since": "6.17.0"};

// Simulasi pelunasan bulan per bulan. Tiap bulan: bunga = saldo x bunga tahunan/12,
// lalu pembayaran dikurangi dari saldo + bunga. Pembayaran minimum = persen dari
// saldo, minimal Rp50.000, dan tidak lebih dari saldo + bunga bulan itu.
// Balikan null bila pembayaran tidak pernah menutup bunga (tidak pernah lunas).
// Batas simulasi 600 bulan (50 tahun).
export function simulasiPelunasan(saldoAwal, bungaTahunanPersen, bayar, mode) {
  const saldo0 = Number(saldoAwal), r = Number(bungaTahunanPersen) / 100 / 12;
  if (![saldo0, r].every(isFinite) || saldo0 <= 0 || r < 0) return null;
  let saldo = saldo0, totalBunga = 0, totalBayar = 0, bulan = 0;
  while (saldo > 0.005 && bulan < 600) {
    const bunga = saldo * r;
    totalBunga += bunga;
    let cicilan;
    if (mode === 'tetap') {
      cicilan = Number(bayar);
      if (!isFinite(cicilan) || cicilan <= 0) return null;
      if (cicilan <= bunga && bulan === 0) return null; // tidak pernah lunas
    } else {
      const persen = Number(bayar);
      if (!isFinite(persen) || persen <= 0) return null;
      cicilan = Math.max(saldo * persen / 100, 50000);
    }
    cicilan = Math.min(cicilan, saldo + bunga);
    saldo = saldo + bunga - cicilan;
    totalBayar += cicilan;
    bulan++;
    if (!isFinite(saldo) || !isFinite(totalBunga)) return null;
  }
  if (saldo > 0.005) return null;
  return { bulan, totalBunga, totalBayar };
}

export function hitungPelunasanKartu(saldo, bungaTahunan, bayarTetap, persenMinimum) {
  const minimum = simulasiPelunasan(saldo, bungaTahunan, persenMinimum, 'minimum');
  const tetap = simulasiPelunasan(saldo, bungaTahunan, bayarTetap, 'tetap');
  return { minimum, tetap };
}

const fmtDurasi = (bulan) => {
  const thn = Math.floor(bulan / 12), bln = bulan % 12;
  if (thn === 0) return bln + ' bulan';
  if (bln === 0) return thn + ' tahun';
  return thn + ' tahun ' + bln + ' bulan';
};

export function render(root) {
  const saldoI = T.input('text', 'cth: 10000000', '');
  const bungaI = T.input('text', 'cth: 24', '');
  const tetapI = T.input('text', 'cth: 1000000', '');
  const persenI = T.input('text', 'cth: 10', '10');
  const box = T.out();

  const hitung = () => {
    const saldo = T.num(saldoI.value);
    const bunga = T.num(bungaI.value);
    const tetap = T.num(tetapI.value);
    const persen = T.num(persenI.value);
    if (!isFinite(saldo) || saldo <= 0) { T.show(box, '<div class="err">Saldo tagihan harus diisi angka lebih dari 0.</div>'); return; }
    if (!isFinite(bunga) || bunga < 0 || bunga >= 1000) { T.show(box, '<div class="err">Bunga per tahun diisi 0 sampai di bawah 1000.</div>'); return; }
    if (!isFinite(tetap) || tetap <= 0) { T.show(box, '<div class="err">Cicilan tetap per bulan harus diisi angka lebih dari 0.</div>'); return; }
    if (!isFinite(persen) || persen <= 0 || persen > 100) { T.show(box, '<div class="err">Pembayaran minimum diisi 1 sampai 100 persen dari tagihan.</div>'); return; }
    const hasil = hitungPelunasanKartu(saldo, bunga, tetap, persen);
    const min = hasil.minimum, ttp = hasil.tetap;
    const minTeks = min == null
      ? '<p class="err">Dengan pembayaran minimum, utang ini tidak lunas dalam 50 tahun: bunganya hampir sama besar dengan yang dibayar tiap bulan.</p>'
      : kv('Bayar minimum: lama lunas', fmtDurasi(min.bulan) + ' (' + min.bulan + ' bulan)') +
        kv('Bayar minimum: total bunga', T.rp(min.totalBunga)) +
        kv('Bayar minimum: total dibayar', T.rp(min.totalBayar));
    const ttpTeks = ttp == null
      ? '<p class="err">Cicilan tetap ' + T.rp(tetap) + ' per bulan tidak cukup menutup bunga bulanannya, jadi utang tidak berkurang. Naikkan cicilannya.</p>'
      : kv('Cicilan tetap: lama lunas', fmtDurasi(ttp.bulan) + ' (' + ttp.bulan + ' bulan)') +
        kv('Cicilan tetap: total bunga', T.rp(ttp.totalBunga)) +
        kv('Cicilan tetap: total dibayar', T.rp(ttp.totalBayar));
    let hemat = '';
    if (min != null && ttp != null && min.totalBunga > ttp.totalBunga) {
      hemat = '<p class="info">Cicilan tetap menghemat ' + T.rp(min.totalBunga - ttp.totalBunga) + ' bunga dan lunas ' +
        (min.bulan - ttp.bulan) + ' bulan lebih cepat dibanding bayar minimum.</p>';
    }
    T.show(box,
      '<div class="big center">' + (ttp == null ? 'Tidak lunas' : fmtDurasi(ttp.bulan)) + '</div>' +
      '<p class="center">lama lunas dengan cicilan tetap ' + T.rp(tetap) + ' per bulan</p>' +
      minTeks + ttpTeks + hemat +
      '<p class="hint">Asumsi: tidak ada belanja baru, bunga ' + String(bunga).replace('.', ',') + '% per tahun, pembayaran minimum ' +
      String(persen).replace('.', ',') + '% dari saldo (minimal Rp50.000). Denda keterlambatan dan biaya lain tidak dihitung.</p>');
  };

  root.appendChild(T.el('<p class="note">Bayar minimum terasa ringan, tapi sebagian besar uangmu habis untuk bunga dan pokoknya nyaris tidak berkurang. Bandingkan dengan cicilan tetap supaya bedanya kelihatan.</p>'));
  root.appendChild(T.field('Saldo tagihan saat ini (Rp)', saldoI, 'Total utang kartu kredit yang belum dibayar.'));
  root.appendChild(T.field('Bunga kartu (% per tahun)', bungaI, 'Bunga tahunan yang tertulis di tagihan atau perjanjian.'));
  root.appendChild(T.field('Cicilan tetap per bulan (Rp)', tetapI, 'Jumlah yang sanggup kamu bayar tiap bulan secara tetap.'));
  root.appendChild(T.field('Pembayaran minimum (% dari tagihan)', persenI, 'Biasanya 10% dari total tagihan. Sesuaikan dengan kartumu.'));
  root.appendChild(T.row(T.btn('Bandingkan Pelunasan', hitung, true)));
  root.appendChild(box);
}
