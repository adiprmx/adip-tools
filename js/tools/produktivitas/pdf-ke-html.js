import { h as T, utils, fileInput, fmtBytes, LOCAL_NOTE } from '../../core.js';

// PDF ke HTML: ubah PDF jadi satu halaman HTML yang berdiri sendiri.
// Tiap halaman jadi gambar (tampilannya persis seperti di PDF) plus
// teksnya di bawah gambar, jadi isinya tetap bisa dicari. Mesinnya
// pdf.js (Mozilla).
// BATASAN JUJUR: yang pindah adalah gambar per halaman + teks polos;
// tautan, formulir, dan elemen interaktif PDF tidak ikut. PDF hasil
// scan tetap jadi gambar, tapi tanpa teks yang bisa dicari.
export const meta = {"id": "pdf-ke-html", "name": "PDF ke HTML", "cat": "produktivitas", "icon": "🌐", "desc": "Ubah PDF jadi halaman HTML, tiap halaman jadi gambar plus teksnya.", "keywords": "pdf ke html,pdf jadi web,konversi pdf,pdf ke halaman", "since": "6.17.0"};

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

export function render(root) {
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
        ? '<div class="err">PDF ini dikunci kata sandi. Buka kuncinya dulu dengan tool Buka Kunci PDF.</div>'
        : '<div class="err">PDF tidak bisa dibaca. Pastikan filenya PDF yang benar dan tidak rusak.</div> <button class="btn" type="button">Coba lagi</button>');
      const tombol = statusBox.querySelector('button');
      if (tombol) tombol.addEventListener('click', proses);
    } finally {
      prosesB.disabled = false;
    }
  }

  const prosesB = T.btn('Ubah Jadi HTML', proses, true);

  root.appendChild(T.el(`<p class="note">🔒 ${LOCAL_NOTE}</p>`));
  root.appendChild(T.el('<p class="note">Tiap halaman jadi gambar plus teksnya, jadi tampilannya sama dan isinya bisa dicari. Tautan dan formulir PDF tidak ikut. Maksimal 50 halaman.</p>'));
  root.appendChild(T.field('Pilih file PDF', fi));
  root.appendChild(prosesB);
  root.appendChild(statusBox);
  root.appendChild(box);
  root.appendChild(hasilBox);
}
