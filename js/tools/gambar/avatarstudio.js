import { h as T, utils } from '../../core.js?v=6.9.20';

export const meta = {"id": "avatarstudio", "name": "Avatar Studio", "cat": "gambar", "icon": "🎭", "desc": "Avatar SVG unik puluhan style + editor visual (DiceBear).", "keywords": "avatar,profil,svg,dicebear,editor,seed"};

// API publik independen (bukan milik siapa pun yang direplika): DiceBear HTTP API v10.
const API = 'https://api.dicebear.com/10.x';
export const RASTER_MAX = 256;
export const FALLBACK_STYLES = ['adventurer', 'avataaars', 'bottts', 'identicon', 'initials', 'lorelei', 'pixel-art', 'shapes'];
const FALLBACK_LABEL = { adventurer: 'Adventurer', avataaars: 'Avataaars', bottts: 'Bottts', identicon: 'Identicon', initials: 'Initials', lorelei: 'Lorelei', 'pixel-art': 'Pixel Art', shapes: 'Shapes' };
// Palet warna background default (26 warna, meniru palet editor asli).
export const BG_PALETTE = ['b6e3f4', 'c0aede', 'd1d4f9', 'ffd5dc', 'ffdfbf', '8d5524', 'e6e6e6', 'ffdbac', 'f1c27d', 'e0ac69', 'c68642', '8d5524', 'ff0000', '00ff00', '0000ff', 'ffff00', 'ff00ff', '00ffff', 'ffffff', '000000', 'f5a623', '4a90d9', '7ed321', 'bd10e0', '50e3c2', 'b8e986'];

/** Bangun URL render DiceBear dari state (murni, tanpa DOM — bisa diuji).
    Menyamai perilaku editor aslinya: seed kosong -> "Nexora", key opsi terurut
    alfabetis, nilai list dikirim sebagai param berulang, format raster selalu
    bawa size (default 256 — tanpa size, DiceBear default raster hanya 128px). */
export function buildAvatarUrl(style, format, opts) {
  const o = opts || {};
  const q = new URLSearchParams();
  q.set('seed', o.seed && String(o.seed).trim() ? String(o.seed).trim() : 'Nexora');
  const all = {};
  if (o.backgroundColor && o.backgroundColor.length) all.backgroundColor = o.backgroundColor;
  if (o.flip && o.flip !== 'none') all.flip = o.flip;
  if (o.rotate) all.rotate = o.rotate;
  if (o.scale !== undefined && o.scale !== null && o.scale !== '') all.scale = o.scale;
  if (o.extra) for (const [k, v] of Object.entries(o.extra)) {
    if (v == null || v === '' || v === false || (Array.isArray(v) && !v.length)) continue;
    all[k] = v;
  }
  for (const k of Object.keys(all).sort()) {
    const v = all[k];
    if (Array.isArray(v)) { for (const x of v) q.append(k, String(x)); }
    else q.set(k, String(v));
  }
  if (format !== 'svg' && format !== 'json') {
    q.set('size', String(Math.max(1, Math.min(RASTER_MAX, Number(o.rasterSize) || RASTER_MAX))));
  }
  return API + '/' + encodeURIComponent(style) + '/' + format + '?' + q.toString();
}
export function randSeed() {
  return Math.random().toString(36).slice(2, 10);
}
function loadJson(key, fb) { try { const v = JSON.parse(localStorage.getItem(key)); return v == null ? fb : v; } catch (e) { return fb; } }
function saveJson(key, v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) {} }

