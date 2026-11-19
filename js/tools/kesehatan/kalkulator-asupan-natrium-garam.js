import { h as T, kv, errBox } from '../../core.js';

// Natrium dari garam dapur: garam (NaCl) mengandung natrium 39,3% dari
// beratnya (23 / 58,44). Jadi 1 gram garam = 393 mg natrium, dan 5 gram
// garam = 1.965 mg natrium.
// Angka kecukupan natrium dari Tabel AKG 2019 (Permenkes No. 28 Tahun 2019),
// lampiran resmi Kemenkes. Batas harian yang dianjurkan WHO: kurang dari
// 2.000 mg natrium (setara kurang dari 5 gram garam) per hari untuk dewasa.
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
// [laki-laki, perempuan] dalam mg natrium per hari (AKG 2019).
export const AKG_NATRIUM = {
  '0-5 bln': [120, 120], '6-11 bln': [370, 370], '1-3 th': [800, 800],
  '4-6 th': [900, 900], '7-9 th': [1000, 1000], '10-12 th': [1300, 1400],
  '13-15 th': [1500, 1500], '16-18 th': [1700, 1600], '19-29 th': [1500, 1500],
  '30-49 th': [1500, 1500], '50-64 th': [1300, 1400], '65-80 th': [1100, 1200],
  '80+ th': [1000, 1000],
};
export const BATAS_WHO_MG = 2000;

export function natriumDariGaram(gramGaram) {
  if (!(gramGaram >= 0)) return null;
  return gramGaram * 393;
}

export function garamDariNatrium(mgNatrium) {
  if (!(mgNatrium >= 0)) return null;
  return mgNatrium / 393;
}

export function akgNatrium(kelompok, jk) {
  const baris = AKG_NATRIUM[kelompok];
  if (!baris) return null;
  return jk === 'perempuan' ? baris[1] : baris[0];
}

export function nilaiNatrium(kelompok, jk, gramGaram, mgKemasan) {
  const akg = akgNatrium(kelompok, jk);
  const dariGaram = natriumDariGaram(gramGaram);
  const total = dariGaram + (mgKemasan || 0);
  return { akg, dariGaram, total, persenAkg: akg ? (total / akg) * 100 : null, persenWho: (total / BATAS_WHO_MG) * 100, garamSetara: garamDariNatrium(total) };
}

export const meta = { "id": "kalkulator-asupan-natrium-garam", "name": "Kalkulator Asupan Natrium / Garam", "cat": "kesehatan", "icon": "🧂", "desc": "Hitung natrium dari garam dan makanan kemasan, lalu bandingkan dengan angka kecukupan harian (AKG 2019).", "keywords": "natrium,garam,sodium,akg,tekanan darah,hipertensi,asupan garam", "since": "6.18.0" };

export function render(root) {
  const umur = T.select(KELOMPOK_UMUR, '19-29 th');
  const jk = T.select([['laki-laki', 'Laki-laki'], ['perempuan', 'Perempuan']], 'laki-laki');
  const garam = T.input('number', 'Garam per hari (gram)', '5');
  const kemasan = T.input('number', 'Natrium dari makanan kemasan (mg)', '0');
  const box = T.out();

  const hitung = () => {
    const g = T.num(garam.value);
    const k = T.num(kemasan.value);
    if (!(g >= 0 && g <= 100)) {
      T.show(box, errBox('Isi garam per hari antara 0 sampai 100 gram.'));
      return;
    }
    if (!(k >= 0 && k <= 20000)) {
      T.show(box, errBox('Isi natrium dari makanan kemasan antara 0 sampai 20.000 mg.'));
      return;
    }
    const r = nilaiNatrium(umur.value, jk.value, g, k);
    const pesan = r.total <= r.akg
      ? 'Masih dalam angka kecukupan untuk umurmu. Pertahankan, dan ingat makanan di luar sering sudah asin tanpa terasa.'
      : (r.total <= BATAS_WHO_MG
        ? 'Sudah melewati angka kecukupan, tapi masih di bawah batas anjuran WHO. Kurangi pelan-pelan, misalnya setengah sendok teh dulu.'
        : 'Sudah melewati batas anjuran WHO. Terlalu banyak garam berkaitan dengan tekanan darah tinggi. Coba kurangi garam masak dan makanan asin kemasan.');
    T.show(box,
      '<div class="center"><div class="dim">Total natrium per hari</div>' +
      '<div class="big">' + T.fmt(Math.round(r.total)) + ' mg</div>' +
      '<div class="dim">Setara ' + r.garamSetara.toFixed(1).replace('.', ',') + ' gram garam</div></div>' +
      kv('Dari garam dapur', T.fmt(Math.round(r.dariGaram)) + ' mg') +
      kv('Dari makanan kemasan', T.fmt(Math.round(k)) + ' mg') +
      kv('Angka kecukupan (AKG)', T.fmt(r.akg) + ' mg per hari') +
      kv('Dibanding angka kecukupan', Math.round(r.persenAkg) + '%') +
      kv('Batas anjuran WHO', 'Di bawah 2.000 mg per hari') +
      '<p class="hint">' + T.esc(pesan) + ' Satu sendok teh garam kira-kira 6 gram. ' +
      'Natrium dari makanan kemasan bisa dilihat di label gizi kemasannya.</p>' +
      '<p class="hint">Sumber: Angka Kecukupan Gizi 2019 (Permenkes No. 28 Tahun 2019) dan anjuran WHO soal natrium (kurang dari 2.000 mg per hari). ' +
      'Garam dapur mengandung natrium sekitar 39,3% dari beratnya. Ini alat bantu umum, bukan saran medis. ' +
      'Bila punya tekanan darah tinggi atau penyakit ginjal, ikuti anjuran doktermu.</p>');
  };

  root.appendChild(T.grid2(
    T.field('Kelompok umur', umur),
    T.field('Jenis kelamin', jk),
  ));
  root.appendChild(T.field('Garam yang dipakai per hari (gram)', garam, 'Termasuk garam untuk masak di rumah. 1 sendok teh kira-kira 6 gram.'));
  root.appendChild(T.field('Natrium dari makanan kemasan (mg, boleh 0)', kemasan, 'Jumlahkan angka natrium di label gizi makanan/minuman kemasan yang kamu makan hari ini.'));
  root.appendChild(T.btn('Hitung natrium', hitung, true));
  root.appendChild(box);
  hitung();
}
