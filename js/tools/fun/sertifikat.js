import { h as T, errBox } from '../../core.js?v=6.9.20';

export const meta = {"id":"sertifikat","name":"Sertifikat Tolol","cat":"fun","icon":"🏆","desc":"Sertifikat meme roast: namamu + TERBUKTI TOLOL DAN TAK BEROTAK. 100% digambar di perangkat, tanpa server.","keywords":"sertifikat,meme,tolol,roast,nama,gambar,lucu"};

/* ============================================================
 * "Sertifikat Tolol" — roast meme 16:9 (800×450), 100% digambar
 * via canvas, tanpa aset eksternal / API server / fetch apa pun.
 *
 * Inspirasi visual: sertifikat meme viral (logo parodi "ToLoL",
 * laurel emas, karangan bunga, lingkaran no-brain, bintang laut).
 * Semua dekorasi digambar manual (vektor canvas) — BUKAN salinan
 * aset siapa pun. Bintang laut adalah doodle ORISINAL (bukan
 * karakter kartun berhak cipta).
 *
 * Perilaku teks user (disengaja, meniru meme aslinya): SATU BARIS,
 * TANPA wrap dan TANPA auto-shrink — teks yang kepanjangan
 * TERPOTONG tepi kanvas.
 *
 * Tipografi: 100% sans-serif. Baris hinaan memakai font horror
 * "dripping" yang digambar manual di canvas (tanpa font eksternal
 * agar tetap 100% offline).
 *
 * Diekspor agar bisa diuji via node (@napi-rs/canvas).
 * ============================================================ */

const W = 800, H = 450;

const NAVY = '#272836';
const WHITE = '#fefefe';
const STRIPE = '#c22440';

const FONT_NAME = '700 50px Arial,Helvetica,"DejaVu Sans",sans-serif';
const FONT_LINE1 = (px) => `700 ${px}px "Arial Narrow","Roboto Condensed","Oswald",Impact,"DejaVu Sans",sans-serif`;
const FONT_DRIP = (px) => `900 ${px}px "Arial Black","Archivo Black",Impact,Roboto,"DejaVu Sans",sans-serif`;
const FONT_LOGO = '900 62px "Arial Black","Archivo Black",Impact,"DejaVu Sans",sans-serif';

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function rr(ctx, x, y, w, h, r) {
  const q = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + q, y);
  ctx.arcTo(x + w, y, x + w, y + h, q);
  ctx.arcTo(x + w, y + h, x, y + h, q);
  ctx.arcTo(x, y + h, x, y, q);
  ctx.arcTo(x, y, x + w, y, q);
  ctx.closePath();
}

/* ---------- latar: navy + stripe merah diagonal arah / ---------- */
function drawBackground(ctx) {
  ctx.fillStyle = NAVY;
  ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.translate(W / 2, H / 2);
  ctx.rotate(-0.45); // ~-26° -> garis condong '/'
  // pasangan pita: marun gelap tipis + merah terang (seperti meme aslinya)
  let k = 0;
  for (let x0 = -680; x0 < 700; x0 += 170, k++) {
    const wRed = k % 2 ? 70 : 40;
    ctx.fillStyle = 'rgba(88,24,34,0.55)';
    ctx.fillRect(x0 - 28, -700, 28, 1400);
    ctx.fillStyle = STRIPE;
    ctx.globalAlpha = 0.92;
    ctx.fillRect(x0, -700, wRed, 1400);
    ctx.globalAlpha = 1;
  }
  ctx.restore();
  // vignette sangat lembut di sudut
  const g = ctx.createRadialGradient(W / 2, H / 2, 170, W / 2, H / 2, 560);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.22)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

/* ---------- logo parodi "ToLoL" tengah-atas ---------- */
function drawLogo(ctx) {
  rr(ctx, 277, 13, 244, 85, 10);
  ctx.fillStyle = '#000000';
  ctx.fill();
  rr(ctx, 371, 22, 140, 68, 12);
  ctx.fillStyle = '#ff9900';
  ctx.fill();
  ctx.font = FONT_LOGO;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('To', 324, 68);
  ctx.fillStyle = '#000000';
  ctx.fillText('LoL', 443, 68);
}

/* ---------- daun runcing (laurel & hiasan) ---------- */
function leaf(ctx, x, y, len, wid, ang, fill, rib) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(len * 0.45, -wid * 0.62, len, 0);
  ctx.quadraticCurveTo(len * 0.45, wid * 0.62, 0, 0);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = rib || 'rgba(0,0,0,0.25)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(3, 0);
  ctx.lineTo(len - 4, 0);
  ctx.stroke();
  ctx.restore();
}

