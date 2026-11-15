import { h as T, utils, errBox, esc, preHtml } from '../../core.js?v=6.12.0';

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

// Validasi JSON Schema dasar: type, required, properties, items,
// minimum/maximum, minLength/maxLength, pattern, enum.
function validateSchema(value, schema, path, errors) {
  const p = path || '$';
  if (schema === null || typeof schema !== 'object' || Array.isArray(schema)) return;
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
      try { if (!new RegExp(schema.pattern).test(value)) errors.push(p + ': tidak cocok dengan pola ' + schema.pattern); }
      catch (e) { errors.push(p + ': pola regex di schema tidak valid'); }
    }
  }
  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) errors.push(p + ': item kurang dari minItems ' + schema.minItems);
    if (schema.maxItems !== undefined && value.length > schema.maxItems) errors.push(p + ': item lebih dari maxItems ' + schema.maxItems);
    if (schema.items) value.forEach((item, i) => validateSchema(item, schema.items, p + '[' + i + ']', errors));
  }
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    if (Array.isArray(schema.required)) {
      for (const k of schema.required) if (!(k in value)) errors.push(p + ': kunci wajib "' + k + '" tidak ada');
    }
    if (schema.properties) {
      for (const k of Object.keys(schema.properties)) {
        if (k in value) validateSchema(value[k], schema.properties[k], p + '.' + k, errors);
      }
    }
    if (schema.additionalProperties === false && schema.properties) {
      for (const k of Object.keys(value)) {
        if (!(k in schema.properties)) errors.push(p + ': kunci "' + k + '" tidak ada di schema');
      }
    }
  }
}

