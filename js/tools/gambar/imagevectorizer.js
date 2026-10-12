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
/** Median-cut kuantisasi -> N warna dominan (tanpa DOM — bisa diuji).
    px: Uint8ClampedArray RGBA, n: jumlah pixel. Return ['#rrggbb', ...]. */
export function medianCut(px, n, count) {
  const pix = [];
  const step = Math.max(1, Math.floor(n / 20000));
  for (let i = 0; i < n; i += step) {
    const a = px[i * 4 + 3];
    if (a < 128) continue;
    pix.push([px[i * 4], px[i * 4 + 1], px[i * 4 + 2]]);
  }
  if (!pix.length) return ['#000000'];
  let boxes = [pix];
  while (boxes.length < count) {
    let bi = -1, br = -1;
    boxes.forEach((b, i) => {
      if (b.length < 2) return;
      let mn = [255, 255, 255], mx = [0, 0, 0];
      for (const p of b) for (let c = 0; c < 3; c++) {
        if (p[c] < mn[c]) mn[c] = p[c];
        if (p[c] > mx[c]) mx[c] = p[c];
      }
      const r = Math.max(mx[0] - mn[0], mx[1] - mn[1], mx[2] - mn[2]);
      if (r > br) { br = r; bi = i; }
    });
    if (bi < 0) break;
    const b = boxes[bi];
    let mn = [255, 255, 255], mx = [0, 0, 0];
    for (const p of b) for (let c = 0; c < 3; c++) {
      if (p[c] < mn[c]) mn[c] = p[c];
      if (p[c] > mx[c]) mx[c] = p[c];
    }
    const ch = (mx[0] - mn[0]) >= (mx[1] - mn[1]) && (mx[0] - mn[0]) >= (mx[2] - mn[2]) ? 0
      : (mx[1] - mn[1]) >= (mx[2] - mn[2]) ? 1 : 2;
    b.sort((a, b2) => a[ch] - b2[ch]);
    const mid = b.length >> 1;
    boxes.splice(bi, 1, b.slice(0, mid), b.slice(mid));
  }
  return boxes.map((b) => {
    const s = [0, 0, 0];
    for (const p of b) { s[0] += p[0]; s[1] += p[1]; s[2] += p[2]; }
    const k = Math.max(1, b.length);
    return '#' + s.map((v) => Math.round(v / k).toString(16).padStart(2, '0')).join('');
  }).map((hx) => [parseInt(hx.slice(1, 3), 16), parseInt(hx.slice(3, 5), 16), parseInt(hx.slice(5, 7), 16)]);
}
/** K-means++ seeding: pilih seed berjauhan secara probabilistik (tanpa DOM). */
export function kmeansPlusPlus(px, n, count, rand) {
  const pix = [];
  const step = Math.max(1, Math.floor(n / 20000));
  for (let i = 0; i < n; i += step) {
    if (px[i * 4 + 3] < 128) continue;
    pix.push([px[i * 4], px[i * 4 + 1], px[i * 4 + 2]]);
  }
  if (!pix.length) return [[0, 0, 0]];
  const R = rand || Math.random;
  const C = [pix[Math.floor(R() * pix.length)].slice()];
  while (C.length < Math.min(count, 12)) {
    let total = 0;
    const dists = new Array(pix.length);
    for (let i = 0; i < pix.length; i++) {
      const p = pix[i];
      let bd = Infinity;
      for (const c of C) {
        const d = (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2 + (p[2] - c[2]) ** 2;
        if (d < bd) bd = d;
      }
      dists[i] = bd; total += bd;
    }
    if (total <= 0) break;
    let r = R() * total, idx = 0;
    while (idx < pix.length - 1 && (r -= dists[idx]) > 0) idx++;
    const np = pix[idx].slice();
    if (C.some((c) => c[0] === np[0] && c[1] === np[1] && c[2] === np[2])) break;
    C.push(np);
  }
  return C;
}
/** Palet dominan: k-means++ seeding + refinement (tanpa DOM — bisa diuji). */
export function extractPalette(px, n, count, rand) {
  const seeds = kmeansPlusPlus(px, n, count, rand);
  return kmeansRefine(px, n, seeds, 12);
}
export function kmeansRefine(px, n, seeds, iters) {
  const pix = [];
  const step = Math.max(1, Math.floor(n / 20000));
  for (let i = 0; i < n; i += step) {
    if (px[i * 4 + 3] < 128) continue;
    pix.push([px[i * 4], px[i * 4 + 1], px[i * 4 + 2]]);
  }
  if (!pix.length) return seeds;
  const C = seeds.map((s) => s.slice());
  for (let it = 0; it < (iters || 10); it++) {
    const sums = C.map(() => [0, 0, 0, 0]);
    for (const p of pix) {
      let best = 0, bd = Infinity;
      for (let k = 0; k < C.length; k++) {
        const d = (p[0] - C[k][0]) ** 2 + (p[1] - C[k][1]) ** 2 + (p[2] - C[k][2]) ** 2;
        if (d < bd) { bd = d; best = k; }
      }
      sums[best][0] += p[0]; sums[best][1] += p[1]; sums[best][2] += p[2]; sums[best][3]++;
    }
    let moved = false;
    C.forEach((c, k) => {
      if (!sums[k][3]) return;
      const nc = [0, 1, 2].map((j) => Math.round(sums[k][j] / sums[k][3]));
      if (nc[0] !== c[0] || nc[1] !== c[1] || nc[2] !== c[2]) { moved = true; C[k] = nc; }
    });
    if (!moved) break;
  }
  const seen = new Set();
  return C.map((c) => '#' + c.map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join(''))
    .filter((hx) => { if (seen.has(hx)) return false; seen.add(hx); return true; });
}
/** Pecah <g> bertingkat jadi <path> top-level (butuh DOM). */
export function ungroupSvg(svg) {
  const doc = new DOMParser().parseFromString(String(svg), 'image/svg+xml');
  if (doc.querySelector('parsererror')) return svg;
  const out = [];
  const walk = (el, fill) => {
    const f = el.getAttribute && el.getAttribute('fill') || fill;
    for (const ch of el.children || []) {
      const tag = (ch.tagName || '').toLowerCase();
      if (tag === 'path') {
        const d = ch.getAttribute('d') || '';
        out.push('<path d="' + d.replace(/&/g, '&amp;').replace(/"/g, '&quot;') + '"' + (f ? ' fill="' + f.replace(/"/g, '&quot;') + '"' : '') + '/>');
      } else if (tag === 'g') walk(ch, f);
    }
  };
  walk(doc.documentElement, null);
  const se = doc.documentElement;
  const at = (n) => se.getAttribute(n);
  return '<svg xmlns="http://www.w3.org/2000/svg"' +
    (at('width') ? ' width="' + at('width') + '"' : '') +
    (at('height') ? ' height="' + at('height') + '"' : '') +
    (at('viewBox') ? ' viewBox="' + at('viewBox') + '"' : '') + '>' +
    out.join('') + '</svg>';
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
  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Trace PNG/JPG/WebP jadi <b>SVG vektor</b> — mode hitam-putih (logo, stempel, sketsa) atau mode <b>warna</b> (poster, ilustrasi). Semua diproses di HP-mu, tidak ada yang di-upload.<br><span class="dim" style="font-size:12px">Engine: algoritma potrace via pustaka publik (browser ESM).</span></p>'));

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

  const modeSel = T.select([['bw', 'Hitam-putih'], ['color', 'Warna']], 'bw');
  const thrSel = T.select([['auto', 'Otomatis (disarankan)'], ['64', '64 — terang'], ['128', '128 — seimbang'], ['192', '192 — gelap']], 'auto');
  const detSel = T.select([['2', 'Halus (turdsize 2)'], ['10', 'Sedang (turdsize 10)'], ['40', 'Kasar (turdsize 40)']], '2');
  const invSel = T.select([['auto', 'Otomatis'], ['false', 'Jangan balik'], ['true', 'Balik (negatif)']], 'auto');
  const ncolSel = T.select([['3', '3 warna'], ['4', '4 warna'], ['5', '5 warna'], ['6', '6 warna'], ['8', '8 warna']], '4');
  const colInp = T.input('color', '', '#1a1a1a'); colInp.style.cssText = 'width:44px;height:34px;padding:2px;border:1px solid #ffffff25;border-radius:8px;background:none';
  const bwOpts = T.el('<div></div>');
  bwOpts.appendChild(T.grid2(T.field('Threshold', thrSel), T.field('Detail', detSel)));
  bwOpts.appendChild(T.grid2(T.field('Invert', invSel), T.field('Warna garis', colInp)));
  const colorOpts = T.el('<div hidden></div>');
  colorOpts.appendChild(T.grid2(T.field('Jumlah warna', ncolSel), T.field('Detail', detSel.cloneNode(true))));
  const detSelColor = colorOpts.querySelectorAll('select')[1];
  root.appendChild(T.field('Mode trace', modeSel));
  root.appendChild(bwOpts);
  root.appendChild(colorOpts);
  modeSel.addEventListener('change', () => {
    const isColor = modeSel.value === 'color';
    bwOpts.hidden = isColor; colorOpts.hidden = !isColor;
  });

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
      const isColor = modeSel.value === 'color';
      const maxSide = isColor ? 800 : MAX_SIDE;
      const { dataUrl, w, h } = await downscaleDataUrl(raw, maxSide);
      const turd = Number(isColor ? detSelColor.value : detSel.value);
      T.show(out, '<span class="dim">⏳ Tracing ' + w + '×' + h + ' px… (bisa beberapa detik)</span>');
      // beri napas ke UI sebelum komputasi berat
      await new Promise((r) => setTimeout(r, 30));
      let svg;
      if (isColor) {
        svg = await traceColor(lib, dataUrl, w, h, Number(ncolSel.value), turd);
      } else {
        const thr = thrSel.value === 'auto' ? (lib.THRESHOLD_AUTO != null ? lib.THRESHOLD_AUTO : -1) : Number(thrSel.value);
        const inv = invSel.value === 'auto' ? 'auto' : invSel.value === 'true';
        const paths = lib.traceDataUrl(dataUrl, {
          threshold: thr, invert: inv,
          turnpolicy: 'minority',
          turdsize: turd,
          optcurve: true, alphamax: 1, opttolerance: 0.2,
        });
        svg = lib.getSVG(paths, 1);
      }
      svg = sanitizeSvg(svg);
      if (!/^<svg[\s>]/.test(svg.trim())) throw new Error('svg-invalid');
      cur = { svg, w, h, mode: isColor ? 'color' : 'bw', name: (file.name.replace(/\.[^.]+$/, '') || 'trace') + '.svg' };
      drawResult();
    } catch (e) {
      T.show(out, '<span class="err">Trace gagal (' + T.esc(e && e.message ? e.message : 'error') + '). Coba gambar lain atau turunkan detail.</span>');
    }
  }

  /** Trace warna: kuantisasi median-cut lalu potrace per lapisan warna. */
  async function traceColor(lib, dataUrl, w, h, nColors, turd) {
    const im = await loadImage(dataUrl);
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const cx = c.getContext('2d', { willReadFrequently: true });
    cx.drawImage(im, 0, 0, w, h);
    const id = cx.getImageData(0, 0, w, h);
    const palette = extractPalette(id.data, w * h, nColors);
    const prgb = palette.length ? palette.map((hx) => [parseInt(hx.slice(1, 3), 16), parseInt(hx.slice(3, 5), 16), parseInt(hx.slice(5, 7), 16)]) : [[0, 0, 0]];
    const hexes = palette.length ? palette : ['#000000'];
    const groups = [];
    for (let li = 0; li < palette.length; li++) {
      const mc = document.createElement('canvas'); mc.width = w; mc.height = h;
      const mx = mc.getContext('2d');
      const out = mx.createImageData(w, h);
      const [rr, gg, bb] = prgb[li];
      for (let i = 0; i < w * h; i++) {
        let best = 0, bd = 1e18;
        for (let k = 0; k < prgb.length; k++) {
          const dr = id.data[i * 4] - prgb[k][0], dg = id.data[i * 4 + 1] - prgb[k][1], db = id.data[i * 4 + 2] - prgb[k][2];
          const d = dr * dr + dg * dg + db * db;
          if (d < bd) { bd = d; best = k; }
        }
        const on = best === li;
        out.data[i * 4] = on ? 0 : 255; out.data[i * 4 + 1] = on ? 0 : 255; out.data[i * 4 + 2] = on ? 0 : 255;
        out.data[i * 4 + 3] = 255;
      }
      mx.putImageData(out, 0, 0);
      const paths = lib.traceDataUrl(mc.toDataURL('image/png'), {
        threshold: 128, invert: false, turnpolicy: 'minority',
        turdsize: turd, optcurve: true, alphamax: 1, opttolerance: 0.2,
      });
      const one = lib.getSVG(paths, 1);
      const ds = [...one.matchAll(/<path[^>]*\sd="([^"]+)"/g)].map((m) => m[1]);
      if (ds.length) groups.push({ color: hexes[li], ds });
    }
    if (!groups.length) throw new Error('svg-invalid');
    // latar: warna paling dominan sebagai rect dasar
    const vb = '0 0 ' + w + ' ' + h;
    let svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '" viewBox="' + vb + '">';
    groups.forEach((g) => {
      svg += '<g fill="' + g.color + '">';
      g.ds.forEach((d) => { svg += '<path d="' + d + '"/>'; });
      svg += '</g>';
    });
    return svg + '</svg>';
  }

  function drawResult() {
    const { svg, w, h, name, mode } = cur;
    const fg = colInp.value || '#1a1a1a';
    // mode bw: terapkan warna — bungkus path dalam <g fill>
    const colored = mode === 'color' ? svg : svg.replace(/(<svg[^>]*>)/, '$1<g fill="' + fg + '">') + '</g>';
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
    const paintPreview = (svgStr) => {
      const u = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgStr);
      prev.innerHTML = '<img src="' + u.replace(/"/g, '&quot;') + '" style="width:100%;height:auto;display:block" alt="hasil trace">';
      return svgStr;
    };
    let current = colored;
    paintPreview(current);
    [['checker', '⬜ Kotak'], ['dark', '🌑 Gelap'], ['light', '🌕 Terang']].forEach(([v, l]) => {
      const b = T.btn(l, () => { bgMode = v; paintBg(); });
      if (v === bgMode) b.classList.add('primary');
      modes.appendChild(b);
    });
    box.appendChild(T.el('<div style="font-weight:700;margin-bottom:8px">✅ Trace selesai — ' + w + '×' + h + ' px → ' + T.esc(svgSizeLabel(current)) + '</div>'));
    box.appendChild(modes);
    box.appendChild(prev);
    box.appendChild(T.el('<p class="dim" style="font-size:12px;margin:8px 0">SVG vektor: bisa diperbesar tanpa pecah.' + (mode === 'color' ? ' Mode warna: tiap warna jadi grup path sendiri.' : ' Cocok untuk logo satu warna & stempel.') + '</p>'));
    const row = T.row(
      T.btn('⬇ Unduh SVG', () => T.dl(name, current, 'image/svg+xml'), true),
      T.copyBtn(() => current, 'Salin SVG'),
      T.btn('🧩 Ungroup', () => {
        try {
          const flat = ungroupSvg(current);
          current = flat;
          paintPreview(flat);
          T.toast('Ungroup: grup dipecah jadi path satuan.');
        } catch (e) { T.toast('Ungroup gagal.'); }
      }),
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
