/* ============================================================
   ADIP Tools — js/seo-share.js (T23 SEO & Keterlihatan, v6.12.0)
   Modul SEO + tombol bagikan per tool. Satu import: catMeta() dari
   beranda.js untuk deskripsi kurasi kategori (F07 S-A10, S-F7 v6.22.0);
   beranda.js tidak mengimpor modul ini, jadi tidak ada siklus.
   Manifest & label kategori diterima lewat initSeoShare() dari app.js
   (menghindari duplikasi fetch manifest.js yang diimpor app.js).

   Isi modul:
   (a) Meta dinamis per tool saat hash berubah — title + description +
       Open Graph + Twitter Card + canonical, dari data manifest tool.
   (b) JSON-LD situs (WebSite + WebApplication) + per tool
       (SoftwareApplication) dalam satu <script id="seo-jsonld">.
   (c) Tombol bagikan per tool: Web Share API bila tersedia, fallback
       salin link (clipboard API, lalu execCommand untuk browser lama).

   KONTRAK:
   - Modul ini TIDAK mengubah routing hash sama sekali. Ia hanya
     mendengarkan event 'hashchange' yang sudah ada + sinkronisasi
     sekali saat init (untuk deep-link langsung #/t/<id>).
   - Format title tool disamakan persis dengan app.js toolPage():
     `${nama tool} - ADIP Tools` (app.js:856). Bila format itu berubah,
     ubah juga buildTitle() di sini.
   - Tanpa akses DOM di level atas: semua akses DOM ada di dalam fungsi,
     jadi modul aman diimpor di Node untuk validasi ESM.
   - Design lock tombol bagikan: pakai class .icobtn yang sudah ada
     (40px, surface + hairline, ikon currentColor) + ikon SVG stroke
     currentColor. Tanpa warna baru, tanpa CSS baru.
   ============================================================ */

export const SITE_URL = 'https://tools.adipmusic.my.id';
export const SITE_NAME = 'ADIP Tools';
export const HOME_TITLE = 'Butuh apa? - ADIP Tools';

import { catMeta } from './beranda.js';
/* S-U5 (v6.22.0, manifest split): berlangganan detail dari
   manifest-boot.js (impor langsung, BUKAN lewat alias
   './manifest.js' — supaya js/manifest.js tetap tak tersentuh).
   onManifestDetails HANYA berlangganan — tidak memicu fetch.
   Memicu fetch di init (boot) TERUKUR merugikan: parse chunk
   198 KB memblokir main thread ~800 ms tepat sebelum rail
   beranda (diagnostik Playwright S-U5). */
import { onManifestDetails } from './manifest-boot.js';
export const HOME_DESC =
  '1.261 tools gratis berbahasa Indonesia: kalkulator gaji & THR, kompres foto, QR, sampai tools DJ. Tanpa daftar, tanpa iklan.';

/* Gambar share: ikon situs yang sudah ada (public/icons/icon-512.png,
   512x512, terverifikasi). Satu gambar untuk semua halaman — belum ada
   gambar per tool. S-F7 v6.22.0 (F09 S-A10). */
export const SHARE_IMAGE = SITE_URL + '/icons/icon-512.png';
export const SHARE_IMAGE_WIDTH = 512;
export const SHARE_IMAGE_HEIGHT = 512;

/* Judul rute non-tool, disamakan dengan app.js (home 505, semua 648,
   kategori 729, favorit 750, koleksi 775, metodologi 801). */
const ROUTE_TITLES = {
  semua: 'Semua tools - ADIP Tools',
  favorit: 'Favorit - ADIP Tools',
  metodologi: 'Metodologi - ADIP Tools',
};

/* ---------------- util murni (tanpa DOM, bisa dites di Node) ---------------- */

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* Ambil id tool dari hash, meniru parsing router app.js:924
   ('#/t/<id>' — potong query '?...' bila ada). Bukan rute tool -> null. */
export function toolIdFromHash(hash) {
  const h = String(hash || '');
  if (!h.startsWith('#/t/')) return null;
  /* P0-D2 (F1): urutan % rusak -> null, bukan lempar URIError yang
     mematikan syncMeta()/initSeoShare() dan menambah pageerror. */
  let id;
  try {
    id = decodeURIComponent(h.slice(4).split('?')[0].split('#')[0]);
  } catch {
    return null;
  }
  return /^[a-z0-9][a-z0-9-]*$/.test(id) ? id : null;
}

/* Ambil id kategori dari hash '#/k/<id>', meniru app.js:925. */
export function catIdFromHash(hash) {
  const h = String(hash || '');
  if (!h.startsWith('#/k/')) return null;
  /* P0-D2 (F1): sama seperti toolIdFromHash — % rusak -> null. */
  let id;
  try {
    id = decodeURIComponent(h.slice(4).split('?')[0].split('#')[0]);
  } catch {
    return null;
  }
  return /^[a-z0-9][a-z0-9-]*$/.test(id) ? id : null;
}

