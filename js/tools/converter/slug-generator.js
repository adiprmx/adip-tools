import { h as T, utils } from '../../core.js?v=6.1.0';

export const meta = {"id": "slug-generator", "name": "Slug Generator", "cat": "converter", "icon": "🏷️", "desc": "Judul jadi slug URL yang rapi.", "keywords": "slug,url,judul,link"};
export function render(root) {

    const inp = T.input('text', 'Judul artikel, misal: 7 Cara Bikin Kopi Susu Gula Aren!');
    const sep = T.select([['-', 'Strip (-)'], ['_', 'Underscore (_)']], '-');
    const maxLen = T.input('number', 'Batas panjang (opsional)', '');
    maxLen.min = 10;
    const out = T.out();
    const go = () => {
      const s = sep.value;
      let slug = inp.value
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, s)
        .replace(new RegExp('^' + s + '+|' + s + '+$', 'g'), '');
      const ml = parseInt(maxLen.value, 10);
      if (ml > 0 && slug.length > ml) {
        slug = slug.slice(0, ml).replace(new RegExp(s + '+$', ''), '');
      }
      if (!slug) { T.show(out, '<span class="err">Tidak ada kata yang bisa dijadikan slug.</span>'); return; }
      T.show(out,
        '<div class="kv"><span class="k">Slug</span><span class="v" class="monoall">' + T.esc(slug) + '</span></div>' +
        '<div class="kv"><span class="k">Panjang</span><span class="v">' + slug.length + ' karakter</span></div>');
      out.appendChild(T.row(T.btn('Salin Slug', () => T.copy(slug), true)));
    };
    inp.addEventListener('input', go);
    sep.addEventListener('change', go);
    root.appendChild(T.field('Judul', inp));
    root.appendChild(T.grid2(T.field('Pemisah', sep), T.field('Batas panjang', maxLen)));
    root.appendChild(out);
  
}
