/* ============================================================
   ADIP Tools v6.14.0 — supabase.js (P0-C)
   Jembatan best-effort ke Supabase (tracking pencarian + daftar
   istilah Populer), dipindah dari app.js (v6.13.0) dengan SATU
   perubahan bentuk: fungsi-fungsi ini tidak lagi membaca/menulis
   state modul app.js (SB_POPULAR) atau memanggil render — pemanggil
   (app.js) yang menyimpan hasilnya dan memutuskan kapan me-render.
   Perilaku jaringannya IDENTIK: URL, header, body, limit, dan
   urutan yang sama; semua kegagalan tetap diam (silent).

   KONTRAK HASIL fetchPopularTerms() — meniru percabangan lama
   di sbFetchPopular() supaya pemanggil bisa membedakan 3 kasus:
   - sukses (HTTP 200): Promise -> array istilah (bisa kosong).
   - respons tidak OK: Promise -> null (dulu: return tanpa render).
   - galat jaringan: Promise MENOLAK (dulu: catch -> render fallback).
   ============================================================ */

const SB_URL = 'https://jebafddwupyqpwevhsqn.supabase.co';
const SB_ANON = 'sb_publishable_rxxzONDsxTmmsHiQgaptjg_7zbG5qeT';

function sbHeaders() {
  return { 'apikey': SB_ANON, 'Authorization': 'Bearer ' + SB_ANON, 'Content-Type': 'application/json' };
}

/* Istilah pencarian terpopuler (maks 8, urut jumlah terbanyak).
   Lihat kontrak hasil di header file. */
async function fetchPopularTerms() {
  const r = await fetch(SB_URL + '/rest/v1/tool_search_terms?select=term&order=count.desc&limit=8', { headers: sbHeaders() });
  if (!r.ok) return null;
  const data = await r.json();
  if (!Array.isArray(data)) return [];
  return data.map((x) => String(x.term || x).trim()).filter(Boolean);
}

/* Catat satu istilah pencarian (best-effort, diam bila gagal). */
async function trackSearch(q) {
  try {
    await fetch(SB_URL + '/rest/v1/rpc/track_search', {
      method: 'POST', headers: sbHeaders(),
      body: JSON.stringify({ p_term: q.toLowerCase().slice(0, 40) }),
    });
  } catch (e) { /* silent */ }
}

/* trackSearch dengan debounce 1200 ms (satu timer bersama). */
let trackTimer;
function trackSearchDebounced(q) {
  clearTimeout(trackTimer);
  trackTimer = setTimeout(() => trackSearch(q), 1200);
}

export { fetchPopularTerms, trackSearch, trackSearchDebounced };
