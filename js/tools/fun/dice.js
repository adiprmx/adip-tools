import { h as T, utils } from '../../core.js?v=5.0.1';

export const meta = {"id": "dice", "name": "Dadu", "cat": "fun", "icon": "🎲", "desc": "Lempar dadu + riwayat."};

export function render(root) {

    const jumlah = T.select([['1', '1 dadu'], ['2', '2 dadu'], ['3', '3 dadu'], ['4', '4 dadu'], ['5', '5 dadu'], ['6', '6 dadu']], '2');
    const sisi = T.select([['4', 'd4'], ['6', 'd6'], ['8', 'd8'], ['10', 'd10'], ['12', 'd12'], ['20', 'd20']], '6');
    const box = T.out();
    const riwBox = T.out();
    const riwayat = [];
    const lempar = () => {
      const n = Number(jumlah.value), s = Number(sisi.value);
      const hasil = [];
      for (let i = 0; i < n; i++) hasil.push(1 + Math.floor(Math.random() * s));
      const total = hasil.reduce((a, b) => a + b, 0);
      T.show(box,
        '<div class="center"><div class="dim">' + n + 'd' + s + '</div><div class="big">' + hasil.join(' · ') + '</div>' +
        '<div class="info">Total: <b>' + total + '</b></div></div>');
      riwayat.unshift({ n, s, hasil, total });
      if (riwayat.length > 20) riwayat.pop();
      T.show(riwBox, '<div class="dim" style="margin-bottom:6px">Riwayat lemparan</div>' +
        riwayat.map((r) => '<div class="kv"><span class="k">' + r.n + 'd' + r.s + '</span><span class="v">' + r.hasil.join(', ') + ' = <b>' + r.total + '</b></span></div>').join(''));
      T.beep(520, 0.12, 'square');
    };
    root.appendChild(T.grid2(T.field('Jumlah dadu', jumlah), T.field('Sisi dadu', sisi)));
    root.appendChild(T.btn('Lempar', lempar, true));
    root.appendChild(box);
    root.appendChild(riwBox);
    T.hide(riwBox);
  
}
