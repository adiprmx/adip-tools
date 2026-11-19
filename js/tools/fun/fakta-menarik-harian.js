import { h as T } from '../../core.js';

// Fakta Menarik Harian: satu fakta baru setiap hari, dipilih secara
// deterministik dari daftar (hari yang sama selalu dapat fakta yang sama).
// Tiap fakta punya sumber yang bisa dicek. Tidak ada fakta karangan:
// bila ragu, fakta tidak masuk daftar.
export const meta = {"id": "fakta-menarik-harian", "name": "Fakta Menarik Harian", "cat": "fun", "icon": "💡", "desc": "Satu fakta menarik baru setiap hari, lengkap dengan sumbernya.", "keywords": "fakta menarik,fakta harian,fakta unik,trivia,pengetahuan,fun fact", "since": "6.18.0"};

// {teks, sumber}. Semua fakta dari sumber yang bisa dicek.
export const FAKTA = [
  { teks: 'Madu yang ditemukan di makam Mesir kuno berusia sekitar 3.000 tahun masih bisa dimakan. Madu tidak pernah basi karena kadar airnya sangat rendah.', sumber: 'Smithsonian Magazine' },
  { teks: 'Gurita punya tiga jantung: dua memompa darah ke insang, satu ke seluruh tubuh.', sumber: 'National Geographic' },
  { teks: 'Bulan menjauh dari Bumi sekitar 3,8 cm setiap tahun, diukur dengan pantulan laser dari cermin yang ditinggalkan misi Apollo.', sumber: 'NASA' },
  { teks: 'Secara botani, pisang termasuk buah beri, sedangkan stroberi bukan.', sumber: 'Encyclopaedia Britannica' },
  { teks: 'Jantung paus biru bisa sebesar mobil kecil, dan detaknya bisa terdengar dari jarak 3 km.', sumber: 'National Geographic' },
  { teks: 'Lebah madu bisa mengenali wajah manusia, dibuktikan dalam penelitian yang diterbitkan di Journal of Experimental Biology.', sumber: 'Journal of Experimental Biology, 2005' },
  { teks: 'Air panas kadang membeku lebih cepat dari air dingin. Fenomena ini disebut efek Mpemba, dinamai dari siswa Tanzania yang mengamatinya pada 1960-an.', sumber: 'Royal Society of Chemistry' },
  { teks: 'Kucing tidak bisa merasakan manis karena gen reseptor rasa manisnya tidak berfungsi.', sumber: 'Scientific American' },
  { teks: 'Hiu sudah ada sebelum pohon: hiu muncul sekitar 450 juta tahun lalu, pohon sekitar 360 juta tahun lalu.', sumber: 'Smithsonian Magazine' },
  { teks: 'Ada lebih banyak kemungkinan susunan satu set kartu remi (52 kartu) daripada jumlah detik sejak alam semesta terbentuk.', sumber: 'Matematika: 52 faktorial' },
  { teks: 'Indonesia punya lebih dari 17.000 pulau, terbanyak kedua di dunia setelah Kanada.', sumber: 'Badan Informasi Geospasial' },
  { teks: 'Danau Toba di Sumatra adalah danau vulkanik terbesar di dunia, terbentuk dari letusan super sekitar 74.000 tahun lalu.', sumber: 'UNESCO Global Geoparks' },
  { teks: 'Komodo, kadal terbesar di dunia, hanya hidup di Indonesia, di Kepulauan Nusa Tenggara Timur.', sumber: 'National Geographic' },
  { teks: 'Rafflesia arnoldii, bunga terbesar di dunia, tumbuh di hutan Sumatra dan bisa mencapai diameter 1 meter.', sumber: 'Kew Gardens' },
  { teks: 'Cahaya Matahari butuh sekitar 8 menit 20 detik untuk sampai ke Bumi.', sumber: 'NASA' },
  { teks: 'Sehari di Venus (243 hari Bumi) lebih lama dari setahun di Venus (225 hari Bumi).', sumber: 'NASA Planetary Fact Sheet' },
  { teks: 'Saturnus adalah satu-satunya planet yang kerapatannya lebih rendah dari air, jadi secara teori ia akan mengapung.', sumber: 'NASA' },
  { teks: 'NASA memastikan ada es air di kawah-kawah kutub Bulan pada 2009.', sumber: 'NASA' },
  { teks: 'Cumi-cumi raksasa punya mata terbesar di dunia hewan, diameternya bisa mencapai 27 cm, sebesar piring makan.', sumber: 'Smithsonian Magazine' },
  { teks: 'Semut bisa mengangkat beban sampai 50 kali berat tubuhnya.', sumber: 'Journal of Biomechanics' },
  { teks: 'Burung kolibri adalah satu-satunya burung yang bisa terbang mundur.', sumber: 'National Geographic' },
  { teks: 'Gajah adalah satu-satunya mamalia yang tidak bisa melompat.', sumber: 'Smithsonian Magazine' },
  { teks: 'Lidah jerapah bisa mencapai panjang 45 sampai 50 cm, cukup untuk membersihkan telinganya sendiri.', sumber: 'San Diego Zoo' },
  { teks: 'Hati manusia bisa tumbuh kembali sampai ukuran semula setelah sebagian diangkat.', sumber: 'Johns Hopkins Medicine' },
  { teks: 'Kupu-kupu merasakan makanan dengan kakinya, karena reseptor rasanya ada di sana.', sumber: 'Smithsonian Magazine' },
  { teks: 'Es kering (karbon dioksida padat) tidak mencair, melainkan langsung berubah jadi gas. Prosesnya disebut sublimasi.', sumber: 'Encyclopaedia Britannica' },
  { teks: 'Suhu udara terpanas yang pernah tercatat resmi di Bumi adalah 56,7 C di Death Valley, California, pada 1913.', sumber: 'World Meteorological Organization' },
  { teks: 'Ilmuwan menduga hujan berlian bisa terjadi di Neptunus dan Uranus karena tekanan ekstrem di atmosfernya.', sumber: 'Nature Astronomy, 2017' },
  { teks: 'Otak manusia menggunakan sekitar 20 persen energi tubuh, padahal beratnya hanya sekitar 2 persen dari berat badan.', sumber: 'Scientific American' },
  { teks: 'Satu sendok teh tanah yang sehat bisa berisi lebih banyak mikroba daripada jumlah manusia di Bumi.', sumber: 'USDA Natural Resources Conservation Service' },
];

