import { h as T, utils, kv } from '../../core.js';

// Perkiraan lama mengecas baterai. Energi yang harus diisi (Wh) = kapasitas
// (mAh) x tegangan (V) / 1000, lalu dibagi daya charger yang efektif
// (watt x efisiensi 85%). Pengisian nyata melambat di atas 80%, jadi angka
// ini perkiraan bawah, waktu aslinya sedikit lebih lama.
export function energiWh(mAh, volt) {
  const m = Number(mAh);
  const v = Number(volt);
  if (!isFinite(m) || !isFinite(v) || m < 0 || v <= 0) return null;
  return m * v / 1000;
}
export function waktuCasJam(mAh, watt, volt, persenAwal, persenTarget, efisiensi) {
  const m = Number(mAh);
  const w = Number(watt);
  const v = Number(volt) || 3.7;
  const awal = Number(persenAwal) || 0;
  const target = Number(persenTarget);
  const eff = efisiensi == null ? 0.85 : Number(efisiensi);
  if (!isFinite(m) || !isFinite(w) || m <= 0 || w <= 0 || !isFinite(target) || target <= awal) return null;
  const wh = energiWh(m, v) * (target - awal) / 100;
  return wh / (w * eff);
}
export function fmtJam(jam) {
  const total = Math.round(Number(jam) * 60);
  if (!isFinite(total) || total < 0) return '';
  if (total < 1) return 'kurang dari 1 menit';
  const j = Math.floor(total / 60);
  const m = total % 60;
  if (j <= 0) return total + ' menit';
  if (m === 0) return j + ' jam';
  return j + ' jam ' + m + ' menit';
}
utils.waktuCas = { energiWh, waktuCasJam };

export const meta = {"id": "waktu-cas-baterai", "name": "Waktu Cas Baterai", "cat": "sehari", "icon": "🔋", "desc": "Perkirakan berapa lama mengecas HP, laptop, atau power bank dari kapasitas baterai dan watt charger.", "keywords": "waktu cas,charging time,baterai,mah,watt charger,ngecas,charger", "since": "6.19.0"};
export function render(root) {
  const kapasitasI = T.input('text', 'cth: 5000', ''); kapasitasI.inputMode = 'decimal';
  const wattI = T.input('text', 'cth: 25', ''); wattI.inputMode = 'decimal';
  const voltI = T.input('text', 'cth: 3,7', '3,7'); voltI.inputMode = 'decimal';
  const awalI = T.input('text', 'cth: 20', '0'); awalI.inputMode = 'numeric';
  const targetI = T.input('text', 'cth: 100', '100'); targetI.inputMode = 'numeric';
  const box = T.out();

  const hitung = () => {
    const mAh = T.num(kapasitasI.value);
    const watt = T.num(wattI.value);
    const volt = T.num(voltI.value);
    const awal = T.num(awalI.value);
    const target = T.num(targetI.value);
    if (!kapasitasI.value.trim() && !wattI.value.trim()) { T.hide(box); return; }
    if (!isFinite(mAh) || mAh <= 0 || mAh > 1000000) { T.show(box, '<div class="err">Kapasitas baterai harus angka lebih dari 0 sampai 1.000.000 mAh.</div>'); return; }
    if (!isFinite(watt) || watt <= 0 || watt > 1000) { T.show(box, '<div class="err">Daya charger harus angka lebih dari 0 sampai 1000 watt.</div>'); return; }
    if (!isFinite(volt) || volt <= 0 || volt > 100) { T.show(box, '<div class="err">Tegangan harus angka lebih dari 0 sampai 100 volt.</div>'); return; }
    if (!isFinite(awal) || awal < 0 || awal > 100 || !isFinite(target) || target < 0 || target > 100) { T.show(box, '<div class="err">Persentase baterai harus angka 0 sampai 100.</div>'); return; }
    if (target <= awal) { T.show(box, '<div class="err">Target harus lebih besar dari baterai saat ini.</div>'); return; }
    const jam = waktuCasJam(mAh, watt, volt, awal, target);
    const wh = energiWh(mAh, volt);
    const penuh = waktuCasJam(mAh, watt, volt, 0, 100);
    T.show(box,
      '<div class="big">~' + fmtJam(jam) + '</div>' +
      '<p class="center mut">Perkiraan dari ' + T.fmt(awal) + '% ke ' + T.fmt(target) + '%.</p>' +
      kv('Energi baterai', utils.fmtDes(wh, 1) + ' Wh') +
      kv('Daya efektif', utils.fmtDes(watt * 0.85, 1) + ' W (85% dari ' + T.fmt(watt) + ' W)') +
      kv('Dari kosong sampai penuh', '~' + fmtJam(penuh)) +
      '<p class="hint">Angka ini perkiraan. Charger dan HP membatasi daya saat baterai hampir penuh supaya baterai awet, jadi 20% terakhir bisa lebih lama dari hitungan. Tegangan 3,7 volt cocok untuk HP dan power bank; laptop biasanya 11,1 volt (3 sel) atau 14,8 volt (4 sel), cek di label baterainya.</p>');
  };
  [kapasitasI, wattI, voltI, awalI, targetI].forEach((i) => i.addEventListener('input', hitung));

  root.appendChild(T.el('<p class="note">Isi kapasitas baterai dan watt charger, langsung ketahuan kira-kira berapa lama ngecasnya.</p>'));
  root.appendChild(T.grid2(
    T.field('Kapasitas baterai (mAh)', kapasitasI, 'Tertulis di bodi HP atau dusnya'),
    T.field('Daya charger (watt)', wattI, 'Tertulis di kepala charger, cth: 25W')
  ));
  root.appendChild(T.field('Tegangan baterai (volt)', voltI, 'HP dan power bank umumnya 3,7 volt'));
  root.appendChild(T.grid2(
    T.field('Baterai saat ini (%)', awalI),
    T.field('Target cas (%)', targetI)
  ));
  root.appendChild(box);
}
