import { h as T, utils } from '../../core.js?v=6.9.20';

/* text3d — "3D Text Animate": 7 preset teks 3D (extrude, long shadow, offset)
   -> XML Alight Motion. 100% client-side, clean-room dari spesifikasi perilaku. */
const AL = utils.alight;

export const meta = {
  id: 'text3d', name: 'Animasi Teks 3D', cat: 'desain', icon: '🧊',
  desc: '7 preset teks 3D — extrude, long shadow, offset — → XML Alight Motion.',
  keywords: 'teks,3d,alight motion,xml,extrude,long shadow,offset',
};

/* roles: [id, label, default] — diexpose per preset seperti tool acuan. */
const PRESETS = [
  { id: 'flip3d', name: 'Flip 3D', roles: [['face', 'Wajah', '#FFFFFF'], ['edge', 'Sisi', '#FEA800'], ['shadow', 'Bayangan', '#3A1C00']],
    face: { rotation: [{ t: 0, v: '90.000000' }, { t: .45, v: '0.000000', e: 'elastic(0.50,1.00,0.00,0.60)' }], opacity: [{ t: 0, v: '0.000000' }, { t: .1, v: '1.000000' }] },
    stack: { dx: 6, dy: 6, role: 'edge' }, shadow: { dx: 26, dy: 26, role: 'shadow', op: '0.55' }, dur: 2200 },
  { id: 'right', name: 'Geser 3D', roles: [['face', 'Wajah', '#FFFFFF'], ['edge', 'Sisi', '#2E9BD6']],
    face: { location: [{ t: 0, off: [-320, 0, 0] }, { t: .4, off: [0, 0, 0], e: 'cubicBezier(0.00,0.00,0.16,1.00)' }], opacity: [{ t: 0, v: '0.000000' }, { t: .08, v: '1.000000' }] },
    stack: { dx: 10, dy: 4, role: 'edge' }, dur: 2000 },
  { id: 'popup', name: 'Popup Rotate Extrude', roles: [['face', 'Wajah', '#FFFFFF'], ['edge', 'Sisi', '#7B2DCC']],
    face: { scale: [{ t: 0, v: '0.000014,0.000014' }, { t: .4, v: '1.000000,1.000000', e: 'elastic(0.50,1.00,0.00,0.70)' }],
             rotation: [{ t: 0, v: '-32.000000' }, { t: .45, v: '0.000000', e: 'elastic(0.50,1.00,0.00,0.65)' }] },
    stack: { dx: 5, dy: 8, role: 'edge' }, dur: 2100 },
  { id: 'longshadow', name: 'Long Shadow', roles: [['face', 'Wajah', '#FFFFFF'], ['shadow', 'Bayangan', '#101418']],
    face: { location: [{ t: 0, off: [0, -260, 0] }, { t: .35, off: [0, 0, 0], e: 'cubicBezier(0.00,0.00,0.16,1.00)' }], opacity: [{ t: 0, v: '0.000000' }, { t: .07, v: '1.000000' }] },
    longshadow: { dx: 7, dy: 7, role: 'shadow', max: 30 }, dur: 2000 },
  { id: 'offsetA', name: 'Offset Kosongan', roles: [['face', 'Wajah', '#FFFFFF'], ['outline', 'Outline', '#111111']],
    face: { scale: [{ t: 0, v: '0.000014,0.000014' }, { t: .35, v: '1.000000,1.000000', e: 'cubicBezier(0.34,1.30,0.64,1.00)' }] },
    outline8: { role: 'outline' }, dur: 1800 },
  { id: 'offsetOrange', name: 'Offset Orange', roles: [['face', 'Wajah', '#FFF7E8'], ['g1', 'Gradasi 1', '#FF9F1C'], ['g2', 'Gradasi 2', '#C1440E']],
    face: { location: [{ t: 0, off: [0, 200, 0] }, { t: .35, off: [0, 0, 0], e: 'cubicBezier(0.00,0.00,0.16,1.00)' }] },
    gradstack: { dx: 6, dy: 6, roles: ['g1', 'g2'] }, dur: 2000 },
  { id: 'offsetGreen', name: 'Offset Green Fire', roles: [['face', 'Wajah', '#F4FFEA'], ['g1', 'Api 1', '#70E000'], ['g2', 'Api 2', '#FFB703']],
    face: { location: [{ t: 0, off: [0, 200, 0] }, { t: .35, off: [0, 0, 0], e: 'elastic(0.50,1.00,0.00,0.55)' }] },
    gradstack: { dx: 6, dy: 6, roles: ['g1', 'g2'] }, dur: 2000 },
];

