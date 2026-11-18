import { h as T, fileInput, LOCAL_NOTE } from '../../core.js';

// Word ke Markdown: baca dokumen Word (.docx), ubah jadi teks Markdown
// yang bisa ditempel ke catatan, GitHub, atau blog.
// Jalurnya: mammoth.js mengubah .docx jadi HTML, lalu HTML itu diubah
// jadi Markdown oleh fungsi di file ini (tanpa pustaka tambahan).
// BATASAN JUJUR: yang pindah hanya teks + judul + daftar + tautan;
// tabel diubah jadi daftar baris, gambar dan tata letak rumit tidak ikut.
// File .doc lama (bukan .docx) tidak bisa dibaca di sini.
export const meta = {"id": "word-ke-markdown", "name": "Word ke Markdown", "cat": "produktivitas", "icon": "📋", "desc": "Ubah dokumen Word jadi teks Markdown yang rapi.", "keywords": "word ke markdown,docx ke markdown,konversi word,markdown", "since": "6.17.0"};

const MAMMOTH_CDN = 'https://cdn.jsdelivr.net/npm/mammoth@1.6.0/mammoth.browser.min.js';

// Skema tautan yang boleh lolos dari output mammoth (U1): hanya http,
// https, mailto, dan tautan tanpa skema (relatif / jangkar #). Skema lain
// (javascript:, data:, vbscript:, ...) dibuang — tautannya jadi teks biasa
// supaya dokumen Word jahat tidak bisa menyisipkan tautan Markdown
// [teks](javascript:...) yang mengeksekusi kode di renderer. Pemeriksaan
// menormalkan dulu entitas HTML, tab/baris baru, dan spasi di depan.
// Murni, bisa diuji di Node.
export function hrefAman(href) {
  const v = String(href || '')
    .replace(/&#x([0-9a-fA-F]+);/gi, (_m, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_m, d) => String.fromCharCode(Number(d)))
    .replace(/&(tab|newline);/gi, '')
    .replace(/&colon;/gi, ':').replace(/&amp;/gi, '&')
    .replace(/[\t\n\r]/g, '').replace(/^[\u0000-\u0020]+/, '');
  const m = /^([A-Za-z][A-Za-z0-9+.-]*):/.exec(v);
  if (!m) return true; // tanpa skema: relatif atau jangkar # — aman
  return /^(https?|mailto)$/i.test(m[1]);
}

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
  s = s.replace(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, (_m, href, t) => hrefAman(href) ? '[' + t.trim() + '](' + href + ')' : t.trim());
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

export function render(root) {
  const fi = fileInput('.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  const box = T.out();
  const statusBox = T.out();
  const hasilBox = T.out();
  let mammothSiap = null;

  const muatMammoth = () => {
    if (!mammothSiap) {
      mammothSiap = T.loadScript(MAMMOTH_CDN).then((ok) => ok && !!window.mammoth && typeof window.mammoth.convertToHtml === 'function')
        .catch(() => { mammothSiap = null; return false; });
    }
    return mammothSiap;
  };

  async function proses() {
    const f = fi.files && fi.files[0];
    if (!f) { T.toast('Pilih file Word (.docx) dulu'); return; }
    T.hide(box); T.hide(hasilBox);
    prosesB.disabled = true;
    T.show(statusBox, '<span class="dim">Memuat mesin Word… (perlu internet sekali saja)</span>');
    const ok = await muatMammoth();
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

  root.appendChild(T.el(`<p class="note">🔒 ${LOCAL_NOTE}</p>`));
  root.appendChild(T.el('<p class="note">Yang pindah hanya teks, judul, daftar, dan tautannya. Tabel jadi daftar baris, gambar dan tata letak rumit tidak ikut. Hanya file .docx yang bisa dibaca.</p>'));
  root.appendChild(T.field('Pilih file Word (.docx)', fi));
  root.appendChild(prosesB);
  root.appendChild(statusBox);
  root.appendChild(box);
  root.appendChild(hasilBox);
}
