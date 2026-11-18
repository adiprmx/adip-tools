import { h as T, utils, money, kv } from '../../core.js';

// PPh Pasal 4 ayat (2) atas sewa tanah dan/atau bangunan: tarif final 10%
// dari jumlah bruto nilai sewa (PP 34/2017, berlaku sejak 2 Januari 2018).
// Yang memotong: penyewa yang merupakan badan, instansi pemerintah, atau
// orang pribadi yang ditunjuk sebagai pemotong. Bila penyewa perorangan
// biasa (bukan pemotong), pemilik menyetor sendiri pajaknya.
export function hitungPphSewa(sewa, periode) {
  const bruto = Math.max(0, Number(sewa) || 0);
  const pph = bruto * 10 / 100;
  const bersih = bruto - pph;
  const per = periode === 'bulan' ? { pphBulan: pph, pphTahun: pph * 12, bersihBulan: bersih, bersihTahun: bersih * 12 }
    : { pphBulan: pph / 12, pphTahun: pph, bersihBulan: bersih / 12, bersihTahun: bersih };
  return { bruto, pph, bersih, ...per };
}
utils.pphSewaTanahBangunan = hitungPphSewa;

export const meta = {"id": "kalkulator-pph-4-2-sewa-tanah-bangunan-10", "name": "Kalkulator PPh 4(2) Sewa Tanah/Bangunan 10%", "cat": "indonesia", "icon": "🏢", "desc": "Hitung PPh final 10% atas sewa tanah atau bangunan, dan siapa yang memotongnya.", "keywords": "pph,sewa,tanah,bangunan,10 persen,final,kontrakan,kos,ruko,pp 34 2017", "since": "6.17.0"};
export function render(root) {
  const sewaI = money(null, 'cth: 120000000');
  const periodeSel = T.select([['tahun', 'Per tahun'], ['bulan', 'Per bulan']], 'tahun');
  const penyewaSel = T.select([
    ['badan', 'Penyewa perusahaan / instansi pemerintah'],
    ['perorangan', 'Penyewa perorangan biasa'],
  ], 'badan');
  const box = T.out();

  const hitung = () => {
    const sewa = T.num(sewaI.value) || 0;
    if (!(sewa > 0)) { T.hide(box); return; }
    const r = hitungPphSewa(sewa, periodeSel.value);
    const pemotong = penyewaSel.value === 'badan'
      ? 'Penyewa memotong 10% dari sewa dan menyetorkannya ke negara. Pemilik menerima sewa bersih setelah dipotong.'
      : 'Penyewa perorangan biasa bukan pemotong pajak. Pemilik menerima sewa penuh, lalu menyetor sendiri PPh 10% ke negara.';
    T.show(box,
      '<div class="big">' + T.rp(Math.round(r.pph)) + '</div>' +
      '<p class="center mut">PPh final 10% atas sewa ' + (periodeSel.value === 'tahun' ? 'setahun' : 'sebulan') + '.</p>' +
      kv('Nilai sewa kotor', T.rp(r.bruto) + ' / ' + (periodeSel.value === 'tahun' ? 'tahun' : 'bulan')) +
      kv('PPh final 10%', T.rp(Math.round(r.pph))) +
      kv('Sewa bersih yang diterima pemilik', '<b>' + T.rp(Math.round(r.bersih)) + '</b>') +
      kv('PPh setahun', T.rp(Math.round(r.pphTahun))) +
      kv('Sewa bersih setahun', T.rp(Math.round(r.bersihTahun))) +
      '<p class="hint">' + pemotong + ' Dasar: PP 34/2017, tarif final 10% dari jumlah bruto nilai sewa, berlaku sejak 2 Januari 2018. Pajak ini bersifat final, jadi penghasilan sewa ini tidak dihitung lagi di SPT tahunan pemilik. Bila sewa dibayar sekaligus untuk beberapa tahun, PPh dihitung dari total yang dibayar di muka.</p>');
  };
  [sewaI, periodeSel, penyewaSel].forEach((i) => i.addEventListener('input', hitung));
  periodeSel.addEventListener('change', hitung);
  penyewaSel.addEventListener('change', hitung);

  root.appendChild(T.el('<p class="note">Menyewakan tanah, rumah, ruko, atau kos? Sewanya kena pajak final 10% dari nilai kotor, tidak peduli berapa biayamu.</p>'));
  root.appendChild(T.field('Nilai sewa (Rp)', sewaI, 'Jumlah kotor sebelum dipotong pajak'));
  root.appendChild(T.grid2(
    T.field('Periode sewa', periodeSel),
    T.field('Siapa penyewanya', penyewaSel, 'Menentukan siapa yang memotong dan menyetor pajaknya')
  ));
  root.appendChild(box);
  hitung();
}
