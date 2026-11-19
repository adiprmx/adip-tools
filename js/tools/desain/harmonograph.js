import { h as T, canvasToBlob } from '../../core.js';

export const meta = {"id":"harmonograph","name":"Harmonograph","cat":"desain","icon":"🌀","desc":"Gambar dengan 4 bandul virtual, simpan sebagai PNG atau SVG.","keywords":"harmonograph,bandul,spiral,mawar,gambar,svg,png","since":"6.19.0"};

// Satu bandul: A sin(2*pi*f*t + p) * e^(-d*t). x dari bandul 1+2, y dari 3+4.
export function titikHarmonograph(o, t) {
  const p = (b) => b.a * Math.sin(2 * Math.PI * b.f * t + b.p) * Math.exp(-b.d * t);
  return { x: p(o.b1) + p(o.b2), y: p(o.b3) + p(o.b4) };
}

// Seluruh jalur (fungsi murni, bisa diuji tanpa DOM).
export function buatJalurHarmonograph(o, langkah) {
  const n = Math.max(2, Math.min(20000, langkah || 4000));
  const pts = [];
  for (let i = 0; i <= n; i++) {
    pts.push(titikHarmonograph(o, i / n * (o.durasi || 20)));
  }
  return pts;
}

export function jalurKeSvg(pts, ukuran, warna) {
  const s = ukuran || 600;
  const skala = s / 2 * 0.92;
  let d = '';
  pts.forEach((p, i) => {
    const x = (s / 2 + p.x * skala).toFixed(2);
    const y = (s / 2 + p.y * skala).toFixed(2);
    d += (i === 0 ? 'M' : 'L') + x + ' ' + y + ' ';
  });
  return '<svg xmlns="http://www.w3.org/2000/svg" width="' + s + '" height="' + s + '" viewBox="0 0 ' + s + ' ' + s + '">' +
    '<rect width="' + s + '" height="' + s + '" fill="#161311"/>' +
    '<path d="' + d.trim() + '" fill="none" stroke="' + (warna || '#ff6f61') + '" stroke-width="1.2"/></svg>';
}

const PRESET = [
  ['mawar', 'Mawar', { b1: { f: 2, p: 0, a: 1, d: 0.02 }, b2: { f: 3, p: 1.57, a: 0.6, d: 0.03 }, b3: { f: 2, p: 1.57, a: 1, d: 0.02 }, b4: { f: 3, p: 0, a: 0.6, d: 0.03 }, durasi: 20 }],
  ['spiral', 'Spiral', { b1: { f: 1, p: 0, a: 1, d: 0.05 }, b2: { f: 2, p: 0.8, a: 0.5, d: 0.05 }, b3: { f: 1, p: 1.57, a: 1, d: 0.05 }, b4: { f: 2, p: 2.4, a: 0.5, d: 0.05 }, durasi: 20 }],
  ['bintang', 'Bintang', { b1: { f: 3, p: 0, a: 1, d: 0.015 }, b2: { f: 5, p: 0.5, a: 0.7, d: 0.02 }, b3: { f: 3, p: 1.57, a: 1, d: 0.015 }, b4: { f: 5, p: 2.1, a: 0.7, d: 0.02 }, durasi: 20 }],
  ['pita', 'Pita', { b1: { f: 1, p: 0, a: 1, d: 0.01 }, b2: { f: 4, p: 1.2, a: 0.4, d: 0.01 }, b3: { f: 2, p: 0.6, a: 1, d: 0.01 }, b4: { f: 3, p: 2.0, a: 0.4, d: 0.01 }, durasi: 20 }],
];

