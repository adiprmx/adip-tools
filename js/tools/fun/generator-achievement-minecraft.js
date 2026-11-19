import { h as T, utils } from '../../core.js';

export const meta = {"id": "generator-achievement-minecraft", "name": "Generator Achievement Minecraft", "cat": "fun", "icon": "⛏️", "desc": "Buat pop-up advancement ala Minecraft: judul, deskripsi, dan ikon pixel pilihanmu, lalu unduh sebagai PNG.", "keywords": "minecraft,achievement,advancement,pop-up,pixel,game,png", "since": "6.19.0"};

/* Ikon pixel 8x8, digambar sendiri dari kotak warna (bukan aset game).
   '.' = transparan. */
export const IKON_MINECRAFT = {
  rumput: {
    nama: 'Blok Rumput',
    palet: { g: '#5fae3f', G: '#3e7d26', c: '#8a5a2b', C: '#6b4423' },
    grid: [
      'gggggggg', 'gggggggg', 'GGGGGGGG', 'cCcCcCcC',
      'CcCcCcCc', 'cCcCcCcC', 'CcCcCcCc', 'cCcCcCcC',
    ],
  },
  pedang: {
    nama: 'Pedang Diamond',
    palet: { d: '#5ff2e4', D: '#2fb5a8', k: '#8a5a2b', s: '#d8d8d8' },
    grid: [
      '.......d', '......dd', '.....ddD', '....ddD.',
      'k..ddD..', 'kk.ddD..', '.kkdD...', '..ks....',
    ],
  },
  creeper: {
    nama: 'Creeper',
    palet: { h: '#4caf2c', H: '#357a1e', m: '#111111' },
    grid: [
      'hhhhhhhh', 'hHhhhhHh', 'hmmhhmmh', 'hmmhhmmh',
      'hhhmmhhh', 'hhmmmmhh', 'hhmmmmhh', 'hhmmmmhh',
    ],
  },
  tnt: {
    nama: 'TNT',
    palet: { r: '#c0392b', R: '#922b21', w: '#f5f5f5', m: '#111111' },
    grid: [
      'rrrrrrrr', 'wwwwwwww', 'wmmwwmmw', 'wmmwwmmw',
      'wwwwwwww', 'rrrrrrrr', 'RRRRRRRR', 'rrrrrrrr',
    ],
  },
  hati: {
    nama: 'Hati',
    palet: { r: '#e53935', R: '#b71c1c', w: '#ffffff' },
    grid: [
      '.rr..rr.', 'rrrrrrrr', 'rwrrrrrr', 'rrrrrrrr',
      '.rrrrrr.', '..rrrr..', '...rr...', '....r...',
    ],
  },
  bintang: {
    nama: 'Bintang Nether',
    palet: { p: '#e8e8e8', P: '#9e9e9e', b: '#4fc3f7' },
    grid: [
      '...pp...', '...pp...', '.pppppp.', 'ppppbppp',
      '.pppppp.', '...pp...', '...pp...', '..p..p..',
    ],
  },
};

export function gambarIkonPixel(x, ikon, px, py, ukuran) {
  const s = ukuran / 8;
  ikon.grid.forEach((baris, gy) => {
    for (let gx = 0; gx < 8; gx++) {
      const c = baris[gx];
      if (c === '.') continue;
      x.fillStyle = ikon.palet[c] || '#fff';
      x.fillRect(px + gx * s, py + gy * s, Math.ceil(s), Math.ceil(s));
    }
  });
}

export function render(root) {
  const box = T.out();
  const judulI = T.input('text', 'cth: Raja Begadang', 'Raja Begadang');
  const descI = T.input('text', 'cth: Main sampai jam 3 pagi', 'Main sampai jam 3 pagi tanpa sadar waktu');
  const ikonI = T.select(Object.entries(IKON_MINECRAFT).map(([k, v]) => [k, v.nama]), 'rumput');
  const jenisI = T.select([['advancement', 'Advancement Made!'], ['challenge', 'Challenge Complete!'], ['goal', 'Goal Reached!']], 'advancement');
  const canvas = document.createElement('canvas');
  canvas.width = 640; canvas.height = 160;
  canvas.style.cssText = 'width:100%;max-width:640px;height:auto;border-radius:8px;display:block;margin:0 auto';


  const gambar = () => {
    const x = canvas.getContext('2d');
    x.fillStyle = '#212121'; x.fillRect(0, 0, 640, 160);
    x.strokeStyle = '#ffff54'; x.lineWidth = 4; x.strokeRect(4, 4, 632, 152);
    x.fillStyle = '#2b2b2b'; x.fillRect(16, 16, 128, 128);
    x.strokeStyle = '#000'; x.lineWidth = 2; x.strokeRect(16, 16, 128, 128);
    gambarIkonPixel(x, IKON_MINECRAFT[ikonI.value] || IKON_MINECRAFT.rumput, 40, 40, 80);
    const kicker = jenisI.value === 'challenge' ? 'Challenge Complete!' : jenisI.value === 'goal' ? 'Goal Reached!' : 'Advancement Made!';
    x.textAlign = 'left'; x.textBaseline = 'top';
    x.fillStyle = '#ffff54'; x.font = '700 26px monospace';
    x.fillText(kicker, 168, 24);
    x.fillStyle = '#fff'; x.font = '700 30px monospace';
    const judul = (judulI.value.trim() || 'Achievement').slice(0, 40);
    const barisJudul = utils.bungkusKata(x, judul, 440);
    barisJudul.forEach((b, i) => x.fillText(b, 168, 58 + i * 34));
    x.fillStyle = '#c9c9c9'; x.font = '400 22px monospace';
    const desc = descI.value.trim().slice(0, 80);
    const barisDesc = utils.bungkusKata(x, desc, 440);
    const yDesc = 58 + barisJudul.length * 34 + 4;
    barisDesc.forEach((b, i) => x.fillText(b, 168, yDesc + i * 26));
  };

  const unduh = () => {
    canvas.toBlob((b) => { if (b) T.dl('minecraft-achievement.png', b, 'image/png'); else T.toast('Gagal membuat PNG.'); }, 'image/png');
  };

  [judulI, descI, ikonI, jenisI].forEach((el) => {
    el.addEventListener('input', gambar);
    el.addEventListener('change', gambar);
  });

  root.appendChild(T.el('<p class="hint">Tulis judul dan deskripsi pencapaianmu, pilih ikon pixel, lalu unduh gambarnya. Cocok buat prank teman atau hiasan grup game.</p>'));
  root.appendChild(T.field('Jenis pop-up', jenisI));
  root.appendChild(T.field('Judul achievement', judulI));
  root.appendChild(T.field('Deskripsi', descI));
  root.appendChild(T.field('Ikon pixel', ikonI));
  root.appendChild(T.row(T.btn('⬇️ Unduh PNG', unduh, true)));
  root.appendChild(box);
  box.appendChild(canvas);
  gambar();
}
