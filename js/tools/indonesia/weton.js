import { h as T, utils, U, kv } from '../../core.js?v=6.0.1';

U.weton = (yyyy, mm, dd) => {
    const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const PASARAN = ['Legi', 'Pahing', 'Pon', 'Wage', 'Kliwon'];
    const NEPTU_H = { Senin: 4, Selasa: 3, Rabu: 7, Kamis: 8, Jumat: 6, Sabtu: 9, Minggu: 5 };
    const NEPTU_P = { Legi: 5, Pahing: 9, Pon: 7, Wage: 4, Kliwon: 8 };
    const t = Date.UTC(+yyyy, +mm - 1, +dd);
    if (isNaN(t)) return null;
    const anchor = Date.UTC(1945, 7, 17);
    const diff = Math.round((t - anchor) / 86400000);
    const pasaran = PASARAN[(((diff % 5) + 5) % 5)];
    const hari = HARI[new Date(t).getUTCDay()];
    const neptuHari = NEPTU_H[hari];
    const neptuPasaran = NEPTU_P[pasaran];
    return { hari, pasaran, weton: hari + ' ' + pasaran, neptuHari, neptuPasaran, neptuTotal: neptuHari + neptuPasaran };
  };

export const meta = {"id": "weton", "name": "Weton Jawa", "cat": "indonesia", "icon": "🗓️", "desc": "Hitung weton & pasaran dari tanggal lahir.", "keywords": "weton,jawa,pasaran,lahir,primbon"};
export function render(root) {

    const tgl = T.input('date');
    tgl.value = new Date().toISOString().slice(0, 10);
    const box = T.out();
    const hitung = () => {
      if (!tgl.value) { T.show(box, '<p class="warn">Pilih tanggal dulu ya.</p>'); return; }
      const [y, m, d] = tgl.value.split('-').map(Number);
      const u = U.weton(y, m, d);
      if (!u) { T.show(box, '<p class="err">Tanggal tidak valid.</p>'); return; }
      T.show(box,
        '<div class="big center">' + T.esc(u.weton) + '</div>' +
        kv('Hari', T.esc(u.hari) + ' <span class="mut">(neptu ' + u.neptuHari + ')</span>') +
        kv('Pasaran', T.esc(u.pasaran) + ' <span class="mut">(neptu ' + u.neptuPasaran + ')</span>') +
        kv('Total neptu', '<b>' + u.neptuTotal + '</b>') +
        '<p class="hint">Dihitung dari patokan 17 Agustus 1945 = Jumat Legi. Neptu: Senin 4, Selasa 3, Rabu 7, Kamis 8, Jumat 6, Sabtu 9, Minggu 5; Legi 5, Pahing 9, Pon 7, Wage 4, Kliwon 8.</p>');
    };
    tgl.addEventListener('change', hitung);
    root.appendChild(T.field('Tanggal lahir', tgl));
    root.appendChild(T.row(T.btn('Hitung weton', hitung, true)));
    root.appendChild(box);
    hitung();
  
}
