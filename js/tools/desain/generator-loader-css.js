import { h as T } from '../../core.js';

// Generator Loader CSS: animasi loading CSS dari berbagai tipe, warna,
// dan ukuran, dengan pratinjau yang benar-benar bergerak. BEDA dari
// Animasi CSS Generator (animasi-css.js) yang membuat @keyframes umum
// (gerak, putar, skala, fade); di sini fokusnya loader siap pakai —
// pilih tipenya, salin kodenya, tempel ke web-mu.
export const meta = {"id": "generator-loader-css", "name": "Generator Loader CSS", "cat": "desain", "icon": "⏳", "desc": "Animasi loading CSS siap pakai: pilih tipe, warna, ukuran, lalu salin kodenya.", "keywords": "loader,loading,spinner,animasi,css,memuat", "since": "6.17.0"};

export const TIPE = {
  putar: { label: 'Cincin Berputar', html: '<div class="loader"></div>' },
  titik: { label: 'Titik Memantul', html: '<div class="loader"><span></span><span></span><span></span></div>' },
  bar: { label: 'Batang Berjalan', html: '<div class="loader"></div>' },
  denyut: { label: 'Lingkaran Berdenyut', html: '<div class="loader"></div>' },
  cincinGanda: { label: 'Cincin Ganda', html: '<div class="loader"></div>' },
  batangTegak: { label: 'Batang Tegak', html: '<div class="loader"><span></span><span></span><span></span><span></span></div>' },
};

// Bangun CSS loader dari pengaturan (murni, bisa diuji tanpa DOM).
// o: {tipe, warna, ukuran, cepat} — cepat dalam milidetik per putaran.
export function bangunLoaderCss(o) {
  const tipe = TIPE[o.tipe] ? o.tipe : 'putar';
  const warna = /^#[0-9a-fA-F]{6}$/.test(String(o.warna || '')) ? o.warna : '#ff6f61';
  const ukuran = Math.max(12, Math.min(200, Number(o.ukuran) || 48));
  const detik = (Math.max(300, Math.min(5000, Number(o.cepat) || 1000)) / 1000).toFixed(2).replace(/0$/, '');
  if (tipe === 'putar') {
    return `.loader {\n  width: ${ukuran}px;\n  height: ${ukuran}px;\n  border-radius: 50%;\n  border: ${Math.max(2, Math.round(ukuran / 8))}px solid rgba(0, 0, 0, 0.1);\n  border-top-color: ${warna};\n  animation: putar ${detik}s linear infinite;\n}\n@keyframes putar {\n  to { transform: rotate(360deg); }\n}`;
  }
  if (tipe === 'titik') {
    const d = Math.round(ukuran / 4);
    return `.loader {\n  display: flex;\n  gap: ${Math.round(d / 2)}px;\n}\n.loader span {\n  width: ${d}px;\n  height: ${d}px;\n  border-radius: 50%;\n  background: ${warna};\n  animation: pantul ${detik}s ease-in-out infinite;\n}\n.loader span:nth-child(2) { animation-delay: ${(parseFloat(detik) / 4).toFixed(2)}s; }\n.loader span:nth-child(3) { animation-delay: ${(parseFloat(detik) / 2).toFixed(2)}s; }\n@keyframes pantul {\n  0%, 100% { transform: translateY(0); }\n  50% { transform: translateY(-${Math.round(ukuran / 3)}px); }\n}`;
  }
  if (tipe === 'bar') {
    return `.loader {\n  width: ${ukuran * 2}px;\n  height: ${Math.max(4, Math.round(ukuran / 8))}px;\n  background: rgba(0, 0, 0, 0.1);\n  border-radius: 99px;\n  overflow: hidden;\n  position: relative;\n}\n.loader::after {\n  content: "";\n  position: absolute;\n  top: 0;\n  left: 0;\n  height: 100%;\n  width: 40%;\n  background: ${warna};\n  border-radius: 99px;\n  animation: jalan ${detik}s ease-in-out infinite;\n}\n@keyframes jalan {\n  0% { left: -40%; }\n  100% { left: 100%; }\n}`;
  }
  if (tipe === 'denyut') {
    return `.loader {\n  width: ${ukuran}px;\n  height: ${ukuran}px;\n  border-radius: 50%;\n  background: ${warna};\n  animation: denyut ${detik}s ease-in-out infinite;\n}\n@keyframes denyut {\n  0%, 100% { transform: scale(0.6); opacity: 0.5; }\n  50% { transform: scale(1); opacity: 1; }\n}`;
  }
  if (tipe === 'cincinGanda') {
    return `.loader {\n  width: ${ukuran}px;\n  height: ${ukuran}px;\n  border-radius: 50%;\n  border: ${Math.max(2, Math.round(ukuran / 10))}px solid transparent;\n  border-top-color: ${warna};\n  border-bottom-color: ${warna};\n  animation: putar ${detik}s linear infinite;\n}\n@keyframes putar {\n  to { transform: rotate(360deg); }\n}`;
  }
  // batangTegak
  const bw = Math.max(4, Math.round(ukuran / 6));
  return `.loader {\n  display: flex;\n  gap: ${Math.round(bw / 2)}px;\n  align-items: flex-end;\n  height: ${ukuran}px;\n}\n.loader span {\n  width: ${bw}px;\n  height: 100%;\n  background: ${warna};\n  border-radius: 4px;\n  animation: naik ${detik}s ease-in-out infinite;\n}\n.loader span:nth-child(2) { animation-delay: ${(parseFloat(detik) / 5).toFixed(2)}s; }\n.loader span:nth-child(3) { animation-delay: ${(parseFloat(detik) / 5 * 2).toFixed(2)}s; }\n.loader span:nth-child(4) { animation-delay: ${(parseFloat(detik) / 5 * 3).toFixed(2)}s; }\n@keyframes naik {\n  0%, 100% { transform: scaleY(0.3); }\n  50% { transform: scaleY(1); }\n}`;
}

