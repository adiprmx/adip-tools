import { h as T, errBox } from '../../core.js?v=6.9.20';

export const meta = {"id": "winquotes", "name": "Windows Quotes", "cat": "fun", "icon": "🪟", "desc": "Bikin gambar quote ala Windows Media Player.", "keywords": "windows,media player,quote,kutipan,meme,gambar"};

const FONT_STACK = '"Segoe UI", system-ui, "Noto Sans", sans-serif';

/* ============================================================
 * Replika visual jendela Windows Media Player (XP) — 100% digambar
 * via canvas, tanpa aset eksternal / API server.
 *
 * Parameter diukur dari output piksel-asli server referensi
 * (wmp1/wmp2, dianalisis via PIL: dimensi, bounding box tiap area,
 * sampling warna gradien, tinggi huruf, posisi figur & kontrol).
 * Diekspor agar bisa diuji via node.
 * ============================================================ */

function rrPath(ctx, x, y, w, h, r) {
  const q = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + q, y);
  ctx.arcTo(x + w, y, x + w, y + h, q);
  ctx.arcTo(x + w, y + h, x, y + h, q);
  ctx.arcTo(x, y + h, x, y, q);
  ctx.arcTo(x, y, x + w, y, q);
  ctx.closePath();
}

function vgrad(ctx, y0, h, stops) {
  const g = ctx.createLinearGradient(0, y0, 0, y0 + h);
  for (const [o, c] of stops) g.addColorStop(o, c);
  return g;
}

// Pecah segmen `|` jadi baris dengan word-wrap BERDASARKAN LEBAR PIXEL.
function wrapSegments(ctx, segments, maxW, font) {
  ctx.font = font;
  const out = [];
  for (const seg of segments) {
    const words = String(seg).split(/\s+/).filter(Boolean);
    if (!words.length) { out.push(''); continue; }
    let line = words[0];
    for (let i = 1; i < words.length; i++) {
      const t = line + ' ' + words[i];
      if (ctx.measureText(t).width > maxW && line) { out.push(line); line = words[i]; }
      else line = t;
    }
    out.push(line);
  }
  return out.length ? out : [''];
}

// Kapsul meruncing dengan shading 3D (putih ke abu).
function limb(ctx, x1, y1, x2, y2, w1, w2) {
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const len = Math.hypot(x2 - x1, y2 - y1);
  const mw = Math.max(w1, w2);
  ctx.save();
  ctx.translate(x1, y1);
  ctx.rotate(ang);
  const g = ctx.createLinearGradient(0, -mw / 2, 0, mw / 2);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.45, '#f2f2f6');
  g.addColorStop(1, '#c9c9d4');
  ctx.beginPath();
  ctx.moveTo(0, -w1 / 2);
  ctx.lineTo(len, -w2 / 2);
  ctx.arc(len, 0, w2 / 2, -Math.PI / 2, Math.PI / 2);
  ctx.lineTo(0, w1 / 2);
  ctx.arc(0, 0, w1 / 2, Math.PI / 2, Math.PI * 1.5);
  ctx.closePath();
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = 'rgba(110,110,125,0.45)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

// Bola (kepala) dengan highlight radial khas render 3D.
function ball(ctx, cx, cy, r) {
  const g = ctx.createRadialGradient(cx - r * 0.38, cy - r * 0.42, r * 0.1, cx, cy, r * 1.05);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.55, '#f1f1f5');
  g.addColorStop(1, '#c3c3cf');
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = 'rgba(110,110,125,0.4)';
  ctx.lineWidth = 2;
  ctx.stroke();
  // kilau atas-kiri
  ctx.save();
  ctx.globalAlpha = 0.55;
  ctx.beginPath();
  ctx.ellipse(cx - r * 0.34, cy - r * 0.42, r * 0.3, r * 0.18, -0.5, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.restore();
}

// Telapak tangan terbuka menghadap ke atas (pose shrug).
// (wx, wy) = pergelangan; dir = -1 kiri / +1 kanan.
function openPalm(ctx, wx, wy, dir, s) {
  ctx.save();
  ctx.translate(wx, wy);
  ctx.scale(dir * s, s);
  ctx.rotate(-0.18); // telapak sedikit menengadah
  // telapak: gumpalan membulat
  const pg = ctx.createLinearGradient(0, -22, 0, 22);
  pg.addColorStop(0, '#ffffff');
  pg.addColorStop(0.6, '#f0f0f4');
  pg.addColorStop(1, '#cfcfda');
  ctx.beginPath();
  ctx.ellipse(30, 2, 34, 21, 0, 0, Math.PI * 2);
  ctx.fillStyle = pg;
  ctx.fill();
  ctx.strokeStyle = 'rgba(110,110,125,0.5)';
  ctx.lineWidth = 2;
  ctx.stroke();
  // 4 jari: kapsul pendek mengipas ke luar, sedikit melengkung ke atas
  for (let i = 0; i < 4; i++) {
    const fy = -11 + i * 7.5;
    limb(ctx, 52, fy, 82, fy - 6, 12.5, 10);
  }
  // jempol tegak di sisi dalam atas
  limb(ctx, 10, -14, 0, -40, 15, 12);
  ctx.restore();
}

