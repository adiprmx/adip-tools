// MERGE B22 (v6.21.0, D2): satu tool dua arah. Mesin kedua arah
// dipertahankan berdampingan di file ini (NOL fungsi hilang):
// arah A = html-ke-pdf (survivor), arah B = pdf-ke-html (dipensiunkan,
// diserap ke sini). Sakelar arah ada di paling atas render().

import { h as T, utils, kv, fmtBytes, errBox, fileInput, LOCAL_NOTE } from '../../core.js';
import { createPreviewFrame } from '../../preview-frame.js';

export const meta = {"id": "html-ke-pdf", "name": "HTML ↔ PDF", "cat": "converter", "icon": "📄", "desc": "Ubah kode HTML jadi PDF A4, atau PDF jadi halaman HTML.", "keywords": "html,pdf,konversi,dokumen,cetak,a4,html ke pdf,pdf ke html,pdf jadi web,pdf ke halaman", "since": "6.11.0"};


/* HTML ke PDF: pratinjau di iframe /preview.html (G-2, v6.19.1 — pengganti
   srcdoc yang mewarisi CSP induk; frame opak, HTML dikirim postMessage),
   lalu render lewat html2canvas
   1.4.1 + jsPDF 2.5.1 (sama seperti tool Auto PDF di repo ini). Halaman
   dipotong per A4 dari hasil render. Jujur soal batas: cocok untuk konten
   sederhana; gambar dari situs lain kadang tidak muncul karena aturan
   situs tersebut, dan font dari internet kadang tidak ikut terbawa.
   Stage render dibersihkan dulu (sanitizeHtml, pola yang sama dengan
   markdown-ke-pdf): skrip dan kode tempelan di HTML tidak bisa jalan di
   halaman utama — hanya tampilan dokumennya yang masuk ke PDF. */
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

/* Bersihkan HTML tempelan sebelum masuk stage render di dokumen utama
   (pola yang sama dengan sanitizeHtml di markdown-ke-pdf): tanpa ini,
   <img onerror> atau <script> di HTML tempelan jalan di origin situs
   (self-XSS). Isi tampilan (judul, teks, tabel, gambar) tetap dipertahankan;
   yang dibuang hanya yang bisa menjalankan kode. */
// Normalisasi URL ala parser browser (WHATWG): tab/LF/CR dibuang di mana
// saja, karakter kontrol + spasi dibuang di ujung. Tanpa ini "java\tscript:"
// dan "\x01javascript:" lolos uji skema tapi tetap jalan sebagai
// javascript: saat diklik (Q3 v6.21.0).
const normalUrl = (v) => String(v || '').replace(/[\t\n\r]/g, '').replace(/^[\u0000-\u0020]+|[\u0000-\u0020]+$/g, '');
const urlBerbahaya = (v) => /^(javascript|vbscript):/i.test(normalUrl(v));
const tautanOk = (v) => /^(https?:|mailto:)/i.test(normalUrl(v));
// xlink:href di SVG: tautan web + gambar data: boleh, sisanya dibuang.
const xlinkOk = (v) => /^(https?:|mailto:|data:image\/)/i.test(normalUrl(v));

export const sanitizeHtml = (raw) => {
  const doc = new DOMParser().parseFromString(String(raw || ''), 'text/html');
  // Elemen animasi SVG (animate, animateTransform, animateMotion, set,
  // mpath) dan foreignObject ikut dibuang: tidak ada gunanya di PDF
  // statis, dan menutup rapat kelas vektor animasi SVG.
  doc.querySelectorAll('script,style,iframe,object,embed,form,link,meta,base,animate,animateTransform,animateMotion,set,mpath,foreignObject').forEach((n) => n.remove());
  doc.querySelectorAll('*').forEach((n) => {
    [...n.attributes].forEach((a) => {
      if (/^on/i.test(a.name)) n.removeAttribute(a.name);
      // xlink:href ikut dicopot: tautan javascript: di dalam <svg> lolos
      // bila hanya src/href yang diperiksa. Uji skema pakai nilai yang
      // sudah dinormalisasi ala parser browser (Q3).
      if ((a.name === 'src' || a.name === 'href' || a.name === 'xlink:href') && urlBerbahaya(a.value)) n.removeAttribute(a.name);
      if (a.name === 'xlink:href' && !xlinkOk(a.value)) n.removeAttribute(a.name);
    });
  });
  // <area> ikut pass allowlist (Q3): href-nya tidak tercakup pass a[href].
  doc.querySelectorAll('a[href], area[href]').forEach((a) => {
    const href = a.getAttribute('href') || '';
    if (tautanOk(href)) { a.setAttribute('target', '_blank'); a.setAttribute('rel', 'noopener'); }
    else a.removeAttribute('href');
  });
  doc.querySelectorAll('img').forEach((img) => {
    const src = img.getAttribute('src') || '';
    if (!/^(https?:|data:image\/)/i.test(normalUrl(src))) img.removeAttribute('src');
    img.style.maxWidth = '100%';
  });
  return doc.body.innerHTML;
};

