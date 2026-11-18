import { h as T, kv } from '../../core.js';

export const meta = {"id": "kalkulator-penyusutan-aset-depresiasi", "name": "Kalkulator Penyusutan Aset (Depresiasi)", "cat": "bisnis", "icon": "🏭", "desc": "Penyusutan garis lurus dan saldo menurun, lengkap dengan tabel per tahun.", "keywords": "penyusutan,depresiasi,garis lurus,saldo menurun,aset tetap,nilai buku", "since": "6.17.0"};

// Garis lurus: tiap tahun sama, (harga - nilai sisa) / umur.
// Saldo menurun ganda: tiap tahun 2/umur x nilai buku, tidak boleh di bawah nilai sisa.
export function tabelGarisLurus(harga, nilaiSisa, umur) {
  const h = Number(harga), s = Number(nilaiSisa), n = Number(umur);
  if (![h, s, n].every(isFinite) || h <= 0 || s < 0 || s >= h || n <= 0 || n > 50) return null;
  const perTahun = (h - s) / n;
  const baris = [];
  let buku = h;
  for (let t = 1; t <= n; t++) {
    buku -= perTahun;
    baris.push({ tahun: t, susut: perTahun, buku: Math.max(buku, s) });
  }
  return baris;
}

export function tabelSaldoMenurun(harga, nilaiSisa, umur) {
  const h = Number(harga), s = Number(nilaiSisa), n = Number(umur);
  if (![h, s, n].every(isFinite) || h <= 0 || s < 0 || s >= h || n <= 0 || n > 50) return null;
  const tarif = 2 / n;
  const baris = [];
  let buku = h;
  for (let t = 1; t <= n; t++) {
    let susut = buku * tarif;
    if (t === n) susut = buku - s;
    else if (buku - susut < s) susut = buku - s;
    buku -= susut;
    baris.push({ tahun: t, susut, buku });
  }
  return baris;
}

const tabelHtml = (judul, baris) => {
  let isi = '';
  for (const b of baris) {
    isi += '<tr><td>Tahun ' + b.tahun + '</td><td style="text-align:right">' + T.rp(b.susut) + '</td><td style="text-align:right">' + T.rp(b.buku) + '</td></tr>';
  }
  return '<p class="note">' + judul + '</p><table class="tbl"><thead><tr><th>Tahun</th><th style="text-align:right">Penyusutan</th><th style="text-align:right">Nilai buku</th></tr></thead><tbody>' + isi + '</tbody></table>';
};

export function render(root) {
  const hI = T.input('text', 'cth: 100000000', '');
  const sI = T.input('text', 'cth: 10000000', '');
  const nI = T.input('text', 'cth: 5', '');
  const box = T.out();

  const hitung = () => {
    const h = T.num(hI.value);
    const sRaw = sI.value.trim();
    const s = sRaw === '' ? 0 : T.num(sRaw);
    const n = T.num(nI.value);
    if (!isFinite(h) || h <= 0) { T.show(box, '<div class="err">Harga beli aset harus diisi angka lebih dari 0.</div>'); return; }
    if (!isFinite(s) || s < 0) { T.show(box, '<div class="err">Nilai sisa harus diisi angka 0 atau lebih, atau dikosongkan.</div>'); return; }
    if (s >= h) { T.show(box, '<div class="err">Nilai sisa harus lebih kecil dari harga beli.</div>'); return; }
    if (!isFinite(n) || n <= 0 || n > 50 || Math.floor(n) !== n) { T.show(box, '<div class="err">Umur pakai diisi angka bulat 1 sampai 50 tahun.</div>'); return; }
    const lurus = tabelGarisLurus(h, s, n);
    const menurun = tabelSaldoMenurun(h, s, n);
    if (lurus === null || menurun === null) { T.show(box, '<div class="err">Angkanya tidak bisa dihitung. Periksa lagi isianmu.</div>'); return; }
    T.show(box,
      '<div class="big center">' + T.rp(lurus[0].susut) + '</div>' +
      '<p class="center">penyusutan per tahun (garis lurus)</p>' +
      kv('Total yang disusutkan', T.rp(h - s)) +
      kv('Nilai sisa akhir', T.rp(s)) +
      kv('Umur pakai', n + ' tahun') +
      tabelHtml('Metode garis lurus: sama besar tiap tahun', lurus) +
      tabelHtml('Metode saldo menurun ganda: besar di awal, mengecil tiap tahun', menurun) +
      '<p class="hint">Garis lurus cocok untuk aset yang ausnya merata seperti gedung. Saldo menurun cocok untuk aset yang nilainya cepat jatuh di awal seperti kendaraan dan komputer.</p>');
  };

  root.appendChild(T.el('<p class="note">Aset seperti mesin dan kendaraan kehilangan nilai tiap tahun. Penyusutan menghitung berapa nilai yang hilang itu, tahun demi tahun.</p>'));
  root.appendChild(T.field('Harga beli aset (Rp)', hI, 'Harga saat aset dibeli.'));
  root.appendChild(T.field('Nilai sisa (Rp, boleh kosong)', sI, 'Perkiraan harga jual aset setelah umur pakainya habis.'));
  root.appendChild(T.field('Umur pakai (tahun)', nI, 'Berapa tahun aset ini dipakai, angka bulat.'));
  root.appendChild(T.row(T.btn('Hitung Penyusutan', hitung, true)));
  root.appendChild(box);
}
