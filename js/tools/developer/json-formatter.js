import { h as T, utils, errBox, esc, preHtml } from '../../core.js';

// Perbaiki JSON rusak dengan toleransi: komentar, koma berlebih,
// kutip tunggal, dan kunci tanpa kutip. Scanner karakter, bukan regex
// buta, supaya isi string tidak ikut diubah.
function repairJson(raw) {
  let out = '', i = 0, n = raw.length;
  let inStr = null, inLineComment = false, inBlockComment = false;
  while (i < n) {
    const ch = raw[i], next = raw[i + 1];
    if (inLineComment) {
      if (ch === '\n') { inLineComment = false; out += ch; }
      i++;
      continue;
    }
    if (inBlockComment) {
      if (ch === '*' && next === '/') { inBlockComment = false; i += 2; }
      else i++;
      continue;
    }
    if (inStr) {
      if (ch === '\\' && i + 1 < n) { out += ch + raw[i + 1]; i += 2; continue; }
      if (ch === inStr) {
        // Kutip tunggal diubah jadi kutip ganda saat menutup string.
        out += inStr === "'" ? '"' : ch;
        inStr = null; i++;
        continue;
      }
      // Kutip ganda di dalam string kutip tunggal perlu di-escape.
      if (inStr === "'" && ch === '"') { out += '\\"'; i++; continue; }
      out += ch; i++;
      continue;
    }
    if (ch === '/' && next === '/') { inLineComment = true; i += 2; continue; }
    if (ch === '/' && next === '*') { inBlockComment = true; i += 2; continue; }
    if (ch === '"' || ch === "'") {
      inStr = ch;
      out += '"';
      i++;
      continue;
    }
    // Kunci tanpa kutip: { nama: ... } -> { "nama": ... }
    if (/[A-Za-z_$]/.test(ch)) {
      let j = i;
      while (j < n && /[A-Za-z0-9_$]/.test(raw[j])) j++;
      let k = j;
      while (k < n && /\s/.test(raw[k])) k++;
      const word = raw.slice(i, j);
      if (raw[k] === ':' && !['true', 'false', 'null'].includes(word)) {
        out += '"' + word + '"';
        i = j;
        continue;
      }
      out += word;
      i = j;
      continue;
    }
    // Koma berlebih sebelum } atau ]: dibuang.
    if (ch === ',') {
      let k = i + 1;
      while (k < n && /\s/.test(raw[k])) k++;
      if (raw[k] === '}' || raw[k] === ']') { i++; continue; }
      out += ch; i++;
      continue;
    }
    out += ch; i++;
  }
  return out;
}

// ---- Pengaman regex schema (T1) & kedalaman JSON (S6) ----
// Pola regex buatan pengguna bisa memicu backtracking katastrofik
// (mis. ^(a+)+$ vs 'a'*30+'b' = 103 detik). JS tidak punya timeout regex,
// jadi pola berbahaya ditolak SEBELUM dieksekusi. Pemindai ini mem-parsing
// pola menjadi grup/cabang/elemen dan menolak grup yang diulang bila:
//  (1) grup berisi atom berkuantifier yang batas ulangnya BISA BERGESER —
//      kecuali batasnya dipatok pemisah (E1: awalan grup lepas dari atom
//      berkuantifier, mis. ( [A-Z][a-z]+)*; E2: elemen tetap wajib sesudah
//      atom berkuantifier terakhir, mis. (\w+\.)+; E3: tiap atom
//      berkuantifier diakhiri elemen berikut yang lepas, mis. (a+b+c+)+);
//  (2) dua atom opsional berurutan di dalam grup yang diulang ((a?b?)+);
//  (3) alternasi yang cabangnya tumpang tindih ((a|a)+, (a|ab|b)+).
// Kuantifier luar BERBATAS ikut ditolak ((a+){2,5}, (a+){3} — yang
// terakhir O(n^2): 3,8 detik pada n=1000, ~6 menit pada batas 10 ribu
// karakter). Flag grup DIWARISKAN ke induk saat grup tutup, jadi
// ((a+))+ dan (?:(a+))+ ikut tertangkap (P-01). Pola sah yang lolos:
// ^(foo|bar|baz)+$, ^[A-Z][a-z]+( [A-Z][a-z]+)*$, ^(\w+\.)+\w+$ (P-03).
// Pemindai ini sadar escape (\) dan kelas karakter ([...]).
// P4-09 (ronde 2, disinkronkan dengan cari-ganti-teks.js): (a) cekGrup
// dihitung di SETIAP penutupan grup dan diwariskan sebagai bahayaDalam —
// grup pembungkus ((a|b|ab))+$ kini tertangkap; (b) analisis
// case-insensitive SELALU (csFoldCase + literal huruf kecil) karena
// eksekusi default memakai flag `i` — (A|a)+$ dkk. kini tertangkap.
// P4-15 (koordinator): lipatan case kini non-ASCII juga — csFoldCase
// melipat tiap code point ke bentuk kanonik V8-nya (kanalV8: toUpperCase
// kecuali multi-karakter atau non-ASCII-yang-atasnya-ASCII), literal
// aturan 3 dibandingkan bentuk kanoniknya (µ/Μ, ς/σ disamakan V8
// tapi tidak oleh toLowerCase saja; ſ/s dan K/k TIDAK dilipat V8).
// Salinan ini disinkronkan dengan js/tools/teks/cari-ganti-teks.js —
// bila satu diperbarui, perbarui yang lain.

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

