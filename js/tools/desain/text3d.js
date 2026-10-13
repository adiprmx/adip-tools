import { h as T, utils } from '../../core.js?v=6.9.20';

/* text3d — "Animasi Teks 3D": 7 preset teks 3D (extrude, long shadow, offset)
   -> XML Alight Motion. 100% client-side. Struktur XML diselaraskan dengan tool
   acuan (node <kf t/v/e>, font googlefonts, efek gradientoverlay2, atribut
   scene ala Alight Motion; color role per preset mengikuti acuan). */
const AL = utils.alight;

export const meta = {
  id: 'text3d', name: 'Animasi Teks 3D', cat: 'desain', icon: '🧊',
  desc: '7 preset teks 3D — extrude, long shadow, offset — → XML Alight Motion.',
  keywords: 'teks,3d,alight motion,xml,extrude,long shadow,offset',
};

/* roles: [id, label, default] — mengikuti tool acuan per preset. */
const PRESETS = [
  { id: 'flip3d', name: 'Flip 3D', dur: 2200,
    roles: [['base', 'Dasar / Wajah', '#FFFFFF'], ['face', 'Sorotan Wajah', '#FEA800'], ['extrudeA', 'Extrude A', '#FF9300'], ['extrudeB', 'Extrude B', '#FF8C00'], ['border', 'Bingkai', '#AC2D2A']],
    face: { rotation: [{ t: 0, v: '90.000000' }, { t: .45, v: '0.000000', e: 'local elastic 0.5 1.0 0.0 0.6' }], opacity: [{ t: 0, v: '0.000000' }, { t: .1, v: '1.000000' }] },
    faceTint: ['base', 'face'],
    stack: { dx: 6, dy: 6, lerp: ['extrudeA', 'extrudeB'] },
    shadow: { dx: 26, dy: 26, role: 'border', op: '0.55' } },
  { id: 'right', name: 'Geser 3D', dur: 2000, tRaw: true,
    roles: [['base', 'Dasar / Wajah', '#FFFFFF'], ['face', 'Sorotan', '#FFC3B2'], ['extrudeA', 'Kontur', '#DE5044'], ['extrudeB', 'Extrude', '#7E170E']],
    face: {
      location: [{ t: 0, off: [284.667, -1.903, 0] }, { t: .232978, off: [0, 0, 0], e: 'cubicBezier 0.0 0.0 0.13457225 1.0' }],
      opacity: [{ t: .016399, v: '0.000000' }, { t: .049196, v: '1.000000' }],
      pivot: '-17.740723,44.291916',
    },
    fx: {
      depth: [[.098393, .052], [.238390, .010]],
      rotate: [
        { t: 0, v: '0.000000,624.000000,0.000000' },
        { t: .249385, v: '0.000000,-35.000000,0.000000', e: 'cubicBezier 0.0 0.0 0.0 1.0' },
        { t: .435439, v: '0.000000,0.000000,0.000000', e: 'local elastic 0.5 1.0 0.0 1.0' }],
      blur: [{ t: .021974, v: '0.150000' }, { t: .118130, v: '0.000000', e: 'cubicBezier 0.42 0.0 0.1375221 1.0' }],
    } },
  { id: 'popup', name: 'Popup Rotate Extrude', dur: 2100, tRaw: true,
    roles: [['base', 'Dasar / Wajah', '#FFFFFF'], ['face', 'Sorotan', '#FFC3B2'], ['extrudeA', 'Kontur', '#DE5044'], ['extrudeB', 'Extrude', '#7E170E']],
    face: {
      location: [
        { t: 0, off: [0, 0, 0] },
        { t: .132249, off: [0, -164.336, 0], e: 'cubicBezier 0.25 0.25 0.15560472 0.95789474' },
        { t: .455040, off: [0, 0, 0], e: 'local elastic 0.5 1.0 0.0 0.550614' }],
      scale: [
        { t: 0, v: '0.000003,0.000003' },
        { t: .077365, v: '1.000000,1.000000', e: 'cubicBezier 0.0 0.3026316 0.0 1.0' },
        { t: .137870, v: '1.000000,1.000000' },
        { t: .234624, v: '1.000000,0.789638', e: 'cubicBezier 0.5936578 0.028947368 1.0 0.15789473' },
        { t: .521130, v: '1.000000,1.000000', e: 'local elastic 0.45575222 1.0 0.16605264 1.0' }],
      pivot: '-17.740723,44.291916',
    },
    fx: {
      depth: [[.098393, .052], [.238390, .010]],
      rotate: [
        { t: 0, v: '0.000000,240.000000,0.000000' },
        { t: .257133, v: '0.000000,0.000000,0.000000', e: 'cubicBezier 0.42 0.0 0.0 1.0' }],
    } },
  { id: 'longshadow', name: 'Long Shadow', dur: 2000,
    roles: [['base', 'Dasar / Wajah', '#FFFFFF'], ['border', 'Outline', '#007AFF'], ['extrudeA', 'Bayangan Panjang', '#013C95'], ['extrudeB', 'Aksen Bayangan', '#80D2F7']],
    face: { location: [{ t: 0, off: [0, -260, 0] }, { t: .35, off: [0, 0, 0], e: 'cubicBezier 0.0 0.0 0.16 1.0' }], opacity: [{ t: 0, v: '0.000000' }, { t: .07, v: '1.000000' }] },
    longshadow: { dx: 7, dy: 7, lerp: ['extrudeA', 'extrudeB'], max: 30 },
    outline8: { role: 'border', d: 3 } },
  { id: 'offsetA', name: 'Offset Kosongan', dur: 1800,
    roles: [['base', 'Teks', '#FFFFFF']],
    face: { scale: [{ t: 0, v: '0.000014,0.000014' }, { t: .35, v: '1.000000,1.000000', e: 'cubicBezier 0.34 1.3 0.64 1.0' }] },
    outline8: { fixed: '#141414', d: 4 } },
  { id: 'offsetOrange', name: 'Offset Orange', dur: 2000,
    roles: [['base', 'Dasar', '#FFFFFF'], ['g1', 'Gradasi 1', '#FF9500'], ['g2', 'Gradasi 2', '#D36300']],
    face: { location: [{ t: 0, off: [0, 200, 0] }, { t: .35, off: [0, 0, 0], e: 'cubicBezier 0.0 0.0 0.16 1.0' }] },
    gradstack: { dx: 6, dy: 6, lerp: ['g1', 'g2'] } },
  { id: 'offsetGreen', name: 'Offset Green Fire', dur: 2000,
    roles: [['base', 'Dasar', '#FFFFFF'], ['g1', 'Gradasi 1', '#00FF58'], ['g2', 'Gradasi 2', '#139CFF']],
    face: { location: [{ t: 0, off: [0, 200, 0] }, { t: .35, off: [0, 0, 0], e: 'local elastic 0.5 1.0 0.0 0.55' }] },
    gradstack: { dx: 6, dy: 6, lerp: ['g1', 'g2'] } },
];

