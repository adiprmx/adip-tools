import { h as T } from '../../core.js?v=6.9.5';

export const meta = {"id": "nama-brand", "name": "Generator Nama Brand", "cat": "bisnis", "icon": "🏷️", "desc": "Racik kata jadi nama brand yang catchy.", "keywords": "brand,nama,bisnis,usaha,merk", "file": "tools/bisnis/nama-brand.js"};
export function render(root) {
  const kw = T.input('text', 'cth: kopi susu (1-3 kata)', '');
  const box = T.out();

  const cap = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : '';

  const racik = () => {
    const words = kw.value.toLowerCase().split(/\s+/).map((s) => s.trim()).filter(Boolean).slice(0, 3);
    if (!words.length) { T.toast('Isi dulu kata kuncinya ya'); kw.focus(); return; }
    const [a, b, c] = [words[0], words[1] || '', words[2] || ''];
    const out = [];
    const add = (s) => { const n = cap(s); if (n && !out.includes(n)) out.push(n); };
    // gabungan kata
    add(a + b); add(a + b + c); add(b + a);
    add(cap(a) + cap(b));
    // potongan suku kata
    add(a.slice(0, 2) + b.slice(0, 2));
    add(a.slice(0, 3) + b.slice(0, 3));
    add(cap(a) + b.slice(0, 3));
    add(a.slice(0, 2) + b);
    // akhiran khas Indonesia
    add(a + 'ku'); add(a + 'mu'); add(a + 'in'); add(a + 'kita');
    if (b) {
      add(b + 'ku'); add(b + 'in');
      add(cap(a + b) + 'ku');
      add(b + 'mart'); add('ka' + b);
    }
    add(a + 'pedia'); add(a + 'nesia'); add(a + 'ologi');
    // awalan / kata depan
    add('si' + a);
    add('raja' + a); add('toko' + a); add('kedai' + a);
    const list = out.slice(0, 20);
    T.show(box, '');
    box.appendChild(T.el('<p class="mut" style="font-size:12px;margin:0 0 8px">Ketuk nama untuk menyalin:</p>'));
    list.forEach((n) => {
      const item = T.el('<button type="button" class="btn" style="display:block;width:100%;text-align:left;margin-bottom:6px;font-size:16px"></button>');
      item.textContent = n;
      item.addEventListener('click', () => T.copy(n));
      box.appendChild(item);
    });
  };

  root.appendChild(T.field('Kata kunci', kw, '1–3 kata, mis. "kopi susu" atau "martabak manis".'));
  root.appendChild(T.row(T.btn('Racik Nama', racik, true)));
  root.appendChild(box);
}
