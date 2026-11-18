import { h as T, esc } from '../../core.js';

// Laju filtrasi glomerulus (eGFR) dengan rumus CKD-EPI 2021 tanpa ras
// (Inker dkk., New England Journal of Medicine 2021):
// eGFR = 142 x min(Scr/k,1)^a x max(Scr/k,1)^-1,200 x 0,9938^umur
//        x 1,012 bila wanita.
// k = 0,7 (wanita) / 0,9 (pria); a = -0,241 (wanita) / -0,302 (pria).
// Scr = kreatinin serum dalam mg/dL.
function egfr(scr, umur, wanita) {
  const k = wanita ? 0.7 : 0.9;
  const a = wanita ? -0.241 : -0.302;
  const rasio = scr / k;
  let v = 142 * Math.pow(Math.min(rasio, 1), a) * Math.pow(Math.max(rasio, 1), -1.2) * Math.pow(0.9938, umur);
  if (wanita) v *= 1.012;
  return v;
}

function stadium(g) {
  if (g >= 90) return ['G1', 'Normal atau tinggi', 'ok'];
  if (g >= 60) return ['G2', 'Menurun sedikit', 'ok'];
  if (g >= 45) return ['G3a', 'Menurun ringan sampai sedang', 'warn'];
  if (g >= 30) return ['G3b', 'Menurun sedang sampai berat', 'warn'];
  if (g >= 15) return ['G4', 'Menurun berat', 'err'];
  return ['G5', 'Gagal ginjal', 'err'];
}

export const meta = {"id": "kalkulator-gfr-fungsi-ginjal", "name": "Kalkulator GFR (Fungsi Ginjal)", "cat": "kesehatan", "icon": "🧪", "desc": "Perkiraan seberapa baik ginjalmu menyaring darah, dari hasil lab kreatinin, umur, dan jenis kelamin.", "keywords": "gfr,ginjal,kreatinin,ckd-epi,fungsi ginjal,egfr,stadium ckd", "since": "6.17.0"};
export function render(root) {
  const kreatinin = T.input('number', 'Kreatinin serum (mg/dL)', '1,0');
  const umur = T.input('number', 'Umur (tahun)', '50');
  const gender = T.select([['pria', 'Pria'], ['wanita', 'Wanita']], 'pria');
  const box = T.out();

  const hitung = () => {
    const scr = T.num(kreatinin.value);
    const u = T.num(umur.value);
    if (!(scr >= 0.1 && scr <= 20)) {
      T.show(box, '<span class="err">Isi kreatinin serum antara 0,1 sampai 20 mg/dL. Angkanya ada di hasil lab darahmu.</span>');
      return;
    }
    if (!(u >= 18 && u <= 100)) {
      T.show(box, '<span class="err">Rumus ini untuk dewasa. Isi umur antara 18 sampai 100 tahun.</span>');
      return;
    }
    const wanita = gender.value === 'wanita';
    const g = egfr(scr, u, wanita);
    const s = stadium(g);
    T.show(box,
      '<div class="center"><div class="dim">Perkiraan laju saring ginjal (eGFR)</div>' +
      '<div class="big">' + g.toFixed(0) + '</div>' +
      '<div class="dim">mL/menit/1,73 m&sup2;</div>' +
      '<div class="' + s[2] + '" style="margin-top:6px"><b>Stadium ' + esc(s[0]) + ': ' + esc(s[1]) + '</b></div></div>' +
      '<div class="dim" style="margin-top:12px">Stadium penyakit ginjal kronis (KDIGO)</div>' +
      '<div class="kv"><span class="k">G1, 90 ke atas</span><span class="v">Normal atau tinggi' + (s[0] === 'G1' ? ' <b>&larr; kamu di sini</b>' : '') + '</span></div>' +
      '<div class="kv"><span class="k">G2, 60 - 89</span><span class="v">Menurun sedikit' + (s[0] === 'G2' ? ' <b>&larr; kamu di sini</b>' : '') + '</span></div>' +
      '<div class="kv"><span class="k">G3a, 45 - 59</span><span class="v">Menurun ringan sampai sedang' + (s[0] === 'G3a' ? ' <b>&larr; kamu di sini</b>' : '') + '</span></div>' +
      '<div class="kv"><span class="k">G3b, 30 - 44</span><span class="v">Menurun sedang sampai berat' + (s[0] === 'G3b' ? ' <b>&larr; kamu di sini</b>' : '') + '</span></div>' +
      '<div class="kv"><span class="k">G4, 15 - 29</span><span class="v">Menurun berat' + (s[0] === 'G4' ? ' <b>&larr; kamu di sini</b>' : '') + '</span></div>' +
      '<div class="kv"><span class="k">G5, di bawah 15</span><span class="v">Gagal ginjal' + (s[0] === 'G5' ? ' <b>&larr; kamu di sini</b>' : '') + '</span></div>' +
      '<p class="hint">Dihitung dengan rumus CKD-EPI 2021 (tanpa ras) dari angka kreatinin di hasil labmu. ' +
      'Angka ini BUKAN diagnosis. Nilai kreatinin bisa naik turun karena dehidrasi, obat, atau habis olahraga berat, dan satu hasil lab saja tidak cukup untuk menyimpulkan kondisi ginjal. ' +
      'Bila angkamu di bawah 60, atau kamu punya diabetes atau darah tinggi, cek ke dokter. Buat keputusan medis, selalu konsultasi ke tenaga kesehatan.</p>');
  };

  root.appendChild(T.grid2(
    T.field('Kreatinin serum (mg/dL)', kreatinin, 'Angka dari hasil lab darah. Kalau labmu pakai µmol/L, bagi 88,4 dulu.'),
    T.field('Umur (tahun)', umur),
  ));
  root.appendChild(T.field('Jenis kelamin', gender));
  root.appendChild(T.btn('Hitung', hitung, true));
  root.appendChild(box);
  hitung();
}
