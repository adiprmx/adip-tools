import { h as T, utils, errBox, kv, onLeave } from '../../core.js?v=6.9.20';

export const meta = {"id": "danbooru", "name": "Danbooru Search", "cat": "gambar", "icon": "🎨", "desc": "Cari ilustrasi anime dari Danbooru berdasarkan tag.", "keywords": "danbooru,anime,ilustrasi,tag,gambar,fanart"};

const API = 'https://danbooru.donmai.us/posts.json';
const PER_PAGE = 24;
const UA = 'AdipTools/6.9.19 (https://tools.adipmusic.my.id)';
const cache = new Map(); // cache sesi: query -> hasil

const ratingBadge = (r) => r === 'g' ? '<span style="color:#7ccf8f">SAFE</span>'
  : r === 's' ? '<span style="color:#fbbf24">SENSITIF</span>'
  : '<span style="color:#f87171">DEWASA</span>';

export function render(root) {
  let ctl = null, page = 1, lastTags = '', lastMode = 'safe';
  let nsfwOk = false;
  onLeave(() => { if (ctl) ctl.abort(); });

  const tagInp = T.input('text', 'hatsune_miku  (maks 200 karakter)', '');
  tagInp.maxLength = 200;
  tagInp.autocomplete = 'off';
  tagInp.style.fontFamily = 'monospace';
  const modeSel = T.select([['safe', 'Mode Aman (SFW)'], ['nsfw', 'Mode NSFW (18+)']], 'safe');
  const out = T.out();
  const grid = T.out();
  const pager = T.out();
  const detail = T.out();

  const effTags = (tags, mode) => {
    const t = tags.trim().replace(/\s+/g, ' ');
    if (mode === 'safe' && !/(^|\s)rating:/i.test(t)) return (t ? t + ' ' : '') + 'rating:general';
    return t;
  };

  const cari = async (p) => {
    const rawTags = tagInp.value.trim();
    const mode = modeSel.value;
    if (!rawTags) { T.show(out, errBox('Isi dulu tag pencariannya — mis. hatsune_miku')); return; }
    if (mode === 'nsfw' && !nsfwOk) { tampilGate(() => { nsfwOk = true; cari(p); }); return; }
    page = p || 1;
    lastTags = rawTags; lastMode = mode;
    const tags = effTags(rawTags, mode);
    const key = tags + '|p' + page;
    T.hide(detail); T.hide(pager);
    if (cache.has(key)) { tampilHasil(cache.get(key)); return; }
    if (ctl) ctl.abort();
    ctl = new AbortController();
    T.show(out, '<p class="dim">Mencari ilustrasi…</p>');
    T.hide(grid);
    try {
      const url = API + '?tags=' + encodeURIComponent(tags) + '&limit=' + PER_PAGE + '&page=' + page;
      const r = await fetch(url, { signal: ctl.signal, headers: { 'User-Agent': UA } });
      if (!r.ok) throw new Error('http ' + r.status);
      const j = await r.json();
      cache.set(key, j);
      tampilHasil(j);
    } catch (e) {
      if (e.name === 'AbortError') return;
      T.show(out, errBox('Gagal mencari: ' + e.message + '. Cek koneksi / tag-nya.'));
    }
  };

  const tampilGate = (lanjut) => {
    T.show(out,
      '<div style="border:1px solid #f87171;border-radius:12px;padding:16px;background:#1a1214">' +
      '<b>Peringatan konten dewasa</b><p class="dim" style="font-size:13px;line-height:1.6">Mode NSFW menampilkan ilustrasi dewasa dari Danbooru. Hanya untuk 18 tahun ke atas.</p>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" data-g="no">Batal</button>' +
      '<button class="btn primary" data-g="yes">Saya 18+ — Lanjutkan</button></div></div>');
    out.querySelector('[data-g=no]').onclick = () => { modeSel.value = 'safe'; T.hide(out); };
    out.querySelector('[data-g=yes]').onclick = () => { T.hide(out); lanjut(); };
  };

  const tampilHasil = (j) => {
    T.hide(out);
    const items = (j || []).filter((p) => p && p.preview_file_url);
    if (!items.length) {
      T.show(grid, '<p class="dim">Tidak ada hasil untuk tag itu. Coba tag lain (format Danbooru: underscore, mis. <b>1girl</b>, <b>scenery</b>).</p>');
      return;
    }
    T.toast(items.length + ' hasil ditemukan');
    T.show(grid,
      '<p class="dim" style="font-size:12.5px">Menampilkan ' + items.length + ' hasil · halaman ' + page + '</p>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:8px">' +
      items.map((p) =>
        '<button data-pid="' + p.id + '" style="border:1px solid #ffffff18;border-radius:10px;overflow:hidden;background:#161311;padding:0;cursor:pointer">' +
        '<img src="' + T.esc(p.preview_file_url) + '" alt="" loading="lazy" style="width:100%;height:110px;object-fit:cover;display:block">' +
        '</button>').join('') + '</div>');
    grid.querySelectorAll('[data-pid]').forEach((b) => {
      b.onclick = () => lihatDetail(items.find((x) => String(x.id) === b.getAttribute('data-pid')));
    });
    T.show(pager, '<div style="display:flex;gap:8px;margin-top:12px">' +
      (page > 1 ? '<button class="btn" data-pg="prev">← Sebelumnya</button>' : '') +
      '<button class="btn primary" data-pg="next">Berikutnya →</button></div>');
    const pv = pager.querySelector('[data-pg=prev]'); if (pv) pv.onclick = () => cari(page - 1);
    pager.querySelector('[data-pg=next]').onclick = () => cari(page + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const lihatDetail = (p) => {
    if (!p) return;
    const artist = (p.tag_string_artist || '').split(' ').filter(Boolean).slice(0, 6);
    const tags = (p.tag_string || '').split(' ').filter(Boolean);
    const img = p.large_file_url || p.file_url;
    T.show(detail,
      '<div style="border:1px solid #ffffff20;border-radius:12px;padding:14px;margin-top:12px;background:#161311">' +
      '<img src="' + T.esc(img) + '" alt="" style="width:100%;border-radius:10px;display:block">' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;align-items:center">' +
      kv('Rating', ratingBadge(p.rating)) + kv('Ukuran', T.esc((p.image_width || '?') + '×' + (p.image_height || '?'))) +
      kv('Skor', T.esc(String(p.score || 0))) + kv('Favorit', T.esc(String(p.fav_count || 0))) + '</div>' +
      (artist.length ? '<p style="font-size:13px;margin:10px 0 0"><b>Artist:</b> ' + artist.map((a) => T.esc(a)).join(', ') + '</p>' : '') +
      '<p class="dim" style="font-size:12px;margin:8px 0 4px"><b>Tag (' + tags.length + '):</b></p>' +
      '<div style="font-size:12px;font-family:monospace;max-height:110px;overflow:auto;border:1px solid #ffffff12;border-radius:8px;padding:8px;word-break:break-all">' +
      tags.map((t) => '<a href="#" data-tag="' + T.esc(t) + '" style="color:#8ab8ff">' + T.esc(t) + '</a>').join(' ') + '</div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">' +
      '<button class="btn" data-d="copy">Salin URL Gambar</button>' +
      '<button class="btn" data-d="dl">Unduh</button>' +
      (p.source ? '<a class="btn" href="' + T.esc(p.source) + '" target="_blank" rel="noopener" style="text-decoration:none">Sumber</a>' : '') +
      '<button class="btn" data-d="x">Tutup</button></div></div>');
    detail.querySelectorAll('[data-tag]').forEach((a) => {
      a.onclick = (e) => { e.preventDefault(); tagInp.value = a.getAttribute('data-tag'); cari(1); };
    });
    detail.querySelector('[data-d=copy]').onclick = () => T.copy(img);
    detail.querySelector('[data-d=x]').onclick = () => T.hide(detail);
    detail.querySelector('[data-d=dl]').onclick = async () => {
      try {
        const r = await fetch(img);
        if (!r.ok) throw new Error('http ' + r.status);
        const b = await r.blob();
        const a = document.createElement('a');
        a.href = URL.createObjectURL(b);
        a.download = 'danbooru-' + p.id + '.jpg';
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      } catch (e) { window.open(img, '_blank', 'noopener'); }
    };
    detail.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  };

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Cari ilustrasi anime dari Danbooru berdasarkan tag (mis. <b>hatsune_miku</b>, <b>scenery</b>, <b>1girl solo</b>). Klik thumbnail untuk detail & unduh. Sumber: danbooru.donmai.us (publik).</p>'));
  root.appendChild(T.field('Tag pencarian', tagInp, 'Pisahkan beberapa tag dengan spasi. Format Danbooru pakai underscore.'));
  root.appendChild(T.field('Mode', modeSel));
  root.appendChild(T.row(T.btn('Cari', () => cari(1), true)));
  root.appendChild(out);
  root.appendChild(grid);
  root.appendChild(pager);
  root.appendChild(detail);
}
