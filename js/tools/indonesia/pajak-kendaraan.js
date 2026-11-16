import { h as T, utils } from '../../core.js?v=6.12.2';

const parseRp = (s) => { s = String(s||'').trim().replace(/\s/g,''); if (!s) return NaN; if (s.includes(',')) return Number(s.replace(/\./g,'').replace(',','.')); if (/^\d{1,3}(\.\d{3})+$/.test(s)) return Number(s.replace(/\./g,'')); return Number(s); };

export const meta = {"id": "pajak-kendaraan", "name": "Hitung Pajak Motor & Mobil", "cat": "indonesia", "icon": "🚗", "desc": "Hitung pajak tahunan kendaraanmu: PKB + opsen + SWDKLLJ, dari NJKB di STNK.", "keywords": "pajak,kendaraan,motor,mobil,pkb,opsen,swdkllj,stnk,njkb,bapenda"};
export function render(root) {
  const PROVINSI = [
    ['1.2', 'Lainnya / tidak tahu — 1,2%'],
    ['0.9', 'DI Yogyakarta — 0,9%'],
    ['1.05', 'Jawa Tengah — 1,05%'],
    ['1.12', 'Jawa Barat — 1,12%'],
    ['1.2', 'Jawa Timur — 1,2%'],
    ['2', 'DKI Jakarta — 2%'],
  ];
  const SWDKLLJ = [
    ['35000', 'Motor 50–250 cc — Rp35.000'],
    ['83000', 'Motor di atas 250 cc — Rp83.000'],
    ['143000', 'Mobil pribadi — Rp143.000'],
  ];
  const njkbI = T.input('text', 'cth: 15000000', ''); njkbI.inputMode = 'decimal';
  const bobotI = T.input('number', 'cth: 1', '1');
  const provI = T.select(PROVINSI, '1.2');
  const tarifI = T.input('text', 'cth: 1,2', '1,2'); tarifI.inputMode = 'decimal'; // JANGAN type=number: browser membuang nilai desimal koma ('1,2' -> '')
  const jenisI = T.select(SWDKLLJ, '35000');
  const swdklljI = T.input('text', 'cth: 35000', '35000'); swdklljI.inputMode = 'decimal';
  const box = T.out();

  const kvTable = (pairs) => '<table style="width:100%;border-collapse:collapse;font-size:13.5px">' +
    pairs.map((p) => '<tr><td style="padding:7px 4px;color:#a8a29e">' + T.esc(p[0]) + '</td>' +
      '<td style="padding:7px 4px;text-align:right;font-weight:600">' + p[1] + '</td></tr>').join('') + '</table>';

  const hitung = () => {
    const njkb = parseRp(njkbI.value) || 0;
    const bobot = T.num(bobotI.value) || 0;
    const tarif = (T.num(tarifI.value) || 0) / 100;
    const swdkllj = parseRp(swdklljI.value) || 0;
    if (!(njkb > 0)) { T.show(box, '<p class="warn">Isi NJKB dulu ya — angkanya ada di STNK (kolom NJKB).</p>'); return; }
    if (!(bobot > 0)) { T.show(box, '<p class="warn">Bobot harus lebih dari 0. Biasanya 1 untuk kendaraan biasa.</p>'); return; }
    const pkb = tarif * njkb * bobot;
    const opsen = 0.66 * pkb;
    const total = pkb + opsen + swdkllj;
    T.show(box,
      kvTable([
        ['NJKB × bobot', T.rp(njkb) + ' × ' + T.esc(bobotI.value)],
        ['PKB (' + T.esc(tarifI.value) + '%)', T.rp(pkb)],
        ['Opsen PKB (66% dari PKB)', T.rp(opsen)],
        ['SWDKLLJ', T.rp(swdkllj)],
      ]) +
      '<div class="big" style="margin-top:10px">' + T.rp(total) + ' <span class="mut" style="font-size:14px">/ tahun</span></div>' +
      '<p class="hint">Hitungan untuk kepemilikan pertama, belum termasuk denda kalau telat. Aturan per UU 1/2022, efektif 5 Januari 2025. Angka akhir ikut Bapenda / aplikasi SIGNAL — cek di sana sebelum bayar.</p>');
  };

  provI.addEventListener('change', () => { tarifI.value = provI.value.replace('.', ','); hitung(); });
  jenisI.addEventListener('change', () => { swdklljI.value = jenisI.value; hitung(); });
  [njkbI, bobotI, tarifI, swdklljI].forEach((el) => el.addEventListener('input', hitung));

  root.appendChild(T.el('<p class="note">Sejak 2025, pajak kendaraan ada tambahan opsen 66% dari PKB. Masukkan NJKB dari STNK-mu, langsung ketahuan total yang harus dibayar setahun.</p>'));
  root.appendChild(T.grid2(
    T.field('NJKB (Rp)', njkbI, 'Nilai Jual Kendaraan Bermotor, ada di STNK'),
    T.field('Bobot kendaraan', bobotI, 'Biasanya 1, ada di STNK juga'),
    T.field('Provinsi', provI),
    T.field('Tarif PKB (%)', tarifI, 'Terisi otomatis dari provinsi, bisa diubah'),
    T.field('Jenis kendaraan', jenisI),
    T.field('SWDKLLJ (Rp)', swdklljI, 'Terisi otomatis, bisa diubah')
  ));
  root.appendChild(T.row(T.btn('Hitung pajak', hitung, true)));
  root.appendChild(box);
}
