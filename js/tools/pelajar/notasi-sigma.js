import { h as T, utils } from '../../core.js';

export const meta = { id: 'notasi-sigma', name: 'Kalkulator Notasi Sigma', cat: 'pelajar', icon: 'Σ', desc: 'Hitung jumlah deret dari notasi sigma: tulis rumusnya, tentukan dari dan sampai berapa, lihat tiap sukunya.', keywords: 'sigma,notasi sigma,deret,jumlah,penjumlahan,summation,matematika', since: '6.19.0' };

const n0 = (v) => (Object.is(v, -0) ? 0 : v);

// Parser ekspresi aman (tanpa eval): angka, variabel n, + - * / ^, kurung,
// perkalian tersirat (2n, 2(n+1)), dan fungsi sqrt/abs.
// Urutan: jumlah/kurang < kali/bagi < pangkat (asosiatif kanan) < unary minus.
function tokenize(s) {
  const token = [];
  let i = 0;
  const str = String(s || '').replace(/,/g, '.').replace(/\s+/g, '').toLowerCase();
  while (i < str.length) {
    const c = str[i];
    if ((c >= '0' && c <= '9') || c === '.') {
      let j = i;
      while (j < str.length && ((str[j] >= '0' && str[j] <= '9') || str[j] === '.')) j++;
      const angka = Number(str.slice(i, j));
      if (!Number.isFinite(angka)) throw new Error('Angka tidak benar.');
      token.push({ t: 'angka', v: angka });
      i = j;
    } else if (c === 'n') {
      token.push({ t: 'n' }); i++;
    } else if ('+-*/^()'.includes(c)) {
      token.push({ t: c }); i++;
    } else if (str.startsWith('sqrt', i)) {
      token.push({ t: 'fn', v: 'sqrt' }); i += 4;
    } else if (str.startsWith('abs', i)) {
      token.push({ t: 'fn', v: 'abs' }); i += 3;
    } else {
      throw new Error('Karakter tidak dikenal: ' + c);
    }
  }
  return token;
}

// Sisipkan * tersirat: angka/n/) diikuti n/angka/fn/(.
function sisipKali(token) {
  const hasil = [];
  const akhirNilai = (x) => x.t === 'angka' || x.t === 'n' || x.t === ')';
  const awalNilai = (x) => x.t === 'angka' || x.t === 'n' || x.t === 'fn' || x.t === '(';
  for (let i = 0; i < token.length; i++) {
    if (i > 0 && akhirNilai(token[i - 1]) && awalNilai(token[i])) hasil.push({ t: '*' });
    hasil.push(token[i]);
  }
  return hasil;
}

export function buatFungsi(ekspresi) {
  const token = sisipKali(tokenize(ekspresi));
  let pos = 0;
  const lihat = () => token[pos];
  const makan = (t) => {
    if (lihat() && lihat().t === t) { pos++; return true; }
    return false;
  };
  function parseExpr() {
    let kiri = parseTerm();
    for (;;) {
      if (makan('+')) { const k = parseTerm(); const l = kiri; kiri = (n) => l(n) + k(n); }
      else if (makan('-')) { const k = parseTerm(); const l = kiri; kiri = (n) => l(n) - k(n); }
      else return kiri;
    }
  }
  function parseTerm() {
    let kiri = parseUnary();
    for (;;) {
      if (makan('*')) { const k = parseUnary(); const l = kiri; kiri = (n) => l(n) * k(n); }
      else if (makan('/')) { const k = parseUnary(); const l = kiri; kiri = (n) => l(n) / k(n); }
      else return kiri;
    }
  }
  function parseUnary() {
    if (makan('-')) { const k = parseUnary(); return (n) => -k(n); }
    if (makan('+')) return parseUnary();
    return parsePangkat();
  }
  function parsePangkat() {
    const dasar = parsePrimer();
    if (makan('^')) {
      const pangkat = parseUnary();
      return (n) => Math.pow(dasar(n), pangkat(n));
    }
    return dasar;
  }
  function parsePrimer() {
    const tk = lihat();
    if (!tk) throw new Error('Rumusnya belum lengkap.');
    if (tk.t === 'angka') { pos++; return () => tk.v; }
    if (tk.t === 'n') { pos++; return (n) => n; }
    if (tk.t === 'fn') {
      pos++;
      if (!makan('(')) throw new Error('Fungsi ' + tk.v + ' butuh kurung buka.');
      const isi = parseExpr();
      if (!makan(')')) throw new Error('Kurung tutupnya kurang.');
      return tk.v === 'sqrt' ? (n) => Math.sqrt(isi(n)) : (n) => Math.abs(isi(n));
    }
    if (makan('(')) {
      const isi = parseExpr();
      if (!makan(')')) throw new Error('Kurung tutupnya kurang.');
      return isi;
    }
    throw new Error('Tidak bisa dibaca di dekat: ' + tk.t);
  }
  const fn = parseExpr();
  if (pos < token.length) throw new Error('Sisa rumus yang tidak bisa dibaca.');
  return fn;
}

