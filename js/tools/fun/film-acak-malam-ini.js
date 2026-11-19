import { h as T, utils } from '../../core.js';

export const meta = {"id": "film-acak-malam-ini", "name": "Film Acak Malam Ini", "cat": "fun", "icon": "🎬", "desc": "Bingung mau nonton apa? Acak satu film dari daftar kurasi 60 film, lengkap dengan genre dan alasannya.", "keywords": "film,acak,nonton,malam ini,rekomendasi,genre,sinema", "since": "6.19.0"};

/* Bank kurasi 60 film (judul, tahun, genre, durasi menit, alasan singkat).
   Tahun dan durasi dicek dari data umum film tersebut. */
export const BANK_FILM = [
  // --- Aksi (8) ---
  { j: 'The Dark Knight', t: 2008, g: 'Aksi', d: 152, a: 'Batman lawan Joker. Aksi kota yang tegang dari awal sampai akhir.' },
  { j: 'Mad Max: Fury Road', t: 2015, g: 'Aksi', d: 120, a: 'Kejar-kejaran gurun tanpa henti. Visualnya masih juara sampai sekarang.' },
  { j: 'John Wick', t: 2014, g: 'Aksi', d: 101, a: 'Pembunuh bayaran pensiun yang dipaksa kembali. Koreografi tembak-tembakannya rapi.' },
  { j: 'The Raid', t: 2011, g: 'Aksi', d: 101, a: 'Satu gedung, satu tim polisi, belasan lantai musuh. Silat Indonesia kelas dunia.' },
  { j: 'Mission: Impossible - Fallout', t: 2018, g: 'Aksi', d: 147, a: 'Tom Cruise lompat dari pesawat beneran. Adegan helikopter di ujung film gila.' },
  { j: 'Top Gun: Maverick', t: 2022, g: 'Aksi', d: 130, a: 'Jet tempur difilmkan dari kokpit asli. Nontonnya ikut tegang.' },
  { j: 'Die Hard', t: 1988, g: 'Aksi', d: 132, a: 'Satu orang lawan teroris di gedung. Film aksi Natal paling ikonik.' },
  { j: 'The Bourne Identity', t: 2002, g: 'Aksi', d: 119, a: 'Pria tanpa ingatan, dikejar agen rahasia. Aksi dan misteri seimbang.' },
  // --- Komedi (8) ---
  { j: 'The Grand Budapest Hotel', t: 2014, g: 'Komedi', d: 99, a: 'Hotel warna-warni, humor kering, dan gambar yang simetrisnya memuaskan.' },
  { j: 'Superbad', t: 2007, g: 'Komedi', d: 113, a: 'Dua sahabat SMA mengejar satu pesta terakhir. Kocak dan agak nyebelin.' },
  { j: 'The Hangover', t: 2009, g: 'Komedi', d: 100, a: 'Bangun di Las Vegas tanpa ingat semalam. Misteri konyol yang bikin ketawa.' },
  { j: 'Warkop DKI Reborn: Jangkrik Boss! Part 1', t: 2016, g: 'Komedi', d: 110, a: 'Dono, Kasino, Indro versi baru. Slapstick khas Warkop yang ringan.' },
  { j: 'Cek Toko Sebelah', t: 2016, g: 'Komedi', d: 105, a: 'Drama keluarga toko kelontong yang lucunya dari percakapan sehari-hari.' },
  { j: 'Home Alone', t: 1990, g: 'Komedi', d: 103, a: 'Anak kecil lawan dua maling dengan jebakan rumah. Klasik yang tidak bosan ditonton ulang.' },
  { j: '21 Jump Street', t: 2012, g: 'Komedi', d: 109, a: 'Dua polisi nyamar jadi anak SMA. Chemistry dua pemeran utamanya kuat.' },
  { j: 'Agak Laen', t: 2024, g: 'Komedi', d: 119, a: 'Empat sekawan buka rumah hantu yang malah jadi beneran seram. Komedi Indonesia terlaris.' },
  // --- Drama (8) ---
  { j: 'The Shawshank Redemption', t: 1994, g: 'Drama', d: 142, a: 'Harapan di penjara selama puluhan tahun. Akhirnya bikin lega.' },
  { j: 'Forrest Gump', t: 1994, g: 'Drama', d: 142, a: 'Satu orang polos melewati puluhan tahun sejarah Amerika.' },
  { j: 'Parasite', t: 2019, g: 'Drama', d: 132, a: 'Keluarga miskin menyusup ke rumah kaya. Belokannya tidak ketebak.' },
  { j: 'Laskar Pelangi', t: 2008, g: 'Drama', d: 124, a: 'Sepuluh anak Belitung dan sekolah kayunya. Hangat dan bikin semangat.' },
  { j: 'Ada Apa dengan Cinta?', t: 2002, g: 'Drama', d: 112, a: 'Cinta SMA Jakarta era 2000-an. Dialognya masih diingat sampai sekarang.' },
  { j: 'The Pursuit of Happyness', t: 2006, g: 'Drama', d: 117, a: 'Ayah dan anak bertahan hidup di jalanan. Sedih tapi ujungnya hangat.' },
  { j: '12 Years a Slave', t: 2013, g: 'Drama', d: 134, a: 'Kisah nyata pria merdeka yang diculik jadi budak. Berat tapi penting.' },
  { j: 'Nanti Kita Cerita tentang Hari Ini', t: 2020, g: 'Drama', d: 121, a: 'Tiga kakak beradik dan rahasia keluarga. Sinematografinya cantik.' },
  // --- Horor (6) ---
  { j: 'Pengabdi Setan', t: 2017, g: 'Horor', d: 107, a: 'Ibu bangkit setelah meninggal. Horor Indonesia yang suasananya mencekam.' },
  { j: 'Get Out', t: 2017, g: 'Horor', d: 104, a: 'Kunjungan ke rumah pacar yang makin aneh. Twist-nya diingat terus.' },
  { j: 'A Quiet Place', t: 2018, g: 'Horor', d: 90, a: 'Keluarga bertahan hidup tanpa boleh bersuara. Heningnya justru bikin tegang.' },
  { j: 'KKN di Desa Penari', t: 2022, g: 'Horor', d: 130, a: 'KKN yang berubah jadi mimpi buruk. Dari utas viral yang terkenal.' },
  { j: 'Hereditary', t: 2018, g: 'Horor', d: 127, a: 'Duka keluarga yang berubah jadi teror. Lambat tapi menghantui.' },
  { j: 'The Conjuring', t: 2013, g: 'Horor', d: 112, a: 'Rumah berhantu dan pasangan penyelidik. Jumpscare-nya rapi.' },
  // --- Animasi (8) ---
  { j: 'Spider-Man: Into the Spider-Verse', t: 2018, g: 'Animasi', d: 117, a: 'Gaya gambar komik yang bergerak. Cerita Miles Morales yang hangat.' },
  { j: 'Toy Story', t: 1995, g: 'Animasi', d: 81, a: 'Mainan yang hidup saat pemiliknya pergi. Awal era film animasi komputer.' },
  { j: 'Spirited Away', t: 2001, g: 'Animasi', d: 125, a: 'Anak perempuan tersesat di dunia roh. Imajinasi Studio Ghibli paling liar.' },
  { j: 'Up', t: 2009, g: 'Animasi', d: 96, a: 'Kakek dan rumah balonnya. Sepuluh menit pertama saja sudah bikin mewek.' },
  { j: 'Coco', t: 2017, g: 'Animasi', d: 105, a: 'Anak musisi ke dunia arwah. Tentang keluarga dan lagu yang terlupakan.' },
  { j: 'Your Name', t: 2016, g: 'Animasi', d: 106, a: 'Dua remaja bertukar tubuh lintas waktu. Visual langitnya indah sekali.' },
  { j: 'Kung Fu Panda', t: 2008, g: 'Animasi', d: 92, a: 'Panda pemalas jadi pendekar. Lucu dan pesannya sederhana tapi kena.' },
  { j: 'Jumbo', t: 2025, g: 'Animasi', d: 102, a: 'Anak bertubuh besar dan hantu kecil. Animasi Indonesia terlaris sepanjang masa.' },
  // --- Sci-Fi (6) ---
  { j: 'Interstellar', t: 2014, g: 'Sci-Fi', d: 169, a: 'Mencari planet baru demi umat manusia. Lubang hitamnya dibuat dari fisika nyata.' },
  { j: 'Inception', t: 2010, g: 'Sci-Fi', d: 148, a: 'Mimpi di dalam mimpi. Perlu fokus, tapi nagih.' },
  { j: 'The Matrix', t: 1999, g: 'Sci-Fi', d: 136, a: 'Dunia ternyata simulasi. Aksi dan filosofi dalam satu paket.' },
  { j: 'Dune: Part Two', t: 2024, g: 'Sci-Fi', d: 166, a: 'Paul Atreides di gurun Arrakis. Skalanya besar sekali di layar.' },
  { j: 'Ex Machina', t: 2014, g: 'Sci-Fi', d: 108, a: 'Tes Turing dengan robot perempuan. Tiga orang, satu rumah, banyak jebakan.' },
  { j: 'Everything Everywhere All at Once', t: 2022, g: 'Sci-Fi', d: 139, a: 'Ibu pemilik laundry jadi penyelamat multiverse. Kacau, lucu, dan menyentuh.' },
  // --- Thriller (6) ---
  { j: 'Se7en', t: 1995, g: 'Thriller', d: 127, a: 'Pembunuh berantai dengan motif tujuh dosa. Akhirnya terkenal bikin syok.' },
  { j: 'Gone Girl', t: 2014, g: 'Thriller', d: 149, a: 'Istri hilang, suami dituduh. Paruh kedua film membalik semuanya.' },
  { j: 'Shutter Island', t: 2010, g: 'Thriller', d: 138, a: 'Detektif di rumah sakit jiwa pulau terpencil. Kebenarannya bikin mikir ulang.' },
  { j: 'Knives Out', t: 2019, g: 'Thriller', d: 130, a: 'Siapa bunuh penulis kaya raya? Tebak-tebakan pembunuh yang seru.' },
  { j: 'The Silence of the Lambs', t: 1991, g: 'Thriller', d: 118, a: 'Agen FBI minta bantuan pembunuh kanibal. Dialognya menegangkan.' },
  { j: 'Penyalin Cahaya', t: 2021, g: 'Thriller', d: 129, a: 'Mahasiswi kehilangan beasiswa setelah pesta. Penyelidikannya pelan tapi menusuk.' },
  // --- Romantis (5) ---
  { j: 'La La Land', t: 2016, g: 'Romantis', d: 128, a: 'Musisi jazz dan aktris di Los Angeles. Musiknya nempel di kepala.' },
  { j: 'Dilan 1990', t: 2018, g: 'Romantis', d: 110, a: 'Rindu dan gombalan Bandung tahun 1990. Ringan dan nostalgia.' },
  { j: '500 Days of Summer', t: 2009, g: 'Romantis', d: 95, a: 'Cinta yang tidak berbalas, diceritakan tidak berurutan. Jujur soal patah hati.' },
  { j: 'Titanic', t: 1997, g: 'Romantis', d: 194, a: 'Kapal besar, cinta lintas kelas. Tiga jam yang terasa cepat.' },
  { j: 'Habibie & Ainun', t: 2012, g: 'Romantis', d: 118, a: 'Kisah cinta B. J. Habibie dan Ainun. Berdasarkan kisah nyata.' },
  // --- Indonesia (5) ---
  { j: 'Keluarga Cemara', t: 2018, g: 'Indonesia', d: 110, a: 'Keluarga kaya yang jatuh miskin dan pindah ke desa. Hangat dari awal sampai akhir.' },
  { j: 'Marlina Si Pembunuh dalam Empat Babak', t: 2017, g: 'Indonesia', d: 93, a: 'Janda di Sumba melawan perampok. Western Indonesia yang sinematik.' },
  { j: 'Gundala', t: 2019, g: 'Indonesia', d: 123, a: 'Satpam jadi pahlawan super petir. Awal jagat sinema Bumilangit.' },
  { j: 'Sokola Rimba', t: 2013, g: 'Indonesia', d: 91, a: 'Guru di pedalaman Jambi mengajar suku Anak Dalam. Berdasarkan kisah nyata.' },
  { j: 'Impetigore (Perempuan Tanah Jahanam)', t: 2019, g: 'Indonesia', d: 106, a: 'Dua kakak beradik pulang ke desa terkutuk. Horor rakyat yang gelap.' },
];

