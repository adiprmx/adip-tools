import { h as T, kv, tabs } from '../../core.js?v=6.12.0';

export const meta = {"id":"kalkulator-waktu","name":"Kalkulator Waktu","cat":"sehari","icon":"⏱️","desc":"Tambah dan kurang durasi jam, menit, detik, plus konversi satuan waktu.","keywords":"waktu,jam,menit,detik,durasi,konversi,hitung waktu","since":"6.11.0"};

export function keDetik(jam, menit, detik) { return jam * 3600 + menit * 60 + detik; }

export function dariDetik(total) {
  const neg = total < 0;
  total = Math.abs(Math.round(total));
  return { neg, jam: Math.floor(total / 3600), menit: Math.floor(total % 3600 / 60), detik: total % 60 };
}

export function fmtDurasi(total) {
  const d = dariDetik(total);
  const bagian = [];
  if (d.jam) bagian.push(d.jam + ' jam');
  if (d.menit) bagian.push(d.menit + ' menit');
  if (d.detik || !bagian.length) bagian.push(d.detik + ' detik');
  return (d.neg ? '−' : '') + bagian.join(' ');
}

const UNIT = { detik: 1, menit: 60, jam: 3600, hari: 86400, minggu: 604800 };
export function konversiWaktu(nilai, dari, ke) {
  if (!UNIT[dari] || !UNIT[ke]) return null;
  return nilai * UNIT[dari] / UNIT[ke];
}

const fmtAngka = (v) => String(Math.round(v * 1e6) / 1e6).replace('.', ',');

function durasiInput(prefix) {
  const j = T.input('text', 'Jam', ''); j.inputMode = 'numeric';
  const m = T.input('text', 'Menit', ''); m.inputMode = 'numeric';
  const d = T.input('text', 'Detik', ''); d.inputMode = 'numeric';
  const baca = () => {
    const vs = [j, m, d].map((i) => (i.value.trim() === '' ? 0 : T.num(i.value)));
    if (vs.some((v) => !isFinite(v) || v < 0)) return null;
    return keDetik(vs[0], vs[1], vs[2]);
  };
  const grid = T.el('<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px"></div>');
  grid.appendChild(T.field(prefix + ' jam', j));
  grid.appendChild(T.field('Menit', m));
  grid.appendChild(T.field('Detik', d));
  return { grid, baca };
}

export function render(root) {
  const p1 = T.el('<div></div>');
  const p2 = T.el('<div></div>');
  const p3 = T.el('<div></div>');

  // ---- Panel 1: tambah / kurang durasi ----
  const d1 = durasiInput('Durasi 1');
  const d2 = durasiInput('Durasi 2');
  const opSel = T.select([['+', '+  Tambah'], ['-', '−  Kurang']], '+');
  const out1 = T.out();
  const hitung1 = () => {
    const a = d1.baca(), b = d2.baca();
    if (a == null || b == null) { T.show(out1, '<p class="err">Isi durasi dengan angka 0 atau lebih.</p>'); return; }
    const total = opSel.value === '+' ? a + b : a - b;
    T.show(out1,
      '<div class="center"><div class="dim">Hasil</div><div class="big">' + T.esc(fmtDurasi(total)) + '</div></div>' +
      kv('Dalam menit', '<b>' + fmtAngka(total / 60) + ' menit</b>') +
      kv('Dalam detik', '<b>' + T.fmt(total) + ' detik</b>') +
      kv('Dalam jam', '<b>' + fmtAngka(total / 3600) + ' jam</b>'));
  };
  p1.appendChild(T.el('<p class="hint">Misalnya 2 jam 30 menit ditambah 45 menit. Kotak yang kosong dianggap 0.</p>'));
  p1.appendChild(d1.grid);
  p1.appendChild(T.field('Operasi', opSel));
  p1.appendChild(d2.grid);
  p1.appendChild(T.row(T.btn('Hitung', hitung1, true)));
  p1.appendChild(out1);

  // ---- Panel 2: selisih dua jam ----
  const jamA = T.input('time', '', '08:00');
  const jamB = T.input('time', '', '17:30');
  const out2 = T.out();
  const hitung2 = () => {
    const bacaJam = (v) => {
      const m = /^(\d{1,2}):(\d{2})/.exec(v || '');
      if (!m) return null;
      return (+m[1]) * 3600 + (+m[2]) * 60;
    };
    const a = bacaJam(jamA.value), b = bacaJam(jamB.value);
    if (a == null || b == null) { T.show(out2, '<p class="err">Isi kedua jam dengan benar.</p>'); return; }
    let selisih = b - a;
    const lewatTengahMalam = selisih < 0;
    if (lewatTengahMalam) selisih += 86400;
    T.show(out2,
      '<div class="center"><div class="dim">Selisih</div><div class="big">' + T.esc(fmtDurasi(selisih)) + '</div></div>' +
      kv('Dalam menit', '<b>' + fmtAngka(selisih / 60) + ' menit</b>') +
      (lewatTengahMalam ? '<p class="hint">Jam kedua lebih awal dari jam pertama, jadi dihitung lewat tengah malam.</p>' : ''));
  };
  p2.appendChild(T.el('<p class="hint">Berapa lama dari satu jam ke jam lain, misalnya jam kerja 08:00 sampai 17:30.</p>'));
  p2.appendChild(T.grid2(T.field('Dari jam', jamA), T.field('Sampai jam', jamB)));
  p2.appendChild(T.row(T.btn('Hitung selisih', hitung2, true)));
  p2.appendChild(out2);

  // ---- Panel 3: konversi ----
  const nilInp = T.input('text', 'mis. 90', ''); nilInp.inputMode = 'decimal';
  const dariSel = T.select([['detik', 'Detik'], ['menit', 'Menit'], ['jam', 'Jam'], ['hari', 'Hari'], ['minggu', 'Minggu']], 'menit');
  const keSel = T.select([['detik', 'Detik'], ['menit', 'Menit'], ['jam', 'Jam'], ['hari', 'Hari'], ['minggu', 'Minggu']], 'jam');
  const out3 = T.out();
  const hitung3 = () => {
    const n = T.num(nilInp.value);
    if (!isFinite(n)) { T.show(out3, '<p class="err">Isi angkanya dulu.</p>'); return; }
    const hasil = konversiWaktu(n, dariSel.value, keSel.value);
    const label = { detik: 'detik', menit: 'menit', jam: 'jam', hari: 'hari', minggu: 'minggu' };
    T.show(out3,
      '<div class="center"><div class="dim">' + fmtAngka(n) + ' ' + label[dariSel.value] + ' sama dengan</div>' +
      '<div class="big">' + fmtAngka(hasil) + ' ' + label[keSel.value] + '</div></div>');
  };
  nilInp.addEventListener('keydown', (e) => { if (e.key === 'Enter') hitung3(); });
  p3.appendChild(T.el('<p class="hint">Ubah satuan waktu, misalnya 90 menit jadi 1,5 jam.</p>'));
  p3.appendChild(T.field('Angka', nilInp));
  p3.appendChild(T.grid2(T.field('Dari', dariSel), T.field('Ke', keSel)));
  p3.appendChild(T.row(T.btn('Konversi', hitung3, true)));
  p3.appendChild(out3);

  root.appendChild(tabs([['Tambah/kurang', 0], ['Selisih jam', 1], ['Konversi', 2]], [p1, p2, p3]));
  root.appendChild(p1);
  root.appendChild(p2);
  root.appendChild(p3);
}
