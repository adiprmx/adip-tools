import { h as T, errBox } from '../../core.js';

// Minify JavaScript client-side dengan tokenizer tulis-sendiri (bukan
// Terser/Prettier: tidak ada pustaka itu di repo, dan memuatnya dari CDN
// hanya untuk tool ini tidak sepadan). Tokenizer ini menangani string,
// template literal (termasuk ${} bersarang), regex vs pembagian (lewat
// konteks token sebelumnya + klasifikasi kurung kurawal objek vs blok),
// komentar, dan aturan ASI supaya hasil tetap berperilaku sama.
// BATAS (ditulis jujur di UI): isi ${} di template literal tidak
// diminify; regex di dalam ${} yang mengandung backtick bisa salah
// pindai; kode dengan sintaks di luar standar (decorator, dsb.) tidak
// dijamin. Salinan tokenizer yang sama ada di perapi-kode-javascript.js
// supaya tiap tool mandiri (pola repo: tool self-contained).
// Tokenizer JS + cek sintaks tinggal di modul bersama js/tokenizer-js.js
// (kanonis, G4 C1G4-R; dikonsolidasi dari minify-javascript.js +
// perapi-kode-javascript.js).
import { tokenisasiJs, cekSintaksJs, ASI_KATA, akhiriNilai } from '../../tokenizer-js.js';
export { cekSintaksJs } from '../../tokenizer-js.js';


// Spasi wajib di antara dua token yang kalau ditempel berubah arti
// (dua kata, a + +b jadi a++b, a / /re/ jadi komentar, a < !b jadi <!--).
function butuhSpasi(seb, kini) {
  if (!seb) return false;
  const kata = (t) => t.t === 'nama' || t.t === 'angka';
  if (kata(seb) && kata(kini)) return true;
  if ((seb.v === '+' || seb.v === '-') && kini.v[0] === seb.v) return true;
  if (seb.v === '/' && kini.v[0] === '/') return true;
  if (seb.v === '<' && kini.v[0] === '!') return true;
  return false;
}


export function minifyJs(kode) {
  const src = String(kode == null ? '' : kode);
  const sebelum = src.length;
  const token = tokenisasiJs(src);
  let keluar = '';
  let seb = null; // token terakhir yang dikeluarkan (bukan komen)
  let sebKode = null; // token kode terakhir (komentar tidak dihitung:
  // "return /*c*/\nx" tetap ASI karena baris baru sesudah return)
  let dalamFor = 0; // kedalaman paren kepala for
  const tumpukanParen = [];
  const keluarkan = (teks) => { keluar += teks; };
  for (let idx = 0; idx < token.length; idx++) {
    const tok = token[idx];
    if (tok.t === 'komen') {
      // Hanya komentar lisensi /*! ... */ yang dipertahankan; komentar
      // blok adalah whitespace bagi parser, jadi aman ditempel langsung.
      if (tok.blok && tok.v.startsWith('/*!')) {
        if (seb && butuhSpasi(seb, tok)) keluarkan(' ');
        keluarkan(tok.v);
        seb = tok;
      }
      continue;
    }
    // ASI: baris baru sesudah return/throw/break/continue/yield, atau
    // sebelum ++/-- sesudah nilai, wajib jadi titik koma eksplisit.
    if (sebKode && tok.nl > 0) {
      const sesudahAsi = sebKode.t === 'nama' && ASI_KATA.has(sebKode.v) && tok.v !== ';' && tok.v !== '}';
      const sebelumInc = akhiriNilai(sebKode) && (tok.v === '++' || tok.v === '--');
      const incGanda = (sebKode.v === '++' || sebKode.v === '--') && (tok.v === '++' || tok.v === '--');
      if (sesudahAsi || sebelumInc || incGanda) {
        if (keluar && !keluar.endsWith(';') && !keluar.endsWith('{')) keluarkan(';');
        seb = { t: 'tanda', v: ';', nl: 0 };
        sebKode = seb;
      }
    }
    if (tok.t === 'tanda' && tok.v === '(') tumpukanParen.push(!!tok.forParen);
    if (tok.t === 'tanda' && tok.v === ')') tumpukanParen.pop();
    dalamFor = tumpukanParen.filter(Boolean).length;
    // Buang titik koma yang tidak perlu: sebelum } dan di akhir file,
    // kecuali di dalam kepala for (for(;;) butuh kedua titik komanya).
    if (tok.t === 'tanda' && tok.v === ';' && dalamFor === 0) {
      let berikut = null;
      for (let k = idx + 1; k < token.length; k++) {
        if (token[k].t !== 'komen' || (token[k].blok && token[k].v.startsWith('/*!'))) { berikut = token[k]; break; }
      }
      if (!berikut || (berikut.t === 'tanda' && berikut.v === '}')) continue;
      if (seb && seb.v === ';') continue;
      if (seb && seb.v === '{') continue;
    }
    if (seb && butuhSpasi(seb, tok)) keluarkan(' ');
    keluarkan(tok.v);
    seb = tok;
    sebKode = tok;
  }
  const hasil = keluar.trim();
  return { kode: hasil, sebelum, sesudah: hasil.length, hemat: sebelum - hasil.length, hematPersen: sebelum ? Math.round(((sebelum - hasil.length) / sebelum) * 100) : 0 };
}