const FONTS = ['Exo', 'Lexend', 'Inter', 'Poppins', 'Montserrat', 'Roboto', 'Open Sans', 'Lato', 'Nunito', 'Bebas Neue', 'Anton'];
const WEIGHTS = [['300', 'Light'], ['400', 'Regular'], ['500', 'Medium'], ['600', 'Semi Bold'], ['700', 'Bold'], ['800', 'Extra Bold'], ['900', 'Black']];

/* ---- Layout: posisi relatif ke titik 0,0 (parent null di 540,540 mengangkatnya
   ke tengah layar). Spasi antar kata = 1.625x spacing, maks 2 baris. ---- */
function layoutUnits(text, spacing, lineGap, posX, posY) {
  const wordGap = spacing * 1.625;
  const lines = String(text == null ? '' : text).replace(/\r/g, '').split('\n')
    .map((ln) => ln.replace(/\s+/g, ' ').trim()).filter(Boolean).slice(0, 2);
  const units = [];
  lines.forEach((line, li) => {
    const words = line.split(' ').filter(Boolean);
    let totalW = 0;
    words.forEach((w, wi) => { totalW += [...w].length * spacing + (wi ? wordGap : 0); });
    let cx = -totalW / 2;
    const y = (li - (lines.length - 1) / 2) * lineGap + posY;
    words.forEach((w, wi) => {
      if (wi) cx += wordGap;
      [...w].forEach((ch) => { units.push({ ch, x: cx + spacing / 2 + posX, y }); cx += spacing; });
    });
  });
  return units;
}

/* ---- Timing: start mengikuti kurva smooth atas spread/stagger; semua layer
   berakhir di titik yang sama (akhir scene). ---- */
