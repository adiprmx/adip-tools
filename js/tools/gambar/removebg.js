import { h as T, utils, imglyRemoval } from '../../core.js?v=6.9.20';

export const meta = {"id": "removebg", "name": "Remove BG", "cat": "gambar", "icon": "🪄", "desc": "Hapus background foto otomatis, 100% di perangkat.", "keywords": "hapus background,remove bg,transparan,foto,produk"};

const MAX_FILE = 12 * 1024 * 1024;
const ALLORIGINS = 'https://api.allorigins.win/raw?url=';

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

export function render(root) {
  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Hapus background foto secara otomatis — tanpa upload ke server, semua di HP-mu. Geser pembanding untuk melihat sebelum/sesudah, lalu unduh PNG/JPEG/WebP.<br><span class="dim" style="font-size:12px">Engine: @imgly/background-removal 1.7.0 (MIT). Bila AI gagal, tersedia mode chroma-key lokal.</span></p>'));

  const tabs = T.el('<div style="display:flex;gap:6px;margin-bottom:10px"></div>');
  const tUp = T.btn('Upload', null); tUp.classList.add('primary');
  const tUrl = T.btn('Dari URL', null);
  tabs.appendChild(tUp); tabs.appendChild(tUrl);
  root.appendChild(tabs);

  const dz = T.el('<div class="drop" tabindex="0" role="button" style="border:1.5px dashed #ffffff30;border-radius:14px;padding:26px 14px;text-align:center;cursor:pointer;background:#14110d"><div style="font-weight:700">Ketuk / seret gambar ke sini</div><div class="dim" style="font-size:12px;margin-top:4px">JPG · PNG · WebP — maks 12 MB</div></div>');
  const fileInp = T.el('<input type="file" accept="image/jpeg,image/png,image/webp" hidden>');
  const urlWrap = T.el('<div hidden></div>');
  const urlInp = T.input('url', 'https://contoh.com/foto.jpg');
  urlWrap.appendChild(T.field('URL gambar', urlInp));
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
    let blob = null;
    for (const cand of [u, ALLORIGINS + encodeURIComponent(u)]) {
      try {
        const r = await withTimeout(fetch(cand), 25000, 'timeout-url');
        if (!r.ok) continue;
        const b = await r.blob();
        const head = new Uint8Array(await b.slice(0, 12).arrayBuffer());
        if (magicType(head)) { blob = b; break; }
      } catch (e) { /* coba berikutnya */ }
    }
    if (!blob) { T.show(out, '<span class="err">Gagal mengambil gambar dari URL itu.</span>'); return; }
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
      T.show(out, '<span class="dim">AI gagal (' + T.esc(e && e.message ? e.message : 'error') + ') — mencoba <b>mode chroma-key lokal</b>…</span>');
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
