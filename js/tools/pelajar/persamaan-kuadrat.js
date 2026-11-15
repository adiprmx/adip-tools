import { h as T, utils } from '../../core.js?v=6.11.5';

// Logika murni (bisa di-test di Node).
utils.selesaiKuadrat = function (a, b, c) {
  a = Number(a); b = Number(b); c = Number(c);
  if (!a) return { error: 'Koefisien a tidak boleh 0, kalau tidak persamaannya bukan kuadrat.' };
  const d = b * b - 4 * a * c;
  if (d < 0) return { d, akar: null, kembar: false, langkah: 'Diskriminan negatif, jadi tidak ada akar real.' };
  if (d === 0) {
    const x = -b / (2 * a);
    return { d, akar: [x], kembar: true, langkah: 'Diskriminan 0, jadi akarnya kembar: x = -b / 2a.' };
  }
  const s = Math.sqrt(d);
  return { d, akar: [(-b + s) / (2 * a), (-b - s) / (2 * a)], kembar: false, langkah: 'Diskriminan positif, jadi ada dua akar berbeda.' };
};

utils.selesaiSPLDV = function (a1, b1, c1, a2, b2, c2) {
  a1 = Number(a1); b1 = Number(b1); c1 = Number(c1);
  a2 = Number(a2); b2 = Number(b2); c2 = Number(c2);
  const det = a1 * b2 - a2 * b1;
  if (det === 0) return { det, solusi: null };
  return { det, solusi: { x: (c1 * b2 - c2 * b1) / det, y: (a1 * c2 - a2 * c1) / det } };
};

export const meta = {"id": "persamaan-kuadrat", "name": "Persamaan Kuadrat & SPLDV", "cat": "pelajar", "icon": "📐", "desc": "Cari akar persamaan kuadrat dan selesaikan dua persamaan dua variabel.", "keywords": "kuadrat,persamaan,spldv,akar,diskriminan,matematika,aljabar", "since": "6.11.0"};

export function render(root) {
  const a = T.input('text', 'Contoh: 1', '1'); a.inputMode = 'decimal';
  const b = T.input('text', 'Contoh: -5', '-5'); b.inputMode = 'decimal';
  const c = T.input('text', 'Contoh: 6', '6'); c.inputMode = 'decimal';
  const box = T.out();

  const a1 = T.input('text', 'Contoh: 2', '2'); a1.inputMode = 'decimal';
  const b1 = T.input('text', 'Contoh: 3', '3'); b1.inputMode = 'decimal';
  const c1 = T.input('text', 'Contoh: 12', '12'); c1.inputMode = 'decimal';
  const a2 = T.input('text', 'Contoh: 1', '1'); a2.inputMode = 'decimal';
  const b2 = T.input('text', 'Contoh: -1', '-1'); b2.inputMode = 'decimal';
  const c2 = T.input('text', 'Contoh: 1', '1'); c2.inputMode = 'decimal';
  const box2 = T.out();

  function fmtBil(x) {
    return T.fmt(Math.round(x * 10000) / 10000);
  }

  function hitungKuadrat() {
    const r = utils.selesaiKuadrat(T.num(a.value), T.num(b.value), T.num(c.value));
    if (r.error) { T.show(box, '<div class="hint">' + r.error + '</div>'); return; }
    const av = T.num(a.value), bv = T.num(b.value), cv = T.num(c.value);
    let html = `<div class="kv"><span>Persamaan</span><b>${fmtBil(av)}x² + ${fmtBil(bv)}x + ${fmtBil(cv)} = 0</b></div>` +
      `<div class="kv"><span>Diskriminan (b² - 4ac)</span><b>${fmtBil(r.d)}</b></div>` +
      `<div class="hint">${r.langkah}</div>`;
    if (r.akar) {
      html += r.kembar
        ? `<div class="kv"><span>Akar kembar</span><b style="color:#fff">x = ${fmtBil(r.akar[0])}</b></div>`
        : `<div class="kv"><span>Akar pertama (x1)</span><b style="color:#fff">${fmtBil(r.akar[0])}</b></div>` +
          `<div class="kv"><span>Akar kedua (x2)</span><b style="color:#fff">${fmtBil(r.akar[1])}</b></div>`;
      html += `<div class="hint">Cek: jumlah akar = -b/a = ${fmtBil(-bv / av)}, hasil kali akar = c/a = ${fmtBil(cv / av)}.</div>`;
    } else {
      html += `<div class="hint">Karena diskriminan negatif, grafiknya tidak memotong sumbu x sama sekali.</div>`;
    }
    T.show(box, html);
  }

  function hitungSpldv() {
    const r = utils.selesaiSPLDV(T.num(a1.value), T.num(b1.value), T.num(c1.value), T.num(a2.value), T.num(b2.value), T.num(c2.value));
    if (!r.solusi) {
      T.show(box2, '<div class="hint">Dua persamaan ini tidak punya satu jawaban pasti (garisnya sejajar atau berhimpit). Cek lagi koefisiennya.</div>');
      return;
    }
    T.show(box2,
      `<div class="kv"><span>Nilai x</span><b style="color:#fff">${fmtBil(r.solusi.x)}</b></div>` +
      `<div class="kv"><span>Nilai y</span><b style="color:#fff">${fmtBil(r.solusi.y)}</b></div>` +
      `<div class="hint">Dihitung dengan cara eliminasi-substitusi. Cek dengan memasukkan x dan y ke kedua persamaan, hasilnya harus sama dengan ruas kanannya.</div>`
    );
  }

  root.appendChild(T.el('<h3>Persamaan kuadrat: ax² + bx + c = 0</h3>'));
  root.appendChild(T.grid2(
    T.field('a', a),
    T.field('b', b)
  ));
  root.appendChild(T.field('c', c));
  root.appendChild(T.btn('Cari akar', hitungKuadrat, true));
  root.appendChild(box);
  root.appendChild(T.el('<h3 style="margin-top:24px">SPLDV: dua persamaan, dua variabel</h3>'));
  root.appendChild(T.el('<p class="note">Persamaan 1: a1x + b1y = c1 &nbsp;·&nbsp; Persamaan 2: a2x + b2y = c2</p>'));
  root.appendChild(T.grid2(
    T.field('a1', a1),
    T.field('b1', b1)
  ));
  root.appendChild(T.field('c1', c1));
  root.appendChild(T.grid2(
    T.field('a2', a2),
    T.field('b2', b2)
  ));
  root.appendChild(T.field('c2', c2));
  root.appendChild(T.btn('Selesaikan SPLDV', hitungSpldv, true));
  root.appendChild(box2);
}
