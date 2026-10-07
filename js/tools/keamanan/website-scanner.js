/* Website Security Scanner — 100% client-side, tanpa backend.
 * Cara kerja: homepage target diambil via proxy CORS (test.cors.workers.dev,
 * fallback allorigins), DNS/email via DoH dns.google, umur domain via RDAP,
 * subdomain + info sertifikat via crt.sh, arsip via web.archive.org.
 * 25 modul jalan langsung di browser; 2 limitasi yang memang tak bisa
 * diakali dari browser (hsts-preload: API menolak CORS; TLS: browser tidak
 * mengekspos versi/cipher ke JS) ditandai JUJUR — tidak ada fake pass.
 * Fungsi murni di-export agar bisa di-unit-test via node.
 */
import { h as T, utils } from '../../core.js?v=6.9.5';

export const meta = {id:"website-scanner", name:"Website Security Scanner", cat:"keamanan", icon:"🛡️", desc:"Pindai keamanan website: header, DNS, email, TLS, secrets & exposure. 25 modul browser + 2 ditandai jujur.", keywords:"security,scanner,keamanan,website,headers,dns,spf,dmarc,scan"};

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
  const hasRua = /rua=/i.test(rec);
  if (pol === 'none') return {status:'monitor', sev:'medium', detail:'DMARC p=none — hanya monitoring, email palsu tidak ditolak', hasRua};
  if (pol === 'quarantine' || pol === 'reject') return {status:'ok', detail:'p=' + pol, hasRua};
  return {status:'unknown', sev:'low', detail:rec, hasRua};
}

