import { h as T, onLeave } from '../../core.js';

export const meta = { id: 'simulator-gravitasi', name: 'Simulator Gravitasi', cat: 'sains', icon: '🌍', desc: 'Hitung gaya tarik antara dua benda, lalu lihat satelit mengorbit planet di layar.', keywords: 'gravitasi,gaya tarik,newton,orbit,satelit,planet,massa,bumi,bulan', since: '6.17.0' };

export const G = 6.674e-11; // tetapan gravitasi, m^3 kg^-1 s^-2

// Gaya gravitasi Newton: F = G m1 m2 / r^2.
export function gayaGravitasi(m1, m2, r) {
  if (!(m1 > 0) || !(m2 > 0) || !(r > 0)) return NaN;
  return G * m1 * m2 / (r * r);
}

// Kecepatan orbit melingkar: v = sqrt(G M / r).
export function kecepatanOrbit(M, r) {
  return Math.sqrt(G * M / r);
}

// Periode orbit melingkar: T = 2 pi sqrt(r^3 / G M).
export function periodeOrbit(M, r) {
  return 2 * Math.PI * Math.sqrt(r * r * r / (G * M));
}

function fmtIlmiah(v) {
  if (!isFinite(v)) return 'di luar jangkauan';
  if (v === 0) return '0';
  const abs = Math.abs(v);
  if (abs >= 0.01 && abs < 10000) return String(Math.round(v * 1000) / 1000).replace('.', ',');
  const e = v.toExponential(2).split('e');
  return e[0].replace('.', ',') + ' × 10^' + parseInt(e[1], 10);
}

function fmtNum(v, des) {
  if (!isFinite(v)) return 'di luar jangkauan';
  const r = Math.round(v * Math.pow(10, des == null ? 2 : des)) / Math.pow(10, des == null ? 2 : des);
  return String(r).replace('.', ',');
}