const smoothY = (t) => { const u = 1 - t; return 3 * u * t * t + t * t * t; };
function timingPlan(n, o) {
  const spread = Math.max(0, +o.spread || 0);
  const stagger = Math.max(0, +o.stagger || 0);
  const maxBase = Math.max(spread, stagger * Math.max(0, n - 1));
  const starts = [];
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0 : i / (n - 1);
    starts.push(Math.round(smoothY(t) * maxBase));
  }
  const dur = Math.max(200, Math.round(+o.layerMs || 700));
  const hold = Math.max(0, Math.round(+o.endHold || 0));
  const finalEnd = (starts.length ? Math.max(...starts) : 0) + dur + hold;
  return { starts, ends: starts.map(() => finalEnd), total: Math.max(1000, finalEnd) };
}

/* ---- Pembangun XML ala Alight Motion ---- */
const f6 = (n) => AL.f6(n);
function sceneXml(title, total, inner) {
  return '<?xml version=\'1.0\' encoding=\'UTF-8\' ?>\n<!-- Generated by Adip Tools — Animasi Teks 3D -->\n' +
    '<scene title="' + T.esc(title) + '" width="1080" height="1080" exportWidth="1920" exportHeight="1080" bgcolor="#FF000000" totalTime="' + total +
    '" fps="60" modifiedTime="' + Date.now() + '" amver="859" ffver="107" am="com.alightcreative.motion/6.2.53" amplatform="ios" precompose="dynamicResolution" retime="freeze">\n' +
    '  <bookmark t="0"/>\n' + inner + '\n</scene>\n';
}
/* keyframe ternormalisasi 0..1 terhadap durasi layer */
function kfT(t, refDur, layerDur) { return (t * refDur / Math.max(1, layerDur)).toFixed(6); }
const kf = (t, v, e) => '<kf t="' + t + '" v="' + v + '"' + (e ? ' e="' + e + '"' : '') + '/>';
function textLayerXml(o) {
  let s = '  <text id="' + o.id + '" label="' + T.esc(o.label) + '" parent="' + o.parent + '" startTime="' + o.start + '" endTime="' + o.end +
    '" fillType="color" size="' + o.size.toFixed(6) + '" font="googlefonts?name=' + T.esc(o.font) + '&amp;weight=' + T.esc(o.weight) +
    '" wrapWidth="1200" align="center">\n    <transform>\n';
  s += '      <location>\n        ' + o.locKfs.join('\n        ') + '\n      </location>\n';
  if (o.pivot) s += '      <pivot value="' + o.pivot + '"/>\n';
  if (o.extraKfs) s += o.extraKfs;
  s += '    </transform>\n    <fillColor value="' + o.fillArgb + '"/>\n';
  if (o.effects) s += o.effects;
  s += '    <content>' + T.esc(o.content) + '</content>\n  </text>';
  return s;
}
function gradientOverlay2(c1, c2) {
  return '    <effect id="com.alightcreative.gradientoverlay2" locallyApplied="true">\n' +
    '      <property name="alpha" type="float" value="1.000000"/>\n' +
    '      <property name="color1" type="color" value="' + c1 + '"/>\n' +
    '      <property name="color2" type="color" value="' + c2 + '"/>\n    </effect>\n';
}
/* Rangkaian efek wajah ala template acuan: smoothedges + gradientoverlay2 +
   contourgrad + extrude (depth & rotate ber-keyframe) + gaussianblur opsional. */
