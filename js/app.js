/* ADIP Tools v4: premium overhaul — calm luxury, command palette, quick cards. */
import { h as T, cats, tools, leaveCbs } from './core.js?v=4.3.0';
import { manifest, VERSION } from './manifest.js?v=4.3.0';
// FASE 2: code splitting — metadata 100 tools dimuat ringan,
// kode tiap tool di-import on-demand saat dibuka (lihat loadToolRender).
for (const m of manifest) tools.push({ ...m, render: null });

/** Muat kode tool on-demand (dynamic import), cache di entri tools. */
const toolMods = {};
async function loadToolRender(t) {
  if (t.render) return t.render;
  if (!toolMods[t.id]) {
    toolMods[t.id] = import('./' + t.file + '?v=' + VERSION).then((mod) => {
      t.render = mod.render;
      return mod.render;
    });
  }
  return toolMods[t.id];
}
  const app = document.getElementById('app');
  const catName = (id) => { const c = cats.find((x) => x[0] === id); return c ? c[1] : id; };
  const esc = T.esc;

  // Sapaan waktu-aware untuk hero. HANYA teks statis — bukan popup/modal,
  // tidak mengganggu. Bikin halaman terasa hidup kayak ada yang nyapa.
  function greet() {
    const h = new Date().getHours();
    if (h >= 5 && h < 11) return 'Selamat pagi';
    if (h >= 11 && h < 15) return 'Selamat siang';
    if (h >= 15 && h < 19) return 'Selamat sore';
    if (h >= 19) return 'Selamat malam';
    return 'Begadang nih?'; // 00–04
  }

  /* ===== global search trends (Supabase realtime): START =====
     "Sering dicari" = agregat pencarian SEMUA user, update realtime.
     Blok murni logika (tanpa DOM) kecuali sbEnsure/track/fetch — bisa di-test. */
  const SB_URL = 'https://jebafddwupyqpwevhsqn.supabase.co';
  const SB_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImplYmFmZGR3dXB5cXB3ZXZoc3FuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyOTA4ODIsImV4cCI6MjEwMjg2Njg4Mn0.FV11WzcVJv2GlFHpzLztFMCik1nmDucA7hZwov8090E'; // anon key: publik by design
  const SEARCH_TOP_N = 6;        // jumlah chip yang ditampilkan
  const SEARCH_DEBOUNCE_MS = 1500;
  const SEARCH_TRACK_COOLDOWN_MS = 5000; // rate-limit client: maks 1 track / 5 dtk
  const TERM_RE = /^[a-z0-9 \-]{2,40}$/;
  let lastTracked = '';          // cegah hitung ganda beruntun (debounce + Enter)
  let lastTrackAt = 0;
  let sbClient = null;           // supabase-js client (lazy, hanya di home)
  let sbLoading = null;
  let sbTerms = [];              // cache top terms global
  let sbReady = false;           // true bila fetch top-6 pernah sukses
  // normalisasi + validasi ketat (murni, testable)
  const normTerm = (raw) => {
    const t = String(raw == null ? '' : raw).trim().toLowerCase();
    return TERM_RE.test(t) ? t : '';
  };
  // lazy-load supabase-js (UMD) sekali saja; resolve null bila gagal/offline
  function sbEnsure() {
    if (sbClient) return Promise.resolve(sbClient);
    if (sbLoading) return sbLoading;
    sbLoading = new Promise((resolve) => {
      try {
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
        s.async = true;
        s.onload = () => {
          try { sbClient = window.supabase.createClient(SB_URL, SB_ANON); }
          catch (e) { sbClient = null; }
          resolve(sbClient);
        };
        s.onerror = () => resolve(null);
        document.head.appendChild(s);
        setTimeout(() => resolve(sbClient), 8000); // jangan gantung selamanya
      } catch (e) { resolve(null); }
    });
    return sbLoading;
  }
  // fire-and-forget: catat pencarian ke agregat global (anon hanya via RPC)
  function trackSearchGlobal(raw) {
    const term = normTerm(raw);
    if (!term || term === lastTracked) return;
    const now = Date.now();
    if (now - lastTrackAt < SEARCH_TRACK_COOLDOWN_MS) return;
    lastTracked = term;
    lastTrackAt = now;
    sbEnsure().then((sb) => {
      if (!sb) return;
      sb.rpc('track_search', { p_term: term }).then(() => {}, () => {});
    });
  }
  // ambil top-N global; resolve array term, atau null bila gagal/belum setup
  function fetchTopSearches() {
    return sbEnsure().then((sb) => {
      if (!sb) return null;
      return sb.from('tool_search_terms')
        .select('term')
        .order('count', { ascending: false })
        .limit(SEARCH_TOP_N)
        .then(({ data, error }) => {
          if (error || !data) return null;
          sbReady = true;
          sbTerms = data.map((r) => r.term).filter(Boolean);
          return sbTerms;
        }, () => null);
    });
  }
  /* ===== global search trends: END ===== */

  // fallback bila user belum pernah mencari apa pun
  const POPULAR = ['Password', 'QR Code', 'THR', 'Weton', 'Terbilang', 'Base64'];

  /* ===== satset: favorit & riwayat (localStorage) — self-contained, tanpa DOM ===== */
  const LS = {
    get(key, fallback) {
      try {
        const raw = localStorage.getItem('adip-tools:' + key);
        if (raw == null) return fallback;
        const v = JSON.parse(raw);
        return Array.isArray(v) ? v : fallback;
      } catch (e) { return fallback; }
    },
    set(key, val) {
      try { localStorage.setItem('adip-tools:' + key, JSON.stringify(val)); } catch (e) {}
    },
    getObj(key, fallback) {
      try {
        const raw = localStorage.getItem('adip-tools:' + key);
        if (raw == null) return fallback;
        const v = JSON.parse(raw);
        return (v && typeof v === 'object' && !Array.isArray(v)) ? v : fallback;
      } catch (e) { return fallback; }
    },
  };
  const getFavs = () => LS.get('fav', []);
  const isFav = (id) => getFavs().indexOf(id) !== -1;
  function toggleFav(id) {
    const cur = getFavs();
    const has = cur.indexOf(id) !== -1;
    LS.set('fav', has ? cur.filter((x) => x !== id) : [id].concat(cur));
    return !has;
  }
  const getRecent = () => LS.get('recent', []);
  function pushRecent(id) {
    if (!id) return;
    LS.set('recent', [id].concat(getRecent().filter((x) => x !== id)).slice(0, 8));
  }
  /* ===== /satset ===== */

  /* ===== command palette (Ctrl+K): satset 10x — fuzzy search semua tools,
     navigasi keyboard penuh. Murni logika kecuali open/close/render. ===== */
  // skor fuzzy: subsequence match; bonus untuk kecocokan berurutan,
  // word boundary, dan prefix. -1 = tidak cocok.
  function fuzzyScore(needle, hay) {
    needle = String(needle).toLowerCase();
    hay = String(hay).toLowerCase();
    if (!needle) return 0;
    let si = 0, score = 0, consec = 0;
    for (let i = 0; i < needle.length; i++) {
      const j = hay.indexOf(needle[i], si);
      if (j < 0) return -1;
      if (j === si) { consec++; score += 12 + consec * 6; }
      else {
        consec = 0;
        score += (j === 0 || hay[j - 1] === ' ' || hay[j - 1] === '-') ? 9 : 2;
      }
      si = j + 1;
    }
    if (hay.indexOf(needle) === 0) score += 40;
    else if (hay.indexOf(needle) > 0) score += 12;
    score -= hay.length * 0.15;
    return score;
  }
  // hasil palette: cocokkan nama > deskripsi > kategori, maks 8, urut skor.
  function palResults(needle) {
    const n = String(needle).trim().toLowerCase();
    if (!n) return [];
    const out = [];
    for (const t of tools) {
      const sN = fuzzyScore(n, t.name);
      if (sN >= 0) { out.push({ t: t, s: sN + 20 }); continue; }
      const sD = fuzzyScore(n, t.desc || '');
      if (sD >= 0) { out.push({ t: t, s: sD }); continue; }
      const sC = fuzzyScore(n, catName(t.cat));
      if (sC >= 0) out.push({ t: t, s: sC - 5 });
    }
    out.sort((a, b) => b.s - a.s);
    return out.slice(0, 8).map((x) => x.t);
  }
  // highlight karakter yang cocok di nama (subsequence), aman dari HTML.
  function hiMark(name, needle) {
    const nl = String(needle).trim().toLowerCase();
    const nm = String(name == null ? '' : name);
    if (!nl) return esc(nm);
    const low = nm.toLowerCase();
    let si = 0, out = '';
    for (let i = 0; i < nm.length; i++) {
      if (si < nl.length && low[i] === nl[si]) { out += '<mark>' + esc(nm[i]) + '</mark>'; si++; }
      else out += esc(nm[i]);
    }
    return out;
  }

  let palEl = null, palItems = [], palIdx = -1;
  function palItemEl(t, needle, i) {
    const b = T.el(
      '<button type="button" class="pal-item" role="option" data-pi="' + i + '">' +
        '<span class="pic">' + esc(t.icon || '+') + '</span>' +
        '<span class="ptx"><span class="pnm">' + hiMark(t.name, needle) + '</span>' +
        '<span class="pds">' + esc(t.desc) + '</span></span>' +
        '<span class="pct">' + esc(catName(t.cat)) + '</span>' +
      '</button>'
    );
    b.addEventListener('click', () => palGo(t));
    return b;
  }
  function palGo(t) {
    closePalette();
    location.hash = '#/t/' + encodeURIComponent(t.id);
  }
  function syncPalActive() {
    if (!palEl) return;
    palEl.querySelectorAll('.pal-item').forEach((el) => {
      el.classList.toggle('act', Number(el.dataset.pi) === palIdx);
    });
    const act = palEl.querySelector('.pal-item.act');
    if (act && act.scrollIntoView) act.scrollIntoView({ block: 'nearest' });
  }
  function renderPal(needle) {
    if (!palEl) return;
    const list = palEl.querySelector('.pal-list');
    list.innerHTML = '';
    const n = String(needle).trim();
    if (!n) {
      // query kosong: tawarkan "terakhir dibuka" sebagai jalan pintas
      palItems = getRecent().map((id) => tools.find((x) => x.id === id)).filter(Boolean).slice(0, 5);
      if (!palItems.length) {
        list.appendChild(T.el('<div class="pal-empty">Ketik untuk mencari dari 100 tools.<br>Coba "password", "qr", atau "kalkulator".</div>'));
        palIdx = -1;
        return;
      }
      list.appendChild(T.el('<div class="pal-sec">Terakhir dibuka</div>'));
    } else {
      palItems = palResults(n);
      if (!palItems.length) {
        list.appendChild(T.el('<div class="pal-empty">Hmm, nggak ketemu nih.<br>Coba kata lain.</div>'));
        palIdx = -1;
        return;
      }
    }
    palIdx = 0;
    palItems.forEach((t, i) => list.appendChild(palItemEl(t, n, i)));
    syncPalActive();
  }
  function openPalette() {
    if (palEl) {
      const inp = palEl.querySelector('input');
      if (inp) inp.focus();
      return;
    }
    // T.el hanya mengembalikan firstElementChild: satu wrapper .pal-wrap.
    palEl = T.el(
      '<div class="pal-wrap">' +
        '<div class="pal-backdrop"></div>' +
        '<div class="pal" role="dialog" aria-modal="true" aria-label="Cari cepat">' +
          '<div class="pal-bar"><span class="glyph">⌕</span>' +
          '<input type="text" placeholder="Cari tools…" autocomplete="off" aria-label="Cari cepat">' +
          '<kbd>esc</kbd></div>' +
          '<div class="pal-list" role="listbox"></div>' +
          '<div class="pal-hint"><span><kbd>↑↓</kbd>navigasi</span><span><kbd>↵</kbd>buka</span><span><kbd>esc</kbd>tutup</span></div>' +
        '</div>' +
      '</div>'
    );
    const input = palEl.querySelector('input');
    palEl.querySelector('.pal-backdrop').addEventListener('click', closePalette);
    input.addEventListener('input', () => renderPal(input.value));
    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (!palItems.length) return;
        palIdx = (palIdx + (e.key === 'ArrowDown' ? 1 : -1) + palItems.length) % palItems.length;
        syncPalActive();
      } else if (e.key === 'Enter') {
        const t = palItems[palIdx];
        if (t) palGo(t);
      } else if (e.key === 'Escape') {
        closePalette();
      }
    });
    document.body.appendChild(palEl);
    document.body.style.overflow = 'hidden';
    input.focus();
    renderPal('');
  }
  function closePalette() {
    if (!palEl) return;
    palEl.remove();
    palEl = null;
    palItems = [];
    palIdx = -1;
    document.body.style.overflow = '';
  }
  /* ===== /command palette ===== */

  /* ===== placeholder search yang "hidup": rotasi contoh pencarian.
     Hanya teks placeholder, berhenti saat input fokus/terisi.
     Nonaktif bila prefers-reduced-motion. ===== */
  const PH_EXAMPLES = ['password', 'kalkulator thr', 'qr code', 'weton', 'terbilang', 'cek ongkir'];
  let phTimer = null, phIdx = 0;
  function stopPhRotate() {
    if (phTimer) { clearInterval(phTimer); phTimer = null; }
  }
  function startPhRotate(input) {
    stopPhRotate();
    try {
      if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    } catch (e) {}
    input.setAttribute('placeholder', 'Coba "' + PH_EXAMPLES[0] + '"…');
    phTimer = setInterval(() => {
      if (!document.body.contains(input)) { stopPhRotate(); return; }
      if (document.activeElement === input || input.value) return;
      phIdx = (phIdx + 1) % PH_EXAMPLES.length;
      input.setAttribute('placeholder', 'Coba "' + PH_EXAMPLES[phIdx] + '"…');
    }, 3200);
    T.onLeave(stopPhRotate);
  }
  /* ===== /placeholder hidup ===== */

  let q = '', activeCat = 'semua';

  function runLeave() {
    const cbs = leaveCbs.splice(0, leaveCbs.length);
    cbs.forEach((fn) => { try { fn(); } catch (e) {} });
  }

  // handler bintang favorit — dipakai baris direktori & kartu quick access.
  // stopPropagation supaya tap bintang tidak ikut membuka halaman tool.
  function bindFav(btn, id) {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const on = toggleFav(id);
      syncFavBtns(id, on);
      btn.classList.remove('pop');
      void btn.offsetWidth;
      btn.classList.add('pop');
      T.toast(on ? 'Sip, masuk favorit' : 'Dihapus dari favorit');
      setTimeout(refreshQuick, 280);
    });
  }

  function rowEl(t, i, showCat) {
    const fav = isFav(t.id);
    const a = T.el(
      '<a class="trow enter" style="--i:' + (i % 24) + '" href="#/t/' + encodeURIComponent(t.id) + '">' +
        '<span class="ic">' + esc(t.icon || '+') + '</span>' +
        '<span class="tx"><span class="nm">' + esc(t.name) + '</span>' +
        '<span class="ds">' + esc(t.desc) + '</span>' +
        (showCat ? '<span class="ct">' + esc(catName(t.cat)) + '</span>' : '') +
        '</span>' +
        '<button type="button" class="fav' + (fav ? ' on' : '') + '" data-tid="' + esc(t.id) + '" aria-pressed="' + fav + '" aria-label="' + (fav ? 'Hapus dari favorit' : 'Tambah ke favorit') + '">★</button>' +
      '</a>'
    );
    bindFav(a.querySelector('.fav'), t.id);
    return a;
  }

  // samakan semua tombol star untuk tool yang sama di layar
  function syncFavBtns(id, on) {
    document.querySelectorAll('.fav').forEach((b) => {
      if (b.dataset.tid !== id) return;
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', on);
      b.setAttribute('aria-label', on ? 'Hapus dari favorit' : 'Tambah ke favorit');
    });
  }

  function refreshQuick() {
    const box = document.getElementById('quick');
    if (box) renderQuick(box);
  }

  // Kartu favorit premium: snap rail horizontal, bukan baris penuh.
  // Toggle bintang tetap jalan via bindFav + syncFavBtns global.
  function qcardEl(t) {
    const fav = isFav(t.id);
    const a = T.el(
      '<a class="qcard" href="#/t/' + encodeURIComponent(t.id) + '">' +
        '<span class="qic">' + esc(t.icon || '+') + '</span>' +
        '<span class="qtx"><span class="qnm">' + esc(t.name) + '</span>' +
        '<span class="qct">' + esc(catName(t.cat)) + '</span></span>' +
        '<button type="button" class="fav' + (fav ? ' on' : '') + '" data-tid="' + esc(t.id) + '" aria-pressed="' + fav + '" aria-label="' + (fav ? 'Hapus dari favorit' : 'Tambah ke favorit') + '">★</button>' +
      '</a>'
    );
    bindFav(a.querySelector('.fav'), t.id);
    return a;
  }

  // Section "Favorit" + "Terakhir dibuka" di home. Favorit hanya muncul bila ≥1;
  // kalau user baru saja menghapus favorit terakhir, tampilkan empty state ramah.
  function renderQuick(box) {
    const hadFav = !!box.querySelector('[data-qsec="fav"]');
    box.innerHTML = '';
    const favs = getFavs().map((id) => tools.find((x) => x.id === id)).filter(Boolean);
    if (favs.length) {
      const sec = T.el('<section class="qsec" data-qsec="fav"><div class="qsec-head"><h2>★ Favorit</h2><span class="n">' + favs.length + '</span></div><div class="qrail"></div></section>');
      const rail = sec.querySelector('.qrail');
      favs.forEach((t) => rail.appendChild(qcardEl(t)));
      box.appendChild(sec);
    } else if (hadFav) {
      box.appendChild(T.el('<section class="qsec" data-qsec="fav"><div class="qsec-head"><h2>★ Favorit</h2></div><p class="qempty">Belum ada favorit nih. Tap ☆ di tool langgananmu biar muncul di sini.</p></section>'));
    }
    const recents = getRecent().map((id) => tools.find((x) => x.id === id)).filter(Boolean);
    if (recents.length) {
      const sec = T.el('<section class="qsec" data-qsec="recent"><div class="qsec-head"><h2>↻ Terakhir dibuka</h2></div><div class="chips"></div></section>');
      const chips = sec.querySelector('.chips');
      recents.forEach((t) => {
        chips.appendChild(T.el(
          '<a class="chip" href="#/t/' + encodeURIComponent(t.id) + '">' +
            '<span class="cic">' + esc(t.icon || '+') + '</span><span class="cnm">' + esc(t.name) + '</span></a>'
        ));
      });
      box.appendChild(sec);
    }
  }

  function filtered() {
    const needle = q.trim().toLowerCase();
    return tools.filter((t) => {
      if (activeCat !== 'semua' && t.cat !== activeCat) return false;
      if (!needle) return true;
      return (t.name + ' ' + t.desc + ' ' + catName(t.cat)).toLowerCase().includes(needle);
    });
  }

  function home() {
    runLeave();
    app.innerHTML = '';
    const w = T.el('<div class="wrap"><div class="view"></div></div>');
    const v = w.firstElementChild;
    const total = tools.length;

    v.innerHTML =
      '<header class="topbar">' +
        '<a class="brand" href="#/"><span class="mark">A</span><span class="wm">ADIP Tools <span>· perkakas browser</span></span></a>' +
        '<div class="top-right">' +
          '<button type="button" class="kbtn" id="kbtn" aria-label="Cari cepat"><span class="ktxt">Cari cepat</span><kbd>⌘K</kbd></button>' +
          '<span class="topcount"><b>' + total + '</b> tools</span>' +
        '</div>' +
      '</header>' +
      '<section class="hero">' +
        '<p class="eyebrow">' + esc(greet()) + ' · Gratis tanpa daftar</p>' +
        '<h1>Butuh <span class="qm">apa?</span></h1>' +
        '<p class="sub"><b>100 tools gratis</b> yang jalan langsung di browser kamu. Ketik yang dicari, klik, langsung pakai. Tanpa daftar, tanpa upload.</p>' +
        '<div class="msearch"><div class="box">' +
          '<input id="q" type="search" placeholder="Cari tools…" autocomplete="off" aria-label="Cari tools">' +
          '<span class="glyph">⌕</span>' +
          '<button type="button" class="clear" id="qclear" aria-label="Hapus pencarian">✕</button>' +
          '<kbd>/</kbd>' +
        '</div></div>' +
        '<div class="sug" id="sug"><span class="lbl">Sering dicari</span>' +
          '<span class="suglist" id="suglist"></span>' +
        '</div>' +
      '</section>' +
      '<div id="quick"></div>' +
      '<nav class="rail" id="rail" aria-label="Kategori"></nav>' +
      '<main class="dir" id="dir"></main>' +
      '<footer class="foot"><span class="fmark">A</span><br>Dibuat dengan teliti.<br><b>Data tool tidak pernah keluar dari browser kamu.</b><br><span class="dim">Pencarian tercatat anonim untuk statistik global.</span></footer>';

    // rail kategori
    const rail = v.querySelector('#rail');
    const mkTile = (id, label, n) => {
      const b = T.el('<button type="button" class="tile' + (activeCat === id ? ' on' : '') + '" data-cat="' + esc(id) + '"><span class="tn">' + esc(label) + '</span><span class="tc">' + n + ' tools</span></button>');
      b.addEventListener('click', () => {
        if (activeCat === id) return;
        activeCat = id;
        rail.querySelectorAll('.tile').forEach((el) => el.classList.toggle('on', el.dataset.cat === id));
        paint();
        document.getElementById('dir').scrollIntoView({ block: 'start' });
      });
      return b;
    };
    rail.appendChild(mkTile('semua', 'Semua', total));
    cats.forEach(([id, label]) => {
      const n = tools.filter((t) => t.cat === id).length;
      if (n) rail.appendChild(mkTile(id, label, n));
    });

    const input = v.querySelector('#q');
    const clear = v.querySelector('#qclear');
    const kbtn = v.querySelector('#kbtn');
    if (kbtn) kbtn.addEventListener('click', openPalette);
    startPhRotate(input); // placeholder contoh pencarian yang berganti
    const sug = v.querySelector('#sug');
    const dir = v.querySelector('#dir');
    input.value = q;
    lastTracked = ''; // sesi pencarian baru tiap buka home

    const syncClear = () => clear.classList.toggle('show', !!input.value);

    // "Sering dicari": agregat GLOBAL realtime dari Supabase.
    // Fallback ke POPULAR bila Supabase belum setup / offline (jangan blank).
    // Klik chip = isi search box + filter (bukan navigasi ke tool).
    const sugList = v.querySelector('#suglist');
    function renderSug() {
      const list = (sbReady && sbTerms.length) ? sbTerms : POPULAR;
      sugList.innerHTML = '';
      list.forEach((term) => {
        const b = T.el('<button type="button" class="schip">' + esc(term) + '</button>');
        b.addEventListener('click', () => {
          if (debT) { clearTimeout(debT); debT = null; }
          q = term;
          input.value = term;
          syncClear();
          paint();
          trackSearchGlobal(term); // klik chip dihitung satu pencarian
          input.focus();
        });
        sugList.appendChild(b);
      });
    }
    // realtime: tiap ada perubahan agregat -> refetch + re-render,
    // tapi jangan ganggu saat user sedang mengetik
    function startSugRealtime() {
      sbEnsure().then((sb) => {
        if (!sb || !sbReady) return;
        const ch = sb.channel('sg_trends')
          .on('postgres_changes',
            { event: '*', schema: 'public', table: 'tool_search_terms' },
            () => {
              if (input.value.trim()) return;
              fetchTopSearches().then((t) => { if (t) renderSug(); });
            })
          .subscribe();
        T.onLeave(() => { try { sb.removeChannel(ch); } catch (e) {} });
      });
    }
    // fetch awal (async): langsung tampilkan fallback, update saat data tiba.
    // realtime dimulai begitu fetch sukses (walau tabel masih kosong),
    // supaya pencarian pertama user langsung memicu update live.
    fetchTopSearches().then((t) => {
      if (t) { renderSug(); startSugRealtime(); }
    });

    // tracking global: debounce 1,5 dtk setelah berhenti mengetik, atau saat Enter.
    // tiap keystroke TIDAK dihitung ("pass","passw",... = 1x "password").
    // fire-and-forget + rate-limit 5 dtk — tidak block UI.
    let debT = null;
    T.onLeave(() => { if (debT) { clearTimeout(debT); debT = null; } });
    const scheduleTrack = () => {
      if (debT) clearTimeout(debT);
      debT = setTimeout(() => {
        debT = null;
        trackSearchGlobal(input.value);
      }, SEARCH_DEBOUNCE_MS);
    };

    const paint = () => {
      const needle = q.trim();
      const searching = !!needle || activeCat !== 'semua';
      sug.style.display = needle ? 'none' : '';
      dir.innerHTML = '';
      if (!searching) {
        // mode jelajah: section per kategori
        let ci = 0;
        cats.forEach(([id, label]) => {
          const list = tools.filter((t) => t.cat === id);
          if (!list.length) return;
          ci++;
          const idx = String(ci).padStart(2, '0');
          const sec = T.el('<section class="catsec"><div class="catsec-head"><span class="idx">' + idx + '</span><h2>' + esc(label) + '</h2><span class="n">' + list.length + ' tools</span></div><div class="trows"></div></section>');
          const rows = sec.querySelector('.trows');
          list.forEach((t, i) => rows.appendChild(rowEl(t, i, false)));
          dir.appendChild(sec);
        });
        return;
      }
      // mode hasil: flat + label kategori
      const list = filtered();
      const sec = T.el('<div class="reswrap"><div class="resline"><h2>' + (needle ? 'Hasil pencarian' : esc(catName(activeCat))) + '</h2><span class="n">' + list.length + ' dari ' + total + '</span></div><div class="trows" id="resrows"></div></div>');
      dir.appendChild(sec);
      const rows = sec.querySelector('#resrows');
      if (!list.length) {
        // Empty state yang ngobrol + kasih jalan keluar (contoh bisa di-tap),
        // bukan sekadar "tidak ketemu" yang buntu.
        const emp = T.el('<div class="empty"><b>Hmm, nggak ketemu nih.</b><p>Coba kata lain, atau intip contoh ini:</p><div class="sugx"></div></div>');
        const sx = emp.querySelector('.sugx');
        ['password', 'qr code', 'kalkulator', 'terbilang'].forEach((s) => {
          const c = T.el('<button type="button" class="schip">' + esc(s) + '</button>');
          c.addEventListener('click', () => {
            if (debT) { clearTimeout(debT); debT = null; }
            q = s; input.value = s; syncClear(); paint(); trackSearchGlobal(s);
          });
          sx.appendChild(c);
        });
        rows.appendChild(emp);
        return;
      }
      list.forEach((t, i) => rows.appendChild(rowEl(t, i, true)));
    };

    input.addEventListener('input', () => { q = input.value; syncClear(); paint(); scheduleTrack(); });
    const cancelTrack = () => { if (debT) { clearTimeout(debT); debT = null; } };
    clear.addEventListener('click', () => { q = ''; input.value = ''; lastTracked = ''; cancelTrack(); syncClear(); paint(); input.focus(); });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        cancelTrack();
        trackSearchGlobal(input.value);
      }
      if (e.key === 'Escape') { q = ''; input.value = ''; lastTracked = ''; cancelTrack(); syncClear(); paint(); input.blur(); }
    });
    syncClear();
    paint();
    renderSug();
    renderQuick(v.querySelector('#quick'));
    app.appendChild(w);
    if (q) { input.focus(); try { input.setSelectionRange(input.value.length, input.value.length); } catch (e) {} }
  }

  // shortcut global: Ctrl/Cmd+K = command palette, "/" = fokus search (home).
  // Esc menutup palette dari mana pun.
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && String(e.key).toLowerCase() === 'k') {
      e.preventDefault();
      openPalette();
      return;
    }
    if (e.key === 'Escape' && palEl) { closePalette(); return; }
    if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
    const tag = (document.activeElement && document.activeElement.tagName) || '';
    if (/INPUT|TEXTAREA|SELECT/.test(tag)) return;
    const box = document.getElementById('q');
    if (box) { e.preventDefault(); box.focus(); }
  });
  window.addEventListener('hashchange', closePalette); // navigasi lain menutup palette

  function toolPage(id) {
    runLeave();
    const t = tools.find((x) => x.id === id);
    app.innerHTML = '';
    const w = T.el('<div class="wrap narrow"><div class="view"></div></div>');
    const v = w.firstElementChild;
    if (!t) {
      v.innerHTML = '<a class="back" href="#/">← Semua tools</a><div class="empty"><b>Yah, alamatnya kayaknya salah.</b><p>Balik ke beranda aja, semua tools ada di sana.</p></div>';
      app.appendChild(w);
      return;
    }
    v.innerHTML =
      '<header class="tool-head">' +
        '<span class="tic">' + esc(t.icon || '+') + '</span>' +
        '<div><h2>' + esc(t.name) + '</h2>' +
        '<div class="meta"><span class="tag">' + esc(catName(t.cat)) + '</span><span>' + esc(t.desc) + '</span></div></div>' +
      '</header>' +
      '<div class="tool" id="toolbox"><div class="skel"><i class="short"></i><i></i><i class="tall"></i></div></div>' +
      '<section class="related" id="rel"></section>' +
      '<footer class="foot">Data diproses lokal di browser kamu.</footer>';
    app.appendChild(w);
    pushRecent(id);

    // tools terkait (kategori sama)
    const rel = tools.filter((x) => x.cat === t.cat && x.id !== t.id).slice(0, 3);
    if (rel.length) {
      const box = v.querySelector('#rel');
      const relWrap = T.el('<div class="relwrap"><h3>Lihat juga</h3><div class="trows"></div></div>');
      box.appendChild(relWrap);
      const rows = relWrap.querySelector('.trows');
      rel.forEach((r, i) => rows.appendChild(rowEl(r, i, false)));
    }

    const toolbox = v.querySelector('#toolbox');

    // dock bawah: kembali + favorit + bagikan — dalam jangkauan jempol
    const dockFav = isFav(t.id);
    const dock = T.el(
      '<nav class="dock" aria-label="Aksi cepat">' +
        '<a class="dock-btn" href="#/">←<span>Kembali</span></a>' +
        '<button type="button" class="dock-btn dfav' + (dockFav ? ' on' : '') + '" aria-pressed="' + dockFav + '" aria-label="Tambah ke favorit">★<span>Favorit</span></button>' +
        '<button type="button" class="dock-btn dshare" aria-label="Bagikan tool ini">↗<span>Bagikan</span></button>' +
      '</nav>'
    );
    document.body.appendChild(dock);
    T.onLeave(() => dock.remove());
    const dfavBtn = dock.querySelector('.dfav');
    dfavBtn.addEventListener('click', () => {
      const on = toggleFav(t.id);
      dfavBtn.classList.toggle('on', on);
      dfavBtn.setAttribute('aria-pressed', on);
      syncFavBtns(t.id, on);
      T.toast(on ? 'Sip, masuk favorit' : 'Dihapus dari favorit');
    });
    dock.querySelector('.dshare').addEventListener('click', async () => {
      const url = location.origin + location.pathname + '#/t/' + encodeURIComponent(t.id);
      if (navigator.share) {
        try { await navigator.share({ title: t.name + ' — ADIP Tools', text: t.desc, url: url }); }
        catch (e) { /* user membatalkan */ }
      } else {
        T.copy(url);
      }
    });

    requestAnimationFrame(() => {
      const sk = toolbox.querySelector('.skel');
      if (sk) sk.remove();
      // FASE 2: kode tool di-load on-demand; skeleton tampil selama fetch modul.
      loadToolRender(t).then((render) => {
        try {
          render(toolbox);
        } catch (e) {
          // Error yang menenangkan + kasih jalan keluar (coba lagi),
          // bukan pesan teknis yang bikin bingung. Detail ke console aja.
          if (window.console) console.warn('[adip-tools] render gagal:', e);
          const box = T.el('<div class="out"><span class="err">Yah, tool-nya gagal kebuka.</span><div class="retry"></div></div>');
          box.querySelector('.retry').appendChild(T.btn('Coba lagi', () => route(), true));
          toolbox.innerHTML = '';
          toolbox.appendChild(box);
        }
      }).catch((e) => {
        if (window.console) console.warn('[adip-tools] load tool gagal:', e);
        const box = T.el('<div class="out"><span class="err">Yah, tool-nya gagal dimuat. Cek koneksi lalu coba lagi.</span><div class="retry"></div></div>');
        box.querySelector('.retry').appendChild(T.btn('Coba lagi', () => route(), true));
        toolbox.innerHTML = '';
        toolbox.appendChild(box);
      });
    });
    window.scrollTo(0, 0);
  }

  function route() {
    const h = location.hash || '#/';
    if (h.indexOf('#/t/') === 0) toolPage(decodeURIComponent(h.slice(4)));
    else if (h === '#/' || h === '') home();
  }
  window.addEventListener('hashchange', route);
  route();
