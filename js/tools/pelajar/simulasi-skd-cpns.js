import { h as T, kv } from '../../core.js?v=6.12.0';

export const meta = {"id":"simulasi-skd-cpns","name":"Simulasi SKD CPNS","cat":"pelajar","icon":"🎓","desc":"Tryout singkat 30 soal ala CAT BKN: TWK, TIU, TKP dengan timer dan skor passing grade.","keywords":"cpns,skd,twk,tiu,tkp,tryout,simulasi,cat bkn,asn","since":"6.11.0"};

/* Passing grade resmi formasi umum (KepmenPAN-RB No. 321 Tahun 2024, dipakai
   sampai seleksi 2026): TWK 65 dari maks 150, TIU 80 dari maks 175, TKP 166
   dari maks 225. Simulasi ini hanya 30 soal (10 per subtes, maks 50 per subtes),
   jadi ambang yang dipakai adalah ambang proporsional yang disetarakan. */
export const PG_RESMI = { TWK: 65, TIU: 80, TKP: 166 };
export const PG_MAKS_RESMI = { TWK: 150, TIU: 175, TKP: 225 };
export const JUMLAH_SOAL = { TWK: 10, TIU: 10, TKP: 10 };
export const DURASI_MENIT = 30;
export const pgProporsional = (sub) => Math.ceil(PG_RESMI[sub] * (JUMLAH_SOAL[sub] * 5) / PG_MAKS_RESMI[sub]);

const acak = (min, maks) => Math.floor(Math.random() * (maks - min + 1)) + min;
const pilih = (arr) => arr[acak(0, arr.length - 1)];
function kocok(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = acak(0, i); const t = a[i]; a[i] = a[j]; a[j] = t; }
  return a;
}

