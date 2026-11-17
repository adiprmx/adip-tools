import { h as T, utils } from '../../core.js';

export const meta = {"id": "tebak-kata", "name": "Tebak Kata", "cat": "fun", "icon": "🔤", "desc": "Hangman Bahasa Indonesia: 112 kata, 7 kategori, 3 level nyawa.", "keywords": "hangman,tebak,kata,game,indonesia,huruf,kategori,level"};

const KATA = [
  ['hewan', 'Hewan', ['KOMODO', 'KANCIL', 'BEKANTAN', 'ANOA', 'KASUARI', 'ORANGUTAN', 'CENDRAWASIH', 'GAJAH', 'HARIMAU', 'BUAYA', 'KATAK', 'BURUNG', 'IKAN', 'KUCING', 'ANJING', 'AYAM']],
  ['makanan', 'Makanan', ['RENDANG', 'NASI GORENG', 'SATE', 'SOTO', 'BAKSO', 'MIE AYAM', 'GUDEG', 'PEMPEK', 'MARTABAK', 'KLEPON', 'RAWON', 'LONTONG', 'KETOPRAK', 'SIOMAY', 'BATAGOR', 'ES CENDOL']],
  ['kota', 'Kota di Indonesia', ['JAKARTA', 'SURABAYA', 'BANDUNG', 'MEDAN', 'SEMARANG', 'MAKASSAR', 'DENPASAR', 'YOGYAKARTA', 'PALEMBANG', 'BALIKPAPAN', 'MANADO', 'PONTIANAK', 'PADANG', 'MALANG', 'BOGOR', 'SOLO']],
  ['benda', 'Benda', ['PAYUNG', 'KACAMATA', 'SEPEDA', 'GITAR', 'BUKU', 'LAMPU', 'KIPAS ANGIN', 'TELEVISI', 'KULKAS', 'KOMPOR', 'SAPU', 'BANTAL', 'CERMIN', 'JAM', 'TAS', 'SEPATU']],
  ['buah', 'Buah', ['MANGGA', 'DURIAN', 'RAMBUTAN', 'MANGGIS', 'SALAK', 'NANAS', 'PEPAYA', 'JAMBU', 'DUKU', 'SAWO', 'ALPUKAT', 'SIRSAK', 'BELIMBING', 'NANGKA', 'KEDONDONG', 'APEL']],
  ['profesi', 'Profesi', ['DOKTER', 'GURU', 'PETANI', 'NELAYAN', 'PILOT', 'POLISI', 'TENTARA', 'PENGACARA', 'ARSITEK', 'KOKI', 'MONTIR', 'BIDAN', 'PERAWAT', 'SOPIR', 'PEDAGANG', 'PENULIS']],
  ['olahraga', 'Olahraga', ['SEPAK BOLA', 'BULUTANGKIS', 'BASKET', 'VOLI', 'RENANG', 'TINJU', 'KARATE', 'JUDO', 'PANAHAN', 'GOLF', 'CATUR', 'LARI', 'DAYUNG', 'SENAM', 'ANGKAT BESI', 'MARATON']],
];
const LEVELS = [
  { id: 'santai', label: 'Santai — 8 nyawa', nyawa: 8 },
  { id: 'normal', label: 'Normal — 6 nyawa', nyawa: 6 },
  { id: 'sulit', label: 'Sulit — 4 nyawa', nyawa: 4 },
];
const ABJAD = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const LS_KEY = 'tebak-kata-best-v2';
function loadBest() {
  try { const v = JSON.parse(localStorage.getItem(LS_KEY) || '{}'); return v && typeof v === 'object' ? v : {}; }
  catch (e) { return {}; }
}
function saveBest(b) { try { localStorage.setItem(LS_KEY, JSON.stringify(b)); } catch (e) { /* abaikan */ } }

