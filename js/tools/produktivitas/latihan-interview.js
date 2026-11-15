import { h as T, utils } from '../../core.js?v=6.11.5';

// Bank pertanyaan interview umum + petunjuk menjawab (poin, bukan naskah hafalan).
utils.SOAL_INTERVIEW = [
  { kat: 'Perkenalan', q: 'Coba perkenalkan diri kamu.', tips: 'Sebutkan nama, pendidikan terakhir, dan satu pengalaman yang paling nyambung dengan posisi ini. Singkat saja, sekitar 1 menit.' },
  { kat: 'Perkenalan', q: 'Kenapa tertarik melamar di perusahaan ini?', tips: 'Sebutkan satu hal spesifik tentang perusahaan ini (bidang usahanya, lokasinya, reputasinya), lalu hubungkan dengan apa yang kamu cari.' },
  { kat: 'Perkenalan', q: 'Ceritakan tentang dirimu di luar pekerjaan.', tips: 'Pilih satu dua hal yang menunjukkan karakter baik, misalnya hobi yang butuh ketekunan atau kegiatan yang melatih kerja sama.' },
  { kat: 'Pengalaman', q: 'Ceritakan pengalaman kerjamu sebelumnya.', tips: 'Pakai pola: situasi, apa yang kamu lakukan, hasilnya. Pengalaman PKL, magang, dan organisasi juga dihitung.' },
  { kat: 'Pengalaman', q: 'Pernah menghadapi masalah di tempat kerja? Bagaimana menyelesaikannya?', tips: 'Pilih satu masalah nyata, ceritakan langkahmu menyelesaikannya, dan apa yang kamu pelajari. Jangan menyalahkan orang lain.' },
  { kat: 'Pengalaman', q: 'Apa pencapaian yang paling kamu banggakan?', tips: 'Pilih pencapaian dengan hasil yang bisa diukur atau dirasakan, walau kecil. Jelaskan peranmu di dalamnya.' },
  { kat: 'Kelebihan dan kekurangan', q: 'Apa kelebihanmu?', tips: 'Pilih 2 kelebihan yang relevan dengan pekerjaan, sertai contoh nyata. Jangan hanya menyebut kata sifat.' },
  { kat: 'Kelebihan dan kekurangan', q: 'Apa kekuranganmu?', tips: 'Pilih kekurangan yang tidak fatal untuk posisi ini, lalu sampaikan apa yang sedang kamu lakukan untuk memperbaikinya.' },
  { kat: 'Kelebihan dan kekurangan', q: 'Bagaimana kamu menghadapi tekanan dan deadline?', tips: 'Ceritakan caramu mengatur prioritas saat pekerjaan menumpuk, dengan satu contoh nyata.' },
  { kat: 'Kerja sama', q: 'Lebih suka kerja sendiri atau kerja tim?', tips: 'Jawab jujur tapi tunjukkan kamu bisa keduanya. Beri contoh kapan kamu bekerja sendiri dan kapan bersama tim.' },
  { kat: 'Kerja sama', q: 'Pernah beda pendapat dengan rekan kerja? Bagaimana mengatasinya?', tips: 'Tunjukkan kamu mendengarkan dulu, mencari jalan tengah, dan tetap profesional walau tidak sepakat.' },
  { kat: 'Motivasi', q: 'Kenapa kami harus memilih kamu?', tips: 'Ringkaskan 2-3 hal yang membuatmu cocok: keterampilan, sikap kerja, dan kemauan belajar. Jangan merendahkan pelamar lain.' },
  { kat: 'Motivasi', q: 'Di mana kamu melihat dirimu 5 tahun lagi?', tips: 'Tunjukkan rencana yang masuk akal dan masih nyambung dengan perusahaan ini. Hindari jawaban yang terlalu muluk atau terlalu datar.' },
  { kat: 'Motivasi', q: 'Apa yang membuatmu semangat bekerja?', tips: 'Sebutkan hal yang tulus: belajar hal baru, hasil kerja yang terlihat, atau membantu tim. Hindari jawaban yang hanya soal uang.' },
  { kat: 'Gaji dan lain-lain', q: 'Berapa gaji yang kamu harapkan?', tips: 'Riset dulu kisaran gaji posisi ini di daerahmu. Sebutkan rentang, bukan angka mati, dan katakan terbuka untuk dibicarakan.' },
  { kat: 'Gaji dan lain-lain', q: 'Apakah kamu bersedia kerja shift / lembur / di luar kota?', tips: 'Jawab sesuai kondisi nyatamu. Kalau ada batasan, sampaikan dengan jelas sejak awal.' },
  { kat: 'Gaji dan lain-lain', q: 'Kapan kamu bisa mulai bekerja?', tips: 'Sebutkan tanggal yang realistis. Kalau masih ada urusan (mis. dokumen), sampaikan terus terang.' },
  { kat: 'Gaji dan lain-lain', q: 'Apakah ada pertanyaan untuk kami?', tips: 'Selalu siapkan 1-2 pertanyaan, misalnya soal tim yang akan ditemani, pelatihan awal, atau seperti apa hari kerja biasa di posisi ini.' }
];

