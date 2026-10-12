import { h as T, utils } from '../../core.js?v=6.9.20';

/* textvector — "Text to Vector": teks -> path vektor (marching squares, 100% lokal)
   -> XML Alight Motion + preview SVG. Tanpa font file: trace dari glyph yang
   dirender browser, jadi semua karakter yang bisa tampil bisa divektorkan. */
const AL = utils.alight;

export const meta = {
  id: 'textvector', name: 'Teks ke Vektor', cat: 'desain', icon: '🔷',
  desc: 'Ubah teks menjadi path vektor → XML Alight Motion. 100% lokal.',
  keywords: 'teks,vektor,path,alight motion,xml,trace,outline',
};

const FONTS = ['Poppins', 'Inter', 'Exo', 'Lexend', 'Montserrat', 'Plus Jakarta Sans'];
const WEIGHTS = [['300', 'Light'], ['400', 'Regular'], ['500', 'Medium'], ['600', 'Semi Bold'], ['700', 'Bold'], ['800', 'Extra Bold'], ['900', 'Black']];

/* Vektorisasi satu string pada posisi baseline (bx, by) — via helper bersama. */
function vectorizeAt(s, fontCss, px, pad, smooth, bx, by) {
  return AL.vectorizeText(s, fontCss, px, pad, smooth, bx, by);
}

export function generate(o) {
  const text = String(o.text || '').trim();
  if (!text) throw new Error('Teks masih kosong — isi dulu teksnya.');
  if (typeof document === 'undefined') throw new Error('Vektorisasi butuh browser (canvas).');
  const fontCss = o.weight + ' ' + o.size + 'px "' + o.font + '", sans-serif';
  // Layout per unit (karakter / kata)
  const raw = o.mode === 'word' ? text.split(/(\s+)/).filter((p) => p && !/^\s+$/.test(p)) : [...text.replace(/\n/g, ' ')];
  const items = raw.filter((s) => s.trim().length);
  if (!items.length) throw new Error('Teks masih kosong — isi dulu teksnya.');
  const spacing = Math.max(0, +o.spacing || 0);
  const pad = Math.max(0, Math.min(400, +o.pad || 0));
  const widths = items.map((s) => {
    const r = AL.rasterizeChar(s, fontCss, o.size, 0);
    return r ? r.advance : s.length * o.size * 0.62;
  });
  const totalW = widths.reduce((a, b) => a + b, 0) + spacing * Math.max(0, items.length - 1);
  let cx = 540 - totalW / 2;
  const by = 540 + o.size * 0.35; // baseline ~ tengah kanvas
  const vecs = items.map((s, i) => {
    const v = vectorizeAt(s, fontCss, o.size, pad, o.smooth, cx, by);
    const w = widths[i]; cx += w + spacing;
    return { s, v, w };
  });

  const plan = { starts: items.map(() => 0), ends: items.map(() => o.durMs), total: o.durMs };
  const layers = [];
  let id = 9; const parentId = 8;
  const style = o.style; // fill | stroke | both
  vecs.forEach(({ s, v }, i) => {
    if (!v || !v.d) return;
    layers.push(AL.pathLayer({
      id: id++, parent: parentId, label: s.slice(0, 12), startMs: 0, endMs: o.durMs, d: v.d,
      transform: AL.xform({}),
      fillArgb: style !== 'stroke' ? AL.argb(o.fill) : null,
      strokeArgb: style !== 'fill' ? AL.argb(o.stroke) : null,
      strokeW: o.strokeW,
    }));
  });
  if (!layers.length) throw new Error('Tidak ada path yang berhasil dibuat — coba teks atau font lain.');
  layers.push(AL.nullLayer({ id: parentId, label: 'Vektor', startMs: 0, endMs: o.durMs, x: 540, y: 540, hidden: true }));
  void plan;

  const xml = AL.buildScene({ title: AL.projectName(o.project, 'Teks Vektor'), totalMs: o.durMs, fps: o.fps, inner: layers.join('\n') });
  const v = AL.validate(xml);
  if (!v.ok) throw new Error(v.error);
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1080" style="width:100%;background:#0d0b09;border-radius:10px;border:1px solid #ffffff18">' +
    vecs.filter((x) => x.v && x.v.d).map((x) =>
      '<path d="' + AL.escXml(x.v.d) + '" fill-rule="evenodd"' +
      (style !== 'stroke' ? ' fill="' + T.esc(o.fill) + '"' : ' fill="none"') +
      (style !== 'fill' ? ' stroke="' + T.esc(o.stroke) + '" stroke-width="' + (+o.strokeW || 2) + '"' : '') + '/>').join('') + '</svg>';
  return { xml, svg, filename: AL.fileFor(o.filename, 'vector', o.text), totalMs: o.durMs, paths: layers.length - 1 };
}

