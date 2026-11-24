#!/usr/bin/env python3
"""Verifikasi data platform "Cek Username" terhadap KONTRAK DATA FINAL S-B11.

Ronde v6.23.0 Adip Tools — dibuat S-Q5, diperbarui S-B15 (Q3-01 + Q3-02 +
Q3-03) dan S-B16 (Q3b-02: placeholder {u} wajib di path/query). Persisten: dipakai S-A4/S-A4b sebagai gerbang build-time SEBELUM
data final masuk repo (S-B11 §3.3), dan tersambung ke `npm run check`
(Q3-03 — salinan di repo: scripts/verify-platform-data.py; salinan di
workspace ronde ini WAJIB identik isinya dengan salinan repo).

Pemakaian:
  python3 verify-platform-data.py [MODUL] [--allowlist FILE.json]
      [--known FILE.json] [--json] [--quiet]
  MODUL default: js/cek-username-platforms.js di repo (dicari relatif
  terhadap lokasi skrip ini, lalu di path VM baku).

Modul dibaca via Node (import ESM asli, bukan regex) lalu divalidasi di sini.
Node WAJIB ada; bila Node gagal mengimpor modul, skrip exit 2 (bukan lolos).

Kontrak yang ditegakkan (S-B11 §3.1–§3.3 + S-B15 + S-B18):
  * SEMUA entri: name string non-kosong; url string https dengan TEPAT SATU
    {u} di path/query — WAJIB muncul SEBELUM karakter '#' pertama (Q3b-02,
    S-B16: {u} yang hanya di fragment tidak pernah terkirim ke server,
    sehingga fetch ke URL tanpa username + respons 200 dibaca "Ada" untuk
    username apa pun); TIDAK di host; tanpa userinfo; tanpa port
    eksplisit; host bertitik; category string non-kosong; check auto/manual;
    domain string bertitik dan COCOK dengan host pola url.
  * url adalah tautan PROFIL (halaman web manusia), BUKAN endpoint mesin
    (F1 S-B12, S-B18): host berlabel api/graphql/login/signup/mapi atau
    api[v0-9]+, segmen path bertoken api/ajax/mapi, atau segmen bertoken
    json/xml = pelanggaran URL_API_ENDPOINT. Aturan ini TIDAK berlaku
    untuk checkUrl (checkUrl memang endpoint API).
  * check:"auto": checkUrl wajib (aturan pola sama seperti url — termasuk
    {u} WAJIB di path/query, kode CHECKURL_PLACEHOLDER_FRAGMENT) + apiDomain
    wajib bertitik dan COCOK dengan host checkUrl + COCOK dengan domain
    profil entri (Q3-01: apiDomain wajib sama/subdomain dari domain).
  * check:"manual": TIDAK BOLEH membawa checkUrl/apiDomain.
  * domain/apiDomain/host pola BUKAN IP literal dalam bentuk apa pun
    (Q3-02: desimal, heksa 0x.., oktal, integer, IPv6).
  * Tanpa duplikat nama (case-insensitive) dan tanpa duplikat domain.
  * Nama platform terkenal dengan domain berbeda = FLAG (phishing tersimpan
    B10-03; runtime TIDAK BISA mendeteksinya). Peta nama->domain bawaan
    minimal (12 stub + platform umum); tambah via --known (JSON
    {"Nama": "domain.com"}).
  * Allowlist host checkUrl (§3.3.2): bila --allowlist diberi (JSON daftar
    host, atau objek {"hosts": [...]}), host di luar daftar = pelanggaran.
    Tanpa allowlist, host checkUrl dilaporkan di bagian "butuh review
    manusia" (bukan pelanggaran). `npm run check` SELALU memakai allowlist
    scripts/cek-username-checkurl-allowlist.json.

Exit code: 0 = 0 pelanggaran (peringatan tidak menggagalkan),
           1 = ada pelanggaran, 2 = modul tidak bisa dimuat / argumen salah.
"""
import json
import re
import subprocess
import sys
import tempfile
from collections import Counter
from pathlib import Path
from urllib.parse import urlparse

