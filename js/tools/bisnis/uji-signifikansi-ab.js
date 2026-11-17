import { h as T, kv } from '../../core.js';

/* Fungsi murni — diekspor supaya bisa diuji dari node tanpa DOM. */

/** CDF distribusi normal standar (aproksimasi Abramowitz–Stegun 7.1.26,
    galat absolut < 1,5e-7 — cukup untuk uji signifikansi). */
export function normalCdf(x) {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989422804014327 * Math.exp(-x * x / 2);
  const p = d * t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  return x > 0 ? 1 - p : p;
}

/** Z-test dua proporsi (pooled, dua sisi) untuk A/B test.
    Mengembalikan { pA, pB, selisih, z, pValue, signifikan, mde }.
    mde = selisih minimum yang terdeteksi pada power 80% (z 1,96 + 0,84). */
export function zTestAB(nA, xA, nB, xB) {
  const pA = xA / nA, pB = xB / nB;
  // pPool anti-overflow (P4-07): nA+nB meluber ke Infinity bila n ~1e308,
  // membuat pPool = 0 dan se = 0. Skalakan dengan n terbesar.
  const nMax = Math.max(nA, nB);
  const pPool = (xA / nMax + xB / nMax) / (nA / nMax + nB / nMax);
  // se anti-underflow (P4-07): akar dari hasil kali mengecil di bawah
  // subnormal minimum (5e-324) -> se = 0 -> guard memaksa z = 0 dan vonis
  // terbalik pada n >= ~1e160. Pisah akarnya: tiap faktor tetap terwakili
  // sehingga hasilnya akurat di seluruh rentang double.
  const se = Math.sqrt(pPool * (1 - pPool)) * Math.sqrt(1 / nA + 1 / nB);
  const z = se === 0 ? 0 : (pB - pA) / se;
  // Jepit ke [0,1] (P4-07): galat aproksimasi normalCdf(0) membuat p =
  // 1,0000000010 > 1 bahkan pada hasil seri biasa.
  const pValue = Math.min(1, Math.max(0, 2 * (1 - normalCdf(Math.abs(z)))));
  return {
    pA, pB,
    selisih: pB - pA,
    z,
    pValue,
    signifikan: pValue < 0.05,
    mde: 2.8 * se,
  };
}

const fmtPersen = (x, d) => (x * 100).toFixed(d == null ? 2 : d).replace('.', ',') + '%';
const fmtP = (p) => p < 0.0001 ? '< 0,0001' : String(p.toFixed(4)).replace('.', ',');
// P4-08: n/x raksasa (1e308 lolos validasi integer) dicetak toLocaleString
// 411 karakter di teks "x dari n" — di atas 1e15 tampilkan notasi singkat
// String(v) ("1e+308"). Nilai n TIDAK dibatasi: z-test-nya sendiri sah
// sampai 1e308 (P4-07), yang dijaga hanya tampilannya.
const fmtHitung = (v) => Math.abs(v) < 1e15 ? v.toLocaleString('id-ID') : String(v);

