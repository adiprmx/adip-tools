import { h as T } from '../../core.js';

export const meta = { id: 'generator-kubah-minecraft', name: 'Generator Kubah Minecraft', cat: 'fun', icon: '🕌', desc: 'Rencanakan kubah, menara bundar, atau atap kerucut Minecraft lapis per lapis, dengan tampilan 3D.', keywords: 'minecraft,kubah,dome,menara,kerucut,atap,blok,bangunan,lapis', since: '6.17.0' };

// Lingkaran terisi radius r (blok).
export function isiLingkaran(r) {
  const sel = new Set();
  const m = Math.ceil(r);
  for (let y = -m; y <= m; y++) {
    for (let x = -m; x <= m; x++) {
      const nx = (x + 0.5) / (r + 0.5), ny = (y + 0.5) / (r + 0.5);
      if (nx * nx + ny * ny <= 1) sel.add(x + ',' + y);
    }
  }
  return sel;
}

export function tepiDariIsi(sel) {
  const tepi = new Set();
  sel.forEach((k) => {
    const [x, y] = k.split(',').map(Number);
    if (!sel.has((x + 1) + ',' + y) || !sel.has((x - 1) + ',' + y) || !sel.has(x + ',' + (y + 1)) || !sel.has(x + ',' + (y - 1))) tepi.add(k);
  });
  return tepi;
}

// Kubah setengah bola: lapis dari bawah (radius penuh) ke atas (mengecil).
// diameter = lebar dasar. Kembalikan array lapis [{ lapis, sel, jumlah }].
export function bangunKubah(diameter, isi) {
  const R = (diameter - 1) / 2;
  const tinggi = Math.ceil(diameter / 2);
  const lapis = [];
  for (let i = 0; i < tinggi; i++) {
    const y = i + 0.5; // jarak dari dasar
    const r = Math.sqrt(Math.max(0, R * R - (R - y) * (R - y) + (R - y) * 0));
    // Profil setengah bola: radius pada ketinggian y dari pusat bola di dasar.
    const yy = y - 0.5;
    const rr = Math.sqrt(Math.max(0, (R + 0.5) * (R + 0.5) - yy * yy)) - 0.5;
    const penuh = isiLingkaran(Math.max(0, rr));
    const pakai = isi ? penuh : tepiDariIsi(penuh);
    if (pakai.size) lapis.push({ lapis: lapis.length + 1, sel: pakai, jumlah: pakai.size });
    void r;
  }
  return lapis;
}

// Menara bundar: silinder setinggi n lapis + kubah di atasnya.
export function bangunMenara(diameter, tinggiDinding, isi) {
  const penuh = isiLingkaran((diameter - 1) / 2);
  const dinding = isi ? penuh : tepiDariIsi(penuh);
  const lapis = [];
  for (let i = 0; i < tinggiDinding; i++) lapis.push({ lapis: lapis.length + 1, sel: dinding, jumlah: dinding.size });
  const kubah = bangunKubah(diameter, isi);
  kubah.forEach((l) => lapis.push({ lapis: lapis.length + 1, sel: l.sel, jumlah: l.jumlah }));
  return lapis;
}

// Atap kerucut: lingkaran mengecil linear sampai 1 blok.
export function bangunKerucut(diameter, tinggi, isi) {
  const R = (diameter - 1) / 2;
  const lapis = [];
  for (let i = 0; i < tinggi; i++) {
    const r = R * (1 - i / tinggi);
    const penuh = isiLingkaran(Math.max(0, r));
    const pakai = isi ? penuh : tepiDariIsi(penuh);
    if (pakai.size) lapis.push({ lapis: lapis.length + 1, sel: pakai, jumlah: pakai.size });
  }
  return lapis;
}