export function render(root) {
  const LS_SAVED = 'adipAvatarStudioSavedV1', LS_RECENT = 'adipAvatarStudioRecentV1';
  const state = { style: 'lorelei', seed: 'Nexora', format: 'svg', rasterSize: 256, backgroundColor: [], flip: 'none', rotate: 0, scale: '', extra: {} };
  let styles = FALLBACK_STYLES.slice();
  let apiDown = false;

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Bikin avatar SVG unik dari puluhan style, lalu atur warnanya. Seed yang sama + style yang sama = avatar yang sama persis (deterministik).<br><span class="dim" style="font-size:12px">Didukung API publik <b>DiceBear</b> — tiap style punya lisensinya sendiri, cek <a href="https://www.dicebear.com/licenses/" target="_blank" rel="noopener">dicebear.com/licenses</a>.</span></p>'));

  const styleSel = T.select([], state.style);
  const seedInp = T.input('text', 'Seed (nama unik)', state.seed);
  const fmtSel = T.select([['svg', 'SVG (vektor, tanpa batas ukuran)'], ['png', 'PNG'], ['jpg', 'JPG'], ['webp', 'WebP'], ['avif', 'AVIF'], ['json', 'JSON (metadata)']], 'svg');
  const sizeSel = T.select([['64', '64px'], ['128', '128px'], ['256', '256px']], '256');
  sizeSel.addEventListener('change', () => { state.rasterSize = Number(sizeSel.value) || 256; queue(); });
  root.appendChild(T.grid2(
    T.field('Style', styleSel),
    T.field('Seed', T.row(seedInp, T.btn('Acak', () => { seedInp.value = randSeed(); queue(); })))
  ));
  root.appendChild(T.grid2(
    T.field('Format unduhan', fmtSel),
    T.field('Ukuran raster', sizeSel, 'Berlaku untuk PNG/JPG/WebP/AVIF.')
  ));

  const optBox = T.el('<div style="margin-top:10px"></div>');
  root.appendChild(T.field('Opsi visual', optBox, 'Editor opsi per-style dimuat dari schema DiceBear bila tersedia.'));

  const prevBox = T.el('<div style="margin:14px 0;text-align:center;min-height:220px;display:flex;align-items:center;justify-content:center;background:#14110d;border:1px solid #2e2823;border-radius:12px;overflow:hidden"><span class="dim">Memuat…</span></div>');
  root.appendChild(prevBox);

  const actBox = T.out();
  root.appendChild(T.row(
    T.btn('Unduh avatar', () => download(state), true),
    T.copyBtn(() => buildAvatarUrl(state.style, state.format, state), 'Salin URL'),
    T.btn('Simpan', () => {
      const saved = loadJson(LS_SAVED, []);
      const u = buildAvatarUrl(state.style, state.format, state);
      if (!saved.some((s) => s.u === u)) { saved.unshift({ u, style: state.style, seed: state.seed, t: Date.now() }); saveJson(LS_SAVED, saved.slice(0, 24)); }
      T.toast('Avatar tersimpan'); drawGallery();
    })
  ));
  root.appendChild(actBox);

  const galBox = T.el('<div style="margin-top:14px"></div>');
  root.appendChild(galBox);

  function fillStyles(list) {
    styles = list.length ? list : FALLBACK_STYLES.slice();
    styleSel.innerHTML = '';
    styles.forEach((s) => {
      const o = document.createElement('option');
      o.value = s; o.textContent = FALLBACK_LABEL[s] || s.replace(/-/g, ' ');
      if (s === state.style) o.selected = true;
      styleSel.appendChild(o);
    });
  }
  fillStyles(styles);

  let qT = null;
  function queue() { clearTimeout(qT); qT = setTimeout(refresh, 350); }

  async function loadStyles() {
    try {
      const r = await fetch(API, { cache: 'no-cache' });
      const j = await r.json();
      if (j && Array.isArray(j.styles) && j.styles.length) fillStyles(j.styles);
    } catch (e) { apiDown = true; }
    buildOptions(); refresh();
  }

  // Editor opsi: inti (backgroundColor, flip, rotate, scale) + enum/number dinamis dari options.json
  async function buildOptions() {
    optBox.innerHTML = '<span class="dim" style="font-size:12px">Memuat opsi style…</span>';
    const core = T.el('<div></div>');
    // backgroundColor: palet chip
    const pal = T.el('<div style="display:flex;flex-wrap:wrap;gap:6px;margin:6px 0"></div>');
    const syncPal = () => {
      pal.querySelectorAll('button').forEach((b) => {
        const on = state.backgroundColor.includes(b.dataset.c);
        b.style.outline = on ? '2px solid #fff' : '1px solid #ffffff25';
      });
    };
    BG_PALETTE.forEach((c) => {
      const b = T.el(`<button type="button" title="#${c}" style="width:26px;height:26px;border-radius:8px;background:#${c};border:none;cursor:pointer"></button>`);
      b.dataset.c = c;
      b.addEventListener('click', () => {
        const i = state.backgroundColor.indexOf(c);
        if (i >= 0) state.backgroundColor.splice(i, 1); else state.backgroundColor.push(c);
        syncPal(); queue();
      });
      pal.appendChild(b);
    });
    core.appendChild(T.el('<div class="dim" style="font-size:12px;margin-bottom:2px">Warna background (bisa pilih beberapa)</div>'));
    core.appendChild(pal);
    const flipS = T.select([['none', 'Tidak'], ['horizontal', 'Horizontal'], ['vertical', 'Vertikal'], ['both', 'Keduanya']], state.flip);
    const rotS = T.select([['0', '0'], ['90', '90'], ['180', '180'], ['270', '270']], String(state.rotate));
    const scaleInp = T.input('number', '0–10, kosong = default', state.scale === '' ? '' : String(state.scale));
    scaleInp.min = '0'; scaleInp.max = '10'; scaleInp.step = 'any';
    core.appendChild(T.row(
      T.field('Flip', flipS),
      T.field('Rotate (°)', rotS),
      T.field('Scale (0–10)', scaleInp, 'Skala DiceBear v10: 0–10. Kosong = default.')
    ));
    flipS.addEventListener('change', () => { state.flip = flipS.value; queue(); });
    rotS.addEventListener('change', () => { state.rotate = Number(rotS.value); queue(); });
    scaleInp.addEventListener('change', () => {
      const t = scaleInp.value.trim();
      state.scale = t === '' ? '' : Math.max(0, Math.min(10, Number(t)));
      queue();
    });
    syncPal();

    // Opsi dinamis per style (enum + number saja, dibatasi 8 kontrol agar UI tetap ringkas)
    const dyn = T.el('<div style="margin-top:8px"></div>');
    core.appendChild(dyn);
    try {
      const r = await fetch(API + '/' + encodeURIComponent(state.style) + '/options.json');
      const schema = await r.json();
      const keys = Object.keys(schema || {}).filter((k) => !['seed', 'flip', 'rotate', 'scale', 'backgroundColor', 'size'].includes(k)).slice(0, 8);
      keys.forEach((k) => {
        const d = schema[k] || {};
        if (d.type === 'enum' && Array.isArray(d.values) && d.values.length && d.values.length <= 30) {
          const s = T.select(d.values.map((v) => [String(v), String(v)]), '');
          s.addEventListener('change', () => { if (s.value) state.extra[k] = [s.value]; else delete state.extra[k]; queue(); });
          const o0 = document.createElement('option'); o0.value = ''; o0.textContent = '— acak —'; s.prepend(o0);
          dyn.appendChild(T.field(k, s));
        } else if (d.type === 'number' && isFinite(d.min) && isFinite(d.max)) {
          const n = T.input('number', d.min + '–' + d.max, '');
          n.min = d.min; n.max = d.max;
          n.addEventListener('change', () => { const v = Number(n.value); if (isFinite(v)) state.extra[k] = v; else delete state.extra[k]; queue(); });
          dyn.appendChild(T.field(k + ' (' + d.min + '–' + d.max + ')', n));
        }
      });
    } catch (e) { /* schema tidak wajib */ }
    optBox.innerHTML = '';
    optBox.appendChild(core);
  }

  function refresh() {
    state.style = styleSel.value; state.seed = seedInp.value; state.format = fmtSel.value;
    state.rasterSize = Number(sizeSel.value) || 256;
    const url = buildAvatarUrl(state.style, state.format, state);
    if (state.format === 'json') {
      prevBox.innerHTML = '<span class="dim" style="font-size:12px">Format JSON = metadata, bukan gambar. Tekan Unduh untuk melihat isinya.</span>';
    } else {
      // Preview selalu SVG (vektor, tajam di semua ukuran) seperti editor aslinya.
      const purl = buildAvatarUrl(state.style, 'svg', state);
      const img = T.el(`<img alt="preview avatar" style="width:min(240px,70%);height:auto;image-rendering:auto" src="${purl.replace(/"/g, '&quot;')}">`);
      img.onerror = () => { prevBox.innerHTML = '<span class="err" style="font-size:12px">Gagal memuat preview. Cek koneksi / API DiceBear.</span>'; };
      prevBox.innerHTML = '';
      prevBox.appendChild(img);
    }
    // recent
    const recent = loadJson(LS_RECENT, []);
    if (!recent.some((s) => s.u === url)) { recent.unshift({ u: url, style: state.style, seed: state.seed, t: Date.now() }); saveJson(LS_RECENT, recent.slice(0, 8)); }
  }

  async function download(st) {
    const url = buildAvatarUrl(st.style, st.format, st);
    const ext = st.format === 'jpeg' ? 'jpg' : st.format;
    T.show(actBox, '<span class="dim">Mengunduh…</span>');
    try {
      const r = await fetch(url);
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const blob = await r.blob();
      T.dl('avatar-' + st.style + '-' + (st.seed || 'acak').replace(/[^\w-]+/g, '_') + '.' + ext, blob, blob.type);
      T.hide(actBox);
    } catch (e) {
      T.show(actBox, '<span class="err">Gagal mengunduh. URL-nya bisa disalin manual.</span>');
    }
  }

  function drawGallery() {
    const saved = loadJson(LS_SAVED, []);
    galBox.innerHTML = '';
    if (!saved.length) return;
    galBox.appendChild(T.el('<div style="font-weight:700;margin-bottom:8px">Tersimpan (' + saved.length + ')</div>'));
    const g = T.el('<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(84px,1fr));gap:8px"></div>');
    saved.forEach((s, i) => {
      const cell = T.el('<div style="border:1px solid #2e2823;border-radius:10px;overflow:hidden;background:#14110d;position:relative"></div>');
      const img = T.el(`<img src="${s.u.replace(/"/g, '&quot;')}" style="width:100%;aspect-ratio:1;object-fit:cover;display:block" alt="">`);
      img.addEventListener('click', () => {
        if (styles.includes(s.style)) styleSel.value = s.style;
        seedInp.value = s.seed || ''; fmtSel.value = 'svg';
        state.backgroundColor = []; state.extra = {};
        state.flip = 'none'; state.rotate = 0; state.scale = '';
        buildOptions(); refresh(); T.scrollToPreview(prevBox);
      });
      const x = T.el('<button type="button" style="position:absolute;top:2px;right:2px;background:#000a;border:none;color:#fff;border-radius:6px;cursor:pointer;font-size:11px;padding:2px 6px">×</button>');
      x.addEventListener('click', (ev) => { ev.stopPropagation(); const arr = loadJson(LS_SAVED, []); arr.splice(i, 1); saveJson(LS_SAVED, arr); drawGallery(); });
      cell.appendChild(img); cell.appendChild(x);
      g.appendChild(cell);
    });
    galBox.appendChild(g);
  }

  styleSel.addEventListener('change', () => { state.extra = {}; state.backgroundColor = []; buildOptions(); refresh(); });
  seedInp.addEventListener('input', queue);
  fmtSel.addEventListener('change', refresh);
  drawGallery();
  loadStyles();

  T.onLeave(() => clearTimeout(qT));
}
