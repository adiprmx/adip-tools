import { h as T, errBox } from '../../core.js?v=6.9.20';

export const meta = {"id": "nokiamsg", "name": "Nokia Message", "cat": "fun", "icon": "📱", "desc": "Bikin gambar SMS ala HP Nokia jadul.", "keywords": "nokia,sms,jadul,meme,pesan,gambar"};

/* Aproksimasi gaya layar Nokia Symbian (status bar teal + judul pixel + navibar
   hitam "Pilihan/Kembali") — digambar ulang sendiri, 100% client-side.
   Parameter diselaraskan dari sampel render server aslinya (diukur via PIL):
   kanvas 3:4, teal #068881, body #d2e3eb, posisi teks & ikon mengikuti aslinya.
   Bukan piksel-identik dengan render server aslinya. */

/** Gambar layar Nokia ke ctx. mk(w,h) = pembuat kanvas (document / node-canvas).
    Murni — bisa diuji headless. */
// ==DRAW-START==
const NOKIA_W = 900, NOKIA_H = 1200;
const NOKIA_TEAL = '#068881', NOKIA_BODY = '#d2e3eb', NOKIA_INK = '#000000';
/* Font pixel Nokia proporsinya ramping: condense horizontal teks monospace. */
const NOKIA_XS = 0.62;
function nokiaWrap(measure, text, maxW) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const w of words) {
    const t = line ? line + ' ' + w : w;
    if (measure(t) > maxW && line) { lines.push(line); line = w; }
    else line = t;
  }
  if (line) lines.push(line);
  return lines.length ? lines : [''];
}
export function drawScreen(ctx, mk, o) {
  const W = NOKIA_W, H = NOKIA_H, TEAL = NOKIA_TEAL, BODY = NOKIA_BODY, INK = NOKIA_INK;
  const pesan = String(o.pesan || ''), dari = String(o.dari || ''),
    judul = String(o.judul || 'Pesan'), tgl = String(o.tgl || ''), jam = String(o.jam || '');

  /** Teks pixel: render kecil lalu upscale nearest-neighbour + condense. */
  function pxText(text, x, y, px, color, align) {
    const SC = 4;
    const fs = Math.max(6, Math.round(px / SC));
    const m = mk(8, 8).getContext('2d');
    m.font = '700 ' + fs + 'px "Courier New", monospace';
    const tw = Math.ceil(m.measureText(text).width) + 6;
    const off = mk(tw, fs + 10), c2 = off.getContext('2d');
    c2.font = '700 ' + fs + 'px "Courier New", monospace';
    c2.textBaseline = 'top';
    c2.fillStyle = color;
    c2.fillText(text, 3, 3);
    const wdt = tw * SC * NOKIA_XS, hgt = (fs + 10) * SC;
    let dx = x;
    if (align === 'center') dx = x - wdt / 2;
    else if (align === 'right') dx = x - wdt;
    const sm = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(off, Math.round(dx), Math.round(y), wdt, hgt);
    ctx.imageSmoothingEnabled = sm;
  }
  /** Ikon pixel dari matriks string; halo = outline putih 1 sel. */
  function pxIcon(rows, x, y, s, colors, halo) {
    const paint = (ox, oy, col) => {
      rows.forEach((row, j) => {
        [...row].forEach((ch, i) => {
          if (ch === '.' || ch === ' ') return;
          ctx.fillStyle = col || ((colors && colors[ch]) || (colors && colors['#']) || '#fff');
          ctx.fillRect(x + ox + i * s, y + oy + j * s, s, s);
        });
      });
    };
    if (halo) {
      paint(-s, 0, halo); paint(s, 0, halo);
      paint(0, -s, halo); paint(0, s, halo);
    }
    paint(0, 0);
  }
  function rrect(x, y, w, h, r) {
    const q = Math.max(0, Math.min(r, w / 2, h / 2));
    ctx.beginPath();
    ctx.moveTo(x + q, y);
    ctx.arcTo(x + w, y, x + w, y + h, q);
    ctx.arcTo(x + w, y + h, x, y + h, q);
    ctx.arcTo(x, y + h, x, y, q);
    ctx.arcTo(x, y, x + w, y, q);
    ctx.closePath();
  }
  /* Grup sinyal: chip warna + 5 bar menanjak (bar pertama abu-abu). */
  function sigGroup(x, chipFill, chipInner, glyph) {
    rrect(x - 6, 11, 61, 65, 12); ctx.fillStyle = '#ffffff'; ctx.fill();
    rrect(x, 17, 49, 53, 10); ctx.fillStyle = chipFill; ctx.fill();
    rrect(x + 6, 23, 37, 41, 7); ctx.fillStyle = chipInner; ctx.fill();
    pxIcon(glyph, x + 14, 28, 4, { '#': '#ffffff' });
    const bh = [16, 26, 36, 46, 56], bw = 13, gap = 5;
    bh.forEach((h, i) => {
      const bx = x + 58 + i * (bw + gap), by = 70 - h;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(bx - 3, by - 3, bw + 6, h + 6);
      ctx.fillStyle = i === 0 ? '#8a8f94' : INK;
      ctx.fillRect(bx, by, bw, h);
    });
  }
  const GLYPH_1 = ['.##..', '..#..', '..#..', '..#..', '..#..', '..#..', '.###.'];
  const GLYPH_2 = ['.###.', '#...#', '....#', '...#.', '..#..', '.#...', '#####'];
  const ASTERISK = ['#..#..#', '.#.#.#.', '..###..', '#######', '..###..', '.#.#.#.', '#..#..#'];
  const HASH = ['..#...#..', '..#...#..', '..#...#..', '##########', '..#...#..', '..#...#..', '##########', '..#...#..', '..#...#..'];
  const BUTTERFLY = [
    '...###.###...',
    '..#########..',
    '.###########.',
    '#############',
    '.###########.',
    '..####.####..',
    '...###.###...',
    '....##.##....',
    '....##.##....',
    '...###.###...',
    '...###.###...',
    '....##.##....',
  ];

  // ---- status bar teal (satu blok menyatu dengan baris judul) ----
  ctx.fillStyle = TEAL; ctx.fillRect(0, 0, W, 234);
  // kotak kuning di belakang grup sinyal pertama
  rrect(8, 8, 166, 75, 10); ctx.fillStyle = '#f0e10b'; ctx.fill();
  sigGroup(21, '#1f66c4', '#4da3e8', GLYPH_1);
  sigGroup(182, '#5e9e2e', '#9ccc3c', GLYPH_2);
  // jam
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(431, 52, 33, 0, 7); ctx.fill();
  ctx.fillStyle = TEAL;
  ctx.beginPath(); ctx.arc(431, 52, 24, 0, 7); ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(431, 52, 20, 0, 7); ctx.fill();
  [[431, 35, '#3fae5a'], [448, 52, '#f5a623'], [431, 69, '#f5a623'], [414, 52, '#f5a623']]
    .forEach(([dx, dy, c]) => { ctx.fillStyle = c; ctx.fillRect(dx - 4, dy - 4, 8, 8); });
  ctx.fillStyle = INK;
  ctx.beginPath(); ctx.arc(431, 52, 4, 0, 7); ctx.fill();
  // amplop
  ctx.fillStyle = '#ffffff'; ctx.fillRect(511, 17, 97, 76);
  ctx.fillStyle = '#8b5a1e'; ctx.fillRect(514, 20, 91, 70);
  ctx.fillStyle = '#6e4517';
  ctx.beginPath(); ctx.moveTo(514, 20); ctx.lineTo(560, 55); ctx.lineTo(514, 55); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(605, 20); ctx.lineTo(560, 55); ctx.lineTo(605, 55); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#f2d98c'; ctx.fillRect(522, 55, 75, 27);
  // ikon ungu (kupu-kupu)
  pxIcon(BUTTERFLY, 638, 15, 5, { '#': '#9b5de5' }, '#ffffff');
  // baterai (nub di kiri)
  ctx.fillStyle = '#ffffff'; ctx.fillRect(768, 14, 126, 76);
  ctx.fillStyle = INK; ctx.fillRect(771, 17, 120, 70);
  ctx.fillStyle = '#ffffff'; ctx.fillRect(777, 23, 108, 58);
  ctx.fillStyle = '#2b9fd8';
  for (let i = 0; i < 4; i++) ctx.fillRect(783 + i * 26, 29, 18, 46);
  ctx.fillStyle = INK; ctx.fillRect(761, 38, 10, 28);

  // ---- baris judul: tag kiri, judul tengah, '#' kanan ----
  const tgx = 17, tgy = 108, tgw = 82, tgh = 95;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(tgx + 24, tgy);
  ctx.lineTo(tgx + tgw, tgy);
  ctx.lineTo(tgx + tgw, tgy + tgh);
  ctx.lineTo(tgx + 24, tgy + tgh);
  ctx.lineTo(tgx, tgy + tgh / 2);
  ctx.closePath(); ctx.fill();
  pxIcon(ASTERISK, tgx + 38, tgy + 30, 5, { '#': TEAL });
  pxText(judul.slice(0, 14) || 'Pesan', W / 2, 101, 146, '#eef4f8', 'center');
  rrect(807, 108, 91, 108, 14); ctx.fillStyle = '#ffffff'; ctx.fill();
  pxIcon(HASH, 827, 135, 6, { '#': TEAL });

  // ---- badan pesan ----
  ctx.fillStyle = BODY; ctx.fillRect(0, 234, W, 845);
  const meas = (t) => {
    const m = mk(8, 8).getContext('2d');
    m.font = '700 16px "Courier New", monospace';
    return m.measureText(t).width * 4 * NOKIA_XS;
  };
  const lines = nokiaWrap(meas, pesan, W - 100).slice(0, 10);
  lines.forEach((l, i) => pxText(l, 50, 249 + i * 66, 64, INK, 'left'));

  // blok Dari / tanggal / jam (kiri bawah badan)
  const info = ['Dari:', dari, tgl, jam].filter((s) => s !== '');
  info.forEach((l, i) => pxText(l.slice(0, 26), 50, 809 + i * 66, 58, INK, 'left'));

  // ---- navibar hitam ----
  ctx.fillStyle = '#000'; ctx.fillRect(0, 1079, W, 121);
  pxText('Pilihan', 15, 1074, 108, '#e1eaf2', 'left');
  pxText('Kembali', 885, 1074, 108, '#e1eaf2', 'right');
}
// ==DRAW-END==

