import { h as T, utils, kv } from '../../core.js?v=6.13.0';

export const meta = {"id": "denda-pajak-stnk", "name": "Denda Pajak STNK", "cat": "indonesia", "icon": "🚗", "desc": "Hitung denda telat bayar pajak kendaraan (PKB + SWDKLLJ).", "keywords": "denda,pajak,stnk,pkb,swdkllj,kendaraan,motor,mobil,samsat,telat"};
export function render(root) {

    const inPkb = T.input('text', 'PKB di STNK (Rp)', '');
    const inSw = T.input('text', 'SWDKLLJ di STNK (Rp)', '');
    const inBln = T.input('number', 'Telat berapa bulan', '1');
    const box = T.out();
    const hitung = () => {
      const pkb = T.num(inPkb.value), sw = T.num(inSw.value);
      const n = Math.floor(T.num(inBln.value));
      if (!(pkb >= 0) || !(sw >= 0) || !(n >= 0)) { T.show(box, '<p class="warn">Isi semua kolom dengan angka yang benar ya.</p>'); return; }
      let dPkb = 0, dSw = 0, persenSw = 0;
      if (n > 0) {
        // PP 35/2023 Pasal 59 ayat 7: denda PKB 1%/bulan, maks 24 bulan.
        dPkb = 0.01 * Math.min(n, 24) * pkb;
        persenSw = n <= 1 ? 0.25 : n === 2 ? 0.5 : n <= 4 ? 0.75 : 1;
        // PMK 16/2017: denda SWDKLLJ paling banyak Rp100.000.
        dSw = Math.min(persenSw * sw, 100000);
      }
      const total = pkb + sw + dPkb + dSw;
      T.show(box,
        kv('PKB pokok', T.rp(pkb)) +
        kv('SWDKLLJ pokok', T.rp(sw)) +
        kv('Denda PKB (1%/bln × ' + Math.min(n, 24) + ' bln)', T.rp(dPkb)) +
        kv('Denda SWDKLLJ (' + Math.round(persenSw * 100) + '%, maks Rp100.000)', T.rp(dSw)) +
        '<div class="big center" style="margin-top:10px">' + T.rp(total) + '</div>' +
        '<p class="center hint">Total yang harus dibayar</p>' +
        '<p class="hint">Aturan per PP 35/2023: denda PKB 1% per bulan, maksimal 24 bulan. Denda SWDKLLJ maksimal Rp100.000 (PMK 16/2017). Angka ilustrasi berdasarkan aturan umum — nominal resmi tetap cek di Samsat ya.</p>');
    };
    root.appendChild(T.grid2(T.field('PKB (Rp)', inPkb), T.field('SWDKLLJ (Rp)', inSw)));
    root.appendChild(T.field('Telat (bulan)', inBln));
    root.appendChild(T.row(T.btn('Hitung denda', hitung, true)));
    root.appendChild(box);

}
