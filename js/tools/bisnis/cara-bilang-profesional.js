import { h as T } from '../../core.js';

export const meta = {"id": "cara-bilang-profesional", "name": "Cara Bilang Profesional", "cat": "bisnis", "icon": "💬", "desc": "Kalimat sopan dan profesional untuk situasi kerja: menolak, minta maaf, follow-up, sampai minta naik gaji.", "keywords": "profesional,sopan,kalimat kerja,email kerja,menolak,minta maaf,follow-up,komunikasi kantor", "since": "6.19.0"};

/* Bank kalimat: [kategori, situasi, kalimat biasa, kalimat profesional].
   Kalimat ditulis sebagai contoh siap pakai, bukan kutipan dari sumber lain. */
export const FRASA = [
  ['Menolak', 'Menolak tugas tambahan', 'Nggak bisa, kerjaan saya udah numpuk.', 'Saat ini saya sedang fokus menyelesaikan [tugas], jadi saya belum bisa mengambil tambahan ini. Boleh kita bahas prioritasnya bersama?'],
  ['Menolak', 'Menolak ajakan rapat', 'Saya nggak bisa ikut rapatnya.', 'Terima kasih undangannya. Saya tidak bisa hadir di jam itu, tapi saya akan membaca ringkasannya dan memberi masukan lewat email.'],
  ['Menolak', 'Menolak permintaan klien di luar kesepakatan', 'Itu nggak termasuk paketnya.', 'Permintaan itu di luar cakupan yang kita sepakati. Saya bisa buatkan penawaran tambahannya bila Anda mau lanjut.'],
  ['Minta maaf', 'Telat membalas pesan', 'Maaf baru bales, sibuk banget.', 'Mohon maaf baru membalas. Terima kasih sudah menunggu, berikut jawaban saya.'],
  ['Minta maaf', 'Telat menyelesaikan tugas', 'Maaf ya telat, kemarin banyak kerjaan.', 'Saya minta maaf, tugas ini selesai lebih lambat dari jadwal. Ini hasilnya, dan saya sudah atur jadwal supaya tidak terulang.'],
  ['Minta maaf', 'Membuat kesalahan di pekerjaan', 'Ya salah saya sih.', 'Saya yang bertanggung jawab atas kesalahan ini. Ini yang sudah saya perbaiki, dan ini langkah supaya tidak terulang.'],
  ['Follow-up', 'Menagih jawaban yang belum dibalas', 'Gimana nih, udah dibaca belum?', 'Selamat pagi, saya ingin memastikan pesan saya sebelumnya sudah diterima. Apakah ada kabar terbaru soal ini?'],
  ['Follow-up', 'Menagih pembayaran', 'Tolong bayar tagihannya dong.', 'Saya mengingatkan tagihan nomor [nomor] yang jatuh tempo tanggal [tanggal]. Mohon konfirmasinya setelah pembayaran dilakukan. Terima kasih.'],
  ['Follow-up', 'Menanyakan kabar lamaran kerja', 'Lamaran saya gimana?', 'Selamat siang, saya ingin menanyakan perkembangan lamaran saya untuk posisi [posisi] yang saya kirim tanggal [tanggal]. Terima kasih atas waktunya.'],
  ['Minta bantuan', 'Minta tolong rekan kerja', 'Tolongin dong, saya nggak ngerti.', 'Boleh minta bantuan sebentar? Saya stuck di bagian [bagian], dan saya rasa pengalaman Anda di sini bisa membantu.'],
  ['Minta bantuan', 'Minta waktu atasan untuk diskusi', 'Pak, saya mau ngomong sebentar.', 'Selamat pagi, Pak/Bu. Apakah ada waktu 15 menit hari ini untuk membahas [topik]? Saya sudah siapkan ringkasannya.'],
  ['Minta bantuan', 'Minta data dari tim lain', 'Kirim datanya ya.', 'Halo, boleh saya minta data [nama data] untuk periode [periode]? Saya butuh sebelum [tanggal] untuk laporan. Terima kasih sebelumnya.'],
  ['Kritik', 'Memberi masukan ke rekan kerja', 'Kerjaan kamu jelek, harus diperbaiki.', 'Terima kasih sudah mengerjakan ini. Ada dua bagian yang bisa kita perbaiki bersama: [bagian 1] dan [bagian 2]. Bagaimana menurutmu?'],
  ['Kritik', 'Menolak ide di rapat', 'Ide itu nggak bakal jalan.', 'Idenya menarik. Saya khawatir di bagian [bagian] karena [alasan]. Bagaimana kalau kita coba versi yang lebih kecil dulu?'],
  ['Tidak tahu', 'Tidak tahu jawaban saat ditanya', 'Nggak tahu.', 'Saya belum punya jawabannya sekarang. Saya akan cari tahu dan kembali dengan jawabannya sebelum [waktu].'],
  ['Tidak tahu', 'Tidak paham instruksi', 'Saya bingung maksudnya apa.', 'Boleh saya pastikan lagi? Yang dimaksud adalah [pemahamanmu], apakah sudah tepat?'],
  ['Minta waktu', 'Butuh waktu lebih untuk tugas', 'Saya nggak sanggup selesai hari ini.', 'Agar hasilnya maksimal, saya butuh tambahan waktu sampai [tanggal]. Apakah jadwal itu masih memungkinkan?'],
  ['Minta waktu', 'Menunda rapat', 'Rapatnya diundur ya.', 'Mohon maaf, saya harus menggeser rapat kita ke [waktu baru] karena ada keperluan mendesak. Apakah waktu itu cocok untuk Anda?'],
  ['Negosiasi', 'Minta naik gaji', 'Gaji saya kurang, minta naik dong.', 'Saya ingin membahas penyesuaian gaji saya. Dalam [periode] terakhir, saya sudah [pencapaian]. Berdasarkan itu, saya berharap ada penyesuaian ke kisaran [angka].'],
  ['Negosiasi', 'Menawar harga ke vendor', 'Kemahalan, bisa lebih murah nggak?', 'Terima kasih atas penawarannya. Anggaran kami di kisaran [angka]. Apakah ada skema yang bisa disesuaikan dengan anggaran itu?'],
  ['Negosiasi', 'Menolak tawaran gaji yang rendah', 'Gajinya kekecilan, saya nggak mau.', 'Terima kasih atas tawarannya. Gaji yang ditawarkan masih di bawah ekspektasi saya berdasarkan pengalaman dan kisaran pasar. Apakah ada ruang untuk menyesuaikan?'],
  ['Ucapan', 'Berterima kasih ke klien', 'Makasih ya udah order.', 'Terima kasih atas kepercayaan Anda. Kami senang bisa membantu, dan jangan ragu menghubungi kami bila ada yang dibutuhkan.'],
  ['Ucapan', 'Menyampaikan kabar buruk ke klien', 'Maaf, pesanan Anda telat.', 'Kami mohon maaf, pesanan Anda mengalami keterlambatan karena [alasan]. Pesanan diperkirakan tiba tanggal [tanggal], dan kami akan memberi kabar bila ada perubahan.'],
  ['Ucapan', 'Pamit keluar dari grup kerja', 'Saya out dulu ya dari grup.', 'Terima kasih atas kerja samanya selama ini. Saya pamit dari grup ini karena [alasan]. Sukses selalu untuk semuanya.'],
];

