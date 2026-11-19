import { h as T, onLeave } from '../../core.js';

export const meta = { id: 'generator-labirin', name: 'Generator Labirin', cat: 'fun', icon: '🌀', desc: 'Labirin siap cetak: kotak, bulat, atau heksagon. Ada solusinya, dan yang kotak bisa dimainkan.', keywords: 'labirin,maze,puzzle,cetak,main,heksagon,lingkaran,kotak', since: '6.17.0' };

// ---- Labirin kotak: recursive backtracker ----
// dinding[r][c] = bitmask: 1=atas, 2=kanan, 4=bawah, 8=kiri.
export function buatLabirinKotak(w, h, rng) {
  const rand = rng || Math.random;
  const dinding = Array.from({ length: h }, () => Array(w).fill(15));
  const kunjung = Array.from({ length: h }, () => Array(w).fill(false));
  const ARAH = [[0, -1, 1, 4], [1, 0, 2, 8], [0, 1, 4, 1], [-1, 0, 8, 2]];
  const tumpuk = [[0, 0]];
  kunjung[0][0] = true;
  while (tumpuk.length) {
    const [cx, cy] = tumpuk[tumpuk.length - 1];
    const pilihan = ARAH.filter(([dx, dy]) => {
      const nx = cx + dx, ny = cy + dy;
      return nx >= 0 && nx < w && ny >= 0 && ny < h && !kunjung[ny][nx];
    });
    if (!pilihan.length) { tumpuk.pop(); continue; }
    const [dx, dy, bit, lawan] = pilihan[Math.floor(rand() * pilihan.length)];
    const nx = cx + dx, ny = cy + dy;
    dinding[cy][cx] &= ~bit;
    dinding[ny][nx] &= ~lawan;
    kunjung[ny][nx] = true;
    tumpuk.push([nx, ny]);
  }
  return dinding;
}

// Solusi kotak via BFS dari (0,0) ke (w-1,h-1). Kembalikan array [x,y].
export function solusiKotak(dinding, w, h) {
  const ARAH = [[0, -1, 1], [1, 0, 2], [0, 1, 4], [-1, 0, 8]];
  const dari = Array.from({ length: h }, () => Array(w).fill(null));
  const antri = [[0, 0]];
  dari[0][0] = [-1, -1];
  while (antri.length) {
    const [cx, cy] = antri.shift();
    if (cx === w - 1 && cy === h - 1) break;
    for (const [dx, dy, bit] of ARAH) {
      if (dinding[cy][cx] & bit) continue;
      const nx = cx + dx, ny = cy + dy;
      if (nx < 0 || nx >= w || ny < 0 || ny >= h || dari[ny][nx]) continue;
      dari[ny][nx] = [cx, cy];
      antri.push([nx, ny]);
    }
  }
  const jalur = [];
  let cur = [w - 1, h - 1];
  while (cur[0] >= 0) {
    jalur.unshift(cur);
    cur = dari[cur[1]][cur[0]];
    if (!cur) break;
  }
  return jalur;
}

// ---- Labirin bulat (polar): cincin konsentris, tiap cincin dibagi sel ----
// Kembalikan { cincin: [{ sel: n, dindingLuar: Set(idx), dindingSamping: Set(idx) }], ... }
export function buatLabirinBulat(jumlahCincin, rng) {
  const rand = rng || Math.random;
  // Jumlah sel per cincin: 6, 12, 18, ... (cincin ke-i punya 6*i sel).
  const cincin = [];
  for (let i = 0; i < jumlahCincin; i++) {
    cincin.push({ sel: 6 * (i + 1), radial: new Set(), tangensial: new Set() });
  }
  // Semua dinding ada di awal; backtracker membuka jalan.
  // radial: dinding ke cincin luar pada sel idx. tangensial: dinding ke sel berikutnya.
  for (let i = 0; i < jumlahCincin; i++) {
    for (let s = 0; s < cincin[i].sel; s++) {
      cincin[i].radial.add(s);
      cincin[i].tangensial.add(s);
    }
  }
  const kunjung = cincin.map((c) => Array(c.sel).fill(false));
  const tumpuk = [[0, 0]];
  kunjung[0][0] = true;
  const tetangga = (r, s) => {
    const out = [];
    // Samping dalam cincin yang sama.
    out.push([r, (s + 1) % cincin[r].sel, 't', s]);
    out.push([r, (s - 1 + cincin[r].sel) % cincin[r].sel, 't', (s - 1 + cincin[r].sel) % cincin[r].sel]);
    // Cincin dalam (sel induk mencakup 2 sel luar karena sel berlipat ganda).
    if (r > 0) {
      const induk = Math.floor(s * cincin[r - 1].sel / cincin[r].sel);
      out.push([r - 1, induk, 'r', induk]);
    }
    // Cincin luar (2 anak).
    if (r < jumlahCincin - 1) {
      const a0 = Math.floor(s * cincin[r + 1].sel / cincin[r].sel);
      out.push([r + 1, a0, 'r', s]);
      out.push([r + 1, (a0 + 1) % cincin[r + 1].sel, 'r', s]);
    }
    return out;
  };
  while (tumpuk.length) {
    const [cr, cs] = tumpuk[tumpuk.length - 1];
    const pilihan = tetangga(cr, cs).filter(([nr, ns]) => !kunjung[nr][ns]);
    if (!pilihan.length) { tumpuk.pop(); continue; }
    const [nr, ns, jenis, idxDinding] = pilihan[Math.floor(rand() * pilihan.length)];
    if (jenis === 't') cincin[cr].tangensial.delete(idxDinding);
    else if (nr > cr) cincin[cr].radial.delete(idxDinding);
    else cincin[nr].radial.delete(idxDinding);
    kunjung[nr][ns] = true;
    tumpuk.push([nr, ns]);
  }
  // Pintu masuk (cincin luar) dan keluar (pusat): buka satu dinding radial terluar.
  const pintu = Math.floor(rand() * cincin[jumlahCincin - 1].sel);
  cincin[jumlahCincin - 1].radial.delete(pintu);
  return { cincin, pintu };
}

