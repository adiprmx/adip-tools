import { h as T, esc, errBox } from '../../core.js';

// Pesan commit acak yang lucu, lewat whatthecommit.com, tanpa key.
// Terverifikasi 19 Nov 2026: https://whatthecommit.com/index.txt -> teks hidup
// ("I don't know what these changes are supposed to accomplish...").
// Dokumen verifikasi mencatat varian HTTP; HTTP kini 308 ke HTTPS (curl
// 19 Nov), jadi tool memakai HTTPS agar tidak diblokir mixed content.
export const meta = {"id":"pesan-commit-acak","name":"Pesan Commit Acak","cat":"liveapi","icon":"💻","desc":"Pesan commit lucu acak untuk developer, dalam bahasa Inggris.","keywords":"commit,git,pesan commit,lucu,developer,acak","since":"6.19.0", "online": true};

async function getText(url) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 15000);
  try {
    const r = await fetch(url, { signal: c.signal });
    if (!r.ok) throw new Error('http ' + r.status);
    return await r.text();
  } finally { clearTimeout(t); }
}

export function render(root) {
  const box = T.out();
  let terakhir = '';

  const muat = async () => {
    T.show(box, '<p class="mut">Mencari pesan commit…</p>');
    try {
      const teks = (await getText('https://whatthecommit.com/index.txt')).trim();
      if (!teks) throw new Error('bad-data');
      terakhir = teks;
      T.show(box, '<div class="center" style="font-size:16px;line-height:1.6;padding:8px 0"><code style="font-size:15px">' + esc(teks) + '</code></div>' +
        '<p class="hint center">Sumber: whatthecommit.com</p>');
      const wr = T.el('<div class="center" style="margin-top:8px"></div>');
      wr.appendChild(T.copyBtn(() => terakhir, '📋 Salin pesan'));
      box.appendChild(wr);
    } catch (e) {
      const msg = e.name === 'AbortError'
        ? 'Waktu habis, server tidak bisa dihubungi dalam 15 detik.'
        : 'Gagal mengambil pesan commit. Cek koneksi internet, lalu coba lagi.';
      T.show(box, errBox(msg));
      const wr = T.el('<div style="margin-top:8px"></div>');
      wr.appendChild(T.btn('🔄 Coba lagi', muat));
      box.appendChild(wr);
    }
  };

  root.appendChild(T.el('<p class="note">Satu pesan commit acak setiap ketukan, dalam bahasa Inggris. Cocok buat commit yang tidak perlu serius.</p>'));
  root.appendChild(T.row(T.btn('💻 Pesan lain', muat, true)));
  root.appendChild(box);
  muat();
}
