import { h as T, esc, errBox } from '../../core.js';

export const meta = {"id":"info-crate-rust","name":"Info Crate Rust","cat":"liveapi","icon":"🦀","desc":"Lihat versi terbaru, deskripsi, dan unduhan paket Rust di crates.io.","keywords":"rust,crate,crates.io,paket,cargo","since":"6.18.0", "online": true};

// Info paket Rust (crate) lewat crates.io, tanpa key.
// Terverifikasi 18 Nov 2026: crates.io/api/v1/crates/serde -> 200, CORS *.
// Dicek ulang 19 Nov 2026: 200 dengan User-Agent browser (curl tanpa
// User-Agent ditolak 403 oleh crates.io; browser selalu mengirim User-Agent).
// Beda dari Info Paket NPM/Python: ini registry bahasa Rust.
const API = 'https://crates.io/api/v1/crates/';

async function getJSON(url) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 10000);
  try {
    const r = await fetch(url, { signal: c.signal });
    if (r.status === 404) throw new Error('not-found');
    if (!r.ok) throw new Error('http ' + r.status);
    return await r.json();
  } finally { clearTimeout(t); }
}

export function ringkasCrate(j) {
  const c = j && j.crate;
  if (!c || typeof c.name !== 'string') return null;
  const tautan = (u) => (typeof u === 'string' && u.indexOf('https://') === 0 ? u : '');
  return {
    nama: c.name,
    deskripsi: typeof c.description === 'string' ? c.description : '',
    versi: typeof c.max_version === 'string' ? c.max_version : '-',
    unduhan: typeof c.downloads === 'number' ? c.downloads : null,
    lisensi: typeof c.license === 'string' ? c.license : '-',
    beranda: tautan(c.homepage),
    repo: tautan(c.repository),
    dibuat: typeof c.created_at === 'string' ? c.created_at : '',
    diperbarui: typeof c.updated_at === 'string' ? c.updated_at : '',
  };
}

const fmtTanggal = (iso) => {
  const d = new Date(iso);
  return isNaN(d) ? '-' : d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
};

export function render(root) {
  const box = T.out();
  const inp = T.input('text', 'Contoh: serde, tokio, clap');
  inp.setAttribute('autocomplete', 'off');
  inp.setAttribute('autocapitalize', 'off');

  const gagal = (pesan) => {
    T.show(box, errBox(pesan));
    const w = T.el('<div style="margin-top:8px"></div>');
    w.appendChild(T.btn('Coba lagi', cari));
    box.appendChild(w);
  };

  const cari = async () => {
    const nama = String(inp.value || '').trim().toLowerCase();
    if (!/^[a-z0-9][a-z0-9_-]*$/.test(nama)) {
      T.show(box, errBox('Tulis nama crate yang benar, contoh: serde.'));
      return;
    }
    T.show(box, '<p class="mut">Mencari crate ' + esc(nama) + '…</p>');
    try {
      const hasil = ringkasCrate(await getJSON(API + encodeURIComponent(nama)));
      if (!hasil) throw new Error('bad-data');
      T.show(box,
        '<div class="center"><div style="font-weight:800;font-size:18px;word-break:break-all">' + esc(hasil.nama) + '</div>' +
        '<div class="dim" style="font-size:12.5px;margin-top:2px">Versi terbaru: ' + esc(hasil.versi) + ' · Lisensi: ' + esc(hasil.lisensi) + '</div></div>' +
        (hasil.deskripsi ? '<p class="hint" style="margin-top:10px">' + esc(hasil.deskripsi) + '</p>' : '') +
        '<div style="margin-top:10px">' +
        '<div class="kv"><span class="k">Total diunduh</span><span class="v">' + (hasil.unduhan == null ? '-' : hasil.unduhan.toLocaleString('id-ID') + ' kali') + '</span></div>' +
        '<div class="kv"><span class="k">Pertama terbit</span><span class="v">' + esc(fmtTanggal(hasil.dibuat)) + '</span></div>' +
        '<div class="kv"><span class="k">Terakhir diperbarui</span><span class="v">' + esc(fmtTanggal(hasil.diperbarui)) + '</span></div>' +
        '</div>' +
        '<div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">' +
        '<a class="btn" href="https://crates.io/crates/' + encodeURIComponent(hasil.nama) + '" target="_blank" rel="noopener">Lihat di crates.io</a>' +
        (hasil.repo ? '<a class="btn" href="' + esc(hasil.repo) + '" target="_blank" rel="noopener">Kode sumber</a>' : '') +
        (hasil.beranda ? '<a class="btn" href="' + esc(hasil.beranda) + '" target="_blank" rel="noopener">Situs resmi</a>' : '') +
        '</div>' +
        '<p class="hint">Sumber: crates.io, registry resmi paket Rust.</p>');
    } catch (e) {
      if (e.message === 'not-found') {
        T.show(box, '<p class="center dim">Crate tidak ditemukan di crates.io. Periksa ejaannya.</p>');
        return;
      }
      gagal(e.name === 'AbortError'
        ? 'Waktu habis, server crates.io tidak bisa dihubungi dalam 10 detik.'
        : 'Gagal mencari crate. Cek koneksi internet, lalu coba lagi.');
    }
  };

  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') cari(); });
  root.appendChild(T.el('<p class="note">Cari paket Rust di crates.io untuk melihat versi terbaru, deskripsi, dan jumlah unduhannya.</p>'));
  root.appendChild(T.field('Nama crate', inp, 'Contoh: serde, tokio'));
  root.appendChild(T.row(T.btn('🔍 Cari crate', cari, true)));
  root.appendChild(box);
}
