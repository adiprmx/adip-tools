import { h as T } from '../../core.js';

export const meta = { id: 'kalkulator-hukum-ohm', name: 'Kalkulator Hukum Ohm', cat: 'sains', icon: '⚡', desc: 'Cari volt, ampere, ohm, atau watt dari dua yang sudah diketahui. Rumus segitiga Ohm, lengkap dengan langkahnya.', keywords: 'hukum ohm,volt,ampere,ohm,watt,tegangan,arus,hambatan,daya,listrik', since: '6.17.0' };

// Selesaikan dua nilai yang diketahui -> keempat nilai.
// input: { V, I, R, P } dengan tepat dua terisi (angka > 0).
// Kembalikan { V, I, R, P } atau null bila kombinasi tidak valid.
export function selesaikanOhm(input) {
  const k = Object.keys(input).filter((x) => typeof input[x] === 'number' && isFinite(input[x]) && input[x] > 0);
  if (k.length !== 2) return null;
  const { V, I, R, P } = input;
  let v = V, i = I, r = R, p = P;
  if (V != null && I != null) { r = V / I; p = V * I; }
  else if (V != null && R != null) { i = V / R; p = V * V / R; }
  else if (V != null && P != null) { i = P / V; r = V * V / P; }
  else if (I != null && R != null) { v = I * R; p = I * I * R; }
  else if (I != null && P != null) { v = P / I; r = P / (I * I); }
  else if (R != null && P != null) { i = Math.sqrt(P / R); v = Math.sqrt(P * R); }
  if (![v, i, r, p].every((x) => isFinite(x) && x > 0)) return null;
  return { V: v, I: i, R: r, P: p };
}

function fmtNum(v) {
  if (!isFinite(v)) return 'di luar jangkauan';
  const abs = Math.abs(v);
  const des = abs >= 1000 ? 2 : abs >= 1 ? 3 : 4;
  const r = Math.round(v * Math.pow(10, des)) / Math.pow(10, des);
  return String(r).replace('.', ',');
}

export function render(root) {
  root.appendChild(T.el('<p class="hint">Isi dua nilai yang kamu tahu, dua sisanya ketahuan. Rumusnya: volt = ampere × ohm, dan watt = volt × ampere.</p>'));

  const vI = T.input('number', 'Volt (V)');
  const iI = T.input('number', 'Ampere (A)');
  const rI = T.input('number', 'Ohm (Ω)');
  const pI = T.input('number', 'Watt (W)');
  const box = T.out();

  function segitiga() {
    // Segitiga Ohm: V di atas, I dan R di bawah.
    return '<svg viewBox="0 0 200 170" style="width:100%;max-width:220px;height:auto;display:block;margin:12px auto" role="img" aria-label="Segitiga Ohm: volt di atas, ampere dan ohm di bawah">' +
      '<polygon points="100,8 190,150 10,150" fill="#1e1a17" stroke="#ff6f61" stroke-width="2" />' +
      '<line x1="55" y1="82" x2="145" y2="82" stroke="#ff6f61" stroke-width="2" />' +
      '<line x1="100" y1="82" x2="100" y2="150" stroke="#ff6f61" stroke-width="2" />' +
      '<text x="100" y="62" fill="#e8ded0" font-size="26" font-weight="700" text-anchor="middle">V</text>' +
      '<text x="70" y="132" fill="#e8ded0" font-size="26" font-weight="700" text-anchor="middle">I</text>' +
      '<text x="130" y="132" fill="#e8ded0" font-size="26" font-weight="700" text-anchor="middle">R</text>' +
      '</svg>' +
      '<p class="hint" style="text-align:center">Tutup nilai yang dicari: V = I × R, I = V ÷ R, R = V ÷ I.</p>';
  }

  function hitung() {
    const input = {};
    const v = T.num(vI.value), i = T.num(iI.value), r = T.num(rI.value), p = T.num(pI.value);
    if (isFinite(v) && v !== 0) input.V = v;
    if (isFinite(i) && i !== 0) input.I = i;
    if (isFinite(r) && r !== 0) input.R = r;
    if (isFinite(p) && p !== 0) input.P = p;
    const terisi = Object.keys(input).length;
    if (terisi < 2) { T.toast('Isi dua nilai dulu, ya'); return; }
    if (terisi > 2) { T.toast('Isi tepat dua nilai saja. Kosongkan dua sisanya.'); return; }
    if (Object.values(input).some((x) => x <= 0)) { T.toast('Nilainya harus lebih dari 0'); return; }
    const h = selesaikanOhm(input);
    if (!h) { T.toast('Kombinasi ini tidak bisa dihitung. Cek lagi angkanya.'); return; }
    T.show(box,
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:8px 0">' +
      '<div class="kv"><span class="k">Tegangan</span><span class="v">' + fmtNum(h.V) + ' V</span></div>' +
      '<div class="kv"><span class="k">Arus</span><span class="v">' + fmtNum(h.I) + ' A</span></div>' +
      '<div class="kv"><span class="k">Hambatan</span><span class="v">' + fmtNum(h.R) + ' Ω</span></div>' +
      '<div class="kv"><span class="k">Daya</span><span class="v">' + fmtNum(h.P) + ' W</span></div>' +
      '</div>' +
      '<p class="hint">Cek silang: ' + fmtNum(h.V) + ' V ÷ ' + fmtNum(h.R) + ' Ω = ' + fmtNum(h.V / h.R) + ' A. Pas dengan arus di atas.</p>' +
      segitiga());
  }

  root.append(
    T.grid2(T.field('Tegangan (volt)', vI), T.field('Arus (ampere)', iI)),
    T.grid2(T.field('Hambatan (ohm)', rI), T.field('Daya (watt)', pI)),
    T.btn('Hitung semuanya', hitung, true),
    box,
  );
}
