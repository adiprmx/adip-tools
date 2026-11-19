import { h as T, utils, errBox } from '../../core.js';

// Pembuat PWA dari URL: hasilkan manifest + service worker + ikon + cara
// pasang untuk situs apa pun. File yang dihasilkan harus di-host di situs
// itu sendiri (HTTPS) — tool ini tidak memasang apa pun otomatis, dan
// keputusan "bisa di-install" tetap di tangan browser.
// JSZip 3.10.1 (hash SRI ada di peta SRI_HASH core.js).
const JSZIP_CDNS = [
  'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',
];

// Validasi URL situs. Mengembalikan {ok, url, peringatan}.
export function validasiUrlPwa(masukan) {
  const s = String(masukan == null ? '' : masukan).trim();
  if (!s) return { ok: false, url: null, peringatan: 'Tulis dulu alamat situsnya.' };
  let u;
  try {
    u = new URL(s);
  } catch (e) {
    return { ok: false, url: null, peringatan: 'Alamatnya tidak benar. Tulis alamat lengkap, mis. https://example.com.' };
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') {
    return { ok: false, url: null, peringatan: 'Hanya alamat http:// atau https:// yang bisa dibuatkan PWA.' };
  }
  const peringatan = (u.protocol === 'http:' && u.hostname !== 'localhost' && u.hostname !== '127.0.0.1')
    ? 'Situs ini masih http:// (bukan https://). Browser hanya menawarkan install untuk situs https:// (atau localhost).'
    : '';
  return { ok: true, url: u, peringatan };
}

