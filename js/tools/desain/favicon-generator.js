import { h as T, utils, tabs, fileInput, loadImage, LOCAL_NOTE } from '../../core.js';

export const meta = {"id":"favicon-generator","name":"Paket Favicon Lengkap","cat":"desain","icon":"⭐","desc":"Bikin favicon dari gambar atau emoji: multi-ukuran + ZIP + PWA.","keywords":"favicon,icon,emoji,png,apple-touch,logo,website,pwa,manifest"};

const SIZES = [16, 32, 48, 64, 128, 144, 180, 192, 256, 512];
const ZIP_CDN = 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js';
let zipSiap = null;
function loadZip() {
  if (!zipSiap) zipSiap = T.loadScript(ZIP_CDN).then((ok) => ok && !!window.JSZip);
  return zipSiap;
}

/* Bangun file favicon.ico dari PNG (format ICO boleh menyimpan PNG utuh). */
function buatIco(pngList) {
  // pngList: [{size, bytes: Uint8Array}]
  const n = pngList.length;
  const headerLen = 6 + 16 * n;
  let total = headerLen;
  pngList.forEach((p) => { total += p.bytes.length; });
  const buf = new ArrayBuffer(total);
  const v = new DataView(buf);
  v.setUint16(0, 0, true);
  v.setUint16(2, 1, true);
  v.setUint16(4, n, true);
  let off = headerLen;
  pngList.forEach((p, i) => {
    const e = 6 + i * 16;
    v.setUint8(e, p.size >= 256 ? 0 : p.size);
    v.setUint8(e + 1, p.size >= 256 ? 0 : p.size);
    v.setUint8(e + 2, 0);
    v.setUint8(e + 3, 0);
    v.setUint16(e + 4, 1, true);
    v.setUint16(e + 6, 32, true);
    v.setUint32(e + 8, p.bytes.length, true);
    v.setUint32(e + 12, off, true);
    new Uint8Array(buf, off, p.bytes.length).set(p.bytes);
    off += p.bytes.length;
  });
  return new Blob([buf], { type: 'image/x-icon' });
}

