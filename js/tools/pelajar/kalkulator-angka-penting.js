import { h as T } from '../../core.js';

export const meta = { id: 'kalkulator-angka-penting', name: 'Kalkulator Angka Penting', cat: 'pelajar', icon: '🔢', desc: 'Hitung angka penting, bulatkan ke jumlah angka penting yang benar, dan hitung tambah kurang kali bagi mengikuti aturannya.', keywords: 'angka penting,significant figures,sig fig,pembulatan,presisi,matematika,fisika', since: '6.18.0' };

// ---- Aturan angka penting ----
// Nol di depan (0,0045) bukan angka penting. Nol di tengah dan nol di belakang
// koma (1,20) termasuk angka penting. Nol di belakang bilangan bulat tanpa koma
// (1200) dianggap bukan angka penting.

// Hitung jumlah angka penting dari teks angka (terima koma desimal dan notasi e).
export function hitungAngkaPenting(teks) {
  let s = String(teks == null ? '' : teks).trim().replace(/\s/g, '').replace(',', '.');
  if (!/^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(s)) return null;
  s = s.replace(/^[+-]/, '');
  const mantissa = s.split(/[eE]/)[0];
  const tanpaTitik = mantissa.replace('.', '');
  // Buang nol di depan, lalu hitung digit sisanya. Bila tidak ada koma dan
  // angkanya bulat, nol di belakang tidak dihitung.
  const mulai = tanpaTitik.search(/[1-9]/);
  if (mulai === -1) return 1; // angka 0 (atau 0,00) dihitung 1 angka penting
  let digit = tanpaTitik.slice(mulai);
  if (!mantissa.includes('.')) digit = digit.replace(/0+$/, '') || '0';
  return digit.length;
}

// Jumlah tempat desimal dari teks angka (untuk aturan tambah/kurang).
export function hitungDesimal(teks) {
  let s = String(teks == null ? '' : teks).trim().replace(/\s/g, '').replace(',', '.');
  if (!/^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(s)) return null;
  const mantissa = s.replace(/^[+-]/, '').split(/[eE]/)[0];
  const i = mantissa.indexOf('.');
  return i === -1 ? 0 : mantissa.length - i - 1;
}

// Bulatkan angka ke jumlah angka penting tertentu, kembalikan sebagai teks
// (memakai toPrecision agar nol di belakang yang penting tetap tampil).
export function bulatkanAngkaPenting(nilai, sig) {
  const n = Number(nilai);
  const s = Math.floor(Number(sig));
  if (!isFinite(n) || s < 1 || s > 15) return null;
  if (n === 0) return sig === 1 ? '0' : '0,' + '0'.repeat(sig - 1);
  let t = n.toPrecision(s);
  // toPrecision memberi notasi e untuk angka sangat besar/kecil; biarkan apa adanya.
  if (t.includes('e')) return t.replace('.', ',');
  return t.replace('.', ',');
}

// Operasi dua angka mengikuti aturan angka penting.
// Tambah/kurang: hasil dibulatkan ke tempat desimal paling sedikit.
// Kali/bagi: hasil dibulatkan ke jumlah angka penting paling sedikit.
export function operasiAngkaPenting(aTeks, bTeks, op) {
  const a = T.num(aTeks), b = T.num(bTeks);
  if (!isFinite(a) || !isFinite(b)) return null;
  if (op === 'tambah' || op === 'kurang') {
    const da = hitungDesimal(aTeks), db = hitungDesimal(bTeks);
    if (da == null || db == null) return null;
    const d = Math.min(da, db);
    const hasil = op === 'tambah' ? a + b : a - b;
    const f = Math.pow(10, d);
    return { hasil: Math.round(hasil * f) / f, desimal: d, aturan: 'tempat desimal' };
  }
  const sa = hitungAngkaPenting(aTeks), sb = hitungAngkaPenting(bTeks);
  if (sa == null || sb == null) return null;
  const s = Math.min(sa, sb);
  if (op === 'bagi' && b === 0) return null;
  const hasil = op === 'kali' ? a * b : a / b;
  return { hasil: Number(hasil.toPrecision(s)), sig: s, aturan: 'angka penting' };
}

