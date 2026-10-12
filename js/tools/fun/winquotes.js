import { h as T, errBox } from '../../core.js?v=6.9.20';

export const meta = {"id": "winquotes", "name": "Windows Quotes", "cat": "fun", "icon": "🪟", "desc": "Bikin gambar quote ala notifikasi Windows.", "keywords": "windows,quote,kutipan,meme,gambar"};

export function render(root) {

  const W = 1200, H = 630;
  let style = '1';

  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d');

  const inp = T.input('text', 'Tulis quote, pisahkan baris dengan |', 'ngapain cemburu|kan|cuman sebatas|teman');
  const box = T.out();
  const preview = T.el('<div style="margin-top:12px;display:flex;justify-content:center"></div>');
  const imgPrev = document.createElement('img');
  imgPrev.style.cssText = 'max-width:100%;height:auto;border-radius:12px;border:1px solid #ffffff20;display:none';
  preview.appendChild(imgPrev);

  function winLogo(x, y, s, color) {
    ctx.fillStyle = color;
    const g = s * 0.06;
    const q = (s - g) / 2;
    ctx.fillRect(x, y, q, q);
    ctx.fillRect(x + q + g, y, q, q);
    ctx.fillRect(x, y + q + g, q, q);
    ctx.fillRect(x + q + g, y + q + g, q, q);
  }

  function fitFont(lines, maxW, maxH, base, min, weight, family) {
    let size = base;
    while (size > min) {
      const font = weight + ' ' + size + 'px ' + family;
      ctx.font = font;
      const lh = size * 1.28;
      const widest = Math.max(...lines.map((l) => ctx.measureText(l || ' ').width), 0);
      if (widest <= maxW && lh * lines.length <= maxH) return { font, size, lh };
      size -= 2;
    }
    const font = weight + ' ' + min + 'px ' + family;
    return { font, size: min, lh: min * 1.28 };
  }

  function drawStyle1(lines) {
    // Dialog klasik ala Windows: title bar biru + bodi terang + tombol OK
    ctx.fillStyle = '#1e1e1e'; ctx.fillRect(0, 0, W, H);
    const dw = 980, dh = 470, dx = (W - dw) / 2, dy = (H - dh) / 2;
    const tbH = 64;
    ctx.fillStyle = 'rgba(0,0,0,.45)';
    ctx.fillRect(dx + 10, dy + 14, dw, dh);
    // bodi
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(dx, dy, dw, dh);
    // title bar
    const g = ctx.createLinearGradient(0, dy, 0, dy + tbH);
    g.addColorStop(0, '#2b88d8'); g.addColorStop(1, '#1976c4');
    ctx.fillStyle = g; ctx.fillRect(dx, dy, dw, tbH);
    winLogo(dx + 22, dy + 14, 36, '#ffffff');
    ctx.fillStyle = '#ffffff';
    ctx.font = '600 26px "Segoe UI", system-ui, sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillText('Windows', dx + 72, dy + tbH / 2 + 1);
    // tombol close
    ctx.fillStyle = 'rgba(255,255,255,.25)';
    ctx.fillRect(dx + dw - 64, dy + 14, 44, 36);
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(dx + dw - 52, dy + 24); ctx.lineTo(dx + dw - 32, dy + 40);
    ctx.moveTo(dx + dw - 32, dy + 24); ctx.lineTo(dx + dw - 52, dy + 40);
    ctx.stroke();
    // teks quote
    const maxW = dw - 160, maxH = dh - tbH - 170;
    const { font, lh } = fitFont(lines, maxW, maxH, 54, 24, '600', '"Segoe UI", system-ui, sans-serif');
    ctx.font = font; ctx.fillStyle = '#1a1a1a'; ctx.textAlign = 'center';
    const startY = dy + tbH + (dh - tbH - 110) / 2 - ((lines.length - 1) * lh) / 2;
    lines.forEach((l, i) => ctx.fillText(l || ' ', W / 2, startY + i * lh));
    ctx.textAlign = 'left';
    // tombol OK
    const bw = 170, bh = 56, bx = dx + dw - bw - 40, by = dy + dh - bh - 30;
    ctx.fillStyle = '#e1e1e1';
    ctx.strokeStyle = '#8a8a8a'; ctx.lineWidth = 2;
    ctx.fillRect(bx, by, bw, bh); ctx.strokeRect(bx, by, bw, bh);
    ctx.fillStyle = '#1a1a1a'; ctx.font = '500 26px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'center'; ctx.fillText('OK', bx + bw / 2, by + bh / 2 + 1);
    ctx.textAlign = 'left';
  }

  function drawStyle2(lines) {
    // Toast notifikasi modern: kartu putih di atas aksen biru Windows
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, '#0b3d66'); g.addColorStop(1, '#062a47');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    winLogo(60, 52, 120, 'rgba(255,255,255,.14)');
    const cw = 960, ch = 430, cx = (W - cw) / 2, cy = (H - ch) / 2;
    ctx.fillStyle = 'rgba(0,0,0,.35)';
    ctx.fillRect(cx + 8, cy + 12, cw, ch);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(cx, cy, cw, ch);
    // header kartu
    winLogo(cx + 36, cy + 30, 44, '#0078d4');
    ctx.fillStyle = '#323232'; ctx.font = '600 25px "Segoe UI", system-ui, sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillText('Windows', cx + 96, cy + 52);
    ctx.fillStyle = '#8a8a8a'; ctx.font = '400 22px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'right'; ctx.fillText('sekarang', cx + cw - 36, cy + 52); ctx.textAlign = 'left';
    ctx.strokeStyle = '#e6e6e6'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx + 36, cy + 100); ctx.lineTo(cx + cw - 36, cy + 100); ctx.stroke();
    // isi quote
    const maxW = cw - 140, maxH = ch - 190;
    const { font, lh } = fitFont(lines, maxW, maxH, 52, 22, '400', '"Segoe UI", system-ui, sans-serif');
    ctx.font = font; ctx.fillStyle = '#1b1b1b';
    const startY = cy + 130 + (ch - 160) / 2 - ((lines.length - 1) * lh) / 2;
    lines.forEach((l, i) => ctx.fillText(l || ' ', cx + 70, startY + i * lh));
    // footer
    ctx.fillStyle = '#0078d4'; ctx.font = '600 22px "Segoe UI", system-ui, sans-serif';
    ctx.fillText('adip.tools', cx + 70, cy + ch - 44);
  }

  const styleBtns = T.el('<div style="display:flex;gap:8px;margin-bottom:12px"></div>');
  const b1 = T.btn('Style 1 — Klasik', null, true);
  const b2 = T.btn('Style 2 — Modern', null);
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
    const clean = text.split('|').map((s) => s.trim());
    // pecah baris yang kepanjangan per kata agar muat
    const finalLines = [];
    for (const raw of clean) {
      const words = raw.split(/\s+/).filter(Boolean);
      if (!words.length) { finalLines.push(''); continue; }
      let line = '';
      for (const w of words) {
        const t = line ? line + ' ' + w : w;
        if (t.length > 34 && line) { finalLines.push(line); line = w; }
        else line = t;
      }
      finalLines.push(line);
    }
    if (style === '1') drawStyle1(finalLines);
    else drawStyle2(finalLines);
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

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Bikin gambar quote gaya Windows. Pisahkan tiap baris dengan tanda <b>|</b> — digambar langsung di perangkatmu, tanpa server.</p>'));
  root.appendChild(T.el('<div style="margin-bottom:4px"><b>Pilih Style</b></div>'));
  root.appendChild(styleBtns);
  root.appendChild(T.field('Teks (pisahkan baris dengan |)', inp));
  root.appendChild(T.row(T.btn('Generate', generate, true)));
  root.appendChild(preview);
  root.appendChild(T.row(bDl, bCopy));
  root.appendChild(box);
}
