import { h as T, utils, copyBtn, dl } from '../../core.js?v=6.12.2';

// Logika murni (bisa di-test di Node): bangkitkan path blob organik.
// Titik-titik acak di sekeliling lingkaran, dihaluskan dengan kurva bezier.
utils.buatBlob = function (seed, titik, acak) {
  let s = Number(seed) || 1;
  const rnd = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
  const n = Math.max(4, Math.min(12, Math.round(Number(titik) || 6)));
  const a = Math.max(0, Math.min(1, Number(acak) || 0.4));
  const cx = 100, cy = 100, r0 = 70;
  const pts = [];
  for (let i = 0; i < n; i++) {
    const sudut = (i / n) * Math.PI * 2;
    const r = r0 * (1 - a / 2 + rnd() * a);
    pts.push([cx + Math.cos(sudut) * r, cy + Math.sin(sudut) * r]);
  }
  let d = 'M ' + pts[0][0].toFixed(1) + ' ' + pts[0][1].toFixed(1);
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d + ' Z';
};
utils.blobSvg = function (seed, titik, acak, warna) {
  const path = utils.buatBlob(seed, titik, acak);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><path d="${path}" fill="${warna || '#ffffff'}"/></svg>`;
};

export const meta = {"id": "bentuk-blob-svg", "name": "Bentuk Blob SVG", "cat": "desain", "icon": "🫧", "desc": "Buat bentuk blob organik untuk hiasan website, salin kodenya.", "keywords": "blob,svg,bentuk,organik,desain,shape,generator", "since": "6.11.0"};

export function render(root) {
  let seed = Math.floor(Math.random() * 100000) + 1;
  const titik = document.createElement('input');
  titik.type = 'range'; titik.min = '4'; titik.max = '12'; titik.value = '7';
  titik.style.cssText = 'width:100%';
  const acak = document.createElement('input');
  acak.type = 'range'; acak.min = '10'; acak.max = '90'; acak.value = '40';
  acak.style.cssText = 'width:100%';
  const warna = document.createElement('input');
  warna.type = 'color'; warna.value = '#ffffff';
  warna.style.cssText = 'width:64px;height:40px;padding:0;border:none;background:none;cursor:pointer';
  const pratinjau = T.el('<div style="background:#18181b;border-radius:12px;padding:24px;text-align:center;margin:16px 0"></div>');
  const kode = T.out();

  function perbarui() {
    const svg = utils.blobSvg(seed, titik.value, Number(acak.value) / 100, warna.value);
    pratinjau.innerHTML = '<div style="max-width:280px;margin:0 auto">' + svg + '</div>';
    T.show(kode, '<pre style="white-space:pre-wrap;word-break:break-all;font-size:12px;line-height:1.6;margin:0">' + svg.replace(/</g, '&lt;') + '</pre>');
  }

  [titik, acak, warna].forEach((el) => el.addEventListener('input', perbarui));

  root.appendChild(T.el('<p class="note">Blob adalah bentuk organik yang sering dipakai sebagai hiasan latar di website. Atur bentuknya, lalu salin kodenya.</p>'));
  root.appendChild(T.field('Jumlah lekukan', titik));
  root.appendChild(T.field('Seberapa acak bentuknya', acak));
  root.appendChild(T.field('Warna isi', warna));
  root.appendChild(T.row(
    T.btn('Bentuk baru', () => { seed = Math.floor(Math.random() * 100000) + 1; perbarui(); }, true),
    T.btn('Unduh SVG', () => {
      T.dl('blob.svg', utils.blobSvg(seed, titik.value, Number(acak.value) / 100, warna.value), 'image/svg+xml;charset=utf-8');
      T.toast('SVG berhasil diunduh');
    })
  ));
  root.appendChild(pratinjau);
  root.appendChild(copyBtn(() => utils.blobSvg(seed, titik.value, Number(acak.value) / 100, warna.value), 'Salin kode SVG'));
  root.appendChild(kode);
  perbarui();
}
