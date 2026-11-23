import { h as T, esc, errBox } from '../../core.js';

export const meta = {"id":"ringkasan-wikipedia","name":"Ringkasan Wikipedia","cat":"liveapi","icon":"📖","desc":"Ringkasan artikel Wikipedia apa pun, dalam bahasa Indonesia atau Inggris.","keywords":"wikipedia,ringkasan,artikel,ensiklopedia,cari tahu","since":"6.16.0", "online": true};

// Hanya tautan https yang dirender sebagai <a> — skema lain (javascript:,
// data:, ...) dari respons API TIDAK pernah jadi tautan yang bisa diklik
// (RED-01, v6.16.0). Pola yang sama seperti radio-online.js.
const tautanAman = (u) => String(u || '').indexOf('https://') === 0;

export function render(root) {
  const box = T.out();
  const inp = T.input('text', 'Contoh: Indonesia, Albert Einstein, Candi Borobudur');
  inp.setAttribute('autocomplete', 'off');
  const selBahasa = T.select([['id', 'Bahasa Indonesia'], ['en', 'Bahasa Inggris']], 'id');

  const cari = async () => {
    const q = inp.value.trim();
    if (!q) { T.show(box, errBox('Tulis topik dulu.')); return; }
    const lang = selBahasa.value;
    T.show(box, '<p class="mut">Mencari ringkasan "' + esc(q) + '" di Wikipedia…</p>');
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 15000);
    try {
      const r = await fetch('https://' + lang + '.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(q), { signal: ctrl.signal });
      if (r.status === 404) {
        T.show(box, '<p class="center dim">Artikel "' + esc(q) + '" tidak ditemukan di Wikipedia ' + (lang === 'id' ? 'Indonesia' : 'Inggris') + '.</p><p class="hint center">Coba ejaan lain, nama yang lebih umum, atau ganti bahasa.</p>');
        return;
      }
      if (!r.ok) throw new Error('http ' + r.status);
      const j = await r.json();
      if (!j || !j.extract) {
        T.show(box, '<p class="center dim">Artikel ditemukan, tapi tidak ada ringkasan yang bisa ditampilkan.</p>');
        return;
      }
      const tautan = j.content_urls && j.content_urls.desktop && j.content_urls.desktop.page;
      let html = '<div style="display:flex;gap:12px;align-items:flex-start;flex-wrap:wrap">' +
        (j.thumbnail && j.thumbnail.source ? '<img src="' + esc(j.thumbnail.source) + '" alt="" loading="lazy" style="width:120px;border-radius:8px;flex:none">' : '') +
        '<div style="flex:1;min-width:200px"><div style="font-weight:800;font-size:18px;line-height:1.3">' + esc(j.title || q) + '</div>' +
        (j.description ? '<div class="dim" style="font-size:13px;margin-top:2px">' + esc(j.description) + '</div>' : '') + '</div></div>' +
        '<p style="font-size:14.5px;line-height:1.7;margin:12px 0">' + esc(j.extract) + '</p>';
      if (tautan && tautanAman(tautan)) html += '<div><a class="btn" href="' + esc(tautan) + '" target="_blank" rel="noopener">Baca artikel lengkap di Wikipedia</a></div>';
      html += '<p class="hint">Sumber: Wikipedia, lisensi CC BY-SA.</p>';
      T.show(box, html);
    } catch (e) {
      const msg = e.name === 'AbortError'
        ? 'Waktu habis, server Wikipedia tidak bisa dihubungi dalam 15 detik.'
        : 'Gagal mencari artikel. Cek koneksi internet, lalu coba lagi.';
      T.show(box, errBox(msg));
      const wr = T.el('<div style="margin-top:8px"></div>');
      wr.appendChild(T.btn('🔄 Coba lagi', cari));
      box.appendChild(wr);
    } finally { clearTimeout(timer); }
  };

  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') cari(); });
  root.appendChild(T.field('Topik', inp));
  root.appendChild(T.field('Bahasa', selBahasa));
  root.appendChild(T.row(T.btn('🔍 Cari ringkasan', cari, true)));
  root.appendChild(box);
}
