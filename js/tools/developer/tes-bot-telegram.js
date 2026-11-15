import { h as T, esc, errBox, kvRows, preHtml } from '../../core.js?v=6.11.5';

export const meta = {"id": "tes-bot-telegram", "name": "Tes Token Bot Telegram", "cat": "developer", "icon": "🤖", "desc": "Cek token bot Telegram: tampilkan nama dan username bot bila token benar.", "keywords": "telegram,bot,token,getme,cek token,bot api", "since": "6.11.0"};

// Bentuk token bot: angka, titik dua, lalu kode panjang. Cek longgar saja,
// penentu benar atau salah tetap jawaban dari Telegram.
export function tokenShapeOk(t) {
  return typeof t === 'string' && t.length >= 20 && t.indexOf(':') > 0;
}

export function render(root) {
  const token = T.input('password', 'Tempel token bot dari @BotFather', '');
  token.setAttribute('autocomplete', 'off');
  token.setAttribute('spellcheck', 'false');
  const showRow = T.el('<label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer;margin-top:8px"><input type="checkbox"> Tampilkan token</label>');
  const showBox = showRow.querySelector('input');
  showBox.addEventListener('change', () => { token.type = showBox.checked ? 'text' : 'password'; });

  const box = T.out();
  const emptyHtml = '<span class="dim">Tempel token lalu tekan Cek token. Hasilnya muncul di sini.</span>';

  const check = () => {
    const t = token.value.trim();
    if (!t) { T.show(box, errBox('Tempel dulu token botnya.')); return; }
    if (!tokenShapeOk(t)) { T.show(box, errBox('Token bot selalu ada titik duanya. Cek lagi hasil salinannya.')); return; }
    T.show(box, '<span class="dim">Menghubungi Telegram…</span>');
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 15000);
    fetch('https://api.telegram.org/bot' + t + '/getMe', { signal: ctrl.signal })
      .then((res) => res.json().then((j) => ({ status: res.status, j })))
      .then(({ status, j }) => {
        clearTimeout(timer);
        if (j && j.ok && j.result) {
          const r = j.result;
          const ya = (v) => (v ? 'Ya' : 'Tidak');
          const rows = [
            ['Nama bot', r.first_name || '-'],
            ['Username', r.username ? '@' + r.username : '-'],
            ['ID bot', String(r.id)],
            ['Bisa masuk grup', ya(r.can_join_groups)],
            ['Bisa baca semua pesan grup', ya(r.can_read_all_group_messages)],
            ['Dukungan inline', ya(r.supports_inline_queries)],
          ];
          T.show(box, '<div style="color:#4ade80;font-size:13px;margin-bottom:8px">Token benar. Bot dikenali Telegram.</div>' + kvRows(rows) + '<div style="margin-top:10px">' + preHtml(JSON.stringify(r, null, 2)) + '</div>');
          return;
        }
        if (status === 401 || (j && j.error_code === 401)) {
          T.show(box, errBox('Token salah atau sudah tidak berlaku. Salin lagi token dari @BotFather, lalu coba lagi.'));
          return;
        }
        if (j && j.error_code === 429) {
          T.show(box, errBox('Telegram minta tunggu sebentar karena terlalu banyak permintaan. Coba lagi beberapa detik lagi.'));
          return;
        }
        T.show(box, errBox('Telegram menjawab: ' + ((j && j.description) || ('HTTP ' + status))));
      })
      .catch((e) => {
        clearTimeout(timer);
        if (e && e.name === 'AbortError') {
          T.show(box, errBox('Permintaan ke Telegram kehabisan waktu. Cek koneksi internet lalu coba lagi.'));
          return;
        }
        T.show(box, errBox('Tidak bisa menghubungi Telegram. Cek koneksi internet lalu coba lagi.'));
      });
  };

  const clearAll = () => {
    token.value = '';
    showBox.checked = false;
    token.type = 'password';
    T.show(box, emptyHtml);
  };

  root.appendChild(T.el('<div class="warn">Token bot itu rahasia, sama seperti kata sandi. Jangan dibagikan ke siapa pun.</div>'));
  root.appendChild(T.field('Token bot', token, 'Token didapat dari @BotFather.'));
  root.appendChild(showRow);
  root.appendChild(T.row(T.btn('Cek token', check, true), T.btn('Bersihkan', clearAll)));
  root.appendChild(box);
  root.appendChild(T.el('<div class="hint">Token dikirim langsung dari browser ke api.telegram.org. Token tidak disimpan di sini dan tidak lewat server Adip Tools.</div>'));
  T.show(box, emptyHtml);
}
