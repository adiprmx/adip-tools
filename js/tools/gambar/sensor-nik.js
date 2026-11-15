import { h as T, kv, fileInput, loadImage, canvasToBlob, fmtBytes, errBox } from '../../core.js?v=6.12.0';

export const meta = {"id":"sensor-nik","name":"Sensor NIK di Foto","cat":"gambar","icon":"🫣","desc":"Tutup nomor identitas di foto dokumen dengan blur atau kotak hitam.","keywords":"sensor,nik,ktp,blur,privasi,dokumen,foto","since":"6.11.0"};

/* Sensor NIK: gambar area sensitif di foto, lalu unduh hasilnya.
   Area disimpan sebagai pecahan ukuran foto, jadi pratinjau dan hasil
   unduhan selalu sama. Blur memakai ctx.filter bila tersedia, kalau tidak
   otomatis pakai piksel (tetap menutup rapat). Sensor di file hasil
   permanen, tidak bisa dibuka lagi. Itu memang tujuannya. */
const FILTER_OK = (() => {
  try {
    const c = document.createElement('canvas').getContext('2d');
    return !!(c && 'filter' in c);
  } catch (e) { return false; }
})();

function applyRect(ctx, img, r, mode, scale) {
  const x = Math.round(r.x * img.naturalWidth), y = Math.round(r.y * img.naturalHeight);
  const w = Math.round(r.w * img.naturalWidth), h = Math.round(r.h * img.naturalHeight);
  if (w < 2 || h < 2) return;
  const dx = Math.round(x * scale), dy = Math.round(y * scale);
  const dw = Math.round(w * scale), dh = Math.round(h * scale);
  if (mode === 'hitam') {
    ctx.fillStyle = '#000000';
    ctx.fillRect(dx, dy, dw, dh);
    return;
  }
  if (FILTER_OK) {
    const bleed = Math.round(16 * scale) || 8;
    ctx.save();
    ctx.beginPath();
    ctx.rect(dx, dy, dw, dh);
    ctx.clip();
    ctx.filter = 'blur(' + Math.max(8, Math.round(14 * scale)) + 'px)';
    ctx.drawImage(img, x - bleed, y - bleed, w + bleed * 2, h + bleed * 2, dx - bleed, dy - bleed, dw + bleed * 2, dh + bleed * 2);
    ctx.restore();
    ctx.filter = 'none';
    return;
  }
  const tmp = document.createElement('canvas');
  const pw = Math.max(2, Math.round(w / 12)), ph = Math.max(2, Math.round(h / 12));
  tmp.width = pw; tmp.height = ph;
  const tc = tmp.getContext('2d');
  tc.drawImage(img, x, y, w, h, 0, 0, pw, ph);
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(tmp, dx, dy, dw, dh);
  ctx.restore();
}

