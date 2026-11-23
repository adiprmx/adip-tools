import { h as T, utils, imglyRemoval } from '../../core.js';

export const meta = {"id": "removebg", "name": "Remove BG", "cat": "gambar", "icon": "🪄", "desc": "Hapus background foto otomatis, 100% di perangkat. Bisa pecah jadi layer PNG per objek.", "keywords": "hapus background,remove bg,transparan,foto,produk,layer,cutout,alight,zip", "online": true};

const MAX_FILE = 12 * 1024 * 1024;
// F13 v6.21.0: proxy cors-anyway.huskymobile.com DICABUT (operator tidak
// teridentifikasi). Ambil gambar dari URL kini lewat rantai kanonis
// utils.fetchViaProxyChain (langsung → AllOrigins) di ambilGambarUrl.
// Jina TIDAK dipakai: ia mengembalikan teks/markdown, bukan biner gambar.

/** Validasi magic byte (tanpa DOM — bisa diuji). Return 'png'|'jpg'|'webp'|null. */
export function magicType(b) {
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4E && b[3] === 0x47) return 'png';
  if (b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF) return 'jpg';
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return 'webp';
  return null;
}
/** Chroma-key sederhana: flood-fill dari tepi memakai warna sampel tepi (tanpa DOM).
    Mengembalikan Uint8Array alpha baru. */
export function chromaKeyAlpha(data, w, h, tol) {
  const alpha = new Uint8Array(w * h).fill(255);
  // 8 titik sampel tepi
  const samples = [];
  const pts = [[0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1], [w >> 1, 0], [w >> 1, h - 1], [0, h >> 1], [w - 1, h >> 1]];
  for (const [x, y] of pts) {
    const i = (y * w + x) * 4;
    samples.push([data[i], data[i + 1], data[i + 2]]);
  }
  const near = (i) => {
    const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2];
    return samples.some(([sr, sg, sb]) => Math.abs(r - sr) + Math.abs(g - sg) + Math.abs(b - sb) <= tol);
  };
  const q = [];
  for (let x = 0; x < w; x++) { q.push(x); q.push((h - 1) * w + x); }
  for (let y = 0; y < h; y++) { q.push(y * w); q.push(y * w + w - 1); }
  const seen = new Uint8Array(w * h);
  while (q.length) {
    const p = q.pop();
    if (seen[p]) continue;
    seen[p] = 1;
    if (!near(p)) continue;
    alpha[p] = 0;
    const x = p % w, y = (p / w) | 0;
    if (x > 0) q.push(p - 1);
    if (x < w - 1) q.push(p + 1);
    if (y > 0) q.push(p - w);
    if (y < h - 1) q.push(p + w);
  }
  return alpha;
}
export function withTimeout(p, ms, msg) {
  return Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error(msg || 'timeout')), ms))]);
}

// Ambil gambar dari URL lewat rantai kanonis utils.fetchViaProxyChain
// (langsung → AllOrigins), lalu validasi magic byte. Return Blob atau null
// (null = semua jalur gagal atau yang kembali bukan gambar). Di-export agar
// bisa di-unit-test via node. Catatan F13: tidak seperti rantai lama yang
// memvalidasi tiap kandidat satu per satu, rantai kanonis mengembalikan
// respons ok pertama — bila respons ok itu ternyata bukan gambar (mis.
// halaman blokir hotlink berstatus 200), tidak ada percobaan kandidat
// berikutnya; pemanggil menampilkan pesan jujur + arahan upload manual.
export async function ambilGambarUrl(u) {
  try {
    const r = await utils.fetchViaProxyChain(u, {timeout: 25000});
    const b = await r.blob();
    const head = new Uint8Array(await b.slice(0, 12).arrayBuffer());
    if (magicType(head)) return b;
  } catch (e) { /* gagal — pemanggil menampilkan pesan jujur */ }
  return null;
}

// ---------- Pecah jadi layer per objek (dari Auto Cut) ----------

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
  if (!Number.isFinite(srcW) || !Number.isFinite(srcH) || srcW <= 0 || srcH <= 0) throw new Error('ukuran sumber tidak benar');
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

