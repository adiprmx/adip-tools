import { h as T, utils, money, kv } from '../../core.js';

// Hemat ganti lampu pijar ke LED. Hemat daya = (watt pijar - watt LED) x
// jumlah lampu. Hemat kWh per bulan = hemat daya x jam nyala x 30 / 1000.
// Hemat rupiah = hemat kWh x tarif. Tarif default R-1 1.300/2.200 VA
// Rp1.444,70/kWh (Triwulan IV 2026, Permen ESDM 7/2024). Balik modal =
// total harga LED / hemat per bulan. Perbandingan terang yang setara:
// pijar 60 W setara LED 9 W, pijar 100 W setara LED 14 W.
export function hitungHematLed(o) {
  const jumlah = Math.max(0, Number(o.jumlah) || 0);
  const pijar = Math.max(0, Number(o.pijar) || 0);
  const led = Math.max(0, Number(o.led) || 0);
  const jam = Math.max(0, Math.min(24, Number(o.jam) || 0));
  const tarif = Math.max(0, Number(o.tarif) || 0);
  const hematWatt = Math.max(0, pijar - led) * jumlah;
  const kwhBulan = hematWatt * jam * 30 / 1000;
  const rpBulan = kwhBulan * tarif;
  const rpTahun = rpBulan * 12;
  const hargaLed = Math.max(0, Number(o.hargaLed) || 0) * jumlah;
  const balikModal = rpBulan > 0 ? hargaLed / rpBulan : 0;
  return { hematWatt, kwhBulan, rpBulan, rpTahun, hargaLed, balikModal };
}
utils.hematLampuLed = hitungHematLed;

export const meta = {"id": "kalkulator-hemat-lampu-led", "name": "Kalkulator Hemat Lampu LED", "cat": "sehari", "icon": "💡", "desc": "Berapa hemat listrik dan uang bila lampu pijar diganti LED.", "keywords": "led,lampu,pijar,hemat,listrik,watt,pln,tagihan", "since": "6.17.0"};
export function render(root) {
  const jumlahI = T.input('text', 'cth: 10', '10'); jumlahI.inputMode = 'decimal';
  const pijarI = T.input('text', 'cth: 60', '60'); pijarI.inputMode = 'decimal';
  const ledI = T.input('text', 'cth: 9', '9'); ledI.inputMode = 'decimal';
  const jamI = T.input('text', 'cth: 6', '6'); jamI.inputMode = 'decimal';
  const tarifI = T.input('text', 'cth: 1444,70', '1444,70'); tarifI.inputMode = 'decimal';
  const hargaI = money(null, 'cth: 25000 (opsional)', '');
  const box = T.out();

  const hitung = () => {
    const jumlah = T.num(jumlahI.value) || 0;
    const pijar = T.num(pijarI.value);
    const led = T.num(ledI.value);
    if (!(jumlah > 0)) { T.hide(box); return; }
    if (!isFinite(pijar) || pijar <= 0 || !isFinite(led) || led < 0) { T.show(box, '<p class="warn">Watt lampu harus angka lebih dari 0.</p>'); return; }
    if (led >= pijar) { T.show(box, '<p class="warn">Watt LED harus lebih kecil dari watt lampu pijar, kalau tidak tidak ada yang dihemat.</p>'); return; }
    const jam = T.num(jamI.value);
    if (!isFinite(jam) || jam < 0 || jam > 24) { T.show(box, '<p class="warn">Jam nyala per hari harus 0 sampai 24.</p>'); return; }
    const r = hitungHematLed({ jumlah, pijar, led, jam, tarif: T.num(tarifI.value), hargaLed: T.num(hargaI.value) });
    const hargaLed = T.num(hargaI.value) || 0;
    const balik = hargaLed > 0
      ? kv('Modal beli LED (' + T.fmt(jumlah) + ' lampu)', T.rp(Math.round(r.hargaLed))) +
        kv('Balik modal dalam', r.balikModal < 1 ? 'kurang dari 1 bulan' : T.fmt(Math.round(r.balikModal * 10) / 10) + ' bulan')
      : '';
    T.show(box,
      '<div class="big">' + T.rp(Math.round(r.rpBulan)) + ' / bulan</div>' +
      '<p class="center mut">Hemat tagihan listrik tiap bulan.</p>' +
      kv('Hemat daya', T.fmt(Math.round(r.hematWatt * 10) / 10) + ' watt') +
      kv('Hemat listrik', T.fmt(Math.round(r.kwhBulan * 100) / 100) + ' kWh / bulan') +
      kv('Hemat setahun', '<b>' + T.rp(Math.round(r.rpTahun)) + '</b>') +
      balik +
      '<p class="hint">Tarif default R-1 1.300/2.200 VA Rp1.444,70/kWh (Triwulan IV 2026, Permen ESDM 7/2024), ubah sesuai golongan listrik rumahmu. Terang yang setara: pijar 60 W kira-kira sama dengan LED 9 W, pijar 100 W sama dengan LED 14 W. LED juga umurnya jauh lebih panjang, jadi jarang beli lampu lagi.</p>');
  };
  [jumlahI, pijarI, ledI, jamI, tarifI, hargaI].forEach((i) => i.addEventListener('input', hitung));

  root.appendChild(T.el('<p class="note">Lampu pijar mengubah sebagian besar listrik jadi panas, bukan cahaya. LED jauh lebih irit untuk terang yang sama. Hitung hematnya di sini.</p>'));
  root.appendChild(T.field('Jumlah lampu yang diganti', jumlahI));
  root.appendChild(T.grid2(
    T.field('Watt lampu pijar lama', pijarI, 'Contoh: 60 W'),
    T.field('Watt LED pengganti', ledI, 'Contoh: 9 W, terangnya setara pijar 60 W')
  ));
  root.appendChild(T.grid2(
    T.field('Jam nyala per hari', jamI),
    T.field('Tarif listrik (Rp/kWh)', tarifI)
  ));
  root.appendChild(T.field('Harga satu LED (Rp, opsional)', hargaI, 'Diisi untuk menghitung kapan modalnya balik'));
  root.appendChild(box);
  hitung();
}
