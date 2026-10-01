import { h as T, utils } from '../../core.js?v=5.0.0';

const LOREM_BANK = [
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
    'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
    'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
    'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam.',
    'Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos.',
    'Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam.',
    'Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum.',
    'At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti.',
    'Et harum quidem rerum facilis est et expedita distinctio, nam libero tempore, cum soluta nobis est eligendi optio.',
    'Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudiandae.',
    'Itaque earum rerum hic tenetur a sapiente delectus, ut aut reiciendis voluptatibus maiores alias consequatur aut.',
    'Perferendis doloribus asperiores repellat, nam libero tempore cum soluta nobis est eligendi optio cumque nihil impedit.',
    'Quo minus id quod maxime placeat facere possimus, omnis voluptas assumenda est, omnis dolor repellendus.',
    'Similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga, et harum quidem rerum.'
  ];

utils.lorem = function (mode, count) {
    const n = Math.max(1, Math.min(50, Math.round(Number(count) || 3)));
    const pool = LOREM_BANK.slice();
    // acak ringan
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
    if (mode === 'kalimat') {
      const out = [];
      for (let i = 0; i < n; i++) out.push(pool[i % pool.length]);
      return out.join(' ');
    }
    if (mode === 'kata') {
      const words = pool.join(' ').replace(/[.,]/g, '').split(/\s+/);
      const out = [];
      for (let i = 0; i < n; i++) out.push(words[i % words.length]);
      return out.join(' ');
    }
    // paragraf
    const paras = [];
    for (let p = 0; p < n; p++) {
      const k = 4 + Math.floor(Math.random() * 3);
      const s = [];
      for (let i = 0; i < k; i++) s.push(pool[(p * 7 + i) % pool.length]);
      paras.push(s.join(' '));
    }
    return paras.join('\n\n');
  };

export const meta = {"id": "lorem-ipsum", "name": "Lorem Ipsum Generator", "cat": "teks", "icon": "📄", "desc": "Generator teks dummy."};

export function render(root) {

      const modeSel = T.select([['paragraf', 'Paragraf'], ['kalimat', 'Kalimat'], ['kata', 'Kata']], 'paragraf');
      const countI = T.input('number', 'Jumlah', '3');
      const box = T.out();
      let last = '';

      function gen() {
        last = utils.lorem(modeSel.value, countI.value);
        T.show(box, `<pre class="pre">${T.esc(last)}</pre>`);
      }

      root.appendChild(T.grid2(T.field('Mode', modeSel), T.field('Jumlah', countI)));
      root.appendChild(T.row(
        T.btn('Generate', gen, true),
        T.copyBtn(() => last, 'Salin')
      ));
      root.appendChild(box);
    
}