const FONTS = ['Lexend', 'Exo', 'Inter', 'Poppins', 'Montserrat', 'Plus Jakarta Sans'];
const WEIGHTS = [['300', 'Light'], ['400', 'Regular'], ['500', 'Medium'], ['600', 'Semi Bold'], ['700', 'Bold'], ['800', 'Extra Bold'], ['900', 'Black']];

let _mctx = null;
function measureW(ch, fontCss, size) {
  if (typeof document !== 'undefined') {
    try {
      if (!_mctx) _mctx = document.createElement('canvas').getContext('2d');
      _mctx.font = fontCss; return _mctx.measureText(ch).width;
    } catch (e) {}
  }
  return String(ch).length * size * 0.62;
}

export function generate(o) {
  const text = String(o.text || '').replace(/\n/g, ' ').trim();
  if (!text) throw new Error('Teks masih kosong — isi dulu teksnya.');
  const preset = PRESETS.find((p) => p.id === o.presetId) || PRESETS[0];
  const fontCss = o.weight + ' ' + o.size + 'px "' + o.font + '", sans-serif';
  const chars = [...text].filter((c) => c !== ' ');
  if (!chars.length) throw new Error('Teks masih kosong — isi dulu teksnya.');
  const widths = chars.map((c) => measureW(c, fontCss, o.size));
  const spacing = o.autoLink ? Math.round(145 / 72 * o.size) : o.spacing;
  const lineGap = o.autoLink ? Math.round(240 / 72 * o.size) : o.lineGap;
  // Bungkus ke beberapa baris sederhana bila terlalu lebar
  const lines = []; let cur = [], curW = 0;
  chars.forEach((c, i) => {
    const w = widths[i] + (cur.length ? spacing : 0);
    if (curW + w > 940 && cur.length) { lines.push({ chars: cur, w: curW }); cur = []; curW = 0; }
    cur.push({ c, w: widths[i] }); curW += w;
  });
  if (cur.length) lines.push({ chars: cur, w: curW });
  const units = [];
  lines.forEach((ln, li) => {
    let cx = 540 - ln.w / 2;
    const cy = 540 + (li - (lines.length - 1) / 2) * lineGap + (o.posY || 0);
    ln.chars.forEach((u) => { units.push({ ch: u.c, x: cx + (o.posX || 0), y: cy, w: u.w }); cx += u.w + spacing; });
  });

  const plan = AL.timingPlan(units.length, o);
  const kfT = (t) => t * preset.dur;
  const depth = Math.max(0, Math.min(200, Number.isFinite(+o.depth) ? +o.depth : 100));
  const nStack = Math.max(0, Math.round(depth / 200 * 12));
  const layers = [];
  let id = 9; const parentId = 8;
  const roleColor = (rid) => AL.argb((o.roles && o.roles[rid]) || '#FFFFFF');

  units.forEach((u, i) => {
    const st = plan.starts[i], en = plan.ends[i];
    const mkStack = (dx, dy, n, colorFn, op) => {
      for (let k = n; k >= 1; k--) {
        layers.push(AL.textLayer({
          id: id++, parent: parentId, label: u.ch + '·s' + k, startMs: st, endMs: en,
          size: o.size, font: o.font + '-' + o.weight, content: u.ch,
          transform: AL.xform({ location: [AL.kf(0, AL.f6(u.x + dx * k) + ',' + AL.f6(u.y + dy * k) + ',0.000000')], opacity: op ? [AL.kf(0, op)] : [] }),
          fillArgb: colorFn(k, n),
        }));
      }
    };
    // 1) bayangan / long shadow / gradasi (paling belakang)
    if (preset.shadow) {
      const s = preset.shadow;
      layers.push(AL.textLayer({
        id: id++, parent: parentId, label: u.ch + '·sh', startMs: st, endMs: en,
        size: o.size, font: o.font + '-' + o.weight, content: u.ch,
        transform: AL.xform({ location: [AL.kf(0, AL.f6(u.x + s.dx) + ',' + AL.f6(u.y + s.dy) + ',0.000000')], opacity: [AL.kf(0, s.op || '0.5')] }),
        fillArgb: roleColor(s.role),
      }));
    }
    if (preset.longshadow) {
      const s = preset.longshadow, n = Math.max(1, Math.round(s.max * depth / 200));
      mkStack(s.dx, s.dy, n, () => roleColor(s.role));
    }
    if (preset.gradstack) {
      const s = preset.gradstack, cols = s.roles.map(roleColor);
      mkStack(s.dx, s.dy, Math.max(2, nStack), (k, n) => AL.argb(AL.lerpHex(
        '#' + cols[0].slice(3), '#' + cols[1].slice(3), n <= 1 ? 0 : 1 - k / n)));
    }
    if (preset.stack) {
      const s = preset.stack;
      mkStack(s.dx, s.dy, Math.max(1, nStack), () => roleColor(s.role));
    }
    if (preset.outline8) {
      const d = Math.max(2, Math.round(3 + depth / 200 * 8));
      const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]];
      dirs.forEach(([dx, dy]) => {
        layers.push(AL.textLayer({
          id: id++, parent: parentId, label: u.ch + '·o', startMs: st, endMs: en,
          size: o.size, font: o.font + '-' + o.weight, content: u.ch,
          transform: AL.xform({ location: [AL.kf(0, AL.f6(u.x + dx * d) + ',' + AL.f6(u.y + dy * d) + ',0.000000')] }),
          fillArgb: roleColor(preset.outline8.role),
        }));
      });
    }
    // 2) wajah (paling depan) dengan keyframe preset
    const f = preset.face || {};
    const loc = (f.location || [{ t: 0, off: [0, 0, 0] }]).map((k) =>
      AL.kf(kfT(k.t), AL.f6(u.x + (k.off ? k.off[0] : 0)) + ',' + AL.f6(u.y + (k.off ? k.off[1] : 0)) + ',0.000000', k.e));
    layers.push(AL.textLayer({
      id: id++, parent: parentId, label: u.ch, startMs: st, endMs: en,
      size: o.size, font: o.font + '-' + o.weight, content: u.ch,
      transform: AL.xform({
        location: loc,
        scale: (f.scale || []).map((k) => AL.kf(kfT(k.t), k.v, k.e)),
        rotation: (f.rotation || []).map((k) => AL.kf(kfT(k.t), k.v, k.e)),
        opacity: (f.opacity || [{ t: 0, v: '1.000000' }]).map((k) => AL.kf(kfT(k.t), k.v, k.e)),
      }),
      fillArgb: roleColor('face'),
    }));
  });
  layers.push(AL.nullLayer({ id: parentId, label: 'Teks 3D', startMs: 0, endMs: plan.total, x: 540, y: 540, hidden: true }));

  const xml = AL.buildScene({ title: AL.projectName(o.project, 'Teks 3D'), totalMs: plan.total, inner: layers.join('\n') });
  const v = AL.validate(xml);
  if (!v.ok) throw new Error(v.error);
  return { xml, filename: AL.fileFor(o.filename, preset.id, o.text), totalMs: plan.total, layers: layers.length };
}

