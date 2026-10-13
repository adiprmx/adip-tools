import { h as T, fileInput, tabs, errBox } from '../../core.js?v=6.9.20';

export const meta = {"id": "pdflab", "name": "PDF Lab", "cat": "produktivitas", "icon": "🧪", "desc": "Toolkit PDF lokal: gabung, pisah, watermark & lainnya.", "keywords": "pdf,merge,split,watermark,metadata,form,gabung"};

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
      if (!arr.length) throw new Error('Rentang "' + g + '" tidak memuat halaman valid (1–' + maxPage + ').');
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
    const fi = fileInput('image/*'); fi.multiple = true; fi.style.margin = '6px 0';
    const sizeSel = T.select([['follow', 'Ikuti ukuran gambar'], ['a4', 'Kertas A4']], 'follow');
    const mInp = T.input('number', '0–50', '8');
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
        for (const f of files) {
          const bytes = new Uint8Array(await f.arrayBuffer());
          let img, dims;
          if (/png$/i.test(f.type) || /\.png$/i.test(f.name)) { img = await out.embedPng(bytes); }
          else { img = await out.embedJpg(bytes); }
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
        dlPdf(await out.save(), 'gambar-ke-pdf.pdf');
        T.show(box, '<span class="ok">Berhasil: ' + files.length + ' halaman terunduh.</span>');
      } catch (e) { T.show(box, errBox('Gagal: ' + e.message + ' (pastikan file benar-benar gambar PNG/JPG)')); }
    }, true);
    pImg.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Ubah kumpulan gambar (PNG/JPG) jadi satu PDF.</p>'));
    pImg.appendChild(fi);
    pImg.appendChild(T.grid2(T.field('Ukuran halaman', sizeSel), T.field('Margin (mm, 0–50)', mInp)));
    pImg.appendChild(T.row(bGo));
    pImg.appendChild(box);
  }

  /* ============ TAB 5: Watermark ============ */
  const pWm = T.el('<div></div>');
  {
    const fi = fileInput('application/pdf'); fi.style.margin = '6px 0';
    const tInp = T.input('text', 'Teks watermark', 'DRAF');
    const sSel = T.select([['24', '24'], ['34', '34'], ['48', '48'], ['72', '72']], '34');
    const oSel = T.select([['0.1', '0,10'], ['0.22', '0,22'], ['0.4', '0,40'], ['0.6', '0,60']], '0.22');
    const aSel = T.select([['-35', '-35°'], ['0', '0°'], ['-45', '-45°'], ['45', '45°']], '-35');
    const pgInp = T.input('text', 'semua, atau mis. 1-3,5', 'semua');
    const box = T.out();
    const bGo = T.btn('Terapkan & Unduh', async () => {
      const f = fi.files && fi.files[0];
      if (!f) { T.show(box, errBox('Pilih dulu file PDF.')); return; }
      if (!tInp.value.trim()) { T.show(box, errBox('Isi teks watermark.')); return; }
      const ok = await needLib(); if (!ok) return;
      T.show(box, '<span class="dim">Menambahkan watermark…</span>');
      try {
        const doc = await window.PDFLib.PDFDocument.load(new Uint8Array(await f.arrayBuffer()), { ignoreEncryption: true });
        const n = doc.getPageCount();
        const targets = parsePages(pgInp.value, n);
        const font = await doc.embedFont(window.PDFLib.StandardFonts.HelveticaBold);
        const size = +sSel.value, op = +oSel.value, ang = +aSel.value;
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
        dlPdf(await doc.save(), 'pdf-watermark.pdf');
        T.show(box, '<span class="ok">Watermark diterapkan di ' + targets.length + ' halaman.</span>');
      } catch (e) { T.show(box, errBox('Gagal: ' + e.message)); }
    }, true);
    pWm.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Tambahkan teks watermark diagonal di halaman PDF.</p>'));
    pWm.appendChild(fi);
    pWm.appendChild(T.field('Teks watermark', tInp));
    pWm.appendChild(T.grid2(T.field('Ukuran', sSel), T.field('Transparansi', oSel)));
    pWm.appendChild(T.grid2(T.field('Sudut', aSel), T.field('Halaman target', pgInp)));
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
            const selEl = T.select([['', '— pilih —']].concat(opts.map((o) => [o, o])), cur);
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
    bGo.hidden = true;
    const chkRow = T.el('<label style="display:flex;gap:10px;align-items:center;font-size:14px;margin:8px 0;cursor:pointer"></label>');
    chkRow.appendChild(flatChk);
    chkRow.appendChild(T.el('<span>Kunci form setelah diisi (flatten, tidak bisa diubah lagi)</span>'));
    pForm.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Isi form PDF (AcroForm): isian teks, kotak centang, dan pilihan (dropdown/radio).</p>'));
    pForm.appendChild(fi);
    pForm.appendChild(T.row(bLoad));
    pForm.appendChild(box);
    pForm.appendChild(formWrap);
    pForm.appendChild(chkRow);
    pForm.appendChild(T.row(bGo));
  }

  const pages = [pOrg, pMerge, pSplit, pImg, pWm, pTx, pMeta, pForm];
  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">8 operasi PDF langsung di perangkatmu — file tidak diupload ke mana pun.</p>'));
  root.appendChild(tabs(
    [['Atur', 0], ['Gabung', 1], ['Pisah', 2], ['Gambar→PDF', 3], ['Watermark', 4], ['Teks', 5], ['Metadata', 6], ['Form', 7]],
    pages
  ));
  pages.forEach((p) => root.appendChild(p));
  root.appendChild(status);
}
