import { h as T, esc, errBox } from '../../core.js';

// Cari kode pos Indonesia, tanpa key.
// Terverifikasi 17 Nov 2026: https://kodepos.vercel.app/search/?q=jakarta -> 200, CORS *.
export const meta = {"id":"kode-pos-indonesia","name":"Kode Pos Indonesia","cat":"liveapi","icon":"📮","desc":"Cari kode pos dari nama tempat: kelurahan, kecamatan, kabupaten, dan provinsi.","keywords":"kode pos,pos indonesia,kelurahan,kecamatan,kabupaten,provinsi,alamat","since":"6.17.0"};

async function getJSON(url) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 15000);
  try {
    const r = await fetch(url, { signal: c.signal });
    if (!r.ok) throw new Error('http ' + r.status);
    return await r.json();
  } finally { clearTimeout(t); }
}

export function render(root) {
  const box = T.out();
  const inp = T.input('text', 'Contoh: Gambir, Bandung, atau Tebet');
  inp.setAttribute('autocomplete', 'off');

  const cari = async () => {
    const q = String(inp.value || '').trim();
    if (!q) { T.show(box, errBox('Tulis nama tempat dulu.')); return; }
    T.show(box, '<p class="mut">Mencari kode pos untuk ' + esc(q) + '…</p>');
    try {
      const j = await getJSON('https://kodepos.vercel.app/search/?q=' + encodeURIComponent(q));
      const list = (j && j.data) || [];
      if (!list.length) {
        T.show(box, '<p class="center dim">Tidak ada tempat yang cocok. Coba nama kelurahan atau kecamatan yang lebih umum.</p>');
        return;
      }
      T.show(box, '<p class="hint">' + list.length + ' tempat ditemukan</p>' + list.slice(0, 20).map((d) =>
        '<div class="kv"><span class="k"><b>' + esc(d.village || '-') + '</b><br><span class="hint">' +
        esc([d.district, d.regency, d.province].filter(Boolean).join(', ')) + '</span></span>' +
        '<span class="v" style="font-size:16px;font-weight:700">' + esc(String(d.code || '')) + '</span></div>'
      ).join('') + '<p class="hint">Sumber: data kode pos Indonesia (kodepos.vercel.app).</p>');
    } catch (e) {
      const msg = e.name === 'AbortError'
        ? 'Waktu habis, server tidak merespons dalam 15 detik.'
        : 'Gagal mencari kode pos. Cek koneksi internet, lalu coba lagi.';
      T.show(box, errBox(msg));
      const wr = T.el('<div style="margin-top:8px"></div>');
      wr.appendChild(T.btn('🔄 Coba lagi', cari));
      box.appendChild(wr);
    }
  };

  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') cari(); });
  root.appendChild(T.el('<p class="note">Tulis nama kelurahan, kecamatan, atau kota untuk melihat kode pos beserta wilayahnya.</p>'));
  root.appendChild(T.field('Nama tempat', inp, 'Contoh: Gambir, Bandung'));
  root.appendChild(T.row(T.btn('🔍 Cari kode pos', cari, true)));
  root.appendChild(box);
}
