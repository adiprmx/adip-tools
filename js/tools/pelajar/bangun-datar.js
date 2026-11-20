import { h as T, utils } from '../../core.js';

export const meta = {"id":"bangun-datar","name":"Rumus Bangun Datar & Ruang","cat":"pelajar","icon":"📐","desc":"Hitung luas, keliling & volume lengkap dengan rumusnya.","keywords":"bangun datar,bangun ruang,luas,keliling,volume,rumus,matematika,geometri,persegi,lingkaran,kubus,jajar genjang,trapesium,belah ketupat,layang-layang,prisma,limas"};

const PI = Math.PI;
const r2 = (x) => Math.round(x * 100) / 100;
// Format angka ala Indonesia: 78.54 -> "78,54"
const fn = (x) => T.fmt(r2(x));
// Tampilkan langkah: "L = π × r² = 3,1416 × 7² = 153,94"
function langkah(rumus, subs, hasil) {
  return '<div style="margin-bottom:8px"><div class="mut" style="font-size:12px">' + rumus + '</div>' +
    '<div style="font-size:13.5px">' + subs + ' = <b>' + fn(hasil) + '</b></div></div>';
}

export const SHAPES = [
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
    fields: [['a', 'Alas (a), untuk luas'], ['t', 'Tinggi (t), untuk luas'], ['s1', 'Sisi 1, untuk keliling'], ['s2', 'Sisi 2, untuk keliling'], ['s3', 'Sisi 3, untuk keliling']],
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
    id: 'jajargenjang', name: 'Jajar Genjang', parsial: true,
    fields: [['a', 'Alas (a)'], ['t', 'Tinggi (t), untuk luas'], ['b', 'Sisi miring (b), untuk keliling']],
    calc: (v) => {
      const out = [];
      if (v.a > 0 && v.t > 0) out.push(['Luas', langkah('L = a × t', 'L = ' + fn(v.a) + ' × ' + fn(v.t), v.a * v.t)]);
      if (v.a > 0 && v.b > 0) out.push(['Keliling', langkah('K = 2 × (a + b)', 'K = 2 × (' + fn(v.a) + ' + ' + fn(v.b) + ')', 2 * (v.a + v.b))]);
      return out;
    },
  },
  {
    id: 'trapesium', name: 'Trapesium', parsial: true,
    fields: [['a', 'Sisi sejajar atas (a)'], ['b', 'Sisi sejajar bawah (b)'], ['t', 'Tinggi (t), untuk luas'], ['c', 'Sisi miring 1 (c), untuk keliling'], ['d', 'Sisi miring 2 (d), untuk keliling']],
    calc: (v) => {
      const out = [];
      if (v.a > 0 && v.b > 0 && v.t > 0) out.push(['Luas', langkah('L = ½ × (a + b) × t', 'L = ½ × (' + fn(v.a) + ' + ' + fn(v.b) + ') × ' + fn(v.t), 0.5 * (v.a + v.b) * v.t)]);
      if (v.a > 0 && v.b > 0 && v.c > 0 && v.d > 0) out.push(['Keliling', langkah('K = a + b + c + d', 'K = ' + fn(v.a) + ' + ' + fn(v.b) + ' + ' + fn(v.c) + ' + ' + fn(v.d), v.a + v.b + v.c + v.d)]);
      return out;
    },
  },
  {
    id: 'belahketupat', name: 'Belah Ketupat', parsial: true,
    fields: [['d1', 'Diagonal 1 (d₁), untuk luas'], ['d2', 'Diagonal 2 (d₂), untuk luas'], ['s', 'Sisi (s), untuk keliling']],
    calc: (v) => {
      const out = [];
      if (v.d1 > 0 && v.d2 > 0) out.push(['Luas', langkah('L = ½ × d₁ × d₂', 'L = ½ × ' + fn(v.d1) + ' × ' + fn(v.d2), 0.5 * v.d1 * v.d2)]);
      if (v.s > 0) out.push(['Keliling', langkah('K = 4 × s', 'K = 4 × ' + fn(v.s), 4 * v.s)]);
      return out;
    },
  },
  {
    id: 'layanglayang', name: 'Layang-Layang', parsial: true,
    fields: [['d1', 'Diagonal 1 (d₁), untuk luas'], ['d2', 'Diagonal 2 (d₂), untuk luas'], ['a', 'Sisi pendek (a), untuk keliling'], ['b', 'Sisi panjang (b), untuk keliling']],
    calc: (v) => {
      const out = [];
      if (v.d1 > 0 && v.d2 > 0) out.push(['Luas', langkah('L = ½ × d₁ × d₂', 'L = ½ × ' + fn(v.d1) + ' × ' + fn(v.d2), 0.5 * v.d1 * v.d2)]);
      if (v.a > 0 && v.b > 0) out.push(['Keliling', langkah('K = 2 × (a + b)', 'K = 2 × (' + fn(v.a) + ' + ' + fn(v.b) + ')', 2 * (v.a + v.b))]);
      return out;
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
  {
    id: 'prisma', name: 'Prisma Segitiga', parsial: true,
    fields: [['a', 'Alas segitiga (a)'], ['t', 'Tinggi segitiga (t)'], ['tp', 'Tinggi prisma (tp)'], ['s1', 'Sisi segitiga 1, untuk luas permukaan'], ['s2', 'Sisi segitiga 2, untuk luas permukaan'], ['s3', 'Sisi segitiga 3, untuk luas permukaan']],
    calc: (v) => {
      const out = [];
      if (v.a > 0 && v.t > 0 && v.tp > 0) {
        const luasAlas = 0.5 * v.a * v.t;
        out.push(['Volume', langkah('V = luas alas × tinggi prisma', 'V = (½ × ' + fn(v.a) + ' × ' + fn(v.t) + ') × ' + fn(v.tp), luasAlas * v.tp)]);
        if (v.s1 > 0 && v.s2 > 0 && v.s3 > 0) {
          const kelAlas = v.s1 + v.s2 + v.s3;
          out.push(['Luas permukaan', langkah('LP = (keliling alas × tinggi prisma) + (2 × luas alas)', 'LP = (' + fn(kelAlas) + ' × ' + fn(v.tp) + ') + (2 × ' + fn(luasAlas) + ')', kelAlas * v.tp + 2 * luasAlas)]);
        }
      }
      return out;
    },
  },
  {
    id: 'limas', name: 'Limas Segiempat',
    fields: [['s', 'Sisi alas (s)'], ['t', 'Tinggi limas (t)']],
    calc: (v) => {
      const s = v.s, t = v.t;
      const m = Math.sqrt(t * t + (s / 2) * (s / 2)); // tinggi segitiga sisi tegak
      return [
        ['Tinggi sisi tegak (m)', langkah('m = √(t² + (s/2)²)', 'm = √(' + fn(t) + '² + (' + fn(s) + '/2)²)', m)],
        ['Volume', langkah('V = ⅓ × s² × t', 'V = ⅓ × ' + fn(s) + '² × ' + fn(t), (1 / 3) * s * s * t)],
        ['Luas permukaan', langkah('LP = s² + (2 × s × m)', 'LP = ' + fn(s) + '² + (2 × ' + fn(s) + ' × ' + fn(m) + ')', s * s + 2 * s * m)],
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
      inp.addEventListener('input', hitung); // hitung-live (Q4 v6.21.0)
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
    } else if (!sh.parsial) {
      // Bangun parsial (jajar genjang, trapesium, belah ketupat,
      // layang-layang, prisma): tiap hasil dihitung dari field yang
      // terisi saja, tidak semua field wajib diisi.
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