// Kepalan tangan + jempol ke atas (pose selebrasi).
function fistUp(ctx, fx, fy, s) {
  ctx.save();
  ctx.translate(fx, fy);
  ctx.scale(s, s);
  const hg = ctx.createLinearGradient(0, -24, 0, 24);
  hg.addColorStop(0, '#ffffff');
  hg.addColorStop(0.6, '#f1f1f5');
  hg.addColorStop(1, '#c9c9d4');
  rrPath(ctx, -21, -24, 42, 50, 15);
  ctx.fillStyle = hg;
  ctx.fill();
  ctx.strokeStyle = 'rgba(110,110,125,0.5)';
  ctx.lineWidth = 2;
  ctx.stroke();
  // jempol tegak (pendek)
  limb(ctx, 4, -22, 8, -42, 15, 12);
  ctx.restore();
}

/* Figur 3D putih stilasi, digambar ulang dari observasi render asli.
 * (cx, feetY) = tengah kaki di tanah; H = tinggi total. */
function drawFigure(ctx, cx, feetY, H, pose) {
  const s = H / (pose === 'up' ? 367 : 553);
  ctx.save();
  ctx.translate(cx, feetY);
  ctx.scale(s, s);

  // bayangan lembut
  const shR = pose === 'up' ? 80 : 135;
  const sh = ctx.createRadialGradient(0, 8, 6, 0, 8, shR);
  sh.addColorStop(0, 'rgba(25,25,50,0.22)');
  sh.addColorStop(1, 'rgba(25,25,50,0)');
  ctx.fillStyle = sh;
  ctx.beginPath();
  ctx.ellipse(0, 8, shR, 15, 0, 0, Math.PI * 2);
  ctx.fill();

  const shoeG = () => {
    const g = ctx.createLinearGradient(0, -26, 0, 26);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(1, '#c6c6d1');
    return g;
  };
  const strokeFig = () => {
    ctx.strokeStyle = 'rgba(110,110,125,0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  if (pose === 'up') {
    // ---- selebrasi: tangan ke atas, jempol tegak ----
    for (const q of [-1, 1]) {
      limb(ctx, q * 24, -72, q * 28, -30, 40, 34);            // kaki
      ctx.beginPath();
      ctx.ellipse(q * 32, -18, 34, 16, q * 0.08, 0, Math.PI * 2);
      ctx.fillStyle = shoeG(); ctx.fill(); strokeFig();       // sepatu
    }
    // torso
    const tg = ctx.createLinearGradient(-50, 0, 50, 0);
    tg.addColorStop(0, '#ffffff');
    tg.addColorStop(0.55, '#f1f1f5');
    tg.addColorStop(1, '#c4c4cf');
    ctx.beginPath();
    ctx.moveTo(-46, -192);
    ctx.bezierCurveTo(-52, -155, -44, -110, -40, -74);
    ctx.quadraticCurveTo(0, -64, 40, -74);
    ctx.bezierCurveTo(44, -110, 52, -155, 46, -192);
    ctx.quadraticCurveTo(0, -204, -46, -192);
    ctx.closePath();
    ctx.fillStyle = tg; ctx.fill(); strokeFig();
    // lengan ke atas menyamping, siku menekuk, kepalan di sisi atas kepala
    for (const q of [-1, 1]) {
      limb(ctx, q * 42, -185, q * 85, -240, 38, 33);          // lengan atas
      limb(ctx, q * 85, -240, q * 78, -292, 33, 29);          // lengan bawah
      fistUp(ctx, q * 78, -312, 1);                            // kepalan + jempol
    }
    // leher + kepala
    ctx.fillStyle = '#e9e9ef';
    ctx.fillRect(-13, -218, 26, 30);
    ball(ctx, 0, -260, 55);
  } else {
    // ---- shrug: lengan menekuk ke bawah, telapak menghadap ke atas ----
    for (const q of [-1, 1]) {
      limb(ctx, q * 40, -190, q * 48, -50, 66, 56);            // kaki (tebal)
      ctx.beginPath();
      ctx.ellipse(q * 55, -28, 58, 27, q * 0.06, 0, Math.PI * 2);
      ctx.fillStyle = shoeG(); ctx.fill(); strokeFig();       // sepatu
    }
    // torso (bahu lebar, gemuk)
    const tg = ctx.createLinearGradient(-78, 0, 78, 0);
    tg.addColorStop(0, '#ffffff');
    tg.addColorStop(0.55, '#f1f1f5');
    tg.addColorStop(1, '#c4c4cf');
    ctx.beginPath();
    ctx.moveTo(-75, -372);
    ctx.bezierCurveTo(-84, -326, -72, -258, -65, -192);
    ctx.quadraticCurveTo(0, -180, 65, -192);
    ctx.bezierCurveTo(72, -258, 84, -326, 75, -372);
    ctx.quadraticCurveTo(0, -388, -75, -372);
    ctx.closePath();
    ctx.fillStyle = tg; ctx.fill(); strokeFig();
    // highlight dada
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.ellipse(-34, -298, 17, 32, 0.22, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.restore();
    // lengan: bahu -> siku (turun) -> pergelangan, telapak terbuka ke atas
    for (const q of [-1, 1]) {
      limb(ctx, q * 70, -358, q * 125, -332, 60, 54);
      limb(ctx, q * 125, -332, q * 158, -316, 54, 47);
      openPalm(ctx, q * 160, -314, q, 0.92);
    }
    // leher pendek + kepala besar (hampir menempel bahu)
    ctx.fillStyle = '#e9e9ef';
    ctx.fillRect(-20, -408, 40, 30);
    ball(ctx, 0, -462, 78);
  }
  ctx.restore();
}

// Ikon lingkaran WMP (3 segmen warna + segitiga play).
function wmpIcon(ctx, cx, cy, r) {
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff'; ctx.fill();
  const seg = (a0, a1, col) => {
    ctx.beginPath(); ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r - 1.5, a0, a1); ctx.closePath();
    ctx.fillStyle = col; ctx.fill();
  };
  seg(-Math.PI / 2, Math.PI / 6, '#f7941e');
  seg(Math.PI / 6, Math.PI * 0.78, '#8dc63f');
  seg(Math.PI * 0.78, Math.PI * 1.5, '#1a5fd0');
  const t = r * 0.42;
  ctx.beginPath();
  ctx.moveTo(cx - t * 0.55, cy - t); ctx.lineTo(cx - t * 0.55, cy + t); ctx.lineTo(cx + t * 0.75, cy);
  ctx.closePath(); ctx.fillStyle = '#ffffff'; ctx.fill();
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = Math.max(1.5, r * 0.06); ctx.stroke();
}

