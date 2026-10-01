import { h as T, utils, beep, actx, onLeave, errBox } from '../../core.js?v=6.8.0';

export const meta = {"id": "rumus-eksponen", "name": "Kalkulator Eksponen", "cat": "pelajar", "icon": "🔢", "desc": "Hitung pangkat & akar plus kartu sifat-sifat eksponen.", "keywords": "eksponen,pangkat,akar,matematika,rumus"};

/** Format angka: bulatkan ke 10 digit signifikan, lalu format lokal. */
export function fmtAngka(x) {
  if (typeof x !== 'number' || isNaN(x)) return 'tak terdefinisi';
  if (!isFinite(x)) return x > 0 ? '+∞' : '-∞';
  const r = Number(x.toPrecision(10));
  return T.fmt(r);
}

/** a^n aman: basis negatif + pangkat desimal tak bulat -> NaN (tak terdefinisi real). */
export function hitungPangkat(a, n) {
  if (a < 0 && !Number.isInteger(n)) return NaN;
  return Math.pow(a, n);
}

/** Akar pangkat n dari a. Mengembalikan {ok, hasil} atau {ok:false, err}. */
export function hitungAkar(a, n) {
  if (n === 0) return { ok: false, err: 'Pangkat akar tidak boleh 0.' };
  if (a < 0) {
    if (n % 2 === 0) return { ok: false, err: 'Akar genap dari bilangan negatif tidak punya hasil real.' };
    return { ok: true, hasil: -Math.pow(-a, 1 / n) };
  }
  return { ok: true, hasil: Math.pow(a, 1 / n) };
}

/** Langkah perkalian berulang untuk pangkat bulat positif kecil (maks tampil 8 faktor). */
export function langkahPerkalian(a, n) {
  if (!Number.isInteger(n) || n < 0 || n > 8) return null;
  if (n === 0) return fmtAngka(a) + '^0 = 1';
  return fmtAngka(a) + '^' + n + ' = ' + Array(n).fill(fmtAngka(a)).join(' × ') + ' = ' + fmtAngka(Math.pow(a, n));
}

const SIFAT = [
  ['a^m × a^n = a^(m+n)', '2^3 × 2^4 = 2^7 = 128'],
  ['a^m ÷ a^n = a^(m−n)', '5^6 ÷ 5^2 = 5^4 = 625'],
  ['(a^m)^n = a^(m×n)', '(3^2)^3 = 3^6 = 729'],
  ['(a×b)^n = a^n × b^n', '(2×5)^3 = 2^3 × 5^3 = 1000'],
  ['(a÷b)^n = a^n ÷ b^n', '(6÷3)^4 = 6^4 ÷ 3^4 = 16'],
  ['a^−n = 1 ÷ a^n', '2^−3 = 1 ÷ 2^3 = 0,125'],
  ['a^0 = 1  (a ≠ 0)', '7^0 = 1'],
  ['a^(m÷n) = akar pangkat n dari a^m', '8^(2÷3) = ∛(8^2) = ∛64 = 4'],
];

export function render(root) {
  const inA = T.input('number', 'Basis (a)', '2');
  const inN = T.input('number', 'Pangkat (n)', '10');
  const box = T.out();

  const hitung = (mode) => {
    const a = T.num(inA.value), n = T.num(inN.value);
    if (isNaN(a) || isNaN(n)) { T.show(box, errBox('Isi basis (a) dan pangkat (n) dengan angka yang valid.')); return; }
    if (mode === 'pangkat') {
      const hasil = hitungPangkat(a, n);
      if (isNaN(hasil)) { T.show(box, errBox('Tak terdefinisi: basis negatif dengan pangkat desimal tidak punya hasil real.')); return; }
      const langkah = langkahPerkalian(a, n);
      T.show(box,
        '<div class="center"><div class="dim">' + T.esc(fmtAngka(a)) + ' pangkat ' + T.esc(fmtAngka(n)) + '</div>' +
        '<div class="big">' + T.esc(fmtAngka(hasil)) + '</div>' +
        (langkah ? '<div class="dim" style="margin-top:8px">' + T.esc(langkah) + '</div>' : '') +
        '</div>');
      beep(660, 0.15, 'sine');
    } else {
      const r = hitungAkar(a, n);
      if (!r.ok) { T.show(box, errBox(r.err)); return; }
      T.show(box,
        '<div class="center"><div class="dim">Akar pangkat ' + T.esc(fmtAngka(n)) + ' dari ' + T.esc(fmtAngka(a)) + '</div>' +
        '<div class="big">' + T.esc(fmtAngka(r.hasil)) + '</div>' +
        '<div class="dim" style="margin-top:8px">' + T.esc(fmtAngka(a)) + '^(1÷' + fmtAngka(n) + ')</div></div>');
      beep(660, 0.15, 'sine');
    }
  };

  const kartu = SIFAT.map(([rumus, contoh]) =>
    '<div style="background:#12100d;border:1px solid #2e2823;border-radius:8px;padding:10px 12px;margin-bottom:8px">' +
    '<div style="font-family:monospace;font-size:14px;color:#fff">' + T.esc(rumus) + '</div>' +
    '<div class="dim" style="margin-top:4px;font-size:12.5px">Contoh: ' + T.esc(contoh) + '</div></div>'
  ).join('');

  root.appendChild(T.grid2(
    T.field('Basis (a)', inA),
    T.field('Pangkat (n)', inN, 'Boleh negatif atau desimal.')
  ));
  root.appendChild(T.row(
    T.btn('🔢 Hitung aⁿ', () => hitung('pangkat'), true),
    T.btn('√ Akar pangkat n dari a', () => hitung('akar'))
  ));
  root.appendChild(box);
  root.appendChild(T.el('<h3 style="margin:18px 0 10px;font-size:15px">📇 Sifat-sifat Eksponen</h3>'));
  root.appendChild(T.el('<div>' + kartu + '</div>'));
}
