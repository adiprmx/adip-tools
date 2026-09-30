/* ADIP Tools — batch A: Keamanan (7) + Converter (13).
 * Semua tool jalan 100% di browser, tanpa data keluar.
 * Kontrak: (window.ADIPTOOLS = window.ADIPTOOLS || {...}), const T = NS.h,
 * R(id, name, cat, icon, desc, render) -> NS.tools.push(...).
 */
(function () {
  const NS = (window.ADIPTOOLS = window.ADIPTOOLS || { tools: [], utils: {}, cats: [], leaveCbs: [] });
  const T = NS.h;
  const R = (id, name, cat, icon, desc, render) => NS.tools.push({ id, name, cat, icon, desc, render });

  /* ================= FUNGSI MURNI (NS.utils) ================= */

  // --- Terbilang Indonesia (support s/d triliun, handle 0 & negatif) ---
  (function () {
    const K = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas'];
    function tiga(x) {
      let s = '';
      if (x >= 100) {
        const h = Math.floor(x / 100);
        s += h === 1 ? 'seratus' : K[h] + ' ratus';
        x %= 100;
        if (x) s += ' ';
      }
      if (x >= 20) {
        s += K[Math.floor(x / 10)] + ' puluh';
        x %= 10;
        if (x) s += ' ' + K[x];
      } else if (x >= 12) {
        s += K[x - 10] + ' belas';
      } else if (x === 11) {
        s += 'sebelas';
      } else if (x === 10) {
        s += 'sepuluh';
      } else if (x > 0) {
        s += K[x];
      }
      return s;
    }
    const SAT = ['', 'ribu', 'juta', 'miliar', 'triliun'];
    NS.utils.terbilang = function (n) {
      const neg = Number(n) < 0;
      let x = Math.floor(Math.abs(Number(n)));
      if (!Number.isFinite(x)) return '';
      if (x === 0) return 'nol';
      const bag = [];
      let u = 0;
      while (x > 0) {
        if (u >= SAT.length) return 'angka terlalu besar';
        const g = x % 1000;
        if (g > 0) {
          let kata = tiga(g);
          if (SAT[u]) {
            if (g === 1 && SAT[u] === 'ribu') kata = 'seribu';
            else kata += ' ' + SAT[u];
          }
          bag.unshift(kata);
        }
        x = Math.floor(x / 1000);
        u++;
      }
      return (neg ? 'minus ' : '') + bag.join(' ');
    };
  })();

  // --- Angka romawi ---
  (function () {
    const TBL = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
    NS.utils.toRoman = function (n) {
      n = Math.floor(Number(n));
      if (!Number.isFinite(n) || n < 1 || n > 3999) return '';
      let s = '';
      for (const [v, r] of TBL) while (n >= v) { s += r; n -= v; }
      return s;
    };
    NS.utils.fromRoman = function (s) {
      s = String(s == null ? '' : s).toUpperCase().trim();
      if (!/^[MDCLXVI]+$/.test(s)) return NaN;
      const V = { M: 1000, D: 500, C: 100, L: 50, X: 10, V: 5, I: 1 };
      let total = 0, prev = 0;
      for (let i = s.length - 1; i >= 0; i--) {
        const v = V[s[i]];
        if (v < prev) total -= v; else { total += v; prev = v; }
      }
      return NS.utils.toRoman(total) === s ? total : NaN;
    };
  })();

  // --- Sandi Morse ---
  (function () {
    const M = {
      A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....',
      I: '..', J: '.---', K: '-.-', L: '.-..', M: '--', N: '-.', O: '---', P: '.--.',
      Q: '--.-', R: '.-.', S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-',
      Y: '-.--', Z: '--..',
      '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-',
      '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.',
      '.': '.-.-.-', ',': '--..--', '?': '..--..', '!': '-.-.--', '/': '-..-.',
      '-': '-....-', '=': '-...-', '+': '.-.-.', '@': '.--.-.', ':': '---...', ';': '-.-.-.'
    };
    const INV = {};
    for (const k in M) INV[M[k]] = k;
    NS.utils.morseEncode = function (s) {
      return String(s == null ? '' : s).toUpperCase().trim().split(/\s+/)
        .map((w) => w.split('').map((c) => M[c] || '').filter(Boolean).join(' '))
        .join(' / ');
    };
    NS.utils.morseDecode = function (s) {
      return String(s == null ? '' : s).trim().split(/\s*\/\s*/)
        .map((w) => w.trim().split(/\s+/).map((m) => INV[m] || '').join(''))
        .join(' ');
    };
    NS.utils.morseMap = M;
  })();

  // --- MD5 murni JS (implementasi standar RFC 1321) ---
  NS.utils.md5 = async function (str) { return _md5(str); };
  function _md5(string) {
    function rotL(v, s) { return (v << s) | (v >>> (32 - s)); }
    function addU(x, y) {
      const x8 = x & 0x80000000, y8 = y & 0x80000000;
      const x4 = x & 0x40000000, y4 = y & 0x40000000;
      const r = (x & 0x3fffffff) + (y & 0x3fffffff);
      if (x4 & y4) return r ^ 0x80000000 ^ x8 ^ y8;
      if (x4 | y4) {
        if (r & 0x40000000) return r ^ 0xc0000000 ^ x8 ^ y8;
        return r ^ 0x40000000 ^ x8 ^ y8;
      }
      return r ^ x8 ^ y8;
    }
    const F = (x, y, z) => (x & y) | (~x & z);
    const G = (x, y, z) => (x & z) | (y & ~z);
    const H = (x, y, z) => x ^ y ^ z;
    const I = (x, y, z) => y ^ (x | ~z);
    const FF = (a, b, c, d, x, s, ac) => addU(rotL(addU(addU(a, F(b, c, d)), addU(x, ac)), s), b);
    const GG = (a, b, c, d, x, s, ac) => addU(rotL(addU(addU(a, G(b, c, d)), addU(x, ac)), s), b);
    const HH = (a, b, c, d, x, s, ac) => addU(rotL(addU(addU(a, H(b, c, d)), addU(x, ac)), s), b);
    const II = (a, b, c, d, x, s, ac) => addU(rotL(addU(addU(a, I(b, c, d)), addU(x, ac)), s), b);
    function utf8(s) {
      s = s.replace(/\r\n/g, '\n');
      let out = '';
      for (let n = 0; n < s.length; n++) {
        const c = s.charCodeAt(n);
        if (c < 128) out += String.fromCharCode(c);
        else if (c < 2048) out += String.fromCharCode((c >> 6) | 192, (c & 63) | 128);
        else out += String.fromCharCode((c >> 12) | 224, ((c >> 6) & 63) | 128, (c & 63) | 128);
      }
      return out;
    }
    function toWords(s) {
      const l = s.length, nblk = ((l + 8) >>> 6) + 1, w = new Array(nblk * 16).fill(0);
      for (let i = 0; i < l; i++) w[i >>> 2] |= s.charCodeAt(i) << ((i % 4) << 3);
      w[(l >>> 2)] |= 0x80 << ((l % 4) << 3);
      w[nblk * 16 - 2] = l * 8;
      return w;
    }
    function hex(v) {
      let s = '';
      for (let i = 0; i < 4; i++) s += ('0' + ((v >>> (i * 8 + 4)) & 0x0f).toString(16)).slice(-1) + ('0' + ((v >>> (i * 8)) & 0x0f).toString(16)).slice(-1);
      return s;
    }
    const x = toWords(utf8(String(string)));
    let a = 0x67452301, b = 0xefcdab89, c = 0x98badcfe, d = 0x10325476;
    for (let k = 0; k < x.length; k += 16) {
      const oa = a, ob = b, oc = c, od = d;
      a = FF(a, b, c, d, x[k + 0], 7, -680876936); d = FF(d, a, b, c, x[k + 1], 12, -389564586);
      c = FF(c, d, a, b, x[k + 2], 17, 606105819); b = FF(b, c, d, a, x[k + 3], 22, -1044525330);
      a = FF(a, b, c, d, x[k + 4], 7, -176418897); d = FF(d, a, b, c, x[k + 5], 12, 1200080426);
      c = FF(c, d, a, b, x[k + 6], 17, -1473231341); b = FF(b, c, d, a, x[k + 7], 22, -45705983);
      a = FF(a, b, c, d, x[k + 8], 7, 1770035416); d = FF(d, a, b, c, x[k + 9], 12, -1958414417);
      c = FF(c, d, a, b, x[k + 10], 17, -42063); b = FF(b, c, d, a, x[k + 11], 22, -1990404162);
      a = FF(a, b, c, d, x[k + 12], 7, 1804603682); d = FF(d, a, b, c, x[k + 13], 12, -40341101);
      c = FF(c, d, a, b, x[k + 14], 17, -1502002290); b = FF(b, c, d, a, x[k + 15], 22, 1236535329);
      a = GG(a, b, c, d, x[k + 1], 5, -165796510); d = GG(d, a, b, c, x[k + 6], 9, -1069501632);
      c = GG(c, d, a, b, x[k + 11], 14, 643717713); b = GG(b, c, d, a, x[k + 0], 20, -373897302);
      a = GG(a, b, c, d, x[k + 5], 5, -701558691); d = GG(d, a, b, c, x[k + 10], 9, 38016083);
      c = GG(c, d, a, b, x[k + 15], 14, -660478335); b = GG(b, c, d, a, x[k + 4], 20, -405537848);
      a = GG(a, b, c, d, x[k + 9], 5, 568446438); d = GG(d, a, b, c, x[k + 14], 9, -1019803690);
      c = GG(c, d, a, b, x[k + 3], 14, -187363961); b = GG(b, c, d, a, x[k + 8], 20, 1163531501);
      a = GG(a, b, c, d, x[k + 13], 5, -1444681467); d = GG(d, a, b, c, x[k + 2], 9, -51403784);
      c = GG(c, d, a, b, x[k + 7], 14, 1735328473); b = GG(b, c, d, a, x[k + 12], 20, -1926607734);
      a = HH(a, b, c, d, x[k + 5], 4, -378558); d = HH(d, a, b, c, x[k + 8], 11, -2022574463);
      c = HH(c, d, a, b, x[k + 11], 16, 1839030562); b = HH(b, c, d, a, x[k + 14], 23, -35309556);
      a = HH(a, b, c, d, x[k + 1], 4, -1530992060); d = HH(d, a, b, c, x[k + 4], 11, 1272893353);
      c = HH(c, d, a, b, x[k + 7], 16, -155497632); b = HH(b, c, d, a, x[k + 10], 23, -1094730640);
      a = HH(a, b, c, d, x[k + 13], 4, 681279174); d = HH(d, a, b, c, x[k + 0], 11, -358537222);
      c = HH(c, d, a, b, x[k + 3], 16, -722521979); b = HH(b, c, d, a, x[k + 6], 23, 76029189);
      a = HH(a, b, c, d, x[k + 9], 4, -640364487); d = HH(d, a, b, c, x[k + 12], 11, -421815835);
      c = HH(c, d, a, b, x[k + 15], 16, 530742520); b = HH(b, c, d, a, x[k + 2], 23, -995338651);
      a = II(a, b, c, d, x[k + 0], 6, -198630844); d = II(d, a, b, c, x[k + 7], 10, 1126891415);
      c = II(c, d, a, b, x[k + 14], 15, -1416354905); b = II(b, c, d, a, x[k + 5], 21, -57434055);
      a = II(a, b, c, d, x[k + 12], 6, 1700485571); d = II(d, a, b, c, x[k + 3], 10, -1894986606);
      c = II(c, d, a, b, x[k + 10], 15, -1051523); b = II(b, c, d, a, x[k + 1], 21, -2054922799);
      a = II(a, b, c, d, x[k + 8], 6, 1873313359); d = II(d, a, b, c, x[k + 15], 10, -30611744);
      c = II(c, d, a, b, x[k + 6], 15, -1560198380); b = II(b, c, d, a, x[k + 13], 21, 1309151649);
      a = II(a, b, c, d, x[k + 4], 6, -145523070); d = II(d, a, b, c, x[k + 11], 10, -1120210379);
      c = II(c, d, a, b, x[k + 2], 15, 718787259); b = II(b, c, d, a, x[k + 9], 21, -343485551);
      a = addU(a, oa); b = addU(b, ob); c = addU(c, oc); d = addU(d, od);
    }
    return hex(a) + hex(b) + hex(c) + hex(d);
  }

  // --- SHA via WebCrypto (internal helper, dipakai beberapa tool) ---
  async function shaHex(alg, text) {
    const buf = await crypto.subtle.digest(alg, new TextEncoder().encode(String(text)));
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  NS.utils.shaHex = shaHex;

  /* ================= KEAMANAN ================= */

  // 1. Password Generator
  R('password-generator', 'Password Generator', 'keamanan', '🔑', 'Buat password kuat yang susah ditebak.', (root) => {
    const mkChk = (label, checked) => {
      const l = T.el('<label class="pick"><input type="checkbox"' + (checked ? ' checked' : '') + ' style="width:20px;height:20px"> <span>' + T.esc(label) + '</span></label>');
      return { el: l, box: l.querySelector('input') };
    };
    const lenRange = T.el('<input type="range" min="8" max="64" value="16" class="inp" style="padding:0">');
    const lenNum = T.input('number', 'Panjang', 16);
    lenNum.min = 8; lenNum.max = 64; lenNum.style.maxWidth = '90px';
    const cUp = mkChk('Huruf besar (A-Z)', true);
    const cLow = mkChk('Huruf kecil (a-z)', true);
    const cNum = mkChk('Angka (0-9)', true);
    const cSym = mkChk('Simbol (!@#$%…)', true);
    const cAmb = mkChk('Hindari karakter ambigu (l, 1, I, 0, O)', false);
    const out = T.out();
    let last = '';

    const syncLen = (fromRange) => {
      const v = Math.max(8, Math.min(64, parseInt(fromRange ? lenRange.value : lenNum.value, 10) || 16));
      lenRange.value = v; lenNum.value = v;
    };
    lenRange.addEventListener('input', () => syncLen(true));
    lenNum.addEventListener('input', () => syncLen(false));

    const pools = {
      up: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      low: 'abcdefghijklmnopqrstuvwxyz',
      num: '0123456789',
      sym: '!@#$%^&*()-_=+[]{};:,.<>?/',
    };
    const pick = (pool) => {
      const r = new Uint32Array(1);
      crypto.getRandomValues(r);
      return pool[r[0] % pool.length];
    };
    const gen = () => {
      const len = Math.max(8, Math.min(64, parseInt(lenNum.value, 10) || 16));
      const active = [];
      if (cUp.box.checked) active.push(pools.up);
      if (cLow.box.checked) active.push(pools.low);
      if (cNum.box.checked) active.push(pools.num);
      if (cSym.box.checked) active.push(pools.sym);
      if (!active.length) { T.show(out, '<span class="err">Pilih minimal satu jenis karakter dulu.</span>'); return; }
      let pool = active.join('');
      if (cAmb.box.checked) pool = pool.replace(/[l1I0O]/g, '');
      const chars = active.map((p) => pick(cAmb.box.checked ? p.replace(/[l1I0O]/g, '') : p));
      while (chars.length < len) chars.push(pick(pool));
      const r = new Uint32Array(chars.length);
      crypto.getRandomValues(r);
      for (let i = chars.length - 1; i > 0; i--) {
        const j = r[i] % (i + 1);
        [chars[i], chars[j]] = [chars[j], chars[i]];
      }
      last = chars.join('');
      const ent = Math.round(len * Math.log2(pool.length));
      const lvl = ent < 50 ? ['Lemah', 'err'] : ent < 70 ? ['Sedang', 'warn'] : ent < 90 ? ['Kuat', 'ok'] : ['Sangat kuat', 'ok'];
      T.show(out,
        '<div class="kv"><span class="k">Password</span><span class="v" class="monoall">' + T.esc(last) + '</span></div>' +
        '<div class="kv"><span class="k">Kekuatan (entropi)</span><span class="v ' + lvl[1] + '">' + lvl[0] + ' · ~' + ent + ' bit</span></div>' +
        '<div class="hint">Dibuat dengan angka acak kriptografis (crypto.getRandomValues).</div>');
    };
    root.appendChild(T.field('Panjang password', T.row(lenRange, lenNum)));
    [cUp, cLow, cNum, cSym, cAmb].forEach((c) => root.appendChild(c.el));
    const bGen = T.btn('🎲 Buat Password', gen, true);
    const bCopy = T.btn('Salin', () => { if (last) T.copy(last); else T.toast('Buat password dulu'); });
    root.appendChild(T.row(bGen, bCopy));
    root.appendChild(out);
    gen();
  });

  // 2. Cek Kekuatan Password
  R('password-strength', 'Cek Kekuatan Password', 'keamanan', '🛡️', 'Ukur seberapa kuat password kamu.', (root) => {
    const inp = T.input('password', 'Ketik password di sini…');
    inp.autocomplete = 'new-password';
    const bShow = T.btn('👁️', () => {
      inp.type = inp.type === 'password' ? 'text' : 'password';
      bShow.textContent = inp.type === 'password' ? '👁️' : '🙈';
    });
    bShow.classList.add('small');
    const bar = T.el('<div style="height:10px;border-radius:6px;background:#27272a;overflow:hidden;margin:12px 0 6px"><div id="pwbar" style="height:100%;width:0%;border-radius:6px;transition:width .3s"></div></div>');
    const out = T.out();

    function nilai(pw) {
      let skor = 0;
      const saran = [];
      const len = pw.length;
      skor += Math.min(40, len * 4);
      let jenis = 0;
      if (/[a-z]/.test(pw)) jenis++; else saran.push('Tambah huruf kecil (a-z).');
      if (/[A-Z]/.test(pw)) jenis++; else saran.push('Tambah huruf besar (A-Z).');
      if (/[0-9]/.test(pw)) jenis++; else saran.push('Tambah angka (0-9).');
      if (/[^a-zA-Z0-9]/.test(pw)) jenis++; else saran.push('Tambah simbol (!@#$%).');
      skor += jenis * 12;
      if (!pw) { skor = 0; }
      if (len > 0 && len < 8) saran.push('Terlalu pendek. Minimal 8 karakter, idealnya 12 atau lebih.');
      if (/(.)\1{2,}/.test(pw)) { skor -= 10; saran.push('Hindari karakter berulang seperti "aaa" atau "111".'); }
      if (/password|sandi|123456|qwerty|admin|abc123|letmein/i.test(pw)) { skor -= 25; saran.push('Password terlalu umum. Jangan pakai kata yang mudah ditebak.'); }
      if (/123|abc|qwe|asd|098/i.test(pw)) { skor -= 8; saran.push('Hindari pola berurutan seperti "123" atau "abc".'); }
      skor = Math.max(0, Math.min(100, Math.round(skor)));
      const lbl = skor < 30 ? ['Sangat Lemah', 'err'] : skor < 50 ? ['Lemah', 'err'] : skor < 65 ? ['Cukup', 'warn'] : skor < 85 ? ['Kuat', 'ok'] : ['Sangat Kuat', 'ok'];
      return { skor, lbl, saran };
    }
    const warna = (s) => s < 30 ? '#ef4444' : s < 50 ? '#f97316' : s < 65 ? '#eab308' : s < 85 ? '#22c55e' : '#10b981';

    const cek = () => {
      const pw = inp.value;
      const { skor, lbl, saran } = nilai(pw);
      bar.querySelector('#pwbar, div').style.width = skor + '%';
      bar.firstElementChild.style.background = warna(skor);
      T.show(out,
        '<div class="kv"><span class="k">Skor</span><span class="v big ' + lbl[1] + '">' + skor + '<span class="dim" style="font-size:14px">/100</span></span></div>' +
        '<div class="kv"><span class="k">Penilaian</span><span class="v ' + lbl[1] + '">' + lbl[0] + '</span></div>' +
        (saran.length
          ? '<div style="margin-top:8px"><b>Saran perbaikan:</b><ul style="margin:6px 0 0;padding-left:20px">' + saran.map((s) => '<li>' + T.esc(s) + '</li>').join('') + '</ul></div>'
          : '<div class="ok" style="margin-top:8px">👍 Password sudah bagus. Tetap jangan pakai ulang di situs lain.</div>'));
    };
    inp.addEventListener('input', cek);
    root.appendChild(T.field('Password', T.row(inp, bShow), '🔒 Password hanya dihitung di HP/browser ini, tidak dikirim ke mana pun.'));
    root.appendChild(bar);
    root.appendChild(out);
    cek();
  });

  // 3. Hash Generator
  R('hash-generator', 'Hash Generator', 'keamanan', '#️⃣', 'Hash teks ke MD5, SHA-1, SHA-256, SHA-512.', (root) => {
    const inp = T.ta(4, 'Tulis teks yang mau di-hash…');
    const mkChk = (label, checked) => {
      const l = T.el('<label class="pick"><input type="checkbox"' + (checked ? ' checked' : '') + ' style="width:20px;height:20px"> <span>' + T.esc(label) + '</span></label>');
      return { el: l, box: l.querySelector('input') };
    };
    const cMd5 = mkChk('MD5', true), cSha1 = mkChk('SHA-1', true), cSha256 = mkChk('SHA-256', true), cSha512 = mkChk('SHA-512', false);
    const out = T.out();
    const go = async () => {
      const txt = inp.value;
      if (!txt) { T.show(out, '<span class="err">Isi teksnya dulu.</span>'); return; }
      const jobs = [];
      if (cMd5.box.checked) jobs.push(['MD5', NS.utils.md5(txt)]);
      if (cSha1.box.checked) jobs.push(['SHA-1', shaHex('SHA-1', txt)]);
      if (cSha256.box.checked) jobs.push(['SHA-256', shaHex('SHA-256', txt)]);
      if (cSha512.box.checked) jobs.push(['SHA-512', shaHex('SHA-512', txt)]);
      if (!jobs.length) { T.show(out, '<span class="err">Pilih minimal satu algoritma.</span>'); return; }
      T.show(out, '<span class="dim">Menghitung…</span>');
      const hasil = await Promise.all(jobs.map(([n, p]) => p.then((h) => [n, h])));
      T.show(out, hasil.map(([n, h]) =>
        '<div class="kv"><span class="k">' + n + '</span><span class="v" class="monoall" style="font-size:12px">' + T.esc(h) + '</span></div>'
      ).join('') + '<div style="margin-top:10px">' +
        hasil.map(([n, h], i) => '<button type="button" class="btn small" data-h="' + i + '" style="margin:0 6px 6px 0">Salin ' + n + '</button>').join('') + '</div>');
      out.querySelectorAll('button[data-h]').forEach((b) => b.addEventListener('click', () => T.copy(hasil[+b.dataset.h][1])));
    };
    root.appendChild(T.field('Teks', inp));
    root.appendChild(T.grid2(cMd5.el, cSha1.el, cSha256.el, cSha512.el));
    root.appendChild(T.row(T.btn('Hash Sekarang', go, true)));
    root.appendChild(out);
  });

  // 4. Bcrypt Hasher
  R('bcrypt', 'Bcrypt Hasher', 'keamanan', '🔐', 'Hash password ala bcrypt + verifikasi.', (root) => {
    const CDN = 'https://cdn.jsdelivr.net/npm/bcryptjs@2.4.3/dist/bcrypt.min.js';
    const status = T.out();
    const wrap = T.el('<div></div>');
    const pwInp = T.input('password', 'Password yang mau di-hash…');
    const rounds = T.select([['8', '8 putaran (cepat)'], ['10', '10 putaran (standar)'], ['12', '12 putaran (lebih aman)'], ['14', '14 putaran (lambat)']], '10');
    const hashOut = T.out();
    const vPw = T.input('password', 'Password untuk diverifikasi…');
    const vHash = T.ta(3, 'Tempel hash bcrypt di sini…');
    const vOut = T.out();

    // bcryptjs 2.4.3 dist mengekspos global `dcodeIO.bcrypt`; cek keduanya
    const B = () => window.bcrypt || (window.dcodeIO && window.dcodeIO.bcrypt);

    const goHash = () => {
      const pw = pwInp.value;
      if (!pw) { T.show(hashOut, '<span class="err">Isi passwordnya dulu.</span>'); return; }
      try {
        T.show(hashOut, '<span class="dim">Menghitung hash… (bisa beberapa detik)</span>');
        setTimeout(() => {
          try {
            const salt = B().genSaltSync(parseInt(rounds.value, 10));
            const h = B().hashSync(pw, salt);
            T.show(hashOut,
              '<div class="kv"><span class="k">Hash</span><span class="v" class="monoall" style="font-size:12px">' + T.esc(h) + '</span></div>');
            hashOut.appendChild(T.row(T.btn('Salin Hash', () => T.copy(h))));
          } catch (e) { T.show(hashOut, '<span class="err">Gagal: ' + T.esc(e.message) + '</span>'); }
        }, 30);
      } catch (e) { T.show(hashOut, '<span class="err">Gagal: ' + T.esc(e.message) + '</span>'); }
    };
    const goVerify = () => {
      const pw = vPw.value, h = vHash.value.trim();
      if (!pw || !h) { T.show(vOut, '<span class="err">Isi password dan hash-nya dulu.</span>'); return; }
      try {
        const ok = B().compareSync(pw, h);
        T.show(vOut, ok
          ? '<span class="ok">✅ Cocok! Password sesuai dengan hash ini.</span>'
          : '<span class="err">❌ Tidak cocok. Password tidak sesuai dengan hash ini.</span>');
      } catch (e) { T.show(vOut, '<span class="err">Hash tidak valid: ' + T.esc(e.message) + '</span>'); }
    };

    T.show(status, '<span class="dim">⏳ Memuat library bcrypt…</span>');
    root.appendChild(status);
    root.appendChild(wrap);
    T.hide(wrap);

    T.loadScript(CDN).then((ok) => {
      if (!ok || !B()) {
        status.innerHTML = '<span class="err">⚠️ CDN tidak bisa dimuat, cek koneksi internet kamu.</span>';
        const retry = T.btn('🔄 Coba Lagi', () => {
          status.innerHTML = '<span class="dim">⏳ Memuat library bcrypt…</span>';
          T.loadScript(CDN).then((ok2) => {
            if (!ok2 || !B()) {
              status.innerHTML = '<span class="err">⚠️ Masih gagal. Coba lagi nanti.</span>';
              status.appendChild(retry);
              return;
            }
            init();
          });
        });
        retry.style.marginTop = '10px';
        status.appendChild(retry);
        return;
      }
      init();
    });
    let booted = false;
    function init() {
      if (booted) return; booted = true;
      T.hide(status);
      wrap.appendChild(T.field('Password', pwInp));
      wrap.appendChild(T.field('Tingkat keamanan', rounds, 'Makin banyak putaran, makin lama dihitung tapi makin aman.'));
      wrap.appendChild(T.row(T.btn('🔐 Buat Hash', goHash, true)));
      wrap.appendChild(hashOut);
      wrap.appendChild(T.el('<hr class="divi">'));
      wrap.appendChild(T.el('<h3 class="h3">Verifikasi</h3>'));
      wrap.appendChild(T.field('Password', vPw));
      wrap.appendChild(T.field('Hash bcrypt', vHash));
      wrap.appendChild(T.row(T.btn('Cek Kecocokan', goVerify)));
      wrap.appendChild(vOut);
      wrap.hidden = false;
    }
  });

  // 5. HMAC Generator
  R('hmac-generator', 'HMAC Generator', 'keamanan', '🔏', 'Buat HMAC-SHA256/SHA-512 dari teks + secret key.', (root) => {
    const txt = T.ta(4, 'Teks / pesan…');
    const key = T.input('text', 'Secret key…');
    const alg = T.select([['SHA-256', 'HMAC-SHA-256'], ['SHA-512', 'HMAC-SHA-512']], 'SHA-256');
    const out = T.out();
    const go = async () => {
      if (!txt.value) { T.show(out, '<span class="err">Isi teksnya dulu.</span>'); return; }
      if (!key.value) { T.show(out, '<span class="err">Isi secret key-nya dulu.</span>'); return; }
      try {
        T.show(out, '<span class="dim">Menghitung…</span>');
        const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(key.value), { name: 'HMAC', hash: alg.value }, false, ['sign']);
        const sig = await crypto.subtle.sign('HMAC', k, new TextEncoder().encode(txt.value));
        const bytes = new Uint8Array(sig);
        const hex = Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
        let bin = '';
        for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
        const b64 = btoa(bin);
        T.show(out,
          '<div class="kv"><span class="k">Hex</span><span class="v" class="monoall" style="font-size:12px">' + T.esc(hex) + '</span></div>' +
          '<div class="kv"><span class="k">Base64</span><span class="v" class="monoall" style="font-size:12px">' + T.esc(b64) + '</span></div>');
        out.appendChild(T.row(T.btn('Salin Hex', () => T.copy(hex)), T.btn('Salin Base64', () => T.copy(b64))));
      } catch (e) { T.show(out, '<span class="err">Gagal: ' + T.esc(e.message) + '</span>'); }
    };
    root.appendChild(T.field('Teks / pesan', txt));
    root.appendChild(T.field('Secret key', key, 'Kunci rahasia hanya dipakai di browser ini.'));
    root.appendChild(T.field('Algoritma', alg));
    root.appendChild(T.row(T.btn('Buat HMAC', go, true)));
    root.appendChild(out);
  });

  // 6. UUID Generator
  R('uuid-generator', 'UUID Generator', 'keamanan', '🆔', 'Buat UUID v4 acak.', (root) => {
    const nInp = T.input('number', 'Jumlah (1-100)', 5);
    nInp.min = 1; nInp.max = 100;
    const out = T.out();
    let last = [];
    const uuid4 = () => {
      const b = new Uint8Array(16);
      crypto.getRandomValues(b);
      b[6] = (b[6] & 0x0f) | 0x40;
      b[8] = (b[8] & 0x3f) | 0x80;
      const h = Array.from(b).map((x) => x.toString(16).padStart(2, '0')).join('');
      return h.slice(0, 8) + '-' + h.slice(8, 12) + '-' + h.slice(12, 16) + '-' + h.slice(16, 20) + '-' + h.slice(20);
    };
    const gen = () => {
      const n = Math.max(1, Math.min(100, parseInt(nInp.value, 10) || 5));
      nInp.value = n;
      last = [];
      for (let i = 0; i < n; i++) last.push(uuid4());
      T.show(out, last.map((u) =>
        '<div class="kv"><span class="v" style="font-family:ui-monospace,monospace;font-size:13px;user-select:all;text-align:left">' + u + '</span></div>'
      ).join(''));
    };
    root.appendChild(T.field('Jumlah UUID', nInp));
    root.appendChild(T.row(T.btn('🎲 Generate', gen, true), T.btn('Salin Semua', () => { if (last.length) T.copy(last.join('\n')); else T.toast('Generate dulu'); })));
    root.appendChild(out);
    gen();
  });

  // 7. OTP Authenticator (TOTP)
  R('totp-generator', 'OTP Authenticator', 'keamanan', '⏱️', 'Kode OTP 30-detik dari secret (kayak Google Authenticator).', (root) => {
    const secInp = T.input('text', 'Secret Base32, misal: JBSWY3DPEHPK3PXP');
    secInp.autocomplete = 'off'; secInp.autocapitalize = 'characters'; secInp.spellcheck = false;
    const out = T.out();
    let timer = null;

    function base32dec(s) {
      const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
      s = String(s).replace(/[\s=-]/g, '').toUpperCase();
      if (!s) throw new Error('Secret kosong.');
      let bits = 0, val = 0;
      const res = [];
      for (const ch of s) {
        const i = A.indexOf(ch);
        if (i < 0) throw new Error('Karakter Base32 tidak valid: "' + ch + '"');
        val = (val << 5) | i; bits += 5;
        if (bits >= 8) { res.push((val >>> (bits - 8)) & 0xff); bits -= 8; }
      }
      if (!res.length) throw new Error('Secret tidak valid.');
      return new Uint8Array(res);
    }
    async function totp(secret, when) {
      const key = await crypto.subtle.importKey('raw', base32dec(secret), { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
      const ctr = Math.floor((when != null ? when : Date.now()) / 1000 / 30);
      const buf = new ArrayBuffer(8), dv = new DataView(buf);
      dv.setUint32(0, Math.floor(ctr / 0x100000000));
      dv.setUint32(4, ctr >>> 0);
      const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, buf));
      const o = sig[sig.length - 1] & 0x0f;
      const code = (((sig[o] & 0x7f) << 24) | (sig[o + 1] << 16) | (sig[o + 2] << 8) | sig[o + 3]) % 1000000;
      return String(code).padStart(6, '0');
    }

    const mulai = () => {
      if (timer) { clearInterval(timer); timer = null; }
      const sec = secInp.value.trim();
      if (!sec) { T.show(out, '<span class="err">Isi secret Base32-nya dulu.</span>'); return; }
      let kode = '••••••';
      const codeEl = T.el('<div class="big center" style="font-family:ui-monospace,monospace;letter-spacing:.15em">••••••</div>');
      const prog = T.el('<div style="height:8px;border-radius:5px;background:#27272a;overflow:hidden;margin:10px 0"><div style="height:100%;width:100%;background:#fff;transition:width .5s linear"></div></div>');
      const sisaEl = T.el('<div class="center dim">Kode baru dalam …</div>');
      T.show(out, '');
      out.appendChild(T.el('<div class="center mut" style="margin-bottom:4px">Kode OTP saat ini</div>'));
      out.appendChild(codeEl);
      out.appendChild(prog);
      out.appendChild(sisaEl);
      const bCopy = T.btn('Salin Kode', () => T.copy(kode));
      out.appendChild(T.row(bCopy));
      const tick = async () => {
        try {
          const now = Date.now();
          kode = await totp(sec, now);
          const sisa = 30 - Math.floor(now / 1000) % 30;
          codeEl.textContent = kode.slice(0, 3) + ' ' + kode.slice(3);
          prog.firstElementChild.style.width = (sisa / 30 * 100) + '%';
          prog.firstElementChild.style.background = sisa <= 5 ? '#ef4444' : '#fff';
          sisaEl.textContent = 'Kode baru dalam ' + sisa + ' detik';
        } catch (e) {
          clearInterval(timer); timer = null;
          T.show(out, '<span class="err">Secret tidak valid: ' + T.esc(e.message) + '</span>');
        }
      };
      tick();
      timer = setInterval(tick, 500);
      T.onLeave(() => { if (timer) clearInterval(timer); });
    };
    root.appendChild(T.field('Secret (Base32)', secInp, '🔒 Secret hanya dipakai di browser ini dan TIDAK disimpan. Tutup halaman, secret hilang.'));
    root.appendChild(T.row(T.btn('▶️ Tampilkan Kode', mulai, true)));
    root.appendChild(out);
  });

  /* ================= CONVERTER ================= */

  // 8. Base64 Encode/Decode
  R('base64', 'Base64 Encode/Decode', 'converter', '🔤', 'Encode & decode Base64, termasuk varian URL-safe.', (root) => {
    const inp = T.ta(5, 'Tulis atau tempel teks di sini…');
    const outp = T.ta(5, 'Hasil muncul di sini…');
    outp.readOnly = true;
    const urlSafe = T.el('<label style="display:flex;align-items:center;gap:10px;font-size:14px;padding:8px 0;cursor:pointer"><input type="checkbox"> <span>Varian URL-safe (tanpa + / =)</span></label>');
    const usBox = urlSafe.querySelector('input');

    function utf8ToB64(s) {
      const bytes = new TextEncoder().encode(s);
      let bin = '';
      for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
      return btoa(bin);
    }
    function b64ToUtf8(b64) {
      const bin = atob(b64);
      const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
      return new TextDecoder().decode(bytes);
    }
    const enc = () => {
      let b = utf8ToB64(inp.value);
      if (usBox.checked) b = b.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      outp.value = b;
    };
    const dec = () => {
      try {
        let b = inp.value.trim().replace(/\s/g, '');
        if (usBox.checked || /[-_]/.test(b)) b = b.replace(/-/g, '+').replace(/_/g, '/');
        while (b.length % 4) b += '=';
        outp.value = b64ToUtf8(b);
      } catch (e) { outp.value = '⚠️ Bukan Base64 yang valid.'; }
    };
    root.appendChild(T.field('Input', inp));
    root.appendChild(urlSafe);
    root.appendChild(T.row(T.btn('Encode →', enc, true), T.btn('← Decode', dec)));
    root.appendChild(T.field('Output', outp));
    root.appendChild(T.row(T.btn('Salin Hasil', () => T.copy(outp.value)), T.btn('Tukar ⇅', () => { const t = inp.value; inp.value = outp.value; outp.value = t; })));
  });

  // 9. URL Encoder/Decoder
  R('url-encoder', 'URL Encoder/Decoder', 'converter', '🔗', 'Encode/decode URL & komponennya.', (root) => {
    const inp = T.ta(4, 'Tulis URL atau teks di sini…');
    const outp = T.ta(4, 'Hasil muncul di sini…');
    outp.readOnly = true;
    const r1 = T.el('<label class="pick"><input type="radio" name="urlm" value="comp" checked style="width:20px;height:20px"> <span><b>encodeURIComponent</b>: untuk parameter/nilai (semua karakter khusus di-encode)</span></label>');
    const r2 = T.el('<label class="pick"><input type="radio" name="urlm" value="full" style="width:20px;height:20px"> <span><b>encodeURI</b>: untuk URL utuh (: / ? & dibiarkan)</span></label>');
    // nama radio harus unik per render agar tidak bentrok antar tool
    const nm = 'urlm_' + Math.random().toString(36).slice(2, 8);
    r1.querySelector('input').name = nm; r2.querySelector('input').name = nm;
    const enc = () => {
      const full = r2.querySelector('input').checked;
      outp.value = full ? encodeURI(inp.value) : encodeURIComponent(inp.value);
    };
    const dec = () => {
      try { outp.value = decodeURIComponent(inp.value); }
      catch (e) { outp.value = '⚠️ URL tidak valid / encode tidak lengkap.'; }
    };
    root.appendChild(T.field('Input', inp));
    root.appendChild(r1); root.appendChild(r2);
    root.appendChild(T.row(T.btn('Encode →', enc, true), T.btn('← Decode', dec)));
    root.appendChild(T.field('Output', outp));
    root.appendChild(T.row(T.copyBtn(() => outp.value, 'Salin Hasil')));
  });

  // 10. Konverter Warna
  R('color-converter', 'Konverter Warna', 'converter', '🎨', 'Konversi HEX, RGB, HSL + preview.', (root) => {
    const inp = T.input('text', '#ff6b6b  atau  255,107,107  atau  hsl(0,100%,65%)', '#ff6b6b');
    inp.autocapitalize = 'none'; inp.spellcheck = false;
    const prev = T.el('<div style="width:100%;height:96px;border-radius:12px;border:1px solid #3f3f46;margin:12px 0"></div>');
    const out = T.out();

    function parse(str) {
      str = String(str).trim().toLowerCase();
      let m;
      if ((m = str.match(/^#?([0-9a-f]{3})$/))) {
        const h = m[1];
        return { r: parseInt(h[0] + h[0], 16), g: parseInt(h[1] + h[1], 16), b: parseInt(h[2] + h[2], 16) };
      }
      if ((m = str.match(/^#?([0-9a-f]{6})$/))) {
        return { r: parseInt(m[1].slice(0, 2), 16), g: parseInt(m[1].slice(2, 4), 16), b: parseInt(m[1].slice(4, 6), 16) };
      }
      if ((m = str.match(/^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/))) {
        return { r: +m[1], g: +m[2], b: +m[3] };
      }
      if ((m = str.match(/^(\d{1,3})\s*[, ]\s*(\d{1,3})\s*[, ]\s*(\d{1,3})$/))) {
        return { r: +m[1], g: +m[2], b: +m[3] };
      }
      if ((m = str.match(/^hsla?\(\s*(\d{1,3}(?:\.\d+)?)\s*,\s*(\d{1,3}(?:\.\d+)?)%\s*,\s*(\d{1,3}(?:\.\d+)?)%/))) {
        return hslToRgb(+m[1], +m[2], +m[3]);
      }
      if ((m = str.match(/^(\d{1,3}(?:\.\d+)?)\s*[, ]\s*(\d{1,3}(?:\.\d+)?)%\s*[, ]\s*(\d{1,3}(?:\.\d+)?)%$/))) {
        return hslToRgb(+m[1], +m[2], +m[3]);
      }
      return null;
    }
    function hslToRgb(h, s, l) {
      h = ((h % 360) + 360) % 360; s = Math.min(100, Math.max(0, s)) / 100; l = Math.min(100, Math.max(0, l)) / 100;
      const k = (n) => (n + h / 30) % 12;
      const a = s * Math.min(l, 1 - l);
      const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
      return { r: Math.round(f(0) * 255), g: Math.round(f(8) * 255), b: Math.round(f(4) * 255) };
    }
    function rgbToHsl(r, g, b) {
      r /= 255; g /= 255; b /= 255;
      const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
      let h = 0, s = 0;
      const l = (mx + mn) / 2;
      if (mx !== mn) {
        const d = mx - mn;
        s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
        if (mx === r) h = ((g - b) / d + (g < b ? 6 : 0));
        else if (mx === g) h = (b - r) / d + 2;
        else h = (r - g) / d + 4;
        h *= 60;
      }
      return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
    }
    const hex2 = (n) => Math.min(255, Math.max(0, Math.round(n))).toString(16).padStart(2, '0');

    const go = () => {
      const c = parse(inp.value);
      if (!c || [c.r, c.g, c.b].some((v) => v < 0 || v > 255 || Number.isNaN(v))) {
        T.show(out, '<span class="err">Format tidak dikenali. Coba: <b>#ff6b6b</b>, <b>255, 107, 107</b>, atau <b>hsl(0, 100%, 65%)</b>.</span>');
        return;
      }
      const hex = '#' + hex2(c.r) + hex2(c.g) + hex2(c.b);
      const rgb = 'rgb(' + Math.round(c.r) + ', ' + Math.round(c.g) + ', ' + Math.round(c.b) + ')';
      const hsl = rgbToHsl(c.r, c.g, c.b);
      const hslS = 'hsl(' + hsl.h + ', ' + hsl.s + '%, ' + hsl.l + '%)';
      prev.style.background = hex;
      T.show(out,
        '<div class="kv"><span class="k">HEX</span><span class="v" class="monoall">' + hex + '</span></div>' +
        '<div class="kv"><span class="k">RGB</span><span class="v" class="monoall">' + rgb + '</span></div>' +
        '<div class="kv"><span class="k">HSL</span><span class="v" class="monoall">' + hslS + '</span></div>' +
        '<div class="hint">Klik tombol untuk menyalin tiap format.</div>');
      const vals = [hex, rgb, hslS];
      const names = ['HEX', 'RGB', 'HSL'];
      const btns = T.el('<div style="margin-top:10px"></div>');
      vals.forEach((v, i) => {
        const b = T.btn('Salin ' + names[i], () => T.copy(v));
        b.classList.add('small'); b.style.margin = '0 6px 6px 0';
        btns.appendChild(b);
      });
      out.appendChild(btns);
    };
    root.appendChild(T.field('Warna (HEX / RGB / HSL)', inp));
    root.appendChild(T.row(T.btn('Konversi', go, true)));
    root.appendChild(prev);
    root.appendChild(out);
    go();
  });

  // 11. Konverter Angka
  R('number-converter', 'Konverter Angka', 'converter', '🔢', 'Biner, oktal, desimal, hex, dan romawi.', (root) => {
    const decInp = T.input('number', 'Angka desimal, misal: 2026', 2026);
    const out = T.out();
    const rInp = T.input('text', 'Romawi, misal: MMXXVI');
    rInp.autocapitalize = 'characters'; rInp.spellcheck = false;
    const dInp2 = T.input('number', 'Desimal, misal: 2026');
    const out2 = T.out();

    const basis = () => {
      const n = Math.floor(Number(decInp.value));
      if (!Number.isFinite(n)) { T.show(out, '<span class="err">Masukkan angka yang valid.</span>'); return; }
      const neg = n < 0, a = Math.abs(n), sgn = neg ? '-' : '';
      T.show(out,
        '<div class="kv"><span class="k">Biner</span><span class="v" class="monoall">' + sgn + a.toString(2) + '</span></div>' +
        '<div class="kv"><span class="k">Oktal</span><span class="v" class="monoall">' + sgn + a.toString(8) + '</span></div>' +
        '<div class="kv"><span class="k">Desimal</span><span class="v" class="monoall">' + T.fmt(n) + '</span></div>' +
        '<div class="kv"><span class="k">Hex</span><span class="v" class="monoall">' + sgn + a.toString(16).toUpperCase() + '</span></div>' +
        '<div class="kv"><span class="k">Romawi</span><span class="v" class="monoall">' + (n >= 1 && n <= 3999 ? NS.utils.toRoman(n) : '<span class="dim">1-3999 saja</span>') + '</span></div>');
    };
    const r2d = () => {
      const v = NS.utils.fromRoman(rInp.value);
      if (Number.isNaN(v)) T.show(out2, '<span class="err">Bukan angka romawi yang valid.</span>');
      else { T.show(out2, '<div class="kv"><span class="k">Desimal</span><span class="v big">' + T.fmt(v) + '</span></div>'); dInp2.value = v; }
    };
    const d2r = () => {
      const n = Math.floor(Number(dInp2.value));
      const r = NS.utils.toRoman(n);
      if (!r) T.show(out2, '<span class="err">Romawi hanya untuk 1-3999.</span>');
      else { T.show(out2, '<div class="kv"><span class="k">Romawi</span><span class="v big" style="font-family:ui-monospace,monospace">' + r + '</span></div>'); rInp.value = r; }
    };
    root.appendChild(T.el('<h3 class="h3">Basis bilangan</h3>'));
    root.appendChild(T.field('Desimal', decInp));
    root.appendChild(T.row(T.btn('Konversi', basis, true)));
    root.appendChild(out);
    root.appendChild(T.el('<hr class="divi">'));
    root.appendChild(T.el('<h3 class="h3">Romawi ↔ Desimal</h3>'));
    root.appendChild(T.grid2(T.field('Romawi', rInp), T.field('Desimal', dInp2)));
    root.appendChild(T.row(T.btn('Romawi → Desimal', r2d), T.btn('Desimal → Romawi', d2r)));
    root.appendChild(out2);
    basis();
  });

  // 12. Unix Timestamp
  R('unix-timestamp', 'Unix Timestamp', 'converter', '🕰️', 'Unix timestamp ↔ tanggal (WIB).', (root) => {
    const tsInp = T.input('number', 'Timestamp, misal: 1759257200');
    const out1 = T.out();
    const dtInp = T.el('<input type="datetime-local" class="inp">');
    const out2 = T.out();
    const fWib = new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'full', timeStyle: 'long' });
    const fUtc = new Intl.DateTimeFormat('id-ID', { timeZone: 'UTC', dateStyle: 'full', timeStyle: 'long' });

    const keTanggal = () => {
      let v = Number(tsInp.value);
      if (!Number.isFinite(v)) { T.show(out1, '<span class="err">Masukkan timestamp yang valid.</span>'); return; }
      if (Math.abs(v) > 1e12) v = v / 1000; // milidetik -> detik
      else if (Math.abs(v) > 1e10) v = v / 1000;
      const d = new Date(v * 1000);
      if (Number.isNaN(d.getTime())) { T.show(out1, '<span class="err">Timestamp tidak valid.</span>'); return; }
      T.show(out1,
        '<div class="kv"><span class="k">WIB (UTC+7)</span><span class="v">' + T.esc(fWib.format(d)) + '</span></div>' +
        '<div class="kv"><span class="k">UTC</span><span class="v">' + T.esc(fUtc.format(d)) + '</span></div>' +
        '<div class="kv"><span class="k">ISO 8601</span><span class="v" class="monoall" style="font-size:12px">' + d.toISOString() + '</span></div>');
    };
    const keTs = () => {
      if (!dtInp.value) { T.show(out2, '<span class="err">Pilih tanggal & jam dulu.</span>'); return; }
      const d = new Date(dtInp.value);
      const s = Math.floor(d.getTime() / 1000);
      T.show(out2,
        '<div class="kv"><span class="k">Detik</span><span class="v big" class="monoall">' + s + '</span></div>' +
        '<div class="kv"><span class="k">Milidetik</span><span class="v" class="monoall">' + d.getTime() + '</span></div>');
      out2.appendChild(T.row(T.btn('Salin Detik', () => T.copy(String(s)))));
    };
    const sekarang = () => {
      const s = Math.floor(Date.now() / 1000);
      tsInp.value = s;
      keTanggal();
    };
    root.appendChild(T.el('<h3 class="h3">Timestamp → Tanggal</h3>'));
    root.appendChild(T.field('Unix timestamp', tsInp, 'Otomatis dikenali detik / milidetik.'));
    root.appendChild(T.row(T.btn('Ke Tanggal', keTanggal, true), T.btn('⏱️ Sekarang', sekarang)));
    root.appendChild(out1);
    root.appendChild(T.el('<hr class="divi">'));
    root.appendChild(T.el('<h3 class="h3">Tanggal → Timestamp</h3>'));
    root.appendChild(T.field('Tanggal & jam (zona HP kamu)', dtInp));
    root.appendChild(T.row(T.btn('Ke Timestamp', keTs, true)));
    root.appendChild(out2);
  });

  // 13. JSON <-> YAML
  R('json-yaml', 'JSON ↔ YAML', 'converter', '⇄', 'Konversi JSON ke YAML dan sebaliknya.', (root) => {
    const CDN = 'https://cdn.jsdelivr.net/npm/js-yaml@4.1.0/dist/js-yaml.min.js';
    const status = T.out();
    const wrap = T.el('<div></div>');
    const inp = T.ta(8, 'Tempel JSON atau YAML di sini…');
    inp.style.fontFamily = 'ui-monospace,monospace';
    inp.spellcheck = false;
    const outp = T.ta(8, 'Hasil muncul di sini…');
    outp.style.fontFamily = 'ui-monospace,monospace';
    outp.readOnly = true;
    const errBox = T.out();

    const keYaml = () => {
      T.hide(errBox);
      try {
        const obj = JSON.parse(inp.value);
        outp.value = window.jsyaml.dump(obj, { indent: 2 });
      } catch (e) { T.show(errBox, '<span class="err">JSON tidak valid: ' + T.esc(e.message) + '</span>'); }
    };
    const keJson = () => {
      T.hide(errBox);
      try {
        const obj = window.jsyaml.load(inp.value);
        outp.value = JSON.stringify(obj, null, 2);
      } catch (e) { T.show(errBox, '<span class="err">YAML tidak valid: ' + T.esc(e.message) + '</span>'); }
    };

    T.show(status, '<span class="dim">⏳ Memuat library YAML…</span>');
    root.appendChild(status);
    root.appendChild(wrap);
    T.hide(wrap);
    T.loadScript(CDN).then((ok) => {
      if (!ok || !window.jsyaml) {
        status.innerHTML = '<span class="err">⚠️ CDN tidak bisa dimuat, cek koneksi internet kamu.</span>';
        const retry = T.btn('🔄 Coba Lagi', () => {
          status.innerHTML = '<span class="dim">⏳ Memuat library YAML…</span>';
          T.loadScript(CDN).then((ok2) => {
            if (!ok2 || !window.jsyaml) {
              status.innerHTML = '<span class="err">⚠️ Masih gagal. Coba lagi nanti.</span>';
              status.appendChild(retry);
              return;
            }
            init();
          });
        });
        retry.style.marginTop = '10px';
        status.appendChild(retry);
        return;
      }
      init();
    });
    let booted = false;
    function init() {
      if (booted) return; booted = true;
      T.hide(status);
      wrap.appendChild(T.field('Input', inp));
      wrap.appendChild(T.row(T.btn('JSON → YAML', keYaml, true), T.btn('YAML → JSON', keJson)));
      wrap.appendChild(errBox);
      T.hide(errBox);
      wrap.appendChild(T.field('Output', outp));
      wrap.appendChild(T.row(T.copyBtn(() => outp.value, 'Salin Hasil')));
      wrap.hidden = false;
    }
  });

  // 14. Case Converter
  R('case-converter', 'Case Converter', 'converter', '✏️', 'camelCase, snake_case, kebab-case, Title Case, dll.', (root) => {
    const inp = T.ta(3, 'Tulis teks di sini… misal: halo dunia keren');
    const out = T.out();
    const kata = (s) => s.replace(/([a-z0-9])([A-Z])/g, '$1 $2').split(/[^a-zA-Z0-9]+/).filter(Boolean).map((w) => w.toLowerCase());
    const cap = (w) => w.charAt(0).toUpperCase() + w.slice(1);
    const go = () => {
      const ws = kata(inp.value);
      if (!ws.length) { T.show(out, '<span class="dim">Ketik sesuatu dulu, semua varian muncul otomatis.</span>'); return; }
      const varian = [
        ['camelCase', ws.map((w, i) => (i ? cap(w) : w)).join('')],
        ['PascalCase', ws.map(cap).join('')],
        ['snake_case', ws.join('_')],
        ['kebab-case', ws.join('-')],
        ['Title Case', ws.map(cap).join(' ')],
        ['SCREAMING_SNAKE', ws.join('_').toUpperCase()],
        ['lower case', ws.join(' ')],
        ['UPPER CASE', ws.join(' ').toUpperCase()],
      ];
      T.show(out, varian.map(([n, v], i) =>
        '<div class="kv"><span class="k">' + n + '</span><span class="v" style="font-family:ui-monospace,monospace;user-select:all;text-align:right">' + T.esc(v) + '</span></div>'
      ).join(''));
      const btns = T.el('<div style="margin-top:10px"></div>');
      varian.forEach(([n, v]) => {
        const b = T.btn(n, () => T.copy(v));
        b.classList.add('small'); b.style.margin = '0 6px 6px 0';
        btns.appendChild(b);
      });
      out.appendChild(btns);
    };
    inp.addEventListener('input', go);
    root.appendChild(T.field('Teks', inp));
    root.appendChild(out);
    go();
  });

  // 15. Slug Generator
  R('slug-generator', 'Slug Generator', 'converter', '🏷️', 'Judul jadi slug URL yang rapi.', (root) => {
    const inp = T.input('text', 'Judul artikel, misal: 7 Cara Bikin Kopi Susu Gula Aren!');
    const sep = T.select([['-', 'Strip (-)'], ['_', 'Underscore (_)']], '-');
    const maxLen = T.input('number', 'Batas panjang (opsional)', '');
    maxLen.min = 10;
    const out = T.out();
    const go = () => {
      const s = sep.value;
      let slug = inp.value
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, s)
        .replace(new RegExp('^' + s + '+|' + s + '+$', 'g'), '');
      const ml = parseInt(maxLen.value, 10);
      if (ml > 0 && slug.length > ml) {
        slug = slug.slice(0, ml).replace(new RegExp(s + '+$', ''), '');
      }
      if (!slug) { T.show(out, '<span class="err">Tidak ada kata yang bisa dijadikan slug.</span>'); return; }
      T.show(out,
        '<div class="kv"><span class="k">Slug</span><span class="v" class="monoall">' + T.esc(slug) + '</span></div>' +
        '<div class="kv"><span class="k">Panjang</span><span class="v">' + slug.length + ' karakter</span></div>');
      out.appendChild(T.row(T.btn('Salin Slug', () => T.copy(slug), true)));
    };
    inp.addEventListener('input', go);
    sep.addEventListener('change', go);
    root.appendChild(T.field('Judul', inp));
    root.appendChild(T.grid2(T.field('Pemisah', sep), T.field('Batas panjang', maxLen)));
    root.appendChild(out);
  });

  // 16. Sandi Morse
  R('morse', 'Sandi Morse', 'converter', '📻', 'Teks ↔ sandi Morse + bunyi.', (root) => {
    const inp = T.ta(4, 'Tulis teks di sini…');
    const outp = T.ta(4, 'Hasil morse / teks…');
    outp.style.fontFamily = 'ui-monospace,monospace';
    const bPlay = T.btn('🔊 Putar Bunyi');
    const bStop = T.btn('⏹️ Berhenti');
    let token = 0;
    T.onLeave(() => { token++; });

    const enc = () => { outp.value = NS.utils.morseEncode(inp.value) || '⚠️ Tidak ada karakter yang bisa di-encode.'; };
    const dec = () => { outp.value = NS.utils.morseDecode(inp.value); };
    const play = () => {
      const seq = (outp.value || NS.utils.morseEncode(inp.value)).split('');
      if (!seq.length) { T.toast('Tidak ada morse untuk dimainkan'); return; }
      const my = ++token;
      T.toast('Memutar morse…');
      let i = 0;
      (function step() {
        if (my !== token) return;
        if (i >= seq.length) { token = 0; return; }
        const ch = seq[i++];
        if (ch === '.') { T.beep(750, 0.09, 'sine'); setTimeout(step, 170); }
        else if (ch === '-') { T.beep(750, 0.28, 'sine'); setTimeout(step, 370); }
        else if (ch === '/') setTimeout(step, 520);
        else setTimeout(step, 270);
      })();
    };
    bPlay.addEventListener('click', play);
    bStop.addEventListener('click', () => { token++; T.toast('Berhenti'); });
    root.appendChild(T.field('Input', inp, 'Huruf, angka, dan tanda baca umum didukung.'));
    root.appendChild(T.row(T.btn('Teks → Morse', enc, true), T.btn('Morse → Teks', dec)));
    root.appendChild(T.field('Output', outp));
    root.appendChild(T.row(bPlay, bStop, T.copyBtn(() => outp.value, 'Salin')));
  });

  // 17. Gambar ke Base64
  R('image-base64', 'Gambar ke Base64', 'converter', '🖼️', 'Gambar jadi string Base64 siap embed.', (root) => {
    const fileInp = T.el('<input type="file" accept="image/*" class="inp">');
    const out = T.out();
    let lastUrl = '';
    fileInp.addEventListener('change', () => {
      const f = fileInp.files && fileInp.files[0];
      if (!f) return;
      if (!f.type.startsWith('image/')) { T.show(out, '<span class="err">File harus berupa gambar.</span>'); return; }
      const rd = new FileReader();
      rd.onload = () => {
        lastUrl = String(rd.result);
        const img = new Image();
        img.onload = () => {
          const kb = f.size / 1024;
          const sizeS = kb < 1024 ? kb.toFixed(1) + ' KB' : (kb / 1024).toFixed(2) + ' MB';
          T.show(out,
            '<div class="kv"><span class="k">Nama</span><span class="v">' + T.esc(f.name) + '</span></div>' +
            '<div class="kv"><span class="k">Ukuran file</span><span class="v">' + sizeS + '</span></div>' +
            '<div class="kv"><span class="k">Dimensi</span><span class="v">' + img.naturalWidth + ' × ' + img.naturalHeight + ' px</span></div>' +
            '<div class="kv"><span class="k">Tipe</span><span class="v">' + T.esc(f.type) + '</span></div>' +
            '<div class="kv"><span class="k">Panjang string</span><span class="v">' + T.fmt(lastUrl.length) + ' karakter</span></div>' +
            (f.size > 2 * 1024 * 1024 ? '<div class="hint" style="color:#eab308">⚠️ File besar. String Base64 sangat panjang, mungkin berat disalin.</div>' : '') +
            '<div class="center" style="margin:10px 0"><img src="' + T.esc(lastUrl) + '" alt="preview" style="max-width:100%;max-height:220px;border-radius:10px;border:1px solid #3f3f46"></div>');
          out.appendChild(T.row(
            T.btn('Salin Base64', () => T.copy(lastUrl), true),
            T.dlBtn('gambar-base64.txt', () => lastUrl, 'text/plain', 'Unduh .txt')
          ));
          out.appendChild(T.el('<div class="hint" style="margin-top:8px">Siap ditempel: &lt;img src="<span style="font-family:ui-monospace,monospace">data:…</span>"&gt;</div>'));
        };
        img.onerror = () => T.show(out, '<span class="err">Gagal membaca gambar.</span>');
        img.src = lastUrl;
      };
      rd.onerror = () => T.show(out, '<span class="err">Gagal membaca file.</span>');
      rd.readAsDataURL(f);
    });
    root.appendChild(T.field('Pilih gambar', fileInp, 'Semua diproses lokal, gambar tidak di-upload ke mana pun.'));
    root.appendChild(out);
  });

  // 18. Konverter Satuan
  R('unit-converter', 'Konverter Satuan', 'converter', '📏', 'Panjang, berat, suhu, volume, kecepatan.', (root) => {
    const DEFS = {
      panjang: { label: 'Panjang', units: { m: ['Meter', 1], km: ['Kilometer', 1000], cm: ['Sentimeter', 0.01], mm: ['Milimeter', 0.001], mi: ['Mil', 1609.344], yd: ['Yard', 0.9144], ft: ['Kaki', 0.3048], in: ['Inci', 0.0254] } },
      berat: { label: 'Berat', units: { kg: ['Kilogram', 1], g: ['Gram', 0.001], mg: ['Miligram', 1e-6], ton: ['Ton', 1000], lb: ['Pound', 0.45359237], oz: ['Ons', 0.0283495231] } },
      volume: { label: 'Volume', units: { L: ['Liter', 1], ml: ['Mililiter', 0.001], m3: ['Meter kubik', 1000], gal: ['Galon (US)', 3.785411784], floz: ['Fluid ounce (US)', 0.0295735296], cup: ['Cup (US)', 0.2365882365] } },
      kecepatan: { label: 'Kecepatan', units: { 'm/s': ['Meter/detik', 1], 'km/h': ['Kilometer/jam', 1 / 3.6], mph: ['Mil/jam', 0.44704], knot: ['Knot', 0.514444] } },
      suhu: { label: 'Suhu', units: { C: ['Celcius (°C)', 0], F: ['Fahrenheit (°F)', 0], K: ['Kelvin (K)', 0] } },
    };
    const catSel = T.select(Object.keys(DEFS).map((k) => [k, DEFS[k].label]), 'panjang');
    const fromSel = T.select([], '');
    const toSel = T.select([], '');
    const valInp = T.input('number', 'Nilai, misal: 100', 1);
    const out = T.out();

    const isiUnit = () => {
      const d = DEFS[catSel.value];
      const pairs = Object.keys(d.units).map((k) => [k, d.units[k][0]]);
      fromSel.innerHTML = ''; toSel.innerHTML = '';
      pairs.forEach(([v, l]) => {
        const o1 = document.createElement('option'); o1.value = v; o1.textContent = l; fromSel.appendChild(o1);
        const o2 = document.createElement('option'); o2.value = v; o2.textContent = l; toSel.appendChild(o2);
      });
      toSel.selectedIndex = Math.min(1, pairs.length - 1);
      hitung();
    };
    const keC = (v, u) => (u === 'C' ? v : u === 'F' ? (v - 32) * 5 / 9 : v - 273.15);
    const dariC = (v, u) => (u === 'C' ? v : u === 'F' ? v * 9 / 5 + 32 : v + 273.15);
    const fmtH = (v) => {
      if (!Number.isFinite(v)) return '-';
      const a = Math.abs(v);
      if (a !== 0 && (a >= 1e12 || a < 1e-6)) return v.toExponential(6);
      return String(Math.round(v * 1e6) / 1e6);
    };
    const hitung = () => {
      const v = Number(valInp.value);
      if (!Number.isFinite(v)) { T.hide(out); return; }
      let hasil;
      if (catSel.value === 'suhu') {
        hasil = dariC(keC(v, fromSel.value), toSel.value);
      } else {
        const d = DEFS[catSel.value];
        hasil = (v * d.units[fromSel.value][1]) / d.units[toSel.value][1];
      }
      const nm = (s) => DEFS[catSel.value].units[s][0];
      T.show(out,
        '<div class="kv"><span class="k">' + T.fmt(v) + ' ' + T.esc(nm(fromSel.value)) + '</span><span class="v big">' + fmtH(hasil) + ' <span class="dim" style="font-size:14px">' + T.esc(nm(toSel.value)) + '</span></span></div>');
    };
    catSel.addEventListener('change', isiUnit);
    [fromSel, toSel].forEach((s) => s.addEventListener('change', hitung));
    valInp.addEventListener('input', hitung);
    root.appendChild(T.field('Jenis satuan', catSel));
    root.appendChild(T.grid2(T.field('Dari', fromSel), T.field('Ke', toSel)));
    root.appendChild(T.field('Nilai', valInp));
    root.appendChild(T.row(T.btn('⇅ Tukar', () => {
      const t = fromSel.value; fromSel.value = toSel.value; toSel.value = t; hitung();
    })));
    root.appendChild(out);
    isiUnit();
  });

  // 19. Takaran Masak
  R('cooking-converter', 'Takaran Masak', 'converter', '\U0001f373', 'Konversi sendok, cup, gram, ml.', (root) => {
    // gram per 1 cup (US, 240 ml) — nilai umum dapur
    const BAHAN = {
      air: ['Air', 240], susu: ['Susu cair', 245], minyak: ['Minyak goreng', 218],
      tepung: ['Tepung terigu', 120], gula: ['Gula pasir', 200], gulahalus: ['Gula halus', 120],
      mentega: ['Mentega / margarin', 227], madu: ['Madu', 340], garam: ['Garam', 273], cokelat: ['Cokelat bubuk', 100],
    };
    const VOL = { cup: ['Cup', 240], sdm: ['Sendok makan', 15], sdt: ['Sendok teh', 5], ml: ['Mililiter', 1], L: ['Liter', 1000] };
    const bahanSel = T.select(Object.keys(BAHAN).map((k) => [k, BAHAN[k][0] + ' (' + BAHAN[k][1] + ' g/cup)']).concat([['custom', 'Custom (isi g/ml sendiri)']]), 'tepung');
    const customWrap = T.el('<div></div>');
    const customInp = T.input('number', 'Berat jenis, misal: 0,5 (gram per ml)', '');
    customWrap.appendChild(T.field('Gram per ml', customInp));
    T.hide(customWrap);
    const dariSel = T.select(Object.keys(VOL).map((k) => [k, VOL[k][0]]), 'cup');
    const valInp = T.input('number', 'Jumlah, misal: 2', 2);
    const out = T.out();
    const gPerMl = () => {
      if (bahanSel.value === 'custom') {
        const v = T.num(customInp.value);
        return Number.isFinite(v) && v > 0 ? v : NaN;
      }
      return BAHAN[bahanSel.value][1] / 240;
    };
    const fmtH = (v) => String(Math.round(v * 100) / 100);
    const hitung = () => {
      const v = T.num(valInp.value);
      const d = gPerMl();
      if (!Number.isFinite(v) || v < 0) { T.hide(out); return; }
      if (!Number.isFinite(d)) { T.show(out, '<span class="err">Isi berat jenis (gram per ml) yang valid untuk bahan custom.</span>'); return; }
      const ml = v * VOL[dariSel.value][1];
      const gram = ml * d;
      const rows = Object.keys(VOL).map((k) =>
        '<div class="kv"><span class="k">' + VOL[k][0] + '</span><span class="v">' + fmtH(ml / VOL[k][1]) + '</span></div>'
      ).join('');
      T.show(out,
        '<div class="kv"><span class="k">Berat</span><span class="v big">' + fmtH(gram) + ' <span class="dim" style="font-size:14px">gram</span></span></div>' +
        '<div class="kv"><span class="k">Volume</span><span class="v">' + fmtH(ml) + ' ml</span></div>' +
        '<div class="hint" style="margin:8px 0 2px">Setara dengan:</div>' + rows);
    };
    bahanSel.addEventListener('change', () => { customWrap.hidden = bahanSel.value !== 'custom'; hitung(); });
    [dariSel, valInp, customInp].forEach((e) => e.addEventListener('input', hitung));
    dariSel.addEventListener('change', hitung);
    root.appendChild(T.field('Bahan', bahanSel));
    root.appendChild(customWrap);
    root.appendChild(T.grid2(T.field('Jumlah', valInp), T.field('Satuan', dariSel)));
    root.appendChild(out);
    hitung();
  });

  // 20. Terbilang Indonesia
  R('terbilang', 'Terbilang Indonesia', 'converter', '💬', 'Angka jadi kata bahasa Indonesia.', (root) => {
    const inp = T.input('text', 'Angka, misal: 1500000 atau 1.500.000,50', '1500000');
    inp.inputMode = 'decimal';
    const cRp = T.el('<label class="pick"><input type="checkbox" checked style="width:20px;height:20px"> <span>Tambah kata "rupiah" di akhir</span></label>');
    const cSen = T.el('<label class="pick"><input type="checkbox" checked style="width:20px;height:20px"> <span>Tampilkan sen untuk angka desimal</span></label>');
    const rpBox = cRp.querySelector('input'), senBox = cSen.querySelector('input');
    const out = T.out();
    const go = () => {
      const n = T.num(inp.value);
      if (!Number.isFinite(n)) { T.show(out, '<span class="err">Masukkan angka yang valid.</span>'); return; }
      const neg = n < 0, a = Math.abs(n);
      const bulat = Math.floor(a);
      const sen = Math.round((a - bulat) * 100);
      let kata = NS.utils.terbilang(neg ? -bulat : bulat);
      if (kata === 'angka terlalu besar') { T.show(out, '<span class="err">Angka terlalu besar (maksimal 999 triliun).</span>'); return; }
      if (rpBox.checked) kata += ' rupiah';
      if (sen > 0 && senBox.checked) kata += ' ' + NS.utils.terbilang(sen) + ' sen';
      else if (sen > 0) kata += ' koma ' + String(sen).split('').map((d) => NS.utils.terbilang(+d)).join(' ');
      T.show(out,
        '<div class="kv"><span class="k">Terbilang</span></div>' +
        '<div class="big" style="font-size:20px;line-height:1.5;text-transform:capitalize">' + T.esc(kata) + '</div>');
      out.appendChild(T.row(T.btn('Salin', () => T.copy(kata), true)));
    };
    inp.addEventListener('input', go);
    [rpBox, senBox].forEach((b) => b.addEventListener('change', go));
    root.appendChild(T.field('Angka', inp, 'Boleh pakai format Indonesia: 1.500.000,50'));
    root.appendChild(cRp);
    root.appendChild(cSen);
    root.appendChild(out);
    go();
  });

})();