// Tombol caption glossy (min/max biru, close merah).
function capButton(ctx, x, y, w, h, kind) {
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  if (kind === 'close') {
    g.addColorStop(0, '#f6a488'); g.addColorStop(0.5, '#e56a48'); g.addColorStop(1, '#c93a22');
  } else {
    g.addColorStop(0, '#7db4fa'); g.addColorStop(0.5, '#3f8bf2'); g.addColorStop(1, '#1663d8');
  }
  rrPath(ctx, x, y, w, h, Math.min(10, h * 0.18));
  ctx.fillStyle = g; ctx.fill();
  // kilau atas
  rrPath(ctx, x + 3, y + 3, w - 6, h * 0.4, Math.min(7, h * 0.12));
  ctx.fillStyle = 'rgba(255,255,255,0.32)'; ctx.fill();
  // bingkai putih
  rrPath(ctx, x, y, w, h, Math.min(10, h * 0.18));
  ctx.strokeStyle = 'rgba(255,255,255,0.92)'; ctx.lineWidth = Math.max(2, w * 0.045); ctx.stroke();

  ctx.strokeStyle = '#ffffff'; ctx.fillStyle = '#ffffff';
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const cxp = x + w / 2, cyp = y + h / 2, u = Math.min(w, h);
  if (kind === 'min') {
    ctx.lineWidth = u * 0.13;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.28, y + h * 0.72); ctx.lineTo(x + w * 0.72, y + h * 0.72);
    ctx.stroke();
  } else if (kind === 'max') {
    ctx.lineWidth = u * 0.1;
    ctx.strokeRect(x + w * 0.28, y + h * 0.3, w * 0.44, h * 0.4);
  } else {
    ctx.lineWidth = u * 0.14;
    const o = u * 0.2;
    ctx.beginPath();
    ctx.moveTo(cxp - o, cyp - o); ctx.lineTo(cxp + o, cyp + o);
    ctx.moveTo(cxp + o, cyp - o); ctx.lineTo(cxp - o, cyp + o);
    ctx.stroke();
  }
}

// Segitiga kecil untuk tombol/nav.
function tri(ctx, cx, cy, s, flip, color) {
  ctx.beginPath();
  if (flip) {
    ctx.moveTo(cx + s, cy - s * 0.72); ctx.lineTo(cx + s, cy + s * 0.72); ctx.lineTo(cx - s, cy);
  } else {
    ctx.moveTo(cx - s, cy - s * 0.72); ctx.lineTo(cx - s, cy + s * 0.72); ctx.lineTo(cx + s, cy);
  }
  ctx.closePath();
  ctx.fillStyle = color || '#1e3f8f';
  ctx.fill();
}

// Tombol oval perak khas skin WMP.
function silverBtn(ctx, cx, cy, w, h) {
  const g = ctx.createLinearGradient(0, cy - h / 2, 0, cy + h / 2);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.5, '#dde4f2');
  g.addColorStop(1, '#a7b6d1');
  ctx.beginPath();
  ctx.ellipse(cx, cy, w / 2, h / 2, 0, 0, Math.PI * 2);
  ctx.fillStyle = g; ctx.fill();
  ctx.strokeStyle = '#5b6f94'; ctx.lineWidth = 2; ctx.stroke();
  // kilau atas
  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.beginPath();
  ctx.ellipse(cx, cy - h * 0.22, w * 0.32, h * 0.16, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff'; ctx.fill();
  ctx.restore();
}

