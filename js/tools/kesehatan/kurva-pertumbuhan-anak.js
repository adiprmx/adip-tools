import { h as T, kv, errBox, utils } from '../../core.js';

// Kurva pertumbuhan anak dari tabel LMS resmi WHO.
// 0-5 tahun: WHO Child Growth Standards 2006 (tabel harian, diunduh dari
// cdn.who.int, November 2026). 5-19 tahun: WHO Growth Reference 2007.
// Berat menurut umur hanya tersedia sampai 10 tahun (WHO tidak menerbitkan
// acuan berat 10-19 tahun karena variasi pubertas); tinggi tersedia 0-19.
// Z-score: z = ((X/M)^L - 1) / (L*S). Persentil dari distribusi normal.
export const HARI_ACUAN = [0, 30, 61, 91, 122, 152, 183, 213, 244, 274, 305, 335, 365, 456, 547, 638, 730, 912, 1095, 1278, 1460, 1642, 1825];
export const BULAN_ACUAN = [61, 72, 84, 96, 108, 120, 132, 144, 156, 168, 180, 192, 204, 216, 228];
export const BULAN_WFA510 = [61, 72, 84, 96, 108, 120];
export const WFA05_LAKI = [[0.3487, 3.3464, 0.14602], [0.2303, 4.4525, 0.13413], [0.1969, 5.5714, 0.12382], [0.174, 6.369, 0.11732], [0.1551, 7.0069, 0.11313], [0.1396, 7.5077, 0.11081], [0.1256, 7.9389, 0.10957], [0.1134, 8.2963, 0.10902], [0.1019, 8.62, 0.10882], [0.0917, 8.9019, 0.10881], [0.0818, 9.1701, 0.10891], [0.0729, 9.4136, 0.10906], [0.0645, 9.646, 0.10925], [0.0414, 10.3069, 0.11007], [0.0212, 10.9326, 0.11118], [0.0031, 11.5407, 0.11259], [-0.0136, 12.1482, 0.11425], [-0.0429, 13.2933, 0.11779], [-0.0688, 14.3387, 0.12115], [-0.092, 15.3465, 0.12424], [-0.113, 16.3435, 0.12757], [-0.1324, 17.3364, 0.13129], [-0.1505, 18.3298, 0.13515]];
export const WFA05_PEREMPUAN = [[0.3809, 3.2322, 0.14171], [0.1727, 4.1716, 0.13738], [0.0959, 5.1315, 0.12998], [0.0407, 5.8393, 0.12622], [-0.0053, 6.428, 0.12401], [-0.0428, 6.8959, 0.12274], [-0.0759, 7.3016, 0.12204], [-0.1039, 7.6416, 0.12178], [-0.1292, 7.9534, 0.12181], [-0.1507, 8.2259, 0.12199], [-0.1704, 8.485, 0.12223], [-0.1873, 8.7207, 0.12247], [-0.2022, 8.9462, 0.12267], [-0.2382, 9.5968, 0.12299], [-0.2635, 10.2255, 0.12309], [-0.2813, 10.8453, 0.12335], [-0.294, 11.4741, 0.12389], [-0.31, 12.6982, 0.12585], [-0.3201, 13.8456, 0.12918], [-0.3283, 14.9704, 0.13375], [-0.3361, 16.0638, 0.13882], [-0.3439, 17.1455, 0.14367], [-0.3518, 18.2122, 0.14818]];
export const LHFA05_LAKI = [[1, 49.8842, 0.03795], [1, 54.6645, 0.03559], [1, 58.4384, 0.03423], [1, 61.4013, 0.03329], [1, 63.9041, 0.03257], [1, 65.8912, 0.03204], [1, 67.6435, 0.03165], [1, 69.1615, 0.03139], [1, 70.6224, 0.03124], [1, 71.9714, 0.03117], [1, 73.3075, 0.03118], [1, 74.5464, 0.03125], [1, 75.7391, 0.03137], [1, 79.1258, 0.03196], [1, 82.23, 0.03278], [1, 85.0987, 0.03374], [1, 87.8018, 0.03479], [1, 91.9053, 0.03703], [1, 96.0674, 0.03858], [1, 99.8441, 0.0397], [1, 103.3088, 0.04059], [1, 106.6373, 0.04138], [1, 109.9414, 0.04214]];
export const LHFA05_PEREMPUAN = [[1, 49.1477, 0.0379], [1, 53.6326, 0.03641], [1, 57.0796, 0.03568], [1, 59.7773, 0.0352], [1, 62.1071, 0.03486], [1, 64.019, 0.03463], [1, 65.751, 0.03448], [1, 67.2842, 0.03441], [1, 68.7732, 0.0344], [1, 70.1463, 0.03444], [1, 71.5088, 0.03453], [1, 72.7788, 0.03464], [1, 74.0049, 0.03479], [1, 77.4893, 0.03534], [1, 80.6785, 0.03597], [1, 83.6283, 0.03665], [1, 86.4008, 0.03733], [1, 90.6512, 0.03892], [1, 95.0344, 0.04006], [1, 99.0369, 0.04105], [1, 102.7117, 0.04192], [1, 106.1451, 0.04272], [1, 109.4016, 0.04346]];
export const WFA510_LAKI = [[-0.2026, 18.5057, 0.12988], [-0.318, 20.5137, 0.13372], [-0.4402, 22.8915, 0.13759], [-0.5482, 25.4163, 0.14344], [-0.6337, 28.1092, 0.15233], [-0.6764, 31.1586, 0.16305]];
export const WFA510_PEREMPUAN = [[-0.4681, 18.2579, 0.14295], [-0.5013, 20.1639, 0.149], [-0.5347, 22.374, 0.15556], [-0.5627, 25.0262, 0.16186], [-0.5833, 28.204, 0.16764], [-0.5958, 31.8578, 0.17262]];
export const HFA_LAKI = [[1, 110.2647, 0.04164], [1, 115.9509, 0.04249], [1, 121.7338, 0.04342], [1, 127.2651, 0.04438], [1, 132.5652, 0.04535], [1, 137.7795, 0.04626], [1, 143.1126, 0.04703], [1, 149.0807, 0.04753], [1, 156.0426, 0.0476], [1, 163.1816, 0.04714], [1, 168.958, 0.04619], [1, 172.8967, 0.04495], [1, 175.1609, 0.04364], [1, 176.1449, 0.04241], [1, 176.5432, 0.04134]];
export const HFA_PEREMPUAN = [[1, 109.6016, 0.04355], [1, 115.1244, 0.04447], [1, 120.8105, 0.04525], [1, 126.5558, 0.04581], [1, 132.4944, 0.04612], [1, 138.6363, 0.04614], [1, 144.9929, 0.04584], [1, 151.2327, 0.04523], [1, 156.3748, 0.04439], [1, 159.789, 0.04345], [1, 161.6692, 0.04255], [1, 162.5156, 0.04176], [1, 162.8545, 0.04109], [1, 163.0595, 0.04053], [1, 163.1548, 0.04009]];

