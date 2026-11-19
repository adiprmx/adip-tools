import { h as T, loadImage, fileInput, canvasToBlob, fmtBytes, LOCAL_NOTE } from '../../core.js';

// Pecah Foto: potong satu foto jadi potongan-potongan baris x kolom,
// seluruh foto terpakai tanpa crop. BEDA dari Split Grid Instagram
// (split-grid-ig.js) yang khusus feed IG: selalu 3 kolom, crop
// persegi dari tengah, dan potongan diberi nomor urut posting. Di
// sini baris dan kolom bebas 1-10 dan foto tidak dipotong tengahnya.
export const meta = {"id": "pecah-foto", "name": "Pecah Foto", "cat": "gambar", "icon": "✂️", "desc": "Potong satu foto jadi banyak potongan baris dan kolom, tanpa crop.", "keywords": "pecah foto,potong foto,split,grid,potongan", "since": "6.19.0"};

// Hitung kotak tiap potongan (murni). Sisa piksel dari pembagian
// yang tidak bulat dilempar ke baris/kolom terakhir supaya seluruh
// foto terpakai tanpa celah dan tanpa tumpang tindih.
export function hitungPotongan(lebar, tinggi, baris, kolom) {
  const r = Math.max(1, Math.min(10, Math.round(baris) || 1));
  const c = Math.max(1, Math.min(10, Math.round(kolom) || 1));
  const potongan = [];
  const tw = Math.floor(lebar / c), th = Math.floor(tinggi / r);
  for (let y = 0; y < r; y++) {
    for (let x = 0; x < c; x++) {
      const px = x * tw, py = y * th;
      const pw = x === c - 1 ? lebar - px : tw;
      const ph = y === r - 1 ? tinggi - py : th;
      potongan.push({ x: px, y: py, w: pw, h: ph, baris: y + 1, kolom: x + 1 });
    }
  }
  return potongan;
}

export function render(root) {
  const fi = fileInput('image/*');
  const barisSel = T.select(Array.from({ length: 10 }, (_, i) => [String(i + 1), (i + 1) + ' baris']), '2');
  const kolomSel = T.select(Array.from({ length: 10 }, (_, i) => [String(i + 1), (i + 1) + ' kolom']), '2');
  const box = T.out();
  const infoBox = T.out();
  let img = null, kanvas = [];

  async function make() {
    T.hide(infoBox); T.hide(box);
    kanvas = [];
    if (!img) return;
    const w = img.naturalWidth, h = img.naturalHeight;
    const daftar = hitungPotongan(w, h, +barisSel.value, +kolomSel.value);
    const grid = T.el('<div style="display:grid;grid-template-columns:repeat(' + Math.min(daftar.length, +kolomSel.value) + ',1fr);gap:6px"></div>');
    for (let i = 0; i < daftar.length; i++) {
      const p = daftar[i];
      const c = document.createElement('canvas');
      c.width = p.w; c.height = p.h;
      c.getContext('2d').drawImage(img, p.x, p.y, p.w, p.h, 0, 0, p.w, p.h);
      kanvas.push(c);
      const nm = 'pecah-' + String(p.baris) + 'x' + String(p.kolom) + '.png';
      const cell = T.el('<div style="position:relative;cursor:pointer"></div>');
      const thumb = document.createElement('img');
      thumb.src = c.toDataURL('image/png');
      thumb.alt = 'Potongan baris ' + p.baris + ' kolom ' + p.kolom;
      thumb.style.cssText = 'width:100%;height:auto;border-radius:8px;border:1px solid #ffffff20;display:block';
      cell.appendChild(thumb);
      const badge = T.el('<div>' + p.baris + 'x' + p.kolom + '</div>');
      badge.style.cssText = 'position:absolute;top:6px;left:6px;background:rgba(0,0,0,.65);color:#fff;font-size:12px;font-weight:700;border-radius:8px;padding:2px 8px';
      cell.appendChild(badge);
      cell.addEventListener('click', async () => {
        const b = await canvasToBlob(c, 'image/png');
        if (b) T.dl(nm, b, 'image/png');
      });
      grid.appendChild(cell);
    }
    T.show(box, '<p class="center mut">Ketuk tiap potongan untuk mengunduh PNG-nya.</p>');
    box.appendChild(grid);
    T.show(infoBox, '<div class="kv"><span>Foto asli</span><b>' + w + 'x' + h + ' px</b></div>' +
      '<div class="kv"><span>Potongan</span><b>' + daftar.length + ' (' + barisSel.value + 'x' + kolomSel.value + ')</b></div>' +
      '<div class="kv"><span>Ukuran tiap potongan</span><b>' + daftar[0].w + 'x' + daftar[0].h + ' px</b></div>');
  }

  const muat = async () => {
    if (!fi.files[0]) { T.toast('Pilih foto dulu'); return; }
    try { img = await loadImage(fi.files[0]); }
    catch (e) { T.toast('File itu bukan gambar. Pilih file gambar.'); return; }
    make();
    T.toast('Foto terpecah!');
  };

  const dlSemuaB = T.btn('Unduh semua', async () => {
    if (!kanvas.length) { T.toast('Pecah dulu fotonya'); return; }
    const daftar = hitungPotongan(img.naturalWidth, img.naturalHeight, +barisSel.value, +kolomSel.value);
    for (let i = 0; i < kanvas.length; i++) {
      const b = await canvasToBlob(kanvas[i], 'image/png');
      if (b) T.dl('pecah-' + daftar[i].baris + 'x' + daftar[i].kolom + '.png', b, 'image/png');
      await new Promise((r) => setTimeout(r, 150));
    }
    T.toast(kanvas.length + ' potongan diunduh');
  }, true);

  barisSel.addEventListener('change', make);
  kolomSel.addEventListener('change', make);

  root.appendChild(T.el('<p class="note">🔒 ' + LOCAL_NOTE + '</p>'));
  root.appendChild(T.el('<p class="mut" style="font-size:13.5px;line-height:1.6">Satu foto dipotong jadi kotak-kotak. Seluruh foto terpakai, tidak ada bagian yang dibuang.</p>'));
  root.appendChild(T.field('Pilih foto', fi));
  root.appendChild(T.grid2(T.field('Baris', barisSel), T.field('Kolom', kolomSel)));
  root.appendChild(T.row(T.btn('Pecah Foto', muat, true), dlSemuaB));
  root.appendChild(infoBox);
  root.appendChild(box);
  fi.addEventListener('change', muat);
}
