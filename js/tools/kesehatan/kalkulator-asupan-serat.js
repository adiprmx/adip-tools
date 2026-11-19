import { h as T, kv, errBox } from '../../core.js';

// Angka kecukupan serat dari Tabel AKG 2019 (Permenkes No. 28 Tahun 2019),
// lampiran resmi Kemenkes, dalam gram per hari.
// Nilai serat makanan di bawah ini nilai sekitar dari USDA FoodData Central.
export const KELOMPOK_UMUR = [
  ['0-5 bln', '0-5 bulan'],
  ['6-11 bln', '6-11 bulan'],
  ['1-3 th', '1-3 tahun'],
  ['4-6 th', '4-6 tahun'],
  ['7-9 th', '7-9 tahun'],
  ['10-12 th', '10-12 tahun'],
  ['13-15 th', '13-15 tahun'],
  ['16-18 th', '16-18 tahun'],
  ['19-29 th', '19-29 tahun'],
  ['30-49 th', '30-49 tahun'],
  ['50-64 th', '50-64 tahun'],
  ['65-80 th', '65-80 tahun'],
  ['80+ th', '80 tahun ke atas'],
];
// [laki-laki, perempuan] dalam gram serat per hari (AKG 2019).
export const AKG_SERAT = {
  '0-5 bln': [0, 0], '6-11 bln': [11, 11], '1-3 th': [19, 19],
  '4-6 th': [20, 20], '7-9 th': [23, 23], '10-12 th': [28, 27],
  '13-15 th': [34, 29], '16-18 th': [37, 29], '19-29 th': [37, 32],
  '30-49 th': [36, 30], '50-64 th': [30, 25], '65-80 th': [25, 22],
  '80+ th': [22, 20],
};
export const MAKANAN_SERAT = [
  ['Kacang merah matang, 1 mangkuk', 7.4],
  ['Pir, 1 buah sedang', 5.5],
  ['Apel, 1 buah sedang', 4.4],
  ['Oatmeal matang, 1 mangkuk', 4],
  ['Nasi merah matang, 1 mangkuk', 3.5],
  ['Pisang, 1 buah sedang', 3.1],
  ['Wortel, 100 gram', 2.8],
  ['Brokoli, 100 gram', 2.6],
  ['Roti gandum, 1 lembar', 1.9],
];

export function akgSerat(kelompok, jk) {
  const baris = AKG_SERAT[kelompok];
  if (!baris) return null;
  return jk === 'perempuan' ? baris[1] : baris[0];
}

export function nilaiSerat(target, asupan) {
  if (!(target > 0) || !(asupan >= 0)) return null;
  const kurang = Math.max(0, target - asupan);
  return { target, asupan, kurang, persen: (asupan / target) * 100, tercapai: asupan >= target };
}

export const meta = { "id": "kalkulator-asupan-serat", "name": "Kalkulator Asupan Serat", "cat": "kesehatan", "icon": "🥦", "desc": "Lihat kebutuhan serat harianmu (AKG 2019) dan seberapa jauh asupanmu hari ini memenuhinya.", "keywords": "serat,fiber,akg,pencernaan,sayur,buah,kebutuhan serat", "since": "6.18.0" };

export function render(root) {
  const umur = T.select(KELOMPOK_UMUR, '19-29 th');
  const jk = T.select([['laki-laki', 'Laki-laki'], ['perempuan', 'Perempuan']], 'laki-laki');
  const asupan = T.input('number', 'Serat yang kamu makan hari ini (gram)', '15');
  const box = T.out();

  const hitung = () => {
    const a = T.num(asupan.value);
    if (!(a >= 0 && a <= 200)) {
      T.show(box, errBox('Isi serat yang kamu makan antara 0 sampai 200 gram.'));
      return;
    }
    const target = akgSerat(umur.value, jk.value);
    if (target === 0) {
      T.show(box,
        '<p class="hint">Untuk bayi 0-5 bulan, AKG tidak menetapkan angka serat karena kebutuhan gizinya dipenuhi ASI. ' +
        'Tanya dokter anak atau bidan bila ada pertanyaan soal makan bayi.</p>');
      return;
    }
    const r = nilaiSerat(target, a);
    const saran = r.tercapai
      ? 'Asupan seratmu sudah cukup hari ini. Pertahankan dengan sayur dan buah setiap makan.'
      : 'Kamu masih kurang ' + r.kurang.toFixed(0) + ' gram serat hari ini. Tambah satu atau dua dari daftar di bawah untuk menutupnya.';
    const daftar = MAKANAN_SERAT.map(([nama, g]) =>
      '<tr><td>' + T.esc(nama) + '</td><td style="text-align:right">sekitar ' + String(g).replace('.', ',') + ' g</td></tr>').join('');
    T.show(box,
      '<div class="center"><div class="dim">Kebutuhan seratmu per hari</div>' +
      '<div class="big">' + target + ' gram</div>' +
      '<div class="dim">Asupan hari ini ' + a + ' gram (' + Math.round(r.persen) + '% dari kebutuhan)</div></div>' +
      kv('Kurang', r.tercapai ? '0 gram, sudah tercukupi' : r.kurang.toFixed(0) + ' gram lagi') +
      '<p class="hint">' + T.esc(saran) + ' Naikkan serat pelan-pelan dan minum cukup air, supaya perut tidak kembung.</p>' +
      '<p style="font-weight:700;margin:14px 0 6px">Makanan tinggi serat</p>' +
      '<table class="tbl"><tbody>' + daftar + '</tbody></table>' +
      '<p class="hint">Sumber kebutuhan: Angka Kecukupan Gizi 2019 (Permenkes No. 28 Tahun 2019). ' +
      'Nilai serat makanan: nilai sekitar dari USDA FoodData Central. Ini alat bantu umum, bukan saran medis. ' +
      'Bila punya gangguan pencernaan, ikuti anjuran doktermu.</p>');
  };

  root.appendChild(T.grid2(
    T.field('Kelompok umur', umur),
    T.field('Jenis kelamin', jk),
  ));
  root.appendChild(T.field('Serat yang kamu makan hari ini (gram)', asupan, 'Perkirakan dari makananmu hari ini. Bila tidak tahu, isi 0 untuk melihat kebutuhannya saja.'));
  root.appendChild(T.btn('Hitung serat', hitung, true));
  root.appendChild(box);
  hitung();
}
