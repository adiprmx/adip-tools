import { h as T, utils } from '../../core.js?v=6.13.0';

export const meta = {"id":"beri-masukan","name":"Beri Masukan","cat":"produktivitas","icon":"💬","desc":"Laporkan masalah atau beri saran untuk Adip Tools — lewat email atau GitHub.","keywords":"masukan,feedback,lapor,masalah,bug,saran,github,email","since":"6.12.0"};

/*
 * TIDAK ADA BACKEND: situs ini 100% statis, jadi masukan tidak dikirim dari
 * halaman ini. Pengguna menulis laporannya di sini, lalu mengirimnya sendiri
 * lewat aplikasi emailnya atau lewat GitHub Issues. Tidak ada data yang
 * keluar dari perangkat sebelum pengguna menekan tombol kirim.
 *
 * ALAMAT EMAIL: belum ada alamat email kontak publik di repo maupun di
 * profil GitHub pemilik (dicek 15 Nov 2026). Isi EMAIL_TUJUAN di bawah
 * dengan alamat email publik pemilik sebelum tombol email diaktifkan.
 * Selama masih kosong, tombol email memberi tahu pengguna dan mengarahkan
 * ke GitHub Issues / tombol salin.
 */
const EMAIL_TUJUAN = '';
const REPO_ISSUES = 'https://github.com/adiprmx/adip-tools/issues/new';

const JENIS = [
  ['bug', '🐞 Laporan masalah'],
  ['fitur', '💡 Saran fitur baru'],
  ['konten', '📝 Masukan soal isi/tulisan'],
  ['lain', '💬 Masukan umum'],
];

const LABEL_JENIS = { bug: 'Laporan masalah', fitur: 'Saran fitur baru', konten: 'Masukan soal isi/tulisan', lain: 'Masukan umum' };

function infoPerangkat() {
  try {
    const ua = navigator.userAgent || '';
    const hp = /Android|iPhone|iPad|Mobile/i.test(ua) ? 'HP' : 'Komputer';
    return hp + ' — ' + ua;
  } catch (e) { return ''; }
}

export function render(root) {
  const jenis = T.select(JENIS, 'bug');
  const namaTool = T.input('text', 'Mis. Kalkulator BMI (kosongkan bila bukan soal satu tool)');
  const isi = T.ta(6, 'Ceritakan dengan kata-kata sendiri...\n\nKalau ada masalah, tulis: apa yang kamu lakukan, apa yang terjadi, dan apa yang seharusnya terjadi.');
  const hasil = T.out();

  const susun = () => {
    const j = jenis.value || 'lain';
    const tool = namaTool.value.trim();
    const teks = isi.value.trim();
    const judul = '[' + LABEL_JENIS[j] + ']' + (tool ? ' ' + tool : '') + (teks ? ' — ' + teks.split('\n')[0].slice(0, 60) : '');
    const baris = [];
    baris.push('Jenis: ' + LABEL_JENIS[j]);
    if (tool) baris.push('Tool: ' + tool);
    baris.push('');
    baris.push(teks || '(belum ada keterangan)');
    baris.push('');
    baris.push('---');
    const perangkat = infoPerangkat();
    if (perangkat) baris.push('Perangkat: ' + perangkat);
    baris.push('Halaman: ' + location.href);
    return { judul, isi: baris.join('\n'), kosong: !teks };
  };

  const kirimEmail = () => {
    const lap = susun();
    if (lap.kosong) { T.toast('Tulis dulu masukanmu di kotak di atas'); isi.focus(); return; }
    if (!EMAIL_TUJUAN) {
      T.toast('Alamat email pengembang belum tersedia — pakai GitHub Issues atau tombol salin di bawah');
      return;
    }
    const href = 'mailto:' + EMAIL_TUJUAN +
      '?subject=' + encodeURIComponent(lap.judul) +
      '&body=' + encodeURIComponent(lap.isi);
    location.href = href;
    T.toast('Aplikasi email kamu dibuka — tinggal tekan kirim');
  };

  const bukaGithub = () => {
    const lap = susun();
    if (lap.kosong) { T.toast('Tulis dulu masukanmu di kotak di atas'); isi.focus(); return; }
    const url = REPO_ISSUES +
      '?title=' + encodeURIComponent(lap.judul) +
      '&body=' + encodeURIComponent(lap.isi);
    window.open(url, '_blank', 'noopener');
    T.toast('Halaman GitHub Issues dibuka di tab baru');
  };

  const salin = T.copyBtn(() => {
    const lap = susun();
    if (lap.kosong) { T.toast('Tulis dulu masukanmu di kotak di atas'); isi.focus(); return ''; }
    return lap.judul + '\n\n' + lap.isi;
  }, 'Salin isi laporan');

  root.appendChild(T.el('<p class="hint">Ketemu yang rusak, atau ada ide biar Adip Tools makin enak dipakai? Tulis di sini, lalu kirim lewat email atau GitHub. Tidak ada yang terkirim otomatis — kamu yang pegang tombol kirimnya.</p>'));
  root.appendChild(T.field('Jenis masukan', jenis));
  root.appendChild(T.field('Tool yang dimaksud (kalau ada)', namaTool));
  root.appendChild(T.field('Ceritamu', isi));
  root.appendChild(T.row(T.btn('Kirim lewat email', kirimEmail, true)));
  root.appendChild(T.row(T.btn('Buka GitHub Issues', bukaGithub)));
  root.appendChild(T.row(salin));
  root.appendChild(hasil);

  root.appendChild(T.el(
    '<div class="card" style="margin-top:16px">' +
    '<h3 style="margin-top:0">Biar laporanmu gampang ditindaklanjuti</h3>' +
    '<ol style="margin:0;padding-left:20px;line-height:1.7;font-size:13.5px">' +
    '<li><b>Sebutkan tool-nya</b> — nama tool yang bermasalah atau yang mau ditambah fiturnya.</li>' +
    '<li><b>Ceritakan apa yang terjadi</b> — apa yang kamu lakukan, apa hasilnya, dan apa yang kamu harapkan.</li>' +
    '<li><b>Lampirkan tangkapan layar</b> kalau bisa — satu gambar sering lebih jelas dari seribu kata.</li>' +
    '<li><b>Tulis HP &amp; browser yang dipakai</b> kalau masalahnya cuma muncul di perangkat tertentu (info perangkat sudah otomatis ikut di laporanmu).</li>' +
    '</ol>' +
    '<p class="mut" style="margin-bottom:0">Masukanmu dibaca langsung oleh pembuat Adip Tools. Terima kasih sudah meluangkan waktu. 🙏</p>' +
    '</div>'));
  root.appendChild(T.el('<p class="mut center" style="font-size:12px">Laporan lewat GitHub bersifat publik — jangan cantumkan data pribadi seperti nomor HP atau kata sandi.</p>'));
}
