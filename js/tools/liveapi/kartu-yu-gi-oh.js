import { h as T, esc, errBox } from '../../core.js';

// Cari kartu Yu-Gi-Oh! lewat YGOPRODeck, tanpa key.
// Terverifikasi 17 Nov 2026: /api/v7/cardinfo.php?name=Dark%20Magician -> 200, CORS *.
// Parameter fname dipakai untuk pencarian nama sebagian (satu API yang sama);
// name persis hanya cocok bila ejaannya sama persis.
export const meta = {"id":"kartu-yu-gi-oh","name":"Kartu Yu-Gi-Oh!","cat":"liveapi","icon":"🐉","desc":"Cari kartu Yu-Gi-Oh! lengkap dengan gambar, serangan, pertahanan, dan harganya.","keywords":"yu-gi-oh,yugioh,kartu yugioh,ygoprodeck,duel,card game,tcg","since":"6.17.0", "online": true};

async function getJSON(url) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 15000);
  try {
    const r = await fetch(url, { signal: c.signal });
    if (!r.ok) throw new Error('http ' + r.status);
    const j = await r.json();
    if (!j || !Array.isArray(j.data)) throw new Error('not-found');
    return j;
  } finally { clearTimeout(t); }
}

const gambarAman = (u) => typeof u === 'string' && u.indexOf('https://') === 0;

export function render(root) {
  const box = T.out();
  const inp = T.input('text', 'Contoh: Dark Magician, Blue-Eyes');
  inp.setAttribute('autocomplete', 'off');

  const cari = async () => {
    const q = String(inp.value || '').trim();
    if (!q) { T.show(box, errBox('Tulis nama kartu dulu.')); return; }
    T.show(box, '<p class="mut">Mencari kartu ' + esc(q) + '…</p>');
    try {
      const j = await getJSON('https://db.ygoprodeck.com/api/v7/cardinfo.php?fname=' + encodeURIComponent(q));
      const list = (j.data || []).slice(0, 8);
      if (!list.length) throw new Error('not-found');
      T.show(box, '<p class="hint">' + T.fmt(j.data.length) + ' kartu cocok, menampilkan ' + list.length + '</p>' + list.map((k) => {
        const img = (k.card_images && k.card_images[0] && k.card_images[0].image_url_small) || '';
        const harga = k.card_prices && k.card_prices[0] && k.card_prices[0].tcgplayer_price;
        return '<div style="border-top:1px solid #ffffff14;padding:12px 0;display:flex;gap:12px">' +
          (gambarAman(img) ? '<img src="' + esc(img) + '" alt="" style="width:100px;height:auto;border-radius:8px;flex:none;align-self:flex-start" loading="lazy" data-err="hide">' : '') +
          '<div style="min-width:0">' +
          '<div style="font-weight:700;font-size:15px">' + esc(k.name || 'Tanpa nama') + '</div>' +
          '<div class="dim" style="font-size:12.5px;line-height:1.7">' +
          esc(k.type || '') +
          (k.race ? ' · ' + esc(k.race) : '') +
          (k.attribute ? ' · ' + esc(k.attribute) : '') +
          (typeof k.level === 'number' ? ' · Level ' + k.level : '') +
          (typeof k.atk === 'number' ? '<br>Serangan ' + T.fmt(k.atk) + (typeof k.def === 'number' ? ' · Pertahanan ' + T.fmt(k.def) : '') : '') +
          (harga ? '<br>Harga pasar: $' + esc(harga) : '') +
          '</div>' +
          (k.desc ? '<p class="hint" style="margin-top:6px">' + esc(k.desc.length > 300 ? k.desc.slice(0, 300) + '…' : k.desc) + '</p>' : '') +
          '</div></div>';
      }).join('') + '<p class="hint">Sumber: YGOPRODeck. Harga adalah harga pasar dalam dolar AS dan bisa berubah.</p>');
      T.wireImgErr(box);
    } catch (e) {
      if (e.message === 'not-found') {
        T.show(box, '<p class="center dim">Kartu tidak ditemukan. Coba nama dalam bahasa Inggris atau kata kunci yang lebih umum.</p>');
        return;
      }
      const msg = e.name === 'AbortError'
        ? 'Waktu habis, server YGOPRODeck tidak bisa dihubungi dalam 15 detik.'
        : 'Gagal mencari kartu. Cek koneksi internet, lalu coba lagi.';
      T.show(box, errBox(msg));
      const wr = T.el('<div style="margin-top:8px"></div>');
      wr.appendChild(T.btn('🔄 Coba lagi', cari));
      box.appendChild(wr);
    }
  };

  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') cari(); });
  root.appendChild(T.el('<p class="note">Cari kartu Yu-Gi-Oh! berdasarkan namanya untuk melihat gambar, serangan, pertahanan, dan harganya.</p>'));
  root.appendChild(T.field('Nama kartu', inp, 'Contoh: Dark Magician'));
  root.appendChild(T.row(T.btn('🔍 Cari kartu', cari, true)));
  root.appendChild(box);
}
