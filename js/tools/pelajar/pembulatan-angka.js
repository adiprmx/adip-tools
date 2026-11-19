import { h as T, utils } from '../../core.js';

export const meta = {"id": "pembulatan-angka", "name": "Pembulatan Angka", "cat": "pelajar", "icon": "🔢", "desc": "Bulatkan angka ke satuan, puluhan, ratusan, atau angka desimal, dengan 5 cara pembulatan.", "keywords": "pembulatan,round,bilangan,desimal,puluhan,ratusan,bankir,matematika", "since": "6.19.0"};

const n0 = (v) => (Object.is(v, -0) ? 0 : v);

// tempat: pangkat 10 yang dibulatkan. -3 = 3 desimal, 0 = satuan,
// 2 = ratusan, 3 = ribuan. mode: biasa | bawah | atas | bankir | nol.
export function bulatkan(n, tempat, mode) {
  if (!Number.isFinite(n)) return null;
  const t = Math.max(-6, Math.min(9, Math.floor(tempat)));
  const f = Math.pow(10, -t); // pengali ke bilangan bulat terdekat
  const x = Math.abs(n) * f;
  let b;
  if (mode === 'bawah') b = Math.floor(n * f) / f;
  else if (mode === 'atas') b = Math.ceil(n * f) / f;
  else if (mode === 'nol') b = Math.trunc(n * f) / f;
  else if (mode === 'bankir') {
    const fl = Math.floor(x);
    const d = x - fl;
    let r;
    if (Math.abs(d - 0.5) < 1e-9) r = fl % 2 === 0 ? fl : fl + 1; // genap yang menang
    else r = d > 0.5 ? fl + 1 : fl;
    b = (Math.sign(n) * r) / f;
  } else { // biasa: 0,5 ke atas (menjauhi nol)
    b = (Math.sign(n) * Math.round(x + 1e-9)) / f;
  }
  // toPrecision(12) membuang sisa galat biner (mis. 2,6800000000000002).
  return n0(Number(b.toPrecision(12)));
}

export const TEMPAT = [
  [-3, '3 angka desimal'], [-2, '2 angka desimal'], [-1, '1 angka desimal'],
  [0, 'Satuan'], [1, 'Puluhan'], [2, 'Ratusan'], [3, 'Ribuan'], [6, 'Jutaan'],
];
export const MODE = [
  ['biasa', 'Biasa (0,5 ke atas)'],
  ['bawah', 'Ke bawah'],
  ['atas', 'Ke atas'],
  ['bankir', 'Bankir (0,5 ke genap)'],
  ['nol', 'Potong (buang sisanya)'],
];

export function semuaMode(n, tempat) {
  return MODE.map(([m, label]) => ({ mode: m, label, hasil: bulatkan(n, tempat, m) }));
}

const fmtHasil = (v, tempat) => {
  if (v == null) return '-';
  if (tempat < 0) {
    const s = v.toFixed(-tempat);
    return s.replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }
  return T.fmt(v);
};

export function render(root) {
  const nI = T.input('text', 'Angka yang dibulatkan, mis. 2,675', '2,675');
  const tI = T.select(TEMPAT.map(([v, l]) => [String(v), l]), '-2');
  const mI = T.select(MODE, 'biasa');
  const box = T.out();

  const hitung = () => {
    const n = T.num(nI.value);
    const tempat = Number(tI.value);
    if (!Number.isFinite(n)) {
      T.show(box, '<p class="dim">Isi angkanya dulu. Koma desimal boleh ditulis pakai koma atau titik.</p>');
      return;
    }
    const hasil = bulatkan(n, tempat, mI.value);
    const labelTempat = (TEMPAT.find(([v]) => v === tempat) || [])[1] || '';
    const labelMode = (MODE.find(([v]) => v === mI.value) || [])[1] || '';
    let h = '<div class="big">' + fmtHasil(hasil, tempat) + '</div>';
    h += '<p class="dim">' + T.fmt(n) + ' dibulatkan ke ' + labelTempat.toLowerCase() + ' (' + labelMode.toLowerCase() + ')</p>';
    h += '<p style="margin-top:12px"><b>Semua cara, untuk tempat yang sama</b></p>';
    h += '<table style="width:100%;border-collapse:collapse;font-size:13px">';
    semuaMode(n, tempat).forEach((r) => {
      const aktif = r.mode === mI.value;
      h += '<tr' + (aktif ? ' style="background:rgba(255,255,255,.06)"' : '') + '><td style="padding:7px 8px;border-bottom:1px solid #251f18">' + T.esc(r.label) + '</td><td style="padding:7px 8px;border-bottom:1px solid #251f18;text-align:right;font-family:monospace">' + fmtHasil(r.hasil, tempat) + '</td></tr>';
    });
    h += '</table>';
    h += '<p class="hint">Cara bankir dipakai di keuangan: angka tepat di tengah (mis. 2,5) dibulatkan ke bilangan genap terdekat, jadi 2,5 jadi 2 dan 3,5 jadi 4.</p>';
    T.show(box, h);
  };

  const tombol = T.btn('Bulatkan', hitung, true);
  nI.addEventListener('input', hitung);
  tI.addEventListener('change', hitung);
  mI.addEventListener('change', hitung);

  root.appendChild(T.el('<p class="note">Pilih angka, tempat pembulatan, dan caranya. Hasilnya langsung muncul beserta perbandingan semua cara.</p>'));
  root.appendChild(T.grid2(T.field('Angka', nI), T.field('Bulatkan ke', tI), T.field('Cara pembulatan', mI)));
  root.appendChild(tombol);
  root.appendChild(box);
  hitung();
}
