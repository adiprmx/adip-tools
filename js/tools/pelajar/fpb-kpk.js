import { h as T, utils } from '../../core.js?v=6.10.0';

export const meta = {"id": "fpb-kpk", "name": "FPB & KPK", "cat": "pelajar", "icon": "➗", "desc": "Cari FPB dan KPK dari 2–3 bilangan, lengkap dengan pohon faktor dan langkah pengerjaannya.", "keywords": "fpb,kpk,faktorisasi,pohon faktor,matematika,sd,smp,pr"};

const gcd2 = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) { const t = b; b = a % b; a = t; } return a; };
const lcm2 = (a, b) => Math.abs(a * b) / gcd2(a, b);

function faktorPrima(n) {
  const hasil = [];
  let sisa = n, p = 2;
  while (p * p <= sisa) {
    while (sisa % p === 0) { hasil.push(p); sisa /= p; }
    p += p === 2 ? 1 : 2;
  }
  if (sisa > 1) hasil.push(sisa);
  return hasil;
}

function kelompokFaktor(faktor) {
  const m = {};
  faktor.forEach((f) => { m[f] = (m[f] || 0) + 1; });
  return Object.keys(m).map(Number).sort((a, b) => a - b).map((p) => ({ p, n: m[p] }));
}

const pangkat = (kel) => kel.map((k) => k.n > 1 ? k.p + '<sup>' + k.n + '</sup>' : String(k.p)).join(' × ');

function pohonFaktor(n) {
  const baris = [];
  let sisa = n;
  const faktor = faktorPrima(n);
  if (faktor.length <= 1) return [String(n) + ' adalah bilangan prima.'];
  let indent = 0;
  for (let i = 0; i < faktor.length - 1; i++) {
    const p = faktor[i];
    const bagi = sisa / p;
    baris.push(' '.repeat(indent) + sisa + ' = ' + p + ' × ' + bagi);
    sisa = bagi;
    indent += 2;
  }
  return baris;
}

export function render(root) {

    const aI = T.input('number', 'Bilangan 1', '');
    const bI = T.input('number', 'Bilangan 2', '');
    const cI = T.input('number', 'Bilangan 3 (boleh kosong)', '');
    const box = T.out();

    const hitung = () => {
      const nums = [aI, bI, cI].map((el) => Math.round(T.num(el.value) || 0)).filter((n) => n > 0);
      if (nums.length < 2) {
        T.show(box, '<p class="dim">Isi minimal 2 bilangan bulat positif (maks 1.000.000).</p>');
        return;
      }
      if (nums.some((n) => n > 1000000)) {
        T.show(box, '<p>⚠️ Bilangan terlalu besar — pakai bilangan sampai 1.000.000 saja.</p>');
        return;
      }
      const fpb = nums.reduce(gcd2);
      const kpk = nums.reduce(lcm2);

      const kel = nums.map((n) => kelompokFaktor(faktorPrima(n)));
      // FPB: pangkat terkecil dari faktor yang sama di semua bilangan
      const semuaP = [...new Set(kel.flat().map((k) => k.p))];
      const fpbKel = [];
      semuaP.forEach((p) => {
        const ns = kel.map((k) => { const f = k.find((x) => x.p === p); return f ? f.n : 0; });
        if (ns.every((n) => n > 0)) fpbKel.push({ p, n: Math.min(...ns) });
      });
      const kpkKel = semuaP.map((p) => {
        const ns = kel.map((k) => { const f = k.find((x) => x.p === p); return f ? f.n : 0; });
        return { p, n: Math.max(...ns) };
      }).filter((k) => k.n > 0);

      let h = '<div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:8px">' +
        '<div style="flex:1;min-width:140px;padding:14px;border-radius:12px;border:1px solid rgba(255,255,255,.15);text-align:center"><div class="dim">FPB dari ' + nums.join(', ') + '</div><div style="font-size:28px;font-weight:700">' + fpb + '</div></div>' +
        '<div style="flex:1;min-width:140px;padding:14px;border-radius:12px;border:1px solid rgba(255,255,255,.15);text-align:center"><div class="dim">KPK dari ' + nums.join(', ') + '</div><div style="font-size:28px;font-weight:700">' + kpk + '</div></div></div>';

      h += '<p style="margin-top:12px"><b>Langkah 1 — Faktorisasi prima (pohon faktor)</b></p>';
      nums.forEach((n) => {
        h += '<div style="margin-bottom:10px"><b>' + n + ' = ' + pangkat(kelompokFaktor(faktorPrima(n))) + '</b>' +
          '<pre style="margin:6px 0 0;font-size:13px;line-height:1.6;white-space:pre-wrap">' + pohonFaktor(n).join('\n') + '</pre></div>';
      });

      h += '<p><b>Langkah 2 — FPB</b><br/>Ambil faktor yang sama di semua bilangan, pangkat paling kecil: ' +
        (fpbKel.length ? pangkat(fpbKel) + ' = <b>' + fpb + '</b>' : 'tidak ada faktor yang sama, jadi FPB = <b>1</b>') + '</p>';
      h += '<p><b>Langkah 3 — KPK</b><br/>Ambil semua faktor, pangkat paling besar: ' +
        pangkat(kpkKel) + ' = <b>' + kpk + '</b></p>';
      h += '<p class="hint">Cara cepat (2 bilangan): FPB dicari dengan algoritma Euclid (bagi terus sampai sisa 0), lalu KPK = a × b ÷ FPB.</p>';
      T.show(box, h);
    };

    [aI, bI, cI].forEach((el) => el.addEventListener('input', hitung));

    root.appendChild(T.el('<p class="note">Masukkan 2 atau 3 bilangan — FPB (faktor persekutuan terbesar) dan KPK (kelipatan persekutuan terkecil) langsung muncul beserta langkah pengerjaannya.</p>'));
    root.appendChild(T.grid2(T.field('Bilangan pertama', aI), T.field('Bilangan kedua', bI), T.field('Bilangan ketiga (boleh kosong)', cI)));
    root.appendChild(box);
    hitung();

}