// Nilai string yang terlalu panjang tidak diuji pola (hindari regex lambat
// pada teks raksasa; pola lazim hanya dipakai untuk nilai pendek).
const MAKS_PANJANG_UJI_POLA = 10000;

// Kedalaman JSON secara iteratif (tumpuk eksplisit — tidak pernah stack
// overflow). Mengembalikan kedalaman maks, atau 999 bila melewati batas.
function kedalamanJson(v, batas) {
  const lim = batas || 200;
  let maks = 0;
  const tumpuk = [[v, 0]];
  while (tumpuk.length) {
    const [x, d] = tumpuk.pop();
    if (d > maks) maks = d;
    if (maks > lim) return 999;
    if (x !== null && typeof x === 'object') {
      const anak = Array.isArray(x) ? x : Object.values(x);
      for (let i = anak.length - 1; i >= 0; i--) tumpuk.push([anak[i], d + 1]);
    }
  }
  return maks;
}

function sortKeysDeep(v) {
  if (Array.isArray(v)) return v.map(sortKeysDeep);
  if (v !== null && typeof v === 'object') {
    const o = {};
    for (const k of Object.keys(v).sort()) o[k] = sortKeysDeep(v[k]);
    return o;
  }
  return v;
}

// JSONPath sederhana: $.a.b[0], $.a[*], $.a[*].b
function jsonPathEval(root, expr) {
  const e = String(expr || '').trim();
  if (!e.startsWith('$')) throw new Error('Jalur harus diawali $. Contoh: $.pengguna.nama');
  const rest = e.slice(1);
  const tokens = [];
  const re = /(?:\.([A-Za-z_$][A-Za-z0-9_$]*))|(?:\[(\d+|\*)\])|(?:\['([^']+)'\])/g;
  let m, consumed = 0;
  while ((m = re.exec(rest)) !== null) {
    if (m.index !== consumed) throw new Error('Bagian jalur tidak dikenali di: "' + rest.slice(consumed) + '". Yang didukung: .kunci, [angka], [*], [\'kunci\'].');
    consumed = re.lastIndex;
    tokens.push(m[1] !== undefined ? { k: m[1] } : m[2] !== undefined ? { i: m[2] } : { k: m[3] });
  }
  if (consumed !== rest.length) throw new Error('Bagian jalur tidak dikenali di: "' + rest.slice(consumed) + '".');
  let current = [root];
  for (const t of tokens) {
    const next = [];
    for (const v of current) {
      if (t.k !== undefined) {
        if (v !== null && typeof v === 'object' && t.k in v) next.push(v[t.k]);
      } else if (t.i === '*') {
        if (Array.isArray(v)) next.push(...v);
        else if (v !== null && typeof v === 'object') next.push(...Object.values(v));
      } else {
        const idx = +t.i;
        if (Array.isArray(v) && idx < v.length) next.push(v[idx]);
      }
    }
    current = next;
  }
  return current;
}

function typeOf(v) {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';
  if (Number.isInteger(v)) return 'integer';
  return typeof v;
}

// Resolusi $ref internal: '#/definitions/...', '#/$defs/...',
// '#/properties/...' (pointer JSON, ~0 = ~, ~1 = /). Ref luar tidak didukung.
function resolveRef(ref, root) {
  if (typeof ref !== 'string') return { error: 'ref bukan teks' };
  if (!ref.startsWith('#/')) return { error: 'ref luar tidak didukung, hanya ref dalam schema yang sama (#/...)' };
  const parts = ref.slice(2).split('/').map((p) => p.replace(/~1/g, '/').replace(/~0/g, '~'));
  let cur = root;
  for (const p of parts) {
    if (cur === null || typeof cur !== 'object' || !(p in cur)) return { error: 'ref tidak ditemukan: ' + ref };
    cur = cur[p];
  }
  return { schema: cur };
}

