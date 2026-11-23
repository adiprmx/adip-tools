import { h as T, esc, errBox } from '../../core.js';

// Penyelesaian matematika simbolik lewat Newton API, tanpa key.
// Terverifikasi 17 Nov 2026: /api/v2/derive/x%5E2 -> 200, CORS *.
// Operasi: derive, integrate, factor, zeroes, tangent, area, cos, sin, tan, log.
// Untuk garis singgung dan luas, formatnya: fungsi|x=angka, contoh x^2|x=2.
export const meta = {"id":"penyelesaian-matematika","name":"Penyelesaian Matematika","cat":"liveapi","icon":"➗","desc":"Hitung turunan, integral, faktor, akar persamaan, dan fungsi trigonometri.","keywords":"matematika,turunan,integral,faktor,akar,persamaan,trigonometri,newton,hitung","since":"6.17.0", "online": true};

const OPERASI = [
  ['derive', 'Turunan (derive)'],
  ['integrate', 'Integral (integrate)'],
  ['factor', 'Faktorkan (factor)'],
  ['zeroes', 'Akar persamaan (zeroes)'],
  ['tangent', 'Garis singgung (tangent)'],
  ['area', 'Luas di bawah kurva (area)'],
  ['cos', 'Cosinus'],
  ['sin', 'Sinus'],
  ['tan', 'Tangen'],
  ['log', 'Logaritma'],
];

const CONTOH = {
  derive: 'x^2', integrate: 'x^2', factor: 'x^2+2x', zeroes: 'x^2-4',
  tangent: 'x^2|x=2', area: 'x^2|x=0:2', cos: 'pi', sin: 'pi/2', tan: 'pi/4', log: '100',
};

const PETUNJUK = {
  derive: 'Tulis fungsi, contoh: x^2',
  integrate: 'Tulis fungsi, contoh: x^2',
  factor: 'Tulis bentuk yang mau difaktorkan, contoh: x^2+2x',
  zeroes: 'Tulis persamaan, contoh: x^2-4',
  tangent: 'Tulis fungsi lalu |x=angka titiknya, contoh: x^2|x=2',
  area: 'Tulis fungsi lalu |x=batas bawah:batas atas, contoh: x^2|x=0:2',
  cos: 'Tulis sudut dalam radian, contoh: pi',
  sin: 'Tulis sudut dalam radian, contoh: pi/2',
  tan: 'Tulis sudut dalam radian, contoh: pi/4',
  log: 'Tulis angka, contoh: 100',
};

async function getJSON(url) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 15000);
  try {
    const r = await fetch(url, { signal: c.signal });
    if (!r.ok) throw new Error('http ' + r.status);
    return await r.json();
  } finally { clearTimeout(t); }
}

export function render(root) {
  const box = T.out();
  const op = T.select(OPERASI, 'derive');
  const inp = T.input('text', 'Contoh: x^2', 'x^2');
  inp.setAttribute('autocomplete', 'off');
  inp.setAttribute('autocapitalize', 'off');
  const petunjuk = T.el('<div class="hint"></div>');
  const aturPetunjuk = () => { petunjuk.textContent = PETUNJUK[op.value] || ''; inp.placeholder = 'Contoh: ' + (CONTOH[op.value] || 'x^2'); };
  op.addEventListener('change', aturPetunjuk);
  aturPetunjuk();

  const hitung = async () => {
    const ekspresi = String(inp.value || '').trim();
    if (!ekspresi) { T.show(box, errBox('Tulis dulu soalnya.')); return; }
    T.show(box, '<p class="mut">Menghitung…</p>');
    try {
      const j = await getJSON('https://newton.vercel.app/api/v2/' + op.value + '/' + encodeURIComponent(ekspresi));
      if (!j || j.result == null || j.result === '') throw new Error('bad-data');
      T.show(box,
        '<div class="center"><div class="dim">' + esc(op.options[op.selectedIndex].text) + ' dari ' + esc(j.expression || ekspresi) + '</div>' +
        '<div style="font-weight:800;font-size:22px;margin:8px 0;word-break:break-word">' + esc(String(j.result)) + '</div></div>' +
        '<p class="hint">Dihitung oleh Newton API. Tulis pangkat dengan tanda ^, contoh: x^2 dibaca x kuadrat.</p>');
    } catch (e) {
      const msg = e.name === 'AbortError'
        ? 'Waktu habis, server tidak bisa dihubungi dalam 15 detik.'
        : e.message === 'bad-data'
          ? 'Soal itu tidak bisa dihitung. Periksa penulisannya, contoh yang benar: x^2'
          : 'Gagal menghitung. Cek koneksi internet, lalu coba lagi.';
      T.show(box, errBox(msg));
      const wr = T.el('<div style="margin-top:8px"></div>');
      wr.appendChild(T.btn('🔄 Coba lagi', hitung));
      box.appendChild(wr);
    }
  };

  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') hitung(); });
  root.appendChild(T.el('<p class="note">Pilih jenis perhitungan lalu tulis soalnya. Pangkat ditulis dengan tanda ^, contoh x^2 untuk x kuadrat.</p>'));
  root.appendChild(T.field('Jenis perhitungan', op, ''));
  const fEks = T.field('Soal', inp, '');
  fEks.appendChild(petunjuk);
  root.appendChild(fEks);
  root.appendChild(T.row(T.btn('= Hitung', hitung, true)));
  root.appendChild(box);
}
