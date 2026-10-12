import { h as T, utils } from '../../core.js?v=6.9.20';

/* text2d — "2D Text Animate": 10 preset animasi teks 2D kinetik -> XML Alight Motion.
   100% client-side. Ditulis clean-room dari spesifikasi perilaku (tabel keyframe preset). */
const AL = utils.alight;

export const meta = {
  id: 'text2d', name: 'Animasi Teks 2D', cat: 'desain', icon: '✨',
  desc: '10 preset animasi teks 2D kinetik → export XML Alight Motion.',
  keywords: 'teks,animasi,2d,alight motion,xml,kinetik,elastic,bounce',
};

/* Spesifikasi perilaku tiap preset: keyframe ternormalisasi (t: 0..1 dari durasi preset).
   off = offset lokasi [x,y,z] px; e = kurva easing ala Alight Motion. */
const PRESETS = [
  { id: 'blur', name: 'Blur', dur: 1999,
    location: [{ t: 0, off: [396, 0, 0] }, { t: .325163, off: [0, 0, 0], e: 'cubicBezier(0.00,0.00,0.04,1.00)' }],
    scaleFixed: '2.140850,2.140850',
    opacity: [{ t: .0385, v: '0.000000' }, { t: .172, v: '1.000000' }],
    blur: [{ t: 0, v: '0.150000' }, { t: .133567, v: '0.000000' }] },
  { id: 'elastic', name: 'Elastic', dur: 1999,
    location: [{ t: 0, off: [123, 0, 0] }, { t: .325163, off: [0, 0, 0], e: 'elastic(0.50,1.00,0.00,0.30)' }],
    scale: [{ t: 0, v: '0.000014,0.000025' }, { t: .2885, v: '2.140850,2.140850', e: 'elastic(0.40,1.00,0.00,0.45)' }],
    rotation: [{ t: 0, v: '28.536585' }, { t: .333667, v: '0.000000', e: 'elastic(0.44,1.00,0.07,0.71)' }] },
  { id: 'squishrot', name: 'Squish Rot', dur: 1999,
    location: [{ t: 0, off: [-6.333, 218.333, 0] }, { t: .325163, off: [0, 0, 0], e: 'elastic(0.50,1.00,0.00,0.41)' }],
    scale: [{ t: 0, v: '0.000014,0.000031' }, { t: .397, v: '2.140850,2.140850', e: 'elastic(0.50,1.00,0.00,1.00)' }],
    rotation: [{ t: 0, v: '51.585365' }, { t: .425213, v: '0.000000', e: 'elastic(0.50,1.00,0.00,0.65)' }],
    opacity: [{ t: .092046, v: '0.000000' }, { t: .167084, v: '1.000000' }] },
  { id: 'squishup', name: 'Squish Up', dur: 1999,
    location: [{ t: 0, off: [0, -230.003, 0] }, { t: .325163, off: [0, 0, 0], e: 'elastic(0.50,1.00,0.00,0.41)' }],
    scale: [{ t: 0, v: '0.000014,0.000031' }, { t: .397, v: '2.140850,2.140850', e: 'elastic(0.50,1.00,0.00,1.00)' }],
    rotation: [{ t: 0, v: '-46.097561' }, { t: .425213, v: '0.000000', e: 'elastic(0.50,1.00,0.00,0.65)' }],
    opacity: [{ t: .092046, v: '0.000000' }, { t: .167084, v: '1.000000' }] },
  { id: 'up', name: 'Up', dur: 1999,
    location: [{ t: 0, off: [0, -100.667, 0] }, { t: .325163, off: [0, 0, 0], e: 'elastic(0.50,1.00,0.00,0.41)' }],
    scale: [{ t: 0, v: '0.000014,0.000031' }, { t: .397, v: '2.140850,2.140850', e: 'elastic(0.50,1.00,0.00,1.00)' }],
    rotation: [{ t: 0, v: '-46.097561' }, { t: .425213, v: '0.000000', e: 'elastic(0.50,1.00,0.00,0.65)' }] },
  { id: 'bouncemove', name: 'Bounce Move', dur: 1999,
    location: [{ t: 0, off: [135.333190, 0, 0] }, { t: .333667, off: [0, 0, 0], e: 'cubicBezier(0.00,0.21,0.00,1.00)' }],
    scale: [{ t: 0, v: '1.000000,0.000000' }, { t: .351, v: '1.000000,1.000000', e: 'elastic(0.34,1.00,0.16,0.61)' }],
    opacity: [{ t: 0, v: '0.000000' }, { t: .146073, v: '1.000000' }],
    wordNull: { dur: 2541, location: [
      { t: 0, off: [-97.333374, 1.000061, 0] },
      { t: .095977, off: [48.852356, 0, 0], e: 'cubicBezier(0.00,0.00,0.20,1.00)' },
      { t: .3253, off: [0, 0, 0], e: 'cubicBezier(0.42,0.00,0.10,1.00)' } ] } },
  { id: 'stretchhalf', name: 'Stretch Half', dur: 1999,
    location: [{ t: 0, off: [217.333313, 0, 0] }, { t: .229615, off: [0, 0, 0], e: 'cubicBezier(0.00,0.00,0.16,1.00)' }],
    scale: [
      { t: 0, v: '1.000000,0.000000' },
      { t: .083542, v: '1.000000,2.098188', e: 'cubicBezier(0.34,0.81,0.32,1.00)' },
      { t: .351, v: '1.000000,1.000000', e: 'cubicBezier(0.89,0.00,0.22,1.00)' },
      { t: .729865, v: '1.000000,1.000000' },
      { t: .7675, v: '1.000000,0.892857', e: 'cubicBezier(0.42,0.00,0.58,1.00)' },
      { t: .8925, v: '1.000000,1.882440', e: 'cubicBezier(0.44,0.00,0.00,1.00)' },
      { t: .97999, v: '1.000000,0.000016', e: 'cubicBezier(1.00,0.00,0.75,0.75)' }],
    opacity: [{ t: 0, v: '0.000000' }, { t: .021011, v: '1.000000' }] },
  { id: 'blurup', name: 'Blur Up', dur: 2958,
    location: [{ t: 0, off: [0, 177.333327, 0] }, { t: .155173, off: [0, 0, 0], e: 'cubicBezier(0.00,0.00,0.16,1.00)' }],
    opacity: [{ t: 0, v: '0.000000' }, { t: .054064, v: '1.000000' }],
    blur: [{ t: 0, v: '0.060000' }, { t: .124684, v: '0.000000' }] },
  { id: 'randomin', name: 'Random In', dur: 2124, randomIn: true,
    opacity: [{ t: 0, v: '0.000000' }, { t: .06, v: '1.000000' }] },
  { id: 'randominout', name: 'Random In & Out', dur: 2124, randomInOut: true },
];

