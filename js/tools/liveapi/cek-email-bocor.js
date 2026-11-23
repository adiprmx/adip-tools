import { h as T, esc, errBox } from '../../core.js';

// Cek kebocoran email lewat XposedOrNot (tanpa key).
// Terverifikasi 18 Nov 2026: api.xposedornot.com/v1/check-email/ 200, CORS *.
// API ini mengembalikan 404 bila email TIDAK ditemukan di basis datanya,
// itu kabar baik, bukan error. Email yang dicek dikirim ke API itu,
// dan itu ditulis jelas di UI.
const API = 'https://api.xposedornot.com/v1/check-email/';

async function cekEmail(email) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 15000);
  try {
    const r = await fetch(API + encodeURIComponent(email), { signal: c.signal });
    if (r.status === 404) return { tidakDitemukan: true };
    if (!r.ok) throw new Error('http ' + r.status);
    return await r.json();
  } finally { clearTimeout(t); }
}

export const meta = {"id": "cek-email-bocor", "name": "Cek Email Bocor", "cat": "liveapi", "icon": "🔓", "desc": "Cek apakah emailmu pernah muncul di kebocoran data yang diketahui publik.", "keywords": "email,bocor,kebocoran data,breach,keamanan,cek email,xposedornot,password", "since": "6.17.0", "online": true};

export function render(root) {
  const box = T.out();
  const inp = T.input('email', 'Contoh: nama@email.com');
  inp.setAttribute('autocomplete', 'off');

  const gagal = (pesan) => {
    T.show(box, errBox(pesan));
    const w = T.el('<div style="margin-top:8px"></div>');
    w.appendChild(T.btn('Coba lagi', cari));
    box.appendChild(w);
  };

  const cari = async () => {
    const email = String(inp.value || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      T.show(box, errBox('Tulis alamat email yang valid, contoh: nama@email.com.'));
      return;
    }
    T.show(box, '<p class="mut">Memeriksa ' + esc(email) + ' di basis data kebocoran…</p>');
    try {
      const j = await cekEmail(email);
      if (j && j.tidakDitemukan) {
        T.show(box, '<div class="center"><div style="font-weight:800;font-size:16px">Tidak ditemukan di basis data ini</div>' +
          '<p class="dim" style="font-size:13px;line-height:1.6;margin-top:8px">Email itu tidak muncul di kebocoran data yang dicatat XposedOrNot. Bukan jaminan emailmu 100% aman, karena tidak semua kebocoran tercatat publik.</p></div>' +
          '<p class="hint">Sumber: XposedOrNot, basis data kebocoran publik.</p>');
        return;
      }
      const mentah = j && j.breaches ? j.breaches : [];
      const daftar = (Array.isArray(mentah) ? mentah.flat() : []).map(String).filter(Boolean);
      if (!daftar.length) {
        T.show(box, '<div class="center"><div style="font-weight:800;font-size:16px">Tidak ditemukan di basis data ini</div>' +
          '<p class="dim" style="font-size:13px;line-height:1.6;margin-top:8px">Email itu tidak muncul di kebocoran data yang dicatat XposedOrNot.</p></div>');
        return;
      }
      T.show(box, '<div class="center"><div style="font-weight:800;font-size:16px;color:var(--err)">Email ini pernah bocor di ' + daftar.length + ' layanan</div>' +
        '<p class="dim" style="font-size:13px;line-height:1.6;margin-top:8px">Segera ganti kata sandi di layanan di bawah ini, terutama kalau kata sandinya sama dengan layanan lain. Nyalakan verifikasi dua langkah bila ada.</p></div>' +
        '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:12px">' +
        daftar.map((b) => '<span style="border:1px solid #2e2823;border-radius:999px;padding:4px 10px;font-size:12.5px">' + esc(b) + '</span>').join('') +
        '</div><p class="hint">Sumber: XposedOrNot, basis data kebocoran publik. Daftar ini hanya nama layanannya, bukan isi data yang bocor.</p>');
    } catch (e) {
      gagal(e.name === 'AbortError'
        ? 'Waktu habis, server pemeriksa tidak bisa dihubungi dalam 15 detik.'
        : 'Pemeriksaan gagal. Cek koneksi internet, lalu coba lagi.');
    }
  };

  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') cari(); });
  root.appendChild(T.el('<p class="note">Cek apakah emailmu pernah muncul di kebocoran data yang diketahui publik. Email yang kamu tulis dikirim ke layanan XposedOrNot untuk dicek, dan hasilnya berasal dari basis data publik mereka.</p>'));
  root.appendChild(T.field('Alamat email', inp, 'Email hanya dipakai untuk pengecekan ini'));
  root.appendChild(T.row(T.btn('Cek email', cari, true)));
  root.appendChild(box);
}
