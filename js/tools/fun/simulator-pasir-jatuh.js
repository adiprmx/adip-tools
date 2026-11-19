import { h as T, onLeave } from '../../core.js';

export const meta = {"id": "simulator-pasir-jatuh", "name": "Simulator Pasir Jatuh", "cat": "fun", "icon": "⏳", "desc": "Jatuhkan pasir, air, dan batu ke kotak lalu lihat mereka jatuh dan menumpuk seperti aslinya.", "keywords": "pasir jatuh,falling sand,simulator pasir,seluler,otomaton,air,batu,mainan", "since": "6.19.0"};

export const KOSONG = 0;
export const PASIR = 1;
export const AIR = 2;
export const BATU = 3;

export const LEBAR = 120;
export const TINGGI = 80;

// Satu langkah simulasi. Grid dibaca dari bawah ke atas supaya butir yang
// jatuh tidak diproses dua kali dalam satu langkah. rand disuntik supaya
// arah jatuh diagonal bisa diuji deterministik.
export function langkahPasir(grid, lebar, tinggi, rand) {
  const r = rand || Math.random;
  const baru = new Uint8Array(grid);
  const idx = (x, y) => y * lebar + x;
  for (let y = tinggi - 1; y >= 0; y--) {
    for (let x = 0; x < lebar; x++) {
      const i = idx(x, y);
      const sel = baru[i];
      if (sel === KOSONG || sel === BATU) continue;
      const bawah = y + 1 < tinggi ? idx(x, y + 1) : -1;
      const pindahKe = (j) => { baru[j] = sel; baru[i] = KOSONG; };
      if (sel === PASIR) {
        if (bawah >= 0 && baru[bawah] === KOSONG) { pindahKe(bawah); continue; }
        if (bawah >= 0 && baru[bawah] === AIR) { baru[bawah] = PASIR; baru[i] = AIR; continue; }
        const arah = r() < 0.5 ? -1 : 1;
        for (const dx of [arah, -arah]) {
          const nx = x + dx;
          if (nx < 0 || nx >= lebar || y + 1 >= tinggi) continue;
          const j = idx(nx, y + 1);
          if (baru[j] === KOSONG) { pindahKe(j); break; }
          if (baru[j] === AIR) { baru[j] = PASIR; baru[i] = AIR; break; }
        }
      } else if (sel === AIR) {
        if (bawah >= 0 && baru[bawah] === KOSONG) { pindahKe(bawah); continue; }
        const arah = r() < 0.5 ? -1 : 1;
        for (const dx of [arah, -arah]) {
          const nx = x + dx;
          if (nx < 0 || nx >= lebar || y + 1 >= tinggi) continue;
          const j = idx(nx, y + 1);
          if (baru[j] === KOSONG) { pindahKe(j); break; }
        }
        if (baru[i] !== KOSONG) {
          for (const dx of [arah, -arah]) {
            const nx = x + dx;
            if (nx < 0 || nx >= lebar) continue;
            const j = idx(nx, y);
            if (baru[j] === KOSONG) { pindahKe(j); break; }
          }
        }
      }
    }
  }
  return baru;
}

export function hitungMaterial(grid) {
  let pasir = 0, air = 0, batu = 0;
  for (const v of grid) {
    if (v === PASIR) pasir++;
    else if (v === AIR) air++;
    else if (v === BATU) batu++;
  }
  return { pasir, air, batu };
}