export const KATEGORI = ['Semua', 'Menolak', 'Minta maaf', 'Follow-up', 'Minta bantuan', 'Kritik', 'Tidak tahu', 'Minta waktu', 'Negosiasi', 'Ucapan'];
export const KATEGORI_TAMBAH = KATEGORI.slice(1); // tanpa "Semua", untuk form tambah frasa

/** Kunci stabil satu frasa (dipakai untuk favorit & hapus frasa sendiri). */
export function kunciFrase(f) {
  return [f[0], f[1], f[3]].join('\n');
}

/** Validasi frasa baru dari user. Mengembalikan pesan salah, atau null bila oke. */
export function validasiFrase(f) {
  if (!Array.isArray(f) || f.length < 4) return 'Frasa tidak lengkap.';
  const [kat, situasi, biasa, pro] = f.map((x) => String(x == null ? '' : x).trim());
  if (!KATEGORI_TAMBAH.includes(kat)) return 'Pilih kategorinya dulu.';
  if (!situasi) return 'Isi situasinya dulu, misal: menolak lembur mendadak.';
  if (situasi.length > 120) return 'Situasinya kepanjangan, ringkas sampai 120 huruf.';
  if (!biasa) return 'Isi kalimat biasanya dulu.';
  if (!pro) return 'Isi kalimat profesionalnya dulu.';
  if (pro.length > 500) return 'Kalimat profesionalnya kepanjangan, ringkas sampai 500 huruf.';
  return null;
}

