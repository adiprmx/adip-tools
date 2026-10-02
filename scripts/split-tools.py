#!/usr/bin/env python3
"""FASE 2: pecah js/tools-{a,b,c,d,e}.js menjadi js/tools/<cat>/<id>.js (100 file).

Aturan (disetujui owner):
 1. Satu file = satu tool, nama file = id tool, di folder kategorinya.
 2. Tool dilarang import tool lain.
 3. Fungsi dipakai >1 tool  -> core.js (shared).
 4. Fungsi dipakai tepat 1 tool -> ikut file tool tersebut.
 5. app.js jadi shell + router (dynamic import).
 6. Hasilkan manifest.js + script cek konsistensi.

Pendekatan: analisis AST (acorn) sudah di analysis.json — presisi, bukan regex.
"""
import json, os, re, shutil, sys

ROOT = '/home/hatch/workspace/projects/adip-tools'
JS = os.path.join(ROOT, 'js')
VERSION = '6.9.5'
analysis = json.load(open('/tmp/split/analysis.json'))

# Muat source per batch
srcs = {}
for b in 'abcde':
    with open(os.path.join(JS, f'tools-{b}.js'), encoding='utf-8', errors='replace') as f:
        srcs[b] = f.read()

def utf16_to_py(s, u16off):
    """Konversi offset UTF-16 code unit (acorn/Node) ke indeks Python str.
    Diperlukan karena emoji (surrogate pair) = 2 unit di JS tapi 1 char di Python.
    """
    return len(s.encode('utf-16-le')[:u16off * 2].decode('utf-16-le'))

def slice_u16(s, start_u16, end_u16):
    return s[utf16_to_py(s, start_u16):utf16_to_py(s, end_u16)]

# ---------- 1. Bangun indeks definisi ----------
# name -> {batch, source, refs, order}
defs = {}
order_counter = 0
for b in 'abcde':
    for td in analysis[b]['topDefs']:
        name = td['name']
        if name == 'R':
            continue
        source = slice_u16(srcs[b], td['start'], td['end'])
        defs[(b, name)] = {'batch': b, 'name': name, 'source': source,
                           'refs': td['refs'], 'order': order_counter}
        order_counter += 1

def find_def(batch, name):
    return defs.get((batch, name))

# ---------- 2. Closure per tool ----------
tools = []  # {id,name,cat,icon,desc, batch, body, need:set}
for b in 'abcde':
    for t in analysis[b]['tools']:
        body = slice_u16(srcs[b], t['renderStart'], t['renderEnd'])
        # closure transitif atas nama top-level
        need = set()
        stack = list(t['refs'])
        # alias U: bila ada ref U.*, butuh 'U'
        if any(r.startswith('U.') for r in stack):
            stack.append('U')
        seen = set()
        while stack:
            r = stack.pop()
            if r in seen:
                continue
            seen.add(r)
            d = find_def(b, r)
            if d is None:
                continue  # global / dari core.js / lokal
            need.add(r)
            stack.extend(d['refs'])
        tools.append({'id': t['id'], 'name': t['name'], 'cat': t['cat'],
                      'icon': t['icon'], 'desc': t['desc'], 'batch': b,
                      'body': body, 'need': need,
                      'refs_direct': set(t['refs'])})

print(f'Total tools: {len(tools)}')
assert len(tools) == 100, 'harus 100 tools!'
assert len({t['id'] for t in tools}) == 100, 'ada id duplikat!'

# ---------- 3. Klasifikasi shared vs private ----------
users = {}  # (batch,name) -> set(tool id)
for t in tools:
    for n in t['need']:
        users.setdefault((t['batch'], n), set()).add(t['id'])

shared = {k for k, v in users.items() if len(v) > 1}
print(f'Shared ({len(shared)}):')
for k in sorted(shared):
    print(f'  {k[0]}:{k[1]} <- {sorted(users[k])}')