function branch(ctx, x0, y0, cx, cy, x1, y1, n, leafLen, fill, rib) {
  ctx.strokeStyle = rib;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.quadraticCurveTo(cx, cy, x1, y1);
  ctx.stroke();
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const mt = 1 - t;
    const x = mt * mt * x0 + 2 * mt * t * cx + t * t * x1;
    const y = mt * mt * y0 + 2 * mt * t * cy + t * t * y1;
    const dx = 2 * mt * (cx - x0) + 2 * t * (x1 - cx);
    const dy = 2 * mt * (cy - y0) + 2 * t * (y1 - cy);
    const base = Math.atan2(dy, dx);
    const s = leafLen * (0.65 + 0.55 * Math.sin(t * Math.PI));
    leaf(ctx, x, y, s, s * 0.44, base - 0.75, fill, 'rgba(140,100,0,0.6)');
    leaf(ctx, x, y, s, s * 0.44, base + 0.75, fill, 'rgba(140,100,0,0.6)');
  }
}

/* ---------- laurel emas kiri-atas (terpotong tepi) ---------- */
function drawLaurel(ctx) {
  branch(ctx, 38, 242, 2, 115, 14, 6, 12, 34, '#f0e10b', '#8a6d00');
  branch(ctx, 12, 26, 62, 2, 122, 12, 8, 26, '#ece00e', '#8a6d00');
}

