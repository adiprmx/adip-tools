import { h as T, utils, money, kv } from '../../core.js';
import { TARIF_PLN, SPKLU_FEE, TARIF_PLN_PERIODE, TARIF_PLN_BERLAKU, TARIF_PLN_CATATAN_Q1 } from '../../tarif-pln.js';
import { HARGA_BBM_PERTALITE } from '../../harga-bbm.js';

// Biaya ngecas mobil listrik. Energi yang masuk baterai = kapasitas x
// selisih persen. Listrik dari colokan lebih besar karena ada rugi cas
// (efisiensi default 90%, bisa diubah). Tarif rumah dari modul bersama
// js/tarif-pln.js (satu sumber kebenaran dengan tagihan-listrik &
// token-listrik): R-1 1.300/2.200 VA Rp1.444,70/kWh, R-2/R-3 3.500 VA ke
// atas Rp1.699,53/kWh (Triwulan IV 2026, Permen ESDM 7/2024, berlaku
// Oktober-Desember 2026). SPKLU: Rp2.466,78/kWh (maksimum, Permen ESDM
// 1/2023) ditambah biaya layanan fast charging maks Rp25.000 dan ultra
// fast maks Rp57.000 per sesi (Kepmen ESDM 182.K/2023). Harga bensin
// pembanding default dari modul bersama js/harga-bbm.js (satu sumber
// kebenaran dengan 4 tool BBM lain).
export function hitungCas(o) {
  const kapasitas = Math.max(0, Number(o.kapasitas) || 0);
  const persen = Math.max(0, Math.min(100, Number(o.persen) || 0));
  const efisiensi = Math.max(1, Math.min(100, Number(o.efisiensi) || 90)) / 100;
  const tarif = Math.max(0, Number(o.tarif) || 0);
  const fee = Math.max(0, Number(o.fee) || 0);
  const kwhBaterai = kapasitas * persen / 100;
  const kwhColokan = kwhBaterai / efisiensi;
  const biaya = kwhColokan * tarif + fee;
  return { kwhBaterai, kwhColokan, biaya };
}
utils.biayaCasMobilListrik = hitungCas;

const TARIF = {
  rumah1: { label: 'Cas di rumah, daya 1.300 / 2.200 VA', tarif: TARIF_PLN.r1_1300_2200, fee: 0 },
  rumah2: { label: 'Cas di rumah, daya 3.500 VA ke atas', tarif: TARIF_PLN.r2_r3, fee: 0 },
  spklu: { label: 'SPKLU (pengisian umum)', tarif: TARIF_PLN.spklu, fee: 0 },
  spkluFast: { label: 'SPKLU fast charging (22-50 kW)', tarif: TARIF_PLN.spklu, fee: SPKLU_FEE.fast },
  spkluUltra: { label: 'SPKLU ultra fast charging (di atas 50 kW)', tarif: TARIF_PLN.spklu, fee: SPKLU_FEE.ultra },
};

