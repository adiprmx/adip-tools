import { h as T, utils } from '../../core.js?v=6.9.20';

/* text2d — "Animasi Teks 2D": 10 preset animasi teks 2D kinetik -> XML Alight Motion.
   100% client-side. Struktur XML diselaraskan dengan tool acuan (node <kf t/v/e>,
   <pivot>, efek gaussianblur, atribut layer & scene ala Alight Motion). */
const AL = utils.alight;

export const meta = {
  id: 'text2d', name: 'Animasi Teks 2D', cat: 'desain', icon: '✨',
  desc: '10 preset animasi teks 2D kinetik → export XML Alight Motion.',
  keywords: 'teks,animasi,2d,alight motion,xml,kinetik,elastic,bounce',
};

/* Tabel keyframe tiap preset: t ternormalisasi 0..1 terhadap durasi preset (dur, ms).
   e = string easing persis format XML Alight Motion. pivot = <pivot value>. */
const PRESETS = [
  { id: 'blur', name: 'Blur', dur: 1999, pivot: '0.000000,39.666653',
    location: [{ t: 0, off: [396, 0, 0] }, { t: .325163, off: [0, 0, 0], e: 'cubicBezier 0.0 0.0 0.040176973 1.0' }],
    scaleValue: '2.140850,2.140850',
    opacity: [{ t: .0385, v: '0.000000' }, { t: .172, v: '1.000000' }],
    blur: [{ t: 0, v: '0.150000' }, { t: .133567, v: '0.000000' }] },
  { id: 'elastic', name: 'Elastic', dur: 1999, pivot: '0.000000,39.666653',
    location: [{ t: 0, off: [123, 0, 0] }, { t: .325163, off: [0, 0, 0], e: 'local elastic 0.5 1.0 0.0 0.30324566' }],
    scale: [{ t: 0, v: '0.000014,0.000025' }, { t: .2885, v: '2.140850,2.140850', e: 'local elastic 0.3960177 1.0 0.0 0.44754386' }],
    rotation: [{ t: 0, v: '28.536585' }, { t: .333667, v: '0.000000', e: 'local elastic 0.44321534 1.0 0.06710528 0.7114035' }] },
  { id: 'squishrot', name: 'Squish Rot', dur: 1999, pivot: '0.000000,39.666653',
    location: [{ t: 0, off: [-6.333, 218.333, 0] }, { t: .325163, off: [0, 0, 0], e: 'local elastic 0.5 1.0 0.0 0.4063158' }],
    scale: [{ t: 0, v: '0.000014,0.000031' }, { t: .397, v: '2.140850,2.140850', e: 'local elastic 0.5 1.0 0.0 1.0' }],
    rotation: [{ t: 0, v: '51.585365' }, { t: .425213, v: '0.000000', e: 'local elastic 0.5 1.0 0.0 0.65368426' }],
    opacity: [{ t: .092046, v: '0.000000' }, { t: .167084, v: '1.000000' }] },
  { id: 'squishup', name: 'Squish Up', dur: 1999, pivot: '0.000000,39.666653',
    location: [{ t: 0, off: [0, -230.003, 0] }, { t: .325163, off: [0, 0, 0], e: 'local elastic 0.5 1.0 0.0 0.4063158' }],
    scale: [{ t: 0, v: '0.000014,0.000031' }, { t: .397, v: '2.140850,2.140850', e: 'local elastic 0.5 1.0 0.0 1.0' }],
    rotation: [{ t: 0, v: '-46.097561' }, { t: .425213, v: '0.000000', e: 'local elastic 0.5 1.0 0.0 0.65368426' }],
    opacity: [{ t: .092046, v: '0.000000' }, { t: .167084, v: '1.000000' }] },
  { id: 'up', name: 'Up', dur: 1999, pivot: '0.000000,-34.000004',
    location: [{ t: 0, off: [0, -100.667, 0] }, { t: .325163, off: [0, 0, 0], e: 'local elastic 0.5 1.0 0.0 0.4063158' }],
    scale: [{ t: 0, v: '0.000014,0.000031' }, { t: .397, v: '2.140850,2.140850', e: 'local elastic 0.5 1.0 0.0 1.0' }],
    rotation: [{ t: 0, v: '-46.097561' }, { t: .425213, v: '0.000000', e: 'local elastic 0.5 1.0 0.0 0.65368426' }] },
  { id: 'bouncemove', name: 'Bounce Move', dur: 1999, pivot: '0.000000,36.333332',
    location: [{ t: 0, off: [135.333190, 0, 0] }, { t: .333667, off: [0, 0, 0], e: 'cubicBezier 0.0 0.20526315 0.0014749262 1.0' }],
    scale: [{ t: 0, v: '1.000000,0.000000' }, { t: .351, v: '1.000000,1.000000', e: 'local elastic 0.33554572 1.0 0.16192983 0.60833335' }],
    opacity: [{ t: 0, v: '0.000000' }, { t: .146073, v: '1.000000' }],
    wordNull: { dur: 2541, location: [
      { t: 0, off: [-97.333374, 1.000061, 0] },
      { t: .095977, off: [48.852356, 0, 0], e: 'cubicBezier 0.0 0.0 0.20094393 1.0' },
      { t: .3253, off: [0, 0, 0], e: 'cubicBezier 0.42 0.0 0.100648955 1.0' } ] } },
  { id: 'stretchhalf', name: 'Stretch Half', dur: 1999,
    location: [{ t: 0, off: [217.333313, 0, 0] }, { t: .229615, off: [0, 0, 0], e: 'cubicBezier 0.0 0.0 0.16407079 1.0' }],
    scale: [
      { t: 0, v: '1.000000,0.000000' },
      { t: .083542, v: '1.000000,2.098188', e: 'cubicBezier 0.33997053 0.8105263 0.32227138 1.0' },
      { t: .351, v: '1.000000,1.000000', e: 'cubicBezier 0.8860767 0.0 0.22306783 1.0' },
      { t: .729865, v: '1.000000,1.000000' },
      { t: .7675, v: '1.000000,0.892857', e: 'cubicBezier 0.42 0.0 0.58 1.0' },
      { t: .8925, v: '1.000000,1.882440', e: 'cubicBezier 0.43952802 0.0 0.0 1.0' },
      { t: .97999, v: '1.000000,0.000016', e: 'cubicBezier 1.0 0.0 0.75 0.75' }],
    opacity: [{ t: 0, v: '0.000000' }, { t: .021011, v: '1.000000' }] },
  { id: 'blurup', name: 'Blur Up', dur: 2958,
    location: [{ t: 0, off: [0, 177.333327, 0] }, { t: .155173, off: [0, 0, 0], e: 'cubicBezier 0.0 0.0 0.16407079 1.0' }],
    opacity: [{ t: 0, v: '0.000000' }, { t: .054064, v: '1.000000' }],
    blur: [{ t: 0, v: '0.060000' }, { t: .124684, v: '0.000000' }] },
  { id: 'randomin', name: 'Random In', dur: 2124, randomIn: true,
    opacity: [{ t: 0, v: '0.000000' }, { t: .06, v: '1.000000' }] },
  { id: 'randominout', name: 'Random In & Out', dur: 2124, randomInOut: true },
];

