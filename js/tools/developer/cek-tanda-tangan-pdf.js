import { h as T, utils, fileInput, fmtBytes, errBox, esc } from '../../core.js';

// Periksa KEBERADAAN tanda tangan digital di PDF, bukan keasliannya.
// Tiga lapis pemeriksaan: pdf.js (file PDF valid + info dasar),
// pdf-lib (field tanda tangan di formulir), dan pemindaian mentah
// byte file untuk dictionary /Type /Sig. Keaslian sertifikat TIDAK
// diperiksa: itu butuh verifikasi rantai sertifikat.
const PDFLIB_CDN = 'https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js';
const PDFJS_CDN = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js';
const PDFJS_WORKER = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';

let libState = { lib: null, js: null };
async function ensureLibs() {
  // Loader library kanonis: utils.loadLibOnce (core.js).
  if (libState.lib === null) libState.lib = await utils.loadLibOnce(PDFLIB_CDN, () => !!window.PDFLib);
  if (libState.js === null) libState.js = await utils.loadLibOnce(PDFJS_CDN, () => !!window.pdfjsLib, () => { window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER; });
  return libState;
}

function bytesToLatin1(bytes) {
  let s = '';
  const CH = 8192;
  for (let i = 0; i < bytes.length; i += CH) {
    s += String.fromCharCode.apply(null, bytes.subarray(i, i + CH));
  }
  return s;
}

function unescapePdfStr(s) {
  return String(s).replace(/\\([()\\])/g, '$1').replace(/\\(\d{1,3})/g, (_, o) => String.fromCharCode(parseInt(o, 8)));
}

function parsePdfDate(s) {
  const m = /^D:(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})?(.*)$/.exec(s || '');
  if (!m) return s || '-';
  // Format manual DD/MM/YYYY HH.mm: toLocaleString berbeda-beda antar
  // perangkat (Node memberi 15/1/2024, browser memberi 15/01/2024).
  const p2 = (x) => String(x).padStart(2, '0');
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +(m[6] || 0)));
  if (isNaN(d.getTime())) return s;
  return p2(m[3]) + '/' + p2(m[2]) + '/' + m[1] + ' ' + p2(m[4]) + '.' + p2(m[5]) + ' UTC' + (m[7] ? ' (' + m[7] + ')' : '');
}

// Cari dictionary /Type /Sig di byte mentah file.
function scanSigDicts(text) {
  const found = [];
  const re = /\/Type\s*\/Sig\b/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const start = Math.max(0, text.lastIndexOf('<<', m.index));
    const end = text.indexOf('>>', m.index);
    const dict = text.slice(start, end === -1 ? m.index + 400 : end + 2);
    const pick = (rx) => { const mm = rx.exec(dict); return mm ? unescapePdfStr(mm[1]) : null; };
    found.push({
      name: pick(/\/Name\s*\(([^)]*)\)/),
      date: pick(/\/M\s*\(([^)]*)\)/),
      reason: pick(/\/Reason\s*\(([^)]*)\)/),
      location: pick(/\/Location\s*\(([^)]*)\)/),
      subfilter: pick(/\/SubFilter\s*\/([A-Za-z0-9._]+)/),
      byteRange: /\/ByteRange\s*\[/.test(dict),
    });
  }
  return found;
}