export function render(root) {
  const st = document.createElement('style');
  st.textContent = '.pj-kanvas{width:100%;height:auto;display:block;background:#0d0b09;border:1px solid rgba(255,255,255,.12);border-radius:12px;margin:12px 0;touch-action:none;cursor:crosshair}';
  root.appendChild(st);

  const kanvas = document.createElement('canvas');
  kanvas.className = 'pj-kanvas';
  kanvas.width = LEBAR * 5;
  kanvas.height = TINGGI * 5;
  kanvas.setAttribute('role', 'img');
  kanvas.setAttribute('aria-label', 'Kotak pasir jatuh');
  const ctx = kanvas.getContext('2d');
  const WARNA = { [PASIR]: '#eab308', [AIR]: '#38bdf8', [BATU]: '#a1a1aa' };

  const bahanSel = T.select([['1', 'Pasir'], ['2', 'Air'], ['3', 'Batu']], '1');
  const ukuranSel = T.select([['1', 'Kuas kecil'], ['3', 'Kuas sedang'], ['5', 'Kuas besar']], '3');
  const box = T.out();
  let grid = new Uint8Array(LEBAR * TINGGI);
  let animId = null;
  let jeda = false;
  let menggambar = false;

  function gambarKanvas() {
    ctx.fillStyle = '#0d0b09';
    ctx.fillRect(0, 0, kanvas.width, kanvas.height);
    for (let y = 0; y < TINGGI; y++) {
      for (let x = 0; x < LEBAR; x++) {
        const v = grid[y * LEBAR + x];
        if (v === KOSONG) continue;
        ctx.fillStyle = WARNA[v];
        ctx.fillRect(x * 5, y * 5, 5, 5);
      }
    }
  }

  function putar() {
    if (!jeda) {
      grid = langkahPasir(grid, LEBAR, TINGGI, Math.random);
      gambarKanvas();
    }
    animId = requestAnimationFrame(putar);
  }

  function taruh(e) {
    const rect = kanvas.getBoundingClientRect();
    const cx = Math.floor(((e.clientX - rect.left) / rect.width) * LEBAR);
    const cy = Math.floor(((e.clientY - rect.top) / rect.height) * TINGGI);
    const bahan = parseInt(bahanSel.value, 10);
    const jari = parseInt(ukuranSel.value, 10);
    for (let dy = -jari; dy <= jari; dy++) {
      for (let dx = -jari; dx <= jari; dx++) {
        if (dx * dx + dy * dy > jari * jari) continue;
        const x = cx + dx, y = cy + dy;
        if (x < 0 || x >= LEBAR || y < 0 || y >= TINGGI) continue;
        grid[y * LEBAR + x] = bahan;
      }
    }
    gambarKanvas();
  }

  kanvas.addEventListener('pointerdown', (e) => { menggambar = true; kanvas.setPointerCapture(e.pointerId); taruh(e); });
  kanvas.addEventListener('pointermove', (e) => { if (menggambar) taruh(e); });
  kanvas.addEventListener('pointerup', () => { menggambar = false; });
  kanvas.addEventListener('pointercancel', () => { menggambar = false; });

  const jedaBtn = T.btn('Jeda', () => {
    jeda = !jeda;
    jedaBtn.textContent = jeda ? 'Lanjutkan' : 'Jeda';
    if (jeda) {
      const h = hitungMaterial(grid);
      T.show(box, '<p class="hint">Dijeda. Isi kotak: ' + T.fmt(h.pasir) + ' butir pasir, ' + T.fmt(h.air) + ' tetes air, ' + T.fmt(h.batu) + ' batu.</p>');
    } else {
      T.show(box, '<p class="hint">Simulasi berjalan.</p>');
    }
  });
  const hapusBtn = T.btn('Kosongkan kotak', () => {
    grid = new Uint8Array(LEBAR * TINGGI);
    gambarKanvas();
    T.show(box, '<p class="hint">Kotak sudah kosong.</p>');
  });
  onLeave(() => { if (animId) cancelAnimationFrame(animId); });

  root.appendChild(T.el('<p class="hint">Ketuk atau seret di kotak untuk menjatuhkan bahan. Pasir jatuh lurus lalu menumpuk miring, air mengalir ke samping, batu diam di tempat.</p>'));
  root.appendChild(T.field('Bahan', bahanSel));
  root.appendChild(T.field('Ukuran kuas', ukuranSel));
  root.appendChild(kanvas);
  root.appendChild(T.row(jedaBtn, hapusBtn));
  root.appendChild(box);
  gambarKanvas();
  T.show(box, '<p class="hint">Simulasi berjalan. Mulai jatuhkan bahan di kotak.</p>');
  animId = requestAnimationFrame(putar);
}
