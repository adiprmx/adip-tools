import { h as T, utils, beep, actx, onLeave, kvRows, errBox } from '../../core.js?v=6.8.0';

export const meta = {"id": "pengacak-kalimat", "name": "Pengacak Kalimat", "cat": "teks", "icon": "🔀", "desc": "Acak urutan kata dalam tiap kalimat.", "keywords": "acak,kata,kalimat,shuffle,random,teks"};

/** Fisher-Yates shuffle, mengembalikan array baru. */
export function kocok(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}

/** Pecah teks jadi kalimat, masing-masing {isi, tutup} (tutup = tanda baca akhir). */
export function pecahKalimat(teks) {
  const potong = String(teks || '').match(/[^.!?…\n]+[.!?…]+|[^.!?…\n]+/g) || [];
  return potong.map((s) => {
    const t = s.trim();
    const m = t.match(/^(.*?)([.!?…]+)$/);
    return m ? { isi: m[1].trim(), tutup: m[2] } : { isi: t, tutup: '' };
  }).filter((k) => k.isi.length > 0);
}

/**
 * Acak urutan kata per kalimat.
 * opts: { keepPunct: bool, keepCapital: bool }
 */
export function acakTeks(teks, opts) {
  const o = Object.assign({ keepPunct: true, keepCapital: true }, opts || {});
  return pecahKalimat(teks).map(({ isi, tutup }) => {
    let kata = isi.split(/\s+/).filter(Boolean);
    kata = kocok(kata);
    if (o.keepCapital && kata.length) {
      kata = kata.map((w) => w.toLowerCase());
      kata[0] = kata[0].charAt(0).toUpperCase() + kata[0].slice(1);
    }
    return kata.join(' ') + (o.keepPunct ? tutup : '');
  }).join(' ');
}

export function render(root) {
  const ta = T.ta(5, 'Tulis kalimat atau paragraf di sini…\nContoh: Aku suka makan nasi goreng. Dia suka makan mie ayam.');
  const box = T.out();
  let hasil = '';

  const cekPunct = T.el('<label style="display:flex;align-items:center;gap:8px;font-size:13.5px;margin-bottom:8px;cursor:pointer"><input type="checkbox" checked> Pertahankan tanda baca akhir kalimat</label>');
  const cekCap = T.el('<label style="display:flex;align-items:center;gap:8px;font-size:13.5px;margin-bottom:4px;cursor:pointer"><input type="checkbox" checked> Pertahankan huruf kapital di awal kalimat</label>');

  const acak = () => {
    if (!ta.value.trim()) { T.show(box, errBox('Tulis dulu kalimat atau paragrafnya.')); return; }
    const keepPunct = cekPunct.querySelector('input').checked;
    const keepCapital = cekCap.querySelector('input').checked;
    hasil = acakTeks(ta.value, { keepPunct, keepCapital });
    if (!hasil) { T.show(box, errBox('Tidak ada kata yang bisa diacak.')); return; }
    T.show(box, kvRows([['Hasil', hasil]]));
    const t = T.el('<div class="center" style="margin-top:10px"></div>');
    t.appendChild(T.copyBtn(() => hasil, '📋 Salin Hasil'));
    box.appendChild(t);
    beep(600, 0.12, 'sine');
  };

  root.appendChild(T.field('Teks', ta));
  root.appendChild(cekPunct);
  root.appendChild(cekCap);
  root.appendChild(T.btn('🔀 Acak Kata', acak, true));
  root.appendChild(box);
}
