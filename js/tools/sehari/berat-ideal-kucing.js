import { h as T, kv, utils } from '../../core.js?v=6.12.0';

// Rentang berat dewasa per ras kucing (standar ras CFA dan acuan umum
// veteriner). Skor kondisi tubuh memakai skala 9 poin WSAVA (Laflamme 1997).
const RAS = {
  domestik: ['Kucing domestik/campur', 3.5, 5.5],
  persia: ['Persia', 3, 5.5],
  mainecoon: ['Maine Coon', 4.5, 8],
  siam: ['Siam', 2.5, 5.5],
  british: ['British Shorthair', 4, 8],
  bengal: ['Bengal', 3.5, 7],
  ragdoll: ['Ragdoll', 4.5, 9],
  sphynx: ['Sphynx', 3.5, 5.5],
  scottish: ['Scottish Fold', 2.5, 6],
  anggora: ['Anggora Turki', 2.5, 5],
};
const BCS = {
  kurus: ['Kurus (skor 1-3)', 'Tulang rusuk mudah teraba, pinggang cekung kalau dilihat dari atas.'],
  ideal: ['Ideal (skor 4-5)', 'Tulang rusuk teraba di balik lapisan tipis, pinggang terlihat dari atas, perut tidak menggantung.'],
  gemuk: ['Gemuk (skor 6-7)', 'Tulang rusuk sulit diraba, pinggang samar, ada timbunan lemak di perut.'],
  obesitas: ['Obesitas (skor 8-9)', 'Tulang rusuk tidak teraba, pinggang tidak terlihat, perut menggantung jelas.'],
};
utils.beratIdealKucing = function (rasKey, beratKg) {
  const r = RAS[rasKey];
  const b = Number(beratKg);
  if (!r || !(b > 0)) return null;
  const status = b < r[1] ? 'kurang' : b > r[2] ? 'lebih' : 'ideal';
  return { nama: r[0], min: r[1], max: r[2], status, selisih: Math.round(Math.abs(b - (status === 'kurang' ? r[1] : status === 'lebih' ? r[2] : b)) * 10) / 10 };
};

export const meta = {"id": "berat-ideal-kucing", "name": "Berat Ideal Kucing", "cat": "sehari", "icon": "⚖️", "desc": "Rentang berat ideal kucing per ras, plus cek skor kondisi tubuh.", "keywords": "kucing,berat,ideal,ras,gemuk,kurus,skor tubuh", "since": "6.11.0"};
export function render(root) {
  const ras = T.select(Object.keys(RAS).map((k) => [k, RAS[k][0]]), 'domestik');
  const berat = T.input('text', 'Contoh: 4 atau 4,5', '4');
  berat.inputMode = 'decimal';
  const umur = T.select([
    ['dewasa', 'Dewasa (1-10 tahun)'],
    ['anak', 'Anak kucing (di bawah 1 tahun)'],
    ['senior', 'Senior (di atas 10 tahun)'],
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
    if (!(b > 0)) { T.show(box, '<span class="err">Isi berat kucing dengan angka, contoh: 4 atau 4,5.</span>'); return; }
    const r = utils.beratIdealKucing(ras.value, b);
    const bcsInfo = BCS[bcs.value];
    let statusHtml;
    if (umur.value === 'anak') {
      statusHtml = '<p class="warn">Rentang di bawah ini untuk kucing dewasa. Anak kucing masih tumbuh, beratnya naik tiap bulan. Tanya dokter hewan apakah pertumbuhannya sudah pas.</p>';
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
      '<p class="hint">Rentang berat mengikuti standar ras CFA dan acuan umum veteriner. Tiap kucing beda, jadi skor kondisi tubuh lebih menentukan daripada angka timbangan saja. Skala skor 1-9 dari WSAVA. Ini panduan umum. Untuk keputusan medis, konsultasikan ke dokter hewan.</p>');
  };

  root.appendChild(T.grid2(
    T.field('Ras kucing', ras),
    T.field('Berat sekarang (kg)', berat),
  ));
  root.appendChild(T.field('Umur', umur));
  root.appendChild(T.field('Kondisi tubuh (raba tulang rusuknya)', bcs));
  root.appendChild(T.btn('Cek Berat', hitung, true));
  root.appendChild(box);
  T.show(box, '<p class="hint">Pilih ras, isi berat, lalu tekan Cek Berat.</p>');
}