export function render(root) {
  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Hapus background foto secara otomatis — tanpa upload ke server, semua di HP-mu. Geser pembanding untuk melihat sebelum/sesudah, lalu unduh PNG/JPEG/WebP. Setelah jadi, fotonya juga bisa dipecah jadi layer PNG per objek.<br><span class="dim" style="font-size:12px">Engine: @imgly/background-removal 1.7.0 (AGPL-3.0). Bila AI gagal, tersedia cara lain di perangkatmu.</span></p>'));

  const tabs = T.el('<div style="display:flex;gap:6px;margin-bottom:10px"></div>');
  const tUp = T.btn('Upload', null); tUp.classList.add('primary');
  const tUrl = T.btn('Dari URL', null);
  tabs.appendChild(tUp); tabs.appendChild(tUrl);
  root.appendChild(tabs);

  const dz = T.el('<div class="drop" tabindex="0" role="button" style="border:1.5px dashed #ffffff30;border-radius:14px;padding:26px 14px;text-align:center;cursor:pointer;background:#14110d"><div style="font-weight:700">Ketuk / seret gambar ke sini</div><div class="dim" style="font-size:12px;margin-top:4px">JPG · PNG · WebP — maks 12 MB</div></div>');
  const fileInp = T.el('<input type="file" accept="image/jpeg,image/png,image/webp" hidden>');
  const urlWrap = T.el('<div hidden></div>');
  const urlInp = T.input('url', 'https://contoh.com/foto.jpg');
  urlWrap.appendChild(T.field('URL gambar', urlInp, 'Gambar diambil lewat layanan perantara publik agar bisa dibaca browser — jangan pakai URL berisi foto pribadi atau rahasia.'));
  urlWrap.appendChild(T.row(T.btn('Ambil gambar', () => fromUrl(), true)));
  root.appendChild(dz); root.appendChild(fileInp); root.appendChild(urlWrap);

  let mode = 'up';
  tUp.addEventListener('click', () => { mode = 'up'; tUp.classList.add('primary'); tUrl.classList.remove('primary'); dz.hidden = false; urlWrap.hidden = true; });
  tUrl.addEventListener('click', () => { mode = 'url'; tUrl.classList.add('primary'); tUp.classList.remove('primary'); dz.hidden = true; urlWrap.hidden = false; });
  dz.addEventListener('click', () => fileInp.click());
  dz.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') fileInp.click(); });
  dz.addEventListener('dragover', (e) => { e.preventDefault(); dz.style.borderColor = '#fff'; });
  dz.addEventListener('dragleave', () => { dz.style.borderColor = ''; });
  dz.addEventListener('drop', (e) => { e.preventDefault(); dz.style.borderColor = ''; if (e.dataTransfer.files[0]) process(e.dataTransfer.files[0], null); });
  fileInp.addEventListener('change', () => { if (fileInp.files[0]) process(fileInp.files[0], null); });

  const out = T.out();
  root.appendChild(out);
  const st = { origUrl: null, resultBlob: null, engine: '', iw: 0, ih: 0, fname: 'hasil' };

  async function fromUrl() {
    const u = urlInp.value.trim();
    if (!/^https?:\/\//i.test(u)) { T.show(out, '<span class="err">URL harus diawali http(s)://</span>'); return; }
    T.show(out, '<span class="dim">Mengambil gambar…</span>');
    const blob = await ambilGambarUrl(u);
    if (!blob) { T.show(out, '<span class="err">Gagal mengambil gambar dari URL itu — situsnya mungkin memblokir pengambilan dari luar, atau semua proxy sedang sibuk. Coba unduh gambarnya dulu lalu upload dari perangkat.</span>'); return; }
    st.fname = 'hasil-url';
    process(blob, URL.createObjectURL(blob));
  }

  async function process(fileOrBlob, objUrl) {
    if (fileOrBlob.size > MAX_FILE) { T.show(out, '<span class="err">File melebihi 12 MB.</span>'); return; }
    const head = new Uint8Array(await fileOrBlob.slice(0, 12).arrayBuffer());
    if (!magicType(head)) { T.show(out, '<span class="err">Format tidak dikenali (butuh JPG/PNG/WebP).</span>'); return; }
    if (fileOrBlob.name) st.fname = fileOrBlob.name.replace(/\.[^.]+$/, '') || 'hasil';
    T.show(out, '<span class="dim"><b>Tahap 1/3</b> Menyiapkan engine AI…</span>');
    try {
      const imgly = await imglyRemoval();
      T.show(out, '<span class="dim"><b>Tahap 2/3</b> Memproses dengan AI lokal…</span>');
      await new Promise((r) => setTimeout(r, 30));
      const out2 = await withTimeout(imgly.removeBackground(fileOrBlob, {
        publicPath: 'https://staticimgly.com/@imgly/background-removal-data/1.7.0/dist/',
        output: { format: 'image/png', quality: 1 },
      }), 75000, 'AI terlalu lama');
      st.resultBlob = out2; st.engine = 'AI lokal';
      T.show(out, '<span class="dim"><b>Tahap 3/3</b> Memvalidasi hasil…</span>');
      const hb = new Uint8Array(await out2.slice(0, 4).arrayBuffer());
      if (magicType(hb) !== 'png') throw new Error('hasil-tidak-valid');
      finish(objUrl || URL.createObjectURL(fileOrBlob));
    } catch (e) {
      // Fallback chroma-key lokal
      T.show(out, '<span class="dim">AI gagal memisahkan latar — mencoba cara lain…</span>');
      try {
        const im = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = objUrl || URL.createObjectURL(fileOrBlob); });
        const c = document.createElement('canvas');
        const maxSide = 1500;
        const s = Math.min(1, maxSide / Math.max(im.naturalWidth, im.naturalHeight));
        c.width = Math.round(im.naturalWidth * s); c.height = Math.round(im.naturalHeight * s);
        const ctx = c.getContext('2d');
        ctx.drawImage(im, 0, 0, c.width, c.height);
        const id = ctx.getImageData(0, 0, c.width, c.height);
        const al = chromaKeyAlpha(id.data, c.width, c.height, 58);
        for (let i = 0; i < al.length; i++) id.data[i * 4 + 3] = al[i];
        // tepi lembut: blur ringan pada alpha
        ctx.putImageData(id, 0, 0);
        st.resultBlob = await new Promise((res) => c.toBlob(res, 'image/png'));
        st.engine = 'Chroma-key (hemat)';
        finish(objUrl || URL.createObjectURL(fileOrBlob), true);
      } catch (e2) {
        T.show(out, '<span class="err">Semua metode gagal. Coba foto lain dengan background lebih polos.</span>');
      }
    }
  }

  async function finish(origUrl, lowPower) {
    const im = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = URL.createObjectURL(st.resultBlob); });
    st.iw = im.naturalWidth; st.ih = im.naturalHeight;
    const resUrl = URL.createObjectURL(st.resultBlob);

    const box = T.el('<div></div>');
    box.appendChild(T.el('<div style="font-weight:700;margin-bottom:8px">Selesai <span class="dim" style="font-weight:400">· ' + st.iw + '×' + st.ih + ' · engine: ' + T.esc(st.engine) + (lowPower ? ' · <span class="err">mode hemat memori aktif</span>' : '') + '</span></div>'));

    // Compare slider ASLI vs HASIL
    const cmp = T.el('<div style="position:relative;border:1px solid #2e2823;border-radius:12px;overflow:hidden;user-select:none;touch-action:none"></div>');
    const imgA = T.el('<img draggable="false" style="display:block;width:100%;height:auto" alt="asli">');
    const imgB = T.el('<img draggable="false" style="display:block;width:100%;height:auto;position:absolute;inset:0" alt="hasil">');
    imgA.src = origUrl; imgB.src = resUrl;
    const handle = T.el('<div style="position:absolute;top:0;bottom:0;width:2px;background:#fff;left:50%;box-shadow:0 0 8px #000"><div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);background:#fff;color:#000;border-radius:50%;width:30px;height:30px;display:flex;align-items:center;justify-content:center;font-size:14px">⇔</div></div>');
    cmp.appendChild(imgA); cmp.appendChild(imgB); cmp.appendChild(handle);
    let pos = 0.5;
    const paint = () => { imgB.style.clipPath = 'inset(0 0 0 ' + (pos * 100) + '%)'; handle.style.left = (pos * 100) + '%'; };
    paint();
    const lbl = T.el('<div style="display:flex;justify-content:space-between;font-size:11px;margin:4px 2px"><span class="dim">◀ ASLI</span><span class="dim">HASIL ▶</span></div>');
    let drag = false;
    const move = (e) => {
      const r = cmp.getBoundingClientRect();
      const x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
      pos = Math.min(1, Math.max(0, x / r.width));
      paint();
    };
    cmp.addEventListener('pointerdown', (e) => { drag = true; move(e); cmp.setPointerCapture(e.pointerId); });
    cmp.addEventListener('pointermove', (e) => { if (drag) move(e); });
    cmp.addEventListener('pointerup', () => { drag = false; });
    box.appendChild(cmp); box.appendChild(lbl);

    // Background preview
    const bgSel = T.select([['transparan', 'Transparan'], ['putih', 'Putih'], ['hitam', 'Hitam'], ['custom', 'Warna custom…']], 'transparan');
    const bgCol = T.el('<input type="color" value="#7c3aed" style="width:44px;height:34px;padding:2px;border:1px solid #ffffff25;border-radius:8px;background:none" hidden>');
    bgSel.addEventListener('change', () => { bgCol.hidden = bgSel.value !== 'custom'; });
    const bgRow = T.el('<div style="display:flex;gap:8px;align-items:center;margin-top:8px;font-size:13px"></div>');
    bgRow.appendChild(T.el('<span>Background hasil:</span>')); bgRow.appendChild(bgSel); bgRow.appendChild(bgCol);
    box.appendChild(bgRow);

    const dlRow = T.row(
      T.btn('PNG', () => download('png', bgSel.value, bgCol.value), true),
      T.btn('JPEG', () => download('jpeg', bgSel.value, bgCol.value)),
      T.btn('WebP', () => download('webp', bgSel.value, bgCol.value)),
      T.btn('Gambar lain', () => { T.hide(out); if (mode === 'up') fileInp.click(); })
    );
    box.appendChild(dlRow);

    // ---- Pecah jadi layer per objek (mode lanjutan, dari Auto Cut) ----
    const lay = { layers: [], srcW: 0, srcH: 0, fgCanvas: null };
    const minLbl = T.el('<span class="dim" style="font-size:12px">0.15%</span>');
    const minRange = T.el('<input type="range" min="0.05" max="3" step="0.05" value="0.15" style="width:100%;accent-color:#fff">');
    minRange.addEventListener('input', () => { minLbl.textContent = Number(minRange.value).toFixed(2) + '%'; });
    const layWrap = T.el('<div style="margin-top:14px;border-top:1px solid #ffffff14;padding-top:12px"></div>');
    layWrap.appendChild(T.el('<div style="font-weight:700;margin-bottom:4px">Pecah jadi layer per objek</div>'));
    layWrap.appendChild(T.el('<p class="dim" style="font-size:12px;margin:0 0 8px">Tiap objek yang terpisah jadi layer PNG sendiri — praktis buat diedit satu-satu atau dipakai di Alight Motion.</p>'));
    const minWrap = T.el('<label style="font-size:13px;font-weight:600;display:block;margin-bottom:4px">Ukuran minimum cut <span class="dim" style="font-weight:400">(objek lebih kecil dari ini dibuang)</span> — </label>');
    minWrap.appendChild(minLbl);
    layWrap.appendChild(minWrap);
    layWrap.appendChild(minRange);
    layWrap.appendChild(T.row(T.btn('Pecah jadi layer', () => pecahLayer(), true)));
    box.appendChild(layWrap);

    async function pecahLayer() {
      T.show(out, '<span class="dim">Memecah jadi layer…</span>');
      await new Promise((r) => setTimeout(r, 30));
      try {
        const im = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = URL.createObjectURL(st.resultBlob); });
        const c = document.createElement('canvas');
        c.width = im.naturalWidth; c.height = im.naturalHeight;
        c.getContext('2d').drawImage(im, 0, 0);
        lay.fgCanvas = c; lay.srcW = c.width; lay.srcH = c.height;
        const data = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
        const alpha = new Uint8Array(c.width * c.height);
        for (let i = 0; i < alpha.length; i++) alpha[i] = data[i * 4 + 3];
        const comps = filterMinCut(connectedComponents(alpha, c.width, c.height, ALPHA_FLOOR), c.width, c.height, Number(minRange.value)).slice(0, MAX_CUTS);
        lay.layers = comps.map((cc, i) => ({ ...cc, name: 'layer-' + (i + 1) }));
        gambarLayer();
      } catch (e) {
        T.show(out, '<span class="err">Layer tidak bisa dipecah. Coba lagi.</span>');
      }
    }

    function layerPng(layer) {
      const { x0, y0, x1, y1 } = layer;
      const w = x1 - x0 + 1, h = y1 - y0 + 1;
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      c.getContext('2d').drawImage(lay.fgCanvas, x0, y0, w, h, 0, 0, w, h);
      return new Promise((res) => c.toBlob(res, 'image/png'));
    }

    function manifestXml() {
      const rows = lay.layers.map((l, i) =>
        '  <layer index="' + i + '" name="' + T.esc(l.name) + '" x="' + l.x0 + '" y="' + l.y0 +
        '" width="' + (l.x1 - l.x0 + 1) + '" height="' + (l.y1 - l.y0 + 1) + '" pixels="' + l.n + '" file="' + T.esc(l.name) + '.png"/>'
      ).join('\n');
      return '<?xml version="1.0" encoding="UTF-8"?>\n<autocut source="' + T.esc(st.fname) + '" width="' + lay.srcW + '" height="' + lay.srcH + '" layers="' + lay.layers.length + '">\n' + rows + '\n</autocut>';
    }

    async function layerEntries() {
      const entries = [];
      for (const l of lay.layers) {
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

    function gambarLayer() {
      const lbox = T.el('<div></div>');
      lbox.appendChild(T.el('<div style="font-weight:700;margin-bottom:4px">✅ ' + lay.layers.length + ' layer terdeteksi <span class="dim" style="font-weight:400">(' + lay.srcW + '×' + lay.srcH + ')</span></div>'));
      const pv = T.el('<canvas width="360" height="360" style="width:100%;max-width:360px;border:1px solid #2e2823;border-radius:12px;background:repeating-conic-gradient(#2a251f 0% 25%, #1a1611 0% 50%) 0 0/22px 22px"></canvas>');
      const pctx = pv.getContext('2d');
      const sc = Math.min(360 / lay.srcW, 360 / lay.srcH);
      const ox = (360 - lay.srcW * sc) / 2, oy = (360 - lay.srcH * sc) / 2;
      pctx.drawImage(lay.fgCanvas, ox, oy, lay.srcW * sc, lay.srcH * sc);
      pctx.strokeStyle = '#a855f7'; pctx.lineWidth = 1.5;
      lay.layers.forEach((l) => pctx.strokeRect(ox + l.x0 * sc, oy + l.y0 * sc, (l.x1 - l.x0 + 1) * sc, (l.y1 - l.y0 + 1) * sc));
      lbox.appendChild(pv);

      const grid = T.el('<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;margin:12px 0"></div>');
      lay.layers.forEach((l, i) => {
        const card = T.el('<div style="border:1px solid #2e2823;border-radius:10px;overflow:hidden;background:#14110d"></div>');
        const tc = document.createElement('canvas');
        const w = l.x1 - l.x0 + 1, h = l.y1 - l.y0 + 1;
        const s2 = Math.min(1, 140 / Math.max(w, h));
        tc.width = Math.max(1, Math.round(w * s2)); tc.height = Math.max(1, Math.round(h * s2));
        tc.getContext('2d').drawImage(lay.fgCanvas, l.x0, l.y0, w, h, 0, 0, tc.width, tc.height);
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
      lbox.appendChild(grid);

      lbox.appendChild(T.row(
        T.btn('⬇ Unduh ZIP semua layer', async () => {
          T.toast('Menyiapkan ZIP…');
          try {
            const entries = await layerEntries();
            const te = new TextEncoder();
            const zname = safeName(st.fname, 'cut');
            const files = [];
            for (const e of entries) files.push({ name: e.name + '.png', data: new Uint8Array(await e.blob.arrayBuffer()) });
            files.push({ name: 'manifest.xml', data: te.encode(manifestXml()) });
            files.push({ name: zname + '-alight.xml', data: te.encode(alightXml(lay.srcW, lay.srcH, entries)) });
            T.dl(zname + '-autocut.zip', new Blob([buildZip(files)], { type: 'application/zip' }), 'application/zip');
          } catch (e) { T.toast('ZIP tidak bisa dibuat. Coba lagi.'); }
        }, true),
        T.btn('⬇ Manifest XML', () => T.dl(safeName(st.fname, 'cut') + '-manifest.xml', manifestXml(), 'application/xml')),
        T.btn('🎬 XML Alight Motion', async () => {
          T.toast('Menyiapkan XML Alight Motion…');
          try {
            const entries = await layerEntries();
            T.dl(safeName(st.fname, 'cut') + '-alight.xml', alightXml(lay.srcW, lay.srcH, entries), 'text/xml');
          } catch (e) { T.toast('XML tidak bisa dibuat. Coba lagi.'); }
        }),
        T.btn('← Kembali ke hasil', () => finish(origUrl, lowPower))
      ));
      lbox.appendChild(T.el('<p class="dim" style="font-size:12px;margin-top:8px">Manifest XML berisi daftar layer + posisi (format sederhana buatan tool ini). <b>XML Alight Motion</b> berisi scene 1080×1920 dengan satu group berisi shape media per layer — impor ke Alight Motion lalu tautkan file PNG layer-nya.</p>'));
      T.show(out, ''); out.innerHTML = ''; out.appendChild(lbox);
      T.scrollToPreview(out);
    }

    T.show(out, ''); out.innerHTML = ''; out.appendChild(box);
    T.scrollToPreview(out);

    async function download(fmt, bg, custom) {
      T.toast('Menyiapkan ' + fmt.toUpperCase() + '…');
      const im2 = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = resUrl; });
      const c = document.createElement('canvas');
      c.width = im2.naturalWidth; c.height = im2.naturalHeight;
      const ctx = c.getContext('2d');
      const fill = fmt === 'jpeg' ? '#ffffff'
        : bg === 'putih' ? '#ffffff'
        : bg === 'hitam' ? '#000000'
        : bg === 'custom' ? custom : null;
      if (fill) { ctx.fillStyle = fill; ctx.fillRect(0, 0, c.width, c.height); }
      ctx.drawImage(im2, 0, 0);
      const mime = fmt === 'png' ? 'image/png' : fmt === 'jpeg' ? 'image/jpeg' : 'image/webp';
      const blob = await new Promise((res) => c.toBlob(res, mime, 0.92));
      if (!blob) { T.toast('Gagal membuat file'); return; }
      const hb = new Uint8Array(await blob.slice(0, 12).arrayBuffer());
      if (!magicType(hb)) { T.toast('Hasil tidak valid, coba lagi'); return; }
      T.dl(st.fname + '-nobg.' + (fmt === 'jpeg' ? 'jpg' : fmt), blob, mime);
    }
  }
}
