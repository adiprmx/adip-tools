/* ============================================================
   ADIP Tools v6.12.0 — search-plus.js (TIM 09: pencarian, filter & favorit)
   Peningkatan mesin pencari di ATAS rankedSearch yang sudah ada di app.js.

   KENAPA MODUL INI ADA (hasil audit TIM 09, 15 Nov 2026):
   app.js SUDAH punya: smart search typo-tolerant (port v4.5.1),
   command palette (Ctrl+K), favorit + riwayat localStorage, filter
   "Favorit" & "Terbaru", halaman #/favorit, highlight hasil. Semua itu
   TIDAK diduplikasi di sini. Yang masih kurang — dan dibuktikan lewat
   tes 100 kueri sehari-hari terhadap rankedSearch asli — ada 3:
     1. rankedSearch memakai Math.max per kata: satu kata generik
        ("cek", "buat", "ke", "foto", "hitung") mendominasi, tool yang
        cocok dengan SEMUA kata justru kalah. Contoh nyata: "cek ongkir",
        "cek resi", "cek weton", "cek plagiat", "cek nomor hp" semuanya
        menaruh "kontras" di peringkat 1; "hitung umur" menaruh
        "biaya-paylater" di peringkat 1, bukan age-calc.
     2. Tidak ada pemetaan niat berbahasa Indonesia sehari-hari:
        "kecilin foto" (bukan image-compress), "gabung pdf" (bukan
        pdflab), "potong lagu" (bukan audio-trimmer), "hapus background"
        (bukan removebg), "salin teks dari gambar" (bukan ocrintel),
        "foto 3x4" (bukan crop-pas-foto), "suara ke teks" (bukan
        dikte-suara) — semuanya salah peringkat 1.
     3. Kueri tanpa hasil ("nickname", "wallpaper", "parafrase") hanya
        dapat empty state statis tanpa saran "Maksud kamu...?".

   ISI MODUL (murni fungsi data, tanpa DOM — bisa dites di Node):
     - rankedSearchPlus(q, manifest, opts): ranker pengganti yang
       memperbaiki (1) dan (2): bonus kata-cocok-ganda, peredam kata
       generik (stopword), stemming ringan Bahasa Indonesia, dan
       pemetaan frasa sehari-hari -> tool yang benar.
     - suggestDidYouMean(q, manifest): saran tool terdekat untuk
       kueri tanpa hasil, atau null bila tidak ada yang cukup dekat
       (jujur: jangan memaksakan saran yang tidak nyambung).
     - assessQuery(q, manifest, opts): hasil + flag `confident` +
       `suggestion` nama-terdekat. Membedakan hasil yang bisa dipercaya
       dari hasil kebetulan fuzzy ("cek resi" -> gaji-prorata lewat
       "resi" ~ "resign") supaya UI tidak menampilkan tool yang tidak
       nyambung seolah relevan.
     - getRecentSearches / addRecentSearch / clearRecentSearches:
       riwayat kata pencarian di localStorage (baru — yang sudah ada
       di app.js hanya riwayat TOOL, bukan riwayat KATA pencarian).

   CATATAN DUPLIKASI: lev() + fuzzyScore() di sini adalah salinan dari
   app.js (v4.5.1) karena app.js tidak mengekspornya. Bila koordinator
   nanti mengekspor keduanya dari app.js, hapus salinan di sini dan
   import dari sana. Perilaku fuzzy-nya SAMA PERSIS (ambang & skor
   tidak diubah) supaya tidak ada regresi pada kueri yang sudah benar.

   Semua ID tool di PHRASE_RULES sudah diverifikasi ADA di manifest
   v6.11.5 (588 tools). Kueri yang memang belum ada tool-nya (cek resi,
   lacak paket, cek plagiat, parafrase, wallpaper, tes IQ, tebak gambar,
   download video) SENGAJA tidak dipetakan — dilaporkan sebagai celah
   katalog di laporan TIM 09, bukan dipalsukan dengan tool yang tidak
   nyambung.
   ============================================================ */

/* S-U5 (v6.22.0, manifest split): versi detail + loader dari
   manifest-boot.js — SATU-SATUNYA impor modul ini. manifest-boot.js
   tidak mengimpor apa pun, jadi tidak ada siklus. Di Node, manifest
   yang dipakai pemanggil adalah manifest.js PENUH (desc selalu ada,
   versi selalu 0) — perilaku cache persis seperti sebelum split. */
