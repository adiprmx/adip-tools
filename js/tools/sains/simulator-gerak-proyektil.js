import { h as T, onLeave } from '../../core.js';

export const meta = { id: 'simulator-gerak-proyektil', name: 'Simulator Gerak Proyektil', cat: 'sains', icon: '🎯', desc: 'Lempar benda dan lihat lintasannya: seberapa jauh, setinggi apa, dan berapa lama di udara.', keywords: 'proyektil,gerak parabola,lintasan,lempar,gravitasi,fisika,sudut,kecepatan awal', since: '6.17.0' };

// Fisika gerak parabola tanpa hambatan udara.
// Kembalikan { jangkauan, tinggiMaks, waktuTotal, vx, vy, titik: [{x,y,t}] }.
export function hitungProyektil(v0, sudutDeg, g, tinggiAwal) {
  const a = sudutDeg * Math.PI / 180;
  const vx = v0 * Math.cos(a);
  const vy = v0 * Math.sin(a);
  const h0 = tinggiAwal || 0;
  // Waktu total: selesaikan h0 + vy t - g t^2/2 = 0.
  const diskriminan = vy * vy + 2 * g * h0;
  const waktuTotal = (vy + Math.sqrt(diskriminan)) / g;
  const jangkauan = vx * waktuTotal;
  const tinggiMaks = h0 + (vy * vy) / (2 * g);
  const titik = [];
  const langkah = 60;
  for (let i = 0; i <= langkah; i++) {
    const t = waktuTotal * i / langkah;
    titik.push({ x: vx * t, y: Math.max(0, h0 + vy * t - 0.5 * g * t * t), t });
  }
  return { jangkauan, tinggiMaks, waktuTotal, vx, vy, titik };
}

function fmtNum(v, des) {
  if (!isFinite(v)) return 'di luar jangkauan';
  const r = Math.round(v * Math.pow(10, des == null ? 2 : des)) / Math.pow(10, des == null ? 2 : des);
  return String(r).replace('.', ',');
}

