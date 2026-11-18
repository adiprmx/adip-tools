import { h as T, utils, kv, errBox, esc } from '../../core.js';

// UUID v1 (waktu), v3 (MD5 dari nama), v4 (acak), v5 (SHA-1 dari nama),
// v7 (waktu + acak, terurut), dan ULID. Plus inspeksi UUID/ULID yang ditempel.
const NAMESPACES = {
  dns: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
  url: '6ba7b811-9dad-11d1-80b4-00c04fd430c8',
  oid: '6ba7b812-9dad-11d1-80b4-00c04fd430c8',
  x500: '6ba7b814-9dad-11d1-80b4-00c04fd430c8',
};

function bytesToUuid(b) {
  const h = Array.from(b).map((x) => x.toString(16).padStart(2, '0')).join('');
  return h.slice(0, 8) + '-' + h.slice(8, 12) + '-' + h.slice(12, 16) + '-' + h.slice(16, 20) + '-' + h.slice(20);
}
function uuidToBytes(u) {
  const hex = String(u).replace(/-/g, '');
  const b = new Uint8Array(16);
  for (let i = 0; i < 16; i++) b[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return b;
}
function setVersionVariant(b, ver) {
  b[6] = (b[6] & 0x0f) | (ver << 4);
  b[8] = (b[8] & 0x3f) | 0x80;
  return b;
}

// MD5 (RFC 1321) — crypto.subtle tidak menyediakan MD5, jadi dihitung manual.
// Dipakai untuk UUID v3. Vektor uji: MD5('') = d41d8cd98f00b204e9800998ecf8427e,
// MD5('abc') = 900150983cd24fb0d6963f7d28e17f72.
function md5Bytes(input) {
  const s = [7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
             5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
             4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
             6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21];
  const K = [];
  for (let i = 0; i < 64; i++) K.push(Math.floor(Math.abs(Math.sin(i + 1)) * 4294967296) >>> 0);
  const rotl = (x, c) => (x << c) | (x >>> (32 - c));
  let a0 = 0x67452301, b0 = 0xefcdab89, c0 = 0x98badcfe, d0 = 0x10325476;
  const bitLen = input.length * 8;
  const paddedLen = (((input.length + 8) >> 6) + 1) << 6;
  const msg = new Uint8Array(paddedLen);
  msg.set(input);
  msg[input.length] = 0x80;
  const dv = new DataView(msg.buffer);
  dv.setUint32(paddedLen - 8, bitLen >>> 0, true);
  dv.setUint32(paddedLen - 4, Math.floor(bitLen / 4294967296) >>> 0, true);
  for (let off = 0; off < paddedLen; off += 64) {
    const M = [];
    for (let j = 0; j < 16; j++) M.push(dv.getUint32(off + j * 4, true));
    let A = a0, B = b0, C = c0, D = d0;
    for (let i = 0; i < 64; i++) {
      let F, g;
      if (i < 16) { F = (B & C) | (~B & D); g = i; }
      else if (i < 32) { F = (D & B) | (~D & C); g = (5 * i + 1) % 16; }
      else if (i < 48) { F = B ^ C ^ D; g = (3 * i + 5) % 16; }
      else { F = C ^ (B | ~D); g = (7 * i) % 16; }
      F = (F + A + K[i] + M[g]) | 0;
      A = D; D = C; C = B;
      B = (B + rotl(F, s[i])) | 0;
    }
    a0 = (a0 + A) | 0; b0 = (b0 + B) | 0; c0 = (c0 + C) | 0; d0 = (d0 + D) | 0;
  }
  const out = new Uint8Array(16);
  const odv = new DataView(out.buffer);
  odv.setUint32(0, a0, true); odv.setUint32(4, b0, true); odv.setUint32(8, c0, true); odv.setUint32(12, d0, true);
  return out;
}

// UUID v1: timestamp 100-nanodetik sejak 15 Okt 1582 + urutan jam acak +
// node 48-bit ACAK (bit multicast dinyalakan supaya jelas bukan MAC perangkat
// yang sebenarnya — v1 klasik memakai MAC asli, di sini sengaja tidak).
function uuid1() {
  const t = (BigInt(Date.now()) + 12219292800000n) * 10000n;
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  b[0] = Number((t >> 24n) & 0xffn);
  b[1] = Number((t >> 16n) & 0xffn);
  b[2] = Number((t >> 8n) & 0xffn);
  b[3] = Number(t & 0xffn);
  b[4] = Number((t >> 40n) & 0xffn);
  b[5] = Number((t >> 32n) & 0xffn);
  b[6] = Number((t >> 56n) & 0x0fn);
  b[10] = b[10] | 0x01; // bit multicast: node acak, bukan MAC perangkat
  return bytesToUuid(setVersionVariant(b, 1));
}

// UUID v3: MD5(namespace + nama), hasil sama untuk input yang sama.
// Vektor RFC 4122: v3 DNS "www.example.com" = 5df41881-3aed-3515-88a7-2f4a814cf09e.
function uuid3(namespaceUuid, name) {
  const ns = uuidToBytes(namespaceUuid);
  const nm = new TextEncoder().encode(String(name));
  const data = new Uint8Array(16 + nm.length);
  data.set(ns, 0); data.set(nm, 16);
  const digest = md5Bytes(data);
  return bytesToUuid(setVersionVariant(digest, 3));
}

function uuid4() {
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  return bytesToUuid(setVersionVariant(b, 4));
}

function uuid7() {
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  const ms = BigInt(Date.now());
  // 48 bit milidetik di 6 byte pertama, lalu versi 7 + varian + acak.
  for (let i = 0; i < 6; i++) b[i] = Number((ms >> BigInt((5 - i) * 8)) & 0xffn);
  return bytesToUuid(setVersionVariant(b, 7));
}

async function uuid5(namespaceUuid, name) {
  const ns = uuidToBytes(namespaceUuid);
  const nm = new TextEncoder().encode(String(name));
  const data = new Uint8Array(16 + nm.length);
  data.set(ns, 0); data.set(nm, 16);
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-1', data));
  return bytesToUuid(setVersionVariant(digest.slice(0, 16), 5));
}

// ULID: 26 karakter Crockford Base32 — 10 karakter waktu (48 bit milidetik)
// + 16 karakter acak (80 bit). Terurut waktu seperti v7, tanpa tanda hubung.
const ULID_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
function ulid() {
  let ms = BigInt(Date.now());
  let waktu = '';
  for (let i = 0; i < 10; i++) { waktu = ULID_ALPHABET[Number(ms & 31n)] + waktu; ms >>= 5n; }
  const rand = new Uint8Array(10);
  crypto.getRandomValues(rand);
  let r = 0n;
  for (const byte of rand) r = (r << 8n) | BigInt(byte);
  let acak = '';
  for (let i = 0; i < 16; i++) { acak = ULID_ALPHABET[Number(r & 31n)] + acak; r >>= 5n; }
  return waktu + acak;
}
function decodeUlid(s) {
  const v = String(s || '').trim().toUpperCase();
  if (!/^[0-9A-HJKMNP-TV-Z]{26}$/.test(v)) return null;
  let ms = 0n;
  for (let i = 0; i < 10; i++) ms = (ms << 5n) | BigInt(ULID_ALPHABET.indexOf(v[i]));
  return new Date(Number(ms));
}

// Usia relatif dari sebuah waktu (dari ULID Generator): "baru saja",
// "X detik lalu", "X menit lalu", "X jam lalu", atau "X hari lalu".
function usiaRelatif(ms) {
  const age = Date.now() - ms;
  if (age < 0) return 'waktu di masa depan';
  if (age < 1000) return 'baru saja';
  if (age < 60000) return Math.floor(age / 1000) + ' detik lalu';
  if (age < 3600000) return Math.floor(age / 60000) + ' menit lalu';
  if (age < 86400000) return Math.floor(age / 3600000) + ' jam lalu';
  return Math.floor(age / 86400000) + ' hari lalu';
}

// Validasi ULID dengan pesan kesalahan yang spesifik (dari ULID Generator):
// panjang, karakter yang bukan Crockford Base32, dan karakter pertama > '7'.
// Return {ok} atau {error}.
function validasiUlid(v) {
  if (v.length !== 26) return { error: 'ULID harus 26 karakter, yang ditempel ada ' + v.length + ' karakter.' };
  for (const ch of v) {
    if (!ULID_ALPHABET.includes(ch)) return { error: 'Karakter "' + ch + '" bukan bagian dari ULID. ULID hanya memakai angka dan huruf (tanpa I, L, O, U).' };
  }
  if (v[0] > '7') return { error: 'Karakter pertama ULID tidak boleh lebih dari 7.' };
  return { ok: true };
}

// Format salin massal: 'baris' (satu per baris), 'json' (array JSON),
// 'petik' (satu per baris, berpetik + koma), 'csv' (satu baris, koma).
function formatSalinMassal(list, format) {
  if (format === 'json') return JSON.stringify(list, null, 2);
  if (format === 'petik') return list.map((u) => '"' + u + '",').join('\n');
  if (format === 'csv') return list.join(', ');
  return list.join('\n');
}

// Logika murni (bisa di-test di Node).
utils.uuidMd5Hex = (teks) => Array.from(md5Bytes(new TextEncoder().encode(String(teks)))).map((x) => x.toString(16).padStart(2, '0')).join('');
utils.uuidV1 = () => uuid1();
utils.uuidV3 = (ns, nama) => uuid3(ns, nama);
utils.uuidUlid = () => ulid();
utils.uuidDecodeUlid = (s) => decodeUlid(s);
utils.uuidFormatMassal = (list, format) => formatSalinMassal(list, format);

const UUID_RE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
function inspectUuid(s) {
  const v = String(s || '').trim();
  if (!v) return { error: 'Tempel dulu UUID-nya.' };
  // 26 karakter tanpa tanda hubung hampir pasti ULID — validasi dengan
  // pesan spesifik, bukan vonis generik "format UUID tidak valid".
  if (v.length === 26 && !v.includes('-')) {
    const cek = validasiUlid(v.toUpperCase());
    if (cek.error) return { error: cek.error };
    const time = decodeUlid(v);
    let ms = 0n;
    const vu = v.toUpperCase();
    for (let i = 0; i < 10; i++) ms = (ms << 5n) | BigInt(ULID_ALPHABET.indexOf(vu[i]));
    return { ulid: true, uuid: vu, version: null, variant: 'ULID (bukan UUID)', time, ms: Number(ms), random: vu.slice(10), isNil: false, isMax: false };
  }
  if (!UUID_RE.test(v)) return { error: 'Format UUID tidak valid. Bentuknya: 8-4-4-4-12 karakter heksadesimal, dipisah tanda hubung. (ULID 26 karakter juga bisa dibaca.)' };
  const b = uuidToBytes(v);
  const version = (b[6] >> 4) & 0x0f;
  const variantBits = b[8] >> 6;
  const variant = variantBits === 2 ? 'RFC 4122 (standar)' : variantBits === 0 ? 'NCS (lama)' : variantBits === 1 ? 'Microsoft (lama)' : 'dicadangkan';
  let time = null;
  if (version === 7) {
    let ms = 0n;
    for (let i = 0; i < 6; i++) ms = (ms << 8n) | BigInt(b[i]);
    time = new Date(Number(ms));
  } else if (version === 1) {
    const ts = (BigInt(b[6] & 0x0f) << 48n) | (BigInt(b[4]) << 40n) | (BigInt(b[5]) << 32n) |
      (BigInt(b[0]) << 24n) | (BigInt(b[1]) << 16n) | (BigInt(b[2]) << 8n) | BigInt(b[3]);
    // 100-nanodetik sejak 15 Okt 1582; kurangi offset ke epoch Unix.
    const ms = Number((ts - 0x01B21DD213814000n) / 10000n);
    time = new Date(ms);
  }
  const isNil = /^0{8}-0{4}-0{4}-0{4}-0{12}$/.test(v);
  const isMax = /^f{8}-f{4}-f{4}-f{4}-f{12}$/.test(v.toLowerCase());
  return { uuid: v.toLowerCase(), version, variant, time, isNil, isMax };
}

export const meta = {"id": "uuid-generator", "name": "UUID Generator", "cat": "keamanan", "icon": "🆔", "desc": "Buat UUID v1, v3, v4, v5, v7 & ULID, massal sampai 1.000, plus baca UUID/ULID.", "keywords": "uuid,acak,id,v1,v3,v7,v5,ulid,inspect,md5"};
export function render(root) {

    const verSel = T.select([
      ['4', 'v4 (acak)'],
      ['7', 'v7 (waktu + acak, terurut)'],
      ['1', 'v1 (waktu + node acak)'],
      ['3', 'v3 (dari nama + namespace, MD5)'],
      ['5', 'v5 (dari nama + namespace, SHA-1)'],
      ['ulid', 'ULID (26 karakter, terurut waktu)'],
    ], '4');
    const nInp = T.input('text', 'Jumlah (1-1000)', '5');
    nInp.inputMode = 'numeric';
    const tanpaHubung = document.createElement('input');
    tanpaHubung.type = 'checkbox'; tanpaHubung.id = 'uuid-tanpa-hubung';
    const formatSel = T.select([
      ['baris', 'Satu per baris'],
      ['json', 'Array JSON'],
      ['petik', 'Berpetik + koma (satu per baris)'],
      ['csv', 'Satu baris, dipisah koma'],
    ], 'baris');
    const nsSel = T.select([
      ['dns', 'DNS'],
      ['url', 'URL'],
      ['oid', 'OID'],
      ['x500', 'X.500'],
      ['custom', 'Namespace sendiri'],
    ], 'dns');
    const nsCustom = T.input('text', 'UUID namespace sendiri…');
    const nameInp = T.input('text', 'Nama (misal: example.com)');
    const namaWrap = T.el('<div></div>');
    namaWrap.appendChild(T.field('Namespace', nsSel));
    namaWrap.appendChild(T.field('UUID namespace', nsCustom));
    namaWrap.appendChild(T.field('Nama', nameInp, 'Untuk v3/v5, jumlah diabaikan: satu nama menghasilkan satu UUID.'));
    namaWrap.hidden = true;
    nsCustom.parentElement.hidden = true;
    const segarkanNama = () => {
      const perluNama = verSel.value === '5' || verSel.value === '3';
      namaWrap.hidden = !perluNama;
    };
    verSel.addEventListener('change', segarkanNama);
    nsSel.addEventListener('change', () => { nsCustom.parentElement.hidden = nsSel.value !== 'custom'; });
    const out = T.out();
    let last = [];
    const gen = async () => {
      const ver = verSel.value;
      const rapat = tanpaHubung.checked;
      const rapikan = (u) => (rapat && ver !== 'ulid' ? u.replace(/-/g, '') : u);
      if (ver === '5' || ver === '3') {
        const name = nameInp.value;
        if (!name) { T.show(out, errBox('Isi dulu namanya.')); return; }
        let ns = NAMESPACES[nsSel.value];
        if (nsSel.value === 'custom') {
          ns = nsCustom.value.trim();
          if (!UUID_RE.test(ns)) { T.show(out, errBox('UUID namespace sendiri tidak valid.')); return; }
        }
        T.show(out, '<span class="dim">Menghitung…</span>');
        try {
          last = [rapikan(ver === '5' ? await uuid5(ns, name) : uuid3(ns, name))];
        } catch (e) {
          T.show(out, errBox('UUID v' + ver + ' tidak bisa dibuat. Periksa nama dan namespace-nya, lalu coba lagi.'));
          return;
        }
      } else {
        const n = Math.max(1, Math.min(1000, parseInt(nInp.value, 10) || 5));
        nInp.value = n;
        last = [];
        for (let i = 0; i < n; i++) {
          last.push(rapikan(ver === '7' ? uuid7() : ver === '1' ? uuid1() : ver === 'ulid' ? ulid() : uuid4()));
        }
      }
      T.show(out, last.map((u) =>
        '<div class="kv"><span class="v" style="font-family:ui-monospace,monospace;font-size:13px;user-select:all;text-align:left">' + u + '</span></div>'
      ).join('') +
      (ver === 'ulid' ? '<p class="hint">Dibuat ' + new Date().toLocaleString('id-ID') + '. Urutan abjad sama dengan urutan waktu dibuat.</p>' : '') +
      (ver === '1' ? '<p class="hint">v1 di sini memakai node 48-bit acak (bukan MAC perangkatmu) — aman dibagikan, tidak membocorkan identitas perangkat.</p>' : ''));
    };

    // ---- Inspeksi ----
    const inspInp = T.input('text', 'Tempel UUID / ULID di sini untuk dibaca…');
    const inspBox = T.out();
    const inspect = () => {
      const r = inspectUuid(inspInp.value);
      if (r.error) { T.show(inspBox, errBox(r.error)); return; }
      if (r.ulid) {
        let html = '<div style="margin-bottom:8px"><span class="ok">✓ ULID valid.</span></div>' +
          kv('Jenis', 'ULID (26 karakter, terurut waktu)');
        if (r.time && !isNaN(r.time.getTime())) html += kv('Waktu dibuat', esc(r.time.toLocaleString('id-ID')) + ' <span class="dim">(' + esc(usiaRelatif(r.ms)) + ')</span>');
        else html += kv('Waktu dibuat', 'tidak bisa dibaca');
        if (r.ms != null) html += kv('Milidetik', String(r.ms));
        if (r.random) html += kv('Bagian acak', '<span style="font-family:ui-monospace,monospace">' + esc(r.random) + '</span>');
        T.show(inspBox, html);
        return;
      }
      const verName = { 1: 'v1 (waktu + MAC)', 3: 'v3 (MD5 dari nama)', 4: 'v4 (acak)', 5: 'v5 (SHA-1 dari nama)', 7: 'v7 (waktu + acak)' }[r.version] || ('v' + r.version);
      let html = '<div style="margin-bottom:8px"><span class="ok">✓ UUID valid.</span>' +
        (r.isNil ? ' <span class="dim">Ini UUID nil (semua nol).</span>' : '') +
        (r.isMax ? ' <span class="dim">Ini UUID max (semua f).</span>' : '') + '</div>' +
        kv('Versi', esc(verName)) +
        kv('Varian', esc(r.variant));
      if (r.time && !isNaN(r.time.getTime())) html += kv('Waktu di dalamnya', esc(r.time.toLocaleString('id-ID')) + ' <span class="dim">(' + esc(usiaRelatif(r.time.getTime())) + ')</span>');
      else if (r.version === 1 || r.version === 7) html += kv('Waktu di dalamnya', 'tidak bisa dibaca');
      else html += kv('Waktu di dalamnya', 'versi ini tidak menyimpan waktu');
      T.show(inspBox, html);
    };

    const lblRapat = T.el('<label style="display:flex;gap:8px;align-items:center;font-size:14px;margin:4px 0 10px"></label>');
    lblRapat.appendChild(tanpaHubung);
    lblRapat.appendChild(document.createTextNode('Tanpa tanda hubung (32 karakter rapat, tidak berlaku untuk ULID)'));

    root.appendChild(T.field('Versi UUID', verSel));
    root.appendChild(T.field('Jumlah UUID', nInp));
    root.appendChild(namaWrap);
    root.appendChild(lblRapat);
    root.appendChild(T.field('Format salin massal', formatSel, 'Bentuk teks saat menekan "Salin Semua"'));
    root.appendChild(T.row(T.btn('Generate', gen, true), T.btn('Salin Semua', () => { if (last.length) T.copy(formatSalinMassal(last, formatSel.value)); else T.toast('Generate dulu'); })));
    root.appendChild(out);
    root.appendChild(T.el('<div style="height:16px"></div>'));
    root.appendChild(T.field('Baca UUID / ULID', inspInp, 'Tempel UUID atau ULID apa pun untuk tahu versi, varian, dan waktunya (untuk v1, v7 & ULID).'));
    root.appendChild(T.row(T.btn('Baca', inspect)));
    root.appendChild(inspBox);
    gen();

}