/* Jalur offset acak per huruf (dipilih berdasar indeks huruf, bukan RNG):
   start -> elbowIn -> posisi akhir, lalu (In & Out) -> elbowOut -> exit. */
const RANDOM_INOUT_OFFSETS = [
  { start: [178.667, 112.667], elbowIn: [5, 112.667], elbowOut: [0, -120], elbowOutE: 'cubicBezier 0.8724189 0.0 0.57743365 0.9631579', exit: [-92.336, -116.333], exitE: 'cubicBezier 0.7979351 0.0 0.4461652 1.0' },
  { start: [-124.664, -93.669], elbowIn: [-1.858, -93.669], elbowOut: [-82.333, 2], elbowOutE: 'cubicBezier 0.7337758 0.0 0.41666666 1.0', exit: [-81.91, 104.333], exitE: 'cubicBezier 0.6983776 0.0 0.49041298 1.0' },
  { start: [118.938, 98.338], elbowIn: [5.332, 109.768], elbowOut: [-0.026, -122.296], elbowOutE: 'cubicBezier 0.5980826 0.0 0.37241888 1.0', exit: [130.333, -134.667], exitE: 'cubicBezier 0.6246313 0.0 0.5317109 1.0' },
  { start: [118.938, -110.329], elbowIn: [-1.291, -96.228], elbowOut: [0.333, 96], elbowOutE: 'cubicBezier 0.649705 0.0 0.4181416 1.0', exit: [-145.667, 101.333], exitE: 'cubicBezier 0.7352507 0.0 0.42846608 1.0' },
  { start: [-101.298, 85.602], elbowIn: [-1.298, 78.106], elbowOut: [0, -118.89], elbowOutE: 'cubicBezier 0.64675516 0.0 0.3561947 1.0', exit: [0, -10.223], exitE: 'cubicBezier 0.7721239 0.0 0.42256638 1.0' },
  { start: [178.667, 112.667], elbowIn: [5, 112.667], elbowOut: [-269, 1.885], elbowOutE: 'cubicBezier 0.8207965 0.0 0.39159292 1.0', exit: [-269, -139.451], exitE: 'cubicBezier 0.7116519 0.023684211 0.41961652 1.0' },
  { start: [-124.664, -93.669], elbowIn: [-1.858, -93.669], elbowOut: [0, 97.12], elbowOutE: 'cubicBezier 0.7632743 0.0 0.46828908 1.0', exit: [135, 95.453], exitE: 'cubicBezier 0.7912979 0.0 0.59513277 0.95526314' },
  { start: [118.938, 98.338], elbowIn: [5.332, 109.768], elbowOut: [5.332, -128.333], elbowOutE: 'cubicBezier 0.7219764 0.0 0.38569322 1.0', exit: [-161.333, -128.333], exitE: 'cubicBezier 0.7632743 0.0 0.45501474 1.0' },
  { start: [118.938, -110.329], elbowIn: [-1.291, -96.228], elbowOut: [9, 99], elbowOutE: 'cubicBezier 0.6143068 0.05263158 0.41519174 1.0', exit: [307.333, 99], exitE: 'cubicBezier 0.7794985 0.0 0.41961652 0.9894737' },
  { start: [-101.298, 85.602], elbowIn: [-1.298, 78.106], elbowOut: [6.021, -128.333], elbowOutE: 'cubicBezier 0.6423304 0.0 0.29277286 0.92368424', exit: [161.354, -128.333], exitE: 'cubicBezier 0.7912979 0.0 0.47566372 1.0' },
  { start: [138.702, -90.583], elbowIn: [-1.605, -90.158], elbowOut: [-197.025, 0], elbowOutE: 'cubicBezier 0.66297936 0.0 0.4358407 1.0', exit: [-197.025, -152], exitE: 'cubicBezier 0.66150445 0.0 0.5140118 1.0' },
  { start: [104.336, 78.106], elbowIn: [-1.298, 78.106], elbowOut: [-103.576, 0], elbowOutE: 'cubicBezier 0.8119469 0.0 0.4019174 1.0', exit: [-103.576, -134.4], exitE: 'cubicBezier 0.60103244 0.0 0.49778762 1.0' },
  { start: [-105.601, -81.239], elbowIn: [0.97, -81.239], elbowOut: [0.97, 95.453], elbowOutE: 'cubicBezier 0.7632743 0.0 0.39749262 1.0', exit: [-146.364, 95.453], exitE: 'cubicBezier 0.8045723 0.0 0.36651918 1.0' },
];
const RI_IN_E1 = 'cubicBezier 0.42 0.0 0.15227138 1.0';
const RI_IN_E2 = 'cubicBezier 0.67330384 0.015789473 0.32669616 1.0';
function randomInLocation(i) {
  const o = RANDOM_INOUT_OFFSETS[i % RANDOM_INOUT_OFFSETS.length];
  return [
    { t: 0, off: [o.start[0], o.start[1], 0] },
    { t: .114820, off: [o.elbowIn[0], o.elbowIn[1], 0], e: RI_IN_E1 },
    { t: .235405, off: [0, 0, 0], e: RI_IN_E2 },
  ];
}
/* Titik jangkar akhir dipetakan relatif ke durasi layer aktual (bukan durasi preset). */
function endAnchored(dur, refDur, gapMs, minFrac) {
  return Math.max(minFrac, 1 - gapMs / dur) * dur / refDur;
}
function randomInOutLocation(i, dur, refDur) {
  const o = RANDOM_INOUT_OFFSETS[i % RANDOM_INOUT_OFFSETS.length];
  return [
    { t: 0, off: [o.start[0], o.start[1], 0] },
    { t: .114820, off: [o.elbowIn[0], o.elbowIn[1], 0], e: RI_IN_E1 },
    { t: .235405, off: [0, 0, 0], e: RI_IN_E2 },
    { t: endAnchored(dur, refDur, 540, .40), off: [0, 0, 0] },
    { t: endAnchored(dur, refDur, 297, .45), off: [o.elbowOut[0], o.elbowOut[1], 0], e: o.elbowOutE },
    { t: endAnchored(dur, refDur, 40, .50), off: [o.exit[0], o.exit[1], 0], e: o.exitE },
  ];
}
function randomInOutOpacity(dur, refDur) {
  return [
    { t: 0, v: '0.000000' },
    { t: .06, v: '1.000000' },
    { t: endAnchored(dur, refDur, 297, .45), v: '1.000000' },
    { t: endAnchored(dur, refDur, 40, .50), v: '0.000000' },
  ];
}

