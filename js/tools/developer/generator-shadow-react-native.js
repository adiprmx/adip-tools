import { h as T, utils } from '../../core.js';

// Buat kode bayangan (shadow) React Native untuk iOS dan Android
// sekaligus: properti shadow iOS (warna, offset, opacity, radius) +
// elevation Android. Pratinjau kartu memakai bayangan CSS yang
// menyerupai, bukan render React Native sungguhan — dan itu ditulis
// jelas di halaman.

export const meta = { id: 'generator-shadow-react-native', name: 'Generator Shadow React Native', cat: 'developer', icon: '🌑', desc: 'Atur bayangan kartu React Native lewat geseran, lalu salin kodenya untuk iOS dan Android sekaligus.', keywords: 'react native,shadow,bayangan,elevation,ios,android,stylesheet', since: '6.19.0' };

export const PRESET = {
  ringan: { warna: '#000000', x: 0, y: 1, opacity: 0.18, radius: 1.5, elevation: 2 },
  sedang: { warna: '#000000', x: 0, y: 2, opacity: 0.22, radius: 3, elevation: 4 },
  kuat: { warna: '#000000', x: 0, y: 6, opacity: 0.3, radius: 8, elevation: 10 },
  melayang: { warna: '#000000', x: 0, y: 12, opacity: 0.25, radius: 16, elevation: 16 },
};

