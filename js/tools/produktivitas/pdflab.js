import { h as T, fileInput, tabs, errBox } from '../../core.js?v=6.11.5';

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

  // Kompres Sejati: kecilkan gambar JPEG yang tertanam di PDF tanpa menyentuh
  // teks, jadi teks tetap bisa dipilih. Gambar non-JPEG dan gambar CMYK
  // dilewati apa adanya. Mengembalikan statistik pengerjaan.
  async function trueCompressDoc(doc, quality, scale, onStep) {
    const L = window.PDFLib;
    const stats = { total: 0, replaced: 0, skipped: 0 };
    const jobs = [];
    for (const [ref, obj] of doc.context.indirectObjects.entries()) {
      if (!(obj instanceof L.PDFRawStream)) continue;
      const dict = obj.dict;
      const subtype = dict.get(L.PDFName.of('Subtype'));
      if (!subtype || subtype.toString() !== '/Image') continue;
      stats.total++;
      const filter = dict.get(L.PDFName.of('Filter'));
      const fStr = filter ? filter.toString() : '';
      const cs = dict.get(L.PDFName.of('ColorSpace'));
      const csStr = cs ? cs.toString() : '';
      if (!/DCTDecode/.test(fStr) || /CMYK/i.test(csStr)) { stats.skipped++; continue; }
      jobs.push({ ref, dict, obj });
    }
    for (let i = 0; i < jobs.length; i++) {
      const { ref, dict, obj } = jobs[i];
      if (onStep) onStep(i + 1, jobs.length);
      try {
        const raw = obj.getContents();
        const img = await decodeImageBytes(raw, 'image/jpeg');
        const w = Math.max(1, Math.round(img.naturalWidth * scale));
        const h = Math.max(1, Math.round(img.naturalHeight * scale));
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        const cx = c.getContext('2d');
        cx.fillStyle = '#ffffff'; cx.fillRect(0, 0, w, h);
        cx.drawImage(img, 0, 0, w, h);
        const small = await canvasToBytes(c, 'image/jpeg', quality);
        if (small.length < raw.length) {
          dict.set(L.PDFName.of('Width'), L.PDFNumber.of(w));
          dict.set(L.PDFName.of('Height'), L.PDFNumber.of(h));
          dict.set(L.PDFName.of('ColorSpace'), L.PDFName.of('DeviceRGB'));
          dict.set(L.PDFName.of('BitsPerComponent'), L.PDFNumber.of(8));
          dict.set(L.PDFName.of('Filter'), L.PDFName.of('DCTDecode'));
          try { dict.delete(L.PDFName.of('DecodeParms')); } catch (e) {}
          doc.context.assign(ref, L.PDFRawStream.of(dict, small));
          stats.replaced++;
        }
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
      } catch (e) { T.show(box, errBox('Gagal membaca PDF: ' + e.message)); }
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
      } catch (e) { T.show(box, errBox('Gagal: ' + e.message)); }
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
      } catch (e) { T.show(box, errBox('Gagal menggabungkan: ' + e.message)); }
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
    const rInp = T.input('text', 'Contoh: 1-3,5; 6-10  (tanda ; = file baru)');
    const box = T.out();
    const bGo = T.btn('Pisahkan & Unduh', async () => {
      const f = fi.files && fi.files[0];
      if (!f) { T.show(box, errBox('Pilih dulu file PDF.')); return; }
      const ok = await needLib(); if (!ok) return;
      T.show(box, '<span class="dim">Memisahkan…</span>');
      try {
        const src = await window.PDFLib.PDFDocument.load(new Uint8Array(await f.arrayBuffer()), { ignoreEncryption: true });
        const n = src.getPageCount();
        const groups = parseGroups(rInp.value, n);
        let k = 0;
        for (const g of groups) {
          const out = await window.PDFLib.PDFDocument.create();
          const pages = await out.copyPages(src, g.map((x) => x - 1));
          pages.forEach((p) => out.addPage(p));
          dlPdf(await out.save(), 'pdf-pisah-' + (++k) + '.pdf');
        }
        T.show(box, '<span class="ok">Berhasil: ' + groups.length + ' file terunduh.</span>');
      } catch (e) { T.show(box, errBox(e.message)); }
    }, true);
    pSplit.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Ambil halaman tertentu jadi file baru. Tanda <b>;</b> memisahkan jadi file berbeda.</p>'));
    pSplit.appendChild(fi);
    pSplit.appendChild(T.field('Rentang halaman', rInp, 'Contoh: 1-3,5; 6-10 → 2 file'));
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
            if (/png$/i.test(f.type) || /\.png$/i.test(f.name)) { img = await out.embedPng(bytes); }
            else if (/jpe?g$/i.test(f.type) || /\.jpe?g$/i.test(f.name)) { img = await out.embedJpg(bytes); }
            else {
              // WEBP/HEIC/TIFF: decode lewat browser lalu tanam sebagai PNG.
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
      } catch (e) { T.show(box, errBox('Gagal: ' + e.message + ' (pastikan file benar-benar gambar)')); }
    }, true);
    pImg.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Ubah kumpulan gambar jadi satu PDF. PNG, JPG, dan WEBP bisa langsung. HEIC dan TIFF tergantung browser: bila tidak bisa dibaca, file itu dilewati dan sisanya tetap diproses.</p>'));
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
          const font = await doc.embedFont(window.PDFLib.StandardFonts.HelveticaBold);
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
      } catch (e) { T.show(box, errBox('Gagal: ' + e.message)); }
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

  /* ============ TAB 6: Tambah Teks ============ */
  const pTx = T.el('<div></div>');
  {
    const fi = fileInput('application/pdf'); fi.style.margin = '6px 0';
    const tInp = T.input('text', 'Teks yang ditambahkan', '');
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
    const cInp = T.el('<input type="color" value="#111111" style="width:100%;height:44px;border:1px solid #27272a;border-radius:8px;background:none;padding:4px;cursor:pointer">');
    const pgInp = T.input('text', 'semua, atau mis. 1,3', 'semua');
    const box = T.out();
    const bGo = T.btn('Terapkan & Unduh', async () => {
      const f = fi.files && fi.files[0];
      if (!f) { T.show(box, errBox('Pilih dulu file PDF.')); return; }
      if (!tInp.value.trim()) { T.show(box, errBox('Isi teksnya.')); return; }
      const ok = await needLib(); if (!ok) return;
      T.show(box, '<span class="dim">Menambahkan teks…</span>');
      try {
        const doc = await window.PDFLib.PDFDocument.load(new Uint8Array(await f.arrayBuffer()), { ignoreEncryption: true });
        const n = doc.getPageCount();
        const targets = parsePages(pgInp.value, n);
        const font = await doc.embedFont(window.PDFLib.StandardFonts.Helvetica);
        const size = +sSel.value;
        const hex = cInp.value;
        const col = window.PDFLib.rgb(parseInt(hex.slice(1, 3), 16) / 255, parseInt(hex.slice(3, 5), 16) / 255, parseInt(hex.slice(5, 7), 16) / 255);
        const m = 36;
        for (const p1 of targets) {
          const page = doc.getPage(p1 - 1);
          const { width, height } = page.getSize();
          const tw = font.widthOfTextAtSize(tInp.value, size);
          const pos = posSel.value;
          let x, y;
          if (pos === 'free') {
            const xp = Math.min(100, Math.max(0, +xInp.value || 0));
            const yp = Math.min(100, Math.max(0, +yInp.value || 0));
            x = width * xp / 100; y = height * yp / 100;
          } else {
            x = pos[1] === 'l' ? m : pos[1] === 'c' ? (width - tw) / 2 : width - tw - m;
            y = pos[0] === 't' ? height - m - size : pos[0] === 'm' ? (height - size) / 2 : m;
          }
          page.drawText(tInp.value, { x, y, size, font, color: col });
        }
        dlPdf(await doc.save(), 'pdf-teks.pdf');
        T.show(box, '<span class="ok">Teks ditambahkan di ' + targets.length + ' halaman.</span>');
      } catch (e) { T.show(box, errBox('Gagal: ' + e.message)); }
    }, true);
    pTx.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Tempel teks overlay di posisi tertentu pada halaman.</p>'));
    pTx.appendChild(fi);
    pTx.appendChild(T.field('Teks', tInp));
    pTx.appendChild(T.grid2(T.field('Posisi', posSel), T.field('Ukuran', sSel)));
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
      } catch (e) { T.show(box, errBox('Gagal: ' + e.message)); }
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
      } catch (e) { T.show(box, errBox('Gagal: ' + e.message)); }
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
      } catch (e) { T.show(box, errBox('Gagal: ' + e.message)); }
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
      } catch (e) { T.show(box, errBox('Gagal: ' + e.message)); }
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
      } catch (e) { T.show(box, errBox('Gagal: ' + e.message)); }
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
            ? 'Berhasil: ' + fmtSize(before) + ' menjadi ' + fmtSize(after) + ' (lebih kecil ' + pct + '%). ' + st.replaced + ' dari ' + st.total + ' gambar dikecilkan' + (st.skipped ? ', ' + st.skipped + ' gambar dilewati (bukan JPG atau tidak bisa dikecilkan)' : '') + '. Teks tetap bisa dipilih.'
            : 'Hasil ' + fmtSize(after) + ' vs asli ' + fmtSize(before) + ', tidak lebih kecil. Gambar di PDF ini sudah padat. File tetap terunduh; coba kualitas lebih rendah atau mode "Ubah halaman jadi gambar".';
          T.show(box, '<span class="ok">' + msg + '</span>');
        } catch (e) { T.show(box, errBox('Gagal mengompres: ' + e.message)); }
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
      } catch (e) { T.show(box, errBox('Gagal mengompres: ' + e.message)); }
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
      } catch (e) { T.show(box, errBox('Gagal membuat ZIP: ' + e.message)); }
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
      } catch (e) { T.show(box, errBox('Gagal: ' + e.message)); }
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
        const targets = parsePages(pgInp.value, n);
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
          else if (fmtSel.value === 'numof') label = 'Halaman ' + arabic + ' dari ' + n;
          else label = String(arabic);
          const tw = font.widthOfTextAtSize(label, size);
          const x = pos[1] === 'l' ? m : pos[1] === 'c' ? (width - tw) / 2 : width - tw - m;
          const y = pos[0] === 't' ? height - my - size : my;
          page.drawText(label, { x, y, size, font, color: window.PDFLib.rgb(0.4, 0.4, 0.4) });
        });
        dlPdf(await doc.save(), 'pdf-nomor.pdf');
        T.show(box, '<span class="ok">Nomor ditempel di ' + targets.length + ' halaman.</span>');
      } catch (e) { T.show(box, errBox('Gagal: ' + e.message)); }
    }, true);
    pNum.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Tempel nomor halaman di setiap halaman PDF. Untuk skripsi atau laporan, halaman awal bisa memakai angka Romawi.</p>'));
    pNum.appendChild(fi);
    pNum.appendChild(T.grid2(T.field('Posisi', posSel), T.field('Format nomor', fmtSel)));
    pNum.appendChild(T.grid2(T.field('Mulai dari nomor', startInp), T.field('Ukuran', sizeSel)));
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
      } catch (e) { T.show(box, errBox('Gagal membaca gambar: ' + e.message)); }
    });
    const bFromTool = T.btn('Pakai yang Terakhir Dibuat', async () => {
      let dataUrl = null;
      try { dataUrl = localStorage.getItem(TTD_KEY); } catch (e) {}
      if (!dataUrl) { T.show(box, errBox('Belum ada tanda tangan tersimpan. Buat dulu di tool Tanda Tangan, lalu kembali ke sini.')); return; }
      try {
        await setSigFromDataUrl(dataUrl);
        T.show(box, '<span class="ok">Tanda tangan dari tool Tanda Tangan dimuat.</span>');
        if (pageCanvas) drawPrev();
      } catch (e) { T.show(box, errBox(e.message)); }
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
      } catch (e) { T.show(box, errBox('Gagal: ' + e.message)); }
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
      } catch (e) { T.show(box, errBox('Gagal: ' + e.message)); }
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
      } catch (e) { T.show(box, errBox('Gagal: ' + e.message)); }
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
    const modeSel = T.select([['text', 'Cari kata lalu tutupi'], ['area', 'Tutup area (kotak manual)']], 'text');
    const wordsTa = T.ta(2, 'Kata atau kalimat, pisahkan dengan koma. Contoh: Budi Santoso, 08123456789', '');
    const wordsWrap = T.field('Kata yang ditutupi', wordsTa, 'Tiap kata dicari di halaman target. Satu baris teks yang mengandung kata itu ikut tertutup seluruhnya.');
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
    const bGo = T.btn('Tutupi & Unduh', async () => {
      const f = fi.files && fi.files[0];
      if (!f) { T.show(box, errBox('Pilih dulu file PDF.')); return; }
      const ok = await needLib(); if (!ok) return;
      T.show(box, '<span class="dim">Menutupi…</span>');
      try {
        const doc = await loadPdfDoc(f);
        const n = doc.getPageCount();
        const targets = parsePages(pgInp.value, n);
        const black = window.PDFLib.rgb(0, 0, 0);
        let boxes = 0, rotated = false;
        if (modeSel.value === 'area') {
          const xp = clamp(parseNum(xInp.value, 10), 0, 100);
          const yp = clamp(parseNum(yInp.value, 10), 0, 100);
          const wp = clamp(parseNum(wInp.value, 50), 1, 100);
          const hp = clamp(parseNum(hInp.value, 10), 1, 100);
          for (const p1 of targets) {
            const page = doc.getPage(p1 - 1);
            const { width, height } = page.getSize();
            page.drawRectangle({
              x: width * xp / 100,
              y: height * (100 - yp - hp) / 100,
              width: width * wp / 100,
              height: height * hp / 100,
              color: black,
            });
            boxes++;
          }
        } else {
          const terms = wordsTa.value.split(/[,;\n]/).map((s) => s.trim()).filter(Boolean);
          if (!terms.length) { T.show(box, errBox('Isi dulu kata yang mau ditutupi.')); return; }
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
              const w = item.width || 0, h = item.height || 0;
              page.drawRectangle({ x: tr[4] - 1, y: tr[5] - 1, width: w + 2, height: h + 2, color: black });
              boxes++;
            }
          }
        }
        if (!boxes) { T.show(box, '<span class="dim">Tidak ada yang ditutupi. Coba kata lain atau periksa halaman target.</span>'); return; }
        dlPdf(await doc.save(), 'pdf-sensor.pdf');
        T.show(box, '<span class="ok">' + boxes + ' kotak hitam ditempel. Ingat, ini hanya menutupi tampilan: teks di baliknya masih ada di dalam file dan bisa dibaca alat lain.' + (rotated ? ' Sebagian halaman diputar, jadi posisi kotak bisa bergeser.' : '') + '</span>');
      } catch (e) { T.show(box, errBox('Gagal: ' + e.message)); }
    }, true);
    pRedact.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Tutupi kata atau area sensitif dengan kotak hitam sebelum PDF dibagikan.</p>'));
    pRedact.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Penting: kotak hitam hanya menutupi tampilan. Teks di baliknya masih ada di dalam file dan bisa dibaca dengan alat lain. Untuk menghapus permanen, pakai alat redact khusus di komputer.</p>'));
    pRedact.appendChild(fi);
    pRedact.appendChild(T.field('Cara menutupi', modeSel));
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
      } catch (e) { T.show(box, errBox('Gagal: ' + e.message)); }
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
      } catch (e) { T.show(box, errBox('Gagal membuat ZIP: ' + e.message)); }
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
      } catch (e) { T.show(box, errBox('Gagal: ' + e.message)); }
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
      } catch (e) { T.show(box, errBox('Gagal: ' + e.message)); }
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
      const nameInp = T.input('text', 'Nama kolom, mis. nama_lengkap', kind === 'text' ? 'isian_' + idx : 'centang_' + idx);
      const pgInp = T.input('text', '1', '1'); pgInp.inputMode = 'decimal';
      const xInp = T.input('text', '10', '10'); xInp.inputMode = 'decimal';
      const yInp = T.input('text', '50', '50'); yInp.inputMode = 'decimal';
      const wInp = T.input('text', kind === 'text' ? '60' : '6', kind === 'text' ? '60' : '6'); wInp.inputMode = 'decimal';
      const row = T.el('<div style="border:1px solid #ffffff20;border-radius:10px;padding:10px;display:grid;gap:8px"></div>');
      const head = T.el('<div style="display:flex;justify-content:space-between;align-items:center;font-size:13px"></div>');
      head.appendChild(T.el('<b>' + (kind === 'text' ? 'Kolom isian teks' : 'Kotak centang') + '</b>'));
      const bDel = T.btn('Hapus', () => { rows = rows.filter((r) => r.el !== row); row.remove(); });
      bDel.classList.add('small'); bDel.style.padding = '4px 8px';
      head.appendChild(bDel);
      row.appendChild(head);
      row.appendChild(T.field('Nama kolom', nameInp, 'Nama ini yang muncul sebagai nama field di PDF.'));
      row.appendChild(T.grid2(T.field('Halaman', pgInp), T.field(kind === 'text' ? 'Lebar (mm)' : 'Ukuran (mm)', wInp)));
      row.appendChild(T.grid2(T.field('X % (dari kiri)', xInp), T.field('Y % (dari bawah)', yInp)));
      list.appendChild(row);
      rows.push({ kind, el: row, nameInp, pgInp, xInp, yInp, wInp });
    };
    const bAddT = T.btn('Tambah Kolom Teks', () => addRow('text'));
    const bAddC = T.btn('Tambah Kotak Centang', () => addRow('check'));
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
          } else {
            const s = mm2pt(clamp(parseNum(r.wInp.value, 6), 3, 30));
            const fld = form.createCheckBox(name);
            fld.addToPage(page, { x, y, width: s, height: s, borderColor: window.PDFLib.rgb(0.6, 0.6, 0.6), borderWidth: 1 });
          }
        }
        form.updateFieldAppearances(font);
        dlPdf(await doc.save(), 'pdf-form-baru.pdf');
        T.show(box, '<span class="ok">Form dibuat (' + rows.length + ' kolom) & terunduh. Buka di pembaca PDF untuk mengisinya.</span>');
      } catch (e) { T.show(box, errBox(e.message)); }
    }, true);
    pFormNew.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Buat kolom isian di PDF yang masih kosong: kolom teks untuk diisi tulisan, kotak centang untuk dicentang. Hasilnya bisa diisi di pembaca PDF atau di tab Form.</p>'));
    pFormNew.appendChild(fi);
    pFormNew.appendChild(T.row(bAddT, bAddC));
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
      } catch (e) { T.show(box, errBox('Gagal: ' + e.message)); }
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
      } catch (e) { T.show(box, errBox('Gagal: ' + e.message)); }
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
      } catch (e) { T.show(box, errBox('Gagal: ' + e.message)); }
    }, true);
    pDiff.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Bandingkan isi teks dua PDF, baris per baris. Yang dibandingkan adalah teksnya, bukan tampilan visual halamannya. PDF hasil pindaian (foto halaman) tidak punya teks, jadi tidak bisa dibandingkan.</p>'));
    pDiff.appendChild(T.field('PDF pertama (A)', fiA));
    pDiff.appendChild(T.field('PDF kedua (B)', fiB));
    pDiff.appendChild(cekSama);
    pDiff.appendChild(T.row(bGo, bDl, bCopy));
    pDiff.appendChild(box);
    pDiff.appendChild(pre);
  }

  const pages = [pOrg, pMerge, pSplit, pImg, pWm, pTx, pMeta, pForm, pCompress, pPdfImg, pNum, pSign, pCrop, pRedact, pPdfText, pImgOut, pTarget, pFormNew, pArrange, pInfo, pDiff];
  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">21 operasi PDF langsung di perangkatmu. Diproses di browser, file tidak diupload ke mana pun.</p>'));
  const tabBar = tabs(
    [['Atur', 0], ['Gabung', 1], ['Pisah', 2], ['Gambar→PDF', 3], ['Watermark', 4], ['Teks', 5], ['Metadata', 6], ['Form', 7], ['Kompres', 8], ['PDF→Gambar', 9], ['Nomor', 10], ['Tanda Tangan', 11], ['Potong', 12], ['Sensor', 13], ['PDF ke Teks', 14], ['Ambil Gambar', 15], ['Target KB', 16], ['Form Baru', 17], ['Susun', 18], ['Info', 19], ['Banding', 20]],
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
