import { h as T, utils } from '../../core.js?v=6.9.20';

/* trimpath — "Trimpath Generator": animasi garis draw-on per huruf -> XML Alight Motion.
   Path huruf dibuat sendiri via vectorizer lokal (marching squares), jadi semua
   karakter yang bisa tampil di browser didukung — tanpa batas data huruf. */
const AL = utils.alight;

export const meta = {
  id: 'trimpath', name: 'Generator Trim Path', cat: 'desain', icon: '✏️',
  desc: 'Animasi garis draw-on (trim path) per huruf → XML Alight Motion.',
  keywords: 'trim path,animasi,garis,draw on,alight motion,xml,stroke',
};

/* 5 preset gerak layer (koreografi orisinal). off dalam px. */
export const PRESETS = [
  { id: 'biasa', name: 'Biasa', dur: 0, loc: null },
  { id: 'movein', name: 'Move In', dur: 1200, loc: [{ t: 0, off: [-260, 0, 0] }, { t: 1, off: [0, 0, 0] }] },
  { id: 'moveinup', name: 'Move In Up', dur: 1200, loc: [{ t: 0, off: [-200, 180, 0] }, { t: 1, off: [0, 0, 0] }] },
  { id: 'inupmove', name: 'In Up Move', dur: 1400, loc: [{ t: 0, off: [0, 220, 0] }, { t: .6, off: [0, -28, 0] }, { t: 1, off: [0, 0, 0] }] },
  { id: 'moveleft', name: 'Move From Left', dur: 1300, loc: [{ t: 0, off: [-560, 0, 0] }, { t: 1, off: [0, 0, 0] }] },
];
const CURVES = [
  ['halus', 'Halus'], ['mulus', 'Mulus'], ['cepat', 'Cepat'], ['memantul', 'Memantul'],
];
const CURVE_EASE = {
  halus: 'cubicBezier(0.33,0.00,0.67,1.00)',
  mulus: 'cubicBezier(0.00,0.00,0.16,1.00)',
  cepat: 'cubicBezier(0.42,0.00,0.58,1.00)',
  memantul: 'elastic(0.50,1.00,0.00,0.55)',
};
/* 9 style (warna orisinal). 'original' = ikut palet/mode warna. */
export const STYLES = [
  { id: 'original', name: 'Original', colors: null },
  { id: 'senja', name: 'Senja', colors: ['#FF9F1C', '#E2571D'] },
  { id: 'gelap', name: 'Gelap', colors: ['#3D1F1F', '#111111'] },
  { id: 'gelapterang', name: 'Gelap ke Terang', colors: ['#3D1F1F', '#F2F2F2'] },
  { id: 'terangwarna', name: 'Terang ke Warna', colors: ['#FFFFFF', '#FF2E88'] },
  { id: 'teranggelap', name: 'Terang ke Gelap', colors: ['#FFFFFF', '#333333'] },
  { id: 'birubintang', name: 'Biru Bintang', colors: ['#7FDBFF', '#2563EB'] },
  { id: 'cinta', name: 'Cinta', colors: ['#FF4D6D', '#8A0F4D'] },
  { id: 'cupid', name: 'Cupid', colors: ['#FF9AD5', '#7B2CBF'] },
];
const FONT = 'Plus Jakarta Sans';

