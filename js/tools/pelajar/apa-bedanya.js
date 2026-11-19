import { h as T } from '../../core.js';

export const meta = { id: 'apa-bedanya', name: 'Apa Bedanya?', cat: 'pelajar', icon: '⚖️', desc: 'Penjelasan singkat perbedaan dua hal yang sering tertukar di pelajaran sekolah.', keywords: 'apa bedanya,perbedaan,beda,tertukar,banding,belajar,sekolah', since: '6.19.0' };

// Bank pasangan yang sering tertukar, ditulis dengan bahasa sehari-hari.
// Tiap pasangan: a, b, inti (satu kalimat), jelas (penjelasan singkat),
// contoh (contoh yang membedakan).
export const PASANGAN = [
  { a: 'FPB', b: 'KPK', inti: 'FPB itu pembagi terbesar yang sama, KPK itu kelipatan terkecil yang sama.', jelas: 'FPB dipakai saat membagi rata (misal membagi permen ke beberapa anak sama banyak). KPK dipakai saat mencari waktu bertemu lagi (misal dua lampu berkedip bersama).', contoh: 'FPB dari 12 dan 18 adalah 6. KPK dari 12 dan 18 adalah 36.' },
  { a: 'Permutasi', b: 'Kombinasi', inti: 'Permutasi peduli urutan, kombinasi tidak.', jelas: 'Memilih juara 1, 2, 3 itu permutasi karena urutannya penting. Memilih 3 orang untuk satu tim itu kombinasi karena siapa pun yang dipilih, timnya sama.', contoh: 'P(5,2) = 20, C(5,2) = 10. Permutasi selalu lebih banyak karena tiap susunan dihitung beda.' },
  { a: 'Fotosintesis', b: 'Respirasi', inti: 'Fotosintesis membuat makanan dari cahaya, respirasi membakar makanan jadi energi.', jelas: 'Fotosintesis terjadi di daun pada siang hari dan menghasilkan oksigen. Respirasi terjadi di semua makhluk hidup sepanjang waktu dan menghasilkan karbon dioksida.', contoh: 'Tumbuhan berfotosintesis di siang hari, tapi juga bernapas (respirasi) siang dan malam.' },
  { a: 'Mean', b: 'Median', inti: 'Mean itu rata-rata hitung, median itu nilai tengah setelah diurutkan.', jelas: 'Mean bisa ketarik nilai ekstrem. Median lebih aman kalau ada satu nilai yang jauh dari yang lain.', contoh: 'Nilai 5, 6, 7, 8, 100: mean-nya 25,2 tapi median-nya 7. Median lebih mewakili nilai kebanyakan.' },
  { a: 'Massa', b: 'Berat', inti: 'Massa itu jumlah zat dalam benda, berat itu gaya tarik bumi pada benda itu.', jelas: 'Massa tidak berubah di mana pun. Berat berubah mengikuti gravitasi: di Bulan beratmu seperenam berat di Bumi, tapi massamu tetap.', contoh: 'Massa 60 kg di Bumi tetap 60 kg di Bulan, tapi beratnya turun dari 600 N jadi 100 N.' },
  { a: 'Kecepatan', b: 'Percepatan', inti: 'Kecepatan itu seberapa cepat bergerak, percepatan itu seberapa cepat kecepatannya berubah.', jelas: 'Mobil melaju 60 km/jam punya kecepatan 60 km/jam. Kalau dalam 5 detik kecepatannya naik jadi 80 km/jam, mobil itu mengalami percepatan.', contoh: 'Percepatan 0 bukan berarti diam, bisa juga berarti kecepatannya tetap.' },
  { a: 'Panas', b: 'Suhu', inti: 'Suhu itu ukuran seberapa panas dinginnya benda, panas itu energi yang pindah karena beda suhu.', jelas: 'Suhu diukur dengan termometer dalam derajat. Panas mengalir dari benda bersuhu tinggi ke benda bersuhu rendah.', contoh: 'Air 80°C punya suhu 80 derajat. Saat dituang ke gelas dingin, panas berpindah dari air ke gelas.' },
  { a: 'Atom', b: 'Molekul', inti: 'Atom itu satuan terkecil dari unsur, molekul itu gabungan dua atom atau lebih yang terikat.', jelas: 'Oksigen sebagai unsur ditulis O (satu atom). Oksigen yang kita hirup adalah O2, satu molekul berisi dua atom oksigen.', contoh: 'Air (H2O) adalah molekul yang terdiri dari 2 atom hidrogen dan 1 atom oksigen.' },
  { a: 'Unsur', b: 'Senyawa', inti: 'Unsur hanya berisi satu jenis atom, senyawa berisi dua jenis atom atau lebih yang terikat kimia.', jelas: 'Besi (Fe) dan oksigen (O) adalah unsur. Air (H2O) adalah senyawa karena hidrogen dan oksigen terikat jadi zat baru.', contoh: 'Garam dapur (NaCl) adalah senyawa dari natrium dan klorin, dua unsur yang berbahaya kalau sendiri-sendiri.' },
  { a: 'Sel Hewan', b: 'Sel Tumbuhan', inti: 'Sel tumbuhan punya dinding sel, kloroplas, dan vakuola besar; sel hewan tidak.', jelas: 'Dinding sel membuat tumbuhan kaku dan tegak. Kloroplas tempat fotosintesis. Vakuola besar menyimpan air dan zat lain.', contoh: 'Daun berwarna hijau karena kloroplas di selnya. Sel kulit manusia tidak punya kloroplas.' },
  { a: 'Mitosis', b: 'Meiosis', inti: 'Mitosis menghasilkan 2 sel sama persis untuk tumbuh, meiosis menghasilkan 4 sel beda untuk reproduksi.', jelas: 'Mitosis dipakai tubuh untuk tumbuh dan memperbaiki luka. Meiosis dipakai untuk membuat sel kelamin (sperma/sel telur) dengan setengah jumlah kromosom.', contoh: 'Kulit yang luka sembuh lewat mitosis. Anak mewarisi sifat dari dua orang tua lewat meiosis.' },
  { a: 'DNA', b: 'RNA', inti: 'DNA itu arsip permanen sifat makhluk hidup, RNA itu salinan kerja yang dipakai untuk membuat protein.', jelas: 'DNA berbentuk tangga ganda dan tinggal di inti sel. RNA berbentuk untai tunggal dan bergerak ke tempat protein dibuat.', contoh: 'DNA menyimpan resepnya, RNA mengantar resep itu ke dapur (ribosom) untuk dimasak jadi protein.' },
  { a: 'Gaya', b: 'Tekanan', inti: 'Gaya itu dorongan atau tarikan, tekanan itu gaya yang dibagi luas bidang yang ditekan.', jelas: 'Gaya yang sama bisa terasa beda: jarum menusuk karena gayanya terkumpul di ujung yang kecil, jadi tekanannya besar.', contoh: 'Berdiri dengan satu kaki tekanannya lebih besar daripada berdiri dua kaki, karena luas pijakannya lebih kecil.' },
  { a: 'Energi Kinetik', b: 'Energi Potensial', inti: 'Energi kinetik dimiliki benda yang bergerak, energi potensial dimiliki benda karena posisinya.', jelas: 'Bola yang menggelinding punya energi kinetik. Bola yang dipegang di atas tangga punya energi potensial, dan berubah jadi kinetik saat dijatuhkan.', contoh: 'Air di bendungan punya energi potensial. Saat dialirkan ke bawah, berubah jadi energi kinetik yang memutar turbin.' },
  { a: 'Asam', b: 'Basa', inti: 'Asam rasanya masam dan pH di bawah 7, basa rasanya pahit licin dan pH di atas 7.', jelas: 'Asam melepaskan ion H+ dalam air, basa melepaskan ion OH-. Keduanya saling menetralkan kalau dicampur.', contoh: 'Cuka dan jeruk nipis itu asam. Sabun dan air kapur itu basa.' },
  { a: 'Zat Murni', b: 'Campuran', inti: 'Zat murni hanya berisi satu jenis zat, campuran berisi dua zat atau lebih yang tercampur tanpa ikatan kimia.', jelas: 'Zat murni punya sifat tetap (titik didihnya pasti). Campuran bisa dipisahkan dengan cara fisika seperti menyaring atau menguapkan.', contoh: 'Air suling itu zat murni. Air laut itu campuran air dan garam, garamnya bisa didapat lagi dengan menguapkan airnya.' },
  { a: 'Konduktor', b: 'Isolator', inti: 'Konduktor mudah menghantarkan listrik atau panas, isolator sulit.', jelas: 'Logam seperti tembaga dan besi adalah konduktor. Kayu, plastik, dan karet adalah isolator.', contoh: 'Kabel memakai tembaga di dalam (konduktor) dan plastik di luar (isolator) supaya aman dipegang.' },
  { a: 'Rangkaian Seri', b: 'Rangkaian Paralel', inti: 'Di rangkaian seri arus hanya punya satu jalan, di paralel arusnya bercabang.', jelas: 'Di seri, kalau satu lampu mati semua ikut mati dan lampunya lebih redup. Di paralel, tiap lampu dapat tegangan penuh dan tetap menyala walau yang lain mati.', contoh: 'Lampu rumah dipasang paralel, jadi satu lampu mati tidak mematikan lampu lain.' },
  { a: 'Bilangan Prima', b: 'Bilangan Komposit', inti: 'Bilangan prima hanya bisa dibagi 1 dan dirinya sendiri, bilangan komposit punya pembagi lain.', jelas: 'Bilangan 1 bukan prima dan bukan komposit. Bilangan 2 adalah satu-satunya bilangan prima yang genap.', contoh: '7, 11, 13 itu prima. 9 itu komposit karena bisa dibagi 3. 15 komposit karena bisa dibagi 3 dan 5.' },
  { a: 'Rasio', b: 'Pecahan', inti: 'Rasio membandingkan dua jumlah, pecahan menyatakan bagian dari satu keseluruhan.', jelas: 'Rasio 2:3 artinya untuk tiap 2 bagian A ada 3 bagian B. Pecahan 2/3 artinya 2 bagian dari 3 bagian yang sama besar.', contoh: 'Rasio anak laki-laki dan perempuan 2:3. Pecahan anak laki-laki dari semua anak adalah 2/5.' },
  { a: 'Luas', b: 'Keliling', inti: 'Luas itu isi permukaan di dalam bangun, keliling itu panjang garis pinggirnya.', jelas: 'Luas diukur dalam satuan persegi (cm²). Keliling diukur dalam satuan panjang (cm).', contoh: 'Persegi 4 cm × 4 cm: luasnya 16 cm², kelilingnya 16 cm. Angkanya kebetulan sama, artinya beda.' },
  { a: 'Volume', b: 'Luas Permukaan', inti: 'Volume itu isi ruang di dalam bangun, luas permukaan itu luas seluruh sisi luarnya.', jelas: 'Volume diukur dalam satuan kubik (cm³). Luas permukaan dalam satuan persegi (cm²).', contoh: 'Kubus 2 cm: volumenya 8 cm³, luas permukaannya 24 cm² (6 sisi × 4 cm²).' },
  { a: 'Fakta', b: 'Opini', inti: 'Fakta bisa dibuktikan benar atau salah, opini adalah pendapat yang tidak bisa dibuktikan.', jelas: 'Fakta didukung data dan bisa dicek siapa pun. Opini memakai kata seperti "menurutku", "terbaik", "seharusnya".', contoh: '"Air mendidih pada 100°C" itu fakta. "Es teh lebih enak daripada es jeruk" itu opini.' },
  { a: 'Puisi', b: 'Prosa', inti: 'Puisi ditulis dalam baris-baris dengan irama, prosa ditulis dalam kalimat dan paragraf biasa.', jelas: 'Puisi memakai bahasa kias dan rima. Prosa memakai bahasa sehari-hari, seperti di novel dan berita.', contoh: '"Aku ini binatang jalang" itu baris puisi Chairil Anwar. Kalimat ini yang kamu baca adalah prosa.' },
  { a: 'Sinonim', b: 'Antonim', inti: 'Sinonim itu kata yang artinya sama atau mirip, antonim itu kata yang artinya berlawanan.', jelas: 'Sinonim dipakai supaya tulisan tidak mengulang kata yang sama. Antonim dipakai untuk kontras.', contoh: 'Sinonim "besar": raksasa, jumbo. Antonim "besar": kecil, mungil.' },
  { a: 'Kalimat Aktif', b: 'Kalimat Pasif', inti: 'Di kalimat aktif pelaku jadi subjek, di kalimat pasif yang dikenai perbuatan jadi subjek.', jelas: 'Aktif memakai awalan me-. Pasif memakai awalan di- atau ter-.', contoh: 'Aktif: "Andi menendang bola." Pasif: "Bola ditendang Andi." Artinya sama, fokusnya beda.' },
  { a: 'Kata Baku', b: 'Kata Tidak Baku', inti: 'Kata baku sesuai kaidah bahasa Indonesia resmi, kata tidak baku tidak.', jelas: 'Kata baku dipakai di tulisan resmi dan ujian. Kata tidak baku sering dipakai di percakapan sehari-hari.', contoh: 'Baku: "apotek", "nasihat", "mengubah". Tidak baku: "apotik", "nasehat", "merubah".' },
  { a: 'Imigrasi', b: 'Emigrasi', inti: 'Imigrasi itu masuk ke suatu negara untuk menetap, emigrasi itu keluar dari negara asal untuk menetap di negara lain.', jelas: 'Dilihat dari negara tujuan, orang itu imigran. Dilihat dari negara asal, orang itu emigran.', contoh: 'Orang Indonesia pindah ke Kanada: bagi Kanada dia imigran, bagi Indonesia dia emigran.' },
  { a: 'Ekspor', b: 'Impor', inti: 'Ekspor itu menjual barang ke luar negeri, impor itu membeli barang dari luar negeri.', jelas: 'Ekspor mendatangkan uang dari luar. Impor mengeluarkan uang ke luar.', contoh: 'Indonesia mengekspor kopi dan mengimpor gandum.' },
  { a: 'Inflasi', b: 'Deflasi', inti: 'Inflasi itu harga-harga naik terus, deflasi itu harga-harga turun terus.', jelas: 'Inflasi membuat uang yang sama bisa membeli lebih sedikit barang. Deflasi sebaliknya, tapi deflasi yang lama bisa membuat orang menunda belanja.', contoh: 'Harga cabai naik dari Rp20.000 jadi Rp30.000 per kg itu contoh inflasi pada satu barang.' },
  { a: 'Pajak', b: 'Retribusi', inti: 'Pajak dibayar tanpa imbalan langsung yang jelas, retribusi dibayar untuk layanan tertentu yang langsung dipakai.', jelas: 'Pajak dipakai negara untuk semua keperluan umum. Retribusi dibayar saat memakai layanan, misal parkir atau pasar.', contoh: 'PPh dan PPN itu pajak. Uang parkir di tempat umum dan karcis masuk pasar itu retribusi.' },
  { a: 'Habitat', b: 'Ekosistem', inti: 'Habitat itu tempat tinggal satu jenis makhluk hidup, ekosistem itu seluruh hubungan makhluk hidup dan lingkungannya di satu tempat.', jelas: 'Habitat menjawab "di mana ia tinggal". Ekosistem menjawab "apa saja yang saling berhubungan di sana".', contoh: 'Habitat ikan adalah air. Ekosistem kolam meliputi ikan, tumbuhan air, bakteri, air, dan cahaya matahari.' },
  { a: 'Rantai Makanan', b: 'Jaring-jaring Makanan', inti: 'Rantai makanan itu satu jalur makan-dimakan, jaring-jaring makanan itu gabungan banyak rantai yang saling berhubungan.', jelas: 'Di alam, satu hewan biasanya makan lebih dari satu jenis makanan, jadi jaring-jaring lebih menggambarkan keadaan sebenarnya.', contoh: 'Rantai: rumput → belalang → katak → ular. Jaring-jaring: ular juga makan tikus, katak juga makan lalat.' },
  { a: 'Produsen', b: 'Konsumen', inti: 'Produsen membuat makanannya sendiri, konsumen makan makhluk hidup lain.', jelas: 'Produsen hampir selalu tumbuhan dan alga yang berfotosintesis. Konsumen meliputi hewan pemakan tumbuhan, pemakan daging, dan pemakan keduanya.', contoh: 'Padi itu produsen. Tikus yang makan padi itu konsumen tingkat pertama, ular yang makan tikus konsumen tingkat kedua.' },
  { a: 'Rotasi Bumi', b: 'Revolusi Bumi', inti: 'Rotasi itu Bumi berputar pada porosnya, revolusi itu Bumi mengelilingi Matahari.', jelas: 'Rotasi menyebabkan siang dan malam (24 jam). Revolusi menyebabkan pergantian musim dan tahun (365 hari).', contoh: 'Siang dan malam berganti karena rotasi. Musim hujan dan kemarau berganti karena revolusi dan kemiringan poros Bumi.' },
  { a: 'Gerhana Matahari', b: 'Gerhana Bulan', inti: 'Gerhana Matahari terjadi saat Bulan menutupi Matahari, gerhana Bulan terjadi saat Bumi menutupi Bulan.', jelas: 'Gerhana Matahari terjadi pada siang hari saat bulan baru. Gerhana Bulan terjadi pada malam hari saat bulan purnama.', contoh: 'Gerhana Matahari hanya terlihat di wilayah sempit. Gerhana Bulan bisa dilihat dari seluruh sisi Bumi yang sedang malam.' },
  { a: 'Besaran Skalar', b: 'Besaran Vektor', inti: 'Skalar hanya punya nilai, vektor punya nilai dan arah.', jelas: 'Suhu, massa, dan waktu adalah skalar. Kecepatan, gaya, dan perpindahan adalah vektor.', contoh: '"Jaraknya 5 km" itu skalar. "Berpindah 5 km ke utara" itu vektor karena ada arahnya.' },
  { a: 'Arus AC', b: 'Arus DC', inti: 'Arus AC bolak-balik arahnya, arus DC mengalir satu arah saja.', jelas: 'Listrik di rumah adalah AC. Baterai dan aki menghasilkan DC.', contoh: 'Colokan di dinding mengalirkan AC 220 volt. Baterai HP mengalirkan DC, makanya charger mengubah AC jadi DC.' },
];

