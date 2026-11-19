import { h as T, utils, fileInput, LOCAL_NOTE } from '../../core.js';

// Ambil Teks dari Word: tarik semua teks dari dokumen Word (.docx)
// jadi teks biasa yang bisa disalin atau diunduh. Mesinnya mammoth.js
// (extractRawText) yang membaca isi document.xml di dalam file .docx.
// BATASAN JUJUR: yang keluar hanya teks polos, tanpa tebal, miring,
// atau tata letak. File .doc lama (bukan .docx) tidak bisa dibaca.
export const meta = {"id": "ambil-teks-dari-word", "name": "Ambil Teks dari Word", "cat": "produktivitas", "icon": "📄", "desc": "Tarik semua teks dari dokumen Word jadi teks biasa.", "keywords": "ambil teks word,docx ke teks,ekstrak teks word,baca docx", "since": "6.17.0"};

const MAMMOTH_CDN = 'https://cdn.jsdelivr.net/npm/mammoth@1.6.0/mammoth.browser.min.js';

// Rapikan teks mentah: buang baris kosong berlebih dan spasi di ujung
// baris, tanpa mengubah isi. Murni, bisa diuji di Node.
export function rapikanTeksMentah(teks) {
  return String(teks || '')
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((b) => b.replace(/[ \t]+$/g, ''))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function render(root) {
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
    const ok = await utils.loadLibOnce(MAMMOTH_CDN, () => !!window.mammoth && typeof window.mammoth.extractRawText === 'function');
    if (!ok) {
      T.show(statusBox, '<div class="err">Mesin Word gagal dimuat. Cek koneksi internetmu lalu coba lagi.</div> <button class="btn" type="button">Coba lagi</button>');
      statusBox.querySelector('button').addEventListener('click', proses);
      prosesB.disabled = false;
      return;
    }
    try {
      T.show(statusBox, '<span class="dim">Membaca dokumen…</span>');
      const buf = await f.arrayBuffer();
      const hasil = await window.mammoth.extractRawText({ arrayBuffer: buf });
      const teks = rapikanTeksMentah(hasil && hasil.value);
      if (!teks) {
        T.show(statusBox, '<div class="err">Tidak ada teks yang bisa diambil dari dokumen ini. Dokumennya mungkin hanya berisi gambar.</div>');
        prosesB.disabled = false;
        return;
      }
      const namaDasar = (f.name || 'dokumen').replace(/\.[^.]*$/, '');
      const jumlahKata = teks.split(/\s+/).filter(Boolean).length;
      T.hide(statusBox);
      T.show(box, `<p class="note">Teks berhasil diambil: <b>${T.fmt(jumlahKata)} kata</b>.</p><pre style="white-space:pre-wrap;word-break:break-word;background:#12100d;border:1px solid #2e2823;border-radius:8px;padding:12px;font-size:13px;line-height:1.6;max-height:420px;overflow:auto">${T.esc(teks)}</pre>`);
      T.show(hasilBox, '');
      hasilBox.appendChild(T.btn('Unduh Teks (.txt)', () => { T.dl(namaDasar + '.txt', teks, 'text/plain;charset=utf-8'); T.toast('Berhasil diunduh'); }, true));
      hasilBox.appendChild(T.copyBtn(() => teks, 'Salin Teks'));
      T.scrollToPreview(box);
    } catch (e) {
      T.show(statusBox, '<div class="err">Dokumen tidak bisa dibaca. Pastikan filenya .docx yang benar dan tidak rusak. File .doc lama belum bisa dibaca di sini.</div> <button class="btn" type="button">Coba lagi</button>');
      statusBox.querySelector('button').addEventListener('click', proses);
    } finally {
      prosesB.disabled = false;
    }
  }

  const prosesB = T.btn('Ambil Teksnya', proses, true);

  root.appendChild(T.el(`<p class="note">🔒 ${LOCAL_NOTE}</p>`));
  root.appendChild(T.el('<p class="note">Yang keluar hanya teks polosnya saja, tanpa tebal, miring, atau tata letak. Cocok buat menyalin isi dokumen ke tempat lain. Hanya file .docx yang bisa dibaca.</p>'));
  root.appendChild(T.field('Pilih file Word (.docx)', fi));
  root.appendChild(prosesB);
  root.appendChild(statusBox);
  root.appendChild(box);
  root.appendChild(hasilBox);
}
