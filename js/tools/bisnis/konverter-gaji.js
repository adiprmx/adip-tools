import { h as T, utils, money, kv } from '../../core.js?v=6.12.1';

// Logika murni (bisa di-test di Node).
// Asumsi: setahun = 52 minggu, sebulan = 52/12 minggu.
utils.konverterGaji = function (o) {
  const nominal = Math.max(0, Number(o.nominal) || 0);
  const jamHari = Math.max(1, Number(o.jamHari) || 8);
  const hariMinggu = Math.min(7, Math.max(1, Number(o.hariMinggu) || 5));
  const jamMinggu = jamHari * hariMinggu;
  let tahun = 0;
  if (o.dari === 'jam') tahun = nominal * jamMinggu * 52;
  else if (o.dari === 'hari') tahun = nominal * hariMinggu * 52;
  else if (o.dari === 'minggu') tahun = nominal * 52;
  else if (o.dari === 'bulan') tahun = nominal * 12;
  else tahun = nominal;
  const minggu = tahun / 52;
  return {
    jam: minggu / jamMinggu, hari: minggu / hariMinggu,
    minggu, bulan: tahun / 12, tahun,
  };
};

export const meta = {"id": "konverter-gaji", "name": "Konverter Gaji", "cat": "bisnis", "icon": "🔄", "desc": "Ubah gaji per jam, hari, minggu, bulan, atau tahun.", "keywords": "gaji,konversi,per jam,per hari,per minggu,per bulan,per tahun,rate", "since": "6.11.0"};
export function render(root) {
  const nominalI = money(null, 'cth: 5000000');
  const dariSel = T.select([
    ['bulan', 'Per bulan'],
    ['tahun', 'Per tahun'],
    ['minggu', 'Per minggu'],
    ['hari', 'Per hari'],
    ['jam', 'Per jam'],
  ], 'bulan');
  const jamI = T.input('text', 'cth: 8', '8'); jamI.inputMode = 'decimal';
  const hariI = T.input('text', 'cth: 5', '5'); hariI.inputMode = 'decimal';
  const box = T.out();

  const label = { jam: 'Per jam', hari: 'Per hari', minggu: 'Per minggu', bulan: 'Per bulan', tahun: 'Per tahun' };

  const hitung = () => {
    const nominal = T.num(nominalI.value) || 0;
    if (!(nominal > 0)) { T.hide(box); return; }
    const r = utils.konverterGaji({
      nominal, dari: dariSel.value,
      jamHari: T.num(jamI.value), hariMinggu: T.num(hariI.value),
    });
    const baris = (k) => kv(label[k] + (k === dariSel.value ? ' (yang kamu isi)' : ''),
      (k === dariSel.value ? '<b>' : '') + T.rp(Math.round(r[k])) + (k === dariSel.value ? '</b>' : ''));
    T.show(box,
      baris('jam') + baris('hari') + baris('minggu') + baris('bulan') + baris('tahun') +
      '<p class="hint">Dihitung dengan asumsi setahun 52 minggu dan sebulan 52/12 minggu. Angka ini gaji kotor sebelum potongan BPJS dan pajak.</p>');
  };
  [nominalI, jamI, hariI].forEach((i) => i.addEventListener('input', hitung));
  dariSel.addEventListener('change', hitung);

  root.appendChild(T.el('<p class="note">Tawaran kerja ditulis per jam, tapi gajimu sekarang per bulan? Ubah dulu ke satuan yang sama biar gampang dibandingin.</p>'));
  root.appendChild(T.field('Nominal gaji (Rp)', nominalI));
  root.appendChild(T.field('Nominal di atas itu per', dariSel));
  root.appendChild(T.grid2(
    T.field('Jam kerja per hari', jamI),
    T.field('Hari kerja per minggu', hariI)
  ));
  root.appendChild(box);
  hitung();
}
