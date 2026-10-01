import { h as T, utils } from '../../core.js?v=6.8.0';

/* Dibuat agar bisa diuji langsung dari node (tanpa DOM). */
export function topikKeTag(s) {
  return String(s == null ? '' : s).toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ').trim().replace(/\s/g, '');
}

export function buatHashtag(input) {
  const topik = topikKeTag(input);
  if (!topik) return [];
  const pola = [
    (t) => t,
    (t) => t + 'indonesia',
    (t) => 'info' + t,
    (t) => 'tips' + t,
    (t) => t + 'viral',
    (t) => 'seputar' + t,
    (t) => t + 'hits',
    (t) => t + 'reels',
  ];
  const list = [];
  pola.forEach((p) => { const h = '#' + p(topik); if (list.indexOf(h) === -1) list.push(h); });
  ['fyp', 'fypindonesia', 'beranda', 'viral', 'trending', 'reelsindonesia', 'tiktokindonesia']
    .forEach((g) => { const h = '#' + g; if (list.indexOf(h) === -1) list.push(h); });
  return list.slice(0, 15);
}

export const meta = {"id": "generator-hashtag", "name": "Generator Hashtag", "cat": "teks", "icon": "#️⃣", "desc": "Bikin 15 hashtag siap pakai dari satu topik.", "keywords": "hashtag,tagar,instagram,tiktok,reels,caption"};

export function render(root) {

    const inp = T.input('text', 'Contoh: kopi susu, skincare, jualan baju…');
    const out = T.out();
    let daftar = [];

    function gambar() {
      if (!daftar.length) { T.hide(out); return; }
      const box = T.el('<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px"></div>');
      daftar.forEach((h) => {
        const c = T.el('<button type="button" class="btn small" style="border-radius:999px">' + T.esc(h) + '</button>');
        c.addEventListener('click', () => {
          T.copy(h);
          const lama = c.textContent;
          c.textContent = '✓ ' + h;
          setTimeout(() => { c.textContent = lama; }, 1200);
        });
        box.appendChild(c);
      });
      T.show(out, '');
      out.appendChild(box);
      out.appendChild(T.row(
        T.copyBtn(() => daftar.join(' '), '📋 Salin Semua (15)'),
        T.copyBtn(() => daftar.join('\n'), 'Salin per Baris')
      ));
    }

    const proses = () => {
      daftar = buatHashtag(inp.value);
      if (!daftar.length) {
        T.show(out, '<span class="err">Tulis topiknya dulu — misal "kopi susu" atau "skincare".</span>');
        return;
      }
      gambar();
    };

    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') proses(); });
    root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Ketik satu topik, langsung dapat 15 hashtag: pola turunan topikmu + hashtag generik yang lagi ramai di Indonesia. Ketuk satu chip buat salin satuan, atau salin semuanya sekaligus.</p>'));
    root.appendChild(T.field('Topik / kata kunci', inp));
    root.appendChild(T.row(T.btn('Buat Hashtag', proses, true)));
    root.appendChild(out);
}
