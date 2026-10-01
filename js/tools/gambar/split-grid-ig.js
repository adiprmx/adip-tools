import { h as T, utils, loadImage } from '../../core.js?v=6.7.0';

export const meta = {"id": "split-grid-ig", "name": "Split Grid Instagram", "cat": "gambar", "icon": "🔲", "desc": "Potong foto jadi grid siap posting berurutan ke IG.", "keywords": "instagram,grid,split,potong,foto,feed,puzzle"};
export function render(root) {
  const polaSel = T.select([
    ['2x3', '3 × 2 (6 tile)'],
    ['3x3', '3 × 3 (9 tile)'],
    ['4x3', '3 × 4 (12 tile)'],
  ], '3x3');
  const fileInp = document.createElement('input');
  fileInp.type = 'file';
  fileInp.accept = 'image/*';
  fileInp.className = 'inp';
  const box = T.out();
  let urls = [];
  const cleanup = () => { urls.forEach((u) => URL.revokeObjectURL(u)); urls = []; };
  T.onLeave(cleanup);

  const proses = async () => {
    const f = fileInp.files && fileInp.files[0];
    if (!f) { T.show(box, '<p class="hint">Pilih gambar dulu ya.</p>'); return; }
    T.show(box, '<p class="center mut">Lagi motong-motong gambarnya…</p>');
    let img;
    try {
      img = await loadImage(f);
    } catch (e) {
      T.show(box, '<p class="hint">File-nya nggak kebaca sebagai gambar, coba file lain ya.</p>');
      return;
    }
    const [rows, cols] = polaSel.value.split('x').map(Number); // 3 kolom, N baris
    const TILE = 1080;
    // Crop square dari tengah, lalu ambil pita tengah setinggi rows tile
    const s = Math.min(img.naturalWidth, img.naturalHeight);
    const tile = s / 3;
    const sx = Math.floor((img.naturalWidth - s) / 2);
    const bandY = Math.floor((img.naturalHeight - s) / 2 + (s - rows * tile) / 2);
    const N = rows * cols;
    cleanup();
    const grid = T.el('<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px"></div>');
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        const c = document.createElement('canvas');
        c.width = TILE;
        c.height = TILE;
        c.getContext('2d').drawImage(img, sx + j * tile, bandY + i * tile, tile, tile, 0, 0, TILE, TILE);
        // Nomor urut posting: IG mengisi grid dari kanan-bawah, jadi upload dari nomor 1
        const nomor = N - (i * cols + j);
        const nm = 'ig-grid-' + String(nomor).padStart(2, '0') + '.png';
        const cell = T.el('<div style="position:relative;cursor:pointer"></div>');
        const thumb = document.createElement('img');
        thumb.src = c.toDataURL('image/png');
        thumb.alt = 'Tile ' + nomor;
        thumb.style.cssText = 'width:100%;height:auto;border-radius:8px;border:1px solid #ffffff20;display:block';
        cell.appendChild(thumb);
        const badge = T.el('<div>' + nomor + '</div>');
        badge.style.cssText = 'position:absolute;top:6px;left:6px;background:rgba(0,0,0,.65);color:#fff;font-size:12px;font-weight:700;border-radius:8px;padding:2px 8px';
        cell.appendChild(badge);
        cell.addEventListener('click', () => {
          c.toBlob((b) => { if (b) T.dl(nm, b, 'image/png'); }, 'image/png');
        });
        grid.appendChild(cell);
      }
    }
    T.show(box,
      '<p class="center mut">Klik tiap tile untuk download PNG-nya.</p>' +
      '<p class="center hint">Upload ke IG mulai dari nomor <b>1</b> dulu supaya puzzlenya nyambung.</p>');
    box.appendChild(grid);
  };

  fileInp.addEventListener('change', proses);
  polaSel.addEventListener('change', () => { if (fileInp.files && fileInp.files[0]) proses(); });
  root.appendChild(T.field('Pilih gambar', fileInp, 'Semua diproses lokal di HP kamu, gambar tidak diupload ke mana-mana.'));
  root.appendChild(T.field('Pola grid', polaSel, 'Selalu 3 kolom — feed IG memang 3 kolom.'));
  root.appendChild(box);
}
