import { h as T, kv, errBox, utils } from '../../core.js';

// BMI anak 5-19 tahun menurut acuan pertumbuhan WHO 2007.
// Tabel L, M, S diambil dari tabel resmi WHO (bmi-boys/girls-z-who-2007-exp,
// diunduh dari cdn.who.int, November 2026) pada tiap ulang tahun, lalu
// diinterpolasi linier untuk umur di antaranya. Jangkar terverifikasi:
// anak laki-laki 11 tahun L=-1,7862 M=16,9392 S=0,11070 (WHO computation.pdf).
// Z-score: z = ((X/M)^L - 1) / (L*S). Persentil dari distribusi normal.
// Kategori WHO 5-19 tahun: kurus di bawah -2 SD, normal -2 sampai +1 SD,
// berlebih di atas +1 SD, obesitas di atas +2 SD.
export const BULAN_ACUAN = [61, 72, 84, 96, 108, 120, 132, 144, 156, 168, 180, 192, 204, 216, 228];
export const BMI_LAKI = [[-0.7387, 15.2641, 0.0839], [-0.9921, 15.3062, 0.08682], [-1.246, 15.4832, 0.09068], [-1.4629, 15.7368, 0.09526], [-1.6318, 16.049, 0.10038], [-1.7407, 16.4433, 0.10566], [-1.7862, 16.9392, 0.1107], [-1.7751, 17.5334, 0.11522], [-1.7168, 18.233, 0.11898], [-1.6211, 19.005, 0.12191], [-1.4961, 19.7744, 0.12412], [-1.3529, 20.4951, 0.12579], [-1.1962, 21.1423, 0.12715], [-1.026, 21.7077, 0.12836], [-0.8419, 22.1883, 0.12948]];
export const BMI_PEREMPUAN = [[-0.8886, 15.2441, 0.09692], [-1.0794, 15.2697, 0.10195], [-1.2565, 15.4036, 0.10746], [-1.388, 15.681, 0.11291], [-1.465, 16.0964, 0.11816], [-1.4864, 16.6133, 0.12307], [-1.4606, 17.2459, 0.12748], [-1.4006, 17.9966, 0.13129], [-1.3195, 18.8012, 0.13445], [-1.2266, 19.5647, 0.137], [-1.1311, 20.2125, 0.13904], [-1.0368, 20.7008, 0.1407], [-0.9423, 21.0367, 0.14208], [-0.8462, 21.2603, 0.1433], [-0.7496, 21.4269, 0.14441]];

export function hitungBMI(beratKg, tinggiCm) {
  if (!(beratKg > 0) || !(tinggiCm > 0)) return null;
  const m = tinggiCm / 100;
  return beratKg / (m * m);
}

// lmsPada, zDariLMS, nilaiDariZ, persentilDariZ kanonis tinggal di utils (core.js).

export function kategoriBmiAnak(z) {
  if (z < -3) return { label: 'Sangat kurang', arti: 'BMI-nya jauh di bawah anak seusianya. Sebaiknya periksa ke dokter anak atau puskesmas.' };
  if (z < -2) return { label: 'Kurang', arti: 'BMI-nya di bawah anak seusianya. Pantau pola makan dan tumbuhnya, dan tanya dokter anak bila ragu.' };
  if (z <= 1) return { label: 'Normal', arti: 'BMI-nya masih dalam rentang yang wajar untuk umur dan jenis kelaminnya.' };
  if (z <= 2) return { label: 'Berlebih', arti: 'BMI-nya di atas anak seusianya. Perhatikan porsi makan, camilan manis, dan gerak badan harian.' };
  return { label: 'Obesitas', arti: 'BMI-nya jauh di atas anak seusianya. Sebaiknya periksa ke dokter anak untuk rencana yang aman.' };
}

export function nilaiBmiAnak(jk, umurBulan, beratKg, tinggiCm) {
  const bmi = hitungBMI(beratKg, tinggiCm);
  if (bmi == null) return null;
  const tabel = jk === 'perempuan' ? BMI_PEREMPUAN : BMI_LAKI;
  const [L, M, S] = utils.lmsPada(tabel, BULAN_ACUAN, umurBulan);
  const z = utils.zDariLMS(bmi, L, M, S);
  const persen = utils.persentilDariZ(z);
  return {
    bmi, z, persen,
    kategori: kategoriBmiAnak(z),
    bawah: utils.nilaiDariZ(-2, L, M, S),
    atas: utils.nilaiDariZ(1, L, M, S),
    tengah: M,
  };
}