import { manifestDetailsVersion, loadManifestDetails, needsDetails } from './manifest-boot.js';

/* tool yang disembunyikan dari pencarian (sama seperti app.js) */
export const SEARCH_DENY = ['muse-test'];

/* ---------------- fuzzy (salinan app.js v4.5.1, perilaku sama) ---------------- */
function lev(a, b) {
  if (a === b) return 0;
  const m = a.length, n = b.length;
  if (!m) return n; if (!n) return m;
  if (Math.abs(m - n) > 2) return 3;
  const d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 1; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[m][n];
}
function fuzzyScore(q, t) {
  if (!q || !t) return 0;
  if (t === q) return 100;
  if (t.startsWith(q)) return 90;
  if (t.includes(q)) return 70;
  const dist = lev(q, t);
  if (q.length >= 4 && dist <= 1) return 55;
  if (q.length >= 5 && dist <= 2) return 40;
  let qi = 0, score = 0, last = -1;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) { score += last + 1 === ti ? 6 : 4; last = ti; qi++; }
  }
  return qi === q.length ? Math.min(30, score / q.length) : 0;
}

/* ---------------- stemming ringan Bahasa Indonesia ----------------
   Hanya untuk BONUS kecocokan (skor 85 bila akar katanya sama), bukan
   pengganti fuzzy mentah — jadi "terjemah" tetap cocok dengan
   "penerjemah" lewat substring walau akarnya beda ("jemah" vs
   "nerjemah"). Konservatif: imbuhan hanya dipotong bila sisanya
   masih >= 4 huruf (awalan) / >= 3-4 huruf (akhiran, tergantung akhiran).
   Akhiran -i SENGAJA TIDAK ADA: "-i" di ujung kata Indonesia lebih
   sering bagian dari akar ("gaji"->"gaj", "janji"->"janj", "pelangi"->
   "pelang") daripada sufiks — dan bug itu sempat mematahkan pencocokan
   frasa ber-stem ("menghitung gaji" -> "hitung gaj", 15 Nov 2026).
   Kata kerja -i ("mencintai") tetap ketemu lewat fuzzy (lev 1). */
const PREFIX = ['meng', 'peng', 'mem', 'men', 'pen', 'ber', 'ter', 'per', 'me', 'pe', 'di', 'ke', 'se'];
const SUFFIX = [['nya', 3], ['lah', 3], ['kah', 3], ['kan', 4], ['an', 4]];
export function stemId(w) {
  let s = String(w || '').toLowerCase();
  for (const [suf, min] of SUFFIX) {
    if (s.length - suf.length >= min && s.endsWith(suf)) { s = s.slice(0, -suf.length); break; }
  }
  for (const pre of PREFIX) {
    if (s.length - pre.length >= 4 && s.startsWith(pre)) { s = s.slice(pre.length); break; }
  }
  return s;
}

/* ---------------- kata generik: didengarkan, tapi tidak dominan ----------------
   Kata-kata ini muncul di hampir semua kueri niat ("cek X", "buat X",
   "hitung X", "X ke Y") tapi tidak membedakan tool mana yang dicari.
   Bobot 0.35 + tidak dihitung sebagai "kata cocok tambahan". */
export const STOPWORDS = new Set([
  'cek', 'buat', 'bikin', 'cari', 'hitung', 'menghitung', 'ke', 'dari', 'di', 'yang',
  'dan', 'atau', 'untuk', 'cara', 'apa', 'ini', 'itu', 'dengan', 'jadi', 'mau',
  'tolong', 'dong', 'ya', 'kah', 'sih', 'kok', 'aja', 'saja', 'adalah', 'saya',
  'aku', 'kamu', 'gimana', 'bagaimana', 'berapa', 'kapan', 'dimana', 'di mana',
]);

