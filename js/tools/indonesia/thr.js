import { h as T, utils, U, money } from '../../core.js?v=5.0.1';

U.hitungTHR = (gaji, bulanKerja) => {
    gaji = +gaji || 0; bulanKerja = +bulanKerja || 0;
    return bulanKerja >= 12 ? gaji : (gaji * bulanKerja) / 12;
  };

export const meta = {"id": "thr", "name": "Kalkulator THR", "cat": "indonesia", "icon": "🧧", "desc": "THR proporsional sesuai masa kerja."};

export function render(root) {

    const gaji = money(null, 'cth: 5000000'), bulan = T.input('number', 'cth: 8', '12');
    const box = T.out();
    const hitung = () => {
      const g = T.num(gaji.value), bl = Math.max(0, T.num(bulan.value) || 0);
      if (!(g > 0)) { T.show(box, '<p class="warn">Isi gaji satu bulan dulu ya.</p>'); return; }
      const thr = U.hitungTHR(g, bl);
      T.show(box,
        '<div class="big">' + T.rp(thr) + '</div>' +
        '<p class="hint">' + (bl >= 12
          ? 'Masa kerja ' + bl + ' bulan (≥ 12 bulan) → berhak atas <b>1× gaji</b> sebulan penuh.'
          : 'Masa kerja ' + bl + ' bulan (&lt; 12 bulan) → THR proporsional: <b>(' + bl + ' ÷ 12) × ' + T.rp(g) + '</b>.') +
        '</p><p class="hint">Acuan umum: pekerja dengan masa kerja 1 bulan+ berhak atas THR Keagamaan. Konsultasikan ke HRD untuk kebijakan kantormu.</p>');
    };
    [gaji, bulan].forEach((i) => i.addEventListener('input', hitung));
    root.appendChild(T.grid2(
      T.field('Gaji 1 bulan', gaji, 'Gaji pokok + tunjangan tetap'),
      T.field('Masa kerja (bulan)', bulan)
    ));
    root.appendChild(T.row(T.btn('Hitung THR', hitung, true)));
    root.appendChild(box);
  
}
