import { h as T, utils } from '../../core.js?v=6.9.20';

/* textvector — "Text to Vector": teks -> path vektor -> XML Alight Motion + preview SVG.
   100% lokal: trace dari glyph yang dirender browser (marching squares +
   Chaikin smoothing), tanpa font file.
   Setia pada rujukan (all-tools-nexora, izin Developer Dika) sebatas yang bisa
   dicapai clean-room: contourMode (AM Fix A/B/Original) menormalkan arah
   winding berdasar kedalaman nesting; lubang kontur jadi <contour
   exclude="true"/>; struktur <shape> + <path-stroke> ala XML Alight Motion;
   auto-fit teks ke kanvas 1080 dengan padding; multi-baris; urutan layer
   dibalik; default parameter disamakan.
   Gap jujur: rujukan memakai OpenType outlining (parse binary TTF via
   opentype.js di Web Worker -> kurva Bezier sejati dari data font). Itu butuh
   binary font + parser di luar satu file tool, jadi tidak bisa ditiru di sini;
   hasil kita adalah aproksimasi trace dari raster glyph. */
const AL = utils.alight;

export const meta = {
  id: 'textvector', name: 'Teks ke Vektor', cat: 'desain', icon: '🔷',
  desc: 'Ubah teks menjadi path vektor → XML Alight Motion (shape + contour, 100% lokal).',
  keywords: 'teks,vektor,path,alight motion,xml,trace,outline,contour',
};

const FONTS = ['Poppins', 'Inter', 'Exo', 'Lexend', 'Montserrat', 'Plus Jakarta Sans'];
const WEIGHTS = [['300', 'Light'], ['400', 'Regular'], ['500', 'Medium'], ['600', 'Semi Bold'], ['700', 'Bold'], ['800', 'Extra Bold'], ['900', 'Black']];

/* ---- Geometri bantu (clean-room) ---- */
function signedArea(p) {
  let a = 0;
  for (let k = 0; k < p.length; k++) { const q = p[(k + 1) % p.length]; a += p[k][0] * q[1] - q[0] * p[k][1]; }
  return a / 2;
}
function pip(pt, poly) {
  let ins = false;
  for (let a = 0, b = poly.length - 1; a < poly.length; b = a++) {
    const A = poly[a], B = poly[b];
    if ((A[1] > pt[1]) !== (B[1] > pt[1]) && pt[0] < (B[0] - A[0]) * (pt[1] - A[1]) / ((B[1] - A[1]) || 1e-9) + A[0]) ins = !ins;
  }
  return ins;
}
function centroid(p) {
  return [p.reduce((s, q) => s + q[0], 0) / p.length, p.reduce((s, q) => s + q[1], 0) / p.length];
}
/* contourMode seperti rujukan (perilaku, bukan salinan kode):
   - 'amFixA': kontur luar ber-area positif, lubang negatif (default rujukan)
   - 'amFixB': kebalikannya
   - 'original': tanpa ubahan
   Klasifikasi lubang via kedalaman nesting (point-in-polygon). Teruji di Node:
   traceContours kita menghasilkan luar & lubang SAMA-SAMA positif, jadi
   amFixA membalik lubang menjadi negatif — persis yang dinormalkan rujukan. */
