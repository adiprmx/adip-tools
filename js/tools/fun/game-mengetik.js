import { h as T, utils } from '../../core.js';

export const meta = {"id": "game-mengetik", "name": "Game Mengetik", "cat": "fun", "icon": "⌨️", "desc": "Tiga game mengetik: bersihkan kata yang jatuh, ketik tanpa satu pun salah, dan kejar pacer yang makin cepat.", "keywords": "mengetik,game,keyboard,kecepatan,ketik,kata jatuh,pacer,latihan", "since": "6.19.0"};

/* Bank kata Indonesia untuk mode Kata Jatuh. */
export const KATA_JATUH = [
  'apel', 'bola', 'cinta', 'dunia', 'emas', 'fajar', 'gajah', 'hujan', 'indah', 'jalan',
  'kuda', 'langit', 'matahari', 'nasi', 'ombak', 'pagi', 'rindu', 'sore', 'taman', 'udara',
  'waktu', 'zebra', 'buku', 'kopi', 'laut', 'gunung', 'sungai', 'bintang', 'bulan', 'awan',
  'rumah', 'sekolah', 'teman', 'musik', 'lagu', 'film', 'cerita', 'senja', 'pantai', 'hutan',
  'kucing', 'anjing', 'burung', 'ikan', 'bunga', 'daun', 'pohon', 'batu', 'pasir', 'angin',
  'senyum', 'tawa', 'mimpi', 'harap', 'damai', 'tenang', 'riang', 'cerah', 'dingin', 'hangat',
  'kertas', 'pena', 'meja', 'kursi', 'jendela', 'pintu', 'lampu', 'cermin', 'jam', 'tas',
  'sepatu', 'baju', 'topi', 'kunci', 'dompet', 'ponsel', 'layar', 'tombol', 'kabel', 'baterai',
];

export const TEKS_LATIH = [
  'Pagi ini hujan turun pelan di atas atap rumah. Aroma kopi dari dapur bercampur bau tanah basah. Di luar jendela, anak-anak berlari kecil menuju sekolah sambil tertawa.',
  'Nelayan itu berangkat sebelum matahari terbit. Perahunya kecil, jaringnya sudah tua, tapi laut selalu memberinya cukup untuk makan hari ini dan besok.',
  'Di pasar pagi, penjual sayur menata dagangannya rapi. Cabai merah, tomat, dan bayam segar berbaris di atas meja kayu yang sudah lapuk dimakan waktu.',
];

/* WPM standar: satu kata = 5 karakter. Pembulatan numerik (utils.r4
   mengembalikan string, tidak cocok untuk nilai yang dipakai hitung). */
const bulat4 = (v) => { const r = Math.round(v * 1e4) / 1e4; return Object.is(r, -0) ? 0 : r; };

export function hitungWpm(karakterBenar, detik) {
  if (!detik || detik <= 0) return 0;
  return bulat4((karakterBenar / 5) / (detik / 60));
}

export function hitungAkurasi(benar, total) {
  if (!total || total <= 0) return 0;
  return bulat4((benar / total) * 100);
}

/* Pacer mulai 20 WPM, naik 5 WPM tiap 15 detik, mentok 80 WPM. */
export function kecepatanPacer(detik) {
  return Math.min(80, 20 + Math.floor(detik / 15) * 5);
}

export function nilaiKataJatuh(kata) {
  return kata.length >= 7 ? 30 : kata.length >= 5 ? 20 : 10;
}

const LS_KEY = 'game-mengetik-best';

