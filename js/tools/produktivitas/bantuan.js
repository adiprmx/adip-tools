import { h as T } from '../../core.js';

export const meta = {"id":"bantuan","name":"Bantuan & Pertanyaan Umum","cat":"produktivitas","icon":"❓","desc":"Jawaban singkat untuk pertanyaan yang paling sering ditanyakan soal Adip Tools.","keywords":"bantuan,faq,pertanyaan,help,cara pakai,gratis,privasi,aman,error","since":"6.12.0"};

// Semua jawaban ditulis dengan bahasa sehari-hari, tanpa istilah teknis.
const GROUPS = [
  { title: 'Umum', items: [
    { q: 'Apakah semua tool di sini gratis?',
      a: 'Hampir semua tool gratis dan bisa langsung dipakai tanpa bayar. Pengecualian kecil: beberapa tool AI memakai akun atau kuota milikmu sendiri (misalnya Puter dan ElevenLabs) — kalau kuotanya habis, tool itu akan memberitahumu di dalam tool-nya. Tidak ada fitur yang dikunci di situs ini.' },
    { q: 'Apakah saya perlu daftar atau login?',
      a: 'Kebanyakan tool bisa langsung dipakai tanpa akun dan tanpa kata sandi. Pengecualian: beberapa tool AI butuh kamu masuk ke akun layanan AI-nya sendiri (misalnya Puter) atau memakai kunci API milikmu (misalnya ElevenLabs) — itu akunmu di layanan lain, bukan akun di situs ini.' },
    { q: 'Bagaimana cara memakai sebuah tool?',
      a: 'Pilih tool dari beranda atau cari lewat kolom pencarian, isi yang diminta (misalnya angka atau teks), lalu tekan tombolnya. Hasilnya muncul di bawah, dan biasanya bisa disalin atau diunduh.' },
    { q: 'Apakah bisa dipakai di HP?',
      a: 'Bisa. Adip Tools dibuat untuk HP dulu, jadi tampilannya menyesuaikan layar kecil. Semua tool juga jalan di laptop dan komputer.' },
  ] },
  { title: 'Privasi & data', items: [
    { q: 'Apakah file saya diunggah ke tempat lain?',
      a: 'Sebagian besar file diolah langsung di HP atau komputer kamu sendiri dan tidak dikirim ke mana-mana. Pengecualian: tool yang memang fungsinya mengirim — misalnya Foto to Link (mengunggah gambar agar dapat tautan) dan tool AI yang mengirim dokumen atau gambar ke layanan AI yang kamu pilih. Tool seperti itu selalu menjelaskannya di dalam tool-nya.' },
    { q: 'Apakah data saya dicatat?',
      a: 'Satu-satunya yang dicatat adalah kata yang kamu ketik di kolom pencarian beranda — katanya saja, tanpa nama dan tanpa akun — supaya kami tahu tool apa yang paling banyak dicari. Isi yang kamu ketik di dalam tool dan file yang kamu pilih tidak dicatat.' },
    { q: 'Di mana catatan dan data saya tersimpan?',
      a: 'Di HP atau komputer kamu sendiri, di dalam aplikasi internet yang kamu pakai (misalnya Chrome). Kalau kamu menghapus data aplikasi internet itu atau pindah ke perangkat lain, catatan tersebut tidak ikut pindah. Jadi simpan salinan hal-hal penting di tempat lain.' },
  ] },
  { title: 'Video & audio', items: [
    { q: 'Kenapa tool video mengunduh mesin dulu?',
      a: 'Untuk memotong atau mengubah video, aplikasi internet butuh mesin pengolah video. Mesin itu (sekitar 31 MB) diunduh sekali saat pertama kali kamu memakai tool video. Setelah itu mesinnya tersimpan di HP kamu, jadi pemakaian berikutnya langsung jalan tanpa mengunduh lagi. Mesin inilah yang membuat videomu tetap diolah di HP sendiri, bukan dikirim ke tempat lain.' },
    { q: 'Kenapa tool video terasa lambat di HP saya?',
      a: 'Mengolah video itu pekerjaan berat. HP yang lebih lama butuh waktu lebih lama — itu wajar. Coba tutup aplikasi lain dulu, dan untuk percobaan pertama pakai video yang pendek.' },
  ] },
  { title: 'Internet & masalah', items: [
    { q: 'Kenapa ada tool yang butuh internet?',
      a: 'Tool yang menampilkan info terbaru — misalnya cuaca, harga, jadwal salat, atau gempa — mengambil datanya dari sumber resmi di internet, jadi internet harus nyala. Tool hitung, ubah file, dan tulis-tulisan umumnya tetap jalan setelah halamannya terbuka.' },
    { q: 'Tool tidak jalan atau halaman kosong, apa yang harus saya lakukan?',
      a: 'Coba langkah ini satu per satu: 1) muat ulang halamannya, 2) pastikan internet nyala (untuk tool yang menampilkan info terbaru), 3) coba di aplikasi internet lain, 4) matikan dulu mode hemat data atau VPN bila sedang aktif. Kalau masih belum jalan, coba lagi beberapa saat kemudian.' },
    { q: 'Kenapa ada tool yang minta saya mengunduh sesuatu dulu?',
      a: 'Beberapa tool butuh bagian tambahan yang diunduh saat pertama dipakai, misalnya mesin pengolah video (sekitar 31 MB). Unduhan ini sekali saja; setelah tersimpan, pemakaian berikutnya tidak perlu mengunduh lagi.' },
  ] },
  { title: 'Hasil & ketepatan', items: [
    { q: 'Apakah hasil hitungan bisa dijadikan patokan resmi?',
      a: 'Hasil di sini untuk perkiraan sehari-hari dan membantu mengambil keputusan awal. Untuk urusan resmi — misalnya pajak, cicilan rumah, atau urusan hukum — cek lagi ke sumber resmi atau tanyakan ke ahlinya.' },
    { q: 'Dari mana data seperti cuaca, kurs, dan gempa diambil?',
      a: 'Dari sumber resmi yang terbuka untuk umum, misalnya BMKG untuk gempa dan cuaca di Indonesia. Datanya ditampilkan apa adanya sesuai yang diberikan sumber tersebut.' },
  ] },
];

