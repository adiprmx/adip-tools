import { h as T, utils, beep, actx, onLeave } from '../../core.js?v=6.8.0';

// Logika murni (bisa di-test di Node)
utils.modalUsaha = function (items, profit, nowMs) {
  const total = (items || []).reduce((s, it) => s + Math.max(0, Number(it.qty) || 0) * Math.max(0, Number(it.price) || 0), 0);
  const p = Math.max(0, Number(profit) || 0);
  const bepMonths = p > 0 ? total / p : Infinity;
  let breakDate = null;
  if (isFinite(bepMonths)) {
    breakDate = new Date((nowMs || Date.now()) + bepMonths * 30.4375 * 86400000);
  }
  return { total, profit: p, bepMonths, breakDate };
};

export const meta = {"id": "estimasi-modal-usaha", "name": "Estimasi Modal Usaha", "cat": "bisnis", "icon": "🏪", "desc": "Total modal awal & kapan balik modal", "keywords": "modal,usaha,bep,balik modal,bisnis,investasi"};

export function render(root) {
  const list = T.el('<div></div>');
  const profit = T.input('text', 'Contoh: 1500000', '1500000'); profit.inputMode = 'decimal';
  const box = T.out();

  function itemRow(namaV, qtyV, priceV) {
    const nama = T.input('text', 'Nama item, mis. gerobak', namaV || '');
    const qty = T.input('text', 'Qty', qtyV || '1'); qty.inputMode = 'decimal';
    const price = T.input('text', 'Harga satuan (Rp)', priceV || ''); price.inputMode = 'decimal';
    const del = T.btn('✕', () => { row.remove(); refreshTotal(); });
    const row = T.el('<div class="card" style="padding:10px;margin-bottom:8px"></div>');
    row.appendChild(T.field('Item modal', nama));
    row.appendChild(T.grid2(T.field('Qty', qty), T.field('Harga satuan (Rp)', price)));
    const delWrap = T.el('<div style="text-align:right;margin-top:6px"></div>');
    delWrap.appendChild(del);
    row.appendChild(delWrap);
    row._get = () => ({ qty: T.num(qty.value), price: T.num(price.value) });
    return row;
  }

  const totalLine = T.el('<div class="kv" style="margin-top:8px"><span>Total modal awal</span><b>--</b></div>');

  function items() {
    return Array.from(list.children).map(r => r._get()).filter(x => x);
  }

  function refreshTotal() {
    const r = utils.modalUsaha(items(), T.num(profit.value));
    totalLine.querySelector('b').textContent = T.rp(r.total);
  }

  function calc() {
    const r = utils.modalUsaha(items(), T.num(profit.value));
    if (r.total <= 0) { T.show(box, '<div class="hint">⚠️ Tambahkan minimal satu item modal dengan harga.</div>'); return; }
    if (!isFinite(r.bepMonths)) { T.show(box, '<div class="hint">⚠️ Isi estimasi laba bersih per bulan untuk menghitung BEP.</div>'); return; }
    const tgl = r.breakDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    T.show(box,
      `<div class="kv"><span>Total modal awal</span><b>${T.rp(r.total)}</b></div>` +
      `<div class="kv"><span>Estimasi laba bersih / bulan</span><b>${T.rp(r.profit)}</b></div>` +
      `<div class="kv"><span><b>Balik modal (BEP)</b></span><b style="color:#fff">${r.bepMonths.toFixed(1)} bulan</b></div>` +
      `<div class="kv"><span>Perkiraan tanggal BEP</span><b>${T.esc(tgl)}</b></div>` +
      `<div class="hint">Asumsi laba per bulan stabil dan tidak ada biaya tambahan di tengah jalan.</div>`
    );
  }

  list.appendChild(itemRow('Gerobak/etalase', '1', '2000000'));
  list.appendChild(itemRow('Bahan baku awal', '1', '1000000'));
  root.appendChild(T.el('<b>Daftar item modal</b>'));
  root.appendChild(list);
  root.appendChild(T.btn('＋ Tambah item', () => { list.appendChild(itemRow('', '1', '')); refreshTotal(); }));
  root.appendChild(totalLine);
  root.appendChild(T.field('Estimasi laba bersih / bulan (Rp)', profit));
  root.appendChild(T.btn('Hitung BEP', calc, true));
  root.appendChild(box);

  list.addEventListener('input', refreshTotal);
  profit.addEventListener('input', refreshTotal);
  refreshTotal();
}
