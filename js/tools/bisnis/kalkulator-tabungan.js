import { h as T, utils, beep, actx, onLeave } from '../../core.js?v=6.8.0';

// Logika murni (bisa di-test di Node): bunga majemuk bulanan, setoran di awal bulan
utils.simulasiTabungan = function (o) {
  const target = Math.max(0, Number(o.target) || 0);
  const awal = Math.max(0, Number(o.start) || 0);
  const setoran = Math.max(0, Number(o.deposit) || 0);
  const r = Math.max(0, Number(o.rate) || 0) / 100 / 12;
  const MAX = 1200; // 100 tahun
  if (target <= 0) return { months: 0, totalInterest: 0, yearly: [], reached: false };
  if (awal >= target) return { months: 0, totalInterest: 0, yearly: [], reached: true };
  if (setoran <= 0 && r <= 0) return { months: Infinity, totalInterest: 0, yearly: [], reached: false };
  let bal = awal, months = 0, totalInterest = 0, yearInt = 0;
  const yearly = [];
  while (bal < target && months < MAX) {
    bal += setoran;
    const intr = bal * r;
    bal += intr;
    totalInterest += intr; yearInt += intr;
    months++;
    if (months % 12 === 0) {
      yearly.push({ year: months / 12, saldo: bal, bunga: yearInt });
      yearInt = 0;
    }
  }
  if (months % 12 !== 0) yearly.push({ year: Math.ceil(months / 12), saldo: bal, bunga: yearInt, partial: true });
  return { months, totalInterest, yearly, reached: bal >= target };
};

export const meta = {"id": "kalkulator-tabungan", "name": "Kalkulator Tabungan", "cat": "bisnis", "icon": "🏦", "desc": "Kapan target tabunganmu tercapai?", "keywords": "tabungan,menabung,target,bunga,deposito,nabung"};

export function render(root) {
  const target = T.input('text', 'Contoh: 10000000', '10000000'); target.inputMode = 'decimal';
  const start = T.input('text', 'Contoh: 0', '0'); start.inputMode = 'decimal';
  const deposit = T.input('text', 'Contoh: 1000000', '1000000'); deposit.inputMode = 'decimal';
  const rate = T.input('text', 'Contoh: 4', '4'); rate.inputMode = 'decimal';
  const box = T.out();

  function calc() {
    const r = utils.simulasiTabungan({
      target: T.num(target.value),
      start: T.num(start.value),
      deposit: T.num(deposit.value),
      rate: T.num(rate.value)
    });
    if (T.num(target.value) <= 0) { T.show(box, '<div class="hint">⚠️ Isi target tabungan dulu.</div>'); return; }
    if (!isFinite(r.months)) {
      T.show(box, '<div class="hint">⚠️ Target tidak akan tercapai tanpa setoran atau bunga. Tambahkan setoran bulanan.</div>');
      return;
    }
    const thn = Math.floor(r.months / 12), bln = r.months % 12;
    let rows = '';
    r.yearly.forEach(y => {
      rows += `<tr><td style="padding:6px 8px;border-bottom:1px solid #2a2a2a">Tahun ${y.year}${y.partial ? ' *' : ''}</td>` +
        `<td style="padding:6px 8px;border-bottom:1px solid #2a2a2a;text-align:right">${T.rp(y.saldo)}</td>` +
        `<td style="padding:6px 8px;border-bottom:1px solid #2a2a2a;text-align:right">${T.rp(y.bunga)}</td></tr>`;
    });
    T.show(box,
      `<div class="kv"><span>Target tercapai dalam</span><b style="color:#fff">${r.months} bulan${thn > 0 ? ` (${thn} thn ${bln} bln)` : ''}</b></div>` +
      `<div class="kv"><span>Total bunga diperoleh</span><b>${T.rp(r.totalInterest)}</b></div>` +
      `<div class="kv"><span>Total setoran sendiri</span><b>${T.rp(T.num(start.value) + T.num(deposit.value) * r.months)}</b></div>` +
      `<b>Ringkasan per tahun</b>` +
      `<table style="width:100%;border-collapse:collapse;font-size:13px;margin-top:6px">` +
      `<tr><td style="padding:6px 8px;border-bottom:1px solid #3a3a3a;color:#999">Periode</td>` +
      `<td style="padding:6px 8px;border-bottom:1px solid #3a3a3a;color:#999;text-align:right">Saldo akhir</td>` +
      `<td style="padding:6px 8px;border-bottom:1px solid #3a3a3a;color:#999;text-align:right">Bunga</td></tr>` +
      rows + `</table>` +
      `<div class="hint">* tahun terakhir sebagian. Bunga dihitung majemuk per bulan, setoran masuk di awal bulan.</div>`
    );
  }

  root.appendChild(T.field('Target tabungan (Rp)', target));
  root.appendChild(T.grid2(
    T.field('Tabungan awal (Rp)', start),
    T.field('Setoran per bulan (Rp)', deposit)
  ));
  root.appendChild(T.field('Bunga (% per tahun)', rate));
  root.appendChild(T.btn('Hitung', calc, true));
  root.appendChild(box);
}
