import { h as T, esc, errBox, utils } from '../../core.js';

// Cari anime dari screenshot lewat trace.moe (tanpa key).
// Terverifikasi 18 Nov 2026: api.trace.moe/search 200, CORS echo.
// KUOTA ANONIM ±100 pencarian/bulan untuk IP bersama: satu pencarian per klik,
// tanpa panggilan berulang, dan batas itu ditulis di UI.
const API = 'https://api.trace.moe/search';

async function getJSON(url) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 20000);
  try {
    const r = await fetch(url, { signal: c.signal });
    if (r.status === 429) throw new Error('rate-limit');
    if (!r.ok) throw new Error('http ' + r.status);
    return await r.json();
  } finally { clearTimeout(t); }
}

// mediaAman kanonis tinggal di utils.urlAman (core.js).

function detikKeMenit(d) {
  const n = Number(d);
  if (!isFinite(n)) return '';
  const m = Math.floor(n / 60), s = Math.floor(n % 60);
  return m + ':' + String(s).padStart(2, '0');
}

export const meta = {"id": "cari-adegan-anime", "name": "Cari Adegan Anime", "cat": "liveapi", "icon": "🎬", "desc": "Tempel alamat gambar cuplikan anime, ketahui judul anime dan episodenya.", "keywords": "anime,adegan,screenshot,trace.moe,episode,cari anime,cuplikan", "since": "6.17.0"};

export function render(root) {
  const box = T.out();
  const inp = T.input('text', 'Tempel alamat gambar (URL), contoh: https://…/gambar.jpg');
  inp.setAttribute('inputmode', 'url');
  inp.setAttribute('autocomplete', 'off');
  let sedangCari = false;

  const gagal = (pesan) => {
    T.show(box, errBox(pesan));
    const w = T.el('<div style="margin-top:8px"></div>');
    w.appendChild(T.btn('Coba lagi', cari));
    box.appendChild(w);
  };

  const cari = async () => {
    if (sedangCari) return;
    const url = String(inp.value || '').trim();
    if (!url || url.indexOf('http') !== 0) {
      T.show(box, errBox('Tempel alamat gambar yang lengkap, dimulai dengan http atau https. Gambar harus bisa diakses publik.'));
      return;
    }
    sedangCari = true;
    T.show(box, '<p class="mut">Mencari adegan itu di basis data anime…</p>');
    try {
      const j = await getJSON(API + '?url=' + encodeURIComponent(url));
      const hasil = j && Array.isArray(j.result) ? j.result.slice(0, 5) : [];
      if (!hasil.length) {
        T.show(box, '<p class="center dim">Tidak ada adegan yang cocok. Coba gambar cuplikan lain yang lebih jelas, tanpa teks atau bingkai tambahan.</p>');
        return;
      }
      T.show(box, '<p class="hint">' + hasil.length + ' kecocokan teratas. Persentase menunjukkan seberapa mirip gambarnya.</p>' +
        hasil.map((r) => {
          const persen = Math.round((Number(r.similarity) || 0) * 100);
          const videoAll = utils.urlAman(r.video);
          const video = videoAll && videoAll.indexOf('https://') === 0 ? videoAll : null;
          const gambar = utils.urlAman(r.image);
          const anilist = r.anilist ? 'https://anilist.co/anime/' + Number(r.anilist) : null;
          return '<div style="border-top:1px solid #ffffff14;padding:12px 0">' +
            (video ? '<video src="' + esc(video) + '" controls preload="none"' + (gambar ? ' data-gambar="' + esc(gambar) + '"' : '') + ' style="width:100%;border-radius:8px;display:block;margin-bottom:8px"></video>'
              : (gambar ? '<img src="' + esc(gambar) + '" alt="Cuplikan adegan" loading="lazy" data-err="hide" style="width:100%;border-radius:8px;display:block;margin-bottom:8px">' : '')) +
            '<div style="font-size:13px;line-height:1.5">' +
            (r.filename ? '<div><b>' + esc(String(r.filename)) + '</b></div>' : '') +
            '<div class="dim">Kemiripan ' + persen + '%' +
            (r.episode ? ' · Episode ' + esc(String(r.episode)) : '') +
            (r.from != null ? ' · menit ke-' + esc(detikKeMenit(r.from)) : '') + '</div>' +
            (anilist ? '<div style="margin-top:4px"><a href="' + esc(anilist) + '" target="_blank" rel="noopener">Lihat di AniList</a></div>' : '') +
            '</div></div>';
        }).join('') +
        '<p class="hint">Sumber: trace.moe. Gambar yang kamu tempel dikirim ke layanan itu untuk dicocokkan.</p>');
      T.wireImgErr(box);
      box.querySelectorAll('video').forEach((v) => {
        v.addEventListener('error', () => {
          const g = v.getAttribute('data-gambar');
          if (g) {
            const im = document.createElement('img');
            im.src = g; im.alt = 'Cuplikan adegan'; im.loading = 'lazy';
            im.style.cssText = 'width:100%;border-radius:8px;display:block;margin-bottom:8px';
            v.replaceWith(im);
          } else {
            const p = document.createElement('div');
            p.className = 'dim';
            p.style.cssText = 'font-size:12.5px;margin-bottom:8px';
            p.textContent = 'Video cuplikan tidak bisa diputar saat ini.';
            v.replaceWith(p);
          }
        }, { once: true });
      });
    } catch (e) {
      if (e.message === 'rate-limit') {
        T.show(box, errBox('Batas pencarian gratis tercapai untuk saat ini (sekitar 100 kali sebulan tanpa akun). Coba lagi nanti.'));
        return;
      }
      gagal(e.name === 'AbortError'
        ? 'Waktu habis, server pencari tidak merespons dalam 20 detik.'
        : 'Pencarian gagal. Pastikan alamat gambarnya benar dan bisa dibuka publik, lalu coba lagi.');
    } finally { sedangCari = false; }
  };

  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') cari(); });
  root.appendChild(T.el('<p class="note">Punya cuplikan gambar dari sebuah anime tapi tidak tahu judulnya? Tempel alamat gambarnya di sini. Pencarian gratis dibatasi sekitar 100 kali sebulan untuk semua pengguna tanpa akun, jadi pakai seperlunya.</p>'));
  root.appendChild(T.field('Alamat gambar', inp, 'Gambar harus bisa diakses publik, bukan dari galeri HP yang terkunci'));
  root.appendChild(T.row(T.btn('Cari adegan', cari, true)));
  root.appendChild(box);
}
