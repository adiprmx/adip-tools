import { h as T, fileInput, tabs, errBox } from '../../core.js';

// ---------- Util murni tab Banding (tanpa DOM, bisa diuji dari Node) ----------

// Batas baris per file agar tabel LCS tetap ringan (2000 x 2000 sel).
const BANDING_MAX_BARIS = 2000;

// Normalisasi teks hasil ekstrak: potong spasi tiap baris, buang baris kosong.
function normalisasiBaris(teks) {
  return String(teks || '').split('\n').map((s) => s.trim()).filter(Boolean);
}

// Diff per baris dengan LCS (longest common subsequence).
// Hasil: { baris: [{ t: '=' | '-' | '+', s: teks }], terpotong: bool }
// '=' baris sama, '-' hanya ada di A, '+' hanya ada di B.
// Bila salah satu sisi melebihi BANDING_MAX_BARIS, sisanya dipotong
// dan terpotong bernilai true (UI wajib menampilkannya dengan jujur).
function diffBaris(a, b) {
  let terpotong = false;
  let A = a, B = b;
  if (A.length > BANDING_MAX_BARIS) { A = A.slice(0, BANDING_MAX_BARIS); terpotong = true; }
  if (B.length > BANDING_MAX_BARIS) { B = B.slice(0, BANDING_MAX_BARIS); terpotong = true; }
  const n = A.length, m = B.length;
  const w = m + 1;
  // dp[i][j] = panjang LCS A[i..] dengan B[j..]. Uint16 cukup karena
  // nilai maksimalnya BANDING_MAX_BARIS (2000).
  const dp = new Uint16Array((n + 1) * w);
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i * w + j] = A[i] === B[j]
        ? dp[(i + 1) * w + j + 1] + 1
        : Math.max(dp[(i + 1) * w + j], dp[i * w + j + 1]);
    }
  }
  const baris = [];
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (A[i] === B[j]) { baris.push({ t: '=', s: A[i] }); i++; j++; }
    else if (dp[(i + 1) * w + j] >= dp[i * w + j + 1]) { baris.push({ t: '-', s: A[i] }); i++; }
    else { baris.push({ t: '+', s: B[j] }); j++; }
  }
  while (i < n) { baris.push({ t: '-', s: A[i] }); i++; }
  while (j < m) { baris.push({ t: '+', s: B[j] }); j++; }
  return { baris, terpotong };
}

export const meta = {"id": "pdflab", "name": "PDF Lab", "cat": "produktivitas", "icon": "🧪", "desc": "Toolkit PDF lokal: gabung, pisah, watermark & lainnya.", "keywords": "pdf,merge,split,watermark,metadata,form,gabung,kompres,compress"};
export { diffBaris, normalisasiBaris };

// ---------- Redact sejati: hapus teks dari content stream ----------
// Cara kerja: baca content stream halaman (decode Flate bila perlu), jalankan
// interpreter mini untuk melacak posisi tiap potongan teks (matriks teks +
// matriks CTM), lalu ganti byte string yang beririsan dengan kotak redact
// menjadi spasi (panjang byte tetap, jadi layout tidak berubah). Teks yang
// sudah diganti spasi tidak bisa dibaca lagi oleh alat ekstrak teks mana pun.
//
// Batasan jujur: teks di dalam Form XObject, anotasi, dan metadata tidak
// disentuh; stream dengan DecodeParms (predictor) dilewati; halaman yang
// diputar (rotation != 0) tidak diproses (koordinatnya tidak bisa diandalkan).

function kaliMatriks(m1, m2) {
  // [a b c d e f] × [a b c d e f] (PDF: titik dikali matriks kanan dulu)
  return [
    m1[0] * m2[0] + m1[1] * m2[2],
    m1[0] * m2[1] + m1[1] * m2[3],
    m1[2] * m2[0] + m1[3] * m2[2],
    m1[2] * m2[1] + m1[3] * m2[3],
    m1[4] * m2[0] + m1[5] * m2[2] + m2[4],
    m1[4] * m2[1] + m1[5] * m2[3] + m2[5],
  ];
}
function terapkanMatriks(m, x, y) {
  return [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
}
const MATRIKS_IDENTITAS = [1, 0, 0, 1, 0, 0];

// Baca satu token dari string latin1 content stream. Kembalikan
// {token, next} atau null bila habis. Token string menyimpan rentang byte
// isinya (untuk di-blank-kan nanti).
function bacaTokenStream(s, i) {
  const n = s.length;
  const isWS = (c) => c === ' ' || c === '\n' || c === '\r' || c === '\t' || c === '\f' || c === '\0';
  const isDelim = (c) => c === '(' || c === ')' || c === '<' || c === '>' || c === '[' || c === ']' || c === '{' || c === '}' || c === '/' || c === '%';
  while (i < n) {
    const c = s[i];
    if (isWS(c)) { i++; continue; }
    if (c === '%') { while (i < n && s[i] !== '\n' && s[i] !== '\r') i++; continue; }
    break;
  }
  if (i >= n) return null;
  const c = s[i];
  if (c === '(') {
    let j = i + 1, depth = 1;
    while (j < n && depth > 0) {
      const ch = s[j];
      if (ch === '\\') { j += 2; continue; }
      if (ch === '(') depth++;
      else if (ch === ')') depth--;
      j++;
    }
    return { token: { t: 'str', awal: i, akhir: j, isiAwal: i + 1, isiAkhir: j - 1 }, next: j };
  }
  if (c === '<') {
    if (s[i + 1] === '<') {
      let j = i + 2, depth = 1;
      while (j < n && depth > 0) {
        if (s[j] === '<' && s[j + 1] === '<') { depth++; j += 2; continue; }
        if (s[j] === '>' && s[j + 1] === '>') { depth--; j += 2; continue; }
        j++;
      }
      return { token: { t: 'dict', awal: i, akhir: j }, next: j };
    }
    let j = i + 1;
    while (j < n && s[j] !== '>') j++;
    return { token: { t: 'hex', awal: i, akhir: j + 1, isiAwal: i + 1, isiAkhir: j }, next: j + 1 };
  }
  if (c === '[') {
    const elems = [];
    let j = i + 1;
    for (;;) {
      const r = bacaTokenStream(s, j);
      if (!r) return { token: { t: 'arr', awal: i, akhir: n, elems }, next: n };
      if (r.token.t === 'tutup') return { token: { t: 'arr', awal: i, akhir: r.next, elems }, next: r.next };
      elems.push(r.token);
      j = r.next;
    }
  }
  if (c === ']') return { token: { t: 'tutup' }, next: i + 1 };
  if (c === '/') {
    let j = i + 1;
    while (j < n && !isWS(s[j]) && !isDelim(s[j])) j++;
    return { token: { t: 'nama', v: s.slice(i + 1, j) }, next: j };
  }
  // Angka atau operator (kata).
  let j = i;
  while (j < n && !isWS(s[j]) && !isDelim(s[j])) j++;
  const kata = s.slice(i, j);
  if (/^[+-]?(\d+\.?\d*|\.\d+)$/.test(kata)) return { token: { t: 'num', v: parseFloat(kata) }, next: j };
  return { token: { t: 'op', v: kata }, next: j };
}

// Urai content stream jadi daftar {op, args}. Token tak dikenal diabaikan.
function uraiContentStream(s) {
  const ops = [];
  const stack = [];
  let i = 0;
  for (;;) {
    const r = bacaTokenStream(s, i);
    if (!r) break;
    i = r.next;
    const tk = r.token;
    if (tk.t === 'op') {
      ops.push({ op: tk.v, args: stack.splice(0) });
    } else if (tk.t !== 'tutup') stack.push(tk);
  }
  return ops;
}

// Panjang karakter (perkiraan jumlah glyph) dari token string.
// String UTF-16BE (awalan FE FF) dihitung per 2 byte.
function panjangGlyph(token, s) {
  const isi = s.slice(token.isiAwal, token.isiAkhir);
  if (token.t === 'hex') {
    const hex = isi.replace(/\s/g, '');
    if (hex.length >= 4 && hex.slice(0, 4).toLowerCase() === 'feff') return Math.max(0, Math.floor(hex.length / 4) - 1);
    return Math.floor(hex.length / 2);
  }
  // Literal: hitung byte isi, escape dihitung 1 glyph.
  let n = 0;
  for (let i = 0; i < isi.length; i++) {
    if (isi[i] === '\\') { i++; n++; continue; }
    n++;
  }
  if (n >= 2 && isi.charCodeAt(0) === 0xFE && isi.charCodeAt(1) === 0xFF) return Math.max(0, Math.floor(n / 2) - 1);
  return n;
}

// Blank-kan isi token string menjadi spasi (panjang byte tetap).
// UTF-16BE: tiap unit 2 byte jadi 0x00 0x20.
function blankToken(out, token, s) {
  const isi = s.slice(token.isiAwal, token.isiAkhir);
  if (token.t === 'hex') {
    const hex = isi.replace(/\s/g, '');
    const is16 = hex.length >= 4 && hex.slice(0, 4).toLowerCase() === 'feff';
    let idx = 0; // indeks digit hex (spasi diabaikan)
    for (let p = token.isiAwal; p < token.isiAkhir; p++) {
      const ch = s[p];
      if (ch === ' ' || ch === '\n' || ch === '\r' || ch === '\t' || ch === '\f' || ch === '\0') continue;
      if (is16 && idx < 4) { idx++; continue; } // BOM dibiarkan
      if (is16) {
        // Tiap unit 4 digit jadi "0020".
        const pos = (idx - 4) % 4;
        out[p] = pos === 2 ? 50 : 48; // '2' di posisi ke-2, '0' sisanya
      } else {
        // Tiap pasang digit jadi "20" (= 0x20 spasi).
        out[p] = idx % 2 === 0 ? 50 : 48;
      }
      idx++;
    }
    return;
  }
  const is16 = isi.length >= 2 && isi.charCodeAt(0) === 0xFE && isi.charCodeAt(1) === 0xFF;
  for (let p = token.isiAwal; p < token.isiAkhir; p++) {
    const ch = s[p];
    if (ch === '\\') { out[p] = 92; continue; } // backslash dipertahankan (escape tetap valid)
    if (is16) {
      const rel = p - token.isiAwal;
      if (rel < 2) continue; // BOM dibiarkan
      out[p] = rel % 2 === 0 ? 0 : 0x20;
    } else out[p] = 0x20;
  }
}

// Uji irisan dua kotak [x0,y0,x1,y1].
function kotakBersinggungan(a, b) {
  return a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1];
}

// Hapus teks dari SATU content stream (sudah ter-decode, latin1).
// rects: [{x,y,w,h}] dalam poin PDF (asal kiri-bawah).
// Kembalikan {teks, dihapus, total} — teks = stream baru (latin1).
export function redactStreamTeks(streamLatin1, rects) {
  const s = streamLatin1;
  const ops = uraiContentStream(s);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i) & 0xFF;
  let ctm = MATRIKS_IDENTITAS.slice();
  const tumpukanCtm = [];
  let dalamTeks = false;
  let tm = MATRIKS_IDENTITAS.slice();
  let tlm = MATRIKS_IDENTITAS.slice();
  let ukuranFont = 12, leading = 0, spasiKar = 0, spasiKata = 0, skalaH = 100, naik = 0;
  let dihapus = 0, total = 0;
  const kotak = rects.map((r) => [r.x, r.y, r.x + r.w, r.y + r.h]);

  const posisiTeks = () => {
    const m = kaliMatriks(tm, ctm);
    return { m, asal: terapkanMatriks(m, 0, naik) };
  };
  const geserTm = (tx, ty) => {
    const geser = [1, 0, 0, 1, tx, ty];
    tlm = kaliMatriks(geser, tlm);
    tm = tlm.slice();
  };
  // Satu potongan teks (Tj/TJ/'/"): perkirakan kotaknya, blank-kan bila
  // beririsan dengan kotak redact, lalu majukan matriks teks.
  const tampilkan = (tokenStr) => {
    total++;
    const n = panjangGlyph(tokenStr, s);
    if (!n) return;
    const { m, asal } = posisiTeks();
    const wEm = n * 0.55 * (ukuranFont * skalaH / 100);
    const p1 = terapkanMatriks(m, wEm, naik);
    const p2 = terapkanMatriks(m, 0, naik + ukuranFont);
    const p3 = terapkanMatriks(m, wEm, naik + ukuranFont);
    const xs = [asal[0], p1[0], p2[0], p3[0]], ys = [asal[1], p1[1], p2[1], p3[1]];
    const tol = ukuranFont * 0.5;
    const box = [Math.min(...xs) - tol, Math.min(...ys) - ukuranFont * 0.25, Math.max(...xs) + tol, Math.max(...ys) + ukuranFont * 0.25];
    if (kotak.some((r) => kotakBersinggungan(box, r))) {
      blankToken(out, tokenStr, s);
      dihapus++;
    }
    // Majukan matriks teks sejauh lebar potongan (dalam satuan em).
    const txEm = wEm / (ukuranFont * skalaH / 100) + (n * spasiKar) / (ukuranFont || 1);
    tm = kaliMatriks([1, 0, 0, 1, txEm, 0], tm);
  };

  for (const { op, args } of ops) {
    const num = (i, def) => (args[i] && args[i].t === 'num' ? args[i].v : def);
    switch (op) {
      case 'q': tumpukanCtm.push(ctm.slice()); break;
      case 'Q': if (tumpukanCtm.length) ctm = tumpukanCtm.pop(); break;
      case 'cm':
        if (args.length >= 6) ctm = kaliMatriks([num(0, 1), num(1, 0), num(2, 0), num(3, 1), num(4, 0), num(5, 0)], ctm);
        break;
      case 'BT': dalamTeks = true; tm = MATRIKS_IDENTITAS.slice(); tlm = MATRIKS_IDENTITAS.slice(); break;
      case 'ET': dalamTeks = false; break;
      case 'Tm':
        if (args.length >= 6) { tm = [num(0, 1), num(1, 0), num(2, 0), num(3, 1), num(4, 0), num(5, 0)]; tlm = tm.slice(); }
        break;
      case 'Td': geserTm(num(0, 0), num(1, 0)); break;
      case 'TD': leading = -num(1, 0); geserTm(num(0, 0), num(1, 0)); break;
      case 'T*': geserTm(0, -leading); break;
      case 'Tf': ukuranFont = num(1, 12); break;
      case 'TL': leading = num(0, 0); break;
      case 'Tc': spasiKar = num(0, 0); break;
      case 'Tw': spasiKata = num(0, 0); break;
      case 'Tz': skalaH = num(0, 100); break;
      case 'Ts': naik = num(0, 0); break;
      case 'Tj': {
        const t = args[0];
        if (dalamTeks && t && (t.t === 'str' || t.t === 'hex')) tampilkan(t);
        break;
      }
      case 'TJ': {
        const arr = args[0];
        if (dalamTeks && arr && arr.t === 'arr') {
          for (const el of arr.elems) {
            if (el.t === 'str' || el.t === 'hex') tampilkan(el);
            else if (el.t === 'num') {
              // Angka kerning: geser mundur sejauh num/1000 em.
              tm = kaliMatriks([1, 0, 0, 1, -el.v / 1000, 0], tm);
            }
          }
        }
        break;
      }
      case "'": {
        const t = args[0];
        if (dalamTeks && t && (t.t === 'str' || t.t === 'hex')) { geserTm(0, -leading); tampilkan(t); }
        break;
      }
      case '"': {
        const t = args[2];
        spasiKata = num(0, 0); spasiKar = num(1, 0);
        if (dalamTeks && t && (t.t === 'str' || t.t === 'hex')) { geserTm(0, -leading); tampilkan(t); }
        break;
      }
      default: break;
    }
  }
  let teks = '';
  for (let i = 0; i < out.length; i++) teks += String.fromCharCode(out[i]);
  return { teks, dihapus, total };
}

// Hapus teks dari SEMUA content stream satu halaman pdf-lib.
// Kembalikan {dihapus, total, dilewati} — dilewati = stream yang tidak bisa diproses.
export async function redactHalamanPdf(PDFLib, doc, idxHalaman, rects) {
  const page = doc.getPage(idxHalaman);
  if (page.getRotation().angle % 180 !== 0) return { dihapus: 0, total: 0, dilewati: 1, diputar: true };
  const contents = page.node.get(PDFLib.PDFName.of('Contents'));
  if (!contents) return { dihapus: 0, total: 0, dilewati: 0 };
  const refs = [];
  const resolved = doc.context.lookup(contents);
  if (resolved instanceof PDFLib.PDFArray) {
    for (let i = 0; i < resolved.size(); i++) refs.push(resolved.get(i));
  } else refs.push(contents);
  let dihapus = 0, total = 0, dilewati = 0;
  const bisaFlate = typeof DecompressionStream !== 'undefined' && typeof CompressionStream !== 'undefined';
  for (const ref of refs) {
    try {
      const stream = doc.context.lookup(ref);
      if (!(stream instanceof PDFLib.PDFRawStream)) { dilewati++; continue; }
      const dict = stream.dict;
      if (dict.get(PDFLib.PDFName.of('DecodeParms'))) { dilewati++; continue; }
      const filter = dict.get(PDFLib.PDFName.of('Filter'));
      const fStr = filter ? filter.toString() : '';
      const isFlate = /FlateDecode/.test(fStr);
      const isArrayFilter = filter instanceof PDFLib.PDFArray;
      if (isArrayFilter || (filter && !isFlate)) { dilewati++; continue; }
      let raw = stream.getContents();
      let latin1;
      if (isFlate) {
        if (!bisaFlate) { dilewati++; continue; }
        const ds = new DecompressionStream('deflate');
        const dec = await new Response(new Blob([raw]).stream().pipeThrough(ds)).arrayBuffer();
        const b = new Uint8Array(dec);
        latin1 = '';
        for (let i = 0; i < b.length; i++) latin1 += String.fromCharCode(b[i]);
      } else {
        latin1 = '';
        for (let i = 0; i < raw.length; i++) latin1 += String.fromCharCode(raw[i]);
      }
      const hasil = redactStreamTeks(latin1, rects);
      dihapus += hasil.dihapus;
      total += hasil.total;
      if (!hasil.dihapus) continue;
      const baru = new Uint8Array(hasil.teks.length);
      for (let i = 0; i < hasil.teks.length; i++) baru[i] = hasil.teks.charCodeAt(i) & 0xFF;
      let simpan = baru;
      if (isFlate) {
        const cs = new CompressionStream('deflate');
        simpan = new Uint8Array(await new Response(new Blob([baru]).stream().pipeThrough(cs)).arrayBuffer());
      }
      const dictBaru = dict.clone ? dict.clone() : dict;
      dictBaru.set(PDFLib.PDFName.of('Filter'), PDFLib.PDFName.of(isFlate ? 'FlateDecode' : 'FlateDecode'));
      try { dictBaru.delete(PDFLib.PDFName.of('DecodeParms')); } catch (e) {}
      // Bila stream awalnya tidak terkompres, simpan terkompres (lebih kecil & konsisten).
      if (!isFlate) {
        const cs = new CompressionStream('deflate');
        simpan = new Uint8Array(await new Response(new Blob([baru]).stream().pipeThrough(cs)).arrayBuffer());
      }
      doc.context.assign(ref, PDFLib.PDFRawStream.of(dictBaru, simpan));
    } catch (e) { dilewati++; }
  }
  return { dihapus, total, dilewati };
}

