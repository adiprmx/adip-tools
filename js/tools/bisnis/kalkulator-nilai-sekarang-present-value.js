import { h as T, kv } from '../../core.js';

export const meta = {"id": "kalkulator-nilai-sekarang-present-value", "name": "Kalkulator Nilai Sekarang (Present Value)", "cat": "bisnis", "icon": "⏳", "desc": "Nilai uang hari ini, nilai masa depan, dan anuitas — berapa nilai uang di masa depan kalau dihitung dengan nilai hari ini, dan sebaliknya.", "keywords": "present value,nilai sekarang,diskonto,nilai waktu uang,nilai masa depan,future value,anuitas", "since": "6.17.0"};

// PV = FV / (1 + r)^n. r dalam desimal, n dalam tahun.
export function hitungPV(nilaiMasaDepan, diskontoPersen, tahun) {
  const fv = Number(nilaiMasaDepan), r = Number(diskontoPersen) / 100, n = Number(tahun);
  if (![fv, r, n].every(isFinite) || fv < 0 || r < 0 || r >= 1 || n < 0) return null;
  const pv = fv / Math.pow(1 + r, n);
  if (!isFinite(pv)) return null;
  return { pv, faktor: pv / (fv || 1), diskon: fv - pv };
}

// FV = PV x (1 + r)^n — kebalikan PV: uang hari ini jadi berapa nanti.
export function hitungFV(nilaiSekarang, bungaPersen, tahun) {
  const pv = Number(nilaiSekarang), r = Number(bungaPersen) / 100, n = Number(tahun);
  if (![pv, r, n].every(isFinite) || pv < 0 || r < 0 || r >= 1 || n < 0) return null;
  const fv = pv * Math.pow(1 + r, n);
  if (!isFinite(fv)) return null;
  return { fv, untung: fv - pv, faktor: pv === 0 ? 1 : fv / pv };
}

// Anuitas: setoran tetap tiap tahun selama n tahun (dibayar di akhir tahun).
// PV anuitas = PMT x (1 − (1+r)^−n) / r; FV anuitas = PMT x ((1+r)^n − 1) / r.
// Bila r = 0, keduanya = PMT x n.
export function hitungAnuitas(setoranPerTahun, bungaPersen, tahun) {
  const pmt = Number(setoranPerTahun), r = Number(bungaPersen) / 100, n = Number(tahun);
  if (![pmt, r, n].every(isFinite) || pmt < 0 || r < 0 || r >= 1 || n < 0) return null;
  const totalSetoran = pmt * n;
  let pv, fv;
  if (r === 0) { pv = totalSetoran; fv = totalSetoran; }
  else {
    pv = pmt * (1 - Math.pow(1 + r, -n)) / r;
    fv = pmt * (Math.pow(1 + r, n) - 1) / r;
  }
  if (![pv, fv, totalSetoran].every(isFinite)) return null;
  return { pv, fv, totalSetoran, untung: fv - totalSetoran };
}

