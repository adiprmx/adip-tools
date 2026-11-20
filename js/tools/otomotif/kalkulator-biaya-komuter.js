import { h as T, utils, kv } from '../../core.js';
import { HARGA_BBM_PERTALITE, HARGA_BBM_LABEL } from '../../harga-bbm.js';

// Biaya pulang-pergi kerja per bulan. Kendaraan pribadi: biaya BBM =
// jarak x hari / konsumsi x harga, ditambah tol dan parkir. Transportasi
// umum: tarif pulang-pergi x hari. Harga BBM default dari modul bersama
// js/harga-bbm.js (satu sumber kebenaran dengan 4 tool BBM lain), dan
// bisa diubah.
export function hitungBiayaKomuter(o) {
  const jarak = Math.max(0, Number(o.jarakPP) || 0);
  const hari = Math.max(0, Number(o.hari) || 0);
  const kml = Number(o.kml);
  const harga = Math.max(0, Number(o.hargaBbm) || 0);
  const tol = Math.max(0, Number(o.tol) || 0);
  const parkir = Math.max(0, Number(o.parkir) || 0);
  if (!isFinite(kml) || kml <= 0) return null;
  const literPerBulan = jarak * hari / kml;
  const bbmPerBulan = literPerBulan * harga;
  const perBulan = bbmPerBulan + tol + parkir;
  return {
    literPerBulan,
    bbmPerBulan,
    perHari: hari > 0 ? perBulan / hari : 0,
    perBulan,
    perTahun: perBulan * 12,
  };
}
export function hitungBiayaKomuterUmum(tarifPP, hari) {
  const t = Math.max(0, Number(tarifPP) || 0);
  const h = Math.max(0, Number(hari) || 0);
  return { perHari: t, perBulan: t * h, perTahun: t * h * 12 };
}
utils.biayaKomuter = hitungBiayaKomuter;

