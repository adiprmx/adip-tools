import { h as T, utils } from '../../core.js?v=6.4.0';

export const meta = {"id":"kombinasi-permutasi","name":"Kombinasi & Permutasi","cat":"pelajar","icon":"🎲","desc":"Hitung C(n,r) dan P(n,r) lengkap dengan langkah perhitungannya.","keywords":"kombinasi,permutasi,peluang,matematika,c(n,r),p(n,r),faktorial"};

// Hitung C(n,r) dengan rumus perkalian berurutan (aman untuk n besar via BigInt).
function combSteps(n, r) {
  const k = Math.min(r, n - r);
  const terms = [];
  for (let i = 0; i < k; i++) terms.push(BigInt(n - i));
  let num = 1n;
  terms.forEach((t) => { num *= t; });
  let den = 1n;
  for (let i = 2; i <= k; i++) den *= BigInt(i);
  return { k, terms, num, den, val: num / den };
}

// Hitung P(n,r) = n * (n-1) * ... * (n-r+1)
function permSteps(n, r) {
  const terms = [];
  for (let i = 0; i < r; i++) terms.push(BigInt(n - i));
  let val = 1n;
  terms.forEach((t) => { val *= t; });
  return { terms, val };
}

const fmtBig = (b) => {
  const s = b.toString();
  if (s.length <= 24) return T.fmt(Number(b));
  // Angka raksasa: tampilkan ringkas + jumlah digit
  return s.slice(0, 12) + '…' + s.slice(-6) + ' <span class="mut">(' + s.length + ' digit)</span>';
};

function termStr(terms, maxShow) {
  if (terms.length <= maxShow) return terms.map(String).join(' × ');
  return terms.slice(0, 3).map(String).join(' × ') + ' × … × ' + String(terms[terms.length - 1]);
}

export function render(root) {
  const nIn = T.input('number', 'n, mis. 10'); nIn.value = '10';
  const rIn = T.input('number', 'r, mis. 3'); rIn.value = '3';
  const box = T.out();

  const hitung = () => {
    const n = T.num(nIn.value), r = T.num(rIn.value);
    if (!Number.isInteger(n) || !Number.isInteger(r) || n < 0 || r < 0) {
      T.show(box, '<p style="color:#ef4444">n dan r harus bilangan bulat ≥ 0. Coba lagi ya.</p>');
      return;
    }
    if (r > n) {
      T.show(box, '<p style="color:#ef4444">r tidak boleh lebih besar dari n (r ≤ n). Kebalik tuh.</p>');
      return;
    }
    if (n > 1000) {
      T.show(box, '<p style="color:#ef4444">n maksimal 1000 biar HP kamu nggak ngos-ngosan.</p>');
      return;
    }
    const c = combSteps(n, r), p = permSteps(n, r);
    const factStr = (x) => x <= 1 ? '1' : x + '!';
    T.show(box,
      '<div class="big center">C(' + n + ',' + r + ') = ' + fmtBig(c.val) + '</div>' +
      '<div class="big center">P(' + n + ',' + r + ') = ' + fmtBig(p.val) + '</div>' +
      '<p class="hint" style="margin-top:14px"><b>Bedanya apa?</b> Kombinasi = urutan <i>nggak</i> penting ' +
      '(pilih 3 orang dari 10). Permutasi = urutan penting (juara 1, 2, 3 dari 10).</p>' +
      '<p class="hint"><b>Rumus:</b><br>' +
      'C(n,r) = n! ÷ (r! × (n−r)!)<br>' +
      'P(n,r) = n! ÷ (n−r)!</p>' +
      '<p class="hint"><b>Langkah C(' + n + ',' + r + '):</b><br>' +
      '= ' + factStr(n) + ' ÷ (' + factStr(r) + ' × ' + factStr(n - r) + ')<br>' +
      '= (' + termStr(c.terms, 6) + ') ÷ ' + factStr(c.k) + '<br>' +
      '= ' + fmtBig(c.val) + '</p>' +
      '<p class="hint"><b>Langkah P(' + n + ',' + r + '):</b><br>' +
      '= ' + (p.terms.length ? termStr(p.terms, 6) : '1') + '<br>' +
      '= ' + fmtBig(p.val) + '</p>' +
      (n === 0 ? '' : '<p class="hint">💡 Trik: C(n,r) = C(n,n−r). Misal C(10,8) = C(10,2) = 45 — pilih yang kecil biar gampang.</p>')
    );
  };

  root.appendChild(T.el(
    '<p class="hint">Mau tahu ada berapa cara memilih atau menyusun? Masukkan n (total) dan r (yang dipilih).</p>'
  ));
  root.appendChild(T.grid2(T.field('n (total objek)', nIn), T.field('r (yang dipilih)', rIn)));
  root.appendChild(T.row(T.btn('Hitung', hitung, true)));
  root.appendChild(box);
  nIn.addEventListener('keydown', (e) => { if (e.key === 'Enter') hitung(); });
  rIn.addEventListener('keydown', (e) => { if (e.key === 'Enter') hitung(); });
  hitung();
}
