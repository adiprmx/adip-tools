/* ============================================================
   ADIP Tools v6.14.0 — store.js (P0-C)
   State lokal pengunjung (favorit + riwayat buka) di localStorage,
   dipindah verbatim dari app.js (v6.13.0). Tanpa DOM — hanya
   localStorage — jadi aman diimpor dari modul view mana pun.

   FORMAT (jangan diubah — data pengunjung lama bergantung padanya):
   - adip_fav / adip_recent : [{ id, t }] (t = timestamp ms).
   - Migrasi otomatis: format lama [id] dibaca sebagai { id, t: 0 }.
   - Batas: favorit maks 50 (terbaru di depan), riwayat maks 20.
   ============================================================ */

const FKEY = 'adip_fav', RKEY = 'adip_recent';
const loadJson = (k, fb) => { try { const v = JSON.parse(localStorage.getItem(k)); return Array.isArray(v) ? v : fb; } catch { return fb; } };
const saveJson = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
// migrasi otomatis format lama [id] -> [{id,t}]
// P2-QA (RED-01, 17 Nov 2026): buang entri null/bukan-objek. loadJson hanya
// menjamin array; entri `null` di dalamnya lolos .map lalu melempar
// TypeError di SEMUA pembaca (isFav/searchCtx/renderFavSection/favPage —
// semuanya membaca x.id), sehingga beranda + #/favorit blank total dan
// pengunjung tidak bisa memakai situs tanpa menghapus storage manual.
// String (format lama) tetap dimigrasi; angka/boolean ikut terbuang karena
// tidak pernah menghasilkan tool valid (byId(undefined) -> undefined).
const normList = (list) => list
  .map((x) => (typeof x === 'string' ? { id: x, t: 0 } : x))
  .filter((x) => x && typeof x === 'object');
const getFav = () => normList(loadJson(FKEY, []));
const isFav = (id) => getFav().some((x) => x.id === id);
function toggleFav(id) {
  let f = getFav();
  if (f.some((x) => x.id === id)) f = f.filter((x) => x.id !== id);
  else { f.unshift({ id, t: Date.now() }); if (f.length > 50) f.length = 50; }
  saveJson(FKEY, f);
}
const getRecent = () => normList(loadJson(RKEY, []));
function touchRecent(id) {
  let r = getRecent().filter((x) => x.id !== id);
  r.unshift({ id, t: Date.now() }); if (r.length > 20) r.length = 20;
  saveJson(RKEY, r);
}

export { FKEY, RKEY, getFav, isFav, toggleFav, getRecent, touchRecent };
