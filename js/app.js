/* ADIP Tools — router, search, kategori, grid, halaman tool. */
(function () {
  const NS = window.ADIPTOOLS;
  const T = NS.h;
  const app = document.getElementById('app');
  const catName = (id) => { const c = NS.cats.find((x) => x[0] === id); return c ? c[1] : id; };
  const esc = T.esc;

  let q = '', activeCat = 'semua';

  function runLeave() {
    const cbs = NS.leaveCbs.splice(0, NS.leaveCbs.length);
    cbs.forEach((fn) => { try { fn(); } catch (e) {} });
  }

  function home() {
    runLeave();
    app.innerHTML = '';
    const w = T.el('<div class="wrap"></div>');
    const total = NS.tools.length;
    w.innerHTML =
      '<header class="hero">' +
        '<div class="brand"><div class="logo">A</div>' +
        '<h1>ADIP Tools<small>100 tools gratis, langsung di browser</small></h1></div>' +
        '<p class="sub">Kumpulan alat bantu harian: kalkulator, converter, generator, dan lainnya. ' +
        'Semuanya jalan 100% di HP kamu — tanpa daftar, tanpa upload, tanpa dilacak.</p>' +
        '<span class="count"><b>' + total + '</b> tools tersedia</span>' +
      '</header>' +
      '<div class="search"><input id="q" type="search" placeholder="Cari tools… misal: password, QR, THR" autocomplete="off"></div>' +
      '<div class="chips" id="chips"></div>' +
      '<div class="grid" id="grid"></div>' +
      '<footer class="foot">Dibuat dengan teliti · <b>data tidak pernah keluar dari browser kamu</b></footer>';

    const chips = w.querySelector('#chips');
    const mkChip = (id, label, n) => {
      const c = T.el('<button type="button" class="chip' + (activeCat === id ? ' on' : '') + '">' + esc(label) + (n != null ? '<span class="n">' + n + '</span>' : '') + '</button>');
      c.addEventListener('click', () => { activeCat = id; home(); });
      return c;
    };
    chips.appendChild(mkChip('semua', 'Semua', total));
    NS.cats.forEach(([id, label]) => {
      const n = NS.tools.filter((t) => t.cat === id).length;
      if (n) chips.appendChild(mkChip(id, label, n));
    });

    const input = w.querySelector('#q');
    input.value = q;
    const grid = w.querySelector('#grid');
    const paint = () => {
      const needle = q.trim().toLowerCase();
      const list = NS.tools.filter((t) => {
        if (activeCat !== 'semua' && t.cat !== activeCat) return false;
        if (!needle) return true;
        return (t.name + ' ' + t.desc).toLowerCase().includes(needle);
      });
      grid.innerHTML = '';
      if (!list.length) {
        grid.appendChild(T.el('<div class="empty">Tidak ketemu. Coba kata kunci lain.</div>'));
        return;
      }
      list.forEach((t) => {
        const a = T.el(
          '<a class="card" href="#/t/' + encodeURIComponent(t.id) + '">' +
            '<span class="ic">' + esc(t.icon || '🔧') + '</span>' +
            '<span class="nm">' + esc(t.name) + '</span>' +
            '<span class="ds">' + esc(t.desc) + '</span>' +
          '</a>'
        );
        grid.appendChild(a);
      });
    };
    input.addEventListener('input', () => { q = input.value; paint(); });
    paint();
    app.appendChild(w);
    const si = w.querySelector('#q');
    if (q) { si.focus(); si.setSelectionRange(si.value.length, si.value.length); }
  }

  function toolPage(id) {
    runLeave();
    const t = NS.tools.find((x) => x.id === id);
    app.innerHTML = '';
    const w = T.el('<div class="wrap narrow"></div>');
    if (!t) {
      w.innerHTML = '<a class="back" href="#/">← Kembali</a><div class="empty">Tool tidak ditemukan.</div>';
      app.appendChild(w);
      return;
    }
    w.innerHTML =
      '<a class="back" href="#/">← Semua tools</a>' +
      '<div class="tool-head"><h2><span>' + esc(t.icon || '🔧') + '</span> ' + esc(t.name) + '</h2>' +
      '<p>' + esc(t.desc) + ' · <span class="dim">' + esc(catName(t.cat)) + '</span></p></div>';
    const box = T.el('<div class="tool"></div>');
    w.appendChild(box);
    w.appendChild(T.el('<footer class="foot">Data diproses lokal di browser kamu.</footer>'));
    app.appendChild(w);
    try {
      t.render(box);
    } catch (e) {
      box.innerHTML = '<div class="out"><span class="err">Tool gagal dimuat.</span><br><span class="dim">' + esc(String(e && e.message || e)) + '</span></div>';
    }
    window.scrollTo(0, 0);
  }

  function route() {
    const h = location.hash || '#/';
    if (h.indexOf('#/t/') === 0) toolPage(decodeURIComponent(h.slice(4)));
    else home();
  }
  window.addEventListener('hashchange', route);
  route();
})();
