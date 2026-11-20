import { h as T, utils, fileInput, LOCAL_NOTE } from '../../core.js';

// Hitung Kata PDF: hitung jumlah kata, karakter, kalimat, dan halaman
// sebuah PDF. Teks diambil per halaman dengan pdf.js, lalu dihitung
// di browser ini saja. PDF hasil scan (isinya hanya gambar) tidak punya
// teks yang bisa dihitung, dan itu disampaikan apa adanya.
export const meta = {"id": "hitung-kata-pdf", "name": "Hitung Kata PDF", "cat": "produktivitas", "icon": "🔢", "desc": "Hitung jumlah kata, karakter, dan halaman sebuah PDF.", "keywords": "hitung kata pdf,jumlah kata pdf,word count pdf,karakter pdf", "since": "6.19.0"};

const PDFJS_CDN = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js';
const PDFJS_WORKER = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
const MAKS_HALAMAN = 200;

// Hitung statistik dari teks biasa. Murni, bisa diuji di Node.
export function hitungTeks(teks) {
  const s = String(teks || '');
  const kata = s.trim() ? s.trim().split(/\s+/).length : 0;
  const karakter = s.length;
  const karakterTanpaSpasi = s.replace(/\s/g, '').length;
  const kalimat = s.trim() ? ((s.match(/[^.!?]+[.!?]+["')\]]*\s*/g) || []).length || 1) : 0;
  const paragraf = s.trim() ? s.trim().split(/\n\s*\n/).filter((p) => p.trim()).length : 0;
  return { kata, karakter, karakterTanpaSpasi, kalimat, paragraf };
}

// Gabung statistik per halaman jadi total. Murni, bisa diuji di Node.
export function gabungStatistik(perHalaman) {
  const total = { kata: 0, karakter: 0, karakterTanpaSpasi: 0, kalimat: 0, paragraf: 0 };
  for (const s of perHalaman || []) {
    total.kata += s.kata || 0;
    total.karakter += s.karakter || 0;
    total.karakterTanpaSpasi += s.karakterTanpaSpasi || 0;
    total.kalimat += s.kalimat || 0;
    total.paragraf += s.paragraf || 0;
  }
  total.halaman = (perHalaman || []).length;
  total.halamanKosong = (perHalaman || []).filter((s) => !(s.kata > 0)).length;
  total.menitBaca = total.kata ? Math.max(1, Math.round(total.kata / 200)) : 0;
  total.kataPerHalaman = total.halaman ? Math.round(total.kata / total.halaman) : 0;
  return total;
}

export function render(root) {
  const fi = fileInput('application/pdf,.pdf');
  const box = T.out();
  const statusBox = T.out();

  async function proses() {
    const f = fi.files && fi.files[0];
    if (!f) { T.toast('Pilih file PDF dulu'); return; }
    T.hide(box);
    prosesB.disabled = true;
    T.show(statusBox, '<span class="dim">Memuat mesin PDF… (perlu internet sekali saja)</span>');
    if (!(await utils.loadLibOnce(PDFJS_CDN, () => !!window.pdfjsLib, () => { window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER; }))) {
      T.show(statusBox, '<div class="err">Mesin PDF gagal dimuat. Cek koneksi internetmu lalu coba lagi.</div> <button class="btn" type="button">Coba lagi</button>');
      statusBox.querySelector('button').addEventListener('click', proses);
      prosesB.disabled = false;
      return;
    }
    try {
      const data = new Uint8Array(await f.arrayBuffer());
      const doc = await window.pdfjsLib.getDocument({ data }).promise;
      const totalHal = Math.min(doc.numPages, MAKS_HALAMAN);
      const perHalaman = [];
      for (let i = 1; i <= totalHal; i++) {
        T.show(statusBox, `<span class="dim">Membaca halaman ${i} dari ${totalHal}…</span>`);
        const page = await doc.getPage(i);
        const konten = await page.getTextContent();
        const teks = (konten.items || []).map((it) => it.str || '').join(' ');
        perHalaman.push(hitungTeks(teks));
      }
      await doc.destroy();
      const t = gabungStatistik(perHalaman);
      T.hide(statusBox);
      if (!t.kata) {
        T.show(box, '<div class="err">Tidak ada teks yang bisa dihitung di PDF ini. Kemungkinan PDF-nya hasil scan (isinya hanya gambar), jadi tidak ada kata yang terbaca.</div>');
        prosesB.disabled = false;
        return;
      }
      const dibatasi = doc.numPages > MAKS_HALAMAN;
      let html = '<div class="row" style="flex-wrap:wrap;gap:8px 20px;margin-bottom:12px">'
        + '<span><b class="big" style="font-size:28px">' + T.fmt(t.kata) + '</b> kata</span>'
        + '<span><b class="big" style="font-size:28px">' + T.fmt(t.halaman) + '</b> halaman</span>'
        + '</div>'
        + '<div>' + [
          ['Karakter (dengan spasi)', t.karakter],
          ['Karakter (tanpa spasi)', t.karakterTanpaSpasi],
          ['Kalimat', t.kalimat],
          ['Paragraf', t.paragraf],
          ['Rata-rata kata per halaman', t.kataPerHalaman],
          ['Waktu baca kira-kira', t.menitBaca + ' menit'],
        ].map(([k, v]) => '<div class="kv"><span class="k">' + T.esc(k) + '</span><span class="v">' + T.esc(String(v)) + '</span></div>').join('') + '</div>';
      if (t.halamanKosong) html += '<p class="note">' + t.halamanKosong + ' halaman tidak punya teks yang terbaca (mungkin hanya gambar).</p>';
      if (dibatasi) html += '<p class="note">PDF ini ' + doc.numPages + ' halaman; yang dihitung hanya ' + MAKS_HALAMAN + ' halaman pertama.</p>';
      T.show(box, html);
      box.appendChild(T.copyBtn(() => 'Kata: ' + t.kata + '\nKarakter: ' + t.karakter + '\nKalimat: ' + t.kalimat + '\nHalaman: ' + t.halaman, 'Salin hasil'));
      T.scrollToPreview(box);
    } catch (e) {
      const terkunci = e && e.name === 'PasswordException';
      T.show(statusBox, terkunci
        ? '<div class="err">PDF ini dikunci kata sandi. Buka kuncinya dulu dengan tool Kunci PDF, tab Buka kunci.</div>'
        : '<div class="err">PDF tidak bisa dibaca. Pastikan filenya PDF yang benar dan tidak rusak.</div> <button class="btn" type="button">Coba lagi</button>');
      const tombol = statusBox.querySelector('button');
      if (tombol) tombol.addEventListener('click', proses);
    } finally {
      prosesB.disabled = false;
    }
  }

  const prosesB = T.btn('Hitung Kata', proses, true);

  root.appendChild(T.el(`<p class="note">🔒 ${LOCAL_NOTE}</p>`));
  root.appendChild(T.el('<p class="note">Waktu baca dihitung dengan patokan 200 kata per menit. PDF hasil scan tidak punya teks, jadi tidak bisa dihitung.</p>'));
  root.appendChild(T.field('Pilih file PDF', fi));
  root.appendChild(prosesB);
  root.appendChild(statusBox);
  root.appendChild(box);
}