const FONTS = ['Lexend', 'Exo', 'Inter', 'Poppins', 'Montserrat', 'Manrope', 'Plus Jakarta Sans', 'Sora', 'DM Sans', 'Space Grotesk', 'Outfit', 'Urbanist', 'Rubik', 'Raleway', 'Oswald', 'Bebas Neue', 'Anton', 'Archivo Black', 'League Spartan', 'Orbitron', 'Nunito Sans'];
const WEIGHTS = [['300', 'Light'], ['400', 'Regular'], ['500', 'Medium'], ['600', 'Semi Bold'], ['700', 'Bold'], ['800', 'Extra Bold'], ['900', 'Black']];
const FONT_LABEL = { '300': 'Light', '400': 'Regular', '500': 'Medium', '600': 'Semi Bold', '700': 'Bold', '800': 'Extra Bold', '900': 'Black' };
const fontFileName = (font, weight) => ((font + '-' + (FONT_LABEL[weight] || 'Bold')).replace(/\s+/g, '') + '.ttf');

/* ---- Layout teks: advance seragam = spacing px per huruf (tengah di titik 0,0).
   Parent null di 540,540 yang mengangkatnya ke tengah layar di Alight Motion. ---- */
function layoutUnits(text, mode, spacing, lineGap) {
  const lines = String(text == null ? '' : text).split('\n');
  const units = [];
  let wordSeq = 0;
  lines.forEach((line, li) => {
    const y = (li - (lines.length - 1) / 2) * lineGap;
    if (mode === 'word') {
      const matches = line.match(/\S+/g) || [];
      const widths = matches.map((w) => Math.max(spacing * 1.2, w.length * spacing * .72));
      const totalW = widths.reduce((a, b) => a + b, 0) + Math.max(0, matches.length - 1) * spacing;
      let x = -totalW / 2;
      matches.forEach((word, wi) => {
        const w = widths[wi];
        units.push({ ch: word, x: x + w / 2, y, word: wordSeq++ });
        x += w + spacing;
      });
    } else {
      let totalW = 0;
      [...line].forEach((ch) => { totalW += ch === ' ' ? spacing * .55 : spacing; });
      let x = -totalW / 2 + spacing / 2;
      let curWord = wordSeq++;
      [...line].forEach((ch) => {
        if (ch === ' ') { x += spacing * .55; curWord = wordSeq++; return; }
        units.push({ ch, x, y, word: curWord });
        x += spacing;
      });
    }
  });
  return units;
}

