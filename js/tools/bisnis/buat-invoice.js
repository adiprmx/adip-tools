import { h as T, utils, kv } from '../../core.js?v=6.4.0';

export const meta = {"id": "buat-invoice", "name": "Buat Invoice", "cat": "bisnis", "icon": "🧮", "desc": "Invoice usaha: item dinamis, PPN 11% opsional, preview siap cetak.", "keywords": "invoice,buat invoice,nota,tagihan,ppn 11%,klien,cetak"};

let _printCssDone = false;

function ensurePrintCss() {
  if (_printCssDone) return;
  _printCssDone = true;
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
}

export function render(root) {

    ensurePrintCss();

    const usahaI = T.input('text', 'Nama usaha kamu', '');
    const alamatI = T.input('text', 'Alamat usaha', '');
    const klienI = T.input('text', 'Nama klien / pelanggan', '');
    const noI = T.input('text', 'No. invoice', 'INV-' + Date.now().toString().slice(-6));
    const ppnTgl = T.input('checkbox', '');
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
          (items.length > 1 ? '<button class="btn" data-del="' + i + '" style="flex-shrink:0">✕</button>' : '') +
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
      const ppn = ppnTgl.checked ? sub * 0.11 : 0;
      const total = sub + ppn;
      const usaha = usahaI.value.trim() || '(nama usaha)';
      const alamat = alamatI.value.trim();
      const klien = klienI.value.trim() || '(nama klien)';
      const no = noI.value.trim();

      T.show(box,
        kv('Subtotal', T.rp(sub)) +
        kv('PPN 11%', ppnTgl.checked ? T.rp(ppn) : '— (tidak dipakai)') +
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
        '<div style="text-align:right"><b>Tanggal:</b><br/>' + T.esc(new Date().toLocaleDateString('id-ID')) + '</div></div>' +
        '<table><tr><th>Deskripsi</th><th class="num">Qty</th><th class="num">Harga</th><th class="num">Jumlah</th></tr>' +
        itemRows +
        '</table>' +
        '<div class="tot">Subtotal: <b>' + T.rp(sub) + '</b><br/>' +
        (ppnTgl.checked ? 'PPN 11%: <b>' + T.rp(ppn) + '</b><br/>' : '') +
        '<span style="font-size:18px">Grand Total: <b>' + T.rp(total) + '</b></span></div>' +
        '<p style="margin-top:24px">Terima kasih atas kerja samanya 🙏</p>' +
        '</div>' +
        '<div style="margin-top:12px"><button class="btn primary">🖨️ Cetak invoice</button></div>');
      previewBox.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => window.print()));
    };

    [usahaI, alamatI, klienI, noI].forEach((el) => el.addEventListener('input', hitung));
    ppnTgl.addEventListener('change', hitung);

    const ppnRow = document.createElement('div');
    ppnRow.className = 'kv';
    ppnRow.innerHTML = '<span class="k">Tambah PPN 11%</span>';
    ppnRow.appendChild(ppnTgl);

    root.appendChild(T.el('<p class="note">Invoice rapi buat pelanggan: isi data usaha & klien, tambah item sesukamu, atur PPN 11% bila perlu — lalu cetak.</p>'));
    root.appendChild(T.field('Nama usaha', usahaI));
    root.appendChild(T.field('Alamat usaha', alamatI));
    root.appendChild(T.field('Nama klien / pelanggan', klienI));
    root.appendChild(T.field('No. invoice', noI));
    root.appendChild(T.el('<p class="note" style="margin-top:12px"><b>Item:</b></p>'));
    root.appendChild(itemsBox);
    root.appendChild(ppnRow);
    root.appendChild(box);
    root.appendChild(previewBox);
    renderItems();
    hitung();

}
