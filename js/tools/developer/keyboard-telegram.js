import { h as T, esc, errBox, preHtml } from '../../core.js?v=6.12.0';

export const meta = {"id": "keyboard-telegram", "name": "Pembuat Tombol Inline Telegram", "cat": "developer", "icon": "⌨️", "desc": "Susun tombol inline bot Telegram dan salin JSON inline_keyboard siap pakai.", "keywords": "telegram,inline keyboard,tombol,bot api,json,callback", "since": "6.11.0"};

// rows: array baris, tiap baris array tombol {text, type, value}.
// type 'url' = buka tautan, 'callback_data' = kirim data ke bot.
// Mengembalikan { errors, data }. data null bila ada kesalahan.
export function buildKeyboard(rows) {
  const errors = [];
  const kb = [];
  rows.forEach((btns, ri) => {
    const row = [];
    btns.forEach((b, bi) => {
      const where = 'Baris ' + (ri + 1) + ' tombol ke-' + (bi + 1);
      const text = (b.text || '').trim();
      const value = (b.value || '').trim();
      if (!text) { errors.push(where + ' belum ada teksnya.'); return; }
      if (b.type === 'url') {
        if (!/^https?:\/\/.+/i.test(value) && !/^tg:\/\/.+/i.test(value)) {
          errors.push(where + ': tautan harus diawali http:// atau https://.');
          return;
        }
        row.push({ text, url: value });
      } else {
        const bytes = new TextEncoder().encode(value).length;
        if (!value) { errors.push(where + ': data callback belum diisi.'); return; }
        if (bytes > 64) { errors.push(where + ': data callback lebih dari 64 byte.'); return; }
        row.push({ text, callback_data: value });
      }
    });
    if (row.length) kb.push(row);
  });
  return { errors, data: errors.length ? null : { inline_keyboard: kb } };
}

export function render(root) {
  const rowsBox = T.el('<div style="display:flex;flex-direction:column;gap:12px;margin:10px 0"></div>');
  const box = T.out();
  const emptyHtml = '<span class="dim">Isi tombol di atas. JSON dan pratinjau muncul di sini.</span>';

  const renumber = () => {
    rowsBox.querySelectorAll('[data-kb-row]').forEach((rowEl, i) => {
      rowEl.querySelector('[data-kb-label]').textContent = 'Baris ' + (i + 1);
    });
  };

  const readRows = () => {
    const rows = [];
    rowsBox.querySelectorAll('[data-kb-row]').forEach((rowEl) => {
      const btns = [];
      rowEl.querySelectorAll('[data-kb-btn]').forEach((btnEl) => {
        const ins = btnEl.querySelectorAll('input, select');
        btns.push({ text: ins[0].value, type: ins[1].value, value: ins[2].value });
      });
      rows.push(btns);
    });
    return rows;
  };

  const update = () => {
    const rows = readRows();
    const total = rows.reduce((n, r) => n + r.length, 0);
    if (!total) { T.show(box, emptyHtml); return; }
    const { errors, data } = buildKeyboard(rows);
    if (errors.length) { T.show(box, errBox(errors.join(' '))); return; }
    if (!data.inline_keyboard.length) { T.show(box, emptyHtml); return; }
    const json = JSON.stringify(data, null, 2);
    const preview = data.inline_keyboard.map((row) =>
      '<div style="display:flex;gap:6px;margin-bottom:6px">' + row.map((b) =>
        '<span style="flex:1;text-align:center;padding:8px 10px;border:1px solid #3a332a;border-radius:8px;background:#1c1915;font-size:13px;word-break:break-word">' + esc(b.text) + '</span>'
      ).join('') + '</div>'
    ).join('');
    T.show(box, '');
    box.appendChild(T.el('<div class="dim" style="margin-bottom:8px">Pratinjau tombol</div>'));
    const pv = T.el('<div style="margin-bottom:14px"></div>');
    pv.innerHTML = preview;
    box.appendChild(pv);
    box.appendChild(T.el('<div class="dim" style="margin-bottom:8px">JSON inline_keyboard</div>'));
    const pre = T.el('<div></div>');
    pre.innerHTML = preHtml(json);
    box.appendChild(pre);
    box.appendChild(T.row(
      T.copyBtn(() => json, 'Salin JSON'),
      T.dlBtn('inline_keyboard.json', () => json, 'application/json;charset=utf-8', 'Unduh JSON')
    ));
  };

  const addButton = (btnsBox, preset) => {
    const btns = btnsBox.querySelectorAll('[data-kb-btn]').length;
    if (btns >= 8) { T.toast('Satu baris maksimal 8 tombol.'); return; }
    const total = rowsBox.querySelectorAll('[data-kb-btn]').length;
    if (total >= 100) { T.toast('Total maksimal 100 tombol.'); return; }
    const el = T.el('<div data-kb-btn style="display:flex;gap:8px;align-items:center"></div>');
    const text = T.input('text', 'Teks tombol', preset ? preset.text : '');
    const type = T.select([['url', 'Buka tautan'], ['callback_data', 'Kirim data ke bot']], preset ? preset.type : 'url');
    const value = T.input('text', preset && preset.type === 'callback_data' ? 'data_callback' : 'https://contoh.com', preset ? preset.value : '');
    text.style.flex = '1';
    value.style.flex = '2';
    type.style.flexShrink = '0';
    type.addEventListener('change', () => {
      value.placeholder = type.value === 'callback_data' ? 'data_callback' : 'https://contoh.com';
    });
    const del = T.btn('✕', () => { el.remove(); update(); });
    del.style.flexShrink = '0';
    el.appendChild(text);
    el.appendChild(type);
    el.appendChild(value);
    el.appendChild(del);
    btnsBox.appendChild(el);
  };

  const addRow = (presetBtns) => {
    const rowEl = T.el('<div data-kb-row style="border:1px solid #2e2823;border-radius:8px;padding:10px"></div>');
    const head = T.el('<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px"></div>');
    head.appendChild(T.el('<span data-kb-label style="font-size:13px;font-weight:600">Baris</span>'));
    const spacer = T.el('<span style="flex:1"></span>');
    head.appendChild(spacer);
    const btnsBox = T.el('<div style="display:flex;flex-direction:column;gap:8px"></div>');
    head.appendChild(T.btn('＋ Tombol', () => { addButton(btnsBox, null); update(); }));
    head.appendChild(T.btn('Hapus baris', () => { rowEl.remove(); renumber(); update(); }));
    rowEl.appendChild(head);
    rowEl.appendChild(btnsBox);
    rowsBox.appendChild(rowEl);
    (presetBtns || [{ text: '', type: 'url', value: '' }]).forEach((p) => addButton(btnsBox, p));
    renumber();
  };

  rowsBox.addEventListener('input', update);
  rowsBox.addEventListener('change', update);

  root.appendChild(T.el('<div class="hint">Susun tombol untuk pesan bot. Satu baris maksimal 8 tombol. JSON dan pratinjau berubah mengikuti isian.</div>'));
  root.appendChild(T.el('<div class="hint">Pilih Buka tautan bila tombol membuka situs. Pilih Kirim data ke bot bila tombol mengirim kode singkat ke bot (maksimal 64 byte).</div>'));
  root.appendChild(rowsBox);
  root.appendChild(T.row(T.btn('＋ Tambah baris', () => { addRow(null); update(); })));
  root.appendChild(box);
  addRow([{ text: 'Kunjungi situs', type: 'url', value: 'https://example.com' }]);
  update();
}
