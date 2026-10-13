import { h as T, utils } from '../../core.js?v=6.9.20';

/* textfxanimation — "Text FX Animation": 5 preset efek teks -> XML Alight Motion.
   Setia pada rujukan (all-tools-nexora, izin Developer Dika): 5 preset memakai
   nama, durasi scene, mode (karakter/kata), dan color roles (nama + warna
   default) yang sama. Koreografi keyframe dibangun ulang clean-room — blob XML
   preset asli TIDAK disalin. Format font mengikuti rujukan:
   googlefonts?name=<Font>&weight=<W> (format font native Alight Motion). */
const AL = utils.alight;

export const meta = {
  id: 'textfxanimation', name: 'Animasi FX Teks', cat: 'desain', icon: '💥',
  desc: '5 preset efek teks (Pink Glow, Reveal Up, Glow Out-In, Neon Block, Star Reveal) → XML Alight Motion, dengan color roles per preset.',
  keywords: 'teks,fx,efek,alight motion,xml,glow,neon,reveal,color roles',
};

/* PRESETS — id, nama, slug file, durasi scene (ms, = totalTime preset rujukan),
   stagger bawaan (ms), layerMs (durasi tiap layer), mode yang tersedia,
   color roles (nama + warna default seperti rujukan), dan koreografi
   keyframe orisinal (t ternormalisasi 0..1 dari layerMs). */
const PRESETS = [
  { id: 'pinkglow', name: 'Nexora Pink Glow', slug: 'apple', sceneMs: 2716, stagger: 55, layerMs: 900,
    modes: ['character', 'word'],
    roles: [
      { id: 'pink', name: 'Pink Fill', color: '#FF38A1' },
      { id: 'cyan', name: 'Cyan Glow', color: '#9BCFD0' },
      { id: 'dark', name: 'Dark Text', color: '#15161F' },
    ],
    build: (kfT) => ({
      scale: [AL.kf(kfT(0), '0.820000,0.820000'), AL.kf(kfT(.45), '1.060000,1.060000', 'elastic(0.50,1.00,0.00,0.55)'), AL.kf(kfT(.72), '1.000000,1.000000', 'cubicBezier(0.33,0.00,0.67,1.00)')],
      opacity: [AL.kf(kfT(0), '0.000000'), AL.kf(kfT(.14), '1.000000')],
      blur: [AL.kf(kfT(0), '0.450000'), AL.kf(kfT(.5), '0.000000', 'cubicBezier(0.33,0.00,0.67,1.00)')],
    }) },
  { id: 'revealup', name: 'Blue Reveal Up', slug: 'blue', sceneMs: 2049, stagger: 60, layerMs: 800,
    modes: ['character', 'word'],
    roles: [
      { id: 'blue', name: 'Blue Glow', color: '#02AFD9' },
      { id: 'white', name: 'White Highlight', color: '#EAE8F1' },
      { id: 'bg', name: 'Background', color: '#000000' },
    ],
    build: (kfT, u) => ({
      location: [AL.kf(kfT(0), AL.f6(u.x) + ',' + AL.f6(u.y + 280) + ',0.000000'),
        AL.kf(kfT(.55), AL.f6(u.x) + ',' + AL.f6(u.y) + ',0.000000', 'cubicBezier(0.16,0.00,0.30,1.00)')],
      opacity: [AL.kf(kfT(0), '0.000000'), AL.kf(kfT(.2), '1.000000')],
      blur: [AL.kf(kfT(0), '0.220000'), AL.kf(kfT(.5), '0.000000')],
    }) },
  { id: 'outin', name: 'Glow Out To In', slug: 'outin', sceneMs: 1299, stagger: 45, layerMs: 700,
    modes: ['character', 'word'],
    roles: [
      { id: 'visible', name: 'Visible Text', color: '#EAE8F1' },
      { id: 'blue', name: 'Glow Blue', color: '#02AFD9' },
      { id: 'soft', name: 'Soft Blue', color: '#8589EB' },
      { id: 'bg', name: 'Background', color: '#000000' },
    ],
    build: (kfT) => ({
      scale: [AL.kf(kfT(0), '1.700000,1.700000'), AL.kf(kfT(.5), '1.000000,1.000000', 'cubicBezier(0.33,0.00,0.67,1.00)')],
      opacity: [AL.kf(kfT(0), '0.000000'), AL.kf(kfT(.12), '1.000000')],
      blur: [AL.kf(kfT(0), '0.600000'), AL.kf(kfT(.5), '0.000000', 'cubicBezier(0.33,0.00,0.67,1.00)')],
    }) },
  { id: 'neonblock', name: 'Green Neon Block', slug: 'green', sceneMs: 2866, stagger: 70, layerMs: 1000,
    modes: ['character'],
    roles: [
      { id: 'main', name: 'Main Green', color: '#00FF58' },
      { id: 'lime', name: 'Glow Lime', color: '#99FFBC' },
      { id: 'deep', name: 'Deep Green', color: '#009F3D' },
      { id: 'white', name: 'White Highlight', color: '#FFFFFF' },
      { id: 'dark', name: 'Dark Fill', color: '#212139' },
    ],
    build: (kfT) => ({
      opacity: [AL.kf(kfT(0), '0.000000'), AL.kf(kfT(.06), '0.000000'), AL.kf(kfT(.1), '0.750000'),
        AL.kf(kfT(.15), '0.200000'), AL.kf(kfT(.22), '1.000000'), AL.kf(kfT(.3), '0.550000'), AL.kf(kfT(.38), '1.000000')],
      scale: [AL.kf(kfT(0), '1.000000,1.000000'), AL.kf(kfT(.38), '1.030000,1.030000'), AL.kf(kfT(.6), '1.000000,1.000000', 'cubicBezier(0.33,0.00,0.67,1.00)')],
    }) },
  { id: 'starreveal', name: 'Star Reveal', slug: 'star', sceneMs: 2033, stagger: 65, layerMs: 850,
    modes: ['character'],
    roles: [
      { id: 'purple', name: 'Star Purple', color: '#E684E2' },
      { id: 'cyan', name: 'Cyan Glow', color: '#02AFD9' },
      { id: 'mint', name: 'Mint Glow', color: '#5FD5CA' },
      { id: 'navy', name: 'Dark Blue', color: '#00275B' },
      { id: 'accent', name: 'Violet Accent', color: '#534AA2' },
    ],
    build: (kfT) => ({
      scale: [AL.kf(kfT(0), '0.000000,0.000000'), AL.kf(kfT(.5), '1.150000,1.150000', 'elastic(0.50,1.00,0.00,0.55)'), AL.kf(kfT(.75), '1.000000,1.000000', 'cubicBezier(0.33,0.00,0.67,1.00)')],
      rotation: [AL.kf(kfT(0), '-28.000000'), AL.kf(kfT(.6), '0.000000', 'cubicBezier(0.33,0.00,0.67,1.00)')],
      opacity: [AL.kf(kfT(0), '0.000000'), AL.kf(kfT(.15), '1.000000')],
    }) },
];