_HERE = Path(__file__).resolve().parent
# Modul default: salinan di repo scripts/ -> ../js/...; salinan di workspace
# ronde -> path VM baku. Kedua salinan file ini WAJIB identik isinya.
_CANDIDATES = [
    _HERE.parent / "js" / "cek-username-platforms.js",
    Path.home() / "workspace/projects/adip-tools/js/cek-username-platforms.js",
]
REPO_DEFAULT = next((p for p in _CANDIDATES if p.exists()), _CANDIDATES[0])

# Peta nama -> domain yang diharapkan, untuk platform terkenal (§3.3.3).
# Minimal dan konservatif: hanya nama yang domain kanonisnya tidak ambigu.
# Data final S-A4 WAJIB memperluas ini (atau via --known) sebelum rilis.
KNOWN = {
    "github": "github.com",
    "reddit": "reddit.com",
    "youtube": "youtube.com",
    "instagram": "instagram.com",
    "tiktok": "tiktok.com",
    "x": "x.com",
    "twitch": "twitch.tv",
    "gitlab": "gitlab.com",
    "medium": "medium.com",
    "telegram": "t.me",
    "steam": "steamcommunity.com",
    "pinterest": "pinterest.com",
    "facebook": "facebook.com",
    "linkedin": "linkedin.com",
    "snapchat": "snapchat.com",
    "discord": "discord.com",
    "tumblr": "tumblr.com",
    "flickr": "flickr.com",
    "vimeo": "vimeo.com",
    "dailymotion": "dailymotion.com",
    "soundcloud": "soundcloud.com",
    "behance": "behance.net",
    "dribbble": "dribbble.com",
    "deviantart": "deviantart.com",
    "quora": "quora.com",
    "stackoverflow": "stackoverflow.com",
    "stack overflow": "stackoverflow.com",
    "whatsapp": "wa.me",
    "bluesky": "bsky.app",
    "truth social": "truthsocial.com",
    "gettr": "gettr.com",
}

# Public suffix umum (bukan daftar lengkap PSL — cukup untuk gerbang data).
PUBLIC_SUFFIXES = {
    "com", "net", "org", "edu", "gov", "mil", "int", "io", "co", "me", "tv",
    "app", "dev", "ai", "id", "co.id", "or.id", "ac.id", "github.io",
    "vercel.app", "netlify.app", "herokuapp.com", "pages.dev", "web.app",
    "firebaseapp.com", "blogspot.com", "wordpress.com", "tumblr.com",
}

NAME_MAX_LEN = 100

# Label pertama host + token path yang menandai endpoint mesin (F1 S-B12,
# diperkuat S-B18): pola `url` di kontrak adalah halaman web yang bisa
# dibaca manusia; endpoint JSON/API bukan halaman profil. Aturan ini
# HANYA berlaku untuk `url` — checkUrl entri auto MEMANG endpoint API
# (api.github.com) dan TIDAK PERNAH diperiksa dengan aturan ini.
API_HOST_LABELS = {"api", "graphql", "login", "signup", "mapi"}
API_PATH_TOKENS = {"api", "ajax", "mapi"}
MACHINE_FORMAT_TOKENS = {"json", "xml"}


def api_endpoint_reason(value):
    """Kembalikan alasan bila pola URL adalah endpoint mesin, atau None.

    Aturan (S-B18, menutup 5 pola F1 S-B12 — 0 false-positive atas 9.644
    entri tersisa, teruji atas modul penuh + seluruh input merge):
      * host_api: label pertama host (sesudah buang 'www.') adalah
        api/graphql/login/signup/mapi atau api[v0-9]+ (mapi.yummly.com;
        'api-discuss.freeagent.com' TIDAK kena — label harus persis).
      * jalur_api: segmen path yang tokennya (pisah -/_) adalah api/ajax/
        mapi atau api[v0-9]+ (interact_api, public-profile-api, /mapi/v19/;
        'capital'/'rapid' TIDAK kena — token, bukan substring).
      * endpoint_mesin: segmen path yang tokennya (pisah -/_. ) adalah
        json/xml (user_json, summary.json).
    Satu-satunya definisi aturan ini — audit/merge-sites.py memakai fungsi
    yang sama (import dari sini) supaya filter rebuild dan gerbang
    build-time tidak pernah berbeda.
    """
    if not isinstance(value, str) or not value:
        return None
    try:
        p = urlparse(value.replace("{u}", "aaa"))
    except ValueError:
        return None
    host = (p.hostname or "").lower()
    if host.startswith("www."):
        host = host[4:]
    if host:
        first = host.split(".")[0]
        if first in API_HOST_LABELS or re.fullmatch(r"api[v0-9]+", first):
            return "host_api"
    for seg in (p.path or "").split("/"):
        if not seg:
            continue
        for tok in re.split(r"[-_]", seg.lower()):
            if tok in API_PATH_TOKENS or re.fullmatch(r"api[v0-9]+", tok):
                return "jalur_api"
        for tok in re.split(r"[-_.]", seg.lower()):
            if tok in MACHINE_FORMAT_TOKENS:
                return "endpoint_mesin"
    return None

