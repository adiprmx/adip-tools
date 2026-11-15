import { h as T, utils } from '../../core.js?v=6.12.0';

// Logika murni (bisa di-test di Node).
// Tarif bersih per km (Kepmenhub KP 1001/2022): Zona I Rp1.850-2.300,
// Zona II (Jabodetabek) Rp2.000-2.500, Zona III Rp2.100-2.600.
// Potongan aplikator maksimal 20% (PM 12/2019).
utils.TARIF_OJOL = [
  { id: 'zona1', nama: 'Zona I (Sumatra, Jawa selain Jabodetabek, Bali)', tarif: 2075 },
  { id: 'zona2', nama: 'Zona II (Jabodetabek)', tarif: 2250 },
  { id: 'zona3', nama: 'Zona III (Kalimantan, Sulawesi, Papua, dll.)', tarif: 2350 }
];
utils.hitungOjol = function (o) {
  const trip = Math.max(0, Number(o.trip) || 0);
  const km = Math.max(0, Number(o.km) || 0);
  const tarifKm = Math.max(0, Number(o.tarifKm) || 0);
  const minTrip = Math.max(0, Number(o.minTrip) || 0);
  const potongan = Math.min(100, Math.max(0, Number(o.potongan) || 0)) / 100;
  const bensin = Math.max(0, Number(o.bensin) || 0);
  const lain = Math.max(0, Number(o.lain) || 0);
  const hari = Math.max(0, Number(o.hari) || 0);
  const tarifTrip = Math.max(km * tarifKm, minTrip);
  const kotor = trip * tarifTrip;
  const potRp = kotor * potongan;
  const bersihHari = kotor - potRp - bensin - lain;
  return {
    tarifTrip, kotor, potRp, bersihHari,
    bersihMinggu: bersihHari * 7,
    bersihBulan: bersihHari * hari,
    bersihBulanPot10: (kotor * 0.9 - bensin - lain) * hari
  };
};

export const meta = {"id": "penghasilan-ojol", "name": "Hitung Penghasilan Ojol", "cat": "bisnis", "icon": "🏍️", "desc": "Berapa yang benar-benar masuk kantong setelah potongan aplikasi?", "keywords": "ojol,ojek online,driver,gojek,grab,penghasilan,potongan", "since": "6.11.0"};

export function render(root) {
  const trip = T.input('text', 'Contoh: 15', '15'); trip.inputMode = 'decimal';
  const km = T.input('text', 'Contoh: 5', '5'); km.inputMode = 'decimal';
  const zona = T.select(utils.TARIF_OJOL.map((z) => [z.id, z.nama]), 'zona2');
  const tarifKm = T.input('text', 'Contoh: 2250', '2250'); tarifKm.inputMode = 'decimal';
  const minTrip = T.input('text', 'Contoh: 9000', '9000'); minTrip.inputMode = 'decimal';
  const potongan = T.input('text', 'Contoh: 20', '20'); potongan.inputMode = 'decimal';
  const bensin = T.input('text', 'Contoh: 30000', '30000'); bensin.inputMode = 'decimal';
  const lain = T.input('text', 'Contoh: 20000', '20000'); lain.inputMode = 'decimal';
  const hari = T.input('text', 'Contoh: 26', '26'); hari.inputMode = 'decimal';
  const box = T.out();

  zona.addEventListener('change', () => {
    const z = utils.TARIF_OJOL.find((x) => x.id === zona.value);
    if (z) tarifKm.value = String(z.tarif);
  });

  function calc() {
    const t = T.num(trip.value);
    if (!(t > 0)) { T.show(box, '<div class="hint">Isi dulu jumlah trip per hari.</div>'); return; }
    const r = utils.hitungOjol({
      trip: t, km: T.num(km.value), tarifKm: T.num(tarifKm.value), minTrip: T.num(minTrip.value),
      potongan: T.num(potongan.value), bensin: T.num(bensin.value), lain: T.num(lain.value), hari: T.num(hari.value)
    });
    T.show(box,
      `<div class="kv"><span>Tarif rata-rata per trip</span><b>${T.rp(r.tarifTrip)}</b></div>` +
      `<div class="kv"><span>Penghasilan kotor per hari</span><b>${T.rp(r.kotor)}</b></div>` +
      `<div class="kv"><span>Potongan aplikasi</span><b>- ${T.rp(r.potRp)}</b></div>` +
      `<div class="kv"><span>Bersih per hari (setelah bensin dan biaya lain)</span><b style="color:#fff">${T.rp(r.bersihHari)}</b></div>` +
      `<div class="kv"><span>Perkiraan bersih per bulan</span><b style="color:#fff">${T.rp(r.bersihBulan)}</b></div>` +
      `<div class="kv"><span>Kalau potongan hanya 10%</span><b>${T.rp(r.bersihBulanPot10)} per bulan</b></div>` +
      `<div class="hint">Tarif per km memakai nilai tengah kisaran resmi tiap zona, bisa diubah sesuai tarif yang berlaku di daerahmu. Biaya jasa minimal per trip Rp7.000-10.000 tergantung zona. Potongan maksimal 20 persen sesuai aturan, tapi praktik di lapangan bervariasi, ubah angkanya sesuai potongan yang benar-benar kamu terima.</div>`
    );
  }

  root.appendChild(T.el('<p class="note">Hitung penghasilan bersih driver ojek online: orderan dikurangi potongan aplikasi, bensin, dan biaya harian lainnya.</p>'));
  root.appendChild(T.grid2(
    T.field('Jumlah trip per hari', trip),
    T.field('Rata-rata jarak per trip (km)', km)
  ));
  root.appendChild(T.field('Zona tarif', zona));
  root.appendChild(T.grid2(
    T.field('Tarif per km (Rp)', tarifKm),
    T.field('Tarif minimal per trip (Rp)', minTrip)
  ));
  root.appendChild(T.grid2(
    T.field('Potongan aplikasi (%)', potongan),
    T.field('Hari kerja per bulan', hari)
  ));
  root.appendChild(T.grid2(
    T.field('Bensin per hari (Rp)', bensin),
    T.field('Biaya lain per hari: makan, pulsa, dll. (Rp)', lain)
  ));
  root.appendChild(T.btn('Hitung', calc, true));
  root.appendChild(box);
}
