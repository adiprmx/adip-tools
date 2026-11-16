import { h as T, esc, errBox } from '../../core.js?v=6.12.2';

export const meta = {"id": "deeplink-telegram", "name": "Pembuat Deep Link Telegram", "cat": "developer", "icon": "🔗", "desc": "Buat tautan t.me bot dengan parameter start, siap dibagikan.", "keywords": "telegram,deeplink,deep link,t.me,start parameter,bot", "since": "6.11.0"};

// Mengembalikan { link } bila valid, atau { error } bila ada yang salah.
export function buildDeepLink(username, param) {
  const user = String(username || '').trim().replace(/^@+/, '');
  if (!user) return { error: 'Isi dulu username botnya.' };
  if (!/^[A-Za-z0-9_]{5,32}$/.test(user)) {
    return { error: 'Username bot 5 sampai 32 karakter, hanya huruf, angka, dan garis bawah.' };
  }
  const p = String(param || '').trim();
  if (p && !/^[A-Za-z0-9_-]{1,64}$/.test(p)) {
    return { error: 'Parameter start maksimal 64 karakter, hanya huruf, angka, garis bawah, dan strip.' };
  }
  return { link: 'https://t.me/' + user + (p ? '?start=' + p : '') };
}

export function render(root) {
  const user = T.input('text', 'contohbot', '');
  user.setAttribute('autocomplete', 'off');
  user.setAttribute('spellcheck', 'false');
  const param = T.input('text', 'kode_undangan (boleh kosong)', '');
  param.setAttribute('autocomplete', 'off');
  param.setAttribute('spellcheck', 'false');
  const box = T.out();
  const emptyHtml = '<span class="dim">Isi username bot di atas, tautan muncul di sini.</span>';

  const update = () => {
    const res = buildDeepLink(user.value, param.value);
    if (res.error) {
      if (!user.value.trim()) { T.show(box, emptyHtml); return; }
      T.show(box, errBox(res.error));
      return;
    }
    T.show(box, '');
    const pre = T.el('<pre style="white-space:pre-wrap;word-break:break-all;background:#12100d;border:1px solid #2e2823;border-radius:8px;padding:12px;font-size:13px;line-height:1.6;font-family:monospace"></pre>');
    pre.textContent = res.link;
    box.appendChild(pre);
    const openBtn = T.btn('Buka tautan', () => { window.open(res.link, '_blank', 'noopener'); });
    box.appendChild(T.row(T.copyBtn(() => buildDeepLink(user.value, param.value).link || '', 'Salin tautan'), openBtn));
  };

  user.addEventListener('input', update);
  param.addEventListener('input', update);

  root.appendChild(T.field('Username bot', user, 'Tanpa @.'));
  root.appendChild(T.field('Parameter start (boleh kosong)', param, 'Kode singkat yang ikut terkirim saat bot dibuka, misalnya kode undangan.'));
  root.appendChild(box);
  root.appendChild(T.el('<div class="hint">Cara pakai: bagikan tautan ini. Saat seseorang membukanya, Telegram membuka bot dan mengirim /start beserta parameternya ke bot. Bot bisa membaca parameter itu, misalnya untuk tahu kode undangan yang dipakai.</div>'));
  T.show(box, emptyHtml);
}
