import { h as T, kv } from '../../core.js?v=6.7.0';

export const meta = {"id":"fee-broker-saham","name":"Fee Broker Saham","cat":"bisnis","icon":"📉","desc":"Fee broker beli & jual saham + estimasi bersih yang kamu terima.","keywords":"saham,fee broker,komisi,beli saham,jual saham,investasi,sekuritas"};
export function render(root) {

    let mode = 'beli';
    const nilaiI = T.input('text', 'cth: 10000000', '');
    nilaiI.inputMode = 'decimal';
    const fbI = T.input('text', 'cth: 0,19', '0,19');
    fbI.inputMode = 'decimal';
    const fjI = T.input('text', 'cth: 0,29', '0,29');
    fjI.inputMode = 'decimal';
    const box = T.out();

    const persen = (p) => String(p).replace('.', ',') + '%';

    const setMode = (m) => {
      mode = m;
      bBeli.classList.toggle('primary', m === 'beli');
      bJual.classList.toggle('primary', m === 'jual');
      hitung();
    };
    const bBeli = T.btn('🛒 Beli', () => setMode('beli'));
    const bJual = T.btn('💰 Jual', () => setMode('jual'));

    const hitung = () => {
      const nilai = T.num(nilaiI.value);
      const fb = T.num(fbI.value);
      const fj = T.num(fjI.value);
      if (!(nilai > 0)) {
        T.show(box, '<p class="hint center">Isi nilai transaksi dulu — fee-nya dihitung otomatis.</p>');
        return;
      }
      if (!isFinite(fb) || !isFinite(fj) || fb < 0 || fj < 0) {
        T.show(box, '<p class="err">Fee harus angka 0 atau lebih, ya.</p>');
        return;
      }
      const feeBeli = nilai * fb / 100;
      const feeJual = nilai * fj / 100;
      if (mode === 'beli') {
        T.show(box,
          '<div class="big center">' + T.rp(nilai + feeBeli) + '</div>' +
          '<p class="center">itu total yang harus kamu siapkan buat beli.</p>' +
          kv('Nilai transaksi', T.rp(nilai)) +
          kv('Fee broker beli (' + persen(fb) + ')', T.rp(feeBeli)) +
          '<p class="hint">Fee tiap sekuritas beda-beda — sesuaikan angka % di atas sama aplikasimu.</p>');
      } else {
        T.show(box,
          '<div class="big center">' + T.rp(nilai - feeJual) + '</div>' +
          '<p class="center">itu bersih yang masuk ke kantongmu setelah jual.</p>' +
          kv('Nilai transaksi', T.rp(nilai)) +
          kv('Fee broker jual (' + persen(fj) + ')', T.rp(feeJual)) +
          '<p class="hint">Ini murni fee broker aja — belum termasuk pajak & biaya lain kalau ada.</p>');
      }
    };
    [nilaiI, fbI, fjI].forEach((i) => i.addEventListener('input', hitung));

    root.appendChild(T.el('<p class="note">Fee kecil-kecil jadi bukit — hitung dulu sebelum checkout saham. Pilih mode beli/jual, lalu isi angkanya.</p>'));
    root.appendChild(T.row(bBeli, bJual));
    root.appendChild(T.field('Nilai transaksi (Rp)', nilaiI, 'Total nilai saham yang dibeli/dijual.'));
    root.appendChild(T.grid2(
      T.field('Fee beli (%)', fbI, 'Default 0,19% — bisa diubah.'),
      T.field('Fee jual (%)', fjI, 'Default 0,29% — bisa diubah.')
    ));
    root.appendChild(box);
    setMode('beli');

}