/* ---------------- TWK: soal faktual kewarganegaraan ---------------- */
export const BANK_TWK = [
  { t: 'Bunyi sila pertama Pancasila adalah …', o: ['Ketuhanan Yang Maha Esa', 'Kemanusiaan yang adil dan beradab', 'Persatuan Indonesia', 'Kerakyatan yang dipimpin oleh hikmat kebijaksanaan', 'Keadilan sosial bagi seluruh rakyat Indonesia'], k: 0, b: 'Sila pertama Pancasila: Ketuhanan Yang Maha Esa.' },
  { t: 'Alinea pertama Pembukaan UUD 1945 menyatakan bahwa …', o: ['kemerdekaan ialah hak segala bangsa', 'negara Indonesia berbentuk republik', 'segala warga negara bersamaan kedudukannya di dalam hukum', 'kedaulatan berada di tangan rakyat', 'presiden memegang kekuasaan pemerintahan'], k: 0, b: 'Alinea pertama Pembukaan UUD 1945: "Bahwa sesungguhnya kemerdekaan itu ialah hak segala bangsa".' },
  { t: 'Lambang negara Indonesia adalah …', o: ['Garuda Pancasila', 'Bhinneka Tunggal Ika', 'Elang Jawa', 'Komodo', 'Banteng'], k: 0, b: 'Lambang negara Indonesia adalah Garuda Pancasila, ditetapkan melalui PP No. 66 Tahun 1951.' },
  { t: 'Semboyan Bhinneka Tunggal Ika artinya …', o: ['berbeda-beda tetapi tetap satu', 'bersatu kita teguh, bercerai kita runtuh', 'kemerdekaan ialah hak segala bangsa', 'satu nusa, satu bangsa, satu bahasa', 'adil dan makmur bagi semua'], k: 0, b: 'Bhinneka Tunggal Ika berasal dari kitab Sutasoma karya Mpu Tantular, artinya berbeda-beda tetapi tetap satu jua.' },
  { t: 'Pasal 1 ayat (1) UUD 1945 menyatakan bahwa Negara Indonesia ialah …', o: ['Negara Kesatuan yang berbentuk Republik', 'Negara Serikat yang berbentuk Kerajaan', 'Negara Kesatuan yang berbentuk Kerajaan', 'Negara Federasi yang berbentuk Republik', 'Negara Serikat yang berbentuk Republik'], k: 0, b: 'Pasal 1 ayat (1) UUD 1945: "Negara Indonesia ialah Negara Kesatuan, yang berbentuk Republik."' },
  { t: 'Proklamasi Kemerdekaan Indonesia dibacakan pada tanggal …', o: ['17 Agustus 1945', '20 Mei 1908', '28 Oktober 1928', '1 Juni 1945', '18 Agustus 1945'], k: 0, b: 'Proklamasi dibacakan Soekarno pada 17 Agustus 1945 di Jalan Pegangsaan Timur 56, Jakarta.' },
  { t: 'Bunyi sila kedua Pancasila adalah …', o: ['Kemanusiaan yang adil dan beradab', 'Ketuhanan Yang Maha Esa', 'Persatuan Indonesia', 'Keadilan sosial bagi seluruh rakyat Indonesia', 'Kerakyatan yang dipimpin oleh hikmat kebijaksanaan'], k: 0, b: 'Sila kedua Pancasila: Kemanusiaan yang adil dan beradab.' },
  { t: 'Lagu kebangsaan Indonesia Raya diciptakan oleh …', o: ['W. R. Supratman', 'Ismail Marzuki', 'Cornel Simanjuntak', 'Kusbini', 'Husein Mutahar'], k: 0, b: 'Indonesia Raya diciptakan Wage Rudolf Supratman dan pertama diperdengarkan pada Kongres Pemuda II, 28 Oktober 1928.' },
  { t: 'Warna merah pada bendera Merah Putih melambangkan …', o: ['keberanian', 'kesucian', 'kemakmuran', 'kedamaian', 'kesetiaan'], k: 0, b: 'Merah melambangkan keberanian, putih melambangkan kesucian.' },
  { t: 'Pancasila disahkan sebagai dasar negara oleh PPKI pada tanggal …', o: ['18 Agustus 1945', '17 Agustus 1945', '1 Juni 1945', '22 Juni 1945', '29 Mei 1945'], k: 0, b: 'PPKI mengesahkan UUD 1945 beserta Pancasila sebagai dasar negara pada 18 Agustus 1945.' },
  { t: 'Sumpah Pemuda diikrarkan pada tanggal …', o: ['28 Oktober 1928', '20 Mei 1908', '17 Agustus 1945', '1 Juni 1945', '10 November 1945'], k: 0, b: 'Sumpah Pemuda diikrarkan pada Kongres Pemuda II, 28 Oktober 1928.' },
  { t: 'Bunyi sila kelima Pancasila adalah …', o: ['Keadilan sosial bagi seluruh rakyat Indonesia', 'Ketuhanan Yang Maha Esa', 'Kemanusiaan yang adil dan beradab', 'Persatuan Indonesia', 'Kerakyatan yang dipimpin oleh hikmat kebijaksanaan'], k: 0, b: 'Sila kelima Pancasila: Keadilan sosial bagi seluruh rakyat Indonesia.' },
  { t: 'Pidato Soekarno yang pertama kali mengemukakan nama Pancasila disampaikan pada …', o: ['1 Juni 1945', '29 Mei 1945', '22 Juni 1945', '17 Agustus 1945', '18 Agustus 1945'], k: 0, b: 'Soekarno menyampaikan pidato tentang dasar negara dan nama Pancasila pada sidang BPUPKI, 1 Juni 1945, yang kini diperingati sebagai Hari Lahir Pancasila.' },
  { t: 'Pasal 27 ayat (1) UUD 1945 menyatakan bahwa segala warga negara …', o: ['bersamaan kedudukannya di dalam hukum dan pemerintahan', 'berhak mendapat pendidikan dasar', 'wajib membela negara', 'berhak atas pekerjaan yang layak', 'bebas memeluk agama masing-masing'], k: 0, b: 'Pasal 27 ayat (1) UUD 1945: "Segala warga negara bersamaan kedudukannya di dalam hukum dan pemerintahan dan wajib menjunjung hukum dan pemerintahan itu dengan tidak ada kecualinya."' },
  { t: 'Majelis Permusyawaratan Rakyat (MPR) terdiri atas anggota …', o: ['DPR dan DPD', 'DPR dan Presiden', 'DPR dan Mahkamah Agung', 'DPD dan Mahkamah Konstitusi', 'DPR dan Menteri'], k: 0, b: 'Pasal 2 ayat (1) UUD 1945: MPR terdiri atas anggota DPR dan anggota DPD.' },
];

