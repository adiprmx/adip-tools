import { h as T } from '../../core.js';

// Checklist privasi 30 hari: satu langkah kecil per hari selama sebulan.
// Progres tersimpan di perangkat (localStorage), tidak dikirim ke mana-mana.
export const LANGKAH_30_HARI = [
  // Minggu 1: kata sandi dan akun
  { hari: 1, minggu: 'Minggu 1: Kata sandi dan akun', judul: 'Ganti kata sandi email utama', cara: 'Buat kata sandi panjang yang belum pernah dipakai di tempat lain. Email adalah kunci semua akunmu.' },
  { hari: 2, minggu: 'Minggu 1: Kata sandi dan akun', judul: 'Aktifkan verifikasi dua langkah di email', cara: 'Pakai aplikasi authenticator bila tersedia, bukan SMS saja.' },
  { hari: 3, minggu: 'Minggu 1: Kata sandi dan akun', judul: 'Pasang pengelola kata sandi', cara: 'Simpan semua kata sandi di satu pengelola yang terkunci kata sandi utama yang kuat.' },
  { hari: 4, minggu: 'Minggu 1: Kata sandi dan akun', judul: 'Ganti kata sandi yang dipakai ulang', cara: 'Cek akun yang kata sandinya sama dengan akun lain, lalu ganti satu per satu.' },
  { hari: 5, minggu: 'Minggu 1: Kata sandi dan akun', judul: 'Aktifkan verifikasi dua langkah di bank dan dompet digital', cara: 'Prioritaskan yang berhubungan dengan uang.' },
  { hari: 6, minggu: 'Minggu 1: Kata sandi dan akun', judul: 'Cek perangkat yang masuk ke akunmu', cara: 'Di pengaturan akun Google, WhatsApp, dan media sosial, keluarkan perangkat yang tidak kamu kenal.' },
  { hari: 7, minggu: 'Minggu 1: Kata sandi dan akun', judul: 'Hapus akun lama yang tidak dipakai', cara: 'Akun yang dibiarkan bisa jadi jalan masuk. Hapus yang sudah tidak perlu.' },
  // Minggu 2: HP dan aplikasi
  { hari: 8, minggu: 'Minggu 2: HP dan aplikasi', judul: 'Kunci layar dengan PIN atau sidik jari', cara: 'Jangan pakai pola yang mudah ditebak atau tanpa kunci sama sekali.' },
  { hari: 9, minggu: 'Minggu 2: HP dan aplikasi', judul: 'Perbarui sistem dan aplikasi', cara: 'Pembaruan sering menutup celah keamanan. Aktifkan pembaruan otomatis.' },
  { hari: 10, minggu: 'Minggu 2: HP dan aplikasi', judul: 'Hapus aplikasi yang tidak dipakai', cara: 'Aplikasi yang menganggur tetap bisa mengakses datamu.' },
  { hari: 11, minggu: 'Minggu 2: HP dan aplikasi', judul: 'Cek izin aplikasi', cara: 'Cabut izin lokasi, kamera, dan mikrofon dari aplikasi yang tidak butuh.' },
  { hari: 12, minggu: 'Minggu 2: HP dan aplikasi', judul: 'Matikan pelacakan iklan', cara: 'Di pengaturan privasi HP, matikan personalisasi iklan dan reset ID iklan.' },
  { hari: 13, minggu: 'Minggu 2: HP dan aplikasi', judul: 'Aktifkan cari perangkat', cara: 'Supaya HP yang hilang bisa dilacak, dikunci, atau dihapus dari jauh.' },
  { hari: 14, minggu: 'Minggu 2: HP dan aplikasi', judul: 'Cadangkan data penting', cara: 'Foto dan dokumen penting dicadangkan ke tempat yang aman dan terenkripsi.' },
  // Minggu 3: browser dan jejak
  { hari: 15, minggu: 'Minggu 3: Browser dan jejak', judul: 'Hapus riwayat dan cookie lama', cara: 'Bersihkan cookie pelacak dari situs yang tidak kamu kunjungi lagi.' },
  { hari: 16, minggu: 'Minggu 3: Browser dan jejak', judul: 'Pasang pemblokir pelacak', cara: 'Ekstensi pemblokir iklan dan pelacak mengurangi jejakmu di situs.' },
  { hari: 17, minggu: 'Minggu 3: Browser dan jejak', judul: 'Cek akun yang masuk lewat Google atau Facebook', cara: 'Di pengaturan akun, cabut akses situs dan aplikasi yang tidak kamu kenal.' },
  { hari: 18, minggu: 'Minggu 3: Browser dan jejak', judul: 'Ganti mesin pencari ke yang lebih menjaga privasi', cara: 'Ada mesin pencari yang tidak menyimpan riwayat pencarianmu.' },
  { hari: 19, minggu: 'Minggu 3: Browser dan jejak', judul: 'Cek pengaturan privasi media sosial', cara: 'Batasi siapa yang bisa melihat postingan, daftar teman, dan lokasimu.' },
  { hari: 20, minggu: 'Minggu 3: Browser dan jejak', judul: 'Hapus postingan lama yang memuat data pribadi', cara: 'Foto KTP, alamat rumah, dan nomor HP sebaiknya tidak ada di publik.' },
  { hari: 21, minggu: 'Minggu 3: Browser dan jejak', judul: 'Matikan lokasi di foto', cara: 'Foto yang dibagikan bisa membawa lokasi. Matikan lokasi kamera atau hapus sebelum membagikan.' },
  // Minggu 4: data dan kebiasaan
  { hari: 22, minggu: 'Minggu 4: Data dan kebiasaan', judul: 'Cek apakah emailmu bocor', cara: 'Cek di layanan pengecek kebocoran data. Bila bocor, ganti kata sandi akun itu.' },
  { hari: 23, minggu: 'Minggu 4: Data dan kebiasaan', judul: 'Berhenti berlangganan email yang tidak dibaca', cara: 'Tombol berhenti berlangganan ada di bawah email. Mengurangi spam dan pelacakan.' },
  { hari: 24, minggu: 'Minggu 4: Data dan kebiasaan', judul: 'Pisahkan email untuk hal penting dan untuk daftar', cara: 'Satu email untuk bank dan akun penting, satu lagi untuk pendaftaran dan belanja.' },
  { hari: 25, minggu: 'Minggu 4: Data dan kebiasaan', judul: 'Pelajari cara mengenali pesan penipuan', cara: 'Waspadai pesan yang mendesak, menawarkan hadiah, atau meminta kode verifikasi.' },
  { hari: 26, minggu: 'Minggu 4: Data dan kebiasaan', judul: 'Aktifkan peringatan masuk di akun penting', cara: 'Supaya kamu tahu bila ada yang masuk dari perangkat baru.' },
  { hari: 27, minggu: 'Minggu 4: Data dan kebiasaan', judul: 'Enkripsi cadangan chat', cara: 'Di WhatsApp, aktifkan cadangan terenkripsi ujung ke ujung.' },
  { hari: 28, minggu: 'Minggu 4: Data dan kebiasaan', judul: 'Cek izin lokasi yang aktif', cara: 'Matikan riwayat lokasi di akun Google bila tidak perlu.' },
  { hari: 29, minggu: 'Minggu 4: Data dan kebiasaan', judul: 'Buat rencana bila akun diretas', cara: 'Catat langkahnya: ganti kata sandi, cabut sesi, lapor ke penyedia layanan.' },
  { hari: 30, minggu: 'Minggu 4: Data dan kebiasaan', judul: 'Rayakan dan jadwalkan cek berkala', cara: 'Kamu sudah selesai. Ulangi cek ini tiap beberapa bulan, dan ajari orang terdekatmu.' },
];

