import { h as T, utils, imglyRemoval } from '../../core.js?v=6.9.20';

export const meta = {"id": "nexoraautocut", "name": "Auto Cut", "cat": "gambar", "icon": "🧩", "desc": "Hapus background lalu pecah jadi layer PNG per objek.", "keywords": "cutout,layer,hapus background,autocut,alight,zip"};

const MAX_FILE = 12 * 1024 * 1024;
const JSZIP_CDN = 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js';

/** Label komponen terhubung pada mask biner (tanpa DOM — bisa diuji).
    alpha: Uint8Array, threshold: nilai alpha minimum dianggap foreground.
    Return: [{x0,y0,x1,y1,n}] (bbox + jumlah piksel). */
export function connectedComponents(alpha, w, h, threshold) {
  const seen = new Uint8Array(w * h);
  const comps = [];
  const stack = [];
  for (let i = 0; i < w * h; i++) {
    if (seen[i] || alpha[i] < threshold) continue;
    let x0 = w, y0 = h, x1 = -1, y1 = -1, n = 0;
    stack.push(i); seen[i] = 1;
    while (stack.length) {
      const p = stack.pop();
      const x = p % w, y = (p / w) | 0;
      n++;
      if (x < x0) x0 = x; if (x > x1) x1 = x;
      if (y < y0) y0 = y; if (y > y1) y1 = y;
      if (x > 0 && !seen[p - 1] && alpha[p - 1] >= threshold) { seen[p - 1] = 1; stack.push(p - 1); }
      if (x < w - 1 && !seen[p + 1] && alpha[p + 1] >= threshold) { seen[p + 1] = 1; stack.push(p + 1); }
      if (y > 0 && !seen[p - w] && alpha[p - w] >= threshold) { seen[p - w] = 1; stack.push(p - w); }
      if (y < h - 1 && !seen[p + w] && alpha[p + w] >= threshold) { seen[p + w] = 1; stack.push(p + w); }
    }
    comps.push({ x0, y0, x1, y1, n });
  }
  return comps.sort((a, b) => b.n - a.n);
}
/** Saring komponen di bawah ambang persen luas gambar (tanpa DOM). */
export function filterMinCut(comps, w, h, pct) {
  const min = (w * h * pct) / 100;
  return comps.filter((c) => c.n >= min);
}
export function magicOk(bytes) {
  if (bytes[0] === 0x89 && bytes[1] === 0x50) return 'png';
  if (bytes[0] === 0xFF && bytes[1] === 0xD8) return 'jpg';
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[6] === 0x57 && bytes[7] === 0x45) return 'webp';
  return null;
}

function blobToImage(blob) {
  return new Promise((res, rej) => {
    const im = new Image();
    im.onload = () => res(im);
    im.onerror = rej;
    im.src = URL.createObjectURL(blob);
  });
}

