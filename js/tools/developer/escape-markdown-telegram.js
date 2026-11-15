import { h as T, preHtml } from '../../core.js?v=6.12.1';

export const meta = {"id": "escape-markdown-telegram", "name": "Escape MarkdownV2 Telegram", "cat": "developer", "icon": "🔤", "desc": "Tambah backslash ke karakter khusus supaya teks aman dikirim dengan MarkdownV2.", "keywords": "telegram,markdownv2,escape,backslash,bot api,format", "since": "6.11.0"};

// 18 karakter khusus MarkdownV2 menurut dokumentasi Bot API, ditambah
// backslash itu sendiri: _ * [ ] ( ) ~ ` > # + - = | { } . !
const RESERVED = /[_*[\]()~`>#+\-=|{}.!\\]/g;

export function escapeMdV2(text) {
  return String(text == null ? '' : text).replace(RESERVED, '\\$&');
}

export function countEscaped(text) {
  const m = String(text == null ? '' : text).match(RESERVED);
  return m ? m.length : 0;
}

export function render(root) {
  const input = T.ta(6, 'Tulis atau tempel teks yang mau dikirim bot…', '');
  const box = T.out();
  const emptyHtml = '<span class="dim">Tulis teks di atas, hasil yang sudah di-escape muncul di sini.</span>';
  const sample = 'Halo! Harga Rp50.000 (promo 20% + ongkir) #promo *jangan* lewatkan _ini_ ~diskon~ `kode` > kutip {a|b} = 100. Cek [situs] ya!';

  const update = () => {
    const src = input.value;
    if (!src) { T.show(box, emptyHtml); return; }
    const out = escapeMdV2(src);
    const n = countEscaped(src);
    T.show(box, '');
    box.appendChild(T.el('<div class="dim" style="margin-bottom:8px">' + n + ' karakter ditambah backslash.</div>'));
    const pre = T.el('<div></div>');
    pre.innerHTML = preHtml(out);
    box.appendChild(pre);
    box.appendChild(T.row(T.copyBtn(() => escapeMdV2(input.value), 'Salin hasil')));
  };

  input.addEventListener('input', update);

  root.appendChild(T.field('Teks asli', input, 'Teks yang mau dikirim bot dengan format MarkdownV2.'));
  root.appendChild(T.row(T.btn('Isi contoh', () => { input.value = sample; update(); })));
  root.appendChild(box);
  root.appendChild(T.el('<div class="hint">Karakter yang ditambah backslash: _ * [ ] ( ) ~ ` &gt; # + - = | { } . ! dan backslash sendiri. Daftar ini sesuai dokumentasi Bot API Telegram.</div>'));
  root.appendChild(T.el('<div class="hint">Aturan ini untuk teks biasa. Di dalam blok kode, hanya backtick dan backslash yang perlu di-escape. Di dalam tautan, hanya kurung tutup dan backslash.</div>'));
  T.show(box, emptyHtml);
}