/* ---- Timing: stagger mengikuti kurva smooth (cubic bezier) + jitter seed ---- */
const smoothY = (t) => { const u = 1 - t; return 3 * u * t * t + t * t * t; };
const seeded = (i, seed) => { const x = Math.sin((i + 1) * 999 + seed * 77) * 10000; return x - Math.floor(x); };
function timingPlan(n, o) {
  const spread = Math.max(0, +o.spread || 0);
  const stagger = Math.max(0, +o.stagger || 0);
  const randomAmt = Math.max(0, Math.min(100, +o.random || 0)) / 100;
  const seed = Math.max(1, +o.seed || 1);
  const maxBase = Math.max(spread, stagger * Math.max(0, n - 1));
  const starts = [];
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0 : i / (n - 1);
    let base = Math.round(smoothY(t) * maxBase);
    base += Math.round((seeded(i + 31, seed) - .5) * randomAmt * stagger * 2);
    starts.push(Math.max(0, base));
  }
  const duration = Math.max(200, Math.round(+o.layerMs || 4000));
  const finalEnd = Math.max(duration, ...starts.map((v) => v + duration));
  const extend = o.extend !== false;
  return { starts, ends: starts.map((v) => (extend ? finalEnd : v + duration)), total: Math.max(1000, finalEnd) };
}

