// MERGE B25 (v6.21.0, D2): satu tool dua arah. Mesin kedua arah
// dipertahankan berdampingan di file ini (NOL fungsi hilang):
// arah A = markdown-ke-word (survivor), arah B = word-ke-markdown (dipensiunkan,
// diserap ke sini). Sakelar arah ada di paling atas render().

import { h as T, utils, fmtBytes, LOCAL_NOTE, fileInput } from '../../core.js';

export const meta = {"id": "markdown-ke-word", "name": "Markdown ↔ Word", "cat": "produktivitas", "icon": "📝", "desc": "Ubah tulisan Markdown jadi dokumen Word, atau dokumen Word jadi Markdown.", "keywords": "markdown ke word,markdown ke docx,md ke word,konversi markdown,word ke markdown,docx ke markdown,konversi word,markdown,word", "since": "6.17.0"};


const DOCX_CDN = 'https://cdn.jsdelivr.net/npm/docx@8.5.0/build/index.umd.js';

// Pecah satu baris jadi potongan teks dengan penanda tebal/miring.
// Mendukung **tebal**, *miring*, dan `kode` (kode jadi teks biasa).
// Murni, bisa diuji di Node. Mengembalikan [{teks, tebal, miring}].
export function parseInline(baris) {
  const hasil = [];
  const pola = /(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(`([^`]+)`)/g;
  let terakhir = 0, m;
  const dorong = (teks, tebal, miring) => {
    if (teks) hasil.push({ teks, tebal: !!tebal, miring: !!miring });
  };
  while ((m = pola.exec(baris)) !== null) {
    if (m.index > terakhir) dorong(baris.slice(terakhir, m.index));
    if (m[2] != null) dorong(m[2], true, false);
    else if (m[4] != null) dorong(m[4], false, true);
    else if (m[6] != null) dorong(m[6], false, false);
    terakhir = m.index + m[0].length;
  }
  if (terakhir < baris.length) dorong(baris.slice(terakhir));
  return hasil;
}

// Pecah dokumen Markdown jadi blok: {tipe, teks, level, nomor}.
// tipe: 'h1'|'h2'|'h3'|'p'|'li'|'oli'|'quote'. Murni, bisa diuji di Node.
export function markdownKeBlok(teks) {
  const blok = [];
  const baris = String(teks || '').replace(/\r\n?/g, '\n').split('\n');
  let paragraf = [];
  const siramParagraf = () => {
    if (!paragraf.length) return;
    blok.push({ tipe: 'p', teks: paragraf.join(' ').trim() });
    paragraf = [];
  };
  for (const mentah of baris) {
    const b = mentah.trim();
    if (!b) { siramParagraf(); continue; }
    let m = /^(#{1,3})\s+(.+)$/.exec(b);
    if (m) { siramParagraf(); blok.push({ tipe: 'h' + m[1].length, teks: m[2].trim() }); continue; }
    m = /^[-*]\s+(.+)$/.exec(b);
    if (m) { siramParagraf(); blok.push({ tipe: 'li', teks: m[1].trim() }); continue; }
    m = /^(\d+)[.)]\s+(.+)$/.exec(b);
    if (m) { siramParagraf(); blok.push({ tipe: 'oli', teks: m[2].trim(), nomor: Number(m[1]) }); continue; }
    m = /^>\s?(.*)$/.exec(b);
    if (m) { siramParagraf(); blok.push({ tipe: 'quote', teks: m[1].trim() }); continue; }
    paragraf.push(b);
  }
  siramParagraf();
  return blok.filter((x) => x.teks);
}

// Ubah daftar blok jadi array Paragraph docx.js. Judul memakai style
// heading asli (HeadingLevel) supaya Word dan pembaca lain mengenalinya
// sebagai judul betulan, bukan sekadar teks tebal. D = window.docx.
export function blokKeParagrafDocx(D, blok) {
  const ukuranJudul = { h1: 36, h2: 30, h3: 26 };
  const levelJudul = { h1: D.HeadingLevel.HEADING_1, h2: D.HeadingLevel.HEADING_2, h3: D.HeadingLevel.HEADING_3 };
  return blok.map((b) => {
    const potong = parseInline(b.teks);
    const runs = potong.map((p) => new D.TextRun({
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

// ---------- Mesin arah B: Word → Markdown (dari word-ke-markdown.js) ----------
const MAMMOTH_CDN = 'https://cdn.jsdelivr.net/npm/mammoth@1.6.0/mammoth.browser.min.js';

// Skema tautan yang boleh lolos dari output mammoth (U1): hanya http,
// https, mailto, dan tautan tanpa skema (relatif / jangkar #). Skema lain
// (javascript:, data:, vbscript:, ...) dibuang — tautannya jadi teks biasa
// supaya dokumen Word jahat tidak bisa menyisipkan tautan Markdown
// [teks](javascript:...) yang mengeksekusi kode di renderer. Pemeriksaan
// menormalkan dulu entitas HTML, tab/baris baru, dan spasi di depan.
// Murni, bisa diuji di Node.
// hrefAman kanonis tinggal di utils (core.js).

// Ubah satu potong HTML jadi Markdown. Bekerja pada string saja (tanpa DOM),
// jadi bisa diuji di Node. Menangani judul, paragraf, tebal, miring,
// daftar, tautan, garis, dan tabel sederhana.
export function htmlKeMarkdown(html) {
  let s = String(html || '');
  // Tabel: tiap baris jadi satu baris daftar berawalan "- ".
  s = s.replace(/<tr[^>]*>([\s\S]*?)<\/tr>/gi, (_m, isi) => {
    const sel = [...isi.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((m) => m[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()).filter(Boolean);
    return sel.length ? '\n- ' + sel.join(' | ') : '';
  });
  s = s.replace(/<\/?(table|tbody|thead|tfoot)[^>]*>/gi, '');
  // Daftar berurut: beri nomor urut per <ol>.
  s = s.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (_m, isi) => {
    let n = 0;
    return isi.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_l, t) => '\n' + (++n) + '. ' + t.trim());
  });
  s = s.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_m, t) => '\n- ' + t.trim());
  s = s.replace(/<\/?(ul|ol)[^>]*>/gi, '');
  for (let i = 6; i >= 1; i--) {
    s = s.replace(new RegExp('<h' + i + '[^>]*>([\\s\\S]*?)</h' + i + '>', 'gi'), (_m, t) => '\n' + '#'.repeat(i) + ' ' + t.trim() + '\n');
  }
  s = s.replace(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, (_m, href, t) => utils.hrefAman(href) ? '[' + t.trim() + '](' + href + ')' : t.trim());
  s = s.replace(/<(strong|b)[^>]*>([\s\S]*?)<\/(strong|b)>/gi, '**$2**');
  s = s.replace(/<(em|i)[^>]*>([\s\S]*?)<\/(em|i)>/gi, '_$2_');
  s = s.replace(/<br\s*\/?>/gi, '\n');
  s = s.replace(/<hr\s*\/?>/gi, '\n---\n');
  s = s.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, (_m, t) => '\n' + t.trim() + '\n');
  s = s.replace(/<[^>]+>/g, '');
  s = s.replace(/&nbsp;/gi, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
  // Rapikan: maksimal dua baris kosong berurutan, tanpa spasi di ujung.
  s = s.split('\n').map((b) => b.replace(/[ \t]+$/g, '')).join('\n');
  s = s.replace(/\n{3,}/g, '\n\n').trim();
  return s;
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

function renderMarkdownKeWord(panel) {
  const teksI = T.ta(12, '# Judul tulisanmu\n\nTulis di sini. **Tebal** dan *miring* ikut pindah.\n\n- Daftar pertama\n- Daftar kedua\n\n> Kutipan seperti ini ikut jadi paragraf kutipan.');
  const namaI = T.input('text', 'Nama file (boleh kosong, jadi dokumen.docx)');
  const box = T.out();
  const statusBox = T.out();
  const hasilBox = T.out();
  // Loader library kanonis: utils.loadLibOnce (core.js).

  async function proses() {
    const blok = markdownKeBlok(teksI.value);
    if (!blok.length) { T.toast('Isi tulisan Markdown-nya dulu'); teksI.focus(); return; }
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
      T.show(box, `<p class="note">Dokumen Word jadi dari <b>${blok.length} blok</b> tulisanmu. Tabel, gambar, dan kode blok tidak ikut pindah.</p>`);
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
  panel.appendChild(T.el('<p class="note">Judul, paragraf, tebal, miring, daftar, dan kutipan ikut pindah. Tabel, gambar, dan kode blok tidak ikut.</p>'));
  panel.appendChild(T.field('Tulisan Markdown', teksI));
  panel.appendChild(T.field('Nama file', namaI));
  panel.appendChild(prosesB);
  panel.appendChild(statusBox);
  panel.appendChild(box);
  panel.appendChild(hasilBox);
}

function renderWordKeMarkdown(panel) {
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
      const md = htmlKeMarkdown(hasil && hasil.value);
      if (!md) {
        T.show(statusBox, '<div class="err">Tidak ada teks yang bisa diambil dari dokumen ini. Dokumennya mungkin hanya berisi gambar.</div>');
        prosesB.disabled = false;
        return;
      }
      const namaDasar = (f.name || 'dokumen').replace(/\.[^.]*$/, '');
      T.hide(statusBox);
      T.show(box, '<pre style="white-space:pre-wrap;word-break:break-word;background:#12100d;border:1px solid #2e2823;border-radius:8px;padding:12px;font-size:13px;line-height:1.6;max-height:420px;overflow:auto">' + T.esc(md) + '</pre>');
      T.show(hasilBox, '');
      hasilBox.appendChild(T.btn('Unduh Markdown (.md)', () => { T.dl(namaDasar + '.md', md, 'text/markdown;charset=utf-8'); T.toast('Berhasil diunduh'); }, true));
      hasilBox.appendChild(T.copyBtn(() => md, 'Salin Markdown'));
      T.scrollToPreview(box);
    } catch (e) {
      T.show(statusBox, '<div class="err">Dokumen tidak bisa dibaca. Pastikan filenya .docx yang benar dan tidak rusak. File .doc lama belum bisa dibaca di sini.</div> <button class="btn" type="button">Coba lagi</button>');
      statusBox.querySelector('button').addEventListener('click', proses);
    } finally {
      prosesB.disabled = false;
    }
  }

  const prosesB = T.btn('Ubah Jadi Markdown', proses, true);

  panel.appendChild(T.el(`<p class="note">🔒 ${LOCAL_NOTE}</p>`));
  panel.appendChild(T.el('<p class="note">Yang pindah hanya teks, judul, daftar, dan tautannya. Tabel jadi daftar baris, gambar dan tata letak rumit tidak ikut. Hanya file .docx yang bisa dibaca.</p>'));
  panel.appendChild(T.field('Pilih file Word (.docx)', fi));
  panel.appendChild(prosesB);
  panel.appendChild(statusBox);
  panel.appendChild(box);
  panel.appendChild(hasilBox);
}

export function render(root) {
  const panelA = T.el('<div></div>');
  const panelB = T.el('<div></div>');
  renderMarkdownKeWord(panelA);
  renderWordKeMarkdown(panelB);
  root.appendChild(buatSakelarArah('Markdown → Word', 'Word → Markdown', panelA, panelB));
  root.appendChild(panelA);
  root.appendChild(panelB);
}
