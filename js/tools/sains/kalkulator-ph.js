import { h as T } from '../../core.js';

export const meta = { id: 'kalkulator-ph', name: 'Kalkulator pH', cat: 'sains', icon: '🧫', desc: 'pH dari konsentrasi ion hidrogen dan sebaliknya, plus pH asam dan basa kuat. Lengkap dengan skala 0 sampai 14.', keywords: 'ph,asam,basa,konsentrasi,ion hidrogen,poh,kimia', since: '6.18.0' };

// pH = -log10[H+]. Berlaku suhu kamar (25 C, Kw = 1e-14).
export function phDariH(h) {
  if (!(h > 0)) return null;
  return -Math.log10(h);
}

export function hDariPh(ph) {
  if (!isFinite(ph) || ph < 0 || ph > 14) return null;
  return Math.pow(10, -ph);
}

// pH dari [OH-]: pOH = -log10[OH-], pH = 14 - pOH.
export function phDariOh(oh) {
  if (!(oh > 0)) return null;
  return 14 + Math.log10(oh);
}

// Asam kuat terionisasi sempurna: [H+] = konsentrasi x jumlah H+ per molekul.
export function phAsamKuat(konsentrasi, jumlahH) {
  if (!(konsentrasi > 0) || !(jumlahH >= 1)) return null;
  return phDariH(konsentrasi * jumlahH);
}

// Basa kuat terionisasi sempurna: [OH-] = konsentrasi x jumlah OH- per molekul.
export function phBasaKuat(konsentrasi, jumlahOh) {
  if (!(konsentrasi > 0) || !(jumlahOh >= 1)) return null;
  return phDariOh(konsentrasi * jumlahOh);
}

export function sifatPh(ph) {
  if (ph < 7) return ph < 3 ? 'asam kuat' : 'asam';
  if (ph > 7) return ph > 11 ? 'basa kuat' : 'basa';
  return 'netral';
}

function fmtDes(v, des) {
  if (!isFinite(v)) return 'di luar jangkauan';
  const d = des == null ? 2 : des;
  const r = Math.round(v * Math.pow(10, d)) / Math.pow(10, d);
  return String(r).replace('.', ',');
}

function fmtKonsentrasi(h) {
  if (!isFinite(h) || h <= 0) return 'di luar jangkauan';
  if (h >= 0.001) return fmtDes(h, 4) + ' M';
  return h.toExponential(2).replace('.', ',') + ' M';
}

function gambarSkala(ph) {
  const W = 340, H = 44, P = 10;
  const x = P + (ph / 14) * (W - 2 * P);
  const warna = ph < 7 ? '#e5484d' : ph > 7 ? '#3e63dd' : '#46a758';
  return '<svg viewBox="0 0 ' + W + ' ' + H + '" style="width:100%;max-width:420px;height:auto;display:block;margin-top:12px" role="img" aria-label="Skala pH 0 sampai 14">' +
    '<rect x="' + P + '" y="12" width="' + (W - 2 * P) + '" height="10" rx="5" fill="#2e2823" />' +
    '<rect x="' + P + '" y="12" width="' + ((W - 2 * P) / 2).toFixed(1) + '" height="10" rx="5" fill="#e5484d" opacity="0.55" />' +
    '<rect x="' + (P + (W - 2 * P) / 2).toFixed(1) + '" y="12" width="' + ((W - 2 * P) / 2).toFixed(1) + '" height="10" rx="5" fill="#3e63dd" opacity="0.55" />' +
    '<line x1="' + x.toFixed(1) + '" y1="6" x2="' + x.toFixed(1) + '" y2="28" stroke="' + warna + '" stroke-width="3" />' +
    '<text x="' + P + '" y="40" fill="#a89c88" font-size="10">0 asam</text>' +
    '<text x="' + (W / 2) + '" y="40" fill="#a89c88" font-size="10" text-anchor="middle">7 netral</text>' +
    '<text x="' + (W - P) + '" y="40" fill="#a89c88" font-size="10" text-anchor="end">14 basa</text></svg>';
}

