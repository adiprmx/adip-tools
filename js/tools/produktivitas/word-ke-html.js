import { h as T, fileInput, LOCAL_NOTE } from '../../core.js';

// Word ke HTML: baca dokumen Word (.docx) dan ubah jadi kode HTML
// yang bisa ditempel ke website atau blog. Mesinnya mammoth.js.
// BATASAN JUJUR: yang pindah hanya teks + judul + daftar + tautan;
// gambar dan tata letak rumit tidak ikut. File .doc lama (bukan .docx)
// tidak bisa dibaca di sini.
export const meta = {"id": "word-ke-html", "name": "Word ke HTML", "cat": "produktivitas", "icon": "🌐", "desc": "Ubah dokumen Word jadi kode HTML siap tempel ke website.", "keywords": "word ke html,docx ke html,konversi word,kode html", "since": "6.17.0"};

const MAMMOTH_CDN = 'https://cdn.jsdelivr.net/npm/mammoth@1.6.0/mammoth.browser.min.js';

// Skema tautan yang boleh lolos dari output mammoth (U1): hanya http,
// https, mailto, dan tautan tanpa skema (relatif / jangkar #). Skema lain
// (javascript:, data:, vbscript:, ...) dinetralkan jadi href="#" supaya
// dokumen Word jahat tidak bisa menyisipkan tautan yang mengeksekusi kode
// saat HTML hasil ditempel ke website. Pemeriksaan menormalkan dulu:
// entitas HTML (&#58; / &#x3a; / &colon;), tab/baris baru di dalam URL,
// dan spasi di depan — semuanya trik yang dipakai untuk menyembunyikan
// skema dari pemeriksaan naif. Murni, bisa diuji di Node.
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

export function bersihkanHrefHtml(html) {
  return String(html || '').replace(/href\s*=\s*("[^"]*"|'[^']*')/gi, (cocok, dikutip) => {
    const nilai = dikutip.slice(1, -1);
    return hrefAman(nilai) ? cocok : 'href="#"';
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

  root.appendChild(T.el(`<p class="note">🔒 ${LOCAL_NOTE}</p>`));
  root.appendChild(T.el('<p class="note">Yang pindah hanya teks, judul, daftar, dan tautannya. Gambar dan tata letak rumit tidak ikut. File yang diunduh sudah jadi halaman HTML lengkap yang bisa langsung dibuka di browser.</p>'));
  root.appendChild(T.field('Pilih file Word (.docx)', fi));
  root.appendChild(prosesB);
  root.appendChild(statusBox);
  root.appendChild(box);
  root.appendChild(hasilBox);
}
