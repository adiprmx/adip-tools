/* ADIP Tools — core namespace & helpers.
 * Kontrak untuk file tools-*.js:
 *   (function () {
 *     const NS = (window.ADIPTOOLS = window.ADIPTOOLS || { tools: [], utils: {}, cats: [], leaveCbs: [] });
 *     const T = NS.h;
 *     NS.tools.push({ id:'contoh', name:'Contoh', cat:'converter', icon:'🔧',
 *       desc:'Deskripsi singkat satu baris.',
 *       render(root){ root.appendChild(T.el('<p>Halo</p>')); } });
 *   })();
 * Aturan: render(root) membangun DOM di dalam root memakai helper T.
 * Jangan akses document.body langsung. Bersihkan timer/audio via T.onLeave(fn).
 */
(function () {
  const NS = (window.ADIPTOOLS = window.ADIPTOOLS || { tools: [], utils: {}, leaveCbs: [] });

  NS.cats = [
    ['keamanan', 'Keamanan'],
    ['converter', 'Converter'],
    ['developer', 'Developer'],
    ['desain', 'Desain'],
    ['indonesia', 'Indonesia'],
    ['musik', 'Musik & Audio'],
    ['gambar', 'Gambar'],
    ['teks', 'Teks'],
    ['bisnis', 'Bisnis'],
    ['sehari', 'Sehari-hari'],
    ['fun', 'Fun'],
    ['produktivitas', 'Produktivitas'],
    ['pelajar', 'Pelajar'],
    ['liveapi', 'Live API'],
  ];

  const escMap = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => escMap[c]);

  function el(html) {
    const t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }

  function toast(msg) {
    let n = document.querySelector('.toast');
    if (!n) {
      n = document.createElement('div');
      n.className = 'toast';
      document.body.appendChild(n);
    }
    n.textContent = msg;
    n.classList.add('show');
    clearTimeout(n._t);
    n._t = setTimeout(() => n.classList.remove('show'), 2200);
  }

  function copy(text) {
    const done = () => toast('Disalin ke clipboard');
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(String(text)).then(done, () => fallback());
    } else fallback();
    function fallback() {
      const ta = document.createElement('textarea');
      ta.value = String(text);
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); done(); } catch (e) { toast('Gagal menyalin'); }
      ta.remove();
    }
  }

  function dl(filename, content, mime) {
    const blob = content instanceof Blob ? content : new Blob([content], { type: mime || 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  const fmtN = new Intl.NumberFormat('id-ID');
  const fmt = (n) => fmtN.format(n);
  const rp = (n) => 'Rp' + fmtN.format(Math.round(Number(n) || 0));

  // Parse angka ala Indonesia: "1.500.000,50" -> 1500000.5 ; "1500000" -> 1500000
  function num(v) {
    if (typeof v === 'number') return v;
    let s = String(v == null ? '' : v).trim().replace(/\s/g, '');
    if (!s) return NaN;
    if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
    const n = Number(s);
    return n;
  }

  function btn(label, onClick, primary, disabled) {
    const b = el(`<button type="button" class="btn${primary ? ' primary' : ''}">${esc(label)}</button>`);
    if (disabled) b.disabled = true;
    b.addEventListener('click', onClick);
    return b;
  }

  function field(labelText, inputEl, hint) {
    const f = el('<div class="fld"></div>');
    if (!inputEl.id) inputEl.id = 'f' + Math.random().toString(36).slice(2, 9);
    const lb = el(`<label for="${inputEl.id}">${esc(labelText)}</label>`);
    f.appendChild(lb);
    f.appendChild(inputEl);
    if (hint) f.appendChild(el(`<div class="hint">${esc(hint)}</div>`));
    return f;
  }

  function input(type, placeholder, value) {
    const i = document.createElement('input');
    i.className = 'inp';
    i.type = type || 'text';
    if (placeholder) i.placeholder = placeholder;
    if (value != null) i.value = value;
    if (type === 'number' || type === 'text') i.inputMode = type === 'number' ? 'decimal' : 'text';
    return i;
  }

  function select(pairs, value) {
    const s = el('<select class="inp"></select>');
    pairs.forEach(([v, l]) => {
      const o = document.createElement('option');
      o.value = v; o.textContent = l;
      if (String(v) === String(value)) o.selected = true;
      s.appendChild(o);
    });
    return s;
  }

  function ta(rows, placeholder, value) {
    const t = document.createElement('textarea');
    t.className = 'inp';
    t.rows = rows || 4;
    if (placeholder) t.placeholder = placeholder;
    if (value != null) t.value = value;
    return t;
  }

  function out() {
    return el('<div class="out" hidden></div>');
  }
  function show(box, html) {
    box.hidden = false;
    box.innerHTML = html;
  }
  function hide(box) { box.hidden = true; box.innerHTML = ''; }

  function copyBtn(getText, label) {
    const b = btn(label || 'Salin', null);
    const orig = b.textContent;
    b.addEventListener('click', () => {
      const t = getText();
      if (t == null || String(t) === '') { toast('Belum ada yang bisa disalin'); return; }
      const done = () => {
        b.textContent = '✓ Tersalin';
        b.classList.add('done');
        clearTimeout(b._rt);
        b._rt = setTimeout(() => { b.textContent = orig; b.classList.remove('done'); }, 1600);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(String(t)).then(done, () => fallback());
      } else fallback();
      function fallback() {
        const ta = document.createElement('textarea');
        ta.value = String(t);
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); done(); } catch (e) { toast('Gagal menyalin'); }
        ta.remove();
      }
    });
    return b;
  }

  function dlBtn(filename, getContent, mime, label) {
    return btn(label || 'Unduh', () => dl(filename, getContent(), mime));
  }

  function row(...children) {
    const r = el('<div class="row"></div>');
    children.forEach((c) => c && r.appendChild(c));
    return r;
  }

  function grid2(...children) {
    const g = el('<div class="grid2"></div>');
    children.forEach((c) => c && g.appendChild(c));
    return g;
  }

  function onLeave(fn) { NS.leaveCbs.push(fn); }

  // Shared AudioContext (dibuat saat user gesture pertama)
  let _actx = null;
  function actx() {
    if (!_actx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      _actx = new AC();
    }
    if (_actx.state === 'suspended') _actx.resume();
    return _actx;
  }
  function beep(freq, dur, type, delay) {
    try {
      const c = actx(), t = c.currentTime + (delay || 0);
      const o = c.createOscillator(), g = c.createGain();
      o.type = type || 'sine'; o.frequency.value = freq || 440;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.5, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + (dur || 0.2));
      o.connect(g); g.connect(c.destination);
      o.start(t); o.stop(t + (dur || 0.2) + 0.05);
    } catch (e) { /* audio tidak tersedia */ }
  }

  // Muat script CDN sekali, resolve true/false
  const _loaded = {};
  function loadScript(src) {
    if (_loaded[src]) return Promise.resolve(_loaded[src] === 'ok');
    _loaded[src] = 'loading';
    return new Promise((resolve) => {
      const s = document.createElement('script');
      s.src = src; s.async = true;
      s.onload = () => { _loaded[src] = 'ok'; resolve(true); };
      s.onerror = () => { _loaded[src] = 'fail'; resolve(false); };
      document.head.appendChild(s);
    });
  }

  NS.h = {
    el, esc, btn, field, input, select, ta, out, show, hide,
    copy, copyBtn, dl, dlBtn, toast, row, grid2, onLeave,
    fmt, rp, num, actx, beep, loadScript,
  };
})();
