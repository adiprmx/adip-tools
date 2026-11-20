import { h as T } from '../../core.js';

// Wordlist Bahasa Indonesia umum (tanpa spasi, huruf kecil) untuk passphrase.
const _WORDS_RAW = ('kucing anjing kelinci rumah mobil motor sepeda buku meja kursi pintu jendela lampu ' +
'air api tanah langit bintang bulan matahari laut sungai gunung hutan pohon bunga daun buah nasi kopi ' +
'teh susu roti ikan ayam telur garam gula pisang apel jeruk mangga durian rambutan salak kelapa padi ' +
'sawah ladang pasar toko sekolah kantor jalan jembatan kota desa pulau pantai danau awan hujan angin ' +
'petir pelangi ombak pasir batu emas perak besi kayu kain baju celana sepatu topi tas dompet kunci jam ' +
'ponsel komputer radio kamera gitar piano drum bola boneka kapal pesawat kereta bus truk becak perahu ' +
'layang layangan wayang topeng payung sapu ember gayung handuk sabun sikat cermin gunting pisau sendok ' +
'garpu piring gelas mangkok teko wajan panci oven kulkas kipas kasur bantal selimut lemari cermin jam dinding ' +
'lari makan minum tidur bangun duduk berdiri lompat renang terbang baca tulis gambar nyanyi menari main ' +
'kerja belajar masak tanam panen memancing berdagang menyapu mencuci menjahit menendang melempar menangkap ' +
'mendorong menarik mengangkat membawa mengantar menjemput mencari menemukan bersembunyi berlari berjalan ' +
'bernyanyi tertawa menangis tersenyum berpikir bermimpi bangun tidur mandi gosok sikat siram pelihara rawat ' +
'besar kecil tinggi rendah panjang pendek lebar sempit cepat lambat kuat lemah panas dingin terang gelap ' +
'baru lama muda tua baik rajin malas pintar cantik tampan lucu sedih senang marah takut berani tenang ramai ' +
'sepi bersih kotor manis pahit asin asam pedas segar wangi sunyi dalam jauh dekat penuh kosong berat ringan ' +
'keras lunak tajam licin kasar halus basah kering merah kuning hijau biru putih hitam ungu oranye coklat ' +
'bulat runcing datar tegak lurus manis gurih renyah empuk kenyal hangat sejuk dingin beku cair padat ' +
'pagi siang sore malam fajar senja subuh sahur buka puasa lebaran natal tahun imlek waisak nyepi galungan ' +
'sekaten dugderan takbir bedug gong gamelan angklung sasando kolintang tifa rebana seruling gendang kecapi ' +
'suling arung jeram paralayang selancar mendaki berkemah memancing berburu bertani nelayan pedagang guru ' +
'dokter perawat polisi tentara pilot sopir masinis nahkoda petani tukang seniman penyanyi aktor penulis ' +
'jurnalis arsitek insinyur koki barista montir').split(' ').filter((w) => /^[a-z]+$/.test(w));
const WORDS = [...new Set(_WORDS_RAW)];

const SYMBOLS = '!@#$%^&*?';

// Estimasi entropi passphrase (bit, dibulatkan). Diekspor agar bisa diuji
// di Node. Rumus jujur: tiap kata = log2(jumlah kata unik); kapitalisasi
// deterministik = +0 bit; tiap angka acak = log2(10); 1 simbol = log2(9).
export function estimasiEntropi(jmlKata, jmlAngka, pakaiSimbol) {
  let bits = jmlKata * Math.log2(WORDS.length);
  if (jmlAngka) bits += jmlAngka * Math.log2(10);
  if (pakaiSimbol) bits += Math.log2(SYMBOLS.length);
  return Math.round(bits);
}

function rand(n) {
  const a = new Uint32Array(1);
  crypto.getRandomValues(a);
  return a[0] % n;
}

