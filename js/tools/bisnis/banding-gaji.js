import { h as T, utils, money, kv } from '../../core.js?v=6.12.2';

// Batas upah untuk hitung iuran (terverifikasi Nov 2026):
// BPJS Kesehatan maks Rp12.000.000 (Perpres 82/2018 jo Perpres 64/2020),
// Jaminan Pensiun maks Rp11.086.300 sejak Maret 2026 (PP 45/2015).
// Beban perusahaan: Kesehatan 4%, JHT 3,7%, JP 2% (JKK/JKM/JKP tidak dihitung).
utils.bpjsPerusahaan = function (dasar) {
  const d = Math.max(0, Number(dasar) || 0);
  const kesehatan = Math.min(d, 12000000) * 0.04;
  const jht = d * 0.037;
  const jp = Math.min(d, 11086300) * 0.02;
  return { kesehatan, jht, jp, total: kesehatan + jht + jp };
};

// Logika murni (bisa di-test di Node).
// Tiap tawaran: { pokok, tunjangan, bpjs, bonus, thr, lain } (bpjs/bulan, bonus/thr/lain per tahun).
utils.bandingGaji = function (a, b) {
  const total = (o) => {
    const bulanan = (Number(o.pokok) || 0) + (Number(o.tunjangan) || 0) + (Number(o.bpjs) || 0);
    const tahunan = bulanan * 12 + (Number(o.bonus) || 0) + (Number(o.thr) || 0) + (Number(o.lain) || 0);
    return { bulanan, tahunan };
  };
  const ra = total(a), rb = total(b);
  return {
    a: ra, b: rb,
    selisihTahun: Math.abs(ra.tahunan - rb.tahunan),
    selisihBulan: Math.abs(ra.tahunan - rb.tahunan) / 12,
    menang: ra.tahunan > rb.tahunan ? 'a' : rb.tahunan > ra.tahunan ? 'b' : 'seri',
  };
};

