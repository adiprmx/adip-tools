import { h as T, utils } from '../../core.js?v=6.7.0';

export const meta = {"id":"bangun-datar","name":"Rumus Bangun Datar & Ruang","cat":"pelajar","icon":"📐","desc":"Hitung luas, keliling & volume lengkap dengan rumusnya.","keywords":"bangun datar,bangun ruang,luas,keliling,volume,rumus,matematika,geometri,persegi,lingkaran,kubus"};

const PI = Math.PI;
const r2 = (x) => Math.round(x * 100) / 100;
// Format angka ala Indonesia: 78.54 -> "78,54"
const fn = (x) => T.fmt(r2(x));
// Tampilkan langkah: "L = π × r² = 3,1416 × 7² = 153,94"
function langkah(rumus, subs, hasil) {
  return '<div style="margin-bottom:8px"><div class="mut" style="font-size:12px">' + rumus + '</div>' +
    '<div style="font-size:13.5px">' + subs + ' = <b>' + fn(hasil) + '</b></div></div>';
}

const SHAPES = [
  {
    id: 'persegi', name: 'Persegi',
    fields: [['s', 'Sisi (s)']],
    calc: (v) => {
      const s = v.s;
      return [
        ['Luas', langkah('L = s × s', 'L = ' + fn(s) + ' × ' + fn(s), s * s)],
        ['Keliling', langkah('K = 4 × s', 'K = 4 × ' + fn(s), 4 * s)],
      ];
    },
  },
  {
    id: 'ppanjang', name: 'Persegi Panjang',
    fields: [['p', 'Panjang (p)'], ['l', 'Lebar (l)']],
    calc: (v) => {
      const p = v.p, l = v.l;
      return [
        ['Luas', langkah('L = p × l', 'L = ' + fn(p) + ' × ' + fn(l), p * l)],
        ['Keliling', langkah('K = 2 × (p + l)', 'K = 2 × (' + fn(p) + ' + ' + fn(l) + ')', 2 * (p + l))],
      ];
    },
  },
  {
    id: 'segitiga', name: 'Segitiga',
    fields: [['a', 'Alas (a) — untuk luas'], ['t', 'Tinggi (t) — untuk luas'], ['s1', 'Sisi 1 — untuk keliling'], ['s2', 'Sisi 2 — untuk keliling'], ['s3', 'Sisi 3 — untuk keliling']],
    calc: (v) => {
      const out = [];
      if (v.a > 0 && v.t > 0) out.push(['Luas', langkah('L = ½ × a × t', 'L = ½ × ' + fn(v.a) + ' × ' + fn(v.t), 0.5 * v.a * v.t)]);
      if (v.s1 > 0 && v.s2 > 0 && v.s3 > 0) out.push(['Keliling', langkah('K = s₁ + s₂ + s₃', 'K = ' + fn(v.s1) + ' + ' + fn(v.s2) + ' + ' + fn(v.s3), v.s1 + v.s2 + v.s3)]);
      return out;
    },
  },
  {
    id: 'lingkaran', name: 'Lingkaran',
    fields: [['r', 'Jari-jari (r)']],
    calc: (v) => {
      const r = v.r;
      return [
        ['Luas', langkah('L = π × r²', 'L = π × ' + fn(r) + '²', PI * r * r)],
        ['Keliling', langkah('K = 2 × π × r', 'K = 2 × π × ' + fn(r), 2 * PI * r)],
      ];
    },
  },
  {
    id: 'kubus', name: 'Kubus',
    fields: [['s', 'Sisi (s)']],
    calc: (v) => {
      const s = v.s;
      return [
        ['Volume', langkah('V = s³', 'V = ' + fn(s) + '³', s * s * s)],
        ['Luas permukaan', langkah('LP = 6 × s²', 'LP = 6 × ' + fn(s) + '²', 6 * s * s)],
      ];
    },
  },
  {
    id: 'balok', name: 'Balok',
    fields: [['p', 'Panjang (p)'], ['l', 'Lebar (l)'], ['t', 'Tinggi (t)']],
    calc: (v) => {
      const p = v.p, l = v.l, t = v.t;
      return [
        ['Volume', langkah('V = p × l × t', 'V = ' + fn(p) + ' × ' + fn(l) + ' × ' + fn(t), p * l * t)],
        ['Luas permukaan', langkah('LP = 2 × (pl + pt + lt)', 'LP = 2 × (' + fn(p * l) + ' + ' + fn(p * t) + ' + ' + fn(l * t) + ')', 2 * (p * l + p * t + l * t))],
      ];
    },
  },
  {
    id: 'tabung', name: 'Tabung',
    fields: [['r', 'Jari-jari (r)'], ['t', 'Tinggi (t)']],
    calc: (v) => {
      const r = v.r, t = v.t;
      return [
        ['Volume', langkah('V = π × r² × t', 'V = π × ' + fn(r) + '² × ' + fn(t), PI * r * r * t)],
        ['Luas permukaan', langkah('LP = 2 × π × r × (r + t)', 'LP = 2 × π × ' + fn(r) + ' × (' + fn(r) + ' + ' + fn(t) + ')', 2 * PI * r * (r + t))],
      ];
    },
  },
  {
    id: 'bola', name: 'Bola',
    fields: [['r', 'Jari-jari (r)']],
    calc: (v) => {
      const r = v.r;
      return [
        ['Volume', langkah('V = ⁴⁄₃ × π × r³', 'V = ⁴⁄₃ × π × ' + fn(r) + '³', (4 / 3) * PI * r * r * r)],
        ['Luas permukaan', langkah('LP = 4 × π × r²', 'LP = 4 × π × ' + fn(r) + '²', 4 * PI * r * r)],
      ];
    },
  },
  {
    id: 'kerucut', name: 'Kerucut',
    fields: [['r', 'Jari-jari (r)'], ['t', 'Tinggi (t)']],
    calc: (v) => {
      const r = v.r, t = v.t;
      const s = Math.sqrt(r * r + t * t); // garis pelukis
      return [
        ['Garis pelukis (s)', langkah('s = √(r² + t²)', 's = √(' + fn(r) + '² + ' + fn(t) + '²)', s)],
        ['Volume', langkah('V = ⅓ × π × r² × t', 'V = ⅓ × π × ' + fn(r) + '² × ' + fn(t), (1 / 3) * PI * r * r * t)],
        ['Luas permukaan', langkah('LP = π × r × (r + s)', 'LP = π × ' + fn(r) + ' × (' + fn(r) + ' + ' + fn(s) + ')', PI * r * (r + s))],
      ];
    },
  },
];