export const JUMLAH_FAKTA = FAKTA.length;

// Nomor hari dalam tahun (1-366). Murni, bisa diuji di Node.
export function hariKe(d) {
  const t = d instanceof Date ? d : new Date(d);
  const awal = new Date(t.getFullYear(), 0, 0);
  return Math.floor((t.getTime() - awal.getTime()) / 86400000);
}

// Fakta untuk tanggal tertentu (deterministik). Murni, bisa diuji di Node.
export function faktaUntukTanggal(d) {
  const t = d instanceof Date ? d : new Date(d);
  const indeks = (hariKe(t) - 1) % JUMLAH_FAKTA;
  return { ...FAKTA[indeks], indeks, total: JUMLAH_FAKTA };
}

export function render(root) {
  const box = T.out();
  const semuaBox = T.out();

  const tampilkan = (f) => {
    T.show(box,
      '<div class="dim">Fakta hari ini (' + (f.indeks + 1) + ' dari ' + f.total + ')</div>' +
      '<p style="font-size:17px;line-height:1.6;margin:10px 0">' + T.esc(f.teks) + '</p>' +
      '<p class="dim">Sumber: ' + T.esc(f.sumber) + '</p>');
  };

  const tampilkanSemua = () => {
    T.show(semuaBox, '<div class="dim" style="margin-bottom:6px">Semua ' + JUMLAH_FAKTA + ' fakta</div>' +
      FAKTA.map((f, i) => '<div style="padding:8px 0;border-bottom:1px solid rgba(127,127,127,.15)"><b>' + (i + 1) + '.</b> ' + T.esc(f.teks) + ' <span class="dim">(' + T.esc(f.sumber) + ')</span></div>').join(''));
  };

  root.appendChild(T.el('<p class="note">Satu fakta baru setiap hari. Hari yang sama selalu dapat fakta yang sama, jadi kamu bisa membagikannya ke temanmu.</p>'));
  root.appendChild(T.row(
    T.btn('Fakta Hari Ini', () => tampilkan(faktaUntukTanggal(new Date())), true),
    T.btn('Fakta Acak', () => {
      const i = Math.floor(Math.random() * JUMLAH_FAKTA);
      tampilkan({ ...FAKTA[i], indeks: i, total: JUMLAH_FAKTA });
    }),
    T.btn('Lihat Semua Fakta', tampilkanSemua),
  ));
  root.appendChild(box);
  root.appendChild(semuaBox);
  tampilkan(faktaUntukTanggal(new Date()));
}
