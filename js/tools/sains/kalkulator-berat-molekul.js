import { h as T } from '../../core.js';

export const meta = { id: 'kalkulator-berat-molekul', name: 'Kalkulator Berat Molekul', cat: 'sains', icon: '⚗️', desc: 'Massa molar senyawa dari rumus kimianya, lengkap dengan rincian tiap unsur. Massa atom memakai nilai standar IUPAC 2021.', keywords: 'berat molekul,massa molar,massa atom,rumus kimia,senyawa,kimia,mol', since: '6.18.0' };

// Massa atom standar IUPAC 2021 (CIAAW, "Standard atomic weights 2021").
// [simbol, nama Indonesia, massa]. Hanya unsur umum yang dimasukkan.
export const MASSA_ATOM = {
  H: ['Hidrogen', 1.008], He: ['Helium', 4.0026], Li: ['Litium', 6.94],
  Be: ['Berilium', 9.0122], B: ['Boron', 10.81], C: ['Karbon', 12.011],
  N: ['Nitrogen', 14.007], O: ['Oksigen', 15.999], F: ['Fluor', 18.998],
  Ne: ['Neon', 20.180], Na: ['Natrium', 22.990], Mg: ['Magnesium', 24.305],
  Al: ['Aluminium', 26.982], Si: ['Silikon', 28.085], P: ['Fosfor', 30.974],
  S: ['Belerang', 32.06], Cl: ['Klor', 35.45], Ar: ['Argon', 39.948],
  K: ['Kalium', 39.098], Ca: ['Kalsium', 40.078], Sc: ['Skandium', 44.956],
  Ti: ['Titanium', 47.867], V: ['Vanadium', 50.942], Cr: ['Krom', 51.996],
  Mn: ['Mangan', 54.938], Fe: ['Besi', 55.845], Co: ['Kobalt', 58.933],
  Ni: ['Nikel', 58.693], Cu: ['Tembaga', 63.546], Zn: ['Seng', 65.38],
  Ga: ['Galium', 69.723], Ge: ['Germanium', 72.630], As: ['Arsen', 74.922],
  Se: ['Selenium', 78.971], Br: ['Brom', 79.904], Kr: ['Kripton', 83.798],
  Rb: ['Rubidium', 85.468], Sr: ['Stronsium', 87.62], Y: ['Itrium', 88.906],
  Zr: ['Zirkonium', 91.224], Nb: ['Niobium', 92.906], Mo: ['Molibdenum', 95.95],
  Ag: ['Perak', 107.87], Cd: ['Kadmium', 112.41], Sn: ['Timah', 118.71],
  Sb: ['Antimon', 121.76], I: ['Iodium', 126.90], Ba: ['Barium', 137.33],
  Pt: ['Platina', 195.08], Au: ['Emas', 196.97], Hg: ['Raksa', 200.59],
  Pb: ['Timbal', 207.2], U: ['Uranium', 238.03],
};

// Parser rumus kimia: unsur, angka, tanda kurung bersarang, dan titik hidrat
// (CuSO4.5H2O atau CuSO4·5H2O). Mengembalikan {ok, unsur: {simbol: jumlah}}
// atau {ok:false, err}.
export function parseRumus(rumus) {
  let s = String(rumus == null ? '' : rumus).trim().replace(/\s+/g, '');
  if (!s) return { ok: false, err: 'Rumusnya masih kosong.' };
  // Pisahkan hidrat: tiap bagian diparse sendiri lalu dijumlah.
  const bagian = s.split(/[·.]/);
  const total = {};
  for (let bi = 0; bi < bagian.length; bi++) {
    let bag = bagian[bi];
    let pengali = 1;
    if (bi > 0) {
      const m = bag.match(/^(\d+)(.*)$/);
      if (!m) return { ok: false, err: 'Setelah titik hidrat harus ada angka lalu rumus, contoh 5H2O.' };
      pengali = parseInt(m[1], 10);
      bag = m[2];
    }
    if (!bag) return { ok: false, err: 'Ada bagian rumus yang kosong.' };
    let i = 0;
    const tumpuk = [{}];
    const bacaAngka = () => {
      let num = '';
      while (i < bag.length && /[0-9]/.test(bag[i])) { num += bag[i]; i++; }
      return num === '' ? 1 : parseInt(num, 10);
    };
    while (i < bag.length) {
      const c = bag[i];
      if (c === '(' || c === '[') { tumpuk.push({}); i++; continue; }
      if (c === ')' || c === ']') {
        if (tumpuk.length === 1) return { ok: false, err: 'Tanda kurung tutup tanpa pasangan di "' + bag + '".' };
        i++;
        const peng = bacaAngka();
        const isi = tumpuk.pop();
        const atas = tumpuk[tumpuk.length - 1];
        for (const k of Object.keys(isi)) atas[k] = (atas[k] || 0) + isi[k] * peng;
        continue;
      }
      if (/[A-Z]/.test(c)) {
        let sim = c; i++;
        if (i < bag.length && /[a-z]/.test(bag[i])) { sim += bag[i]; i++; }
        if (!(sim in MASSA_ATOM)) return { ok: false, err: 'Unsur "' + sim + '" tidak dikenal atau belum ada di tabel.' };
        const atas = tumpuk[tumpuk.length - 1];
        atas[sim] = (atas[sim] || 0) + bacaAngka();
        continue;
      }
      return { ok: false, err: 'Karakter "' + c + '" tidak bisa dibaca di rumus.' };
    }
    if (tumpuk.length !== 1) return { ok: false, err: 'Ada tanda kurung buka yang tidak ditutup.' };
    const hasil = tumpuk[0];
    for (const k of Object.keys(hasil)) total[k] = (total[k] || 0) + hasil[k] * pengali;
  }
  if (Object.keys(total).length === 0) return { ok: false, err: 'Rumusnya masih kosong.' };
  return { ok: true, unsur: total };
}