export function render(root) {
  const sel = T.select(SHAPES.map((s) => [s.id, s.name]), 'persegi');
  let shapeId = 'persegi'; // jangan baca sel.value langsung (lebih aman di semua browser)
  const fieldsBox = T.el('<div></div>');
  const out = T.out();

  const drawFields = () => {
    fieldsBox.innerHTML = '';
    const sh = SHAPES.find((s) => s.id === shapeId);
    sh.fields.forEach(([key, label]) => {
      const inp = T.input('number', label);
      inp.dataset.key = key;
      inp.className += ' bd-inp';
      fieldsBox.appendChild(T.field(label, inp));
    });
    T.hide(out);
  };

  const hitung = () => {
    const sh = SHAPES.find((s) => s.id === shapeId);
    const v = {};
    fieldsBox.querySelectorAll('.bd-inp').forEach((i) => { v[i.dataset.key] = T.num(i.value); });
    if (sh.id === 'segitiga') {
      const punyaLuas = v.a > 0 && v.t > 0;
      const punyaKel = v.s1 > 0 && v.s2 > 0 && v.s3 > 0;
      if (!punyaLuas && !punyaKel) {
        T.show(out, '<p class="warn">Isi alas + tinggi (buat luas) atau ketiga sisinya (buat keliling).</p>');
        return;
      }
    } else {
      for (const [key, label] of sh.fields) {
        if (!(v[key] > 0)) { T.show(out, '<p class="warn">Isi "' + T.esc(label) + '" dengan angka lebih dari 0 dulu ya.</p>'); return; }
      }
    }
    const hasil = sh.calc(v);
    if (!hasil.length) { T.show(out, '<p class="warn">Datanya belum cukup buat dihitung.</p>'); return; }
    T.show(out,
      '<div class="h3">' + T.esc(sh.name) + '</div>' +
      hasil.map(([label, html]) => '<div class="h3" style="font-size:13px;margin:10px 0 4px">' + T.esc(label) + '</div>' + html).join('') +
      '<p class="hint">π = ' + PI + '</p>');
  };

  sel.addEventListener('change', () => { shapeId = sel.value; drawFields(); });

  root.appendChild(T.el('<p class="hint">Pilih bangun, isi ukurannya, dapat hasilnya sekalian langkah rumusnya.</p>'));
  root.appendChild(T.field('Bangun', sel));
  root.appendChild(fieldsBox);
  root.appendChild(T.row(T.btn('Hitung', hitung, true)));
  root.appendChild(out);
  drawFields();
}
