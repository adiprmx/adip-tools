import { h as T } from '../../core.js';

export const meta = {"id":"generator-skrip-video-pendek","name":"Generator Skrip Video Pendek","cat":"kreator","icon":"📝","desc":"Skrip video 15-60 detik dari template: hook, isi, penutup.","keywords":"skrip,naskah,video pendek,reels,tiktok,hook,kreator,template","since":"6.19.0"};

const DURASI = [
  ['15', '15 detik'],
  ['30', '30 detik'],
  ['60', '60 detik'],
];
const GAYA = [
  ['lucu', 'Lucu'],
  ['edukatif', 'Edukatif'],
  ['cerita', 'Cerita'],
  ['jualan', 'Jualan'],
];

// Target kata per durasi pada kecepatan bicara sekitar 150 kata per menit.
export const TARGET_KATA = { '15': 38, '30': 75, '60': 150 };

const HOOK = {
  lucu: [
    'Aku kira {topik} itu gampang. Ternyata aku salah besar.',
    'Jangan coba {topik} sebelum nonton video ini.',
    'Ini kejadian paling kocak pas aku coba {topik}.',
  ],
  edukatif: [
    'Tiga hal soal {topik} yang jarang orang tahu.',
    'Kalau kamu suka {topik}, tiga menit ini worth it.',
    'Banyak yang salah paham soal {topik}. Ini penjelasan singkatnya.',
  ],
  cerita: [
    'Semua berawal dari {topik}, dan hidupku berubah.',
    'Ada satu kejadian soal {topik} yang nggak pernah aku lupa.',
    'Dulu aku nggak peduli {topik}. Sampai satu hari ini terjadi.',
  ],
  jualan: [
    'Produk ini menyelesaikan masalah {topik} dalam sekali pakai.',
    'Kalau kamu capek soal {topik}, ini solusinya.',
    'Satu hal yang bikin {topik} jadi jauh lebih gampang.',
  ],
};
const ISI = {
  lucu: [
    'Pertama, aku coba dengan cara yang kupikir benar. Hasilnya malah berantakan.',
    'Lalu aku coba cara kedua. Lebih parah, tapi lucu.',
    'Akhirnya aku nemu cara yang beneran jalan, dan ternyata sesederhana ini.',
  ],
  edukatif: [
    'Pertama, pahami dasarnya dulu. Tanpa dasar ini, sisanya susah diikuti.',
    'Kedua, perhatikan bagian yang paling sering dilewatkan orang.',
    'Ketiga, coba sendiri dengan contoh kecil sebelum naik ke yang besar.',
  ],
  cerita: [
    'Waktu itu aku lagi santai, tidak ada rencana apa-apa.',
    'Lalu kejadian itu datang tiba-tiba, dan aku harus memutuskan cepat.',
    'Keputusan itu yang mengubah semuanya sampai sekarang.',
  ],
  jualan: [
    'Cara pakainya gampang: buka, pakai, selesai dalam hitungan menit.',
    'Yang paling terasa bedanya adalah bagian ini, langsung kelihatan hasilnya.',
    'Harganya masuk akal untuk yang didapat, dan bisa dipakai berkali-kali.',
  ],
};
const PENUTUP = {
  lucu: [
    'Kalau kamu pernah ngalamin yang sama, tulis di komentar. Kita ketawa bareng.',
    'Follow biar nggak ketinggalan kejadian kocak berikutnya.',
  ],
  edukatif: [
    'Simpan video ini biar gampang dicari pas butuh. Follow untuk penjelasan berikutnya.',
    'Kalau ada yang masih bingung, tanya di komentar, aku jawab.',
  ],
  cerita: [
    'Kamu pernah ngalamin yang mirip? Cerita di kolom komentar.',
    'Follow, cerita berikutnya lebih seru dari ini.',
  ],
  jualan: [
    'Cek tautan di bio kalau kamu mau coba juga.',
    'Tulis di komentar kalau kamu mau lihat demo lebih lengkap.',
  ],
};
const TEKS_LAYAR = {
  lucu: ['Jangan ditiru di rumah', 'Bagian ini kocak', 'Akhirnya ketemu juga'],
  edukatif: ['Catat poin ini', 'Ini yang sering kelewat', 'Coba sendiri'],
  cerita: ['Waktu itu...', 'Lalu tiba-tiba...', 'Semuanya berubah'],
  jualan: ['Cara pakai', 'Hasilnya langsung kelihatan', 'Cek bio'],
};

function acakDari(arr, rnd) { return arr[Math.floor(rnd() * arr.length)]; }
function isiTemplate(s, topik) { return s.split('{topik}').join(topik); }
function hitungKata(s) { return s.split(/\s+/).filter(Boolean).length; }