NODE_LOADER = """
import { pathToFileURL } from 'node:url';
const mod = await import(pathToFileURL(process.argv[2]).href);
const out = { stub: ('STUB' in mod) ? mod.STUB : null,
              hasPlatforms: ('PLATFORMS' in mod),
              platforms: ('PLATFORMS' in mod) ? mod.PLATFORMS : undefined };
process.stdout.write(JSON.stringify(out, (k, v) => typeof v === 'bigint' ? String(v) : v));
"""


def load_module(path):
    """Impor modul JS via Node, kembalikan dict {stub, hasPlatforms, platforms}."""
    with tempfile.NamedTemporaryFile("w", suffix=".mjs", delete=False) as f:
        f.write(NODE_LOADER)
        loader = f.name
    try:
        r = subprocess.run(
            ["node", loader, str(path)],
            capture_output=True, text=True, timeout=60,
        )
    except FileNotFoundError:
        return None, "node tidak ditemukan di PATH"
    except subprocess.TimeoutExpired:
        return None, "node timeout saat mengimpor modul"
    finally:
        Path(loader).unlink(missing_ok=True)
    if r.returncode != 0:
        return None, "node gagal mengimpor modul: " + (r.stderr.strip() or r.stdout.strip())[:500]
    try:
        return json.loads(r.stdout), None
    except json.JSONDecodeError:
        return None, "output node bukan JSON: " + r.stdout[:300]


def norm_domain(d):
    """Normalisasi deklarasi domain: lowercase, buang 'www.' di depan."""
    d = str(d).strip().lower()
    if d.startswith("www."):
        d = d[4:]
    return d


def host_cocok(host, harap):
    """Aturan yang sama dengan hostCocok() di cek-username.js (S-B11 §2.1)."""
    h = str(host or "").lower()
    d = norm_domain(harap)
    if not d:
        return False
    return h == d or h.endswith("." + d)


def is_ip_literal(value):
    """True bila string adalah IP literal dalam bentuk apa pun yang dipahami
    pemecah URL WHATWG (Q3-02, S-B15 — cermin hostAdalahIP() runtime):
      - desimal bertitik kanonis: 127.0.0.1, 192.168.1.1
      - bentuk pendek: 127.1, 1.2.3 (parser menormalisasi ke 4 oktet)
      - heksa: 0x7f000001, 0x7f.0.0.1
      - oktal: 0177.0.0.1 (angka berawalan 0 — diperlakukan sebagai
        upaya IP literal walau digitnya bukan oktal murni, mis. 08)
      - integer tunggal: 2130706433
      - IPv6: mengandung ':' (dengan/tanpa kurung siku)
    Aturan praktis: 1-4 label bertitik yang SEMUANYA numerik (desimal atau
    0x-heksa) adalah IP literal — domain sah selalu punya minimal satu
    label non-numerik ('123.com', '3m.com', '1.2.3.4.com' BUKAN IP).
    urlparse TIDAK menormalisasi bentuk non-kanonis (hostname '0x7f000001'
    tetap '0x7f000001'), jadi cek ini tidak bisa mengandalkan parser.
    """
    if not isinstance(value, str):
        return False
    v = value.strip().lower()
    if v.startswith("[") and v.endswith("]"):
        v = v[1:-1]
    if ":" in v:
        return True  # IPv6 bentuk apa pun
    parts = v.split(".")
    if not 1 <= len(parts) <= 4:
        return False
    for part in parts:
        if not part:
            return False
        if part.startswith("0x"):
            if len(part) == 2 or not all(c in "0123456789abcdef" for c in part[2:]):
                return False
        elif not part.isdigit():
            return False
    return True


