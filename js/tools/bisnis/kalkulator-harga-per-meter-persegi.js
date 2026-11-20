import { h as T, kv } from '../../core.js';

export const meta = {"id": "kalkulator-harga-per-meter-persegi", "name": "Kalkulator Harga per Meter Persegi", "cat": "bisnis", "icon": "📐", "desc": "Harga properti per m² supaya dua properti bisa dibandingkan dengan adil.", "keywords": "harga per meter,per m2,properti,rumah,tanah,banding properti", "since": "6.17.0"};

// Harga per m2 = harga / luas.
export function hitungPerM2(harga, luas) {
  const h = Number(harga), l = Number(luas);
  if (![h, l].every(isFinite) || h < 0 || l <= 0) return null;
  const v = h / l;
  return Number.isFinite(v) ? v : null;
}

export function render(root) {
  const h1I = T.input('text', 'cth: 750000000', '');
  const l1I = T.input('text', 'cth: 100', '');
  const h2I = T.input('text', 'cth: 900000000', '');
  const l2I = T.input('text', 'cth: 120', '');
  const box = T.out();

  const hitung = () => {
    const h1 = T.num(h1I.value);
    const l1 = T.num(l1I.value);
    if (!isFinite(h1) || h1 < 0) { T.show(box, '<div class="err">Harga properti pertama harus diisi angka 0 atau lebih.</div>'); return; }
    if (!isFinite(l1) || l1 <= 0) { T.show(box, '<div class="err">Luas properti pertama harus diisi angka lebih dari 0.</div>'); return; }
    const p1 = hitungPerM2(h1, l1);
    if (p1 === null) { T.show(box, '<div class="err">Angkanya terlalu besar untuk dihitung. Coba pakai angka yang lebih kecil.</div>'); return; }
    let p2 = null;
    const h2Raw = h2I.value.trim(), l2Raw = l2I.value.trim();
    if (h2Raw !== '' || l2Raw !== '') {
      const h2 = T.num(h2Raw), l2 = T.num(l2Raw);
      if (!isFinite(h2) || h2 < 0) { T.show(box, '<div class="err">Harga properti kedua harus diisi angka 0 atau lebih, atau dikosongkan keduanya.</div>'); return; }
      if (!isFinite(l2) || l2 <= 0) { T.show(box, '<div class="err">Luas properti kedua harus diisi angka lebih dari 0, atau dikosongkan keduanya.</div>'); return; }
      p2 = hitungPerM2(h2, l2);
    }
    let banding = '';
    if (p2 != null) {
      const selisih = Math.abs(p1 - p2);
      const murah = p1 < p2 ? 'pertama' : p2 < p1 ? 'kedua' : null;
      // Pembagi persen adalah harga per m² yang lebih murah; bila salah satu
      // harga Rp0, persen selisih tidak bisa dihitung (bagi nol) — tampilkan
      // selisih rupiahnya saja, tanpa persen.
      const termurah = Math.min(p1, p2);
      const persenTxt = termurah > 0 ? ' (' + ((selisih / termurah) * 100).toFixed(1).replace('.', ',') + '%)' : '';
      banding = murah == null
        ? '<p class="info">Harga per m² kedua properti sama persis.</p>'
        : '<p class="info">Properti ' + murah + ' lebih murah per m², selisihnya ' + T.rp(selisih) + ' per m²' + persenTxt + '.</p>';
    }
    T.show(box,
      '<div class="big center">' + T.rp(p1) + '</div>' +
      '<p class="center">per meter persegi properti pertama</p>' +
      (p2 == null ? '' : kv('Properti kedua per m²', T.rp(p2))) +
      kv('Harga properti pertama', T.rp(h1)) +
      kv('Luas properti pertama', T.fmt(l1) + ' m²') +
      banding +
      '<p class="hint">Harga per m² membuat properti beda ukuran bisa dibandingkan. Lokasi dan kondisi bangunan tetap perlu dilihat sendiri, angka ini hanya satu sisi.</p>');
  };

  root.appendChild(T.el('<p class="note">Dua rumah dengan harga total sama bisa sangat beda nilainya kalau luasnya beda. Harga per m² menyamakan ukurannya. Isi properti kedua kalau mau membandingkan.</p>'));
  root.appendChild(T.field('Harga properti pertama (Rp)', h1I, 'Harga jual atau harga penawaran properti pertama.'));
  root.appendChild(T.field('Luas properti pertama (m²)', l1I, 'Luas bangunan atau luas tanah, pakai yang sama untuk keduanya.'));
  root.appendChild(T.field('Harga properti kedua (Rp, boleh kosong)', h2I, 'Isi kalau ada properti pembanding.'));
  root.appendChild(T.field('Luas properti kedua (m², boleh kosong)', l2I, 'Luas properti pembanding.'));
  root.appendChild(T.row(T.btn('Hitung Harga per m²', hitung, true)));
  root.appendChild(box);
}
