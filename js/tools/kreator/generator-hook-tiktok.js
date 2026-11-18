import { h as T } from '../../core.js';

// 30 pola hook dari pola pembuka video yang umum dipakai kreator —
// pertanyaan, angka, cerita, dan rasa penasaran. Bukan AI: alat ini hanya
// mengisi topikmu ke dalam pola yang sudah ada.
const POLA = [
  '{angka} kesalahan {topik} yang masih banyak orang lakukan',
  'Kenapa {topik} kamu tidak pernah berhasil? Ini alasannya',
  'Rahasia {topik} yang tidak diajarkan di sekolah',
  'Aku coba {topik} selama 30 hari, ini hasilnya',
  'Jangan {topik} sebelum nonton video ini',
  'Cara {topik} buat pemula, tanpa modal besar',
  '{angka} hal tentang {topik} yang wajib kamu tahu',
  'Stop {topik} dengan cara ini, coba yang ini',
  'Kalau kamu kesulitan {topik}, video ini buat kamu',
  'Ini alasan {topik} gagal, dan cara memperbaikinya',
  'Dulu aku juga kesulitan {topik}, sampai aku coba ini',
  '{topik} dalam 60 detik, simak sampai habis',
  'Kamu pasti belum tahu trik {topik} ini',
  'Bukti nyata {topik} bisa dilakukan siapa saja',
  'Mitos {topik} yang masih dipercaya banyak orang',
  'Cara paling cepat {hasil} dengan {topik}',
  'Apa yang terjadi kalau kamu {topik} setiap hari?',
  '{topik} vs cara lama: mana yang lebih bagus?',
  'Satu kesalahan kecil di {topik} yang merusak semuanya',
  'Begini cara orang sukses melakukan {topik}',
  'Nonton sampai habis, ada kejutan di akhir soal {topik}',
  'Kamu tidak akan percaya apa yang terjadi setelah {topik}',
  '{angka} menit saja buat menguasai dasar {topik}',
  'Kalau {topik} terasa sulit, kamu tidak sendiri',
  'Ini yang tidak pernah dibilang orang soal {topik}',
  'Mulai {topik} dari nol? Ikuti langkah ini',
  'Kenapa semua orang tiba-tiba bicara soal {topik}?',
  'Sudah coba semua cara {topik}? Coba yang ini',
  'Rumus sederhana {topik} yang langsung bisa dipakai',
  'Jangan lewatkan {topik} ini kalau mau {hasil}',
];

export const meta = {"id": "generator-hook-tiktok", "name": "Generator Hook TikTok", "cat": "kreator", "icon": "🎬", "desc": "Dapat 30 ide kalimat pembuka video dari topikmu. Tinggal isi, salin, pakai.", "keywords": "hook,tiktok,video,kreator,konten,pembuka,viral,ide", "since": "6.16.0"};
export function render(root) {
  const topikI = T.input('text', 'cth: masak nasi goreng', '');
  const hasilI = T.input('text', 'cth: masakan lebih enak (opsional)', '');
  const angkaI = T.select([['3', '3'], ['5', '5'], ['7', '7'], ['10', '10']], '3');
  const box = T.out();

  const isi = (pola) => pola
    .replaceAll('{topik}', topikI.value.trim() || 'topikmu')
    .replaceAll('{hasil}', hasilI.value.trim() || 'hasil yang bagus')
    .replaceAll('{angka}', angkaI.value);

  const buat = () => {
    if (!topikI.value.trim()) { T.toast('Isi dulu topik videomu'); topikI.focus(); return; }
    const daftar = POLA.map(isi);
    T.show(box, '<p class="mut">' + daftar.length + ' ide hook dari topik "<b>' + T.esc(topikI.value.trim()) + '</b>". Ketuk tombol salin di samping yang kamu suka.</p>');
    daftar.forEach((teks, i) => {
      const baris = T.el('<div style="display:flex;gap:8px;align-items:flex-start;margin:10px 0;padding:10px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:10px"></div>');
      const no = T.el('<span class="mut" style="min-width:22px">' + (i + 1) + '.</span>');
      const t = T.el('<span style="flex:1;line-height:1.5">' + T.esc(teks) + '</span>');
      const salin = T.copyBtn(() => teks, 'Salin');
      baris.appendChild(no); baris.appendChild(t); baris.appendChild(salin);
      box.appendChild(baris);
    });
    box.appendChild(T.el('<p class="hint">Bukan AI — alat ini mengisi topikmu ke dalam ' + POLA.length + ' pola pembuka video yang umum dipakai kreator. Sesuaikan bahasanya dengan gayamu sebelum dipakai.</p>'));
  };

  root.appendChild(T.el('<p class="note">Hook adalah kalimat pertama videomu — yang menentukan orang lanjut nonton atau geser. Isi topik videomu, dan alat ini memberi ' + POLA.length + ' ide pembuka.</p>'));
  root.appendChild(T.field('Topik videomu', topikI));
  root.appendChild(T.grid2(
    T.field('Hasil yang dijanjikan (opsional)', hasilI),
    T.field('Angka untuk pola bernomor', angkaI)
  ));
  const btn = T.btn('Buat 30 ide hook', buat);
  root.appendChild(T.el('<div style="margin:4px 0 12px"></div>'));
  root.lastChild.appendChild(btn);
  root.appendChild(box);
}
