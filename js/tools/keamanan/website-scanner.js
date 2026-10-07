/* Website Security Scanner — 100% client-side, tanpa backend.
 * Cara kerja: homepage target diambil via proxy CORS (test.cors.workers.dev,
 * fallback allorigins), DNS/email via DoH dns.google, umur domain via RDAP,
 * subdomain + info sertifikat via crt.sh, arsip via web.archive.org.
 * 15 modul jalan langsung di browser; 2 limitasi yang memang tak bisa
 * diakali dari browser (hsts-preload: API menolak CORS; TLS: browser tidak
 * mengekspos versi/cipher ke JS) ditandai JUJUR — tidak ada fake pass.
 * Fungsi murni di-export agar bisa di-unit-test via node.
 */
import { h as T, utils } from '../../core.js?v=6.9.5';

export const meta = {id:"website-scanner", name:"Website Security Scanner", cat:"keamanan", icon:"🛡️", desc:"Pindai keamanan website: header, DNS, email, TLS, secrets & exposure. 15 modul browser + 2 ditandai jujur.", keywords:"security,scanner,keamanan,website,headers,dns,spf,dmarc,scan"};

const DOH = 'https://dns.google/resolve';
const PROXY_W = (u) => 'https://test.cors.workers.dev/?' + encodeURIComponent(u);
const PROXY_AO = (u) => 'https://api.allorigins.win/get?url=' + encodeURIComponent(u);
const IANA_RDAP = 'https://data.iana.org/rdap/dns.json';
const HIST_KEY = 'aq_website_scanner_history';
const COOLDOWN_MS = 30000;

/* ================= FUNGSI MURNI (unit-testable) ================= */

export function isPrivateIPv4(ip) {
  const p = ip.split('.').map(Number);
  if (p.length !== 4 || p.some((n) => isNaN(n) || n < 0 || n > 255)) return false;
  const [a, b] = p;
  return a === 10 || a === 127 || (a === 172 && b >= 16 && b <= 31) ||
         (a === 192 && b === 168) || (a === 169 && b === 254) || ip === '0.0.0.0';
}

// Guard ala-SSRF versi browser: tolak target privat/lokal. Return {ok, reason}
export function ssrfCheck(hostname) {
  const h = (hostname || '').toLowerCase().trim();
  if (!h) return {ok:false, reason:'hostname kosong'};
  if (h === 'localhost' || h.endsWith('.localhost')) return {ok:false, reason:'localhost tidak boleh di-scan'};
  for (const sfx of ['.local', '.internal', '.lan', '.home', '.corp', '.invalid', '.test']) {
    if (h.endsWith(sfx)) return {ok:false, reason:'domain lokal "'+sfx+'" tidak boleh di-scan'};
  }
  if (h === '[::1]' || h === '::1') return {ok:false, reason:'alamat loopback tidak boleh di-scan'};
  if (isPrivateIPv4(h)) return {ok:false, reason:'IP privat tidak boleh di-scan'};
  if (/^\d+\.\d+\.\d+\.\d+$/.test(h)) return {ok:true}; // IP publik literal
  if (!/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/i.test(h))
    return {ok:false, reason:'format hostname tidak valid'};
  return {ok:true};
}

// Normalisasi input user → {origin, host}. Throw Error(msg Indonesia) bila invalid.
export function normalizeTarget(raw) {
  let s = (raw || '').trim();
  if (!s) throw new Error('Masukkan URL dulu ya.');
  if (/^(javascript|data|file|ftp|vbscript):/i.test(s)) throw new Error('Skema URL tidak didukung — pakai http/https.');
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(s)) s = 'https://' + s;
  let u;
  try { u = new URL(s); } catch (e) { throw new Error('URL tidak valid.'); }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') throw new Error('Hanya http/https yang didukung.');
  if (u.username || u.password) throw new Error('URL dengan kredensial tidak didukung.');
  if (u.port && u.port !== '80' && u.port !== '443') throw new Error('Port non-standar tidak didukung.');
  const chk = ssrfCheck(u.hostname);
  if (!chk.ok) throw new Error(chk.reason);
  return {origin: u.protocol + '//' + u.hostname, host: u.hostname.toLowerCase()};
}

const WEIGHTS = {critical:25, high:10, medium:4, low:1, info:0};
export function gradeFor(score) {
  if (score >= 97) return 'A+';
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 55) return 'D';
  return 'F';
}
export function calcScore(findings) {
  const counts = {critical:0, high:0, medium:0, low:0, info:0};
  let penalty = 0;
  for (const f of findings) {
    const s = (f.severity || 'info');
    if (counts[s] !== undefined) counts[s]++;
    penalty += WEIGHTS[s] || 0;
  }
  const score = Math.max(0, 100 - penalty);
  return {score, grade: gradeFor(score), counts};
}

export function stripQuotes(s) {
  s = (s || '').trim();
  if (s.length >= 2 && s[0] === '"' && s[s.length-1] === '"') s = s.slice(1, -1);
  return s;
}

// --- Parser DNS/Email (murni) ---
export function parseSpf(txts, hasMx) {
  const rec = (txts || []).map(stripQuotes).find((t) => /^v=spf1/i.test(t));
  if (!rec) return hasMx
    ? {status:'missing', sev:'high', detail:'tidak ada record SPF padahal domain punya MX'}
    : {status:'missing', sev:'info', detail:'tidak ada record SPF (domain tidak pakai email)'};
  if (/\ball\b/i.test(rec) && /^[+?]/m.test(rec.split(/\s+/).pop() || ''))
    return {status:'weak', sev:'medium', detail:'SPF memakai +all/?all — terlalu longgar: ' + rec};
  if (/\s[+?]all(\s|$)/i.test(rec))
    return {status:'weak', sev:'medium', detail:'SPF memakai +all/?all — terlalu longgar'};
  return {status:'ok', detail:rec};
}
export function parseDmarc(txts) {
  const rec = (txts || []).map(stripQuotes).find((t) => /^v=dmarc1/i.test(t));
  if (!rec) return {status:'missing', sev:'high', detail:'tidak ada record DMARC'};
  const p = /p=([a-z]+)/i.exec(rec);
  const pol = p ? p[1].toLowerCase() : '';
  if (pol === 'none') return {status:'monitor', sev:'medium', detail:'DMARC p=none — hanya monitoring, email palsu tidak ditolak'};
  if (pol === 'quarantine' || pol === 'reject') return {status:'ok', detail:'p=' + pol};
  return {status:'unknown', sev:'low', detail:rec};
}

