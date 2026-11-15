import { h as T, utils } from '../../core.js?v=6.11.5';

utils.md5 = async function (str) { return _md5(str); };

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

async function shaHex(alg, text) {
    const buf = await crypto.subtle.digest(alg, new TextEncoder().encode(String(text)));
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
  }

// CRC-32 murni (polinomial IEEE 802.3, nilai awal 0xFFFFFFFF).
function crc32Hex(text) {
    let table = crc32Hex._t;
    if (!table) {
      table = crc32Hex._t = new Int32Array(256);
      for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
        table[n] = c;
      }
    }
    const bytes = new TextEncoder().encode(String(text));
    let c = 0xFFFFFFFF;
    for (let i = 0; i < bytes.length; i++) c = table[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
    return ((c ^ 0xFFFFFFFF) >>> 0).toString(16).padStart(8, '0');
  }

// SHA-224 & RIPEMD-160 tidak ada di WebCrypto: pakai crypto-js.
// File komponennya bukan standalone: core dulu, lalu sha256 (dibutuhkan
// sha224), lalu sha224 & ripemd160, berurutan.
// SHA-3 sengaja TIDAK pakai crypto-js: CryptoJS.SHA3 menghasilkan Keccak
// pra-standar, bukan SHA-3 resmi (FIPS 202). Dipakai js-sha3.
const CJ_BASE = 'https://cdn.jsdelivr.net/npm/crypto-js@4.2.0/';
const SHA3_CDN = 'https://cdn.jsdelivr.net/npm/js-sha3@0.9.3/build/sha3.min.js';
let cjReady = null, sha3Ready = null;
async function ensureCryptoJs() {
    if (cjReady !== null) return cjReady;
    for (const f of ['core.js', 'sha256.js', 'sha224.js', 'ripemd160.js']) {
      const ok = await T.loadScript(CJ_BASE + f);
      if (!ok) { cjReady = false; return false; }
    }
    cjReady = !!(window.CryptoJS && window.CryptoJS.SHA224 && window.CryptoJS.RIPEMD160);
    return cjReady;
  }
async function ensureSha3() {
    if (sha3Ready !== null) return sha3Ready;
    const ok = await T.loadScript(SHA3_CDN);
    sha3Ready = !!(ok && typeof window.sha3_256 === 'function' && typeof window.sha3_512 === 'function');
    return sha3Ready;
  }

