import { h as T, utils } from '../../core.js?v=6.9.20';

export const meta = {"id": "smartcutout", "name": "Smart Cutout", "cat": "gambar", "icon": "✂️", "desc": "Ketuk objek di foto → AI pisahkan otomatis, 100% lokal.", "keywords": "cutout,segmentasi,potong,objek,transparan,mask"};

// Pustaka & model publik independen (Google MediaPipe, Apache 2.0).
const VISION_ESM = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs';
const WASM_BASE = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm';
const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/interactive_segmenter/magic_touch/float32/latest/magic_touch.tflite';
const MAX_FILE = 20 * 1024 * 1024;
const OK_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_POINTS = 8;

/** Hitung ukuran inferensi: ≤640px, atau ≤512px bila RAM ≤3GB (tanpa DOM). */
export function inferSize(nw, nh, deviceMemory) {
  const cap = (deviceMemory && deviceMemory <= 3) ? 512 : 640;
  const sc = Math.min(1, cap / Math.max(nw, nh));
  return { w: Math.max(1, Math.round(nw * sc)), h: Math.max(1, Math.round(nh * sc)) };
}
/** Batas resolusi output: 32 MP normal, 12 MP mode hemat (tanpa DOM). */
export function outCap(lowMem) { return lowMem ? 12e6 : 32e6; }

function readFileAsDataUrl(file) {
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(fr.result);
    fr.onerror = () => rej(new Error('baca'));
    fr.readAsDataURL(file);
  });
}

