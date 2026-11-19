import { h as T, onLeave, utils } from '../../core.js';

export const meta = { id: 'simulator-papan-galton', name: 'Simulator Papan Galton', cat: 'sains', icon: '🎲', desc: 'Jatuhkan bola melewati barisan pasak dan saksikan kurva lonceng terbentuk sendiri dari keacakan, lengkap dengan statistik live.', keywords: 'papan galton,galton board,kurva lonceng,distribusi normal,binomial,probabilitas,acak', since: '6.19.0' };

// Peluang binomial: P(k sukses dari n percobaan adil) = C(n,k) / 2^n.
export function peluangBinomial(n, k) {
  if (!Number.isInteger(n) || !Number.isInteger(k) || k < 0 || k > n) return NaN;
  let c = 1;
  for (let i = 0; i < k; i++) c = (c * (n - i)) / (i + 1);
  return c / Math.pow(2, n);
}

// Seluruh distribusi Galton: peluang tiap kotak untuk n baris pasak.
export function distribusiGalton(n) {
  const d = [];
  for (let k = 0; k <= n; k++) d.push(peluangBinomial(n, k));
  return d;
}

// Statistik dari hitungan tiap kotak: { total, rata, simpangan }.
export function statistikGalton(counts) {
  const total = counts.reduce((a, b) => a + b, 0);
  if (total === 0) return { total: 0, rata: NaN, simpangan: NaN };
  let sum = 0;
  counts.forEach((c, k) => { sum += c * k; });
  const rata = sum / total;
  let varSum = 0;
  counts.forEach((c, k) => { varSum += c * (k - rata) * (k - rata); });
  return { total, rata, simpangan: Math.sqrt(varSum / total) };
}