// Hitung mekanisme SPF yang memicu DNS lookup (batas RFC 7208: 10).
// "a" dikecualikan dari awalan "-all"/"+all" via (?!ll) agar tidak salah hitung.
export function countSpfLookups(rec) {
  const m = String(rec || '').match(/\b(include:[^\s]+|a(?!ll)(?::[^\s]+)?|mx(?::[^\s]+)?|ptr(?::[^\s]+)?|exists:[^\s]+|redirect=[^\s]+)/gi);
  return m ? m.length : 0;
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
  {lib:'lodash', max:'4.17.11', cve:'CVE-2019-10744', sev:'medium', note:'prototype pollution'},
  {lib:'moment', max:'2.29.4', cve:'CVE-2022-31129', sev:'high', note:'ReDoS parsing tanggal'},
  {lib:'axios', max:'1.6.0', cve:'CVE-2023-45857', sev:'high', note:'CSRF bypass via XSRF-TOKEN'},
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
  if (has('content-security-policy')) {
    f.push(...cspDeepFindings(csp));
    if (!/report-uri|report-to/i.test(csp)) f.push({module:'headers', severity:'info',
      title:'CSP tanpa pelaporan',
      description:'CSP aktif tapi tanpa report-uri/report-to — pelanggaran kebijakan tidak terpantau.',
      impact:'Upaya injeksi script (mis. XSS) terjadi tanpa jejak; pemilik situs tidak tahu sedang diserang.',
      remediation:'Tambahkan report-uri atau report-to ke endpoint monitoring CSP.', evidence:''});
    if (!/upgrade-insecure-requests/i.test(csp)) f.push({module:'headers', severity:'low',
      title:'CSP tanpa upgrade-insecure-requests',
      description:'CSP aktif tapi tidak memaksa upgrade subresource HTTP ke HTTPS.',
      impact:'Subresource via HTTP tetap bisa dimuat — membuka celah mixed content.',
      remediation:"Tambahkan directive 'upgrade-insecure-requests' ke CSP.", evidence:''});
  }
  if (has('strict-transport-security')) f.push(...hstsDeepFindings(h['strict-transport-security']));
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
  // Tandai cookie yang namanya mirip sesi — prioritas pembajakan lebih tinggi.
  const SESS_LIKE = /sess|session|sid|token|auth|login/i;
  const markSess = (n) => SESS_LIKE.test(n) ? n + ' 🎯(mirip sesi)' : n;
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
    title:'Cookie tanpa flag Secure: ' + noSecure.map(markSess).join(', '),
    description:'Cookie dikirim juga lewat HTTP polos.',
    impact:'Di jaringan tidak aman (WiFi publik), cookie sesi bisa disadap dan dibajak.',
    remediation:'Tambahkan flag Secure pada semua cookie sesi.', evidence:noSecure.map(markSess).join(', ')});
  if (noHttpOnly.length) f.push({module:'cookies', severity:'medium',
    title:'Cookie tanpa HttpOnly: ' + noHttpOnly.map(markSess).join(', '),
    description:'Cookie bisa dibaca JavaScript.',
    impact:'Bila ada celah XSS, penyerang mencuri cookie sesi langsung via document.cookie.',
    remediation:'Tambahkan flag HttpOnly pada cookie sesi.', evidence:noHttpOnly.map(markSess).join(', ')});
  if (noSameSite.length) f.push({module:'cookies', severity:'low',
    title:'Cookie tanpa atribut SameSite: ' + noSameSite.join(', '),
    description:'Mengandalkan default browser.',
    impact:'Risiko CSRF kecil pada browser lama; browser modern default ke Lax.',
    remediation:'Set eksplisit SameSite=Lax.', evidence:noSameSite.join(', ')});
  f.push(...cookiePrefixFindings(setCookies));
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
  const out = new Map(); // url -> active(bool)
  const re = /<(script|iframe|link|embed|object|img|audio|video|source|track)\b[^>]*>/gi;
  let m;
  while ((m = re.exec(html || ''))) {
    const tag = m[0], name = m[1].toLowerCase();
    const isLinkCss = name === 'link' && /rel\s*=\s*["']stylesheet["']/i.test(tag);
    const active = name === 'script' || name === 'iframe' || name === 'embed' || name === 'object' || isLinkCss;
    const am = /(?:src|href)\s*=\s*["'](http:\/\/[^"']+)["']/i.exec(tag);
    if (!am) continue;
    const url = am[1].slice(0, 120);
    if (!out.has(url) || active) out.set(url, active);
  }
  return [...out.entries()].slice(0, 20).map(([url, active]) => ({url, active}));
}
const TECH_SIGS = [
  {name:'WordPress', res:[/wp-content\//i, /wp-includes\//i], ver:/\/wp-includes\/js\/[^"']*?(\d+\.\d+)/i},
  {name:'Next.js', res:[/__NEXT_DATA__/i, /_next\/static\//i]},
  {name:'Laravel', res:[/csrf-token/i, /laravel/i]},
  {name:'Django', res:[/csrftoken/i, /django/i]},
  {name:'React', res:[/react-dom/i, /data-reactroot/i]},
  {name:'Vue', res:[/vue\.js/i, /data-v-[a-f0-9]+/i]},
  {name:'jQuery', res:[/jquery/i], ver:/jquery[.-](\d+\.\d+\.\d+)/i},
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
  {re:/sk_live_[0-9A-Za-z]{24,}/g, type:'Stripe Secret Key (live)', sev:'critical'},
  {re:/(?:ghp|gho)_[0-9A-Za-z]{36}/g, type:'GitHub Token', sev:'critical'},
  {re:/discord\.com\/api\/webhooks\/\d+\/[A-Za-z0-9_-]+/g, type:'Discord Webhook', sev:'high'},
  {re:/\b\d{6,12}:[A-Za-z0-9_-]{35}\b/g, type:'Telegram Bot Token', sev:'high'},
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
/* ============ BLOK "ATTACKER" (edukatif-defensif) ============
 * attackerFor(module, title) → {technique, tools:[], how} atau null.
 * null = temuan negatif/info-kosong (tidak perlu blok attacker).
 * Penjelasan konseptual saja — bukan tutorial eksploitasi.
 */
const ATTACKER_NEG_RE = /^\s*(tidak (ada|dapat|ditemukan|terdeteksi)|bukan )/i;
// {mod, re, technique, tools, how} — re:null = fallback generik per module.
const ATTACKER_TABLE = [
  {mod:'headers', re:/content-security-policy/i, technique:'XSS (cross-site scripting)', tools:['Burp Suite','OWASP ZAP','dalfox'], how:'Attacker menyuntikkan skrip jahat ke halaman; tanpa CSP, browser mengeksekusinya tanpa batasan.'},
  {mod:'headers', re:/hsts/i, technique:'SSL stripping (downgrade attack)', tools:['mitmproxy','Bettercap'], how:'Di jaringan publik attacker memaksa koneksi turun ke HTTP lalu mengintip lalu lintas.'},
  {mod:'headers', re:/clickjacking/i, technique:'Clickjacking / UI redressing', tools:['Burp Suite (Clickbandit)'], how:'Halaman asli dibingkai di situs jebakan; klik korban diarahkan ke tombol berbahaya.'},
  {mod:'headers', re:/nosniff/i, technique:'MIME-sniffing attack', tools:['Burp Suite'], how:'File upload berisi skrip tersembunyi bisa dieksekusi karena browser menebak tipe konten.'},
  {mod:'headers', re:/referrer-policy/i, technique:'Kebocoran data via Referer', tools:[], how:'URL berisi token/ID bocor ke pihak ketiga lewat header Referer.'},
  {mod:'headers', re:null, technique:'Header reconnaissance', tools:['Nikto'], how:'Header dipindai untuk memetakan pertahanan situs sebelum serangan lanjutan.'},
  {mod:'cookies', re:/samesite=none/i, technique:'Session hijacking lintas-situs', tools:['Burp Suite'], how:'Cookie sesi dikirim ke situs lain sehingga bisa dipanen lewat situs jebakan.'},
  {mod:'cookies', re:/tanpa flag secure/i, technique:'Session hijacking (network sniffing)', tools:['Wireshark','mitmproxy'], how:'Cookie disadap di WiFi publik karena ikut terkirim lewat HTTP polos.'},
  {mod:'cookies', re:/httponly/i, technique:'Pencurian sesi via XSS', tools:['BeEF','dalfox'], how:'Skrip jahat membaca document.cookie langsung bila ada celah XSS.'},
  {mod:'cookies', re:/samesite/i, technique:'CSRF (Cross-Site Request Forgery)', tools:['Burp Suite'], how:'Browser otomatis mengirim cookie ke request palsu dari situs lain.'},
  {mod:'cookies', re:null, technique:'Cookie analysis', tools:['Burp Suite'], how:'Cookie dianalisa untuk mencari sesi yang bisa dibajak.'},
  {mod:'cors', re:null, technique:'Cross-origin data theft', tools:['Burp Suite'], how:'Situs jahat yang diizinkan dapat membaca respons API korban dari browser korban.'},
  {mod:'redirect', re:null, technique:'SSL stripping', tools:['mitmproxy','sslstrip'], how:'Korban diarahkan ke versi HTTP situs; kredensial terlihat jelas.'},
  {mod:'disclosure', re:null, technique:'Targeted CVE search', tools:['nmap -sV','whatweb','searchsploit'], how:'Versi server dicocokkan ke database CVE publik untuk serangan tertarget.'},
  {mod:'dns', re:/\bspf\b/i, technique:'Email spoofing / phishing', tools:['GoPhish'], how:'Email palsu dikirim mengatasnamakan domain; penerima tak bisa membedakan.'},
  {mod:'dns', re:/\bdmarc\b/i, technique:'Email spoofing / phishing', tools:['GoPhish'], how:'Tanpa DMARC, email spoofing yang lolos SPF/DKIM tetap masuk inbox.'},
  {mod:'dns', re:/lookup/i, technique:'SPF permerror', tools:[], how:'SPF rusak = proteksi email gagal total (fail-open).'},
  {mod:'dns', re:/\bdkim\b/i, technique:'Email spoofing', tools:['GoPhish'], how:'Tanpa tanda tangan DKIM, email mudah dipalsukan.'},
  {mod:'dns', re:/\bcaa\b/i, technique:'Rogue certificate issuance', tools:[], how:'Sertifikat bisa diterbitkan dari CA yang kurang ketat.'},
  {mod:'dns', re:/mta-sts/i, technique:'STARTTLS stripping', tools:['mitmproxy'], how:'Koneksi email dipaksa tanpa TLS lalu disadap.'},
  {mod:'dns', re:/dnssec/i, technique:'DNS spoofing / cache poisoning', tools:[], how:'Respons DNS palsu mengarahkan korban ke server attacker.'},
  {mod:'dns', re:null, technique:'Email & DNS reconnaissance', tools:['dig'], how:'Infrastruktur email/DNS dipetakan untuk serangan lanjutan.'},
  {mod:'rdap', re:/baru/i, technique:'Phishing domain', tools:['GoPhish'], how:'Domain berumur hitungan hari dipakai untuk situs tipu-tipu sebelum diblokir.'},
  {mod:'rdap', re:/kedaluwarsa/i, technique:'Domain takeover', tools:[], how:'Domain kedaluwarsa didaftarkan ulang lalu dipakai untuk phishing.'},
  {mod:'rdap', re:null, technique:'OSINT domain', tools:[], how:'Data pendaftaran dipakai untuk profil target.'},
  {mod:'html', re:/\bsri\b/i, technique:'Supply-chain attack via CDN', tools:[], how:'Bila CDN terkompromi, semua pengunjung dimuati kode jahat tanpa pemilik sadar.'},
  {mod:'html', re:/mixed content/i, technique:'MITM content injection', tools:['mitmproxy'], how:'Resource HTTP disadap dan dimodifikasi di tengah jalan.'},
  {mod:'jscve', re:null, technique:'Known-CVE exploitation', tools:['searchsploit','Metasploit'], how:'Versi lawas dicocokkan ke CVE publik lalu dieksploitasi dengan tool siap pakai.'},
  {mod:'secrets', re:null, technique:'Secret scanning', tools:['trufflehog','gitleaks'], how:'File JS publik dipindai pola kredensial; yang ketemu langsung disalahgunakan.'},
  {mod:'paths', re:/\.git/i, technique:'Repository reconstruction', tools:['GitHack','git-dumper'], how:'Objek git publik disalin lalu direkonstruksi menjadi source + history commit.'},
  {mod:'paths', re:/\.env/i, technique:'Credential harvesting', tools:['Nuclei','Nikto'], how:'File environment dipanen untuk API key dan password database.'},
  {mod:'paths', re:/backup/i, technique:'Backup file discovery', tools:['gobuster','feroxbuster'], how:'File backup berisi database/source lengkap.'},
  {mod:'paths', re:/robots/i, technique:'Forced browsing', tools:['gobuster'], how:'Entri Disallow justru menjadi peta jalan.'},
  {mod:'paths', re:null, technique:'Content discovery / forced browsing', tools:['gobuster','feroxbuster','dirb'], how:'Path tersembunyi ditebak sistematis dengan wordlist.'},
  {mod:'fingerprint', re:null, technique:'Technology fingerprinting', tools:['whatweb','Wappalyzer'], how:'Stack teknologi dipetakan untuk memilih serangan yang cocok.'},
  {mod:'ct', re:null, technique:'Attack surface mapping', tools:['subfinder','amass'], how:'Subdomain didaftar dari log CT publik; tiap subdomain potensi pintu masuk.'},
  {mod:'cert', re:null, technique:'Man-in-the-middle', tools:['mitmproxy'], how:'Sertifikat mati memicu peringatan browser; attacker menyela dengan sertifikat palsu.'},
  {mod:'wayback', re:null, technique:'Historical data mining', tools:[], how:'Arsip publik digali untuk file/data sensitif yang sudah dihapus dari server.'},
  {mod:'dirlist', re:null, technique:'Directory reconnaissance', tools:['gobuster','dirsearch'], how:'Listing direktori membocorkan struktur dan nama file sensitif.'},
  {mod:'takeover', re:null, technique:'Subdomain takeover', tools:['subjack','SubOver'], how:'Subdomain yang CNAME-nya mengarah ke layanan mati didaftarkan ulang attacker lalu dipakai untuk phishing.'},
  {mod:'wp', re:/user enumeration/i, technique:'WordPress user enumeration', tools:['wpscan'], how:'Daftar username dipanen dari REST API untuk mempercepat brute-force login.'},
  {mod:'wp', re:/xmlrpc/i, technique:'XML-RPC abuse', tools:['wpscan'], how:'xmlrpc.php dipakai untuk brute-force terdistribusi dan serangan pingback DDoS.'},
  {mod:'wp', re:/readme/i, technique:'WordPress version disclosure', tools:['wpscan','whatweb'], how:'Versi WordPress dicocokkan ke database CVE publik.'},
  {mod:'wp', re:null, technique:'WordPress reconnaissance', tools:['wpscan'], how:'Endpoint khas WordPress dipetakan untuk memilih serangan yang cocok.'},
  {mod:'sourcemap', re:null, technique:'Source code disclosure', tools:['Burp Suite'], how:'Source map membocorkan source asli termasuk komentar dan kadang secret.'},
  {mod:'login', re:/via http/i, technique:'Credential interception', tools:['mitmproxy','Wireshark'], how:'Kredensial terkirim tanpa enkripsi dan disadap di jaringan.'},
  {mod:'login', re:/csrf/i, technique:'CSRF (Cross-Site Request Forgery)', tools:['Burp Suite'], how:'Form tanpa token CSRF bisa di-submit paksa dari situs jahat.'},
  {mod:'login', re:null, technique:'Login form analysis', tools:['Burp Suite'], how:'Form login dianalisa untuk serangan brute-force dan CSRF.'},
  {mod:'supplychain', re:null, technique:'Supply-chain attack', tools:[], how:'Satu script pihak ketiga yang terkompromi = kode jahat terkirim ke semua pengunjung.'},
  {mod:'openredirect', re:null, technique:'Open redirect → phishing', tools:['Burp Suite'], how:'Parameter redirect disalahgunakan: link resmi mengarah ke situs tiruan.'},
  {mod:'graphql', re:null, technique:'GraphQL introspection abuse', tools:['Burp Suite','graphql-cop'], how:'Skema API dipetakan lengkap untuk mencari query/mutasi sensitif.'},
  {mod:'apidocs', re:null, technique:'API reconnaissance', tools:['Burp Suite'], how:'Dokumentasi API membocorkan endpoint internal dan struktur data.'},
  {mod:'httpmethods', re:/trace/i, technique:'Cross-Site Tracing (XST)', tools:['Burp Suite'], how:'TRACE dipakai mencuri header sensitif bila ada celah XSS.'},
  {mod:'httpmethods', re:/put|delete/i, technique:'Unsafe HTTP methods', tools:['curl','Burp Suite'], how:'Metode tulis disalahgunakan untuk upload atau modifikasi konten.'},
  {mod:'httpmethods', re:null, technique:'HTTP method enumeration', tools:['nmap','Nikto'], how:'Metode yang aktif dipetakan untuk mencari yang bisa disalahgunakan.'},
  {mod:'cert', re:/398|validitas/i, technique:'Extended exposure window', tools:[], how:'Sertifikat berumur panjang = bila private key bocor, masa penyalahgunaan lebih lama.'},
  {mod:'headers', re:/unsafe-inline|unsafe-eval/i, technique:'XSS via CSP bypass', tools:['Burp Suite','dalfox'], how:"'unsafe-inline'/'unsafe-eval' membuat CSP tidak mampu menahan injeksi skrip."},
  {mod:'headers', re:/wildcard|longgar/i, technique:'Script injection via CSP longgar', tools:['Burp Suite'], how:'CSP wildcard = attacker tinggal memuat skrip dari domain mana pun.'},
  {mod:'cookies', re:/__host__|__secure__/i, technique:'Cookie prefix bypass', tools:['Burp Suite'], how:'Prefix keamanan tanpa syarat yang benar = proteksi semu yang diabaikan browser.'},
  {mod:'html', re:/mixed content aktif/i, technique:'MITM active content injection', tools:['mitmproxy'], how:'Skrip/iframe via HTTP dimodifikasi di tengah jalan menjadi kode jahat.'},
  {mod:'cors', re:/credentials/i, technique:'Authenticated cross-origin theft', tools:['Burp Suite'], how:'Kombinasi ACAO * + credentials = situs lain membaca data login korban.'},
];
const ATTACKER_GLOBAL = {technique:'Manual reconnaissance', tools:[], how:'Temuan ini menjadi bahan pemetaan awal sebelum serangan lanjutan.'};

export function attackerFor(module, title) {
  if (!module || title == null) return null;
  const t = String(title);
  if (ATTACKER_NEG_RE.test(t) || /dilewati/i.test(t)) return null;
  for (const row of ATTACKER_TABLE) {
    if (row.mod !== module) continue;
    if (row.re && !row.re.test(t)) continue;
    return {technique: row.technique, tools: row.tools.slice(), how: row.how};
  }
  return {technique: ATTACKER_GLOBAL.technique, tools: [], how: ATTACKER_GLOBAL.how};
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
// Return {expiry_days, not_after, not_before, issuer_name, name_value} atau null.
// nowMs opsional (untuk unit test); default Date.now().
export function certExpiry(json, nowMs) {
  const rows = Array.isArray(json) ? json : [];
  let best = null;
  for (const row of rows) {
    if (!row || !row.not_after) continue;
    const ts = Date.parse(row.not_after);
    if (isNaN(ts)) continue;
    if (!best || ts > best.ts) best = {ts, not_after: row.not_after, not_before: row.not_before || null,
      issuer_name: row.issuer_name || '', name_value: row.name_value || ''};
  }
  if (!best) return null;
  const now = nowMs != null ? nowMs : Date.now();
  return {expiry_days: (best.ts - now) / 86400000, not_after: best.not_after, not_before: best.not_before,
    issuer_name: best.issuer_name, name_value: best.name_value};
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

/* ============ RONDE 3: parser & analisa mendalam (murni) ============ */

// Parse CSP menjadi {directive: [values]} (lowercase).
export function parseCspDirectives(csp) {
  const out = {};
  for (const part of String(csp || '').split(';')) {
    const t = part.trim();
    if (!t) continue;
    const sp = t.indexOf(' ');
    const name = (sp < 0 ? t : t.slice(0, sp)).toLowerCase();
    const vals = sp < 0 ? [] : t.slice(sp + 1).trim().split(/\s+/).map((v) => v.toLowerCase());
    out[name] = vals;
  }
  return out;
}
// Analisa mendalam isi CSP → findings (module 'headers'). Read-only.
export function cspDeepFindings(csp) {
  const f = [];
  const d = parseCspDirectives(csp);
  const ss = d['script-src'] || [];
  const has = (v) => ss.includes(v);
  if (has("'unsafe-inline'")) f.push({module:'headers', severity:'high',
    title:"CSP script-src memakai 'unsafe-inline'",
    description:"Directive script-src mengizinkan 'unsafe-inline' — inline script & event handler boleh berjalan.",
    impact:"'unsafe-inline' praktis melumpuhkan proteksi XSS dari CSP: skrip suntikan attacker tetap dieksekusi browser.",
    remediation:"Hilangkan 'unsafe-inline'; pakai nonce atau hash untuk script inline yang sah.", evidence:"script-src: … 'unsafe-inline'"});
  if (has("'unsafe-eval'")) f.push({module:'headers', severity:'high',
    title:"CSP script-src memakai 'unsafe-eval'",
    description:"Directive script-src mengizinkan 'unsafe-eval' (eval/new Function).",
    impact:"Memudahkan attacker mengeksekusi string arbitrer sebagai kode bila ada celah injeksi.",
    remediation:"Hilangkan 'unsafe-eval'; refactor kode yang memakai eval.", evidence:"script-src: … 'unsafe-eval'"});
  if (ss.includes('*') || ss.some((v) => v === 'data:' || v === 'http:' || v === 'https:'))
    f.push({module:'headers', severity:'high',
      title:'CSP script-src terlalu longgar (wildcard/skema)',
      description:'script-src mengizinkan * atau skema http:/https:/data: — script dari host mana pun boleh dimuat.',
      impact:'Attacker cukup menyuntikkan <script src="https://evil…"> dan browser akan menjalankannya.',
      remediation:"Ketatkan script-src ke 'self' + domain yang benar-benar dipakai.", evidence:'script-src: ' + ss.slice(0, 4).join(' ')});
  if (!d['object-src']) f.push({module:'headers', severity:'medium',
    title:'CSP tanpa object-src',
    description:'Tidak ada pembatasan plugin/objek (<object>, <embed>).',
    impact:'Konten plugin berbahaya bisa di-embed bila ada celah injeksi.',
    remediation:"Tambahkan object-src 'none'.", evidence:''});
  if (!d['base-uri']) f.push({module:'headers', severity:'low',
    title:'CSP tanpa base-uri',
    description:'Tag <base> tidak dibatasi.',
    impact:'Attacker yang bisa injeksi <base> dapat membelokkan URL relatif ke domainnya.',
    remediation:"Tambahkan base-uri 'self'.", evidence:''});
  return f;
}
// Analisa mendalam HSTS → findings (module 'headers').
export function hstsDeepFindings(hsts) {
  const f = [];
  const v = String(hsts || '');
  const m = /max-age\s*=\s*(\d+)/i.exec(v);
  const maxAge = m ? parseInt(m[1], 10) : 0;
  if (maxAge > 0 && maxAge < 31536000) f.push({module:'headers', severity:'medium',
    title:'HSTS max-age terlalu pendek (' + maxAge + ')',
    description:'max-age=' + maxAge + ' detik — di bawah rekomendasi 31536000 (1 tahun).',
    impact:'Proteksi HSTS kedaluwarsa cepat; jendela serangan SSL-stripping terbuka kembali.',
    remediation:'Naikkan ke max-age=31536000; includeSubDomains.', evidence:'max-age=' + maxAge});
  if (!/includeSubDomains/i.test(v)) f.push({module:'headers', severity:'low',
    title:'HSTS tanpa includeSubDomains',
    description:'HSTS hanya berlaku di domain utama, tidak di subdomain.',
    impact:'Subdomain tetap bisa diserang downgrade ke HTTP.',
    remediation:'Tambahkan includeSubDomains pada header HSTS.', evidence:v.slice(0, 80)});
  if (!/\bpreload\b/i.test(v)) f.push({module:'headers', severity:'info',
    title:'HSTS tanpa preload',
    description:'Domain tidak terdaftar di HSTS preload list.',
    impact:'Kunjungan pertama pengguna tetap rentan sebelum HSTS di-cache browser.',
    remediation:'Daftarkan domain di hstspreload.org setelah HSTS stabil.', evidence:''});
  return f;
}
// Cookie __Host- / __Secure- yang tak memenuhi syarat → findings (module 'cookies').
export function cookiePrefixFindings(setCookies) {
  const f = [];
  for (const raw of setCookies || []) {
    const parts = String(raw).split(';').map((s) => s.trim());
    const name = (parts[0] || '').split('=')[0] || '';
    const attrs = parts.slice(1).join('; ').toLowerCase();
    const hasSecure = /(^|;\s*)secure(\s*;|$)/.test(attrs + ';');
    const pathM = /path\s*=\s*([^;]+)/.exec(attrs);
    const hasDomain = /(^|;\s*)domain\s*=/i.test(attrs + ';');
    if (/^__host-/i.test(name)) {
      const bad = [];
      if (!hasSecure) bad.push('tanpa Secure');
      if (pathM && pathM[1].trim() !== '/') bad.push('Path bukan /');
      if (hasDomain) bad.push('memakai Domain');
      if (bad.length) f.push({module:'cookies', severity:'medium',
        title:'Cookie __Host- tidak memenuhi syarat: ' + name,
        description:'__Host- ' + bad.join(', ') + ' — syarat: Secure + Path=/ + tanpa Domain.',
        impact:'Prefix __Host- yang tak memenuhi syarat = proteksi semu; browser mengabaikan jaminannya.',
        remediation:'Perbaiki: Secure; Path=/; tanpa atribut Domain.', evidence:name});
    } else if (/^__secure-/i.test(name)) {
      if (!hasSecure) f.push({module:'cookies', severity:'medium',
        title:'Cookie __Secure- tanpa flag Secure: ' + name,
        description:'__Secure- wajib memakai flag Secure.',
        impact:'Cookie bisa terkirim via HTTP polos dan disadap.',
        remediation:'Tambahkan flag Secure.', evidence:name});
    }
  }
  return f;
}
// Analisa mendalam sertifikat dari data CT → findings (module 'cert').
export function certDeepFindings(ctRows, nowMs) {
  const f = [];
  const rows = Array.isArray(ctRows) ? ctRows : [];
  let best = null;
  for (const row of rows) {
    if (!row || !row.not_after || !row.not_before) continue;
    const a = Date.parse(row.not_after), b = Date.parse(row.not_before);
    if (isNaN(a) || isNaN(b)) continue;
    if (!best || a > best.a) best = {a, b};
  }
  if (best) {
    const days = Math.round((best.a - best.b) / 864e5);
    if (days > 398) f.push({module:'cert', severity:'low',
      title:'Masa berlaku sertifikat > 398 hari (' + days + ' hari)',
      description:'Sertifikat berlaku ' + days + ' hari — melebihi batas industri 398 hari (CA/Browser Forum).',
      impact:'Bila private key bocor, jendela penyalahgunaan lebih lama; beberapa browser/CA menolak sertifikat over-long.',
      remediation:'Pakai sertifikat ≤ 398 hari (ideal 90 hari + auto-renew).', evidence:days + ' hari'});
  }
  if (rows.some((r) => /\*\./.test(String((r && r.name_value) || ''))))
    f.push({module:'cert', severity:'info',
      title:'Sertifikat wildcard terdeteksi',
      description:'Sertifikat mencakup *.domain — satu sertifikat untuk semua subdomain.',
      impact:'Kompromi satu private key = semua subdomain terdampak. Catat sebagai konteks risiko.',
      remediation:'Pertimbangkan sertifikat per-subdomain untuk layanan kritis; simpan private key dengan aman.', evidence:'*.'});
  return f;
}

// --- Subdomain takeover: fingerprint layanan known-vulnerable ---
export const TAKEOVER_FPS = [
  {service:'GitHub Pages', suffix:'.github.io', dead:/there isn't a github pages site here/i},
  {service:'Heroku', suffix:'.herokuapp.com', dead:/no such app/i},
  {service:'AWS S3', suffix:'.s3.amazonaws.com', dead:/NoSuchBucket/i},
  {service:'Azure Web Apps', suffix:'.azurewebsites.net', dead:/404 web site not found/i},
  {service:'Bitbucket', suffix:'.bitbucket.io', dead:/repository not found/i},
  {service:'GitLab Pages', suffix:'.gitlab.io', dead:/project not found/i},
  {service:'Statuspage', suffix:'.statuspage.io', dead:/this page does not exist/i},
  {service:'Zendesk', suffix:'.zendesk.com', dead:/help center.*closed|no longer available/i},
  {service:'Tumblr', suffix:'.tumblr.com', dead:/there's nothing here/i},
  {service:'Shopify', suffix:'.myshopify.com', dead:/shop is currently unavailable/i},
  {service:'Ghost', suffix:'.ghost.io', dead:/domain.*not (configured|claimed)/i},
  {service:'Surge.sh', suffix:'.surge.sh', dead:/project not found/i},
  {service:'Netlify', suffix:'.netlify.app', dead:/site not found/i},
  {service:'Vercel', suffix:'.vercel.app', dead:/deployment not found/i},
  {service:'Helpjuice', suffix:'.helpjuice.com', dead:/knowledge base not found/i},
];
export function matchTakeover(cname) {
  const c = String(cname || '').toLowerCase().replace(/\.$/, '');
  for (const fp of TAKEOVER_FPS) {
    if (c === fp.suffix.slice(1) || c.endsWith(fp.suffix)) return fp;
  }
  return null;
}

// --- Form login: ekstrak form ber-password ---
export function extractPasswordForms(html, origin) {
  const out = [];
  const re = /<form\b[^>]*>([\s\S]*?)<\/form>/gi;
  let m;
  while ((m = re.exec(html || ''))) {
    const tag = m[0].slice(0, m[0].indexOf('>') + 1);
    const body = m[1];
    if (!/type\s*=\s*["']?password["']?/i.test(body)) continue;
    const aM = /\saction\s*=\s*["']([^"']*)["']/i.exec(tag);
    let action = aM ? aM[1].trim() : '';
    try { action = new URL(action || '.', origin).href; } catch (e) { /* biarkan mentah */ }
    const hasCsrf = /<input\b[^>]*type\s*=\s*["']hidden["'][^>]*>/i.test(body) &&
      /csrf|_token|authenticity_token|__requestverification/i.test(body);
    out.push({action, hasCsrf});
  }
  return out;
}

// --- Supply chain: kategorikan script eksternal ---
const KNOWN_CDN = ['cdn.jsdelivr.net','unpkg.com','cdnjs.cloudflare.com','ajax.googleapis.com','code.jquery.com','stackpath.bootstrapcdn.com','maxcdn.bootstrapcdn.com','fonts.googleapis.com','fonts.gstatic.com'];
const ANALYTICS_HOSTS = ['googletagmanager.com','google-analytics.com','connect.facebook.net','platform.twitter.com','snap.licdn.com','clarity.ms','hotjar.com'];
export function categorizeScript(src) {
  let host = '';
  try { host = new URL(src).hostname.toLowerCase(); } catch (e) { return 'unknown'; }
  if (KNOWN_CDN.some((d) => host === d || host.endsWith('.' + d))) return 'cdn';
  if (ANALYTICS_HOSTS.some((d) => host === d || host.endsWith('.' + d))) return 'analytics';
  return 'unknown';
}

// --- Open redirect: pola parameter redirect di link ---
const REDIRECT_PARAMS = ['url','redirect','redirect_url','next','return','return_url','continue','dest','destination','r','u','target'];
export function findRedirectParams(html) {
  const found = new Set();
  const re = /href\s*=\s*["']([^"']+)["']/gi;
  let m;
  while ((m = re.exec(html || ''))) {
    const href = m[1];
    for (const p of REDIRECT_PARAMS) {
      if (new RegExp('[?&]' + p + '=', 'i').test(href)) found.add(p);
    }
  }
  return [...found];
}

// --- HTTP methods: parse header Allow ---
export function parseAllowHeader(allow) {
  const v = String(allow || '').toUpperCase();
  return {trace:/\bTRACE\b/.test(v), track:/\bTRACK\b/.test(v), put:/\bPUT\b/.test(v), del:/\bDELETE\b/.test(v)};
}

// --- GraphQL: deteksi introspection aktif dari respons ---
export function parseGraphqlIntrospection(text) {
  try {
    const j = JSON.parse(String(text || ''));
    return !!(j && j.data && j.data.__typename === 'Query');
  } catch (e) { return false; }
}

// --- WAF/CDN detection dari header ---
const WAF_SIGS = [
  {name:'Cloudflare', res:[/cloudflare/i], hdrs:['cf-ray','cf-cache-status']},
  {name:'Akamai', res:[/akamai/i], hdrs:['x-akamai-request-id','akamai-origin-hop']},
  {name:'AWS CloudFront', res:[], hdrs:['x-amz-cf-id','x-amz-cf-pop']},
  {name:'Sucuri', res:[/sucuri/i], hdrs:['x-sucuri-id','x-sucuri-cache']},
  {name:'Imperva/Incapsula', res:[], hdrs:['x-iinfo','x-cdn']},
  {name:'Fastly', res:[], hdrs:['x-served-by','x-fastly-request-id']},
  {name:'Google Frontend', res:[/\bgws\b/i], hdrs:['x-cloud-trace-context']},
];
export function wafDetect(headers) {
  const h = headers || {};
  const out = [];
  const srv = String(h['server'] || '');
  for (const w of WAF_SIGS) {
    if (w.res.some((re) => re.test(srv))) { out.push({name:w.name}); continue; }
    if (w.hdrs.some((k) => h[k])) out.push({name:w.name});
  }
  return out;
}

// --- Ringkasan eksekutif & top prioritas (murni) ---
const SEV_RANK = {critical:0, high:1, medium:2, low:3, info:4};
export function topPriorities(findings) {
  const cands = (findings || [])
    .filter((f) => f.severity === 'critical' || f.severity === 'high' || f.severity === 'medium')
    .sort((a, b) => (SEV_RANK[a.severity] - SEV_RANK[b.severity]));
  return cands.slice(0, 3).map((f) => ({
    title: f.title,
    severity: f.severity,
    firstStep: String(f.remediation || '').split(/\.\s/)[0].slice(0, 160),
  }));
}
export function execSummary(res) {
  const c = res.counts || {critical:0, high:0, medium:0, low:0, info:0};
  const s1 = 'Hasil ' + MODULES.length + ' modul: grade ' + res.grade + ' (skor ' + res.score + '/100) — ' +
    c.critical + ' critical, ' + c.high + ' high, ' + c.medium + ' medium, ' + c.low + ' low.';
  const top = topPriorities(res.findings || []);
  if (!top.length)
    return s1 + ' Tidak ada temuan berarti — postur keamanan dasar situs ini baik. Pertahankan dengan scan berkala, terutama setelah perubahan konfigurasi.';
  return s1 + ' Risiko terbesar: "' + top[0].title + '" [' + top[0].severity + '].' +
    ' Prioritas perbaikan: ' + top.map((t, i) => (i + 1) + '. ' + t.title).join('; ') + '.';
}

/* ================= FETCH HELPERS ================= */
function tFetch(url, {timeout = 15000, ...opts} = {}) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), timeout);
  return fetch(url, {...opts, signal: c.signal}).finally(() => clearTimeout(t));
}
// Ambil URL target via proxy. Return {ok, status, headers(map lowercase), text, via}
// method/body/headers opsional untuk probe read-only (OPTIONS, POST GraphQL).
async function fetchProxied(url, {timeout = 15000, method = 'GET', body = null, headers = null} = {}) {
  try {
    const r = await tFetch(PROXY_W(url), {timeout, method, body, headers: headers || undefined});
    const h = {};
    const blob = r.headers.get('cors-received-headers');
    // Simpan mentah juga di key-nya sendiri — modul cookies butuh blob aslinya.
    if (blob) h['cors-received-headers'] = blob;
    if (blob) { try { const j = JSON.parse(blob); for (const k in j) h[String(k).toLowerCase()] = String(j[k]); } catch (e) {} }
    for (const k of ['content-security-policy','strict-transport-security','x-frame-options','x-content-type-options','referrer-policy','permissions-policy','server','x-powered-by','content-type','location','access-control-allow-origin','access-control-allow-credentials','allow']) {
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
    else if (p.status === 'ok') {
      const lookups = countSpfLookups(p.detail);
      if (lookups > 10) f.push(mk('dns','medium','SPF melebihi 10 DNS lookup',
        'Record SPF memakai ' + lookups + ' mekanisme yang memicu DNS lookup (batas RFC 7208: 10).',
        'Melebihi batas → SPF error (permerror) dan proteksi email gagal total (fail-open).',
        'Kurangi include/a/mx/ptr/redirect — gabungkan layanan pengirim atau pakai makro SPF.', 'lookup: ' + lookups));
    }
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
    if ((p.status === 'ok' || p.status === 'monitor') && !p.hasRua) f.push(mk('dns','low','DMARC tanpa rua',
      'DMARC aktif tapi tanpa alamat pelaporan agregat (rua).',
      'Tanpa laporan agregat, penyalahgunaan domain (spoofing) tidak terpantau.',
      'Tambahkan rua=mailto:dmarc@' + H + ' di record DMARC.', ''));
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
  const f = [];
  // cors-deep: analisa header ACAO/ACAC upstream via proxy (lebih presisi dari uji origin sendiri).
  if (ctx.page) {
    const h = ctx.page.headers || {};
    const acao = (h['access-control-allow-origin'] || '').trim();
    const acac = (h['access-control-allow-credentials'] || '').toLowerCase() === 'true';
    if (acao === '*' && acac) f.push(mk('cors','critical','CORS: ACAO * + Allow-Credentials',
      'Server mengirim Access-Control-Allow-Origin: * BERSAMA Access-Control-Allow-Credentials: true.',
      'Situs jahat mana pun dapat membaca respons terautentikasi korban — kombinasi paling berbahaya.',
      'Jangan pernah kombinasikan * dengan credentials; echo origin spesifik yang terdaftar.', 'ACAO: * + ACAC: true'));
    else if (acao === '*') f.push(mk('cors','medium','CORS mengizinkan semua origin (*)',
      'Server mengirim Access-Control-Allow-Origin: *.',
      'API publik bisa dibaca situs mana pun — wajar untuk data publik, berbahaya bila ada endpoint sensitif.',
      'Batasi ACAO ke origin yang benar-benar butuh untuk endpoint sensitif.', 'ACAO: *'));
    else if (acao) f.push(mkInfo('cors','ACAO terbatas: ' + acao.slice(0, 60),'Hanya origin tertentu yang diizinkan — konfigurasi ketat.'));
  }
  try {
    const r = await tFetch(ctx.origin + '/', {timeout: 8000});
    if (r.type === 'opaque') { if (!f.length) f.push(mkInfo('cors','CORS tidak terbuka','Respons opaque — origin lain tidak bisa membaca.')); return f; }
    const hasSession = (ctx.cookieNames || []).length > 0;
    f.push(mk('cors', hasSession ? 'medium' : 'low','Uji baca lintas-origin: respons terbaca',
      'Server mengizinkan https://tools.adipmusic.my.id membaca respons.',
      hasSession ? 'Dengan cookie sesi aktif, situs lain yang diizinkan bisa membaca data terautentikasi (tergantung konfigurasi).'
                 : 'Risiko rendah bila hanya data publik, tapi tetap pola konfigurasi longgar.',
      'Batasi ACAO ke origin yang benar-benar butuh, jangan pakai * untuk endpoint sensitif.', ''));
  } catch (e) {
    if (!f.length) f.push(mkInfo('cors','CORS tidak terbuka lebar','Browser menolak baca lintas-origin (aman).'));
  }
  return f;
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
    const active = mixed.filter((x) => x.active), passive = mixed.filter((x) => !x.active);
    if (active.length) f.push(mk('html','high','Mixed content AKTIF: ' + active.length + ' resource via HTTP',
      'Halaman HTTPS memuat script/iframe/stylesheet via http:// — konten AKTIF yang dieksekusi browser.',
      'Resource aktif via HTTP bisa disadap & disuntik kode jahat di tengah jalan (MITM) — halaman "aman" jadi tidak aman.',
      'Ganti semua URL http:// menjadi https:// — prioritaskan script & iframe.', active.slice(0,3).map((x)=>x.url).join('\n')));
    if (passive.length) f.push(mk('html','medium','Mixed content pasif: ' + passive.length + ' resource via HTTP',
      'Halaman HTTPS memuat gambar/media via http://.',
      'Browser menandai halaman "tidak aman"; gambar bisa diganti/dimata-matai (privacy).',
      'Ganti semua URL http:// menjadi https:// atau protokol-relatif.', passive.slice(0,3).map((x)=>x.url).join('\n')));
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
// Probe path sensitif: {path, sev, title, desc, impact, fix, sniff}.
// sniff(text) → string bukti untuk ditampilkan, atau null bila tidak cocok.
const PROBE = [
  {path:'/.git/HEAD', sev:'critical', title:'Direktori /.git/ terekspos',
   desc:'/.git/HEAD dapat diakses publik (HTTP 200).',
   impact:'Penyerang mengunduh seluruh riwayat Git: source code + credential yang pernah ter-commit.',
   fix:'Blokir di web server, mis. nginx: location ~ /\\.git { deny all; }',
   sniff:(t) => /^ref:\s*refs\//m.test(t) ? t.slice(0, 60) : null},
  {path:'/.git/config', sev:'critical', title:'File /.git/config terekspos',
   desc:'/.git/config dapat diakses publik (HTTP 200).',
   impact:'File config membocorkan URL remote & detail repo — konfirmasi /.git/ terekspos dan bisa direkonstruksi.',
   fix:'Blokir di web server, mis. nginx: location ~ /\\.git { deny all; }',
   sniff:(t) => /\[core\]/i.test(t) ? t.slice(0, 60) : null},
  {path:'/.git/logs/HEAD', sev:'critical', title:'Git log /.git/logs/HEAD terekspos',
   desc:'/.git/logs/HEAD dapat diakses publik (HTTP 200).',
   impact:'Log Git membocorkan history commit + hash — mempercepat rekonstruksi repo.',
   fix:'Blokir di web server, mis. nginx: location ~ /\\.git { deny all; }',
   sniff:(t) => /[0-9a-f]{40}/i.test(t) ? t.slice(0, 60) : null},
  {path:'/.env', sev:'critical', title:'File /.env dapat diakses publik',
   desc:'/.env terbaca (HTTP 200) dan tampak seperti file environment.',
   impact:'Berisi credential: API key, password database, secret aplikasi.',
   fix:'Jangan pernah taruh .env di document root; blokir aksesnya.',
   sniff:(t) => (/=/m.test(t) && !/<html/i.test(t)) ? 'terdeteksi pola KEY=VALUE' : null},
  {path:'/.env.bak', sev:'critical', title:'File /.env.bak dapat diakses publik',
   desc:'/.env.bak terbaca (HTTP 200) — salinan backup file environment.',
   impact:'Sama berbahayanya dengan /.env: berisi credential aplikasi.',
   fix:'Hapus file backup dari direktori publik; simpan di luar document root.',
   sniff:(t) => (/=/m.test(t) && !/<html/i.test(t)) ? 'terdeteksi pola KEY=VALUE' : null},
  {path:'/.env.old', sev:'critical', title:'File /.env.old dapat diakses publik',
   desc:'/.env.old terbaca (HTTP 200) — salinan lama file environment.',
   impact:'Sama berbahayanya dengan /.env: berisi credential aplikasi.',
   fix:'Hapus file backup dari direktori publik; simpan di luar document root.',
   sniff:(t) => (/=/m.test(t) && !/<html/i.test(t)) ? 'terdeteksi pola KEY=VALUE' : null},
  {path:'/composer.json', sev:'medium', title:'composer.json terekspos',
   desc:'composer.json dapat diakses publik (HTTP 200) — daftar dependency PHP.',
   impact:'Versi dependency PHP dipetakan untuk mencari CVE yang cocok.',
   fix:'Blokir akses composer.json dari publik.',
   sniff:(t) => /"(name|require)"/i.test(t) ? 'composer.json valid terdeteksi' : null},
  {path:'/package.json', sev:'medium', title:'package.json terekspos',
   desc:'package.json dapat diakses publik (HTTP 200) — daftar dependency Node.',
   impact:'Versi dependency Node dipetakan untuk mencari CVE yang cocok.',
   fix:'Blokir akses package.json dari publik.',
   sniff:(t) => /"(name|require)"/i.test(t) ? 'package.json valid terdeteksi' : null},
  {path:'/.svn/entries', sev:'high', title:'Direktori /.svn/ terekspos',
   desc:'/.svn/entries dapat diakses publik (HTTP 200).',
   impact:'Metadata Subversion membocorkan struktur repo & URL source.',
   fix:'Blokir /.svn di web server.',
   sniff:(t) => t.length > 20 ? t.slice(0, 40) : null},
  {path:'/.hg/hgrc', sev:'high', title:'Direktori /.hg/ terekspos',
   desc:'/.hg/hgrc dapat diakses publik (HTTP 200).',
   impact:'Metadata Mercurial membocorkan URL remote & struktur repo.',
   fix:'Blokir /.hg di web server.',
   sniff:(t) => /\[paths\]/i.test(t) ? t.slice(0, 40) : null},
  {path:'/server-status', sev:'medium', title:'server-status Apache terekspos',
   desc:'Halaman server-status Apache dapat diakses publik.',
   impact:'Membocorkan request aktif, worker, dan path internal server.',
   fix:'Batasi server-status ke IP internal (Require ip ...).',
   sniff:(t) => /apache status/i.test(t) ? 'Apache server-status aktif' : null},
  {path:'/server-info', sev:'medium', title:'server-info Apache terekspos',
   desc:'Halaman server-info Apache dapat diakses publik.',
   impact:'Membocorkan konfigurasi & modul server lengkap.',
   fix:'Batasi server-info ke IP internal.',
   sniff:(t) => /apache server information/i.test(t) ? 'Apache server-info aktif' : null},
  {path:'/phpinfo.php', sev:'medium', title:'phpinfo() terekspos',
   desc:'Halaman phpinfo() dapat diakses publik.',
   impact:'Membocorkan versi PHP, ekstensi, path, dan konfigurasi server lengkap.',
   fix:'Hapus file phpinfo.php dari server produksi.',
   sniff:(t) => /php version|phpinfo\(\)/i.test(t) ? 'phpinfo terdeteksi' : null},
  {path:'/web.config', sev:'low', title:'web.config terekspos',
   desc:'web.config IIS dapat diakses publik.',
   impact:'Membocorkan konfigurasi IIS; berpotensi mengungkap connection string.',
   fix:'Blokir akses web.config dari publik.',
   sniff:(t) => /<configuration/i.test(t) ? 'web.config IIS terdeteksi' : null},
  {path:'/crossdomain.xml', sev:'low', title:'crossdomain.xml terekspos',
   desc:'crossdomain.xml dapat diakses publik.',
   impact:'Policy cross-domain yang longgar bisa mengizinkan akses lintas-domain tak diinginkan.',
   fix:'Ketatkan policy atau hapus bila tidak dipakai.',
   sniff:(t) => /cross-domain-policy/i.test(t) ? 'cross-domain-policy ditemukan' : null},
  {path:'/dump.sql', sev:'high', title:'File backup terekspos: /dump.sql',
   desc:'/dump.sql dapat diunduh (HTTP 200).',
   impact:'Dump database berisi data lengkap — jackpot bagi penyerang.',
   fix:'Hapus file dump dari direktori publik; simpan di luar document root.',
   sniff:(t) => (t.length > 500 && !/<html/i.test(t)) ? t.length + ' bytes' : null},
  {path:'/db.sqlite', sev:'high', title:'File backup terekspos: /db.sqlite',
   desc:'/db.sqlite dapat diunduh (HTTP 200).',
   impact:'File database SQLite berisi data aplikasi lengkap.',
   fix:'Hapus file database dari direktori publik.',
   sniff:(t) => /SQLite format 3/.test(t) ? 'header SQLite terdeteksi' : ((t.length > 500 && !/<html/i.test(t)) ? t.length + ' bytes' : null)},
  {path:'/debug.log', sev:'medium', title:'debug.log terekspos',
   desc:'/debug.log dapat diakses publik.',
   impact:'Log debug membocorkan path internal, query, dan kadang credential.',
   fix:'Hapus log dari direktori publik; matikan debug di produksi.',
   sniff:(t) => (/debug|error|warning|exception|stack trace/i.test(t) && t.length > 100) ? 'pola log terdeteksi' : null},
  {path:'/actuator', sev:'medium', title:'Spring Actuator terekspos: /actuator',
   desc:'/actuator dapat diakses publik — endpoint manajemen Spring Boot.',
   impact:'Actuator membocorkan health, env, dan konfigurasi aplikasi.',
   fix:'Batasi akses actuator ke internal / nonaktifkan endpoint sensitif.',
   sniff:(t) => /"status"|spring/i.test(t) ? 'actuator terdeteksi' : null},
  {path:'/.DS_Store', sev:'low', title:'File /.DS_Store terekspos',
   desc:'/.DS_Store dapat diakses publik.',
   impact:'File metadata macOS membocorkan nama file di direktori.',
   fix:'Hapus .DS_Store dari server; tambahkan ke .gitignore.',
   sniff:(t) => t.length > 10 ? t.length + ' bytes' : null},
  {path:'/backup.zip', sev:'high', title:'File backup terekspos: /backup.zip',
   desc:'/backup.zip dapat diunduh (HTTP 200).',
   impact:'Backup berisi database/source lengkap — jackpot bagi penyerang.',
   fix:'Hapus file backup dari direktori publik; simpan di luar document root.',
   sniff:(t) => t.length > 500 ? t.length + ' bytes' : null},
  {path:'/db.sql', sev:'high', title:'File backup terekspos: /db.sql',
   desc:'/db.sql dapat diunduh (HTTP 200).',
   impact:'Backup berisi database/source lengkap — jackpot bagi penyerang.',
   fix:'Hapus file backup dari direktori publik; simpan di luar document root.',
   sniff:(t) => (t.length > 500 && !/<html/i.test(t)) ? t.length + ' bytes' : null},
  {path:'/database.sql', sev:'high', title:'File backup terekspos: /database.sql',
   desc:'/database.sql dapat diunduh (HTTP 200).',
   impact:'Backup berisi database/source lengkap — jackpot bagi penyerang.',
   fix:'Hapus file backup dari direktori publik; simpan di luar document root.',
   sniff:(t) => (t.length > 500 && !/<html/i.test(t)) ? t.length + ' bytes' : null},
  {path:'/backup.sql', sev:'high', title:'File backup terekspos: /backup.sql',
   desc:'/backup.sql dapat diunduh (HTTP 200).',
   impact:'Backup berisi database/source lengkap — jackpot bagi penyerang.',
   fix:'Hapus file backup dari direktori publik; simpan di luar document root.',
   sniff:(t) => (t.length > 500 && !/<html/i.test(t)) ? t.length + ' bytes' : null},
  {path:'/wp-config.php.bak', sev:'high', title:'File backup terekspos: /wp-config.php.bak',
   desc:'/wp-config.php.bak dapat diunduh (HTTP 200).',
   impact:'Backup berisi database/source lengkap — jackpot bagi penyerang.',
   fix:'Hapus file backup dari direktori publik; simpan di luar document root.',
   sniff:(t) => (t.length > 500 && !/<html/i.test(t)) ? t.length + ' bytes' : null},
];
async function mPaths(ctx) {
  const f = [];
  const base = await fetchProxied(ctx.origin + '/aqws-probe-' + Math.random().toString(36).slice(2, 10) + '/');
  const baseLen = base.ok ? base.text.length : 0;
  const sameAs404 = (t) => base.ok && Math.abs(t.length - baseLen) < Math.max(200, baseLen * 0.1);
  const get = (p) => fetchProxied(ctx.origin + p, {timeout: 12000});
  for (const pr of PROBE) {
    const r = await get(pr.path);
    if (!(r.ok && r.status === 200)) continue;
    const text = r.text || '';
    if (sameAs404(text)) continue;
    const ev = pr.sniff(text);
    if (ev == null) continue;
    f.push(mk('paths', pr.sev, pr.title, pr.desc, pr.impact, pr.fix, pr.path + ' — ' + ev));
  }
  // robots.txt (+ deep dive)
  let r = await get('/robots.txt');
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
  ctx.techs = techs;
  const f = [];
  const wafs = wafDetect(ctx.page.headers);
  if (wafs.length) f.push(mk('fingerprint','info','WAF/CDN terdeteksi: ' + wafs.map((w) => w.name).join(', '),
    'Signature WAF/CDN ditemukan di header respons.',
    'WAF menambah lapisan pertahanan (bukan jaminan aman); konfigurasi tetap harus benar.',
    'Pastikan rule WAF aktif & mode blocking, bukan sekadar monitoring.', wafs.map((w) => w.name).join(', ')));
  if (techs.length) f.push(mk('fingerprint','info','Teknologi terdeteksi: ' + techs.map((t) => t.name + (t.version ? ' ' + t.version : '')).join(', '),
    'Pola umum ditemukan di HTML/header.',
    'Informasi konteks untuk menilai temuan lain (mis. versi CMS lawas → cek CVE).',
    'Sembunyikan versi spesifik bila memungkinkan.', techs.map((t)=>t.name).join(', ')));
  if (!f.length) f.push(mkInfo('fingerprint','Teknologi tidak teridentifikasi','Tidak ada pola umum terdeteksi.'));
  return f;
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
  const f = [];
  const dateStr = String(c.not_after).slice(0, 10);
  const issuer = c.issuer_name || 'tidak diketahui';
  const days = Math.floor(c.expiry_days);
  if (c.expiry_days < 0) f.push(mk('cert','critical','Sertifikat kedaluwarsa',
    'Sertifikat domain ini kedaluwarsa pada ' + dateStr + ' (' + Math.abs(days) + ' hari lalu). Penerbit: ' + issuer + '.',
    'Pengunjung melihat peringatan browser "koneksi tidak aman" — lalu lintas bisa disadap tanpa terdeteksi.',
    'Perbarui sertifikat SEGERA dan aktifkan auto-renew (mis. Let\'s Encrypt + certbot).', 'not_after: ' + c.not_after));
  else if (c.expiry_days < 30) f.push(mk('cert','high','Sertifikat kedaluwarsa <30 hari',
    'Sertifikat valid sampai ' + dateStr + ' (' + days + ' hari lagi). Penerbit: ' + issuer + '.',
    'Kedaluwarsa mendadak = situs menampilkan peringatan browser, pengunjung kabur dan trust jatuh.',
    'Jadwalkan perpanjangan sekarang; pasang monitoring kedaluwarsa sertifikat.', 'not_after: ' + c.not_after));
  else f.push(mkInfo('cert','Sertifikat valid s/d ' + dateStr, 'Berlaku ' + days + ' hari lagi. Penerbit: ' + issuer + '.'));
  f.push(...certDeepFindings(ctx.ctRows));
  return f;
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

// Modul 16 — Directory listing (100% client-side via proxy).
const DIRLIST_PATHS = ['/', '/images/', '/uploads/', '/assets/', '/backup/', '/files/'];
async function mDirlist(ctx) {
  const f = [];
  for (const p of DIRLIST_PATHS) {
    try {
      const r = await fetchProxied(ctx.origin + p, {timeout: 10000});
      if (r.ok && r.status === 200 && /<title>\s*Index of \//i.test(r.text || ''))
        f.push(mk('dirlist','medium','Directory listing aktif di ' + p,
          'Server menampilkan daftar isi direktori ' + p + ' ("Index of /").',
          'Penyerang melihat struktur direktori & nama file sensitif tanpa perlu menebak.',
          'Matikan directory listing: Options -Indexes (Apache) / autoindex off (nginx).', p));
    } catch (e) { /* lanjut ke path berikutnya */ }
  }
  if (!f.length) f.push(mkInfo('dirlist','Tidak ada directory listing terdeteksi','6 path umum dicek — tidak ada yang menampilkan "Index of /".'));
  return f;
}

// Modul 17 — Subdomain Takeover (read-only: DoH CNAME + verifikasi NXDOMAIN/HTTP).
async function mTakeover(ctx) {
  const f = [];
  if (!ctx.ctRows || !ctx.ctRows.length)
    return [mkInfo('takeover','Takeover tidak dapat dicek','Butuh data subdomain dari Certificate Transparency (modul ct gagal).')];
  const subs = parseCtJson(ctx.ctRows).filter((s) => s !== ctx.host).slice(0, 20);
  if (!subs.length) return [mkInfo('takeover','Tidak ada subdomain untuk dicek','crt.sh tidak mencatat subdomain selain apex.')];
  let checked = 0;
  for (const sub of subs) {
    let cname = null;
    try {
      const j = await doh(sub, 'CNAME');
      const ans = (j.Answer || []).filter((a) => a.type === 5);
      if (ans.length) cname = String(ans[0].data).replace(/\.$/, '');
    } catch (e) { continue; }
    checked++;
    if (!cname) continue;
    const fp = matchTakeover(cname);
    if (!fp) continue;
    // 1) verifikasi DNS: NXDOMAIN → takeover sangat mungkin
    let dnsAlive = true;
    try { const j2 = await doh(cname, 'A'); dnsAlive = j2.Status === 0 && !!((j2.Answer || []).length); }
    catch (e) { dnsAlive = false; }
    if (!dnsAlive) {
      f.push(mk('takeover','high','Potensi subdomain takeover: ' + sub,
        sub + ' CNAME ke ' + cname + ' (' + fp.service + ') yang tidak lagi resolve (NXDOMAIN).',
        'Penyerang mendaftarkan "' + cname + '" di ' + fp.service + ' lalu mengklaim ' + sub + ' — phishing dari subdomain resmi korban.',
        'Hapus record CNAME yang mengarah ke layanan tak terpakai, atau aktifkan kembali layanannya.', sub + ' → ' + cname));
      continue;
    }
    // 2) verifikasi HTTP: fingerprint halaman "not found" khas layanan yang belum diklaim
    try {
      const r = await fetchProxied('http://' + sub + '/', {timeout: 10000});
      if (r.ok && fp.dead.test(r.text || ''))
        f.push(mk('takeover','high','Potensi subdomain takeover: ' + sub,
          sub + ' CNAME ke ' + cname + ' (' + fp.service + ') menampilkan halaman "not found" khas slot yang belum diklaim.',
          'Penyerang mengklaim slot "' + cname + '" di ' + fp.service + ' lalu mengambil alih ' + sub + '.',
          'Klaim kembali slot di ' + fp.service + ' atau hapus record CNAME-nya.', sub + ' → ' + cname));
    } catch (e) { /* abaikan */ }
  }
  if (!f.length) f.push(mkInfo('takeover','Tidak ada indikasi takeover','Dicek ' + checked + ' subdomain — tidak ada CNAME mati ke layanan known-vulnerable.'));
  return f;
}

// Modul 18 — WordPress hardening (hanya bila fingerprint mendeteksi WP). Read-only GET.
async function mWp(ctx) {
  const techs = ctx.techs || [];
  if (!techs.some((t) => t.name === 'WordPress'))
    return [mkInfo('wp','Bukan WordPress','Fingerprint tidak mendeteksi WordPress — modul dilewati.')];
  const f = [];
  const get = (p) => fetchProxied(ctx.origin + p, {timeout: 10000});
  let r = await get('/wp-json/wp/v2/users');
  if (r.ok && r.status === 200 && /"slug"\s*:/.test(r.text || ''))
    f.push(mk('wp','medium','WP user enumeration terbuka (/wp-json/wp/v2/users)',
      'REST API WordPress menampilkan daftar username.',
      'Username valid mempercepat brute-force login — attacker tinggal menebak password.',
      'Batasi via plugin keamanan atau blokir endpoint users untuk pengunjung anonim.', '/wp-json/wp/v2/users → 200'));
  r = await get('/xmlrpc.php');
  if (r.ok && r.status === 200 && /xmlrpc/i.test(r.text || ''))
    f.push(mk('wp','medium','xmlrpc.php aktif',
      'Endpoint XML-RPC WordPress merespons (HTTP 200).',
      'Disalahgunakan untuk brute-force terdistribusi dan pingback DDoS.',
      'Nonaktifkan bila tak dipakai (plugin Disable XML-RPC) atau batasi di WAF.', '/xmlrpc.php → 200'));
  r = await get('/readme.html');
  if (r.ok && r.status === 200 && /wordpress/i.test(r.text || '')) {
    const vm = /version\s+(\d+\.\d+(?:\.\d+)?)/i.exec(r.text || '');
    f.push(mk('wp','low','readme.html WordPress terekspos' + (vm ? ' (versi ' + vm[1] + ')' : ''),
      'readme.html menampilkan informasi WordPress' + (vm ? ' versi ' + vm[1] : '') + '.',
      'Versi CMS dipakai attacker untuk mencari CVE yang cocok.',
      'Hapus readme.html dari server produksi.', vm ? 'version ' + vm[1] : '/readme.html → 200'));
  }
  if (!f.length) f.push(mkInfo('wp','WordPress terkunci','Endpoint umum WP (REST users, xmlrpc, readme) tidak terekspos.'));
  return f;
}

// Modul 19 — Source map terekspos (read-only GET .js.map).
async function mSourcemap(ctx) {
  const f = [];
  const locals = (ctx.scripts || []).filter((s) => s.src.startsWith(ctx.origin) && /\.js(\?|$)/i.test(s.src)).slice(0, 10);
  if (!locals.length) return [mkInfo('sourcemap','Tidak ada script lokal','Tidak ditemukan script JS dari domain sendiri.')];
  let checked = 0;
  for (const s of locals) {
    const name = s.src.split('/').pop().split('?')[0];
    const r = await fetchProxied(s.src + '.map', {timeout: 10000});
    checked++;
    if (r.ok && r.status === 200) {
      const t = (r.text || '').trim();
      if (t.startsWith('{') && /"sources"|"mappings"/.test(t))
        f.push(mk('sourcemap','medium','Source map terekspos: ' + name,
          'File ' + name + '.map dapat diunduh (HTTP 200) dan berisi JSON source map valid.',
          'Source asli — termasuk komentar, struktur internal, dan kadang secret — bisa dibaca siapa pun.',
          'Jangan deploy file .map ke produksi; hapus dari server.', name + '.map → 200'));
    }
  }
  if (!f.length) f.push(mkInfo('sourcemap','Tidak ada source map terekspos','Dicek ' + checked + ' script lokal.'));
  return f;
}

// Modul 20 — Analisa form login (pasif: parse HTML).
async function mLogin(ctx) {
  if (!ctx.page || !ctx.page.text) return [mkInfo('login','Tidak dapat dicek','Halaman tidak bisa diambil.')];
  const forms = extractPasswordForms(ctx.page.text, ctx.origin);
  if (!forms.length) return [mkInfo('login','Tidak ada form password','Tidak ditemukan <input type="password"> di halaman utama.')];
  const f = [];
  forms.forEach((fm, i) => {
    const label = 'Form login #' + (i + 1);
    if (fm.action.startsWith('http://'))
      f.push(mk('login','high',label + ' mengirim kredensial via HTTP',
        'Form login mengirim ke ' + fm.action.slice(0, 80) + ' (HTTP polos).',
        'Username & password terkirim tanpa enkripsi — mudah disadap di jaringan publik.',
        'Ganti action form ke HTTPS.', fm.action.slice(0, 100)));
    if (!fm.hasCsrf)
      f.push(mk('login','info',label + ': token CSRF tidak terlihat',
        'Tidak ditemukan pola token CSRF umum (csrf/_token) di form.',
        'Tanpa token CSRF, form state-changing rentan Cross-Site Request Forgery — perlu verifikasi manual di sisi server.',
        'Pastikan setiap form state-changing memakai token CSRF dengan validasi server-side.', fm.action.slice(0, 100) || '(action kosong)'));
  });
  if (!f.length) f.push(mkInfo('login','Form login aman dasar','Action HTTPS & pola token CSRF terlihat.'));
  return f;
}

// Modul 21 — Supply chain: kategorikan script pihak ketiga (pasif).
async function mSupplychain(ctx) {
  const scripts = ctx.scripts || [];
  const ext = scripts.filter((s) => /^https?:\/\//i.test(s.src) && !s.src.startsWith(ctx.origin));
  if (!ext.length) return [mkInfo('supplychain','Tidak ada script eksternal','Semua script berasal dari domain sendiri.')];
  const f = [];
  const unknown = ext.filter((s) => categorizeScript(s.src) === 'unknown');
  const nCdn = ext.filter((s) => categorizeScript(s.src) === 'cdn').length;
  const nAn = ext.filter((s) => categorizeScript(s.src) === 'analytics').length;
  f.push(mkInfo('supplychain','Script eksternal: ' + ext.length,
    'CDN umum: ' + nCdn + ', analytics/ads: ' + nAn + ', domain tak dikenal: ' + unknown.length + '.'));
  if (unknown.length) {
    const hosts = [...new Set(unknown.map((s) => { try { return new URL(s.src).hostname; } catch (e) { return s.src; } }))].slice(0, 5);
    f.push(mk('supplychain','medium','Script dari domain tak dikenal: ' + unknown.length,
      'Domain: ' + hosts.join(', '),
      'Satu script pihak ketiga yang terkompromi = kode jahat terkirim ke semua pengunjung (supply-chain attack).',
      'Audit manual tiap domain tak dikenal; pasang SRI + CSP ketat untuk membatasi dampak.', unknown.slice(0, 3).map((s) => s.src.slice(0, 80)).join('\n')));
  }
  return f;
}

// Modul 22 — Open redirect: pola parameter redirect (pasif, info).
async function mOpenredirect(ctx) {
  if (!ctx.page || !ctx.page.text) return [mkInfo('openredirect','Tidak dapat dicek','Halaman tidak bisa diambil.')];
  const params = findRedirectParams(ctx.page.text);
  if (!params.length) return [mkInfo('openredirect','Tidak ada pola redirect','Tidak ditemukan parameter redirect umum di link halaman.')];
  return [mk('openredirect','info','Parameter redirect terdeteksi: ' + params.join(', '),
    'Link memakai parameter seperti ?' + params[0] + '=… yang umum dipakai untuk redirect.',
    'Bila nilai parameter tidak divalidasi server, attacker membuat link "situs-asli.com?' + params[0] + '=evil.com" untuk phishing (open redirect).',
    'Validasi whitelist tujuan redirect di server; uji manual tiap parameter.', '?' + params.join('=, ?') + '=')];
}

// Modul 23 — GraphQL introspection (read-only: query {__typename}).
async function mGraphql(ctx) {
  const url = ctx.origin + '/graphql';
  const body = JSON.stringify({query:'{__typename}'});
  let text = null;
  try {
    const r = await fetchProxied(url, {timeout: 10000, method:'POST', body, headers:{'Content-Type':'application/json'}});
    if (r.ok) text = r.text;
  } catch (e) { /* coba GET */ }
  if (text == null) {
    try {
      const r2 = await fetchProxied(url + '?query=' + encodeURIComponent('{__typename}'), {timeout: 10000});
      if (r2.ok) text = r2.text;
    } catch (e) { /* abaikan */ }
  }
  if (text == null) return [mkInfo('graphql','GraphQL tidak dapat dicek','Endpoint /graphql tidak merespons.')];
  if (parseGraphqlIntrospection(text))
    return [mk('graphql','medium','GraphQL introspection aktif di /graphql',
      'Query {__typename} dijawab {"data":{"__typename":"Query"}} — introspection menyala.',
      'Attacker memetakan seluruh skema API (query, mutasi, tipe data) untuk mencari celah.',
      'Matikan introspection di produksi; batasi akses /graphql hanya untuk klien resmi.', '/graphql → introspection aktif')];
  return [mkInfo('graphql','GraphQL tidak terdeteksi / introspection mati','Endpoint /graphql tidak menjawab introspection.')];
}

// Modul 24 — Dokumentasi API terekspos (read-only GET).
const APIDOC_PATHS = ['/api/docs','/swagger.json','/openapi.json','/api/openapi.json','/swagger/v1/swagger.json'];
async function mApidocs(ctx) {
  const f = [];
  for (const p of APIDOC_PATHS) {
    const r = await fetchProxied(ctx.origin + p, {timeout: 10000});
    if (r.ok && r.status === 200 && /swagger|openapi/i.test(r.text || '')) {
      f.push(mk('apidocs','low','Dokumentasi API terekspos: ' + p,
        p + ' dapat diakses publik dan tampak seperti definisi Swagger/OpenAPI.',
        'Dokumentasi API membocorkan endpoint internal, parameter, dan struktur data — bahan reconnaissance.',
        'Batasi akses dokumentasi API ke internal/staging.', p + ' → 200'));
      break;
    }
  }
  if (!f.length) f.push(mkInfo('apidocs','Tidak ada API docs terekspos','Path umum dokumentasi API tidak ditemukan.'));
  return f;
}

// Modul 25 — HTTP methods (read-only: OPTIONS + baca header Allow).
async function mHttpmethods(ctx) {
  const f = [];
  try {
    const r = await fetchProxied(ctx.origin + '/', {timeout: 10000, method:'OPTIONS'});
    if (!r.ok) return [mkInfo('httpmethods','Tidak dapat dicek','OPTIONS tidak merespons via proxy.')];
    const allow = r.headers['allow'] || '';
    if (!allow) return [mkInfo('httpmethods','Header Allow tidak ada','Server tidak mengumumkan metode via OPTIONS.')];
    const p = parseAllowHeader(allow);
    if (p.trace || p.track)
      f.push(mk('httpmethods','medium','Metode TRACE/TRACK aktif',
        'Header Allow: ' + allow.slice(0, 100),
        'TRACE memungkinkan Cross-Site Tracing (XST): mencuri header sensitif bila ada celah XSS.',
        'Nonaktifkan TRACE/TRACK: TraceEnable Off (Apache) / hapus di nginx.', 'Allow: ' + allow.slice(0, 100)));
    if (p.put || p.del)
      f.push(mk('httpmethods','high','Metode PUT/DELETE aktif',
        'Header Allow: ' + allow.slice(0, 100),
        'Metode tulis yang aktif bisa disalahgunakan untuk meng-upload/memodifikasi konten bila autentikasi lemah.',
        'Nonaktifkan PUT/DELETE kecuali benar-benar dibutuhkan API dengan auth kuat.', 'Allow: ' + allow.slice(0, 100)));
    if (!f.length) f.push(mkInfo('httpmethods','Metode aman','Allow: ' + allow.slice(0, 80)));
  } catch (e) {
    return [mkInfo('httpmethods','Tidak dapat dicek','OPTIONS tidak merespons via proxy.')];
  }
  return f;
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
  {id:'takeover', name:'Subdomain Takeover', run:mTakeover},
  {id:'wayback', name:'Arsip Wayback Machine', run:mWayback},
  {id:'dirlist', name:'Directory Listing', run:mDirlist},
  {id:'wp', name:'WordPress Hardening', run:mWp},
  {id:'sourcemap', name:'Source Map Terekspos', run:mSourcemap},
  {id:'login', name:'Form Login', run:mLogin},
  {id:'supplychain', name:'Supply Chain (Script Pihak Ketiga)', run:mSupplychain},
  {id:'openredirect', name:'Open Redirect (Pola)', run:mOpenredirect},
  {id:'graphql', name:'GraphQL Introspection', run:mGraphql},
  {id:'apidocs', name:'Dokumentasi API', run:mApidocs},
  {id:'httpmethods', name:'HTTP Methods', run:mHttpmethods},
];

function mk(module, severity, title, description, impact, remediation, evidence) {
  return {module, severity, title, description, impact, remediation, evidence: evidence || ''};
}
function mkInfo(module, title, description) {
  return {module, severity:'info', title, description, impact:'-', remediation:'-', evidence:''};
}

async function runScan(target, onProg) {
  const ctx = {host: target.host, origin: target.origin, isHttps: target.origin.startsWith('https'), page: null, libs: [], scripts: [], cookieNames: [], techs: [], ctRows: null, findings: []};
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
  L.push('**Ringkasan:** ' + execSummary(res));
  L.push('');
  for (const f of res.findings.filter((x) => x.severity !== 'info')) {
    L.push(`## [${f.severity.toUpperCase()}] ${f.title}`);
    L.push('**Temuan:** ' + f.description);
    L.push('**Skenario:** ' + f.impact);
    L.push('**Perbaikan:** ' + f.remediation);
    const atk = attackerFor(f.module, f.title);
    if (atk) L.push('**Teknik attacker:** ' + atk.technique + (atk.tools.length ? ' (tools umum: ' + atk.tools.join(', ') + ')' : ''));
    if (f.evidence) L.push('**Bukti:** `' + f.evidence.slice(0, 200) + '`');
    L.push('');
  }
  L.push('_Dipindai via Website Security Scanner (adip-tools) — 100% client-side, 25 modul aktif + 2 limitasi ditandai jujur._');
  return L.join('\n');
}

export function render(root) {
  const box = T.out();
  let lastCooldownUntil = 0, scanning = false, curFilter = 'all', lastRes = null, lastUrl = '';

  // ---- header ----
  function footerInfoText() {
    return '25 modul aktif • 2 limitasi ditandai jujur (HSTS preload, versi TLS & cipher) — tanpa fake pass';
  }
  T.show(box,
    '<div style="margin-bottom:14px">' +
    '<div style="font-size:20px;font-weight:700;margin-bottom:4px">🛡️ Website Security Scanner</div>' +
    '<div class="dim" style="font-size:13px;line-height:1.6">Pindai keamanan website: security header, DNS/email, sertifikat, secrets & file terekspos. ' +
    '25 modul jalan 100% di browser <span class="dim">(tanpa data dikirim ke server kami)</span>; 2 limitasi (HSTS preload, versi TLS & cipher) ditandai jujur.</div>' +
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

    // ringkasan eksekutif + top 3 prioritas
    const summ = execSummary(res);
    html += '<div style="font-size:12px;line-height:1.7;border:1px solid #38bdf840;background:rgba(56,189,248,.06);border-radius:10px;padding:10px 12px;margin-bottom:12px;text-align:left">' +
      '<b>📝 Ringkasan eksekutif:</b> ' + T.esc(summ) + '</div>';
    const tops = topPriorities(res.findings);
    if (tops.length) {
      html += '<div style="font-size:12px;line-height:1.7;border:1px solid #f9731650;background:rgba(249,115,22,.06);border-radius:10px;padding:10px 12px;margin-bottom:12px;text-align:left">' +
        '<b>🎯 Top 3 prioritas perbaikan:</b><ol style="margin:6px 0 0;padding-left:18px">' +
        tops.map((t) => '<li style="margin-bottom:4px"><b style="color:' + ((SEV_STYLE[t.severity] || {}).c || '#fff') + '">[' + t.severity.toUpperCase() + ']</b> ' + T.esc(t.title) +
          (t.firstStep ? '<br><span class="dim">Langkah pertama: ' + T.esc(t.firstStep) + '</span>' : '') + '</li>').join('') +
        '</ol></div>';
    }

    // filter
    html += '<div class="dim" style="font-size:11px;margin-bottom:10px">ℹ️ Section 🎯 bersifat edukatif-defensif — untuk belajar bertahan, bukan menyerang.</div>';
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
        const atk = attackerFor(f.module, f.title);
        let atkHtml = '';
        if (atk) {
          atkHtml = '<div style="margin-bottom:6px"><b>🎯 Cara Attacker Menyerang:</b> <span class="dim"><b>' +
            T.esc(atk.technique) + '</b> — ' + T.esc(atk.how) + '</span>' +
            (atk.tools.length ? '<br><span class="dim">🛠️ Tools yang umum dipakai: ' + T.esc(atk.tools.join(', ')) + '</span>' : '') +
            '</div>';
        }
        return '<details style="border:1px solid #ffffff15;border-radius:10px;margin-bottom:8px;background:#101013">' +
          '<summary style="padding:10px 12px;cursor:pointer;font-size:13px;list-style:none;display:flex;gap:8px;align-items:flex-start">' +
          '<span style="flex-shrink:0;margin-top:1px;width:8px;height:8px;border-radius:50%;background:' + st.c + '"></span>' +
          '<span><b style="color:' + st.c + ';font-size:11px">[' + st.label.toUpperCase() + ']</b> ' + T.esc(f.title) + '</span></summary>' +
          '<div style="padding:0 12px 12px 28px;font-size:12px;line-height:1.65">' +
          '<div style="margin-bottom:6px"><b>🔍 Temuan:</b> <span class="dim">' + T.esc(f.description) + '</span></div>' +
          (f.impact && f.impact !== '-' ? '<div style="margin-bottom:6px"><b>⚠️ Skenario penyalahgunaan:</b> <span class="dim">' + T.esc(f.impact) + '</span></div>' : '') +
          (f.remediation && f.remediation !== '-' ? '<div style="margin-bottom:6px"><b>🔧 Cara memperbaiki:</b> <span class="dim">' + T.esc(f.remediation) + '</span></div>' : '') +
          atkHtml +
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
