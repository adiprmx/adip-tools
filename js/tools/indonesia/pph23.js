import { h as T, utils, money, kv } from '../../core.js?v=6.13.0';

// PPh 23, Pasal 23 UU PPh jo PMK 141/PMK.03/2015:
// 2% untuk sewa (selain tanah/bangunan) dan imbalan jasa;
// 15% untuk dividen, bunga, royalti, hadiah/penghargaan.
// Penerima tanpa NPWP dikenai tarif 100% lebih tinggi (Pasal 23 ayat 1a).
// Sewa tanah/bangunan BUKAN PPh 23: PPh final Pasal 4 ayat (2) sebesar 10%.
const PPH23_TARIF = { jasa: 2, sewa: 2, dividen: 15, bunga: 15, royalti: 15, hadiah: 15, 'sewa-tb': 10 };

utils.pph23 = function (o) {
  const jenis = PPH23_TARIF[o.jenis] != null ? o.jenis : 'jasa';
  const bruto = Math.max(0, Number(o.bruto) || 0);
  const dasar = (o.tarif != null && isFinite(Number(o.tarif)) && Number(o.tarif) >= 0)
    ? Number(o.tarif) : PPH23_TARIF[jenis];
  const final = jenis === 'sewa-tb';
  const tarif = (!final && !o.npwp) ? dasar * 2 : dasar;
  const pajak = bruto * tarif / 100;
  return { jenis, tarif, pajak, diterima: bruto - pajak, final };
};

export const meta = {"id": "pph23", "name": "Kalkulator PPh 23", "cat": "indonesia", "icon": "🧾", "desc": "Hitung potongan PPh 23 atas jasa, sewa, bunga, dan royalti.", "keywords": "pph 23,pajak,jasa,sewa,royalti,bunga,dividen,potongan,npwp", "since": "6.11.0"};
export function render(root) {
  const jenisSel = T.select([
    ['jasa', 'Jasa (konsultan, desain, cleaning, dll), 2%'],
    ['sewa', 'Sewa selain tanah/bangunan (alat, mesin, kendaraan), 2%'],
    ['dividen', 'Dividen, 15%'],
    ['bunga', 'Bunga, 15%'],
    ['royalti', 'Royalti, 15%'],
    ['hadiah', 'Hadiah / penghargaan / bonus, 15%'],
    ['sewa-tb', 'Sewa tanah / bangunan, PPh final 10% (bukan PPh 23)'],
  ], 'jasa');
  const brutoI = money(null, 'cth: 50000000');
  const npwpSel = T.select([
    ['ya', 'Punya NPWP'],
    ['tidak', 'Tidak punya NPWP (tarif 2x lipat)'],
  ], 'ya');
  const tarifI = T.input('text', 'cth: 2', '2'); tarifI.inputMode = 'decimal';
  const box = T.out();

  const fldNpwp = T.field('Status NPWP penerima', npwpSel);
  const aturJenis = () => {
    tarifI.value = String(PPH23_TARIF[jenisSel.value]);
    fldNpwp.hidden = jenisSel.value === 'sewa-tb';
    hitung();
  };
  jenisSel.addEventListener('change', aturJenis);

  const hitung = () => {
    const bruto = T.num(brutoI.value) || 0;
    if (!(bruto > 0)) { T.hide(box); return; }
    const tarifInput = T.num(tarifI.value);
    if (!(tarifInput >= 0 && tarifInput <= 100)) { T.show(box, '<p class="warn">Tarif harus 0-100%.</p>'); return; }
    const r = utils.pph23({
      jenis: jenisSel.value, bruto,
      npwp: npwpSel.value === 'ya', tarif: tarifInput,
    });
    const labelPajak = r.final ? 'PPh final Pasal 4 ayat (2)' : 'PPh 23 yang dipotong';
    let catatan = '';
    if (r.jenis === 'dividen') catatan = 'Catatan: dividen yang diterima wajib pajak badan dalam negeri bukan objek pajak, dan dividen orang pribadi dikenai PPh final 10% yang bisa dibebaskan bila diinvestasikan (UU HPP). Tarif 15% di sini hanya untuk dividen yang masih menjadi objek PPh 23.';
    else if (r.final) catatan = 'Sewa tanah dan bangunan tidak masuk PPh 23. Pajaknya PPh final 10% dari nilai sewa (PP 34/2016), dipotong penyewa bila penyewa ditunjuk sebagai pemotong.';
    else if (!npwpSel.value || npwpSel.value === 'tidak') catatan = 'Penerima tanpa NPWP dikenai tarif 100% lebih tinggi, jadi ' + T.esc(String(tarifInput)) + '% menjadi ' + T.esc(String(r.tarif)) + '% (Pasal 23 ayat 1a UU PPh).';
    T.show(box,
      '<div class="big">' + T.rp(Math.round(r.pajak)) + '</div>' +
      '<p class="center mut">' + T.esc(labelPajak) + ' dari bruto ' + T.rp(bruto) + '</p>' +
      kv('Tarif yang dipakai', T.esc(String(r.tarif)) + '%') +
      kv('Jumlah diterima penerima', '<b>' + T.rp(Math.round(r.diterima)) + '</b>') +
      '<p class="hint">Dasar: Pasal 23 UU PPh (diubah terakhir UU HPP 7/2021) dan PMK 141/PMK.03/2015 untuk daftar jasa yang kena 2%. Tarif dihitung dari jumlah bruto tidak termasuk PPN. PPh 23 bersifat tidak final, jadi bisa dikreditkan di SPT tahunan penerima. Setor paling lambat tanggal 15 bulan berikutnya dan lapor SPT Masa paling lambat tanggal 20 (PMK 81/2024).' + (catatan ? ' ' + catatan : '') + '</p>');
  };
  [brutoI, tarifI].forEach((i) => i.addEventListener('input', hitung));
  npwpSel.addEventListener('change', hitung);

  root.appendChild(T.el('<p class="note">Bayar jasa, sewa, bunga, atau royalti ke pihak lain? Sebagian dipotong dulu sebagai PPh 23 sebelum dibayarkan. Pilih jenis penghasilannya, tarifnya terisi otomatis dan tetap bisa diubah.</p>'));
  root.appendChild(T.field('Jenis penghasilan', jenisSel));
  root.appendChild(T.field('Jumlah bruto (Rp)', brutoI, 'Nilai sebelum pajak, tidak termasuk PPN'));
  root.appendChild(fldNpwp);
  root.appendChild(T.field('Tarif (%)', tarifI, 'Terisi otomatis dari jenis penghasilan, bisa diubah'));
  root.appendChild(box);
  hitung();
}
