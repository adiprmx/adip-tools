import { h as T, utils, LOCAL_NOTE, canvasToBlob, fileInput, fmtBytes, imgEl, loadImage } from '../../core.js';

export const meta = {"id": "ubah-ukuran-foto", "name": "Ubah Ukuran Foto", "cat": "gambar", "icon": "🖼️", "desc": "Ubah ukuran foto: pas foto, KTP, feed IG, atau ukuran bebas.", "keywords": "resize,ubah,ukuran,foto,dimensi,piksel,pas foto,ktp,instagram"};
export function render(root) {

      const fileI = fileInput('image/*');
      const presetSel = T.select([
        ['bebas', 'Ukuran bebas (isi sendiri)'],
        ['pasfoto', 'Pas foto 4×6 cm (472 × 709 px)'],
        ['ktp', 'KTP / kartu (1011 × 638 px)'],
        ['igfeed', 'Feed Instagram (1080 × 1350 px)'],
        ['thumb', 'Thumbnail video (1280 × 720 px)'],
      ], 'bebas');
      const wInp = T.input('number', 'Lebar (px)', '1080'); wInp.inputMode = 'numeric';
      const hInp = T.input('number', 'Tinggi (px)', '1080'); hInp.inputMode = 'numeric';
      const lockBox = T.el('<label style="display:flex;align-items:center;gap:10px;font-size:14px;padding:8px 0;cursor:pointer"><input type="checkbox" checked> <span>Kunci rasio foto asli (lebar & tinggi ikut berubah)</span></label>');
      const lockChk = lockBox.querySelector('input');
      const fmtSel = T.select([['jpeg', 'JPEG'], ['png', 'PNG'], ['webp', 'WebP']], 'jpeg');
      const qRange = T.input('range'); qRange.min = '10'; qRange.max = '100'; qRange.value = '90';
      const qVal = T.el('<b>90%</b>');
      const box = T.out();
      const infoBox = T.out();
      let cur = null; // {blob, name, w, h}
      let ratio = 1; // lebar / tinggi foto asli
      let loaded = false;

      qRange.addEventListener('input', () => { qVal.textContent = qRange.value + '%'; });

      const PRESETS = {
        pasfoto: [472, 709],
        ktp: [1011, 638],
        igfeed: [1080, 1350],
        thumb: [1280, 720],
      };

      presetSel.addEventListener('change', () => {
        const p = PRESETS[presetSel.value];
        if (p) { wInp.value = p[0]; hInp.value = p[1]; }
      });

      wInp.addEventListener('input', () => {
        if (lockChk.checked && loaded && ratio > 0) {
          const w = parseInt(wInp.value, 10);
          if (w > 0) hInp.value = Math.max(1, Math.round(w / ratio));
        }
      });
      hInp.addEventListener('input', () => {
        if (lockChk.checked && loaded && ratio > 0) {
          const h = parseInt(hInp.value, 10);
          if (h > 0) wInp.value = Math.max(1, Math.round(h * ratio));
        }
      });

      // Downscale bertahap (setengah demi setengah) supaya hasilnya tetap tajam
      function drawSharp(img, tw, th) {
        let sw = img.naturalWidth, sh = img.naturalHeight;
        let src = img;
        while (sw / 2 >= tw && sh / 2 >= th) {
          sw = Math.max(1, Math.round(sw / 2));
          sh = Math.max(1, Math.round(sh / 2));
          const step = document.createElement('canvas');
          step.width = sw; step.height = sh;
          step.getContext('2d').drawImage(src, 0, 0, sw, sh);
          src = step;
        }
        const c = document.createElement('canvas');
        c.width = tw; c.height = th;
        c.getContext('2d').drawImage(src, 0, 0, tw, th);
        return c;
      }

      async function process() {
        T.hide(infoBox); T.hide(box);
        if (!fileI.files[0]) { T.toast('Pilih foto dulu'); return; }
        const tw = parseInt(wInp.value, 10), th = parseInt(hInp.value, 10);
        if (!(tw > 0) || !(th > 0) || tw > 8000 || th > 8000) { T.toast('Lebar & tinggi harus 1–8000 piksel'); return; }
        let img;
        try { img = await loadImage(fileI.files[0]); }
        catch (e) { T.toast('File itu bukan gambar. Pilih file gambar.'); return; }
        ratio = img.naturalWidth / img.naturalHeight;
        loaded = true;
        const c = drawSharp(img, tw, th);
        const mime = fmtSel.value === 'png' ? 'image/png' : fmtSel.value === 'webp' ? 'image/webp' : 'image/jpeg';
        const q = fmtSel.value === 'png' ? undefined : (parseInt(qRange.value, 10) / 100);
        // JPEG tidak punya transparansi: timpa di atas latar putih supaya
        // bagian tembus pandang tidak jadi hitam (pola banding-foto).
        // PNG dan WebP bisa menyimpan transparansi, jadi tidak diratakan.
        let sumber = c;
        if (mime === 'image/jpeg') {
          const putih = document.createElement('canvas');
          putih.width = c.width; putih.height = c.height;
          const px = putih.getContext('2d');
          px.fillStyle = '#ffffff'; px.fillRect(0, 0, c.width, c.height);
          px.drawImage(c, 0, 0);
          sumber = putih;
        }
        const blob = await canvasToBlob(sumber, mime, q);
        if (!blob) { T.toast('Fotonya tidak bisa diproses. Coba foto lain.'); return; }
        const orig = fileI.files[0];
        const base = (orig.name || 'foto').replace(/\.[^.]*$/, '');
        const ext = fmtSel.value === 'jpeg' ? 'jpg' : fmtSel.value;
        cur = { blob, name: base + '-' + tw + 'x' + th + '.' + ext, w: tw, h: th };
        T.show(infoBox,
          '<div class="kv"><span>Asli</span><b>' + fmtBytes(orig.size) + ' (' + img.naturalWidth + '×' + img.naturalHeight + ')</b></div>' +
          '<div class="kv"><span>Hasil</span><b>' + fmtBytes(blob.size) + ' (' + tw + '×' + th + ')</b></div>');
        T.show(box, '');
        const url = URL.createObjectURL(blob);
        box.appendChild(imgEl(url, 'Hasil ubah ukuran'));
        T.onLeave(() => URL.revokeObjectURL(url));
      }

      const dlB = T.btn('Unduh Hasil', () => {
        if (!cur) { T.toast('Ubah ukuran dulu fotonya'); return; }
        T.dl(cur.name, cur.blob, cur.blob.type);
        T.toast('Berhasil diunduh');
      }, true);

      root.appendChild(T.el('<p class="note">🔒 ' + LOCAL_NOTE + '</p>'));
      root.appendChild(T.field('Pilih foto', fileI));
      root.appendChild(T.field('Pilih ukuran', presetSel));
      root.appendChild(T.grid2(
        T.field('Lebar (px)', wInp),
        T.field('Tinggi (px)', hInp)
      ));
      root.appendChild(lockBox);
      const qRow = T.el('<div class="row"></div>');
      qRow.appendChild(qRange); qRow.appendChild(qVal);
      root.appendChild(T.grid2(
        T.field('Format hasil', fmtSel),
        T.field('Kualitas (JPEG/WebP)', qRow)
      ));
      root.appendChild(T.row(T.btn('Ubah Ukuran', process, true), dlB));
      root.appendChild(infoBox);
      root.appendChild(box);
    
}
