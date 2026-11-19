import { h as T, utils, onLeave } from '../../core.js';

export const meta = {"id": "simulator-balap-bebek", "name": "Simulator Balap Bebek", "cat": "fun", "icon": "🦆", "desc": "Delapan bebek balapan sampai garis finis. Pilih jagoanmu, tekan mulai, dan lihat siapa yang menang.", "keywords": "balap bebek,simulator balap,bebek,balapan,game,acak,lomba", "since": "6.19.0"};

// Nama bebek. Kecepatan dasar tiap bebek diacak tiap balapan, lalu
// tiap langkah dikalikan goyangan acak supaya posisi terus berubah.
export const NAMA_BEBEK = ['Kwek', 'Si Kuning', 'Mentok', 'Itik Sawah', 'Bebek Karet', 'Si Paruh', 'Kwek Kwek', 'Bebek Rawa'];
export const WARNA_BEBEK = ['#ffd54f', '#ffb74d', '#fff176', '#ffcc80', '#ffe082', '#ffab91', '#fff59d', '#ffca28'];

// PRNG deterministik mulberry32 (kanonis, G4 C1G4-R).
export const mulberry32 = utils.mulberry32;

export function buatBebek(jumlah, rand) {
  const r = rand || Math.random;
  const n = Math.max(2, Math.min(8, jumlah | 0 || 4));
  const daftar = [];
  for (let i = 0; i < n; i++) {
    daftar.push({
      nama: NAMA_BEBEK[i],
      warna: WARNA_BEBEK[i],
      x: 0,
      kecepatan: 0.9 + r() * 0.7,
      selesai: null,
    });
  }
  return daftar;
}

// Satu langkah balapan. rand disuntik supaya bisa diuji deterministik.
export function langkahBalap(bebek, rand, garisFinis) {
  const r = rand || Math.random;
  for (const b of bebek) {
    if (b.selesai !== null) continue;
    const goyang = 0.55 + r() * 0.9;
    b.x += b.kecepatan * goyang;
    if (b.x >= garisFinis) { b.x = garisFinis; b.selesai = true; }
  }
  return bebek;
}

export function urutanFinis(bebek) {
  return [...bebek].sort((a, b) => {
    if ((a.selesai !== null) !== (b.selesai !== null)) return a.selesai !== null ? -1 : 1;
    return b.x - a.x;
  });
}

export function balapanSelesai(bebek) {
  return bebek.every((b) => b.selesai !== null);
}

export function render(root) {
  const st = document.createElement('style');
  st.textContent = '.bb-kanvas{width:100%;height:auto;display:block;background:#171923;border:1px solid rgba(255,255,255,.12);border-radius:12px;margin:12px 0}';
  root.appendChild(st);

  const kanvas = document.createElement('canvas');
  kanvas.className = 'bb-kanvas';
  kanvas.width = 680;
  kanvas.height = 320;
  kanvas.setAttribute('role', 'img');
  kanvas.setAttribute('aria-label', 'Arena balap bebek');
  const ctx = kanvas.getContext('2d');

  const jumlahSel = T.select([['4', '4 bebek'], ['6', '6 bebek'], ['8', '8 bebek']], '6');
  const box = T.out();
  let bebek = buatBebek(6);
  let animId = null;
  let berjalan = false;
  let urutanTiba = [];

  const GARIS = 600;
  const AWAL = 40;

  function gambar() {
    ctx.clearRect(0, 0, kanvas.width, kanvas.height);
    ctx.fillStyle = '#1e212e';
    ctx.fillRect(0, 0, kanvas.width, kanvas.height);
    const tinggiLajur = kanvas.height / bebek.length;
    bebek.forEach((b, i) => {
      const y = i * tinggiLajur;
      ctx.fillStyle = i % 2 ? '#1a1d2b' : '#1e212e';
      ctx.fillRect(0, y, kanvas.width, tinggiLajur);
      ctx.strokeStyle = 'rgba(255,255,255,.08)';
      ctx.beginPath(); ctx.moveTo(0, y + tinggiLajur); ctx.lineTo(kanvas.width, y + tinggiLajur); ctx.stroke();
      ctx.fillStyle = '#a1a1aa';
      ctx.font = '12px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText((i + 1) + '. ' + b.nama, 6, y + 14);
      const x = AWAL + (b.x / 100) * (GARIS - AWAL);
      ctx.font = Math.min(30, tinggiLajur - 8) + 'px system-ui, sans-serif';
      ctx.fillText('🦆', x, y + tinggiLajur - 6);
    });
    ctx.fillStyle = '#fff';
    for (let y = 0; y < kanvas.height; y += 16) {
      ctx.fillRect(GARIS, y, 8, 8);
      ctx.fillRect(GARIS + 8, y + 8, 8, 8);
    }
  }

  function putar() {
    if (!berjalan) return;
    const sebelum = bebek.map((b) => b.selesai);
    langkahBalap(bebek, Math.random, 100);
    bebek.forEach((b, i) => {
      if (b.selesai !== null && sebelum[i] === null) urutanTiba.push(b.nama);
    });
    gambar();
    if (balapanSelesai(bebek)) {
      berjalan = false;
      const urutan = urutanTiba.slice();
      T.show(box, '<p class="big">🏆 ' + T.esc(urutan[0] || '') + ' menang!</p>' +
        '<p class="hint">Urutan finis: ' + urutan.map((n, i) => (i + 1) + '. ' + T.esc(n)).join(', ') + '.</p>');
      T.toast('Balapan selesai, ' + (urutan[0] || '') + ' menang');
      return;
    }
    animId = requestAnimationFrame(putar);
  }

  const mulaiBtn = T.btn('Mulai balap', () => {
    if (berjalan) return;
    bebek = buatBebek(parseInt(jumlahSel.value, 10));
    urutanTiba = [];
    berjalan = true;
    T.show(box, '<p class="hint">Balapan berjalan. Bebek tercepat di awal belum tentu menang.</p>');
    animId = requestAnimationFrame(putar);
  }, true);
  const ulangBtn = T.btn('Acak ulang bebek', () => {
    berjalan = false;
    if (animId) cancelAnimationFrame(animId);
    bebek = buatBebek(parseInt(jumlahSel.value, 10));
    urutanTiba = [];
    gambar();
    T.show(box, '<p class="hint">Bebek baru sudah siap di garis start.</p>');
  });
  jumlahSel.addEventListener('change', () => {
    berjalan = false;
    if (animId) cancelAnimationFrame(animId);
    bebek = buatBebek(parseInt(jumlahSel.value, 10));
    urutanTiba = [];
    gambar();
  });
  onLeave(() => { berjalan = false; if (animId) cancelAnimationFrame(animId); });

  root.appendChild(T.el('<p class="hint">Tiap bebek punya kecepatan dasar yang diacak tiap balapan, lalu kecepatannya goyang tiap detik. Tidak ada yang bisa menebak pemenangnya.</p>'));
  root.appendChild(T.field('Jumlah bebek', jumlahSel));
  root.appendChild(kanvas);
  root.appendChild(T.row(mulaiBtn, ulangBtn));
  root.appendChild(box);
  gambar();
  T.show(box, '<p class="hint">Tekan "Mulai balap" untuk memulai.</p>');
}