/* ---- Warna per huruf: single | repeat | mirror | linear (gradasi palet) ---- */
function lerpAcross(colors, t) {
  if (!colors.length) return '#FFFFFF';
  if (colors.length === 1) return colors[0];
  const x = Math.max(0, Math.min(1, t)) * (colors.length - 1);
  const i = Math.min(colors.length - 2, Math.floor(x)), f = x - i;
  const a = AL.hexToRgb(colors[i]) || [255, 255, 255], b = AL.hexToRgb(colors[i + 1]) || [255, 255, 255];
  return '#' + a.map((v, k) => Math.max(0, Math.min(255, Math.round(v + (b[k] - v) * f))).toString(16).padStart(2, '0')).join('').toUpperCase();
}
function roleColor(i, n, colorState) {
  const colors = (colorState.activeColors() || []).map((c) => String(c).toUpperCase());
  const mode = colorState.mode || 'single';
  if (mode === 'single' || !colors.length) return colors[0] || '#FFFFFF';
  if (mode === 'repeat') { const k = Math.max(1, colorState.repeatEvery | 0 || 1); return colors[Math.floor(i / k) % colors.length]; }
  const t = n <= 1 ? 0 : i / (n - 1);
  return lerpAcross(colors, mode === 'mirror' ? (t <= .5 ? t * 2 : (1 - t) * 2) : t);
}

