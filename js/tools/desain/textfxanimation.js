import { h as T, utils } from '../../core.js?v=6.9.20';

/* textfxanimation — "Text FX Animation": 5 preset efek teks kinetik -> XML Alight Motion.
   100% client-side, clean-room. Koreografi keyframe orisinal. */
const AL = utils.alight;

export const meta = {
  id: 'textfxanimation', name: 'Animasi FX Teks', cat: 'desain', icon: '💥',
  desc: '5 efek teks kinetik (pop, ketik, gelombang, glitch, geser) → XML Alight Motion.',
  keywords: 'teks,fx,efek,alight motion,xml,kinetik,glitch,typewriter',
};

/* Koreografi orisinal per preset. t ternormalisasi 0..1 dari dur. */
const PRESETS = [
  { id: 'pop', name: 'Pop', dur: 1600,
    build: (kfT) => ({
      scale: [AL.kf(kfT(0), '0.000014,0.000014'), AL.kf(kfT(.45), '1.120000,1.120000', 'elastic(0.50,1.00,0.00,0.55)'), AL.kf(kfT(.7), '1.000000,1.000000', 'cubicBezier(0.33,0.00,0.67,1.00)')],
      opacity: [AL.kf(kfT(0), '0.000000'), AL.kf(kfT(.12), '1.000000')],
    }) },
  { id: 'ketik', name: 'Ketik', dur: 900,
    build: (kfT) => ({
      opacity: [AL.kf(kfT(0), '0.000000'), AL.kf(kfT(.02), '1.000000')],
      location: null, // posisi statis; mesin ketik dari stagger
    }) },
  { id: 'gelombang', name: 'Gelombang', dur: 2400,
    build: (kfT, u, i) => {
      const ph = (i % 8) / 8 * Math.PI * 2;
      const y = (t, amp) => Math.sin(ph + t * Math.PI * 2) * amp;
      return {
        location: [0, .25, .5, .75, 1].map((t) =>
          AL.kf(kfT(t), AL.f6(u.x) + ',' + AL.f6(u.y + y(t, 46)) + ',0.000000',
            t === 0 ? undefined : 'cubicBezier(0.37,0.00,0.63,1.00)')),
        opacity: [AL.kf(kfT(0), '0.000000'), AL.kf(kfT(.1), '1.000000')],
      };
    } },
  { id: 'glitch', name: 'Glitch', dur: 1400,
    build: (kfT, u, i) => {
      const rng = AL.mulberry32(1000 + i);
      const jx = () => AL.f6(u.x + (rng() * 2 - 1) * 26);
      return {
        location: [AL.kf(kfT(0), jx() + ',' + AL.f6(u.y) + ',0.000000'),
          AL.kf(kfT(.18), jx() + ',' + AL.f6(u.y) + ',0.000000'),
          AL.kf(kfT(.36), AL.f6(u.x) + ',' + AL.f6(u.y) + ',0.000000', 'cubicBezier(0.33,0.00,0.67,1.00)')],
        opacity: [AL.kf(kfT(0), '0.000000'), AL.kf(kfT(.05), '1.000000'), AL.kf(kfT(.22), '0.250000'), AL.kf(kfT(.36), '1.000000')],
      };
    } },
  { id: 'geser', name: 'Geser Pudar', dur: 1800,
    build: (kfT) => ({
      location: [AL.kf(kfT(0), 'off'), AL.kf(kfT(.5), '0,0,0', 'cubicBezier(0.00,0.00,0.16,1.00)')],
      opacity: [AL.kf(kfT(0), '0.000000'), AL.kf(kfT(.15), '1.000000')],
      blur: [AL.kf(kfT(0), '0.120000'), AL.kf(kfT(.4), '0.000000')],
    }) },
];

const FONTS = ['Lexend', 'Exo', 'Inter', 'Poppins', 'Montserrat', 'Plus Jakarta Sans'];
const WEIGHTS = [['300', 'Light'], ['400', 'Regular'], ['500', 'Medium'], ['600', 'Semi Bold'], ['700', 'Bold'], ['800', 'Extra Bold'], ['900', 'Black']];

let _mctx = null;
function measureCh(ch, fontCss, size) {
  if (typeof document !== 'undefined') {
    try {
      if (!_mctx) _mctx = document.createElement('canvas').getContext('2d');
      _mctx.font = fontCss; return _mctx.measureText(ch).width;
    } catch (e) {}
  }
  return String(ch).length * size * 0.62;
}

