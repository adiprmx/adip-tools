import { h as T, utils } from '../../core.js';

// parseRp kanonis tinggal di utils (core.js).

// Angka BPJS Ketenagakerjaan — dicek 20 Nov 2026 (sumber: Surat BPJS
// Ketenagakerjaan B/1226/022026 tgl 25 Feb 2026; PP 45/2015; PP 46/2015):
// - Batas upah Jaminan Pensiun (JP): Rp11.086.300/bln sejak 1 Mar 2026
//   (naik dari Rp10.547.400; = 10.547.400 x (1 + 5,11% PDB 2025), dibulatkan;
//   disesuaikan tiap Maret per PP 45/2015 Pasal 29). JHT tanpa batas upah.
// - Iuran: JHT 2% pekerja + 3,7% perusahaan; JP 1% pekerja + 2% perusahaan.
// - Usia pensiun 59 tahun (2025–2027; PP 45/2015 Pasal 15: 56 thn awal,
//   +1 thn tiap 3 thn sejak 2019, sampai 65 thn).
// - Manfaat pensiun: 1% x masa iur (tahun) x rata-rata upah tertimbang
//   selama masa iur (PP 45/2015 Pasal 17). Tool ini memakai gaji sekarang
//   sebagai perkiraan atas rata-rata upah itu. Manfaat ada batas bawah/atas
//   yang disesuaikan tiap tahun dengan inflasi (PP 45/2015 Pasal 18; awal
//   Rp300.000–Rp3.600.000/bln) — nilai 2026-nya belum terverifikasi, jadi
//   TIDAK dipakai sebagai pembatas di sini; angka resmi ikut BPJS TK.
export const BATAS_UPAH_JP = 11086300;
export const USIA_PENSIUN_SAAT_INI = 59;
utils.bpjsTkBatasUpahJp = BATAS_UPAH_JP;

