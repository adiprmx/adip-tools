import { h as T, utils } from '../../core.js?v=6.9.20';

export const meta = {"id": "imagevectorizer", "name": "Auto Trace", "cat": "gambar", "icon": "✒️", "desc": "Ubah foto/logo jadi vektor SVG, 100% di perangkat (potrace).", "keywords": "vektor,trace,svg,potrace,logo,outline"};

// Pustaka tracing publik independen (algoritma potrace): esm.sh bundle.
const POTRACE_ESM = 'https://esm.sh/@cadit-app/potrace-ts@1.3.0';
const MAX_SIDE = 1400;      // batas sisi terpanjang sebelum trace (hemat memori)
const MAX_FILE = 12 * 1024 * 1024;
const OK_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

/** Sanitasi SVG hasil trace: hanya tag & atribut aman (tanpa DOM). */
export function sanitizeSvg(svg) {
  let s = String(svg || '');
  s = s.replace(/<\?[\s\S]*?\?>/g, '');                 // prolog XML
  s = s.replace(/<!--[\s\S]*?-->/g, '');                // komentar
  // buang total beserta isinya: script/style/foreignObject/dll
  s = s.replace(/<(script|style|foreignObject|iframe|object|embed|a|text|image|use|defs|title|desc|metadata)(\s[^>]*)?>[\s\S]*?<\/\1\s*>/gi, '');
  s = s.replace(/<(script|style|foreignObject|iframe|object|embed)(\s[^>]*)?\/>/gi, '');
  // hanya tag svg/g/path yang boleh hidup (termasuk closing tag-nya)
  s = s.replace(/<\/?(?!svg\b|g\b|path\b)[a-zA-Z][^>]*>/g, '');
  // buang event handler & javascript:
  s = s.replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
  s = s.replace(/javascript:/gi, '');
  return s;
}
export function svgSizeLabel(svg) {
  const n = new Blob([svg]).size;
  return n < 1024 ? n + ' B' : (n / 1024).toFixed(1) + ' KB';
}

function readFileAsDataUrl(file) {
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(fr.result);
    fr.onerror = () => rej(new Error('gagal-baca'));
    fr.readAsDataURL(file);
  });
}
function loadImage(src) {
  return new Promise((res, rej) => {
    const im = new Image();
    im.onload = () => res(im);
    im.onerror = () => rej(new Error('gagal-gambar'));
    im.src = src;
  });
}
function downscaleDataUrl(dataUrl, maxSide) {
  return loadImage(dataUrl).then((im) => {
    const sc = Math.min(1, maxSide / Math.max(im.naturalWidth, im.naturalHeight));
    const w = Math.max(1, Math.round(im.naturalWidth * sc));
    const h = Math.max(1, Math.round(im.naturalHeight * sc));
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    c.getContext('2d').drawImage(im, 0, 0, w, h);
    return { dataUrl: c.toDataURL('image/png'), w, h };
  });
}

