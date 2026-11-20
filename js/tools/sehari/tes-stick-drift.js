import { h as T, utils, kv } from '../../core.js';

// Tes stick drift: mengukur seberapa jauh analog stik bergeser sendiri saat
// tidak disentuh. Beda dengan Tes Gamepad (yang menampilkan semua tombol
// dan angka mentah analog): tool ini fokus mendiagnosis drift, dengan
// kalibrasi posisi diam, besar drift per stik, dan putusan aman atau tidak.
// Ambang umum: di bawah 0,08 aman, 0,08-0,15 waspada, di atas 0,15 drift.
// SKALA GAMBAR: lingkaran luar = defleksi 0,30 (diperbesar 3,3x) supaya
// geseran kecil tetap kelihatan — pada skala 1:1 zona aman 0,08 hanya
// beradius ~3,7 px dan tidak terbaca. Radius zona & posisi titik WAJIB
// dihitung dari ambang yang sama dengan putusan (radiusZona/posisiTitik),
// supaya gambar tidak pernah bertentangan dengan putusan. Lingkaran luar
// (r=46) hanya bingkai; titik & zona memakai radius plot 44 supaya titik
// di ujung skala tidak terpotong tepi.
export const AMBANG_AMAN = 0.08;
export const AMBANG_WASPADA = 0.15;
export const SKALA_MAKS = 0.3;
export const R_LUAR = 46;
export const R_PLOT = 44;
export function radiusZona(ambang) {
  return Math.round(ambang / SKALA_MAKS * R_PLOT * 10) / 10;
}
export function posisiTitik(nilai) {
  const k = Math.max(-1, Math.min(1, Number(nilai) / SKALA_MAKS));
  return 50 + k * R_PLOT;
}
export function nilaiDrift(axes, baseline) {
  const a = Array.isArray(axes) ? axes : [];
  const b = Array.isArray(baseline) ? baseline : [0, 0, 0, 0];
  const hitung = (i) => {
    const x = (Number(a[i]) || 0) - (Number(b[i]) || 0);
    const y = (Number(a[i + 1]) || 0) - (Number(b[i + 1]) || 0);
    const besar = Math.sqrt(x * x + y * y);
    return { x: Math.round(x * 1000) / 1000, y: Math.round(y * 1000) / 1000, besar: Math.round(besar * 1000) / 1000 };
  };
  const kiri = hitung(0);
  const kanan = hitung(2);
  return { kiri, kanan };
}
export function putusanDrift(besar) {
  const v = Number(besar);
  if (!isFinite(v)) return '';
  if (v < AMBANG_AMAN) return 'aman';
  if (v < AMBANG_WASPADA) return 'waspada';
  return 'drift';
}
export function labelPutusan(putusan) {
  if (putusan === 'aman') return 'Aman, tidak ada drift';
  if (putusan === 'waspada') return 'Waspada, sedikit bergeser';
  if (putusan === 'drift') return 'Drift, analog bergeser sendiri';
  return '';
}
utils.stickDrift = { nilaiDrift, putusanDrift, labelPutusan, radiusZona, posisiTitik };