// Pembentuk skrip murni (bisa diuji tanpa DOM). rnd: fungsi () => [0,1).
export function buatSkrip(o, rnd) {
  const r = typeof rnd === 'function' ? rnd : Math.random;
  const topik = (o && o.topik || '').trim();
  const gaya = (HOOK[o && o.gaya] ? o.gaya : 'edukatif');
  const durasi = (TARGET_KATA[o && o.durasi] ? String(o.durasi) : '30');
  const detik = parseInt(durasi, 10);
  const hook = isiTemplate(acakDari(HOOK[gaya], r), topik);
  const isi = ISI[gaya].slice(0, detik <= 15 ? 1 : detik <= 30 ? 2 : 3).map((s) => isiTemplate(s, topik));
  const penutup = acakDari(PENUTUP[gaya], r);
  const teksLayar = TEKS_LAYAR[gaya].slice(0, detik <= 15 ? 1 : detik <= 30 ? 2 : 3);
  const naskah = [hook].concat(isi).concat([penutup]).join(' ');
  const bagi = detik <= 15
    ? [{ label: 'Hook', detik: '0-3' }, { label: 'Isi', detik: '3-12' }, { label: 'Penutup', detik: '12-15' }]
    : detik <= 30
      ? [{ label: 'Hook', detik: '0-3' }, { label: 'Isi', detik: '3-25' }, { label: 'Penutup', detik: '25-30' }]
      : [{ label: 'Hook', detik: '0-5' }, { label: 'Isi', detik: '5-50' }, { label: 'Penutup', detik: '50-60' }];
  return { hook, isi, penutup, teksLayar, bagi, kata: hitungKata(naskah), targetKata: TARGET_KATA[durasi], durasi: detik, naskah };
}

export function render(root) {
  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Skrip disusun dari template hook, isi, dan penutup, bukan AI. Target kata dihitung dari kecepatan bicara sekitar 150 kata per menit, jadi sesuaikan dengan kecepatan bicaramu sendiri. Edit dan tambahkan detailmu sebelum syuting.</p>'));

  const topikI = T.input('text', 'Topik video, contoh: cara melipat baju cepat');
  topikI.maxLength = 120;
  root.appendChild(T.field('Topik video', topikI));
  const durasiSel = T.select(DURASI, '30');
  const gayaSel = T.select(GAYA, 'edukatif');
  root.appendChild(T.grid2(T.field('Durasi video', durasiSel), T.field('Gaya video', gayaSel)));

  const statusBox = T.el('<div class="dim" style="font-size:12.5px;margin:8px 0;min-height:18px" role="status" aria-live="polite"></div>');
  const out = T.out();
  let lastHasil = null;

  function tampil() {
    const topik = topikI.value.trim();
    if (topik.length < 3) {
      statusBox.innerHTML = '<span class="err">Tulis topik videonya dulu, minimal 3 huruf.</span>';
      topikI.focus();
      return;
    }
    statusBox.textContent = '';
    lastHasil = buatSkrip({ topik, durasi: durasiSel.value, gaya: gayaSel.value });
    const s = lastHasil;
    let html = '<div style="font-size:12.5px;color:var(--faint);margin-bottom:10px">Perkiraan ' + s.kata + ' kata, target sekitar ' + s.targetKata + ' kata untuk ' + s.durasi + ' detik.</div>';
    const bagian = [
      ['Hook (' + s.bagi[0].detik + ' detik)', s.hook],
      ['Isi (' + s.bagi[1].detik + ' detik)', s.isi.join(' ')],
      ['Penutup (' + s.bagi[2].detik + ' detik)', s.penutup],
    ];
    bagian.forEach(([judul, teks]) => {
      html += '<div style="border:1px solid var(--line);border-radius:12px;padding:12px;margin-bottom:10px">' +
        '<div style="font-size:12px;color:var(--acc);font-weight:700;margin-bottom:4px">' + T.esc(judul) + '</div>' +
        '<div style="font-size:14px;line-height:1.7">' + T.esc(teks) + '</div></div>';
    });
    html += '<div style="font-size:13px;color:var(--mut);line-height:1.6">Teks di layar yang disarankan: ' + s.teksLayar.map((t) => '"' + T.esc(t) + '"').join(', ') + '.</div>';
    T.show(out, html);
    const row = T.el('<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px"></div>');
    row.appendChild(T.copyBtn(() => 'HOOK (' + s.bagi[0].detik + ' detik)\n' + s.hook + '\n\nISI (' + s.bagi[1].detik + ' detik)\n' + s.isi.join(' ') + '\n\nPENUTUP (' + s.bagi[2].detik + ' detik)\n' + s.penutup + '\n\nTeks di layar: ' + s.teksLayar.join(' | '), 'Salin skrip'));
    row.appendChild(T.btn('Buat lagi', tampil));
    out.appendChild(row);
  }

  root.appendChild(T.el('<div style="height:8px"></div>'));
  root.appendChild(T.row(T.btn('Buat Skrip', tampil, true)));
  root.appendChild(statusBox);
  root.appendChild(out);
  T.show(out, '<div class="dim center" style="padding:14px 0">Skripmu akan tampil di sini.</div>');
}
