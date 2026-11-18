import { h as T } from '../../core.js';

export const meta = { id: 'generator-word-search', name: 'Generator Word Search', cat: 'pelajar', icon: '🔎', desc: 'Buat teka-teki cari kata dari daftar katamu sendiri, lalu cetak atau unduh.', keywords: 'word search,cari kata,teka-teki,wordsearch,puzzle kata,cetak,belajar', since: '6.17.0' };

// Arah penempatan kata: [dx, dy, label]
const ARAH = [
  { dx: 1, dy: 0, label: 'mendatar' },
  { dx: 0, dy: 1, label: 'menurun' },
  { dx: 1, dy: 1, label: 'diagonal turun' },
  { dx: 1, dy: -1, label: 'diagonal naik' },
  { dx: -1, dy: 0, label: 'mendatar mundur' },
  { dx: 0, dy: -1, label: 'menurun mundur' },
  { dx: -1, dy: 1, label: 'diagonal turun mundur' },
  { dx: -1, dy: -1, label: 'diagonal naik mundur' },
];

function acakHuruf(rng) {
  return 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(rng() * 26)];
}

// Tempatkan kata di grid. rng bisa di-inject untuk pengujian.
// Kembalikan { grid, placed: [{word, cells: [[r,c]...]}], gagal: [word] }.
export function placeWords(words, size, arahAktif, rng) {
  const rand = rng || Math.random;
  const dirs = ARAH.filter((_, i) => arahAktif.includes(i));
  const grid = Array.from({ length: size }, () => Array(size).fill(''));
  const placed = [];
  const gagal = [];
  const urut = words.slice().sort((a, b) => b.length - a.length);
  for (const word of urut) {
    let ok = false;
    for (let coba = 0; coba < 200 && !ok; coba++) {
      const d = dirs[Math.floor(rand() * dirs.length)];
      const r0 = Math.floor(rand() * size);
      const c0 = Math.floor(rand() * size);
      const cells = [];
      let bisa = true;
      for (let i = 0; i < word.length; i++) {
        const r = r0 + d.dy * i, c = c0 + d.dx * i;
        if (r < 0 || r >= size || c < 0 || c >= size) { bisa = false; break; }
        if (grid[r][c] !== '' && grid[r][c] !== word[i]) { bisa = false; break; }
        cells.push([r, c]);
      }
      if (!bisa) continue;
      cells.forEach(([r, c], i) => { grid[r][c] = word[i]; });
      placed.push({ word, cells });
      ok = true;
    }
    if (!ok) gagal.push(word);
  }
  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++)
      if (grid[r][c] === '') grid[r][c] = acakHuruf(rand);
  return { grid, placed, gagal };
}

