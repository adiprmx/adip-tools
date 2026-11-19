import { h as T, loadImage, fileInput, canvasToBlob, fmtBytes, LOCAL_NOTE } from '../../core.js';

// Foto ke Sprite Sheet: gabung banyak gambar kecil jadi satu lembar sprite
// untuk game. Semua sel ukurannya sama, posisinya teratur dalam grid,
// dan koordinat tiap sprite bisa diunduh sebagai file JSON.
// Berbeda dari kolase yang susunannya artistik dan dari split-grid yang
// justru memotong satu foto.
export const meta = {"id": "foto-ke-sprite-sheet", "name": "Foto ke Sprite Sheet", "cat": "gambar", "icon": "🎮", "desc": "Gabung banyak gambar kecil jadi satu lembar sprite game, lengkap dengan peta koordinatnya.", "keywords": "sprite sheet,sprite,game,grid,gabung gambar,json", "since": "6.19.0"};

// Hitung tata letak grid sprite. Kembalikan ukuran lembar, jumlah baris,
// dan posisi tiap sel [x, y, w, h].
// kolom 0 = otomatis (akar jumlah, dibulatkan ke atas).
export function tataSprite(jumlah, kolom, sel, jarak) {
  const n = Math.max(0, Math.floor(jumlah));
  const s = Math.max(1, Math.floor(sel));
  const p = Math.max(0, Math.floor(jarak));
  const k = kolom > 0 ? Math.floor(kolom) : Math.max(1, Math.ceil(Math.sqrt(n)));
  const baris = n === 0 ? 0 : Math.ceil(n / k);
  const lebar = n === 0 ? 0 : k * s + (k - 1) * p;
  const tinggi = n === 0 ? 0 : baris * s + (baris - 1) * p;
  const posisi = [];
  for (let i = 0; i < n; i++) {
    const cx = i % k;
    const cy = Math.floor(i / k);
    posisi.push([cx * (s + p), cy * (s + p), s, s]);
  }
  return { kolom: k, baris, lebar, tinggi, sel: s, jarak: p, posisi };
}

// Buat teks JSON peta koordinat sprite (format sederhana: frames berisi
// nama, x, y, w, h; plus meta ukuran lembar).
export function spriteJson(namaLembar, tata, namaFile) {
  const frames = {};
  tata.posisi.forEach(([x, y, w, h], i) => {
    const nama = (namaFile && namaFile[i]) ? namaFile[i] : 'sprite-' + (i + 1);
    frames[nama] = { frame: { x, y, w, h } };
  });
  return JSON.stringify({
    frames,
    meta: { app: 'Adip Tools', image: namaLembar, size: { w: tata.lebar, h: tata.tinggi }, scale: '1' }
  }, null, 2);
}

