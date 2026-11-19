import { h as T } from '../../core.js';

export const meta = {"id":"generator-caption-reels-tiktok","name":"Generator Caption Reels/TikTok","cat":"kreator","icon":"🎬","desc":"Caption singkat + ajakan interaksi untuk video pendek, dari template.","keywords":"caption,reels,tiktok,video pendek,hashtag,kreator,template","since":"6.19.0"};

const NICHE = [
  ['umum', 'Umum'],
  ['kuliner', 'Kuliner'],
  ['fashion', 'Fashion'],
  ['edukasi', 'Edukasi'],
  ['travel', 'Traveling'],
  ['komedi', 'Komedi'],
  ['kecantikan', 'Kecantikan'],
  ['teknologi', 'Teknologi'],
];
const GAYA = [
  ['santai', 'Santai'],
  ['lucu', 'Lucu'],
  ['langsung', 'To the point'],
  ['inspiratif', 'Inspiratif'],
];
const CTA = [
  ['komen', 'Minta komentar'],
  ['simpan', 'Minta simpan'],
  ['bagikan', 'Minta bagikan'],
  ['ikuti', 'Minta follow'],
];

const HOOK = {
  santai: [
    'Jujur, ini salah satu hal paling seru soal {topik}.',
    'Baru sadar kalau {topik} ternyata segini menyenangkannya.',
    'Video ini buat kamu yang lagi penasaran sama {topik}.',
    'Nggak nyangka {topik} bisa seenak ini.',
  ],
  lucu: [
    'Siapa yang nyuruh aku coba {topik}? Sekarang malah ketagihan.',
    'POV: kamu baru kenal {topik} dan langsung nggak bisa berhenti.',
    'Aku kira {topik} itu biasa aja. Ternyata aku salah besar.',
    'Niatnya coba {topik} sebentar, eh malah keterusan.',
  ],
  langsung: [
    'Ini yang perlu kamu tahu soal {topik}.',
    '{topik}, dijelaskan singkat.',
    'Tiga hal penting soal {topik}, langsung ke intinya.',
    'Kalau kamu suka {topik}, video ini buat kamu.',
  ],
  inspiratif: [
    'Mulai dari {topik}, aku belajar satu hal penting.',
    'Nggak ada kata terlambat buat mulai {topik}.',
    '{topik} mengubah caraku melihat hal kecil sehari-hari.',
    'Satu langkah kecil di {topik} bisa jadi awal yang besar.',
  ],
};
const ISI = {
  santai: [
    'Di video ini aku cerita pelan-pelan, tanpa buru-buru.',
    'Semua yang aku tunjukin di sini bisa kamu coba sendiri di rumah.',
    'Aku bagiin versi yang paling gampang diikuti.',
  ],
  lucu: [
    'Ada bagian yang bikin aku ketawa sendiri pas edit.',
    'Tonton sampai akhir, ada kejadian nggak terduga di tengah.',
    'Percaya deh, akhirnya di luar dugaan.',
  ],
  langsung: [
    'Poin pertama, kedua, dan ketiga sudah aku rangkum di video.',
    'Nggak pakai bertele-tele, semua langsung ke praktiknya.',
    'Cek tiap bagiannya, ada yang mungkin belum kamu tahu.',
  ],
  inspiratif: [
    'Semoga cerita ini bikin kamu berani mulai hari ini juga.',
    'Prosesnya memang pelan, tapi hasilnya nyata.',
    'Kalau aku bisa, kamu juga bisa.',
  ],
};
const AJAKAN = {
  komen: ['Coba tulis di kolom komentar, kamu tim yang mana?', 'Kamu pernah ngalamin juga? Cerita di komentar ya.', 'Setuju atau nggak? Tulis pendapatmu di bawah.'],
  simpan: ['Simpan dulu videonya, biar gampang dicari pas butuh.', 'Tekan simpan, nanti kamu bakal balik lagi ke video ini.', 'Jangan lupa simpan biar nggak hilang.'],
  bagikan: ['Kirim video ini ke teman yang butuh lihat ini.', 'Bagikan ke orang yang paling cocok nonton ini.', 'Tag temanmu yang wajib tahu soal ini.'],
  ikuti: ['Follow biar nggak ketinggalan video berikutnya.', 'Ikuti akun ini kalau kamu suka konten kayak gini.', 'Follow dulu, video berikutnya lebih seru.'],
};
const TAGAR = {
  umum: ['#fyp', '#reels', '#tiktok', '#viral', '#konten'],
  kuliner: ['#kuliner', '#resep', '#makanan', '#foodie', '#masak'],
  fashion: ['#fashion', '#ootd', '#style', '#outfit', '#fashioninspo'],
  edukasi: ['#belajar', '#edukasi', '#tips', '#ilmu', '#belajarbareng'],
  travel: ['#travel', '#jalanjalan', '#liburan', '#wisata', '#traveling'],
  komedi: ['#lucu', '#komedi', '#ngakak', '#hiburan', '#humor'],
  kecantikan: ['#skincare', '#makeup', '#beauty', '#kecantikan', '#glowup'],
  teknologi: ['#teknologi', '#gadget', '#tech', '#review', '#inovasi'],
};

