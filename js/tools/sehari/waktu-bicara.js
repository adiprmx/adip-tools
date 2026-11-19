import { h as T, utils, kv } from '../../core.js';

// Perkiraan durasi bicara dari jumlah kata. Kecepatan umum: lambat 110,
// normal 140, cepat 170 kata per menit. Hitungan ini perkiraan, jeda dan
// penekanan tidak dihitung.
export const KECEPATAN = [
  ['110', 'Lambat (110 kata/menit)'],
  ['140', 'Normal (140 kata/menit)'],
  ['170', 'Cepat (170 kata/menit)'],
];
export function hitungKata(teks) {
  const kata = String(teks || '').trim().split(/\s+/).filter(Boolean);
  return teks && teks.trim() ? kata.length : 0;
}
export function waktuBicaraMenit(jumlahKata, wpm) {
  const k = Number(jumlahKata);
  const w = Number(wpm);
  if (!isFinite(k) || !isFinite(w) || k < 0 || w <= 0) return null;
  return k / w;
}
export function targetKata(menit, wpm) {
  const m = Number(menit);
  const w = Number(wpm);
  if (!isFinite(m) || !isFinite(w) || m < 0 || w <= 0) return null;
  return Math.round(m * w);
}
export function fmtMenit(menit) {
  const total = Math.round(Number(menit) || 0);
  if (total < 1) return 'kurang dari 1 menit';
  const j = Math.floor(total / 60);
  const m = total % 60;
  if (j <= 0) return total + ' menit';
  if (m === 0) return j + ' jam';
  return j + ' jam ' + m + ' menit';
}
utils.waktuBicara = { hitungKata, waktuBicaraMenit, targetKata };

export const meta = {"id": "waktu-bicara", "name": "Waktu Bicara", "cat": "sehari", "icon": "🗣️", "desc": "Perkirakan berapa lama naskahmu dibacakan, atau berapa kata yang perlu disiapkan untuk durasi tertentu.", "keywords": "waktu bicara,durasi pidato,jumlah kata,naskah,presentasi,kata per menit,speaking time", "since": "6.19.0"};
export function render(root) {
  const teksI = T.ta(6, 'Tempel naskah pidato, presentasi, atau skrip videomu di sini...', '');
  const kecepatanSel = T.select(KECEPATAN, '140');
  const targetI = T.input('text', 'cth: 10', ''); targetI.inputMode = 'decimal';
  const box = T.out();
  const boxTarget = T.out();

  const hitung = () => {
    const kata = hitungKata(teksI.value);
    const wpm = Number(kecepatanSel.value);
    if (!kata) { T.hide(box); }
    else {
      const menit = waktuBicaraMenit(kata, wpm);
      const lambat = waktuBicaraMenit(kata, 110);
      const cepat = waktuBicaraMenit(kata, 170);
      T.show(box,
        '<div class="big">' + fmtMenit(menit) + '</div>' +
        '<p class="center mut">Perkiraan di kecepatan ' + wpm + ' kata per menit.</p>' +
        kv('Jumlah kata', T.fmt(kata)) +
        kv('Bila bicara lambat', fmtMenit(lambat)) +
        kv('Bila bicara cepat', fmtMenit(cepat)) +
        '<p class="hint">Ini perkiraan. Jeda, tawa penonton, dan demo di tengah presentasi bikin durasi aslinya lebih lama. Sisakan kelonggaran 10 sampai 20 persen bila ada batas waktu ketat.</p>');
    }
    const target = T.num(targetI.value);
    if (!targetI.value.trim()) { T.hide(boxTarget); return; }
    if (!isFinite(target) || target <= 0 || target > 600) { T.show(boxTarget, '<div class="err">Durasi target harus angka 0 sampai 600 menit.</div>'); return; }
    const kataTarget = targetKata(target, wpm);
    T.show(boxTarget,
      kv('Target kata (' + fmtMenit(target) + ')', 'Sekitar <b>' + T.fmt(kataTarget) + ' kata</b> di kecepatan ' + wpm + ' kata/menit'));
  };
  [teksI, kecepatanSel, targetI].forEach((i) => i.addEventListener('input', hitung));
  kecepatanSel.addEventListener('change', hitung);

  root.appendChild(T.el('<p class="note">Tempel naskahmu untuk tahu berapa lama membacakannya, atau isi durasi target untuk tahu berapa kata yang harus disiapkan.</p>'));
  root.appendChild(T.field('Naskah', teksI));
  root.appendChild(T.field('Kecepatan bicara', kecepatanSel, 'Pidato formal biasanya lambat, obrolan santai lebih cepat'));
  root.appendChild(box);
  root.appendChild(T.field('Durasi target (menit, opsional)', targetI, 'Diisi untuk menghitung target jumlah kata'));
  root.appendChild(boxTarget);
}
