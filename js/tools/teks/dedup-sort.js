import { h as T, utils } from '../../core.js?v=5.2.0';

utils.dedupSort = function (text, opts) {
    opts = opts || {};
    let lines = String(text == null ? '' : text).split('\n');
    const before = lines.length;
    if (opts.trim) lines = lines.map((x) => x.trim());
    if (opts.empty) lines = lines.filter((x) => x.length > 0);
    if (opts.dedup) {
      const seen = new Set(); const out = [];
      for (const x of lines) { const k = opts.trim ? x : x; if (!seen.has(k)) { seen.add(k); out.push(x); } }
      lines = out;
    }
    if (opts.sort === 'az') lines = lines.slice().sort((x, y) => x.localeCompare(y, 'id'));
    else if (opts.sort === 'za') lines = lines.slice().sort((x, y) => y.localeCompare(x, 'id'));
    return { text: lines.join('\n'), before, after: lines.length, removed: before - lines.length };
  };

export const meta = {"id": "dedup-sort", "name": "Dedup & Urutkan", "cat": "teks", "icon": "🧲", "desc": "Hapus duplikat & urutkan baris.", "keywords": "duplikat,urut,baris,sort"};
export function render(root) {

      const taIn = T.ta(8, 'Tempel daftar baris di sini…');
      const box = T.out();
      const stat = T.out();
      let last = '';

      function chk(label, checked) {
        const l = document.createElement('label');
        l.className = 'chk';
        const c = document.createElement('input');
        c.type = 'checkbox'; c.checked = !!checked;
        l.appendChild(c);
        l.appendChild(document.createTextNode(' ' + label));
        return { el: l, box: c };
      }
      const oDedup = chk('Hapus duplikat', true);
      const oTrim = chk('Trim spasi tiap baris', true);
      const oEmpty = chk('Hapus baris kosong', true);
      const sortSel = T.select([['none', 'Tanpa urut'], ['az', 'A → Z'], ['za', 'Z → A']], 'none');

      function process() {
        const r = utils.dedupSort(taIn.value, {
          dedup: oDedup.box.checked,
          trim: oTrim.box.checked,
          empty: oEmpty.box.checked,
          sort: sortSel.value
        });
        last = r.text;
        T.show(stat,
          `<div class="kv"><span>Baris awal</span><b>${T.fmt(r.before)}</b></div>` +
          `<div class="kv"><span>Baris hasil</span><b>${T.fmt(r.after)}</b></div>` +
          `<div class="kv"><span>Dibuang</span><b>${T.fmt(r.removed)}</b></div>`);
        T.show(box, `<pre class="pre">${T.esc(last)}</pre>`);
      }

      const opts = T.el('<div class="opts"></div>');
      [oDedup, oTrim, oEmpty].forEach((o) => opts.appendChild(o.el));
      root.appendChild(T.field('Daftar baris', taIn));
      root.appendChild(T.field('Opsi', opts));
      root.appendChild(T.field('Urutan', sortSel));
      root.appendChild(T.row(
        T.btn('Proses', process, true),
        T.copyBtn(() => last, 'Salin Hasil')
      ));
      root.appendChild(stat);
      root.appendChild(box);
    
}