/* ---------------- sinonim per kata: kata sehari-hari -> kata katalog ---------------- */
export const WORD_SYNONYMS = {
  kecilin: ['kompres', 'compress', 'resize'],
  kecilkan: ['kompres', 'compress', 'resize'],
  perkecil: ['kompres', 'compress', 'resize'],
  gabung: ['merge', 'kolase'],
  gabungin: ['merge', 'kolase', 'gabung'],
  satuin: ['merge', 'kolase', 'gabung'],
  potong: ['trim'],
  lagu: ['audio', 'mp3', 'musik'],
  pelajaran: ['belajar', 'mapel'],
  uang: ['keuangan', 'gaji', 'tabungan', 'anggaran'],
  hutang: ['utang'],
  tulisan: ['teks'],
  cari: ['cek'],
};
/* SENGAJA TIDAK ADA: foto<->gambar dan nilai->grade/rapor. Tes 15 Nov 2026
   membuktikan keduanya merusak peringkat: hantu "foto" membuat
   "tebak gambar" dimenangi image-compress (bukan tebak-angka), dan hantu
   "grade"/"rapor" membuat "nilai ipk" dimenangi konversi-nilai (bukan
   ipk). Kebanyakan tool gambar sudah punya kedua kata itu di keyword-nya. */

/* ---------------- frasa niat: kalimat sehari-hari -> tool yang benar ----------------
   Setiap `tools` diverifikasi ADA di manifest v6.11.5. Boost +45 cukup
   untuk mengalahkan kecocokan satu kata generik, tapi tidak mengalahkan
   kecocokan judul + frasa penuh pada tool lain yang lebih tepat. */
export const PHRASE_RULES = [
  { keys: ['gabung pdf', 'satuin pdf', 'gabungin pdf', 'gabung pdf jadi satu'], tools: ['pdflab'] },
  { keys: ['kompres pdf', 'kecilin pdf', 'kecilkan pdf', 'perkecil pdf'], tools: ['pdflab'] },
  { keys: ['pdf ke jpg', 'pdf ke png', 'pdf ke gambar', 'pdf jadi jpg'], tools: ['pdflab', 'image-convert'] },
  { keys: ['jpg ke pdf', 'png ke pdf', 'foto ke pdf', 'gambar ke pdf', 'foto jadi pdf'], tools: ['pdflab'] },
  { keys: ['kecilin foto', 'kecilkan foto', 'kompres foto', 'perkecil foto', 'foto kegedean', 'ukuran foto kegedean'], tools: ['image-compress'] },
  { keys: ['jpg ke png', 'png ke jpg', 'ubah format foto', 'ganti format gambar', 'ubah jpg', 'konversi gambar'], tools: ['image-convert'] },
  { keys: ['potong lagu', 'potong mp3', 'potong audio', 'trim lagu', 'potong musik'], tools: ['audio-trimmer'] },
  { keys: ['hapus background', 'hapus latar', 'hapus latar belakang', 'background foto', 'latar foto'], tools: ['removebg'] },
  { keys: ['gabung foto', 'satuin foto', 'gabungin foto', 'gabung gambar'], tools: ['kolase-foto'] },
  { keys: ['salin teks dari gambar', 'teks dari gambar', 'gambar ke teks', 'foto ke teks', 'scan teks', 'baca teks di foto', 'teks di gambar'], tools: ['ocrintel'] },
  { keys: ['suara ke teks', 'ngomong jadi teks', 'bicara jadi teks', 'ucapan ke teks'], tools: ['dikte-suara'] },
  { keys: ['foto 3x4', 'foto 4x6', 'foto 2x3', 'pas foto', 'pasfoto', 'foto ktp', 'foto lamaran'], tools: ['crop-pas-foto'] },
  { keys: ['daftar pustaka'], tools: ['citation'] },
  { keys: ['cek ongkir', 'ongkir jne', 'ongkir jnt', 'biaya ongkir', 'hitung ongkir'], tools: ['berat-volumetrik'] },
  { keys: ['cek nomor hp', 'nomor hp', 'no hp', 'nomor handphone', 'nomor telepon'], tools: ['format-hp'] },
  { keys: ['buat qr', 'qr code', 'kode qr', 'bikin qr'], tools: ['qr-generator'] },
  /* P1 S-A2 (v6.22.0): "barcode" juara qr-decoder (pembaca QR) padahal
     niat umumnya membuat barcode; survivor merge D2 adalah qr-generator. */
  { keys: ['barcode', 'buat barcode', 'kode batang'], tools: ['qr-generator'] },
  { keys: ['hitung umur', 'umur berapa', 'tanggal lahir'], tools: ['age-calc'] },
  { keys: ['jadwal haid', 'hitung haid', 'masa subur', 'siklus haid', 'jadwal mens'], tools: ['siklus-haid'] },
  { keys: ['kalkulator cinta', 'cek jodoh', 'kecocokan nama'], tools: ['cocoklogi-nama'] },
  { keys: ['cocoklogi'], tools: ['cocoklogi-nama', 'meter-bucin'] },
  { keys: ['bucin', 'meter bucin'], tools: ['meter-bucin'] },
  { keys: ['nama ff', 'nama game', 'nickname', 'nama panggilan', 'nama ml', 'nama pubg'], tools: ['nama-brand'] },
  { keys: ['bio ig', 'bio instagram', 'link bio', 'link di bio'], tools: ['bio-link'] },
  { keys: ['caption ig', 'caption instagram', 'buat caption', 'bikin caption'], tools: ['generator-hashtag'] },
  { keys: ['gradasi warna', 'gradient warna', 'warna gradasi'], tools: ['gradient'] },
  { keys: ['fee shopee', 'fee tokopedia', 'fee tiktok', 'potongan marketplace', 'fee admin marketplace'], tools: ['fee-marketplace'] },
  { keys: ['jadwal pelajaran'], tools: ['jadwal-belajar'] },
  { keys: ['tulisan miring', 'tulisan keren', 'tulisan aesthetic', 'tulisan unik', 'huruf keren'], tools: ['fancy-text', 'paduan-font'] },
  { keys: ['font aesthetic'], tools: ['paduan-font'] },
  { keys: ['hitung gaji', 'gaji bersih', 'take home pay'], tools: ['kalkulator-gaji-bersih'] },
  { keys: ['skripsi', 'tugas akhir'], tools: ['citation'] },
  { keys: ['penghitung kalori', 'hitung kalori', 'kalkulator kalori'], tools: ['bmi'] },
  { keys: ['kpr', 'cicilan rumah', 'kredit rumah', 'cicilan kpr'], tools: ['kpr'] },
  { keys: ['cek weton', 'hitung weton'], tools: ['kalender-jawa'] },
  { keys: ['cek khodam'], tools: ['cek-khodam'] },
  { keys: ['video ke mp3', 'video jadi mp3', 'mp3 dari video'], tools: ['video-ke-mp3'] },
];
const PHRASE_BOOST = 45;
const CALC_BOOST = 20; // kueri generik "kalkulator" (atau typo-nya) -> kalkulator umum

