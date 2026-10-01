import { h as T, utils } from '../../core.js?v=6.8.0';

export const meta = {"id": "tebak-kata", "name": "Tebak Kata", "cat": "fun", "icon": "🔤", "desc": "Hangman Bahasa Indonesia: 64 kata, 6 nyawa.", "keywords": "hangman,tebak,kata,game,indonesia,huruf"};

const KATA = [
  ['hewan', 'Hewan', ['KOMODO', 'KANCIL', 'BEKANTAN', 'ANOA', 'KASUARI', 'ORANGUTAN', 'CENDRAWASIH', 'GAJAH', 'HARIMAU', 'BUAYA', 'KATAK', 'BURUNG', 'IKAN', 'KUCING', 'ANJING', 'AYAM']],
  ['makanan', 'Makanan', ['RENDANG', 'NASI GORENG', 'SATE', 'SOTO', 'BAKSO', 'MIE AYAM', 'GUDEG', 'PEMPEK', 'MARTABAK', 'KLEPON', 'RAWON', 'LONTONG', 'KETOPRAK', 'SIOMAY', 'BATAGOR', 'ES CENDOL']],
  ['kota', 'Kota di Indonesia', ['JAKARTA', 'SURABAYA', 'BANDUNG', 'MEDAN', 'SEMARANG', 'MAKASSAR', 'DENPASAR', 'YOGYAKARTA', 'PALEMBANG', 'BALIKPAPAN', 'MANADO', 'PONTIANAK', 'PADANG', 'MALANG', 'BOGOR', 'SOLO']],
  ['benda', 'Benda', ['PAYUNG', 'KACAMATA', 'SEPEDA', 'GITAR', 'BUKU', 'LAMPU', 'KIPAS ANGIN', 'TELEVISI', 'KULKAS', 'KOMPOR', 'SAPU', 'BANTAL', 'CERMIN', 'JAM', 'TAS', 'SEPATU']],
];
const NYAWA_MAX = 6;
const ABJAD = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export function render(root) {
  let kata = '', kategori = '', ditebak = new Set(), salah = 0, selesai = false;

  const nyawaEl = T.el('<p class="center" style="font-size:18px;margin:6px 0"></p>');
  const katEl = T.el('<p class="center hint"></p>');
  const kataEl = T.el('<div class="center" style="font-family:monospace;font-size:26px;letter-spacing:6px;margin:12px 0;word-break:break-all"></div>');
  const salahEl = T.el('<p class="center hint" style="min-height:20px"></p>');
  const hasilBox = T.out();

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
    for (let i = 0; i < Math.min(salah, parts.length); i++) parts[i]();
  };

  const gambarKata = () => {
    kataEl.innerHTML = kata.split('').map((ch) => {
      if (ch === ' ') return '<span style="display:inline-block;width:14px"></span>';
      return '<span>' + (ditebak.has(ch) ? T.esc(ch) : '_') + '</span>';
    }).join('');
  };

  const gambarNyawa = () => {
    nyawaEl.textContent = '❤️'.repeat(Math.max(0, NYAWA_MAX - salah)) + '🖤'.repeat(Math.min(NYAWA_MAX, salah));
  };

  const hurufUnik = () => [...new Set(kata.replace(/ /g, '').split(''))];

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
      T.show(hasilBox, '<div class="center" style="padding:8px 0">' +
        '<div style="font-size:34px">🎉</div>' +
        '<p style="font-size:15px;font-weight:700;margin:6px 0">Mantap, ketebak!</p>' +
        '<p class="hint">Kata: <b>' + T.esc(kata) + '</b> · sisa nyawa ' + (NYAWA_MAX - salah) + '</p></div>' +
        '<div class="center"></div>');
      hasilBox.querySelector('.center:last-child').appendChild(T.btn('Main Lagi', rondeBaru, true));
      T.beep(523, 0.12); T.beep(659, 0.12, 'sine', 0.12); T.beep(784, 0.2, 'sine', 0.24);
    } else if (salah >= NYAWA_MAX) {
      selesai = true;
      T.show(hasilBox, '<div class="center" style="padding:8px 0">' +
        '<div style="font-size:34px">😵</div>' +
        '<p style="font-size:15px;font-weight:700;margin:6px 0">Yah, nyawanya habis.</p>' +
        '<p class="hint">Jawabannya: <b>' + T.esc(kata) + '</b></p></div>' +
        '<div class="center"></div>');
      hasilBox.querySelector('.center:last-child').appendChild(T.btn('Coba Lagi', rondeBaru, true));
      T.beep(220, 0.2, 'sawtooth'); T.beep(150, 0.3, 'sawtooth', 0.2);
    }
  };

  const rondeBaru = () => {
    const [cid, clabel, daftar] = KATA[Math.floor(Math.random() * KATA.length)];
    void cid;
    kategori = clabel;
    kata = daftar[Math.floor(Math.random() * daftar.length)];
    ditebak = new Set(); salah = 0; selesai = false;
    katEl.textContent = 'Kategori: ' + kategori + ' · ' + kata.replace(/ /g, '').length + ' huruf';
    salahEl.textContent = '';
    T.hide(hasilBox);
    ABJAD.forEach((h) => {
      const b = keyBtns[h];
      b.disabled = false; b.style.borderColor = ''; b.style.color = ''; b.style.opacity = '';
    });
    gambarKata(); gambarNyawa(); gambarOrang();
  };

  root.appendChild(T.el('<p class="center hint">Tebak kata Bahasa Indonesianya, huruf per huruf.<br>Salah 6 kali = tamat. Semangat!</p>'));
  root.appendChild(katEl);
  root.appendChild(canvas);
  root.appendChild(nyawaEl);
  root.appendChild(kataEl);
  root.appendChild(salahEl);
  root.appendChild(kb);
  root.appendChild(hasilBox);
  rondeBaru();
}