// Thumb slider kapsul putih berujung hijau (seek & volume).
function greenThumb(ctx, x, y, w, h) {
  const g = ctx.createLinearGradient(0, x, w, 0);
  g.addColorStop(0, '#f4f4f4'); g.addColorStop(0.5, '#ffffff'); g.addColorStop(1, '#e8e8e8');
  rrPath(ctx, x, y, w, h, Math.min(w / 2 - 1, 8));
  ctx.fillStyle = g; ctx.fill();
  ctx.strokeStyle = '#9aa0ad'; ctx.lineWidth = 1.5; ctx.stroke();
  // tutup hijau atas & bawah
  const gh = Math.min(h * 0.24, 12);
  const gg = ctx.createLinearGradient(0, 0, 0, gh);
  gg.addColorStop(0, '#37d837'); gg.addColorStop(1, '#1d9e1d');
  ctx.fillStyle = gg;
  rrPath(ctx, x + 1.5, y + 1.5, w - 3, gh, gh / 2); ctx.fill();
  rrPath(ctx, x + 1.5, y + h - gh - 1.5, w - 3, gh, gh / 2); ctx.fill();
}

/* ============ KONFIGURASI PER STYLE (diukur dari referensi) ============ */

const CFG1 = {
  W: 1123, H: 1401,
  win: { x: 19, y: 140, w: 1084, h: 1112, border: 5, radius: 14 },
  title: {
    y: 141, h: 99,
    stops: [[0, '#1447d8'], [0.03, '#4f9cff'], [0.09, '#0a69fb'], [0.21, '#0140e7'],
            [0.55, '#003ee7'], [0.85, '#0050ff'], [1, '#012cc8']],
    icon: { cx: 62, cy: 191, r: 30 },
    textX: 115, textY: 192, font: '700 40px ' + FONT_STACK,
    cap: { y: 160, w: 58, h: 67, gap: 8, xs: [900, 966, 1032] }
  },
  menu: { y: 245, h: 65, bg: '#f1f1f3', font: '400 34px ' + FONT_STACK, x0: 37, gap: 30 },
  toolbar: {
    y: 320, h: 30, splitX: 725,
    leftStops: [[0, '#fefdfb'], [0.5, '#d7d9e4'], [1, '#7c81a3']],
    rightStops: [[0, '#4a6fd6'], [0.35, '#3a5cc4'], [1, '#2b4a9e']],
    icons: [
      { cx: 833, kind: 'monitor' }, { cx: 935, kind: 'square' }, { cx: 1012, kind: 'windows' }
    ],
    iconSize: 26
  },
  content: { y: 353, h: 689 },
  text: { x: 137, fontSize: 73, bold: false, pitch: 88, top: 456, maxWRatio: 0.46 },
  figure: { cx: 830, feetY: 1000, h: 553, pose: 'shrug' },
  ctrl: {
    whiteTop: 35, // strip putih di atas bar biru
    y: 1078, h: 158,
    stops: [[0, '#98baff'], [0.14, '#456cd3'], [0.5, '#3f62c2'], [1, '#1e2f75']],
    seek: {
      arrowsL: { x0: 228, x1: 272, cy: 1122, s: 15 },
      thumb: { x: 276, y: 1100, w: 22, h: 41 },
      track: { x0: 302, x1: 998, y: 1119, h: 7 },
      arrowsR: { x0: 1000, x1: 1044, cy: 1122, s: 15 }
    },
    play: { cx: 104, cy: 1145, r: 41 },
    stop: { cx: 208, cy: 1155, w: 64, h: 70, sq: 21 },
    prev: { cx: 320, cy: 1183, w: 80, h: 52 },
    next: { cx: 400, cy: 1183, w: 80, h: 52 },
    eject: { cx: 476, cy: 1183, w: 64, h: 52 },
    vol: { x0: 545, x1: 642, cy: 1195, h0: 11, h1: 17, thumb: { x: 648, w: 12, y0: 1170, y1: 1218 } }
  }
};

const CFG2 = {
  W: 720, H: 1280,
  win: { x: 0, y: 247, w: 720, h: 795, border: 4, radius: 10 },
  title: {
    y: 250, h: 64,
    stops: [[0, '#328bff'], [0.1, '#0a6af0'], [0.25, '#0057e5'],
            [0.55, '#0057e5'], [0.85, '#0166ff'], [1, '#004fc9']],
    icon: { cx: 35, cy: 282, r: 20 },
    textX: 70, textY: 283, font: '700 30px ' + FONT_STACK,
    cap: { y: 259, w: 40, h: 47, gap: 8, xs: [556, 604, 652] }
  },
  menu: { y: 316, h: 44, bg: '#fbfaf6', font: '400 28px ' + FONT_STACK, x0: 16, gap: 24 },
  toolbar: {
    y: 368, h: 21, splitX: 465,
    leftStops: [[0, '#fefdfb'], [0.5, '#d7d9e4'], [1, '#7c81a3']],
    rightStops: [[0, '#4a6fd6'], [0.35, '#3a5cc4'], [1, '#2b4a9e']],
    icons: [
      { cx: 533, kind: 'monitor' }, { cx: 600, kind: 'square' }, { cx: 667, kind: 'windows' }
    ],
    iconSize: 16
  },
  content: { y: 390, h: 540 },
  text: { x: 88, fontSize: 56, bold: true, pitch: 78, top: 431, maxWRatio: 0.55 },
  figure: { cx: 545, feetY: 832, h: 367, pose: 'up' },
  ctrl: {
    whiteTop: 0,
    y: 934, h: 100,
    stops: [[0, '#98baff'], [0.14, '#456cd3'], [0.5, '#3f62c2'], [1, '#1e2f75']],
    seek: {
      arrowsL: { x0: 115, x1: 155, cy: 962, s: 11 },
      thumb: { x: 159, y: 945, w: 15, h: 28 },
      track: { x0: 185, x1: 640, y: 958, h: 6 },
      arrowsR: { x0: 650, x1: 690, cy: 962, s: 11 }
    },
    play: { cx: 63, cy: 988, r: 29 },
    stop: { cx: 130, cy: 988, w: 44, h: 46, sq: 15 },
    prev: { cx: 196, cy: 1000, w: 64, h: 36 },
    next: { cx: 290, cy: 1000, w: 64, h: 36 },
    eject: { cx: 382, cy: 1000, w: 52, h: 36 },
    vol: { x0: 440, x1: 540, cy: 992, h0: 8, h1: 13, thumb: { x: 540, w: 14, y0: 978, y1: 1016 } }
  }
};

