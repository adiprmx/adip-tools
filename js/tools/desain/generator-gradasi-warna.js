import { h as T, preHtml, utils } from '../../core.js';

// Generator Gradasi Warna: dari satu warna, dapatkan semua turunannya:
// versi lebih terang, lebih gelap, dan lebih pudar sampai lebih pekat.
export const meta = {"id": "generator-gradasi-warna", "name": "Generator Gradasi Warna", "cat": "desain", "icon": "🎨", "desc": "Dari satu warna, dapatkan versi terang, gelap, pudar, dan pekatnya dalam beberapa langkah.", "keywords": "gradasi warna,shades,tints,turunan warna,palet warna,warna", "since": "6.18.0"};

// Hex ke [r, g, b]. Terima "#fff" dan "#ffffff". Murni.
// hexKeRgb, rgbKeHex kanonis tinggal di utils (core.js).

function campur(a, b, t) {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];
}

// Turunan terang-gelap: langkah ganjil, warna dasar di tengah.
// Murni.
export function buatTurunan(hex, langkah) {
  const dasar = utils.hexKeRgb(hex);
  if (!dasar) return [];
  const n = Math.max(3, Math.min(11, Number(langkah) || 5));
  const ganjil = n % 2 === 1 ? n : n + 1;
  const k = (ganjil - 1) / 2;
  const hasil = [];
  for (let i = k; i >= 1; i--) {
    hasil.push(utils.rgbKeHex(...campur(dasar, [255, 255, 255], i / (k + 1))));
  }
  hasil.push(utils.rgbKeHex(...dasar));
  for (let i = 1; i <= k; i++) {
    hasil.push(utils.rgbKeHex(...campur(dasar, [0, 0, 0], i / (k + 1))));
  }
  return hasil;
}

// RGB ke HSL (h 0..360, s/l 0..1). Murni.
export function rgbKeHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const maks = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (maks + min) / 2;
  if (maks === min) return [0, 0, l];
  const d = maks - min;
  const s = l > 0.5 ? d / (2 - maks - min) : d / (maks + min);
  let h;
  if (maks === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (maks === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return [h * 60, s, l];
}

// HSL ke RGB (0..255). Murni.
export function hslKeRgb(h, s, l) {
  h = ((h % 360) + 360) % 360 / 360;
  if (s === 0) { const v = Math.round(l * 255); return [v, v, v]; }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hitung = (t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return [Math.round(hitung(h + 1 / 3) * 255), Math.round(hitung(h) * 255), Math.round(hitung(h - 1 / 3) * 255)];
}

// Turunan saturasi: dari abu-abu (pudar) sampai pekat penuh.
// Murni.
export function buatSaturasi(hex, langkah) {
  const dasar = utils.hexKeRgb(hex);
  if (!dasar) return [];
  const [h, , l] = rgbKeHsl(dasar[0], dasar[1], dasar[2]);
  const n = Math.max(2, Math.min(11, Number(langkah) || 5));
  const hasil = [];
  for (let i = 0; i < n; i++) {
    const s = n === 1 ? 1 : i / (n - 1);
    hasil.push(utils.rgbKeHex(...hslKeRgb(h, s, l)));
  }
  return hasil;
}

export function render(root) {
  const warnaI = T.input('color'); warnaI.value = '#ff6f61';
  const hexI = T.input('text', 'cth: #ff6f61', '#ff6f61');
  const langkahSel = T.select([['5', '5 langkah'], ['7', '7 langkah'], ['9', '9 langkah']], '5');
  const statusBox = T.out();
  const turunanBox = T.out();
  const saturasiBox = T.out();
  const codeBox = T.out();

  function kartu(hex, label) {
    const num = parseInt(hex.slice(1), 16);
    const terang = (0.299 * ((num >> 16) & 255) + 0.587 * ((num >> 8) & 255) + 0.114 * (num & 255)) > 150;
    const sw = T.el('<div style="flex:1 1 90px;height:86px;border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;cursor:pointer;border:1px solid #ffffff20;background:' + hex + '">' +
      '<span style="font-size:11px;font-family:monospace;background:rgba(0,0,0,.55);color:#fff;padding:3px 8px;border-radius:20px;margin-bottom:4px">' + hex.toUpperCase() + '</span>' +
      '<span style="font-size:10px;color:' + (terang ? '#111' : '#e4e4e7') + ';margin-bottom:8px">' + T.esc(label) + '</span></div>');
    sw.addEventListener('click', () => T.copy(hex));
    return sw;
  }

  function gambarBaris(box, judul, daftar, labelTengah) {
    T.show(box, '<p class="hint" style="margin-top:14px">' + T.esc(judul) + ' (ketuk warna untuk menyalin kodenya)</p>');
    const wrap = T.el('<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px"></div>');
    box.appendChild(wrap);
    const tengah = Math.floor(daftar.length / 2);
    daftar.forEach((hex, i) => {
      let label = '';
      if (labelTengah != null) label = i === tengah ? labelTengah : (i < tengah ? 'Terang ' + (tengah - i) : 'Gelap ' + (i - tengah));
      else label = i === 0 ? 'Paling pudar' : (i === daftar.length - 1 ? 'Paling pekat' : 'Pekat ' + i);
      wrap.appendChild(kartu(hex, label));
    });
  }

  function paint() {
    const hex = hexI.value.trim();
    const rgb = utils.hexKeRgb(hex);
    if (!rgb) {
      T.show(statusBox, '<div class="err">Kode warnanya tidak dikenali. Pakai format seperti #ff6f61.</div>');
      T.hide(turunanBox); T.hide(saturasiBox); T.hide(codeBox);
      return;
    }
    T.hide(statusBox);
    const langkah = parseInt(langkahSel.value, 10);
    const turunan = buatTurunan(hex, langkah);
    const saturasi = buatSaturasi(hex, langkah);
    gambarBaris(turunanBox, 'Terang ke gelap', turunan, 'Warna dasar');
    gambarBaris(saturasiBox, 'Pudar ke pekat', saturasi, null);
    const baris = turunan.map((h, i) => '  --warna-' + (i + 1) + ': ' + h + ';').join('\n');
    T.show(codeBox, preHtml(':root {\n' + baris + '\n}'));
  }

  warnaI.addEventListener('input', () => { hexI.value = warnaI.value; paint(); });
  hexI.addEventListener('input', () => {
    if (utils.hexKeRgb(hexI.value.trim())) warnaI.value = hexI.value.trim();
    paint();
  });
  langkahSel.addEventListener('change', paint);

  root.appendChild(T.grid2(T.field('Pilih warna', warnaI), T.field('Atau tulis kodenya', hexI)));
  root.appendChild(T.field('Jumlah langkah', langkahSel));
  root.appendChild(statusBox);
  root.appendChild(turunanBox);
  root.appendChild(saturasiBox);
  root.appendChild(T.el('<div class="hint" style="margin:14px 0 4px">Kode variabel CSS (terang ke gelap):</div>'));
  root.appendChild(codeBox);
  root.appendChild(T.row(T.copyBtn(() => {
    const turunan = buatTurunan(hexI.value.trim(), parseInt(langkahSel.value, 10));
    if (!turunan.length) return '';
    return ':root {\n' + turunan.map((h, i) => '  --warna-' + (i + 1) + ': ' + h + ';').join('\n') + '\n}';
  }, 'Salin Variabel CSS')));
  paint();
}
