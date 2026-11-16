import { h as T, kv } from '../../core.js?v=6.12.2';

// Skor risiko diabetes tipe 2 mengikuti kuesioner FINDRISC (Finnish Diabetes
// Risk Score, Lindstrom & Tuomilehto 2003). Total skor dan perkiraan risiko
// 10 tahun: <7 rendah (~1%), 7-11 sedikit naik (~4%), 12-14 sedang (~17%),
// 15-20 tinggi (~33%), >20 sangat tinggi (~50%).
// Ini skrining umum, BUKAN diagnosis.
const NOTE = '<p class="hint">Ini perkiraan umum, bukan pengganti saran dokter.</p>';

const UMUR = [
  ['0', 'Di bawah 45 tahun'],
  ['2', '45-54 tahun'],
  ['3', '55-64 tahun'],
  ['4', 'Di atas 64 tahun'],
];
const KELUARGA = [
  ['0', 'Tidak ada'],
  ['3', 'Ada, keluarga jauh (kakek, nenek, paman, bibi, sepupu)'],
  ['5', 'Ada, keluarga dekat (orang tua, kakak, adik, anak)'],
];
const YA_TIDAK = [['0', 'Ya'], ['1', 'Tidak']];

const LEVEL = [
  [7, 'Rendah', 'ok', 'Perkiraan risiko kena diabetes tipe 2 dalam 10 tahun sekitar 1 dari 100 orang. Pertahankan pola hidup sehat.'],
  [12, 'Sedikit naik', 'warn', 'Perkiraan risiko sekitar 1 dari 25 orang dalam 10 tahun. Mulai perhatikan pola makan dan olahraga.'],
  [15, 'Sedang', 'warn', 'Perkiraan risiko sekitar 1 dari 6 orang dalam 10 tahun. Sebaiknya cek gula darah dan mulai ubah gaya hidup.'],
  [21, 'Tinggi', 'err', 'Perkiraan risiko sekitar 1 dari 3 orang dalam 10 tahun. Sebaiknya cek gula darah ke dokter dan serius ubah gaya hidup.'],
  [99, 'Sangat tinggi', 'err', 'Perkiraan risiko sekitar 1 dari 2 orang dalam 10 tahun. Sangat disarankan cek gula darah ke dokter secepatnya.'],
];

export const meta = {"id": "risiko-diabetes", "name": "Skor Risiko Diabetes", "cat": "sehari", "icon": "🩸", "desc": "Perkirakan risiko diabetes tipe 2 dari umur, berat badan, dan gaya hidup.", "keywords": "diabetes,findrisc,risiko diabetes,gula darah,skrining", "since": "6.11.0"};
export function render(root) {

    const berat = T.input('text', 'Berat badan, cth: 70', '70');
    berat.inputMode = 'decimal';
    const tinggi = T.input('text', 'Tinggi badan, cth: 165', '165');
    tinggi.inputMode = 'decimal';
    const pinggang = T.input('text', 'Lingkar pinggang, cth: 85', '85');
    pinggang.inputMode = 'decimal';
    const gender = T.select([['pria', 'Pria'], ['wanita', 'Wanita']]);
    const umur = T.select(UMUR, '0');
    const aktif = T.select([['0', 'Ya, hampir tiap hari'], ['2', 'Tidak']], '0');
    const sayur = T.select(YA_TIDAK, '0');
    const obatDarah = T.select([['0', 'Tidak'], ['2', 'Ya']], '0');
    const gulaTinggi = T.select([['0', 'Tidak pernah'], ['5', 'Ya, pernah']], '0');
    const keluarga = T.select(KELUARGA, '0');
    const box = T.out();

    const calc = () => {
      const b = T.num(berat.value), h = T.num(tinggi.value), pg = T.num(pinggang.value);
      if (!(b > 0) || !(h > 0) || !(pg > 0)) {
        T.show(box, '<span class="err">Isi berat, tinggi, dan lingkar pinggang dengan angka yang benar.</span>');
        return;
      }
      const bmi = b / Math.pow(h / 100, 2);
      const pria = gender.value === 'pria';
      let skor = 0;
      const rincian = [];
      const tambah = (poin, label) => {
        skor += poin;
        rincian.push(kv(label, poin + ' poin'));
      };
      tambah(Number(umur.value), 'Umur');
      const bmiPoin = bmi < 25 ? 0 : bmi <= 30 ? 1 : 3;
      tambah(bmiPoin, 'BMI ' + bmi.toFixed(1));
      let pgPoin;
      if (pria) pgPoin = pg < 94 ? 0 : pg <= 102 ? 3 : 4;
      else pgPoin = pg < 80 ? 0 : pg <= 88 ? 3 : 4;
      tambah(pgPoin, 'Lingkar pinggang ' + pg + ' cm');
      tambah(Number(aktif.value), 'Aktivitas fisik 30 menit/hari');
      tambah(Number(sayur.value), 'Makan sayur/buah tiap hari');
      tambah(Number(obatDarah.value), 'Minum obat tekanan darah');
      tambah(Number(gulaTinggi.value), 'Pernah gula darah tinggi');
      tambah(Number(keluarga.value), 'Riwayat diabetes keluarga');
      let lv;
      for (const [batas, nama, cls, jelas] of LEVEL) {
        if (skor < batas) { lv = { nama, cls, jelas }; break; }
      }
      T.show(box,
        '<div class="center"><div class="dim">Skor risiko (FINDRISC)</div>' +
        '<div class="big">' + skor + ' / 26</div>' +
        '<div class="' + lv.cls + '"><b>Risiko ' + lv.nama + '</b></div>' +
        '<div class="hint">' + lv.jelas + '</div></div>' +
        rincian.join('') +
        '<p class="hint">Skor ini mengikuti kuesioner FINDRISC dari Finlandia, yang dipakai luas untuk skrining diabetes tipe 2. ' +
        'Angka risiko 10 tahun adalah perkiraan dari penelitian aslinya. Skor tinggi bukan berarti pasti kena diabetes, ' +
        'dan skor rendah bukan jaminan bebas. Yang bisa mengubah risiko: berat badan, aktivitas, dan pola makan.</p>' +
        NOTE);
    };

    root.appendChild(T.el('<p class="note">Jawab 8 pertanyaan singkat ini. Skornya memperkirakan risiko diabetes tipe 2 dalam 10 tahun ke depan.</p>'));
    root.appendChild(T.grid2(
      T.field('Berat badan (kg)', berat),
      T.field('Tinggi badan (cm)', tinggi),
      T.field('Lingkar pinggang (cm)', pinggang),
      T.field('Jenis kelamin', gender),
    ));
    root.appendChild(T.field('Umur', umur));
    root.appendChild(T.field('Aktivitas fisik minimal 30 menit sehari?', aktif));
    root.appendChild(T.field('Makan sayur atau buah setiap hari?', sayur));
    root.appendChild(T.field('Minum obat tekanan darah?', obatDarah));
    root.appendChild(T.field('Pernah dibilang gula darah tinggi (saat cek lab atau hamil)?', gulaTinggi));
    root.appendChild(T.field('Ada keluarga yang diabetes?', keluarga));
    root.appendChild(T.btn('Hitung skor', calc, true));
    root.appendChild(box);
    calc();

}
