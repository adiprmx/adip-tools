import { h as T, utils } from '../../core.js';

utils.catTembok = function (p, l, t, lapis, dayaSebar, kurangBukaan) {
    p = T.num(p); l = T.num(l); t = T.num(t);
    lapis = T.num(lapis) || 0; dayaSebar = T.num(dayaSebar) || 0; kurangBukaan = T.num(kurangBukaan) || 0;
    let luas = 2 * (p + l) * t - kurangBukaan;
    if (!isFinite(luas) || luas < 0) luas = 0;
    let liter = 0;
    if (dayaSebar > 0) liter = (luas * lapis) / dayaSebar;
    return { luas: Math.round(luas * 100) / 100, liter: Math.round(liter * 100) / 100 };
  };

export const meta = {"id": "cat-tembok", "name": "Kalkulator Cat", "cat": "rumah", "icon": "🪣", "desc": "Kebutuhan cat dari luas ruangan.", "keywords": "cat,tembok,dinding,ruangan,renovasi"};

// Kemasan cat yang dijual (liter). Urutan tidak penting: pencarian di bawah
// mencoba semua kombinasi.
export const UKURAN_KEMASAN = [5, 2.5, 1];

// Cari kombinasi kemasan paling hemat: total liter paling kecil yang masih
// mencukupi kebutuhan; bila seri, yang kalengnya paling sedikit.
// (Greedy lama salah di sini: 2,6L disarankan 1×2,5L + 1×1L = 3,5L,
// padahal 3×1L = 3L cukup.)
// Mengembalikan { teks, total, sisa, kaleng } atau null bila liter <= 0.
// Logika murni (bisa di-test di Node).
export function saranKemasan(liter) {
  const butuh = Number(liter);
  if (!isFinite(butuh) || butuh <= 0) return null;
  const [besar, sedang, kecil] = UKURAN_KEMASAN;
  let terbaik = null;
  const maksBesar = Math.ceil(butuh / besar);
  for (let n5 = 0; n5 <= maksBesar; n5++) {
    const sisaSetelahBesar = butuh - n5 * besar;
    const maksSedang = sisaSetelahBesar <= 0 ? 0 : Math.ceil(sisaSetelahBesar / sedang);
    for (let n25 = 0; n25 <= maksSedang; n25++) {
      const sisa = butuh - n5 * besar - n25 * sedang;
      const n1 = sisa <= 0 ? 0 : Math.ceil(sisa / kecil);
      const total = n5 * besar + n25 * sedang + n1 * kecil;
      const kaleng = n5 + n25 + n1;
      if (kaleng === 0) continue;
      if (!terbaik || total < terbaik.total - 1e-9 ||
          (Math.abs(total - terbaik.total) <= 1e-9 && kaleng < terbaik.kaleng)) {
        terbaik = { n5, n25, n1, total, kaleng };
      }
    }
  }
  if (!terbaik) return null;
  const parts = [];
  if (terbaik.n5) parts.push(terbaik.n5 + '× ' + besar + 'L');
  if (terbaik.n25) parts.push(terbaik.n25 + '× ' + sedang + 'L');
  if (terbaik.n1) parts.push(terbaik.n1 + '× ' + kecil + 'L');
  return {
    teks: parts.join(' + '),
    total: Math.round(terbaik.total * 100) / 100,
    sisa: Math.round((terbaik.total - butuh) * 100) / 100,
    kaleng: terbaik.kaleng,
  };
}
utils.catTembokSaranKemasan = saranKemasan;

export function render(root) {

      const pI = T.input('text', 'Panjang (m)', '4');
      const lI = T.input('text', 'Lebar (m)', '3');
      const tI = T.input('text', 'Tinggi (m)', '3');
      const lapisI = T.input('text', 'Jumlah lapis', '2');
      const dayaI = T.input('text', 'Daya sebar (m²/liter)', '10');
      const bukaanI = T.input('text', 'Pintu/jendela (m²)', '2');
      const box = T.out();

      function calc() {
        const r = utils.catTembok(pI.value, lI.value, tI.value, lapisI.value, dayaI.value, bukaanI.value);
        if (r.luas <= 0) { T.show(box, '<p class="err">Cek ukuran ruangan — luas dindingnya nol.</p>'); return; }
        const s = saranKemasan(r.liter);
        const saranTxt = s
          ? s.teks + ` <span class="hint">(total ${s.total} L, sisa ${s.sisa} L untuk cadangan)</span>`
          : '-';
        T.show(box,
          `<div class="kv"><span>Luas dinding dicat</span><b>${r.luas} m²</b></div>` +
          `<div class="kv"><span>Kebutuhan cat</span><b>${r.liter.toFixed(1)} liter</b></div>` +
          `<div class="kv"><span>Saran kemasan</span><b>${saranTxt}</b></div>` +
          `<div class="hint">Hitung: 2×(panjang+lebar)×tinggi − bukaan, × lapis ÷ daya sebar. Saran kemasan dipilih yang totalnya paling pas dengan kebutuhanmu, jadi sisa catnya paling sedikit.</div>`);
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
      [pI, lI, tI, lapisI, dayaI, bukaanI].forEach((i) => i.addEventListener('input', calc));
      calc();
    
}