export function buildTitle(tool) {
  return tool ? `${tool.name} - ADIP Tools` : HOME_TITLE;
}

/* Deskripsi meta per tool: pakai desc manifest apa adanya (audit S-A10
   v6.22.0: 1.261/1.261 desc terisi, 0 kosong; 7 desc lebih dari 160
   karakter — pemangkasan untuk meta ditangani truncateMetaDesc() di
   syncMeta, bukan di sini, supaya teks bagikan tetap utuh). */
export function buildDescription(tool) {
  return tool && tool.desc ? String(tool.desc) : HOME_DESC;
}

/* Pangkas deskripsi untuk meta/OG (batas tampil cuplikan ~160 karakter).
   Potong di 159 karakter + '…' bila lebih panjang; yang pendek dibiarkan
   utuh. Hanya dipakai jalur meta, bukan teks bagikan. */
export function truncateMetaDesc(desc) {
  const s = String(desc ?? '');
  return s.length > 160 ? s.slice(0, 159) + '…' : s;
}

/* URL halaman (lengkap dengan hash) untuk satu rute hash. `base` =
   origin + pathname; di browser diambil dari location, di test bisa
   diisi eksplisit. Satu tempat penentu base supaya canonical, og:url,
   dan URL bagikan selalu konsisten. */
export function hashUrl(path, base) {
  const b =
    base ??
    (typeof location !== 'undefined'
      ? location.origin + location.pathname
      : SITE_URL + '/');
  return `${String(b).replace(/\/$/, '')}/${String(path).replace(/^\//, '')}`;
}

/* URL bagikan per tool. */
export function toolShareUrl(toolId, base) {
  return hashUrl(`#/t/${toolId}`, base);
}

/* JSON-LD situs: WebSite + WebApplication (gratis, tanpa daftar).
   Jumlah tool dihitung dinamis: argumen dulu, lalu manifest yang
   disimpan initSeoShare(). Tanpa keduanya, deskripsi dibiarkan apa
   adanya (tanpa angka hardcode — angka basi diam-diam begitu jumlah
   tool berubah). SearchAction menunjuk rute cari yang memang ada
   (#/semua?q=...); image memakai ikon situs yang sudah ada. */
export function buildSiteJsonLd(toolCount) {
  const count =
    Number.isFinite(toolCount) && toolCount > 0
      ? toolCount
      : _manifest.length > 0
        ? _manifest.length
        : null;
  const desc = count
    ? HOME_DESC.replace(/^[\d.]+ tools/, `${count.toLocaleString('id-ID')} tools`)
    : HOME_DESC;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        name: SITE_NAME,
        url: SITE_URL + '/',
        inLanguage: 'id',
        description: desc,
        image: SHARE_IMAGE,
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: SITE_URL + '/#/semua?q={search_term_string}',
          },
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'WebApplication',
        name: SITE_NAME,
        url: SITE_URL + '/',
        applicationCategory: 'UtilitiesApplication',
        operatingSystem: 'Web browser',
        inLanguage: 'id',
        description: desc,
        image: SHARE_IMAGE,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'IDR' },
        isAccessibleForFree: true,
      },
    ],
  };
}

/* JSON-LD per tool: SoftwareApplication gratis. */
export function buildToolJsonLd(tool, base) {
  return {
    '@type': 'SoftwareApplication',
    name: tool.name,
    url: toolShareUrl(tool.id, base),
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Web browser',
    inLanguage: 'id',
    description: buildDescription(tool),
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'IDR' },
    isAccessibleForFree: true,
  };
}

/* Ikon bagikan (feather "share-2"): stroke currentColor, tanpa warna baru. */
const SHARE_ICON =
  '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
  'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>' +
  '<line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>';

/* Markup tombol bagikan untuk disisipkan di .tacts halaman tool
   (app.js:870, di samping tombol favorit). Class .icobtn sudah ada di
   css/style.css:143 — tombol 40px, konsisten dengan tombol favorit.
   data-name/data-desc dipakai sebagai fallback bila manifest belum
   di-init; bila init sudah jalan, data diambil dari manifest. */
export function shareButtonHTML(tool) {
  return `<button class="sharebtn icobtn" data-id="${esc(tool.id)}" ` +
    `data-name="${esc(tool.name)}" data-desc="${esc(tool.desc || '')}" ` +
    `aria-label="Bagikan ${esc(tool.name)}" title="Bagikan">${SHARE_ICON}</button>`;
}

/* ---------------- state modul ---------------- */

let _manifest = [];
let _byId = null;
let _catLabel = (id) => id.charAt(0).toUpperCase() + id.slice(1);
let _onToast = null;
let _started = false;

