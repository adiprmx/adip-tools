import { h as T, esc, errBox } from '../../core.js';

// Cari kartu Magic: The Gathering lewat Scryfall, tanpa key.
// Terverifikasi 17 Nov 2026: /cards/named?fuzzy=black+lotus -> 200, CORS *.
// Batas Scryfall: sekitar 10 permintaan per detik.
export const meta = {"id":"kartu-magic-mtg","name":"Kartu Magic MTG","cat":"liveapi","icon":"🃏","desc":"Cari kartu Magic: The Gathering lengkap dengan gambar, teks, dan harganya.","keywords":"magic,mtg,kartu magic,scryfall,card game,tcg,kartu","since":"6.17.0"};

export async function getJSON(url) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 15000);
  try {
    const r = await fetch(url, { signal: c.signal });
    const j = await r.json().catch(() => null);
    // Bedakan jenis gagalnya: 429 = dibatasi, 404/not_found = kartu memang
    // tidak ada, sisanya = server bermasalah. Jangan samakan semuanya jadi
    // "kartu tidak ditemukan".
    if (r.status === 429) throw new Error('rate-limit');
    if (r.status === 404 || (j && j.object === 'error' && j.code === 'not_found')) throw new Error('not-found');
    if (!r.ok || (j && j.object === 'error')) throw new Error('server-error');
    return j;
  } finally { clearTimeout(t); }
}

const gambarAman = (u) => typeof u === 'string' && u.indexOf('https://') === 0;

function gambarKartu(k) {
  if (k.image_uris && gambarAman(k.image_uris.normal)) return k.image_uris.normal;
  if (k.card_faces && k.card_faces[0] && k.card_faces[0].image_uris && gambarAman(k.card_faces[0].image_uris.normal)) return k.card_faces[0].image_uris.normal;
  return '';
}

function kartuHtml(k) {
  const img = gambarKartu(k);
  const harga = k.prices && (k.prices.usd || k.prices.usd_foil);
  return '<div style="border-top:1px solid #ffffff14;padding:12px 0;display:flex;gap:12px">' +
    (img ? '<img src="' + esc(img) + '" alt="" style="width:110px;height:auto;border-radius:8px;flex:none;align-self:flex-start" loading="lazy" data-err="hide">' : '') +
    '<div style="min-width:0">' +
    '<div style="font-weight:700;font-size:15px">' + esc(k.name || 'Tanpa nama') + '</div>' +
    '<div class="dim" style="font-size:12.5px;line-height:1.7">' +
    (k.type_line ? esc(k.type_line) : '') +
    (k.mana_cost ? ' · Biaya: ' + esc(k.mana_cost) : '') +
    (k.set_name ? '<br>Set: ' + esc(k.set_name) : '') +
    (k.rarity ? ' · ' + esc(k.rarity) : '') +
    (harga ? '<br>Harga pasar: $' + esc(harga) : '') +
    '</div>' +
    (k.oracle_text ? '<p class="hint" style="margin-top:6px;white-space:pre-wrap">' + esc(k.oracle_text) + '</p>' : '') +
    (k.flavor_text ? '<p class="hint" style="font-style:italic">' + esc(k.flavor_text) + '</p>' : '') +
    '</div></div>';
}

export function render(root) {
  const box = T.out();
  const inp = T.input('text', 'Contoh: Black Lotus, Lightning Bolt');
  inp.setAttribute('autocomplete', 'off');
  const mode = T.select([['named', 'Nama kartu (tepat)'], ['search', 'Cari bebas (kata kunci)']], 'named');

  const cari = async () => {
    const q = String(inp.value || '').trim();
    if (!q) { T.show(box, errBox('Tulis nama kartu dulu.')); return; }
    T.show(box, '<p class="mut">Mencari kartu ' + esc(q) + '…</p>');
    try {
      if (mode.value === 'named') {
        const k = await getJSON('https://api.scryfall.com/cards/named?fuzzy=' + encodeURIComponent(q));
        if (!k || !k.name) throw new Error('not-found');
        T.show(box, kartuHtml(k) + '<p class="hint">Sumber: Scryfall. Harga adalah harga pasar dalam dolar AS dan bisa berubah.</p>');
      } else {
        const j = await getJSON('https://api.scryfall.com/cards/search?q=' + encodeURIComponent(q));
        const list = (j && j.data) || [];
        if (!list.length) throw new Error('not-found');
        T.show(box, '<p class="hint">' + T.fmt(j.total_cards || list.length) + ' kartu cocok, menampilkan ' + Math.min(list.length, 8) + '</p>' +
          list.slice(0, 8).map(kartuHtml).join('') + '<p class="hint">Sumber: Scryfall.</p>');
      }
      T.wireImgErr(box);
    } catch (e) {
      if (e.message === 'not-found') {
        T.show(box, '<p class="center dim">Kartu tidak ditemukan. Coba nama dalam bahasa Inggris atau kata kunci yang lebih umum.</p>');
        return;
      }
      if (e.message === 'rate-limit') {
        T.show(box, errBox('Terlalu sering mencari — Scryfall membatasi permintaan sebentar. Tunggu beberapa detik lalu coba lagi.'));
        const wr = T.el('<div style="margin-top:8px"></div>');
        wr.appendChild(T.btn('🔄 Coba lagi', cari));
        box.appendChild(wr);
        return;
      }
      const msg = e.message === 'server-error'
        ? 'Server Scryfall sedang bermasalah — bukan salah kartunya. Coba lagi sebentar.'
        : e.name === 'AbortError'
          ? 'Waktu habis, server Scryfall tidak merespons dalam 15 detik.'
          : 'Gagal mencari kartu. Cek koneksi internet, lalu coba lagi.';
      T.show(box, errBox(msg));
      const wr = T.el('<div style="margin-top:8px"></div>');
      wr.appendChild(T.btn('🔄 Coba lagi', cari));
      box.appendChild(wr);
    }
  };

  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') cari(); });
  root.appendChild(T.el('<p class="note">Cari kartu Magic: The Gathering. Mode nama kartu cocok untuk satu kartu yang sudah kamu tahu namanya, mode cari bebas untuk menjelajah.</p>'));
  root.appendChild(T.field('Nama kartu', inp, 'Contoh: Black Lotus'));
  root.appendChild(T.field('Cara mencari', mode, ''));
  root.appendChild(T.row(T.btn('🔍 Cari kartu', cari, true)));
  root.appendChild(box);
}
