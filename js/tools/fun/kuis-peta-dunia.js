import { h as T, utils } from '../../core.js';

// Kuis Peta Dunia: tebak negara di peta titik dunia. Dua mode:
// tebak titik (nama negara ditanya, pilih 1 dari 4 titik di peta) dan
// tebak nama (satu titik ditandai, pilih namanya dari 4 pilihan).
// Peta memakai proyeksi equirectangular sederhana: titik-titik negara
// (koordinat ibu kota, perkiraan) di atas garis bujur/lintang, dengan
// label benua. Bukan peta negara yang akurat, dan itu ditulis jelas
// di UI. Bank: 65 negara.
export const meta = {"id": "kuis-peta-dunia", "name": "Kuis Peta Dunia", "cat": "fun", "icon": "🌍", "desc": "Tebak negara di peta dunia: 10 ronde, dua mode, dari 65 negara. Skor terbaikmu tersimpan di HP ini.", "keywords": "kuis,peta,dunia,negara,geografi,tebak negara,peta dunia", "since": "6.19.0"};

// [nama, lintang, bujur] ibu kota (perkiraan, cukup untuk kuis peta).
export const NEGARA = [
  ['Indonesia', -6.2, 106.8], ['Malaysia', 3.1, 101.7], ['Singapura', 1.35, 103.8],
  ['Thailand', 13.75, 100.5], ['Vietnam', 21.0, 105.85], ['Filipina', 14.6, 121.0],
  ['Jepang', 35.7, 139.7], ['Korea Selatan', 37.5, 127.0], ['Tiongkok', 39.9, 116.4],
  ['India', 28.6, 77.2], ['Pakistan', 33.7, 73.05], ['Bangladesh', 23.8, 90.4],
  ['Nepal', 27.7, 85.3], ['Sri Lanka', 6.9, 79.9], ['Myanmar', 19.75, 96.1],
  ['Kamboja', 11.55, 104.9], ['Laos', 18.0, 102.6], ['Mongolia', 47.9, 106.9],
  ['Australia', -35.3, 149.1], ['Selandia Baru', -41.3, 174.8],
  ['Inggris', 51.5, -0.12], ['Irlandia', 53.35, -6.26], ['Prancis', 48.85, 2.35],
  ['Jerman', 52.52, 13.4], ['Belanda', 52.37, 4.9], ['Belgia', 50.85, 4.35],
  ['Swiss', 46.95, 7.45], ['Austria', 48.2, 16.37], ['Italia', 41.9, 12.5],
  ['Spanyol', 40.42, -3.7], ['Portugal', 38.7, -9.14], ['Yunani', 37.98, 23.73],
  ['Turki', 39.93, 32.86], ['Polandia', 52.23, 21.0], ['Ceko', 50.08, 14.42],
  ['Swedia', 59.33, 18.07], ['Norwegia', 59.91, 10.75], ['Denmark', 55.68, 12.57],
  ['Finlandia', 60.17, 24.94], ['Rusia', 55.75, 37.62], ['Ukraina', 50.45, 30.52],
  ['Mesir', 30.06, 31.25], ['Nigeria', 9.06, 7.49], ['Kenya', -1.29, 36.82],
  ['Ethiopia', 9.03, 38.74], ['Afrika Selatan', -25.75, 28.19], ['Maroko', 34.02, -6.84],
  ['Ghana', 5.6, -0.19], ['Madagaskar', -18.88, 47.51],
  ['Arab Saudi', 24.71, 46.68], ['UEA', 24.45, 54.38], ['Israel', 31.77, 35.21],
  ['Iran', 35.69, 51.42], ['Irak', 33.31, 44.36],
  ['Kanada', 45.42, -75.7], ['Amerika Serikat', 38.9, -77.04], ['Meksiko', 19.43, -99.13],
  ['Brasil', -15.79, -47.88], ['Argentina', -34.6, -58.38], ['Chili', -33.45, -70.66],
  ['Peru', -12.05, -77.04], ['Kolombia', 4.71, -74.07], ['Kuba', 23.11, -82.37],
  ['Islandia', 64.15, -21.94], ['Kazakhstan', 51.13, 71.43],
];
export const TOTAL_RONDE = 10;
const LS_KEY = 'kuis-peta-dunia-best';
const W = 340, H = 170;

// Proyeksi equirectangular ke kanvas W x H. Murni.
export function proyeksi(lat, lng) {
  return { x: ((lng + 180) / 360) * W, y: ((90 - lat) / 180) * H };
}

// Jarak sudut kasar antar dua titik (derajat). Murni.
export function jarakSudut(a, b) {
  const dLat = a[1] - b[1];
  const dLng = (a[2] - b[2]) * Math.cos(((a[1] + b[1]) / 2) * Math.PI / 180);
  return Math.sqrt(dLat * dLat + dLng * dLng);
}

