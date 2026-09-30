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
    const w = T.el('<div class="wrap"><div class="view"></div></div>');
    const v = w.firstElementChild;
    const total = NS.tools.length;
    v.innerHTML =
      '<header class="topbar">' +
        '<a class="brand" href="#/"><span class="mark">A</span><span class="wm">ADIP Tools <span>· perkakas browser</span></span></a>' +
        '<span class="count-pill"><b>' + total + '</b> tools</span>' +
      '</header>' +
      '<section class="hero">' +
        '<p class="eyebrow">Gratis · Tanpa daftar</p>' +
        '<h1><span class="n">100</span> tools, satu browser.</h1>' +
        '<p class="sub">Kalkulator, converter, dan generator harian — jalan langsung di HP kamu, tanpa daftar dan tanpa upload.</p>' +
        '<div class="hero-cta">' +
          '<a class="btn-hero" href="#daftar">Jelajahi tools ↓</a>' +
          '<div class="stats"><span><b>14</b> kategori</span><span><b>0</b> data keluar</span></div>' +
        '</div>' +
      '</section>' +
      '<div class="searchbar"><div class="box">' +
        '<span class="glyph">⌕</span>' +
        '<input id="q" type="search" placeholder="Cari tools… misal: password, QR, THR" autocomplete="off" aria-label="Cari tools">' +
        '<button type="button" class="clear" id="qclear" aria-label="Hapus pencarian">✕</button>' +
      '</div></div>' +
      '<div class="chips" id="chips"></div>' +
      '<div class="sec-head" id="daftar"><h2>Semua tools</h2><span class="res" id="res"></span></div>' +
      '<div class="grid" id="grid"></div>' +
      '<footer class="foot"><span class="fmark">A</span><br>Dibuat dengan teliti.<br><b>Data tidak pernah keluar dari browser kamu.</b></footer>';

    const chips = v.querySelector('#chips');
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

    const input = v.querySelector('#q');
    const clear = v.querySelector('#qclear');
    const res = v.querySelector('#res');
    input.value = q;
    const grid = v.querySelector('#grid');
    const syncClear = () => clear.classList.toggle('show', !!input.value);
    const paint = () => {
      const needle = q.trim().toLowerCase();
      const list = NS.tools.filter((t) => {
        if (activeCat !== 'semua' && t.cat !== activeCat) return false;
        if (!needle) return true;
        return (t.name + ' ' + t.desc + ' ' + catName(t.cat)).toLowerCase().includes(needle);
      });
      res.textContent = (needle || activeCat !== 'semua') ? list.length + ' dari ' + total : total + ' tools';
      grid.innerHTML = '';
      if (!list.length) {
        grid.appendChild(T.el('<div class="empty"><b>Tidak ketemu.</b>Coba kata kunci lain atau pilih kategori berbeda.</div>'));
        return;
      }
      list.forEach((t) => {
        const a = T.el(
          '<a class="card" href="#/t/' + encodeURIComponent(t.id) + '">' +
            '<span class="ic">' + esc(t.icon || '🔧') + '</span>' +
            '<span class="nm">' + esc(t.name) + '</span>' +
            '<span class="ds">' + esc(t.desc) + '</span>' +
            '<span class="cat">' + esc(catName(t.cat)) + '</span>' +
          '</a>'
        );
        grid.appendChild(a);
      });
    };
    input.addEventListener('input', () => { q = input.value; syncClear(); paint(); });
    clear.addEventListener('click', () => { q = ''; input.value = ''; syncClear(); paint(); input.focus(); });
    syncClear();
    paint();
    app.appendChild(w);
    if (q) { input.focus(); try { input.setSelectionRange(input.value.length, input.value.length); } catch (e) {} }
  }

  function toolPage(id) {
    runLeave();
    const t = NS.tools.find((x) => x.id === id);
    app.innerHTML = '';
    const w = T.el('<div class="wrap narrow"><div class="view"></div></div>');
    const v = w.firstElementChild;
    if (!t) {
      v.innerHTML = '<a class="back" href="#/">← Semua tools</a><div class="empty"><b>Tool tidak ditemukan.</b>Alamatnya mungkin salah.</div>';
      app.appendChild(w);
      return;
    }
    v.innerHTML =
      '<a class="back" href="#/">← Semua tools</a>' +
      '<header class="tool-head">' +
        '<span class="tic">' + esc(t.icon || '🔧') + '</span>' +
        '<div><h2>' + esc(t.name) + '</h2>' +
        '<div class="meta"><span class="tag">' + esc(catName(t.cat)) + '</span><span>' + esc(t.desc) + '</span></div></div>' +
      '</header>' +
      '<div class="tool" id="toolbox"><div class="skel"><i class="short"></i><i></i><i class="tall"></i></div></div>' +
      '<footer class="foot">Data diproses lokal di browser kamu.</footer>';
    app.appendChild(w);
    const box = v.querySelector('#toolbox');
    requestAnimationFrame(() => {
      box.querySelector('.skel').remove();
      try {
        t.render(box);
      } catch (e) {
        box.innerHTML = '<div class="out"><span class="err">Tool gagal dimuat.</span><br><span class="dim">' + esc(String(e && e.message || e)) + '</span></div>';
      }
    });
    window.scrollTo(0, 0);
  }

  function route() {
    const h = location.hash || '#/';
    if (h.indexOf('#/t/') === 0) toolPage(decodeURIComponent(h.slice(4)));
    else if (h === '#/' || h === '') home();
    // hash jangkar lain (mis. #daftar): jangan render ulang, biarkan browser scroll
  }
  window.addEventListener('hashchange', route);
  route();
})();