export function render(root) {
  const glyph = T.input('text', 'Emoji atau 1-2 huruf, mis. 🚀 atau A');
  glyph.maxLength = 6;
  const bg = document.createElement('input');
  bg.type = 'color';
  bg.value = '#141414';
  bg.setAttribute('aria-label', 'Warna background');
  bg.style.cssText = 'width:100%;height:46px;border:1px solid var(--line);border-radius:10px;background:none;padding:4px;cursor:pointer';

  const fileI = fileInput('image/*');
  const namaSitus = T.input('text', 'Nama situs, mis. Toko Saya', '');
  const temaWarna = document.createElement('input');
  temaWarna.type = 'color';
  temaWarna.value = '#141414';
  temaWarna.setAttribute('aria-label', 'Warna tema');
  temaWarna.style.cssText = 'width:100%;height:46px;border:1px solid var(--line);border-radius:10px;background:none;padding:4px;cursor:pointer';

  const box = T.out();
  const statusBox = T.out();
  let imgUpload = null;
  let mode = 'gambar'; // 'gambar' | 'emoji'
  let kanvasPaket = []; // [{size, canvas}]
  let kanvasMaskable = null; // canvas 512 maskable (zona aman 80%)

  function contrast(hex) {
    const n = parseInt(String(hex).slice(1), 16) || 0;
    const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return lum > 0.55 ? '#111111' : '#ffffff';
  }

  function drawEmoji(size) {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const x = c.getContext('2d');
    if (!x) return null;
    x.fillStyle = bg.value || '#141414';
    x.fillRect(0, 0, size, size);
    const g = (glyph.value || '').trim() || '⭐';
    x.fillStyle = contrast(bg.value);
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    x.font = Math.floor(size * 0.62) + 'px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif';
    x.fillText(g, size / 2, size * 0.54);
    return c;
  }

  function drawGambar(size) {
    if (!imgUpload) return null;
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const x = c.getContext('2d');
    if (!x) return null;
    const iw = imgUpload.naturalWidth, ih = imgUpload.naturalHeight;
    const sc = Math.max(size / iw, size / ih);
    const dw = iw * sc, dh = ih * sc;
    x.drawImage(imgUpload, (size - dw) / 2, (size - dh) / 2, dw, dh);
    return c;
  }

  const drawAktif = (size) => (mode === 'gambar' ? drawGambar(size) : drawEmoji(size));

  // Ikon maskable Android: gambar di dalam zona aman 80% (sisanya boleh
  // terpotong sistem), di atas warna tema penuh.
  function drawMaskable() {
    const c = document.createElement('canvas');
    c.width = c.height = 512;
    const x = c.getContext('2d');
    if (!x) return null;
    x.fillStyle = temaWarna.value || '#141414';
    x.fillRect(0, 0, 512, 512);
    const zona = Math.round(512 * 0.8);
    const off = Math.round((512 - zona) / 2);
    if (mode === 'gambar') {
      if (!imgUpload) return null;
      const iw = imgUpload.naturalWidth, ih = imgUpload.naturalHeight;
      const sc = Math.max(zona / iw, zona / ih);
      const dw = iw * sc, dh = ih * sc;
      x.drawImage(imgUpload, off + (zona - dw) / 2, off + (zona - dh) / 2, dw, dh);
    } else {
      const g = (glyph.value || '').trim() || '⭐';
      x.fillStyle = contrast(temaWarna.value || '#141414');
      x.textAlign = 'center';
      x.textBaseline = 'middle';
      x.font = Math.floor(zona * 0.62) + 'px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif';
      x.fillText(g, 256, 256 + zona * 0.04);
    }
    return c;
  }

  // SVG vektor asli untuk mode emoji/huruf (bentuk teks, bukan foto).
  function svgEmoji() {
    const g = ((glyph.value || '').trim() || '⭐').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const bgc = bg.value || '#141414';
    return '<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><rect width="512" height="512" fill="' + bgc + '"/><text x="256" y="276" font-family="Segoe UI Emoji, Apple Color Emoji, Noto Color Emoji, sans-serif" font-size="318" fill="' + contrast(bgc) + '" text-anchor="middle" dominant-baseline="middle">' + g + '</text></svg>';
  }

  // SVG untuk mode gambar: foto dibungkus di dalam SVG (bukan vektor).
  async function svgGambar() {
    const e512 = kanvasPaket.find((k) => k.size === 512);
    if (!e512) return null;
    const blob = await new Promise((res) => e512.canvas.toBlob((b) => res(b), 'image/png'));
    if (!blob) return null;
    const dataUrl = await new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result);
      r.onerror = () => rej(new Error('gagal membaca gambar'));
      r.readAsDataURL(blob);
    });
    return '<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><image width="512" height="512" href="' + dataUrl + '"/></svg>';
  }

  function namaFile(size) {
    if (size === 180) return 'apple-touch-icon.png';
    return 'favicon-' + size + '.png';
  }

  function browserconfigXml() {
    const tema = temaWarna.value || '#141414';
    return '<?xml version="1.0" encoding="utf-8"?>\n<browserconfig><msapplication><tile><square144x144logo src="favicon-144.png"/><TileColor>' + tema + '</TileColor></tile></msapplication></browserconfig>\n';
  }

  function snippetHtml() {
    const tema = temaWarna.value || '#141414';
    return '<link rel="icon" type="image/x-icon" href="favicon.ico">\n' +
      '<link rel="icon" type="image/svg+xml" href="favicon.svg">\n' +
      '<link rel="icon" type="image/png" sizes="16x16" href="favicon-16.png">\n' +
      '<link rel="icon" type="image/png" sizes="32x32" href="favicon-32.png">\n' +
      '<link rel="icon" type="image/png" sizes="48x48" href="favicon-48.png">\n' +
      '<link rel="apple-touch-icon" sizes="180x180" href="apple-touch-icon.png">\n' +
      '<link rel="manifest" href="manifest.webmanifest">\n' +
      '<meta name="theme-color" content="' + tema + '">\n' +
      '<meta name="msapplication-TileColor" content="' + tema + '">\n' +
      '<meta name="msapplication-config" content="browserconfig.xml">';
  }

  function manifestJson() {
    const nama = (namaSitus.value || '').trim() || 'Situs saya';
    return JSON.stringify({
      name: nama,
      short_name: nama.slice(0, 12),
      display: 'standalone',
      background_color: '#ffffff',
      theme_color: temaWarna.value || '#141414',
      icons: [
        { src: 'favicon-192.png', sizes: '192x192', type: 'image/png' },
        { src: 'favicon-512.png', sizes: '512x512', type: 'image/png' },
        { src: 'maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    }, null, 2);
  }

  const build = () => {
    T.hide(statusBox);
    if (mode === 'gambar' && !imgUpload) { T.toast('Pilih gambar dulu'); return; }
    kanvasPaket = [];
    kanvasMaskable = null;
    let canvasOk = false;
    T.show(box, '<p class="center">Kurang lebih begini tampilannya di tab browser & layar HP.</p>');
    const prev = T.el('<div class="center" style="display:flex;gap:16px;justify-content:center;align-items:flex-end;flex-wrap:wrap;margin:8px 0 14px"></div>');
    const row = T.el('<div class="row" style="flex-wrap:wrap"></div>');
    SIZES.forEach((size) => {
      const cv = drawAktif(size);
      if (!cv) return;
      canvasOk = true;
      kanvasPaket.push({ size, canvas: cv });
      const label = size === 180 ? 'Apple Touch 180px' : size === 144 ? 'Windows Tile 144px' : size + 'px';
      const px = Math.min(size, 96);
      cv.style.cssText = 'width:' + px + 'px;height:' + px + 'px;border-radius:14px;border:1px solid var(--line)';
      const wrap = T.el('<div class="center"></div>');
      wrap.appendChild(cv);
      wrap.appendChild(T.el('<p class="hint">' + T.esc(label) + '</p>'));
      prev.appendChild(wrap);
      if ([16, 32, 180, 192, 512].includes(size)) {
        row.appendChild(T.btn('Unduh ' + size + 'px', () => {
          cv.toBlob((b) => {
            if (b) T.dl(namaFile(size), b, 'image/png');
            else T.toast('Gagal bikin gambar, coba lagi');
          }, 'image/png');
        }));
      }
    });
    // Ikon maskable Android (zona aman 80%)
    const maskCv = drawMaskable();
    if (maskCv) {
      kanvasMaskable = maskCv;
      canvasOk = true;
      maskCv.style.cssText = 'width:96px;height:96px;border-radius:14px;border:1px solid var(--line)';
      const wrap = T.el('<div class="center"></div>');
      wrap.appendChild(maskCv);
      wrap.appendChild(T.el('<p class="hint">Maskable 512px (Android)</p>'));
      prev.appendChild(wrap);
    }
    box.appendChild(prev);
    box.appendChild(row);
    if (!canvasOk) {
      T.toast('Browser kamu nggak dukung canvas. Coba browser lain');
      box.appendChild(T.el('<p class="hint center">Preview & unduhan butuh dukungan canvas di browser.</p>'));
      return;
    }
    box.appendChild(T.row(T.btn('Unduh ZIP lengkap (semua ukuran + manifest)', unduhZip, true)));
    box.appendChild(T.el('<p class="hint center" style="margin-top:14px">ZIP berisi: favicon.ico, favicon.svg, PNG 16-512px, apple-touch-icon, maskable Android, tile Windows + browserconfig, manifest PWA, dan file snippet HTML. Tempel snippet ini di dalam &lt;head&gt; website kamu:</p>'));
    const snippet = snippetHtml();
    const pre = T.el('<pre class="monoall" style="white-space:pre-wrap;word-break:break-word;background:var(--line-soft);border:1px solid var(--line);border-radius:10px;padding:12px;font-size:12.5px;line-height:1.6;overflow-x:auto"></pre>');
    pre.textContent = snippet;
    box.appendChild(pre);
    box.appendChild(T.row(T.copyBtn(() => snippet, 'Salin snippet')));
  };

  async function unduhZip() {
    if (!kanvasPaket.length) { T.toast('Buat dulu ikonnya'); return; }
    T.show(statusBox, '<p class="center mut">Menyiapkan ZIP...</p>');
    const ok = await loadZip();
    if (!ok) {
      T.show(statusBox, '<span class="err">Pembuat ZIP gagal dimuat. Cek koneksi internetmu lalu coba lagi. Unduhan satuan tetap bisa dipakai.</span>');
      return;
    }
    try {
      const zip = new window.JSZip();
      const pngKecil = [];
      for (const { size, canvas } of kanvasPaket) {
        const blob = await new Promise((res) => canvas.toBlob((b) => res(b), 'image/png'));
        if (!blob) continue;
        zip.file(namaFile(size), blob);
        if ([16, 32, 48].includes(size)) {
          pngKecil.push({ size, bytes: new Uint8Array(await blob.arrayBuffer()) });
        }
      }
      if (pngKecil.length) zip.file('favicon.ico', buatIco(pngKecil));
      if (kanvasMaskable) {
        const maskBlob = await new Promise((res) => kanvasMaskable.toBlob((b) => res(b), 'image/png'));
        if (maskBlob) zip.file('maskable-512.png', maskBlob);
      }
      const svgIsi = mode === 'emoji' ? svgEmoji() : await svgGambar();
      if (svgIsi) zip.file('favicon.svg', svgIsi);
      zip.file('browserconfig.xml', browserconfigXml());
      zip.file('manifest.webmanifest', manifestJson());
      zip.file('snippet.html', snippetHtml());
      const blobZip = await zip.generateAsync({ type: 'blob' });
      T.dl('favicon-paket.zip', blobZip, 'application/zip');
      T.hide(statusBox);
      T.toast('ZIP berhasil diunduh');
    } catch (e) {
      T.show(statusBox, '<span class="err">Gagal membuat ZIP. Coba lagi.</span>');
    }
  }

  fileI.addEventListener('change', async () => {
    if (!fileI.files[0]) return;
    try { imgUpload = await loadImage(fileI.files[0]); }
    catch (e) { T.toast('File bukan gambar yang valid'); return; }
    build();
  });

  // Halaman per mode
  const pageGambar = T.el('<div></div>');
  pageGambar.appendChild(T.field('Pilih gambar (logo atau foto)', fileI, 'Gambar dipotong jadi persegi otomatis, bagian tengah yang dipakai.'));
  const pageEmoji = T.el('<div></div>');
  pageEmoji.appendChild(T.field('Emoji atau huruf', glyph, 'Satu emoji (🚀) atau 1-2 huruf inisial brand kamu.'));
  pageEmoji.appendChild(T.field('Warna background', bg));

  const bar = tabs([['Dari gambar', 0], ['Dari emoji atau huruf', 1]], [pageGambar, pageEmoji]);
  bar.querySelectorAll('button').forEach((b, i) => b.addEventListener('click', () => {
    mode = i === 0 ? 'gambar' : 'emoji';
    T.hide(box); T.hide(statusBox);
    kanvasPaket = [];
    kanvasMaskable = null;
  }));

  root.appendChild(T.el('<p class="note">🔒 ' + LOCAL_NOTE + '</p>'));
  root.appendChild(bar);
  root.appendChild(pageGambar);
  root.appendChild(pageEmoji);
  root.appendChild(T.grid2(T.field('Nama situs (untuk manifest PWA)', namaSitus), T.field('Warna tema', temaWarna)));
  root.appendChild(T.row(T.btn('Buat favicon', build, true)));
  root.appendChild(statusBox);
  root.appendChild(box);
  root.appendChild(T.el('<p class="hint center">Gambar dibuat langsung di perangkatmu, nggak ada yang diupload.</p>'));
}
