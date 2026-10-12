import { h as T, kv } from '../../core.js?v=6.9.20';

export const meta = {"id": "winrate-ml", "name": "Kalkulator Winrate ML", "cat": "fun", "icon": "⚔️", "desc": "Berapa win beruntun biar WR Mobile Legends-mu nyentuh target?", "keywords": "winrate,ml,mobile legends,wr,target,win beruntun,kalkulator"};

/* Logika murni (bisa diuji tanpa DOM).
   total: match yang sudah dimainkan (int 1–10jt)
   current: WR sekarang dalam persen, boleh desimal (0–100)
   target: target WR dalam persen (0 < target <= 100)
   Return: { state:'need'|'done'|'impossible', needed, current, projected } */
export function calcWinrate(total, current, target) {
    if (!Number.isInteger(total) || total < 1 || total > 10000000)
        throw new Error('Total match harus bilangan bulat 1–10.000.000');
    if (!isFinite(current) || current < 0 || current > 100)
        throw new Error('WR sekarang harus 0–100');
    if (!isFinite(target) || target <= 0 || target > 100)
        throw new Error('Target WR harus lebih dari 0 sampai 100');
    if (target <= current)
        return { state: 'done', needed: 0, current, projected: current };
    if (target >= 100)
        return { state: 'impossible', needed: null, current, projected: current };
    const c = current / 100, t = target / 100;
    const curWins = total * c;
    let needed = Math.ceil(((t * total) - curWins) / (1 - t));
    if (!isFinite(needed) || needed < 0) needed = 0;
    return { state: 'need', needed, current, projected: ((curWins + needed) / (total + needed)) * 100 };
}

export function render(root) {

    const totalI = T.input('number', 'Cth: 500', '');
    totalI.inputMode = 'numeric';
    const currentI = T.input('number', 'Cth: 52.5', '');
    currentI.inputMode = 'decimal';
    const targetI = T.input('number', 'Cth: 60', '');
    targetI.inputMode = 'decimal';
    const box = T.out();

    const hitung = () => {
        let r;
        try {
            r = calcWinrate(Number(totalI.value), Number(currentI.value), Number(targetI.value));
        } catch (e) { T.toast(e.message); return; }
        const target = Number(targetI.value);
        let big, sub, cls = '';
        if (r.state === 'done') {
            big = '0'; cls = 'ok';
            sub = 'Target sudah tercapai — tidak perlu kemenangan tambahan.';
        } else if (r.state === 'impossible') {
            big = '∞'; cls = 'err';
            sub = 'Target 100% nggak bisa dicapai selama WR sekarang belum 100%.';
        } else {
            big = String(r.needed);
            sub = 'Butuh sekitar ' + r.needed + ' kemenangan beruntun. Proyeksi WR: ' + r.projected.toFixed(2) + '%.';
        }
        T.show(box,
            '<div class="center"><div class="big ' + cls + '">' + big + '</div></div>' +
            kv('WR sekarang', r.current + '%') +
            kv('Target WR', target + '%') +
            '<p class="hint">' + T.esc(sub) + '</p>');
    };

    root.appendChild(T.el('<p class="note">WR turun abis lose streak? Hitung dulu butuh berapa <b>win beruntun</b> buat balikin ke target. 100% ngitung di HP, tanpa internet, tanpa login.</p>'));
    root.appendChild(T.field('Total match', totalI, 'Semua match yang sudah kamu mainkan (1–10.000.000).'));
    root.appendChild(T.field('WR sekarang (%)', currentI, 'Winrate kamu saat ini, boleh desimal (cth: 52.5).'));
    root.appendChild(T.field('Target WR (%)', targetI, 'Target winrate yang pengin dicapai.'));
    root.appendChild(T.row(T.btn('Hitung', hitung, true)));
    root.appendChild(box);
    root.appendChild(T.el('<p class="hint">Replika panel kalkulator winrate dari ML Tools. Panel lain (cari script hero, stalk akun) butuh API game yang tidak resmi & tidak bisa jalan murni dari browser — jadi tidak direplika.</p>'));

}
