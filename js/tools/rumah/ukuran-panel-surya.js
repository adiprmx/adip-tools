import { h as T, utils, kv } from '../../core.js';

// Ukuran sistem panel surya dari pemakaian listrik. Kebutuhan daya (Wp) =
// pemakaian harian (Wh) / jam matahari puncak / (1 - rugi sistem).
// Jam matahari puncak di Indonesia umumnya 4 sampai 5 jam per hari.
// Rugi sistem 20% menutup panas, kabel, inverter, dan debu.
// Luas atap: panel modern butuh sekitar 4,2–4,9 m2 per kWp (modul saja,
// tanpa jarak antar-panel) — patokan 4,7 m2/kWp dipakai di sini.
// Jangkar terverifikasi 20 Nov 2026 dari lembar data pabrikan: 550 Wp
// 2278x1134 mm = 2,58 m2 (Tata TP530-550, Blue Carbon SP-550, PWSolar);
// 450-470 Wp 1728x1205 mm = 2,08 m2 (REC Alpha Pure-RX); 420-440 Wp
// 1722x1134 mm = 1,95 m2 (Qcells Q.TRON). Nilai lama 2,3 m2 flat untuk
// semua watt sudah dicabut — panel 550 Wp nyatanya 2,58 m2.
export const LUAS_PER_KWP_M2 = 4.7;
export function luasPerPanelM2(watt) {
  return Number(watt) * LUAS_PER_KWP_M2 / 1000;
}
export function hitungPanelSurya(kwhPerHari, jamMatahari, wattPanel, rugiPersen) {
  const kwh = Number(kwhPerHari);
  const jam = Number(jamMatahari);
  const watt = Number(wattPanel);
  const rugi = Number(rugiPersen);
  if (![kwh, jam, watt, rugi].every(isFinite) || kwh <= 0 || jam <= 0 || watt <= 0 || rugi < 0 || rugi >= 100) return null;
  const kebutuhanWatt = kwh * 1000 / jam / (1 - rugi / 100);
  const jumlahPanel = Math.ceil(kebutuhanWatt / watt);
  const luasPerPanel = luasPerPanelM2(watt);
  return {
    kebutuhanWatt,
    jumlahPanel,
    kapasitasTerpasang: jumlahPanel * watt,
    luasPerPanel,
    luasAtap: jumlahPanel * luasPerPanel,
  };
}
utils.panelSurya = hitungPanelSurya;

export const meta = {"id": "ukuran-panel-surya", "name": "Ukuran Panel Surya", "cat": "rumah", "icon": "☀️", "desc": "Berapa panel surya yang kamu butuhkan dari tagihan listrik bulananmu.", "keywords": "panel surya,solar,plts,atap,listrik,hemat,kwh,wp,rumah,energi", "since": "6.18.0"};
export function render(root) {
  const kwhI = T.input('text', 'cth: 300', ''); kwhI.inputMode = 'decimal';
  const jamI = T.input('text', 'cth: 4,5', '4,5'); jamI.inputMode = 'decimal';
  const wattI = T.input('text', 'cth: 550', '550'); wattI.inputMode = 'decimal';
  const rugiI = T.input('text', 'cth: 20', '20'); rugiI.inputMode = 'decimal';
  const box = T.out();

  const hitung = () => {
    const kwhBulan = T.num(kwhI.value);
    const jam = T.num(jamI.value);
    const watt = T.num(wattI.value);
    const rugi = T.num(rugiI.value);
    if (!isFinite(kwhBulan) || kwhBulan <= 0) {
      T.show(box, '<div class="err">Pemakaian listrik per bulan harus diisi angka lebih dari 0 (dalam kWh).</div>');
      return;
    }
    if (!isFinite(jam) || jam <= 0 || jam > 12) {
      T.show(box, '<div class="err">Jam matahari puncak harus angka antara 0 sampai 12 jam.</div>');
      return;
    }
    if (!isFinite(watt) || watt <= 0) {
      T.show(box, '<div class="err">Daya per panel harus diisi angka lebih dari 0 (dalam Watt peak).</div>');
      return;
    }
    if (!isFinite(rugi) || rugi < 0 || rugi >= 100) {
      T.show(box, '<div class="err">Rugi sistem harus angka antara 0 sampai di bawah 100%.</div>');
      return;
    }
    const kwhHari = kwhBulan / 30;
    const r = hitungPanelSurya(kwhHari, jam, watt, rugi);
    if (!r) { T.show(box, '<div class="err">Angkanya tidak bisa dihitung. Cek lagi yang kamu isi.</div>'); return; }
    T.show(box,
      '<div class="big">' + T.fmt(r.jumlahPanel) + ' panel</div>' +
      '<p class="center mut">Sistem ' + (r.kapasitasTerpasang / 1000).toFixed(2).replace('.', ',') + ' kWp untuk pemakaian ' + T.fmt(Math.round(kwhBulan)) + ' kWh per bulan.</p>' +
      kv('Pemakaian per hari', kwhHari.toFixed(1).replace('.', ',') + ' kWh') +
      kv('Daya minimal yang dibutuhkan', T.fmt(Math.round(r.kebutuhanWatt)) + ' Wp') +
      kv('Kapasitas terpasang', T.fmt(r.kapasitasTerpasang) + ' Wp') +
      kv('Luas per panel (' + T.fmt(watt) + ' Wp)', r.luasPerPanel.toFixed(2).replace('.', ',') + ' m2') +
      kv('Luas atap yang dibutuhkan', r.luasAtap.toFixed(1).replace('.', ',') + ' m2') +
      '<p class="hint">Luas dihitung dari daya panelmu (sekitar 4,7 m2 per kWp — panel 550 Wp sekitar 2,58 m2, panel 450 Wp sekitar 2,1 m2). Ini luas modulnya saja; atap aslinya butuh lebih karena ada jarak antar-panel, jalan perawatan, dan bagian atap yang tidak bisa dipakai. Ini perkiraan awal untuk merencanakan. Pasang panel surya butuh survei atap (arah, kemiringan, bayangan) dan izin PLN untuk sistem yang tersambung ke jaringan. Jam matahari 4,5 jam adalah nilai tengah untuk Indonesia, sesuaikan dengan daerahmu.</p>');
  };
  [kwhI, jamI, wattI, rugiI].forEach((i) => i.addEventListener('input', hitung));

  root.appendChild(T.el('<p class="note">Mau pasang panel surya di atap? Lihat dulu pemakaian listrik bulananmu di tagihan PLN, lalu masukkan di sini untuk tahu berapa panel yang dibutuhkan.</p>'));
  root.appendChild(T.field('Pemakaian listrik / bulan (kWh)', kwhI, 'Lihat di tagihan atau aplikasi PLN Mobile'));
  root.appendChild(T.grid2(
    T.field('Jam matahari puncak / hari', jamI, 'Di Indonesia umumnya 4 sampai 5 jam'),
    T.field('Daya per panel (Wp)', wattI, 'Panel rumah umumnya 450 sampai 550 Wp')
  ));
  root.appendChild(T.field('Rugi sistem (%)', rugiI, 'Kehilangan karena panas, kabel, dan inverter. Umumnya sekitar 20%.'));
  root.appendChild(box);
}
