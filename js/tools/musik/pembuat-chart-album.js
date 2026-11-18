import { h as T, kv, errBox } from '../../core.js';

export const meta = {"id": "pembuat-chart-album", "name": "Pembuat Chart Album", "cat": "musik", "icon": "🖼️", "desc": "Susun sampul album favoritmu jadi chart 3x3, 4x4, atau 5x5.", "keywords": "chart,album,sampul,cover,kolase,favorit,top", "since": "6.17.0"};

/* Gambar sampul menutupi sel sepenuhnya (potong sisi yang berlebih). */
export function drawCover(ctx, img, x, y, w, h) {
  const s = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const dw = img.naturalWidth * s;
  const dh = img.naturalHeight * s;
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

export function render(root) {
  const CELL = 300;
  const file = T.input('file');
  file.accept = 'image/*';
  file.multiple = true;
  const gridSel = T.select([['3', '3 x 3 (9 album)'], ['4', '4 x 4 (16 album)'], ['5', '5 x 5 (25 album)']], '3');
  const titleInp = T.input('text', 'Judul chart (opsional)');
  const outBox = T.out();
  const gridBox = T.el('<div style="margin:12px 0"></div>');
  const emptyNote = T.el('<p class="hint">Belum ada sampul. Tambahkan gambar sampul album di atas, urutannya mengikuti urutan kamu memilih file.</p>');
  const canvas = document.createElement('canvas');
  canvas.style.display = 'none';
  let images = []; // { img, url }

  const cap = () => {
    const n = parseInt(gridSel.value, 10);
    return n * n;
  };

  const refreshGrid = () => {
    gridBox.innerHTML = '';
    const n = parseInt(gridSel.value, 10);
    if (!images.length) {
      gridBox.appendChild(emptyNote);
      return;
    }
    const grid = T.el('<div style="display:grid;grid-template-columns:repeat(' + n + ',1fr);gap:4px"></div>');
    for (let i = 0; i < cap(); i++) {
      const cell = T.el('<div style="position:relative;aspect-ratio:1/1;background:#221f1c;border-radius:6px;overflow:hidden"></div>');
      const item = images[i];
      if (item) {
        const im = document.createElement('img');
        im.src = item.url;
        im.alt = 'Sampul album ' + (i + 1);
        im.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block';
        cell.appendChild(im);
        const del = T.el('<button type="button" aria-label="Hapus sampul ' + (i + 1) + '" style="position:absolute;top:4px;right:4px;width:22px;height:22px;border:none;border-radius:50%;background:rgba(0,0,0,.65);color:#fff;font-size:13px;line-height:1;cursor:pointer">×</button>');
        del.addEventListener('click', () => {
          URL.revokeObjectURL(images[i].url);
          images.splice(i, 1);
          refreshGrid();
        });
        cell.appendChild(del);
      } else {
        cell.appendChild(T.el('<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#6b6259;font-size:22px">+</div>'));
      }
      grid.appendChild(cell);
    }
    gridBox.appendChild(grid);
  };

  const loadImages = (files) => {
    const list = Array.from(files || []).filter((f) => /^image\//.test(f.type));
    if (!list.length) { T.show(outBox, errBox('Pilih file gambar (JPG, PNG, atau sejenisnya).')); return; }
    let added = 0;
    let skipped = 0;
    let pending = list.length;
    list.forEach((f) => {
      const url = URL.createObjectURL(f);
      const img = new Image();
      img.onload = () => {
        if (images.length < cap()) { images.push({ img, url }); added++; }
        else { URL.revokeObjectURL(url); skipped++; }
        if (--pending === 0) {
          refreshGrid();
          T.hide(outBox);
          if (skipped > 0) T.show(outBox, errBox(skipped + ' gambar tidak masuk karena chart sudah penuh (' + cap() + ' sampul). Perbesar ukuran chart atau hapus dulu yang tidak dipakai.'));
          else if (added > 0) T.toast(added + ' sampul ditambahkan');
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        skipped++;
        if (--pending === 0) {
          refreshGrid();
          if (skipped > 0 && added === 0) T.show(outBox, errBox('Gambar tidak bisa dibaca. Coba file JPG atau PNG lain.'));
        }
      };
      img.src = url;
    });
  };

  file.addEventListener('change', () => {
    loadImages(file.files);
    file.value = '';
  });

  gridSel.addEventListener('change', () => {
    if (images.length > cap()) {
      const extra = images.splice(cap());
      extra.forEach((it) => URL.revokeObjectURL(it.url));
      T.show(outBox, errBox('Chart diperkecil, ' + extra.length + ' sampul terakhir dikeluarkan.'));
    } else {
      T.hide(outBox);
    }
    refreshGrid();
  });

  const shuffleBtn = T.btn('Acak urutan', () => {
    for (let i = images.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = images[i]; images[i] = images[j]; images[j] = t;
    }
    refreshGrid();
  });

  const clearBtn = T.btn('Hapus semua', () => {
    images.forEach((it) => URL.revokeObjectURL(it.url));
    images = [];
    refreshGrid();
    T.hide(outBox);
  });

  const exportBtn = T.btn('Unduh gambar (PNG)', () => {
    if (!images.length) { T.show(outBox, errBox('Tambahkan dulu minimal satu sampul album.')); return; }
    const n = parseInt(gridSel.value, 10);
    const title = titleInp.value.trim();
    const titleH = title ? 90 : 0;
    canvas.width = n * CELL;
    canvas.height = n * CELL + titleH;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#161311';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (title) {
      ctx.fillStyle = '#f4f4f5';
      ctx.font = '700 44px "Bricolage Grotesque", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      let t = title;
      while (ctx.measureText(t).width > canvas.width - 40 && t.length > 1) t = t.slice(0, -1);
      ctx.fillText(t, canvas.width / 2, titleH / 2);
    }
    for (let i = 0; i < n * n; i++) {
      const x = (i % n) * CELL;
      const y = titleH + Math.floor(i / n) * CELL;
      const item = images[i];
      if (item) drawCover(ctx, item.img, x, y, CELL, CELL);
      else {
        ctx.fillStyle = '#221f1c';
        ctx.fillRect(x, y, CELL, CELL);
      }
    }
    canvas.toBlob((blob) => {
      if (!blob) { T.show(outBox, errBox('Gambar tidak bisa dibuat. Coba lagi.')); return; }
      T.dl('chart-album.png', blob, 'image/png');
      T.show(outBox, '<span class="ok">Selesai. Chart terunduh.</span>' +
        kv('Ukuran chart', n + ' x ' + n) +
        kv('Sampul terisi', images.length + ' dari ' + (n * n)));
      T.toast('Chart terunduh');
    }, 'image/png');
  }, true);

  T.onLeave(() => { images.forEach((it) => URL.revokeObjectURL(it.url)); });

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Kumpulkan sampul album yang paling kamu suka, susun jadi satu gambar chart, lalu bagikan. Urutannya bisa diacak, dan sampul bisa dihapus satu per satu dengan menekan tombol silang di pojoknya.</p>'));
  root.appendChild(T.field('Tambah sampul album', file, 'Boleh banyak sekaligus. JPG, PNG, atau format gambar lainnya.'));
  root.appendChild(T.grid2(T.field('Ukuran chart', gridSel), T.field('Judul chart (opsional)', titleInp, 'Tampil di atas chart.')));
  root.appendChild(gridBox);
  root.appendChild(T.row(shuffleBtn, clearBtn, exportBtn));
  root.appendChild(outBox);
  root.appendChild(T.el('<p class="hint">Diproses di browser. Gambarmu tidak diunggah ke mana-mana.</p>'));
  refreshGrid();
}
