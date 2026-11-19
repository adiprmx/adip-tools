import { h as T } from '../../core.js';

export const meta = {"id":"generator-nama-channel-youtube","name":"Generator Nama Channel YouTube","cat":"kreator","icon":"▶️","desc":"Nama channel dari kata kunci dan gaya yang kamu pilih.","keywords":"nama channel,youtube,kreator,branding,nama,template","since":"6.19.0"};

const GAYA = [
  ['santai', 'Santai'],
  ['profesional', 'Profesional'],
  ['mainkata', 'Main kata'],
  ['minimal', 'Minimal'],
];

const AWAL = {
  santai: ['Kita', 'Ruang', 'Cerita', 'Santai', 'Ngobrol', 'Dunia', 'Sudut', 'Harian'],
  profesional: ['Studio', 'Media', 'Akademi', 'Lab', 'Pusat', 'Kanal', 'Institut', 'Karya'],
  mainkata: ['Si', 'Sang', 'Ayo', 'Yuk', 'Mari', 'Teman', 'Sahabat', 'Geng'],
  minimal: ['Satu', 'Dua', 'Nol', 'Arun', 'Titik', 'Garis', 'Ruang', 'Nada'],
};
const AKHIR = {
  santai: ['TV', 'ID', 'Bareng', 'Kuy', 'Aja', 'Kita', 'Santai', 'Daily'],
  profesional: ['Official', 'Studio', 'Media', 'ID', 'Pro', 'Channel', 'Network', 'TV'],
  mainkata: ['Banget', 'Banget!', 'Dong', 'Yuk', 'Lagi', 'Terus', 'Aja', 'Dulu'],
  minimal: ['.', 'ID', 'co', 'TV', 'Lab', 'IDN', 'ID', 'Studio'],
};
const SISIP = ['dengan', 'dan', 'di', 'ala', 'versi', 'tentang'];

function kapital(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }
function acakDari(arr, rnd) { return arr[Math.floor(rnd() * arr.length)]; }

// Pembentuk nama murni (bisa diuji tanpa DOM). rnd: fungsi () => [0,1).
export function buatNama(o, rnd) {
  const r = typeof rnd === 'function' ? rnd : Math.random;
  const kata = (o && o.kata || '').trim().replace(/\s+/g, ' ');
  const gaya = (AWAL[o && o.gaya] ? o.gaya : 'santai');
  const jumlah = Math.min(12, Math.max(1, parseInt((o && o.jumlah) || '10', 10) || 10));
  if (!kata) return [];
  const kunci = kata.split(' ').map(kapital).join(' ');
  const kunciRapat = kata.split(' ').map(kapital).join('');
  const hasil = [];
  const ada = new Set();
  const tambah = (n) => {
    const bersih = n.replace(/\s+/g, ' ').trim();
    if (!bersih || bersih.length > 40 || ada.has(bersih.toLowerCase())) return;
    ada.add(bersih.toLowerCase());
    hasil.push(bersih);
  };
  let guard = 0;
  while (hasil.length < jumlah && guard < 120) {
    guard++;
    const pola = Math.floor(r() * 6);
    const aw = acakDari(AWAL[gaya], r);
    const ak = acakDari(AKHIR[gaya], r);
    if (pola === 0) tambah(aw + ' ' + kunci);
    else if (pola === 1) tambah(kunci + ' ' + ak);
    else if (pola === 2) tambah(aw + kunciRapat);
    else if (pola === 3) tambah(kunciRapat + ak);
    else if (pola === 4) tambah(kunci + ' ' + acakDari(SISIP, r) + ' ' + aw);
    else tambah(aw + ' ' + kunci + ' ' + ak);
  }
  return hasil;
}

export function render(root) {
  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Nama disusun dari pola dan bank kata, bukan AI. Alat ini tidak bisa mengecek nama yang sudah dipakai orang lain. Setelah dapat yang cocok, cek sendiri ketersediaannya di YouTube sebelum dipakai.</p>'));

  const kataI = T.input('text', 'Kata kunci, contoh: masak rumahan');
  kataI.maxLength = 40;
  root.appendChild(T.field('Kata kunci channel', kataI));
  const gayaSel = T.select(GAYA, 'santai');
  const jumlahSel = T.select([['6', '6 nama'], ['10', '10 nama']], '10');
  root.appendChild(T.grid2(T.field('Gaya nama', gayaSel), T.field('Jumlah', jumlahSel)));

  const statusBox = T.el('<div class="dim" style="font-size:12.5px;margin:8px 0;min-height:18px" role="status" aria-live="polite"></div>');
  const out = T.out();
  let lastHasil = [];

  function tampil() {
    const kata = kataI.value.trim();
    if (kata.length < 2) {
      statusBox.innerHTML = '<span class="err">Tulis kata kuncinya dulu, minimal 2 huruf.</span>';
      kataI.focus();
      return;
    }
    statusBox.textContent = '';
    lastHasil = buatNama({ kata, gaya: gayaSel.value, jumlah: jumlahSel.value });
    let html = '';
    lastHasil.forEach((n) => {
      html += '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;border:1px solid var(--line);border-radius:10px;padding:10px 12px;margin-bottom:8px">' +
        '<span style="font-size:15px;font-weight:600;word-break:break-word">' + T.esc(n) + '</span>' +
        '<span class="hint" style="white-space:nowrap">' + n.length + ' huruf</span></div>';
    });
    T.show(out, html);
    const row = T.el('<div style="display:flex;gap:6px;flex-wrap:wrap"></div>');
    row.appendChild(T.copyBtn(() => lastHasil.join('\n'), 'Salin semua'));
    row.appendChild(T.btn('Acak lagi', tampil));
    out.appendChild(row);
  }

  root.appendChild(T.el('<div style="height:8px"></div>'));
  root.appendChild(T.row(T.btn('Buat Nama', tampil, true)));
  root.appendChild(statusBox);
  root.appendChild(out);
  T.show(out, '<div class="dim center" style="padding:14px 0">Nama channel akan tampil di sini.</div>');
}