export function generate(o) {
  const text = String(o.text || '').replace(/\n/g, ' ').trim();
  if (!text) throw new Error('Teks masih kosong — isi dulu teksnya.');
  if (typeof document === 'undefined') throw new Error('Trim path butuh browser (canvas).');
  const chars = [...text].filter((c) => c !== ' ');
  if (!chars.length) throw new Error('Teks masih kosong — isi dulu teksnya.');
  const size = Math.max(10, Math.min(120, +o.size || 64));
  const spacing = Math.max(-20, Math.min(120, +o.spacing || 12));
  const pad = 20;
  const fontCss = '600 ' + size + 'px "' + FONT + '", sans-serif';
  const shear = o.italic ? 0.18 : 0;

  const widths = chars.map((c) => {
    const r = AL.rasterizeChar(c, fontCss, size, 0);
    return r ? r.advance : size * 0.62;
  });
  const totalW = widths.reduce((a, b) => a + b, 0) + spacing * Math.max(0, chars.length - 1);
  let cx = 540 - totalW / 2;
  const by = 540 + size * 0.35;
  const vecs = chars.map((c, i) => {
    const v = AL.vectorizeText(c, fontCss, size, pad, true, cx, by, shear);
    const w = widths[i]; cx += w + spacing;
    return { c, v };
  });

  const preset = PRESETS.find((p) => p.id === o.presetId) || PRESETS[0];
  const plan = AL.timingPlan(chars.length, o);
  const palette = o.colorState.activeColors();
  const style = STYLES.find((s) => s.id === o.styleId) || STYLES[0];
  const ease = CURVE_EASE[o.curve] || CURVE_EASE.mulus;
  const strokeW = Math.max(2, Math.round(size / 10));
  const layers = [];
  let id = 9; const parentId = 8;

  vecs.forEach(({ c, v }, i) => {
    if (!v || !v.d) return;
    const st = plan.starts[i], en = plan.ends[i];
    const drawMs = Math.max(300, Math.round((en - st) * 0.6));
    let col;
    if (style.colors) {
      col = AL.lerpHex(style.colors[0], style.colors[1], chars.length > 1 ? i / (chars.length - 1) : 0);
    } else if (o.colorMap) {
      col = AL.colorFor(o.colorState.mode, palette, i, chars.length, o.colorState.repeatEvery);
    } else {
      col = palette[0];
    }
    // Posisi dasar unit (untuk keyframe gerak)
    const ux = 540 - totalW / 2 + widths.slice(0, i).reduce((a, b) => a + b, 0) + spacing * i;
    const loc = preset.loc
      ? preset.loc.map((k, ki) => AL.kf(k.t * preset.dur,
          AL.f6(ux + (k.off ? k.off[0] : 0)) + ',' + AL.f6(by + (k.off ? k.off[1] : 0)) + ',0.000000',
          ki === 0 ? undefined : ease))
      : [AL.kf(0, AL.f6(ux) + ',' + AL.f6(by) + ',0.000000')];
    layers.push(AL.pathLayer({
      id: id++, parent: parentId, label: c, startMs: st, endMs: en, d: v.d,
      transform: AL.xform({
        location: loc,
        trimStart: [AL.kf(0, '0.000000'), AL.kf(en - st, '0.000000')],
        trimEnd: [AL.kf(0, '0.000000'), AL.kf(drawMs, '1.000000', ease), AL.kf(en - st, '1.000000')],
      }),
      fillArgb: null,
      strokeArgb: AL.argb(col), strokeW,
    }));
  });
  if (!layers.length) throw new Error('Tidak ada path yang berhasil dibuat — coba teks lain.');
  layers.push(AL.nullLayer({ id: parentId, label: 'Trim Path', startMs: 0, endMs: plan.total, x: 540, y: 540, hidden: true }));

  const xml = AL.buildScene({ title: AL.projectName(o.project, 'Trim Path'), totalMs: plan.total, inner: layers.join('\n') });
  const chk = AL.validate(xml);
  if (!chk.ok) throw new Error(chk.error);
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1080" style="width:100%;background:#0d0b09;border-radius:10px;border:1px solid #ffffff18">' +
    layers.filter((l) => l.indexOf('<path') === 0).map((l) => {
      const d = (l.match(/ d="([^"]*)"/) || [])[1] || '';
      const sw = (l.match(/strokeColor value="[^"]*" width="([^"]*)"/) || [])[1] || '4';
      const sc = (l.match(/strokeColor value="([^"]*)"/) || [])[1] || '#FFFFFFFF';
      const hex = '#' + sc.slice(3).toLowerCase();
      return '<path d="' + d + '" fill="none" stroke="' + hex + '" stroke-width="' + sw + '"/>';
    }).join('') + '</svg>';
  return { xml, svg, filename: AL.fileFor(o.filename, preset.id, o.text), totalMs: plan.total, paths: layers.length - 1 };
}

export function render(root) {
  const colorState = { mode: 'single', paletteIndex: 0, repeatEvery: 1, customId: null };
  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Animasi <b>draw-on</b> — garis menggambar tiap huruf satu per satu — jadi <b>XML Alight Motion</b>. Path huruf di-trace otomatis di perangkatmu.</p>'));

  const inpText = T.ta(2, 'Tulis teks di sini…', 'Trim');
  const selPreset = T.select(PRESETS.map((p) => [p.id, p.name]), 'biasa');
  const selStyle = T.select(STYLES.map((s) => [s.id, s.name]), 'original');
  const selCurve = T.select(CURVES, 'mulus');
  const inpSize = T.input('number', '', '64'); inpSize.min = 10; inpSize.max = 120;
  const inpSpacing = T.input('number', '', '12'); inpSpacing.min = -20; inpSpacing.max = 120;
  const inpLineGap = T.input('number', '', '120'); inpLineGap.min = 60; inpLineGap.max = 320;
  const chkItalic = T.input('checkbox', '');
  const chkMap = T.input('checkbox', ''); chkMap.checked = true;
  const inpStagger = T.input('number', '', '90'); inpStagger.min = 0; inpStagger.max = 2000;
  const inpHold = T.input('number', '', '800'); inpHold.min = 0; inpHold.max = 2000;
  const inpDur = T.input('number', '', '2500'); inpDur.min = 200;
  const chkExtend = T.input('checkbox', ''); chkExtend.checked = true;
  const inpSeed = T.input('number', '', '3'); inpSeed.min = 1;
  const inpProject = T.input('text', 'Nama project…', 'Trim Path');
  const inpFile = T.input('text', 'Otomatis: teks#preset', '');

  root.appendChild(T.field('Teks', inpText));
  root.appendChild(T.grid2(T.field('Preset animasi', selPreset), T.field('Style', selStyle)));
  root.appendChild(T.grid2(T.field('Ukuran huruf (10–120)', inpSize), T.field('Jarak huruf (-20–120)', inpSpacing)));
  root.appendChild(T.grid2(T.field('Jarak baris (60–320)', inpLineGap), T.field('Kurva gerak', selCurve)));
  const iw = T.el('<label class="dim" style="font-size:13px;display:flex;gap:8px;align-items:center;margin:4px 0"></label>');
  iw.appendChild(chkItalic); iw.appendChild(document.createTextNode('Italic (miring)'));
  root.appendChild(iw);
  const mw = T.el('<label class="dim" style="font-size:13px;display:flex;gap:8px;align-items:center;margin:4px 0"></label>');
  mw.appendChild(chkMap); mw.appendChild(document.createTextNode('Color mapping — warnai tiap huruf dari palet'));
  root.appendChild(mw);
  root.appendChild(T.el('<div class="dim" style="font-size:13px;font-weight:700;margin:10px 0 4px">🎨 Palet warna</div>'));
  root.appendChild(AL.paletteUI(colorState, () => {}));
  root.appendChild(T.grid2(T.field('Stagger, ms (0–2000)', inpStagger), T.field('Tahan akhir, ms (0–2000)', inpHold)));
  root.appendChild(T.grid2(T.field('Durasi layer, ms (≥200)', inpDur), T.field('Seed acak', inpSeed)));
  const ew = T.el('<label class="dim" style="font-size:13px;display:flex;gap:8px;align-items:center;margin:4px 0"></label>');
  ew.appendChild(chkExtend); ew.appendChild(document.createTextNode('Perpanjang layer sampai akhir scene'));
  root.appendChild(ew);
  root.appendChild(T.grid2(T.field('Nama project', inpProject), T.field('Nama file (opsional)', inpFile)));

  const status = T.el('<div class="dim" style="font-size:12.5px;margin:8px 0"></div>');
  const prevBox = T.el('<div style="margin:8px 0"></div>');
  const xmlOut = T.ta(8, 'XML hasil akan muncul di sini…'); xmlOut.readOnly = true;
  xmlOut.style.fontFamily = 'monospace'; xmlOut.style.fontSize = '11px';
  let last = null;
  const hist = AL.historyUI('trimpath', (xml) => { last = { xml }; xmlOut.value = xml; status.textContent = 'XML dari riwayat dimuat.'; });

  function collect() {
    return {
      text: inpText.value, presetId: selPreset.value, styleId: selStyle.value, curve: selCurve.value,
      size: Math.max(10, Math.min(120, +inpSize.value || 64)),
      spacing: Math.max(-20, Math.min(120, +inpSpacing.value || 0)),
      italic: chkItalic.checked, colorMap: chkMap.checked,
      stagger: Math.max(0, Math.min(2000, +inpStagger.value || 0)),
      endHold: Math.max(0, Math.min(2000, +inpHold.value || 0)),
      layerMs: Math.max(200, +inpDur.value || 2500), extend: chkExtend.checked,
      seed: Math.max(1, +inpSeed.value || 1),
      colorState, project: inpProject.value, filename: inpFile.value,
    };
  }
  function doGenerate() {
    status.textContent = '⏳ Men-trace huruf…';
    setTimeout(() => {
      try {
        const r = generate(collect());
        last = r; xmlOut.value = r.xml; prevBox.innerHTML = r.svg;
        status.innerHTML = '✅ Siap — <b>' + T.esc(r.paths) + ' path</b> · durasi ' + r.totalMs + ' ms · <span class="dim">' + T.esc(r.filename) + '</span>';
        AL.history.push('trimpath', { filename: r.filename, project: inpProject.value, preset: (PRESETS.find((p) => p.id === selPreset.value) || {}).name, xml: r.xml });
        hist.refresh();
      } catch (e) { status.innerHTML = '<span class="err">❌ ' + T.esc(e.message) + '</span>'; }
    }, 30);
  }
  root.appendChild(T.row(T.btn('⚙️ Generate XML', doGenerate, true)));
  root.appendChild(status);
  root.appendChild(T.el('<div class="dim" style="font-size:13px;font-weight:700;margin:8px 0 4px">👁️ Preview path</div>'));
  root.appendChild(prevBox);
  root.appendChild(T.field('Lihat XML hasil', xmlOut));
  root.appendChild(T.row(
    T.btn('⬇️ Unduh XML', () => {
      if (!last) { T.toast('Generate dulu XML-nya'); return; }
      const err = AL.downloadXml(last.filename || 'trimpath.xml', last.xml);
      T.toast(err || 'Mengunduh…');
    }, true),
    T.copyBtn(() => (last ? last.xml : ''), '📋 Salin XML'),
  ));
  root.appendChild(T.el('<div class="dim" style="font-size:13px;font-weight:700;margin:12px 0 4px">🕘 Riwayat</div>'));
  root.appendChild(hist);
  root.appendChild(T.el('<p class="dim" style="font-size:12px;margin-top:10px">💡 Di Alight Motion, efek trim memakai keyframe <i>trimStart/trimEnd</i> pada tiap path. Karena path hasil trace tertutup, animasi menggambar dimulai dari titik awal kontur.</p>'));
}
