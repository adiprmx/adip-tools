import { h as T, utils } from '../../core.js?v=6.5.0';

export const meta = {"id": "favicon", "name": "Favicon Generator", "cat": "desain", "icon": "⭐", "desc": "Bikin favicon dari emoji/teks.", "keywords": "favicon,icon,emoji,website"};
export function render(root) {

    const fTxt = T.input('text', 'Emoji atau 1-2 huruf, misal: 🍜 atau AM', '🍜');
    fTxt.setAttribute('maxlength', '4');
    const fBg = T.el('<input type="color" value="#18181b" style="width:100%;height:44px;border:1px solid #27272a;border-radius:8px;background:none;padding:4px;cursor:pointer">');
    const fShape = T.select([['round', 'Bulat'], ['square', 'Kotak'], ['squircle', 'Kotak rounded']], 'round');
    const prevBox = T.el('<div style="display:flex;gap:24px;align-items:flex-end;margin:16px 0"></div>');
    const draw = (size) => {
      const cv = document.createElement('canvas');
      cv.width = cv.height = size;
      const x = cv.getContext('2d');
      const bg = fBg.value, shape = fShape.value;
      x.fillStyle = bg;
      if (shape === 'round') { x.beginPath(); x.arc(size / 2, size / 2, size / 2, 0, 7); x.fill(); }
      else if (shape === 'squircle') {
        const r = size * 0.25;
        x.beginPath();
        x.moveTo(r, 0); x.arcTo(size, 0, size, size, r); x.arcTo(size, size, 0, size, r);
        x.arcTo(0, size, 0, 0, r); x.arcTo(0, 0, size, 0, r); x.closePath(); x.fill();
      } else x.fillRect(0, 0, size, size);
      const txt = fTxt.value.trim() || '?';
      x.fillStyle = '#ffffff';
      x.textAlign = 'center'; x.textBaseline = 'middle';
      x.font = Math.floor(size * 0.58) + 'px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif';
      x.fillText(txt.slice(0, 4), size / 2, size * 0.54);
      return cv;
    };
    const paint = () => {
      prevBox.innerHTML = '';
      [[180, '180px (Apple touch)'], [64, '64px']].forEach(([sz, lbl]) => {
        const cv = draw(sz);
        const w = T.el('<div style="text-align:center"></div>');
        const img = T.el('<img style="border-radius:8px;border:1px solid #27272a;image-rendering:auto">');
        img.src = cv.toDataURL('image/png');
        img.style.width = sz === 180 ? '96px' : '64px';
        img.style.height = img.style.width;
        w.appendChild(img);
        w.appendChild(T.el('<div class="hint" style="margin-top:6px">' + lbl + '</div>'));
        prevBox.appendChild(w);
      });
    };
    [fTxt, fShape].forEach((i) => i.addEventListener('input', paint));
    fBg.addEventListener('input', paint);
    root.appendChild(T.grid2(
      T.field('Emoji / teks', fTxt),
      T.el('<div class="fld"><label>Warna background</label></div>').appendChild(fBg).parentNode
    ));
    root.appendChild(T.field('Bentuk', fShape));
    root.appendChild(prevBox);
    root.appendChild(T.row(
      T.btn('Unduh PNG 180px', () => {
        T.dl('favicon-180.png', dataURLtoBlob(draw(180).toDataURL('image/png')));
      }, true),
      T.btn('Unduh PNG 64px', () => {
        T.dl('favicon-64.png', dataURLtoBlob(draw(64).toDataURL('image/png')));
      })
    ));
    function dataURLtoBlob(u) {
      const b = atob(u.split(',')[1]);
      const a = new Uint8Array(b.length);
      for (let i = 0; i < b.length; i++) a[i] = b.charCodeAt(i);
      return new Blob([a], { type: 'image/png' });
    }
    paint();
  
}
