import { h as T, loadImage, fileInput, canvasToBlob, LOCAL_NOTE } from '../../core.js';

// Putar & Balik Foto: putar 90/180 derajat atau cerminkan foto.
// Keadaan putar + balik disimpan, pratinjau digambar ulang di canvas,
// hasil unduhan memakai transformasi yang sama di resolusi asli.
export const meta = {"id": "putar-balik-foto", "name": "Putar & Balik Foto", "cat": "gambar", "icon": "🔄", "desc": "Putar foto 90 atau 180 derajat, atau cerminkan kiri-kanan.", "keywords": "putar foto,balik foto,cermin,rotasi,flip,miring", "since": "6.16.0"};

// Hitung ukuran canvas hasil dari putaran (murni, bisa diuji tanpa DOM).
export function ukuranHasil(w, h, putar) {
  const tegak = putar % 180 !== 0;
  return tegak ? { w: h, h: w } : { w, h };
}

// Terapkan putar + balik ke context canvas (context sudah berukuran hasil).
export function terapkanTransform(ctx, w, h, putar, balikH, balikV) {
  const u = ukuranHasil(w, h, putar);
  ctx.translate(u.w / 2, u.h / 2);
  ctx.rotate((putar * Math.PI) / 180);
  ctx.scale(balikH ? -1 : 1, balikV ? -1 : 1);
  ctx.translate(-w / 2, -h / 2);
}

export function render(root) {
  const fi = fileInput('image/*');
  const fmtSel = T.select([['jpeg', 'JPG (ukuran kecil)'], ['png', 'PNG (tanpa pecah)']], 'jpeg');
  const statusBox = T.out();
  const box = T.out();
  const infoBox = T.out();

  let img = null;
  let nw = 0, nh = 0;
  let namaFile = 'foto';
  let putar = 0;      // 0, 90, 180, 270
  let balikH = false, balikV = false;
  let kanvas = null;

  function gambar() {
    if (!img || !kanvas) return;
    const u = ukuranHasil(nw, nh, putar);
    const skala = Math.min(1, 900 / Math.max(u.w, u.h));
    const w = Math.max(1, Math.round(u.w * skala));
    const h = Math.max(1, Math.round(u.h * skala));
    kanvas.width = w; kanvas.height = h;
    const ctx = kanvas.getContext('2d');
    ctx.save();
    ctx.scale(skala, skala);
    terapkanTransform(ctx, nw, nh, putar, balikH, balikV);
    ctx.drawImage(img, 0, 0);
    ctx.restore();
    T.show(infoBox, `<div class="kv"><span>Ukuran hasil</span><b>${u.w} × ${u.h} px</b></div>`);
  }

  function aturTombol(aktif) {
    [putarKananB, putarKiriB, putar180B, balikHB, balikVB, resetB, unduhB].forEach((b) => { b.disabled = !aktif; });
  }

  fi.addEventListener('change', async () => {
    const f = fi.files && fi.files[0];
    if (!f) return;
    T.hide(box); T.hide(infoBox); T.hide(statusBox);
    T.show(statusBox, '<span class="dim">Membuka foto…</span>');
    try {
      img = await loadImage(f);
      nw = img.naturalWidth; nh = img.naturalHeight;
      namaFile = (f.name || 'foto').replace(/\.[^.]*$/, '');
      putar = 0; balikH = false; balikV = false;
      kanvas = document.createElement('canvas');
      kanvas.style.cssText = 'max-width:100%;height:auto;border-radius:10px;display:block';
      T.hide(statusBox);
      T.show(box, '');
      box.appendChild(kanvas);
      aturTombol(true);
      gambar();
    } catch (e) {
      img = null;
      T.show(statusBox, '<div class="err">Foto tidak bisa dibuka. Pastikan filenya gambar yang benar (JPG/PNG/WebP).</div>');
      aturTombol(false);
    }
  });

  async function unduh() {
    if (!img) { T.toast('Pilih foto dulu'); return; }
    const u = ukuranHasil(nw, nh, putar);
    const c = document.createElement('canvas');
    c.width = u.w; c.height = u.h;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#ffffff';
    if (fmtSel.value === 'jpeg') ctx.fillRect(0, 0, u.w, u.h);
    terapkanTransform(ctx, nw, nh, putar, balikH, balikV);
    ctx.drawImage(img, 0, 0);
    const mime = fmtSel.value === 'png' ? 'image/png' : 'image/jpeg';
    const blob = await canvasToBlob(c, mime, 0.92);
    if (!blob) { T.toast('Gagal membuat hasil, coba lagi'); return; }
    T.dl(`${namaFile}-putar.${fmtSel.value === 'png' ? 'png' : 'jpg'}`, blob, mime);
    T.toast('Berhasil diunduh');
  }

  const putarKananB = T.btn('Putar Kanan 90°', () => { putar = (putar + 90) % 360; gambar(); }, false, true);
  const putarKiriB = T.btn('Putar Kiri 90°', () => { putar = (putar + 270) % 360; gambar(); }, false, true);
  const putar180B = T.btn('Putar 180°', () => { putar = (putar + 180) % 360; gambar(); }, false, true);
  const balikHB = T.btn('Balik Kiri-Kanan', () => { balikH = !balikH; gambar(); }, false, true);
  const balikVB = T.btn('Balik Atas-Bawah', () => { balikV = !balikV; gambar(); }, false, true);
  const resetB = T.btn('Kembalikan Seperti Semula', () => { putar = 0; balikH = false; balikV = false; gambar(); }, false, true);
  const unduhB = T.btn('Unduh Hasil', unduh, true, true);

  root.appendChild(T.el(`<p class="note">🔒 ${LOCAL_NOTE}</p>`));
  root.appendChild(T.field('Pilih foto', fi));
  root.appendChild(statusBox);
  root.appendChild(box);
  root.appendChild(infoBox);
  root.appendChild(T.row(putarKananB, putarKiriB));
  root.appendChild(T.row(putar180B, balikHB));
  root.appendChild(T.row(balikVB, resetB));
  root.appendChild(T.field('Format hasil', fmtSel));
  root.appendChild(unduhB);
}