export const meta = {"id": "banding-gaji", "name": "Banding Gaji", "cat": "bisnis", "icon": "⚖️", "desc": "Bandingkan dua tawaran gaji sampai total setahunnya.", "keywords": "banding,gaji,tawaran,offer,total,tahunan,bpjs,bonus,thr", "since": "6.11.0"};
export function render(root) {
  const buatTawaran = (huruf) => {
    const namaI = T.input('text', 'cth: PT Sinar Abadi');
    const pokokI = money(null, 'cth: 8000000');
    const tunjI = money(null, 'cth: 1000000', '0');
    const bpjsMode = T.select([
      ['auto', 'Hitung otomatis (Kesehatan 4% + JHT 3,7% + JP 2%)'],
      ['manual', 'Isi sendiri'],
    ], 'auto');
    const bpjsI = money(null, 'cth: 500000', '0');
    const bonusI = money(null, 'cth: 8000000', '0');
    const thrI = money(null, 'cth: 8000000', '0');
    const lainI = money(null, 'cth: 0', '0');
    const fldBpjs = T.field('Iuran BPJS dibayar perusahaan / bulan (Rp)', bpjsI);
    fldBpjs.hidden = true;
    bpjsMode.addEventListener('change', () => {
      fldBpjs.hidden = bpjsMode.value !== 'manual';
      hitung();
    });
    const wrap = T.el('<div></div>');
    wrap.appendChild(T.el('<p class="mut" style="margin:14px 0 6px;font-weight:600">Tawaran ' + huruf + '</p>'));
    wrap.appendChild(T.field('Nama perusahaan (opsional)', namaI));
    wrap.appendChild(T.grid2(
      T.field('Gaji pokok / bulan (Rp)', pokokI),
      T.field('Tunjangan / bulan (Rp)', tunjI)
    ));
    wrap.appendChild(T.field('Iuran BPJS perusahaan', bpjsMode));
    wrap.appendChild(fldBpjs);
    wrap.appendChild(T.grid2(
      T.field('Bonus / tahun (Rp)', bonusI),
      T.field('THR / tahun (Rp)', thrI, 'Biasanya 1x gaji pokok')
    ));
    wrap.appendChild(T.field('Tunjangan lain / tahun (Rp)', lainI, 'Misal: uang transport tahunan, insentif'));
    return { wrap, namaI, pokokI, tunjI, bpjsMode, bpjsI, bonusI, thrI, lainI };
  };

  const A = buatTawaran('A');
  const B = buatTawaran('B');
  const box = T.out();

  const baca = (t) => {
    const pokok = T.num(t.pokokI.value) || 0;
    const tunj = T.num(t.tunjI.value) || 0;
    const bpjs = t.bpjsMode.value === 'manual'
      ? (T.num(t.bpjsI.value) || 0)
      : utils.bpjsPerusahaan(pokok + tunj).total;
    return {
      nama: t.namaI.value.trim(),
      pokok, tunjangan: tunj, bpjs,
      bonus: T.num(t.bonusI.value) || 0,
      thr: T.num(t.thrI.value) || 0,
      lain: T.num(t.lainI.value) || 0,
    };
  };

  const hitung = () => {
    const a = baca(A), b = baca(B);
    if (!((a.pokok > 0) || (b.pokok > 0))) { T.hide(box); return; }
    const r = utils.bandingGaji(a, b);
    const namaA = a.nama || 'Tawaran A';
    const namaB = b.nama || 'Tawaran B';
    const judul = r.menang === 'seri'
      ? 'Keduanya sama besar.'
      : (r.menang === 'a' ? namaA : namaB) + ' lebih besar ' + T.rp(Math.round(r.selisihTahun)) + ' per tahun.';
    T.show(box,
      '<div class="big center">' + T.esc(judul) + '</div>' +
      (r.menang === 'seri' ? '' : '<p class="center mut">Selisihnya sekitar ' + T.rp(Math.round(r.selisihBulan)) + ' per bulan.</p>') +
      '<table class="tbl"><tr><th></th><th>' + T.esc(namaA) + '</th><th>' + T.esc(namaB) + '</th></tr>' +
      '<tr><td>Gaji pokok / bulan</td><td>' + T.rp(a.pokok) + '</td><td>' + T.rp(b.pokok) + '</td></tr>' +
      '<tr><td>Tunjangan / bulan</td><td>' + T.rp(a.tunjangan) + '</td><td>' + T.rp(b.tunjangan) + '</td></tr>' +
      '<tr><td>BPJS perusahaan / bulan</td><td>' + T.rp(a.bpjs) + '</td><td>' + T.rp(b.bpjs) + '</td></tr>' +
      '<tr><td>Bonus + THR + lain / tahun</td><td>' + T.rp(a.bonus + a.thr + a.lain) + '</td><td>' + T.rp(b.bonus + b.thr + b.lain) + '</td></tr>' +
      '<tr><td><b>Total / tahun</b></td><td><b>' + T.rp(r.a.tahunan) + '</b></td><td><b>' + T.rp(r.b.tahunan) + '</b></td></tr>' +
      '<tr><td>Total rata-rata / bulan</td><td>' + T.rp(Math.round(r.a.tahunan / 12)) + '</td><td>' + T.rp(Math.round(r.b.tahunan / 12)) + '</td></tr></table>' +
      '<p class="hint">Ini total kotor sebelum PPh 21 dan iuran BPJS bagian karyawan. BPJS otomatis dihitung dari gaji pokok + tunjangan: Kesehatan 4% (dasar maks Rp12 juta), JHT 3,7%, JP 2% (dasar maks Rp11.086.300 sejak Maret 2026). JKK, JKM, dan JKP tidak dihitung. Selain angka, pertimbangkan juga jarak, jam kerja, dan jenjang kariernya.</p>');
  };
  [A, B].forEach((t) => {
    [t.namaI, t.pokokI, t.tunjI, t.bpjsI, t.bonusI, t.thrI, t.lainI].forEach((i) => i.addEventListener('input', hitung));
  });

  root.appendChild(T.el('<p class="note">Gaji pokok saja belum cukup buat membandingkan dua tawaran. Masukkan tunjangan, BPJS, bonus, dan THR, biar kelihatan total setahunnya.</p>'));
  root.appendChild(A.wrap);
  root.appendChild(B.wrap);
  root.appendChild(box);
  hitung();
}
