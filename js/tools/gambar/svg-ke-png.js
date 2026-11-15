import { h as T, kv, fileInput, canvasToBlob, fmtBytes, errBox } from '../../core.js?v=6.12.0';

export const meta = {"id":"svg-ke-png","name":"SVG ke PNG","cat":"gambar","icon":"🖼️","desc":"Ubah gambar SVG jadi PNG, atur skala dan latarnya.","keywords":"svg,png,konversi,gambar,vektor,logo","since":"6.11.0"};

/* SVG ke PNG: baca kode SVG (tempel atau unggah file .svg), rasterisasi
   lewat Image + canvas. Skala 1x-4x, latar transparan atau putih. */
const MAX_DIM = 4096;

export function render(root) {
  const ta = T.ta(8, '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">\n  <circle cx="50" cy="50" r="40" fill="#fff"/>\n</svg>');
  const fi = fileInput('.svg,image/svg+xml');
  const skalaSel = T.select([['1', '1x (ukuran asli)'], ['2', '2x (lebih tajam)'], ['3', '3x'], ['4', '4x']], '2');
  const latarSel = T.select([['transparan', 'Transparan'], ['putih', 'Putih']], 'transparan');
  const box = T.out();
  let pngBlob = null, pngW = 0, pngH = 0;

  const contohBtn = T.btn('Isi contoh', () => {
    ta.value = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 120">\n' +
      '  <rect x="10" y="10" width="180" height="100" rx="14" fill="none" stroke="#ffffff" stroke-width="4"/>\n' +
      '  <circle cx="100" cy="60" r="30" fill="#ffffff"/>\n' +
      '  <text x="100" y="66" font-size="22" text-anchor="middle" fill="#111111" font-family="sans-serif" font-weight="bold">SVG</text>\n' +
      '</svg>';
  });

  fi.addEventListener('change', async () => {
    const f = fi.files && fi.files[0];
    if (!f) return;
    try { ta.value = await f.text(); T.toast('File SVG sudah dipilih'); }
    catch (e) { T.show(box, errBox('File tidak bisa dibaca.')); }
  });

  const raster = (svgText) => {
    let src = String(svgText || '').trim();
    if (!src) throw new Error('Tempel kode SVG atau pilih file .svg dulu.');
    if (!/^<svg[\s>]/.test(src)) throw new Error('Kode ini bukan SVG. Pastikan diawali tag <svg>.');
    if (!/xmlns=/.test(src)) src = src.replace(/<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
    const doc = new DOMParser().parseFromString(src, 'image/svg+xml');
    if (doc.querySelector('parsererror')) throw new Error('Kode SVG-nya tidak benar (XML rusak). Periksa tag yang belum tertutup.');
    const el = doc.documentElement;
    const num = (v) => { const n = parseFloat(String(v || '').replace(/px$/i, '')); return isFinite(n) && n > 0 ? n : NaN; };
    let w = num(el.getAttribute('width')), h = num(el.getAttribute('height'));
    if (!isFinite(w) || !isFinite(h)) {
      const vb = (el.getAttribute('viewBox') || '').trim().split(/[\s,]+/).map(Number);
      if (vb.length === 4 && isFinite(vb[2]) && isFinite(vb[3]) && vb[2] > 0 && vb[3] > 0) { w = vb[2]; h = vb[3]; }
    }
    if (!isFinite(w) || !isFinite(h)) throw new Error('SVG ini tidak punya ukuran. Tambahkan width dan height, atau viewBox, di tag <svg>.');
    return { src, w, h };
  };

  const buat = async () => {
    let parsed;
    try { parsed = raster(ta.value); }
    catch (e) { T.show(box, errBox(e.message)); return; }
    let scale = +skalaSel.value || 1;
    let outW = Math.round(parsed.w * scale), outH = Math.round(parsed.h * scale);
    let clamped = false;
    if (outW > MAX_DIM || outH > MAX_DIM) {
      const k = MAX_DIM / Math.max(outW, outH);
      outW = Math.max(1, Math.round(outW * k)); outH = Math.max(1, Math.round(outH * k));
      clamped = true;
    }
    T.show(box, '<span class="dim">Membuat PNG…</span>');
    const url = URL.createObjectURL(new Blob([parsed.src], { type: 'image/svg+xml;charset=utf-8' }));
    try {
      const img = await new Promise((res, rej) => {
        const im = new Image();
        im.onload = () => res(im);
        im.onerror = () => rej(new Error('SVG tidak bisa digambar. Cek lagi isinya, mungkin ada gambar dari situs lain yang diblokir browser.'));
        im.src = url;
      });
      const c = document.createElement('canvas');
      c.width = outW; c.height = outH;
      const x = c.getContext('2d');
      if (!x) throw new Error('Browser ini tidak bisa membuat gambar.');
      if (latarSel.value === 'putih') { x.fillStyle = '#ffffff'; x.fillRect(0, 0, outW, outH); }
      x.drawImage(img, 0, 0, outW, outH);
      pngBlob = await canvasToBlob(c, 'image/png');
      if (!pngBlob) throw new Error('File PNG tidak bisa dibuat.');
      pngW = outW; pngH = outH;
      const prevUrl = URL.createObjectURL(pngBlob);
      T.show(box,
        kv('Ukuran', outW + ' × ' + outH + ' px') +
        kv('Ukuran file', fmtBytes(pngBlob.size)) +
        (clamped ? '<p class="hint">Ukuran dibatasi sampai ' + MAX_DIM + ' px supaya HP tidak keberatan.</p>' : ''));
      const prev = T.el('<div style="margin:10px 0;text-align:center"></div>');
      const im2 = document.createElement('img');
      im2.src = prevUrl;
      im2.alt = 'Pratinjau PNG';
      im2.style.cssText = 'max-width:100%;height:auto;border-radius:10px;border:1px solid #ffffff20;background:repeating-conic-gradient(#3f3f46 0% 25%, #27272a 0% 50%) 0 0/16px 16px';
      prev.appendChild(im2);
      box.appendChild(prev);
      box.appendChild(T.row(T.btn('Unduh PNG', () => {
        if (pngBlob) T.dl('gambar-' + pngW + 'x' + pngH + '.png', pngBlob, 'image/png');
      }, true)));
      T.toast('PNG jadi');
    } catch (e) {
      T.show(box, errBox(e.message || 'PNG tidak bisa dibuat.'));
    } finally {
      URL.revokeObjectURL(url);
    }
  };

  root.appendChild(T.el('<p class="note">Diproses di browser, file tidak diunggah ke mana-mana.</p>'));
  root.appendChild(T.el('<p class="mut" style="font-size:13.5px;line-height:1.6">Tempel kode SVG atau pilih file .svg, pilih skala dan latar, lalu unduh PNG-nya. Skala 2x cocok untuk gambar yang tetap tajam di layar HP.</p>'));
  root.appendChild(T.field('Kode SVG', ta));
  root.appendChild(T.row(contohBtn));
  root.appendChild(T.field('Atau pilih file .svg', fi));
  root.appendChild(T.grid2(T.field('Skala', skalaSel), T.field('Latar', latarSel)));
  root.appendChild(T.row(T.btn('Buat PNG', buat, true)));
  root.appendChild(box);
}
