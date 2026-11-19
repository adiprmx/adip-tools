import { h as T, onLeave, utils } from '../../core.js';

export const meta = { id: 'simulator-bandul-ganda', name: 'Simulator Bandul Ganda', cat: 'sains', icon: '🎢', desc: 'Ayunkan bandul ganda dan saksikan chaos: dua bandul yang awalnya hampir sama persis lama-lama bergerak sangat berbeda.', keywords: 'bandul ganda,double pendulum,chaos,fisika,simulasi,osilasi', since: '6.19.0' };

const G = 9.81;

// Turunan keadaan bandul ganda. s = { th1, om1, th2, om2 }, p = { m1, m2, L1, L2 }.
// Rumus standar dari persamaan Lagrange.
export function turunanBandulGanda(s, p) {
  const { m1, m2, L1, L2 } = p;
  const { th1, om1, th2, om2 } = s;
  const d = th1 - th2;
  const den = 2 * m1 + m2 - m2 * Math.cos(2 * d);
  const dom1 = (-G * (2 * m1 + m2) * Math.sin(th1) - m2 * G * Math.sin(th1 - 2 * th2)
    - 2 * Math.sin(d) * m2 * (om2 * om2 * L2 + om1 * om1 * L1 * Math.cos(d))) / (L1 * den);
  const dom2 = (2 * Math.sin(d) * (om1 * om1 * L1 * (m1 + m2) + G * (m1 + m2) * Math.cos(th1)
    + om2 * om2 * L2 * m2 * Math.cos(d))) / (L2 * den);
  return { th1: om1, om1: dom1, th2: om2, om2: dom2 };
}

// Satu langkah RK4.
export function langkahBandulGanda(s, dt, p) {
  const tambah = (a, b, k) => ({ th1: a.th1 + k * b.th1, om1: a.om1 + k * b.om1, th2: a.th2 + k * b.th2, om2: a.om2 + k * b.om2 });
  const k1 = turunanBandulGanda(s, p);
  const k2 = turunanBandulGanda(tambah(s, k1, dt / 2), p);
  const k3 = turunanBandulGanda(tambah(s, k2, dt / 2), p);
  const k4 = turunanBandulGanda(tambah(s, k3, dt), p);
  return {
    th1: s.th1 + (dt / 6) * (k1.th1 + 2 * k2.th1 + 2 * k3.th1 + k4.th1),
    om1: s.om1 + (dt / 6) * (k1.om1 + 2 * k2.om1 + 2 * k3.om1 + k4.om1),
    th2: s.th2 + (dt / 6) * (k1.th2 + 2 * k2.th2 + 2 * k3.th2 + k4.th2),
    om2: s.om2 + (dt / 6) * (k1.om2 + 2 * k2.om2 + 2 * k3.om2 + k4.om2),
  };
}

// Energi total (kinetik + potensial), dipakai untuk cek integrasi.
export function energiBandulGanda(s, p) {
  const { m1, m2, L1, L2 } = p;
  const { th1, om1, th2, om2 } = s;
  const t = 0.5 * (m1 + m2) * L1 * L1 * om1 * om1 + 0.5 * m2 * L2 * L2 * om2 * om2
    + m2 * L1 * L2 * om1 * om2 * Math.cos(th1 - th2);
  const v = -(m1 + m2) * G * L1 * Math.cos(th1) - m2 * G * L2 * Math.cos(th2);
  return t + v;
}

