/* ============================================================
   ADIP Tools v6.14.0 — shell-ui.js (P0-C)
   Helper tampilan KECIL yang dipakai lebih dari satu view/modul —
   satu-satunya sumber untuk ketiganya (sebelumnya tersebar dan
   ada yang terduplikasi di app.js + beranda.js):

   - hcardHTML : kartu horizontal (Populer, Riwayat, "Lanjut ke",
     "Baru ditambahkan", "Coba dulu"). Dulu ada DUA salinan
     (app.js + beranda.js) dengan keluaran identik — kini satu.
   - watchFadeX : fade tepi carousel (.fx-r/.fx-l). Dulu ada dua
     salinan (watchFadeX di app.js, attachRailFade di beranda.js)
     dengan logika identik; guard beranda.js (rail null/bukan
     elemen) dipertahankan karena tidak mengubah perilaku untuk
     rail asli.
   - footerHTML : footer terstruktur (v6.15.0 P3 — dulu 1 baris
     yang disalin 7× di app.js: 6 salinan identik + beranda dengan
     kelas rise + Metodologi tanpa tautan ke dirinya sendiri).
     Satu fungsi, tiga varian lewat opsi (rise, methodLink).
   ============================================================ */
import { esc } from './core.js';
import { CATS, catLabel } from './catalog.js';

const hcardHTML = (m) => `
  <a class="hcard glass" href="#/t/${esc(m.id)}" aria-label="${esc(m.name)}">
    <span class="hic" aria-hidden="true">${esc(m.icon)}</span>
    <span class="hnm">${esc(m.name)}</span>
    <span class="hct">${catLabel(m.cat)}</span>
  </a>`;

/* fade tepi carousel saat konten terpotong */
function watchFadeX(rail) {
  if (!rail || typeof rail.addEventListener !== 'function') return;
  const upd = () => {
    rail.classList.toggle('fx-r', rail.scrollWidth - rail.scrollLeft - rail.clientWidth > 4);
    rail.classList.toggle('fx-l', rail.scrollLeft > 4);
  };
  rail.addEventListener('scroll', upd, { passive: true });
  upd();
}

/* Footer terstruktur (v6.15.0, P3 — temuan audit 6):
   (1) identitas + kalimat nilai (hitungan dari manifest, bukan
   angka hafalan), (2) 15 tautan kategori sebagai daftar grid,
   (3) tautan layanan, (4) baris penutup © sebagai penanda akhir
   halaman. Kategori dulu baris teks mengalir dengan pemisah
   titik — gumpalan itu yang bikin footer lama terasa belum
   selesai; kini tiap tautan punya barisnya sendiri + target
   sentuh 44px (gaya di css/polish-p3.css). Desktop: .foot-main
   dua kolom (identitas + layanan di kiri, kategori di kanan).
   HP: satu kolom berurutan.
   Opsi dipertahankan:
   - methodLink (default true): tautan "Metodologi". Halaman
     Metodologi sendiri memakainya false (tanpa tautan ke diri).
   - rise (default null): nomor animasi masuk; beranda memakai 11
     (kelas 'foot rise' + style --i:11).
   Privasi menaut ke PRIVACY.md di repo (file itu tidak ada di
   public/, jadi tautan relatif akan 404); repo publik, branch
   default main (terverifikasi via GitHub API 17 Nov 2026). */
function footerHTML(n, { methodLink = true, rise = null } = {}) {
  const cls = rise === null ? 'foot' : 'foot rise';
  const style = rise === null ? '' : ` style="--i:${rise}"`;
  const cats = CATS.filter(([id]) => id !== 'semua')
    .map(([id, label]) => `<li><a href="#/k/${id}">${esc(label)}</a></li>`)
    .join('');
  const links = [
    ...(methodLink ? ['<a href="#/metodologi">Metodologi</a>'] : []),
    '<a href="#/t/bantuan">Bantuan</a>',
    '<a href="#/t/beri-masukan">Beri Masukan</a>',
    '<a href="https://github.com/adiprmx/adip-tools/blob/main/PRIVACY.md" target="_blank" rel="noopener">Privasi</a>',
    '<a href="#/semua">Semua tools</a>',
  ].join('');
  return `<footer class="${cls}"${style}>
    <div class="foot-main">
      <div class="foot-id"><b>ADIP Tools</b><br>${n} alat gratis berbahasa Indonesia. Hitungan jalan di browser kamu; tanpa daftar, tanpa iklan.</div>
      <nav class="foot-cats" aria-label="Kategori tools">
        <p class="foot-h">Kategori</p>
        <ul>${cats}</ul>
      </nav>
      <nav class="foot-links" aria-label="Layanan">${links}</nav>
    </div>
    <div class="foot-end">© 2026 ADIP Tools</div>
  </footer>`;
}

export { hcardHTML, watchFadeX, footerHTML };
