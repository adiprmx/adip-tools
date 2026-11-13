#!/usr/bin/env python3
"""Bump versi Adip Tools dalam satu perintah (prosedur gap 6, anti-terlewat).

Pemakaian: python3 scripts/bump-version.py <versi-baru> [--dry-run]
  --dry-run : hanya mencetak rencana, tidak mengubah file apa pun.

Langkah (berurutan):
  (a) validasi format versi X.Y.Z
  (b) ubah VERSION di scripts/split-tools.py
  (c) regenerate manifest: node scripts/sync-manifest.js <versi-baru>
  (d) sapu SEMUA ?v=<angka> -> ?v=<versi-baru> di js/tools/*/*.js, index.html,
      dan js/app.js (app.js ikut: baris 21-22 meng-hardcode ?v=VERSION; tanpa
      ini check-tools.js gagal pasca-bump). Pola non-angka seperti
      '?v=' + VERSION (app.js:626) dan 'watch?v=' tidak tersentuh.
  (e) regenerate TOOLS.md: python3 scripts/gen-tools-md.py
  (f) ringkasan + pengingat menjalankan node scripts/check-tools.js
"""
import glob
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCRIPTS = os.path.join(ROOT, 'scripts')
VERSION_RE = re.compile(r'^\d+\.\d+\.\d+$')
QV_RE = re.compile(r'\?v=\d+\.\d+\.\d+')


def fail(msg):
    print('ERROR: ' + msg, file=sys.stderr)
    sys.exit(1)


def run(cmd, dry):
    print('  $ ' + ' '.join(cmd))
    if dry:
        return
    r = subprocess.run(cmd, cwd=ROOT)
    if r.returncode:
        fail(f'perintah gagal (exit {r.returncode}): {" ".join(cmd)}')


def sweep_targets():
    files = sorted(glob.glob(os.path.join(ROOT, 'js', 'tools', '*', '*.js')))
    files += [os.path.join(ROOT, 'index.html'),
              os.path.join(ROOT, 'js', 'app.js')]
    return files


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    dry = '--dry-run' in sys.argv[1:]
    if len(args) != 1:
        fail('pemakaian: python3 scripts/bump-version.py <versi-baru> [--dry-run]')
    new = args[0]
    if not VERSION_RE.match(new):
        fail(f'versi "{new}" tidak valid — format wajib X.Y.Z (cth: 6.10.0)')
    print(f'Bump versi -> {new}' + (' [DRY-RUN: tidak ada file yang diubah]' if dry else ''))

    # (b) VERSION di split-tools.py
    split_py = os.path.join(SCRIPTS, 'split-tools.py')
    src = open(split_py, encoding='utf-8').read()
    m = re.search(r"^VERSION = '([^']+)'", src, re.M)
    if not m:
        fail('baris VERSION tidak ditemukan di scripts/split-tools.py')
    old = m.group(1)
    if old == new:
        fail(f'versi sudah {new} — tidak ada yang di-bump')
    print(f"(b) scripts/split-tools.py: VERSION '{old}' -> '{new}'")
    if not dry:
        open(split_py, 'w', encoding='utf-8').write(
            src.replace(f"VERSION = '{old}'", f"VERSION = '{new}'", 1))

    # (c) regenerate manifest (ikut menulis VERSION baru ke js/manifest.js)
    print('(c) regenerate manifest:')
    run(['node', 'scripts/sync-manifest.js', new], dry)

    # (d) sapu ?v= di tool + index.html + app.js
    changed, hits = 0, 0
    by_version = {}
    for f in sweep_targets():
        text = open(f, encoding='utf-8', errors='replace').read()
        found = QV_RE.findall(text)
        if not found:
            continue
        for v in found:
            by_version[v] = by_version.get(v, 0) + 1
        hits += len(found)
        changed += 1
        if not dry:
            open(f, 'w', encoding='utf-8').write(QV_RE.sub(f'?v={new}', text))
    print(f'(d) sapu ?v=: {hits} kemunculan di {changed} file '
          f'-> ?v={new} (ditemukan: ' +
          ', '.join(f'{v} x{n}' for v, n in sorted(by_version.items())) + ')')

    # (e) regenerate TOOLS.md
    print('(e) regenerate TOOLS.md:')
    run(['python3', 'scripts/gen-tools-md.py'], dry)

    # (f) ringkasan
    print(f'\n{"[DRY-RUN] Rencana selesai" if dry else "Selesai"}: '
          f'{old} -> {new}')
    if not dry:
        print('Langkah berikut: node scripts/check-tools.js  (wajib lolos '
              'sebelum commit/push)')
    else:
        print('Tidak ada file yang diubah. Jalankan tanpa --dry-run untuk '
              'mengeksekusi.')


if __name__ == '__main__':
    main()
