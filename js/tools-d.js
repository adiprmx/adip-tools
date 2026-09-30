/* ADIP Tools — tools-d.js
 * Kategori: Gambar & Media (5), Teks & Konten (10), Bisnis & Keuangan (4).
 * SEMUA pemrosesan file 100% lokal di browser (canvas/FileReader) —
 * tidak ada satu byte pun yang diupload ke mana-mana.
 */
(function () {
  const NS = (window.ADIPTOOLS = window.ADIPTOOLS || { tools: [], utils: {}, cats: [], leaveCbs: [] });
  const T = NS.h;
  const R = (id, name, cat, icon, desc, render) => NS.tools.push({ id, name, cat, icon, desc, render });

  const LOCAL_NOTE = 'Semua diproses 100% lokal di HP kamu — file tidak diupload ke mana-mana.';

  // ---------- helper lokal (non-DOM) ----------
  function loadImage(file) {
    return new Promise((res, rej) => {
      if (!file || !/^image\//.test(file.type)) return rej(new Error('not-image'));
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => { URL.revokeObjectURL(url); res(img); };
      img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('bad-image')); };
      img.src = url;
    });
  }

  function fmtBytes(n) {
    if (!n && n !== 0) return '-';
    if (n < 1024) return n + ' B';
    if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
    return (n / 1024 / 1024).toFixed(2) + ' MB';
  }

  function canvasToBlob(canvas, type, q) {
    return new Promise((res) => canvas.toBlob((b) => res(b), type, q));
  }

  function fileInput(accept) {
    const i = document.createElement('input');
    i.type = 'file';
    i.accept = accept || 'image/*';
    return i;
  }

  function imgEl(src, alt) {
    const im = document.createElement('img');
    im.src = src; im.alt = alt || '';
    im.style.cssText = 'max-width:100%;height:auto;border-radius:10px;border:1px solid #ffffff20;display:block';
    return im;
  }

  // ================= FUNGSI MURNI (NS.utils) =================

  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { const t = a % b; a = b; b = t; } return a || 1; }

  NS.utils.simplifyRatio = function (w, h) {
    w = Math.round(Number(w)); h = Math.round(Number(h));
    if (!w || !h || w < 0 || h < 0) return '';
    const g = gcd(w, h);
    return (w / g) + ':' + (h / g);
  };

  NS.utils.waFormat = function (text, kind) {
    const s = String(text == null ? '' : text);
    const wrap = { bold: '*', italic: '_', strike: '~', mono: '```' };
    const m = wrap[kind];
    if (!m) return s;
    return m + s + m;
  };

  // --- fancy text: peta unicode dihitung dari offset code point ---
  const FANCY_STYLES = ['bold', 'italic', 'mono', 'script', 'struck', 'circled', 'fullwidth'];
  function fancyChar(ch, style) {
    const cp = ch.codePointAt(0);
    const az = cp >= 65 && cp <= 90, za = cp >= 97 && cp <= 122, d = cp >= 48 && cp <= 57;
    switch (style) {
      case 'bold':
        if (az) return String.fromCodePoint(0x1D400 + cp - 65);
        if (za) return String.fromCodePoint(0x1D41A + cp - 97);
        if (d) return String.fromCodePoint(0x1D7CE + cp - 48);
        return ch;
      case 'italic':
        if (az) return String.fromCodePoint(0x1D434 + cp - 65);
        if (za) return String.fromCodePoint(0x1D44E + cp - 97);
        return ch;
      case 'mono':
        if (az) return String.fromCodePoint(0x1D670 + cp - 65);
        if (za) return String.fromCodePoint(0x1D68A + cp - 97);
        if (d) return String.fromCodePoint(0x1D7F6 + cp - 48);
        return ch;
      case 'script': {
        // beberapa huruf script punya code point khusus
        const special = { B: 0x212C, E: 0x2130, F: 0x2131, H: 0x210B, I: 0x2110, L: 0x2112, M: 0x2133, R: 0x211B, e: 0x212F, g: 0x210A, o: 0x2134 };
        if (special[ch]) return String.fromCodePoint(special[ch]);
        if (az) return String.fromCodePoint(0x1D49C + cp - 65);
        if (za) return String.fromCodePoint(0x1D4B6 + cp - 97);
        return ch;
      }
      case 'struck':
        if (az) return String.fromCodePoint(0x1D538 + cp - 65);
        if (za) return String.fromCodePoint(0x1D552 + cp - 97);
        if (d) return String.fromCodePoint(0x1D7D8 + cp - 48);
        return ch;
      case 'circled':
        if (az) return String.fromCodePoint(0x24B6 + cp - 65);
        if (za) return String.fromCodePoint(0x24D0 + cp - 97);
        if (d) return String.fromCodePoint(cp === 48 ? 0x24EA : 0x2460 + cp - 49);
        return ch;
      case 'fullwidth':
        if (cp === 32) return String.fromCodePoint(0x3000);
        if (cp >= 33 && cp <= 126) return String.fromCodePoint(cp + 0xFEE0);
        return ch;
      default: return ch;
    }
  }
  NS.utils.fancy = function (text, style) {
    return Array.from(String(text == null ? '' : text)).map((c) => fancyChar(c, style)).join('');
  };
  NS.utils.fancyStyles = FANCY_STYLES;

  // --- ekstrak kontak ---
  NS.utils.extractEmails = function (s) {
    const m = String(s == null ? '' : s).match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
    return [...new Set(m || [])];
  };
  NS.utils.extractPhones = function (s) {
    const str = String(s == null ? '' : s);
    const m = str.match(/(?:\+?62|0)8\d{7,11}\b/g);
    return [...new Set((m || []).map((x) => x.replace(/^\+/, '')))];
  };

  // --- harga jual ---
  NS.utils.hargaJual = function (modal, marginPct) {
    modal = Number(modal); marginPct = Number(marginPct);
    if (!isFinite(modal) || !isFinite(marginPct) || modal < 0 || marginPct < 0 || marginPct >= 100) return NaN;
    return modal / (1 - marginPct / 100);
  };
  NS.utils.marginAktual = function (modal, jual) {
    modal = Number(modal); jual = Number(jual);
    if (!isFinite(modal) || !isFinite(jual) || jual <= 0) return NaN;
    return ((jual - modal) / jual) * 100;
  };

  // --- cat tembok ---
  NS.utils.catTembok = function (p, l, t, lapis, dayaSebar, kurangBukaan) {
    p = T.num(p); l = T.num(l); t = T.num(t);
    lapis = T.num(lapis) || 0; dayaSebar = T.num(dayaSebar) || 0; kurangBukaan = T.num(kurangBukaan) || 0;
    let luas = 2 * (p + l) * t - kurangBukaan;
    if (!isFinite(luas) || luas < 0) luas = 0;
    let liter = 0;
    if (dayaSebar > 0) liter = (luas * lapis) / dayaSebar;
    return { luas: Math.round(luas * 100) / 100, liter: Math.round(liter * 100) / 100 };
  };

  // --- diff per baris (LCS sederhana) ---
  NS.utils.diffLines = function (a, b) {
    const A = String(a == null ? '' : a).split('\n');
    const B = String(b == null ? '' : b).split('\n');
    const n = A.length, m = B.length;
    const dp = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
    for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = A[i] === B[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
    const ops = [];
    let i = 0, j = 0;
    while (i < n && j < m) {
      if (A[i] === B[j]) { ops.push({ t: 'same', line: A[i] }); i++; j++; }
      else if (dp[i + 1][j] >= dp[i][j + 1]) { ops.push({ t: 'del', line: A[i] }); i++; }
      else { ops.push({ t: 'add', line: B[j] }); j++; }
    }
    while (i < n) { ops.push({ t: 'del', line: A[i] }); i++; }
    while (j < m) { ops.push({ t: 'add', line: B[j] }); j++; }
    return ops;
  };

  // --- dedup & urutkan ---
  NS.utils.dedupSort = function (text, opts) {
    opts = opts || {};
    let lines = String(text == null ? '' : text).split('\n');
    const before = lines.length;
    if (opts.trim) lines = lines.map((x) => x.trim());
    if (opts.empty) lines = lines.filter((x) => x.length > 0);
    if (opts.dedup) {
      const seen = new Set(); const out = [];
      for (const x of lines) { const k = opts.trim ? x : x; if (!seen.has(k)) { seen.add(k); out.push(x); } }
      lines = out;
    }
    if (opts.sort === 'az') lines = lines.slice().sort((x, y) => x.localeCompare(y, 'id'));
    else if (opts.sort === 'za') lines = lines.slice().sort((x, y) => y.localeCompare(x, 'id'));
    return { text: lines.join('\n'), before, after: lines.length, removed: before - lines.length };
  };

  // --- zalgo ---
  const Z_UP = ['\u0300','\u0301','\u0302','\u0303','\u0304','\u0305','\u0306','\u0307','\u0308','\u0309','\u030A','\u030B','\u030C','\u030D','\u030E','\u030F','\u0310','\u0311','\u0312','\u0313','\u0314'];
  const Z_MID = ['\u0315','\u031B','\u0334','\u0335','\u0336','\u0340','\u0341','\u0342','\u0343','\u0344'];
  const Z_DOWN = ['\u0316','\u0317','\u0318','\u0319','\u031A','\u031C','\u031D','\u031E','\u031F','\u0320','\u0321','\u0322','\u0323','\u0324','\u0325','\u0326','\u0327','\u0328','\u0329','\u032A','\u032B','\u032C','\u032D','\u032E','\u032F','\u0330','\u0331','\u0332','\u0333','\u0339','\u033A','\u033B','\u033C'];
  NS.utils.zalgo = function (text, intensity, rand) {
    const r = rand || Math.random;
    const n = Math.max(1, Math.min(12, Math.round(Number(intensity) || 3)));
    return Array.from(String(text == null ? '' : text)).map((ch) => {
      if (ch.trim() === '') return ch;
      let out = ch;
      const pick = (arr) => arr[Math.floor(r() * arr.length)];
      for (let k = 0; k < n; k++) out += pick(Z_UP);
      for (let k = 0; k < Math.ceil(n / 2); k++) out += pick(Z_MID);
      for (let k = 0; k < n; k++) out += pick(Z_DOWN);
      return out;
    }).join('');
  };

  // --- sensor teks ---
  NS.utils.sensorText = function (text, words, mask, autoPhone, autoEmail) {
    let s = String(text == null ? '' : text);
    const m = mask || '***';
    (words || []).forEach((w) => {
      w = String(w).trim();
      if (!w) return;
      const re = new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      s = s.replace(re, m);
    });
    if (autoPhone) {
      const phones = NS.utils.extractPhones(s);
      phones.forEach((p) => { s = s.split(p).join(m); });
    }
    if (autoEmail) {
      const emails = NS.utils.extractEmails(s);
      emails.forEach((e) => { s = s.split(e).join(m); });
    }
    return s;
  };

  // --- lorem ipsum ---
  const LOREM_BANK = [
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
    'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
    'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
    'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam.',
    'Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos.',
    'Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam.',
    'Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum.',
    'At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti.',
    'Et harum quidem rerum facilis est et expedita distinctio, nam libero tempore, cum soluta nobis est eligendi optio.',
    'Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudiandae.',
    'Itaque earum rerum hic tenetur a sapiente delectus, ut aut reiciendis voluptatibus maiores alias consequatur aut.',
    'Perferendis doloribus asperiores repellat, nam libero tempore cum soluta nobis est eligendi optio cumque nihil impedit.',
    'Quo minus id quod maxime placeat facere possimus, omnis voluptas assumenda est, omnis dolor repellendus.',
    'Similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga, et harum quidem rerum.'
  ];
  NS.utils.lorem = function (mode, count) {
    const n = Math.max(1, Math.min(50, Math.round(Number(count) || 3)));
    const pool = LOREM_BANK.slice();
    // acak ringan
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
    if (mode === 'kalimat') {
      const out = [];
      for (let i = 0; i < n; i++) out.push(pool[i % pool.length]);
      return out.join(' ');
    }
    if (mode === 'kata') {
      const words = pool.join(' ').replace(/[.,]/g, '').split(/\s+/);
      const out = [];
      for (let i = 0; i < n; i++) out.push(words[i % words.length]);
      return out.join(' ');
    }
    // paragraf
    const paras = [];
    for (let p = 0; p < n; p++) {
      const k = 4 + Math.floor(Math.random() * 3);
      const s = [];
      for (let i = 0; i < k; i++) s.push(pool[(p * 7 + i) % pool.length]);
      paras.push(s.join(' '));
    }
    return paras.join('\n\n');
  };

  // --- font ASCII 5 baris (ditulis manual) ---
  const ASCII_FONT = {
    ' ': ['     ', '     ', '     ', '     ', '     '],
    'A': [' ### ', '#   #', '#   #', '#####', '#   #'],
    'B': ['#### ', '#   #', '#### ', '#   #', '#### '],
    'C': [' ### ', '#   #', '#    ', '#   #', ' ### '],
    'D': ['#### ', '#   #', '#   #', '#   #', '#### '],
    'E': ['#####', '#    ', '#### ', '#    ', '#####'],
    'F': ['#####', '#    ', '#### ', '#    ', '#    '],
    'G': [' ### ', '#   #', '# ## ', '#   #', ' ####'],
    'H': ['#   #', '#   #', '#####', '#   #', '#   #'],
    'I': ['#####', '  #  ', '  #  ', '  #  ', '#####'],
    'J': ['  ###', '   # ', '   # ', '#  # ', ' ##  '],
    'K': ['#   #', '#  # ', '###  ', '#  # ', '#   #'],
    'L': ['#    ', '#    ', '#    ', '#    ', '#####'],
    'M': ['#   #', '## ##', '# # #', '#   #', '#   #'],
    'N': ['#   #', '##  #', '# # #', '#  ##', '#   #'],
    'O': [' ### ', '#   #', '#   #', '#   #', ' ### '],
    'P': ['#### ', '#   #', '#### ', '#    ', '#    '],
    'Q': [' ### ', '#   #', '#   #', '#  ##', ' ## #'],
    'R': ['#### ', '#   #', '#### ', '#  # ', '#   #'],
    'S': [' ####', '#    ', ' ### ', '    #', '#### '],
    'T': ['#####', '  #  ', '  #  ', '  #  ', '  #  '],
    'U': ['#   #', '#   #', '#   #', '#   #', ' ### '],
    'V': ['#   #', '#   #', '#   #', '#   #', ' ### '],
    'W': ['#   #', '#   #', '# # #', '## ##', '#   #'],
    'X': ['#   #', '#   #', ' ### ', '#   #', '#   #'],
    'Y': ['#   #', '#   #', ' ### ', '  #  ', '  #  '],
    'Z': ['#####', '   # ', '  #  ', ' #   ', '#####'],
    '0': [' ### ', '#  ##', '# # #', '##  #', ' ### '],
    '1': ['  #  ', ' ##  ', '  #  ', '  #  ', '#####'],
    '2': [' ### ', '#   #', '   # ', '  #  ', '#####'],
    '3': ['#####', '   # ', ' ### ', '    #', '#### '],
    '4': ['#   #', '#   #', '#####', '    #', '    #'],
    '5': ['#####', '#    ', '#### ', '    #', '#### '],
    '6': [' ### ', '#    ', '#### ', '#   #', ' ### '],
    '7': ['#####', '   # ', '  #  ', ' #   ', '#    '],
    '8': [' ### ', '#   #', ' ### ', '#   #', ' ### '],
    '9': [' ### ', '#   #', ' ####', '    #', ' ### '],
    '.': ['     ', '     ', '     ', '     ', '  #  '],
    ',': ['     ', '     ', '     ', '  #  ', ' #   '],
    '!': ['  #  ', '  #  ', '  #  ', '     ', '  #  '],
    '?': [' ### ', '#   #', '   # ', '     ', '  #  '],
    '-': ['     ', '     ', '#####', '     ', '     '],
    ':': ['     ', '  #  ', '     ', '  #  ', '     '],
    "'": ['  #  ', '  #  ', '     ', '     ', '     '],
    '(': ['   # ', '  #  ', '  #  ', '  #  ', '   # '],
    ')': [' #   ', '  #  ', '  #  ', '  #  ', ' #   '],
    '&': [' ##  ', '#  # ', ' ##  ', '#  # ', ' ## #'],
    '%': ['##  #', '## # ', '  #  ', ' # ##', '#  ##'],
    '+': ['     ', '  #  ', '#####', '  #  ', '     '],
    '=': ['     ', '#####', '     ', '#####', '     '],
    '/': ['    #', '   # ', '  #  ', ' #   ', '#    '],
    '_': ['     ', '     ', '     ', '     ', '#####']
  };
  NS.utils.asciiArt = function (text) {
    const s = String(text == null ? '' : text).toUpperCase();
    if (!s.trim()) return '';
    const rows = ['', '', '', '', ''];
    for (const ch of s) {
      const g = ASCII_FONT[ch] || ASCII_FONT['?'];
      for (let r = 0; r < 5; r++) rows[r] += g[r] + ' ';
    }
    return rows.join('\n').replace(/[ \t]+$/gm, '');
  };

  // --- invoice calc ---
  NS.utils.invoiceCalc = function (items, discPct, taxPct) {
    let sub = 0;
    (items || []).forEach((it) => { sub += (Number(it.qty) || 0) * (Number(it.harga) || 0); });
    const disc = sub * (Number(discPct) || 0) / 100;
    const afterDisc = sub - disc;
    const tax = afterDisc * (Number(taxPct) || 0) / 100;
    return { subtotal: sub, diskon: disc, pajak: tax, total: afterDisc + tax };
  };

  // --- perbandingan harga ---
  const UNIT_BASE = { mg: ['berat', 0.001], g: ['berat', 1], kg: ['berat', 1000], ml: ['volume', 1], l: ['volume', 1000], pcs: ['satuan', 1] };
  NS.utils.bandingHarga = function (a, b) {
    function norm(p) {
      const u = String(p.satuan || 'g').toLowerCase();
      const info = UNIT_BASE[u] || ['satuan', 1];
      return { jenis: info[0], perBase: (Number(p.harga) || 0) / ((Number(p.isi) || 0) * info[1] || 1) };
    }
    const na = norm(a), nb = norm(b);
    const sebanding = na.jenis === nb.jenis && isFinite(na.perBase) && isFinite(nb.perBase) && na.perBase > 0 && nb.perBase > 0;
    let winner = -1, selisihPct = 0;
    if (sebanding) {
      winner = na.perBase <= nb.perBase ? 0 : 1;
      selisihPct = (Math.abs(na.perBase - nb.perBase) / Math.min(na.perBase, nb.perBase)) * 100;
    }
    return { a: na, b: nb, sebanding, winner, selisihPct };
  };

  // ================= GAMBAR =================

  // 1. Kompres Gambar
  R('image-compress', 'Kompres Gambar', 'gambar', '🗜️', 'Kecilkan ukuran foto langsung di HP.',
    (root) => {
      const fileI = fileInput('image/*');
      const qRange = T.input('range'); qRange.min = '10'; qRange.max = '100'; qRange.value = '80';
      const qVal = T.el('<b>80%</b>');
      const maxDim = T.input('number', 'cth: 1600', '1600'); maxDim.inputMode = 'numeric';
      const fmtSel = T.select([['jpeg', 'JPEG'], ['webp', 'WebP'], ['png', 'PNG']], 'jpeg');
      const box = T.out();
      const infoBox = T.out();
      let cur = null; // {blob, name, w, h}

      qRange.addEventListener('input', () => { qVal.textContent = qRange.value + '%'; });

      async function process() {
        T.hide(infoBox); T.hide(box);
        if (!fileI.files[0]) { T.toast('Pilih gambar dulu'); return; }
        let img;
        try { img = await loadImage(fileI.files[0]); }
        catch (e) { T.toast('File bukan gambar yang valid'); return; }
        let w = img.naturalWidth, h = img.naturalHeight;
        const max = parseInt(maxDim.value, 10);
        if (max > 0 && Math.max(w, h) > max) {
          const s = max / Math.max(w, h);
          w = Math.round(w * s); h = Math.round(h * s);
        }
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        const ctx = c.getContext('2d');
        if (fmtSel.value !== 'png') { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h); }
        ctx.drawImage(img, 0, 0, w, h);
        const mime = fmtSel.value === 'png' ? 'image/png' : fmtSel.value === 'webp' ? 'image/webp' : 'image/jpeg';
        const q = fmtSel.value === 'png' ? undefined : (parseInt(qRange.value, 10) / 100);
        const blob = await canvasToBlob(c, mime, q);
        if (!blob) { T.toast('Gagal memproses gambar'); return; }
        const orig = fileI.files[0];
        const base = (orig.name || 'gambar').replace(/\.[^.]*$/, '');
        const ext = fmtSel.value === 'jpeg' ? 'jpg' : fmtSel.value;
        cur = { blob, name: base + '-kompres.' + ext, w, h };
        const pct = Math.round((1 - blob.size / orig.size) * 100);
        T.show(infoBox,
          `<div class="kv"><span>Asli</span><b>${fmtBytes(orig.size)} (${img.naturalWidth}×${img.naturalHeight})</b></div>` +
          `<div class="kv"><span>Hasil</span><b>${fmtBytes(blob.size)} (${w}×${h})</b></div>` +
          `<div class="kv"><span>Hemat</span><b>${pct >= 0 ? pct + '%' : 'malah ' + Math.abs(pct) + '% lebih besar'}</b></div>`);
        T.show(box, '');
        const imgObjUrl = URL.createObjectURL(blob);
        box.appendChild(imgEl(imgObjUrl, 'Hasil kompres'));
        T.onLeave(() => URL.revokeObjectURL(imgObjUrl));
      }

      const dlB = T.btn('Unduh Hasil', () => {
        if (!cur) { T.toast('Proses dulu gambarnya'); return; }
        T.dl(cur.name, cur.blob, cur.blob.type);
        T.toast('Berhasil diunduh');
      }, true);

      root.appendChild(T.el(`<p class="note">🔒 ${LOCAL_NOTE}</p>`));
      root.appendChild(T.field('Pilih gambar', fileI));
      const qRow = T.el('<div class="row"></div>');
      qRow.appendChild(qRange); qRow.appendChild(qVal);
      root.appendChild(T.grid2(
        T.field('Kualitas', qRow),
        T.field('Format output', fmtSel)
      ));
      root.appendChild(T.field('Maksimal dimensi (px, sisi terpanjang)', maxDim, 'Dikosongkan = ukuran asli.'));
      root.appendChild(T.row(T.btn('Kompres', process, true), dlB));
      root.appendChild(infoBox);
      root.appendChild(box);
    });

  // 2. Convert Gambar
  R('image-convert', 'Convert Gambar', 'gambar', '🔁', 'Convert WebP/JPG/PNG di browser.',
    (root) => {
      const fileI = fileInput('image/*');
      const fmtSel = T.select([['jpeg', 'JPEG (.jpg)'], ['png', 'PNG'], ['webp', 'WebP']], 'jpeg');
      const qRange = T.input('range'); qRange.min = '10'; qRange.max = '100'; qRange.value = '90';
      const qVal = T.el('<b>90%</b>');
      const box = T.out();
      let cur = null;

      qRange.addEventListener('input', () => { qVal.textContent = qRange.value + '%'; });

      async function process() {
        T.hide(box);
        if (!fileI.files[0]) { T.toast('Pilih gambar dulu'); return; }
        let img;
        try { img = await loadImage(fileI.files[0]); }
        catch (e) { T.toast('File bukan gambar yang valid'); return; }
        const c = document.createElement('canvas');
        c.width = img.naturalWidth; c.height = img.naturalHeight;
        const ctx = c.getContext('2d');
        if (fmtSel.value !== 'png') { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height); }
        ctx.drawImage(img, 0, 0);
        const mime = fmtSel.value === 'png' ? 'image/png' : fmtSel.value === 'webp' ? 'image/webp' : 'image/jpeg';
        const q = fmtSel.value === 'png' ? undefined : parseInt(qRange.value, 10) / 100;
        const blob = await canvasToBlob(c, mime, q);
        if (!blob) { T.toast('Gagal convert'); return; }
        const base = (fileI.files[0].name || 'gambar').replace(/\.[^.]*$/, '');
        const ext = fmtSel.value === 'jpeg' ? 'jpg' : fmtSel.value;
        cur = { blob, name: base + '.' + ext };
        T.show(box, '');
        const row2 = T.el('<div class="row"></div>');
        row2.appendChild(T.el(`<div><div class="hint">Ukuran hasil: <b>${fmtBytes(blob.size)}</b></div></div>`));
        box.appendChild(row2);
        box.appendChild(imgEl(URL.createObjectURL(blob), 'Hasil convert'));
        T.onLeave(() => URL.revokeObjectURL(box.querySelector('img').src));
      }

      root.appendChild(T.el(`<p class="note">🔒 ${LOCAL_NOTE}</p>`));
      root.appendChild(T.field('Pilih gambar', fileI));
      root.appendChild(T.grid2(
        T.field('Format tujuan', fmtSel),
        T.field('Kualitas', (() => { const d = T.el('<div class="row"></div>'); d.appendChild(qRange); d.appendChild(qVal); return d; })(), 'Tidak berlaku untuk PNG.')
      ));
      root.appendChild(T.row(
        T.btn('Convert', process, true),
        T.btn('Unduh Hasil', () => {
          if (!cur) { T.toast('Convert dulu gambarnya'); return; }
          T.dl(cur.name, cur.blob, cur.blob.type);
          T.toast('Berhasil diunduh');
        }, true)
      ));
      root.appendChild(box);
    });

  // 3. Hapus EXIF
  R('exif-clean', 'Hapus EXIF', 'gambar', '🧹', 'Bersihkan metadata sebelum dishare.',
    (root) => {
      const fileI = fileInput('image/*');
      const box = T.out();
      let cur = null;

      async function process() {
        T.hide(box);
        if (!fileI.files[0]) { T.toast('Pilih gambar dulu'); return; }
        let img;
        try { img = await loadImage(fileI.files[0]); }
        catch (e) { T.toast('File bukan gambar yang valid'); return; }
        const c = document.createElement('canvas');
        c.width = img.naturalWidth; c.height = img.naturalHeight;
        const ctx = c.getContext('2d');
        ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
        ctx.drawImage(img, 0, 0);
        const blob = await canvasToBlob(c, 'image/jpeg', 0.92);
        if (!blob) { T.toast('Gagal memproses'); return; }
        const base = (fileI.files[0].name || 'gambar').replace(/\.[^.]*$/, '');
        cur = { blob, name: base + '-bersih.jpg', orig: fileI.files[0].size };
        T.show(box,
          `<div class="kv"><span>Ukuran asli</span><b>${fmtBytes(cur.orig)}</b></div>` +
          `<div class="kv"><span>Ukuran bersih</span><b>${fmtBytes(blob.size)}</b></div>`);
        box.appendChild(imgEl(URL.createObjectURL(blob), 'Hasil bersih EXIF'));
        T.onLeave(() => URL.revokeObjectURL(box.querySelector('img').src));
      }

      root.appendChild(T.el(`<p class="note">🔒 ${LOCAL_NOTE}</p>`));
      root.appendChild(T.el('<p class="note">ℹ️ Gambar digambar ulang lewat canvas, jadi metadata EXIF standar (lokasi GPS, info kamera, tanggal jepret) ikut terbuang. Jujur aja: ini tidak menghapus watermark atau tulisan yang sudah nempel di piksel gambar.</p>'));
      root.appendChild(T.field('Pilih gambar', fileI));
      root.appendChild(T.row(
        T.btn('Bersihkan EXIF', process, true),
        T.btn('Unduh Hasil', () => {
          if (!cur) { T.toast('Bersihkan dulu gambarnya'); return; }
          T.dl(cur.name, cur.blob, 'image/jpeg');
          T.toast('Berhasil diunduh');
        }, true)
      ));
      root.appendChild(box);
    });

  // 4. Thumbnail YouTube
  NS.utils.ytId = function (url) {
    const s = String(url == null ? '' : url).trim();
    const pats = [
      /youtu\.be\/([A-Za-z0-9_-]{6,})/,
      /[?&]v=([A-Za-z0-9_-]{6,})/,
      /\/shorts\/([A-Za-z0-9_-]{6,})/,
      /\/embed\/([A-Za-z0-9_-]{6,})/,
      /\/v\/([A-Za-z0-9_-]{6,})/
    ];
    for (const p of pats) { const m = s.match(p); if (m) return m[1]; }
    return '';
  };

  R('yt-thumbnail', 'Thumbnail YouTube', 'gambar', '📺', 'Download thumbnail YouTube dari URL.',
    (root) => {
      const urlI = T.input('url', 'Tempel link YouTube…');
      const box = T.out();

      const quals = [
        ['maxresdefault', 'Maksimal (1280×720)'],
        ['hqdefault', 'Tinggi (480×360)'],
        ['mqdefault', 'Sedang (320×180)'],
        ['default', 'Kecil (120×90)']
      ];

      async function dlThumb(id, q) {
        const url = `https://i.ytimg.com/vi/${id}/${q}.jpg`;
        try {
          const r = await fetch(url);
          if (!r.ok) throw new Error('bad');
          const b = await r.blob();
          T.dl(`thumbnail-${id}-${q}.jpg`, b, 'image/jpeg');
          T.toast('Berhasil diunduh');
        } catch (e) {
          window.open(url, '_blank', 'noopener');
          T.toast('Unduh langsung diblokir — dibuka di tab baru');
        }
      }

      function show() {
        T.hide(box);
        const id = NS.utils.ytId(urlI.value);
        if (!id) { T.toast('Link YouTube tidak dikenali'); return; }
        const wrap = T.el('<div></div>');
        wrap.appendChild(T.el(`<p class="note">Video ID: <b>${T.esc(id)}</b><br>Kalau kualitas maksimal tidak ada (gambar abu-abu), otomatis pakai yang di bawahnya.</p>`));
        quals.forEach(([q, label]) => {
          const card = T.el('<div class="card"></div>');
          card.appendChild(T.el(`<div class="hint" style="margin-bottom:6px"><b>${T.esc(label)}</b></div>`));
          const im = imgEl(`https://i.ytimg.com/vi/${id}/${q}.jpg`, label);
          im.onerror = () => { im.style.opacity = '0.25'; };
          card.appendChild(im);
          const rowB = T.el('<div class="row" style="margin-top:8px"></div>');
          rowB.appendChild(T.btn('Unduh', () => dlThumb(id, q), true));
          card.appendChild(rowB);
          card.style.marginBottom = '12px';
          wrap.appendChild(card);
        });
        T.show(box, '');
        box.appendChild(wrap);
      }

      root.appendChild(T.field('Link YouTube', urlI, 'Mendukung youtu.be, watch?v=, /shorts/, /embed/'));
      root.appendChild(T.btn('Tampilkan Thumbnail', show, true));
      root.appendChild(box);
    });

  // 5. Kalkulator Rasio
  R('aspect-ratio', 'Kalkulator Rasio', 'gambar', '📐', 'Rasio aspek & resolusi.',
    (root) => {
      const wI = T.input('number', 'Lebar', '1920');
      const hI = T.input('number', 'Tinggi', '1080');
      const rI = T.input('text', 'Rasio, cth: 16:9', '16:9');
      const sideSel = T.select([['w', 'Lebar diketahui'], ['h', 'Tinggi diketahui']], 'w');
      const sideI = T.input('number', 'Nilai sisi', '1920');
      const box = T.out();

      function calc1() {
        const w = parseFloat(wI.value), h = parseFloat(hI.value);
        if (!w || !h || w <= 0 || h <= 0) { T.toast('Isi lebar & tinggi yang valid'); return; }
        const r = NS.utils.simplifyRatio(w, h);
        T.show(box,
          `<div class="kv"><span>Rasio</span><b>${T.esc(r)}</b></div>` +
          `<div class="kv"><span>Desimal</span><b>${(w / h).toFixed(4)} : 1</b></div>` +
          `<div class="kv"><span>Total piksel</span><b>${T.fmt(Math.round(w * h))} px</b></div>`);
      }

      function calc2() {
        const m = String(rI.value).trim().match(/^(\d+(?:\.\d+)?)\s*:\s*(\d+(?:\.\d+)?)$/);
        if (!m) { T.toast('Format rasio: angka:angka, cth 16:9'); return; }
        const a = parseFloat(m[1]), b = parseFloat(m[2]);
        const v = parseFloat(sideI.value);
        if (!v || v <= 0) { T.toast('Isi nilai sisi yang valid'); return; }
        let w, h;
        if (sideSel.value === 'w') { w = v; h = v * b / a; }
        else { h = v; w = v * a / b; }
        T.show(box,
          `<div class="kv"><span>Lebar</span><b>${T.fmt(Math.round(w))} px</b></div>` +
          `<div class="kv"><span>Tinggi</span><b>${T.fmt(Math.round(h))} px</b></div>` +
          `<div class="kv"><span>Rasio</span><b>${T.esc(NS.utils.simplifyRatio(w, h))}</b></div>`);
      }

      const sec1 = T.el('<div class="card"></div>');
      sec1.appendChild(T.el('<b>Mode 1 — dari lebar & tinggi</b>'));
      sec1.appendChild(T.grid2(T.field('Lebar (px)', wI), T.field('Tinggi (px)', hI)));
      sec1.appendChild(T.btn('Hitung Rasio', calc1, true));

      const sec2 = T.el('<div class="card"></div>');
      sec2.appendChild(T.el('<b>Mode 2 — dari rasio + satu sisi</b>'));
      sec2.appendChild(T.grid2(T.field('Rasio', rI), T.field('Sisi diketahui', sideSel)));
      sec2.appendChild(T.field('Nilai sisi (px)', sideI));
      sec2.appendChild(T.btn('Hitung Sisi Lain', calc2, true));

      root.appendChild(sec1);
      root.appendChild(sec2);
      root.appendChild(box);
    });

  // ================= TEKS =================

  // 6. WA Text Formatter
  R('wa-formatter', 'WA Text Formatter', 'teks', '✍️', 'Teks biasa jadi format WhatsApp.',
    (root) => {
      const taIn = T.ta(6, 'Ketik atau tempel teks di sini…');
      const fmtSel = T.select([['bold', '*Bold*'], ['italic', '_Italic_'], ['strike', '~Coret~'], ['mono', '```Mono```']], 'bold');
      const box = T.out();
      let last = '';

      function apply() {
        const txt = taIn.value;
        if (!txt) { T.toast('Tulis teks dulu'); return; }
        const kind = fmtSel.value;
        const s = taIn.selectionStart, e = taIn.selectionEnd;
        if (s != null && e != null && e > s) {
          const sel = txt.slice(s, e);
          last = txt.slice(0, s) + NS.utils.waFormat(sel, kind) + txt.slice(e);
          taIn.value = last;
        } else {
          last = txt.split('\n').map((ln) => ln.trim() ? NS.utils.waFormat(ln, kind) : ln).join('\n');
          taIn.value = last;
        }
        T.show(box, `<div class="hint">Hasil (format aktif saat ditempel ke WhatsApp):</div><pre class="pre">${T.esc(last)}</pre>`);
      }

      root.appendChild(T.el('<p class="note">Pilih sebagian teks (blok) untuk memformat bagian itu saja, atau biarkan tanpa blok untuk memformat semua baris.</p>'));
      root.appendChild(T.field('Teks', taIn));
      root.appendChild(T.row(
        fmtSel,
        T.btn('Terapkan', apply, true),
        T.copyBtn(() => taIn.value || last, 'Salin')
      ));
      root.appendChild(box);
    });

  // 7. Penghitung Kata
  R('word-counter', 'Penghitung Kata', 'teks', '🔡', 'Kata, karakter, estimasi baca.',
    (root) => {
      const taIn = T.ta(8, 'Ketik atau tempel teks di sini — hitungan live…');
      const box = T.out();

      function count() {
        const s = taIn.value;
        const words = (s.trim().match(/\S+/g) || []).length;
        const withSpace = s.length;
        const noSpace = s.replace(/\s/g, '').length;
        const sentences = (s.match(/[^.!?\n]+[.!?]+/g) || []).length;
        const paras = s.trim() ? s.trim().split(/\n\s*\n|\n/).filter((x) => x.trim()).length : 0;
        const mins = words / 200;
        const read = mins < 1 ? Math.max(1, Math.round(mins * 60)) + ' detik' : mins.toFixed(1) + ' menit';
        T.show(box,
          `<div class="kv"><span>Kata</span><b>${T.fmt(words)}</b></div>` +
          `<div class="kv"><span>Karakter (dengan spasi)</span><b>${T.fmt(withSpace)}</b></div>` +
          `<div class="kv"><span>Karakter (tanpa spasi)</span><b>${T.fmt(noSpace)}</b></div>` +
          `<div class="kv"><span>Kalimat</span><b>${T.fmt(sentences)}</b></div>` +
          `<div class="kv"><span>Paragraf</span><b>${T.fmt(paras)}</b></div>` +
          `<div class="kv"><span>Estimasi baca</span><b>${read}</b></div>`);
      }

      taIn.addEventListener('input', count);
      T.onLeave(() => taIn.removeEventListener('input', count));
      root.appendChild(T.field('Teks', taIn, '200 kata per menit untuk estimasi baca.'));
      root.appendChild(box);
      count();
    });

  // 8. Lorem Ipsum Generator
  R('lorem-ipsum', 'Lorem Ipsum Generator', 'teks', '📄', 'Generator teks dummy.',
    (root) => {
      const modeSel = T.select([['paragraf', 'Paragraf'], ['kalimat', 'Kalimat'], ['kata', 'Kata']], 'paragraf');
      const countI = T.input('number', 'Jumlah', '3');
      const box = T.out();
      let last = '';

      function gen() {
        last = NS.utils.lorem(modeSel.value, countI.value);
        T.show(box, `<pre class="pre">${T.esc(last)}</pre>`);
      }

      root.appendChild(T.grid2(T.field('Mode', modeSel), T.field('Jumlah', countI)));
      root.appendChild(T.row(
        T.btn('Generate', gen, true),
        T.copyBtn(() => last, 'Salin')
      ));
      root.appendChild(box);
    });

  // 9. Pembanding Teks
  R('text-diff', 'Pembanding Teks', 'teks', '🔀', 'Bandingkan dua teks.',
    (root) => {
      const taA = T.ta(6, 'Teks pertama (asli)…');
      const taB = T.ta(6, 'Teks kedua (pembanding)…');
      const box = T.out();

      function diff() {
        const ops = NS.utils.diffLines(taA.value, taB.value);
        let add = 0, del = 0, same = 0;
        const html = ops.map((o) => {
          if (o.t === 'add') { add++; return `<div class="diff-add">+ ${T.esc(o.line) || '&nbsp;'}</div>`; }
          if (o.t === 'del') { del++; return `<div class="diff-del">− ${T.esc(o.line) || '&nbsp;'}</div>`; }
          same++;
          return `<div class="diff-same">&nbsp;&nbsp;${T.esc(o.line) || '&nbsp;'}</div>`;
        }).join('');
        T.show(box,
          `<div class="kv"><span>Baris tambah</span><b style="color:#4ade80">${add}</b></div>` +
          `<div class="kv"><span>Baris hapus</span><b style="color:#f87171">${del}</b></div>` +
          `<div class="kv"><span>Baris sama</span><b>${same}</b></div>` +
          `<div class="diffbox">${html || '<div class="hint">Kedua teks kosong.</div>'}</div>`);
      }

      root.appendChild(T.field('Teks pertama', taA));
      root.appendChild(T.field('Teks kedua', taB));
      root.appendChild(T.btn('Bandingkan', diff, true));
      root.appendChild(box);
    });

  // 10. ASCII Art
  R('ascii-art', 'ASCII Art', 'teks', '⌨️', 'Teks jadi seni ASCII.',
    (root) => {
      const inI = T.input('text', 'Ketik teks…', 'ADIP');
      inI.maxLength = 24;
      const box = T.out();
      let last = '';

      function gen() {
        last = NS.utils.asciiArt(inI.value);
        if (!last) { T.toast('Ketik teks dulu'); return; }
        T.show(box, `<pre class="pre ascii">${T.esc(last)}</pre>`);
      }

      root.appendChild(T.field('Teks', inI, 'Huruf A–Z, angka, dan simbol umum. Maks 24 karakter.'));
      root.appendChild(T.row(
        T.btn('Generate', gen, true),
        T.copyBtn(() => last, 'Salin')
      ));
      root.appendChild(box);
      gen();
    });

  // 11. Fancy Text
  R('fancy-text', 'Fancy Text', 'teks', '✨', 'Teks gaya unik untuk sosmed.',
    (root) => {
      const inI = T.input('text', 'Ketik teks…', 'Adip Store');
      const box = T.out();
      const labels = { bold: '𝐁𝐨𝐥𝐝', italic: '𝐼𝑡𝑎𝑙𝑖𝑐', mono: '𝙼𝚘𝚗𝚘', script: '𝒮𝒸𝓇𝒾𝓅𝓉', struck: '𝔻𝕠𝕦𝕓𝕝𝕖', circled: 'Ⓒⓘⓡⓒⓛⓔⓓ', fullwidth: 'Ｆｕｌｌｗｉｄｔｈ' };

      function gen() {
        const txt = inI.value;
        if (!txt) { T.toast('Ketik teks dulu'); return; }
        T.show(box, '');
        NS.utils.fancyStyles.forEach((st) => {
          const v = NS.utils.fancy(txt, st);
          const card = T.el('<div class="card" style="margin-bottom:10px"></div>');
          card.appendChild(T.el(`<div class="hint" style="margin-bottom:4px">${T.esc(labels[st] || st)}</div>`));
          card.appendChild(T.el(`<div class="fancy-out">${T.esc(v)}</div>`));
          const r = T.el('<div class="row" style="margin-top:6px"></div>');
          r.appendChild(T.copyBtn(() => v, 'Salin'));
          card.appendChild(r);
          box.appendChild(card);
        });
      }

      inI.addEventListener('input', gen);
      T.onLeave(() => inI.removeEventListener('input', gen));
      root.appendChild(T.field('Teks', inI));
      root.appendChild(box);
      gen();
    });

  // 12. Zalgo Text
  R('zalgo', 'Zalgo Text', 'teks', '🌀', 'Teks rusak ala zalgo.',
    (root) => {
      const inI = T.input('text', 'Ketik teks…', 'zalgo');
      const intR = T.input('range'); intR.min = '1'; intR.max = '10'; intR.value = '3';
      const intV = T.el('<b>3</b>');
      const box = T.out();
      let last = '';

      function gen() {
        const n = parseInt(intR.value, 10);
        intV.textContent = n;
        last = NS.utils.zalgo(inI.value, n);
        T.show(box, `<div class="zalgo-out">${T.esc(last)}</div>`);
      }

      intR.addEventListener('input', gen);
      inI.addEventListener('input', gen);
      T.onLeave(() => { intR.removeEventListener('input', gen); inI.removeEventListener('input', gen); });

      const iRow = T.el('<div class="row"></div>');
      iRow.appendChild(intR); iRow.appendChild(intV);
      root.appendChild(T.field('Teks', inI));
      root.appendChild(T.field('Intensitas kerusakan', iRow, '1 = ringan, 10 = parah.'));
      root.appendChild(T.copyBtn(() => last, 'Salin Hasil'));
      root.appendChild(box);
      gen();
    });

  // 13. Dedup & Urutkan
  R('dedup-sort', 'Dedup & Urutkan', 'teks', '🧲', 'Hapus duplikat & urutkan baris.',
    (root) => {
      const taIn = T.ta(8, 'Tempel daftar baris di sini…');
      const box = T.out();
      const stat = T.out();
      let last = '';

      function chk(label, checked) {
        const l = document.createElement('label');
        l.className = 'chk';
        const c = document.createElement('input');
        c.type = 'checkbox'; c.checked = !!checked;
        l.appendChild(c);
        l.appendChild(document.createTextNode(' ' + label));
        return { el: l, box: c };
      }
      const oDedup = chk('Hapus duplikat', true);
      const oTrim = chk('Trim spasi tiap baris', true);
      const oEmpty = chk('Hapus baris kosong', true);
      const sortSel = T.select([['none', 'Tanpa urut'], ['az', 'A → Z'], ['za', 'Z → A']], 'none');

      function process() {
        const r = NS.utils.dedupSort(taIn.value, {
          dedup: oDedup.box.checked,
          trim: oTrim.box.checked,
          empty: oEmpty.box.checked,
          sort: sortSel.value
        });
        last = r.text;
        T.show(stat,
          `<div class="kv"><span>Baris awal</span><b>${T.fmt(r.before)}</b></div>` +
          `<div class="kv"><span>Baris hasil</span><b>${T.fmt(r.after)}</b></div>` +
          `<div class="kv"><span>Dibuang</span><b>${T.fmt(r.removed)}</b></div>`);
        T.show(box, `<pre class="pre">${T.esc(last)}</pre>`);
      }

      const opts = T.el('<div class="opts"></div>');
      [oDedup, oTrim, oEmpty].forEach((o) => opts.appendChild(o.el));
      root.appendChild(T.field('Daftar baris', taIn));
      root.appendChild(T.field('Opsi', opts));
      root.appendChild(T.field('Urutan', sortSel));
      root.appendChild(T.row(
        T.btn('Proses', process, true),
        T.copyBtn(() => last, 'Salin Hasil')
      ));
      root.appendChild(stat);
      root.appendChild(box);
    });

  // 14. Ekstrak Kontak
  R('extract-contact', 'Ekstrak Kontak', 'teks', '📇', 'Ambil email & nomor HP dari teks.',
    (root) => {
      const taIn = T.ta(8, 'Tempel teks yang berisi email / nomor HP…');
      const box = T.out();

      function extract() {
        const emails = NS.utils.extractEmails(taIn.value);
        const phones = NS.utils.extractPhones(taIn.value);
        T.show(box, '');
        const cardE = T.el('<div class="card" style="margin-bottom:10px"></div>');
        cardE.appendChild(T.el(`<b>📧 Email (${emails.length})</b>`));
        cardE.appendChild(T.el(`<div class="list">${emails.length ? emails.map((e) => `<div class="kv"><span style="word-break:break-all">${T.esc(e)}</span></div>`).join('') : '<div class="hint">Tidak ketemu.</div>'}</div>`));
        const rE = T.el('<div class="row" style="margin-top:6px"></div>');
        rE.appendChild(T.copyBtn(() => emails.join('\n'), 'Salin Semua'));
        cardE.appendChild(rE);

        const cardP = T.el('<div class="card"></div>');
        cardP.appendChild(T.el(`<b>📱 Nomor HP (${phones.length})</b>`));
        cardP.appendChild(T.el(`<div class="list">${phones.length ? phones.map((p) => `<div class="kv"><span>${T.esc(p)}</span></div>`).join('') : '<div class="hint">Tidak ketemu.</div>'}</div>`));
        const rP = T.el('<div class="row" style="margin-top:6px"></div>');
        rP.appendChild(T.copyBtn(() => phones.join('\n'), 'Salin Semua'));
        cardP.appendChild(rP);

        box.appendChild(cardE);
        box.appendChild(cardP);
      }

      root.appendChild(T.el('<p class="note">Mendeteksi email umum dan nomor HP Indonesia (08xx, +62, 62xx). ' + T.esc(LOCAL_NOTE) + '</p>'));
      root.appendChild(T.field('Teks', taIn));
      root.appendChild(T.btn('Ekstrak', extract, true));
      root.appendChild(box);
    });

  // 15. Sensor Teks
  R('sensor-teks', 'Sensor Teks', 'teks', '🙈', 'Sensor kata/nomor otomatis.',
    (root) => {
      const taIn = T.ta(6, 'Teks yang mau disensor…');
      const taWords = T.ta(3, 'Kata sensitif, satu per baris…');
      const maskSel = T.select([['***', '*** (bintang)'], ['███', '███ (kotak)']], '***');
      const box = T.out();
      let last = '';

      function chk(label, checked) {
        const l = document.createElement('label');
        l.className = 'chk';
        const c = document.createElement('input');
        c.type = 'checkbox'; c.checked = !!checked;
        l.appendChild(c);
        l.appendChild(document.createTextNode(' ' + label));
        return { el: l, box: c };
      }
      const oPhone = chk('Sensor otomatis nomor HP', true);
      const oEmail = chk('Sensor otomatis email', true);

      function process() {
        last = NS.utils.sensorText(
          taIn.value,
          taWords.value.split('\n'),
          maskSel.value,
          oPhone.box.checked,
          oEmail.box.checked
        );
        T.show(box, `<pre class="pre">${T.esc(last)}</pre>`);
      }

      const opts = T.el('<div class="opts"></div>');
      opts.appendChild(oPhone.el); opts.appendChild(oEmail.el);
      root.appendChild(T.field('Teks', taIn));
      root.appendChild(T.field('Daftar kata sensitif', taWords, 'Satu kata/frasa per baris. Tidak case-sensitive.'));
      root.appendChild(T.grid2(T.field('Gaya sensor', maskSel), T.field('Sensor otomatis', opts)));
      root.appendChild(T.row(
        T.btn('Sensor', process, true),
        T.copyBtn(() => last, 'Salin Hasil')
      ));
      root.appendChild(box);
    });

  // ================= BISNIS =================

  // 16. Kalkulator Harga Jual
  R('harga-jual', 'Kalkulator Harga Jual', 'bisnis', '💰', 'Modal + margin jadi harga jual.',
    (root) => {
      const modeSel = T.select([['m1', 'Modal + margin → harga jual'], ['m2', 'Modal + harga jual → margin']], 'm1');
      const modalI = T.input('text', 'Modal, cth: 50000', '');
      const marginI = T.input('text', 'Target margin %, cth: 30', '');
      const jualI = T.input('text', 'Harga jual, cth: 75000', '');
      const box = T.out();

      function calc() {
        const modal = T.num(modalI.value);
        if (modeSel.value === 'm1') {
          const mp = T.num(marginI.value);
          const jual = NS.utils.hargaJual(modal, mp);
          if (!isFinite(jual)) { T.toast('Isi modal & margin yang valid (margin < 100%)'); return; }
          T.show(box,
            `<div class="kv"><span>Harga jual</span><b>${T.rp(jual)}</b></div>` +
            `<div class="kv"><span>Profit per pcs</span><b>${T.rp(jual - modal)}</b></div>` +
            `<div class="kv"><span>Margin</span><b>${mp}% dari harga jual</b></div>`);
        } else {
          const jual = T.num(jualI.value);
          const mp = NS.utils.marginAktual(modal, jual);
          if (!isFinite(mp)) { T.toast('Isi modal & harga jual yang valid'); return; }
          T.show(box,
            `<div class="kv"><span>Margin aktual</span><b>${mp.toFixed(1)}%</b></div>` +
            `<div class="kv"><span>Profit per pcs</span><b>${T.rp(jual - modal)}</b></div>`);
        }
      }

      function toggle() {
        const m1 = modeSel.value === 'm1';
        marginI.closest('.fld').style.display = m1 ? '' : 'none';
        jualI.closest('.fld').style.display = m1 ? 'none' : '';
        T.hide(box);
      }
      modeSel.addEventListener('change', toggle);

      root.appendChild(T.el('<p class="note">Margin dihitung <b>dari harga jual</b> (bukan dari modal) — standar dagang yang bener.</p>'));
      root.appendChild(T.field('Mode', modeSel));
      root.appendChild(T.field('Modal (Rp)', modalI));
      root.appendChild(T.field('Target margin (%)', marginI));
      root.appendChild(T.field('Harga jual (Rp)', jualI));
      root.appendChild(T.btn('Hitung', calc, true));
      root.appendChild(box);
      toggle();
    });

  // 17. Invoice Generator
  let _printCssDone = false;
  function ensurePrintCss() {
    if (_printCssDone) return;
    _printCssDone = true;
    const st = document.createElement('style');
    st.textContent =
      '@media print{' +
      'body *{visibility:hidden !important}' +
      '#invoice-print,#invoice-print *{visibility:visible !important}' +
      '#invoice-print{position:absolute;inset:0;background:#fff;color:#000;padding:24px}' +
      '#invoice-print .inv-head{border-bottom:2px solid #000;padding-bottom:12px;margin-bottom:16px}' +
      '#invoice-print table{width:100%;border-collapse:collapse}' +
      '#invoice-print th,#invoice-print td{border:1px solid #999;padding:8px;text-align:left;font-size:14px}' +
      '#invoice-print .inv-tot{text-align:right;margin-top:12px}' +
      '}';
    document.head.appendChild(st);
  }

  R('invoice', 'Invoice Generator', 'bisnis', '📑', 'Bikin invoice rapi siap cetak.',
    (root) => {
      ensurePrintCss();
      const usahaI = T.input('text', 'Nama usaha', '');
      const noI = T.input('text', 'No. invoice', 'INV-' + Date.now().toString().slice(-6));
      const tglI = T.input('date', '');
      tglI.value = new Date().toISOString().slice(0, 10);
      const discI = T.input('text', 'Diskon %', '0');
      const taxI = T.input('text', 'Pajak %', '0');
      const box = T.out();
      const itemsWrap = T.el('<div></div>');

      function itemRow(nama, qty, harga) {
        const r = T.el('<div class="row inv-item"></div>');
        const nI = T.input('text', 'Nama item', nama || '');
        nI.style.flex = '3';
        const qI = T.input('text', 'Qty', qty || '1');
        qI.style.flex = '1'; qI.inputMode = 'numeric';
        const hI = T.input('text', 'Harga', harga || '');
        hI.style.flex = '2'; hI.inputMode = 'decimal';
        const del = T.btn('✕', () => r.remove());
        r.appendChild(nI); r.appendChild(qI); r.appendChild(hI); r.appendChild(del);
        r._get = () => ({ nama: nI.value, qty: T.num(qI.value) || 0, harga: T.num(hI.value) || 0 });
        return r;
      }
      itemsWrap.appendChild(itemRow('Produk A', '2', '50000'));
      itemsWrap.appendChild(itemRow('Produk B', '1', '75000'));

      function items() {
        return [...itemsWrap.querySelectorAll('.inv-item')].map((r) => r._get()).filter((x) => x.nama || x.qty || x.harga);
      }

      function preview() {
        const list = items();
        if (!list.length) { T.toast('Tambah minimal satu item'); return; }
        const calc = NS.utils.invoiceCalc(list, T.num(discI.value) || 0, T.num(taxI.value) || 0);
        const rows = list.map((it, i) =>
          `<tr><td>${i + 1}</td><td>${T.esc(it.nama)}</td><td>${T.fmt(it.qty)}</td><td>${T.rp(it.harga)}</td><td>${T.rp(it.qty * it.harga)}</td></tr>`
        ).join('');
        T.show(box, '');
        const inv = T.el(`<div id="invoice-print" class="invoice">
          <div class="inv-head">
            <h2 style="margin:0">${T.esc(usahaI.value || 'Nama Usaha')}</h2>
            <div class="hint">No: <b>${T.esc(noI.value)}</b> · Tanggal: <b>${T.esc(tglI.value)}</b></div>
          </div>
          <table><thead><tr><th>No</th><th>Item</th><th>Qty</th><th>Harga</th><th>Subtotal</th></tr></thead>
          <tbody>${rows}</tbody></table>
          <div class="inv-tot">
            <div class="kv"><span>Subtotal</span><b>${T.rp(calc.subtotal)}</b></div>
            <div class="kv"><span>Diskon (${T.esc(discI.value || '0')}%)</span><b>−${T.rp(calc.diskon)}</b></div>
            <div class="kv"><span>Pajak (${T.esc(taxI.value || '0')}%)</span><b>+${T.rp(calc.pajak)}</b></div>
            <div class="kv inv-grand"><span>TOTAL</span><b>${T.rp(calc.total)}</b></div>
          </div>
        </div>`);
        box.appendChild(inv);
        T.toast('Invoice siap — bisa dicetak atau diunduh');
      }

      function dlHtml() {
        const list = items();
        if (!list.length) { T.toast('Tambah minimal satu item'); return; }
        const calc = NS.utils.invoiceCalc(list, T.num(discI.value) || 0, T.num(taxI.value) || 0);
        const rows = list.map((it, i) =>
          `<tr><td>${i + 1}</td><td>${T.esc(it.nama)}</td><td>${T.fmt(it.qty)}</td><td>${T.rp(it.harga)}</td><td>${T.rp(it.qty * it.harga)}</td></tr>`
        ).join('');
        const html = '<!DOCTYPE html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
          '<title>Invoice ' + T.esc(noI.value) + '</title>' +
          '<style>body{font-family:system-ui,sans-serif;max-width:700px;margin:24px auto;padding:0 16px;color:#111}' +
          'table{width:100%;border-collapse:collapse;margin-top:12px}th,td{border:1px solid #999;padding:8px;text-align:left;font-size:14px}' +
          '.tot{text-align:right;margin-top:12px}.grand{font-size:20px;font-weight:700}</style></head><body>' +
          '<h2>' + T.esc(usahaI.value || 'Nama Usaha') + '</h2>' +
          '<div>No: <b>' + T.esc(noI.value) + '</b> · Tanggal: <b>' + T.esc(tglI.value) + '</b></div>' +
          '<table><thead><tr><th>No</th><th>Item</th><th>Qty</th><th>Harga</th><th>Subtotal</th></tr></thead><tbody>' + rows + '</tbody></table>' +
          '<div class="tot">Subtotal: <b>' + T.rp(calc.subtotal) + '</b><br>' +
          'Diskon: <b>−' + T.rp(calc.diskon) + '</b><br>Pajak: <b>+' + T.rp(calc.pajak) + '</b><br>' +
          '<span class="grand">TOTAL: ' + T.rp(calc.total) + '</span></div>' +
          '</body></html>';
        T.dl((noI.value || 'invoice') + '.html', html, 'text/html;charset=utf-8');
      }

      root.appendChild(T.grid2(T.field('Nama usaha', usahaI), T.field('No. invoice', noI)));
      root.appendChild(T.grid2(T.field('Tanggal', tglI), T.el('<div></div>')));
      root.appendChild(T.el('<b>Item</b>'));
      root.appendChild(itemsWrap);
      root.appendChild(T.btn('＋ Tambah Baris', () => itemsWrap.appendChild(itemRow())));
      root.appendChild(T.grid2(T.field('Diskon (%)', discI), T.field('Pajak (%)', taxI)));
      root.appendChild(T.row(
        T.btn('Tampilkan Invoice', preview, true),
        T.btn('🖨️ Cetak / PDF', () => { preview(); setTimeout(() => window.print(), 150); }),
        T.btn('Unduh HTML', dlHtml)
      ));
      root.appendChild(box);
    });

  // 18. Perbandingan Harga
  R('banding-harga', 'Perbandingan Harga', 'bisnis', '⚖️', 'Mana lebih hemat per unit?',
    (root) => {
      function prodCard(label, dflt) {
        const nama = T.input('text', 'Nama produk', dflt.nama);
        const harga = T.input('text', 'Harga (Rp)', dflt.harga);
        const isi = T.input('text', 'Isi', dflt.isi);
        const sat = T.select([['g', 'gram (g)'], ['kg', 'kilogram (kg)'], ['mg', 'miligram (mg)'], ['ml', 'mililiter (ml)'], ['l', 'liter (L)'], ['pcs', 'pcs']], dflt.sat);
        const card = T.el('<div class="card"></div>');
        card.appendChild(T.el(`<b>${label}</b>`));
        card.appendChild(T.field('Nama', nama));
        card.appendChild(T.field('Harga (Rp)', harga));
        card.appendChild(T.grid2(T.field('Isi', isi), T.field('Satuan', sat)));
        card._get = () => ({ nama: nama.value, harga: T.num(harga.value), isi: T.num(isi.value), satuan: sat.value });
        return card;
      }
      const pA = prodCard('Produk A', { nama: 'Beras A', harga: '60000', isi: '5', sat: 'kg' });
      const pB = prodCard('Produk B', { nama: 'Beras B', harga: '35000', isi: '2.5', sat: 'kg' });
      const box = T.out();

      function calc() {
        const a = pA._get(), b = pB._get();
        if (!a.harga || !a.isi || !b.harga || !b.isi) { T.toast('Isi harga & isi kedua produk'); return; }
        const r = NS.utils.bandingHarga(a, b);
        const unitName = r.a.jenis === 'berat' ? 'gram' : r.a.jenis === 'volume' ? 'ml' : 'pcs';
        let html =
          `<div class="kv"><span>${T.esc(a.nama || 'A')} /${unitName}</span><b>${T.rp(r.a.perBase)}</b></div>` +
          `<div class="kv"><span>${T.esc(b.nama || 'B')} /${unitName}</span><b>${T.rp(r.b.perBase)}</b></div>`;
        if (r.sebanding) {
          const win = r.winner === 0 ? (a.nama || 'Produk A') : (b.nama || 'Produk B');
          html += `<div class="kv"><span>🏆 Lebih hemat</span><b>${T.esc(win)}</b></div>` +
            `<div class="kv"><span>Selisih</span><b>${r.selisihPct.toFixed(1)}% lebih murah per unit</b></div>`;
        } else {
          html += `<div class="hint">⚠️ Satuannya beda jenis (berat vs volume), jadi tidak bisa dibandingkan langsung. Harga per unit di atas tetap bisa dilihat.</div>`;
        }
        T.show(box, html);
      }

      root.appendChild(pA);
      root.appendChild(pB);
      root.appendChild(T.btn('Bandingkan', calc, true));
      root.appendChild(box);
    });

  // 19. Kalkulator Cat
  R('cat-tembok', 'Kalkulator Cat', 'bisnis', '🪣', 'Kebutuhan cat dari luas ruangan.',
    (root) => {
      const pI = T.input('text', 'Panjang (m)', '4');
      const lI = T.input('text', 'Lebar (m)', '3');
      const tI = T.input('text', 'Tinggi (m)', '3');
      const lapisI = T.input('text', 'Jumlah lapis', '2');
      const dayaI = T.input('text', 'Daya sebar (m²/liter)', '10');
      const bukaanI = T.input('text', 'Pintu/jendela (m²)', '2');
      const box = T.out();

      function saranKemasan(liter) {
        if (liter <= 0) return '—';
        const sizes = [5, 2.5, 1];
        let sisa = liter;
        const parts = [];
        for (const s of sizes) {
          const n = Math.floor(sisa / s);
          if (n > 0) { parts.push(n + '× ' + s + 'L'); sisa -= n * s; }
        }
        if (sisa > 0.001) parts.push('1× 1L');
        return parts.join(' + ') + ` <span class="hint">(cukup untuk ${liter.toFixed(1)} L)</span>`;
      }

      function calc() {
        const r = NS.utils.catTembok(pI.value, lI.value, tI.value, lapisI.value, dayaI.value, bukaanI.value);
        if (r.luas <= 0) { T.toast('Cek ukuran ruangan — luas dinding nol'); return; }
        T.show(box,
          `<div class="kv"><span>Luas dinding dicat</span><b>${r.luas} m²</b></div>` +
          `<div class="kv"><span>Kebutuhan cat</span><b>${r.liter.toFixed(1)} liter</b></div>` +
          `<div class="kv"><span>Saran kemasan</span><b>${saranKemasan(r.liter)}</b></div>` +
          `<div class="hint">Hitung: 2×(panjang+lebar)×tinggi − bukaan, × lapis ÷ daya sebar. Beli dilebihkan sedikit buat cadangan.</div>`);
      }

      root.appendChild(T.el('<p class="note">Untuk dinding ruangan (4 sisi). Plafon/langit-langit tidak dihitung.</p>'));
      root.appendChild(T.grid2(T.field('Panjang (m)', pI), T.field('Lebar (m)', lI)));
      root.appendChild(T.grid2(T.field('Tinggi (m)', tI), T.field('Jumlah lapis', lapisI)));
      root.appendChild(T.grid2(
        T.field('Daya sebar (m²/liter)', dayaI, 'Cek label kaleng, umumnya 8–12.'),
        T.field('Kurangi pintu/jendela (m²)', bukaanI, 'Total luas bukaan.')
      ));
      root.appendChild(T.btn('Hitung', calc, true));
      root.appendChild(box);
    });

})();
