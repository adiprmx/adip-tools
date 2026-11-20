// MERGE B23 (v6.21.0, D2): satu tool dua arah. Mesin kedua arah
// dipertahankan berdampingan di file ini (NOL fungsi hilang):
// arah A = word-ke-html (survivor), arah B = html-ke-word (dipensiunkan,
// diserap ke sini). Sakelar arah ada di paling atas render().

import { h as T, fileInput, LOCAL_NOTE, utils, fmtBytes } from '../../core.js';

export const meta = {"id": "word-ke-html", "name": "Word ↔ HTML", "cat": "produktivitas", "icon": "🌐", "desc": "Ubah dokumen Word jadi kode HTML, atau halaman HTML jadi dokumen Word.", "keywords": "word ke html,docx ke html,konversi word,kode html,html ke word,html ke docx,halaman web ke word,konversi html,word,html", "since": "6.17.0"};


const MAMMOTH_CDN = 'https://cdn.jsdelivr.net/npm/mammoth@1.6.0/mammoth.browser.min.js';

// Skema tautan yang boleh lolos dari output mammoth (U1): hanya http,
// https, mailto, dan tautan tanpa skema (relatif / jangkar #). Skema lain
// (javascript:, data:, vbscript:, ...) dinetralkan jadi href="#" supaya
// dokumen Word jahat tidak bisa menyisipkan tautan yang mengeksekusi kode
// saat HTML hasil ditempel ke website. Pemeriksaan menormalkan dulu:
// entitas HTML (&#58; / &#x3a; / &colon;), tab/baris baru di dalam URL,
// dan spasi di depan — semuanya trik yang dipakai untuk menyembunyikan
// skema dari pemeriksaan naif. Murni, bisa diuji di Node.
// hrefAman kanonis tinggal di utils (core.js).

export function bersihkanHrefHtml(html) {
  return String(html || '').replace(/href\s*=\s*("[^"]*"|'[^']*')/gi, (cocok, dikutip) => {
    const nilai = dikutip.slice(1, -1);
    return utils.hrefAman(nilai) ? cocok : 'href="#"';
  });
}

// Bungkus potongan HTML jadi dokumen HTML lengkap yang berdiri sendiri.
// Murni, bisa diuji di Node.
export function bungkusDokumenHtml(isi, judul) {
  const j = String(judul || 'Dokumen').replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));
  return '<!DOCTYPE html>\n<html lang="id">\n<head>\n<meta charset="utf-8">\n<title>' + j + '</title>\n'
    + '<style>body{font-family:system-ui,sans-serif;max-width:720px;margin:2rem auto;padding:0 1rem;line-height:1.6;color:#222}img{max-width:100%}</style>\n'
    + '</head>\n<body>\n' + String(isi || '') + '\n</body>\n</html>\n';
}

// ---------- Mesin arah B: HTML → Word (dari html-ke-word.js) ----------
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

function renderWordKeHtml(panel) {
  const fi = fileInput('.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  const box = T.out();
  const statusBox = T.out();
  const hasilBox = T.out();
  // Loader library kanonis: utils.loadLibOnce (core.js).

  async function proses() {
    const f = fi.files && fi.files[0];
    if (!f) { T.toast('Pilih file Word (.docx) dulu'); return; }
    T.hide(box); T.hide(hasilBox);
    prosesB.disabled = true;
    T.show(statusBox, '<span class="dim">Memuat mesin Word… (perlu internet sekali saja)</span>');
    const ok = await utils.loadLibOnce(MAMMOTH_CDN, () => !!window.mammoth && typeof window.mammoth.convertToHtml === 'function');
    if (!ok) {
      T.show(statusBox, '<div class="err">Mesin Word gagal dimuat. Cek koneksi internetmu lalu coba lagi.</div> <button class="btn" type="button">Coba lagi</button>');
      statusBox.querySelector('button').addEventListener('click', proses);
      prosesB.disabled = false;
      return;
    }
    try {
      T.show(statusBox, '<span class="dim">Membaca dokumen…</span>');
      const buf = await f.arrayBuffer();
      const hasil = await window.mammoth.convertToHtml({ arrayBuffer: buf });
      // Saring href sebelum dipakai di mana pun (U1): pratinjau, salin,
      // dan unduhan semuanya memakai string yang sudah bersih ini.
      const html = bersihkanHrefHtml(String(hasil && hasil.value || '').trim());
      if (!html) {
        T.show(statusBox, '<div class="err">Tidak ada teks yang bisa diambil dari dokumen ini. Dokumennya mungkin hanya berisi gambar.</div>');
        prosesB.disabled = false;
        return;
      }
      const namaDasar = (f.name || 'dokumen').replace(/\.[^.]*$/, '');
      const dokumen = bungkusDokumenHtml(html, namaDasar);
      T.hide(statusBox);
      T.show(box, '<pre style="white-space:pre-wrap;word-break:break-word;background:#12100d;border:1px solid #2e2823;border-radius:8px;padding:12px;font-size:12.5px;line-height:1.6;max-height:420px;overflow:auto">' + T.esc(html) + '</pre>');
      T.show(hasilBox, '');
      hasilBox.appendChild(T.btn('Unduh HTML (.html)', () => { T.dl(namaDasar + '.html', dokumen, 'text/html;charset=utf-8'); T.toast('Berhasil diunduh'); }, true));
      hasilBox.appendChild(T.copyBtn(() => html, 'Salin Kode HTML'));
      T.scrollToPreview(box);
    } catch (e) {
      T.show(statusBox, '<div class="err">Dokumen tidak bisa dibaca. Pastikan filenya .docx yang benar dan tidak rusak. File .doc lama belum bisa dibaca di sini.</div> <button class="btn" type="button">Coba lagi</button>');
      statusBox.querySelector('button').addEventListener('click', proses);
    } finally {
      prosesB.disabled = false;
    }
  }

  const prosesB = T.btn('Ubah Jadi HTML', proses, true);

  panel.appendChild(T.el(`<p class="note">🔒 ${LOCAL_NOTE}</p>`));
  panel.appendChild(T.el('<p class="note">Yang pindah hanya teks, judul, daftar, dan tautannya. Gambar dan tata letak rumit tidak ikut. File yang diunduh sudah jadi halaman HTML lengkap yang bisa langsung dibuka di browser.</p>'));
  panel.appendChild(T.field('Pilih file Word (.docx)', fi));
  panel.appendChild(prosesB);
  panel.appendChild(statusBox);
  panel.appendChild(box);
  panel.appendChild(hasilBox);
}

function renderHtmlKeWord(panel) {
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

  panel.appendChild(T.el(`<p class="note">🔒 ${LOCAL_NOTE}</p>`));
  panel.appendChild(T.el('<p class="note">Judul, paragraf, tebal, miring, daftar, dan kutipan ikut pindah. Gambar, tabel, warna, dan tata letak rumit tidak ikut.</p>'));
  panel.appendChild(T.field('Kode HTML', teksI));
  panel.appendChild(T.field('Atau unggah file .html', fi));
  panel.appendChild(T.field('Nama file', namaI));
  panel.appendChild(prosesB);
  panel.appendChild(statusBox);
  panel.appendChild(box);
  panel.appendChild(hasilBox);
}

export function render(root) {
  const panelA = T.el('<div></div>');
  const panelB = T.el('<div></div>');
  renderWordKeHtml(panelA);
  renderHtmlKeWord(panelB);
  root.appendChild(buatSakelarArah('Word → HTML', 'HTML → Word', panelA, panelB));
  root.appendChild(panelA);
  root.appendChild(panelB);
}
