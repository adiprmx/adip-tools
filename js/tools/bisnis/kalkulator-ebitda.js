import { h as T, utils, kv } from '../../core.js';

export const meta = {"id": "kalkulator-ebitda", "name": "Kalkulator EBITDA", "cat": "bisnis", "icon": "🏢", "desc": "Hitung laba usaha sebelum bunga, pajak, dan penyusutan, plus marginnya dari omzet.", "keywords": "ebitda,laba usaha,laba bersih,bunga,pajak,depresiasi,amortisasi,margin,laporan keuangan", "since": "6.19.0"};

const nol = (x) => (x === 0 ? 0 : x);
const fmtP = (x, d) => nol(x).toFixed(d == null ? 2 : d).replace('.', ',') + '%';

/* EBITDA = laba bersih + bunga + pajak + depresiasi + amortisasi.
   Null bila ada input tidak valid. */
export function hitungEbitda(labaBersih, bunga, pajak, depresiasi, amortisasi) {
  const v = [labaBersih, bunga, pajak, depresiasi, amortisasi].map(Number);
  if (!v.every(isFinite)) return null;
  const e = v.reduce((a, b) => a + b, 0);
  return Number.isFinite(e) ? e : null;
}
utils.ebitda = hitungEbitda;

export function render(root) {
  const labaI = T.input('text', 'cth: 100000000', '');
  const bungaI = T.input('text', 'cth: 20000000', '0');
  const pajakI = T.input('text', 'cth: 30000000', '0');
  const depI = T.input('text', 'cth: 40000000', '0');
  const amoI = T.input('text', 'cth: 10000000', '0');
  const omzetI = T.input('text', 'cth: 1000000000', '');
  const box = T.out();

  const hitung = () => {
    const laba = T.num(labaI.value);
    const bunga = T.num(bungaI.value);
    const pajak = T.num(pajakI.value);
    const dep = T.num(depI.value);
    const amo = T.num(amoI.value);
    const omzet = T.num(omzetI.value);
    if (!isFinite(laba)) { T.show(box, '<div class="err">Isi laba bersih dengan angka (boleh negatif bila rugi).</div>'); return; }
    if (![bunga, pajak, dep, amo].every(isFinite)) { T.show(box, '<div class="err">Bunga, pajak, depresiasi, dan amortisasi harus diisi angka. Isi 0 bila tidak ada.</div>'); return; }
    const ebitda = hitungEbitda(laba, bunga, pajak, dep, amo);
    if (ebitda === null) { T.show(box, '<div class="err">Angkanya terlalu besar untuk dihitung. Coba pakai angka yang lebih kecil.</div>'); return; }
    const margin = isFinite(omzet) && omzet > 0 ? (ebitda / omzet) * 100 : null;
    const vonis = ebitda > 0
      ? 'Usaha ini menghasilkan laba operasional positif sebelum dipotong bunga, pajak, dan penyusutan.'
      : ebitda < 0
        ? 'Usaha ini rugi di level operasional, bahkan sebelum dipotong bunga dan pajak.'
        : 'Usaha ini impas di level operasional.';
    T.show(box,
      '<div class="big center">' + T.rp(ebitda) + '</div>' +
      '<p class="center">EBITDA</p>' +
      kv('Laba bersih', T.rp(laba)) +
      kv('Bunga yang ditambahkan kembali', T.rp(bunga)) +
      kv('Pajak yang ditambahkan kembali', T.rp(pajak)) +
      kv('Depresiasi + amortisasi', T.rp(dep + amo)) +
      (margin == null ? '' : kv('Margin EBITDA', fmtP(margin) + ' dari omzet')) +
      '<p class="' + (ebitda > 0 ? 'info' : ebitda < 0 ? 'err' : 'warn') + '">' + vonis + '</p>' +
      '<p class="hint">Rumusnya: laba bersih + bunga + pajak + depresiasi + amortisasi. EBITDA dipakai untuk membandingkan kinerja usaha tanpa pengaruh cara pembiayaan dan aturan pajak. Ini bukan uang tunai yang tersedia: cicilan utang dan belanja modal tetap harus dibayar.</p>');
  };

  root.appendChild(T.el('<p class="note">EBITDA itu laba usaha sebelum dipotong bunga pinjaman, pajak, dan penyusutan aset. Angka ini dipakai investor untuk membandingkan kinerja inti dua usaha yang cara bayar utang dan pajaknya beda.</p>'));
  root.appendChild(T.field('Laba bersih (Rp)', labaI, 'Laba setelah semua biaya, bunga, dan pajak. Boleh negatif bila rugi.'));
  root.appendChild(T.field('Biaya bunga (Rp)', bungaI, 'Bunga pinjaman yang dibayar. Isi 0 bila tidak ada utang.'));
  root.appendChild(T.field('Pajak penghasilan (Rp)', pajakI, 'Pajak yang dibayar atas laba.'));
  root.appendChild(T.field('Depresiasi (Rp)', depI, 'Penyusutan aset berwujud, misal mesin dan kendaraan.'));
  root.appendChild(T.field('Amortisasi (Rp)', amoI, 'Penyusutan aset tak berwujud, misal paten dan lisensi.'));
  root.appendChild(T.field('Omzet (Rp, opsional)', omzetI, 'Diisi bila mau tahu margin EBITDA, yaitu EBITDA dibagi omzet.'));
  root.appendChild(T.row(T.btn('Hitung EBITDA', hitung, true)));
  root.appendChild(box);
}
