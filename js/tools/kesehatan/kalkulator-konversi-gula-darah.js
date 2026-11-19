import { h as T, kv, errBox } from '../../core.js';

// Konversi gula darah: 1 mmol/L = 18,018 mg/dL (berat molekul glukosa
// 180,156 g/mol). Jadi mmol/L = mg/dL / 18,018.
// Batas acuan mengikuti American Diabetes Association, Standards of Care:
// puasa: normal di bawah 100 mg/dL, pradiabetes 100-125, diabetes 126 ke atas;
// 2 jam setelah makan: normal di bawah 140, pradiabetes 140-199, diabetes
// 200 ke atas; sewaktu (acak): 200 ke atas perlu pemeriksaan lanjutan.
export const FAKTOR = 18.018;

export function mgDlKeMmol(mg) {
  if (!(mg >= 0)) return null;
  return mg / FAKTOR;
}

export function mmolKeMgDl(mmol) {
  if (!(mmol >= 0)) return null;
  return mmol * FAKTOR;
}

export function kategoriGulaDarah(mg, jenis) {
  if (!(mg >= 0)) return null;
  if (jenis === 'puasa') {
    if (mg < 100) return { label: 'Normal', arti: 'Gula darah puasa di bawah 100 mg/dL termasuk normal.' };
    if (mg <= 125) return { label: 'Pradiabetes', arti: 'Gula darah puasa 100-125 mg/dL termasuk pradiabetes. Sebaiknya periksa lanjutan ke dokter.' };
    return { label: 'Diabetes', arti: 'Gula darah puasa 126 mg/dL ke atas termasuk kriteria diabetes. Sebaiknya periksa ke dokter.' };
  }
  if (jenis === 'setelah-makan') {
    if (mg < 140) return { label: 'Normal', arti: 'Gula darah 2 jam setelah makan di bawah 140 mg/dL termasuk normal.' };
    if (mg <= 199) return { label: 'Pradiabetes', arti: 'Gula darah 2 jam setelah makan 140-199 mg/dL termasuk pradiabetes. Sebaiknya periksa lanjutan ke dokter.' };
    return { label: 'Diabetes', arti: 'Gula darah 2 jam setelah makan 200 mg/dL ke atas termasuk kriteria diabetes. Sebaiknya periksa ke dokter.' };
  }
  if (mg < 200) return { label: 'Di bawah 200', arti: 'Gula darah sewaktu di bawah 200 mg/dL. Hasil sewaktu tidak cukup untuk menilai, perlu tes puasa atau HbA1c.' };
  return { label: 'Perlu pemeriksaan', arti: 'Gula darah sewaktu 200 mg/dL ke atas perlu pemeriksaan lanjutan ke dokter.' };
}

export const meta = { "id": "kalkulator-konversi-gula-darah", "name": "Kalkulator Konversi Gula Darah", "cat": "kesehatan", "icon": "🩸", "desc": "Ubah gula darah mg/dL ke mmol/L dan sebaliknya, lengkap dengan batas normalnya.", "keywords": "gula darah,mg/dl,mmol/l,konversi gula darah,diabetes,pradiabetes,puasa", "since": "6.18.0" };

export function render(root) {
  const arah = T.select([['mg-mmol', 'mg/dL ke mmol/L'], ['mmol-mg', 'mmol/L ke mg/dL']], 'mg-mmol');
  const nilai = T.input('number', 'Nilai gula darah', '100');
  const jenis = T.select([['puasa', 'Puasa (belum makan 8 jam)'], ['setelah-makan', '2 jam setelah makan'], ['sewaktu', 'Sewaktu (kapan saja)']], 'puasa');
  const box = T.out();

  const hitung = () => {
    const v = T.num(nilai.value);
    if (!(v >= 0 && v <= 2000)) {
      T.show(box, errBox('Isi nilai gula darah antara 0 sampai 2.000.'));
      return;
    }
    const mg = arah.value === 'mg-mmol' ? v : mmolKeMgDl(v);
    const mmol = arah.value === 'mg-mmol' ? mgDlKeMmol(v) : v;
    const kat = kategoriGulaDarah(mg, jenis.value);
    T.show(box,
      '<div class="center"><div class="dim">Hasil konversi</div>' +
      '<div class="big">' + (arah.value === 'mg-mmol' ? mmol.toFixed(2).replace('.', ',') + ' mmol/L' : Math.round(mg) + ' mg/dL') + '</div>' +
      '<div class="dim">' + Math.round(mg) + ' mg/dL = ' + mmol.toFixed(2).replace('.', ',') + ' mmol/L</div></div>' +
      kv('Kategori (' + (jenis.value === 'puasa' ? 'puasa' : jenis.value === 'setelah-makan' ? '2 jam setelah makan' : 'sewaktu') + ')', kat.label) +
      '<p class="hint">' + T.esc(kat.arti) + ' Satu kali ukur belum cukup untuk vonis. ' +
      'Diagnosis diabetes butuh pemeriksaan berulang dan penilaian dokter.</p>' +
      '<p class="hint">Rumus: mmol/L = mg/dL / 18,018. Batas acuan mengikuti American Diabetes Association, Standards of Care. ' +
      'Ini alat bantu umum, bukan diagnosis. Bila hasilmu di luar batas normal, periksa ke dokter atau puskesmas.</p>');
  };

  root.appendChild(T.grid2(
    T.field('Arah konversi', arah),
    T.field('Jenis pengukuran', jenis),
  ));
  root.appendChild(T.field('Nilai gula darah', nilai));
  root.appendChild(T.btn('Konversi', hitung, true));
  root.appendChild(box);
  hitung();
}