// Validasi JSON Schema: type, required, properties, items,
// minimum/maximum, minLength/maxLength, pattern, enum, additionalProperties,
// minItems/maxItems, minProperties/maxProperties, uniqueItems, format,
// $ref (internal), allOf/anyOf/oneOf, schema boolean.
// root = schema teratas (untuk $ref); depth membatasi ref melingkar.
function validateSchema(value, schema, path, errors, root, depth) {
  const p = path || '$';
  const akar = root || schema;
  const d = depth || 0;
  if (d > 50) { errors.push(p + ': schema terlalu dalam (kemungkinan ref melingkar)'); return; }
  if (schema === true) return;
  if (schema === false) { errors.push(p + ': nilai tidak diizinkan schema'); return; }
  if (schema === null || typeof schema !== 'object' || Array.isArray(schema)) return;
  if (typeof schema.$ref === 'string') {
    const r = resolveRef(schema.$ref, akar);
    if (r.error) { errors.push(p + ': ' + r.error); return; }
    validateSchema(value, r.schema, p, errors, akar, d + 1);
  }
  if (schema.type) {
    const want = schema.type;
    const got = typeOf(value);
    const ok = want === 'number' ? (got === 'number' || got === 'integer') : want === got;
    if (!ok) { errors.push(p + ': harus bertipe ' + want + ', dapat ' + got); return; }
  }
  if (schema.enum && !schema.enum.some((e) => JSON.stringify(e) === JSON.stringify(value))) {
    errors.push(p + ': nilai tidak ada di daftar enum');
  }
  if (typeof value === 'number') {
    if (schema.minimum !== undefined && value < schema.minimum) errors.push(p + ': kurang dari minimum ' + schema.minimum);
    if (schema.maximum !== undefined && value > schema.maximum) errors.push(p + ': lebih dari maximum ' + schema.maximum);
  }
  if (typeof value === 'string') {
    if (schema.minLength !== undefined && value.length < schema.minLength) errors.push(p + ': lebih pendek dari minLength ' + schema.minLength);
    if (schema.maxLength !== undefined && value.length > schema.maxLength) errors.push(p + ': lebih panjang dari maxLength ' + schema.maxLength);
    if (schema.pattern) {
      if (polaRegexBerbahaya(schema.pattern)) {
        errors.push(p + ': pola regex di schema ditolak karena berisiko membekukan browser (kuantifier bersarang / alternasi berulang)');
      } else if (value.length > MAKS_PANJANG_UJI_POLA) {
        errors.push(p + ': nilai terlalu panjang untuk dicek pola (' + value.length + ' karakter, maksimal ' + MAKS_PANJANG_UJI_POLA + ')');
      } else {
        try { if (!new RegExp(schema.pattern).test(value)) errors.push(p + ': tidak cocok dengan pola ' + schema.pattern); }
        catch (e) { errors.push(p + ': pola regex di schema tidak valid'); }
      }
    }
    if (schema.format) {
      const fmt = schema.format;
      const ok = fmt === 'email' ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
        : fmt === 'uri' ? /^[a-zA-Z][a-zA-Z0-9+.-]*:\S+$/.test(value)
        : fmt === 'date-time' ? /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/.test(value)
        : fmt === 'date' ? /^\d{4}-\d{2}-\d{2}$/.test(value)
        : null;
      if (ok === false) errors.push(p + ': bukan format ' + fmt + ' yang benar');
    }
  }
  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) errors.push(p + ': item kurang dari minItems ' + schema.minItems);
    if (schema.maxItems !== undefined && value.length > schema.maxItems) errors.push(p + ': item lebih dari maxItems ' + schema.maxItems);
    if (schema.uniqueItems) {
      const sudah = new Set();
      for (const item of value) {
        const k = JSON.stringify(item);
        if (sudah.has(k)) { errors.push(p + ': ada item yang sama (uniqueItems)'); break; }
        sudah.add(k);
      }
    }
    if (schema.items) value.forEach((item, i) => validateSchema(item, schema.items, p + '[' + i + ']', errors, akar, d + 1));
  }
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    if (Array.isArray(schema.required)) {
      for (const k of schema.required) if (!(k in value)) errors.push(p + ': kunci wajib "' + k + '" tidak ada');
    }
    if (schema.minProperties !== undefined && Object.keys(value).length < schema.minProperties) errors.push(p + ': kunci kurang dari minProperties ' + schema.minProperties);
    if (schema.maxProperties !== undefined && Object.keys(value).length > schema.maxProperties) errors.push(p + ': kunci lebih dari maxProperties ' + schema.maxProperties);
    if (schema.properties) {
      for (const k of Object.keys(schema.properties)) {
        if (k in value) validateSchema(value[k], schema.properties[k], p + '.' + k, errors, akar, d + 1);
      }
    }
    if (schema.additionalProperties === false && schema.properties) {
      for (const k of Object.keys(value)) {
        if (!(k in schema.properties)) errors.push(p + ': kunci "' + k + '" tidak ada di schema');
      }
    }
  }
  if (Array.isArray(schema.allOf)) {
    schema.allOf.forEach((sub, i) => {
      const subErr = [];
      validateSchema(value, sub, p, subErr, akar, d + 1);
      subErr.forEach((e) => errors.push(e + ' (allOf[' + i + '])'));
    });
  }
  if (Array.isArray(schema.anyOf)) {
    const lolos = schema.anyOf.some((sub) => {
      const subErr = [];
      validateSchema(value, sub, p, subErr, akar, d + 1);
      return subErr.length === 0;
    });
    if (!lolos) errors.push(p + ': tidak cocok dengan satu pun pilihan anyOf');
  }
  if (Array.isArray(schema.oneOf)) {
    let cocok = 0;
    schema.oneOf.forEach((sub) => {
      const subErr = [];
      validateSchema(value, sub, p, subErr, akar, d + 1);
      if (subErr.length === 0) cocok++;
    });
    if (cocok !== 1) errors.push(p + ': harus cocok dengan tepat satu pilihan oneOf (cocok ' + cocok + ')');
  }
}

