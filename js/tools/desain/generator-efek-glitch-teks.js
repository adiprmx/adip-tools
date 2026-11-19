import { h as T } from '../../core.js';

export const meta = {"id":"generator-efek-glitch-teks","name":"Generator Efek Glitch Teks","cat":"desain","icon":"📺","desc":"Buat efek glitch teks CSS murni, siap salin kodenya.","keywords":"glitch,teks,css,animasi,efek,teks rusak","since":"6.19.0"};

// PRNG berbiji (mulberry32) supaya potongan glitch stabil per pengaturan.
export function acakBerbiji(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function potongan(rnd, jumlah) {
  const out = [];
  for (let i = 0; i < jumlah; i++) {
    const atas = Math.floor(rnd() * 80);
    const bawah = atas + 5 + Math.floor(rnd() * 20);
    out.push([atas, Math.min(100, bawah)]);
  }
  return out;
}

// CSS glitch murni (fungsi murni, bisa diuji tanpa DOM).
export function buatCssGlitch(o) {
  const geser = Math.min(20, Math.max(1, parseInt((o && o.geser) || '4', 10) || 4));
  const cepat = Math.min(5, Math.max(0.5, parseFloat((o && o.kecepatan) || '2') || 2));
  const c1 = (o && o.warna1) || '#00fff9';
  const c2 = (o && o.warna2) || '#ff00c1';
  const rnd = acakBerbiji(1337 + geser * 31 + Math.round(cepat * 10));
  const p1 = potongan(rnd, 6);
  const p2 = potongan(rnd, 6);
  const frame = (nama, pot) => {
    let s = '@keyframes ' + nama + ' {\n';
    pot.forEach(([a, b], i) => {
      s += '  ' + Math.round(i * 100 / (pot.length - 1)) + '% { clip-path: inset(' + a + '% 0 ' + (100 - b) + '% 0); }\n';
    });
    s += '}';
    return s;
  };
  return '.glitch {\n  position: relative;\n  color: #f6f1e8;\n  font-weight: 800;\n}\n' +
    '.glitch::before,\n.glitch::after {\n  content: attr(data-text);\n  position: absolute;\n  left: 0;\n  top: 0;\n  width: 100%;\n  overflow: hidden;\n}\n' +
    '.glitch::before {\n  color: ' + c1 + ';\n  transform: translate(' + (-geser) + 'px, 0);\n  animation: glitch-1 ' + cepat + 's infinite linear alternate-reverse;\n}\n' +
    '.glitch::after {\n  color: ' + c2 + ';\n  transform: translate(' + geser + 'px, 0);\n  animation: glitch-2 ' + cepat + 's infinite linear alternate-reverse;\n}\n' +
    frame('glitch-1', p1) + '\n' + frame('glitch-2', p2);
}

export function buatHtmlGlitch(teks) {
  const t = (teks || '').trim() || 'GLITCH';
  return '<span class="glitch" data-text="' + t.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '">' + t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</span>';
}

export function render(root) {
  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Ketik teksnya, atur geseran dan kecepatannya, lalu salin CSS dan HTML-nya. Efeknya murni CSS, tanpa JavaScript dan tanpa gambar.</p>'));

  const teksI = T.input('text', 'Teks glitch, contoh: ERROR 404');
  teksI.value = 'GLITCH';
  teksI.maxLength = 40;
  root.appendChild(T.field('Teks', teksI));

  const geserR = T.input('range'); geserR.min = '1'; geserR.max = '20'; geserR.value = '4';
  const geserV = T.el('<span class="hint">4px</span>');
  const cepatR = T.input('range'); cepatR.min = '0.5'; cepatR.max = '5'; cepatR.step = '0.5'; cepatR.value = '2';
  const cepatV = T.el('<span class="hint">2 detik</span>');
  const rowG = T.el('<div style="display:flex;gap:8px;align-items:center"></div>');
  rowG.appendChild(geserR); rowG.appendChild(geserV);
  const rowC = T.el('<div style="display:flex;gap:8px;align-items:center"></div>');
  rowC.appendChild(cepatR); rowC.appendChild(cepatV);
  root.appendChild(T.grid2(T.field('Jarak geser bayangan', rowG), T.field('Kecepatan animasi', rowC)));

  const w1 = T.el('<input type="color" value="#00fff9" style="width:52px;height:42px;border:1px solid #27272a;border-radius:8px;background:none;padding:2px;cursor:pointer">');
  const w2 = T.el('<input type="color" value="#ff00c1" style="width:52px;height:42px;border:1px solid #27272a;border-radius:8px;background:none;padding:2px;cursor:pointer">');
  const rowW = T.el('<div style="display:flex;gap:6px;align-items:center"></div>');
  rowW.appendChild(T.el('<span class="hint">Bayangan 1</span>'));
  rowW.appendChild(w1);
  rowW.appendChild(T.el('<span class="hint" style="margin-left:6px">Bayangan 2</span>'));
  rowW.appendChild(w2);
  root.appendChild(T.field('Warna bayangan', rowW));

  const stage = T.el('<div style="background:#100e0c;border:1px solid var(--line);border-radius:12px;padding:36px 16px;margin:12px 0;text-align:center;overflow:hidden"></div>');
  const styleTag = document.createElement('style');
  const prev = T.el('<span class="glitch" style="font-size:clamp(28px,8vw,56px);letter-spacing:0.02em">GLITCH</span>');
  stage.appendChild(styleTag);
  stage.appendChild(prev);
  root.appendChild(stage);

  const cssBox = T.out();
  const htmlBox = T.out();
  const opsi = () => ({ geser: geserR.value, kecepatan: cepatR.value, warna1: w1.value, warna2: w2.value });

  function paint() {
    const teks = teksI.value.trim() || 'GLITCH';
    prev.textContent = teks;
    prev.setAttribute('data-text', teks);
    styleTag.textContent = buatCssGlitch(opsi());
    cssBox.innerHTML = '';
    const pre1 = document.createElement('pre');
    pre1.style.cssText = 'white-space:pre-wrap;font-family:var(--font-m);font-size:12.5px;line-height:1.6;margin:0';
    pre1.textContent = buatCssGlitch(opsi());
    cssBox.appendChild(pre1);
    htmlBox.innerHTML = '';
    const pre2 = document.createElement('pre');
    pre2.style.cssText = 'white-space:pre-wrap;font-family:var(--font-m);font-size:12.5px;line-height:1.6;margin:0';
    pre2.textContent = buatHtmlGlitch(teks);
    htmlBox.appendChild(pre2);
  }

  [teksI, geserR, cepatR, w1, w2].forEach((el) => el.addEventListener('input', () => {
    geserV.textContent = geserR.value + 'px';
    cepatV.textContent = cepatR.value + ' detik';
    paint();
  }));

  root.appendChild(T.el('<div class="hint" style="margin:8px 0 4px">Kode CSS:</div>'));
  root.appendChild(cssBox);
  root.appendChild(T.el('<div class="hint" style="margin:8px 0 4px">Kode HTML:</div>'));
  root.appendChild(htmlBox);
  root.appendChild(T.row(T.copyBtn(() => buatCssGlitch(opsi()), 'Salin CSS'), T.copyBtn(() => buatHtmlGlitch(teksI.value), 'Salin HTML')));
  paint();
}