export function generate(o) {
  const text = String(o.text || '').trim();
  if (!text) throw new Error('Teks masih kosong — isi dulu teksnya.');
  const preset = PRESETS.find((p) => p.id === o.presetId) || PRESETS[0];
  let units = AL.layoutText(text, {
    maxLines: 4, mode: o.mode, font: o.font, weight: o.weight,
    size: o.size, spacing: o.spacing, lineGap: o.size * 1.5, measure: measureCh,
  });
  if (o.mode === 'word') {
    // Mode kata: gabungkan huruf per kata jadi satu unit/layer.
    const byWord = new Map();
    units.forEach((u) => { if (!byWord.has(u.word)) byWord.set(u.word, []); byWord.get(u.word).push(u); });
    units = [...byWord.values()].map((g) => ({ ch: g.map((x) => x.ch).join(''), word: g[0].word, x: g[0].x, y: g[0].y }));
  }
  if (!units.length) throw new Error('Teks masih kosong — isi dulu teksnya.');
  const plan = AL.timingPlan(units.length, o);
  const palette = o.colorState.activeColors();
  const kfT = (t) => t * preset.dur;
  const layers = [];
  let id = 9; const parentId = 8;

  units.forEach((u, i) => {
    const fx = preset.build(kfT, u, i);
    let loc = fx.location;
    if (preset.id === 'geser') {
      loc = [AL.kf(kfT(0), AL.f6(u.x + 420) + ',' + AL.f6(u.y) + ',0.000000'),
             AL.kf(kfT(.5), AL.f6(u.x) + ',' + AL.f6(u.y) + ',0.000000', 'cubicBezier(0.00,0.00,0.16,1.00)')];
    } else if (!loc) {
      loc = [AL.kf(0, AL.f6(u.x) + ',' + AL.f6(u.y) + ',0.000000')];
    }
    // Color replacement: palet -> warna tiap unit (seperti tool acuan)
    const col = o.colorReplace ? AL.colorFor(o.colorState.mode, palette, i, units.length, o.colorState.repeatEvery) : o.singleColor;
    layers.push(AL.textLayer({
      id: id++, parent: parentId, label: u.ch, startMs: plan.starts[i], endMs: plan.ends[i],
      size: o.size, font: o.font + '-' + o.weight, content: u.ch,
      transform: AL.xform({
        location: loc,
        scale: fx.scale || [],
        rotation: fx.rotation || [],
        opacity: fx.opacity || [AL.kf(0, '1.000000')],
        blur: fx.blur || [],
      }),
      fillArgb: AL.argb(col),
    }));
  });
  layers.push(AL.nullLayer({ id: parentId, label: 'FX Teks', startMs: 0, endMs: plan.total, x: 540, y: 540, hidden: true }));

  const xml = AL.buildScene({ title: AL.projectName(o.project, 'FX Teks'), totalMs: plan.total, inner: layers.join('\n') });
  const v = AL.validate(xml);
  if (!v.ok) throw new Error(v.error);
  return { xml, filename: AL.fileFor(o.filename, preset.id, o.text), totalMs: plan.total, layers: units.length };
}

