import { h as T, esc, errBox } from '../../core.js';

export const meta = {"id":"harga-emas-live","name":"Harga Emas Live","cat":"liveapi","icon":"🪙","desc":"Harga emas dunia terkini per troy ons dan per gram.","keywords":"emas,harga emas,xau,logam mulia,investasi,per gram","since":"6.16.0"};

const API = 'https://api.gold-api.com/price/XAU';
const GRAM_PER_OZ = 31.1035;
const CACHE_MS = 60000;
let cache = null;

function fmtUsd(v, digit) {
  if (v == null || isNaN(v)) return '-';
  return 'US$' + Number(v).toLocaleString('id-ID', { minimumFractionDigits: digit, maximumFractionDigits: digit });
}

export function render(root) {
  const box = T.out();
  const btnRefresh = T.btn('🔄 Perbarui harga', null, true);

  const tampilkan = (d) => {
    const perOz = parseFloat(d.price);
    const perGram = perOz / GRAM_PER_OZ;
    const kapan = d.updatedAt ? new Date(d.updatedAt) : null;
    T.show(box,
      '<div class="center"><div class="dim">Harga emas dunia (XAU/USD)</div>' +
      '<div class="big" style="margin:6px 0">' + esc(fmtUsd(perOz, 2)) + '</div>' +
      '<div class="dim">per troy ons</div></div>' +
      '<div class="kv"><span class="k">Per gram</span><span class="v" style="font-weight:700">' + esc(fmtUsd(perGram, 2)) + '</span></div>' +
      '<div class="kv"><span class="k">Per 10 gram</span><span class="v">' + esc(fmtUsd(perGram * 10, 2)) + '</span></div>' +
      '<div class="kv"><span class="k">Terakhir diperbarui</span><span class="v">' + esc(kapan && !isNaN(kapan) ? kapan.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '-') + '</span></div>' +
      '<p class="hint">1 troy ons = 31,1 gram. Harga dalam dolar AS, belum termasuk ongkos cetak dan pajak toko emas. Sumber: Gold API.</p>');
  };

  const muat = async (paksa) => {
    if (!paksa && cache && Date.now() - cache.t < CACHE_MS) { tampilkan(cache.data); return; }
    T.show(box, '<p class="mut">Mengambil harga emas terbaru…</p>');
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 15000);
    try {
      const r = await fetch(API, { signal: ctrl.signal });
      if (!r.ok) throw new Error('http ' + r.status);
      const j = await r.json();
      if (!j || j.price == null) throw new Error('bad-data');
      cache = { t: Date.now(), data: j };
      tampilkan(j);
    } catch (e) {
      const msg = e.name === 'AbortError'
        ? 'Waktu habis, server harga emas tidak merespons dalam 15 detik.'
        : 'Gagal ambil harga emas. Cek koneksi internet, lalu coba lagi.';
      T.show(box, errBox(msg));
      const wr = T.el('<div style="margin-top:8px"></div>');
      wr.appendChild(T.btn('🔄 Coba lagi', () => muat(true)));
      box.appendChild(wr);
    } finally { clearTimeout(timer); }
  };

  btnRefresh.addEventListener('click', () => muat(true));
  root.appendChild(T.row(btnRefresh));
  root.appendChild(box);
  muat(false);
}