// ---- Labirin heksagon: grid axial (q,r), 6 tetangga ----
export const HEX_ARAH = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
export function buatLabirinHex(radius, rng) {
  const rand = rng || Math.random;
  const kunci = (q, r) => q + ',' + r;
  const sel = new Map();
  for (let q = -radius; q <= radius; q++) {
    for (let r = Math.max(-radius, -q - radius); r <= Math.min(radius, -q + radius); r++) {
      sel.set(kunci(q, r), 63); // 6 dinding
    }
  }
  const kunjung = new Set(['0,0']);
  const tumpuk = [[0, 0]];
  while (tumpuk.length) {
    const [cq, cr] = tumpuk[tumpuk.length - 1];
    const pilihan = [];
    HEX_ARAH.forEach(([dq, dr], i) => {
      const nq = cq + dq, nr = cr + dr;
      if (sel.has(kunci(nq, nr)) && !kunjung.has(kunci(nq, nr))) pilihan.push([nq, nr, i]);
    });
    if (!pilihan.length) { tumpuk.pop(); continue; }
    const [nq, nr, i] = pilihan[Math.floor(rand() * pilihan.length)];
    sel.set(kunci(cq, cr), sel.get(kunci(cq, cr)) & ~(1 << i));
    sel.set(kunci(nq, nr), sel.get(kunci(nq, nr)) & ~(1 << ((i + 3) % 6)));
    kunjung.add(kunci(nq, nr));
    tumpuk.push([nq, nr]);
  }
  return sel;
}