def check_domain_decl(value, code_prefix, label, problems):
    """Validasi satu deklarasi domain (domain / apiDomain). Kembalikan bool sah."""
    if not isinstance(value, str):
        problems.append((code_prefix + "_NOT_STRING", f"{label} bukan string: {value!r}"))
        return False
    if not value.strip():
        problems.append((code_prefix + "_EMPTY", f"{label} kosong"))
        return False
    if value != value.strip() or any(c.isspace() for c in value):
        problems.append((code_prefix + "_WHITESPACE", f"{label} mengandung spasi: {value!r}"))
        return False
    if any(ord(c) > 127 for c in value):
        problems.append((code_prefix + "_NON_ASCII", f"{label} mengandung karakter non-ASCII: {value!r}"))
        return False
    if not re.fullmatch(r"[A-Za-z0-9.-]+", value):
        problems.append((code_prefix + "_BAD_CHARS", f"{label} mengandung karakter ilegal: {value!r}"))
        return False
    # Q3-02 (S-B15): IP literal bukan domain — di semua bentuk WHATWG.
    # Dicek SEBELUM NO_DOT supaya '2130706433' (integer, tanpa titik) ikut
    # tertangkap dengan kode yang menjelaskan penyebabnya.
    if is_ip_literal(value):
        problems.append((code_prefix + "_IP_LITERAL", f"{label} adalah IP literal, bukan domain: {value!r}"))
        return False
    d = norm_domain(value)
    if "." not in d:
        problems.append((code_prefix + "_NO_DOT", f"{label} tidak mengandung titik (TLD telanjang): {value!r}"))
        return False
    if d.startswith(".") or d.endswith(".") or ".." in d:
        problems.append((code_prefix + "_DOT_EDGE", f"{label} titik di ujung/ganda: {value!r}"))
        return False
    if d in PUBLIC_SUFFIXES:
        problems.append((code_prefix + "_PUBLIC_SUFFIX", f"{label} adalah public suffix: {value!r}"))
        return False
    return True