// lmsPada, zDariLMS, nilaiDariZ, persentilDariZ kanonis tinggal di utils (core.js).

// z-score untuk persentil 3, 15, 50, 85, 97 (standar kurva WHO).
export const Z_PERSENTIL = [[3, -1.8808], [15, -1.0364], [50, 0], [85, 1.0364], [97, 1.8808]];

// Nilai ukur pada persentil tertentu untuk tiap titik acuan umur.
export function kurvaPersentil(tabel, acuan, z) {
  return acuan.map((x, i) => [x, utils.nilaiDariZ(z, tabel[i][0], tabel[i][1], tabel[i][2])]);
}

function lmsBerat(jk, bulan) {
  if (bulan <= 60) return { lms: utils.lmsPada(jk === 'perempuan' ? WFA05_PEREMPUAN : WFA05_LAKI, HARI_ACUAN, bulan * 30.4375), sumber: 'WHO 2006 (0-5 tahun)' };
  if (bulan <= 120) return { lms: utils.lmsPada(jk === 'perempuan' ? WFA510_PEREMPUAN : WFA510_LAKI, BULAN_WFA510, bulan), sumber: 'WHO 2007 (5-10 tahun)' };
  return null;
}

function lmsTinggi(jk, bulan) {
  if (bulan <= 60) return { lms: utils.lmsPada(jk === 'perempuan' ? LHFA05_PEREMPUAN : LHFA05_LAKI, HARI_ACUAN, bulan * 30.4375), sumber: 'WHO 2006 (0-5 tahun)' };
  return { lms: utils.lmsPada(jk === 'perempuan' ? HFA_PEREMPUAN : HFA_LAKI, BULAN_ACUAN, bulan), sumber: 'WHO 2007 (5-19 tahun)' };
}

