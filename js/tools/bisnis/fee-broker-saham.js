import { h as T, kv, utils } from '../../core.js';

// PPh final atas penjualan saham di bursa efek: 0,1% dari nilai bruto
// transaksi jual (PP 41/1994 jo PP 14/1997; Pasal 244 PMK 81/2024).
// Dipotong broker saat pelunasan, berlaku walau jualnya rugi.
// Dicek ulang 20 Nov 2026.
export const PPH_FINAL_SAHAM_PERSEN = 0.1;

// Logika murni (bisa di-test di Node). Mode 'beli': yang disiapkan =
// nilai + fee beli. Mode 'jual': yang diterima = nilai − fee jual − PPh.
export function hitungFeeBroker(mode, nilai, feeBeliPct, feeJualPct, pphPct) {
  const n = Number(nilai);
  const fb = Number(feeBeliPct), fj = Number(feeJualPct), pp = Number(pphPct);
  if (![n, fb, fj, pp].every(isFinite) || n <= 0 || fb < 0 || fj < 0 || pp < 0) return null;
  if (mode === 'beli') {
    const fee = n * fb / 100;
    return { mode, nilai: n, fee, pph: 0, total: n + fee };
  }
  if (mode === 'jual') {
    const fee = n * fj / 100;
    const pph = n * pp / 100;
    return { mode, nilai: n, fee, pph, total: n - fee - pph };
  }
  return null;
}
utils.hitungFeeBroker = hitungFeeBroker;

export const meta = {"id":"fee-broker-saham","name":"Fee Broker Saham","cat":"bisnis","icon":"📉","desc":"Fee broker beli & jual saham + estimasi bersih yang kamu terima, sudah termasuk PPh final 0,1% saat jual.","keywords":"saham,fee broker,komisi,beli saham,jual saham,investasi,sekuritas,pph final"};
export function render(root) {

    let mode = 'beli';
    const nilaiI = T.input('text', 'cth: 10000000', '');
    nilaiI.inputMode = 'decimal';
    const fbI = T.input('text', 'cth: 0,19', '0,19');
    fbI.inputMode = 'decimal';
    const fjI = T.input('text', 'cth: 0,29', '0,29');
    fjI.inputMode = 'decimal';
    const pphI = T.input('text', 'cth: 0,1', '0,1');
    pphI.inputMode = 'decimal';
    const box = T.out();

    const persen = (p) => String(p).replace('.', ',') + '%';

    const setMode = (m) => {
      mode = m;
      bBeli.classList.toggle('primary', m === 'beli');
      bJual.classList.toggle('primary', m === 'jual');
      fldPph.hidden = m !== 'jual';
      hitung();
    };
    const bBeli = T.btn('🛒 Beli', () => setMode('beli'));
    const bJual = T.btn('💰 Jual', () => setMode('jual'));

    const hitung = () => {
      const nilai = T.num(nilaiI.value);
      const fb = T.num(fbI.value);
      const fj = T.num(fjI.value);
      const pp = T.num(pphI.value);
      if (!(nilai > 0)) {
        T.show(box, '<p class="hint center">Isi nilai transaksi dulu — fee-nya dihitung otomatis.</p>');
        return;
      }
      if (!isFinite(fb) || !isFinite(fj) || !isFinite(pp) || fb < 0 || fj < 0 || pp < 0) {
        T.show(box, '<p class="err">Fee dan pajak harus angka 0 atau lebih, ya.</p>');
        return;
      }
      const h = hitungFeeBroker(mode, nilai, fb, fj, pp);
      if (!h) { T.show(box, '<p class="err">Angkanya tidak bisa dihitung. Periksa lagi isianmu.</p>'); return; }
      if (mode === 'beli') {
        T.show(box,
          '<div class="big center">' + T.rp(h.total) + '</div>' +
          '<p class="center">itu total yang harus kamu siapkan buat beli.</p>' +
          kv('Nilai transaksi', T.rp(nilai)) +
          kv('Fee broker beli (' + persen(fb) + ')', T.rp(h.fee)) +
          '<p class="hint">Fee tiap sekuritas beda-beda — sesuaikan angka % di atas sama aplikasimu.</p>');
      } else {
        T.show(box,
          '<div class="big center">' + T.rp(h.total) + '</div>' +
          '<p class="center">itu bersih yang masuk ke kantongmu setelah jual.</p>' +
          kv('Nilai transaksi', T.rp(nilai)) +
          kv('Fee broker jual (' + persen(fj) + ')', T.rp(h.fee)) +
          kv('PPh final (' + persen(pp) + ' dari nilai jual)', '− ' + T.rp(h.pph)) +
          '<p class="hint">PPh final 0,1% dipotong broker dari nilai jual, berlaku walau jualnya rugi. Fee tiap sekuritas beda-beda — sesuaikan angka % di atas sama aplikasimu.</p>');
      }
    };
    [nilaiI, fbI, fjI, pphI].forEach((i) => i.addEventListener('input', hitung));

    root.appendChild(T.el('<p class="note">Fee kecil-kecil jadi bukit — hitung dulu sebelum checkout saham. Pilih mode beli/jual, lalu isi angkanya.</p>'));
    root.appendChild(T.row(bBeli, bJual));
    root.appendChild(T.field('Nilai transaksi (Rp)', nilaiI, 'Total nilai saham yang dibeli/dijual.'));
    root.appendChild(T.grid2(
      T.field('Fee beli (%)', fbI, 'Default 0,19% — bisa diubah.'),
      T.field('Fee jual (%)', fjI, 'Default 0,29% — bisa diubah.')
    ));
    const fldPph = T.field('PPh final jual (%)', pphI, 'Pajak final 0,1% dari nilai jual (PP 41/1994). Hanya dipakai di mode jual.');
    root.appendChild(fldPph);
    root.appendChild(box);
    setMode('beli');

}