const FONTS = ['Lexend', 'Exo', 'Inter', 'Poppins'];
const WEIGHTS = [['400', 'Regular'], ['500', 'Medium'], ['600', 'Semi Bold'], ['700', 'Bold'], ['800', 'Extra Bold'], ['900', 'Black']];

/* Normalisasi teks seperti rujukan: maks 2 baris, tiap baris maks 2 kata. */
function normalizeText(raw, fallback) {
  raw = String(raw == null ? '' : raw).replace(/\r/g, '').trim();
  if (!raw) return fallback;
  const lines = raw.split('\n').map((x) => x.trim()).filter(Boolean);
  if (lines.length >= 2) {
    const a = lines[0].split(/\s+/).slice(0, 2).join(' ');
    const b = lines[1].split(/\s+/).slice(0, 2).join(' ');
    return b ? a + '\n' + b : a;
  }
  const words = (lines[0] || raw).split(/\s+/).filter(Boolean).slice(0, 4);
  if (!words.length) return fallback;
  if (words.length <= 2) return words.join(' ');
  return words.slice(0, 2).join(' ') + '\n' + words.slice(2, 4).join(' ');
}

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

/* Format font native Alight Motion seperti rujukan. */
function fontAttr(font, weight) {
  return 'googlefonts?name=' + encodeURIComponent(font).replace(/%20/g, '+') + '&weight=' + weight;
}

