import { h as T, errBox } from '../../core.js?v=6.9.20';

export const meta = {"id": "placeholderstudio", "name": "Placeholder Studio", "cat": "desain", "icon": "🖼️", "desc": "Generator gambar placeholder custom.", "keywords": "placeholder,gambar,dummy,wireframe,mockup"};

export function render(root) {

  const PRESETS = [
    { id: 'square', label: 'Square 1:1', w: 1080, h: 1080 },
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

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Bikin gambar placeholder custom — di-render lokal di perangkatmu, siap unduh.</p>'));
  root.appendChild(T.el('<div style="margin-bottom:4px"><b>Preset ukuran</b></div>'));
  root.appendChild(presetBar);
  root.appendChild(T.grid2(T.field('Lebar (px)', wInp), T.field('Tinggi (px)', hInp)));
  root.appendChild(T.grid2(T.field('Format', fmtSel), T.field('Font', fontSel)));
  root.appendChild(T.grid2(T.field('Warna background', bgInp), T.field('Warna teks', fgInp)));
  root.appendChild(T.grid2(T.field('Teks', txtTa), T.field('Skala (retina)', retinaSel)));
  root.appendChild(T.row(T.btn('Buat Placeholder', generate, true)));
  root.appendChild(box);
  root.appendChild(preview);
  root.appendChild(dlRow);
}
