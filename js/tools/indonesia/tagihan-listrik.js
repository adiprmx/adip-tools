import { h as T, utils } from '../../core.js?v=6.10.0';

export const meta = {"id": "tagihan-listrik", "name": "Hitung Tagihan Listrik", "cat": "indonesia", "icon": "💡", "desc": "Hitung tagihan listrik bulanan dari alat elektronik di rumahmu — ketahuan alat mana yang paling boros.", "keywords": "listrik,tagihan,pln,kwh,watt,tarif,hemat,token,boros"};
export function render(root) {
  const TARIF = [
    ['415', '450 VA (subsidi) — Rp415/kWh'],
    ['605', '900 VA (subsidi) — Rp605/kWh'],
    ['1352', '900 VA (nonsubsidi/RTM) — Rp1.352/kWh'],
    ['1444.7', '1.300 & 2.200 VA — Rp1.444,70/kWh'],
    ['1699.53', '3.500 VA ke atas — Rp1.699,53/kWh'],
  ];
  const fmtRp2 = (n) => 'Rp' + n.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  const fmtKwh = (n) => n.toLocaleString('id-ID', { maximumFractionDigits: 2 });
  const fmtTarif = (n) => 'Rp' + n.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const golSel = T.select(TARIF, '1444.7');
  const ppjI = T.input('number', 'cth: 3', '3');
  const listBox = T.el('<div></div>');
  const box = T.out();
  const rows = [];

  const hitung = () => {
    const tarif = parseFloat(golSel.value) || 0;
    const ppj = (T.num(ppjI.value) || 0) / 100;
    const items = [];
    rows.forEach((r) => {
      const nama = (r.nama.value || '').trim() || 'Alat tanpa nama';
      const watt = T.num(r.watt.value) || 0;
      const jam = T.num(r.jam.value) || 0;
      if (!(watt > 0) || !(jam > 0)) return;
      const kwh = watt * jam * 30 / 1000;
      items.push({ nama, watt, jam, kwh, rp: kwh * tarif });
    });
    if (items.length === 0) { T.show(box, '<p class="warn">Isi dulu watt dan jam pakai tiap alatnya ya.</p>'); return; }
    const totalKwh = items.reduce((a, b) => a + b.kwh, 0);
    const totalRp = items.reduce((a, b) => a + b.rp, 0);
    const ppjRp = totalRp * ppj;
    const grand = totalRp + ppjRp;
    const urut = items.slice().sort((a, b) => b.kwh - a.kwh);
    const baris = urut.map((it, i) =>
      '<tr><td style="padding:7px 4px">' + (i + 1) + '. ' + T.esc(it.nama) +
      '<br><span class="hint">' + T.esc(String(it.watt)) + ' watt × ' + T.esc(String(it.jam)) + ' jam/hari</span></td>' +
      '<td style="padding:7px 4px;text-align:right">' + T.esc(fmtKwh(it.kwh)) + ' kWh<br><b>' + fmtRp2(it.rp) + '</b></td></tr>'
    ).join('');
    const terboros = urut[0];
    T.show(box,
      '<div class="big">' + fmtRp2(grand) + ' <span class="mut" style="font-size:14px">/ bulan</span></div>' +
      '<p class="center hint">' + T.esc(fmtKwh(totalKwh)) + ' kWh × ' + T.esc(fmtTarif(tarif)) + ' + PPJ ' + T.esc(ppjI.value) + '% (' + fmtRp2(ppjRp) + ')</p>' +
      '<p class="mut" style="font-weight:600;margin:14px 0 4px">Alat paling boros ke paling irit</p>' +
      '<table style="width:100%;border-collapse:collapse;font-size:13.5px">' + baris + '</table>' +
      '<p class="hint">Paling boros: <b>' + T.esc(terboros.nama) + '</b> (' + fmtRp2(terboros.rp) + '/bulan). Mengurangi jam pakainya paling terasa di tagihan. ' +
      'Dihitung 30 hari/bulan. Tarif PLN Triwulan IV 2026 (berlaku s.d. 31 Desember 2026). Tagihan asli bisa beda karena ada biaya lain di rekening PLN.</p>');
  };

  const tambahBaris = (nama, watt, jam) => {
    const namaI = T.input('text', 'Nama alat', nama || '');
    const wattI = T.input('number', 'Watt', watt || '');
    const jamI = T.input('number', 'Jam/hari', jam || '');
    const row = T.el('<div style="display:grid;grid-template-columns:1fr 82px 82px 38px;gap:8px;margin-bottom:8px;align-items:center"></div>');
    const hapus = T.btn('✕', () => {
      const i = rows.findIndex((r) => r.row === row);
      if (i >= 0) rows.splice(i, 1);
      row.remove();
      hitung();
    });
    row.appendChild(namaI);
    row.appendChild(wattI);
    row.appendChild(jamI);
    row.appendChild(hapus);
    rows.push({ row, nama: namaI, watt: wattI, jam: jamI });
    [namaI, wattI, jamI].forEach((el) => el.addEventListener('input', hitung));
    listBox.appendChild(row);
  };

  golSel.addEventListener('change', hitung);
  ppjI.addEventListener('input', hitung);

  root.appendChild(T.el('<p class="note">Tulis alat elektronik di rumahmu beserta watt dan jam pakainya tiap hari. Langsung ketahuan tagihan sebulan dan alat mana yang paling boros.</p>'));
  root.appendChild(T.grid2(
    T.field('Golongan tarif listrik', golSel),
    T.field('PPJ / pajak penerangan jalan (%)', ppjI, 'Biasanya 3%, beda tiap daerah — bisa diubah')
  ));
  root.appendChild(T.el('<p class="mut" style="font-weight:600;margin:14px 0 6px">Daftar alat elektronik</p>'));
  root.appendChild(T.el('<p class="hint" style="margin:0 0 8px">Dua baris di bawah ini contoh awal — ubah nama, watt, dan jamnya sesuai alat di rumahmu, atau hapus dan tambah sendiri.</p>'));
  root.appendChild(listBox);
  root.appendChild(T.row(
    T.btn('＋ Tambah alat', () => { tambahBaris('', '', ''); hitung(); }),
    T.btn('Hitung tagihan', hitung, true)
  ));
  root.appendChild(box);
  tambahBaris('Kulkas', '100', '24');
  tambahBaris('Lampu ruang tamu', '20', '8');
  hitung();
}