/* ---------------- TIU: generator soal ---------------- */
function buatDeret() {
  const jenis = pilih(['aritmetika', 'geometri', 'fibonacci', 'kuadrat']);
  let deret = [], jawab = 0, bahas = '';
  if (jenis === 'aritmetika') {
    const a = acak(2, 20), d = pilih([2, 3, 4, 5, 6, -3, -4]);
    deret = Array.from({ length: 6 }, (_, i) => a + d * i);
    jawab = deret[5];
    bahas = 'Selisih antar suku selalu ' + d + ', jadi suku berikutnya = ' + deret[4] + ' + (' + d + ') = ' + jawab + '.';
  } else if (jenis === 'geometri') {
    const a = acak(2, 6), r = pilih([2, 3]);
    deret = Array.from({ length: 6 }, (_, i) => a * Math.pow(r, i));
    jawab = deret[5];
    bahas = 'Setiap suku dikali ' + r + ', jadi suku berikutnya = ' + deret[4] + ' × ' + r + ' = ' + jawab + '.';
  } else if (jenis === 'fibonacci') {
    const a = acak(1, 9), b = acak(1, 9);
    deret = [a, b];
    while (deret.length < 6) deret.push(deret[deret.length - 1] + deret[deret.length - 2]);
    jawab = deret[5];
    bahas = 'Setiap suku = jumlah dua suku sebelumnya. Suku berikutnya = ' + deret[3] + ' + ' + deret[4] + ' = ' + jawab + '.';
  } else {
    const n0 = acak(1, 5);
    deret = Array.from({ length: 6 }, (_, i) => (n0 + i) * (n0 + i));
    jawab = deret[5];
    bahas = 'Sukunya bilangan kuadrat: ' + deret.slice(0, 5).map((v, i) => (n0 + i) + '²=' + v).join(', ') + '. Berikutnya ' + (n0 + 5) + '² = ' + jawab + '.';
  }
  const o = opsiUnik(jawab, [jawab - 6, jawab - 4, jawab - 2, jawab + 2, jawab + 4, jawab + 6, jawab + 10]);
  return { t: 'Lanjutkan deret berikut: ' + deret.slice(0, 5).join(', ') + ', …', o: o.opsi, k: o.k, b: bahas, jenis: 'TIU' };
}

const ANALOGI = [
  ['Buku', 'membaca'], ['Pena', 'menulis'], ['Jarum', 'menjahit'], ['Palu', 'memukul'],
  ['Kunci', 'membuka'], ['Gunting', 'memotong'], ['Sapu', 'menyapu'], ['Kompor', 'memasak'],
  ['Cangkul', 'menggali'], ['Kamera', 'memotret'], ['Gelas', 'minum'], ['Sepeda', 'mengayuh'],
  ['Sikat', 'menyikat'], ['Sendok', 'menyendok'], ['Gergaji', 'menggergaji'], ['Obeng', 'memutar baut'],
];
function buatAnalogi() {
  const idx = kocok(ANALOGI.map((_, i) => i)).slice(0, 5);
  const p1 = ANALOGI[idx[0]], p2 = ANALOGI[idx[1]];
  const benar = p2[1];
  const opsi = kocok([benar, ANALOGI[idx[2]][1], ANALOGI[idx[3]][1], ANALOGI[idx[4]][1], ANALOGI[idx[0]][1]]);
  return {
    t: p1[0] + ' berhubungan dengan ' + p1[1] + ', seperti ' + p2[0] + ' berhubungan dengan …',
    o: opsi, k: opsi.indexOf(benar), b: p1[0] + ' dipakai untuk ' + p1[1] + ', begitu juga ' + p2[0] + ' dipakai untuk ' + benar + '.', jenis: 'TIU',
  };
}

const RANTAI = [
  ['kucing', 'mamalia', 'hewan'], ['mawar', 'bunga', 'tumbuhan'], ['guru', 'pendidik', 'pekerja'],
  ['apel', 'buah', 'makanan'], ['motor', 'kendaraan bermotor', 'alat transportasi'],
  ['emas', 'logam', 'mineral'], ['dokter', 'tenaga kesehatan', 'pekerja'],
  ['buku', 'bacaan', 'media informasi'], ['elang', 'burung', 'hewan'], ['padi', 'tanaman pangan', 'tumbuhan'],
];
function buatSilogisme() {
  const r = pilih(RANTAI);
  const benar = 'Semua ' + r[0] + ' adalah ' + r[2];
  const opsi = kocok([
    benar,
    'Semua ' + r[2] + ' adalah ' + r[0],
    'Semua ' + r[1] + ' adalah ' + r[0],
    'Sebagian ' + r[2] + ' bukan ' + r[1],
    'Tidak ada ' + r[0] + ' yang ' + r[2],
  ]);
  return {
    t: 'Semua ' + r[0] + ' adalah ' + r[1] + '. Semua ' + r[1] + ' adalah ' + r[2] + '. Kesimpulan yang benar adalah …',
    o: opsi, k: opsi.indexOf(benar),
    b: 'Karena ' + r[0] + ' termasuk ' + r[1] + ' dan semua ' + r[1] + ' termasuk ' + r[2] + ', maka semua ' + r[0] + ' pasti ' + r[2] + '.', jenis: 'TIU',
  };
}

