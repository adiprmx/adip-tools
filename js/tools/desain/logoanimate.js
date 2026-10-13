import { h as T, utils } from '../../core.js?v=6.9.20';

/* logoanimate — "Logo Animate": template animasi logo 8,33 detik -> XML Alight Motion.
   100% client-side. Koreografi template orisinal (bukan salinan template pihak lain).
   Catatan jujur: XML berisi placeholder logo — ganti dengan media logomu di
   Alight Motion setelah import. */
const AL = utils.alight;

export const meta = {
  id: 'logoanimate', name: 'Animasi Logo', cat: 'desain', icon: '🎬',
  desc: 'Template animasi logo 8,33 detik (logo + teks pendamping) → XML Alight Motion.',
  keywords: 'logo,animasi,intro,bumper,alight motion,xml',
};

const DUR = 8333; // 8,33 detik — sama persis dengan template acuan
const CW = 1440, CH = 1080; // kanvas scene acuan (export 1920x1080)
const CX = CW / 2, CY = CH / 2;
const FONTS = [
  ['pjs', 'Plus Jakarta Sans SemiBold', 'Plus Jakarta Sans-600'],
  ['poppins', 'Poppins Regular', 'Poppins-400'],
  ['inter', 'Inter Bold', 'Inter-700'],
];

export function generate(o) {
  const withText = o.withText !== false;
  const raw = String(o.text || '').replace(/[\x00-\x1f\x7f]/g, ' ').trim();
  if (withText && !raw) throw new Error('Teks pendamping masih kosong — isi dulu atau matikan opsinya.');
  const text = raw.replace(/\s+/g, ' ').slice(0, 80);
  const fontAttr = (FONTS.find((f) => f[0] === o.fontId) || FONTS[0])[2];
  const layers = [];
  let id = 9;

  // 1) Placeholder LOGO — null dengan denyut skala + float halus
  const logoXf = AL.xform({
    scale: [
      AL.kf(0, '0.750000,0.750000'),
      AL.kf(1200, '1.000000,1.000000', 'elastic(0.50,1.00,0.00,0.60)'),
      AL.kf(7000, '1.000000,1.000000'),
      AL.kf(DUR, '1.060000,1.060000', 'cubicBezier(0.33,0.00,0.67,1.00)'),
    ],
    location: [
      AL.kf(0, AL.f6(CX) + ',' + AL.f6(CY - 40) + ',0.000000'),
      AL.kf(2600, AL.f6(CX) + ',' + AL.f6(CY - 48) + ',0.000000', 'cubicBezier(0.37,0.00,0.63,1.00)'),
      AL.kf(5000, AL.f6(CX) + ',' + AL.f6(CY - 32) + ',0.000000', 'cubicBezier(0.37,0.00,0.63,1.00)'),
      AL.kf(DUR, AL.f6(CX) + ',' + AL.f6(CY - 40) + ',0.000000', 'cubicBezier(0.37,0.00,0.63,1.00)'),
    ],
    opacity: [AL.kf(0, '0.000000'), AL.kf(350, '1.000000')],
  });
  layers.push('  <nullobj id="' + (id++) + '" label="LOGO — ganti dengan media logomu di AM" startTime="0" endTime="' + DUR + '" hidden="false" fillType="none">\n' +
    '    <transform>\n' + logoXf + '\n    </transform>\n  </nullobj>');

  // 2) Teks pendamping — meluncur dari bawah dengan elastic + blur
  if (withText) {
    const tx = AL.xform({
      location: [
        AL.kf(600, AL.f6(CX) + ',880.000000,0.000000'),
        AL.kf(2200, AL.f6(CX) + ',700.000000,0.000000', 'cubicBezier(0.00,0.00,0.16,1.00)'),
      ],
      opacity: [AL.kf(600, '0.000000'), AL.kf(1100, '1.000000')],
      blur: [AL.kf(600, '0.100000'), AL.kf(1800, '0.000000')],
    });
    layers.push(AL.textLayer({
      id: id++, parent: 8, label: text.slice(0, 20), startMs: 600, endMs: DUR,
      size: 64, font: fontAttr, content: text,
      transform: tx, fillArgb: AL.argb(o.color),
    }));
  }
  layers.push(AL.nullLayer({ id: 8, label: 'Logo Animate', startMs: 0, endMs: DUR, x: CX, y: CY, hidden: true }));

  const xml = AL.buildScene({ title: AL.projectName(o.project, 'Animasi Logo'), totalMs: DUR, width: CW, height: CH, inner: layers.join('\n') });
  const v = AL.validate(xml);
  if (!v.ok) throw new Error(v.error);
  return { xml, filename: AL.fileFor(o.filename, 'logo', o.text || o.project), totalMs: DUR, layers: layers.length };
}

