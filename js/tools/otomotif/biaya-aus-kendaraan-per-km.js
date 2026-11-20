import { h as T, utils, money, kv } from '../../core.js';
import { HARGA_BBM_PERTALITE } from '../../harga-bbm.js';

// Biaya aus kendaraan per km: total biaya yang "habis" tiap kilometer.
// Depresiasi per km = (harga beli - nilai sekarang) / total km.
// Perawatan per km = total biaya servis, ban, oli, dan suku cadang / total km.
// BBM per km = harga per liter / konsumsi km per liter.
// Total per km = ketiganya dijumlah. Angka ini yang dipakai untuk hitung
// ongkos jalan yang sebenarnya, bukan cuma BBM. Harga BBM default dari
// modul bersama js/harga-bbm.js (satu sumber kebenaran dengan 4 tool
// BBM lain), bisa diubah.
export function hitungAusPerKm(o) {
  const susut = Math.max(0, (Number(o.hargaBeli) || 0) - (Number(o.nilaiAkhir) || 0));
  const km = Math.max(0, Number(o.totalKm) || 0);
  const rawat = Math.max(0, Number(o.servisTotal) || 0);
  const kml = Math.max(0, Number(o.konsumsi) || 0);
  const hargaBbm = Math.max(0, Number(o.hargaBbm) || 0);
  const depKm = km > 0 ? susut / km : 0;
  const rawatKm = km > 0 ? rawat / km : 0;
  const bbmKm = kml > 0 ? hargaBbm / kml : 0;
  return { depKm, rawatKm, bbmKm, totalKm: depKm + rawatKm + bbmKm, susut };
}
utils.ausPerKm = hitungAusPerKm;

export const meta = {"id": "biaya-aus-kendaraan-per-km", "name": "Biaya Aus Kendaraan per KM", "cat": "otomotif", "icon": "🛣️", "desc": "Berapa rupiah yang habis tiap kilometer: harga mobil yang menyusut + servis + BBM, dijumlah jadi satu angka.", "keywords": "aus,per km,kilometer,depresiasi,servis,bbm,ongkos jalan,biaya kendaraan", "since": "6.19.0"};
export function render(root) {
  const beliI = money(null, 'cth: 250000000', '250000000');
  const nilaiI = money(null, 'cth: 180000000', '180000000');
  const kmI = T.input('text', 'cth: 60000', '60000'); kmI.inputMode = 'decimal';
  const servisI = money(null, 'cth: 15000000', '15000000');
  const kmlI = T.input('text', 'cth: 14', '14'); kmlI.inputMode = 'decimal';
  const bbmI = money(null, 'cth: 10000', String(HARGA_BBM_PERTALITE));
  const box = T.out();

  const hitung = () => {
    const km = T.num(kmI.value) || 0;
    if (!(km > 0)) { T.hide(box); return; }
    const r = hitungAusPerKm({
      hargaBeli: T.num(beliI.value), nilaiAkhir: T.num(nilaiI.value), totalKm: km,
      servisTotal: T.num(servisI.value), konsumsi: T.num(kmlI.value), hargaBbm: T.num(bbmI.value),
    });
    T.show(box,
      '<div class="big">' + T.rp(Math.round(r.totalKm)) + ' / km</div>' +
      '<p class="center mut">Ongkos jalan sebenarnya per kilometer.</p>' +
      kv('Harga yang menyusut', T.rp(Math.round(r.depKm)) + ' / km') +
      kv('Servis, ban & suku cadang', T.rp(Math.round(r.rawatKm)) + ' / km') +
      kv('BBM', T.rp(Math.round(r.bbmKm)) + ' / km') +
      kv('Total penyusutan harga', T.rp(Math.round(r.susut))) +
      kv('Biaya 100 km', T.rp(Math.round(r.totalKm * 100))) +
      kv('Biaya 1.000 km', T.rp(Math.round(r.totalKm * 1000))) +
      '<p class="hint">Contoh pakai: perjalanan 100 km bukan cuma habis BBM ' + T.rp(Math.round(r.bbmKm * 100)) + ', tapi total ' + T.rp(Math.round(r.totalKm * 100)) + ' kalau penyusutan dan servis ikut dihitung. Nilai sekarang adalah perkiraan harga jual mobilmu hari ini. Total biaya servis mencakup semua yang pernah keluar: servis berkala, ganti ban, oli, aki, dan suku cadang lain selama jarak itu ditempuh.</p>');
  };
  [beliI, nilaiI, kmI, servisI, kmlI, bbmI].forEach((i) => i.addEventListener('input', hitung));

  root.appendChild(T.el('<p class="note">BBM bukan satu-satunya ongkos jalan. Harga mobil menyusut dan servis juga jalan terus tiap kilometer. Ini hitungan ketiganya.</p>'));
  root.appendChild(T.field('Harga beli kendaraan (Rp)', beliI));
  root.appendChild(T.field('Perkiraan nilai sekarang (Rp)', nilaiI, 'Harga jualnya kalau dijual hari ini'));
  root.appendChild(T.field('Total jarak yang sudah ditempuh (km)', kmI, 'Dari odometer sejak dibeli'));
  root.appendChild(T.field('Total biaya servis selama itu (Rp)', servisI, 'Servis berkala, ban, oli, aki, suku cadang'));
  root.appendChild(T.grid2(
    T.field('Konsumsi BBM (km/liter)', kmlI),
    T.field('Harga BBM (Rp/liter)', bbmI)
  ));
  root.appendChild(box);
  hitung();
}
