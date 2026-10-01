import { h as T, utils } from '../../core.js?v=5.2.0';

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

export const meta = {"id": "hash-generator", "name": "Hash Generator", "cat": "keamanan", "icon": "#️⃣", "desc": "Hash teks ke MD5, SHA-1, SHA-256, SHA-512.", "keywords": "hash,md5,sha"};
export function render(root) {

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
      if (cMd5.box.checked) jobs.push(['MD5', utils.md5(txt)]);
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
  
}