def check_pattern(value, code_prefix, label, problems):
    """Validasi satu pola URL (url / checkUrl). Kembalikan hostname atau None.

    Aturan: string, https, tepat satu {u}, {u} di path/query (WAJIB sebelum
    '#' pertama — {u} hanya di fragment DITOLAK, Q3b-02/S-B16), {u} tidak
    di host, tanpa userinfo, tanpa port eksplisit, host bertitik ASCII,
    tanpa backslash/spasi.
    """
    if not isinstance(value, str):
        problems.append((code_prefix + "_NOT_STRING", f"{label} bukan string: {value!r}"))
        return None
    if not value:
        problems.append((code_prefix + "_EMPTY", f"{label} kosong"))
        return None
    if any(c <= " " for c in value):
        problems.append((code_prefix + "_WHITESPACE", f"{label} mengandung spasi/kontrol: {value!r}"))
        return None
    if "\\" in value:
        problems.append((code_prefix + "_BACKSLASH", f"{label} mengandung backslash: {value!r}"))
        return None
    n = value.count("{u}")
    if n != 1:
        problems.append((code_prefix + "_PLACEHOLDER",
                         f"{label} mengandung {{u}} sebanyak {n} (wajib tepat 1): {value!r}"))
        return None
    # Q3b-02 (S-B16): {u} WAJIB di path/query — {u} yang hanya muncul sesudah
    # '#' (di fragment) tidak pernah terkirim ke server, sehingga fetch ke
    # URL tanpa username + respons 200 dibaca "Ada" untuk username apa pun
    # (jawaban palsu universal). Fragment sesudah {u} tetap sah.
    i_hash = value.find("#")
    if i_hash != -1 and value.find("{u}") > i_hash:
        problems.append((code_prefix + "_PLACEHOLDER_FRAGMENT",
                         f"{label} placeholder {{u}} hanya di fragment (sesudah '#') — username tidak terkirim: {value!r}"))
        return None
    try:
        p = urlparse(value.replace("{u}", "aaa"))
    except ValueError as e:
        problems.append((code_prefix + "_UNPARSEABLE", f"{label} tidak bisa diparse: {value!r} ({e})"))
        return None
    if p.scheme != "https":
        problems.append((code_prefix + "_SCHEME", f"{label} skema bukan https: {value!r}"))
        return None
    if p.username or p.password:
        problems.append((code_prefix + "_USERINFO", f"{label} mengandung userinfo: {value!r}"))
        return None
    try:
        port = p.port
    except ValueError:
        problems.append((code_prefix + "_PORT_INVALID", f"{label} port tidak valid: {value!r}"))
        return None
    if port is not None:
        problems.append((code_prefix + "_PORT", f"{label} mengandung port eksplisit :{port}: {value!r}"))
        return None
    host = (p.hostname or "")
    if not host:
        problems.append((code_prefix + "_NO_HOST", f"{label} tanpa host: {value!r}"))
        return None
    # Q3-02 (S-B15): host pola IP literal — urlparse tidak menormalisasi
    # bentuk heksa ('0x7f000001' tetap begitu), jadi is_ip_literal yang
    # menanganinya (browser menormalisasinya ke 127.0.0.1 saat fetch).
    if is_ip_literal(host):
        problems.append((code_prefix + "_HOST_IP_LITERAL", f"{label} host adalah IP literal: {value!r}"))
        return None
    if any(ord(c) > 127 for c in host):
        problems.append((code_prefix + "_HOST_NON_ASCII", f"{label} host non-ASCII: {value!r}"))
        return None
    if "." not in host:
        problems.append((code_prefix + "_HOST_NO_DOT", f"{label} host tidak bertitik: {value!r}"))
        return None
    # {u} tidak boleh di host: ganti dengan dua token berbeda, host harus sama.
    try:
        h2 = urlparse(value.replace("{u}", "bbb")).hostname or ""
    except ValueError:
        problems.append((code_prefix + "_UNPARSEABLE", f"{label} tidak bisa diparse: {value!r}"))
        return None
    if h2 != host:
        problems.append((code_prefix + "_HOST_PLACEHOLDER",
                         f"{label} placeholder {{u}} berada di host: {value!r}"))
        return None
    return host


