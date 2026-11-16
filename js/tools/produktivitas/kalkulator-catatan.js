import { h as T, utils, kv } from '../../core.js?v=6.13.0';

export const meta = {"id": "kalkulator-catatan", "name": "Kalkulator Catatan", "cat": "produktivitas", "icon": "📝", "desc": "Tulis belanjaan per baris — paham rb, jt, persen, dan diskon — langsung dapat totalnya.", "keywords": "kalkulator catatan,notepad calculator,belanja,total,rb,jt,diskon,persen,warung,patungan", "since": "6.13.0"};

// Parser hitungan sendiri, tanpa eval: tokenizer + recursive descent,
// mengikuti pola kalkulator-umum (persen setelah + / - dihitung dari angka
// sebelumnya: 100rb - 10% = 90rb). Sufiks uang: rb = ribu, jt = juta, k = ribu.

function angkaToken(s) {
  // "25rb" -> 25000, "1,5jt" -> 1500000, "1.500" -> 1500, "2,5" -> 2.5.
  const m = /^(\d[\d.,]*)(rb|jt|k)?$/i.exec(s);
  if (!m) return NaN;
  let t = m[1];
  if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.');
  else if (/^\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, '');
  const v = Number(t);
  if (!isFinite(v)) return NaN;
  const suf = (m[2] || '').toLowerCase();
  return v * (suf === 'jt' ? 1e6 : suf === 'rb' || suf === 'k' ? 1e3 : 1);
}

function tokenizeExpr(s) {
  const out = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (c === ' ' || c === '\t') { i++; continue; }
    if (c >= '0' && c <= '9') {
      let j = i;
      while (j < s.length && ((s[j] >= '0' && s[j] <= '9') || s[j] === '.' || s[j] === ',')) j++;
      let k = j;
      while (k < s.length && /[a-zA-Z]/.test(s[k])) k++;
      const raw = s.slice(i, k);
      const v = angkaToken(raw);
      if (!isFinite(v)) throw new Error('angka');
      out.push({ t: 'num', v });
      i = k;
      continue;
    }
    if (c === 'x' || c === 'X' || c === '×') { out.push({ t: 'op', v: '*' }); i++; continue; }
    if ('+-*/()%'.includes(c)) { out.push({ t: 'op', v: c }); i++; continue; }
    throw new Error('karakter');
  }
  return out;
}

function parseExpr(tokens) {
  let pos = 0;
  const peek = () => tokens[pos];
  const next = () => tokens[pos++];
  function expr() {
    let left = term();
    for (;;) {
      const t = peek();
      if (!t || t.t !== 'op' || (t.v !== '+' && t.v !== '-')) return left;
      next();
      const right = term();
      left = { t: t.v === '+' ? 'add' : 'sub', a: left, b: right };
    }
  }
  function term() {
    let left = unary();
    for (;;) {
      const t = peek();
      if (!t || t.t !== 'op' || (t.v !== '*' && t.v !== '/')) return left;
      next();
      const right = unary();
      left = { t: t.v === '*' ? 'mul' : 'div', a: left, b: right };
    }
  }
  function unary() {
    const t = peek();
    if (t && t.t === 'op' && t.v === '-') { next(); return { t: 'neg', x: unary() }; }
    if (t && t.t === 'op' && t.v === '+') { next(); return unary(); }
    return postfix();
  }
  function postfix() {
    let node = primary();
    for (;;) {
      const t = peek();
      if (!t || t.t !== 'op' || t.v !== '%') return node;
      next();
      node = { t: 'pct', x: node };
    }
  }
  function primary() {
    const t = next();
    if (!t) throw new Error('belum lengkap');
    if (t.t === 'num') return { t: 'num', v: t.v };
    if (t.t === 'op' && t.v === '(') {
      const inner = expr();
      const c = next();
      if (!c || c.t !== 'op' || c.v !== ')') throw new Error('kurung');
      return inner;
    }
    throw new Error('tidak benar');
  }
  const tree = expr();
  if (pos < tokens.length) throw new Error('sisa');
  return tree;
}