export function render(root) {
  const box = T.out();
  const modeSel = T.select([
    ['jatuh', 'Kata Jatuh: bersihkan kata sebelum sampai bawah'],
    ['tanpa-salah', 'Tanpa Salah: satu typo langsung tamat'],
    ['pacer', 'Kejar Pacer: jangan sampai pacer menyalipmu'],
  ], 'jatuh');
  let timer = null, raf = null, aktif = false;
  let best = utils.loadBestObj(LS_KEY);

  const bersih = () => {
    aktif = false;
    if (timer) { clearInterval(timer); timer = null; }
    if (raf) { cancelAnimationFrame(raf); raf = null; }
  };
  T.onLeave(bersih);

  const simpanBest = (mode, skor) => {
    if (skor > (best[mode] || 0)) { best[mode] = skor; utils.saveBestObj(LS_KEY, best); return true; }
    return false;
  };

  // RED-14: nilai best dari localStorage dipaksa jadi angka sebelum
  // diinterpolasi ke HTML — loadBestObj mengembalikan JSON apa adanya,
  // dan string di sana akan lolos mentah ke innerHTML via teksBest().
  const angkaBest = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
  const teksBest = () => 'Terbaik: Kata Jatuh ' + angkaBest(best.jatuh) + ' · Tanpa Salah ' + angkaBest(best['tanpa-salah']) + ' karakter · Pacer ' + angkaBest(best.pacer) + ' detik';

  /* ---------- Mode 1: Kata Jatuh ---------- */
  const mulaiJatuh = () => {
    bersih(); aktif = true;
    const area = T.el('<div style="position:relative;height:260px;border:1px solid #ffffff22;border-radius:10px;overflow:hidden;background:#0c0d10"></div>');
    const info = T.el('<p class="hint center">Skor: 0 · Nyawa: ❤️❤️❤️</p>');
    const inp = T.input('text', 'Ketik kata yang jatuh lalu Enter…');
    inp.autocomplete = 'off'; inp.autocapitalize = 'off';
    let skor = 0, nyawa = 3, kataAktif = [], spawn = 0, jatuhPx = 0.45, terakhir = performance.now();
    const kataEl = new Map();

    const gambarInfo = () => { info.textContent = 'Skor: ' + skor + ' · Nyawa: ' + '❤️'.repeat(Math.max(0, nyawa)) + (nyawa <= 0 ? '' : ' · Terbaik: ' + (best.jatuh || 0)); };

    const tambahKata = () => {
      const kata = KATA_JATUH[Math.floor(Math.random() * KATA_JATUH.length)];
      if (kataAktif.some((k) => k.kata === kata)) return;
      const el = document.createElement('div');
      el.textContent = kata;
      el.style.cssText = 'position:absolute;top:0;font-size:16px;font-weight:700;color:#fff;background:#ffffff1a;padding:4px 10px;border-radius:6px;white-space:nowrap';
      const x = 8 + Math.random() * Math.max(10, area.clientWidth - 120);
      el.style.left = x + 'px';
      area.appendChild(el);
      const item = { kata, el, y: 0 };
      kataAktif.push(item); kataEl.set(kata, item);
    };

    const loop = (now) => {
      if (!aktif) return;
      const dt = Math.min(50, now - terakhir); terakhir = now;
      spawn += dt;
      if (spawn > 1400) { spawn = 0; tambahKata(); }
      jatuhPx = Math.min(1.6, 0.45 + skor * 0.004);
      for (let i = kataAktif.length - 1; i >= 0; i--) {
        const k = kataAktif[i];
        k.y += jatuhPx * (dt / 16.7);
        k.el.style.top = k.y + 'px';
        if (k.y > 232) {
          k.el.remove(); kataAktif.splice(i, 1); kataEl.delete(k.kata);
          nyawa--; T.beep(180, 0.15, 'sawtooth');
          gambarInfo();
          if (nyawa <= 0) { selesai(); return; }
        }
      }
      raf = requestAnimationFrame(loop);
    };

    const selesai = () => {
      bersih();
      const baru = simpanBest('jatuh', skor);
      T.show(box, '<div class="big center">' + skor + '<span class="mut" style="font-size:15px"> poin</span></div>' +
        '<p class="center">' + (baru ? 'Rekor baru! ' : '') + 'Kata sampai bawah tiga kali, game berakhir.</p>' +
        '<p class="center hint">' + teksBest() + '</p>');
      box.appendChild(T.row(T.btn('Main lagi 🔄', mulaiJatuh, true)));
    };

    inp.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      const v = inp.value.trim().toLowerCase();
      inp.value = '';
      if (!v) return;
      const item = kataEl.get(v);
      if (item) {
        skor += nilaiKataJatuh(v);
        item.el.remove();
        kataAktif = kataAktif.filter((k) => k !== item);
        kataEl.delete(v);
        T.beep(660, 0.07);
        gambarInfo();
      }
    });

    T.show(box, '');
    box.appendChild(info);
    box.appendChild(area);
    box.appendChild(T.el('<div style="height:10px"></div>'));
    box.appendChild(inp);
    gambarInfo();
    tambahKata();
    raf = requestAnimationFrame(loop);
    setTimeout(() => inp.focus(), 50);
  };

  /* ---------- Mode 2: Tanpa Salah ---------- */
  const mulaiTanpaSalah = () => {
    bersih(); aktif = true;
    const teks = TEKS_LATIH[Math.floor(Math.random() * TEKS_LATIH.length)];
    let idx = 0, mulai = 0, salah = false;
    const tampil = T.el('<p style="font-size:16px;line-height:1.9;letter-spacing:.3px"></p>');
    const info = T.el('<p class="hint center">Ketik persis seperti teks. Satu huruf salah, tamat.</p>');
    const inp = T.input('text', 'Mulai ketik di sini…');
    inp.autocomplete = 'off'; inp.autocapitalize = 'off';

    const gambarTeks = () => {
      let html = '';
      for (let i = 0; i < teks.length; i++) {
        const c = teks[i];
        if (i < idx) html += '<span style="color:#4ade80">' + T.esc(c) + '</span>';
        else if (i === idx) html += '<span style="background:#ffffff33;border-radius:2px">' + T.esc(c) + '</span>';
        else html += '<span style="color:#8b8b93">' + T.esc(c) + '</span>';
      }
      tampil.innerHTML = html;
    };

    const selesai = (menang) => {
      bersih();
      const detik = mulai ? (performance.now() - mulai) / 1000 : 0;
      const wpm = menang ? hitungWpm(idx, detik) : 0;
      const baru = menang && simpanBest('tanpa-salah', idx);
      T.show(box,
        '<div class="big center">' + idx + '<span class="mut" style="font-size:15px">/' + teks.length + ' karakter</span></div>' +
        '<p class="center">' + (menang ? 'Sempurna, tanpa satu pun salah! Kecepatanmu ' + wpm + ' kata per menit.' : 'Typo di karakter ke-' + (idx + 1) + ' ("' + T.esc(teks[idx]) + '"). Coba lagi, teksnya ganti tiap main.') + (baru ? ' Rekor baru!' : '') + '</p>' +
        '<p class="center hint">' + teksBest() + '</p>');
      box.appendChild(T.row(T.btn('Main lagi 🔄', mulaiTanpaSalah, true)));
    };

    inp.addEventListener('input', () => {
      if (salah || !aktif) return;
      const v = inp.value;
      if (!v) return;
      if (!mulai) mulai = performance.now();
      const c = v[v.length - 1];
      if (c === teks[idx]) {
        idx++;
        T.beep(700, 0.03);
        if (idx >= teks.length) { selesai(true); return; }
        gambarTeks();
      } else {
        salah = true;
        T.beep(180, 0.2, 'sawtooth');
        selesai(false);
        return;
      }
      inp.value = '';
    });

    T.show(box, '');
    box.appendChild(info);
    box.appendChild(tampil);
    box.appendChild(T.el('<div style="height:10px"></div>'));
    box.appendChild(inp);
    gambarTeks();
    setTimeout(() => inp.focus(), 50);
  };

  /* ---------- Mode 3: Kejar Pacer ---------- */
  const mulaiPacer = () => {
    bersih(); aktif = true;
    const teks = TEKS_LATIH[Math.floor(Math.random() * TEKS_LATIH.length)];
    let idx = 0, mulai = 0, pacerPos = 0, detikJalan = 0;
    const tampil = T.el('<p style="font-size:16px;line-height:1.9;letter-spacing:.3px"></p>');
    const bar = T.el('<div style="height:12px;background:#ffffff14;border-radius:6px;position:relative;margin:10px 0"></div>');
    const barKamu = document.createElement('div');
    barKamu.setAttribute('data-uji', 'bar-kamu');
    barKamu.style.cssText = 'position:absolute;left:0;top:0;bottom:0;width:0;background:#fff;border-radius:6px';
    const barPacer = document.createElement('div');
    barPacer.setAttribute('data-uji', 'bar-pacer');
    barPacer.style.cssText = 'position:absolute;top:-3px;bottom:-3px;width:3px;background:#ef4444;border-radius:2px;left:0';
    bar.appendChild(barKamu); bar.appendChild(barPacer);
    const info = T.el('<p class="hint center">Garis merah itu pacer. Ketik lebih cepat dari dia.</p>');
    const inp = T.input('text', 'Mulai ketik di sini…');
    inp.autocomplete = 'off'; inp.autocapitalize = 'off';

    const gambarTeks = () => {
      let html = '';
      for (let i = 0; i < teks.length; i++) {
        const c = teks[i];
        if (i < idx) html += '<span style="color:#4ade80">' + T.esc(c) + '</span>';
        else if (i === idx) html += '<span style="background:#ffffff33;border-radius:2px">' + T.esc(c) + '</span>';
        else html += '<span style="color:#8b8b93">' + T.esc(c) + '</span>';
      }
      tampil.innerHTML = html;
    };

    const selesai = (menang) => {
      bersih();
      const baru = simpanBest('pacer', Math.floor(detikJalan));
      T.show(box,
        '<div class="big center">' + Math.floor(detikJalan) + '<span class="mut" style="font-size:15px"> detik bertahan</span></div>' +
        '<p class="center">' + (menang ? 'Kamu menyelesaikan teks sebelum pacer menyalip. Menang!' : 'Pacer menyalipmu di karakter ke-' + Math.floor(pacerPos) + '. Pacer makin cepat tiap 15 detik, jadi jangan lengah di awal.') + (baru ? ' Rekor baru!' : '') + '</p>' +
        '<p class="center hint">' + teksBest() + '</p>');
      box.appendChild(T.row(T.btn('Main lagi 🔄', mulaiPacer, true)));
    };

    timer = setInterval(() => {
      if (!aktif || !mulai) return;
      detikJalan = (performance.now() - mulai) / 1000;
      const wpm = kecepatanPacer(detikJalan);
      pacerPos += (wpm * 5 / 60) * 0.1;
      barPacer.style.left = Math.min(100, (pacerPos / teks.length) * 100) + '%';
      info.textContent = 'Pacer: ' + wpm + ' kata/menit · Kamu: karakter ' + idx + '/' + teks.length + ' · ' + Math.floor(detikJalan) + ' detik';
      if (pacerPos >= idx + 6 && detikJalan > 3) { selesai(false); }
    }, 100);

    inp.addEventListener('input', () => {
      if (!aktif) return;
      const v = inp.value;
      if (!v) return;
      if (!mulai) mulai = performance.now();
      const c = v[v.length - 1];
      if (c === teks[idx]) {
        idx++;
        barKamu.style.width = (idx / teks.length) * 100 + '%';
        if (idx >= teks.length) { selesai(true); return; }
        gambarTeks();
      }
      inp.value = '';
    });

    T.show(box, '');
    box.appendChild(info);
    box.appendChild(bar);
    box.appendChild(tampil);
    box.appendChild(T.el('<div style="height:10px"></div>'));
    box.appendChild(inp);
    gambarTeks();
    setTimeout(() => inp.focus(), 50);
  };

  const mulai = () => {
    if (modeSel.value === 'jatuh') mulaiJatuh();
    else if (modeSel.value === 'tanpa-salah') mulaiTanpaSalah();
    else mulaiPacer();
  };

  modeSel.addEventListener('change', () => {
    bersih();
    T.show(box, '<p class="hint center">' + teksBest() + '</p>');
  });

  root.appendChild(T.el('<p class="hint">Tiga game, satu keyboard. Kata Jatuh melatih kecepatan reaksi, Tanpa Salah melatih ketelitian, Kejar Pacer melatih kecepatan yang stabil. Skor terbaik tersimpan di HP ini.</p>'));
  root.appendChild(T.field('Pilih game', modeSel));
  root.appendChild(T.row(T.btn('▶️ Mulai main', mulai, true)));
  root.appendChild(box);
  T.show(box, '<p class="hint center">' + teksBest() + '</p>');
}
