import { h as T, errBox } from '../../core.js?v=6.9.20';

export const meta = {"id": "nokiamsg", "name": "Nokia Message", "cat": "fun", "icon": "📱", "desc": "Bikin gambar SMS ala HP Nokia jadul.", "keywords": "nokia,sms,jadul,meme,pesan,gambar"};

/* Aproksimasi gaya layar Nokia Symbian (status bar teal + judul pixel + navibar
   hitam "Pilihan/Kembali") — digambar ulang sendiri, 100% client-side.
   Bukan piksel-identik dengan render server aslinya. */

/** Gambar layar Nokia ke ctx. mk(w,h) = pembuat kanvas (document / node-canvas).
    Murni — bisa diuji headless. */
// ==DRAW-START==
const NOKIA_W = 900, NOKIA_H = 1200;
const NOKIA_TEAL = '#107773', NOKIA_BODY = '#d3e0e9', NOKIA_INK = '#14181c';
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

  /** Teks pixel: render kecil lalu upscale nearest-neighbour. */
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
    let dx = x;
    if (align === 'center') dx = x - (tw * SC) / 2;
    else if (align === 'right') dx = x - tw * SC;
    const sm = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(off, Math.round(dx), Math.round(y), tw * SC, (fs + 10) * SC);
    ctx.imageSmoothingEnabled = sm;
  }
  /** Ikon pixel sederhana dari matriks string. */
  function pxIcon(rows, x, y, s, colors) {
    rows.forEach((row, j) => {
      [...row].forEach((ch, i) => {
        if (ch === '.' || ch === ' ') return;
        ctx.fillStyle = (colors && colors[ch]) || colors['#'] || '#fff';
        ctx.fillRect(x + i * s, y + j * s, s, s);
      });
    });
  }

  // ---- status bar teal ----
  ctx.fillStyle = TEAL; ctx.fillRect(0, 0, W, 84);
  const S = 7; // ukuran piksel ikon
  // sinyal (kiri)
  pxIcon(['#..', '##.', '###', '####'], 26, 20, S, { '#': '#0b3d38' });
  ctx.fillStyle = '#f5d90a'; ctx.fillRect(16, 12, 4 * S + 12, 4 * S + 12);
  pxIcon(['#..', '##.', '###', '####'], 22, 18, S, { '#': '#0b3d38' });
  // ikon "E" hijau
  ctx.fillStyle = '#3fae5a'; ctx.fillRect(120, 14, 44, 44);
  pxText('E', 142, 8, 44, '#0b3d38', 'center');
  // jam kecil tengah-kiri
  pxIcon(['.###.', '#.#.#', '.###.'], 200, 24, S, { '#': '#e8f4f2' });
  // amplop
  pxIcon(['#######', '#.....#', '##...##', '#.....#', '#######'], 280, 22, S, { '#': '#f2e3c0' });
  // baterai (kanan)
  ctx.fillStyle = '#0b3d38'; ctx.fillRect(W - 120, 18, 84, 40);
  ctx.fillStyle = '#e8f4f2'; ctx.fillRect(W - 114, 24, 72, 28);
  ctx.fillStyle = '#2b9fd8';
  for (let i = 0; i < 4; i++) ctx.fillRect(W - 108 + i * 17, 28, 12, 20);
  ctx.fillStyle = '#0b3d38'; ctx.fillRect(W - 34, 28, 8, 20);

  // ---- baris judul (teal) ----
  ctx.fillStyle = TEAL; ctx.fillRect(0, 84, W, 156);
  // ikon gelembung "..." kiri
  pxIcon(['.#####.', '#######', '##.#.##', '#######', '.#####.'], 40, 130, 9, { '#': '#eef6f5' });
  // ikon "#" kanan
  pxIcon(['..#..#..', '..#..#..', '########', '..#..#..', '..#..#..', '########', '..#..#..', '..#..#..'], W - 120, 128, 8, { '#': '#eef6f5' });
  pxText(judul.slice(0, 14) || 'Pesan', W / 2, 118, 96, '#ffffff', 'center');

  // ---- badan pesan ----
  ctx.fillStyle = BODY; ctx.fillRect(0, 240, W, 850);
  const meas = (t) => {
    const m = mk(8, 8).getContext('2d');
    m.font = '700 11px "Courier New", monospace';
    return m.measureText(t).width * 4;
  };
  const lines = nokiaWrap(meas, pesan, W - 120).slice(0, 10);
  lines.forEach((l, i) => pxText(l, 60, 300 + i * 52, 44, INK, 'left'));

  // blok Dari / tanggal / jam (kiri bawah badan)
  const info = ['Dari:', dari, tgl, jam].filter((s) => s !== '');
  info.forEach((l, i) => pxText(l.slice(0, 26), 60, 830 + i * 50, 40, INK, 'left'));

  // ---- navibar hitam ----
  ctx.fillStyle = '#000'; ctx.fillRect(0, 1090, W, 110);
  pxText('Pilihan', 40, 1108, 62, '#ffffff', 'left');
  pxText('Kembali', W - 40, 1108, 62, '#ffffff', 'right');
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
