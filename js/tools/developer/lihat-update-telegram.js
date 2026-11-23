import { h as T, esc, errBox } from '../../core.js';

export const meta = {"id": "lihat-update-telegram", "name": "Lihat Pesan Masuk Bot", "cat": "developer", "icon": "📥", "desc": "Lihat pesan terbaru yang masuk ke bot Telegram lewat getUpdates.", "keywords": "telegram,bot,getupdates,pesan masuk,update,bot api", "since": "6.11.0", "online": true};

function nameOf(p) {
  if (!p) return '-';
  const n = ((p.first_name || '') + (p.last_name ? ' ' + p.last_name : '')).trim();
  return (n || 'Tanpa nama') + (p.username ? ' (@' + p.username + ')' : '');
}

function chatLabel(c) {
  if (!c) return '-';
  const type = { private: 'Chat pribadi', group: 'Grup', supergroup: 'Supergrup', channel: 'Channel' }[c.type] || c.type || '-';
  const name = c.title || ((c.first_name || '') + (c.username ? ' (@' + c.username + ')' : '')) || '';
  return (name ? name + ' · ' : '') + type;
}

// Ringkas satu update jadi bentuk yang gampang ditampilkan.
export function describeUpdate(u) {
  if (u.callback_query) {
    const q = u.callback_query;
    return {
      kind: 'Tombol ditekan',
      sender: nameOf(q.from),
      chat: q.message ? chatLabel(q.message.chat) : '-',
      text: q.data || '(tanpa data)',
      date: q.message ? q.message.date : 0,
    };
  }
  const m = u.message || u.edited_message || u.channel_post || u.edited_channel_post || null;
  if (!m) return { kind: 'Update lain', sender: '-', chat: '-', text: '(jenis update ini belum ditampilkan)', date: 0 };
  let kind = 'Pesan teks';
  if (m.photo) kind = 'Foto';
  else if (m.sticker) kind = 'Stiker';
  else if (m.document) kind = 'Dokumen';
  else if (m.video) kind = 'Video';
  else if (m.voice) kind = 'Pesan suara';
  else if (m.video_note) kind = 'Video bulat';
  else if (m.location) kind = 'Lokasi';
  else if (m.contact) kind = 'Kontak';
  else if (m.poll) kind = 'Jajak pendapat';
  else if (m.new_chat_members) kind = 'Anggota baru';
  else if (m.left_chat_member) kind = 'Anggota keluar';
  if (u.edited_message || u.edited_channel_post) kind += ' (diedit)';
  return {
    kind,
    sender: nameOf(m.from),
    chat: chatLabel(m.chat),
    text: m.text || m.caption || '(tanpa teks)',
    date: m.date || 0,
  };
}

