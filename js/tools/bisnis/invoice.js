import { h as T, utils } from '../../core.js?v=4.2.0';

utils.invoiceCalc = function (items, discPct, taxPct) {
    let sub = 0;
    (items || []).forEach((it) => { sub += (Number(it.qty) || 0) * (Number(it.harga) || 0); });
    const disc = sub * (Number(discPct) || 0) / 100;
    const afterDisc = sub - disc;
    const tax = afterDisc * (Number(taxPct) || 0) / 100;
    return { subtotal: sub, diskon: disc, pajak: tax, total: afterDisc + tax };
  };

let _printCssDone = false;

function ensurePrintCss() {
    if (_printCssDone) return;
    _printCssDone = true;
    const st = document.createElement('style');
    st.textContent =
      '@media print{' +
      'body *{visibility:hidden !important}' +
      '#invoice-print,#invoice-print *{visibility:visible !important}' +
      '#invoice-print{position:absolute;inset:0;background:#fff;color:#000;padding:24px}' +
      '#invoice-print .inv-head{border-bottom:2px solid #000;padding-bottom:12px;margin-bottom:16px}' +
      '#invoice-print table{width:100%;border-collapse:collapse}' +
      '#invoice-print th,#invoice-print td{border:1px solid #999;padding:8px;text-align:left;font-size:14px}' +
      '#invoice-print .inv-tot{text-align:right;margin-top:12px}' +
      '}';
    document.head.appendChild(st);
  }

export const meta = {"id": "invoice", "name": "Invoice Generator", "cat": "bisnis", "icon": "📑", "desc": "Bikin invoice rapi siap cetak."};

