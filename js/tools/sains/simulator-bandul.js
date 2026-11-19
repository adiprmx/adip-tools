import { h as T, onLeave, utils } from '../../core.js';

export const meta = { id: 'simulator-bandul', name: 'Simulator Bandul', cat: 'sains', icon: '🕰️', desc: 'Ayunkan bandul dengan panjang dan sudut mana pun di gravitasi mana pun, lalu bandingkan periode terukurnya dengan rumus.', keywords: 'bandul,pendulum,periode,ayunan,gravitasi,osilasi,fisika', since: '6.19.0' };

// Periode bandul sudut kecil (detik): T = 2 pi sqrt(L/g).
export function periodeBandul(L, g) {
  if (!(L > 0) || !(g > 0)) return NaN;
  return 2 * Math.PI * Math.sqrt(L / g);
}

// Periode dengan koreksi sudut besar (deret eliptik sampai orde 6).
export function periodeSudutBesar(L, g, theta0) {
  const t0 = periodeBandul(L, g);
  if (!isFinite(t0)) return NaN;
  const x = theta0 * theta0;
  return t0 * (1 + x / 16 + (11 * x * x) / 3072 + (173 * x * x * x) / 737280);
}

// Satu langkah integrasi RK4 untuk bandul sederhana. s = { th, om }.
export function langkahBandul(s, dt, L, g) {
  const acc = (th) => (-g / L) * Math.sin(th);
  const k1th = s.om, k1om = acc(s.th);
  const k2th = s.om + 0.5 * dt * k1om, k2om = acc(s.th + 0.5 * dt * k1th);
  const k3th = s.om + 0.5 * dt * k2om, k3om = acc(s.th + 0.5 * dt * k2th);
  const k4th = s.om + dt * k3om, k4om = acc(s.th + dt * k3th);
  return {
    th: s.th + (dt / 6) * (k1th + 2 * k2th + 2 * k3th + k4th),
    om: s.om + (dt / 6) * (k1om + 2 * k2om + 2 * k3om + k4om),
  };
}