function slugDari(nama) {
  return String(nama || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'situs';
}

// Scope = origin + direktori dari start_url.
export function scopeDari(url) {
  const u = typeof url === 'string' ? new URL(url) : url;
  const path = u.pathname || '/';
  const dir = path.endsWith('/') ? path : path.slice(0, path.lastIndexOf('/') + 1);
  return u.origin + dir;
}

export function buatManifest({ nama, singkat, url, warnaTema, warnaLatar, tampil }) {
  const startUrl = String(url);
  return {
    name: nama,
    short_name: singkat || nama.slice(0, 12),
    start_url: startUrl,
    scope: scopeDari(startUrl),
    display: tampil || 'standalone',
    background_color: warnaLatar || '#ffffff',
    theme_color: warnaTema || '#000000',
    icons: [
      { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}

export function buatServiceWorker({ namaCache, startUrl }) {
  const cache = namaCache || 'pwa-v1';
  return '/* Service worker sederhana: simpan halaman utama + file yang\n' +
    '   sudah pernah dibuka, supaya situs tetap bisa dibuka offline.\n' +
    '   Dibuat oleh Adip Tools. */\n' +
    "const CACHE = '" + cache + "';\n" +
    "const INTI = ['" + startUrl + "'];\n\n" +
    "self.addEventListener('install', (event) => {\n" +
    '  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(INTI)).then(() => self.skipWaiting()));\n' +
    '});\n\n' +
    "self.addEventListener('activate', (event) => {\n" +
    '  event.waitUntil(caches.keys().then((kunci) => Promise.all(kunci.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));\n' +
    '});\n\n' +
    "self.addEventListener('fetch', (event) => {\n" +
    "  const req = event.request;\n" +
    "  if (req.method !== 'GET') return;\n" +
    '  const url = new URL(req.url);\n' +
    '  if (url.origin !== self.location.origin) return;\n' +
    '  event.respondWith(caches.match(req).then((cocok) => {\n' +
    '    if (cocok) return cocok;\n' +
    '    return fetch(req).then((res) => {\n' +
    "      if (res && res.status === 200 && res.type === 'basic') {\n" +
    '        const salin = res.clone();\n' +
    '        caches.open(CACHE).then((c) => c.put(req, salin));\n' +
    '      }\n' +
    '      return res;\n' +
    '    }).catch(() => caches.match(INTI[0]));\n' +
    '  }));\n' +
    '});\n';
}

export function buatSnippet({ urlManifest, warnaTema }) {
  return '<!-- Tempel di dalam <head> halaman situs kamu -->\n' +
    '<link rel="manifest" href="' + urlManifest + '">\n' +
    '<meta name="theme-color" content="' + warnaTema + '">\n' +
    '<script>\n' +
    "  if ('serviceWorker' in navigator) {\n" +
    "    window.addEventListener('load', () => {\n" +
    "      navigator.serviceWorker.register('/sw.js').catch(() => {});\n" +
    '    });\n' +
    '  }\n' +
    '</script>';
}

export function buatInstruksi({ nama, url }) {
  return 'Cara pasang PWA untuk ' + nama + ' (' + url + ')\n\n' +
    '1. Unggah semua file dari ZIP ini ke folder utama (root) situs kamu,\n' +
    '   di samping file index.html: manifest.webmanifest, sw.js, dan tiga\n' +
    '   file ikon (icon-192.png, icon-512.png, icon-maskable-512.png).\n' +
    '2. Tempel potongan HTML di bawah (dari tool ini) ke dalam <head>\n' +
    '   halaman utama situs kamu.\n' +
    '3. Pastikan situs sudah HTTPS. Browser tidak menawarkan install\n' +
    '   untuk situs http:// biasa (localhost dikecualikan).\n' +
    '4. Buka situs di Chrome/Edge, lalu periksa menu Install di address\n' +
    '   bar (ikon komputer/panah ke bawah). Di DevTools, tab Application\n' +
    '   > Manifest menampilkan status manifest dan service worker.\n' +
    '5. Bila ikon terlihat buram atau hurufnya kurang pas, ganti file\n' +
    '   ikonnya dengan logo aslimu (PNG 192 dan 512 piksel, latar penuh\n' +
    '   untuk yang maskable) dengan nama file yang sama.\n\n' +
    'Catatan: browser yang memutuskan kapan tombol install muncul. Situs\n' +
    'harus sudah dikunjungi dan memenuhi syarat (manifest valid + service\n' +
    'worker aktif + HTTPS). Tool ini hanya menyiapkan file-file-nya.';
}

export const meta = { id: 'pembuat-pwa-dari-url', name: 'Pembuat PWA dari URL', cat: 'developer', icon: '📱', desc: 'Buat file PWA (manifest + service worker + ikon) untuk situs apa pun, lengkap dengan cara pasangnya.', keywords: 'pwa,manifest,service worker,install,situs,aplikasi web,offline', since: '6.19.0' };

export function render(root) {
  const urlI = T.input('url', 'Mis. https://example.com');
  urlI.inputMode = 'url';
  const namaI = T.input('text', 'Mis. Toko Saya');
  const singkatI = T.input('text', 'Mis. Toko (maks 12 huruf)');
  singkatI.maxLength = 12;
  const tampilSel = T.select([['standalone', 'Standalone (tanpa address bar)'], ['minimal-ui', 'Minimal UI'], ['fullscreen', 'Fullscreen'], ['browser', 'Browser biasa']], 'standalone');
  const temaI = document.createElement('input');
  temaI.type = 'color';
  temaI.value = '#141414';
  temaI.setAttribute('aria-label', 'Warna tema');
  temaI.style.cssText = 'width:100%;height:46px;border:1px solid var(--line);border-radius:10px;background:none;padding:4px;cursor:pointer';
  const latarI = document.createElement('input');
  latarI.type = 'color';
  latarI.value = '#ffffff';
  latarI.setAttribute('aria-label', 'Warna latar');
  latarI.style.cssText = 'width:100%;height:46px;border:1px solid var(--line);border-radius:10px;background:none;padding:4px;cursor:pointer';
  const box = T.out();

  let hasil = null; // {manifest, sw, snippet, instruksi, nama, url}

  // Gambar ikon huruf di canvas (huruf pertama nama situs).
  const buatIkon = (ukuran, maskable) => {
    const c = document.createElement('canvas');
    c.width = ukuran;
    c.height = ukuran;
    const ctx = c.getContext('2d');
    if (!ctx) return null;
    ctx.fillStyle = temaI.value;
    ctx.fillRect(0, 0, ukuran, ukuran);
    const huruf = (namaI.value.trim() || 'S').slice(0, 1).toUpperCase();
    const zona = maskable ? ukuran * 0.6 : ukuran * 0.8;
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 ' + Math.floor(zona * 0.62) + 'px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(huruf, ukuran / 2, ukuran / 2 + ukuran * 0.02);
    return c;
  };

  const kanvasKeBlob = (c) => new Promise((res) => c.toBlob((b) => res(b), 'image/png'));

  const buat = () => {
    const cek = validasiUrlPwa(urlI.value);
    if (!cek.ok) { T.show(box, errBox(cek.peringatan)); return; }
    const nama = namaI.value.trim() || cek.url.hostname;
    const manifest = buatManifest({
      nama,
      singkat: singkatI.value.trim(),
      url: cek.url.href,
      warnaTema: temaI.value,
      warnaLatar: latarI.value,
      tampil: tampilSel.value,
    });
    const sw = buatServiceWorker({ namaCache: slugDari(nama) + '-v1', startUrl: cek.url.href });
    const snippet = buatSnippet({ urlManifest: '/manifest.webmanifest', warnaTema: temaI.value });
    const instruksi = buatInstruksi({ nama, url: cek.url.href });
    hasil = { manifest, sw, snippet, instruksi, nama, url: cek.url.href };
    const pre = (judul, isi) => '<p class="hint" style="margin-top:12px">' + judul + '</p><pre style="white-space:pre-wrap;word-break:break-word;background:#12100d;border:1px solid #2e2823;border-radius:8px;padding:12px;font-size:12.5px;line-height:1.5;max-height:220px;overflow:auto">' + T.esc(isi) + '</pre>';
    T.show(box,
      (cek.peringatan ? '<p class="hint">' + T.esc(cek.peringatan) + '</p>' : '') +
      '<p><span class="ok">File PWA sudah dibuat.</span> Unduh ZIP-nya, unggah ke root situs kamu, lalu tempel potongan HTML di bawah ke &lt;head&gt;.</p>' +
      pre('manifest.webmanifest', JSON.stringify(manifest, null, 2)) +
      pre('sw.js', sw) +
      pre('Potongan HTML untuk <head>', snippet));
    const aksi = T.el('<div class="row" style="flex-wrap:wrap;margin-top:10px"></div>');
    aksi.append(
      T.btn('Unduh ZIP PWA', unduhZip, true),
      T.dlBtn('manifest.webmanifest', () => JSON.stringify(hasil.manifest, null, 2), 'application/manifest+json', 'Unduh manifest'),
      T.dlBtn('sw.js', () => hasil.sw, 'text/javascript;charset=utf-8', 'Unduh sw.js'),
      T.copyBtn(() => hasil.snippet, 'Salin potongan HTML'),
    );
    box.appendChild(aksi);
  };

  const unduhZip = async () => {
    if (!hasil) return;
    T.toast('Menyiapkan ZIP…');
    const ok = await utils.loadLibOnce(JSZIP_CDNS, () => typeof window.JSZip !== 'undefined');
    if (!ok) { T.toast('Alat ZIP tidak bisa dimuat dari internet. Cek koneksi lalu coba lagi, atau unduh file satu per satu.'); return; }
    try {
      const zip = new window.JSZip();
      zip.file('manifest.webmanifest', JSON.stringify(hasil.manifest, null, 2));
      zip.file('sw.js', hasil.sw);
      zip.file('README-pwa.txt', hasil.instruksi);
      const ikon192 = buatIkon(192, false);
      const ikon512 = buatIkon(512, false);
      const ikonMask = buatIkon(512, true);
      if (ikon192) zip.file('icon-192.png', await kanvasKeBlob(ikon192));
      if (ikon512) zip.file('icon-512.png', await kanvasKeBlob(ikon512));
      if (ikonMask) zip.file('icon-maskable-512.png', await kanvasKeBlob(ikonMask));
      const blob = await zip.generateAsync({ type: 'blob' });
      T.dl(slugDari(hasil.nama) + '-pwa.zip', blob, 'application/zip');
      T.toast('ZIP PWA terunduh');
    } catch (e) {
      T.toast('ZIP gagal dibuat. Coba unduh file satu per satu.');
    }
  };

  root.appendChild(T.el('<p class="hint">Isi alamat situs dan namanya, lalu tool ini menyiapkan manifest, service worker, ikon, dan cara pasang. File-file itu kamu unggah sendiri ke hosting situsmu.</p>'));
  root.appendChild(T.field('Alamat situs', urlI));
  root.appendChild(T.grid2(T.field('Nama situs', namaI), T.field('Nama pendek (di layar HP)', singkatI)));
  root.appendChild(T.grid2(T.field('Tampilan saat dibuka', tampilSel), T.field('Warna tema', temaI)));
  root.appendChild(T.field('Warna latar (saat loading)', latarI));
  root.appendChild(T.row(T.btn('Buat file PWA', buat, true)));
  root.appendChild(box);
  root.appendChild(T.el('<p class="hint" style="margin-top:12px">Ikon dibuat dari huruf pertama nama situs. Ganti dengan logomu sendiri bila sudah punya. Browser yang memutuskan kapan tombol install muncul, setelah situs memenuhi syarat (HTTPS + manifest valid + service worker aktif).</p>'));
}
