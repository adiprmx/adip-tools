import { h as T, esc, errBox } from '../../core.js';

// Cari sekolah di Indonesia lewat API Sekolah Indonesia (tanpa key).
// Terverifikasi 18 Nov 2026: api-sekolah-indonesia.vercel.app/sekolah/s 200, CORS *.
// ATURAN KERAS KOORDINATOR: field `Donate` (nomor donasi pemilik API) yang ada
// di respons mentah TIDAK PERNAH ditampilkan. Hanya `dataSekolah` yang dipakai.
const API = 'https://api-sekolah-indonesia.vercel.app/sekolah/s';
const PER_HALAMAN = 10;

async function getJSON(url) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 15000);
  try {
    const r = await fetch(url, { signal: c.signal });
    if (!r.ok) throw new Error('http ' + r.status);
    return await r.json();
  } finally { clearTimeout(t); }
}

export const meta = {"id": "cari-sekolah", "name": "Cari Sekolah", "cat": "liveapi", "icon": "🏫", "desc": "Cari sekolah di seluruh Indonesia berdasarkan nama, lengkap dengan NPSN dan alamatnya.", "keywords": "sekolah,cari sekolah,npsn,pendidikan,sd,smp,sma,smk,indonesia", "since": "6.17.0", "online": true};

export function render(root) {
  const box = T.out();
  const inp = T.input('text', 'Contoh: SMA Negeri 1 Jakarta', 'SMA Negeri 1');
  let halaman = 1;
  let kataKunci = '';

  const gagal = (pesan) => {
    T.show(box, errBox(pesan));
    const w = T.el('<div style="margin-top:8px"></div>');
    w.appendChild(T.btn('Coba lagi', () => muat(halaman)));
    box.appendChild(w);
  };

  const muat = async (hal) => {
    const q = kataKunci;
    halaman = hal;
    T.show(box, '<p class="mut">Mencari sekolah ' + esc(q) + '…</p>');
    try {
      const j = await getJSON(API + '?sekolah=' + encodeURIComponent(q) + '&page=' + hal + '&perPage=' + PER_HALAMAN);
      // Hanya dataSekolah yang dibaca. Field lain di respons (termasuk Donate)
      // sengaja tidak pernah disentuh.
      const list = j && Array.isArray(j.dataSekolah) ? j.dataSekolah : [];
      if (!list.length) {
        T.show(box, '<p class="center dim">' + (hal === 1
          ? 'Tidak ada sekolah yang cocok dengan nama itu. Coba nama yang lebih pendek, contoh: SMA Negeri 1.'
          : 'Tidak ada lagi sekolah di halaman ini.') + '</p>' +
          (hal > 1 ? '<p class="center" style="margin-top:10px"><button class="btn" id="cs-prev0">Halaman sebelumnya</button></p>' : ''));
        const p0 = box.querySelector('#cs-prev0');
        if (p0) p0.addEventListener('click', () => muat(hal - 1));
        return;
      }
      T.show(box, '<p class="hint">Halaman ' + hal + ' untuk "' + esc(q) + '".</p>' +
        list.map((s) => {
          const alamat = [s.alamat_jalan, s.kecamatan, s.kabupaten_kota, s.propinsi].filter(Boolean).join(', ');
          return '<div style="border-top:1px solid #ffffff14;padding:12px 0">' +
            '<div style="font-weight:700;font-size:14px;line-height:1.4">' + esc(String(s.sekolah || 'Tanpa nama')) + '</div>' +
            '<div class="dim" style="font-size:12px;line-height:1.5;margin-top:4px">' +
            (s.npsn ? 'NPSN: ' + esc(String(s.npsn)) : '') +
            (s.jenjang ? ' · ' + esc(String(s.jenjang)) : '') +
            (s.status ? ' · ' + esc(String(s.status)) : '') +
            (alamat ? '<br>' + esc(alamat) : '') + '</div></div>';
        }).join('') +
        '<div class="center" style="margin-top:12px;display:flex;gap:8px;justify-content:center">' +
        (hal > 1 ? '<button class="btn" id="cs-prev">Sebelumnya</button>' : '') +
        (list.length === PER_HALAMAN ? '<button class="btn primary" id="cs-next">Berikutnya</button>' : '') +
        '</div>' +
        '<p class="hint">Sumber: API Sekolah Indonesia (data Dapodik Kemendikbudristek).</p>');
      const prev = box.querySelector('#cs-prev');
      if (prev) prev.addEventListener('click', () => muat(hal - 1));
      const next = box.querySelector('#cs-next');
      if (next) next.addEventListener('click', () => muat(hal + 1));
    } catch (e) {
      gagal(e.name === 'AbortError'
        ? 'Waktu habis, server data sekolah tidak bisa dihubungi dalam 15 detik.'
        : 'Pencarian gagal. Cek koneksi internet, lalu coba lagi.');
    }
  };

  const cariBaru = () => {
    const q = String(inp.value || '').trim();
    if (!q) { T.show(box, errBox('Tulis nama sekolah dulu, contoh: SMA Negeri 1.')); return; }
    kataKunci = q;
    muat(1);
  };

  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') cariBaru(); });
  root.appendChild(T.el('<p class="note">Cari sekolah apa pun di Indonesia dari namanya. Hasilnya menampilkan NPSN, jenjang, status, dan alamat sekolah.</p>'));
  root.appendChild(T.field('Nama sekolah', inp, 'Contoh: SMA Negeri 1, SDN Menteng, SMK Telkom'));
  root.appendChild(T.row(T.btn('Cari sekolah', cariBaru, true)));
  root.appendChild(box);
  kataKunci = 'SMA Negeri 1';
  muat(1);
}