export function render(root) {
  const token = T.input('password', 'Tempel token bot dari @BotFather', '');
  token.setAttribute('autocomplete', 'off');
  token.setAttribute('spellcheck', 'false');
  const showRow = T.el('<label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer;margin-top:8px"><input type="checkbox"> Tampilkan token</label>');
  const showBox = showRow.querySelector('input');
  showBox.addEventListener('change', () => { token.type = showBox.checked ? 'text' : 'password'; });
  const limit = T.select([['5', '5 pesan'], ['10', '10 pesan'], ['25', '25 pesan']], '10');

  const box = T.out();
  const emptyHtml = '<span class="dim">Tempel token lalu tekan Lihat pesan masuk. Pesan terbaru muncul di sini.</span>';
  let lastId = null;

  const getToken = () => {
    const t = token.value.trim();
    if (!t) { T.show(box, errBox('Tempel dulu token botnya.')); return null; }
    if (t.length < 20 || t.indexOf(':') < 1) { T.show(box, errBox('Token bot selalu ada titik duanya. Cek lagi hasil salinannya.')); return null; }
    return t;
  };

  const callApi = (t, params) => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 20000);
    return fetch('https://api.telegram.org/bot' + t + '/getUpdates' + params, { signal: ctrl.signal })
      .then((res) => res.json().then((j) => ({ status: res.status, j })))
      .finally(() => clearTimeout(timer));
  };

  const apiError = (status, j) => {
    if (status === 401 || (j && j.error_code === 401)) return 'Token salah atau sudah tidak berlaku. Salin lagi token dari @BotFather, lalu coba lagi.';
    if (j && j.error_code === 409) return 'Ada sesi lain yang sedang mengambil pesan bot ini, misalnya webhook atau program lain. Hentikan dulu sesi itu, lalu coba lagi.';
    if (j && j.error_code === 429) return 'Telegram minta tunggu sebentar karena terlalu banyak permintaan. Coba lagi beberapa detik lagi.';
    return 'Telegram menjawab: ' + ((j && j.description) || ('HTTP ' + status));
  };

  const netError = (e) => {
    if (e && e.name === 'AbortError') return 'Permintaan ke Telegram kehabisan waktu. Cek koneksi internet lalu coba lagi.';
    return 'Tidak bisa menghubungi Telegram. Cek koneksi internet lalu coba lagi.';
  };

  const load = () => {
    const t = getToken();
    if (!t) return;
    T.show(box, '<span class="dim">Mengambil pesan masuk…</span>');
    callApi(t, '?limit=' + limit.value)
      .then(({ status, j }) => {
        if (!j || !j.ok) { T.show(box, errBox(apiError(status, j))); return; }
        const list = j.result || [];
        if (!list.length) {
          T.show(box, '<span class="warn">Belum ada pesan masuk. Kirim pesan ke bot dulu, lalu tekan Lihat pesan masuk lagi.</span>');
          return;
        }
        lastId = list[list.length - 1].update_id;
        const cards = list.slice().reverse().map((u) => {
          const d = describeUpdate(u);
          const when = d.date ? new Date(d.date * 1000).toLocaleString('id-ID') : '-';
          return '<div style="border:1px solid #2e2823;border-radius:8px;padding:10px 12px;margin-bottom:8px">'
            + '<div style="display:flex;justify-content:space-between;gap:8px;font-size:12px;color:#c9bda9"><span>' + esc(d.kind) + '</span><span>' + esc(when) + '</span></div>'
            + '<div style="font-size:13px;margin-top:6px;word-break:break-word">' + esc(d.text) + '</div>'
            + '<div style="font-size:12px;color:#c9bda9;margin-top:6px">' + esc(d.sender) + ' · ' + esc(d.chat) + '</div>'
            + '</div>';
        }).join('');
        T.show(box, '<div class="dim" style="margin-bottom:8px">' + list.length + ' pesan terbaru, yang paling baru di atas.</div>' + cards);
      })
      .catch((e) => { T.show(box, errBox(netError(e))); });
  };

  const clearQueue = () => {
    const t = getToken();
    if (!t) return;
    if (lastId == null) { T.toast('Lihat pesan masuk dulu sebelum menghapus antrean.'); return; }
    T.show(box, '<span class="dim">Menghapus antrean…</span>');
    callApi(t, '?offset=' + (lastId + 1) + '&limit=1')
      .then(({ status, j }) => {
        if (!j || !j.ok) { T.show(box, errBox(apiError(status, j))); return; }
        lastId = null;
        T.show(box, '<div style="color:#4ade80;font-size:13px">Antrean sudah dibersihkan. Pesan lama tidak akan muncul lagi.</div>');
      })
      .catch((e) => { T.show(box, errBox(netError(e))); });
  };

  const clearBtn = T.btn('Hapus antrean', clearQueue);
  clearBtn.classList.add('danger');

  root.appendChild(T.el('<div class="warn">Tombol Hapus antrean akan menghapus pesan dari antrean bot. Pesan yang sudah dihapus tidak bisa diambil lagi oleh webhook atau program lain. Melihat pesan saja tidak menghapus apa-apa.</div>'));
  root.appendChild(T.grid2(T.field('Token bot', token, 'Token didapat dari @BotFather.'), T.field('Jumlah pesan', limit)));
  root.appendChild(showRow);
  root.appendChild(T.row(T.btn('Lihat pesan masuk', load, true), clearBtn));
  root.appendChild(box);
  root.appendChild(T.el('<div class="hint">Token dikirim langsung dari browser ke api.telegram.org. Token tidak disimpan di sini dan tidak lewat server Adip Tools.</div>'));
  T.show(box, emptyHtml);
}