function fixContours(polys, mode) {
  const info = polys.map((p) => ({ p, area: signedArea(p), c: centroid(p) }));
  const rows = info.map((r) => {
    let d = 0;
    for (const s of info) { if (s !== r && Math.abs(s.area) > Math.abs(r.area) && pip(r.c, s.p)) d++; }
    return { ...r, hole: d % 2 === 1 };
  });
  if (mode === 'original') return rows;
  return rows.map((r) => {
    const wantPositive = mode === 'amFixB' ? r.hole : !r.hole;
    if ((r.area > 0) === wantPositive) return r;
    const p = r.p.slice().reverse();
    return { ...r, p, area: signedArea(p) };
  });
}
function polyToD(poly) {
  return 'M' + poly.map((p) => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L') + 'Z';
}

/* <shape> ala XML Alight Motion: kontur terpisah, lubang = exclude="true",
   stroke via <path-stroke> (bukan strokeColor), seperti format rujukan. */
function shapeLayer(o) {
  const contours = o.contours.map((c) =>
    '      <contour' + (c.exclude ? ' exclude="true"' : '') + ' d="' + AL.escXml(c.d) + '"/>').join('\n');
  const fillType = o.fillArgb ? 'color' : 'none';
  return '  <shape id="' + o.id + '" label="' + AL.escXml(o.label) + '" startTime="' + o.startMs +
    '" endTime="' + o.endMs + '" fillType="' + fillType + '">\n' +
    '    <transform>\n' +
    '      <location value="' + AL.f6(o.x) + ',' + AL.f6(o.y) + ',0.000000"/>\n' +
    '      <pivot value="0.000000,0.000000"/>\n' +
    '      <scale value="1.000000,1.000000"/>\n' +
    '    </transform>\n' +
    (o.fillArgb ? '    <fillColor value="' + o.fillArgb + '"/>\n' : '') +
    '    <path>\n' + contours + '\n    </path>' +
    (o.strokeArgb ? '\n    <path-stroke direction="centered" join="round" width="' + (+o.strokeW || 1.5) + '">\n' +
      '      <color value="' + o.strokeArgb + '"/>\n    </path-stroke>' : '') +
    '\n  </shape>';
}

export function generate(o) {
  const text = String(o.text || '').replace(/\r/g, '').trim();
  if (!text) throw new Error('Teks masih kosong — isi dulu teksnya.');
  if (typeof document === 'undefined') throw new Error('Vektorisasi butuh browser (canvas).');
  const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length);
  if (!lines.length) throw new Error('Teks masih kosong — isi dulu teksnya.');

  const size = Math.max(8, Math.min(900, +o.size || 300));
  const spacing = Math.max(-20, Math.min(400, +o.spacing || 0));
  const pad = Math.max(0, Math.min(400, +o.pad || 20));
  const contourMode = ['amFixA', 'amFixB', 'original'].includes(o.contourMode) ? o.contourMode : 'amFixA';
  const smooth = o.smooth !== false;
  const fontCss = (s) => o.weight + ' ' + s + 'px "' + o.font + '", sans-serif';
  const rpad = 6; // padding raster internal per item (padding UI = untuk auto-fit kanvas)

  // Pass 1: ukur blok teks untuk auto-fit ke kanvas 1080 (seperti rujukan).
  const mctx = document.createElement('canvas').getContext('2d');
  mctx.font = fontCss(size);
  const lineItems = lines.map((ln) => {
    const parts = o.mode === 'word' ? String(ln).split(/(\s+)/).filter((p) => p && !/^\s+$/.test(p)) : [...ln];
    return parts.filter((s) => s.trim().length);
  });
  const measured = lineItems.map((items) => items.map((s) => mctx.measureText(s).width));
  const lineGap = size * 1.2;
  const widths = measured.map((ws) => ws.reduce((a, b) => a + b, 0) + spacing * Math.max(0, ws.length - 1));
  const blockW = Math.max(1, ...widths);
  const blockH = Math.max(1, lines.length * lineGap);
  const avail = Math.max(10, 1080 - pad * 2);
  const fit = Math.min(1, avail / blockW, avail / blockH);
  const fs = Math.max(8, size * fit);
  const gap = fs * 1.2;

  // Pass 2: raster -> trace -> perbaiki kontur -> smooth -> posisikan.
  const f2 = fontCss(fs);
  const shapes = [];
  lines.forEach((ln, li) => {
    const items = lineItems[li];
    const ws = measured[li].map((w) => w * fit);
    const totalW = ws.reduce((a, b) => a + b, 0) + spacing * fit * Math.max(0, items.length - 1);
    let cx = 540 - totalW / 2;
    const cyLine = 540 - (lines.length * gap) / 2 + gap * (li + 0.5);
    const by = cyLine + fs * 0.35; // baseline ~ tengah baris
    items.forEach((s, i) => {
      const r = AL.rasterizeChar(s, f2, fs, rpad);
      const itemCx = cx;
      cx += ws[i] + spacing * fit;
      if (!r) return;
      const polys = AL.traceContours(r.mask, r.w, r.h, 128);
      if (!polys.length) return;
      const dx = itemCx - rpad - 2, dy = by - (rpad + 2 + fs);
      const fixed = fixContours(polys, contourMode);
      const moved = fixed.map((row) => {
        const pts = row.p.map((p) => [p[0] + dx, p[1] + dy]);
        return { ...row, p: smooth ? AL.chaikin(pts) : pts };
      });
      // bbox -> center; path relatif thd center, location di center (model rujukan)
      let x1 = 1e9, y1 = 1e9, x2 = -1e9, y2 = -1e9;
      moved.forEach((row) => row.p.forEach((p) => {
        if (p[0] < x1) x1 = p[0]; if (p[1] < y1) y1 = p[1];
        if (p[0] > x2) x2 = p[0]; if (p[1] > y2) y2 = p[1];
      }));
      const ccx = (x1 + x2) / 2, ccy = (y1 + y2) / 2;
      shapes.push({
        label: s.slice(0, 18), x: ccx, y: ccy,
        contours: moved.map((row) => ({ d: polyToD(row.p.map((p) => [p[0] - ccx, p[1] - ccy])), exclude: row.hole })),
      });
    });
  });
  if (!shapes.length) throw new Error('Tidak ada path yang berhasil dibuat — coba teks atau font lain.');

  const totalMs = Math.max(200, Math.round((+o.durSec || 5) * 1000));
  const style = o.style; // both | fill | stroke
  // Urutan layer dibalik seperti rujukan.
  const layers = [...shapes].reverse().map((sh, k) => shapeLayer({
    id: 9 + k, parent: 8, label: sh.label, startMs: 0, endMs: totalMs, x: sh.x, y: sh.y,
    contours: sh.contours,
    fillArgb: style !== 'stroke' ? AL.argb(o.fill) : null,
    strokeArgb: style !== 'fill' ? AL.argb(o.stroke) : null,
    strokeW: o.strokeW,
  }));
  layers.push(AL.nullLayer({ id: 8, label: 'Vektor', startMs: 0, endMs: totalMs, x: 540, y: 540, hidden: true }));

  const scene = AL.buildScene({ title: AL.projectName(o.project, 'Teks Vektor'), totalMs, fps: o.fps, inner: layers.join('\n') });
  const xml = scene.replace('?>\n', '?>\n<!-- Dibuat oleh Adip Tools - Teks ke Vektor (trace lokal, bukan outline font) -->\n');
  const v = AL.validate(xml);
  if (!v.ok) throw new Error(v.error);

  const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1080" style="width:100%;background:#0d0b09;border-radius:10px;border:1px solid #ffffff18">' +
    shapes.map((sh) =>
      '<g transform="translate(' + sh.x.toFixed(1) + ' ' + sh.y.toFixed(1) + ')"><path d="' +
      AL.escXml(sh.contours.map((c) => c.d).join(' ')) + '" fill-rule="evenodd"' +
      (style !== 'stroke' ? ' fill="' + T.esc(o.fill) + '"' : ' fill="none"') +
      (style !== 'fill' ? ' stroke="' + T.esc(o.stroke) + '" stroke-width="' + (+o.strokeW || 1.5) + '"' : '') + '/></g>').join('') + '</svg>';
  return { xml, svg, filename: AL.fileFor(o.filename, 'vector', o.text), totalMs, paths: shapes.length };
}