def validate_entry(p, idx, known, allowlist):
    """Validasi satu entri. Kembalikan (pelanggaran, peringatan)."""
    problems, warnings = [], []
    label = f"entri[{idx}]"
    if not isinstance(p, dict):
        return [(f"ENTRY_NOT_OBJECT", f"{label}: entri bukan objek: {p!r}")], []
    nm = p.get("name")
    label = f"entri[{idx}] name={nm!r}"

    # --- name ---
    if "name" not in p:
        problems.append(("NAME_MISSING", f"{label}: field name hilang"))
    elif not isinstance(nm, str):
        problems.append(("NAME_NOT_STRING", f"{label}: name bukan string: {nm!r}"))
    elif not nm.strip():
        problems.append(("NAME_EMPTY", f"{label}: name kosong"))
    else:
        if "<" in nm or ">" in nm:
            problems.append(("NAME_MARKUP", f"{label}: name mengandung markup <...>: {nm!r}"))
        if any(ord(c) in (0x202A, 0x202B, 0x202C, 0x202D, 0x202E, 0x2066, 0x2067, 0x2068, 0x2069) for c in nm):
            problems.append(("NAME_BIDI", f"{label}: name mengandung karakter bidi override: {nm!r}"))
        if any(ord(c) < 32 for c in nm):
            problems.append(("NAME_CONTROL", f"{label}: name mengandung karakter kontrol"))
        if len(nm) > NAME_MAX_LEN:
            problems.append(("NAME_TOO_LONG", f"{label}: name {len(nm)} karakter (> {NAME_MAX_LEN})"))
        if nm in ("__proto__", "constructor", "prototype"):
            warnings.append(("NAME_DANGEROUS_KEY", f"{label}: name adalah kunci JS berbahaya ({nm!r}) — periksa pemakaian sebagai kunci objek"))

    # --- url ---
    host_url = None
    if "url" not in p:
        problems.append(("URL_MISSING", f"{label}: field url hilang"))
    else:
        host_url = check_pattern(p["url"], "URL", "url", problems)
        if isinstance(p.get("url"), str) and ("/../" in p["url"] or "%2e" in p["url"].lower() or "/%2e%2e" in p["url"].lower()):
            warnings.append(("URL_PATH_TRAVERSAL", f"{label}: url mengandung segmen .. / %2e: {p['url']!r}"))
        # F1 S-B12 / S-B18: url adalah tautan PROFIL (halaman web manusia),
        # bukan endpoint mesin — endpoint JSON/API ditolak di sini (gerbang
        # build-time; filter merge memakai fungsi yang sama). checkUrl
        # TIDAK diperiksa aturan ini (checkUrl memang endpoint API).
        if isinstance(p.get("url"), str):
            alasan_api = api_endpoint_reason(p["url"])
            if alasan_api:
                problems.append(("URL_API_ENDPOINT",
                                 f"{label}: url adalah endpoint mesin ({alasan_api}), bukan halaman profil: {p['url']!r}"))

    # --- category ---
    if "category" not in p:
        problems.append(("CATEGORY_MISSING", f"{label}: field category hilang"))
    elif not isinstance(p["category"], str):
        problems.append(("CATEGORY_NOT_STRING", f"{label}: category bukan string: {p['category']!r} (runtime me-coerce, data final wajib string)"))
    elif not p["category"].strip():
        problems.append(("CATEGORY_EMPTY", f"{label}: category kosong (runtime memakai 'Lainnya', data final wajib mengisi)"))
    elif "<" in p["category"] or ">" in p["category"]:
        problems.append(("CATEGORY_MARKUP", f"{label}: category mengandung markup <...>: {p['category']!r}"))

    # --- check ---
    check = p.get("check")
    if "check" not in p:
        problems.append(("CHECK_MISSING", f"{label}: field check hilang"))
    elif check not in ("auto", "manual"):
        problems.append(("CHECK_INVALID", f"{label}: check bukan 'auto'/'manual': {check!r} (runtime memperlakukannya manual)"))

    # --- domain ---
    domain_ok = False
    if "domain" not in p:
        problems.append(("DOMAIN_MISSING", f"{label}: field domain hilang"))
    else:
        domain_ok = check_domain_decl(p["domain"], "DOMAIN", "domain", problems)
    if host_url and domain_ok and not host_cocok(host_url, p["domain"]):
        problems.append(("DOMAIN_MISMATCH",
                         f"{label}: host pola url '{host_url}' tidak cocok dengan domain deklarasi '{p['domain']}'"))

    # --- konsistensi nama <-> domain (platform terkenal, §3.3.3) ---
    if isinstance(nm, str) and isinstance(p.get("domain"), str):
        harap = known.get(nm.strip().lower())
        if harap and norm_domain(p["domain"]) != norm_domain(harap):
            problems.append(("NAME_DOMAIN_MISMATCH",
                             f"{label}: nama platform terkenal '{nm}' tapi domain '{p['domain']}' (yang diharapkan: {harap}) — PHISHING TERSIMPAN"))

    # --- auto vs manual ---
    if check == "auto":
        host_api = None
        if "checkUrl" not in p:
            problems.append(("CHECKURL_MISSING", f"{label}: entri auto tanpa checkUrl"))
        else:
            host_api = check_pattern(p["checkUrl"], "CHECKURL", "checkUrl", problems)
        api_ok = False
        if "apiDomain" not in p:
            problems.append(("APIDOMAIN_MISSING",
                             f"{label}: entri auto tanpa apiDomain (runtime TIDAK PERNAH me-fetch-nya)"))
        else:
            api_ok = check_domain_decl(p["apiDomain"], "APIDOMAIN", "apiDomain", problems)
        if host_api and api_ok and not host_cocok(host_api, p["apiDomain"]):
            problems.append(("APIDOMAIN_MISMATCH",
                             f"{label}: host checkUrl '{host_api}' tidak cocok dengan apiDomain '{p['apiDomain']}'"))
        # Q3-01 (S-B15): apiDomain WAJIB cocok dengan domain profil entri
        # yang sama — aturan yang sama seperti runtime (urlCek). Tanpa ini,
        # entri boleh mendeklarasikan profil github.com + API
        # evil.example.com dan lolos gerbang build-time (exit 0).
        if domain_ok and api_ok and not host_cocok(p["apiDomain"], p["domain"]):
            problems.append(("APIDOMAIN_DOMAIN_MISMATCH",
                             f"{label}: apiDomain '{p['apiDomain']}' tidak cocok dengan domain profil '{p['domain']}' — apiDomain wajib sama/subdomain dari domain"))
        if host_api and allowlist is not None and host_api.lower() not in allowlist:
            problems.append(("CHECKURL_HOST_NOT_ALLOWLISTED",
                             f"{label}: host checkUrl '{host_api}' tidak ada di allowlist"))
    elif check == "manual":
        if "checkUrl" in p:
            problems.append(("MANUAL_HAS_CHECKURL", f"{label}: entri manual membawa checkUrl (kontrak: tidak boleh)"))
        if "apiDomain" in p:
            problems.append(("MANUAL_HAS_APIDOMAIN", f"{label}: entri manual membawa apiDomain (kontrak: tidak boleh)"))
    return problems, warnings