function tmplEffects(p, rc, depthMul, tF) {
  const f = p.fx;
  let s = '    <effect id="com.alightcreative.effects.smoothedges" locallyApplied="true">\n' +
    '      <property name="strength" type="float" value="0.080000"/>\n    </effect>\n';
  s += gradientOverlay2(rc('base'), rc('face'));
  s += '    <effect id="com.alightcreative.contourgrad" locallyApplied="true">\n' +
    '      <property name="color1" type="color" value="' + rc('extrudeA') + '"/>\n' +
    '      <property name="color2" type="color" value="' + rc('extrudeA') + '"/>\n' +
    '      <property name="width" type="float" value="8.600000"/>\n    </effect>\n';
  s += '    <effect id="com.alightcreative.effects.smoothedges" locallyApplied="true">\n' +
    '      <property name="maskToLayer" type="bool" value="true"/>\n' +
    '      <property name="strength" type="float" value="0.080000"/>\n    </effect>\n';
  const dk = f.depth.map(([t, v]) => kf(tF(t), (v * depthMul).toFixed(6)));
  const rk = f.rotate.map((k) => kf(tF(k.t), k.v, k.e));
  s += '    <effect id="com.alightcreative.effects.extrude" locallyApplied="true">\n' +
    '      <property name="depth" type="float">\n        ' + dk.join('\n        ') + '\n      </property>\n' +
    '      <property name="fadeBlend" type="float" value="1.000000"/>\n' +
    '      <property name="fadeColor" type="color" value="' + rc('extrudeB') + '"/>\n' +
    '      <property name="interiorBlend" type="float" value="1.000000"/>\n' +
    '      <property name="interiorColor" type="color" value="' + rc('extrudeB') + '"/>\n' +
    '      <property name="rotate" type="vec3">\n        ' + rk.join('\n        ') + '\n      </property>\n' +
    '      <property name="shadingType" type="int" value="0"/>\n    </effect>\n';
  if (f.blur && f.blur.length) {
    s += '    <effect id="com.alightcreative.effects.gaussianblur" locallyApplied="true">\n' +
      '      <property name="strength" type="float">\n        ' + f.blur.map((k) => kf(tF(k.t), k.v, k.e)).join('\n        ') + '\n      </property>\n    </effect>\n';
  }
  return s;
}