export const meta = {"id": "cek-tanda-tangan-pdf", "name": "Cek Tanda Tangan PDF", "cat": "developer", "icon": "✍️", "desc": "Lihat ada tidaknya tanda tangan digital di PDF.", "keywords": "pdf,tanda tangan,signature,digital,cek", "since": "6.11.0", "online": true};
export function render(root) {

    const fInp = fileInput('.pdf');
    const fLabel = T.el('<div class="hint">Pilih file PDF.</div>');
    const out = T.out();
    let file = null;

    fInp.addEventListener('change', () => {
      file = fInp.files && fInp.files[0] ? fInp.files[0] : null;
      T.hide(out);
      fLabel.textContent = file ? file.name + ' (' + fmtBytes(file.size) + ')' : 'Pilih file PDF.';
    });

    const go = async () => {
      if (!file) { T.show(out, errBox('Pilih dulu file PDF-nya.')); return; }
      T.show(out, '<span class="dim">Memuat pustaka PDF &amp; memeriksa file…</span>');
      let bytes;
      try {
        bytes = new Uint8Array(await file.arrayBuffer());
      } catch (e) {
        T.show(out, errBox('File tidak bisa dibaca. Pastikan filenya tidak rusak lalu coba lagi.'));
        return;
      }
      if (bytes.length < 5 || bytesToLatin1(bytes.subarray(0, 5)) !== '%PDF-') {
        T.show(out, errBox('File ini bukan PDF (tidak diawali %PDF-).'));
        return;
      }
      const libs = await ensureLibs();
      if (!libs.lib && !libs.js) {
        T.show(out, errBox('Pustaka PDF gagal dimuat dari internet. Cek koneksi lalu coba lagi.'));
        return;
      }
      // Lapis 1: pdf.js, info dasar + validasi dokumen.
      let pageCount = null, metaTitle = null;
      if (libs.js) {
        try {
          const doc = await window.pdfjsLib.getDocument({ data: bytes.slice() }).promise;
          pageCount = doc.numPages;
          try { const md = await doc.getMetadata(); metaTitle = md && md.info ? (md.info.Title || null) : null; } catch (e) { /* metadata opsional */ }
        } catch (e) {
          T.show(out, errBox('File PDF ini rusak atau tidak bisa dibuka. Coba file PDF lain.'));
          return;
        }
      }
      // Lapis 2: pdf-lib, field tanda tangan di formulir.
      let formSigs = [];
      if (libs.lib) {
        try {
          const doc = await window.PDFLib.PDFDocument.load(bytes.slice(), { ignoreEncryption: true });
          const form = doc.getForm();
          formSigs = form.getFields()
            .filter((f) => f && f.constructor && f.constructor.name === 'PDFSignature')
            .map((f) => { try { return f.getName(); } catch (e) { return '(tanpa nama)'; } });
        } catch (e) { /* bukan kegagalan fatal: lanjut ke pemindaian mentah */ }
      }
      // Lapis 3: pemindaian mentah dictionary /Type /Sig.
      const text = bytesToLatin1(bytes);
      const sigs = scanSigDicts(text);
      const ftSigCount = (text.match(/\/FT\s*\/Sig\b/g) || []).length;

      let html = '';
      if (pageCount !== null) html += '<div class="hint" style="margin-bottom:10px">' + pageCount + ' halaman' + (metaTitle ? ' · judul: ' + esc(metaTitle) : '') + '.</div>';
      if (!sigs.length && !formSigs.length && !ftSigCount) {
        html += '<div style="font-size:14px;margin-bottom:8px"><span class="warn">Tidak ditemukan tanda tangan digital.</span></div>' +
          '<div class="hint">Tidak ada field tanda tangan maupun dictionary tanda tangan di file ini. Tanda tangan gambar (coretan yang ditempel sebagai gambar) memang tidak terdeteksi, karena itu bukan tanda tangan digital.</div>';
      } else {
        const total = Math.max(sigs.length, formSigs.length, ftSigCount);
        html += '<div style="font-size:14px;margin-bottom:10px"><span class="ok">✓ Ditemukan ' + total + ' tanda tangan digital.</span></div>';
        if (sigs.length) {
          html += sigs.map((s, i) => {
            const rows = [];
            rows.push('<div class="kv"><span class="k">Tanda tangan ' + (i + 1) + '</span><span class="v">' + esc(s.subfilter || 'jenis tidak tertulis') + '</span></div>');
            if (s.name) rows.push('<div class="kv"><span class="k">Penanda tangan</span><span class="v">' + esc(s.name) + '</span></div>');
            if (s.date) rows.push('<div class="kv"><span class="k">Waktu tanda tangan</span><span class="v">' + esc(parsePdfDate(s.date)) + '</span></div>');
            if (s.reason) rows.push('<div class="kv"><span class="k">Alasan</span><span class="v">' + esc(s.reason) + '</span></div>');
            if (s.location) rows.push('<div class="kv"><span class="k">Lokasi</span><span class="v">' + esc(s.location) + '</span></div>');
            rows.push('<div class="kv"><span class="k">ByteRange</span><span class="v">' + (s.byteRange ? 'ada' : 'tidak ada') + '</span></div>');
            return rows.join('');
          }).join('<div style="height:8px"></div>');
        } else if (formSigs.length) {
          html += '<div class="hint">Field tanda tangan di formulir: ' + esc(formSigs.join(', ')) + '. Detail isi tanda tangan tidak terbaca dari dictionary file.</div>';
        }
      }
      html += '<div style="background:#3f2f04;border:1px solid #eab308;border-radius:8px;padding:10px 12px;font-size:12.5px;margin-top:12px">⚠️ Tool ini hanya memeriksa <b>ada atau tidaknya</b> tanda tangan di file. Keaslian sertifikat penanda tangan tidak diperiksa di sini, karena itu butuh verifikasi rantai sertifikat.</div>';
      T.show(out, html);
    };

    root.appendChild(T.field('File PDF', fInp));
    root.appendChild(fLabel);
    root.appendChild(T.row(T.btn('Periksa', go, true)));
    root.appendChild(out);
  
}