export const meta = {"id": "kalkulator-biaya-cas-mobil-listrik", "name": "Kalkulator Biaya Cas Mobil Listrik", "cat": "otomotif", "icon": "🔌", "desc": "Biaya ngecas mobil listrik di rumah atau SPKLU, dibanding isi bensin untuk jarak yang sama.", "keywords": "mobil listrik,cas,charging,ev,spklu,pln,kwh,baterai,bensin", "since": "6.17.0"};
export function render(root) {
  const kapI = T.input('text', 'cth: 50', '50'); kapI.inputMode = 'decimal';
  const awalI = T.input('text', 'cth: 20', '20'); awalI.inputMode = 'decimal';
  const targetI = T.input('text', 'cth: 80', '80'); targetI.inputMode = 'decimal';
  const lokasiSel = T.select(Object.keys(TARIF).map((k) => [k, TARIF[k].label]), 'rumah1');
  const tarifI = T.input('text', 'cth: 1444,70', String(TARIF_PLN.r1_1300_2200).replace('.', ',')); tarifI.inputMode = 'decimal';
  const efisiensiI = T.input('text', 'cth: 90', '90'); efisiensiI.inputMode = 'decimal';
  const jarakI = T.input('text', 'cth: 250', ''); jarakI.inputMode = 'decimal';
  const konI = T.input('text', 'cth: 12', '12'); konI.inputMode = 'decimal';
  const bensinI = money(null, 'cth: 10000', String(HARGA_BBM_PERTALITE));
  const box = T.out();
  let tarifDiubah = false;
  tarifI.addEventListener('input', () => { tarifDiubah = true; });
  lokasiSel.addEventListener('change', () => {
    const tt = TARIF[lokasiSel.value] || TARIF.rumah1;
    if (!tarifDiubah) tarifI.value = String(tt.tarif).replace('.', ',');
    hitung();
  });

  const hitung = () => {
    const kap = T.num(kapI.value) || 0;
    const awal = T.num(awalI.value);
    const target = T.num(targetI.value);
    if (!(kap > 0)) { T.hide(box); return; }
    if (!isFinite(awal) || awal < 0 || awal > 100 || !isFinite(target) || target < 0 || target > 100) {
      T.show(box, '<p class="warn">Baterai awal dan target harus 0 sampai 100%.</p>'); return;
    }
    if (target <= awal) { T.show(box, '<p class="warn">Target harus lebih besar dari baterai awal.</p>'); return; }
    const efisiensi = T.num(efisiensiI.value);
    if (!isFinite(efisiensi) || efisiensi < 50 || efisiensi > 100) {
      T.show(box, '<p class="warn">Efisiensi cas harus 50 sampai 100%. Biasanya 85–95% untuk cas di rumah, lebih rendah untuk cas cepat.</p>'); return;
    }
    const t = TARIF[lokasiSel.value] || TARIF.rumah1;
    const r = hitungCas({ kapasitas: kap, persen: target - awal, efisiensi, tarif: T.num(tarifI.value), fee: t.fee });
    let banding = '';
    const jarak = T.num(jarakI.value) || 0;
    const kon = T.num(konI.value) || 0;
    const hargaBensin = T.num(bensinI.value) || 0;
    if (jarak > 0 && kon > 0 && hargaBensin > 0) {
      const liter = jarak / kon;
      const biayaBensin = liter * hargaBensin;
      const hemat = biayaBensin - r.biaya;
      banding = kv('Jarak yang ditempuh sekali cas', T.fmt(Math.round(jarak * 10) / 10) + ' km') +
        kv('Bensin untuk jarak yang sama', T.fmt(Math.round(liter * 100) / 100) + ' liter = ' + T.rp(Math.round(biayaBensin))) +
        kv('Biaya per km (listrik)', T.rp(Math.round(r.biaya / jarak))) +
        kv('Biaya per km (bensin)', T.rp(Math.round(biayaBensin / jarak))) +
        kv(hemat >= 0 ? 'Hemat dibanding bensin' : 'Lebih mahal dibanding bensin', T.rp(Math.round(Math.abs(hemat))));
    }
    T.show(box,
      '<div class="big">' + T.rp(Math.round(r.biaya)) + '</div>' +
      '<p class="center mut">Biaya cas dari ' + T.fmt(awal) + '% ke ' + T.fmt(target) + '%.</p>' +
      kv('Energi masuk baterai', T.fmt(Math.round(r.kwhBaterai * 100) / 100) + ' kWh') +
      kv('Listrik dari colokan (rugi cas ' + T.fmt(Math.round((100 - efisiensi) * 10) / 10) + '%)', T.fmt(Math.round(r.kwhColokan * 100) / 100) + ' kWh') +
      kv('Tarif per kWh', T.rp(T.num(tarifI.value))) +
      (t.fee ? kv('Biaya layanan per sesi', T.rp(t.fee)) : '') +
      banding +
      '<p class="hint">Tarif PLN ' + TARIF_PLN_PERIODE + ' (' + TARIF_PLN_BERLAKU + '): rumah 1.300/2.200 VA Rp1.444,70/kWh, 3.500 VA ke atas Rp1.699,53/kWh; SPKLU Rp2.466,78/kWh ditambah biaya layanan fast charging maks Rp25.000 dan ultra fast maks Rp57.000 per sesi. ' + TARIF_PLN_CATATAN_Q1 + ' Efisiensi cas 90% adalah perkiraan, cas cepat dan cuaca panas bisa membuat rugi lebih besar — ubah angkanya sesuai pengalamanmu. Tarif di atas bisa diubah bila sudah berubah.</p>');
  };
  [kapI, awalI, targetI, tarifI, efisiensiI, jarakI, konI, bensinI].forEach((i) => i.addEventListener('input', hitung));

  root.appendChild(T.el('<p class="note">Ngecas di rumah jauh lebih murah daripada di SPKLU. Masukkan kapasitas baterai dan persennya, lalu bandingkan dengan bensin.</p>'));
  root.appendChild(T.field('Kapasitas baterai (kWh)', kapI, 'Lihat di spesifikasi mobilmu, contoh: 50 kWh'));
  root.appendChild(T.grid2(
    T.field('Baterai awal (%)', awalI),
    T.field('Target baterai (%)', targetI)
  ));
  root.appendChild(T.field('Lokasi ngecas', lokasiSel));
  root.appendChild(T.grid2(
    T.field('Tarif listrik (Rp/kWh)', tarifI, 'Terisi otomatis sesuai lokasi, bisa diubah'),
    T.field('Efisiensi cas (%)', efisiensiI, '90% artinya 10% listrik hilang jadi panas. Cas cepat biasanya lebih boros.')
  ));
  root.appendChild(T.field('Jarak tempuh sekali cas (km, opsional)', jarakI, 'Diisi untuk membandingkan dengan bensin'));
  root.appendChild(T.grid2(
    T.field('Konsumsi mobil bensin pembanding (km/liter)', konI),
    T.field('Harga bensin (Rp/liter)', bensinI)
  ));
  root.appendChild(box);
  hitung();
}
