import { h as T, esc } from '../../core.js?v=6.9.5';

export const meta = {"id":"cari-buku","name":"Pencari Buku","cat":"liveapi","icon":"📚","desc":"Cari jutaan buku dari Open Library berdasarkan judul atau penulis.","keywords":"buku,cari,open library,judul,penulis,cover,isbn"};

export function render(root) {
  const q = T.input('text', 'Judul buku atau nama penulis…', '');
  const box = T.out();
  const detail = T.out();

  const tampilDetail = (d) => {
    T.hide(detail);
    const cover = d.cover_i
      ? '<img src="https://covers.openlibrary.org/b/id/' + d.cover_i + '-M.jpg" alt="cover" style="max-width:120px;height:auto;border-radius:8px;display:block;margin-bottom:8px" onerror="this.style.display=\'none\'">'
      : '';
    const rows = [
      ['Judul', d.title || '-'],
      ['Penulis', (d.author_name && d.author_name.join(', ')) || '-'],
      ['Tahun terbit pertama', d.first_publish_year != null ? String(d.first_publish_year) : '-'],
      ['Penerbit', (d.publisher && d.publisher.slice(0, 5).join(', ')) || '-'],
      ['Bahasa', (d.language && d.language.join(', ')) || '-'],
      ['ISBN', (d.isbn && d.isbn.slice(0, 3).join(', ')) || '-'],
      ['Jumlah edisi', d.edition_count != null ? String(d.edition_count) : '-']
    ];
    let html = '<div class="center">' + cover + '<div style="font-weight:700;font-size:15px">' + esc(d.title || 'Tanpa judul') + '</div></div>';
    rows.forEach((r) => {
      html += '<div class="kv"><span class="k">' + esc(r[0]) + '</span><span class="v">' + esc(r[1]) + '</span></div>';
    });
    T.show(detail, html);
  };

  const cari = async () => {
    const kw = q.value.trim();
    if (!kw) { T.toast ? T.toast('Ketik dulu judul atau penulisnya') : null; return; }
    T.hide(detail);
    T.show(box, '<div class="dim center">Mencari buku…</div>');
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 15000);
    let status = 0;
    try {
      const res = await fetch('https://openlibrary.org/search.json?q=' + encodeURIComponent(kw) + '&limit=12', { signal: ctrl.signal });
      clearTimeout(timer);
      status = res.status;
      if (!res.ok) throw new Error('HTTP ' + res.status + ' dari server.');
      const j = await res.json();
      const docs = (j && j.docs) || [];
      if (!docs.length) {
        T.show(box, '<div class="dim center">Tidak ada hasil untuk "' + esc(kw) + '". Coba kata kunci lain.</div>');
        return;
      }
      const list = T.el('<div></div>');
      list.appendChild(T.el('<div class="dim" style="margin-bottom:8px">Ketuk hasil untuk detail:</div>'));
      docs.forEach((d) => {
        const thumb = d.cover_i
          ? '<img src="https://covers.openlibrary.org/b/id/' + d.cover_i + '-S.jpg" alt="" style="width:40px;height:56px;object-fit:cover;border-radius:4px;flex-shrink:0" loading="lazy" onerror="this.remove()">'
          : '<div style="width:40px;height:56px;border-radius:4px;background:#27272a;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:18px">📕</div>';
        const item = T.el(
          '<button type="button" style="display:flex;gap:10px;align-items:center;width:100%;text-align:left;background:#18181b;border:1px solid #ffffff14;border-radius:10px;padding:8px;margin-bottom:8px;cursor:pointer;color:inherit">' +
          thumb +
          '<span><span style="display:block;font-weight:600;font-size:13.5px">' + esc(d.title || 'Tanpa judul') + '</span>' +
          '<span class="dim" style="display:block;font-size:12px">' + esc((d.author_name && d.author_name.join(', ')) || '-') + (d.first_publish_year ? ' · ' + esc(d.first_publish_year) : '') + '</span></span>' +
          '</button>'
        );
        item.addEventListener('click', () => { tampilDetail(d); T.scrollToPreview && T.scrollToPreview(detail); });
        list.appendChild(item);
      });
      T.show(box, '');
      box.appendChild(list);
    } catch (e) {
      clearTimeout(timer);
      let msg;
      if (e.name === 'AbortError') msg = 'Waktu permintaan habis (timeout 15 detik). Koneksi lambat atau server tidak merespons.';
      else if (status === 429) msg = 'Rate limit tercapai (429). Tunggu sebentar lalu coba lagi.';
      else msg = 'Gagal mencari buku. Periksa koneksi internet lalu coba lagi.';
      T.show(box, '<span class="err">' + esc(msg) + '</span><br><span class="dim">(' + esc(e.message || e) + ')</span>');
      const wrap = T.el('<div style="margin-top:8px"></div>');
      wrap.appendChild(T.btn('🔄 Coba lagi', cari));
      box.appendChild(wrap);
    }
  };

  root.appendChild(T.field('Kata kunci', q));
  root.appendChild(T.row(T.btn('🔍 Cari buku', cari, true)));
  root.appendChild(detail);
  root.appendChild(box);
  q.addEventListener('keydown', (e) => { if (e.key === 'Enter') cari(); });
}
