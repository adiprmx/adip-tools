import { h as T, tabs } from '../../core.js?v=6.7.0';

export const meta = {"id":"kalkulator-logaritma","name":"Kalkulator Logaritma","cat":"pelajar","icon":"📊","desc":"Hitung log basis bebas + bedah sifat perkalian, pembagian, dan pangkat.","keywords":"logaritma,log,ln,matematika,basis,sifat logaritma,pelajar"};

function r6(v) {
  const r = Math.round(v * 1e6) / 1e6;
  return String(Object.is(r, -0) ? 0 : r);
}
const logB = (x, b) => Math.log(x) / Math.log(b);
const cekBasis = (b) => {
  if (isNaN(b)) return 'Isi basisnya dulu.';
  if (!(b > 0) || b === 1) return 'Basis harus lebih dari 0 dan tidak boleh 1.';
  return null;
};

export function render(root) {
  const p1 = T.el('<div></div>');
  const p2 = T.el('<div></div>');

  // ---- Panel 1: kalkulator utama ----
  const out1 = T.out();
  const xInp = T.input('number', 'mis. 100', '');
  const bInp = T.input('number', 'mis. 10', '10');
  const hitung1 = () => {
    const x = T.num(xInp.value), b = T.num(bInp.value);
    if (isNaN(x) || isNaN(b)) { T.show(out1, '<p class="err">Isi nilai x dan basisnya dulu.</p>'); return; }
    if (!(x > 0)) { T.show(out1, '<p class="err">Nilai x harus lebih dari 0 — logaritma nggak kenal angka nol atau negatif.</p>'); return; }
    const eb = cekBasis(b);
    if (eb) { T.show(out1, '<p class="err">' + eb + '</p>'); return; }
    const hasil = logB(x, b);
    T.show(out1,
      '<div class="center"><div class="dim">log<sub>' + r6(b) + '</sub>(' + r6(x) + ')</div>' +
      '<div class="big">' + r6(hasil) + '</div>' +
      '<p class="hint">Artinya ' + r6(b) + '<sup>' + r6(hasil) + '</sup> = ' + r6(x) + '</p></div>');
  };
  const setBasis = (b) => { bInp.value = String(b); hitung1(); };
  p1.appendChild(T.el('<p class="hint">Logaritma itu kebalikan dari pangkat: log<sub>a</sub>(x) nanya &ldquo;a pangkat berapa biar jadi x?&rdquo;</p>'));
  p1.appendChild(T.grid2(
    T.field('Nilai x', xInp, 'harus lebih dari 0'),
    T.field('Basis a', bInp, 'harus > 0 dan ≠ 1')
  ));
  p1.appendChild(T.row(
    T.btn('Hitung', hitung1, true),
    T.btn('log (basis 10)', () => setBasis(10)),
    T.btn('ln (basis e)', () => setBasis(Math.E))
  ));
  p1.appendChild(out1);

  // ---- Panel 2: sifat-sifat ----
  const mkSifat = (judul, rumus, defs, fn) => {
    const wrap = T.el('<div style="margin-bottom:20px"></div>');
    const out = T.out();
    const inps = defs.map((d) => T.input('number', d[1], ''));
    const go = () => {
      const vs = inps.map((i) => T.num(i.value));
      if (vs.some(isNaN)) { T.show(out, '<p class="err">Isi semua kotaknya dulu.</p>'); return; }
      const res = fn(vs);
      if (res.err) { T.show(out, '<p class="err">' + res.err + '</p>'); return; }
      T.show(out,
        '<p class="dim" style="margin:0 0 6px">' + res.rumus + '</p>' +
        '<div class="big">' + res.hasil + '</div>');
    };
    wrap.appendChild(T.el('<p style="font-size:14px;margin:0 0 2px"><b>' + judul + '</b></p>'));
    wrap.appendChild(T.el('<p class="dim" style="margin:0 0 8px">' + rumus + '</p>'));
    const grid = T.el('<div></div>');
    defs.forEach((d, i) => grid.appendChild(T.field(d[0], inps[i])));
    wrap.appendChild(grid);
    wrap.appendChild(T.row(T.btn('Hitung', go, true)));
    wrap.appendChild(out);
    return wrap;
  };

  const sub = (b) => '<sub>' + r6(b) + '</sub>';

  p2.appendChild(mkSifat(
    'Perkalian',
    'log<sub>a</sub>(m &times; n) = log<sub>a</sub>(m) + log<sub>a</sub>(n)',
    [['m', 'mis. 8'], ['n', 'mis. 4'], ['basis a', 'mis. 2']],
    (vs) => {
      const m = vs[0], n = vs[1], b = vs[2];
      if (!(m > 0) || !(n > 0)) return { err: 'm dan n harus lebih dari 0.' };
      const eb = cekBasis(b); if (eb) return { err: eb };
      const lm = logB(m, b), ln = logB(n, b);
      return {
        rumus: 'log' + sub(b) + '(' + r6(m) + ' &times; ' + r6(n) + ') = log' + sub(b) + '(' + r6(m) + ') + log' + sub(b) + '(' + r6(n) + ') = ' + r6(lm) + ' + ' + r6(ln),
        hasil: r6(lm + ln),
      };
    }
  ));
  p2.appendChild(mkSifat(
    'Pembagian',
    'log<sub>a</sub>(m / n) = log<sub>a</sub>(m) &minus; log<sub>a</sub>(n)',
    [['m', 'mis. 8'], ['n', 'mis. 4'], ['basis a', 'mis. 2']],
    (vs) => {
      const m = vs[0], n = vs[1], b = vs[2];
      if (!(m > 0) || !(n > 0)) return { err: 'm dan n harus lebih dari 0.' };
      const eb = cekBasis(b); if (eb) return { err: eb };
      const lm = logB(m, b), ln = logB(n, b);
      return {
        rumus: 'log' + sub(b) + '(' + r6(m) + ' / ' + r6(n) + ') = log' + sub(b) + '(' + r6(m) + ') &minus; log' + sub(b) + '(' + r6(n) + ') = ' + r6(lm) + ' &minus; ' + r6(ln),
        hasil: r6(lm - ln),
      };
    }
  ));
  p2.appendChild(mkSifat(
    'Pangkat',
    'log<sub>a</sub>(m<sup>n</sup>) = n &times; log<sub>a</sub>(m)',
    [['m', 'mis. 8'], ['pangkat n', 'mis. 3'], ['basis a', 'mis. 2']],
    (vs) => {
      const m = vs[0], n = vs[1], b = vs[2];
      if (!(m > 0)) return { err: 'm harus lebih dari 0.' };
      const eb = cekBasis(b); if (eb) return { err: eb };
      const lm = logB(m, b);
      return {
        rumus: 'log' + sub(b) + '(' + r6(m) + '<sup>' + r6(n) + '</sup>) = ' + r6(n) + ' &times; log' + sub(b) + '(' + r6(m) + ') = ' + r6(n) + ' &times; ' + r6(lm),
        hasil: r6(n * lm),
      };
    }
  ));

  root.appendChild(tabs([['Kalkulator', 0], ['Sifat-sifat', 1]], [p1, p2]));
  root.appendChild(p1);
  root.appendChild(p2);
}
