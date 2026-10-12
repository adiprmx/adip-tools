import { h as T, utils, errBox, kv, tabs, onLeave } from '../../core.js?v=6.9.20';

export const meta = {"id": "animegallery", "name": "Anime Discover", "cat": "fun", "icon": "🖼️", "desc": "Jelajah ilustrasi & GIF reaksi anime SFW dari sumber publik.", "keywords": "anime,waifu,neko,ilustrasi,reaction,gif,sfw"};

const NB = 'https://nekos.best/api/v2';
const DB = 'https://danbooru.donmai.us/posts.json';
const UA = 'AdipTools/6.9.19 (https://tools.adipmusic.my.id)';
const SAVE_KEY = 'at-animegallery-saved-v1';
const REAKSI = ['hug', 'kiss', 'wave', 'dance', 'cry', 'laugh', 'pat', 'poke', 'smile', 'blush', 'sleep', 'think', 'wink', 'highfive', 'handhold', 'cuddle', 'feed', 'tickle', 'smug', 'stare', 'shrug', 'nod', 'bored', 'facepalm', 'yeet'];
const ILAUSTRASI = ['waifu', 'neko', 'kitsune', 'husbando'];

const getSaved = () => { try { return JSON.parse(localStorage.getItem(SAVE_KEY) || '[]'); } catch (e) { return []; } };
const setSaved = (l) => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(l.slice(0, 50))); } catch (e) {} };

async function nbFetch(ep, amount, signal) {
  const r = await fetch(NB + '/' + ep + '?amount=' + amount, { signal });
  if (!r.ok) throw new Error('nekos.best: http ' + r.status);
  const j = await r.json();
  return (j.results || []).map((x) => ({
    img: x.url, thumb: x.url,
    artist: x.artist_name || '-', artistUrl: x.artist_href || '',
    source: x.source_url || '', anime: x.anime_name || '',
    tags: [], provider: 'nekos.best',
    w: x.dimensions ? x.dimensions.width : 0, h: x.dimensions ? x.dimensions.height : 0,
  }));
}
async function dbFetch(tags, amount, signal) {
  const t = (tags ? tags.trim().replace(/\s+/g, ' ') + ' ' : '') + 'rating:general';
  const r = await fetch(DB + '?tags=' + encodeURIComponent(t) + '&limit=' + amount, { signal, headers: { 'User-Agent': UA } });
  if (!r.ok) throw new Error('danbooru: http ' + r.status);
  const j = await r.json();
  return (j || []).filter((p) => p.large_file_url).map((p) => ({
    img: p.large_file_url, thumb: p.preview_file_url || p.large_file_url,
    artist: (p.tag_string_artist || '').split(' ').filter(Boolean).slice(0, 4).join(', ') || '-',
    artistUrl: '', source: p.source || '',
    anime: (p.tag_string_copyright || '').split(' ').filter(Boolean).slice(0, 3).join(', ') || '',
    tags: (p.tag_string || '').split(' ').filter(Boolean).slice(0, 40),
    provider: 'Danbooru', w: p.image_width || 0, h: p.image_height || 0,
  }));
}

const orientOf = (it) => {
  if (!it.w || !it.h) return 'square';
  const r = it.w / it.h;
  return r > 1.15 ? 'landscape' : r < 0.87 ? 'portrait' : 'square';
};

