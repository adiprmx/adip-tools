import { h as T, kv } from '../../core.js';

export const meta = {"id": "kalkulator-obligasi-yield-ytm", "name": "Kalkulator Obligasi (Yield & YTM)", "cat": "bisnis", "icon": "📜", "desc": "Yield berjalan dan yield to maturity obligasi atau SBN dari harga pasarnya.", "keywords": "obligasi,ytm,yield,sbn,kupon,yield to maturity,harga obligasi", "since": "6.17.0"};

// Kupon tahunan = nilai nominal x kupon%.
// Current yield = kupon tahunan / harga pasar x 100%.
// YTM (pendekatan) = (kupon + (nominal - harga) / tenor) / ((nominal + harga) / 2) x 100%.
export function hitungObligasi(nominal, kuponPersen, hargaPasar, tenorTahun) {
  const F = Number(nominal), c = Number(kuponPersen) / 100, P = Number(hargaPasar), n = Number(tenorTahun);
  if (![F, c, P, n].every(isFinite) || F <= 0 || c < 0 || P <= 0 || n <= 0) return null;
  const kupon = F * c;
  const currentYield = (kupon / P) * 100;
  const ytm = ((kupon + (F - P) / n) / ((F + P) / 2)) * 100;
  if (![kupon, currentYield, ytm].every(isFinite)) return null;
  return { kupon, currentYield, ytm };
}

const fmtPersen = (x) => x.toFixed(2).replace('.', ',') + '%';

export function render(root) {
  const fI = T.input('text', 'cth: 10000000', '');
  const cI = T.input('text', 'cth: 6,5', '');
  const pI = T.input('text', 'cth: 9800000', '');
  const nI = T.input('text', 'cth: 5', '');
  const box = T.out();

  const hitung = () => {
    const F = T.num(fI.value);
    const c = T.num(cI.value);
    const P = T.num(pI.value);
    const n = T.num(nI.value);
    if (!isFinite(F) || F <= 0) { T.show(box, '<div class="err">Nilai nominal harus diisi angka lebih dari 0.</div>'); return; }
    if (!isFinite(c) || c < 0 || c >= 100) { T.show(box, '<div class="err">Kupon diisi 0 sampai di bawah 100.</div>'); return; }
    if (!isFinite(P) || P <= 0) { T.show(box, '<div class="err">Harga pasar harus diisi angka lebih dari 0.</div>'); return; }
    if (!isFinite(n) || n <= 0 || n > 100) { T.show(box, '<div class="err">Sisa tenor diisi angka lebih dari 0 sampai 100 tahun.</div>'); return; }
    const hasil = hitungObligasi(F, c, P, n);
    if (hasil === null) { T.show(box, '<div class="err">Angkanya terlalu besar untuk dihitung. Coba pakai angka yang lebih kecil.</div>'); return; }
    const posisi = P < F ? 'di bawah nominal (diskon)' : P > F ? 'di atas nominal (premium)' : 'pas sama dengan nominal';
    T.show(box,
      '<div class="big center">' + fmtPersen(hasil.ytm) + '</div>' +
      '<p class="center">yield to maturity (YTM) per tahun</p>' +
      kv('Yield berjalan (current yield)', fmtPersen(hasil.currentYield)) +
      kv('Kupon per tahun', T.rp(hasil.kupon)) +
      kv('Harga pasar', T.rp(P) + ' (' + posisi + ')') +
      kv('Selisih harga dan nominal', T.rp(F - P)) +
      '<p class="hint">YTM itu hasil total kalau obligasi dipegang sampai jatuh tempo: kupon ditambah selisih harga beli dan nominal, dirata-rata per tahun. Ini hitungan pendekatan, YTM persisnya memakai perhitungan yang lebih rumit.</p>');
  };

  root.appendChild(T.el('<p class="note">Yield obligasi bukan cuma kuponnya. Kalau kamu beli di bawah nominal, ada tambahan untung saat jatuh tempo. YTM menghitung semuanya jadi satu angka per tahun.</p>'));
  root.appendChild(T.field('Nilai nominal (Rp)', fI, 'Nilai pokok obligasi yang dibayar saat jatuh tempo.'));
  root.appendChild(T.field('Kupon (% per tahun)', cI, 'Bunga tahunan yang tertulis di obligasi.'));
  root.appendChild(T.field('Harga pasar saat ini (Rp)', pI, 'Harga untuk membeli obligasi ini sekarang.'));
  root.appendChild(T.field('Sisa tenor (tahun)', nI, 'Berapa tahun lagi sampai obligasi jatuh tempo.'));
  root.appendChild(T.row(T.btn('Hitung Yield & YTM', hitung, true)));
  root.appendChild(box);
}
