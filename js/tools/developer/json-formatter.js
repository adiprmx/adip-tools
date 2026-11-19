import { h as T, utils, errBox, esc, preHtml } from '../../core.js';
import { polaRegexBerbahaya } from '../../regex-aman.js';

// Perbaiki JSON rusak dengan toleransi: komentar, koma berlebih,
// kutip tunggal, dan kunci tanpa kutip. Scanner karakter, bukan regex
// buta, supaya isi string tidak ikut diubah.
function repairJson(raw) {
  let out = '', i = 0, n = raw.length;
  let inStr = null, inLineComment = false, inBlockComment = false;
  while (i < n) {
    const ch = raw[i], next = raw[i + 1];
    if (inLineComment) {
      if (ch === '\n') { inLineComment = false; out += ch; }
      i++;
      continue;
    }
    if (inBlockComment) {
      if (ch === '*' && next === '/') { inBlockComment = false; i += 2; }
      else i++;
      continue;
    }
    if (inStr) {
      if (ch === '\\' && i + 1 < n) { out += ch + raw[i + 1]; i += 2; continue; }
      if (ch === inStr) {
        // Kutip tunggal diubah jadi kutip ganda saat menutup string.
        out += inStr === "'" ? '"' : ch;
        inStr = null; i++;
        continue;
      }
      // Kutip ganda di dalam string kutip tunggal perlu di-escape.
      if (inStr === "'" && ch === '"') { out += '\\"'; i++; continue; }
      out += ch; i++;
      continue;
    }
    if (ch === '/' && next === '/') { inLineComment = true; i += 2; continue; }
    if (ch === '/' && next === '*') { inBlockComment = true; i += 2; continue; }
    if (ch === '"' || ch === "'") {
      inStr = ch;
      out += '"';
      i++;
      continue;
    }
    // Kunci tanpa kutip: { nama: ... } -> { "nama": ... }
    if (/[A-Za-z_$]/.test(ch)) {
      let j = i;
      while (j < n && /[A-Za-z0-9_$]/.test(raw[j])) j++;
      let k = j;
      while (k < n && /\s/.test(raw[k])) k++;
      const word = raw.slice(i, j);
      if (raw[k] === ':' && !['true', 'false', 'null'].includes(word)) {
        out += '"' + word + '"';
        i = j;
        continue;
      }
      out += word;
      i = j;
      continue;
    }
    // Koma berlebih sebelum } atau ]: dibuang.
    if (ch === ',') {
      let k = i + 1;
      while (k < n && /\s/.test(raw[k])) k++;
      if (raw[k] === '}' || raw[k] === ']') { i++; continue; }
      out += ch; i++;
      continue;
    }
    out += ch; i++;
  }
  return out;
}

// Pemindai pola regex berbahaya (ReDoS) tinggal di js/regex-aman.js (G4 C1G4).

// Nilai string yang terlalu panjang tidak diuji pola (hindari regex lambat
// pada teks raksasa; pola lazim hanya dipakai untuk nilai pendek).
const MAKS_PANJANG_UJI_POLA = 10000;

// Kedalaman JSON secara iteratif (tumpuk eksplisit — tidak pernah stack
// overflow). Mengembalikan kedalaman maks, atau 999 bila melewati batas.
function kedalamanJson(v, batas) {
  const lim = batas || 200;
  let maks = 0;
  const tumpuk = [[v, 0]];
  while (tumpuk.length) {
    const [x, d] = tumpuk.pop();
    if (d > maks) maks = d;
    if (maks > lim) return 999;
    if (x !== null && typeof x === 'object') {
      const anak = Array.isArray(x) ? x : Object.values(x);
      for (let i = anak.length - 1; i >= 0; i--) tumpuk.push([anak[i], d + 1]);
    }
  }
  return maks;
}

function sortKeysDeep(v) {
  if (Array.isArray(v)) return v.map(sortKeysDeep);
  if (v !== null && typeof v === 'object') {
    const o = {};
    for (const k of Object.keys(v).sort()) o[k] = sortKeysDeep(v[k]);
    return o;
  }
  return v;
}

