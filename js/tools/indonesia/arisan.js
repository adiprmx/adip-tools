import { h as T, utils } from '../../core.js?v=5.2.0';

export const meta = {"id": "arisan", "name": "Arisan Picker", "cat": "indonesia", "icon": "🎰", "desc": "Kocok nama anggota arisan.", "keywords": "arisan,kocok,nama,acak"};
export function render(root) {

    const daftar = T.ta(6, 'Satu nama per baris…\ncth:\nBudi\nSari\nAndi');
    const keluarkan = T.el('<label style="display:flex;gap:8px;align-items:center;font-size:14px"><input type="checkbox" checked> Keluarkan pemenang dari daftar (tanpa pengulangan)</label>');
    const box = T.out();
    const riw = T.out();
    const winners = [];
    let anim = null;
    T.onLeave(() => { if (anim) clearInterval(anim); });
    const names = () => daftar.value.split('\n').map((s) => s.trim()).filter(Boolean);
    const kocok = () => {
      const list = names();
      if (list.length < 2) { T.show(box, '<p class="warn">Isi minimal 2 nama dulu ya.</p>'); return; }
      if (anim) clearInterval(anim);
      let n = 0;
      anim = setInterval(() => {
        const pick = list[Math.floor(Math.random() * list.length)];
        T.show(box, '<div class="big center" style="font-size:20px">' + T.esc(pick) + '</div>');
        if (++n > 14) {
          clearInterval(anim); anim = null;
          const win = list[Math.floor(Math.random() * list.length)];
          winners.push(win);
          T.show(box, '<p class="center mut">Pemenangnya…</p><div class="big center ok" style="font-size:30px">' + T.esc(win) + '</div>');
          T.show(riw, '<p class="mut" style="font-size:13px">Riwayat: ' + winners.map(T.esc).join(' → ') + '</p>');
          if (keluarkan.querySelector('input').checked) {
            const rest = names().filter((x) => x !== win);
            daftar.value = rest.join('\n');
            if (!rest.length) T.toast('Semua nama sudah keluar!');
          }
        }
      }, 90);
    };
    root.appendChild(T.field('Daftar nama', daftar));
    root.appendChild(keluarkan);
    root.appendChild(T.row(T.btn('Kocok!', kocok, true)));
    root.appendChild(box);
    root.appendChild(riw);
  
}
