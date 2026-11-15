import { h as T, kv } from '../../core.js?v=6.12.1';

// Kategori tekanan darah mengikuti pedoman AHA/ACC 2017 yang juga dipakai
// sebagai acuan umum di Indonesia:
// Normal <120/<80; Meningkat 120-129 dan <80; Hipertensi tahap 1: 130-139
// atau 80-89; tahap 2: >=140 atau >=90; krisis: >180 dan/atau >120.
// Ini klasifikasi umum, BUKAN diagnosis.
const NOTE = '<p class="hint">Ini perkiraan umum, bukan pengganti saran dokter.</p>';

const KATEGORI = [
  {
    nama: 'Normal',
    cls: 'ok',
    jelas: 'Tekanan darahmu dalam rentang normal. Pertahankan pola makan seimbang dan olahraga teratur.',
  },
  {
    nama: 'Meningkat',
    cls: 'warn',
    jelas: 'Sistolik mulai naik tapi diastolik masih normal. Umumnya disarankan kurangi garam, jaga berat badan, dan cek berkala.',
  },
  {
    nama: 'Hipertensi tahap 1',
    cls: 'warn',
    jelas: 'Sudah masuk hipertensi ringan. Dokter biasanya menyarankan perubahan gaya hidup dulu, dan obat kalau ada faktor risiko lain.',
  },
  {
    nama: 'Hipertensi tahap 2',
    cls: 'err',
    jelas: 'Tekanan darah tinggi. Sebaiknya konsultasi ke dokter untuk rencana penanganan, biasanya kombinasi obat dan gaya hidup.',
  },
  {
    nama: 'Krisis hipertensi',
    cls: 'err',
    jelas: 'Tekanan darah sangat tinggi. Kalau disertai nyeri dada, sesak napas, atau pusing berat, segera ke IGD. Kalau tanpa gejala, tetap hubungi dokter hari ini juga.',
  },
];

export const meta = {"id": "cek-tekanan-darah", "name": "Cek Tekanan Darah", "cat": "sehari", "icon": "🩺", "desc": "Cek arti angka tensimu: normal, naik, atau tinggi.", "keywords": "tekanan darah,hipertensi,sistolik,diastolik,tensi,darah tinggi", "since": "6.11.0"};
export function render(root) {

    const sis = T.input('text', 'Sistolik (angka atas), cth: 120', '120');
    sis.inputMode = 'numeric';
    const dia = T.input('text', 'Diastolik (angka bawah), cth: 80', '80');
    dia.inputMode = 'numeric';
    const box = T.out();

    const calc = () => {
      const s = T.num(sis.value), d = T.num(dia.value);
      if (!(s > 0) || !(d > 0)) {
        T.show(box, '<span class="err">Isi kedua angka tekanan darah dengan angka yang benar.</span>');
        return;
      }
      if (s < 50 || s > 300 || d < 30 || d > 200) {
        T.show(box, '<span class="err">Angkanya di luar rentang yang masuk akal. Cek lagi hasil pengukuranmu.</span>');
        return;
      }
      if (d >= s) {
        T.show(box, '<span class="err">Angka bawah (diastolik) harus lebih kecil dari angka atas (sistolik).</span>');
        return;
      }
      let idx;
      if (s > 180 || d > 120) idx = 4;
      else if (s >= 140 || d >= 90) idx = 3;
      else if (s >= 130 || d >= 80) idx = 2;
      else if (s >= 120) idx = 1;
      else idx = 0;
      const kat = KATEGORI[idx];
      const map = Math.round((s + 2 * d) / 3);
      const pulse = s - d;
      T.show(box,
        '<div class="center"><div class="dim">Tekanan darah ' + s + '/' + d + ' mmHg</div>' +
        '<div class="big">' + kat.nama + '</div>' +
        '<div class="' + kat.cls + '">' + kat.jelas + '</div></div>' +
        kv('Tekanan nadi (sistolik - diastolik)', pulse + ' mmHg') +
        kv('Tekanan arteri rata-rata', map + ' mmHg') +
        '<p class="hint">Kategori mengikuti pedoman AHA/ACC 2017. Satu kali ukur belum cukup untuk diagnosis hipertensi, dokter biasanya mengukur beberapa kali di hari berbeda. ' +
        'Ukur setelah duduk tenang 5 menit, jangan habis kopi atau olahraga. Tekanan nadi normal umumnya 30-50 mmHg.</p>' +
        NOTE);
    };

    root.appendChild(T.el('<p class="note">Masukkan hasil tensimeter (angka atas dan bawah). Alat ini cuma membaca hasil ukurmu, bukan mendiagnosis.</p>'));
    root.appendChild(T.grid2(
      T.field('Sistolik / angka atas (mmHg)', sis),
      T.field('Diastolik / angka bawah (mmHg)', dia),
    ));
    root.appendChild(T.btn('Cek', calc, true));
    root.appendChild(box);
    calc();

}