export function render(root) {
  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Bumper logo <b>8,33 detik</b> siap import ke Alight Motion: logo berdenyut masuk, teks pendamping meluncur, lalu zoom-out halus. Catatan jujur: XML ini memakai <b>placeholder logo</b> — ganti dengan media logomu di Alight Motion setelah import.</p>'));

  const inpText = T.ta(2, 'Teks pendamping…', 'ADIP TOOLS');
  const inpColor = T.input('color', ''); inpColor.value = '#FFFFFF';
  const inpColorTx = T.input('text', '#RRGGBB', '#FFFFFF'); inpColorTx.style.fontFamily = 'monospace';
  const selFont = T.select(FONTS.map((f) => [f[0], f[1]]), 'pjs');
  const chkText = T.input('checkbox', ''); chkText.checked = true;
  const inpProject = T.input('text', 'Nama project…', 'Animasi Logo');
  const inpFile = T.input('text', 'Otomatis: teks#logo', '');

  inpColor.addEventListener('input', () => { inpColorTx.value = inpColor.value.toUpperCase(); });
  inpColorTx.addEventListener('change', () => { if (AL.hexToRgb(inpColorTx.value)) inpColor.value = inpColorTx.value; });

  root.appendChild(T.field('Teks pendamping (maks 80)', inpText));
  root.appendChild(T.grid2(T.field('Warna teks', T.row(inpColor, inpColorTx)), T.field('Font template', selFont)));
  const tw = T.el('<label class="dim" style="font-size:13px;display:flex;gap:8px;align-items:center;margin:4px 0"></label>');
  tw.appendChild(chkText); tw.appendChild(document.createTextNode('Tambahkan teks ke template'));
  root.appendChild(tw);
  root.appendChild(T.grid2(T.field('Nama project', inpProject), T.field('Nama file (opsional)', inpFile)));

  const status = T.el('<div class="dim" style="font-size:12.5px;margin:8px 0"></div>');
  const xmlOut = T.ta(10, 'XML hasil akan muncul di sini…'); xmlOut.readOnly = true;
  xmlOut.style.fontFamily = 'monospace'; xmlOut.style.fontSize = '11px';
  let last = null;
  const hist = AL.historyUI('logoanimate', (xml) => { last = { xml }; xmlOut.value = xml; status.textContent = 'XML dari riwayat dimuat.'; });

  function doGenerate() {
    try {
      const r = generate({
        text: inpText.value, color: inpColor.value, fontId: selFont.value,
        withText: chkText.checked, project: inpProject.value, filename: inpFile.value,
      });
      last = r; xmlOut.value = r.xml;
      status.innerHTML = '✅ XML siap — durasi ' + (r.totalMs / 1000).toFixed(2) + ' dtk · <span class="dim">' + T.esc(r.filename) + '</span>';
      AL.history.push('logoanimate', { filename: r.filename, project: inpProject.value, preset: 'Logo 8,33 dtk', xml: r.xml });
      hist.refresh();
    } catch (e) { status.innerHTML = '<span class="err">❌ ' + T.esc(e.message) + '</span>'; }
  }
  root.appendChild(T.row(T.btn('⚙️ Generate XML', doGenerate, true)));
  root.appendChild(status);
  root.appendChild(T.field('Lihat XML hasil', xmlOut));
  root.appendChild(T.row(
    T.btn('⬇️ Unduh XML', () => {
      if (!last) { T.toast('Generate dulu XML-nya'); return; }
      const err = AL.downloadXml(last.filename || 'logo.xml', last.xml);
      T.toast(err || 'Mengunduh…');
    }, true),
    T.copyBtn(() => (last ? last.xml : ''), '📋 Salin XML'),
  ));
  root.appendChild(T.el('<div class="dim" style="font-size:13px;font-weight:700;margin:12px 0 4px">🕘 Riwayat</div>'));
  root.appendChild(hist);
}
