import { h as T, errBox, utils } from '../../core.js';
// Modul data TIDAK diimpor statis di sini (D-6230-LAZYDATA, S-B17): ia
// dimuat dinamis lewat muatData() di bawah (dynamic import) supaya Vite
// mengeluarkannya sebagai chunk terpisah — TIDAK masuk precache (aturan
// S-Q7) dan TIDAK menunda render UI tool. Antarmuka modul: export
// PLATFORMS (STUB v1 dihapus S-A4b — tidak ada kode yang mengimpornya).

// Cek Username — cek di platform mana saja sebuah username dipakai.
// Data platform: js/cek-username-platforms.js (data final S-A4b/S-B18 —
// Maigret + Sherlock + WhatsMyName + 24 tambahan S-A4; perincian hitungan
// di header modul data).
//
// Endpoint AUTO-CHECK (CORS-friendly, per spesifikasi ronde v6.23.0):
//   GitHub: https://api.github.com/users/<u> (200 = ada, 404 = tidak ada)
// Reddit DIDEMOSI ke manual (S-A4b): tidak ada bukti CORS; GitHub adalah
// satu-satunya auto-check. Catatan jujur 24 Nov 2026: verifikasi live
// endpoint GitHub dari VM ini TIDAK sempat dilakukan (egress mati saat
// build, curl 000 ke semua host). S-B9/S-V WAJIB menguji live sebelum rilis.
//
// Keamanan (S-A6 — ringkas, detail di laporan S-B1; S-B11 menutup
// temuan red team S-B10 — detail di fix/S-B11-blue.md):
// - Username TIDAK PERNAH dibaca dari URL dan TIDAK PERNAH disimpan
//   (tanpa localStorage, tanpa riwayat, tanpa analytics).
// - Semua teks username/nama platform dirender via textContent (DOM API),
//   bukan string HTML — tidak ada jalur XSS dari data.
// - Tautan dibangun via urlProfil(): encodeURIComponent + utils.urlAman +
//   https saja + hostname harus cocok dengan domain deklarasi entri.
// - Endpoint AUTO-CHECK dibangun via urlCek(): hostname hasil HARUS cocok
//   dengan apiDomain yang dideklarasikan terpisah (B10-01) — pola
//   checkUrl tidak lagi menjadi otoritasnya sendiri. Entri auto tanpa
//   apiDomain (atau apiDomain tidak cocok) TIDAK PERNAH di-fetch dan
//   dilaporkan "tidak bisa dipastikan", bukan "tidak ada".
// - Kedua builder menolak URL ber-userinfo (B10-04), port eksplisit, dan
//   domain deklarasi tanpa titik/TLD telanjang (B10-05).
// - apiDomain WAJIB cocok dengan domain profil entri yang sama (Q3-01,
//   S-B15): entri yang mendeklarasikan profil github.com + API
//   evil.example.com TIDAK PERNAH di-fetch ("tidak bisa dipastikan") —
//   B10-01 hanya memaksa checkUrl↔apiDomain konsisten dan tidak pernah
//   memeriksa keduanya terhadap domain. Kedua entri stub memenuhi syarat
//   ini (api.github.com ⊂ github.com, www.reddit.com ⊂ reddit.com).
// - Host IP literal (Q3-02, S-B15) DITOLAK di kedua builder + entriSah:
//   desimal bertitik, heksa, oktal, integer, dan IPv6 — semua bentuk yang
//   dipahami pemecah URL (parser menormalisasi bentuk non-kanonis dulu).
// - Placeholder {u} WAJIB di path/query pola (Q3b-02, S-B16): {u} yang
//   hanya di fragment TIDAK PERNAH terkirim ke server — fetch ke URL tanpa
//   username + respons 200 akan dibaca "Ada" untuk username apa pun.
//   Kedua builder + entriSah menolak pola yang {u}-nya sesudah '#'.
// - Status respons akhir hanya dipercaya bila host URL AKHIR-nya
//   (response.url, sesudah semua redirect) cocok dengan apiDomain entri
//   (Q3b-03, S-B16): redirect ke host lain -> "tidak bisa dipastikan",
//   JANGAN pernah "Ada" dari host yang tidak dipercaya. Respons opaque
//   (tanpa URL) juga tidak dipercaya. Redirect satu-origin tetap jalan.
// - API lintas-domain (Q3b-01, S-B16 — KEPUTUSAN, bukan cacat): platform
//   yang API-nya tinggal di domain lain (Hacker News, Stack Exchange,
//   X oEmbed) menjadi MANUAL-CHECK — tidak ada pengecualian runtime.
// - Data TIDAK dipercaya mentah-mentah: entri rusak dilewati per entri
//   (B10-02) — satu entri malformed tidak lagi mematikan tool — dan
//   jumlah entri yang dilewati ditampilkan jujur di UI.
// - Hostname asli SELALU tampil di tiap kartu (baris URL, B10-03) —
//   nama platform yang tampil tidak pernah menjadi satu-satunya identitas
//   tautan.
// - Tautan manual TIDAK PERNAH di-prefetch/di-fetch; username sampai ke
//   platform manual hanya bila pengguna mengetuk tautannya.
// - Tanpa token/login apa pun; GitHub 403 (limit 60/jam tanpa login)
//   ditampilkan jujur sebagai "tidak bisa dipastikan", bukan "tidak ada".

// Cek massal (S-A6 §2e): maks 5 fetch bersamaan, timeout 8 detik per cek,
// tanpa retry otomatis. Satu AbortController global untuk tombol Berhenti.
const BATAS_BERSAMAAN = 5;
const TIMEOUT_MS = 8000;
// Skala ratusan platform (S-A5 §6.3): render 20 kartu per klik.
const MUAT_PER_KLIK = 20;

// ---- Muat data platform secara LAZY (D-6230-LAZYDATA, S-B17) ----
// Proyeksi S-Q7 (verify/S-Q7-pwa.md §5): data final ~1.100 entri ≈ 128 KB,
// 10.000 entri ≈ 1,14 MB — membundel itu ke chunk tool menunda render UI,
// dan masuk precache akan menggandakan biaya install SW untuk SEMUA
// pengunjung. Dynamic import() di bawah membuat Vite mengeluarkan modul
// data sebagai chunk TERPISAH (cek-username-platforms-<hash>.js): chunk
// tool tetap ringan, UI tool tampil segera, data menyusul paralel dengan
// status muat yang jujur; precache tetap 12 entri shell-only (generator
// precache hanya mengambil entry + CSS + font — chunk ini tidak pernah
// masuk daftarnya).
// State dibagikan per dokumen (satu instance modul tool): data dimuat
// SEKALI, dipakai semua render() berikutnya. Bila impor GAGAL (chunk
// tidak termuat / jaringan mati), janjiData di-reset ke null supaya tiap
// panggilan muatData() berikutnya mendapat janji segar (bukan janji gagal
// yang sama). PERHATIAN (S-B17, TERBUKTI probe browser): impor ulang
// DALAM DOKUMEN YANG SAMA tidak akan pernah fetch jaringan — spesifikasi
// HTML men-cache kegagalan fetch modul sebagai entri null di peta modul,
// sehingga import() berikutnya ditolak dalam ~11 ms tanpa request baru.
// Karena itu kedua tombol "Coba lagi" (area status + box) memakai
// location.reload(): dokumen baru = peta modul baru = fetch baru yang
// sesungguhnya. Ini pola standar pemulihan gagal-muat chunk (dipakai SPA
// Vite pada umumnya), bukan jalan pintas — dan hash rute (#/t/...) tetap
// utuh sesudah reload sehingga pengguna kembali ke tool yang sama.
let janjiData = null; // Promise<array> yang sedang berjalan (null: belum/gagal)
let dataSiap = null; // array PLATFORMS sesudah termuat (null: belum/gagal)

function muatData() {
  if (dataSiap) return Promise.resolve(dataSiap);
  if (!janjiData) {
    janjiData = import('../../cek-username-platforms.js').then((m) => {
      // Fail-soft yang sama seperti impor statis dulu (B10-02): modul yang
      // PLATFORMS-nya bukan array -> daftar kosong, tool tetap hidup.
      dataSiap = Array.isArray(m.PLATFORMS) ? m.PLATFORMS : [];
      return dataSiap;
    }).catch((e) => {
      janjiData = null; // gagal boleh dicoba lagi (lihat catatan di atas)
      throw e;
    });
  }
  return janjiData;
}

