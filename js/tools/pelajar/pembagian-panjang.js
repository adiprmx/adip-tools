import { h as T, utils } from '../../core.js';

export const meta = {"id": "pembagian-panjang", "name": "Pembagian Panjang", "cat": "pelajar", "icon": "➗", "desc": "Bagi dua bilangan dengan cara susun lengkap, langkah demi langkah seperti di buku tulis.", "keywords": "pembagian panjang,porogapit,bagi susun,matematika,sd,smp,langkah,sisa bagi", "since": "6.19.0"};

const n0 = (v) => (Object.is(v, -0) ? 0 : v);

// Bagi panjang a : b (bilangan bulat). Kembalikan null bila pembagi 0.
// langkah: [{angka, digit, kali, sisa, kolom, desimal}]: kolom = indeks
// digit yang baru diturunkan (digit bilangan yang dibagi = 0..n-1,
// koma di kolom n, angka desimal di n+1..).
export function bagiPanjang(a, b, maksDesimal) {
  if (!b || !Number.isFinite(a) || !Number.isFinite(b)) return null;
  const des = Math.max(0, Math.min(10, maksDesimal == null ? 6 : Math.floor(maksDesimal)));
  const neg = (a < 0) !== (b < 0);
  const A = Math.abs(Math.trunc(a));
  const B = Math.abs(Math.trunc(b));
  if (A === 0) return { hasil: 0, hasilStr: '0', langkah: [], sisaAkhir: 0, desimal: 0, neg: false, A, B };
  const digit = String(A).split('').map(Number);
  const langkah = [];
  const qInt = [];
  const qDes = [];
  let saat = 0;
  let i = 0;
  // Turunkan digit sampai cukup untuk dibagi (atau digit habis).
  while (i < digit.length && saat < B) { saat = saat * 10 + digit[i]; i++; }
  // Langkah pertama (bilangan bulat).
  let q = Math.floor(saat / B);
  let kali = q * B;
  let sisa = saat - kali;
  langkah.push({ angka: saat, digit: q, kali, sisa, kolom: i - 1, desimal: false });
  qInt.push(q);
  saat = sisa;
  // Sisa digit bulat.
  while (i < digit.length) {
    saat = saat * 10 + digit[i];
    q = Math.floor(saat / B);
    kali = q * B;
    sisa = saat - kali;
    langkah.push({ angka: saat, digit: q, kali, sisa, kolom: i, desimal: false });
    qInt.push(q);
    saat = sisa;
    i++;
  }
  // Lanjut ke desimal sampai sisa habis atau batas tercapai.
  let d = 0;
  while (saat !== 0 && d < des) {
    saat = saat * 10;
    q = Math.floor(saat / B);
    kali = q * B;
    sisa = saat - kali;
    langkah.push({ angka: saat, digit: q, kali, sisa, kolom: digit.length + 1 + d, desimal: true });
    qDes.push(q);
    saat = sisa;
    d++;
  }
  while (qInt.length > 1 && qInt[0] === 0) qInt.shift();
  const hasilStr = (neg ? '-' : '') + qInt.join('') + (qDes.length ? ',' + qDes.join('') : '');
  return { hasil: n0(Number(hasilStr.replace(',', '.'))), hasilStr, langkah, sisaAkhir: saat, desimal: qDes.length, neg, A, B };
}

// Susun tampilan porogapit klasik sebagai teks monospace.
export function layoutPembagian(a, b, maksDesimal) {
  const r = bagiPanjang(a, b, maksDesimal);
  if (!r) return '';
  const p = String(r.B).length + 3; // lebar "B ) "
  const nDigit = String(r.A).length;
  const totalKolom = nDigit + (r.desimal ? 1 + r.desimal : 0);
  const lebar = p + totalKolom + 2;
  const baris = [];
  const buat = () => Array.from({ length: lebar }, () => ' ');
  const tulis = (row, teks, kolAkhir) => {
    // tulis teks hingga kolom terakhir kolAkhir (kolom relatif dividend)
    let c = p + kolAkhir - teks.length + 1;
    for (const ch of teks) { if (c >= 0 && c < lebar) row[c] = ch; c++; }
  };
  const tulisKiri = (row, teks, kol) => {
    let c = kol;
    for (const ch of teks) { if (c >= 0 && c < lebar) row[c] = ch; c++; }
  };
  // Baris hasil bagi (di atas).
  const rHasil = buat();
  r.langkah.forEach((s) => { const c = p + s.kolom; if (c < lebar) rHasil[c] = String(s.digit); });
  if (r.desimal) rHasil[p + nDigit] = ',';
  if (r.neg) rHasil[p - 1] = '-';
  baris.push(rHasil);
  // Garis pembatas.
  const rGaris = buat();
  for (let c = p; c < p + totalKolom; c++) rGaris[c] = '_';
  baris.push(rGaris);
  // Baris "B ) dividend".
  const rBagi = buat();
  tulisKiri(rBagi, String(r.B) + ' ) ' + String(r.A) + (r.desimal ? ',' + '0'.repeat(r.desimal) : ''), 0);
  baris.push(rBagi);
  // Langkah-langkah.
  r.langkah.forEach((s, idx) => {
    const rKali = buat();
    tulis(rKali, String(s.kali), s.kolom);
    baris.push(rKali);
    const rStrip = buat();
    tulis(rStrip, '-'.repeat(String(s.kali).length), s.kolom);
    baris.push(rStrip);
    const berikut = r.langkah[idx + 1];
    const rSisa = buat();
    if (berikut) {
      // sisa + digit yang diturunkan berikutnya
      const digitTurun = berikut.desimal ? 0 : Number(String(r.A)[berikut.kolom]);
      tulis(rSisa, String(s.sisa) + String(digitTurun), berikut.kolom);
    } else {
      tulis(rSisa, String(s.sisa), s.kolom);
    }
    baris.push(rSisa);
  });
  return baris.map((row) => row.join('').replace(/\s+$/, '')).join('\n');
}

