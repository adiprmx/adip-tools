// api/csp-report.js — Endpoint G-4: penerima laporan pelanggaran CSP (Adip Tools v6.19.1)
//
// CommonJS — package.json TANPA "type": "module", jadi .js = CommonJS.
// Browser mengirim laporan ke sini via `report-uri /api/csp-report` (CSP Report-Only).
// Laporan diteruskan ke RPC `public.csp_report_insert(p_report jsonb)` di Supabase
// BARU (ref baiqyrwjfuugpjzchhpg) via PostgREST, memakai SERVICE_ROLE key
// (server-side saja — RPC sudah dicabut dari anon/authenticated, R-04).
// Anon TIDAK punya akses langsung ke tabel csp_reports (RLS tanpa policy anon)
// maupun ke RPC.
//
// ENV (wajib di-set di Vercel, JANGAN hardcode nilai):
//   SUPABASE_URL               — mis. https://<ref>.supabase.co (tanpa trailing slash)
//   SUPABASE_SERVICE_ROLE_KEY  — service_role key proyek Supabase baru
//                                (MENGANTIKAN SUPABASE_ANON_KEY sejak R-04 —
//                                anon key TIDAK LAGI cukup: RPC menolak anon.)
// Body JSON diteruskan UTUH sebagai p_report (envelope {csp-report: ...} TIDAK
// dikupas; array report-to [{...}] juga apa adanya) — kolom generated P7
// (blocked_uri dkk.) membaca report -> 'csp-report' ->> ..., jadi mengupas
// envelope membuat kolom itu NULL (temuan Q2 §2, diperbaiki FIX-2).
//
// Content-Type (R-02): laporan CSP asli browser HANYA memakai
// `application/csp-report` (report-uri) atau `application/reports+json`
// (report-to). Tipe lain (termasuk text/plain dari sendBeacon lintas-origin
// dan ketiadaan header) ditolak 415 — sendBeacon text/plain adalah simple
// request tanpa preflight, jadi inilah penutup jalur CSRF browser korban.
// Fetch lintas-origin dengan tipe CSP memicu preflight yang gagal (function
// ini tanpa header CORS).
//
// Perilaku fail-open: bila env tidak ada, Supabase gagal, atau timeout —
// respons tetap 204 agar browser tidak retry storm. Hanya log ke console.
//
// Batasan: body maks 10 KB (lebih -> 413), sampling 10%, rate limit best-effort
// in-memory 10/menit per IP (cold start meresetnya; cap harian di RPC adalah
// penjaga utama).

'use strict';

const MAX_BODY_BYTES = 10 * 1024; // 10 KB
const SAMPLE_RATE = 0.1; // 10%
const RATE_LIMIT_MAX = 10; // maks request per IP per jendela
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 menit
const SUPABASE_TIMEOUT_MS = 5000; // 5 detik

// Content-Type yang dipakai browser asli untuk laporan CSP (R-02).
// report-uri -> application/csp-report; report-to -> application/reports+json.
// Parameter (mis. "; charset=utf-8") diabaikan saat pencocokan.
const ALLOWED_CONTENT_TYPES = new Set([
  'application/csp-report',
  'application/reports+json',
]);

// true bila header Content-Type request adalah salah satu tipe laporan CSP
// asli. Ketiadaan header, tipe lain, atau nilai non-string -> false.
function hasAllowedContentType(req) {
  const ct = req.headers && req.headers['content-type'];
  if (typeof ct !== 'string') return false;
  const mediaType = ct.split(';', 1)[0].trim().toLowerCase();
  return ALLOWED_CONTENT_TYPES.has(mediaType);
}

// Rate limit best-effort in-memory: ip -> { count, resetAt }.
// Map ini hidup per instance function; cold start meresetnya (diterima —
// cap harian di RPC adalah penjaga utama).
const rateLimits = new Map();

// Field pelanggaran yang dikenali. Format report-uri memakai kebab-case
// (blocked-uri), format report-to (Reporting API) memakai camelCase
// (blockedURL) — keduanya diterima.
const RECOGNIZED_FIELDS = [
  'blocked-uri',
  'violated-directive',
  'effective-directive',
  'blockedURL',
  'violatedDirective',
  'effectiveDirective',
];

function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function hasRecognizedField(report) {
  return RECOGNIZED_FIELDS.some((f) => report[f] !== undefined);
}

// Validasi body ter-parse: cari SATU objek laporan yang punya field
// pelanggaran yang dikenali —
//   { csp-report: {...} }  -> inner object (format report-uri)
//   [{...}]                -> elemen pertama (format report-to, array)
//   {...}                  -> objek itu sendiri (format report-to, tunggal)
//   { body: {...} }        -> body (envelope Reporting API, bila ada)
// Mengembalikan objek laporan (HANYA untuk validasi), atau null bila tidak
// ada field pelanggaran yang dikenali. Yang diteruskan ke Supabase BUKAN
// nilai kembalian ini, melainkan body ASLI (parsed) — envelope utuh —
// agar kolom generated P7 tetap terisi (FIX-2, temuan Q2 §2).
function extractReport(parsed) {
  let candidate = parsed;

  if (Array.isArray(parsed)) {
    if (parsed.length === 0) return null;
    candidate = parsed[0];
  } else if (isPlainObject(parsed) && isPlainObject(parsed['csp-report'])) {
    candidate = parsed['csp-report'];
  }

  if (!isPlainObject(candidate)) return null;

  // Envelope Reporting API: { type: 'csp-violation', body: {...} }
  if (!hasRecognizedField(candidate) && isPlainObject(candidate.body)) {
    candidate = candidate.body;
  }

  return hasRecognizedField(candidate) ? candidate : null;
}