function evalTree(n) {
  switch (n.t) {
    case 'num': return n.v;
    case 'neg': return -evalTree(n.x);
    case 'add':
    case 'sub': {
      const a = evalTree(n.a);
      const b = n.b.t === 'pct' ? a * evalTree(n.b.x) / 100 : evalTree(n.b);
      return n.t === 'add' ? a + b : a - b;
    }
    case 'mul': return evalTree(n.a) * evalTree(n.b);
    case 'div': {
      const d = evalTree(n.b);
      if (d === 0) throw new Error('nol');
      return evalTree(n.a) / d;
    }
    case 'pct': return evalTree(n.x) / 100;
  }
  throw new Error('tidak benar');
}

function hitungEkspresi(s) {
  try {
    const v = evalTree(parseExpr(tokenizeExpr(s)));
    if (typeof v !== 'number' || !isFinite(v)) return { ok: false };
    return { ok: true, value: v };
  } catch (e) {
    return { ok: false };
  }
}

// Token "hitungan": angka bersufiks, operator, atau campuran keduanya
// (mis. "(100rb"). Kata biasa ("beras", "minyak") tidak lolos karena
// mengandung huruf di luar r/b/j/t/k/x atau tidak mengandung angka.
//
// Pemeriksaan LINEAR (satu jalan per karakter) — sengaja BUKAN regex:
// regex lama /^(?:[+\-*/x×%()]+|(?=.*\d)[...]*\d[\d.,]*(?:rb|jt|k)?[...]*)$/i
// punya kelas karakter tumpang tindih sehingga backtracking kuadratik pada
// token yang gagal (ReDoS RT2-01: token 2.000 digit + 'z' = 10,9 dtk).
// Semantiknya sama persis: hanya digit, ., ,, operator, dan MAKSIMAL SATU
// sufiks rb/jt/k (sesudah angka) yang diizinkan; token operator saja
// (tanpa angka) tetap lolos.
function isTokenHitung(kata) {
  if (!kata) return false;
  let adaAngka = false;
  let sufiksDipakai = false;
  for (let i = 0; i < kata.length; i++) {
    const c = kata[i];
    if (c >= '0' && c <= '9') { adaAngka = true; continue; }
    if ('.,+-*/%()xX×'.includes(c)) continue;
    const l = c.toLowerCase();
    if (!sufiksDipakai && adaAngka && (l === 'r' || l === 'j' || l === 'k')) {
      const dua = kata.slice(i, i + 2).toLowerCase();
      if (dua === 'rb' || dua === 'jt') { sufiksDipakai = true; i++; continue; }
      if (l === 'k') { sufiksDipakai = true; continue; }
    }
    return false;
  }
  return true;
}

function pisahBaris(baris) {
  // "diskon 10%" -> "- 10%" supaya ikut terhitung.
  let s = String(baris).replace(/\bdiskon\s+(\d[\d.,]*)\s*%/gi, '- $1%');
  s = s.replace(/[=:]\s*$/, '').trim();
  if (!s) return null;
  const kata = s.split(/\s+/);
  const ekor = [];
  let i = kata.length - 1;
  for (; i >= 0; i--) {
    if (isTokenHitung(kata[i])) ekor.unshift(kata[i]);
    else break;
  }
  if (!ekor.length) return { label: s, expr: '', value: null, ok: false, adaAngka: false };
  const expr = ekor.join(' ');
  const label = kata.slice(0, i + 1).join(' ');
  const r = hitungEkspresi(expr);
  return { label: label || expr, expr, value: r.ok ? r.value : null, ok: r.ok, adaAngka: true };
}