export function render(root) {
  root.appendChild(T.el('<p class="hint">pH mengukur keasaman dari 0 sampai 14. Di bawah 7 itu asam, 7 netral, di atas 7 basa. Tiap selisih 1 pH artinya keasamannya beda 10 kali lipat.</p>'));

  const mode = T.select([
    ['dariH', 'Dari konsentrasi ion H+'],
    ['dariPh', 'Dari nilai pH'],
    ['dariOh', 'Dari konsentrasi ion OH-'],
    ['asam', 'Asam kuat (mis. HCl, H2SO4)'],
    ['basa', 'Basa kuat (mis. NaOH, Ca(OH)2)'],
  ], 'dariH');
  const cI = T.input('text', 'cth: 0,01', '0.01'); cI.inputMode = 'decimal';
  const nI = T.input('number', 'cth: 1', '1');
  const box = T.out();

  const labelC = T.el('<div></div>');
  const wrapN = T.el('<div></div>');
  wrapN.appendChild(T.field('Jumlah ion per molekul', nI, 'HCl = 1, H2SO4 = 2, NaOH = 1, Ca(OH)2 = 2.'));

  function aturTampil() {
    const m = mode.value;
    wrapN.hidden = m !== 'asam' && m !== 'basa';
    const label = m === 'dariH' ? 'Konsentrasi ion H+ (mol/L)' :
      m === 'dariPh' ? 'Nilai pH (0 sampai 14)' :
      m === 'dariOh' ? 'Konsentrasi ion OH- (mol/L)' :
      m === 'asam' ? 'Konsentrasi asam (mol/L)' : 'Konsentrasi basa (mol/L)';
    labelC.innerHTML = '';
    labelC.appendChild(T.field(label, cI));
  }
  mode.addEventListener('change', aturTampil);
  aturTampil();

  function tampilHasil(ph) {
    const h = hDariPh(ph);
    const poh = 14 - ph;
    const oh = Math.pow(10, -poh);
    T.show(box,
      '<p class="big">pH ' + fmtDes(ph) + ' (' + sifatPh(ph) + ')</p>' +
      '<p>[H+] = ' + fmtKonsentrasi(h) + ' · pOH = ' + fmtDes(poh) + ' · [OH-] = ' + fmtKonsentrasi(oh) + '.</p>' +
      gambarSkala(ph) +
      '<p class="hint">Hitungan pada suhu kamar (25 °C). Asam dan basa kuat dianggap terurai sempurna.</p>');
  }

  function hitung() {
    const c = T.num(cI.value);
    if (!isFinite(c)) { T.toast('Isi angkanya dulu'); return; }
    if (mode.value === 'dariH') {
      if (!(c > 0)) { T.toast('Konsentrasi ion H+ harus lebih dari 0'); return; }
      tampilHasil(phDariH(c));
    } else if (mode.value === 'dariPh') {
      if (c < 0 || c > 14) { T.toast('Nilai pH harus antara 0 dan 14'); return; }
      tampilHasil(c);
    } else if (mode.value === 'dariOh') {
      if (!(c > 0)) { T.toast('Konsentrasi ion OH- harus lebih dari 0'); return; }
      tampilHasil(phDariOh(c));
    } else {
      const n = T.num(nI.value);
      if (!(c > 0)) { T.toast('Konsentrasinya harus lebih dari 0'); return; }
      if (!Number.isInteger(n) || n < 1 || n > 4) { T.toast('Jumlah ion per molekul harus bilangan bulat 1 sampai 4'); return; }
      const ph = mode.value === 'asam' ? phAsamKuat(c, n) : phBasaKuat(c, n);
      if (ph < 0 || ph > 14) { T.toast('Hasilnya di luar skala 0-14; konsentrasinya terlalu pekat untuk rumus sederhana ini'); return; }
      tampilHasil(ph);
    }
  }

  root.append(
    T.field('Yang diketahui', mode),
    labelC,
    wrapN,
    T.btn('Hitung pH', hitung, true),
    box,
  );
}