export function render(root) {
  const box = T.el('<div></div>');

  const draw = (query) => {
    const q = query.trim().toLowerCase();
    box.innerHTML = '';
    let found = 0;
    GROUPS.forEach((g) => {
      const items = g.items.filter((it) => !q || (it.q + ' ' + it.a).toLowerCase().includes(q));
      if (!items.length) return;
      found += items.length;
      const group = T.el('<div style="margin:16px 0 4px"><div style="font-weight:700;font-size:14px;margin-bottom:8px">' + T.esc(g.title) + '</div></div>');
      items.forEach((it) => {
        const d = T.el(
          '<details class="card" style="margin-bottom:8px;padding:10px 12px">' +
          '<summary style="cursor:pointer;font-size:13.5px;font-weight:600;line-height:1.45">' + T.esc(it.q) + '</summary>' +
          '<p style="margin:8px 0 0;font-size:13px;line-height:1.6;color:var(--mut,#888)">' + T.esc(it.a) + '</p>' +
          '</details>');
        group.appendChild(d);
      });
      box.appendChild(group);
    });
    if (!found) {
      box.appendChild(T.el('<p class="center mut" style="margin-top:20px">Belum ada jawaban untuk &ldquo;' + T.esc(query.trim()) + '&rdquo;. Coba kata lain, misalnya &ldquo;gratis&rdquo;, &ldquo;video&rdquo;, atau &ldquo;internet&rdquo;.</p>'));
    }
  };

  const search = T.input('text', '🔍 Cari jawaban... (misal: gratis, video, internet)');
  search.addEventListener('input', () => draw(search.value));

  root.appendChild(T.el('<p class="hint">Ketuk pertanyaan untuk melihat jawabannya. Semua jawaban ditulis dengan bahasa sehari-hari — kalau ada kata yang masih membingungkan, itu salah kami, bukan salah kamu.</p>'));
  root.appendChild(T.field('Cari di bantuan', search));
  root.appendChild(box);
  root.appendChild(T.el(
    '<div class="card" style="margin-top:20px">' +
    '<div style="font-weight:700;font-size:14px;margin-bottom:6px">Masih belum ketemu jawabannya?</div>' +
    '<p class="mut" style="font-size:13px;line-height:1.6;margin:0">Coba dulu: muat ulang halaman, pastikan internet nyala, dan coba di aplikasi internet lain. Kebanyakan masalah selesai dengan tiga langkah itu. Halaman Metodologi di bagian bawah beranda menjelaskan cara tiap tool menghitung hasilnya.</p>' +
    '</div>'));
  draw('');
}