export function render(root) {

  const PDFLIB_CDN = 'https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js';
  const PDFJS_CDN = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js';
  const PDFJS_WORKER = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';

  let pdfLibOk = null, pdfLibLoading = false;
  const ensurePdfLib = () => {
    if (pdfLibOk !== null) return Promise.resolve(pdfLibOk);
    if (pdfLibLoading) return new Promise((res) => { const t = setInterval(() => { if (pdfLibOk !== null) { clearInterval(t); res(pdfLibOk); } }, 300); });
    pdfLibLoading = true;
    return T.loadScript(PDFLIB_CDN).then((ok) => {
      pdfLibOk = ok && !!window.PDFLib;
      return pdfLibOk;
    });
  };
  let pdfJsOk = null, pdfJsLoading = false;
  const ensurePdfJs = () => {
    if (pdfJsOk !== null) return Promise.resolve(pdfJsOk);
    if (pdfJsLoading) return new Promise((res) => { const t = setInterval(() => { if (pdfJsOk !== null) { clearInterval(t); res(pdfJsOk); } }, 300); });
    pdfJsLoading = true;
    return T.loadScript(PDFJS_CDN).then((ok) => {
      pdfJsOk = ok && !!window.pdfjsLib;
      if (pdfJsOk) window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
      return pdfJsOk;
    });
  };

  const JSZIP_CDN = 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js';
  let jsZipOk = null, jsZipLoading = false;
  const ensureJsZip = () => {
    if (jsZipOk !== null) return Promise.resolve(jsZipOk);
    if (jsZipLoading) return new Promise((res) => { const t = setInterval(() => { if (jsZipOk !== null) { clearInterval(t); res(jsZipOk); } }, 300); });
    jsZipLoading = true;
    return T.loadScript(JSZIP_CDN).then((ok) => {
      jsZipOk = ok && !!window.JSZip;
      return jsZipOk;
    });
  };

  // Pengubah HEIC & pembaca TIFF untuk tab Gambar->PDF (browser sendiri
  // tidak bisa membaca keduanya di sebagian besar perangkat).
  const HEIC_CDN = 'https://cdn.jsdelivr.net/npm/heic2any@0.0.4/dist/heic2any.min.js';
  const UTIF_CDN = 'https://cdn.jsdelivr.net/npm/utif@3.1.0/UTIF.js';
  let heicSiap = null, utifSiap = null;
  const pastHeic = () => {
    if (!heicSiap) heicSiap = T.loadScript(HEIC_CDN).then((ok) => ok && typeof window.heic2any === 'function');
    return heicSiap;
  };
  const pastUtif = () => {
    if (!utifSiap) utifSiap = T.loadScript(UTIF_CDN).then((ok) => ok && !!window.UTIF);
    return utifSiap;
  };

  // Kunci localStorage bersama tool Tanda Tangan (gambar PNG terakhir).
  const TTD_KEY = 'adip-ttd-png';

  /* ---- helper bersama ---- */
  const fmtSize = (n) => n < 1024 ? n + ' B' : n < 1048576 ? (n / 1024).toFixed(1) + ' KB' : (n / 1048576).toFixed(2) + ' MB';
  const mm2pt = (mm) => mm * 2.83465;
  // Angka desimal gaya Indonesia: koma dibaca sebagai titik.
  const parseNum = (v, def) => { const n = parseFloat(String(v == null ? '' : v).replace(',', '.')); return Number.isFinite(n) ? n : def; };
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  function dlBlob(blob, name) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 3000);
  }
  function dlText(text, name) { dlBlob(new Blob([text], { type: 'text/plain;charset=utf-8' }), name); }

  function toRoman(n) {
    if (!Number.isFinite(n) || n < 1) return String(n);
    const table = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
    let out = '', x = Math.floor(n);
    for (const [v, s] of table) { while (x >= v) { out += s; x -= v; } }
    return out.toLowerCase();
  }

  const loadPdfDoc = async (file) => window.PDFLib.PDFDocument.load(new Uint8Array(await file.arrayBuffer()), { ignoreEncryption: true });

  // Decode file gambar apa pun yang didukung browser (PNG/JPG/WEBP, HEIC/TIFF
  // di browser yang mendukung) jadi elemen Image.
  function decodeImageFile(file) {
    return new Promise((res, rej) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => { URL.revokeObjectURL(url); res(img); };
      img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('Gambar tidak bisa dibaca browser ini')); };
      img.src = url;
    });
  }
  function decodeImageBytes(bytes, mime) {
    return decodeImageFile(new Blob([bytes], { type: mime || 'image/jpeg' }));
  }
  function canvasToBlobP(canvas, type, q) {
    return new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error('Gagal mengodekan gambar'))), type, q));
  }
  function canvasToBytes(canvas, type, q) {
    return canvasToBlobP(canvas, type, q).then((b) => b.arrayBuffer()).then((ab) => new Uint8Array(ab));
  }

  // ---- Dekode gambar FlateDecode (PNG mentah di dalam PDF) jadi RGBA ----
  // Dukung DeviceRGB/DeviceGray/DeviceCMYK/Indexed 8-bit + predictor PNG/TIFF.
  // Kembalikan {data: Uint8ClampedArray RGBA, w, h} atau null bila tak didukung.
  async function decodeGambarFlate(L, doc, dict, raw) {
    const num = (nama) => {
      const v = doc.context.lookup(dict.get(L.PDFName.of(nama)));
      return v && typeof v.asNumber === 'function' ? v.asNumber() : null;
    };
    const w = num('Width'), h = num('Height'), bpc = num('BitsPerComponent');
    if (!w || !h || bpc !== 8 || w * h > 12000000) return null;
    const csRaw = doc.context.lookup(dict.get(L.PDFName.of('ColorSpace')));
    let cs = null, lookup = null, baseKomponen = 3;
    if (csRaw instanceof L.PDFName) cs = csRaw.toString();
    else if (csRaw instanceof L.PDFArray) {
      const n0 = doc.context.lookup(csRaw.get(0));
      if (n0 && n0.toString() === '/Indexed') {
        cs = '/Indexed';
        const base = doc.context.lookup(csRaw.get(1));
        const namaBase = base && base.toString ? base.toString() : '';
        baseKomponen = namaBase === '/DeviceGray' ? 1 : 3;
        const hivalObj = csRaw.get(2);
        const hival = hivalObj && typeof hivalObj.asNumber === 'function' ? hivalObj.asNumber() : 0;
        const lk = doc.context.lookup(csRaw.get(3));
        if (lk instanceof L.PDFRawStream) lookup = lk.getContents();
        else if (lk && typeof lk.toString === 'function') {
          const t = lk.toString();
          if (t[0] === '<') {
            const hex = t.replace(/[^0-9a-fA-F]/g, '');
            lookup = new Uint8Array(hex.length / 2);
            for (let i = 0; i < lookup.length; i++) lookup[i] = parseInt(hex.substr(i * 2, 2), 16);
          }
        }
        if (!lookup || lookup.length < (hival + 1) * baseKomponen) return null;
      }
    }
    if (cs !== '/DeviceRGB' && cs !== '/DeviceGray' && cs !== '/DeviceCMYK' && cs !== '/Indexed') return null;
    const komponen = cs === '/DeviceRGB' ? 3 : cs === '/DeviceCMYK' ? 4 : 1;
    // Dekompres Flate.
    let flat;
    try {
      const ds = new DecompressionStream('deflate');
      flat = new Uint8Array(await new Response(new Blob([raw]).stream().pipeThrough(ds)).arrayBuffer());
    } catch (e) { return null; }
    // Predictor (DecodeParms): 1=tidak ada, 2=TIFF, 10-15=PNG.
    let predictor = 1, colors = komponen, columns = w;
    const parmsRaw = doc.context.lookup(dict.get(L.PDFName.of('DecodeParms')));
    const parms = parmsRaw instanceof L.PDFArray ? doc.context.lookup(parmsRaw.get(0)) : parmsRaw;
    if (parms && typeof parms.get === 'function') {
      const pv = doc.context.lookup(parms.get(L.PDFName.of('Predictor')));
      if (pv && typeof pv.asNumber === 'function') predictor = pv.asNumber();
      const cv = doc.context.lookup(parms.get(L.PDFName.of('Colors')));
      if (cv && typeof cv.asNumber === 'function') colors = cv.asNumber();
      const colv = doc.context.lookup(parms.get(L.PDFName.of('Columns')));
      if (colv && typeof colv.asNumber === 'function') columns = colv.asNumber();
    }
    if (columns !== w) return null;
    const barisByte = colors * columns;
    let px;
    if (predictor === 1) {
      if (flat.length < barisByte * h) return null;
      px = flat.subarray(0, barisByte * h);
    } else if (predictor === 2) {
      if (flat.length < barisByte * h) return null;
      px = new Uint8Array(barisByte * h);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < barisByte; x++) {
          const kiri = x >= colors ? px[y * barisByte + x - colors] : 0;
          px[y * barisByte + x] = (flat[y * barisByte + x] + kiri) & 0xFF;
        }
      }
    } else if (predictor >= 10 && predictor <= 15) {
      const bpp = colors;
      if (flat.length < (barisByte + 1) * h) return null;
      px = new Uint8Array(barisByte * h);
      const paeth = (a, b, c) => {
        const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
        return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      };
      for (let y = 0; y < h; y++) {
        const f = flat[y * (barisByte + 1)];
        const src = flat.subarray(y * (barisByte + 1) + 1, (y + 1) * (barisByte + 1));
        const dst = px.subarray(y * barisByte, (y + 1) * barisByte);
        const atas = y > 0 ? px.subarray((y - 1) * barisByte, y * barisByte) : null;
        for (let x = 0; x < barisByte; x++) {
          const kiri = x >= bpp ? dst[x - bpp] : 0;
          const at = atas ? atas[x] : 0;
          const kiriAtas = atas && x >= bpp ? atas[x - bpp] : 0;
          let v = src[x];
          if (f === 1) v = (v + kiri) & 0xFF;
          else if (f === 2) v = (v + at) & 0xFF;
          else if (f === 3) v = (v + Math.floor((kiri + at) / 2)) & 0xFF;
          else if (f === 4) v = (v + paeth(kiri, at, kiriAtas)) & 0xFF;
          dst[x] = v;
        }
      }
    } else return null;
    // Ke RGBA.
    const rgba = new Uint8ClampedArray(w * h * 4);
    for (let i = 0; i < w * h; i++) {
      const o = i * 4;
      if (cs === '/DeviceRGB') {
        rgba[o] = px[i * 3]; rgba[o + 1] = px[i * 3 + 1]; rgba[o + 2] = px[i * 3 + 2]; rgba[o + 3] = 255;
      } else if (cs === '/DeviceGray') {
        const g = px[i];
        rgba[o] = g; rgba[o + 1] = g; rgba[o + 2] = g; rgba[o + 3] = 255;
      } else if (cs === '/DeviceCMYK') {
        const c = px[i * 4] / 255, m = px[i * 4 + 1] / 255, y2 = px[i * 4 + 2] / 255, k = px[i * 4 + 3] / 255;
        rgba[o] = Math.round(255 * (1 - c) * (1 - k));
        rgba[o + 1] = Math.round(255 * (1 - m) * (1 - k));
        rgba[o + 2] = Math.round(255 * (1 - y2) * (1 - k));
        rgba[o + 3] = 255;
      } else {
        const idx = px[i] * baseKomponen;
        if (baseKomponen === 1) {
          const g = lookup[idx] || 0;
          rgba[o] = g; rgba[o + 1] = g; rgba[o + 2] = g; rgba[o + 3] = 255;
        } else {
          rgba[o] = lookup[idx] || 0; rgba[o + 1] = lookup[idx + 1] || 0; rgba[o + 2] = lookup[idx + 2] || 0; rgba[o + 3] = 255;
        }
      }
    }
    return { data: rgba, w, h };
  }

  // Kompres Sejati: kecilkan gambar yang tertanam di PDF tanpa menyentuh
  // teks, jadi teks tetap bisa dipilih. Mendukung gambar JPEG (termasuk CMYK,
  // diubah jadi RGB) dan gambar FlateDecode (RGB/Gray/CMYK/Indexed 8-bit).
  // Gambar 1-bit/CCITT dan yang tidak bisa didekode dilewati apa adanya.
  // Mengembalikan statistik pengerjaan.
  async function trueCompressDoc(doc, quality, scale, onStep) {
    const L = window.PDFLib;
    const stats = { total: 0, replaced: 0, skipped: 0, nonJpeg: 0 };
    const jobs = [];
    for (const [ref, obj] of doc.context.indirectObjects.entries()) {
      if (!(obj instanceof L.PDFRawStream)) continue;
      const dict = obj.dict;
      const subtype = dict.get(L.PDFName.of('Subtype'));
      if (!subtype || subtype.toString() !== '/Image') continue;
      stats.total++;
      const filter = dict.get(L.PDFName.of('Filter'));
      const fStr = filter ? filter.toString() : '';
      const isDct = /DCTDecode/.test(fStr) && !(filter instanceof L.PDFArray);
      const isFlate = /FlateDecode/.test(fStr) && !(filter instanceof L.PDFArray);
      if (!isDct && !isFlate) { stats.skipped++; continue; }
      jobs.push({ ref, dict, obj, jenis: isDct ? 'dct' : 'flate' });
    }
    for (let i = 0; i < jobs.length; i++) {
      const { ref, dict, obj, jenis } = jobs[i];
      if (onStep) onStep(i + 1, jobs.length);
      try {
        const raw = obj.getContents();
        let c;
        if (jenis === 'dct') {
          // Browser bisa mendekode JPEG CMYK menjadi RGB di canvas.
          const img = await decodeImageBytes(raw, 'image/jpeg');
          const w = Math.max(1, Math.round(img.naturalWidth * scale));
          const h = Math.max(1, Math.round(img.naturalHeight * scale));
          c = document.createElement('canvas');
          c.width = w; c.height = h;
          const cx = c.getContext('2d');
          cx.fillStyle = '#ffffff'; cx.fillRect(0, 0, w, h);
          cx.drawImage(img, 0, 0, w, h);
        } else {
          const dec = await decodeGambarFlate(L, doc, dict, raw);
          if (!dec) { stats.skipped++; continue; }
          const w = Math.max(1, Math.round(dec.w * scale));
          const h = Math.max(1, Math.round(dec.h * scale));
          const sumber = document.createElement('canvas');
          sumber.width = dec.w; sumber.height = dec.h;
          sumber.getContext('2d').putImageData(new ImageData(dec.data, dec.w, dec.h), 0, 0);
          c = document.createElement('canvas');
          c.width = w; c.height = h;
          const cx = c.getContext('2d');
          cx.fillStyle = '#ffffff'; cx.fillRect(0, 0, w, h);
          cx.drawImage(sumber, 0, 0, w, h);
        }
        const small = await canvasToBytes(c, 'image/jpeg', quality);
        if (small.length < raw.length) {
          dict.set(L.PDFName.of('Width'), L.PDFNumber.of(c.width));
          dict.set(L.PDFName.of('Height'), L.PDFNumber.of(c.height));
          dict.set(L.PDFName.of('ColorSpace'), L.PDFName.of('DeviceRGB'));
          dict.set(L.PDFName.of('BitsPerComponent'), L.PDFNumber.of(8));
          dict.set(L.PDFName.of('Filter'), L.PDFName.of('DCTDecode'));
          try { dict.delete(L.PDFName.of('DecodeParms')); } catch (e) {}
          try { dict.delete(L.PDFName.of('SMaskInData')); } catch (e) {}
          doc.context.assign(ref, L.PDFRawStream.of(dict, small));
          stats.replaced++;
          if (jenis === 'flate') stats.nonJpeg++;
        } else stats.skipped++;
      } catch (e) { stats.skipped++; }
    }
    return stats;
  }

  const status = T.out();
  const needLib = async () => {
    const ok = await ensurePdfLib();
    if (!ok) T.show(status, errBox('Gagal memuat pustaka PDF dari CDN. Cek koneksi internet lalu coba lagi.'));
    return ok;
  };

  function dlPdf(bytes, name) {
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 3000);
  }

  // "1-3,5; 6-10" -> [[1,2,3,5],[6,7,8,9,10]] ; ";" = file baru
  function parseGroups(str, maxPage) {
    const groups = String(str).split(';').map((s) => s.trim()).filter(Boolean);
    if (!groups.length) throw new Error('Rentang kosong. Contoh: 1-3,5; 6-10');
    return groups.map((g) => {
      const pages = new Set();
      for (const part of g.split(',')) {
        const p = part.trim();
        const m = /^(\d+)\s*-\s*(\d+)$/.exec(p);
        if (m) {
          let a = +m[1], b = +m[2];
          if (a > b) [a, b] = [b, a];
          // Jepit ke jumlah halaman SEBELUM loop: "1-100000000" pada PDF
          // 3 halaman dulu membangun Set 100 juta entri (freeze ~5 dtk)
          // lalu 99,999997%-nya langsung dibuang filter di bawah.
          a = Math.max(a, 1);
          b = Math.min(b, maxPage);
          if (a > maxPage) continue;
          for (let i = a; i <= b; i++) pages.add(i);
        } else if (/^\d+$/.test(p)) pages.add(+p);
        else throw new Error('Rentang tidak valid: "' + p + '"');
      }
      const arr = [...pages].filter((n) => n >= 1 && n <= maxPage).sort((x, y) => x - y);
      if (!arr.length) throw new Error('Rentang "' + g + '" tidak memuat halaman valid (1-' + maxPage + ').');
      return arr;
    });
  }
  // "1-3,5" atau "semua" -> [1,2,3,5]
  function parsePages(str, maxPage) {
    const s = String(str).trim().toLowerCase();
    if (!s || s === 'semua' || s === 'all') return Array.from({ length: maxPage }, (_, i) => i + 1);
    return parseGroups(s, maxPage)[0];
  }

  const fileName = (f) => (f && f.name ? f.name : 'file');

  /* ============ TAB 1: Atur (organize) ============ */
  const pOrg = T.el('<div></div>');
  {
    const fi = fileInput('application/pdf'); fi.style.margin = '6px 0';
    const box = T.out();
    const grid = T.el('<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:10px;margin:12px 0"></div>');
    let doc = null, srcBytes = null, order = [], rots = {};
    const renderGrid = () => {
      grid.innerHTML = '';
      order.forEach((p0, pos) => {
        const card = T.el('<div style="border:1px solid #ffffff20;border-radius:10px;padding:8px;text-align:center;background:#141210"></div>');
        const c = document.createElement('canvas');
        c.style.cssText = 'width:100%;height:auto;border-radius:6px;background:#fff';
        card.appendChild(c);
        const lbl = T.el('<div class="dim" style="font-size:12px;margin:6px 0">Hlm ' + (p0 + 1) + (rots[p0] ? ' · ↻' + rots[p0] + '°' : '') + '</div>');
        card.appendChild(lbl);
        const rowB = T.el('<div style="display:flex;gap:4px;justify-content:center;flex-wrap:wrap"></div>');
        const mk = (t, fn) => { const b = T.btn(t, fn); b.classList.add('small'); b.style.padding = '4px 8px'; rowB.appendChild(b); };
        mk('←', () => { if (pos > 0) { [order[pos - 1], order[pos]] = [order[pos], order[pos - 1]]; renderGrid(); } });
        mk('→', () => { if (pos < order.length - 1) { [order[pos + 1], order[pos]] = [order[pos], order[pos + 1]]; renderGrid(); } });
        mk('↻', () => { rots[p0] = ((rots[p0] || 0) + 90) % 360; renderGrid(); });
        mk('✕', () => { order.splice(pos, 1); renderGrid(); });
        card.appendChild(rowB);
        grid.appendChild(card);
        drawThumb(c, p0, rots[p0] || 0);
      });
    };
    const thumbCache = {};
    async function drawThumb(canvas, p0, rot) {
      try {
        const ok = await ensurePdfJs();
        if (!ok) { canvas.replaceWith(T.el('<div class="dim" style="padding:20px">Hlm ' + (p0 + 1) + '</div>')); return; }
        const key = p0 + ':' + rot;
        if (!thumbCache._doc) thumbCache._doc = await window.pdfjsLib.getDocument({ data: srcBytes.slice(0) }).promise;
        const page = await thumbCache._doc.getPage(p0 + 1);
        const vp = page.getViewport({ scale: 0.5, rotation: rot });
        canvas.width = vp.width; canvas.height = vp.height;
        await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;
      } catch (e) { /* biarkan kosong */ }
    }
    const bLoad = T.btn('Muat PDF', async () => {
      const f = fi.files && fi.files[0];
      if (!f) { T.show(box, errBox('Pilih dulu file PDF.')); return; }
      const ok = await needLib(); if (!ok) return;
      T.show(box, '<span class="dim">Membaca PDF…</span>');
      try {
        srcBytes = new Uint8Array(await f.arrayBuffer());
        doc = await window.PDFLib.PDFDocument.load(srcBytes, { ignoreEncryption: true });
        const n = doc.getPageCount();
        order = Array.from({ length: n }, (_, i) => i);
        rots = {}; thumbCache._doc = null;
        T.show(box, '<span class="ok">' + n + ' halaman dimuat. Atur urutan, rotasi, atau hapus halaman.</span>');
        renderGrid();
        bApply.hidden = false;
      } catch (e) { T.show(box, errBox('File PDF ini tidak bisa dibaca. Pastikan filenya tidak rusak dan benar-benar PDF, lalu coba lagi.')); }
    }, true);
    const bApply = T.btn('Terapkan & Unduh', async () => {
      if (!doc || !order.length) { T.show(box, errBox('Tidak ada halaman tersisa.')); return; }
      try {
        const out = await window.PDFLib.PDFDocument.create();
        for (const p0 of order) {
          const [pg] = await out.copyPages(doc, [p0]);
          const r = rots[p0] || 0;
          if (r) pg.setRotation(window.PDFLib.degrees((pg.getRotation().angle + r) % 360));
          out.addPage(pg);
        }
        dlPdf(await out.save(), 'pdf-diatur.pdf');
        T.show(box, '<span class="ok">PDF baru terunduh (' + order.length + ' halaman).</span>');
      } catch (e) { T.show(box, errBox('Tidak bisa menyimpan PDF yang sudah diatur. Coba lagi, atau muat ulang filenya.')); }
    });
    bApply.hidden = true;
    const bReset = T.btn('Reset', () => { if (doc) { order = Array.from({ length: doc.getPageCount() }, (_, i) => i); rots = {}; renderGrid(); } });
    bReset.classList.add('small');
    pOrg.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Urutkan ulang, putar, atau hapus halaman PDF.</p>'));
    pOrg.appendChild(fi);
    pOrg.appendChild(T.row(bLoad));
    pOrg.appendChild(box);
    pOrg.appendChild(grid);
    pOrg.appendChild(T.row(bApply, bReset));
  }

  /* ============ TAB 2: Gabung ============ */
  const pMerge = T.el('<div></div>');
  {
    const fi = fileInput('application/pdf'); fi.multiple = true; fi.style.margin = '6px 0';
    const box = T.out();
    const list = T.el('<div style="display:grid;gap:8px;margin:12px 0"></div>');
    let files = [];
    const renderList = () => {
      list.innerHTML = '';
      files.forEach((f, i) => {
        const row = T.el('<div style="border:1px solid #ffffff20;border-radius:10px;padding:10px 12px;display:flex;align-items:center;gap:10px;font-size:13px"></div>');
        row.appendChild(T.el('<b>' + (i + 1) + '.</b>'));
        const nm = T.el('<span style="flex:1;word-break:break-all;font-family:monospace">' + T.esc(fileName(f)) + '</span>');
        row.appendChild(nm);
        const mk = (t, fn) => { const b = T.btn(t, fn); b.classList.add('small'); b.style.padding = '4px 8px'; row.appendChild(b); };
        mk('↑', () => { if (i > 0) { [files[i - 1], files[i]] = [files[i], files[i - 1]]; renderList(); } });
        mk('↓', () => { if (i < files.length - 1) { [files[i + 1], files[i]] = [files[i], files[i + 1]]; renderList(); } });
        mk('✕', () => { files.splice(i, 1); renderList(); });
        list.appendChild(row);
      });
    };
    fi.addEventListener('change', () => { files = [...fi.files]; renderList(); });
    const bGo = T.btn('Gabungkan & Unduh', async () => {
      if (!files.length) { T.show(box, errBox('Pilih dulu file PDF (bisa lebih dari satu).')); return; }
      const ok = await needLib(); if (!ok) return;
      T.show(box, '<span class="dim">Menggabungkan ' + files.length + ' file…</span>');
      try {
        const out = await window.PDFLib.PDFDocument.create();
        let total = 0;
        for (const f of files) {
          const src = await window.PDFLib.PDFDocument.load(new Uint8Array(await f.arrayBuffer()), { ignoreEncryption: true });
          const idx = src.getPageIndices();
          const pages = await out.copyPages(src, idx);
          pages.forEach((p) => out.addPage(p));
          total += idx.length;
        }
        dlPdf(await out.save(), 'pdf-gabungan.pdf');
        T.show(box, '<span class="ok">Berhasil: ' + files.length + ' file → ' + total + ' halaman.</span>');
      } catch (e) { T.show(box, errBox('Tidak bisa menggabungkan file-file ini. Pastikan semuanya file PDF yang tidak rusak, lalu coba lagi.')); }
    }, true);
    pMerge.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Gabungkan beberapa PDF jadi satu, sesuai urutan.</p>'));
    pMerge.appendChild(fi);
    pMerge.appendChild(list);
    pMerge.appendChild(T.row(bGo));
    pMerge.appendChild(box);
  }

  /* ============ TAB 3: Pisah ============ */
  const pSplit = T.el('<div></div>');
  {
    const fi = fileInput('application/pdf'); fi.style.margin = '6px 0';
    const modeSel = T.select([['rentang', 'Pilih halaman sendiri'], ['ukuran', 'Bagi per ukuran file (MB)']], 'rentang');
    const rInp = T.input('text', 'Contoh: 1-3,5; 6-10  (tanda ; = file baru)');
    const rentangWrap = T.field('Rentang halaman', rInp, 'Contoh: 1-3,5; 6-10 → 2 file');
    const mbSel = T.select([['5', '5 MB per file (kirim WA/email)'], ['10', '10 MB per file'], ['25', '25 MB per file (batas lampiran Gmail)']], '10');
    const mbWrap = T.field('Ukuran maksimal tiap file', mbSel, 'Halaman dikelompokkan berurutan supaya tiap file tidak melebihi ukuran ini. Satu halaman yang sendirian sudah lebih besar dari batas tetap jadi satu file.');
    mbWrap.hidden = true;
    modeSel.addEventListener('change', () => {
      const bySize = modeSel.value === 'ukuran';
      rentangWrap.hidden = bySize;
      mbWrap.hidden = !bySize;
    });
    const box = T.out();
    const bGo = T.btn('Pisahkan & Unduh', async () => {
      const f = fi.files && fi.files[0];
      if (!f) { T.show(box, errBox('Pilih dulu file PDF.')); return; }
      const ok = await needLib(); if (!ok) return;
      T.show(box, '<span class="dim">Memisahkan…</span>');
      try {
        const src = await window.PDFLib.PDFDocument.load(new Uint8Array(await f.arrayBuffer()), { ignoreEncryption: true });
        const n = src.getPageCount();
        if (modeSel.value === 'ukuran') {
          const maksByte = parseInt(mbSel.value, 10) * 1024 * 1024;
          // Kelompokkan halaman secara serakah: tambah halaman selama hasil
          // simpan sementara masih di bawah batas.
          const groups = [];
          let cur = [];
          for (let i = 1; i <= n; i++) {
            cur.push(i);
            const coba = await window.PDFLib.PDFDocument.create();
            const pages = await coba.copyPages(src, cur.map((x) => x - 1));
            pages.forEach((p) => coba.addPage(p));
            const len = (await coba.save()).length;
            if (len > maksByte && cur.length > 1) {
              groups.push(cur.slice(0, -1));
              cur = [i];
            }
          }
          if (cur.length) groups.push(cur);
          if (groups.length === 1) {
            T.show(box, '<span class="dim">PDF ini sudah di bawah ' + mbSel.value + ' MB (' + fmtSize(f.size) + '), tidak perlu dibagi.</span>');
            return;
          }
          const okZip = await ensureJsZip();
          if (!okZip) { T.show(box, errBox('Gagal memuat pustaka ZIP dari CDN. Cek koneksi internet lalu coba lagi.')); return; }
          const zip = new window.JSZip();
          const info = [];
          for (let gi = 0; gi < groups.length; gi++) {
            const out = await window.PDFLib.PDFDocument.create();
            const pages = await out.copyPages(src, groups[gi].map((x) => x - 1));
            pages.forEach((p) => out.addPage(p));
            const bytes = await out.save();
            const namaFile = 'pdf-bagian-' + (gi + 1) + '.pdf';
            zip.file(namaFile, bytes);
            info.push(namaFile + ' (hal. ' + groups[gi][0] + '–' + groups[gi][groups[gi].length - 1] + ', ' + fmtSize(bytes.length) + ')');
          }
          const blob = await zip.generateAsync({ type: 'blob' });
          dlBlob(blob, 'pdf-bagi-' + mbSel.value + 'mb.zip');
          T.show(box, '<span class="ok">Berhasil: ' + groups.length + ' file dalam satu ZIP — ' + info.map(T.esc).join('; ') + '.</span>');
          return;
        }
        const groups = parseGroups(rInp.value, n);
        let k = 0;
        for (const g of groups) {
          const out = await window.PDFLib.PDFDocument.create();
          const pages = await out.copyPages(src, g.map((x) => x - 1));
          pages.forEach((p) => out.addPage(p));
          dlPdf(await out.save(), 'pdf-pisah-' + (++k) + '.pdf');
        }
        T.show(box, '<span class="ok">Berhasil: ' + groups.length + ' file terunduh.</span>');
      } catch (e) { T.show(box, errBox('Tidak bisa memisahkan PDF ini. Pastikan filenya tidak rusak dan nomor halamannya benar, lalu coba lagi.')); }
    }, true);
    pSplit.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Ambil halaman tertentu jadi file baru. Tanda <b>;</b> memisahkan jadi file berbeda. Atau bagi otomatis per ukuran supaya gampang dikirim lewat WA/email.</p>'));
    pSplit.appendChild(fi);
    pSplit.appendChild(T.field('Cara membagi', modeSel));
    pSplit.appendChild(rentangWrap);
    pSplit.appendChild(mbWrap);
    pSplit.appendChild(T.row(bGo));
    pSplit.appendChild(box);
  }

  /* ============ TAB 4: Gambar -> PDF ============ */
  const pImg = T.el('<div></div>');
  {
    const fi = fileInput('image/*,.heic,.heif,.tiff,.tif,.webp'); fi.multiple = true; fi.style.margin = '6px 0';
    const sizeSel = T.select([['follow', 'Ikuti ukuran gambar'], ['a4', 'Kertas A4']], 'follow');
    const mInp = T.input('number', '0-50', '8');
    mInp.min = '0'; mInp.max = '50';
    const box = T.out();
    const bGo = T.btn('Buat PDF & Unduh', async () => {
      const files = [...(fi.files || [])];
      if (!files.length) { T.show(box, errBox('Pilih dulu gambar (bisa banyak).')); return; }
      const ok = await needLib(); if (!ok) return;
      T.show(box, '<span class="dim">Menyusun ' + files.length + ' gambar…</span>');
      try {
        const out = await window.PDFLib.PDFDocument.create();
        const mm = Math.min(50, Math.max(0, +mInp.value || 0)) * 2.83465;
        const gagal = [];
        for (const f of files) {
          const bytes = new Uint8Array(await f.arrayBuffer());
          let img, dims;
          try {
            const nm = (f.name || '').toLowerCase();
            const tp = (f.type || '').toLowerCase();
            const isHeic = tp === 'image/heic' || tp === 'image/heif' || /\.hei[cf]$/.test(nm);
            const isTiff = tp === 'image/tiff' || tp === 'image/x-tiff' || /\.tiff?$/.test(nm);
            if (/png$/i.test(f.type) || /\.png$/i.test(f.name)) { img = await out.embedPng(bytes); }
            else if (/jpe?g$/i.test(f.type) || /\.jpe?g$/i.test(f.name)) { img = await out.embedJpg(bytes); }
            else if (isHeic) {
              // HEIC tidak bisa dibaca browser: ubah dulu jadi JPEG.
              if (!(await pastHeic())) throw new Error('pengubah HEIC gagal dimuat');
              const keluar = await window.heic2any({ blob: f, toType: 'image/jpeg', quality: 0.92 });
              const blob = Array.isArray(keluar) ? keluar[0] : keluar;
              if (!blob) throw new Error('file HEIC tidak terbaca');
              img = await out.embedJpg(new Uint8Array(await blob.arrayBuffer()));
            } else if (isTiff) {
              if (!(await pastUtif())) throw new Error('pembaca TIFF gagal dimuat');
              const ifds = window.UTIF.decode(bytes.buffer);
              if (!ifds || !ifds.length) throw new Error('file TIFF tidak terbaca');
              window.UTIF.decodeImage(bytes.buffer, ifds[0]);
              const rgba = window.UTIF.toRGBA8(ifds[0]);
              const c = document.createElement('canvas');
              c.width = ifds[0].width; c.height = ifds[0].height;
              c.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(rgba), c.width, c.height), 0, 0);
              img = await out.embedPng(await canvasToBytes(c, 'image/png'));
            } else {
              // WEBP/BMP/dll: decode lewat browser lalu tanam sebagai PNG.
              const el = await decodeImageFile(f);
              const c = document.createElement('canvas');
              c.width = el.naturalWidth; c.height = el.naturalHeight;
              c.getContext('2d').drawImage(el, 0, 0);
              img = await out.embedPng(await canvasToBytes(c, 'image/png'));
            }
          } catch (e) { gagal.push(fileName(f)); continue; }
          dims = img.scale(1);
          let pw, ph;
          if (sizeSel.value === 'a4') { pw = 595.28; ph = 841.89; }
          else { pw = dims.width + mm * 2; ph = dims.height + mm * 2; }
          const page = out.addPage([pw, ph]);
          const maxW = pw - mm * 2, maxH = ph - mm * 2;
          const s = Math.min(maxW / dims.width, maxH / dims.height);
          const dw = dims.width * s, dh = dims.height * s;
          page.drawImage(img, { x: (pw - dw) / 2, y: (ph - dh) / 2, width: dw, height: dh });
        }
        const made = out.getPageCount();
        dlPdf(await out.save(), 'gambar-ke-pdf.pdf');
        T.show(box, '<span class="ok">Berhasil: ' + made + ' halaman terunduh.' + (gagal.length ? ' ' + gagal.length + ' file dilewati karena tidak bisa dibaca browser ini: ' + gagal.slice(0, 3).map(T.esc).join(', ') + (gagal.length > 3 ? ' dan lainnya' : '') + '.' : '') + '</span>');
      } catch (e) { T.show(box, errBox('Tidak bisa membuat PDF dari gambar ini. Pastikan filenya benar-benar gambar (JPG, PNG, atau WEBP), lalu coba lagi.')); }
    }, true);
    pImg.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Ubah kumpulan gambar jadi satu PDF. PNG, JPG, WEBP, dan BMP bisa langsung. HEIC (foto iPhone) dan TIFF diubah dulu di perangkat — pertama kali butuh internet untuk mengunduh pengubahnya.</p>'));
    pImg.appendChild(fi);
    pImg.appendChild(T.grid2(T.field('Ukuran halaman', sizeSel), T.field('Margin (mm, 0-50)', mInp)));
    pImg.appendChild(T.row(bGo));
    pImg.appendChild(box);
  }

  /* ============ TAB 5: Watermark ============ */
  const pWm = T.el('<div></div>');
  {
    const fi = fileInput('application/pdf'); fi.style.margin = '6px 0';
    const modeSel = T.select([['text', 'Teks'], ['image', 'Gambar/logo']], 'text');
    const tInp = T.input('text', 'Teks watermark', 'DRAF');
    const fSel = T.select([
      ['HelveticaBold', 'Tebal (Helvetica Bold)'],
      ['Helvetica', 'Biasa (Helvetica)'],
      ['TimesRomanBold', 'Serif tebal (Times Bold)'],
      ['TimesRoman', 'Serif (Times)'],
      ['CourierBold', 'Mesin ketik tebal (Courier Bold)'],
      ['Courier', 'Mesin ketik (Courier)'],
    ], 'HelveticaBold');
    const sSel = T.select([['24', '24'], ['34', '34'], ['48', '48'], ['72', '72']], '34');
    const oSel = T.select([['0.1', '0,10'], ['0.22', '0,22'], ['0.4', '0,40'], ['0.6', '0,60']], '0.22');
    const aSel = T.select([['-35', '-35°'], ['0', '0°'], ['-45', '-45°'], ['45', '45°']], '-35');
    const imgFi = fileInput('image/*'); imgFi.style.margin = '6px 0';
    const posSel = T.select([
      ['mc', 'Tengah'], ['tl', 'Kiri atas'], ['tc', 'Tengah atas'], ['tr', 'Kanan atas'],
      ['ml', 'Kiri tengah'], ['mr', 'Kanan tengah'],
      ['bl', 'Kiri bawah'], ['bc', 'Tengah bawah'], ['br', 'Kanan bawah'],
    ], 'mc');
    const wInp = T.input('text', '60', '60'); wInp.inputMode = 'decimal';
    const pgInp = T.input('text', 'semua, atau mis. 1-3,5', 'semua');
    const textWrap = T.el('<div></div>');
    textWrap.appendChild(T.field('Teks watermark', tInp));
    textWrap.appendChild(T.field('Huruf', fSel));
    textWrap.appendChild(T.grid2(T.field('Ukuran', sSel), T.field('Sudut', aSel)));
    const imgWrap = T.el('<div></div>');
    imgWrap.appendChild(T.el('<p class="dim" style="font-size:13px;margin:6px 0">Pilih gambar logo (PNG transparan paling bagus).</p>'));
    imgWrap.appendChild(imgFi);
    imgWrap.appendChild(T.grid2(T.field('Posisi', posSel), T.field('Lebar (mm)', wInp)));
    imgWrap.hidden = true;
    const box = T.out();
    const bGo = T.btn('Terapkan & Unduh', async () => {
      const f = fi.files && fi.files[0];
      if (!f) { T.show(box, errBox('Pilih dulu file PDF.')); return; }
      const mode = modeSel.value;
      if (mode === 'text' && !tInp.value.trim()) { T.show(box, errBox('Isi teks watermark.')); return; }
      if (mode === 'image' && !(imgFi.files && imgFi.files[0])) { T.show(box, errBox('Pilih dulu gambar logo.')); return; }
      const ok = await needLib(); if (!ok) return;
      T.show(box, '<span class="dim">Menambahkan watermark…</span>');
      try {
        const doc = await loadPdfDoc(f);
        const n = doc.getPageCount();
        const targets = parsePages(pgInp.value, n);
        const op = +oSel.value;
        if (mode === 'text') {
          const font = await doc.embedFont(window.PDFLib.StandardFonts[fSel.value] || window.PDFLib.StandardFonts.HelveticaBold);
          const size = +sSel.value, ang = +aSel.value;
          for (const p1 of targets) {
            const page = doc.getPage(p1 - 1);
            const { width, height } = page.getSize();
            const tw = font.widthOfTextAtSize(tInp.value, size);
            page.drawText(tInp.value, {
              x: width / 2 - (tw * Math.cos(ang * Math.PI / 180)) / 2,
              y: height / 2,
              size, font, opacity: op,
              rotate: window.PDFLib.degrees(ang),
              color: window.PDFLib.rgb(0.5, 0.5, 0.5),
            });
          }
        } else {
          const imgFile = imgFi.files[0];
          const imgBytes = new Uint8Array(await imgFile.arrayBuffer());
          let img;
          if (/png$/i.test(imgFile.type) || /\.png$/i.test(imgFile.name)) img = await doc.embedPng(imgBytes);
          else if (/jpe?g$/i.test(imgFile.type) || /\.jpe?g$/i.test(imgFile.name)) img = await doc.embedJpg(imgBytes);
          else {
            const el = await decodeImageFile(imgFile);
            const c = document.createElement('canvas');
            c.width = el.naturalWidth; c.height = el.naturalHeight;
            c.getContext('2d').drawImage(el, 0, 0);
            img = await doc.embedPng(await canvasToBytes(c, 'image/png'));
          }
          const dims = img.scale(1);
          const aspect = dims.height / dims.width;
          const wPt = mm2pt(clamp(parseNum(wInp.value, 60), 10, 300));
          const hPt = wPt * aspect;
          const pos = posSel.value, m = 36;
          for (const p1 of targets) {
            const page = doc.getPage(p1 - 1);
            const { width, height } = page.getSize();
            const x = pos[1] === 'l' ? m : pos[1] === 'c' ? (width - wPt) / 2 : width - wPt - m;
            const y = pos[0] === 't' ? height - m - hPt : pos[0] === 'm' ? (height - hPt) / 2 : m;
            page.drawImage(img, { x, y, width: wPt, height: hPt, opacity: op });
          }
        }
        dlPdf(await doc.save(), 'pdf-watermark.pdf');
        T.show(box, '<span class="ok">Watermark diterapkan di ' + targets.length + ' halaman.</span>');
      } catch (e) { T.show(box, errBox('Watermark tidak bisa ditempel. Pastikan file PDF-nya tidak rusak, lalu coba lagi.')); }
    }, true);
    modeSel.addEventListener('change', () => {
      const imgMode = modeSel.value === 'image';
      textWrap.hidden = imgMode;
      imgWrap.hidden = !imgMode;
    });
    pWm.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Tambahkan watermark teks diagonal atau logo di halaman PDF.</p>'));
    pWm.appendChild(fi);
    pWm.appendChild(T.field('Jenis watermark', modeSel));
    pWm.appendChild(textWrap);
    pWm.appendChild(imgWrap);
    pWm.appendChild(T.grid2(T.field('Transparansi', oSel), T.field('Halaman target', pgInp)));
    pWm.appendChild(T.row(bGo));
    pWm.appendChild(box);
  }

  /* ============ TAB 6: Tambah Teks & Bentuk ============ */
  const pTx = T.el('<div></div>');
  {
    const fi = fileInput('application/pdf'); fi.style.margin = '6px 0';
    const modeSel = T.select([
      ['teks', 'Teks'],
      ['sorot', 'Sorot (stabilo transparan)'],
      ['kotak', 'Kotak (garis tepi)'],
      ['lingkaran', 'Lingkaran / elips (garis tepi)'],
    ], 'teks');
    const tInp = T.input('text', 'Teks yang ditambahkan', '');
    const fSel = T.select([
      ['Helvetica', 'Biasa (Helvetica)'],
      ['HelveticaBold', 'Tebal (Helvetica Bold)'],
      ['TimesRoman', 'Serif (Times)'],
      ['TimesRomanBold', 'Serif tebal (Times Bold)'],
      ['Courier', 'Mesin ketik (Courier)'],
    ], 'Helvetica');
    const posSel = T.select([
      ['tl', 'Kiri atas'], ['tc', 'Tengah atas'], ['tr', 'Kanan atas'],
      ['ml', 'Kiri tengah'], ['mc', 'Tengah'], ['mr', 'Kanan tengah'],
      ['bl', 'Kiri bawah'], ['bc', 'Tengah bawah'], ['br', 'Kanan bawah'],
      ['free', 'Bebas (koordinat %)'],
    ], 'bc');
    const xInp = T.input('number', '0–100', '10'); xInp.min = '0'; xInp.max = '100';
    const yInp = T.input('number', '0–100', '10'); yInp.min = '0'; yInp.max = '100';
    const xyRow = T.grid2(T.field('X % (dari kiri)', xInp), T.field('Y % (dari bawah)', yInp));
    xyRow.hidden = true;
    posSel.addEventListener('change', () => { xyRow.hidden = posSel.value !== 'free'; });
    const sSel = T.select([['12', '12'], ['18', '18'], ['24', '24'], ['36', '36'], ['48', '48']], '18');
    const wInp = T.input('text', '60', '60'); wInp.inputMode = 'decimal';
    const hInp = T.input('text', '20', '20'); hInp.inputMode = 'decimal';
    const cInp = T.el('<input type="color" value="#111111" style="width:100%;height:44px;border:1px solid #27272a;border-radius:8px;background:none;padding:4px;cursor:pointer">');
    const pgInp = T.input('text', 'semua, atau mis. 1,3', 'semua');
    const box = T.out();
    const textWrap = T.el('<div></div>');
    textWrap.appendChild(T.field('Teks', tInp));
    textWrap.appendChild(T.grid2(T.field('Huruf', fSel), T.field('Ukuran', sSel)));
    const shapeWrap = T.el('<div></div>');
    shapeWrap.appendChild(T.grid2(T.field('Lebar (mm)', wInp), T.field('Tinggi (mm)', hInp)));
    shapeWrap.hidden = true;
    modeSel.addEventListener('change', () => {
      const isTeks = modeSel.value === 'teks';
      textWrap.hidden = !isTeks;
      shapeWrap.hidden = isTeks;
      if (modeSel.value === 'sorot') cInp.value = '#ffeb3b';
      else if (modeSel.value !== 'teks') cInp.value = '#d62626';
    });
    const bGo = T.btn('Terapkan & Unduh', async () => {
      const f = fi.files && fi.files[0];
      if (!f) { T.show(box, errBox('Pilih dulu file PDF.')); return; }
      const mode = modeSel.value;
      if (mode === 'teks' && !tInp.value.trim()) { T.show(box, errBox('Isi teksnya.')); return; }
      const ok = await needLib(); if (!ok) return;
      T.show(box, '<span class="dim">Menambahkan…</span>');
      try {
        const doc = await window.PDFLib.PDFDocument.load(new Uint8Array(await f.arrayBuffer()), { ignoreEncryption: true });
        const n = doc.getPageCount();
        const targets = parsePages(pgInp.value, n);
        const hex = cInp.value;
        const col = window.PDFLib.rgb(parseInt(hex.slice(1, 3), 16) / 255, parseInt(hex.slice(3, 5), 16) / 255, parseInt(hex.slice(5, 7), 16) / 255);
        const m = 36;
        const wPt = mm2pt(clamp(parseNum(wInp.value, 60), 5, 300));
        const hPt = mm2pt(clamp(parseNum(hInp.value, 20), 5, 300));
        let font = null, size = 0, tw = 0;
        if (mode === 'teks') {
          font = await doc.embedFont(window.PDFLib.StandardFonts[fSel.value] || window.PDFLib.StandardFonts.Helvetica);
          size = +sSel.value;
          tw = font.widthOfTextAtSize(tInp.value, size);
        }
        for (const p1 of targets) {
          const page = doc.getPage(p1 - 1);
          const { width, height } = page.getSize();
          const pos = posSel.value;
          let x, y;
          if (pos === 'free') {
            const xp = Math.min(100, Math.max(0, +xInp.value || 0));
            const yp = Math.min(100, Math.max(0, +yInp.value || 0));
            x = width * xp / 100; y = height * yp / 100;
          } else {
            const bw = mode === 'teks' ? tw : wPt;
            const bh = mode === 'teks' ? size : hPt;
            x = pos[1] === 'l' ? m : pos[1] === 'c' ? (width - bw) / 2 : width - bw - m;
            y = pos[0] === 't' ? height - m - bh : pos[0] === 'm' ? (height - bh) / 2 : m;
          }
          if (mode === 'teks') {
            page.drawText(tInp.value, { x, y, size, font, color: col });
          } else if (mode === 'sorot') {
            page.drawRectangle({ x, y, width: wPt, height: hPt, color: col, opacity: 0.45 });
          } else if (mode === 'kotak') {
            page.drawRectangle({ x, y, width: wPt, height: hPt, borderColor: col, borderWidth: 2 });
          } else {
            page.drawEllipse({ x: x + wPt / 2, y: y + hPt / 2, xScale: wPt / 2, yScale: hPt / 2, borderColor: col, borderWidth: 2 });
          }
        }
        dlPdf(await doc.save(), 'pdf-teks.pdf');
        T.show(box, '<span class="ok">Diterapkan di ' + targets.length + ' halaman.</span>');
      } catch (e) { T.show(box, errBox('Teks/bentuk tidak bisa ditempel. Pastikan file PDF-nya tidak rusak, lalu coba lagi.')); }
    }, true);
    pTx.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Tempel teks, sorotan stabilo, kotak, atau lingkaran di posisi tertentu pada halaman.</p>'));
    pTx.appendChild(fi);
    pTx.appendChild(T.field('Yang ditambahkan', modeSel));
    pTx.appendChild(textWrap);
    pTx.appendChild(shapeWrap);
    pTx.appendChild(T.field('Posisi', posSel));
    pTx.appendChild(xyRow);
    pTx.appendChild(T.grid2(T.field('Warna', cInp), T.field('Halaman target', pgInp)));
    pTx.appendChild(T.row(bGo));
    pTx.appendChild(box);
  }

  /* ============ TAB 7: Metadata ============ */
  const pMeta = T.el('<div></div>');
  {
    const fi = fileInput('application/pdf'); fi.style.margin = '6px 0';
    const fT = T.input('text', 'Judul dokumen', '');
    const fA = T.input('text', 'Penulis', '');
    const fS = T.input('text', 'Subjek', '');
    const fK = T.input('text', 'Kata kunci (pisahkan koma)', '');
    const clearChk = T.el('<input type="checkbox" style="width:18px;height:18px;accent-color:#e07856;flex-shrink:0">');
    const clearRow = T.el('<label style="display:flex;gap:10px;align-items:center;font-size:14px;margin:8px 0;cursor:pointer"></label>');
    clearRow.appendChild(clearChk);
    clearRow.appendChild(T.el('<span>Hapus semua metadata (judul, penulis, subjek, kata kunci)</span>'));
    const box = T.out();
    const bShow = T.btn('Lihat Metadata Saat Ini', async () => {
      const f = fi.files && fi.files[0];
      if (!f) { T.show(box, errBox('Pilih dulu file PDF.')); return; }
      const ok = await needLib(); if (!ok) return;
      try {
        const doc = await window.PDFLib.PDFDocument.load(new Uint8Array(await f.arrayBuffer()), { ignoreEncryption: true });
        T.show(box,
          '<div class="kv"><span class="k">Judul</span><span class="v">' + T.esc(doc.getTitle() || '(kosong)') + '</span></div>' +
          '<div class="kv"><span class="k">Penulis</span><span class="v">' + T.esc(doc.getAuthor() || '(kosong)') + '</span></div>' +
          '<div class="kv"><span class="k">Subjek</span><span class="v">' + T.esc(doc.getSubject() || '(kosong)') + '</span></div>' +
          '<div class="kv"><span class="k">Kata kunci</span><span class="v">' + T.esc((doc.getKeywords() || []).join(', ') || '(kosong)') + '</span></div>' +
          '<div class="kv"><span class="k">Halaman</span><span class="v">' + doc.getPageCount() + '</span></div>');
      } catch (e) { T.show(box, errBox('Info file ini tidak bisa dibaca. Pastikan filenya benar-benar PDF dan tidak rusak.')); }
    });
    const bGo = T.btn('Simpan & Unduh', async () => {
      const f = fi.files && fi.files[0];
      if (!f) { T.show(box, errBox('Pilih dulu file PDF.')); return; }
      const ok = await needLib(); if (!ok) return;
      try {
        const doc = await window.PDFLib.PDFDocument.load(new Uint8Array(await f.arrayBuffer()), { ignoreEncryption: true });
        if (clearChk.checked) {
          try {
            const PN = window.PDFLib.PDFName;
            ['Title', 'Author', 'Subject', 'Keywords', 'Creator', 'Producer'].forEach((k) => doc.catalog.delete(PN.of(k)));
          } catch (e) {}
        } else {
          if (fT.value.trim()) doc.setTitle(fT.value.trim());
          if (fA.value.trim()) doc.setAuthor(fA.value.trim());
          if (fS.value.trim()) doc.setSubject(fS.value.trim());
          if (fK.value.trim()) doc.setKeywords(fK.value.split(',').map((s) => s.trim()).filter(Boolean));
          doc.setProducer('Adip Tools PDF Lab');
        }
        dlPdf(await doc.save(), 'pdf-metadata.pdf');
        T.show(box, '<span class="ok">' + (clearChk.checked ? 'Metadata dihapus.' : 'Metadata tersimpan.') + '</span>');
      } catch (e) { T.show(box, errBox('Metadata tidak bisa disimpan. Pastikan file PDF-nya tidak rusak, lalu coba lagi.')); }
    }, true);
    pMeta.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Lihat & ubah info dokumen PDF (judul, penulis, dsb).</p>'));
    pMeta.appendChild(fi);
    pMeta.appendChild(T.grid2(T.field('Judul', fT), T.field('Penulis', fA)));
    pMeta.appendChild(T.grid2(T.field('Subjek', fS), T.field('Kata kunci', fK)));
    pMeta.appendChild(clearRow);
    pMeta.appendChild(T.row(bShow, bGo));
    pMeta.appendChild(box);
  }

  /* ============ TAB 8: Isi Form ============ */
  const pForm = T.el('<div></div>');
  {
    const fi = fileInput('application/pdf'); fi.style.margin = '6px 0';
    const box = T.out();
    const formWrap = T.el('<div style="display:grid;gap:10px;margin:12px 0"></div>');
    const flatChk = T.el('<input type="checkbox" style="width:18px;height:18px;accent-color:#e07856">');
    let doc = null, fields = [];
    const bLoad = T.btn('Muat Form', async () => {
      const f = fi.files && fi.files[0];
      if (!f) { T.show(box, errBox('Pilih dulu file PDF.')); return; }
      const ok = await needLib(); if (!ok) return;
      T.show(box, '<span class="dim">Membaca form…</span>');
      try {
        doc = await window.PDFLib.PDFDocument.load(new Uint8Array(await f.arrayBuffer()), { ignoreEncryption: true });
        const form = doc.getForm();
        fields = form.getFields();
        formWrap.innerHTML = '';
        if (!fields.length) { T.show(box, '<span class="dim">PDF ini tidak punya form yang bisa diisi (AcroForm kosong).</span>'); return; }
        const kindOf = (fd) => {
          const nm = (fd.constructor && fd.constructor.name) || '';
          if (/CheckBox/i.test(nm)) return 'checkbox';
          if (/Dropdown|OptionList|Radio/i.test(nm)) return 'select';
          return 'text';
        };
        let nT = 0, nC = 0, nS = 0;
        fields.forEach((fd) => {
          const kind = kindOf(fd);
          fd._kind = kind;
          const label = fd.getName() || '(tanpa nama)';
          if (kind === 'checkbox') {
            nC++;
            const inp = T.el('<input type="checkbox" style="width:18px;height:18px;accent-color:#e07856;flex-shrink:0">');
            try { inp.checked = !!(fd.isChecked && fd.isChecked()); } catch (e) {}
            const row = T.el('<label style="display:flex;gap:10px;align-items:center;font-size:14px;cursor:pointer"></label>');
            row.appendChild(inp);
            row.appendChild(T.el('<span style="word-break:break-all">' + T.esc(label) + '</span>'));
            formWrap.appendChild(row);
            fd._inp = inp;
          } else if (kind === 'select') {
            nS++;
            let opts = [];
            try { opts = (typeof fd.getOptions === 'function' && fd.getOptions()) || []; } catch (e) {}
            let cur = '';
            try { const sel = fd.getSelected && fd.getSelected(); if (sel && sel.length) cur = sel[0]; } catch (e) {}
            const selEl = T.select([['', '- pilih -']].concat(opts.map((o) => [o, o])), cur);
            formWrap.appendChild(T.field(label, selEl));
            fd._inp = selEl;
          } else {
            nT++;
            let cur = '';
            try { cur = fd.getText() || ''; } catch (e) {}
            const inp = T.input('text', 'Isi…', cur);
            formWrap.appendChild(T.field(label, inp));
            fd._inp = inp;
          }
        });
        const parts = [];
        if (nT) parts.push(nT + ' teks'); if (nC) parts.push(nC + ' centang'); if (nS) parts.push(nS + ' pilihan');
        T.show(box, '<span class="ok">' + fields.length + ' field ditemukan (' + parts.join(', ') + ').</span>');
        bGo.hidden = false;
      } catch (e) { T.show(box, errBox('Form di PDF ini tidak bisa dibaca. Pastikan filenya punya form isian dan tidak rusak.')); }
    }, true);
    const bGo = T.btn('Isi & Unduh', async () => {
      if (!doc) return;
      try {
        const form = doc.getForm();
        form.getFields().forEach((tf) => {
          if (!tf._inp) return;
          try {
            if (tf._kind === 'checkbox') {
              if (typeof tf.check === 'function' && typeof tf.uncheck === 'function') {
                if (tf._inp.checked) tf.check(); else tf.uncheck();
              }
            } else if (tf._kind === 'select') {
              const v = tf._inp.value;
              if (v && typeof tf.select === 'function') tf.select(v);
              else if (!v && typeof tf.clear === 'function') tf.clear();
            } else if (tf instanceof window.PDFLib.PDFTextField) {
              tf.setText(tf._inp.value);
            }
          } catch (e) { /* field bermasalah dilewati */ }
        });
        if (flatChk.checked) form.flatten();
        dlPdf(await doc.save(), 'pdf-form-terisi.pdf');
        T.show(box, '<span class="ok">Form terisi & terunduh.</span>');
      } catch (e) { T.show(box, errBox('Form tidak bisa disimpan. Pastikan file PDF-nya tidak rusak, lalu coba lagi.')); }
    }, true);
    const bFlat = T.btn('Ratakan Form Saja & Unduh', async () => {
      const f = fi.files && fi.files[0];
      if (!f) { T.show(box, errBox('Pilih dulu file PDF.')); return; }
      const ok = await needLib(); if (!ok) return;
      T.show(box, '<span class="dim">Meratakan form…</span>');
      try {
        const d = await loadPdfDoc(f);
        d.getForm().flatten();
        dlPdf(await d.save(), 'pdf-form-rata.pdf');
        T.show(box, '<span class="ok">Form diratakan & terunduh. Isian tidak bisa diubah lagi.</span>');
      } catch (e) { T.show(box, errBox('Form tidak bisa diratakan. Pastikan file PDF-nya tidak rusak, lalu coba lagi.')); }
    });
    bGo.hidden = true;
    const chkRow = T.el('<label style="display:flex;gap:10px;align-items:center;font-size:14px;margin:8px 0;cursor:pointer"></label>');
    chkRow.appendChild(flatChk);
    chkRow.appendChild(T.el('<span>Kunci form setelah diisi (flatten, tidak bisa diubah lagi)</span>'));
    pForm.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Isi form PDF (AcroForm): isian teks, kotak centang, dan pilihan (dropdown/radio). Tombol ratakan mengunci form apa adanya tanpa mengubah isian.</p>'));
    pForm.appendChild(fi);
    pForm.appendChild(T.row(bLoad, bFlat));
    pForm.appendChild(box);
    pForm.appendChild(formWrap);
    pForm.appendChild(chkRow);
    pForm.appendChild(T.row(bGo));
  }

  /* ============ TAB 9: Kompres ============ */
  const pCompress = T.el('<div></div>');
  {
    const fi = fileInput('application/pdf'); fi.style.margin = '6px 0';
    const modeSel = T.select([
      ['true', 'Pertahankan teks (disarankan)'],
      ['render', 'Ubah halaman jadi gambar'],
      ['gray', 'Jadi hitam putih'],
    ], 'true');
    const qSel = T.select([['0.9', 'Hampir asli (0,9)'], ['0.8', 'Bagus (0,8)'], ['0.6', 'Sedang (0,6)'], ['0.5', 'Kecil (0,5)']], '0.6');
    const sSel = T.select([['1', '72 dpi (kecil)'], ['1.5', '108 dpi (sedang)'], ['2', '144 dpi (tajam)']], '1.5');
    const qTrueSel = T.select([['0.85', 'Hampir asli (0,85)'], ['0.7', 'Bagus (0,7)'], ['0.5', 'Sedang (0,5)'], ['0.3', 'Kecil (0,3)']], '0.7');
    const scTrueSel = T.select([['1', 'Ukuran gambar tetap'], ['0.75', 'Gambar 75%'], ['0.5', 'Gambar 50%']], '1');
    const rowTrue = T.grid2(T.field('Kualitas gambar', qTrueSel, 'Berlaku untuk gambar di dalam PDF.'), T.field('Ukuran gambar', scTrueSel));
    const rowRender = T.grid2(T.field('Kualitas JPEG', qSel, 'Semakin kecil angkanya, semakin kecil file & semakin turun kualitasnya.'), T.field('Resolusi render', sSel, 'Resolusi lebih tinggi = teks lebih tajam, file lebih besar.'));
    rowRender.hidden = true;
    const noteTrue = T.el('<p class="dim" style="font-size:13px;line-height:1.6">Cara ini mengecilkan gambar di dalam PDF tanpa mengubah teks. Teks tetap bisa dipilih dan disalin. File yang gambarnya sudah kecil atau tidak punya gambar tidak akan banyak mengecil.</p>');
    const noteRender = T.el('<p class="dim" style="font-size:13px;line-height:1.6">Tiap halaman diubah jadi gambar JPEG lalu disusun kembali. Teks tidak bisa dipilih lagi & kualitas turun sesuai pilihan. Cocok untuk arsip atau unggah, bukan untuk dokumen yang masih perlu diedit.</p>');
    const noteGray = T.el('<p class="dim" style="font-size:13px;line-height:1.6">Tiap halaman diubah jadi gambar hitam putih lalu disusun kembali. Teks tidak bisa dipilih lagi. Cocok untuk cetak hemat tinta.</p>');
    noteRender.hidden = true; noteGray.hidden = true;
    const box = T.out();
    const canvasToJpeg = (canvas, q) => new Promise((res, rej) => {
      canvas.toBlob((b) => (b ? res(b) : rej(new Error('gagal encode JPEG'))), 'image/jpeg', q);
    });
    const bGo = T.btn('Kompres & Unduh', async () => {
      const f = fi.files && fi.files[0];
      if (!f) { T.show(box, errBox('Pilih dulu file PDF.')); return; }
      const ok = await needLib(); if (!ok) return;
      const mode = modeSel.value;
      if (mode === 'true') {
        T.show(box, '<span class="dim">Membaca PDF…</span>');
        try {
          const doc = await loadPdfDoc(f);
          const st = await trueCompressDoc(doc, +qTrueSel.value, +scTrueSel.value, (i, total) => {
            T.show(box, '<span class="dim">Mengecilkan gambar ' + i + '/' + total + '…</span>');
          });
          const bytes = new Uint8Array(await doc.save());
          const before = f.size, after = bytes.length;
          if (st.total === 0) {
            T.show(box, '<span class="dim">PDF ini tidak punya gambar, jadi tidak ada yang bisa dikecilkan dengan cara ini. Coba mode "Ubah halaman jadi gambar" bila tetap perlu file lebih kecil.</span>');
            return;
          }
          dlPdf(bytes, 'pdf-kompres.pdf');
          const pct = Math.round((1 - after / before) * 100);
          const msg = after < before
            ? 'Berhasil: ' + fmtSize(before) + ' menjadi ' + fmtSize(after) + ' (lebih kecil ' + pct + '%). ' + st.replaced + ' dari ' + st.total + ' gambar dikecilkan' + (st.nonJpeg ? ' (termasuk ' + st.nonJpeg + ' gambar non-JPEG/CMYK)' : '') + (st.skipped ? ', ' + st.skipped + ' gambar dilewati (format tidak didukung atau tidak bisa dikecilkan)' : '') + '. Teks tetap bisa dipilih.'
            : 'Hasil ' + fmtSize(after) + ' vs asli ' + fmtSize(before) + ', tidak lebih kecil. Gambar di PDF ini sudah padat. File tetap terunduh; coba kualitas lebih rendah atau mode "Ubah halaman jadi gambar".';
          T.show(box, '<span class="ok">' + msg + '</span>');
        } catch (e) { T.show(box, errBox('Tidak bisa mengompres PDF ini. Pastikan filenya tidak rusak, lalu coba lagi.')); }
        return;
      }
      const okJs = await ensurePdfJs();
      if (!okJs) { T.show(box, errBox('Gagal memuat pustaka baca PDF dari CDN. Cek koneksi internet lalu coba lagi.')); return; }
      T.show(box, '<span class="dim">Membaca PDF…</span>');
      try {
        const srcBytes = new Uint8Array(await f.arrayBuffer());
        const src = await window.pdfjsLib.getDocument({ data: srcBytes.slice(0) }).promise;
        const n = src.numPages;
        const out = await window.PDFLib.PDFDocument.create();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const q = +qSel.value, scale = +sSel.value;
        for (let i = 1; i <= n; i++) {
          T.show(box, '<span class="dim">Memproses halaman ' + i + '/' + n + '…</span>');
          const page = await src.getPage(i);
          const vp1 = page.getViewport({ scale: 1 });
          const vp = page.getViewport({ scale });
          canvas.width = Math.max(1, Math.round(vp.width));
          canvas.height = Math.max(1, Math.round(vp.height));
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          if (mode === 'gray') { try { ctx.filter = 'grayscale(1)'; } catch (e) {} }
          await page.render({ canvasContext: ctx, viewport: vp }).promise;
          try { ctx.filter = 'none'; } catch (e) {}
          const blob = await canvasToJpeg(canvas, q);
          const img = await out.embedJpg(new Uint8Array(await blob.arrayBuffer()));
          const pg = out.addPage([vp1.width, vp1.height]);
          pg.drawImage(img, { x: 0, y: 0, width: vp1.width, height: vp1.height });
        }
        const bytes = await out.save();
        dlPdf(bytes, mode === 'gray' ? 'pdf-hitam-putih.pdf' : 'pdf-kompres.pdf');
        const before = f.size, after = bytes.length;
        const pct = Math.round((1 - after / before) * 100);
        const msg = mode === 'gray'
          ? 'Berhasil: ' + n + ' halaman jadi hitam putih (' + fmtSize(after) + ').'
          : after < before
            ? 'Berhasil: ' + fmtSize(before) + ' menjadi ' + fmtSize(after) + ' (lebih kecil ' + pct + '%, ' + n + ' halaman).'
            : 'Hasil ' + fmtSize(after) + ' vs asli ' + fmtSize(before) + ', tidak lebih kecil (PDF aslinya sudah padat). File tetap terunduh; coba kualitas lebih rendah bila perlu.';
        T.show(box, '<span class="ok">' + msg + '</span>');
      } catch (e) { T.show(box, errBox('Tidak bisa mengompres PDF ini. Pastikan filenya tidak rusak, lalu coba lagi.')); }
    }, true);
    modeSel.addEventListener('change', () => {
      const m = modeSel.value;
      rowTrue.hidden = m !== 'true';
      rowRender.hidden = m === 'true';
      noteTrue.hidden = m !== 'true';
      noteRender.hidden = m !== 'render';
      noteGray.hidden = m !== 'gray';
      bGo.textContent = m === 'gray' ? 'Ubah & Unduh' : 'Kompres & Unduh';
    });
    pCompress.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Perkecil ukuran PDF atau ubah jadi hitam putih. Pilih cara di bawah sesuai kebutuhan.</p>'));
    pCompress.appendChild(fi);
    pCompress.appendChild(T.field('Cara kompres', modeSel));
    pCompress.appendChild(noteTrue);
    pCompress.appendChild(noteRender);
    pCompress.appendChild(noteGray);
    pCompress.appendChild(rowTrue);
    pCompress.appendChild(rowRender);
    pCompress.appendChild(T.row(bGo));
    pCompress.appendChild(box);
  }

  /* ============ TAB 10: PDF -> Gambar ============ */
  const pPdfImg = T.el('<div></div>');
  {
    const fi = fileInput('application/pdf'); fi.style.margin = '6px 0';
    const fmtSel = T.select([['jpeg', 'JPG'], ['png', 'PNG']], 'jpeg');
    const scSel = T.select([['1', '72 dpi (standar)'], ['1.5', '108 dpi'], ['2', '144 dpi (tajam)'], ['3', '216 dpi (sangat tajam)']], '2');
    const box = T.out();
    const grid = T.el('<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px;margin:12px 0"></div>');
    let shots = [];
    const bZip = T.btn('Unduh Semua (ZIP)', async () => {
      if (!shots.length) return;
      const ok = await ensureJsZip();
      if (!ok) { T.show(box, errBox('Gagal memuat pustaka ZIP dari CDN. Cek koneksi internet lalu coba lagi.')); return; }
      T.show(box, '<span class="dim">Menyiapkan ZIP…</span>');
      try {
        const zip = new window.JSZip();
        shots.forEach((s) => zip.file(s.name, s.blob));
        const blob = await zip.generateAsync({ type: 'blob' });
        dlBlob(blob, 'pdf-gambar.zip');
        T.show(box, '<span class="ok">ZIP terunduh (' + shots.length + ' gambar).</span>');
      } catch (e) { T.show(box, errBox('ZIP tidak bisa dibuat. Coba lagi, atau unduh gambarnya satu per satu.')); }
    });
    bZip.hidden = true;
    const bGo = T.btn('Ubah ke Gambar', async () => {
      const f = fi.files && fi.files[0];
      if (!f) { T.show(box, errBox('Pilih dulu file PDF.')); return; }
      const okJs = await ensurePdfJs();
      if (!okJs) { T.show(box, errBox('Gagal memuat pustaka baca PDF dari CDN. Cek koneksi internet lalu coba lagi.')); return; }
      T.show(box, '<span class="dim">Membaca PDF…</span>');
      grid.innerHTML = '';
      shots = [];
      bZip.hidden = true;
      try {
        const bytes = new Uint8Array(await f.arrayBuffer());
        const src = await window.pdfjsLib.getDocument({ data: bytes.slice(0) }).promise;
        const n = src.numPages;
        const fmt = fmtSel.value;
        const scale = parseNum(scSel.value, 2);
        const ext = fmt === 'png' ? 'png' : 'jpg';
        const mime = fmt === 'png' ? 'image/png' : 'image/jpeg';
        for (let i = 1; i <= n; i++) {
          T.show(box, '<span class="dim">Mengubah halaman ' + i + '/' + n + '…</span>');
          const page = await src.getPage(i);
          const vp = page.getViewport({ scale });
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(vp.width));
          canvas.height = Math.max(1, Math.round(vp.height));
          const ctx = canvas.getContext('2d');
          if (fmt === 'jpeg') { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height); }
          await page.render({ canvasContext: ctx, viewport: vp }).promise;
          const blob = await canvasToBlobP(canvas, mime, 0.92);
          const name = 'halaman-' + String(i).padStart(2, '0') + '.' + ext;
          shots.push({ blob, name });
          const card = T.el('<div style="border:1px solid #ffffff20;border-radius:10px;padding:8px;text-align:center;background:#141210"></div>');
          canvas.style.cssText = 'width:100%;height:auto;border-radius:6px;background:#fff';
          card.appendChild(canvas);
          card.appendChild(T.el('<div class="dim" style="font-size:12px;margin:6px 0">Halaman ' + i + '</div>'));
          const bDl = T.btn('Unduh', () => dlBlob(blob, name));
          bDl.classList.add('small'); bDl.style.padding = '4px 8px';
          card.appendChild(bDl);
          grid.appendChild(card);
        }
        bZip.hidden = false;
        T.show(box, '<span class="ok">' + n + ' halaman diubah jadi ' + fmt.toUpperCase() + '. Unduh satu per satu atau semuanya sekaligus.</span>');
      } catch (e) { T.show(box, errBox('Halaman tidak bisa diubah jadi gambar. Pastikan file PDF-nya tidak rusak, lalu coba lagi.')); }
    }, true);
    pPdfImg.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Ubah tiap halaman PDF jadi gambar JPG atau PNG. Cocok untuk dibagikan atau dimasukkan ke dokumen lain.</p>'));
    pPdfImg.appendChild(fi);
    pPdfImg.appendChild(T.grid2(T.field('Format gambar', fmtSel), T.field('Kualitas gambar', scSel, 'Semakin tinggi, semakin tajam dan semakin besar file.')));
    pPdfImg.appendChild(T.row(bGo, bZip));
    pPdfImg.appendChild(box);
    pPdfImg.appendChild(grid);
  }

  /* ============ TAB 11: Nomor Halaman ============ */
  const pNum = T.el('<div></div>');
  {
    const fi = fileInput('application/pdf'); fi.style.margin = '6px 0';
    const posSel = T.select([
      ['bc', 'Bawah tengah'], ['bl', 'Bawah kiri'], ['br', 'Bawah kanan'],
      ['tc', 'Atas tengah'], ['tl', 'Atas kiri'], ['tr', 'Atas kanan'],
    ], 'bc');
    const fmtSel = T.select([
      ['num', 'Angka biasa (1, 2, 3)'],
      ['numof', 'Halaman 1 dari 10'],
      ['roman', 'Angka Romawi (i, ii, iii)'],
      ['romanfirst', 'Romawi di awal, angka setelahnya'],
    ], 'num');
    const startInp = T.input('text', '1', '1'); startInp.inputMode = 'decimal';
    const romInp = T.input('text', '3', '3'); romInp.inputMode = 'decimal';
    const romRow = T.field('Halaman Romawi sampai halaman ke', romInp, 'Halaman awal pakai i, ii, iii sampai nomor ini.');
    romRow.hidden = true;
    fmtSel.addEventListener('change', () => { romRow.hidden = fmtSel.value !== 'romanfirst'; });
    const dariHalInp = T.input('text', '1', '1'); dariHalInp.inputMode = 'decimal';
    const skipSampulChk = T.el('<label style="display:flex;gap:8px;align-items:center;font-size:13px;cursor:pointer"><input type="checkbox" id="pdfnum-skip"> Lewati halaman pertama (sampul tidak diberi nomor)</label>');
    const skipSampulCek = skipSampulChk.querySelector('#pdfnum-skip');
    const sizeSel = T.select([['10', '10'], ['12', '12'], ['14', '14'], ['18', '18']], '12');
    const pgInp = T.input('text', 'semua, atau mis. 1-3,5', 'semua');
    const box = T.out();
    const bGo = T.btn('Tempel Nomor & Unduh', async () => {
      const f = fi.files && fi.files[0];
      if (!f) { T.show(box, errBox('Pilih dulu file PDF.')); return; }
      const ok = await needLib(); if (!ok) return;
      T.show(box, '<span class="dim">Menempel nomor…</span>');
      try {
        const doc = await loadPdfDoc(f);
        const n = doc.getPageCount();
        let targets = parsePages(pgInp.value, n);
        const dariHal = Math.max(1, Math.floor(parseNum(dariHalInp.value, 1)));
        targets = targets.filter((p1) => p1 >= dariHal);
        if (skipSampulCek.checked) targets = targets.filter((p1) => p1 !== 1);
        if (!targets.length) { T.show(box, errBox('Tidak ada halaman yang diberi nomor. Periksa "mulai dari halaman ke" dan halaman target.')); return; }
        const font = await doc.embedFont(window.PDFLib.StandardFonts.Helvetica);
        const size = +sizeSel.value;
        const start = Math.max(1, Math.floor(parseNum(startInp.value, 1)));
        const romCount = Math.max(0, Math.floor(parseNum(romInp.value, 3)));
        const pos = posSel.value;
        const m = 36, my = 24;
        targets.forEach((p1, j) => {
          const page = doc.getPage(p1 - 1);
          const { width, height } = page.getSize();
          const arabic = start + j - (fmtSel.value === 'romanfirst' ? romCount : 0);
          let label;
          if (fmtSel.value === 'roman') label = toRoman(start + j);
          else if (fmtSel.value === 'romanfirst' && j < romCount) label = toRoman(j + 1);
          else if (fmtSel.value === 'numof') label = 'Halaman ' + arabic + ' dari ' + targets.length;
          else label = String(arabic);
          const tw = font.widthOfTextAtSize(label, size);
          const x = pos[1] === 'l' ? m : pos[1] === 'c' ? (width - tw) / 2 : width - tw - m;
          const y = pos[0] === 't' ? height - my - size : my;
          page.drawText(label, { x, y, size, font, color: window.PDFLib.rgb(0.4, 0.4, 0.4) });
        });
        dlPdf(await doc.save(), 'pdf-nomor.pdf');
        T.show(box, '<span class="ok">Nomor ditempel di ' + targets.length + ' halaman' + (dariHal > 1 ? ' (mulai halaman ' + dariHal + ')' : '') + (skipSampulCek.checked ? ' — halaman pertama dilewati' : '') + '.</span>');
      } catch (e) { T.show(box, errBox('Nomor halaman tidak bisa ditempel. Pastikan file PDF-nya tidak rusak, lalu coba lagi.')); }
    }, true);
    pNum.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Tempel nomor halaman di setiap halaman PDF. Untuk skripsi atau laporan, halaman awal bisa memakai angka Romawi.</p>'));
    pNum.appendChild(fi);
    pNum.appendChild(T.grid2(T.field('Posisi', posSel), T.field('Format nomor', fmtSel)));
    pNum.appendChild(T.grid2(T.field('Mulai dari nomor', startInp), T.field('Ukuran', sizeSel)));
    pNum.appendChild(T.grid2(T.field('Mulai tempel dari halaman ke', dariHalInp, 'Halaman sebelum ini tidak diberi nomor.'), T.field('', skipSampulChk)));
    pNum.appendChild(romRow);
    pNum.appendChild(T.field('Halaman target', pgInp));
    pNum.appendChild(T.row(bGo));
    pNum.appendChild(box);
  }

  /* ============ TAB 12: Tanda Tangan ============ */
  const pSign = T.el('<div></div>');
  {
    const fi = fileInput('application/pdf'); fi.style.margin = '6px 0';
    const sigFi = fileInput('image/*'); sigFi.style.margin = '6px 0';
    const pgInp = T.input('text', '1, atau mis. 1,3', '1');
    const posSel = T.select([
      ['br', 'Kanan bawah'], ['bl', 'Kiri bawah'], ['bc', 'Tengah bawah'],
      ['tr', 'Kanan atas'], ['tl', 'Kiri atas'], ['mc', 'Tengah'],
    ], 'br');
    const wInp = T.input('text', '40', '40'); wInp.inputMode = 'decimal';
    const box = T.out();
    const prevWrap = T.el('<div style="margin:12px 0"></div>');
    const prevCanvas = document.createElement('canvas');
    prevCanvas.style.cssText = 'width:100%;height:auto;border-radius:10px;background:#fff;touch-action:none;display:block';
    prevWrap.appendChild(prevCanvas);
    prevWrap.appendChild(T.el('<p class="dim" style="font-size:12px;margin:6px 0">Seret tanda tangan di pratinjau untuk menggeser posisinya.</p>'));
    prevWrap.hidden = true;
    let sigImg = null, sigBytes = null, sigIsPng = true;
    let pageCanvas = null, pageSize = null, sigRect = null;
    let dragging = false, dragDx = 0, dragDy = 0;

    const setSigFromDataUrl = (dataUrl) => new Promise((res, rej) => {
      const img = new Image();
      img.onload = () => {
        try {
          sigBytes = Uint8Array.from(atob(dataUrl.split(',')[1]), (c) => c.charCodeAt(0));
        } catch (e) { sigBytes = null; }
        sigIsPng = true;
        sigImg = img;
        res(true);
      };
      img.onerror = () => rej(new Error('Gambar tanda tangan tidak bisa dibaca'));
      img.src = dataUrl;
    });
    sigFi.addEventListener('change', async () => {
      const f = sigFi.files && sigFi.files[0];
      if (!f) return;
      try {
        sigImg = await decodeImageFile(f);
        sigBytes = new Uint8Array(await f.arrayBuffer());
        sigIsPng = /png$/i.test(f.type) || /\.png$/i.test(f.name);
        if (!sigIsPng && !(/jpe?g$/i.test(f.type) || /\.jpe?g$/i.test(f.name))) {
          const c = document.createElement('canvas');
          c.width = sigImg.naturalWidth; c.height = sigImg.naturalHeight;
          c.getContext('2d').drawImage(sigImg, 0, 0);
          sigBytes = await canvasToBytes(c, 'image/png');
          sigIsPng = true;
        }
        T.show(box, '<span class="ok">Tanda tangan dimuat. Muat pratinjau untuk mengatur posisi, atau langsung tempel.</span>');
        if (pageCanvas) drawPrev();
      } catch (e) { T.show(box, errBox('Gambar tanda tangan ini tidak bisa dibaca. Pastikan filenya benar-benar gambar (PNG atau JPG), lalu coba lagi.')); }
    });
    const bFromTool = T.btn('Pakai yang Terakhir Dibuat', async () => {
      let dataUrl = null;
      try { dataUrl = localStorage.getItem(TTD_KEY); } catch (e) {}
      if (!dataUrl) { T.show(box, errBox('Belum ada tanda tangan tersimpan. Buat dulu di tool Tanda Tangan, lalu kembali ke sini.')); return; }
      try {
        await setSigFromDataUrl(dataUrl);
        T.show(box, '<span class="ok">Tanda tangan dari tool Tanda Tangan dimuat.</span>');
        if (pageCanvas) drawPrev();
      } catch (e) { T.show(box, errBox('Tanda tangan yang tersimpan tidak bisa dimuat. Coba buat ulang di tool Tanda Tangan.')); }
    });
    const bMake = T.btn('Buat di Tool Tanda Tangan', () => { location.hash = '#/t/tanda-tangan'; });

    function drawPrev() {
      if (!pageCanvas || !sigImg || !sigRect) return;
      prevCanvas.width = pageCanvas.width;
      prevCanvas.height = pageCanvas.height;
      const cx = prevCanvas.getContext('2d');
      cx.drawImage(pageCanvas, 0, 0);
      const W = pageCanvas.width, H = pageCanvas.height;
      const aspect = sigImg.naturalHeight / sigImg.naturalWidth;
      const sw = sigRect.fw * W;
      const sh = sw * aspect;
      cx.drawImage(sigImg, sigRect.fx * W, sigRect.fy * H, sw, sh);
    }
    function presetRect() {
      const aspect = sigImg.naturalHeight / sigImg.naturalWidth;
      const wPt = mm2pt(clamp(parseNum(wInp.value, 40), 10, 200));
      const fw = wPt / pageSize.width;
      const fh = (wPt * aspect) / pageSize.height;
      const m = 36 / pageSize.width, my = 36 / pageSize.height;
      const pos = posSel.value;
      const fx = pos[1] === 'l' ? m : pos[1] === 'c' ? (1 - fw) / 2 : 1 - fw - m;
      const fy = pos[0] === 't' ? my : pos[0] === 'm' ? (1 - fh) / 2 : 1 - fh - my;
      return { fx: clamp(fx, 0, Math.max(0, 1 - fw)), fy: clamp(fy, 0, Math.max(0, 1 - fh)), fw };
    }
    const bPrev = T.btn('Muat Pratinjau', async () => {
      const f = fi.files && fi.files[0];
      if (!f) { T.show(box, errBox('Pilih dulu file PDF.')); return; }
      if (!sigImg) { T.show(box, errBox('Pilih dulu gambar tanda tangan, atau pakai yang terakhir dibuat.')); return; }
      const okJs = await ensurePdfJs();
      if (!okJs) { T.show(box, errBox('Gagal memuat pustaka baca PDF dari CDN. Cek koneksi internet lalu coba lagi.')); return; }
      T.show(box, '<span class="dim">Memuat pratinjau…</span>');
      try {
        const bytes = new Uint8Array(await f.arrayBuffer());
        const jsDoc = await window.pdfjsLib.getDocument({ data: bytes.slice(0) }).promise;
        const n = jsDoc.numPages;
        const targets = parsePages(pgInp.value, n);
        const page = await jsDoc.getPage(targets[0]);
        const vp1 = page.getViewport({ scale: 1 });
        pageSize = { width: vp1.width, height: vp1.height };
        const scale = Math.min(1.5, 900 / vp1.width);
        const vp = page.getViewport({ scale });
        pageCanvas = document.createElement('canvas');
        pageCanvas.width = Math.max(1, Math.round(vp.width));
        pageCanvas.height = Math.max(1, Math.round(vp.height));
        const cx = pageCanvas.getContext('2d');
        cx.fillStyle = '#ffffff'; cx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
        await page.render({ canvasContext: cx, viewport: vp }).promise;
        sigRect = presetRect();
        prevWrap.hidden = false;
        drawPrev();
        T.show(box, '<span class="ok">Pratinjau halaman ' + targets[0] + ' dimuat. Seret tanda tangan bila posisinya kurang pas.</span>');
      } catch (e) { T.show(box, errBox('Pratinjau halaman tidak bisa dimuat. Pastikan file PDF-nya tidak rusak, lalu coba lagi.')); }
    });
    const canvasPos = (e) => {
      const r = prevCanvas.getBoundingClientRect();
      return { fx: (e.clientX - r.left) / r.width, fy: (e.clientY - r.top) / r.height };
    };
    const sigHeightFrac = () => {
      const aspect = sigImg.naturalHeight / sigImg.naturalWidth;
      return (sigRect.fw * pageCanvas.width * aspect) / pageCanvas.height;
    };
    prevCanvas.addEventListener('pointerdown', (e) => {
      if (!sigRect || !sigImg) return;
      const p = canvasPos(e);
      const fh = sigHeightFrac();
      if (p.fx >= sigRect.fx && p.fx <= sigRect.fx + sigRect.fw && p.fy >= sigRect.fy && p.fy <= sigRect.fy + fh) {
        dragging = true;
        dragDx = p.fx - sigRect.fx; dragDy = p.fy - sigRect.fy;
        try { prevCanvas.setPointerCapture(e.pointerId); } catch (err) {}
        e.preventDefault();
      }
    });
    prevCanvas.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const p = canvasPos(e);
      const fh = sigHeightFrac();
      sigRect.fx = clamp(p.fx - dragDx, 0, Math.max(0, 1 - sigRect.fw));
      sigRect.fy = clamp(p.fy - dragDy, 0, Math.max(0, 1 - fh));
      drawPrev();
      e.preventDefault();
    });
    const endDrag = () => { dragging = false; };
    prevCanvas.addEventListener('pointerup', endDrag);
    prevCanvas.addEventListener('pointercancel', endDrag);
    posSel.addEventListener('change', () => { if (pageCanvas && sigImg) { sigRect = presetRect(); drawPrev(); } });
    wInp.addEventListener('change', () => { if (pageCanvas && sigImg) { sigRect = presetRect(); drawPrev(); } });

    const bGo = T.btn('Tempel & Unduh', async () => {
      const f = fi.files && fi.files[0];
      if (!f) { T.show(box, errBox('Pilih dulu file PDF.')); return; }
      if (!sigImg || !sigBytes) { T.show(box, errBox('Pilih dulu gambar tanda tangan, atau pakai yang terakhir dibuat.')); return; }
      const ok = await needLib(); if (!ok) return;
      T.show(box, '<span class="dim">Menempel tanda tangan…</span>');
      try {
        const doc = await loadPdfDoc(f);
        const n = doc.getPageCount();
        const targets = parsePages(pgInp.value, n);
        const img = sigIsPng ? await doc.embedPng(sigBytes) : await doc.embedJpg(sigBytes);
        const aspect = sigImg.naturalHeight / sigImg.naturalWidth;
        for (const p1 of targets) {
          const page = doc.getPage(p1 - 1);
          const { width: W, height: H } = page.getSize();
          let x, y, wPt;
          if (sigRect) {
            wPt = sigRect.fw * W;
            x = sigRect.fx * W;
            y = H - sigRect.fy * H - wPt * aspect;
          } else {
            wPt = mm2pt(clamp(parseNum(wInp.value, 40), 10, 200));
            const m = 36, pos = posSel.value;
            x = pos[1] === 'l' ? m : pos[1] === 'c' ? (W - wPt) / 2 : W - wPt - m;
            y = pos[0] === 't' ? H - m - wPt * aspect : pos[0] === 'm' ? (H - wPt * aspect) / 2 : m;
          }
          page.drawImage(img, { x, y, width: wPt, height: wPt * aspect });
        }
        dlPdf(await doc.save(), 'pdf-ttd.pdf');
        T.show(box, '<span class="ok">Tanda tangan ditempel di ' + targets.length + ' halaman.</span>');
      } catch (e) { T.show(box, errBox('Tanda tangan tidak bisa ditempel. Pastikan file PDF-nya tidak rusak, lalu coba lagi.')); }
    }, true);
    pSign.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Tempel gambar tanda tangan ke halaman PDF. Buat tanda tangan di tool Tanda Tangan, atau unggah gambar yang sudah ada.</p>'));
    pSign.appendChild(fi);
    pSign.appendChild(T.el('<p class="dim" style="font-size:13px;margin:6px 0">Gambar tanda tangan (PNG transparan paling bagus):</p>'));
    pSign.appendChild(sigFi);
    pSign.appendChild(T.row(bFromTool, bMake));
    pSign.appendChild(T.grid2(T.field('Halaman target', pgInp), T.field('Lebar tanda tangan (mm)', wInp)));
    pSign.appendChild(T.field('Posisi awal', posSel));
    pSign.appendChild(T.row(bPrev, bGo));
    pSign.appendChild(box);
    pSign.appendChild(prevWrap);
  }

  /* ============ TAB 13: Potong (Crop) ============ */
  const pCrop = T.el('<div></div>');
  {
    const fi = fileInput('application/pdf'); fi.style.margin = '6px 0';
    const presetSel = T.select([
      ['custom', 'Atur sendiri (isi angka di bawah)'],
      ['m10', 'Potong 10 mm tiap sisi'],
      ['m20', 'Potong 20 mm tiap sisi'],
      ['reset', 'Kembalikan ke ukuran penuh'],
    ], 'custom');
    const mkMm = (ph) => { const i = T.input('text', ph, '0'); i.inputMode = 'decimal'; return i; };
    const lInp = mkMm('0'), rInp = mkMm('0'), tInp = mkMm('0'), bInp = mkMm('0');
    const pgInp = T.input('text', 'semua, atau mis. 1-3,5', 'semua');
    const box = T.out();
    const bGo = T.btn('Potong & Unduh', async () => {
      const f = fi.files && fi.files[0];
      if (!f) { T.show(box, errBox('Pilih dulu file PDF.')); return; }
      const ok = await needLib(); if (!ok) return;
      T.show(box, '<span class="dim">Memotong…</span>');
      try {
        const doc = await loadPdfDoc(f);
        const n = doc.getPageCount();
        const targets = parsePages(pgInp.value, n);
        const preset = presetSel.value;
        for (const p1 of targets) {
          const page = doc.getPage(p1 - 1);
          const mb = page.getMediaBox();
          if (preset === 'reset') { page.setCropBox(mb.x, mb.y, mb.width, mb.height); continue; }
          const mm = preset === 'm10' ? 10 : preset === 'm20' ? 20 : 0;
          const L = mm || parseNum(lInp.value, 0);
          const R = mm || parseNum(rInp.value, 0);
          const Tp = mm || parseNum(tInp.value, 0);
          const B = mm || parseNum(bInp.value, 0);
          const cb = page.getCropBox();
          const nx = cb.x + mm2pt(Math.max(0, L));
          const ny = cb.y + mm2pt(Math.max(0, B));
          const nw = Math.max(10, cb.width - mm2pt(Math.max(0, L)) - mm2pt(Math.max(0, R)));
          const nh = Math.max(10, cb.height - mm2pt(Math.max(0, Tp)) - mm2pt(Math.max(0, B)));
          page.setCropBox(nx, ny, nw, nh);
        }
        dlPdf(await doc.save(), 'pdf-crop.pdf');
        T.show(box, '<span class="ok">Halaman dipotong di ' + targets.length + ' halaman. Isi di luar area potong masih ada di dalam file, hanya tidak ditampilkan.</span>');
      } catch (e) { T.show(box, errBox('Halaman tidak bisa dipotong. Pastikan file PDF-nya tidak rusak, lalu coba lagi.')); }
    }, true);
    pCrop.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Potong pinggiran halaman PDF, misal untuk menghilangkan margin kosong hasil pindaian.</p>'));
    pCrop.appendChild(fi);
    pCrop.appendChild(T.field('Cara potong', presetSel));
    pCrop.appendChild(T.grid2(T.field('Kiri (mm)', lInp), T.field('Kanan (mm)', rInp)));
    pCrop.appendChild(T.grid2(T.field('Atas (mm)', tInp), T.field('Bawah (mm)', bInp)));
    pCrop.appendChild(T.field('Halaman target', pgInp));
    pCrop.appendChild(T.row(bGo));
    pCrop.appendChild(box);
  }

  /* ============ TAB 14: Sensor (Redact) ============ */
  const pRedact = T.el('<div></div>');
  {
    const fi = fileInput('application/pdf'); fi.style.margin = '6px 0';
    const modeSel = T.select([['text', 'Cari kata lalu hapus'], ['area', 'Hapus area (kotak manual)']], 'text');
    const wordsTa = T.ta(2, 'Kata atau kalimat, pisahkan dengan koma. Contoh: Budi Santoso, 08123456789', '');
    const wordsWrap = T.field('Kata yang dihapus', wordsTa, 'Tiap kata dicari di halaman target. Satu baris teks yang mengandung kata itu ikut terhapus seluruhnya.');
    const xInp = T.input('text', '10', '10'); xInp.inputMode = 'decimal';
    const yInp = T.input('text', '10', '10'); yInp.inputMode = 'decimal';
    const wInp = T.input('text', '50', '50'); wInp.inputMode = 'decimal';
    const hInp = T.input('text', '10', '10'); hInp.inputMode = 'decimal';
    const areaRow = T.grid2(T.field('X % (dari kiri)', xInp), T.field('Y % (dari atas)', yInp));
    const areaRow2 = T.grid2(T.field('Lebar %', wInp), T.field('Tinggi %', hInp));
    areaRow.hidden = true; areaRow2.hidden = true;
    modeSel.addEventListener('change', () => {
      const area = modeSel.value === 'area';
      wordsWrap.hidden = area;
      areaRow.hidden = !area; areaRow2.hidden = !area;
    });
    const pgInp = T.input('text', 'semua, atau mis. 1-3,5', 'semua');
    const box = T.out();
    const bGo = T.btn('Hapus & Unduh', async () => {
      // Guard klik ganda: tombol dimatikan SEBELUM await pertama — bila
      // dimatikan sesudah await needLib(), klik kedua lolos karena tombol
      // belum sempat nonaktif (dua proses redact berjalan bersamaan).
      if (bGo.disabled) return;
      bGo.disabled = true;
      try {
        const f = fi.files && fi.files[0];
        if (!f) { T.show(box, errBox('Pilih dulu file PDF.')); return; }
        const ok = await needLib(); if (!ok) return;
        T.show(box, '<span class="dim">Menghapus…</span>');
        const doc = await loadPdfDoc(f);
        const n = doc.getPageCount();
        const targets = parsePages(pgInp.value, n);
        const black = window.PDFLib.rgb(0, 0, 0);
        // Kumpulkan kotak per halaman (dalam poin PDF, asal kiri-bawah).
        const rectsPerHal = new Map(); // p1 -> [{x,y,w,h}]
        const tambahKotak = (p1, r) => {
          if (!rectsPerHal.has(p1)) rectsPerHal.set(p1, []);
          rectsPerHal.get(p1).push(r);
        };
        let rotated = false, terms = [];
        if (modeSel.value === 'area') {
          const xp = clamp(parseNum(xInp.value, 10), 0, 100);
          const yp = clamp(parseNum(yInp.value, 10), 0, 100);
          const wp = clamp(parseNum(wInp.value, 50), 1, 100);
          const hp = clamp(parseNum(hInp.value, 10), 1, 100);
          for (const p1 of targets) {
            const page = doc.getPage(p1 - 1);
            const { width, height } = page.getSize();
            tambahKotak(p1, {
              x: width * xp / 100,
              y: height * (100 - yp - hp) / 100,
              width: width * wp / 100,
              height: height * hp / 100,
            });
          }
        } else {
          terms = wordsTa.value.split(/[,;\n]/).map((s) => s.trim()).filter(Boolean);
          if (!terms.length) { T.show(box, errBox('Isi dulu kata yang mau dihapus.')); return; }
          const okJs = await ensurePdfJs();
          if (!okJs) { T.show(box, errBox('Gagal memuat pustaka baca PDF dari CDN. Cek koneksi internet lalu coba lagi.')); return; }
          const bytes = new Uint8Array(await f.arrayBuffer());
          const jsDoc = await window.pdfjsLib.getDocument({ data: bytes.slice(0) }).promise;
          for (const p1 of targets) {
            const page = doc.getPage(p1 - 1);
            if (page.getRotation().angle % 180 !== 0) rotated = true;
            const jpage = await jsDoc.getPage(p1);
            const tc = await jpage.getTextContent();
            for (const item of tc.items) {
              const s = String(item.str || '');
              if (!terms.some((t) => s.toLowerCase().includes(t.toLowerCase()))) continue;
              const tr = item.transform;
              tambahKotak(p1, { x: tr[4] - 1, y: tr[5] - 1, width: (item.width || 0) + 2, height: (item.height || 0) + 2 });
            }
          }
        }
        let totalKotak = 0;
        rectsPerHal.forEach((rs) => { totalKotak += rs.length; });
        if (!totalKotak) { T.show(box, '<span class="dim">Tidak ada yang dihapus. Coba kata lain atau periksa halaman target.</span>'); return; }
        // 1) Hapus teks dari content stream (redact sejati) per halaman.
        let dihapus = 0, dilewati = 0, diputar = false;
        for (const [p1, rs] of rectsPerHal) {
          const r = await redactHalamanPdf(window.PDFLib, doc, p1 - 1, rs.map((k) => ({ x: k.x, y: k.y, w: k.width, h: k.height })));
          dihapus += r.dihapus;
          dilewati += r.dilewati;
          if (r.diputar) diputar = true;
        }
        // 2) Tempel kotak hitam di atasnya (kepastian visual).
        for (const [p1, rs] of rectsPerHal) {
          const page = doc.getPage(p1 - 1);
          for (const k of rs) page.drawRectangle({ x: k.x, y: k.y, width: k.width, height: k.height, color: black });
        }
        // 2b) Bersihkan kata dari metadata dokumen (/Info + XMP): nama yang
        // disensor tidak boleh tertinggal di Title/Author/Subject/Keywords/
        // Creator — sebelumnya metadata tidak pernah disentuh sehingga klaim
        // "sudah tidak terbaca lagi di dalam file" salah (nama masih terbaca
        // di dialog Properties semua pembaca PDF).
        let metaDibersihkan = 0;
        if (modeSel.value === 'text' && terms.length) {
          const bersihkanNilai = (s) => {
            let out = String(s || '');
            for (const t of terms) out = out.replace(new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '');
            return out.replace(/\s{2,}/g, ' ').trim();
          };
          const kolom = [
            [() => doc.getTitle(), (v) => doc.setTitle(v)],
            [() => doc.getAuthor(), (v) => doc.setAuthor(v)],
            [() => doc.getSubject(), (v) => doc.setSubject(v)],
            [() => doc.getCreator(), (v) => doc.setCreator(v)],
          ];
          for (const [baca, tulis] of kolom) {
            try {
              const lama = baca() || '';
              if (!terms.some((t) => lama.toLowerCase().includes(t.toLowerCase()))) continue;
              tulis(bersihkanNilai(lama));
              metaDibersihkan++;
            } catch (e) { /* kolom tidak ada / tidak bisa dibaca */ }
          }
          try {
            const kw = doc.getKeywords() || '';
            if (terms.some((t) => kw.toLowerCase().includes(t.toLowerCase()))) {
              const bersih = bersihkanNilai(kw);
              doc.setKeywords(bersih ? bersih.split(/\s+/) : []);
              metaDibersihkan++;
            }
          } catch (e) {}
          // XMP bisa berisi salinan metadata yang sama — hapus alirannya.
          try {
            if (doc.catalog.get(window.PDFLib.PDFName.of('Metadata')) !== undefined) {
              doc.catalog.delete(window.PDFLib.PDFName.of('Metadata'));
              metaDibersihkan++;
            }
          } catch (e) {}
        }
        const hasilBytes = await doc.save();
        dlPdf(hasilBytes, 'pdf-sensor.pdf');
        // 3) Verifikasi jujur: baca ulang hasil, pastikan kata target hilang
        //    dari teks halaman DAN metadata.
        let verif = '';
        try {
          const okJs = await ensurePdfJs();
          if (okJs) {
            const jsDoc2 = await window.pdfjsLib.getDocument({ data: new Uint8Array(hasilBytes).slice(0) }).promise;
            if (modeSel.value === 'text') {
              const masihAda = [];
              for (const p1 of targets) {
                const jpage = await jsDoc2.getPage(p1);
                const tc = await jpage.getTextContent();
                const semua = tc.items.map((it) => String(it.str || '')).join(' ');
                for (const t of terms) {
                  if (semua.toLowerCase().includes(t.toLowerCase()) && masihAda.indexOf(t) === -1) masihAda.push(t);
                }
              }
              try {
                const meta2 = await jsDoc2.getMetadata();
                const info2 = (meta2 && meta2.info) || {};
                const nilaiMeta = [info2.Title, info2.Author, info2.Subject, info2.Keywords, info2.Creator].map((v) => String(v || '').toLowerCase());
                for (const t of terms) {
                  if (nilaiMeta.some((v) => v.includes(t.toLowerCase())) && masihAda.indexOf(t) === -1) masihAda.push(t);
                }
              } catch (e) { /* metadata tidak terbaca: abaikan */ }
              verif = masihAda.length
                ? ' Perhatian: ' + masihAda.map((t) => '"' + t + '"').join(', ') + ' masih terbaca di hasil (kemungkinan tersimpan dengan cara yang tidak bisa dihapus tool ini) — bagian itu tetap tertutup kotak hitam.'
                : ' Terverifikasi: kata yang dihapus sudah tidak terbaca lagi di dalam file (teks halaman & metadata sudah diperiksa).';
            } else {
              verif = dihapus > 0 ? ' ' + dihapus + ' potongan teks di dalam kotak terhapus dari file.' : '';
            }
          }
        } catch (e) { /* verifikasi gagal: jangan batalkan unduhan */ }
        const dasar = dihapus > 0
          ? totalKotak + ' area ditutupi kotak hitam & ' + dihapus + ' potongan teks dihapus permanen dari file.'
          : totalKotak + ' area ditutupi kotak hitam.';
        const catatan = (diputar || rotated ? ' Sebagian halaman diputar, jadi teks di halaman itu hanya ditutupi kotak hitam (tidak dihapus dari file).' : '') +
          (dilewati ? ' ' + dilewati + ' bagian file tidak bisa diproses (format khusus) dan hanya ditutupi kotak hitam.' : '') +
          (metaDibersihkan ? ' Metadata dokumen (' + metaDibersihkan + ' kolom) ikut dibersihkan dari kata itu.' : '');
        T.show(box, '<span class="ok">' + dasar + verif + catatan + '</span>');
      } catch (e) { T.show(box, errBox('Kata tidak bisa dihapus. Pastikan file PDF-nya tidak rusak, lalu coba lagi.')); }
      finally { bGo.disabled = false; }
    }, true);
    pRedact.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Hapus kata atau area sensitif dari PDF sebelum dibagikan — teksnya benar-benar dihapus dari dalam file (bukan cuma ditutupi), lalu ditambah kotak hitam supaya tidak ada bekasnya. Hasilnya diperiksa ulang otomatis sebelum dilaporkan.</p>'));
    pRedact.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Batasan: teks di dalam gambar hasil pindaian (scan), anotasi, dan halaman yang diputar tidak bisa dihapus total — bagian itu hanya ditutupi kotak hitam. Metadata dokumen (judul, penulis, subjek, kata kunci) ikut dibersihkan dari kata yang dihapus bila memakai mode cari kata. Bila kata masih terbaca setelah proses, tool akan bilang terus terang.</p>'));
    pRedact.appendChild(fi);
    pRedact.appendChild(T.field('Cara menghapus', modeSel));
    pRedact.appendChild(wordsWrap);
    pRedact.appendChild(areaRow);
    pRedact.appendChild(areaRow2);
    pRedact.appendChild(T.field('Halaman target', pgInp));
    pRedact.appendChild(T.row(bGo));
    pRedact.appendChild(box);
  }

  /* ============ TAB 15: PDF ke Teks ============ */
  const pPdfText = T.el('<div></div>');
  {
    const fi = fileInput('application/pdf'); fi.style.margin = '6px 0';
    const pgInp = T.input('text', 'semua, atau mis. 1-3,5', 'semua');
    const box = T.out();
    const pre = T.el('<pre style="white-space:pre-wrap;word-break:break-word;font-size:13px;line-height:1.6;background:#141210;border:1px solid #ffffff20;border-radius:10px;padding:12px;max-height:320px;overflow:auto;margin:12px 0"></pre>');
    pre.hidden = true;
    let fullText = '';
    const bDl = T.btn('Unduh TXT', () => { if (fullText) dlText(fullText, 'pdf-teks.txt'); });
    const bCopy = T.copyBtn(() => fullText, 'Salin Teks');
    bDl.hidden = true; bCopy.hidden = true;
    const bGo = T.btn('Ambil Teks', async () => {
      const f = fi.files && fi.files[0];
      if (!f) { T.show(box, errBox('Pilih dulu file PDF.')); return; }
      const okJs = await ensurePdfJs();
      if (!okJs) { T.show(box, errBox('Gagal memuat pustaka baca PDF dari CDN. Cek koneksi internet lalu coba lagi.')); return; }
      T.show(box, '<span class="dim">Membaca PDF…</span>');
      pre.hidden = true; bDl.hidden = true; bCopy.hidden = true;
      try {
        const bytes = new Uint8Array(await f.arrayBuffer());
        const jsDoc = await window.pdfjsLib.getDocument({ data: bytes.slice(0) }).promise;
        const n = jsDoc.numPages;
        const targets = parsePages(pgInp.value, n);
        const parts = [];
        for (const p1 of targets) {
          T.show(box, '<span class="dim">Membaca halaman ' + p1 + '/' + n + '…</span>');
          const page = await jsDoc.getPage(p1);
          const tc = await page.getTextContent();
          let t = '';
          for (const item of tc.items) {
            t += item.str;
            t += item.hasEOL ? '\n' : ' ';
          }
          parts.push('--- Halaman ' + p1 + ' ---\n' + t.trim());
        }
        fullText = parts.join('\n\n');
        pre.textContent = fullText.trim() ? fullText : '(tidak ada teks yang bisa dibaca di halaman ini)';
        pre.hidden = false;
        bDl.hidden = false; bCopy.hidden = false;
        T.show(box, '<span class="ok">Teks dari ' + targets.length + ' halaman berhasil diambil.</span>');
      } catch (e) { T.show(box, errBox('Teks tidak bisa diambil dari PDF ini. Mungkin halamannya hanya berisi gambar (hasil scan) — coba tool OCR.')); }
    }, true);
    pPdfText.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Ambil semua teks dari PDF untuk disalin atau disimpan. PDF hasil pindaian (foto halaman) tidak punya teks, jadi hasilnya kosong.</p>'));
    pPdfText.appendChild(fi);
    pPdfText.appendChild(T.field('Halaman target', pgInp));
    pPdfText.appendChild(T.row(bGo, bDl, bCopy));
    pPdfText.appendChild(box);
    pPdfText.appendChild(pre);
  }

  /* ============ TAB 16: Ambil Gambar ============ */
  const pImgOut = T.el('<div></div>');
  {
    const fi = fileInput('application/pdf'); fi.style.margin = '6px 0';
    const box = T.out();
    const grid = T.el('<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px;margin:12px 0"></div>');
    let pics = [];
    const bZip = T.btn('Unduh Semua (ZIP)', async () => {
      if (!pics.length) return;
      const ok = await ensureJsZip();
      if (!ok) { T.show(box, errBox('Gagal memuat pustaka ZIP dari CDN. Cek koneksi internet lalu coba lagi.')); return; }
      T.show(box, '<span class="dim">Menyiapkan ZIP…</span>');
      try {
        const zip = new window.JSZip();
        pics.forEach((s) => zip.file(s.name, s.blob));
        const blob = await zip.generateAsync({ type: 'blob' });
        dlBlob(blob, 'pdf-gambar-ekstrak.zip');
        T.show(box, '<span class="ok">ZIP terunduh (' + pics.length + ' gambar).</span>');
      } catch (e) { T.show(box, errBox('ZIP tidak bisa dibuat. Coba lagi, atau unduh gambarnya satu per satu.')); }
    });
    bZip.hidden = true;
    const bGo = T.btn('Cari Gambar', async () => {
      const f = fi.files && fi.files[0];
      if (!f) { T.show(box, errBox('Pilih dulu file PDF.')); return; }
      const okJs = await ensurePdfJs();
      if (!okJs) { T.show(box, errBox('Gagal memuat pustaka baca PDF dari CDN. Cek koneksi internet lalu coba lagi.')); return; }
      T.show(box, '<span class="dim">Membaca PDF…</span>');
      grid.innerHTML = '';
      pics = [];
      bZip.hidden = true;
      try {
        const bytes = new Uint8Array(await f.arrayBuffer());
        const jsDoc = await window.pdfjsLib.getDocument({ data: bytes.slice(0) }).promise;
        const n = jsDoc.numPages;
        const OPS = window.pdfjsLib.OPS;
        const seen = new Set();
        for (let i = 1; i <= n; i++) {
          T.show(box, '<span class="dim">Memeriksa halaman ' + i + '/' + n + '…</span>');
          const page = await jsDoc.getPage(i);
          const ops = await page.getOperatorList();
          let k = 0;
          for (let o = 0; o < ops.fnArray.length; o++) {
            if (ops.fnArray[o] !== OPS.paintImageXObject) continue;
            const name = ops.argsArray[o][0];
            let img;
            try { img = page.objs.get(name); } catch (e) { continue; }
            if (!img || !img.width || !img.height || !img.data) continue;
            let sum = 0;
            const d = img.data;
            const step = Math.max(1, Math.floor(d.length / 64));
            for (let q = 0; q < d.length; q += step) sum = (sum + d[q]) % 1000003;
            const key = img.width + 'x' + img.height + ':' + d.length + ':' + sum;
            if (seen.has(key)) continue;
            seen.add(key);
            k++;
            const canvas = document.createElement('canvas');
            canvas.width = img.width; canvas.height = img.height;
            try {
              const imageData = new ImageData(new Uint8ClampedArray(img.data), img.width, img.height);
              canvas.getContext('2d').putImageData(imageData, 0, 0);
            } catch (e) { continue; }
            const blob = await canvasToBlobP(canvas, 'image/png');
            const nm = 'gambar-h' + i + '-' + k + '.png';
            pics.push({ blob, name: nm });
            const card = T.el('<div style="border:1px solid #ffffff20;border-radius:10px;padding:8px;text-align:center;background:#141210"></div>');
            canvas.style.cssText = 'width:100%;height:auto;border-radius:6px;background:#fff';
            card.appendChild(canvas);
            card.appendChild(T.el('<div class="dim" style="font-size:12px;margin:6px 0">Halaman ' + i + ' · ' + img.width + 'x' + img.height + '</div>'));
            const bDl = T.btn('Unduh', () => dlBlob(blob, nm));
            bDl.classList.add('small'); bDl.style.padding = '4px 8px';
            card.appendChild(bDl);
            grid.appendChild(card);
          }
        }
        if (!pics.length) { T.show(box, '<span class="dim">Tidak ada gambar yang ditemukan di PDF ini.</span>'); return; }
        bZip.hidden = false;
        T.show(box, '<span class="ok">' + pics.length + ' gambar ditemukan.</span>');
      } catch (e) { T.show(box, errBox('Gambar tidak bisa diambil dari PDF ini. Pastikan filenya tidak rusak, lalu coba lagi.')); }
    }, true);
    pImgOut.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Ambil semua gambar yang tertanam di PDF, satu per satu atau sekaligus dalam ZIP. Gambar yang sama di beberapa halaman hanya diambil sekali.</p>'));
    pImgOut.appendChild(fi);
    pImgOut.appendChild(T.row(bGo, bZip));
    pImgOut.appendChild(box);
    pImgOut.appendChild(grid);
  }

  /* ============ TAB 17: Kompres ke Target KB ============ */
  const pTarget = T.el('<div></div>');
  {
    const fi = fileInput('application/pdf'); fi.style.margin = '6px 0';
    const tInp = T.input('text', '500', '500'); tInp.inputMode = 'decimal';
    const box = T.out();
    const bGo = T.btn('Kompres ke Target & Unduh', async () => {
      const f = fi.files && fi.files[0];
      if (!f) { T.show(box, errBox('Pilih dulu file PDF.')); return; }
      const ok = await needLib(); if (!ok) return;
      const target = Math.max(10, Math.floor(parseNum(tInp.value, 500))) * 1024;
      const origBytes = new Uint8Array(await f.arrayBuffer());
      if (origBytes.length <= target) {
        T.show(box, '<span class="ok">File ini sudah ' + fmtSize(origBytes.length) + ', di bawah target ' + fmtSize(target) + '. Tidak perlu dikompres.</span>');
        return;
      }
      const tries = [
        { q: 0.8, s: 1 }, { q: 0.6, s: 1 }, { q: 0.45, s: 1 }, { q: 0.3, s: 1 },
        { q: 0.18, s: 1 }, { q: 0.5, s: 0.6 }, { q: 0.3, s: 0.6 }, { q: 0.18, s: 0.4 },
      ];
      let best = null, noImages = false;
      try {
        for (let i = 0; i < tries.length; i++) {
          const t = tries[i];
          T.show(box, '<span class="dim">Percobaan ' + (i + 1) + ' dari ' + tries.length + '…</span>');
          const doc = await window.PDFLib.PDFDocument.load(origBytes.slice(0), { ignoreEncryption: true });
          const st = await trueCompressDoc(doc, t.q, t.s);
          if (i === 0 && st.total === 0) { noImages = true; break; }
          const bytes = new Uint8Array(await doc.save());
          if (!best || bytes.length < best.length) best = bytes;
          if (bytes.length <= target) break;
        }
        if (noImages || !best) {
          T.show(box, '<span class="dim">PDF ini tidak punya gambar yang bisa dikecilkan dengan cara ini, jadi ukurannya tidak bisa turun. Coba mode "Ubah halaman jadi gambar" di tab Kompres bila tetap perlu file lebih kecil (teks jadi tidak bisa dipilih).</span>');
          return;
        }
        if (best.length >= origBytes.length) {
          T.show(box, '<span class="dim">Gambar di PDF ini sudah padat, tidak ada percobaan yang membuat file lebih kecil. Coba mode "Ubah halaman jadi gambar" di tab Kompres bila tetap perlu file lebih kecil.</span>');
          return;
        }
        dlPdf(best, 'pdf-target.pdf');
        const reached = best.length <= target;
        T.show(box, '<span class="ok">' + fmtSize(origBytes.length) + ' menjadi ' + fmtSize(best.length) + (reached ? ' (target tercapai).' : ' (target ' + fmtSize(target) + ' tidak tercapai, ini hasil terkecil yang didapat; teks tetap bisa dipilih).') + '</span>');
      } catch (e) { T.show(box, errBox('Tidak bisa mengompres PDF ini ke ukuran target. Pastikan filenya tidak rusak, lalu coba lagi.')); }
    }, true);
    pTarget.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Tentukan ukuran target, alat ini mencoba beberapa tingkat kualitas sampai file di bawah target. Teks tetap bisa dipilih. Tidak semua file bisa sampai target, hasilnya tetap diunduh yang terkecil.</p>'));
    pTarget.appendChild(fi);
    pTarget.appendChild(T.field('Target ukuran (KB)', tInp, 'Contoh: 500 untuk file maksimal 500 KB.'));
    pTarget.appendChild(T.row(bGo));
    pTarget.appendChild(box);
  }

  /* ============ TAB 18: Form Baru ============ */
  const pFormNew = T.el('<div></div>');
  {
    const fi = fileInput('application/pdf'); fi.style.margin = '6px 0';
    const list = T.el('<div style="display:grid;gap:10px;margin:12px 0"></div>');
    const box = T.out();
    let rows = [];
    const addRow = (kind) => {
      const idx = rows.length + 1;
      const nameInp = T.input('text', 'Nama kolom, mis. nama_lengkap', kind === 'text' ? 'isian_' + idx : kind === 'check' ? 'centang_' + idx : 'pilihan_' + idx);
      const pgInp = T.input('text', '1', '1'); pgInp.inputMode = 'decimal';
      const xInp = T.input('text', '10', '10'); xInp.inputMode = 'decimal';
      const yInp = T.input('text', '50', '50'); yInp.inputMode = 'decimal';
      const wInp = T.input('text', kind === 'check' ? '6' : '60', kind === 'check' ? '6' : '60'); wInp.inputMode = 'decimal';
      const optTa = kind === 'select' ? T.ta(2, 'Satu pilihan per baris', 'Ya\nTidak') : null;
      const row = T.el('<div style="border:1px solid #ffffff20;border-radius:10px;padding:10px;display:grid;gap:8px"></div>');
      const head = T.el('<div style="display:flex;justify-content:space-between;align-items:center;font-size:13px"></div>');
      head.appendChild(T.el('<b>' + (kind === 'text' ? 'Kolom isian teks' : kind === 'check' ? 'Kotak centang' : 'Pilihan (dropdown)') + '</b>'));
      const bDel = T.btn('Hapus', () => { rows = rows.filter((r) => r.el !== row); row.remove(); });
      bDel.classList.add('small'); bDel.style.padding = '4px 8px';
      head.appendChild(bDel);
      row.appendChild(head);
      row.appendChild(T.field('Nama kolom', nameInp, 'Nama ini yang muncul sebagai nama field di PDF.'));
      if (optTa) row.appendChild(T.field('Pilihan', optTa, 'Satu pilihan per baris.'));
      row.appendChild(T.grid2(T.field('Halaman', pgInp), T.field(kind === 'check' ? 'Ukuran (mm)' : 'Lebar (mm)', wInp)));
      row.appendChild(T.grid2(T.field('X % (dari kiri)', xInp), T.field('Y % (dari bawah)', yInp)));
      list.appendChild(row);
      rows.push({ kind, el: row, nameInp, pgInp, xInp, yInp, wInp, optTa });
    };
    const bAddT = T.btn('Tambah Kolom Teks', () => addRow('text'));
    const bAddC = T.btn('Tambah Kotak Centang', () => addRow('check'));
    const bAddS = T.btn('Tambah Pilihan', () => addRow('select'));
    const bGo = T.btn('Buat Form & Unduh', async () => {
      const f = fi.files && fi.files[0];
      if (!f) { T.show(box, errBox('Pilih dulu file PDF.')); return; }
      if (!rows.length) { T.show(box, errBox('Tambah dulu minimal satu kolom.')); return; }
      const ok = await needLib(); if (!ok) return;
      T.show(box, '<span class="dim">Membuat form…</span>');
      try {
        const doc = await loadPdfDoc(f);
        const n = doc.getPageCount();
        const form = doc.getForm();
        const font = await doc.embedFont(window.PDFLib.StandardFonts.Helvetica);
        const names = new Set();
        for (const r of rows) {
          const name = r.nameInp.value.trim();
          if (!name) throw new Error('Ada kolom yang namanya kosong.');
          if (names.has(name)) throw new Error('Nama kolom "' + name + '" dipakai dua kali.');
          names.add(name);
          const p1 = clamp(Math.floor(parseNum(r.pgInp.value, 1)), 1, n);
          const page = doc.getPage(p1 - 1);
          const { width: W, height: H } = page.getSize();
          const x = clamp(parseNum(r.xInp.value, 10), 0, 100) / 100 * W;
          const y = clamp(parseNum(r.yInp.value, 50), 0, 100) / 100 * H;
          if (r.kind === 'text') {
            const w = mm2pt(clamp(parseNum(r.wInp.value, 60), 10, 200));
            const fld = form.createTextField(name);
            fld.addToPage(page, { x, y, width: w, height: 22, textColor: window.PDFLib.rgb(0, 0, 0), borderColor: window.PDFLib.rgb(0.6, 0.6, 0.6), borderWidth: 1 });
          } else if (r.kind === 'select') {
            const w = mm2pt(clamp(parseNum(r.wInp.value, 60), 10, 200));
            const opts = (r.optTa ? r.optTa.value : '').split('\n').map((s) => s.trim()).filter(Boolean);
            if (!opts.length) throw new Error('Pilihan "' + name + '" masih kosong.');
            const fld = form.createDropdown(name);
            fld.addOptions(opts);
            fld.addToPage(page, { x, y, width: w, height: 22, textColor: window.PDFLib.rgb(0, 0, 0), borderColor: window.PDFLib.rgb(0.6, 0.6, 0.6), borderWidth: 1 });
          } else {
            const s = mm2pt(clamp(parseNum(r.wInp.value, 6), 3, 30));
            const fld = form.createCheckBox(name);
            fld.addToPage(page, { x, y, width: s, height: s, borderColor: window.PDFLib.rgb(0.6, 0.6, 0.6), borderWidth: 1 });
          }
        }
        form.updateFieldAppearances(font);
        dlPdf(await doc.save(), 'pdf-form-baru.pdf');
        T.show(box, '<span class="ok">Form dibuat (' + rows.length + ' kolom) & terunduh. Buka di pembaca PDF untuk mengisinya.</span>');
      } catch (e) { T.show(box, errBox('Form baru tidak bisa dibuat. Periksa isi kolomnya, lalu coba lagi.')); }
    }, true);
    pFormNew.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Buat kolom isian di PDF yang masih kosong: kolom teks untuk diisi tulisan, kotak centang untuk dicentang, dan pilihan dropdown. Hasilnya bisa diisi di pembaca PDF atau di tab Form.</p>'));
    pFormNew.appendChild(fi);
    pFormNew.appendChild(T.row(bAddT, bAddC, bAddS));
    pFormNew.appendChild(list);
    pFormNew.appendChild(T.row(bGo));
    pFormNew.appendChild(box);
    addRow('text');
  }

  /* ============ TAB 19: Susun (N-up / Booklet / Balik) ============ */
  const pArrange = T.el('<div></div>');
  {
    const fi = fileInput('application/pdf'); fi.style.margin = '6px 0';
    const modeSel = T.select([
      ['2up', '2 halaman per lembar'],
      ['4up', '4 halaman per lembar'],
      ['booklet', 'Booklet (lipat jadi buku kecil)'],
      ['reverse', 'Balik urutan halaman'],
    ], '2up');
    const box = T.out();
    const bGo = T.btn('Susun & Unduh', async () => {
      const f = fi.files && fi.files[0];
      if (!f) { T.show(box, errBox('Pilih dulu file PDF.')); return; }
      const ok = await needLib(); if (!ok) return;
      T.show(box, '<span class="dim">Menyusun…</span>');
      try {
        const src = await loadPdfDoc(f);
        const n = src.getPageCount();
        const out = await window.PDFLib.PDFDocument.create();
        const mode = modeSel.value;
        if (mode === 'reverse') {
          const idx = Array.from({ length: n }, (_, i) => n - 1 - i);
          const pages = await out.copyPages(src, idx);
          pages.forEach((p) => out.addPage(p));
        } else if (mode === 'booklet') {
          const total = Math.ceil(n / 4) * 4;
          const order = [];
          for (let s = 0; s < total / 4; s++) {
            order.push(total - 2 * s, 1 + 2 * s, 2 + 2 * s, total - 1 - 2 * s);
          }
          const first = src.getPage(0);
          const { width: W, height: H } = first.getSize();
          for (let i = 0; i < order.length; i += 2) {
            const sheet = out.addPage([W * 2, H]);
            for (let k = 0; k < 2; k++) {
              const p1 = order[i + k];
              if (p1 < 1 || p1 > n) continue;
              const emb = await out.embedPage(src.getPage(p1 - 1));
              sheet.drawPage(emb, { x: k * W, y: 0 });
            }
          }
        } else {
          const per = mode === '4up' ? 4 : 2;
          const first = src.getPage(0);
          const { width: W, height: H } = first.getSize();
          const cols = 2, rowsN = per === 4 ? 2 : 1;
          for (let i = 0; i < n; i += per) {
            const sheet = out.addPage([W * cols, H * rowsN]);
            for (let k = 0; k < per && i + k < n; k++) {
              const emb = await out.embedPage(src.getPage(i + k));
              const col = k % cols;
              const row = Math.floor(k / cols);
              sheet.drawPage(emb, { x: col * W, y: (rowsN - 1 - row) * H });
            }
          }
        }
        dlPdf(await out.save(), 'pdf-susun.pdf');
        T.show(box, '<span class="ok">Berhasil disusun & terunduh.' + (mode === 'booklet' ? ' Cetak bolak-balik lalu lipat di tengah.' : '') + '</span>');
      } catch (e) { T.show(box, errBox('Halaman tidak bisa disusun. Pastikan file PDF-nya tidak rusak, lalu coba lagi.')); }
    }, true);
    pArrange.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Susun ulang halaman: beberapa halaman dalam satu lembar untuk hemat kertas, booklet untuk dilipat jadi buku kecil, atau balik urutan. Ukuran lembar mengikuti halaman pertama.</p>'));
    pArrange.appendChild(fi);
    pArrange.appendChild(T.field('Cara menyusun', modeSel));
    pArrange.appendChild(T.row(bGo));
    pArrange.appendChild(box);
  }

  /* ============ TAB 20: Info ============ */
  const pInfo = T.el('<div></div>');
  {
    const fi = fileInput('application/pdf'); fi.style.margin = '6px 0';
    const box = T.out();
    const bGo = T.btn('Lihat Info', async () => {
      const f = fi.files && fi.files[0];
      if (!f) { T.show(box, errBox('Pilih dulu file PDF.')); return; }
      const ok = await needLib(); if (!ok) return;
      T.show(box, '<span class="dim">Membaca info…</span>');
      try {
        const bytes = new Uint8Array(await f.arrayBuffer());
        const doc = await window.PDFLib.PDFDocument.load(bytes.slice(0), { ignoreEncryption: true });
        const L = window.PDFLib;
        const fonts = new Set();
        for (let i = 0; i < doc.getPageCount(); i++) {
          try {
            const res = doc.getPage(i).node.Resources();
            if (!res) continue;
            const fontDict = res.lookup(L.PDFName.of('Font'));
            if (!fontDict || typeof fontDict.entries !== 'function') continue;
            for (const [, ref] of fontDict.entries()) {
              try {
                const fd = doc.context.lookup(ref);
                const base = fd && fd.get && fd.get(L.PDFName.of('BaseFont'));
                if (base) fonts.add(String(base).replace(/^[/#]/, '').replace(/^.*\+/, ''));
              } catch (e) {}
            }
          } catch (e) {}
        }
        let outlineHtml = '<span class="dim">(tidak ada penanda)</span>';
        let version = '';
        try {
          const okJs = await ensurePdfJs();
          if (okJs) {
            const jsDoc = await window.pdfjsLib.getDocument({ data: bytes.slice(0) }).promise;
            try {
              const md = await jsDoc.getMetadata();
              if (md && md.info && md.info.PDFFormatVersion) version = md.info.PDFFormatVersion;
            } catch (e) {}
            try {
              const outline = await jsDoc.getOutline();
              if (outline && outline.length) {
                const renderItems = (items, depth) => items.map((it) => {
                  const kids = it.items && it.items.length ? renderItems(it.items, depth + 1) : '';
                  return '<div style="padding-left:' + (depth * 16) + 'px;font-size:13px;line-height:1.9">' + T.esc(it.title || '(tanpa judul)') + '</div>' + kids;
                }).join('');
                outlineHtml = renderItems(outline, 0);
              }
            } catch (e) {}
          }
        } catch (e) {}
        const fmtDate = (d) => { try { return d ? d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '(tidak ada)'; } catch (e) { return '(tidak ada)'; } };
        const sizes = [];
        for (let i = 0; i < Math.min(doc.getPageCount(), 3); i++) {
          const s = doc.getPage(i).getSize();
          sizes.push(Math.round(s.width) + ' x ' + Math.round(s.height) + ' pt');
        }
        T.show(box,
          '<div class="kv"><span class="k">Nama file</span><span class="v">' + T.esc(fileName(f)) + '</span></div>' +
          '<div class="kv"><span class="k">Ukuran file</span><span class="v">' + fmtSize(f.size) + '</span></div>' +
          '<div class="kv"><span class="k">Versi PDF</span><span class="v">' + T.esc(version || '(tidak terdeteksi)') + '</span></div>' +
          '<div class="kv"><span class="k">Halaman</span><span class="v">' + doc.getPageCount() + '</span></div>' +
          '<div class="kv"><span class="k">Ukuran halaman</span><span class="v">' + sizes.join(', ') + (doc.getPageCount() > 3 ? '…' : '') + '</span></div>' +
          '<div class="kv"><span class="k">Judul</span><span class="v">' + T.esc(doc.getTitle() || '(kosong)') + '</span></div>' +
          '<div class="kv"><span class="k">Penulis</span><span class="v">' + T.esc(doc.getAuthor() || '(kosong)') + '</span></div>' +
          '<div class="kv"><span class="k">Subjek</span><span class="v">' + T.esc(doc.getSubject() || '(kosong)') + '</span></div>' +
          '<div class="kv"><span class="k">Pembuat</span><span class="v">' + T.esc(doc.getCreator() || '(kosong)') + '</span></div>' +
          '<div class="kv"><span class="k">Dibuat</span><span class="v">' + fmtDate(doc.getCreationDate()) + '</span></div>' +
          '<div class="kv"><span class="k">Diubah</span><span class="v">' + fmtDate(doc.getModificationDate()) + '</span></div>' +
          '<div class="kv"><span class="k">Huruf yang dipakai</span><span class="v">' + (fonts.size ? [...fonts].map(T.esc).join(', ') : '(tidak terdeteksi)') + '</span></div>' +
          '<div style="margin-top:12px;font-size:13px"><b>Penanda (daftar isi)</b></div>' + outlineHtml);
      } catch (e) { T.show(box, errBox('Info file ini tidak bisa dibaca. Pastikan filenya benar-benar PDF dan tidak rusak.')); }
    }, true);
    pInfo.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Lihat isi dalam PDF: info dokumen, huruf yang dipakai, dan daftar penanda.</p>'));
    pInfo.appendChild(fi);
    pInfo.appendChild(T.row(bGo));
    pInfo.appendChild(box);
  }

  /* ============ TAB 21: Banding ============ */
  const pDiff = T.el('<div></div>');
  {
    const fiA = fileInput('application/pdf'); fiA.style.margin = '6px 0';
    const fiB = fileInput('application/pdf'); fiB.style.margin = '6px 0';
    const box = T.out();
    const pre = T.el('<div style="font-size:13px;line-height:1.7;background:#141210;border:1px solid #ffffff20;border-radius:10px;padding:10px 0;max-height:360px;overflow:auto;margin:12px 0"></div>');
    pre.hidden = true;
    let hasilTerakhir = null;
    let teksDiff = '';
    const bDl = T.btn('Unduh TXT', () => { if (teksDiff) dlText(teksDiff, 'banding-pdf.txt'); });
    const bCopy = T.copyBtn(() => teksDiff, 'Salin Hasil');
    bDl.hidden = true; bCopy.hidden = true;
    const cekSama = T.el('<label style="display:flex;align-items:center;gap:8px;font-size:13px;margin:8px 0;cursor:pointer"><input type="checkbox" style="width:18px;height:18px;flex:none"> Tampilkan baris yang sama</label>');
    const cbSama = cekSama.querySelector('input');

    // Gambar ulang hasil diff. Teks PDF ditulis lewat textContent,
    // bukan innerHTML, supaya isi PDF tidak bisa menyuntik markup.
    const gambarDiff = () => {
      if (!hasilTerakhir) return;
      const tampilSama = cbSama.checked;
      pre.textContent = '';
      let samaLewat = 0;
      const sisipPenanda = () => {
        if (!samaLewat) return;
        const penanda = document.createElement('div');
        penanda.style.cssText = 'padding:4px 10px;color:#9d968c;font-size:12px;';
        penanda.textContent = '... ' + samaLewat + ' baris yang sama disembunyikan ...';
        pre.appendChild(penanda);
        samaLewat = 0;
      };
      for (const r of hasilTerakhir.diff.baris) {
        if (r.t === '=' && !tampilSama) { samaLewat++; continue; }
        sisipPenanda();
        const div = document.createElement('div');
        // Merah = hanya di A, hijau = hanya di B (warna fungsi saja).
        // Tanda - dan + di depan baris membawa artinya sendiri,
        // jadi maknanya tidak bergantung pada warna.
        div.style.cssText = 'padding:1px 10px;white-space:pre-wrap;word-break:break-word;' + (r.t === '-' ? 'background:#ff555522;color:#ffb4b4;' : r.t === '+' ? 'background:#4ade8022;color:#b7f5c8;' : 'color:#c9c4bc;');
        div.textContent = (r.t === '=' ? '  ' : r.t + ' ') + r.s;
        pre.appendChild(div);
      }
      sisipPenanda();
      pre.hidden = false;
    };
    cbSama.addEventListener('change', gambarDiff);

    const ambilTeks = async (file, label) => {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const jsDoc = await window.pdfjsLib.getDocument({ data: bytes.slice(0) }).promise;
      const bagian = [];
      for (let p1 = 1; p1 <= jsDoc.numPages; p1++) {
        T.show(box, '<span class="dim">Membaca ' + label + ', halaman ' + p1 + '/' + jsDoc.numPages + '…</span>');
        const page = await jsDoc.getPage(p1);
        const tc = await page.getTextContent();
        let t = '';
        for (const item of tc.items) {
          t += item.str;
          t += item.hasEOL ? '\n' : ' ';
        }
        bagian.push(t);
      }
      return bagian.join('\n');
    };

    const bGo = T.btn('Bandingkan', async () => {
      const fA = fiA.files && fiA.files[0];
      const fB = fiB.files && fiB.files[0];
      if (!fA || !fB) { T.show(box, errBox('Pilih dulu dua file PDF.')); return; }
      const okJs = await ensurePdfJs();
      if (!okJs) { T.show(box, errBox('Gagal memuat pustaka baca PDF dari CDN. Cek koneksi internet lalu coba lagi.')); return; }
      T.show(box, '<span class="dim">Membaca kedua PDF…</span>');
      pre.hidden = true; bDl.hidden = true; bCopy.hidden = true;
      hasilTerakhir = null; teksDiff = '';
      try {
        const teksA = await ambilTeks(fA, 'PDF A');
        const teksB = await ambilTeks(fB, 'PDF B');
        const barisA = normalisasiBaris(teksA);
        const barisB = normalisasiBaris(teksB);
        if (!barisA.length || !barisB.length) {
          const kosong = !barisA.length ? fileName(fA) : fileName(fB);
          T.show(box, errBox('Tidak ada teks yang bisa dibaca di ' + kosong + '. PDF hasil pindaian (foto halaman) tidak punya teks, jadi tidak bisa dibandingkan.'));
          return;
        }
        const diff = diffBaris(barisA, barisB);
        hasilTerakhir = { diff };
        teksDiff = diff.baris.map((r) => (r.t === '=' ? '  ' : r.t + ' ') + r.s).join('\n');
        let sama = 0, hapus = 0, tambah = 0;
        for (const r of diff.baris) { if (r.t === '=') sama++; else if (r.t === '-') hapus++; else tambah++; }
        gambarDiff();
        bDl.hidden = false; bCopy.hidden = false;
        const namaA = fileName(fA), namaB = fileName(fB);
        T.show(box, '<span class="ok">Selesai: ' + sama + ' baris sama, ' + hapus + ' baris hanya ada di ' + T.esc(namaA) + ', ' + tambah + ' baris hanya ada di ' + T.esc(namaB) + '.' + (diff.terpotong ? ' Dokumen terlalu panjang, hanya 2000 baris pertama per file yang dibandingkan.' : '') + '</span>');
      } catch (e) { T.show(box, errBox('Kedua file tidak bisa dibandingkan. Pastikan keduanya file PDF atau teks yang tidak rusak, lalu coba lagi.')); }
    }, true);
    pDiff.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Bandingkan isi teks dua PDF, baris per baris. Yang dibandingkan adalah teksnya, bukan tampilan visual halamannya. PDF hasil pindaian (foto halaman) tidak punya teks, jadi tidak bisa dibandingkan.</p>'));
    pDiff.appendChild(T.field('PDF pertama (A)', fiA));
    pDiff.appendChild(T.field('PDF kedua (B)', fiB));
    pDiff.appendChild(cekSama);
    pDiff.appendChild(T.row(bGo, bDl, bCopy));
    pDiff.appendChild(box);
    pDiff.appendChild(pre);
  }

  /* ============ TAB 22: Corat-coret (anotasi freehand) ============ */
  const pDraw = T.el('<div></div>');
  {
    const fi = fileInput('application/pdf'); fi.style.margin = '6px 0';
    const pgInp = T.input('text', '1', '1'); pgInp.inputMode = 'decimal';
    const tebalSel = T.select([['2', 'Tipis'], ['4', 'Sedang'], ['7', 'Tebal']], '4');
    const warnaSel = T.select([['#d62626', 'Merah'], ['#111111', 'Hitam'], ['#1a3fd6', 'Biru'], ['#0a7a2f', 'Hijau']], '#d62626');
    const box = T.out();
    const stage = T.el('<div style="position:relative;margin:12px 0;display:none"></div>');
    const base = document.createElement('canvas'); // render halaman
    base.style.cssText = 'width:100%;height:auto;display:block;border-radius:10px;background:#fff';
    const over = document.createElement('canvas'); // coretan
    over.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;touch-action:none;cursor:crosshair';
    stage.appendChild(base);
    stage.appendChild(over);
    let srcBytes = null, pageCount = 0, pageNo = 1, scale = 1, pageW = 0, pageH = 0;
    let strokes = []; // [{titik:[[x,y]...] dalam poin PDF (y dari atas), tebal (pt), warna}]
    let aktif = null;

    const gambarUlang = () => {
      const ox = over.getContext('2d');
      ox.clearRect(0, 0, over.width, over.height);
      ox.lineCap = 'round'; ox.lineJoin = 'round';
      const gambarSatu = (s) => {
        if (s.titik.length < 2) return;
        ox.strokeStyle = s.warna;
        ox.lineWidth = s.tebal * scale;
        ox.beginPath();
        ox.moveTo(s.titik[0][0] * scale, s.titik[0][1] * scale);
        for (let i = 1; i < s.titik.length; i++) ox.lineTo(s.titik[i][0] * scale, s.titik[i][1] * scale);
        ox.stroke();
      };
      strokes.forEach(gambarSatu);
      if (aktif) gambarSatu(aktif);
    };
    const pos = (e) => {
      const r = over.getBoundingClientRect();
      return [(e.clientX - r.left) * (over.width / r.width) / scale, (e.clientY - r.top) * (over.height / r.height) / scale];
    };
    over.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      over.setPointerCapture(e.pointerId);
      aktif = { titik: [pos(e)], tebal: +tebalSel.value, warna: warnaSel.value };
      strokes.push(aktif);
    });
    over.addEventListener('pointermove', (e) => {
      if (!aktif) return;
      e.preventDefault();
      aktif.titik.push(pos(e));
      gambarUlang();
    });
    const selesai = () => { aktif = null; };
    over.addEventListener('pointerup', selesai);
    over.addEventListener('pointercancel', selesai);

    const bLoad = T.btn('Muat Halaman', async () => {
      const f = fi.files && fi.files[0];
      if (!f) { T.show(box, errBox('Pilih dulu file PDF.')); return; }
      const okJs = await ensurePdfJs();
      if (!okJs) { T.show(box, errBox('Gagal memuat pustaka baca PDF dari CDN. Cek koneksi internet lalu coba lagi.')); return; }
      T.show(box, '<span class="dim">Merender halaman…</span>');
      try {
        srcBytes = new Uint8Array(await f.arrayBuffer());
        const jsDoc = await window.pdfjsLib.getDocument({ data: srcBytes.slice(0) }).promise;
        pageCount = jsDoc.numPages;
        pageNo = clamp(Math.floor(parseNum(pgInp.value, 1)), 1, pageCount);
        const page = await jsDoc.getPage(pageNo);
        const vp0 = page.getViewport({ scale: 1 });
        pageW = vp0.width; pageH = vp0.height;
        scale = Math.min(2, 700 / Math.max(pageW, pageH));
        const vp = page.getViewport({ scale });
        base.width = Math.ceil(vp.width); base.height = Math.ceil(vp.height);
        over.width = base.width; over.height = base.height;
        await page.render({ canvasContext: base.getContext('2d'), viewport: vp }).promise;
        strokes = [];
        gambarUlang();
        stage.style.display = 'block';
        bApply.hidden = false;
        T.show(box, '<span class="ok">Halaman ' + pageNo + ' dari ' + pageCount + ' siap dicorat-coret. Goresan disimpan sebagai garis vektor di PDF.</span>');
      } catch (e) { T.show(box, errBox('Halaman tidak bisa dimuat untuk dicorat-coret. Pastikan file PDF-nya tidak rusak, lalu coba lagi.')); }
    }, true);
    const bUndo = T.btn('Urungkan', () => { strokes.pop(); gambarUlang(); });
    const bClear = T.btn('Hapus semua', () => { strokes = []; gambarUlang(); });
    const bApply = T.btn('Terapkan & Unduh', async () => {
      if (!srcBytes || !strokes.length) { T.show(box, errBox('Belum ada coretan.')); return; }
      const ok = await needLib(); if (!ok) return;
      T.show(box, '<span class="dim">Menempelkan coretan…</span>');
      try {
        const doc = await window.PDFLib.PDFDocument.load(srcBytes.slice(0), { ignoreEncryption: true });
        const page = doc.getPage(pageNo - 1);
        const H = page.getHeight();
        for (const s of strokes) {
          const hex = s.warna;
          const col = window.PDFLib.rgb(parseInt(hex.slice(1, 3), 16) / 255, parseInt(hex.slice(3, 5), 16) / 255, parseInt(hex.slice(5, 7), 16) / 255);
          for (let i = 1; i < s.titik.length; i++) {
            const [x0, y0] = s.titik[i - 1], [x1, y1] = s.titik[i];
            page.drawLine({ start: { x: x0, y: H - y0 }, end: { x: x1, y: H - y1 }, thickness: s.tebal, color: col });
          }
        }
        dlPdf(await doc.save(), 'pdf-corat-coret.pdf');
        T.show(box, '<span class="ok">Coretan ditempel di halaman ' + pageNo + ' & terunduh.</span>');
      } catch (e) { T.show(box, errBox('Coretan tidak bisa ditempel ke PDF. Coba lagi.')); }
    }, true);
    bApply.hidden = true;
    pDraw.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Corat-coret langsung di atas halaman PDF dengan jari atau stylus — untuk menandai, melingkari, atau memberi catatan. Satu halaman per unduhan.</p>'));
    pDraw.appendChild(fi);
    pDraw.appendChild(T.grid2(T.field('Halaman', pgInp), T.field('Ketebalan garis', tebalSel)));
    pDraw.appendChild(T.field('Warna tinta', warnaSel));
    pDraw.appendChild(T.row(bLoad));
    pDraw.appendChild(box);
    pDraw.appendChild(stage);
    pDraw.appendChild(T.row(bUndo, bClear, bApply));
  }

  /* ============ TAB 23: Lampiran (file di dalam PDF) ============ */
  // Daftar lampiran dari name tree /EmbeddedFiles (pdf-lib 1.17.1 TIDAK punya
  // doc.getAttachments() — baca manual lewat low-level API; nama bisa berupa
  // string literal atau heks UTF-16BE, dan name tree bisa bercabang Kids).
  function daftarLampiranPdf(doc) {
    const L = window.PDFLib;
    const ctx = doc.context;
    const hasil = [];
    const kunjungi = (node) => {
      if (!node || !node.get) return;
      const namesArr = ctx.lookup(node.get(L.PDFName.of('Names')));
      if (namesArr && typeof namesArr.size === 'function') {
        for (let i = 0; i + 1 < namesArr.size(); i += 2) {
          const namaObj = ctx.lookup(namesArr.get(i));
          const nama = (namaObj && typeof namaObj.decodeText === 'function') ? namaObj.decodeText() : String(namaObj);
          const spec = ctx.lookup(namesArr.get(i + 1));
          if (!spec || !spec.get) continue;
          const ef = spec.get(L.PDFName.of('EF'));
          if (!ef || !ef.get) continue;
          const fRef = ef.get(L.PDFName.of('F')) || ef.get(L.PDFName.of('UF'));
          const stream = fRef ? ctx.lookup(fRef) : null;
          let data = null, mime = '';
          if (stream && typeof stream.getContents === 'function') {
            try { data = stream.getContents(); } catch (e) { data = null; }
            const sub = stream.dict && stream.dict.get(L.PDFName.of('Subtype'));
            if (sub) mime = String(sub).slice(1).replace('#2F', '/');
          }
          hasil.push({ name: nama, data, mimeType: mime });
        }
      }
      const kids = ctx.lookup(node.get(L.PDFName.of('Kids')));
      if (kids && typeof kids.size === 'function') {
        for (let i = 0; i < kids.size(); i++) kunjungi(ctx.lookup(kids.get(i)));
      }
    };
    const names = ctx.lookup(doc.catalog.get(L.PDFName.of('Names')));
    if (names && names.get) kunjungi(ctx.lookup(names.get(L.PDFName.of('EmbeddedFiles'))));
    return hasil;
  }
  const pLampiran = T.el('<div></div>');
  {
    const fi = fileInput('application/pdf'); fi.style.margin = '6px 0';
    const lampInp = document.createElement('input');
    lampInp.type = 'file'; lampInp.multiple = true; lampInp.style.margin = '6px 0';
    const box = T.out();
    const daftarBox = T.out();
    const MAKS_LAMPIRAN_BYTE = 25 * 1024 * 1024;
    const bLihat = T.btn('Lihat lampiran yang sudah ada', async () => {
      const f = fi.files && fi.files[0];
      if (!f) { T.show(box, errBox('Pilih dulu file PDF.')); return; }
      const ok = await needLib(); if (!ok) return;
      T.show(box, '<span class="dim">Membaca PDF…</span>');
      try {
        const doc = await loadPdfDoc(f);
        const list = daftarLampiranPdf(doc);
        T.hide(box);
        if (!list.length) {
          T.show(daftarBox, '<p class="dim" style="font-size:13px">PDF ini tidak punya lampiran file.</p>');
          return;
        }
        T.show(daftarBox, '');
        daftarBox.appendChild(T.el('<div style="font-size:13px;font-weight:600;margin:8px 0 6px">' + list.length + ' lampiran di dalam PDF ini</div>'));
        list.forEach((a) => {
          const nama = a.name || 'lampiran';
          const ukuran = a.data ? fmtSize(a.data.length) : '';
          const row = T.el('<div class="row" style="align-items:center;justify-content:space-between"></div>');
          row.appendChild(T.el('<div style="word-break:break-word"><b>' + T.esc(nama) + '</b>' + (ukuran ? '<div class="dim" style="font-size:12px">' + ukuran + (a.mimeType ? ' · ' + T.esc(a.mimeType) : '') + '</div>' : '') + '</div>'));
          row.appendChild(T.btn('Unduh', () => {
            if (!a.data) { T.toast('Lampiran ini tidak bisa dibaca'); return; }
            dlBlob(new Blob([a.data], { type: a.mimeType || 'application/octet-stream' }), nama);
          }, true));
          daftarBox.appendChild(row);
        });
      } catch (e) { T.show(box, errBox('Lampiran tidak bisa dibaca. Pastikan file PDF-nya tidak rusak, lalu coba lagi.')); }
    });
    const bGo = T.btn('Tempel & Unduh', async () => {
      const f = fi.files && fi.files[0];
      if (!f) { T.show(box, errBox('Pilih dulu file PDF.')); return; }
      const lamps = [...(lampInp.files || [])];
      if (!lamps.length) { T.show(box, errBox('Pilih dulu file yang mau dilampirkan.')); return; }
      const total = lamps.reduce((s, x) => s + x.size, 0);
      if (total > MAKS_LAMPIRAN_BYTE) { T.show(box, errBox('Total lampiran ' + fmtSize(total) + ' melebihi batas ' + fmtSize(MAKS_LAMPIRAN_BYTE) + '. Kurangi jumlah/ukuran file lampiran.')); return; }
      const ok = await needLib(); if (!ok) return;
      T.show(box, '<span class="dim">Menempel lampiran…</span>');
      try {
        const doc = await loadPdfDoc(f);
        const sekarang = new Date();
        for (const lf of lamps) {
          const bytes = new Uint8Array(await lf.arrayBuffer());
          doc.attach(bytes, lf.name || 'lampiran', {
            mimeType: lf.type || 'application/octet-stream',
            description: 'Dilampirkan lewat PDF Lab',
            creationDate: sekarang,
            modificationDate: sekarang,
          });
        }
        dlPdf(await doc.save(), 'pdf-lampiran.pdf');
        T.show(box, '<span class="ok">Berhasil: ' + lamps.length + ' file (' + fmtSize(total) + ') ditempel ke dalam PDF. Buka PDF di pembaca PDF (Acrobat/Chrome) lalu cek panel lampiran.</span>');
      } catch (e) { T.show(box, errBox('Lampiran tidak bisa ditempel. Pastikan file PDF-nya tidak rusak, lalu coba lagi.')); }
    }, true);
    pLampiran.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Tempel file pendukung (foto, dokumen, spreadsheet) ke DALAM PDF supaya terkirim jadi satu berkas. Bisa juga melihat & mengunduh lampiran yang sudah ada di PDF.</p>'));
    pLampiran.appendChild(fi);
    pLampiran.appendChild(T.field('File yang dilampirkan (bisa banyak)', lampInp, 'Total maksimal ' + fmtSize(MAKS_LAMPIRAN_BYTE) + '.'));
    pLampiran.appendChild(T.row(bGo, bLihat));
    pLampiran.appendChild(box);
    pLampiran.appendChild(daftarBox);
  }

  const pages = [pOrg, pMerge, pSplit, pImg, pWm, pTx, pMeta, pForm, pCompress, pPdfImg, pNum, pSign, pCrop, pRedact, pPdfText, pImgOut, pTarget, pFormNew, pArrange, pInfo, pDiff, pDraw, pLampiran];
  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">23 operasi PDF langsung di perangkatmu. Diproses di browser, file tidak diupload ke mana pun.</p>'));
  const tabBar = tabs(
    [['Atur', 0], ['Gabung', 1], ['Pisah', 2], ['Gambar→PDF', 3], ['Watermark', 4], ['Teks & Bentuk', 5], ['Metadata', 6], ['Form', 7], ['Kompres', 8], ['PDF→Gambar', 9], ['Nomor', 10], ['Tanda Tangan', 11], ['Potong', 12], ['Sensor', 13], ['PDF ke Teks', 14], ['Ambil Gambar', 15], ['Target KB', 16], ['Form Baru', 17], ['Susun', 18], ['Info', 19], ['Banding', 20], ['Corat-coret', 21], ['Lampiran', 22]],
    pages
  );
  root.appendChild(tabBar);
  pages.forEach((p) => root.appendChild(p));
  root.appendChild(status);
  // Pindah ke tab tertentu bila diminta tool lain (mis. Tanda Tangan).
  try {
    const want = parseInt(localStorage.getItem('adip-pdflab-tab') || '', 10);
    if (Number.isFinite(want) && want >= 0 && want < pages.length) {
      const btns = tabBar.querySelectorAll('button');
      if (btns[want]) btns[want].click();
    }
    localStorage.removeItem('adip-pdflab-tab');
  } catch (e) {}
}
