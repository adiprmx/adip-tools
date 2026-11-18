import { h as T, loadImage, fileInput, canvasToBlob, fmtBytes, LOCAL_NOTE } from '../../core.js';

// Crop Foto: potong foto bebas dengan bingkai yang bisa diseret dan diubah
// ukurannya. Beda dengan "Crop Pas Foto" (crop-pas-foto.js) yang rasionya
// tetap untuk pas foto; di sini bingkainya bebas atau mengikuti rasio pilihan.
export const meta = {"id": "crop-foto", "name": "Crop Foto", "cat": "gambar", "icon": "✂️", "desc": "Potong foto bebas, bingkainya bisa diseret dan diatur sendiri.", "keywords": "crop,potong foto,bingkai,rasio,potong gambar", "since": "6.16.0"};

const RASIO = [
  ['bebas', 'Bebas', 0],
  ['1:1', 'Kotak 1:1', 1],
  ['4:3', '4:3', 4 / 3],
  ['3:2', '3:2', 3 / 2],
  ['16:9', '16:9', 16 / 9],
];

export function render(root) {
  const fi = fileInput('image/*');
  const rasioSel = T.select(RASIO.map(([v, l]) => [v, l]), 'bebas');
  const fmtSel = T.select([['png', 'PNG (tanpa pecah)'], ['jpeg', 'JPG (ukuran kecil)']], 'png');
  const box = T.out();
  const statusBox = T.out();
  const infoBox = T.out();

  let img = null;       // HTMLImageElement
  let nw = 0, nh = 0;   // ukuran asli foto
  let namaFile = 'foto';
  let imUrl = null;     // URL pratinjau (dibuat baru per file; img.src TIDAK
  // boleh dipakai ulang — loadImage() sudah me-revoke URL-nya, pratinjau
  // gagal ERR_FILE_NOT_FOUND dan tombol unduh tidak pernah aktif).

  // Area pratinjau: gambar + bingkai seleksi (div) di atasnya.
  const area = T.el('<div style="position:relative;max-width:100%;margin:0 auto;touch-action:none;user-select:none;-webkit-user-select:none;display:none"></div>');
  const im = document.createElement('img');
  im.draggable = false;
  im.style.cssText = 'display:block;max-width:100%;height:auto;border-radius:10px';
  const sel = T.el('<div style="position:absolute;border:2px solid #ff6f61;background:rgba(255,111,97,0.12);cursor:move;box-sizing:border-box;display:none"></div>');
  area.appendChild(im);
  area.appendChild(sel);

  // 4 gagang sudut untuk mengubah ukuran bingkai.
  const gagang = {};
  [['nw', 'top', 'left'], ['ne', 'top', 'right'], ['sw', 'bottom', 'left'], ['se', 'bottom', 'right']].forEach(([k, v, h]) => {
    const g = T.el(`<div style="position:absolute;${v}:-9px;${h}:-9px;width:18px;height:18px;background:#ff6f61;border:2px solid #161311;border-radius:50%;cursor:${k === 'nw' || k === 'se' ? 'nwse' : 'nesw'}-resize;touch-action:none"></div>`);
    g.dataset.pos = k;
    sel.appendChild(g);
    gagang[k] = g;
  });

  // Seleksi dalam koordinat tampilan (px layar).
  let sx = 0, sy = 0, sw = 0, sh = 0;
  let aksi = null; // {jenis:'geser'|'ukur', pos, x0, y0, sx, sy, sw, sh}
  const MIN = 24;

  function rasioAktif() {
    const r = RASIO.find(([v]) => v === rasioSel.value);
    return r ? r[2] : 0;
  }

  // Konversi bingkai tampilan -> piksel asli, dijepit ke batas foto.
  // (clientWidth/Height membulat ke bilangan bulat; tanpa jepit, bingkai
  // penuh bisa keluar 1200x901 dari foto 1200x900.)
  function bingkaiAsli() {
    const skala = nw / im.clientWidth;
    const cx = Math.max(0, Math.min(nw - 1, Math.round(sx * skala)));
    const cy = Math.max(0, Math.min(nh - 1, Math.round(sy * skala)));
    const cw = Math.max(1, Math.min(nw - cx, Math.round(sw * skala)));
    const ch = Math.max(1, Math.min(nh - cy, Math.round(sh * skala)));
    return { cx, cy, cw, ch };
  }

  function gambar() {
    sel.style.left = sx + 'px'; sel.style.top = sy + 'px';
    sel.style.width = sw + 'px'; sel.style.height = sh + 'px';
    if (img) {
      const { cw: wAsli, ch: hAsli } = bingkaiAsli();
      T.show(infoBox, `<div class="kv"><span>Ukuran hasil</span><b>${wAsli} × ${hAsli} px</b></div><div class="kv"><span>Foto asli</span><b>${nw} × ${nh} px</b></div>`);
    }
  }

  function bingkaiPenuh() {
    const w = im.clientWidth, h = im.clientHeight;
    const r = rasioAktif();
    if (!r) { sx = 0; sy = 0; sw = w; sh = h; }
    else if (w / h > r) { sh = h; sw = Math.round(h * r); sx = Math.round((w - sw) / 2); sy = 0; }
    else { sw = w; sh = Math.round(w / r); sx = 0; sy = Math.round((h - sh) / 2); }
    gambar();
  }

  function posRelatif(e) {
    const b = area.getBoundingClientRect();
    return { x: e.clientX - b.left, y: e.clientY - b.top };
  }

  sel.addEventListener('pointerdown', (e) => {
    if (!img) return;
    e.preventDefault();
    const p = posRelatif(e);
    const g = e.target.dataset ? e.target.dataset.pos : null;
    aksi = { jenis: g ? 'ukur' : 'geser', pos: g, x0: p.x, y0: p.y, sx, sy, sw, sh };
    sel.setPointerCapture(e.pointerId);
  });
  sel.addEventListener('pointermove', (e) => {
    if (!aksi || !img) return;
    const p = posRelatif(e);
    const dx = p.x - aksi.x0, dy = p.y - aksi.y0;
    const W = im.clientWidth, H = im.clientHeight;
    const r = rasioAktif();
    if (aksi.jenis === 'geser') {
      sx = Math.min(W - sw, Math.max(0, aksi.sx + dx));
      sy = Math.min(H - sh, Math.max(0, aksi.sy + dy));
    } else {
      let x0 = aksi.sx, y0 = aksi.sy, x1 = aksi.sx + aksi.sw, y1 = aksi.sy + aksi.sh;
      if (aksi.pos.includes('e')) x1 = aksi.sx + aksi.sw + dx;
      if (aksi.pos.includes('s')) y1 = aksi.sy + aksi.sh + dy;
      if (aksi.pos.includes('w')) x0 = aksi.sx + dx;
      if (aksi.pos.includes('n')) y0 = aksi.sy + dy;
      if (r) {
        // Rasio terkunci: lebar yang menentukan, tinggi mengikuti.
        const lebar = Math.max(MIN, x1 - x0);
        const tinggi = lebar / r;
        if (aksi.pos.includes('n')) y0 = y1 - tinggi; else y1 = y0 + tinggi;
        x1 = x0 + lebar;
      }
      x0 = Math.min(W - MIN, Math.max(0, x0));
      y0 = Math.min(H - MIN, Math.max(0, y0));
      x1 = Math.min(W, Math.max(x0 + MIN, x1));
      y1 = Math.min(H, Math.max(y0 + MIN, y1));
      sx = Math.round(x0); sy = Math.round(y0);
      sw = Math.round(x1 - x0); sh = Math.round(y1 - y0);
    }
    gambar();
  });
  const akhiri = () => { aksi = null; };
  sel.addEventListener('pointerup', akhiri);
  sel.addEventListener('pointercancel', akhiri);

  rasioSel.addEventListener('change', () => { if (img) bingkaiPenuh(); });

  fi.addEventListener('change', async () => {
    const f = fi.files && fi.files[0];
    if (!f) return;
    T.hide(box); T.hide(infoBox); T.hide(statusBox);
    T.show(statusBox, '<span class="dim">Membuka foto…</span>');
    try {
      img = await loadImage(f);
      nw = img.naturalWidth; nh = img.naturalHeight;
      namaFile = (f.name || 'foto').replace(/\.[^.]*$/, '');
      if (imUrl) URL.revokeObjectURL(imUrl);
      imUrl = URL.createObjectURL(f);
      im.src = imUrl;
      area.style.display = 'block';
      sel.style.display = 'block';
      // Tunggu pratinjau termuat; onerror ikut ditangani supaya gagal muat
      // menampilkan pesan error, bukan menggantung selamanya.
      await new Promise((res, rej) => {
        if (im.complete) { if (im.naturalWidth > 0) res(); else rej(new Error('preview-gagal')); return; }
        im.onload = res;
        im.onerror = () => rej(new Error('preview-gagal'));
      });
      // Tunggu satu frame supaya clientWidth sudah terukur.
      await new Promise((res) => requestAnimationFrame(res));
      T.hide(statusBox);
      bingkaiPenuh();
      unduhB.disabled = false;
    } catch (e) {
      img = null;
      T.show(statusBox, '<div class="err">Foto tidak bisa dibuka. Pastikan filenya gambar yang benar (JPG/PNG/WebP).</div>');
      unduhB.disabled = true;
    }
  });

  async function unduh() {
    if (!img) { T.toast('Pilih foto dulu'); return; }
    const { cx, cy, cw, ch } = bingkaiAsli();
    const c = document.createElement('canvas');
    c.width = cw; c.height = ch;
    const ctx = c.getContext('2d');
    ctx.drawImage(img, cx, cy, cw, ch, 0, 0, cw, ch);
    const mime = fmtSel.value === 'jpeg' ? 'image/jpeg' : 'image/png';
    const blob = await canvasToBlob(c, mime, 0.92);
    if (!blob) { T.toast('Gagal memotong foto, coba lagi'); return; }
    T.dl(`${namaFile}-crop.${fmtSel.value === 'jpeg' ? 'jpg' : 'png'}`, blob, mime);
    T.toast('Berhasil diunduh');
  }

  const unduhB = T.btn('Unduh Hasil Potongan', unduh, true, true);
  const resetB = T.btn('Bingkai Penuh Lagi', () => { if (img) bingkaiPenuh(); });

  root.appendChild(T.el(`<p class="note">🔒 ${LOCAL_NOTE}</p>`));
  root.appendChild(T.field('Pilih foto', fi));
  root.appendChild(T.grid2(
    T.field('Bentuk bingkai', rasioSel, 'Bebas: seret sudutnya sesukamu. Rasio lain mengunci bentuknya.'),
    T.field('Format hasil', fmtSel),
  ));
  root.appendChild(T.el('<p class="hint">Seret bingkainya untuk memindah, seret titik merah di sudutnya untuk mengubah ukuran.</p>'));
  root.appendChild(statusBox);
  root.appendChild(area);
  root.appendChild(infoBox);
  root.appendChild(T.row(unduhB, resetB));
  root.appendChild(box);
}