const FONTS = ['Lexend', 'Exo', 'Inter', 'Poppins', 'Montserrat', 'Plus Jakarta Sans', 'Sora', 'Manrope'];
const WEIGHTS = [['300', 'Light'], ['400', 'Regular'], ['500', 'Medium'], ['600', 'Semi Bold'], ['700', 'Bold'], ['800', 'Extra Bold'], ['900', 'Black']];

/* Lebar teks: pakai canvas bila ada (browser), fallback estimasi di Node. */
let _mctx = null;
function measureCh(ch, fontCss, size) {
  if (typeof document !== 'undefined') {
    try {
      if (!_mctx) _mctx = document.createElement('canvas').getContext('2d');
      _mctx.font = fontCss;
      return _mctx.measureText(ch).width;
    } catch (e) { /* fallback */ }
  }
  return String(ch).length * size * 0.62;
}

/* Generator murni -> string XML (diexport untuk uji headless). */
export function generate(o) {
  const text = String(o.text || '').trim();
  if (!text) throw new Error('Teks masih kosong — isi dulu teksnya.');
  const preset = PRESETS.find((p) => p.id === o.presetId) || PRESETS[0];
  const units = AL.layoutText(text, {
    maxLines: 2, mode: o.mode, font: o.font, weight: o.weight,
    size: o.size, spacing: o.spacing, lineGap: o.lineHeight, measure: measureCh,
  });
  if (!units.length) throw new Error('Teks masih kosong — isi dulu teksnya.');
  const plan = AL.timingPlan(units.length, o);
  const palette = o.colorState.activeColors();
  const rng = AL.mulberry32((+o.seed || 1) + 7);

  const kfT = (t) => t * preset.dur; // waktu keyframe absolut (ms)
  const locKfs = (u, i, list) => (list || [{ t: 0, off: [0, 0, 0] }]).map((k) =>
    AL.kf(kfT(k.t), AL.f6(u.x + (k.off ? k.off[0] : 0)) + ',' + AL.f6(u.y + (k.off ? k.off[1] : 0)) + ',0.000000', k.e));
  const valKfs = (list) => (list || []).map((k) => AL.kf(kfT(k.t), k.v, k.e));
  const rndOff = () => [(rng() * 2 - 1) * 220, (rng() * 2 - 1) * 220, 0];

  const layers = [];
  let id = 9;
  const parentId = 8;
  const groups = new Map(); // untuk preset wordNull: kata -> index unit
  if (preset.wordNull) units.forEach((u, i) => {
    if (!groups.has(u.word)) groups.set(u.word, []);
    groups.get(u.word).push(i);
  });

  const emitChar = (u, i, localX, localY, par) => {
    const uu = { x: localX, y: localY };
    let loc = preset.location, op = preset.opacity;
    if (preset.randomIn) {
      const off = rndOff();
      loc = [{ t: 0, off }, { t: .3, off: [0, 0, 0], e: 'cubicBezier(0.00,0.00,0.16,1.00)' }];
    } else if (preset.randomInOut) {
      const o1 = rndOff(), o2 = rndOff();
      loc = [{ t: 0, off: o1 }, { t: .3, off: [0, 0, 0], e: 'cubicBezier(0.00,0.00,0.16,1.00)' },
             { t: .7, off: [0, 0, 0] }, { t: 1, off: o2, e: 'cubicBezier(0.42,0.00,0.58,1.00)' }];
      op = [{ t: 0, v: '0.000000' }, { t: .06, v: '1.000000' }, { t: .85, v: '1.000000' }, { t: 1, v: '0.000000' }];
    }
    const xform = AL.xform({
      location: locKfs(uu, i, loc),
      scale: preset.scaleFixed ? [AL.kf(0, preset.scaleFixed)] : valKfs(preset.scale),
      rotation: valKfs(preset.rotation),
      opacity: valKfs(op),
      blur: valKfs(preset.blur),
    });
    layers.push(AL.textLayer({
      id: id++, parent: par, label: u.ch, startMs: plan.starts[i], endMs: plan.ends[i],
      size: o.size, font: o.font + '-' + o.weight, content: u.ch,
      transform: xform, fillArgb: AL.argb(AL.colorFor(o.colorState.mode, palette, i, units.length, o.colorState.repeatEvery)),
    }));
  };

  if (preset.wordNull) {
    groups.forEach((indices) => {
      const nullId = id++;
      const ax = units[indices[0]].x, ay = units[indices[0]].y;
      const wStart = Math.min(...indices.map((i) => plan.starts[i]));
      const wLoc = (preset.wordNull.location || []).map((k) =>
        AL.kf(k.t * preset.wordNull.dur, AL.f6(ax + (k.off ? k.off[0] : 0)) + ',' + AL.f6(ay + (k.off ? k.off[1] : 0)) + ',0.000000', k.e));
      layers.push(AL.nullLayer({ id: nullId, label: 'Kata', startMs: wStart, endMs: plan.total, x: 540, y: 540, hidden: true }));
      // selipkan keyframe wordNull sebagai lokasi null (pakai transform custom)
      layers[layers.length - 1] = layers[layers.length - 1].replace(
        /<location value="[^"]*"\/>/,
        '<location>\n        ' + wLoc.join('\n        ') + '\n      </location>');
      indices.forEach((i) => emitChar(units[i], i, units[i].x - ax, units[i].y - ay, nullId));
    });
  } else {
    units.forEach((u, i) => emitChar(u, i, u.x, u.y, parentId));
  }
  layers.push(AL.nullLayer({ id: parentId, label: 'Teks', startMs: 0, endMs: plan.total, x: 540, y: 540, hidden: true }));

  const xml = AL.buildScene({ title: AL.projectName(o.project, 'Animasi Teks 2D'), totalMs: plan.total, inner: layers.join('\n') });
  const v = AL.validate(xml);
  if (!v.ok) throw new Error(v.error);
  return { xml, filename: AL.fileFor(o.filename, preset.id, o.text), totalMs: plan.total, layers: units.length };
}

