import { h as T, utils } from '../../core.js';

export const meta = {"id": "particle-life", "name": "Particle Life", "cat": "pelajar", "icon": "✨", "desc": "Ratusan partikel warna-warni yang saling tarik dan tolak. Pola hidup muncul sendiri dari aturan sederhana.", "keywords": "particle life,partikel,simulasi,emergen,atraksi,fisika,canvas", "since": "6.19.0"};

// Satu langkah simulasi (murni, bisa diuji): partikel {x, y, vx, vy, c}.
// opts: {lebar, tinggi, radius, tolak, redam, maksV}. Matriks KxK: nilai
// -1 (tolak kuat) sampai +1 (tarik kuat). Tepi melingkar (torus).
export function langkahPartikel(ps, matriks, opts) {
  const { lebar, tinggi, radius, tolak, redam, maksV } = opts;
  const n = ps.length;
  const out = ps.map((p) => ({ x: p.x, y: p.y, vx: p.vx, vy: p.vy, c: p.c }));
  for (let i = 0; i < n; i++) {
    let fx = 0, fy = 0;
    const a = ps[i];
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      const b = ps[j];
      let dx = b.x - a.x;
      let dy = b.y - a.y;
      // jarak terpendek di dunia torus
      if (dx > lebar / 2) dx -= lebar; else if (dx < -lebar / 2) dx += lebar;
      if (dy > tinggi / 2) dy -= tinggi; else if (dy < -tinggi / 2) dy += tinggi;
      const d2 = dx * dx + dy * dy;
      if (d2 >= radius * radius || d2 === 0) continue;
      const d = Math.sqrt(d2);
      const g = matriks[a.c][b.c];
      let f;
      if (d < tolak) f = (d / tolak - 1) * 2; // tolak keras saat terlalu dekat
      else f = g * (1 - (d - tolak) / (radius - tolak));
      fx += (dx / d) * f;
      fy += (dy / d) * f;
    }
    let vx = (a.vx + fx * 0.05) * redam;
    let vy = (a.vy + fy * 0.05) * redam;
    const v = Math.sqrt(vx * vx + vy * vy);
    if (v > maksV) { vx = (vx / v) * maksV; vy = (vy / v) * maksV; }
    let x = a.x + vx;
    let y = a.y + vy;
    if (x < 0) x += lebar; else if (x >= lebar) x -= lebar;
    if (y < 0) y += tinggi; else if (y >= tinggi) y -= tinggi;
    out[i].x = x; out[i].y = y; out[i].vx = vx; out[i].vy = vy;
  }
  return out;
}

export const WARNA = ['#f5f0e6', '#ff7a66', '#e8c15a', '#7ec8a9', '#7aa2e8'];
export const K = WARNA.length;

export function matriksAcak() {
  return Array.from({ length: K }, () =>
    Array.from({ length: K }, () => Math.round((Math.random() * 2 - 1) * 100) / 100));
}

export const PRESET = {
  acak: null,
  gumpal: [[0.8, 0.3, -0.2, 0.1, 0.0], [0.3, 0.8, 0.2, -0.3, 0.1], [-0.2, 0.2, 0.8, 0.3, -0.1], [0.1, -0.3, 0.3, 0.8, 0.2], [0.0, 0.1, -0.1, 0.2, 0.8]],
  kejar: [[0.2, -0.8, 0.0, 0.0, 0.0], [0.8, 0.2, -0.8, 0.0, 0.0], [0.0, 0.8, 0.2, -0.8, 0.0], [0.0, 0.0, 0.8, 0.2, -0.8], [-0.8, 0.0, 0.0, 0.8, 0.2]],
  seimbang: [[0.5, -0.5, 0.3, -0.3, 0.2], [-0.5, 0.5, -0.3, 0.3, -0.2], [0.3, -0.3, 0.5, -0.5, 0.3], [-0.3, 0.3, -0.5, 0.5, -0.3], [0.2, -0.2, 0.3, -0.3, 0.5]],
};

