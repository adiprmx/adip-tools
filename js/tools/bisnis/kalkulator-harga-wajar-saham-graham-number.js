import { h as T, kv } from '../../core.js';

export const meta = {"id": "kalkulator-harga-wajar-saham-graham-number", "name": "Kalkulator Harga Wajar Saham (Graham Number)", "cat": "bisnis", "icon": "⚖️", "desc": "Perkiraan harga wajar saham dari laba dan nilai buku per saham ala Benjamin Graham.", "keywords": "graham number,harga wajar,saham,eps,bvps,benjamin graham,valuasi", "since": "6.17.0"};

// Graham number = akar(22,5 x EPS x BVPS). Hanya berlaku bila EPS dan BVPS positif.
export function hitungGraham(eps, bvps) {
  const e = Number(eps), b = Number(bvps);
  if (![e, b].every(isFinite) || e <= 0 || b <= 0) return null;
  const g = Math.sqrt(22.5 * e * b);
  return Number.isFinite(g) ? g : null;
}

export function render(root) {
  const epsI = T.input('text', 'cth: 150', '');
  const bvpsI = T.input('text', 'cth: 1200', '');
  const hargaI = T.input('text', 'cth: 2000', '');
  const box = T.out();

  const hitung = () => {
    const eps = T.num(epsI.value);
    const bvps = T.num(bvpsI.value);
    if (!isFinite(eps) || eps <= 0) { T.show(box, '<div class="err">EPS harus diisi angka lebih dari 0. Rumus ini tidak berlaku untuk perusahaan yang rugi.</div>'); return; }
    if (!isFinite(bvps) || bvps <= 0) { T.show(box, '<div class="err">Nilai buku per saham (BVPS) harus diisi angka lebih dari 0.</div>'); return; }
    const g = hitungGraham(eps, bvps);
    if (g === null) { T.show(box, '<div class="err">Angkanya terlalu besar untuk dihitung. Coba pakai angka yang lebih kecil.</div>'); return; }
    let banding = '';
    const hargaRaw = hargaI.value.trim();
    if (hargaRaw !== '') {
      const harga = T.num(hargaRaw);
      if (!isFinite(harga) || harga < 0) { T.show(box, '<div class="err">Harga pasar harus diisi angka 0 atau lebih, atau dikosongkan.</div>'); return; }
      const selisihPersen = ((harga - g) / g) * 100;
      const teks = selisihPersen.toFixed(1).replace('.', ',');
      banding = harga < g
        ? '<p class="info">Harga pasar ' + teks.replace('-', '') + '% di bawah harga wajar hitungan ini. Itu belum tentu berarti murah, cek juga utang dan prospeknya.</p>'
        : harga > g
          ? '<p class="warn">Harga pasar ' + teks + '% di atas harga wajar hitungan ini.</p>'
          : '<p class="info">Harga pasar pas sama dengan harga wajar hitungan ini.</p>';
    }
    T.show(box,
      '<div class="big center">' + T.rp(g) + '</div>' +
      '<p class="center">harga wajar per lembar saham (Graham number)</p>' +
      kv('EPS (laba per saham)', T.rp(eps)) +
      kv('BVPS (nilai buku per saham)', T.rp(bvps)) +
      banding +
      '<p class="hint">Rumus Benjamin Graham ini patokan kasar dari tahun 1970-an: angka 22,5 berasal dari P/E maksimal 15 dikali rasio harga terhadap nilai buku maksimal 1,5. Cocok untuk perusahaan stabil, kurang cocok untuk perusahaan teknologi yang asetnya bukan barang.</p>');
  };

  root.appendChild(T.el('<p class="note">Graham number memperkirakan batas atas harga wajar saham dari dua angka: laba per saham dan nilai buku per saham. Ini patokan kasar, bukan harga pasti.</p>'));
  root.appendChild(T.field('EPS / laba per saham (Rp)', epsI, 'Laba bersih perusahaan dibagi jumlah saham.'));
  root.appendChild(T.field('BVPS / nilai buku per saham (Rp)', bvpsI, 'Ekuitas perusahaan dibagi jumlah saham.'));
  root.appendChild(T.field('Harga pasar saat ini (Rp, boleh kosong)', hargaI, 'Isi untuk membandingkan harga pasar dengan harga wajar.'));
  root.appendChild(T.row(T.btn('Hitung Harga Wajar', hitung, true)));
  root.appendChild(box);
}