export function render(root) {
  const colorState = { mode: 'single', paletteIndex: 0, repeatEvery: 1, customId: null };
  let roles = {};
  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Teks 3D kinetik — extrude, long shadow, dan offset — jadi <b>XML siap import ke Alight Motion</b>. Tiap preset punya <i>color role</i> sendiri (wajah, sisi, bayangan) yang bisa kamu warnai satu-satu.</p>'));

  const inpText = T.ta(2, 'Tulis teks di sini…', 'KREATIF');
  const selPreset = T.select(PRESETS.map((p) => [p.id, p.name]), 'flip3d');
  const selFont = T.select(FONTS.map((f) => [f, f]), 'Exo');
  const selWeight = T.select(WEIGHTS, '700');
  const inpSize = T.input('number', '', '72'); inpSize.min = 10; inpSize.max = 220;
  const chkAuto = T.input('checkbox', ''); chkAuto.checked = true;
  const inpSpacing = T.input('number', '', '145'); inpSpacing.min = 0; inpSpacing.max = 420;
  const inpDepth = T.input('number', '', '100'); inpDepth.min = 0; inpDepth.max = 200;
  const inpStagger = T.input('number', '', '70'); inpStagger.min = 0; inpStagger.max = 2000;
  const inpSpread = T.input('number', '', '0'); inpSpread.min = 0; inpSpread.max = 10000;
  const inpDur = T.input('number', '', '4000'); inpDur.min = 200;
  const inpHold = T.input('number', '', '0'); inpHold.min = 0; inpHold.max = 2000;
  const inpSeed = T.input('number', '', '7'); inpSeed.min = 1;
  const inpX = T.input('number', '', '0'); const inpY = T.input('number', '', '0');
  const inpProject = T.input('text', 'Nama project…', 'Teks 3D');
  const inpFile = T.input('text', 'Otomatis: teks#preset', '');

  const roleBox = T.el('<div></div>');
  function drawRoles() {
    const preset = PRESETS.find((p) => p.id === selPreset.value) || PRESETS[0];
    preset.roles.forEach(([rid, label, def]) => { if (!(rid in roles)) roles[rid] = def; });
    roleBox.innerHTML = '<div class="dim" style="font-size:13px;font-weight:700;margin:10px 0 4px">🎨 Color roles — ' + T.esc(preset.name) + '</div>';
    const g = T.el('<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px"></div>');
    preset.roles.forEach(([rid, label]) => {
      const w = T.el('<div style="border:1px solid #ffffff18;border-radius:8px;padding:8px"></div>');
      const ci = T.input('color', ''); ci.value = roles[rid];
      const tx = T.input('text', '#RRGGBB', roles[rid]); tx.style.fontFamily = 'monospace'; tx.style.fontSize = '12px';
      ci.addEventListener('input', () => { roles[rid] = ci.value.toUpperCase(); tx.value = roles[rid]; });
      tx.addEventListener('change', () => { if (AL.hexToRgb(tx.value)) { roles[rid] = tx.value.toUpperCase(); ci.value = roles[rid]; } });
      w.appendChild(T.el('<div class="dim" style="font-size:12px;margin-bottom:4px">' + T.esc(label) + '</div>'));
      w.appendChild(T.row(ci, tx));
      g.appendChild(w);
    });
    roleBox.appendChild(g);
    const hint = T.el('<div class="dim" style="font-size:12px;margin-top:4px">Klik palet di bawah untuk memetakan warnanya ke semua role sekaligus.</div>');
    roleBox.appendChild(hint);
  }
  function applyPaletteToRoles() {
    const preset = PRESETS.find((p) => p.id === selPreset.value) || PRESETS[0];
    const cols = colorState.activeColors();
    preset.roles.forEach(([rid], i) => { roles[rid] = cols[i % cols.length]; });
    drawRoles();
  }

  root.appendChild(T.field('Teks', inpText));
  root.appendChild(T.grid2(T.field('Preset 3D', selPreset), T.field('Font', selFont)));
  root.appendChild(T.grid2(T.field('Weight', selWeight), T.field('Ukuran font (10–220)', inpSize)));
  const autoWrap = T.el('<label class="dim" style="font-size:13px;display:flex;gap:8px;align-items:center;margin:4px 0"></label>');
  autoWrap.appendChild(chkAuto); autoWrap.appendChild(document.createTextNode('Auto-link spacing & jarak baris dari ukuran font'));
  root.appendChild(autoWrap);
  root.appendChild(T.grid2(T.field('Spacing manual (0–420)', inpSpacing), T.field('Depth / extrude (0–200%)', inpDepth)));
  root.appendChild(T.grid2(T.field('Stagger, ms (0–2000)', inpStagger), T.field('Spread, ms (0–10000)', inpSpread)));
  root.appendChild(T.grid2(T.field('Durasi layer, ms (≥200)', inpDur), T.field('Tahan akhir, ms (0–2000)', inpHold)));
  root.appendChild(T.grid2(T.field('Seed acak', inpSeed), T.field('Posisi X / Y (px)', T.row(inpX, inpY))));
  drawRoles();
  root.appendChild(roleBox);
  root.appendChild(T.el('<div class="dim" style="font-size:13px;font-weight:700;margin:10px 0 4px">🎨 Palet → petakan ke roles</div>'));
  root.appendChild(AL.paletteUI(colorState, applyPaletteToRoles));
  root.appendChild(T.grid2(T.field('Nama project', inpProject), T.field('Nama file (opsional)', inpFile)));
  selPreset.addEventListener('change', drawRoles);

  const status = T.el('<div class="dim" style="font-size:12.5px;margin:8px 0"></div>');
  const xmlOut = T.ta(10, 'XML hasil akan muncul di sini…'); xmlOut.readOnly = true;
  xmlOut.style.fontFamily = 'monospace'; xmlOut.style.fontSize = '11px';
  let last = null;
  const hist = AL.historyUI('text3d', (xml) => { last = { xml }; xmlOut.value = xml; status.textContent = 'XML dari riwayat dimuat.'; });

  function collect() {
    return {
      text: inpText.value, presetId: selPreset.value, font: selFont.value, weight: selWeight.value,
      size: Math.max(10, Math.min(220, +inpSize.value || 72)), autoLink: chkAuto.checked,
      spacing: Math.max(0, Math.min(420, +inpSpacing.value || 0)),
      lineGap: Math.max(60, Math.min(320, Math.round(240 / 72 * (+inpSize.value || 72)))),
      depth: Math.max(0, Math.min(200, +inpDepth.value || 0)),
      stagger: Math.max(0, Math.min(2000, +inpStagger.value || 0)),
      spread: Math.max(0, Math.min(10000, +inpSpread.value || 0)),
      layerMs: Math.max(200, +inpDur.value || 4000), endHold: Math.max(0, Math.min(2000, +inpHold.value || 0)),
      seed: Math.max(1, +inpSeed.value || 1), posX: +inpX.value || 0, posY: +inpY.value || 0,
      roles: Object.assign({}, roles), colorState, project: inpProject.value, filename: inpFile.value,
    };
  }
  function doGenerate() {
    try {
      const r = generate(collect());
      last = r; xmlOut.value = r.xml;
      status.innerHTML = '✅ XML siap — <b>' + T.esc(r.layers) + ' layer</b> · durasi ' + r.totalMs + ' ms · <span class="dim">' + T.esc(r.filename) + '</span>';
      AL.history.push('text3d', { filename: r.filename, project: inpProject.value, preset: (PRESETS.find((p) => p.id === selPreset.value) || {}).name, xml: r.xml });
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
  root.appendChild(T.el('<p class="dim" style="font-size:12px;margin-top:10px">💡 Depth 0% = teks datar tanpa extrude; 200% = extrude maksimal. Import via menu ⋮ → <i>Import</i> di Alight Motion.</p>'));
}