/* Susun 5 opsi unik: jawaban benar + 4 pengecoh berbeda (diisi offset bila perlu). */
function opsiUnik(benar, kandidat) {
  const set = new Set([String(benar)]);
  for (const k of kandidat) { if (set.size >= 5) break; set.add(String(k)); }
  let off = 1;
  while (set.size < 5) {
    const v = benar + (off % 2 === 1 ? off : -off);
    set.add(String(v));
    off++;
  }
  const opsi = kocok(Array.from(set));
  return { opsi, k: opsi.indexOf(String(benar)) };
}

function buatHitung() {
  const jenis = pilih(['campuran', 'persen', 'perbandingan']);
  if (jenis === 'campuran') {
    const a = acak(5, 20), b = acak(3, 9), c = acak(2, 8);
    const jawab = a + b * c;
    const o = opsiUnik(jawab, [a * b + c, (a + b) * c, jawab + acak(1, 5), jawab - acak(1, 5)]);
    return { t: 'Hitung: ' + a + ' + ' + b + ' × ' + c + ' = …', o: o.opsi, k: o.k, b: 'Perkalian didahulukan: ' + b + ' × ' + c + ' = ' + (b * c) + ', lalu ' + a + ' + ' + (b * c) + ' = ' + jawab + '.', jenis: 'TIU' };
  }
  if (jenis === 'persen') {
    const p = pilih([10, 20, 25, 40, 50, 60, 75, 80]);
    const n = acak(2, 9) * 100;
    const jawab = p * n / 100;
    const o = opsiUnik(jawab, [jawab + 10, jawab - 10, jawab * 2, jawab / 2]);
    return { t: p + '% dari ' + n + ' adalah …', o: o.opsi, k: o.k, b: p + '% × ' + n + ' = ' + p + '/100 × ' + n + ' = ' + jawab + '.', jenis: 'TIU' };
  }
  const a = acak(2, 9), b = acak(2, 9);
  const total = (a + b) * acak(2, 9);
  const jawab = total * a / (a + b);
  const o = opsiUnik(jawab, [total * b / (a + b), total / 2, total - jawab, jawab + a]);
  return { t: 'Uang Rp' + total + ' ribu dibagi dengan perbandingan ' + a + ' : ' + b + '. Bagian yang mendapat ' + a + ' adalah Rp… ribu.', o: o.opsi, k: o.k, b: 'Total bagian = ' + (a + b) + '. Bagian ' + a + ' = ' + a + '/' + (a + b) + ' × ' + total + ' = ' + jawab + '.', jenis: 'TIU' };
}

export function buatSoalTIU() {
  return pilih([buatDeret, buatAnalogi, buatSilogisme, buatHitung])();
}