// JSONPath sederhana: $.a.b[0], $.a[*], $.a[*].b
function jsonPathEval(root, expr) {
  const e = String(expr || '').trim();
  if (!e.startsWith('$')) throw new Error('Jalur harus diawali $. Contoh: $.pengguna.nama');
  const rest = e.slice(1);
  const tokens = [];
  const re = /(?:\.([A-Za-z_$][A-Za-z0-9_$]*))|(?:\[(\d+|\*)\])|(?:\['([^']+)'\])/g;
  let m, consumed = 0;
  while ((m = re.exec(rest)) !== null) {
    if (m.index !== consumed) throw new Error('Bagian jalur tidak dikenali di: "' + rest.slice(consumed) + '". Yang didukung: .kunci, [angka], [*], [\'kunci\'].');
    consumed = re.lastIndex;
    tokens.push(m[1] !== undefined ? { k: m[1] } : m[2] !== undefined ? { i: m[2] } : { k: m[3] });
  }
  if (consumed !== rest.length) throw new Error('Bagian jalur tidak dikenali di: "' + rest.slice(consumed) + '".');
  let current = [root];
  for (const t of tokens) {
    const next = [];
    for (const v of current) {
      if (t.k !== undefined) {
        if (v !== null && typeof v === 'object' && t.k in v) next.push(v[t.k]);
      } else if (t.i === '*') {
        if (Array.isArray(v)) next.push(...v);
        else if (v !== null && typeof v === 'object') next.push(...Object.values(v));
      } else {
        const idx = +t.i;
        if (Array.isArray(v) && idx < v.length) next.push(v[idx]);
      }
    }
    current = next;
  }
  return current;
}

function typeOf(v) {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';
  if (Number.isInteger(v)) return 'integer';
  return typeof v;
}

// Resolusi $ref internal: '#/definitions/...', '#/$defs/...',
// '#/properties/...' (pointer JSON, ~0 = ~, ~1 = /). Ref luar tidak didukung.
function resolveRef(ref, root) {
  if (typeof ref !== 'string') return { error: 'ref bukan teks' };
  if (!ref.startsWith('#/')) return { error: 'ref luar tidak didukung, hanya ref dalam schema yang sama (#/...)' };
  const parts = ref.slice(2).split('/').map((p) => p.replace(/~1/g, '/').replace(/~0/g, '~'));
  let cur = root;
  for (const p of parts) {
    if (cur === null || typeof cur !== 'object' || !(p in cur)) return { error: 'ref tidak ditemukan: ' + ref };
    cur = cur[p];
  }
  return { schema: cur };
}

