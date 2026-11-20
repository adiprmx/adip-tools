import { h as T, esc, utils } from '../../core.js';

// Pack-year: ukuran seberapa banyak seseorang merokok seumur hidup.
// pack-year = (batang per hari / isi satu bungkus) x tahun merokok.
// Satu bungkus standar berisi 20 batang. Contoh: 1 bungkus sehari selama
// 20 tahun = 20 pack-year; 2 bungkus sehari selama 10 tahun = 20 pack-year.
// Penggolongan yang umum dipakai: di bawah 10 ringan, 10-20 sedang,
// di atas 20 berat. Ambang 20 pack-year dipakai sebagai salah satu syarat
// skrining kanker paru (USPSTF 2021, JAMA 325(10):962-970: umur 50-80
// tahun, 20 pack-year atau lebih, DAN masih merokok atau berhenti dalam
// 15 tahun terakhir — kualifikasi berhenti ≤15 tahun wajib disebut,
// diverifikasi Q5 v6.21.0 dari uspreventiveservicestaskforce.org).
export function packYear(batangPerHari, tahun, isiBungkus) {
  const isi = isiBungkus || 20;
  return (batangPerHari / isi) * tahun;
}

export function totalBatang(batangPerHari, tahun) {
  return Math.round(batangPerHari * 365.25 * tahun);
}

export function kategoriPackYear(py) {
  if (py < 10) return ['Ringan', 'Di bawah 10 pack-year. Risikonya lebih rendah dibanding perokok berat, tapi merokok dalam jumlah berapa pun tetap merusak kesehatan.', 'ok'];
  if (py <= 20) return ['Sedang', '10 sampai 20 pack-year. Risiko penyakit paru dan jantung sudah naik jelas dibanding bukan perokok.', 'warn'];
  return ['Berat', 'Di atas 20 pack-year. Risiko kanker paru, PPOK, dan penyakit jantung naik tajam. Bicarakan skrining kanker paru dengan dokter.', 'err'];
}
utils.packYear = packYear;
utils.kategoriPackYear = kategoriPackYear;

export const meta = {"id": "kalkulator-pack-year", "name": "Kalkulator Pack-Year Merokok", "cat": "kesehatan", "icon": "🚬", "desc": "Hitung pack-year, ukuran total rokok yang sudah kamu hisap seumur hidup, dari batang per hari dan lama merokok.", "keywords": "pack-year,pack year,rokok,merokok,perokok,kanker paru,ppok,skrining paru", "since": "6.19.0"};
export function render(root) {
  const batang = T.input('number', 'Batang per hari', '12');
  const tahun = T.input('number', 'Sudah merokok berapa tahun', '10');
  const isi = T.select([['20', '20 batang per bungkus'], ['16', '16 batang per bungkus'], ['12', '12 batang per bungkus']], '20');
  const box = T.out();

  const hitung = () => {
    const b = T.num(batang.value);
    const t = T.num(tahun.value);
    if (!(b >= 1 && b <= 200)) {
      T.show(box, '<span class="err">Isi batang per hari antara 1 sampai 200.</span>');
      return;
    }
    if (!(t >= 0.1 && t <= 80)) {
      T.show(box, '<span class="err">Isi lama merokok antara 0,1 sampai 80 tahun.</span>');
      return;
    }
    const py = packYear(b, t, Number(isi.value));
    const kat = kategoriPackYear(py);
    const total = totalBatang(b, t);
    T.show(box,
      '<div class="center"><div class="dim">Pack-year kamu</div>' +
      '<div class="big">' + utils.fmtDes(py, 1) + '</div>' +
      '<div class="' + kat[2] + '"><b>' + esc(kat[0]) + '</b></div></div>' +
      '<div class="kv"><span class="k">Total batang yang sudah dihisap</span><span class="v">sekitar ' + T.fmt(total) + ' batang</span></div>' +
      '<div class="kv"><span class="k">Artinya</span><span class="v">' + esc(kat[1]) + '</span></div>' +
      '<div class="dim" style="margin-top:12px">Patokan pack-year</div>' +
      '<div class="kv"><span class="k">Di bawah 10</span><span class="v">Ringan' + (py < 10 ? ' <b>&larr; kamu di sini</b>' : '') + '</span></div>' +
      '<div class="kv"><span class="k">10 sampai 20</span><span class="v">Sedang' + (py >= 10 && py <= 20 ? ' <b>&larr; kamu di sini</b>' : '') + '</span></div>' +
      '<div class="kv"><span class="k">Di atas 20</span><span class="v">Berat' + (py > 20 ? ' <b>&larr; kamu di sini</b>' : '') + '</span></div>' +
      '<p class="hint">Pack-year hanya mengukur jumlah rokok, BUKAN diagnosis. Risiko penyakit juga dipengaruhi umur mulai merokok, jenis rokok, riwayat keluarga, dan paparan lain. ' +
      'Berhenti merokok kapan pun tetap menurunkan risiko, dan manfaatnya mulai terasa dalam hitungan minggu. ' +
      'Bila pack-year-mu 20 atau lebih, umurmu 50-80 tahun, dan kamu masih merokok atau baru berhenti kurang dari 15 tahun, tanyakan ke dokter soal skrining kanker paru. ' +
      'Butuh bantuan berhenti? Ceritakan ke dokter atau layanan berhenti merokok di puskesmas terdekat.</p>');
  };

  root.appendChild(T.grid2(
    T.field('Batang rokok per hari', batang, 'Rata-rata dalam sehari. Satu bungkus biasanya 20 batang.'),
    T.field('Sudah merokok berapa tahun', tahun, 'Boleh pakai koma, misal 2,5 tahun.'),
  ));
  root.appendChild(T.field('Isi per bungkus', isi));
  root.appendChild(T.btn('Hitung', hitung, true));
  root.appendChild(box);
  hitung();
}
