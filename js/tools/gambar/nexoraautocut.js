import { h as T, utils, imglyRemoval } from '../../core.js?v=6.9.20';

export const meta = {"id": "nexoraautocut", "name": "Auto Cut", "cat": "gambar", "icon": "🧩", "desc": "Hapus background lalu pecah jadi layer PNG per objek.", "keywords": "cutout,layer,hapus background,autocut,alight,zip"};

const MAX_FILE = 12 * 1024 * 1024;

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
/** Saring komponen di bawah ambang persen luas gambar (min 8 px, tanpa DOM). */
export function filterMinCut(comps, w, h, pct) {
  const min = Math.max(8, (w * h * pct) / 100);
  return comps.filter((c) => c.n >= min);
}
/** Batas jumlah layer: tiru format asli (maks 48 cut terbesar). */
export const MAX_CUTS = 48;
/** Ambang alpha foreground ala format asli. */
export const ALPHA_FLOOR = 16;
export function magicOk(bytes) {
  if (bytes[0] === 0x89 && bytes[1] === 0x50) return 'png';
  if (bytes[0] === 0xFF && bytes[1] === 0xD8) return 'jpg';
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[6] === 0x57 && bytes[7] === 0x45) return 'webp';
  return null;
}
/** Escape XML lengkap (& < > " ') — tanpa DOM, bisa diuji. */
export function escapeXml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}
/** Nama file aman: karakter aneh jadi '-', pangkas '-' di ujung, maks 64 (tanpa DOM). */
export function safeName(value, fallback) {
  const name = String(value || fallback || 'cut').replace(/[^\w.-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 64);
  return name || 'cut';
}

let _crcTable = null;
function crcTable() {
  if (_crcTable) return _crcTable;
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c >>> 0;
  }
  return (_crcTable = t);
}
/** CRC-32 (IEEE) — tanpa DOM, bisa diuji. */
export function crc32(bytes) {
  const table = crcTable();
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < bytes.length; i++) crc = table[(crc ^ bytes[i]) & 255] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
}
function _le16(v) { return new Uint8Array([v & 255, (v >>> 8) & 255]); }
function _le32(v) { return new Uint8Array([v & 255, (v >>> 8) & 255, (v >>> 16) & 255, (v >>> 24) & 255]); }
function _concat(parts) {
  let size = 0;
  for (const p of parts) size += p.length;
  const out = new Uint8Array(size);
  let off = 0;
  for (const p of parts) { out.set(p, off); off += p.length; }
  return out;
}
/** Bangun arsip ZIP (metode store = tanpa kompresi) murni di JS — tanpa pustaka luar.
    files: [{name: string, data: Uint8Array}]. Tanpa DOM, bisa diuji. */
export function buildZip(files) {
  const enc = new TextEncoder();
  const locals = [], centrals = [];
  let offset = 0;
  for (const f of files) {
    const nameB = enc.encode(f.name);
    const data = f.data;
    const crc = crc32(data);
    const lh = _concat([
      _le32(0x04034b50), _le16(20), _le16(0x0800), _le16(0), _le16(0), _le16(0),
      _le32(crc), _le32(data.length), _le32(data.length), _le16(nameB.length), _le16(0),
    ]);
    locals.push(lh, nameB, data);
    centrals.push({ nameB, crc, size: data.length, offset });
    offset += lh.length + nameB.length + data.length;
  }
  const cdStart = offset;
  const cdParts = [];
  let cdSize = 0;
  for (const c of centrals) {
    const h = _concat([
      _le32(0x02014b50), _le16(20), _le16(20), _le16(0x0800), _le16(0), _le16(0), _le16(0),
      _le32(c.crc), _le32(c.size), _le32(c.size), _le16(c.nameB.length),
      _le16(0), _le16(0), _le16(0), _le16(0), _le32(0), _le32(c.offset),
    ]);
    cdParts.push(h, c.nameB);
    cdSize += h.length + c.nameB.length;
  }
  const cd = _concat(cdParts);
  const end = _concat([
    _le32(0x06054b50), _le16(0), _le16(0), _le16(centrals.length), _le16(centrals.length),
    _le32(cdSize), _le32(cdStart), _le16(0),
  ]);
  return _concat([...locals, cd, end]);
}

/** Geometri scene Alight Motion ala format asli (tanpa template):
    scene 1080x1920, 30 fps, durasi 2000 ms; gambar di-fit (contain) ke scene.
    Tanpa DOM, bisa diuji. */
export function alightScene(srcW, srcH) {
  const W = 1080, H = 1920, FPS = 30, DUR = 2000;
  let fitHW = W / 2, fitHH = fitHW * (srcH / srcW);
  if (fitHH * 2 > H) { fitHH = H / 2; fitHW = fitHH * (srcW / srcH); }
  return {
    W, H, FPS, DUR,
    scaleX: (fitHW * 2) / srcW, scaleY: (fitHH * 2) / srcH,
    locX: W / 2, locY: H / 2,
  };
}
/** XML project Alight Motion: scene 1080x1920 berisi SATU group, di dalamnya
    scene bersarang berisi satu shape media per layer (posisi dihitung dari
    bbox layer yang di-fit ke scene). Tanpa DOM, bisa diuji.
    layers: [{name, x0,y0,x1,y1, pngW, pngH, size}] (size = byte PNG). */
