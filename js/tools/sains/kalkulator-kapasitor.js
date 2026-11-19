import { h as T, utils } from '../../core.js';

export const meta = { id: 'kalkulator-kapasitor', name: 'Kalkulator Kapasitor', cat: 'sains', icon: '🔋', desc: 'Kapasitansi gabungan seri dan paralel, plus energi dan muatan yang tersimpan pada tegangan tertentu.', keywords: 'kapasitor,kapasitansi,seri,paralel,farad,mikrofarad,energi,muatan', since: '6.19.0' };

// Kapasitansi seri (µF): 1/C = 1/C1 + 1/C2 + ...
export function kapasitorSeri(list) {
  const ok = list.filter((x) => isFinite(x) && x > 0);
  if (!ok.length) return NaN;
  return 1 / ok.reduce((s, c) => s + 1 / c, 0);
}

// Kapasitansi paralel (µF): C = C1 + C2 + ...
export function kapasitorParalel(list) {
  const ok = list.filter((x) => isFinite(x) && x > 0);
  if (!ok.length) return NaN;
  return ok.reduce((s, c) => s + c, 0);
}

// Energi tersimpan (joule): E = 1/2 C V^2. C dalam farad.
export function energiKapasitor(cFarad, v) {
  if (!(cFarad > 0) || !isFinite(v)) return NaN;
  return 0.5 * cFarad * v * v;
}

// Muatan tersimpan (coulomb): Q = C V. C dalam farad.
export function muatanKapasitor(cFarad, v) {
  if (!(cFarad > 0) || !isFinite(v)) return NaN;
  return cFarad * v;
}

function fmtKecil(v, satuan) {
  if (!isFinite(v)) return 'di luar jangkauan';
  if (v === 0) return '0 ' + satuan;
  const abs = Math.abs(v);
  if (abs >= 0.001 && abs < 10000) return utils.fmtDes(v, 3) + ' ' + satuan;
  const e = v.toExponential(2).split('e');
  return e[0].replace('.', ',') + ' × 10^' + parseInt(e[1], 10) + ' ' + satuan;
}

export function render(root) {
  root.appendChild(T.el('<p class="hint">Kapasitor menyimpan muatan listrik. Dirangkai paralel, kapasitansinya dijumlah. Dirangkai seri, kapasitansi gabungannya malah lebih kecil dari yang paling kecil.</p>'));

  const nilaiTa = T.ta(4, 'Tulis nilai kapasitor dalam µF, satu per baris.\nContoh:\n100\n220\n470', '100\n100');
  const voltI = T.input('number', 'mis. 12', '12');
  const box = T.out();

  function bacaNilai() {
    return nilaiTa.value.split(/\r?\n/).map((s) => T.num(s)).filter((x) => isFinite(x));
  }

  function hitung() {
    const list = bacaNilai();
    if (list.length < 2) { T.toast('Tulis minimal dua nilai kapasitor'); return; }
    if (list.some((x) => x <= 0)) { T.toast('Nilai kapasitor harus lebih dari 0'); return; }
    const v = T.num(voltI.value);
    if (!isFinite(v) || v < 0) { T.toast('Tegangan harus 0 atau lebih'); return; }
    const seri = kapasitorSeri(list);
    const paralel = kapasitorParalel(list);
    const eSeri = energiKapasitor(seri * 1e-6, v);
    const eParalel = energiKapasitor(paralel * 1e-6, v);
    const qSeri = muatanKapasitor(seri * 1e-6, v);
    const qParalel = muatanKapasitor(paralel * 1e-6, v);
    T.show(box,
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:8px 0">' +
      '<div class="kv"><span class="k">Seri: kapasitansi</span><span class="v">' + utils.fmtDes(seri, 3) + ' µF</span></div>' +
      '<div class="kv"><span class="k">Paralel: kapasitansi</span><span class="v">' + utils.fmtDes(paralel, 3) + ' µF</span></div>' +
      '<div class="kv"><span class="k">Seri: energi di ' + utils.fmtDes(v, 0) + ' V</span><span class="v">' + fmtKecil(eSeri, 'J') + '</span></div>' +
      '<div class="kv"><span class="k">Paralel: energi di ' + utils.fmtDes(v, 0) + ' V</span><span class="v">' + fmtKecil(eParalel, 'J') + '</span></div>' +
      '<div class="kv"><span class="k">Seri: muatan</span><span class="v">' + fmtKecil(qSeri, 'C') + '</span></div>' +
      '<div class="kv"><span class="k">Paralel: muatan</span><span class="v">' + fmtKecil(qParalel, 'C') + '</span></div>' +
      '</div>' +
      '<p class="hint">Energi = ½ × C × V² dan muatan = C × V. Pada rangkaian seri, tegangan terbagi ke tiap kapasitor, jadi energi totalnya lebih kecil walau muatannya sama di tiap kapasitor.</p>');
  }

  root.append(
    T.field('Nilai kapasitor (µF, satu per baris)', nilaiTa),
    T.field('Tegangan yang dipakai (volt)', voltI),
    T.btn('Hitung rangkaiannya', hitung, true),
    box,
  );
}
