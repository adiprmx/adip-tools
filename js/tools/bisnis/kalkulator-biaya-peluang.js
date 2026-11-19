import { h as T, utils, kv } from '../../core.js';

// Biaya peluang: selisih hasil akhir dua pilihan atas modal yang sama.
// Nilai akhir dihitung dengan bunga majemuk tahunan:
// FV = modal x (1 + hasil)^tahun. Pilihan yang hasil akhirnya lebih kecil
// itulah yang "mengorbankan" selisihnya.
export function hitungBiayaPeluang(modal, hasilA, hasilB, tahun) {
  const m = Number(modal);
  const a = Number(hasilA);
  const b = Number(hasilB);
  const n = Number(tahun);
  if (![m, a, b, n].every(isFinite) || m <= 0 || n <= 0 || a < -100 || b < -100) return null;
  const fvA = m * Math.pow(1 + a / 100, n);
  const fvB = m * Math.pow(1 + b / 100, n);
  if (![fvA, fvB].every(isFinite)) return null;
  return {
    fvA, fvB,
    selisih: Math.abs(fvA - fvB),
    lebihBaik: fvA > fvB ? 'A' : fvB > fvA ? 'B' : 'sama',
  };
}
utils.biayaPeluang = hitungBiayaPeluang;

export const meta = {"id": "kalkulator-biaya-peluang", "name": "Kalkulator Biaya Peluang", "cat": "bisnis", "icon": "⚖️", "desc": "Berapa yang kamu lepas saat memilih satu peluang dibanding peluang lain.", "keywords": "biaya peluang,opportunity cost,pilihan,investasi,banding,hasil,modal,keputusan", "since": "6.18.0"};
export function render(root) {
  const modalI = T.input('text', 'cth: 10000000', ''); modalI.inputMode = 'decimal';
  const namaAI = T.input('text', 'cth: Deposito', 'Pilihan A');
  const hasilAI = T.input('text', 'cth: 5', ''); hasilAI.inputMode = 'decimal';
  const namaBI = T.input('text', 'cth: Reksa dana', 'Pilihan B');
  const hasilBI = T.input('text', 'cth: 8', ''); hasilBI.inputMode = 'decimal';
  const tahunI = T.input('text', 'cth: 5', ''); tahunI.inputMode = 'decimal';
  const box = T.out();

  const hitung = () => {
    const modal = T.num(modalI.value);
    const hasilA = T.num(hasilAI.value);
    const hasilB = T.num(hasilBI.value);
    const tahun = T.num(tahunI.value);
    if (!isFinite(modal) || modal <= 0) {
      T.show(box, '<div class="err">Modal harus diisi angka lebih dari 0.</div>');
      return;
    }
    if (!isFinite(hasilA) || hasilA < -100 || !isFinite(hasilB) || hasilB < -100) {
      T.show(box, '<div class="err">Hasil per tahun harus diisi angka, minimal -100%.</div>');
      return;
    }
    if (!isFinite(tahun) || tahun <= 0 || tahun > 100) {
      T.show(box, '<div class="err">Lama waktu harus diisi angka antara 0 sampai 100 tahun.</div>');
      return;
    }
    const r = hitungBiayaPeluang(modal, hasilA, hasilB, tahun);
    if (!r) {
      T.show(box, '<div class="err">Angkanya terlalu besar untuk dihitung. Coba pakai angka yang lebih kecil.</div>');
      return;
    }
    const namaA = namaAI.value.trim() || 'Pilihan A';
    const namaB = namaBI.value.trim() || 'Pilihan B';
    const kalimat = r.lebihBaik === 'sama'
      ? 'Kedua pilihan menghasilkan jumlah yang sama dalam ' + String(tahun).replace('.', ',') + ' tahun, jadi tidak ada yang dikorbankan.'
      : r.lebihBaik === 'A'
        ? 'Memilih ' + namaB + ' berarti melepas ' + T.rp(Math.round(r.selisih)) + ' dibanding memilih ' + namaA + ' dalam ' + String(tahun).replace('.', ',') + ' tahun.'
        : 'Memilih ' + namaA + ' berarti melepas ' + T.rp(Math.round(r.selisih)) + ' dibanding memilih ' + namaB + ' dalam ' + String(tahun).replace('.', ',') + ' tahun.';
    T.show(box,
      '<div class="big">' + T.rp(Math.round(r.selisih)) + '</div>' +
      '<p class="center mut">Biaya peluang: selisih hasil kedua pilihan.</p>' +
      kv(namaA + ' (' + String(hasilA).replace('.', ',') + '%/tahun)', T.rp(Math.round(r.fvA))) +
      kv(namaB + ' (' + String(hasilB).replace('.', ',') + '%/tahun)', T.rp(Math.round(r.fvB))) +
      kv('Modal awal', T.rp(Math.round(modal))) +
      kv('Lama', String(tahun).replace('.', ',') + ' tahun') +
      '<p class="info">' + T.esc(kalimat) + '</p>' +
      '<p class="hint">Hitungan ini memakai bunga majemuk tahunan dan menganggap hasil tiap tahun tetap. Hasil investasi asli naik turun, jadi angka ini perbandingan, bukan janji hasil.</p>');
  };

  root.appendChild(T.el('<p class="note">Setiap pilihan ada harganya: hasil dari pilihan lain yang kamu lepas. Masukkan modal yang sama dan hasil tiap pilihan, dan lihat berapa selisihnya.</p>'));
  root.appendChild(T.field('Modal (Rp)', modalI, 'Jumlah uang yang sama untuk kedua pilihan'));
  root.appendChild(T.grid2(
    T.field('Nama pilihan A', namaAI),
    T.field('Hasil pilihan A (% per tahun)', hasilAI)
  ));
  root.appendChild(T.grid2(
    T.field('Nama pilihan B', namaBI),
    T.field('Hasil pilihan B (% per tahun)', hasilBI)
  ));
  root.appendChild(T.field('Lama (tahun)', tahunI));
  root.appendChild(T.row(T.btn('Hitung biaya peluang', hitung, true)));
  root.appendChild(box);
}
