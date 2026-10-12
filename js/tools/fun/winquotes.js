import { h as T, errBox } from '../../core.js?v=6.9.20';

export const meta = {"id": "winquotes", "name": "Windows Quotes", "cat": "fun", "icon": "🪟", "desc": "Bikin gambar quote ala Windows Media Player.", "keywords": "windows,media player,quote,kutipan,meme,gambar"};

const FONT_STACK = '"Segoe UI", system-ui, "Noto Sans", sans-serif';

/* ============================================================
 * Replika visual jendela Windows Media Player (XP) — 100% digambar
 * via canvas, tanpa aset eksternal / API server.
 * Diekspor agar bisa diuji via node (@napi-rs/canvas).
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

// Lengan/tungkai kapsul meruncing dengan shading 3D sederhana.
function limb(ctx, x1, y1, x2, y2, w1, w2) {
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const len = Math.hypot(x2 - x1, y2 - y1);
  const mw = Math.max(w1, w2);
  ctx.save();
  ctx.translate(x1, y1);
  ctx.rotate(ang);
  const g = ctx.createLinearGradient(0, -mw / 2, 0, mw / 2);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.55, '#f0f0f4');
  g.addColorStop(1, '#c2c2cc');
  ctx.beginPath();
  ctx.moveTo(0, -w1 / 2);
  ctx.lineTo(len, -w2 / 2);
  ctx.arc(len, 0, w2 / 2, -Math.PI / 2, Math.PI / 2);
  ctx.lineTo(0, w1 / 2);
  ctx.arc(0, 0, w1 / 2, Math.PI / 2, Math.PI * 1.5);
  ctx.closePath();
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = 'rgba(100,100,112,0.5)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

// Bola (kepala) dengan highlight radial.
function ball(ctx, cx, cy, r) {
  const g = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.42, r * 0.08, cx, cy, r);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.6, '#f3f3f6');
  g.addColorStop(1, '#c0c0ca');
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = 'rgba(100,100,112,0.45)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.beginPath();
  ctx.ellipse(cx - r * 0.32, cy - r * 0.4, r * 0.32, r * 0.2, -0.5, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.restore();
}

// Figur 3D putih stilasi. pose: 'shrug' (tangan ke samping, telapak ke atas)
// atau 'up' (tangan ke atas, selebrasi). targetH = tinggi total kepala..kaki.
function drawFigure(ctx, cx, feetY, targetH, pose) {
  const s = targetH / 334; // skala dari tinggi natural
  ctx.save();
  ctx.translate(cx, feetY);
  ctx.scale(s, s);
  ctx.translate(-cx, -feetY);

  // bayangan lembut di bawah kaki
  const sh = ctx.createRadialGradient(cx, feetY + 8, 8, cx, feetY + 8, 130);
  sh.addColorStop(0, 'rgba(20,20,40,0.2)');
  sh.addColorStop(1, 'rgba(20,20,40,0)');
  ctx.fillStyle = sh;
  ctx.beginPath();
  ctx.ellipse(cx, feetY + 8, 130, 18, 0, 0, Math.PI * 2);
  ctx.fill();

  const hipY = feetY - 96;
  const shY = hipY - 100;

  // kaki
  limb(ctx, cx - 32, hipY, cx - 42, feetY - 16, 52, 44);
  limb(ctx, cx + 32, hipY, cx + 42, feetY - 16, 52, 44);
  // sepatu (elips membulat)
  for (const q of [-1, 1]) {
    ctx.save();
    ctx.translate(cx + q * 56, feetY - 8);
    ctx.rotate(q * 0.1);
    const fg = ctx.createLinearGradient(0, -21, 0, 21);
    fg.addColorStop(0, '#ffffff');
    fg.addColorStop(1, '#c6c6d0');
    ctx.beginPath();
    ctx.ellipse(0, 0, 44, 21, 0, 0, Math.PI * 2);
    ctx.fillStyle = fg;
    ctx.fill();
    ctx.strokeStyle = 'rgba(100,100,112,0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  // torso (membulat, bahu -> pinggang)
  const tg = ctx.createLinearGradient(cx - 70, 0, cx + 70, 0);
  tg.addColorStop(0, '#ffffff');
  tg.addColorStop(0.55, '#f1f1f5');
  tg.addColorStop(1, '#c4c4cf');
  ctx.beginPath();
  ctx.moveTo(cx - 68, shY + 4);
  ctx.bezierCurveTo(cx - 76, shY + 44, cx - 62, shY + 74, cx - 54, hipY + 2);
  ctx.quadraticCurveTo(cx, hipY + 12, cx + 54, hipY + 2);
  ctx.bezierCurveTo(cx + 62, shY + 74, cx + 76, shY + 44, cx + 68, shY + 4);
  ctx.quadraticCurveTo(cx, shY - 10, cx - 68, shY + 4);
  ctx.closePath();
  ctx.fillStyle = tg;
  ctx.fill();
  ctx.strokeStyle = 'rgba(100,100,112,0.5)';
  ctx.lineWidth = 2;
  ctx.stroke();
  // highlight dada kiri
  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.beginPath();
  ctx.ellipse(cx - 30, shY + 40, 17, 30, 0.25, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.restore();

  // lengan
  if (pose === 'up') {
    // selebrasi: lengan menekuk, tangan setinggi puncak kepala
    for (const q of [-1, 1]) {
      const sx = cx + q * 62, sy = shY + 16;
      const ex = cx + q * 118, ey = sy - 44;
      const wx = cx + q * 140, wy = sy - 98;
      limb(ctx, sx, sy, ex, ey, 38, 32);
      limb(ctx, ex, ey, wx, wy, 32, 27);
      // kepalan tangan + jempol ke atas
      ctx.save();
      ctx.translate(wx, wy - 6);
      ctx.rotate(q * -0.1);
      const hg = ctx.createLinearGradient(0, -24, 0, 24);
      hg.addColorStop(0, '#ffffff');
      hg.addColorStop(1, '#c9c9d3');
      rrPath(ctx, -20, -24, 40, 48, 16);
      ctx.fillStyle = hg;
      ctx.fill();
      ctx.strokeStyle = 'rgba(100,100,112,0.5)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(q * 16, -30, 9, 0, Math.PI * 2);
      ctx.fillStyle = '#f4f4f7';
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  } else {
    // shrug: lengan ke samping, telapak tangan pipih menghadap ke atas
    // setinggi bahu
    for (const q of [-1, 1]) {
      const sx = cx + q * 62, sy = shY + 16;
      const ex = cx + q * 118, ey = sy + 28;
      const wx = cx + q * 172, wy = sy - 8;
      limb(ctx, sx, sy, ex, ey, 38, 32);
      limb(ctx, ex, ey, wx, wy, 32, 27);
      // telapak: elips pipih horizontal, sisi atas lebih terang
      ctx.save();
      ctx.translate(wx + q * 12, wy);
      ctx.rotate(q * 0.1);
      const pg = ctx.createLinearGradient(0, -15, 0, 15);
      pg.addColorStop(0, '#ffffff');
      pg.addColorStop(1, '#cdccd5');
      ctx.beginPath();
      ctx.ellipse(0, 0, 46, 14, 0, 0, Math.PI * 2);
      ctx.fillStyle = pg;
      ctx.fill();
      ctx.strokeStyle = 'rgba(100,100,112,0.55)';
      ctx.lineWidth = 2;
      ctx.stroke();
      // jempol kecil di sisi dalam
      ctx.beginPath();
      ctx.arc(q * -36, -6, 9, 0, Math.PI * 2);
      ctx.fillStyle = '#f4f4f7';
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }

  // leher + kepala besar
  ctx.fillStyle = '#e8e8ee';
  ctx.fillRect(cx - 18, shY - 40, 36, 32);
  ball(ctx, cx, shY - 76, 58);

  ctx.restore();
}

export function drawWmpScene(ctx, segments, style, W, H) {
  W = W || 1200; H = H || 630;
  const WX = 70, WY = 30, WW = 1060, WH = 570, BD = 5;
  const ix = WX + BD, iw = WW - BD * 2;            // area dalam border
  const titleH = 58, menuH = 40, toolH = 36, ctrlH = 88;
  const titleY = WY + BD;
  const menuY = titleY + titleH;
  const toolY = menuY + menuH;
  const contY = toolY + toolH;
  const ctrlY = WY + WH - BD - ctrlH;
  const contH = ctrlY - contY;
  const contX2 = ix + iw;

  /* ---- background: wallpaper biru + highlight radial ---- */
  let bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#6ea8e8');
  bg.addColorStop(1, '#cfe6fb');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  const glow = (gx, gy, r, a) => {
    const g = ctx.createRadialGradient(gx, gy, 10, gx, gy, r);
    g.addColorStop(0, 'rgba(255,255,255,' + a + ')');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(gx - r, gy - r, r * 2, r * 2);
  };
  glow(W / 2, -60, 520, 0.6);
  glow(150, 110, 260, 0.35);
  glow(1060, 220, 230, 0.3);
  // semburat cahaya halus dari atas
  ctx.save();
  ctx.globalAlpha = 0.05;
  ctx.fillStyle = '#ffffff';
  for (let i = -2; i <= 2; i++) {
    ctx.save();
    ctx.translate(W / 2, -80);
    ctx.rotate(i * 0.16);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-46, 700);
    ctx.lineTo(46, 700);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();

  /* ---- bayangan jendela ---- */
  ctx.save();
  ctx.shadowColor = 'rgba(0,20,80,0.45)';
  ctx.shadowBlur = 30;
  ctx.shadowOffsetY = 12;
  ctx.fillStyle = '#ffffff';
  rrPath(ctx, WX, WY, WW, WH, 14);
  ctx.fill();
  ctx.restore();

  /* ---- isi jendela (clip rounded) ---- */
  ctx.save();
  rrPath(ctx, WX, WY, WW, WH, 14);
  ctx.clip();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(WX, WY, WW, WH);

  /* ---- title bar ---- */
  let tg = ctx.createLinearGradient(0, titleY, 0, titleY + titleH);
  tg.addColorStop(0, '#5aa5ff');
  tg.addColorStop(0.14, '#3a8cfd');
  tg.addColorStop(0.55, '#0d5fe6');
  tg.addColorStop(1, '#0a4fc4');
  ctx.fillStyle = tg;
  ctx.fillRect(ix, titleY, iw, titleH);
  ctx.fillStyle = 'rgba(255,255,255,0.28)';
  ctx.fillRect(ix, titleY, iw, 2);

  // ikon WMP (lingkaran 3 segmen + segitiga play) — digambar sendiri
  const icx = ix + 38, icy = titleY + titleH / 2, ir = 20;
  ctx.beginPath(); ctx.arc(icx, icy, ir, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff'; ctx.fill();
  const seg = (a0, a1, col) => {
    ctx.beginPath(); ctx.moveTo(icx, icy);
    ctx.arc(icx, icy, ir - 2, a0, a1); ctx.closePath();
    ctx.fillStyle = col; ctx.fill();
  };
  seg(-Math.PI / 2, Math.PI / 6, '#f7941e');
  seg(Math.PI / 6, Math.PI * 0.78, '#8dc63f');
  seg(Math.PI * 0.78, Math.PI * 1.5, '#1a5fd0');
  ctx.beginPath();
  ctx.moveTo(icx - 5, icy - 8); ctx.lineTo(icx - 5, icy + 8); ctx.lineTo(icx + 8, icy);
  ctx.closePath(); ctx.fillStyle = '#ffffff'; ctx.fill();
  ctx.beginPath(); ctx.arc(icx, icy, ir, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 1.5; ctx.stroke();

  // judul
  ctx.font = '700 30px ' + FONT_STACK;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(0,20,80,0.65)';
  ctx.fillText('Windows Media Player', ix + 71, icy + 2);
  ctx.fillStyle = '#ffffff';
  ctx.fillText('Windows Media Player', ix + 70, icy);

  // tombol caption: minimize / maximize / close
  const capBtn = (x, kind) => {
    const bw = 48, bh = 38, by = titleY + (titleH - bh) / 2;
    let g = ctx.createLinearGradient(0, by, 0, by + bh);
    if (kind === 'close') { g.addColorStop(0, '#f0957e'); g.addColorStop(1, '#d94f30'); }
    else { g.addColorStop(0, '#4f9bf8'); g.addColorStop(1, '#1663d8'); }
    rrPath(ctx, x, by, bw, bh, 8);
    ctx.fillStyle = g; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = '#ffffff'; ctx.stroke();
    ctx.strokeStyle = '#ffffff'; ctx.fillStyle = '#ffffff'; ctx.lineCap = 'round';
    if (kind === 'min') {
      ctx.lineWidth = 6;
      ctx.beginPath(); ctx.moveTo(x + 13, by + bh - 12); ctx.lineTo(x + 35, by + bh - 12); ctx.stroke();
    } else if (kind === 'max') {
      ctx.lineWidth = 4;
      ctx.strokeRect(x + 13, by + 9, 22, 20);
    } else {
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(x + 14, by + 10); ctx.lineTo(x + 34, by + 28);
      ctx.moveTo(x + 34, by + 10); ctx.lineTo(x + 14, by + 28);
      ctx.stroke();
    }
  };
  const capR = ix + iw - 12;
  capBtn(capR - 48, 'close');
  capBtn(capR - 48 - 10 - 48, 'max');
  capBtn(capR - 48 - 10 - 48 - 10 - 48, 'min');

  /* ---- menu bar ---- */
  ctx.fillStyle = '#f0efe6';
  ctx.fillRect(ix, menuY, iw, menuH);
  ctx.fillStyle = '#c9c4b4';
  ctx.fillRect(ix, menuY + menuH - 1, iw, 1);
  ctx.font = '400 26px ' + FONT_STACK;
  ctx.fillStyle = '#111111';
  ctx.textBaseline = 'middle';
  const items = ['File', 'View', 'Play', 'Tools', 'Help'];
  let mx = ix + 28;
  const myy = menuY + menuH / 2 + 1;
  for (const it of items) {
    ctx.fillText(it, mx, myy);
    const w0 = ctx.measureText(it[0]).width;
    ctx.fillRect(mx, myy + 14, w0, 2);   // underline mnemonik F/V/P/T/H
    mx += ctx.measureText(it).width + 44;
  }

  /* ---- toolbar strip ---- */
  let sbg = ctx.createLinearGradient(0, toolY, 0, toolY + toolH);
  sbg.addColorStop(0, '#ffffff');
  sbg.addColorStop(0.45, '#e9e9e9');
  sbg.addColorStop(0.55, '#cdcdcd');
  sbg.addColorStop(1, '#e4e4e4');
  ctx.fillStyle = sbg;
  ctx.fillRect(ix, toolY, iw, toolH);
  // grip vertikal kecil di kiri
  ctx.fillStyle = '#a8a8a8'; ctx.fillRect(ix + 262, toolY + 7, 3, toolH - 14);
  ctx.fillStyle = '#ffffff'; ctx.fillRect(ix + 267, toolY + 7, 3, toolH - 14);
  // segmen biru kanan + 3 ikon kecil
  const segX = ix + iw - 400;
  let bbg = ctx.createLinearGradient(0, toolY, 0, toolY + toolH);
  bbg.addColorStop(0, '#5b8def');
  bbg.addColorStop(1, '#2a5fd0');
  ctx.fillStyle = bbg;
  ctx.fillRect(segX, toolY, 400, toolH);
  for (let i = 0; i < 3; i++) {
    const qx = segX + 70 + i * 115, qy = toolY + toolH / 2;
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3;
    rrPath(ctx, qx - 15, qy - 12, 30, 24, 3); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(qx - 15, qy + 2); ctx.lineTo(qx + 15, qy + 2); ctx.stroke();
  }

  /* ---- area konten ---- */
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(ix, contY, iw, contH);
  // border inset
  ctx.strokeStyle = '#7f9db9'; ctx.lineWidth = 2;
  ctx.strokeRect(ix + 1, contY + 1, iw - 2, contH - 2);
  ctx.fillStyle = 'rgba(0,0,0,0.07)';
  ctx.fillRect(ix + 2, contY + 2, iw - 4, 3);

  /* ---- teks quote: wrap by pixel, auto-fit bila overflow ---- */
  const isBold = style === '2';
  let fs = isBold ? 46 : 44;
  const weight = isBold ? '700' : '400';
  let qlines, lh;
  for (;;) {
    const font = weight + ' ' + fs + 'px ' + FONT_STACK;
    lh = fs * 1.28;
    qlines = wrapSegments(ctx, segments, fs * 5.2, font);
    const blockH = (qlines.length - 1) * lh + fs * 1.02;
    if (56 + blockH <= contH - 14 || fs <= 20) break;
    fs -= 1;
  }
  ctx.font = weight + ' ' + fs + 'px ' + FONT_STACK;
  ctx.fillStyle = '#000000';
  ctx.textBaseline = 'alphabetic';
  const tx = ix + 70;
  let ty = contY + 56 + fs * 0.82;
  for (const ln of qlines) {
    ctx.fillText(ln || ' ', tx, ty);
    ty += lh;
  }

  /* ---- figur 3D ---- */
  drawFigure(ctx, ix + iw * 0.76, contY + contH - 16, style === '2' ? 285 : 292, style === '2' ? 'up' : 'shrug');

  /* ---- control bar bawah ---- */
  let cbg = ctx.createLinearGradient(0, ctrlY, 0, ctrlY + ctrlH);
  cbg.addColorStop(0, '#2e6be4');
  cbg.addColorStop(1, '#17479e');
  ctx.fillStyle = cbg;
  ctx.fillRect(ix, ctrlY, iw, ctrlH);
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillRect(ix, ctrlY, iw, 2);

  const silver = (x, y, w, h, r) => {
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.5, '#dbe2ef');
    g.addColorStop(1, '#a9b8d2');
    rrPath(ctx, x, y, w, h, r);
    ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = '#5f7396'; ctx.lineWidth = 2; ctx.stroke();
  };
  const navyTri = (cxp, cyp, s, flip) => {
    ctx.beginPath();
    if (flip) { ctx.moveTo(cxp + s, cyp - s * 0.7); ctx.lineTo(cxp + s, cyp + s * 0.7); ctx.lineTo(cxp - s, cyp); }
    else { ctx.moveTo(cxp - s, cyp - s * 0.7); ctx.lineTo(cxp - s, cyp + s * 0.7); ctx.lineTo(cxp + s, cyp); }
    ctx.closePath(); ctx.fillStyle = '#1e3f8f'; ctx.fill();
  };
  const ccy = ctrlY + ctrlH / 2 + 14;

  // seek bar (baris atas, di atas tombol-tombol)
  const seekY = ctrlY + 13;
  ctx.fillStyle = 'rgba(220,235,255,0.9)';
  navyTri(ix + 232, seekY + 5, 7, true); navyTri(ix + 246, seekY + 5, 7, true);
  navyTri(contX2 - 96, seekY + 5, 7, false); navyTri(contX2 - 82, seekY + 5, 7, false);
  const skX = ix + 266, skW = contX2 - ix - 266 - 120;
  const skg = ctx.createLinearGradient(0, seekY, 0, seekY + 10);
  skg.addColorStop(0, '#dfe7f4'); skg.addColorStop(1, '#9fb0c8');
  rrPath(ctx, skX, seekY, skW, 10, 5);
  ctx.fillStyle = skg; ctx.fill();
  ctx.strokeStyle = '#5f7396'; ctx.lineWidth = 1.5; ctx.stroke();
  // thumb hijau-putih di ~18%
  const thX = skX + skW * 0.18;
  const thg = ctx.createLinearGradient(0, 0, 16, 0);
  thg.addColorStop(0, '#ffffff'); thg.addColorStop(1, '#2fc72f');
  rrPath(ctx, thX - 8, seekY - 9, 16, 28, 6);
  ctx.fillStyle = thg; ctx.fill();
  ctx.strokeStyle = '#1a8a1a'; ctx.lineWidth = 1.5; ctx.stroke();

  // tombol play (lingkaran besar)
  const pg = ctx.createRadialGradient(ix + 74, ccy - 12, 6, ix + 80, ccy, 36);
  pg.addColorStop(0, '#ffffff'); pg.addColorStop(0.7, '#dbe2ef'); pg.addColorStop(1, '#a9b8d2');
  ctx.beginPath(); ctx.arc(ix + 80, ccy, 34, 0, Math.PI * 2);
  ctx.fillStyle = pg; ctx.fill();
  ctx.strokeStyle = '#5f7396'; ctx.lineWidth = 2.5; ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(ix + 70, ccy - 13); ctx.lineTo(ix + 70, ccy + 13); ctx.lineTo(ix + 94, ccy);
  ctx.closePath(); ctx.fillStyle = '#1e4fae'; ctx.fill();

  // stop (oval + kotak navy)
  silver(ix + 128, ccy - 26, 46, 52, 23);
  ctx.fillStyle = '#1e3f8f';
  rrPath(ctx, ix + 142, ccy - 11, 18, 22, 3); ctx.fill();

  // prev / next (oval + panah ganda)
  silver(ix + 186, ccy - 22, 62, 44, 22);
  navyTri(ix + 208, ccy, 8, true); navyTri(ix + 222, ccy, 8, true);
  silver(ix + 258, ccy - 22, 62, 44, 22);
  navyTri(ix + 280, ccy, 8, false); navyTri(ix + 294, ccy, 8, false);

  // tombol oval ke-5 (eject) — ada jeda seperti di referensi
  silver(ix + 463, ccy - 22, 62, 44, 22);
  ctx.fillStyle = '#1e3f8f';
  ctx.beginPath();
  ctx.moveTo(ix + 494, ccy - 10); ctx.lineTo(ix + 480, ccy + 6); ctx.lineTo(ix + 508, ccy + 6);
  ctx.closePath(); ctx.fill();
  ctx.fillRect(ix + 480, ccy + 9, 28, 5);

  // volume: wedge hijau + thumb
  const vx = ix + 572;
  const vg = ctx.createLinearGradient(vx, 0, vx + 100, 0);
  vg.addColorStop(0, '#7ce87c'); vg.addColorStop(1, '#1fae1f');
  ctx.beginPath();
  ctx.moveTo(vx, ccy + 16);
  ctx.lineTo(vx + 100, ccy - 8);
  ctx.lineTo(vx + 100, ccy + 20);
  ctx.closePath();
  ctx.fillStyle = vg; ctx.fill();
  const vtg = ctx.createLinearGradient(0, 0, 18, 0);
  vtg.addColorStop(0, '#ffffff'); vtg.addColorStop(1, '#2fc72f');
  rrPath(ctx, vx + 46, ccy - 20, 18, 44, 7);
  ctx.fillStyle = vtg; ctx.fill();
  ctx.strokeStyle = '#1a8a1a'; ctx.lineWidth = 1.5; ctx.stroke();

  ctx.restore(); // lepas clip jendela

  /* ---- border jendela ---- */
  rrPath(ctx, WX, WY, WW, WH, 14);
  ctx.strokeStyle = '#0d3aa8';
  ctx.lineWidth = BD;
  ctx.stroke();
}

function drawStyle1(lines) {
  const cv = drawStyle1._cv;
  drawWmpScene(cv.getContext('2d'), lines, '1', cv.width, cv.height);
}

function drawStyle2(lines) {
  const cv = drawStyle2._cv;
  drawWmpScene(cv.getContext('2d'), lines, '2', cv.width, cv.height);
}

export function render(root) {

  const W = 1200, H = 630;
  let style = '1';

  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
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
