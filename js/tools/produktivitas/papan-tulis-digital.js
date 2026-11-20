import { h as T } from '../../core.js';

// Papan tulis: gambar bebas di canvas, simpan otomatis di browser ini
// (localStorage) dan bisa diunduh sebagai gambar PNG.
const LS_KEY = 'adiptools:papan-tulis-digital';
const WARNA = [
  ['#ff6f61', 'Coral'], ['#ffffff', 'Putih'], ['#ffd166', 'Kuning'],
  ['#4ade80', 'Hijau'], ['#60a5fa', 'Biru'], ['#c084fc', 'Ungu'],
  ['#161311', 'Penghapus'],
];
const W = 900, H = 520;

export const meta = {"id": "papan-tulis-digital", "name": "Papan Tulis Digital", "cat": "produktivitas", "icon": "✏️", "desc": "Corat-coret, sketsa, dan catat ide di papan tulis. Tersimpan otomatis di browser.", "keywords": "papan tulis,whiteboard,gambar,sketsa,corat coret,catatan", "since": "6.16.0"};
export function render(root) {
  const wrap = T.el('<div></div>');
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  canvas.style.cssText = 'width:100%;height:auto;display:block;background:#1e1a17;border:1px solid rgba(255,255,255,.12);border-radius:12px;touch-action:none;cursor:crosshair';
  const ctx = canvas.getContext('2d');
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';

  let warna = WARNA[0][0];
  let tebal = 4;
  let menggambar = false;
  let last = null;
  const riwayat = []; // snapshot dataURL, maks 20

  const catat = () => { riwayat.push(canvas.toDataURL('image/png')); if (riwayat.length > 20) riwayat.shift(); };
  const peringatanBox = T.out();
  const unduhPng = () => {
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = 'papan-tulis.png';
    a.click();
  };
  // Simpan otomatis bisa gagal saat penyimpanan browser penuh (gambar PNG
  // penuh bisa besar). Sebelumnya gagal diam-diam dan user mengira
  // gambarnya tersimpan. Sekarang: kembalikan status, tampilkan
  // peringatan jujur, dan tawarkan unduh supaya gambar tidak hilang.
  const simpan = () => {
    try {
      localStorage.setItem(LS_KEY, canvas.toDataURL('image/png'));
      T.hide(peringatanBox);
      return true;
    } catch (e) {
      T.show(peringatanBox, '<div class="err" style="margin-bottom:8px">Gambar tidak bisa disimpan otomatis karena penyimpanan browser penuh. Unduh gambarnya sekarang supaya tidak hilang.</div>');
      peringatanBox.appendChild(T.btn('⬇ Unduh PNG sekarang', unduhPng, true));
      return false;
    }
  };
  const muat = (url) => {
    const img = new Image();
    img.onload = () => { ctx.clearRect(0, 0, W, H); ctx.drawImage(img, 0, 0); };
    img.src = url;
  };
  const posisi = (e) => {
    const r = canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height };
  };

  canvas.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* abaikan bila tidak didukung */ }
    catat();
    menggambar = true;
    last = posisi(e);
    ctx.beginPath(); ctx.moveTo(last.x, last.y);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!menggambar) return;
    const p = posisi(e);
    ctx.strokeStyle = warna;
    ctx.lineWidth = warna === '#161311' ? tebal * 4 : tebal;
    ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(p.x, p.y); ctx.stroke();
    last = p;
  });
  const selesai = () => { if (menggambar) { menggambar = false; simpan(); } };
  canvas.addEventListener('pointerup', selesai);
  canvas.addEventListener('pointercancel', selesai);

  const palet = T.el('<div class="row" style="flex-wrap:wrap;gap:8px;margin:12px 0"></div>');
  WARNA.forEach(([c, nama]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = nama;
    b.setAttribute('aria-label', 'Warna ' + nama);
    b.style.cssText = 'min-height:36px;padding:0 12px;border-radius:999px;border:2px solid ' + (c === warna ? '#fff' : 'rgba(255,255,255,.2)') + ';background:' + c + ';color:' + (c === '#ffffff' || c === '#ffd166' || c === '#4ade80' ? '#161311' : '#fff') + ';font-size:13px;cursor:pointer';
    b.addEventListener('click', () => {
      warna = c;
      palet.querySelectorAll('button').forEach((x) => { x.style.borderColor = 'rgba(255,255,255,.2)'; });
      b.style.borderColor = '#fff';
    });
    palet.appendChild(b);
  });

  const tebalI = T.input('range', '', '4');
  tebalI.min = '1'; tebalI.max = '20'; tebalI.step = '1';
  tebalI.addEventListener('input', () => { tebal = Number(tebalI.value) || 4; });

  const undoBtn = T.btn('↩ Urungkan', () => {
    const s = riwayat.pop();
    if (s) { muat(s); simpan(); } else { T.toast('Tidak ada lagi yang bisa diurungkan'); }
  });
  const hapusBtn = T.btn('🗑 Hapus semua', () => {
    catat();
    ctx.clearRect(0, 0, W, H);
    simpan();
  });
  const unduhBtn = T.btn('⬇ Unduh PNG', unduhPng);

  root.appendChild(T.el('<p class="note">Gambar apa saja di papan ini — sketsa, coretan, atau catatan tangan. Gambar tersimpan otomatis di browser ini, jadi tetap ada saat kamu kembali.</p>'));
  wrap.appendChild(canvas);
  root.appendChild(wrap);
  root.appendChild(peringatanBox);
  root.appendChild(palet);
  root.appendChild(T.field('Ketebalan garis', tebalI, 'Geser untuk garis lebih tebal atau tipis'));
  const tombol = T.el('<div class="row" style="flex-wrap:wrap;gap:8px"></div>');
  tombol.appendChild(undoBtn); tombol.appendChild(hapusBtn); tombol.appendChild(unduhBtn);
  root.appendChild(tombol);

  try {
    const tersimpan = localStorage.getItem(LS_KEY);
    if (tersimpan) muat(tersimpan);
  } catch (e) { /* abaikan */ }
}