export function render(root) {
  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Empat bandul virtual mengayun bersama dan penanya menoreh pola. Pilih preset atau acak pengaturannya, lalu saksikan gambarnya jadi dan simpan sebagai PNG atau SVG.</p>'));

  const presetSel = T.select(PRESET.map(([v, l]) => [v, l]), 'mawar');
  root.appendChild(T.field('Preset pola', presetSel));
  const warnaI = T.el('<input type="color" value="#ff6f61" style="width:52px;height:42px;border:1px solid #27272a;border-radius:8px;background:none;padding:2px;cursor:pointer">');
  const kecepatanR = T.input('range'); kecepatanR.min = '1'; kecepatanR.max = '10'; kecepatanR.value = '5';
  const kecepatanV = T.el('<span class="hint">5</span>');
  const rowK = T.el('<div style="display:flex;gap:8px;align-items:center"></div>');
  rowK.appendChild(kecepatanR); rowK.appendChild(kecepatanV);
  root.appendChild(T.grid2(T.field('Warna garis', warnaI), T.field('Kecepatan gambar', rowK)));

  const canvas = document.createElement('canvas');
  canvas.width = 600; canvas.height = 600;
  canvas.style.cssText = 'width:100%;max-width:600px;height:auto;border-radius:12px;border:1px solid var(--line);display:block;margin:12px auto;background:#161311';
  root.appendChild(canvas);

  let raf = null, pts = [], idx = 0, alive = true;
  T.onLeave(() => { alive = false; if (raf) cancelAnimationFrame(raf); });

  function opsiAktif() {
    const p = PRESET.find(([v]) => v === presetSel.value) || PRESET[0];
    return JSON.parse(JSON.stringify(p[2]));
  }

  function gambarSemua() {
    const o = opsiAktif();
    pts = buatJalurHarmonograph(o, 6000);
    const ctx = canvas.getContext('2d');
    if (!ctx) { T.toast('Gambar tidak bisa dibuat di perangkat ini'); return; }
    ctx.fillStyle = '#161311';
    ctx.fillRect(0, 0, 600, 600);
    ctx.strokeStyle = warnaI.value;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    pts.forEach((p, i) => {
      const x = 300 + p.x * 276, y = 300 + p.y * 276;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();
  }

  function animasi() {
    if (raf) cancelAnimationFrame(raf);
    const o = opsiAktif();
    pts = buatJalurHarmonograph(o, 6000);
    const ctx = canvas.getContext('2d');
    if (!ctx) { T.toast('Gambar tidak bisa dibuat di perangkat ini'); return; }
    ctx.fillStyle = '#161311';
    ctx.fillRect(0, 0, 600, 600);
    ctx.strokeStyle = warnaI.value;
    ctx.lineWidth = 1.2;
    idx = 0;
    const perFrame = 12 * parseInt(kecepatanR.value, 10);
    const langkah = () => {
      if (!alive) return;
      const sampai = Math.min(pts.length, idx + perFrame);
      ctx.beginPath();
      if (idx === 0) ctx.moveTo(300 + pts[0].x * 276, 300 + pts[0].y * 276);
      else ctx.moveTo(300 + pts[idx - 1].x * 276, 300 + pts[idx - 1].y * 276);
      for (let i = idx; i < sampai; i++) ctx.lineTo(300 + pts[i].x * 276, 300 + pts[i].y * 276);
      ctx.stroke();
      idx = sampai;
      if (idx < pts.length) raf = requestAnimationFrame(langkah);
    };
    raf = requestAnimationFrame(langkah);
  }

  function acak() {
    const acakBandul = () => ({ f: 1 + Math.floor(Math.random() * 5), p: Math.round(Math.random() * 628) / 100, a: 0.4 + Math.random() * 0.6, d: 0.005 + Math.random() * 0.04 });
    const o = { b1: acakBandul(), b2: acakBandul(), b3: acakBandul(), b4: acakBandul(), durasi: 20 };
    PRESET.push(['acak-' + Date.now(), 'Acak', o]);
    presetSel.innerHTML = '';
    PRESET.forEach(([v, l]) => {
      const op = document.createElement('option');
      op.value = v; op.textContent = l;
      presetSel.appendChild(op);
    });
    presetSel.value = PRESET[PRESET.length - 1][0];
    animasi();
  }

  kecepatanR.addEventListener('input', () => { kecepatanV.textContent = kecepatanR.value; });
  presetSel.addEventListener('change', animasi);
  warnaI.addEventListener('input', gambarSemua);

  const dlPng = T.btn('Unduh PNG', async () => {
    try {
      const blob = await canvasToBlob(canvas, 'image/png');
      if (!blob) { T.toast('Gambarnya tidak bisa dibuat. Coba lagi.'); return; }
      T.dl('harmonograph.png', blob, 'image/png');
      T.toast('Berhasil diunduh');
    } catch (e) { T.toast('Gambarnya tidak bisa diunduh. Coba lagi.'); }
  }, true);
  const dlSvg = T.btn('Unduh SVG', () => {
    if (!pts.length) { T.toast('Gambar dulu polanya'); return; }
    T.dl('harmonograph.svg', jalurKeSvg(pts, 600, warnaI.value), 'image/svg+xml');
    T.toast('Berhasil diunduh');
  });

  root.appendChild(T.row(T.btn('Gambar Ulang', animasi), T.btn('Acak', acak)));
  root.appendChild(T.el('<div style="height:8px"></div>'));
  root.appendChild(T.row(dlPng, dlSvg));
  animasi();
}