export function hitungProgress(state) {
  const selesai = LANGKAH_30_HARI.filter((l) => state[l.hari]).length;
  return { selesai, total: LANGKAH_30_HARI.length, persen: Math.round((selesai / LANGKAH_30_HARI.length) * 100) };
}

const LS_KEY = 'adip-tools:checklist-privasi-30-hari:v1';

export const meta = { "id": "checklist-privasi-30-hari", "name": "Checklist Privasi 30 Hari", "cat": "keamanan", "icon": "✅", "desc": "Satu langkah kecil per hari selama 30 hari untuk mengamankan akun, HP, dan datamu.", "keywords": "privasi,checklist,30 hari,keamanan akun,kata sandi,verifikasi dua langkah", "since": "6.18.0" };

export function render(root) {
  let state = {};
  try { state = JSON.parse(localStorage.getItem(LS_KEY) || '{}') || {}; } catch (e) { state = {}; }
  const simpan = () => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch (e) {}
  };

  const progress = T.el('<div style="margin-bottom:14px"></div>');
  const daftar = T.el('<div></div>');

  const gambarProgress = () => {
    const p = hitungProgress(state);
    progress.innerHTML = '<p style="font-weight:700;margin:0 0 4px">Progres: ' + p.selesai + ' dari ' + p.total + ' langkah (' + p.persen + '%)</p>' +
      '<div style="height:10px;background:var(--line,#ddd);border-radius:99px;overflow:hidden">' +
      '<div style="height:100%;width:' + p.persen + '%;background:var(--acc,#ff6b4a);border-radius:99px"></div></div>' +
      (p.selesai === p.total ? '<p class="hint" style="margin:6px 0 0">Semua langkah selesai. Privasi dan akunmu jauh lebih aman sekarang.</p>' : '');
  };

  let mingguAktif = '';
  LANGKAH_30_HARI.forEach((l) => {
    if (l.minggu !== mingguAktif) {
      mingguAktif = l.minggu;
      daftar.appendChild(T.el('<p style="font-weight:700;margin:16px 0 6px">' + T.esc(l.minggu) + '</p>'));
    }
    const baris = T.el('<label style="display:flex;gap:10px;align-items:flex-start;padding:8px 0;border-bottom:1px solid var(--line);cursor:pointer"></label>');
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = !!state[l.hari];
    cb.style.marginTop = '3px';
    cb.addEventListener('change', () => {
      state[l.hari] = cb.checked;
      simpan();
      gambarProgress();
    });
    const teks = T.el('<span><b>Hari ' + l.hari + ': ' + T.esc(l.judul) + '</b><br><span class="dim" style="font-size:13px">' + T.esc(l.cara) + '</span></span>');
    baris.appendChild(cb);
    baris.appendChild(teks);
    daftar.appendChild(baris);
  });

  const reset = T.btn('Ulangi dari awal', () => {
    state = {};
    simpan();
    daftar.querySelectorAll('input[type=checkbox]').forEach((c) => { c.checked = false; });
    gambarProgress();
  });

  root.appendChild(T.el('<p class="hint" style="margin:0 0 12px">Satu langkah kecil per hari. Centang yang sudah dilakukan, progresmu tersimpan di perangkat ini.</p>'));
  root.appendChild(progress);
  root.appendChild(daftar);
  root.appendChild(T.el('<div style="margin-top:14px"></div>'));
  root.lastChild.appendChild(reset);
  gambarProgress();
}
