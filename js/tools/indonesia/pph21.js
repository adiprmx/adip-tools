import { h as T, money, kv } from '../../core.js?v=6.3.0';

// PTKP setahun (Rp) — PMK 101/2016
const PTKP = {
  'TK/0': 54000000, 'TK/1': 58500000, 'TK/2': 63000000, 'TK/3': 67500000,
  'K/0': 58500000, 'K/1': 63000000, 'K/2': 67500000, 'K/3': 72000000,
  'K/I/0': 112500000, 'K/I/1': 117000000, 'K/I/2': 121500000, 'K/I/3': 126000000,
};
const PTKP_LABEL = {
  'TK/0': 'TK/0 — Lajang', 'TK/1': 'TK/1 — Lajang + 1 tanggungan', 'TK/2': 'TK/2 — Lajang + 2 tanggungan', 'TK/3': 'TK/3 — Lajang + 3 tanggungan',
  'K/0': 'K/0 — Kawin', 'K/1': 'K/1 — Kawin + 1 tanggungan', 'K/2': 'K/2 — Kawin + 2 tanggungan', 'K/3': 'K/3 — Kawin + 3 tanggungan',
  'K/I/0': 'K/I/0 — Kawin, istri kerja', 'K/I/1': 'K/I/1 — Kawin, istri kerja + 1', 'K/I/2': 'K/I/2 — Kawin, istri kerja + 2', 'K/I/3': 'K/I/3 — Kawin, istri kerja + 3',
};

// Tarif progresif Pasal 17 UU PPh (UU HPP)
function pphProgresif(pkp) {
  const lapis = [
    [60000000, 0.05, '5%'], [250000000, 0.15, '15%'], [500000000, 0.25, '25%'],
    [5000000000, 0.30, '30%'], [Infinity, 0.35, '35%'],
  ];
  let sisa = pkp, bawah = 0, total = 0;
  const rinc = [];
  for (const [atas, tarif, label] of lapis) {
    if (sisa <= 0) break;
    const kena = Math.min(sisa, atas - bawah);
    const pajak = kena * tarif;
    rinc.push({ label, kena, pajak });
    total += pajak; sisa -= kena; bawah = atas;
  }
  return { total: Math.round(total), rinc };
}

export const meta = {"id": "pph21", "name": "Kalkulator PPh 21", "cat": "indonesia", "icon": "🧾", "desc": "Hitung PPh 21 karyawan + PTKP.", "keywords": "gaji,pajak,penghasilan,pph,karyawan"};
export function render(root) {

    const gaji = money(null, 'cth: 12000000');
    const tunj = money(null, 'cth: 2000000', '0');
    const iuran = money(null, 'cth: 240000 (JHT 2%)', '0');
    const status = T.select(Object.keys(PTKP).map((k) => [k, PTKP_LABEL[k]]), 'TK/0');
    const box = T.out();

    const hitung = () => {
      const g = T.num(gaji.value) || 0, t = T.num(tunj.value) || 0, iu = T.num(iuran.value) || 0;
      if (g <= 0) { T.show(box, '<p class="warn">Isi dulu gaji pokok per bulan.</p>'); return; }
      const brutoBln = g + t;
      const brutoThn = brutoBln * 12;
      const bjBln = Math.min(brutoBln * 0.05, 500000); // biaya jabatan 5%, maks 500rb/bln
      const netoBln = brutoBln - bjBln - iu;
      const netoThn = netoBln * 12;
      const ptkp = PTKP[status.value];
      let pkp = Math.floor(Math.max(0, netoThn - ptkp) / 1000) * 1000;
      const { total: pphThn, rinc } = pphProgresif(pkp);
      const pphBln = Math.round(pphThn / 12);
      const takeHome = Math.round(brutoBln - pphBln - iu);

      let rincHtml = '';
      for (const r of rinc) {
        rincHtml += kv('Lapisan ' + r.label + ' × ' + T.rp(r.kena), T.rp(Math.round(r.pajak)));
      }
      T.show(box,
        '<div class="big">' + T.rp(pphBln) + '<span style="font-size:13px;font-weight:400"> / bulan</span></div>' +
        kv('PPh 21 setahun', T.rp(pphThn)) +
        kv('Take-home pay / bulan', '<b>' + T.rp(takeHome) + '</b>') +
        '<h3 style="font-size:14px;margin:10px 0 4px">Rincian</h3>' +
        kv('Bruto setahun', T.rp(brutoThn)) +
        kv('Biaya jabatan (5%, maks 500rb/bln)', T.rp(Math.round(bjBln * 12))) +
        kv('Iuran pensiun / JHT setahun', T.rp(Math.round(iu * 12))) +
        kv('Penghasilan neto setahun', T.rp(Math.round(netoThn))) +
        kv('PTKP (' + T.esc(status.value) + ')', T.rp(ptkp)) +
        kv('PKP (dibulatkan ke bawah ribuan)', T.rp(pkp)) +
        rincHtml +
        '<p class="hint">Metode progresif tahunan (disetahunkan) sesuai Pasal 17 UU PPh. Sejak Jan 2024 pemberi kerja memakai tarif efektif rata-rata (TER) bulanan (PP 58/2023) — hasil potong di slip gaji bisa sedikit berbeda, tapi total setahunnya sama.</p>');
    };
    [gaji, tunj, iuran].forEach((i) => i.addEventListener('input', hitung));
    status.addEventListener('change', hitung);

    root.appendChild(T.grid2(
      T.field('Gaji pokok / bulan (Rp)', gaji),
      T.field('Tunjangan / bulan (Rp)', tunj, 'THR & bonus tidak dihitung di sini')
    ));
    root.appendChild(T.grid2(
      T.field('Iuran pensiun / JHT / bulan (Rp)', iuran, 'Biasanya 2% dari gaji (JHT)'),
      T.field('Status PTKP', status)
    ));
    root.appendChild(T.row(T.btn('Hitung PPh 21', hitung, true)));
    root.appendChild(box);

}