export function cariPasangan(kata) {
  const k = String(kata || '').trim().toLowerCase();
  if (!k) return PASANGAN.slice();
  return PASANGAN.filter((p) =>
    (p.a + ' ' + p.b + ' ' + p.inti + ' ' + p.jelas).toLowerCase().includes(k));
}

export function render(root) {
  root.appendChild(T.el('<p class="hint">Ketik kata yang membingungkan, atau pilih pasangan di bawah. Penjelasannya singkat dan pakai contoh.</p>'));

  const cariI = T.input('text', 'cth: fotosintesis, pajak, prima', '');
  const daftar = T.el('<div style="display:flex;flex-wrap:wrap;gap:8px;margin:12px 0"></div>');
  const box = T.out();

  function tampilPasangan(p) {
    T.show(box,
      '<p class="big">' + T.esc(p.a) + ' vs ' + T.esc(p.b) + '</p>' +
      '<p><b>' + T.esc(p.inti) + '</b></p>' +
      '<p>' + T.esc(p.jelas) + '</p>' +
      '<p class="hint">Contoh: ' + T.esc(p.contoh) + '</p>');
  }

  function gambarDaftar() {
    const hasil = cariPasangan(cariI.value);
    daftar.innerHTML = '';
    if (hasil.length === 0) {
      daftar.appendChild(T.el('<p class="dim">Tidak ada pasangan yang cocok. Coba kata lain, misal "pajak" atau "prima".</p>'));
      return;
    }
    hasil.forEach((p) => {
      const b = T.btn(p.a + ' vs ' + p.b, () => tampilPasangan(p));
      daftar.appendChild(b);
    });
  }

  cariI.addEventListener('input', gambarDaftar);
  root.append(T.field('Cari', cariI), daftar, box);
  gambarDaftar();
  tampilPasangan(PASANGAN[0]);
}
