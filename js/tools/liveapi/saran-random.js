import { h as T, esc } from '../../core.js?v=6.9.5';

export const meta = {"id":"saran-random","name":"Saran Acak","cat":"liveapi","icon":"💡","desc":"Kata-kata bijak & saran acak dari Advice Slip.","keywords":"saran,nasehat,kata bijak,motivasi,advice,random"};

export function render(root) {
  const box = T.out();

  const muat = async () => {
    T.show(box, '<div class="dim center">Mengambil saran…</div>');
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 15000);
    let status = 0;
    try {
      // cache-buster: API ini agresif di-cache, ?t= cegah saran mengulang
      const res = await fetch('https://api.adviceslip.com/advice?t=' + Date.now(), { signal: ctrl.signal });
      clearTimeout(timer);
      status = res.status;
      if (!res.ok) throw new Error('HTTP ' + res.status + ' dari server.');
      const d = await res.json();
      if (!d || !d.slip || !d.slip.advice) throw new Error('Respons API tidak lengkap.');
      const html = '<div class="center">' +
        '<div style="font-size:40px;margin-bottom:10px">💡</div>' +
        '<div class="big" style="line-height:1.5">“' + esc(d.slip.advice) + '”</div>' +
        '<div class="dim" style="margin-top:8px">Saran #' + esc(String(d.slip.id)) + '</div></div>';
      T.show(box, html);
      const wrap = T.el('<div class="row" style="margin-top:10px"></div>');
      wrap.appendChild(T.btn('📋 Salin', () => T.copy(d.slip.advice)));
      box.appendChild(wrap);
    } catch (e) {
      clearTimeout(timer);
      let msg;
      if (e.name === 'AbortError') msg = 'Waktu permintaan habis (timeout 15 detik). Koneksi lambat atau server tidak merespons.';
      else if (status === 429) msg = 'Rate limit tercapai (429). Tunggu sebentar lalu coba lagi.';
      else msg = 'Gagal memuat saran. Periksa koneksi internet lalu coba lagi.';
      T.show(box, '<span class="err">' + esc(msg) + '</span><br><span class="dim">(' + esc(e.message || e) + ')</span>');
      const wrap = T.el('<div style="margin-top:8px"></div>');
      wrap.appendChild(T.btn('🔄 Coba lagi', muat));
      box.appendChild(wrap);
    }
  };

  root.appendChild(T.row(T.btn('💡 Saran lain', muat, true)));
  root.appendChild(box);
  muat();
}
