import { h as T, utils } from '../../core.js?v=6.8.0';

export const meta = {"id":"mockup-hp","name":"Mockup HP","cat":"desain","icon":"📱","desc":"Tempel screenshot ke bingkai HP, unduh PNG.","keywords":"mockup,hp,smartphone,screenshot,bingkai,phone,frame"};

export function render(root) {
  const file = document.createElement('input');
  file.type = 'file';
  file.accept = 'image/*';
  file.hidden = true;

  const frameSel = T.select([['hitam', 'Hitam'], ['putih', 'Putih']], 'hitam');
  const pickBtn = T.btn('Pilih screenshot', () => file.click(), true);
  const dlBtn = T.btn('Unduh PNG', null, false, true);
  const box = T.out();

  let img = null;
  let lastCv = null;

  function loadImage(f) {
    return new Promise((res, rej) => {
      if (!f || !/^image\//.test(f.type)) return rej(new Error('bukan-gambar'));
      const url = URL.createObjectURL(f);
      const im = new Image();
      im.onload = () => { URL.revokeObjectURL(url); res(im); };
      im.onerror = () => { URL.revokeObjectURL(url); rej(new Error('gagal-baca')); };
      im.src = url;
    });
  }

  function rr(x, X, Y, W, H, R) {
    x.beginPath();
    x.moveTo(X + R, Y);
    x.arcTo(X + W, Y, X + W, Y + H, R);
    x.arcTo(X + W, Y + H, X, Y + H, R);
    x.arcTo(X, Y + H, X, Y, R);
    x.arcTo(X, Y, X + W, Y, R);
    x.closePath();
  }

  function compose() {
    const W = 480, H = 990, bez = 34;
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const x = c.getContext('2d');
    if (!x) return null; // browser tanpa dukungan canvas
    const fc = frameSel.value === 'putih' ? '#f4f4f2' : '#0c0c0d';

    // bingkai
    rr(x, 0, 0, W, H, 74);
    x.fillStyle = fc;
    x.fill();

    // layar (screenshot di-fit cover)
    const sx = bez, sy = bez, sw = W - bez * 2, sh = H - bez * 2;
    x.save();
    rr(x, sx, sy, sw, sh, 44);
    x.clip();
    const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
    const s = Math.max(sw / iw, sh / ih);
    const dw = iw * s, dh = ih * s;
    x.drawImage(img, sx + (sw - dw) / 2, sy + (sh - dh) / 2, dw, dh);
    x.restore();

    // hairline dalam
    rr(x, sx + 1, sy + 1, sw - 2, sh - 2, 43);
    x.strokeStyle = 'rgba(255,255,255,0.10)';
    x.lineWidth = 2;
    x.stroke();

    // dynamic island
    const dw2 = 112, dh2 = 27;
    x.fillStyle = '#000000';
    rr(x, W / 2 - dw2 / 2, sy + 16, dw2, dh2, dh2 / 2);
    x.fill();

    return c;
  }

  function redraw() {
    if (!img) return;
    lastCv = compose();
    if (!lastCv) { T.toast('Browser kamu nggak dukung canvas — coba browser lain'); return; }
    lastCv.style.cssText = 'max-width:230px;width:100%;height:auto;border-radius:18px';
    T.show(box, '<div class="center"></div>');
    box.firstElementChild.appendChild(lastCv);
    dlBtn.disabled = false;
  }

  file.addEventListener('change', () => {
    const f = file.files && file.files[0];
    if (!f) return;
    loadImage(f).then((im) => {
      img = im;
      redraw();
      T.toast('Screenshot kepasang!');
    }).catch(() => {
      T.toast('File-nya bukan gambar, coba yang lain');
    });
    file.value = '';
  });

  frameSel.addEventListener('change', redraw);

  dlBtn.addEventListener('click', () => {
    if (!lastCv) return;
    lastCv.toBlob((b) => {
      if (b) T.dl('mockup-hp.png', b, 'image/png');
      else T.toast('Gagal bikin gambar, coba lagi');
    }, 'image/png');
  });

  root.appendChild(T.row(pickBtn));
  root.appendChild(T.field('Warna bingkai', frameSel));
  root.appendChild(file);
  root.appendChild(box);
  root.appendChild(T.row(dlBtn));
  root.appendChild(T.el('<p class="hint center">Screenshot tidak diupload ke mana-mana — semua dikerjakan di perangkatmu.</p>'));
}
