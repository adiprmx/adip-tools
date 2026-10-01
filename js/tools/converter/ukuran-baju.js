import { h as T, utils } from '../../core.js?v=6.7.0';

export const meta = {"id": "ukuran-baju", "name": "Ukuran Baju", "cat": "converter", "icon": "👕", "desc": "Konversi ukuran baju internasional.", "keywords": "baju,ukuran,size,pakaian"};
export function render(root) {

    // Patokan umum kaos/baju pria. US/UK = angka lingkar dada (inci), EU = angka konfeksi.
    const DATA = {
      XS:  { us: '32–34', eu: '44–46', jp: 'S',  dada: [84, 89] },
      S:   { us: '34–36', eu: '46–48', jp: 'M',  dada: [90, 95] },
      M:   { us: '38–40', eu: '48–50', jp: 'L',  dada: [96, 101] },
      L:   { us: '42–44', eu: '50–52', jp: 'LL', dada: [102, 107] },
      XL:  { us: '46–48', eu: '52–54', jp: '3L', dada: [108, 113] },
      XXL: { us: '50–52', eu: '54–56', jp: '4L', dada: [114, 119] },
    };
    const URUT = Object.keys(DATA);
    const modeSel = T.select([['pilih', 'Pilih ukuran'], ['dada', 'Dari lingkar dada (cm)']], 'pilih');
    const sizeSel = T.select(URUT.map((k) => [k, k]), 'M');
    const sizeWrap = T.el('<div></div>');
    sizeWrap.appendChild(T.field('Ukuran', sizeSel));
    const dadaInp = T.input('number', 'Lingkar dada dalam cm, misal: 98', 98);
    const out = T.out();
    const dadaWrap = T.el('<div></div>');

    const inci = (cm) => Math.round((cm / 2.54) * 10) / 10;
    const tampil = (k) => {
      const d = DATA[k];
      const kv = (a, b) => '<div class="kv"><span class="k">' + T.esc(a) + '</span><span class="v">' + T.esc(b) + '</span></div>';
      return '<div class="kv"><span class="k">Ukuran</span><span class="v big">' + T.esc(k) + '</span></div>' +
        kv('US / UK', d.us) + kv('EU', d.eu) + kv('Jepang', d.jp) +
        kv('Lingkar dada', d.dada[0] + '–' + d.dada[1] + ' cm') +
        kv('Lingkar dada', inci(d.dada[0]) + '–' + inci(d.dada[1]) + ' inci') +
        '<div class="hint" style="margin-top:8px">Ukur melingkar di bagian dada paling penuh, meteran tetap horizontal. Patokan umum — tiap merek/negara bisa beda.</div>';
    };
    const hitung = () => {
      const dariDada = modeSel.value === 'dada';
      sizeWrap.hidden = dariDada;
      dadaWrap.hidden = !dariDada;
      if (!dariDada) {
        T.show(out, tampil(sizeSel.value));
        return;
      }
      const v = T.num(dadaInp.value);
      if (!Number.isFinite(v) || v <= 0) { T.hide(out); return; }
      let best = URUT[0], bd = Infinity;
      URUT.forEach((k) => {
        const d = DATA[k].dada;
        const tengah = (d[0] + d[1]) / 2;
        const dd = Math.abs(tengah - v);
        if (dd < bd) { bd = dd; best = k; }
      });
      const d = DATA[best].dada;
      const diDalam = v >= d[0] && v <= d[1];
      T.show(out,
        '<div class="hint" style="margin-bottom:8px">' + (diDalam ? 'Lingkar dadamu masuk rentang ini:' : 'Angkanya di luar rentang standar — ini yang paling mendekati:') + '</div>' +
        tampil(best));
    };
    modeSel.addEventListener('change', hitung);
    sizeSel.addEventListener('change', hitung);
    dadaInp.addEventListener('input', hitung);
    dadaWrap.appendChild(T.field('Lingkar dadamu (cm)', dadaInp));
    dadaWrap.hidden = true;
    root.appendChild(T.field('Cara cari', modeSel));
    root.appendChild(sizeWrap);
    root.appendChild(dadaWrap);
    root.appendChild(out);
    hitung();

}
