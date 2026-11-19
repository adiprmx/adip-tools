import { h as T, utils } from '../../core.js';

// Panduan tanya-jawab gejala HP bermasalah. Hasilnya KEMUNGKINAN penyebab,
// bukan diagnosis pasti. Kerusakan berat (kena air, jatuh keras, baterai
// menggelembung) selalu diarahkan ke teknisi.
const AREAS = {
  baterai: {
    label: 'Baterai',
    tanya: 'Apa yang terjadi dengan baterai?',
    opsi: [
      ['cepat-habis', 'Cepat habis padahal pemakaian biasa'],
      ['gembung', 'Baterai menggelembung, bodi HP terasa mengangkat'],
      ['mati-mendadak', 'HP mati mendadak padahal baterai masih ada'],
      ['cas-lama', 'Cas sangat lama sampai penuh'],
    ],
    hasil: {
      'cepat-habis': {
        kemungkinan: ['Baterai sudah tua dan kapasitasnya menurun', 'Aplikasi berjalan terus di latar belakang', 'Layar terlalu terang atau sinyal lemah terus menerus'],
        langkah: ['Cek menu baterai di pengaturan, lihat aplikasi apa yang paling banyak makan baterai', 'Matikan aplikasi yang jarang dipakai dari berjalan di latar belakang', 'Turunkan kecerahan layar dan matikan GPS bila tidak dipakai', 'Kalau HP sudah dipakai lebih dari 2 tahun dan baterai turun drastis, kemungkinan besar baterai perlu diganti'],
        teknisi: false, bahaya: null,
      },
      'gembung': {
        kemungkinan: ['Baterai rusak dan gas di dalamnya mengembang'],
        langkah: ['Jangan dipakai dulu, jangan dicas, dan jangan ditekan atau ditusuk', 'Simpan di tempat sejuk jauh dari benda mudah terbakar', 'Segera bawa ke teknisi untuk ganti baterai'],
        teknisi: true, bahaya: 'Baterai menggelembung bisa bocor atau terbakar. Jangan dibuka sendiri.',
      },
      'mati-mendadak': {
        kemungkinan: ['Baterai sudah tidak sehat, indikator persennya tidak akurat lagi', 'Konektor baterai longgar setelah HP jatuh'],
        langkah: ['Coba cas sampai penuh lalu pakai sampai habis sekali, untuk kalibrasi indikator', 'Kalau masih mati mendadak, kemungkinan baterai atau konektornya bermasalah'],
        teknisi: true, bahaya: null,
      },
      'cas-lama': {
        kemungkinan: ['Kabel atau kepala cas sudah rusak atau dayanya kecil', 'Port cas kotor atau longgar', 'Baterai sudah tua'],
        langkah: ['Coba kabel dan kepala cas lain yang bagus', 'Bersihkan port cas pelan-pelan dengan tusuk gigi kayu, HP dalam keadaan mati', 'Kalau tetap lambat dengan cas lain, baterai atau portnya perlu diperiksa'],
        teknisi: false, bahaya: null,
      },
    },
  },
  layar: {
    label: 'Layar',
    tanya: 'Apa yang terjadi dengan layar?',
    opsi: [
      ['retak', 'Layar retak atau pecah'],
      ['sentuh-ngaco', 'Sentuhan tidak akurat atau layar bergerak sendiri'],
      ['garis-warna', 'Ada garis, bercak, atau warna aneh'],
      ['gelap', 'Layar gelap tapi HP masih bunyi atau bergetar'],
    ],
    hasil: {
      'retak': {
        kemungkinan: ['Kaca layar pecah karena jatuh atau terbentur'],
        langkah: ['Tempel pelindung layar sementara supaya serpihan kaca tidak melukai jari', 'Cadangkan data penting secepatnya', 'Layar pecah tidak bisa diperbaiki dengan aplikasi, perlu ganti layar'],
        teknisi: true, bahaya: null,
      },
      'sentuh-ngaco': {
        kemungkinan: ['Pelindung layar tebal atau kotor mengganggu sentuhan', 'Layar pernah kena air atau jatuh', 'Aplikasi tertentu membuat layar tidak responsif'],
        langkah: ['Lepas pelindung layar dan bersihkan layar dengan kain kering', 'Restart HP dan coba lagi tanpa aplikasi tambahan', 'Kalau tetap ngaco di semua aplikasi, panel sentuhnya kemungkinan rusak'],
        teknisi: false, bahaya: null,
      },
      'garis-warna': {
        kemungkinan: ['Panel layar rusak karena jatuh atau tertekan', 'Kabel fleksibel layar longgar'],
        langkah: ['Restart HP dulu, kadang garis hilang setelah restart', 'Kalau garis menetap di semua tampilan, panel layarnya yang rusak'],
        teknisi: true, bahaya: null,
      },
      'gelap': {
        kemungkinan: ['Layar mati total tapi mesin masih hidup', 'Lampu latar layar rusak'],
        langkah: ['Coba tekan tombol daya 10 sampai 15 detik untuk paksa restart', 'Kalau tetap gelap tapi ada suara atau getar, layarnya perlu diperiksa'],
        teknisi: true, bahaya: null,
      },
    },
  },
  nyala: {
    label: 'HP tidak mau menyala',
    tanya: 'Bagaimana keadaannya sekarang?',
    opsi: [
      ['mati-total', 'Mati total, tidak ada tanda hidup sama sekali'],
      ['logo-loop', 'Mentok di logo, nyala mati berulang'],
      ['restart-sendiri', 'Sering restart sendiri'],
    ],
    hasil: {
      'mati-total': {
        kemungkinan: ['Baterai habis total', 'Tombol daya rusak', 'Mesin bermasalah setelah jatuh atau kena air'],
        langkah: ['Cas 30 menit dengan cas yang bagus, lalu coba nyalakan lagi', 'Kalau pernah kena air: jangan dicas dan jangan dinyalakan, langsung bawa ke teknisi', 'Kalau tetap mati total setelah dicas, mesinnya perlu diperiksa'],
        teknisi: true, bahaya: 'HP yang kena air jangan dicas atau dinyalakan, air di dalam bisa membuat korsleting.',
      },
      'logo-loop': {
        kemungkinan: ['Sistem rusak setelah update gagal', 'Memori penuh sampai sistem tidak bisa jalan', 'Kerusakan di memori internal'],
        langkah: ['Coba paksa restart dengan menahan tombol daya 10 sampai 15 detik', 'Kalau tetap mentok, perlu reset pabrik dari mode recovery. Reset menghapus semua data, jadi lakukan hanya bila datanya sudah dicadangkan atau sudah pasrah kehilangan data'],
        teknisi: true, bahaya: null,
      },
      'restart-sendiri': {
        kemungkinan: ['Aplikasi yang baru dipasang tidak cocok', 'Sistem perlu diperbarui', 'Baterai atau mesin bermasalah'],
        langkah: ['Hapus aplikasi yang dipasang terakhir sebelum masalah muncul', 'Perbarui sistem ke versi terbaru', 'Kalau masih restart sendiri setelah itu, baterai atau mesinnya perlu diperiksa'],
        teknisi: false, bahaya: null,
      },
    },
  },
  panas: {
    label: 'HP cepat panas',
    tanya: 'Kapan HP terasa panas?',
    opsi: [
      ['saat-cas', 'Saat dicas'],
      ['saat-main', 'Saat main game atau buka aplikasi berat'],
      ['saat-diam', 'Panas walau tidak dipakai'],
    ],
    hasil: {
      'saat-cas': {
        kemungkinan: ['Kepala cas atau kabel tidak cocok dayanya', 'HP dipakai sambil dicas'],
        langkah: ['Pakai cas bawaan atau cas yang sesuai dengan HPmu', 'Jangan dipakai untuk game saat dicas', 'Cas di tempat yang tidak panas, jangan di atas kasur atau bantal'],
        teknisi: false, bahaya: null,
      },
      'saat-main': {
        kemungkinan: ['Game atau aplikasi berat memang membuat mesin bekerja keras', 'Sinyal lemah membuat HP bekerja lebih keras'],
        langkah: ['Turunkan kualitas grafis game dan tutup aplikasi lain', 'Istirahatkan HP beberapa menit kalau sudah sangat panas', 'Lepas casing tebal saat main game berat'],
        teknisi: false, bahaya: null,
      },
      'saat-diam': {
        kemungkinan: ['Aplikasi berjalan terus di latar belakang', 'Sistem sedang update atau sinkronisasi', 'Baterai bermasalah'],
        langkah: ['Cek menu baterai, lihat aplikasi apa yang paling banyak makan baterai', 'Restart HP', 'Kalau panas terus walau sudah restart dan tidak ada aplikasi berat, baterainya perlu diperiksa'],
        teknisi: false, bahaya: null,
      },
    },
  },
  sinyal: {
    label: 'Sinyal dan jaringan',
    tanya: 'Apa yang bermasalah?',
    opsi: [
      ['tidak-ada-sinyal', 'Tidak ada sinyal sama sekali'],
      ['wifi-putus', 'WiFi sering putus atau tidak bisa tersambung'],
      ['bluetooth', 'Bluetooth tidak bisa tersambung'],
    ],
    hasil: {
      'tidak-ada-sinyal': {
        kemungkinan: ['Kartu SIM tidak terbaca atau rusak', 'Lokasi memang tidak terjangkau sinyal', 'Pengaturan jaringan bermasalah'],
        langkah: ['Coba kartu SIM di HP lain, dan coba kartu lain di HP ini', 'Aktifkan mode pesawat 10 detik lalu matikan lagi', 'Atur ulang pengaturan jaringan di pengaturan HP', 'Kalau kartu lain juga tidak terbaca, slot SIM atau antenanya perlu diperiksa'],
        teknisi: false, bahaya: null,
      },
      'wifi-putus': {
        kemungkinan: ['Router bermasalah atau terlalu jauh', 'Terlalu banyak perangkat tersambung', 'Pengaturan WiFi HP bermasalah'],
        langkah: ['Restart router dan HP', 'Lupakan jaringan WiFi lalu sambungkan ulang dengan kata sandi yang benar', 'Coba WiFi lain, kalau WiFi lain normal berarti routernya yang bermasalah'],
        teknisi: false, bahaya: null,
      },
      'bluetooth': {
        kemungkinan: ['Perangkat belum dalam mode pasang', 'Perangkat lama masih tersimpan dan bentrok'],
        langkah: ['Pastikan perangkat yang dituju dalam mode pasang (pairing)', 'Hapus perangkat lama dari daftar Bluetooth lalu pasang ulang', 'Restart HP lalu coba lagi'],
        teknisi: false, bahaya: null,
      },
    },
  },
  suara: {
    label: 'Suara',
    tanya: 'Apa yang bermasalah dengan suara?',
    opsi: [
      ['speaker-kecil', 'Suara speaker kecil atau pecah'],
      ['mic-tidak-jalan', 'Mic tidak jalan, lawan bicara tidak dengar suaraku'],
      ['tidak-ada-suara', 'Tidak ada suara sama sekali'],
    ],
    hasil: {
      'speaker-kecil': {
        kemungkinan: ['Lubang speaker kotor atau tertutup debu', 'Speaker rusak setelah kena air'],
        langkah: ['Bersihkan lubang speaker pelan-pelan dengan sikat halus yang kering', 'Cek apakah volume media memang sudah besar', 'Kalau suara tetap pecah, speakernya perlu diganti'],
        teknisi: false, bahaya: null,
      },
      'mic-tidak-jalan': {
        kemungkinan: ['Lubang mic kotor atau tertutup casing', 'Aplikasi tidak punya izin mic', 'Mic rusak'],
        langkah: ['Coba rekam suara, kalau rekaman juga tidak ada suara berarti micnya', 'Bersihkan lubang mic pelan-pelan, cek casing tidak menutup lubang', 'Cek izin mic aplikasi di pengaturan'],
        teknisi: false, bahaya: null,
      },
      'tidak-ada-suara': {
        kemungkinan: ['HP dalam mode senyap atau jangan ganggu', 'HP masih tersambung ke Bluetooth', 'Speaker rusak'],
        langkah: ['Cek mode senyap dan jangan ganggu sudah mati', 'Matikan Bluetooth, mungkin suara lari ke earphone atau speaker lain', 'Restart HP, kalau tetap tidak ada suara speakernya perlu diperiksa'],
        teknisi: false, bahaya: null,
      },
    },
  },
  lambat: {
    label: 'HP lambat',
    tanya: 'Bagaimana lambatnya?',
    opsi: [
      ['memori-penuh', 'Memori hampir penuh'],
      ['aplikasi-lemot', 'Aplikasi lemot dibuka'],
      ['panas-juga', 'Lambat dan cepat panas'],
    ],
    hasil: {
      'memori-penuh': {
        kemungkinan: ['Ruang simpan hampir penuh sehingga sistem tidak punya ruang kerja'],
        langkah: ['Hapus aplikasi, foto, dan video yang tidak dipakai', 'Pindahkan foto dan video ke penyimpanan lain atau cloud', 'Hapus cache aplikasi besar dari pengaturan'],
        teknisi: false, bahaya: null,
      },
      'aplikasi-lemot': {
        kemungkinan: ['Terlalu banyak aplikasi berjalan bersamaan', 'Aplikasi belum diperbarui', 'HP sudah tua untuk aplikasi baru'],
        langkah: ['Tutup aplikasi yang tidak dipakai', 'Perbarui aplikasi dan sistem', 'Restart HP seminggu sekali'],
        teknisi: false, bahaya: null,
      },
      'panas-juga': {
        kemungkinan: ['Mesin bekerja keras karena aplikasi berat di latar belakang', 'Baterai sudah tua'],
        langkah: ['Cek aplikasi apa yang paling banyak makan baterai dan tutup yang tidak perlu', 'Kurangi aplikasi yang berjalan di latar belakang', 'Kalau sudah dibersihkan tapi tetap lambat dan panas, perlu diperiksa'],
        teknisi: false, bahaya: null,
      },
    },
  },
  kamera: {
    label: 'Kamera',
    tanya: 'Apa yang terjadi dengan kamera?',
    opsi: [
      ['blur', 'Foto blur atau tidak fokus'],
      ['hitam', 'Kamera hitam, tidak tampil gambar'],
      ['flash-mati', 'Flash tidak menyala'],
    ],
    hasil: {
      'blur': {
        kemungkinan: ['Lensa kotor atau berembun', 'Pelindung lensa tergores', 'Fokus otomatis bermasalah'],
        langkah: ['Bersihkan lensa dengan kain halus yang kering', 'Ketuk layar pada objek untuk fokus manual', 'Kalau tetap blur di semua jarak, lensa atau modul kameranya perlu diperiksa'],
        teknisi: false, bahaya: null,
      },
      'hitam': {
        kemungkinan: ['Aplikasi kamera error', 'Aplikasi lain sedang memakai kamera', 'Modul kamera rusak'],
        langkah: ['Tutup semua aplikasi lalu buka kamera lagi', 'Hapus cache aplikasi kamera di pengaturan', 'Restart HP, kalau tetap hitam modul kameranya perlu diperiksa'],
        teknisi: false, bahaya: null,
      },
      'flash-mati': {
        kemungkinan: ['Flash dimatikan di pengaturan kamera', 'Baterai lemah, HP mematikan flash otomatis', 'Lampu flash rusak'],
        langkah: ['Cek ikon flash di aplikasi kamera sudah menyala', 'Cas HP sampai baterai cukup lalu coba lagi', 'Coba senter, kalau senter juga tidak nyala berarti lampunya rusak'],
        teknisi: false, bahaya: null,
      },
    },
  },
  cas: {
    label: 'Tidak bisa dicas',
    tanya: 'Bagaimana saat dicas?',
    opsi: [
      ['tidak-mengisi', 'Dicolok tapi tidak mengisi sama sekali'],
      ['lambat', 'Mengisi tapi sangat lambat'],
      ['harus-ditekuk', 'Harus ditekuk atau ditahan baru mengisi'],
    ],
    hasil: {
      'tidak-mengisi': {
        kemungkinan: ['Kabel atau kepala cas rusak', 'Port cas kotor atau rusak', 'Baterai habis total sampai HP tidak merespons'],
        langkah: ['Coba kabel dan kepala cas lain yang bagus', 'Cas 30 menit, HP yang baterainya habis total butuh waktu sebelum menunjukkan tanda hidup', 'Bersihkan port cas pelan-pelan dengan tusuk gigi kayu, HP dalam keadaan mati'],
        teknisi: false, bahaya: null,
      },
      'lambat': {
        kemungkinan: ['Kepala cas dayanya kecil', 'Kabel sudah rusak sebagian', 'HP dipakai berat sambil dicas'],
        langkah: ['Pakai cas bawaan HP atau cas dengan daya yang sesuai', 'Jangan main game sambil dicas', 'Coba kabel lain, kabel yang sudah lama sering jadi lambat'],
        teknisi: false, bahaya: null,
      },
      'harus-ditekuk': {
        kemungkinan: ['Port cas longgar atau pin di dalamnya bengkok', 'Ujung kabel sudah aus'],
        langkah: ['Coba kabel lain dulu, kalau kabel baru normal berarti kabel lamanya yang aus', 'Kalau semua kabel harus ditekuk, port casnya yang longgar dan perlu diperbaiki'],
        teknisi: true, bahaya: null,
      },
    },
  },
};