export function render(root) {
  const st = document.createElement('style');
  st.textContent =
    '.gp-kanvas{width:100%;height:auto;display:block;background:#1e1a17;border:1px solid rgba(255,255,255,.12);border-radius:12px;margin:12px 0;touch-action:manipulation}';
  root.appendChild(st);

  root.appendChild(T.el('<p class="hint">Atur kecepatan awal dan sudut lemparan, lalu tekan Luncurkan. Hambatan udara diabaikan, jadi lintasannya parabola murni.</p>'));

  const vI = T.input('number', 'mis. 20', '20');
  const sudutI = T.input('number', 'mis. 45', '45');
  const gI = T.input('number', 'mis. 9,8', '9.8');
  const hI = T.input('number', 'mis. 0', '0');
  const gravitasiSel = T.select([
    ['9.8', 'Bumi (9,8 m/s²)'],
    ['1.62', 'Bulan (1,62 m/s²)'],
    ['3.71', 'Mars (3,71 m/s²)'],
    ['24.79', 'Jupiter (24,79 m/s²)'],
    ['0', 'Ruang hampa tanpa gravitasi (0)'],
  ], '9.8');
  gravitasiSel.addEventListener('change', () => { gI.value = gravitasiSel.value.replace('.', ','); });

  const kanvas = document.createElement('canvas');
  kanvas.className = 'gp-kanvas';
  kanvas.width = 680;
  kanvas.height = 380;
  kanvas.setAttribute('role', 'img');
  kanvas.setAttribute('aria-label', 'Lintasan lemparan');
  const box = T.out();

  let animId = null;
  let hasil = null;

  function gambar(progres) {
    const ctx = kanvas.getContext('2d');
    const W = kanvas.width, H = kanvas.height, P = 34;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#1e1a17';
    ctx.fillRect(0, 0, W, H);
    if (!hasil) {
      ctx.fillStyle = '#a89c88';
      ctx.font = '15px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Atur angka di atas, lalu tekan Luncurkan.', W / 2, H / 2);
      return;
    }
    const maxX = Math.max(hasil.jangkauan * 1.08, 1);
    const maxY = Math.max(hasil.tinggiMaks * 1.15, 1);
    const sx = (x) => P + x / maxX * (W - 2 * P);
    const sy = (y) => H - P - y / maxY * (H - 2 * P);
    // Tanah
    ctx.strokeStyle = '#5a5148';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(P, sy(0)); ctx.lineTo(W - P, sy(0)); ctx.stroke();
    // Kisi jarak
    ctx.fillStyle = '#a89c88';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    for (let i = 0; i <= 4; i++) {
      const x = maxX * i / 4;
      ctx.fillText(fmtNum(x, 0) + ' m', sx(x), H - 10);
    }
    // Lintasan penuh (redup) + yang sudah dilewati (tegas)
    const n = hasil.titik.length;
    const sampai = Math.max(1, Math.floor(n * progres));
    ctx.strokeStyle = 'rgba(255,111,97,.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    hasil.titik.forEach((p, i) => { if (i === 0) ctx.moveTo(sx(p.x), sy(p.y)); else ctx.lineTo(sx(p.x), sy(p.y)); });
    ctx.stroke();
    ctx.strokeStyle = '#ff6f61';
    ctx.beginPath();
    for (let i = 0; i < sampai; i++) {
      const p = hasil.titik[i];
      if (i === 0) ctx.moveTo(sx(p.x), sy(p.y)); else ctx.lineTo(sx(p.x), sy(p.y));
    }
    ctx.stroke();
    // Bola
    const cur = hasil.titik[sampai - 1];
    ctx.fillStyle = '#ffd166';
    ctx.beginPath();
    ctx.arc(sx(cur.x), sy(cur.y), 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#161311';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // Label angka
    ctx.fillStyle = '#e8ded0';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Jarak: ' + fmtNum(cur.x) + ' m', P + 4, P - 8);
    ctx.fillText('Tinggi: ' + fmtNum(cur.y) + ' m', P + 4, P + 8);
    ctx.fillText('Waktu: ' + fmtNum(cur.t) + ' dtk', P + 4, P + 24);
  }

  function luncurkan() {
    const v0 = T.num(vI.value);
    const sudut = T.num(sudutI.value);
    const g = T.num(gI.value);
    const h0 = T.num(hI.value) || 0;
    if (!(v0 > 0)) { T.toast('Kecepatan awalnya harus lebih dari 0'); return; }
    if (!isFinite(sudut) || sudut < 0 || sudut > 90) { T.toast('Sudutnya antara 0 dan 90 derajat'); return; }
    if (!(g > 0)) { T.toast('Gravitasinya harus lebih dari 0. Tanpa gravitasi, bendanya tidak pernah jatuh.'); return; }
    if (h0 < 0) { T.toast('Tinggi awalnya tidak boleh negatif'); return; }
    hasil = hitungProyektil(v0, sudut, g, h0);
    T.show(box,
      '<p class="big">Jarak terjauh: ' + fmtNum(hasil.jangkauan) + ' m</p>' +
      '<p>Tinggi maksimum: ' + fmtNum(hasil.tinggiMaks) + ' m · Lama di udara: ' + fmtNum(hasil.waktuTotal) + ' detik · Kecepatan mendatar: ' + fmtNum(hasil.vx) + ' m/s · Kecepatan tegak awal: ' + fmtNum(hasil.vy) + ' m/s.</p>' +
      '<p class="hint">Sudut 45 derajat memberi jarak terjauh kalau lemparannya dari tanah. Makin besar gravitasinya, makin pendek jaraknya.</p>');
    if (animId) cancelAnimationFrame(animId);
    const mulai = performance.now();
    const durasi = Math.min(4000, Math.max(1200, hasil.waktuTotal * 600));
    const putar = (now) => {
      const p = Math.min(1, (now - mulai) / durasi);
      gambar(p);
      if (p < 1) animId = requestAnimationFrame(putar);
      else animId = null;
    };
    animId = requestAnimationFrame(putar);
  }

  onLeave(() => { if (animId) cancelAnimationFrame(animId); });

  root.append(
    T.grid2(T.field('Kecepatan awal (m/s)', vI), T.field('Sudut lemparan (derajat)', sudutI)),
    T.grid2(T.field('Gravitasi (m/s²)', gI), T.field('Tempat', gravitasiSel)),
    T.field('Tinggi awal lemparan (meter)', hI, '0 kalau melempar dari tanah.'),
    T.btn('Luncurkan', luncurkan, true),
    kanvas,
    box,
  );
  gambar(0);
}
