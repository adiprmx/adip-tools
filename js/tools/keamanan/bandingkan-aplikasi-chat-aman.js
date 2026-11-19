import { h as T } from '../../core.js';

// Perbandingan aplikasi chat dari sisi keamanan dan privasi, dicek dari
// dokumentasi resmi tiap aplikasi pada November 2026. "Enkripsi ujung ke
// ujung" artinya hanya pengirim dan penerima yang bisa membaca pesan,
// penyedia layanan pun tidak bisa.
export const APLIKASI = [
  { nama: 'Signal', e2ee: 'Ya, semua chat', grup: 'Ya', nomor: 'Ya, tapi bisa disembunyikan dengan username', sumber: 'Terbuka (klien dan server)', audit: 'Ya', hilang: 'Ya', cadangan: 'Terenkripsi (opsional)', biaya: 'Gratis', pengelola: 'Yayasan nirlaba, Amerika', nilai: 'Pilihan paling aman untuk kebanyakan orang. Enkripsi selalu aktif, kodenya terbuka, dan pengelolanya nirlaba.' },
  { nama: 'WhatsApp', e2ee: 'Ya, semua chat', grup: 'Ya', nomor: 'Ya', sumber: 'Tertutup', audit: 'Protokolnya diaudit, aplikasinya tidak terbuka', hilang: 'Ya', cadangan: 'Terenkripsi (opsional, harus diaktifkan)', biaya: 'Gratis', pengelola: 'Meta', nilai: 'Isi chat terenkripsi, tapi Meta mengumpulkan data siapa bicara dengan siapa dan kapan. Cadangan chat tidak terenkripsi kecuali diaktifkan manual.' },
  { nama: 'Telegram', e2ee: 'Tidak, hanya Secret Chat', grup: 'Tidak', nomor: 'Ya', sumber: 'Sebagian (klien saja)', audit: 'Terbatas', hilang: 'Ya, di Secret Chat', cadangan: 'Chat tersimpan di server Telegram', biaya: 'Gratis', pengelola: 'Telegram (Dubai)', nilai: 'Chat biasa TIDAK terenkripsi ujung ke ujung dan tersimpan di server Telegram. Secret Chat hanya 1 lawan 1 dan hanya di satu perangkat.' },
  { nama: 'iMessage', e2ee: 'Ya, antar perangkat Apple', grup: 'Ya', nomor: 'Apple ID / nomor HP', sumber: 'Tertutup', audit: 'Protokol PQ3 dipublikasi', hilang: 'Tidak ada pesan hilang otomatis', cadangan: 'Terenkripsi bila Advanced Data Protection aktif', biaya: 'Gratis', pengelola: 'Apple', nilai: 'Aman antar perangkat Apple. Chat ke Android tidak terenkripsi ujung ke ujung.' },
  { nama: 'Threema', e2ee: 'Ya, semua chat', grup: 'Ya', nomor: 'Tidak, pakai ID acak', sumber: 'Terbuka (klien)', audit: 'Ya', hilang: 'Ya', cadangan: 'Terenkripsi (Threema Safe)', biaya: 'Bayar sekali', pengelola: 'Threema, Swiss', nilai: 'Tidak butuh nomor HP atau email sama sekali. Cocok bila kamu tidak mau identitasmu terkait dengan nomor.' },
  { nama: 'Session', e2ee: 'Ya, chat privat', grup: 'Ya (privat), komunitas tidak', nomor: 'Tidak, pakai ID acak', sumber: 'Terbuka', audit: 'Ya', hilang: 'Ya', cadangan: 'Frasa pemulihan', biaya: 'Gratis', pengelola: 'Yayasan, Swiss', nilai: 'Tanpa nomor HP dan tanpa server pusat. Catatan: versi sekarang belum punya forward secrecy, jadi kunci yang bocor bisa membuka pesan lama.' },
  { nama: 'Element (Matrix)', e2ee: 'Ya, chat privat', grup: 'Ya (ruang privat)', nomor: 'Tidak, pakai akun server (sering email)', sumber: 'Terbuka', audit: 'Ya', hilang: 'Tergantung server', cadangan: 'Kunci tersimpan di perangkat', biaya: 'Gratis', pengelola: 'Terdesentralisasi (banyak server)', nilai: 'Tidak ada satu perusahaan yang mengendalikan semuanya. Perlu sedikit belajar soal memilih server.' },
];

