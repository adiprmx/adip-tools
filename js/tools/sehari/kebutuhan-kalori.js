import { h as T, kv, esc } from '../../core.js?v=6.12.2';

// Rumus BMR:
// - Mifflin-St Jeor (1990): pria 10W + 6.25H - 5A + 5; wanita - 161
// - Harris-Benedict revisi (Roza & Shizgal, 1984)
// - Katch-McArdle (1983): 370 + 21.6 x massa tanpa lemak (kg)
// Faktor aktivitas: standar Harris-Benedict (1.2 - 1.9).
const NOTE = '<p class="hint">Ini perkiraan umum, bukan pengganti saran dokter.</p>';

const AKTIVITAS = [
  ['1.2', 'Jarang gerak (kerja duduk, hampir tanpa olahraga)'],
  ['1.375', 'Ringan (olahraga 1-3x/minggu)'],
  ['1.55', 'Sedang (olahraga 3-5x/minggu)'],
  ['1.725', 'Berat (olahraga 6-7x/minggu)'],
  ['1.9', 'Sangat berat (atlet / kerja fisik seharian)'],
];

const TUJUAN = [
  ['turun', 'Turun berat badan'],
  ['tetap', 'Pertahankan berat badan'],
  ['naik', 'Naik berat badan'],
];

// Pembagian makro (protein / karbo / lemak) per tujuan, dari panduan umum ahli gizi.
const MAKRO = {
  turun: { p: 0.35, k: 0.35, l: 0.30, label: '35% protein, 35% karbo, 30% lemak' },
  tetap: { p: 0.30, k: 0.40, l: 0.30, label: '30% protein, 40% karbo, 30% lemak' },
  naik: { p: 0.25, k: 0.45, l: 0.30, label: '25% protein, 45% karbo, 30% lemak' },
};

