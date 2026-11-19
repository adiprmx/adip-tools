import { h as T, utils } from '../../core.js';

export const meta = {"id": "game-of-life", "name": "Game of Life", "cat": "pelajar", "icon": "🧬", "desc": "Simulasi sel hidup Conway: sel lahir bila punya 3 tetangga, bertahan bila punya 2–3 tetangga.", "keywords": "game of life,conway,seluler,simulasi,sel,otomata,matematika", "since": "6.19.0"};

// Satu generasi berikutnya (aturan B3/S23, tepi mati: sel di luar grid
// dianggap mati). grid: Uint8Array panjang cols*rows.
export function langkahHidup(grid, cols, rows) {
  const out = new Uint8Array(cols * rows);
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      let tetangga = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue;
          const nx = x + dx, ny = y + dy;
          if (nx >= 0 && nx < cols && ny >= 0 && ny < rows) tetangga += grid[ny * cols + nx];
        }
      }
      const i = y * cols + x;
      out[i] = grid[i] ? (tetangga === 2 || tetangga === 3 ? 1 : 0) : (tetangga === 3 ? 1 : 0);
    }
  }
  return out;
}

export const POLA = {
  acak: null,
  glider: [[1, 0], [2, 1], [0, 2], [1, 2], [2, 2]],
  blinker: [[0, 0], [1, 0], [2, 0]],
  blok: [[0, 0], [1, 0], [0, 1], [1, 1]],
  pulsar: [[2, 0], [3, 0], [4, 0], [8, 0], [9, 0], [10, 0], [0, 2], [5, 2], [7, 2], [12, 2], [0, 3], [5, 3], [7, 3], [12, 3], [0, 4], [5, 4], [7, 4], [12, 4], [2, 5], [3, 5], [4, 5], [8, 5], [9, 5], [10, 5], [2, 7], [3, 7], [4, 7], [8, 7], [9, 7], [10, 7], [0, 8], [5, 8], [7, 8], [12, 8], [0, 9], [5, 9], [7, 9], [12, 9], [0, 10], [5, 10], [7, 10], [12, 10], [2, 12], [3, 12], [4, 12], [8, 12], [9, 12], [10, 12]],
  gun: [[24, 0], [22, 1], [24, 1], [12, 2], [13, 2], [20, 2], [21, 2], [22, 2], [23, 2], [11, 3], [15, 3], [20, 3], [21, 3], [22, 3], [23, 3], [10, 4], [16, 4], [20, 4], [21, 4], [0, 5], [1, 5], [10, 5], [11, 5], [16, 5], [17, 5], [0, 6], [1, 6], [10, 6], [16, 6], [11, 7], [15, 7], [12, 8], [13, 8], [22, 9], [24, 9], [24, 10]],
};

