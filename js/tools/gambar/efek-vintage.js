import { h as T, utils } from '../../core.js?v=6.7.0';

export const meta = {"id": "efek-vintage", "name": "Efek Vintage", "cat": "gambar", "icon": "📷", "desc": "Ubah foto jadi nuansa vintage: sepia, vignette, grain.", "keywords": "vintage,foto,filter,sepia,vignette,grain,foto jadul"};
export function render(root) {
  const pickBtn = T.btn('Pilih foto', null, true);
  const file = document.createElement('input');
  file.type = 'file';
  file.accept = 'image/*';
  file.style.display = 'none';
  pickBtn.addEventListener('click', () => file.click());

  const loadImage = (f) => new Promise((res, rej) => {
    if (!f || !/^image\//.test(f.type)) return rej(new Error('not-image'));
    const url = URL.createObjectURL(f);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); res(img); };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('bad-image')); };
    img.src = url;
  });

  const slider = T.input('range');
  slider.min = '0'; slider.max = '100'; slider.step = '1'; slider.value = '70';
  slider.style.width = '100%';
  const pct = T.el('<span class="mut" style="font-size:13px">70%</span>');

  const box = T.out();
  const hint = T.el('<p class="hint">Pilih foto dari galeri, atur seberapa "jadul" hasilnya lewat slider, lalu unduh.</p>');

  let img = null;
  let canvas = null;
  let objUrl = null;

  const applyVintage = () => {
    if (!img || !canvas) return;
    const t = Number(slider.value) / 100;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    if (t <= 0) return;
    const id = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = id.data;
    const w = canvas.width, hgt = canvas.height;
    const cx = w / 2, cy = hgt / 2;
    const maxD = Math.sqrt(cx * cx + cy * cy);
    for (let y = 0; y < hgt; y++) {
      const dy = (y - cy) / maxD;
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        const r = d[i], g = d[i + 1], b = d[i + 2];
        // sepia (dicampur sesuai intensitas)
        const sr = 0.393 * r + 0.769 * g + 0.189 * b;
        const sg = 0.349 * r + 0.686 * g + 0.168 * b;
        const sb = 0.272 * r + 0.534 * g + 0.131 * b;
        let nr = r + (sr - r) * t;
        let ng = g + (sg - g) * t;
        let nb = b + (sb - b) * t;
        // hangat + kontras lembut
        nr += 10 * t; nb -= 8 * t;
        ng -= 2 * t;
        // vignette: gelap di tepi
        const dx = (x - cx) / maxD;
        const dist2 = dx * dx + dy * dy;
        const vig = 1 - 0.65 * t * dist2;
        nr *= vig; ng *= vig; nb *= vig;
        // grain ringan
        const gr = (Math.random() - 0.5) * 26 * t;
        d[i] = Math.max(0, Math.min(255, nr + gr));
        d[i + 1] = Math.max(0, Math.min(255, ng + gr));
        d[i + 2] = Math.max(0, Math.min(255, nb + gr));
      }
    }
    ctx.putImageData(id, 0, 0);
  };

  const showResult = () => {
    if (!img) return;
    T.show(box, '');
    box.appendChild(canvas);
    box.appendChild(T.row(
      T.btn('Unduh PNG', () => {
        canvas.toBlob((blob) => {
          if (blob) T.dl('efek-vintage.png', blob, 'image/png');
          else T.toast('Gagal membuat file, coba lagi');
        }, 'image/png');
      }, true)
    ));
  };

  slider.addEventListener('input', () => {
    pct.textContent = slider.value + '%';
    applyVintage();
  });

  file.addEventListener('change', () => {
    const f = file.files && file.files[0];
    if (!f) return;
    if (objUrl) URL.revokeObjectURL(objUrl);
    loadImage(f).then((im) => {
      img = im;
      const MAX = 1400;
      const sc = Math.min(1, MAX / Math.max(im.naturalWidth, im.naturalHeight));
      canvas = document.createElement('canvas');
      canvas.width = Math.round(im.naturalWidth * sc);
      canvas.height = Math.round(im.naturalHeight * sc);
      canvas.style.cssText = 'max-width:100%;height:auto;border-radius:10px;border:1px solid #ffffff20;display:block;margin-bottom:10px';
      applyVintage();
      showResult();
      T.toast('Foto siap, geser slider buat atur efeknya');
    }).catch(() => {
      T.show(box, '<div style="color:#ef4444;font-size:13px">File-nya bukan gambar yang valid nih, coba foto lain.</div>');
    });
    file.value = '';
  });

  T.onLeave(() => { if (objUrl) URL.revokeObjectURL(objUrl); img = null; canvas = null; });

  root.appendChild(T.row(pickBtn, file));
  root.appendChild(hint);
  root.appendChild(T.field('Intensitas efek vintage', slider));
  root.appendChild(T.row(T.el('<span class="mut" style="font-size:13px">Intensitas:</span>'), pct));
  root.appendChild(box);
}
