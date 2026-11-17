import { h as T, utils, kv } from '../../core.js';

export const meta = {"id": "cari-ganti-teks", "name": "Cari & Ganti Teks", "cat": "teks", "icon": "🔁", "desc": "Ganti massal kata atau frasa di teks, mode biasa atau pola regex, dengan hitungan penggantian dan pratinjau hasil.", "keywords": "cari ganti,find replace,teks,regex,ganti kata,massal", "since": "6.13.0"};

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Deteksi kuantifer bersarang — pola seperti (a+)+, (a*)*, (\w+)+ — yang
// membuat mesin regex mencoba kombinasi secara eksponensial (ReDoS RT2-09:
// (a+)+$ pada 'a'×28 + '!' = 29,6 dtk, n=30 ≈ 2 menit). Pemindai linear:
// kelas karakter [...] dan escape \x dilewati supaya tidak salah baca,
// lalu tiap grup (...) yang diikuti kuantifer dicek isi kuantifernya.
// Awalan grup (?:, (?=, (?!, (?<nama> bukan kuantifer — dikecualikan.
function adaKuantiferBersarang(pola) {
  let bersih = '';
  for (let i = 0; i < pola.length; i++) {
    const c = pola[i];
    if (c === '\\') { i++; continue; }
    if (c === '[') {
      i++;
      if (pola[i] === '^') i++;
      if (pola[i] === ']') i++;
      while (i < pola.length && pola[i] !== ']') { if (pola[i] === '\\') i++; i++; }
      continue;
    }
    bersih += c;
  }
  const tumpuk = [];
  for (let i = 0; i < bersih.length; i++) {
    const c = bersih[i];
    if (c === '(') { tumpuk.push(i); continue; }
    if (c !== ')') continue;
    const awal = tumpuk.pop();
    if (awal == null) continue;
    let isi = bersih.slice(awal + 1, i);
    // Buang awalan non-capturing / lookahead / grup bernama.
    if (isi.startsWith('?:') || isi.startsWith('?=') || isi.startsWith('?!')) isi = isi.slice(2);
    else if (isi.startsWith('?<')) { const tutup = isi.indexOf('>'); if (tutup !== -1) isi = isi.slice(tutup + 1); }
    const sesudah = bersih[i + 1];
    if ((sesudah === '+' || sesudah === '*' || sesudah === '{') && /[+*?{]/.test(isi)) return true;
  }
  return false;
}


// ---- Pemindai pola berbahaya (port dari json-formatter.js, P-01/P-03 P2) ----
// adaKuantiferBersarang di atas hanya menangkap kuantifer bersarang
// ((a+)+). Kelas P4-01 lolos darinya: grup berkuantifer berisi alternasi
// yang cabangnya tumpang tindih — (a|b|ab)+$ membekukan tab 6,2 dtk pada
// teks 49 karakter (tiap posisi punya 3 cara cocok, backtracking meledak
// saat akhir teks gagal). Pemindai ini mem-parsing pola menjadi
// grup/cabang/elemen dan menolak grup yang diulang bila:
//  (1) grup berisi atom berkuantifier yang batas ulangnya BISA BERGESER
//      (kecuali dipatok pemisah: E1/E2/E3 — mis. (\w+\.)+ lolos);
//  (2) dua atom opsional berurutan di dalam grup yang diulang ((a?b?)+);
//  (3) alternasi yang cabangnya tumpang tindih ((a|a)+, (a|b|ab)+).
// Penyempurnaan aturan 3: cabang literal A yang merupakan awalan cabang B
// hanya berbahaya bila SISA B bisa memulai cabang lain ((a|ab)+ AMAN —
// rest "b" tak bisa memulai cabang; (a|b|ab)+ BERBAHAYA — rest "b" bisa
// memulai cabang "b"). Salinan ini disinkronkan dengan
// js/tools/developer/json-formatter.js (P2) — bila satu diperbarui,
// perbarui yang lain. Pemindai lama TETAP dipakai (OR): semua penolakan
// lama dipertahankan (termasuk backref yang tertolak insidental).
// P4-09 (ronde 2): (a) cekGrup dihitung di SETIAP penutupan grup dan
// hasilnya diwariskan ke induk sebagai bahayaDalam — grup pembungkus
// ((a|b|ab))+$ kini tertangkap; (b) analisis case-insensitive SELALU
// (csFoldCase di tambahElemen + literal dibandingkan huruf kecil) karena
// eksekusi default memakai flag `i` — (A|a)+$ dkk. kini tertangkap.
// P4-15 (koordinator): lipatan case kini non-ASCII juga — csFoldCase
// melipat tiap code point ke bentuk kanonik V8-nya (kanalV8: toUpperCase
// kecuali multi-karakter atau non-ASCII-yang-atasnya-ASCII), literal
// aturan 3 dibandingkan bentuk kanoniknya (µ/Μ, ς/σ disamakan V8
// tapi tidak oleh toLowerCase saja; ſ/s dan K/k TIDAK dilipat V8).
// Asumsi konservatif ini sengaja dipertahankan walau mode "bedakan huruf"
// aktif: biaya false positive-nya kecil ((A|a)+ punya penulisan [Aa]+),
// risikonya bila satu pemanggil lupa meneruskan flag jauh lebih besar.
// Himpunan karakter sebagai { pos: [[lo,hi]...], neg: bool }.
// neg=true berarti komplemen dari pos (kelas [^...], \D, \W, \S).
// ANY = komplemen dari himpunan kosong.
function csKosong() { return { pos: [], neg: false }; }
function csSemua() { return { pos: [], neg: true }; }
function csChar(cp) { return { pos: [[cp, cp]], neg: false }; }

// Apakah rentang [l,h] tertutup penuh oleh gabungan rentang `kecualikan`?
function rentangTertutup(l, h, kecualikan) {
  let pos = l;
  const urut = kecualikan.slice().sort((a, b) => a[0] - b[0]);
  for (const [a, b] of urut) {
    if (b < pos) continue;
    if (a > pos) return false;
    pos = b + 1;
    if (pos > h) return true;
  }
  return pos > h;
}

// Apakah irisan dua himpunan karakter tidak kosong?
function csIrisan(a, b) {
  if (!a.neg && !b.neg) {
    for (const [l1, h1] of a.pos) for (const [l2, h2] of b.pos)
      if (l1 <= h2 && l2 <= h1) return true;
    return false;
  }
  if (a.neg && b.neg) return true; // dua komplemen hampir selalu beririsan
  const p = a.neg ? b : a, e = a.neg ? a.pos : b.pos;
  for (const [l, h] of p.pos) if (!rentangTertutup(l, h, e)) return true;
  return false;
}

// Apakah himpunan karakter mengandung code point cp?
function csPunya(cs, cp) {
  let diDalam = false;
  for (const [l, h] of cs.pos) if (cp >= l && cp <= h) { diDalam = true; break; }
  return cs.neg ? !diDalam : diDalam;
}

// Apakah ada pasangan himpunan dari dua daftar yang beririsan?
function csDaftarIrisan(daftarA, daftarB) {
  for (const a of daftarA) for (const b of daftarB) if (csIrisan(a, b)) return true;
  return false;
}

// Kanonikalisasi case ala V8 tanpa flag `u` (spesifikasi ECMAScript,
// Canonicalize non-Unicode): huruf besar via toUpperCase, KECUALI bila
// hasilnya multi-karakter (ß→SS) atau non-ASCII yang atasnya ASCII
// (ſ→S) — keduanya TIDAK dilipat V8. Inilah yang membedakan pasangan
// yang benar-benar dilipat (µ/Μ, ς/σ, é/É, α/Α) dari yang tidak
// (ſ/s, K/k) — diuji empiris di Node/V8. Dipakai csFoldCase +
// literal aturan 3 (P4-15). Karakter astral tidak dilipat (panjang
// UTF-16-nya 2) — sama seperti V8 tanpa flag u.
// Lipat huruf besar/kecil di himpunan karakter (P4-09b + P4-15): eksekusi
// cari-ganti memakai flag `i` secara default, jadi pemindai berasumsi
// case-insensitive SELALU — 'A' dan 'a' adalah karakter yang sama bagi
// mesin regex. P4-09b hanya melipat ASCII; P4-15 membuktikan V8 di bawah
// flag i melipat jauh lebih luas (é/É, α/Α, σ/Σ/ς, µ/Μ/μ) — jadi tiap
// code point kini dilipat ke bentuk kanonik V8-nya (kanalV8).
// Hasil lipatan digabung jadi rentang berurutan — csIrisan membandingkan
// berpasangan, jadi ribuan titik tunggal akan menjadi DoS bagi pemindai
// sendiri. Batas kerja 8.192 code point per panggilan: rentang raksasa
// (mis. [\x00-\u{10FFFF}]) tidak boleh membuat pemindai sendiri lambat —
// rentang sebesar itu sudah beririsan dengan hampir semua hal.
// Untuk himpunan negasi (neg=true), pos yang dilipat tetap komplemennya:
// [^a] di bawah flag i juga menolak 'A'. Selalu objek BARU — konstanta
// CS_DIGIT/CS_WORD/CS_SPASI tidak boleh dimutasi.
function kanalV8(ch) {
  const u = ch.toUpperCase();
  if (u.length !== 1) return ch;
  const cp = ch.codePointAt(0), cu = u.codePointAt(0);
  if (cp >= 128 && cu < 128) return ch;
  return u;
}
function kanalStr(s) { return [...s].map(kanalV8).join(''); }
function csFoldCase(cs) {
  const pos = cs.pos.slice();
  const lipat = [];
  let sisa = 8192;
  for (const [l, h] of cs.pos) {
    for (let cp = l; cp <= h && sisa > 0; cp++, sisa--) {
      if (cp >= 0xD800 && cp <= 0xDFFF) continue; // surrogate bukan code point
      const k = kanalV8(String.fromCodePoint(cp));
      if (k.codePointAt(0) !== cp) lipat.push(k.codePointAt(0));
    }
    if (sisa <= 0) break;
  }
  lipat.sort((a, b) => a - b);
  for (let i = 0; i < lipat.length;) {
    let j = i;
    while (j + 1 < lipat.length && lipat[j + 1] <= lipat[j] + 1) j++;
    pos.push([lipat[i], lipat[j]]);
    i = j + 1;
  }
  return { pos, neg: cs.neg };
}

const CS_DIGIT = { pos: [[48, 57]], neg: false };
const CS_WORD = { pos: [[48, 57], [65, 90], [95, 95], [97, 122]], neg: false };
const CS_SPASI = { pos: [[9, 13], [32, 32]], neg: false };

// Parse escape mulai di s[i] === '\\'. Kembalikan
// { cs, ch, akhir, anchor }: cs = himpunan karakter (null bila anchor),
// ch = karakter literal (string, null bila bukan literal tunggal),
// akhir = indeks setelah escape, anchor = true untuk \b \B.
function parseRegexEscape(s, i) {
  const c = s[i + 1];
  if (c === undefined) return { cs: csChar(92), ch: '\\', akhir: i + 1, anchor: false };
  if (c === 'd') return { cs: CS_DIGIT, ch: null, akhir: i + 2, anchor: false };
  if (c === 'D') return { cs: { pos: CS_DIGIT.pos, neg: true }, ch: null, akhir: i + 2, anchor: false };
  if (c === 'w') return { cs: CS_WORD, ch: null, akhir: i + 2, anchor: false };
  if (c === 'W') return { cs: { pos: CS_WORD.pos, neg: true }, ch: null, akhir: i + 2, anchor: false };
  if (c === 's') return { cs: CS_SPASI, ch: null, akhir: i + 2, anchor: false };
  if (c === 'S') return { cs: { pos: CS_SPASI.pos, neg: true }, ch: null, akhir: i + 2, anchor: false };
  if (c === 'b' || c === 'B') return { cs: null, ch: null, akhir: i + 2, anchor: true };
  if (c === 'n') return { cs: csChar(10), ch: '\n', akhir: i + 2, anchor: false };
  if (c === 'r') return { cs: csChar(13), ch: '\r', akhir: i + 2, anchor: false };
  if (c === 't') return { cs: csChar(9), ch: '\t', akhir: i + 2, anchor: false };
  if (c === 'v') return { cs: csChar(11), ch: '\v', akhir: i + 2, anchor: false };
  if (c === 'f') return { cs: csChar(12), ch: '\f', akhir: i + 2, anchor: false };
  if (c === '0') {
    // Oktal \0, \01, \012 (mode non-unicode).
    let j = i + 2, v = 0, n = 0;
    while (n < 2 && s[j] >= '0' && s[j] <= '7') { v = v * 8 + (s.charCodeAt(j) - 48); j++; n++; }
    const ch = String.fromCodePoint(v);
    return { cs: csChar(v), ch, akhir: j, anchor: false };
  }
  if (c === '8' || c === '9') return { cs: csChar(c.charCodeAt(0)), ch: c, akhir: i + 2, anchor: false };
  if (c >= '1' && c <= '7') return { cs: csSemua(), ch: null, akhir: i + 2, anchor: false }; // backreference: tak diketahui
  if (c === 'k') {
    const tutup = s.indexOf('>', i + 3);
    if (s[i + 2] === '<' && tutup > -1) return { cs: csSemua(), ch: null, akhir: tutup + 1, anchor: false };
    return { cs: csChar(107), ch: 'k', akhir: i + 2, anchor: false };
  }
  if (c === 'x') {
    const hex = s.slice(i + 2, i + 4);
    if (/^[0-9A-Fa-f]{2}$/.test(hex)) {
      const v = parseInt(hex, 16);
      return { cs: csChar(v), ch: String.fromCodePoint(v), akhir: i + 4, anchor: false };
    }
    return { cs: csChar(120), ch: 'x', akhir: i + 2, anchor: false };
  }
  if (c === 'u') {
    if (s[i + 2] === '{') {
      const tutup = s.indexOf('}', i + 3);
      const hex = tutup > -1 ? s.slice(i + 3, tutup) : '';
      if (/^[0-9A-Fa-f]+$/.test(hex)) {
        const v = parseInt(hex, 16);
        if (v <= 0x10FFFF) return { cs: csChar(v), ch: String.fromCodePoint(v), akhir: tutup + 1, anchor: false };
      }
      return { cs: csChar(117), ch: 'u', akhir: i + 2, anchor: false };
    }
    const hex = s.slice(i + 2, i + 6);
    if (/^[0-9A-Fa-f]{4}$/.test(hex)) {
      const v = parseInt(hex, 16);
      return { cs: csChar(v), ch: String.fromCodePoint(v), akhir: i + 6, anchor: false };
    }
    return { cs: csChar(117), ch: 'u', akhir: i + 2, anchor: false };
  }
  if (c === 'c') {
    const d = s[i + 2];
    if (d && /[A-Za-z]/.test(d)) {
      const v = d.toUpperCase().charCodeAt(0) % 32;
      return { cs: csChar(v), ch: String.fromCodePoint(v), akhir: i + 3, anchor: false };
    }
    return { cs: csChar(99), ch: 'c', akhir: i + 2, anchor: false };
  }
  // Escape identitas (\p, \., \+, ...): karakternya sendiri.
  const ch = String.fromCodePoint(s.codePointAt(i + 1));
  return { cs: csChar(s.codePointAt(i + 1)), ch, akhir: i + 1 + ch.length, anchor: false };
}

// Parse kelas [...] mulai di s[i] === '['. Kembalikan { cs, akhir }
// (akhir = indeks ']' penutup), atau null bila tidak ada penutup.
function parseRegexKelas(s, i) {
  let j = i + 1;
  let neg = false;
  if (s[j] === '^') { neg = true; j++; }
  if (s[j] === ']') return { cs: neg ? csSemua() : csKosong(), akhir: j };
  const pos = [];
  let adaNeg = false; // kelas berisi \D/\W/\S → perlakukan sebagai ANY
  // Baca satu item kelas: { jenis: 'char', cp, akhir } |
  // { jenis: 'kelas', cs, akhir } | { jenis: 'neg', akhir }.
  const bacaItem = (k) => {
    if (s[k] === '\\') {
      const c = s[k + 1];
      if (c === 'b') return { jenis: 'char', cp: 8, akhir: k + 2 }; // \b di kelas = backspace
      if (c === 'd' || c === 'w' || c === 's') {
        const cs = c === 'd' ? CS_DIGIT : c === 'w' ? CS_WORD : CS_SPASI;
        return { jenis: 'kelas', cs, akhir: k + 2 };
      }
      if (c === 'D' || c === 'W' || c === 'S') return { jenis: 'neg', akhir: k + 2 };
      const e = parseRegexEscape(s, k);
      if (e.anchor) return { jenis: 'char', cp: 66, akhir: e.akhir }; // \B di kelas tidak valid, anggap 'B'
      if (e.ch !== null) return { jenis: 'char', cp: e.ch.codePointAt(0), akhir: e.akhir };
      return { jenis: 'kelas', cs: e.cs, akhir: e.akhir };
    }
    const ch = String.fromCodePoint(s.codePointAt(k));
    return { jenis: 'char', cp: s.codePointAt(k), akhir: k + ch.length };
  };
  while (j < s.length && s[j] !== ']') {
    const a = bacaItem(j);
    if (!a) return null;
    if (a.jenis === 'neg') { adaNeg = true; j = a.akhir; continue; }
    if (a.jenis === 'kelas') { pos.push(...a.cs.pos); j = a.akhir; continue; }
    // Rentang lo-hi: '-' diikuti item lain (bukan ']' penutup).
    if (s[a.akhir] === '-' && s[a.akhir + 1] !== undefined && s[a.akhir + 1] !== ']') {
      const b = bacaItem(a.akhir + 1);
      if (b && b.jenis === 'char') {
        pos.push([Math.min(a.cp, b.cp), Math.max(a.cp, b.cp)]);
        j = b.akhir;
        continue;
      }
      // '-' setelah kelas/neg: '-' adalah literal.
      pos.push([a.cp, a.cp], [45, 45]);
      j = a.akhir + 1;
      continue;
    }
    pos.push([a.cp, a.cp]);
    j = a.akhir;
  }
  if (j >= s.length) return null; // tidak ada ']' penutup
  if (adaNeg) return { cs: csSemua(), akhir: j };
  return { cs: { pos, neg }, akhir: j };
}

// Parse kuantifier mulai di s[i]. Kembalikan null bila bukan kuantifier,
// atau { min, maks, akhir, berulang, opsional, variabel, sepertiTanya }.
// berulang = bisa mencocokkan atom >1 kali (pemicu cek grup);
// variabel = membuat atom jadi panjang-variabel ({n} tetap tidak);
// sepertiTanya = ? atau {0,1} (dihitung sebagai atom opsional).
// Penanda lazy '?' (mis. +?) ikut dikonsumsi, bukan kuantifier baru.
function parseRegexKuantifier(s, i) {
  const c = s[i];
  let q = null;
  if (c === '+') q = { min: 1, maks: Infinity, akhir: i + 1 };
  else if (c === '*') q = { min: 0, maks: Infinity, akhir: i + 1 };
  else if (c === '?') q = { min: 0, maks: 1, akhir: i + 1 };
  else if (c === '{') {
    const m = /^\{(\d*)(?:,(\d*))?\}/.exec(s.slice(i));
    if (!m || (m[2] === undefined && m[1] === '')) return null;
    if (m[2] === undefined) q = { min: +m[1], maks: +m[1], akhir: i + m[0].length };
    else if (m[2] === '') q = { min: m[1] === '' ? 0 : +m[1], maks: Infinity, akhir: i + m[0].length };
    else q = { min: m[1] === '' ? 0 : +m[1], maks: +m[2], akhir: i + m[0].length };
  } else return null;
  if (s[q.akhir] === '?') q.akhir++; // penanda lazy
  q.berulang = q.maks === Infinity || q.maks > 1;
  q.opsional = q.min === 0;
  q.variabel = q.maks === Infinity || q.maks > q.min;
  q.sepertiTanya = q.min === 0 && q.maks === 1;
  return q;
}

function polaRegexBerbahaya(pola) {
  const s = String(pola || '');
  if (s.length > 1000) return true; // pola sepanjang itu tidak wajar
  const BATAS_LITERALS = 64; // ekspansi literal cabang di atas ini = kompleks
  // Satu frame per grup (termasuk frame akar pola):
  //  q: ada atom berkuantifier panjang-variabel di dalam (diwariskan);
  //  qsets: himpunan karakter lanjut atom-atom berkuantifier di dalam;
  //  bahayaDalam: berisi grup dalam yang berbahaya bila diulang (P4-09a,
  //    diwariskan — grup pembungkus ((a|b|ab)) tertangkap lewat sini);
  //  cabang: cabang alternasi yang sudah selesai { lits, first, elemen };
  //  lits/first/elemen: cabang berjalan (lits=null bila bukan literal murni);
  //  optRun/maksOptRun: rangkaian atom opsional berurutan terpanjang.
  const buatFrame = (lihat) => ({
    lihat: !!lihat, q: false, qsets: [], bahayaDalam: false, cabang: [],
    lits: new Set(['']), first: [], firstOpen: true,
    elemen: [], pending: null, optRun: 0, maksOptRun: 0, adaWajib: false,
  });
  const tumpuk = [buatFrame(false)];
  const atas = () => tumpuk[tumpuk.length - 1];

  // Finalisasi elemen terakhir cabang berjalan: tanpa kuantifier, elemen
  // dianggap wajib. Elemen wajib memutus rangkaian opsional dan menutup
  // pengumpulan karakter awal; elemen opsional memperpanjang rangkaian.
  const finalisasiPending = (f) => {
    const p = f.pending;
    if (!p) return;
    f.pending = null;
    // Wajib = kuantifier mewajibkan, atau tanpa kuantifier dan elemen
    // tidak bisa kosong (grup yang bisa kosong tetap opsional walau
    // diikuti kuantifier wajib seperti + — (a?)+ bisa cocok kosong).
    const wajib = p.wajib === true || (p.wajib === null && !p.kosong);
    p.wajib = wajib; // tulis balik: cek grup membaca wajib boolean
    if (wajib) { f.adaWajib = true; f.firstOpen = false; f.optRun = 0; }
    else {
      const tambah = Math.max(p.runDalam || 0, p.tanya ? 1 : 0);
      if (tambah) {
        f.optRun += tambah;
        if (f.optRun > f.maksOptRun) f.maksOptRun = f.optRun;
      }
    }
  };

  // Tambah satu elemen ke cabang berjalan frame f. css = daftar himpunan
  // karakter awal elemen (untuk grup: awalan keseluruhan grup).
  // P4-09b: semua himpunan dilipat case-nya (csFoldCase) — analisis
  // berjalan dengan asumsi case-insensitive seperti eksekusi flag `i`.
  const tambahElemen = (f, css, opt) => {
    finalisasiPending(f);
    css = css.map(csFoldCase);
    if (f.firstOpen) f.first.push(...css);
    if (opt.ch != null) {
      if (f.lits) {
        if (f.lits.size > BATAS_LITERALS) f.lits = null;
        else f.lits = new Set([...f.lits].map((x) => x + opt.ch));
      }
    } else f.lits = null;
    const el = {
      css, ch: opt.ch != null ? opt.ch : null,
      wajib: null, kosong: opt.grup ? !!opt.grupKosong : false,
      q: opt.grup ? !!opt.grup.q : false,
      lanjut: opt.grup && opt.grup.q ? css : null,
      tanya: false, runDalam: opt.grup ? opt.grup.maksOptRun : 0,
    };
    f.elemen.push(el);
    f.pending = el;
  };

  // Terapkan kuantifier pada elemen terakhir cabang berjalan.
  const terapkanKuantifier = (f, q) => {
    const p = f.pending;
    if (!p) return;
    p.wajib = (q.opsional || p.kosong) ? false : true;
    p.tanya = !!q.sepertiTanya;
    if (q.sepertiTanya) {
      // '?' tidak membuat grup berbahaya sendiri — bahaya datang dari
      // rangkaian opsional (aturan 2, dihitung saat finalisasi).
    } else if (q.variabel) {
      f.q = true;
      p.q = true;
      p.lanjut = p.css;
      f.qsets.push(...p.css);
    }
    // Jaga ekspansi literal cabang: hanya kuantifier tetap yang
    // mempertahankan literal (mis. b{2} -> "bb", b? -> "b"/"").
    if (f.lits && p.ch != null) {
      if (q.sepertiTanya) {
        const tambah = new Set(f.lits);
        for (const x of f.lits) tambah.add(x.slice(0, x.length - p.ch.length));
        f.lits = tambah.size > BATAS_LITERALS ? null : tambah;
      } else if (!q.variabel && q.min === q.maks) {
        if (q.min === 0) f.lits = new Set([...f.lits].map((x) => x.slice(0, x.length - p.ch.length)));
        else if (q.min <= 8) f.lits = new Set([...f.lits].map((x) => x + p.ch.repeat(q.min - 1)));
        else f.lits = null;
      } else f.lits = null;
    }
  };

  // Tutup cabang berjalan dan mulai cabang baru (di '|' atau ')').
  const selesaiCabang = (f) => {
    finalisasiPending(f);
    f.cabang.push({ lits: f.lits, first: f.first, elemen: f.elemen });
    f.lits = new Set(['']); f.first = []; f.firstOpen = true;
    f.elemen = []; f.pending = null; f.optRun = 0; f.adaWajib = false;
  };

  // Apakah grup f berbahaya bila diulang? Dipanggil saat grup tutup dan
  // diikuti kuantifier berulang. f.cabang sudah difinalisasi.
  const cekGrup = (f) => {
    const cabang = f.cabang;
    const firstSemua = [];
    for (const c of cabang) firstSemua.push(...c.first);
    // Aturan 1: atom berkuantifier di dalam grup yang diulang.
    if (f.q) {
      const e1 = !csDaftarIrisan(firstSemua, f.qsets);
      let e2 = true, e3 = true;
      for (const c of cabang) {
        const el = c.elemen;
        const qsetsCabang = [];
        let idxTerakhirQ = -1;
        for (let k = 0; k < el.length; k++) if (el[k].q) { idxTerakhirQ = k; qsetsCabang.push(...(el[k].lanjut || [])); }
        if (idxTerakhirQ < 0) continue;
        let adaPenambat = false;
        for (let k = idxTerakhirQ + 1; k < el.length; k++) {
          if (el[k].wajib === true && !el[k].q && !csDaftarIrisan(el[k].css, qsetsCabang)) { adaPenambat = true; break; }
        }
        if (!adaPenambat) e2 = false;
        for (let k = 0; k < el.length; k++) {
          if (!el[k].q) continue;
          let berikut = null;
          for (let m = k + 1; m < el.length; m++) if (el[m].wajib === true) { berikut = el[m].css; break; }
          if (csDaftarIrisan(el[k].lanjut || [], berikut || firstSemua)) { e3 = false; break; }
        }
        if (!e2 && !e3) break;
      }
      if (!e1 && !e2 && !e3) return true;
    }
    // Aturan 2: dua atom opsional berurutan ((a?b?)+ = 232 ms pada n=30).
    if (f.maksOptRun >= 2) return true;
    // Aturan 3: alternasi yang cabangnya tumpang tindih.
    if (cabang.length > 1) {
      if (cabang.every((c) => c.lits !== null)) {
        for (let a = 0; a < cabang.length; a++) for (let b = a + 1; b < cabang.length; b++) {
          for (const s1 of cabang[a].lits) for (const s2 of cabang[b].lits) {
            if (!s1 || !s2) continue; // cabang kosong tidak menciptakan ambiguitas
            // P4-09b + P4-15: bandingkan bentuk kanonik V8 — di bawah flag
            // i, 'A' == 'a'. Kanonikalisasi WAJIB mengikuti V8 (kanalV8),
            // bukan toLowerCase/toUpperCase mentah: toLowerCase tidak
            // menyamakan µ/Μ dan ς/σ (P4-15), sementara toUpperCase
            // menyamakan ſ/s yang TIDAK dilipat V8 (false positive).
            const a1 = kanalStr(s1), b1 = kanalStr(s2);
            if (a1 === b1) return true;
            if (b1.startsWith(a1)) {
              const rest = b1.slice(a1.length);
              if (firstSemua.some((cs) => csPunya(cs, rest.codePointAt(0)))) return true;
            }
            if (a1.startsWith(b1)) {
              const rest = a1.slice(b1.length);
              if (firstSemua.some((cs) => csPunya(cs, rest.codePointAt(0)))) return true;
            }
          }
        }
      } else {
        for (let a = 0; a < cabang.length; a++) for (let b = a + 1; b < cabang.length; b++) {
          if (csDaftarIrisan(cabang[a].first, cabang[b].first)) return true;
        }
      }
    }
    return false;
  };

  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    const f = atas();
    if (c === '\\') {
      const e = parseRegexEscape(s, i);
      i = e.akhir - 1;
      if (e.anchor) continue;
      tambahElemen(f, [e.cs], { ch: e.ch });
      continue;
    }
    if (c === '[') {
      const k = parseRegexKelas(s, i);
      if (k) { tambahElemen(f, [k.cs], { ch: null }); i = k.akhir; continue; }
      tambahElemen(f, [csChar(91)], { ch: '[' });
      continue;
    }
    if (c === '(') {
      let lihat = false;
      if (s[i + 1] === '?') {
        const m2 = s[i + 2];
        if (m2 === ':') i += 2;
        else if (m2 === '=' || m2 === '!') { lihat = true; i += 2; }
        else if (m2 === '<') {
          const m3 = s[i + 3];
          if (m3 === '=' || m3 === '!') { lihat = true; i += 3; }
          else { const tutup = s.indexOf('>', i + 3); if (tutup > -1) i = tutup; }
        }
      }
      tumpuk.push(buatFrame(lihat));
      continue;
    }
    if (c === '|') { selesaiCabang(f); continue; }
    if (c === ')') {
      if (tumpuk.length <= 1) { tambahElemen(f, [csChar(41)], { ch: ')' }); continue; }
      const g = tumpuk.pop();
      selesaiCabang(g);
      const q = parseRegexKuantifier(s, i + 1);
      // P4-09a: grup ini berbahaya bila diulang — dari isinya sendiri
      // (cekGrup) ATAU dari grup dalam yang diwariskan. Grup pembungkus
      // ((a|b|ab)) lolos dulu karena cekGrup hanya jalan saat grup diikuti
      // kuantifier — inner tanpa kuantifier tak pernah dicek. Sekarang
      // cekGrup dihitung di SETIAP penutupan grup dan hasilnya diwariskan.
      const bahayaG = cekGrup(g) || g.bahayaDalam;
      if (q && q.berulang && bahayaG) return true;
      const induk = atas();
      // Wariskan ke induk — KECUALI dari lookaround: lookaround nol-lebar
      // tidak mengonsumsi karakter, alternasi di dalamnya tidak ikut
      // berulang (grup berkuantifier DI DALAM lookaround sudah dicek
      // sendiri saat grup itu tutup).
      if (!g.lihat && bahayaG) induk.bahayaDalam = true;
      if (!g.lihat) {
        const firstG = [];
        for (const cb of g.cabang) firstG.push(...cb.first);
        const kosongG = g.cabang.some((cb) => !cb.elemen.some((e) => e.wajib === true));
        // WARISAN (P-01): flag kuantifier, himpunan lanjut, dan rangkaian
        // opsional grup diwariskan ke induk — ((a+))+ tertangkap di sini.
        induk.q = induk.q || g.q;
        induk.qsets.push(...g.qsets);
        if (g.maksOptRun > induk.maksOptRun) induk.maksOptRun = g.maksOptRun;
        tambahElemen(induk, firstG, { ch: null, grup: g, grupKosong: kosongG });
        if (q) { terapkanKuantifier(induk, q); i = q.akhir - 1; }
      } else if (q) {
        // Lookaround nol-lebar: tidak diwariskan (tidak mengonsumsi
        // karakter). Kuantifier sesudahnya tidak valid di JS — lewati
        // saja agar tidak salah tempel ke elemen sebelumnya.
        i = q.akhir - 1;
      }
      continue;
    }
    if (c === '^' || c === '$') continue;
    if (c === '.') { tambahElemen(f, [csSemua()], { ch: null }); continue; }
    if (c === '+' || c === '*' || c === '?' || c === '{') {
      const q = parseRegexKuantifier(s, i);
      if (q) { terapkanKuantifier(f, q); i = q.akhir - 1; continue; }
      if (c === '{') { tambahElemen(f, [csChar(123)], { ch: '{' }); continue; }
      continue;
    }
    const ch = String.fromCodePoint(s.codePointAt(i));
    tambahElemen(f, [csChar(s.codePointAt(i))], { ch });
    if (ch.length > 1) i += ch.length - 1;
  }
  return false;
}

