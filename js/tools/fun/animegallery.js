import { h as T, utils, errBox, kv, tabs, onLeave } from '../../core.js?v=6.9.20';

export const meta = {"id": "animegallery", "name": "Anime Discover", "cat": "fun", "icon": "🖼️", "desc": "Jelajah ilustrasi & GIF reaksi anime SFW dari Waifu.im & NEKOSBEST.", "keywords": "anime,waifu,neko,ilustrasi,reaction,gif,sfw"};

const NB = 'https://nekos.best/api/v2';
const WI = 'https://api.waifu.im/search/';
const WI_TAGS = 'https://api.waifu.im/tags';
const SAVE_KEY = 'at-animegallery-saved-v1';
const denganTimeout = (signal, ms) => {
  const to = AbortSignal.timeout(ms || 25000);
  return signal ? AbortSignal.any([signal, to]) : to;
};
const REAKSI = ['hug', 'kiss', 'wave', 'dance', 'cry', 'laugh', 'pat', 'poke', 'smile', 'blush', 'sleep', 'think', 'wink', 'highfive', 'handhold', 'cuddle', 'feed', 'tickle', 'smug', 'stare', 'shrug', 'nod', 'bored', 'facepalm', 'yeet'];
const ILAUSTRASI = ['waifu', 'neko', 'kitsune', 'husbando'];

const getSaved = () => { try { return JSON.parse(localStorage.getItem(SAVE_KEY) || '[]'); } catch (e) { return []; } };
const setSaved = (l) => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(l.slice(0, 50))); } catch (e) {} };

async function nbFetch(ep, amount, signal) {
  const r = await fetch(NB + '/' + ep + '?amount=' + amount, { signal: denganTimeout(signal) });
  if (!r.ok) throw new Error('NEKOSBEST: http ' + r.status);
  const j = await r.json();
  return (j.results || []).map((x) => ({
    img: x.url, thumb: x.url,
    artist: x.artist_name || '-', artistUrl: x.artist_href || '',
    source: x.source_url || '', anime: x.anime_name || '',
    tags: [], provider: 'NEKOSBEST',
    w: x.dimensions ? x.dimensions.width : 0, h: x.dimensions ? x.dimensions.height : 0,
    animated: /\.gif(\?|$)/i.test(x.url || ''),
  }));
}

function wiParams(o) {
  const p = new URLSearchParams();
  p.set('is_nsfw', 'false');
  p.set('many', 'true');
  (o.tags || []).forEach((t) => p.append('included_tags', t));
  (o.exclude || []).forEach((t) => p.append('excluded_tags', t));
  if (o.gif === true) p.set('gif', 'true');
  if (o.gif === false) p.set('gif', 'false');
  p.set('order_by', 'RANDOM');
  if (o.orientation && o.orientation !== 'all') p.set('orientation', o.orientation);
  if (o.minW > 0) p.set('width', '>=' + o.minW);
  if (o.minH > 0) p.set('height', '>=' + o.minH);
  return p.toString();
}

async function wiFetch(o, amount, signal) {
  const r = await fetch(WI + '?' + wiParams(o) + '&limit=' + amount, { signal: denganTimeout(signal), headers: { Accept: 'application/json' } });
  if (!r.ok) throw new Error('Waifu.im: http ' + r.status);
  const j = await r.json();
  return ((j && j.images) || []).map((im) => ({
    img: im.url, thumb: im.preview_url || im.url,
    artist: '-', artistUrl: '',
    source: im.source || '', anime: '',
    tags: (im.tags || []).map((t) => t.name).filter(Boolean),
    provider: 'Waifu.im', w: im.width || 0, h: im.height || 0,
    animated: im.extension === 'gif' || /\.gif(\?|$)/i.test(im.url || ''),
  }));
}

let tagCache = null;
async function wiTags(signal) {
  if (tagCache) return tagCache;
  const r = await fetch(WI_TAGS, { signal: denganTimeout(signal), headers: { Accept: 'application/json' } });
  if (!r.ok) throw new Error('http ' + r.status);
  const j = await r.json();
  tagCache = ((j && j.versatile) || []).map((t) => t.name).filter(Boolean).slice(0, 40);
  return tagCache;
}