function getClientIp(req) {
  const forwarded = req.headers && req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return String(forwarded[0]).split(',')[0].trim();
  }
  return (req.socket && req.socket.remoteAddress) || 'unknown';
}

// true = masih dalam kuota (dan hitung request ini); false = kena limit.
function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rateLimits.get(ip);

  if (!entry || now >= entry.resetAt) {
    rateLimits.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count += 1;
  return true;
}

// Bersihkan entri kedaluwarsa sesekali agar Map tidak tumbuh tanpa batas.
function pruneRateLimits() {
  const now = Date.now();
  for (const [ip, entry] of rateLimits) {
    if (now >= entry.resetAt) rateLimits.delete(ip);
  }
}

// Baca body dari stream req secara manual — Content-Type: application/csp-report
// TIDAK ter-parse otomatis oleh Vercel. Mengembalikan Buffer, atau null bila
// body melebihi MAX_BODY_BYTES.
async function readBody(req) {
  const chunks = [];
  let total = 0;
  for await (const chunk of req) {
    total += chunk.length;
    if (total > MAX_BODY_BYTES) {
      // Hentikan stream agar tidak menelan body raksasa.
      try {
        if (typeof req.destroy === 'function') req.destroy();
      } catch (_) {
        /* abaikan */
      }
      return null;
    }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

async function forwardToSupabase(report) {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    console.log('[csp-report] SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY belum di-set — laporan dibuang (fail-open).');
    return;
  }

  const rpcUrl = url.replace(/\/$/, '') + '/rest/v1/rpc/csp_report_insert';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SUPABASE_TIMEOUT_MS);

  try {
    const resp = await fetch(rpcUrl, {
      method: 'POST',
      headers: {
        apikey: serviceKey,
        Authorization: 'Bearer ' + serviceKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ p_report: report }),
      signal: controller.signal,
    });

    if (!resp.ok) {
      console.log('[csp-report] RPC gagal, status HTTP ' + resp.status);
      return;
    }

    const stored = await resp.json();
    if (stored === false) {
      console.log('[csp-report] RPC menolak: cap harian tercapai.');
    }
  } catch (err) {
    // Timeout / jaringan down / DNS gagal — fail-open, jangan retry storm.
    console.log('[csp-report] Gagal hubungi Supabase: ' + (err && err.message ? err.message : err));
  } finally {
    clearTimeout(timeout);
  }
}

async function handler(req, res) {
  // 1. Hanya POST.
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end();
  }

  // 2. Content-Type harus tipe laporan CSP asli (R-02) — sebelum rate limit
  //    agar request palsu tidak menghabiskan bucket IP korban.
  if (!hasAllowedContentType(req)) {
    return res.status(415).end();
  }

  // 3. Rate limit per IP (best-effort, in-memory).
  if (Math.random() < 0.01) pruneRateLimits(); // ~1% request memangkas Map
  if (!checkRateLimit(getClientIp(req))) {
    return res.status(429).end();
  }

  // 4. Baca body (cap 10 KB).
  let raw;
  try {
    raw = await readBody(req);
  } catch (err) {
    console.log('[csp-report] Gagal baca body: ' + (err && err.message ? err.message : err));
    return res.status(400).end();
  }
  if (raw === null) {
    return res.status(413).end();
  }

  // 5. Parse JSON + validasi format laporan.
  let parsed;
  try {
    parsed = JSON.parse(raw.toString('utf8'));
  } catch (_) {
    return res.status(400).end();
  }
  // Validasi saja: extractReport mengintip inner object untuk memastikan
  // ada field pelanggaran yang dikenali. Body ASLI (parsed) yang diteruskan
  // ke Supabase di langkah 7 — envelope utuh, tanpa dikupas (FIX-2).
  if (extractReport(parsed) === null) {
    return res.status(400).end();
  }

  // 6. Sampling 10% — yang tidak tersampling langsung 204.
  if (Math.random() >= SAMPLE_RATE) {
    return res.status(204).end();
  }

  // 7. Teruskan body ASLI (envelope utuh) ke Supabase (fail-open bila env
  //    hilang / RPC gagal / timeout).
  await forwardToSupabase(parsed);
  return res.status(204).end();
}

// Hook untuk harness tes lokal (tidak dipakai di produksi).
handler._test = {
  resetRateLimits() {
    rateLimits.clear();
  },
  constants: { MAX_BODY_BYTES, SAMPLE_RATE, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS },
};

module.exports = handler;
