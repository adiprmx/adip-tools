import { h as T, utils } from '../../core.js';

export const meta = {"id": "benar-atau-salah", "name": "Benar atau Salah?", "cat": "fun", "icon": "✅", "desc": "Kuis 10 soal acak dari 35 pernyataan: benar atau salah? Tiap jawaban ada penjelasannya.", "keywords": "benar,salah,fakta,mitos,kuis,trivia,pengetahuan", "since": "6.12.0"};

// Semua pernyataan sudah dicek kebenarannya. f = fakta/penjelasan yang tampil setelah jawab.
const SOAL = [
  { s: 'Air mendidih pada suhu 100°C di permukaan laut.', b: true, f: 'Di tekanan udara normal (permukaan laut), air memang mendidih di 100°C.' },
  { s: 'Indonesia terdiri dari lebih dari 17.000 pulau.', b: true, f: 'BPS mencatat sekitar 17.500 pulau di Indonesia.' },
  { s: 'Bulan lebih besar daripada Bumi.', b: false, f: 'Bulan jauh lebih kecil: diameternya sekitar seperempat diameter Bumi.' },
  { s: 'Komodo hanya hidup di Indonesia.', b: true, f: 'Komodo hanya ditemukan di Kepulauan Nusa Tenggara Timur (Pulau Komodo, Rinca, Flores, dan sekitarnya).' },
  { s: 'Jakarta adalah kota terbesar di Indonesia.', b: true, f: 'Jakarta adalah kota dengan penduduk terbanyak di Indonesia.' },
  { s: 'Sungai Kapuas adalah sungai terpanjang di Indonesia.', b: true, f: 'Sungai Kapuas di Kalimantan Barat panjangnya sekitar 1.143 km.' },
  { s: 'Matahari terbit dari barat.', b: false, f: 'Matahari terbit dari timur dan tenggelam di barat.' },
  { s: 'Candi Borobudur adalah candi Buddha terbesar di dunia.', b: true, f: 'Borobudur di Magelang diakui sebagai candi Buddha terbesar di dunia.' },
  { s: 'Ikan paus adalah ikan.', b: false, f: 'Paus adalah mamalia: ia menyusui anaknya dan bernapas dengan paru-paru.' },
  { s: 'Jantung manusia berdetak sekitar 100.000 kali sehari.', b: true, f: 'Rata-rata jantung orang dewasa berdetak sekitar 100.000 kali dalam sehari.' },
  { s: 'Emas adalah logam yang tidak berkarat.', b: true, f: 'Emas tidak bereaksi dengan udara dan air, jadi tidak berkarat seperti besi.' },
  { s: 'Planet Mars berwarna merah karena karat besi.', b: true, f: 'Debu Mars mengandung besi oksida (karat) yang memberi warna merah.' },
  { s: 'Tahun kabisat terjadi setiap 4 tahun.', b: true, f: 'Februari punya 29 hari setiap 4 tahun sekali, dengan sedikit pengecualian tiap abad.' },
  { s: 'Kelelawar adalah burung.', b: false, f: 'Kelelawar adalah mamalia — satu-satunya mamalia yang bisa terbang sungguhan.' },
  { s: 'Indonesia pernah menjadi tuan rumah Asian Games dua kali.', b: true, f: 'Indonesia menjadi tuan rumah Asian Games pada 1962 dan 2018.' },
  { s: 'Bahasa resmi Brasil adalah Spanyol.', b: false, f: 'Bahasa resmi Brasil adalah Portugis — warisan penjajahan Portugis.' },
  { s: 'Gunung Everest adalah gunung tertinggi di dunia.', b: true, f: 'Everest setinggi sekitar 8.849 meter di atas permukaan laut.' },
  { s: 'Lebah bisa mengenali wajah manusia.', b: true, f: 'Penelitian menunjukkan lebah madu bisa belajar membedakan wajah manusia lewat pola visual.' },
  { s: 'Cumi-cumi punya tiga jantung.', b: true, f: 'Cumi-cumi punya tiga jantung: dua memompa darah ke insang, satu ke seluruh tubuh.' },
  { s: 'Semua penguin hidup di Kutub Selatan.', b: false, f: 'Penguin Galápagos hidup di dekat khatulistiwa, dan ada penguin di Afrika Selatan, Australia, hingga Selandia Baru.' },
  { s: 'Bambu adalah jenis rumput.', b: true, f: 'Bambu termasuk keluarga rumput-rumputan (Poaceae).' },
  { s: 'Kopi berasal dari Ethiopia.', b: true, f: 'Tanaman kopi pertama kali ditemukan di Ethiopia, Afrika.' },
  { s: 'Satu hari di Venus lebih lama dari satu tahun di Venus.', b: true, f: 'Venus berputar sekali dalam 243 hari Bumi, tapi mengorbit Matahari hanya dalam 225 hari Bumi.' },
  { s: 'Hiu sudah ada sebelum pohon.', b: true, f: 'Hiu sudah ada sekitar 450 juta tahun lalu, sedangkan pohon baru muncul sekitar 350 juta tahun lalu.' },
  { s: 'Pisang adalah buah beri.', b: true, f: 'Secara botani, pisang termasuk buah beri — sedangkan stroberi bukan!' },
  { s: 'Stroberi adalah buah beri.', b: false, f: 'Secara botani stroberi bukan beri, melainkan buah agregat (kumpulan buah kecil).' },
  { s: 'Air laut menutupi sekitar 70% permukaan Bumi.', b: true, f: 'Sekitar 71% permukaan Bumi tertutup air, sebagian besar laut.' },
  { s: 'Otak manusia memakai sekitar 20% energi tubuh.', b: true, f: 'Otak hanya sekitar 2% berat badan, tapi memakai sekitar 20% energi tubuh.' },
  { s: 'Kucing punya 9 nyawa.', b: false, f: 'Itu cuma mitos — kucing punya 1 nyawa seperti hewan lainnya.' },
  { s: 'Cahaya matahari butuh sekitar 8 menit sampai ke Bumi.', b: true, f: 'Jarak Matahari–Bumi sekitar 150 juta km; cahayanya sampai dalam 8 menit 20 detik.' },
  { s: 'Indonesia adalah negara kepulauan terbesar di dunia.', b: true, f: 'Indonesia adalah negara kepulauan terbesar di dunia berdasarkan luas wilayah dan jumlah pulau.' },
  { s: 'Semut tidak punya paru-paru.', b: true, f: 'Semut bernapas lewat lubang-lubang kecil di tubuhnya (spirakel), bukan paru-paru.' },
  { s: 'Gajah adalah satu-satunya hewan yang tidak bisa melompat.', b: false, f: 'Selain gajah, badak, kuda nil, dan kukang juga tidak bisa melompat.' },
  { s: 'Madu tidak pernah basi.', b: true, f: 'Arkeolog menemukan madu berumur 3.000 tahun di makam Mesir yang masih bisa dimakan.' },
  { s: 'Bulan menjauh dari Bumi setiap tahun.', b: true, f: 'Bulan menjauh sekitar 3,8 cm per tahun dari Bumi.' },
];
const TOTAL_SOAL = 10;
const LS_KEY = 'benar-atau-salah-best';

