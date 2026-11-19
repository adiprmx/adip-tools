import { h as T, preHtml } from '../../core.js';

// Generator Segitiga CSS: buat kode CSS bentuk segitiga dengan trik
// border. Pratinjau langsung berubah saat pengaturan diganti.
export const meta = {"id": "generator-segitiga-css", "name": "Generator Segitiga CSS", "cat": "desain", "icon": "🔺", "desc": "Buat kode CSS bentuk segitiga: atur arah, lebar, tinggi, dan warnanya.", "keywords": "segitiga,css,triangle,border,generator,bentuk", "since": "6.18.0"};

// Bangun CSS segitiga dari pilihan. Murni, bisa diuji tanpa DOM.
// arah: 'atas' | 'bawah' | 'kiri' | 'kanan' (arah ujung segitiga).
export function buatCssSegitiga(o) {
  const lebar = Math.max(1, Math.round(Number(o.lebar) || 100));
  const tinggi = Math.max(1, Math.round(Number(o.tinggi) || 100));
  const warna = o.warna || '#ff6f61';
  const setengahL = Math.round(lebar / 2);
  const setengahT = Math.round(tinggi / 2);
  const t = 'transparent';
  let border = '';
  if (o.arah === 'atas') {
    border = 'border-left: ' + setengahL + 'px solid ' + t + ';\n  border-right: ' + setengahL + 'px solid ' + t + ';\n  border-bottom: ' + tinggi + 'px solid ' + warna + ';';
  } else if (o.arah === 'bawah') {
    border = 'border-left: ' + setengahL + 'px solid ' + t + ';\n  border-right: ' + setengahL + 'px solid ' + t + ';\n  border-top: ' + tinggi + 'px solid ' + warna + ';';
  } else if (o.arah === 'kiri') {
    border = 'border-top: ' + setengahT + 'px solid ' + t + ';\n  border-bottom: ' + setengahT + 'px solid ' + t + ';\n  border-right: ' + lebar + 'px solid ' + warna + ';';
  } else {
    border = 'border-top: ' + setengahT + 'px solid ' + t + ';\n  border-bottom: ' + setengahT + 'px solid ' + t + ';\n  border-left: ' + lebar + 'px solid ' + warna + ';';
  }
  return '.segitiga {\n  width: 0;\n  height: 0;\n  ' + border + '\n}';
}

export function render(root) {
  const arahSel = T.select([['atas', 'Ujung ke atas'], ['bawah', 'Ujung ke bawah'], ['kiri', 'Ujung ke kiri'], ['kanan', 'Ujung ke kanan']], 'atas');
  const warnaI = T.input('color'); warnaI.value = '#ff6f61';

  const buatGeser = (label, nilaiAwal, maks) => {
    const range = T.input('range');
    range.min = '10'; range.max = String(maks); range.value = String(nilaiAwal);
    const val = T.el('<b>' + nilaiAwal + 'px</b>');
    const wrap = T.el('<div class="row" style="align-items:center"></div>');
    wrap.appendChild(range); wrap.appendChild(val);
    range.addEventListener('input', () => { val.textContent = range.value + 'px'; paint(); });
    return { range, field: T.field(label, wrap) };
  };
  const lebar = buatGeser('Lebar alas', 120, 300);
  const tinggi = buatGeser('Tinggi', 100, 300);

  const pratinjau = T.el('<div style="display:flex;justify-content:center;align-items:center;min-height:220px;padding:24px 16px;background:#18181b;border-radius:12px;border:1px solid #27272a;margin:12px 0;overflow:hidden"></div>');
  const bentuk = T.el('<div></div>');
  pratinjau.appendChild(bentuk);
  const codeBox = T.out();

  function pilihan() {
    return {
      arah: arahSel.value,
      lebar: parseInt(lebar.range.value, 10),
      tinggi: parseInt(tinggi.range.value, 10),
      warna: warnaI.value,
    };
  }

  function paint() {
    const css = buatCssSegitiga(pilihan());
    const isi = css.replace(/^\.segitiga \{\n/, '').replace(/\n\}$/, '').replace(/\n  /g, ' ');
    bentuk.style.cssText = isi;
    T.show(codeBox, preHtml(css + '\n\n<!-- HTML: -->\n<div class="segitiga"></div>'));
  }

  arahSel.addEventListener('change', paint);
  warnaI.addEventListener('input', paint);

  root.appendChild(T.grid2(T.field('Arah ujung', arahSel), T.field('Warna', warnaI)));
  root.appendChild(lebar.field);
  root.appendChild(tinggi.field);
  root.appendChild(pratinjau);
  root.appendChild(codeBox);
  root.appendChild(T.row(T.copyBtn(() => buatCssSegitiga(pilihan()), 'Salin CSS')));
  paint();
}