# ---------- 4. Sanity checks ----------
# 4a. shared tidak boleh mereferensikan private (kecuali esc/T/utils)
CORE_OK = {'esc', 'T', 'utils', 'tools'}
for (b, name) in shared:
    d = defs[(b, name)]
    for r in d['refs']:
        if r in ('U',) or r.startswith('U.') or r.startswith('utils.'):
            continue
        dd = find_def(b, r)
        if dd and (b, r) not in shared and r != name:
            # r adalah private tapi dipakai shared -> harusnya r ikut shared
            print(f'!! shared {name} butuh private {r}; promosikan ke shared')
            shared.add((b, r))
# ulangi sampai stabil (promosi bisa berantai)
changed = True
while changed:
    changed = False
    for (b, name) in list(shared):
        for r in defs[(b, name)]['refs']:
            if r in ('U',) or r.startswith('U.') or r.startswith('utils.'):
                continue
            if find_def(b, r) and (b, r) not in shared and r != name:
                shared.add((b, r)); changed = True

# 4b. tidak ada tabrakan nama dengan export core.js existing
core_src = open(os.path.join(JS, 'core.js'), encoding='utf-8').read()
core_exports = set(re.findall(r'^export (?:const|let|var|function|async function|class)\s+([a-zA-Z0-9_]+)', core_src, re.M))
core_exports |= set(re.findall(r'^\s{2}([a-zA-Z0-9_]+),?\s*$', core_src, re.M))  # isi object h (kasar)
clash = {n for (_, n) in shared if not n.startswith('utils.') and not n.startswith('U.')} & core_exports
# 'esc' memang sudah ada di core.js -> tool import dari sana, def 'esc' dibuang
print(f'Clash dengan core.js: {clash if clash else "tidak ada"}')

# ---------- 4c. Pertahankan keywords dari file tool existing ----------
# v5.2: keywords hidup di meta tiap file tool; generator wajib membawanya
# agar tidak hilang bila manifest/file di-regenerate.
kw_map = {}
_tools_dir = os.path.join(JS, 'tools')
if os.path.isdir(_tools_dir):
    for _cat in os.listdir(_tools_dir):
        _cdir = os.path.join(_tools_dir, _cat)
        if not os.path.isdir(_cdir):
            continue
        for _fn in os.listdir(_cdir):
            if not _fn.endswith('.js'):
                continue
            _src = open(os.path.join(_cdir, _fn), encoding='utf-8').read()
            _mm = re.search(r'^export const meta = (\{.*\});\s*$', _src, re.M)
            if _mm:
                try:
                    _old = json.loads(_mm.group(1))
                    if _old.get('keywords'):
                        kw_map[_old['id']] = _old['keywords']
                except Exception:
                    pass
print(f'keywords dipertahankan: {len(kw_map)} tool')

# ---------- 5. Tulis file tool ----------
out_dir = os.path.join(JS, 'tools')
if os.path.exists(out_dir):
    shutil.rmtree(out_dir)

manifest = []
for t in tools:
    cat_dir = os.path.join(out_dir, t['cat'])
    os.makedirs(cat_dir, exist_ok=True)
    path = os.path.join(cat_dir, t['id'] + '.js')

    # private defs untuk tool ini, urut sesuai urutan asli.
    # Dedup berdasarkan source: deklarasi multi-nama (const a={}, b={};)
    # tercatat sekali per nama oleh analyzer — emit sekali saja.
    seen_src = set()
    priv = []
    for d in sorted([defs[(t['batch'], n)] for n in t['need']
                     if (t['batch'], n) not in shared and n != 'esc'],
                    key=lambda d: d['order']):
        if d['source'] not in seen_src:
            seen_src.add(d['source'])
            priv.append(d)

    # import dari core.js: T, utils + shared yang dipakai tool ini
    core_imports = ['h as T', 'utils']
    for n in sorted(t['need']):
        if (t['batch'], n) in shared and not n.startswith('utils.') and not n.startswith('U.'):
            core_imports.append(n)
    if 'esc' in t['refs_direct'] or any('esc' in defs[(t['batch'], n)]['refs'] for n in t['need'] if (t['batch'], n) not in shared):
        # esc dipakai langsung di body atau di private def -> import dari core
        if 'esc' not in core_imports:
            core_imports.append('esc')

    # pastikan shared yang dibutuhkan ada di import (transitif via shared lain sudah di core.js)
    lines = []
    lines.append(f"import {{ {', '.join(core_imports)} }} from '../../core.js?v={VERSION}';")
    lines.append('')
    for d in priv:
        lines.append(d['source'])
        lines.append('')
    # meta + render
    meta = {'id': t['id'], 'name': t['name'], 'cat': t['cat'],
            'icon': t['icon'], 'desc': t['desc'],
            'keywords': kw_map.get(t['id'], '')}
    lines.append(f"export const meta = {json.dumps(meta, ensure_ascii=False)};")
    lines.append('')
    lines.append('export function render(root) {')
    lines.append(t['body'])
    lines.append('}')
    lines.append('')
    with open(path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))

    manifest.append({**meta, 'file': f"tools/{t['cat']}/{t['id']}.js"})

