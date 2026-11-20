import { h as T, utils, fileInput, loadImage } from '../../core.js';

export const meta = {"id": "generator-achievement-steam", "name": "Generator Achievement Steam", "cat": "fun", "icon": "🎮", "desc": "Buat pop-up achievement Steam: nama game, judul, deskripsi, dan progress bar untuk pencapaian yang belum 100%.", "keywords": "steam,achievement,pop-up,progress bar,game,png,gamer", "since": "6.19.0"};

/* Warna bar progres Steam: hijau saat selesai, biru saat masih jalan. */
export function warnaProgress(persen) {
  return persen >= 100 ? '#a4d007' : '#66c0f4';
}

export function labelProgress(persen) {
  if (persen >= 100) return 'Achievement Unlocked!';
  return 'Progress: ' + persen + '%';
}

export const IKON_STEAM = ['trofi', 'bintang', 'medali', 'pedang'];

// Potong teks dengan '…' berdasarkan LEBAR TERUKUR (bukan jumlah karakter),
// supaya teks panjang tidak pernah meluber keluar kanvas.
function potongElipsis(x, teks, maksW) {
  if (x.measureText(teks).width <= maksW) return teks;
  let s = teks;
  while (s.length > 1 && x.measureText(s + '…').width > maksW) s = s.slice(0, -1);
  return s + '…';
}

// Bungkus kata + batasi jumlah baris + elipsis bila ada teks terpotong
// (bungkusKata membuang kata di luar 2 baris secara diam-diam).
function bungkusTerbatas(x, teks, maksW, maksBaris) {
  const rapi = String(teks).replace(/\s+/g, ' ').trim();
  let baris = utils.bungkusKata(x, rapi, maksW).map((b) => potongElipsis(x, b, maksW));
  const terpotong = baris.join(' ') !== rapi || baris.length > maksBaris;
  if (baris.length > maksBaris) baris = baris.slice(0, maksBaris);
  if (terpotong && baris.length) {
    const t = baris.length - 1;
    baris[t] = potongElipsis(x, baris[t].replace(/…$/, '') + '…', maksW);
  }
  return baris;
}

export function gambarIkonSteam(x, nama, px, py, s, warna) {
  x.save();
  x.translate(px + s / 2, py + s / 2);
  x.fillStyle = warna;
  x.strokeStyle = warna;
  x.lineWidth = s * 0.06;
  if (nama === 'bintang') {
    x.beginPath();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? s * 0.45 : s * 0.2;
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const vx = Math.cos(a) * r, vy = Math.sin(a) * r;
      if (i === 0) x.moveTo(vx, vy); else x.lineTo(vx, vy);
    }
    x.closePath(); x.fill();
  } else if (nama === 'medali') {
    x.beginPath(); x.arc(0, s * 0.08, s * 0.32, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#1b2838';
    x.beginPath(); x.arc(0, s * 0.08, s * 0.2, 0, Math.PI * 2); x.fill();
    x.fillStyle = warna;
    x.fillRect(-s * 0.28, -s * 0.45, s * 0.18, s * 0.3);
    x.fillRect(s * 0.1, -s * 0.45, s * 0.18, s * 0.3);
  } else if (nama === 'pedang') {
    x.rotate(-Math.PI / 4);
    x.fillRect(-s * 0.06, -s * 0.45, s * 0.12, s * 0.7);
    x.fillRect(-s * 0.25, s * 0.22, s * 0.5, s * 0.1);
    x.fillRect(-s * 0.05, s * 0.3, s * 0.1, s * 0.15);
  } else {
    /* trofi: cangkir + gagang + kaki */
    x.beginPath();
    x.moveTo(-s * 0.28, -s * 0.4); x.lineTo(s * 0.28, -s * 0.4);
    x.lineTo(s * 0.22, s * 0.05); x.lineTo(s * 0.08, s * 0.15);
    x.lineTo(s * 0.08, s * 0.3); x.lineTo(-s * 0.08, s * 0.3); x.lineTo(-s * 0.08, s * 0.15);
    x.lineTo(-s * 0.22, s * 0.05); x.closePath(); x.fill();
    x.beginPath(); x.arc(-s * 0.32, -s * 0.22, s * 0.1, Math.PI / 2, Math.PI * 1.5); x.stroke();
    x.beginPath(); x.arc(s * 0.32, -s * 0.22, s * 0.1, -Math.PI / 2, Math.PI / 2); x.stroke();
    x.fillRect(-s * 0.2, s * 0.32, s * 0.4, s * 0.08);
  }
  x.restore();
}

