import { h as T, kv, utils } from '../../core.js?v=6.11.5';

// Rentang berat dewasa per ras anjing (standar ras AKC). Skor kondisi
// tubuh memakai skala 9 poin WSAVA (Laflamme 1997).
const RAS = {
  kampungKecil: ['Campuran kecil', 5, 10],
  kampungSedang: ['Campuran sedang', 10, 25],
  kampungBesar: ['Campuran besar', 25, 45],
  chihuahua: ['Chihuahua', 1.5, 3],
  pomeranian: ['Pomeranian', 1.4, 3.2],
  shihtzu: ['Shih Tzu', 4, 7.2],
  beagle: ['Beagle', 9, 11],
  frenchie: ['French Bulldog', 8, 14],
  corgi: ['Corgi (Pembroke)', 10, 14],
  bordercollie: ['Border Collie', 14, 20],
  cocker: ['Cocker Spaniel', 12, 15],
  husky: ['Siberian Husky', 16, 27],
  labrador: ['Labrador Retriever', 25, 36],
  golden: ['Golden Retriever', 25, 34],
  gsd: ['German Shepherd', 22, 40],
  rottweiler: ['Rottweiler', 36, 59],
  greatdane: ['Great Dane', 50, 79],
};
const BCS = {
  kurus: ['Kurus (skor 1-3)', 'Tulang rusuk mudah teraba, pinggang cekung kalau dilihat dari atas.'],
  ideal: ['Ideal (skor 4-5)', 'Tulang rusuk teraba di balik lapisan tipis, pinggang terlihat dari atas, perut tidak menggantung.'],
  gemuk: ['Gemuk (skor 6-7)', 'Tulang rusuk sulit diraba, pinggang samar, ada timbunan lemak di perut.'],
  obesitas: ['Obesitas (skor 8-9)', 'Tulang rusuk tidak teraba, pinggang tidak terlihat, perut menggantung jelas.'],
};
utils.beratIdealAnjing = function (rasKey, beratKg) {
  const r = RAS[rasKey];
  const b = Number(beratKg);
  if (!r || !(b > 0)) return null;
  const status = b < r[1] ? 'kurang' : b > r[2] ? 'lebih' : 'ideal';
  return { nama: r[0], min: r[1], max: r[2], status, selisih: Math.round(Math.abs(b - (status === 'kurang' ? r[1] : status === 'lebih' ? r[2] : b)) * 10) / 10 };
};

export const meta = {"id": "berat-ideal-anjing", "name": "Berat Ideal Anjing", "cat": "sehari", "icon": "⚖️", "desc": "Rentang berat ideal anjing per ras, plus cek skor kondisi tubuh.", "keywords": "anjing,berat,ideal,ras,gemuk,kurus,skor tubuh", "since": "6.11.0"};
export function render(root) {
  const ras = T.select(Object.keys(RAS).map((k) => [k, RAS[k][0]]), 'kampungSedang');
  const berat = T.input('text', 'Contoh: 20 atau 12,5', '20');
  berat.inputMode = 'decimal';
  const umur = T.select([
    ['dewasa', 'Dewasa'],
    ['anak', 'Anak anjing (masih tumbuh)'],
    ['senior', 'Senior'],
  ], 'dewasa');
  const bcs = T.select([
    ['ideal', 'Ideal (skor 4-5): tulang rusuk teraba tipis, pinggang terlihat'],
    ['kurus', 'Kurus (skor 1-3): tulang rusuk mudah teraba, pinggang cekung'],
    ['gemuk', 'Gemuk (skor 6-7): tulang rusuk sulit diraba, pinggang samar'],
    ['obesitas', 'Obesitas (skor 8-9): tulang rusuk tidak teraba, perut menggantung'],
  ], 'ideal');
  const box = T.out();

  const hitung = () => {
    const b = T.num(berat.value);
    if (!(b > 0)) { T.show(box, '<span class="err">Isi berat anjing dengan angka, contoh: 20 atau 12,5.</span>'); return; }
    const r = utils.beratIdealAnjing(ras.value, b);
    const bcsInfo = BCS[bcs.value];
    let statusHtml;
    if (umur.value === 'anak') {
      statusHtml = '<p class="warn">Rentang di bawah ini untuk anjing dewasa. Anak anjing masih tumbuh, beratnya naik tiap bulan. Tanya dokter hewan apakah pertumbuhannya sudah pas.</p>';
    } else if (r.status === 'ideal') {
      statusHtml = '<p class="ok">Beratnya masuk rentang ideal untuk ras ini.</p>';
    } else if (r.status === 'kurang') {
      statusHtml = '<p class="warn">Beratnya di bawah rentang ideal sekitar ' + T.fmt(r.selisih) + ' kg.</p>';
    } else {
      statusHtml = '<p class="warn">Beratnya di atas rentang ideal sekitar ' + T.fmt(r.selisih) + ' kg.</p>';
    }
    T.show(box,
      '<div class="center"><div class="dim">Rentang berat ideal ' + r.nama + '</div>' +
      '<div class="big">' + T.fmt(r.min) + '-' + T.fmt(r.max) + ' kg</div></div>' +
      statusHtml +
      kv('Berat sekarang', T.fmt(b) + ' kg') +
      kv('Skor kondisi tubuh', bcsInfo[0]) +
      '<p class="hint">' + bcsInfo[1] + '</p>' +
      '<p class="hint">Rentang berat mengikuti standar ras AKC. Anjing campuran sering keluar dari rentang ras, jadi skor kondisi tubuh lebih menentukan daripada angka timbangan saja. Skala skor 1-9 dari WSAVA. Ini panduan umum. Untuk keputusan medis, konsultasikan ke dokter hewan.</p>');
  };

  root.appendChild(T.grid2(
    T.field('Ras anjing', ras),
    T.field('Berat sekarang (kg)', berat),
  ));
  root.appendChild(T.field('Umur', umur));
  root.appendChild(T.field('Kondisi tubuh (raba tulang rusuknya)', bcs));
  root.appendChild(T.btn('Cek Berat', hitung, true));
  root.appendChild(box);
  T.show(box, '<p class="hint">Pilih ras, isi berat, lalu tekan Cek Berat.</p>');
}