function hitungCatatan(teks) {
  const rows = [];
  let total = 0;
  let dihitung = 0;
  String(teks == null ? '' : teks).split('\n').forEach((b) => {
    if (!b.trim()) return;
    const r = pisahBaris(b);
    if (!r) return;
    if (r.ok) { total += r.value; dihitung++; }
    rows.push(r);
  });
  return { rows, total, dihitung };
}

utils.kalkulatorCatatanHitung = hitungCatatan;
utils.kalkulatorCatatanEkspresi = hitungEkspresi;

const CONTOH =
  'beras 2kg 25rb\n' +
  'minyak 1L 18rb\n' +
  'gula 1kg 17.500\n' +
  'telur 1kg 28rb\n' +
  'kopi 2 x 12rb\n' +
  'baju 100rb diskon 10%';

export function render(root) {
  const ta = T.ta(10, 'Tulis satu barang satu baris…\ncth: beras 2kg 25rb', '');
  const box = T.out();

  const tampilkan = () => {
    const r = hitungCatatan(ta.value);
    if (!r.rows.length) {
      T.show(box, '<p class="dim center">Belum ada baris. Tulis belanjaanmu di atas — satu barang satu baris.</p>');
      return;
    }
    let html = '';
    r.rows.forEach((row) => {
      if (!row.adaAngka) {
        html += '<div class="kv"><span class="k">' + T.esc(row.label) + '</span><span class="v dim">—</span></div>';
      } else if (row.ok) {
        html += '<div class="kv"><span class="k">' + T.esc(row.label) + '</span><span class="v"><b>' + T.rp(row.value) + '</b></span></div>';
      } else {
        html += '<div class="kv"><span class="k">' + T.esc(row.label) + '</span><span class="v err">tidak bisa dihitung — cek lagi tulisannya</span></div>';
      }
    });
    html += '<div class="kv" style="border-top:2px solid var(--line);margin-top:8px;padding-top:10px"><span class="k"><b>Total (' + r.dihitung + ' baris)</b></span><span class="v big" style="font-size:22px"><b>' + T.rp(r.total) + '</b></span></div>';
    T.show(box, html);
  };

  const salin = () => {
    const r = hitungCatatan(ta.value);
    if (!r.rows.length) { T.toast('Belum ada yang bisa disalin.'); return; }
    const teks = r.rows.map((row) => {
      if (!row.adaAngka) return row.label;
      return row.label + ' = ' + (row.ok ? T.rp(row.value) : 'tidak bisa dihitung');
    }).join('\n') + '\nTotal = ' + T.rp(r.total);
    T.copy(teks);
  };

  root.appendChild(T.el('<p class="note">Cara pakai: tulis satu barang satu baris, lengkap dengan harganya di ujung baris. Paham <b>rb</b> (ribu), <b>jt</b> (juta), kali (<b>x</b>), tambah, kurang, persen, sampai <b>diskon 10%</b>. Totalnya kehitung otomatis.</p>'));
  root.appendChild(T.field('Catatan belanja', ta));
  root.appendChild(T.row(
    T.btn('Isi contoh', () => { ta.value = CONTOH; tampilkan(); }),
    T.btn('Salin hasil', salin),
    T.btn('Hapus semua', () => { ta.value = ''; tampilkan(); })
  ));
  root.appendChild(box);
  root.appendChild(T.el('<p class="hint">Contoh baris: <b>beras 2kg 25rb</b> · <b>kopi 2 x 12rb</b> · <b>baju 100rb diskon 10%</b> · <b>ongkir 15rb + 5rb</b>. Baris tanpa angka di ujungnya dilewati.</p>'));
  // Debounce: hitung ulang 150 ms sesudah user berhenti mengetik, supaya
  // tempelan teks besar tidak mengunci UI di tiap ketikan (RT2-01).
  let tDebounce;
  ta.addEventListener('input', () => {
    clearTimeout(tDebounce);
    tDebounce = setTimeout(tampilkan, 150);
  });
  tampilkan();
}
