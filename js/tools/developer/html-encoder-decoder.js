import { h as T, errBox } from '../../core.js';

// Encode: karakter khusus HTML jadi entity. nonAscii: huruf di atas
// ASCII (misal é, ©) juga jadi entity angka.
export function encodeHtml(s, nonAscii) {
  let out = String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
  if (nonAscii) out = out.replace(/[\u0080-\uFFFF]/g, (c) => '&#' + c.codePointAt(0) + ';');
  return out;
}

// Decode manual (tanpa DOM): entity angka desimal/hex + entity bernama umum.
const NAMED = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  copy: '©', reg: '®', trade: '™', hellip: '…', mdash: '—', ndash: '–',
  laquo: '«', raquo: '»', lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”',
  times: '×', divide: '÷', plusmn: '±', deg: '°', micro: 'µ', para: '¶',
  sect: '§', dagger: '†', Dagger: '‡', bull: '•', middot: '·', euro: '€',
  pound: '£', yen: '¥', cent: '¢', curren: '¤', brvbar: '¦', iexcl: '¡',
  iquest: '¿', szlig: 'ß', agrave: 'à', aacute: 'á', eacute: 'é', egrave: 'è',
  iacute: 'í', oacute: 'ó', uacute: 'ú', ntilde: 'ñ', ccedil: 'ç', aring: 'å',
  ouml: 'ö', uuml: 'ü', auml: 'ä', euml: 'ë', iuml: 'ï', yacute: 'ý',
  alpha: 'α', beta: 'β', gamma: 'γ', pi: 'π', sigma: 'σ', omega: 'ω',
  infin: '∞', ne: '≠', le: '≤', ge: '≥', larr: '←', uarr: '↑', rarr: '→', darr: '↓',
};
export function decodeHtml(s) {
  let out = String(s == null ? '' : s);
  out = out.replace(/&#x([0-9a-fA-F]+);/g, (_, h) => {
    const n = parseInt(h, 16);
    return Number.isFinite(n) && n >= 0 && n <= 0x10FFFF ? String.fromCodePoint(n) : _;
  });
  out = out.replace(/&#(\d+);/g, (_, d) => {
    const n = parseInt(d, 10);
    return Number.isFinite(n) && n >= 0 && n <= 0x10FFFF ? String.fromCodePoint(n) : _;
  });
  out = out.replace(/&([A-Za-z]+);/g, (m, name) => (NAMED[name] !== undefined ? NAMED[name] : m));
  return out;
}

export const meta = {"id": "html-encoder-decoder", "name": "HTML Encoder/Decoder", "cat": "developer", "icon": "🔤", "desc": "Ubah karakter khusus jadi kode HTML dan sebaliknya.", "keywords": "html,encode,decode,escape,entity,amp,lt,gt", "since": "6.18.0"};
export function render(root) {

    const inp = T.ta(6, 'Tulis atau tempel teks di sini…\nContoh encode: <b>halo</b> & "kutip"\nContoh decode: &lt;b&gt;halo&lt;/b&gt; &amp; &quot;kutip&quot;');
    inp.style.fontFamily = 'ui-monospace,monospace';
    const outp = T.ta(6, 'Hasil muncul di sini…');
    outp.style.fontFamily = 'ui-monospace,monospace';
    outp.readOnly = true;
    const nonAscii = document.createElement('input');
    nonAscii.type = 'checkbox';
    const status = T.out();
    let lastResult = '';

    const jalan = (mode) => {
      const raw = inp.value;
      if (!raw) { T.show(status, errBox('Isi dulu teksnya.')); return; }
      lastResult = mode === 'encode' ? encodeHtml(raw, nonAscii.checked) : decodeHtml(raw);
      outp.value = lastResult;
      T.show(status, '<span class="ok">✓ ' + (mode === 'encode' ? 'Sudah di-encode.' : 'Sudah di-decode.') + '</span> <span class="dim">' + raw.length + ' karakter jadi ' + lastResult.length + ' karakter.</span>');
    };

    root.appendChild(T.field('Teks', inp));
    root.appendChild(T.field('Ubah juga huruf khusus (é, ©, dst.) saat encode', nonAscii));
    root.appendChild(T.row(T.btn('Encode', () => jalan('encode'), true), T.btn('Decode', () => jalan('decode')), T.copyBtn(() => lastResult, 'Salin Hasil')));
    root.appendChild(status);
    root.appendChild(T.field('Hasil', outp));
    root.appendChild(T.el('<div class="hint" style="margin-top:12px">Encode berguna saat menampilkan kode di halaman web supaya tidak dianggap tag sungguhan. Decode mengembalikan entity bernama umum dan entity angka ke huruf aslinya.</div>'));

}
