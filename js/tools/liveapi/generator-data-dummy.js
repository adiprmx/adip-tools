import { h as T, esc, errBox } from '../../core.js';

// Profil acak lewat Random User Generator (tanpa key).
// Terverifikasi 18 Nov 2026: randomuser.me/api/ 200, CORS *.
// Data yang tampil adalah data ACAK untuk keperluan tes dan desain,
// BUKAN orang sungguhan. Itu ditulis jelas di UI.
const API = 'https://randomuser.me/api/';

async function getJSON(url) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 15000);
  try {
    const r = await fetch(url, { signal: c.signal });
    if (!r.ok) throw new Error('http ' + r.status);
    return await r.json();
  } finally { clearTimeout(t); }
}

const imgAman = (u) => {
  if (typeof u !== 'string') return null;
  try {
    const p = new URL(u.trim());
    return (p.protocol === 'http:' || p.protocol === 'https:') ? p.href : null;
  } catch (e) { return null; }
};

export const meta = {"id": "generator-data-dummy", "name": "Generator Data Dummy", "cat": "liveapi", "icon": "👤", "desc": "Buat profil acak untuk keperluan tes dan desain: nama, foto, email, dan alamat contoh.", "keywords": "dummy,data dummy,profil acak,random user,tes,desain,data contoh,fake data", "since": "6.17.0"};

export function render(root) {
  const box = T.out();
  const jmlS = T.select([['1', '1 profil'], ['5', '5 profil'], ['10', '10 profil']], '5');
  const genderS = T.select([['', 'Campur'], ['female', 'Perempuan'], ['male', 'Laki-laki']], '');
  let terakhir = null;

  const gagal = (pesan) => {
    T.show(box, errBox(pesan));
    const w = T.el('<div style="margin-top:8px"></div>');
    w.appendChild(T.btn('Coba lagi', muat));
    box.appendChild(w);
  };

  const muat = async () => {
    T.show(box, '<p class="mut">Membuat profil acak…</p>');
    try {
      let url = API + '?results=' + encodeURIComponent(jmlS.value);
      if (genderS.value) url += '&gender=' + encodeURIComponent(genderS.value);
      const j = await getJSON(url);
      const list = j && Array.isArray(j.results) ? j.results : [];
      if (!list.length) throw new Error('bad-data');
      terakhir = list;
      T.show(box, '<p class="hint">Ini data acak yang dibuat komputer untuk keperluan tes dan desain. Bukan orang sungguhan, jangan dipakai untuk hal yang butuh identitas asli.</p>' +
        list.map((u) => {
          const nama = ((u.name && u.name.first) || '') + ' ' + ((u.name && u.name.last) || '');
          const foto = u.picture && imgAman(u.picture.medium);
          const kota = u.location ? [u.location.city, u.location.state, u.location.country].filter(Boolean).join(', ') : '';
          const umur = u.dob && typeof u.dob.age === 'number' ? u.dob.age + ' tahun' : '';
          return '<div style="border-top:1px solid #ffffff14;padding:12px 0;display:flex;gap:12px">' +
            (foto ? '<img src="' + esc(foto) + '" alt="" loading="lazy" data-err="hide" style="width:56px;height:56px;border-radius:50%;flex:none;object-fit:cover">' : '') +
            '<div style="min-width:0;flex:1;font-size:13px;line-height:1.5">' +
            '<div style="font-weight:700;font-size:14px">' + esc(nama.trim() || 'Tanpa nama') + '</div>' +
            (umur ? '<div class="dim">' + esc(umur) + (u.gender ? ' · ' + esc(String(u.gender)) : '') + '</div>' : '') +
            (u.email ? '<div style="word-break:break-all">' + esc(String(u.email)) + '</div>' : '') +
            (u.phone ? '<div>' + esc(String(u.phone)) + '</div>' : '') +
            (kota ? '<div class="dim">' + esc(kota) + '</div>' : '') +
            '</div></div>';
        }).join(''));
      const w = T.el('<div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap"></div>');
      w.appendChild(T.btn('Buat lagi', muat, true));
      w.appendChild(T.copyBtn(() => terakhir ? JSON.stringify(terakhir, null, 2) : '', 'Salin JSON'));
      box.appendChild(w);
      T.wireImgErr(box);
    } catch (e) {
      gagal(e.name === 'AbortError'
        ? 'Waktu habis, server pembuat profil tidak merespons dalam 15 detik.'
        : 'Profil gagal dibuat. Cek koneksi internet, lalu coba lagi.');
    }
  };

  root.appendChild(T.el('<p class="note">Butuh data contoh untuk mengisi desain atau menguji aplikasi? Tool ini membuat profil acak: nama, foto, email, dan alamat. Sekali lagi: ini data acak, bukan orang sungguhan.</p>'));
  root.appendChild(T.field('Berapa profil', jmlS));
  root.appendChild(T.field('Jenis kelamin', genderS));
  root.appendChild(T.row(T.btn('Buat profil', muat, true)));
  root.appendChild(box);
}