/* ---------------- normalisasi + analisis kueri ---------------- */
function normQ(q) {
  return String(q || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
}
/* analisis kueri: dipakai rankedSearchPlus + diekspor untuk tes/debug */
export function analyzeQuery(q) {
  const norm = normQ(q);
  const terms = norm ? norm.split(' ') : [];
  const padded = ' ' + norm + ' ';
  // frasa dicocokkan juga pada bentuk berimbuhan yang sudah di-stem:
  // "menghitung gaji" -> "hitung gaji" tetap kena aturan frasa.
  const stemmed = ' ' + terms.map(stemId).join(' ') + ' ';
  const boosts = new Map(); // toolId -> boost
  for (const rule of PHRASE_RULES) {
    if (rule.keys.some((k) => padded.includes(' ' + k + ' ') || stemmed.includes(' ' + k + ' '))) {
      for (const id of rule.tools) boosts.set(id, Math.max(boosts.get(id) || 0, PHRASE_BOOST));
    }
  }
  // kueri satu kata yang (typo-)sama dengan "kalkulator" -> kalkulator umum
  if (terms.length === 1 && fuzzyScore(terms[0], 'kalkulator') >= 40) {
    boosts.set('kalkulator-umum', Math.max(boosts.get('kalkulator-umum') || 0, CALC_BOOST));
  }
  // sinonim per kata (hantu: bobot 0.7, dihitung setengah untuk bonus ganda).
  // Setiap hantu mengingat kata asalnya: bila kata asal SUDAH cocok kuat
  // (skor mentah >= 80) pada satu tool, hantunya tidak dihitung untuk tool
  // itu — sinonim memperluas jangkauan ke tool yang TIDAK cocok kata
  // asalnya, bukan menggandakan skor tool yang sudah cocok. Tanpa aturan
  // ini, "tulisan miring" dimenangi teks-tulisan-tangan (hantu "teks"
  // menumpuk di atas "tulisan" yang sudah cocok persis di namanya).
  const ghosts = [];
  for (const t of terms) {
    const syns = WORD_SYNONYMS[t] || WORD_SYNONYMS[stemId(t)];
    if (syns) for (const s of syns) if (!terms.includes(s) && !ghosts.some((g) => g.g === s)) ghosts.push({ g: s, src: t });
  }
  return { norm, terms, ghosts, boosts };
}

/* ---------------- indeks token per tool (di-cache per array manifest) ----------------
   S-U5 (v6.22.0, manifest split): cache menyimpan versi detail
   (manifestDetailsVersion) bersama indeksnya — begitu detail
   desc/keywords ditempel (merge-in-place), versi berubah dan
   indeks DIBANGUN ULANG supaya pencarian memakai data penuh.
   Tanpa ini, pencarian pertama mengunci indeks nama-saja untuk
   seluruh sesi. */
const indexCache = new WeakMap();
function buildIndex(manifest) {
  const hit = indexCache.get(manifest);
  if (hit && hit.version === manifestDetailsVersion) return hit.idx;
  /* Manifest masih ramping: mulai pemuatan detail (fire-and-forget).
     Pencarian ini tetap jalan dengan indeks nama-saja; keystroke
     berikutnya (debounce 150-180 ms) memakai indeks penuh begitu
     versi berubah. loadManifestDetails tidak pernah reject. */
  if (needsDetails(manifest)) loadManifestDetails().catch(() => {});
  const idx = manifest
    .filter((m) => !SEARCH_DENY.includes(m.id))
    .map((m, i) => {
      const tok = new Map(); // kata -> bobot tertinggi
      const add = (text, w) => {
        for (const word of String(text || '').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)) {
          tok.set(word, Math.max(tok.get(word) || 0, w));
        }
      };
      add(m.name, 1.0);
      const kws = String(m.keywords || '').split(',').map((k) => k.trim().toLowerCase()).filter(Boolean);
      for (const k of kws) {
        tok.set(k, Math.max(tok.get(k) || 0, 0.8)); // frasa keyword utuh ("pas foto")
        add(k, 0.8);
      }
      add(m.desc || '', 0.6);
      return {
        m, i,
        name: m.name.toLowerCase(),
        kws: kws.join(' '),
        tokens: [...tok.entries()].map(([w, weight]) => ({ w, weight, stem: stemId(w) })),
      };
    });
  indexCache.set(manifest, { version: manifestDetailsVersion, idx });
  return idx;
}

