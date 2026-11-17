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
