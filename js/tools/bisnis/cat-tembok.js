import { h as T, utils } from '../../core.js?v=6.6.0';

utils.catTembok = function (p, l, t, lapis, dayaSebar, kurangBukaan) {
    p = T.num(p); l = T.num(l); t = T.num(t);
    lapis = T.num(lapis) || 0; dayaSebar = T.num(dayaSebar) || 0; kurangBukaan = T.num(kurangBukaan) || 0;
    let luas = 2 * (p + l) * t - kurangBukaan;
    if (!isFinite(luas) || luas < 0) luas = 0;
    let liter = 0;
    if (dayaSebar > 0) liter = (luas * lapis) / dayaSebar;
    return { luas: Math.round(luas * 100) / 100, liter: Math.round(liter * 100) / 100 };
  };

export const meta = {"id": "cat-tembok", "name": "Kalkulator Cat", "cat": "bisnis", "icon": "🪣", "desc": "Kebutuhan cat dari luas ruangan.", "keywords": "cat,tembok,dinding,ruangan,renovasi"};
export function render(root) {

      const pI = T.input('text', 'Panjang (m)', '4');
      const lI = T.input('text', 'Lebar (m)', '3');
      const tI = T.input('text', 'Tinggi (m)', '3');
      const lapisI = T.input('text', 'Jumlah lapis', '2');
      const dayaI = T.input('text', 'Daya sebar (m²/liter)', '10');
      const bukaanI = T.input('text', 'Pintu/jendela (m²)', '2');
      const box = T.out();

      function saranKemasan(liter) {
        if (liter <= 0) return '-';
        const sizes = [5, 2.5, 1];
        let sisa = liter;
        const parts = [];
        for (const s of sizes) {
          const n = Math.floor(sisa / s);
          if (n > 0) { parts.push(n + '× ' + s + 'L'); sisa -= n * s; }
        }
        if (sisa > 0.001) parts.push('1× 1L');
        return parts.join(' + ') + ` <span class="hint">(cukup untuk ${liter.toFixed(1)} L)</span>`;
      }

      function calc() {
        const r = utils.catTembok(pI.value, lI.value, tI.value, lapisI.value, dayaI.value, bukaanI.value);
        if (r.luas <= 0) { T.toast('Cek ukuran ruangan, luas dinding nol'); return; }
        T.show(box,
          `<div class="kv"><span>Luas dinding dicat</span><b>${r.luas} m²</b></div>` +
          `<div class="kv"><span>Kebutuhan cat</span><b>${r.liter.toFixed(1)} liter</b></div>` +
          `<div class="kv"><span>Saran kemasan</span><b>${saranKemasan(r.liter)}</b></div>` +
          `<div class="hint">Hitung: 2×(panjang+lebar)×tinggi − bukaan, × lapis ÷ daya sebar. Beli dilebihkan sedikit buat cadangan.</div>`);
      }

      root.appendChild(T.el('<p class="note">Untuk dinding ruangan (4 sisi). Plafon/langit-langit tidak dihitung.</p>'));
      root.appendChild(T.grid2(T.field('Panjang (m)', pI), T.field('Lebar (m)', lI)));
      root.appendChild(T.grid2(T.field('Tinggi (m)', tI), T.field('Jumlah lapis', lapisI)));
      root.appendChild(T.grid2(
        T.field('Daya sebar (m²/liter)', dayaI, 'Cek label kaleng, umumnya 8-12.'),
        T.field('Kurangi pintu/jendela (m²)', bukaanI, 'Total luas bukaan.')
      ));
      root.appendChild(T.btn('Hitung', calc, true));
      root.appendChild(box);
    
}
