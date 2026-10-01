import { h as T, utils, LOCAL_NOTE, canvasToBlob, fileInput, fmtBytes, imgEl, loadImage } from '../../core.js?v=5.0.0';

export const meta = {"id": "image-compress", "name": "Kompres Gambar", "cat": "gambar", "icon": "🗜️", "desc": "Kecilkan ukuran foto langsung di HP."};

export function render(root) {

      const fileI = fileInput('image/*');
      const qRange = T.input('range'); qRange.min = '10'; qRange.max = '100'; qRange.value = '80';
      const qVal = T.el('<b>80%</b>');
      const maxDim = T.input('number', 'cth: 1600', '1600'); maxDim.inputMode = 'numeric';
      const fmtSel = T.select([['jpeg', 'JPEG'], ['webp', 'WebP'], ['png', 'PNG']], 'jpeg');
      const box = T.out();
      const infoBox = T.out();
      let cur = null; // {blob, name, w, h}

      qRange.addEventListener('input', () => { qVal.textContent = qRange.value + '%'; });

      async function process() {
        T.hide(infoBox); T.hide(box);
        if (!fileI.files[0]) { T.toast('Pilih gambar dulu'); return; }
        let img;
        try { img = await loadImage(fileI.files[0]); }
        catch (e) { T.toast('File bukan gambar yang valid'); return; }
        let w = img.naturalWidth, h = img.naturalHeight;
        const max = parseInt(maxDim.value, 10);
        if (max > 0 && Math.max(w, h) > max) {
          const s = max / Math.max(w, h);
          w = Math.round(w * s); h = Math.round(h * s);
        }
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        const ctx = c.getContext('2d');
        if (fmtSel.value !== 'png') { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h); }
        ctx.drawImage(img, 0, 0, w, h);
        const mime = fmtSel.value === 'png' ? 'image/png' : fmtSel.value === 'webp' ? 'image/webp' : 'image/jpeg';
        const q = fmtSel.value === 'png' ? undefined : (parseInt(qRange.value, 10) / 100);
        const blob = await canvasToBlob(c, mime, q);
        if (!blob) { T.toast('Gagal memproses gambar'); return; }
        const orig = fileI.files[0];
        const base = (orig.name || 'gambar').replace(/\.[^.]*$/, '');
        const ext = fmtSel.value === 'jpeg' ? 'jpg' : fmtSel.value;
        cur = { blob, name: base + '-kompres.' + ext, w, h };
        const pct = Math.round((1 - blob.size / orig.size) * 100);
        T.show(infoBox,
          `<div class="kv"><span>Asli</span><b>${fmtBytes(orig.size)} (${img.naturalWidth}×${img.naturalHeight})</b></div>` +
          `<div class="kv"><span>Hasil</span><b>${fmtBytes(blob.size)} (${w}×${h})</b></div>` +
          `<div class="kv"><span>Hemat</span><b>${pct >= 0 ? pct + '%' : 'malah ' + Math.abs(pct) + '% lebih besar'}</b></div>`);
        T.show(box, '');
        const imgObjUrl = URL.createObjectURL(blob);
        box.appendChild(imgEl(imgObjUrl, 'Hasil kompres'));
        T.onLeave(() => URL.revokeObjectURL(imgObjUrl));
      }

      const dlB = T.btn('Unduh Hasil', () => {
        if (!cur) { T.toast('Proses dulu gambarnya'); return; }
        T.dl(cur.name, cur.blob, cur.blob.type);
        T.toast('Berhasil diunduh');
      }, true);

      root.appendChild(T.el(`<p class="note">🔒 ${LOCAL_NOTE}</p>`));
      root.appendChild(T.field('Pilih gambar', fileI));
      const qRow = T.el('<div class="row"></div>');
      qRow.appendChild(qRange); qRow.appendChild(qVal);
      root.appendChild(T.grid2(
        T.field('Kualitas', qRow),
        T.field('Format output', fmtSel)
      ));
      root.appendChild(T.field('Maksimal dimensi (px, sisi terpanjang)', maxDim, 'Dikosongkan = ukuran asli.'));
      root.appendChild(T.row(T.btn('Kompres', process, true), dlB));
      root.appendChild(infoBox);
      root.appendChild(box);
    
}
