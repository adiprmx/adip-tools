// MERGE B24 (v6.21.0, D2): satu tool dua arah. Mesin kedua arah
// dipertahankan berdampingan di file ini (NOL fungsi hilang):
// arah A = markdown-ke-pdf (survivor), arah B = pdf-ke-markdown (dipensiunkan,
// diserap ke sini). Sakelar arah ada di paling atas render().

import { h as T, utils, kv, fmtBytes, errBox, fileInput, LOCAL_NOTE } from '../../core.js';

export const meta = {"id": "markdown-ke-pdf", "name": "Markdown ↔ PDF", "cat": "converter", "icon": "📝", "desc": "Ubah tulisan Markdown jadi PDF A4, atau ambil teks PDF jadi Markdown.", "keywords": "markdown,pdf,dokumen,tulisan,md,a4,markdown ke pdf,pdf ke markdown,pdf ke md,ambil teks pdf", "since": "6.11.0"};


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

// Normalisasi URL ala parser browser (WHATWG): tab/LF/CR dibuang di mana
// saja, karakter kontrol + spasi dibuang di ujung. Tanpa ini "java\tscript:"
// dan "\x01javascript:" lolos uji skema tapi tetap jalan sebagai
// javascript: saat diklik (Q3 v6.21.0).
const normalUrl = (v) => String(v || '').replace(/[\t\n\r]/g, '').replace(/^[\u0000-\u0020]+|[\u0000-\u0020]+$/g, '');
const urlBerbahaya = (v) => /^(javascript|vbscript):/i.test(normalUrl(v));
const tautanOk = (v) => /^(https?:|mailto:)/i.test(normalUrl(v));
// xlink:href di SVG: tautan web + gambar data: boleh, sisanya dibuang.
const xlinkOk = (v) => /^(https?:|mailto:|data:image\/)/i.test(normalUrl(v));

/* Bersihkan HTML hasil Markdown sebelum innerHTML (T04 S1/S2): marked
   tidak menyaring HTML mentah — <img onerror> dari Markdown tempel bisa
   jalan di origin situs. Pola sama seperti sanitizeEmailHtml di genmail.
   Murni + diekspor (Q3): bisa diuji langsung di browser tanpa render. */
export const sanitizeHtml = (raw) => {
  const doc = new DOMParser().parseFromString(String(raw || ''), 'text/html');
  // Elemen animasi SVG + foreignObject ikut dibuang (Q3): <animate> bisa
  // mengubah href lewat attributeName, foreignObject menampung HTML di
  // dalam SVG.
  doc.querySelectorAll('script,style,iframe,object,embed,form,link,meta,base,animate,animateTransform,animateMotion,set,mpath,foreignObject').forEach((n) => n.remove());
  doc.querySelectorAll('*').forEach((n) => {
    [...n.attributes].forEach((a) => {
      if (/^on/i.test(a.name)) n.removeAttribute(a.name);
      // xlink:href ikut diperiksa (Q3): <svg><a xlink:href="javascript:">
      // lolos bila hanya src/href yang diperiksa. Uji skema pakai nilai
      // yang sudah dinormalisasi ala parser browser.
      if ((a.name === 'src' || a.name === 'href' || a.name === 'xlink:href') && urlBerbahaya(a.value)) n.removeAttribute(a.name);
      if (a.name === 'xlink:href' && !xlinkOk(a.value)) n.removeAttribute(a.name);
    });
  });
  // <area> ikut pass allowlist (Q3): href-nya tidak tercakup pass a[href]
  // sebelumnya, jadi javascript: yang diobfusikasi lolos ke pratinjau.
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

// ---------- Mesin arah B: PDF → Markdown (dari pdf-ke-markdown.js) ----------
const PDFJS_CDN = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js';
const PDFJS_WORKER = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
const MAKS_HALAMAN = 200;

// Kelompokkan potongan teks pdf.js jadi baris, lalu susun jadi Markdown:
// baris yang tingginya >= 1,4x tinggi huruf paling umum jadi judul (##),
// sisanya digabung jadi paragraf. Murni, bisa diuji di Node.
export function itemsKeMarkdown(items) {
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
      if (h > terakhir.h) terakhir.h = h;
    } else {
      baris.push({ y, h, potong: [{ x, teks, lebar }] });
    }
  }
  if (!baris.length) return '';
  const tinggi = baris.map((b) => b.h).sort((a, b) => a - b);
  const tengah = tinggi[Math.floor(tinggi.length / 2)] || 12;
  const blok = [];
  let jalan = '';
  let ySebelumnya = null;
  const siram = () => { if (jalan) { blok.push(jalan); jalan = ''; } };
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
    if (b.h >= tengah * 1.4) {
      siram();
      blok.push('## ' + teksBaris);
      ySebelumnya = b.y;
      continue;
    }
    if (ySebelumnya !== null && Math.abs(ySebelumnya - b.y) > b.h * 1.8 && jalan) {
      siram();
    }
    jalan = jalan ? jalan + ' ' + teksBaris : teksBaris;
    ySebelumnya = b.y;
  }
  siram();
  return blok.join('\n\n');
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

