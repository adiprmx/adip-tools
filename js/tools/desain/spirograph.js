import { h as T, canvasToBlob, utils } from '../../core.js';

export const meta = {"id":"spirograph","name":"Spirograph","cat":"desain","icon":"✳️","desc":"Putar roda gigi di dalam cincin seperti mainan klasik, simpan PNG atau SVG.","keywords":"spirograph,roda gigi,hipotrokoid,epitrokoid,pola,gambar","since":"6.19.0"};

// Hipotrokoid (roda di dalam cincin) dan epitrokoid (roda di luar cincin).
export function titikSpirograph(o, t) {
  const R = o.R, r = o.r, d = o.d;
  if (o.jenis === 'epi') {
    const k = (R + r) / r;
    return { x: (R + r) * Math.cos(t) - d * Math.cos(k * t), y: (R + r) * Math.sin(t) - d * Math.sin(k * t) };
  }
  const k = (R - r) / r;
  return { x: (R - r) * Math.cos(t) + d * Math.cos(k * t), y: (R - r) * Math.sin(t) - d * Math.sin(k * t) };
}

// Satu pola penuh tertutup setelah t = 2*pi * r / gcd(R, r).
export function periodeSpirograph(R, r) {
  const g = utils.gcd(Math.round(R), Math.round(r)) || 1;
  return 2 * Math.PI * (Math.round(r) / g);
}

export function buatJalurSpirograph(o, langkah) {
  const total = periodeSpirograph(o.R, o.r);
  const n = Math.max(100, Math.min(20000, langkah || 4000));
  const pts = [];
  for (let i = 0; i <= n; i++) pts.push(titikSpirograph(o, i / n * total));
  return pts;
}

export function jalurSpiroKeSvg(lapisan, ukuran) {
  const s = ukuran || 600;
  const Rmaks = Math.max.apply(null, lapisan.map((l) => l.o.jenis === 'epi' ? l.o.R + l.o.r + l.o.d : l.o.R + l.o.d));
  const skala = s / 2 * 0.92 / (Rmaks || 1);
  let paths = '';
  lapisan.forEach((l) => {
    let d = '';
    l.pts.forEach((p, i) => {
      const x = (s / 2 + p.x * skala).toFixed(2);
      const y = (s / 2 + p.y * skala).toFixed(2);
      d += (i === 0 ? 'M' : 'L') + x + ' ' + y + ' ';
    });
    paths += '<path d="' + d.trim() + '" fill="none" stroke="' + l.warna + '" stroke-width="1.4"/>';
  });
  return '<svg xmlns="http://www.w3.org/2000/svg" width="' + s + '" height="' + s + '" viewBox="0 0 ' + s + ' ' + s + '">' +
    '<rect width="' + s + '" height="' + s + '" fill="#161311"/>' + paths + '</svg>';
}

const WARNA_LAPIS = ['#ff6f61', '#7ccf8f', '#8ab8ff', '#fbbf24', '#e8a0a8', '#7fdbda'];

