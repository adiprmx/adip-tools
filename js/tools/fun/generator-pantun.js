import { h as T, utils } from '../../core.js?v=6.4.0';

export const meta = {"id":"generator-pantun","name":"Generator Pantun","cat":"fun","icon":"🎭","desc":"Rakit pantun 4 baris acak: cinta, lucu, nasehat. 45 pantun.","keywords":"pantun,sampiran,isi,cinta,lucu,nasehat,puisi,acak"};

// Tiap entri: sampiran (2 baris) + isi (2 baris), rima a-b-a-b.
const PANTUN = {
  cinta: [
    { s: ['Jalan-jalan ke kota Paris', 'Singgah dulu beli roti'], i: ['Walau jarak kita terpisah', 'Cintaku padamu takkan pernah mati'] },
    { s: ['Naik perahu ke tengah samudra', 'Dayung pelan sambil bernyanyi'], i: ['Hanya kamu yang selalu kupuja', 'Sampai tua kita saling menemani'] },
    { s: ['Pagi-pagi petik bunga melati', 'Wangi semerbak tiada henti'], i: ['Kamu selalu ada di hati', 'Takkan pernah terganti'] },
    { s: ['Ke pasar membeli kain sutra', 'Pulang mampir beli durian'], i: ['Hanya kamu yang selalu kupuja', 'Cinta ini takkan pernah tergoyahkan'] },
    { s: ['Pergi ke sawah menanam padi', 'Pulang sore membawa berkat'], i: ['Walau jauh kamu tetap di hati', 'Cintaku ini semakin kuat'] },
    { s: ['Bulan purnama di malam hari', 'Bintang-bintang menemani'], i: ['Kamu selalu ada di hati', 'Sampai kapan pun tak terganti'] },
    { s: ['Jalan-jalan ke tepi danau', 'Duduk santai di bawah pohon rindang'], i: ['Setiap malam aku selalu merindu', 'Cintaku padamu takkan pernah hilang'] },
    { s: ['Burung nuri terbang melayang', 'Hinggap sebentar di dahan jati'], i: ['Kamu selalu aku sayang', 'Cintaku ini sampai mati'] },
    { s: ['Pergi merantau ke negeri orang', 'Bawa bekal secukupnya'], i: ['Hatiku tetap milikmu seorang', 'Takkan tergoda oleh yang lainnya'] },
    { s: ['Menikmati kopi di pagi hari', 'Sambil membaca kabar'], i: ['Kamu selalu ada di hati', 'Sayangku padamu takkan pudar'] },
    { s: ['Hujan turun di sore hari', 'Duduk termenung di beranda'], i: ['Rindu padamu selalu di hati', 'Kapan kita bisa berjumpa'] },
    { s: ['Duduk berdua di bawah rembulan', 'Bintang kecil berkelip manja'], i: ['Kasih sayang kita semakin dalam', 'Hingga tua kita bahagia'] },
    { s: ['Makan malam dengan rendang', 'Ditemani es teh manis'], i: ['Kamu selalu aku sayang', 'Cintaku padamu takkan pernah habis'] },
    { s: ['Naik sepeda di pagi hari', 'Sambil menikmati udara segar'], i: ['Kamu selalu di hati', 'Cintaku padamu takkan pudar'] },
    { s: ['Menjahit baju di sore hari', 'Jarum patah benang pun kusut'], i: ['Kamu selalu di hati', 'Cintaku padamu takkan pernah surut'] },
  ],
  lucu: [
    { s: ['Pagi-pagi makan bubur', 'Siang hari makan padang'], i: ['Katanya pengen kurus', 'Tapi ngemil melulu, kapan langsingnya'] },
    { s: ['Beli pulsa di konter langganan', 'Dapat bonus internetan'], i: ['Chat cuma di-read doang', 'Mungkin doi sibuk, atau pura-pura sibuk'] },
    { s: ['Tanggal tua dompet sekarat', 'Saldo tinggal recehan'], i: ['Mie instan jadi penyelamat', 'Dimakan tiap malam'] },
    { s: ['Ngafal rumus sampai pagi', 'Mata jadi kayak panda'], i: ['Nilai ulangan tetap merah', 'Ya sudah, pasrah saja'] },
    { s: ['Nonton drakor sampai subuh', 'Alarm di-snooze berkali-kali'], i: ['Bangun-bangun jam sepuluh', 'Chat bos: maaf, macet Pak'] },
    { s: ['Ke salon minta model Korea', 'Tukang cukur ngangguk paham'], i: ['Lihat cermin langsung syok', 'Kok malah kayak tentara'] },
    { s: ['Beli sepatu online diskon', 'Pilih ukuran paling pas'], i: ['Barang datang kekecilan', 'Dijual lagi, rugi bandar'] },
    { s: ['Masak nasi lupa tekan cook', 'Ditinggal main HP'], i: ['Dibuka ternyata masih beras', 'Ya sudah, pesan gofood'] },
    { s: ['Pesan ojek ke tempat kerja', 'Drivernya baik hati'], i: ['Malah diajak muter-muter', 'Sampai kantor telat lagi'] },
    { s: ['Adopsi kucing oren', 'Katanya penurut'], i: ['Tiap malam tawuran', 'Sama kucing tetangga'] },
    { s: ['Nyuci baju putih kesayangan', 'Kecampur kaos merah'], i: ['Hasilnya jadi pink', 'Fashion baru, kata tetangga'] },
    { s: ['Makan durian tiga biji', 'Perut langsung begah'], i: ['Kentut bau durian', 'Satu ruangan kabur semua'] },
    { s: ['Niat scroll HP lima menit', 'Sambil rebahan santai'], i: ['Tau-tau sudah subuh', 'Besok mata panda lagi'] },
    { s: ['Dapat undangan nikahan', 'Siapin baju terbaik'], i: ['Amplop isinya dua puluh ribu', 'Makan prasmanan tiga piring'] },
    { s: ['Beli sepatu lari termahal', 'Niat jogging tiap pagi'], i: ['Dipakai sekali doang', 'Sisanya jadi pajangan'] },
  ],
  nasehat: [
    { s: ['Air beriak tanda tak dalam', 'Air tenang menghanyutkan'], i: ['Ilmu sejati membuat rendah hati', 'Bukan untuk disombongkan'] },
    { s: ['Menuntut ilmu ke negeri seberang', 'Bekal tekad dan doa'], i: ['Jangan pernah berhenti belajar', 'Ilmu bekal dunia akhirat'] },
    { s: ['Rajin pangkal pandai', 'Hemat pangkal kaya'], i: ['Jangan suka bermalas-malasan', 'Masa depanmu kan cerah'] },
    { s: ['Buah jatuh tak jauh dari pohonnya', 'Anak meniru orang tuanya'], i: ['Didiklah dengan kasih sayang', 'Agar tumbuh jadi anak berbakti'] },
    { s: ['Sedikit demi sedikit', 'Lama-lama menjadi bukit'], i: ['Sisihkan uang sejak dini', 'Hari tua takkan sulit'] },
    { s: ['Bagai pungguk merindukan bulan', 'Hanya bisa memandang'], i: ['Mimpi tanpa usaha', 'Hanyalah angan-angan'] },
    { s: ['Sambil menyelam minum air', 'Sambil bekerja menabung'], i: ['Waktu muda jangan disia-siakan', 'Siapkan bekal hari tua'] },
    { s: ['Gajah mati meninggalkan gading', 'Harimau mati meninggalkan belang'], i: ['Manusia mati meninggalkan nama', 'Tinggalkan kebaikan selama hidup'] },
    { s: ['Di mana bumi dipijak', 'Di situ langit dijunjung'], i: ['Hormati adat di perantauan', 'Jaga nama baik keluarga'] },
    { s: ['Bersatu kita teguh', 'Bercerai kita runtuh'], i: ['Jaga selalu persaudaraan', 'Jangan mudah terpecah belah'] },
    { s: ['Malu bertanya sesat di jalan', 'Jangan sungkan meminta tahu'], i: ['Bertanya itu bukan aib', 'Ilmu datang pada yang mau'] },
    { s: ['Nasi sudah menjadi bubur', 'Tak bisa kembali jadi nasi'], i: ['Yang lalu biarlah berlalu', 'Fokus perbaiki hari ini'] },
    { s: ['Bagai air di daun talas', 'Tak membekas di hati'], i: ['Dengarkan nasihat orang tua', 'Jangan diabaikan begitu saja'] },
    { s: ['Karena nila setitik', 'Rusak susu sebelanga'], i: ['Jaga lisan dan perbuatan', 'Satu salah, nama tercoreng'] },
    { s: ['Jauh berjalan banyak dilihat', 'Lama hidup banyak dirasa'], i: ['Perbanyak pengalaman hidup', 'Agar bijak dalam bertindak'] },
  ],
};

