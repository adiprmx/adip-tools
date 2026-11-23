import { h as T, esc, errBox } from '../../core.js';

// Cari ikon SVG lewat Iconify (tanpa key).
// Terverifikasi 18 Nov 2026: api.iconify.design/search 200, CORS *.
const API = 'https://api.iconify.design';

async function getJSON(url) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 15000);
  try {
    const r = await fetch(url, { signal: c.signal });
    if (!r.ok) throw new Error('http ' + r.status);
    return await r.json();
  } finally { clearTimeout(t); }
}

// Nama ikon dari API hanya boleh berisi huruf, angka, titik dua, dan strip.
// Nama lain tidak pernah dipakai membangun URL.
const namaIkonAman = (n) => typeof n === 'string' && /^[a-z0-9][a-z0-9:.-]*$/i.test(n) ? n : null;

export const meta = {"id": "cari-ikon-svg", "name": "Cari Ikon SVG", "cat": "liveapi", "icon": "🔍", "desc": "Cari ikon SVG dari ratusan set ikon open-source, lalu unduh sebagai file SVG.", "keywords": "ikon,svg,iconify,icon,desain,simbol,gambar vektor", "since": "6.17.0", "online": true};

export function render(root) {
  const box = T.out();
  const inp = T.input('text', 'Contoh: home, search, heart, settings…', 'home');

  const gagal = (pesan) => {
    T.show(box, errBox(pesan));
    const w = T.el('<div style="margin-top:8px"></div>');
    w.appendChild(T.btn('Coba lagi', cari));
    box.appendChild(w);
  };

  const cari = async () => {
    const q = String(inp.value || '').trim();
    if (!q) { T.show(box, errBox('Tulis kata kunci dulu, contoh: home atau heart.')); return; }
    T.show(box, '<p class="mut">Mencari ikon ' + esc(q) + '…</p>');
    try {
      const j = await getJSON(API + '/search?query=' + encodeURIComponent(q) + '&limit=24');
      const list = j && Array.isArray(j.icons) ? j.icons.map(namaIkonAman).filter(Boolean) : [];
      if (!list.length) {
        T.show(box, '<p class="center dim">Tidak ada ikon yang cocok. Coba kata lain dalam bahasa Inggris, contoh: star, user, atau music.</p>');
        return;
      }
      T.show(box, '<p class="hint">' + list.length + ' ikon ditemukan. Ketuk "Unduh SVG" untuk menyimpan ikonnya.</p>' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:10px;margin-top:10px">' +
        list.map((nama) => {
          const svgUrl = API + '/' + encodeURIComponent(nama).replace(/%3A/g, ':') + '.svg?color=%23d8cfc0';
          const dlUrl = API + '/' + encodeURIComponent(nama).replace(/%3A/g, ':') + '.svg';
          return '<div style="border:1px solid #2e2823;border-radius:10px;padding:10px;text-align:center">' +
            '<img src="' + esc(svgUrl) + '" alt="' + esc(nama) + '" loading="lazy" data-err="hide" style="width:40px;height:40px;display:block;margin:0 auto">' +
            '<div style="font-size:11px;word-break:break-all;margin-top:8px;line-height:1.3">' + esc(nama) + '</div>' +
            '<div style="font-size:11.5px;margin-top:6px"><a href="' + esc(dlUrl) + '" target="_blank" rel="noopener" download>Unduh SVG</a></div>' +
            '</div>';
        }).join('') + '</div>' +
        '<p class="hint">Sumber: Iconify. Ikon berasal dari berbagai set open-source; cek lisensi tiap set ikon sebelum dipakai komersial.</p>');
      T.wireImgErr(box);
    } catch (e) {
      gagal(e.name === 'AbortError'
        ? 'Waktu habis, server ikon tidak bisa dihubungi dalam 15 detik.'
        : 'Pencarian gagal. Cek koneksi internet, lalu coba lagi.');
    }
  };

  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') cari(); });
  root.appendChild(T.el('<p class="note">Cari ikon dari ratusan set ikon open-source. Hasilnya file SVG yang bisa dipakai di situs atau desain.</p>'));
  root.appendChild(T.field('Kata kunci', inp, 'Kata kunci bahasa Inggris, contoh: home, search, heart'));
  root.appendChild(T.row(T.btn('Cari ikon', cari, true)));
  root.appendChild(box);
  cari();
}