function acakDari(arr, rnd) { return arr[Math.floor(rnd() * arr.length)]; }
function isiTemplate(s, topik) { return s.split('{topik}').join(topik); }

// Pembentuk caption murni (bisa diuji tanpa DOM). rnd: fungsi () => [0,1).
export function buatCaption(o, rnd) {
  const r = typeof rnd === 'function' ? rnd : Math.random;
  const topik = (o && o.topik || '').trim();
  const gaya = (HOOK[o && o.gaya] ? o.gaya : 'santai');
  const niche = (TAGAR[o && o.niche] ? o.niche : 'umum');
  const cta = (AJAKAN[o && o.cta] ? o.cta : 'komen');
  const jumlah = Math.min(8, Math.max(1, parseInt((o && o.jumlah) || '3', 10) || 3));
  const hasil = [];
  const dipakai = new Set();
  let guard = 0;
  while (hasil.length < jumlah && guard < 60) {
    guard++;
    const teks = isiTemplate(acakDari(HOOK[gaya], r), topik) + ' ' +
      acakDari(ISI[gaya], r) + ' ' + acakDari(AJAKAN[cta], r) + '\n' + TAGAR[niche].join(' ');
    if (dipakai.has(teks)) continue;
    dipakai.add(teks);
    hasil.push(teks);
  }
  return hasil;
}

export function render(root) {
  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Caption disusun dari template dan bank kata, bukan AI. Masukkan topikmu, pilih gaya dan ajakannya, lalu ambil yang paling cocok. Edit seperlunya sebelum dipakai.</p>'));

  const topikI = T.input('text', 'Topik video, contoh: resep kopi susu gula aren');
  topikI.maxLength = 120;
  root.appendChild(T.field('Topik video', topikI));
  const nicheSel = T.select(NICHE, 'umum');
  const gayaSel = T.select(GAYA, 'santai');
  root.appendChild(T.grid2(T.field('Niche', nicheSel), T.field('Gaya caption', gayaSel)));
  const ctaSel = T.select(CTA, 'komen');
  const jumlahSel = T.select([['3', '3 caption'], ['5', '5 caption']], '3');
  root.appendChild(T.grid2(T.field('Ajakan di akhir', ctaSel), T.field('Jumlah', jumlahSel)));

  const statusBox = T.el('<div class="dim" style="font-size:12.5px;margin:8px 0;min-height:18px" role="status" aria-live="polite"></div>');
  const out = T.out();
  let lastHasil = [];

  function tampil() {
    const topik = topikI.value.trim();
    if (topik.length < 3) {
      statusBox.innerHTML = '<span class="err">Tulis topik videonya dulu, minimal 3 huruf.</span>';
      topikI.focus();
      return;
    }
    statusBox.textContent = '';
    lastHasil = buatCaption({ topik, niche: nicheSel.value, gaya: gayaSel.value, cta: ctaSel.value, jumlah: jumlahSel.value });
    let html = '';
    lastHasil.forEach((c, i) => {
      html += '<div style="border:1px solid var(--line);border-radius:12px;padding:12px;margin-bottom:10px">' +
        '<div style="font-size:12px;color:var(--faint);margin-bottom:6px">Caption ' + (i + 1) + ' (' + c.length + ' karakter)</div>' +
        '<div style="font-size:14px;line-height:1.7;white-space:pre-wrap;word-break:break-word">' + T.esc(c) + '</div>' +
        '</div>';
    });
    T.show(out, html);
    const row = T.el('<div style="display:flex;gap:6px;flex-wrap:wrap"></div>');
    lastHasil.forEach((c, i) => {
      row.appendChild(T.copyBtn(() => c, 'Salin ' + (i + 1)));
    });
    row.appendChild(T.copyBtn(() => lastHasil.join('\n\n'), 'Salin semua'));
    row.appendChild(T.btn('Buat lagi', tampil));
    out.appendChild(row);
  }

  root.appendChild(T.el('<div style="height:8px"></div>'));
  root.appendChild(T.row(T.btn('Buat Caption', tampil, true)));
  root.appendChild(statusBox);
  root.appendChild(out);
  T.show(out, '<div class="dim center" style="padding:14px 0">Captionmu akan tampil di sini.</div>');
}