/* Awalan (prefix) hanya dihitung kecocokan KUAT bila kata kueri cukup
   panjang: >= 5 huruf, atau >= 4 huruf dan menutupi >= 60% kata target.
   Tanpa penjaga ini, "resi" (4 huruf) prefix-cocok ke "resistensi" dan
   dihitung exact (P0 S-A2: "cek resi" tampil yakin, skor 90). Batas bawah
   4 huruf di cabang rasio menutup "res" (3 huruf) -> "resmi" (rasio 0,6)
   yang selama ini juga lolos sebagai exact. Penjaga yang sama dipakai
   skor saran (suggestScore) supaya "Maksud kamu" tidak menebak dari
   potongan kata yang pendek. */
function isStrongPrefix(q, t) {
  if (q.length >= 5) return true;
  if (q.length >= 4 && q.length / t.length >= 0.6) return true;
  return false;
}

/* skor satu kata kueri terhadap satu tool (0-100, sebelum bobot kata),
   plus flag exact: kata itu cocok KATA UTUH (sama persis / akar sama)
   atau awalan yang kuat — bukan sekadar awalan pendek. Skornya TIDAK
   berubah (peringkat hasil tetap sama); yang berubah hanya apakah
   kecocokan itu dipercaya sebagai "exact" oleh assessQuery. */
function termScore(term, entry) {
  const stem = stemId(term);
  let best = 0, exact = false;
  for (const t of entry.tokens) {
    let s = fuzzyScore(term, t.w) * t.weight;
    let full = t.w === term;
    if (stem.length >= 4 && stem === t.stem) { s = Math.max(s, 85 * t.weight); full = true; }
    if (!full && t.w !== term && t.w.startsWith(term)) full = isStrongPrefix(term, t.w);
    if (s > best) best = s;
    if (s >= 80 && full) exact = true;
  }
  return { s: best, exact };
}

