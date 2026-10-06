import { h as T, esc, onLeave } from '../../core.js?v=6.9.5';

export const meta = {"id": "harga-crypto", "name": "Harga Crypto", "cat": "liveapi", "icon": "🪙", "desc": "Harga crypto live (IDR & USD) + perubahan 24 jam.", "keywords": "crypto,harga,bitcoin,ethereum,solana,bnb,dogecoin,idr,usd"};

const COINS = [
  ['bitcoin', 'Bitcoin', 'BTC'],
  ['ethereum', 'Ethereum', 'ETH'],
  ['solana', 'Solana', 'SOL'],
  ['binancecoin', 'BNB', 'BNB'],
  ['dogecoin', 'Dogecoin', 'DOGE'],
];
const CACHE_MS = 60000;
let cache = null; // {t, data}

function fmtUsd(v) {
  if (v == null || isNaN(v)) return '–';
  return 'US$' + Number(v).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: v < 1 ? 4 : 2 });
}

function chip24(ch) {
  if (ch == null || isNaN(ch)) return '<span class="dim">–</span>';
  const up = ch >= 0;
  const tanda = up ? '+' : '';
  const warna = up ? '#22c55e' : '#ef4444';
  return '<span style="font-weight:700;color:' + warna + '">' + tanda + Number(ch).toFixed(2).replace('.', ',') + '%</span>';
}

async function fetchJson(url) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15000);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (res.status === 429) throw new Error('RATE_LIMIT');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.json();
  } catch (e) {
    if (e.name === 'AbortError') throw new Error('Waktu habis (15 detik). Periksa koneksi internet lalu coba lagi.');
    throw e;
  } finally { clearTimeout(timer); }
}

export function render(root) {
  const box = T.out();
  const btnRefresh = T.btn('🔄 Refresh', null);
  let cdTimer = null;

  const setBtn = (boleh, sisa) => {
    btnRefresh.disabled = !boleh;
    btnRefresh.textContent = boleh ? '🔄 Refresh' : '⏳ Tunggu ' + sisa + ' dtk';
  };

  const mulaiHitungMundur = () => {
    if (cdTimer) clearInterval(cdTimer);
    const tick = () => {
      const sisa = Math.ceil((cache.t + CACHE_MS - Date.now()) / 1000);
      if (sisa <= 0) { clearInterval(cdTimer); cdTimer = null; setBtn(true, 0); }
      else setBtn(false, sisa);
    };
    tick();
    cdTimer = setInterval(tick, 1000);
  };

  const tampilkan = (data) => {
    const rows = COINS.map(([id, nama, sim]) => {
      const d = data[id] || {};
      return '<div class="kv"><span class="k"><b>' + esc(nama) + '</b> <span class="dim">' + esc(sim) + '</span></span>' +
        '<span class="v" style="text-align:right">' + T.rp(d.idr) + '<br><span class="dim">' + fmtUsd(d.usd) + '</span> ' + chip24(d.idr_24h_change) + '</span></div>';
    }).join('');
    T.show(box,
      '<div class="center" style="margin-bottom:4px"><div class="dim" style="font-size:12px">Update: ' +
      esc(new Date(cache.t).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })) + '</div></div>' + rows);
  };

  const muat = async (paksa) => {
    if (!paksa && cache && Date.now() - cache.t < CACHE_MS) { tampilkan(cache.data); mulaiHitungMundur(); return; }
    T.show(box, '<div class="dim center">Memuat harga crypto…</div>');
    setBtn(false, 1);
    try {
      const ids = COINS.map((c) => c[0]).join(',');
      const data = await fetchJson('https://api.coingecko.com/api/v3/simple/price?ids=' + ids + '&vs_currencies=idr,usd&include_24hr_change=true');
      cache = { t: Date.now(), data };
      tampilkan(data);
      mulaiHitungMundur();
    } catch (e) {
      setBtn(true, 0);
      if (e.message === 'RATE_LIMIT') {
        T.show(box, '<span class="err">Terlalu sering, coba lagi ~1 menit.</span><br><span class="dim">API membatasi jumlah permintaan per menit.</span>');
      } else {
        T.show(box, '<span class="err">Gagal memuat harga crypto. Periksa koneksi internet lalu coba lagi.</span><br><span class="dim">(' + esc(e.message || String(e)) + ')</span>');
        const wr = T.el('<div class="mt8"></div>');
        wr.appendChild(T.btn('🔄 Coba lagi', () => muat(true)));
        box.appendChild(wr);
      }
    }
  };

  btnRefresh.addEventListener('click', () => muat(false));
  onLeave(() => { if (cdTimer) { clearInterval(cdTimer); cdTimer = null; } });
  root.appendChild(T.el('<div class="dim" style="margin-bottom:6px"><b>🪙 Harga crypto live</b></div>'));
  root.appendChild(T.row(btnRefresh));
  root.appendChild(box);
  muat(false);
}