export function render(root) {
  const fi = fileInput('image/*');
  const modeSel = T.select([['blur', 'Blur'], ['hitam', 'Kotak hitam']], 'blur');
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'width:100%;height:auto;border-radius:10px;border:1px solid #ffffff20;display:block;touch-action:none;cursor:crosshair';
  const box = T.out();
  const listBox = T.out();
  const prevWrap = T.el('<div style="margin-top:12px" hidden></div>');
  prevWrap.appendChild(canvas);
  prevWrap.appendChild(T.el('<p class="hint">Seret di atas foto untuk menandai area yang mau ditutup. Area bisa lebih dari satu.</p>'));

  let img = null, rects = [];
  let dispW = 0, dispH = 0;
  let drawing = false, sx = 0, sy = 0, cur = null;

  const draw = () => {
    if (!img) return;
    const scale = Math.min(1, 640 / img.naturalWidth, 640 / img.naturalHeight);
    dispW = Math.max(1, Math.round(img.naturalWidth * scale));
    dispH = Math.max(1, Math.round(img.naturalHeight * scale));
    canvas.width = dispW; canvas.height = dispH;
    const x = canvas.getContext('2d');
    x.drawImage(img, 0, 0, dispW, dispH);
    const mode = modeSel.value;
    rects.forEach((r) => applyRect(x, img, r, mode, dispW / img.naturalWidth));
    if (cur) {
      x.strokeStyle = '#ffffff'; x.lineWidth = 2; x.setLineDash([6, 4]);
      x.strokeRect(cur.x * dispW, cur.y * dispH, cur.w * dispW, cur.h * dispH);
      x.setLineDash([]);
    }
  };

  const refreshList = () => {
    if (!rects.length) {
      T.show(listBox, '<p class="hint">Belum ada area yang ditandai. Seret di atas foto untuk menambah.</p>');
      return;
    }
    T.show(listBox, '<p class="hint" style="margin-bottom:6px">' + rects.length + ' area ditutup:</p>');
    rects.forEach((r, i) => {
      const row = T.el('<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-top:1px solid #ffffff10;font-size:13px"></div>');
      row.appendChild(T.el('<span>Area ' + (i + 1) + ', ' + Math.round(r.w * 100) + '% × ' + Math.round(r.h * 100) + '% foto</span>'));
      const del = T.btn('Hapus', () => { rects.splice(i, 1); draw(); refreshList(); });
      del.classList.add('small');
      row.appendChild(del);
      listBox.appendChild(row);
    });
  };

  const pos = (e) => {
    const rc = canvas.getBoundingClientRect();
    return {
      x: Math.min(1, Math.max(0, (e.clientX - rc.left) / rc.width)),
      y: Math.min(1, Math.max(0, (e.clientY - rc.top) / rc.height)),
    };
  };
  canvas.addEventListener('pointerdown', (e) => {
    if (!img) return;
    const p = pos(e);
    drawing = true; sx = p.x; sy = p.y; cur = { x: p.x, y: p.y, w: 0, h: 0 };
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!drawing || !cur) return;
    const p = pos(e);
    cur.x = Math.min(sx, p.x); cur.y = Math.min(sy, p.y);
    cur.w = Math.abs(p.x - sx); cur.h = Math.abs(p.y - sy);
    draw();
  });
  const endDraw = () => {
    if (!drawing) return;
    drawing = false;
    if (cur && cur.w > 0.01 && cur.h > 0.01) {
      rects.push({ x: cur.x, y: cur.y, w: cur.w, h: cur.h });
      refreshList();
    }
    cur = null;
    draw();
  };
  canvas.addEventListener('pointerup', endDraw);
  canvas.addEventListener('pointercancel', endDraw);

  fi.addEventListener('change', async () => {
    const f = fi.files && fi.files[0];
    if (!f) return;
    try { img = await loadImage(f); }
    catch (e) { T.show(box, errBox('File itu bukan gambar. Pilih file gambar.')); return; }
    rects = [];
    prevWrap.hidden = false;
    draw();
    refreshList();
    T.hide(box);
    T.toast('Foto sudah dipilih, seret area yang mau ditutup');
  });

  const unduh = async () => {
    if (!img) { T.toast('Pilih foto dulu'); return; }
    if (!rects.length) { T.show(box, errBox('Tandai dulu area yang mau ditutup dengan menyeret di atas foto.')); return; }
    T.show(box, '<span class="dim">Menyiapkan gambar…</span>');
    await new Promise((r) => setTimeout(r, 30));
    const out = document.createElement('canvas');
    out.width = img.naturalWidth; out.height = img.naturalHeight;
    const x = out.getContext('2d');
    if (!x) { T.show(box, errBox('Browser ini tidak bisa membuat gambar.')); return; }
    x.drawImage(img, 0, 0);
    rects.forEach((r) => applyRect(x, img, r, modeSel.value, 1));
    const blob = await canvasToBlob(out, 'image/png');
    if (!blob) { T.show(box, errBox('Gambarnya tidak bisa dibuat. Coba lagi.')); return; }
    const base = (fi.files[0].name || 'foto').replace(/\.[^.]*$/, '');
    T.dl(base + '-sensor.png', blob, 'image/png');
    T.show(box, kv('Area ditutup', rects.length + ' area') + kv('Ukuran hasil', out.width + ' × ' + out.height + ' px (' + fmtBytes(blob.size) + ')') +
      '<p class="hint">Sensor di file ini permanen. Foto aslinya tidak berubah.</p>');
    T.toast('Gambar diunduh');
  };

  root.appendChild(T.el('<p class="note">Diproses di browser, foto tidak diunggah ke mana-mana.</p>'));
  root.appendChild(T.el('<p class="mut" style="font-size:13.5px;line-height:1.6">Tutup nomor identitas (NIK, nomor KK, nomor kartu) di foto dokumen sebelum dibagikan. Seret kotak di area yang mau ditutup, pilih blur atau kotak hitam, lalu unduh hasilnya.</p>'));
  root.appendChild(T.field('Pilih foto dokumen', fi));
  root.appendChild(T.field('Cara menutup', modeSel, 'Blur mengaburkan angka, kotak hitam menutupnya rapat.'));
  root.appendChild(prevWrap);
  root.appendChild(listBox);
  root.appendChild(T.row(T.btn('Unduh hasil', unduh, true), T.btn('Hapus semua area', () => { rects = []; draw(); refreshList(); })));
  root.appendChild(box);
}
