import { h as T, onLeave, utils } from '../../core.js';

export const meta = { id: 'simulator-newtons-cradle', name: 'Simulator Newton\'s Cradle', cat: 'sains', icon: '🔮', desc: 'Ayunkan Newton\'s cradle: bola yang diayunkan memindahkan geraknya lewat bola-bola diam ke bola paling ujung. Seret bolanya atau pakai tombol.', keywords: 'newtons cradle,bola newton,momentum,tumbukan elastis,ayunan,fisika', since: '6.19.0' };

const G = 9.81;

// Periode ayunan satu bola (detik): T = 2 pi sqrt(L/g).
export function periodeBola(L, g) {
  if (!(L > 0) || !(g > 0)) return NaN;
  return 2 * Math.PI * Math.sqrt(L / g);
}

// Tumbukan elastis dua bola bermassa sama: kecepatannya bertukar tempat.
export function tukarKecepatan(v1, v2) {
  return [v2, v1];
}

// Satu langkah simulasi cradle. balls = [{ th, om }] dari kiri ke kanan.
// L dalam meter. Mengubah balls di tempat, mengembalikan jumlah tumbukan.
// redam: faktor redaman per langkah (1 = tanpa redaman).
export function langkahCradle(balls, dt, L, g, redam) {
  const d = redam == null ? 1 : redam;
  for (let i = 0; i < balls.length; i++) {
    const b = balls[i];
    b.om += (-g / L) * Math.sin(b.th) * dt;
    b.om *= d;
    b.th += b.om * dt;
  }
  let tumbukan = 0;
  for (let i = 0; i < balls.length - 1; i++) {
    const a = balls[i], b = balls[i + 1];
    if (a.th >= b.th && a.om > b.om) {
      const tmp = a.om;
      a.om = b.om;
      b.om = tmp;
      a.th = b.th;
      tumbukan++;
    }
  }
  return tumbukan;
}