/* ============ BACKGROUND (prosedural, tanpa fetch) ============ */

function drawBackground(ctx, W, H, style) {
  if (style === '2') {
    // putih dengan garis cahaya biru diagonal
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#f4f9ff');
    bg.addColorStop(0.5, '#ffffff');
    bg.addColorStop(1, '#eef4fc');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.globalAlpha = 0.5;
    for (let i = 0; i < 7; i++) {
      const x0 = (i * 173) % (W + 200) - 100;
      const g = ctx.createLinearGradient(x0, 0, x0 + 90, 0);
      g.addColorStop(0, 'rgba(140,190,255,0)');
      g.addColorStop(0.5, 'rgba(140,190,255,0.35)');
      g.addColorStop(1, 'rgba(140,190,255,0)');
      ctx.fillStyle = g;
      ctx.save();
      ctx.translate(x0, 0); ctx.rotate(0.35); ctx.translate(-x0, 0);
      ctx.fillRect(x0, -100, 90, H + 200);
      ctx.restore();
    }
    ctx.restore();
    return;
  }
  // bokeh biru-ungu seperti wallpaper referensi
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#3c5fb8');
  bg.addColorStop(0.45, '#5a6fc4');
  bg.addColorStop(1, '#8d8fc9');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  const blobs = [
    [0.12, 0.1, 130, 'rgba(150,170,255,0.5)'], [0.35, 0.06, 90, 'rgba(200,150,255,0.45)'],
    [0.62, 0.12, 150, 'rgba(120,150,255,0.5)'], [0.88, 0.08, 100, 'rgba(255,170,220,0.4)'],
    [0.2, 0.85, 140, 'rgba(140,160,255,0.45)'], [0.55, 0.92, 110, 'rgba(180,150,255,0.4)'],
    [0.85, 0.88, 150, 'rgba(130,160,255,0.5)'], [0.45, 0.5, 200, 'rgba(255,255,255,0.12)'],
    [0.75, 0.35, 80, 'rgba(255,200,230,0.35)'], [0.08, 0.45, 90, 'rgba(160,200,255,0.4)']
  ];
  for (const [fx, fy, r, col] of blobs) {
    const g = ctx.createRadialGradient(W * fx, H * fy, 4, W * fx, H * fy, r);
    g.addColorStop(0, col);
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(W * fx - r, H * fy - r, r * 2, r * 2);
  }
  // semburat cahaya atas
  const gl = ctx.createRadialGradient(W / 2, -80, 20, W / 2, -80, 620);
  gl.addColorStop(0, 'rgba(255,255,255,0.5)');
  gl.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gl;
  ctx.fillRect(0, 0, W, 500);
}

/* ============ RENDERER UTAMA ============ */

