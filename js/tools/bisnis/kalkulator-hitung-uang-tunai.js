import { h as T, kv } from '../../core.js';

export const meta = {"id": "kalkulator-hitung-uang-tunai", "name": "Kalkulator Hitung Uang Tunai", "cat": "bisnis", "icon": "💵", "desc": "Total uang tunai dari jumlah tiap pecahan rupiah, dari Rp100 ribu sampai Rp100.", "keywords": "hitung uang tunai,pecahan rupiah,kasir,tutup kas,uang kertas,koin", "since": "6.17.0"};

// Pecahan rupiah yang beredar, dari besar ke kecil.
export const PECAHAN = [100000, 50000, 20000, 10000, 5000, 2000, 1000, 500, 200, 100];

// jumlah: array jumlah lembar/keping seurutan PECAHAN.
// Balikan: { total, perPecahan: [{ nilai, jumlah, subtotal }] } atau null bila tidak valid.
export function hitungTunai(jumlah) {
  if (!Array.isArray(jumlah) || jumlah.length !== PECAHAN.length) return null;
  let total = 0;
  const perPecahan = [];
  for (let i = 0; i < PECAHAN.length; i++) {
    const j = Number(jumlah[i]);
    if (!isFinite(j) || j < 0 || Math.floor(j) !== j) return null;
    const sub = PECAHAN[i] * j;
    total += sub;
    perPecahan.push({ nilai: PECAHAN[i], jumlah: j, subtotal: sub });
  }
  if (!isFinite(total)) return null;
  return { total, perPecahan };
}

export function render(root) {
  const inputPecahan = PECAHAN.map((p) => {
    const inp = T.input('text', '0', '');
    inp.inputMode = 'numeric';
    return inp;
  });
  const box = T.out();

  const hitung = () => {
    const jumlah = [];
    for (let i = 0; i < PECAHAN.length; i++) {
      const raw = inputPecahan[i].value.trim();
      if (raw === '') { jumlah.push(0); continue; }
      const v = T.num(raw);
      if (!isFinite(v) || v < 0 || Math.floor(v) !== v) {
        T.show(box, '<div class="err">Jumlah pecahan ' + T.rp(PECAHAN[i]) + ' harus diisi angka bulat 0 atau lebih, atau dikosongkan.</div>');
        return;
      }
      jumlah.push(v);
    }
    const hasil = hitungTunai(jumlah);
    if (hasil === null) { T.show(box, '<div class="err">Angkanya tidak bisa dihitung. Periksa lagi isianmu.</div>'); return; }
    let barisTabel = '';
    let totalLembar = 0;
    for (const p of hasil.perPecahan) {
      if (p.jumlah === 0) continue;
      totalLembar += p.jumlah;
      barisTabel += '<tr><td>' + T.rp(p.nilai) + '</td><td style="text-align:right">' + T.fmt(p.jumlah) + '</td><td style="text-align:right">' + T.rp(p.subtotal) + '</td></tr>';
    }
    T.show(box,
      '<div class="big center">' + T.rp(hasil.total) + '</div>' +
      '<p class="center">total uang tunai</p>' +
      kv('Total lembar dan keping', T.fmt(totalLembar)) +
      (barisTabel === '' ? '<p class="warn">Belum ada pecahan yang diisi.</p>' :
        '<table class="tbl" style="margin-top:10px"><thead><tr><th>Pecahan</th><th style="text-align:right">Jumlah</th><th style="text-align:right">Subtotal</th></tr></thead><tbody>' + barisTabel + '</tbody></table>'));
  };

  root.appendChild(T.el('<p class="note">Hitung uang di laci kasir atau brankas tanpa kalkulator manual: isi berapa lembar atau keping tiap pecahan, totalnya langsung muncul. Yang kosong dianggap nol.</p>'));
  for (let i = 0; i < PECAHAN.length; i++) {
    const satuan = PECAHAN[i] >= 1000 ? 'lembar' : 'keping';
    root.appendChild(T.field(T.rp(PECAHAN[i]) + ' (' + satuan + ')', inputPecahan[i], ''));
  }
  root.appendChild(T.row(T.btn('Hitung Total', hitung, true)));
  root.appendChild(box);
}