export function render(root) {
  root.appendChild(T.el('<p class="hint">Angka penting itu digit yang benar-benar membawa informasi soal ketelitian. Nol di depan koma tidak dihitung, nol di belakang koma dihitung.</p>'));

  const mode = T.select([
    ['bulatkan', 'Bulatkan satu angka'],
    ['tambah', 'Tambah (+)'],
    ['kurang', 'Kurang (−)'],
    ['kali', 'Kali (×)'],
    ['bagi', 'Bagi (÷)'],
  ], 'bulatkan');
  const aI = T.input('text', 'cth: 12,345', '12,345'); aI.inputMode = 'decimal';
  const bI = T.input('text', 'cth: 1,2', '1.2'); bI.inputMode = 'decimal';
  const sigI = T.input('number', 'cth: 3', '3');
  const box = T.out();

  const wrapB = T.el('<div></div>');
  wrapB.appendChild(T.field('Angka kedua', bI));
  const wrapSig = T.el('<div></div>');
  wrapSig.appendChild(T.field('Bulatkan ke berapa angka penting', sigI, 'Antara 1 sampai 15.'));

  function aturTampil() {
    const m = mode.value;
    wrapB.hidden = m === 'bulatkan';
    wrapSig.hidden = m !== 'bulatkan';
  }
  mode.addEventListener('change', aturTampil);
  aturTampil();

  function hitung() {
    if (mode.value === 'bulatkan') {
      const sig = T.num(sigI.value);
      const n = T.num(aI.value);
      const jumlah = hitungAngkaPenting(aI.value);
      if (jumlah == null || !isFinite(n)) { T.toast('Isi angkanya dulu dengan angka yang benar'); return; }
      if (!Number.isInteger(sig) || sig < 1 || sig > 15) { T.toast('Jumlah angka pentingnya 1 sampai 15'); return; }
      const hasil = bulatkanAngkaPenting(n, sig);
      T.show(box,
        '<p class="big">' + T.esc(hasil) + '</p>' +
        '<p>Angka ' + T.esc(aI.value.trim()) + ' punya ' + jumlah + ' angka penting. Dibulatkan ke ' + sig + ' angka penting jadi ' + T.esc(hasil) + '.</p>' +
        '<p class="hint">Notasi ilmiah: ' + T.esc(n.toExponential(sig - 1).replace('.', ',')) + '.</p>');
      return;
    }
    const r = operasiAngkaPenting(aI.value, bI.value, mode.value);
    if (!r) { T.toast('Isi kedua angkanya dulu dengan angka yang benar'); return; }
    const simbol = { tambah: '+', kurang: '−', kali: '×', bagi: '÷' }[mode.value];
    const teksHasil = r.aturan === 'tempat desimal'
      ? String(r.hasil).replace('.', ',')
      : bulatkanAngkaPenting(r.hasil, r.sig);
    const aturan = r.aturan === 'tempat desimal'
      ? 'Tambah dan kurang mengikuti tempat desimal paling sedikit (' + r.desimal + ' tempat desimal).'
      : 'Kali dan bagi mengikuti jumlah angka penting paling sedikit (' + r.sig + ' angka penting).';
    T.show(box,
      '<p class="big">' + T.esc(aI.value.trim()) + ' ' + simbol + ' ' + T.esc(bI.value.trim()) + ' = ' + T.esc(teksHasil) + '</p>' +
      '<p class="hint">' + aturan + '</p>');
  }

  root.append(
    T.field('Yang mau dihitung', mode),
    T.field('Angka', aI),
    wrapB,
    wrapSig,
    T.btn('Hitung', hitung, true),
    box,
  );
}