export function render(root) {
  const st = document.createElement('style');
  st.textContent =
    '.bd-kanvas{width:100%;height:auto;display:block;background:#0d0b09;border:1px solid rgba(255,255,255,.12);border-radius:12px;margin:12px 0}';
  root.appendChild(st);

  root.appendChild(T.el('<p class="hint">Periode bandul hanya ditentukan panjang tali dan gravitasi, bukan massa bandulnya. Coba ubah massanya: periodenya tetap sama.</p>'));

  const panjangI = T.input('number', 'mis. 1', '1');
  const sudutI = T.input('number', 'mis. 30', '30');
  const massaI = T.input('number', 'mis. 1', '1');
  const gravSel = T.select([
    ['9.81', 'Bumi (9,81 m/s²)'],
    ['1.62', 'Bulan (1,62 m/s²)'],
    ['3.71', 'Mars (3,71 m/s²)'],
    ['24.79', 'Jupiter (24,79 m/s²)'],
    ['274', 'Matahari (274 m/s²)'],
  ], '9.81');
  const kanvas = document.createElement('canvas');
  kanvas.className = 'bd-kanvas';
  kanvas.width = 680;
  kanvas.height = 420;
  kanvas.setAttribute('role', 'img');
  kanvas.setAttribute('aria-label', 'Simulasi bandul berayun');
  const box = T.out();
  const status = T.el('<p class="hint" data-live="bandul">Tekan "Mulai ayunan" untuk memulai.</p>');

  let animId = null;
  let berjalan = false;
  let s = { th: 0, om: 0 };
  let waktu = 0;
  let terakhir = 0;
  let lintasanTerakhir = null;
  let periodeTerukur = [];

  const pivotX = 340, pivotY = 60;
  const skalaPx = 150; // 1 meter = 150 px

  function bacaParam() {
    return {
      L: T.num(panjangI.value),
      sudut: T.num(sudutI.value),
      massa: T.num(massaI.value),
      g: Number(gravSel.value),
    };
  }

  function aturUlang() {
    const p = bacaParam();
    if (!(p.L > 0) || p.L > 2.5) { T.toast('Panjang talinya 0,1 sampai 2,5 meter'); return false; }
    if (!isFinite(p.sudut) || p.sudut < 1 || p.sudut > 170) { T.toast('Sudut awalnya 1 sampai 170 derajat'); return false; }
    if (!isFinite(p.massa) || p.massa <= 0) { T.toast('Massanya harus lebih dari 0'); return false; }
    s = { th: (p.sudut * Math.PI) / 180, om: 0 };
    waktu = 0;
    lintasanTerakhir = null;
    periodeTerukur = [];
    gambar();
    perbaruiStatus();
    return true;
  }

  function perbaruiStatus() {
    const p = bacaParam();
    const t0 = periodeBandul(p.L, p.g);
    const tBesar = periodeSudutBesar(p.L, p.g, (p.sudut * Math.PI) / 180);
    const terukur = periodeTerukur.length
      ? utils.fmtDes(periodeTerukur.reduce((a, b) => a + b, 0) / periodeTerukur.length, 3) + ' detik (' + periodeTerukur.length + ' ayunan terukur)'
      : 'belum ada ayunan penuh';
    status.setAttribute('data-periode', periodeTerukur.length ? String(periodeTerukur.reduce((a, b) => a + b, 0) / periodeTerukur.length) : '');
    status.textContent = 'Sudut sekarang: ' + utils.fmtDes((s.th * 180) / Math.PI, 1) + '°. Periode rumus: ' + utils.fmtDes(t0, 3) + ' detik. Koreksi sudut besar: ' + utils.fmtDes(tBesar, 3) + ' detik. Periode terukur: ' + terukur + '.';
  }

  function gambar() {
    const ctx = kanvas.getContext('2d');
    const p = bacaParam();
    const Lpx = Math.min(p.L > 0 ? p.L * skalaPx : 150, 330);
    const bx = pivotX + Lpx * Math.sin(s.th);
    const by = pivotY + Lpx * Math.cos(s.th);
    const rBob = 10 + Math.min(isFinite(p.massa) ? p.massa : 1, 10) * 1.5;
    ctx.clearRect(0, 0, kanvas.width, kanvas.height);
    ctx.fillStyle = '#0d0b09';
    ctx.fillRect(0, 0, kanvas.width, kanvas.height);
    // Garis acuan vertikal
    ctx.strokeStyle = 'rgba(255,255,255,.15)';
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.moveTo(pivotX, pivotY);
    ctx.lineTo(pivotX, pivotY + 340);
    ctx.stroke();
    ctx.setLineDash([]);
    // Busur sudut awal
    ctx.strokeStyle = 'rgba(255,255,255,.25)';
    ctx.beginPath();
    ctx.arc(pivotX, pivotY, 60, -Math.PI / 2, -Math.PI / 2 + (p.sudut * Math.PI) / 180);
    ctx.stroke();
    // Tali
    ctx.strokeStyle = '#e8ded0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(pivotX, pivotY);
    ctx.lineTo(bx, by);
    ctx.stroke();
    // Poros
    ctx.fillStyle = '#e8ded0';
    ctx.beginPath();
    ctx.arc(pivotX, pivotY, 5, 0, Math.PI * 2);
    ctx.fill();
    // Bandul
    const grad = ctx.createRadialGradient(bx - 5, by - 5, 2, bx, by, rBob);
    grad.addColorStop(0, '#ff8a7a');
    grad.addColorStop(1, '#ff6f61');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(bx, by, rBob, 0, Math.PI * 2);
    ctx.fill();
  }

  function putar(now) {
    if (!berjalan) return;
    const dtNyata = Math.min(0.05, (now - terakhir) / 1000);
    terakhir = now;
    const p = bacaParam();
    const sub = 24;
    const dt = dtNyata / sub;
    for (let i = 0; i < sub; i++) {
      const thLama = s.th;
      s = langkahBandul(s, dt, p.L, p.g);
      waktu += dt;
      // Lintasan bawah (th melewati 0 ke arah mana pun): dua lintasan
      // berurutan berjarak setengah periode, jadi periode = 2 x selisihnya.
      // Ini membuat pengukuran pertama muncul sesudah ~1,5 ayunan, bukan 2,5.
      if ((thLama < 0 && s.th >= 0) || (thLama > 0 && s.th <= 0)) {
        if (lintasanTerakhir != null) {
          periodeTerukur.push(2 * (waktu - lintasanTerakhir));
          if (periodeTerukur.length > 5) periodeTerukur.shift();
        }
        lintasanTerakhir = waktu;
      }
    }
    gambar();
    perbaruiStatus();
    animId = requestAnimationFrame(putar);
  }

  const tombolMulai = T.btn('Mulai ayunan', () => {
    if (berjalan) {
      berjalan = false;
      if (animId) cancelAnimationFrame(animId);
      animId = null;
      tombolMulai.textContent = 'Lanjutkan ayunan';
      return;
    }
    if (waktu === 0 && s.om === 0 && !aturUlang()) return;
    berjalan = true;
    terakhir = performance.now();
    tombolMulai.textContent = 'Jeda';
    animId = requestAnimationFrame(putar);
  }, true);

  const tombolUlang = T.btn('Atur ulang', () => {
    berjalan = false;
    if (animId) cancelAnimationFrame(animId);
    animId = null;
    tombolMulai.textContent = 'Mulai ayunan';
    aturUlang();
  });

  function hitung() {
    const p = bacaParam();
    if (!(p.L > 0) || p.L > 2.5) { T.toast('Panjang talinya 0,1 sampai 2,5 meter'); return; }
    if (!isFinite(p.sudut) || p.sudut < 1 || p.sudut > 170) { T.toast('Sudut awalnya 1 sampai 170 derajat'); return; }
    if (!isFinite(p.massa) || p.massa <= 0) { T.toast('Massanya harus lebih dari 0'); return; }
    const t0 = periodeBandul(p.L, p.g);
    const tBesar = periodeSudutBesar(p.L, p.g, (p.sudut * Math.PI) / 180);
    T.show(box,
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:8px 0">' +
      '<div class="kv"><span class="k">Periode (sudut kecil)</span><span class="v">' + utils.fmtDes(t0, 3) + ' detik</span></div>' +
      '<div class="kv"><span class="k">Periode (sudut ' + utils.fmtDes(p.sudut, 0) + '°)</span><span class="v">' + utils.fmtDes(tBesar, 3) + ' detik</span></div>' +
      '<div class="kv"><span class="k">Frekuensi</span><span class="v">' + utils.fmtDes(1 / t0, 3) + ' Hz</span></div>' +
      '<div class="kv"><span class="k">Ayunan per menit</span><span class="v">' + utils.fmtDes(60 / t0, 1) + '×</span></div>' +
      '</div>' +
      '<p class="hint">Rumus sudut kecil (T = 2π√(L/g)) menganggap sudutnya kecil. Pada sudut ' + utils.fmtDes(p.sudut, 0) + '°, periode sebenarnya lebih lama ' + utils.fmtDes((tBesar / t0 - 1) * 100, 1) + '% dari rumus itu. Massa bandul tidak masuk rumus sama sekali.</p>');
  }

  onLeave(() => { berjalan = false; if (animId) cancelAnimationFrame(animId); });

  root.append(
    T.grid2(T.field('Panjang tali (meter)', panjangI), T.field('Sudut awal (derajat)', sudutI)),
    T.grid2(T.field('Massa bandul (kg)', massaI), T.field('Gravitasi', gravSel)),
    T.row(T.btn('Hitung periodenya', hitung, true), tombolMulai, tombolUlang),
    box,
    kanvas,
    status,
  );
  aturUlang();
}