function renderMarkdownKePdf(panel) {
  const ta = T.ta(10, '# Laporan Mingguan\n\nMinggu ini berjalan **lancar**. Beberapa hal yang selesai:\n\n- Laporan penjualan dikirim\n- Stok gudang dicek ulang\n- Jadwal kirim minggu depan disusun\n\n> Catatan: harga bahan naik sedikit minggu ini.\n\nTerima kasih.');
  const prev = T.el('<div style="background:#ffffff;color:#111111;border:1px solid #ffffff20;border-radius:10px;padding:28px 24px;font-size:15px;line-height:1.7;min-height:160px"></div>');
  prev.innerHTML = '<span style="color:#71717a">Pratinjau muncul di sini…</span>';
  const box = T.out();
  let markedOk = null, pdfLibsOk = null, simpleMode = false;

  const ensureMarked = async () => {
    if (markedOk !== null) return markedOk;
    // Loop fallback CDN kanonis: utils.loadLibOnce (core.js).
    markedOk = await utils.loadLibOnce(MARKED_CDNS, () => window.marked && typeof window.marked.parse === 'function');
    return markedOk;
  };
  const ensurePdfLibs = async () => {
    if (pdfLibsOk !== null) return pdfLibsOk;
    // Loop fallback CDN kanonis: utils.loadLibOnce (core.js).
    const h2c = await utils.loadLibOnce(H2C_CDNS, () => typeof window.html2canvas === 'function');
    const pdf = h2c && await utils.loadLibOnce(JSPDF_CDNS, () => !!(window.jspdf && window.jspdf.jsPDF));
    pdfLibsOk = !!(h2c && pdf);
    return pdfLibsOk;
  };

  // sanitizeHtml kini di level modul (diekspor, Q3) — parse() di bawah
  // memakai versi modul itu.
  const parse = (md) => sanitizeHtml(markedOk && window.marked ? window.marked.parse(md) : miniMd(md));

  const pratinjau = async () => {
    const md = ta.value.trim();
    if (!md) { T.show(box, errBox('Tulis Markdown dulu.')); return; }
    if (md.length > MAX_MD) { T.show(box, errBox('Tulisan terlalu panjang (maksimal ' + (MAX_MD / 1000) + ' ribu karakter).')); return; }
    T.show(box, '<span class="dim">Memuat pratinjau…</span>');
    const ok = await ensureMarked();
    simpleMode = !ok;
    prev.innerHTML = parse(md);
    T.show(box, simpleMode
      ? '<p class="hint">Alat Markdown tidak bisa dimuat (koneksi bermasalah), jadi pratinjau memakai cara sederhana. Judul, tebal, miring, daftar, dan kode tetap tampil.</p>'
      : '<p class="hint">Pratinjau di atas adalah tampilan yang masuk ke PDF.</p>');
    T.scrollToPreview(prev);
  };

  const buatPdf = async () => {
    const md = ta.value.trim();
    if (!md) { T.show(box, errBox('Tulis Markdown dulu.')); return; }
    if (md.length > MAX_MD) { T.show(box, errBox('Tulisan terlalu panjang (maksimal ' + (MAX_MD / 1000) + ' ribu karakter).')); return; }
    T.show(box, '<span class="dim">Menyiapkan alat PDF…</span>');
    await ensureMarked();
    const ok = await ensurePdfLibs();
    if (!ok) { T.show(box, errBox('Alat PDF tidak bisa dimuat dari internet. Periksa koneksi, lalu coba lagi.')); return; }
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
        (simpleMode ? '<p class="hint">Dibuat dengan cara sederhana karena alat Markdown tidak termuat.</p>' : ''));
      box.appendChild(T.row(T.btn('Unduh PDF', () => {
        const a = document.createElement('a');
        a.href = url; a.download = 'dokumen.pdf';
        document.body.appendChild(a); a.click(); a.remove();
      }, true)));
      T.toast('PDF jadi, ' + pages + ' halaman');
    } catch (e) {
      T.show(box, errBox('PDF tidak bisa dibuat. Coba sederhanakan isi tulisannya.'));
    } finally {
      stage.remove();
    }
  };

  const contohBtn = T.btn('Isi contoh', () => {
    ta.value = '# Catatan Rapat\n\n**Tanggal:** Senin, 16 November 2026\n\n## Yang dibahas\n\n- Stok minggu ini aman\n- Promo akhir bulan disiapkan\n- Jadwal kirim diatur ulang\n\n## Tindak lanjut\n\n1. Cek harga pemasok\n2. Hubungi pelanggan yang menunggu\n\n> Semua poin di atas perlu selesai minggu ini.';
  });

  panel.appendChild(T.el('<p class="note">Diproses di browser. Alat Markdown dan PDF dimuat sekali dari internet saat tombol ditekan.</p>'));
  panel.appendChild(T.el('<p class="mut" style="font-size:13.5px;line-height:1.6">Tulis dengan format Markdown (judul pakai #, tebal pakai **, daftar pakai -), lihat pratinjaunya, lalu unduh PDF A4.</p>'));
  panel.appendChild(T.field('Tulisan Markdown', ta));
  panel.appendChild(T.row(contohBtn));
  panel.appendChild(T.row(T.btn('Lihat pratinjau', pratinjau), T.btn('Buat PDF', buatPdf, true)));
  panel.appendChild(T.el('<div class="hint" style="margin:12px 0 6px">Pratinjau:</div>'));
  panel.appendChild(prev);
  panel.appendChild(box);
}

