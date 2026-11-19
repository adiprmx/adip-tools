import { h as T, kv } from '../../core.js';

// Kalkulator Jet Lag: dari selisih zona waktu dan arah terbang, ketahuan
// seberapa berat jet lagnya dan berapa hari kira-kira tubuhmu menyesuaikan
// diri, plus rencana geser jam tidur sebelum berangkat. Patokan yang
// dipakai: tubuh menyesuaikan sekitar 1 zona waktu per hari ke arah timur,
// dan sekitar 1,5 zona per hari ke arah barat (patokan umum dari panduan
// tidur dan perjalanan). Ini bukan nasihat medis.
// CATATAN: daftar zona memakai selisih tetap terhadap WIB dan belum
// memperhitungkan daylight saving time di negara yang memakainya.
export const meta = {"id": "kalkulator-jet-lag", "name": "Kalkulator Jet Lag", "cat": "travel", "icon": "✈️", "desc": "Rencana penyesuaian tidur dari selisih zona waktu dan arah terbang.", "keywords": "jet lag,kalkulator jet lag,beda waktu,zona waktu,terbang jauh,tidur perjalanan", "since": "6.18.0"};

// [label, selisih jam terhadap UTC]
export const ZONA = [
  ['Jakarta / WIB (UTC+7)', 7],
  ['Bali, Makassar / WITA (UTC+8)', 8],
  ['Jayapura / WIT (UTC+9)', 9],
  ['Singapura / Kuala Lumpur (UTC+8)', 8],
  ['Bangkok / Hanoi (UTC+7)', 7],
  ['Hong Kong / Beijing (UTC+8)', 8],
  ['Tokyo / Seoul (UTC+9)', 9],
  ['Sydney (UTC+10, tanpa DST)', 10],
  ['Auckland (UTC+12, tanpa DST)', 12],
  ['Dubai (UTC+4)', 4],
  ['Mumbai (UTC+5:30)', 5.5],
  ['Moskow (UTC+3)', 3],
  ['London (UTC+0, tanpa DST)', 0],
  ['Paris / Berlin (UTC+1, tanpa DST)', 1],
  ['New York (UTC-5, tanpa DST)', -5],
  ['Chicago (UTC-6, tanpa DST)', -6],
  ['Denver (UTC-7, tanpa DST)', -7],
  ['Los Angeles (UTC-8, tanpa DST)', -8],
  ['Honolulu (UTC-10)', -10],
];

// Hitung jet lag dari selisih UTC kedua zona. Murni, bisa diuji di Node.
export function hitungJetLag(dariUtc, keUtc) {
  const dari = Number(dariUtc);
  const ke = Number(keUtc);
  if (!isFinite(dari) || !isFinite(ke)) return null;
  let selisih = ke - dari;
  if (selisih > 12) selisih -= 24;
  if (selisih < -12) selisih += 24;
  const jam = Math.abs(selisih);
  const arah = selisih === 0 ? 'sama' : selisih > 0 ? 'timur' : 'barat';
  const hari = arah === 'sama' ? 0 : arah === 'timur' ? Math.ceil(jam) : Math.ceil(jam / 1.5);
  const berat = jam === 0 ? 'tidak ada' : jam <= 2 ? 'ringan' : jam <= 5 ? 'sedang' : jam <= 8 ? 'berat' : 'sangat berat';
  return { selisihJam: selisih, jam, arah, hariPenyesuaian: hari, berat };
}