/** Gabungkan bank bawaan dengan frasa user (yang tidak valid dibuang,
    yang sudah ada — sama persis — tidak didobel). */
export function gabungFrase(custom) {
  const daftar = FRASA.slice();
  const kunci = new Set(daftar.map(kunciFrase));
  (Array.isArray(custom) ? custom : []).forEach((f) => {
    if (validasiFrase(f)) return;
    const bersih = f.map((x) => String(x).trim());
    if (kunci.has(kunciFrase(bersih))) return;
    kunci.add(kunciFrase(bersih));
    daftar.push(bersih);
  });
  return daftar;
}

/** Saring daftar ke frasa yang kuncinya ada di set favorit. */
export function filterFavorit(daftar, favKeys) {
  const set = new Set(Array.isArray(favKeys) ? favKeys : []);
  return daftar.filter((f) => set.has(kunciFrase(f)));
}

/** Filter bank kalimat berdasarkan kategori dan kata kunci (cocok di situasi
    atau di isi kalimat). Mengembalikan array frasa yang cocok.
    `daftar` default bank bawaan; `favKeys` dipakai saat kategori = Favorit. */
export function cariFrase(kategori, kata, daftar, favKeys) {
  const k = String(kata == null ? '' : kata).trim().toLowerCase();
  let sumber = Array.isArray(daftar) ? daftar : FRASA;
  if (kategori === 'Favorit') sumber = filterFavorit(sumber, favKeys);
  return sumber.filter((f) => {
    if (kategori && kategori !== 'Semua' && kategori !== 'Favorit' && f[0] !== kategori) return false;
    if (!k) return true;
    return (f[1] + ' ' + f[2] + ' ' + f[3]).toLowerCase().includes(k);
  });
}