/* ---------------- manipulasi <head> ---------------- */

function upsertMeta(attr, key, value) {
  if (typeof document === 'undefined') return;
  const sel = `meta[${attr}="${key}"]`;
  let el = document.querySelector(sel);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', value);
}

function upsertCanonical(href) {
  if (typeof document === 'undefined') return;
  let el = document.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

/* Satu <script id="seo-jsonld"> yang isinya dibangun ulang tiap sync:
   graph situs + node SoftwareApplication tool aktif (bila ada). */
function upsertJsonLd(tool) {
  if (typeof document === 'undefined') return;
  let el = document.getElementById('seo-jsonld');
  if (!el) {
    el = document.createElement('script');
    el.type = 'application/ld+json';
    el.id = 'seo-jsonld';
    document.head.appendChild(el);
  }
  const data = buildSiteJsonLd(_manifest.length);
  if (tool) data['@graph'].push(buildToolJsonLd(tool));
  el.textContent = JSON.stringify(data);
}

/* ---------------- sinkronisasi meta ---------------- */

/* Baca rute dari hash saat ini lalu perbarui title, description,
   OG/Twitter, canonical, dan JSON-LD. Dipanggil sekali saat init dan
   pada tiap 'hashchange'. Tidak menyentuh location.hash. */
export function syncMeta() {
  if (typeof document === 'undefined' || typeof location === 'undefined') return;
  const hash = location.hash || '#/';
  const tool = _byId ? _byId(toolIdFromHash(hash)) : null;
  const catId = tool ? null : catIdFromHash(hash);

  let title;
  let desc;
  let canonical;
  if (tool) {
    title = buildTitle(tool);
    desc = truncateMetaDesc(buildDescription(tool));
    canonical = toolShareUrl(tool.id);
  } else if (catId) {
    const label = _catLabel(catId);
    title = `${label} - ADIP Tools`;
    /* F07 S-A10: deskripsi kurasi CAT_META bila ada, bukan template
       generik. Fallback template hanya bila kategori tak dikenal. */
    const meta = catMeta(catId);
    desc = meta && meta.desc
      ? meta.desc
      : `Tools ${label} gratis yang jalan 100% di browser. Tanpa daftar, tanpa upload.`;
    canonical = hashUrl(`#/k/${catId}`);
  } else if (hash.startsWith('#/semua')) {
    title = ROUTE_TITLES.semua;
    desc = HOME_DESC;
    canonical = SITE_URL + '/';
  } else if (hash === '#/favorit') {
    title = ROUTE_TITLES.favorit;
    desc = HOME_DESC;
    canonical = SITE_URL + '/';
  } else if (hash.startsWith('#/metodologi')) {
    title = ROUTE_TITLES.metodologi;
    desc = 'Cara hitung di balik kalkulator ADIP Tools: rumus, asumsi, dan batasannya, ditulis terbuka.';
    canonical = SITE_URL + '/';
  } else {
    title = HOME_TITLE;
    desc = HOME_DESC;
    canonical = SITE_URL + '/';
  }

  document.title = title;
  upsertMeta('name', 'description', desc);
  upsertMeta('property', 'og:title', title);
  upsertMeta('property', 'og:description', desc);
  upsertMeta('property', 'og:type', 'website');
  upsertMeta('property', 'og:url', canonical);
  upsertMeta('property', 'og:site_name', SITE_NAME);
  upsertMeta('property', 'og:image', SHARE_IMAGE);
  upsertMeta('property', 'og:image:width', String(SHARE_IMAGE_WIDTH));
  upsertMeta('property', 'og:image:height', String(SHARE_IMAGE_HEIGHT));
  upsertMeta('property', 'og:image:type', 'image/png');
  upsertMeta('name', 'twitter:card', 'summary');
  upsertMeta('name', 'twitter:title', title);
  upsertMeta('name', 'twitter:description', desc);
  upsertMeta('name', 'twitter:image', SHARE_IMAGE);
  /* Canonical menunjuk URL halaman yang sedang dibuka, lengkap dengan
     hash-nya (S-F7 v6.22.0, F02 S-A10). JUJUR: crawler mengabaikan
     fragment (#/...), jadi canonical ber-hash ini tetap diabaikan
     sebagian crawler dan TIDAK membuat halaman tool terindeks sebagai
     halaman sendiri. Perbaikan arsitektur penuh (history routing /
     prerender, URL bersih) adalah tugas S-U10 gelombang upgrade,
     bukan fix ini. Yang diperbaiki di sini: halaman tool tidak lagi
     menyatakan dirinya duplikat homepage. */
  upsertCanonical(canonical);
  upsertJsonLd(tool);
}

/* ---------------- berbagi ---------------- */

async function copyText(text) {
  if (
    typeof navigator !== 'undefined' &&
    navigator.clipboard &&
    typeof navigator.clipboard.writeText === 'function'
  ) {
    await navigator.clipboard.writeText(text);
    return true;
  }
  /* Fallback browser lama / konteks non-secure: textarea + execCommand. */
  if (typeof document === 'undefined') return false;
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  }
  ta.remove();
  return ok;
}