// Batas mode regex (RT2-09): pola & teks dibatasi supaya pencocokan
// sinkron tidak bisa mengunci tab berlama-lama. Mode literal tidak
// dibatasi pola (escapeRegex membuatnya aman) — hanya teksnya.
const MAKS_TEKS_REGEX = 200000;
const MAKS_POLA_REGEX = 500;
// P4-13: pratinjau hasil dipotong di 200 ribu karakter — render <pre>
// hasil ekspansi literal 10 MB membekukan tab 6,5 dtk. Salin/pakai-hasil
// tetap memakai hasil UTUH (hasilTerakhir), hanya tampilannya dipotong.
const MAKS_TAMPIL_HASIL = 200000;

// Mengembalikan { hasil, jumlah } atau { error: 'pesan ramah' }.
function cariGanti(teks, cari, ganti, opts) {
  opts = opts || {};
  if (!cari) return { error: 'Tulis dulu kata atau pola yang mau dicari.' };
  if (opts.regex) {
    if (cari.length > MAKS_POLA_REGEX) return { error: 'Polanya terlalu panjang (maksimal 500 karakter) — coba pola yang lebih pendek.' };
    if (String(teks).length > MAKS_TEKS_REGEX) return { error: 'Teksnya terlalu panjang untuk mode regex (maksimal 200.000 karakter) — potong dulu teksnya, atau pakai mode teks biasa.' };
    if (adaKuantiferBersarang(cari)) return { error: 'Polanya bisa membuat browser macet (kuantifer di dalam kuantifer, mis. (a+)+). Coba pola yang lebih sederhana, mis. a+ saja.' };
    if (polaRegexBerbahaya(cari)) return { error: 'Polanya bisa membuat browser macet (pilihan di dalam pola yang tumpang tindih, mis. (a|b|ab)+ — tiap huruf bisa cocok dengan beberapa cara sekaligus). Coba pisahkan pilihannya atau pakai pola yang lebih sederhana.' };
  }
  let pola;
  try {
    const sumber = opts.regex ? cari : escapeRegex(cari);
    pola = new RegExp(sumber, 'g' + (opts.caseSensitive ? '' : 'i'));
  } catch (e) {
    return { error: 'Polanya belum benar — cek lagi tanda kurung dan karakter khususnya. Contoh pola yang benar: \\d+ untuk angka, \\b\\w+\\b untuk kata.' };
  }
  const cocok = String(teks).match(pola);
  const jumlah = cocok ? cocok.length : 0;
  let hasil;
  try {
    hasil = String(teks).replace(pola, opts.regex ? ganti : ganti.replace(/\$/g, '$$$$'));
  } catch (e) {
    return { error: 'Teks penggantinya belum bisa dipakai — cek lagi bila memakai $1, $2, dan kawan-kawan.' };
  }
  return { hasil, jumlah };
}

