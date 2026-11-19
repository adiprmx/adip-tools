import { h as T, errBox } from '../../core.js';

// Minify HTML: buang komentar dan spasi berlebih, rapatkan antar tag.
// Isi <pre>, <script>, <style>, dan <textarea> dilindungi supaya tidak rusak,
// begitu juga komentar kondisional (<!--[if ...]-->).
// Spasi antar tag inline dipertahankan satu spasi supaya kata tidak menempel;
// spasi di sekitar tag blok dibuang habis.
const BLOK = 'html|head|body|div|section|article|header|footer|main|nav|aside|ul|ol|li|table|thead|tbody|tfoot|tr|td|th|form|figure|figcaption|p|h1|h2|h3|h4|h5|h6|blockquote|pre|fieldset|dl|dt|dd|br|hr|img|input|meta|link|button|select|option|textarea';

export function minifyHtml(html) {
  const src = String(html == null ? '' : html);
  const before = src.length;
  const saved = [];
  let token = '@@MINHTML';
  while (src.includes(token)) token += 'X'; // hindari tabrakan dengan isi asli
  const stash = (s) => {
    saved.push(s);
    return token + (saved.length - 1) + '@@';
  };
  // Lindungi isi yang spasi dan komentarnya harus utuh.
  let s = src.replace(/<(pre|script|style|textarea)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, stash);
  // Lindungi komentar kondisional.
  s = s.replace(/<!--\[if[\s\S]*?<!\[endif\]-->/gi, stash);
  // Buang komentar HTML biasa.
  s = s.replace(/<!--[\s\S]*?-->/g, '');
  // Buang spasi berbaris baru di sekitar tag blok (dua arah).
  s = s.replace(new RegExp('(<\\/(?:' + BLOK + ')\\s*>|<(?:' + BLOK + ')(?:\\s[^>]*)?>)\\s*\\n\\s*<', 'gi'), '$1<');
  s = s.replace(new RegExp('>\\s*\\n\\s*(<\\/?(?:' + BLOK + ')(?:\\s[^>]*)?>)', 'gi'), '>$1');
  // Sisa spasi berlebih jadi satu spasi (spasi antar tag inline tetap ada).
  s = s.replace(/\s+/g, ' ').trim();
  // Kembalikan isi yang dilindungi.
  const tokenRe = new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(\\d+)@@', 'g');
  s = s.replace(tokenRe, (_, i) => saved[+i]);
  return { html: s, before, after: s.length, saved: before - s.length, savedPct: before ? Math.round(((before - s.length) / before) * 100) : 0 };
}

export const meta = {"id": "minify-html", "name": "Minify HTML", "cat": "developer", "icon": "📃", "desc": "Perkecil kode HTML dengan menghapus komentar dan spasi berlebih.", "keywords": "html,minify,perkecil,kompres,optimasi,kode", "since": "6.18.0"};
export function render(root) {

    const inp = T.ta(10, 'Tempel kode HTML di sini…');
    inp.style.fontFamily = 'ui-monospace,monospace';
    inp.spellcheck = false;
    const outp = T.ta(10, 'Hasil minify muncul di sini…');
    outp.style.fontFamily = 'ui-monospace,monospace';
    outp.readOnly = true;
    const status = T.out();
    let lastResult = '';

    const jalan = () => {
      const raw = inp.value;
      if (!raw.trim()) { T.show(status, errBox('Tempel dulu kode HTML-nya.')); return; }
      const r = minifyHtml(raw);
      lastResult = r.html;
      outp.value = r.html;
      T.show(status,
        '<div class="kv"><span class="k">Ukuran awal</span><span class="v">' + T.fmt(r.before) + ' karakter</span></div>' +
        '<div class="kv"><span class="k">Ukuran akhir</span><span class="v">' + T.fmt(r.after) + ' karakter</span></div>' +
        '<div class="kv"><span class="k">Berhasil dipangkas</span><span class="v big">' + T.fmt(r.saved) + ' karakter (' + r.savedPct + '%)</span></div>');
    };

    root.appendChild(T.field('Kode HTML', inp));
    root.appendChild(T.row(T.btn('Minify', jalan, true), T.copyBtn(() => lastResult, 'Salin Hasil'), T.dlBtn('halaman.min.html', () => lastResult, 'text/html;charset=utf-8', 'Unduh .html')));
    root.appendChild(status);
    root.appendChild(T.field('Hasil', outp));
    root.appendChild(T.el('<div class="hint" style="margin-top:12px">Isi di dalam pre, script, style, dan textarea tidak diubah, begitu juga komentar kondisional. Spasi antar kata di dalam teks tetap dijaga supaya kata tidak menempel.</div>'));

}
