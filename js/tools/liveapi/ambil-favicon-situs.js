import { h as T, esc, errBox } from '../../core.js';

// Ambil favicon situs apa pun lewat icon.horse (gambar dipakai via <img>).
// Terverifikasi 18 Nov 2026: https://icon.horse/icon/google.com -> 200, CORS *.
// Dicek ulang 19 Nov 2026: 200.
export const meta = {"id":"ambil-favicon-situs","name":"Ambil Favicon Situs","cat":"liveapi","icon":"🖼️","desc":"Lihat dan unduh ikon kecil (favicon) dari situs web apa pun.","keywords":"favicon,ikon situs,icon,logo situs,unduh favicon","since":"6.18.0", "online": true};

// Bersihkan input jadi domain polos, atau null bila bukan domain yang sah.
// Menerima "google.com", "https://google.com", "www.google.com/beranda".
export function bersihkanDomain(input) {
  let s = String(input || '').trim().toLowerCase();
  s = s.replace(/^https?:\/\//, '').replace(/^\/\//, '');
  s = s.split('/')[0].split('?')[0].split('#')[0];
  s = s.replace(/:\d+$/, '');
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(s)) return null;
  if (s.length > 253) return null;
  return s;
}

export function urlFavicon(domain) {
  return 'https://icon.horse/icon/' + domain;
}

export function render(root) {
  const box = T.out();
  const inp = T.input('text', 'Contoh: google.com atau youtube.com');
  inp.setAttribute('autocomplete', 'off');
  inp.setAttribute('autocapitalize', 'off');

  const ambil = () => {
    const domain = bersihkanDomain(inp.value);
    if (!domain) {
      T.show(box, errBox('Tulis alamat situs yang benar, contoh: google.com.'));
      return;
    }
    const url = urlFavicon(domain);
    T.show(box,
      '<div class="center"><div data-gambar><img src="' + esc(url) + '" alt="Favicon ' + esc(domain) + '" style="width:64px;height:64px;image-rendering:auto">' +
      '<div class="dim" data-memuat style="font-size:12.5px;margin-top:6px">Memuat ikon…</div></div>' +
      '<div style="font-weight:700;margin-top:10px;word-break:break-all">' + esc(domain) + '</div>' +
      '<p class="dim" style="font-size:13px;margin-top:6px">Ini ikon yang dipakai situs itu di tab browser dan bookmark.</p>' +
      '<p style="margin-top:10px"><a class="btn" href="' + esc(url) + '" target="_blank" rel="noopener">Buka ukuran penuh</a></p></div>' +
      '<p class="hint">Sumber: icon.horse. Domain yang kamu tulis dikirim ke layanan itu untuk diambil ikonnya.</p>');
    // Gambar gagal dimuat harus TERLIHAT, bukan hilang diam-diam:
    // ganti slot gambar dengan pesan + tombol coba lagi.
    const slot = box.querySelector('[data-gambar]');
    const img = slot && slot.querySelector('img');
    if (img) {
      img.addEventListener('load', () => { const m = slot.querySelector('[data-memuat]'); if (m) m.remove(); });
      img.addEventListener('error', () => {
        T.show(slot, errBox('Ikon situs ini tidak bisa dimuat. Situs itu mungkin tidak punya ikon, atau layanannya sedang bermasalah.'));
        const w = T.el('<div style="margin-top:8px"></div>');
        w.appendChild(T.btn('Coba lagi', ambil));
        slot.appendChild(w);
      });
    }
  };

  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') ambil(); });
  root.appendChild(T.el('<p class="note">Ketik alamat situs apa pun untuk melihat ikon kecilnya. Ikon ini yang muncul di tab browser saat kamu membuka situs itu.</p>'));
  root.appendChild(T.field('Alamat situs', inp, 'Contoh: google.com, tanpa https:// juga bisa'));
  root.appendChild(T.row(T.btn('🔍 Ambil favicon', ambil, true)));
  root.appendChild(box);
}
