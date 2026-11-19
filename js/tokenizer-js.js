// Tokenizer JavaScript + cek sintaks: modul bersama (kanonis, G4 C1G4-R).
// Dikonsolidasi dari developer/minify-javascript.js + developer/perapi-kode-
// javascript.js (G4 B14): tokenizer identik kecuali komentar (salinan
// minify berkomentar lebih lengkap; kanon memakai komentar minify);
// cekSintaksJs byte-identik; ASI_KATA identik di keduanya.
// Tokenizer tulis-sendiri (bukan Terser/Prettier): menangani string,
// template literal (termasuk ${} bersarang), regex vs pembagian (lewat
// konteks token sebelumnya + klasifikasi kurung kurawal objek vs blok),
// komentar, dan aturan ASI supaya hasil tetap berperilaku sama.
// BATAS (ditulis jujur di UI kedua tool): isi ${} di template literal
// tidak diminify; regex di dalam ${} yang mengandung backtick bisa salah
// pindai; kode dengan sintaks di luar standar (decorator, dsb.) tidak
// dijamin.
export const KATA_KUNCI = new Set('break case catch continue debugger default delete do else finally for function if in instanceof new return switch this throw try typeof var void while with yield await let const class extends super import export static get set of'.split(' '));
// Kata kunci yang setelahnya sebuah ekspresi (jadi "/" sesudahnya = regex).
const SESUDAH_REGEX = new Set(['return', 'typeof', 'case', 'delete', 'void', 'in', 'of', 'instanceof', 'new', 'throw', 'yield', 'await', 'else', 'do']);
// Token yang bisa mengakhiri sebuah ekspresi ("/" sesudahnya = pembagian).
// Diekspor karena dipakai minifyJs + rapikanJs (aturan spasi ++/-- dan
// penanda unary/prefix), bukan hanya oleh tokenisasiJs.
export function akhiriNilai(tok) {
  if (!tok) return false;
  if (tok.t === 'nama' || tok.t === 'angka' || tok.t === 'string' || tok.t === 'template' || tok.t === 'regex') return true;
  if (tok.t !== 'tanda') return false;
  return tok.v === ')' || tok.v === ']' || tok.v === '}' || tok.v === '++' || tok.v === '--';
}
const OPERATOR = ['>>>=', '...', '===', '!==', '>>>', '<<=', '>>=', '**=', '&&=', '||=', '??=', '=>', '==', '!=', '<=', '>=', '&&', '||', '??', '?.', '++', '--', '<<', '>>', '**', '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^='];
const AWAL_NAMA = /[$A-Za-z_\u00C0-\uFFFF]/;
const LANJUT_NAMA = /[$A-Za-z0-9_\u00C0-\uFFFF]/;