// Validasi JSON Schema: type, required, properties, items,
// minimum/maximum, minLength/maxLength, pattern, enum, additionalProperties,
// minItems/maxItems, minProperties/maxProperties, uniqueItems, format,
// $ref (internal), allOf/anyOf/oneOf, schema boolean.
// root = schema teratas (untuk $ref); depth membatasi ref melingkar.
function validateSchema(value, schema, path, errors, root, depth) {
  const p = path || '$';
  const akar = root || schema;
  const d = depth || 0;
  if (d > 50) { errors.push(p + ': schema terlalu dalam (kemungkinan ref melingkar)'); return; }
  if (schema === true) return;
  if (schema === false) { errors.push(p + ': nilai tidak diizinkan schema'); return; }
  if (schema === null || typeof schema !== 'object' || Array.isArray(schema)) return;
  if (typeof schema.$ref === 'string') {
    const r = resolveRef(schema.$ref, akar);
    if (r.error) { errors.push(p + ': ' + r.error); return; }
    validateSchema(value, r.schema, p, errors, akar, d + 1);
  }
  if (schema.type) {
    const want = schema.type;
    const got = typeOf(value);
    const ok = want === 'number' ? (got === 'number' || got === 'integer') : want === got;
    if (!ok) { errors.push(p + ': harus bertipe ' + want + ', dapat ' + got); return; }
  }
  if (schema.enum && !schema.enum.some((e) => JSON.stringify(e) === JSON.stringify(value))) {
    errors.push(p + ': nilai tidak ada di daftar enum');
  }
  if (typeof value === 'number') {
    if (schema.minimum !== undefined && value < schema.minimum) errors.push(p + ': kurang dari minimum ' + schema.minimum);
    if (schema.maximum !== undefined && value > schema.maximum) errors.push(p + ': lebih dari maximum ' + schema.maximum);
  }
  if (typeof value === 'string') {
    if (schema.minLength !== undefined && value.length < schema.minLength) errors.push(p + ': lebih pendek dari minLength ' + schema.minLength);
    if (schema.maxLength !== undefined && value.length > schema.maxLength) errors.push(p + ': lebih panjang dari maxLength ' + schema.maxLength);
    if (schema.pattern) {
      if (polaRegexBerbahaya(schema.pattern)) {
        errors.push(p + ': pola regex di schema ditolak karena berisiko membekukan browser (kuantifier bersarang / alternasi berulang)');
      } else if (value.length > MAKS_PANJANG_UJI_POLA) {
        errors.push(p + ': nilai terlalu panjang untuk dicek pola (' + value.length + ' karakter, maksimal ' + MAKS_PANJANG_UJI_POLA + ')');
      } else {
        try { if (!new RegExp(schema.pattern).test(value)) errors.push(p + ': tidak cocok dengan pola ' + schema.pattern); }
        catch (e) { errors.push(p + ': pola regex di schema tidak valid'); }
      }
    }
    if (schema.format) {
      const fmt = schema.format;
      const ok = fmt === 'email' ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
        : fmt === 'uri' ? /^[a-zA-Z][a-zA-Z0-9+.-]*:\S+$/.test(value)
        : fmt === 'date-time' ? /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/.test(value)
        : fmt === 'date' ? /^\d{4}-\d{2}-\d{2}$/.test(value)
        : null;
      if (ok === false) errors.push(p + ': bukan format ' + fmt + ' yang benar');
    }
  }
  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) errors.push(p + ': item kurang dari minItems ' + schema.minItems);
    if (schema.maxItems !== undefined && value.length > schema.maxItems) errors.push(p + ': item lebih dari maxItems ' + schema.maxItems);
    if (schema.uniqueItems) {
      const sudah = new Set();
      for (const item of value) {
        const k = JSON.stringify(item);
        if (sudah.has(k)) { errors.push(p + ': ada item yang sama (uniqueItems)'); break; }
        sudah.add(k);
      }
    }
    if (schema.items) value.forEach((item, i) => validateSchema(item, schema.items, p + '[' + i + ']', errors, akar, d + 1));
  }
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    if (Array.isArray(schema.required)) {
      for (const k of schema.required) if (!(k in value)) errors.push(p + ': kunci wajib "' + k + '" tidak ada');
    }
    if (schema.minProperties !== undefined && Object.keys(value).length < schema.minProperties) errors.push(p + ': kunci kurang dari minProperties ' + schema.minProperties);
    if (schema.maxProperties !== undefined && Object.keys(value).length > schema.maxProperties) errors.push(p + ': kunci lebih dari maxProperties ' + schema.maxProperties);
    if (schema.properties) {
      for (const k of Object.keys(schema.properties)) {
        if (k in value) validateSchema(value[k], schema.properties[k], p + '.' + k, errors, akar, d + 1);
      }
    }
    if (schema.additionalProperties === false && schema.properties) {
      for (const k of Object.keys(value)) {
        if (!(k in schema.properties)) errors.push(p + ': kunci "' + k + '" tidak ada di schema');
      }
    }
  }
  if (Array.isArray(schema.allOf)) {
    schema.allOf.forEach((sub, i) => {
      const subErr = [];
      validateSchema(value, sub, p, subErr, akar, d + 1);
      subErr.forEach((e) => errors.push(e + ' (allOf[' + i + '])'));
    });
  }
  if (Array.isArray(schema.anyOf)) {
    const lolos = schema.anyOf.some((sub) => {
      const subErr = [];
      validateSchema(value, sub, p, subErr, akar, d + 1);
      return subErr.length === 0;
    });
    if (!lolos) errors.push(p + ': tidak cocok dengan satu pun pilihan anyOf');
  }
  if (Array.isArray(schema.oneOf)) {
    let cocok = 0;
    schema.oneOf.forEach((sub) => {
      const subErr = [];
      validateSchema(value, sub, p, subErr, akar, d + 1);
      if (subErr.length === 0) cocok++;
    });
    if (cocok !== 1) errors.push(p + ': harus cocok dengan tepat satu pilihan oneOf (cocok ' + cocok + ')');
  }
}

// Statistik dokumen: jumlah kunci, kedalaman maks, jumlah array/objek, ukuran byte.
// Iteratif (tumpuk eksplisit) — JSON sedalam apa pun tidak pernah stack overflow.
function hitungStatistik(obj, raw) {
  let kunci = 0, objek = 0, array = 0, dalamMaks = 0;
  const tumpuk = [[obj, 0]];
  while (tumpuk.length) {
    const [v, d] = tumpuk.pop();
    if (d > dalamMaks) dalamMaks = d;
    if (Array.isArray(v)) {
      array++;
      for (let i = v.length - 1; i >= 0; i--) tumpuk.push([v[i], d + 1]);
    } else if (v !== null && typeof v === 'object') {
      objek++;
      const ks = Object.keys(v);
      kunci += ks.length;
      for (let i = ks.length - 1; i >= 0; i--) tumpuk.push([v[ks[i]], d + 1]);
    }
  }
  let byte = 0;
  try { byte = new TextEncoder().encode(raw || '').length; } catch (e) { byte = String(raw || '').length; }
  return { kunci, objek, array, dalamMaks, byte };
}

