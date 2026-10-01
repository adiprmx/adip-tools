import { h as T, LOCAL_NOTE, canvasToBlob, fileInput, loadImage } from '../../core.js?v=6.7.0';

export const meta = {"id": "meme", "name": "Meme Generator", "cat": "gambar", "icon": "😂", "desc": "Bikin meme teks atas-bawah + unduh PNG.", "keywords": "meme,lucu,gambar,teks"};
export function render(root) {

    const fileI = fileInput('image/*');
    const tpl = T.select([['', '— Pakai foto sendiri —'], ['#000000', 'Hitam'], ['#ffffff', 'Putih'], ['#1e3a8a', 'Navy'], ['#7f1d1d', 'Maroon'], ['#065f46', 'Hijau tua']], '');
    const topT = T.input('text', 'Teks atas', 'TEKS ATAS');
    const botT = T.input('text', 'Teks bawah', 'TEKS BAWAH');
    const sizeR = T.input('range'); sizeR.min = '4'; sizeR.max = '16'; sizeR.value = '9';
    const sizeV = T.el('<b>9%</b>');
    const box = T.out();
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'max-width:100%;border-radius:12px;display:block;margin:0 auto';
    let img = null;

    sizeR.addEventListener('input', () => { sizeV.textContent = sizeR.value + '%'; draw(); });

    function drawText(ctx, text, y, maxW, px) {
      const words = String(text || '').toUpperCase().split(/\s+/).filter(Boolean);
      if (!words.length) return y;
      const lines = [];
      let line = '';
      for (const w of words) {
        const t = line ? line + ' ' + w : w;
        ctx.font = 'bold ' + px + 'px Impact, "Arial Black", sans-serif';
        if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; }
        else line = t;
      }
      lines.push(line);
      const lh = px * 1.15;
      let cy = y;
      for (const ln of lines) {
        ctx.font = 'bold ' + px + 'px Impact, "Arial Black", sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.lineWidth = Math.max(2, px / 12);
        ctx.strokeStyle = '#000';
        ctx.strokeText(ln, canvas.width / 2, cy);
        ctx.fillStyle = '#fff';
        ctx.fillText(ln, canvas.width / 2, cy);
        cy += lh;
      }
      return cy;
    }

    function draw() {
      const hasImg = !!img;
      const scale = hasImg ? Math.min(900 / img.naturalWidth, 1200 / img.naturalHeight, 1) : 1;
      const w = hasImg ? Math.round(img.naturalWidth * scale) : 900;
      const h = hasImg ? Math.round(img.naturalHeight * scale) : 900;
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (hasImg) ctx.drawImage(img, 0, 0, w, h);
      else { ctx.fillStyle = tpl.value || '#000000'; ctx.fillRect(0, 0, w, h); }
      const px = Math.round(w * (parseInt(sizeR.value, 10) / 100));
      const pad = px * 0.9;
      drawText(ctx, topT.value, pad + px * 0.55, w * 0.94, px);
      // teks bawah: hitung dari bawah
      const words = String(botT.value || '').toUpperCase().split(/\s+/).filter(Boolean);
      if (words.length) {
        ctx.font = 'bold ' + px + 'px Impact, "Arial Black", sans-serif';
        const lines = [];
        let line = '';
        for (const wd of words) {
          const t = line ? line + ' ' + wd : wd;
          if (ctx.measureText(t).width > w * 0.94 && line) { lines.push(line); line = wd; }
          else line = t;
        }
        lines.push(line);
        const lh = px * 1.15;
        let cy = h - pad - lh * (lines.length - 1) - px * 0.15;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        for (const ln of lines) {
          ctx.lineWidth = Math.max(2, px / 12);
          ctx.strokeStyle = '#000'; ctx.strokeText(ln, w / 2, cy);
          ctx.fillStyle = '#fff'; ctx.fillText(ln, w / 2, cy);
          cy += lh;
        }
      }
    }

    async function onFile() {
      if (!fileI.files[0]) return;
      try { img = await loadImage(fileI.files[0]); tpl.value = ''; }
      catch (e) { T.toast('File bukan gambar yang valid'); return; }
      draw();
    }
    fileI.addEventListener('change', onFile);
    tpl.addEventListener('change', () => { if (tpl.value) img = null; draw(); });
    [topT, botT].forEach((i) => i.addEventListener('input', draw));

    const dlB = T.btn('Unduh PNG', async () => {
      const blob = await canvasToBlob(canvas, 'image/png');
      if (!blob) { T.toast('Gagal membuat gambar'); return; }
      T.dl('meme.png', blob, 'image/png');
      T.toast('Meme berhasil diunduh');
    }, true);

    root.appendChild(T.el('<p class="note">🔒 ' + LOCAL_NOTE + '</p>'));
    root.appendChild(T.field('Upload foto (opsional)', fileI));
    root.appendChild(T.field('Atau pakai background warna', tpl));
    root.appendChild(T.grid2(
      T.field('Teks atas', topT),
      T.field('Teks bawah', botT)
    ));
    const sRow = T.el('<div class="row"></div>');
    sRow.appendChild(sizeR); sRow.appendChild(sizeV);
    root.appendChild(T.field('Ukuran font', sRow));
    root.appendChild(T.row(dlB));
    root.appendChild(box);
    box.appendChild(canvas);
    T.onLeave(() => { img = null; });
    draw();

}
