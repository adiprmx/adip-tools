/* ============================================================
   ADIP Tools v6.12.0 — detail-riwayat.js (TIM 10)
   Peningkatan halaman detail tool: riwayat buka terakhir.

   KENAPA MODUL INI ADA (hasil audit, baca laporan T10):
   - Pola hasil Calculator.net SUDAH ADA: T.calcResult() di core.js (T07).
   - Rantai antar-tool SUDAH ADA: peta NEXT + seksi "Lanjut ke" di app.js
     + T.nextSteps() di core.js (T07).
   - Tombol bagikan per tool = wilayah T23 (js/seo-share.js) — TIDAK dibuat
     di sini supaya tidak bentrok.
   - Riwayat buka (adip_recent, maks 20) SUDAH ADA sebagai data, tapi hanya
     tampil di beranda ("Lanjutkan" 1 tool + carousel "Riwayat" 10 tool)
     dan di command palette (4 tool). Di HALAMAN DETAIL belum ada sama
     sekali — padahal alur bolak-balik antar-tool (mis. kompres foto ->
     ubah ukuran -> balik kompres lagi) paling sering terjadi dari sini.

   DESAIN:
   - Fungsi MURNI yang mengembalikan string HTML — tanpa DOM, tanpa
     localStorage, tanpa import. Data (recents, byId, hcardHTML, esc)
     disuntik pemanggil (app.js), jadi modul ini bisa dites di Node
     tanpa stub apa pun dan tidak bisa merusak state shell.
   - Memakai kelas CSS yang SUDAH ADA (.sec, .sechead, .hscroll, .hcard,
     .back) + gaya inline yang sama dengan tautan metodologi — tanpa CSS
     baru, tanpa warna baru (aksen putih saja, sesuai design lock).
   - ID divalidasi ^[a-z0-9-]+$ sebelum masuk href (pola yang sama dengan
     T.nextSteps() di core.js) — href tidak bisa disuntik javascript:.
   - Nama tool di-escape lewat esc() yang disuntik pemanggil (T.esc).
   - Semua fungsi mengembalikan '' bila tidak ada yang bisa ditampilkan,
     jadi seksi kosong tidak pernah muncul.
   ============================================================ */

const ID_OK = /^[a-z0-9-]+$/;

/* Normalisasi entri riwayat: dukung format baru {id,t} dan format lama "id"
   (string polos, sebelum migrasi otomatis di app.js). */
function normId(x) {
  const id = typeof x === 'string' ? x : x && x.id;
  return typeof id === 'string' && ID_OK.test(id) ? id : null;
}

/* Daftar tool riwayat yang valid: buang tool yang sedang dibuka, buang
   duplikat, buang ID yang sudah tidak ada di manifest. Urutan = terbaru
   dulu (sama seperti urutan adip_recent). */
function validRecents(currentId, recents, byId, max) {
  const out = [];
  const seen = new Set([currentId]);
  const list = Array.isArray(recents) ? recents : [];
  const cap = Math.max(1, Math.min(10, Number(max) || 4));
  for (const x of list) {
    const id = normId(x);
    if (!id || seen.has(id)) continue;
    const m = byId(id);
    if (!m) continue;
    seen.add(id);
    out.push(m);
    if (out.length >= cap) break;
  }
  return out;
}

/* Seksi "Baru saja dibuka": rel tool yang terakhir dibuka (maks 4 default),
   memakai kartu hcard + rel hscroll yang sama dengan seksi "Lanjut ke".
   Dipasang di bawah seksi "Lanjut ke", di atas "Sejenis".
   v6.14.0 (P2-B1, V-08): app.js tidak lagi memakai fungsi ini — halaman
   tool memakai recentLineHTML di bawah. Dipertahankan sebagai API modul.
   @param currentId  id tool yang sedang dibuka (dikecualikan dari daftar)
   @param recents    isi getRecent() dari app.js ([{id,t}] terbaru dulu)
   @param byId       app.js byId — cari metadata tool dari manifest
   @param hcardHTML  app.js hcardHTML — kartu horizontal siap pakai
   @param max        jumlah maks kartu (default 4, dijepit 1..10)
   @returns string HTML seksi lengkap, atau '' bila tidak ada riwayat lain */
export function recentRailHTML(currentId, recents, byId, hcardHTML, max = 4) {
  const tools = validRecents(currentId, recents, byId, max);
  if (!tools.length) return '';
  return `
    <section class="sec" aria-label="Baru saja dibuka" style="margin-top:22px">
      <div class="sechead"><h2>Baru saja dibuka</h2></div>
      <div class="hscroll">${tools.map(hcardHTML).join('')}</div>
    </section>`;
}

/* Baris teks "Terakhir dibuka: A · B · C" (v6.14.0, P2-B1, V-08):
   pengganti recentRailHTML di halaman tool — satu baris tautan teks
   (maks 3), bukan carousel ketiga. Kelas .recentline di style.css.
   @param esc  T.esc dari app.js — escape nama tool
   @returns string HTML baris lengkap, atau '' bila tidak ada riwayat lain */
export function recentLineHTML(currentId, recents, byId, esc, max = 3) {
  const tools = validRecents(currentId, recents, byId, max);
  if (!tools.length) return '';
  const links = tools
    .map((m) => `<a href="#/t/${esc(m.id)}">${esc(m.name)}</a>`)
    .join('<span class="sep" aria-hidden="true">·</span>');
  return `<p class="recentline"><b>Terakhir dibuka:</b> ${links}</p>`;
}

/* Chip "Balik ke <tool sebelumnya>": satu ketukan kembali ke tool yang
   dibuka tepat sebelum tool ini. Dipasang di samping tautan "← Beranda"
   di atas halaman (lihat dokumen integrasi di laporan T10).
   Tool "sebelumnya" = entri riwayat pertama yang bukan tool ini — benar
   baik sebelum maupun sesudah touchRecent() dipanggil di toolPage.
   @param esc  T.esc dari app.js — escape nama tool
   @returns string HTML tautan, atau '' bila tidak ada tool sebelumnya */
export function prevToolChip(currentId, recents, byId, esc) {
  const prev = validRecents(currentId, recents, byId, 1)[0];
  if (!prev) return '';
  return `<a class="back" href="#/t/${esc(prev.id)}" style="margin-left:10px">← Balik ke ${esc(prev.name)}</a>`;
}

/* Tautan "Lihat semua tool <Kategori> →" di bawah grid "Sejenis".
   Saat ini "Sejenis" hanya menampilkan 4 kartu tanpa jalan ke daftar
   lengkap kategorinya dari halaman detail.
   @param cat       id kategori tool ini (m.cat)
   @param catLabel  app.js catLabel — label kategori berbahasa Indonesia
   @returns string HTML tautan, atau '' bila id kategori tidak valid */
export function catMoreLink(cat, catLabel) {
  if (typeof cat !== 'string' || !ID_OK.test(cat)) return '';
  return `<a href="#/k/${cat}" style="display:block;margin-top:14px;font-size:13px;color:var(--mut)">Lihat semua tool ${catLabel(cat)} →</a>`;
}