export function render(root) {
  const fi = fileInput('image/*');
  fi.multiple = true;
  const kolomSel = T.select([['0', 'Otomatis (sekotak mungkin)'], ['2', '2 kolom'], ['3', '3 kolom'], ['4', '4 kolom'], ['6', '6 kolom'], ['8', '8 kolom'], ['10', '10 kolom']], '0');
  const selSel = T.select([['32', '32 px'], ['48', '48 px'], ['64', '64 px'], ['96', '96 px'], ['128', '128 px']], '64');
  const latarSel = T.select([['transparan', 'Transparan'], ['putih', 'Putih'], ['hitam', 'Hitam']], 'transparan');
  const statusBox = T.out();
  const box = T.out();
  const infoBox = T.out();

  const jarakR = T.input('range');
  jarakR.min = '0'; jarakR.max = '16'; jarakR.value = '0';
  const jarakV = T.el('<b>0 px</b>');
  const jarakWrap = T.el('<div class="row" style="align-items:center"></div>');
  jarakWrap.appendChild(jarakR); jarakWrap.appendChild(jarakV);

  let daftar = []; // [{img, nama}]
  let tata = null;
  const kanvas = document.createElement('canvas');
  kanvas.style.cssText = 'max-width:100%;height:auto;border-radius:10px;display:block;background-image:linear-gradient(45deg,#2a2a2a 25%,transparent 25%,transparent 75%,#2a2a2a 75%),linear-gradient(45deg,#2a2a2a 25%,transparent 25%,transparent 75%,#2a2a2a 75%);background-color:#1c1c1c;background-size:16px 16px;background-position:0 0,8px 8px';

  function gambar() {
    if (!daftar.length) return;
    tata = tataSprite(daftar.length, parseInt(kolomSel.value, 10), parseInt(selSel.value, 10), parseInt(jarakR.value, 10));
    kanvas.width = tata.lebar;
    kanvas.height = tata.tinggi;
    const ctx = kanvas.getContext('2d');
    ctx.clearRect(0, 0, tata.lebar, tata.tinggi);
    if (latarSel.value === 'putih') { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, tata.lebar, tata.tinggi); }
    if (latarSel.value === 'hitam') { ctx.fillStyle = '#000000'; ctx.fillRect(0, 0, tata.lebar, tata.tinggi); }
    daftar.forEach((item, i) => {
      const [x, y, w, h] = tata.posisi[i];
      const iw = item.img.naturalWidth, ih = item.img.naturalHeight;
      const sk = Math.min(w / iw, h / ih);
      const dw = Math.max(1, Math.round(iw * sk));
      const dh = Math.max(1, Math.round(ih * sk));
      ctx.drawImage(item.img, x + Math.round((w - dw) / 2), y + Math.round((h - dh) / 2), dw, dh);
    });
    T.show(box, '');
    box.appendChild(kanvas);
    T.show(infoBox, '<div class="kv"><span>Sprite</span><b>' + daftar.length + ' gambar</b></div>' +
      '<div class="kv"><span>Grid</span><b>' + tata.kolom + ' kolom x ' + tata.baris + ' baris</b></div>' +
      '<div class="kv"><span>Ukuran lembar</span><b>' + tata.lebar + ' x ' + tata.tinggi + ' px</b></div>');
    unduhB.disabled = false;
    jsonB.disabled = false;
  }

  jarakR.addEventListener('input', () => { jarakV.textContent = jarakR.value + ' px'; gambar(); });
  kolomSel.addEventListener('change', gambar);
  selSel.addEventListener('change', gambar);
  latarSel.addEventListener('change', gambar);

  fi.addEventListener('change', async () => {
    const files = [...(fi.files || [])].filter((f) => /^image\//.test(f.type));
    if (!files.length) { T.toast('Pilih gambar dulu'); return; }
    if (files.length > 64) T.toast('Maksimal 64 gambar, yang dipakai 64 pertama');
    T.hide(box); T.hide(infoBox);
    T.show(statusBox, '<span class="dim">Membuka gambar…</span>');
    try {
      const potong = files.slice(0, 64);
      const imgs = await Promise.all(potong.map(loadImage));
      daftar = imgs.map((img, i) => ({ img, nama: (potong[i].name || 'sprite-' + (i + 1)).replace(/\.[^.]*$/, '') }));
      T.hide(statusBox);
      gambar();
    } catch (e) {
      daftar = [];
      T.show(statusBox, '<div class="err">Ada gambar yang tidak bisa dibuka. Pastikan semuanya gambar yang benar (JPG/PNG/WebP).</div>');
      unduhB.disabled = true;
      jsonB.disabled = true;
    }
  });

  async function unduhPng() {
    if (!daftar.length || !tata) { T.toast('Pilih gambar dulu'); return; }
    unduhB.disabled = true;
    try {
      const blob = await canvasToBlob(kanvas, 'image/png');
      if (!blob) throw new Error('gagal');
      T.dl('sprite-sheet.png', blob, 'image/png');
      T.toast('Berhasil diunduh (' + fmtBytes(blob.size) + ')');
    } catch (e) {
      T.toast('Gagal membuat hasil, coba lagi');
    } finally {
      unduhB.disabled = false;
    }
  }

  function unduhJson() {
    if (!daftar.length || !tata) { T.toast('Pilih gambar dulu'); return; }
    const teks = spriteJson('sprite-sheet.png', tata, daftar.map((d) => d.nama));
    T.dl('sprite-sheet.json', new Blob([teks], { type: 'application/json;charset=utf-8' }), 'application/json');
    T.toast('Peta koordinat diunduh');
  }

  const unduhB = T.btn('Unduh Sprite Sheet (PNG)', unduhPng, true, true);
  const jsonB = T.btn('Unduh Peta Koordinat (JSON)', unduhJson, false, true);

  root.appendChild(T.el('<p class="note">🔒 ' + LOCAL_NOTE + '</p>'));
  root.appendChild(T.field('Pilih gambar sprite (bisa banyak sekaligus)', fi, 'Di HP: tahan dan pilih beberapa gambar sekaligus. Maksimal 64 gambar. Urutan sprite mengikuti urutan kamu memilih.'));
  root.appendChild(T.grid2(T.field('Jumlah kolom', kolomSel), T.field('Ukuran tiap sel', selSel)));
  root.appendChild(T.grid2(T.field('Jarak antar sel', jarakWrap), T.field('Warna latar lembar', latarSel)));
  root.appendChild(statusBox);
  T.show(box, '<span class="dim">Pilih gambar dulu, lembar spritenya muncul di sini.</span>');
  root.appendChild(box);
  root.appendChild(infoBox);
  root.appendChild(T.row(unduhB, jsonB));
  root.appendChild(T.el('<p class="hint">Tiap gambar menyesuaikan ukuran sel tanpa terpotong. File JSON berisi posisi tiap sprite, siap dipakai mesin game.</p>'));
}