export const meta = {"id": "tes-stick-drift", "name": "Tes Stick Drift", "cat": "sehari", "icon": "🕹️", "desc": "Diagnosis analog stik yang bergeser sendiri: kalibrasi posisi diam, ukur besar driftnya, dan lihat putusannya.", "keywords": "stick drift,drift analog,stik ngedrift,gamepad drift,controller drift,analog bergeser", "since": "6.19.0"};
export function render(root) {
  const info = T.el('<p class="mut" style="font-size:13px">Sambungkan stik, tekan tombol apa pun di stik, lalu jangan sentuh analognya. Tekan "Kalibrasi posisi diam" saat analog benar-benar diam, dan tool ini mengukur seberapa jauh analog bergeser sendiri.</p>');
  const statusBox = T.out();
  const visualBox = T.el('<div style="display:flex;gap:12px;flex-wrap:wrap;margin:12px 0"></div>');
  const hasilBox = T.out();
  const tombolBox = T.el('<div style="display:flex;gap:8px;flex-wrap:wrap"></div>');

  const buatLingkaran = (label) => {
    const wrap = T.el('<div style="flex:1 1 140px;text-align:center"></div>');
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '140');
    svg.setAttribute('height', '140');
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.innerHTML = '<circle cx="50" cy="50" r="' + R_LUAR + '" fill="none" stroke="rgba(127,127,127,.4)" stroke-width="1.5"/>' +
      '<circle cx="50" cy="50" r="' + radiusZona(AMBANG_AMAN) + '" fill="none" stroke="rgba(120,200,120,.7)" stroke-width="1.5"/>' +
      '<circle cx="50" cy="50" r="' + radiusZona(AMBANG_WASPADA) + '" fill="none" stroke="rgba(255,180,0,.6)" stroke-width="1.5"/>' +
      '<line x1="50" y1="4" x2="50" y2="96" stroke="rgba(127,127,127,.25)" stroke-width="1"/>' +
      '<line x1="4" y1="50" x2="96" y2="50" stroke="rgba(127,127,127,.25)" stroke-width="1"/>' +
      '<circle class="dot" cx="50" cy="50" r="5" fill="#fff"/>';
    const cap = T.el('<div style="font-size:12px;margin-top:4px">' + T.esc(label) + '</div>');
    wrap.appendChild(svg);
    wrap.appendChild(cap);
    const dot = svg.querySelector('.dot');
    return { wrap, dot };
  };
  const kiriV = buatLingkaran('Analog kiri');
  const kananV = buatLingkaran('Analog kanan');
  visualBox.appendChild(kiriV.wrap);
  visualBox.appendChild(kananV.wrap);

  let raf = null;
  let baseline = null;
  let maksKiri = 0;
  let maksKanan = 0;
  let padTerdeteksi = false;

  const gambarTitik = (v, d) => {
    const x = posisiTitik(d.x);
    const y = posisiTitik(d.y);
    v.dot.setAttribute('cx', x.toFixed(1));
    v.dot.setAttribute('cy', y.toFixed(1));
    const p = putusanDrift(d.besar);
    v.dot.setAttribute('fill', p === 'aman' ? '#7cc47f' : p === 'waspada' ? '#ffb400' : '#ff6b4a');
  };

  const loop = () => {
    raf = requestAnimationFrame(loop);
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    const pad = pads ? Array.prototype.find.call(pads, (p) => p && p.connected) : null;
    if (!pad) {
      if (padTerdeteksi) {
        padTerdeteksi = false;
        T.show(statusBox, '<p class="mut" style="font-size:13px">Stik terputus. Sambungkan lagi dan tekan tombol apa pun.</p>');
        T.hide(hasilBox);
      }
      return;
    }
    if (!padTerdeteksi) {
      padTerdeteksi = true;
      baseline = null;
      maksKiri = 0;
      maksKanan = 0;
      T.show(statusBox, kv('Stik terdeteksi', T.esc(pad.id || 'Tanpa nama')) + '<p class="mut" style="font-size:13px">Lepas kedua analog, lalu tekan "Kalibrasi posisi diam".</p>');
      tombolKalibrasi.disabled = false;
    }
    const d = nilaiDrift(pad.axes, baseline || [0, 0, 0, 0]);
    if (baseline) {
      maksKiri = Math.max(maksKiri, d.kiri.besar);
      maksKanan = Math.max(maksKanan, d.kanan.besar);
    }
    gambarTitik(kiriV, d.kiri);
    gambarTitik(kananV, d.kanan);
    if (baseline) {
      const pk = putusanDrift(d.kiri.besar);
      const pn = putusanDrift(d.kanan.besar);
      T.show(hasilBox,
        kv('Analog kiri sekarang', labelPutusan(pk) + ' (' + utils.fmtDes(d.kiri.besar, 2) + ')') +
        kv('Analog kanan sekarang', labelPutusan(pn) + ' (' + utils.fmtDes(d.kanan.besar, 2) + ')') +
        kv('Drift terbesar tercatat', 'Kiri ' + utils.fmtDes(maksKiri, 2) + ' · Kanan ' + utils.fmtDes(maksKanan, 2)) +
        '<p class="hint">Lingkaran hijau dalam = zona aman (di bawah 0,08), lingkaran kuning = zona waspada (0,08 sampai 0,15). Gambarnya diperbesar supaya geseran kecil kelihatan: lingkaran luar sama dengan geseran 0,30, jadi titik yang mentok di tepi artinya driftnya sudah besar. Titik berwarna adalah posisi analogmu sekarang. Bila titik tidak diam di tengah saat analog dilepas, stikmu drift. Coba bersihkan pangkal analog atau naikkan deadzone di pengaturan game.</p>');
    }
  };

  const tombolKalibrasi = T.btn('Kalibrasi posisi diam', () => {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    const pad = pads ? Array.prototype.find.call(pads, (p) => p && p.connected) : null;
    if (!pad) { T.toast('Belum ada stik terdeteksi'); return; }
    baseline = [pad.axes[0] || 0, pad.axes[1] || 0, pad.axes[2] || 0, pad.axes[3] || 0];
    maksKiri = 0;
    maksKanan = 0;
    T.toast('Posisi diam dikalibrasi');
    T.show(statusBox, kv('Stik terdeteksi', T.esc(pad.id || 'Tanpa nama')) + '<p class="mut" style="font-size:13px">Kalibrasi tersimpan. Jangan sentuh analog dan lihat putusannya.</p>');
  }, true, true);
  const tombolReset = T.btn('Ulangi pengukuran', () => {
    baseline = null;
    maksKiri = 0;
    maksKanan = 0;
    T.hide(hasilBox);
    T.toast('Pengukuran diulang, kalibrasi lagi');
  });
  tombolBox.appendChild(tombolKalibrasi);
  tombolBox.appendChild(tombolReset);

  const onConnect = () => T.toast('Stik tersambung');
  const onDisconnect = () => T.toast('Stik terputus');

  if (!('getGamepads' in navigator)) {
    T.show(statusBox, '<div class="big warn">Browser ini tidak bisa membaca gamepad</div><p class="mut" style="font-size:13px">Gamepad API tidak tersedia di browser ini. Coba Chrome atau Edge terbaru di laptop atau HP Android.</p>');
  } else {
    T.show(statusBox, '<p class="mut" style="font-size:13px">Belum ada stik terdeteksi. Sambungkan stik dengan kabel atau Bluetooth, lalu tekan tombol apa pun di stik. Browser baru mendeteksi stik setelah ada tombol yang ditekan.</p>');
    window.addEventListener('gamepadconnected', onConnect);
    window.addEventListener('gamepaddisconnected', onDisconnect);
    loop();
  }

  T.onLeave(() => {
    if (raf) cancelAnimationFrame(raf);
    window.removeEventListener('gamepadconnected', onConnect);
    window.removeEventListener('gamepaddisconnected', onDisconnect);
  });

  root.appendChild(info);
  root.appendChild(statusBox);
  root.appendChild(visualBox);
  root.appendChild(tombolBox);
  root.appendChild(hasilBox);
  root.appendChild(T.el('<p class="mut" style="font-size:12px">Cara sambung: kabel USB langsung paling mudah. Bluetooth: tahan tombol pairing di stik sampai lampunya berkedip, lalu pasangkan dari pengaturan Bluetooth perangkatmu. Diproses di browser, tidak ada data yang dikirim ke mana-mana.</p>'));
}