export function drawWmpScene(ctx, segments, style, W, H) {
  const cfg = style === '2' ? CFG2 : CFG1;
  W = cfg.W; H = cfg.H;
  const wn = cfg.win;
  const ix = wn.x + wn.border, iw = wn.w - wn.border * 2;

  drawBackground(ctx, W, H, style);

  // bayangan jendela
  ctx.save();
  ctx.shadowColor = 'rgba(0,15,70,0.5)';
  ctx.shadowBlur = 34;
  ctx.shadowOffsetY = 14;
  ctx.fillStyle = '#ffffff';
  rrPath(ctx, wn.x, wn.y, wn.w, wn.h, wn.radius);
  ctx.fill();
  ctx.restore();

  // isi jendela (clip)
  ctx.save();
  rrPath(ctx, wn.x, wn.y, wn.w, wn.h, wn.radius);
  ctx.clip();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(wn.x, wn.y, wn.w, wn.h);

  /* ---- title bar ---- */
  const tb = cfg.title;
  ctx.fillStyle = vgrad(ctx, tb.y, tb.h, tb.stops);
  ctx.fillRect(ix, tb.y, iw, tb.h);
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.fillRect(ix, tb.y, iw, 2);

  wmpIcon(ctx, tb.icon.cx, tb.icon.cy, tb.icon.r);

  ctx.font = tb.font;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(0,25,90,0.6)';
  ctx.fillText('Windows Media Player', tb.textX + 1, tb.textY + 2);
  ctx.fillStyle = '#ffffff';
  ctx.fillText('Windows Media Player', tb.textX, tb.textY);

  const kinds = ['min', 'max', 'close'];
  tb.cap.xs.forEach((bx, i) => capButton(ctx, bx, tb.cap.y, tb.cap.w, tb.cap.h, kinds[i]));

  /* ---- menu bar ---- */
  const mn = cfg.menu;
  ctx.fillStyle = mn.bg;
  ctx.fillRect(ix, mn.y, iw, mn.h);
  ctx.font = mn.font;
  ctx.fillStyle = '#141414';
  ctx.textBaseline = 'middle';
  const items = ['File', 'View', 'Play', 'Tools', 'Help'];
  let mx = ix + mn.x0;
  const myy = mn.y + mn.h / 2 + 1;
  for (const it of items) {
    ctx.fillText(it, mx, myy);
    const w0 = ctx.measureText(it[0]).width;
    ctx.fillRect(mx, myy + mn.h * 0.22, w0, 2); // garis bawah mnemonik
    mx += ctx.measureText(it).width + mn.gap;
  }
  // garis pemisah bawah menu
  ctx.fillStyle = '#b9b4a6';
  ctx.fillRect(ix, mn.y + mn.h - 1, iw, 1);

  /* ---- toolbar strip ---- */
  const ts = cfg.toolbar;
  ctx.fillStyle = vgrad(ctx, ts.y, ts.h, ts.leftStops);
  ctx.fillRect(ix, ts.y, ts.splitX - ix, ts.h);
  ctx.fillStyle = vgrad(ctx, ts.y, ts.h, ts.rightStops);
  ctx.fillRect(ts.splitX, ts.y, ix + iw - ts.splitX, ts.h);
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillRect(ix, ts.y, iw, 2);
  ctx.fillStyle = 'rgba(0,0,60,0.35)';
  ctx.fillRect(ix, ts.y + ts.h - 1, iw, 1);
  // garis vertikal pemisah segmen
  ctx.fillStyle = 'rgba(0,0,60,0.4)';
  ctx.fillRect(ts.splitX - 1, ts.y + 3, 2, ts.h - 6);
  // 3 ikon garis putih
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = Math.max(2, ts.iconSize * 0.11);
  ctx.lineCap = 'round';
  const icy = ts.y + ts.h / 2, isz = ts.iconSize / 2;
  for (const ic of ts.icons) {
    if (ic.kind === 'monitor') {
      ctx.strokeRect(ic.cx - isz, icy - isz * 0.85, isz * 2, isz * 1.7);
      ctx.strokeRect(ic.cx - isz * 0.55, icy - isz * 0.45, isz * 1.1, isz * 0.9);
    } else if (ic.kind === 'square') {
      ctx.strokeRect(ic.cx - isz * 0.6, icy - isz * 0.6, isz * 1.2, isz * 1.2);
    } else {
      ctx.strokeRect(ic.cx - isz * 0.9, icy - isz * 0.7, isz * 1.1, isz * 1.15);
      ctx.strokeRect(ic.cx - isz * 0.2, icy - isz * 0.45, isz * 1.1, isz * 1.15);
    }
  }

  /* ---- area konten ---- */
  const ct = cfg.content;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(ix, ct.y, iw, ct.h);
  ctx.strokeStyle = '#7f9db9';
  ctx.lineWidth = 2;
  ctx.strokeRect(ix + 1, ct.y + 1, iw - 2, ct.h - 2);

  /* ---- teks quote ---- */
  const tx = cfg.text;
  const weight = tx.bold ? '700' : '400';
  let fs = tx.fontSize, qlines, lh;
  const maxW = iw * tx.maxWRatio;
  for (;;) {
    const font = weight + ' ' + fs + 'px ' + FONT_STACK;
    lh = fs * 1.21;
    qlines = wrapSegments(ctx, segments, maxW, font);
    const blockH = (qlines.length - 1) * lh + fs;
    if (tx.top + blockH <= ct.y + ct.h - 20 || fs <= 24) break;
    fs -= 2;
  }
  ctx.font = weight + ' ' + fs + 'px ' + FONT_STACK;
  ctx.fillStyle = '#000000';
  ctx.textBaseline = 'alphabetic';
  let ty = tx.top + fs * 0.78;
  for (const ln of qlines) {
    ctx.fillText(ln || ' ', tx.x, ty);
    ty += lh;
  }

  /* ---- figur 3D ---- */
  const fg = cfg.figure;
  drawFigure(ctx, fg.cx, fg.feetY, fg.h, fg.pose);

  /* ---- control bar ---- */
  const cb = cfg.ctrl;
  const ctrlY = ct.y + ct.h;
  if (cb.whiteTop > 0) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(ix, ctrlY, iw, cb.whiteTop);
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.fillRect(ix, ctrlY, iw, 2);
  }
  const barY = ctrlY + cb.whiteTop;
  ctx.fillStyle = vgrad(ctx, barY, cb.h, cb.stops);
  ctx.fillRect(ix, barY, iw, cb.h);
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.fillRect(ix, barY, iw, 2);
  ctx.fillStyle = 'rgba(0,0,60,0.35)';
  ctx.fillRect(ix, barY + cb.h - 2, iw, 2);

  // seek bar
  const sk = cb.seek;
  const triC = '#22377e';
  // panah kiri (outline putih + isi navy)
  for (const [ax, flip] of [[sk.arrowsL.x0 + sk.s, true], [sk.arrowsL.x0 + sk.s * 2.6, true]]) {
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(ax + sk.s, sk.arrowsL.cy - sk.s * 0.85);
    ctx.lineTo(ax + sk.s, sk.arrowsL.cy + sk.s * 0.85);
    ctx.lineTo(ax - sk.s, sk.arrowsL.cy);
    ctx.closePath(); ctx.stroke();
    tri(ctx, ax, sk.arrowsL.cy, sk.s * 0.72, flip, triC);
  }
  for (const [ax, flip] of [[sk.arrowsR.x1 - sk.s * 2.6, false], [sk.arrowsR.x1 - sk.s, false]]) {
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(ax - sk.s, sk.arrowsR.cy - sk.s * 0.85);
    ctx.lineTo(ax - sk.s, sk.arrowsR.cy + sk.s * 0.85);
    ctx.lineTo(ax + sk.s, sk.arrowsR.cy);
    ctx.closePath(); ctx.stroke();
    tri(ctx, ax, sk.arrowsR.cy, sk.s * 0.72, flip, triC);
  }
  // track
  const trg = ctx.createLinearGradient(0, sk.track.y, 0, sk.track.y + sk.track.h);
  trg.addColorStop(0, '#c9d8f8'); trg.addColorStop(0.5, '#e8efff'); trg.addColorStop(1, '#a9bde8');
  rrPath(ctx, sk.track.x0, sk.track.y, sk.track.x1 - sk.track.x0, sk.track.h, sk.track.h / 2);
  ctx.fillStyle = trg; ctx.fill();
  ctx.strokeStyle = 'rgba(40,60,130,0.5)'; ctx.lineWidth = 1.5; ctx.stroke();
  // thumb
  greenThumb(ctx, sk.thumb.x, sk.thumb.y, sk.thumb.w, sk.thumb.h);

  // tombol play (lingkaran besar)
  const pg = ctx.createRadialGradient(cb.play.cx - 10, cb.play.cy - 12, 4, cb.play.cx, cb.play.cy, cb.play.r);
  pg.addColorStop(0, '#ffffff'); pg.addColorStop(0.65, '#dde4f2'); pg.addColorStop(1, '#a7b6d1');
  ctx.beginPath(); ctx.arc(cb.play.cx, cb.play.cy, cb.play.r, 0, Math.PI * 2);
  ctx.fillStyle = pg; ctx.fill();
  ctx.strokeStyle = '#5b6f94'; ctx.lineWidth = 2.5; ctx.stroke();
  tri(ctx, cb.play.cx + cb.play.r * 0.08, cb.play.cy, cb.play.r * 0.42, false, '#1e4fae');

  // stop (oval vertikal + kotak navy)
  silverBtn(ctx, cb.stop.cx, cb.stop.cy, cb.stop.w, cb.stop.h);
  ctx.fillStyle = '#1e3f8f';
  const sq = cb.stop.sq;
  rrPath(ctx, cb.stop.cx - sq / 2, cb.stop.cy - sq / 2, sq, sq * 1.15, 3);
  ctx.fill();

  // prev / next
  silverBtn(ctx, cb.prev.cx, cb.prev.cy, cb.prev.w, cb.prev.h);
  const ps = cb.prev.h * 0.28;
  ctx.fillStyle = triC;
  ctx.fillRect(cb.prev.cx - cb.prev.w * 0.32, cb.prev.cy - ps, 4, ps * 2);
  tri(ctx, cb.prev.cx - ps * 0.4, cb.prev.cy, ps * 0.75, true);
  tri(ctx, cb.prev.cx + ps * 0.75, cb.prev.cy, ps * 0.75, true);
  silverBtn(ctx, cb.next.cx, cb.next.cy, cb.next.w, cb.next.h);
  tri(ctx, cb.next.cx - ps * 0.75, cb.next.cy, ps * 0.75, false);
  tri(ctx, cb.next.cx + ps * 0.4, cb.next.cy, ps * 0.75, false);
  ctx.fillRect(cb.next.cx + cb.next.w * 0.32 - 4, cb.next.cy - ps, 4, ps * 2);

  // eject
  silverBtn(ctx, cb.eject.cx, cb.eject.cy, cb.eject.w, cb.eject.h);
  const es = cb.eject.h * 0.3;
  tri(ctx, cb.eject.cx - es * 0.3, cb.eject.cy - es * 0.25, es * 0.7, true);
  ctx.fillStyle = triC;
  ctx.beginPath();
  ctx.moveTo(cb.eject.cx - es * 0.7, cb.eject.cy + es * 0.55);
  ctx.lineTo(cb.eject.cx + es * 0.7, cb.eject.cy + es * 0.55);
  ctx.lineTo(cb.eject.cx, cb.eject.cy - es * 0.35);
  ctx.closePath(); ctx.fill();
  ctx.fillRect(cb.eject.cx - es * 0.7, cb.eject.cy + es * 0.7, es * 1.4, 3);

  // volume: wedge hijau meruncing + thumb
  const vv = cb.vol;
  const vg = ctx.createLinearGradient(vv.x0, 0, vv.x1, 0);
  vg.addColorStop(0, '#4fe04f'); vg.addColorStop(1, '#1da31d');
  ctx.beginPath();
  ctx.moveTo(vv.x0, vv.cy + vv.h0 / 2);
  ctx.lineTo(vv.x1, vv.cy + vv.h1 / 2);
  ctx.lineTo(vv.x1, vv.cy - vv.h1 / 2);
  ctx.lineTo(vv.x0, vv.cy - vv.h0 / 2);
  ctx.closePath();
  ctx.fillStyle = vg; ctx.fill();
  greenThumb(ctx, vv.thumb.x, vv.thumb.y0, vv.thumb.w, vv.thumb.y1 - vv.thumb.y0);

  ctx.restore(); // lepas clip jendela

  /* ---- border jendela ---- */
  rrPath(ctx, wn.x, wn.y, wn.w, wn.h, wn.radius);
  ctx.strokeStyle = '#0d2f9e';
  ctx.lineWidth = wn.border;
  ctx.stroke();
}