const TEMA = [
  ['semua', '🎲 Semua tema'],
  ['cinta', '❤️ Cinta'],
  ['lucu', '😂 Lucu'],
  ['nasehat', '🙏 Nasehat'],
];

export function render(root) {
  const box = T.out();
  const temaSel = T.select(TEMA, 'semua');
  let cur = null;

  const baru = () => {
    const keys = temaSel.value === 'semua' ? Object.keys(PANTUN) : [temaSel.value];
    const tema = keys[Math.floor(Math.random() * keys.length)];
    const pool = PANTUN[tema];
    let pick = pool[Math.floor(Math.random() * pool.length)];
    if (pool.length > 1) {
      let guard = 0;
      while (pick === cur && guard++ < 10) pick = pool[Math.floor(Math.random() * pool.length)];
    }
    cur = pick;
    const baris = cur.s.concat(cur.i).map((b, i) =>
      '<p style="font-size:16px;line-height:1.8;margin:0' + (i === 1 ? ';margin-bottom:14px' : '') + '">' + T.esc(b) + '</p>'
    ).join('');
    T.show(box, '<div class="center" style="padding:8px 4px">' + baris + '</div>');
  };

  root.appendChild(T.el('<p class="hint">Pantun 4 baris (2 sampiran + 2 isi), dirakit acak. Buat gombal, ngakak, atau wejangan. 🎭</p>'));
  root.appendChild(T.field('Tema', temaSel));
  root.appendChild(box);
  root.appendChild(T.row(
    T.btn('🎭 Pantun baru', baru, true),
    T.copyBtn(() => (cur ? cur.s.concat(cur.i).join('\n') : ''), '📋 Salin')
  ));
  baru();
}
