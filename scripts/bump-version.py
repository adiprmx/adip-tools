#!/usr/bin/env python3
"""Bump versi Adip Tools dalam satu perintah (prosedur gap 6, anti-terlewat).

Pemakaian: python3 scripts/bump-version.py <versi-baru> [--dry-run]
  --dry-run : hanya mencetak rencana, tidak mengubah file apa pun.

Langkah (berurutan):
  (a) validasi format versi X.Y.Z
  (b) ubah VERSION di scripts/split-tools.py
  (c) regenerate manifest: node scripts/sync-manifest.js <versi-baru>
  (d) sapu SEMUA ?v=<angka> -> ?v=<versi-baru> di js/tools/**/*.js (rekursif),
      js/*.js tingkat atas, js/ffmpeg-worker/*.js, index.html, dan js/app.js
      (app.js ikut: baris 27-28 meng-hardcode ?v=VERSION; tanpa ini
      check-tools.js gagal pasca-bump). Pola non-angka seperti
      '?v=' + VERSION (app.js:883) dan 'watch?v=' tidak tersentuh.
      Penyapuan dilakukan di level byte (bukan teks): file tool ada yang
      mengandung byte NUL (markdown-preview.js) dan read teks dengan
      errors='replace' akan merusak byte non-UTF-8 secara diam-diam.
  (e) regenerate TOOLS.md + sitemap.xml + llms.txt (ketiganya membaca
      manifest.js hasil langkah (c); llms.txt memuat nomor versi, sitemap
      memuat satu URL per tool — tanpa langkah ini keduanya basi tiap rilis)
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
# Pola byte: penyapuan ?v= dilakukan pada byte mentah agar isi file lain
# (termasuk byte NUL / non-UTF-8) tidak pernah diubah (T05, 15 Nov 2026).
QV_RE = re.compile(rb'\?v=\d+\.\d+\.\d+')


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
    # Rekursif: glob satu level (js/tools/*/*.js) akan melewatkan ?v= bila
    # suatu hari muncul subfolder bersarang di js/tools (T05, 15 Nov 2026).
    files = sorted(glob.glob(os.path.join(ROOT, 'js', 'tools', '**', '*.js'),
                             recursive=True))
    # File .js tingkat atas + worker: sebelumnya tidak disapu sama sekali,
    # jadi ?v= di core.js/fx.js/ffmpeg-loader.js tidak akan pernah ter-bump
    # (dan tidak terdeteksi check-tools sebelum perbaikan yang sama di sana).
    files += sorted(glob.glob(os.path.join(ROOT, 'js', '*.js')))
    files += sorted(glob.glob(os.path.join(ROOT, 'js', 'ffmpeg-worker', '*.js')))
    files += [os.path.join(ROOT, 'index.html')]
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

    # (d) sapu ?v= di tool + js tingkat atas + index.html (level byte:
    # baca/tulis biner agar byte non-UTF-8/NUL tidak rusak — sebelumnya
    # read teks errors='replace' + write teks bisa merusak file diam-diam)
    changed, hits = 0, 0
    by_version = {}
    new_qv = f'?v={new}'.encode('ascii')
    for f in sweep_targets():
        raw = open(f, 'rb').read()
        found = QV_RE.findall(raw)
        if not found:
            continue
        for v in found:
            key = v.decode('ascii')
            by_version[key] = by_version.get(key, 0) + 1
        hits += len(found)
        changed += 1
        if not dry:
            open(f, 'wb').write(QV_RE.sub(new_qv, raw))
    found_txt = (', '.join(f'{v} x{n}' for v, n in sorted(by_version.items()))
                 if by_version else 'tidak ada ?v= ditemukan')
    print(f'(d) sapu ?v=: {hits} kemunculan di {changed} file '
          f'-> ?v={new} (ditemukan: {found_txt})')

    # (e) regenerate TOOLS.md + sitemap.xml + llms.txt — ketiganya membaca
    # manifest.js hasil langkah (c). Generator sitemap/llms milik T03, di sini
    # hanya dipanggil; sebelumnya bump tidak memanggil keduanya sehingga
    # llms.txt (memuat nomor versi) dan sitemap.xml (satu URL per tool)
    # basi tiap rilis yang menambah tool (T05, 15 Nov 2026).
    print('(e) regenerate TOOLS.md + sitemap.xml + llms.txt:')
    run(['python3', 'scripts/gen-tools-md.py'], dry)
    run(['node', 'scripts/gen-sitemap.js'], dry)
    run(['node', 'scripts/gen-llms-txt.js'], dry)

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
