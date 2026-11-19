import { h as T, preHtml } from '../../core.js';

// Generator Switch CSS: buat tombol switch/toggle CSS tanpa JavaScript.
// Pratinjau langsung bisa diklik; kodenya siap disalin.
export const meta = {"id": "generator-switch-css", "name": "Generator Switch CSS", "cat": "desain", "icon": "🔘", "desc": "Buat tombol switch/toggle CSS: atur ukuran dan warnanya, lalu salin kodenya.", "keywords": "switch,toggle,css,generator,tombol geser,form", "since": "6.18.0"};

// Bangun CSS switch dari pilihan. Murni, bisa diuji tanpa DOM.
export function buatCssSwitch(o) {
  const lebar = Math.max(32, Math.min(140, Number(o.lebar) || 56));
  const tinggi = Math.round(lebar * 0.56);
  const gagang = tinggi - 8;
  const geser = lebar - gagang - 8;
  const nyala = o.nyala || '#ff6f61';
  const mati = o.mati || '#52525b';
  const gagangWarna = o.gagang || '#ffffff';
  return '.sw { position: relative; display: inline-block; width: ' + lebar + 'px; height: ' + tinggi + 'px; }\n' +
    '.sw input { position: absolute; opacity: 0; width: 0; height: 0; }\n' +
    '.sw .rel { position: absolute; inset: 0; background: ' + mati + '; border-radius: ' + tinggi + 'px; cursor: pointer; transition: background .2s; }\n' +
    '.sw .rel::before { content: ""; position: absolute; left: 4px; top: 4px; width: ' + gagang + 'px; height: ' + gagang + 'px; background: ' + gagangWarna + '; border-radius: 50%; transition: transform .2s; }\n' +
    '.sw input:checked + .rel { background: ' + nyala + '; }\n' +
    '.sw input:checked + .rel::before { transform: translateX(' + geser + 'px); }\n' +
    '.sw input:focus-visible + .rel { outline: 2px solid ' + nyala + '; outline-offset: 2px; }';
}

export function buatHtmlSwitch() {
  return '<label class="sw"><input type="checkbox"><span class="rel"></span></label>';
}

export function render(root) {
  const lebarR = T.input('range');
  lebarR.min = '40'; lebarR.max = '100'; lebarR.value = '56';
  const lebarV = T.el('<b>56px</b>');
  const lebarWrap = T.el('<div class="row" style="align-items:center"></div>');
  lebarWrap.appendChild(lebarR); lebarWrap.appendChild(lebarV);

  const nyalaI = T.input('color'); nyalaI.value = '#ff6f61';
  const matiI = T.input('color'); matiI.value = '#52525b';
  const gagangI = T.input('color'); gagangI.value = '#ffffff';

  const gaya = document.createElement('style');
  root.appendChild(gaya);
  const pratinjau = T.el('<div style="display:flex;gap:36px;align-items:center;flex-wrap:wrap;padding:30px 18px;background:#18181b;border-radius:12px;border:1px solid #27272a;margin:12px 0"></div>');
  const codeBox = T.out();
  const htmlBox = T.out();

  function pilihan() {
    return {
      lebar: parseInt(lebarR.value, 10),
      nyala: nyalaI.value,
      mati: matiI.value,
      gagang: gagangI.value,
    };
  }

  function paint() {
    const css = buatCssSwitch(pilihan());
    gaya.textContent = css;
    pratinjau.innerHTML =
      '<label style="display:flex;align-items:center;gap:12px;font-size:14px"><span class="sw"><input type="checkbox" checked><span class="rel"></span></span>Menyala</label>' +
      '<label style="display:flex;align-items:center;gap:12px;font-size:14px"><span class="sw"><input type="checkbox"><span class="rel"></span></span>Mati</label>';
    T.show(codeBox, preHtml(css));
    T.show(htmlBox, preHtml(buatHtmlSwitch()));
  }

  lebarR.addEventListener('input', () => { lebarV.textContent = lebarR.value + 'px'; paint(); });
  [nyalaI, matiI, gagangI].forEach((elm) => elm.addEventListener('input', paint));

  root.appendChild(T.field('Lebar switch', lebarWrap));
  root.appendChild(T.grid2(T.field('Warna saat menyala', nyalaI), T.field('Warna saat mati', matiI)));
  root.appendChild(T.field('Warna gagang', gagangI));
  root.appendChild(pratinjau);
  root.appendChild(T.el('<div class="hint" style="margin:10px 0 4px">Kode CSS:</div>'));
  root.appendChild(codeBox);
  root.appendChild(T.row(T.copyBtn(() => buatCssSwitch(pilihan()), 'Salin CSS')));
  root.appendChild(T.el('<div class="hint" style="margin:14px 0 4px">Kode HTML:</div>'));
  root.appendChild(htmlBox);
  root.appendChild(T.row(T.copyBtn(() => buatHtmlSwitch(), 'Salin HTML')));
  paint();
}