// ---------- Mesin arah B: PDF → HTML (dari pdf-ke-html.js) ----------
const PDFJS_CDN = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js';
const PDFJS_WORKER = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
const MAKS_HALAMAN = 50;
const SKALA_GAMBAR = 1.5;

export function escHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Satu halaman jadi potongan HTML: gambar + teksnya. Murni, bisa diuji di Node.
export function halamanKeHtml(nomor, gambarDataUrl, paragraf) {
  const teks = (paragraf || []).map((p) => '<p>' + escHtml(p) + '</p>').join('\n');
  return '<section class="halaman">\n<h2>Halaman ' + nomor + '</h2>\n'
    + (gambarDataUrl ? '<img src="' + gambarDataUrl + '" alt="Halaman ' + nomor + '">\n' : '')
    + teks + '\n</section>';
}

// Bungkus semua halaman jadi dokumen HTML lengkap. Murni, bisa diuji di Node.
export function bungkusDokumenHtml(judul, halamanHtml) {
  return '<!DOCTYPE html>\n<html lang="id">\n<head>\n<meta charset="utf-8">\n<title>' + escHtml(judul) + '</title>\n'
    + '<style>body{font-family:system-ui,sans-serif;max-width:860px;margin:0 auto;padding:24px 16px;line-height:1.6;color:#222;background:#fff}'
    + '.halaman{margin-bottom:48px}.halaman img{max-width:100%;height:auto;display:block;border:1px solid #ddd;margin:12px 0}'
    + 'h1{font-size:1.6em}h2{font-size:1.2em;color:#444}</style>\n</head>\n<body>\n<h1>' + escHtml(judul) + '</h1>\n'
    + halamanHtml.join('\n') + '\n</body>\n</html>\n';
}

// Kelompokkan potongan teks pdf.js jadi paragraf (pola yang sama seperti
// tool PDF ke Word). Murni, bisa diuji di Node.
export function itemsKeParagraf(items) {
  const urut = (items || []).slice().sort((a, b) => {
    const dy = (b.transform[5] || 0) - (a.transform[5] || 0);
    if (Math.abs(dy) > 2) return dy;
    return (a.transform[4] || 0) - (b.transform[4] || 0);
  });
  const baris = [];
  for (const it of urut) {
    const teks = String(it.str || '');
    if (!teks.trim()) continue;
    const y = it.transform[5] || 0;
    const x = it.transform[4] || 0;
    const h = Math.abs(it.transform[3] || it.height || 12) || 12;
    const lebar = it.width || teks.length * h * 0.5;
    const terakhir = baris[baris.length - 1];
    if (terakhir && Math.abs(terakhir.y - y) <= Math.max(2, h * 0.4)) {
      terakhir.potong.push({ x, teks, lebar });
    } else {
      baris.push({ y, h, potong: [{ x, teks, lebar }] });
    }
  }
  const paragraf = [];
  let jalan = '';
  let ySebelumnya = null;
  for (const b of baris) {
    b.potong.sort((a, c) => a.x - c.x);
    let teksBaris = '';
    let ujung = null;
    for (const p of b.potong) {
      if (ujung !== null && p.x > ujung + 1) teksBaris += ' ';
      teksBaris += p.teks;
      ujung = p.x + p.lebar;
    }
    teksBaris = teksBaris.replace(/\s+/g, ' ').trim();
    if (!teksBaris) continue;
    if (ySebelumnya !== null && Math.abs(ySebelumnya - b.y) > b.h * 1.8 && jalan) {
      paragraf.push(jalan);
      jalan = '';
    }
    jalan = jalan ? jalan + ' ' + teksBaris : teksBaris;
    ySebelumnya = b.y;
  }
  if (jalan) paragraf.push(jalan);
  return paragraf;
}