export function render(root) {
  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Trace teks menjadi <b>path vektor</b> langsung di perangkatmu — lalu export ke <b>XML Alight Motion</b>. Semua huruf yang bisa tampil di browser bisa divektorkan (tanpa batas data huruf).</p>'));

  const inpText = T.ta(2, 'Tulis teks di sini…', 'VEKTOR');
  const selFont = T.select(FONTS.map((f) => [f, f]), 'Poppins');
  const selWeight = T.select(WEIGHTS, '400');
  const selMode = T.select([['char', 'Per karakter'], ['word', 'Per kata']], 'char');
  const selStyle = T.select([['both', 'Fill + Stroke'], ['fill', 'Fill saja'], ['stroke', 'Stroke saja']], 'both');
  const selSmooth = T.select([['halus', 'Halus (smooth)'], ['tegas', 'Tegas (poligon)']], 'halus');
  const selContour = T.select([['amFixA', 'AM Fix A (disarankan)'], ['amFixB', 'AM Fix B'], ['original', 'Original (tanpa perbaikan)']], 'amFixA');
  const inpSize = T.input('number', '', '300'); inpSize.min = 8; inpSize.max = 900;
  const inpSpacing = T.input('number', '', '10'); inpSpacing.min = -20; inpSpacing.max = 400;
  const inpPad = T.input('number', '', '20'); inpPad.min = 0; inpPad.max = 400;
  const inpFill = T.input('color', ''); inpFill.value = '#FFFFFF';
  const inpStroke = T.input('color', ''); inpStroke.value = '#FFFFFF';
  const inpStrokeW = T.input('number', '', '1.5'); inpStrokeW.min = 0.1; inpStrokeW.max = 20; inpStrokeW.step = '0.1';
  const inpDur = T.input('number', '', '5'); inpDur.min = 0.2; inpDur.step = '0.1';
  const inpFps = T.input('number', '', '30'); inpFps.min = 1; inpFps.max = 120;
  const inpProject = T.input('text', 'Nama project…', 'Teks Vektor');
  const inpFile = T.input('text', 'Otomatis: teks#vector', '');

  root.appendChild(T.field('Teks (baris baru = baris baru)', inpText));
  root.appendChild(T.grid2(T.field('Font', selFont), T.field('Weight', selWeight)));
  root.appendChild(T.grid2(T.field('Mode', selMode), T.field('Style path', selStyle)));
  root.appendChild(T.grid2(T.field('Mode path', selSmooth), T.field('Contour', selContour)));
  root.appendChild(T.grid2(T.field('Ukuran (8–900)', inpSize), T.field('Jarak huruf', inpSpacing)));
  root.appendChild(T.grid2(T.field('Padding (0–400)', inpPad), T.field('Durasi (detik)', inpDur)));
  root.appendChild(T.grid2(T.field('Warna fill', inpFill), T.field('Warna stroke', inpStroke)));
  root.appendChild(T.grid2(T.field('Lebar stroke (0,1–20)', inpStrokeW), T.field('FPS', inpFps)));
  root.appendChild(T.grid2(T.field('Nama project', inpProject), T.field('Nama file (opsional)', inpFile)));

  const status = T.el('<div class="dim" style="font-size:12.5px;margin:8px 0"></div>');
  const prevBox = T.el('<div style="margin:8px 0"></div>');
  const xmlOut = T.ta(8, 'XML hasil akan muncul di sini…'); xmlOut.readOnly = true;
  xmlOut.style.fontFamily = 'monospace'; xmlOut.style.fontSize = '11px';
  let last = null;
  const hist = AL.historyUI('textvector', (xml) => { last = { xml }; xmlOut.value = xml; status.textContent = 'XML dari riwayat dimuat.'; });

  function collect() {
    return {
      text: inpText.value, font: selFont.value, weight: selWeight.value, mode: selMode.value,
      style: selStyle.value, smooth: selSmooth.value === 'halus', contourMode: selContour.value,
      size: Math.max(8, Math.min(900, +inpSize.value || 300)),
      spacing: Math.max(-20, Math.min(400, +inpSpacing.value || 0)),
      pad: Math.max(0, Math.min(400, +inpPad.value || 0)),
      fill: inpFill.value, stroke: inpStroke.value,
      strokeW: Math.max(0.1, Math.min(20, +inpStrokeW.value || 1.5)),
      durSec: Math.max(0.2, +inpDur.value || 5), fps: Math.max(1, Math.min(120, +inpFps.value || 30)),
      project: inpProject.value, filename: inpFile.value,
    };
  }
  function doGenerate() {
    status.textContent = 'Me-render & men-trace teks…';
    setTimeout(() => {
      try {
        const r = generate(collect());
        last = r; xmlOut.value = r.xml; prevBox.innerHTML = r.svg;
        status.innerHTML = 'Siap — <b>' + T.esc(r.paths) + ' path</b> · durasi ' + r.totalMs + ' ms · <span class="dim">' + T.esc(r.filename) + '</span>';
        AL.history.push('textvector', { filename: r.filename, project: inpProject.value, preset: 'Vector', xml: r.xml });
        hist.refresh();
      } catch (e) { status.innerHTML = '<span class="err">' + T.esc(e.message) + '</span>'; }
    }, 30);
  }
  root.appendChild(T.row(T.btn('Generate Vektor', doGenerate, true)));
  root.appendChild(status);
  root.appendChild(T.el('<div class="dim" style="font-size:13px;font-weight:700;margin:8px 0 4px">Preview vektor</div>'));
  root.appendChild(prevBox);
  root.appendChild(T.field('Lihat XML hasil', xmlOut));
  root.appendChild(T.row(
    T.btn('Unduh XML', () => {
      if (!last) { T.toast('Generate dulu XML-nya'); return; }
      const err = AL.downloadXml(last.filename || 'vektor.xml', last.xml);
      T.toast(err || 'Mengunduh…');
    }, true),
    T.copyBtn(() => (last ? last.xml : ''), 'Salin XML'),
  ));
  root.appendChild(T.el('<div class="dim" style="font-size:13px;font-weight:700;margin:12px 0 4px">Riwayat</div>'));
  root.appendChild(hist);
  root.appendChild(T.el('<p class="dim" style="font-size:12px;margin-top:10px">Hasil trace tergantung font yang terpasang di perangkat. Untuk hasil tajam, pakai ukuran besar (≥200) lalu kecilkan di Alight Motion.</p>'));
}