// Berat molekul (g/mol) + rincian per unsur.
export function hitungBeratMolekul(rumus) {
  const p = parseRumus(rumus);
  if (!p.ok) return p;
  const rincian = [];
  let total = 0;
  for (const sim of Object.keys(p.unsur)) {
    const [nama, massa] = MASSA_ATOM[sim];
    const sub = massa * p.unsur[sim];
    total += sub;
    rincian.push({ simbol: sim, nama, jumlah: p.unsur[sim], massaAtom: massa, subtotal: sub });
  }
  return { ok: true, unsur: p.unsur, rincian, total };
}

function fmtDes(v, des) {
  const d = des == null ? 3 : des;
  const r = Math.round(v * Math.pow(10, d)) / Math.pow(10, d);
  return String(r).replace('.', ',');
}

export function render(root) {
  root.appendChild(T.el('<p class="hint">Tulis rumus kimianya seperti biasa: H2SO4, C6H12O6, Ca(OH)2, atau CuSO4.5H2O untuk senyawa hidrat. Huruf besar kecilnya penting: Co itu kobalt, CO itu karbon monoksida.</p>'));

  const rI = T.input('text', 'cth: H2SO4', 'H2SO4');
  const box = T.out();

  function hitung() {
    const h = hitungBeratMolekul(rI.value);
    if (!h.ok) { T.toast(h.err); return; }
    const baris = h.rincian.map((r) =>
      '<tr><td style="padding:5px 8px">' + T.esc(r.simbol) + ' (' + T.esc(r.nama) + ')</td>' +
      '<td style="text-align:right;padding:5px 8px">' + r.jumlah + ' × ' + fmtDes(r.massaAtom) + '</td>' +
      '<td style="text-align:right;padding:5px 8px">' + fmtDes(r.subtotal) + '</td></tr>').join('');
    T.show(box,
      '<p class="big">' + fmtDes(h.total) + ' g/mol</p>' +
      '<p>Berat molekul ' + T.esc(rI.value.trim()) + ' adalah ' + fmtDes(h.total) + ' gram per mol.</p>' +
      '<table style="width:100%;border-collapse:collapse;margin-top:12px;font-size:13px"><thead><tr><th style="text-align:left;padding:6px 8px;border-bottom:1px solid rgba(255,255,255,.15)">Unsur</th><th style="text-align:right;padding:6px 8px;border-bottom:1px solid rgba(255,255,255,.15)">Jumlah × massa atom</th><th style="text-align:right;padding:6px 8px;border-bottom:1px solid rgba(255,255,255,.15)">Subtotal</th></tr></thead><tbody>' + baris + '</tbody></table>' +
      '<p class="hint">Massa atom memakai nilai standar IUPAC 2021 (CIAAW). 1 mol ' + T.esc(rI.value.trim()) + ' beratnya ' + fmtDes(h.total) + ' gram.</p>');
  }

  root.append(
    T.field('Rumus kimia', rI),
    T.btn('Hitung berat molekul', hitung, true),
    box,
  );
}