// Sakelar arah: dua tombol besar di paling atas. Arah yang aktif tampil
// terbalik (putih di atas hitam) supaya langsung kelihatan tanpa membaca
// kecil-kecil. Kedua panel tetap hidup berdampingan — pindah arah tidak
// menghapus isian di panel yang ditinggalkan.
/* R1 (v6.21.0): alias redirect — kunjungan dari tautan lama arah B
   (#/t/<id-pensiun>) mendarat di sini dengan ?dir=b; buka langsung
   panel arah B. Tanpa ?dir=b, perilaku lama (arah A) tidak berubah. */
function mintaArahB() {
  try {
    const q = (typeof location !== 'undefined' && location.hash.split('?')[1]) || '';
    return /(?:^|&)dir=b(?:&|$)/.test(q);
  } catch {
    return false;
  }
}

function buatSakelarArah(labelA, labelB, panelA, panelB) {
  const bungkus = T.el('<div role="tablist" aria-label="Arah konversi" style="display:flex;gap:8px;margin:2px 0 16px"></div>');
  const GAYA_AKTIF = 'flex:1;min-height:48px;padding:12px 8px;border-radius:10px;border:1px solid #ffffff;font-size:15px;font-weight:700;background:#ffffff;color:#000000;cursor:pointer;transition:background .15s,color .15s,border-color .15s';
  const GAYA_MATI = 'flex:1;min-height:48px;padding:12px 8px;border-radius:10px;border:1px solid #ffffff33;font-size:15px;font-weight:600;background:transparent;color:#a1a1aa;cursor:pointer;transition:background .15s,color .15s,border-color .15s';
  const tombolA = document.createElement('button');
  tombolA.type = 'button';
  tombolA.textContent = labelA;
  tombolA.setAttribute('role', 'tab');
  const tombolB = document.createElement('button');
  tombolB.type = 'button';
  tombolB.textContent = labelB;
  tombolB.setAttribute('role', 'tab');
  const atur = (keA) => {
    tombolA.style.cssText = keA ? GAYA_AKTIF : GAYA_MATI;
    tombolB.style.cssText = keA ? GAYA_MATI : GAYA_AKTIF;
    tombolA.setAttribute('aria-selected', keA ? 'true' : 'false');
    tombolB.setAttribute('aria-selected', keA ? 'false' : 'true');
    panelA.hidden = !keA;
    panelB.hidden = keA;
  };
  tombolA.addEventListener('click', () => atur(true));
  tombolB.addEventListener('click', () => atur(false));
  bungkus.appendChild(tombolA);
  bungkus.appendChild(tombolB);
  atur(!mintaArahB());
  return bungkus;
}

