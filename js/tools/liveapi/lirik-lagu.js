import { h as T, esc } from '../../core.js';

export const meta = {"id":"lirik-lagu","name":"Lirik Lagu","cat":"liveapi","icon":"🎤","desc":"Cari lirik lagu dari penyanyi & judul lagu favoritmu.","keywords":"lirik,lagu,musik,penyanyi,lyrics,teks lagu","since":"6.12.0"};

const API = 'https://api.lyrics.ovh/v1/';

export function render(root) {
  const artis = T.input('text', 'Nama penyanyi, mis. Coldplay…', '');
  const judul = T.input('text', 'Judul lagu, mis. Yellow…', '');
  const box = T.out();
  const cache = new Map();

  const cari = async () => {
    const a = artis.value.trim();
    const t = judul.value.trim();
    if (!a || !t) { T.toast && T.toast('Isi nama penyanyi & judul lagunya'); return; }
    T.show(box, '<div class="dim center">Mencari lirik "' + esc(t) + '"…</div>');
    const key = a.toLowerCase() + '|' + t.toLowerCase();
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 15000);
    let status = 0;
    try {
      let j;
      if (cache.has(key)) {
        j = cache.get(key);
      } else {
        const res = await fetch(API + encodeURIComponent(a) + '/' + encodeURIComponent(t), { signal: ctrl.signal });
        clearTimeout(timer);
        status = res.status;
        if (status === 404) {
          T.show(box, '<div class="dim center">Lirik "' + esc(t) + '" dari ' + esc(a) + ' tidak ditemukan. Periksa ejaan nama penyanyi & judulnya, atau coba lagu lain.</div>');
          return;
        }
        if (!res.ok) throw new Error('HTTP ' + res.status + ' dari server.');
        j = await res.json();
        cache.set(key, j);
      }
      const lirik = (j && j.lyrics || '').trim();
      if (!lirik) {
        T.show(box, '<div class="dim center">Lirik lagu ini kosong di database. Coba lagu lain.</div>');
        return;
      }
      let html = '<div class="center"><div style="font-weight:700;font-size:15px">' + esc(t) + '</div>' +
        '<div class="dim">' + esc(a) + '</div></div>' +
        '<pre style="white-space:pre-wrap;margin-top:12px;line-height:1.7">' + esc(lirik) + '</pre>';
      T.show(box, html);
      const wrap = T.el('<div style="margin-top:8px"></div>');
      wrap.appendChild(T.btn('📋 Salin lirik', () => T.copy(lirik)));
      box.appendChild(wrap);
    } catch (e) {
      clearTimeout(timer);
      let msg;
      if (e.name === 'AbortError') msg = 'Waktu permintaan habis (timeout 15 detik). Koneksi lambat atau server tidak merespons.';
      else if (status === 429) msg = 'Terlalu banyak permintaan — tunggu sebentar lalu coba lagi.';
      else msg = 'Gagal mencari lirik. Periksa koneksi internet lalu coba lagi.';
      T.show(box, '<span class="err">' + esc(msg) + '</span>');
      const wrap = T.el('<div style="margin-top:8px"></div>');
      wrap.appendChild(T.btn('🔄 Coba lagi', cari));
      box.appendChild(wrap);
    }
  };

  root.appendChild(T.field('Nama penyanyi', artis));
  root.appendChild(T.field('Judul lagu', judul));
  root.appendChild(T.row(T.btn('🎵 Cari lirik', cari, true)));
  root.appendChild(box);
  const enter = (e) => { if (e.key === 'Enter') cari(); };
  artis.addEventListener('keydown', enter);
  judul.addEventListener('keydown', enter);
}