const shuffle = (a) => {
  const x = a.slice();
  for (let i = x.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [x[i], x[j]] = [x[j], x[i]];
  }
  return x;
};
function loadBest() {
  try { const v = parseInt(localStorage.getItem(LS_KEY), 10); return isNaN(v) ? 0 : v; }
  catch (e) { return 0; }
}
function saveBest(v) { try { localStorage.setItem(LS_KEY, String(v)); } catch (e) { /* abaikan */ } }

export function render(root) {
  const box = T.out();
  const bestBox = T.el('<p class="hint center">Skor terbaikmu: <b>' + loadBest() + '</b>/' + TOTAL_SOAL + '</p>');
  const quiz = { list: [], idx: 0, score: 0, answered: false };
  let best = loadBest();

  const showQ = () => {
    const q = quiz.list[quiz.idx];
    quiz.answered = false;
    T.show(box,
      '<p class="hint">Soal ' + (quiz.idx + 1) + ' dari ' + TOTAL_SOAL + ' &bull; Skor: ' + quiz.score + '</p>' +
      '<p style="font-size:17px;line-height:1.65;text-align:center;margin:14px 0">&ldquo;' + T.esc(q.s) + '&rdquo;</p>' +
      '<div class="row" style="justify-content:center;gap:10px">' +
      '<button type="button" class="btn primary" id="btn-benar" style="font-size:16px;padding:14px 30px">✅ Benar</button>' +
      '<button type="button" class="btn" id="btn-salah" style="font-size:16px;padding:14px 30px">❌ Salah</button>' +
      '</div>'
    );
    box.querySelector('#btn-benar').addEventListener('click', () => jawab(true));
    box.querySelector('#btn-salah').addEventListener('click', () => jawab(false));
  };

  const jawab = (pilih) => {
    if (quiz.answered) return;
    quiz.answered = true;
    const q = quiz.list[quiz.idx];
    const ok = pilih === q.b;
    if (ok) { quiz.score++; T.beep(660, 0.1); } else { T.beep(180, 0.15, 'sawtooth'); }
    // status diperbarui langsung biar skor tidak tampak reset
    const hint = box.querySelector('.hint');
    if (hint) hint.innerHTML = 'Soal ' + (quiz.idx + 1) + ' dari ' + TOTAL_SOAL + ' &bull; Skor: ' + quiz.score;
    box.querySelector('#btn-benar').disabled = true;
    box.querySelector('#btn-salah').disabled = true;
    const fb = T.el('<div style="margin-top:14px;border-radius:10px;padding:12px;font-size:13px;line-height:1.7;border:1px solid ' +
      (ok ? '#22c55e' : '#ef4444') + ';background:' + (ok ? 'rgba(34,197,94,.08)' : 'rgba(239,68,68,.08)') + '">' +
      (ok ? '✅ <b>Benar!</b>' : '❌ <b>Kurang tepat.</b> Pernyataan ini <b>' + (q.b ? 'benar' : 'salah') + '</b>.') +
      '<br><span class="dim">💡 ' + T.esc(q.f) + '</span></div>');
    box.appendChild(fb);
    const last = quiz.idx >= TOTAL_SOAL - 1;
    const next = T.btn(last ? 'Lihat hasil 🏁' : 'Soal berikutnya ➡️', () => {
      quiz.idx++;
      if (quiz.idx >= TOTAL_SOAL) finish(); else showQ();
    }, true);
    next.style.marginTop = '12px';
    box.appendChild(next);
  };

  const finish = () => {
    const s = quiz.score;
    let baru = '';
    if (s > best) { best = s; saveBest(best); baru = ' <b style="color:var(--acc)">Rekor baru!</b>'; }
    bestBox.innerHTML = 'Skor terbaikmu: <b>' + best + '</b>/' + TOTAL_SOAL;
    const msg = s === 10 ? 'Sempurna! Tidak ada mitos yang bisa menipumu. ✅✨'
      : s >= 8 ? 'Keren! Kamu tahu banyak fakta yang orang lain tidak tahu.'
      : s >= 6 ? 'Lumayan! Beberapa fakta memang di luar dugaan.'
      : s >= 4 ? 'Masih bisa diasah. Baca penjelasannya, banyak yang mengejutkan!'
      : 'Yah… ternyata banyak mitos yang masih dipercaya. Coba lagi! 😅';
    const teks = '✅ Benar atau Salah?: aku dapat ' + s + '/10! Coba kalahin aku di Adip Tools.';
    const wrap = T.el('<div class="row center" style="margin-top:12px"></div>');
    wrap.appendChild(T.btn('Main lagi 🔄', start, true));
    wrap.appendChild(T.copyBtn(() => teks, '📋 Salin hasil'));
    if (typeof navigator !== 'undefined' && navigator.share) {
      wrap.appendChild(T.btn('📤 Bagikan', () => { navigator.share({ text: teks }).catch(() => {}); }));
    }
    T.show(box,
      '<div class="big center">' + s + '<span class="mut" style="font-size:15px">/' + TOTAL_SOAL + '</span></div>' +
      '<p class="center">' + msg + baru + '</p>'
    );
    box.appendChild(wrap);
  };

  const start = () => {
    quiz.list = shuffle(SOAL).slice(0, TOTAL_SOAL);
    quiz.idx = 0;
    quiz.score = 0;
    showQ();
  };

  root.appendChild(T.el('<p class="hint">10 pernyataan acak dari ' + SOAL.length + ' fakta & mitos. Tebak benar atau salah — tiap jawaban ada penjelasannya.</p>'));
  root.appendChild(box);
  root.appendChild(bestBox);
  start();
}
