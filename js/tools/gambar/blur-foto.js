import { h as T, LOCAL_NOTE, canvasToBlob, fileInput, loadImage } from '../../core.js?v=6.11.5';

export const meta = {"id": "blur-foto", "name": "Blur Foto (Sensor)", "cat": "gambar", "icon": "🫣", "desc": "Sensor area foto, atau blur latar potret otomatis.", "keywords": "blur,sensor,foto,pixel,privasi,latar,potret"};
export function render(root) {

    const fileI = fileInput('image/*');
    const sizeR = T.input('range'); sizeR.min = '6'; sizeR.max = '60'; sizeR.value = '18';
    const sizeV = T.el('<b>18px</b>');
    const box = T.out();
    const statusBox = T.out();
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'max-width:100%;border-radius:12px;display:block;margin:0 auto;touch-action:none;cursor:crosshair';
    const off = document.createElement('canvas'); // gambar asli
    const tmp = document.createElement('canvas'); // pixelate per area
    const bgHasil = document.createElement('canvas'); // hasil blur latar
    let rects = [], fullBlur = false, drag = null, hasImg = false;
    let mode = 'sensor'; // 'sensor' | 'latar'
    let bgSiap = false;

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
      if (mode === 'latar') {
        if (bgSiap) ctx.drawImage(bgHasil, 0, 0, canvas.width, canvas.height);
        else ctx.drawImage(off, 0, 0, canvas.width, canvas.height);
        return;
      }
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
      if (!hasImg || fullBlur || mode !== 'sensor') return;
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
      rects = []; fullBlur = false; hasImg = true; bgSiap = false; maskCache = null;
      bAll.classList.remove('primary');
      render2();
      T.show(box, '');
      box.appendChild(canvas);
      T.toast(mode === 'sensor' ? 'Seret di foto untuk menandai area sensor' : 'Foto dimuat, tekan proses blur latar');
    }
    fileI.addEventListener('change', onFile);

    /* ---- Blur latar potret (segmentasi orang, MediaPipe, pin versi) ---- */
    const MP_CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation@0.1/selfie_segmentation.js';
    const MP_BASE = 'https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation@0.1/';
    let mpSiap = null, seg = null;
    async function loadSeg() {
      if (seg) return seg;
      if (!mpSiap) mpSiap = T.loadScript(MP_CDN).then((ok) => ok && !!window.SelfieSegmentation);
      const ok = await mpSiap;
      if (!ok) throw new Error('cdn');
      seg = new window.SelfieSegmentation({ locateFile: (f) => MP_BASE + f });
      seg.setOptions({ modelSelection: 1 });
      return seg;
    }
    function dukungFilter() {
      try { return 'filter' in document.createElement('canvas').getContext('2d'); }
      catch (e) { return false; }
    }
    const latarR = T.input('range'); latarR.min = '2'; latarR.max = '30'; latarR.value = '12';
    const latarV = T.el('<b>12px</b>');
    let maskCache = null; // masker orang yang sudah dilunakkan pinggirnya
    latarR.addEventListener('input', () => { latarV.textContent = latarR.value + 'px'; if (maskCache) gabungLatar(); });
    let sedangProses = false;
    function gabungLatar() {
      const W = off.width, H = off.height, blurPx = +latarR.value;
      // latar yang diblur
      const bg = document.createElement('canvas'); bg.width = W; bg.height = H;
      const bx = bg.getContext('2d');
      bx.filter = 'blur(' + blurPx + 'px)';
      bx.drawImage(off, 0, 0);
      bx.filter = 'none';
      // orang tajam, dipotong pakai masker
      const fg = document.createElement('canvas'); fg.width = W; fg.height = H;
      const fx = fg.getContext('2d');
      fx.drawImage(off, 0, 0);
      fx.globalCompositeOperation = 'destination-in';
      fx.drawImage(maskCache, 0, 0);
      fx.globalCompositeOperation = 'source-over';
      bgHasil.width = W; bgHasil.height = H;
      const gx = bgHasil.getContext('2d');
      gx.drawImage(bg, 0, 0);
      gx.drawImage(fg, 0, 0);
      bgSiap = true;
      render2();
    }
    async function prosesLatar() {
      if (!hasImg) { T.toast('Pilih foto dulu'); return; }
      if (sedangProses) return;
      if (!dukungFilter()) {
        T.show(statusBox, '<span class="err">Browser ini tidak mendukung blur latar. Coba browser lain, atau pakai mode sensor area.</span>');
        return;
      }
      sedangProses = true;
      T.show(statusBox, '<p class="center mut">Memisahkan orang dari latar... (pertama kali butuh internet untuk mengunduh model)</p>');
      try {
        const s = await loadSeg();
        const hasil = await new Promise((resolve, reject) => {
          const to = setTimeout(() => reject(new Error('timeout')), 90000);
          s.onResults((res) => { clearTimeout(to); resolve(res); });
          s.send({ image: off }).catch((e) => { clearTimeout(to); reject(e); });
        });
        if (!hasil || !hasil.segmentationMask) throw new Error('mask');
        // lunakkan pinggir masker sekali, simpan untuk geser slider
        const m = document.createElement('canvas'); m.width = off.width; m.height = off.height;
        const mx = m.getContext('2d');
        mx.filter = 'blur(2px)';
        mx.drawImage(hasil.segmentationMask, 0, 0, m.width, m.height);
        mx.filter = 'none';
        maskCache = m;
        gabungLatar();
        T.hide(statusBox);
        T.toast('Blur latar jadi!');
      } catch (e) {
        T.show(statusBox, '<span class="err">Blur latar gagal. Cek koneksi internetmu lalu coba lagi. Foto yang dipakai sebaiknya menampilkan orang dengan jelas.</span>');
      } finally {
        sedangProses = false;
      }
    }

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

    // Panel per mode
    const panelSensor = T.el('<div></div>');
    const sRow = T.el('<div class="row"></div>');
    sRow.appendChild(sizeR); sRow.appendChild(sizeV);
    panelSensor.appendChild(T.field('Kekuatan blur (ukuran pixel)', sRow));
    panelSensor.appendChild(T.row(bAll, bUndo, bClear));
    panelSensor.appendChild(T.el('<p class="hint">Seret/drag di atas foto untuk menandai area yang disensor. Makin besar nilai pixel, makin kasar blur-nya.</p>'));

    const panelLatar = T.el('<div></div>');
    const lRow = T.el('<div class="row"></div>');
    lRow.appendChild(latarR); lRow.appendChild(latarV);
    panelLatar.appendChild(T.field('Kekuatan blur latar', lRow));
    panelLatar.appendChild(T.row(T.btn('Proses blur latar', () => prosesLatar(), true)));
    panelLatar.appendChild(T.el('<p class="hint">Orang di foto tetap tajam, latarnya yang diblur. Model pemisah diunduh sekali dari internet, setelah itu fotonya diproses di perangkatmu.</p>'));
    panelLatar.hidden = true;

    const bModeSensor = T.btn('Sensor area', () => setMode('sensor'), true);
    const bModeLatar = T.btn('Blur latar potret', () => setMode('latar'));
    function setMode(m) {
      mode = m;
      bModeSensor.classList.toggle('primary', m === 'sensor');
      bModeLatar.classList.toggle('primary', m === 'latar');
      panelSensor.hidden = m !== 'sensor';
      panelLatar.hidden = m !== 'latar';
      canvas.style.cursor = m === 'sensor' ? 'crosshair' : 'default';
      render2();
    }

    root.appendChild(T.el('<p class="note">🔒 ' + LOCAL_NOTE + '</p>'));
    root.appendChild(T.field('Pilih foto', fileI));
    root.appendChild(T.row(bModeSensor, bModeLatar));
    root.appendChild(panelSensor);
    root.appendChild(panelLatar);
    root.appendChild(statusBox);
    root.appendChild(T.row(dlB));
    root.appendChild(box);
    T.onLeave(() => { hasImg = false; rects = []; });

}