export function render(root) {
  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Upload foto karakter → AI hapus background-nya (100% di perangkat), lalu tiap objek yang terpisah otomatis jadi <b>layer PNG sendiri</b> — praktis buat diedit satu-satu. Hasil bisa diunduh satuan atau sekaligus sebagai ZIP.<br><span class="dim" style="font-size:12px">Engine: @imgly/background-removal 1.7.0 (MIT). Unduhan model pertama butuh internet.</span></p>'));

  const dz = T.el('<div class="drop" tabindex="0" role="button" style="border:1.5px dashed #ffffff30;border-radius:14px;padding:26px 14px;text-align:center;cursor:pointer;background:#14110d"><div style="font-size:30px">🧍</div><div style="margin-top:6px;font-weight:700">Ketuk / seret gambar karakter</div><div class="dim" style="font-size:12px;margin-top:4px">PNG · JPG · WebP — maks 12 MB</div></div>');
  const fileInp = T.el('<input type="file" accept="image/png,image/jpeg,image/webp" hidden>');
  dz.addEventListener('click', () => fileInp.click());
  dz.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') fileInp.click(); });
  dz.addEventListener('dragover', (e) => { e.preventDefault(); dz.style.borderColor = '#fff'; });
  dz.addEventListener('dragleave', () => { dz.style.borderColor = ''; });
  dz.addEventListener('drop', (e) => { e.preventDefault(); dz.style.borderColor = ''; if (e.dataTransfer.files[0]) start(e.dataTransfer.files[0]); });
  root.appendChild(dz); root.appendChild(fileInp);
  fileInp.addEventListener('change', () => { if (fileInp.files[0]) start(fileInp.files[0]); });

  const minLbl = T.el('<span class="dim" style="font-size:12px">0.15%</span>');
  const minRange = T.el('<input type="range" min="0.05" max="3" step="0.05" value="0.15" style="width:100%;accent-color:#fff">');
  minRange.addEventListener('input', () => { minLbl.textContent = Number(minRange.value).toFixed(2) + '%'; });
  const minField = T.el('<div style="margin-top:10px"></div>');
  const minWrap = T.el('<label style="font-size:13px;font-weight:600;display:block;margin-bottom:4px">Ukuran minimum cut <span class="dim" style="font-weight:400">(objek lebih kecil dari ini dibuang)</span> — </label>');
  minWrap.appendChild(minLbl);
  minField.appendChild(minWrap);
  minField.appendChild(minRange);
  root.appendChild(minField);

  const out = T.out();
  root.appendChild(out);
  const st = { layers: [], srcW: 0, srcH: 0, fgCanvas: null, fname: '' };

  async function start(file) {
    if (file.size > MAX_FILE) { T.show(out, '<span class="err">File melebihi 12 MB.</span>'); return; }
    const head = new Uint8Array(await file.slice(0, 8).arrayBuffer());
    if (!magicOk(head)) { T.show(out, '<span class="err">Gunakan PNG, JPG, atau WEBP.</span>'); return; }
    st.fname = (file.name.replace(/\.[^.]+$/, '') || 'cut');
    T.show(out, '<span class="dim">⏳ Memuat engine AI… (unduhan model pertama bisa agak lama)</span>');
    let imgly;
    try { imgly = await imglyRemoval(); }
    catch (e) { T.show(out, '<span class="err">Engine AI gagal dimuat. Cek koneksi lalu coba lagi.</span>'); return; }
    T.show(out, '<span class="dim">⏳ Menghapus background…</span>');
    await new Promise((r) => setTimeout(r, 30));
    try {
      const fgBlob = await imgly.removeBackground(file, {
        publicPath: 'https://staticimgly.com/@imgly/background-removal-data/1.7.0/dist/',
        output: { format: 'image/png', quality: 1 },
      });
      const im = await blobToImage(fgBlob);
      const c = document.createElement('canvas');
      c.width = im.naturalWidth; c.height = im.naturalHeight;
      c.getContext('2d').drawImage(im, 0, 0);
      st.fgCanvas = c; st.srcW = c.width; st.srcH = c.height;
      splitLayers();
    } catch (e) {
      T.show(out, '<span class="err">Auto Cut gagal: ' + T.esc(e && e.message ? e.message : 'error') + '</span>');
    }
  }

  function splitLayers() {
    const { width: w, height: h } = st.fgCanvas;
    const data = st.fgCanvas.getContext('2d').getImageData(0, 0, w, h).data;
    const alpha = new Uint8Array(w * h);
    for (let i = 0; i < alpha.length; i++) alpha[i] = data[i * 4 + 3];
    const comps = filterMinCut(connectedComponents(alpha, w, h, 10), w, h, Number(minRange.value));
    st.layers = comps.map((c, i) => ({ ...c, name: 'layer-' + (i + 1) }));
    drawResult();
  }

  function layerPng(layer) {
    const { x0, y0, x1, y1 } = layer;
    const w = x1 - x0 + 1, h = y1 - y0 + 1;
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    c.getContext('2d').drawImage(st.fgCanvas, x0, y0, w, h, 0, 0, w, h);
    return new Promise((res) => c.toBlob(res, 'image/png'));
  }

  function manifestXml() {
    const rows = st.layers.map((l, i) =>
      '  <layer index="' + i + '" name="' + T.esc(l.name) + '" x="' + l.x0 + '" y="' + l.y0 +
      '" width="' + (l.x1 - l.x0 + 1) + '" height="' + (l.y1 - l.y0 + 1) + '" pixels="' + l.n + '" file="' + T.esc(l.name) + '.png"/>'
    ).join('\n');
    return '<?xml version="1.0" encoding="UTF-8"?>\n<autocut source="' + T.esc(st.fname) + '" width="' + st.srcW + '" height="' + st.srcH + '" layers="' + st.layers.length + '">\n' + rows + '\n</autocut>';
  }

  /** XML project Alight Motion: tiap layer jadi shape media (format scene/shape). */
  async function alightXml() {
    const DUR = 3000;
    const ex = (s) => String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const blobs = [];
    for (const l of st.layers) blobs.push(await layerPng(l));
    const f6 = (n) => (+n).toFixed(6);
    const media = blobs.map((b, i) => {
      const l = st.layers[i], w = l.x1 - l.x0 + 1, h = l.y1 - l.y0 + 1;
      return '  <media uri="' + ex(l.name) + '.png" filename="' + ex(l.name) + '.png" title="' + ex(l.name) +
        '" type="image/png" size="' + b.size + '" orientation="0" infoUpdated="0" width="' + w + '" height="' + h + '" />';
    }).join('\n');
    const shapes = st.layers.map((l, i) => {
      const w = l.x1 - l.x0 + 1, h = l.y1 - l.y0 + 1;
      const cx = l.x0 + w / 2, cy = l.y0 + h / 2;
      return '  <shape id="' + (i + 1) + '" label="' + ex(l.name) + '" startTime="0" endTime="' + DUR +
        '" fillType="media" fillImage="' + ex(l.name) + '.png" mediaFillMode="fill" s=".rect">\n' +
        '    <transform>\n      <location value="' + f6(cx) + ',' + f6(cy) + ',0.000000" />\n    </transform>\n' +
        '    <property name="size" type="vec2" value="' + f6(w / 2) + ',' + f6(h / 2) + '" />\n  </shape>';
    }).join('\n');
    return {
      xml: '<?xml version=\'1.0\' encoding=\'UTF-8\' ?>\n' +
        '<scene title="' + ex(st.fname + ' Auto Cut') + '" width="' + st.srcW + '" height="' + st.srcH +
        '" exportWidth="' + st.srcW + '" exportHeight="' + st.srcH + '" bgcolor="#00000000" totalTime="' + DUR +
        '" fps="30" modifiedTime="' + Date.now() + '" amver="859" ffver="107" am="com.alightcreative.motion/6.2.53" amplatform="ios" precompose="dynamicResolution" retime="freeze">\n' +
        '  <bookmark t="0"/>\n' + media + '\n' + shapes + '\n</scene>\n', blobs
    };
  }

  function drawResult() {
    const box = T.el('<div></div>');
    box.appendChild(T.el('<div style="font-weight:700;margin-bottom:4px">✅ ' + st.layers.length + ' layer terdeteksi <span class="dim" style="font-weight:400">(' + st.srcW + '×' + st.srcH + ')</span></div>'));
    // preview 360x360 + bbox
    const pv = T.el('<canvas width="360" height="360" style="width:100%;max-width:360px;border:1px solid #2e2823;border-radius:12px;background:repeating-conic-gradient(#2a251f 0% 25%, #1a1611 0% 50%) 0 0/22px 22px"></canvas>');
    const pctx = pv.getContext('2d');
    const sc = Math.min(360 / st.srcW, 360 / st.srcH);
    const ox = (360 - st.srcW * sc) / 2, oy = (360 - st.srcH * sc) / 2;
    pctx.drawImage(st.fgCanvas, ox, oy, st.srcW * sc, st.srcH * sc);
    pctx.strokeStyle = '#a855f7'; pctx.lineWidth = 1.5;
    st.layers.forEach((l) => pctx.strokeRect(ox + l.x0 * sc, oy + l.y0 * sc, (l.x1 - l.x0 + 1) * sc, (l.y1 - l.y0 + 1) * sc));
    box.appendChild(pv);

    const grid = T.el('<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;margin:12px 0"></div>');
    st.layers.forEach((l, i) => {
      const card = T.el('<div style="border:1px solid #2e2823;border-radius:10px;overflow:hidden;background:#14110d"></div>');
      const tc = document.createElement('canvas');
      const w = l.x1 - l.x0 + 1, h = l.y1 - l.y0 + 1;
      const s2 = Math.min(1, 140 / Math.max(w, h));
      tc.width = Math.max(1, Math.round(w * s2)); tc.height = Math.max(1, Math.round(h * s2));
      tc.getContext('2d').drawImage(st.fgCanvas, l.x0, l.y0, w, h, 0, 0, tc.width, tc.height);
      tc.style.cssText = 'width:100%;display:block;background:repeating-conic-gradient(#2a251f 0% 25%, #1a1611 0% 50%) 0 0/18px 18px';
      card.appendChild(tc);
      const nm = T.input('text', 'nama layer', l.name);
      nm.style.cssText = 'width:100%;border:none;border-top:1px solid #2e2823;border-radius:0;font-size:12px';
      nm.addEventListener('input', () => { l.name = nm.value.replace(/[^\w\- ]+/g, '').slice(0, 40) || ('layer-' + (i + 1)); });
      card.appendChild(nm);
      const dl1 = T.btn('⬇ PNG', async () => {
        const b = await layerPng(l);
        T.dl(l.name + '.png', b, 'image/png');
      });
      dl1.style.cssText = 'width:100%;border:none;border-top:1px solid #2e2823;border-radius:0';
      card.appendChild(dl1);
      grid.appendChild(card);
    });
    box.appendChild(grid);

    box.appendChild(T.row(
      T.btn('⬇ Unduh ZIP semua layer', async () => {
        T.toast('Menyiapkan ZIP…');
        const ok = await T.loadScript(JSZIP_CDN);
        if (!ok || !window.JSZip) { T.toast('Gagal memuat pustaka ZIP'); return; }
        const zip = new window.JSZip();
        const alb = await alightXml().catch(() => null);
        for (let i = 0; i < st.layers.length; i++) {
          const l = st.layers[i];
          zip.file(l.name + '.png', alb ? alb.blobs[i] : await layerPng(l));
        }
        zip.file('manifest.xml', manifestXml());
        if (alb) zip.file(st.fname + '-alight.xml', alb.xml);
        const blob = await zip.generateAsync({ type: 'blob' });
        T.dl(st.fname + '-autocut.zip', blob, 'application/zip');
      }, true),
      T.btn('⬇ Manifest XML', () => T.dl(st.fname + '-manifest.xml', manifestXml(), 'application/xml')),
      T.btn('🎬 XML Alight Motion', async () => {
        T.toast('Menyiapkan XML Alight Motion…');
        try {
          const r = await alightXml();
          T.dl(st.fname + '-alight.xml', r.xml, 'text/xml');
        } catch (e) { T.toast('Gagal membuat XML: ' + (e && e.message ? e.message : 'error')); }
      }),
      T.btn('🔁 Gambar lain', () => { st.layers = []; T.hide(out); fileInp.click(); })
    ));
    box.appendChild(T.el('<p class="dim" style="font-size:12px;margin-top:8px">Manifest XML berisi daftar layer + posisi (format sederhana buatan tool ini). <b>XML Alight Motion</b> berisi scene dengan shape media per layer — impor ke Alight Motion lalu tautkan file PNG layer-nya.</p>'));
    T.show(out, ''); out.innerHTML = ''; out.appendChild(box);
    T.scrollToPreview(out);
  }

  T.onLeave(() => { st.layers = []; });
}
