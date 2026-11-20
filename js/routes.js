/* ============================================================
   ADIP Tools v6.14.0 — routes.js (P0-C: tabel route shell)
   SATU sumber kebenaran untuk semua route hash aplikasi.
   Router di app.js hanya memanggil matchRoute() lalu dispatch
   lewat peta VIEWS — tidak ada lagi rantai if/else startsWith
   yang tersebar.

   CARA MENAMBAH ROUTE BARU (untuk tim P1/P2):
   1. Tambah SATU baris ke ROUTES di bawah (urutan = prioritas
      pencocokan; route fallback 'home' WAJIB terakhir).
   2. Tambah SATU entri ke peta VIEWS di app.js:
      namaroute: (params, query) => viewBaru(params.id).
   3. Tulis fungsi view-nya. Selesai — tidak perlu bedah router.

   BAHASA POLA:
   - Segmen literal: '#/favorit' (cocok persis dengan hash penuh,
     termasuk query — '#/favorit?x=1' TIDAK cocok, jatuh ke home,
     sama seperti perilaku lama `hash === '#/favorit'`).
   - ':nama' : menangkap sisa path sampai '?' (BOLEH kosong, BOLEH
     mengandung '/'; TIDAK berhenti di '#' kecuali opsi
     stripAnchor: true — meniru persis perilaku lama tiap route:
     #/t dan #/k hanya memotong di '?', #/c memotong di '?' dan '#').
     Nilai di-decode dengan decodeURIComponent; urutan % yang rusak
     membuat route TIDAK COCOK (jatuh ke home) — P0-D2 F1: dulu
     melempar URIError dan mem-blank-kan halaman.
   - '*' di akhir pola: prefix match, sisa hash diabaikan
     ('#/metodologi*' juga cocok dengan '#/metodologi#thr' dan
     '#/metodologix', sama seperti startsWith lama).
   - '*' sendirian: selalu cocok (fallback, WAJIB terakhir).

   matchRoute() mengembalikan { name, params, query }:
   - params: objek { id, ... } dari segmen :nama (kosong bila tidak ada).
   - query: string mentah setelah '?' pertama ('' bila tidak ada).
     Pakai queryParam(query, nama) untuk mengambil satu parameter —
     implementasinya meniru regex lama /[?&]q=([^&]*)/: cocok
     pertama menang, nilai di-decode dengan decodeURIComponent
     (tanda '+' TIDAK diubah jadi spasi, tidak seperti
     URLSearchParams — perilaku ini dipertahankan sengaja;
     nilai % rusak mengembalikan undefined, P0-D2 F1).
   ============================================================ */

export const ROUTES = [
  { name: 'tool', pattern: '#/t/:id' },
  { name: 'kategori', pattern: '#/k/:id' },
  { name: 'koleksi', pattern: '#/c/:id', stripAnchor: true },
  { name: 'metodologi', pattern: '#/metodologi*' },
  { name: 'semua', pattern: '#/semua*' },
  { name: 'favorit', pattern: '#/favorit' },
  { name: 'home', pattern: '*' },
];

/* R1 (v6.21.0): ALIAS REDIRECT — ID tool yang dipensiunkan di gelombang 3
   (merge M1/M2/M4) mendarat di survivor-nya, supaya bookmark dan tautan
   lama pengunjung tetap jalan alih-alih "Tools tidak ditemukan".
   Nilai = target hash setelah '#/t/' — boleh membawa query:
   - 'pdflab?tab=N' : langsung ke tab PDFLab yang menyerap tool lama
     (nomor tab dari tim M2, 0-based: TAB 10 -> tab=9, TAB 19 -> tab=18,
     TAB 4 -> tab=3; render pdflab membaca ?tab= dari location.hash).
   - '<survivor>?dir=b' : konverter dua arah M4, langsung ke panel arah B
     (arah yang dipensiunkan); render survivor membaca ?dir=b dari
     location.hash, tanpa ?dir=b arah A tetap default.
   Kunci di sini TIDAK ADA di manifest (ID pensiun, file sudah dihapus);
   survivor-nya WAJIB ada di manifest. resolveToolAlias() dipakai
   toolPage() di app.js sebelum byId() — route tool yang masih hidup
   tidak pernah menyentuh peta ini. */