/* ---------- karangan bunga putih-hijau sisi kanan ---------- */
function flower(ctx, x, y, r) {
  ctx.save();
  ctx.translate(x, y);
  for (let i = 0; i < 5; i++) {
    ctx.save();
    ctx.rotate((i * Math.PI * 2) / 5);
    ctx.beginPath();
    ctx.ellipse(r * 0.62, 0, r * 0.62, r * 0.36, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#f7f7f7';
    ctx.fill();
    ctx.strokeStyle = '#c9ced3';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.34, 0, Math.PI * 2);
  ctx.fillStyle = '#f2c230';
  ctx.fill();
  ctx.restore();
}

function drawGarland(ctx) {
  // kurva dari pojok kanan-atas melengkung turun ke kanan-tengah (pendek)
  const x0 = 792, y0 = -6, cx = 730, cy = 90, x1 = 690, y1 = 215;
  ctx.strokeStyle = '#2a7d46';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.quadraticCurveTo(cx, cy, x1, y1);
  ctx.stroke();
  const rnd = mulberry32(42);
  const n = 7;
  for (let i = 0; i < n; i++) {
    const t = 0.04 + (i / (n - 1)) * 0.92;
    const mt = 1 - t;
    const x = mt * mt * x0 + 2 * mt * t * cx + t * t * x1;
    const y = mt * mt * y0 + 2 * mt * t * cy + t * t * y1;
    const dx = 2 * mt * (cx - x0) + 2 * t * (x1 - cx);
    const base = Math.atan2(2 * mt * (cy - y0) + 2 * t * (y1 - cy), dx);
    flower(ctx, x, y, 13 + rnd() * 4);
    if (i < n - 1) {
      const t2 = t + 0.06;
      const m2 = 1 - t2;
      const lx = m2 * m2 * x0 + 2 * m2 * t2 * cx + t2 * t2 * x1;
      const ly = m2 * m2 * y0 + 2 * m2 * t2 * cy + t2 * t2 * y1;
      leaf(ctx, lx, ly, 30, 13, base - 1.1, '#2a9d5c', 'rgba(0,60,20,0.4)');
      leaf(ctx, lx, ly, 30, 13, base + 1.1, '#35b368', 'rgba(0,60,20,0.4)');
    }
  }
}

/* ---------- teks putih + outline ---------- */
function outlined(ctx, text, cx, y, font, fill, lw) {
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.lineJoin = 'round';
  if (lw > 0) {
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = lw;
    ctx.strokeText(text, cx, y);
  }
  ctx.fillStyle = fill;
  ctx.fillText(text, cx, y);
}

/* Samakan lebar teks FIXED dengan target (kompensasi beda font per perangkat) */
function fitPx(ctx, text, fontTpl, targetW) {
  const px = 100;
  ctx.font = fontTpl(px);
  const w = ctx.measureText(text).width || 1;
  return (px * targetW) / w;
}

/* ---------- font horror dripping: teks putih outline hitam + tetesan manual ---------- */
function dripping(ctx, text, cx, baseY, px, strokeW) {
  ctx.save();
  ctx.font = FONT_DRIP(px);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.lineJoin = 'round';
  const tw = ctx.measureText(text).width;
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = strokeW;
  ctx.strokeText(text, cx, baseY);
  ctx.fillStyle = WHITE;
  ctx.fillText(text, cx, baseY);
  // tetesan: posisi pseudo-acak tapi deterministik per teks
  const seed = [...text].reduce((a, c) => a + c.charCodeAt(0), 7);
  const rnd = mulberry32(seed);
  const n = Math.max(5, Math.floor(tw / 55));
  for (let i = 0; i < n; i++) {
    const x = cx - tw / 2 + (i + 0.2 + rnd() * 0.6) * (tw / n);
    const long = rnd() < 0.12;
    const len = px * (0.08 + rnd() * 0.28) * (long ? 1.5 : 1);
    const w = 3.5 + rnd() * 4;
    // batang tetesan
    ctx.beginPath();
    ctx.moveTo(x - w / 2, baseY - 3);
    ctx.lineTo(x - w / 2, baseY + len - w / 2);
    ctx.arc(x, baseY + len - w / 2, w / 2, Math.PI, 0);
    ctx.lineTo(x + w / 2, baseY - 3);
    ctx.closePath();
    ctx.fillStyle = WHITE;
    ctx.fill();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.stroke();
    // bulir di ujung
    ctx.beginPath();
    ctx.arc(x, baseY + len, w * 0.6, 0, Math.PI * 2);
    ctx.fillStyle = WHITE;
    ctx.fill();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  ctx.restore();
}

/* ---------- lingkaran "no-brain" kiri-bawah ---------- */
function drawNoBrain(ctx) {
  const cx = 75, cy = 380, R = 52, k = R / 72;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  // doodle otak abu-abu (garis), diskala mengikuti R
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(k, k);
  ctx.strokeStyle = '#9aa0a6';
  ctx.lineWidth = 3 / k;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.ellipse(0, -4, 44, 36, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, -40);
  ctx.quadraticCurveTo(-6, -10, 0, 32);
  ctx.stroke();
  const sq = [
    [-28, -18, -18, -6, -26, 6], [-30, 10, -20, 18, -28, 28],
    [26, -20, 16, -8, 24, 4], [28, 8, 18, 16, 26, 26],
    [-8, -30, 0, -22, -6, -12], [8, -30, 2, -20, 8, -10],
  ];
  for (const [x1, y1, x2, y2, x3, y3] of sq) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.quadraticCurveTo(x2, y2, x3, y3);
    ctx.stroke();
  }
  ctx.restore();
  // tanda larangan merah
  ctx.strokeStyle = '#d40000';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.arc(cx, cy, R - 4, 0, Math.PI * 2);
  ctx.stroke();
  const a = Math.PI / 4, r = R - 4;
  ctx.beginPath();
  ctx.moveTo(cx - r * Math.cos(a), cy - r * Math.sin(a));
  ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
  ctx.stroke();
  ctx.restore();
}

/* ---------- doodle bintang laut ORISINAL kanan-bawah (bukan karakter ber-IP) ---------- */
function drawStarfish(ctx) {
  const cx = 700, cy = 342, R = 84, r = 37;
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rad = i % 2 ? r : R;
    pts.push([cx + Math.cos(a) * rad, cy + Math.sin(a) * rad * 1.12]);
  }
  ctx.save();
  ctx.beginPath();
  ctx.moveTo((pts[0][0] + pts[9][0]) / 2, (pts[0][1] + pts[9][1]) / 2);
  for (let i = 0; i < 10; i++) {
    const p = pts[i], q = pts[(i + 1) % 10];
    ctx.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2);
  }
  ctx.closePath();
  ctx.fillStyle = '#f6a6ae';
  ctx.fill();
  ctx.strokeStyle = '#cf7f88';
  ctx.lineWidth = 4;
  ctx.lineJoin = 'round';
  ctx.stroke();
  // bintik-bintik samar di lengan
  ctx.fillStyle = 'rgba(207,127,136,0.45)';
  const rnd = mulberry32(7);
  for (let i = 0; i < 9; i++) {
    const p = pts[(i * 2) % 10];
    ctx.beginPath();
    ctx.arc(p[0] * 0.82 + cx * 0.18 + (rnd() - 0.5) * 10,
             p[1] * 0.82 + cy * 0.18 + (rnd() - 0.5) * 10, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
  // wajah: mata oval melirik + senyum
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.ellipse(cx - 20, cy - 22, 13, 16, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx + 20, cy - 22, 13, 16, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#1c1c1c';
  ctx.beginPath(); ctx.arc(cx - 24, cy - 18, 5.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 16, cy - 18, 5.5, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#1c1c1c';
  ctx.lineWidth = 3.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(cx, cy + 2, 16, Math.PI * 0.15, Math.PI * 0.85);
  ctx.stroke();
  ctx.restore();
}

/* ---------- komposisi penuh ---------- */
export function drawSertifikat(ctx, text) {
  ctx.save();
  ctx.clearRect(0, 0, W, H);
  drawBackground(ctx);
  drawLogo(ctx);
  drawLaurel(ctx);
  drawGarland(ctx);

  // Baris 1 (fixed): putih POLOS tanpa outline (seperti aslinya)
  const px1 = fitPx(ctx, 'SERTIFIKAT INI MENYATAKAN BAHWA', FONT_LINE1, 527);
  outlined(ctx, 'SERTIFIKAT INI MENYATAKAN BAHWA', 400, 179, FONT_LINE1(px1), WHITE, 0);

  // Slot nama user: putih bold POLOS tanpa outline; SATU BARIS —
  // tanpa wrap/shrink, overflow terpotong tepi kanvas (seperti aslinya).
  ctx.save();
  ctx.font = FONT_NAME;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = WHITE;
  ctx.fillText(String(text), 400, 233);
  ctx.restore();

  // Baris hinaan (fixed): font dripping putih + outline hitam tebal
  const pxT = fitPx(ctx, 'TERBUKTI TOLOL', FONT_DRIP, 453);
  dripping(ctx, 'TERBUKTI TOLOL', 400, 345, pxT, 7);
  const pxB = fitPx(ctx, 'DAN TAK BEROTAK', FONT_DRIP, 342);
  dripping(ctx, 'DAN TAK BEROTAK', 400, 410, pxB, 4);

  // dekorasi depan
  drawNoBrain(ctx);
  drawStarfish(ctx);
  ctx.restore();
}

/* ---------- UI tool ---------- */
export function render(root) {
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;

  const inp = T.input('text', 'Masukkan nama…');
  inp.maxLength = 180;

  const box = T.out();

  const preview = T.el('<div style="margin-top:12px;display:flex;justify-content:center"></div>');
  const imgPrev = document.createElement('img');
  imgPrev.style.cssText = 'max-width:100%;height:auto;border-radius:12px;border:1px solid #ffffff20;display:none';
  imgPrev.alt = 'Hasil sertifikat meme';
  preview.appendChild(imgPrev);

  const generate = () => {
    const text = inp.value.trim();
    if (!text) {
      T.show(box, errBox('Isi nama dulu — masa sertifikat tanpa nama.'));
      inp.focus();
      return;
    }
    drawSertifikat(cv.getContext('2d'), text);
    imgPrev.src = cv.toDataURL('image/jpeg', 0.92);
    imgPrev.style.display = 'block';
    T.hide(box);
    T.scrollToPreview && T.scrollToPreview(imgPrev);
  };
  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') generate(); });

  const bDl = T.btn('Unduh JPG', () => {
    if (!imgPrev.src) { T.show(box, errBox('Generate dulu gambarnya.')); return; }
    cv.toBlob((b) => {
      if (!b) { T.show(box, errBox('Gagal membuat file. Coba lagi.')); return; }
      const a = document.createElement('a');
      a.href = URL.createObjectURL(b);
      a.download = 'sertifikat-tolol-' + Date.now() + '.jpg';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    }, 'image/jpeg', 0.92);
  });

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Sertifikat meme roast: namamu dinyatakan <b>TERBUKTI TOLOL DAN TAK BEROTAK</b>. Digambar 100% di perangkatmu — tanpa server, tanpa watermark.<br><span style="opacity:.75">Catatan: teks nama satu baris dan tidak dikecilkan — kalau kepanjangan, ia terpotong tepi kanvas (seperti meme aslinya).</span></p>'));
  root.appendChild(T.field('Nama / teks', inp, 'Maks 180 karakter'));
  root.appendChild(T.row(T.btn('Generate', generate, true)));
  root.appendChild(preview);
  root.appendChild(T.row(bDl));
  root.appendChild(box);
}
