import { h as T, utils } from '../../core.js';

export const meta = {"id": "generator-trivia", "name": "Generator Trivia", "cat": "fun", "icon": "❓", "desc": "Buat set pertanyaan trivia dari topik pilihanmu untuk kuis dan game, lengkap dengan jawaban dan penjelasan singkat.", "keywords": "trivia,kuis,soal,pertanyaan,game,topik,jawaban", "since": "6.19.0"};

/* Bank soal 60, ditulis sendiri (6 topik x 10). Tiap soal: topik, pertanyaan,
   jawaban benar, 3 pengecoh, dan penjelasan singkat. Semua jawaban dicek. */
export const BANK_TRIVIA = [
  // --- Indonesia (10) ---
  { k: 'Indonesia', q: 'Candi Borobudur terletak di provinsi mana?', a: 'Jawa Tengah', w: ['Jawa Timur', 'DI Yogyakarta', 'Jawa Barat'], p: 'Borobudur ada di Magelang, Jawa Tengah.' },
  { k: 'Indonesia', q: 'Siapa pencipta lagu Indonesia Raya?', a: 'W. R. Supratman', w: ['Ismail Marzuki', 'H. Mutahar', 'Cornel Simanjuntak'], p: 'Lagu ini pertama kali diperdengarkan pada 1928.' },
  { k: 'Indonesia', q: 'Apa ibukota provinsi Sulawesi Selatan?', a: 'Makassar', w: ['Manado', 'Palu', 'Kendari'], p: 'Dulu kota ini bernama Ujung Pandang.' },
  { k: 'Indonesia', q: 'Pulau Bali dikelilingi selat apa di sebelah barat?', a: 'Selat Bali', w: ['Selat Lombok', 'Selat Sunda', 'Selat Makassar'], p: 'Selat Bali memisahkan Bali dan Jawa.' },
  { k: 'Indonesia', q: 'Siapa presiden Indonesia yang menjabat paling lama?', a: 'Soeharto', w: ['Soekarno', 'Susilo Bambang Yudhoyono', 'Joko Widodo'], p: 'Soeharto menjabat 32 tahun, 1967 sampai 1998.' },
  { k: 'Indonesia', q: 'Bahasa daerah apa yang paling banyak penuturnya di Indonesia?', a: 'Bahasa Jawa', w: ['Bahasa Sunda', 'Bahasa Madura', 'Bahasa Minangkabau'], p: 'Penutur bahasa Jawa diperkirakan lebih dari 80 juta orang.' },
  { k: 'Indonesia', q: 'Gunung tertinggi di Indonesia adalah?', a: 'Puncak Jaya', w: ['Gunung Kerinci', 'Gunung Semeru', 'Gunung Rinjani'], p: 'Puncak Jaya di Papua tingginya 4.884 meter.' },
  { k: 'Indonesia', q: 'Makanan rendang berasal dari daerah mana?', a: 'Sumatera Barat', w: ['Jawa Barat', 'Sumatera Utara', 'Kalimantan Barat'], p: 'Rendang adalah masakan khas Minangkabau.' },
  { k: 'Indonesia', q: 'Kapan Sumpah Pemuda diikrarkan?', a: '28 Oktober 1928', w: ['17 Agustus 1945', '20 Mei 1908', '10 November 1945'], p: 'Ikrar ini lahir dari Kongres Pemuda Kedua.' },
  { k: 'Indonesia', q: 'Apa nama mata uang Indonesia sebelum Rupiah?', a: 'Gulden Hindia Belanda', w: ['Dolar Malaya', 'Rupiah Lama', 'Koin Kepeng'], p: 'Rupiah resmi dipakai setelah kemerdekaan, menggantikan gulden.' },
  // --- Dunia (10) ---
  { k: 'Dunia', q: 'Negara mana yang paling luas wilayahnya di dunia?', a: 'Rusia', w: ['Kanada', 'Tiongkok', 'Amerika Serikat'], p: 'Rusia luasnya sekitar 17 juta kilometer persegi.' },
  { k: 'Dunia', q: 'Sungai terpanjang di dunia adalah?', a: 'Sungai Nil', w: ['Sungai Amazon', 'Sungai Yangtze', 'Sungai Mississippi'], p: 'Nil sekitar 6.650 km, sedikit lebih panjang dari Amazon.' },
  { k: 'Dunia', q: 'Apa ibukota Islandia?', a: 'Reykjavik', w: ['Oslo', 'Helsinki', 'Tallinn'], p: 'Reykjavik adalah ibukota paling utara di dunia.' },
  { k: 'Dunia', q: 'Negara mana yang pertama kali memberikan hak pilih perempuan?', a: 'Selandia Baru', w: ['Amerika Serikat', 'Inggris', 'Prancis'], p: 'Selandia Baru memberi hak pilih perempuan pada 1893.' },
  { k: 'Dunia', q: 'Menara Eiffel selesai dibangun pada tahun berapa?', a: '1889', w: ['1879', '1899', '1909'], p: 'Menara ini dibangun untuk Pameran Dunia Paris 1889.' },
  { k: 'Dunia', q: 'Apa bahasa resmi Mesir?', a: 'Arab', w: ['Koptik', 'Inggris', 'Prancis'], p: 'Bahasa Arab adalah bahasa resmi dan bahasa sehari-hari Mesir.' },
  { k: 'Dunia', q: 'Kota mana yang dijuluki Kota Terlarang?', a: 'Beijing', w: ['Lhasa', 'Kyoto', 'Seoul'], p: 'Kota Terlarang adalah kompleks istana kekaisaran di Beijing.' },
  { k: 'Dunia', q: 'Gurun terbesar di dunia adalah?', a: 'Gurun Antarktika', w: ['Gurun Sahara', 'Gurun Gobi', 'Gurun Arab'], p: 'Antarktika adalah gurun kutub seluas sekitar 14 juta km persegi.' },
  { k: 'Dunia', q: 'Negara mana yang punya piramida terbanyak di dunia?', a: 'Sudan', w: ['Mesir', 'Meksiko', 'Peru'], p: 'Sudan punya sekitar 255 piramida, lebih banyak dari Mesir.' },
  { k: 'Dunia', q: 'Apa nama samudra terkecil di dunia?', a: 'Samudra Arktik', w: ['Samudra Hindia', 'Samudra Atlantik', 'Samudra Selatan'], p: 'Samudra Arktik luasnya sekitar 14 juta kilometer persegi.' },
  // --- Sains (10) ---
  { k: 'Sains', q: 'Apa unsur kimia dengan simbol Fe?', a: 'Besi', w: ['Fluor', 'Fosfor', 'Timah'], p: 'Fe berasal dari ferrum, bahasa Latin untuk besi.' },
  { k: 'Sains', q: 'Planet mana yang punya cincin paling jelas terlihat?', a: 'Saturnus', w: ['Jupiter', 'Uranus', 'Neptunus'], p: 'Cincin Saturnus terbuat dari es dan batu.' },
  { k: 'Sains', q: 'Berapa kecepatan suara di udara pada suhu kamar?', a: 'Sekitar 343 m/detik', w: ['Sekitar 150 m/detik', 'Sekitar 1.500 m/detik', 'Sekitar 3.000 m/detik'], p: 'Di air, suara jauh lebih cepat: sekitar 1.500 m/detik.' },
  { k: 'Sains', q: 'Organ tubuh manusia apa yang paling besar?', a: 'Kulit', w: ['Hati', 'Jantung', 'Paru-paru'], p: 'Kulit dewasa luasnya sekitar 2 meter persegi.' },
  { k: 'Sains', q: 'Hewan apa yang dikenal sebagai mamalia yang bisa terbang?', a: 'Kelelawar', w: ['Tupai terbang', 'Kuskus', 'Kolugo'], p: 'Kelelawar adalah satu-satunya mamalia yang terbang aktif.' },
  { k: 'Sains', q: 'Apa nama gaya yang menarik benda ke pusat Bumi?', a: 'Gravitasi', w: ['Gesekan', 'Magnet', 'Inersia'], p: 'Gravitasi Bumi sekitar 9,8 m/detik kuadrat.' },
  { k: 'Sains', q: 'Berapa jumlah kromosom manusia normal?', a: '46', w: ['23', '44', '48'], p: 'Manusia punya 23 pasang kromosom, total 46.' },
  { k: 'Sains', q: 'Tumbuhan membuat makanan lewat proses apa?', a: 'Fotosintesis', w: ['Respirasi', 'Fermentasi', 'Osmosis'], p: 'Fotosintesis memakai cahaya, air, dan karbon dioksida.' },
  { k: 'Sains', q: 'Logam apa yang berwujud cair pada suhu kamar?', a: 'Raksa (merkuri)', w: ['Besi', 'Tembaga', 'Aluminium'], p: 'Raksa meleleh pada minus 39 derajat Celsius.' },
  { k: 'Sains', q: 'Apa satuan SI untuk gaya?', a: 'Newton', w: ['Joule', 'Watt', 'Pascal'], p: 'Satu newton adalah gaya yang memberi percepatan 1 m/detik kuadrat pada 1 kg massa.' },
  // --- Olahraga (10) ---
  { k: 'Olahraga', q: 'Berapa lama satu pertandingan sepak bola reguler?', a: '90 menit', w: ['80 menit', '100 menit', '120 menit'], p: 'Dua babak 45 menit, tanpa tambahan waktu.' },
  { k: 'Olahraga', q: 'Di cabang olahraga apa istilah "smash" dipakai?', a: 'Bulutangkis', w: ['Renang', 'Angkat besi', 'Panahan'], p: 'Smash juga dipakai di voli dan tenis.' },
  { k: 'Olahraga', q: 'Negara mana yang paling sering juara Piala Dunia sepak bola putra?', a: 'Brasil', w: ['Jerman', 'Argentina', 'Italia'], p: 'Brasil juara 5 kali: 1958, 1962, 1970, 1994, 2002.' },
  { k: 'Olahraga', q: 'Berapa poin yang didapat dari satu lemparan bebas di basket?', a: '1 poin', w: ['2 poin', '3 poin', '4 poin'], p: 'Lemparan bebas selalu bernilai 1 poin.' },
  { k: 'Olahraga', q: 'Olahraga apa yang memakai raket dan kok?', a: 'Bulutangkis', w: ['Tenis', 'Squash', 'Tenis meja'], p: 'Kok juga disebut shuttlecock.' },
  { k: 'Olahraga', q: 'Maraton resmi berjarak berapa kilometer?', a: '42,195 km', w: ['40 km', '42 km', '45 km'], p: 'Jarak ini ditetapkan sejak Olimpiade London 1908.' },
  { k: 'Olahraga', q: 'Di negara mana Olimpiade pertama era modern diadakan?', a: 'Yunani', w: ['Italia', 'Prancis', 'Inggris'], p: 'Olimpiade modern pertama di Athena pada 1896.' },
  { k: 'Olahraga', q: 'Berapa pemain dalam satu tim voli di lapangan?', a: '6 pemain', w: ['5 pemain', '7 pemain', '11 pemain'], p: 'Enam pemain, dengan libero sebagai pemain bertahan khusus.' },
  { k: 'Olahraga', q: 'Gaya renang apa yang paling cepat?', a: 'Gaya bebas (crawl)', w: ['Gaya dada', 'Gaya punggung', 'Gaya kupu-kupu'], p: 'Gaya bebas adalah gaya tercepat dalam kompetisi renang.' },
  { k: 'Olahraga', q: 'Siapa pemegang rekor dunia lari 100 meter putra?', a: 'Usain Bolt', w: ['Tyson Gay', 'Yohan Blake', 'Justin Gatlin'], p: 'Bolt mencetak 9,58 detik di Berlin pada 2009.' },
  // --- Film & Musik (10) ---
  { k: 'Film & Musik', q: 'Siapa sutradara film Parasite?', a: 'Bong Joon-ho', w: ['Park Chan-wook', 'Kim Jee-woon', 'Lee Chang-dong'], p: 'Parasite menang Oscar Film Terbaik pada 2020.' },
  { k: 'Film & Musik', q: 'Film animasi pertama yang dibuat Pixar adalah?', a: 'Toy Story', w: ['Finding Nemo', 'Up', 'Monsters, Inc.'], p: 'Toy Story rilis 1995 dan jadi film animasi komputer panjang pertama.' },
  { k: 'Film & Musik', q: 'Lagu "Bohemian Rhapsody" dibawakan band apa?', a: 'Queen', w: ['The Beatles', 'Led Zeppelin', 'Pink Floyd'], p: 'Lagu ini ditulis Freddie Mercury dan rilis pada 1975.' },
  { k: 'Film & Musik', q: 'Siapa pemeran utama film Dilan 1990?', a: 'Iqbaal Ramadhan', w: ['Jefri Nichol', 'Angga Yunanda', 'Reza Rahadian'], p: 'Iqbaal berperan sebagai Dilan, Vanesha Prescilla sebagai Milea.' },
  { k: 'Film & Musik', q: 'Alat musik apa yang dimainkan dengan cara dipetik dan punya 6 senar?', a: 'Gitar', w: ['Biola', 'Ukulele', 'Harpa'], p: 'Gitar standar punya 6 senar, ukulele punya 4.' },
  { k: 'Film & Musik', q: 'Film dengan pendapatan tertinggi sepanjang masa (tanpa inflasi) adalah?', a: 'Avatar', w: ['Avengers: Endgame', 'Titanic', 'Star Wars: The Force Awakens'], p: 'Avatar meraup lebih dari 2,9 miliar dolar AS.' },
  { k: 'Film & Musik', q: 'Penyanyi lagu "Tak Ingin Usai" adalah?', a: 'Keisya Levronka', w: ['Tiara Andini', 'Lyodra', 'Ziva Magnolya'], p: 'Lagu ini viral pada 2022.' },
  { k: 'Film & Musik', q: 'Berapa jumlah nada dalam satu tangga nada mayor?', a: '7 nada', w: ['5 nada', '8 nada', '12 nada'], p: 'Tujuh nada pokok, ditambah oktaf sebagai nada kedelapan.' },
  { k: 'Film & Musik', q: 'Siapa pengisi suara Buzz Lightyear di Toy Story versi Inggris?', a: 'Tim Allen', w: ['Tom Hanks', 'Billy Crystal', 'John Goodman'], p: 'Tom Hanks mengisi suara Woody.' },
  { k: 'Film & Musik', q: 'Film "Pengabdi Setan" (2017) disutradarai siapa?', a: 'Joko Anwar', w: ['Timo Tjahjanto', 'Kimo Stamboel', 'Awi Suryadi'], p: 'Film ini adalah remake dari film horor Indonesia 1980.' },
  // --- Sejarah (10) ---
  { k: 'Sejarah', q: 'Tembok Berlin runtuh pada tahun berapa?', a: '1989', w: ['1979', '1991', '1999'], p: 'Tembok ini runtuh 9 November 1989.' },
  { k: 'Sejarah', q: 'Siapa kaisar Romawi pertama?', a: 'Augustus', w: ['Julius Caesar', 'Nero', 'Trajan'], p: 'Augustus, dulu bernama Oktavianus, jadi kaisar pada 27 SM.' },
  { k: 'Sejarah', q: 'Perang Dunia II berakhir pada tahun berapa?', a: '1945', w: ['1943', '1944', '1947'], p: 'Berakhir dengan menyerahnya Jepang pada September 1945.' },
  { k: 'Sejarah', q: 'Kerajaan Majapahit berpusat di daerah mana?', a: 'Jawa Timur', w: ['Jawa Tengah', 'Sumatera Selatan', 'Sulawesi Selatan'], p: 'Pusat Majapahit ada di sekitar Trowulan, Mojokerto.' },
  { k: 'Sejarah', q: 'Siapa penjelajah pertama yang mengelilingi dunia dengan kapal?', a: 'Ferdinand Magellan', w: ['Christopher Columbus', 'Vasco da Gama', 'James Cook'], p: 'Ekspedisi Magellan selesai 1522, meski Magellan sendiri gugur di Filipina.' },
  { k: 'Sejarah', q: 'Revolusi Prancis dimulai pada tahun berapa?', a: '1789', w: ['1776', '1804', '1848'], p: 'Dimulai dengan penyerbuan Bastille pada 14 Juli 1789.' },
  { k: 'Sejarah', q: 'Siapa pendiri Dinasti Ming di Tiongkok?', a: 'Zhu Yuanzhang', w: ['Kublai Khan', 'Qin Shi Huang', 'Li Shimin'], p: 'Zhu Yuanzhang naik takhta sebagai Kaisar Hongwu pada 1368.' },
  { k: 'Sejarah', q: 'Kapal Titanic tenggelam pada tahun berapa?', a: '1912', w: ['1902', '1922', '1932'], p: 'Titanic tenggelam 15 April 1912 dalam pelayaran perdananya.' },
  { k: 'Sejarah', q: 'Siapa tokoh yang memimpin Perang Diponegoro?', a: 'Pangeran Diponegoro', w: ['Pangeran Antasari', 'Tuanku Imam Bonjol', 'Cut Nyak Dien'], p: 'Perang ini berlangsung 1825 sampai 1830 di Jawa.' },
  { k: 'Sejarah', q: 'Mesin cetak modern pertama dibuat oleh siapa?', a: 'Johannes Gutenberg', w: ['Isaac Newton', 'Leonardo da Vinci', 'Galileo Galilei'], p: 'Mesin cetak Gutenberg muncul sekitar 1440-an di Jerman.' },
];