/* ---- Pembangun XML ala Alight Motion ---- */
const f6 = (n) => AL.f6(n);
function sceneXml(title, total, inner) {
  return '<?xml version=\'1.0\' encoding=\'UTF-8\' ?>\n<!-- Generated by Adip Tools — Animasi Teks 2D -->\n' +
    '<scene title="' + T.esc(title) + '" width="1080" height="1080" exportWidth="1920" exportHeight="1080" bgcolor="#FF000000" totalTime="' + total +
    '" fps="60" modifiedTime="' + Date.now() + '" amver="859" ffver="107" am="com.alightcreative.motion/6.2.53" amplatform="ios" precompose="dynamicResolution" retime="freeze">\n' +
    '  <bookmark t="0"/>\n' + inner + '\n</scene>\n';
}
/* Keyframe: waktu ternormalisasi 0..1 terhadap durasi layer (t * durPreset / durLayer). */
function textLayerXml(o) {
  const p = o.preset, refDur = p.dur, layerDur = Math.max(1, o.end - o.start);
  const scaleT = (t) => (t * refDur / layerDur).toFixed(6);
  const kf = (k, val) => '<kf t="' + scaleT(k.t) + '" v="' + val + '"' + (k.e ? ' e="' + k.e + '"' : '') + '/>';
  let loc = p.location, op = p.opacity;
  if (p.randomIn) loc = randomInLocation(o.index);
  else if (p.randomInOut) { loc = randomInOutLocation(o.index, layerDur, refDur); op = randomInOutOpacity(layerDur, refDur); }
  const locKfs = (loc || [{ t: 0 }]).map((k) =>
    kf(k, f6(o.unit.x + (k.off ? k.off[0] : 0)) + ',' + f6(o.unit.y + (k.off ? k.off[1] : 0)) + ',0.000000'));
  let s = '  <text id="' + o.id + '" label="' + T.esc(o.label) + '" parent="' + o.parent + '" startTime="' + o.start + '" endTime="' + o.end +
    '" fillType="color" size="' + o.size.toFixed(6) + '" font="imported?name=' + T.esc(o.fontFile) + '" wrapWidth="1200" align="center">\n' +
    '    <transform>\n      <location>\n        ' + locKfs.join('\n        ') + '\n      </location>\n' +
    '      <pivot value="' + (p.pivot || '0.000000,0.000000') + '"/>\n';
  if (p.scaleValue) s += '      <scale value="' + p.scaleValue + '"/>\n';
  else if (p.scale && p.scale.length) s += '      <scale>\n        ' + p.scale.map((k) => kf(k, k.v)).join('\n        ') + '\n      </scale>\n';
  if (p.rotation && p.rotation.length) s += '      <rotation>\n        ' + p.rotation.map((k) => kf(k, k.v)).join('\n        ') + '\n      </rotation>\n';
  if (op && op.length) s += '      <opacity>\n        ' + op.map((k) => kf(k, k.v)).join('\n        ') + '\n      </opacity>\n';
  s += '    </transform>\n    <fillColor value="' + AL.argb(o.fillHex) + '"/>\n';
  if (p.blur && p.blur.length) {
    s += '    <effect id="com.alightcreative.effects.gaussianblur" locallyApplied="true">\n' +
      '      <property name="strength" type="float">\n        ' + p.blur.map((k) => kf(k, k.v)).join('\n        ') + '\n      </property>\n    </effect>\n';
  }
  s += '    <content>' + T.esc(o.content) + '</content>\n  </text>';
  return s;
}
function nullXml(id, parent, start, end, locKfs) {
  return '  <nullobj id="' + id + '" label="Null 1"' + (parent ? ' parent="' + parent + '"' : '') +
    ' startTime="' + start + '" endTime="' + end + '" fillType="none">\n    <transform>\n' +
    (locKfs
      ? '      <location>\n        ' + locKfs.join('\n        ') + '\n      </location>\n'
      : '      <location value="540.000000,540.000000,0.000000"/>\n') +
    '    </transform>\n  </nullobj>';
}