// Token: {t:'nama'|'angka'|'string'|'template'|'regex'|'tanda'|'komen',
// v:string, nl:jumlah baris baru sebelum token, blok:bool (komen blok),
// kasus:bool (":" label case), forParen:bool ("(" kepala for),
// obj:bool ("}" penutup objek)}.
export function tokenisasiJs(src) {
  const s = String(src == null ? '' : src);
  const token = [];
  const kurung = []; // tumpukan '{': 'obj' | 'blok'
  const paren = []; // tumpukan '(': true bila kepala for
  let i = 0, nl = 0, kasusMenunggu = false, kasusKedalaman = 0, kasusTokenIdx = -1, siku = 0;
  const tanya = []; // kedalaman tiap "?" ternary yang belum berpasangan
  const kedalamanTotal = () => paren.length + kurung.length + siku;
  const terakhir = () => {
    for (let k = token.length - 1; k >= 0; k--) {
      if (token[k].t !== 'komen') return token[k];
    }
    return null;
  };
  const dorong = (t, v, ekstra) => {
    const tok = { t, v, nl };
    if (ekstra) Object.assign(tok, ekstra);
    token.push(tok);
    nl = 0;
  };
  // Shebang di baris pertama diperlakukan sebagai komentar baris.
  // (G4 Blue R1, korektness: i WAJIB dimajukan ke ujung baris — tanpa
  // ini baris shebang di-tokenisasi ulang sebagai #, !, /, nama ...)
  if (s.startsWith('#!')) {
    let j = 0;
    while (j < s.length && s[j] !== '\n') j++;
    dorong('komen', s.slice(0, j), { blok: false });
    i = j;
  }
  while (i < s.length) {
    const c = s[i];
    if (c === ' ' || c === '\t' || c === '\r' || c === '\f' || c === '\v' || c === '\u00A0') { i++; continue; }
    if (c === '\n') { nl++; i++; continue; }
    // Komentar.
    if (c === '/' && s[i + 1] === '/') {
      let j = i;
      while (j < s.length && s[j] !== '\n') j++;
      dorong('komen', s.slice(i, j), { blok: false });
      i = j;
      continue;
    }
    if (c === '/' && s[i + 1] === '*') {
      const akhir = s.indexOf('*/', i + 2);
      const j = akhir === -1 ? s.length : akhir + 2;
      const teks = s.slice(i, j);
      dorong('komen', teks, { blok: true });
      nl += (teks.match(/\n/g) || []).length;
      i = j;
      continue;
    }
    // String.
    if (c === "'" || c === '"') {
      let j = i + 1;
      while (j < s.length) {
        if (s[j] === '\\') { j += 2; continue; }
        if (s[j] === c) { j++; break; }
        if (s[j] === '\n') break;
        j++;
      }
      dorong('string', s.slice(i, j));
      i = j;
      continue;
    }
    // Template literal, termasuk ${} bersarang (string/template/regex
    // di dalamnya dipindai supaya backtick penutup tidak salah baca).
    if (c === '`') {
      let j = i + 1, kedalaman = 0, mode = 'teks';
      while (j < s.length) {
        const ch = s[j];
        if (mode === 'teks') {
          if (ch === '\\') { j += 2; continue; }
          if (ch === '`' && kedalaman === 0) { j++; break; }
          if (ch === '$' && s[j + 1] === '{') { kedalaman++; mode = 'ekspresi'; j += 2; continue; }
          j++;
          continue;
        }
        // Di dalam ${...}: pindai seperti kode biasa sampai } penutup.
        if (ch === "'" || ch === '"') {
          j++;
          while (j < s.length) {
            if (s[j] === '\\') { j += 2; continue; }
            if (s[j] === ch || s[j] === '\n') { j++; break; }
            j++;
          }
          continue;
        }
        if (ch === '`') {
          // Template bersarang: pindai rekursif sederhana.
          let k = j + 1, d2 = 0, m2 = 'teks';
          while (k < s.length) {
            const c2 = s[k];
            if (m2 === 'teks') {
              if (c2 === '\\') { k += 2; continue; }
              if (c2 === '`' && d2 === 0) { k++; break; }
              if (c2 === '$' && s[k + 1] === '{') { d2++; m2 = 'ekspresi'; k += 2; continue; }
              k++;
              continue;
            }
            if (c2 === '{') { d2++; }
            else if (c2 === '}') { d2--; if (d2 === 0) m2 = 'teks'; }
            k++;
          }
          j = k;
          continue;
        }
        if (ch === '{') { kedalaman++; j++; continue; }
        if (ch === '}') {
          kedalaman--;
          j++;
          if (kedalaman === 0) mode = 'teks';
          continue;
        }
        j++;
      }
      const teks = s.slice(i, j);
      dorong('template', teks);
      nl += (teks.match(/\n/g) || []).length;
      i = j;
      continue;
    }
    // Angka: desimal, hex, biner, oktal, eksponen, bigint, 0.5 dan .5.
    if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(s[i + 1] || ''))) {
      let j = i;
      if (c === '0' && (s[j + 1] === 'x' || s[j + 1] === 'X')) {
        j += 2;
        while (j < s.length && /[0-9a-fA-F_]/.test(s[j])) j++;
      } else if (c === '0' && (s[j + 1] === 'b' || s[j + 1] === 'B')) {
        j += 2;
        while (j < s.length && /[01_]/.test(s[j])) j++;
      } else if (c === '0' && (s[j + 1] === 'o' || s[j + 1] === 'O')) {
        j += 2;
        while (j < s.length && /[0-7_]/.test(s[j])) j++;
      } else {
        while (j < s.length && /[0-9_]/.test(s[j])) j++;
        if (s[j] === '.' && /[0-9]/.test(s[j + 1] || '')) {
          j++;
          while (j < s.length && /[0-9_]/.test(s[j])) j++;
        } else if (s[j] === '.' && c !== '.') {
          // "1." valid (angka 1 lalu titik desimal kosong); tapi jangan
          // makan titik akses properti: "1.toString" harus jadi 1 + . +
          // toString. Titik diikuti huruf = akses properti, bukan desimal.
          if (!/[A-Za-z_$]/.test(s[j + 1] || '')) j++;
        }
        if (s[j] === 'e' || s[j] === 'E') {
          let k = j + 1;
          if (s[k] === '+' || s[k] === '-') k++;
          if (/[0-9]/.test(s[k] || '')) {
            j = k;
            while (j < s.length && /[0-9_]/.test(s[j])) j++;
          }
        }
      }
      if (s[j] === 'n') j++;
      dorong('angka', s.slice(i, j));
      i = j;
      continue;
    }
    // Nama (termasuk field privat #nama dan escape \u).
    if (AWAL_NAMA.test(c) || (c === '#' && AWAL_NAMA.test(s[i + 1] || '')) || (c === '\\' && s[i + 1] === 'u')) {
      let j = i;
      if (s[j] === '#') j++;
      while (j < s.length) {
        if (s[j] === '\\' && s[j + 1] === 'u') {
          j += 2;
          if (s[j] === '{') { while (j < s.length && s[j] !== '}') j++; j++; }
          else j += 4;
          continue;
        }
        if (LANJUT_NAMA.test(s[j])) { j++; continue; }
        break;
      }
      const nama = s.slice(i, j);
      // "case"/"default" hanya label bila kurung terdalam bukan objek
      // ({case: 1} adalah nama properti, bukan label).
      if ((nama === 'case' || nama === 'default') && kurung[kurung.length - 1] !== 'obj') {
        kasusMenunggu = true;
        kasusKedalaman = kedalamanTotal();
        kasusTokenIdx = token.length;
      }
      dorong('nama', nama);
      i = j;
      continue;
    }
    // Regex atau pembagian: diputuskan dari token sebelumnya.
    if (c === '/') {
      const seb = terakhir();
      let bolehRegex = false;
      if (!seb) bolehRegex = true;
      else if (seb.t === 'nama' && SESUDAH_REGEX.has(seb.v)) bolehRegex = true;
      else if (seb.t === 'tanda' && seb.v !== ')' && seb.v !== ']') {
        if (seb.v === '}') bolehRegex = seb.obj === false;
        else bolehRegex = true;
      }
      if (bolehRegex) {
        let j = i + 1, dalamKelas = false;
        while (j < s.length) {
          const ch = s[j];
          if (ch === '\\') { j += 2; continue; }
          if (ch === '\n') break;
          if (ch === '[') dalamKelas = true;
          if (ch === ']') dalamKelas = false;
          if (ch === '/' && !dalamKelas) { j++; break; }
          j++;
        }
        while (j < s.length && /[a-z]/i.test(s[j])) j++;
        dorong('regex', s.slice(i, j));
        i = j;
        continue;
      }
      // Pembagian: /= atau / (operator di bawah yang menangani).
    }
    // Operator (cocok terpanjang dulu) dan tanda baca.
    let cocok = null;
    for (const op of OPERATOR) {
      if (s.startsWith(op, i)) { cocok = op; break; }
    }
    if (!cocok) cocok = c;
    const seb = terakhir();
    if (cocok === '{') {
      // Objek bila sesudahnya konteks ekspresi; blok bila sesudahnya
      // konteks pernyataan (sesudah ")", kata kunci blok, nama kelas, dsb).
      let obj = false;
      if (seb) {
        if (seb.t === 'tanda' && (seb.v === '=' || seb.v === '(' || seb.v === '[' || seb.v === ',')) obj = true;
        else if (seb.t === 'tanda' && seb.v === ':' && !seb.kasus) obj = true;
        else if (seb.t === 'tanda' && ![')', ']', '}', ';', '{'].includes(seb.v)) obj = true;
        else if (seb.t === 'nama' && SESUDAH_REGEX.has(seb.v)) obj = true;
      }
      kurung.push(obj ? 'obj' : 'blok');
      dorong('tanda', '{', { obj });
      i++;
      continue;
    }
    if (cocok === '}') {
      const jenis = kurung.pop() || 'blok';
      if (kasusMenunggu && kedalamanTotal() < kasusKedalaman) { kasusMenunggu = false; kasusTokenIdx = -1; }
      dorong('tanda', '}', { obj: jenis === 'obj' });
      i++;
      continue;
    }
    if (cocok === '(') {
      const kepalaFor = !!(seb && seb.t === 'nama' && seb.v === 'for');
      paren.push(kepalaFor);
      dorong('tanda', '(', { forParen: kepalaFor });
      i++;
      continue;
    }
    if (cocok === ')') {
      paren.pop();
      dorong('tanda', ')');
      i++;
      continue;
    }
    if (cocok === '[') siku++;
    if (cocok === ']') siku = Math.max(0, siku - 1);
    if (cocok === '?') tanya.push(kedalamanTotal());
    if (cocok === ':') {
      // ":" ternary (berpasangan dengan "?") bukan ":" label case.
      // ":" label case adalah yang pertama di kedalaman yang sama
      // dengan kata case/default-nya (export default {a: 1} aman:
      // ":" di dalam objek lebih dalam).
      let adalahKasus = false;
      if (tanya.length && tanya[tanya.length - 1] === kedalamanTotal()) tanya.pop();
      else if (kasusMenunggu && kedalamanTotal() === kasusKedalaman) {
        adalahKasus = true;
        kasusMenunggu = false;
        // Tandai kata case/default-nya sebagai label (baru sekarang
        // terbukti: "export default" tidak pernah dapat tanda ini).
        if (kasusTokenIdx >= 0 && token[kasusTokenIdx]) token[kasusTokenIdx].label = true;
        kasusTokenIdx = -1;
      }
      dorong('tanda', ':', { kasus: adalahKasus });
      i++;
      continue;
    }
    if (cocok === ';') { kasusMenunggu = false; kasusTokenIdx = -1; }
    dorong('tanda', cocok);
    i += cocok.length;
  }
  return token;
}

