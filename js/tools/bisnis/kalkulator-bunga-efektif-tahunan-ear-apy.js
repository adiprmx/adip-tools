import { h as T, kv } from '../../core.js';

export const meta = {"id": "kalkulator-bunga-efektif-tahunan-ear-apy", "name": "Kalkulator Bunga Efektif Tahunan (EAR/APY)", "cat": "bisnis", "icon": "📊", "desc": "Bunga nominal jadi bunga efektif tahunan sesuai seberapa sering bunganya dihitung.", "keywords": "ear,apy,bunga efektif,bunga nominal,pemajemukan,bunga tahunan", "since": "6.17.0"};

// EAR = (1 + nominal/m)^m - 1. nominal dalam persen, m = kali pemajemukan setahun.
// Balikan dalam persen.
export function hitungEAR(nominalPersen, kaliSetahun) {
  const nom = Number(nominalPersen), m = Number(kaliSetahun);
  if (![nom, m].every(isFinite) || nom < 0 || m <= 0) return null;
  const ear = (Math.pow(1 + nom / 100 / m, m) - 1) * 100;
  return Number.isFinite(ear) ? ear : null;
}

const fmtPersen = (x, d) => x.toFixed(d == null ? 2 : d).replace('.', ',') + '%';

export function render(root) {
  const nomI = T.input('text', 'cth: 12', '');
  const mI = T.select([['1', 'Tahunan (1x)'], ['2', 'Per semester (2x)'], ['4', 'Per triwulan (4x)'], ['12', 'Bulanan (12x)'], ['365', 'Harian (365x)']], '12');
  const box = T.out();

  const hitung = () => {
    const nom = T.num(nomI.value);
    const m = Number(mI.value);
    if (!isFinite(nom) || nom < 0 || nom >= 1000) { T.show(box, '<div class="err">Bunga nominal diisi angka 0 sampai di bawah 1000.</div>'); return; }
    const ear = hitungEAR(nom, m);
    if (ear === null) { T.show(box, '<div class="err">Angkanya terlalu besar untuk dihitung. Coba pakai angka yang lebih kecil.</div>'); return; }
    const perPeriode = nom / m;
    T.show(box,
      '<div class="big center">' + fmtPersen(ear) + '</div>' +
      '<p class="center">bunga efektif per tahun (EAR / APY)</p>' +
      kv('Bunga nominal', fmtPersen(nom)) +
      kv('Bunga per periode', fmtPersen(perPeriode, 4)) +
      kv('Selisih karena pemajemukan', fmtPersen(ear - nom)) +
      '<p class="hint">Semakin sering bunga dihitung, semakin besar bunga efektifnya walau angka nominalnya sama. Ini angka yang benar-benar kamu dapat (atau bayar) dalam setahun.</p>');
  };

  root.appendChild(T.el('<p class="note">Bank sering menulis bunga nominal, tapi yang benar-benar kamu terima adalah bunga efektif. Selisihnya muncul karena bunga ikut berbunga setiap periode.</p>'));
  root.appendChild(T.field('Bunga nominal (% per tahun)', nomI, 'Angka bunga yang tertulis di brosur atau perjanjian.'));
  root.appendChild(T.field('Seberapa sering bunga dihitung', mI, 'Bulanan artinya bunga masuk dan ikut berbunga 12 kali setahun.'));
  root.appendChild(T.row(T.btn('Hitung Bunga Efektif', hitung, true)));
  root.appendChild(box);
}
