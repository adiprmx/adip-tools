import { h as T, utils } from '../../core.js';

export const meta = {"id": "rata-rata-geometrik-harmonik", "name": "Rata-rata Geometrik & Harmonik", "cat": "pelajar", "icon": "📐", "desc": "Rata-rata geometrik dan harmonik dari deret angka, beserta perbandingannya dengan rata-rata biasa.", "keywords": "rata-rata,geometrik,harmonik,mean,statistik,matematika,pertumbuhan", "since": "6.19.0"};

const n0 = (v) => (Object.is(v, -0) ? 0 : v);

// parseDeret memakai utils.parseDeret (kanonis, G4 C1G4-R).
export const parseDeret = utils.parseDeret;

// Rata-rata geometrik = akar ke-n dari perkalian semua angka.
// Null bila ada angka <= 0 (akar dari bilangan negatif/tak hingga tidak terdefinisi).
export function rataGeometrik(data) {
  if (!data.length || data.some((v) => v <= 0)) return null;
  const log = data.reduce((s, v) => s + Math.log(v), 0) / data.length;
  return n0(Math.exp(log));
}

// Rata-rata harmonik = n / jumlah (1/x). Null bila ada angka <= 0.
export function rataHarmonik(data) {
  if (!data.length || data.some((v) => v <= 0)) return null;
  const jum = data.reduce((s, v) => s + 1 / v, 0);
  return n0(data.length / jum);
}

export function rataAritmetik(data) {
  if (!data.length) return null;
  return n0(data.reduce((s, v) => s + v, 0) / data.length);
}

const fmt = (v) => (v == null ? '-' : T.fmt(n0(Number(utils.r4(v)))));

export function render(root) {
  const ta = T.ta(4, 'mis.\n2, 8\natau pisahkan dengan spasi / enter', '2 8');
  const box = T.out();

  const hitung = () => {
    const data = parseDeret(ta.value);
    if (!data.length) {
      T.show(box, '<p class="dim">Isi deret angkanya dulu. Pisahkan dengan spasi, koma, atau enter.</p>');
      return;
    }
    const am = rataAritmetik(data);
    const gm = rataGeometrik(data);
    const hm = rataHarmonik(data);
    const produk = data.reduce((s, v) => s * v, 1);
    const jumBalik = data.reduce((s, v) => s + (v === 0 ? 0 : 1 / v), 0);
    let h = '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:8px">';
    [['Geometrik', gm, 'akar pangkat ' + data.length + ' dari hasil kali'], ['Harmonik', hm, data.length + ' ÷ jumlah kebalikan'], ['Biasa (aritmetik)', am, 'jumlah ÷ banyaknya angka']].forEach(([label, v, cara]) => {
      h += '<div style="flex:1;min-width:100px;padding:12px;border-radius:10px;border:1px solid rgba(255,255,255,.15);text-align:center"><div class="dim" style="font-size:11px">' + label + '</div><div style="font-size:22px;font-weight:700">' + fmt(v) + '</div><div class="dim" style="font-size:11px">' + cara + '</div></div>';
    });
    h += '</div>';
    if (gm == null || hm == null) {
      h += '<p class="err">Rata-rata geometrik dan harmonik hanya bisa dihitung bila semua angka positif (lebih dari 0). Datamu ada yang 0 atau negatif.</p>';
    } else {
      h += '<p class="hint">Selalu berlaku: rata-rata biasa ≥ geometrik ≥ harmonik. Di sini ' + fmt(am) + ' ≥ ' + fmt(gm) + ' ≥ ' + fmt(hm) + '. Cocok.</p>';
    }
    h += '<p style="margin-top:10px"><b>Langkah</b></p>';
    h += '<div class="kv"><span class="k">Hasil kali semua angka</span><span class="v">' + data.join(' × ') + ' = ' + fmt(produk) + '</span></div>';
    h += '<div class="kv"><span class="k">Jumlah kebalikan (1/x)</span><span class="v">' + data.map((v) => '1/' + T.fmt(v)).join(' + ') + ' = ' + fmt(jumBalik) + '</span></div>';
    h += '<div class="kv"><span class="k">Jumlah semua angka</span><span class="v">' + fmt(data.reduce((s, v) => s + v, 0)) + ' (dari ' + data.length + ' angka)</span></div>';
    h += '<p class="hint">Geometrik cocok buat rata-rata pertumbuhan (mis. investasi naik berapa persen per tahun). Harmonik cocok buat rata-rata kecepatan (mis. pergi-pulang dengan kecepatan berbeda).</p>';
    T.show(box, h);
  };

  const tombol = T.btn('Hitung', hitung, true);
  ta.addEventListener('input', hitung);

  root.appendChild(T.el('<p class="note">Selain rata-rata biasa, ada dua rata-rata lain yang sering dipakai: geometrik buat pertumbuhan, harmonik buat kecepatan.</p>'));
  root.appendChild(T.field('Deret angka (semua harus positif)', ta));
  root.appendChild(tombol);
  root.appendChild(box);
  hitung();
}
