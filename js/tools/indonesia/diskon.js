import { h as T, utils, U, kv, money } from '../../core.js?v=6.4.0';

U.diskonBertingkat = (harga, arrDiskon) => {
    let sisa = +harga || 0;
    const tahapan = [];
    (arrDiskon || []).forEach((d) => {
      d = Math.min(100, Math.max(0, +d || 0));
      const potongan = sisa * d / 100;
      sisa -= potongan;
      tahapan.push({ diskon: d, potongan, hargaSetelah: sisa });
    });
    return { tahapan, hargaAkhir: sisa, totalHemat: (+harga || 0) - sisa };
  };

export const meta = {"id": "diskon", "name": "Diskon Bertingkat", "cat": "indonesia", "icon": "💸", "desc": "Hitung diskon berlapis yang benar.", "keywords": "diskon,promo,potongan,belanja"};
export function render(root) {

    const harga = money(null, 'cth: 200000');
    const list = T.el('<div style="display:flex;flex-direction:column;gap:8px"></div>');
    const box = T.out();
    const addRow = (val) => {
      const r = T.el('<div style="display:flex;gap:8px;align-items:center"></div>');
      const inp = T.input('number', 'cth: 50', val == null ? '' : String(val));
      inp.style.flex = '1';
      const del = T.btn('✕', () => { r.remove(); hitung(); });
      r.appendChild(T.el('<span class="mut" style="flex:none">Diskon</span>'));
      r.appendChild(inp); r.appendChild(T.el('<span class="mut">%</span>')); r.appendChild(del);
      inp.addEventListener('input', hitung);
      list.appendChild(r);
    };
    const hitung = () => {
      const h = T.num(harga.value);
      const arr = [...list.querySelectorAll('input')].map((i) => T.num(i.value)).filter((v) => v > 0);
      if (!(h > 0)) { T.hide(box); return; }
      const u = U.diskonBertingkat(h, arr);
      let rows = u.tahapan.map((t, i) =>
        '<tr><td>Tahap ' + (i + 1) + '</td><td>' + T.esc(String(t.diskon)) + '%</td><td>−' + T.rp(t.potongan) + '</td><td><b>' + T.rp(t.hargaSetelah) + '</b></td></tr>').join('');
      T.show(box,
        (u.tahapan.length ? '<table class="tbl"><tr><th></th><th>Diskon</th><th>Hemat</th><th>Harga</th></tr>' + rows + '</table>' : '') +
        '<div class="big" style="margin-top:8px">' + T.rp(u.hargaAkhir) + '</div>' +
        kv('Total hemat', '<span class="ok"><b>' + T.rp(u.totalHemat) + '</b></span>') +
        '<p class="hint">Catatan: diskon ' + (arr.join('% lalu ') || '…') + '% itu <b>tidak</b> sama dengan ' +
        T.esc(String(arr.reduce((a, b) => a + b, 0))) + '%. Contoh: 50% lalu 20% = hemat 60%, bukan 70%, karena diskon kedua dihitung dari harga yang sudah didiskon.</p>');
    };
    addRow(50); addRow(20);
    harga.addEventListener('input', hitung);
    root.appendChild(T.field('Harga awal', harga));
    root.appendChild(T.el('<div class="fld"><label>Diskon berlapis (berurutan)</label></div>'));
    root.appendChild(list);
    root.appendChild(T.row(T.btn('＋ Tambah diskon', () => addRow()), T.btn('Hitung', hitung, true)));
    root.appendChild(box);
  
}
