import { h as T, utils, kv } from '../../core.js';

export const meta = {"id": "kalkulator-dana-pendidikan", "name": "Kalkulator Dana Pendidikan", "cat": "bisnis", "icon": "🎓", "desc": "Proyeksi biaya sekolah anak TK sampai kuliah dengan inflasi pendidikan, plus tabungan bulanan yang perlu disiapkan.", "keywords": "dana pendidikan,biaya sekolah,anak,tabungan pendidikan,inflasi pendidikan,tk,sd,smp,sma,kuliah,ukt", "since": "6.13.0"};

// Jenjang: [id, nama, usia masuk, lama (tahun)].
const JENJANG = [
  ['tk', 'TK', 5, 2],
  ['sd', 'SD', 7, 6],
  ['smp', 'SMP', 13, 3],
  ['sma', 'SMA', 16, 3],
  ['kuliah', 'Kuliah (S1)', 19, 4],
];

// Biaya acuan per tahun (2025), sudah termasuk SPP + kegiatan + perlengkapan
// dasar; TIDAK termasuk uang pangkal, kos, transportasi, dan les.
// Sumber tiap angka tercantum di UI (bagian "Asumsi & sumber") — bukan angka
// tersembunyi. Angka bertanda (*) adalah perkiraan yang dilabeli jelas di UI.
const ACUAN = {
  negeri: { tk: 2000000, sd: 5000000, smp: 6000000, sma: 7000000, kuliah: 12000000 },
  swasta: { tk: 8000000, sd: 22000000, smp: 26400000, sma: 30800000, kuliah: 23000000 },
  unggulan: { tk: 20000000, sd: 45000000, smp: 54000000, sma: 63000000, kuliah: 275000000 },
};

function hitungDana(usia, inflasiPersen, biaya) {
  const r = inflasiPersen / 100;
  const perJenjang = [];
  let total = 0;
  let totalTanpaInflasi = 0;
  let bulanSampaiMasuk = null;
  JENJANG.forEach(([id, nama, masuk, lama]) => {
    const tahunLagi = masuk - usia;
    if (tahunLagi < 0) return; // jenjang sudah lewat
    const dasar = biaya[id] || 0;
    let totalJenjang = 0;
    for (let k = 0; k < lama; k++) totalJenjang += dasar * Math.pow(1 + r, tahunLagi + k);
    const biayaMasuk = dasar * Math.pow(1 + r, tahunLagi);
    total += totalJenjang;
    totalTanpaInflasi += dasar * lama;
    if (bulanSampaiMasuk === null) bulanSampaiMasuk = tahunLagi * 12;
    perJenjang.push({ id, nama, masuk, lama, tahunLagi, dasar, biayaMasuk, total: totalJenjang });
  });
  // Tabungan bulanan: total dibagi bulan sampai jenjang pertama dimulai,
  // minimal 12 bulan (bila anak sudah waktunya masuk tahun ini).
  const bulan = Math.max(12, bulanSampaiMasuk == null ? 12 : bulanSampaiMasuk);
  const bulanan = perJenjang.length ? total / bulan : 0;
  return { perJenjang, total, totalTanpaInflasi, bulan, bulanan };
}

utils.danaPendidikanHitung = hitungDana;
utils.danaPendidikanAcuan = ACUAN;

