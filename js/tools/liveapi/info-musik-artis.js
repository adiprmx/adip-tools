import { h as T, esc, errBox } from '../../core.js';

// Info artis lewat MusicBrainz (basis data musik terbuka), tanpa key.
// Terverifikasi 17 Nov 2026: /ws/2/artist/?query=artist:coldplay&fmt=json&limit=1 -> 200, CORS *.
// MusicBrainz membatasi 1 permintaan per detik. Browser tidak bisa mengirim
// User-Agent kustom (header terlarang di fetch), jadi permintaan memakai
// User-Agent browser pengunjung apa adanya, sesuai aturan MusicBrainz untuk
// pemakaian lewat browser. Batas 1/detik ditegakkan di bawah (giliranMusicBrainz).
export const meta = {"id":"info-musik-artis","name":"Info Musik Artis","cat":"liveapi","icon":"🎤","desc":"Cari artis atau band: asal negara, tahun aktif, dan jenis musiknya.","keywords":"musik,artis,band,penyanyi,musicbrainz,musisi,grup musik","since":"6.17.0"};

// Antrean throttle 1 permintaan/detik: pencarian berurutan (klik cepat,
// Enter berulang) tidak pernah menembak lebih cepat dari batas MusicBrainz,
// walau dipanggil bersamaan. Rantai janji membuat tiap panggilan menunggu
// gilirannya; kegagalan satu tugas tidak memacetkan antrean.
let terakhirPanggil = 0;
let antrean = Promise.resolve();
export function giliranMusicBrainz() {
  const tugas = antrean.then(async () => {
    const tunggu = 1000 - (Date.now() - terakhirPanggil);
    if (tunggu > 0) await new Promise((r) => setTimeout(r, tunggu));
    terakhirPanggil = Date.now();
  });
  antrean = tugas.catch(() => {});
  return tugas;
}

async function getJSON(url) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 15000);
  try {
    const r = await fetch(url, { signal: c.signal });
    if (!r.ok) throw new Error('http ' + r.status);
    return await r.json();
  } finally { clearTimeout(t); }
}

const JENIS = { Person: 'Perorangan', Group: 'Grup/band', Orchestra: 'Orkestra', Choir: 'Paduan suara', Character: 'Karakter fiksi', Other: 'Lainnya' };

export function render(root) {
  const box = T.out();
  const inp = T.input('text', 'Contoh: Coldplay, Dewa 19, atau Taylor Swift');
  inp.setAttribute('autocomplete', 'off');

  const cari = async () => {
    const q = String(inp.value || '').trim();
    if (!q) { T.show(box, errBox('Tulis nama artis atau band dulu.')); return; }
    T.show(box, '<p class="mut">Mencari artis ' + esc(q) + '…</p>');
    try {
      await giliranMusicBrainz();
      const j = await getJSON('https://musicbrainz.org/ws/2/artist/?query=artist:' + encodeURIComponent(q) + '&fmt=json&limit=5');
      const list = (j && j.artists) || [];
      if (!list.length) {
        T.show(box, '<p class="center dim">Tidak ada artis yang cocok dengan pencarian itu. Coba ejaan lain atau nama yang lebih umum.</p>');
        return;
      }
      T.show(box, '<p class="hint">' + list.length + ' hasil dari MusicBrainz</p>' + list.map((a) => {
        const mulai = a['life-span'] && a['life-span'].begin;
        const selesai = a['life-span'] && a['life-span'].end;
        const tags = (a.tags || []).slice(0, 5).map((t) => t.name).filter(Boolean);
        const tautan = 'https://musicbrainz.org/artist/' + encodeURIComponent(a.id || '');
        return '<div style="border-top:1px solid #ffffff14;padding:12px 0">' +
          '<div style="font-weight:700;font-size:15px">' + esc(a.name || 'Tanpa nama') + '</div>' +
          '<div class="dim" style="font-size:12.5px;line-height:1.7">' +
          (JENIS[a.type] ? esc(JENIS[a.type]) : '') +
          (a.country ? ' · ' + esc(a.country) : '') +
          (a.area && a.area.name ? ' · ' + esc(a.area.name) : '') +
          (mulai ? ' · aktif sejak ' + esc(String(mulai).slice(0, 4)) + (selesai ? ' sampai ' + esc(String(selesai).slice(0, 4)) : '') : '') +
          '</div>' +
          (a.disambiguation ? '<div class="hint">' + esc(a.disambiguation) + '</div>' : '') +
          (tags.length ? '<div class="hint">Gaya: ' + esc(tags.join(', ')) + '</div>' : '') +
          (a.id ? '<div style="margin-top:4px"><a href="' + esc(tautan) + '" target="_blank" rel="noopener" style="font-size:12.5px">Lihat di MusicBrainz</a></div>' : '') +
          '</div>';
      }).join('') + '<p class="hint">Sumber: MusicBrainz, basis data musik terbuka yang dirawat komunitas.</p>');
    } catch (e) {
      const msg = e.name === 'AbortError'
        ? 'Waktu habis, server MusicBrainz tidak merespons dalam 15 detik.'
        : 'Gagal mencari artis. MusicBrainz membatasi 1 permintaan per detik, tunggu sebentar lalu coba lagi.';
      T.show(box, errBox(msg));
      const wr = T.el('<div style="margin-top:8px"></div>');
      wr.appendChild(T.btn('🔄 Coba lagi', cari));
      box.appendChild(wr);
    }
  };

  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') cari(); });
  root.appendChild(T.el('<p class="note">Cari artis atau band untuk melihat asal negara, tahun aktif, dan gaya musiknya. Data dari MusicBrainz.</p>'));
  root.appendChild(T.field('Nama artis atau band', inp, 'Contoh: Coldplay, Dewa 19'));
  root.appendChild(T.row(T.btn('🔍 Cari artis', cari, true)));
  root.appendChild(box);
}