export const meta = {"id": "simulasi-bpjs-tk", "name": "Simulasi BPJS Ketenagakerjaan", "cat": "indonesia", "icon": "🛡️", "desc": "Hitung iuran JHT dan Jaminan Pensiun dari gajimu, plus perkiraan saldo dan uang pensiun nanti.", "keywords": "bpjs,ketenagakerjaan,jht,jp,pensiun,iuran,gaji,pensiunan"};
export function render(root) {
  const gajiI = T.input('text', 'cth: 5000000', '5000000'); gajiI.inputMode = 'decimal';
  const usiaI = T.input('number', 'cth: 30', '30');
  const mulaiI = T.input('number', 'cth: 25', '25');
  const pensiunI = T.input('number', 'cth: 59', '59');
  const saldoI = T.input('text', 'cth: 0', '0'); saldoI.inputMode = 'decimal';
  const hasilI = T.input('number', 'cth: 5', '5');
  const jhtPekerjaI = T.input('number', 'cth: 2', '2');
  const jhtPerusahaanI = T.input('text', 'cth: 3,7', '3,7'); jhtPerusahaanI.inputMode = 'decimal'; // JANGAN type=number: browser membuang nilai desimal koma ('3,7' -> '')
  const jpPekerjaI = T.input('number', 'cth: 1', '1');
  const jpPerusahaanI = T.input('number', 'cth: 2', '2');
  const batasJpI = T.input('text', 'cth: 11086300', String(BATAS_UPAH_JP)); batasJpI.inputMode = 'decimal';
  const box = T.out();

  const kvTable = (pairs) => '<table style="width:100%;border-collapse:collapse;font-size:13.5px">' +
    pairs.map((p) => '<tr><td style="padding:7px 4px;color:#a8a29e">' + T.esc(p[0]) + '</td>' +
      '<td style="padding:7px 4px;text-align:right;font-weight:600">' + p[1] + '</td></tr>').join('') + '</table>';

  const hitung = () => {
    const gaji = utils.parseRp(gajiI.value) || 0;
    const usia = Math.floor(T.num(usiaI.value) || 0);
    const mulai = Math.floor(T.num(mulaiI.value) || 0);
    const pensiun = Math.floor(T.num(pensiunI.value) || 0);
    const saldoAwal = utils.parseRp(saldoI.value) || 0;
    const hasil = (T.num(hasilI.value) || 0) / 100;
    const jhtP = (T.num(jhtPekerjaI.value) || 0) / 100;
    const jhtPr = (T.num(jhtPerusahaanI.value) || 0) / 100;
    const jpP = (T.num(jpPekerjaI.value) || 0) / 100;
    const jpPr = (T.num(jpPerusahaanI.value) || 0) / 100;
    const batasJp = utils.parseRp(batasJpI.value) || 0;
    if (!(gaji > 0)) { T.show(box, '<p class="warn">Isi gajimu dulu ya.</p>'); return; }
    if (!(pensiun > usia) || !(pensiun > mulai)) { T.show(box, '<p class="warn">Usia pensiun harus lebih besar dari usia sekarang dan usia mulai kerja.</p>'); return; }

    const upahJp = batasJp > 0 ? Math.min(gaji, batasJp) : gaji;
    const jhtPekerja = gaji * jhtP;
    const jhtPerusahaan = gaji * jhtPr;
    const jpPekerja = upahJp * jpP;
    const jpPerusahaan = upahJp * jpPr;
    const potongGaji = jhtPekerja + jpPekerja;
    const totalIuran = jhtPekerja + jhtPerusahaan + jpPekerja + jpPerusahaan;

    const sisaBulan = (pensiun - usia) * 12;
    const sisaTahun = pensiun - usia;
    const masaIur = pensiun - mulai;
    const iuranJhtBulan = jhtPekerja + jhtPerusahaan;
    const iBulanan = hasil / 12;
    let fvIuran;
    if (iBulanan > 0) fvIuran = iuranJhtBulan * (Math.pow(1 + iBulanan, sisaBulan) - 1) / iBulanan;
    else fvIuran = iuranJhtBulan * sisaBulan;
    const fvSaldo = saldoAwal * Math.pow(1 + hasil, sisaTahun);
    const saldoJht = fvIuran + fvSaldo;

    const pensiunBulan = 0.01 * masaIur * gaji;
    const jpLayak = masaIur >= 15;

    T.show(box,
      '<p class="mut" style="font-weight:600;margin:4px 0">Iuran tiap bulan</p>' +
      kvTable([
        ['JHT — potong gajimu (' + T.esc(jhtPekerjaI.value) + '%)', T.rp(jhtPekerja)],
        ['JHT — dibayar perusahaan (' + T.esc(jhtPerusahaanI.value) + '%)', T.rp(jhtPerusahaan)],
        ['Jaminan Pensiun — potong gajimu (' + T.esc(jpPekerjaI.value) + '% × ' + T.rp(upahJp) + ')', T.rp(jpPekerja)],
        ['Jaminan Pensiun — dibayar perusahaan (' + T.esc(jpPerusahaanI.value) + '%)', T.rp(jpPerusahaan)],
        ['Total dipotong dari gajimu', '<b>' + T.rp(potongGaji) + '</b>'],
        ['Total iuran (kamu + perusahaan)', T.rp(totalIuran)],
      ]) +
      '<p class="mut" style="font-weight:600;margin:14px 0 4px">Perkiraan saat pensiun (usia ' + pensiun + ')</p>' +
      '<div class="big">' + T.rp(saldoJht) + '</div>' +
      '<p class="hint">Perkiraan saldo JHT: iuran ' + T.rp(iuranJhtBulan) + '/bulan selama ' + sisaTahun + ' tahun lagi' +
      (saldoAwal > 0 ? ' + saldo sekarang ' + T.rp(saldoAwal) : '') +
      ', dengan asumsi hasil pengembangan ' + T.esc(hasilI.value) + '%/tahun. Angka ini perkiraan — hasil pengembangan sebenarnya naik-turun tiap tahun.</p>' +
      (jpLayak
        ? '<div class="big ok" style="margin-top:10px">' + T.rp(pensiunBulan) + ' <span class="mut" style="font-size:14px">/ bulan</span></div>' +
          '<p class="hint">Perkiraan uang pensiun bulanan: 1% × ' + masaIur + ' tahun masa iur × gaji ' + T.rp(gaji) + '. Syarat minimal masa iur 15 tahun terpenuhi. Aturan aslinya memakai rata-rata upah selama masa iur (bukan gaji sekarang), dan uang pensiun ada batas bawah/atas yang naik tiap tahun mengikuti inflasi — jadi angka ini perkiraan kasar, angka pastinya ikut BPJS Ketenagakerjaan.</p>'
        : '<p class="warn" style="margin-top:10px">Masa iurmu ' + masaIur + ' tahun — kurang dari syarat minimal 15 tahun, jadi uang pensiun bulanan belum didapat. Yang diterima nanti adalah uang tunai sekaligus dari iuran Jaminan Pensiun yang sudah dibayar.</p>') +
      '<p class="hint">Aturan per 1 Maret 2026: batas upah Jaminan Pensiun ' + T.rp(batasJp) + '/bulan (disesuaikan tiap Maret; sebelumnya Rp10.547.400). Usia pensiun 59 tahun berlaku 2025–2027. Angka dicek 20 Nov 2026 (Surat BPJS Ketenagakerjaan B/1226/022026). Semua angka di atas bisa diubah sesuai aturan terbaru atau slip gajimu. Angka resmi tetap ikut BPJS Ketenagakerjaan.</p>');
  };

  [gajiI, usiaI, mulaiI, pensiunI, saldoI, hasilI, jhtPekerjaI, jhtPerusahaanI, jpPekerjaI, jpPerusahaanI, batasJpI].forEach((el) => el.addEventListener('input', hitung));

  root.appendChild(T.el('<p class="note">Dari gajimu, ketahuan berapa iuran BPJS Ketenagakerjaan tiap bulan, berapa kira-kira saldo JHT saat pensiun, dan berapa uang pensiun bulanannya.</p>'));
  root.appendChild(T.grid2(
    T.field('Gaji / upah per bulan (Rp)', gajiI, 'Gaji pokok + tunjangan tetap'),
    T.field('Usia kamu sekarang', usiaI),
    T.field('Usia mulai kerja', mulaiI, 'Sejak kapan ikut BPJS TK'),
    T.field('Usia pensiun yang dituju', pensiunI, 'Aturan sekarang: 59 tahun'),
    T.field('Saldo JHT sekarang (Rp)', saldoI, 'Boleh 0 kalau belum tahu — cek di JMO'),
    T.field('Asumsi hasil pengembangan JHT (%/tahun)', hasilI, 'Perkiraan saja, bisa diubah')
  ));
  root.appendChild(T.el('<p class="mut" style="font-weight:600;margin:14px 0 4px">Angka aturan (bisa diubah)</p>'));
  root.appendChild(T.grid2(
    T.field('JHT — bagian pekerja (%)', jhtPekerjaI),
    T.field('JHT — bagian perusahaan (%)', jhtPerusahaanI),
    T.field('Jaminan Pensiun — bagian pekerja (%)', jpPekerjaI),
    T.field('Jaminan Pensiun — bagian perusahaan (%)', jpPerusahaanI),
    T.field('Batas upah Jaminan Pensiun (Rp/bln)', batasJpI, 'Berlaku 1 Mar 2026 — dicek 20 Nov 2026')
  ));
  root.appendChild(T.row(T.btn('Hitung simulasi', hitung, true)));
  root.appendChild(box);
  hitung();
}
