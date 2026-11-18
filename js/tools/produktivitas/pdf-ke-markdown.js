import { h as T, fileInput, LOCAL_NOTE } from '../../core.js';

// PDF ke Markdown: ambil teks dari PDF jadi teks Markdown (judul dan
// paragraf). Baris yang hurufnya jauh lebih besar dari isi dianggap
// judul. Mesinnya pdf.js (Mozilla).
// BATASAN JUJUR: tata letak rumit (kolom, tabel, posisi persis) tidak
// dipertahankan, dan judul ditebak dari ukuran huruf saja, jadi bisa
// salah. PDF hasil scan (isinya gambar) tidak punya teks untuk diambil.
export const meta = {"id": "pdf-ke-markdown", "name": "PDF ke Markdown", "cat": "produktivitas", "icon": "📋", "desc": "Ambil teks PDF jadi Markdown dengan judul dan paragraf.", "keywords": "pdf ke markdown,pdf ke md,ambil teks pdf,konversi pdf", "since": "6.17.0"};

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

export function render(root) {
  const fi = fileInput('application/pdf,.pdf');
  const box = T.out();
  const statusBox = T.out();
  const hasilBox = T.out();
  let pdfJsSiap = null;

  const muatPdfJs = () => {
    if (!pdfJsSiap) {
      pdfJsSiap = T.loadScript(PDFJS_CDN).then((ok) => {
        const siap = ok && !!window.pdfjsLib;
        if (siap) window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
        return siap;
      }).catch(() => { pdfJsSiap = null; return false; });
    }
    return pdfJsSiap;
  };

  async function proses() {
    const f = fi.files && fi.files[0];
    if (!f) { T.toast('Pilih file PDF dulu'); return; }
    T.hide(box); T.hide(hasilBox);
    prosesB.disabled = true;
    T.show(statusBox, '<span class="dim">Memuat mesin PDF… (perlu internet sekali saja)</span>');
    const ok = await muatPdfJs();
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
        ? '<div class="err">PDF ini dikunci kata sandi. Buka kuncinya dulu dengan tool Buka Kunci PDF.</div>'
        : '<div class="err">PDF tidak bisa dibaca. Pastikan filenya PDF yang benar dan tidak rusak.</div> <button class="btn" type="button">Coba lagi</button>');
      const tombol = statusBox.querySelector('button');
      if (tombol) tombol.addEventListener('click', proses);
    } finally {
      prosesB.disabled = false;
    }
  }

  const prosesB = T.btn('Ubah Jadi Markdown', proses, true);

  root.appendChild(T.el(`<p class="note">🔒 ${LOCAL_NOTE}</p>`));
  root.appendChild(T.el('<p class="note">Judul ditebak dari ukuran hurufnya, jadi bisa salah. Tata letak rumit dan PDF hasil scan tidak bisa diambil teksnya.</p>'));
  root.appendChild(T.field('Pilih file PDF', fi));
  root.appendChild(prosesB);
  root.appendChild(statusBox);
  root.appendChild(box);
  root.appendChild(hasilBox);
}