export function render(root) {
  const usiaI = T.input('text', 'cth: 3', '3');
  usiaI.inputMode = 'decimal';
  const inflasiI = T.input('text', 'cth: 10', '10');
  inflasiI.inputMode = 'decimal';
  const tierI = T.select([
    ['negeri', 'Sekolah negeri / PTN'],
    ['swasta', 'Swasta menengah / PTS'],
    ['unggulan', 'Swasta unggulan / luar negeri'],
  ], 'swasta');
  const biayaI = {};
  JENJANG.forEach(([id, nama]) => {
    biayaI[id] = T.input('text', 'Rp per tahun', '');
    biayaI[id].inputMode = 'decimal';
  });
  const box = T.out();

  const isiAcuan = () => {
    const a = ACUAN[tierI.value];
    JENJANG.forEach(([id]) => { biayaI[id].value = String(a[id]); });
  };

  const hitung = () => {
    const usia = T.num(usiaI.value);
    const inflasi = T.num(inflasiI.value);
    const biaya = {};
    let biayaOk = true;
    JENJANG.forEach(([id]) => {
      biaya[id] = T.num(biayaI[id].value);
      if (!isFinite(biaya[id]) || biaya[id] < 0) biayaOk = false;
    });
    if (!isFinite(usia) || usia < 0 || usia > 25) {
      T.toast('Isi usia anak dengan angka 0 sampai 25 tahun.'); return;
    }
    if (!isFinite(inflasi) || inflasi < 0 || inflasi > 50) {
      T.toast('Isi kenaikan biaya per tahun dengan angka 0 sampai 50 persen.'); return;
    }
    if (!biayaOk) {
      T.toast('Cek lagi biaya per tahun tiap jenjang — harus angka, boleh 0.'); return;
    }
    const h = hitungDana(usia, inflasi, biaya);
    // Guard hasil: biaya raksasa meluberkan total/tabungan ke Infinity
    // (RT2-08: "Rp∞") — tolak dengan pesan ramah, bukan angka palsu.
    if (!isFinite(h.total) || !isFinite(h.bulanan) || !isFinite(h.totalTanpaInflasi)) {
      T.toast('Biayanya terlalu besar untuk dihitung — coba pakai biaya per tahun yang lebih kecil.'); return;
    }
    if (!h.perJenjang.length) {
      T.show(box, '<p class="center">Anak sudah melewati semua jenjang di kalkulator ini (TK sampai kuliah). Tidak ada lagi biaya sekolah yang perlu diproyeksikan.</p>');
      return;
    }
    let tabel = '<table class="tbl" style="margin-top:12px">' +
      '<tr><th>Jenjang</th>' +
      '<th style="text-align:right">Masuk dalam</th>' +
      '<th style="text-align:right">Biaya/tahun saat masuk</th>' +
      '<th style="text-align:right">Total jenjang</th></tr>';
    h.perJenjang.forEach((j) => {
      tabel += '<tr><td>' + T.esc(j.nama) + ' <span class="dim">(' + j.lama + ' thn)</span></td>' +
        '<td style="text-align:right">' + (j.tahunLagi === 0 ? 'tahun ini' : j.tahunLagi + ' thn lagi') + '</td>' +
        '<td style="text-align:right">' + T.rp(j.biayaMasuk) + '</td>' +
        '<td style="text-align:right"><b>' + T.rp(j.total) + '</b></td></tr>';
    });
    tabel += '</table>';
    const tahun = new Date().getFullYear();
    T.show(box,
      '<div class="center"><div class="dim">Total yang perlu disiapkan (TK–kuliah)</div>' +
      '<div class="big">' + T.rp(h.total) + '</div></div>' +
      kv('Bila harga tidak naik sama sekali', T.rp(h.totalTanpaInflasi)) +
      kv('Selisih karena kenaikan biaya', T.rp(h.total - h.totalTanpaInflasi)) +
      '<div class="center" style="margin-top:12px"><div class="dim">Tabungan bulanan yang dibutuhkan</div>' +
      '<div class="big">' + T.rp(h.bulanan) + ' <span class="mut" style="font-size:15px">/ bulan</span></div>' +
      '<div class="hint">Dihitung dari total dibagi ' + h.bulan + ' bulan sampai anak masuk ' + T.esc(h.perJenjang[0].nama) + '. ' +
      'Ini hitungan tanpa hasil investasi — bila tabunganmu berbunga/berbagi hasil, kebutuhan bulanannya bisa lebih kecil.</div></div>' +
      tabel +
      '<p class="hint">Proyeksi ini memakai biaya acuan di bawah. Biaya tiap sekolah beda-beda — ganti angkanya dengan biaya sekolah yang kamu incar supaya hasilnya akurat.</p>');
  };

  root.appendChild(T.el('<p class="note">Biaya sekolah naik tiap tahun. Kalkulator ini memproyeksikan biaya TK sampai kuliah dengan kenaikan biaya pendidikan, lalu menghitung berapa yang perlu ditabung tiap bulan mulai sekarang.</p>'));
  root.appendChild(T.grid2(
    T.field('Usia anak sekarang (tahun)', usiaI),
    T.field('Kenaikan biaya per tahun (%)', inflasiI, 'Acuan: 10–15%/tahun untuk swasta (OJK).')
  ));
  root.appendChild(T.field('Jenis sekolah', tierI, 'Memilih jenis sekolah mengisi biaya acuan di bawah — angkanya masih bisa diubah satu per satu.'));
  const gridBiaya = T.el('<div class="grid2"></div>');
  JENJANG.forEach(([id, nama]) => {
    gridBiaya.appendChild(T.field('Biaya ' + nama + ' per tahun (Rp)', biayaI[id]));
  });
  root.appendChild(gridBiaya);
  root.appendChild(T.row(T.btn('Hitung Dana Pendidikan', hitung, true)));
  root.appendChild(box);
  root.appendChild(T.el(
    '<div class="hint" style="margin-top:14px;line-height:1.6"><b>Asumsi &amp; sumber (bukan angka tersembunyi):</b><br>' +
    '• Usia masuk: TK 5 thn (2 thn), SD 7 thn (6 thn), SMP 13 thn (3 thn), SMA 16 thn (3 thn), Kuliah 19 thn (4 thn).<br>' +
    '• Biaya acuan 2025: SD negeri Rp5 jt/thn, SD swasta menengah Rp22 jt/thn, SD unggulan Rp45 jt/thn; SMP 120% dan SMA 140% dari SD; PTN Rp12 jt/thn; kuliah luar negeri Rp275 jt/thn — dari Ekawirya Kalkulator Pendidikan (2025, ekawirya.com).<br>' +
    '• TK swasta Rp8 jt/thn (SPP Rp500 rb/bln + kegiatan Rp2 jt/thn) dan PTS Rp23 jt/thn (tengah kisaran semester Rp8–15 jt) — dari EasyCash (Agustus 2026, easycash.id).<br>' +
    '• TK negeri Rp2 jt/thn dan TK unggulan Rp20 jt/thn adalah <b>perkiraan</b> (seragam, buku, iuran; TK premium SPP-nya Rp1 jt+/bln menurut Finetiks) — ganti dengan angka sekolah sebenarnya bila tahu.<br>' +
    '• Kenaikan biaya pendidikan swasta 10–15%/tahun menurut OJK (via Kumparan, Feb 2023); biaya SD swasta naik rata-rata 12,6%/tahun pada 2018–2024 (analisis data BPS via Hoshizora, 2025). Nilai awal kalkulator: 10%/tahun, bisa diubah.<br>' +
    '• Biaya acuan tidak termasuk uang pangkal, kos, transportasi, dan les. Hasil ini proyeksi awal, bukan angka pasti.</div>'));
  tierI.addEventListener('change', isiAcuan);
  isiAcuan();
}