export const meta = {"id": "hash-generator", "name": "Hash Generator", "cat": "keamanan", "icon": "#️⃣", "desc": "Hash teks: MD5, SHA, SHA-3, RIPEMD-160, CRC-32.", "keywords": "hash,md5,sha,sha3,ripemd,crc32"};
export function render(root) {

    const inp = T.ta(4, 'Tulis teks yang mau di-hash…');
    const mkChk = (label, checked) => {
      const l = T.el('<label class="pick"><input type="checkbox"' + (checked ? ' checked' : '') + ' style="width:20px;height:20px"> <span>' + T.esc(label) + '</span></label>');
      return { el: l, box: l.querySelector('input') };
    };
    const cMd5 = mkChk('MD5', true), cSha1 = mkChk('SHA-1', true), cSha224 = mkChk('SHA-224', false), cSha256 = mkChk('SHA-256', true), cSha384 = mkChk('SHA-384', false), cSha512 = mkChk('SHA-512', false);
    const cSha3_256 = mkChk('SHA3-256', false), cSha3_512 = mkChk('SHA3-512', false), cRipemd = mkChk('RIPEMD-160', false), cCrc32 = mkChk('CRC-32', false);
    const out = T.out();
    const go = async () => {
      const txt = inp.value;
      if (!txt) { T.show(out, '<span class="err">Isi teksnya dulu.</span>'); return; }
      const needCj = cSha224.box.checked || cRipemd.box.checked;
      const needSha3 = cSha3_256.box.checked || cSha3_512.box.checked;
      // Semua job adalah promise -> [nama, hash] | [[nama, hash]...] | {fail}.
      const jobs = [];
      if (cMd5.box.checked) jobs.push(utils.md5(txt).then((h) => ['MD5', h]));
      if (cSha1.box.checked) jobs.push(shaHex('SHA-1', txt).then((h) => ['SHA-1', h]));
      if (cSha256.box.checked) jobs.push(shaHex('SHA-256', txt).then((h) => ['SHA-256', h]));
      if (cSha384.box.checked) jobs.push(shaHex('SHA-384', txt).then((h) => ['SHA-384', h]));
      if (cSha512.box.checked) jobs.push(shaHex('SHA-512', txt).then((h) => ['SHA-512', h]));
      if (cCrc32.box.checked) jobs.push(Promise.resolve(['CRC-32', crc32Hex(txt)]));
      if (needCj) {
        jobs.push((async () => {
          const ok = await ensureCryptoJs();
          if (!ok) return { fail: 'cj' };
          const r = [];
          if (cSha224.box.checked) r.push(['SHA-224', window.CryptoJS.SHA224(txt).toString()]);
          if (cRipemd.box.checked) r.push(['RIPEMD-160', window.CryptoJS.RIPEMD160(txt).toString()]);
          return r;
        })());
      }
      if (needSha3) {
        jobs.push((async () => {
          const ok = await ensureSha3();
          if (!ok) return { fail: 'sha3' };
          const r = [];
          if (cSha3_256.box.checked) r.push(['SHA3-256', window.sha3_256(txt)]);
          if (cSha3_512.box.checked) r.push(['SHA3-512', window.sha3_512(txt)]);
          return r;
        })());
      }
      if (!jobs.length) { T.show(out, '<span class="err">Pilih minimal satu algoritma.</span>'); return; }
      T.show(out, '<span class="dim">Menghitung…</span>');
      const settled = await Promise.all(jobs.map((p) => Promise.resolve(p).catch(() => null)));
      const hasil = [];
      let cjFail = false, sha3Fail = false;
      for (const s of settled) {
        if (s === null) continue;
        if (!Array.isArray(s)) {
          if (s.fail === 'cj') cjFail = true;
          if (s.fail === 'sha3') sha3Fail = true;
          continue;
        }
        if (Array.isArray(s[0])) { hasil.push(...s); continue; }
        hasil.push(s);
      }
      if (!hasil.length) {
        T.show(out, '<span class="err">Tidak ada hash yang bisa dihitung. ' + (cjFail || sha3Fail ? 'Pustaka dari CDN gagal dimuat, cek koneksi lalu coba lagi.' : '') + '</span>');
        return;
      }
      let html = hasil.map(([n, h]) =>
        '<div class="kv"><span class="k">' + n + '</span><span class="v" class="monoall" style="font-size:12px">' + T.esc(h) + '</span></div>'
      ).join('') + '<div style="margin-top:10px">' +
        hasil.map(([n, h], i) => '<button type="button" class="btn small" data-h="' + i + '" style="margin:0 6px 6px 0">Salin ' + n + '</button>').join('') + '</div>';
      if (cjFail) html += '<div class="hint" style="margin-top:8px">SHA-224 / RIPEMD-160 gagal: pustaka crypto-js tidak bisa dimuat dari CDN.</div>';
      if (sha3Fail) html += '<div class="hint" style="margin-top:8px">SHA3 gagal: pustaka js-sha3 tidak bisa dimuat dari CDN.</div>';
      T.show(out, html);
      out.querySelectorAll('button[data-h]').forEach((b) => b.addEventListener('click', () => T.copy(hasil[+b.dataset.h][1])));
    };
    root.appendChild(T.field('Teks', inp));
    root.appendChild(T.grid2(cMd5.el, cSha1.el, cSha224.el, cSha256.el, cSha384.el, cSha512.el, cSha3_256.el, cSha3_512.el, cRipemd.el, cCrc32.el));
    root.appendChild(T.row(T.btn('Hash Sekarang', go, true)));
    root.appendChild(out);
    root.appendChild(T.el('<div class="hint" style="margin-top:12px">MD5, SHA-1/256/384/512 &amp; CRC-32 dihitung langsung di perangkat. SHA-224 &amp; RIPEMD-160 memuat crypto-js dari internet sekali, SHA3 memuat js-sha3 (SHA-3 resmi, bukan Keccak).</div>'));
  
}