export function nilaiPertumbuhan(jk, bulan, beratKg, tinggiCm) {
  const hasil = {};
  if (beratKg != null) {
    const w = lmsBerat(jk, bulan);
    if (w) {
      const z = utils.zDariLMS(beratKg, w.lms[0], w.lms[1], w.lms[2]);
      hasil.berat = { z, persen: utils.persentilDariZ(z), tengah: w.lms[1], sumber: w.sumber };
    }
  }
  if (tinggiCm != null) {
    const h = lmsTinggi(jk, bulan);
    const z = utils.zDariLMS(tinggiCm, h.lms[0], h.lms[1], h.lms[2]);
    hasil.tinggi = { z, persen: utils.persentilDariZ(z), tengah: h.lms[1], sumber: h.sumber };
  }
  return hasil;
}

function persenTeks(p) {
  if (p < 1) return 'di bawah 1';
  if (p > 99) return 'di atas 99';
  return String(Math.round(p));
}

function labelZ(z) {
  if (z < -2) return 'di bawah rentang wajar';
  if (z > 2) return 'di atas rentang wajar';
  return 'dalam rentang wajar';
}

// Grafik SVG sederhana: garis P3/P15/P50/P85/P97 + titik anak.
// umurMax dan acuan dalam satuan yang sama (hari untuk 0-5 tahun, bulan untuk 5-19).
function grafik(judul, tabel, acuan, umurX, nilaiY, satuan, umurMax, hari) {
  const W = 320, H = 190, PL = 34, PR = 8, PT = 10, PB = 22;
  let ymin = Infinity, ymax = -Infinity;
  const garis = Z_PERSENTIL.map(([p, z]) => {
    const pts = kurvaPersentil(tabel, acuan, z);
    pts.forEach(([, v]) => { ymin = Math.min(ymin, v); ymax = Math.max(ymax, v); });
    return [p, pts];
  });
  if (nilaiY != null) { ymin = Math.min(ymin, nilaiY); ymax = Math.max(ymax, nilaiY); }
  const pad = (ymax - ymin) * 0.08 || 1;
  ymin -= pad; ymax += pad;
  const x0 = acuan[0];
  const x1 = umurMax != null ? umurMax : acuan[acuan.length - 1];
  const sx = (x) => PL + ((x - x0) / (x1 - x0)) * (W - PL - PR);
  const sy = (v) => PT + (1 - (v - ymin) / (ymax - ymin)) * (H - PT - PB);
  let paths = '';
  garis.forEach(([p, pts]) => {
    const d = pts.map(([x, v], i) => (i === 0 ? 'M' : 'L') + sx(x).toFixed(1) + ' ' + sy(v).toFixed(1)).join(' ');
    const tebal = p === 50 ? 2 : 1;
    const putus = p === 50 ? '' : ' stroke-dasharray="3,3"';
    paths += '<path d="' + d + '" fill="none" stroke="#8a8a8a" stroke-width="' + tebal + '"' + putus + '/>';
  });
  let titik = '';
  if (umurX != null && nilaiY != null && umurX >= x0 && umurX <= x1) {
    titik = '<circle cx="' + sx(umurX).toFixed(1) + '" cy="' + sy(nilaiY).toFixed(1) + '" r="4.5" fill="var(--acc,#ff6b4a)"/>';
  }
  const labelTahun = [];
  const perTahun = hari ? 365.25 : 12;
  const tahunAkhir = Math.round(x1 / perTahun);
  for (let th = 0; th <= tahunAkhir; th++) {
    const x = th * perTahun;
    if (x >= x0 && x <= x1) labelTahun.push('<text x="' + sx(x).toFixed(1) + '" y="' + (H - 6) + '" font-size="9" fill="#8a8a8a" text-anchor="middle">' + th + '</text>');
  }
  return '<div style="margin:12px 0"><p style="font-weight:700;margin:0 0 4px">' + T.esc(judul) + '</p>' +
    '<svg viewBox="0 0 ' + W + ' ' + H + '" style="width:100%;height:auto;display:block" role="img" aria-label="' + T.esc(judul) + '">' +
    paths + titik +
    '<text x="4" y="' + (sy(ymax - pad) + 3) + '" font-size="9" fill="#8a8a8a">' + ymax.toFixed(0) + '</text>' +
    '<text x="4" y="' + (sy(ymin + pad) + 3) + '" font-size="9" fill="#8a8a8a">' + ymin.toFixed(0) + '</text>' +
    labelTahun.join('') +
    '<text x="' + (W - PR) + '" y="' + (H - 6) + '" font-size="9" fill="#8a8a8a" text-anchor="end">tahun</text>' +
    '</svg><p class="hint" style="margin:4px 0 0">Garis tengah = nilai tengah (persentil 50). Garis putus-putus = persentil 3, 15, 85, 97. Titik warna = posisi anakmu. Sumbu tegak dalam ' + T.esc(satuan) + '.</p></div>';
}

