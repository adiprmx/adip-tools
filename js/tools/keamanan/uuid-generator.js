import { h as T, utils, kv, errBox, esc } from '../../core.js?v=6.12.0';

// UUID v4 (acak), v7 (waktu + acak, terurut), v5 (dari namespace + nama,
// SHA-1, hasil sama untuk input yang sama). Plus inspeksi UUID yang ditempel.
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

const UUID_RE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
function inspectUuid(s) {
  const v = String(s || '').trim();
  if (!v) return { error: 'Tempel dulu UUID-nya.' };
  if (!UUID_RE.test(v)) return { error: 'Format UUID tidak valid. Bentuknya: 8-4-4-4-12 karakter heksadesimal, dipisah tanda hubung.' };
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

export const meta = {"id": "uuid-generator", "name": "UUID Generator", "cat": "keamanan", "icon": "🆔", "desc": "Buat UUID v4, v7 & v5, massal sampai 1.000.", "keywords": "uuid,acak,id,v7,v5,inspect"};
export function render(root) {

    const verSel = T.select([
      ['4', 'v4 (acak)'],
      ['7', 'v7 (waktu + acak, terurut)'],
      ['5', 'v5 (dari nama + namespace)'],
    ], '4');
    const nInp = T.input('text', 'Jumlah (1-1000)', '5');
    nInp.inputMode = 'numeric';
    const nsSel = T.select([
      ['dns', 'DNS'],
      ['url', 'URL'],
      ['oid', 'OID'],
      ['x500', 'X.500'],
      ['custom', 'Namespace sendiri'],
    ], 'dns');
    const nsCustom = T.input('text', 'UUID namespace sendiri…');
    const nameInp = T.input('text', 'Nama (misal: example.com)');
    const v5Wrap = T.el('<div></div>');
    v5Wrap.appendChild(T.field('Namespace', nsSel));
    v5Wrap.appendChild(T.field('UUID namespace', nsCustom));
    v5Wrap.appendChild(T.field('Nama', nameInp, 'Untuk v5, jumlah diabaikan: satu nama menghasilkan satu UUID.'));
    v5Wrap.hidden = true;
    nsCustom.parentElement.hidden = true;
    verSel.addEventListener('change', () => { v5Wrap.hidden = verSel.value !== '5'; });
    nsSel.addEventListener('change', () => { nsCustom.parentElement.hidden = nsSel.value !== 'custom'; });
    const out = T.out();
    let last = [];
    const gen = async () => {
      const ver = verSel.value;
      if (ver === '5') {
        const name = nameInp.value;
        if (!name) { T.show(out, errBox('Isi dulu namanya.')); return; }
        let ns = NAMESPACES[nsSel.value];
        if (nsSel.value === 'custom') {
          ns = nsCustom.value.trim();
          if (!UUID_RE.test(ns)) { T.show(out, errBox('UUID namespace sendiri tidak valid.')); return; }
        }
        T.show(out, '<span class="dim">Menghitung…</span>');
        try {
          last = [await uuid5(ns, name)];
        } catch (e) {
          T.show(out, errBox('Gagal membuat UUID v5: ' + (e && e.message ? e.message : e)));
          return;
        }
      } else {
        const n = Math.max(1, Math.min(1000, parseInt(nInp.value, 10) || 5));
        nInp.value = n;
        last = [];
        for (let i = 0; i < n; i++) last.push(ver === '7' ? uuid7() : uuid4());
      }
      T.show(out, last.map((u) =>
        '<div class="kv"><span class="v" style="font-family:ui-monospace,monospace;font-size:13px;user-select:all;text-align:left">' + u + '</span></div>'
      ).join(''));
    };

    // ---- Inspeksi ----
    const inspInp = T.input('text', 'Tempel UUID di sini untuk dibaca…');
    const inspBox = T.out();
    const inspect = () => {
      const r = inspectUuid(inspInp.value);
      if (r.error) { T.show(inspBox, errBox(r.error)); return; }
      const verName = { 1: 'v1 (waktu + MAC)', 3: 'v3 (MD5 dari nama)', 4: 'v4 (acak)', 5: 'v5 (SHA-1 dari nama)', 7: 'v7 (waktu + acak)' }[r.version] || ('v' + r.version);
      let html = '<div style="margin-bottom:8px"><span class="ok">✓ UUID valid.</span>' +
        (r.isNil ? ' <span class="dim">Ini UUID nil (semua nol).</span>' : '') +
        (r.isMax ? ' <span class="dim">Ini UUID max (semua f).</span>' : '') + '</div>' +
        kv('Versi', esc(verName)) +
        kv('Varian', esc(r.variant));
      if (r.time && !isNaN(r.time.getTime())) html += kv('Waktu di dalamnya', esc(r.time.toLocaleString('id-ID')));
      else if (r.version === 1 || r.version === 7) html += kv('Waktu di dalamnya', 'tidak bisa dibaca');
      else html += kv('Waktu di dalamnya', 'versi ini tidak menyimpan waktu');
      T.show(inspBox, html);
    };

    root.appendChild(T.field('Versi UUID', verSel));
    root.appendChild(T.field('Jumlah UUID', nInp));
    root.appendChild(v5Wrap);
    root.appendChild(T.row(T.btn('Generate', gen, true), T.btn('Salin Semua', () => { if (last.length) T.copy(last.join('\n')); else T.toast('Generate dulu'); })));
    root.appendChild(out);
    root.appendChild(T.el('<div style="height:16px"></div>'));
    root.appendChild(T.field('Baca UUID', inspInp, 'Tempel UUID apa pun untuk tahu versi, varian, dan waktunya (untuk v1 & v7).'));
    root.appendChild(T.row(T.btn('Baca', inspect)));
    root.appendChild(inspBox);
    gen();
  
}