utils.cariGantiTeks = cariGanti;

export function render(root) {
  const taIn = T.ta(8, 'Tempel teksmu di sini…', '');
  const cariI = T.input('text', 'Kata atau frasa yang dicari', '');
  const gantiI = T.input('text', 'Ganti dengan (boleh dikosongkan untuk menghapus)', '');
  const modeI = T.select([
    ['literal', 'Teks biasa (cocok persis)'],
    ['regex', 'Pola regex (untuk yang sudah paham regex)'],
  ], 'literal');
  const caseI = T.input('checkbox', '');
  const box = T.out();
  const statBox = T.out();
  let hasilTerakhir = '';

  const proses = () => {
    const r = cariGanti(taIn.value, cariI.value, gantiI.value, {
      regex: modeI.value === 'regex',
      caseSensitive: caseI.checked,
    });
    if (r.error) {
      T.show(statBox, '<span class="err">' + T.esc(r.error) + '</span>');
      T.show(box, '');
      hasilTerakhir = '';
      return;
    }
    hasilTerakhir = r.hasil;
    T.show(statBox,
      kv('Ditemukan & diganti', T.fmt(r.jumlah) + ' kali') +
      kv('Panjang teks awal', T.fmt(taIn.value.length) + ' karakter') +
      kv('Panjang teks hasil', T.fmt(r.hasil.length) + ' karakter'));
    const tampilHasil = r.hasil.length > MAKS_TAMPIL_HASIL
      ? r.hasil.slice(0, MAKS_TAMPIL_HASIL) + '\n… (pratinjau dipotong: ' + T.fmt(r.hasil.length - MAKS_TAMPIL_HASIL) + ' karakter lainnya tidak ditampilkan — salin hasil untuk versi lengkap)'
      : r.hasil;
    T.show(box, '<pre class="pre">' + T.esc(tampilHasil) + '</pre>');
  };

  const salin = () => {
    if (!hasilTerakhir && !taIn.value) { T.toast('Belum ada hasil yang bisa disalin.'); return; }
    T.copy(hasilTerakhir);
  };

  const pakaiHasil = () => {
    if (!hasilTerakhir && !taIn.value) { T.toast('Belum ada hasil yang bisa dipakai.'); return; }
    taIn.value = hasilTerakhir;
    proses();
    T.toast('Hasilnya sudah jadi teks awal — bisa dicari-ganti lagi.');
  };

  const chkWrap = T.el('<label class="chk" style="display:flex;gap:8px;align-items:center"></label>');
  chkWrap.appendChild(caseI);
  chkWrap.appendChild(document.createTextNode(' Bedakan huruf besar dan kecil'));

  root.appendChild(T.el('<p class="note">Ganti kata atau frasa di seluruh teks sekaligus. Tulis yang dicari, tulis penggantinya, dan lihat pratinjau hasilnya sebelum disalin.</p>'));
  root.appendChild(T.field('Teks awal', taIn));
  root.appendChild(T.grid2(
    T.field('Cari', cariI),
    T.field('Ganti dengan', gantiI)
  ));
  root.appendChild(T.field('Mode pencarian', modeI, 'Mode regex: pakai pola seperti \\d+ (angka) atau [A-Z]+ (huruf besar). Di teks pengganti, $1 artinya hasil tangkapan pertama.'));
  root.appendChild(T.field('Opsi', chkWrap));
  root.appendChild(T.row(
    T.btn('Cari & Ganti', proses, true),
    T.btn('Salin hasil', salin),
    T.btn('Pakai hasil', pakaiHasil)
  ));
  root.appendChild(statBox);
  root.appendChild(box);
}
