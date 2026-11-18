import { h as T, kv } from '../../core.js';

export const meta = {"id": "kalkulator-bunga-sederhana", "name": "Kalkulator Bunga Sederhana", "cat": "bisnis", "icon": "💵", "desc": "Bunga pinjaman atau simpanan yang dihitung dari pokok saja, tanpa bunga berbunga.", "keywords": "bunga sederhana,simple interest,pokok,bunga pinjaman,bunga simpanan", "since": "6.17.0"};

// Bunga = pokok x bunga% x waktu (tahun). Total = pokok + bunga.
export function hitungBungaSederhana(pokok, bungaPersen, tahun) {
  const p = Number(pokok), r = Number(bungaPersen) / 100, t = Number(tahun);
  if (![p, r, t].every(isFinite) || p < 0 || r < 0 || t < 0) return null;
  const bunga = p * r * t;
  const total = p + bunga;
  if (![bunga, total].every(isFinite)) return null;
  return { bunga, total };
}

export function render(root) {
  const pI = T.input('text', 'cth: 10000000', '');
  const rI = T.input('text', 'cth: 12', '');
  const tI = T.input('text', 'cth: 2', '');
  const box = T.out();

  const hitung = () => {
    const p = T.num(pI.value);
    const r = T.num(rI.value);
    const t = T.num(tI.value);
    if (!isFinite(p) || p < 0) { T.show(box, '<div class="err">Pokok harus diisi angka 0 atau lebih.</div>'); return; }
    if (!isFinite(r) || r < 0 || r >= 1000) { T.show(box, '<div class="err">Bunga per tahun diisi 0 sampai di bawah 1000.</div>'); return; }
    if (!isFinite(t) || t < 0 || t > 100) { T.show(box, '<div class="err">Jangka waktu diisi 0 sampai 100 tahun, boleh desimal.</div>'); return; }
    const hasil = hitungBungaSederhana(p, r, t);
    if (hasil === null) { T.show(box, '<div class="err">Angkanya terlalu besar untuk dihitung. Coba pakai angka yang lebih kecil.</div>'); return; }
    T.show(box,
      '<div class="big center">' + T.rp(hasil.bunga) + '</div>' +
      '<p class="center">total bunga selama ' + String(t).replace('.', ',') + ' tahun</p>' +
      kv('Total yang dibayar atau diterima', T.rp(hasil.total)) +
      kv('Pokok', T.rp(p)) +
      kv('Bunga per tahun', T.rp(p * r / 100)) +
      kv('Bunga per bulan', T.rp(p * r / 100 / 12)) +
      '<p class="hint">Bunga sederhana selalu dihitung dari pokok awal, jadi bunganya sama besar tiap tahun. Beda dengan bunga majemuk yang bunganya ikut berbunga.</p>');
  };

  root.appendChild(T.el('<p class="note">Bunga sederhana itu bunga yang dihitung dari pokoknya saja. Dipakai di pinjaman jangka pendek dan beberapa simpanan.</p>'));
  root.appendChild(T.field('Pokok (Rp)', pI, 'Jumlah uang yang dipinjam atau disimpan.'));
  root.appendChild(T.field('Bunga (% per tahun)', rI, 'Suku bunga tahunan.'));
  root.appendChild(T.field('Jangka waktu (tahun)', tI, 'Berapa lama uangnya dipinjam atau disimpan. Boleh desimal, contoh: 0,5 untuk 6 bulan.'));
  root.appendChild(T.row(T.btn('Hitung Bunga Sederhana', hitung, true)));
  root.appendChild(box);
}
