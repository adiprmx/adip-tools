import { h as T } from '../../core.js?v=6.9.20';

export const meta = {"id": "projection-mapping", "name": "Mockup Generator", "cat": "desain", "icon": "🧊", "desc": "Tempel gambarmu ke permukaan miring via warp perspektif.", "keywords": "mockup,warp,perspektif,mapping,desain"};

export const MESH = 24;

/** Titik pada patch Coons dari 7 node (tanpa DOM — bisa diuji).
    nodes: {tl,tr,br,bl,tm,bm,c} masing-masing {x,y} dalam ruang koordinat bebas. */
export function patchPoint(u, v, n) {
  const q = (a, m, b, t) => {
    const s = 1 - t;
    return { x: s * s * a.x + 2 * s * t * m.x + t * t * b.x, y: s * s * a.y + 2 * s * t * m.y + t * t * b.y };
  };
  const lerp = (a, b, t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
  const top = q(n.tl, n.tm, n.tr, u);
  const bot = q(n.bl, n.bm, n.br, u);
  const left = lerp(n.tl, n.bl, v);
  const right = lerp(n.tr, n.br, v);
  const c00 = { x: (1 - u) * (1 - v) * n.tl.x + u * (1 - v) * n.tr.x + (1 - u) * v * n.bl.x + u * v * n.br.x,
                y: (1 - u) * (1 - v) * n.tl.y + u * (1 - v) * n.tr.y + (1 - u) * v * n.bl.y + u * v * n.br.y };
  let x = (1 - v) * top.x + v * bot.x + (1 - u) * left.x + u * right.x - c00.x;
  let y = (1 - v) * top.y + v * bot.y + (1 - u) * left.y + u * right.y - c00.y;
  // pengaruh node tengah (jatuh halus ke tepi)
  const base = patchPointBase(0.5, 0.5, n, q, lerp);
  const dx = n.c.x - base.x, dy = n.c.y - base.y;
  const wgt = Math.sin(Math.PI * u) * Math.sin(Math.PI * v);
  return { x: x + dx * wgt, y: y + dy * wgt };
}
function patchPointBase(u, v, n, q, lerp) {
  const top = q(n.tl, n.tm, n.tr, u);
  const bot = q(n.bl, n.bm, n.br, u);
  const left = lerp(n.tl, n.bl, v);
  const right = lerp(n.tr, n.br, v);
  const c00x = (1 - u) * (1 - v) * n.tl.x + u * (1 - v) * n.tr.x + (1 - u) * v * n.bl.x + u * v * n.br.x;
  const c00y = (1 - u) * (1 - v) * n.tl.y + u * (1 - v) * n.tr.y + (1 - u) * v * n.bl.y + u * v * n.br.y;
  return {
    x: (1 - v) * top.x + v * bot.x + (1 - u) * left.x + u * right.x - c00x,
    y: (1 - v) * top.y + v * bot.y + (1 - u) * left.y + u * right.y - c00y,
  };
}
/** Node awal: persegi panjang (x,y,w,h) dalam koordinat kanvas (tanpa DOM). */
export function defaultNodes(x, y, w, h) {
  return {
    tl: { x, y }, tr: { x: x + w, y },
    br: { x: x + w, y: y + h }, bl: { x, y: y + h },
    tm: { x: x + w / 2, y }, bm: { x: x + w / 2, y: y + h },
    c: { x: x + w / 2, y: y + h / 2 },
  };
}

export function render(root) {
  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Upload gambar → seret <b>7 node</b> untuk me-warp gambar mengikuti permukaan miring (mockup layar, poster di dinding, dsb.). Tekan <b>SPASI</b> untuk tampilan bersih (sembunyikan node). Semua dihitung di kanvas HP-mu.</p>'));

  const dz = T.el('<div class="drop" tabindex="0" role="button" style="border:1.5px dashed #ffffff30;border-radius:14px;padding:26px 14px;text-align:center;cursor:pointer;background:#14110d"><div style="font-size:13px;font-weight:700;color:#c9bda9">[ gambar ]</div><div style="margin-top:6px;font-weight:700">Ketuk / seret gambar</div><div class="dim" style="font-size:12px;margin-top:4px">PNG · JPG · WebP</div></div>');
  const fileInp = T.el('<input type="file" accept="image/*" hidden>');
  dz.addEventListener('click', () => fileInp.click());
  dz.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') fileInp.click(); });
  dz.addEventListener('dragover', (e) => { e.preventDefault(); dz.style.borderColor = '#fff'; });
  dz.addEventListener('dragleave', () => { dz.style.borderColor = ''; });
  dz.addEventListener('drop', (e) => { e.preventDefault(); dz.style.borderColor = ''; if (e.dataTransfer.files[0]) openFile(e.dataTransfer.files[0]); });
  root.appendChild(dz); root.appendChild(fileInp);
  fileInp.addEventListener('change', () => { if (fileInp.files[0]) openFile(fileInp.files[0]); });

  const stage = T.el('<div style="margin-top:12px" hidden></div>');
  root.appendChild(stage);

  const st = { img: null, cw: 0, chh: 0, nodes: null, clean: false, drag: null };

  function openFile(file) {
    if (!file.type.startsWith('image/')) { T.toast('File harus gambar'); return; }
    const im = new Image();
    im.onload = () => {
      st.img = im;
      const maxW = 920;
      const s = Math.min(1, maxW / im.naturalWidth);
      st.cw = Math.round(im.naturalWidth * s);
      st.chh = Math.round(im.naturalHeight * s);
      const pad = 40;
      st.nodes = defaultNodes(pad, pad, st.cw, st.chh);
      st.clean = false;
      stage.hidden = false;
      buildStage();
      T.scrollToPreview(stage);
    };
    im.onerror = () => T.toast('Gagal membaca gambar');
    im.src = URL.createObjectURL(file);
  }

  let cv, ctx;
  function buildStage() {
    stage.innerHTML = '';
    const W = st.cw + 80, H = st.chh + 80;
    cv = T.el('<canvas style="width:100%;height:auto;border:1px solid #2e2823;border-radius:12px;background:#0d0b09;touch-action:none;cursor:grab"></canvas>');
    cv.width = W; cv.height = H;
    ctx = cv.getContext('2d');
    stage.appendChild(cv);
    stage.appendChild(T.el('<p class="dim" style="font-size:12px;margin:6px 0">Seret node lingkaran untuk warp · <b>SPASI</b> = tampilan bersih · node tengah mengontrol lengkungan</p>'));
    const row = T.row(
      T.btn('Tampilan bersih', () => { st.clean = !st.clean; draw(); }),
      T.btn('Reset node', () => { st.nodes = defaultNodes(40, 40, st.cw, st.chh); draw(); }),
      T.btn('Unduh PNG', () => {
        const was = st.clean; st.clean = true; draw();
        cv.toBlob((b) => { if (b) T.dl('mockup.png', b, 'image/png'); st.clean = was; draw(); }, 'image/png');
      }, true)
    );
    stage.appendChild(row);

    // redraw di-throttle via rAF agar seret node tetap mulus (mesh 24x24 = 1152 sel)
    let drawQueued = false;
    const scheduleDraw = () => {
      if (drawQueued) return;
      drawQueued = true;
      requestAnimationFrame(() => { drawQueued = false; draw(); });
    };

    const pos = (e) => {
      const r = cv.getBoundingClientRect();
      const cx = (e.touches ? e.touches[0].clientX : e.clientX);
      const cy = (e.touches ? e.touches[0].clientY : e.clientY);
      return { x: (cx - r.left) * (cv.width / r.width), y: (cy - r.top) * (cv.height / r.height) };
    };
    cv.addEventListener('pointerdown', (e) => {
      const p = pos(e);
      let best = null, bd = 1e12;
      for (const k of Object.keys(st.nodes)) {
        const n = st.nodes[k];
        const d = (n.x - p.x) ** 2 + (n.y - p.y) ** 2;
        if (d < bd) { bd = d; best = k; }
      }
      if (best && bd < (26 * cv.width / 400) ** 2) {
        st.drag = best;
        cv.setPointerCapture(e.pointerId);
        cv.style.cursor = 'grabbing';
      }
    });
    cv.addEventListener('pointermove', (e) => {
      if (!st.drag) return;
      const p = pos(e);
      st.nodes[st.drag].x = Math.max(0, Math.min(cv.width, p.x));
      st.nodes[st.drag].y = Math.max(0, Math.min(cv.height, p.y));
      scheduleDraw();
    });
    const up = () => { st.drag = null; cv.style.cursor = 'grab'; };
    cv.addEventListener('pointerup', up);
    cv.addEventListener('pointercancel', up);

    document.addEventListener('keydown', onKey);
    T.onLeave(() => document.removeEventListener('keydown', onKey));
    draw();
  }
  function onKey(e) {
    if (e.code === 'Space' && st.img && document.activeElement && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) {
      e.preventDefault();
      st.clean = !st.clean; draw();
    }
  }

  // Gambar satu sel mesh sebagai 2 segitiga via transform affine langsung
  function drawCell(sx0, sy0, sx1, sy1, sx2, sy2, d0, d1, d2) {
    const denom = (sx1 - sx0) * (sy2 - sy0) - (sx2 - sx0) * (sy1 - sy0);
    if (Math.abs(denom) < 1e-9) return;
    const a = ((d1.x - d0.x) * (sy2 - sy0) - (d2.x - d0.x) * (sy1 - sy0)) / denom;
    const b = ((d2.x - d0.x) * (sx1 - sx0) - (d1.x - d0.x) * (sx2 - sx0)) / denom;
    const c = ((d1.y - d0.y) * (sy2 - sy0) - (d2.y - d0.y) * (sy1 - sy0)) / denom;
    const d = ((d2.y - d0.y) * (sx1 - sx0) - (d1.y - d0.y) * (sx2 - sx0)) / denom;
    const e = d0.x - a * sx0 - b * sy0;
    const f = d0.y - c * sx0 - d * sy0;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(d0.x, d0.y); ctx.lineTo(d1.x, d1.y); ctx.lineTo(d2.x, d2.y);
    ctx.closePath(); ctx.clip();
    ctx.transform(a, c, b, d, e, f);
    ctx.drawImage(st.img, 0, 0);
    ctx.restore();
  }

  function draw() {
    const n = st.nodes;
    ctx.clearRect(0, 0, cv.width, cv.height);
    const N = MESH;
    const P = [];
    for (let j = 0; j <= N; j++) {
      P[j] = [];
      for (let i = 0; i <= N; i++) P[j][i] = patchPoint(i / N, j / N, n);
    }
    const iw = st.img.naturalWidth, ih = st.img.naturalHeight;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    for (let j = 0; j < N; j++) {
      for (let i = 0; i < N; i++) {
        const sx0 = (i / N) * iw, sy0 = (j / N) * ih;
        const sx1 = ((i + 1) / N) * iw, sy1 = ((j + 1) / N) * ih;
        drawCell(sx0, sy0, sx1, sy0, sx0, sy1, P[j][i], P[j][i + 1], P[j + 1][i]);
        drawCell(sx1, sy0, sx1, sy1, sx0, sy1, P[j][i + 1], P[j + 1][i + 1], P[j + 1][i]);
      }
    }
    if (!st.clean) {
      // wireframe ringan
      ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 1;
      for (let j = 0; j <= N; j += 4) {
        ctx.beginPath();
        for (let i = 0; i <= N; i++) { const p = P[j][i]; i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y); }
        ctx.stroke();
      }
      for (let i = 0; i <= N; i += 4) {
        ctx.beginPath();
        for (let j = 0; j <= N; j++) { const p = P[j][i]; j ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y); }
        ctx.stroke();
      }
      // node
      for (const k of Object.keys(n)) {
        const p = n[k];
        const corner = ['tl', 'tr', 'br', 'bl'].includes(k);
        ctx.beginPath(); ctx.arc(p.x, p.y, corner ? 10 : 8, 0, 7);
        ctx.fillStyle = k === 'c' ? '#22d3ee' : corner ? '#fff' : '#f472b6';
        ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = '#000'; ctx.stroke();
      }
    }
  }
}