print(f'Tool files ditulis: {len(manifest)}')

# ---------- 6. Tambahkan shared ke core.js ----------
# 'esc' dikecualikan: core.js sudah punya `export function esc`, dan def
# `const esc = T.esc` di batch hanyalah alias -> duplikat bila di-append.
shared_sorted = sorted([defs[k] for k in shared if defs[k]['name'] != 'esc'],
                       key=lambda d: d['order'])
with open(os.path.join(JS, 'core.js'), encoding='utf-8') as f:
    core_old = f.read()

add = []
add.append('')
add.append('/* ================= FASE 2: shared helpers (dipakai >1 tool) =================')
add.append('   Dipindah otomatis dari tools-*.js oleh scripts/split-tools.py. Jangan edit manual;')
add.append('   edit di file tool asalnya lalu jalankan ulang generator bila perlu. */')
add.append('const T = h; // alias untuk helper pindahan yang memakai T.*')
_seen_shared = set()
for d in shared_sorted:
    if d['source'] in _seen_shared:
        continue
    _seen_shared.add(d['source'])
    src = d['source']
    # utils.X = ... / U.X = ... : biarkan (registrasi ke objek utils)
    # function/const biasa -> export agar bisa di-import tool
    if d['name'].startswith('utils.') or d['name'].startswith('U.'):
        add.append(src)
    else:
        # tambahkan 'export ' di depan (function X / const X)
        src2 = re.sub(r'^(function|const|let|var)\b', r'export \1', src, count=1)
        add.append(src2)
    add.append('')

with open(os.path.join(JS, 'core.js'), 'w', encoding='utf-8') as f:
    f.write(core_old.rstrip('\n') + '\n' + '\n'.join(add))

print(f'Shared ditambahkan ke core.js: {len(shared_sorted)}')

# ---------- 7. manifest.js ----------
manifest_sorted = sorted(manifest, key=lambda m: (m['cat'], m['id']))
with open(os.path.join(JS, 'manifest.js'), 'w', encoding='utf-8') as f:
    f.write(f"/* ADIP Tools v{VERSION} — manifest metadata (GENERATED, jangan edit manual).\n")
    f.write("   Dibangkitkan oleh scripts/split-tools.py dari folder tools per kategori.\n")
    f.write("   Berisi metadata ringan untuk home/search/palette; kode tool di-load on-demand.\n")
    f.write("*/\n")
    f.write(f"export const VERSION = '{VERSION}';\n")
    f.write("export const manifest = [\n")
    for m in manifest_sorted:
        f.write(f"  {json.dumps(m, ensure_ascii=False)},\n")
    f.write("];\n")
print(f'manifest.js ditulis: {len(manifest_sorted)} entri')

# ---------- 8. Simpan salinan generator + analisis ----------
os.makedirs(os.path.join(ROOT, 'scripts'), exist_ok=True)
shutil.copy('/tmp/split/analyzer.js', os.path.join(ROOT, 'scripts', 'analyze-tools.js'))
shutil.copy(__file__, os.path.join(ROOT, 'scripts', 'split-tools.py'))
print('DONE')
