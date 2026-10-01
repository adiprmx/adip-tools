import { h as T, utils, kv } from '../../core.js?v=6.6.0';

export const meta = {"id": "denda-spt", "name": "Denda Telat Lapor SPT", "cat": "indonesia", "icon": "📄", "desc": "Hitung denda + bunga telat lapor SPT Tahunan.", "keywords": "denda,spt,pajak,spt tahunan,telat lapor,bunga,djp"};
export function render(root) {

    const inWp = T.select([['op', 'Orang Pribadi'], ['badan', 'Badan']], 'op');
    const inBln = T.input('number', 'Telat berapa bulan', '1');
    const inPajak = T.input('text', 'Pajak terutang (Rp, boleh 0)', '0');
    const box = T.out();
    const hitung = () => {
      const bln = Math.floor(Number(inBln.value));
      const terutang = T.num(inPajak.value);
      if (!(bln >= 0) || !(terutang >= 0)) { T.show(box, '<p class="warn">Isi bulan dan pajak terutang dengan angka yang benar ya.</p>'); return; }
      const denda = inWp.value === 'badan' ? 1000000 : 100000;
      const bunga = 0.02 * bln * terutang;
      const total = denda + bunga;
      T.show(box,
        kv('Denda telat lapor', T.rp(denda)) +
        kv('Bunga (2%/bln × ' + bln + ' bln)', T.rp(bunga)) +
        '<div class="big center" style="margin-top:10px">' + T.rp(total) + '</div>' +
        '<p class="center hint">Total sanksi</p>' +
        '<p class="hint">Angka ilustrasi: denda Orang Pribadi Rp100rb / Badan Rp1jt + bunga 2% per bulan dari pajak terutang. Cek aturan resmi DJP untuk kepastiannya.</p>');
    };
    root.appendChild(T.field('Wajib Pajak', inWp));
    root.appendChild(T.grid2(T.field('Keterlambatan (bulan)', inBln), T.field('Pajak terutang (Rp)', inPajak)));
    root.appendChild(T.row(T.btn('Hitung denda', hitung, true)));
    root.appendChild(box);

}