// Kata kunci yang memicu penyisipan titik-koma otomatis (ASI) bila
// baris baru mengikutinya: dipakai minifyJs + rapikanJs.
export const ASI_KATA = new Set(['return', 'throw', 'break', 'continue', 'yield']);

// Cek sintaks JS lewat `new Function` (plus penanganan modul: baris
// import/export dilucuti lalu dicek ulang). Mengembalikan
// { valid, pesan, modul }.
export function cekSintaksJs(kode) {
  const src = String(kode == null ? '' : kode);
  try {
    new Function(src);
    return { valid: true, pesan: '', modul: false };
  } catch (e) {
    const modul = /\bimport\s*(\{|\*|['"]|[A-Za-z_$])|\bexport\s*(\{|\*|default|const|let|var|function|class)\b/.test(src);
    if (modul) {
      const tanpaModul = src
        .replace(/(^|[;\n{}])\s*import\s*[^;]*?from\s*['"][^'"]*['"]\s*;?/g, '$1')
        .replace(/(^|[;\n{}])\s*import\s*['"][^'"]*['"]\s*;?/g, '$1')
        .replace(/(^|[;\n{}])\s*export\s*default\s*/g, '$1')
        .replace(/(^|[;\n{}])\s*export\s*(?=\{)/g, '$1')
        .replace(/(^|[;\n{}])\s*export\s+/g, '$1');
      try {
        new Function(tanpaModul);
        return { valid: true, pesan: '', modul: true };
      } catch (e2) {
        return { valid: false, pesan: e2 && e2.message ? String(e2.message) : 'Sintaks tidak valid.', modul: true };
      }
    }
    return { valid: false, pesan: e && e.message ? String(e.message) : 'Sintaks tidak valid.', modul: false };
  }
}