export function render(root) {
  const LEBAR = 360, TINGGI = 240;
  let jumlah = 300;
  let ps = [];
  let matriks = matriksAcak();
  let jalan = false;
  let raf = null;
  const opts = { lebar: LEBAR, tinggi: TINGGI, radius: 30, tolak: 10, redam: 0.85, maksV: 2.5 };

  const canvas = document.createElement('canvas');
  canvas.width = LEBAR;
  canvas.height = TINGGI;
  canvas.style.cssText = 'width:100%;max-width:360px;height:auto;display:block;background:#12100d;border:1px solid #2e2823;border-radius:8px';
  const ctx = canvas.getContext('2d');
  const stat = T.out();
  const presetI = T.select([['acak', 'Aturan acak'], ['gumpal', 'Gumpal (saling tarik)'], ['kejar', 'Kejar-kejaran'], ['seimbang', 'Seimbang (tarik-tolak)']], 'acak');
  const jumI = T.select([['150', '150 partikel'], ['300', '300 partikel'], ['500', '500 partikel']], '300');

  const isiPartikel = () => {
    ps = Array.from({ length: jumlah }, () => ({
      x: Math.random() * LEBAR, y: Math.random() * TINGGI,
      vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.5,
      c: Math.floor(Math.random() * K),
    }));
  };

  const gambar = () => {
    ctx.fillStyle = '#12100d';
    ctx.fillRect(0, 0, LEBAR, TINGGI);
    for (const p of ps) {
      ctx.fillStyle = WARNA[p.c];
      ctx.beginPath();
      ctx.arc(p.x, p.y, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const putar = () => {
    if (!jalan) return;
    ps = langkahPartikel(ps, matriks, opts);
    gambar();
    raf = requestAnimationFrame(putar);
  };

  const mulai = () => {
    if (jalan) return;
    jalan = true;
    tombolJalan.textContent = 'Jeda';
    raf = requestAnimationFrame(putar);
  };
  const berhenti = () => {
    jalan = false;
    tombolJalan.textContent = 'Jalan';
    if (raf) cancelAnimationFrame(raf);
    raf = null;
  };
  T.onLeave(() => { berhenti(); });

  const tampilMatriks = () => {
    let h = '<p class="dim">Aturan tarik-tolak antar warna (1 = tarik kuat, −1 = tolak kuat):</p>';
    h += '<table style="border-collapse:collapse;font-size:11px;margin:4px 0">';
    h += '<tr><td></td>' + WARNA.map((w) => '<td style="padding:2px 4px"><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:' + w + '"></span></td>').join('') + '</tr>';
    matriks.forEach((baris, i) => {
      h += '<tr><td style="padding:2px 4px"><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:' + WARNA[i] + '"></span></td>' +
        baris.map((v) => '<td style="padding:2px 4px;text-align:center;color:' + (v >= 0 ? '#7ec8a9' : '#ff7a66') + '">' + (v >= 0 ? '+' : '') + v.toFixed(1) + '</td>').join('') + '</tr>';
    });
    h += '</table>';
    T.show(stat, h);
  };

  const tombolJalan = T.btn('Jalan', () => { jalan ? berhenti() : mulai(); }, true);
  const tombolAcak = T.btn('Aturan baru', () => {
    matriks = matriksAcak();
    presetI.value = 'acak';
    tampilMatriks();
  });

  presetI.addEventListener('change', () => {
    matriks = presetI.value === 'acak' ? matriksAcak() : PRESET[presetI.value].map((r) => r.slice());
    tampilMatriks();
  });
  jumI.addEventListener('change', () => { jumlah = Number(jumI.value); isiPartikel(); gambar(); });

  root.appendChild(T.el('<p class="note">Setiap warna punya aturan tarik-tolak terhadap warna lain. Tidak ada yang mengatur pola besarnya. Gumpalan, rantai, dan kejar-kejaran muncul sendiri dari aturan itu.</p>'));
  root.appendChild(T.grid2(T.field('Pola aturan', presetI), T.field('Jumlah partikel', jumI)));
  root.appendChild(canvas);
  root.appendChild(T.row(tombolJalan, tombolAcak));
  root.appendChild(stat);
  isiPartikel();
  gambar();
  tampilMatriks();
  mulai();
}
