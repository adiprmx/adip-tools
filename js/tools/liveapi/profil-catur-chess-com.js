import { h as T, esc, errBox, utils } from '../../core.js';

// Profil pemain Chess.com, tanpa key.
// Terverifikasi 17 Nov 2026: /pub/player/erik -> 200, CORS *.
// Profil dan rating diambil terpisah, masing-masing satu panggilan per aksi.
export const meta = {"id":"profil-catur-chess-com","name":"Profil Catur Chess.com","cat":"liveapi","icon":"♟️","desc":"Lihat profil dan rating pemain Chess.com dari nama penggunanya.","keywords":"catur,chess,chess.com,rating,profil catur,grandmaster,elo","since":"6.17.0"};

async function getJSON(url) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 15000);
  try {
    const r = await fetch(url, { signal: c.signal });
    if (r.status === 404) throw new Error('not-found');
    if (!r.ok) throw new Error('http ' + r.status);
    return await r.json();
  } finally { clearTimeout(t); }
}

// tglCantik kanonis tinggal di utils (core.js) — dipakai dengan
// { unix: true, bulan: 'long' } (detik epoch dari API chess.com).

const gambarAman = (u) => typeof u === 'string' && u.indexOf('https://') === 0;

export function render(root) {
  const box = T.out();
  const ratingBox = T.out();
  const inp = T.input('text', 'Contoh: erik, hikaru, atau GothamChess');
  inp.setAttribute('autocomplete', 'off');
  inp.setAttribute('autocapitalize', 'off');
  let userAktif = '';
  const tombolRating = T.btn('📊 Lihat rating', () => muatRating());
  tombolRating.disabled = true;

  const gagal = (target, pesan, ulang) => {
    T.show(target, errBox(pesan));
    const wr = T.el('<div style="margin-top:8px"></div>');
    wr.appendChild(T.btn('🔄 Coba lagi', ulang));
    target.appendChild(wr);
  };

  const cari = async () => {
    const u = String(inp.value || '').trim();
    if (!u) { T.show(box, errBox('Tulis nama pengguna Chess.com dulu.')); return; }
    T.hide(ratingBox);
    tombolRating.disabled = true;
    userAktif = '';
    T.show(box, '<p class="mut">Mencari pemain ' + esc(u) + '…</p>');
    try {
      const j = await getJSON('https://api.chess.com/pub/player/' + encodeURIComponent(u));
      if (!j || !j.username) throw new Error('bad-data');
      userAktif = j.username;
      tombolRating.disabled = false;
      const negara = j.country ? String(j.country).split('/').pop() : '';
      T.show(box,
        '<div style="display:flex;gap:12px;align-items:center">' +
        (gambarAman(j.avatar) ? '<img src="' + esc(j.avatar) + '" alt="" style="width:72px;height:72px;border-radius:50%;object-fit:cover;flex:none" loading="lazy" data-err="hide">' : '') +
        '<div><div style="font-weight:800;font-size:18px">' + esc(j.username) + '</div>' +
        (j.name ? '<div class="dim" style="font-size:13px">' + esc(j.name) + '</div>' : '') +
        (j.title ? '<div class="dim" style="font-size:13px">Gelar: ' + esc(j.title) + '</div>' : '') + '</div></div>' +
        '<div style="margin-top:12px">' +
        (negara ? '<div class="kv"><span class="k">Negara</span><span class="v">' + esc(negara) + '</span></div>' : '') +
        (typeof j.followers === 'number' ? '<div class="kv"><span class="k">Pengikut</span><span class="v">' + T.fmt(j.followers) + '</span></div>' : '') +
        (j.joined ? '<div class="kv"><span class="k">Bergabung</span><span class="v">' + esc(utils.tglCantik(j.joined, { unix: true, bulan: 'long' })) + '</span></div>' : '') +
        (j.last_online ? '<div class="kv"><span class="k">Terakhir online</span><span class="v">' + esc(utils.tglCantik(j.last_online, { unix: true, bulan: 'long' })) + '</span></div>' : '') +
        '</div>' +
        (j.url && j.url.indexOf('https://') === 0 ? '<p style="margin-top:10px"><a href="' + esc(j.url) + '" target="_blank" rel="noopener" style="font-size:12.5px">Lihat profil di Chess.com</a></p>' : '') +
        '<p class="hint">Sumber: Chess.com.</p>');
      T.wireImgErr(box);
    } catch (e) {
      if (e.message === 'not-found') {
        T.show(box, '<p class="center dim">Nama pengguna tidak ditemukan di Chess.com. Periksa ejaannya.</p>');
        return;
      }
      gagal(box, e.name === 'AbortError'
        ? 'Waktu habis, server Chess.com tidak merespons dalam 15 detik.'
        : 'Gagal mencari pemain. Cek koneksi internet, lalu coba lagi.', cari);
    }
  };

  const muatRating = async () => {
    if (!userAktif) return;
    tombolRating.disabled = true;
    T.show(ratingBox, '<p class="mut">Mengambil rating…</p>');
    try {
      const j = await getJSON('https://api.chess.com/pub/player/' + encodeURIComponent(userAktif) + '/stats');
      const baris = (label, kunci) => {
        const s = j[kunci] && j[kunci].last;
        const rekor = j[kunci] && j[kunci].best;
        if (!s) return '';
        return '<div class="kv"><span class="k">' + label + '</span><span class="v">' + esc(String(s.rating)) +
          (rekor ? ' <span class="hint">(terbaik ' + esc(String(rekor.rating)) + ')</span>' : '') + '</span></div>';
      };
      const html = baris('Catur cepat (rapid)', 'chess_rapid') + baris('Catur kilat (blitz)', 'chess_blitz') +
        baris('Catur super kilat (bullet)', 'chess_bullet') + baris('Catur harian', 'chess_daily') +
        baris('Puzzle', 'tactics');
      if (!html) {
        T.show(ratingBox, '<p class="center dim">Pemain ini belum punya rating yang tercatat.</p>');
        return;
      }
      T.show(ratingBox, '<p style="margin-top:14px"><b>Rating</b></p>' + html +
        '<p class="hint">Semakin besar angkanya, semakin kuat pemainnya. Rating 2000 ke atas sudah tergolong sangat kuat.</p>');
    } catch (e) {
      gagal(ratingBox, e.name === 'AbortError'
        ? 'Waktu habis, server Chess.com tidak merespons dalam 15 detik.'
        : 'Gagal mengambil rating. Cek koneksi internet, lalu coba lagi.', muatRating);
    } finally { tombolRating.disabled = false; }
  };

  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') cari(); });
  root.appendChild(T.el('<p class="note">Tulis nama pengguna Chess.com untuk melihat profilnya. Ketuk tombol rating untuk melihat rating per jenis permainan.</p>'));
  root.appendChild(T.field('Nama pengguna Chess.com', inp, 'Contoh: erik, hikaru'));
  root.appendChild(T.row(T.btn('🔍 Cari pemain', cari, true), tombolRating));
  root.appendChild(box);
  root.appendChild(ratingBox);
}