export function diagnosisHp(area, jawaban) {
  const a = AREAS[area];
  if (!a || !a.hasil[jawaban]) return null;
  return { area: a.label, ...a.hasil[jawaban] };
}
utils.diagnosisHp = diagnosisHp;

export const meta = {"id": "diagnosis-hp-rusak", "name": "Diagnosis HP Rusak", "cat": "sehari", "icon": "📱", "desc": "Tanya-jawab terpandu untuk menduga penyebab HP bermasalah, plus langkah aman yang bisa dicoba sendiri.", "keywords": "hp rusak,diagnosis,handphone,baterai,layar,servis,teknisi,perbaiki", "since": "6.19.0"};
export function render(root) {
  const areaSel = T.select(Object.entries(AREAS).map(([k, v]) => [k, v.label]), 'baterai');
  const gejalaSel = T.select([], '');
  const box = T.out();

  const isiGejala = () => {
    const a = AREAS[areaSel.value];
    gejalaSel.innerHTML = '';
    a.opsi.forEach(([v, l]) => {
      const o = document.createElement('option');
      o.value = v; o.textContent = l;
      gejalaSel.appendChild(o);
    });
  };
  areaSel.addEventListener('change', isiGejala);
  isiGejala();

  const hitung = () => {
    const r = diagnosisHp(areaSel.value, gejalaSel.value);
    if (!r) { T.show(box, '<span class="err">Pilih dulu bagian dan gejalanya.</span>'); return; }
    let html = '<div class="dim">Kemungkinan penyebab (' + T.esc(r.area) + ')</div>';
    r.kemungkinan.forEach((k) => { html += '<p>' + T.esc(k) + '</p>'; });
    html += '<div class="dim" style="margin-top:12px">Langkah aman yang bisa dicoba</div>';
    r.langkah.forEach((s, i) => { html += '<p>' + (i + 1) + '. ' + T.esc(s) + '</p>'; });
    if (r.bahaya) html += '<p class="err">' + T.esc(r.bahaya) + '</p>';
    if (r.teknisi) html += '<p class="hint">Gejala ini kemungkinan besar butuh teknisi. Cadangkan datamu dulu bila masih bisa, lalu bawa ke tempat servis tepercaya.</p>';
    html += '<p class="hint">Ini panduan awal berdasarkan gejala yang kamu pilih, bukan diagnosis pasti. Kalau ragu atau HP masih garansi, bawa ke tempat servis resmi.</p>';
    T.show(box, html);
  };

  root.appendChild(T.el('<p class="note">Jawab dua pertanyaan ini. Hasilnya kemungkinan penyebab dan langkah aman yang bisa kamu coba sendiri, plus kapan harus ke teknisi.</p>'));
  root.appendChild(T.field('Bagian HP yang bermasalah', areaSel));
  root.appendChild(T.field('Gejalanya', gejalaSel));
  root.appendChild(T.btn('Lihat Kemungkinan Penyebab', hitung, true));
  root.appendChild(box);
  T.show(box, '<p class="hint">Pilih bagian dan gejalanya, lalu tekan tombol di atas.</p>');
}
