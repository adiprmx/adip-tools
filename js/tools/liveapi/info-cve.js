import { h as T, esc, errBox } from '../../core.js';

// Detail kerentanan CVE lewat NVD NIST (tanpa key).
// Terverifikasi 18 Nov 2026: services.nvd.nist.gov/rest/json/cves/2.0 200, CORS *.
// Tanpa key, batasnya rendah (5 permintaan per 30 detik): satu pencarian
// per klik, dan batas itu ditulis di UI.
const API = 'https://services.nvd.nist.gov/rest/json/cves/2.0';

async function getJSON(url) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 15000);
  try {
    const r = await fetch(url, { signal: c.signal });
    if (r.status === 429) throw new Error('rate-limit');
    if (!r.ok) throw new Error('http ' + r.status);
    return await r.json();
  } finally { clearTimeout(t); }
}

function tglCantik(s) {
  if (!s) return '';
  const d = new Date(s);
  if (isNaN(d)) return String(s).slice(0, 10);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

function skorCvss(metrics) {
  if (!metrics) return null;
  const v31 = metrics.cvssMetricV31 && metrics.cvssMetricV31[0];
  if (v31 && v31.cvssData) return { versi: 'CVSS 3.1', skor: v31.cvssData.baseScore, tingkat: v31.cvssData.baseSeverity, vektor: v31.cvssData.vectorString };
  const v30 = metrics.cvssMetricV30 && metrics.cvssMetricV30[0];
  if (v30 && v30.cvssData) return { versi: 'CVSS 3.0', skor: v30.cvssData.baseScore, tingkat: v30.cvssData.baseSeverity, vektor: v30.cvssData.vectorString };
  const v2 = metrics.cvssMetricV2 && metrics.cvssMetricV2[0];
  if (v2 && v2.cvssData) return { versi: 'CVSS 2.0', skor: v2.cvssData.baseScore, tingkat: v2.baseSeverity, vektor: v2.cvssData.vectorString };
  return null;
}

const tautanAman = (u) => typeof u === 'string' && u.indexOf('https://') === 0;

export const meta = {"id": "info-cve", "name": "Info CVE", "cat": "liveapi", "icon": "🛡️", "desc": "Lihat detail kerentanan keamanan (CVE) dari basis data NIST: skor, deskripsi, dan referensinya.", "keywords": "cve,kerentanan,vulnerability,nvd,nist,keamanan,skor cvss,exploit", "since": "6.17.0"};

export function render(root) {
  const box = T.out();
  const inp = T.input('text', 'Contoh: CVE-2021-44228', 'CVE-2021-44228');
  inp.setAttribute('autocomplete', 'off');

  const gagal = (pesan) => {
    T.show(box, errBox(pesan));
    const w = T.el('<div style="margin-top:8px"></div>');
    w.appendChild(T.btn('Coba lagi', cari));
    box.appendChild(w);
  };

  const cari = async () => {
    const id = String(inp.value || '').trim().toUpperCase();
    if (!/^CVE-\d{4}-\d{4,}$/.test(id)) {
      T.show(box, errBox('Tulis ID CVE yang benar, contoh: CVE-2021-44228 (huruf CVE, tahun, lalu nomor).'));
      return;
    }
    T.show(box, '<p class="mut">Mencari ' + esc(id) + ' di basis data NVD…</p>');
    try {
      const j = await getJSON(API + '?cveId=' + encodeURIComponent(id));
      const v = j && Array.isArray(j.vulnerabilities) && j.vulnerabilities.length ? j.vulnerabilities[0].cve : null;
      if (!v) {
        T.show(box, '<p class="center dim">CVE itu tidak ditemukan di basis data NVD. Periksa ID-nya, atau CVE itu memang belum diterbitkan.</p>');
        return;
      }
      const desk = Array.isArray(v.descriptions) ? (v.descriptions.find((d) => d.lang === 'en') || v.descriptions[0]) : null;
      const skor = skorCvss(v.metrics);
      const kelemahan = Array.isArray(v.weaknesses) ? v.weaknesses.flatMap((w) => Array.isArray(w.description) ? w.description : []).map((d) => d.value).filter(Boolean) : [];
      const refs = Array.isArray(v.references) ? v.references.slice(0, 5) : [];
      T.show(box, '<div class="center"><div style="font-weight:800;font-size:16px">' + esc(String(v.id)) + '</div>' +
        '<div class="dim" style="font-size:12.5px;margin-top:4px">Diterbitkan ' + esc(tglCantik(v.published)) +
        (v.lastModified ? ' · diubah ' + esc(tglCantik(v.lastModified)) : '') +
        (v.vulnStatus ? ' · status ' + esc(String(v.vulnStatus)) : '') + '</div></div>' +
        (skor ? '<div class="kv"><span class="k">Skor keparahan (' + esc(skor.versi) + ')</span><span class="v" style="font-size:18px;font-weight:800">' + esc(String(skor.skor)) + ' / 10<br><span class="hint" style="font-size:12px;font-weight:400">' + esc(String(skor.tingkat || '')) + '</span></span></div>' : '<p class="hint" style="margin-top:10px">Belum ada skor keparahan untuk CVE ini.</p>') +
        (desk && desk.value ? '<p style="font-size:13.5px;line-height:1.6;margin-top:12px">' + esc(String(desk.value)) + '</p>' : '') +
        (kelemahan.length ? '<div class="kv"><span class="k">Jenis kelemahan</span><span class="v">' + kelemahan.map(esc).join(', ') + '</span></div>' : '') +
        (refs.length ? '<p class="hint" style="margin-top:12px">Referensi:</p><ul style="font-size:12.5px;line-height:1.6;padding-left:18px;margin-top:4px">' +
          refs.map((r) => '<li>' + (tautanAman(r.url) ? '<a href="' + esc(r.url) + '" target="_blank" rel="noopener">' + esc(String(r.url)) + '</a>' : esc(String(r.url || ''))) + '</li>').join('') + '</ul>' : '') +
        '<p class="hint">Sumber: NVD (National Vulnerability Database), NIST Amerika Serikat. Deskripsi berbahasa Inggris.</p>');
    } catch (e) {
      if (e.message === 'rate-limit') {
        T.show(box, errBox('Batas permintaan tercapai (tanpa kunci API, NVD hanya mengizinkan 5 pencarian per 30 detik). Tunggu sebentar lalu coba lagi.'));
        return;
      }
      gagal(e.name === 'AbortError'
        ? 'Waktu habis, server NVD tidak merespons dalam 15 detik.'
        : 'Pencarian gagal. Cek koneksi internet, lalu coba lagi.');
    }
  };

  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') cari(); });
  root.appendChild(T.el('<p class="note">Cari detail kerentanan keamanan dari ID CVE-nya. Tanpa kunci API, layanan NVD membatasi 5 pencarian per 30 detik, jadi tunggu sebentar antar pencarian.</p>'));
  root.appendChild(T.field('ID CVE', inp, 'Contoh: CVE-2021-44228 (Log4Shell)'));
  root.appendChild(T.row(T.btn('Cari CVE', cari, true)));
  root.appendChild(box);
}