// Statistik dokumen: jumlah kunci, kedalaman maks, jumlah array/objek, ukuran byte.
// Iteratif (tumpuk eksplisit) — JSON sedalam apa pun tidak pernah stack overflow.
function hitungStatistik(obj, raw) {
  let kunci = 0, objek = 0, array = 0, dalamMaks = 0;
  const tumpuk = [[obj, 0]];
  while (tumpuk.length) {
    const [v, d] = tumpuk.pop();
    if (d > dalamMaks) dalamMaks = d;
    if (Array.isArray(v)) {
      array++;
      for (let i = v.length - 1; i >= 0; i--) tumpuk.push([v[i], d + 1]);
    } else if (v !== null && typeof v === 'object') {
      objek++;
      const ks = Object.keys(v);
      kunci += ks.length;
      for (let i = ks.length - 1; i >= 0; i--) tumpuk.push([v[ks[i]], d + 1]);
    }
  }
  let byte = 0;
  try { byte = new TextEncoder().encode(raw || '').length; } catch (e) { byte = String(raw || '').length; }
  return { kunci, objek, array, dalamMaks, byte };
}

// Logika murni (bisa di-test di Node).
utils.jsonValidasiSchema = (value, schema) => {
  const errors = [];
  validateSchema(value, schema, '$', errors);
  return errors;
};
utils.jsonStatistik = (obj, raw) => hitungStatistik(obj, raw);

function sorot(teks, query) {
  if (!query) return esc(teks);
  const rendah = String(teks).toLowerCase();
  const q = query.toLowerCase();
  const idx = rendah.indexOf(q);
  if (idx < 0) return esc(teks);
  return esc(String(teks).slice(0, idx)) +
    '<span style="background:#ff6f61;color:#161311;border-radius:2px;padding:0 2px">' + esc(String(teks).slice(idx, idx + q.length)) + '</span>' +
    esc(String(teks).slice(idx + q.length));
}

function adaCocokTurunan(value, q) {
  if (!q) return false;
  if (value === null || typeof value !== 'object') return JSON.stringify(value).toLowerCase().includes(q);
  return Object.entries(value).some(([k, v]) => k.toLowerCase().includes(q) || adaCocokTurunan(v, q));
}

// Kumpulkan semua node yang cocok dengan kata kunci: [{ path, nilai }].
function cariDiTree(value, query, path, hasil) {
  const q = String(query || '').toLowerCase();
  if (!q) return hasil;
  if (value !== null && typeof value === 'object') {
    Object.entries(value).forEach(([k, v]) => {
      const p = Array.isArray(value) ? path + '[' + k + ']' : path + '.' + k;
      if (k.toLowerCase().includes(q)) hasil.push({ path: p, nilai: v });
      cariDiTree(v, query, p, hasil);
    });
  } else if (JSON.stringify(value).toLowerCase().includes(q)) {
    hasil.push({ path, nilai: value });
  }
  return hasil;
}

function treeHtml(value, depth, query) {
  const q = (query || '').toLowerCase();
  if (value !== null && typeof value === 'object') {
    const isArr = Array.isArray(value);
    const keys = Object.keys(value);
    const label = isArr ? 'Array (' + keys.length + ' item)' : 'Object (' + keys.length + ' kunci)';
    if (!keys.length) return '<span class="dim">' + esc(isArr ? '[]' : '{}') + '</span>';
    const inner = keys.map((k) => {
      const v = value[k];
      const isObj = v !== null && typeof v === 'object';
      return '<div style="padding:2px 0 2px 14px;border-left:1px solid #2e2823;margin-left:4px">' +
        '<span style="color:#c9bda9">' + sorot(isArr ? k : '"' + k + '"', q) + '</span>: ' +
        (isObj ? treeHtml(v, depth + 1, query) : '<span style="color:#a9e5bb">' + sorot(JSON.stringify(v), q) + '</span>') +
        '</div>';
    }).join('');
    const buka = depth < 2 || (q && adaCocokTurunan(value, q));
    return '<details' + (buka ? ' open' : '') + ' style="display:inline"><summary style="cursor:pointer;display:inline;color:#e8e0d0">' + esc(label) + '</summary><div>' + inner + '</div></details>';
  }
  return '<span style="color:#a9e5bb">' + sorot(JSON.stringify(value), q) + '</span>';
}

