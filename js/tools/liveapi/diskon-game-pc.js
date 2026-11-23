import { h as T, esc, errBox } from '../../core.js';

export const meta = {"id":"diskon-game-pc","name":"Diskon Game PC","cat":"liveapi","icon":"🎮","desc":"Cari diskon game PC termurah di berbagai toko.","keywords":"diskon,game,pc,steam,murah,promo,cheapshark","since":"6.16.0", "online": true};

const API = 'https://www.cheapshark.com/api/1.0';

let tokoCache = null;

async function namaToko() {
  if (tokoCache) return tokoCache;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 10000);
  try {
    const r = await fetch(API + '/stores', { signal: ctrl.signal });
    if (!r.ok) throw new Error('http ' + r.status);
    const j = await r.json();
    const peta = {};
    (Array.isArray(j) ? j : []).forEach((s) => { if (s.storeID) peta[s.storeID] = s.storeName; });
    tokoCache = peta;
    return peta;
  } catch (e) {
    return {};
  } finally { clearTimeout(timer); }
}

function hargaUsd(v) {
  const n = parseFloat(v);
  if (isNaN(n)) return '-';
  return 'US$' + n.toFixed(2);
}

export function render(root) {
  const box = T.out();
  const inp = T.input('text', 'Cari judul game, contoh: Stardew Valley (kosongkan untuk diskon terbesar)');
  inp.setAttribute('autocomplete', 'off');
  const selHarga = T.select([['15', 'Di bawah US$15'], ['5', 'Di bawah US$5'], ['10', 'Di bawah US$10'], ['30', 'Di bawah US$30'], ['60', 'Di bawah US$60']], '15');

  const cari = async () => {
    const judul = inp.value.trim();
    const atas = selHarga.value;
    T.show(box, '<p class="mut">Mencari diskon game…</p>');
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 20000);
    try {
      let url = API + '/deals?storeID=1&upperPrice=' + encodeURIComponent(atas) + '&pageSize=12&sortBy=Savings&desc=1';
      if (judul) url = API + '/deals?title=' + encodeURIComponent(judul) + '&pageSize=12&sortBy=Savings&desc=1';
      const r = await fetch(url, { signal: ctrl.signal });
      if (!r.ok) throw new Error('http ' + r.status);
      const j = await r.json();
      if (!Array.isArray(j) || !j.length) {
        T.show(box, '<p class="center dim">Tidak ada diskon yang cocok' + (judul ? ' untuk "' + esc(judul) + '"' : '') + '.</p><p class="hint center">Coba judul lain atau naikkan batas harga.</p>');
        return;
      }
      const toko = await namaToko();
      let html = '<p class="hint">Harga dalam dolar AS. Ketuk judul untuk membuka halaman tokonya.</p>';
      j.forEach((d) => {
        const hemat = Math.round(parseFloat(d.savings || 0));
        const nama = toko[d.storeID] || ('Toko ' + d.storeID);
        html += '<div style="border:1px solid #2e2823;border-radius:10px;padding:10px 12px;margin-bottom:8px;display:flex;gap:10px;align-items:center">' +
          (d.thumb ? '<img src="' + esc(d.thumb) + '" alt="" loading="lazy" style="width:64px;height:36px;object-fit:cover;border-radius:6px;flex:none">' : '') +
          '<div style="flex:1;min-width:0"><div style="font-weight:700;line-height:1.3"><a href="https://www.cheapshark.com/redirect?dealID=' + esc(d.dealID) + '" target="_blank" rel="noopener">' + esc(d.title || '-') + '</a></div>' +
          '<div class="dim" style="font-size:12.5px;margin-top:2px">' + esc(nama) + (d.steamRatingText ? ' · ' + esc(d.steamRatingText) : '') + '</div></div>' +
          '<div style="text-align:right;flex:none"><div style="font-weight:800;color:#22c55e">' + esc(hargaUsd(d.salePrice)) + '</div>' +
          '<div class="dim" style="font-size:12px"><s>' + esc(hargaUsd(d.normalPrice)) + '</s> · -' + esc(String(hemat)) + '%</div></div></div>';
      });
      html += '<p class="hint">Sumber: CheapShark.</p>';
      T.show(box, html);
    } catch (e) {
      const msg = e.name === 'AbortError'
        ? 'Waktu habis, server CheapShark tidak bisa dihubungi dalam 20 detik.'
        : 'Gagal mencari diskon. Cek koneksi internet, lalu coba lagi.';
      T.show(box, errBox(msg));
      const wr = T.el('<div style="margin-top:8px"></div>');
      wr.appendChild(T.btn('🔄 Coba lagi', cari));
      box.appendChild(wr);
    } finally { clearTimeout(timer); }
  };

  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') cari(); });
  selHarga.addEventListener('change', cari);
  root.appendChild(T.field('Judul game', inp));
  root.appendChild(T.field('Batas harga', selHarga));
  root.appendChild(T.row(T.btn('🔍 Cari diskon', cari, true)));
  root.appendChild(box);
  cari();
}
