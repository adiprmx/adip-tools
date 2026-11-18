import { h as T, utils, imgEl, LOCAL_NOTE } from '../../core.js';

// Thumbnail YouTube: ambil gambar depan (thumbnail) video dari link.
// Hasil gabung v6.16.0 (D-01): tool ini menyerap "Ambil Thumbnail YouTube"
// (duplikat): probe otomatis kualitas terbaik, tombol salin link gambar,
// dan pola link /live/. ID lama dipertahankan supaya rute + favorit lama
// tetap jalan. HANYA gambar depan, BUKAN videonya.
utils.ytId = function (url) {
    const s = String(url == null ? '' : url).trim();
    const pats = [
      /youtu\.be\/([A-Za-z0-9_-]{6,})/,
      /[?&]v=([A-Za-z0-9_-]{6,})/,
      /\/shorts\/([A-Za-z0-9_-]{6,})/,
      /\/live\/([A-Za-z0-9_-]{6,})/,
      /\/embed\/([A-Za-z0-9_-]{6,})/,
      /\/v\/([A-Za-z0-9_-]{6,})/
    ];
    for (const p of pats) { const m = s.match(p); if (m) return m[1]; }
    return '';
  };

export const meta = {"id": "yt-thumbnail", "name": "Thumbnail YouTube", "cat": "gambar", "icon": "📺", "desc": "Ambil thumbnail YouTube dari URL, kualitas terbaiknya ditandai otomatis.", "keywords": "youtube,thumbnail,gambar,unduh,gambar depan,cover video"};

const KUALITAS = [
  ['maxresdefault', 'Maksimal (1280×720)'],
  ['hqdefault', 'Tinggi (480×360)'],
  ['mqdefault', 'Sedang (320×180)'],
  ['default', 'Kecil (120×90)'],
];

// Muat satu gambar thumbnail; resolve {ada, w, h} (ada=false bila gagal).
function muatGambar(src) {
  return new Promise((resolve) => {
    const im = new Image();
    const to = setTimeout(() => { im.src = ''; resolve({ ada: false }); }, 12000);
    im.onload = () => { clearTimeout(to); resolve({ ada: true, w: im.naturalWidth, h: im.naturalHeight }); };
    im.onerror = () => { clearTimeout(to); resolve({ ada: false }); };
    im.src = src;
  });
}

// YouTube mengembalikan gambar abu-abu 120×90 untuk kualitas yang tidak
// tersedia (bukan 404), jadi ukuran itu dipakai sebagai tanda "kosong"
// untuk semua kualitas kecuali 'default' yang memang 120×90.
function kualitasKosong(kode, w, h) {
  if (kode === 'default') return false;
  return w <= 120 && h <= 90;
}

export function render(root) {

      const urlI = T.input('url', 'Tempel link YouTube…');
      const box = T.out();
      const statusBox = T.out();

      async function dlThumb(id, q) {
        const url = `https://i.ytimg.com/vi/${id}/${q}.jpg`;
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 15000);
        try {
          const r = await fetch(url, { signal: ctrl.signal });
          if (!r.ok) throw new Error('bad');
          const b = await r.blob();
          T.dl(`thumbnail-${id}-${q}.jpg`, b, 'image/jpeg');
          T.toast('Berhasil diunduh');
        } catch (e) {
          window.open(url, '_blank', 'noopener');
          T.toast('Unduh langsung diblokir, dibuka di tab baru');
        } finally { clearTimeout(timer); }
      }

      async function show() {
        T.hide(box); T.hide(statusBox);
        const id = utils.ytId(urlI.value);
        if (!id) {
          T.show(statusBox, '<div class="err">Linknya belum dikenali. Pastikan itu link video YouTube (contoh: youtube.com/watch?v=...).</div>');
          return;
        }
        T.show(statusBox, '<span class="dim">Mencari gambar terbaik…</span>');
        // Probe keempat kualitas sekaligus: total tunggu = probe paling
        // lambat (maks 12 detik), bukan jumlah semuanya. Urutan prioritas
        // saat menentukan yang terbaik tetap maxres, hq, mq, default.
        const hasil = await Promise.all(KUALITAS.map(async ([q, label]) => {
          const url = `https://i.ytimg.com/vi/${id}/${q}.jpg`;
          const r = await muatGambar(url);
          return { q, label, url, ada: r.ada && !kualitasKosong(q, r.w, r.h) };
        }));
        T.hide(statusBox);
        const terbaik = hasil.find((h) => h.ada);
        if (!terbaik) {
          T.show(statusBox, '<div class="err">Gambar depannya tidak ketemu. Videonya mungkin sudah dihapus, pribadi, atau koneksimu sedang bermasalah.</div> ' +
            '<button class="btn" type="button">Coba lagi</button>');
          statusBox.querySelector('button').addEventListener('click', show);
          return;
        }
        const wrap = T.el('<div></div>');
        wrap.appendChild(T.el(`<p class="note">Video ID: <b>${T.esc(id)}</b><br>Kualitas terbaik yang tersedia: <b>${T.esc(terbaik.label)}</b>. Yang diambil cuma gambar depannya, bukan videonya.</p>`));
        hasil.forEach(({ q, label, url, ada }) => {
          const card = T.el('<div class="card"></div>');
          const tandai = q === terbaik.q ? '<span class="dim">, kualitas terbaik</span>' : '';
          card.appendChild(T.el(`<div class="hint" style="margin-bottom:6px"><b>${T.esc(label)}</b>${tandai}</div>`));
          const im = imgEl(url, label);
          im.onerror = () => { im.style.opacity = '0.25'; };
          if (!ada) im.style.opacity = '0.25';
          card.appendChild(im);
          if (ada) {
            const rowB = T.el('<div class="row" style="margin-top:8px"></div>');
            rowB.appendChild(T.btn('Unduh', () => dlThumb(id, q), true));
            rowB.appendChild(T.btn('Salin Link Gambar', () => T.copy(url)));
            card.appendChild(rowB);
          } else {
            card.appendChild(T.el('<p class="hint" style="margin-top:8px">Kualitas ini tidak tersedia untuk video ini.</p>'));
          }
          card.style.marginBottom = '12px';
          wrap.appendChild(card);
        });
        T.show(box, '');
        box.appendChild(wrap);
        T.scrollToPreview(box);
      }

      urlI.addEventListener('keydown', (e) => { if (e.key === 'Enter') show(); });
      root.appendChild(T.el(`<p class="note">🔒 ${LOCAL_NOTE} Gambar diambil langsung dari server YouTube, bukan dari HP kamu.</p>`));
      root.appendChild(T.field('Link YouTube', urlI, 'Bisa link biasa, youtu.be, Shorts, live, atau embed.'));
      root.appendChild(T.btn('Tampilkan Thumbnail', show, true));
      root.appendChild(statusBox);
      root.appendChild(box);

}