export function render(root) {
  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Seperti mainan spirograph klasik: roda gigi berputar di dalam atau di luar cincin, dan penanya menggambar pola. Tambah lapisan warna untuk pola yang lebih ramai.</p>'));

  const jenisSel = T.select([['hipo', 'Roda di dalam cincin'], ['epi', 'Roda di luar cincin']], 'hipo');
  root.appendChild(T.field('Jenis putaran', jenisSel));

  const buatSlider = (label, min, maks, nilai) => {
    const r = T.input('range'); r.min = String(min); r.max = String(maks); r.value = String(nilai);
    const v = T.el('<span class="hint">' + nilai + '</span>');
    const row = T.el('<div style="display:flex;gap:8px;align-items:center"></div>');
    row.appendChild(r); row.appendChild(v);
    r.addEventListener('input', () => { v.textContent = r.value; gambar(); });
    return { el: T.field(label, row), r };
  };
  const sR = buatSlider('Cincin (R)', 40, 120, 105);
  const sRoda = buatSlider('Roda (r)', 10, 100, 42);
  const sPena = buatSlider('Jarak pena (d)', 5, 100, 63);
  root.appendChild(sR.el);
  root.appendChild(sRoda.el);
  root.appendChild(sPena.el);

  const canvas = document.createElement('canvas');
  canvas.width = 600; canvas.height = 600;
  canvas.style.cssText = 'width:100%;max-width:600px;height:auto;border-radius:12px;border:1px solid var(--line);display:block;margin:12px auto;background:#161311';
  root.appendChild(canvas);

  let lapisan = [];
  let alive = true;
  T.onLeave(() => { alive = false; });

  function opsiAktif() {
    return { jenis: jenisSel.value, R: parseInt(sR.r.value, 10), r: parseInt(sRoda.r.value, 10), d: parseInt(sPena.r.value, 10) };
  }

  function gambar() {
    if (!alive) return;
    const o = opsiAktif();
    if (o.jenis === 'hipo' && o.r >= o.R) {
      T.toast('Roda harus lebih kecil dari cincin');
      return;
    }
    const pts = buatJalurSpirograph(o, 4000);
    const warna = WARNA_LAPIS[lapisan.length % WARNA_LAPIS.length];
    lapisan = [{ o, pts, warna }];
    gambarLapisan();
  }

  function gambarLapisan() {
    const ctx = canvas.getContext('2d');
    if (!ctx) { T.toast('Gambar tidak bisa dibuat di perangkat ini'); return; }
    ctx.fillStyle = '#161311';
    ctx.fillRect(0, 0, 600, 600);
    const Rmaks = Math.max.apply(null, lapisan.map((l) => l.o.jenis === 'epi' ? l.o.R + l.o.r + l.o.d : l.o.R + l.o.d));
    const skala = 276 / (Rmaks || 1);
    lapisan.forEach((l) => {
      ctx.strokeStyle = l.warna;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      l.pts.forEach((p, i) => {
        const x = 300 + p.x * skala, y = 300 + p.y * skala;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.stroke();
    });
    infoLapisan.textContent = lapisan.length + ' lapisan. ' + lapisan.map((l, i) => 'Lapisan ' + (i + 1) + ': R' + l.o.R + ' r' + l.o.r + ' d' + l.o.d).join('. ');
  }

  const infoLapisan = T.el('<div class="hint" style="margin-bottom:8px"></div>');
  root.appendChild(infoLapisan);

  function tambahLapisan() {
    const o = opsiAktif();
    if (o.jenis === 'hipo' && o.r >= o.R) { T.toast('Roda harus lebih kecil dari cincin'); return; }
    const pts = buatJalurSpirograph(o, 4000);
    lapisan.push({ o, pts, warna: WARNA_LAPIS[lapisan.length % WARNA_LAPIS.length] });
    gambarLapisan();
  }

  jenisSel.addEventListener('change', gambar);

  const dlPng = T.btn('Unduh PNG', async () => {
    try {
      const blob = await canvasToBlob(canvas, 'image/png');
      if (!blob) { T.toast('Gambarnya tidak bisa dibuat. Coba lagi.'); return; }
      T.dl('spirograph.png', blob, 'image/png');
      T.toast('Berhasil diunduh');
    } catch (e) { T.toast('Gambarnya tidak bisa diunduh. Coba lagi.'); }
  }, true);
  const dlSvg = T.btn('Unduh SVG', () => {
    if (!lapisan.length) { T.toast('Gambar dulu polanya'); return; }
    T.dl('spirograph.svg', jalurSpiroKeSvg(lapisan, 600), 'image/svg+xml');
    T.toast('Berhasil diunduh');
  });

  root.appendChild(T.row(T.btn('Gambar Ulang', gambar), T.btn('Tambah Lapisan', tambahLapisan)));
  root.appendChild(T.el('<div style="height:8px"></div>'));
  root.appendChild(T.row(dlPng, dlSvg));
  gambar();
}
