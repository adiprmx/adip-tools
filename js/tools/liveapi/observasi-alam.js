import { h as T, esc, errBox } from '../../core.js';

// Observasi satwa dan tumbuhan lewat iNaturalist, tanpa key.
// Terverifikasi 17 Nov 2026: /v1/observations?taxon_name=Panthera%20tigris&per_page=1 -> 200, CORS *.
export const meta = {"id":"observasi-alam","name":"Observasi Alam","cat":"liveapi","icon":"🌿","desc":"Lihat foto dan lokasi pengamatan satwa atau tumbuhan dari masyarakat di iNaturalist.","keywords":"inaturalist,observasi,satwa,tumbuhan,alam,hewan,flora,fauna,pengamatan","since":"6.17.0"};

async function getJSON(url) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 15000);
  try {
    const r = await fetch(url, { signal: c.signal });
    if (!r.ok) throw new Error('http ' + r.status);
    return await r.json();
  } finally { clearTimeout(t); }
}

const gambarAman = (u) => typeof u === 'string' && u.indexOf('https://') === 0;

function tglCantik(s) {
  if (!s) return '';
  const d = new Date(s);
  if (isNaN(d)) return String(s).slice(0, 10);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function render(root) {
  const box = T.out();
  const inp = T.input('text', 'Contoh: Panthera tigris, atau harimau');
  inp.setAttribute('autocomplete', 'off');

  const cari = async () => {
    const q = String(inp.value || '').trim();
    if (!q) { T.show(box, errBox('Tulis nama satwa atau tumbuhan dulu.')); return; }
    T.show(box, '<p class="mut">Mencari pengamatan ' + esc(q) + '…</p>');
    try {
      const j = await getJSON('https://api.inaturalist.org/v1/observations?taxon_name=' + encodeURIComponent(q) + '&per_page=10&order=desc&order_by=observed_on');
      const list = (j && j.results) || [];
      if (!list.length) {
        T.show(box, '<p class="center dim">Tidak ada pengamatan untuk nama itu. Coba nama latinnya, contoh: Panthera tigris untuk harimau.</p>');
        return;
      }
      T.show(box, '<p class="hint">' + T.fmt(j.total_results || list.length) + ' pengamatan tercatat, menampilkan ' + list.length + ' terbaru</p>' + list.map((o) => {
        const takson = o.taxon || {};
        const foto = o.photos && o.photos[0] && o.photos[0].url;
        const pengamat = o.user && o.user.login;
        return '<div style="border-top:1px solid #ffffff14;padding:12px 0;display:flex;gap:12px">' +
          (gambarAman(foto) ? '<img src="' + esc(foto) + '" alt="" style="width:96px;height:96px;object-fit:cover;border-radius:8px;flex:none" loading="lazy" data-err="hide">' : '') +
          '<div style="min-width:0">' +
          '<div style="font-weight:700;font-size:14px">' + esc(takson.preferred_common_name || takson.name || 'Tanpa nama') + '</div>' +
          (takson.preferred_common_name && takson.name ? '<div class="dim" style="font-size:12.5px;font-style:italic">' + esc(takson.name) + '</div>' : '') +
          '<div class="dim" style="font-size:12.5px;line-height:1.7">' +
          (o.observed_on ? 'Diamati: ' + esc(tglCantik(o.observed_on)) : '') +
          (o.place_guess ? '<br>Lokasi: ' + esc(o.place_guess) : '') +
          (pengamat ? '<br>Pengamat: ' + esc(pengamat) : '') +
          '</div>' +
          (o.uri && o.uri.indexOf('https://') === 0 ? '<div style="margin-top:4px"><a href="' + esc(o.uri) + '" target="_blank" rel="noopener" style="font-size:12.5px">Lihat di iNaturalist</a></div>' : '') +
          '</div></div>';
      }).join('') + '<p class="hint">Sumber: iNaturalist, pengamatan dikirim masyarakat dari seluruh dunia.</p>');
      T.wireImgErr(box);
    } catch (e) {
      const msg = e.name === 'AbortError'
        ? 'Waktu habis, server iNaturalist tidak merespons dalam 15 detik.'
        : 'Gagal mencari pengamatan. Cek koneksi internet, lalu coba lagi.';
      T.show(box, errBox(msg));
      const wr = T.el('<div style="margin-top:8px"></div>');
      wr.appendChild(T.btn('🔄 Coba lagi', cari));
      box.appendChild(wr);
    }
  };

  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') cari(); });
  root.appendChild(T.el('<p class="note">Cari satwa atau tumbuhan untuk melihat foto pengamatan masyarakat beserta lokasi dan tanggalnya. Nama latin memberi hasil paling akurat.</p>'));
  root.appendChild(T.field('Nama satwa atau tumbuhan', inp, 'Contoh: Panthera tigris, atau harimau'));
  root.appendChild(T.row(T.btn('🔍 Cari pengamatan', cari, true)));
  root.appendChild(box);
}
