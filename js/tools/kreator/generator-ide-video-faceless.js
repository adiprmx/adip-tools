import { h as T } from '../../core.js';

export const meta = {"id":"generator-ide-video-faceless","name":"Generator Ide Video Faceless","cat":"kreator","icon":"🎭","desc":"Ide video tanpa tampil wajah, lengkap dengan sudut dan formatnya.","keywords":"faceless,ide video,youtube,tiktok,tanpa wajah,kreator,template","since":"6.19.0"};

const NICHE = [
  ['semua', 'Semua niche'],
  ['uang', 'Uang dan bisnis'],
  ['sejarah', 'Sejarah dan fakta'],
  ['teknologi', 'Teknologi'],
  ['relaksasi', 'Relaksasi dan suara'],
  ['masak', 'Masak'],
  ['cerita', 'Cerita dan misteri'],
];
const FORMAT = [
  ['semua', 'Semua format'],
  ['tutorial', 'Tutorial'],
  ['daftar', 'Daftar'],
  ['cerita', 'Cerita'],
  ['ulasan', 'Ulasan'],
];

// Bank ide: judul, sudut, apa yang tampil di layar, format, perkiraan durasi.
const IDE = {
  uang: [
    ['5 Cara Anak Kos Nabung 500 Ribu Sebulan', 'Angka konkret yang bisa langsung ditiru penonton.', 'Tangan menulis di buku catatan + teks angka di layar.', 'daftar', '45 detik'],
    ['Kenapa Gaji Pertama Selalu Habis?', 'Jawab pertanyaan yang hampir semua orang rasakan.', 'Animasi dompet kosong + grafik batang sederhana.', 'cerita', '60 detik'],
    ['Cara Bikin Anggaran Bulanan dalam 10 Menit', 'Langkah praktis, penonton pulang dengan hasil.', 'Layar HP membuka aplikasi catatan, tangan mengetik.', 'tutorial', '60 detik'],
    ['3 Kesalahan Kecil yang Bikin Boros', 'Kesalahan sehari-hari yang penonton tidak sadari.', 'Rekaman tangan memegang struk belanja + teks.', 'daftar', '40 detik'],
    ['Jualan Online dari Nol, Modal HP Saja', 'Cerita mulai dari nol tanpa modal besar.', 'Tangan memotret produk + layar toko online.', 'cerita', '60 detik'],
    ['Bedanya Nabung dan Investasi, Dijelaskan 1 Menit', 'Konsep yang sering tertukar, dijelaskan sederhana.', 'Dua kolom perbandingan dengan ikon dan teks.', 'tutorial', '60 detik'],
  ],
  sejarah: [
    ['Kota yang Hilang dari Peta Selama 100 Tahun', 'Misteri nyata yang bikin penasaran sampai akhir.', 'Peta lama + foto arsip + teks tahun.', 'cerita', '60 detik'],
    ['5 Fakta Aneh tentang Romawi Kuno', 'Fakta yang terdengar bohong tapi benar.', 'Ilustrasi dan foto patung + teks fakta.', 'daftar', '50 detik'],
    ['Bagaimana Orang Dulu Mengirim Surat Sejauh 1000 KM?', 'Pertanyaan sederhana dengan jawaban yang tidak diduga.', 'Gambar kuda pos dan rute di peta.', 'cerita', '55 detik'],
    ['Benda Sehari-hari yang Dulu Hanya untuk Raja', 'Sudut pandang yang membalik kebiasaan.', 'Foto benda modern disandingkan gambar lama.', 'daftar', '45 detik'],
    ['Perang yang Dimenangkan Gara-gara Cuaca', 'Sejarah yang berubah karena satu kejadian kecil.', 'Peta pergerakan pasukan + efek hujan di layar.', 'cerita', '60 detik'],
  ],
  teknologi: [
    ['5 Fitur HP yang Jarang Dipakai tapi Berguna', 'Penonton langsung cek HP-nya sendiri.', 'Rekaman layar HP dengan panah penunjuk.', 'daftar', '50 detik'],
    ['Cara Bikin Foto Malam Lebih Terang tanpa Aplikasi', 'Hasilnya kelihatan langsung di video.', 'Perbandingan foto sebelum dan sesudah.', 'tutorial', '45 detik'],
    ['Apa yang Terjadi Kalau HP Dicas Semalaman?', 'Mitos yang masih diperdebatkan.', 'Animasi baterai + teks penjelasan singkat.', 'cerita', '55 detik'],
    ['Aplikasi Gratis yang Menggantikan 5 Aplikasi Berbayar', 'Nilai langsung: penonton hemat uang.', 'Rekaman layar membuka tiap aplikasi.', 'daftar', '60 detik'],
    ['Kenapa Internet Lambat Padahal Sinyal Penuh?', 'Keluhan umum dengan penjelasan sederhana.', 'Animasi sinyal dan server + teks.', 'cerita', '50 detik'],
  ],
  relaksasi: [
    ['Suara Hujan 1 Jam untuk Tidur Nyenyak', 'Konten yang diputar berulang, penonton kembali.', 'Video hujan di jendela, tanpa narasi.', 'cerita', '60 menit'],
    ['Suara Api Unggun dan Hujan Rintik', 'Kombinasi dua suara yang menenangkan.', 'Video api unggun diam, suara asli.', 'cerita', '60 menit'],
    ['Musik Piano Pelan untuk Fokus Kerja', 'Dipakai sambil kerja, durasi panjang.', 'Layar gelap dengan visual gelombang pelan.', 'cerita', '60 menit'],
    ['Suara Kafe Pagi: Cangkir, Obrolan, Hujan', 'Suasana yang dirindukan penonton.', 'Video kafe diam + suara ambience.', 'cerita', '60 menit'],
  ],
  masak: [
    ['Masak 3 Menu Anak Kos Modal 20 Ribu', 'Angka kecil yang bikin penonton penasaran.', 'Tangan memasak, kamera dari atas.', 'daftar', '60 detik'],
    ['Cara Bikin Telur Dadar Tebal seperti di Resto', 'Satu trik kecil dengan hasil besar.', 'Close-up wajan dan tangan mengaduk.', 'tutorial', '45 detik'],
    ['Kesalahan yang Bikin Nasi Goreng Lembek', 'Kesalahan umum yang mudah diperbaiki.', 'Perbandingan dua wajan berdampingan.', 'tutorial', '50 detik'],
    ['Resep Kopi Susu Gula Aren ala Kafe', 'Minuman favorit yang bisa dibuat di rumah.', 'Tangan menuang, gelas bening, teks takaran.', 'tutorial', '40 detik'],
    ['Bekal Seminggu dalam 1 Jam Masak', 'Janji hemat waktu yang konkret.', 'Meja penuh wadah bekal + teks hari.', 'daftar', '60 detik'],
  ],
  cerita: [
    ['Pesan Terakhir dari Kapal yang Hilang', 'Pembuka misterius yang menahan penonton.', 'Foto laut gelap + teks pesan.', 'cerita', '60 detik'],
    ['Rumah Ini Kosong 30 Tahun, Isinya Masih Utuh', 'Rasa penasaran soal tempat terbengkalai.', 'Foto interior berdebu + narasi pelan.', 'cerita', '60 detik'],
    ['Surat yang Baru Sampai 50 Tahun Kemudian', 'Kisah nyata yang terdengar seperti fiksi.', 'Amplop tua + teks isi surat.', 'cerita', '55 detik'],
    ['5 Tempat di Bumi yang Dilarang Dikunjungi', 'Daftar tempat yang memicu rasa ingin tahu.', 'Foto tiap tempat + teks alasan larangan.', 'daftar', '60 detik'],
    ['Seseorang Mengirim Paket Misterius Setiap Tahun', 'Misteri berulang yang belum terpecahkan.', 'Kotak paket + teks tanggal tiap tahun.', 'cerita', '60 detik'],
  ],
};