export function render(root) {
  const st = document.createElement('style');
  st.textContent =
    '.lb-kanvas{width:100%;height:auto;display:block;background:#f6f1e8;border:1px solid rgba(255,255,255,.12);border-radius:12px;margin:12px 0;touch-action:manipulation}' +
    '@media print{.lb-no-print{display:none!important}}';
  root.appendChild(st);

  root.appendChild(T.el('<p class="hint">Labirin dibuat acak setiap kali, jadi tidak ada dua labirin yang sama. Yang kotak bisa dimainkan dengan tombol panah di keyboard atau tombol di bawah.</p>'));

  const bentuk = T.select([['kotak', 'Kotak'], ['bulat', 'Bulat'], ['hex', 'Heksagon']], 'kotak');
  const ukuran = T.select([['10', 'Kecil (10 × 10)'], ['15', 'Sedang (15 × 15)'], ['20', 'Besar (20 × 20)'], ['25', 'Besar sekali (25 × 25)']], '15');
  const tunjukSolusi = T.el('<label style="display:flex;gap:8px;align-items:center;font-size:14px;margin:8px 0;cursor:pointer"><input type="checkbox"> Tampilkan solusi</label>');
  const cekSolusi = tunjukSolusi.querySelector('input');

  const kanvas = document.createElement('canvas');
  kanvas.className = 'lb-kanvas';
  kanvas.width = 620;
  kanvas.height = 620;
  kanvas.setAttribute('role', 'img');
  kanvas.setAttribute('aria-label', 'Labirin');
  const box = T.out();
  const mainWrap = T.el('<div class="lb-no-print"></div>');

  let dinding = null, solusi = null, W = 15, H = 15;
  let bulat = null, hexSel = null, hexRadius = 4;
  let pemain = [0, 0];
  let menang = false;

  function buat() {
    menang = false;
    pemain = [0, 0];
    const n = parseInt(ukuran.value, 10);
    if (bentuk.value === 'kotak') {
      W = n; H = n;
      dinding = buatLabirinKotak(W, H);
      solusi = solusiKotak(dinding, W, H);
      bulat = null; hexSel = null;
    } else if (bentuk.value === 'bulat') {
      bulat = buatLabirinBulat(Math.max(3, Math.round(n / 3)));
      dinding = null; hexSel = null; solusi = null;
    } else {
      hexRadius = Math.max(2, Math.round(n / 4));
      hexSel = buatLabirinHex(hexRadius);
      dinding = null; bulat = null; solusi = null;
    }
    gambar();
    aturMain();
    T.show(box, '<p>Labirin ' + (bentuk.value === 'kotak' ? 'kotak ' + W + ' × ' + H : bentuk.value === 'bulat' ? 'bulat ' + bulat.cincin.length + ' cincin' : 'heksagon radius ' + hexRadius) + ' sudah jadi. Mulai dari pojok kiri atas, cari jalan ke pojok kanan bawah' + (bentuk.value === 'kotak' ? '' : ' (pusat)') + '.</p>');
  }

  function gambar() {
    // Pengaman: bila labirin bentuk yang dipilih belum pernah dibuat
    // (mis. bentuk baru diganti lalu solusi dicentang), bangun dulu
    // supaya tidak crash membaca data yang masih kosong.
    if ((bentuk.value === 'kotak' && !dinding) || (bentuk.value === 'bulat' && !bulat) || (bentuk.value === 'hex' && !hexSel)) {
      buat();
      return;
    }
    const ctx = kanvas.getContext('2d');
    const S = kanvas.width;
    ctx.clearRect(0, 0, S, S);
    ctx.fillStyle = '#f6f1e8';
    ctx.fillRect(0, 0, S, S);
    ctx.strokeStyle = '#161311';
    ctx.lineCap = 'square';
    if (bentuk.value === 'kotak') {
      const s = (S - 24) / W;
      const ox = 12, oy = 12;
      ctx.lineWidth = Math.max(2, s / 8);
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const d = dinding[y][x];
          const px = ox + x * s, py = oy + y * s;
          ctx.beginPath();
          if (d & 1) { ctx.moveTo(px, py); ctx.lineTo(px + s, py); }
          if (d & 2) { ctx.moveTo(px + s, py); ctx.lineTo(px + s, py + s); }
          if (d & 4) { ctx.moveTo(px, py + s); ctx.lineTo(px + s, py + s); }
          if (d & 8) { ctx.moveTo(px, py); ctx.lineTo(px, py + s); }
          ctx.stroke();
        }
      }
      // Pintu masuk dan keluar
      ctx.fillStyle = '#f6f1e8';
      ctx.fillRect(ox, oy - 3, s, 6);
      ctx.fillRect(ox + (W - 1) * s, oy + H * s - 3, s, 6);
      // Solusi
      if (cekSolusi.checked && solusi) {
        ctx.strokeStyle = '#ff6f61';
        ctx.lineWidth = Math.max(2, s / 4);
        ctx.beginPath();
        solusi.forEach(([x, y], i) => {
          const px = ox + x * s + s / 2, py = oy + y * s + s / 2;
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        });
        ctx.stroke();
      }
      // Pemain
      const px = ox + pemain[0] * s + s / 2, py = oy + pemain[1] * s + s / 2;
      ctx.fillStyle = '#ff6f61';
      ctx.beginPath();
      ctx.arc(px, py, s * 0.32, 0, Math.PI * 2);
      ctx.fill();
      // Tujuan
      ctx.fillStyle = '#2e7d4f';
      ctx.beginPath();
      ctx.arc(ox + (W - 1) * s + s / 2, oy + (H - 1) * s + s / 2, s * 0.32, 0, Math.PI * 2);
      ctx.fill();
    } else if (bentuk.value === 'bulat') {
      const cx = S / 2, cy = S / 2;
      const n = bulat.cincin.length;
      const dr = (S / 2 - 16) / n;
      ctx.lineWidth = 3;
      bulat.cincin.forEach((c, ri) => {
        const rLuar = dr * (ri + 1);
        for (let s = 0; s < c.sel; s++) {
          const a0 = s / c.sel * Math.PI * 2 - Math.PI / 2;
          const a1 = (s + 1) / c.sel * Math.PI * 2 - Math.PI / 2;
          if (c.radial.has(s)) {
            ctx.beginPath();
            ctx.arc(cx, cy, rLuar, a0, a1);
            ctx.stroke();
          }
          if (c.tangensial.has(s)) {
            ctx.beginPath();
            ctx.moveTo(cx + Math.cos(a1) * dr * ri, cy + Math.sin(a1) * dr * ri);
            ctx.lineTo(cx + Math.cos(a1) * rLuar, cy + Math.sin(a1) * rLuar);
            ctx.stroke();
          }
        }
      });
      // Titik pusat (tujuan)
      ctx.fillStyle = '#2e7d4f';
      ctx.beginPath();
      ctx.arc(cx, cy, 8, 0, Math.PI * 2);
      ctx.fill();
    } else {
      const size = (S / 2 - 20) / (hexRadius * 1.8);
      const cx = S / 2, cy = S / 2;
      const sudutHex = (i) => Math.PI / 180 * (60 * i - 30);
      const pusat = (q, r) => [cx + size * Math.sqrt(3) * (q + r / 2), cy + size * 1.5 * r];
      ctx.lineWidth = 2.5;
      hexSel.forEach((mask, key) => {
        const [q, r] = key.split(',').map(Number);
        const [px, py] = pusat(q, r);
        for (let i = 0; i < 6; i++) {
          if (!(mask & (1 << i))) continue;
          const a0 = sudutHex(i), a1 = sudutHex(i + 1);
          ctx.beginPath();
          ctx.moveTo(px + Math.cos(a0) * size, py + Math.sin(a0) * size);
          ctx.lineTo(px + Math.cos(a1) * size, py + Math.sin(a1) * size);
          ctx.stroke();
        }
      });
      ctx.fillStyle = '#2e7d4f';
      ctx.beginPath();
      ctx.arc(cx, cy, 7, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function gerak(dx, dy, bit) {
    if (bentuk.value !== 'kotak' || menang) return;
    const [x, y] = pemain;
    if (dinding[y][x] & bit) return;
    const nx = x + dx, ny = y + dy;
    if (nx < 0 || nx >= W || ny < 0 || ny >= H) return;
    pemain = [nx, ny];
    gambar();
    if (nx === W - 1 && ny === H - 1) {
      menang = true;
      T.toast('Sampai! Kamu berhasil keluar dari labirin.');
      try { T.beep(660, 0.15, 'sine'); T.beep(880, 0.25, 'sine', 0.18); } catch (e) {}
    }
  }

  function aturMain() {
    mainWrap.innerHTML = '';
    if (bentuk.value !== 'kotak') {
      mainWrap.appendChild(T.el('<p class="hint">Mode bermain hanya untuk labirin kotak. Labirin bulat dan heksagon bisa dicetak dan dimainkan di kertas.</p>'));
      return;
    }
    const grid = T.el('<div style="display:grid;grid-template-columns:repeat(3,64px);gap:6px;justify-content:center;margin:8px 0"></div>');
    const tombol = (label, dx, dy, bit, col) => {
      const b = T.btn(label, () => gerak(dx, dy, bit));
      b.style.gridColumn = col;
      b.style.minHeight = '48px';
      b.style.fontSize = '20px';
      return b;
    };
    grid.append(T.el('<div></div>'), tombol('↑', 0, -1, 1, '2'), T.el('<div></div>'));
    grid.append(tombol('←', -1, 0, 8, '1'), tombol('↓', 0, 1, 4, '2'), tombol('→', 1, 0, 2, '3'));
    const ket = T.el('<p class="hint" style="text-align:center">Atau pakai tombol panah di keyboard. Titik merah itu kamu, titik hijau itu tujuan.</p>');
    mainWrap.append(grid, ket);
  }

  function onKey(e) {
    if (bentuk.value !== 'kotak') return;
    const t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT')) return;
    const peta = { ArrowUp: [0, -1, 1], ArrowDown: [0, 1, 4], ArrowLeft: [-1, 0, 8], ArrowRight: [1, 0, 2] };
    if (peta[e.key]) { e.preventDefault(); gerak(...peta[e.key]); }
  }
  document.addEventListener('keydown', onKey);
  onLeave(() => document.removeEventListener('keydown', onKey));

  cekSolusi.addEventListener('change', gambar);
  // Ganti bentuk langsung membangun labirin baru bentuk itu, jadi
  // pengguna tidak perlu menekan "Buat labirin baru" dulu.
  bentuk.addEventListener('change', buat);

  root.append(
    T.field('Bentuk labirin', bentuk),
    T.field('Ukuran', ukuran),
    tunjukSolusi,
    T.row(T.btn('Buat labirin baru', buat, true), T.btn('Cetak', () => window.print())),
    kanvas,
    mainWrap,
    box,
  );
  buat();
}
