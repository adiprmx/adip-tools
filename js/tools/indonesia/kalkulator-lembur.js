import { h as T, utils, kv } from '../../core.js?v=6.7.0';

export const meta = {"id": "kalkulator-lembur", "name": "Kalkulator Lembur", "cat": "indonesia", "icon": "⏰", "desc": "Hitung upah lembur: jam ke-1 1,5×, jam berikutnya 2×.", "keywords": "lembur,upah,overtime,gaji,kerja,jam,lemburan"};
export function render(root) {

    const inGaji = T.input('text', 'Gaji per bulan (Rp)', '');
    const inJam = T.input('number', 'Total jam lembur', '2');
    const box = T.out();
    const hitung = () => {
      const gaji = T.num(inGaji.value), n = Math.floor(Number(inJam.value));
      if (!(gaji > 0) || !(n > 0)) { T.show(box, '<p class="warn">Isi gaji dan jam lembur dengan angka yang benar ya.</p>'); return; }
      const perJam = gaji / 173;
      let total = 0;
      let html = kv('Upah per jam (gaji ÷ 173)', T.rp(perJam));
      if (n <= 8) {
        for (let i = 1; i <= n; i++) {
          const k = i === 1 ? 1.5 : 2;
          const v = perJam * k;
          total += v;
          html += kv('Jam lembur ke-' + i + ' (' + (i === 1 ? '1,5' : '2') + '×)', T.rp(v));
        }
      } else {
        const v1 = perJam * 1.5, vLain = perJam * 2 * (n - 1);
        total = v1 + vLain;
        html += kv('Jam ke-1 (1,5×)', T.rp(v1)) +
          kv('Jam ke-2 s.d. ke-' + n + ' (2× × ' + (n - 1) + ' jam)', T.rp(vLain));
      }
      html += '<div class="big center" style="margin-top:10px">' + T.rp(total) + '</div>' +
        '<p class="center hint">Total upah lembur</p>' +
        '<p class="hint">Rumus umum: upah/jam = gaji ÷ 173; jam ke-1 1,5×, jam berikutnya 2×. Ketentuan detail bisa beda per perusahaan — cek PP/PKB tempatmu kerja.</p>';
      T.show(box, html);
    };
    root.appendChild(T.grid2(T.field('Gaji per bulan (Rp)', inGaji), T.field('Total jam lembur', inJam)));
    root.appendChild(T.row(T.btn('Hitung lembur', hitung, true)));
    root.appendChild(box);

}
