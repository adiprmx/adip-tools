import { h as T, utils } from '../../core.js';

export const meta = { id: 'generator-bola-minecraft', name: 'Generator Bola Minecraft', cat: 'fun', icon: '⚽', desc: 'Rencanakan bola atau ellipsoid Minecraft lapis per lapis, dengan tampilan 3D dan hitungan blok.', keywords: 'minecraft,bola,sphere,ellipsoid,lapis,blok,bangunan,3d', since: '6.17.0' };

// Lingkaran terisi pada satu lapis: set "x,y" relatif ke pusat.
// isiLingkaran kanonis tinggal di utils (core.js).

// Bola/ellipsoid: diameter dx, dy (tinggi), dz.
// Kembalikan array lapis dari bawah ke atas: [{ lapis, sel, jumlah }].
export function bangunBola(dx, dy, dz, isi) {
  const rx = (dx - 1) / 2, ry = (dy - 1) / 2, rz = (dz - 1) / 2;
  const lapis = [];
  for (let ly = -(dy - 1) / 2; ly <= (dy - 1) / 2 + 1e-9; ly += 1) {
    const t = ly / (ry + 0.5);
    const sisa = 1 - t * t;
    if (sisa < 0) continue;
    const f = Math.sqrt(sisa);
    const sel = utils.isiLingkaran(Math.min(rx, rz) * f + Math.max(0, Math.min(rx, rz) - Math.min(rx, rz)));
    // Ellipsoid umum: skala x dan z terpisah.
    const selE = new Set();
    const mx = Math.ceil(rx), mz = Math.ceil(rz);
    for (let z = -mz; z <= mz; z++) {
      for (let x = -mx; x <= mx; x++) {
        const nx = (x + 0.5) / (rx + 0.5), nz = (z + 0.5) / (rz + 0.5);
        if (nx * nx / (f * f) + nz * nz / (f * f) <= 1) selE.add(x + ',' + z);
      }
    }
    let pakai = selE;
    if (!isi) {
      // Kulit saja: blok yang punya tetangga di luar ellipsoid 3D.
      // Pendekatan lapis: tepi lingkaran lapis ini + lapis atas/bawah bila ada.
      const tepi = new Set();
      selE.forEach((k) => {
        const [x, z] = k.split(',').map(Number);
        if (!selE.has((x + 1) + ',' + z) || !selE.has((x - 1) + ',' + z) || !selE.has(x + ',' + (z + 1)) || !selE.has(x + ',' + (z - 1))) tepi.add(k);
      });
      pakai = tepi;
    }
    if (pakai.size) lapis.push({ lapis: lapis.length + 1, sel: pakai, jumlah: pakai.size });
    void sel;
  }
  return lapis;
}