// 3 pengecoh untuk jawaban: diusahakan berjauhan dari jawaban dan
// satu sama lain (minimal 12 derajat), fallback acak. Murni.
export function pilihPengecoh(jawaban, rng) {
  const acak = typeof rng === 'function' ? rng : Math.random;
  const calon = NEGARA.filter((n) => n[0] !== jawaban[0]);
  const jauh = calon.filter((n) => jarakSudut(n, jawaban) >= 12);
  const pool = jauh.length >= 3 ? jauh : calon;
  const hasil = [];
  const sisa = pool.slice();
  while (hasil.length < 3 && sisa.length) {
    const i = Math.floor(acak() * sisa.length);
    const ambil = sisa.splice(i, 1)[0];
    if (hasil.every((h) => jarakSudut(h, ambil) >= 12)) hasil.push(ambil);
    else if (sisa.length === 0) hasil.push(ambil);
  }
  while (hasil.length < 3) {
    const n = calon[Math.floor(acak() * calon.length)];
    if (!hasil.includes(n)) hasil.push(n);
  }
  return hasil;
}

// Susun 10 ronde unik. Murni (rng bisa di-inject).
export function susunRonde(rng) {
  const acak = typeof rng === 'function' ? rng : Math.random;
  const salin = NEGARA.slice();
  for (let i = salin.length - 1; i > 0; i--) {
    const j = Math.floor(acak() * (i + 1));
    const t = salin[i]; salin[i] = salin[j]; salin[j] = t;
  }
  return salin.slice(0, TOTAL_RONDE);
}

const BENUA = [
  ['AMERIKA UTARA', -100, 55], ['AMERIKA SELATAN', -60, -20],
  ['EROPA', 15, 60], ['AFRIKA', 20, 5], ['ASIA', 90, 50], ['OSEANIA', 140, -30],
];

function petaSvg(titikSorot) {
  let s = '<svg viewBox="0 0 ' + W + ' ' + H + '" style="width:100%;height:auto;display:block;background:#ffffff08;border:1px solid rgba(255,255,255,.14);border-radius:12px" role="img" aria-label="Peta titik dunia">';
  for (let g = -150; g <= 150; g += 30) {
    const x = ((g + 180) / 360) * W;
    s += '<line x1="' + x + '" y1="0" x2="' + x + '" y2="' + H + '" stroke="rgba(255,255,255,.07)"/>';
  }
  for (let g = -60; g <= 60; g += 30) {
    const y = ((90 - g) / 180) * H;
    s += '<line x1="0" y1="' + y + '" x2="' + W + '" y2="' + y + '" stroke="rgba(255,255,255,.07)"/>';
  }
  for (const [nama, lng, lat] of BENUA) {
    const p = proyeksi(lat, lng);
    s += '<text x="' + p.x + '" y="' + p.y + '" fill="rgba(255,255,255,.28)" font-size="7" text-anchor="middle" font-family="system-ui,sans-serif" letter-spacing="1">' + nama + '</text>';
  }
  for (const n of NEGARA) {
    const p = proyeksi(n[1], n[2]);
    s += '<circle cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="1.6" fill="rgba(255,255,255,.35)"/>';
  }
  if (titikSorot) {
    for (const t of titikSorot) {
      const p = proyeksi(t.negara[1], t.negara[2]);
      const warna = t.keadaan === 'benar' ? '#4ade80' : t.keadaan === 'salah' ? '#f87171' : '#ffffff';
      s += '<circle data-titik="' + t.huruf + '" cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="9" fill="' + warna + '" fill-opacity="0.25" stroke="' + warna + '" stroke-width="1.5" style="cursor:pointer"/>' +
        '<text x="' + p.x.toFixed(1) + '" y="' + (p.y + 3.5).toFixed(1) + '" fill="' + warna + '" font-size="9" font-weight="700" text-anchor="middle" font-family="system-ui,sans-serif" style="pointer-events:none">' + t.huruf + '</text>';
    }
  }
  return s + '</svg>';
}

