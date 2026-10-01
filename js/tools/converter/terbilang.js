import { h as T, utils } from '../../core.js?v=6.1.1';

(function () {
    const K = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas'];
    function tiga(x) {
      let s = '';
      if (x >= 100) {
        const h = Math.floor(x / 100);
        s += h === 1 ? 'seratus' : K[h] + ' ratus';
        x %= 100;
        if (x) s += ' ';
      }
      if (x >= 20) {
        s += K[Math.floor(x / 10)] + ' puluh';
        x %= 10;
        if (x) s += ' ' + K[x];
      } else if (x >= 12) {
        s += K[x - 10] + ' belas';
      } else if (x === 11) {
        s += 'sebelas';
      } else if (x === 10) {
        s += 'sepuluh';
      } else if (x > 0) {
        s += K[x];
      }
      return s;
    }
    const SAT = ['', 'ribu', 'juta', 'miliar', 'triliun'];
    utils.terbilang = function (n) {
      const neg = Number(n) < 0;
      let x = Math.floor(Math.abs(Number(n)));
      if (!Number.isFinite(x)) return '';
      if (x === 0) return 'nol';
      const bag = [];
      let u = 0;
      while (x > 0) {
        if (u >= SAT.length) return 'angka terlalu besar';
        const g = x % 1000;
        if (g > 0) {
          let kata = tiga(g);
          if (SAT[u]) {
            if (g === 1 && SAT[u] === 'ribu') kata = 'seribu';
            else kata += ' ' + SAT[u];
          }
          bag.unshift(kata);
        }
        x = Math.floor(x / 1000);
        u++;
      }
      return (neg ? 'minus ' : '') + bag.join(' ');
    };
  })();

export const meta = {"id": "terbilang", "name": "Terbilang Indonesia", "cat": "converter", "icon": "💬", "desc": "Angka jadi kata bahasa Indonesia.", "keywords": "terbilang,angka,kata,rupiah"};
export function render(root) {

    const inp = T.input('text', 'Angka, misal: 1500000 atau 1.500.000,50', '1500000');
    inp.inputMode = 'decimal';
    const cRp = T.el('<label class="pick"><input type="checkbox" checked style="width:20px;height:20px"> <span>Tambah kata "rupiah" di akhir</span></label>');
    const cSen = T.el('<label class="pick"><input type="checkbox" checked style="width:20px;height:20px"> <span>Tampilkan sen untuk angka desimal</span></label>');
    const rpBox = cRp.querySelector('input'), senBox = cSen.querySelector('input');
    const out = T.out();
    const go = () => {
      const n = T.num(inp.value);
      if (!Number.isFinite(n)) { T.show(out, '<span class="err">Masukkan angka yang valid.</span>'); return; }
      const neg = n < 0, a = Math.abs(n);
      const bulat = Math.floor(a);
      const sen = Math.round((a - bulat) * 100);
      let kata = utils.terbilang(neg ? -bulat : bulat);
      if (kata === 'angka terlalu besar') { T.show(out, '<span class="err">Angka terlalu besar (maksimal 999 triliun).</span>'); return; }
      if (rpBox.checked) kata += ' rupiah';
      if (sen > 0 && senBox.checked) kata += ' ' + utils.terbilang(sen) + ' sen';
      else if (sen > 0) kata += ' koma ' + String(sen).split('').map((d) => utils.terbilang(+d)).join(' ');
      T.show(out,
        '<div class="kv"><span class="k">Terbilang</span></div>' +
        '<div class="big" style="font-size:20px;line-height:1.5;text-transform:capitalize">' + T.esc(kata) + '</div>');
      out.appendChild(T.row(T.btn('Salin', () => T.copy(kata), true)));
    };
    inp.addEventListener('input', go);
    [rpBox, senBox].forEach((b) => b.addEventListener('change', go));
    root.appendChild(T.field('Angka', inp, 'Boleh pakai format Indonesia: 1.500.000,50'));
    root.appendChild(cRp);
    root.appendChild(cSen);
    root.appendChild(out);
    go();
  
}