// Rencana geser jam tidur: geser 1 jam per hari menjelang berangkat.
// Murni, bisa diuji di Node.
export function rencanaGeserTidur(jamSelisih, arah, hariTersedia) {
  const jam = Number(jamSelisih);
  const tersedia = Math.max(0, Math.floor(Number(hariTersedia) || 0));
  if (!isFinite(jam) || jam <= 0 || arah === 'sama' || tersedia === 0) return [];
  const totalGeser = Math.min(jam, tersedia);
  const arahKata = arah === 'timur' ? 'lebih awal' : 'lebih larut';
  const fmtGeser = (g) => (g >= 1 ? g + ' jam' : Math.round(g * 60) + ' menit');
  const langkah = [];
  let sisa = totalGeser;
  for (let d = 1; d <= tersedia && sisa > 0; d++) {
    const geserHariIni = Math.min(1, sisa);
    sisa -= geserHariIni;
    langkah.push({
      hariKe: d,
      teks: 'Hari ke-' + d + ' sebelum berangkat: tidur ' + fmtGeser(geserHariIni) + ' ' + arahKata + ' dari biasanya.',
    });
  }
  return langkah;
}

export function render(root) {
  const dariI = T.select(ZONA.map(([l, v]) => [String(v), l]), '7');
  const keI = T.select(ZONA.map(([l, v]) => [String(v), l]), '0');
  const hariI = T.input('text', 'cth: 3', '3'); hariI.inputMode = 'numeric';
  const box = T.out();

  const hitung = () => {
    const r = hitungJetLag(dariI.value, keI.value);
    if (!r) { T.show(box, '<div class="err">Zonanya tidak benar. Coba lagi.</div>'); return; }
    const hariSiap = T.num(hariI.value);
    if (!isFinite(hariSiap) || hariSiap < 0 || hariSiap > 14) {
      T.show(box, '<div class="err">Hari persiapan harus diisi angka 0 sampai 14.</div>');
      return;
    }
    if (r.arah === 'sama') {
      T.show(box, '<div class="big">Tidak ada jet lag</div><p class="center mut">Kedua tempat berada di zona waktu yang sama.</p>');
      return;
    }
    const arahKata = r.arah === 'timur' ? 'ke timur' : 'ke barat';
    const langkah = rencanaGeserTidur(r.jam, r.arah, hariSiap);
    const rencanaHtml = langkah.length
      ? '<div class="dim" style="margin-top:12px">Rencana geser jam tidur sebelum berangkat</div><ul style="margin:6px 0;padding-left:18px;font-size:13px;line-height:1.7">' +
        langkah.map((l) => '<li>' + T.esc(l.teks) + '</li>').join('') + '</ul>'
      : '<p class="hint">Isi hari persiapan di atas untuk melihat rencana geser jam tidur.</p>';
    T.show(box,
      '<div class="big">' + r.jam + ' jam ' + arahKata + '</div>' +
      '<p class="center mut">Selisih zona waktu antara kedua tempat.</p>' +
      kv('Perkiraan penyesuaian', 'sekitar ' + r.hariPenyesuaian + ' hari') +
      kv('Tingkat jet lag', r.berat) +
      '<p class="note">Terbang ke timur biasanya terasa lebih berat daripada ke barat, karena tubuh harus tidur lebih awal dari biasanya. Begitu sampai, usahakan langsung ikut jam setempat: kena cahaya matahari pagi, makan sesuai jam setempat, dan jangan tidur siang terlalu lama.</p>' +
      rencanaHtml +
      '<p class="hint">Angka hari ini patokan umum, bukan janji. Tiap orang beda. Daftar zona di atas memakai selisih tetap dan belum memperhitungkan daylight saving time.</p>');
  };

  root.appendChild(T.el('<p class="note">Pilih zona asal dan zona tujuan. Hasilnya patokan umum untuk persiapan, bukan nasihat medis.</p>'));
  root.appendChild(T.grid2(T.field('Berangkat dari', dariI), T.field('Tujuan', keI)));
  root.appendChild(T.field('Hari persiapan sebelum berangkat', hariI, 'Berapa hari lagi sebelum kamu terbang. Dipakai untuk rencana geser jam tidur.'));
  root.appendChild(T.btn('Hitung Jet Lag', hitung, true));
  root.appendChild(box);
}
