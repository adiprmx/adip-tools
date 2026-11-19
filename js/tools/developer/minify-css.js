import { h as T, errBox } from '../../core.js';

// Minify CSS: buang komentar (kecuali /*! lisensi */), rapatkan spasi,
// buang titik koma terakhir sebelum }, persingkat warna hex dan nol
// bersatuan. Isi string, url(), dan calc() dilindungi supaya tidak rusak.
export function minifyCss(css) {
  const src = String(css == null ? '' : css);
  const before = src.length;
  const saved = [];
  const stash = (s) => {
    saved.push(s);
    return '@@MINCSS' + (saved.length - 1) + '@@';
  };
  // Lindungi string "..." dan '...' (hormati backslash escape).
  let s = src.replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g, stash);
  // Lindungi url(...) tanpa kutip yang tersisa.
  s = s.replace(/url\([^)]*\)/gi, stash);
  // Lindungi calc(...) dengan kurung berimbang (pindai manual: replace
  // hanya mengganti teks yang cocok, bukan seluruh rentang calc).
  {
    let out = '', idx = 0;
    const re = /calc\(/gi;
    let m;
    while ((m = re.exec(s)) !== null) {
      let depth = 1, j = m.index + 5;
      while (j < s.length && depth > 0) {
        if (s[j] === '(') depth++;
        else if (s[j] === ')') depth--;
        j++;
      }
      out += s.slice(idx, m.index) + stash(s.slice(m.index, j));
      idx = j;
      re.lastIndex = j;
    }
    s = out + s.slice(idx);
  }
  // Buang komentar, kecuali yang diawali /*! (biasanya lisensi).
  s = s.replace(/\/\*[\s\S]*?\*\//g, (m) => (m.startsWith('/*!') ? m : ''));
  // Rapatkan spasi di sekitar tanda baca CSS.
  s = s
    .replace(/\s+/g, ' ')
    .replace(/\s*([{}:;,>+~()])\s*/g, '$1')
    .replace(/;}/g, '}')
    .replace(/\s*!\s*important/g, '!important')
    .replace(/#([0-9a-fA-F])\1([0-9a-fA-F])\2([0-9a-fA-F])\3\b/g, '#$1$2$3')
    .replace(/\b0(?:px|em|rem|vh|vw|vmin|vmax|ex|ch|pt|pc|in|cm|mm|s|ms|deg)\b/gi, '0')
    .replace(/\*\/\s+/g, '*/')
    .replace(/\s+\/\*/g, '/*')
    .trim();
  // Kembalikan isi yang dilindungi.
  s = s.replace(/@@MINCSS(\d+)@@/g, (_, i) => saved[+i]);
  return { css: s, before, after: s.length, saved: before - s.length, savedPct: before ? Math.round(((before - s.length) / before) * 100) : 0 };
}

export const meta = {"id": "minify-css", "name": "Minify CSS", "cat": "developer", "icon": "🗜️", "desc": "Perkecil kode CSS supaya file style lebih ringan.", "keywords": "css,minify,perkecil,kompres,style,optimasi", "since": "6.18.0"};
export function render(root) {

    const inp = T.ta(10, 'Tempel kode CSS di sini…');
    inp.style.fontFamily = 'ui-monospace,monospace';
    inp.spellcheck = false;
    const outp = T.ta(10, 'Hasil minify muncul di sini…');
    outp.style.fontFamily = 'ui-monospace,monospace';
    outp.readOnly = true;
    const status = T.out();
    let lastResult = '';

    const jalan = () => {
      const raw = inp.value;
      if (!raw.trim()) { T.show(status, errBox('Tempel dulu kode CSS-nya.')); return; }
      const r = minifyCss(raw);
      lastResult = r.css;
      outp.value = r.css;
      T.show(status,
        '<div class="kv"><span class="k">Ukuran awal</span><span class="v">' + T.fmt(r.before) + ' karakter</span></div>' +
        '<div class="kv"><span class="k">Ukuran akhir</span><span class="v">' + T.fmt(r.after) + ' karakter</span></div>' +
        '<div class="kv"><span class="k">Berhasil dipangkas</span><span class="v big">' + T.fmt(r.saved) + ' karakter (' + r.savedPct + '%)</span></div>');
    };

    root.appendChild(T.field('Kode CSS', inp));
    root.appendChild(T.row(T.btn('Minify', jalan, true), T.copyBtn(() => lastResult, 'Salin Hasil'), T.dlBtn('style.min.css', () => lastResult, 'text/css;charset=utf-8', 'Unduh .css')));
    root.appendChild(status);
    root.appendChild(T.field('Hasil', outp));
    root.appendChild(T.el('<div class="hint" style="margin-top:12px">Komentar biasa dibuang, tapi komentar lisensi yang diawali /*! dipertahankan. Isi dalam tanda kutip, url(), dan calc() tidak diubah.</div>'));

}
