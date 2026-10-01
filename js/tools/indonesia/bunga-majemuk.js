import { h as T, utils, kv, money } from '../../core.js?v=6.5.0';

export const meta = {"id": "bunga-majemuk", "name": "Bunga Majemuk", "cat": "indonesia", "icon": "📈", "desc": "Simulasi compound interest.", "keywords": "bunga,majemuk,investasi,compound"};
export function render(root) {

    const modal = money(null, 'cth: 10000000'), setor = money(null, 'cth: 1000000', '0'),
      bunga = money(null, 'cth: 8', '8'), tahun = T.input('number', 'cth: 10', '10');
    const freq = T.select([['12', 'Bulanan'], ['4', 'Kuartalan'], ['2', 'Semesteran'], ['1', 'Tahunan']], '12');
    const box = T.out();
    const hitung = () => {
      const P = T.num(modal.value) || 0, PMT = T.num(setor.value) || 0,
        r = (T.num(bunga.value) || 0) / 100, Y = Math.max(1, Math.round(T.num(tahun.value)) || 1), n = +freq.value;
      if (!(P > 0 || PMT > 0) || !(r >= 0)) { T.show(box, '<p class="warn">Isi modal awal atau setoran bulanan dulu ya.</p>'); return; }
      const i = r / n, N = Y * n;
      const fvSetor = (bulan) => {
        const per = N / Y; // periode compounding per tahun
        let bal = P, m = 0;
        const rows = [];
        for (let y = 1; y <= bulan; y++) {
          for (let k = 0; k < per; k++) { bal *= (1 + i); m++; if (m <= N) bal += PMT * (12 / n); }
          rows.push({ y, bal });
        }
        return rows;
      };
      const rows = fvSetor(Y);
      const akhir = rows[rows.length - 1].bal;
      const totalSetor = P + PMT * 12 * Y;
      T.show(box,
        '<div class="big">' + T.rp(akhir) + '</div>' +
        kv('Total setoran', T.rp(totalSetor)) +
        kv('Total bunga', '<span class="ok"><b>' + T.rp(akhir - totalSetor) + '</b></span>') +
        '<table class="tbl" style="margin-top:8px"><tr><th>Tahun</th><th>Saldo akhir</th></tr>' +
        rows.map((x) => '<tr><td>' + x.y + '</td><td>' + T.rp(x.bal) + '</td></tr>').join('') + '</table>' +
        '<p class="hint">Setoran bulanan dibagi rata ke tiap periode compounding. Ini simulasi, hasil investasi asli bisa naik-turun.</p>');
    };
    [modal, setor, bunga, tahun].forEach((x) => x.addEventListener('input', hitung));
    freq.addEventListener('change', hitung);
    root.appendChild(T.grid2(
      T.field('Modal awal', modal),
      T.field('Setoran / bulan', setor, 'Opsional, boleh 0'),
      T.field('Bunga (%/tahun)', bunga),
      T.field('Durasi (tahun)', tahun)
    ));
    root.appendChild(T.field('Frekuensi compounding', freq));
    root.appendChild(T.row(T.btn('Hitung', hitung, true)));
    root.appendChild(box);
  
}