// ---- Angka besar tanpa pembulatan ----
// JSON.parse mengubah angka jadi double JavaScript: bilangan bulat di atas
// 2^53 dan desimal dengan digit lebih dari ~15 akan dibulatkan. Formatter
// teks di bawah bekerja langsung pada teks mentah sehingga literal angka
// (mis. ID 64-bit, saldo kripto) tetap utuh apa adanya.
export function cariAngkaBesar(raw) {
  const ketemu = [];
  let inStr = false, escNext = false;
  const isNum = (c) => /[0-9eE+\-.]/.test(c);
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (inStr) {
      if (escNext) escNext = false;
      else if (ch === '\\') escNext = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') { inStr = true; continue; }
    if (ch === '-' || (ch >= '0' && ch <= '9')) {
      let j = i;
      while (j < raw.length && isNum(raw[j])) j++;
      const tok = raw.slice(i, j);
      if (/^-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?$/.test(tok)) {
        const mantissa = tok.replace(/^[+-]?/, '').split(/[eE]/)[0].replace('.', '').replace(/^0+/, '');
        if (mantissa.length > 15) ketemu.push(tok);
      }
      i = j - 1;
    }
  }
  return ketemu;
}

export function rapikanMentah(raw, indent) {
  const sp = ' '.repeat(indent);
  let out = '', depth = 0, inStr = false, escNext = false;
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (inStr) {
      out += ch;
      if (escNext) escNext = false;
      else if (ch === '\\') escNext = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') { inStr = true; out += ch; continue; }
    if (ch === '{' || ch === '[') {
      let j = i + 1;
      while (j < raw.length && /\s/.test(raw[j])) j++;
      const tutup = ch === '{' ? '}' : ']';
      if (raw[j] === tutup) { out += ch + tutup; i = j; continue; }
      ++depth;
      // Pagar kedalaman (P-05): output pretty-print tumbuh kuadratik
      // terhadap kedalaman (2d^2+1 karakter) — di kedalaman 5000 outputnya
      // ~50 MB dan membekukan tab ~20 detik. Batas 200 = batas Sort/Tree.
      if (depth > 200) throw new RangeError('JSON terlalu dalam (lebih dari 200 tingkat)');
      out += ch + '\n' + sp.repeat(depth);
      continue;
    }
    if (ch === '}' || ch === ']') { out += '\n' + sp.repeat(--depth) + ch; continue; }
    if (ch === ',') { out += ch + '\n' + sp.repeat(depth); continue; }
    if (ch === ':') { out += ': '; continue; }
    if (/\s/.test(ch)) continue;
    out += ch;
  }
  return out;
}

export function minifyMentah(raw) {
  let out = '', inStr = false, escNext = false;
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (inStr) {
      out += ch;
      if (escNext) escNext = false;
      else if (ch === '\\') escNext = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') { inStr = true; out += ch; continue; }
    if (/\s/.test(ch)) continue;
    out += ch;
  }
  return out;
}

// Preset schema contoh sekali klik (untuk mencoba fitur Cek Schema).
export const SCHEMA_PRESET = {
  pengguna: {
    type: 'object',
    required: ['nama', 'email'],
    properties: {
      nama: { type: 'string', minLength: 1 },
      email: { type: 'string', format: 'email' },
      umur: { type: 'integer', minimum: 0 },
      peran: { type: 'string', enum: ['admin', 'pengguna'] },
    },
  },
  produk: {
    type: 'object',
    required: ['id', 'harga'],
    properties: {
      id: { type: 'string', pattern: '^[A-Z]{3}-\\d+$' },
      nama: { type: 'string' },
      harga: { type: 'number', minimum: 0 },
      tag: { type: 'array', items: { type: 'string' }, uniqueItems: true, minItems: 1 },
    },
  },
  konfigurasi: {
    type: 'object',
    properties: {
      tema: { type: 'string', enum: ['gelap', 'terang'] },
      notifikasi: { type: 'boolean' },
      batas: { type: 'integer', minimum: 1, maximum: 100 },
    },
    additionalProperties: false,
  },
};