export function alightXml(srcW, srcH, layers, seed) {
  if (!Number.isFinite(srcW) || !Number.isFinite(srcH) || srcW <= 0 || srcH <= 0) throw new Error('dimensi sumber tidak valid');
  if (!layers || !layers.length) throw new Error('Tidak ada cut untuk diekspor.');
  const sc = alightScene(srcW, srcH);
  const f6 = (n) => (+n).toFixed(6);
  let idc = 0;
  const base = Math.max(1, Math.floor(Number(seed) || Date.now()) % 9000000000000);
  const nid = () => String(base + (++idc));
  const sceneAttrs = 'title="NEXORA Auto Cut" width="' + sc.W + '" height="' + sc.H +
    '" exportWidth="' + sc.W + '" exportHeight="' + sc.H + '" bgcolor="#00000000' +
    '" totalTime="' + sc.DUR + '" fps="' + sc.FPS + '" modifiedTime="0" retime="off" retimeAdaptFPS="false"';
  const innerAttrs = 'width="' + sc.W + '" height="' + sc.H +
    '" exportWidth="' + sc.W + '" exportHeight="' + sc.H + '" bgcolor="#00000000' +
    '" totalTime="' + sc.DUR + '" fps="' + sc.FPS + '" modifiedTime="0" retime="off" retimeAdaptFPS="false"';
  const media = layers.map((l) =>
    '<media uri="' + escapeXml(l.name) + '.png" filename="' + escapeXml(l.name) + '.png" title="' + escapeXml(l.name) +
    '" type="image/png" size="' + l.size + '" orientation="0" infoUpdated="0" width="' + l.pngW + '" height="' + l.pngH + '"/>'
  ).join('\n');
  const gid = nid();
  const shapes = layers.map((l) => {
    const w = l.x1 - l.x0 + 1, h = l.y1 - l.y0 + 1;
    const cx = l.x0 + w / 2, cy = l.y0 + h / 2;
    const amX = sc.locX + (cx - srcW / 2) * sc.scaleX;
    const amY = sc.locY + (cy - srcH / 2) * sc.scaleY;
    const halfW = (w * sc.scaleX) / 2, halfH = (h * sc.scaleY) / 2;
    return '<shape id="' + nid() + '" label="' + escapeXml(l.name) + '" startTime="0" endTime="' + sc.DUR +
      '" fillType="media" fillImage="' + escapeXml(l.name) + '.png" mediaFillMode="fill" s=".rect">\n' +
      '<transform>\n<location value="' + f6(amX) + ',' + f6(amY) + ',0.000000"/>\n</transform>\n' +
      '<property name="size" type="vec2" value="' + f6(halfW) + ',' + f6(halfH) + '"/>\n</shape>';
  }).join('\n');
  return '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<scene ' + sceneAttrs + '>\n' +
    '<bookmark t="0"/>\n' +
    media + '\n' +
    ' <group id="' + gid + '" label="NEXORA Auto Cut" startTime="0" endTime="' + sc.DUR + '">\n' +
    ' <transform>\n <location value="' + f6(sc.locX) + ',' + f6(sc.locY) + ',0.000000"/>\n </transform>\n' +
    ' <embedScene>\n' +
    ' <scene ' + innerAttrs + '>\n' +
    shapes + '\n' +
    ' </scene>\n' +
    ' </embedScene>\n' +
    ' </group>\n' +
    '</scene>\n';
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
    const comps = filterMinCut(connectedComponents(alpha, w, h, ALPHA_FLOOR), w, h, Number(minRange.value)).slice(0, MAX_CUTS);
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

  /** Kumpulkan entri layer + blob PNG untuk ekspor XML/ZIP. */
  async function layerEntries() {
    const entries = [];
    for (const l of st.layers) {
      const blob = await layerPng(l);
      entries.push({
        name: safeName(l.name, l.name),
        x0: l.x0, y0: l.y0, x1: l.x1, y1: l.y1,
        pngW: l.x1 - l.x0 + 1, pngH: l.y1 - l.y0 + 1,
        size: blob.size, blob,
      });
    }
    return entries;
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
      nm.addEventListener('input', () => { l.name = safeName(nm.value, 'layer-' + (i + 1)); });
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
        try {
          const entries = await layerEntries();
          const te = new TextEncoder();
          const zname = safeName(st.fname, 'cut');
          const files = [];
          for (const e of entries) files.push({ name: e.name + '.png', data: new Uint8Array(await e.blob.arrayBuffer()) });
          files.push({ name: 'manifest.xml', data: te.encode(manifestXml()) });
          files.push({ name: zname + '-alight.xml', data: te.encode(alightXml(st.srcW, st.srcH, entries)) });
          T.dl(zname + '-autocut.zip', new Blob([buildZip(files)], { type: 'application/zip' }), 'application/zip');
        } catch (e) { T.toast('Gagal membuat ZIP: ' + (e && e.message ? e.message : 'error')); }
      }, true),
      T.btn('⬇ Manifest XML', () => T.dl(safeName(st.fname, 'cut') + '-manifest.xml', manifestXml(), 'application/xml')),
      T.btn('🎬 XML Alight Motion', async () => {
        T.toast('Menyiapkan XML Alight Motion…');
        try {
          const entries = await layerEntries();
          T.dl(safeName(st.fname, 'cut') + '-alight.xml', alightXml(st.srcW, st.srcH, entries), 'text/xml');
        } catch (e) { T.toast('Gagal membuat XML: ' + (e && e.message ? e.message : 'error')); }
      }),
      T.btn('🔁 Gambar lain', () => { st.layers = []; T.hide(out); fileInp.click(); })
    ));
    box.appendChild(T.el('<p class="dim" style="font-size:12px;margin-top:8px">Manifest XML berisi daftar layer + posisi (format sederhana buatan tool ini). <b>XML Alight Motion</b> berisi scene 1080×1920 dengan satu group berisi shape media per layer — impor ke Alight Motion lalu tautkan file PNG layer-nya.</p>'));
    T.show(out, ''); out.innerHTML = ''; out.appendChild(box);
    T.scrollToPreview(out);
  }

  T.onLeave(() => { st.layers = []; });
}