export function render(root) {

      ensurePrintCss();
      const usahaI = T.input('text', 'Nama usaha', '');
      const noI = T.input('text', 'No. invoice', 'INV-' + Date.now().toString().slice(-6));
      const tglI = T.input('date', '');
      tglI.value = new Date().toISOString().slice(0, 10);
      const discI = T.input('text', 'Diskon %', '0');
      const taxI = T.input('text', 'Pajak %', '0');
      const box = T.out();
      const itemsWrap = T.el('<div></div>');

      function itemRow(nama, qty, harga) {
        const r = T.el('<div class="row inv-item"></div>');
        const nI = T.input('text', 'Nama item', nama || '');
        nI.style.flex = '3';
        const qI = T.input('text', 'Qty', qty || '1');
        qI.style.flex = '1'; qI.inputMode = 'numeric';
        const hI = T.input('text', 'Harga', harga || '');
        hI.style.flex = '2'; hI.inputMode = 'decimal';
        const del = T.btn('✕', () => r.remove());
        r.appendChild(nI); r.appendChild(qI); r.appendChild(hI); r.appendChild(del);
        r._get = () => ({ nama: nI.value, qty: T.num(qI.value) || 0, harga: T.num(hI.value) || 0 });
        return r;
      }
      itemsWrap.appendChild(itemRow('Produk A', '2', '50000'));
      itemsWrap.appendChild(itemRow('Produk B', '1', '75000'));

      function items() {
        return [...itemsWrap.querySelectorAll('.inv-item')].map((r) => r._get()).filter((x) => x.nama || x.qty || x.harga);
      }

      function preview() {
        const list = items();
        if (!list.length) { T.toast('Tambah minimal satu item'); return; }
        const calc = utils.invoiceCalc(list, T.num(discI.value) || 0, T.num(taxI.value) || 0);
        const rows = list.map((it, i) =>
          `<tr><td>${i + 1}</td><td>${T.esc(it.nama)}</td><td>${T.fmt(it.qty)}</td><td>${T.rp(it.harga)}</td><td>${T.rp(it.qty * it.harga)}</td></tr>`
        ).join('');
        T.show(box, '');
        const inv = T.el(`<div id="invoice-print" class="invoice">
          <div class="inv-head">
            <h2 style="margin:0">${T.esc(usahaI.value || 'Nama Usaha')}</h2>
            <div class="hint">No: <b>${T.esc(noI.value)}</b> · Tanggal: <b>${T.esc(tglI.value)}</b></div>
          </div>
          <table><thead><tr><th>No</th><th>Item</th><th>Qty</th><th>Harga</th><th>Subtotal</th></tr></thead>
          <tbody>${rows}</tbody></table>
          <div class="inv-tot">
            <div class="kv"><span>Subtotal</span><b>${T.rp(calc.subtotal)}</b></div>
            <div class="kv"><span>Diskon (${T.esc(discI.value || '0')}%)</span><b>−${T.rp(calc.diskon)}</b></div>
            <div class="kv"><span>Pajak (${T.esc(taxI.value || '0')}%)</span><b>+${T.rp(calc.pajak)}</b></div>
            <div class="kv inv-grand"><span>TOTAL</span><b>${T.rp(calc.total)}</b></div>
          </div>
        </div>`);
        box.appendChild(inv);
        T.toast('Invoice siap, bisa dicetak atau diunduh');
      }

      function dlHtml() {
        const list = items();
        if (!list.length) { T.toast('Tambah minimal satu item'); return; }
        const calc = utils.invoiceCalc(list, T.num(discI.value) || 0, T.num(taxI.value) || 0);
        const rows = list.map((it, i) =>
          `<tr><td>${i + 1}</td><td>${T.esc(it.nama)}</td><td>${T.fmt(it.qty)}</td><td>${T.rp(it.harga)}</td><td>${T.rp(it.qty * it.harga)}</td></tr>`
        ).join('');
        const html = '<!DOCTYPE html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
          '<title>Invoice ' + T.esc(noI.value) + '</title>' +
          '<style>body{font-family:system-ui,sans-serif;max-width:700px;margin:24px auto;padding:0 16px;color:#111}' +
          'table{width:100%;border-collapse:collapse;margin-top:12px}th,td{border:1px solid #999;padding:8px;text-align:left;font-size:14px}' +
          '.tot{text-align:right;margin-top:12px}.grand{font-size:20px;font-weight:700}</style></head><body>' +
          '<h2>' + T.esc(usahaI.value || 'Nama Usaha') + '</h2>' +
          '<div>No: <b>' + T.esc(noI.value) + '</b> · Tanggal: <b>' + T.esc(tglI.value) + '</b></div>' +
          '<table><thead><tr><th>No</th><th>Item</th><th>Qty</th><th>Harga</th><th>Subtotal</th></tr></thead><tbody>' + rows + '</tbody></table>' +
          '<div class="tot">Subtotal: <b>' + T.rp(calc.subtotal) + '</b><br>' +
          'Diskon: <b>−' + T.rp(calc.diskon) + '</b><br>Pajak: <b>+' + T.rp(calc.pajak) + '</b><br>' +
          '<span class="grand">TOTAL: ' + T.rp(calc.total) + '</span></div>' +
          '</body></html>';
        T.dl((noI.value || 'invoice') + '.html', html, 'text/html;charset=utf-8');
      }

      root.appendChild(T.grid2(T.field('Nama usaha', usahaI), T.field('No. invoice', noI)));
      root.appendChild(T.grid2(T.field('Tanggal', tglI), T.el('<div></div>')));
      root.appendChild(T.el('<b>Item</b>'));
      root.appendChild(itemsWrap);
      root.appendChild(T.btn('＋ Tambah Baris', () => itemsWrap.appendChild(itemRow())));
      root.appendChild(T.grid2(T.field('Diskon (%)', discI), T.field('Pajak (%)', taxI)));
      root.appendChild(T.row(
        T.btn('Tampilkan Invoice', preview, true),
        T.btn('🖨️ Cetak / PDF', () => { preview(); setTimeout(() => window.print(), 150); }),
        T.btn('Unduh HTML', dlHtml)
      ));
      root.appendChild(box);
    
}
