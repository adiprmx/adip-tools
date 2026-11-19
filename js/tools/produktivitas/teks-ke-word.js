import { h as T, utils, fmtBytes, LOCAL_NOTE } from '../../core.js';

// Teks ke Word: ubah teks biasa yang ditempel jadi file .docx rapi.
// Baris pertama dianggap judul, tiap blok yang dipisah baris kosong
// jadi satu paragraf. Mesinnya docx.js.
// BATASAN JUJUR: yang dibuat hanya teks dan paragraf; tanpa gambar,
// tabel, atau tata letak rumit.
export const meta = {"id": "teks-ke-word", "name": "Teks ke Word", "cat": "produktivitas", "icon": "📝", "desc": "Ubah teks biasa jadi dokumen Word yang rapi.", "keywords": "teks ke word,teks ke docx,buat docx,teks jadi word", "since": "6.17.0"};

const DOCX_CDN = 'https://cdn.jsdelivr.net/npm/docx@8.5.0/build/index.umd.js';

// Pecah teks jadi daftar paragraf (blok dipisah baris kosong).
// Murni, bisa diuji di Node.
export function teksKeParagraf(teks) {
  return String(teks || '')
    .replace(/\r\n?/g, '\n')
    .split(/\n\s*\n/)
    .map((b) => b.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

// Ubah daftar paragraf jadi array Paragraph docx.js. Paragraf pertama
// memakai style heading asli supaya dikenal sebagai judul. D = window.docx.
export function paragrafKeDocx(D, paragraf) {
  return paragraf.map((p, i) => new D.Paragraph({
    heading: i === 0 ? D.HeadingLevel.HEADING_1 : undefined,
    children: [new D.TextRun({ text: p, bold: i === 0, size: i === 0 ? 32 : 24 })],
    spacing: { after: i === 0 ? 240 : 120 },
  }));
}

export function render(root) {
  const teksI = T.ta(10, 'Tempel atau ketik teksmu di sini.\n\nBaris pertama jadi judul.\nTiap blok yang dipisah baris kosong jadi satu paragraf.');
  const namaI = T.input('text', 'Nama file (boleh kosong, jadi dokumen.docx)');
  const box = T.out();
  const statusBox = T.out();
  const hasilBox = T.out();
  // Loader library kanonis: utils.loadLibOnce (core.js).

  async function proses() {
    const paragraf = teksKeParagraf(teksI.value);
    if (!paragraf.length) { T.toast('Isi teksnya dulu'); teksI.focus(); return; }
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
      const anak = paragrafKeDocx(D, paragraf);
      const dokumen = new D.Document({ sections: [{ children: anak }] });
      const blob = await D.Packer.toBlob(dokumen);
      const nama = (namaI.value.trim() || 'dokumen').replace(/[\\/:*?"<>|]/g, '').slice(0, 80) || 'dokumen';
      T.hide(statusBox);
      T.show(box, `<p class="note">Dokumen Word jadi dari <b>${paragraf.length} paragraf</b>. Baris pertamamu jadi judul.</p>`);
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
  root.appendChild(T.el('<p class="note">Baris pertama teksmu jadi judul, tiap blok yang dipisah baris kosong jadi satu paragraf. Tanpa gambar dan tabel.</p>'));
  root.appendChild(T.field('Teksmu', teksI));
  root.appendChild(T.field('Nama file', namaI));
  root.appendChild(prosesB);
  root.appendChild(statusBox);
  root.appendChild(box);
  root.appendChild(hasilBox);
}