function drawStyle1(lines) {
  const cv = drawStyle1._cv;
  cv.width = CFG1.W; cv.height = CFG1.H;
  drawWmpScene(cv.getContext('2d'), lines, '1', cv.width, cv.height);
}

function drawStyle2(lines) {
  const cv = drawStyle2._cv;
  cv.width = CFG2.W; cv.height = CFG2.H;
  drawWmpScene(cv.getContext('2d'), lines, '2', cv.width, cv.height);
}

export function render(root) {

  let style = '1';

  const cv = document.createElement('canvas');
  drawStyle1._cv = cv;
  drawStyle2._cv = cv;

  const inp = T.input('text', 'Tulis quote, pisahkan baris dengan |', 'ngapain cemburu|kan|cuman sebatas|teman');
  const box = T.out();
  const preview = T.el('<div style="margin-top:12px;display:flex;justify-content:center"></div>');
  const imgPrev = document.createElement('img');
  imgPrev.style.cssText = 'max-width:100%;height:auto;border-radius:12px;border:1px solid #ffffff20;display:none';
  preview.appendChild(imgPrev);

  const styleBtns = T.el('<div style="display:flex;gap:8px;margin-bottom:12px"></div>');
  const b1 = T.btn('Style 1 — Shrug', null, true);
  const b2 = T.btn('Style 2 — Angkat Tangan', null);
  const setStyle = (s) => {
    style = s;
    b1.classList.toggle('primary', s === '1');
    b2.classList.toggle('primary', s === '2');
  };
  b1.addEventListener('click', () => setStyle('1'));
  b2.addEventListener('click', () => setStyle('2'));
  styleBtns.appendChild(b1); styleBtns.appendChild(b2);

  const generate = () => {
    const text = inp.value.trim();
    if (!text) { alert('Isi teks dulu!'); inp.focus(); return; }
    const lines = text.split('|').map((s) => s.trim());
    if (style === '1') drawStyle1(lines);
    else drawStyle2(lines);
    imgPrev.src = cv.toDataURL('image/png');
    imgPrev.style.display = 'block';
    T.hide(box);
  };

  const bDl = T.btn('Unduh PNG', () => {
    if (!imgPrev.src) { T.show(box, errBox('Generate dulu gambarnya.')); return; }
    cv.toBlob((b) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(b);
      a.download = 'WindowsQuote_' + Date.now() + '.png';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    }, 'image/png');
  });
  const bCopy = T.copyBtn(() => null, 'Salin Gambar');
  bCopy.addEventListener('click', async () => {
    if (!imgPrev.src) { T.show(box, errBox('Generate dulu gambarnya.')); return; }
    try {
      const blob = await new Promise((res) => cv.toBlob(res, 'image/png'));
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      T.show(box, '<span class="ok">Gambar tersalin ke clipboard.</span>');
    } catch (e) { T.show(box, errBox('Browser ini tidak mendukung salin gambar. Pakai tombol Unduh.')); }
  });

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Bikin gambar quote gaya Windows Media Player. Pisahkan tiap baris dengan tanda <b>|</b> — digambar langsung di perangkatmu, tanpa server.</p>'));
  root.appendChild(T.el('<div style="margin-bottom:4px"><b>Pilih Style</b></div>'));
  root.appendChild(styleBtns);
  root.appendChild(T.field('Teks (pisahkan baris dengan |)', inp));
  root.appendChild(T.row(T.btn('Generate', generate, true)));
  root.appendChild(preview);
  root.appendChild(T.row(bDl, bCopy));
  root.appendChild(box);
}