export function render(root) {
  const st = document.createElement('style');
  st.textContent =
    '.nc-kanvas{width:100%;height:auto;display:block;background:#0d0b09;border:1px solid rgba(255,255,255,.12);border-radius:12px;margin:12px 0;touch-action:none}';
  root.appendChild(st);

  root.appendChild(T.el('<p class="hint">Tarik satu bola lalu lepaskan: bola itu berhenti, bola paling ujung yang terlempar. Momentum dan energinya pindah lewat bola-bola di tengah yang nyaris tidak bergerak.</p>'));

  const kanvas = document.createElement('canvas');
  kanvas.className = 'nc-kanvas';
  kanvas.width = 680;
  kanvas.height = 400;
  kanvas.setAttribute('role', 'img');
  kanvas.setAttribute('aria-label', 'Simulasi Newton\'s cradle lima bola');
  const status = T.el('<p class="hint" data-live="cradle">Tarik bola dengan jari atau mouse, atau pakai tombol di bawah.</p>');

  const N = 5;
  const L_M = 0.35; // panjang tali, meter (untuk fisika)
  const PIVOT_Y = 50;
  const L_PX = 230;
  const R_BOLA = 21;
  const JARAK = 42;
  const CX = 340;

  let balls = [];
  let animId = null;
  let berjalan = true;
  let terakhir = 0;
  let jumlahTumbukan = 0;
  let seret = -1;

  function pivotX(i) { return CX + (i - (N - 1) / 2) * JARAK; }
  function posisiBola(i) {
    const b = balls[i];
    return { x: pivotX(i) + L_PX * Math.sin(b.th), y: PIVOT_Y + L_PX * Math.cos(b.th) };
  }

  function aturUlang() {
    balls = Array.from({ length: N }, () => ({ th: 0, om: 0 }));
    jumlahTumbukan = 0;
    seret = -1;
    perbaruiStatus();
    gambar();
  }

  function tarik(n, sudut) {
    aturUlang();
    for (let i = 0; i < n && i < N; i++) balls[i].th = -sudut;
    gambar();
  }

  function perbaruiStatus() {
    const bergerak = balls.some((b) => Math.abs(b.om) > 0.02 || Math.abs(b.th) > 0.005);
    status.setAttribute('data-tumbukan', String(jumlahTumbukan));
    status.setAttribute('data-bergerak', bergerak ? '1' : '0');
    status.textContent = 'Tumbukan tercatat: ' + jumlahTumbukan + '. ' +
      (bergerak ? 'Bola sedang bergerak.' : 'Semua bola diam.') +
      ' Periode satu ayunan penuh: ' + utils.fmtDes(periodeBola(L_M, G), 2) + ' detik.';
  }

  function gambar() {
    const ctx = kanvas.getContext('2d');
    ctx.clearRect(0, 0, kanvas.width, kanvas.height);
    ctx.fillStyle = '#0d0b09';
    ctx.fillRect(0, 0, kanvas.width, kanvas.height);
    // Rangka atas
    ctx.fillStyle = '#2a2521';
    ctx.fillRect(pivotX(0) - 40, PIVOT_Y - 18, JARAK * (N - 1) + 80, 12);
    for (let i = 0; i < N; i++) {
      const pos = posisiBola(i);
      ctx.strokeStyle = '#e8ded0';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(pivotX(i), PIVOT_Y - 6);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      const grad = ctx.createRadialGradient(pos.x - 6, pos.y - 6, 3, pos.x, pos.y, R_BOLA);
      grad.addColorStop(0, '#ff8a7a');
      grad.addColorStop(1, '#c94a3e');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, R_BOLA, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.35)';
      ctx.beginPath();
      ctx.arc(pos.x - 7, pos.y - 7, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function putar(now) {
    if (!berjalan) return;
    const dtNyata = Math.min(0.05, (now - terakhir) / 1000);
    terakhir = now;
    const sub = 12;
    const dt = dtNyata / sub;
    for (let i = 0; i < sub; i++) {
      jumlahTumbukan += langkahCradle(balls, dt, L_M, G, 0.99999);
    }
    gambar();
    perbaruiStatus();
    animId = requestAnimationFrame(putar);
  }

  function mulaiLoop() {
    if (animId) return;
    berjalan = true;
    terakhir = performance.now();
    animId = requestAnimationFrame(putar);
  }

  function posisiPointer(e) {
    const r = kanvas.getBoundingClientRect();
    const x = (e.clientX - r.left) * (kanvas.width / r.width);
    const y = (e.clientY - r.top) * (kanvas.height / r.height);
    return { x, y };
  }

  kanvas.addEventListener('pointerdown', (e) => {
    const p = posisiPointer(e);
    for (let i = 0; i < N; i++) {
      const pos = posisiBola(i);
      const dx = p.x - pos.x, dy = p.y - pos.y;
      if (dx * dx + dy * dy < 32 * 32) {
        seret = i;
        balls[i].om = 0;
        kanvas.setPointerCapture(e.pointerId);
        break;
      }
    }
  });
  kanvas.addEventListener('pointermove', (e) => {
    if (seret < 0) return;
    const p = posisiPointer(e);
    let th = Math.atan2(p.x - pivotX(seret), p.y - PIVOT_Y);
    th = Math.max(-1.1, Math.min(1.1, th));
    // Bola tidak boleh menembus tetangganya.
    if (seret > 0) th = Math.max(th, balls[seret - 1].th);
    if (seret < N - 1) th = Math.min(th, balls[seret + 1].th);
    balls[seret].th = th;
    balls[seret].om = 0;
    gambar();
  });
  const lepasSeret = () => { seret = -1; };
  kanvas.addEventListener('pointerup', lepasSeret);
  kanvas.addEventListener('pointercancel', lepasSeret);

  const tombolJeda = T.btn('Jeda', () => {
    if (berjalan) {
      berjalan = false;
      if (animId) cancelAnimationFrame(animId);
      animId = null;
      tombolJeda.textContent = 'Lanjutkan';
    } else {
      tombolJeda.textContent = 'Jeda';
      mulaiLoop();
    }
  });

  onLeave(() => { berjalan = false; if (animId) cancelAnimationFrame(animId); });

  root.append(
    T.row(
      T.btn('Tarik 1 bola', () => tarik(1, 0.55), true),
      T.btn('Tarik 2 bola', () => tarik(2, 0.55)),
      T.btn('Tarik 3 bola', () => tarik(3, 0.55)),
      tombolJeda,
      T.btn('Atur ulang', aturUlang),
    ),
    kanvas,
    status,
  );
  aturUlang();
  mulaiLoop();
}
