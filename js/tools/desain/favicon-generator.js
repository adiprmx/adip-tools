import { h as T, utils } from '../../core.js?v=6.8.0';

export const meta = {"id":"favicon-generator","name":"Favicon Generator","cat":"desain","icon":"⭐","desc":"Bikin favicon PNG dari emoji atau huruf.","keywords":"favicon,icon,emoji,png,apple-touch,logo,website"};

export function render(root) {
  const glyph = T.input('text', 'Emoji atau 1-2 huruf, mis. 🚀 atau A');
  glyph.maxLength = 6;
  const bg = document.createElement('input');
  bg.type = 'color';
  bg.value = '#141414';
  bg.setAttribute('aria-label', 'Warna background');
  bg.style.cssText = 'width:100%;height:46px;border:1px solid var(--line);border-radius:10px;background:none;padding:4px;cursor:pointer';

  const box = T.out();

  function contrast(hex) {
    const n = parseInt(String(hex).slice(1), 16) || 0;
    const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return lum > 0.55 ? '#111111' : '#ffffff';
  }

  function draw(size) {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const x = c.getContext('2d');
    if (!x) return null; // browser tanpa dukungan canvas
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

  const build = () => {
    const pairs = [
      ['Favicon 64px', 64, 'favicon-64.png'],
      ['Apple Touch 180px', 180, 'apple-touch-icon.png'],
    ];
    let canvasOk = false;
    T.show(box, '<p class="center">Kurang lebih begini tampilannya di tab browser & layar HP.</p>');
    const prev = T.el('<div class="center" style="display:flex;gap:20px;justify-content:center;align-items:flex-end;margin:8px 0 14px"></div>');
    const row = T.el('<div class="row" style="flex-wrap:wrap"></div>');
    pairs.forEach(([label, size, fname]) => {
      const cv = draw(size);
      if (!cv) return;
      canvasOk = true;
      const px = Math.min(size, 110);
      cv.style.cssText = 'width:' + px + 'px;height:' + px + 'px;border-radius:16px;border:1px solid var(--line)';
      const wrap = T.el('<div class="center"></div>');
      wrap.appendChild(cv);
      wrap.appendChild(T.el('<p class="hint">' + T.esc(label) + '</p>'));
      prev.appendChild(wrap);
      row.appendChild(T.btn('Unduh ' + size + 'px', () => {
        cv.toBlob((b) => {
          if (b) T.dl(fname, b, 'image/png');
          else T.toast('Gagal bikin gambar, coba lagi');
        }, 'image/png');
      }));
    });
    box.appendChild(prev);
    box.appendChild(row);
    if (!canvasOk) {
      T.toast('Browser kamu nggak dukung canvas — coba browser lain');
      box.appendChild(T.el('<p class="hint center">Preview & unduhan butuh dukungan canvas di browser.</p>'));
    }
    box.appendChild(T.el('<p class="hint center" style="margin-top:14px">Tempel snippet ini di dalam &lt;head&gt; website kamu:</p>'));
    const snippet =
      '<link rel="icon" type="image/png" sizes="64x64" href="favicon-64.png">\n' +
      '<link rel="apple-touch-icon" sizes="180x180" href="apple-touch-icon.png">';
    const pre = T.el('<pre class="monoall" style="white-space:pre-wrap;word-break:break-word;background:var(--line-soft);border:1px solid var(--line);border-radius:10px;padding:12px;font-size:12.5px;line-height:1.6;overflow-x:auto"></pre>');
    pre.textContent = snippet;
    box.appendChild(pre);
    box.appendChild(T.row(T.copyBtn(() => snippet, 'Salin snippet')));
  };

  root.appendChild(T.field('Emoji atau huruf', glyph, 'Satu emoji (🚀) atau 1-2 huruf inisial brand kamu.'));
  root.appendChild(T.field('Warna background', bg));
  root.appendChild(T.row(T.btn('Buat favicon', build, true)));
  root.appendChild(box);
  root.appendChild(T.el('<p class="hint center">Gambar dibuat langsung di perangkatmu — nggak ada yang diupload.</p>'));
}