const FAV_BOOST = 8, REC_BOOST = 6, TITLE_BONUS = 12, MULTI_BONUS = 12, THRESHOLD = 15;

/* kata generik? dicek juga bentuk stem-nya: "menghitung"/"penghitung"
   berakar "hitung" -> ikut diredam, supaya "Penghitung Kata" tidak
   merangsek ke peringkat 1 kueri "penghitung kalori". */
const isStop = (t) => STOPWORDS.has(t) || STOPWORDS.has(stemId(t));

/* ---------------- penilaian semua tool (dipakai ranker + assessQuery) ----------------
   Diagnostik per tool:
   - exact: ada kata isi yang cocok KATA UTUH (skor mentah >= 80, kata
     sama persis / akar sama) atau awalan yang kuat (isStrongPrefix).
     Awalan pendek ("resi" -> "resistensi", "res" -> "resmi") TIDAK
     dihitung exact — itu akar P0 S-A2.
   - multi: >= 1 kata isi TAMBAHAN yang cocok (di luar kata terbaik).
   - boosted: kena aturan frasa niat.
   Ketiganya dipakai assessQuery untuk membedakan "hasil yang bisa
   dipercaya" dari "hasil kebetulan fuzzy" (mis. "cek resi" -> gaji-prorata
   lewat "resi" ~ "resign": skor 72 tapi bukan exact, bukan multi, bukan
   boost -> TIDAK dipercaya). */
function scoreAll(q, manifest, opts = {}) {
  const { favIds = new Set(), recIds = new Set() } = opts;
  const idx = buildIndex(manifest);
  const { norm, terms, ghosts, boosts } = analyzeQuery(q);
  if (!norm) return idx.map((e) => ({ m: e.m, s: 0, exact: false, multi: false, boosted: false, idLen: e.m.id.length, nameLen: e.m.name.length, i: e.i }));
  const scored = [];
  for (const entry of idx) {
    const termHits = [];
    const rawByTerm = new Map();
    for (const t of terms) {
      const { s: raw, exact: termExact } = termScore(t, entry);
      rawByTerm.set(t, raw);
      const stop = isStop(t);
      termHits.push({ s: raw * (stop ? 0.35 : 1), raw, stop, counts: !stop && raw > THRESHOLD, ghost: false, exact: termExact });
    }
    for (const { g, src } of ghosts) {
      if ((rawByTerm.get(src) || 0) >= 80) continue; // kata asal sudah cocok kuat
      const { s: raw, exact: termExact } = termScore(g, entry);
      termHits.push({ s: raw * 0.7, raw, counts: raw > THRESHOLD, ghost: true, exact: termExact });
    }
    termHits.sort((a, b) => b.s - a.s);
    const best = termHits.length ? termHits[0].s : 0;
    let extra = 0;
    for (let k = 1; k < termHits.length && extra < 3; k++) {
      if (termHits[k].counts) extra += termHits[k].ghost ? 0.5 : 1;
    }
    let score = best + MULTI_BONUS * Math.min(extra, 3);
    if (entry.name.includes(norm)) score += TITLE_BONUS + 8; // frasa penuh di judul
    else if (entry.kws.includes(norm)) score += TITLE_BONUS;
    const boost = boosts.get(entry.m.id);
    if (boost) {
      if (score < 30) score = 30; // lantai: niat frasa tetap ditampilkan
      score += boost;
    }
    if (favIds.has(entry.m.id)) score += FAV_BOOST;
    if (recIds.has(entry.m.id)) score += REC_BOOST;
    if (score > THRESHOLD) {
      scored.push({
        m: entry.m, s: score,
        exact: termHits.some((h) => h.exact && !h.stop),
        multi: extra >= 1,
        boosted: Boolean(boost),
        idLen: entry.m.id.length, nameLen: entry.m.name.length, i: entry.i,
      });
    }
  }
  // Seri skor: ID terpendek dulu (tool generik cenderung ber-ID pendek;
  // terbukti memperbaiki "harga jual" & "bayar pajak" yang kalah oleh
  // tool spesifik ber-nama pendek), lalu urutan manifest. Deterministik.
  scored.sort((a, b) => b.s - a.s || a.idLen - b.idLen || a.i - b.i);
  return scored;
}

