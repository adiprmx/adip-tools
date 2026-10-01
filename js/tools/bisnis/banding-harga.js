import { h as T, utils } from '../../core.js?v=6.1.1';

const UNIT_BASE = { mg: ['berat', 0.001], g: ['berat', 1], kg: ['berat', 1000], ml: ['volume', 1], l: ['volume', 1000], pcs: ['satuan', 1] };

utils.bandingHarga = function (a, b) {
    function norm(p) {
      const u = String(p.satuan || 'g').toLowerCase();
      const info = UNIT_BASE[u] || ['satuan', 1];
      return { jenis: info[0], perBase: (Number(p.harga) || 0) / ((Number(p.isi) || 0) * info[1] || 1) };
    }
    const na = norm(a), nb = norm(b);
    const sebanding = na.jenis === nb.jenis && isFinite(na.perBase) && isFinite(nb.perBase) && na.perBase > 0 && nb.perBase > 0;
    let winner = -1, selisihPct = 0;
    if (sebanding) {
      winner = na.perBase <= nb.perBase ? 0 : 1;
      selisihPct = (Math.abs(na.perBase - nb.perBase) / Math.min(na.perBase, nb.perBase)) * 100;
    }
    return { a: na, b: nb, sebanding, winner, selisihPct };
  };

export const meta = {"id": "banding-harga", "name": "Perbandingan Harga", "cat": "bisnis", "icon": "⚖️", "desc": "Mana lebih hemat per unit?", "keywords": "banding,harga,murah,hemat,unit,belanja"};
export function render(root) {

      function prodCard(label, dflt) {
        const nama = T.input('text', 'Nama produk', dflt.nama);
        const harga = T.input('text', 'Harga (Rp)', dflt.harga);
        const isi = T.input('text', 'Isi', dflt.isi);
        const sat = T.select([['g', 'gram (g)'], ['kg', 'kilogram (kg)'], ['mg', 'miligram (mg)'], ['ml', 'mililiter (ml)'], ['l', 'liter (L)'], ['pcs', 'pcs']], dflt.sat);
        const card = T.el('<div class="card"></div>');
        card.appendChild(T.el(`<b>${label}</b>`));
        card.appendChild(T.field('Nama', nama));
        card.appendChild(T.field('Harga (Rp)', harga));
        card.appendChild(T.grid2(T.field('Isi', isi), T.field('Satuan', sat)));
        card._get = () => ({ nama: nama.value, harga: T.num(harga.value), isi: T.num(isi.value), satuan: sat.value });
        return card;
      }
      const pA = prodCard('Produk A', { nama: 'Beras A', harga: '60000', isi: '5', sat: 'kg' });
      const pB = prodCard('Produk B', { nama: 'Beras B', harga: '35000', isi: '2.5', sat: 'kg' });
      const box = T.out();

      function calc() {
        const a = pA._get(), b = pB._get();
        if (!a.harga || !a.isi || !b.harga || !b.isi) { T.toast('Isi harga & isi kedua produk'); return; }
        const r = utils.bandingHarga(a, b);
        const unitName = r.a.jenis === 'berat' ? 'gram' : r.a.jenis === 'volume' ? 'ml' : 'pcs';
        let html =
          `<div class="kv"><span>${T.esc(a.nama || 'A')} /${unitName}</span><b>${T.rp(r.a.perBase)}</b></div>` +
          `<div class="kv"><span>${T.esc(b.nama || 'B')} /${unitName}</span><b>${T.rp(r.b.perBase)}</b></div>`;
        if (r.sebanding) {
          const win = r.winner === 0 ? (a.nama || 'Produk A') : (b.nama || 'Produk B');
          html += `<div class="kv"><span>🏆 Lebih hemat</span><b>${T.esc(win)}</b></div>` +
            `<div class="kv"><span>Selisih</span><b>${r.selisihPct.toFixed(1)}% lebih murah per unit</b></div>`;
        } else {
          html += `<div class="hint">⚠️ Satuannya beda jenis (berat vs volume), jadi tidak bisa dibandingkan langsung. Harga per unit di atas tetap bisa dilihat.</div>`;
        }
        T.show(box, html);
      }

      root.appendChild(pA);
      root.appendChild(pB);
      root.appendChild(T.btn('Bandingkan', calc, true));
      root.appendChild(box);
    
}