export function render(root) {
  const COLS = 45, ROWS = 30, SEL = 8;
  let grid = new Uint8Array(COLS * ROWS);
  let jalan = false;
  let generasi = 0;
  let raf = null;
  let terakhir = 0;
  let jeda = 120; // ms per generasi

  const canvas = document.createElement('canvas');
  canvas.width = COLS * SEL;
  canvas.height = ROWS * SEL;
  canvas.style.cssText = 'width:100%;max-width:360px;height:auto;display:block;background:#12100d;border:1px solid #2e2823;border-radius:8px;touch-action:none;cursor:crosshair';
  const ctx = canvas.getContext('2d');
  const stat = T.out();
  const polaI = T.select([['glider', 'Glider (pesawat layang)'], ['blinker', 'Blinker (berkedip)'], ['pulsar', 'Pulsar (berdenyut)'], ['gun', 'Glider Gun (pabrik glider)'], ['blok', 'Blok (diam)'], ['acak', 'Acak']], 'glider');
  const cepatI = T.select([['300', 'Lambat'], ['120', 'Sedang'], ['60', 'Cepat'], ['30', 'Sangat cepat']], '120');

  const gambar = () => {
    ctx.fillStyle = '#12100d';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#f5f0e6';
    let hidup = 0;
    for (let i = 0; i < grid.length; i++) {
      if (!grid[i]) continue;
      hidup++;
      const x = (i % COLS) * SEL, y = Math.floor(i / COLS) * SEL;
      ctx.fillRect(x + 1, y + 1, SEL - 2, SEL - 2);
    }
    T.show(stat, '<p class="dim">Generasi ' + generasi + ' · ' + hidup + ' sel hidup · Ketuk kanvas untuk menyalakan/mematikan sel.</p>');
  };

  const putar = (t) => {
    if (!jalan) return;
    if (t - terakhir >= jeda) {
      grid = langkahHidup(grid, COLS, ROWS);
      generasi++;
      gambar();
      terakhir = t;
    }
    raf = requestAnimationFrame(putar);
  };

  const mulai = () => {
    if (jalan) return;
    jalan = true;
    tombolJalan.textContent = 'Jeda';
    terakhir = performance.now();
    raf = requestAnimationFrame(putar);
  };
  const berhenti = () => {
    jalan = false;
    tombolJalan.textContent = 'Jalan';
    if (raf) cancelAnimationFrame(raf);
    raf = null;
  };
  T.onLeave(() => { berhenti(); });

  const pasangPola = (nama) => {
    grid = new Uint8Array(COLS * ROWS);
    generasi = 0;
    if (nama === 'acak') {
      for (let i = 0; i < grid.length; i++) grid[i] = Math.random() < 0.22 ? 1 : 0;
    } else {
      const pola = POLA[nama] || [];
      const ox = Math.floor((COLS - 14) / 2), oy = Math.floor((ROWS - 11) / 2);
      pola.forEach(([dx, dy]) => {
        const x = ox + dx, y = oy + dy;
        if (x >= 0 && x < COLS && y >= 0 && y < ROWS) grid[y * COLS + x] = 1;
      });
    }
    gambar();
  };

  const tombolJalan = T.btn('Jalan', () => { jalan ? berhenti() : mulai(); }, true);
  const tombolLangkah = T.btn('1 langkah', () => {
    berhenti();
    grid = langkahHidup(grid, COLS, ROWS);
    generasi++;
    gambar();
  });
  const tombolBersih = T.btn('Bersihkan', () => {
    berhenti();
    grid = new Uint8Array(COLS * ROWS);
    generasi = 0;
    gambar();
  });

  let menggambar = false;
  let nilaiGambar = 1;
  const selDariEvent = (e) => {
    const r = canvas.getBoundingClientRect();
    const cx = (e.clientX - r.left) * (canvas.width / r.width);
    const cy = (e.clientY - r.top) * (canvas.height / r.height);
    return [Math.floor(cx / SEL), Math.floor(cy / SEL)];
  };
  const coret = (e) => {
    const [x, y] = selDariEvent(e);
    if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return;
    grid[y * COLS + x] = nilaiGambar;
    gambar();
  };
  canvas.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    const [x, y] = selDariEvent(e);
    if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return;
    nilaiGambar = grid[y * COLS + x] ? 0 : 1;
    menggambar = true;
    coret(e);
  });
  canvas.addEventListener('pointermove', (e) => { if (menggambar) coret(e); });
  canvas.addEventListener('pointerup', () => { menggambar = false; });
  canvas.addEventListener('pointerleave', () => { menggambar = false; });

  polaI.addEventListener('change', () => pasangPola(polaI.value));
  cepatI.addEventListener('change', () => { jeda = Number(cepatI.value); });

  root.appendChild(T.el('<p class="note">Aturannya sederhana: sel hidup bertahan bila punya 2 atau 3 tetangga, sel mati lahir bila punya tepat 3 tetangga. Dari aturan itu muncul pola yang bergerak, berdenyut, sampai bikin glider baru.</p>'));
  root.appendChild(T.grid2(T.field('Pola awal', polaI), T.field('Kecepatan', cepatI)));
  root.appendChild(canvas);
  root.appendChild(T.row(tombolJalan, tombolLangkah, tombolBersih));
  root.appendChild(stat);
  pasangPola('glider');
}