export const meta = {"id": "kebutuhan-kalori", "name": "Kebutuhan Kalori Harian", "cat": "sehari", "icon": "🔥", "desc": "Hitung kalori harian dari 3 rumus + target berat badan + pembagian nutrisi.", "keywords": "kalori,tdee,bmr,mifflin,harris benedict,katch mcardle,makro,diet,protein,karbo,lemak", "since": "6.11.0"};
export function render(root) {

    const berat = T.input('text', 'Berat badan, cth: 65', '65');
    berat.inputMode = 'decimal';
    const tinggi = T.input('text', 'Tinggi badan, cth: 165', '165');
    tinggi.inputMode = 'decimal';
    const umur = T.input('text', 'Umur, cth: 25', '25');
    umur.inputMode = 'numeric';
    const lemak = T.input('text', 'Opsional, cth: 20', '');
    lemak.inputMode = 'decimal';
    const gender = T.select([['pria', 'Pria'], ['wanita', 'Wanita']]);
    const aktif = T.select(AKTIVITAS, '1.55');
    const tujuan = T.select(TUJUAN, 'tetap');
    const box = T.out();

    const calc = () => {
      const b = T.num(berat.value), h = T.num(tinggi.value), u = T.num(umur.value);
      const bf = lemak.value.trim() === '' ? NaN : T.num(lemak.value);
      if (!(b > 0) || !(h > 0) || !(u > 0)) {
        T.show(box, '<span class="err">Isi berat, tinggi, dan umur dengan angka yang benar.</span>');
        return;
      }
      if (!isNaN(bf) && (bf <= 0 || bf >= 60)) {
        T.show(box, '<span class="err">Persen lemak tubuh diisi 1-60, atau dikosongkan saja.</span>');
        return;
      }
      const pria = gender.value === 'pria';
      const mifflin = 10 * b + 6.25 * h - 5 * u + (pria ? 5 : -161);
      const hb = pria
        ? 88.362 + 13.397 * b + 4.799 * h - 5.677 * u
        : 447.593 + 9.247 * b + 3.098 * h - 4.330 * u;
      const lbm = isNaN(bf) ? NaN : b * (1 - bf / 100);
      const katch = isNaN(lbm) ? NaN : 370 + 21.6 * lbm;
      const f = Number(aktif.value);
      const tdeeM = Math.round(mifflin * f);
      const tdeeH = Math.round(hb * f);
      const tdeeK = isNaN(katch) ? null : Math.round(katch * f);
      const daftar = tdeeK === null ? [tdeeM, tdeeH] : [tdeeM, tdeeH, tdeeK];
      const tdee = Math.round(daftar.reduce((a, x) => a + x, 0) / daftar.length);

      const goal = tujuan.value;
      const target = goal === 'turun' ? tdee - 500 : goal === 'naik' ? tdee + 500 : tdee;
      const m = MAKRO[goal];
      const prot = Math.round(target * m.p / 4);
      const karb = Math.round(target * m.k / 4);
      const lemk = Math.round(target * m.l / 9);

      let katchRow = '';
      if (tdeeK !== null) {
        katchRow = kv('Katch-McArdle (BMR ' + T.fmt(Math.round(katch)) + ' kkal)', T.fmt(tdeeK) + ' kkal/hari');
      }
      const goalLabel = goal === 'turun'
        ? 'Turun sekitar 0,5 kg/minggu (kurangi 500 kkal)'
        : goal === 'naik'
          ? 'Naik sekitar 0,5 kg/minggu (tambah 500 kkal)'
          : 'Berat badan tetap';
      T.show(box,
        '<div class="center"><div class="dim">Kebutuhan kalori harian (TDEE)</div>' +
        '<div class="big">' + T.fmt(tdee) + ' kkal</div>' +
        '<div class="hint">Rata-rata dari rumus di bawah, dikali faktor aktivitas</div></div>' +
        kv('Mifflin-St Jeor (BMR ' + T.fmt(Math.round(mifflin)) + ' kkal)', T.fmt(tdeeM) + ' kkal/hari') +
        kv('Harris-Benedict revisi (BMR ' + T.fmt(Math.round(hb)) + ' kkal)', T.fmt(tdeeH) + ' kkal/hari') +
        katchRow +
        '<div class="center" style="margin-top:12px"><div class="dim">Target kalori: ' + esc(goalLabel) + '</div>' +
        '<div class="big">' + T.fmt(target) + ' kkal/hari</div></div>' +
        kv('Protein (' + Math.round(m.p * 100) + '%)', prot + ' g/hari') +
        kv('Karbohidrat (' + Math.round(m.k * 100) + '%)', karb + ' g/hari') +
        kv('Lemak (' + Math.round(m.l * 100) + '%)', lemk + ' g/hari') +
        '<p class="hint">Pembagian nutrisi: ' + m.label + '. BMR = kalori yang dipakai tubuh saat istirahat total. TDEE = BMR dikali aktivitas. ' +
        'Rumus Katch-McArdle butuh persen lemak tubuh, jadi muncul hanya kalau kolom itu diisi. ' +
        'Angka 500 kkal didapat dari perkiraan umum: 1 kg lemak tubuh setara sekitar 7.700 kkal.</p>' +
        NOTE);
    };

    root.appendChild(T.el('<p class="note">Masukkan data tubuh, lalu pilih seberapa aktif hari-harimu. Hasilnya dihitung dari tiga rumus BMR yang umum dipakai, jadi kamu bisa lihat rentangnya.</p>'));
    root.appendChild(T.grid2(
      T.field('Berat badan (kg)', berat),
      T.field('Tinggi badan (cm)', tinggi),
      T.field('Umur (tahun)', umur),
      T.field('Jenis kelamin', gender),
    ));
    root.appendChild(T.field('Persen lemak tubuh (%)', lemak, 'Opsional. Kalau tahu dari timbangan atau alat ukur, isi di sini supaya rumus Katch-McArdle ikut dihitung.'));
    root.appendChild(T.field('Tingkat aktivitas', aktif));
    root.appendChild(T.field('Tujuan', tujuan));
    root.appendChild(T.btn('Hitung', calc, true));
    root.appendChild(box);
    calc();

}
