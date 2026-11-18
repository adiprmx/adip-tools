import { h as T, esc, errBox } from '../../core.js';

// Dek kartu remi virtual lewat Deck of Cards API, tanpa key.
// Terverifikasi 17 Nov 2026: /api/deck/new/shuffle/?deck_count=1 -> 200, CORS *.
export const meta = {"id":"kartu-remi","name":"Kartu Remi","cat":"liveapi","icon":"🎴","desc":"Kocok dek kartu remi virtual lalu tarik kartunya satu per satu.","keywords":"kartu remi,deck of cards,kocok kartu,poker,blackjack,kartu","since":"6.17.0"};

async function getJSON(url) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 15000);
  try {
    const r = await fetch(url, { signal: c.signal });
    if (!r.ok) throw new Error('http ' + r.status);
    const j = await r.json();
    if (!j || j.success === false) throw new Error('bad-data');
    return j;
  } finally { clearTimeout(t); }
}

const gambarAman = (u) => typeof u === 'string' && u.indexOf('https://') === 0;

export function render(root) {
  const box = T.out();
  const statusBox = T.out();
  let deckId = '';
  let sisa = 0;

  const tombolBaru = T.btn('🃏 Kocok dek baru', () => dekBaru(), true);
  const tombolSatu = T.btn('Tarik 1 kartu', () => tarik(1));
  const tombolLima = T.btn('Tarik 5 kartu', () => tarik(5));
  tombolSatu.disabled = true;
  tombolLima.disabled = true;

  const tampilStatus = () => {
    if (!deckId) { T.hide(statusBox); return; }
    T.show(statusBox, '<p class="hint">Dek aktif, sisa <b>' + sisa + '</b> kartu dari 52.</p>');
  };

  const gagal = (pesan, ulang) => {
    T.show(box, errBox(pesan));
    const wr = T.el('<div style="margin-top:8px"></div>');
    wr.appendChild(T.btn('🔄 Coba lagi', ulang));
    box.appendChild(wr);
  };

  const dekBaru = async () => {
    T.show(box, '<p class="mut">Mengocok dek baru…</p>');
    try {
      const j = await getJSON('https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=1');
      deckId = j.deck_id;
      sisa = Number(j.remaining) || 0;
      tombolSatu.disabled = false;
      tombolLima.disabled = false;
      tampilStatus();
      T.show(box, '<p class="center dim">Dek baru sudah dikocok. Ketuk tombol tarik untuk mengambil kartu.</p>');
    } catch (e) {
      gagal(e.name === 'AbortError'
        ? 'Waktu habis, server tidak merespons dalam 15 detik.'
        : 'Gagal mengocok dek. Cek koneksi internet, lalu coba lagi.', dekBaru);
    }
  };

  const tarik = async (n) => {
    if (!deckId) return;
    if (sisa <= 0) { T.show(box, '<p class="center dim">Dek sudah habis. Kocok dek baru untuk main lagi.</p>'); return; }
    const jumlah = Math.min(n, sisa);
    T.show(box, '<p class="mut">Menarik ' + jumlah + ' kartu…</p>');
    try {
      const j = await getJSON('https://deckofcardsapi.com/api/deck/' + encodeURIComponent(deckId) + '/draw/?count=' + jumlah);
      sisa = Number(j.remaining) || 0;
      tampilStatus();
      const kartu = j.cards || [];
      if (!kartu.length) throw new Error('bad-data');
      T.show(box, '<div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center">' + kartu.map((k) =>
        '<div style="text-align:center">' +
        (gambarAman(k.image) ? '<img src="' + esc(k.image) + '" alt="' + esc(k.value + ' ' + k.suit) + '" style="width:110px;height:auto;border-radius:8px" loading="lazy" data-err="hide">' : '') +
        '<div class="hint" style="margin-top:4px">' + esc(k.value + ' ' + k.suit) + '</div></div>'
      ).join('') + '</div>' +
        (sisa === 0 ? '<p class="center hint" style="margin-top:10px">Itu kartu terakhir di dek ini.</p>' : ''));
      T.wireImgErr(box);
    } catch (e) {
      gagal(e.name === 'AbortError'
        ? 'Waktu habis, server tidak merespons dalam 15 detik.'
        : 'Gagal menarik kartu. Cek koneksi internet, lalu coba lagi.', () => tarik(n));
    }
  };

  root.appendChild(T.el('<p class="note">Dek kartu remi virtual isi 52 kartu. Kocok dek baru, lalu tarik kartunya. Cocok untuk main kartu bareng tanpa kartu fisik.</p>'));
  root.appendChild(T.row(tombolBaru, tombolSatu, tombolLima));
  root.appendChild(statusBox);
  root.appendChild(box);
}