export const meta = {"id": "cek-username", "name": "Cek Username", "cat": "liveapi", "icon": "📛", "desc": "Cek di platform mana saja sebuah username dipakai, dari profil publik.", "keywords": "username,cek username,profil,profil publik,stalker,osint,keamanan,cari akun,sosial media", "since": "6.23.0", "online": true};

// ---- Fungsi murni (di-export agar bisa diuji, pola S-A1 §1.2) ----

// Cocokkan hostname hasil dengan domain yang dideklarasikan (aturan sama
// untuk profil dan API, S-B11): sama persis, atau subdomain bertitik.
// 'www.' di depan deklarasi diabaikan — 'www.github.com' dan 'github.com'
// adalah deklarasi yang sama.
function hostCocok(host, harap) {
  const h = String(host || '').toLowerCase();
  const d = String(harap || '').toLowerCase().replace(/^www\./, '');
  if (!d) return false;
  return h === d || h.endsWith('.' + d);
}

// Domain deklarasi yang sah (B10-05): string dengan minimal satu titik.
// TLD telanjang ('com') DITOLAK — cek suffix bertitik ('.com') akan
// meloloskan SEMUA host .com dan melumpuhkan cek hostname diam-diam.
// Q3-02 (S-B15): IP literal juga DITOLAK — platform sah tidak pernah
// memakai IP sebagai domain profil/API.
function domainSah(domain) {
  if (typeof domain !== 'string') return false;
  const d = domain.toLowerCase().replace(/^www\./, '');
  if (!d || !d.includes('.')) return false;
  if (d.startsWith('.') || d.endsWith('.')) return false;
  if (hostAdalahIP(d)) return false;
  return true;
}

// Apakah sebuah host adalah IP literal (Q3-02, S-B15)? Menutup SEMUA
// bentuk yang dipahami pemecah URL WHATWG — bukan hanya desimal bertitik:
//   - desimal kanonis: 127.0.0.1, 192.168.1.1 (termasuk bentuk pendek
//     127.1 / 1.2.3 yang dinormalisasi parser ke 4 oktet)
//   - heksa: 0x7f000001, 0x7f.0.0.1 (parser menormalisasi ke 127.0.0.1)
//   - oktal: 0177.0.0.1 (parser menormalisasi ke 127.0.0.1)
//   - integer: 2130706433 (parser menormalisasi ke 127.0.0.1)
//   - IPv6: [::1] / ::1 (hostname hasil parser mengandung ':')
// Hostname yang SUDAH lewat parser URL selalu kanonis (IPv4 -> 4 oktet
// desimal, IPv6 -> mengandung ':'), jadi dua cek cepat di bawah cukup
// untuk hostname hasil parse. Cek ketiga (normalisasi ulang lewat parser)
// hanya untuk string deklarasi MENTAH yang belum diparse — dan hanya
// dijalankan bila stringnya "kelihatan numerik" (hanya [0-9a-fx.]),
// supaya domain normal (github.com, api.github.com) tidak membayar satu
// parse tambahan: karakter di luar himpunan itu tidak mungkin membentuk
// IP dalam bentuk apa pun (heksa = 0-9a-f, oktal/desimal = 0-9).
function hostAdalahIP(host) {
  const h = String(host || '').toLowerCase();
  if (!h) return false;
  if (h.includes(':')) return true; // IPv6 (hasil parser: '[::1]')
  if (/^\d+\.\d+\.\d+\.\d+$/.test(h)) return true; // IPv4 kanonis
  if (!/^[0-9a-fx.]+$/.test(h)) return false; // bukan bentuk IP apa pun
  try {
    const n = new URL('https://' + h + '/').hostname;
    return /^\d+\.\d+\.\d+\.\d+$/.test(n) || n.includes(':');
  } catch (e) { return false; } // bukan host yang bisa diparse -> bukan IP
}

// Apakah placeholder {u} berada di path/query pola (Q3b-02, S-B16)?
// {u} yang HANYA muncul sesudah '#' (di fragment) TIDAK PERNAH terkirim ke
// server — fetch ke URL tanpa username + respons 200 dibaca "Ada" untuk
// username apa pun (jawaban palsu universal). Aturan: {u} harus muncul
// SEBELUM karakter '#' pertama (atau tidak ada '#' sama sekali sebelum
// {u}). Fragment sesudah {u} ('.../users/{u}#bagian', '?q={u}#bagian')
// tetap sah — username-nya sudah di path/query. Dipakai kedua builder +
// entriSah (kontrak §3.1/§3.2 di js/cek-username-platforms.js).
function placeholderDiPathQuery(pola) {
  const iU = pola.indexOf('{u}');
  if (iU === -1) return false;
  const iHash = pola.indexOf('#');
  return iHash === -1 || iU < iHash;
}

// Apakah host URL AKHIR respons cocok dengan apiDomain (Q3b-03, S-B16)?
// fetch mengikuti redirect tanpa batas — response.url adalah URL final
// sesudah semua redirect. Status respons hanya dipercaya bila host final
// cocok dengan apiDomain (aturan hostCocok yang sama: persis/subdomain).
// Respons opaque (url kosong) atau tanpa url -> false: status buta tidak
// dipercaya. Dipanggil hanya bila respons non-null (lihat cekOtomatis);
// respons null (bukan Response — hanya dari fetchFn tiruan yang rusak)
// tetap lewat klasifikasiStatus -> gagal/jaringan.
function hostAkhirCocok(res, apiDomain) {
  if (!res || typeof res.url !== 'string' || !res.url) return false;
  let host;
  try { host = new URL(res.url).hostname.toLowerCase(); } catch (e) { return false; }
  return hostCocok(host, apiDomain);
}

// Validasi satu entri data (B10-02/B10-03 — fail-soft PER ENTRI).
// Dipakai render() untuk menyaring PLATFORMS sebelum dipakai apa pun.
// Entri yang gagal di sini DILEWATI dan DIHITUNG (bukan membuat tool
// mati, bukan diam-diam hilang). Aturan = kontrak data final S-A4
// (lihat header js/cek-username-platforms.js):
//   - entri harus objek (bukan null/string/array/angka)
//   - name: string non-kosong
//   - url: string dengan TEPAT SATU placeholder {u}, dan placeholder
//     TIDAK BOLEH di host (dicek: host tidak berubah bila {u} diganti
//     dua nilai berbeda) — username tidak boleh memindahkan host
//   - domain: string sah (domainSah) dan COCOK dengan host pola URL
//     (B10-03: deklarasi domain yang tidak cocok dengan pola = ditolak)
//   - domain + host pola BUKAN IP literal (Q3-02, S-B15)
// Catatan: checkUrl/apiDomain TIDAK divalidasi di sini — entri auto yang
// field API-nya tidak sah tetap dirender, tapi TIDAK PERNAH di-fetch
// (urlCek mengembalikan null) dan mendarat di "Tidak bisa dipastikan"
// (B10-01). Membedakan "entri rusak" (dilewati) dari "API tidak bisa
// dipastikan" (ditampilkan jujur) adalah keputusan sadar: yang pertama
// cacat data, yang kedua ketidakpastian hasil cek.
export function entriSah(p) {
  if (!p || typeof p !== 'object' || Array.isArray(p)) return false;
  if (typeof p.name !== 'string' || !p.name.trim()) return false;
  if (typeof p.url !== 'string') return false;
  if (p.url.indexOf('{u}') === -1 || p.url.indexOf('{u}') !== p.url.lastIndexOf('{u}')) return false;
  // Q3b-02 (S-B16): {u} hanya di fragment -> tautan profil tanpa username
  // (fragment tidak terkirim) — entri rusak struktural, dilewati.
  if (!placeholderDiPathQuery(p.url)) return false;
  if (!domainSah(p.domain)) return false;
  let hostA;
  let hostB;
  try {
    hostA = new URL(p.url.replace('{u}', 'aaa')).hostname.toLowerCase();
    hostB = new URL(p.url.replace('{u}', 'bbb')).hostname.toLowerCase();
  } catch (e) { return false; }
  if (hostA !== hostB) return false; // {u} berada di host — ditolak
  // Q3-02: host pola IP literal ditolak eksplisit (defense in depth —
  // domainSah(p.domain) + hostCocok di bawah sudah menutupnya, karena
  // deklarasi yang cocok dengan host IP pasti IP juga; cek ini membuat
  // penolakannya eksplisit dan tidak bergantung pada dua lapisan itu).
  if (hostAdalahIP(hostA)) return false;
  if (!hostCocok(hostA, p.domain)) return false;
  return true;
}

