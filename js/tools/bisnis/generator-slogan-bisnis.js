import { h as T, utils } from '../../core.js';

// Generator slogan dari nama usaha, bidang, dan kata kunci pilihan user.
// Slogan disusun dari pola kalimat yang diisi data user, lalu didedup.
// Tanpa klaim superlatif yang tidak bisa dibuktikan (tidak ada "terbaik",
// "nomor satu", atau sejenisnya).
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
// Pola tambahan per gaya. Gaya 'campur' memakai semua pola.
export const POLA_GAYA = {
  santai: [
    (n, b) => n + ': ' + b + ' santai, hasil tetap rapi',
    (n, b) => 'Nongkrong dulu, urusan ' + b + ' biar ' + n,
    (n, b) => b + ' asyik, bareng ' + n,
    (n, b) => n + ' — ' + b + ' tanpa drama',
    (n, b) => 'Santai aja, ' + b + 'mu di tangan ' + n,
  ],
  tegas: [
    (n, b) => n + ': ' + b + ' selesai tepat waktu',
    (n, b) => 'Urusan ' + b + ', kami yang tanggung jawab. ' + n,
    (n, b) => n + ' — ' + b + ' dikerjakan sampai beres',
    (n, b) => 'Tidak pakai lama: ' + b + ' di ' + n,
    (n, b) => n + ': standar ' + b + ' yang jelas',
  ],
  ramah: [
    (n, b) => n + ': ' + b + ' dengan senyum',
    (n, b) => 'Di ' + n + ', ' + b + 'mu diperlakukan istimewa',
    (n, b) => n + ' selalu siap bantu urusan ' + b + 'mu',
    (n, b) => 'Cerita ' + b + 'mu, kami yang dengarkan — ' + n,
    (n, b) => n + ': ' + b + ' yang bikin pelanggan betah',
  ],
  kreatif: [
    (n, b) => n + ': ' + b + ' dengan cara yang beda',
    (n, b) => 'Bayangkan ' + b + ' yang belum pernah ada — ' + n,
    (n, b) => n + ' meracik ' + b + ' jadi pengalaman',
    (n, b) => b + ' versi ' + n + ': lain dari yang lain',
    (n, b) => 'Ide ' + b + ' liar? ' + n + ' yang wujudkan',
  ],
};
export const GAYA_SLOGAN = [
  ['campur', 'Campur semua gaya'],
  ['santai', 'Santai'],
  ['tegas', 'Tegas'],
  ['ramah', 'Ramah'],
  ['kreatif', 'Kreatif'],
];

/** Acak urutan array (Fisher-Yates) memakai fungsi acak `rng` (0–1).
    Bila rng tidak diberikan, pakai Math.random. */
export function acakUrutan(arr, rng) {
  const r = typeof rng === 'function' ? rng : Math.random;
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    const t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}

// Buat slogan dari nama, bidang, kata kunci, dan gaya.
// `acak`: bila fungsi rng diberikan, urutan hasil diacak (tiap "Acak lagi"
// memberi susunan baru); bila tidak, urutan tetap seperti pola aslinya.
export function buatSlogan(nama, bidang, kataKunci, gaya, acak) {
  const n = String(nama || '').trim();
  const b = String(bidang || '').trim();
  if (!n || !b) return [];
  const kata = String(kataKunci || '').split(/[\n,]+/).map((s) => s.trim()).filter(Boolean).slice(0, 3);
  const g = gaya && POLA_GAYA[gaya] ? gaya : 'campur';
  const pola = g === 'campur' ? POLA.concat(...Object.values(POLA_GAYA)) : POLA.concat(POLA_GAYA[g]);
  const hasil = pola.map((p) => p(n, b));
  kata.forEach((k) => {
    hasil.push(n + ': ' + b + ' yang ' + k);
    hasil.push(k.charAt(0).toUpperCase() + k.slice(1) + ' dalam setiap ' + b + ' dari ' + n);
  });
  const unik = [...new Set(hasil)];
  // Tanpa acak: tampilkan semua (perilaku lama, slogan kata kunci tetap
  // terlihat). Dengan acak: ambil 12 dari susunan acak sebagai set baru.
  if (typeof acak === 'function') return acakUrutan(unik, acak).slice(0, 12);
  return unik;
}
utils.sloganBisnis = buatSlogan;

export const meta = {"id": "generator-slogan-bisnis", "name": "Generator Slogan Bisnis", "cat": "bisnis", "icon": "💡", "desc": "Buat slogan yang mudah diingat dari nama dan bidang usahamu.", "keywords": "slogan,bisnis,tagline,merek,branding,usaha,nama,iklan,jargon", "since": "6.18.0"};
export function render(root) {
  const namaI = T.input('text', 'cth: Kopi Sore', '');
  const bidangI = T.input('text', 'cth: kopi / laundry / jasa desain', '');
  const kataI = T.input('text', 'cth: cepat, ramah, asli (boleh kosong)', '');
  const gayaS = T.select(GAYA_SLOGAN, 'campur');
  const box = T.out();
  let daftar = [];

  const buat = (acak) => {
    daftar = buatSlogan(namaI.value, bidangI.value, kataI.value, gayaS.value, acak ? Math.random : null);
    if (!daftar.length) {
      T.show(box, '<div class="err">Isi dulu nama usaha dan bidangnya.</div>');
      return;
    }
    T.show(box,
      '<div class="big">' + daftar.length + ' slogan</div>' +
      '<p class="center mut">Ketuk slogan untuk menyalinnya. Bosan dengan susunannya? Ketuk "Acak lagi".</p>' +
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

  root.appendChild(T.el('<p class="note">Slogan yang bagus membuat orang ingat usahamu. Masukkan nama usaha dan bidangnya, pilih gayanya, alat ini membuat daftar slogan yang bisa kamu pilih dan ubah seperlunya.</p>'));
  root.appendChild(T.field('Nama usaha', namaI));
  root.appendChild(T.field('Bidang usaha', bidangI, 'Satu atau dua kata, contoh: kopi, laundry, jasa desain'));
  root.appendChild(T.field('Gaya slogan', gayaS, 'Nada bicara sloganmu — santai, tegas, ramah, kreatif, atau campur semuanya.'));
  root.appendChild(T.field('Kata kunci (boleh kosong)', kataI, 'Pisahkan dengan koma. Slogan tambahan dibuat dari kata-kata ini.'));
  root.appendChild(T.row(T.btn('Buat slogan', () => buat(false), true), T.btn('🎲 Acak lagi', () => buat(true))));
  root.appendChild(box);
}
