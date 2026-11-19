import { h as T, utils } from '../../core.js';

// Pembuat Bingo Target Tahunan: ubah 24 target setahunmu jadi kartu
// bingo 5x5 (tengah = GRATIS). Ketuk kotak untuk mencentang target
// yang sudah tercapai, progres + garis bingo terhitung otomatis,
// tersimpan di HP ini. Bisa diunduh sebagai wallpaper HP (PNG
// 1080x1920) atau dicetak. Beda dengan generator-kartu-bingo (kartu
// permainan angka 75 bola + pemanggil bola): ini pelacak target,
// bukan kartu main bingo.
export const meta = {"id": "bingo-target-tahunan", "name": "Pembuat Bingo Target Tahunan", "cat": "fun", "icon": "🎯", "desc": "Ubah target setahunmu jadi kartu bingo 5x5 yang bisa dicentang. Progres tersimpan, bisa jadi wallpaper HP atau dicetak.", "keywords": "bingo,target,tahunan,goals,resolusi,wallpaper,cetak,progres,2026", "since": "6.19.0"};

const LS_KEY = 'bingo-target-tahunan-v1';
export const JUMLAH_TARGET = 24;

// Garis bingo: 5 baris + 5 kolom + 2 diagonal (indeks grid 0-24).
export const GARIS = [
  [0, 1, 2, 3, 4], [5, 6, 7, 8, 9], [10, 11, 12, 13, 14],
  [15, 16, 17, 18, 19], [20, 21, 22, 23, 24],
  [0, 5, 10, 15, 20], [1, 6, 11, 16, 21], [2, 7, 12, 17, 22],
  [3, 8, 13, 18, 23], [4, 9, 14, 19, 24],
  [0, 6, 12, 18, 24], [4, 8, 12, 16, 20],
];

// Hitung garis bingo lengkap dari set indeks tercentang. Murni.
export function hitungGaris(centang) {
  const set = new Set(centang);
  return GARIS.filter((g) => g.every((i) => set.has(i))).length;
}

// Progres: jumlah tercentang dari 25 kotak (tengah GRATIS terhitung).
export function hitungProgres(centang) {
  return Math.min(25, new Set(centang).size);
}

// Daftar target dari teks (satu per baris): 24 baris, kosong diisi ''.
export function parseTarget(teks) {
  const list = String(teks || '').split('\n').map((s) => s.trim());
  const out = [];
  for (let i = 0; i < JUMLAH_TARGET; i++) out.push(list[i] || '');
  return out;
}

// Grid 25 sel dari 24 target (indeks 12 = GRATIS). Murni.
export function buatGrid(target) {
  const grid = [];
  let k = 0;
  for (let i = 0; i < 25; i++) {
    if (i === 12) grid.push('GRATIS');
    else grid.push(target[k++] || '');
  }
  return grid;
}

function muatState() {
  try {
    const s = JSON.parse(localStorage.getItem(LS_KEY) || 'null');
    if (s && Array.isArray(s.target) && Array.isArray(s.centang)) return s;
  } catch (e) { /* abaikan */ }
  return { target: parseTarget(''), centang: [12], judul: '' };
}
function simpanState(s) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(s)); } catch (e) { /* abaikan */ }
}