export function render(root) {
  let mode = 'pv';
  const jmlI = T.input('text', 'cth: 100000000', '');
  const rI = T.input('text', 'cth: 10', '');
  const nI = T.input('text', 'cth: 5', '');
  const box = T.out();

  const LABEL = {
    pv: { jumlah: 'Jumlah di masa depan (Rp)', jumlahHint: 'Uang yang akan kamu terima di masa depan.', tombol: 'Hitung Nilai Sekarang', note: 'Rp100 juta lima tahun lagi tidak sama dengan Rp100 juta hari ini. Tool ini menghitung berapa nilai uang masa depan itu kalau dibawa ke hari ini.' },
    fv: { jumlah: 'Jumlah sekarang (Rp)', jumlahHint: 'Uang yang kamu punya hari ini.', tombol: 'Hitung Nilai Masa Depan', note: 'Uang yang diputar hari ini tumbuh karena bunga. Tool ini menghitung uangmu jadi berapa setelah sekian tahun.' },
    anuitas: { jumlah: 'Setoran per tahun (Rp)', jumlahHint: 'Uang yang disetor tiap tahun, misal tabungan atau cicilan.', tombol: 'Hitung Anuitas', note: 'Anuitas itu setoran atau penerimaan tetap tiap tahun — misal nabung Rp10 juta tiap tahun. Tool ini menghitung nilai seluruh setoran itu hari ini dan di akhir.' },
  };
  const noteEl = T.el('<p class="note"></p>');
  const fldJumlah = T.field('Jumlah di masa depan (Rp)', jmlI, 'Uang yang akan kamu terima di masa depan.');
  const bPv = T.btn('Nilai sekarang (PV)', () => setMode('pv'));
  const bFv = T.btn('Nilai masa depan (FV)', () => setMode('fv'));
  const bAn = T.btn('Anuitas (setoran rutin)', () => setMode('anuitas'));

  const setMode = (m) => {
    mode = m;
    bPv.classList.toggle('primary', m === 'pv');
    bFv.classList.toggle('primary', m === 'fv');
    bAn.classList.toggle('primary', m === 'anuitas');
    const L = LABEL[m];
    noteEl.textContent = L.note;
    const lb = fldJumlah.querySelector('label');
    if (lb) lb.textContent = L.jumlah;
    const hintEl = fldJumlah.querySelector('.hint');
    if (hintEl) hintEl.textContent = L.jumlahHint;
    btnHitung.textContent = L.tombol;
    T.show(box, '');
  };

  const hitung = () => {
    const jml = T.num(jmlI.value);
    const r = T.num(rI.value);
    const n = T.num(nI.value);
    if (!isFinite(jml) || jml < 0) { T.show(box, '<div class="err">Jumlah harus diisi angka 0 atau lebih.</div>'); return; }
    if (!isFinite(r) || r < 0 || r >= 100) { T.show(box, '<div class="err">Tingkat bunga/diskonto diisi 0 sampai di bawah 100.</div>'); return; }
    if (!isFinite(n) || n < 0 || n > 100) { T.show(box, '<div class="err">Jangka waktu diisi 0 sampai 100 tahun, boleh desimal.</div>'); return; }
    if (mode === 'pv') {
      const hasil = hitungPV(jml, r, n);
      if (hasil === null) { T.show(box, '<div class="err">Angkanya terlalu besar untuk dihitung. Coba pakai angka yang lebih kecil.</div>'); return; }
      T.show(box,
        '<div class="big center">' + T.rp(hasil.pv) + '</div>' +
        '<p class="center">nilainya dalam uang hari ini</p>' +
        kv('Jumlah di masa depan', T.rp(jml)) +
        kv('Potongan karena waktu', T.rp(hasil.diskon)) +
        kv('Faktor diskon', hasil.faktor.toFixed(4).replace('.', ',')) +
        kv('Tingkat diskonto', String(r).replace('.', ',') + '% per tahun') +
        '<p class="hint">Uang hari ini lebih berharga dari uang nanti karena bisa diputar dulu. Tingkat diskonto biasanya memakai bunga deposito atau hasil investasi lain yang sejenis.</p>');
    } else if (mode === 'fv') {
      const hasil = hitungFV(jml, r, n);
      if (hasil === null) { T.show(box, '<div class="err">Angkanya terlalu besar untuk dihitung. Coba pakai angka yang lebih kecil.</div>'); return; }
      T.show(box,
        '<div class="big center">' + T.rp(hasil.fv) + '</div>' +
        '<p class="center">nilainya ' + String(n).replace('.', ',') + ' tahun lagi</p>' +
        kv('Jumlah sekarang', T.rp(jml)) +
        kv('Pertumbuhan karena bunga', T.rp(hasil.untung)) +
        kv('Faktor pengali', hasil.faktor.toFixed(4).replace('.', ',')) +
        kv('Tingkat bunga', String(r).replace('.', ',') + '% per tahun') +
        '<p class="hint">Bunga dihitung majemuk tiap tahun: tiap tahun bunganya ikut berbunga lagi.</p>');
    } else {
      const hasil = hitungAnuitas(jml, r, n);
      if (hasil === null) { T.show(box, '<div class="err">Angkanya terlalu besar untuk dihitung. Coba pakai angka yang lebih kecil.</div>'); return; }
      T.show(box,
        '<div class="big center">' + T.rp(hasil.fv) + '</div>' +
        '<p class="center">total nilai setoran di akhir tahun ke-' + String(n).replace('.', ',') + '</p>' +
        kv('Total yang disetor', T.rp(hasil.totalSetoran)) +
        kv('Pertumbuhan karena bunga', T.rp(hasil.untung)) +
        kv('Nilai seluruh setoran hari ini', T.rp(hasil.pv)) +
        kv('Tingkat bunga', String(r).replace('.', ',') + '% per tahun') +
        '<p class="hint">Setoran dianggap dibayar di akhir tiap tahun. "Nilai hari ini" berguna bila kamu membandingkan dengan menerima uang sekaligus sekarang.</p>');
    }
  };

  // Hitung-live (Q4 v6.21.0): hasil ikut berubah saat mengetik.
  [jmlI, rI, nI].forEach((i) => i.addEventListener('input', hitung));

  const btnHitung = T.btn('Hitung Nilai Sekarang', hitung, true);

  root.appendChild(noteEl);
  root.appendChild(T.row(bPv, bFv, bAn));
  root.appendChild(fldJumlah);
  root.appendChild(T.field('Tingkat bunga/diskonto (% per tahun)', rI, 'Perkiraan hasil kalau uangnya diputar di tempat lain.'));
  root.appendChild(T.field('Jangka waktu (tahun)', nI, 'Berapa tahun. Boleh desimal.'));
  root.appendChild(T.row(btnHitung));
  root.appendChild(box);
  setMode('pv');
}
