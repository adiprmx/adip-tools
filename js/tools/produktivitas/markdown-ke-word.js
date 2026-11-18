import { h as T, fmtBytes, LOCAL_NOTE } from '../../core.js';

// Markdown ke Word: ubah tulisan Markdown jadi file .docx.
// Mendukung judul (# sampai ###), paragraf, tebal (**...**), miring
// (*...*), daftar (- atau 1.), dan kutipan (> ...). Mesinnya docx.js.
// BATASAN JUJUR: tabel, gambar, dan kode blok tidak ikut; yang pindah
// hanya teks dan strukturnya.
export const meta = {"id": "markdown-ke-word", "name": "Markdown ke Word", "cat": "produktivitas", "icon": "📝", "desc": "Ubah tulisan Markdown jadi dokumen Word yang rapi.", "keywords": "markdown ke word,markdown ke docx,md ke word,konversi markdown", "since": "6.17.0"};

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

export function render(root) {
  const teksI = T.ta(12, '# Judul tulisanmu\n\nTulis di sini. **Tebal** dan *miring* ikut pindah.\n\n- Daftar pertama\n- Daftar kedua\n\n> Kutipan seperti ini ikut jadi paragraf kutipan.');
  const namaI = T.input('text', 'Nama file (boleh kosong, jadi dokumen.docx)');
  const box = T.out();
  const statusBox = T.out();
  const hasilBox = T.out();
  let docxSiap = null;

  const muatDocx = () => {
    if (!docxSiap) {
      docxSiap = T.loadScript(DOCX_CDN).then((ok) => ok && !!window.docx && typeof window.docx.Document === 'function')
        .catch(() => { docxSiap = null; return false; });
    }
    return docxSiap;
  };

  async function proses() {
    const blok = markdownKeBlok(teksI.value);
    if (!blok.length) { T.toast('Isi tulisan Markdown-nya dulu'); teksI.focus(); return; }
    T.hide(box); T.hide(hasilBox);
    prosesB.disabled = true;
    T.show(statusBox, '<span class="dim">Memuat mesin Word… (perlu internet sekali saja)</span>');
    const ok = await muatDocx();
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

  root.appendChild(T.el(`<p class="note">🔒 ${LOCAL_NOTE}</p>`));
  root.appendChild(T.el('<p class="note">Judul, paragraf, tebal, miring, daftar, dan kutipan ikut pindah. Tabel, gambar, dan kode blok tidak ikut.</p>'));
  root.appendChild(T.field('Tulisan Markdown', teksI));
  root.appendChild(T.field('Nama file', namaI));
  root.appendChild(prosesB);
  root.appendChild(statusBox);
  root.appendChild(box);
  root.appendChild(hasilBox);
}