export const meta = {"id": "uji-signifikansi-ab", "name": "Uji Signifikansi A/B Test", "cat": "bisnis", "icon": "🧪", "desc": "Apakah selisih konversi A vs B nyata atau cuma kebetulan? Z-test dua proporsi.", "keywords": "ab test,signifikansi,z-test,konversi,iklan,landing page,statistik", "since": "6.13.0"};
export function render(root) {

    const nAI = T.input('text', 'cth: 1000', '');
    nAI.inputMode = 'numeric';
    const xAI = T.input('text', 'cth: 100', '');
    xAI.inputMode = 'numeric';
    const nBI = T.input('text', 'cth: 1000', '');
    nBI.inputMode = 'numeric';
    const xBI = T.input('text', 'cth: 130', '');
    xBI.inputMode = 'numeric';
    const box = T.out();

    const hitung = () => {
      const nA = T.num(nAI.value), xA = T.num(xAI.value);
      const nB = T.num(nBI.value), xB = T.num(xBI.value);
      if (![nA, xA, nB, xB].every((v) => Number.isInteger(v)) || nA <= 0 || nB <= 0 || xA < 0 || xB < 0) {
        T.toast('Isi keempat angka dengan bilangan bulat — pengunjung lebih dari 0, konversi 0 atau lebih');
        return;
      }
      if (xA > nA || xB > nB) { T.toast('Konversi tidak boleh lebih banyak dari pengunjung'); return; }
      const r = zTestAB(nA, xA, nB, xB);
      const pemenang = r.selisih > 0 ? 'B' : r.selisih < 0 ? 'A' : 'tidak ada';
      const vonis = r.signifikan
        ? 'Signifikan — selisih ini kemungkinan besar nyata, bukan kebetulan. Varian ' + pemenang + ' lebih baik pada tingkat kepercayaan 95%.'
        : 'Belum signifikan — selisih ini masih bisa jadi kebetulan. Kumpulkan data lebih banyak sebelum memutuskan.';
      const saran = !r.signifikan
        ? '<p class="hint">Supaya selisih sebesar ini bisa terdeteksi dengan yakin, kamu butuh selisih minimal sekitar ' + fmtPersen(r.mde) + ' pada jumlah pengunjung seperti sekarang — atau tambah jumlah pengunjung kedua varian.</p>'
        : '';
      T.show(box,
        '<div class="big center">z = ' + String(r.z.toFixed(2)).replace('.', ',') + '</div>' +
        '<p class="center">p-value ' + fmtP(r.pValue) + ' — ' + (r.signifikan ? 'di bawah 0,05' : 'di atas 0,05') + '</p>' +
        kv('Tingkat konversi A', fmtPersen(r.pA) + ' (' + fmtHitung(xA) + ' dari ' + fmtHitung(nA) + ')') +
        kv('Tingkat konversi B', fmtPersen(r.pB) + ' (' + fmtHitung(xB) + ' dari ' + fmtHitung(nB) + ')') +
        kv('Selisih (B − A)', (r.selisih >= 0 ? '+' : '') + fmtPersen(r.selisih)) +
        kv('Selisih minimum yang terdeteksi', '±' + fmtPersen(r.mde) + ' (pada power 80%)') +
        '<p class="' + (r.signifikan ? 'info' : 'warn') + '">' + vonis + '</p>' +
        saran +
        '<p class="hint">Metode: z-test dua proporsi (pooled), dua sisi, tingkat kepercayaan 95%. ' +
        'Hasil ini hanya sah kalau pengunjung dibagi acak ke A/B dan keduanya jalan di waktu yang sama. ' +
        'Jangan berhenti-cek berulang kali lalu ambil hasil yang kebetulan signifikan — itu membuat vonisnya tidak bisa dipercaya.</p>');
    };

    root.appendChild(T.el('<p class="note">Iklan B dapat konversi lebih banyak dari A — tapi apakah itu beneran lebih bagus, atau cuma hoki? Masukkan angka kedua varian, tool ini yang menilai.</p>'));
    root.appendChild(T.el('<h3 class="h3">Varian A (kontrol)</h3>'));
    root.appendChild(T.grid2(
      T.field('Pengunjung A', nAI, 'Yang melihat varian A.'),
      T.field('Konversi A', xAI, 'Yang melakukan aksi yang ditargetkan.')
    ));
    root.appendChild(T.el('<h3 class="h3">Varian B (baru)</h3>'));
    root.appendChild(T.grid2(
      T.field('Pengunjung B', nBI, 'Yang melihat varian B.'),
      T.field('Konversi B', xBI, 'Yang melakukan aksi yang ditargetkan.')
    ));
    root.appendChild(T.row(T.btn('Uji Signifikansi', hitung, true)));
    root.appendChild(box);

}
