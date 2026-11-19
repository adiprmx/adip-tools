import { h as T, loadImage, fileInput, canvasToBlob, LOCAL_NOTE } from '../../core.js';

// Bingkai Blur Foto: foto ditampilkan utuh di tengah, sekelilingnya diisi
// foto yang sama dalam versi blur. Cocok untuk posting foto tegak atau
// mendatar jadi persegi tanpa memotong isinya.
export const meta = {"id": "bingkai-blur-foto", "name": "Bingkai Blur Foto", "cat": "gambar", "icon": "🖼️", "desc": "Foto utuh di tengah, sekelilingnya latar blur dari foto yang sama. Cocok untuk posting persegi.", "keywords": "bingkai blur,blur frame,latar blur,posting persegi,instagram,frame blur", "since": "6.18.0"};

export const BENTUK = {
  persegi: { label: 'Persegi (1:1)', rasio: 1 },
  empatLima: { label: 'Potret (4:5)', rasio: 4 / 5 },
  sembilanEnamBelas: { label: 'Story (9:16)', rasio: 9 / 16 },
  enamBelasSembilan: { label: 'Lanskap (16:9)', rasio: 16 / 9 },
};

// Hitung geometri hasil: ukuran kanvas + posisi foto di tengahnya.
// w, h = ukuran foto; rasio = lebar/tinggi target. Murni, bisa diuji.
export function hitungBingkai(w, h, rasio) {
  const rasioFoto = w / h;
  let cw, ch;
  if (rasioFoto >= rasio) {
    // Foto lebih lebar dari target: kanvas selebar foto, lebih tinggi.
    cw = w;
    ch = Math.round(w / rasio);
  } else {
    // Foto lebih tinggi dari target: kanvas setinggi foto, lebih lebar.
    ch = h;
    cw = Math.round(h * rasio);
  }
  const fx = Math.round((cw - w) / 2);
  const fy = Math.round((ch - h) / 2);
  return { cw, ch, fx, fy, fw: w, fh: h };
}

// Hitung persegi "cover": gambar memenuhi kanvas (boleh terpotong).
// Murni, bisa diuji.
export function hitungCover(w, h, cw, ch) {
  const s = Math.max(cw / w, ch / h);
  const dw = Math.round(w * s), dh = Math.round(h * s);
  return { dx: Math.round((cw - dw) / 2), dy: Math.round((ch - dh) / 2), dw, dh };
}

function dukungFilter() {
  try { return 'filter' in document.createElement('canvas').getContext('2d'); }
  catch (e) { return false; }
}

