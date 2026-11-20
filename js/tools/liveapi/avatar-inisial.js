import { h as T, esc, errBox } from '../../core.js';

// Avatar huruf inisial dari nama lewat ui-avatars.com (gambar via <img>).
// Terverifikasi 18 Nov 2026: https://ui-avatars.com/api/?name=Test+User -> 200, CORS *.
// Dicek ulang 19 Nov 2026: 200.
// Beda dari Avatar Studio (editor avatar SVG DiceBear bergaya banyak):
// tool ini khusus avatar inisial PNG sederhana dari nama.
export const meta = {"id":"avatar-inisial","name":"Avatar Inisial","cat":"liveapi","icon":"🔤","desc":"Buat avatar huruf inisial dari nama, dengan warna latar dan ukuran pilihanmu.","keywords":"avatar,inisial,huruf nama,foto profil,ui-avatars","since":"6.18.0"};

export const WARNA_LATAR = [
  ['acak', 'Acak'],
  ['ff6f61', 'Coral'],
  ['161311', 'Arang'],
  ['2563eb', 'Biru'],
  ['16a34a', 'Hijau'],
  ['ca8a04', 'Kuning'],
  ['9333ea', 'Ungu'],
];

// Bentuk URL avatar dari nama + pilihan. Nama dibersihkan dulu:
// spasi berlebih diringkas, karakter aneh dibuang.
export function urlAvatar(nama, latar, ukuran) {
  const bersih = String(nama || '').trim().replace(/\s+/g, ' ').replace(/[^a-zA-Z0-9 .'-]/g, '');
  const q = new URLSearchParams();
  q.set('name', bersih);
  q.set('size', String([64, 128, 256, 512].includes(Number(ukuran)) ? ukuran : 256));
  q.set('bold', 'true');
  if (latar && latar !== 'acak') q.set('background', latar);
  return 'https://ui-avatars.com/api/?' + q.toString();
}

export function render(root) {
  const box = T.out();
  const inp = T.input('text', 'Contoh: Nadhif Aslam');
  inp.setAttribute('autocomplete', 'off');
  const warnaSel = T.select(WARNA_LATAR, 'acak');
  const ukuranSel = T.select([['128', '128 piksel'], ['256', '256 piksel'], ['512', '512 piksel']], '256');

  const buat = () => {
    const nama = String(inp.value || '').trim();
    if (nama.length < 1) {
      T.show(box, errBox('Tulis nama dulu, contoh: Nadhif Aslam.'));
      return;
    }
    if (nama.length > 60) {
      T.show(box, errBox('Namanya kepanjangan, maksimal 60 huruf.'));
      return;
    }
    const url = urlAvatar(nama, warnaSel.value, ukuranSel.value);
    T.show(box,
      '<div class="center"><div data-gambar><img src="' + esc(url) + '" alt="Avatar inisial ' + esc(nama) + '" style="width:128px;height:128px;border-radius:12px">' +
      '<div class="dim" data-memuat style="font-size:12.5px;margin-top:6px">Membuat avatar…</div></div>' +
      '<div style="font-weight:700;margin-top:10px">' + esc(nama) + '</div>' +
      '<p style="margin-top:10px"><a class="btn" href="' + esc(url) + '" target="_blank" rel="noopener">Buka ukuran penuh</a></p></div>' +
      '<p class="hint">Sumber: ui-avatars.com. Nama yang kamu tulis dikirim ke layanan itu untuk dibuat avatarnya. Avatar dibuat dari huruf awal namamu.</p>');
    // Gambar gagal dimuat harus TERLIHAT, bukan hilang diam-diam:
    // ganti slot gambar dengan pesan + tombol coba lagi.
    const slot = box.querySelector('[data-gambar]');
    const img = slot && slot.querySelector('img');
    if (img) {
      img.addEventListener('load', () => { const m = slot.querySelector('[data-memuat]'); if (m) m.remove(); });
      img.addEventListener('error', () => {
        T.show(slot, errBox('Avatar tidak bisa dibuat. Layanannya mungkin sedang bermasalah, coba lagi sebentar lagi.'));
        const wr = T.el('<div style="margin-top:8px"></div>');
        wr.appendChild(T.btn('Coba lagi', buat));
        slot.appendChild(wr);
      });
    }
    const w = T.el('<div style="margin-top:8px" class="center"></div>');
    w.appendChild(T.copyBtn(() => url, 'Salin alamat gambar'));
    box.appendChild(w);
  };

  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') buat(); });
  root.appendChild(T.el('<p class="note">Ketik nama untuk membuat avatar huruf inisialnya. Cocok dipakai sebagai foto profil sementara.</p>'));
  root.appendChild(T.field('Nama', inp, 'Huruf awal nama dipakai sebagai isi avatar'));
  root.appendChild(T.field('Warna latar', warnaSel));
  root.appendChild(T.field('Ukuran gambar', ukuranSel));
  root.appendChild(T.row(T.btn('Buat avatar', buat, true)));
  root.appendChild(box);
}
