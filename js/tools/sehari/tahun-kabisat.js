import { h as T, utils, kv } from '../../core.js';

// Tahun kabisat: tahun yang Februari-nya 29 hari. Aturan kalender
// Gregorian: habis dibagi 4, KECUALI habis dibagi 100, KECUALI lagi
// habis dibagi 400. Jadi 2024 kabisat, 1900 bukan, 2000 kabisat.
export function isKabisat(tahun) {
  const y = Math.trunc(Number(tahun));
  if (!Number.isFinite(y)) return false;
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}
utils.kabisat = isKabisat;

export function kabisatBerikutnya(tahun) {
  let y = Math.trunc(Number(tahun));
  if (!Number.isFinite(y)) return null;
  do { y += 1; } while (!isKabisat(y));
  return y;
}
export function kabisatSebelumnya(tahun) {
  let y = Math.trunc(Number(tahun));
  if (!Number.isFinite(y)) return null;
  do { y -= 1; } while (!isKabisat(y));
  return y;
}
export function daftarKabisatBerikutnya(tahun, jumlah) {
  const hasil = [];
  let y = Math.trunc(Number(tahun));
  if (!Number.isFinite(y)) return hasil;
  const n = Math.max(1, Math.min(20, Math.trunc(Number(jumlah)) || 5));
  while (hasil.length < n) { y = kabisatBerikutnya(y); hasil.push(y); }
  return hasil;
}
// Alasan singkat kenapa tahun ini kabisat atau bukan.
export function alasanKabisat(tahun) {
  const y = Math.trunc(Number(tahun));
  if (!Number.isFinite(y)) return '';
  if (y % 400 === 0) return 'Habis dibagi 400, jadi tetap kabisat.';
  if (y % 100 === 0) return 'Habis dibagi 100 tapi tidak habis dibagi 400, jadi bukan kabisat.';
  if (y % 4 === 0) return 'Habis dibagi 4 dan tidak habis dibagi 100, jadi kabisat.';
  return 'Tidak habis dibagi 4, jadi bukan kabisat.';
}

export const meta = {"id": "tahun-kabisat", "name": "Tahun Kabisat", "cat": "sehari", "icon": "📅", "desc": "Cek tahun kabisat atau bukan, plus tahun kabisat berikutnya dan sebelumnya.", "keywords": "kabisat,tahun kabisat,februari,29 februari,leap year,kalender", "since": "6.19.0"};
export function render(root) {
  const tahunI = T.input('text', 'cth: 2026', String(new Date().getFullYear()));
  tahunI.inputMode = 'numeric';
  const box = T.out();

  const hitung = () => {
    const v = T.num(tahunI.value);
    if (!isFinite(v) || Math.trunc(v) < 1 || Math.trunc(v) > 9999) {
      T.show(box, '<div class="err">Isi tahun dengan angka 1 sampai 9999.</div>');
      return;
    }
    const y = Math.trunc(v);
    const kabisat = isKabisat(y);
    const berikut = daftarKabisatBerikutnya(y, 5);
    const sebelum = kabisatSebelumnya(y);
    const next = kabisatBerikutnya(y);
    T.show(box,
      '<div class="big">' + (kabisat ? 'Ya, kabisat' : 'Bukan kabisat') + '</div>' +
      '<p class="center mut">' + T.fmt(y) + ' punya ' + (kabisat ? '366 hari, Februari 29 hari.' : '365 hari, Februari 28 hari.') + '</p>' +
      kv('Alasannya', T.esc(alasanKabisat(y))) +
      kv('Kabisat sebelumnya', T.fmt(sebelum)) +
      kv('Kabisat berikutnya', T.fmt(next) + (kabisat ? '' : ' (' + (next - y) + ' tahun lagi)')) +
      kv('5 kabisat berikutnya', berikut.map((t) => T.fmt(t)).join(', ')) +
      '<p class="hint">Aturannya: tahun kabisat bila habis dibagi 4, kecuali tahun abad (1700, 1800, 1900) yang harus habis dibagi 400 dulu baru kabisat. Itu sebabnya tahun 2000 kabisat tapi 1900 bukan.</p>');
  };
  tahunI.addEventListener('input', hitung);

  root.appendChild(T.el('<p class="note">Masukkan tahun, langsung ketahuan kabisat atau bukan dan kenapa.</p>'));
  root.appendChild(T.field('Tahun', tahunI, 'Tahun berapa saja, misalnya tahun lahirmu'));
  root.appendChild(box);
  hitung();
}