/* ---------------- TKP: skenario, tiap opsi bernilai 1-5 ---------------- */
/* o: [teks, skor]. Skor 5 = sikap paling sesuai nilai ASN. */
export const BANK_TKP = [
  { t: 'Seorang warga datang ke kantor dengan marah-marah karena urusannya belum selesai. Sebagai petugas, yang sebaiknya dilakukan adalah …',
    o: [['Mendengarkan keluhannya dengan tenang, lalu menjelaskan status urusannya dan langkah berikutnya', 5], ['Meminta warga menunggu dan memanggil atasan untuk menanganinya', 4], ['Menjelaskan bahwa keterlambatan bukan kesalahan Anda', 3], ['Meminta warga tidak marah-marah di kantor', 2], ['Mengabaikannya sampai ia tenang sendiri', 1]],
    b: 'Pelayanan publik yang baik dimulai dari mendengarkan, lalu memberi kejelasan dan solusi.' },
  { t: 'Rekan satu tim sering menyerahkan pekerjaannya kepada Anda karena ia kewalahan. Sikap Anda …',
    o: [['Membantunya sambil mengusulkan pembagian tugas yang lebih adil kepada atasan', 5], ['Membantunya selama pekerjaan sendiri tidak terganggu', 4], ['Menolak dengan halus karena itu bukan tugas Anda', 3], ['Membantu sekali ini saja, lalu tidak lagi', 2], ['Melaporkannya ke atasan tanpa bicara dengannya dulu', 1]],
    b: 'Kerja tim berarti saling membantu, tapi beban yang tidak adil perlu dibicarakan secara terbuka.' },
  { t: 'Anda menemukan kesalahan pada laporan yang sudah ditandatangani atasan dan akan dikirim hari ini. Yang Anda lakukan …',
    o: [['Segera memberi tahu atasan tentang kesalahan itu beserta perbaikannya', 5], ['Memperbaiki laporan diam-diam sebelum dikirim', 4], ['Membiarkannya karena sudah ditandatangani', 3], ['Memberi tahu atasan besok setelah laporan terkirim', 2], ['Menyalahkan bagian yang membuat laporan', 1]],
    b: 'Integritas berarti berani menyampaikan kesalahan, apalagi bila masih bisa diperbaiki.' },
  { t: 'Atasan memberi tugas baru yang belum pernah Anda kerjakan dengan tenggat ketat. Respons Anda …',
    o: [['Mempelajari tugas itu, menyusun rencana kerja, dan bertanya bila ada yang belum jelas', 5], ['Menerima tugas itu dan mengerjakannya sebisanya', 4], ['Meminta atasan menunjuk orang lain yang lebih berpengalaman', 3], ['Menerima tapi mengerjakan seadanya karena waktunya mepet', 2], ['Menolak karena di luar tugas pokok Anda', 1]],
    b: 'Orientasi hasil berarti menerima tantangan, belajar, dan tetap bertanya bila perlu.' },
  { t: 'Dalam rapat, pendapat Anda ditolak mentah-mentah oleh rekan yang lebih senior. Sikap Anda …',
    o: [['Menerima keputusan rapat dan menyampaikan data pendukung bila ada kesempatan berikutnya', 5], ['Menerima keputusan rapat tanpa protes', 4], ['Mempertahankan pendapat sampai rapat selesai', 3], ['Diam dan tidak lagi mengusulkan pendapat', 2], ['Menyampaikan kekecewaan kepada rekan lain di luar rapat', 1]],
    b: 'Pendapat boleh berbeda, tapi keputusan rapat dihormati dan perbedaan disampaikan dengan data, bukan emosi.' },
  { t: 'Anda ditawari imbalan oleh warga agar urusannya dipercepat. Yang Anda lakukan …',
    o: [['Menolak dengan sopan dan menjelaskan bahwa semua urusan diproses sesuai antrean', 5], ['Menolak imbalan itu', 4], ['Menerima imbalan tapi tetap memproses sesuai antrean', 2], ['Menerima imbalan karena warga memberinya dengan sukarela', 1], ['Menerima imbalan dan mempercepat urusannya', 1]],
    b: 'Menolak gratifikasi adalah kewajiban ASN. Penolakan yang sopan disertai penjelasan adalah sikap terbaik.' },
  { t: 'Sistem kerja di kantor berubah ke aplikasi baru dan banyak rekan kesulitan. Anda yang sudah memahaminya sebaiknya …',
    o: [['Membantu rekan belajar dan membuat panduan singkat yang mudah diikuti', 5], ['Membantu rekan yang bertanya kepada Anda', 4], ['Menyarankan rekan membaca panduan resminya', 3], ['Fokus pada pekerjaan sendiri karena bukan tugas Anda mengajari', 2], ['Mengeluh bahwa aplikasi baru menyusahkan', 1]],
    b: 'Adaptasi terhadap perubahan lebih cepat bila yang sudah paham ikut membantu yang belum.' },
  { t: 'Tenggat laporan tinggal dua hari, tetapi data dari unit lain belum masuk. Yang Anda lakukan …',
    o: [['Menghubungi unit terkait, menyiapkan draf dari data yang ada, dan memberi tahu atasan soal risikonya', 5], ['Menghubungi unit terkait dan menunggu datanya', 4], ['Menunggu sampai data masuk tanpa menghubungi siapa pun', 3], ['Mengirim laporan apa adanya tanpa penjelasan', 2], ['Menyalahkan unit lain bila laporan terlambat', 1]],
    b: 'Tanggung jawab berarti proaktif mengejar data, menyiapkan rencana cadangan, dan memberi kabar lebih awal.' },
  { t: 'Rekan kerja bercerita bahwa ia ingin mengundurkan diri karena merasa tidak dihargai. Sikap Anda …',
    o: [['Mendengarkan keluhannya dan menyarankan ia membicarakan dengan atasan sebelum memutuskan', 5], ['Mendengarkan dan memberi semangat', 4], ['Menyarankan ia bertahan karena mencari kerja itu sulit', 3], ['Tidak ikut campur karena itu urusan pribadinya', 2], ['Menceritakan rencananya kepada rekan lain', 1]],
    b: 'Empati berarti mendengarkan dan membantu rekan mengambil keputusan dengan kepala dingin.' },
  { t: 'Anda diminta menggantikan rekan yang sakit untuk memimpin presentasi di depan pimpinan dalam waktu satu jam. Sikap Anda …',
    o: [['Menyiapkan materi secepatnya, memahami poin utama, dan menyampaikan dengan percaya diri', 5], ['Menerima dan menyampaikan materi seadanya', 4], ['Meminta pimpinan menunda presentasi', 3], ['Menolak karena bukan bidang Anda', 2], ['Menerima tapi menyampaikan bahwa Anda tidak siap di depan pimpinan', 1]],
    b: 'Kesiapan menghadapi tugas mendadak adalah bagian dari profesionalisme.' },
  { t: 'Warga meminta informasi yang sebenarnya rahasia jabatan. Yang Anda lakukan …',
    o: [['Menolak dengan sopan, menjelaskan bahwa informasi itu tidak bisa dibagikan, dan mengarahkan ke informasi yang boleh diakses publik', 5], ['Menolak memberikan informasi itu', 4], ['Memberikan sebagian informasi yang dirasa tidak berbahaya', 2], ['Memberikan informasi karena warga berhak tahu', 1], ['Mengabaikan permintaan warga', 1]],
    b: 'Kerahasiaan jabatan dijaga, tapi warga tetap dilayani dengan informasi yang memang boleh diakses.' },
  { t: 'Dalam tim, ada anggota yang selalu datang terlambat ke rapat sehingga pekerjaan tertunda. Sikap Anda …',
    o: [['Membicarakan dampaknya secara pribadi dan mencari solusi bersama', 5], ['Mengusulkan aturan rapat yang disepakati bersama', 4], ['Menegurnya di depan anggota tim lain', 2], ['Membiarkannya karena bukan wewenang Anda', 3], ['Melaporkan ke atasan tanpa bicara dengannya', 2]],
    b: 'Masalah perilaku sebaiknya dibicarakan langsung dan solutif, bukan dipermalukan atau dibiarkan.' },
  { t: 'Anda menemukan cara kerja yang lebih cepat, tetapi berbeda dari prosedur yang selama ini dipakai. Yang Anda lakukan …',
    o: [['Mengusulkan cara baru itu kepada atasan beserta bukti efisiensinya', 5], ['Memakai cara baru untuk pekerjaan sendiri', 3], ['Tetap memakai cara lama karena sudah menjadi kebiasaan', 3], ['Mengajak rekan memakai cara baru tanpa izin atasan', 2], ['Menyimpan cara itu untuk diri sendiri', 1]],
    b: 'Inovasi perlu diusulkan lewat jalur yang benar, disertai bukti, bukan dijalankan diam-diam.' },
  { t: 'Tugas dari atasan bertabrakan dengan janji Anda kepada warga yang sudah menunggu. Yang Anda prioritaskan …',
    o: [['Menyelesaikan janji kepada warga, lalu memberi tahu atasan dan mengerjakan tugasnya setelahnya', 5], ['Mengerjakan tugas atasan dulu, lalu menghubungi warga', 4], ['Meminta rekan menggantikan salah satunya', 4], ['Membatalkan janji kepada warga tanpa kabar', 1], ['Mengerjakan keduanya setengah-setengah', 2]],
    b: 'Janji pelayanan kepada warga yang sudah menunggu perlu ditepati, sambil memberi kabar kepada atasan.' },
  { t: 'Setelah bekerja lembur berhari-hari, Anda merasa lelah dan mulai sering salah. Yang sebaiknya dilakukan …',
    o: [['Mengatur ulang prioritas, beristirahat cukup, dan memberi tahu atasan bila beban perlu dibagi', 5], ['Tetap bekerja lembur sampai semua selesai', 3], ['Mengurangi kualitas pekerjaan supaya cepat selesai', 1], ['Mengambil cuti mendadak tanpa serah terima', 2], ['Mengerjakan tugas sambil mengeluh kepada rekan', 1]],
    b: 'Menjaga kualitas kerja berarti mengelola beban dan beristirahat, bukan memaksakan diri sampai salah terus.' },
];

