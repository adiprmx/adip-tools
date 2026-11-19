import { h as T, utils, fileInput, fmtBytes, LOCAL_NOTE } from '../../core.js';

// HTML ke Word: ubah halaman HTML jadi dokumen Word (.docx). Tempel kode
// HTML atau unggah file .html; judul, paragraf, tebal, miring, daftar,
// dan kutipan ikut pindah. Mesinnya docx.js.
// BATASAN JUJUR (ditulis juga di UI): yang pindah hanya teks + struktur
// dasar. Gambar, tabel, warna, dan tata letak rumit TIDAK ikut.
export const meta = {"id": "html-ke-word", "name": "HTML ke Word", "cat": "produktivitas", "icon": "🌐", "desc": "Ubah halaman HTML jadi dokumen Word.", "keywords": "html ke word,html ke docx,halaman web ke word,konversi html", "since": "6.19.0"};

const DOCX_CDN = 'https://cdn.jsdelivr.net/npm/docx@8.5.0/build/index.umd.js';
const MAKS_BLOK = 2000;

// Dekode entitas HTML yang umum. Murni, bisa diuji di Node.
export function decodeEntitas(s) {
  return String(s || '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'").replace(/&amp;/gi, '&')
    .replace(/&#(\d+);/g, (m, n) => { try { return String.fromCodePoint(Number(n)); } catch (e) { return m; } })
    .replace(/&#x([0-9a-fA-F]+);/g, (m, n) => { try { return String.fromCodePoint(parseInt(n, 16)); } catch (e) { return m; } });
}

// Urai HTML jadi blok: {tipe, run: [{teks, tebal, miring}], nomor}.
// tipe: 'h1'|'h2'|'h3'|'p'|'li'|'oli'|'quote'. Parser token ringan tanpa
// DOM supaya bisa diuji di Node; skrip, gaya, dan komentar dibuang.
// Murni, bisa diuji di Node.
export function htmlKeBlok(html) {
  let s = String(html || '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(script|style|noscript|template|svg|head)[\s\S]*?<\/\1>/gi, '')
    .replace(/<(script|style|link|meta|base)[^>]*\/?>/gi, '');
  const blok = [];
  let jenis = 'p';
  let run = [];
  let tebal = 0, miring = 0;
  let dalamDaftar = null; // 'ul' | 'ol'
  let nomorDaftar = 0;
  const siram = () => {
    const teks = run.map((r) => r.teks).join('').replace(/\s+/g, ' ').trim();
    if (teks) {
      const b = { tipe: jenis, run: run.filter((r) => r.teks) };
      if (jenis === 'oli') b.nomor = nomorDaftar;
      blok.push(b);
    }
    run = [];
  };
  const mulaiBlok = (j) => { siram(); jenis = j; };
  const tambahTeks = (teks) => {
    const bersih = decodeEntitas(teks).replace(/\s+/g, ' ');
    if (!bersih.trim()) return;
    const terakhir = run[run.length - 1];
    const tb = tebal > 0, mi = miring > 0;
    if (terakhir && terakhir.tebal === tb && terakhir.miring === mi) terakhir.teks += bersih;
    else run.push({ teks: bersih, tebal: tb, miring: mi });
  };
  const pola = /<\/?([a-zA-Z][a-zA-Z0-9]*)[^>]*>|([^<]+)/g;
  let m;
  while ((m = pola.exec(s)) !== null) {
    if (m[2] != null) { tambahTeks(m[2]); continue; }
    const tag = m[0];
    const nama = m[1].toLowerCase();
    const tutup = tag.startsWith('</');
    if (nama === 'br' || nama === 'hr') { tambahTeks(' '); if (nama === 'hr') mulaiBlok('p'); continue; }
    if (nama === 'ul' || nama === 'ol') {
      if (!tutup) { dalamDaftar = nama; nomorDaftar = 0; }
      else if (dalamDaftar === nama) { dalamDaftar = null; }
      continue;
    }
    if (nama === 'li') {
      if (!tutup) {
        if (dalamDaftar === 'ol') nomorDaftar++;
        mulaiBlok(dalamDaftar === 'ol' ? 'oli' : 'li');
      } else siram();
      continue;
    }
    if (/^h[1-3]$/.test(nama)) {
      if (!tutup) mulaiBlok(nama);
      else siram();
      continue;
    }
    if (nama === 'p' || nama === 'div' || nama === 'section' || nama === 'article' || nama === 'tr' || nama === 'pre') {
      if (!tutup) mulaiBlok('p');
      else siram();
      continue;
    }
    if (nama === 'blockquote') {
      if (!tutup) mulaiBlok('quote');
      else siram();
      continue;
    }
    if (nama === 'td' || nama === 'th') {
      if (!tutup) tambahTeks('  ');
      continue;
    }
    if (nama === 'b' || nama === 'strong') { tebal += tutup ? -1 : 1; if (tebal < 0) tebal = 0; continue; }
    if (nama === 'i' || nama === 'em') { miring += tutup ? -1 : 1; if (miring < 0) miring = 0; continue; }
  }
  siram();
  return blok.slice(0, MAKS_BLOK);
}

// Ubah daftar blok jadi array Paragraph docx.js. D = window.docx.
// Murni terhadap D (bisa diuji dengan D tiruan di Node).
export function blokKeParagrafDocx(D, blok) {
  const ukuranJudul = { h1: 36, h2: 30, h3: 26 };
  const levelJudul = { h1: D.HeadingLevel.HEADING_1, h2: D.HeadingLevel.HEADING_2, h3: D.HeadingLevel.HEADING_3 };
  return blok.map((b) => {
    const runs = (b.run || []).map((p) => new D.TextRun({
      text: p.teks, bold: p.tebal || b.tipe.startsWith('h'), italics: p.miring || b.tipe === 'quote',
      size: ukuranJudul[b.tipe] || 24,
    }));
    const opsi = { children: runs, spacing: { after: b.tipe.startsWith('h') ? 200 : 120 } };
    if (levelJudul[b.tipe]) opsi.heading = levelJudul[b.tipe];
    if (b.tipe === 'li') { opsi.bullet = { level: 0 }; }
    if (b.tipe === 'oli') { opsi.children = [new D.TextRun({ text: b.nomor + '. ', size: 24 }), ...runs]; opsi.indent = { left: 360 }; }
    if (b.tipe === 'quote') { opsi.indent = { left: 360 }; }
    return new D.Paragraph(opsi);
  });
}

export function render(root) {
  const teksI = T.ta(10, '<h1>Judul halaman</h1>\n<p>Tempel kode HTML di sini, atau unggah file .html di bawah.</p>\n<ul><li>Daftar pertama</li><li>Daftar kedua</li></ul>');
  const fi = fileInput('.html,.htm,text/html');
  const namaI = T.input('text', 'Nama file (boleh kosong, jadi dokumen.docx)');
  const box = T.out();
  const statusBox = T.out();
  const hasilBox = T.out();

  fi.addEventListener('change', async () => {
    const f = fi.files && fi.files[0];
    if (!f) return;
    try {
      teksI.value = await f.text();
      T.toast('File HTML dimuat ke kolom di atas');
    } catch (e) {
      T.toast('File tidak bisa dibaca');
    }
  });

  async function proses() {
    const blok = htmlKeBlok(teksI.value);
    if (!blok.length) { T.toast('Tempel dulu kode HTML-nya atau unggah file .html'); teksI.focus(); return; }
    T.hide(box); T.hide(hasilBox);
    prosesB.disabled = true;
    T.show(statusBox, '<span class="dim">Memuat mesin Word… (perlu internet sekali saja)</span>');
    const ok = await utils.loadLibOnce(DOCX_CDN, () => !!window.docx && typeof window.docx.Document === 'function');
    if (!ok) {
      T.show(statusBox, '<div class="err">Mesin Word gagal dimuat. Cek koneksi internetmu lalu coba lagi.</div> <button class="btn" type="button">Coba lagi</button>');
      statusBox.querySelector('button').addEventListener('click', proses);
      prosesB.disabled = false;
      return;
    }
    try {
      T.show(statusBox, '<span class="dim">Menyusun dokumen Word…</span>');
      const D = window.docx;
      const anak = blokKeParagrafDocx(D, blok);
      const dokumen = new D.Document({ sections: [{ children: anak }] });
      const blob = await D.Packer.toBlob(dokumen);
      const nama = (namaI.value.trim() || 'dokumen').replace(/[\\/:*?"<>|]/g, '').slice(0, 80) || 'dokumen';
      T.hide(statusBox);
      T.show(box, `<p class="note">Dokumen Word jadi dari <b>${blok.length} blok</b>. Gambar, tabel, warna, dan tata letak rumit tidak ikut pindah.</p>`);
      T.show(hasilBox, '');
      hasilBox.appendChild(T.el(`<p class="dim">Ukuran file: ${fmtBytes(blob.size)}.</p>`));
      hasilBox.appendChild(T.btn('Unduh Word (.docx)', () => { T.dl(nama + '.docx', blob, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'); T.toast('Berhasil diunduh'); }, true));
      T.scrollToPreview(box);
    } catch (e) {
      T.show(statusBox, '<div class="err">Dokumen gagal dibuat. Coba lagi.</div> <button class="btn" type="button">Coba lagi</button>');
      statusBox.querySelector('button').addEventListener('click', proses);
    } finally {
      prosesB.disabled = false;
    }
  }

  const prosesB = T.btn('Buat Dokumen Word', proses, true);

  root.appendChild(T.el(`<p class="note">🔒 ${LOCAL_NOTE}</p>`));
  root.appendChild(T.el('<p class="note">Judul, paragraf, tebal, miring, daftar, dan kutipan ikut pindah. Gambar, tabel, warna, dan tata letak rumit tidak ikut.</p>'));
  root.appendChild(T.field('Kode HTML', teksI));
  root.appendChild(T.field('Atau unggah file .html', fi));
  root.appendChild(T.field('Nama file', namaI));
  root.appendChild(prosesB);
  root.appendChild(statusBox);
  root.appendChild(box);
  root.appendChild(hasilBox);
}