export function render(root) {
  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Trace PNG/JPG/WebP jadi <b>SVG vektor</b> (mode hitam-putih) — cocok untuk logo, stempel, dan sketsa. Semua diproses di HP-mu, tidak ada yang di-upload.<br><span class="dim" style="font-size:12px">Engine: algoritma potrace via pustaka publik (browser ESM).</span></p>'));

  const dz = T.el('<div class="drop" tabindex="0" role="button" style="border:1.5px dashed #ffffff30;border-radius:14px;padding:26px 14px;text-align:center;cursor:pointer;background:#14110d"><div style="font-size:30px">🖼️</div><div style="margin-top:6px;font-weight:700">Ketuk / seret gambar ke sini</div><div class="dim" style="font-size:12px;margin-top:4px">PNG · JPG · WebP — maks 12 MB</div></div>');
  const fileInp = T.el('<input type="file" accept="image/png,image/jpeg,image/webp" hidden>');
  dz.addEventListener('click', () => fileInp.click());
  dz.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') fileInp.click(); });
  dz.addEventListener('dragover', (e) => { e.preventDefault(); dz.style.borderColor = '#fff'; });
  dz.addEventListener('dragleave', () => { dz.style.borderColor = ''; });
  dz.addEventListener('drop', (e) => { e.preventDefault(); dz.style.borderColor = ''; if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); });
  root.appendChild(dz);
  root.appendChild(fileInp);
  fileInp.addEventListener('change', () => { if (fileInp.files[0]) handleFile(fileInp.files[0]); });

  const thrSel = T.select([['auto', 'Otomatis (disarankan)'], ['64', '64 — terang'], ['128', '128 — seimbang'], ['192', '192 — gelap']], 'auto');
  const detSel = T.select([['2', 'Halus (turdsize 2)'], ['10', 'Sedang (turdsize 10)'], ['40', 'Kasar (turdsize 40)']], '2');
  const invSel = T.select([['auto', 'Otomatis'], ['false', 'Jangan balik'], ['true', 'Balik (negatif)']], 'auto');
  const colInp = T.input('color', '', '#1a1a1a'); colInp.style.cssText = 'width:44px;height:34px;padding:2px;border:1px solid #ffffff25;border-radius:8px;background:none';
  root.appendChild(T.grid2(T.field('Threshold', thrSel), T.field('Detail', detSel)));
  root.appendChild(T.grid2(T.field('Invert', invSel), T.field('Warna garis', colInp)));

  const out = T.out();
  root.appendChild(out);

  let cur = null; // {svg, w, h, name}

  async function handleFile(file) {
    if (!OK_TYPES.includes(file.type) && !/\.(png|jpe?g|webp)$/i.test(file.name)) {
      T.show(out, '<span class="err">Gunakan PNG, JPG, atau WEBP.</span>'); return;
    }
    if (file.size > MAX_FILE) { T.show(out, '<span class="err">File melebihi 12 MB.</span>'); return; }
    T.show(out, '<span class="dim">⏳ Memuat engine trace…</span>');
    let lib;
    try { lib = await import(/* @vite-ignore */ POTRACE_ESM); }
    catch (e) { T.show(out, '<span class="err">Gagal memuat engine trace. Cek koneksi lalu coba lagi.</span>'); return; }
    T.show(out, '<span class="dim">⏳ Menyiapkan gambar…</span>');
    try {
      const raw = await readFileAsDataUrl(file);
      const { dataUrl, w, h } = await downscaleDataUrl(raw, MAX_SIDE);
      T.show(out, '<span class="dim">⏳ Tracing ' + w + '×' + h + ' px… (bisa beberapa detik)</span>');
      const thr = thrSel.value === 'auto' ? (lib.THRESHOLD_AUTO != null ? lib.THRESHOLD_AUTO : -1) : Number(thrSel.value);
      const inv = invSel.value === 'auto' ? 'auto' : invSel.value === 'true';
      // beri napas ke UI sebelum komputasi berat
      await new Promise((r) => setTimeout(r, 30));
      const paths = lib.traceDataUrl(dataUrl, {
        threshold: thr, invert: inv,
        turnpolicy: 'minority',
        turdsize: Number(detSel.value),
        optcurve: true, alphamax: 1, opttolerance: 0.2,
      });
      let svg = lib.getSVG(paths, 1);
      svg = sanitizeSvg(svg);
      if (!/^<svg[\s>]/.test(svg.trim())) throw new Error('svg-invalid');
      cur = { svg, w, h, name: (file.name.replace(/\.[^.]+$/, '') || 'trace') + '.svg' };
      drawResult();
    } catch (e) {
      T.show(out, '<span class="err">Trace gagal (' + T.esc(e && e.message ? e.message : 'error') + '). Coba gambar lain atau turunkan detail.</span>');
    }
  }

  function drawResult() {
    const { svg, w, h, name } = cur;
    const fg = colInp.value || '#1a1a1a';
    // terapkan warna: bungkus path dalam <g fill>
    const colored = svg.replace(/(<svg[^>]*>)/, '$1<g fill="' + fg + '">') + '</g>';
    const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(colored);
    const box = T.el('<div></div>');
    const modes = T.el('<div style="display:flex;gap:6px;margin-bottom:8px;flex-wrap:wrap"></div>');
    let bgMode = 'checker';
    const prev = T.el('<div style="border:1px solid #2e2823;border-radius:12px;overflow:hidden;min-height:200px;display:flex;align-items:center;justify-content:center"></div>');
    const paintBg = () => {
      prev.style.background = bgMode === 'checker'
        ? 'repeating-conic-gradient(#2a251f 0% 25%, #1a1611 0% 50%) 0 0/22px 22px'
        : bgMode === 'dark' ? '#14110d' : '#f5f2ec';
    };
    paintBg();
    const img = T.el(`<img src="${url.replace(/"/g, '&quot;')}" style="width:100%;height:auto;display:block" alt="hasil trace">`);
    prev.appendChild(img);
    [['checker', '⬜ Kotak'], ['dark', '🌑 Gelap'], ['light', '🌕 Terang']].forEach(([v, l]) => {
      const b = T.btn(l, () => { bgMode = v; paintBg(); });
      if (v === bgMode) b.classList.add('primary');
      modes.appendChild(b);
    });
    box.appendChild(T.el('<div style="font-weight:700;margin-bottom:8px">✅ Trace selesai — ' + w + '×' + h + ' px → ' + T.esc(svgSizeLabel(colored)) + '</div>'));
    box.appendChild(modes);
    box.appendChild(prev);
    box.appendChild(T.el('<p class="dim" style="font-size:12px;margin:8px 0">SVG vektor: bisa diperbesar tanpa pecah. Cocok untuk logo satu warna & stempel.</p>'));
    const row = T.row(
      T.btn('⬇ Unduh SVG', () => T.dl(name, colored, 'image/svg+xml'), true),
      T.copyBtn(() => colored, 'Salin SVG'),
      T.btn('🔁 Gambar lain', () => { cur = null; T.hide(out); fileInp.click(); })
    );
    box.appendChild(row);
    T.show(out, '');
    out.innerHTML = '';
    out.appendChild(box);
    T.scrollToPreview(out);
  }

  T.onLeave(() => { cur = null; });
}