// Validasi gerbang (S-A6 §4.1, batas panjang 30 per spesifikasi ronde):
// kembalikan username bersih, atau null + alasan bahasa sehari-hari.
export function bersihkanUsername(mentah) {
  let u = String(mentah == null ? '' : mentah).trim();
  if (u.startsWith('@')) u = u.slice(1).trim(); // "@nama" -> "nama"
  if (!u) return { ok: false, alasan: 'Tulis username dulu.' };
  if (u.length > 30) return { ok: false, alasan: 'Username terlalu panjang (maksimal 30 huruf).' };
  // Allowlist: huruf, angka, garis bawah, titik, tanda hubung.
  // Karakter lain (spasi, /, ?, #, &, <, >, ", ', `, \) ditolak — bukan
  // dihapus diam-diam, supaya pengguna tahu kenapa ditolak.
  if (!/^[A-Za-z0-9_.-]+$/.test(u)) {
    return { ok: false, alasan: 'Username hanya boleh berisi huruf, angka, titik (.), garis bawah (_), dan tanda hubung (-).' };
  }
  // Wajib ada minimal satu huruf/angka (S-B4): username yang hanya berisi
  // titik/tanda hubung ('.', '..', '-') bukan username sah di platform
  // mana pun, dan '.'/'..' dinormalisasi parser URL menjadi segmen path
  // (https://api.github.com/users/.. -> https://api.github.com/) sehingga
  // respons 200 dari root API salah dibaca sebagai "username ada".
  if (!/[A-Za-z0-9]/.test(u)) {
    return { ok: false, alasan: 'Username harus berisi setidaknya satu huruf atau angka.' };
  }
  return { ok: true, username: u };
}

// Bangun URL profil dari pola data (S-A6 §4.2, placeholder {u}).
// Kembalikan string URL, atau null bila pola/username menghasilkan URL
// yang tidak aman. JANGAN PERNAH memakai hasil pola mentah sebagai
// href/fetch tanpa lewat fungsi ini.
export function urlProfil(pola, username, domainHarapan) {
  if (typeof pola !== 'string' || !pola.includes('{u}')) return null;
  if (pola.indexOf('{u}') !== pola.lastIndexOf('{u}')) return null; // tepat 1 placeholder
  // Q3b-02 (S-B16): {u} hanya di fragment -> tautan profil tanpa username
  // (fragment tidak terkirim) — tolak, jangan bangun tautan salah.
  if (!placeholderDiPathQuery(pola)) return null;
  // Defense in depth (S-B4): username tanpa huruf/angka ('.', '..', '')
  // ditolak di sini juga — parser URL menormalisasi segmen '.'/'..'
  // sehingga URL hasil tidak lagi menunjuk ke profil yang dimaksud.
  const nama = String(username == null ? '' : username);
  if (!/[A-Za-z0-9]/.test(nama)) return null;
  const mentah = pola.replace('{u}', encodeURIComponent(nama)); // SEGMENT encode, bukan encodeURI
  const aman = utils.urlAman(mentah); // core.js — null bila bukan http(s)
  if (!aman) return null;
  let parsed;
  try { parsed = new URL(aman); } catch (e) { return null; }
  if (parsed.protocol !== 'https:') return null; // tool ini: https saja
  // B10-04: userinfo DITOLAK di tool ini, bukan diserahkan ke browser —
  // platform sah tidak pernah butuh kredensial di URL profil.
  if (parsed.username || parsed.password) return null;
  // B10-05: port eksplisit DITOLAK (port default 443 sudah dihapus parser,
  // jadi yang tersisa hanya port non-default — layanan yang berbeda).
  if (parsed.port) return null;
  // B10-05: domain deklarasi tanpa titik (TLD telanjang) DITOLAK.
  if (!domainSah(domainHarapan)) return null;
  // Q3-02 (S-B15): host hasil IP literal DITOLAK — tautan ke localhost/IP
  // privat adalah satu-satunya jalur ke host non-publik dari tool.
  // Parser sudah menormalisasi bentuk heksa/oktal/integer ke desimal
  // kanonis sebelum sampai di sini, jadi satu cek ini menutup semuanya.
  if (hostAdalahIP(parsed.hostname)) return null;
  // Hostname hasil akhir HARUS sama dengan domain yang dideklarasikan entri
  // (menutup pola "https://github.com.evil.com/..." dan sejenisnya).
  if (!hostCocok(parsed.hostname, domainHarapan)) return null;
  return parsed.href;
}

// Bangun URL endpoint AUTO-CHECK dari pola data (B10-01, S-B11).
// Aturan sama seperti urlProfil, dengan SATU perbedaan mendasar yang
// menutup lubang eksfiltrasi: hostname hasil HARUS cocok dengan apiDomain
// yang dideklarasikan TERPISAH di entri — pola checkUrl TIDAK BOLEH lagi
// menjadi otoritasnya sendiri. Tanpa apiDomain yang sah (atau bila host
// pola tidak cocok apiDomain), kembalikan null: pemanggil (cekOtomatis)
// TIDAK fetch dan melaporkan "tidak bisa dipastikan", bukan "tidak ada".
// Cek polaHost lama TETAP dipertahankan sebagai lapisan kedua: username
// tidak boleh memindahkan host (menutup placeholder {u} di host).
// Q3-01 (S-B15): apiDomain juga WAJIB cocok dengan `domain` profil entri
// yang sama (argumen ke-4, opsional): sama persis, atau apiDomain adalah
// subdomain bertitik dari domain — evilgithub.com TIDAK cocok dengan
// github.com, api.github.com cocok. Tanpa cek ini, entri boleh
// mendeklarasikan profil github.com + API evil.example.com secara
// bersamaan dan tetap di-fetch (B10-01 hanya memaksa checkUrl↔apiDomain
// konsisten). Bila `domain` tidak diberikan (pemanggil lama), cek ini
// dilewati — tidak ada yang dibandingkan; cekOtomatis SELALU meneruskan
// entri.domain, jadi jalur nyata selalu terlindungi. `domain` sendiri
// juga wajib lolos domainSah — kalau tidak, domain TLD telanjang ('com')
// akan meloloskan apiDomain apa pun lewat cek suffix bertitik (B10-05).
export function urlCek(pola, username, apiDomain, domain) {
  if (typeof pola !== 'string' || !pola.includes('{u}')) return null;
  if (pola.indexOf('{u}') !== pola.lastIndexOf('{u}')) return null;
  // Q3b-02 (S-B16): {u} hanya di fragment -> fetch ke URL tanpa username +
  // respons 200 dibaca "Ada" untuk username apa pun (jawaban palsu
  // universal). Tolak sebelum fetch: pemanggil melaporkan "tidak bisa
  // dipastikan", bukan "tidak ada".
  if (!placeholderDiPathQuery(pola)) return null;
  // Defense in depth (S-B4): sama seperti urlProfil — '.'/'..'/'' ditolak
  // supaya URL cek tidak pernah menormalisasi ke root API.
  const nama = String(username == null ? '' : username);
  if (!/[A-Za-z0-9]/.test(nama)) return null;
  // B10-01: tanpa deklarasi domain API yang sah, JANGAN fetch.
  if (!domainSah(apiDomain)) return null;
  // Q3-01: apiDomain yang bertentangan dengan domain profil -> JANGAN fetch.
  if (domain !== undefined && domain !== null) {
    if (!domainSah(domain) || !hostCocok(apiDomain, domain)) return null;
  }
  const mentah = pola.replace('{u}', encodeURIComponent(nama));
  const aman = utils.urlAman(mentah);
  if (!aman) return null;
  let parsed;
  try { parsed = new URL(aman); } catch (e) { return null; }
  if (parsed.protocol !== 'https:') return null;
  if (parsed.username || parsed.password) return null; // B10-04
  if (parsed.port) return null; // B10-05
  // Q3-02 (S-B15): host hasil IP literal DITOLAK (defense in depth —
  // domainSah(apiDomain) + hostCocok di bawah sudah menutupnya, karena
  // deklarasi yang cocok dengan host IP pasti IP juga).
  if (hostAdalahIP(parsed.hostname)) return null;
  let polaHost;
  try { polaHost = new URL(pola.replace('{u}', 'x')).hostname.toLowerCase(); } catch (e) { return null; }
  if (parsed.hostname.toLowerCase() !== polaHost) return null;
  if (!hostCocok(parsed.hostname, apiDomain)) return null;
  return parsed.href;
}