export function render(root) {
  const box = T.out();
  const state = muatState();
  const tahunIni = new Date().getFullYear();
  const judulI = T.input('text', 'cth: Target ' + tahunIni);
  judulI.value = state.judul || '';
  const daftarI = T.ta(8, 'Satu target per baris (24 target).\ncth:\nLari 5K\nBaca 12 buku\nNabung 10 juta\n...', state.target.filter(Boolean).join('\n'));
  // Field editor dibungkus satu wadah: tampil saat mode edit, sembunyi
  // saat grid tampil (supaya tidak ada kontrol mati di layar).
  const editorFields = T.el('<div></div>');
  editorFields.appendChild(T.field('Judul kartu (opsional)', judulI));
  editorFields.appendChild(T.field('Daftar 24 targetmu', daftarI, 'Satu target per baris. Baris kosong jadi kotak kosong.'));
  let modeEdit = !state.target.some(Boolean);

  const gambar = () => {
    editorFields.style.display = 'none';
    const grid = buatGrid(state.target);
    const centang = new Set(state.centang);
    if (!centang.has(12)) centang.add(12);
    const progres = hitungProgres(Array.from(centang));
    const garis = hitungGaris(Array.from(centang));
    const judul = (state.judul || '').trim() || 'Target ' + tahunIni;
    let html = '<p class="hint center">' + T.esc(judul) + '</p>' +
      '<div class="big center">' + progres + '<span class="mut" style="font-size:15px">/25 tercapai</span></div>' +
      '<p class="center hint">' + Math.round((progres / 25) * 100) + '% selesai' + (garis ? ' · ' + garis + ' garis bingo!' : '') + '</p>' +
      '<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:5px;margin:14px 0">';
    for (let i = 0; i < 25; i++) {
      const on = centang.has(i);
      const teks = grid[i] || (i === 12 ? 'GRATIS' : '');
      html += '<button type="button" data-sel="' + i + '" style="aspect-ratio:1;border:1px solid rgba(255,255,255,.16);border-radius:8px;padding:4px;font-size:10px;line-height:1.25;overflow:hidden;background:' + (on ? 'rgba(255,255,255,.92);color:#111' : 'rgba(255,255,255,.04);color:#fff') + ';cursor:pointer;text-align:center">' + T.esc(teks) + '</button>';
    }
    html += '</div><p class="hint center">Ketuk kotak untuk mencentang atau membatalkan. Kotak tengah selalu tercentang.</p>';
    T.show(box, html);
    box.querySelectorAll('[data-sel]').forEach((b) => {
      b.addEventListener('click', () => {
        const i = Number(b.getAttribute('data-sel'));
        if (i === 12) return;
        const s = new Set(state.centang);
        if (s.has(i)) s.delete(i); else s.add(i);
        state.centang = Array.from(s);
        simpanState(state);
        gambar();
      });
    });
    const baris = T.el('<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px"></div>');
    baris.appendChild(T.btn('✏️ Ubah daftar target', () => { modeEdit = true; gambarEditor(); }, false));
    baris.appendChild(T.btn('⬇️ Unduh wallpaper HP', unduhWallpaper, true));
    baris.appendChild(T.btn('🖨️ Cetak', () => window.print(), false));
    box.appendChild(baris);
  };

  const gambarEditor = () => {
    editorFields.style.display = '';
    T.show(box,
      '<p class="hint">Tulis 24 targetmu, satu per baris. Kotak tengah otomatis GRATIS. Target yang sudah dicentang tetap tersimpan.</p>');
    const simpan = T.btn('Simpan daftar', () => {
      state.target = parseTarget(daftarI.value);
      state.judul = judulI.value.trim();
      simpanState(state);
      modeEdit = false;
      gambar();
    }, true);
    simpan.style.marginTop = '12px';
    box.appendChild(simpan);
    if (state.target.some(Boolean)) {
      const batal = T.btn('Batal', () => { modeEdit = false; gambar(); }, false);
      batal.style.marginTop = '12px';
      batal.style.marginLeft = '8px';
      box.appendChild(batal);
    }
  };

  const unduhWallpaper = () => {
    const grid = buatGrid(state.target);
    const centang = new Set(state.centang);
    centang.add(12);
    const judul = (state.judul || '').trim() || 'Target ' + tahunIni;
    const c = document.createElement('canvas');
    c.width = 1080; c.height = 1920;
    const x = c.getContext('2d');
    x.fillStyle = '#171923'; x.fillRect(0, 0, 1080, 1920);
    x.textAlign = 'center';
    x.fillStyle = '#fff'; x.font = '700 54px system-ui, sans-serif';
    x.fillText(judul.slice(0, 24), 540, 180);
    x.font = '400 30px system-ui, sans-serif'; x.fillStyle = '#a1a1aa';
    const progres = hitungProgres(Array.from(centang));
    x.fillText(progres + '/25 tercapai', 540, 235);
    const ox = 60, oy = 320, uk = 180, gap = 12;
    for (let i = 0; i < 25; i++) {
      const r = Math.floor(i / 5), k = i % 5;
      const px = ox + k * (uk + gap), py = oy + r * (uk + gap);
      const on = centang.has(i);
      x.fillStyle = on ? '#f5f5f5' : '#26262e';
      x.strokeStyle = 'rgba(255,255,255,.2)'; x.lineWidth = 2;
      x.beginPath();
      x.roundRect(px, py, uk, uk, 16);
      x.fill(); x.stroke();
      x.fillStyle = on ? '#111' : '#fff';
      x.font = (i === 12 ? '700 30px' : '400 24px') + ' system-ui, sans-serif';
      const teks = grid[i] || '';
      const kata = String(teks).split(' ');
      const barisTeks = [];
      let cur = '';
      for (const w of kata) {
        if (x.measureText(cur + ' ' + w).width > uk - 24 && cur) { barisTeks.push(cur); cur = w; }
        else cur = cur ? cur + ' ' + w : w;
      }
      if (cur) barisTeks.push(cur);
      const mulai = py + uk / 2 - ((barisTeks.length - 1) * 16);
      barisTeks.slice(0, 4).forEach((t, j) => x.fillText(t, px + uk / 2, mulai + j * 32));
      if (on && i !== 12) {
        x.strokeStyle = '#111'; x.lineWidth = 5;
        x.beginPath();
        x.moveTo(px + 30, py + uk - 30); x.lineTo(px + 70, py + uk - 60); x.lineTo(px + uk - 30, py + 40);
        x.stroke();
      }
    }
    x.fillStyle = '#52525b'; x.font = '400 24px system-ui, sans-serif';
    x.fillText('Dibuat di Adip Tools', 540, 1860);
    c.toBlob((b) => { if (b) T.dl('bingo-target-' + tahunIni + '.png', b, 'image/png'); else T.toast('Gagal membuat PNG.'); }, 'image/png');
  };

  const styleCetak = T.el('<style>@media print { body * { visibility: hidden; } .out, .out * { visibility: visible; } .out { position: absolute; top: 0; left: 0; width: 100%; } .out button { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }</style>');
  root.appendChild(styleCetak);
  root.appendChild(T.el('<p class="hint">Tulis 24 target setahunmu, lalu centang satu per satu saat tercapai. Lima kotak sebaris = bingo! Kartu tersimpan di HP ini, jadi progresmu tidak hilang.</p>'));
  root.appendChild(editorFields);
  root.appendChild(box);
  if (modeEdit) gambarEditor();
  else gambar();
}