export const meta = {"id": "passphrase", "name": "Passphrase Indonesia", "cat": "keamanan", "icon": "🔑", "desc": "Passphrase kata Indonesia yang kuat.", "keywords": "passphrase,kata,sandi,aman,indonesia"};
export function render(root) {

    const jml = T.select([['3', '3 kata'], ['4', '4 kata'], ['5', '5 kata'], ['6', '6 kata'], ['7', '7 kata'], ['8', '8 kata']], '4');
    const pisah = T.select([['-', 'Tanda hubung (-)'], ['_', 'Underscore (_)'], [' ', 'Spasi'], ['', 'Tanpa pemisah']], '-');
    const kapital = T.select([['0', 'huruf kecil semua'], ['1', 'Huruf pertama kapital']], '0');
    const angka = T.select([['0', 'Tidak'], ['1', 'Ya, 1 angka'], ['2', 'Ya, 2 angka']], '1');
    const simbol = T.select([['0', 'Tidak'], ['1', 'Ya, 1 simbol']], '0');
    const box = T.out();

    const buat = () => {
      const n = parseInt(jml.value, 10), sep = pisah.value;
      const words = [];
      for (let i = 0; i < n; i++) {
        let w = WORDS[rand(WORDS.length)];
        if (kapital.value === '1') w = w[0].toUpperCase() + w.slice(1);
        words.push(w);
      }
      let tail = '';
      const na = parseInt(angka.value, 10);
      for (let i = 0; i < na; i++) tail += String(rand(10));
      if (simbol.value === '1') tail += SYMBOLS[rand(SYMBOLS.length)];
      const pass = words.join(sep) + (tail ? sep + tail : '');

      // Estimasi entropi (jujur): tiap kata dipilih acak dari WORDS kata,
      // jadi tiap kata menyumbang log2(324) ≈ 8,34 bit. Kapitalisasi TIDAK
      // menambah apa pun: huruf pertama SELALU kapital, polanya bisa
      // ditebak siapa pun (sebelumnya salah menambah +n bit). Angka/symbol
      // acak menambah log2(10) / log2(9) bit per karakter.
      const bits = estimasiEntropi(n, na, simbol.value === '1');
      const label = bits < 40 ? ['Lemah', 'warn'] : bits < 60 ? ['Sedang', ''] : bits < 80 ? ['Kuat', 'ok'] : ['Sangat kuat', 'ok'];
      // Perbandingan yang benar: password acak 8 karakter (94 karakter
      // mungkin) ≈ 52 bit. 4 kata ≈ 33 bit — masih di bawahnya; klaim
      // "lebih kuat" baru benar di 7+ kata (≈ 58 bit).
      const banding = bits >= 53
        ? 'Kekuatannya sudah sekelas password acak 8 karakter.'
        : 'Masih di bawah password acak 8 karakter — tambah kata sampai 7 atau lebih supaya lebih kuat.';

      T.show(box,
        '<div class="big" style="font-size:20px;word-break:break-all;user-select:all">' + T.esc(pass) + '</div>' +
        '<div class="kv"><span>Panjang</span><b>' + pass.length + ' karakter</b></div>' +
        '<div class="kv"><span>Estimasi entropi</span><b>~' + bits + ' bit</b></div>' +
        '<div class="kv"><span>Kekuatan</span><b class="' + label[1] + '">' + label[0] + '</b></div>' +
        '<p class="hint">' + banding + ' Makin banyak kata, makin kuat — dan kapitalisasi huruf pertama tidak menambah kekuatan karena polanya selalu sama. Jangan pakai ulang di banyak akun.</p>');
      box.appendChild(T.row(T.copyBtn(() => pass, 'Salin passphrase')));
    };
    [jml, pisah, kapital, angka, simbol].forEach((s) => s.addEventListener('change', buat));

    root.appendChild(T.grid2(
      T.field('Jumlah kata', jml),
      T.field('Pemisah', pisah)
    ));
    root.appendChild(T.grid2(
      T.field('Kapitalisasi', kapital),
      T.field('Tambah angka', angka)
    ));
    root.appendChild(T.field('Tambah simbol', simbol));
    root.appendChild(T.row(T.btn('Buatkan passphrase', buat, true)));
    root.appendChild(box);
    buat();

}