/* ---------------- ranker utama ----------------
   opts: { favIds?: Set<string>, recIds?: Set<string>, limit?: number }
   Perilaku kunci vs rankedSearch lama:
   - skor = kata-terbaik + bonus per kata TAMBAHAN yang cocok (maks 3 kata
     tambahan dihitung) -> tool yang cocok semua kata menang atas tool yang
     cuma cocok satu kata generik.
   - kata stopword (termasuk bentuk berimbuhannya) bobot 0.35 dan tidak
     dihitung sebagai kata tambahan.
   - frasa niat memberi boost +45 (dengan lantai skor 30: tool yang
     dipetakan frasa tetap muncul walau tidak ada kata kuncinya yang cocok,
     mis. "nickname" -> nama-brand). */
export function rankedSearchPlus(q, manifest, opts = {}) {
  const { limit = 24 } = opts;
  return scoreAll(q, manifest, opts).slice(0, limit).map((x) => x.m);
}

/* ---------------- penilaian keyakinan + saran nama terdekat ----------------
   assessQuery(q, manifest, opts) -> { results, confident, suggestion, topScore, topExact }
   - confident: peringkat 1 kena boost frasa, ATAU (cocok persis DAN kueri
     satu kata isi, ATAU cocok persis + cocok kata lain).
   - suggestion: tool terdekat berdasarkan NAMA saja (bukan keyword —
     supaya "cek resi" tidak disarankan "Gaji Prorata" lewat keyword
     "resign"), atau null bila tidak ada yang cukup dekat. Hanya diisi
     bila TIDAK confident. BOLEH sama dengan peringkat 1 — chip "Maksud
     kamu: X?" adalah jalan pintas utama, grid di bawahnya sekunder.
   - topExact: peringkat 1 cocok persis dengan satu kata isi (dipakai UI
     untuk membedakan "hasil yang nyambung topiknya" dari "hasil kebetulan
     fuzzy" saat tidak confident — lihat dokumen integrasi di laporan). */
/* skor saran yang KETAT (khusus "Maksud kamu...?"): typo 1 huruf hanya
   dihitung bila katanya >= 5 huruf, typo 2 huruf bila >= 6 huruf; dan
   kecocokan awalan/substring dari ARAH kueri (q memuat t) hanya bila
   tokennya >= 4-5 huruf dan selisihnya <= 2 huruf. Tanpa penjaga ini,
   "cek resi" disarankan "Surat Resmi" ("resi"~"resmi", lev 1 pada 4
   huruf) dan "wallpaper" disarankan "Stiker WA" ("wallpaper" diawali
   "wa") — saran yang tidak nyambung dan memalukan. */
function suggestScore(q, t) {
  if (!q || !t) return 0;
  if (t === q) return 100;
  /* Awalan/substring dari arah kueri memakai penjaga yang sama dengan
     exact (isStrongPrefix): "resi" (4 huruf) tidak boleh menyarankan
     "resistensi" — kalau tidak, "cek resi" tetap dapat chip "Maksud
     kamu: Kalkulator HOMA-IR?" dan grid 24 hasil di bawahnya. */
  if (t.startsWith(q) && isStrongPrefix(q, t)) return 90;
  if (t.length >= 4 && q.length - t.length <= 2 && q.startsWith(t)) return 90;
  if (t.includes(q) && isStrongPrefix(q, t)) return 70;
  if (t.length >= 5 && q.length - t.length <= 2 && q.includes(t)) return 70;
  const d = lev(q, t);
  if (q.length >= 5 && d <= 1) return 55;
  if (q.length >= 6 && d <= 2) return 40;
  return 0;
}
function closestByName(q, manifest) {
  const { terms } = analyzeQuery(q);
  const idx = buildIndex(manifest);
  let best = null;
  for (const entry of idx) {
    const nameWords = entry.name.split(/[^a-z0-9]+/).filter(Boolean);
    let s = 0;
    for (const t of terms) {
      if (isStop(t)) continue;
      for (const w of nameWords) s = Math.max(s, suggestScore(t, w));
    }
    if (s >= 40 && (!best || s > best.score || (s === best.score && entry.m.id.length < best.id.length))) {
      best = { id: entry.m.id, name: entry.m.name, score: Math.round(s) };
    }
  }
  return best;
}
export function assessQuery(q, manifest, opts = {}) {
  const { limit = 24 } = opts;
  const entries = scoreAll(q, manifest, opts);
  const results = entries.slice(0, limit).map((x) => x.m);
  const top = entries[0];
  // Yakin bila: kena boost frasa, ATAU (cocok persis DAN kueri satu kata
  // isi, ATAU cocok persis + cocok kata lain). Kueri 2 kata isi yang
  // hanya cocok 1 kata ("lacak paket" -> berat-volumetrik lewat "paket"
  // saja) TIDAK yakin — separuh niatnya tidak terpenuhi.
  const contentTerms = analyzeQuery(q).terms.filter((t) => !isStop(t)).length;
  const confident = Boolean(top && (top.boosted || (top.exact && (contentTerms <= 1 || top.multi))));
  return {
    results,
    confident,
    suggestion: confident ? null : closestByName(q, manifest),
    topScore: top ? Math.round(top.s) : 0,
    topExact: Boolean(top && top.exact),
  };
}

