import { h as T, esc, errBox, utils } from '../../core.js';

// Lowongan kerja remote lewat RemoteOK, tanpa key.
// Terverifikasi 17 Nov 2026: https://remoteok.com/api -> 200, CORS *.
// SYARAT ATRIBUSI RemoteOK: tampilkan tautan kembali ke RemoteOK dan
// sebut RemoteOK sebagai sumber. Atribusi ada di bawah daftar.
// Elemen pertama respons adalah catatan legal API, bukan lowongan.
export const meta = {"id":"lowongan-kerja-remote","name":"Lowongan Kerja Remote","cat":"liveapi","icon":"🌍","desc":"Lowongan kerja remote dari seluruh dunia, dari berbagai bidang.","keywords":"lowongan kerja,loker,remote,kerja dari rumah,remoteok,pekerjaan,wfh","since":"6.17.0"};

async function getJSON(url) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 15000);
  try {
    const r = await fetch(url, { signal: c.signal });
    if (!r.ok) throw new Error('http ' + r.status);
    return await r.json();
  } finally { clearTimeout(t); }
}

const tautanAman = (u) => typeof u === 'string' && u.indexOf('https://') === 0;

// tglCantik kanonis tinggal di utils (core.js).

export function render(root) {
  const box = T.out();
  const cariI = T.input('text', 'Saring: contoh developer, desain, marketing…');
  cariI.setAttribute('autocomplete', 'off');
  let semua = [];

  const tampil = () => {
    const q = String(cariI.value || '').trim().toLowerCase();
    const list = !q ? semua : semua.filter((j) =>
      (j.position || '').toLowerCase().includes(q) ||
      (j.company || '').toLowerCase().includes(q) ||
      ((j.tags || []).join(' ')).toLowerCase().includes(q));
    if (!list.length) {
      T.show(box, '<p class="center dim">Tidak ada lowongan yang cocok dengan saringan itu.</p>');
      return;
    }
    T.show(box, '<p class="hint">' + list.length + ' lowongan' + (q ? ' cocok dengan saringan' : '') + '</p>' + list.slice(0, 30).map((j) => {
      const tags = (j.tags || []).slice(0, 5);
      return '<div style="border-top:1px solid #ffffff14;padding:12px 0">' +
        '<div style="font-weight:700;font-size:14px;line-height:1.5">' + esc(j.position || 'Tanpa judul') + '</div>' +
        '<div class="dim" style="font-size:12.5px;line-height:1.7">' +
        esc(j.company || '') +
        (j.location ? ' · ' + esc(j.location) : '') +
        (j.date ? '<br>Diposting: ' + esc(utils.tglCantik(j.date)) : '') +
        '</div>' +
        (tags.length ? '<div class="hint">' + esc(tags.join(' · ')) + '</div>' : '') +
        (tautanAman(j.url) ? '<div style="margin-top:4px"><a href="' + esc(j.url) + '" target="_blank" rel="noopener" style="font-size:12.5px">Lihat lowongan di situs aslinya</a></div>' : '') +
        '</div>';
    }).join('') + '<p class="hint">Sumber data: <a href="https://remoteok.com" target="_blank" rel="noopener">RemoteOK</a>. Selalu baca detailnya di situs asli sebelum melamar.</p>');
  };

  const muat = async () => {
    T.show(box, '<p class="mut">Mengambil daftar lowongan…</p>');
    try {
      const j = await getJSON('https://remoteok.com/api');
      semua = (Array.isArray(j) ? j : []).filter((x) => x && x.id && x.position);
      if (!semua.length) {
        T.show(box, '<p class="center dim">Tidak ada lowongan yang tersedia saat ini.</p>');
        return;
      }
      tampil();
    } catch (e) {
      const msg = e.name === 'AbortError'
        ? 'Waktu habis, server tidak merespons dalam 15 detik.'
        : 'Gagal mengambil daftar lowongan. Cek koneksi internet, lalu coba lagi.';
      T.show(box, errBox(msg));
      const wr = T.el('<div style="margin-top:8px"></div>');
      wr.appendChild(T.btn('🔄 Coba lagi', muat));
      box.appendChild(wr);
    }
  };

  cariI.addEventListener('input', () => { if (semua.length) tampil(); });
  root.appendChild(T.el('<p class="note">Lowongan kerja remote dari seluruh dunia. Ketik kata kunci untuk menyaring, tautan melamar mengarah ke situs aslinya.</p>'));
  root.appendChild(T.field('Saring lowongan', cariI, 'Penyaringan dilakukan di perangkatmu, tanpa memanggil server lagi'));
  root.appendChild(T.row(T.btn('🔄 Muat ulang', muat)));
  root.appendChild(box);
  muat();
}