export function render(root) {
  const st = document.createElement('style');
  st.textContent =
    '.mb-kanvas{width:100%;height:auto;display:block;background:#1e1a17;border:1px solid rgba(255,255,255,.12);border-radius:12px;margin:12px 0}' +
    '.mb-lapis{font-family:var(--font-m);font-size:12px;line-height:1.4;background:#1e1a17;border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:12px;overflow-x:auto;white-space:pre;margin:8px 0}' +
    '.mb-nav{display:flex;gap:8px;align-items:center;margin:10px 0;flex-wrap:wrap}';
  root.appendChild(st);

  root.appendChild(T.el('<p class="hint">Tulis diameter bolanya, nanti muncul gambar 3D dan pola tiap lapis dari bawah ke atas. Tiap kotak sama dengan satu blok.</p>'));

  const dxI = T.input('number', 'mis. 11', '11');
  const dyI = T.input('number', 'mis. 11', '11');
  const dzI = T.input('number', 'mis. 11', '11');
  const mode = T.select([['kulit', 'Kulit saja (berongga)'], ['isi', 'Terisi penuh (padat)']], 'kulit');
  const samakan = T.el('<p class="hint">Tip: samakan ketiga diameter untuk bola sempurna. Beda diameter jadinya ellipsoid (lonjong).</p>');

  const kanvas = document.createElement('canvas');
  kanvas.className = 'mb-kanvas';
  kanvas.width = 640;
  kanvas.height = 420;
  const box = T.out();
  const nav = T.el('<div class="mb-nav"></div>');
  const lapisEl = T.el('<div class="mb-lapis"></div>');

  let lapis = [];
  let aktif = 0;

  function gambar3D() {
    const ctx = kanvas.getContext('2d');
    const W = kanvas.width, H = kanvas.height;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#1e1a17';
    ctx.fillRect(0, 0, W, H);
    if (!lapis.length) return;
    const cx = W / 2, cy = H / 2 + 10;
    const n = lapis.length;
    // Gambar dari lapis atas ke bawah (painter's algorithm), tiap lapis jadi elips.
    const maxR = Math.min(W, H) * 0.36;
    const rLapis = lapis.map((l) => {
      let mx = 0;
      l.sel.forEach((k) => { const [x] = k.split(',').map(Number); mx = Math.max(mx, Math.abs(x)); });
      return mx;
    });
    const rMax = Math.max(...rLapis, 1);
    const tinggiTotal = n * 10;
    for (let i = n - 1; i >= 0; i--) {
      const r = rLapis[i] / rMax * maxR;
      const y = cy + (i - n / 2) * 10 + (n * 5 - tinggiTotal / 2) * 0 + (i * 8) - (n * 4);
      const terang = 0.45 + 0.55 * (i / Math.max(1, n - 1));
      ctx.fillStyle = 'rgba(255,111,97,' + (0.35 + 0.5 * terang).toFixed(2) + ')';
      ctx.strokeStyle = '#ff6f61';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(cx, cy + (i - (n - 1) / 2) * 9, Math.max(2, r), Math.max(1.5, r * 0.42), 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.fillStyle = '#e8ded0';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Tampilan 3D (sketsa): ' + n + ' lapis', cx, H - 12);
  }

  function gambarLapis() {
    if (!lapis.length) { lapisEl.textContent = ''; nav.innerHTML = ''; return; }
    const l = lapis[aktif];
    let minX = 1e9, maxX = -1e9, minZ = 1e9, maxZ = -1e9;
    l.sel.forEach((k) => {
      const [x, z] = k.split(',').map(Number);
      minX = Math.min(minX, x); maxX = Math.max(maxX, x);
      minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
    });
    let teks = 'Lapis ' + l.lapis + ' dari ' + lapis.length + ' (' + l.jumlah + ' blok)\n';
    for (let z = minZ; z <= maxZ; z++) {
      let row = '';
      for (let x = minX; x <= maxX; x++) row += l.sel.has(x + ',' + z) ? '██' : '··';
      teks += row + '\n';
    }
    lapisEl.textContent = teks;
    nav.innerHTML = '';
    const info = T.el('<span style="font-weight:700">Lapis ' + (aktif + 1) + ' / ' + lapis.length + '</span>');
    const btnPrev = T.btn('◀ Lapis bawah', () => { if (aktif > 0) { aktif--; gambarLapis(); } });
    const btnNext = T.btn('Lapis atas ▶', () => { if (aktif < lapis.length - 1) { aktif++; gambarLapis(); } });
    btnPrev.disabled = aktif === 0;
    btnNext.disabled = aktif === lapis.length - 1;
    nav.append(btnPrev, info, btnNext);
  }

  function buat() {
    const dx = T.num(dxI.value), dy = T.num(dyI.value), dz = T.num(dzI.value);
    for (const [v, nama] of [[dx, 'diameter lebar'], [dy, 'diameter tinggi'], [dz, 'diameter dalam']]) {
      if (!Number.isInteger(v) || v < 3 || v > 61) { T.toast(nama + ' harus bilangan bulat 3 sampai 61'); return; }
    }
    lapis = bangunBola(dx, dy, dz, mode.value === 'isi');
    aktif = 0;
    const total = lapis.reduce((a, l) => a + l.jumlah, 0);
    T.show(box,
      '<p class="big">' + T.fmt(total) + ' blok total</p>' +
      '<p>' + lapis.length + ' lapis, ukuran ' + dx + ' × ' + dy + ' × ' + dz + ' blok (' + (mode.value === 'isi' ? 'terisi penuh' : 'kulit saja, berongga') + '). Lapis paling lebar: ' + T.fmt(Math.max(...lapis.map((l) => l.jumlah))) + ' blok.</p>');
    gambar3D();
    gambarLapis();
  }

  root.append(
    T.grid2(T.field('Diameter lebar (blok)', dxI), T.field('Diameter tinggi (blok)', dyI)),
    T.grid2(T.field('Diameter dalam (blok)', dzI), T.field('Isi bola', mode)),
    samakan,
    T.btn('Buat bola', buat, true),
    kanvas,
    box,
    nav,
    lapisEl,
  );
  buat();
}
