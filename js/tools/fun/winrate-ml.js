import { h as T, kv } from '../../core.js';

export const meta = {"id": "winrate-ml", "name": "Kalkulator Winrate", "cat": "fun", "icon": "🎮", "desc": "Berapa win beruntun biar WR-mu nyentuh target? Free Fire, Mobile Legends, atau game lain.", "keywords": "winrate,ff,free fire,ml,mobile legends,wr,target,win beruntun,kalkulator"};

/* Logika murni (bisa diuji tanpa DOM).
   Mode persen: total match (int 1–10jt), current = WR sekarang dalam
   persen, boleh desimal (0–100), target (0 < target <= 100).
   Mode win: total match (int 1–10jt), wins = total win (int 0–total).
   Return: { state:'need'|'done'|'impossible', needed, current, projected } */
export function calcWinrate(total, current, target) {
    total = Number(total); current = Number(current); target = Number(target);
    if (!Number.isFinite(total)) throw new Error('Total match-nya tidak benar.');
    if (!Number.isFinite(current)) throw new Error('WR sekarang tidak benar.');
    if (!Number.isFinite(target)) throw new Error('Target WR tidak benar.');
    if (!Number.isInteger(total) || total < 1 || total > 10000000)
        throw new Error('Total match harus angka bulat 1–10.000.000');
    if (current < 0 || current > 100)
        throw new Error('WR sekarang harus 0–100');
    if (target <= 0 || target > 100)
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

export function calcWinrateByWins(total, wins, target) {
    if (!Number.isInteger(total) || total < 1 || total > 10000000)
        throw new Error('Total match harus angka bulat 1–10.000.000');
    if (!Number.isInteger(wins) || wins < 0 || wins > total)
        throw new Error('Total win harus angka bulat 0 sampai total match');
    if (!isFinite(target) || target <= 0 || target > 100)
        throw new Error('Target winrate harus lebih dari 0 sampai 100');
    const current = wins / total * 100;
    if (target <= current)
        return { state: 'done', needed: 0, current, projected: current };
    if (target >= 100)
        return { state: 'impossible', needed: null, current, projected: current };
    const t = target / 100;
    let needed = Math.ceil(((t * total) - wins) / (1 - t));
    if (!isFinite(needed) || needed < 0) needed = 0;
    return { state: 'need', needed, current, projected: (wins + needed) / (total + needed) * 100 };
}

export function render(root) {

    const gameSel = T.select([
      ['ml', 'Mobile Legends'],
      ['ff', 'Free Fire'],
      ['lain', 'Game lain'],
    ], 'ml');
    const modeSel = T.select([
      ['persen', 'WR sekarang (%) — dari profil game'],
      ['win', 'Total win (angka)'],
    ], 'persen');
    const totalI = T.input('number', 'Cth: 500', '');
    totalI.inputMode = 'numeric';
    const currentI = T.input('number', 'Cth: 52.5', '');
    currentI.inputMode = 'decimal';
    const winI = T.input('number', 'Cth: 85', '');
    winI.inputMode = 'numeric';
    const targetI = T.input('number', 'Cth: 60', '');
    targetI.inputMode = 'decimal';
    const box = T.out();
    const noteBox = T.out();

    const modeBox = T.el('<div></div>');
    const paintMode = () => {
      modeBox.innerHTML = '';
      if (modeSel.value === 'persen') modeBox.appendChild(T.field('WR sekarang (%)', currentI, 'Winrate kamu saat ini, boleh desimal (cth: 52.5).'));
      else modeBox.appendChild(T.field('Total win', winI, 'Berapa match yang kamu menangkan dari total itu.'));
    };
    const paintNote = () => {
      const g = gameSel.value;
      T.show(noteBox, '<p class="hint">' + (g === 'ff'
        ? 'Replika panel kalkulator winrate dari FF Tools. Panel lain (cek pemain, statistik, ban, stalk) butuh API game yang tidak resmi & tidak bisa jalan murni dari browser — jadi tidak direplika.'
        : g === 'ml'
        ? 'Replika panel kalkulator winrate dari ML Tools. Panel lain (cari script hero, stalk akun) butuh API game yang tidak resmi & tidak bisa jalan murni dari browser — jadi tidak direplika.'
        : 'Rumusnya sama untuk semua game: berapa win beruntun yang dibutuhkan supaya WR mencapai target.') + '</p>');
    };
    modeSel.addEventListener('change', paintMode);
    gameSel.addEventListener('change', paintNote);
    paintMode();
    paintNote();

    const hitung = () => {
        let r;
        try {
            if (modeSel.value === 'persen') r = calcWinrate(Number(totalI.value), Number(currentI.value), Number(targetI.value));
            else r = calcWinrateByWins(Number(totalI.value), Number(winI.value), Number(targetI.value));
        } catch (e) { T.toast(e.message); return; }
        const target = Number(targetI.value);
        let big, sub, cls = '';
        if (r.state === 'done') {
            big = '0'; cls = 'ok';
            sub = 'Target sudah tercapai — WR kamu sekarang ' + r.current.toFixed(2) + '%.';
        } else if (r.state === 'impossible') {
            big = '∞'; cls = 'err';
            sub = 'Target 100% nggak bisa dicapai selama masih ada kekalahan di riwayat match.';
        } else {
            big = String(r.needed);
            sub = 'Butuh ' + r.needed + ' win beruntun • ' + r.current.toFixed(2) + '% → ' + r.projected.toFixed(2) + '%.';
        }
        T.show(box,
            '<div class="center"><div class="big ' + cls + '">' + big + '</div></div>' +
            kv('WR sekarang', r.current.toFixed(2) + '%') +
            kv('Target WR', target + '%') +
            '<p class="hint">' + T.esc(sub) + '</p>');
    };

    root.appendChild(T.el('<p class="note">Mau push rank tapi WR anjlok? Hitung dulu butuh berapa <b>win beruntun</b> buat nyentuh target WR-mu. 100% ngitung di HP, tanpa internet, tanpa login.</p>'));
    root.appendChild(T.grid2(T.field('Game', gameSel), T.field('Cara isi data', modeSel)));
    root.appendChild(T.field('Total match', totalI, 'Semua match yang sudah kamu mainkan (1–10.000.000).'));
    root.appendChild(modeBox);
    root.appendChild(T.field('Target WR (%)', targetI, 'Target winrate yang pengin dicapai.'));
    root.appendChild(T.row(T.btn('Hitung', hitung, true)));
    root.appendChild(box);
    root.appendChild(noteBox);

}