export const meta = {"id": "kalkulator-biaya-komuter", "name": "Kalkulator Biaya Komuter", "cat": "otomotif", "icon": "🚗", "desc": "Berapa habisnya pulang-pergi kerja tiap bulan: BBM, tol, parkir, atau ongkos umum.", "keywords": "komuter,biaya,kerja,pulang pergi,bbm,tol,parkir,transportasi,ongkos,bulanan", "since": "6.18.0"};
export function render(root) {
  const modeSel = T.select([
    ['pribadi', 'Kendaraan pribadi (motor/mobil)'],
    ['umum', 'Transportasi umum'],
  ], 'pribadi');
  const jarakI = T.input('text', 'cth: 30', ''); jarakI.inputMode = 'decimal';
  const hariI = T.input('text', 'cth: 22', '22'); hariI.inputMode = 'decimal';
  const kmlI = T.input('text', 'cth: 40', ''); kmlI.inputMode = 'decimal';
  const hargaI = T.input('text', 'cth: 10000', String(HARGA_BBM_PERTALITE)); hargaI.inputMode = 'decimal';
  const tolI = T.input('text', 'cth: 300000', '0'); tolI.inputMode = 'decimal';
  const parkirI = T.input('text', 'cth: 150000', '0'); parkirI.inputMode = 'decimal';
  const tarifI = T.input('text', 'cth: 20000', ''); tarifI.inputMode = 'decimal';
  const box = T.out();
  const fldPribadi = T.el('<div></div>');
  const fldUmum = T.el('<div></div>');

  const hitung = () => {
    const hari = T.num(hariI.value);
    if (!isFinite(hari) || hari <= 0 || hari > 31) {
      T.show(box, '<div class="err">Hari kerja per bulan harus angka antara 1 sampai 31.</div>');
      return;
    }
    if (modeSel.value === 'umum') {
      const tarif = T.num(tarifI.value);
      if (!isFinite(tarif) || tarif < 0) {
        T.show(box, '<div class="err">Tarif pulang-pergi harus diisi angka 0 atau lebih.</div>');
        return;
      }
      const r = hitungBiayaKomuterUmum(tarif, hari);
      T.show(box,
        '<div class="big">' + T.rp(Math.round(r.perBulan)) + '<span style="font-size:13px;font-weight:400"> / bulan</span></div>' +
        '<p class="center mut">Biaya transportasi umum pulang-pergi kerja.</p>' +
        kv('Tarif pulang-pergi / hari', T.rp(Math.round(tarif))) +
        kv('Hari kerja / bulan', T.fmt(hari) + ' hari') +
        kv('Biaya / tahun', T.rp(Math.round(r.perTahun))) +
        '<p class="hint">Bila tarifmu naik turun tiap hari, pakai rata-rata harian. Biaya ini belum termasuk ojek ke halte atau stasiun bila ada.</p>');
      return;
    }
    const jarak = T.num(jarakI.value);
    const kml = T.num(kmlI.value);
    if (!isFinite(jarak) || jarak <= 0) {
      T.show(box, '<div class="err">Jarak pulang-pergi harus diisi angka lebih dari 0 (dalam km).</div>');
      return;
    }
    if (!isFinite(kml) || kml <= 0) {
      T.show(box, '<div class="err">Konsumsi BBM harus diisi angka lebih dari 0 (km per liter).</div>');
      return;
    }
    const r = hitungBiayaKomuter({
      jarakPP: jarak, hari, kml,
      hargaBbm: T.num(hargaI.value), tol: T.num(tolI.value), parkir: T.num(parkirI.value),
    });
    if (!r) { T.show(box, '<div class="err">Angkanya tidak bisa dihitung. Cek lagi yang kamu isi.</div>'); return; }
    T.show(box,
      '<div class="big">' + T.rp(Math.round(r.perBulan)) + '<span style="font-size:13px;font-weight:400"> / bulan</span></div>' +
      '<p class="center mut">Biaya pulang-pergi kerja dengan kendaraan pribadi.</p>' +
      kv('BBM / bulan', T.rp(Math.round(r.bbmPerBulan)) + ' (' + r.literPerBulan.toFixed(1).replace('.', ',') + ' liter)') +
      kv('Tol / bulan', T.rp(Math.round(T.num(tolI.value) || 0))) +
      kv('Parkir / bulan', T.rp(Math.round(T.num(parkirI.value) || 0))) +
      kv('Biaya / hari kerja', T.rp(Math.round(r.perHari))) +
      kv('Biaya / tahun', T.rp(Math.round(r.perTahun))) +
      '<p class="hint">Harga BBM default ' + HARGA_BBM_LABEL + ', sesuaikan dengan BBM yang kamu pakai. Biaya ini belum termasuk servis, pajak, dan cicilan kendaraan.</p>');
  };
  modeSel.addEventListener('change', () => {
    fldPribadi.hidden = modeSel.value !== 'pribadi';
    fldUmum.hidden = modeSel.value !== 'umum';
    hitung();
  });
  [jarakI, hariI, kmlI, hargaI, tolI, parkirI, tarifI].forEach((i) => i.addEventListener('input', hitung));

  fldPribadi.appendChild(T.field('Jarak pulang-pergi (km)', jarakI, 'Jarak rumah ke kantor dan kembali'));
  fldPribadi.appendChild(T.grid2(
    T.field('Konsumsi BBM (km/liter)', kmlI, 'Cek di kalkulator konsumsi BBM bila belum tahu'),
    T.field('Harga BBM (Rp/liter)', hargaI)
  ));
  fldPribadi.appendChild(T.grid2(
    T.field('Tol / bulan (Rp)', tolI, 'Isi 0 bila tidak lewat tol'),
    T.field('Parkir / bulan (Rp)', parkirI, 'Isi 0 bila parkir gratis')
  ));
  fldUmum.appendChild(T.field('Tarif pulang-pergi / hari (Rp)', tarifI, 'Total ongkos berangkat dan pulang'));
  fldUmum.hidden = true;

  root.appendChild(T.el('<p class="note">Ongkos ngantor tiap bulan sering tidak terasa, tapi jumlahnya besar. Masukkan jarak dan harimu, dan lihat berapa habisnya sebulan dan setahun.</p>'));
  root.appendChild(T.field('Cara berangkat kerja', modeSel));
  root.appendChild(T.field('Hari kerja / bulan', hariI));
  root.appendChild(fldPribadi);
  root.appendChild(fldUmum);
  root.appendChild(box);
  hitung();
}