export const TOOL_ALIASES = {
  /* M1 — merge sejati (survivor menyerap fitur tool lama) */
  'penulis-ulang-kalimat-ai': 'parafrase-teks-ai',
  'cek-operator': 'format-hp',
  'konverter-audio-lanjutan': 'konverter-audio',
  'dice': 'dadu-dnd',
  'kuis-trivia': 'trivia-umum',
  'kalkulator-langkah-ke-km': 'kalkulator-langkah-ke-kalori',
  'sample-size': 'margin-of-error',
  'kalkulator-cm360': 'kalkulator-edpi',
  'kalkulator-rfm': 'lemak-tubuh',
  'reorder-point': 'kalkulator-safety-stock',
  'konverter-subtitle-ass-sbv-ttml': 'konverter-subtitle',
  'subtitle-ke-teks-polos': 'konverter-subtitle',
  'ambil-teks-dari-epub': 'ambil-teks-dari-word',
  'ambil-teks-dari-odt': 'ambil-teks-dari-word',
  'lihat-data-foto': 'exif-clean',
  'edit-exif-foto': 'exif-clean',
  'frekuensi-nada': 'generator-nada-frekuensi',
  'jadwal-hasil-f1': 'data-f1-live',
  'alamat-dari-koordinat': 'cari-lokasi',
  'barcode': 'qr-generator',
  /* M2 — PDFLab + kunci/arsip */
  'pdf-ke-jpg-png': 'pdflab?tab=9',
  'pembuat-buklet-pdf': 'pdflab?tab=18',
  'gambar-ke-pdf': 'pdflab?tab=3',
  'buka-kunci-pdf': 'kunci-pdf',
  'buat-arsip-tar-gz': 'ekstrak-arsip-7z-rar-tar-gz',
  /* M4 — konverter dua arah (arah B = yang dipensiunkan) */
  'excel-ke-csv': 'csv-ke-excel?dir=b',
  'vcf-ke-csv': 'csv-ke-vcf?dir=b',
  'pdf-ke-epub': 'epub-ke-pdf?dir=b',
  'json-ke-excel': 'excel-ke-json?dir=b',
  'excel-ke-pdf': 'pdf-ke-excel?dir=b',
  'xml-ke-excel': 'excel-ke-xml?dir=b',
  'gif-ke-video': 'video-ke-gif?dir=b',
  'pdf-ke-html': 'html-ke-pdf?dir=b',
  'html-ke-word': 'word-ke-html?dir=b',
  'pdf-ke-markdown': 'markdown-ke-pdf?dir=b',
  'word-ke-markdown': 'markdown-ke-word?dir=b',
  'word-ke-pdf': 'pdf-ke-word?dir=b',
  'woff2-ke-ttf': 'ttf-ke-woff2?dir=b',
};

/* Kembalikan target redirect ('<id-survivor>[?query]') bila id adalah ID
   tool pensiun, undefined bila bukan (route hidup & ID tak dikenal
   tidak berubah perilakunya). */
export function resolveToolAlias(id) {
  // Q3 (v6.21.0): guard hasOwnProperty — tanpa ini id warisan seperti
  // '__proto__'/'constructor'/'toString' mengembalikan nilai truthy
  // non-string yang melempar di normList (store.js) dan mengosongkan
  // beranda + #/favorit. Peta statis; tidak ada perubahan perilaku lain.
  if (!Object.prototype.hasOwnProperty.call(TOOL_ALIASES, id)) return undefined;
  return TOOL_ALIASES[id];
}

/* Cocokkan satu definisi route terhadap hash. Mengembalikan params
   (objek, mungkin kosong) bila cocok, null bila tidak. */
function matchOne(route, hash) {
  const { pattern } = route;
  if (pattern === '*') return {};
  if (pattern.endsWith('*')) {
    return hash.startsWith(pattern.slice(0, -1)) ? {} : null;
  }
  const paramAt = pattern.indexOf('/:');
  if (paramAt === -1) return hash === pattern ? {} : null;
  const prefix = pattern.slice(0, paramAt + 1); // '#/t/'
  const paramName = pattern.slice(paramAt + 2); // 'id'
  const path = hash.split('?')[0];
  if (!path.startsWith(prefix)) return null;
  let value = path.slice(prefix.length);
  if (route.stripAnchor) value = value.split('#')[0];
  /* P0-D2 (F1): urutan % rusak TIDAK BOLEH melempar — dulu URIError dari
     sini mematikan route() dan halaman jadi blank (tautan jahat bisa
     mem-blank-kan aplikasi). Route tidak cocok -> jatuh ke home. */
  try {
    return { [paramName]: decodeURIComponent(value) };
  } catch {
    return null;
  }
}

export function matchRoute(hash) {
  const h = hash || '#/';
  const query = h.includes('?') ? h.split('?').slice(1).join('?') : '';
  for (const route of ROUTES) {
    const params = matchOne(route, h);
    if (params !== null) return { name: route.name, params, query };
  }
  /* Tidak terjangkau selama fallback 'home' ada di tabel — pertahanan
     terakhir bila seseorang menghapusnya tanpa sengaja. */
  return { name: 'home', params: {}, query };
}

/* Ambil satu parameter query (cocok pertama menang). Mengembalikan
   string ter-decode, atau undefined bila tidak ada. */
export function queryParam(query, name) {
  if (!query) return undefined;
  const m = query.match(new RegExp('(?:^|&)' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '=([^&]*)'));
  if (!m) return undefined;
  /* P0-D2 (F1): nilai % rusak -> undefined (bukan lempar URIError yang
     mematikan route() dan mem-blank-kan halaman). */
  try {
    return decodeURIComponent(m[1]);
  } catch {
    return undefined;
  }
}
