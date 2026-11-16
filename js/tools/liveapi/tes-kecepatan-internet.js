import { h as T, utils } from '../../core.js?v=6.12.2';

// Logika murni (bisa di-test di Node): byte + milidetik -> Mbps.
utils.hitungMbps = function (bytes, ms) {
  if (!(bytes > 0) || !(ms > 0)) return 0;
  return (bytes * 8) / (ms / 1000) / 1000000;
};

const FILE_PING = 'https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js';
const FILE_UNDUH = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js';

export const meta = {"id": "tes-kecepatan-internet", "name": "Tes Kecepatan Internet", "cat": "liveapi", "icon": "🚀", "desc": "Tes kecepatan unduh dan latensi koneksimu saat ini.", "keywords": "speed test,kecepatan internet,mbps,latensi,ping,download,unduh", "since": "6.11.0"};

export function render(root) {
  const box = T.out();
  let jalan = false;

  async function pingSekali() {
    const t0 = performance.now();
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), 8000);
    try {
      await fetch(FILE_PING + '?ping=' + Date.now(), { method: 'HEAD', cache: 'no-store', signal: ac.signal });
      return performance.now() - t0;
    } catch (e) {
      // Sebagian jaringan memblokir HEAD, coba GET kecil sebagai cadangan.
      const t1 = performance.now();
      const ac2 = new AbortController();
      const timer2 = setTimeout(() => ac2.abort(), 8000);
      try {
        await fetch(FILE_PING + '?ping=' + Date.now(), { cache: 'no-store', signal: ac2.signal });
        return performance.now() - t1;
      } finally { clearTimeout(timer2); }
    } finally { clearTimeout(timer); }
  }

  async function unduhSekali() {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), 30000);
    const t0 = performance.now();
    try {
      const res = await fetch(FILE_UNDUH + '?dl=' + Date.now(), { cache: 'no-store', signal: ac.signal });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const buf = await res.arrayBuffer();
      return { bytes: buf.byteLength, ms: performance.now() - t0 };
    } finally { clearTimeout(timer); }
  }

  async function mulai() {
    if (jalan) return;
    jalan = true;
    try {
      T.show(box, '<span class="dim">Mengukur latensi… (langkah 1 dari 2)</span>');
      const pings = [];
      for (let i = 0; i < 5; i++) {
        try { pings.push(await pingSekali()); } catch (e) { /* satu ping gagal, lanjut */ }
      }
      if (pings.length === 0) throw new Error('latensi');
      pings.sort((a, b) => a - b);
      const latensi = Math.round(pings.reduce((a, b) => a + b, 0) / pings.length);

      T.show(box, '<span class="dim">Mengukur kecepatan unduh… (langkah 2 dari 2, mengunduh file uji sekitar 2 MB)</span>');
      let totalBytes = 0, totalMs = 0, putaran = 0;
      for (let i = 0; i < 3; i++) {
        const r = await unduhSekali();
        totalBytes += r.bytes; totalMs += r.ms; putaran++;
      }
      const mbps = utils.hitungMbps(totalBytes, totalMs);
      T.show(box,
        `<div class="kv"><span>Kecepatan unduh</span><b style="color:#fff">${mbps.toFixed(1)} Mbps</b></div>` +
        `<div class="kv"><span>Dalam MB per detik</span><b>${(mbps / 8).toFixed(2)} MB/detik</b></div>` +
        `<div class="kv"><span>Latensi (rata-rata ${pings.length} pengukuran)</span><b>${latensi} ms</b></div>` +
        `<div class="hint">Tes ini mengukur kecepatan ke layanan jsDelivr, bukan ke layanan lokal di Indonesia. Hasilnya bisa beda dengan aplikasi tes kecepatan lain karena jalurnya beda. Angka di atas sekitar 100 Mbps kurang akurat karena file ujinya kecil. Kecepatan unggah tidak diukur di sini.</div>`
      );
    } catch (e) {
      T.show(box, '<div style="color:#ef4444;font-size:13px;line-height:1.5">Tes gagal. Periksa koneksi internetmu lalu coba lagi.' +
        (e && e.message === 'latensi' ? ' Layanan uji tidak bisa dijangkau.' : '') + '</div>');
    } finally { jalan = false; }
  }

  root.appendChild(T.el('<p class="note">Tes ini mengunduh file uji sekitar 2 MB. Pakai WiFi bila kuotamu terbatas.</p>'));
  root.appendChild(T.btn('Mulai tes', mulai, true));
  root.appendChild(box);
}