// Klasifikasi satu respons cek: 200 = ada, 404 = tidak ada, sisanya gagal.
// 403/429 (limit tercapai) adalah "gagal", BUKAN "tidak ada" (S-A6 R16).
export function klasifikasiStatus(res) {
  if (res && res.ok) return { status: 'ada' };
  const kode = res ? res.status : 0;
  if (kode === 404) return { status: 'tidak-ada' };
  if (kode === 403 || kode === 429) return { status: 'gagal', alasan: 'limit' };
  return { status: 'gagal', alasan: 'jaringan' };
}

// Ringkasan hitungan dari hasil cekOtomatis. 'dibatalkan' tidak dihitung:
// platform yang belum sempat dicek bukan hasil.
export function ringkasHasil(hasil) {
  const r = { ada: 0, tidakAda: 0, gagal: 0, total: 0 };
  for (const h of hasil || []) {
    if (h.status === 'ada') r.ada++;
    else if (h.status === 'tidak-ada') r.tidakAda++;
    else if (h.status === 'gagal') r.gagal++;
  }
  r.total = r.ada + r.tidakAda + r.gagal;
  return r;
}

// Cek otomatis bertahap (S-A6 §4.4): maks 5 fetch bersamaan, timeout
// 8 detik per cek, satu sinyal batal dari luar untuk tombol Berhenti +
// onLeave. Tanpa retry otomatis (tries=1): yang gagal menunggu pengguna
// menekan "Coba lagi". opts.fetchFn hanya untuk pengujian.
export async function cekOtomatis(daftar, username, opts) {
  const o = opts || {};
  const ambil = o.fetchFn || fetch;
  const signalLuar = o.signalLuar || null;
  let selesai = 0;
  let idx = 0;
  const hasil = [];
  async function pekerja() {
    while (idx < daftar.length) {
      if (signalLuar && signalLuar.aborted) return; // berhenti: jangan ambil tugas baru
      const entri = daftar[idx++];
      // Q3-01 (S-B15): domain profil diteruskan ke urlCek supaya apiDomain
      // diperiksa terhadapnya — entri yang bertentangan TIDAK di-fetch.
      const url = urlCek(entri.checkUrl, username, entri.apiDomain, entri.domain);
      if (!url) {
        hasil.push({ entri, status: 'gagal', alasan: 'tidak-valid' });
      } else {
        const c = new AbortController();
        const t = setTimeout(() => c.abort(), TIMEOUT_MS);
        const batalLuar = () => c.abort();
        if (signalLuar) {
          if (signalLuar.aborted) c.abort();
          else signalLuar.addEventListener('abort', batalLuar, { once: true });
        }
        try {
          const r = await ambil(url, { signal: c.signal });
          // Q3b-03 (S-B16): fetch mengikuti redirect tanpa batas — status
          // respons akhir hanya dipercaya bila host URL AKHIR-nya cocok
          // dengan apiDomain entri. Redirect ke host lain -> abaikan
          // statusnya ("tidak bisa dipastikan", alasan 'redirect'), JANGAN
          // pernah "Ada" dari host yang tidak dipercaya. Respons opaque
          // (tanpa URL) juga tidak dipercaya. Redirect satu-origin (host
          // akhir tetap cocok) berfungsi normal seperti sebelumnya.
          // Batas jujur: pemeriksaan ini menutup paruh KEPERCAYAAN (verdict)
          // — request-nya sendiri tetap mengikuti redirect (fetch default),
          // jadi username tetap terkirim ke host redirect. Menutup paruh
          // itu butuh redirect:'manual', yang akan memecahkan redirect
          // satu-origin yang sah — ditolak sadar, lihat fix/S-B16-blue3.md.
          let k;
          if (r && !hostAkhirCocok(r, entri.apiDomain)) {
            k = { status: 'gagal', alasan: 'redirect' };
          } else {
            k = klasifikasiStatus(r);
          }
          hasil.push({ entri, status: k.status, alasan: k.alasan || null });
        } catch (e) {
          // Timeout/jaringan = "tidak bisa dicek saat ini", BUKAN "tidak ada".
          const dibatalkan = e && e.name === 'AbortError' && signalLuar && signalLuar.aborted;
          hasil.push({
            entri,
            status: dibatalkan ? 'dibatalkan' : 'gagal',
            alasan: dibatalkan ? null : (e && e.name === 'AbortError' ? 'timeout' : 'jaringan'),
          });
        } finally {
          clearTimeout(t);
          if (signalLuar) signalLuar.removeEventListener('abort', batalLuar);
        }
      }
      selesai++;
      if (o.onSatu) o.onSatu(hasil[hasil.length - 1]);
      if (o.onProgres) o.onProgres(selesai, daftar.length);
    }
  }
  await Promise.all(Array.from({ length: Math.min(BATAS_BERSAMAAN, daftar.length) }, pekerja));
  return hasil;
}

// Alasan gagal dalam bahasa sehari-hari (untuk baris "tidak bisa dipastikan").
function alasanGagal(alasan) {
  if (alasan === 'limit') return 'Limit tercapai, coba lagi nanti';
  if (alasan === 'timeout') return 'Waktu habis';
  if (alasan === 'tidak-valid') return 'Tautan tidak valid';
  if (alasan === 'redirect') return 'Dialihkan ke alamat lain';
  return 'Tidak bisa dihubungi';
}