export function render(root) {
  const colorState = { mode: 'single', paletteIndex: 2, repeatEvery: 1, customId: null };
  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Bikin teks kinetik 2D — pilih preset animasi, atur tipografi & timing, lalu export jadi <b>XML siap import ke Alight Motion</b>. Semua proses lokal di perangkatmu.</p>'));

  const inpText = T.ta(3, 'Tulis teks di sini (maks 2 baris)…', 'SALE\n50%');
  const selPreset = T.select(PRESETS.map((p) => [p.id, p.name]), 'elastic');
  const selMode = T.select([['char', 'Per karakter'], ['word', 'Per kata']], 'char');
  const selFont = T.select(FONTS.map((f) => [f, f]), 'Lexend');
  const selWeight = T.select(WEIGHTS, '700');
  const inpSize = T.input('number', '', '64'); inpSize.min = 8; inpSize.max = 160;
  const inpSpacing = T.input('number', '', '8'); inpSpacing.min = 0; inpSpacing.max = 420;
  const inpLineH = T.input('number', '', '120'); inpLineH.min = 20; inpLineH.max = 400;
  const inpStagger = T.input('number', '', '60'); inpStagger.min = 0; inpStagger.max = 2000;
  const inpSpread = T.input('number', '', '0'); inpSpread.min = 0; inpSpread.max = 10000;
  const inpRandom = T.input('number', '', '0'); inpRandom.min = 0; inpRandom.max = 100;
  const inpSeed = T.input('number', '', '12'); inpSeed.min = 1;
  const inpDur = T.input('number', '', '4000'); inpDur.min = 200;
  const chkExtend = T.input('checkbox', ''); chkExtend.checked = true;
  const inpProject = T.input('text', 'Nama project…', 'Animasi Teks 2D');
  const inpFile = T.input('text', 'Otomatis: teks#preset', '');

  root.appendChild(T.field('Teks (maks 2 baris)', inpText));
  root.appendChild(T.grid2(T.field('Preset animasi', selPreset), T.field('Mode layer', selMode)));
  root.appendChild(T.grid2(T.field('Font', selFont), T.field('Weight', selWeight)));
  root.appendChild(T.grid2(T.field('Ukuran font (8–160)', inpSize), T.field('Jarak huruf / spacing (0–420)', inpSpacing)));
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
      spacing: Math.max(0, Math.min(420, +inpSpacing.value || 0)),
      lineHeight: Math.max(20, Math.min(400, +inpLineH.value || 120)),
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