export function render(root) {
  let ctl = null, items = [], mode = 0;
  onLeave(() => { if (ctl) ctl.abort(); });
  const abort = () => { if (ctl) ctl.abort(); ctl = new AbortController(); return ctl.signal; };

  // kontrol
  const pJelajah = T.el('<div></div>');
  const pReaksi = T.el('<div></div>');
  const pCari = T.el('<div></div>');
  const pSimpan = T.el('<div></div>');

  const provSel = T.select([['all', 'Semua provider'], ['nekos.best', 'nekos.best'], ['Danbooru', 'Danbooru']], 'all');
  const oriSel = T.select([['all', 'Semua orientasi'], ['portrait', 'Portrait'], ['landscape', 'Landscape'], ['square', 'Kotak']], 'all');
  const artistInp = T.input('text', 'Filter artist (opsional)…', '');
  const tagInp = T.input('text', 'Cari tag… mis. hatsune_miku', '');
  tagInp.maxLength = 80; tagInp.autocomplete = 'off';
  tagInp.style.fontFamily = 'monospace';

  const out = T.out();
  const grid = T.out();
  const detail = T.out();

  const saring = () => {
    const po = provSel.value, oo = oriSel.value, af = artistInp.value.trim().toLowerCase();
    return items.filter((it) =>
      (po === 'all' || it.provider === po) &&
      (oo === 'all' || orientOf(it) === oo) &&
      (!af || (it.artist || '').toLowerCase().includes(af)));
  };

  const tampilGrid = () => {
    const l = saring();
    T.hide(detail);
    if (!l.length) { T.show(grid, '<p class="dim">Tidak ada yang cocok dengan filter. Longgarkan filternya atau muat lagi.</p>'); return; }
    T.show(grid, '<p class="dim" style="font-size:12.5px">' + l.length + ' gambar · SFW</p>' +
      '<div style="columns:2;column-gap:8px">' + l.map((it, i) =>
        '<button data-g="' + i + '" style="display:block;width:100%;border:1px solid #ffffff18;border-radius:10px;overflow:hidden;background:#161311;padding:0;margin:0 0 8px;cursor:pointer;break-inside:avoid">' +
        '<img src="' + T.esc(it.thumb) + '" alt="" loading="lazy" style="width:100%;display:block">' +
        '<div class="dim" style="font-size:10.5px;padding:5px 7px;text-align:left;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + T.esc(it.artist) + ' · ' + T.esc(it.provider) + '</div>' +
        '</button>').join('') + '</div>');
    const cur = l;
    grid.querySelectorAll('[data-g]').forEach((b) => { b.onclick = () => lihatDetail(cur[+b.getAttribute('data-g')]); });
  };

  const muat = async (fn, label) => {
    const sig = abort();
    T.show(out, '<p class="dim">' + T.esc(label) + '</p>');
    T.hide(grid); T.hide(detail);
    try {
      items = await fn(sig);
      if (!items.length) throw new Error('hasil kosong');
      T.hide(out); tampilGrid();
    } catch (e) {
      if (e.name === 'AbortError') return;
      T.show(out, errBox('Gagal memuat: ' + e.message + '. Coba lagi.'));
    }
  };

  const jelajah = () => muat(async (sig) => {
    const a = await nbFetch(ILAUSTRASI[Math.floor(Math.random() * ILAUSTRASI.length)], 12, sig);
    let b = [];
    try { b = await dbFetch('order:random', 12, sig); } catch (e) {}
    return [...a, ...b].sort(() => Math.random() - 0.5);
  }, 'Menjelajah ilustrasi acak…');

  const reaksi = (ep) => muat((sig) => nbFetch(ep, 16, sig), 'Memuat reaksi "' + ep + '"…');

  const cariTag = () => {
    const t = tagInp.value.trim();
    if (!t) { T.show(out, errBox('Isi dulu tag-nya — mis. hatsune_miku')); return; }
    muat((sig) => dbFetch(t, 24, sig), 'Mencari tag "' + t + '"…');
  };

  const acak = () => muat(async (sig) => {
    if (Math.random() < 0.5) return nbFetch(ILAUSTRASI[Math.floor(Math.random() * ILAUSTRASI.length)], 8, sig);
    return dbFetch('order:random', 8, sig);
  }, 'Mengambil kejutan…');

  const lihatSimpan = () => { items = getSaved(); T.hide(out); tampilGrid(); };

  const lihatDetail = (it) => {
    if (!it) return;
    const saved = getSaved().some((s) => s.img === it.img);
    T.show(detail,
      '<div style="border:1px solid #ffffff20;border-radius:12px;padding:14px;margin-top:12px;background:#161311">' +
      '<img src="' + T.esc(it.img) + '" alt="" style="width:100%;border-radius:10px;display:block">' +
      kv('Artist', it.artistUrl ? '<a href="' + T.esc(it.artistUrl) + '" target="_blank" rel="noopener" style="color:#8ab8ff">' + T.esc(it.artist) + ' ↗</a>' : T.esc(it.artist)) +
      (it.anime ? kv('Anime/Sumber', T.esc(it.anime)) : '') +
      kv('Provider', T.esc(it.provider)) +
      (it.tags && it.tags.length ? '<p class="dim" style="font-size:12px;margin:8px 0 4px"><b>Tag:</b></p><div style="font-size:12px;font-family:monospace;max-height:90px;overflow:auto">' + it.tags.map((t) => T.esc(t)).join(' ') + '</div>' : '') +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">' +
      '<button class="btn" data-d="copy">📋 Salin URL</button>' +
      '<button class="btn" data-d="share">📤 Bagikan</button>' +
      '<button class="btn" data-d="save">' + (saved ? '★ Tersimpan' : '☆ Simpan') + '</button>' +
      (it.source ? '<a class="btn" href="' + T.esc(it.source) + '" target="_blank" rel="noopener" style="text-decoration:none">🔗 Sumber</a>' : '') +
      '<button class="btn" data-d="x">✖ Tutup</button></div></div>');
    detail.querySelector('[data-d=copy]').onclick = () => T.copy(it.img);
    detail.querySelector('[data-d=x]').onclick = () => T.hide(detail);
    detail.querySelector('[data-d=save]').onclick = (e) => {
      let l = getSaved();
      l = saved ? l.filter((s) => s.img !== it.img) : [it, ...l];
      setSaved(l); e.target.textContent = saved ? '☆ Simpan' : '★ Tersimpan'; T.toast(saved ? 'Dihapus dari simpanan' : 'Tersimpan!');
    };
    detail.querySelector('[data-d=share]').onclick = async () => {
      if (navigator.share) { try { await navigator.share({ title: 'Anime Discover', url: it.img }); } catch (e) {} }
      else T.copy(it.img);
    };
    detail.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  };

  const bar = tabs([['🧭 Jelajah', 0], ['😄 Reaksi', 1], ['🔎 Cari Tag', 2], ['⭐ Tersimpan', 3]], [pJelajah, pReaksi, pCari, pSimpan]);
  const go = (i) => bar.querySelectorAll('button')[i].click();

  pJelajah.appendChild(T.el('<p class="dim" style="font-size:13px">Ilustrasi anime acak SFW dari nekos.best & Danbooru.</p>'));
  pJelajah.appendChild(T.row(T.btn('🎲 Jelajah Acak', jelajah, true), T.btn('✨ Kejutan', acak)));
  pReaksi.appendChild(T.el('<p class="dim" style="font-size:13px">Pilih reaksi — GIF/ilustrasi dari nekos.best.</p>'));
  const rg = T.el('<div style="display:flex;gap:6px;flex-wrap:wrap"></div>');
  REAKSI.forEach((r) => { const b = T.btn(r, () => reaksi(r)); b.style.fontSize = '12.5px'; rg.appendChild(b); });
  pReaksi.appendChild(rg);
  pCari.appendChild(T.field('Tag Danbooru (SFW otomatis)', tagInp, 'Contoh: hatsune_miku, scenery, 1girl solo'));
  pCari.appendChild(T.row(T.btn('🔎 Cari', cariTag, true)));
  pSimpan.appendChild(T.el('<p class="dim" style="font-size:13px">Gambar yang kamu simpan (tersimpan lokal di HP).</p>'));
  pSimpan.appendChild(T.row(T.btn('📂 Muat Simpanan', lihatSimpan, true)));

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Discovery visual anime — ilustrasi, artist, dan GIF reaksi. 100% SFW, sumber API publik (nekos.best & Danbooru), tanpa akun.</p>'));
  root.appendChild(bar);
  [pJelajah, pReaksi, pCari, pSimpan].forEach((p) => root.appendChild(p));
  root.appendChild(T.el('<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin:12px 0"></div>'));
  const frow = root.lastChild;
  frow.appendChild(T.field('Provider', provSel));
  frow.appendChild(T.field('Orientasi', oriSel));
  frow.appendChild(T.field('Artist', artistInp));
  provSel.onchange = oriSel.onchange = () => tampilGrid();
  artistInp.oninput = () => tampilGrid();
  root.appendChild(out);
  root.appendChild(grid);
  root.appendChild(detail);
}