export function render(root) {
  const colorState = { mode: 'single', paletteIndex: 4, repeatEvery: 1, customId: null };
  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Lima efek teks kinetik siap pakai → <b>XML Alight Motion</b>. Nyalakan <i>color replacement</i> supaya warna efek mengikuti palet pilihanmu.</p>'));

  const inpText = T.ta(3, 'Tulis teks di sini…', 'hello world');
  const selPreset = T.select(PRESETS.map((p) => [p.id, p.name]), 'pop');
  const selMode = T.select([['char', 'Per karakter'], ['word', 'Per kata']], 'char');
  const selFont = T.select(FONTS.map((f) => [f, f]), 'Poppins');
  const selWeight = T.select(WEIGHTS, '600');
  const inpSize = T.input('number', '', '56'); inpSize.min = 8; inpSize.max = 120;
  const inpSpacing = T.input('number', '', '6'); inpSpacing.min = 0; inpSpacing.max = 420;
  const chkReplace = T.input('checkbox', ''); chkReplace.checked = true;
  const inpSingle = T.input('color', ''); inpSingle.value = '#FFFFFF';
  const inpStagger = T.input('number', '', '55'); inpStagger.min = 0; inpStagger.max = 2000;
  const inpSpread = T.input('number', '', '0'); inpSpread.min = 0; inpSpread.max = 10000;
  const inpDur = T.input('number', '', '3500'); inpDur.min = 200;
  const inpProject = T.input('text', 'Nama project…', 'FX Teks');
  const inpFile = T.input('text', 'Otomatis: teks#preset', '');

  root.appendChild(T.field('Teks', inpText));
  root.appendChild(T.grid2(T.field('Preset FX', selPreset), T.field('Mode layer', selMode)));
  root.appendChild(T.grid2(T.field('Font', selFont), T.field('Weight', selWeight)));
  root.appendChild(T.grid2(T.field('Ukuran font (8–120)', inpSize), T.field('Jarak huruf (0–420)', inpSpacing)));
  const rw = T.el('<label class="dim" style="font-size:13px;display:flex;gap:8px;align-items:center;margin:4px 0"></label>');
  rw.appendChild(chkReplace); rw.appendChild(document.createTextNode('Color replacement — warna efek mengikuti palet'));
  root.appendChild(rw);
  root.appendChild(T.field('Warna tunggal (bila replacement mati)', inpSingle));
  root.appendChild(T.el('<div class="dim" style="font-size:13px;font-weight:700;margin:10px 0 4px">🎨 Palet warna</div>'));
  root.appendChild(AL.paletteUI(colorState, () => {}));
  root.appendChild(T.grid2(T.field('Stagger, ms (0–2000)', inpStagger), T.field('Spread, ms (0–10000)', inpSpread)));
  root.appendChild(T.grid2(T.field('Durasi layer, ms (≥200)', inpDur), T.field('Nama project', inpProject)));
  root.appendChild(T.field('Nama file (opsional)', inpFile));

  const status = T.el('<div class="dim" style="font-size:12.5px;margin:8px 0"></div>');
  const xmlOut = T.ta(10, 'XML hasil akan muncul di sini…'); xmlOut.readOnly = true;
  xmlOut.style.fontFamily = 'monospace'; xmlOut.style.fontSize = '11px';
  let last = null;
  const hist = AL.historyUI('textfxanimation', (xml) => { last = { xml }; xmlOut.value = xml; status.textContent = 'XML dari riwayat dimuat.'; });

  function collect() {
    return {
      text: inpText.value, presetId: selPreset.value, mode: selMode.value,
      font: selFont.value, weight: selWeight.value, size: Math.max(8, Math.min(120, +inpSize.value || 56)),
      spacing: Math.max(0, Math.min(420, +inpSpacing.value || 0)),
      colorReplace: chkReplace.checked, singleColor: inpSingle.value,
      stagger: Math.max(0, Math.min(2000, +inpStagger.value || 0)),
      spread: Math.max(0, Math.min(10000, +inpSpread.value || 0)),
      layerMs: Math.max(200, +inpDur.value || 3500), seed: 5,
      colorState, project: inpProject.value, filename: inpFile.value,
    };
  }
  function doGenerate() {
    try {
      const r = generate(collect());
      last = r; xmlOut.value = r.xml;
      status.innerHTML = '✅ XML siap — <b>' + T.esc(r.layers) + ' layer</b> · durasi ' + r.totalMs + ' ms · <span class="dim">' + T.esc(r.filename) + '</span>';
      AL.history.push('textfxanimation', { filename: r.filename, project: inpProject.value, preset: (PRESETS.find((p) => p.id === selPreset.value) || {}).name, xml: r.xml });
      hist.refresh();
    } catch (e) { status.innerHTML = '<span class="err">❌ ' + T.esc(e.message) + '</span>'; }
  }
  root.appendChild(T.row(T.btn('⚙️ Generate XML', doGenerate, true)));
  root.appendChild(status);
  root.appendChild(T.field('Lihat XML hasil', xmlOut));
  root.appendChild(T.row(
    T.btn('⬇️ Unduh XML', () => {
      if (!last) { T.toast('Generate dulu XML-nya'); return; }
      const err = AL.downloadXml(last.filename || 'animasi.xml', last.xml);
      T.toast(err || 'Mengunduh…');
    }, true),
    T.copyBtn(() => (last ? last.xml : ''), '📋 Salin XML'),
  ));
  root.appendChild(T.el('<div class="dim" style="font-size:13px;font-weight:700;margin:12px 0 4px">🕘 Riwayat</div>'));
  root.appendChild(hist);
}