export const GENRE = ['Semua', 'Aksi', 'Komedi', 'Drama', 'Horor', 'Animasi', 'Sci-Fi', 'Thriller', 'Romantis', 'Indonesia'];

export function filterFilm(genre) {
  return genre === 'Semua' ? BANK_FILM.slice() : BANK_FILM.filter((f) => f.g === genre);
}

export function acakFilm(genre, sudah, rng) {
  const pool = filterFilm(genre).filter((f) => !sudah.includes(f.j));
  const daftar = pool.length ? pool : filterFilm(genre);
  const r = rng || Math.random;
  return daftar[Math.floor(r() * daftar.length)];
}

export function render(root) {
  const box = T.out();
  const genreSel = T.select(GENRE.map((g) => [g, g === 'Semua' ? 'Semua genre' : g]), 'Semua');
  const riwayat = [];

  const tampil = (f) => {
    T.show(box,
      '<p class="hint center">' + T.esc(f.g) + ' · ' + f.t + ' · ' + f.d + ' menit</p>' +
      '<div class="big center" style="font-size:26px;line-height:1.3">' + T.esc(f.j) + '</div>' +
      '<p class="center" style="line-height:1.6">' + T.esc(f.a) + '</p>' +
      '<p class="center hint">Film ke-' + riwayat.length + ' malam ini. Sudah ' + riwayat.length + ' dari ' + filterFilm(genreSel.value).length + ' film ' + (genreSel.value === 'Semua' ? 'di daftar' : 'genre ini') + ' muncul.</p>'
    );
    box.appendChild(T.row(
      T.btn('🎲 Acak lagi', acak, true),
      T.copyBtn(() => 'Malam ini nonton ' + f.j + ' (' + f.t + '), ' + f.g + ', ' + f.d + ' menit. ' + f.a, '📋 Salin rekomendasi')
    ));
  };

  const acak = () => {
    const f = acakFilm(genreSel.value, riwayat, Math.random);
    if (!riwayat.includes(f.j)) riwayat.push(f.j);
    tampil(f);
  };

  genreSel.addEventListener('change', () => {
    riwayat.length = 0;
    T.show(box, '<p class="hint center">Genre diganti. Tekan "Acak film" untuk mulai.</p>');
  });

  root.appendChild(T.el('<p class="hint">60 film kurasi dari berbagai genre. Pilih genre kalau ada maunya, atau biarkan acak. Film yang sudah muncul tidak diulang sampai semua habis.</p>'));
  root.appendChild(T.field('Genre', genreSel));
  root.appendChild(T.row(T.btn('🎲 Acak film', acak, true)));
  root.appendChild(box);
  T.show(box, '<p class="hint center">Tekan "Acak film" dan malam ini urusan nonton beres.</p>');
}
