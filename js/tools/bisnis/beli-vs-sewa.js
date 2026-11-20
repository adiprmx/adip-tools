import { h as T, utils } from '../../core.js';

export const meta = {"id": "beli-vs-sewa", "name": "Beli vs Sewa", "cat": "bisnis", "icon": "⚖️", "desc": "Bandingkan total biaya beli vs sewa + titik impasnya, termasuk nilai jual kembali, perawatan, dan nilai waktu uang.", "keywords": "beli,sewa,break even,impas,perbandingan,biaya,nilai jual kembali,depresiasi"};

// Bandingkan beli vs sewa dengan nilai waktu uang.
// - diskonTahunan: % per tahun (0 = tanpa nilai waktu uang). Bunga bulanan
//   = diskonTahunan / 12 (nominal, sederhana dan mudah dijelaskan).
// - jualKembali: perkiraan harga jual barang di akhir pemakaian (0 bila
//   tidak dijual lagi). Perawatan: biaya rawat per bulan bila beli.
// - bepBulan: bulan pertama saat total sewa (nilai sekarang) menyamai biaya
//   beli bersih; null bila tidak pernah impas dalam 100 tahun.
// Logika murni (bisa di-test di Node).
export function bandingBeliSewa(o) {
  const beli = Number(o.beli), sewa = Number(o.sewa);
  const durasi = Math.floor(Number(o.durasi));
  const jualKembali = Math.max(0, Number(o.jualKembali) || 0);
  const perawatan = Math.max(0, Number(o.perawatan) || 0);
  const diskon = Math.max(0, Number(o.diskonTahunan) || 0);
  if (![beli, sewa].every(isFinite) || beli <= 0 || sewa <= 0) return null;
  if (!isFinite(durasi) || durasi <= 0) return null;
  if (!isFinite(diskon) || diskon >= 1200) return null;
  const r = diskon / 100 / 12;
  // Nilai sekarang dari pembayaran bulanan tetap selama n bulan.
  const pvBulanan = (x, n) => (r > 0 ? x * (1 - Math.pow(1 + r, -n)) / r : x * n);
  // Nilai sekarang dari satu penerimaan di bulan ke-n.
  const pvSekali = (x, n) => (r > 0 ? x / Math.pow(1 + r, n) : x);
  const totalBeliNominal = beli + perawatan * durasi - jualKembali;
  const totalSewaNominal = sewa * durasi;
  const npvBeli = beli + pvBulanan(perawatan, durasi) - pvSekali(jualKembali, durasi);
  const npvSewa = pvBulanan(sewa, durasi);
  // BEP nominal (tanpa nilai waktu uang): bulan pertama saat sewa x bulan
  // menyamai beli + perawatan x bulan − jual kembali. Bila perawatan per
  // bulan sudah sebesar/selebih sewa, beli tidak pernah impas.
  let bepNominal = null;
  const sisaBeli = beli - jualKembali;
  if (sisaBeli <= 0) bepNominal = 1;
  else if (sewa > perawatan) bepNominal = Math.max(1, Math.ceil(sisaBeli / (sewa - perawatan)));
  // BEP dengan nilai waktu uang: cari bulan pertama saat PV sewa >= biaya
  // beli bersih (beli + PV perawatan − PV jual kembali di bulan itu).
  let bepBulan = null;
  for (let m = 1; m <= 1200; m++) {
    const biayaBeli = beli + pvBulanan(perawatan, m) - pvSekali(jualKembali, m);
    if (pvBulanan(sewa, m) >= biayaBeli) { bepBulan = m; break; }
  }
  const hemat = npvSewa - npvBeli; // > 0 berarti beli lebih hemat
  return {
    totalBeliNominal, totalSewaNominal, npvBeli, npvSewa,
    bepNominal,
    bepBulan, hemat,
    menang: hemat > 0 ? 'beli' : hemat < 0 ? 'sewa' : 'seri',
  };
}
utils.bandingBeliSewa = bandingBeliSewa;

