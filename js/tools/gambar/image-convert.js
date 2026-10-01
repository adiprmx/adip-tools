import { h as T, utils, LOCAL_NOTE, canvasToBlob, fileInput, fmtBytes, imgEl, loadImage } from '../../core.js?v=5.2.0';

export const meta = {"id": "image-convert", "name": "Convert Gambar", "cat": "gambar", "icon": "🔁", "desc": "Convert WebP/JPG/PNG di browser.", "keywords": "convert,gambar,webp,jpg,png,format"};
export function render(root) {

      const fileI = fileInput('image/*');
      const fmtSel = T.select([['jpeg', 'JPEG (.jpg)'], ['png', 'PNG'], ['webp', 'WebP']], 'jpeg');
      const qRange = T.input('range'); qRange.min = '10'; qRange.max = '100'; qRange.value = '90';
      const qVal = T.el('<b>90%</b>');
      const box = T.out();
      let cur = null;

      qRange.addEventListener('input', () => { qVal.textContent = qRange.value + '%'; });

      async function process() {
        T.hide(box);
        if (!fileI.files[0]) { T.toast('Pilih gambar dulu'); return; }
        let img;
        try { img = await loadImage(fileI.files[0]); }
        catch (e) { T.toast('File bukan gambar yang valid'); return; }
        const c = document.createElement('canvas');
        c.width = img.naturalWidth; c.height = img.naturalHeight;
        const ctx = c.getContext('2d');
        if (fmtSel.value !== 'png') { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height); }
        ctx.drawImage(img, 0, 0);
        const mime = fmtSel.value === 'png' ? 'image/png' : fmtSel.value === 'webp' ? 'image/webp' : 'image/jpeg';
        const q = fmtSel.value === 'png' ? undefined : parseInt(qRange.value, 10) / 100;
        const blob = await canvasToBlob(c, mime, q);
        if (!blob) { T.toast('Gagal convert'); return; }
        const base = (fileI.files[0].name || 'gambar').replace(/\.[^.]*$/, '');
        const ext = fmtSel.value === 'jpeg' ? 'jpg' : fmtSel.value;
        cur = { blob, name: base + '.' + ext };
        T.show(box, '');
        const row2 = T.el('<div class="row"></div>');
        row2.appendChild(T.el(`<div><div class="hint">Ukuran hasil: <b>${fmtBytes(blob.size)}</b></div></div>`));
        box.appendChild(row2);
        box.appendChild(imgEl(URL.createObjectURL(blob), 'Hasil convert'));
        T.onLeave(() => URL.revokeObjectURL(box.querySelector('img').src));
      }

      root.appendChild(T.el(`<p class="note">🔒 ${LOCAL_NOTE}</p>`));
      root.appendChild(T.field('Pilih gambar', fileI));
      root.appendChild(T.grid2(
        T.field('Format tujuan', fmtSel),
        T.field('Kualitas', (() => { const d = T.el('<div class="row"></div>'); d.appendChild(qRange); d.appendChild(qVal); return d; })(), 'Tidak berlaku untuk PNG.')
      ));
      root.appendChild(T.row(
        T.btn('Convert', process, true),
        T.btn('Unduh Hasil', () => {
          if (!cur) { T.toast('Convert dulu gambarnya'); return; }
          T.dl(cur.name, cur.blob, cur.blob.type);
          T.toast('Berhasil diunduh');
        }, true)
      ));
      root.appendChild(box);
    
}
