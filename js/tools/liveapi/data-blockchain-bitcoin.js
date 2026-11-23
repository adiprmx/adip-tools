import { h as T, esc, errBox } from '../../core.js';

// Data blockchain Bitcoin lewat Blockstream (tanpa key).
// Terverifikasi 18 Nov 2026: blockstream.info/api/blocks/tip/height 200, CORS *.
const API = 'https://blockstream.info/api';

async function getText(url) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 15000);
  try {
    const r = await fetch(url, { signal: c.signal });
    if (!r.ok) throw new Error('http ' + r.status);
    return await r.text();
  } finally { clearTimeout(t); }
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

export const meta = {"id": "data-blockchain-bitcoin", "name": "Data Blockchain Bitcoin", "cat": "liveapi", "icon": "₿", "desc": "Blok Bitcoin terbaru, antrean transaksi yang menunggu, dan perkiraan biayanya.", "keywords": "bitcoin,blockchain,blok,btc,mempool,transaksi,blockstream,kripto", "since": "6.17.0", "online": true};

export function render(root) {
  const box = T.out();

  const gagal = (pesan) => {
    T.show(box, errBox(pesan));
    const w = T.el('<div style="margin-top:8px"></div>');
    w.appendChild(T.btn('Coba lagi', muat));
    box.appendChild(w);
  };

  const muat = async () => {
    T.show(box, '<p class="mut">Mengambil data blockchain Bitcoin…</p>');
    try {
      const [tinggi, hash, mempool] = await Promise.all([
        getText(API + '/blocks/tip/height'),
        getText(API + '/blocks/tip/hash'),
        getJSON(API + '/mempool'),
      ]);
      const tinggiN = parseInt(String(tinggi).trim(), 10);
      if (!isFinite(tinggiN)) throw new Error('bad-data');
      const hashBersih = String(hash).trim();
      const antre = mempool && typeof mempool.count === 'number' ? mempool.count : null;
      const ukuranMb = mempool && typeof mempool.vsize === 'number' ? mempool.vsize / 1000000 : null;
      const feeBtc = mempool && typeof mempool.total_fee === 'number' ? mempool.total_fee / 100000000 : null;
      T.show(box,
        '<div class="kv"><span class="k">Blok terbaru (nomor)</span><span class="v">' + tinggiN.toLocaleString('id-ID') + '</span></div>' +
        '<div class="kv"><span class="k">Kode blok (hash)</span><span class="v" style="font-family:monospace;font-size:11.5px;word-break:break-all">' + esc(hashBersih) + '</span></div>' +
        (antre != null ? '<div class="kv"><span class="k">Transaksi menunggu</span><span class="v">' + antre.toLocaleString('id-ID') + ' transaksi</span></div>' : '') +
        (ukuranMb != null ? '<div class="kv"><span class="k">Ukuran antrean</span><span class="v">' + ukuranMb.toLocaleString('id-ID', { maximumFractionDigits: 2 }) + ' MB</span></div>' : '') +
        (feeBtc != null ? '<div class="kv"><span class="k">Total biaya di antrean</span><span class="v">' + feeBtc.toLocaleString('id-ID', { maximumFractionDigits: 4 }) + ' BTC</span></div>' : '') +
        '<p class="hint">Makin banyak transaksi menunggu, makin lama transaksi baru dikonfirmasi dan makin mahal biayanya. Sumber: Blockstream.</p>');
    } catch (e) {
      gagal(e.name === 'AbortError'
        ? 'Waktu habis, server Blockstream tidak bisa dihubungi dalam 15 detik.'
        : 'Data Bitcoin gagal diambil. Cek koneksi internet, lalu coba lagi.');
    }
  };

  root.appendChild(T.el('<p class="note">Kondisi jaringan Bitcoin saat ini: blok terbaru dan berapa banyak transaksi yang masih mengantre untuk dikonfirmasi.</p>'));
  root.appendChild(T.row(T.btn('Muat ulang', muat, true)));
  root.appendChild(box);
  muat();
}
