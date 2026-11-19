import { h as T, utils, kv } from '../../core.js';

// DSCR (debt service coverage ratio): kemampuan membayar utang dari
// pemasukan operasional. DSCR = pemasukan operasional bersih (NOI)
// dibagi total cicilan utang setahun. Di bawah 1 artinya pemasukan tidak
// cukup menutup cicilan. Patokan umum bank: 1,25 ke atas dianggap aman,
// tapi tiap bank beda dan angka ini bukan janji persetujuan kredit.
export function hitungDSCR(noi, cicilan) {
  const n = Number(noi);
  const c = Number(cicilan);
  if (![n, c].every(isFinite) || c <= 0) return null;
  const dscr = n / c;
  if (!isFinite(dscr)) return null;
  const status = dscr < 1 ? 'kurang' : dscr < 1.25 ? 'pas-pasan' : 'aman';
  return { dscr, status, selisih: n - c };
}
utils.dscr = hitungDSCR;

export const meta = {"id": "kalkulator-dscr", "name": "Kalkulator DSCR", "cat": "bisnis", "icon": "🏦", "desc": "Cek apakah pemasukan usahamu cukup menutup cicilan utang tiap tahun.", "keywords": "dscr,utang,cicilan,rasio,noi,kelayakan kredit,pinjaman,bank,usaha", "since": "6.18.0"};
export function render(root) {
  const noiI = T.input('text', 'cth: 240000000', ''); noiI.inputMode = 'decimal';
  const cicilI = T.input('text', 'cth: 180000000', ''); cicilI.inputMode = 'decimal';
  const box = T.out();

  const hitung = () => {
    const noi = T.num(noiI.value);
    const cicil = T.num(cicilI.value);
    if (!isFinite(noi)) {
      T.show(box, '<div class="err">Pemasukan operasional harus diisi angka.</div>');
      return;
    }
    if (!isFinite(cicil) || cicil <= 0) {
      T.show(box, '<div class="err">Total cicilan setahun harus diisi angka lebih dari 0.</div>');
      return;
    }
    const r = hitungDSCR(noi, cicil);
    if (!r) {
      T.show(box, '<div class="err">Angkanya tidak bisa dihitung. Cek lagi yang kamu isi.</div>');
      return;
    }
    const dscrTeks = r.dscr.toFixed(2).replace('.', ',') + 'x';
    const pesan = r.status === 'kurang'
      ? 'Pemasukanmu belum cukup menutup cicilan: kurang ' + T.rp(Math.round(-r.selisih)) + ' per tahun. Bank biasanya menolak pengajuan dengan rasio di bawah 1.'
      : r.status === 'pas-pasan'
        ? 'Pemasukanmu cukup menutup cicilan, tapi sisanya tipis: ' + T.rp(Math.round(r.selisih)) + ' per tahun. Satu bulan sepi bisa membuatmu kesulitan bayar.'
        : 'Pemasukanmu menutup cicilan dengan sisa ' + T.rp(Math.round(r.selisih)) + ' per tahun. Rasio ini masuk patokan umum bank (1,25x ke atas).';
    const kelas = r.status === 'kurang' ? 'err' : r.status === 'pas-pasan' ? 'warn' : 'info';
    T.show(box,
      '<div class="big">' + dscrTeks + '</div>' +
      '<p class="center mut">Rasio cicilan terhadap pemasukan operasional.</p>' +
      kv('Pemasukan operasional bersih / tahun', T.rp(Math.round(noi))) +
      kv('Total cicilan / tahun', T.rp(Math.round(cicil))) +
      kv('Sisa setelah cicilan', T.rp(Math.round(r.selisih))) +
      '<p class="' + kelas + '">' + pesan + '</p>' +
      '<p class="hint">Patokan 1,25x adalah patokan umum yang dipakai banyak bank, bukan aturan resmi. Tiap bank punya patokan sendiri dan melihat hal lain juga, seperti riwayat kredit dan agunan.</p>');
  };

  root.appendChild(T.el('<p class="note">DSCR itu ukuran gampang: pemasukan usahamu dibagi cicilan utang setahun. Hasil 1x artinya pas menutup cicilan, di bawah 1x artinya kurang. Bank memakai angka ini saat menilai pengajuan pinjaman.</p>'));
  root.appendChild(T.field('Pemasukan operasional bersih / tahun (Rp)', noiI, 'Pemasukan usaha setelah biaya operasional, sebelum cicilan dan pajak'));
  root.appendChild(T.field('Total cicilan utang / tahun (Rp)', cicilI, 'Semua cicilan pokok dan bunga dalam setahun'));
  root.appendChild(T.row(T.btn('Hitung DSCR', hitung, true)));
  root.appendChild(box);
}