export function generate(o) {
  const preset = PRESETS.find((p) => p.id === o.presetId) || PRESETS[0];
  const text = normalizeText(o.text, 'Teks Keren');
  const mode = preset.modes.includes(o.mode) ? o.mode : preset.modes[0];
  let units = AL.layoutText(text, {
    maxLines: 2, mode, font: o.font, weight: o.weight,
    size: o.size, spacing: o.spacing, lineGap: o.size * 1.5, measure: measureCh,
  });
  if (mode === 'word') {
    // Mode kata: gabungkan huruf per kata jadi satu unit/layer.
    const byWord = new Map();
    units.forEach((u) => { if (!byWord.has(u.word)) byWord.set(u.word, []); byWord.get(u.word).push(u); });
    units = [...byWord.values()].map((g) => ({ ch: g.map((x) => x.ch).join(''), word: g[0].word, x: g[0].x, y: g[0].y }));
  }
  if (!units.length) throw new Error('Teks masih kosong — isi dulu teksnya.');
  const roles = Array.isArray(o.roles) && o.roles.length ? o.roles : preset.roles.map((r) => r.color);
  const plan = AL.timingPlan(units.length, { stagger: preset.stagger, layerMs: preset.layerMs, seed: 7 });
  const kfT = (t) => t * preset.layerMs;
  const layers = [];
  let id = 9; const parentId = 8;
  const fill = roles[0] || '#FFFFFF';
  const stroke = roles[1] || null; // role kedua jadi outline tipis (aproksimasi glow)

  const nz = (a) => (a && a.length ? a : null); // kosong -> elemen XML tidak di-emit
  units.forEach((u, i) => {
    const fx = preset.build(kfT, u, i);
    const loc = fx.location || [AL.kf(0, AL.f6(u.x) + ',' + AL.f6(u.y) + ',0.000000')];
    layers.push(AL.textLayer({
      id: id++, parent: parentId, label: u.ch, startMs: plan.starts[i], endMs: plan.ends[i],
      size: o.size, font: fontAttr(o.font, o.weight), content: u.ch,
      transform: AL.xform({
        location: loc,
        scale: nz(fx.scale),
        rotation: nz(fx.rotation),
        opacity: fx.opacity || [AL.kf(0, '1.000000')],
        blur: nz(fx.blur),
      }),
      fillArgb: AL.argb(fill),
      strokeArgb: stroke ? AL.argb(stroke) : null,
      strokeW: 2,
    }));
  });
  layers.push(AL.nullLayer({ id: parentId, label: 'FX Teks', startMs: 0, endMs: plan.total, x: 540, y: 540, hidden: true }));

  const scene = AL.buildScene({ title: AL.projectName(o.project, 'FX Teks'), totalMs: plan.total, inner: layers.join('\n') });
  const xml = scene.replace('?>\n', '?>\n<!-- Dibuat oleh Adip Tools - Animasi FX Teks -->\n');
  const v = AL.validate(xml);
  if (!v.ok) throw new Error(v.error);
  const firstLine = text.split('\n')[0];
  return { xml, filename: AL.fileFor(o.filename, preset.slug, firstLine), totalMs: plan.total, layers: units.length, preset: preset.name };
}

