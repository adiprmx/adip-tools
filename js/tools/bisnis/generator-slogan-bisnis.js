import { h as T, utils } from '../../core.js';

// Generator slogan dari nama usaha, bidang, dan kata kunci pilihan user.
// Slogan disusun dari pola kalimat tetap yang diisi data user, lalu
// didedup dan diurutkan. Tanpa klaim superlatif yang tidak bisa dibuktikan
// (tidak ada "terbaik", "nomor satu", atau sejenisnya).
const POLA = [
  (n, b) => n + ', ' + b + ' yang bisa diandalkan',
  (n, b) => 'Semua urusan ' + b + ', satu nama: ' + n,
  (n, b) => n + ' hadir untuk ' + b + ' sehari-hari',
  (n, b) => 'Butuh ' + b + '? Ingat ' + n,
  (n, b) => n + ': ' + b + ' tanpa ribet',
  (n, b) => 'Dari ' + n + ', untuk ' + b + ' yang lebih baik',
  (n, b) => n + ' mengerti ' + b,
  (n, b) => b + ' jadi gampang bersama ' + n,
  (n, b) => n + ', teman ' + b + 'mu',
  (n, b) => 'Pilih ' + n + ', urusan ' + b + ' beres',
];
export function buatSlogan(nama, bidang, kataKunci) {
  const n = String(nama || '').trim();
  const b = String(bidang || '').trim();
  if (!n || !b) return [];
  const kata = String(kataKunci || '').split(/[\n,]+/).map((s) => s.trim()).filter(Boolean).slice(0, 3);
  const hasil = POLA.map((p) => p(n, b));
  kata.forEach((k) => {
    hasil.push(n + ': ' + b + ' yang ' + k);
    hasil.push(k.charAt(0).toUpperCase() + k.slice(1) + ' dalam setiap ' + b + ' dari ' + n);
  });
  return [...new Set(hasil)];
}
utils.sloganBisnis = buatSlogan;

export const meta = {"id": "generator-slogan-bisnis", "name": "Generator Slogan Bisnis", "cat": "bisnis", "icon": "💡", "desc": "Buat slogan yang mudah diingat dari nama dan bidang usahamu.", "keywords": "slogan,bisnis,tagline,merek,branding,usaha,nama,iklan,jargon", "since": "6.18.0"};
export function render(root) {
  const namaI = T.input('text', 'cth: Kopi Sore', '');
  const bidangI = T.input('text', 'cth: kopi / laundry / jasa desain', '');
  const kataI = T.input('text', 'cth: cepat, ramah, asli (boleh kosong)', '');
  const box = T.out();
  let daftar = [];

  const buat = () => {
    daftar = buatSlogan(namaI.value, bidangI.value, kataI.value);
    if (!daftar.length) {
      T.show(box, '<div class="err">Isi dulu nama usaha dan bidangnya.</div>');
      return;
    }
    T.show(box,
      '<div class="big">' + daftar.length + ' slogan</div>' +
      '<p class="center mut">Ketuk slogan untuk menyalinnya.</p>' +
      '<div style="display:flex;flex-direction:column;gap:8px;margin-top:12px">' +
      daftar.map((s, i) => '<button type="button" data-i="' + i + '" style="text-align:left;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:12px;font-size:14px;line-height:1.5;color:inherit;cursor:pointer">' + T.esc(s) + '</button>').join('') +
      '</div>' +
      '<p class="hint">Slogan yang bagus itu pendek, gampang diingat, dan sesuai dengan yang usahamu kerjakan. Coba ucapkan keras-keras sebelum dipakai.</p>');
    box.querySelectorAll('button[data-i]').forEach((btn) => {
      btn.addEventListener('click', () => {
        T.copy(daftar[Number(btn.getAttribute('data-i'))]);
        T.toast('Slogan disalin.');
      });
    });
    box.appendChild(T.copyBtn(() => daftar.join('\n'), 'Salin semua slogan'));
  };

  root.appendChild(T.el('<p class="note">Slogan yang bagus membuat orang ingat usahamu. Masukkan nama usaha dan bidangnya, alat ini membuat daftar slogan yang bisa kamu pilih dan ubah seperlunya.</p>'));
  root.appendChild(T.field('Nama usaha', namaI));
  root.appendChild(T.field('Bidang usaha', bidangI, 'Satu atau dua kata, contoh: kopi, laundry, jasa desain'));
  root.appendChild(T.field('Kata kunci (boleh kosong)', kataI, 'Pisahkan dengan koma. Slogan tambahan dibuat dari kata-kata ini.'));
  root.appendChild(T.row(T.btn('Buat slogan', buat, true)));
  root.appendChild(box);
}