const orientOf = (it) => {
  if (!it.w || !it.h) return 'square';
  const r = it.w / it.h;
  return r > 1.15 ? 'landscape' : r < 0.87 ? 'portrait' : 'square';
};

export function render(root) {
  let ctl = null, items = [], loader = null, loadingMore = false, io = null;
  onLeave(() => { if (ctl) ctl.abort(); if (io) io.disconnect(); });
  const abort = () => { if (ctl) ctl.abort(); ctl = new AbortController(); return ctl.signal; };

  const pJelajah = T.el('<div></div>');
  const pIlustrasi = T.el('<div></div>');
  const pReaksi = T.el('<div></div>');
  const pAcak = T.el('<div></div>');
  const pSimpan = T.el('<div></div>');

  const provSel = T.select([['all', 'Semua'], ['Waifu.im', 'Waifu.im'], ['NEKOSBEST', 'NEKOSBEST']], 'all');
  const oriSel = T.select([['all', 'Semua'], ['portrait', 'Portrait'], ['landscape', 'Landscape'], ['square', 'Kotak']], 'all');
  const animSel = T.select([['all', 'Semua'], ['still', 'Gambar diam'], ['gif', 'Animasi/GIF']], 'all');
  const minWInp = T.input('number', 'Min lebar (px)', '');
  const minHInp = T.input('number', 'Min tinggi (px)', '');
  minWInp.style.width = '100%'; minHInp.style.width = '100%';
  const searchInp = T.input('search', 'Cari tag… mis. maid', '');
  searchInp.maxLength = 80; searchInp.autocomplete = 'off';

  const notices = T.out();
  const chipsBox = T.out();
  const out = T.out();
  const grid = T.out();
  const detail = T.out();
  const moreBox = T.out();

  const animasiFilter = () => animSel.value === 'gif' ? true : animSel.value === 'still' ? false : null;
  const wiOpts = () => {
    const oo = oriSel.value;
    return {
      tags: [], exclude: [],
      gif: animasiFilter(),
      orientation: oo === 'portrait' ? 'PORTRAIT' : oo === 'landscape' ? 'LANDSCAPE' : oo === 'square' ? 'SQUARE' : 'all',
      minW: parseInt(minWInp.value, 10) || 0, minH: parseInt(minHInp.value, 10) || 0,
    };
  };

  const saring = () => {
    const po = provSel.value, oo = oriSel.value, an = animasiFilter();
    return items.filter((it) =>
      (po === 'all' || it.provider === po) &&
      (oo === 'all' || orientOf(it) === oo) &&
      (an === null || it.animated === an));
  };

  const tampilGrid = (append) => {
    const l = saring();
    T.hide(detail);
    if (!l.length) { T.show(grid, '<p class="dim">Tidak ada yang cocok dengan filter. Longgarkan filternya atau muat lagi.</p>'); T.hide(moreBox); return; }
    T.show(grid, '<p class="dim" style="font-size:12.5px">' + l.length + ' gambar · SFW</p>' +
      '<div style="columns:2;column-gap:8px">' + l.map((it, i) =>
        '<button data-g="' + i + '" style="display:block;width:100%;border:1px solid #ffffff18;border-radius:10px;overflow:hidden;background:#161311;padding:0;margin:0 0 8px;cursor:pointer;break-inside:avoid">' +
        '<img src="' + T.esc(it.thumb) + '" alt="" loading="lazy" style="width:100%;display:block">' +
        '<div class="dim" style="font-size:10.5px;padding:5px 7px;text-align:left;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + T.esc(it.artist) + ' · ' + T.esc(it.provider) + '</div>' +
        '</button>').join('') + '</div>');
    grid.querySelectorAll('[data-g]').forEach((b) => { b.onclick = () => lihatDetail(l[+b.getAttribute('data-g')]); });
    if (loader) {
      T.show(moreBox, '<div style="text-align:center;margin:10px 0"><button class="btn" data-m="1">Muat lebih banyak</button><div id="ag-sentinel" style="height:2px"></div></div>');
      moreBox.querySelector('[data-m]').onclick = () => muatLagi();
      pantauSentinel();
    } else T.hide(moreBox);
  };

  const pantauSentinel = () => {
    if (io) io.disconnect();
    const s = moreBox.querySelector('#ag-sentinel');
    if (!s || !('IntersectionObserver' in window)) return;
    io = new IntersectionObserver((es) => {
      if (es.some((e) => e.isIntersecting)) { io.disconnect(); muatLagi(); }
    }, { rootMargin: '400px' });
    io.observe(s);
  };

  const muatLagi = async () => {
    if (!loader || loadingMore) return;
    loadingMore = true;
    const sig = ctl ? ctl.signal : abort();
    try {
      const baru = (await loader(sig)).filter((x) => !items.some((y) => y.img === x.img));
      items = items.concat(baru);
      tampilGrid(true);
    } catch (e) { /* abaikan, tombol bisa ditekan lagi */ }
    loadingMore = false;
  };

  const muat = async (fn, label, lanjutkan) => {
    const sig = abort();
    T.show(out, '<p class="dim">' + T.esc(label) + '</p>');
    T.hide(grid); T.hide(detail); T.hide(moreBox); T.hide(notices);
    loader = lanjutkan ? fn : null;
    try {
      items = await fn(sig);
      if (!items.length) throw new Error('hasil kosong');
      T.hide(out); tampilGrid();
    } catch (e) {
      if (e.name === 'AbortError') return;
      T.show(out, errBox('Gagal memuat: ' + e.message + '. Coba lagi.'));
      loader = null;
    }
  };

  const campur = (a, b) => [...a, ...b].sort(() => Math.random() - 0.5);
  const catatanProvider = (gagal) => {
    if (gagal.length) T.show(notices, '<p class="dim" style="font-size:12.5px">Catatan: ' + gagal.map(T.esc).join(', ') + ' tidak merespons — menampilkan hasil dari provider lain.</p>');
  };

  const ambilCampuran = (wi, nbEp, jml) => async (sig) => {
    const gagal = [];
    let a = [], b = [];
    try { a = await wiFetch(wi, jml, sig); } catch (e) { gagal.push('Waifu.im'); }
    try { b = await nbFetch(nbEp, jml, sig); } catch (e) { gagal.push('NEKOSBEST'); }
    catatanProvider(gagal);
    if (!a.length && !b.length) throw new Error('semua provider gagal');
    return campur(a, b);
  };

  const jelajah = () => {
    const o = wiOpts();
    muat(ambilCampuran(o, ILAUSTRASI[Math.floor(Math.random() * ILAUSTRASI.length)], 12), 'Menjelajah galeri…', true);
    loader = ambilCampuran(wiOpts(), ILAUSTRASI[Math.floor(Math.random() * ILAUSTRASI.length)], 12);
  };

  const ilustrasi = () => {
    const o = wiOpts(); o.gif = false;
    muat(ambilCampuran(o, ILAUSTRASI[Math.floor(Math.random() * ILAUSTRASI.length)], 12), 'Memuat ilustrasi…', true);
    loader = ambilCampuran(Object.assign(wiOpts(), { gif: false }), ILAUSTRASI[Math.floor(Math.random() * ILAUSTRASI.length)], 12);
  };

  const reaksi = (ep) => { const fn = (sig) => nbFetch(ep, 16, sig); return muat(fn, 'Memuat reaksi "' + ep + '"…', true); };

  const acak = async () => {
    loader = null;
    const o = wiOpts();
    await muat(async (sig) => {
      let hasil = [];
      if (Math.random() < 0.5) { try { hasil = await wiFetch(o, 6, sig); } catch (e) {} }
      if (!hasil.length) hasil = await nbFetch(ILAUSTRASI[Math.floor(Math.random() * ILAUSTRASI.length)], 6, sig);
      const satu = hasil[Math.floor(Math.random() * hasil.length)];
      if (satu) setTimeout(() => lihatDetail(satu), 50);
      return hasil;
    }, 'Mengambil kejutan…', false);
  };

  const cariTag = () => {
    const t = searchInp.value.trim().toLowerCase().replace(/[\s,]+/g, ' ').split(' ').filter(Boolean).slice(0, 5);
    if (!t.length) { T.show(out, errBox('Isi dulu tag-nya — mis. maid')); return; }
    const o = wiOpts(); o.tags = t;
    muat(async (sig) => {
      const r = await wiFetch(o, 24, sig);
      if (!r.length) throw new Error('tidak ada hasil untuk tag tersebut');
      return r;
    }, 'Mencari tag "' + t.join(' ') + '"…', true);
    loader = async (sig) => wiFetch(Object.assign(wiOpts(), { tags: t }), 24, sig);
  };

  const lihatSimpan = () => { loader = null; items = getSaved(); T.hide(out); T.hide(notices); tampilGrid(); perbaruiHitungSimpan(); };

  const perbaruiHitungSimpan = () => {
    const n = getSaved().length;
    const b = bar.querySelectorAll('button')[4];
    if (b) b.textContent = 'Tersimpan' + (n ? ' (' + n + ')' : '');
  };

  const lihatDetail = (it) => {
    if (!it) return;
    const saved = getSaved().some((s) => s.img === it.img);
    T.show(detail,
      '<div style="border:1px solid #ffffff20;border-radius:12px;padding:14px;margin-top:12px;background:#161311">' +
      '<img src="' + T.esc(it.img) + '" alt="" style="width:100%;border-radius:10px;display:block">' +
      '<div class="dim" style="font-size:11.5px;margin-top:8px">' + T.esc(it.provider) + (it.animated ? ' · Animasi' : '') + (it.w ? ' · ' + it.w + '×' + it.h : '') + '</div>' +
      kv('Artist', it.artistUrl ? '<a href="' + T.esc(it.artistUrl) + '" target="_blank" rel="noopener" style="color:#8ab8ff">' + T.esc(it.artist) + ' ↗</a>' : T.esc(it.artist)) +
      (it.anime ? kv('Anime/Sumber', T.esc(it.anime)) : '') +
      (it.source ? kv('Sumber file', T.esc(it.source)) : '') +
      (it.tags && it.tags.length ? '<p class="dim" style="font-size:12px;margin:8px 0 4px"><b>Tag:</b></p><div style="font-size:12px;font-family:monospace;max-height:90px;overflow:auto">' + it.tags.map((t) => T.esc(t)).join(' ') + '</div>' : '') +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">' +
      '<button class="btn" data-d="copy">Salin URL</button>' +
      '<button class="btn" data-d="share">Bagikan</button>' +
      '<a class="btn" data-d="dl" href="' + T.esc(it.img) + '" target="_blank" rel="noopener" download style="text-decoration:none">Unduh</a>' +
      '<button class="btn" data-d="save">' + (saved ? 'Tersimpan ✓' : 'Simpan') + '</button>' +
      '<button class="btn" data-d="x">Tutup</button></div>' +
      '<p class="dim" style="font-size:11.5px;margin-top:10px">Artwork tetap milik kreatornya. Tool ini hanya membantu menemukan metadata & sumber aslinya.</p></div>');
    detail.querySelector('[data-d=copy]').onclick = () => T.copy(it.img);
    detail.querySelector('[data-d=x]').onclick = () => T.hide(detail);
    detail.querySelector('[data-d=save]').onclick = (e) => {
      let l = getSaved();
      l = saved ? l.filter((s) => s.img !== it.img) : [it, ...l];
      setSaved(l); e.target.textContent = saved ? 'Simpan' : 'Tersimpan ✓'; T.toast(saved ? 'Dihapus dari simpanan' : 'Tersimpan!'); perbaruiHitungSimpan();
    };
    detail.querySelector('[data-d=share]').onclick = async () => {
      if (navigator.share) { try { await navigator.share({ title: 'Anime Discover', url: it.img }); } catch (e) {} }
      else T.copy(it.img);
    };
    detail.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  };

  const muatChips = async () => {
    const sig = abort();
    try {
      const tags = await wiTags(sig);
      const pil = tags.slice(0, 14);
      T.show(chipsBox, '<div style="display:flex;gap:6px;flex-wrap:wrap;margin:4px 0 10px">' +
        pil.map((t) => '<button class="btn" data-c="' + T.esc(t) + '" style="font-size:12px">' + T.esc(t) + '</button>').join('') + '</div>');
      chipsBox.querySelectorAll('[data-c]').forEach((b) => {
        b.onclick = () => { searchInp.value = b.getAttribute('data-c'); bar.querySelectorAll('button')[0].click(); cariTag(); };
      });
    } catch (e) { T.hide(chipsBox); }
  };

  const bar = tabs([['Jelajah', 0], ['Ilustrasi', 1], ['Reaksi', 2], ['Acak', 3], ['Tersimpan', 4]], [pJelajah, pIlustrasi, pReaksi, pAcak, pSimpan]);

  pJelajah.appendChild(T.el('<p class="dim" style="font-size:13px">Campuran acak SFW dari Waifu.im & NEKOSBEST.</p>'));
  pJelajah.appendChild(T.row(T.btn('Jelajah Acak', jelajah, true)));
  pIlustrasi.appendChild(T.el('<p class="dim" style="font-size:13px">Ilustrasi diam (bukan GIF) — bagus untuk wallpaper.</p>'));
  pIlustrasi.appendChild(T.row(T.btn('Muat Ilustrasi', ilustrasi, true)));
  pReaksi.appendChild(T.el('<p class="dim" style="font-size:13px">Pilih reaksi — GIF/ilustrasi dari NEKOSBEST.</p>'));
  const rg = T.el('<div style="display:flex;gap:6px;flex-wrap:wrap"></div>');
  REAKSI.forEach((r) => { const b = T.btn(r, () => reaksi(r)); b.style.fontSize = '12.5px'; rg.appendChild(b); });
  pReaksi.appendChild(rg);
  pAcak.appendChild(T.el('<p class="dim" style="font-size:13px">Satu gambar kejutan acak, langsung dibuka detailnya.</p>'));
  pAcak.appendChild(T.row(T.btn('Kejutan!', acak, true)));
  pSimpan.appendChild(T.el('<p class="dim" style="font-size:13px">Gambar yang kamu simpan (tersimpan lokal di HP).</p>'));
  pSimpan.appendChild(T.row(T.btn('Muat Simpanan', lihatSimpan, true)));

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Discovery visual anime — ilustrasi, artist, dan GIF reaksi. 100% SFW, sumber API publik (Waifu.im & NEKOSBEST), tanpa akun.</p>'));
  root.appendChild(bar);
  [pJelajah, pIlustrasi, pReaksi, pAcak, pSimpan].forEach((p) => root.appendChild(p));
  root.appendChild(T.field('Cari tag (Waifu.im)', searchInp, 'Contoh: maid — pisahkan beberapa tag dengan spasi'));
  root.appendChild(T.row(T.btn('Cari', () => { bar.querySelectorAll('button')[0].click(); cariTag(); }, true)));
  root.appendChild(chipsBox);
  root.appendChild(T.el('<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin:12px 0"></div>'));
  const frow = root.lastChild;
  frow.appendChild(T.field('Provider', provSel));
  frow.appendChild(T.field('Orientasi', oriSel));
  frow.appendChild(T.field('Animasi', animSel));
  root.appendChild(T.el('<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:0 0 12px"></div>'));
  const frow2 = root.lastChild;
  frow2.appendChild(T.field('Lebar minimum (px)', minWInp, 'Opsional'));
  frow2.appendChild(T.field('Tinggi minimum (px)', minHInp, 'Opsional'));
  provSel.onchange = oriSel.onchange = animSel.onchange = () => tampilGrid();
  minWInp.onchange = minHInp.onchange = () => tampilGrid();
  root.appendChild(notices);
  root.appendChild(out);
  root.appendChild(grid);
  root.appendChild(moreBox);
  root.appendChild(detail);
  perbaruiHitungSimpan();
  muatChips();
}