function renderHtmlKePdf(panel) {
  const ta = T.ta(10, '<h1>Judul Dokumen</h1>\n<p>Ini contoh isi dokumen. Tulis HTML sendiri di sini, lalu buat PDF-nya.</p>\n<ul>\n  <li>Poin pertama</li>\n  <li>Poin kedua</li>\n</ul>');
  const pv = createPreviewFrame();
  const frame = pv.frame;
  frame.style.cssText = 'width:100%;height:420px;border:1px solid #ffffff20;border-radius:10px;background:#fff';
  const prevWrap = T.el('<div style="margin-top:12px" hidden></div>');
  prevWrap.appendChild(T.el('<p class="hint" style="margin-bottom:6px">Pratinjau (tampilan ini yang masuk ke PDF):</p>'));
  prevWrap.appendChild(frame);
  const box = T.out();

  let libsOk = null, libsLoading = false;
  let busyPdf = false, pdfUrl = null;
  const ensureLibs = () => {
    if (libsOk !== null) return Promise.resolve(libsOk);
    // Batas 30 detik (A3 v6.21.0): polling tanpa batas menggantung selamanya
    // bila pemuatan pertama macet; habis waktu, janji ini gagal jujur.
    if (libsLoading) return new Promise((res) => {
      const mulai = Date.now();
      const t = setInterval(() => {
        if (libsOk !== null) { clearInterval(t); res(libsOk); }
        else if (Date.now() - mulai > 30000) { clearInterval(t); res(false); }
      }, 300);
    });
    libsLoading = true;
    // Loop fallback CDN kanonis: utils.loadLibOnce (core.js).
    return (async () => {
      T.show(box, '<span class="dim">Menyiapkan alat PDF…</span>');
      const h2c = await utils.loadLibOnce(H2C_CDNS, () => typeof window.html2canvas === 'function');
      const pdf = h2c && await utils.loadLibOnce(JSPDF_CDNS, () => !!(window.jspdf && window.jspdf.jsPDF));
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
    pv.setHtml(html);
    prevWrap.hidden = false;
    T.hide(box);
    T.scrollToPreview(prevWrap);
  };

  const buatPdf = async () => {
    if (busyPdf) return;
    const html = ta.value.trim();
    if (!html) { T.show(box, errBox('Tempel kode HTML dulu.')); return; }
    if (html.length > MAX_HTML) { T.show(box, errBox('HTML terlalu panjang (maksimal ' + (MAX_HTML / 1000) + ' ribu karakter).')); return; }
    busyPdf = true;
    pdfBtn.disabled = true;
    try {
      const ok = await ensureLibs();
      if (!ok) return;
      T.show(box, '<span class="dim">Menggambar halaman…</span>');
      const stage = document.createElement('div');
      stage.style.cssText = 'position:fixed;left:-9999px;top:0;width:794px;background:#ffffff;color:#111111;padding:40px 48px;box-sizing:border-box;font-family:sans-serif;font-size:15px;line-height:1.6';
      stage.innerHTML = sanitizeHtml(html);
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
        // Cabut URL PDF sebelumnya (A3 v6.21.0): tiap URL yang tidak dicabut
        // menahan blob di memori sampai halaman ditutup.
        if (pdfUrl) { try { URL.revokeObjectURL(pdfUrl); } catch (e) {} }
        pdfUrl = URL.createObjectURL(blob);
        const url = pdfUrl;
        T.show(box, kv('Halaman', pages + ' halaman A4') + kv('Ukuran file', fmtBytes(blob.size)));
        box.appendChild(T.row(T.btn('Unduh PDF', () => {
          const a = document.createElement('a');
          a.href = url; a.download = 'dokumen.pdf';
          document.body.appendChild(a); a.click(); a.remove();
        }, true)));
        T.toast('PDF jadi, ' + pages + ' halaman');
      } catch (e) {
        T.show(box, errBox('PDF tidak bisa dibuat. Kemungkinan ada gambar dari situs lain yang diblokir browser, atau HTML-nya terlalu rumit. Coba sederhanakan isinya.'));
        const retry = T.btn('Coba lagi', () => pdfBtn.click());
        box.appendChild(retry);
      } finally {
        stage.remove();
      }
    } finally {
      busyPdf = false;
      pdfBtn.disabled = false;
    }
  };

  const pdfBtn = T.btn('Buat PDF', buatPdf, true);

  panel.appendChild(T.el('<p class="note">Diproses di browser. Alat PDF dimuat sekali dari internet saat tombol ditekan.</p>'));
  panel.appendChild(T.el('<p class="mut" style="font-size:13.5px;line-height:1.6">Tempel kode HTML, lihat pratinjaunya, lalu buat PDF ukuran A4. Cocok untuk dokumen sederhana seperti laporan, daftar, atau surat. Gambar dari situs lain kadang tidak muncul karena aturan situs tersebut.</p>'));
  panel.appendChild(T.field('Kode HTML', ta));
  panel.appendChild(T.row(contohBtn));
  panel.appendChild(T.row(T.btn('Lihat pratinjau', pratinjau), pdfBtn));
  panel.appendChild(prevWrap);
  panel.appendChild(box);
  T.onLeave(() => { pv.dispose(); if (pdfUrl) { try { URL.revokeObjectURL(pdfUrl); } catch (e) {} } });
}

function renderPdfKeHtml(panel) {
  const fi = fileInput('application/pdf,.pdf');
  const box = T.out();
  const statusBox = T.out();
  const hasilBox = T.out();
  // Loader library kanonis: utils.loadLibOnce (core.js).

  async function proses() {
    const f = fi.files && fi.files[0];
    if (!f) { T.toast('Pilih file PDF dulu'); return; }
    T.hide(box); T.hide(hasilBox);
    prosesB.disabled = true;
    T.show(statusBox, '<span class="dim">Memuat mesin PDF… (perlu internet sekali saja)</span>');
    const ok = await utils.loadLibOnce(PDFJS_CDN, () => !!window.pdfjsLib, () => { window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER; });
    if (!ok) {
      T.show(statusBox, '<div class="err">Mesin PDF gagal dimuat. Cek koneksi internetmu lalu coba lagi.</div> <button class="btn" type="button">Coba lagi</button>');
      statusBox.querySelector('button').addEventListener('click', proses);
      prosesB.disabled = false;
      return;
    }
    try {
      const namaDasar = (f.name || 'dokumen').replace(/\.[^.]*$/, '');
      const data = new Uint8Array(await f.arrayBuffer());
      const doc = await window.pdfjsLib.getDocument({ data }).promise;
      const jumlahAsli = doc.numPages;
      const total = Math.min(jumlahAsli, MAKS_HALAMAN);
      const halamanHtml = [];
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      for (let i = 1; i <= total; i++) {
        T.show(statusBox, `<span class="dim">Mengubah halaman ${i} dari ${total}…</span>`);
        const page = await doc.getPage(i);
        const viewport = page.getViewport({ scale: SKALA_GAMBAR });
        canvas.width = Math.round(viewport.width);
        canvas.height = Math.round(viewport.height);
        // Isi putih dulu: tanpa ini, area transparan PDF jadi hitam saat
        // diubah ke JPEG (JPEG tidak punya transparansi).
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvasContext: ctx, viewport }).promise;
        const gambar = canvas.toDataURL('image/jpeg', 0.85);
        const konten = await page.getTextContent();
        const paragraf = itemsKeParagraf(konten.items || []);
        halamanHtml.push(halamanKeHtml(i, gambar, paragraf));
      }
      await doc.destroy();
      const dokumen = bungkusDokumenHtml(namaDasar, halamanHtml);
      const blob = new Blob([dokumen], { type: 'text/html;charset=utf-8' });
      T.hide(statusBox);
      T.show(box, `<p class="note">Halaman HTML jadi dari <b>${total} halaman</b> PDF. Tampilannya persis seperti PDF, dan teksnya tetap bisa dicari.${jumlahAsli > MAKS_HALAMAN ? ' Hanya 50 halaman pertama yang diproses.' : ''}</p>`);
      T.show(hasilBox, '');
      hasilBox.appendChild(T.el(`<p class="dim">Ukuran file: ${fmtBytes(blob.size)}.</p>`));
      hasilBox.appendChild(T.btn('Unduh HTML (.html)', () => { T.dl(namaDasar + '.html', blob, 'text/html;charset=utf-8'); T.toast('Berhasil diunduh'); }, true));
      T.scrollToPreview(box);
    } catch (e) {
      const terkunci = e && e.name === 'PasswordException';
      T.show(statusBox, terkunci
        ? '<div class="err">PDF ini dikunci kata sandi. Buka kuncinya dulu dengan tool Kunci PDF, tab Buka kunci.</div>'
        : '<div class="err">PDF tidak bisa dibaca. Pastikan filenya PDF yang benar dan tidak rusak.</div> <button class="btn" type="button">Coba lagi</button>');
      const tombol = statusBox.querySelector('button');
      if (tombol) tombol.addEventListener('click', proses);
    } finally {
      prosesB.disabled = false;
    }
  }

  const prosesB = T.btn('Ubah Jadi HTML', proses, true);

  panel.appendChild(T.el(`<p class="note">🔒 ${LOCAL_NOTE}</p>`));
  panel.appendChild(T.el('<p class="note">Tiap halaman jadi gambar plus teksnya, jadi tampilannya sama dan isinya bisa dicari. Tautan dan formulir PDF tidak ikut. Maksimal 50 halaman.</p>'));
  panel.appendChild(T.field('Pilih file PDF', fi));
  panel.appendChild(prosesB);
  panel.appendChild(statusBox);
  panel.appendChild(box);
  panel.appendChild(hasilBox);
}

export function render(root) {
  const panelA = T.el('<div></div>');
  const panelB = T.el('<div></div>');
  renderHtmlKePdf(panelA);
  renderPdfKeHtml(panelB);
  root.appendChild(buatSakelarArah('HTML → PDF', 'PDF → HTML', panelA, panelB));
  root.appendChild(panelA);
  root.appendChild(panelB);
}