export function render(root) {
  const K = 'tool:beli-vs-sewa';
  const load = () => { try { return JSON.parse(localStorage.getItem(K) || '{}'); } catch (e) { return {}; } };
  const sv = load();
  const save = () => { try { localStorage.setItem(K, JSON.stringify({ b: beliI.value, s: sewaI.value, d: durasiI.value, j: jualI.value, r: rawatI.value, k: diskonI.value })); } catch (e) {} };

  root.appendChild(T.el('<p class="hint">Mau beli alat sendiri atau sewa aja? Kalau dipakai sebentar, sewa menang. Kalau dipakai lama, beli menang. Hitungan ini juga memperhitungkan harga jual lagi barangnya, biaya rawat, dan nilai waktu uang.</p>'));

  const beliI = T.input('text', 'Contoh: 15000000', sv.b || '');
  const sewaI = T.input('text', 'Contoh: 500000', sv.s || '');
  const durasiI = T.input('text', 'Contoh: 24', sv.d || '');
  const jualI = T.input('text', 'Contoh: 8000000 (boleh kosong)', sv.j || '');
  const rawatI = T.input('text', 'Contoh: 100000 (boleh kosong)', sv.r || '');
  const diskonI = T.input('text', 'Contoh: 6 (boleh kosong)', sv.k || '');
  [beliI, sewaI, durasiI, jualI, rawatI, diskonI].forEach((i) => { i.inputMode = 'decimal'; });

  root.appendChild(T.field('Harga beli (Rp, sekali bayar)', beliI, 'Misal harga kamera, alat kopi, laptop.'));
  root.appendChild(T.grid2(
    T.field('Biaya sewa per bulan (Rp)', sewaI),
    T.field('Rencana dipakai (bulan)', durasiI)
  ));
  root.appendChild(T.grid2(
    T.field('Nilai jual kembali (Rp)', jualI, 'Perkiraan harga jual barang di akhir pemakaian. Kosongkan bila tidak dijual lagi.'),
    T.field('Biaya perawatan per bulan (Rp)', rawatI, 'Servis, sparepart, dan rawat bila beli. Kosongkan bila tidak ada.')
  ));
  root.appendChild(T.field('Bunga per tahun (%)', diskonI, 'Untuk menghitung nilai waktu uang — misal 6% bila uangnya bisa diputar di deposito. Kosongkan bila tidak perlu.'));

  const box = T.out();
  root.appendChild(box);

  const hitung = () => {
    save();
    const beli = T.num(beliI.value);
    const sewa = T.num(sewaI.value);
    const durasi = Math.floor(T.num(durasiI.value));
    if (isNaN(beli) || beli <= 0) { T.show(box, '<p class="mut center">Isi dulu harga belinya.</p>'); return; }
    if (isNaN(sewa) || sewa <= 0) { T.show(box, '<p class="mut center">Biaya sewanya juga diisi ya.</p>'); return; }
    if (isNaN(durasi) || durasi <= 0) { T.show(box, '<p class="mut center">Rencana durasi pakainya diisi dulu ya (dalam bulan).</p>'); return; }
    const h = bandingBeliSewa({
      beli, sewa, durasi,
      jualKembali: T.num(jualI.value) || 0,
      perawatan: T.num(rawatI.value) || 0,
      diskonTahunan: T.num(diskonI.value) || 0,
    });
    if (!h) { T.show(box, '<p class="err">Angkanya tidak bisa dihitung. Periksa lagi isianmu.</p>'); return; }
    const pakaiTvm = (T.num(diskonI.value) || 0) > 0;
    const totalBeli = pakaiTvm ? h.npvBeli : h.totalBeliNominal;
    const totalSewa = pakaiTvm ? h.npvSewa : h.totalSewaNominal;
    const bep = pakaiTvm ? h.bepBulan : h.bepNominal;
    let rekom;
    if (h.menang === 'beli') {
      rekom = 'Rekomendasi: BELI lebih hemat — selisihnya ' + T.rp(Math.round(Math.abs(h.hemat))) + ' selama ' + durasi + ' bulan.';
    } else if (h.menang === 'sewa') {
      rekom = 'Rekomendasi: SEWA lebih hemat — selisihnya ' + T.rp(Math.round(Math.abs(h.hemat))) + ' selama ' + durasi + ' bulan.';
    } else {
      rekom = 'Pas impas: total beli dan total sewa sama besar. Pilih yang lebih nyaman buatmu.';
    }
    T.show(box,
      '<div class="kv"><span class="k">Total beli bersih' + (pakaiTvm ? ' (nilai sekarang)' : '') + '</span><span class="v">' + T.rp(Math.round(totalBeli)) + '</span></div>' +
      '<div class="kv"><span class="k">Total sewa ' + durasi + ' bln' + (pakaiTvm ? ' (nilai sekarang)' : '') + '</span><span class="v">' + T.rp(Math.round(totalSewa)) + '</span></div>' +
      '<div class="kv"><span class="k">Break-even point</span><span class="v">' + (bep == null ? 'tidak pernah impas' : 'bulan ke-' + bep) + '</span></div>' +
      '<p class="hint">Total beli bersih = harga beli + perawatan ' + durasi + ' bulan − nilai jual kembali. ' +
      (pakaiTvm
        ? 'Karena bunga diisi, angka di atas sudah disesuaikan ke nilai uang hari ini (uang sekarang lebih berharga dari uang nanti). Tanpa bunga, total beli ' + T.rp(Math.round(h.totalBeliNominal)) + ' dan total sewa ' + T.rp(Math.round(h.totalSewaNominal)) + '.'
        : 'Isi bunga per tahun bila mau hitungan yang memperhitungkan nilai waktu uang.') +
      ' ' + rekom + '</p>'
    );
  };
  [beliI, sewaI, durasiI, jualI, rawatI, diskonI].forEach((i) => i.addEventListener('input', hitung));
  hitung();
}