export function render(root) {
  const st = document.createElement('style');
  st.textContent =
    '.gv-kanvas{width:100%;height:auto;display:block;background:#0d0b09;border:1px solid rgba(255,255,255,.12);border-radius:12px;margin:12px 0}';
  root.appendChild(st);

  root.appendChild(T.el('<p class="hint">Semua benda saling tarik-menarik. Makin besar massanya dan makin dekat jaraknya, makin kuat tarikannya.</p>'));

  // ---- Bagian 1: gaya antara dua benda ----
  const m1I = T.input('text', 'mis. 5,97e24', '5.97e24');
  const m2I = T.input('text', 'mis. 7,35e22', '7.35e22');
  const rI = T.input('text', 'mis. 384400000', '384400000');
  const contohSel = T.select([
    ['bumi-bulan', 'Bumi dan Bulan'],
    ['bumi-matahari', 'Bumi dan Matahari'],
    ['apel-bumi', 'Apel 200 gram dan Bumi'],
    ['dua-orang', 'Dua orang 70 kg, jarak 1 meter'],
    ['bebas', 'Isi sendiri'],
  ], 'bumi-bulan');
  const boxGaya = T.out();

  const CONTOH = {
    'bumi-bulan': ['5.97e24', '7.35e22', '384400000'],
    'bumi-matahari': ['5.97e24', '1.99e30', '149600000000'],
    'apel-bumi': ['0.2', '5.97e24', '6371000'],
    'dua-orang': ['70', '70', '1'],
  };
  contohSel.addEventListener('change', () => {
    const c = CONTOH[contohSel.value];
    if (c) { m1I.value = c[0]; m2I.value = c[1]; rI.value = c[2]; hitungGaya(); }
  });

  function bacaIlmiah(s) {
    const t = String(s || '').trim().replace(',', '.').replace(/×\s*10\^?/i, 'e').replace(/\s+/g, '');
    return Number(t);
  }

  function hitungGaya() {
    const m1 = bacaIlmiah(m1I.value), m2 = bacaIlmiah(m2I.value), r = bacaIlmiah(rI.value);
    if (!(m1 > 0)) { T.toast('Massa benda pertama harus lebih dari 0'); return; }
    if (!(m2 > 0)) { T.toast('Massa benda kedua harus lebih dari 0'); return; }
    if (!(r > 0)) { T.toast('Jaraknya harus lebih dari 0'); return; }
    const F = gayaGravitasi(m1, m2, r);
    // Bandingkan dengan berat benda pertama di Bumi (m g) supaya kebayang.
    T.show(boxGaya,
      '<p class="big">Gaya tariknya: ' + fmtIlmiah(F) + ' newton</p>' +
      '<p class="hint">Cara hitungnya: 6,674 × 10^-11 × ' + fmtIlmiah(m1) + ' × ' + fmtIlmiah(m2) + ' ÷ (' + fmtIlmiah(r) + ')².</p>' +
      '<p class="hint">Kalau jaraknya dibuat 2 kali lipat, gayanya jadi seperempatnya. Kalau massanya dibuat 2 kali lipat, gayanya ikut 2 kali lipat.</p>');
  }

  // ---- Bagian 2: simulasi orbit ----
  const kanvas = document.createElement('canvas');
  kanvas.className = 'gv-kanvas';
  kanvas.width = 680;
  kanvas.height = 420;
  kanvas.setAttribute('role', 'img');
  kanvas.setAttribute('aria-label', 'Simulasi satelit mengorbit planet');
  const kecSel = T.select([
    ['1', 'Pas (orbit melingkar)'],
    ['0.7', 'Terlalu pelan (jatuh ke planet)'],
    ['1.3', 'Terlalu cepat (orbit lonjong)'],
    ['1.5', 'Sangat cepat (lepas dari orbit)'],
  ], '1');
  const boxOrbit = T.out();
  let animId = null;
  let satelit = null;

  const PLANET_R = 28; // px
  const ORBIT_R = 150; // px
  // Skala simulasi: planet bermassa Bumi, orbit 150 px = 7.000 km dari pusat.
  const M_BUMI = 5.97e24;
  const R_ORBIT_M = 7000000;

  function mulaiOrbit() {
    if (animId) cancelAnimationFrame(animId);
    const faktor = parseFloat(kecSel.value);
    const v0 = kecepatanOrbit(M_BUMI, R_ORBIT_M) * faktor;
    const T0 = periodeOrbit(M_BUMI, R_ORBIT_M);
    // Keadaan dalam satuan simulasi: 1 px = R_ORBIT_M / ORBIT_R meter.
    const skala = R_ORBIT_M / ORBIT_R;
    const cx = kanvas.width / 2, cy = kanvas.height / 2;
    satelit = {
      x: cx + ORBIT_R, y: cy,
      vx: 0, vy: -v0 / skala, // px per detik simulasi
      jejak: [],
      hidup: true,
      waktu: 0,
      putaran: 0,
      sudutTerakhir: 0,
    };
    // Langkah integrasi: 1 detik nyata = T0/12 detik simulasi (satu putaran ~12 detik).
    const dtSim = T0 / 12 / 60;
    const mu = G * M_BUMI / (skala * skala * skala); // px^3/s^2
    let terakhir = performance.now();
    const putar = (now) => {
      const dtNyata = Math.min(0.05, (now - terakhir) / 1000);
      terakhir = now;
      const sub = 60;
      const dt = dtSim * dtNyata * 60 / sub;
      for (let s = 0; s < sub && satelit.hidup; s++) {
        const dx = cx - satelit.x, dy = cy - satelit.y;
        const r = Math.sqrt(dx * dx + dy * dy);
        if (r < PLANET_R) { satelit.hidup = false; break; }
        if (r > kanvas.width) { satelit.hidup = false; satelit.lepas = true; break; }
        const a = mu / (r * r);
        // Semi-implicit Euler: perbarui kecepatan dulu, baru posisi.
        satelit.vx += a * (dx / r) * dt;
        satelit.vy += a * (dy / r) * dt;
        satelit.x += satelit.vx * dt;
        satelit.y += satelit.vy * dt;
        satelit.waktu += dt;
        const sudut = Math.atan2(satelit.y - cy, satelit.x - cx);
        if (satelit.sudutTerakhir > Math.PI / 2 && sudut < -Math.PI / 2) satelit.putaran++;
        satelit.sudutTerakhir = sudut;
      }
      satelit.jejak.push([satelit.x, satelit.y]);
      if (satelit.jejak.length > 900) satelit.jejak.shift();
      gambarOrbit();
      if (satelit.hidup) animId = requestAnimationFrame(putar);
      else {
        animId = null;
        T.show(boxOrbit, '<p>' + (satelit.lepas
          ? 'Satelitnya lepas dari orbit dan menjauh. Kecepatannya melewati kecepatan lepas planet.'
          : 'Satelitnya jatuh ke planet. Kecepatannya terlalu pelan untuk bertahan di orbit.') + '</p>');
      }
    };
    T.show(boxOrbit,
      '<p>Kecepatan awal satelit: ' + fmtNum(v0) + ' m/s. Kecepatan orbit melingkar di ketinggian ini: ' + fmtNum(kecepatanOrbit(M_BUMI, R_ORBIT_M)) + ' m/s. Satu putaran penuh: ' + fmtNum(T0 / 60, 1) + ' menit.</p>');
    animId = requestAnimationFrame(putar);
  }

  function gambarOrbit() {
    const ctx = kanvas.getContext('2d');
    const W = kanvas.width, H = kanvas.height;
    const cx = W / 2, cy = H / 2;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0d0b09';
    ctx.fillRect(0, 0, W, H);
    // Bintang latar (tetap, dari seed sederhana)
    ctx.fillStyle = 'rgba(255,255,255,.5)';
    for (let i = 0; i < 60; i++) {
      const x = (i * 97 + 31) % W, y = (i * 57 + 13) % H;
      ctx.fillRect(x, y, 1.5, 1.5);
    }
    // Jejak
    if (satelit && satelit.jejak.length > 1) {
      ctx.strokeStyle = 'rgba(255,111,97,.6)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      satelit.jejak.forEach(([x, y], i) => { if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); });
      ctx.stroke();
    }
    // Planet
    const grad = ctx.createRadialGradient(cx - 8, cy - 8, 4, cx, cy, PLANET_R);
    grad.addColorStop(0, '#7fb3e8');
    grad.addColorStop(1, '#2b5aa0');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, PLANET_R, 0, Math.PI * 2);
    ctx.fill();
    // Satelit
    if (satelit && satelit.hidup) {
      ctx.fillStyle = '#ffd166';
      ctx.beginPath();
      ctx.arc(satelit.x, satelit.y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e8ded0';
      ctx.font = '12px sans-serif';
      ctx.fillText('Putaran: ' + satelit.putaran, 12, 20);
    }
    if (!satelit) {
      ctx.fillStyle = '#a89c88';
      ctx.font = '15px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Tekan "Luncurkan satelit" untuk mulai.', W / 2, H - 20);
      ctx.textAlign = 'left';
    }
  }

  onLeave(() => { if (animId) cancelAnimationFrame(animId); });

  root.append(
    T.el('<p style="font-weight:700;font-size:16px;margin:0 0 4px">Gaya tarik dua benda</p>'),
    T.field('Contoh siap pakai', contohSel),
    T.field('Massa benda pertama (kg)', m1I, 'Boleh pakai notasi ilmiah, misal 5,97e24.'),
    T.field('Massa benda kedua (kg)', m2I),
    T.field('Jarak antara pusat kedua benda (meter)', rI),
    T.btn('Hitung gayanya', hitungGaya, true),
    boxGaya,
    T.el('<hr style="border:none;border-top:1px solid var(--line-soft);margin:24px 0">'),
    T.el('<p style="font-weight:700;font-size:16px;margin:0 0 4px">Satelit mengorbit planet</p>'),
    T.el('<p class="hint">Satelit diluncurkan dari ketinggian 629 km di atas permukaan planet seukuran Bumi. Coba kecepatan yang berbeda dan lihat apa yang terjadi.</p>'),
    T.field('Kecepatan awal satelit', kecSel),
    T.btn('Luncurkan satelit', mulaiOrbit, true),
    kanvas,
    boxOrbit,
  );
  gambarOrbit();
}
