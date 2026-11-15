import { h as T, utils, kv } from '../../core.js?v=6.12.0';

export const meta = {"id": "denda-spt", "name": "Denda Telat Lapor SPT", "cat": "indonesia", "icon": "📄", "desc": "Hitung denda + bunga telat lapor SPT Tahunan.", "keywords": "denda,spt,pajak,spt tahunan,telat lapor,bunga,djp"};
export function render(root) {

    const inWp = T.select([['op', 'Orang Pribadi'], ['badan', 'Badan']], 'op');
    const inBln = T.input('number', 'Telat berapa bulan', '1');
    const inPajak = T.input('text', 'Pajak terutang (Rp, boleh 0)', '0');
    // Suku bunga acuan BI — bisa diubah user; default 5,75% (RDG 20–21 Okt 2026,
    // masih berlaku Nov 2026). Bunga = (BI Rate + 5%) / 12 per bulan.
    const inBi = T.input('text', 'cth: 5,75', '5,75');
    inBi.inputMode = 'decimal';
    const box = T.out();
    const hitung = () => {
      const bln = Math.floor(Number(inBln.value));
      const terutang = T.num(inPajak.value);
      const bi = T.num(inBi.value);
      if (!(bln >= 0) || !(terutang >= 0) || !(bi >= 0)) { T.show(box, '<p class="warn">Isi bulan, pajak terutang, dan suku bunga BI dengan angka yang benar ya.</p>'); return; }
      const blnHitung = Math.min(bln, 24);
      const bungaPersen = (bi + 5) / 12;
      const denda = inWp.value === 'badan' ? 1000000 : 100000;
      const bunga = (bungaPersen / 100) * blnHitung * terutang;
      const total = denda + bunga;
      T.show(box,
        kv('Denda telat lapor', T.rp(denda)) +
        kv('Bunga (' + bungaPersen.toFixed(2).replace('.', ',') + '%/bln × ' + blnHitung + ' bln)', T.rp(bunga)) +
        '<div class="big center" style="margin-top:10px">' + T.rp(total) + '</div>' +
        '<p class="center hint">Total sanksi</p>' +
        '<p class="hint">Denda Orang Pribadi Rp100rb / Badan Rp1jt. Bunga = (suku bunga acuan BI + 5%) ÷ 12 per bulan, maksimal 24 bulan — dengan BI Rate 5,75% jadi ±0,90%/bulan. Tarif resmi tiap bulan ditetapkan lewat KMK, jadi angka pastinya cek di pajak.go.id ya.</p>');
    };
    root.appendChild(T.field('Wajib Pajak', inWp));
    root.appendChild(T.grid2(T.field('Keterlambatan (bulan)', inBln), T.field('Pajak terutang (Rp)', inPajak)));
    root.appendChild(T.field('Suku bunga acuan BI (% per tahun)', inBi, 'Default 5,75% (Nov 2026) — ubah bila BI Rate sudah berubah.'));
    root.appendChild(T.row(T.btn('Hitung denda', hitung, true)));
    root.appendChild(box);

}