export function ambilIde(niche, format, jumlah, rnd) {
  const r = typeof rnd === 'function' ? rnd : Math.random;
  const niches = (niche && niche !== 'semua' && IDE[niche]) ? [niche] : Object.keys(IDE);
  let pool = [];
  niches.forEach((n) => {
    IDE[n].forEach((ide) => {
      if (!format || format === 'semua' || ide[3] === format) pool.push({ niche: n, judul: ide[0], sudut: ide[1], layar: ide[2], format: ide[3], durasi: ide[4] });
    });
  });
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    const t = pool[i]; pool[i] = pool[j]; pool[j] = t;
  }
  const n = Math.min(8, Math.max(1, parseInt(jumlah, 10) || 3));
  return pool.slice(0, n);
}

const LABEL_NICHE = { uang: 'Uang dan bisnis', sejarah: 'Sejarah dan fakta', teknologi: 'Teknologi', relaksasi: 'Relaksasi dan suara', masak: 'Masak', cerita: 'Cerita dan misteri' };
const LABEL_FORMAT = { tutorial: 'Tutorial', daftar: 'Daftar', cerita: 'Cerita', ulasan: 'Ulasan' };

export function render(root) {
  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Ide disusun dari bank ide dan template, bukan AI. Pilih niche dan formatnya, lalu ambil ide yang paling cocok dengan gayamu. Setiap ide sudah berisi sudut dan gambaran tampilan layarnya.</p>'));

  const nicheSel = T.select(NICHE, 'semua');
  const formatSel = T.select(FORMAT, 'semua');
  root.appendChild(T.grid2(T.field('Niche', nicheSel), T.field('Format', formatSel)));
  const jumlahSel = T.select([['3', '3 ide'], ['5', '5 ide']], '3');
  root.appendChild(T.field('Jumlah', jumlahSel));

  const out = T.out();
  let lastHasil = [];

  function tampil() {
    lastHasil = ambilIde(nicheSel.value, formatSel.value, jumlahSel.value);
    if (!lastHasil.length) {
      T.show(out, '<div class="dim center" style="padding:14px 0">Belum ada ide untuk kombinasi itu. Coba format atau niche lain.</div>');
      return;
    }
    let html = '';
    lastHasil.forEach((ide, i) => {
      html += '<div style="border:1px solid var(--line);border-radius:12px;padding:12px;margin-bottom:10px">' +
        '<div style="font-size:12px;color:var(--faint);margin-bottom:4px">' + T.esc(LABEL_NICHE[ide.niche] || ide.niche) + ' · ' + T.esc(LABEL_FORMAT[ide.format] || ide.format) + ' · ' + T.esc(ide.durasi) + '</div>' +
        '<div style="font-weight:700;font-size:15px;line-height:1.4;margin-bottom:6px">' + T.esc(ide.judul) + '</div>' +
        '<div style="font-size:13.5px;line-height:1.6;color:var(--mut)">Sudut: ' + T.esc(ide.sudut) + '</div>' +
        '<div style="font-size:13.5px;line-height:1.6;color:var(--mut)">Di layar: ' + T.esc(ide.layar) + '</div>' +
        '</div>';
    });
    T.show(out, html);
    const row = T.el('<div style="display:flex;gap:6px;flex-wrap:wrap"></div>');
    row.appendChild(T.copyBtn(() => lastHasil.map((x, i) => (i + 1) + '. ' + x.judul + ' (' + x.durasi + ')\n   Sudut: ' + x.sudut + '\n   Di layar: ' + x.layar).join('\n\n'), 'Salin semua'));
    row.appendChild(T.btn('Acak lagi', tampil));
    out.appendChild(row);
  }

  root.appendChild(T.el('<div style="height:8px"></div>'));
  root.appendChild(T.row(T.btn('Cari Ide', tampil, true)));
  root.appendChild(out);
  T.show(out, '<div class="dim center" style="padding:14px 0">Idemu akan tampil di sini.</div>');
}