export function render(root) {
  const st = document.createElement('style');
  st.textContent =
    '.gl-kanvas{width:100%;height:auto;display:block;background:#0d0b09;border:1px solid rgba(255,255,255,.12);border-radius:12px;margin:12px 0}';
  root.appendChild(st);

  root.appendChild(T.el('<p class="hint">Setiap bola memantul kiri atau kanan secara acak di tiap pasak. Satu bola tidak bisa ditebak, tapi ratusan bola selalu membentuk kurva lonceng yang sama.</p>'));

  const barisSel = T.select([
    ['6', '6 baris pasak'],
    ['8', '8 baris pasak'],
    ['10', '10 baris pasak'],
    ['12', '12 baris pasak'],
  ], '10');
  const kanvas = document.createElement('canvas');
  kanvas.className = 'gl-kanvas';
  kanvas.width = 680;
  kanvas.height = 500;
  kanvas.setAttribute('role', 'img');
  kanvas.setAttribute('aria-label', 'Simulasi papan Galton dengan histogram');
  const status = T.el('<p class="hint" data-live="galton">Tekan "Jatuhkan bola" untuk memulai.</p>');

  let n = 10;
  let counts = [];
  let bolaAktif = [];
  let antrean = 0;
  let animId = null;
  let terakhir = 0;
  let totalJatuh = 0;

  const CX = 340;
  const ATAS_Y = 56;
  const LANTAI_Y = 430;

  function colGap() { return 560 / (n + 1); }
  function rowGap() { return (LANTAI_Y - 60 - ATAS_Y) / (n + 1); }
  function pegX(baris, k) { return CX + (k - baris / 2) * colGap(); }
  function pegY(baris) { return ATAS_Y + baris * rowGap(); }
  function binCenter(k) { return CX + (k - n / 2) * colGap(); }

  function aturUlang() {
    n = Number(barisSel.value);
    counts = Array(n + 1).fill(0);
    bolaAktif = [];
    antrean = 0;
    totalJatuh = 0;
    perbaruiStatus();
    gambar();
  }

  function buatBola() {
    // Jalan tiap bola ditentukan dulu: n keputusan kiri/kanan acak.
    const jalan = [];
    for (let r = 0; r < n; r++) jalan.push(Math.random() < 0.5 ? 0 : 1);
    return {
      baris: 0, // baris pasak berikutnya yang dituju
      kanan: 0,
      jalan,
      x: CX,
      y: ATAS_Y - 24,
      x0: CX,
      y0: ATAS_Y - 24,
      tx: CX,
      ty: ATAS_Y,
      t: 0,
      dur: 0.12,
      jatuh: false,
      vy: 0,
      bin: jalan.reduce((a, b) => a + b, 0),
    };
  }

  function perbaruiStatus() {
    const stt = statistikGalton(counts);
    const rataHarap = n / 2;
    const simpanganHarap = Math.sqrt(n / 4);
    status.setAttribute('data-total', String(totalJatuh));
    status.setAttribute('data-aktif', String(bolaAktif.length + antrean));
    status.textContent = totalJatuh === 0
      ? 'Belum ada bola yang jatuh. Harapan teori: rata-rata kotak ' + utils.fmtDes(rataHarap, 1) + ', simpangan baku ' + utils.fmtDes(simpanganHarap, 2) + '.'
      : 'Bola jatuh: ' + totalJatuh + '. Rata-rata kotak: ' + utils.fmtDes(stt.rata, 2) + ' (teori ' + utils.fmtDes(rataHarap, 1) + '). Simpangan baku: ' + utils.fmtDes(stt.simpangan, 2) + ' (teori ' + utils.fmtDes(simpanganHarap, 2) + ').';
  }

  function gambar() {
    const ctx = kanvas.getContext('2d');
    ctx.clearRect(0, 0, kanvas.width, kanvas.height);
    ctx.fillStyle = '#0d0b09';
    ctx.fillRect(0, 0, kanvas.width, kanvas.height);
    const cg = colGap();
    // Pasak
    ctx.fillStyle = '#e8ded0';
    for (let r = 0; r < n; r++) {
      for (let k = 0; k <= r; k++) {
        ctx.beginPath();
        ctx.arc(pegX(r, k), pegY(r), 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // Pembatas kotak
    ctx.strokeStyle = 'rgba(255,255,255,.25)';
    ctx.lineWidth = 1;
    const binAtas = LANTAI_Y - 60;
    for (let k = 0; k <= n + 1; k++) {
      const x = CX + (k - (n + 1) / 2) * cg;
      ctx.beginPath();
      ctx.moveTo(x, binAtas);
      ctx.lineTo(x, LANTAI_Y);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(CX - ((n + 1) / 2) * cg, LANTAI_Y);
    ctx.lineTo(CX + ((n + 1) / 2) * cg, LANTAI_Y);
    ctx.stroke();
    // Histogram
    const maks = Math.max(1, ...counts);
    const skalaY = 58 / maks;
    ctx.fillStyle = '#ff6f61';
    for (let k = 0; k <= n; k++) {
      const h = counts[k] * skalaY;
      if (h <= 0) continue;
      const x = binCenter(k) - cg / 2 + 2;
      ctx.fillRect(x, LANTAI_Y - h, cg - 4, h);
    }
    // Kurva harapan teori (titik putih) bila sudah ada bola
    if (totalJatuh > 0) {
      const dist = distribusiGalton(n);
      ctx.fillStyle = 'rgba(255,255,255,.85)';
      for (let k = 0; k <= n; k++) {
        const harap = dist[k] * totalJatuh * skalaY;
        ctx.beginPath();
        ctx.arc(binCenter(k), LANTAI_Y - harap, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // Bola aktif
    for (const b of bolaAktif) {
      ctx.fillStyle = '#ffd166';
      ctx.beginPath();
      ctx.arc(b.x, b.y, 6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#a89c88';
    ctx.font = '12px sans-serif';
    ctx.fillText('Batang coral: hasil nyata. Titik putih: kurva teori binomial.', 12, kanvas.height - 12);
  }

  function putar(now) {
    const dt = Math.min(0.05, (now - terakhir) / 1000);
    terakhir = now;
    // Keluarkan bola dari antrean, maks 3 per frame dan maks 60 aktif.
    let keluar = 0;
    while (antrean > 0 && bolaAktif.length < 60 && keluar < 3) {
      bolaAktif.push(buatBola());
      antrean--;
      keluar++;
    }
    const sisa = [];
    for (const b of bolaAktif) {
      if (!b.jatuh) {
        b.t += dt / b.dur;
        if (b.t >= 1) {
          b.x = b.tx;
          b.y = b.ty;
          b.kanan += b.jalan[b.baris];
          b.baris++;
          if (b.baris >= n) {
            b.jatuh = true;
            b.vy = 0;
          } else {
            b.t = 0;
            b.tx = pegX(b.baris, b.kanan);
            b.ty = pegY(b.baris);
            // Interpolasi mulus: dari posisi sekarang ke pasak berikutnya.
            b.x0 = b.x;
            b.y0 = b.y;
          }
        } else {
          const e = b.t < 0.5 ? 2 * b.t * b.t : 1 - Math.pow(-2 * b.t + 2, 2) / 2;
          const x0 = b.x0 == null ? b.x : b.x0;
          const y0 = b.y0 == null ? b.y : b.y0;
          b.x = x0 + (b.tx - x0) * e;
          b.y = y0 + (b.ty - y0) * e;
        }
        sisa.push(b);
      } else {
        // Jatuh bebas ke kotak.
        b.vy += 1400 * dt;
        b.y += b.vy * dt;
        const targetX = binCenter(b.bin);
        b.x += (targetX - b.x) * Math.min(1, dt * 6);
        if (b.y >= LANTAI_Y - 6) {
          counts[b.bin]++;
          totalJatuh++;
        } else {
          sisa.push(b);
        }
      }
    }
    bolaAktif = sisa;
    gambar();
    perbaruiStatus();
    if (bolaAktif.length > 0 || antrean > 0) {
      animId = requestAnimationFrame(putar);
    } else {
      animId = null;
    }
  }

  function mulaiLoop() {
    if (animId) return;
    terakhir = performance.now();
    animId = requestAnimationFrame(putar);
  }

  function jatuhkan(jumlah) {
    antrean += jumlah;
    mulaiLoop();
  }

  barisSel.addEventListener('change', aturUlang);

  onLeave(() => { if (animId) cancelAnimationFrame(animId); });

  root.append(
    T.field('Jumlah baris pasak', barisSel),
    T.row(
      T.btn('Jatuhkan 1 bola', () => jatuhkan(1), true),
      T.btn('Jatuhkan 50 bola', () => jatuhkan(50)),
      T.btn('Jatuhkan 500 bola', () => jatuhkan(500)),
      T.btn('Ulangi', aturUlang),
    ),
    kanvas,
    status,
  );
  aturUlang();
}
