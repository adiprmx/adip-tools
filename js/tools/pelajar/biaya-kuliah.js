import { h as T } from '../../core.js';

export const meta = { id: 'biaya-kuliah', name: 'Kalkulator Biaya Kuliah', cat: 'pelajar', icon: '🎓', desc: 'Perkirakan total biaya kuliah sampai lulus: UKT, biaya hidup, buku, dan biaya awal, per semester dan per tahun.', keywords: 'biaya kuliah,ukt,spp,kampus,universitas,biaya hidup,mahasiswa,perkiraan', since: '6.19.0' };

// Hitung total biaya kuliah. Semua angka dalam rupiah.
// ukt: per semester; hidup: per bulan; buku: per semester;
// awal: sekali di awal (uang pangkal, ospek, dll); semester: jumlah semester.
export function hitungBiayaKuliah({ ukt, hidup, buku, awal, semester }) {
  const bulanPerSemester = 6;
  const perSemester = ukt + buku + hidup * bulanPerSemester;
  const total = perSemester * semester + awal;
  const perTahun = perSemester * 2;
  const perBulan = total / (semester * bulanPerSemester);
  return { perSemester, perTahun, perBulan, total, rincian: { ukt: ukt * semester, hidup: hidup * bulanPerSemester * semester, buku: buku * semester, awal } };
}

export function render(root) {
  root.appendChild(T.el('<p class="hint">Isi perkiraan biayanya. Angka di sini contoh saja, ganti dengan angka kampus yang kamu incar. Satu semester dihitung 6 bulan.</p>'));

  const uktI = T.input('number', 'cth: 5000000', '5000000');
  const hidupI = T.input('number', 'cth: 2000000', '2000000');
  const bukuI = T.input('number', 'cth: 500000', '500000');
  const awalI = T.input('number', 'cth: 0', '0');
  const lamaS = T.select([
    ['6', 'D3 (3 tahun, 6 semester)'],
    ['8', 'S1 (4 tahun, 8 semester)'],
    ['4', 'S2 (2 tahun, 4 semester)'],
    ['10', '5 tahun (10 semester)'],
  ], '8');
  const box = T.out();

  function hitung() {
    const ukt = T.num(uktI.value) || 0;
    const hidup = T.num(hidupI.value) || 0;
    const buku = T.num(bukuI.value) || 0;
    const awal = T.num(awalI.value) || 0;
    const semester = Number(lamaS.value);
    if ([ukt, hidup, buku, awal].some((v) => !Number.isFinite(v) || v < 0)) {
      T.show(box, '<p class="dim">Isi semua biaya dengan angka 0 atau lebih.</p>');
      return;
    }
    const h = hitungBiayaKuliah({ ukt, hidup, buku, awal, semester });
    const tahun = semester / 2;
    T.show(box,
      '<p class="big">Total sampai lulus: ' + T.rp(h.total) + '</p>' +
      '<p>Per semester: <b>' + T.rp(h.perSemester) + '</b> &nbsp;·&nbsp; Per tahun: <b>' + T.rp(h.perTahun) + '</b> &nbsp;·&nbsp; Rata-rata per bulan: <b>' + T.rp(h.perBulan) + '</b></p>' +
      '<p><b>Rincian ' + T.fmt(tahun) + ' tahun (' + T.fmt(semester) + ' semester):</b></p>' +
      '<p>UKT: ' + T.rp(h.rincian.ukt) + '<br>Biaya hidup: ' + T.rp(h.rincian.hidup) + '<br>Buku & alat: ' + T.rp(h.rincian.buku) + '<br>Biaya awal: ' + T.rp(h.rincian.awal) + '</p>' +
      '<p class="hint">Ini perkiraan dari angka yang kamu isi. UKT tiap kampus dan jurusan beda-beda, cek situs kampusnya untuk angka pasti. Biaya hidup dihitung 6 bulan per semester.</p>');
  }

  root.append(
    T.grid2(
      T.field('UKT per semester (Rp)', uktI),
      T.field('Biaya hidup per bulan (Rp)', hidupI),
    ),
    T.grid2(
      T.field('Buku & alat per semester (Rp)', bukuI),
      T.field('Biaya awal sekali bayar (Rp)', awalI, 'Uang pangkal, ospek, dll. Isi 0 kalau tidak ada.'),
    ),
    T.field('Lama kuliah', lamaS),
    T.btn('Hitung', hitung, true),
    box,
  );
  hitung();
}
