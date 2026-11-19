import { h as T, utils, kv } from '../../core.js';

// DCF (discounted cash flow): nilai hari ini dari arus kas masa depan.
// Arus kas tahun ke-t = FCF tahun pertama x (1 + tumbuh)^(t-1), lalu
// didiskon dengan (1 + diskonto)^t. Nilai akhir (terminal value) pakai
// model tumbuh abadi Gordon: TV = FCF(n+1) / (diskonto - tumbuh akhir),
// lalu didiskon juga ke hari ini. Syarat: diskonto > tumbuh akhir.
export function hitungDCF(fcf, tumbuh, diskonto, tahun, tumbuhAkhir) {
  const f = Number(fcf);
  const g = Number(tumbuh);
  const r = Number(diskonto);
  const n = Math.floor(Number(tahun));
  const gt = Number(tumbuhAkhir);
  if (![f, g, r, n, gt].every(isFinite) || f <= 0 || n <= 0 || n > 30 || r <= 0 || r <= gt) return null;
  const tabel = [];
  let pvArusKas = 0;
  for (let t = 1; t <= n; t++) {
    const arus = f * Math.pow(1 + g / 100, t - 1);
    const pv = arus / Math.pow(1 + r / 100, t);
    tabel.push({ tahun: t, arus, pv });
    pvArusKas += pv;
  }
  const fcfBerikut = f * Math.pow(1 + g / 100, n - 1) * (1 + gt / 100);
  const nilaiAkhir = fcfBerikut / ((r - gt) / 100);
  const pvNilaiAkhir = nilaiAkhir / Math.pow(1 + r / 100, n);
  const nilaiTotal = pvArusKas + pvNilaiAkhir;
  if (![pvArusKas, pvNilaiAkhir, nilaiTotal].every(isFinite)) return null;
  return { pvArusKas, nilaiAkhir, pvNilaiAkhir, nilaiTotal, tabel };
}
utils.dcf = hitungDCF;

export const meta = {"id": "kalkulator-dcf", "name": "Kalkulator DCF", "cat": "bisnis", "icon": "📊", "desc": "Perkiraan nilai perusahaan atau proyek dari arus kas masa depannya.", "keywords": "dcf,discounted cash flow,valuasi,nilai intrinsik,arus kas,diskonto,terminal value,investasi", "since": "6.18.0"};
export function render(root) {
  const fcfI = T.input('text', 'cth: 500000000', ''); fcfI.inputMode = 'decimal';
  const tumbuhI = T.input('text', 'cth: 10', ''); tumbuhI.inputMode = 'decimal';
  const diskontoI = T.input('text', 'cth: 12', ''); diskontoI.inputMode = 'decimal';
  const tahunI = T.input('text', 'cth: 5', ''); tahunI.inputMode = 'decimal';
  const akhirI = T.input('text', 'cth: 3', ''); akhirI.inputMode = 'decimal';
  const box = T.out();

  const hitung = () => {
    const fcf = T.num(fcfI.value);
    const tumbuh = T.num(tumbuhI.value);
    const diskonto = T.num(diskontoI.value);
    const tahun = T.num(tahunI.value);
    const akhir = T.num(akhirI.value);
    if (!isFinite(fcf) || fcf <= 0) {
      T.show(box, '<div class="err">Arus kas tahun pertama harus diisi angka lebih dari 0.</div>');
      return;
    }
    if (!isFinite(tumbuh) || tumbuh < -100) {
      T.show(box, '<div class="err">Tumbuh arus kas harus diisi angka, minimal -100%.</div>');
      return;
    }
    if (!isFinite(diskonto) || diskonto <= 0) {
      T.show(box, '<div class="err">Tingkat diskonto harus diisi angka lebih dari 0.</div>');
      return;
    }
    if (!isFinite(tahun) || tahun < 1 || tahun > 30 || Math.floor(tahun) !== tahun) {
      T.show(box, '<div class="err">Jumlah tahun harus bilangan bulat antara 1 sampai 30.</div>');
      return;
    }
    if (!isFinite(akhir) || akhir < 0 || akhir >= diskonto) {
      T.show(box, '<div class="err">Tumbuh abadi harus 0 atau lebih, dan lebih kecil dari tingkat diskonto.</div>');
      return;
    }
    const r = hitungDCF(fcf, tumbuh, diskonto, tahun, akhir);
    if (!r) {
      T.show(box, '<div class="err">Angkanya terlalu besar untuk dihitung. Coba pakai angka yang lebih kecil.</div>');
      return;
    }
    const baris = r.tabel.map((b) =>
      '<tr><td style="padding:6px 8px">Tahun ' + b.tahun + '</td><td style="padding:6px 8px;text-align:right">' + T.rp(Math.round(b.arus)) + '</td><td style="padding:6px 8px;text-align:right">' + T.rp(Math.round(b.pv)) + '</td></tr>').join('');
    T.show(box,
      '<div class="big">' + T.rp(Math.round(r.nilaiTotal)) + '</div>' +
      '<p class="center mut">Perkiraan nilai hari ini.</p>' +
      kv('Nilai arus kas ' + tahun + ' tahun', T.rp(Math.round(r.pvArusKas))) +
      kv('Nilai akhir (dihitung ke hari ini)', T.rp(Math.round(r.pvNilaiAkhir))) +
      '<div style="overflow-x:auto;margin-top:12px"><table style="width:100%;border-collapse:collapse;font-size:13px"><tr><th style="text-align:left;padding:6px 8px;border-bottom:1px solid rgba(255,255,255,.15)">Tahun</th><th style="text-align:right;padding:6px 8px;border-bottom:1px solid rgba(255,255,255,.15)">Arus kas</th><th style="text-align:right;padding:6px 8px;border-bottom:1px solid rgba(255,255,255,.15)">Nilai hari ini</th></tr>' + baris + '</table></div>' +
      '<p class="hint">Ini perkiraan kasar. Hasilnya sangat peka terhadap angka diskonto dan tumbuh yang kamu isi: ubah 1% saja, nilainya bisa bergeser jauh. Pakai untuk membandingkan, bukan sebagai harga pasti.</p>');
  };

  root.appendChild(T.el('<p class="note">DCF menilai usaha dari uang yang akan dihasilkannya di masa depan, dihitung ke nilai hari ini. Cocok untuk membandingkan dua usaha atau proyek, bukan untuk harga jual yang pasti.</p>'));
  root.appendChild(T.field('Arus kas tahun pertama (Rp)', fcfI, 'Uang bersih yang dihasilkan usaha per tahun'));
  root.appendChild(T.grid2(
    T.field('Tumbuh arus kas (% per tahun)', tumbuhI),
    T.field('Tingkat diskonto (% per tahun)', diskontoI, 'Hasil yang kamu harapkan, mis. 12%')
  ));
  root.appendChild(T.grid2(
    T.field('Jumlah tahun proyeksi', tahunI, 'Biasanya 5 sampai 10 tahun'),
    T.field('Tumbuh abadi setelah itu (%)', akhirI, 'Tumbuh tahunan setelah masa proyeksi, mis. 3%')
  ));
  root.appendChild(T.row(T.btn('Hitung nilai DCF', hitung, true)));
  root.appendChild(box);
}
