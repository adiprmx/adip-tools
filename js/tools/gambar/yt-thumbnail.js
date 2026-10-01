import { h as T, utils, imgEl } from '../../core.js?v=5.0.0';

utils.ytId = function (url) {
    const s = String(url == null ? '' : url).trim();
    const pats = [
      /youtu\.be\/([A-Za-z0-9_-]{6,})/,
      /[?&]v=([A-Za-z0-9_-]{6,})/,
      /\/shorts\/([A-Za-z0-9_-]{6,})/,
      /\/embed\/([A-Za-z0-9_-]{6,})/,
      /\/v\/([A-Za-z0-9_-]{6,})/
    ];
    for (const p of pats) { const m = s.match(p); if (m) return m[1]; }
    return '';
  };

export const meta = {"id": "yt-thumbnail", "name": "Thumbnail YouTube", "cat": "gambar", "icon": "📺", "desc": "Download thumbnail YouTube dari URL."};

export function render(root) {

      const urlI = T.input('url', 'Tempel link YouTube…');
      const box = T.out();

      const quals = [
        ['maxresdefault', 'Maksimal (1280×720)'],
        ['hqdefault', 'Tinggi (480×360)'],
        ['mqdefault', 'Sedang (320×180)'],
        ['default', 'Kecil (120×90)']
      ];

      async function dlThumb(id, q) {
        const url = `https://i.ytimg.com/vi/${id}/${q}.jpg`;
        try {
          const r = await fetch(url);
          if (!r.ok) throw new Error('bad');
          const b = await r.blob();
          T.dl(`thumbnail-${id}-${q}.jpg`, b, 'image/jpeg');
          T.toast('Berhasil diunduh');
        } catch (e) {
          window.open(url, '_blank', 'noopener');
          T.toast('Unduh langsung diblokir, dibuka di tab baru');
        }
      }

      function show() {
        T.hide(box);
        const id = utils.ytId(urlI.value);
        if (!id) { T.toast('Link YouTube tidak dikenali'); return; }
        const wrap = T.el('<div></div>');
        wrap.appendChild(T.el(`<p class="note">Video ID: <b>${T.esc(id)}</b><br>Kalau kualitas maksimal tidak ada (gambar abu-abu), otomatis pakai yang di bawahnya.</p>`));
        quals.forEach(([q, label]) => {
          const card = T.el('<div class="card"></div>');
          card.appendChild(T.el(`<div class="hint" style="margin-bottom:6px"><b>${T.esc(label)}</b></div>`));
          const im = imgEl(`https://i.ytimg.com/vi/${id}/${q}.jpg`, label);
          im.onerror = () => { im.style.opacity = '0.25'; };
          card.appendChild(im);
          const rowB = T.el('<div class="row" style="margin-top:8px"></div>');
          rowB.appendChild(T.btn('Unduh', () => dlThumb(id, q), true));
          card.appendChild(rowB);
          card.style.marginBottom = '12px';
          wrap.appendChild(card);
        });
        T.show(box, '');
        box.appendChild(wrap);
      }

      root.appendChild(T.field('Link YouTube', urlI, 'Mendukung youtu.be, watch?v=, /shorts/, /embed/'));
      root.appendChild(T.btn('Tampilkan Thumbnail', show, true));
      root.appendChild(box);
    
}