export function render(root) {
  const box = T.out();
  const gameI = T.input('text', 'cth: Stardew Valley', 'Stardew Valley');
  const judulI = T.input('text', 'cth: Petani Legendaris', 'Petani Legendaris');
  const descI = T.input('text', 'cth: Panen 10.000 tanaman', 'Panen 10.000 tanaman dalam satu musim');
  const persenI = T.input('number', '0-100', '100');
  const ikonI = T.select([['trofi', 'Trofi'], ['bintang', 'Bintang'], ['medali', 'Medali'], ['pedang', 'Pedang'], ['unggah', 'Gambar sendiri (unggah)']], 'trofi');
  const fi = fileInput('image/*');
  let imgUnggah = null;
  const canvas = document.createElement('canvas');
  canvas.width = 680; canvas.height = 200;
  canvas.style.cssText = 'width:100%;max-width:680px;height:auto;border-radius:8px;display:block;margin:0 auto';


  const gambar = () => {
    const x = canvas.getContext('2d');
    let persen = T.num(persenI.value);
    if (!Number.isFinite(persen)) persen = 100;
    persen = Math.max(0, Math.min(100, Math.round(persen)));
    x.fillStyle = '#1b2838'; x.fillRect(0, 0, 680, 200);
    x.strokeStyle = '#2a3f5a'; x.lineWidth = 2; x.strokeRect(1, 1, 678, 198);
    /* kotak ikon */
    x.fillStyle = '#2a3f5a'; x.fillRect(24, 40, 120, 120);
    if (ikonI.value === 'unggah' && imgUnggah) {
      x.drawImage(imgUnggah, 24, 40, 120, 120);
    } else {
      gambarIkonSteam(x, ikonI.value === 'unggah' ? 'trofi' : ikonI.value, 24, 40, 120, '#a4d007');
    }
    x.textAlign = 'left'; x.textBaseline = 'top';
    x.fillStyle = '#a4d007'; x.font = '700 22px system-ui, sans-serif';
    x.fillText(labelProgress(persen), 168, 28);
    x.fillStyle = '#fff'; x.font = '700 30px system-ui, sans-serif';
    const judul = (judulI.value.trim() || 'Achievement').slice(0, 42);
    // Judul satu baris: dulu 42 karakter bisa melewati 480px dan keluar kanvas.
    x.fillText(potongElipsis(x, judul, 480), 168, 58);
    x.fillStyle = '#8f98a0'; x.font = '400 22px system-ui, sans-serif';
    const desc = descI.value.trim().slice(0, 90);
    // 2 baris (y=98 & 126, bawah ≈148) — aman dari progress bar di y=158.
    const baris = bungkusTerbatas(x, desc, 480, 2);
    baris.forEach((b, i) => x.fillText(b, 168, 98 + i * 28));
    /* progress bar */
    x.fillStyle = '#0e1621'; x.fillRect(168, 158, 480, 14);
    x.fillStyle = warnaProgress(persen);
    x.fillRect(168, 158, Math.round(480 * persen / 100), 14);
    /* nama game */
    x.fillStyle = '#66c0f4'; x.font = '400 19px system-ui, sans-serif';
    x.fillText(potongElipsis(x, (gameI.value.trim() || 'Game').slice(0, 40), 632), 24, 172);
  };

  const unduh = () => {
    canvas.toBlob((b) => { if (b) T.dl('steam-achievement.png', b, 'image/png'); else T.toast('Gagal membuat PNG.'); }, 'image/png');
  };

  fi.onchange = () => {
    const f = fi.files && fi.files[0];
    fi.value = '';
    if (!f) return;
    loadImage(f).then((img) => { imgUnggah = img; ikonI.value = 'unggah'; gambar(); })
      .catch(() => T.toast('Gambar gagal dibaca, coba file lain'));
  };

  [gameI, judulI, descI, persenI, ikonI].forEach((el) => {
    el.addEventListener('input', gambar);
    el.addEventListener('change', gambar);
  });

  root.appendChild(T.el('<p class="hint">Bedanya dengan notifikasi biasa: ada progress bar untuk pencapaian yang belum selesai. Isi 100 kalau sudah terbuka, isi angka di bawahnya kalau masih jalan, misal 45 untuk setengah jalan.</p>'));
  root.appendChild(T.field('Nama game', gameI));
  root.appendChild(T.field('Judul achievement', judulI));
  root.appendChild(T.field('Deskripsi', descI));
  root.appendChild(T.field('Progress (0-100)', persenI, '100 = sudah terbuka, lengkap dengan label hijau.'));
  root.appendChild(T.field('Ikon', ikonI));
  root.appendChild(T.row(T.btn('🖼️ Unggah gambar ikon', () => fi.click()), T.btn('⬇️ Unduh PNG', unduh, true)));
  root.appendChild(box);
  box.appendChild(canvas);
  gambar();
}