// Cek sintaks tanpa menjalankan kode (new Function hanya mengompilasi).
// Kode modul (import/export) tidak bisa dicek langsung: pernyataan
// import/export satu baris dihapus dulu untuk cek best-effort, dan bila
// tetap gagal, hasilnya ditandai modul supaya pemanggil tahu ceknya
// tidak tuntas (bukan berarti kodenya salah).

export const meta = { id: 'minify-javascript', name: 'Minify JavaScript', cat: 'developer', icon: '🗜️', desc: 'Perkecil kode JavaScript jadi satu baris padat untuk file .min.js yang lebih ringan. Komentar dibuang, spasi dirapatkan, arti kode dijaga.', keywords: 'javascript,minify,js,perkecil,kompres,kode,min.js,optimasi', since: '6.19.0' };

export function render(root) {
  const inp = T.ta(10, 'Tempel kode JavaScript di sini…');
  inp.style.fontFamily = 'ui-monospace,monospace';
  inp.spellcheck = false;
  const outp = T.ta(10, 'Hasil minify muncul di sini…');
  outp.style.fontFamily = 'ui-monospace,monospace';
  outp.readOnly = true;
  const status = T.out();
  let lastResult = '';

  const jalan = () => {
    const raw = inp.value;
    if (!raw.trim()) { T.show(status, errBox('Tempel dulu kode JavaScript-nya.')); return; }
    const cek = cekSintaksJs(raw);
    if (!cek.valid && !cek.modul) { T.show(status, errBox('Kodenya tidak valid, jadi tidak bisa diminify: ' + cek.pesan)); return; }
    const r = minifyJs(raw);
    lastResult = r.kode;
    outp.value = r.kode;
    const cekHasil = cekSintaksJs(r.kode);
    T.show(status,
      '<div class="kv"><span class="k">Ukuran awal</span><span class="v">' + T.fmt(r.sebelum) + ' karakter</span></div>' +
      '<div class="kv"><span class="k">Ukuran akhir</span><span class="v">' + T.fmt(r.sesudah) + ' karakter</span></div>' +
      '<div class="kv"><span class="k">Berhasil dipangkas</span><span class="v big">' + T.fmt(r.hemat) + ' karakter (' + r.hematPersen + '%)</span></div>' +
      (cekHasil.valid ? '<p class="hint">Hasil sudah dicek dan sintaksnya tetap valid.</p>' : (cekHasil.modul ? '<p class="hint">Kode modul (import/export) tidak bisa dicek penuh di sini. Hasil minify tetap dibuat, cek lagi dengan bundler kamu.</p>' : '<p class="hint">Perhatian: hasil minify gagal dicek sintaksnya (' + T.esc(cekHasil.pesan) + '). Jangan dipakai dulu.</p>')));
  };

  root.appendChild(T.field('Kode JavaScript', inp));
  root.appendChild(T.row(T.btn('Minify', jalan, true), T.copyBtn(() => lastResult, 'Salin Hasil'), T.dlBtn('script.min.js', () => lastResult, 'text/javascript;charset=utf-8', 'Unduh .min.js')));
  root.appendChild(status);
  root.appendChild(T.field('Hasil', outp));
  root.appendChild(T.el('<div class="hint" style="margin-top:12px">Minifier ini ringan dan dibuat sendiri, bukan Terser. Komentar lisensi yang diawali /*! dipertahankan. Isi ${} di dalam template literal tidak diminify, dan sintaks di luar standar JavaScript (misalnya decorator) tidak dijamin. Untuk kode produksi yang besar, pakai Terser atau esbuild.</div>'));
}
