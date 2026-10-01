import { h as T, utils, kv } from '../../core.js?v=6.8.0';

export const meta = {"id": "format-hp", "name": "Format Nomor HP", "cat": "indonesia", "icon": "📱", "desc": "08xx ↔ +62 ↔ 62xx.", "keywords": "hp,nomor,telepon,62,whatsapp"};
export function render(root) {

    const inp = T.input('tel', 'cth: 081944475875 / +62819…');
    inp.inputMode = 'tel';
    const box = T.out();
    const norm = (s) => {
      let d = String(s).replace(/\D/g, '');
      if (!d) return null;
      if (d.startsWith('62')) d = d.slice(2);
      else if (d.startsWith('0')) d = d.slice(1);
      if (!/^8\d{7,12}$/.test(d)) return null;
      return d;
    };
    const hitung = () => {
      const d = norm(inp.value);
      if (!d) { T.show(box, '<p class="warn">Nomor tidak valid. Contoh: 0812xxxxxxx atau +62812xxxxxxx.</p>'); return; }
      const f0 = '0' + d, f62 = '+62' + d, f62b = '62' + d;
      const wa = 'https://wa.me/' + f62b;
      T.show(box,
        kv('Format 08xx', '<b>' + T.esc(f0) + '</b>') +
        kv('Format +62', '<b>' + T.esc(f62) + '</b>') +
        kv('Format 62xx', '<b>' + T.esc(f62b) + '</b>') +
        T.row(
          T.copyBtn(() => f62, 'Salin +62'),
          (() => { const a = T.el('<a class="btn primary" target="_blank" rel="noopener" style="text-decoration:none;display:inline-flex;align-items:center">Buka wa.me</a>'); a.href = wa; return a; })()
        ));
    };
    inp.addEventListener('input', hitung);
    root.appendChild(T.field('Nomor HP', inp, 'Tempel nomor dalam format apa pun'));
    root.appendChild(box);
  
}