export const meta = { "id": "kurva-pertumbuhan-anak", "name": "Kurva Pertumbuhan Anak", "cat": "kesehatan", "icon": "📈", "desc": "Plot berat dan tinggi anak 0-19 tahun pada kurva persentil WHO.", "keywords": "kurva pertumbuhan,pertumbuhan anak,persentil who,stunting,berat anak,tinggi anak,kms", "since": "6.18.0" };

export function render(root) {
  const jk = T.select([['laki-laki', 'Laki-laki'], ['perempuan', 'Perempuan']], 'laki-laki');
  const thn = T.input('number', 'Umur (tahun)', '5');
  const bln = T.input('number', 'Tambah bulan (0-11)', '0');
  const berat = T.input('number', 'Berat badan (kg, boleh kosong)', '19');
  const tinggi = T.input('number', 'Tinggi badan (cm, boleh kosong)', '110');
  const box = T.out();

  const hitung = () => {
    const tahun = T.num(thn.value);
    const bulan = T.num(bln.value);
    const b = berat.value.trim() === '' ? null : T.num(berat.value);
    const t = tinggi.value.trim() === '' ? null : T.num(tinggi.value);
    if (!(tahun >= 0 && tahun <= 19)) {
      T.show(box, errBox('Isi umur tahun antara 0 dan 19.'));
      return;
    }
    if (!(bulan >= 0 && bulan <= 11)) {
      T.show(box, errBox('Tambah bulan diisi 0 sampai 11.'));
      return;
    }
    if (b != null && !(b >= 1 && b <= 200)) {
      T.show(box, errBox('Isi berat badan antara 1 sampai 200 kg, atau kosongkan.'));
      return;
    }
    if (t != null && !(t >= 30 && t <= 220)) {
      T.show(box, errBox('Isi tinggi badan antara 30 sampai 220 cm, atau kosongkan.'));
      return;
    }
    if (b == null && t == null) {
      T.show(box, errBox('Isi berat badan, tinggi badan, atau keduanya.'));
      return;
    }
    const totalBulan = tahun * 12 + bulan;
    const r = nilaiPertumbuhan(jk.value, totalBulan, b, t);
    let html = '';
    let graf = '';
    if (r.berat) {
      html += kv('Berat badan', 'Persentil ke-' + persenTeks(r.berat.persen) + ', ' + labelZ(r.berat.z) +
        ' (nilai tengah anak seusianya ' + r.berat.tengah.toFixed(1).replace('.', ',') + ' kg)');
      const tabel = totalBulan <= 60 ? (jk.value === 'perempuan' ? WFA05_PEREMPUAN : WFA05_LAKI) : (jk.value === 'perempuan' ? WFA510_PEREMPUAN : WFA510_LAKI);
      const acuan = totalBulan <= 60 ? HARI_ACUAN : BULAN_WFA510;
      const xAnak = totalBulan <= 60 ? Math.min(totalBulan * 30.4375, 1825) : totalBulan;
      graf += grafik('Kurva berat menurut umur', tabel, acuan, xAnak, b, 'kg', totalBulan <= 60 ? 1825 : 120, totalBulan <= 60);
    } else if (b != null) {
      html += '<p class="hint">WHO tidak menerbitkan acuan berat badan untuk anak di atas 10 tahun, ' +
        'karena berat sangat bervariasi saat pubertas. Untuk anak di atas 10 tahun, gunakan BMI Anak.</p>';
    }
    if (r.tinggi) {
      html += kv('Tinggi badan', 'Persentil ke-' + persenTeks(r.tinggi.persen) + ', ' + labelZ(r.tinggi.z) +
        ' (nilai tengah anak seusianya ' + r.tinggi.tengah.toFixed(1).replace('.', ',') + ' cm)');
      const tabel = totalBulan <= 60 ? (jk.value === 'perempuan' ? LHFA05_PEREMPUAN : LHFA05_LAKI) : (jk.value === 'perempuan' ? HFA_PEREMPUAN : HFA_LAKI);
      const acuan = totalBulan <= 60 ? HARI_ACUAN : BULAN_ACUAN;
      const xAnak = totalBulan <= 60 ? Math.min(totalBulan * 30.4375, 1825) : totalBulan;
      graf += grafik('Kurva tinggi menurut umur', tabel, acuan, xAnak, t, 'cm', totalBulan <= 60 ? 1825 : 228, totalBulan <= 60);
    }
    const perluPeriksa = (r.berat && (r.berat.z < -2 || r.berat.z > 2)) || (r.tinggi && (r.tinggi.z < -2 || r.tinggi.z > 2));
    T.show(box, html + graf +
      '<p class="hint">' + (perluPeriksa
        ? 'Salah satu ukuran di luar rentang wajar. Sebaiknya periksa ke dokter anak atau posyandu untuk penilaian lanjutan.'
        : 'Yang penting bukan satu titik saja, tapi apakah anakmu mengikuti garis kurvanya dari waktu ke waktu. Ukur berkala dan catat di buku KIA atau KMS.') + '</p>' +
      '<p class="hint">Sumber: WHO Child Growth Standards 2006 (0-5 tahun) dan WHO Growth Reference 2007 (5-19 tahun), ' +
      'tabel resmi dari who.int, diunduh November 2026. Ini alat bantu umum, bukan diagnosis. ' +
      'Untuk keputusan soal tumbuh anak, tanya dokter anak atau tenaga kesehatan.</p>');
  };

  root.appendChild(T.grid2(
    T.field('Jenis kelamin', jk),
    T.field('Umur (tahun)', thn, '0 sampai 19 tahun'),
  ));
  root.appendChild(T.grid2(
    T.field('Tambah bulan (0-11)', bln),
    T.field('Berat badan (kg)', berat),
  ));
  root.appendChild(T.field('Tinggi badan (cm)', tinggi));
  root.appendChild(T.btn('Lihat kurva', hitung, true));
  root.appendChild(box);
  hitung();
}
