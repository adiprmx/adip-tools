import { h as T, utils, kv } from '../../core.js?v=6.7.0';

export const meta = {"id": "slip-gaji", "name": "Slip Gaji", "cat": "bisnis", "icon": "🧾", "desc": "Bikin slip gaji rapi: gaji, tunjangan, potongan — siap cetak.", "keywords": "slip gaji,payroll,gaji karyawan,tunjangan,potongan,cetak gaji"};

let _printCssDone = false;

function ensurePrintCss() {
  if (_printCssDone) return;
  _printCssDone = true;
  const st = document.createElement('style');
  st.textContent =
    '@media print{' +
    'body *{visibility:hidden !important}' +
    '#slipgaji-print,#slipgaji-print *{visibility:visible !important}' +
    '#slipgaji-print{position:absolute;inset:0;background:#fff;color:#000;padding:24px}' +
    '#slipgaji-print h2{margin:0 0 4px}' +
    '#slipgaji-print table{width:100%;border-collapse:collapse;margin:12px 0}' +
    '#slipgaji-print th,#slipgaji-print td{border:1px solid #666;padding:8px;text-align:left;font-size:14px}' +
    '#slipgaji-print td.num{text-align:right}' +
    '#slipgaji-print .sig{display:flex;justify-content:space-between;margin-top:40px}' +
    '#slipgaji-print .sig div{text-align:center;width:40%}' +
    '}';
  document.head.appendChild(st);
}

export function render(root) {

    ensurePrintCss();

    const namaI = T.input('text', 'Nama karyawan', '');
    const periodeI = T.input('text', 'Periode (cth: Oktober 2026)', '');
    const box = T.out();
    const rowsBox = T.out();
    const previewBox = T.out();

    let rows = [{ nama: 'Gaji pokok', jumlah: '', tipe: 'plus' }];

    const renderRows = () => {
      T.show(rowsBox,
        rows.map((r, i) =>
          '<div style="display:flex;gap:8px;margin-bottom:8px;align-items:center">' +
          '<input class="inp" data-k="nama" data-i="' + i + '" placeholder="cth: Tunjangan makan" value="' + T.esc(r.nama) + '" style="flex:2"/>' +
          '<input class="inp" data-k="jumlah" data-i="' + i + '" placeholder="Rp" value="' + T.esc(r.jumlah) + '" inputmode="decimal" style="flex:1"/>' +
          '<select data-k="tipe" data-i="' + i + '" class="inp" style="flex:1">' +
          '<option value="plus"' + (r.tipe === 'plus' ? ' selected' : '') + '>＋ Pemasukan</option>' +
          '<option value="minus"' + (r.tipe === 'minus' ? ' selected' : '') + '>− Potongan</option>' +
          '</select>' +
          (rows.length > 1 ? '<button class="btn" data-del="' + i + '" style="flex-shrink:0">✕</button>' : '') +
          '</div>').join('') +
        '<button class="btn" data-add="1">＋ Tambah baris</button>');
      rowsBox.querySelectorAll('input[data-k],select[data-k]').forEach((el) => {
        el.addEventListener('input', () => {
          rows[Number(el.dataset.i)][el.dataset.k] = el.value;
          hitung();
        });
      });
      rowsBox.querySelector('[data-add]').addEventListener('click', () => {
        rows.push({ nama: '', jumlah: '', tipe: 'plus' });
        renderRows();
        hitung();
      });
      rowsBox.querySelectorAll('[data-del]').forEach((b) => {
        b.addEventListener('click', () => {
          rows.splice(Number(b.dataset.del), 1);
          renderRows();
          hitung();
        });
      });
    };

    const hitung = () => {
      const valid = rows.filter((r) => String(r.nama).trim() && (T.num(r.jumlah) || 0) > 0);
      const plus = valid.filter((r) => r.tipe === 'plus');
      const minus = valid.filter((r) => r.tipe === 'minus');
      const totPlus = plus.reduce((a, r) => a + (T.num(r.jumlah) || 0), 0);
      const totMinus = minus.reduce((a, r) => a + (T.num(r.jumlah) || 0), 0);
      const bersih = totPlus - totMinus;

      const baris = (label, arr, sign) => arr.map((r) =>
        kv(T.esc(r.nama), (sign === '-' ? '− ' : '') + T.rp(T.num(r.jumlah)))
      ).join('');
      const nama = namaI.value.trim() || '(nama karyawan)';
      const periode = periodeI.value.trim() || '(periode)';

      T.show(box,
        '<p class="note"><b>Ringkasan:</b></p>' +
        baris('', plus, '+') + baris('', minus, '-') +
        kv('Total pemasukan', T.rp(totPlus)) +
        kv('Total potongan', T.rp(totMinus)) +
        '<div class="kv total"><span class="k"><b>Gaji bersih diterima</b></span><span class="v"><b>' + T.rp(bersih) + '</b></span></div>');

      const printRows = valid.map((r) =>
        '<tr><td>' + T.esc(r.nama) + '</td><td>' + (r.tipe === 'minus' ? 'Potongan' : 'Pemasukan') + '</td>' +
        '<td class="num">' + (r.tipe === 'minus' ? '− ' : '') + T.rp(T.num(r.jumlah)) + '</td></tr>'
      ).join('');

      T.show(previewBox,
        '<div id="slipgaji-print">' +
        '<h2>SLIP GAJI</h2>' +
        '<p>Nama: <b>' + T.esc(nama) + '</b><br/>Periode: <b>' + T.esc(periode) + '</b></p>' +
        '<table><tr><th>Komponen</th><th>Tipe</th><th style="text-align:right">Jumlah</th></tr>' +
        printRows +
        '<tr><td colspan="2"><b>Total pemasukan</b></td><td class="num"><b>' + T.rp(totPlus) + '</b></td></tr>' +
        '<tr><td colspan="2"><b>Total potongan</b></td><td class="num"><b>− ' + T.rp(totMinus) + '</b></td></tr>' +
        '<tr><td colspan="2"><b>GAJI BERSIH</b></td><td class="num"><b>' + T.rp(bersih) + '</b></td></tr>' +
        '</table>' +
        '<div class="sig"><div>HRD<br/><br/><br/>(............)</div>' +
        '<div>Karyawan<br/><br/><br/>(............)</div></div>' +
        '</div>' +
        '<div style="margin-top:12px">' + T.btn('🖨️ Cetak slip', () => window.print(), true).outerHTML + '</div>');

      previewBox.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => window.print()));
    };

    [namaI, periodeI].forEach((el) => el.addEventListener('input', hitung));

    root.appendChild(T.el('<p class="note">Buat slip gaji karyawan dalam 1 menit: isi nama, periode, lalu tambah baris gaji, tunjangan, dan potongan sesuka kamu.</p>'));
    root.appendChild(T.field('Nama karyawan', namaI));
    root.appendChild(T.field('Periode', periodeI));
    root.appendChild(T.el('<p class="note" style="margin-top:12px"><b>Komponen gaji:</b></p>'));
    root.appendChild(rowsBox);
    root.appendChild(box);
    root.appendChild(previewBox);
    renderRows();
    hitung();

}
