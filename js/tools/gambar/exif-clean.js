import { h as T, utils, LOCAL_NOTE, canvasToBlob, fileInput, fmtBytes, imgEl, loadImage } from '../../core.js?v=6.2.0';

export const meta = {"id": "exif-clean", "name": "Hapus EXIF", "cat": "gambar", "icon": "🧹", "desc": "Bersihkan metadata sebelum dishare.", "keywords": "exif,metadata,bersih,privasi"};
export function render(root) {

      const fileI = fileInput('image/*');
      const box = T.out();
      let cur = null;

      async function process() {
        T.hide(box);
        if (!fileI.files[0]) { T.toast('Pilih gambar dulu'); return; }
        let img;
        try { img = await loadImage(fileI.files[0]); }
        catch (e) { T.toast('File bukan gambar yang valid'); return; }
        const c = document.createElement('canvas');
        c.width = img.naturalWidth; c.height = img.naturalHeight;
        const ctx = c.getContext('2d');
        ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
        ctx.drawImage(img, 0, 0);
        const blob = await canvasToBlob(c, 'image/jpeg', 0.92);
        if (!blob) { T.toast('Gagal memproses'); return; }
        const base = (fileI.files[0].name || 'gambar').replace(/\.[^.]*$/, '');
        cur = { blob, name: base + '-bersih.jpg', orig: fileI.files[0].size };
        T.show(box,
          `<div class="kv"><span>Ukuran asli</span><b>${fmtBytes(cur.orig)}</b></div>` +
          `<div class="kv"><span>Ukuran bersih</span><b>${fmtBytes(blob.size)}</b></div>`);
        box.appendChild(imgEl(URL.createObjectURL(blob), 'Hasil bersih EXIF'));
        T.onLeave(() => URL.revokeObjectURL(box.querySelector('img').src));
      }

      root.appendChild(T.el(`<p class="note">🔒 ${LOCAL_NOTE}</p>`));
      root.appendChild(T.el('<p class="note">ℹ️ Gambar digambar ulang lewat canvas, jadi metadata EXIF standar (lokasi GPS, info kamera, tanggal jepret) ikut terbuang. Jujur aja: ini tidak menghapus watermark atau tulisan yang sudah nempel di piksel gambar.</p>'));
      root.appendChild(T.field('Pilih gambar', fileI));
      root.appendChild(T.row(
        T.btn('Bersihkan EXIF', process, true),
        T.btn('Unduh Hasil', () => {
          if (!cur) { T.toast('Bersihkan dulu gambarnya'); return; }
          T.dl(cur.name, cur.blob, 'image/jpeg');
          T.toast('Berhasil diunduh');
        }, true)
      ));
      root.appendChild(box);
    
}
