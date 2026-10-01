import { h as T, utils, kv } from '../../core.js?v=6.3.0';

export const meta = {
  id: 'simulasi-deposito',
  name: 'Simulasi Deposito',
  cat: 'bisnis',
  icon: '🏦',
  desc: 'Simulasi bunga deposito: bruto, pajak 20%, dan hasil bersih yang kamu terima.',
  keywords: 'deposito,bunga,bank,tabungan,pajak bunga,investasi,simulasi',
};

export function render(root) {
  const pokokI = T.input('text', 'cth: 10000000', '');
  pokokI.inputMode = 'decimal';
  const tenorI = T.input('number', 'cth: 12', '12');
  tenorI.min = '1'; tenorI.max = '60';
  const bungaI = T.input('text', 'cth: 4,5', '4.5');
  bungaI.inputMode = 'decimal';
  const box = T.out();

  const hitung = () => {
    const pokok = T.num(pokokI.value);
    const tenor = Math.round(T.num(tenorI.value));
    const bunga = T.num(bungaI.value);
    if (!(pokok > 0)) { T.show(box, '<p class="warn">Isi dulu pokok depositonya (Rp).</p>'); return; }
    if (!(tenor > 0)) { T.show(box, '<p class="warn">Tenor minimal 1 bulan.</p>'); return; }
    if (!(bunga >= 0)) { T.show(box, '<p class="warn">Bunga tahunannya belum valid.</p>'); return; }

    const bruto = pokok * (bunga / 100) * (tenor / 12); // bunga sederhana (flat)
    const pajak = bruto * 0.20;                        // PPh bunga deposito 20%
    const bersih = bruto - pajak;
    const akhir = pokok + bersih;
    const perBulan = bersih / tenor;

    T.show(box,
      '<div class="big center">' + T.rp(akhir) + '</div>' +
      '<p class="center mut">total diterima saat jatuh tempo (' + tenor + ' bulan)</p>' +
      kv('Pokok', T.rp(pokok)) +
      kv('Bunga bruto (' + T.esc(String(bunga)) + '%/thn)', '+' + T.rp(bruto)) +
      kv('Pajak bunga 20%', '−' + T.rp(pajak)) +
      kv('Bunga bersih', '<b>+' + T.rp(bersih) + '</b>') +
      kv('Estimasi / bulan', T.rp(perBulan)) +
      '<p class="hint">Dihitung dengan bunga sederhana (flat), belum termasuk biaya admin/pinalti kalau dicairkan sebelum jatuh tempo. ' +
      'Bunga tiap bank beda-beda — angka di atas pakai yang kamu input sendiri.</p>');
  };

  root.appendChild(T.el('<p class="note">Deposito itu "uang kerja diam-diam": taruh, tunggu, panen bunga. Tapi ingat, bunganya dipotong pajak 20% — yang masuk kantongmu itu yang bersih.</p>'));
  root.appendChild(T.field('Pokok deposito (Rp)', pokokI, 'Modal awal yang dititipkan ke bank.'));
  root.appendChild(T.grid2(
    T.field('Tenor (bulan)', tenorI, '1, 3, 6, 12, dst.'),
    T.field('Bunga (% per tahun)', bungaI, 'Cek rate bank pilihanmu.')
  ));
  root.appendChild(T.row(T.btn('Simulasikan', hitung, true)));
  root.appendChild(box);
  [pokokI, tenorI, bungaI].forEach((i) => i.addEventListener('input', hitung));
}
