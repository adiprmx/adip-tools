import { h as T, utils, kv } from '../../core.js';

// Ukuran topi dari lingkar kepala (cm). Ukuran fitted US = lingkar dalam
// inci dibulatkan ke 1/8 terdekat. Huruf S/M/L/XL mengikuti rentang umum
// produsen topi.
export function labelTopi(lingkarCm) {
  const c = Number(lingkarCm);
  if (!isFinite(c)) return '';
  if (c < 54) return 'XS';
  if (c < 56) return 'S';
  if (c < 58) return 'M';
  if (c < 60) return 'L';
  if (c < 62) return 'XL';
  return 'XXL';
}
export function hitungUkuranTopi(lingkarCm) {
  const c = Number(lingkarCm);
  if (!isFinite(c) || c <= 0) return null;
  const inci = c / 2.54;
  const fitted = Math.round(inci * 8) / 8;
  const bulat = Math.floor(fitted);
  const sisa = fitted - bulat;
  const pecahan = sisa === 0 ? '' : sisa === 0.125 ? ' 1/8' : sisa === 0.25 ? ' 1/4' : sisa === 0.375 ? ' 3/8' : sisa === 0.5 ? ' 1/2' : sisa === 0.625 ? ' 5/8' : sisa === 0.75 ? ' 3/4' : ' 7/8';
  return {
    cm: Math.round(c * 10) / 10,
    inci: Math.round(inci * 100) / 100,
    fitted: bulat + pecahan,
    label: labelTopi(c),
  };
}
utils.ukuranTopi = hitungUkuranTopi;

export const meta = {"id": "ukuran-topi", "name": "Ukuran Topi", "cat": "sehari", "icon": "🧢", "desc": "Cari ukuran topi (cm, inci, fitted US, S/M/L/XL) dari lingkar kepalamu.", "keywords": "ukuran topi,hat size,lingkar kepala,topi,fitted,cap", "since": "6.19.0"};
export function render(root) {
  const lingkarI = T.input('text', 'cth: 57', ''); lingkarI.inputMode = 'decimal';
  const box = T.out();

  const hitung = () => {
    const c = T.num(lingkarI.value);
    if (!lingkarI.value.trim()) { T.hide(box); return; }
    if (!isFinite(c) || c < 40 || c > 75) { T.show(box, '<div class="err">Lingkar kepala harus angka 40 sampai 75 cm.</div>'); return; }
    const r = hitungUkuranTopi(c);
    T.show(box,
      '<div class="big">' + r.label + ' <span class="mut" style="font-size:16px">/ ' + r.fitted + '</span></div>' +
      '<p class="center mut">Ukuran fitted US ' + r.fitted + ', lingkar ' + T.fmt(r.cm) + ' cm.</p>' +
      kv('Ukuran huruf', r.label) +
      kv('Ukuran fitted US', r.fitted) +
      kv('Lingkar (cm)', T.fmt(r.cm) + ' cm') +
      kv('Lingkar (inci)', utils.fmtDes(r.inci, 2) + ' inci') +
      '<p class="hint">Cara ukur: lingkarkan meteran kain di kepala, pas di atas alis dan telinga, tempat topi biasa dipakai. Bila angkamu di antara dua ukuran, ambil yang lebih besar supaya tidak menekan kepala. Tiap merek bisa beda sedikit.</p>');
  };
  lingkarI.addEventListener('input', hitung);

  root.appendChild(T.el('<p class="note">Ukur lingkar kepalamu sekali, lalu semua ukuran topi langsung ketemu.</p>'));
  root.appendChild(T.field('Lingkar kepala (cm)', lingkarI, 'Diukur di atas alis dan telinga'));
  root.appendChild(box);
}
