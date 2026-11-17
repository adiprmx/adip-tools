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
   - footerHTML : footer 1 baris yang dulu disalin 7× di app.js
     (6 salinan identik + beranda dengan kelas rise + Metodologi
     tanpa tautan ke dirinya sendiri). Satu fungsi, tiga varian
     lewat opsi — keluarannya byte-identik dengan tiap salinan lama.
   ============================================================ */
import { esc } from './core.js';
import { CATS, catLabel } from './catalog.js';

const hcardHTML = (m) => `
  <a class="hcard glass" href="#/t/${m.id}" aria-label="${esc(m.name)}">
    <span class="hic" aria-hidden="true">${m.icon}</span>
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

/* Footer 3 kelompok (v6.14.0, P2-B2 — riset §5.3.8):
   (1) identitas + kalimat nilai (hitungan dari manifest, bukan
   angka hafalan), (2) 15 tautan kategori, (3) tautan layanan.
   Opsi dipertahankan:
   - methodLink (default true): tautan "Metodologi". Halaman
     Metodologi sendiri memakainya false (tanpa tautan ke diri).
   - rise (default null): nomor animasi masuk; beranda memakai 9
     (kelas 'foot rise' + style --i:9).
   Privasi menaut ke PRIVACY.md di repo (file itu tidak ada di
   public/, jadi tautan relatif akan 404); repo publik, branch
   default main (terverifikasi via GitHub API 17 Nov 2026). */
function footerHTML(n, { methodLink = true, rise = null } = {}) {
  const cls = rise === null ? 'foot' : 'foot rise';
  const style = rise === null ? '' : ` style="--i:${rise}"`;
  const cats = CATS.filter(([id]) => id !== 'semua')
    .map(([id, label]) => `<a href="#/k/${id}">${esc(label)}</a>`)
    .join(' <span class="sep" aria-hidden="true">·</span> '); /* spasi di
      kedua sisi separator = titik putus baris; tanpanya + nowrap di
      tautan, baris kategori jadi satu baris 974px di HP (terbukti
      17 Nov: footer scrollWidth 976px di viewport 360). */
  const links = [
    ...(methodLink ? ['<a href="#/metodologi">Metodologi</a>'] : []),
    '<a href="#/t/bantuan">Bantuan</a>',
    '<a href="#/t/beri-masukan">Beri Masukan</a>',
    '<a href="https://github.com/adiprmx/adip-tools/blob/main/PRIVACY.md" target="_blank" rel="noopener">Privasi</a>',
    '<a href="#/semua">Semua tools</a>',
  ].join('');
  return `<footer class="${cls}"${style}>
    <div class="foot-id"><b>ADIP Tools</b><br>${n} alat gratis berbahasa Indonesia. Hitungan jalan di browser kamu; tanpa daftar, tanpa iklan.</div>
    <nav class="foot-cats" aria-label="Kategori tools">${cats}</nav>
    <nav class="foot-links" aria-label="Layanan">${links}</nav>
  </footer>`;
}

export { hcardHTML, watchFadeX, footerHTML };