export function render(root) {
  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Ketuk objek di fotomu — AI segmentasi interaktif (model Magic Touch, Google) memisahkannya jadi PNG transparan. Semua jalan di HP-mu, foto tidak di-upload.<br><span class="dim" style="font-size:12px">Model 6,2 MB diunduh sekali saat pertama dipakai.</span></p>'));

  const dz = T.el('<div class="drop" tabindex="0" role="button" style="border:1.5px dashed #ffffff30;border-radius:14px;padding:26px 14px;text-align:center;cursor:pointer;background:#14110d"><div style="font-size:30px">📷</div><div style="margin-top:6px;font-weight:700">Ketuk / seret foto ke sini</div><div class="dim" style="font-size:12px;margin-top:4px">JPG · PNG · WebP — maks 20 MB</div></div>');
  const fileInp = T.el('<input type="file" accept="image/jpeg,image/png,image/webp" hidden>');
  dz.addEventListener('click', () => fileInp.click());
  dz.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') fileInp.click(); });
  dz.addEventListener('dragover', (e) => { e.preventDefault(); dz.style.borderColor = '#fff'; });
  dz.addEventListener('dragleave', () => { dz.style.borderColor = ''; });
  dz.addEventListener('drop', (e) => { e.preventDefault(); dz.style.borderColor = ''; if (e.dataTransfer.files[0]) openFile(e.dataTransfer.files[0]); });
  root.appendChild(dz); root.appendChild(fileInp);
  fileInp.addEventListener('change', () => { if (fileInp.files[0]) openFile(fileInp.files[0]); });

  const editor = T.el('<div style="margin-top:12px" hidden></div>');
  root.appendChild(editor);

  const st = { img: null, iw: 0, ih: 0, inferW: 0, inferH: 0, points: [], mask: null, maskW: 0, maskH: 0, zoom: 1, edge: 'soft', crop: true, seg: null, lib: null, busy: false, lowMem: (navigator.deviceMemory || 8) <= 3 };

  async function openFile(file) {
    if (!OK_TYPES.includes(file.type)) { T.toast('Format harus JPG/PNG/WebP'); return; }
    if (file.size > MAX_FILE) { T.toast('File melebihi 20 MB'); return; }
    try {
      const im = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = URL.createObjectURL(file); });
      Object.assign(st, { img: im, iw: im.naturalWidth, ih: im.naturalHeight, points: [], mask: null, zoom: 1 });
      const sz = inferSize(st.iw, st.ih, navigator.deviceMemory);
      st.inferW = sz.w; st.inferH = sz.h;
      editor.hidden = false;
      buildEditor();
      T.scrollToPreview(editor);
      ensureModel();
    } catch (e) { T.toast('Gagal membaca gambar'); }
  }

  async function ensureModel() {
    if (st.seg || st.busy) return;
    st.busy = true;
    setStatus('⏳ Mengunduh model AI (6,2 MB, sekali saja)…');
    try {
      const vision = await import(/* @vite-ignore */ VISION_ESM);
      const fileset = await vision.FilesetResolver.forVisionTasks(WASM_BASE);
      st.lib = vision;
      st.seg = await vision.InteractiveSegmenter.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: MODEL_URL, delegate: 'GPU' },
        outputCategoryMask: true,
        outputConfidenceMasks: true,
      });
      setStatus('✅ Model siap — ketuk objek yang mau dipotong.');
    } catch (e) {
      setStatus('<span class="err">Gagal memuat model (' + T.esc(e && e.message ? e.message : 'error') + '). Butuh WebAssembly + koneksi.</span>');
      st.busy = false;
    }
  }

  let statusEl, viewWrap, viewCanvas, overlay;
  function setStatus(html) { if (statusEl) statusEl.innerHTML = html; }

  function buildEditor() {
    editor.innerHTML = '';
    statusEl = T.el('<div class="dim" style="font-size:13px;margin-bottom:8px">Memuat…</div>');
    editor.appendChild(statusEl);

    const toolbar = T.el('<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px"></div>');
    let mode = 'add';
    const bAdd = T.btn('➕ Tambah', null); bAdd.classList.add('primary');
    const bDel = T.btn('➖ Hapus titik', null);
    bAdd.addEventListener('click', () => { mode = 'add'; bAdd.classList.add('primary'); bDel.classList.remove('primary'); });
    bDel.addEventListener('click', () => { mode = 'del'; bDel.classList.add('primary'); bAdd.classList.remove('primary'); });
    toolbar.appendChild(bAdd); toolbar.appendChild(bDel);
    toolbar.appendChild(T.btn('↩ Urungkan', () => { st.points.pop(); st.mask = null; drawView(); }));
    toolbar.appendChild(T.btn('🔄 Reset', () => { st.points = []; st.mask = null; drawView(); setStatus('Titik direset — ketuk objek lagi.'); }));
    toolbar.appendChild(T.btn('🔍−', () => { st.zoom = Math.max(1, st.zoom - 0.5); drawView(); }));
    toolbar.appendChild(T.btn('🔍+', () => { st.zoom = Math.min(4, st.zoom + 0.5); drawView(); }));
    editor.appendChild(toolbar);

    viewWrap = T.el('<div style="position:relative;overflow:auto;max-height:60vh;border:1px solid #2e2823;border-radius:12px;background:#0d0b09;touch-action:none;cursor:crosshair"></div>');
    viewCanvas = T.el('<canvas style="display:block;max-width:none"></canvas>');
    viewWrap.appendChild(viewCanvas);
    editor.appendChild(viewWrap);

    const optRow = T.el('<div style="display:flex;gap:14px;flex-wrap:wrap;margin-top:10px;font-size:13px"></div>');
    const edgeSel = T.select([['soft', 'Lembut (tepi halus)'], ['sharp', 'Tegas (tepi tajam)']], 'soft');
    edgeSel.addEventListener('change', () => { st.edge = edgeSel.value; });
    const cropChk = T.el('<input type="checkbox" checked style="width:18px;height:18px;accent-color:#fff">');
    cropChk.addEventListener('change', () => { st.crop = cropChk.checked; });
    const edgeLbl = T.el('<label style="display:flex;align-items:center;gap:6px">Tepi: </label>');
    edgeLbl.appendChild(edgeSel);
    optRow.appendChild(edgeLbl);
    const cropLbl = T.el('<label style="display:flex;align-items:center;gap:6px;cursor:pointer"></label>');
    cropLbl.appendChild(cropChk); cropLbl.appendChild(T.el('<span>Potong mengikuti objek (+3%)</span>'));
    optRow.appendChild(cropLbl);
    editor.appendChild(optRow);

    const out = T.out();
    editor.appendChild(T.row(
      T.btn('✂️ Potong objek', extract, true),
      T.btn('⬇ Unduh mask', () => { if (st.mask) T.dl('mask.png', maskToBlob(), 'image/png'); else T.toast('Belum ada mask — ketuk objek dulu'); })
    ));
    editor.appendChild(out);
    st.out = out;

    viewWrap.addEventListener('click', (e) => onTap(e, mode));
    viewWrap.addEventListener('wheel', (e) => {
      e.preventDefault();
      st.zoom = Math.min(4, Math.max(1, st.zoom + (e.deltaY < 0 ? 0.25 : -0.25)));
      drawView();
    }, { passive: false });

    drawView();
    if (st.seg) setStatus('✅ Model siap — ketuk objek yang mau dipotong.');
  }

  function drawView() {
    const scale = st.zoom * Math.min(1, 560 / Math.max(st.iw, st.ih));
    const dw = Math.round(st.iw * scale), dh = Math.round(st.ih * scale);
    viewCanvas.width = dw; viewCanvas.height = dh;
    viewCanvas.style.width = dw + 'px'; viewCanvas.style.height = dh + 'px';
    const ctx = viewCanvas.getContext('2d');
    ctx.drawImage(st.img, 0, 0, dw, dh);
    // overlay mask ungu
    if (st.mask) {
      const mc = document.createElement('canvas');
      mc.width = st.maskW; mc.height = st.maskH;
      const mctx = mc.getContext('2d');
      const id = mctx.createImageData(st.maskW, st.maskH);
      for (let i = 0; i < st.mask.length; i++) {
        id.data[i * 4] = 168; id.data[i * 4 + 1] = 85; id.data[i * 4 + 2] = 247;
        id.data[i * 4 + 3] = st.mask[i] ? 110 : 0;
      }
      mctx.putImageData(id, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(mc, 0, 0, dw, dh);
    }
    // titik
    st.points.forEach((p, i) => {
      const x = p.x * dw, y = p.y * dh;
      ctx.beginPath(); ctx.arc(x, y, 8, 0, 7);
      ctx.fillStyle = '#a855f7'; ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = '#fff'; ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(String(i + 1), x, y);
    });
  }

  async function onTap(e, mode) {
    if (!st.img) return;
    const r = viewCanvas.getBoundingClientRect();
    const wrapR = viewWrap.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    if (x < 0 || x > 1 || y < 0 || y > 1) return;
    if (mode === 'del') {
      // hapus titik terdekat
      let best = -1, bd = 1e9;
      st.points.forEach((p, i) => { const d = (p.x - x) ** 2 + (p.y - y) ** 2; if (d < bd) { bd = d; best = i; } });
      if (best >= 0 && bd < 0.01) { st.points.splice(best, 1); st.mask = null; drawView(); }
      return;
    }
    if (st.points.length >= MAX_POINTS) { T.toast('Maksimal ' + MAX_POINTS + ' titik'); return; }
    if (!st.seg) { T.toast('Model belum siap, tunggu sebentar'); return; }
    st.points.push({ x, y });
    drawView();
    await runSegment();
  }

  async function runSegment() {
    setStatus('⏳ Menganalisis… (' + st.points.length + '/' + MAX_POINTS + ' titik)');
    try {
      // gambar inferensi kecil
      const ic = document.createElement('canvas');
      ic.width = st.inferW; ic.height = st.inferH;
      ic.getContext('2d').drawImage(st.img, 0, 0, st.inferW, st.inferH);
      const roi = st.points.length === 1
        ? { keypoint: { x: st.points[0].x, y: st.points[0].y } }
        : { scribble: st.points.map((p) => ({ x: p.x, y: p.y })) };
      const res = st.seg.segment(ic, roi);
      const cm = res.categoryMask;
      const mw = cm.width, mh = cm.height;
      const raw = cm.getAsUint8Array();
      const conf = res.confidenceMasks && res.confidenceMasks[0] ? res.confidenceMasks[0].getAsFloat32Array() : null;
      const mask = new Uint8Array(mw * mh);
      let fg = 0, csum = 0;
      for (let i = 0; i < mask.length; i++) {
        const v = raw[i] > 0;
        mask[i] = v ? 255 : 0;
        if (v) { fg++; if (conf) csum += conf[i]; }
      }
      st.mask = mask; st.maskW = mw; st.maskH = mh;
      drawView();
      const cov = (fg / mask.length * 100).toFixed(1);
      const q = res.qualityScores && res.qualityScores[0] != null ? Math.round(res.qualityScores[0] * 100) : (conf && fg ? Math.round(csum / fg * 100) : null);
      setStatus('✅ Mask siap · ' + cov + '% area' + (q != null ? ' · confidence ' + q + '%' : '') + ' — tambah titik untuk memperhalus, atau tekan Potong.');
      if (!fg) setStatus('<span class="err">Tidak ada objek terdeteksi di titik itu — coba ketuk bagian lain.</span>');
    } catch (e) {
      setStatus('<span class="err">Segmentasi gagal: ' + T.esc(e && e.message ? e.message : 'error') + '</span>');
    }
  }

  function maskToBlob() {
    const c = document.createElement('canvas');
    c.width = st.maskW; c.height = st.maskH;
    const ctx = c.getContext('2d');
    const id = ctx.createImageData(st.maskW, st.maskH);
    for (let i = 0; i < st.mask.length; i++) {
      const v = st.mask[i] ? 255 : 0;
      id.data[i * 4] = id.data[i * 4 + 1] = id.data[i * 4 + 2] = v; id.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(id, 0, 0);
    return new Promise((res) => c.toBlob(res, 'image/png'));
  }

  async function extract() {
    if (!st.mask) { T.toast('Ketuk objek dulu biar ada mask-nya'); return; }
    T.show(st.out, '<span class="dim">⏳ Merender resolusi penuh…</span>');
    await new Promise((r) => setTimeout(r, 30));
    try {
      // mask diskala ke resolusi sumber
      let tw = st.iw, th = st.ih;
      const cap = outCap(st.lowMem);
      if (tw * th > cap) { const s = Math.sqrt(cap / (tw * th)); tw = Math.round(tw * s); th = Math.round(th * s); }
      const mc = document.createElement('canvas');
      mc.width = st.maskW; mc.height = st.maskH;
      const mctx = mc.getContext('2d');
      const id = mctx.createImageData(st.maskW, st.maskH);
      for (let i = 0; i < st.mask.length; i++) {
        id.data[i * 4] = id.data[i * 4 + 1] = id.data[i * 4 + 2] = 255;
        id.data[i * 4 + 3] = st.mask[i];
      }
      mctx.putImageData(id, 0, 0);
      // bbox untuk crop
      let minX = tw, minY = th, maxX = 0, maxY = 0;
      const sx = tw / st.maskW, sy = th / st.maskH;
      for (let yy = 0; yy < st.maskH; yy++) for (let xx = 0; xx < st.maskW; xx++) {
        if (st.mask[yy * st.maskW + xx]) {
          const px = xx * sx, py = yy * sy;
          if (px < minX) minX = px; if (py < minY) minY = py;
          if (px > maxX) maxX = px; if (py > maxY) maxY = py;
        }
      }
      const pad = st.crop ? 0.03 : 0;
      let ox = 0, oy = 0, ow = tw, oh = th;
      if (st.crop && maxX > minX) {
        const pw = (maxX - minX) * pad, ph = (maxY - minY) * pad;
        ox = Math.max(0, Math.floor(minX - pw)); oy = Math.max(0, Math.floor(minY - ph));
        ow = Math.min(tw - ox, Math.ceil(maxX + pw) - ox); oh = Math.min(th - oy, Math.ceil(maxY + ph) - oy);
      }
      const out = document.createElement('canvas');
      out.width = ow; out.height = oh;
      const octx = out.getContext('2d');
      octx.drawImage(st.img, ox, oy, ow, oh, 0, 0, ow, oh);
      // aplikasikan mask sebagai alpha
      octx.globalCompositeOperation = 'destination-in';
      if (st.edge === 'soft') { octx.filter = 'blur(1px)'; }
      octx.drawImage(mc, -ox * (st.maskW / tw), -oy * (st.maskH / th), tw * (st.maskW / tw), th * (st.maskH / th));
      octx.filter = 'none';
      octx.globalCompositeOperation = 'source-over';
      const blob = await new Promise((res) => out.toBlob(res, 'image/png'));
      T.hide(st.out);
      T.dl('cutout-' + ow + 'x' + oh + '.png', blob, 'image/png');
      T.toast('PNG transparan terunduh (' + ow + '×' + oh + ')');
    } catch (e) {
      T.show(st.out, '<span class="err">Render gagal: ' + T.esc(e && e.message ? e.message : 'error') + '</span>');
    }
  }

  T.onLeave(() => { try { st.seg && st.seg.close(); } catch (e) {} });
}