export function render(root) {
  const now = new Date();
  const p2 = (n) => String(n).padStart(2, '0');
  const defDate = p2(now.getDate()) + '/' + p2(now.getMonth() + 1) + '/' + now.getFullYear();
  const defTime = p2(now.getHours()) + ':' + p2(now.getMinutes());

  const fPesan = T.input('text', 'Tulis pesan…', 'kata-kata hari ini');
  const fDari = T.input('text', 'Nama pengirim', 'Dika');
  const fJudul = T.input('text', 'Judul', 'Pesan');
  const fTgl = T.input('text', 'DD/MM/YYYY', defDate);
  const fJam = T.input('text', 'HH:MM', defTime);
  const box = T.out();
  const preview = T.el('<div style="margin-top:12px;display:flex;justify-content:center"></div>');
  const imgPrev = document.createElement('img');
  imgPrev.style.cssText = 'max-width:100%;height:auto;border-radius:12px;border:1px solid #ffffff20;display:none';
  preview.appendChild(imgPrev);

  const cv = document.createElement('canvas');
  cv.width = NOKIA_W; cv.height = NOKIA_H;

  const generate = () => {
    const pesan = fPesan.value.trim();
    if (!pesan) { alert('Isi pesan dulu!'); fPesan.focus(); return; }
    const ctx = cv.getContext('2d');
    drawScreen(ctx, (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }, {
      pesan, dari: fDari.value.trim(), judul: fJudul.value.trim(),
      tgl: fTgl.value.trim(), jam: fJam.value.trim(),
    });
    imgPrev.src = cv.toDataURL('image/png');
    imgPrev.style.display = 'block';
    T.hide(box);
  };

  const bDl = T.btn('Unduh PNG', () => {
    if (!imgPrev.src) { T.show(box, errBox('Generate dulu gambarnya.')); return; }
    cv.toBlob((b) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(b);
      a.download = 'NokiaMessage_' + Date.now() + '.png';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    }, 'image/png');
  });

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Bikin gambar SMS ala HP Nokia jadul (gaya layar Symbian pixel) — digambar langsung di perangkatmu, tanpa server.<br><span class="dim" style="font-size:12px">Aproksimasi gaya visual aslinya, bukan piksel-identik dengan render server.</span></p>'));
  root.appendChild(T.field('Pesan', fPesan));
  root.appendChild(T.grid2(T.field('Dari', fDari), T.field('Judul', fJudul)));
  root.appendChild(T.grid2(T.field('Tanggal', fTgl), T.field('Jam', fJam)));
  root.appendChild(T.row(T.btn('Generate', generate, true)));
  root.appendChild(preview);
  root.appendChild(T.row(bDl));
  root.appendChild(box);
}