export const meta = { "id": "bmi-anak", "name": "BMI Anak", "cat": "kesehatan", "icon": "🧒", "desc": "Nilai berat badan anak 5-19 tahun dengan persentil WHO menurut umur dan jenis kelamin.", "keywords": "bmi anak,imt anak,persentil who,berat badan anak,obesitas anak,kurus", "since": "6.18.0" };

export function render(root) {
  const jk = T.select([['laki-laki', 'Laki-laki'], ['perempuan', 'Perempuan']], 'laki-laki');
  const thn = T.input('number', 'Umur (tahun)', '10');
  const bln = T.input('number', 'Tambah bulan (0-11)', '0');
  const berat = T.input('number', 'Berat badan (kg)', '32');
  const tinggi = T.input('number', 'Tinggi badan (cm)', '138');
  const box = T.out();

  const hitung = () => {
    const tahun = T.num(thn.value);
    const bulan = T.num(bln.value);
    const b = T.num(berat.value);
    const t = T.num(tinggi.value);
    if (!(tahun >= 5 && tahun <= 19)) {
      T.show(box, errBox('Alat ini untuk anak umur 5 sampai 19 tahun. Isi umur tahun antara 5 dan 19.'));
      return;
    }
    if (!(bulan >= 0 && bulan <= 11)) {
      T.show(box, errBox('Tambah bulan diisi 0 sampai 11.'));
      return;
    }
    if (!(b >= 5 && b <= 200)) {
      T.show(box, errBox('Isi berat badan antara 5 sampai 200 kg.'));
      return;
    }
    if (!(t >= 80 && t <= 220)) {
      T.show(box, errBox('Isi tinggi badan antara 80 sampai 220 cm.'));
      return;
    }
    const r = nilaiBmiAnak(jk.value, tahun * 12 + bulan, b, t);
    const persenTampil = r.persen < 1 ? 'di bawah 1' : (r.persen > 99 ? 'di atas 99' : Math.round(r.persen).toString());
    T.show(box,
      '<div class="center"><div class="dim">BMI anak</div>' +
      '<div class="big">' + r.bmi.toFixed(1).replace('.', ',') + '</div>' +
      '<div class="dim">Persentil ke-' + persenTampil + ' dari 100 anak seusianya</div></div>' +
      kv('Kategori', r.kategori.label) +
      kv('Rentang wajar untuk umurnya', r.bawah.toFixed(1).replace('.', ',') + ' - ' + r.atas.toFixed(1).replace('.', ',') + ' BMI') +
      kv('Nilai tengah anak seusianya', r.tengah.toFixed(1).replace('.', ',') + ' BMI') +
      '<p class="hint">' + T.esc(r.kategori.arti) + ' Persentil artinya posisi anak dibanding 100 anak lain yang umur dan jenis kelaminnya sama. ' +
      'Satu kali ukur belum cukup untuk menilai, yang penting polanya dari waktu ke waktu.</p>' +
      '<p class="hint">Acuan: WHO Growth Reference 2007 untuk anak 5-19 tahun (de Onis dkk., Bulletin of the WHO 2007). ' +
      'Nilai di antara ulang tahun dihitung dengan interpolasi. Ini alat bantu umum, bukan diagnosis. ' +
      'Untuk keputusan soal berat badan anak, tanya dokter anak atau tenaga kesehatan.</p>');
  };

  root.appendChild(T.grid2(
    T.field('Jenis kelamin', jk),
    T.field('Umur (tahun)', thn, '5 sampai 19 tahun'),
  ));
  root.appendChild(T.grid2(
    T.field('Tambah bulan (boleh kosong)', bln, 'Misal umur 10 tahun 6 bulan: tahun 10, bulan 6.'),
    T.field('Berat badan (kg)', berat),
  ));
  root.appendChild(T.field('Tinggi badan (cm)', tinggi));
  root.appendChild(T.btn('Hitung BMI anak', hitung, true));
  root.appendChild(box);
  hitung();
}
