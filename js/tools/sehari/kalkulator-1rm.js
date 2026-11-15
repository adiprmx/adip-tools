import { h as T, kv } from '../../core.js?v=6.12.0';

// Rumus one-rep max (1RM) dari beban + repetisi:
// - Brzycki (1993): W / (1.0278 - 0.0278 x R)
// - Epley (1985): W x (1 + R / 30)
// - Landers (1985): 100 x W / (101.3 - 2.67123 x R)
// Akurat untuk 1-10 repetisi; di atas itu hasilnya makin meleset.
const NOTE = '<p class="hint">Ini perkiraan umum, bukan pengganti saran dokter.</p>';

export const meta = {"id": "kalkulator-1rm", "name": "Kalkulator 1RM", "cat": "sehari", "icon": "🏋️", "desc": "Perkiraan beban maksimal sekali angkat (1RM) dari beban dan repetisi.", "keywords": "1rm,one rep max,brzycki,epley,landers,beban,angkat beban,gym", "since": "6.11.0"};
export function render(root) {

    const beban = T.input('text', 'Beban yang diangkat, cth: 100', '100');
    beban.inputMode = 'decimal';
    const reps = T.input('text', 'Repetisi, cth: 5', '5');
    reps.inputMode = 'numeric';
    const box = T.out();

    const calc = () => {
      const w = T.num(beban.value);
      const r = T.num(reps.value);
      if (!(w > 0) || !(r > 0) || !Number.isInteger(r)) {
        T.show(box, '<span class="err">Isi beban dengan angka dan repetisi dengan angka bulat.</span>');
        return;
      }
      if (r > 10) {
        T.show(box, '<span class="err">Rumus ini akurat untuk 1-10 repetisi. Di atas 10 repetisi, hasilnya tidak bisa dipercaya.</span>');
        return;
      }
      const brzycki = w / (1.0278 - 0.0278 * r);
      const epley = w * (1 + r / 30);
      const landers = 100 * w / (101.3 - 2.67123 * r);
      const rata = (brzycki + epley + landers) / 3;
      const pct = [95, 90, 85, 80, 75, 70, 65, 60];
      let tabel = '';
      for (const p of pct) {
        tabel += kv(p + '% dari 1RM', (rata * p / 100).toFixed(1) + ' kg');
      }
      T.show(box,
        '<div class="center"><div class="dim">Perkiraan 1RM (rata-rata 3 rumus)</div>' +
        '<div class="big">' + rata.toFixed(1) + ' kg</div>' +
        '<div class="hint">Dari ' + w + ' kg x ' + r + ' repetisi</div></div>' +
        kv('Brzycki', brzycki.toFixed(1) + ' kg') +
        kv('Epley', epley.toFixed(1) + ' kg') +
        kv('Landers', landers.toFixed(1) + ' kg') +
        '<div class="dim" style="margin-top:12px">Beban latihan dari persen 1RM</div>' +
        tabel +
        '<p class="hint">1RM itu beban paling berat yang bisa diangkat sekali. Tiga rumus ini hasilnya sedikit beda, jadi rata-ratanya dipakai sebagai patokan. ' +
        'Jangan coba angkat 1RM sendirian tanpa spotter atau pengaman. Hasil paling akurat didapat dari repetisi 2-6.</p>' +
        NOTE);
    };

    root.appendChild(T.el('<p class="note">Berapa beban maksimal yang bisa kamu angkat sekali? Masukkan beban dan repetisi terbaikmu, rumusnya yang memperkirakan.</p>'));
    root.appendChild(T.grid2(
      T.field('Beban (kg)', beban),
      T.field('Repetisi', reps),
    ));
    root.appendChild(T.btn('Hitung', calc, true));
    root.appendChild(box);
    calc();

}
