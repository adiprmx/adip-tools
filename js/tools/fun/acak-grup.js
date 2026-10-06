import { h as T } from '../../core.js?v=6.9.5';

export const meta = {"id": "acak-grup", "name": "Pembagi Grup Acak", "cat": "fun", "icon": "👥", "desc": "Bagi daftar nama jadi beberapa grup acak.", "keywords": "grup,acak,kelompok,bagi,random", "file": "tools/fun/acak-grup.js"};
export function render(root) {
  const daftar = T.ta(6, 'Satu nama per baris…\ncth:\nBudi\nSari\nAndi\nDewi\nRudi\nTono');
  const mode = T.select([['count', 'Jumlah grup'], ['size', 'Anggota per grup']], 'count');
  const angka = T.input('number', 'cth: 3', '3');
  angka.min = '1';
  const box = T.out();
  let anim = null;
  T.onLeave(() => { if (anim) clearInterval(anim); });

  const names = () => daftar.value.split('\n').map((s) => s.trim()).filter(Boolean);
  const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const tampil = (groups) => {
    T.show(box, '');
    let teks = '';
    groups.forEach((g, i) => {
      const label = 'Grup ' + (i + 1);
      teks += label + ':\n' + g.map((n) => '- ' + n).join('\n') + '\n\n';
      const card = T.el('<div class="out" style="margin-bottom:10px"><p class="mut" style="font-size:12px;margin:0 0 6px"></p><p style="font-size:14px;line-height:1.7;margin:0"></p></div>');
      card.querySelector('p:first-child').textContent = label + ' (' + g.length + ' orang)';
      card.querySelector('p:nth-child(2)').textContent = g.join(', ');
      box.appendChild(card);
    });
    box.appendChild(T.row(T.copyBtn(() => teks.trim(), 'Salin Hasil')));
  };

  const bagi = () => {
    const list = names();
    if (list.length < 2) { T.show(box, '<p class="warn">Isi minimal 2 nama dulu ya.</p>'); return; }
    let n = T.num(angka.value);
    if (!n || n < 1) { T.toast('Masukkan angka yang valid'); angka.focus(); return; }
    n = Math.floor(n);
    if (anim) clearInterval(anim);
    let tick = 0;
    anim = setInterval(() => {
      const peek = shuffle(list).slice(0, Math.min(6, list.length));
      T.show(box, '<div class="big center" style="font-size:16px">' + peek.map(T.esc).join(' · ') + '</div>');
      if (++tick > 12) {
        clearInterval(anim); anim = null;
        const acak = shuffle(list);
        const groups = [];
        if (mode.value === 'count') {
          const g = Math.min(n, acak.length);
          for (let i = 0; i < g; i++) groups.push([]);
          acak.forEach((nm, i) => groups[i % g].push(nm));
        } else {
          for (let i = 0; i < acak.length; i += n) groups.push(acak.slice(i, i + n));
        }
        tampil(groups);
      }
    }, 90);
  };

  root.appendChild(T.field('Daftar nama', daftar));
  root.appendChild(T.field('Mode pembagian', mode));
  root.appendChild(T.field('Angka', angka));
  root.appendChild(T.row(T.btn('Bagi!', bagi, true)));
  root.appendChild(box);
}