function renderPdfKeMarkdown(panel) {
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
      const total = Math.min(doc.numPages, MAKS_HALAMAN);
      const bagian = [];
      for (let i = 1; i <= total; i++) {
        T.show(statusBox, `<span class="dim">Membaca halaman ${i} dari ${total}…</span>`);
        const page = await doc.getPage(i);
        const konten = await page.getTextContent();
        const md = itemsKeMarkdown(konten.items || []);
        if (md) bagian.push((total > 1 ? '# Halaman ' + i + '\n\n' : '') + md);
      }
      await doc.destroy();
      if (!bagian.length) {
        T.show(statusBox, '<div class="err">Tidak ada teks yang bisa diambil dari PDF ini. Kemungkinan PDF-nya hasil scan (isinya hanya gambar).</div>');
        prosesB.disabled = false;
        return;
      }
      const hasil = bagian.join('\n\n');
      T.hide(statusBox);
      T.show(box, '<pre style="white-space:pre-wrap;word-break:break-word;background:#12100d;border:1px solid #2e2823;border-radius:8px;padding:12px;font-size:13px;line-height:1.6;max-height:420px;overflow:auto">' + T.esc(hasil) + '</pre>');
      T.show(hasilBox, '');
      hasilBox.appendChild(T.btn('Unduh Markdown (.md)', () => { T.dl(namaDasar + '.md', hasil, 'text/markdown;charset=utf-8'); T.toast('Berhasil diunduh'); }, true));
      hasilBox.appendChild(T.copyBtn(() => hasil, 'Salin Markdown'));
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

  const prosesB = T.btn('Ubah Jadi Markdown', proses, true);

  panel.appendChild(T.el(`<p class="note">🔒 ${LOCAL_NOTE}</p>`));
  panel.appendChild(T.el('<p class="note">Judul ditebak dari ukuran hurufnya, jadi bisa salah. Tata letak rumit dan PDF hasil scan tidak bisa diambil teksnya.</p>'));
  panel.appendChild(T.field('Pilih file PDF', fi));
  panel.appendChild(prosesB);
  panel.appendChild(statusBox);
  panel.appendChild(box);
  panel.appendChild(hasilBox);
}

export function render(root) {
  const panelA = T.el('<div></div>');
  const panelB = T.el('<div></div>');
  renderMarkdownKePdf(panelA);
  renderPdfKeMarkdown(panelB);
  root.appendChild(buatSakelarArah('Markdown → PDF', 'PDF → Markdown', panelA, panelB));
  root.appendChild(panelA);
  root.appendChild(panelB);
}