// Logika murni (bisa di-test di Node).
utils.jsonValidasiSchema = (value, schema) => {
  const errors = [];
  validateSchema(value, schema, '$', errors);
  return errors;
};
utils.jsonStatistik = (obj, raw) => hitungStatistik(obj, raw);

function sorot(teks, query) {
  if (!query) return esc(teks);
  const rendah = String(teks).toLowerCase();
  const q = query.toLowerCase();
  const idx = rendah.indexOf(q);
  if (idx < 0) return esc(teks);
  return esc(String(teks).slice(0, idx)) +
    '<span style="background:#ff6f61;color:#161311;border-radius:2px;padding:0 2px">' + esc(String(teks).slice(idx, idx + q.length)) + '</span>' +
    esc(String(teks).slice(idx + q.length));
}

function adaCocokTurunan(value, q) {
  if (!q) return false;
  if (value === null || typeof value !== 'object') return JSON.stringify(value).toLowerCase().includes(q);
  return Object.entries(value).some(([k, v]) => k.toLowerCase().includes(q) || adaCocokTurunan(v, q));
}

// Kumpulkan semua node yang cocok dengan kata kunci: [{ path, nilai }].
function cariDiTree(value, query, path, hasil) {
  const q = String(query || '').toLowerCase();
  if (!q) return hasil;
  if (value !== null && typeof value === 'object') {
    Object.entries(value).forEach(([k, v]) => {
      const p = Array.isArray(value) ? path + '[' + k + ']' : path + '.' + k;
      if (k.toLowerCase().includes(q)) hasil.push({ path: p, nilai: v });
      cariDiTree(v, query, p, hasil);
    });
  } else if (JSON.stringify(value).toLowerCase().includes(q)) {
    hasil.push({ path, nilai: value });
  }
  return hasil;
}

function treeHtml(value, depth, query) {
  const q = (query || '').toLowerCase();
  if (value !== null && typeof value === 'object') {
    const isArr = Array.isArray(value);
    const keys = Object.keys(value);
    const label = isArr ? 'Array (' + keys.length + ' item)' : 'Object (' + keys.length + ' kunci)';
    if (!keys.length) return '<span class="dim">' + esc(isArr ? '[]' : '{}') + '</span>';
    const inner = keys.map((k) => {
      const v = value[k];
      const isObj = v !== null && typeof v === 'object';
      return '<div style="padding:2px 0 2px 14px;border-left:1px solid #2e2823;margin-left:4px">' +
        '<span style="color:#c9bda9">' + sorot(isArr ? k : '"' + k + '"', q) + '</span>: ' +
        (isObj ? treeHtml(v, depth + 1, query) : '<span style="color:#a9e5bb">' + sorot(JSON.stringify(v), q) + '</span>') +
        '</div>';
    }).join('');
    const buka = depth < 2 || (q && adaCocokTurunan(value, q));
    return '<details' + (buka ? ' open' : '') + ' style="display:inline"><summary style="cursor:pointer;display:inline;color:#e8e0d0">' + esc(label) + '</summary><div>' + inner + '</div></details>';
  }
  return '<span style="color:#a9e5bb">' + sorot(JSON.stringify(value), q) + '</span>';
}

// ---- Angka besar tanpa pembulatan ----
// JSON.parse mengubah angka jadi double JavaScript: bilangan bulat di atas
// 2^53 dan desimal dengan digit lebih dari ~15 akan dibulatkan. Formatter
// teks di bawah bekerja langsung pada teks mentah sehingga literal angka
// (mis. ID 64-bit, saldo kripto) tetap utuh apa adanya.
export function cariAngkaBesar(raw) {
  const ketemu = [];
  let inStr = false, escNext = false;
  const isNum = (c) => /[0-9eE+\-.]/.test(c);
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (inStr) {
      if (escNext) escNext = false;
      else if (ch === '\\') escNext = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') { inStr = true; continue; }
    if (ch === '-' || (ch >= '0' && ch <= '9')) {
      let j = i;
      while (j < raw.length && isNum(raw[j])) j++;
      const tok = raw.slice(i, j);
      if (/^-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?$/.test(tok)) {
        const mantissa = tok.replace(/^[+-]?/, '').split(/[eE]/)[0].replace('.', '').replace(/^0+/, '');
        if (mantissa.length > 15) ketemu.push(tok);
      }
      i = j - 1;
    }
  }
  return ketemu;
}

