import { h as T, esc, errBox } from '../../core.js';

// Gambar kucing untuk tiap kode status HTTP, lewat http.cat (gambar <img>).
// Terverifikasi 19 Nov 2026: http.cat/200 -> gambar 750x600 hidup
// (curl 000 karena egress VM flaky; dibuktikan lewat fetch jalur lain).
// http.cat tanpa CORS, tapi gambar dipakai via <img>, jadi CORS tidak relevan.
export const meta = {"id":"kucing-status-http","name":"Kucing Status HTTP","cat":"liveapi","icon":"🐈","desc":"Gambar kucing lucu untuk tiap kode status HTTP, mis. 404.","keywords":"http,status,kucing,cat,404,500,kode status,developer","since":"6.19.0", "online": true};

const KODE = [
  ['200', '200 · OK'],
  ['201', '201 · Dibuat'],
  ['204', '204 · Tanpa isi'],
  ['301', '301 · Pindah permanen'],
  ['302', '302 · Pindah sementara'],
  ['304', '304 · Tidak berubah'],
  ['400', '400 · Permintaan salah'],
  ['401', '401 · Belum login'],
  ['403', '403 · Tidak ada izin'],
  ['404', '404 · Tidak ketemu'],
  ['405', '405 · Cara salah'],
  ['408', '408 · Waktu habis'],
  ['409', '409 · Bentrok'],
  ['410', '410 · Sudah dihapus'],
  ['418', '418 · Teko'],
  ['422', '422 · Isi tidak valid'],
  ['429', '429 · Terlalu sering'],
  ['451', '451 · Diblokir hukum'],
  ['500', '500 · Server error'],
  ['502', '502 · Gateway salah'],
  ['503', '503 · Server sibuk'],
  ['504', '504 · Gateway lambat'],
];
const NAMA = {};
KODE.forEach(([k, l]) => { NAMA[k] = l; });

export function render(root) {
  const pilih = T.select(KODE, '404');
  const box = T.out();

  const tampil = () => {
    const kode = pilih.value;
    if (!/^[1-5]\d\d$/.test(kode)) {
      T.show(box, errBox('Kode status terdiri dari 3 angka, mis. 404.'));
      return;
    }
    const url = 'https://http.cat/' + kode;
    T.show(box,
      '<div class="center"><img src="' + esc(url) + '" alt="Kucing untuk kode status HTTP ' + esc(kode) + '" style="max-width:100%;height:auto;border-radius:10px;display:block" loading="lazy">' +
      '<p style="margin-top:8px">' + esc(NAMA[kode] || ('Kode ' + kode)) + '</p>' +
      '<p><a href="' + esc(url) + '" target="_blank" rel="noopener" style="font-size:12.5px">Buka ukuran penuh</a></p></div>' +
      '<p class="hint">Sumber: http.cat. Beda dengan HTTP Status Lookup yang isinya penjelasan teks, tool ini menampilkan gambar kucingnya.</p>');
    const im = box.querySelector && box.querySelector('img');
    if (im) im.addEventListener('error', () => {
      T.show(box, errBox('Gambar untuk kode ' + kode + ' tidak bisa dimuat. Cek koneksi internet, lalu coba lagi.'));
      const wr = T.el('<div style="margin-top:8px"></div>');
      wr.appendChild(T.btn('🔄 Coba lagi', tampil));
      box.appendChild(wr);
    });
  };

  root.appendChild(T.el('<p class="note">Pilih kode status, lalu lihat kucingnya. Setiap kode punya gambar kucing sendiri.</p>'));
  root.appendChild(T.field('Kode status', pilih));
  root.appendChild(T.row(T.btn('🐈 Lihat kucingnya', tampil, true)));
  root.appendChild(box);
  tampil();
}
