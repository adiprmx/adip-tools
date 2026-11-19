import { h as T, kv, rp, errBox } from '../../core.js';

// Tarif transfer antar bank, dicek 19 November 2026.
// BI-FAST: biaya maksimal Rp2.500 per transaksi untuk nasabah, batas
// Rp250 juta per transaksi, 24 jam setiap hari, masuk dalam hitungan detik.
// Sumber: Siaran Pers Bank Indonesia No. 23/270/DKom, 22 Oktober 2021.
// SKN (kliring): umumnya Rp2.900 (BCA), sebagian bank Rp3.500 (BRI),
// batas Rp1 miliar, masuk 1-3 hari kerja. RTGS: umumnya Rp25.000,
// minimal Rp100 juta, hanya jam kerja. Transfer online (realtime/ATM):
// umumnya Rp6.500. Nilai SKN/RTGS/online bisa beda antar bank; yang
// ditampilkan nilai yang paling umum dari halaman biaya bank.
export const LAYANAN = [
  { nama: 'BI-FAST', biaya: 2500, min: 1, maks: 250000000, cepat: 'Hitungan detik', jam: '24 jam setiap hari', ket: 'Paling murah dan paling cepat untuk nominal sampai Rp250 juta.' },
  { nama: 'Transfer online', biaya: 6500, min: 1, maks: 100000000, cepat: 'Hitungan detik', jam: '24 jam setiap hari', ket: 'Nama lain: transfer realtime, RTO. Batas per transaksi beda-beda tiap bank.' },
  { nama: 'SKN (kliring)', biaya: 2900, min: 1, maks: 1000000000, cepat: '1-3 hari kerja', jam: 'Jam kerja bank', ket: 'Murah untuk nominal besar, tapi dananya tidak langsung masuk.' },
  { nama: 'RTGS', biaya: 25000, min: 100000000, maks: 1000000000000, cepat: 'Jam yang sama', jam: 'Jam kerja bank', ket: 'Untuk nominal Rp100 juta ke atas.' },
];

export function layananUntukNominal(nominal) {
  return LAYANAN.map((l) => ({
    ...l,
    bisa: nominal >= l.min && nominal <= l.maks,
    alasan: nominal < l.min ? 'Nominal di bawah batas minimal ' + rp(l.min) : (nominal > l.maks ? 'Nominal di atas batas maksimal ' + rp(l.maks) : ''),
  }));
}

export function termurah(nominal) {
  const bisa = layananUntukNominal(nominal).filter((l) => l.bisa);
  if (bisa.length === 0) return null;
  return bisa.reduce((a, b) => (b.biaya < a.biaya ? b : a));
}

export const meta = { "id": "biaya-admin-transfer-antar-bank", "name": "Biaya Admin Transfer Antar Bank", "cat": "indonesia", "icon": "🏦", "desc": "Bandingkan biaya transfer antar bank (BI-FAST, online, SKN, RTGS) untuk nominalmu.", "keywords": "transfer bank,biaya transfer,bi-fast,skn,rtgs,antar bank,biaya admin", "since": "6.18.0" };

export function render(root) {
  const nominal = T.input('number', 'Nominal transfer (Rp)', '1000000');
  const box = T.out();

  const hitung = () => {
    const n = T.num(nominal.value);
    if (!(n >= 1000 && n <= 1000000000000)) {
      T.show(box, errBox('Isi nominal antara Rp1.000 sampai Rp1 triliun.'));
      return;
    }
    const daftar = layananUntukNominal(n);
    const murah = termurah(n);
    const rows = daftar.map((l) => {
      const status = l.bisa
        ? '<span class="ok">Bisa, biaya ' + rp(l.biaya) + '</span>'
        : '<span class="dim">Tidak bisa: ' + T.esc(l.alasan) + '</span>';
      return '<tr><td><b>' + T.esc(l.nama) + '</b><br><span class="dim" style="font-size:13px">' + T.esc(l.ket) + '</span></td>' +
        '<td style="text-align:right;white-space:nowrap">' + rp(l.biaya) + '<br><span class="dim" style="font-size:13px">' + T.esc(l.cepat) + '</span></td>' +
        '<td style="text-align:right">' + status + '</td></tr>';
    }).join('');
    T.show(box,
      '<div class="center"><div class="dim">Transfer ' + rp(n) + '</div>' +
      (murah
        ? '<div class="big">' + T.esc(murah.nama) + '</div><div class="dim">Paling murah, biaya ' + rp(murah.biaya) + ', total yang keluar dari rekening ' + rp(n + murah.biaya) + '</div>'
        : '<div class="big">Tidak ada layanan yang cocok</div><div class="dim">Nominal ini di luar batas semua layanan di atas.</div>') +
      '</div>' +
      '<table class="tbl"><tbody>' + rows + '</tbody></table>' +
      '<p class="hint">Biaya di atas dipotong dari pengirim, di luar nominal transfer. Isi saldo e-wallet lewat transfer bank memakai biaya transfer yang sama; ' +
      'biaya top-up di dalam aplikasi e-wallet bisa beda, cek di aplikasinya.</p>' +
      '<p class="hint">Tarif dicek 19 November 2026. BI-FAST: Siaran Pers Bank Indonesia No. 23/270/DKom (22 Oktober 2021), biaya maksimal Rp2.500. ' +
      'SKN, RTGS, dan transfer online: nilai yang paling umum dari halaman biaya bank (BCA, BRI, dan lainnya), bisa beda antar bank. ' +
      'Tarif bisa berubah, pastikan di bankmu sebelum transfer besar.</p>');
  };

  root.appendChild(T.field('Nominal transfer (Rp)', nominal));
  root.appendChild(T.btn('Bandingkan biaya', hitung, true));
  root.appendChild(box);
  hitung();
}