function hexKeRgb(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || '').trim());
  if (!m) return { r: 0, g: 0, b: 0 };
  const n = parseInt(m[1], 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

// Murni, bisa diuji di Node. Angka dinormalisasi (-0 jadi 0, D-G4-04).
export function buatShadow(o) {
  const warna = /^#[0-9a-f]{6}$/i.test(String(o.warna || '')) ? o.warna : '#000000';
  const x = Math.max(-50, Math.min(50, Number(o.x) || 0));
  const y = Math.max(-50, Math.min(50, Number(o.y) || 0));
  const opacity = Math.max(0, Math.min(1, Number(o.opacity) || 0));
  const radius = Math.max(0, Math.min(50, Number(o.radius) || 0));
  const elevation = Math.max(0, Math.min(24, Math.round(Number(o.elevation) || 0)));
  const fx = utils.r4(x), fy = utils.r4(y), fo = utils.r4(opacity), fr = utils.r4(radius);
  const kode = '{\n' +
    '  // iOS\n' +
    "  shadowColor: '" + warna + "',\n" +
    '  shadowOffset: { width: ' + fx + ', height: ' + fy + ' },\n' +
    '  shadowOpacity: ' + fo + ',\n' +
    '  shadowRadius: ' + fr + ',\n' +
    '  // Android\n' +
    '  elevation: ' + elevation + ',\n' +
    '}';
  const styleSheet = 'const styles = StyleSheet.create({\n' +
    '  kartu: {\n' +
    "    backgroundColor: '#ffffff',\n" +
    '    borderRadius: 12,\n' +
    "    shadowColor: '" + warna + "',\n" +
    '    shadowOffset: { width: ' + fx + ', height: ' + fy + ' },\n' +
    '    shadowOpacity: ' + fo + ',\n' +
    '    shadowRadius: ' + fr + ',\n' +
    '    elevation: ' + elevation + ',\n' +
    '  },\n' +
    '});';
  const rgb = hexKeRgb(warna);
  const css = x + 'px ' + y + 'px ' + (radius * 2) + 'px rgba(' + rgb.r + ', ' + rgb.g + ', ' + rgb.b + ', ' + opacity + ')';
  return { warna, x, y, opacity, radius, elevation, kode, styleSheet, css };
}

export function render(root) {
  const st = document.createElement('style');
  st.textContent =
    '.rn-panggung{background:#e8e8e8;border-radius:10px;padding:36px 16px;display:flex;justify-content:center;margin:12px 0}' +
    '.rn-kartu{background:#fff;border-radius:12px;width:200px;height:120px;display:flex;align-items:center;justify-content:center;font-size:14px;color:#333}' +
    '.rn-geser{display:flex;gap:10px;align-items:center}' +
    '.rn-geser input[type=range]{flex:1}' +
    '.rn-geser output{min-width:52px;text-align:right;font-family:ui-monospace,monospace;font-size:13px}';
  root.appendChild(st);

  root.appendChild(T.el('<p class="hint">Bayangan di React Native beda caranya per sistem: iOS pakai properti shadow, Android pakai elevation. Tool ini membuat keduanya sekaligus. Pratinjau di bawah memakai bayangan CSS yang menyerupai, hasil akhir bisa sedikit berbeda di HP.</p>'));

  const panggung = T.el('<div class="rn-panggung"><div class="rn-kartu">Kartu contoh</div></div>');
  const kartu = panggung.querySelector('.rn-kartu');
  const kodeTa = T.ta(9, 'Kode muncul di sini…');
  kodeTa.style.fontFamily = 'ui-monospace,monospace';
  kodeTa.readOnly = true;

  const warnaI = document.createElement('input');
  warnaI.type = 'color';
  warnaI.value = '#000000';
  warnaI.style.cssText = 'width:100%;height:44px;padding:2px';

  function geser(label, min, maks, langkah, nilai, satuan) {
    const r = document.createElement('input');
    r.type = 'range';
    r.min = min; r.max = maks; r.step = langkah; r.value = nilai;
    const o = document.createElement('output');
    const wadah = T.el('<div class="rn-geser"></div>');
    wadah.append(r, o);
    const perbarui = () => { o.textContent = utils.r4(parseFloat(r.value)) + (satuan || ''); };
    r.addEventListener('input', () => { perbarui(); segarkan(); });
    perbarui();
    return { el: T.field(label, wadah), input: r, perbarui };
  }

  const gX = geser('Geser mendatar (width)', -50, 50, 1, 0);
  const gY = geser('Geser menurun (height)', -50, 50, 1, 2);
  const gOp = geser('Ketebalan bayangan (opacity)', 0, 1, 0.01, 0.22);
  const gRa = geser('Kelembutan tepi (radius)', 0, 50, 0.5, 3);
  const gEl = geser('Elevation Android', 0, 24, 1, 4);

  let pakaiStyleSheet = false;

  function segarkan() {
    const hasil = buatShadow({
      warna: warnaI.value,
      x: parseFloat(gX.input.value),
      y: parseFloat(gY.input.value),
      opacity: parseFloat(gOp.input.value),
      radius: parseFloat(gRa.input.value),
      elevation: parseFloat(gEl.input.value),
    });
    kartu.style.boxShadow = hasil.css;
    kodeTa.value = pakaiStyleSheet ? hasil.styleSheet : hasil.kode;
    return hasil;
  }

  function pakaiPreset(nama) {
    const p = PRESET[nama];
    warnaI.value = p.warna;
    gX.input.value = p.x; gY.input.value = p.y; gOp.input.value = p.opacity;
    gRa.input.value = p.radius; gEl.input.value = p.elevation;
    [gX, gY, gOp, gRa, gEl].forEach((g) => g.perbarui());
    segarkan();
  }

  warnaI.addEventListener('input', segarkan);
  const btnSheet = T.btn('Tampilkan sebagai StyleSheet', () => {
    pakaiStyleSheet = !pakaiStyleSheet;
    btnSheet.textContent = pakaiStyleSheet ? 'Tampilkan sebagai properti saja' : 'Tampilkan sebagai StyleSheet';
    segarkan();
  });

  const presetEl = T.el('<div class="row" style="flex-wrap:wrap"></div>');
  presetEl.append(
    T.btn('Ringan', () => pakaiPreset('ringan')),
    T.btn('Sedang', () => pakaiPreset('sedang')),
    T.btn('Kuat', () => pakaiPreset('kuat')),
    T.btn('Melayang', () => pakaiPreset('melayang')),
  );

  segarkan();

  root.append(
    panggung,
    T.field('Warna bayangan', warnaI, 'Warna hanya berpengaruh di iOS; Android memakai elevation tanpa warna.'),
    gX.el, gY.el, gOp.el, gRa.el, gEl.el,
    T.el('<p class="hint" style="margin:8px 0 4px">Preset:</p>'),
    presetEl,
    T.field('Kode React Native', kodeTa),
    T.row(T.copyBtn(() => kodeTa.value, 'Salin kode'), btnSheet),
    T.el('<p class="hint" style="margin-top:10px">Catatan: di iOS, bayangan baru kelihatan bila komponen punya backgroundColor. Di Android, elevation juga mengangkat komponen di atas yang lain.</p>'),
  );
}