export function generate(o) {
  const text = String(o.text == null ? '' : o.text);
  if (!text.trim()) throw new Error('Teks masih kosong — isi dulu teksnya.');
  const preset = PRESETS.find((p) => p.id === o.presetId) || PRESETS[0];
  const size = Math.max(10, Math.min(220, +o.size || 72));
  const spacing = o.autoLink ? Math.round(145 / 72 * size) : Math.max(0, Math.min(420, +o.spacing || 0));
  const lineGap = Math.max(60, Math.min(400, +o.lineGap || Math.round(240 / 72 * size)));
  const units = layoutUnits(text, spacing, lineGap, +o.posX || 0, +o.posY || 0);
  if (!units.length) throw new Error('Teks masih kosong — isi dulu teksnya.');
  const plan = timingPlan(units.length, o);
  const refDur = preset.dur;
  const depth = Math.max(0, Math.min(200, Number.isFinite(+o.depth) ? +o.depth : 100));
  const nStack = Math.max(0, Math.round(depth / 200 * 12));
  const layers = [];
  let id = 9;
  const parentId = 8;
  const roleColor = (rid, fb) => AL.argb((o.roles && o.roles[rid]) || fb || '#FFFFFF');
  const lerpRole = (r1, r2, k, n) => AL.argb(AL.lerpHex(
    '#' + roleColor(r1).slice(3), '#' + roleColor(r2).slice(3), n <= 1 ? 0 : 1 - k / n));

  units.forEach((u, i) => {
    const st = plan.starts[i], en = plan.ends[i], layerDur = Math.max(1, en - st);
    /* tRaw: waktu keyframe template sudah ternormalisasi thd durasi layer. */
    const tF = preset.tRaw ? (t) => (+t).toFixed(6) : (t) => kfT(t, refDur, layerDur);
    const face = preset.face || {};
    const locKfs = (face.location || [{ t: 0 }]).map((k) =>
      kf(tF(k.t),
        f6(u.x + (k.off ? k.off[0] : 0)) + ',' + f6(u.y + (k.off ? k.off[1] : 0)) + ',0.000000', k.e));
    const valKfs = (list) => (list || []).map((k) => kf(tF(k.t), k.v, k.e));
    let extra = '';
    if (face.scale && face.scale.length) extra += '      <scale>\n        ' + valKfs(face.scale).join('\n        ') + '\n      </scale>\n';
    if (face.rotation && face.rotation.length) extra += '      <rotation>\n        ' + valKfs(face.rotation).join('\n        ') + '\n      </rotation>\n';
    if (face.opacity && face.opacity.length) {
      extra += '      <opacity>\n        ' + valKfs(face.opacity).join('\n        ') + '\n      </opacity>\n';
    }
    const flat = (dx, dy, fill, op, suffix) => textLayerXml({
      id: id++, parent: parentId, label: u.ch + (suffix || ''), content: u.ch, start: st, end: en,
      size, font: o.font || 'Exo', weight: o.weight || '700',
      locKfs: [kf('0.000000', f6(u.x + dx) + ',' + f6(u.y + dy) + ',0.000000')],
      extraKfs: op ? '      <opacity>\n        ' + kf('0.000000', op) + '\n      </opacity>\n' : '',
      fillArgb: fill,
    });

    // 1) bayangan offset (paling belakang)
    if (preset.shadow) {
      const s = preset.shadow;
      layers.push(flat(s.dx, s.dy, roleColor(s.role), s.op || '0.5'));
    }
    // 2) long shadow: tumpukan banyak lapis
    if (preset.longshadow) {
      const s = preset.longshadow, n = Math.max(1, Math.round(s.max * depth / 200));
      for (let k = n; k >= 1; k--) {
        layers.push(flat(s.dx * k, s.dy * k,
          s.lerp ? lerpRole(s.lerp[0], s.lerp[1], k, n) : roleColor(s.role), '', '·ls' + k));
      }
    }
    // 3) tumpukan extrude
    if (preset.stack) {
      const s = preset.stack, n = Math.max(1, nStack);
      for (let k = n; k >= 1; k--) {
        layers.push(flat(s.dx * k, s.dy * k, s.lerp ? lerpRole(s.lerp[0], s.lerp[1], k, n) : roleColor(s.role), '', '·s' + k));
      }
    }
    // 3b) gradasi offset (offsetOrange / offsetGreen)
    if (preset.gradstack) {
      const s = preset.gradstack, n = Math.max(2, nStack);
      for (let k = n; k >= 1; k--) {
        layers.push(flat(s.dx * k, s.dy * k, lerpRole(s.lerp[0], s.lerp[1], k, n), '', '·g' + k));
      }
    }
    // 4) outline 8 arah (kontur)
    if (preset.outline8) {
      const s = preset.outline8;
      const d = s.fixed ? Math.max(2, Math.round(3 + depth / 200 * 8)) : (s.d || 3);
      const fill = s.fixed ? AL.argb(s.fixed) : roleColor(s.role);
      [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]].forEach(([dx, dy]) => {
        layers.push(flat(dx * d, dy * d, fill, '', '·o'));
      });
    }
    // 5) wajah (paling depan): rangkaian efek template atau tint gradasi
    const baseArgb = roleColor('base');
    layers.push(textLayerXml({
      id: id++, parent: parentId, label: u.ch, content: u.ch, start: st, end: en,
      size, font: o.font || 'Exo', weight: o.weight || '700',
      locKfs, extraKfs: extra, fillArgb: baseArgb, pivot: face.pivot,
      effects: preset.fx ? tmplEffects(preset, roleColor, depth / 100, tF)
        : (preset.faceTint ? gradientOverlay2(baseArgb, roleColor(preset.faceTint[1])) : ''),
    }));
  });
  layers.push('  <nullobj id="' + parentId + '" label="Null 1" startTime="0" endTime="' + plan.total + '" hidden="true" fillType="none">\n' +
    '    <transform>\n      <location value="540.000000,540.000000,0.000000"/>\n    </transform>\n  </nullobj>');

  const xml = sceneXml(AL.projectName(o.project, 'Teks 3D'), plan.total, layers.join('\n'));
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
  const inpStagger = T.input('number', '', '50'); inpStagger.min = 0; inpStagger.max = 2000;
  const inpSpread = T.input('number', '', '500'); inpSpread.min = 0; inpSpread.max = 10000;
  const inpDur = T.input('number', '', '700'); inpDur.min = 200;
  const inpHold = T.input('number', '', '1000'); inpHold.min = 0; inpHold.max = 5000;
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
  root.appendChild(T.grid2(T.field('Durasi layer, ms (≥200)', inpDur), T.field('Tahan akhir, ms (0–5000)', inpHold)));
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
      lineGap: Math.max(60, Math.min(400, Math.round(240 / 72 * (+inpSize.value || 72)))),
      depth: Math.max(0, Math.min(200, +inpDepth.value || 0)),
      stagger: Math.max(0, Math.min(2000, +inpStagger.value || 0)),
      spread: Math.max(0, Math.min(10000, +inpSpread.value || 0)),
      layerMs: Math.max(200, +inpDur.value || 700), endHold: Math.max(0, Math.min(5000, +inpHold.value || 0)),
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
