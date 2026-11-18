import { h as T } from '../../core.js';

// Generator Glassmorphism CSS: kode CSS efek kaca buram (frosted glass)
// dengan pratinjau live. Geser pengaturannya, lihat hasilnya langsung di
// kartu kaca, lalu salin kodenya. Pratinjau memakai latar warna-warni
// supaya efek buramnya kelihatan; itu latar demo di dalam pratinjau saja,
// bukan bagian dari tampilan tool ini.
export const meta = {"id": "generator-glassmorphism-css", "name": "Generator Glassmorphism CSS", "cat": "desain", "icon": "🪟", "desc": "Kode CSS efek kaca buram dengan pratinjau langsung. Geser, lihat, salin.", "keywords": "glassmorphism,kaca buram,css,frosted glass,efek kaca", "since": "6.17.0"};

// Bangun kode CSS dari pengaturan (murni, bisa diuji tanpa DOM).
// o: {blur, opacity, saturation, radius, border, tint, shadow}
export function bangunCss(o) {
  const blur = Math.max(0, Math.min(40, Number(o.blur) || 0));
  const op = Math.max(0, Math.min(100, Number(o.opacity) || 0)) / 100;
  const sat = Math.max(0, Math.min(200, Number(o.saturation) || 0));
  const rad = Math.max(0, Math.min(60, Number(o.radius) || 0));
  const bd = Math.max(0, Math.min(100, Number(o.border) || 0)) / 100;
  const tint = String(o.tint || '#ffffff');
  const sh = o.shadow ? '\n  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);' : '';
  return `.kaca {\n  background: ${tint}${Math.round(op * 255).toString(16).padStart(2, '0')};\n  backdrop-filter: blur(${blur}px) saturate(${sat}%);\n  -webkit-backdrop-filter: blur(${blur}px) saturate(${sat}%);\n  border-radius: ${rad}px;\n  border: 1px solid rgba(255, 255, 255, ${bd.toFixed(2)});${sh}\n}`;
}

// 'rgba(255,255,255,0.2)' dari tint hex + opacity (murni, bisa diuji).
export function tintKeRgba(hex, opacity) {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(String(hex || '').trim());
  if (!m) return `rgba(255, 255, 255, ${(opacity / 100).toFixed(2)})`;
  const v = parseInt(m[1], 16);
  return `rgba(${(v >> 16) & 255}, ${(v >> 8) & 255}, ${v & 255}, ${(opacity / 100).toFixed(2)})`;
}

export function render(root) {
  const buatGeser = (label, min, maks, awal, satuan, hint) => {
    const range = T.input('range');
    range.min = String(min); range.max = String(maks); range.value = String(awal);
    const val = T.el(`<b>${awal}${satuan}</b>`);
    const wrap = T.el('<div class="row" style="align-items:center"></div>');
    wrap.appendChild(range); wrap.appendChild(val);
    range.addEventListener('input', () => {
      val.textContent = range.value + satuan;
      perbarui();
    });
    return { range, field: T.field(label, wrap, hint) };
  };
  const buram = buatGeser('Seberapa buram kacanya', 0, 40, 12, ' px', 'Makin besar, latar di belakang kaca makin tidak jelas.');
  const tembus = buatGeser('Seberapa tembus kacanya', 0, 100, 20, '%', 'Makin kecil, kaca makin bening.');
  const pekat = buatGeser('Seberapa pekat warnanya', 0, 200, 150, '%', 'Warna latar di belakang kaca jadi lebih hidup.');
  const lengkung = buatGeser('Seberapa melengkung sudutnya', 0, 60, 16, ' px');
  const garis = buatGeser('Seberapa jelas garis tepinya', 0, 100, 30, '%');
  const warnaInp = T.input('color');
  warnaInp.value = '#ffffff';
  warnaInp.addEventListener('input', perbarui);
  const bayangSel = T.select([['ya', 'Pakai bayangan'], ['tidak', 'Tanpa bayangan']], 'ya');
  bayangSel.addEventListener('change', perbarui);

  // Pratinjau: latar warna-warni + kartu kaca di atasnya.
  const panggung = T.el('<div style="position:relative;border-radius:12px;overflow:hidden;height:260px;background:linear-gradient(135deg,#ff6f61 0%,#ff9a5c 30%,#7c5cff 65%,#2fb9f2 100%)"></div>');
  const bulat1 = T.el('<div style="position:absolute;width:150px;height:150px;border-radius:50%;background:rgba(255,255,255,0.35);top:24px;left:24px"></div>');
  const bulat2 = T.el('<div style="position:absolute;width:110px;height:110px;border-radius:50%;background:rgba(0,0,0,0.18);bottom:28px;right:36px"></div>');
  const kartu = T.el('<div style="position:absolute;inset:48px 32px;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;color:#fff"></div>');
  kartu.innerHTML = '<div style="font-size:20px;font-weight:700">Kartu Kaca</div><div style="font-size:13px;opacity:0.9;margin-top:6px">Geser pengaturan di atas, lihat berubah di sini</div>';
  panggung.appendChild(bulat1);
  panggung.appendChild(bulat2);
  panggung.appendChild(kartu);

  const kodeBox = T.out();

  function nilai() {
    return {
      blur: parseInt(buram.range.value, 10),
      opacity: parseInt(tembus.range.value, 10),
      saturation: parseInt(pekat.range.value, 10),
      radius: parseInt(lengkung.range.value, 10),
      border: parseInt(garis.range.value, 10),
      tint: warnaInp.value,
      shadow: bayangSel.value === 'ya',
    };
  }

  function perbarui() {
    const o = nilai();
    kartu.style.background = tintKeRgba(o.tint, o.opacity);
    kartu.style.backdropFilter = `blur(${o.blur}px) saturate(${o.saturation}%)`;
    kartu.style.webkitBackdropFilter = `blur(${o.blur}px) saturate(${o.saturation}%)`;
    kartu.style.borderRadius = o.radius + 'px';
    kartu.style.border = `1px solid rgba(255, 255, 255, ${(o.border / 100).toFixed(2)})`;
    kartu.style.boxShadow = o.shadow ? '0 8px 32px rgba(0, 0, 0, 0.18)' : 'none';
    T.show(kodeBox, `<pre style="white-space:pre-wrap;word-break:break-word;background:#12100d;border:1px solid #2e2823;border-radius:8px;padding:12px;font-size:12.5px;line-height:1.5;overflow-x:auto">${T.esc(bangunCss(o))}</pre>`);
  }

  const salinB = T.copyBtn(() => bangunCss(nilai()), 'Salin Kode CSS');

  root.appendChild(buram.field);
  root.appendChild(tembus.field);
  root.appendChild(pekat.field);
  root.appendChild(lengkung.field);
  root.appendChild(garis.field);
  root.appendChild(T.field('Warna kacanya', warnaInp));
  root.appendChild(T.field('Bayangan di bawah kartu', bayangSel));
  root.appendChild(T.el('<p style="font-weight:700;margin:14px 0 8px">Pratinjau</p>'));
  root.appendChild(panggung);
  root.appendChild(T.el('<p style="font-weight:700;margin:14px 0 8px">Kode CSS-nya</p>'));
  root.appendChild(kodeBox);
  root.appendChild(salinB);
  root.appendChild(T.el('<p class="dim" style="font-size:12.5px;line-height:1.6">Tempel kode ini ke file CSS-mu, lalu tambahkan class <code>kaca</code> ke elemen yang mau dibuat seperti kaca. Efek buramnya hanya kelihatan bila ada sesuatu di belakang elemen itu.</p>'));
  perbarui();
}