export function render(root) {
  const st = document.createElement('style');
  st.textContent =
    '.ws-grid{display:inline-grid;gap:2px;background:var(--deep);border:1px solid var(--line-soft);border-radius:12px;padding:10px;margin:12px 0}' +
    '.ws-cell{width:30px;height:30px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:15px;border-radius:6px;cursor:pointer;background:var(--surface);color:var(--txt);border:1px solid transparent;user-select:none}' +
    '.ws-cell.sel{background:var(--acc);color:#161311}' +
    '.ws-cell.found{background:#2e7d4f;color:#fff;border-color:#2e7d4f}' +
    '.ws-cell:active{transform:scale(.94)}' +
    '.ws-kata{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0}' +
    '.ws-tag{padding:6px 10px;border:1px solid var(--line-soft);border-radius:999px;font-size:13px;font-weight:600}' +
    '.ws-tag.done{background:#2e7d4f;color:#fff;border-color:#2e7d4f;text-decoration:line-through}' +
    '.ws-wrap{overflow-x:auto}' +
    '@media (max-width:480px){.ws-cell{width:26px;height:26px;font-size:13px}}' +
    '@media print{.ws-no-print{display:none!important}.ws-grid{break-inside:avoid}}';
  root.appendChild(st);

  root.appendChild(T.el('<p class="hint">Tulis kata-katamu, satu kata per baris. Huruf besar semua, tanpa spasi di dalam kata. Ketuk huruf di kotak untuk menandai kata yang ketemu.</p>'));

  const taKata = T.ta(6, 'Contoh:\nMATEMATIKA\nFISIKA\nKIMIA\nBIOLOGI\nSEJARAH');
  const selUkuran = T.select([['8', '8 x 8 (kecil)'], ['10', '10 x 10 (sedang)'], ['12', '12 x 12 (besar)'], ['15', '15 x 15 (besar sekali)']], '10');
  const cek = {};
  const cekWrap = T.el('<div style="display:flex;flex-wrap:wrap;gap:10px;margin:10px 0"></div>');
  [['mendatar', 0], ['menurun', 1], ['diagonal', 2], ['arah mundur', 4]].forEach(([label, idx]) => {
    const lb = document.createElement('label');
    lb.style.cssText = 'font-size:14px;display:flex;gap:6px;align-items:center;cursor:pointer';
    const cb = document.createElement('input');
    cb.type = 'checkbox'; cb.checked = true;
    cek[idx] = cb;
    lb.append(cb, document.createTextNode(' ' + label));
    cekWrap.appendChild(lb);
  });

  const box = T.out();
  const gridWrap = T.el('<div class="ws-wrap"></div>');
  const kataWrap = T.el('<div></div>');
  const aksiWrap = T.el('<div class="row ws-no-print" style="flex-wrap:wrap"></div>');

  let state = null; // { grid, placed, size, found:Set, selected:[] }
  let cellEls = [];

  function bersihKata(s) {
    return String(s || '').toUpperCase().replace(/[^A-Z]/g, '');
  }

  function buat() {
    const kata = taKata.value.split(/\n/).map(bersihKata).filter((w) => w.length >= 2);
    const unik = [...new Set(kata)];
    if (unik.length === 0) { T.toast('Tulis minimal satu kata dulu, ya'); return; }
    const size = parseInt(selUkuran.value, 10);
    const panjang = unik.filter((w) => w.length > size);
    if (panjang.length) { T.toast('Kata "' + panjang[0] + '" kepanjangan buat kotak ini. Pilih kotak yang lebih besar.'); return; }
    const arah = [];
    if (cek[0].checked) arah.push(0);
    if (cek[1].checked) arah.push(1);
    if (cek[2].checked) arah.push(2, 3);
    if (cek[4].checked) arah.push(4, 5, 6, 7);
    if (!arah.length) { T.toast('Pilih minimal satu arah kata'); return; }
    const hasil = placeWords(unik, size, arah);
    state = { grid: hasil.grid, placed: hasil.placed, size, found: new Set(), selected: [] };
    gambar();
    let info = '';
    if (hasil.gagal.length) info = '<p class="hint">Kata ini tidak muat ditaruh: ' + hasil.gagal.map(T.esc).join(', ') + '. Coba kotak lebih besar atau kurangi katanya.</p>';
    T.show(box, '<p style="font-weight:700;margin:0 0 4px">Kotakmu sudah jadi. ' + hasil.placed.length + ' kata tersembunyi di dalamnya.</p>' + info);
    box.appendChild(gridWrap);
    box.appendChild(kataWrap);
    box.appendChild(aksiWrap);
    gambarKata();
  }

  function gambar() {
    gridWrap.innerHTML = '';
    cellEls = [];
    const g = T.el('<div class="ws-grid"></div>');
    g.style.gridTemplateColumns = 'repeat(' + state.size + ', auto)';
    g.setAttribute('role', 'grid');
    g.setAttribute('aria-label', 'Kotak teka-teki cari kata');
    for (let r = 0; r < state.size; r++) {
      cellEls[r] = [];
      for (let c = 0; c < state.size; c++) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'ws-cell';
        b.textContent = state.grid[r][c];
        b.setAttribute('aria-label', 'Huruf ' + state.grid[r][c] + ' baris ' + (r + 1) + ' kolom ' + (c + 1));
        b.addEventListener('click', () => ketuk(r, c));
        cellEls[r][c] = b;
        g.appendChild(b);
      }
    }
    gridWrap.appendChild(g);
    aksiWrap.innerHTML = '';
    aksiWrap.appendChild(T.btn('Cetak', () => window.print()));
    aksiWrap.appendChild(T.btn('Unduh sebagai teks', () => {
      const baris = state.grid.map((row) => row.join(' ')).join('\n');
      const daftar = state.placed.map((p) => p.word).join('\n');
      T.dl('word-search.txt', baris + '\n\nCari kata ini:\n' + daftar, 'text/plain;charset=utf-8');
    }));
    aksiWrap.appendChild(T.btn('Acak ulang huruf pengisi', () => {
      const kata = state.placed.map((p) => p.word);
      const arah = [];
      if (cek[0].checked) arah.push(0);
      if (cek[1].checked) arah.push(1);
      if (cek[2].checked) arah.push(2, 3);
      if (cek[4].checked) arah.push(4, 5, 6, 7);
      const hasil = placeWords(kata, state.size, arah.length ? arah : [0, 1, 2, 3, 4, 5, 6, 7]);
      state = { grid: hasil.grid, placed: hasil.placed, size: state.size, found: new Set(), selected: [] };
      gambar();
      gambarKata();
    }));
  }

  function gambarKata() {
    kataWrap.innerHTML = '';
    const w = T.el('<div class="ws-kata"></div>');
    state.placed.forEach((p) => {
      const t = T.el('<span class="ws-tag' + (state.found.has(p.word) ? ' done' : '') + '">' + T.esc(p.word) + '</span>');
      w.appendChild(t);
    });
    kataWrap.appendChild(T.el('<p style="font-weight:700;margin:12px 0 4px">Kata yang dicari (' + state.found.size + ' dari ' + state.placed.length + ' ketemu):</p>'));
    kataWrap.appendChild(w);
  }

  function ketuk(r, c) {
    const key = r + ',' + c;
    const i = state.selected.findIndex(([sr, sc]) => sr === r && sc === c);
    if (i >= 0) { state.selected.splice(i, 1); }
    else state.selected.push([r, c]);
    // Tandai pilihan
    cellEls.forEach((row) => row.forEach((el) => el.classList.remove('sel')));
    state.selected.forEach(([sr, sc]) => cellEls[sr][sc].classList.add('sel'));
    // Cek kata dari huruf yang dipilih (berurutan sesuai urutan ketuk)
    const kata = state.selected.map(([sr, sc]) => state.grid[sr][sc]).join('');
    const balik = kata.split('').reverse().join('');
    const cocok = state.placed.find((p) => (p.word === kata || p.word === balik) && !state.found.has(p.word));
    if (cocok) {
      state.found.add(cocok.word);
      cocok.cells.forEach(([sr, sc]) => { cellEls[sr][sc].classList.add('found'); cellEls[sr][sc].classList.remove('sel'); });
      state.selected = [];
      T.toast('Ketemu: ' + cocok.word + '!');
      gambarKata();
      if (state.found.size === state.placed.length) T.toast('Semua kata ketemu. Hebat!');
    }
  }

  root.append(
    T.field('Daftar kata', taKata, 'Satu kata per baris, minimal 2 huruf. Kata yang sama hanya dipakai sekali.'),
    T.field('Ukuran kotak', selUkuran),
    T.el('<div style="font-size:13px;font-weight:600;margin:8px 0 2px">Arah kata</div>'),
    cekWrap,
    T.btn('Buat teka-teki', buat, true),
    box,
  );
}