export function render(root) {
  const aI = T.input('number', 'Bilangan yang dibagi, mis. 1000', '1000');
  const bI = T.input('number', 'Pembagi, mis. 7', '7');
  const dI = T.select([['0', '0 angka desimal'], ['2', '2 angka desimal'], ['4', '4 angka desimal'], ['6', '6 angka desimal'], ['10', '10 angka desimal']], '6');
  const box = T.out();

  const hitung = () => {
    const a = T.num(aI.value);
    const b = T.num(bI.value);
    if (!Number.isFinite(a) || !Number.isFinite(b)) {
      T.show(box, '<p class="dim">Isi kedua bilangan dulu.</p>');
      return;
    }
    if (b === 0) {
      T.show(box, '<p class="err">Pembagi tidak boleh 0. Pembagian dengan 0 tidak ada hasilnya.</p>');
      return;
    }
    if (Math.abs(a) > 999999999999 || Math.abs(b) > 999999) {
      T.show(box, '<p class="err">Bilangan terlalu besar. Pakai sampai 12 digit untuk yang dibagi dan 6 digit untuk pembagi.</p>');
      return;
    }
    const r = bagiPanjang(Math.trunc(a), Math.trunc(b), Number(dI.value));
    const layout = layoutPembagian(Math.trunc(a), Math.trunc(b), Number(dI.value));
    let h = '<div class="big">' + T.esc(r.hasilStr) + (r.sisaAkhir !== 0 && r.desimal >= Number(dI.value) ? '…' : '') + '</div>';
    h += '<p class="dim">' + T.fmt(Math.trunc(a)) + ' : ' + T.fmt(Math.trunc(b)) + ' = ' + T.esc(r.hasilStr) +
      (r.sisaAkhir !== 0 ? ' (sisa ' + T.fmt(r.sisaAkhir) + ', belum habis dibagi)' : ' (habis dibagi, sisa 0)') + '</p>';
    h += '<pre style="font-family:monospace;font-size:13px;line-height:1.5;overflow-x:auto;background:#12100d;border:1px solid #2e2823;border-radius:8px;padding:12px">' + T.esc(layout) + '</pre>';
    if (r.langkah.length) {
      h += '<p style="margin-top:12px"><b>Langkah demi langkah</b></p><ol style="margin:6px 0 0;padding-left:20px;line-height:1.7;font-size:14px">';
      r.langkah.forEach((s, idx) => {
        const turun = idx + 1 < r.langkah.length
          ? (r.langkah[idx + 1].desimal && !s.desimal ? ', lalu koma desimal dan turunkan 0' : ', turunkan ' + (r.langkah[idx + 1].desimal ? '0' : String(r.A)[r.langkah[idx + 1].kolom]))
          : '';
        h += '<li>' + T.fmt(s.angka) + ' : ' + T.fmt(r.B) + ' = <b>' + s.digit + '</b> &nbsp;·&nbsp; ' + s.digit + ' × ' + T.fmt(r.B) + ' = ' + T.fmt(s.kali) + ' &nbsp;·&nbsp; ' + T.fmt(s.angka) + ' − ' + T.fmt(s.kali) + ' = ' + T.fmt(s.sisa) + turun + '</li>';
      });
      h += '</ol>';
    }
    h += '<p class="hint">Cek jawaban: ' + T.fmt(r.B) + ' × ' + T.esc(r.hasilStr) + ' = ' + T.fmt(n0(r.B * r.hasil)) +
      (r.sisaAkhir !== 0 ? ' (mendekati ' + T.fmt(Math.trunc(a)) + ', selisihnya sisa yang belum dibagi)' : '. Pas, sama dengan bilangan yang dibagi.') + '</p>';
    T.show(box, h);
  };

  const tombol = T.btn('Bagi', hitung, true);
  [aI, bI].forEach((el) => el.addEventListener('input', hitung));
  dI.addEventListener('change', hitung);

  root.appendChild(T.el('<p class="note">Cara susun (porogapit) lengkap dengan langkahnya. Cocok buat cek PR pembagian.</p>'));
  root.appendChild(T.grid2(T.field('Bilangan yang dibagi', aI), T.field('Pembagi', bI), T.field('Angka di belakang koma', dI)));
  root.appendChild(tombol);
  root.appendChild(box);
  hitung();
}
