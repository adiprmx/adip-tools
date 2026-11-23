import { h as T, esc, errBox } from '../../core.js';

// Cari kota dari kode pos berbagai negara, lewat Zippopotam.us, tanpa key.
// Terverifikasi 19 Nov 2026: /us/90210 -> 200, CORS *.
// Respons: { country, "post code", places: [{ "place name", state, latitude,
// longitude }] }. TIDAK ada data Indonesia (kode pos Indonesia balas 404),
// jadi Indonesia tidak ada di daftar negara; pakai tool Kode Pos Indonesia.
export const meta = {"id":"kode-pos-dunia","name":"Kode Pos Dunia","cat":"liveapi","icon":"🌍","desc":"Cari kota dan wilayah dari kode pos berbagai negara di luar Indonesia.","keywords":"kode pos,zip,postal,negara,kota,dunia,alamat","since":"6.19.0", "online": true};

const NEGARA = [
  ['us', 'Amerika Serikat'], ['gb', 'Inggris'], ['ca', 'Kanada'],
  ['de', 'Jerman'], ['fr', 'Prancis'], ['nl', 'Belanda'], ['es', 'Spanyol'],
  ['it', 'Italia'], ['ch', 'Swiss'], ['at', 'Austria'], ['be', 'Belgia'],
  ['dk', 'Denmark'], ['no', 'Norwegia'], ['se', 'Swedia'], ['fi', 'Finlandia'],
  ['pl', 'Polandia'], ['pt', 'Portugal'], ['cz', 'Ceko'], ['hu', 'Hongaria'],
  ['jp', 'Jepang'], ['au', 'Australia'], ['in', 'India'], ['br', 'Brasil'],
  ['mx', 'Meksiko'], ['ar', 'Argentina'], ['za', 'Afrika Selatan'],
];

export function render(root) {
  const box = T.out();
  const negara = T.select(NEGARA, 'us');
  const kode = T.input('text', 'Contoh: 90210');
  kode.setAttribute('autocomplete', 'off');

  const cari = async () => {
    const k = kode.value.trim();
    if (!k) {
      T.show(box, errBox('Tulis dulu kode posnya.'));
      return;
    }
    T.show(box, '<p class="mut">Mencari…</p>');
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), 15000);
    try {
      const r = await fetch('https://api.zippopotam.us/' + negara.value + '/' + encodeURIComponent(k), { signal: c.signal });
      if (r.status === 404) throw new Error('notfound');
      if (!r.ok) throw new Error('http ' + r.status);
      const j = await r.json();
      const places = j && Array.isArray(j.places) ? j.places : [];
      if (!places.length) throw new Error('notfound');
      let html = '<p class="hint">' + esc(j.country || '') + ', kode pos ' + esc(j['post code'] || k) + ':</p>';
      places.forEach((p) => {
        html += '<div class="kv"><span class="k">Kota</span><span class="v">' + esc(p['place name'] || '-') + '</span></div>' +
          (p.state ? '<div class="kv"><span class="k">Wilayah</span><span class="v">' + esc(p.state) + '</span></div>' : '') +
          '<div class="kv"><span class="k">Koordinat</span><span class="v">' + esc(p.latitude || '-') + ', ' + esc(p.longitude || '-') + '</span></div>';
      });
      html += '<p class="hint">Sumber: Zippopotam.us. Data ini tidak mencakup Indonesia; untuk kode pos Indonesia pakai tool Kode Pos Indonesia.</p>';
      T.show(box, html);
    } catch (e) {
      const msg = e.name === 'AbortError'
        ? 'Waktu habis, server tidak bisa dihubungi dalam 15 detik.'
        : e.message === 'notfound'
          ? 'Kode pos tidak ditemukan di negara yang dipilih. Periksa lagi kode dan negaranya.'
          : 'Gagal mencari kode pos. Cek koneksi internet, lalu coba lagi.';
      T.show(box, errBox(msg));
      const wr = T.el('<div style="margin-top:8px"></div>');
      wr.appendChild(T.btn('🔄 Coba lagi', cari));
      box.appendChild(wr);
    } finally { clearTimeout(t); }
  };

  kode.addEventListener('keydown', (e) => { if (e.key === 'Enter') cari(); });
  root.appendChild(T.el('<p class="note">Pilih negara, tulis kode posnya, lalu ketuk Cari. Hasilnya nama kota, wilayah, dan koordinatnya.</p>'));
  root.appendChild(T.grid2(T.field('Negara', negara), T.field('Kode pos', kode)));
  root.appendChild(T.row(T.btn('🔍 Cari', cari, true)));
  root.appendChild(box);
  T.show(box, '<p class="center dim">Belum ada yang dicari. Coba kode pos 90210 di Amerika Serikat.</p>');
}
