import { h as T, esc, errBox } from '../../core.js';

// Info paket Python lewat PyPI, tanpa key.
// Terverifikasi 17 Nov 2026: https://pypi.org/pypi/requests/json -> 200, CORS *.
export const meta = {"id":"info-paket-python","name":"Info Paket Python","cat":"liveapi","icon":"🐍","desc":"Lihat versi terbaru, ringkasan, dan kebutuhan Python sebuah paket di PyPI.","keywords":"pypi,python,paket,pip,versi paket,library python","since":"6.17.0", "online": true};

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

const tautanAman = (u) => typeof u === 'string' && u.indexOf('https://') === 0;

export function render(root) {
  const box = T.out();
  const inp = T.input('text', 'Contoh: requests, numpy, atau django');
  inp.setAttribute('autocomplete', 'off');
  inp.setAttribute('autocapitalize', 'off');

  const cari = async () => {
    const q = String(inp.value || '').trim();
    if (!q) { T.show(box, errBox('Tulis nama paket dulu.')); return; }
    T.show(box, '<p class="mut">Mencari paket ' + esc(q) + '…</p>');
    try {
      const j = await getJSON('https://pypi.org/pypi/' + encodeURIComponent(q) + '/json');
      const info = j && j.info;
      if (!info || !info.name) throw new Error('bad-data');
      const rilis = (j.releases && j.releases[info.version]) || [];
      const tglRilis = rilis.length && rilis[0].upload_time ? new Date(rilis[0].upload_time) : null;
      T.show(box,
        '<div class="center"><div style="font-weight:800;font-size:18px;word-break:break-all">' + esc(info.name) + '</div>' +
        '<div class="dim" style="font-size:12.5px;margin-top:2px">Versi terbaru: ' + esc(info.version || '-') + (info.license ? ' · Lisensi: ' + esc(info.license) : '') + '</div></div>' +
        (info.summary ? '<p class="hint" style="margin-top:10px">' + esc(info.summary) + '</p>' : '') +
        '<div style="margin-top:10px">' +
        (info.author ? '<div class="kv"><span class="k">Pembuat</span><span class="v">' + esc(info.author) + '</span></div>' : '') +
        (info.requires_python ? '<div class="kv"><span class="k">Butuh Python</span><span class="v">' + esc(info.requires_python) + '</span></div>' : '') +
        (tglRilis && !isNaN(tglRilis) ? '<div class="kv"><span class="k">Versi ini dirilis</span><span class="v">' + esc(tglRilis.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })) + '</span></div>' : '') +
        (info.keywords ? '<div class="kv"><span class="k">Kata kunci</span><span class="v">' + esc(info.keywords) + '</span></div>' : '') +
        '</div>' +
        '<div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">' +
        '<a class="btn" href="https://pypi.org/project/' + encodeURIComponent(info.name) + '/" target="_blank" rel="noopener">Lihat di PyPI</a>' +
        (tautanAman(info.home_page) ? '<a class="btn" href="' + esc(info.home_page) + '" target="_blank" rel="noopener">Situs paket</a>' : '') +
        '</div>' +
        '<p class="hint">Sumber: PyPI, tempat resmi paket Python.</p>');
    } catch (e) {
      if (e.message === 'not-found') {
        T.show(box, '<p class="center dim">Paket tidak ditemukan di PyPI. Periksa ejaannya.</p>');
        return;
      }
      const msg = e.name === 'AbortError'
        ? 'Waktu habis, server PyPI tidak bisa dihubungi dalam 15 detik.'
        : 'Gagal mencari paket. Cek koneksi internet, lalu coba lagi.';
      T.show(box, errBox(msg));
      const wr = T.el('<div style="margin-top:8px"></div>');
      wr.appendChild(T.btn('🔄 Coba lagi', cari));
      box.appendChild(wr);
    }
  };

  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') cari(); });
  root.appendChild(T.el('<p class="note">Cari paket Python di PyPI untuk melihat versi terbaru, ringkasan, dan versi Python yang dibutuhkan.</p>'));
  root.appendChild(T.field('Nama paket', inp, 'Contoh: requests, numpy'));
  root.appendChild(T.row(T.btn('🔍 Cari paket', cari, true)));
  root.appendChild(box);
}