/* ---------------- "Maksud kamu...?" untuk kueri tanpa hasil ----------------
   Mengembalikan { id, name, score } tool terdekat, atau null bila tidak
   ada yang cukup dekat (skor ketat suggestScore, ambang 40). Mengembalikan
   null juga bila kueri sebenarnya ADA hasilnya — fungsi ini hanya untuk
   state kosong. CATATAN: karena ambang ranker rendah (15), hampir semua
   kueri yang punya saran juga punya hasil — jadi di praktiknya jalur
   saran yang hidup adalah assessQuery().suggestion (state "kurang yakin"),
   sementara fungsi ini adalah API cadangan untuk state benar-benar kosong. */
export function suggestDidYouMean(q, manifest) {
  const { norm, terms } = analyzeQuery(q);
  if (!norm) return null;
  if (rankedSearchPlus(q, manifest, { limit: 1 }).length) return null;
  const idx = buildIndex(manifest);
  let best = null;
  for (const entry of idx) {
    let s = 0;
    for (const t of terms) {
      for (const tok of entry.tokens) {
        if (tok.weight < 0.8) continue; // hanya nama + keyword, bukan deskripsi
        s = Math.max(s, suggestScore(t, tok.w) * tok.weight);
      }
    }
    if (s >= 40 && (!best || s > best.score || (s === best.score && entry.m.id.length < best.id.length))) {
      best = { id: entry.m.id, name: entry.m.name, score: Math.round(s) };
    }
  }
  return best;
}

/* ---------------- riwayat KATA pencarian (baru; app.js hanya punya riwayat tool) ---------------- */
const HIST_KEY = 'adip_search_hist';
/* S-U2 (v6.22.0): batas 10 kata terakhir (dulu 8) — riwayat tampil
   maks 5 chip di UI (components.js), sisanya cadangan putaran. */
const HIST_MAX = 10;
function lsGet() {
  try {
    if (typeof localStorage === 'undefined') return [];
    const v = JSON.parse(localStorage.getItem(HIST_KEY));
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : [];
  } catch { return []; }
}
function lsSet(list) {
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(HIST_KEY, JSON.stringify(list));
  } catch { /* mode privat / storage penuh: diam saja */ }
}
export function getRecentSearches() { return lsGet(); }
export function addRecentSearch(q) {
  const term = String(q || '').trim().toLowerCase().slice(0, 80);
  if (term.length < 2) return;
  const list = lsGet().filter((x) => x !== term);
  list.unshift(term);
  lsSet(list.slice(0, HIST_MAX));
}
/* S-U2 (v6.22.0): hapus SATU kata dari riwayat (tombol × per chip di
   app.js). Normalisasi sama seperti addRecentSearch supaya "QR" dan
   "qr" menghapus entri yang sama. Istilah yang tidak ada = no-op. */
export function removeRecentSearch(q) {
  const term = String(q || '').trim().toLowerCase().slice(0, 80);
  if (!term) return;
  lsSet(lsGet().filter((x) => x !== term));
}
export function clearRecentSearches() { lsSet([]); }
