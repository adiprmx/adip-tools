import { h as T, utils, LOCAL_NOTE, canvasToBlob, fileInput, fmtBytes, imgEl, loadImage } from '../../core.js?v=6.12.2';

export const meta = {"id": "exif-clean", "name": "Hapus EXIF", "cat": "gambar", "icon": "🧹", "desc": "Lihat dulu datanya, baru bersihkan metadata sebelum dishare.", "keywords": "exif,metadata,bersih,privasi,gps"};
export function render(root) {

      /* Penampil EXIF sebelum menghapus: baca metadata pakai ExifReader
         (CDN, pin versi) begitu foto dipilih, tampilkan isinya, baru hapus. */
      const EXIF_CDN = 'https://cdn.jsdelivr.net/npm/exifreader@4.23.5/dist/exif-reader.js';
      let exifSiap = null;
      const loadExif = () => {
        if (!exifSiap) exifSiap = T.loadScript(EXIF_CDN).then((ok) => ok && !!window.ExifReader);
        return exifSiap;
      };
      const tagStr = (tags, name) => {
        const t = tags && tags[name];
        if (t == null) return '';
        if (typeof t === 'object' && t.description != null) return String(t.description);
        if (typeof t === 'object' && t.value != null) return String(t.value);
        return String(t);
      };
      const gpsDec = (tags, latName, refName) => {
        const t = tags && tags[latName];
        if (!t || t.value == null) return null;
        const v = t.value;
        let dec = null;
        if (Array.isArray(v) && v.length >= 3) {
          const n = (x) => (typeof x === 'object' && x !== null && 'numerator' in x)
            ? (x.denominator ? x.numerator / x.denominator : 0) : Number(x);
          dec = n(v[0]) + n(v[1]) / 60 + n(v[2]) / 3600;
        } else if (typeof v === 'number') dec = v;
        if ((dec == null || Number.isNaN(dec)) && t.description != null) {
          const d = parseFloat(String(t.description));
          if (!Number.isNaN(d)) dec = Math.abs(d);
        }
        if (dec == null) return null;
        const ref = tagStr(tags, refName).toUpperCase();
        if (ref === 'S' || ref === 'W') dec = -Math.abs(dec);
        return dec;
      };

      const fileI = fileInput('image/*');
      const box = T.out();
      const lihatBox = T.out();
      let cur = null;

      async function lihatData() {
        T.hide(lihatBox); T.hide(box);
        cur = null;
        const f = fileI.files[0];
        if (!f) return;
        T.show(lihatBox, '<p class="center mut">Membaca data foto...</p>');
        const ok = await loadExif();
        if (!ok) {
          T.show(lihatBox, '<p class="hint">Data foto tidak bisa dibaca (pembaca gagal dimuat, cek koneksi). Foto tetap bisa dibersihkan seperti biasa.</p>');
          return;
        }
        let tags = {};
        try { tags = window.ExifReader.load(await f.arrayBuffer()) || {}; }
        catch (e) { tags = {}; }
        const rows = [];
        const merk = tagStr(tags, 'Make'), model = tagStr(tags, 'Model');
        if (merk || model) rows.push(['Kamera', (merk + ' ' + model).trim()]);
        const tgl = tagStr(tags, 'DateTimeOriginal') || tagStr(tags, 'CreateDate') || tagStr(tags, 'DateTime');
        if (tgl) rows.push(['Tanggal jepret', tgl]);
        const iso = tagStr(tags, 'ISOSpeedRatings');
        if (iso) rows.push(['ISO', iso]);
        const soft = tagStr(tags, 'Software');
        if (soft) rows.push(['Aplikasi', soft]);
        const lat = gpsDec(tags, 'GPSLatitude', 'GPSLatitudeRef');
        const lon = gpsDec(tags, 'GPSLongitude', 'GPSLongitudeRef');
        const punyaGps = lat != null && lon != null;
        if (punyaGps) rows.push(['Lokasi (GPS)', lat.toFixed(6) + ', ' + lon.toFixed(6)]);
        const kunci = Object.keys(tags).filter((k) => !['FileType', 'MimeType'].includes(k));
        if (!rows.length && !kunci.length) {
          T.show(lihatBox, '<p class="hint">Foto ini tidak menyimpan data tambahan. Tidak ada yang perlu dihapus, tapi tetap bisa dibersihkan bila mau.</p>');
          return;
        }
        T.show(lihatBox,
          '<h3 style="font-size:13px;margin:4px 0 6px;color:#e4e4e7">Data yang tersimpan di foto ini (akan dihapus)</h3>' +
          rows.map(([k, v]) => '<div class="kv"><span class="k">' + T.esc(k) + '</span><span class="v">' + T.esc(v) + '</span></div>').join('') +
          (kunci.length > rows.length ? '<p class="hint">Plus ' + (kunci.length - rows.length) + ' data lain yang tidak ditampilkan di sini.</p>' : '') +
          (punyaGps
            ? '<div style="background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.4);border-radius:10px;padding:10px 12px;font-size:13px;line-height:1.6;margin-top:8px"><b style="color:#fca5a5">Foto ini menyimpan lokasi pengambilan.</b> Siapa pun yang menerima foto ini bisa tahu di mana foto ini diambil.</div>'
            : '') +
          '<p class="hint" style="margin-top:8px">Mau lihat semua datanya lebih lengkap? <a href="#/t/lihat-data-foto">Buka Lihat Data Foto</a>.</p>');
      }

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
      root.appendChild(lihatBox);
      root.appendChild(T.row(
        T.btn('Bersihkan EXIF', process, true),
        T.btn('Unduh Hasil', () => {
          if (!cur) { T.toast('Bersihkan dulu gambarnya'); return; }
          T.dl(cur.name, cur.blob, 'image/jpeg');
          T.toast('Berhasil diunduh');
        }, true)
      ));
      root.appendChild(box);
      fileI.addEventListener('change', lihatData);
    
}