export const TOPIK_TRIVIA = ['Semua', 'Indonesia', 'Dunia', 'Sains', 'Olahraga', 'Film & Musik', 'Sejarah'];

export function pilihSoal(topik, jumlah, rng) {
  const r = rng || Math.random;
  const pool = topik === 'Semua' ? BANK_TRIVIA.slice() : BANK_TRIVIA.filter((s) => s.k === topik);
  const a = pool.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    const t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a.slice(0, Math.min(jumlah, a.length));
}

export function acakOpsi(soal, rng) {
  const r = rng || Math.random;
  const opsi = [soal.a].concat(soal.w);
  for (let i = opsi.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    const t = opsi[i]; opsi[i] = opsi[j]; opsi[j] = t;
  }
  return opsi;
}

export function formatSet(soalList, tampilJawaban) {
  return soalList.map((s, i) => {
    const opsi = acakOpsi(s, () => 0.5);
    let teks = (i + 1) + '. [' + s.k + '] ' + s.q + '\n' + opsi.map((o, j) => '   ' + 'ABCD'[j] + '. ' + o).join('\n');
    if (tampilJawaban) teks += '\n   Jawaban: ' + s.a + '. ' + s.p;
    return teks;
  }).join('\n\n');
}

export function render(root) {
  const box = T.out();
  const topikSel = T.select(TOPIK_TRIVIA.map((t) => [t, t === 'Semua' ? 'Semua topik (campuran)' : t]), 'Semua');
  const jumlahSel = T.select([['5', '5 soal'], ['10', '10 soal'], ['15', '15 soal'], ['20', '20 soal']], '10');
  const jawabSel = T.select([['ya', 'Tampilkan jawaban + penjelasan'], ['tidak', 'Sembunyikan jawaban (buat kuis)']], 'ya');
  let setSoal = [];

  const gambar = () => {
    if (!setSoal.length) {
      T.show(box, '<p class="hint center">Pilih topik dan jumlah soal, lalu tekan "Buat set trivia". Soalnya beda tiap kali dibuat.</p>');
      return;
    }
    const tampilJawaban = jawabSel.value === 'ya';
    let html = '<p class="hint center">' + setSoal.length + ' soal · topik: ' + T.esc(topikSel.value) + '</p>';
    setSoal.forEach((s, i) => {
      const opsi = acakOpsi(s, Math.random);
      html += '<div style="margin:14px 0;padding-bottom:12px;border-bottom:1px solid #ffffff10">' +
        '<p style="font-size:15px;line-height:1.6;margin:0 0 6px"><b>' + (i + 1) + '. </b>' + T.esc(s.q) + ' <span class="hint">[' + T.esc(s.k) + ']</span></p>' +
        opsi.map((o, j) => '<p style="margin:2px 0 2px 18px;font-size:14px;color:#c9c9c9">' + 'ABCD'[j] + '. ' + T.esc(o) + '</p>').join('') +
        (tampilJawaban ? '<p style="margin:6px 0 0 18px;font-size:13px;color:#7ee787">Jawaban: <b>' + T.esc(s.a) + '</b>. ' + T.esc(s.p) + '</p>' : '') +
        '</div>';
    });
    T.show(box, html);
    const bar = T.el('<div class="row" style="flex-wrap:wrap;margin-top:12px"></div>');
    bar.appendChild(T.btn('🎲 Acak set baru', buat, true));
    bar.appendChild(T.copyBtn(() => formatSet(setSoal, tampilJawaban), '📋 Salin semua soal'));
    bar.appendChild(T.dlBtn('set-trivia.txt', () => formatSet(setSoal, tampilJawaban), 'text/plain;charset=utf-8', '⬇️ Unduh .txt'));
    box.appendChild(bar);
  };

  const buat = () => {
    setSoal = pilihSoal(topikSel.value, Number(jumlahSel.value), Math.random);
    gambar();
  };

  jawabSel.addEventListener('change', gambar);

  root.appendChild(T.el('<p class="hint">Bukan kuis untuk dimainkan sendiri, tapi pembuat set soal untuk kuis dan game bareng teman. Pilih topik, tentukan jumlahnya, lalu salin atau unduh hasilnya. Bank soal: 60 soal dari 6 topik.</p>'));
  root.appendChild(T.field('Topik', topikSel));
  root.appendChild(T.field('Jumlah soal', jumlahSel));
  root.appendChild(T.field('Jawaban', jawabSel, 'Sembunyikan kalau set ini mau dipakai sebagai soal kuis.'));
  root.appendChild(T.row(T.btn('❓ Buat set trivia', buat, true)));
  root.appendChild(box);
  gambar();
}
