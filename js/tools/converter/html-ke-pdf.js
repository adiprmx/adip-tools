import { h as T, kv, fmtBytes, errBox } from '../../core.js?v=6.12.0';

export const meta = {"id":"html-ke-pdf","name":"HTML ke PDF","cat":"converter","icon":"📄","desc":"Ubah kode HTML jadi file PDF ukuran A4.","keywords":"html,pdf,konversi,dokumen,cetak,a4","since":"6.11.0"};

/* HTML ke PDF: pratinjau di iframe srcdoc, lalu render lewat html2canvas
   1.4.1 + jsPDF 2.5.1 (sama seperti tool Auto PDF di repo ini). Halaman
   dipotong per A4 dari hasil render. Jujur soal batas: cocok untuk konten
   sederhana; gambar dari situs lain kadang tidak muncul karena aturan
   situs tersebut, dan font dari internet kadang tidak ikut terbawa. */
const JSPDF_CDNS = [
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js',
  'https://unpkg.com/jspdf@2.5.1/dist/jspdf.umd.min.js',
];
const H2C_CDNS = [
  'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
];
const MAX_HTML = 200000;

export function render(root) {
  const ta = T.ta(10, '<h1>Judul Dokumen</h1>\n<p>Ini contoh isi dokumen. Tulis HTML sendiri di sini, lalu buat PDF-nya.</p>\n<ul>\n  <li>Poin pertama</li>\n  <li>Poin kedua</li>\n</ul>');
  const frame = document.createElement('iframe');
  frame.setAttribute('sandbox', 'allow-scripts');
  frame.style.cssText = 'width:100%;height:420px;border:1px solid #ffffff20;border-radius:10px;background:#fff';
  const prevWrap = T.el('<div style="margin-top:12px" hidden></div>');
  prevWrap.appendChild(T.el('<p class="hint" style="margin-bottom:6px">Pratinjau (tampilan ini yang masuk ke PDF):</p>'));
  prevWrap.appendChild(frame);
  const box = T.out();

  let libsOk = null, libsLoading = false;
  const ensureLibs = () => {
    if (libsOk !== null) return Promise.resolve(libsOk);
    if (libsLoading) return new Promise((res) => { const t = setInterval(() => { if (libsOk !== null) { clearInterval(t); res(libsOk); } }, 300); });
    libsLoading = true;
    const coba = async (list, check) => {
      for (const u of list) {
        const ok = await T.loadScript(u);
        if (ok && check()) return true;
      }
      return false;
    };
    return (async () => {
      T.show(box, '<span class="dim">Menyiapkan alat PDF…</span>');
      const h2c = await coba(H2C_CDNS, () => typeof window.html2canvas === 'function');
      const pdf = h2c && await coba(JSPDF_CDNS, () => !!(window.jspdf && window.jspdf.jsPDF));
      libsOk = !!(h2c && pdf);
      if (!libsOk) T.show(box, errBox('Alat PDF tidak bisa dimuat dari internet. Periksa koneksi, lalu coba lagi.'));
      return libsOk;
    })();
  };

  const contohBtn = T.btn('Isi contoh', () => {
    ta.value = '<h1 style="font-family:sans-serif">Laporan Singkat</h1>\n<p style="font-family:sans-serif;line-height:1.6">Dokumen ini dibuat dari HTML dan diubah jadi PDF langsung di browser.</p>\n<table border="1" cellpadding="8" cellspacing="0" style="font-family:sans-serif;border-collapse:collapse">\n  <tr><th>Barang</th><th>Jumlah</th><th>Harga</th></tr>\n  <tr><td>Kopi</td><td>2</td><td>Rp20.000</td></tr>\n  <tr><td>Teh</td><td>1</td><td>Rp8.000</td></tr>\n</table>';
  });

  const pratinjau = () => {
    const html = ta.value.trim();
    if (!html) { T.show(box, errBox('Tempel kode HTML dulu.')); return; }
    if (html.length > MAX_HTML) { T.show(box, errBox('HTML terlalu panjang (maksimal ' + (MAX_HTML / 1000) + ' ribu karakter).')); return; }
    frame.srcdoc = html;
    prevWrap.hidden = false;
    T.hide(box);
    T.scrollToPreview(prevWrap);
  };

  const buatPdf = async () => {
    const html = ta.value.trim();
    if (!html) { T.show(box, errBox('Tempel kode HTML dulu.')); return; }
    if (html.length > MAX_HTML) { T.show(box, errBox('HTML terlalu panjang (maksimal ' + (MAX_HTML / 1000) + ' ribu karakter).')); return; }
    const ok = await ensureLibs();
    if (!ok) return;
    T.show(box, '<span class="dim">Menggambar halaman…</span>');
    const stage = document.createElement('div');
    stage.style.cssText = 'position:fixed;left:-9999px;top:0;width:794px;background:#ffffff;color:#111111;padding:40px 48px;box-sizing:border-box;font-family:sans-serif;font-size:15px;line-height:1.6';
    stage.innerHTML = html;
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
      T.show(box, kv('Halaman', pages + ' halaman A4') + kv('Ukuran file', fmtBytes(blob.size)));
      box.appendChild(T.row(T.btn('Unduh PDF', () => {
        const a = document.createElement('a');
        a.href = url; a.download = 'dokumen.pdf';
        document.body.appendChild(a); a.click(); a.remove();
      }, true)));
      T.toast('PDF jadi, ' + pages + ' halaman');
    } catch (e) {
      T.show(box, errBox('PDF tidak bisa dibuat. Kemungkinan ada gambar dari situs lain yang diblokir browser, atau HTML-nya terlalu rumit. Coba sederhanakan isinya.'));
    } finally {
      stage.remove();
    }
  };

  root.appendChild(T.el('<p class="note">Diproses di browser. Alat PDF dimuat sekali dari internet saat tombol ditekan.</p>'));
  root.appendChild(T.el('<p class="mut" style="font-size:13.5px;line-height:1.6">Tempel kode HTML, lihat pratinjaunya, lalu buat PDF ukuran A4. Cocok untuk dokumen sederhana seperti laporan, daftar, atau surat. Gambar dari situs lain kadang tidak muncul karena aturan situs tersebut.</p>'));
  root.appendChild(T.field('Kode HTML', ta));
  root.appendChild(T.row(contohBtn));
  root.appendChild(T.row(T.btn('Lihat pratinjau', pratinjau), T.btn('Buat PDF', buatPdf, true)));
  root.appendChild(prevWrap);
  root.appendChild(box);
}