/* Generator murni -> string XML (diexport untuk uji headless). */
export function generate(o) {
  const text = String(o.text == null ? '' : o.text);
  if (!text.trim()) throw new Error('Teks masih kosong — isi dulu teksnya.');
  const preset = PRESETS.find((p) => p.id === o.presetId) || PRESETS[0];
  const spacing = Math.max(1, +o.spacing || 40);
  const lineGap = Math.max(20, +o.lineHeight || 80);
  const units = layoutUnits(text, o.mode, spacing, lineGap);
  if (!units.length) throw new Error('Teks masih kosong — isi dulu teksnya.');
  const plan = timingPlan(units.length, o);
  const size = Math.max(8, Math.min(160, +o.size || 64));
  const fontFile = fontFileName(o.font || 'Lexend', o.weight || '700');

  const layers = [];
  let id = 9;
  const parentId = 8;

  const emitChar = (u, i, lx, ly, par) => {
    const st = plan.starts[i], en = plan.ends[i];
    layers.push(textLayerXml({
      id: id++, parent: par, label: u.ch, content: u.ch, start: st, end: en,
      unit: { x: lx, y: ly }, preset, index: i, size, fontFile,
      fillHex: roleColor(i, units.length, o.colorState),
    }));
  };

  if (preset.wordNull) {
    const groups = new Map();
    units.forEach((u, i) => {
      if (!groups.has(u.word)) groups.set(u.word, []);
      groups.get(u.word).push(i);
    });
    groups.forEach((indices) => {
      const nullId = id++;
      const ax = units[indices[0]].x, ay = units[indices[0]].y;
      const wStart = Math.min(...indices.map((i) => plan.starts[i]));
      const wDur = Math.max(1, plan.total - wStart);
      const wScaleT = (t) => (t * preset.wordNull.dur / wDur).toFixed(6);
      const wKfs = (preset.wordNull.location || []).map((k) =>
        '<kf t="' + wScaleT(k.t) + '" v="' + f6(ax + (k.off ? k.off[0] : 0)) + ',' + f6(ay + (k.off ? k.off[1] : 0)) + ',0.000000"' + (k.e ? ' e="' + k.e + '"' : '') + '/>');
      layers.push(nullXml(nullId, parentId, wStart, plan.total, wKfs));
      indices.forEach((i) => emitChar(units[i], i, units[i].x - ax, units[i].y - ay, nullId));
    });
  } else {
    units.forEach((u, i) => emitChar(u, i, u.x, u.y, parentId));
  }
  layers.push(nullXml(parentId, null, 0, plan.total, null));

  const xml = sceneXml(AL.projectName(o.project, 'Animasi Teks 2D'), plan.total, layers.join('\n'));
  const v = AL.validate(xml);
  if (!v.ok) throw new Error(v.error);
  return { xml, filename: AL.fileFor(o.filename, preset.id, o.text), totalMs: plan.total, layers: units.length };
}