export function render(root) {
  const K_CUSTOM = 'tool:cara-bilang-profesional:custom';
  const K_FAV = 'tool:cara-bilang-profesional:fav';
  const bacaLs = (k) => { try { const v = JSON.parse(localStorage.getItem(k) || '[]'); return Array.isArray(v) ? v : []; } catch (e) { return []; } };
  const tulisLs = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  let custom = bacaLs(K_CUSTOM).filter((f) => !validasiFrase(f));
  let fav = bacaLs(K_FAV).filter((k) => typeof k === 'string');
  const kunciCustom = () => new Set(custom.map(kunciFrase));
  const daftarSemua = () => gabungFrase(custom);

  const katS = T.select(['Semua', 'Favorit'].concat(KATEGORI_TAMBAH).map((k) => [k, k === 'Favorit' ? '⭐ Favoritku' : k]), 'Semua');
  const cariI = T.input('text', 'cth: telat, bayar, gaji', '');
  const box = T.out();

  const tampil = () => {
    const hasil = cariFrase(katS.value, cariI.value, daftarSemua(), fav);
    if (!hasil.length) {
      T.show(box, katS.value === 'Favorit'
        ? '<p class="warn">Belum ada favorit. Ketuk tombol ☆ di kalimat yang kamu suka untuk menyimpannya di sini.</p>'
        : '<p class="warn">Tidak ada kalimat yang cocok. Coba kata kunci lain, pilih kategori Semua, atau tambah frasamu sendiri di bawah.</p>');
      return;
    }
    const kc = kunciCustom();
    const favSet = new Set(fav);
    let html = '<p class="hint">' + hasil.length + ' kalimat ditemukan. Ketuk "Salin" untuk memakai kalimatnya, lalu ganti bagian dalam kurung siku dengan datamu. Ketuk ☆ untuk menyimpan ke favorit.</p>';
    hasil.forEach((f, i) => {
      const kunci = kunciFrase(f);
      const isFav = favSet.has(kunci);
      const buatanmu = kc.has(kunci);
      html += '<div class="kv" style="display:block;margin-bottom:12px"><span class="k">' + T.esc(f[1]) + ' <span class="hint">(' + T.esc(f[0]) + (buatanmu ? ' · buatanmu' : '') + ')</span></span>' +
        '<p style="margin:6px 0 2px"><span class="hint">Biasa: </span>' + T.esc(f[2]) + '</p>' +
        '<p style="margin:2px 0 6px"><b>Profesional: </b>' + T.esc(f[3]) + '</p>' +
        '<button type="button" class="btn" data-salin="' + i + '">Salin kalimat profesional</button> ' +
        '<button type="button" class="btn" data-fav="' + i + '" aria-label="' + (isFav ? 'Hapus dari favorit' : 'Simpan ke favorit') + '">' + (isFav ? '★ Favorit' : '☆ Favorit') + '</button>' +
        (buatanmu ? ' <button type="button" class="btn" data-hapus="' + i + '">Hapus</button>' : '') + '</div>';
    });
    T.show(box, html);
    box.querySelectorAll('[data-salin]').forEach((b) => {
      b.addEventListener('click', () => {
        const f = hasil[Number(b.getAttribute('data-salin'))];
        T.copy(f[3]);
      });
    });
    box.querySelectorAll('[data-fav]').forEach((b) => {
      b.addEventListener('click', () => {
        const f = hasil[Number(b.getAttribute('data-fav'))];
        const kunci = kunciFrase(f);
        if (fav.includes(kunci)) { fav = fav.filter((k) => k !== kunci); T.toast('Dihapus dari favorit.'); }
        else { fav.push(kunci); T.toast('Disimpan ke favorit.'); }
        tulisLs(K_FAV, fav);
        tampil();
      });
    });
    box.querySelectorAll('[data-hapus]').forEach((b) => {
      b.addEventListener('click', () => {
        const f = hasil[Number(b.getAttribute('data-hapus'))];
        const kunci = kunciFrase(f);
        custom = custom.filter((c) => kunciFrase(c) !== kunci);
        fav = fav.filter((k) => k !== kunci);
        tulisLs(K_CUSTOM, custom);
        tulisLs(K_FAV, fav);
        T.toast('Frasa dihapus.');
        tampil();
      });
    });
  };

  katS.addEventListener('change', tampil);
  cariI.addEventListener('input', tampil);

  // ---- Form tambah frasa sendiri ----
  const tKat = T.select(KATEGORI_TAMBAH.map((k) => [k, k]), 'Menolak');
  const tSituasi = T.input('text', 'cth: menolak lembur mendadak', '');
  const tBiasa = T.input('text', 'cth: Nggak bisa, saya mau pulang.', '');
  const tPro = T.input('text', 'cth: Mohon maaf, saya sudah ada janji malam ini. Bisakah kita lanjutkan besok pagi?', '');
  const tambahBox = T.out();
  const tambah = () => {
    const f = [tKat.value, tSituasi.value, tBiasa.value, tPro.value];
    const salah = validasiFrase(f);
    if (salah) { T.show(tambahBox, '<p class="err">' + T.esc(salah) + '</p>'); return; }
    const bersih = f.map((x) => String(x).trim());
    if (daftarSemua().some((d) => kunciFrase(d) === kunciFrase(bersih))) {
      T.show(tambahBox, '<p class="warn">Frasa itu sudah ada di daftar.</p>'); return;
    }
    custom.push(bersih);
    tulisLs(K_CUSTOM, custom);
    tSituasi.value = ''; tBiasa.value = ''; tPro.value = '';
    T.show(tambahBox, '<p class="hint">Frasamu tersimpan dan langsung bisa dicari. Frasa buatanmu tersimpan di perangkat ini saja.</p>');
    katS.value = 'Semua'; cariI.value = '';
    tampil();
  };

  root.appendChild(T.el('<p class="note">Bingung merangkai kalimat sopan di tempat kerja? Cari situasimu di bawah, lalu salin kalimat profesionalnya. Ganti bagian dalam kurung siku [seperti ini] dengan datamu sendiri.</p>'));
  root.appendChild(T.field('Kategori', katS, 'Pilih situasi yang paling dekat dengan kebutuhanmu, atau lihat favoritmu.'));
  root.appendChild(T.field('Cari kalimat', cariI, 'Ketik kata kunci, misal: telat, bayar, gaji.'));
  root.appendChild(box);
  root.appendChild(T.el('<p class="mut" style="margin:18px 0 6px;font-weight:600">Tambah frasamu sendiri</p>'));
  root.appendChild(T.field('Kategori', tKat));
  root.appendChild(T.field('Situasi', tSituasi, 'Kapan kalimat ini dipakai.'));
  root.appendChild(T.field('Kalimat biasa', tBiasa, 'Versi apa adanya, seperti yang biasa kamu ucapkan.'));
  root.appendChild(T.field('Kalimat profesional', tPro, 'Versi sopan dan profesionalnya.'));
  root.appendChild(T.row(T.btn('Simpan frasaku', tambah, true)));
  root.appendChild(tambahBox);
  tampil();
}
