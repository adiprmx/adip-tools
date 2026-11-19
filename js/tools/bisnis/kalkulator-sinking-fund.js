import { h as T, utils, kv } from '../../core.js';

export const meta = {"id": "kalkulator-sinking-fund", "name": "Kalkulator Sinking Fund (Dana Pelunasan)", "cat": "bisnis", "icon": "🐷", "desc": "Berapa setoran berkala yang dibutuhkan untuk mencapai target dana di masa depan.", "keywords": "sinking fund,dana pelunasan,tabungan target,setoran berkala,dana masa depan,amortisasi", "since": "6.19.0"};

/* Setoran berkala = target x i / ((1+i)^n - 1), dengan i = bunga per periode
   (desimal) dan n = jumlah periode. Bila bunga 0, setoran = target / n.
   Null bila input tidak valid. */
export function hitungSinkingFund(target, bungaPerPeriode, jumlahPeriode) {
  const fv = Number(target), i = Number(bungaPerPeriode), n = Number(jumlahPeriode);
  if (![fv, i, n].every(isFinite) || fv < 0 || i < 0 || n <= 0 || Math.floor(n) !== n) return null;
  if (i === 0) return fv / n;
  const pmt = fv * i / (Math.pow(1 + i, n) - 1);
  return Number.isFinite(pmt) ? pmt : null;
}
utils.sinkingFund = hitungSinkingFund;

export function render(root) {
  const targetI = T.input('text', 'cth: 100000000', '');
  const bungaI = T.input('text', 'cth: 6', '6');
  const tahunI = T.input('text', 'cth: 5', '');
  const frekS = T.select([['12', 'Bulanan'], ['4', 'Per 3 bulan'], ['2', 'Per 6 bulan'], ['1', 'Tahunan']], '12');
  const box = T.out();

  const hitung = () => {
    const target = T.num(targetI.value);
    const bunga = T.num(bungaI.value);
    const tahun = T.num(tahunI.value);
    const frek = Number(frekS.value);
    if (!isFinite(target) || target <= 0) { T.show(box, '<div class="err">Isi target dana dengan angka lebih dari 0.</div>'); return; }
    if (!isFinite(bunga) || bunga < 0 || bunga >= 100) { T.show(box, '<div class="err">Isi bunga per tahun antara 0 sampai di bawah 100 persen.</div>'); return; }
    if (!isFinite(tahun) || tahun <= 0) { T.show(box, '<div class="err">Isi jangka waktu dengan angka lebih dari 0.</div>'); return; }
    const n = Math.round(tahun * frek);
    if (Math.abs(tahun * frek - n) > 1e-9) { T.show(box, '<div class="err">Jangka waktu harus pas dengan frekuensi setoran (misal 5 tahun untuk setoran bulanan, bukan 5,5 bulan).</div>'); return; }
    const i = bunga / 100 / frek;
    const pmt = hitungSinkingFund(target, i, n);
    if (pmt === null) { T.show(box, '<div class="err">Angkanya terlalu besar untuk dihitung. Coba pakai angka yang lebih kecil.</div>'); return; }
    const totalSetor = pmt * n;
    const dariBunga = target - totalSetor;
    const namaFrek = { 12: 'bulan', 4: '3 bulan', 2: '6 bulan', 1: 'tahun' }[frek];
    T.show(box,
      '<div class="big center">' + T.rp(pmt) + '</div>' +
      '<p class="center">setoran per ' + namaFrek + '</p>' +
      kv('Target dana', T.rp(target)) +
      kv('Jumlah setoran', n + ' kali') +
      kv('Total yang kamu setor', T.rp(totalSetor)) +
      kv('Tambahan dari bunga', T.rp(dariBunga)) +
      '<p class="info">Bila setoran dilakukan teratur dan bunganya sesuai asumsi, target tercapai setelah ' + n + ' kali setoran.</p>' +
      '<p class="hint">Rumusnya: setoran = target x bunga per periode, dibagi ((1 + bunga per periode) pangkat jumlah periode - 1). Bunga dihitung per periode setoran, bukan per tahun. Hasil nyata tergantung bunga yang benar-benar didapat.</p>');
  };

  root.appendChild(T.el('<p class="note">Sinking fund itu dana yang dikumpulkan sedikit demi sedikit untuk satu tujuan di masa depan: melunasi utang, mengganti mesin, atau dana darurat. Masukkan target dan waktunya, dan tool ini menghitung setoran berkalanya.</p>'));
  root.appendChild(T.field('Target dana (Rp)', targetI, 'Jumlah yang mau dicapai di akhir periode.'));
  root.appendChild(T.field('Bunga (% per tahun)', bungaI, 'Perkiraan bunga dari tempat menyimpan dana. Isi 0 bila tanpa bunga.'));
  root.appendChild(T.field('Jangka waktu (tahun)', tahunI, 'Berapa lama mengumpulkan dana.'));
  root.appendChild(T.field('Frekuensi setoran', frekS, 'Seberapa sering menyetor.'));
  root.appendChild(T.row(T.btn('Hitung Setoran', hitung, true)));
  root.appendChild(box);
}