export function render(root) {
  const fi = fileInput('image/*');
  const bentukSel = T.select(
    Object.entries(BENTUK).map(([k, v]) => [k, v.label]),
    'persegi',
  );
  const fmtSel = T.select([['jpeg', 'JPG (ukuran kecil)'], ['png', 'PNG (tanpa pecah)']], 'jpeg');
  const statusBox = T.out();
  const box = T.out();

  const blurR = T.input('range');
  blurR.min = '5'; blurR.max = '60'; blurR.value = '25';
  const blurV = T.el('<b>25px</b>');
  const blurWrap = T.el('<div class="row" style="align-items:center"></div>');
  blurWrap.appendChild(blurR); blurWrap.appendChild(blurV);

  const kanvas = document.createElement('canvas');
  kanvas.style.cssText = 'max-width:100%;height:auto;border-radius:10px;display:block';
  let img = null;
  let nw = 0, nh = 0;
  let namaFile = 'foto';

  // Gambar hasil ke ctx: latar blur (cover) + foto utuh di tengah.
  // w, h = ukuran foto pada resolusi yang dipakai ctx.
  function gambarKe(ctx, w, h, blurPx) {
    const g = hitungBingkai(w, h, BENTUK[bentukSel.value].rasio);
    const cover = hitungCover(w, h, g.cw, g.ch);
    ctx.filter = 'blur(' + blurPx + 'px)';
    ctx.drawImage(img, cover.dx, cover.dy, cover.dw, cover.dh);
    ctx.filter = 'none';
    // Sedikit gelapkan latar blur supaya foto tengah lebih menonjol.
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.fillRect(0, 0, g.cw, g.ch);
    ctx.drawImage(img, g.fx, g.fy, g.fw, g.fh);
    return g;
  }

  function gambarPratinjau() {
    if (!img) return;
    const skala = Math.min(1, 800 / Math.max(nw, nh));
    const w = Math.max(1, Math.round(nw * skala));
    const h = Math.max(1, Math.round(nh * skala));
    const g = hitungBingkai(w, h, BENTUK[bentukSel.value].rasio);
    kanvas.width = g.cw; kanvas.height = g.ch;
    const ctx = kanvas.getContext('2d');
    if (!ctx) return;
    const blurPx = Math.max(2, Math.round(parseInt(blurR.value, 10) * skala));
    gambarKe(ctx, w, h, blurPx);
  }

  blurR.addEventListener('input', () => { blurV.textContent = blurR.value + 'px'; gambarPratinjau(); });
  bentukSel.addEventListener('change', gambarPratinjau);

  fi.addEventListener('change', async () => {
    const f = fi.files && fi.files[0];
    if (!f) return;
    if (!dukungFilter()) {
      T.show(statusBox, '<div class="err">Browser ini tidak mendukung efek blur. Coba browser lain.</div>');
      return;
    }
    T.hide(box); T.hide(statusBox);
    T.show(statusBox, '<span class="dim">Membuka foto…</span>');
    try {
      img = await loadImage(f);
      nw = img.naturalWidth; nh = img.naturalHeight;
      namaFile = (f.name || 'foto').replace(/\.[^.]*$/, '');
      T.hide(statusBox);
      T.show(box, '');
      box.appendChild(kanvas);
      unduhB.disabled = false;
      gambarPratinjau();
    } catch (e) {
      img = null;
      T.show(statusBox, '<div class="err">Foto tidak bisa dibuka. Pastikan filenya gambar yang benar (JPG/PNG/WebP).</div>');
      unduhB.disabled = true;
    }
  });

  async function unduh() {
    if (!img) { T.toast('Pilih foto dulu'); return; }
    unduhB.disabled = true;
    T.show(statusBox, '<span class="dim">Menyiapkan hasil…</span>');
    try {
      const skala = Math.min(1, 1600 / Math.max(nw, nh));
      const w = Math.max(1, Math.round(nw * skala));
      const h = Math.max(1, Math.round(nh * skala));
      const g = hitungBingkai(w, h, BENTUK[bentukSel.value].rasio);
      const c = document.createElement('canvas');
      c.width = g.cw; c.height = g.ch;
      const ctx = c.getContext('2d');
      const blurPx = Math.max(2, Math.round(parseInt(blurR.value, 10) * (w / nw)));
      gambarKe(ctx, w, h, blurPx);
      const mime = fmtSel.value === 'png' ? 'image/png' : 'image/jpeg';
      const blob = await canvasToBlob(c, mime, 0.92);
      if (!blob) throw new Error('gagal');
      T.dl(`${namaFile}-bingkai-blur.${fmtSel.value === 'png' ? 'png' : 'jpg'}`, blob, mime);
      T.toast('Berhasil diunduh');
    } catch (e) {
      T.toast('Gagal membuat hasil, coba lagi');
    } finally {
      T.hide(statusBox);
      unduhB.disabled = false;
    }
  }

  const unduhB = T.btn('Unduh Hasil', unduh, true, true);

  root.appendChild(T.el(`<p class="note">🔒 ${LOCAL_NOTE}</p>`));
  root.appendChild(T.field('Pilih foto', fi));
  root.appendChild(T.field('Bentuk hasil', bentukSel));
  root.appendChild(T.field('Seberapa blur latarnya', blurWrap));
  root.appendChild(T.field('Format hasil', fmtSel));
  root.appendChild(statusBox);
  root.appendChild(box);
  root.appendChild(T.row(unduhB));
  root.appendChild(T.el('<p class="hint">Foto tidak dipotong: seluruh isi foto tetap terlihat, latar blur mengisi ruang kosongnya.</p>'));
}
