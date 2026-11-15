import { h as T, kv, tabs } from '../../core.js?v=6.11.5';

export const meta = {"id":"kalkulator-pecahan","name":"Kalkulator Pecahan","cat":"pelajar","icon":"🍕","desc":"Tambah, kurang, kali, bagi pecahan lengkap dengan langkah dan bentuk campurannya.","keywords":"pecahan,fraksi,matematika,pembilang,penyebut,sederhanakan,pelajar","since":"6.11.0"};

export function fpb(a, b) {
  a = Math.abs(a); b = Math.abs(b);
  while (b) { const t = a % b; a = b; b = t; }
  return a || 1;
}
const kpk = (a, b) => Math.abs(a * b) / fpb(a, b);

export function sederhanakan(pem, pen) {
  if (!pen) return null;
  if (pen < 0) { pem = -pem; pen = -pen; }
  const f = fpb(pem, pen);
  return { pem: pem / f, pen: pen / f, fpb: f };
}

export function keCampuran(pem, pen) {
  if (pen === 1) return null;
  const bulat = Math.trunc(pem / pen);
  const sisa = Math.abs(pem % pen);
  if (bulat === 0 || sisa === 0) return null;
  return { bulat, sisa, pen };
}

const fmtPecah = (p, q) => p + '/' + q;

/* Hitung dua pecahan. op: '+', '-', 'x', ':'. Kembalikan hasil tersederhana + langkah. */
export function hitungPecahan(a, b, c, d, op) {
  if (!b || !d) return { err: 'Penyebut tidak boleh nol.' };
  let pem, pen;
  const langkah = [];
  const opSim = op === 'x' ? '×' : op === ':' ? '÷' : op;
  if (op === '+' || op === '-') {
    const k = kpk(b, d);
    const pa = a * (k / b), pc = c * (k / d);
    langkah.push('Samakan penyebut: KPK(' + b + ', ' + d + ') = ' + k + '.');
    langkah.push(fmtPecah(a, b) + ' = ' + fmtPecah(pa, k) + ' dan ' + fmtPecah(c, d) + ' = ' + fmtPecah(pc, k) + '.');
    pem = op === '+' ? pa + pc : pa - pc;
    pen = k;
    langkah.push(fmtPecah(pa, k) + ' ' + opSim + ' ' + fmtPecah(pc, k) + ' = ' + fmtPecah(pem, pen) + '.');
  } else if (op === 'x') {
    pem = a * c; pen = b * d;
    langkah.push('Kalikan pembilang dengan pembilang, penyebut dengan penyebut.');
    langkah.push(fmtPecah(a, b) + ' × ' + fmtPecah(c, d) + ' = ' + fmtPecah(pem, pen) + '.');
  } else if (op === ':') {
    if (!c) return { err: 'Pembilang pecahan kedua tidak boleh nol untuk pembagian.' };
    pem = a * d; pen = b * c;
    langkah.push('Pembagian = kalikan dengan kebalikan pecahan kedua.');
    langkah.push(fmtPecah(a, b) + ' ÷ ' + fmtPecah(c, d) + ' = ' + fmtPecah(a, b) + ' × ' + fmtPecah(d, c) + ' = ' + fmtPecah(pem, pen) + '.');
  } else return { err: 'Operasi tidak dikenal.' };
  const s = sederhanakan(pem, pen);
  if (s.fpb > 1) langkah.push('Sederhanakan: bagi pembilang dan penyebut dengan FPB ' + s.fpb + ' → ' + fmtPecah(s.pem, s.pen) + '.');
  else langkah.push('Hasil sudah paling sederhana.');
  return { pem: s.pem, pen: s.pen, desimal: s.pem / s.pen, langkah };
}

const fmtDes = (v) => String(Math.round(v * 1e10) / 1e10).replace('.', ',');

function tampilHasil(out, r) {
  const camp = keCampuran(r.pem, r.pen);
  const campHtml = camp
    ? kv('Bentuk campuran', '<b>' + camp.bulat + ' ' + camp.sisa + '/' + camp.pen + '</b>') : '';
  T.show(out, '');
  out.appendChild(T.el(
    '<div><div class="center"><div class="dim">Hasil</div><div class="big">' + r.pem + '/' + r.pen + '</div></div>' +
    kv('Desimal', '<b>' + fmtDes(r.desimal) + '</b>') +
    kv('Persen', '<b>' + fmtDes(r.desimal * 100) + ' %</b>') +
    campHtml +
    '<div class="dim" style="font-size:12.5px;margin-top:8px;line-height:1.7">' +
    r.langkah.map((l) => '• ' + T.esc(l)).join('<br>') + '</div></div>'
  ));
  out.appendChild(T.row(T.copyBtn(() => r.pem + '/' + r.pen, 'Salin pecahan')));
}