// Jumlahkan f(n) dari a sampai b (maks 1000 suku).
export function hitungSigma(ekspresi, a, b) {
  if (!Number.isInteger(a) || !Number.isInteger(b) || b < a || b - a > 999) return null;
  let fn;
  try { fn = buatFungsi(ekspresi); } catch (e) { return { error: e.message }; }
  const suku = [];
  let jumlah = 0;
  for (let n = a; n <= b; n++) {
    const v = fn(n);
    if (!Number.isFinite(v)) return { error: 'Hasilnya tidak terhingga di n = ' + n + '. Coba rumus atau rentang lain.' };
    suku.push(n0(v));
    jumlah += v;
  }
  return { suku, jumlah: n0(jumlah) };
}

const f = (x) => utils.fmtDes(x, 4);

export function render(root) {
  root.appendChild(T.el('<p class="hint">Notasi sigma (Σ) artinya menjumlahkan rumus untuk tiap n dari batas bawah sampai batas atas. Contoh: Σ(2n + 1) dari n = 1 sampai 4 = 3 + 5 + 7 + 9 = 24. Tulis rumusnya pakai n, misal 2n+1 atau n^2.</p>'));

  const rumusI = T.input('text', 'cth: 2n+1', '2n+1');
  const aI = T.input('number', 'cth: 1', '1');
  const bI = T.input('number', 'cth: 4', '4');
  const box = T.out();

  function hitung() {
    const a = T.num(aI.value), b = T.num(bI.value);
    if (!Number.isInteger(a) || !Number.isInteger(b) || b < a || b - a > 999) {
      T.show(box, '<p class="dim">Isi batas bawah dan batas atas (bilangan bulat, selisih maksimal 1000).</p>');
      return;
    }
    const hasil = hitungSigma(rumusI.value, a, b);
    if (!hasil || hasil.error) {
      T.show(box, '<p>' + (hasil && hasil.error ? T.esc(hasil.error) : 'Rumusnya tidak bisa dibaca. Pakai n, angka, + - * / ^, dan kurung.') + '</p>');
      return;
    }
    const sukuTampil = hasil.suku.slice(0, 50).map(f).join(' + ') + (hasil.suku.length > 50 ? ' + … (' + T.fmt(hasil.suku.length) + ' suku)' : '');
    T.show(box,
      '<p class="big">Σ = ' + f(hasil.jumlah) + '</p>' +
      '<p style="word-break:break-all;line-height:1.9">' + sukuTampil + ' = <b>' + f(hasil.jumlah) + '</b></p>' +
      '<p class="hint">n berjalan dari ' + T.fmt(a) + ' sampai ' + T.fmt(b) + ' (' + T.fmt(hasil.suku.length) + ' suku), tiap n dimasukkan ke rumus ' + T.esc(rumusI.value) + ' lalu dijumlahkan.</p>');
  }

  root.append(
    T.field('Rumus (pakai n)', rumusI, 'Boleh pakai + - * / ^, kurung, sqrt, abs. Contoh: n^2, 3n-2, 1/n.'),
    T.grid2(T.field('n mulai dari', aI), T.field('n sampai', bI)),
    T.btn('Hitung', hitung, true),
    box,
  );
  hitung();
}
