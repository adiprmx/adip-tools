import { h as T, utils, kv } from '../../core.js';

export const meta = {"id": "kalkulator-margin-of-safety", "name": "Kalkulator Margin of Safety", "cat": "bisnis", "icon": "🛡️", "desc": "Berapa diskon harga saham dari nilai wajarnya, dan harga beli maksimal dengan batas aman yang kamu mau.", "keywords": "margin of safety,batas aman,saham,nilai wajar,nilai intrinsik,graham,valuasi,harga beli", "since": "6.19.0"};

const nol = (x) => (x === 0 ? 0 : x);
const fmtP = (x, d) => nol(x).toFixed(d == null ? 2 : d).replace('.', ',') + '%';

/* Margin of safety = (nilai wajar - harga pasar) / nilai wajar x 100%.
   Hasil dalam persen. Null bila input tidak valid. */
export function hitungMarginOfSafety(nilaiWajar, hargaPasar) {
  const iv = Number(nilaiWajar), p = Number(hargaPasar);
  if (![iv, p].every(isFinite) || iv <= 0 || p < 0) return null;
  const m = ((iv - p) / iv) * 100;
  return Number.isFinite(m) ? m : null;
}

/* Harga beli maksimal = nilai wajar x (1 - margin yang diminta). */
export function hargaBeliMaksimal(nilaiWajar, marginPersen) {
  const iv = Number(nilaiWajar), m = Number(marginPersen);
  if (![iv, m].every(isFinite) || iv <= 0 || m < 0 || m >= 100) return null;
  const h = iv * (1 - m / 100);
  return Number.isFinite(h) ? h : null;
}
utils.marginOfSafety = hitungMarginOfSafety;

export function render(root) {
  const wajarI = T.input('text', 'cth: 10000', '');
  const hargaI = T.input('text', 'cth: 7000', '');
  const mintaI = T.input('text', 'cth: 30', '30');
  const box = T.out();

  const hitung = () => {
    const wajar = T.num(wajarI.value);
    const harga = T.num(hargaI.value);
    const minta = T.num(mintaI.value);
    if (!isFinite(wajar) || wajar <= 0) { T.show(box, '<div class="err">Isi nilai wajar saham dengan angka lebih dari 0.</div>'); return; }
    if (!isFinite(harga) || harga < 0) { T.show(box, '<div class="err">Isi harga pasar saham dengan angka 0 atau lebih.</div>'); return; }
    if (!isFinite(minta) || minta < 0 || minta >= 100) { T.show(box, '<div class="err">Isi batas aman yang kamu mau antara 0 sampai di bawah 100 persen.</div>'); return; }
    const mos = hitungMarginOfSafety(wajar, harga);
    const maks = hargaBeliMaksimal(wajar, minta);
    if (mos === null || maks === null) { T.show(box, '<div class="err">Angkanya terlalu besar untuk dihitung. Coba pakai angka yang lebih kecil.</div>'); return; }
    const diskon = wajar - harga;
    const lolos = mos >= minta;
    const vonis = mos < 0
      ? 'Harga pasar di atas nilai wajar: saham ini mahal menurut perhitunganmu, tidak ada batas aman sama sekali.'
      : lolos
        ? 'Harga pasar sudah memberi batas aman sesuai yang kamu mau.'
        : 'Harga pasar memberi batas aman, tapi masih di bawah yang kamu mau. Tunggu harga turun ke ' + T.rp(maks) + ' atau lebih rendah.';
    T.show(box,
      '<div class="big center">' + fmtP(mos) + '</div>' +
      '<p class="center">margin of safety saat ini</p>' +
      kv('Nilai wajar per saham', T.rp(wajar)) +
      kv('Harga pasar per saham', T.rp(harga)) +
      kv('Diskon dari nilai wajar', T.rp(diskon)) +
      kv('Harga beli maksimal (batas aman ' + fmtP(minta, 0) + ')', T.rp(maks)) +
      '<p class="' + (mos < 0 ? 'err' : lolos ? 'info' : 'warn') + '">' + vonis + '</p>' +
      '<p class="hint">Rumusnya: (nilai wajar - harga pasar) dibagi nilai wajar, dikali 100%. Benjamin Graham mempopulerkan konsep ini: beli di bawah nilai wajar supaya salah hitungmu tidak langsung jadi rugi. Hasilnya hanya sebaik perkiraan nilai wajarmu sendiri.</p>');
  };

  root.appendChild(T.el('<p class="note">Margin of safety itu jarak aman antara harga saham di pasar dan nilai wajarnya menurut perhitunganmu. Makin besar jaraknya, makin terlindungi kamu bila perhitunganmu meleset.</p>'));
  root.appendChild(T.field('Nilai wajar per saham (Rp)', wajarI, 'Perkiraanmu sendiri soal nilai sebenarnya saham ini, misal dari hitungan DCF atau Graham Number.'));
  root.appendChild(T.field('Harga pasar per saham (Rp)', hargaI, 'Harga saham saat ini di bursa.'));
  root.appendChild(T.field('Batas aman yang kamu mau (%)', mintaI, 'Umumnya 20 sampai 50 persen. Default 30%.'));
  root.appendChild(T.row(T.btn('Hitung Margin of Safety', hitung, true)));
  root.appendChild(box);
}
