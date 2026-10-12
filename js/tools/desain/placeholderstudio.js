import { h as T, errBox } from '../../core.js?v=6.9.20';

export const meta = {"id": "placeholderstudio", "name": "Placeholder Studio", "cat": "desain", "icon": "🖼️", "desc": "Generator gambar placeholder custom.", "keywords": "placeholder,gambar,dummy,wireframe,mockup"};

export function render(root) {
  const PRESETS = [    { id: 'square', label: 'Square 1:1', w: 1080, h: 1080 },
    { id: 'landscape', label: 'Landscape 16:9', w: 1280, h: 720 },
    { id: 'portrait', label: 'Portrait 4:5', w: 1080, h: 1350 },
    { id: 'story', label: 'Story 9:16', w: 1080, h: 1920 },
    { id: 'og', label: 'OG Image', w: 1200, h: 630 },
    { id: 'hero', label: 'Hero', w: 1600, h: 900 },
    { id: 'banner', label: 'Banner', w: 1500, h: 500 },
    { id: 'thumbnail', label: 'Thumbnail', w: 1280, h: 720 },
  ];
  const FONTS = {
    lato: 'Lato,Arial,sans-serif', lora: 'Lora,Georgia,serif', montserrat: 'Montserrat,Arial,sans-serif',
    'noto-sans': 'Noto Sans,Arial,sans-serif', 'open-sans': 'Open Sans,Arial,sans-serif',
    oswald: 'Oswald,Arial,sans-serif', 'playfair-display': 'Playfair Display,Georgia,serif',
    poppins: 'Poppins,Arial,sans-serif', 'pt-sans': 'PT Sans,Arial,sans-serif',
    raleway: 'Raleway,Arial,sans-serif', roboto: 'Roboto,Arial,sans-serif',
    'source-sans-pro': 'Source Sans Pro,Arial,sans-serif',
  };
  const FORMATS = [['png', 'PNG'], ['jpg', 'JPG'], ['webp', 'WebP'], ['svg', 'SVG']];
  const MIME = { png: 'image/png', jpg: 'image/jpeg', webp: 'image/webp', svg: 'image/svg+xml' };

  const normHex = (v) => {
    const m = String(v || '').trim().match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i);
    if (!m) return '';
    let h = m[1].toLowerCase();
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    return '#' + h;
  };

  const wInp = T.input('number', 'Lebar', '1080');
  const hInp = T.input('number', 'Tinggi', '1080');
  const fmtSel = T.select(FORMATS, 'png');
  const fontSel = T.select(Object.keys(FONTS).map((k) => [k, k.replace(/-/g, ' ')]), 'poppins');
  const txtTa = T.ta(3, 'Teks placeholder (maks 8 baris)…', 'PLACEHOLDER');
  const bgInp = T.el('<input type="color" value="#3a3a3a" style="width:100%;height:44px;border:1px solid #27272a;border-radius:8px;background:none;padding:4px;cursor:pointer">');
  const fgInp = T.el('<input type="color" value="#ffffff" style="width:100%;height:44px;border:1px solid #27272a;border-radius:8px;background:none;padding:4px;cursor:pointer">');
  const retinaSel = T.select([['1', '1x'], ['2', '2x']], '1');
  const box = T.out();
  const preview = T.el('<div style="margin-top:12px;display:flex;justify-content:center"></div>');
  const imgPrev = document.createElement('img');
  imgPrev.style.cssText = 'max-width:100%;height:auto;border-radius:12px;border:1px solid #ffffff20;display:none';
  preview.appendChild(imgPrev);

  let lastBlob = null, lastFmt = 'png';

  const presetBar = T.el('<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px"></div>');
  PRESETS.forEach((p) => {
    const b = T.btn(p.label, () => {
      wInp.value = p.w; hInp.value = p.h;
      presetBar.querySelectorAll('button').forEach((x) => x.classList.remove('primary'));
      b.classList.add('primary');
    });
    b.classList.add('small');
    presetBar.appendChild(b);
  });

  const escSvg = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/\r?\n/g, '&#10;');

  function localSvg(w, h, text, bg, fg, font) {
    const fontSize = Math.max(16, Math.min(w * 0.11, h * 0.28, 260));
    const lines = String(text || '').split(/\r?\n/).slice(0, 8);
    const lh = Math.round(fontSize * 1.16);
    const firstY = h / 2 - ((lines.length - 1) * lh) / 2;
    const bgRect = '<rect width="100%" height="100%" fill="' + bg + '"/>';
    const texts = lines.map((line, i) =>
      '<text x="' + (w / 2) + '" y="' + Math.round(firstY + i * lh) + '" dominant-baseline="middle">' + escSvg(line || ' ') + '</text>'
    ).join('');
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '">' +
      bgRect + '<g fill="' + fg + '" font-family="' + escSvg(FONTS[font] || 'Arial,sans-serif') + '" font-size="' + fontSize + '" font-weight="700" text-anchor="middle">' +
      texts + '</g></svg>';
  }

  const generate = () => {
    const w = Math.round(+wInp.value), h = Math.round(+hInp.value);
    if (!Number.isFinite(w) || !Number.isFinite(h) || w < 10 || h < 10 || w > 4000 || h > 4000) {
      T.show(box, errBox('Ukuran tidak valid. Lebar & tinggi 10–4000 px.')); return;
    }
    const bg = normHex(bgInp.value), fg = normHex(fgInp.value);
    if (!bg || !fg) { T.show(box, errBox('Warna harus HEX valid.')); return; }
    const fmt = fmtSel.value;
    const svg = localSvg(w, h, txtTa.value, bg, fg, fontSel.value);
    if (fmt === 'svg') {
      lastBlob = new Blob([svg], { type: MIME.svg });
      lastFmt = 'svg';
      imgPrev.src = URL.createObjectURL(lastBlob);
      imgPrev.style.display = 'block';
      T.show(box, '<span class="ok">Placeholder ' + w + '×' + h + ' SVG siap.</span>');
      dlRow.hidden = false;
      return;
    }
    T.show(box, '<span class="dim">Me-render gambar…</span>');
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    const image = new Image();
    image.onload = () => {
      try {
        const scale = +retinaSel.value;
        const cv = document.createElement('canvas');
        cv.width = w * scale; cv.height = h * scale;
        const c = cv.getContext('2d');
        if (fmt === 'jpg') { c.fillStyle = bg; c.fillRect(0, 0, cv.width, cv.height); }
        c.drawImage(image, 0, 0, cv.width, cv.height);
        URL.revokeObjectURL(url);
        cv.toBlob((blob) => {
          if (!blob) { T.show(box, errBox('Browser ini tidak mendukung ekspor ' + fmt.toUpperCase() + '.')); return; }
          lastBlob = blob; lastFmt = fmt;
          imgPrev.src = URL.createObjectURL(blob);
          imgPrev.style.display = 'block';
          T.show(box, '<span class="ok">Placeholder ' + cv.width + '×' + cv.height + ' ' + fmt.toUpperCase() + ' siap.</span>');
          dlRow.hidden = false;
        }, MIME[fmt], 0.94);
      } catch (e) { URL.revokeObjectURL(url); T.show(box, errBox('Gagal me-render: ' + e.message)); }
    };
    image.onerror = () => { URL.revokeObjectURL(url); T.show(box, errBox('Gagal me-render gambar.')); };
    image.src = url;
  };

  const dlRow = T.el('<div hidden style="margin-top:10px"></div>');
  dlRow.appendChild(T.btn('Unduh Gambar', () => {
    if (!lastBlob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(lastBlob);
    a.download = 'placeholder-' + wInp.value + 'x' + hInp.value + '.' + lastFmt;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }, true));

  // ---- Mode URL publik (gaya klasik placeholderimage.co) ----
  const CLASSIC_BASE = 'https://placeholderimage.co/';
  const CLASSIC_FORMATS = ['png', 'jpg', 'webp', 'svg', 'avif', 'gif'];
  /** Bangun URL placeholder publik (tanpa DOM — bisa diuji). */
  const buildClassicUrl = (w, h, bg, fg, fmt, font, text, retina) => {
    const suffix = retina === 2 ? '@2x' : '';
    const q = new URLSearchParams();
    q.set('font', font);
    q.set('text', text);
    return CLASSIC_BASE + w + 'x' + h + suffix + '/' + bg.replace('#', '') + '/' +
      fg.replace('#', '') + '/' + fmt + '?' + q.toString();
  };

  const urlPane = T.el('<div hidden style="margin-top:4px"></div>');
  const cwInp = T.input('number', 'Lebar', '1080');
  const chInp = T.input('number', 'Tinggi', '1080');
  const cfmtSel = T.select(CLASSIC_FORMATS.map((f) => [f, f.toUpperCase()]), 'png');
  const cfontSel = T.select(Object.keys(FONTS).map((k) => [k, k.replace(/-/g, ' ')]), 'poppins');
  const ctxtTa = T.ta(2, 'Teks…', 'PLACEHOLDER');
  const cbgInp = T.el('<input type="color" value="#3a3a3a" style="width:100%;height:44px;border:1px solid #27272a;border-radius:8px;background:none;padding:4px;cursor:pointer">');
  const cfgInp = T.el('<input type="color" value="#ffffff" style="width:100%;height:44px;border:1px solid #27272a;border-radius:8px;background:none;padding:4px;cursor:pointer">');
  const cretSel = T.select([['1', '1x'], ['2', '2x (@2x)']], '1');
  const urlOut = T.out();
  urlPane.appendChild(T.grid2(T.field('Lebar (px)', cwInp), T.field('Tinggi (px)', chInp)));
  urlPane.appendChild(T.grid2(T.field('Format', cfmtSel), T.field('Font', cfontSel)));
  urlPane.appendChild(T.grid2(T.field('Warna background', cbgInp), T.field('Warna teks', cfgInp)));
  urlPane.appendChild(T.grid2(T.field('Teks', ctxtTa), T.field('Retina', cretSel)));
  urlPane.appendChild(T.row(T.btn('Buat URL Publik', () => {
    const w = Math.round(+cwInp.value), h = Math.round(+chInp.value);
    if (!Number.isFinite(w) || !Number.isFinite(h) || w < 10 || h < 10 || w > 4000 || h > 4000) {
      T.show(urlOut, errBox('Ukuran tidak valid. Lebar & tinggi 10–4000 px.')); return;
    }
    const bg = normHex(cbgInp.value), fg = normHex(cfgInp.value);
    if (!bg || !fg) { T.show(urlOut, errBox('Warna harus HEX valid.')); return; }
    const url = buildClassicUrl(w, h, bg, fg, cfmtSel.value, cfontSel.value,
      String(ctxtTa.value || '').slice(0, 120), Number(cretSel.value));
    const box2 = T.el('<div style="margin-top:8px"></div>');
    box2.appendChild(T.el('<div style="font-weight:700;margin-bottom:6px">🔗 URL publik siap</div>'));
    const link = T.el('<a href="' + T.esc(url) + '" target="_blank" rel="noopener" style="font-size:12px;word-break:break-all;color:#7dd3fc">' + T.esc(url) + '</a>');
    box2.appendChild(link);
    const prev2 = T.el('<img style="max-width:100%;height:auto;border-radius:12px;border:1px solid #ffffff20;margin-top:8px" alt="pratinjau placeholder">');
    prev2.src = url;
    prev2.onerror = () => { prev2.style.display = 'none'; };
    box2.appendChild(prev2);
    const btnWrap = T.el('<div style="margin-top:8px"></div>');
    btnWrap.appendChild(T.row(T.copyBtn(() => url, '📋 Salin URL'),
      T.btn('⬇ Unduh via URL', () => {
        const a = document.createElement('a');
        a.href = url; a.download = 'placeholder-' + w + 'x' + h + '.' + cfmtSel.value;
        a.target = '_blank'; a.rel = 'noopener';
        document.body.appendChild(a); a.click(); a.remove();
      })));
    box2.appendChild(btnWrap);
    T.show(urlOut, ''); urlOut.innerHTML = ''; urlOut.appendChild(box2);
  }, true)));
  urlPane.appendChild(urlOut);
  urlPane.appendChild(T.el('<p class="dim" style="font-size:12px;margin-top:8px">URL dibuat dari layanan publik placeholderimage.co (tanpa API key) — gambar di-render oleh layanan tersebut saat URL dibuka, bukan di perangkatmu.</p>'));

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Bikin gambar placeholder custom — di-render lokal di perangkatmu, siap unduh. Atau pakai mode <b>URL Publik</b> untuk link placeholder siap tempel.</p>'));
  const tabBar = T.el('<div style="display:flex;gap:6px;margin-bottom:12px"></div>');
  const bLocal = T.btn('🖼 Lokal', null); bLocal.classList.add('primary');
  const bUrl = T.btn('🔗 URL Publik', null);
  const localPane = T.el('<div></div>');
  tabBar.appendChild(bLocal); tabBar.appendChild(bUrl);
  root.appendChild(tabBar);
  root.appendChild(localPane);
  root.appendChild(urlPane);
  bLocal.addEventListener('click', () => { localPane.hidden = false; urlPane.hidden = true; bLocal.classList.add('primary'); bUrl.classList.remove('primary'); });
  bUrl.addEventListener('click', () => { localPane.hidden = true; urlPane.hidden = false; bUrl.classList.add('primary'); bLocal.classList.remove('primary'); });
  localPane.appendChild(T.el('<div style="margin-bottom:4px"><b>Preset ukuran</b></div>'));
  localPane.appendChild(presetBar);
  localPane.appendChild(T.grid2(T.field('Lebar (px)', wInp), T.field('Tinggi (px)', hInp)));
  localPane.appendChild(T.grid2(T.field('Format', fmtSel), T.field('Font', fontSel)));
  localPane.appendChild(T.grid2(T.field('Warna background', bgInp), T.field('Warna teks', fgInp)));
  localPane.appendChild(T.grid2(T.field('Teks', txtTa), T.field('Skala (retina)', retinaSel)));
  localPane.appendChild(T.row(T.btn('Buat Placeholder', generate, true)));
  localPane.appendChild(box);
  localPane.appendChild(preview);
  localPane.appendChild(dlRow);
}
