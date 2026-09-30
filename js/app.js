/* ADIP Tools v3: command deck, search sebagai hero, direktori rich-list. */
(function () {
  const NS = window.ADIPTOOLS;
  const T = NS.h;
  const app = document.getElementById('app');
  const catName = (id) => { const c = NS.cats.find((x) => x[0] === id); return c ? c[1] : id; };
  const esc = T.esc;

  const POPULAR = [
    ['password-generator', 'Password'],
    ['qr-generator', 'QR Code'],
    ['thr', 'THR'],
    ['weton', 'Weton'],
    ['terbilang', 'Terbilang'],
    ['base64', 'Base64'],
  ];

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

  let q = '', activeCat = 'semua';

  function runLeave() {
    const cbs = NS.leaveCbs.splice(0, NS.leaveCbs.length);
    cbs.forEach((fn) => { try { fn(); } catch (e) {} });
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
        '<span class="go">↗</span>' +
      '</a>'
    );
    a.querySelector('.fav').addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const btn = e.currentTarget;
      const on = toggleFav(t.id);
      syncFavBtns(t.id, on);
      btn.classList.remove('pop');
      void btn.offsetWidth;
      btn.classList.add('pop');
      T.toast(on ? 'Ditambah ke favorit' : 'Dihapus dari favorit');
      setTimeout(refreshQuick, 280);
    });
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

  // Section "Favorit" + "Terakhir dibuka" di home. Favorit hanya muncul bila ≥1;
  // kalau user baru saja menghapus favorit terakhir, tampilkan empty state ramah.
  function renderQuick(box) {
    const hadFav = !!box.querySelector('[data-qsec="fav"]');
    box.innerHTML = '';
    const favs = getFavs().map((id) => NS.tools.find((x) => x.id === id)).filter(Boolean);
    if (favs.length) {
      const sec = T.el('<section class="qsec" data-qsec="fav"><div class="qsec-head"><h2>★ Favorit</h2><span class="n">' + favs.length + '</span></div><div class="trows"></div></section>');
      const rows = sec.querySelector('.trows');
      favs.forEach((t, i) => rows.appendChild(rowEl(t, i, true)));
      box.appendChild(sec);
    } else if (hadFav) {
      box.appendChild(T.el('<section class="qsec" data-qsec="fav"><div class="qsec-head"><h2>★ Favorit</h2></div><p class="qempty">Belum ada favorit. Tap ☆ di tool yang sering kamu pakai.</p></section>'));
    }
    const recents = getRecent().map((id) => NS.tools.find((x) => x.id === id)).filter(Boolean);
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
    return NS.tools.filter((t) => {
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
    const total = NS.tools.length;

    v.innerHTML =
      '<header class="topbar">' +
        '<a class="brand" href="#/"><span class="mark">A</span><span class="wm">ADIP Tools <span>· perkakas browser</span></span></a>' +
        '<span class="topcount"><b>' + total + '</b> tools</span>' +
      '</header>' +
      '<section class="hero">' +
        '<p class="eyebrow">Gratis · Tanpa daftar</p>' +
        '<h1>Butuh <span class="qm">apa?</span></h1>' +
        '<p class="sub"><b>100 tools gratis</b> yang jalan langsung di browser. Ketik yang kamu cari, klik, langsung pakai. Tanpa daftar, tanpa upload.</p>' +
        '<div class="msearch"><div class="box">' +
          '<input id="q" type="search" placeholder="Cari tools… misal: password, QR, THR" autocomplete="off" aria-label="Cari tools">' +
          '<span class="glyph">⌕</span>' +
          '<button type="button" class="clear" id="qclear" aria-label="Hapus pencarian">✕</button>' +
          '<kbd>/</kbd>' +
        '</div></div>' +
        '<div class="sug" id="sug"><span class="lbl">Sering dicari</span>' +
          POPULAR.map(([id, label]) => '<a href="#/t/' + id + '">' + esc(label) + '</a>').join('') +
        '</div>' +
      '</section>' +
      '<div id="quick"></div>' +
      '<nav class="rail" id="rail" aria-label="Kategori"></nav>' +
      '<main class="dir" id="dir"></main>' +
      '<footer class="foot"><span class="fmark">A</span><br>Dibuat dengan teliti.<br><b>Data tidak pernah keluar dari browser kamu.</b></footer>';

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
    NS.cats.forEach(([id, label]) => {
      const n = NS.tools.filter((t) => t.cat === id).length;
      if (n) rail.appendChild(mkTile(id, label, n));
    });

    const input = v.querySelector('#q');
    const clear = v.querySelector('#qclear');
    const sug = v.querySelector('#sug');
    const dir = v.querySelector('#dir');
    input.value = q;

    const syncClear = () => clear.classList.toggle('show', !!input.value);

    const paint = () => {
      const needle = q.trim();
      const searching = !!needle || activeCat !== 'semua';
      sug.style.display = needle ? 'none' : '';
      dir.innerHTML = '';
      if (!searching) {
        // mode jelajah: section per kategori
        let ci = 0;
        NS.cats.forEach(([id, label]) => {
          const list = NS.tools.filter((t) => t.cat === id);
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
        rows.appendChild(T.el('<div class="empty"><b>Tidak ketemu.</b><p>Coba kata kunci lain, atau telusuri kategori di atas.</p></div>'));
        return;
      }
      list.forEach((t, i) => rows.appendChild(rowEl(t, i, true)));
    };

    input.addEventListener('input', () => { q = input.value; syncClear(); paint(); });
    clear.addEventListener('click', () => { q = ''; input.value = ''; syncClear(); paint(); input.focus(); });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { q = ''; input.value = ''; syncClear(); paint(); input.blur(); }
    });
    syncClear();
    paint();
    renderQuick(v.querySelector('#quick'));
    app.appendChild(w);
    if (q) { input.focus(); try { input.setSelectionRange(input.value.length, input.value.length); } catch (e) {} }
  }

  // shortcut "/" untuk fokus ke search (saat di home)
  document.addEventListener('keydown', (e) => {
    if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
    const tag = (document.activeElement && document.activeElement.tagName) || '';
    if (/INPUT|TEXTAREA|SELECT/.test(tag)) return;
    const box = document.getElementById('q');
    if (box) { e.preventDefault(); box.focus(); }
  });

  function toolPage(id) {
    runLeave();
    const t = NS.tools.find((x) => x.id === id);
    app.innerHTML = '';
    const w = T.el('<div class="wrap narrow"><div class="view"></div></div>');
    const v = w.firstElementChild;
    if (!t) {
      v.innerHTML = '<a class="back" href="#/">← Semua tools</a><div class="empty"><b>Tool tidak ditemukan.</b><p>Alamatnya mungkin salah.</p></div>';
      app.appendChild(w);
      return;
    }
    v.innerHTML =
      '<a class="back" href="#/">← Semua tools</a>' +
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
    const rel = NS.tools.filter((x) => x.cat === t.cat && x.id !== t.id).slice(0, 3);
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
      T.toast(on ? 'Ditambah ke favorit' : 'Dihapus dari favorit');
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
      try {
        t.render(toolbox);
      } catch (e) {
        toolbox.innerHTML = '<div class="out"><span class="err">Tool gagal dimuat.</span><br><span class="dim">' + esc(String(e && e.message || e)) + '</span></div>';
      }
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
})();
