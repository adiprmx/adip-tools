import { h as T, esc, errBox, utils } from '../../core.js';

// Info domain lewat RDAP (pengganti WHOIS modern), tanpa key.
// Terverifikasi 17 Nov 2026: https://rdap.org/domain/google.com -> 200, CORS *.
// rdap.org mengalihkan ke server RDAP resmi pemilik domain (302); fetch
// browser mengikuti pengalihan itu otomatis.
export const meta = {"id":"info-domain-rdap","name":"Info Domain RDAP","cat":"liveapi","icon":"🌐","desc":"Lihat siapa pendaftar sebuah domain, kapan didaftarkan, dan kapan kedaluwarsanya.","keywords":"domain,rdap,whois,pendaftar,domain info,cek domain,kedaluwarsa","since":"6.17.0"};

async function getJSON(url) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 15000);
  try {
    const r = await fetch(url, { signal: c.signal });
    if (r.status === 404) throw new Error('not-found');
    if (!r.ok) throw new Error('http ' + r.status);
    return await r.json();
  } finally { clearTimeout(t); }
}

// tglCantik kanonis tinggal di utils (core.js) — dipakai dengan
// { bulan: 'long' }.

// vCardArray RDAP: ["vcard", [["fn", {}, "text", "Nama"], ...]]
function namaDariVcard(ent) {
  try {
    const props = ent && ent.vcardArray && ent.vcardArray[1];
    if (!Array.isArray(props)) return '';
    const fn = props.find((p) => p && p[0] === 'fn');
    return fn && fn[3] ? String(fn[3]) : '';
  } catch (e) { return ''; }
}

export function render(root) {
  const box = T.out();
  const inp = T.input('text', 'Contoh: google.com atau kompas.com');
  inp.setAttribute('autocomplete', 'off');
  inp.setAttribute('autocapitalize', 'off');

  const cari = async () => {
    const d = String(inp.value || '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    if (!d || d.indexOf('.') < 0) { T.show(box, errBox('Tulis nama domain yang benar, contoh: google.com')); return; }
    T.show(box, '<p class="mut">Mencari info domain ' + esc(d) + '…</p>');
    try {
      const j = await getJSON('https://rdap.org/domain/' + encodeURIComponent(d));
      if (!j || j.objectClassName !== 'domain') throw new Error('bad-data');
      const events = {};
      (j.events || []).forEach((e) => { if (e && e.eventAction && e.eventDate) events[e.eventAction] = e.eventDate; });
      const pendaftar = (j.entities || []).map(namaDariVcard).filter(Boolean);
      const ns = (j.nameservers || []).map((n) => n.ldhName).filter(Boolean);
      const status = (j.status || []).map((s) => String(s).replace(/_/g, ' '));
      T.show(box,
        '<div class="center"><div style="font-weight:800;font-size:18px;word-break:break-all">' + esc(j.ldhName || d) + '</div>' +
        (status.length ? '<div class="dim" style="font-size:12.5px;margin-top:4px">Status: ' + esc(status.join(', ')) + '</div>' : '') + '</div>' +
        '<div style="margin-top:12px">' +
        (pendaftar.length ? '<div class="kv"><span class="k">Pendaftar</span><span class="v">' + esc(pendaftar[0]) + '</span></div>' : '') +
        (events.registration ? '<div class="kv"><span class="k">Didaftarkan</span><span class="v">' + esc(utils.tglCantik(events.registration, { bulan: 'long' })) + '</span></div>' : '') +
        (events.expiration ? '<div class="kv"><span class="k">Kedaluwarsa</span><span class="v">' + esc(utils.tglCantik(events.expiration, { bulan: 'long' })) + '</span></div>' : '') +
        (events['last changed'] ? '<div class="kv"><span class="k">Terakhir diubah</span><span class="v">' + esc(utils.tglCantik(events['last changed'], { bulan: 'long' })) + '</span></div>' : '') +
        (ns.length ? '<div class="kv"><span class="k">Server nama</span><span class="v" style="word-break:break-all">' + esc(ns.slice(0, 6).join(', ')) + '</span></div>' : '') +
        '</div>' +
        '<p class="hint">Sumber: RDAP, sistem resmi pengganti WHOIS. Data tampil apa adanya dari pendaftar domain.</p>');
    } catch (e) {
      if (e.message === 'not-found') {
        T.show(box, '<p class="center dim">Domain ini tidak ditemukan di RDAP. Periksa ejaannya, mungkin domain belum terdaftar.</p>');
        return;
      }
      const msg = e.name === 'AbortError'
        ? 'Waktu habis, server RDAP tidak merespons dalam 15 detik.'
        : 'Gagal mengambil info domain. Cek koneksi internet, lalu coba lagi.';
      T.show(box, errBox(msg));
      const wr = T.el('<div style="margin-top:8px"></div>');
      wr.appendChild(T.btn('🔄 Coba lagi', cari));
      box.appendChild(wr);
    }
  };

  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') cari(); });
  root.appendChild(T.el('<p class="note">Ketik nama domain untuk melihat pendaftarnya, tanggal daftar, dan tanggal kedaluwarsa. Data diambil langsung dari RDAP, sistem resmi pengganti WHOIS.</p>'));
  root.appendChild(T.field('Nama domain', inp, 'Tanpa awalan http atau www, contoh: google.com'));
  root.appendChild(T.row(T.btn('🔍 Cari info domain', cari, true)));
  root.appendChild(box);
}