export function render(root) {
  let kata = '', kategori = '', ditebak = new Set(), salah = 0, selesai = false;
  let level = LEVELS[1];
  let best = loadBest();

  const lvlSel = T.select(LEVELS.map((l) => [l.id, l.label]), 'normal');
  const katSel = T.select([['acak', 'Acak — semua kategori']].concat(KATA.map(([id, label]) => [id, label])), 'acak');
  const nyawaEl = T.el('<p class="center" style="font-size:18px;margin:6px 0"></p>');
  const katEl = T.el('<p class="center hint"></p>');
  const kataEl = T.el('<div class="center" style="font-family:monospace;font-size:26px;letter-spacing:6px;margin:12px 0;word-break:break-all"></div>');
  const salahEl = T.el('<p class="center hint" style="min-height:20px"></p>');
  const hasilBox = T.out();
  const bestBox = T.el('<p class="hint center"></p>');

  const canvas = document.createElement('canvas');
  canvas.width = 160; canvas.height = 180;
  canvas.style.cssText = 'display:block;margin:4px auto;width:130px;height:auto';
  const kb = T.el('<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:6px;margin-top:10px"></div>');
  const keyBtns = {};
  ABJAD.forEach((h) => {
    const b = T.el('<button type="button" class="btn" style="padding:8px 0;font-size:14px;font-weight:700">' + h + '</button>');
    b.addEventListener('click', () => tebakHuruf(h));
    kb.appendChild(b); keyBtns[h] = b;
  });

  const gambarBest = () => {
    bestBox.textContent = 'Skor terbaik — ' + LEVELS.map((l) => l.label.split(' ')[0] + ': ' + (best[l.id] || 0)).join(' · ');
  };

  const gambarOrang = () => {
    const ctx = canvas.getContext('2d');
    const dpr = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, 160, 180);
    ctx.strokeStyle = '#c9bda9'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    // tiang gantungan
    ctx.beginPath();
    ctx.moveTo(20, 170); ctx.lineTo(80, 170);
    ctx.moveTo(50, 170); ctx.lineTo(50, 15);
    ctx.moveTo(50, 15); ctx.lineTo(120, 15);
    ctx.moveTo(120, 15); ctx.lineTo(120, 35);
    ctx.stroke();
    if (salah < 1) return;
    ctx.strokeStyle = '#ff6f61'; ctx.fillStyle = '#ff6f61';
    const parts = [
      () => { ctx.beginPath(); ctx.arc(120, 50, 15, 0, Math.PI * 2); ctx.stroke(); },
      () => { ctx.beginPath(); ctx.moveTo(120, 65); ctx.lineTo(120, 115); ctx.stroke(); },
      () => { ctx.beginPath(); ctx.moveTo(120, 80); ctx.lineTo(100, 95); ctx.stroke(); },
      () => { ctx.beginPath(); ctx.moveTo(120, 80); ctx.lineTo(140, 95); ctx.stroke(); },
      () => { ctx.beginPath(); ctx.moveTo(120, 115); ctx.lineTo(105, 145); ctx.stroke(); },
      () => { ctx.beginPath(); ctx.moveTo(120, 115); ctx.lineTo(135, 145); ctx.stroke(); },
    ];
    // Gambar orang digambar bertahap sesuai porsi nyawa yang hilang (biar 4/6/8 nyawa sama-sama pas).
    const n = Math.min(parts.length, Math.max(1, Math.round(salah / level.nyawa * parts.length)));
    for (let i = 0; i < n; i++) parts[i]();
  };

  const gambarKata = () => {
    kataEl.innerHTML = kata.split('').map((ch) => {
      if (ch === ' ') return '<span style="display:inline-block;width:14px"></span>';
      return '<span>' + (ditebak.has(ch) ? T.esc(ch) : '_') + '</span>';
    }).join('');
  };

  const gambarNyawa = () => {
    nyawaEl.textContent = '❤️'.repeat(Math.max(0, level.nyawa - salah)) + '🖤'.repeat(Math.min(level.nyawa, salah));
  };

  const hurufUnik = () => [...new Set(kata.replace(/ /g, '').split(''))];

  const tombolHasil = (teksHasil) => {
    const w = T.el('<div class="row center" style="margin-top:10px"></div>');
    w.appendChild(T.btn('Main Lagi', rondeBaru, true));
    if (teksHasil) {
      w.appendChild(T.copyBtn(() => teksHasil, '📋 Salin hasil'));
      if (typeof navigator !== 'undefined' && navigator.share) {
        w.appendChild(T.btn('📤 Bagikan', () => { navigator.share({ text: teksHasil }).catch(() => {}); }));
      }
    }
    return w;
  };

  const tebakHuruf = (h) => {
    if (selesai || ditebak.has(h)) return;
    ditebak.add(h);
    const b = keyBtns[h];
    if (kata.includes(h)) {
      b.style.borderColor = 'var(--ok)'; b.style.color = 'var(--ok)';
      T.beep(660, 0.08);
    } else {
      salah++;
      b.style.borderColor = 'var(--err)'; b.style.color = 'var(--err)'; b.style.opacity = '0.5';
      T.beep(160, 0.15, 'sawtooth');
    }
    b.disabled = true;
    gambarKata(); gambarNyawa(); gambarOrang();
    salahEl.textContent = salah ? 'Huruf ngaco: ' + [...ditebak].filter((x) => !kata.includes(x)).join(' ') : '';

    const menang = hurufUnik().every((x) => ditebak.has(x));
    if (menang) {
      selesai = true;
      const skor = (level.nyawa - salah) * 100 + kata.replace(/ /g, '').length * 10;
      let baru = '';
      if (skor > (best[level.id] || 0)) { best[level.id] = skor; saveBest(best); baru = ' <b style="color:var(--acc)">Rekor baru!</b>'; }
      gambarBest();
      const teks = '🔤 Tebak Kata (' + level.label.split(' — ')[0] + '): aku nebak "' + kata + '" (' + kategori + ') dengan sisa ' + (level.nyawa - salah) + ' nyawa, skor ' + skor + '! Coba kalahin aku di Adip Tools.';
      T.show(hasilBox, '<div class="center" style="padding:8px 0">' +
        '<div style="font-size:34px">🎉</div>' +
        '<p style="font-size:15px;font-weight:700;margin:6px 0">Mantap, ketebak!</p>' +
        '<p class="hint">Kata: <b>' + T.esc(kata) + '</b> · sisa nyawa ' + (level.nyawa - salah) + ' · skor <b>' + skor + '</b>' + baru + '</p></div>');
      hasilBox.appendChild(tombolHasil(teks));
      T.beep(523, 0.12); T.beep(659, 0.12, 'sine', 0.12); T.beep(784, 0.2, 'sine', 0.24);
    } else if (salah >= level.nyawa) {
      selesai = true;
      T.show(hasilBox, '<div class="center" style="padding:8px 0">' +
        '<div style="font-size:34px">😵</div>' +
        '<p style="font-size:15px;font-weight:700;margin:6px 0">Yah, nyawanya habis.</p>' +
        '<p class="hint">Jawabannya: <b>' + T.esc(kata) + '</b></p></div>');
      hasilBox.appendChild(tombolHasil(null));
      T.beep(220, 0.2, 'sawtooth'); T.beep(150, 0.3, 'sawtooth', 0.2);
    }
  };

  const rondeBaru = () => {
    const pool = katSel.value === 'acak' ? KATA : KATA.filter(([id]) => id === katSel.value);
    const [, clabel, daftar] = pool[Math.floor(Math.random() * pool.length)];
    kategori = clabel;
    kata = daftar[Math.floor(Math.random() * daftar.length)];
    ditebak = new Set(); salah = 0; selesai = false;
    katEl.textContent = 'Kategori: ' + kategori + ' · ' + kata.replace(/ /g, '').length + ' huruf · ' + level.nyawa + ' nyawa';
    salahEl.textContent = '';
    T.hide(hasilBox);
    ABJAD.forEach((h) => {
      const b = keyBtns[h];
      b.disabled = false; b.style.borderColor = ''; b.style.color = ''; b.style.opacity = '';
    });
    gambarKata(); gambarNyawa(); gambarOrang();
  };

  lvlSel.addEventListener('change', () => {
    level = LEVELS.find((l) => l.id === lvlSel.value) || LEVELS[1];
    rondeBaru();
  });
  katSel.addEventListener('change', rondeBaru);

  root.appendChild(T.el('<p class="center hint">Tebak kata Bahasa Indonesianya, huruf per huruf.<br>Salah sampai nyawa habis = tamat. Semangat!</p>'));
  root.appendChild(T.field('Level', lvlSel));
  root.appendChild(T.field('Kategori', katSel));
  root.appendChild(katEl);
  root.appendChild(canvas);
  root.appendChild(nyawaEl);
  root.appendChild(kataEl);
  root.appendChild(salahEl);
  root.appendChild(kb);
  root.appendChild(hasilBox);
  root.appendChild(bestBox);
  gambarBest();
  rondeBaru();
}
