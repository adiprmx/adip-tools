import { h as T, preHtml, utils } from '../../core.js';

// Pencampur Warna: campur dua warna dan lihat warna-warna antaranya
// dalam beberapa langkah. Ketuk warna untuk menyalin kodenya.
export const meta = {"id": "pencampur-warna", "name": "Pencampur Warna", "cat": "desain", "icon": "🎨", "desc": "Campur dua warna dan dapatkan warna-warna antaranya dalam 2 sampai 10 langkah.", "keywords": "pencampur warna,color mixer,campur warna,gradasi,blend warna", "since": "6.18.0"};

// Hex ke [r, g, b]. Terima "#fff" dan "#ffffff". Murni.
// hexKeRgb, rgbKeHex kanonis tinggal di utils (core.js).

// Campur dua warna dalam `langkah` warna (termasuk kedua ujungnya).
// Murni, bisa diuji tanpa DOM.
export function campurWarna(hex1, hex2, langkah) {
  const a = utils.hexKeRgb(hex1);
  const b = utils.hexKeRgb(hex2);
  if (!a || !b) return [];
  const n = Math.max(2, Math.min(10, Number(langkah) || 5));
  const hasil = [];
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0 : i / (n - 1);
    hasil.push(utils.rgbKeHex(
      a[0] + (b[0] - a[0]) * t,
      a[1] + (b[1] - a[1]) * t,
      a[2] + (b[2] - a[2]) * t,
    ));
  }
  return hasil;
}

export function render(root) {
  const warna1I = T.input('color'); warna1I.value = '#ff6f61';
  const warna2I = T.input('color'); warna2I.value = '#3b82f6';
  const hex1I = T.input('text', 'cth: #ff6f61', '#ff6f61');
  const hex2I = T.input('text', 'cth: #3b82f6', '#3b82f6');
  const langkahSel = T.select([['3', '3 warna'], ['4', '4 warna'], ['5', '5 warna'], ['6', '6 warna'], ['8', '8 warna'], ['10', '10 warna']], '5');
  const statusBox = T.out();
  const hasilBox = T.out();
  const codeBox = T.out();

  function kartu(hex, i, total) {
    const num = parseInt(hex.slice(1), 16);
    const terang = (0.299 * ((num >> 16) & 255) + 0.587 * ((num >> 8) & 255) + 0.114 * (num & 255)) > 150;
    const label = i === 0 ? 'Warna pertama' : (i === total - 1 ? 'Warna kedua' : 'Campuran ' + i);
    const sw = T.el('<div style="flex:1 1 90px;height:96px;border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;cursor:pointer;border:1px solid #ffffff20;background:' + hex + '">' +
      '<span style="font-size:11px;font-family:monospace;background:rgba(0,0,0,.55);color:#fff;padding:3px 8px;border-radius:20px;margin-bottom:4px">' + hex.toUpperCase() + '</span>' +
      '<span style="font-size:10px;color:' + (terang ? '#111' : '#e4e4e7') + ';margin-bottom:8px">' + label + '</span></div>');
    sw.addEventListener('click', () => T.copy(hex));
    return sw;
  }

  function paint() {
    const h1 = hex1I.value.trim();
    const h2 = hex2I.value.trim();
    const daftar = campurWarna(h1, h2, parseInt(langkahSel.value, 10));
    if (!daftar.length) {
      T.show(statusBox, '<div class="err">Salah satu kode warnanya tidak dikenali. Pakai format seperti #ff6f61.</div>');
      T.hide(hasilBox); T.hide(codeBox);
      return;
    }
    T.hide(statusBox);
    T.show(hasilBox, '<p class="hint" style="margin-top:14px">Hasil campuran (ketuk warna untuk menyalin kodenya):</p>');
    const wrap = T.el('<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px"></div>');
    hasilBox.appendChild(wrap);
    daftar.forEach((hex, i) => wrap.appendChild(kartu(hex, i, daftar.length)));
    const css = 'background: linear-gradient(90deg, ' + daftar.join(', ') + ');';
    T.show(codeBox, preHtml(css));
  }

  function sinkron(picker, teks) {
    picker.addEventListener('input', () => { teks.value = picker.value; paint(); });
    teks.addEventListener('input', () => {
      if (utils.hexKeRgb(teks.value.trim())) picker.value = teks.value.trim();
      paint();
    });
  }
  sinkron(warna1I, hex1I);
  sinkron(warna2I, hex2I);
  langkahSel.addEventListener('change', paint);

  root.appendChild(T.grid2(T.field('Warna pertama', warna1I), T.field('Kode warna pertama', hex1I)));
  root.appendChild(T.grid2(T.field('Warna kedua', warna2I), T.field('Kode warna kedua', hex2I)));
  root.appendChild(T.field('Jumlah warna hasil', langkahSel));
  root.appendChild(statusBox);
  root.appendChild(hasilBox);
  root.appendChild(T.el('<div class="hint" style="margin:14px 0 4px">Kode gradasi CSS:</div>'));
  root.appendChild(codeBox);
  root.appendChild(T.row(T.copyBtn(() => {
    const daftar = campurWarna(hex1I.value.trim(), hex2I.value.trim(), parseInt(langkahSel.value, 10));
    return daftar.length ? 'background: linear-gradient(90deg, ' + daftar.join(', ') + ');' : '';
  }, 'Salin Gradasi CSS')));
  paint();
}
