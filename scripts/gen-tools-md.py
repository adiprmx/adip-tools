#!/usr/bin/env python3
"""Bangkitkan TOOLS.md dari js/manifest.js (sumber kebenaran tunggal).

Jalankan: python3 scripts/gen-tools-md.py
Idempotent: output deterministik (kategori urut jumlah desc, tool urut id).
Jangan edit TOOLS.md manual — edit meta tool lalu regenerate manifest + file ini.
"""
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MANIFEST = os.path.join(ROOT, 'js', 'manifest.js')
OUT = os.path.join(ROOT, 'TOOLS.md')

# Nama tampil kategori (slug manifest -> label). Slug baru jatuh ke title-case.
CAT_LABEL = {
    'bisnis': 'Bisnis', 'converter': 'Converter', 'desain': 'Desain',
    'developer': 'Developer', 'fakesos': 'Fake Sosmed', 'fun': 'Fun & Hiburan',
    'gambar': 'Gambar', 'indonesia': 'Indonesia', 'keamanan': 'Keamanan',
    'liveapi': 'Live API', 'musik': 'Musik', 'pelajar': 'Pelajar',
    'produktivitas': 'Produktivitas', 'sehari': 'Sehari-hari', 'teks': 'Teks',
}


def main():
    src = open(MANIFEST, encoding='utf-8').read()
    m = re.search(r"export const VERSION = '([^']+)'", src)
    version = m.group(1) if m else '?'
    entries = []
    for line in src.splitlines():
        line = line.strip()
        if line.startswith('{"id":'):
            entries.append(json.loads(line.rstrip(',')))
    cats = {}
    for e in entries:
        cats.setdefault(e['cat'], []).append(e)
    for tools in cats.values():
        tools.sort(key=lambda t: t['id'])
    # Kategori urut jumlah terbanyak dulu, seri -> alfabetis.
    order = sorted(cats, key=lambda c: (-len(cats[c]), c))

    out = [f'# Daftar Tools Adip Tools\n',
           f'> {len(entries)} tool · v{version} · '
           'dibuat otomatis dari js/manifest.js — jangan edit manual.\n',
           '## Ringkasan kategori\n',
           '| Kategori | Jumlah |',
           '|---|---|']
    for c in order:
        label = CAT_LABEL.get(c, c.replace('-', ' ').title())
        out.append(f'| {label} | {len(cats[c])} |')
    out.append(f'| **Total** | **{len(entries)}** |')
    for c in order:
        label = CAT_LABEL.get(c, c.replace('-', ' ').title())
        out.append(f'\n## {label} ({len(cats[c])})\n')
        for i, t in enumerate(cats[c], 1):
            desc = (t.get('desc') or '').strip()
            out.append(f'{i}. **{t["name"]}** — {desc}' if desc
                       else f'{i}. **{t["name"]}**')
    out.append('\n## Cara menambah tool\n')
    out.append('1. Tambah file `js/tools/<kategori>/<id>.js` dengan '
               '`export const meta = { id, name, cat, icon, desc, keywords }` '
               'dan `export function render(...)`.')
    out.append('2. Regenerate manifest: `node scripts/sync-manifest.js <versi>`.')
    out.append('3. Regenerate daftar ini: `python3 scripts/gen-tools-md.py`.')
    out.append('4. Cek konsistensi: `node scripts/check-tools.js`.')
    out.append('')
    open(OUT, 'w', encoding='utf-8').write('\n'.join(out))
    print(f'TOOLS.md ditulis: {len(entries)} tool, {len(cats)} kategori, v{version}')


if __name__ == '__main__':
    main()
