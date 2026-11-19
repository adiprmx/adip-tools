import { h as T, preHtml } from '../../core.js';

// Generator Checkbox CSS: buat checkbox dengan gaya sendiri, tanpa
// JavaScript. Pratinjau langsung bisa diklik; kodenya siap disalin.
export const meta = {"id": "generator-checkbox-css", "name": "Generator Checkbox CSS", "cat": "desain", "icon": "☑️", "desc": "Buat checkbox CSS dengan warna, ukuran, dan bentukmu sendiri. Tinggal salin kodenya.", "keywords": "checkbox,css,generator,kotak centang,toggle,form", "since": "6.18.0"};

// Bangun CSS checkbox dari pilihan. Murni, bisa diuji tanpa DOM.
export function buatCssCheckbox(o) {
  const ukuran = Math.max(12, Math.min(64, Number(o.ukuran) || 22));
  const warna = o.warna || '#ff6f61';
  const latar = o.latar || '#ffffff';
  const bingkai = o.bingkai || '#a1a1aa';
  const radius = o.bentuk === 'bulat' ? '50%' : (o.bentuk === 'membulat' ? Math.round(ukuran * 0.25) + 'px' : '3px');
  const tebal = Math.max(1, Math.round(ukuran / 8));
  const tanda = o.gaya === 'silang'
    ? 'content: ""; position: absolute; left: 50%; top: 50%; width: ' + Math.round(ukuran * 0.55) + 'px; height: ' + tebal + 'px; background: ' + latar + '; transform: translate(-50%, -50%) rotate(45deg);'
    : 'content: ""; position: absolute; left: ' + Math.round(ukuran * 0.32) + 'px; top: ' + Math.round(ukuran * 0.14) + 'px; width: ' + Math.round(ukuran * 0.2) + 'px; height: ' + Math.round(ukuran * 0.42) + 'px; border: solid ' + latar + '; border-width: 0 ' + tebal + 'px ' + tebal + 'px 0; transform: rotate(45deg);';
  const silang2 = o.gaya === 'silang'
    ? '\n.cbx input:checked + .kotak::after { content: ""; position: absolute; left: 50%; top: 50%; width: ' + Math.round(ukuran * 0.55) + 'px; height: ' + tebal + 'px; background: ' + latar + '; transform: translate(-50%, -50%) rotate(-45deg); }'
    : '';
  return '.cbx { display: inline-flex; align-items: center; gap: 10px; cursor: pointer; font-family: inherit; }\n' +
    '.cbx input { position: absolute; opacity: 0; width: 0; height: 0; }\n' +
    '.cbx .kotak { position: relative; flex: none; width: ' + ukuran + 'px; height: ' + ukuran + 'px; border: 2px solid ' + bingkai + '; border-radius: ' + radius + '; background: ' + latar + '; transition: background .15s, border-color .15s; }\n' +
    '.cbx input:checked + .kotak { background: ' + warna + '; border-color: ' + warna + '; }\n' +
    '.cbx input:focus-visible + .kotak { outline: 2px solid ' + warna + '; outline-offset: 2px; }\n' +
    '.cbx input:checked + .kotak::before { ' + tanda + ' }' + silang2;
}

export function buatHtmlCheckbox() {
  return '<label class="cbx"><input type="checkbox"><span class="kotak"></span>Saya setuju</label>';
}

export function render(root) {
  const ukuranR = T.input('range');
  ukuranR.min = '16'; ukuranR.max = '40'; ukuranR.value = '22';
  const ukuranV = T.el('<b>22px</b>');
  const ukuranWrap = T.el('<div class="row" style="align-items:center"></div>');
  ukuranWrap.appendChild(ukuranR); ukuranWrap.appendChild(ukuranV);

  const warnaI = T.input('color'); warnaI.value = '#ff6f61';
  const latarI = T.input('color'); latarI.value = '#ffffff';
  const bingkaiI = T.input('color'); bingkaiI.value = '#a1a1aa';
  const bentukSel = T.select([['kotak', 'Kotak'], ['membulat', 'Sudut membulat'], ['bulat', 'Bulat']], 'membulat');
  const gayaSel = T.select([['centang', 'Tanda centang'], ['silang', 'Tanda silang']], 'centang');

  const gaya = document.createElement('style');
  root.appendChild(gaya);
  const pratinjau = T.el('<div style="display:flex;gap:28px;align-items:center;flex-wrap:wrap;padding:26px 18px;background:#18181b;border-radius:12px;border:1px solid #27272a;margin:12px 0"></div>');
  const codeBox = T.out();
  const htmlBox = T.out();

  function pilihan() {
    return {
      ukuran: parseInt(ukuranR.value, 10),
      warna: warnaI.value,
      latar: latarI.value,
      bingkai: bingkaiI.value,
      bentuk: bentukSel.value,
      gaya: gayaSel.value,
    };
  }

  function paint() {
    const css = buatCssCheckbox(pilihan());
    gaya.textContent = css;
    pratinjau.innerHTML =
      '<label class="cbx"><input type="checkbox" checked><span class="kotak"></span><span>Dicentang</span></label>' +
      '<label class="cbx"><input type="checkbox"><span class="kotak"></span><span>Belum dicentang</span></label>';
    T.show(codeBox, preHtml(css));
    T.show(htmlBox, preHtml(buatHtmlCheckbox()));
  }

  ukuranR.addEventListener('input', () => { ukuranV.textContent = ukuranR.value + 'px'; paint(); });
  [warnaI, latarI, bingkaiI].forEach((elm) => elm.addEventListener('input', paint));
  [bentukSel, gayaSel].forEach((elm) => elm.addEventListener('change', paint));

  root.appendChild(T.field('Ukuran kotak', ukuranWrap));
  root.appendChild(T.grid2(T.field('Warna saat dicentang', warnaI), T.field('Warna kotak', latarI)));
  root.appendChild(T.grid2(T.field('Warna garis kotak', bingkaiI), T.field('Bentuk kotak', bentukSel)));
  root.appendChild(T.field('Tanda di dalam kotak', gayaSel));
  root.appendChild(pratinjau);
  root.appendChild(T.el('<div class="hint" style="margin:10px 0 4px">Kode CSS:</div>'));
  root.appendChild(codeBox);
  root.appendChild(T.row(T.copyBtn(() => buatCssCheckbox(pilihan()), 'Salin CSS')));
  root.appendChild(T.el('<div class="hint" style="margin:14px 0 4px">Kode HTML:</div>'));
  root.appendChild(htmlBox);
  root.appendChild(T.row(T.copyBtn(() => buatHtmlCheckbox(), 'Salin HTML')));
  paint();
}
