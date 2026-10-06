import { h as T, esc } from '../../core.js?v=6.9.5';

export const meta = {"id": "anjing-random", "name": "Anjing Random", "cat": "liveapi", "icon": "🐶", "desc": "Foto anjing acak dari seluruh dunia.", "keywords": "anjing,dog,puppy,hewan,random,foto"};

// Ambil nama breed dari URL: .../breeds/hound-afghan/n02088094_1003.jpg
function breedDariUrl(url) {
  try {
    const m = String(url).match(/\/breeds\/([^/]+)/);
    if (!m) return '';
    return m[1]
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  } catch (e) { return ''; }
}

export function render(root) {
  const box = T.out();
  let ctl = null;

  const muat = async () => {
    if (ctl) ctl.abort();
    ctl = new AbortController();
    const tmr = setTimeout(() => ctl.abort(), 15000);
    T.show(box, '<div class="dim center">Mengambil foto anjing… 🐾</div>');
    try {
      const res = await fetch('https://dog.ceo/api/breeds/image/random', { signal: ctl.signal });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      if (data.status !== 'success' || !data.message) {
        throw new Error('API tidak mengembalikan foto (status: ' + data.status + ').');
      }
      const breed = breedDariUrl(data.message);
      T.show(box,
        '<div class="center">' +
        '<img src="' + esc(data.message) + '" alt="Anjing' + (breed ? ' ' + esc(breed) : '') + '" style="width:100%;max-width:100%;border-radius:12px;display:block" loading="lazy">' +
        (breed ? '<div class="dim" style="margin-top:8px">Breed: <b>' + esc(breed) + '</b></div>' : '') +
        '</div>');
      const img = box.querySelector('img');
      if (img) img.addEventListener('error', () => {
        T.show(box, '<span class="err">Gagal memuat gambar. Coba anjing lain ya.</span>');
      });
    } catch (e) {
      if (e && e.name === 'AbortError') {
        T.show(box, '<span class="err">Waktu habis (15 detik). Periksa koneksi internet lalu coba lagi.</span>');
      } else {
        T.show(box, '<span class="err">Gagal memuat foto anjing. Periksa koneksi internet lalu coba lagi.</span><br><span class="dim">(' + esc(e.message || e) + ')</span>');
      }
      const wr = T.el('<div class="mt8 center"></div>');
      wr.appendChild(T.btn('🔄 Coba lagi', muat));
      box.appendChild(wr);
    } finally {
      clearTimeout(tmr);
      ctl = null;
    }
  };

  T.onLeave(() => { if (ctl) ctl.abort(); });

  root.appendChild(T.row(T.btn('Anjing lain 🐾', muat, true)));
  root.appendChild(box);
  muat();
}
