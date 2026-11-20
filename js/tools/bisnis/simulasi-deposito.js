import { h as T, utils, kv } from '../../core.js';

export const meta = {
  id: 'simulasi-deposito',
  name: 'Simulasi Deposito',
  cat: 'bisnis',
  icon: '🏦',
  desc: 'Simulasi bunga deposito: bruto, pajak 20%, dan hasil bersih yang kamu terima.',
  keywords: 'deposito,bunga,bank,tabungan,pajak bunga,investasi,simulasi',
};

// Pajak bunga deposito (PPh final 20% dari bunga bruto) — PP 131/2000 jo
// PP 123/2015, pelaksana PMK 212/PMK.03/2018. PENGECUALIAN (Pasal 7 PMK
// 212/2018): bunga TIDAK dipotong pajak bila JUMLAH simpanan (deposito +
// tabungan + SBI) tidak melebihi Rp7.500.000 dan bukan hasil pecah-pecah.
// Ambangnya pada jumlah SIMPANAN, bukan pada bunga per bulan. Tool ini hanya
// tahu deposito yang diisi di sini — bila kamu punya tabungan lain di bank
// yang sama, jumlah gabungannya yang menentukan bebas atau tidak.
// Logika murni (bisa di-test di Node).
export const BATAS_BEBAS_PAJAK_DEPOSITO = 7500000;
export function hitungDeposito(pokok, tenor, bunga) {
  const p = Number(pokok), t = Number(tenor), b = Number(bunga);
  if (![p, t, b].every(Number.isFinite) || !(p > 0) || !(t > 0) || !(b >= 0)) return null;
  const bruto = p * (b / 100) * (t / 12); // bunga sederhana (flat)
  const bebasPajak = p <= BATAS_BEBAS_PAJAK_DEPOSITO;
  const pajak = bebasPajak ? 0 : bruto * 0.20; // PPh bunga deposito 20%
  const bersih = bruto - pajak;
  return { bruto, pajak, bersih, akhir: p + bersih, perBulan: bersih / t, bebasPajak };
}
utils.hitungDeposito = hitungDeposito;

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
    if (!(bunga >= 0)) { T.show(box, '<p class="warn">Bunga tahunannya belum benar.</p>'); return; }

    const r = hitungDeposito(pokok, tenor, bunga);
    if (r === null) { T.show(box, '<p class="warn">Angkanya belum benar. Periksa lagi pokok, tenor, dan bunganya.</p>'); return; }
    const { bruto, pajak, bersih, akhir, perBulan, bebasPajak } = r;

    T.show(box,
      '<div class="big center">' + T.rp(akhir) + '</div>' +
      '<p class="center mut">total diterima saat jatuh tempo (' + tenor + ' bulan)</p>' +
      kv('Pokok', T.rp(pokok)) +
      kv('Bunga bruto (' + T.esc(String(bunga)) + '%/thn)', '+' + T.rp(bruto)) +
      (bebasPajak
        ? kv('Pajak bunga', 'Rp0 — bebas, simpanan ≤ Rp7,5 juta')
        : kv('Pajak bunga 20%', '−' + T.rp(pajak))) +
      kv('Bunga bersih', '<b>+' + T.rp(bersih) + '</b>') +
      kv('Estimasi / bulan', T.rp(perBulan)) +
      '<p class="hint">Dihitung dengan bunga sederhana (flat), belum termasuk biaya admin/pinalti kalau dicairkan sebelum jatuh tempo. ' +
      'Bunga tiap bank beda-beda — angka di atas pakai yang kamu isi sendiri. ' +
      (bebasPajak
        ? 'Simpanan Rp7,5 juta ke bawah bebas pajak bunga (PMK 212/2018), selama bukan hasil memecah simpanan besar jadi kecil-kecil. Catatan: yang dihitung aturan adalah total simpananmu (deposito + tabungan), bukan deposito ini saja — kalau totalnya di atas Rp7,5 juta, bunganya kena pajak 20%.'
        : 'Bunga deposito kena pajak 20% (PMK 212/2018). Kalau total simpananmu (deposito + tabungan) Rp7,5 juta ke bawah, bunganya bebas pajak — dihitung dari pokok, bukan dari besar bunganya.') + '</p>');
  };

  root.appendChild(T.el('<p class="note">Deposito itu "uang kerja diam-diam": taruh, tunggu, panen bunga. Tapi ingat, bunganya dipotong pajak 20% — kecuali simpanannya Rp7,5 juta ke bawah, itu bebas pajak. Yang masuk kantongmu itu yang bersih.</p>'));
  root.appendChild(T.field('Pokok deposito (Rp)', pokokI, 'Modal awal yang dititipkan ke bank.'));
  root.appendChild(T.grid2(
    T.field('Tenor (bulan)', tenorI, '1, 3, 6, 12, dst.'),
    T.field('Bunga (% per tahun)', bungaI, 'Cek rate bank pilihanmu.')
  ));
  root.appendChild(T.row(T.btn('Simulasikan', hitung, true)));
  root.appendChild(box);
  [pokokI, tenorI, bungaI].forEach((i) => i.addEventListener('input', hitung));
}