export function render(root) {
  const box = T.out();
  const modeS = T.select([['titik', 'Tebak titik di peta'], ['nama', 'Tebak nama negara']], 'titik');
  const bestBox = T.el('<p class="hint center">Skor terbaikmu: <b>' + utils.loadBestNum(LS_KEY) + '</b>/' + TOTAL_RONDE + '</p>');
  let best = utils.loadBestNum(LS_KEY);
  const game = { list: [], idx: 0, score: 0, answered: false, opsi: [], hurufBenar: '' };

  const mulai = () => {
    game.list = susunRonde();
    game.idx = 0; game.score = 0;
    tampilSoal();
  };

  const tampilSoal = () => {
    game.answered = false;
    const target = game.list[game.idx];
    const pengecoh = pilihPengecoh(target);
    const semua = utils.shuffle([target].concat(pengecoh));
    const huruf = ['A', 'B', 'C', 'D'];
    game.opsi = semua;
    game.hurufBenar = huruf[semua.indexOf(target)];
    const mode = modeS.value;
    let sorot;
    let bawah;
    if (mode === 'titik') {
      sorot = semua.map((n, i) => ({ negara: n, huruf: huruf[i], keadaan: '' }));
      bawah = '<p class="hint center" style="margin-top:10px">Ketuk titik yang benar di peta.</p>';
    } else {
      sorot = [{ negara: target, huruf: '?', keadaan: '' }];
      bawah = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px">' +
        semua.map((n, i) => '<button type="button" class="btn" data-nama="' + i + '">' + huruf[i] + '. ' + T.esc(n[0]) + '</button>').join('') + '</div>';
    }
    T.show(box,
      '<p class="hint">Soal ' + (game.idx + 1) + ' dari ' + TOTAL_RONDE + ' &bull; Skor: ' + game.score + '</p>' +
      (mode === 'titik'
        ? '<p style="font-size:18px;text-align:center;margin:10px 0">Di mana letak <b>' + T.esc(target[0]) + '</b>?</p>'
        : '<p style="font-size:18px;text-align:center;margin:10px 0">Negara apa yang ditandai <b>?</b> di peta?</p>') +
      petaSvg(sorot) + bawah);
    const svg = box.querySelector('svg');
    if (svg && mode === 'titik') {
      svg.addEventListener('click', (ev) => {
        const t = ev.target.closest('[data-titik]');
        if (t) jawab(t.getAttribute('data-titik'));
      });
    }
    if (mode === 'nama') {
      box.querySelectorAll('[data-nama]').forEach((b) => {
        b.addEventListener('click', () => jawab(huruf[Number(b.getAttribute('data-nama'))]));
      });
    }
  };

  const jawab = (huruf) => {
    if (game.answered) return;
    game.answered = true;
    const benar = huruf === game.hurufBenar;
    if (benar) game.score++;
    const target = game.list[game.idx];
    const mode = modeS.value;
    let sorot;
    if (mode === 'titik') {
      sorot = game.opsi.map((n, i) => {
        const h = ['A', 'B', 'C', 'D'][i];
        return { negara: n, huruf: h, keadaan: h === game.hurufBenar ? 'benar' : h === huruf ? 'salah' : '' };
      });
    } else {
      sorot = [{ negara: target, huruf: benar ? '✓' : '✗', keadaan: benar ? 'benar' : 'salah' }];
    }
    const habis = game.idx + 1 >= TOTAL_RONDE;
    T.show(box,
      '<p class="hint">Soal ' + (game.idx + 1) + ' dari ' + TOTAL_RONDE + ' &bull; Skor: ' + game.score + '</p>' +
      '<p style="font-size:18px;text-align:center;margin:10px 0">' + (benar ? 'Betul! Itu ' + T.esc(target[0]) + '.' : 'Bukan. Yang benar ' + T.esc(target[0]) + '.') + '</p>' +
      petaSvg(sorot) +
      '<p class="hint center" style="margin-top:10px">' + (benar ? 'Satu poin untukmu.' : 'Titik yang benar ditandai hijau.') + '</p>');
    const lanjut = T.btn(habis ? 'Lihat hasil' : 'Soal berikutnya', () => {
      if (habis) selesai();
      else { game.idx++; tampilSoal(); }
    }, true);
    lanjut.style.marginTop = '12px';
    box.appendChild(lanjut);
  };

  const selesai = () => {
    if (game.score > best) { best = game.score; utils.saveBestNum(LS_KEY, best); }
    bestBox.innerHTML = 'Skor terbaikmu: <b>' + best + '</b>/' + TOTAL_RONDE;
    T.show(box,
      '<div class="big center">' + game.score + '<span class="mut" style="font-size:15px">/' + TOTAL_RONDE + '</span></div>' +
      '<p class="center hint">' + (game.score >= 8 ? 'Kamu hafal peta dunia!' : game.score >= 5 ? 'Lumayan, setengah peta sudah di kepalamu.' : 'Terus latihan, peta dunia itu luas.') + '</p>');
    const lagi = T.btn('Main lagi', mulai, true);
    lagi.style.marginTop = '12px';
    box.appendChild(lagi);
  };

  root.appendChild(T.el('<p class="hint">Peta di bawah ini peta titik sederhana (bukan peta negara yang akurat): titik-titik kecil itu ibu kota 65 negara, garisnya bujur dan lintang. Tebak 10 negara, skor terbaikmu tersimpan di HP ini.</p>'));
  root.appendChild(T.field('Mode main', modeS));
  root.appendChild(bestBox);
  root.appendChild(T.row(T.btn('Mulai main', mulai, true)));
  root.appendChild(box);
}