export function rapikanMentah(raw, indent) {
  const sp = ' '.repeat(indent);
  let out = '', depth = 0, inStr = false, escNext = false;
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (inStr) {
      out += ch;
      if (escNext) escNext = false;
      else if (ch === '\\') escNext = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') { inStr = true; out += ch; continue; }
    if (ch === '{' || ch === '[') {
      let j = i + 1;
      while (j < raw.length && /\s/.test(raw[j])) j++;
      const tutup = ch === '{' ? '}' : ']';
      if (raw[j] === tutup) { out += ch + tutup; i = j; continue; }
      ++depth;
      // Pagar kedalaman (P-05): output pretty-print tumbuh kuadratik
      // terhadap kedalaman (2d^2+1 karakter) — di kedalaman 5000 outputnya
      // ~50 MB dan membekukan tab ~20 detik. Batas 200 = batas Sort/Tree.
      if (depth > 200) throw new RangeError('JSON terlalu dalam (lebih dari 200 tingkat)');
      out += ch + '\n' + sp.repeat(depth);
      continue;
    }
    if (ch === '}' || ch === ']') { out += '\n' + sp.repeat(--depth) + ch; continue; }
    if (ch === ',') { out += ch + '\n' + sp.repeat(depth); continue; }
    if (ch === ':') { out += ': '; continue; }
    if (/\s/.test(ch)) continue;
    out += ch;
  }
  return out;
}

export function minifyMentah(raw) {
  let out = '', inStr = false, escNext = false;
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (inStr) {
      out += ch;
      if (escNext) escNext = false;
      else if (ch === '\\') escNext = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') { inStr = true; out += ch; continue; }
    if (/\s/.test(ch)) continue;
    out += ch;
  }
  return out;
}

// Preset schema contoh sekali klik (untuk mencoba fitur Cek Schema).
export const SCHEMA_PRESET = {
  pengguna: {
    type: 'object',
    required: ['nama', 'email'],
    properties: {
      nama: { type: 'string', minLength: 1 },
      email: { type: 'string', format: 'email' },
      umur: { type: 'integer', minimum: 0 },
      peran: { type: 'string', enum: ['admin', 'pengguna'] },
    },
  },
  produk: {
    type: 'object',
    required: ['id', 'harga'],
    properties: {
      id: { type: 'string', pattern: '^[A-Z]{3}-\\d+$' },
      nama: { type: 'string' },
      harga: { type: 'number', minimum: 0 },
      tag: { type: 'array', items: { type: 'string' }, uniqueItems: true, minItems: 1 },
    },
  },
  konfigurasi: {
    type: 'object',
    properties: {
      tema: { type: 'string', enum: ['gelap', 'terang'] },
      notifikasi: { type: 'boolean' },
      batas: { type: 'integer', minimum: 1, maximum: 100 },
    },
    additionalProperties: false,
  },
};

