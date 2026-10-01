import { h as T, utils, U, money } from '../../core.js?v=6.6.0';

U.cicilanFlat = (pokok, bungaTahunanPct, bulan) => {
    pokok = +pokok || 0; bulan = Math.max(1, Math.round(+bulan) || 1);
    const totalBunga = pokok * (+bungaTahunanPct || 0) / 100 * (bulan / 12);
    const totalBayar = pokok + totalBunga;
    return { perBulan: totalBayar / bulan, totalBunga, totalBayar };
  };

U.cicilanAnuitas = (pokok, bungaTahunanPct, bulan) => {
    pokok = +pokok || 0; bulan = Math.max(1, Math.round(+bulan) || 1);
    const r = (+bungaTahunanPct || 0) / 100 / 12;
    const perBulan = r > 0 ? (pokok * r) / (1 - Math.pow(1 + r, -bulan)) : pokok / bulan;
    const totalBayar = perBulan * bulan;
    return { perBulan, totalBunga: totalBayar - pokok, totalBayar };
  };

export const meta = {"id": "cicilan", "name": "Kalkulator Cicilan", "cat": "indonesia", "icon": "🏍️", "desc": "Simulasi cicilan flat & anuitas.", "keywords": "cicilan,kredit,motor,angsuran"};
export function render(root) {

    const pokok = money(null, 'cth: 20000000'), bunga = money(null, 'cth: 12', '12'), tenor = T.input('number', 'cth: 12', '12');
    const box = T.out();
    const hitung = () => {
      const p = T.num(pokok.value), r = T.num(bunga.value) || 0, n = Math.max(1, Math.round(T.num(tenor.value)) || 1);
      if (!(p > 0)) { T.show(box, '<p class="warn">Isi jumlah pinjaman dulu ya.</p>'); return; }
      const f = U.cicilanFlat(p, r, n), a = U.cicilanAnuitas(p, r, n);
      const murah = f.totalBayar <= a.totalBayar ? 'flat' : 'anuitas';
      T.show(box,
        '<table class="tbl"><tr><th></th><th>Flat</th><th>Anuitas</th></tr>' +
        '<tr><td>Cicilan/bulan</td><td><b>' + T.rp(f.perBulan) + '</b></td><td><b>' + T.rp(a.perBulan) + '</b></td></tr>' +
        '<tr><td>Total bunga</td><td>' + T.rp(f.totalBunga) + '</td><td>' + T.rp(a.totalBunga) + '</td></tr>' +
        '<tr><td>Total bayar</td><td>' + T.rp(f.totalBayar) + '</td><td>' + T.rp(a.totalBayar) + '</td></tr></table>' +
        '<p class="hint">Flat: bunga dihitung dari pokok awal setiap bulan (cicilan tetap). Anuitas: porsi bunga menyusut, pokok membesar (cicilan tetap). ' +
        'Untuk simulasi ini yang totalnya lebih ringan adalah metode <b>' + murah + '</b>.</p>');
    };
    [pokok, bunga, tenor].forEach((i) => i.addEventListener('input', hitung));
    root.appendChild(T.grid2(
      T.field('Pokok pinjaman', pokok),
      T.field('Bunga (%/tahun)', bunga),
      T.field('Tenor (bulan)', tenor)
    ));
    root.appendChild(T.row(T.btn('Hitung', hitung, true)));
    root.appendChild(box);
  
}
