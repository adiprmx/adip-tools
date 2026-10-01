import { h as T, utils, U, kv, money } from '../../core.js?v=6.3.0';

U.zakatMaal = (harta, hargaEmas) => {
    harta = +harta || 0; hargaEmas = +hargaEmas || 0;
    const nisab = 85 * hargaEmas;
    const wajib = hargaEmas > 0 && harta >= nisab;
    return { nisab, wajib, zakat: wajib ? harta * 0.025 : 0 };
  };

export const meta = {"id": "zakat", "name": "Kalkulator Zakat", "cat": "indonesia", "icon": "🤲", "desc": "Zakat maal & fitrah.", "keywords": "zakat,maal,fitrah,islam"};
export function render(root) {

    const harta = money(null, 'cth: 200000000'), emas = money(null, 'cth: 1400000', '1400000');
    const jiwa = T.input('number', 'cth: 4', '4'), beras = money(null, 'cth: 15000', '15000');
    const box1 = T.out(), box2 = T.out();
    const hitMaal = () => {
      const h = T.num(harta.value), e = T.num(emas.value) || 0;
      if (!(h > 0) || !(e > 0)) { T.show(box1, '<p class="warn">Isi total harta dan harga emas dulu ya.</p>'); return; }
      const u = U.zakatMaal(h, e);
      T.show(box1,
        kv('Nisab (85 gram emas)', T.rp(u.nisab)) +
        kv('Total harta', T.rp(h)) +
        (u.wajib
          ? '<div class="big ok">' + T.rp(u.zakat) + '</div><p class="hint">Hartamu mencapai nisab. Zakat maal = <b>2,5%</b> dari total harta.</p>'
          : '<p class="warn">Belum wajib zakat. Hartamu di bawah nisab (' + T.rp(u.nisab) + ').</p>'));
    };
    const hitFitrah = () => {
      const j = Math.max(1, Math.round(T.num(jiwa.value)) || 1), b = T.num(beras.value) || 0;
      if (!(b > 0)) { T.show(box2, '<p class="warn">Isi harga beras per kg dulu ya.</p>'); return; }
      const total = 2.5 * b * j;
      T.show(box2,
        '<div class="big">' + T.rp(total) + '</div>' +
        kv('Per jiwa', '2,5 kg × ' + T.rp(b) + ' = ' + T.rp(2.5 * b)) +
        kv('Jumlah jiwa', j) +
        '<p class="hint">Zakat fitrah = 2,5 kg beras (atau makanan pokok) per jiwa, dibayar sebelum salat Idulfitri.</p>');
    };
    [harta, emas].forEach((i) => i.addEventListener('input', hitMaal));
    [jiwa, beras].forEach((i) => i.addEventListener('input', hitFitrah));
    root.appendChild(T.el('<h3 style="font-size:15px">Zakat Maal</h3>'));
    root.appendChild(T.grid2(
      T.field('Total harta (Rp)', harta, 'Tabungan, emas, investasi, piutang'),
      T.field('Harga emas / gram', emas)
    ));
    root.appendChild(T.row(T.btn('Hitung zakat maal', hitMaal, true)));
    root.appendChild(box1);
    root.appendChild(T.el('<h3 style="font-size:15px;margin-top:6px">Zakat Fitrah</h3>'));
    root.appendChild(T.grid2(
      T.field('Jumlah jiwa', jiwa),
      T.field('Harga beras / kg', beras)
    ));
    root.appendChild(T.row(T.btn('Hitung zakat fitrah', hitFitrah, true)));
    root.appendChild(box2);
  
}
