import { h as T, esc, errBox, utils } from '../../core.js';

// Lowongan kerja Eropa dan remote lewat Arbeitnow, tanpa key.
// Terverifikasi 17 Nov 2026: /api/job-board-api -> 200, CORS *.
// Tautan melamar mengarah ke situs asli lowongannya.
export const meta = {"id":"lowongan-kerja-eropa-remote","name":"Lowongan Kerja Eropa Remote","cat":"liveapi","icon":"💼","desc":"Lowongan kerja terbaru di Eropa dan yang bisa dikerjakan dari rumah.","keywords":"lowongan kerja,loker,eropa,remote,kerja dari rumah,arbeitnow,pekerjaan","since":"6.17.0", "online": true};

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
      (j.title || '').toLowerCase().includes(q) ||
      (j.company_name || '').toLowerCase().includes(q) ||
      (j.location || '').toLowerCase().includes(q));
    if (!list.length) {
      T.show(box, '<p class="center dim">Tidak ada lowongan yang cocok dengan saringan itu.</p>');
      return;
    }
    T.show(box, '<p class="hint">' + list.length + ' lowongan' + (q ? ' cocok dengan saringan' : '') + '</p>' + list.slice(0, 30).map((j) => {
      const jenis = (j.job_types || []).join(', ');
      return '<div style="border-top:1px solid #ffffff14;padding:12px 0">' +
        '<div style="font-weight:700;font-size:14px;line-height:1.5">' + esc(j.title || 'Tanpa judul') + '</div>' +
        '<div class="dim" style="font-size:12.5px;line-height:1.7">' +
        esc(j.company_name || '') +
        (j.location ? ' · ' + esc(j.location) : '') +
        (jenis ? ' · ' + esc(jenis) : '') +
        (j.created_at ? '<br>Diposting: ' + esc(utils.tglCantik(j.created_at)) : '') +
        '</div>' +
        (tautanAman(j.url) ? '<div style="margin-top:4px"><a href="' + esc(j.url) + '" target="_blank" rel="noopener" style="font-size:12.5px">Lihat lowongan di situs aslinya</a></div>' : '') +
        '</div>';
    }).join('') + '<p class="hint">Sumber: Arbeitnow. Selalu baca detailnya di situs asli sebelum melamar.</p>');
  };

  const muat = async () => {
    T.show(box, '<p class="mut">Mengambil daftar lowongan…</p>');
    try {
      const j = await getJSON('https://www.arbeitnow.com/api/job-board-api');
      semua = (j && j.data) || [];
      if (!semua.length) {
        T.show(box, '<p class="center dim">Tidak ada lowongan yang tersedia saat ini.</p>');
        return;
      }
      tampil();
    } catch (e) {
      const msg = e.name === 'AbortError'
        ? 'Waktu habis, server tidak bisa dihubungi dalam 15 detik.'
        : 'Gagal mengambil daftar lowongan. Cek koneksi internet, lalu coba lagi.';
      T.show(box, errBox(msg));
      const wr = T.el('<div style="margin-top:8px"></div>');
      wr.appendChild(T.btn('🔄 Coba lagi', muat));
      box.appendChild(wr);
    }
  };

  cariI.addEventListener('input', () => { if (semua.length) tampil(); });
  root.appendChild(T.el('<p class="note">Lowongan kerja terbaru di Eropa dan yang bisa dikerjakan dari rumah. Ketik kata kunci untuk menyaring, tautan melamar mengarah ke situs aslinya.</p>'));
  root.appendChild(T.field('Saring lowongan', cariI, 'Penyaringan dilakukan di perangkatmu, tanpa memanggil server lagi'));
  root.appendChild(T.row(T.btn('🔄 Muat ulang', muat)));
  root.appendChild(box);
  muat();
}
