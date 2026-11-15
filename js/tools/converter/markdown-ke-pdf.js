import { h as T, kv, fmtBytes, errBox } from '../../core.js?v=6.11.5';

export const meta = {"id":"markdown-ke-pdf","name":"Markdown ke PDF","cat":"converter","icon":"📝","desc":"Ubah tulisan Markdown jadi PDF A4 dengan pratinjau dulu.","keywords":"markdown,pdf,dokumen,tulisan,md,a4","since":"6.11.0"};

/* Markdown ke PDF: parser marked 12.0.2 (CDN, pin versi) + html2canvas
   1.4.1 + jsPDF 2.5.1. Bila marked gagal dimuat, dipakai parser kecil
   bawaan (heading, tebal, miring, list, kode) dengan catatan jujur di UI. */
const MARKED_CDNS = [
  'https://cdn.jsdelivr.net/npm/marked@12.0.2/marked.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/marked/12.0.2/marked.min.js',
];
const H2C_CDNS = [
  'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
];
const JSPDF_CDNS = [
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js',
  'https://unpkg.com/jspdf@2.5.1/dist/jspdf.umd.min.js',
];
const MAX_MD = 100000;

/* Parser kecil cadangan bila marked gagal dimuat. */
export function miniMd(md) {
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const inline = (t) => esc(t)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[\s(])\*([^*\n]+)\*/g, '$1<em>$2</em>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  let html = '';
  const lines = String(md || '').split('\n');
  let inList = false, inCode = false, codeBuf = [];
  const closeList = () => { if (inList) { html += '</ul>'; inList = false; } };
  for (const ln of lines) {
    if (/^```/.test(ln)) {
      if (inCode) { html += '<pre><code>' + esc(codeBuf.join('\n')) + '</code></pre>'; codeBuf = []; inCode = false; }
      else { closeList(); inCode = true; }
      continue;
    }
    if (inCode) { codeBuf.push(ln); continue; }
    const t = ln.replace(/\s+$/, '');
    if (/^\s*$/.test(t)) { closeList(); continue; }
    let m;
    if ((m = t.match(/^(#{1,6})\s+(.*)/))) { closeList(); html += '<h' + m[1].length + '>' + inline(m[2]) + '</h' + m[1].length + '>'; continue; }
    if (/^(---+|\*\*\*+)\s*$/.test(t)) { closeList(); html += '<hr>'; continue; }
    if ((m = t.match(/^\s*[-*+]\s+(.*)/))) {
      if (!inList) { html += '<ul>'; inList = true; }
      html += '<li>' + inline(m[1]) + '</li>'; continue;
    }
    closeList();
    html += '<p>' + inline(t) + '</p>';
  }
  if (inCode) html += '<pre><code>' + esc(codeBuf.join('\n')) + '</code></pre>';
  closeList();
  return html;
}

export function render(root) {
  const ta = T.ta(10, '# Laporan Mingguan\n\nMinggu ini berjalan **lancar**. Beberapa hal yang selesai:\n\n- Laporan penjualan dikirim\n- Stok gudang dicek ulang\n- Jadwal kirim minggu depan disusun\n\n> Catatan: harga bahan naik sedikit minggu ini.\n\nTerima kasih.');
  const prev = T.el('<div style="background:#ffffff;color:#111111;border:1px solid #ffffff20;border-radius:10px;padding:28px 24px;font-size:15px;line-height:1.7;min-height:160px"></div>');
  prev.innerHTML = '<span style="color:#71717a">Pratinjau muncul di sini…</span>';
  const box = T.out();
  let markedOk = null, pdfLibsOk = null, simpleMode = false;

  const ensureMarked = async () => {
    if (markedOk !== null) return markedOk;
    for (const u of MARKED_CDNS) {
      const ok = await T.loadScript(u);
      if (ok && window.marked && typeof window.marked.parse === 'function') { markedOk = true; return true; }
    }
    markedOk = false;
    return false;
  };
  const ensurePdfLibs = async () => {
    if (pdfLibsOk !== null) return pdfLibsOk;
    const coba = async (list, check) => {
      for (const u of list) {
        const ok = await T.loadScript(u);
        if (ok && check()) return true;
      }
      return false;
    };
    const h2c = await coba(H2C_CDNS, () => typeof window.html2canvas === 'function');
    const pdf = h2c && await coba(JSPDF_CDNS, () => !!(window.jspdf && window.jspdf.jsPDF));
    pdfLibsOk = !!(h2c && pdf);
    return pdfLibsOk;
  };

  const parse = (md) => {
    if (markedOk && window.marked) return window.marked.parse(md);
    return miniMd(md);
  };

  const pratinjau = async () => {
    const md = ta.value.trim();
    if (!md) { T.show(box, errBox('Tulis Markdown dulu.')); return; }
    if (md.length > MAX_MD) { T.show(box, errBox('Tulisan terlalu panjang (maksimal ' + (MAX_MD / 1000) + ' ribu karakter).')); return; }
    T.show(box, '<span class="dim">Memuat pratinjau…</span>');
    const ok = await ensureMarked();
    simpleMode = !ok;
    prev.innerHTML = parse(md);
    T.show(box, simpleMode
      ? '<p class="hint">Pustaka Markdown tidak bisa dimuat (koneksi bermasalah), jadi pratinjau memakai parser sederhana. Heading, tebal, miring, list, dan kode tetap jalan.</p>'
      : '<p class="hint">Pratinjau di atas adalah tampilan yang masuk ke PDF.</p>');
    T.scrollToPreview(prev);
  };

  const buatPdf = async () => {
    const md = ta.value.trim();
    if (!md) { T.show(box, errBox('Tulis Markdown dulu.')); return; }
    if (md.length > MAX_MD) { T.show(box, errBox('Tulisan terlalu panjang (maksimal ' + (MAX_MD / 1000) + ' ribu karakter).')); return; }
    T.show(box, '<span class="dim">Memuat pustaka PDF…</span>');
    await ensureMarked();
    const ok = await ensurePdfLibs();
    if (!ok) { T.show(box, errBox('Gagal memuat pustaka PDF dari internet. Periksa koneksi, lalu coba lagi.')); return; }
    prev.innerHTML = parse(md);
    const stage = document.createElement('div');
    stage.style.cssText = 'position:fixed;left:-9999px;top:0;width:794px;background:#ffffff;color:#111111;padding:40px 48px;box-sizing:border-box;font-family:sans-serif;font-size:15px;line-height:1.7';
    stage.innerHTML = prev.innerHTML;
    document.body.appendChild(stage);
    try {
      await new Promise((r) => setTimeout(r, 60));
      const canvas = await window.html2canvas(stage, { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff' });
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
      const pageW = 210, pageH = 297;
      const sliceH = Math.floor(canvas.width * (pageH / pageW));
      let pages = 0;
      for (let y = 0; y < canvas.height; y += sliceH) {
        const h = Math.min(sliceH, canvas.height - y);
        const part = document.createElement('canvas');
        part.width = canvas.width; part.height = h;
        const pc = part.getContext('2d');
        pc.fillStyle = '#ffffff'; pc.fillRect(0, 0, part.width, part.height);
        pc.drawImage(canvas, 0, y, canvas.width, h, 0, 0, canvas.width, h);
        if (pages > 0) doc.addPage();
        doc.addImage(part.toDataURL('image/png'), 'PNG', 0, 0, pageW, (h / canvas.width) * pageW);
        pages++;
      }
      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      T.show(box, kv('Halaman', pages + ' halaman A4') + kv('Ukuran file', fmtBytes(blob.size)) +
        (simpleMode ? '<p class="hint">Dibuat dengan parser sederhana karena pustaka Markdown tidak termuat.</p>' : ''));
      box.appendChild(T.row(T.btn('Unduh PDF', () => {
        const a = document.createElement('a');
        a.href = url; a.download = 'dokumen.pdf';
        document.body.appendChild(a); a.click(); a.remove();
      }, true)));
      T.toast('PDF jadi, ' + pages + ' halaman');
    } catch (e) {
      T.show(box, errBox('Gagal membuat PDF. Coba sederhanakan isi tulisannya.'));
    } finally {
      stage.remove();
    }
  };

  const contohBtn = T.btn('Isi contoh', () => {
    ta.value = '# Catatan Rapat\n\n**Tanggal:** Senin, 16 November 2026\n\n## Yang dibahas\n\n- Stok minggu ini aman\n- Promo akhir bulan disiapkan\n- Jadwal kirim diatur ulang\n\n## Tindak lanjut\n\n1. Cek harga pemasok\n2. Hubungi pelanggan yang menunggu\n\n> Semua poin di atas perlu selesai minggu ini.';
  });

  root.appendChild(T.el('<p class="note">Diproses di browser. Pustaka Markdown dan PDF dimuat sekali dari internet saat tombol ditekan.</p>'));
  root.appendChild(T.el('<p class="mut" style="font-size:13.5px;line-height:1.6">Tulis dengan format Markdown (judul pakai #, tebal pakai **, list pakai -), lihat pratinjaunya, lalu unduh PDF A4.</p>'));
  root.appendChild(T.field('Tulisan Markdown', ta));
  root.appendChild(T.row(contohBtn));
  root.appendChild(T.row(T.btn('Lihat pratinjau', pratinjau), T.btn('Buat PDF', buatPdf, true)));
  root.appendChild(T.el('<div class="hint" style="margin:12px 0 6px">Pratinjau:</div>'));
  root.appendChild(prev);
  root.appendChild(box);
}