export function render(root) {
  const box = T.out();
  const inp = T.input('text', 'Contoh: budi_pratama');
  inp.setAttribute('autocomplete', 'off');
  inp.setAttribute('spellcheck', 'false');

  let jalan = null; // AbortController run aktif (null bila tidak jalan)
  let sedangJalan = false;
  // Tombol dibuat SETELAH definisi cek() di bawah (pola cek-email-bocor):
  // T.btn('Cek username', cek, ...) sebelum `const cek` = TDZ error
  // "Cannot access 'cek' before initialization" (ketahuan smoke test).
  let btnCek;
  let btnBerhenti;

  // Batalkan fetch yang masih jalan saat pengguna pindah halaman
  // (kontrak core.js:13, pola ipintel.js).
  T.onLeave(() => { if (jalan) jalan.abort(); });

  // ---- Data platform (LAZY, D-6230-LAZYDATA, S-B17) ----
  // Daftar diisi terapkanData() SESUDAH modul data termuat; UI di bawah
  // dirender SEGERA tanpa menunggu data. HANYA jalur muat yang berubah
  // (impor statis -> dynamic import) — semua guard keamanan TETAP berlaku
  // pada data yang dimuat dinamis: entriSah fail-soft per entri (B10-02),
  // hostCocok apiDomain <-> domain (Q3-01), tolak IP literal (Q3-02),
  // placeholder {u} sebelum '#' (Q3b-02), host URL akhir (Q3b-03) —
  // tidak satu pun guard dipindah, dihapus, atau dilonggarkan di sini.
  let autoEntries = [];
  let manualEntries = [];
  let manualCari = [];
  let dilewati = 0;
  let dataStatus = 'memuat'; // 'memuat' | 'siap' | 'gagal'

  // Fail-soft PER ENTRI (B10-02): data tidak dipercaya mentah-mentah.
  // Entri rusak dilewati satu per satu dan DIHITUNG — satu entri
  // malformed tidak lagi mematikan ribuan entri baik, dan pengunjung
  // diberi tahu jujur lewat hint "N platform dilewati karena datanya
  // rusak." di bawah. Dipanggil sekali saat data termuat (dan sekali
  // lagi bila render ulang memakai data yang sudah di-cache modul).
  function terapkanData(daftar) {
    const entriBaik = [];
    let lewat = 0;
    for (const p of daftar) {
      if (entriSah(p)) entriBaik.push(p);
      else lewat++;
    }
    autoEntries = entriBaik.filter((p) => p.check === 'auto');
    manualEntries = entriBaik.filter((p) => p.check !== 'auto');
    // Cari tanpa alokasi per ketikan (S-B3): nama/kategori huruf-kecil
    // dihitung sekali per run — memanggil toLowerCase() untuk ribuan entri
    // pada tiap ketikan adalah ribuan alokasi string + sampah GC.
    // String() di nama (B10-02): entriSah sudah menjamin string, tapi
    // defense in depth ini murah dan menutup kelas cacat ini permanen.
    manualCari = manualEntries.map((p) => ({
      entri: p,
      nama: String(p.name ?? '').toLowerCase(),
      kat: String(p.category || '').toLowerCase(),
    }));
    dilewati = lewat;
    dataStatus = 'siap';
  }

  // Area status data di bawah tombol (di luar box hasil supaya tidak
  // terhapus saat run): teks muat saat memuat, hint dilewati bila ada
  // entri rusak, error jujur + tombol "Coba lagi" bila muat gagal.
  // Pola loading yang dipakai adalah pola yang sudah ada di tool ini:
  // teks .hint (seperti "Mengecek …" saat run) — tanpa gaya baru.
  const statusData = document.createElement('div');

  function tampilStatusData() {
    statusData.innerHTML = '';
    if (dataStatus === 'memuat') {
      const t = document.createElement('p');
      t.className = 'hint';
      t.textContent = 'Memuat daftar platform…';
      statusData.appendChild(t);
    } else if (dataStatus === 'gagal') {
      statusData.appendChild(T.el(errBox('Daftar platform tidak bisa dimuat. Cek koneksi internet, lalu coba lagi.')));
      const w = T.el('<div style="margin-top:8px"></div>');
      // "Coba lagi" = muat ulang halaman. Impor ulang di dokumen yang sama
      // TIDAK BISA berhasil: kegagalan fetch modul di-cache peta modul
      // (lihat catatan di muatData) — hanya dokumen baru yang fetch baru.
      w.appendChild(T.btn('Coba lagi', () => location.reload()));
      statusData.appendChild(w);
    } else if (dilewati > 0) {
      // Hitungan jujur entri yang dilewati (B10-02): hanya tampil bila > 0.
      const t = document.createElement('p');
      t.className = 'hint';
      t.textContent = dilewati + ' platform dilewati karena datanya rusak.';
      statusData.appendChild(t);
    }
    // siap + dilewati 0 -> area kosong, tidak ada status yang perlu tampil
  }

  // Satu kartu hasil (DOM API — tiru github-profile.js:50-56).
  // Nama platform + username lewat textContent; tautan via DOM API dengan
  // rel penuh. opsi: { badge, kelas, latar, sub }.
  function kartuPlatform(entri, username, opsi) {
    const url = urlProfil(entri.url, username, entri.domain);
    const kartu = document.createElement('div');
    kartu.style.cssText = 'border:1px solid var(--line-soft);border-radius:var(--r-md);padding:10px 12px;margin-bottom:8px;display:flex;gap:10px;align-items:center;background:' + (opsi.latar || 'var(--surface)');
    const tengah = document.createElement('div');
    tengah.style.cssText = 'flex:1;min-width:0';
    const judul = document.createElement('div');
    judul.style.cssText = 'font-weight:700;font-size:14px;line-height:1.3';
    if (url) {
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer'; // pasangan penuh — wajib (S-A6 §2c)
      a.textContent = entri.name;
      judul.appendChild(a);
    } else {
      judul.textContent = entri.name;
    }
    tengah.appendChild(judul);
    const barisUrl = document.createElement('div');
    // B10-03: hostname asli SELALU tampil jelas di tiap kartu — ini
    // satu-satunya sinyal runtime yang membedakan tautan asli dari
    // tautan phishing (nama platform bisa mengklaim apa saja). Dibanding
    // versi lama (12px, --dim redup di bawah judul 14px tebal): naik ke
    // 13px, warna --mut (lebih terang), dan monospace supaya alamatnya
    // terbaca sebagai alamat, bukan label. Bukan perubahan desain besar —
    // hanya sinyal keamanan yang dibuat tidak mungkin terlewat.
    barisUrl.className = 'mut';
    barisUrl.style.cssText = 'font-size:13px;font-family:var(--font-m);margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap';
    if (url) {
      let tampil = entri.domain || '';
      try { const u = new URL(url); tampil = u.hostname + u.pathname; } catch (e) { /* pakai domain */ }
      barisUrl.textContent = tampil;
    } else {
      barisUrl.textContent = 'Tautan tidak valid';
    }
    tengah.appendChild(barisUrl);
    if (opsi.sub) {
      const sub = document.createElement('div');
      sub.className = 'dim';
      sub.style.cssText = 'font-size:12px;margin-top:2px';
      sub.textContent = opsi.sub;
      tengah.appendChild(sub);
    }
    kartu.appendChild(tengah);
    const badge = document.createElement('span');
    badge.className = opsi.kelas || 'dim';
    // Batas lebar kolom badge (S-B6): badge "Tidak bisa dipastikan" (22
    // huruf) tanpa batas memakan ~55% lebar kartu di 360px — kolom tengah
    // terdesak sampai URL terpotong "www.reddit.co..." dan alasan gagal
    // patah tengah frasa ("Tidak bisa / dihubungi"). Dengan batas ini badge
    // panjang membungkus rapi 2 baris ("Tidak bisa / dipastikan"), sementara
    // "Ada" (~30px) dan "Cek manual" (~78px) tetap 1 baris.
    badge.style.cssText = 'flex:none;font-size:13px;font-weight:700;text-align:right;line-height:1.3;max-width:112px';
    badge.textContent = opsi.badge;
    kartu.appendChild(badge);
    return kartu;
  }

  // Seksi MANUAL-CHECK: grup <details> per kategori + filter + muat bertahap.
  // Filter menyaring kartu yang sudah ada di data, TANPA fetch ulang.
  function bangunManual(username, wadah) {
    const judul = document.createElement('div');
    judul.style.cssText = 'font-weight:800;font-size:16px;margin:4px 0 8px';
    judul.textContent = 'Cek manual';
    wadah.appendChild(judul);
    wadah.appendChild(T.el('<p class="note">Sebagian platform tidak mengizinkan pengecekan langsung dari sini, jadi yang ditampilkan hanya tautan ke halaman platformnya. Ada yang langsung ke profil, ada yang ke hasil pencarian atau daftar anggota. Ketuk tautannya untuk melihat sendiri apakah username itu ada di sana.</p>'));

    const filterWrap = document.createElement('div');
    filterWrap.className = 'fld';
    filterWrap.style.marginBottom = '12px';
    const filterInp = T.input('text', 'Cari platform di hasil ini…');
    filterInp.setAttribute('autocomplete', 'off');
    // S-B13 (D4): placeholder bukan label — nama aksesibel eksplisit
    // supaya pembaca layar menamai input ini konsisten di semua
    // browser/AT. Tanpa ubah tampilan visual apa pun.
    filterInp.setAttribute('aria-label', 'Cari platform di hasil ini');
    filterWrap.appendChild(filterInp);
    const barisHitung = document.createElement('div');
    barisHitung.style.cssText = 'display:flex;justify-content:space-between;align-items:center;gap:10px';
    const hitungFilter = document.createElement('div');
    hitungFilter.className = 'hint';
    const hapusFilter = document.createElement('button');
    hapusFilter.type = 'button';
    hapusFilter.textContent = 'Hapus filter';
    hapusFilter.style.cssText = 'background:none;border:none;padding:0 4px;cursor:pointer;text-decoration:underline;font-size:12.5px;min-height:44px;color:var(--dim)';
    hapusFilter.style.display = 'none';
    barisHitung.append(hitungFilter, hapusFilter);
    filterWrap.appendChild(barisHitung);
    wadah.appendChild(filterWrap);

    // Wadah grup — SATU-SATUNYA yang dibangun ulang saat filter berubah.
    // Input filter di luar wadah ini supaya fokus tidak hilang (S-A5 §6.2).
    const grupWrap = document.createElement('div');
    wadah.appendChild(grupWrap);

    // Skala ratusan platform (S-B3): kartu grup dirender MALAS + BERTAHAP
    // supaya tidak ada satu tugas panjang yang membekukan UI. Terukur di
    // dataset 1.100 entri SEBELUM perbaikan: render sekaligus = long task
    // 84–165 ms per ketikan/render awal (lihat fix/S-B3-skala.md).
    // - Grup tertutup hanya dibangun cangkangnya (details+summary); kartunya
    //   dirender saat pertama kali dibuka (event toggle).
    // - Saat memfilter, semua grup yang cocok terbuka — kartunya dirender
    //   bertahap per frame (anggaran ~8 ms JS/frame); `generasi` membatalkan
    //   potongan usang bila filter berubah sebelum antre habis. Anggaran
    //   kecil disengaja: trace CDP membuktikan long task 85 ms di frame
    //   pertama BUKAN dari JS (slice 21 ms) melainkan style+layout+paint
    //   ~120 kartu baru sekaligus (UpdateLayoutTree 19 ms + Layout 22 ms);
    //   potongan ~2 grup/frame menjaga tiap frame jauh di bawah 50 ms.
    // - Ketikan filter di-debounce 120 ms: bangun ulang hanya jalan sesudah
    //   pengguna berhenti mengetik sejenak.
    // - S-B18 (F-Q13-02): pada transisi filter, CANGKANG grup juga dibangun
    //   bertahap per frame (anggaran yang sama) dan slice kartu pertama
    //   dibatasi 2 grup — S-Q13 mengukur longtask intermiten 150–295 ms
    //   pada ketikan filter berat di data final 9.644 entri. Tanpa filter,
    //   cangkang tetap dibangun sekaligus (terbukti longtask 0).
    let generasi = 0;
    let timerFilter = null;
    const ANGGARAN_SLICE_MS = 8;
    const DEBOUNCE_FILTER_MS = 120;

    function renderGrup(filter) {
      const gen = ++generasi; // batalkan slice render dari render sebelumnya
      grupWrap.innerHTML = '';
      const q = String(filter || '').trim().toLowerCase();
      const cocok = [];
      for (const c of manualCari) {
        if (!q || c.nama.includes(q) || c.kat.includes(q)) cocok.push(c.entri);
      }
      hitungFilter.textContent = cocok.length + ' platform' + (q ? ' yang cocok' : ' · ketik untuk menyaring');
      hapusFilter.style.display = q ? '' : 'none';
      if (!cocok.length) {
        grupWrap.appendChild(T.el('<p class="center dim">Tidak ada platform yang cocok.</p>'));
        return;
      }
      // Kelompokkan per kategori, urutan kemunculan pertama di data.
      const urutan = [];
      const perKat = new Map();
      for (const p of cocok) {
        const kat = p.category || 'Lainnya';
        if (!perKat.has(kat)) { perKat.set(kat, []); urutan.push(kat); }
        perKat.get(kat).push(p);
      }
      const antre = []; // isi-awal grup terbuka, dirender bertahap per frame
      // Satu cangkang grup (details + summary + isi kosong + tombol muat).
      // Kartu TIDAK dibuat di sini — isi malas via toggle / antre kartu.
      const buatCangkang = (kat, items) => {
        const det = document.createElement('details');
        // content-visibility: grup di luar layar dilewati style/layout/paint
        // (trace CDP: Layout 16 ms + UpdateLayoutTree 15 ms per frame untuk
        // ~120 kartu baru — dengan ini hanya grup yang terlihat yang
        // dihitung). contain-intrinsic-size auto = ukuran terakhir yang
        // dirender dipakai sebagai perkiraan tinggi saat grup di luar layar,
        // supaya scrollbar tidak melompat. Browser lama mengabaikannya.
        det.style.cssText = 'border:1px solid var(--line-soft);border-radius:var(--r-ctl);padding:12px;margin-bottom:10px;background:var(--surface);content-visibility:auto;contain-intrinsic-size:auto 200px';
        const sum = document.createElement('summary');
        sum.style.cssText = 'cursor:pointer;font-size:14px;list-style:none;display:flex;align-items:center;gap:8px;min-height:var(--tap)';
        const namaKat = document.createElement('b');
        namaKat.textContent = kat;
        const hit = document.createElement('span');
        hit.className = 'dim';
        hit.style.cssText = 'font-size:12px;font-family:var(--font-m)';
        hit.textContent = items.length + ' platform';
        const panah = document.createElement('span');
        panah.className = 'dim';
        // Panah berputar 180° saat grup terbuka (S-B6): tanpa ini grup
        // terbuka dan tertutup terlihat identik di summary-nya. Transisi
        // mati otomatis di prefers-reduced-motion (style.css:959-967).
        panah.style.cssText = 'margin-left:auto;font-size:12px;transition:transform 0.2s var(--ease)';
        panah.textContent = '▾';
        // S-B13 (D5): panah dekoratif — jangan ikut nama aksesibel grup
        // (sebelumnya SR mengumumkan "Video 1 platform ▾").
        panah.setAttribute('aria-hidden', 'true');
        sum.append(namaKat, hit, panah);
        det.appendChild(sum);
        const isi = document.createElement('div');
        isi.style.marginTop = '10px';
        det.appendChild(isi);
        const hintMuat = document.createElement('p');
        hintMuat.className = 'hint';
        det.appendChild(hintMuat);
        let tampil = 0;
        let btnMuat;
        let sudahIsi = false; // isi pertama grup (20 kartu) hanya sekali
        let dalamAntre = false; // menunggu giliran render bertahap
        const muat = () => {
          const potong = items.slice(tampil, tampil + MUAT_PER_KLIK);
          const fragKartu = document.createDocumentFragment();
          for (const p of potong) {
            fragKartu.appendChild(kartuPlatform(p, username, { badge: 'Cek manual', kelas: 'info', latar: 'var(--deep)' }));
          }
          isi.appendChild(fragKartu);
          tampil += potong.length;
          hintMuat.textContent = tampil < items.length
            ? 'Menampilkan ' + tampil + ' dari ' + items.length + ' platform.'
            : '';
          btnMuat.style.display = tampil < items.length ? '' : 'none';
        };
        // Isi pertama grup (20 kartu): sekali saja — buka-tutup berikutnya
        // tidak membangun ulang, jadi progres "Muat lebih banyak" terjaga.
        const isiAwal = () => {
          if (sudahIsi) return;
          sudahIsi = true;
          dalamAntre = false;
          muat();
        };
        // Grup tertutup: isi malas saat pertama dibuka (toggle).
        det.addEventListener('toggle', () => {
          panah.style.transform = det.open ? 'rotate(180deg)' : '';
          if (det.open && !dalamAntre) isiAwal();
        });
        // Tombol dibuat SETELAH definisi muat() (TDZ — lihat catatan btnCek).
        btnMuat = T.btn('Muat lebih banyak', muat);
        btnMuat.classList.add('morebtn');
        btnMuat.style.display = 'none'; // muat() yang menampilkannya bila perlu
        det.appendChild(btnMuat);
        if (q) {
          // Saat memfilter, grup yang cocok terbuka — kartunya masuk antre
          // render bertahap, bukan dibangun sekaligus di tugas ini.
          // dalamAntre diset DULUAN: toggle bisa jalan sinkron di sebagian
          // browser, dan handler toggle harus tahu slice yang mengurusnya.
          dalamAntre = true;
          det.open = true;
          antre.push(() => {
            dalamAntre = false;
            if (det.open) isiAwal(); // sudah ditutup sebelum giliran: isi malas nanti
          });
        }
        return det;
      };
      // Render bertahap kartu grup terbuka: potong per frame supaya tidak
      // ada long task saat filter cocok dengan ratusan platform. Slice
      // PERTAMA dibatasi 2 grup (S-B18, F-Q13-02): frame pertama transisi
      // filter berat adalah sumber longtask intermiten 150–295 ms di S-Q13
      // (cangkang + layout kartu pertama sekaligus); slice berikutnya
      // memakai anggaran waktu normal.
      const mulaiKartu = () => {
        if (!antre.length) return;
        let i = 0;
        let slicePertama = true;
        const langkah = () => {
          if (gen !== generasi) return; // filter berubah — potongan ini usang
          const t0 = performance.now();
          let dibuat = 0;
          while (i < antre.length && performance.now() - t0 < ANGGARAN_SLICE_MS &&
                 (!slicePertama || dibuat < 2)) { antre[i++](); dibuat++; }
          slicePertama = false;
          if (i < antre.length) requestAnimationFrame(langkah);
        };
        requestAnimationFrame(langkah);
      };
      if (!q) {
        // Tanpa filter: semua grup tertutup, tanpa kartu — bangun sekaligus
        // (terbukti cepat, longtask 0 di S-Q13; render awal < 330 ms).
        // Satu append untuk semua grup (DocumentFragment) — bukan satu
        // append per grup ke DOM hidup yang masing-masing memicu hitung
        // ulang gaya.
        const fragGrup = document.createDocumentFragment();
        for (const kat of urutan) fragGrup.appendChild(buatCangkang(kat, perKat.get(kat)));
        grupWrap.appendChild(fragGrup);
      } else {
        // Dengan filter: cangkang dibangun BERTAHAP per frame (anggaran
        // ~8 ms/frame, S-B18 F-Q13-02) — membangun 60+ cangkang sekaligus
        // lalu me-layout kartu pertama dalam satu frame adalah frame yang
        // meledak jadi longtask di S-Q13. Kartu mulai sesudah SEMUA
        // cangkang terpasang, supaya urutan grup di DOM tetap urutan data.
        let gi = 0;
        const langkahCangkang = () => {
          if (gen !== generasi) return; // filter berubah — potongan ini usang
          const t0 = performance.now();
          const frag = document.createDocumentFragment();
          while (gi < urutan.length && performance.now() - t0 < ANGGARAN_SLICE_MS) {
            frag.appendChild(buatCangkang(urutan[gi], perKat.get(urutan[gi])));
            gi++;
          }
          grupWrap.appendChild(frag);
          if (gi < urutan.length) requestAnimationFrame(langkahCangkang);
          else mulaiKartu();
        };
        requestAnimationFrame(langkahCangkang);
      }
    }

    filterInp.addEventListener('input', () => {
      clearTimeout(timerFilter);
      timerFilter = setTimeout(() => renderGrup(filterInp.value), DEBOUNCE_FILTER_MS);
    });
    hapusFilter.addEventListener('click', () => {
      clearTimeout(timerFilter);
      filterInp.value = '';
      renderGrup('');
      filterInp.focus();
    });
    renderGrup('');
  }

  const cek = async () => {
    if (sedangJalan) return; // cegah run ganda (tombol + Enter cepat)
    const v = bersihkanUsername(inp.value);
    if (!v.ok) {
      T.hide(box); // kosongkan dulu supaya T.show tidak memicu guard S-U7
      T.show(box, errBox(v.alasan));
      return;
    }
    const username = v.username;
    sedangJalan = true;
    btnCek.disabled = true;
    // Data belum termuat saat pengguna menekan Cek? TUNGGU (dengan status
    // jujur di box) — niat pengguna sudah jelas, dan data biasanya tiba
    // dalam hitungan milidetik karena impor dimulai sejak render(). Menolak
    // run hanya karena chunk data belum sampai adalah UX yang buruk; dan
    // run TANPA data akan menghasilkan ringkasan "0 platform" yang bohong.
    // Bila muat GAGAL: error jujur + tombol "Coba lagi" yang memuat ulang
    // halaman (dokumen baru = fetch chunk baru; impor ulang di dokumen
    // yang sama mustahil karena peta modul men-cache kegagalan — lihat
    // catatan di muatData). Tool TIDAK PERNAH mati total dan TIDAK PERNAH
    // menampilkan hasil palsu.
    if (dataStatus !== 'siap') {
      T.hide(box);
      box.hidden = false;
      const menunggu = document.createElement('p');
      menunggu.className = 'hint';
      menunggu.textContent = 'Memuat daftar platform…';
      box.appendChild(menunggu);
      let ok = true;
      try {
        const d = await muatData();
        terapkanData(d);
        tampilStatusData();
      } catch (e) {
        ok = false;
      }
      if (!ok) {
        dataStatus = 'gagal';
        tampilStatusData();
        menunggu.remove();
        box.appendChild(T.el(errBox('Daftar platform tidak bisa dimuat. Cek koneksi internet, lalu coba lagi.')));
        const w = T.el('<div style="margin-top:8px"></div>');
        // Muat ulang halaman (alasan: catatan di muatData).
        w.appendChild(T.btn('Coba lagi', () => location.reload()));
        box.appendChild(w);
        sedangJalan = false;
        btnCek.disabled = false;
        return;
      }
      // Sukses: T.hide(box) di bawah membersihkan teks tunggu sebelum run.
    }
    btnBerhenti.style.display = '';
    jalan = new AbortController();
    const signal = jalan.signal;
    const adaAuto = autoEntries.length > 0;

    // Layar hasil dibangun via DOM langsung (bukan T.show berulang) supaya
    // progres live tidak menghancurkan kartu yang sudah dirender (guard S-U7).
    T.hide(box);
    box.hidden = false;

    // --- blok progres (S-A5 §6.4): mutasi DOM langsung, bukan T.show ---
    const progres = document.createElement('div');
    progres.style.marginBottom = '12px';
    const barisAtas = document.createElement('div');
    barisAtas.style.cssText = 'display:flex;justify-content:space-between;gap:10px;font-size:13px';
    const teksStatus = document.createElement('span');
    teksStatus.className = 'mut';
    teksStatus.textContent = 'Mengecek ' + username + '…';
    const teksHitung = document.createElement('span');
    teksHitung.className = 'dim';
    teksHitung.style.cssText = 'font-family:var(--font-m);white-space:nowrap;flex:none';
    teksHitung.textContent = '0 / ' + autoEntries.length;
    barisAtas.append(teksStatus, teksHitung);
    const barLuar = document.createElement('div');
    barLuar.style.cssText = 'height:8px;border-radius:var(--r-pill);background:var(--surface-2);border:1px solid var(--hair);margin-top:8px;overflow:hidden';
    const barIsi = document.createElement('div');
    barIsi.style.cssText = 'height:100%;width:0%;background:var(--ok);border-radius:var(--r-pill);transition:width 0.3s var(--ease)';
    barLuar.appendChild(barIsi);
    const teksTemu = document.createElement('div');
    teksTemu.className = 'hint';
    teksTemu.style.marginTop = '6px';
    progres.append(barisAtas, barLuar, teksTemu);
    if (adaAuto) box.appendChild(progres);

    // --- skeleton meniru kartu hasil (.sk-row, S-A5 §3.2) ---
    const skel = T.el('<div class="skel">' +
      '<div class="sk-row"><span class="sk-ic sm"></span><span class="sk-col"><span class="sk-line w60"></span><span class="sk-line w25"></span></span></div>' +
      '<div class="sk-row"><span class="sk-ic sm"></span><span class="sk-col"><span class="sk-line w45"></span><span class="sk-line w25"></span></span></div>' +
      '<div class="sk-row"><span class="sk-ic sm"></span><span class="sk-col"><span class="sk-line w70"></span><span class="sk-line w25"></span></span></div>' +
      '</div>');
    if (adaAuto) box.appendChild(skel);

    // --- wadah hasil auto + ringkasan (diisi bertahap selama run) ---
    const wadahAuto = document.createElement('div');
    const wadahRingkasan = document.createElement('div');
    box.appendChild(wadahAuto);
    box.appendChild(wadahRingkasan);

    // --- seksi manual (data statis: tampil langsung, tidak menunggu fetch) ---
    // O2 (S-B6): bila tidak ada satu pun entri manual, seluruh seksi ini
    // (judul + penjelasan + filter) tidak berlaku — sembunyikan, jangan
    // tampilkan penjelasan tentang tautan yang tidak ada + filter yang
    // hanya bisa menjawab "Tidak ada platform yang cocok.".
    if (manualEntries.length) {
      box.appendChild(T.el('<hr class="divi">'));
      const wadahManual = document.createElement('div');
      box.appendChild(wadahManual);
      bangunManual(username, wadahManual);
    }

    // --- catatan kaki (S-A9 §3h + §3i + hint sumber §3/RC-10) ---
    // Hint sumber S-A9 ("Sumber: Sherlock dan WhatsMyName.") DITAHAN di v1
    // stub: mengklaim sumber itu pada 12 entri pilihan tangan adalah klaim
    // palsu. Data final S-A4b/S-B18 memakai ketiga database itu (Maigret
    // dominan + Sherlock + WhatsMyName — perincian di
    // audit/merge-stats-a4b.json), jadi hint dikembalikan S-B18 dengan
    // daftar sumber yang jujur. (24 tambahan S-A4 adalah entri pilihan
    // tangan, bukan database — tidak disebut di hint satu baris ini.)
    box.appendChild(T.el('<div>' +
      '<p class="hint">Username yang kamu tulis dikirim ke platform yang dicek langsung, supaya platform itu bisa menjawab ada atau tidak. Untuk platform yang hanya tautan, tidak ada yang dikirim sampai kamu membuka tautannya. Username tidak disimpan di sini.</p>' +
      '<p class="hint">Sebagian profil hanya bisa dilihat kalau kamu sudah masuk ke akun di platform itu. Kalau tautan membawamu ke halaman masuk, itu bukan berarti username tidak ada, profilnya saja yang dikunci untuk pengunjung.</p>' +
      '<p class="hint">Sumber: Maigret, Sherlock, dan WhatsMyName.</p>' +
      '</div>'));

    // --- seksi "Ditemukan" (dibuat malas saat kartu pertama ketemu) ---
    let seksiAda = null;
    let daftarAda = null;
    const gagalList = [];
    let temu = 0;
    let skeletonHidup = adaAuto;
    const hapusSkeleton = () => { if (skeletonHidup) { skeletonHidup = false; skel.remove(); } };

    try {
      const hasil = adaAuto ? await cekOtomatis(autoEntries, username, {
        signalLuar: signal,
        onSatu: (r) => {
          hapusSkeleton();
          if (r.status === 'ada') {
            temu++;
            if (!seksiAda) {
              seksiAda = document.createElement('div');
              const j = document.createElement('div');
              j.style.cssText = 'font-weight:800;font-size:16px;margin:4px 0 8px';
              j.textContent = 'Ditemukan';
              daftarAda = document.createElement('div');
              seksiAda.append(j, daftarAda);
              wadahAuto.appendChild(seksiAda);
            }
            daftarAda.appendChild(kartuPlatform(r.entri, username, { badge: 'Ada', kelas: 'ok' }));
            teksTemu.textContent = temu + ' ditemukan sejauh ini';
          } else if (r.status === 'gagal') {
            gagalList.push(r);
          }
          // 'tidak-ada' sengaja tidak dirender per baris — diringkas di akhir
          // ("Tidak ditemukan di N platform") supaya ratusan baris tidak
          // jadi derau (S-A5 §6.5, S-A9 §3).
        },
        onProgres: (selesai, total) => {
          teksHitung.textContent = selesai + ' / ' + total;
          barIsi.style.width = (total ? Math.round((selesai / total) * 100) : 0) + '%';
          teksStatus.textContent = 'Mengecek ' + username + '… ' + selesai + ' dari ' + total + ' platform sudah dicek';
        },
      }) : [];
      hapusSkeleton();

      const ringkasan = ringkasHasil(hasil);
      const dibatalkan = signal.aborted;

      // Ringkasan (S-A9): angka nyata dari proses jalan.
      if (adaAuto) {
        const ringkasanEl = document.createElement('p');
        ringkasanEl.className = 'hint';
        ringkasanEl.textContent = 'Dicek langsung di ' + ringkasan.total + ' platform, ditemukan di ' + ringkasan.ada + ' platform. ' + manualEntries.length + ' tautan lain bisa kamu buka sendiri.';
        wadahRingkasan.appendChild(ringkasanEl);
        if (ringkasan.tidakAda > 0) {
          const t = document.createElement('p');
          t.className = 'hint';
          t.textContent = 'Tidak ditemukan di ' + ringkasan.tidakAda + ' platform.';
          wadahRingkasan.appendChild(t);
        }
        if (dibatalkan) {
          const t = document.createElement('p');
          t.className = 'hint';
          t.textContent = 'Pengecekan dihentikan: ' + ringkasan.total + ' dari ' + autoEntries.length + ' platform sudah dicek.';
          wadahRingkasan.appendChild(t);
        }
      }

      // Empty: tidak ada yang ditemukan DAN minimal satu platform menjawab
      // tegas "tidak ada". Bila SEMUA cek gagal, ini bukan empty — itu error
      // (di bawah), karena kita tidak tahu apa-apa.
      // Varian S-A9 §3(e): bila tidak ada tautan manual sama sekali, kalimat
      // kedua ("sebagian platform hanya bisa dicek dengan membuka tautannya")
      // tidak berlaku — pakai satu kalimat saja.
      const teksEmpty = manualEntries.length
        ? 'Username ini tidak muncul di platform yang dicek langsung dari sini. Bukan berarti username ini tidak dipakai di mana-mana, karena sebagian platform hanya bisa dicek dengan membuka tautannya.'
        : 'Username ini tidak muncul di platform yang dicek langsung dari sini.';
      if (adaAuto && !dibatalkan && ringkasan.ada === 0 && ringkasan.tidakAda > 0) {
        wadahAuto.appendChild(T.el(
          '<div class="center"><div style="font-weight:800;font-size:16px">Tidak ditemukan di platform yang bisa dicek langsung</div>' +
          '<p class="dim" style="font-size:13px;line-height:1.6;margin-top:8px">' + teksEmpty + '</p></div>'));
      }

      // Gagal dicek: tampilkan sebagai "tidak bisa dipastikan", bukan "tidak ada".
      if (gagalList.length) {
        const gagalTotal = adaAuto && !dibatalkan && ringkasan.total > 0 && ringkasan.gagal === ringkasan.total;
        if (gagalTotal) {
          wadahRingkasan.appendChild(T.el(errBox('Pengecekan gagal. Cek koneksi internet, lalu coba lagi.')));
          const w = T.el('<div style="margin-top:8px"></div>');
          w.appendChild(T.btn('Coba lagi', cek));
          wadahRingkasan.appendChild(w);
        } else if (!dibatalkan) {
          const t = document.createElement('p');
          t.className = 'hint';
          t.textContent = 'Sebagian platform tidak bisa dicek sekarang. Hasil di bawah ini hanya dari platform yang berhasil dicek.';
          wadahRingkasan.appendChild(t);
        }
        const seksiGagal = document.createElement('div');
        const j = document.createElement('div');
        j.style.cssText = 'font-weight:800;font-size:16px;margin:14px 0 8px';
        j.textContent = 'Tidak bisa dipastikan';
        seksiGagal.appendChild(j);
        const tampil = gagalList.slice(0, MUAT_PER_KLIK);
        for (const r of tampil) {
          seksiGagal.appendChild(kartuPlatform(r.entri, username, { badge: 'Tidak bisa dipastikan', kelas: 'err', sub: alasanGagal(r.alasan) }));
        }
        if (gagalList.length > tampil.length) {
          const t = document.createElement('p');
          t.className = 'hint';
          t.textContent = 'Dan ' + (gagalList.length - tampil.length) + ' platform lain juga tidak bisa dipastikan.';
          seksiGagal.appendChild(t);
        }
        // O1 (S-B6): gagal SEBAGIAN kini punya tombol "Coba lagi" sendiri di
        // bawah seksi gagal — pola yang sama seperti retry gagal-total
        // (cek ulang penuh via cek(); label "Coba lagi" sudah terverifikasi
        // S-B5, bukan label baru "Cek ulang yang gagal" yang menjanjikan
        // retry khusus gagal). Tidak tampil saat gagal total (tombolnya
        // sudah ada di ringkasan) atau saat pengguna menekan Berhenti.
        if (!gagalTotal && !dibatalkan) {
          const w = T.el('<div style="margin-top:8px"></div>');
          w.appendChild(T.btn('Coba lagi', cek));
          seksiGagal.appendChild(w);
        }
        wadahAuto.appendChild(seksiGagal);
      }
    } catch (e) {
      // Kegagalan tak terduga di luar per-platform (seharusnya tidak terjadi:
      // cekOtomatis menangkap error per item).
      hapusSkeleton();
      wadahRingkasan.appendChild(T.el(errBox('Pengecekan gagal. Cek koneksi internet, lalu coba lagi.')));
      const w = T.el('<div style="margin-top:8px"></div>');
      w.appendChild(T.btn('Coba lagi', cek));
      wadahRingkasan.appendChild(w);
    } finally {
      // Run selesai (sukses / gagal / dihentikan): sembunyikan blok progres
      // (S-B6, sesuai S-A5 §6.4 — "bilah disembunyikan"). Sebelumnya bilah
      // penuh 100% + teks "Mengecek …" (present tense) menetap selamanya
      // dan terbaca seperti masih berjalan; angka akhirnya sudah ada di
      // ringkasan ("Dicek langsung di N platform…") dan pesan berhenti.
      progres.style.display = 'none';
      sedangJalan = false;
      btnCek.disabled = false;
      btnBerhenti.style.display = 'none';
      jalan = null;
    }
  };

  btnCek = T.btn('Cek username', cek, true);
  btnBerhenti = T.btn('Berhenti', () => { if (jalan) jalan.abort(); });
  btnBerhenti.style.display = 'none';

  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') cek(); });
  root.appendChild(T.el('<p class="note">Tulis satu username untuk melihat di platform mana saja username itu dipakai. Sebagian platform bisa dicek langsung dari sini, sebagian lagi hanya bisa kamu buka sendiri lewat tautan.</p>'));
  root.appendChild(T.field('Username', inp, 'Username hanya dipakai untuk pengecekan ini'));
  root.appendChild(T.row(btnCek, btnBerhenti));
  // Area status data di luar box hasil supaya tidak terhapus saat run
  // (T.hide/T.show) — isinya diatur tampilStatusData().
  root.appendChild(statusData);
  root.appendChild(box);

  // Mulai muat data SEGERA (paralel dengan pengguna membaca/mengetik) —
  // UI di atas sudah tampil; data menyusul dengan status jujur. Bila
  // render() dipanggil ulang dan data sudah di-cache modul, terapkan
  // langsung tanpa kedip status muat.
  if (dataSiap) {
    terapkanData(dataSiap);
    tampilStatusData();
  } else {
    tampilStatusData();
    muatData().then((d) => { terapkanData(d); tampilStatusData(); }).catch(() => { dataStatus = 'gagal'; tampilStatusData(); });
  }
}