export function render(root) {
  const colorState = { mode: 'single', paletteIndex: 0, repeatEvery: 1, customId: null };
  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Bikin teks kinetik 2D — pilih preset animasi, atur tipografi & timing, lalu export jadi <b>XML siap import ke Alight Motion</b>. Semua proses lokal di perangkatmu.</p>'));

  const inpText = T.ta(3, 'Tulis teks di sini…', 'SALE\n50%');
  const selPreset = T.select(PRESETS.map((p) => [p.id, p.name]), 'elastic');
  const selMode = T.select([['char', 'Per karakter'], ['word', 'Per kata']], 'char');
  const selFont = T.select(FONTS.map((f) => [f, f]), 'Lexend');
  const selWeight = T.select(WEIGHTS, '700');
  const inpSize = T.input('number', '', '64'); inpSize.min = 8; inpSize.max = 160;
  const inpSpacing = T.input('number', '', '40'); inpSpacing.min = 1; inpSpacing.max = 420;
  const inpLineH = T.input('number', '', '80'); inpLineH.min = 20; inpLineH.max = 400;
  const inpStagger = T.input('number', '', '60'); inpStagger.min = 0; inpStagger.max = 2000;
  const inpSpread = T.input('number', '', '0'); inpSpread.min = 0; inpSpread.max = 10000;
  const inpRandom = T.input('number', '', '0'); inpRandom.min = 0; inpRandom.max = 100;
  const inpSeed = T.input('number', '', '12'); inpSeed.min = 1;
  const inpDur = T.input('number', '', '4000'); inpDur.min = 200;
  const chkExtend = T.input('checkbox', ''); chkExtend.checked = true;
  const inpProject = T.input('text', 'Nama project…', 'Animasi Teks 2D');
  const inpFile = T.input('text', 'Otomatis: teks#preset', '');

  root.appendChild(T.field('Teks (boleh beberapa baris)', inpText));
  root.appendChild(T.grid2(T.field('Preset animasi', selPreset), T.field('Mode layer', selMode)));
  root.appendChild(T.grid2(T.field('Font', selFont), T.field('Weight', selWeight)));
  root.appendChild(T.grid2(T.field('Ukuran font (8–160)', inpSize), T.field('Jarak huruf / spacing (1–420)', inpSpacing)));
  root.appendChild(T.grid2(T.field('Jarak baris (20–400)', inpLineH), T.field('Stagger antar huruf, ms (0–2000)', inpStagger)));
  root.appendChild(T.grid2(T.field('Spread total, ms (0–10000)', inpSpread), T.field('Acak timing, % (0–100)', inpRandom)));
  root.appendChild(T.grid2(T.field('Seed acak', inpSeed), T.field('Durasi tiap layer, ms (≥200)', inpDur)));
  const extWrap = T.el('<label class="dim" style="font-size:13px;display:flex;gap:8px;align-items:center;margin:4px 0"></label>');
  extWrap.appendChild(chkExtend); extWrap.appendChild(document.createTextNode('Perpanjang layer sampai akhir scene'));
  root.appendChild(extWrap);
  root.appendChild(T.el('<div class="dim" style="font-size:13px;font-weight:700;margin:10px 0 4px">🎨 Palet warna</div>'));
  root.appendChild(AL.paletteUI(colorState, () => {}));
  root.appendChild(T.grid2(T.field('Nama project', inpProject, 'Tampil sebagai judul scene di Alight Motion'), T.field('Nama file (opsional)', inpFile, 'Otomatis: teks#preset → .xml')));

  const status = T.el('<div class="dim" style="font-size:12.5px;margin:8px 0"></div>');
  const xmlOut = T.ta(10, 'XML hasil akan muncul di sini…'); xmlOut.readOnly = true;
  xmlOut.style.fontFamily = 'monospace'; xmlOut.style.fontSize = '11px';
  let last = null;
  const hist = AL.historyUI('text2d', (xml) => { last = { xml }; xmlOut.value = xml; status.textContent = 'XML dari riwayat dimuat.'; });

  function collect() {
    return {
      text: inpText.value, presetId: selPreset.value, mode: selMode.value,
      font: selFont.value, weight: selWeight.value, size: Math.max(8, Math.min(160, +inpSize.value || 64)),
      spacing: Math.max(1, Math.min(420, +inpSpacing.value || 40)),
      lineHeight: Math.max(20, Math.min(400, +inpLineH.value || 80)),
      stagger: Math.max(0, Math.min(2000, +inpStagger.value || 0)),
      spread: Math.max(0, Math.min(10000, +inpSpread.value || 0)),
      random: Math.max(0, Math.min(100, +inpRandom.value || 0)),
      seed: Math.max(1, +inpSeed.value || 1),
      layerMs: Math.max(200, +inpDur.value || 4000), extend: chkExtend.checked,
      colorState, project: inpProject.value, filename: inpFile.value,
    };
  }
  function doGenerate() {
    try {
      const r = generate(collect());
      last = r; xmlOut.value = r.xml;
      status.innerHTML = '✅ XML siap — <b>' + T.esc(r.layers) + ' layer</b> · durasi ' + r.totalMs + ' ms · <span class="dim">' + T.esc(r.filename) + '</span>';
      AL.history.push('text2d', { filename: r.filename, project: inpProject.value, preset: (PRESETS.find((p) => p.id === selPreset.value) || {}).name, xml: r.xml });
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
  root.appendChild(T.el('<p class="dim" style="font-size:12px;margin-top:10px">💡 Import: buka Alight Motion → buat project → menu ⋮ → <i>Import</i> → pilih file .xml ini. Font di HP-mu harus terpasang agar tampil sesuai.</p>'));
}