export const BARIS = [
  ['e2ee', 'Enkripsi ujung ke ujung aktif sendiri'],
  ['grup', 'Grup terenkripsi'],
  ['nomor', 'Butuh nomor HP'],
  ['sumber', 'Kode terbuka'],
  ['audit', 'Audit keamanan independen'],
  ['hilang', 'Pesan bisa hilang otomatis'],
  ['cadangan', 'Cadangan chat'],
  ['biaya', 'Biaya'],
  ['pengelola', 'Pengelola'],
];

export function bandingkan(namaList) {
  return APLIKASI.filter((a) => namaList.includes(a.nama));
}

export const meta = { "id": "bandingkan-aplikasi-chat-aman", "name": "Bandingkan Aplikasi Chat Aman", "cat": "keamanan", "icon": "💬", "desc": "Bandingkan keamanan Signal, WhatsApp, Telegram, dan lainnya: enkripsi, nomor HP, dan privasi.", "keywords": "chat aman,signal,whatsapp,telegram,enkripsi,privasi,e2ee,threema,session", "since": "6.18.0" };

export function render(root) {
  const pilih = APLIKASI.map((a) => a.nama);
  const cek = {};
  const box = T.out();

  const tampilkan = () => {
    const aktif = APLIKASI.filter((a) => cek[a.nama].checked);
    if (aktif.length === 0) {
      T.show(box, '<p class="hint">Pilih minimal satu aplikasi untuk dibandingkan.</p>');
      return;
    }
    const head = '<tr><th></th>' + aktif.map((a) => '<th style="text-align:left;min-width:140px">' + T.esc(a.nama) + '</th>').join('') + '</tr>';
    const rows = BARIS.map(([k, label]) =>
      '<tr><td><b>' + T.esc(label) + '</b></td>' + aktif.map((a) => '<td>' + T.esc(a[k]) + '</td>').join('') + '</tr>').join('');
    const nilai = aktif.map((a) =>
      '<p class="hint" style="margin:8px 0"><b>' + T.esc(a.nama) + ':</b> ' + T.esc(a.nilai) + '</p>').join('');
    T.show(box,
      '<div style="overflow-x:auto"><table class="tbl"><thead>' + head + '</thead><tbody>' + rows + '</tbody></table></div>' +
      nilai +
      '<p class="hint">Enkripsi ujung ke ujung artinya hanya pengirim dan penerima yang bisa membaca pesan. ' +
      'Aplikasi yang aman saja belum cukup: aktifkan kunci layar, verifikasi nomor kontak penting, dan jangan bagikan kode verifikasi ke siapa pun.</p>' +
      '<p class="hint">Dicek November 2026 dari dokumentasi resmi tiap aplikasi. Fitur bisa berubah, cek di situs resmi aplikasinya bila ragu.</p>');
  };

  const wrap = T.el('<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px"></div>');
  pilih.forEach((nama) => {
    const lab = document.createElement('label');
    lab.style.cssText = 'display:inline-flex;align-items:center;gap:5px;font-size:14px;padding:6px 10px;border:1px solid var(--line);border-radius:99px;cursor:pointer';
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = true;
    cb.addEventListener('change', tampilkan);
    cek[nama] = cb;
    lab.appendChild(cb);
    lab.appendChild(document.createTextNode(nama));
    wrap.appendChild(lab);
  });
  root.appendChild(T.el('<p class="hint" style="margin:0 0 8px">Pilih aplikasi yang mau dibandingkan:</p>'));
  root.appendChild(wrap);
  root.appendChild(box);
  tampilkan();
}