function treeHtml(value, depth) {
  if (value !== null && typeof value === 'object') {
    const isArr = Array.isArray(value);
    const keys = Object.keys(value);
    const label = isArr ? 'Array (' + keys.length + ' item)' : 'Object (' + keys.length + ' kunci)';
    if (!keys.length) return '<span class="dim">' + esc(isArr ? '[]' : '{}') + '</span>';
    const inner = keys.map((k) => {
      const v = value[k];
      const isObj = v !== null && typeof v === 'object';
      return '<div style="padding:2px 0 2px 14px;border-left:1px solid #2e2823;margin-left:4px">' +
        '<span style="color:#c9bda9">' + esc(isArr ? k : '"' + k + '"') + '</span>: ' +
        (isObj ? treeHtml(v, depth + 1) : '<span style="color:#a9e5bb">' + esc(JSON.stringify(v)) + '</span>') +
        '</div>';
    }).join('');
    return '<details' + (depth < 2 ? ' open' : '') + ' style="display:inline"><summary style="cursor:pointer;display:inline;color:#e8e0d0">' + esc(label) + '</summary><div>' + inner + '</div></details>';
  }
  return '<span style="color:#a9e5bb">' + esc(JSON.stringify(value)) + '</span>';
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
      out += ch + '\n' + sp.repeat(++depth);
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

export const meta = {"id": "json-formatter", "name": "JSON Formatter", "cat": "developer", "icon": "🧩", "desc": "Rapikan, perbaiki, telusuri & validasi JSON — angka besar tetap utuh.", "keywords": "json,format,rapi,validasi,tree,jsonpath,schema,angka besar"};
export function render(root) {

    const ta = T.ta(8, 'Paste JSON di sini…');
    const indentSel = T.select([['2', 'Indent 2'], ['4', 'Indent 4']], '2');
    const jagaAngka = document.createElement('input');
    jagaAngka.type = 'checkbox'; jagaAngka.checked = true; jagaAngka.id = 'jf-jaga';
    const box = T.out();
    let angkaBesar = [];
    const peringatanAngka = () => angkaBesar.length
      ? '<div class="hint" style="margin-top:8px;color:#fbbf24">Perhatian: JSON ini berisi ' + angkaBesar.length + ' angka besar (contoh: ' + esc(angkaBesar[0]) + ') yang sudah dibulatkan di tampilan ini. Pakai tombol Rapikan dengan opsi "Jaga angka besar" supaya angkanya tetap utuh.</div>'
      : '';
    const parseInput = () => {
      const raw = ta.value.trim();
      if (!raw) { T.show(box, errBox('Tempel dulu JSON-nya.')); return null; }
      try { angkaBesar = cariAngkaBesar(raw); return { obj: JSON.parse(raw), raw }; }
      catch (e) {
        let pos = '';
        const m = /position (\d+)/.exec(String(e.message));
        if (m) pos = ' (posisi karakter ke-' + m[1] + ')';
        T.show(box, errBox('JSON tidak valid' + pos + ': ' + e.message + ' Coba tombol Perbaiki bila JSON-nya hampir benar.'));
        return null;
      }
    };
    const run = (mode) => {
      const parsed = parseInput();
      if (!parsed) return;
      const { obj, raw } = parsed;
      if (mode === 'valid') {
        T.show(box, '<span class="ok">✓ JSON valid.</span>' + (angkaBesar.length
          ? '<div class="hint" style="margin-top:6px;color:#fbbf24">' + angkaBesar.length + ' angka besar terdeteksi (contoh: ' + esc(angkaBesar[0]) + '). Aktifkan "Jaga angka besar" saat merapikan supaya tidak dibulatkan.</div>' : ''));
        return;
      }
      const ind = mode === 'min' ? 0 : +indentSel.value;
      if (jagaAngka.checked) {
        // Jalur teks mentah: literal angka tidak pernah disentuh.
        const hasil = mode === 'min' ? minifyMentah(raw) : rapikanMentah(raw, ind);
        T.show(box, preHtml(hasil) + (angkaBesar.length
          ? '<div class="hint" style="margin-top:8px">' + angkaBesar.length + ' angka besar dipertahankan utuh (tidak dibulatkan).</div>' : ''));
        return;
      }
      T.show(box, preHtml(JSON.stringify(obj, null, ind)) + peringatanAngka());
    };
    const runRepair = () => {
      const raw = ta.value.trim();
      if (!raw) { T.show(box, errBox('Tempel dulu JSON-nya.')); return; }
      try {
        const fixed = repairJson(raw);
        const obj = JSON.parse(fixed);
        ta.value = JSON.stringify(obj, null, +indentSel.value);
        T.show(box, '<span class="ok">✓ JSON berhasil diperbaiki.</span> <span class="dim">Yang diperbaiki: komentar dibuang, koma berlebih dibuang, kutip tunggal diubah jadi kutip ganda, kunci tanpa kutip diberi kutip. Hasil sudah ditulis kembali ke kolom input.</span>' + preHtml(JSON.stringify(obj, null, +indentSel.value)));
      } catch (e) {
        T.show(box, errBox('Belum bisa diperbaiki otomatis: ' + e.message + ' Perbaiki manual bagian yang salah, lalu coba lagi.'));
      }
    };
    const runSort = () => {
      const parsed = parseInput();
      if (!parsed) return;
      T.show(box, preHtml(JSON.stringify(sortKeysDeep(parsed.obj), null, +indentSel.value)) + peringatanAngka());
    };
    const runTree = () => {
      const parsed = parseInput();
      if (!parsed) return;
      T.show(box, '<div style="font-family:ui-monospace,monospace;font-size:12.5px;line-height:1.6">' + treeHtml(parsed.obj, 0) + '</div><div class="hint" style="margin-top:8px">Ketuk baris untuk membuka/menutup cabangnya.</div>' + peringatanAngka());
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
        T.show(box, errBox(e.message));
      }
    };
    const schemaTa = T.ta(4, 'Tempel JSON Schema di sini…\nContoh: {"type":"object","required":["nama"],"properties":{"nama":{"type":"string"},"umur":{"type":"integer","minimum":0}}}');
    schemaTa.style.fontFamily = 'ui-monospace,monospace';
    const runSchema = () => {
      const parsed = parseInput();
      if (!parsed) return;
      let schema;
      try { schema = JSON.parse(schemaTa.value); } catch (e) { T.show(box, errBox('Schema bukan JSON valid: ' + e.message)); return; }
      const errors = [];
      validateSchema(parsed.obj, schema, '$', errors);
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
      T.btn('Tree', runTree)
    ));
    root.appendChild(T.field('JSONPath', pathInp, 'Jalur sederhana: $.kunci, $.daftar[0], $.daftar[*].nama.'));
    root.appendChild(T.row(T.btn('Jalankan JSONPath', runPath)));
    root.appendChild(T.field('JSON Schema (untuk cek schema)', schemaTa, 'Didukung: type, required, properties, items, minimum/maximum, minLength/maxLength, pattern, enum.'));
    root.appendChild(T.row(T.btn('Cek Schema', runSchema)));
    root.appendChild(box);
    root.appendChild(T.row(T.copyBtn(() => box.querySelector('pre') ? box.querySelector('pre').textContent : ''), T.dlBtn('format.json', () => box.querySelector('pre') ? box.querySelector('pre').textContent : '{}', 'application/json', 'Unduh')));
  
}
