import { h as T, kvRows } from '../../core.js';

// Kalkulator Rasio Emas: dari satu ukuran, hitung pasangannya dalam
// proporsi rasio emas (1 : 1,618). Dipakai untuk layout, tipografi,
// dan komposisi gambar.
export const meta = {"id": "kalkulator-rasio-emas", "name": "Kalkulator Rasio Emas (Golden Ratio)", "cat": "desain", "icon": "✨", "desc": "Dari satu ukuran, ketahui pasangannya dalam proporsi rasio emas 1 : 1,618.", "keywords": "rasio emas,golden ratio,phi,proporsi,desain,1.618", "since": "6.18.0"};

export const PHI = 1.618033988749895;

// Hitung pasangan rasio emas. mode: 'pendek' | 'panjang' | 'total'.
// Murni, bisa diuji tanpa DOM.
export function hitungRasioEmas(nilai, mode) {
  const v = Number(nilai);
  if (!Number.isFinite(v) || v <= 0) return null;
  if (mode === 'panjang') {
    const pendek = v / PHI;
    return { pendek, panjang: v, total: v + pendek };
  }
  if (mode === 'total') {
    const panjang = v / PHI;
    const pendek = v - panjang;
    return { pendek, panjang, total: v };
  }
  const panjang = v * PHI;
  return { pendek: v, panjang, total: v + panjang };
}

export function render(root) {
  const modeSel = T.select([
    ['pendek', 'Saya punya sisi pendeknya'],
    ['panjang', 'Saya punya sisi panjangnya'],
    ['total', 'Saya punya total keduanya'],
  ], 'pendek');
  const nilaiI = T.input('number', 'cth: 100', '100');
  const outBox = T.out();
  const gambarBox = T.out();

  function fmt2(v) {
    return v.toFixed(2).replace('.', ',');
  }

  function hitung() {
    const v = T.num(nilaiI.value);
    const hasil = hitungRasioEmas(v, modeSel.value);
    if (!hasil) {
      T.show(outBox, '<div class="err">Isi dulu ukurannya dengan angka lebih dari 0.</div>');
      T.hide(gambarBox);
      return;
    }
    T.show(outBox, kvRows([
      ['Sisi pendek', fmt2(hasil.pendek)],
      ['Sisi panjang', fmt2(hasil.panjang)],
      ['Total keduanya', fmt2(hasil.total)],
      ['Perbandingan', '1 : 1,618'],
    ]));
    const persenPendek = (hasil.pendek / hasil.total) * 100;
    T.show(gambarBox, '<div style="margin-top:14px">' +
      '<div style="display:flex;height:90px;border-radius:10px;overflow:hidden;border:1px solid #27272a">' +
      '<div style="width:' + persenPendek.toFixed(1) + '%;background:#ff6f61;display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;font-weight:600">Pendek</div>' +
      '<div style="flex:1;background:#27272a;display:flex;align-items:center;justify-content:center;color:#e4e4e7;font-size:12px;font-weight:600">Panjang</div>' +
      '</div>' +
      '<p class="hint" style="margin-top:8px">Kotak di atas digambar sesuai perbandingan hasilnya: sisi panjang 1,618 kali sisi pendek.</p>' +
      '</div>');
  }

  const hitungB = T.btn('Hitung', hitung, true);
  nilaiI.addEventListener('input', hitung);
  modeSel.addEventListener('change', hitung);

  root.appendChild(T.field('Yang kamu punya', modeSel));
  root.appendChild(T.field('Ukurannya (angka saja, satuannya bebas)', nilaiI, 'Bisa piksel, cm, atau satuan apa pun. Hasilnya mengikuti satuan yang sama.'));
  root.appendChild(T.row(hitungB));
  root.appendChild(outBox);
  root.appendChild(gambarBox);
  hitung();
}
