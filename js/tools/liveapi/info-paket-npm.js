import { h as T, esc, errBox } from '../../core.js';

// Info paket JavaScript lewat registry npm, tanpa key.
// Terverifikasi 17 Nov 2026: https://registry.npmjs.org/react/latest -> 200, CORS *.
export const meta = {"id":"info-paket-npm","name":"Info Paket NPM","cat":"liveapi","icon":"📦","desc":"Lihat versi terbaru, deskripsi, dan lisensi paket JavaScript di npm.","keywords":"npm,paket,javascript,node,registry,versi paket,dependensi","since":"6.17.0"};

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
  const inp = T.input('text', 'Contoh: react, lodash, atau express');
  inp.setAttribute('autocomplete', 'off');
  inp.setAttribute('autocapitalize', 'off');

  const cari = async () => {
    const q = String(inp.value || '').trim();
    if (!q) { T.show(box, errBox('Tulis nama paket dulu.')); return; }
    T.show(box, '<p class="mut">Mencari paket ' + esc(q) + '…</p>');
    try {
      const j = await getJSON('https://registry.npmjs.org/' + encodeURIComponent(q) + '/latest');
      if (!j || !j.name) throw new Error('bad-data');
      const deps = j.dependencies ? Object.keys(j.dependencies) : [];
      const repo = j.repository && (typeof j.repository === 'string' ? j.repository : j.repository.url);
      const repoBersih = repo ? String(repo).replace(/^git\+/, '').replace(/\.git$/, '') : '';
      const penulis = j.author && (typeof j.author === 'string' ? j.author : j.author.name);
      T.show(box,
        '<div class="center"><div style="font-weight:800;font-size:18px;word-break:break-all">' + esc(j.name) + '</div>' +
        '<div class="dim" style="font-size:12.5px;margin-top:2px">Versi terbaru: ' + esc(j.version || '-') + (j.license ? ' · Lisensi: ' + esc(j.license) : '') + '</div></div>' +
        (j.description ? '<p class="hint" style="margin-top:10px">' + esc(j.description) + '</p>' : '') +
        '<div style="margin-top:10px">' +
        (penulis ? '<div class="kv"><span class="k">Pembuat</span><span class="v">' + esc(penulis) + '</span></div>' : '') +
        '<div class="kv"><span class="k">Paket lain yang dibutuhkan</span><span class="v">' + (deps.length ? deps.length + ' paket' + (deps.length > 0 ? ': ' + esc(deps.slice(0, 8).join(', ')) + (deps.length > 8 ? ', …' : '') : '') : 'Tidak ada') + '</span></div>' +
        '</div>' +
        '<div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">' +
        '<a class="btn" href="https://www.npmjs.com/package/' + encodeURIComponent(j.name) + '" target="_blank" rel="noopener">Lihat di npm</a>' +
        (tautanAman(repoBersih) ? '<a class="btn" href="' + esc(repoBersih) + '" target="_blank" rel="noopener">Kode sumber</a>' : '') +
        '</div>' +
        '<p class="hint">Sumber: registry npm resmi.</p>');
    } catch (e) {
      if (e.message === 'not-found') {
        T.show(box, '<p class="center dim">Paket tidak ditemukan di npm. Periksa ejaannya.</p>');
        return;
      }
      const msg = e.name === 'AbortError'
        ? 'Waktu habis, server npm tidak merespons dalam 15 detik.'
        : 'Gagal mencari paket. Cek koneksi internet, lalu coba lagi.';
      T.show(box, errBox(msg));
      const wr = T.el('<div style="margin-top:8px"></div>');
      wr.appendChild(T.btn('🔄 Coba lagi', cari));
      box.appendChild(wr);
    }
  };

  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') cari(); });
  root.appendChild(T.el('<p class="note">Cari paket JavaScript di npm untuk melihat versi terbaru, deskripsi, dan lisensinya.</p>'));
  root.appendChild(T.field('Nama paket', inp, 'Contoh: react, lodash'));
  root.appendChild(T.row(T.btn('🔍 Cari paket', cari, true)));
  root.appendChild(box);
}