export function render(root) {
  const st = document.createElement('style');
  st.textContent =
    '.mk-kanvas{width:100%;height:auto;display:block;background:#1e1a17;border:1px solid rgba(255,255,255,.12);border-radius:12px;margin:12px 0}' +
    '.mk-lapis{font-family:var(--font-m);font-size:12px;line-height:1.4;background:#1e1a17;border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:12px;overflow-x:auto;white-space:pre;margin:8px 0}' +
    '.mk-nav{display:flex;gap:8px;align-items:center;margin:10px 0;flex-wrap:wrap}';
  root.appendChild(st);

  root.appendChild(T.el('<p class="hint">Pilih bentuknya, atur ukurannya, lalu bangun lapis demi lapis dari bawah ke atas mengikuti polanya.</p>'));

  const bentuk = T.select([
    ['kubah', 'Kubah (setengah bola)'],
    ['menara', 'Menara bundar (dinding + kubah)'],
    ['kerucut', 'Atap kerucut'],
  ], 'kubah');
  const dI = T.input('number', 'mis. 15', '15');
  const tI = T.input('number', 'mis. 6', '6');
  const mode = T.select([['kulit', 'Kulit saja (berongga)'], ['isi', 'Terisi penuh (padat)']], 'kulit');
  const wrapT = T.el('<div></div>');
  wrapT.appendChild(T.field('Tinggi dinding (lapis)', tI, 'Untuk menara: berapa lapis dinding tegaknya sebelum kubah. Untuk kerucut: tinggi total atap.'));
  wrapT.hidden = true;
  bentuk.addEventListener('change', () => {
    wrapT.hidden = bentuk.value === 'kubah';
    if (bentuk.value === 'menara') tI.value = '6';
    if (bentuk.value === 'kerucut') tI.value = '8';
  });

  const kanvas = document.createElement('canvas');
  kanvas.className = 'mk-kanvas';
  kanvas.width = 640;
  kanvas.height = 420;
  const box = T.out();
  const nav = T.el('<div class="mk-nav"></div>');
  const lapisEl = T.el('<div class="mk-lapis"></div>');

  let lapis = [];
  let aktif = 0;

  function gambar3D() {
    const ctx = kanvas.getContext('2d');
    const W = kanvas.width, H = kanvas.height;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#1e1a17';
    ctx.fillRect(0, 0, W, H);
    if (!lapis.length) return;
    const cx = W / 2;
    const n = lapis.length;
    const maxR = Math.min(W, H) * 0.36;
    const rLapis = lapis.map((l) => {
      let mx = 0;
      l.sel.forEach((k) => { const [x] = k.split(',').map(Number); mx = Math.max(mx, Math.abs(x)); });
      return mx;
    });
    const rMax = Math.max(...rLapis, 1);
    const dasarY = H - 50;
    for (let i = n - 1; i >= 0; i--) {
      const r = rLapis[i] / rMax * maxR;
      const y = dasarY - i * 9;
      const terang = 0.4 + 0.6 * (i / Math.max(1, n - 1));
      ctx.fillStyle = 'rgba(255,111,97,' + (0.35 + 0.5 * terang).toFixed(2) + ')';
      ctx.strokeStyle = '#ff6f61';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(cx, y, Math.max(2, r), Math.max(1.5, r * 0.42), 0, 0, Math.PI * 2);
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
    const d = T.num(dI.value);
    const t = T.num(tI.value);
    if (!Number.isInteger(d) || d < 3 || d > 61) { T.toast('Diameternya harus bilangan bulat 3 sampai 61'); return; }
    if (bentuk.value !== 'kubah' && (!Number.isInteger(t) || t < 1 || t > 40)) { T.toast('Tingginya harus bilangan bulat 1 sampai 40'); return; }
    if (bentuk.value === 'kubah') lapis = bangunKubah(d, mode.value === 'isi');
    else if (bentuk.value === 'menara') lapis = bangunMenara(d, t, mode.value === 'isi');
    else lapis = bangunKerucut(d, t, mode.value === 'isi');
    aktif = 0;
    const total = lapis.reduce((a, l) => a + l.jumlah, 0);
    const namaBentuk = bentuk.value === 'kubah' ? 'Kubah' : bentuk.value === 'menara' ? 'Menara bundar' : 'Atap kerucut';
    T.show(box,
      '<p class="big">' + T.fmt(total) + ' blok total</p>' +
      '<p>' + namaBentuk + ' diameter ' + d + ' blok, ' + lapis.length + ' lapis (' + (mode.value === 'isi' ? 'terisi penuh' : 'kulit saja, berongga') + ').</p>');
    gambar3D();
    gambarLapis();
  }

  root.append(
    T.field('Bentuk', bentuk),
    T.field('Diameter dasar (blok)', dI),
    wrapT,
    T.field('Isi bangunan', mode),
    T.btn('Buat rencana', buat, true),
    kanvas,
    box,
    nav,
    lapisEl,
  );
  buat();
}