export const meta = {"id": "json-formatter", "name": "JSON Formatter", "cat": "developer", "icon": "🧩", "desc": "Rapikan, perbaiki, telusuri & validasi JSON. Angka besar tetap utuh, schema lengkap ($ref, format, allOf/anyOf/oneOf).", "keywords": "json,format,rapi,validasi,tree,jsonpath,schema,angka besar,ref,statistik"};
export function render(root) {

    const ta = T.ta(8, 'Paste JSON di sini…');
    const indentSel = T.select([['2', 'Indent 2'], ['4', 'Indent 4']], '2');
    const jagaAngka = document.createElement('input');
    jagaAngka.type = 'checkbox'; jagaAngka.checked = true; jagaAngka.id = 'jf-jaga';
    const box = T.out();
    let angkaBesar = [];
    let treeTerakhir = null;
    const peringatanAngka = () => angkaBesar.length
      ? '<div class="hint" style="margin-top:8px;color:#fbbf24">Perhatian: JSON ini berisi ' + angkaBesar.length + ' angka besar (contoh: ' + esc(angkaBesar[0]) + ') yang sudah dibulatkan di tampilan ini. Pakai tombol Rapikan dengan opsi "Jaga angka besar" supaya angkanya tetap utuh.</div>'
      : '';
    const statsHtml = (obj, raw) => {
      const s = hitungStatistik(obj, raw);
      return '<div class="hint" style="margin-top:8px">' + s.kunci + ' kunci · ' + s.objek + ' objek · ' + s.array + ' array · kedalaman maks ' + s.dalamMaks + ' · ' + s.byte + ' byte</div>';
    };
    const parseInput = () => {
      const raw = ta.value.trim();
      if (!raw) { T.show(box, errBox('Tempel dulu JSON-nya.')); return null; }
      try { angkaBesar = cariAngkaBesar(raw); return { obj: JSON.parse(raw), raw }; }
      catch (e) {
        let pos = '';
        const m = /position (\d+)/.exec(String(e.message));
        if (m) pos = ' (posisi karakter ke-' + m[1] + ')';
        T.show(box, errBox('JSON tidak valid' + pos + '. Coba tombol Perbaiki bila JSON-nya hampir benar.'));
        return null;
      }
    };
    const run = (mode) => {
      const parsed = parseInput();
      if (!parsed) return;
      const { obj, raw } = parsed;
      if (mode === 'valid') {
        T.show(box, '<span class="ok">✓ JSON valid.</span>' + statsHtml(obj, raw) + (angkaBesar.length
          ? '<div class="hint" style="margin-top:6px;color:#fbbf24">' + angkaBesar.length + ' angka besar terdeteksi (contoh: ' + esc(angkaBesar[0]) + '). Aktifkan "Jaga angka besar" saat merapikan supaya tidak dibulatkan.</div>' : ''));
        return;
      }
      const ind = mode === 'min' ? 0 : +indentSel.value;
      // Pagar kedalaman (P-05): Rapikan (kedua jalur) dipagari seperti
      // Sort/Tree — Minify tidak dipagari karena outputnya linear.
      if (mode !== 'min' && kedalamanJson(obj) > 200) { T.show(box, errBox('JSON ini terlalu dalam (lebih dari 200 tingkat) sehingga tidak bisa dirapikan. Coba potong bagiannya dulu.')); return; }
      if (jagaAngka.checked) {
        // Jalur teks mentah: literal angka tidak pernah disentuh.
        try {
          const hasil = mode === 'min' ? minifyMentah(raw) : rapikanMentah(raw, ind);
          T.show(box, preHtml(hasil) + statsHtml(obj, raw) + (angkaBesar.length
            ? '<div class="hint" style="margin-top:8px">' + angkaBesar.length + ' angka besar dipertahankan utuh (tidak dibulatkan).</div>' : ''));
        } catch (e) {
          T.show(box, errBox(e instanceof RangeError ? 'JSON ini terlalu dalam untuk dirapikan. Coba potong bagiannya dulu.' : 'JSON tidak bisa dirapikan. Periksa isinya, lalu coba lagi.'));
        }
        return;
      }
      try {
        T.show(box, preHtml(JSON.stringify(obj, null, ind)) + statsHtml(obj, raw) + peringatanAngka());
      } catch (e) {
        T.show(box, errBox(e instanceof RangeError ? 'JSON ini terlalu dalam untuk dirapikan. Coba potong bagiannya dulu.' : 'JSON tidak bisa dirapikan. Periksa isinya, lalu coba lagi.'));
      }
    };
    const runRepair = () => {
      const raw = ta.value.trim();
      if (!raw) { T.show(box, errBox('Tempel dulu JSON-nya.')); return; }
      try {
        const fixed = repairJson(raw);
        const obj = JSON.parse(fixed);
        // Pagar kedalaman (P-05, audit runRepair): pretty-print hasil
        // perbaikan tumbuh kuadratik seperti Rapikan.
        if (kedalamanJson(obj) > 200) { T.show(box, errBox('JSON ini terlalu dalam (lebih dari 200 tingkat) sehingga tidak bisa diperbaiki otomatis. Coba potong bagiannya dulu.')); return; }
        ta.value = JSON.stringify(obj, null, +indentSel.value);
        T.show(box, '<span class="ok">✓ JSON berhasil diperbaiki.</span> <span class="dim">Yang diperbaiki: komentar dibuang, koma berlebih dibuang, kutip tunggal diubah jadi kutip ganda, kunci tanpa kutip diberi kutip. Hasil sudah ditulis kembali ke kolom input.</span>' + preHtml(JSON.stringify(obj, null, +indentSel.value)));
      } catch (e) {
        T.show(box, errBox('Belum bisa diperbaiki otomatis. Perbaiki manual bagian yang salah, lalu coba lagi.'));
      }
    };
    const runSort = () => {
      const parsed = parseInput();
      if (!parsed) return;
      if (kedalamanJson(parsed.obj) > 200) { T.show(box, errBox('JSON ini terlalu dalam (lebih dari 200 tingkat) sehingga kuncinya tidak bisa diurutkan. Coba potong bagiannya dulu.')); return; }
      try {
        T.show(box, preHtml(JSON.stringify(sortKeysDeep(parsed.obj), null, +indentSel.value)) + peringatanAngka());
      } catch (e) {
        T.show(box, errBox(e instanceof RangeError ? 'JSON ini terlalu dalam untuk diurutkan. Coba potong bagiannya dulu.' : 'Kunci tidak bisa diurutkan. Periksa JSON-nya, lalu coba lagi.'));
      }
    };
    const tampilTree = (obj, query) => {
      if (kedalamanJson(obj) > 200) { T.show(box, errBox('JSON ini terlalu dalam (lebih dari 200 tingkat) sehingga tidak bisa ditampilkan sebagai tree. Coba potong bagiannya dulu.')); return; }
      try {
        tampilTreeDalam(obj, query);
      } catch (e) {
        T.show(box, errBox(e instanceof RangeError ? 'JSON ini terlalu dalam untuk ditampilkan sebagai tree. Coba potong bagiannya dulu.' : 'Tree tidak bisa ditampilkan. Periksa JSON-nya, lalu coba lagi.'));
      }
    };
    const tampilTreeDalam = (obj, query) => {
      let cariHtml = '';
      if (query) {
        const hasil = cariDiTree(obj, query, '$', []);
        const daftar = hasil.slice(0, 20).map((h) => {
          const nilai = typeof h.nilai === 'object' && h.nilai !== null ? (Array.isArray(h.nilai) ? 'Array (' + h.nilai.length + ' item)' : 'Object (' + Object.keys(h.nilai).length + ' kunci)') : JSON.stringify(h.nilai);
          return '<div style="font-size:12.5px;padding:2px 0"><span style="color:#c9bda9">' + esc(h.path) + '</span>: <span style="color:#a9e5bb">' + esc(String(nilai).slice(0, 120)) + '</span></div>';
        }).join('');
        cariHtml = '<div class="hint" style="margin:8px 0 4px">' + hasil.length + ' hasil untuk "' + esc(query) + '"' + (hasil.length > 20 ? ' (20 pertama ditampilkan)' : '') + '</div>' + daftar;
      }
      T.show(box, '<div style="font-family:ui-monospace,monospace;font-size:12.5px;line-height:1.6">' + treeHtml(obj, 0, query) + '</div>' + cariHtml + '<div class="hint" style="margin-top:8px">Ketuk baris untuk membuka/menutup cabangnya.</div>' + peringatanAngka());
    };
    const runTree = () => {
      const parsed = parseInput();
      if (!parsed) return;
      treeTerakhir = parsed.obj;
      tampilTree(parsed.obj, '');
    };
    const cariInp = T.input('text', 'Cari kunci atau nilai di dalam tree…');
    const runCariTree = () => {
      const q = cariInp.value.trim();
      if (!q) { T.show(box, errBox('Tulis dulu kata yang dicari.')); return; }
      if (!treeTerakhir) {
        const parsed = parseInput();
        if (!parsed) return;
        treeTerakhir = parsed.obj;
      }
      tampilTree(treeTerakhir, q);
    };
    const runStatistik = () => {
      const parsed = parseInput();
      if (!parsed) return;
      let s;
      try {
        s = hitungStatistik(parsed.obj, parsed.raw);
      } catch (e) {
        T.show(box, errBox('Statistik tidak bisa dihitung. Periksa JSON-nya, lalu coba lagi.'));
        return;
      }
      T.show(box,
        '<div class="kv"><span class="k">Jumlah kunci</span><span class="v">' + s.kunci + '</span></div>' +
        '<div class="kv"><span class="k">Jumlah objek</span><span class="v">' + s.objek + '</span></div>' +
        '<div class="kv"><span class="k">Jumlah array</span><span class="v">' + s.array + '</span></div>' +
        '<div class="kv"><span class="k">Kedalaman maks</span><span class="v">' + s.dalamMaks + ' tingkat</span></div>' +
        '<div class="kv"><span class="k">Ukuran dokumen</span><span class="v">' + s.byte + ' byte</span></div>' +
        '<p class="hint">Kedalaman dihitung dari akar dokumen (tingkat 0). Ukuran dalam byte UTF-8 dari teks yang ditempel.</p>');
    };
    const pathInp = T.input('text', '$.pengguna.nama  atau  $.daftar[*].harga');
    const runPath = () => {
      const parsed = parseInput();
      if (!parsed) return;
      if (!pathInp.value.trim()) { T.show(box, errBox('Tulis dulu jalur JSONPath-nya. Contoh: $.pengguna.nama')); return; }
      try {
        const hits = jsonPathEval(parsed.obj, pathInp.value);
        if (!hits.length) { T.show(box, '<span class="dim">Tidak ada nilai yang cocok dengan jalur itu.</span>'); return; }
        T.show(box, '<div class="hint" style="margin-bottom:6px">' + hits.length + ' nilai ditemukan.</div>' + preHtml(hits.length === 1 ? JSON.stringify(hits[0], null, 2) : JSON.stringify(hits, null, 2)));
      } catch (e) {
        T.show(box, errBox('Jalur JSONPath-nya tidak benar. Periksa penulisannya, lalu coba lagi.'));
      }
    };
    const schemaTa = T.ta(4, 'Tempel JSON Schema di sini…\nContoh: {"type":"object","required":["nama"],"properties":{"nama":{"type":"string"},"umur":{"type":"integer","minimum":0}}}');
    schemaTa.style.fontFamily = 'ui-monospace,monospace';
    const runSchema = () => {
      const parsed = parseInput();
      if (!parsed) return;
      let schema;
      try { schema = JSON.parse(schemaTa.value); } catch (e) { T.show(box, errBox('Schema bukan JSON yang benar. Periksa penulisannya, lalu coba lagi.')); return; }
      const errors = [];
      try {
        validateSchema(parsed.obj, schema, '$', errors);
      } catch (e) {
        T.show(box, errBox(e instanceof RangeError ? 'JSON atau schema-nya terlalu dalam untuk dicek. Coba potong bagiannya dulu.' : 'Schema tidak bisa dicek. Periksa penulisannya, lalu coba lagi.'));
        return;
      }
      if (!errors.length) { T.show(box, '<span class="ok">✓ Sesuai schema.</span>'); return; }
      T.show(box, '<div style="font-size:13px;margin-bottom:6px"><span class="err">✗ ' + errors.length + ' masalah ditemukan:</span></div>' + errors.map((e) => '<div style="font-size:13px;padding:3px 0">• ' + esc(e) + '</div>').join(''));
    };

    root.appendChild(T.field('Input JSON', ta));
    const lblJaga = T.el('<label style="display:flex;gap:8px;align-items:center;font-size:14px;margin:4px 0 10px"></label>');
    lblJaga.appendChild(jagaAngka);
    lblJaga.appendChild(document.createTextNode('Jaga angka besar tetap utuh (tanpa pembulatan)'));
    root.appendChild(lblJaga);
    root.appendChild(T.row(T.field('Indentasi', indentSel)));
    root.appendChild(T.row(
      T.btn('Rapikan', () => run('pretty'), true),
      T.btn('Minify', () => run('min')),
      T.btn('Validasi', () => run('valid'))
    ));
    root.appendChild(T.row(
      T.btn('Perbaiki', runRepair),
      T.btn('Urutkan Key', runSort),
      T.btn('Tree', runTree),
      T.btn('Statistik', runStatistik)
    ));
    root.appendChild(T.field('Cari di tree', cariInp, 'Cari kunci atau nilai di dalam struktur JSON (ketik lalu tekan tombol Cari).'));
    root.appendChild(T.row(T.btn('Cari', runCariTree)));
    root.appendChild(T.field('JSONPath', pathInp, 'Jalur sederhana: $.kunci, $.daftar[0], $.daftar[*].nama.'));
    root.appendChild(T.row(T.btn('Jalankan JSONPath', runPath)));
    root.appendChild(T.field('JSON Schema (untuk cek schema)', schemaTa, 'Didukung: type, required, properties, items, minimum/maximum, minLength/maxLength, pattern, enum, additionalProperties, minItems/maxItems, minProperties/maxProperties, uniqueItems, format (email/uri/date-time/date), $ref internal, allOf/anyOf/oneOf.'));
    root.appendChild(T.row(
      T.btn('Pengguna', () => { schemaTa.value = JSON.stringify(SCHEMA_PRESET.pengguna, null, 2); }),
      T.btn('Produk', () => { schemaTa.value = JSON.stringify(SCHEMA_PRESET.produk, null, 2); }),
      T.btn('Konfigurasi', () => { schemaTa.value = JSON.stringify(SCHEMA_PRESET.konfigurasi, null, 2); })
    ));
    root.appendChild(T.row(T.btn('Cek Schema', runSchema)));
    root.appendChild(box);
    root.appendChild(T.row(T.copyBtn(() => box.querySelector('pre') ? box.querySelector('pre').textContent : ''), T.dlBtn('format.json', () => box.querySelector('pre') ? box.querySelector('pre').textContent : '{}', 'application/json', 'Unduh')));
    root.appendChild(T.el('<div style="height:12px"></div>'));
    root.appendChild(T.row(
      (() => { const a = T.el('<a class="btn" href="#/t/json-diff" style="text-decoration:none;display:inline-flex;align-items:center">Bandingkan</a>'); return a; })(),
      (() => { const a = T.el('<a class="btn" href="#/t/json-table" style="text-decoration:none;display:inline-flex;align-items:center">Lihat Tabel</a>'); return a; })()
    ));

}