export function render(root) {
  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Trace teks menjadi <b>path vektor</b> langsung di perangkatmu — lalu export ke <b>XML Alight Motion</b>. Semua huruf yang bisa tampil di browser bisa divektorkan (tanpa batas data huruf).</p>'));

  const inpText = T.ta(2, 'Tulis teks di sini…', 'VEKTOR');
  const selFont = T.select(FONTS.map((f) => [f, f]), 'Poppins');
  const selWeight = T.select(WEIGHTS, '400');
  const selMode = T.select([['char', 'Per karakter'], ['word', 'Per kata']], 'char');
  const selStyle = T.select([['both', 'Fill + Stroke'], ['fill', 'Fill saja'], ['stroke', 'Stroke saja']], 'both');
  const selSmooth = T.select([['halus', 'Halus (smooth)'], ['tegas', 'Tegas (poligon)']], 'halus');
  const inpSize = T.input('number', '', '300'); inpSize.min = 8; inpSize.max = 900;
  const inpSpacing = T.input('number', '', '10'); inpSpacing.min = -20; inpSpacing.max = 400;
  const inpPad = T.input('number', '', '40'); inpPad.min = 0; inpPad.max = 400;
  const inpFill = T.input('color', ''); inpFill.value = '#FFFFFF';
  const inpStroke = T.input('color', ''); inpStroke.value = '#FF6B00';
  const inpStrokeW = T.input('number', '', '3'); inpStrokeW.min = 0.1; inpStrokeW.max = 20; inpStrokeW.step = '0.1';
  const inpDur = T.input('number', '', '3000'); inpDur.min = 200;
  const inpFps = T.input('number', '', '30'); inpFps.min = 1; inpFps.max = 120;
  const inpProject = T.input('text', 'Nama project…', 'Teks Vektor');
  const inpFile = T.input('text', 'Otomatis: teks#vector', '');

  root.appendChild(T.field('Teks', inpText));
  root.appendChild(T.grid2(T.field('Font', selFont), T.field('Weight', selWeight)));
  root.appendChild(T.grid2(T.field('Mode', selMode), T.field('Style path', selStyle)));
  root.appendChild(T.grid2(T.field('Ukuran (8–900)', inpSize), T.field('Jarak huruf', inpSpacing)));
  root.appendChild(T.grid2(T.field('Padding (0–400)', inpPad), T.field('Mode path', selSmooth)));
  root.appendChild(T.grid2(T.field('Warna fill', inpFill), T.field('Warna stroke', inpStroke)));
  root.appendChild(T.grid2(T.field('Lebar stroke (0,1–20)', inpStrokeW), T.field('Durasi, ms', inpDur)));
  root.appendChild(T.grid2(T.field('FPS', inpFps), T.field('Nama project', inpProject)));
  root.appendChild(T.field('Nama file (opsional)', inpFile));

  const status = T.el('<div class="dim" style="font-size:12.5px;margin:8px 0"></div>');
  const prevBox = T.el('<div style="margin:8px 0"></div>');
  const xmlOut = T.ta(8, 'XML hasil akan muncul di sini…'); xmlOut.readOnly = true;
  xmlOut.style.fontFamily = 'monospace'; xmlOut.style.fontSize = '11px';
  let last = null;
  const hist = AL.historyUI('textvector', (xml) => { last = { xml }; xmlOut.value = xml; status.textContent = 'XML dari riwayat dimuat.'; });

  function collect() {
    return {
      text: inpText.value, font: selFont.value, weight: selWeight.value, mode: selMode.value,
      style: selStyle.value, smooth: selSmooth.value === 'halus',
      size: Math.max(8, Math.min(900, +inpSize.value || 300)),
      spacing: Math.max(-20, Math.min(400, +inpSpacing.value || 0)),
      pad: Math.max(0, Math.min(400, +inpPad.value || 0)),
      fill: inpFill.value, stroke: inpStroke.value,
      strokeW: Math.max(0.1, Math.min(20, +inpStrokeW.value || 3)),
      durMs: Math.max(200, +inpDur.value || 3000), fps: Math.max(1, Math.min(120, +inpFps.value || 30)),
      project: inpProject.value, filename: inpFile.value,
    };
  }
  function doGenerate() {
    status.textContent = '⏳ Me-render & men-trace teks…';
    setTimeout(() => {
      try {
        const r = generate(collect());
        last = r; xmlOut.value = r.xml; prevBox.innerHTML = r.svg;
        status.innerHTML = '✅ Siap — <b>' + T.esc(r.paths) + ' path</b> · durasi ' + r.totalMs + ' ms · <span class="dim">' + T.esc(r.filename) + '</span>';
        AL.history.push('textvector', { filename: r.filename, project: inpProject.value, preset: 'Vector', xml: r.xml });
        hist.refresh();
      } catch (e) { status.innerHTML = '<span class="err">❌ ' + T.esc(e.message) + '</span>'; }
    }, 30);
  }
  root.appendChild(T.row(T.btn('⚙️ Generate Vektor', doGenerate, true)));
  root.appendChild(status);
  root.appendChild(T.el('<div class="dim" style="font-size:13px;font-weight:700;margin:8px 0 4px">👁️ Preview vektor</div>'));
  root.appendChild(prevBox);
  root.appendChild(T.field('Lihat XML hasil', xmlOut));
  root.appendChild(T.row(
    T.btn('⬇️ Unduh XML', () => {
      if (!last) { T.toast('Generate dulu XML-nya'); return; }
      const err = AL.downloadXml(last.filename || 'vektor.xml', last.xml);
      T.toast(err || 'Mengunduh…');
    }, true),
    T.copyBtn(() => (last ? last.xml : ''), '📋 Salin XML'),
  ));
  root.appendChild(T.el('<div class="dim" style="font-size:13px;font-weight:700;margin:12px 0 4px">🕘 Riwayat</div>'));
  root.appendChild(hist);
  root.appendChild(T.el('<p class="dim" style="font-size:12px;margin-top:10px">💡 Hasil trace tergantung font yang terpasang di perangkat. Untuk hasil tajam, pakai ukuran besar (≥200) lalu kecilkan di Alight Motion.</p>'));
}