export function render(root) {
  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Lima preset efek teks siap pakai menjadi <b>XML Alight Motion</b>. Setiap preset punya <b>color roles</b> sendiri — sesuaikan warnanya sebelum generate.</p>'));

  const inpText = T.ta(3, 'Tulis teks di sini…', 'Teks Keren');
  const selPreset = T.select(PRESETS.map((p) => [p.id, p.name]), 'pinkglow');
  const selMode = T.select([['character', 'Per karakter'], ['word', 'Per kata']], 'character');
  const selFont = T.select(FONTS.map((f) => [f, f]), 'Poppins');
  const selWeight = T.select(WEIGHTS, '600');
  const inpSize = T.input('number', '', '56'); inpSize.min = 8; inpSize.max = 120;
  const inpSpacing = T.input('number', '', '6'); inpSpacing.min = 0; inpSpacing.max = 420;
  const inpProject = T.input('text', 'Nama project…', 'FX Teks');
  const inpFile = T.input('text', 'Otomatis: teks#preset', '');

  root.appendChild(T.field('Teks (maks 2 baris)', inpText));
  root.appendChild(T.grid2(T.field('Preset FX', selPreset), T.field('Mode layer', selMode)));
  root.appendChild(T.grid2(T.field('Font', selFont), T.field('Weight', selWeight)));
  root.appendChild(T.grid2(T.field('Ukuran font (8–120)', inpSize), T.field('Jarak huruf (0–420)', inpSpacing)));

  // Color roles per preset (nama + warna default seperti rujukan).
  const rolesHead = T.el('<div class="dim" style="font-size:13px;font-weight:700;margin:10px 0 4px">Color roles</div>');
  const rolesBox = T.el('<div></div>');
  let roleState = [];
  function drawRoles() {
    const p = PRESETS.find((x) => x.id === selPreset.value) || PRESETS[0];
    roleState = p.roles.map((r) => ({ ...r }));
    rolesBox.innerHTML = '';
    roleState.forEach((r) => {
      const inp = T.input('color', ''); inp.value = r.color;
      const dot = T.el('<span style="width:14px;height:14px;border-radius:4px;display:inline-block;flex:none"></span>');
      dot.style.background = r.color;
      inp.addEventListener('input', () => { r.color = inp.value; dot.style.background = inp.value; });
      const lab = T.el('<label class="dim" style="font-size:13px;display:flex;gap:8px;align-items:center;margin:5px 0"></label>');
      lab.appendChild(dot);
      lab.appendChild(T.el('<span style="flex:1">' + T.esc(r.name) + '</span>'));
      lab.appendChild(inp);
      rolesBox.appendChild(lab);
    });
  }
  function syncMode() {
    const p = PRESETS.find((x) => x.id === selPreset.value) || PRESETS[0];
    const opt = selMode.querySelector('option[value="word"]');
    if (opt) opt.disabled = !p.modes.includes('word');
    if (!p.modes.includes('word')) selMode.value = 'character';
  }
  selPreset.addEventListener('change', () => { syncMode(); drawRoles(); });
  root.appendChild(rolesHead);
  root.appendChild(rolesBox);
  drawRoles(); syncMode();

  root.appendChild(T.grid2(T.field('Nama project', inpProject), T.field('Nama file (opsional)', inpFile)));

  const status = T.el('<div class="dim" style="font-size:12.5px;margin:8px 0"></div>');
  const xmlOut = T.ta(10, 'XML hasil akan muncul di sini…'); xmlOut.readOnly = true;
  xmlOut.style.fontFamily = 'monospace'; xmlOut.style.fontSize = '11px';
  let last = null;
  const hist = AL.historyUI('textfxanimation', (xml) => { last = { xml }; xmlOut.value = xml; status.textContent = 'XML dari riwayat dimuat.'; });

  function collect() {
    const p = PRESETS.find((x) => x.id === selPreset.value) || PRESETS[0];
    return {
      text: inpText.value, presetId: p.id,
      mode: p.modes.includes(selMode.value) ? selMode.value : p.modes[0],
      font: selFont.value, weight: selWeight.value,
      size: Math.max(8, Math.min(120, +inpSize.value || 56)),
      spacing: Math.max(0, Math.min(420, +inpSpacing.value || 0)),
      roles: roleState.map((r) => r.color),
      project: inpProject.value, filename: inpFile.value,
    };
  }
  function doGenerate() {
    try {
      const r = generate(collect());
      last = r; xmlOut.value = r.xml;
      status.innerHTML = 'XML siap — <b>' + T.esc(r.layers) + ' layer</b> · preset ' + T.esc(r.preset) + ' · durasi ' + r.totalMs + ' ms · <span class="dim">' + T.esc(r.filename) + '</span>';
      AL.history.push('textfxanimation', { filename: r.filename, project: inpProject.value, preset: r.preset, xml: r.xml });
      hist.refresh();
    } catch (e) { status.innerHTML = '<span class="err">' + T.esc(e.message) + '</span>'; }
  }
  root.appendChild(T.row(T.btn('Generate XML', doGenerate, true)));
  root.appendChild(status);
  root.appendChild(T.field('Lihat XML hasil', xmlOut));
  root.appendChild(T.row(
    T.btn('Unduh XML', () => {
      if (!last) { T.toast('Generate dulu XML-nya'); return; }
      const err = AL.downloadXml(last.filename || 'animasi.xml', last.xml);
      T.toast(err || 'Mengunduh…');
    }, true),
    T.copyBtn(() => (last ? last.xml : ''), 'Salin XML'),
  ));
  root.appendChild(T.el('<div class="dim" style="font-size:13px;font-weight:700;margin:12px 0 4px">Riwayat</div>'));
  root.appendChild(hist);
}