export const meta = {"id": "latihan-interview", "name": "Latihan Interview", "cat": "produktivitas", "icon": "🎤", "desc": "Latihan menjawab pertanyaan interview kerja yang paling sering keluar.", "keywords": "interview,lamaran,kerja,latihan,wawancara,hrd", "since": "6.11.0"};

export function render(root) {
  const kategori = ['Semua', ...new Set(utils.SOAL_INTERVIEW.map((s) => s.kat))];
  const pilihKat = T.select(kategori.map((k) => [k, k]), 'Semua');
  const kartu = T.el('<div style="border:1px solid #2a2a2a;border-radius:12px;padding:20px;margin:16px 0;min-height:120px"></div>');
  const box = T.out();
  let urutan = [];
  let idx = 0;
  let tampilTips = false;

  function acak() {
    const daftar = utils.SOAL_INTERVIEW.filter((s) => pilihKat.value === 'Semua' || s.kat === pilihKat.value);
    urutan = [...daftar].sort(() => Math.random() - 0.5);
    idx = 0;
    tampilTips = false;
    tampil();
  }

  function tampil() {
    if (urutan.length === 0) { kartu.innerHTML = '<div class="hint">Tidak ada soal di kategori ini.</div>'; return; }
    const s = urutan[idx];
    kartu.innerHTML =
      `<div style="font-size:12px;color:#a1a1aa">${s.kat} · Soal ${idx + 1} dari ${urutan.length}</div>` +
      `<div style="font-size:18px;font-weight:600;line-height:1.5;margin:10px 0">${s.q}</div>` +
      (tampilTips
        ? `<div style="font-size:14px;line-height:1.7;color:#d4d4d4;border-top:1px solid #2a2a2a;padding-top:12px"><b>Petunjuk:</b> ${s.tips}</div>`
        : `<div class="hint">Coba jawab dengan suara keras dulu, baru lihat petunjuknya.</div>`);
  }

  pilihKat.addEventListener('change', acak);

  root.appendChild(T.el('<p class="note">Latihan menjawab dengan suara keras, bukan hanya dibaca. Petunjuknya berisi poin yang bisa disampaikan, bukan naskah untuk dihafal kata per kata.</p>'));
  root.appendChild(T.field('Kategori pertanyaan', pilihKat));
  root.appendChild(kartu);
  root.appendChild(T.row(
    T.btn('Lihat petunjuk', () => { tampilTips = true; tampil(); }, true),
    T.btn('Soal berikutnya', () => {
      idx = (idx + 1) % urutan.length;
      tampilTips = false;
      tampil();
    }),
    T.btn('Acak ulang', acak)
  ));
  root.appendChild(box);
  acak();
}