/* ---------------- Penyusunan paket soal ---------------- */
export function susunPaket() {
  const twk = kocok(BANK_TWK).slice(0, JUMLAH_SOAL.TWK).map((s) => {
    const opsi = kocok(s.o.map((teks, i) => ({ teks, benar: i === s.k })));
    return { sub: 'TWK', t: s.t, o: opsi.map((x) => x.teks), k: opsi.findIndex((x) => x.benar), b: s.b };
  });
  const tiu = Array.from({ length: JUMLAH_SOAL.TIU }, () => { const s = buatSoalTIU(); return { sub: 'TIU', t: s.t, o: s.o, k: s.k, b: s.b }; });
  const tkp = kocok(BANK_TKP).slice(0, JUMLAH_SOAL.TKP).map((s) => {
    const opsi = kocok(s.o.map(([teks, skor]) => ({ teks, skor })));
    return { sub: 'TKP', t: s.t, o: opsi.map((x) => x.teks), skor: opsi.map((x) => x.skor), b: s.b };
  });
  return twk.concat(tiu, tkp);
}

export function skorJawaban(soal, jawabIdx) {
  if (jawabIdx == null) return 0;
  if (soal.sub === 'TKP') return soal.skor[jawabIdx] || 0;
  return jawabIdx === soal.k ? 5 : 0;
}

