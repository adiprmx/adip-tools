import { h as T, utils } from '../../core.js?v=6.12.0';

export const meta = {"id": "token-listrik", "name": "Kalkulator Token Listrik", "cat": "indonesia", "icon": "⚡", "desc": "Konversi rupiah ke kWh token listrik & sebaliknya.", "keywords": "token,listrik,kwh,pln,prabayar,tarif"};
export function render(root) {
  const TARIF = [
    ['415', 'R-1 450 VA (subsidi) — Rp415/kWh'],
    ['605', 'R-1 900 VA (subsidi) — Rp605/kWh'],
    ['1352', 'R-1 900 VA — Rp1.352/kWh'],
    ['1444.7', 'R-1 1.300–2.200 VA — Rp1.444,70/kWh'],
    ['1699.53', 'R-2 / R-3 (>2.200 VA) — Rp1.699,53/kWh'],
    ['1444.7', 'B-2 (bisnis) — Rp1.444,70/kWh'],
    ['1114.74', 'I-3 (industri) — Rp1.114,74/kWh'],
    ['996.74', 'I-4 (industri besar) — Rp996,74/kWh'],
  ];
  const fmtTarif = (n) => 'Rp' + n.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtKwh = (n) => n.toLocaleString('id-ID', { maximumFractionDigits: 2 });
  const golSel = T.select(TARIF, '1352');
  // PPJ (Pajak Penerangan Jalan) 3–10% tergantung daerah; default 0% =
  // belum dihitung, ubah sesuai daerahmu.
  const ppjI = T.input('text', 'cth: 3', '0');
  ppjI.inputMode = 'decimal';
  const rpInp = T.input('text', 'Contoh: 100000');
  rpInp.inputMode = 'decimal';
  const kwhInp = T.input('text', 'Contoh: 70');
  kwhInp.inputMode = 'decimal';
  const box1 = T.out();
  const box2 = T.out();
  const ppjRate = () => (T.num(ppjI.value) || 0) / 100;
  const hitungRp = () => {
    const tarif = parseFloat(golSel.value) || 1352;
    const rp = T.num(rpInp.value) || 0;
    if (rp <= 0) { T.hide(box1); return; }
    const kwh = rp / (tarif * (1 + ppjRate()));
    T.show(box1,
      '<div class="big center">' + T.esc(fmtKwh(kwh)) + ' <span class="mut" style="font-size:15px">kWh</span></div>' +
      '<p class="center hint">' + T.rp(rp) + ' ÷ ' + T.esc(fmtTarif(tarif)) +
      (ppjRate() > 0 ? ' (termasuk PPJ ' + T.esc(String(T.num(ppjI.value))) + '%)' : ' (PPJ belum dihitung)') + '</p>');
  };
  const hitungKwh = () => {
    const tarif = parseFloat(golSel.value) || 1352;
    const kwh = T.num(kwhInp.value) || 0;
    if (kwh <= 0) { T.hide(box2); return; }
    const rp = kwh * tarif * (1 + ppjRate());
    T.show(box2,
      '<div class="big center">' + T.rp(rp) + '</div>' +
      '<p class="center hint">' + T.esc(fmtKwh(kwh)) + ' kWh × ' + T.esc(fmtTarif(tarif)) +
      (ppjRate() > 0 ? ' + PPJ ' + T.esc(String(T.num(ppjI.value))) + '%' : ' (PPJ belum dihitung)') + '</p>');
  };
  const hitung = () => { hitungRp(); hitungKwh(); };
  golSel.addEventListener('change', hitung);
  ppjI.addEventListener('input', hitung);
  rpInp.addEventListener('input', hitungRp);
  kwhInp.addEventListener('input', hitungKwh);
  root.appendChild(T.field('Golongan tarif', golSel));
  root.appendChild(T.field('PPJ — Pajak Penerangan Jalan (%)', ppjI, '3–10% tergantung daerah (cek struk tokenmu). Default 0% = belum dihitung.'));
  root.appendChild(T.el('<p class="mut" style="margin:14px 0 4px;font-weight:600">Rupiah → kWh</p>'));
  root.appendChild(T.field('Nominal token (Rp)', rpInp));
  root.appendChild(box1);
  root.appendChild(T.el('<p class="mut" style="margin:14px 0 4px;font-weight:600">kWh → Rupiah</p>'));
  root.appendChild(T.field('Jumlah kWh', kwhInp));
  root.appendChild(box2);
  root.appendChild(T.el('<p class="hint">PPJ dihitung dari tarif dasar × kWh. Belum termasuk biaya admin pembelian token. Tarif listrik bisa berubah sewaktu-waktu mengikuti kebijakan PLN.</p>'));
}
