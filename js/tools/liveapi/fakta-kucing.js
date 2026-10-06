import { h as T, esc } from '../../core.js?v=6.9.5';

export const meta = {"id":"fakta-kucing","name":"Fakta Kucing","cat":"liveapi","icon":"🐱","desc":"Fakta acak tentang kucing dalam bahasa Inggris asli.","keywords":"kucing,fakta,cat,fun,random"};

export function render(root) {
  const box = T.out();
  let faktaTerakhir = '';

  const muat = async () => {
    T.show(box, '<div class="dim center">Mengambil fakta kucing…</div>');
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 15000);
    let status = 0;
    try {
      const res = await fetch('https://catfact.ninja/fact', { signal: ctrl.signal });
      clearTimeout(timer);
      status = res.status;
      if (!res.ok) throw new Error('HTTP ' + res.status + ' dari server.');
      const d = await res.json();
      if (!d || !d.fact) throw new Error('Respons API tidak lengkap.');
      faktaTerakhir = d.fact;
      const html = '<div class="center">' +
        '<div style="font-size:40px;margin-bottom:10px">🐱</div>' +
        '<div class="big" style="line-height:1.5">' + esc(d.fact) + '</div></div>';
      T.show(box, html);
      const wrap = T.el('<div class="row" style="margin-top:10px"></div>');
      wrap.appendChild(T.btn('📋 Salin', () => T.copy(faktaTerakhir)));
      box.appendChild(wrap);
    } catch (e) {
      clearTimeout(timer);
      let msg;
      if (e.name === 'AbortError') msg = 'Waktu permintaan habis (timeout 15 detik). Koneksi lambat atau server tidak merespons.';
      else if (status === 429) msg = 'Rate limit tercapai (429). Tunggu sebentar lalu coba lagi.';
      else msg = 'Gagal memuat fakta. Periksa koneksi internet lalu coba lagi.';
      T.show(box, '<span class="err">' + esc(msg) + '</span><br><span class="dim">(' + esc(e.message || e) + ')</span>');
      const wrap = T.el('<div style="margin-top:8px"></div>');
      wrap.appendChild(T.btn('🔄 Coba lagi', muat));
      box.appendChild(wrap);
    }
  };

  root.appendChild(T.row(T.btn('🐱 Fakta lain', muat, true)));
  root.appendChild(box);
  muat();
}
