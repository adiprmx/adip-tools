import { h as T, utils, esc, preHtml } from '../../core.js?v=6.9.5';

export const meta = {"id": "palet-dari-foto", "name": "Palet dari Foto", "cat": "desain", "icon": "🖼️", "desc": "Ekstrak warna dominan dari foto jadi palet HEX.", "keywords": "palet,palette,foto,warna dominan,ekstrak,hex"};
export function render(root) {

    const fileInp = T.el('<input type="file" accept="image/*" class="inp" style="padding:10px">');
    const nSel = T.select([['4', '4 warna'], ['6', '6 warna'], ['8', '8 warna'], ['10', '10 warna']], '8');
    const drop = T.el('<label style="display:flex;align-items:center;justify-content:center;flex-direction:column;gap:8px;min-height:140px;border:1px dashed #3f3f46;border-radius:12px;cursor:pointer;background:#131316;text-align:center;padding:16px"><span style="font-size:28px">📷</span><span class="hint">Klik untuk pilih foto<br><span style="font-size:11px">foto hanya diproses di browser, tidak di-upload</span></span></label>');
    const imgWrap = T.el('<div style="margin:12px 0;display:none"></div>');
    const thumb = T.el('<img alt="pratinjau foto" style="max-width:100%;max-height:220px;border-radius:10px;border:1px solid #27272a;display:block;margin:0 auto">');
    imgWrap.appendChild(thumb);
    const swatches = T.el('<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:8px;margin:12px 0"></div>');
    const codeBox = T.out();

    drop.insertBefore(fileInp, drop.firstChild);
    fileInp.style.display = 'none';

    const toHex = (r, g, b) => '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
    const extract = (img) => {
      const max = 64;
      const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
      const w = Math.max(1, Math.round(img.naturalWidth * scale));
      const h = Math.max(1, Math.round(img.naturalHeight * scale));
      const cv = document.createElement('canvas');
      cv.width = w; cv.height = h;
      const ctx = cv.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, 0, 0, w, h);
      const data = ctx.getImageData(0, 0, w, h).data;
      const buckets = new Map();
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] < 128) continue;
        const key = ((data[i] >> 4) << 8) | ((data[i + 1] >> 4) << 4) | (data[i + 2] >> 4);
        const b = buckets.get(key);
        if (b) { b.n++; b.r += data[i]; b.g += data[i + 1]; b.b += data[i + 2]; }
        else buckets.set(key, { n: 1, r: data[i], g: data[i + 1], b: data[i + 2] });
      }
      const n = +nSel.value;
      return [...buckets.values()]
        .sort((a, b) => b.n - a.n)
        .slice(0, n * 3)
        .filter((b, i, arr) => arr.findIndex(x => Math.abs(x.r / x.n - b.r / b.n) < 24 && Math.abs(x.g / x.n - b.g / b.n) < 24 && Math.abs(x.b / x.n - b.b / b.n) < 24) === i)
        .slice(0, n)
        .map(b => toHex(Math.round(b.r / b.n), Math.round(b.g / b.n), Math.round(b.b / b.n)));
    };
    const paint = (hexes) => {
      swatches.innerHTML = '';
      hexes.forEach(hex => {
        const sw = T.el('<div style="border-radius:10px;overflow:hidden;border:1px solid #27272a;cursor:pointer"></div>');
        sw.innerHTML =
          '<div style="height:64px;background:' + hex + '"></div>' +
          '<div class="hexlbl" style="padding:6px 4px;text-align:center;font-size:11px;font-family:monospace;background:#131316">' + hex.toUpperCase() + '</div>';
        sw.title = 'Klik untuk salin';
        sw.addEventListener('click', () => T.copy(hex));
        swatches.appendChild(sw);
      });
      T.show(codeBox, preHtml(hexes.join('\n'), ''));
    };
    let lastImg = null, lastUrl = null;
    fileInp.addEventListener('change', () => {
      const f = fileInp.files && fileInp.files[0];
      if (!f) return;
      if (!f.type.startsWith('image/')) { T.toast('File bukan gambar'); return; }
      if (lastUrl) URL.revokeObjectURL(lastUrl);
      const url = URL.createObjectURL(f);
      lastUrl = url;
      const img = new Image();
      img.onload = () => {
        lastImg = img;
        thumb.src = url;
        imgWrap.style.display = '';
        try { paint(extract(img)); }
        catch (e) { T.toast('Gagal membaca gambar'); }
      };
      img.onerror = () => { T.toast('Gambar tidak bisa dibaca'); URL.revokeObjectURL(url); };
      img.src = url;
    });
    nSel.addEventListener('change', () => { if (lastImg) { try { paint(extract(lastImg)); } catch (e) { T.toast('Gagal membaca gambar'); } } });

    root.appendChild(T.field('Jumlah warna', nSel));
    root.appendChild(drop);
    root.appendChild(imgWrap);
    root.appendChild(swatches);
    root.appendChild(codeBox);
    root.appendChild(T.row(T.copyBtn(() => [...swatches.querySelectorAll('.hexlbl')].map(d => d.textContent).join(', ') || '', 'Salin Palet')));
    root.appendChild(T.el('<div class="hint">Klik swatch untuk salin HEX satu per satu.</div>'));

}