/* Bagikan satu tool. Urutan: Web Share API (mobile + desktop modern)
   -> salin link. Mengembalikan 'shared' | 'copied' | 'cancelled' |
   'failed'. Pembatalan oleh user (AbortError) bukan error. */
export async function shareTool(tool) {
  const url = toolShareUrl(tool.id);
  const data = {
    title: buildTitle(tool),
    text: buildDescription(tool),
    url,
  };
  if (
    typeof navigator !== 'undefined' &&
    typeof navigator.share === 'function'
  ) {
    try {
      await navigator.share(data);
      return 'shared';
    } catch (e) {
      if (e && e.name === 'AbortError') return 'cancelled';
      /* Gagal share (mis. data tidak didukung) -> lanjut ke salin link. */
    }
  }
  try {
    const ok = await copyText(url);
    return ok ? 'copied' : 'failed';
  } catch {
    return 'failed';
  }
}

/* Umpan balik visual pada tombol: tukar ikon jadi ✓ selama 1,6 detik.
   Tanpa CSS baru — ✓ mewarisi warna & ukuran .icobtn. */
function flashCopied(btn) {
  if (!btn) return;
  const prev = btn.innerHTML;
  const prevLabel = btn.getAttribute('aria-label');
  btn.innerHTML = '✓';
  btn.setAttribute('aria-label', 'Link tersalin');
  setTimeout(() => {
    btn.innerHTML = prev;
    if (prevLabel) btn.setAttribute('aria-label', prevLabel);
  }, 1600);
}

function toolFromButton(btn) {
  const id = btn.dataset.id;
  const fromManifest = _byId ? _byId(id) : null;
  if (fromManifest) return fromManifest;
  return { id, name: btn.dataset.name || id, desc: btn.dataset.desc || '' };
}

/* Pasang handler klik pada semua .sharebtn di dalam root.
   Pola yang sama dengan bindFav() di app.js:242 — dipanggil tiap kali
   halaman tool selesai render (app.js:888, setelah bindFav(app)). */
export function bindShareButtons(root) {
  if (!root || typeof root.querySelectorAll !== 'function') return;
  root.querySelectorAll('.sharebtn').forEach((btn) => {
    if (btn.dataset.shareBound) return;
    btn.dataset.shareBound = '1';
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const tool = toolFromButton(btn);
      const res = await shareTool(tool);
      if (res === 'shared') {
        flashCopied(btn);
        if (_onToast) _onToast('Link dibagikan');
      } else if (res === 'copied') {
        flashCopied(btn);
        if (_onToast) _onToast('Link tersalin');
      } else if (res === 'failed') {
        if (_onToast) _onToast('Gagal menyalin link');
      }
      /* 'cancelled': user menutup sheet berbagi — tanpa umpan balik. */
    });
  });
}

/* ---------------- init ---------------- */

/* Pasang modul: simpan manifest, injak JSON-LD + meta awal, lalu
   dengarkan 'hashchange'. Idempotent — init kedua tidak mendaftarkan
   listener ganda. opts: { manifest, catLabel?, onToast? }.
   - manifest: array manifest.js (id, name, desc, cat).
   - catLabel: fungsi label kategori (app.js:47) — opsional.
   - onToast: fungsi toast(msg) app.js:235 — opsional; tanpa ini,
     umpan balik berbagi hanya berupa ✓ pada tombol. */
export function initSeoShare(opts) {
  const o = opts || {};
  if (Array.isArray(o.manifest)) {
    _manifest = o.manifest;
    const map = new Map(_manifest.map((m) => [m.id, m]));
    _byId = (id) => (id ? map.get(id) || null : null);
  }
  if (typeof o.catLabel === 'function') _catLabel = o.catLabel;
  if (typeof o.onToast === 'function') _onToast = o.onToast;
  if (typeof window !== 'undefined' && !_started) {
    _started = true;
    window.addEventListener('hashchange', syncMeta);
  }
  syncMeta();
  /* S-U5 (v6.22.0, manifest split): meta/JSON-LD halaman tool
     deep-link memakai desc — bila manifest masih ramping saat
     boot, meta memakai HOME_DESC dulu; begitu detail tiba
     (dipicu jalur lain: rail/fill/pencarian), sinkronkan ulang
     supaya deskripsi meta naik ke desc asli tool. Berlangganan
     saja — modul ini tidak memicu fetch (lihat impor di atas). */
  if (typeof window !== 'undefined') {
    onManifestDetails(() => syncMeta());
  }
}
