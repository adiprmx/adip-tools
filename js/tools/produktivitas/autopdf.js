import { h as T, errBox } from '../../core.js?v=6.9.20';

export const meta = {"id": "autopdf", "name": "Auto PDF", "cat": "produktivitas", "icon": "📄", "desc": "Ubah teks panjang jadi dokumen PDF rapi.", "keywords": "pdf,teks,dokumen,naskah,cetak"};

export function render(root) {

  const JSPDF_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
  const MAX_SEC = 5, MAX_TITLE = 180, MAX_BODY = 80000;

  const paperSel = T.select([['a5', 'A5'], ['a4', 'A4']], 'a5');
  const fontSel = T.select([['helvetica', 'Helvetica'], ['times', 'Times Roman']], 'helvetica');
  const sizeSel = T.select([['8', '8'], ['9', '9'], ['10', '10'], ['11', '11'], ['12', '12'], ['14', '14'], ['16', '16'], ['18', '18']], '11');
  const lhSel = T.select([['1.1', '1,1'], ['1.3', '1,3'], ['1.5', '1,5'], ['1.8', '1,8'], ['2.2', '2,2']], '1.5');
  const marginSel = T.select([['20', '20 pt'], ['30', '30 pt'], ['42', '42 pt'], ['60', '60 pt'], ['90', '90 pt']], '42');
  const newPageChk = T.el('<input type="checkbox" checked style="width:18px;height:18px;accent-color:#e07856">');
  const fnameInp = T.input('text', 'nama-file', 'dokumen');

  const secWrap = T.el('<div style="display:grid;gap:12px;margin:12px 0"></div>');
  const sections = [];
  function addSection(title, body) {
    if (sections.length >= MAX_SEC) { T.show(box, errBox('Maksimal ' + MAX_SEC + ' bagian.')); return; }
    const card = T.el('<div style="border:1px solid #ffffff20;border-radius:12px;padding:12px"></div>');
    const tInp = T.input('text', 'Judul bagian (maks 180 karakter)', title || '');
    tInp.maxLength = MAX_TITLE;
    const bTa = T.ta(6, 'Isi teks bagian ini…', body || '');
    bTa.maxLength = MAX_BODY;
    const head = T.el('<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><b>Bagian ' + (sections.length + 1) + '</b></div>');
    const bDel = T.btn('Hapus', () => {
      const i = sections.findIndex((s) => s.card === card);
      if (i >= 0) sections.splice(i, 1);
      card.remove();
      renumber(); updateStats();
    });
    bDel.classList.add('small');
    head.appendChild(bDel);
    card.appendChild(head);
    card.appendChild(T.field('Judul', tInp));
    card.appendChild(T.field('Isi', bTa));
    secWrap.appendChild(card);
    sections.push({ card, tInp, bTa });
    const upd = () => updateStats();
    tInp.addEventListener('input', upd); bTa.addEventListener('input', upd);
    updateStats();
  }
  function renumber() {
    sections.forEach((s, i) => { s.card.querySelector('b').textContent = 'Bagian ' + (i + 1); });
  }

  const box = T.out();
  const statBox = T.el('<div class="dim" style="font-size:13px;margin:8px 0"></div>');
  const previewWrap = T.el('<div style="margin-top:12px" hidden></div>');
  const frame = document.createElement('iframe');
  frame.style.cssText = 'width:100%;height:480px;border:1px solid #ffffff20;border-radius:12px;background:#fff';
  previewWrap.appendChild(frame);

  const kata = (s) => (String(s).trim().match(/\S+/g) || []).length;

  function collect() {
    return sections.map((s) => ({ title: s.tInp.value.trim(), body: s.bTa.value.trim() }))
      .filter((s) => s.title || s.body);
  }

  function updateStats() {
    const secs = collect();
    const words = secs.reduce((a, s) => a + kata(s.title) + kata(s.body), 0);
    statBox.innerHTML = secs.length
      ? 'Statistik: <b>' + secs.length + '</b> bagian · <b>' + words.toLocaleString('id-ID') + '</b> kata'
      : 'Tambahkan minimal 1 bagian untuk membuat PDF.';
  }

  function sanitizeName(s) {
    return (s || 'dokumen').normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      .slice(0, 64) || 'dokumen';
  }

  let libOk = null, libLoading = false;
  const ensureLib = () => {
    if (libOk !== null) return Promise.resolve(libOk);
    if (libLoading) return new Promise((res) => { const t = setInterval(() => { if (libOk !== null) { clearInterval(t); res(libOk); } }, 300); });
    libLoading = true;
    T.show(box, '<span class="dim">Memuat library PDF…</span>');
    return T.loadScript(JSPDF_CDN).then((ok) => {
      libOk = ok && !!(window.jspdf && window.jspdf.jsPDF);
      if (!libOk) T.show(box, errBox('Gagal memuat library PDF dari CDN. Cek koneksi internet lalu coba lagi.'));
      return libOk;
    });
  };

  const PAPER = { a4: [595.28, 841.89], a5: [419.53, 595.28] };

  const generate = async () => {
    const secs = collect();
    if (!secs.length) { T.show(box, errBox('Masukkan judul atau isi dokumen dulu.')); return; }
    const ok = await ensureLib();
    if (!ok) return;
    T.show(box, '<span class="dim">Menyusun PDF…</span>');
    try {
      const [pw, ph] = PAPER[paperSel.value] || PAPER.a5;
      const font = fontSel.value, fsize = +sizeSel.value, lh = +lhSel.value, margin = +marginSel.value;
      const doc = new window.jspdf.jsPDF({ unit: 'pt', format: [pw, ph], compress: true });
      doc.setFont(font, 'normal');
      const usableW = pw - margin * 2;
      const lineH = fsize * lh;
      let y = 0, pages = 0;
      const needPage = () => { if (pages === 0 || y > ph - margin - lineH) { if (pages > 0) doc.addPage(); pages++; y = margin + fsize; } };
      const writeTitle = (t) => {
        needPage();
        doc.setFont(font, 'bold'); doc.setFontSize(Math.min(fsize + 5, 24));
        const lines = doc.splitTextToSize(t, usableW);
        for (const ln of lines) { needPage(); doc.text(ln, margin, y); y += (fsize + 5) * 1.25; }
        doc.setFont(font, 'normal'); doc.setFontSize(fsize);
        y += 6;
      };
      const writeBody = (b) => {
        doc.setFontSize(fsize);
        const paras = b.split(/\n+/);
        for (const p of paras) {
          const lines = doc.splitTextToSize(p, usableW);
          for (const ln of lines) { needPage(); doc.text(ln, margin, y); y += lineH; }
          y += lineH * 0.4;
        }
      };
      secs.forEach((s, i) => {
        if (i > 0 && newPageChk.checked) { doc.addPage(); pages++; y = margin + fsize; }
        if (s.title) writeTitle(s.title);
        if (s.body) writeBody(s.body);
      });
      if (pages === 0) { doc.addPage(); pages = 1; }
      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      frame.src = url;
      previewWrap.hidden = false;
      const words = secs.reduce((a, s) => a + kata(s.title) + kata(s.body), 0);
      const fname = sanitizeName(fnameInp.value);
      T.show(box, '<div class="kv"><span class="k">Halaman</span><span class="v">' + pages + '</span></div>' +
        '<div class="kv"><span class="k">Kata</span><span class="v">' + words.toLocaleString('id-ID') + '</span></div>' +
        '<div class="kv"><span class="k">Ukuran</span><span class="v">' + (blob.size / 1024).toFixed(1) + ' KB</span></div>' +
        '<div style="margin-top:10px">' + '' + '</div>');
      const bDl = T.btn('Unduh PDF (' + fname + '.pdf)', () => {
        const a = document.createElement('a');
        a.href = url; a.download = fname + '.pdf';
        document.body.appendChild(a); a.click(); a.remove();
      }, true);
      box.appendChild(T.row(bDl));
      frame.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (e) { T.show(box, errBox('Gagal membuat PDF: ' + e.message)); }
  };

  const bAdd = T.btn('+ Tambah Bagian', () => addSection('', ''));
  const bReset = T.btn('Reset', () => {
    sections.splice(0).forEach(() => {});
    secWrap.innerHTML = ''; sections.length = 0;
    addSection('', ''); updateStats();
  });
  bReset.classList.add('small');

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Ubah teks panjang jadi PDF A5/A4 — 100% lokal di perangkatmu, tanpa server.</p>'));
  root.appendChild(secWrap);
  root.appendChild(T.row(bAdd, bReset));
  root.appendChild(T.el('<div style="margin:14px 0 4px"><b>Pengaturan</b></div>'));
  root.appendChild(T.grid2(T.field('Ukuran kertas', paperSel), T.field('Font', fontSel)));
  root.appendChild(T.grid2(T.field('Ukuran font', sizeSel), T.field('Jarak baris', lhSel)));
  root.appendChild(T.grid2(T.field('Margin', marginSel), T.field('Nama file', fnameInp)));
  const chkRow = T.el('<label style="display:flex;gap:10px;align-items:center;font-size:14px;margin:8px 0;cursor:pointer"></label>');
  chkRow.appendChild(newPageChk);
  chkRow.appendChild(T.el('<span>Mulai setiap bagian di halaman baru</span>'));
  root.appendChild(chkRow);
  root.appendChild(statBox);
  root.appendChild(T.row(T.btn('Buat PDF', generate, true)));
  root.appendChild(box);
  root.appendChild(previewWrap);

  addSection('', '');
}
