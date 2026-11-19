import { h as T, errBox } from '../../core.js';

// Perapi kode JavaScript client-side dengan tokenizer tulis-sendiri (bukan
// Prettier: tidak ada pustaka itu di repo). Tokenizer ini SALINAN IDENTIK
// dari minify-javascript.js supaya tiap tool mandiri (pola repo: tool
// self-contained). Perapi mengatur indentasi dari kurung kurawal, memecah
// pernyataan per baris, dan menjaga isi string/template/regex apa adanya.
// BATAS (ditulis jujur di UI): baris panjang tidak dibungkus; switch
// bersarang di dalam case dirapikan seadanya; sintaks di luar standar
// (decorator, dsb.) tidak dijamin.
// Tokenizer JS + cek sintaks tinggal di modul bersama js/tokenizer-js.js
// (kanonis, G4 C1G4-R; dikonsolidasi dari minify-javascript.js +
// perapi-kode-javascript.js).
import { tokenisasiJs, cekSintaksJs, ASI_KATA, KATA_KUNCI, akhiriNilai } from '../../tokenizer-js.js';
export { cekSintaksJs } from '../../tokenizer-js.js';


const BINER = new Set(['=', '==', '===', '!=', '!==', '<', '>', '<=', '>=', '+', '-', '*', '/', '%', '**', '<<', '>>', '>>>', '&', '|', '^', '&&', '||', '??', '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '<<=', '>>=', '>>>=', '**=', '&&=', '||=', '??=', '=>']);
const KATA_SEBELUM_KURUNG = new Set(['if', 'for', 'while', 'switch', 'catch', 'with', 'function']);
const LANJUT_SETELAH_TUTUP = new Set(['else', 'catch', 'finally', 'while']);

export function rapikanJs(kode, indent) {
  const src = String(kode == null ? '' : kode);
  const token = tokenisasiJs(src);
  const pad = ' '.repeat(indent === 4 ? 4 : 2);
  const baris = [];
  let line = '';
  let kedalaman = 0;
  const tumpukanKasus = [];
  const tumpukanParen = [];
  const tumpukanTernari = [];
  const tumpukanKurung = []; // {obj, paren, siku} per "{" mode pecah
  let kedalamanSiku = 0;
  let seb = null;
  let sebKode = null; // token kode terakhir (komentar tidak dihitung)
  let impExp = false; // pernyataan import/export: kurungnya sebaris
  let impExpDalam = 0; // kedalaman kurung di dalam import/export
  const indentAktif = () => kedalaman + tumpukanKasus.length + impExpDalam;
  const flush = () => {
    if (line !== '') baris.push(pad.repeat(indentAktif()) + line.replace(/\s+$/, ''));
    line = '';
  };
  const barisKosong = () => {
    if (baris.length && baris[baris.length - 1] !== '') baris.push('');
  };
  const kata = (t) => t && (t.t === 'nama' || t.t === 'angka' || t.t === 'string' || t.t === 'template' || t.t === 'regex');
  // Spasi sebelum token kini, melihat token sebelumnya.
  const spasi = (kini) => {
    if (!seb || line === '') return false;
    if (kini.t === 'tanda' && kini.v === ':') return !!kini._ternari;
    if (kini.t === 'tanda' && [',', ';', ')', ']', '.', '?.'].includes(kini.v)) return false;
    if (seb.t === 'tanda' && ['(', '[', '.', '?.', '!', '~', '...'].includes(seb.v)) return false;
    if (seb.t === 'tanda' && (seb.v === '++' || seb.v === '--') && seb._prefix) return false;
    if (seb.t === 'tanda' && (seb.v === '+' || seb.v === '-') && seb._unary) return false;
    if (seb.t === 'tanda' && seb.v === '*' && seb._bintangKata) return true;
    if (kini.t === 'tanda' && kini.v === '*') {
      if (seb.t === 'nama' && (seb.v === 'function' || seb.v === 'yield')) return false;
    }
    if (kini.t === 'tanda' && kini.v === '(') {
      if (seb.t === 'nama' && seb.v === 'import') return false;
      if (seb.t === 'nama' && KATA_KUNCI.has(seb.v)) return true;
      if (seb.t === 'tanda' && (BINER.has(seb.v) || seb.v === ',' || seb.v === '?' || seb.v === ':')) return true;
      return false;
    }
    if (kini.t === 'tanda' && kini.v === '[') {
      if (seb.t === 'nama' && KATA_KUNCI.has(seb.v)) return true;
      if (seb.t === 'tanda' && (BINER.has(seb.v) || seb.v === ',' || seb.v === '?' || seb.v === ':')) return true;
      return false;
    }
    if (kini.t === 'tanda' && kini.v === '{') return true;
    if (kini.t === 'tanda' && BINER.has(kini.v)) return true;
    if (seb.t === 'tanda' && BINER.has(seb.v)) return true;
    if (kini.t === 'tanda' && kini.v === '?') return true;
    if (seb.t === 'tanda' && seb.v === '?') return true;
    if (seb.t === 'tanda' && seb.v === ',') return true;
    if (seb.t === 'tanda' && seb.v === ':') return true;
    if (kini.t === 'tanda' && (kini.v === '++' || kini.v === '--')) return !akhiriNilai(seb);
    if (kata(seb) && kata(kini)) return true;
    if (seb.t === 'tanda' && seb.v === '}' && kini.t === 'nama') return true;
    if (seb.t === 'komen') return !([',', ';', ')', ']', '.', '?.'].includes(kini.v));
    return false;
  };
  const tulis = (tok) => {
    if (spasi(tok)) line += ' ';
    line += tok.v;
    seb = tok;
  };

  for (let idx = 0; idx < token.length; idx++) {
    const tok = token[idx];
    // Baris kosong di sumber (maksimal satu) dipertahankan di batas baris.
    if (tok.nl >= 2 && line === '' && baris.length && baris[baris.length - 1] !== '') barisKosong();
    if (tok.t === 'komen') {
      if (!tok.blok) {
        if (line !== '') line += ' ';
        line += tok.v;
        flush();
      } else {
        if (line !== '' && !line.endsWith(' ') && !line.endsWith('(') && !line.endsWith('[')) line += ' ';
        line += tok.v;
        seb = tok;
      }
      continue;
    }
    // Penanda pernyataan import/export (kurungnya sebaris).
    if (tok.t === 'nama' && (tok.v === 'import' || tok.v === 'export') && line === '') impExp = true;
    if (impExp && tok.t === 'nama' && ['default', 'const', 'let', 'var', 'function', 'class'].includes(tok.v)) impExp = false;
    if (impExp && tok.t === 'tanda' && (tok.v === '(' || tok.v === '=')) impExp = false;
    if (tok.t === 'tanda' && tok.v === ';') impExp = false;

    // ASI: baris baru sesudah return/throw/break/continue/yield, atau
    // sebelum ++/-- sesudah nilai, wajib jadi titik koma + baris baru.
    const lalu = sebKode;
    if (lalu && tok.nl > 0 && tok.v !== ';' && tok.v !== '}') {
      const sesudahAsi = lalu.t === 'nama' && ASI_KATA.has(lalu.v);
      const sebelumInc = akhiriNilai(lalu) && (tok.v === '++' || tok.v === '--');
      const incGanda = (lalu.v === '++' || lalu.v === '--') && (tok.v === '++' || tok.v === '--');
      if (sesudahAsi || sebelumInc || incGanda) {
        if (line !== '' && !line.endsWith(';') && !line.endsWith('{')) line += ';';
        flush();
      }
    }
    sebKode = tok;

    if (tok.t === 'tanda' && tok.v === '(') tumpukanParen.push(!!tok.forParen);
    if (tok.t === 'tanda' && tok.v === ')') tumpukanParen.pop();
    if (tok.t === 'tanda' && tok.v === '[') kedalamanSiku++;
    if (tok.t === 'tanda' && tok.v === ']') kedalamanSiku = Math.max(0, kedalamanSiku - 1);
    if (tok.t === 'tanda' && tok.v === '?') tumpukanTernari.push(tumpukanParen.length);
    if (tok.t === 'tanda' && tok.v === ':' && !tok.kasus) {
      if (tumpukanTernari.length && tumpukanTernari[tumpukanTernari.length - 1] === tumpukanParen.length) {
        tumpukanTernari.pop();
        tok._ternari = true;
      }
    }
    // Tandai ++/-- prefix dan +/- unary untuk aturan spasi (melihat
    // token kode sebelumnya, bukan komentar).
    if (tok.t === 'tanda' && (tok.v === '++' || tok.v === '--')) tok._prefix = !akhiriNilai(lalu);
    if (tok.t === 'tanda' && (tok.v === '+' || tok.v === '-')) tok._unary = !akhiriNilai(lalu);
    if (tok.t === 'tanda' && tok.v === '*') tok._bintangKata = !!(lalu && lalu.t === 'nama' && (lalu.v === 'function' || lalu.v === 'yield'));

    if (tok.t === 'tanda' && tok.v === '{') {
      if (impExp) {
        // Kurung import/export: sebaris, spasi di dalam.
        if (line !== '' && !line.endsWith(' ')) line += ' ';
        line += '{ ';
        impExpDalam++;
        seb = tok;
        continue;
      }
      // Blok kosong {} tetap sebaris (hanya bila } langsung sesudah {;
      // komentar di antaranya tidak boleh hilang).
      if (token[idx + 1] && token[idx + 1].t === 'tanda' && token[idx + 1].v === '}') {
        if (line !== '' && !line.endsWith(' ') && !line.endsWith('(') && !line.endsWith('[')) line += ' ';
        line += '{}';
        seb = token[idx + 1];
        sebKode = token[idx + 1];
        idx++;
        continue;
      }
      // Objek pendek (tanpa titik koma/komentar baris, muat sebaris)
      // tetap sebaris: { a: 1, b: 2 }. Blok pernyataan selalu dipecah.
      if (tok.obj) {
        let dalam = 0, akhirIdx = -1, panjang = 2, boleh = true;
        for (let k = idx; k < token.length; k++) {
          const t = token[k];
          if (t.t === 'komen' && (!t.blok || t.v.includes('\n'))) { boleh = false; break; }
          if (t.t === 'tanda' && t.v === '{') dalam++;
          if (t.t === 'tanda' && t.v === '}') {
            dalam--;
            if (dalam === 0) { akhirIdx = k; break; }
          }
          if (t.t === 'tanda' && t.v === ';') { boleh = false; break; }
          panjang += t.v.length + 1;
          if (panjang > 62) { boleh = false; break; }
        }
        if (boleh && akhirIdx > idx) {
          if (line !== '' && !line.endsWith(' ') && !line.endsWith('(') && !line.endsWith('[')) line += ' ';
          line += '{';
          seb = tok;
          for (let k = idx + 1; k < akhirIdx; k++) {
            const t = token[k];
            if (t.t === 'tanda' && t.v === ':' && !t.kasus) {
              if (tumpukanTernari.length && tumpukanTernari[tumpukanTernari.length - 1] === tumpukanParen.length) {
                tumpukanTernari.pop();
                t._ternari = true;
              }
            }
            if (t.t === 'tanda' && (t.v === '++' || t.v === '--')) t._prefix = !akhiriNilai(sebKode);
            if (t.t === 'tanda' && (t.v === '+' || t.v === '-')) t._unary = !akhiriNilai(sebKode);
            if (t.t === 'tanda' && t.v === '*') t._bintangKata = !!(sebKode && sebKode.t === 'nama' && (sebKode.v === 'function' || sebKode.v === 'yield'));
            if (t.t === 'komen') {
              if (!line.endsWith(' ') && !line.endsWith('{')) line += ' ';
              line += t.v;
            } else {
              if (line.endsWith('{')) line += ' ';
              else if (t.t === 'tanda' && t.v === '}') { if (!line.endsWith(' ')) line += ' '; }
              else if (spasi(t)) line += ' ';
              line += t.v;
              seb = t;
            }
            if (t.t === 'tanda' && t.v === '(') tumpukanParen.push(!!t.forParen);
            if (t.t === 'tanda' && t.v === ')') tumpukanParen.pop();
            if (t.t === 'tanda' && t.v === '?') tumpukanTernari.push(tumpukanParen.length);
            if (t.t !== 'komen') sebKode = t;
          }
          if (!line.endsWith('{') && !line.endsWith(' ')) line += ' ';
          line += '}';
          seb = token[akhirIdx];
          sebKode = token[akhirIdx];
          idx = akhirIdx;
          continue;
        }
      }
      if (line !== '' && !line.endsWith(' ') && !line.endsWith('(') && !line.endsWith('[')) line += ' ';
      line += '{';
      seb = tok;
      flush();
      tumpukanKurung.push({ obj: !!tok.obj, paren: tumpukanParen.length, siku: kedalamanSiku });
      kedalaman++;
      continue;
    }
    if (tok.t === 'tanda' && tok.v === '}') {
      if (impExpDalam > 0) {
        impExpDalam--;
        if (line.endsWith('{ ')) line = line.slice(0, -1); // kurung kosong: {}
        else if (line !== '' && !line.endsWith(' ') && !line.endsWith('{')) line += ' ';
        line += '}';
        seb = tok;
        continue;
      }
      if (line !== '') flush();
      if (tumpukanKasus.length && tumpukanKasus[tumpukanKasus.length - 1] === kedalaman) tumpukanKasus.pop();
      tumpukanKurung.pop();
      kedalaman = Math.max(0, kedalaman - 1);
      line = '}';
      seb = tok;
      let berikut = null;
      for (let k = idx + 1; k < token.length; k++) {
        if (token[k].t !== 'komen') { berikut = token[k]; break; }
      }
      // Tetap sebaris bila lanjutannya else/catch/finally/while, atau
      // tanda baca penutup/lanjutan (}); , . ? operator). Baris baru
      // hanya bila token berikut memulai pernyataan/ekspresi baru.
      const lanjut = berikut && ((berikut.t === 'nama' && LANJUT_SETELAH_TUTUP.has(berikut.v)) || (berikut.t === 'tanda' && berikut.v !== '{'));
      if (!lanjut) flush();
      continue;
    }
    if (tok.t === 'nama' && tok.label === true) {
      while (tumpukanKasus.length && tumpukanKasus[tumpukanKasus.length - 1] === kedalaman) tumpukanKasus.pop();
      if (line !== '') flush();
      tulis(tok);
      continue;
    }
    if (tok.t === 'tanda' && tok.v === ':' && tok.kasus) {
      line += ':';
      seb = tok;
      flush();
      tumpukanKasus.push(kedalaman);
      continue;
    }
    if (tok.t === 'tanda' && tok.v === ';') {
      line += ';';
      seb = tok;
      const diFor = tumpukanParen.length && tumpukanParen[tumpukanParen.length - 1];
      if (!diFor) flush();
      else {
        // Spasi sesudah ";" kepala for, kecuali tepat sebelum ")".
        let berikut = null;
        for (let k = idx + 1; k < token.length; k++) {
          if (token[k].t !== 'komen') { berikut = token[k]; break; }
        }
        if (!(berikut && berikut.t === 'tanda' && berikut.v === ')')) line += ' ';
      }
      continue;
    }
    if (tok.t === 'tanda' && tok.v === ',') {
      tulis(tok);
      // Koma di dalam objek (bukan di array/panggilan/for) memecah baris.
      const atas = tumpukanKurung[tumpukanKurung.length - 1];
      if (atas && atas.obj && atas.paren === tumpukanParen.length && atas.siku === kedalamanSiku && impExpDalam === 0) flush();
      continue;
    }
    tulis(tok);
  }
  flush();
  // Runtuhkan baris kosong beruntun (maksimal satu).
  const hasil = [];
  for (const b of baris) {
    if (b === '' && hasil.length && hasil[hasil.length - 1] === '') continue;
    hasil.push(b);
  }
  while (hasil.length && hasil[hasil.length - 1] === '') hasil.pop();
  return hasil.join('\n') + (hasil.length ? '\n' : '');
}


export const meta = { id: 'perapi-kode-javascript', name: 'Perapi Kode JavaScript', cat: 'developer', icon: '✨', desc: 'Rapikan indentasi dan baris kode JavaScript supaya mudah dibaca. String, template, dan regex dijaga apa adanya.', keywords: 'javascript,rapi,format,formatter,indentasi,js,prettier,beautify', since: '6.19.0' };

export function render(root) {
  const indSel = T.select([['2', 'Indent 2 spasi'], ['4', 'Indent 4 spasi']], '2');
  const inp = T.ta(10, 'Tempel kode JavaScript di sini…');
  inp.style.fontFamily = 'ui-monospace,monospace';
  inp.spellcheck = false;
  const outp = T.ta(10, 'Hasil rapi muncul di sini…');
  outp.style.fontFamily = 'ui-monospace,monospace';
  outp.readOnly = true;
  const status = T.out();
  let lastResult = '';

  const jalan = () => {
    const raw = inp.value;
    if (!raw.trim()) { T.show(status, errBox('Tempel dulu kode JavaScript-nya.')); return; }
    const cek = cekSintaksJs(raw);
    if (!cek.valid && !cek.modul) { T.show(status, errBox('Kodenya tidak valid, jadi tidak bisa dirapikan: ' + cek.pesan)); return; }
    lastResult = rapikanJs(raw, +indSel.value);
    outp.value = lastResult;
    const cekHasil = cekSintaksJs(lastResult);
    T.show(status,
      (cekHasil.valid ? '<span class="ok">Sudah rapi. Sintaks hasil tetap valid.</span>' : (cekHasil.modul ? '<span class="ok">Sudah rapi.</span><p class="hint">Kode modul (import/export) tidak bisa dicek penuh di sini, cek lagi dengan bundler kamu.</p>' : '<p class="hint">Perhatian: hasil rapi gagal dicek sintaksnya (' + T.esc(cekHasil.pesan) + '). Jangan dipakai dulu.</p>')));
  };

  root.appendChild(T.field('Indentasi', indSel));
  root.appendChild(T.field('Kode JavaScript', inp));
  root.appendChild(T.row(T.btn('Rapikan', jalan, true), T.copyBtn(() => lastResult, 'Salin Hasil'), T.dlBtn('script.rapi.js', () => lastResult, 'text/javascript;charset=utf-8', 'Unduh .js')));
  root.appendChild(status);
  root.appendChild(T.field('Hasil', outp));
  root.appendChild(T.el('<div class="hint" style="margin-top:12px">Perapi ini ringan dan dibuat sendiri, bukan Prettier. Baris yang panjang tidak dibungkus, dan switch yang bersarang di dalam case dirapikan seadanya. Untuk proyek besar, pakai Prettier.</div>'));
}
