import { h as T, utils, kv } from '../../core.js';

utils.invoiceCalc = function (items, discPct, taxPct) {
    let sub = 0;
    (items || []).forEach((it) => { sub += (Number(it.qty) || 0) * (Number(it.harga) || 0); });
    const disc = sub * (Number(discPct) || 0) / 100;
    const afterDisc = sub - disc;
    const tax = afterDisc * (Number(taxPct) || 0) / 100;
    return { subtotal: sub, diskon: disc, pajak: tax, total: afterDisc + tax };
  };

export const meta = {"id": "buat-invoice", "name": "Invoice Usaha dengan PPN", "cat": "bisnis", "icon": "🧮", "desc": "Invoice usaha: item dinamis, diskon, PPN opsional, data klien, preview siap cetak + unduh HTML.", "keywords": "invoice,buat invoice,nota,tagihan,ppn 11%,klien,cetak,diskon,pajak,kwitansi"};

/* <style> print disimpan referensinya supaya bisa DIHAPUS saat tool
   ditinggal (T.onLeave di render). Kalau menetap di <head>, aturan
   body *{visibility:hidden} bikin cetakan tool lain jadi blank. */
let _printCss = null;

function ensurePrintCss() {
  if (_printCss) return;
  const st = document.createElement('style');
  st.textContent =
    '@media print{' +
    'body *{visibility:hidden !important}' +
    '#binvoice-print,#binvoice-print *{visibility:visible !important}' +
    '#binvoice-print{position:absolute;inset:0;background:#fff;color:#000;padding:24px}' +
    '#binvoice-print h2{margin:0 0 2px}' +
    '#binvoice-print .cols{display:flex;justify-content:space-between;margin:16px 0}' +
    '#binvoice-print table{width:100%;border-collapse:collapse}' +
    '#binvoice-print th,#binvoice-print td{border:1px solid #666;padding:8px;text-align:left;font-size:14px}' +
    '#binvoice-print td.num,#binvoice-print th.num{text-align:right}' +
    '#binvoice-print .tot{text-align:right;margin-top:12px;font-size:15px}' +
    '}';
  document.head.appendChild(st);
  _printCss = st;
}

function hapusPrintCss() {
  if (_printCss) { _printCss.remove(); _printCss = null; }
}