const HURUF = ['A', 'B', 'C', 'D', 'E'];
const fmtWaktu = (s) => String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');

export function render(root) {
  let paket = null, jawaban = [], idx = 0, sisa = DURASI_MENIT * 60, iv = null, selesai = false;
  const layar = T.el('<div></div>');
  root.appendChild(layar);
  T.onLeave(() => { if (iv) clearInterval(iv); });

  const tampilMulai = () => {
    T.show(layar,
      '<p class="note" style="border-color:#facc15;background:rgba(250,204,21,.08)">Soal latihan yang dibuat untuk belajar, BUKAN soal resmi BKN. TWK dari materi kewarganegaraan umum, TIU dari generator pola, TKP dari skenario sikap kerja.</p>' +
      '<p class="hint">Simulasi singkat 30 soal (10 TWK, 10 TIU, 10 TKP) dalam 30 menit. Penilaian mengikuti aturan SKD: TWK dan TIU benar bernilai 5, TKP tiap pilihan bernilai 1 sampai 5.</p>' +
      '<div class="kv"><span class="k">Passing grade resmi (110 soal)</span><span class="v">TWK 65 · TIU 80 · TKP 166</span></div>' +
      '<div class="kv"><span class="k">Ambang simulasi ini (30 soal)</span><span class="v">TWK ' + pgProporsional('TWK') + ' · TIU ' + pgProporsional('TIU') + ' · TKP ' + pgProporsional('TKP') + ' (disetarakan)</span></div>' +
      '<p class="hint">Ambang simulasi dihitung proporsional dari passing grade resmi KepmenPAN-RB No. 321 Tahun 2024. Hasil di sini untuk mengukur kesiapan, bukan penentu kelulusan.</p>');
    const mulai = T.btn('Mulai simulasi', () => {
      paket = susunPaket();
      jawaban = new Array(paket.length).fill(null);
      idx = 0; sisa = DURASI_MENIT * 60; selesai = false;
      iv = setInterval(() => {
        sisa--;
        const tEl = layar.querySelector('[data-timer]');
        if (tEl) tEl.textContent = '⏱ ' + fmtWaktu(Math.max(0, sisa));
        if (sisa <= 0) { clearInterval(iv); iv = null; akhiri(true); }
      }, 1000);
      tampilSoal();
    }, true);
    layar.appendChild(T.row(mulai));
  };

  const tampilSoal = () => {
    const s = paket[idx];
    const total = paket.length;
    const sudah = jawaban.filter((j) => j != null).length;
    T.show(layar, '');
    const atas = T.el(
      '<div><div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:8px">' +
      '<span class="dim" style="font-size:13px">Soal ' + (idx + 1) + ' dari ' + total + ' · ' + s.sub + ' · terjawab ' + sudah + '</span>' +
      '<span data-timer style="font-variant-numeric:tabular-nums;font-weight:700">⏱ ' + fmtWaktu(sisa) + '</span></div>' +
      '<div style="height:6px;border-radius:3px;background:rgba(255,255,255,.1);margin-bottom:14px"><div style="height:100%;width:' + Math.round(sudah / total * 100) + '%;border-radius:3px;background:#fff"></div></div>' +
      '<p style="font-size:15px;line-height:1.6;margin:0 0 12px">' + T.esc(s.t) + '</p></div>');
    layar.appendChild(atas);
    const opsiBox = T.el('<div style="display:flex;flex-direction:column;gap:8px"></div>');
    s.o.forEach((teks, i) => {
      const b = T.el('<button type="button" class="btn" style="text-align:left;justify-content:flex-start;white-space:normal;height:auto;min-height:44px;line-height:1.5"></button>');
      b.textContent = HURUF[i] + '. ' + teks;
      if (jawaban[idx] === i) b.classList.add('primary');
      b.addEventListener('click', () => { jawaban[idx] = i; tampilSoal(); });
      opsiBox.appendChild(b);
    });
    layar.appendChild(opsiBox);
    const nav = T.el('<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:14px"></div>');
    const prev = T.btn('← Sebelumnya', () => { if (idx > 0) { idx--; tampilSoal(); } });
    const next = T.btn(idx === total - 1 ? 'Ke hasil' : 'Berikutnya →', () => {
      if (idx < total - 1) { idx++; tampilSoal(); } else akhiri(false);
    }, true);
    if (idx === 0) prev.disabled = true;
    nav.appendChild(prev);
    nav.appendChild(next);
    nav.appendChild(T.btn('Selesai dan lihat hasil', () => akhiri(false)));
    layar.appendChild(nav);
    const grid = T.el('<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:14px"></div>');
    paket.forEach((p, i) => {
      const g = T.el('<button type="button" class="btn" style="min-width:38px;min-height:38px;padding:4px;font-size:12px"></button>');
      g.textContent = (i + 1);
      if (i === idx) g.classList.add('primary');
      else if (jawaban[i] != null) g.style.opacity = '1';
      else g.style.opacity = '.45';
      g.addEventListener('click', () => { idx = i; tampilSoal(); });
      grid.appendChild(g);
    });
    layar.appendChild(grid);
  };

  const akhiri = (habisWaktu) => {
    if (selesai) return;
    selesai = true;
    if (iv) { clearInterval(iv); iv = null; }
    const skor = { TWK: 0, TIU: 0, TKP: 0 };
    paket.forEach((s, i) => { skor[s.sub] += skorJawaban(s, jawaban[i]); });
    const total = skor.TWK + skor.TIU + skor.TKP;
    const lolos = (sub) => skor[sub] >= pgProporsional(sub);
    const semuaLolos = lolos('TWK') && lolos('TIU') && lolos('TKP');
    let html = '<div class="center"><div class="dim">Nilai total</div><div class="big">' + total + ' / 150</div>' +
      '<p style="font-size:15px;font-weight:700;color:' + (semuaLolos ? '#4ade80' : '#f87171') + '">' +
      (semuaLolos ? 'Melewati ambang simulasi di ketiga subtes.' : 'Belum melewati ambang di semua subtes.') + '</p></div>' +
      (habisWaktu ? '<p class="warn">Waktu habis, jawaban dikumpulkan otomatis.</p>' : '');
    ['TWK', 'TIU', 'TKP'].forEach((sub) => {
      html += kv(sub + ': ' + skor[sub] + ' / ' + (JUMLAH_SOAL[sub] * 5),
        '<b style="color:' + (lolos(sub) ? '#4ade80' : '#f87171') + '">' + (lolos(sub) ? 'Lolos' : 'Belum lolos') +
        '</b> (ambang ' + pgProporsional(sub) + ', resmi ' + PG_RESMI[sub] + ' dari ' + PG_MAKS_RESMI[sub] + ')');
    });
    html += '<p class="hint">Ambang simulasi disetarakan dari passing grade resmi untuk 30 soal. Di ujian asli ada 110 soal dan ambang resminya TWK 65, TIU 80, TKP 166.</p>';
    html += '<h3 class="h3" style="margin-top:18px">Pembahasan</h3>';
    paket.forEach((s, i) => {
      const j = jawaban[i];
      const poin = skorJawaban(s, j);
      let ket;
      if (s.sub === 'TKP') {
        ket = j == null ? 'Tidak dijawab (0 poin).' : 'Pilihanmu bernilai ' + poin + ' dari 5.';
      } else {
        ket = j == null ? 'Tidak dijawab.' : (j === s.k ? 'Benar (+5).' : 'Kurang tepat. Jawaban benar: ' + HURUF[s.k] + '.');
      }
      html += '<div style="border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:12px;margin-bottom:10px">' +
        '<p style="font-size:13px;margin:0 0 4px"><b>Soal ' + (i + 1) + ' · ' + s.sub + '</b> · ' + T.esc(ket) + '</p>' +
        '<p style="font-size:14px;line-height:1.6;margin:0 0 6px">' + T.esc(s.t) + '</p>' +
        '<p class="dim" style="font-size:13px;line-height:1.6;margin:0">' + T.esc(s.b) + '</p></div>';
    });
    T.show(layar, html);
    layar.appendChild(T.row(T.btn('Coba lagi (soal baru)', tampilMulai, true)));
  };

  tampilMulai();
}
