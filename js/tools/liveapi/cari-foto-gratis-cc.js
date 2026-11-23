import { h as T, esc, errBox, utils } from '../../core.js';

// Cari foto berlisensi Creative Commons lewat Openverse (tanpa key).
// Terverifikasi 18 Nov 2026: api.openverse.org/v1/images/ 200, CORS *.
// Atribusi WAJIB ditampilkan di tiap foto (nama pembuat + lisensi).
const API = 'https://api.openverse.org/v1/images/';

async function getJSON(url) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 15000);
  try {
    const r = await fetch(url, { signal: c.signal });
    if (!r.ok) throw new Error('http ' + r.status);
    return await r.json();
  } finally { clearTimeout(t); }
}

// mediaAman kanonis tinggal di utils.urlAman (core.js).
const tautanAman = (u) => typeof u === 'string' && u.indexOf('https://') === 0;

export const meta = {"id": "cari-foto-gratis-cc", "name": "Cari Foto Gratis CC", "cat": "liveapi", "icon": "📸", "desc": "Cari foto gratis berlisensi Creative Commons, lengkap dengan nama pembuat dan lisensinya.", "keywords": "foto,gratis,creative commons,cc,openverse,stock photo,gambar bebas", "since": "6.17.0", "online": true};

export function render(root) {
  const box = T.out();
  const inp = T.input('text', 'Contoh: dog, beach, mountain…', 'dog');

  const gagal = (pesan) => {
    T.show(box, errBox(pesan));
    const w = T.el('<div style="margin-top:8px"></div>');
    w.appendChild(T.btn('Coba lagi', cari));
    box.appendChild(w);
  };

  const cari = async () => {
    const q = String(inp.value || '').trim();
    if (!q) { T.show(box, errBox('Tulis kata kunci dulu, contoh: dog atau beach.')); return; }
    T.show(box, '<p class="mut">Mencari foto gratis tentang ' + esc(q) + '…</p>');
    try {
      const j = await getJSON(API + '?q=' + encodeURIComponent(q) + '&page_size=12');
      const list = j && Array.isArray(j.results) ? j.results : [];
      if (!list.length) {
        T.show(box, '<p class="center dim">Tidak ada foto yang cocok. Coba kata lain dalam bahasa Inggris, contoh: cat, city, atau ocean.</p>');
        return;
      }
      T.show(box, '<p class="hint">' + list.length + ' foto ditemukan. Tiap foto menampilkan pembuat dan lisensinya, cantumkan saat memakai foto itu.</p>' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px;margin-top:10px">' +
        list.map((f) => {
          const thumb = utils.urlAman(f.thumbnail || f.url);
          const judul = String(f.title || 'Tanpa judul');
          const pembuat = String(f.creator || 'Pembuat tidak diketahui');
          const lisensi = String(f.license || '').toUpperCase() + (f.license_version ? ' ' + String(f.license_version) : '');
          const sumber = tautanAman(f.foreign_landing_url) ? f.foreign_landing_url : (tautanAman(f.url) ? f.url : null);
          return '<div>' +
            (thumb ? '<img src="' + esc(thumb) + '" alt="' + esc(judul) + '" loading="lazy" data-err="hide" style="width:100%;height:120px;object-fit:cover;border-radius:8px;display:block">' : '<div style="height:120px;border-radius:8px;background:#221d18"></div>') +
            '<div style="font-size:12.5px;line-height:1.4;margin-top:6px">' + esc(judul) + '</div>' +
            '<div class="dim" style="font-size:11.5px;line-height:1.4">Oleh ' + esc(pembuat) + '<br>Lisensi: ' + esc(lisensi || 'tidak ada info') + '</div>' +
            (sumber ? '<div style="font-size:12px;margin-top:4px"><a href="' + esc(sumber) + '" target="_blank" rel="noopener">Buka sumber foto</a></div>' : '') +
            '</div>';
        }).join('') + '</div>' +
        '<p class="hint">Sumber: Openverse (WordPress). Foto-foto ini berlisensi Creative Commons; baca ketentuan lisensi tiap foto sebelum dipakai, terutama untuk keperluan komersial.</p>');
      T.wireImgErr(box);
    } catch (e) {
      gagal(e.name === 'AbortError'
        ? 'Waktu habis, server foto tidak bisa dihubungi dalam 15 detik.'
        : 'Pencarian gagal. Cek koneksi internet, lalu coba lagi.');
    }
  };

  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') cari(); });
  root.appendChild(T.el('<p class="note">Foto gratis dari berbagai sumber, semuanya berlisensi Creative Commons. Nama pembuat dan lisensi selalu ditampilkan supaya bisa dicantumkan dengan benar.</p>'));
  root.appendChild(T.field('Kata kunci', inp, 'Kata kunci bahasa Inggris memberi hasil paling banyak'));
  root.appendChild(T.row(T.btn('Cari foto', cari, true)));
  root.appendChild(box);
  cari();
}
