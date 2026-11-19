import { h as T, esc, utils } from '../../core.js';

// HOMA-IR (Homeostatic Model Assessment of Insulin Resistance),
// Matthews dkk., Diabetologia 1985. Memperkirakan resistensi insulin
// dari gula darah puasa dan insulin puasa:
//   HOMA-IR = insulin puasa (uU/mL) x gula puasa (mmol/L) / 22,5
// Konversi gula: mmol/L = mg/dL / 18,018 (sama seperti kalkulator
// konversi gula darah di repo ini).
// Patokan yang dipakai luas: di bawah 1 optimal, 1-1,9 normal,
// 1,9-2,9 resistensi awal, 2,9 ke atas resistensi signifikan.
// Catatan: batas angka ini tidak universal; tiap lab dan populasi
// bisa memakai batas yang sedikit berbeda.
export const FAKTOR_GULA = 18.018;

export function hitungHomaIR(insulin, gula, satuan) {
  if (!(insulin > 0) || !(gula > 0)) return null;
  const gulaMmol = satuan === 'mgdl' ? gula / FAKTOR_GULA : gula;
  return insulin * gulaMmol / 22.5;
}

export function kategoriHomaIR(h) {
  if (h < 1) return ['Optimal', 'Tubuhmu merespons insulin dengan sangat baik.', 'ok'];
  if (h < 1.9) return ['Normal', 'Tubuhmu merespons insulin dengan baik.', 'ok'];
  if (h < 2.9) return ['Resistensi awal', 'Tubuhmu mulai kurang peka terhadap insulin. Pola makan, gerak, dan berat badan yang dijaga bisa memperbaikinya. Bicarakan dengan dokter.', 'warn'];
  return ['Resistensi signifikan', 'Tubuhmu sudah cukup kebal terhadap insulin. Ini tanda awal menuju diabetes tipe 2. Periksakan ke dokter untuk rencana lanjutan.', 'err'];
}

export const meta = { "id": "kalkulator-homa-ir", "name": "Kalkulator HOMA-IR (Resistensi Insulin)", "cat": "kesehatan", "icon": "🩸", "desc": "Perkiraan resistensi insulin dari hasil lab gula darah puasa dan insulin puasa.", "keywords": "homa-ir,homa,insulin,resistensi insulin,diabetes,gula darah puasa,metabolik", "since": "6.19.0" };

export function render(root) {
  const insulin = T.input('number', 'Insulin puasa (uU/mL)', '10');
  const gula = T.input('number', 'Gula darah puasa', '90');
  const satuan = T.select([['mgdl', 'mg/dL'], ['mmol', 'mmol/L']], 'mgdl');
  const box = T.out();

  const hitung = () => {
    const ins = T.num(insulin.value);
    const gl = T.num(gula.value);
    if (!(ins >= 0.5 && ins <= 300)) {
      T.show(box, '<span class="err">Isi insulin puasa antara 0,5 sampai 300 uU/mL (dari hasil lab).</span>');
      return;
    }
    if (satuan.value === 'mgdl' && !(gl >= 20 && gl <= 600)) {
      T.show(box, '<span class="err">Isi gula darah puasa antara 20 sampai 600 mg/dL.</span>');
      return;
    }
    if (satuan.value === 'mmol' && !(gl >= 1 && gl <= 35)) {
      T.show(box, '<span class="err">Isi gula darah puasa antara 1 sampai 35 mmol/L.</span>');
      return;
    }
    const h = hitungHomaIR(ins, gl, satuan.value);
    const k = kategoriHomaIR(h);
    const gulaMmol = satuan.value === 'mgdl' ? gl / FAKTOR_GULA : gl;
    T.show(box,
      '<div class="center"><div class="dim">HOMA-IR</div>' +
      '<div class="big">' + utils.fmtDes(h, 2) + '</div>' +
      '<div class="' + k[2] + '" style="margin-top:6px"><b>' + esc(k[0]) + '</b><br>' + esc(k[1]) + '</div></div>' +
      '<div class="kv"><span class="k">Gula puasa</span><span class="v">' + utils.fmtDes(gulaMmol, 2) + ' mmol/L (' + T.fmt(Math.round(satuan.value === 'mgdl' ? gl : gl * FAKTOR_GULA)) + ' mg/dL)</span></div>' +
      '<div class="kv"><span class="k">Insulin puasa</span><span class="v">' + utils.fmtDes(ins, 1) + ' uU/mL</span></div>' +
      '<div class="dim" style="margin-top:12px">Patokan HOMA-IR</div>' +
      '<div class="kv"><span class="k">Di bawah 1</span><span class="v">Optimal' + (h < 1 ? ' <b>&larr; kamu di sini</b>' : '') + '</span></div>' +
      '<div class="kv"><span class="k">1 - 1,9</span><span class="v">Normal' + (h >= 1 && h < 1.9 ? ' <b>&larr; kamu di sini</b>' : '') + '</span></div>' +
      '<div class="kv"><span class="k">1,9 - 2,9</span><span class="v">Resistensi awal' + (h >= 1.9 && h < 2.9 ? ' <b>&larr; kamu di sini</b>' : '') + '</span></div>' +
      '<div class="kv"><span class="k">2,9 ke atas</span><span class="v">Resistensi signifikan' + (h >= 2.9 ? ' <b>&larr; kamu di sini</b>' : '') + '</span></div>' +
      '<p class="hint">Rumus: insulin puasa kali gula puasa dibagi 22,5 (Matthews dkk., 1985). Kedua angka harus dari hasil lab dalam keadaan puasa, ' +
      'dan HOMA-IR tidak valid untuk orang yang memakai insulin atau obat diabetes tertentu. Batas angka di atas tidak universal; lab bisa memakai batas berbeda. ' +
      'Ini perkiraan buat belajar, bukan diagnosis. Kalau hasilnya tinggi, bawa hasil labmu ke dokter.</p>');
  };

  root.appendChild(T.grid2(
    T.field('Insulin puasa (uU/mL)', insulin, 'Dari hasil lab, dalam keadaan puasa.'),
    T.field('Gula darah puasa', gula, 'Dari hasil lab, dalam keadaan puasa.'),
    T.field('Satuan gula darah', satuan),
  ));
  root.appendChild(T.btn('Hitung', hitung, true));
  root.appendChild(box);
  hitung();
}
