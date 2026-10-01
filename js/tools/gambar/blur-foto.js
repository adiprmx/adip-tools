import { h as T, LOCAL_NOTE, canvasToBlob, fileInput, loadImage } from '../../core.js?v=5.0.1';

export const meta = {"id": "blur-foto", "name": "Blur Foto (Sensor)", "cat": "gambar", "icon": "🫣", "desc": "Sensor area foto dengan blur pixel."};

export function render(root) {

    const fileI = fileInput('image/*');
    const sizeR = T.input('range'); sizeR.min = '6'; sizeR.max = '60'; sizeR.value = '18';
    const sizeV = T.el('<b>18px</b>');
    const box = T.out();
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'max-width:100%;border-radius:12px;display:block;margin:0 auto;touch-action:none;cursor:crosshair';
    const off = document.createElement('canvas'); // gambar asli
    const tmp = document.createElement('canvas'); // pixelate per area
    let rects = [], fullBlur = false, drag = null, hasImg = false;

    sizeR.addEventListener('input', () => { sizeV.textContent = sizeR.value + 'px'; render2(); });

    function pix(ctx, x, y, w, h, block) {
      const bw = Math.max(1, Math.round(w / block)), bh = Math.max(1, Math.round(h / block));
      tmp.width = bw; tmp.height = bh;
      const tctx = tmp.getContext('2d');
      tctx.drawImage(canvas, x, y, w, h, 0, 0, bw, bh);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(tmp, 0, 0, bw, bh, x, y, w, h);
      ctx.imageSmoothingEnabled = true;
    }

    function render2() {
      if (!hasImg) return;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(off, 0, 0, canvas.width, canvas.height);
      const block = parseInt(sizeR.value, 10);
      if (fullBlur) { pix(ctx, 0, 0, canvas.width, canvas.height, block * 2); return; }
      for (const r of rects) {
        const x = Math.max(0, Math.min(r.x, r.x + r.w)), y = Math.max(0, Math.min(r.y, r.y + r.h));
        const w = Math.abs(r.w), h = Math.abs(r.h);
        if (w < 4 || h < 4) continue;
        pix(ctx, x, y, w, h, block);
      }
      if (drag) {
        const x = Math.min(drag.x0, drag.x1), y = Math.min(drag.y0, drag.y1);
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.setLineDash([8, 6]);
        ctx.strokeRect(x, y, Math.abs(drag.x1 - drag.x0), Math.abs(drag.y1 - drag.y0));
        ctx.setLineDash([]);
      }
    }

    function toCanvas(e) {
      const r = canvas.getBoundingClientRect();
      const cx = (e.touches && e.touches[0] ? e.touches[0] : e);
      return {
        x: (cx.clientX - r.left) * (canvas.width / r.width),
        y: (cx.clientY - r.top) * (canvas.height / r.height),
      };
    }
    canvas.addEventListener('pointerdown', (e) => {
      if (!hasImg || fullBlur) return;
      e.preventDefault();
      const p = toCanvas(e);
      drag = { x0: p.x, y0: p.y, x1: p.x, y1: p.y };
      canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const p = toCanvas(e);
      drag.x1 = p.x; drag.y1 = p.y;
      render2();
    });
    canvas.addEventListener('pointerup', () => {
      if (!drag) return;
      const w = drag.x1 - drag.x0, h = drag.y1 - drag.y0;
      if (Math.abs(w) > 8 && Math.abs(h) > 8) rects.push({ x: drag.x0, y: drag.y0, w, h });
      drag = null;
      render2();
    });

    async function onFile() {
      if (!fileI.files[0]) return;
      let img;
      try { img = await loadImage(fileI.files[0]); }
      catch (e) { T.toast('File bukan gambar yang valid'); return; }
      const s = Math.min(1, 1100 / Math.max(img.naturalWidth, img.naturalHeight));
      off.width = Math.round(img.naturalWidth * s);
      off.height = Math.round(img.naturalHeight * s);
      off.getContext('2d').drawImage(img, 0, 0, off.width, off.height);
      canvas.width = off.width; canvas.height = off.height;
      rects = []; fullBlur = false; hasImg = true;
      render2();
      T.show(box, '');
      box.appendChild(canvas);
      T.toast('Seret di foto untuk menandai area sensor');
    }
    fileI.addEventListener('change', onFile);

    const bAll = T.btn('Blur seluruh foto', () => { fullBlur = !fullBlur; bAll.classList.toggle('primary', fullBlur); render2(); });
    const bUndo = T.btn('Undo', () => { rects.pop(); render2(); });
    const bClear = T.btn('Hapus semua', () => { rects = []; render2(); });
    const dlB = T.btn('Unduh hasil', async () => {
      if (!hasImg) { T.toast('Pilih foto dulu'); return; }
      const blob = await canvasToBlob(canvas, 'image/png');
      if (!blob) { T.toast('Gagal membuat gambar'); return; }
      T.dl('foto-blur.png', blob, 'image/png');
      T.toast('Berhasil diunduh');
    }, true);

    root.appendChild(T.el('<p class="note">🔒 ' + LOCAL_NOTE + '</p>'));
    root.appendChild(T.field('Pilih foto', fileI));
    const sRow = T.el('<div class="row"></div>');
    sRow.appendChild(sizeR); sRow.appendChild(sizeV);
    root.appendChild(T.field('Kekuatan blur (ukuran pixel)', sRow));
    root.appendChild(T.row(bAll, bUndo, bClear));
    root.appendChild(T.row(dlB));
    root.appendChild(box);
    root.appendChild(T.el('<p class="hint">Seret/drag di atas foto untuk menandai area yang disensor. Makin besar nilai pixel, makin kasar blur-nya.</p>'));
    T.onLeave(() => { hasImg = false; rects = []; });

}