export function render(root) {
  const st = document.createElement('style');
  st.textContent =
    '.bg-kanvas{width:100%;height:auto;display:block;background:#0d0b09;border:1px solid rgba(255,255,255,.12);border-radius:12px;margin:12px 0}';
  root.appendChild(st);

  root.appendChild(T.el('<p class="hint">Bandul ganda itu kacau (chaotic): perubahan awal sekecil apa pun membuat geraknya lama-lama sama sekali berbeda. Di sini ada dua bandul yang sudut awalnya hanya beda 0,001 derajat. Perhatikan jejaknya.</p>'));

  const l1I = T.input('number', 'mis. 1', '1');
  const l2I = T.input('number', 'mis. 1', '1');
  const m1I = T.input('number', 'mis. 1', '1');
  const m2I = T.input('number', 'mis. 1', '1');
  const a1I = T.input('number', 'mis. 120', '120');
  const a2I = T.input('number', 'mis. 60', '60');
  const kanvas = document.createElement('canvas');
  kanvas.className = 'bg-kanvas';
  kanvas.width = 680;
  kanvas.height = 460;
  kanvas.setAttribute('role', 'img');
  kanvas.setAttribute('aria-label', 'Simulasi bandul ganda dengan jejak chaos');
  const status = T.el('<p class="hint" data-live="bandul-ganda">Tekan "Mulai" untuk memulai.</p>');

  let animId = null;
  let berjalan = false;
  let sA = null, sB = null;
  let jejakA = [], jejakB = [];
  let waktu = 0;
  let terakhir = 0;

  const pivotX = 340, pivotY = 80;
  const skalaPx = 110; // 1 meter = 110 px

  function bacaParam() {
    return {
      L1: T.num(l1I.value), L2: T.num(l2I.value),
      m1: T.num(m1I.value), m2: T.num(m2I.value),
      a1: T.num(a1I.value), a2: T.num(a2I.value),
    };
  }

  function posisi(s, p) {
    const x1 = pivotX + p.L1 * skalaPx * Math.sin(s.th1);
    const y1 = pivotY + p.L1 * skalaPx * Math.cos(s.th1);
    const x2 = x1 + p.L2 * skalaPx * Math.sin(s.th2);
    const y2 = y1 + p.L2 * skalaPx * Math.cos(s.th2);
    return { x1, y1, x2, y2 };
  }

  function aturUlang() {
    const p = bacaParam();
    if (!(p.L1 > 0) || p.L1 > 2 || !(p.L2 > 0) || p.L2 > 2) { T.toast('Panjang tiap lengan 0,1 sampai 2 meter'); return false; }
    if (!(p.m1 > 0) || !(p.m2 > 0)) { T.toast('Massa harus lebih dari 0'); return false; }
    if (!isFinite(p.a1) || !isFinite(p.a2) || Math.abs(p.a1) > 180 || Math.abs(p.a2) > 180) { T.toast('Sudut awalnya -180 sampai 180 derajat'); return false; }
    const t1 = (p.a1 * Math.PI) / 180, t2 = (p.a2 * Math.PI) / 180;
    sA = { th1: t1, om1: 0, th2: t2, om2: 0 };
    sB = { th1: t1, om1: 0, th2: t2 + 0.001 * Math.PI / 180, om2: 0 }; // beda 0,001 derajat
    jejakA = [];
    jejakB = [];
    waktu = 0;
    gambar();
    perbaruiStatus();
    return true;
  }

  function selisihSudut(a, b) {
    let d = (a - b) % (2 * Math.PI);
    if (d > Math.PI) d -= 2 * Math.PI;
    if (d < -Math.PI) d += 2 * Math.PI;
    return Math.abs(d) * 180 / Math.PI;
  }

  function perbaruiStatus() {
    if (!sA || !sB) return;
    const beda = selisihSudut(sA.th2, sB.th2);
    status.setAttribute('data-divergensi', String(beda));
    status.setAttribute('data-waktu', String(waktu));
    status.textContent = 'Waktu: ' + utils.fmtDes(waktu, 1) + ' detik. Selisih sudut bandul kedua: ' + utils.fmtDes(beda, 2) + '°. ' +
      (beda > 30 ? 'Kedua bandul sekarang bergerak sangat berbeda, padahal awalnya hanya beda 0,001°.' : 'Masih mirip, tunggu beberapa detik lagi.');
  }

  function gambarBandul(ctx, s, p, warnaBatang, warnaBob) {
    const { x1, y1, x2, y2 } = posisi(s, p);
    ctx.strokeStyle = warnaBatang;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(pivotX, pivotY);
    ctx.lineTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.fillStyle = warnaBob;
    ctx.beginPath();
    ctx.arc(x1, y1, 7 + Math.min(p.m1, 5), 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x2, y2, 7 + Math.min(p.m2, 5), 0, Math.PI * 2);
    ctx.fill();
    return { x2, y2 };
  }

  function gambar() {
    const ctx = kanvas.getContext('2d');
    const p = bacaParam();
    ctx.clearRect(0, 0, kanvas.width, kanvas.height);
    ctx.fillStyle = '#0d0b09';
    ctx.fillRect(0, 0, kanvas.width, kanvas.height);
    // Jejak
    const gambarJejak = (jejak, warna) => {
      if (jejak.length < 2) return;
      ctx.strokeStyle = warna;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      jejak.forEach(([x, y], i) => { if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); });
      ctx.stroke();
    };
    gambarJejak(jejakB, 'rgba(232,222,208,.45)');
    gambarJejak(jejakA, 'rgba(255,111,97,.75)');
    if (sA && sB) {
      gambarBandul(ctx, sB, p, 'rgba(232,222,208,.5)', '#a89c88');
      gambarBandul(ctx, sA, p, '#e8ded0', '#ff6f61');
    }
    ctx.fillStyle = '#e8ded0';
    ctx.beginPath();
    ctx.arc(pivotX, pivotY, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#a89c88';
    ctx.font = '12px sans-serif';
    ctx.fillText('Coral: bandul utama. Abu-abu: bandul kedua (awal beda 0,001°).', 12, kanvas.height - 12);
  }

  function putar(now) {
    if (!berjalan) return;
    const dtNyata = Math.min(0.05, (now - terakhir) / 1000);
    terakhir = now;
    const p = bacaParam();
    const sub = 24;
    const dt = dtNyata / sub;
    for (let i = 0; i < sub; i++) {
      sA = langkahBandulGanda(sA, dt, p);
      sB = langkahBandulGanda(sB, dt, p);
      waktu += dt;
    }
    const posA = posisi(sA, p), posB = posisi(sB, p);
    jejakA.push([posA.x2, posA.y2]);
    jejakB.push([posB.x2, posB.y2]);
    if (jejakA.length > 1500) { jejakA.shift(); jejakB.shift(); }
    gambar();
    perbaruiStatus();
    animId = requestAnimationFrame(putar);
  }

  const tombolMulai = T.btn('Mulai', () => {
    if (berjalan) {
      berjalan = false;
      if (animId) cancelAnimationFrame(animId);
      animId = null;
      tombolMulai.textContent = 'Lanjutkan';
      return;
    }
    if (!sA && !aturUlang()) return;
    berjalan = true;
    terakhir = performance.now();
    tombolMulai.textContent = 'Jeda';
    animId = requestAnimationFrame(putar);
  }, true);

  const tombolUlang = T.btn('Atur ulang', () => {
    berjalan = false;
    if (animId) cancelAnimationFrame(animId);
    animId = null;
    tombolMulai.textContent = 'Mulai';
    aturUlang();
  });

  onLeave(() => { berjalan = false; if (animId) cancelAnimationFrame(animId); });

  root.append(
    T.grid2(T.field('Panjang lengan 1 (meter)', l1I), T.field('Panjang lengan 2 (meter)', l2I)),
    T.grid2(T.field('Massa bandul 1 (kg)', m1I), T.field('Massa bandul 2 (kg)', m2I)),
    T.grid2(T.field('Sudut awal 1 (derajat)', a1I), T.field('Sudut awal 2 (derajat)', a2I)),
    T.row(tombolMulai, tombolUlang),
    kanvas,
    status,
  );
  aturUlang();
}