export function render(root) {

    ensurePrintCss();
    T.onLeave(hapusPrintCss);

    const usahaI = T.input('text', 'Nama usaha kamu', '');
    const alamatI = T.input('text', 'Alamat usaha', '');
    const klienI = T.input('text', 'Nama klien / pelanggan', '');
    const noI = T.input('text', 'No. invoice', 'INV-' + Date.now().toString().slice(-6));
    const tglI = T.input('date', '');
    tglI.value = new Date().toISOString().slice(0, 10);
    const discI = T.input('text', 'Diskon %', '0');
    discI.inputMode = 'decimal';
    const ppnTgl = T.input('checkbox', '');
    // Persen PPN bisa diubah user; default 11% = tarif efektif barang/jasa
    // biasa (12% × DPP nilai lain 11/12, PMK 131/2024).
    const ppnPersenI = T.input('text', '11', '11');
    ppnPersenI.inputMode = 'decimal';
    ppnPersenI.style.maxWidth = '70px';
    const box = T.out();
    const itemsBox = T.out();
    const previewBox = T.out();

    let items = [{ desc: '', qty: '', harga: '' }];

    const renderItems = () => {
      T.show(itemsBox,
        items.map((r, i) =>
          '<div style="display:flex;gap:8px;margin-bottom:8px;align-items:center">' +
          '<input class="inp" data-k="desc" data-i="' + i + '" placeholder="Deskripsi item" value="' + T.esc(r.desc) + '" style="flex:3"/>' +
          '<input class="inp" data-k="qty" data-i="' + i + '" placeholder="Qty" value="' + T.esc(r.qty) + '" inputmode="decimal" style="flex:1"/>' +
          '<input class="inp" data-k="harga" data-i="' + i + '" placeholder="Harga @ Rp" value="' + T.esc(r.harga) + '" inputmode="decimal" style="flex:1.5"/>' +
          (items.length > 1 ? '<button class="btn" data-del="' + i + '" aria-label="Hapus item ' + (i + 1) + '" style="flex-shrink:0">✕</button>' : '') +
          '</div>').join('') +
        '<button class="btn" data-add="1">＋ Tambah item</button>');
      itemsBox.querySelectorAll('input[data-k]').forEach((el) => {
        el.addEventListener('input', () => {
          items[Number(el.dataset.i)][el.dataset.k] = el.value;
          hitung();
        });
      });
      itemsBox.querySelector('[data-add]').addEventListener('click', () => {
        items.push({ desc: '', qty: '', harga: '' });
        renderItems();
        hitung();
      });
      itemsBox.querySelectorAll('[data-del]').forEach((b) => {
        b.addEventListener('click', () => {
          items.splice(Number(b.dataset.del), 1);
          renderItems();
          hitung();
        });
      });
    };

    const hitung = () => {
      const valid = items.filter((r) => String(r.desc).trim() && (T.num(r.qty) || 0) > 0 && (T.num(r.harga) || 0) > 0);
      const sub = valid.reduce((a, r) => a + (T.num(r.qty) || 0) * (T.num(r.harga) || 0), 0);
      const discPct = T.num(discI.value) || 0;
      const ppnPersen = T.num(ppnPersenI.value) || 0;
      // Diskon dulu, baru PPN dihitung dari harga setelah diskon.
      const calc = utils.invoiceCalc(valid.map((r) => ({ qty: T.num(r.qty) || 0, harga: T.num(r.harga) || 0 })), discPct, ppnTgl.checked ? ppnPersen : 0);
      const diskon = calc.diskon;
      const ppn = calc.pajak;
      const total = calc.total;
      const usaha = usahaI.value.trim() || '(nama usaha)';
      const alamat = alamatI.value.trim();
      const klien = klienI.value.trim() || '(nama klien)';
      const no = noI.value.trim();
      const tgl = tglI.value || new Date().toISOString().slice(0, 10);

      T.show(box,
        kv('Subtotal', T.rp(sub)) +
        kv('Diskon ' + T.esc(String(discPct)) + '%', diskon > 0 ? '−' + T.rp(diskon) : '— (tidak ada)') +
        kv('PPN ' + T.esc(String(ppnPersen)) + '%', ppnTgl.checked ? T.rp(ppn) : '— (tidak dipakai)') +
        '<div class="kv total"><span class="k"><b>Grand total</b></span><span class="v"><b>' + T.rp(total) + '</b></span></div>');

      const itemRows = valid.map((r) => {
        const line = (T.num(r.qty) || 0) * (T.num(r.harga) || 0);
        return '<tr><td>' + T.esc(r.desc) + '</td><td class="num">' + T.esc(r.qty) + '</td>' +
          '<td class="num">' + T.rp(T.num(r.harga)) + '</td><td class="num">' + T.rp(line) + '</td></tr>';
      }).join('');

      T.show(previewBox,
        '<div id="binvoice-print">' +
        '<h2>INVOICE</h2>' +
        '<p><b>' + T.esc(usaha) + '</b>' + (alamat ? '<br/>' + T.esc(alamat) : '') +
        '<br/>No: ' + T.esc(no) + '</p>' +
        '<div class="cols"><div><b>Tagihan untuk:</b><br/>' + T.esc(klien) + '</div>' +
        '<div style="text-align:right"><b>Tanggal:</b><br/>' + T.esc(new Date(tgl + 'T00:00:00').toLocaleDateString('id-ID')) + '</div></div>' +
        '<table><tr><th>Deskripsi</th><th class="num">Qty</th><th class="num">Harga</th><th class="num">Jumlah</th></tr>' +
        itemRows +
        '</table>' +
        '<div class="tot">Subtotal: <b>' + T.rp(sub) + '</b><br/>' +
        (diskon > 0 ? 'Diskon ' + T.esc(String(discPct)) + '%: <b>−' + T.rp(diskon) + '</b><br/>' : '') +
        (ppnTgl.checked ? 'PPN ' + T.esc(String(ppnPersen)) + '%: <b>' + T.rp(ppn) + '</b><br/>' : '') +
        '<span style="font-size:18px">Grand Total: <b>' + T.rp(total) + '</b></span></div>' +
        '<p style="margin-top:24px">Terima kasih atas kerja samanya 🙏</p>' +
        '</div>' +
        '<div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap"><button class="btn primary" data-aksi="cetak">🖨️ Cetak invoice</button><button class="btn" data-aksi="unduh">Unduh HTML</button></div>');
      previewBox.querySelector('[data-aksi="cetak"]').addEventListener('click', () => window.print());
      previewBox.querySelector('[data-aksi="unduh"]').addEventListener('click', dlHtml);
    };

    const dlHtml = () => {
      const valid = items.filter((r) => String(r.desc).trim() && (T.num(r.qty) || 0) > 0 && (T.num(r.harga) || 0) > 0);
      if (!valid.length) { T.toast('Tambah minimal satu item'); return; }
      const discPct = T.num(discI.value) || 0;
      const ppnPersen = T.num(ppnPersenI.value) || 0;
      const calc = utils.invoiceCalc(valid.map((r) => ({ qty: T.num(r.qty) || 0, harga: T.num(r.harga) || 0 })), discPct, ppnTgl.checked ? ppnPersen : 0);
      const rows = valid.map((r, i) => {
        const line = (T.num(r.qty) || 0) * (T.num(r.harga) || 0);
        return '<tr><td>' + (i + 1) + '</td><td>' + T.esc(r.desc) + '</td><td>' + T.fmt(T.num(r.qty) || 0) + '</td><td>' + T.rp(T.num(r.harga) || 0) + '</td><td>' + T.rp(line) + '</td></tr>';
      }).join('');
      const usaha = usahaI.value.trim() || 'Nama Usaha';
      const alamat = alamatI.value.trim();
      const klien = klienI.value.trim() || '(nama klien)';
      const no = noI.value.trim() || 'invoice';
      const tgl = tglI.value || new Date().toISOString().slice(0, 10);
      const html = '<!DOCTYPE html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
        '<title>Invoice ' + T.esc(no) + '</title>' +
        '<style>body{font-family:system-ui,sans-serif;max-width:700px;margin:24px auto;padding:0 16px;color:#111}' +
        'table{width:100%;border-collapse:collapse;margin-top:12px}th,td{border:1px solid #999;padding:8px;text-align:left;font-size:14px}' +
        '.tot{text-align:right;margin-top:12px}.grand{font-size:20px;font-weight:700}</style></head><body>' +
        '<h2>INVOICE</h2><h3>' + T.esc(usaha) + '</h3>' +
        (alamat ? '<div>' + T.esc(alamat) + '</div>' : '') +
        '<div>No: <b>' + T.esc(no) + '</b> · Tanggal: <b>' + T.esc(tgl) + '</b></div>' +
        '<div>Tagihan untuk: <b>' + T.esc(klien) + '</b></div>' +
        '<table><thead><tr><th>No</th><th>Deskripsi</th><th>Qty</th><th>Harga</th><th>Jumlah</th></tr></thead><tbody>' + rows + '</tbody></table>' +
        '<div class="tot">Subtotal: <b>' + T.rp(calc.subtotal) + '</b><br>' +
        (calc.diskon > 0 ? 'Diskon: <b>−' + T.rp(calc.diskon) + '</b><br>' : '') +
        (ppnTgl.checked ? 'PPN ' + T.esc(String(ppnPersen)) + '%: <b>+' + T.rp(calc.pajak) + '</b><br>' : '') +
        '<span class="grand">TOTAL: ' + T.rp(calc.total) + '</span></div>' +
        '</body></html>';
      T.dl(no + '.html', html, 'text/html;charset=utf-8');
    };

    [usahaI, alamatI, klienI, noI, tglI, discI].forEach((el) => el.addEventListener('input', hitung));
    ppnTgl.addEventListener('change', hitung);
    ppnPersenI.addEventListener('input', hitung);

    const ppnRow = document.createElement('div');
    ppnRow.className = 'kv';
    ppnRow.innerHTML = '<span class="k">Tambah PPN</span>';
    const ppnCtl = document.createElement('span');
    ppnCtl.style.display = 'flex';
    ppnCtl.style.gap = '8px';
    ppnCtl.style.alignItems = 'center';
    ppnCtl.appendChild(ppnTgl);
    ppnCtl.appendChild(ppnPersenI);
    const pctLabel = document.createElement('span');
    pctLabel.textContent = '%';
    ppnCtl.appendChild(pctLabel);
    ppnRow.appendChild(ppnCtl);

    root.appendChild(T.el('<p class="note">Invoice rapi buat pelanggan: isi data usaha & klien, tambah item sesukamu, atur diskon dan PPN bila perlu — lalu cetak atau unduh.</p>'));
    root.appendChild(T.field('Nama usaha', usahaI));
    root.appendChild(T.field('Alamat usaha', alamatI));
    root.appendChild(T.field('Nama klien / pelanggan', klienI));
    root.appendChild(T.grid2(T.field('No. invoice', noI), T.field('Tanggal', tglI)));
    root.appendChild(T.el('<p class="note" style="margin-top:12px"><b>Item:</b></p>'));
    root.appendChild(itemsBox);
    root.appendChild(T.field('Diskon (%)', discI, 'Diskon dipotong dari subtotal sebelum PPN.'));
    root.appendChild(ppnRow);
    root.appendChild(T.el('<p class="hint">PPN 11% adalah tarif efektif untuk barang/jasa biasa — tarif nominalnya 12%, tapi dihitung dari DPP nilai lain 11/12 × harga (PMK 131/2024). Ubah angka % di atas bila barangmu kena tarif lain.</p>'));
    root.appendChild(box);
    root.appendChild(previewBox);
    renderItems();
    hitung();

}