// --- Ekstraksi HTML (murni) ---
export function extractScripts(html, origin) {
  const out = [];
  const re = /<script\b[^>]*>/gi;
  let m;
  while ((m = re.exec(html || ''))) {
    const tag = m[0];
    const srcM = /\ssrc\s*=\s*["']([^"']+)["']/i.exec(tag);
    if (!srcM) continue;
    let src = srcM[1].trim();
    if (/^data:/i.test(src)) continue;
    try { src = new URL(src, origin).href; } catch (e) { continue; }
    const intM = /\sintegrity\s*=\s*["']([^"']+)["']/i.exec(tag);
    out.push({src, integrity: intM ? intM[1] : null});
  }
  return out;
}
export function verLt(a, b) {
  const pa = String(a).split('.').map(Number), pb = String(b).split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const x = pa[i] || 0, y = pb[i] || 0;
    if (x < y) return true; if (x > y) return false;
  }
  return false;
}
const LIB_PATTERNS = [
  {lib:'jquery', res:[/(?:^|\/)jquery[.-](\d+\.\d+\.\d+)/i, /\/jquery\/(\d+\.\d+\.\d+)\//i]},
  {lib:'bootstrap', res:[/bootstrap[.-](\d+\.\d+\.\d+)/i, /\/bootstrap\/(\d+\.\d+\.\d+)\//i]},
  {lib:'lodash', res:[/lodash[.-](\d+\.\d+\.\d+)/i]},
  {lib:'moment', res:[/moment[.-](\d+\.\d+\.\d+)/i]},
  {lib:'axios', res:[/axios[.-](\d+\.\d+\.\d+)/i]},
];
export function extractLibs(scripts) {
  const out = [];
  for (const s of scripts || []) {
    for (const p of LIB_PATTERNS) {
      for (const re of p.res) {
        const m = re.exec(s.src);
        if (m) { out.push({lib:p.lib, version:m[1], src:s.src}); break; }
      }
    }
  }
  return out;
}
export const VULN_DB = [
  {lib:'jquery', max:'3.5.0', cve:'CVE-2020-11022', sev:'high', note:'XSS via html()/append()'},
  {lib:'jquery', max:'3.0.0', cve:'CVE-2015-9251', sev:'medium', note:'XSS cross-domain AJAX'},
  {lib:'bootstrap', max:'3.4.1', cve:'CVE-2019-8331', sev:'high', note:'XSS via tooltip/popover'},
  {lib:'lodash', max:'4.17.21', cve:'CVE-2021-23337', sev:'high', note:'command injection via template'},
  {lib:'moment', max:'2.29.2', cve:'CVE-2022-24785', sev:'high', note:'ReDoS / path traversal locale'},
  {lib:'axios', max:'0.21.1', cve:'CVE-2020-28168', sev:'medium', note:'credential leakage redirect'},
];
export function matchLibVulns(libs) {
  const out = [];
  for (const l of libs || []) {
    for (const v of VULN_DB) {
      if (v.lib === l.lib && verLt(l.version, v.max)) {
        out.push({module:'jscve', severity:v.sev,
          title:`${l.lib} ${l.version} rentan (${v.cve})`,
          description:`Terdeteksi ${l.lib} versi ${l.version} — di bawah versi aman ${v.max}. ${v.note}.`,
          impact:`Penyerang yang menemukan celah XSS/injeksi di situs dapat mencuri sesi pengunjung atau menyuntik konten berbahaya. Library lawas adalah pintu masuk klasik.`,
          remediation:`Upgrade ${l.lib} ke versi ≥ ${v.max}, lalu uji ulang fungsi yang memakainya.`,
          evidence:v.cve + ' | ' + l.src.slice(0, 120)});
      }
    }
  }
  return out;
}

// --- Analisa security headers (murni, headers = map lowercase) ---
export function headersFindings(h, isHttps) {
  const f = [];
  const has = (k) => !!(h[k] && String(h[k]).trim());
  if (!has('content-security-policy')) f.push({module:'headers', severity:'high',
    title:'Content-Security-Policy tidak dipasang',
    description:'Header Content-Security-Policy tidak ditemukan pada respons.',
    impact:'Website rentan terhadap XSS dan clickjacking: bila penyerang berhasil menyuntikkan script, browser akan mengeksekusinya tanpa batasan.',
    remediation:"Tambahkan header Content-Security-Policy, mis. default-src 'self'. Uji di report-only dulu.", evidence:''});
  if (isHttps && !has('strict-transport-security')) f.push({module:'headers', severity:'medium',
    title:'HSTS tidak dipasang', description:'Header Strict-Transport-Security tidak ada padahal situs pakai HTTPS.',
    impact:'Pengunjung bisa dipaksa turun ke HTTP via serangan SSL-stripping di jaringan yang tidak aman.',
    remediation:'Tambahkan Strict-Transport-Security: max-age=31536000; includeSubDomains.', evidence:''});
  const csp = h['content-security-policy'] || '';
  if (!has('x-frame-options') && !/frame-ancestors/i.test(csp)) f.push({module:'headers', severity:'medium',
    title:'Proteksi clickjacking tidak ada',
    description:'Tidak ada X-Frame-Options maupun frame-ancestors di CSP — halaman bisa di-embed di iframe situs lain.',
    impact:'Penyerang dapat membingkai halaman login/form sensitif dan mengelabui klik pengguna (clickjacking).',
    remediation:"Tambahkan X-Frame-Options: SAMEORIGIN atau frame-ancestors 'self' di CSP.", evidence:''});
  if ((h['x-content-type-options'] || '').toLowerCase() !== 'nosniff') f.push({module:'headers', severity:'low',
    title:'X-Content-Type-Options: nosniff tidak dipasang',
    description:'Browser boleh menebak tipe konten file.',
    impact:'File yang di-upload pengguna (mis. gambar berisi script tersembunyi) bisa dieksekusi sebagai script.',
    remediation:'Tambahkan X-Content-Type-Options: nosniff.', evidence:''});
  if (!has('referrer-policy')) f.push({module:'headers', severity:'low',
    title:'Referrer-Policy tidak dipasang',
    description:'Browser mengirim URL halaman penuh sebagai referrer ke situs lain.',
    impact:'URL sensitif (berisi token/id di path) bisa bocor ke pihak ketiga lewat header Referer.',
    remediation:'Tambahkan Referrer-Policy: strict-origin-when-cross-origin.', evidence:''});
  if (!has('permissions-policy')) f.push({module:'headers', severity:'info',
    title:'Permissions-Policy tidak dipasang',
    description:'Tidak ada pembatasan fitur browser (kamera, mic, geolocation).',
    impact:'Risiko rendah untuk situs statis; penting bila situs memakai iframe pihak ketiga.',
    remediation:'Pertimbangkan Permissions-Policy untuk menonaktifkan fitur yang tak dipakai.', evidence:''});
  return f;
}

// setCookies: array string mentah "nama=nilai; Secure; HttpOnly; ..."
export function cookiesFindings(setCookies, isHttps) {
  const f = [];
  const noSecure = [], noHttpOnly = [], badSameSite = [], noSameSite = [];
  for (const raw of setCookies || []) {
    const parts = String(raw).split(';').map((s) => s.trim());
    const name = (parts[0] || '').split('=')[0] || '(tanpa nama)';
    const attrs = parts.slice(1).join('; ').toLowerCase();
    const hasSecure = /(^|;\s*)secure(\s*;|$)/.test(attrs + ';');
    const hasHttpOnly = attrs.includes('httponly');
    const ss = /samesite\s*=\s*([a-z]+)/.exec(attrs);
    if (isHttps && !hasSecure) noSecure.push(name);
    if (!hasHttpOnly) noHttpOnly.push(name);
    if (ss && ss[1] === 'none' && !hasSecure) badSameSite.push(name);
    else if (!ss) noSameSite.push(name);
  }
  if (badSameSite.length) f.push({module:'cookies', severity:'high',
    title:'Cookie SameSite=None tanpa Secure: ' + badSameSite.join(', '),
    description:'Kombinasi ini ditolak browser modern — cookie tidak terkirim, dan pola ini menandakan konfigurasi ceroboh.',
    impact:'Sesi bisa bocor lintas situs; fungsionalitas login berpotensi rusak di Chrome/Safari.',
    remediation:'Ganti ke SameSite=Lax (default aman) atau pastikan Secure bila memang butuh None.', evidence:badSameSite.join(', ')});
  if (noSecure.length) f.push({module:'cookies', severity:'medium',
    title:'Cookie tanpa flag Secure: ' + noSecure.join(', '),
    description:'Cookie dikirim juga lewat HTTP polos.',
    impact:'Di jaringan tidak aman (WiFi publik), cookie sesi bisa disadap dan dibajak.',
    remediation:'Tambahkan flag Secure pada semua cookie sesi.', evidence:noSecure.join(', ')});
  if (noHttpOnly.length) f.push({module:'cookies', severity:'medium',
    title:'Cookie tanpa HttpOnly: ' + noHttpOnly.join(', '),
    description:'Cookie bisa dibaca JavaScript.',
    impact:'Bila ada celah XSS, penyerang mencuri cookie sesi langsung via document.cookie.',
    remediation:'Tambahkan flag HttpOnly pada cookie sesi.', evidence:noHttpOnly.join(', ')});
  if (noSameSite.length) f.push({module:'cookies', severity:'low',
    title:'Cookie tanpa atribut SameSite: ' + noSameSite.join(', '),
    description:'Mengandalkan default browser.',
    impact:'Risiko CSRF kecil pada browser lama; browser modern default ke Lax.',
    remediation:'Set eksplisit SameSite=Lax.', evidence:noSameSite.join(', ')});
  return f;
}

export function parseRobots(text) {
  const disallows = [];
  for (const line of String(text || '').split('\n')) {
    const m = /^\s*disallow\s*:\s*(\S+)/i.exec(line.trim());
    if (m && m[1] !== '/') disallows.push(m[1]);
  }
  const sensitive = disallows.filter((d) => /\/(admin|administrator|backup|backups|private|config|db|database|wp-admin|\.git|\.env)/i.test(d));
  return {disallows, sensitive};
}
export function findMixed(html) {
  const out = new Set();
  const re = /(?:src|href)\s*=\s*["'](http:\/\/[^"']+)["']/gi;
  let m;
  while ((m = re.exec(html || ''))) out.add(m[1].slice(0, 120));
  return [...out].slice(0, 20);
}
const TECH_SIGS = [
  {name:'WordPress', res:[/wp-content\//i, /wp-includes\//i], ver:/\/wp-includes\/js\/[^"']*?(\d+\.\d+)/i},
  {name:'Next.js', res:[/__NEXT_DATA__/i, /_next\/static\//i]},
  {name:'Laravel', res:[/csrf-token/i, /laravel/i]},
  {name:'Django', res:[/csrftoken/i, /django/i]},
  {name:'React', res:[/react-dom/i, /data-reactroot/i]},
  {name:'Vue', res:[/vue\.js/i, /data-v-[a-f0-9]+/i]},
  {name:'jQuery', res:[/jquery/i]},
  {name:'Cloudflare', res:[], header:'server', hres:/cloudflare/i},
];
export function detectTech(html, headers) {
  const out = [];
  const h = html || '';
  for (const t of TECH_SIGS) {
    let hit = t.res.some((re) => re.test(h));
    if (!hit && t.header && headers[t.header] && t.hres.test(headers[t.header])) hit = true;
    if (hit) {
      let ver = '';
      if (t.ver) { const m = t.ver.exec(h); if (m) ver = m[1]; }
      out.push({name:t.name, version:ver});
    }
  }
  return out;
}
export function redactSecret(s) {
  s = String(s || '');
  return s.length <= 8 ? s.slice(0, 2) + '…' : s.slice(0, 4) + '…' + ' (disensor)';
}
export const SECRET_PATTERNS = [
  {re:/AKIA[0-9A-Z]{16}/g, type:'AWS Access Key ID', sev:'critical'},
  {re:/AIza[0-9A-Za-z\-_]{35}/g, type:'Google API Key', sev:'high'},
  {re:/xox[bap]-[A-Za-z0-9\-]+/g, type:'Slack Token', sev:'high'},
  {re:/-----BEGIN (?:RSA )?PRIVATE KEY-----/g, type:'Private Key', sev:'critical'},
  {re:/['"](?:api[_-]?key|apikey|secret[_-]?key|client[_-]?secret)['"]\s*[:=]\s*['"]([A-Za-z0-9\-_]{16,})['"]/gi, type:'API key generik', sev:'medium'},
];
export function scanSecretsInText(text, fileLabel) {
  const out = [];
  for (const p of SECRET_PATTERNS) {
    p.re.lastIndex = 0;
    let m, n = 0;
    while ((m = p.re.exec(text || '')) && n < 3) {
      n++;
      out.push({module:'secrets', severity:p.sev,
        title:`${p.type} bocor di ${fileLabel}`,
        description:`Pola ${p.type} ditemukan di file JavaScript publik.`,
        impact:'Kredensial yang bocor di file publik dapat dipakai siapa pun: tagihan API membengkak, data dicuri, atau infrastruktur disalahgunakan.',
        remediation:'Cabut/rotasi kredensial itu SEKARANG, pindahkan ke backend/env, dan jangan pernah hardcode secret di JS frontend.',
        evidence:redactSecret(m[0])});
    }
  }
  return out;
}
// Parse event RDAP → {created, expires} (ISO string atau null)
export function parseRdapEvents(rdap) {
  const ev = (rdap && rdap.events) || [];
  const get = (act) => { const e = ev.find((x) => x.eventAction === act); return e ? e.eventDate : null; };
  return {created: get('registration'), expires: get('expiration')};
}

// fetch dengan retry + timeout per percobaan (AbortController) + backoff.
// Tiap percobaan gagal → tunggu backoffBase*2^(n-1) ms; habis tries → throw error terakhir.
export async function fetchRetry(url, {tries=3, timeout=12000, backoffBase=1500}={}) {
  let lastErr = null;
  for (let n = 1; n <= tries; n++) {
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), timeout);
    try {
      const r = await fetch(url, {signal: c.signal});
      clearTimeout(t);
      return r;
    } catch (e) {
      clearTimeout(t);
      lastErr = e;
      if (n < tries) await new Promise((res) => setTimeout(res, backoffBase * 2 ** (n - 1)));
    }
  }
  throw lastErr;
}

// Parse JSON crt.sh → daftar subdomain unik (buang prefix wildcard), maks 50.
export function parseCtJson(json) {
  const rows = Array.isArray(json) ? json : [];
  const set = new Set();
  for (const row of rows) {
    const nv = String((row && row.name_value) || '');
    for (const line of nv.split('\n')) {
      const s = line.trim().toLowerCase().replace(/^\*\./, '');
      if (s) set.add(s);
    }
  }
  return [...set].slice(0, 50);
}

// Ambil sertifikat dengan not_after paling baru dari JSON crt.sh.
// Return {expiry_days, not_after, issuer_name} atau null bila tak ada data tanggal.
// nowMs opsional (untuk unit test); default Date.now().
export function certExpiry(json, nowMs) {
  const rows = Array.isArray(json) ? json : [];
  let best = null;
  for (const row of rows) {
    if (!row || !row.not_after) continue;
    const ts = Date.parse(row.not_after);
    if (isNaN(ts)) continue;
    if (!best || ts > best.ts) best = {ts, not_after: row.not_after, issuer_name: row.issuer_name || ''};
  }
  if (!best) return null;
  const now = nowMs != null ? nowMs : Date.now();
  return {expiry_days: (best.ts - now) / 86400000, not_after: best.not_after, issuer_name: best.issuer_name};
}

// Pola URL sensitif yang dicari di arsip Wayback (lowercase, partial match).
export const WAYBACK_SENSITIVE = ['?password=', '/.env', '/backup', '/admin', '.sql', '.zip', '/.git'];
// Parse JSON CDX web.archive.org → {count, sensitive[], sample[]}. Baris pertama (header) dilewati.
export function parseWayback(json) {
  const rows = Array.isArray(json) ? json : [];
  const urls = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!Array.isArray(row) || !row[2]) continue;
    urls.push(String(row[2]));
  }
  const sensitive = [...new Set(urls.filter((u) => WAYBACK_SENSITIVE.some((p) => u.toLowerCase().includes(p.toLowerCase()))))].slice(0, 10);
  return {count: urls.length, sensitive, sample: urls.slice(0, 5)};
}

/* ================= FETCH HELPERS ================= */
function tFetch(url, {timeout = 15000, ...opts} = {}) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), timeout);
  return fetch(url, {...opts, signal: c.signal}).finally(() => clearTimeout(t));
}
// Ambil URL target via proxy. Return {ok, status, headers(map lowercase), text, via}
async function fetchProxied(url, {timeout = 15000} = {}) {
  try {
    const r = await tFetch(PROXY_W(url), {timeout});
    const h = {};
    const blob = r.headers.get('cors-received-headers');
    if (blob) { try { const j = JSON.parse(blob); for (const k in j) h[String(k).toLowerCase()] = String(j[k]); } catch (e) {} }
    for (const k of ['content-security-policy','strict-transport-security','x-frame-options','x-content-type-options','referrer-policy','permissions-policy','server','x-powered-by','content-type','location']) {
      if (!h[k]) { const v = r.headers.get(k); if (v) h[k] = v; }
    }
    const text = await r.text();
    return {ok: true, status: r.status, headers: h, text, via: 'workers'};
  } catch (e1) {
    try { // fallback: allorigins /get (body + status, tanpa header)
      const r = await tFetch(PROXY_AO(url), {timeout});
      const j = await r.json();
      if (!j || typeof j.contents !== 'string') throw new Error('proxy gagal');
      return {ok: true, status: (j.status && j.status.http_code) || 200, headers: {}, text: j.contents, via: 'allorigins'};
    } catch (e2) { return {ok: false, error: String((e1 && e1.message) || e1)}; }
  }
}
async function doh(name, type) {
  const r = await tFetch(`${DOH}?name=${encodeURIComponent(name)}&type=${encodeURIComponent(type)}`, {timeout: 10000});
  if (!r.ok) throw new Error('DoH ' + r.status);
  return r.json();
}
const dohTxt = async (name) => {
  try {
    const j = await doh(name, 'TXT');
    return (j.Answer || []).filter((a) => a.type === 16).map((a) => stripQuotes(a.data));
  } catch (e) { return null; }
};
let _rdapBootstrap = null;
async function rdapServerFor(tld) {
  if (!_rdapBootstrap) {
    const r = await tFetch(IANA_RDAP, {timeout: 12000});
    _rdapBootstrap = await r.json();
  }
  for (const [tlds, urls] of (_rdapBootstrap.services || [])) {
    if (tlds.includes(tld)) return urls;
  }
  return null;
}

/* ================= MODUL SCAN ================= */
// ctx: {host, origin, isHttps, page:{status,headers,text}|null, libs:[], cookieNames:[]}

async function mDnsEmail(ctx) {
  const f = [];
  const H = ctx.host;
  const [txtApex, mx, caa, dmarc, mtaSts, tlsRpt] = await Promise.all([
    dohTxt(H), doh(H, 'MX').then((j) => j.Answer || []).catch(() => null),
    doh(H, 'CAA').then((j) => j.Answer || []).catch(() => null),
    dohTxt('_dmarc.' + H), dohTxt('_mta-sts.' + H), dohTxt('_smtp._tls.' + H),
  ]);
  const hasMx = !!(mx && mx.length);
  // SPF
  if (txtApex === null) f.push(mkInfo('dns', 'SPF tidak dapat dicek', 'Query DNS gagal.'));
  else {
    const p = parseSpf(txtApex, hasMx);
    if (p.status === 'missing' && p.sev === 'high') f.push(mk('dns','high','Record SPF tidak ada','Domain punya MX tapi tanpa SPF.',
      'Siapa pun dapat mengirim email phishing mengatasnamakan domain ini — penerima tidak bisa membedakan asli/palsu.',
      'Tambahkan TXT record: v=spf1 dengan mekanisme pengirim yang sah, akhiri -all.', ''));
    else if (p.status === 'weak') f.push(mk('dns','medium','SPF terlalu longgar', p.detail,
      'SPF yang longgar praktis tidak melindungi dari spoofing.',
      'Ketatkan SPF: daftarkan hanya IP/layanan pengirim yang sah, akhiri dengan -all.', p.detail.slice(0,120)));
  }
  // DMARC
  if (dmarc === null) f.push(mkInfo('dns', 'DMARC tidak dapat dicek', 'Query DNS gagal.'));
  else {
    const p = parseDmarc(dmarc);
    if (p.sev === 'high') f.push(mk('dns','high','Record DMARC tidak ada','Tidak ada kebijakan DMARC di _dmarc.'+H+'.',
      'Tanpa DMARC, email spoofing yang lolos SPF/DKIM tetap terkirim ke inbox korban.',
      'Tambahkan TXT di _dmarc.'+H+': v=DMARC1; p=quarantine; rua=mailto:dmarc@'+H, ''));
    else if (p.sev === 'medium') f.push(mk('dns','medium','DMARC hanya mode monitoring', p.detail,
      'Email palsu tetap terkirim — mode none tidak menolak apa pun.',
      'Naikkan bertahap ke p=quarantine lalu p=reject setelah monitoring.', p.detail.slice(0,120)));
  }
  // DKIM probe selector umum
  const sels = ['default','google','k1','selector1','selector2','s1','mail'];
  let found = null;
  await Promise.all(sels.map(async (s) => {
    const t = await dohTxt(s + '._domainkey.' + H);
    if (t && t.some((x) => /v=dkim1/i.test(x))) found = s;
  }));
  f.push(found
    ? mkInfo('dns', 'DKIM terdeteksi', 'Selector "' + found + '" ditemukan — email ditandatangani.')
    : mkInfo('dns', 'DKIM tidak terdeteksi', 'Tidak ada selector umum (' + sels.slice(0,4).join(', ') + '…). Perlu cek manual selector DKIM di penyedia email.'));
  // MX
  f.push(hasMx ? mkInfo('dns','MX record ada', mx.length + ' MX record ditemukan.')
               : mkInfo('dns','Tidak ada MX record','Domain tampaknya tidak dipakai untuk email.'));
  // CAA
  if (caa === null) f.push(mkInfo('dns','CAA tidak dapat dicek','Query DNS gagal.'));
  else if (!caa.length) f.push(mk('dns','low','Record CAA tidak ada','Tidak ada pembatasan CA penerbit sertifikat.',
    'CA mana pun (termasuk yang kurang ketat) bisa menerbitkan sertifikat untuk domain ini.',
    'Tambahkan CAA record menunjuk CA yang dipakai, mis. 0 issue "letsencrypt.org".', ''));
  // DNSSEC via flag AD
  try {
    const j = await doh(H, 'A');
    if (j.AD === false) f.push(mk('dns','low','DNSSEC tidak aktif','Resolver tidak memvalidasi tanda tangan DNS untuk domain ini.',
      'Respons DNS bisa dipalsukan (cache poisoning) tanpa terdeteksi.',
      'Aktifkan DNSSEC di registrar/DNS provider.', ''));
  } catch (e) { /* abaikan */ }
  // MTA-STS & TLS-RPT
  if (mtaSts === null) f.push(mkInfo('dns','MTA-STS tidak dapat dicek','Query DNS gagal.'));
  else if (!mtaSts.length) f.push(mk('dns','low','MTA-STS tidak dipasang','Tidak ada record _mta-sts.',
    'Email ke domain ini bisa dipaksa turun ke koneksi tanpa TLS (downgrade).',
    'Pasang record _mta-sts + file di https://mta-sts.' + H + '/.well-known/mta-sts.txt dengan mode: enforce.', ''));
  if (tlsRpt !== null && !tlsRpt.length) f.push(mkInfo('dns','TLS-RPT tidak dipasang','Tidak ada record _smtp._tls — laporan kegagalan TLS email tidak akan diterima.'));
  return f;
}

async function mRdap(ctx) {
  const f = [];
  const tld = ctx.host.split('.').pop();
  try {
    const urls = await rdapServerFor(tld);
    if (!urls || !urls.length) return [mkInfo('rdap','RDAP tidak tersedia untuk .' + tld,'TLD ini tidak punya server RDAP publik yang diketahui.')];
    const r = await tFetch(urls[0].replace(/\/$/,'') + '/domain/' + ctx.host, {timeout: 12000});
    if (!r.ok) throw new Error('RDAP ' + r.status);
    const {created, expires} = parseRdapEvents(await r.json());
    const now = Date.now();
    if (created) {
      const ageD = (now - Date.parse(created)) / 864e5;
      if (ageD < 180) f.push(mk('rdap','medium','Domain masih sangat baru (' + Math.max(1,Math.round(ageD)) + ' hari)',
        'Domain didaftarkan ' + created.slice(0,10) + '.',
        'Domain baru adalah ciri umum situs phishing/tipu-tipu — verifikasi legalitas sebelum bertransaksi.',
        'Bukan vonis: cross-check identitas pemilik & legalitas usaha.', 'created: ' + created.slice(0,10)));
      else f.push(mkInfo('rdap','Umur domain: ' + Math.round(ageD/365.25*10)/10 + ' tahun','Didaftarkan ' + created.slice(0,10) + '.'));
    }
    if (expires) {
      const expD = (Date.parse(expires) - now) / 864e5;
      if (expD < 30) f.push(mk('rdap','low','Domain hampir kedaluwarsa (' + Math.max(0,Math.round(expD)) + ' hari lagi)',
        'Kedaluwarsa ' + expires.slice(0,10) + '.',
        'Domain kedaluwarsa bisa diambil alih pihak lain dan dipakai untuk phishing.',
        'Perpanjang domain & aktifkan auto-renew.', 'expires: ' + expires.slice(0,10)));
    }
    if (!f.length) f.push(mkInfo('rdap','Data RDAP OK','Umur & masa berlaku domain normal.'));
  } catch (e) { f.push(mkInfo('rdap','RDAP tidak dapat dicek','Server RDAP tak merespons: ' + String(e.message||e).slice(0,80))); }
  return f;
}

async function mHeaders(ctx) {
  if (!ctx.page) return [mkInfo('headers','Header tidak dapat dicek','Halaman tidak bisa diambil via proxy.')];
  return headersFindings(ctx.page.headers, ctx.isHttps);
}
async function mCookies(ctx) {
  if (!ctx.page) return [mkInfo('cookies','Cookie tidak dapat dicek','Halaman tidak bisa diambil via proxy.')];
  const blob = ctx.page.headers['cors-received-headers'];
  let raw = [];
  if (blob) {
    try {
      const j = JSON.parse(blob);
      const sc = j['set-cookie'] || j['Set-Cookie'] || '';
      raw = String(sc).split(/,(?=[A-Za-z0-9_-]+\s*=)/).map((s) => s.trim()).filter(Boolean);
    } catch (e) {}
  }
  if (!raw.length) return [mkInfo('cookies','Tidak ada cookie terdeteksi','Respons tidak mengirim Set-Cookie (atau tidak terbaca).')];
  ctx.cookieNames = raw.map((s) => s.split('=')[0]);
  return cookiesFindings(raw, ctx.isHttps);
}
async function mCors(ctx) {
  try {
    const r = await tFetch(ctx.origin + '/', {timeout: 8000});
    if (r.type === 'opaque') return [mkInfo('cors','CORS tidak terbuka','Respons opaque — origin lain tidak bisa membaca.')];
    const hasSession = (ctx.cookieNames || []).length > 0;
    return [mk('cors', hasSession ? 'medium' : 'low','CORS mengizinkan origin lain membaca respons',
      'Server mengirim Access-Control-Allow-Origin yang mengizinkan https://tools.adipmusic.my.id membaca respons.',
      hasSession ? 'Dengan cookie sesi aktif, situs lain yang diizinkan bisa membaca data terautentikasi (tergantung konfigurasi).'
                 : 'Risiko rendah bila hanya data publik, tapi tetap pola konfigurasi longgar.',
      'Batasi ACAO ke origin yang benar-benar butuh, jangan pakai * untuk endpoint sensitif.', '')];
  } catch (e) {
    return [mkInfo('cors','CORS tidak terbuka lebar','Browser menolak baca lintas-origin (aman).')];
  }
}
async function mRedirect(ctx) {
  const r = await fetchProxied('http://' + ctx.host + '/');
  if (!r.ok) return [mkInfo('redirect','Redirect HTTP→HTTPS tidak dapat dicek','Target tidak merespons via proxy.')];
  const loc = (r.headers['location'] || '').toLowerCase();
  if ([301,302,303,307,308].includes(r.status) && loc.startsWith('https://'))
    return [mkInfo('redirect','HTTP dialihkan ke HTTPS','Status ' + r.status + ' → ' + loc.slice(0,60))];
  if (r.status === 200 && r.text && r.text.length > 500)
    return [mk('redirect','medium','HTTP tidak dialihkan ke HTTPS','http://' + ctx.host + '/ menyajikan konten langsung (HTTP 200).',
      'Pengunjung bisa tanpa sadar memakai koneksi polos; serangan SSL-stripping jadi mudah.',
      'Redirect permanen semua HTTP ke HTTPS (301) di web server.', 'HTTP 200, ' + r.text.length + ' bytes')];
  return [mkInfo('redirect','Hasil redirect tidak konklusif','Status: ' + r.status)];
}
async function mDisclosure(ctx) {
  const f = [];
  if (!ctx.page) return [mkInfo('disclosure','Tidak dapat dicek','Halaman tidak bisa diambil.')];
  const h = ctx.page.headers;
  const srv = h['server'] || '', xpb = h['x-powered-by'] || '';
  if (srv && /\/\d/.test(srv)) f.push(mk('disclosure','low','Server header membocorkan versi: ' + srv.slice(0,40),
    'Header Server menyebut versi spesifik.',
    'Penyerang memetakan versi → mencari CVE yang cocok (modul fingerprint).',
    'Sembunyikan versi: server_tokens off (nginx) / ServerSignature Off (Apache).', srv.slice(0,80)));
  if (xpb) f.push(mk('disclosure','low','X-Powered-By terekspos: ' + xpb.slice(0,40),
    'Header X-Powered-By menyebut teknologi backend.',
    'Memberi petunjuk stack untuk serangan tertarget.',
    'Nonaktifkan: expose_php=Off (PHP), X-Powered-By dihapus di framework.', xpb.slice(0,80)));
  const gm = /<meta[^>]+name=["']generator["'][^>]+content=["']([^"']+)["']/i.exec(ctx.page.text || '');
  if (gm && /\d+\.\d+/.test(gm[1])) f.push(mk('disclosure','low','Meta generator membocorkan versi: ' + gm[1].slice(0,50),
    'Tag generator menyebut CMS + versi.',
    'Versi CMS lawas = target empuk pencari CVE.',
    'Hapus/samarkan meta generator atau pastikan CMS selalu update.', gm[1].slice(0,80)));
  if (!f.length) f.push(mkInfo('disclosure','Tidak ada info versi terekspos','Server/X-Powered-By/generator bersih.'));
  return f;
}
async function mHtml(ctx) {
  const f = [];
  if (!ctx.page || !ctx.page.text) return [mkInfo('html','Halaman tidak dapat dianalisa','Konten tidak bisa diambil.')];
  const html = ctx.page.text;
  const scripts = extractScripts(html, ctx.origin);
  ctx.scripts = scripts;
  const extNoSri = scripts.filter((s) => /^https?:\/\//i.test(s.src) && !s.integrity && !s.src.startsWith(ctx.origin));
  if (extNoSri.length) f.push(mk('html','medium', extNoSri.length + ' script eksternal tanpa SRI',
    'Script dari CDN tanpa atribut integrity tidak bisa diverifikasi isinya.',
    'Bila CDN terkompromi, pengunjung dimuati kode jahat tanpa disadari pemilik situs.',
    'Tambahkan integrity (SRI hash) + crossorigin="anonymous" pada script eksternal.', extNoSri.slice(0,3).map((s)=>s.src.slice(0,80)).join('\n')));
  if (ctx.isHttps) {
    const mixed = findMixed(html);
    if (mixed.length) f.push(mk('html','medium','Mixed content: ' + mixed.length + ' resource via HTTP',
      'Halaman HTTPS memuat subresource via http://.',
      'Browser memblokir/menandai halaman "tidak aman"; resource HTTP bisa disadap & dimodifikasi.',
      'Ganti semua URL http:// menjadi https:// atau protokol-relatif.', mixed.slice(0,3).join('\n')));
  }
  ctx.libs = extractLibs(scripts);
  if (!f.length) f.push(mkInfo('html','Struktur halaman aman','SRI terpasang / tidak ada mixed content.'));
  return f;
}
async function mJsCve(ctx) {
  const libs = ctx.libs || [];
  if (!libs.length) return [mkInfo('jscve','Tidak ada library terdeteksi','Tidak ditemukan pola versi library umum di HTML.')];
  const f = matchLibVulns(libs);
  const seen = new Set(libs.map((l) => l.lib + ' ' + l.version));
  f.push(mkInfo('jscve','Library terdeteksi: ' + [...seen].join(', '), libs.length + ' pola versi ditemukan.'));
  return f;
}
async function mSecrets(ctx) {
  const f = [];
  const scripts = (ctx.scripts || []).filter((s) => /\.(js)(\?|$)/i.test(s.src)).slice(0, 10);
  if (!scripts.length) return [mkInfo('secrets','Tidak ada file JS untuk dipindai','Tidak ditemukan script eksternal.')];
  let scanned = 0;
  for (const s of scripts) {
    const r = await fetchProxied(s.src, {timeout: 12000});
    if (!r.ok || !r.text || r.text.length > 500 * 1024) continue;
    scanned++;
    f.push(...scanSecretsInText(r.text, s.src.split('/').pop().slice(0, 40)));
    if (f.filter((x) => x.module === 'secrets' && x.severity !== 'info').length >= 5) break;
  }
  if (!f.length) f.push(mkInfo('secrets','Bersih','Dipindai ' + scanned + ' file JS — tidak ada pola secret umum.'));
  return f;
}
async function mPaths(ctx) {
  const f = [];
  const base = await fetchProxied(ctx.origin + '/aqws-probe-' + Math.random().toString(36).slice(2, 10) + '/');
  const baseLen = base.ok ? base.text.length : 0;
  const sameAs404 = (t) => base.ok && Math.abs(t.length - baseLen) < Math.max(200, baseLen * 0.1);
  const get = (p) => fetchProxied(ctx.origin + p, {timeout: 12000});
  // /.git/HEAD
  let r = await get('/.git/HEAD');
  if (r.ok && r.status === 200 && /^ref:\s*refs\//m.test(r.text || ''))
    f.push(mk('paths','critical','Direktori /.git/ terekspos','/.git/HEAD dapat diakses publik (HTTP 200).',
      'Penyerang mengunduh seluruh riwayat Git: source code + credential yang pernah ter-commit.',
      'Blokir di web server, mis. nginx: location ~ /\\.git { deny all; }', r.text.slice(0, 60)));
  // /.env
  r = await get('/.env');
  if (r.ok && r.status === 200 && /=/m.test(r.text || '') && !/<html/i.test(r.text || '') && !sameAs404(r.text || ''))
    f.push(mk('paths','critical','File /.env dapat diakses publik','/.env terbaca (HTTP 200) dan tampak seperti file environment.',
      'Berisi credential: API key, password database, secret aplikasi.',
      'Jangan pernah taruh .env di document root; blokir aksesnya.', 'terdeteksi pola KEY=VALUE'));
  // backup files
  for (const p of ['/backup.zip', '/db.sql', '/database.sql', '/backup.sql', '/wp-config.php.bak']) {
    r = await get(p);
    if (r.ok && r.status === 200 && (r.text || '').length > 500 && !sameAs404(r.text || '')) {
      f.push(mk('paths','high','File backup terekspos: ' + p, p + ' dapat diunduh (HTTP 200, ' + r.text.length + ' bytes).',
        'Backup berisi database/source lengkap — jackpot bagi penyerang.',
        'Hapus file backup dari direktori publik; simpan di luar document root.', p));
      break;
    }
  }
  // robots.txt (+ deep dive)
  r = await get('/robots.txt');
  if (r.ok && r.status === 200 && /disallow/i.test(r.text || '')) {
    const {disallows, sensitive} = parseRobots(r.text);
    f.push(mkInfo('paths','robots.txt ada (' + disallows.length + ' Disallow)','Dianalisa di bawah.'));
    if (sensitive.length) f.push(mk('paths','low','robots.txt membocorkan path sensitif: ' + sensitive.slice(0,4).join(', '),
      'Entri Disallow justru jadi peta bagi penyerang.',
      'Jangan andalkan robots.txt untuk menyembunyikan; proteksi dengan autentikasi.',
      sensitive.slice(0,6).join(', ')));
  } else f.push(mkInfo('paths','robots.txt tidak ada / kosong','-'));
  // sitemap.xml
  r = await get('/sitemap.xml');
  if (r.ok && r.status === 200 && /<url/i.test(r.text || '')) f.push(mkInfo('paths','sitemap.xml ada','Peta situs publik — normal.'));
  // security.txt
  r = await get('/.well-known/security.txt');
  if (!(r.ok && r.status === 200)) f.push(mkInfo('paths','security.txt tidak dipasang','Disarankan: cantumkan kontak pelaporan kerentanan di /.well-known/security.txt.'));
  else f.push(mkInfo('paths','security.txt ada','Bagus — ada jalur pelaporan kerentanan.'));
  if (!f.length) f.push(mkInfo('paths','Tidak ada path sensitif terekspos','Semua probe kembali 404/tidak valid.'));
  return f;
}
async function mFingerprint(ctx) {
  if (!ctx.page) return [mkInfo('fingerprint','Tidak dapat dicek','Halaman tidak bisa diambil.')];
  const techs = detectTech(ctx.page.text, ctx.page.headers);
  if (!techs.length) return [mkInfo('fingerprint','Teknologi tidak teridentifikasi','Tidak ada pola umum terdeteksi.')];
  return [mk('fingerprint','info','Teknologi terdeteksi: ' + techs.map((t) => t.name + (t.version ? ' ' + t.version : '')).join(', '),
    'Pola umum ditemukan di HTML/header.',
    'Informasi konteks untuk menilai temuan lain (mis. versi CMS lawas → cek CVE).',
    'Sembunyikan versi spesifik bila memungkinkan.', techs.map((t)=>t.name).join(', '))];
}

// Modul 13 — Subdomain via Certificate Transparency (100% client-side: crt.sh).
// Respons crt.sh disimpan di ctx.ctRows agar modul cert bisa pakai tanpa fetch 2x.
const CT_FAIL_REASON = 'crt.sh tidak dapat dijangkau setelah 3x percobaan';
async function mCt(ctx) {
  try {
    const r = await fetchRetry('https://crt.sh/?q=%25.' + encodeURIComponent(ctx.host) + '&output=json', {timeout: 12000});
    if (!r.ok) throw new Error('crt.sh HTTP ' + r.status);
    const rows = await r.json();
    ctx.ctRows = Array.isArray(rows) ? rows : [];
    const subs = parseCtJson(ctx.ctRows);
    if (!subs.length) return [mkInfo('ct','Tidak ada subdomain di CT','crt.sh tidak mencatat subdomain untuk ' + ctx.host + '.')];
    return [mk('ct','info','Subdomain terdaftar di Certificate Transparency: ' + subs.length,
      'Ditemukan ' + subs.length + ' nama host unik dari log CT publik' + (subs.length === 50 ? ' (dibatasi 50)' : '') + '.',
      'Subdomain yang terekspos memperluas permukaan serangan — tiap subdomain adalah potensi titik masuk.',
      'Audit subdomain yang tak terpakai; nonaktifkan yang tidak perlu; pantau log CT untuk mendeteksi subdomain liar (subdomain takeover).',
      subs.slice(0, 20).join('\n') + (subs.length > 20 ? '\n…' : ''))];
  } catch (e) {
    ctx.ctRows = null;
    return [mkInfo('ct','Subdomain CT tidak dapat dicek', CT_FAIL_REASON + ' — modul dianggap tidak dapat menilai.')];
  }
}

// Modul 14 — Info sertifikat dari data CT (reuse ctx.ctRows, tanpa fetch tambahan).
async function mCert(ctx) {
  if (!ctx.ctRows || !ctx.ctRows.length)
    return [mkInfo('cert','Sertifikat tidak dapat dicek','Tidak ada data sertifikat (crt.sh tidak dapat dijangkau) — modul dianggap tidak dapat menilai.')];
  const c = certExpiry(ctx.ctRows);
  if (!c) return [mkInfo('cert','Sertifikat tidak dapat dicek','Data crt.sh tidak memuat tanggal kedaluwarsa.')];
  const dateStr = String(c.not_after).slice(0, 10);
  const issuer = c.issuer_name || 'tidak diketahui';
  const days = Math.floor(c.expiry_days);
  if (c.expiry_days < 0) return [mk('cert','critical','Sertifikat kedaluwarsa',
    'Sertifikat domain ini kedaluwarsa pada ' + dateStr + ' (' + Math.abs(days) + ' hari lalu). Penerbit: ' + issuer + '.',
    'Pengunjung melihat peringatan browser "koneksi tidak aman" — lalu lintas bisa disadap tanpa terdeteksi.',
    'Perbarui sertifikat SEGERA dan aktifkan auto-renew (mis. Let\'s Encrypt + certbot).', 'not_after: ' + c.not_after)];
  if (c.expiry_days < 30) return [mk('cert','high','Sertifikat kedaluwarsa <30 hari',
    'Sertifikat valid sampai ' + dateStr + ' (' + days + ' hari lagi). Penerbit: ' + issuer + '.',
    'Kedaluwarsa mendadak = situs menampilkan peringatan browser, pengunjung kabur dan trust jatuh.',
    'Jadwalkan perpanjangan sekarang; pasang monitoring kedaluwarsa sertifikat.', 'not_after: ' + c.not_after)];
  return [mkInfo('cert','Sertifikat valid s/d ' + dateStr, 'Berlaku ' + days + ' hari lagi. Penerbit: ' + issuer + '.')];
}

// Modul 15 — Arsip Wayback Machine (100% client-side: CDX API web.archive.org).
const WAYBACK_FAIL_REASON = 'web.archive.org tidak dapat dijangkau setelah 3x percobaan';
async function mWayback(ctx) {
  try {
    const r = await fetchRetry('http://web.archive.org/cdx/search/cdx?url=' + encodeURIComponent(ctx.host) + '/*&output=json&limit=50&collapse=urlkey&filter=statuscode:200', {timeout: 12000});
    if (!r.ok) throw new Error('wayback HTTP ' + r.status);
    const p = parseWayback(await r.json());
    if (p.sensitive.length) return [mk('wayback','medium','Jejak sensitif di arsip publik (' + p.sensitive.length + ')',
      'Ditemukan URL berpola sensitif di arsip Wayback Machine: ' + p.sensitive.map((u) => u.slice(0, 70)).join(', ') + '.',
      'Arsip publik menyimpan salinan halaman/file yang mungkin sudah dihapus dari server — termasuk yang mengandung data sensitif.',
      'Pastikan file sensitif tidak terekspos; ajukan penghapusan ke web.archive.org bila perlu.', p.sensitive.join('\n'))];
    return [mkInfo('wayback','Arsip Wayback: ' + p.count + ' snapshot','Tidak ditemukan pola URL sensitif di arsip publik. (Contoh: ' + (p.sample[0] ? p.sample[0].slice(0, 60) : '-') + ')')];
  } catch (e) {
    return [mkInfo('wayback','Arsip Wayback tidak dapat dicek', WAYBACK_FAIL_REASON + ' — modul dianggap tidak dapat menilai.')];
  }
}

// 2 limitasi yang memang tidak bisa diakali dari browser — ditandai jujur, bukan di-skip.
const UNSUPPORTED = [
  {id:'hsts-preload', name:'Status HSTS Preload', reason:'API hstspreload.org menolak CORS — tidak dapat dicek dari browser.'},
  {id:'tls', name:'Versi TLS & cipher suite', reason:'Browser tidak mengekspos versi TLS & cipher suite ke JavaScript.'},
];

const MODULES = [
  {id:'headers', name:'Security Headers', run:mHeaders},
  {id:'cookies', name:'Cookie Security', run:mCookies},
  {id:'cors', name:'Konfigurasi CORS', run:mCors},
  {id:'redirect', name:'Redirect HTTP→HTTPS', run:mRedirect},
  {id:'disclosure', name:'Information Disclosure', run:mDisclosure},
  {id:'dns', name:'DNS & Email Security', run:mDnsEmail},
  {id:'rdap', name:'Umur & Kedaluwarsa Domain', run:mRdap},
  {id:'html', name:'Analisa Halaman (SRI/Mixed)', run:mHtml},
  {id:'jscve', name:'CVE Library JavaScript', run:mJsCve},
  {id:'secrets', name:'Secrets di JavaScript', run:mSecrets},
  {id:'paths', name:'Path & File Terekspos', run:mPaths},
  {id:'fingerprint', name:'Fingerprint Teknologi', run:mFingerprint},
  {id:'ct', name:'Subdomain (Certificate Transparency)', run:mCt},
  {id:'cert', name:'Info Sertifikat', run:mCert},
  {id:'wayback', name:'Arsip Wayback Machine', run:mWayback},
];

function mk(module, severity, title, description, impact, remediation, evidence) {
  return {module, severity, title, description, impact, remediation, evidence: evidence || ''};
}
function mkInfo(module, title, description) {
  return {module, severity:'info', title, description, impact:'-', remediation:'-', evidence:''};
}

async function runScan(target, onProg) {
  const ctx = {host: target.host, origin: target.origin, isHttps: target.origin.startsWith('https'), page: null, libs: [], scripts: [], cookieNames: [], ctRows: null, findings: []};
  onProg('fetch', 'run');
  const pg = await fetchProxied(target.origin + '/');
  if (pg.ok) ctx.page = pg;
  onProg('fetch', 'done');
  for (const m of MODULES) {
    onProg(m.id, 'run');
    try {
      const f = await m.run(ctx);
      ctx.findings.push(...(f || []));
    } catch (e) {
      ctx.findings.push(mkInfo(m.id, 'Modul "' + m.name + '" gagal', 'Error: ' + String((e && e.message) || e).slice(0, 120)));
    }
    onProg(m.id, 'done');
  }
  return ctx;
}

/* ================= UI ================= */
const SEV_STYLE = {
  critical: {c:'#ef4444', label:'Critical'},
  high: {c:'#f97316', label:'High'},
  medium: {c:'#eab308', label:'Medium'},
  low: {c:'#38bdf8', label:'Low'},
  info: {c:'#a1a1aa', label:'Info'},
};
const GRADE_C = {'A+':'#22c55e','A':'#22c55e','B':'#38bdf8','C':'#eab308','D':'#f97316','F':'#ef4444'};

function loadHist() { try { return JSON.parse(localStorage.getItem(HIST_KEY) || '[]'); } catch (e) { return []; } }
function saveHist(entry) {
  try {
    const h = loadHist();
    h.unshift(entry);
    localStorage.setItem(HIST_KEY, JSON.stringify(h.slice(0, 20)));
  } catch (e) {}
}
function mdSummary(url, res) {
  const L = [];
  L.push('# Hasil Scan: ' + url);
  L.push('');
  L.push(`**Grade: ${res.grade} (${res.score}/100)** — 🔴${res.counts.critical} 🟠${res.counts.high} 🟡${res.counts.medium} 🔵${res.counts.low} ⚪${res.counts.info}`);
  L.push('');
  for (const f of res.findings.filter((x) => x.severity !== 'info')) {
    L.push(`## [${f.severity.toUpperCase()}] ${f.title}`);
    L.push('**Temuan:** ' + f.description);
    L.push('**Skenario:** ' + f.impact);
    L.push('**Perbaikan:** ' + f.remediation);
    if (f.evidence) L.push('**Bukti:** `' + f.evidence.slice(0, 200) + '`');
    L.push('');
  }
  L.push('_Dipindai via Website Security Scanner (adip-tools) — 100% client-side, 15 modul aktif + 2 limitasi ditandai jujur._');
  return L.join('\n');
}

export function render(root) {
  const box = T.out();
  let lastCooldownUntil = 0, scanning = false, curFilter = 'all', lastRes = null, lastUrl = '';

  // ---- header ----
  function footerInfoText() {
    return '15 modul aktif • 2 limitasi ditandai jujur (HSTS preload, versi TLS & cipher) — tanpa fake pass';
  }
  T.show(box,
    '<div style="margin-bottom:14px">' +
    '<div style="font-size:20px;font-weight:700;margin-bottom:4px">🛡️ Website Security Scanner</div>' +
    '<div class="dim" style="font-size:13px;line-height:1.6">Pindai keamanan website: security header, DNS/email, sertifikat, secrets & file terekspos. ' +
    '15 modul jalan 100% di browser <span class="dim">(tanpa data dikirim ke server kami)</span>; 2 limitasi (HSTS preload, versi TLS & cipher) ditandai jujur.</div>' +
    '<div id="aqws-modinfo" style="margin-top:8px;font-size:11px" class="dim">' + footerInfoText() + '</div></div>');

  // ---- form ----
  const inp = T.input('https://contoh.com', 'URL website yang mau dipindai');
  inp.style.cssText += ';font-family:monospace';
  inp.setAttribute('inputmode', 'url'); inp.setAttribute('autocomplete', 'url');
  const btnScan = T.btn('🔍 Pindai Sekarang', startScan, true);
  const cdNote = T.el('<div class="dim" style="font-size:11px;margin-top:6px">Scan bisa 30–90 detik tergantung situs. Cooldown 30 detik antar scan.</div>');
  const formRow = T.el('<div style="display:flex;gap:8px;margin-bottom:4px"></div>');
  inp.style.flex = '1';
  formRow.appendChild(inp); formRow.appendChild(btnScan);
  box.appendChild(formRow); box.appendChild(cdNote);

  // ---- progress ----
  const progBox = T.el('<div style="margin:14px 0;display:none"></div>');
  box.appendChild(progBox);
  const progRows = {};
  function buildProgress() {
    progBox.style.display = 'block';
    progBox.innerHTML = '';
    const mk = (id, name, unsupported) => {
      const r = T.el('<div style="font-size:12px;padding:5px 0;border-bottom:1px solid #ffffff08;display:flex;justify-content:space-between"><span>' + T.esc(name) + '</span><span data-st>⏳</span></div>');
      progBox.appendChild(r);
      progRows[id] = {row: r, st: r.querySelector('[data-st]'), unsupported: !!unsupported};
      if (unsupported) { progRows[id].st.textContent = '🚫'; progRows[id].st.title = 'tidak dapat dicek dari browser'; }
    };
    mk('fetch', 'Mengambil halaman utama');
    MODULES.forEach((m) => mk(m.id, m.name));
    UNSUPPORTED.forEach((u) => mk('u_' + u.id, u.name + ' — tidak dapat dicek dari browser', true));
  }
  function setProg(id, st) {
    const p = progRows[id]; if (!p || p.unsupported) return;
    p.st.textContent = st === 'run' ? '🔄' : '✅';
  }

  // ---- hasil ----
  const resBox = T.el('<div style="margin-top:6px"></div>');
  box.appendChild(resBox);

  // ---- riwayat ----
  const histBox = T.el('<div style="margin-top:18px"></div>');
  box.appendChild(histBox);
  function renderHist() {
    const h = loadHist();
    if (!h.length) { histBox.innerHTML = ''; return; }
    let html = '<div style="font-size:13px;font-weight:700;margin-bottom:8px">🕘 Riwayat scan (perangkat ini)</div>';
    html += h.slice(0, 8).map((e, i) =>
      '<div style="font-size:12px;padding:6px 0;border-bottom:1px solid #ffffff08;display:flex;justify-content:space-between;gap:8px">' +
      '<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:60%">' + T.esc(e.url) + '</span>' +
      '<span><b style="color:' + (GRADE_C[e.grade] || '#fff') + '">' + T.esc(e.grade) + '</b> <span class="dim">' + T.esc(e.date) + '</span></span></div>'
    ).join('');
    histBox.innerHTML = html;
  }
  renderHist();

  async function startScan() {
    if (scanning) return;
    let target;
    try { target = normalizeTarget(inp.value); }
    catch (e) { T.show(box, '<div style="color:#f87171;font-size:13px;margin:8px 0">❌ ' + T.esc(e.message) + '</div>'); return; }
    const now = Date.now();
    if (now < lastCooldownUntil) {
      T.show(box, '<div style="color:#eab308;font-size:13px;margin:8px 0">⏳ Tunggu ' + Math.ceil((lastCooldownUntil - now) / 1000) + ' detik sebelum scan lagi.</div>');
      return;
    }
    scanning = true; btnScan.disabled = true; btnScan.textContent = '⏳ Memindai…';
    resBox.innerHTML = '';
    const fi = box.querySelector('#aqws-modinfo');
    if (fi) fi.textContent = footerInfoText();
    buildProgress();
    try {
      const ctx = await runScan(target, setProg);
      const res = calcScore(ctx.findings);
      res.findings = ctx.findings;
      lastRes = res; lastUrl = target.origin;
      renderResult(target.origin, res);
      // diff vs riwayat
      const prev = loadHist().find((e) => e.url === target.origin);
      saveHist({url: target.origin, date: new Date().toLocaleString('id-ID'), score: res.score, grade: res.grade,
        findings: ctx.findings.map((f) => ({severity: f.severity, title: f.title}))});
      renderHist();
      if (prev) showDiff(prev, res);
      lastCooldownUntil = Date.now() + COOLDOWN_MS;
    } catch (e) {
      T.show(resBox, '<div style="color:#f87171;font-size:13px">❌ Scan gagal: ' + T.esc(String((e && e.message) || e).slice(0, 200)) + '</div>');
    }
    scanning = false; btnScan.disabled = false; btnScan.textContent = '🔍 Pindai Sekarang';
  }

  function showDiff(prev, res) {
    const d = res.score - prev.score;
    const arrow = d > 0 ? '📈 naik' : d < 0 ? '📉 turun' : '➖ sama';
    const prevTitles = new Set((prev.findings || []).map((f) => f.severity + '|' + f.title));
    const curTitles = new Set(res.findings.map((f) => f.severity + '|' + f.title));
    const baru = res.findings.filter((f) => f.severity !== 'info' && !prevTitles.has(f.severity + '|' + f.title));
    const hilang = (prev.findings || []).filter((f) => f.severity !== 'info' && !curTitles.has(f.severity + '|' + f.title));
    let html = '<div style="font-size:12px;border:1px solid #38bdf840;background:rgba(56,189,248,.06);border-radius:10px;padding:10px 12px;margin-bottom:12px">' +
      '🔄 vs scan sebelumnya (' + T.esc(prev.date) + ', grade ' + T.esc(prev.grade) + '): <b>' + arrow + ' ' + Math.abs(d) + ' poin</b>';
    if (baru.length) html += '<br>🆕 Temuan baru: ' + baru.map((f) => T.esc(f.title)).join('; ').slice(0, 200);
    if (hilang.length) html += '<br>✅ Sudah hilang: ' + hilang.map((f) => T.esc(f.title)).join('; ').slice(0, 200);
    html += '</div>';
    const d_ = T.el(html); resBox.prepend(d_);
  }

  function renderResult(url, res) {
    curFilter = 'all';
    const gc = GRADE_C[res.grade] || '#fff';
    let html =
      '<div style="border:1px solid #ffffff20;border-radius:14px;padding:16px;background:#18181b;margin-bottom:12px;text-align:center">' +
      '<div class="dim" style="font-size:11px;word-break:break-all">' + T.esc(url) + '</div>' +
      '<div style="font-size:56px;font-weight:800;color:' + gc + ';line-height:1.1">' + res.grade + '</div>' +
      '<div style="font-size:13px" class="dim">skor ' + res.score + '/100</div>' +
      '<div style="display:flex;gap:6px;justify-content:center;margin-top:10px;flex-wrap:wrap">' +
      ['critical','high','medium','low','info'].map((s) =>
        '<span style="font-size:11px;border:1px solid ' + SEV_STYLE[s].c + '55;border-radius:20px;padding:3px 10px;color:' + SEV_STYLE[s].c + '">' +
        SEV_STYLE[s].label + ' ' + res.counts[s] + '</span>').join('') +
      '</div></div>';

    // filter
    html += '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px" id="aqws-filter">';
    html += ['all','critical','high','medium','low','info'].map((s) =>
      '<button data-f="' + s + '" style="font-size:11px;border-radius:16px;padding:4px 12px;cursor:pointer;border:1px solid ' +
      (s === 'all' ? '#38bdf8' : '#ffffff25') + ';background:' + (s === 'all' ? 'rgba(56,189,248,.12)' : 'transparent') +
      ';color:#e4e4e7">' + (s === 'all' ? 'Semua' : SEV_STYLE[s].label) + '</button>').join('');
    html += '</div><div id="aqws-list"></div>';

    // keterbatasan jujur: 2 limitasi yang memang tidak bisa diakali dari browser
    html += '<div style="margin-top:14px;font-size:12px;border:1px dashed #ffffff25;border-radius:10px;padding:10px 12px">' +
      '<div style="font-weight:700;margin-bottom:6px">🚫 Tidak dapat dicek dari browser (jujur, bukan di-skip diam-diam)</div>' +
      UNSUPPORTED.map((u) => '<div style="margin:3px 0" class="dim">• <b>' + T.esc(u.name) + ':</b> ' + T.esc(u.reason) + '</div>').join('') + '</div>';

    // export
    html += '<div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap" id="aqws-export"></div>';

    resBox.innerHTML = html;
    const listEl = resBox.querySelector('#aqws-list');
    const drawList = () => {
      const items = res.findings.filter((f) => curFilter === 'all' || f.severity === curFilter);
      if (!items.length) { listEl.innerHTML = '<div class="dim" style="font-size:12px;padding:8px">Tidak ada temuan pada filter ini. 👌</div>'; return; }
      listEl.innerHTML = items.map((f, i) => {
        const st = SEV_STYLE[f.severity] || SEV_STYLE.info;
        return '<details style="border:1px solid #ffffff15;border-radius:10px;margin-bottom:8px;background:#101013">' +
          '<summary style="padding:10px 12px;cursor:pointer;font-size:13px;list-style:none;display:flex;gap:8px;align-items:flex-start">' +
          '<span style="flex-shrink:0;margin-top:1px;width:8px;height:8px;border-radius:50%;background:' + st.c + '"></span>' +
          '<span><b style="color:' + st.c + ';font-size:11px">[' + st.label.toUpperCase() + ']</b> ' + T.esc(f.title) + '</span></summary>' +
          '<div style="padding:0 12px 12px 28px;font-size:12px;line-height:1.65">' +
          '<div style="margin-bottom:6px"><b>🔍 Temuan:</b> <span class="dim">' + T.esc(f.description) + '</span></div>' +
          (f.impact && f.impact !== '-' ? '<div style="margin-bottom:6px"><b>⚠️ Skenario penyalahgunaan:</b> <span class="dim">' + T.esc(f.impact) + '</span></div>' : '') +
          (f.remediation && f.remediation !== '-' ? '<div style="margin-bottom:6px"><b>🔧 Cara memperbaiki:</b> <span class="dim">' + T.esc(f.remediation) + '</span></div>' : '') +
          (f.evidence ? '<div><b>🧾 Bukti:</b><br><code style="font-size:11px;word-break:break-all;color:#a1a1aa">' + T.esc(f.evidence) + '</code></div>' : '') +
          '</div></details>';
      }).join('');
    };
    drawList();
    resBox.querySelectorAll('#aqws-filter button').forEach((b) => {
      b.onclick = () => {
        curFilter = b.getAttribute('data-f');
        resBox.querySelectorAll('#aqws-filter button').forEach((x) => {
          const on = x.getAttribute('data-f') === curFilter;
          x.style.borderColor = on ? '#38bdf8' : '#ffffff25';
          x.style.background = on ? 'rgba(56,189,248,.12)' : 'transparent';
        });
        drawList();
      };
    });
    const exEl = resBox.querySelector('#aqws-export');
    const bCopy = T.btn('📋 Salin Ringkasan', () => {
      const md = mdSummary(url, res);
      (navigator.clipboard ? navigator.clipboard.writeText(md) : Promise.reject()).then(
        () => T.show(box, '<div style="color:#4ade80;font-size:12px">✅ Ringkasan tersalin.</div>'),
        () => T.show(box, '<div style="color:#f87171;font-size:12px">❌ Gagal menyalin.</div>'));
    }, false);
    const bJson = T.btn('⬇️ Unduh JSON', () => {
      const blob = new Blob([JSON.stringify({url, date: new Date().toISOString(), score: res.score, grade: res.grade, findings: res.findings}, null, 2)], {type: 'application/json'});
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'scan-' + url.replace(/[^a-z0-9]/gi, '_') + '.json';
      a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    }, false);
    exEl.appendChild(bCopy); exEl.appendChild(bJson);
  }

  root.appendChild(box);
  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') startScan(); });
}