export function render(root) {
  const p1 = T.el('<div></div>');
  const p2 = T.el('<div></div>');

  // ---- Panel 1: dua pecahan ----
  const aPem = T.input('text', 'Pembilang', ''); aPem.inputMode = 'numeric';
  const aPen = T.input('text', 'Penyebut', ''); aPen.inputMode = 'numeric';
  const bPem = T.input('text', 'Pembilang', ''); bPem.inputMode = 'numeric';
  const bPen = T.input('text', 'Penyebut', ''); bPen.inputMode = 'numeric';
  const opSel = T.select([['+', '+  Tambah'], ['-', '−  Kurang'], ['x', '×  Kali'], [':', '÷  Bagi']], '+');
  const out1 = T.out();
  const hitung1 = () => {
    const vs = [aPem, aPen, bPem, bPen].map((i) => T.num(i.value));
    if (vs.some((v) => !isFinite(v))) { T.show(out1, '<p class="err">Isi keempat kotak dengan angka.</p>'); return; }
    if (!Number.isInteger(vs[0]) || !Number.isInteger(vs[1]) || !Number.isInteger(vs[2]) || !Number.isInteger(vs[3])) {
      T.show(out1, '<p class="err">Pembilang dan penyebut harus bilangan bulat.</p>'); return;
    }
    const r = hitungPecahan(vs[0], vs[1], vs[2], vs[3], opSel.value);
    if (r.err) { T.show(out1, '<p class="err">' + T.esc(r.err) + '</p>'); return; }
    tampilHasil(out1, r);
  };
  [aPem, aPen, bPem, bPen].forEach((i) => i.addEventListener('keydown', (e) => { if (e.key === 'Enter') hitung1(); }));
  p1.appendChild(T.el('<p class="hint">Isi dua pecahan, pilih operasi, lalu tekan Hitung. Langkah pengerjaannya ikut ditampilkan.</p>'));
  p1.appendChild(T.el('<p style="font-size:14px;margin:0 0 4px"><b>Pecahan pertama</b></p>'));
  p1.appendChild(T.grid2(T.field('Pembilang', aPem, 'angka di atas'), T.field('Penyebut', aPen, 'angka di bawah, bukan 0')));
  p1.appendChild(T.field('Operasi', opSel));
  p1.appendChild(T.el('<p style="font-size:14px;margin:0 0 4px"><b>Pecahan kedua</b></p>'));
  p1.appendChild(T.grid2(T.field('Pembilang', bPem), T.field('Penyebut', bPen)));
  p1.appendChild(T.row(T.btn('Hitung', hitung1, true)));
  p1.appendChild(out1);
  T.show(out1, '<p class="dim">Contoh: 1/2 + 1/3 = 5/6.</p>');

  // ---- Panel 2: sederhanakan ----
  const sPem = T.input('text', 'Pembilang, mis. 12', ''); sPem.inputMode = 'numeric';
  const sPen = T.input('text', 'Penyebut, mis. 18', ''); sPen.inputMode = 'numeric';
  const out2 = T.out();
  const hitung2 = () => {
    const p = T.num(sPem.value), q = T.num(sPen.value);
    if (!isFinite(p) || !isFinite(q)) { T.show(out2, '<p class="err">Isi pembilang dan penyebut dengan angka.</p>'); return; }
    if (!Number.isInteger(p) || !Number.isInteger(q)) { T.show(out2, '<p class="err">Pembilang dan penyebut harus bilangan bulat.</p>'); return; }
    const s = sederhanakan(p, q);
    if (!s) { T.show(out2, '<p class="err">Penyebut tidak boleh nol.</p>'); return; }
    const langkah = ['FPB(' + Math.abs(p) + ', ' + Math.abs(q) + ') = ' + s.fpb + '.'];
    if (s.fpb > 1) langkah.push(Math.abs(p) + ' ÷ ' + s.fpb + ' = ' + Math.abs(s.pem) + ' dan ' + Math.abs(q) + ' ÷ ' + s.fpb + ' = ' + s.pen + '.');
    else langkah.push('Sudah paling sederhana, tidak bisa dibagi lagi.');
    tampilHasil(out2, { pem: s.pem, pen: s.pen, desimal: s.pem / s.pen, langkah });
  };
  [sPem, sPen].forEach((i) => i.addEventListener('keydown', (e) => { if (e.key === 'Enter') hitung2(); }));
  p2.appendChild(T.el('<p class="hint">Ubah pecahan jadi bentuk paling sederhana, misalnya 12/18 jadi 2/3.</p>'));
  p2.appendChild(T.grid2(T.field('Pembilang', sPem), T.field('Penyebut', sPen)));
  p2.appendChild(T.row(T.btn('Sederhanakan', hitung2, true)));
  p2.appendChild(out2);

  root.appendChild(tabs([['Hitung pecahan', 0], ['Sederhanakan', 1]], [p1, p2]));
  root.appendChild(p1);
  root.appendChild(p2);
}