export const meta = {"id": "json-formatter", "name": "JSON Formatter", "cat": "developer", "icon": "🧩", "desc": "Rapikan, perbaiki, telusuri & validasi JSON. Angka besar tetap utuh, schema lengkap ($ref, format, allOf/anyOf/oneOf).", "keywords": "json,format,rapi,validasi,tree,jsonpath,schema,angka besar,ref,statistik"};
export function render(root) {

    const ta = T.ta(8, 'Paste JSON di sini…');
    const indentSel = T.select([['2', 'Indent 2'], ['4', 'Indent 4']], '2');
    const jagaAngka = document.createElement('input');
    jagaAngka.type = 'checkbox'; jagaAngka.checked = true; jagaAngka.id = 'jf-jaga';
    const box = T.out();
    let angkaBesar = [];
    let treeTerakhir = null;
    const peringatanAngka = () => angkaBesar.length
      ? '<div class="hint" style="margin-top:8px;color:#fbbf24">Perhatian: JSON ini berisi ' + angkaBesar.length + ' angka besar (contoh: ' + esc(angkaBesar[0]) + ') yang sudah dibulatkan di tampilan ini. Pakai tombol Rapikan dengan opsi "Jaga angka besar" supaya angkanya tetap utuh.</div>'
      : '';
    const statsHtml = (obj, raw) => {
      const s = hitungStatistik(obj, raw);
      return '<div class="hint" style="margin-top:8px">' + s.kunci + ' kunci · ' + s.objek + ' objek · ' + s.array + ' array · kedalaman maks ' + s.dalamMaks + ' · ' + s.byte + ' byte</div>';
    };
    const parseInput = () => {
      const raw = ta.value.trim();
      if (!raw) { T.show(box, errBox('Tempel dulu JSON-nya.')); return null; }
      try { angkaBesar = cariAngkaBesar(raw); return { obj: JSON.parse(raw), raw }; }
      catch (e) {
        let pos = '';
        const m = /position (\d+)/.exec(String(e.message));
        if (m) pos = ' (posisi karakter ke-' + m[1] + ')';
        T.show(box, errBox('JSON tidak valid' + pos + '. Coba tombol Perbaiki bila JSON-nya hampir benar.'));
        return null;
      }
    };
    const run = (mode) => {
      const parsed = parseInput();
      if (!parsed) return;
      const { obj, raw } = parsed;
      if (mode === 'valid') {
        T.show(box, '<span class="ok">✓ JSON valid.</span>' + statsHtml(obj, raw) + (angkaBesar.length
          ? '<div class="hint" style="margin-top:6px;color:#fbbf24">' + angkaBesar.length + ' angka besar terdeteksi (contoh: ' + esc(angkaBesar[0]) + '). Aktifkan "Jaga angka besar" saat merapikan supaya tidak dibulatkan.</div>' : ''));
        return;
      }
      const ind = mode === 'min' ? 0 : +indentSel.value;
      // Pagar kedalaman (P-05): Rapikan (kedua jalur) dipagari seperti
      // Sort/Tree — Minify tidak dipagari karena outputnya linear.
      if (mode !== 'min' && kedalamanJson(obj) > 200) { T.show(box, errBox('JSON ini terlalu dalam (lebih dari 200 tingkat) sehingga tidak bisa dirapikan. Coba potong bagiannya dulu.')); return; }
      if (jagaAngka.checked) {
        // Jalur teks mentah: literal angka tidak pernah disentuh.
        try {
          const hasil = mode === 'min' ? minifyMentah(raw) : rapikanMentah(raw, ind);
          T.show(box, preHtml(hasil) + statsHtml(obj, raw) + (angkaBesar.length
            ? '<div class="hint" style="margin-top:8px">' + angkaBesar.length + ' angka besar dipertahankan utuh (tidak dibulatkan).</div>' : ''));
        } catch (e) {
          T.show(box, errBox(e instanceof RangeError ? 'JSON ini terlalu dalam untuk dirapikan. Coba potong bagiannya dulu.' : 'JSON tidak bisa dirapikan. Periksa isinya, lalu coba lagi.'));
        }
        return;
      }
      try {
        T.show(box, preHtml(JSON.stringify(obj, null, ind)) + statsHtml(obj, raw) + peringatanAngka());
      } catch (e) {
        T.show(box, errBox(e instanceof RangeError ? 'JSON ini terlalu dalam untuk dirapikan. Coba potong bagiannya dulu.' : 'JSON tidak bisa dirapikan. Periksa isinya, lalu coba lagi.'));
      }
    };
    const runRepair = () => {
      const raw = ta.value.trim();
      if (!raw) { T.show(box, errBox('Tempel dulu JSON-nya.')); return; }
      try {
        const fixed = repairJson(raw);
        const obj = JSON.parse(fixed);
        // Pagar kedalaman (P-05, audit runRepair): pretty-print hasil
        // perbaikan tumbuh kuadratik seperti Rapikan.
        if (kedalamanJson(obj) > 200) { T.show(box, errBox('JSON ini terlalu dalam (lebih dari 200 tingkat) sehingga tidak bisa diperbaiki otomatis. Coba potong bagiannya dulu.')); return; }
        ta.value = JSON.stringify(obj, null, +indentSel.value);
        T.show(box, '<span class="ok">✓ JSON berhasil diperbaiki.</span> <span class="dim">Yang diperbaiki: komentar dibuang, koma berlebih dibuang, kutip tunggal diubah jadi kutip ganda, kunci tanpa kutip diberi kutip. Hasil sudah ditulis kembali ke kolom input.</span>' + preHtml(JSON.stringify(obj, null, +indentSel.value)));
      } catch (e) {
        T.show(box, errBox('Belum bisa diperbaiki otomatis. Perbaiki manual bagian yang salah, lalu coba lagi.'));
      }
    };
    const runSort = () => {
      const parsed = parseInput();
      if (!parsed) return;
      if (kedalamanJson(parsed.obj) > 200) { T.show(box, errBox('JSON ini terlalu dalam (lebih dari 200 tingkat) sehingga kuncinya tidak bisa diurutkan. Coba potong bagiannya dulu.')); return; }
      try {
        T.show(box, preHtml(JSON.stringify(sortKeysDeep(parsed.obj), null, +indentSel.value)) + peringatanAngka());
      } catch (e) {
        T.show(box, errBox(e instanceof RangeError ? 'JSON ini terlalu dalam untuk diurutkan. Coba potong bagiannya dulu.' : 'Kunci tidak bisa diurutkan. Periksa JSON-nya, lalu coba lagi.'));
      }
    };
    const tampilTree = (obj, query) => {
      if (kedalamanJson(obj) > 200) { T.show(box, errBox('JSON ini terlalu dalam (lebih dari 200 tingkat) sehingga tidak bisa ditampilkan sebagai tree. Coba potong bagiannya dulu.')); return; }
      try {
        tampilTreeDalam(obj, query);
      } catch (e) {
        T.show(box, errBox(e instanceof RangeError ? 'JSON ini terlalu dalam untuk ditampilkan sebagai tree. Coba potong bagiannya dulu.' : 'Tree tidak bisa ditampilkan. Periksa JSON-nya, lalu coba lagi.'));
      }
    };
    const tampilTreeDalam = (obj, query) => {
      let cariHtml = '';
      if (query) {
        const hasil = cariDiTree(obj, query, '$', []);
        const daftar = hasil.slice(0, 20).map((h) => {
          const nilai = typeof h.nilai === 'object' && h.nilai !== null ? (Array.isArray(h.nilai) ? 'Array (' + h.nilai.length + ' item)' : 'Object (' + Object.keys(h.nilai).length + ' kunci)') : JSON.stringify(h.nilai);
          return '<div style="font-size:12.5px;padding:2px 0"><span style="color:#c9bda9">' + esc(h.path) + '</span>: <span style="color:#a9e5bb">' + esc(String(nilai).slice(0, 120)) + '</span></div>';
        }).join('');
        cariHtml = '<div class="hint" style="margin:8px 0 4px">' + hasil.length + ' hasil untuk "' + esc(query) + '"' + (hasil.length > 20 ? ' (20 pertama ditampilkan)' : '') + '</div>' + daftar;
      }
      T.show(box, '<div style="font-family:ui-monospace,monospace;font-size:12.5px;line-height:1.6">' + treeHtml(obj, 0, query) + '</div>' + cariHtml + '<div class="hint" style="margin-top:8px">Ketuk baris untuk membuka/menutup cabangnya.</div>' + peringatanAngka());
    };
    const runTree = () => {
      const parsed = parseInput();
      if (!parsed) return;
      treeTerakhir = parsed.obj;
      tampilTree(parsed.obj, '');
    };
    const cariInp = T.input('text', 'Cari kunci atau nilai di dalam tree…');
    const runCariTree = () => {
      const q = cariInp.value.trim();
      if (!q) { T.show(box, errBox('Tulis dulu kata yang dicari.')); return; }
      if (!treeTerakhir) {
        const parsed = parseInput();
        if (!parsed) return;
        treeTerakhir = parsed.obj;
      }
      tampilTree(treeTerakhir, q);
    };
    const runStatistik = () => {
      const parsed = parseInput();
      if (!parsed) return;
      let s;
      try {
        s = hitungStatistik(parsed.obj, parsed.raw);
      } catch (e) {
        T.show(box, errBox('Statistik tidak bisa dihitung. Periksa JSON-nya, lalu coba lagi.'));
        return;
      }
      T.show(box,
        '<div class="kv"><span class="k">Jumlah kunci</span><span class="v">' + s.kunci + '</span></div>' +
        '<div class="kv"><span class="k">Jumlah objek</span><span class="v">' + s.objek + '</span></div>' +
        '<div class="kv"><span class="k">Jumlah array</span><span class="v">' + s.array + '</span></div>' +
        '<div class="kv"><span class="k">Kedalaman maks</span><span class="v">' + s.dalamMaks + ' tingkat</span></div>' +
        '<div class="kv"><span class="k">Ukuran dokumen</span><span class="v">' + s.byte + ' byte</span></div>' +
        '<p class="hint">Kedalaman dihitung dari akar dokumen (tingkat 0). Ukuran dalam byte UTF-8 dari teks yang ditempel.</p>');
    };
    const pathInp = T.input('text', '$.pengguna.nama  atau  $.daftar[*].harga');
    const runPath = () => {
      const parsed = parseInput();
      if (!parsed) return;
      if (!pathInp.value.trim()) { T.show(box, errBox('Tulis dulu jalur JSONPath-nya. Contoh: $.pengguna.nama')); return; }
      try {
        const hits = jsonPathEval(parsed.obj, pathInp.value);
        if (!hits.length) { T.show(box, '<span class="dim">Tidak ada nilai yang cocok dengan jalur itu.</span>'); return; }
        T.show(box, '<div class="hint" style="margin-bottom:6px">' + hits.length + ' nilai ditemukan.</div>' + preHtml(hits.length === 1 ? JSON.stringify(hits[0], null, 2) : JSON.stringify(hits, null, 2)));
      } catch (e) {
        T.show(box, errBox('Jalur JSONPath-nya tidak benar. Periksa penulisannya, lalu coba lagi.'));
      }
    };
    const schemaTa = T.ta(4, 'Tempel JSON Schema di sini…\nContoh: {"type":"object","required":["nama"],"properties":{"nama":{"type":"string"},"umur":{"type":"integer","minimum":0}}}');
    schemaTa.style.fontFamily = 'ui-monospace,monospace';
    const runSchema = () => {
      const parsed = parseInput();
      if (!parsed) return;
      let schema;
      try { schema = JSON.parse(schemaTa.value); } catch (e) { T.show(box, errBox('Schema bukan JSON yang benar. Periksa penulisannya, lalu coba lagi.')); return; }
      const errors = [];
      try {
        validateSchema(parsed.obj, schema, '$', errors);
      } catch (e) {
        T.show(box, errBox(e instanceof RangeError ? 'JSON atau schema-nya terlalu dalam untuk dicek. Coba potong bagiannya dulu.' : 'Schema tidak bisa dicek. Periksa penulisannya, lalu coba lagi.'));
        return;
      }
      if (!errors.length) { T.show(box, '<span class="ok">✓ Sesuai schema.</span>'); return; }
      T.show(box, '<div style="font-size:13px;margin-bottom:6px"><span class="err">✗ ' + errors.length + ' masalah ditemukan:</span></div>' + errors.map((e) => '<div style="font-size:13px;padding:3px 0">• ' + esc(e) + '</div>').join(''));
    };

    root.appendChild(T.field('Input JSON', ta));
    const lblJaga = T.el('<label style="display:flex;gap:8px;align-items:center;font-size:14px;margin:4px 0 10px"></label>');
    lblJaga.appendChild(jagaAngka);
    lblJaga.appendChild(document.createTextNode('Jaga angka besar tetap utuh (tanpa pembulatan)'));
    root.appendChild(lblJaga);
    root.appendChild(T.row(T.field('Indentasi', indentSel)));
    root.appendChild(T.row(
      T.btn('Rapikan', () => run('pretty'), true),
      T.btn('Minify', () => run('min')),
      T.btn('Validasi', () => run('valid'))
    ));
    root.appendChild(T.row(
      T.btn('Perbaiki', runRepair),
      T.btn('Urutkan Key', runSort),
      T.btn('Tree', runTree),
      T.btn('Statistik', runStatistik)
    ));
    root.appendChild(T.field('Cari di tree', cariInp, 'Cari kunci atau nilai di dalam struktur JSON (ketik lalu tekan tombol Cari).'));
    root.appendChild(T.row(T.btn('Cari', runCariTree)));
    root.appendChild(T.field('JSONPath', pathInp, 'Jalur sederhana: $.kunci, $.daftar[0], $.daftar[*].nama.'));
    root.appendChild(T.row(T.btn('Jalankan JSONPath', runPath)));
    root.appendChild(T.field('JSON Schema (untuk cek schema)', schemaTa, 'Didukung: type, required, properties, items, minimum/maximum, minLength/maxLength, pattern, enum, additionalProperties, minItems/maxItems, minProperties/maxProperties, uniqueItems, format (email/uri/date-time/date), $ref internal, allOf/anyOf/oneOf.'));
    root.appendChild(T.row(
      T.btn('Pengguna', () => { schemaTa.value = JSON.stringify(SCHEMA_PRESET.pengguna, null, 2); }),
      T.btn('Produk', () => { schemaTa.value = JSON.stringify(SCHEMA_PRESET.produk, null, 2); }),
      T.btn('Konfigurasi', () => { schemaTa.value = JSON.stringify(SCHEMA_PRESET.konfigurasi, null, 2); })
    ));
    root.appendChild(T.row(T.btn('Cek Schema', runSchema)));
    root.appendChild(box);
    root.appendChild(T.row(T.copyBtn(() => box.querySelector('pre') ? box.querySelector('pre').textContent : ''), T.dlBtn('format.json', () => box.querySelector('pre') ? box.querySelector('pre').textContent : '{}', 'application/json', 'Unduh')));
    root.appendChild(T.el('<div style="height:12px"></div>'));
    root.appendChild(T.row(
      (() => { const a = T.el('<a class="btn" href="#/t/json-diff" style="text-decoration:none;display:inline-flex;align-items:center">Bandingkan</a>'); return a; })(),
      (() => { const a = T.el('<a class="btn" href="#/t/json-table" style="text-decoration:none;display:inline-flex;align-items:center">Lihat Tabel</a>'); return a; })()
    ));

}
