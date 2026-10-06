import { h as T, utils, esc } from '../../core.js?v=6.9.5';

export const meta = {"id": "quotes-random", "name": "Quotes Acak", "cat": "liveapi", "icon": "💬", "desc": "Dapatkan quotes inspiratif acak setiap kali dibuka.", "keywords": "quotes,kutipan,acak,inspirasi,motivasi,random,quote"};

export function render(root) {
  const box = T.out();

  const muat = async () => {
    T.show(box, '<div class="dim center">Mengambil quote…</div>');
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 15000);
    try {
      const res = await fetch('https://dummyjson.com/quotes/random', { signal: ctrl.signal });
      clearTimeout(timer);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const d = await res.json();
      if (!d || !d.quote) throw new Error('data tidak valid');
      T.show(box,
        '<div class="center" style="padding:12px 4px">' +
          '<div style="font-size:22px;line-height:1.6;font-weight:600">“' + esc(d.quote) + '”</div>' +
          '<div class="dim" style="margin-top:10px">— ' + esc(d.author || 'Anonim') + '</div>' +
        '</div>');
      const wrap = T.el('<div class="center" style="margin-top:12px"></div>');
      wrap.appendChild(T.btn('🔄 Quote lain', muat, true));
      box.appendChild(wrap);
    } catch (e) {
      clearTimeout(timer);
      const msg = (e && e.name === 'AbortError')
        ? 'Waktu habis — server quotes tidak merespons dalam 15 detik. Periksa koneksi internet lalu coba lagi.'
        : 'Gagal mengambil quote. Periksa koneksi internet lalu coba lagi.';
      T.show(box, '<span class="err">' + esc(msg) + '</span>');
      const wrap = T.el('<div class="mt8"></div>');
      wrap.appendChild(T.btn('🔄 Coba lagi', muat, true));
      box.appendChild(wrap);
    }
  };

  root.appendChild(box);
  muat();
}