def main(argv):
    import argparse
    ap = argparse.ArgumentParser(description="Verifikasi data platform Cek Username (kontrak S-B11).")
    ap.add_argument("modul", nargs="?", default=str(REPO_DEFAULT), help="path modul JS data platform")
    ap.add_argument("--allowlist", help="JSON daftar host checkUrl yang diizinkan")
    ap.add_argument("--known", help="JSON tambahan peta nama->domain platform terkenal")
    ap.add_argument("--json", action="store_true", help="keluarkan laporan JSON")
    ap.add_argument("--quiet", action="store_true", help="hanya ringkasan + pelanggaran")
    args = ap.parse_args(argv)

    known = dict(KNOWN)
    if args.known:
        try:
            extra = json.loads(Path(args.known).read_text())
            known.update({str(k).lower(): str(v) for k, v in extra.items()})
        except Exception as e:
            print(f"ERROR: tidak bisa membaca --known: {e}", file=sys.stderr)
            return 2
    allowlist = None
    if args.allowlist:
        try:
            raw = json.loads(Path(args.allowlist).read_text())
            # Format: daftar host mentah ["api.github.com", ...] ATAU objek
            # {"hosts": [...], "_catatan": "..."} (format file repo).
            hosts = raw["hosts"] if isinstance(raw, dict) else raw
            allowlist = {str(h).lower() for h in hosts}
        except Exception as e:
            print(f"ERROR: tidak bisa membaca --allowlist: {e}", file=sys.stderr)
            return 2

    path = Path(args.modul)
    if not path.exists():
        print(f"ERROR: modul tidak ada: {path}", file=sys.stderr)
        return 2
    data, err = load_module(path)
    if err:
        print(f"ERROR: {err}", file=sys.stderr)
        return 2

    violations, warnings = [], []  # (kode, detail, idx)
    counts = Counter()
    if not data.get("hasPlatforms"):
        violations.append(("PLATFORMS_MISSING", "modul tidak mengekspor PLATFORMS", -1))
        platforms = None
    else:
        platforms = data.get("platforms")
    if platforms is None and data.get("hasPlatforms"):
        # PLATFORMS null (D5): JSON null -> None; null BUKAN array.
        violations.append(("PLATFORMS_NOT_ARRAY",
                           "PLATFORMS bernilai null (bukan array)", -1))
        platforms = None
    elif platforms is not None and not isinstance(platforms, list):
        violations.append(("PLATFORMS_NOT_ARRAY",
                           f"PLATFORMS bukan array: {type(platforms).__name__} ({str(platforms)[:200]!r})", -1))
        platforms = None
    if isinstance(platforms, list) and len(platforms) == 0:
        # Array kosong sah di runtime (tool hidup, 0 platform — D12), tapi
        # sebagai DATA FINAL itu dataset rusak: gerbang build-time menolaknya.
        violations.append(("PLATFORMS_EMPTY", "PLATFORMS array kosong (0 entri)", -1))

    total = len(platforms) if isinstance(platforms, list) else 0
    invalid_idx = set()
    seen_name, seen_domain = {}, {}
    checkurl_hosts = Counter()
    if isinstance(platforms, list):
        for i, p in enumerate(platforms):
            probs, warns = validate_entry(p, i, known, allowlist)
            for code, det in probs:
                violations.append((code, det, i))
                invalid_idx.add(i)
            for code, det in warns:
                warnings.append((code, det, i))
            if isinstance(p, dict):
                counts["auto" if p.get("check") == "auto" else "manual"] += 1
                if isinstance(p.get("category"), str) and p["category"].strip():
                    counts["cat:" + p["category"].strip()] += 1
                if isinstance(p.get("name"), str) and p["name"].strip():
                    key = p["name"].strip().lower()
                    if key in seen_name:
                        violations.append(("NAME_DUP",
                                           f"entri[{i}] name={p['name']!r}: duplikat nama entri[{seen_name[key]}] (case-insensitive)", i))
                        invalid_idx.add(i)
                    else:
                        seen_name[key] = i
                if isinstance(p.get("domain"), str) and p["domain"].strip():
                    key = norm_domain(p["domain"])
                    if key in seen_domain:
                        violations.append(("DOMAIN_DUP",
                                           f"entri[{i}] name={p.get('name')!r}: duplikat domain '{p['domain']}' dengan entri[{seen_domain[key]}]", i))
                        invalid_idx.add(i)
                    else:
                        seen_domain[key] = i
                if p.get("check") == "auto" and isinstance(p.get("checkUrl"), str):
                    try:
                        h = urlparse(p["checkUrl"].replace("{u}", "aaa")).hostname
                        if h:
                            checkurl_hosts[h.lower()] += 1
                    except ValueError:
                        pass

    by_code = Counter(c for c, _, _ in violations)
    by_code_warn = Counter(c for c, _, _ in warnings)
    report = {
        "modul": str(path),
        "stub": data.get("stub"),
        "total_entri": total,
        "auto": counts.get("auto", 0),
        "manual": counts.get("manual", 0),
        "kategori": {k[4:]: v for k, v in counts.items() if k.startswith("cat:")},
        "entri_valid": total - len(invalid_idx),
        "entri_melanggar": len(invalid_idx),
        "pelanggaran": len(violations),
        "pelanggaran_per_kode": dict(by_code),
        "peringatan": len(warnings),
        "peringatan_per_kode": dict(by_code_warn),
        "host_checkurl": dict(checkurl_hosts),
        "allowlist_dipakai": allowlist is not None,
    }
    if args.json:
        report["daftar_pelanggaran"] = [{"kode": c, "detail": d, "indeks": i} for c, d, i in violations]
        report["daftar_peringatan"] = [{"kode": c, "detail": d, "indeks": i} for c, d, i in warnings]
        print(json.dumps(report, ensure_ascii=False, indent=2))
        return 1 if violations else 0

    print(f"Modul: {path}")
    print(f"STUB: {data.get('stub')} {'(DATA SEMENTARA — bukan data final)' if data.get('stub') is True else ''}")
    print(f"Total entri: {total}  |  auto: {counts.get('auto', 0)}  |  manual: {counts.get('manual', 0)}")
    if report["kategori"]:
        print("Per kategori: " + ", ".join(f"{k}={v}" for k, v in sorted(report["kategori"].items())))
    print(f"Entri valid: {report['entri_valid']}  |  entri melanggar: {report['entri_melanggar']}")
    print(f"Pelanggaran: {len(violations)}  |  peringatan: {len(warnings)}")
    if by_code:
        print("Per kode: " + ", ".join(f"{k}={v}" for k, v in sorted(by_code.items())))
    if checkurl_hosts:
        print("Host checkUrl: " + ", ".join(f"{h}×{n}" for h, n in sorted(checkurl_hosts.items())))
        if allowlist is None:
            print("  (tanpa --allowlist: host di atas BUTUH REVIEW MANUSIA per §3.3.2, bukan pelanggaran otomatis)")
    if violations:
        print("\n--- PELANGGARAN ---")
        for code, det, _ in violations:
            print(f"[{code}] {det}")
    if warnings and not args.quiet:
        print("\n--- PERINGATAN (tidak menggagalkan) ---")
        for code, det, _ in warnings:
            print(f"[{code}] {det}")
    print("\n" + ("HASIL: LOLOS — 0 pelanggaran" if not violations
                  else f"HASIL: GAGAL — {len(violations)} pelanggaran pada {len(invalid_idx)} entri"))
    return 1 if violations else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