export function render(root) {
  const tipeSel = T.select(Object.entries(TIPE).map(([v, t]) => [v, t.label]), 'putar');
  const warnaInp = T.input('color');
  warnaInp.value = '#ff6f61';
  const buatGeser = (label, min, maks, awal, satuan, hint) => {
    const range = T.input('range');
    range.min = String(min); range.max = String(maks); range.step = '10'; range.value = String(awal);
    const val = T.el(`<b>${awal}${satuan}</b>`);
    const wrap = T.el('<div class="row" style="align-items:center"></div>');
    wrap.appendChild(range); wrap.appendChild(val);
    range.addEventListener('input', () => {
      val.textContent = range.value + satuan;
      perbarui();
    });
    return { range, field: T.field(label, wrap, hint) };
  };
  const ukuran = buatGeser('Ukuran loader', 20, 120, 48, ' px');
  const cepat = buatGeser('Kecepatan satu putaran', 400, 3000, 1000, ' ms', 'Makin kecil angkanya, makin cepat geraknya.');

  // Pratinjau: panggung + <style> yang diisi CSS hasil.
  const panggung = T.el('<div style="border:1px solid #2e2823;border-radius:12px;height:180px;display:flex;align-items:center;justify-content:center;background:#12100d;overflow:hidden"></div>');
  const gayaPratinjau = document.createElement('style');
  const wadahLoader = T.el('<div></div>');
  panggung.appendChild(wadahLoader);
  T.onLeave(() => gayaPratinjau.remove());

  const kodeBox = T.out();

  function nilai() {
    return {
      tipe: tipeSel.value,
      warna: warnaInp.value,
      ukuran: parseInt(ukuran.range.value, 10),
      cepat: parseInt(cepat.range.value, 10),
    };
  }

  function perbarui() {
    const o = nilai();
    const css = bangunLoaderCss(o);
    gayaPratinjau.textContent = css;
    if (!gayaPratinjau.parentNode) document.head.appendChild(gayaPratinjau);
    wadahLoader.innerHTML = TIPE[o.tipe].html;
    const htmlKode = TIPE[o.tipe].html;
    T.show(kodeBox, `<p style="font-weight:700;margin:0 0 6px">HTML-nya</p><pre style="white-space:pre-wrap;word-break:break-word;background:#12100d;border:1px solid #2e2823;border-radius:8px;padding:12px;font-size:12.5px;line-height:1.5;overflow-x:auto">${T.esc(htmlKode)}</pre><p style="font-weight:700;margin:12px 0 6px">CSS-nya</p><pre style="white-space:pre-wrap;word-break:break-word;background:#12100d;border:1px solid #2e2823;border-radius:8px;padding:12px;font-size:12.5px;line-height:1.5;overflow-x:auto">${T.esc(css)}</pre>`);
  }

  tipeSel.addEventListener('change', perbarui);
  warnaInp.addEventListener('input', perbarui);

  const salinCssB = T.copyBtn(() => bangunLoaderCss(nilai()), 'Salin CSS');
  const salinHtmlB = T.copyBtn(() => TIPE[nilai().tipe].html, 'Salin HTML');

  root.appendChild(T.field('Tipe loader', tipeSel));
  root.appendChild(T.field('Warna loader', warnaInp));
  root.appendChild(ukuran.field);
  root.appendChild(cepat.field);
  root.appendChild(T.el('<p style="font-weight:700;margin:14px 0 8px">Pratinjau (bergerak langsung)</p>'));
  root.appendChild(panggung);
  root.appendChild(T.el('<p style="font-weight:700;margin:14px 0 8px">Kodenya</p>'));
  root.appendChild(kodeBox);
  root.appendChild(T.row(salinHtmlB, salinCssB));
  root.appendChild(T.el('<p class="dim" style="font-size:12.5px;line-height:1.6">Tempel HTML-nya di tempat loading muncul, dan CSS-nya di file CSS-mu. Animasinya jalan sendiri tanpa JavaScript.</p>'));
  perbarui();
}
