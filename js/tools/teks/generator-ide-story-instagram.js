import { h as T, errBox } from '../../core.js';

export const meta = {"id": "generator-ide-story-instagram", "name": "Generator Ide Story Instagram", "cat": "teks", "icon": "📸", "desc": "Dapat ide story Instagram dari niche dan audiensmu.", "keywords": "ide story,instagram,story ig,konten sosmed,niche", "since": "6.19.0"};

// Pola ide story per format. {n} diganti niche, {a} diganti audiens.
export const POLA_STORY = {
  polling: [
    'Polling: mana yang lebih kamu suka soal {n}, A atau B?',
    'Polling cepat: audiens {a} lebih sering pakai yang mana?',
    'Vote: topik {n} apa yang mau dibahas besok?',
    'Polling: setuju atau tidak, {n} itu butuh waktu lama?',
  ],
  tanya: [
    'Buka kotak tanya: apa yang paling bikin penasaran soal {n}?',
    'Tanya audiens {a}: kesulitan terbesar mereka di {n} apa?',
    'Q&A: jawab tiga pertanyaan soal {n} yang paling sering masuk',
    'Minta audiens {a} cerita pengalaman pertama mereka soal {n}',
  ],
  baliklayar: [
    'Di balik layar: seperti apa proses {n} yang biasa tidak terlihat',
    'Tunjukkan meja kerja atau alat yang dipakai buat {n} hari ini',
    'Sehari bersama {n}: dari pagi sampai selesai',
    'Yang gagal hari ini soal {n}, dan apa yang dipelajari',
  ],
  sebelum: [
    'Sebelum dan sesudah: hasil {n} dari awal sampai sekarang',
    'Bandingkan {n} versi dulu dengan versi sekarang',
    'Perubahan kecil di {n} yang hasilnya terasa besar',
  ],
  kuis: [
    'Kuis: tebak fakta soal {n} ini benar atau salah',
    'Kuis singkat buat audiens {a}: seberapa paham mereka soal {n}',
    'Tebak-tebakan: benda atau istilah {n} dari petunjuk ini',
  ],
  tips: [
    'Satu tips {n} yang bisa dicoba audiens {a} hari ini',
    'Tips singkat {n} dalam 15 detik',
    'Hal kecil soal {n} yang sering diabaikan audiens {a}',
    'Tiga kesalahan {n} yang gampang diperbaiki',
  ],
  hitung: [
    'Hitung mundur: sesuatu soal {n} yang akan diumumkan',
    'Hitung mundur ke acara atau peluncuran {n} berikutnya',
    'Sisa berapa hari lagi sampai momen {n} yang ditunggu',
  ],
};

export const FORMAT_STORY = [
  ['campur', 'Campur semua format'],
  ['polling', 'Polling dan voting'],
  ['tanya', 'Tanya jawab'],
  ['baliklayar', 'Di balik layar'],
  ['sebelum', 'Sebelum dan sesudah'],
  ['kuis', 'Kuis dan tebakan'],
  ['tips', 'Tips singkat'],
  ['hitung', 'Hitung mundur'],
];

export function buatIdeStory(niche, audiens, jumlah, format, acak) {
  const n = String(niche || '').trim();
  if (!n) return [];
  const a = String(audiens || '').trim() || 'pengikutmu';
  const rnd = typeof acak === 'function' ? acak : Math.random;
  let pola = [];
  if (format && format !== 'campur' && POLA_STORY[format]) pola = POLA_STORY[format].slice();
  else Object.keys(POLA_STORY).forEach((k) => { pola = pola.concat(POLA_STORY[k]); });
  const isi = pola.map((p) => p.split('{n}').join(n).split('{a}').join(a));
  for (let i = isi.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    const t = isi[i]; isi[i] = isi[j]; isi[j] = t;
  }
  const target = Math.max(1, Math.min(30, Math.floor(jumlah) || 10));
  return isi.slice(0, Math.min(target, isi.length));
}

export function render(root) {
  const nicheIn = T.input('text', 'cth: kopi rumahan', '');
  const audiensIn = T.input('text', 'cth: pemula yang baru belajar', '');
  const formatSel = T.select(FORMAT_STORY, 'campur');
  const jumlahSel = T.select([['10', '10 ide'], ['20', '20 ide'], ['30', '30 ide']], '10');
  const box = T.out();
  let hasil = [];

  const proses = () => {
    const niche = nicheIn.value.trim();
    if (!niche) { T.show(box, errBox('Isi dulu niche atau topik kontenmu.')); return; }
    hasil = buatIdeStory(niche, audiensIn.value, Number(jumlahSel.value), formatSel.value);
    if (!hasil.length) { T.show(box, errBox('Tidak ada ide yang bisa dibuat dari topik itu.')); return; }
    const daftar = hasil.map((ide, i) =>
      '<div style="display:flex;gap:8px;align-items:flex-start;padding:10px 0;border-bottom:1px solid #27272a">' +
      '<span class="dim" style="min-width:24px">' + (i + 1) + '.</span>' +
      '<span style="flex:1;line-height:1.5">' + T.esc(ide) + '</span>' +
      '<button type="button" class="btn" data-salin="' + i + '" style="flex:none">Salin</button></div>').join('');
    T.show(box, '<p class="dim" style="font-size:13px;margin:0 0 4px">Sesuaikan dengan gaya akunmu sebelum diposting.</p>' + daftar);
    box.querySelectorAll('button[data-salin]').forEach((b) => {
      b.addEventListener('click', () => T.copy(hasil[Number(b.dataset.salin)] || ''));
    });
    box.appendChild(T.row(
      T.copyBtn(() => hasil.join('\n'), 'Salin semua'),
      T.dlBtn('ide-story.txt', () => hasil.join('\n'), 'text/plain;charset=utf-8', 'Unduh .txt'),
    ));
  };

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Isi niche dan audiensmu, lalu dapat daftar ide story per format. Ide disusun dari pola story yang umum dipakai kreator, bukan dari data tren.</p>'));
  root.appendChild(T.field('Niche atau topik kontenmu', nicheIn));
  root.appendChild(T.field('Audiensmu (boleh dikosongkan)', audiensIn, 'Kalau kosong, ide memakai kata "pengikutmu".'));
  root.appendChild(T.grid2(T.field('Format story', formatSel), T.field('Jumlah ide', jumlahSel)));
  root.appendChild(T.row(T.btn('Buat ide', proses, true)));
  root.appendChild(box);
}
