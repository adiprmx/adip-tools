import { h as T } from '../../core.js';

export const meta = { id: 'kalkulator-uang-kembalian', name: 'Kalkulator Uang Kembalian', cat: 'sehari', icon: '💸', desc: 'Hitung uang kembalian dan pecahan rupiahnya, supaya kasir tidak salah memberi kembalian.', keywords: 'uang kembalian,kembalian,kasir,pecahan rupiah,bayar,belanja', since: '6.18.0' };

// Pecahan rupiah yang beredar, dari besar ke kecil.
export const PECAHAN = [100000, 50000, 20000, 10000, 5000, 2000, 1000, 500, 200, 100];

// Kembalian + rincian pecahan (rakus, dari pecahan terbesar).
// sisa = jumlah di bawah Rp100 yang tidak bisa dikembalikan dengan pecahan.
export function hitungKembalian(total, bayar) {
  if (!isFinite(total) || !isFinite(bayar) || total < 0 || bayar < 0) return null;
  if (bayar < total) return { kurang: total - bayar };
  const kembali = bayar - total;
  let sisa = kembali;
  const rincian = [];
  for (const p of PECAHAN) {
    const j = Math.floor(sisa / p);
    if (j > 0) {
      rincian.push({ nilai: p, jumlah: j, subtotal: p * j });
      sisa -= p * j;
    }
  }
  return { kembali, rincian, sisa };
}

export function render(root) {
  root.appendChild(T.el('<p class="hint">Isi total belanja dan uang yang dibayar. Kalkulator ini menghitung kembaliannya dan pecahan rupiahnya dari yang terbesar.</p>'));

  const totalI = T.input('text', 'cth: 37500', '37500'); totalI.inputMode = 'decimal';
  const bayarI = T.input('text', 'cth: 50000', '50000'); bayarI.inputMode = 'decimal';
  const box = T.out();

  function hitung() {
    const total = T.num(totalI.value), bayar = T.num(bayarI.value);
    if (!isFinite(total) || total < 0) { T.toast('Isi total belanjanya dulu'); return; }
    if (!isFinite(bayar) || bayar < 0) { T.toast('Isi uang yang dibayar dulu'); return; }
    const h = hitungKembalian(total, bayar);
    if (h.kurang != null) {
      T.show(box, '<p class="big">Uangnya kurang ' + T.rp(h.kurang) + '</p><p>Total belanja ' + T.rp(total) + ', uang yang dibayar ' + T.rp(bayar) + '.</p>');
      return;
    }
    if (h.kembali === 0) {
      T.show(box, '<p class="big">Uang pas, tidak ada kembalian</p><p>Total belanja dan uang yang dibayar sama-sama ' + T.rp(total) + '.</p>');
      return;
    }
    const baris = h.rincian.map((r) =>
      '<tr><td style="padding:5px 8px">' + T.rp(r.nilai) + '</td><td style="text-align:right;padding:5px 8px">× ' + r.jumlah + '</td><td style="text-align:right;padding:5px 8px">' + T.rp(r.subtotal) + '</td></tr>').join('');
    T.show(box,
      '<p class="big">Kembalian: ' + T.rp(h.kembali) + '</p>' +
      '<table style="width:100%;border-collapse:collapse;margin-top:12px;font-size:13px"><thead><tr><th style="text-align:left;padding:6px 8px;border-bottom:1px solid rgba(255,255,255,.15)">Pecahan</th><th style="text-align:right;padding:6px 8px;border-bottom:1px solid rgba(255,255,255,.15)">Jumlah</th><th style="text-align:right;padding:6px 8px;border-bottom:1px solid rgba(255,255,255,.15)">Subtotal</th></tr></thead><tbody>' + baris + '</tbody></table>' +
      (h.sisa > 0 ? '<p class="hint">Sisa ' + T.rp(h.sisa) + ' di bawah pecahan terkecil (Rp100), tidak bisa dikembalikan dengan uang yang beredar.</p>' : ''));
  }

  root.append(
    T.field('Total belanja (Rp)', totalI),
    T.field('Uang yang dibayar (Rp)', bayarI),
    T.btn('Hitung kembalian', hitung, true),
    box,
  );
}
