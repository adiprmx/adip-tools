#!/usr/bin/env python3
"""Bump versi Adip Tools dalam satu perintah (prosedur gap 6, anti-terlewat).

Pemakaian: python3 scripts/bump-version.py <versi-baru> [--dry-run]
  --dry-run : hanya mencetak rencana, tidak mengubah file apa pun.

Langkah (berurutan):
  (a) validasi format versi X.Y.Z
  (b) ASSERT: TIDAK BOLEH ada ?v=<angka> tersisa di js/tools/**/*.js
      (rekursif), js/*.js tingkat atas, js/ffmpeg-worker/*.js, dan
      index.html. Sistem cache-buster ?v= DICABUT di v6.14.0 (diganti
      hash nama file Vite); kemunculan ?v= berarti ada file yang belum
      dimigrasi atau generator yang regresi -> bump GAGAL. Dulu langkah
      ini MENYAPU ?v= lama ke versi baru (langkah (d) di skrip lama);
      penyapuan itu sudah tidak ada artinya karena tidak ada lagi ?v=
      manual di repo. Assert ini sengaja jalan SEBELUM mutasi apa pun
      (naik dari (d) ke (b) di v6.14.0) supaya kegagalan tidak
      meninggalkan workdir setengah ter-bump (split-tools.py sudah
      berubah tapi bump gagal -> jalankan ulang akan error "versi
      sudah X").
      Pemindaian dilakukan di level byte (bukan teks): file tool ada yang
      mengandung byte NUL (markdown-preview.js) dan read teks dengan
      errors='replace' akan merusak byte non-UTF-8 secara diam-diam.
  (c) ubah VERSION di scripts/split-tools.py
  (d) regenerate manifest: node scripts/sync-manifest.js <versi-baru>
  (e) regenerate TOOLS.md + sitemap.xml + llms.txt (ketiganya membaca
      manifest.js hasil langkah (d); llms.txt memuat nomor versi, sitemap
      memuat satu URL per tool — tanpa langkah ini keduanya basi tiap
      rilis). Sejak v6.14.0 (P0-A) sitemap.xml + llms.txt ditulis ke
      public/ (bukan root) — generatornya sudah disesuaikan, di sini
      hanya dipanggil.
  (f) GERBANG RILIS (baru, v6.14.0 — P0-B): npm run check + npm run build
      + verifikasi manifest build. Jumlah entri js/tools/* di
      dist/.vite/manifest.json HARUS sama dengan jumlah entri
      js/manifest.js (1.261 saat ini; angka harapan diambil dari manifest,
      bukan hardcode, supaya tetap benar saat tool bertambah).
      Gerbang ini gagal -> bump GAGAL, jangan commit/push.
  (g) ringkasan
"""
import glob
import json
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCRIPTS = os.path.join(ROOT, 'scripts')
VERSION_RE = re.compile(r'^\d+\.\d+\.\d+$')
# Pola byte: pemindaian ?v= dilakukan pada byte mentah agar isi file lain
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


def assert_no_qv():
    """(b) Gagal bila ada ?v=x.y.z tersisa di mana pun (level byte)."""
    by_version = {}
    for f in sweep_targets():
        raw = open(f, 'rb').read()
        for v in QV_RE.findall(raw):
            key = v.decode('ascii')
            e = by_version.setdefault(key, {'count': 0, 'files': set()})
            e['count'] += 1
            e['files'].add(os.path.relpath(f, ROOT))
    if by_version:
        detail = '; '.join(
            f"{v} ({e['count']}x, cth: {', '.join(sorted(e['files'])[:3])})"
            for v, e in sorted(by_version.items()))
        fail(f'(b) ?v= TERSISA — sistem ?v= dicabut v6.14.0, hapus dulu '
             f'sebelum bump: {detail}')
    print('(b) assert ?v=: tidak ada ?v= tersisa (sistem hash Vite aktif)')


def count_manifest_entries():
    """Jumlah entri js/manifest.js, dihitung via Node (manifest.js ESM)."""
    js = ("(async () => { const { manifest } = await import('./js/manifest.js');"
          " console.log(manifest.length); })()")
    r = subprocess.run(['node', '-e', js], cwd=ROOT, capture_output=True,
                       text=True)
    if r.returncode:
        fail('tidak bisa membaca js/manifest.js: ' + (r.stderr or '').strip())
    return int(r.stdout.strip())


def verify_build_manifest():
    """dist/.vite/manifest.json harus memuat SEMUA tool dari manifest.js."""
    dist_manifest = os.path.join(ROOT, 'dist', '.vite', 'manifest.json')
    if not os.path.exists(dist_manifest):
        fail('dist/.vite/manifest.json tidak ada — npm run build gagal '
             'atau vite.config.mjs kehilangan "manifest: true"')
    with open(dist_manifest, encoding='utf-8') as fh:
        build = json.load(fh)
    found = sum(1 for k in build if k.startswith('js/tools/'))
    expected = count_manifest_entries()
    if found != expected:
        fail(f'manifest build: {found} tool, harus {expected} '
             f'(js/manifest.js) — ada tool yang tidak masuk build atau '
             f'file yatim di js/tools/')
    print(f'  manifest build OK: {found}/{expected} tool terpetakan')


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    dry = '--dry-run' in sys.argv[1:]
    if len(args) != 1:
        fail('pemakaian: python3 scripts/bump-version.py <versi-baru> [--dry-run]')
    new = args[0]
    if not VERSION_RE.match(new):
        fail(f'versi "{new}" tidak valid — format wajib X.Y.Z (cth: 6.10.0)')
    print(f'Bump versi -> {new}' + (' [DRY-RUN: tidak ada file yang diubah]' if dry else ''))

    # (b) ASSERT tidak ada ?v= tersisa — SEBELUM mutasi apa pun, supaya
    # kegagalan tidak meninggalkan workdir setengah ter-bump.
    assert_no_qv()

    # (c) VERSION di split-tools.py
    split_py = os.path.join(SCRIPTS, 'split-tools.py')
    src = open(split_py, encoding='utf-8').read()
    m = re.search(r"^VERSION = '([^']+)'", src, re.M)
    if not m:
        fail('baris VERSION tidak ditemukan di scripts/split-tools.py')
    old = m.group(1)
    if old == new:
        fail(f'versi sudah {new} — tidak ada yang di-bump')
    print(f"(c) scripts/split-tools.py: VERSION '{old}' -> '{new}'")
    if not dry:
        open(split_py, 'w', encoding='utf-8').write(
            src.replace(f"VERSION = '{old}'", f"VERSION = '{new}'", 1))

    # (d) regenerate manifest (ikut menulis VERSION baru ke js/manifest.js)
    print('(d) regenerate manifest:')
    run(['node', 'scripts/sync-manifest.js', new], dry)

    # (e) regenerate TOOLS.md + sitemap.xml + llms.txt — ketiganya membaca
    # manifest.js hasil langkah (d). Generator sitemap/llms milik T03, di sini
    # hanya dipanggil; sejak v6.14.0 keduanya menulis ke public/.
    print('(e) regenerate TOOLS.md + sitemap.xml + llms.txt:')
    run(['python3', 'scripts/gen-tools-md.py'], dry)
    run(['node', 'scripts/gen-sitemap.js'], dry)
    run(['node', 'scripts/gen-llms-txt.js'], dry)

    # (f) GERBANG RILIS: check-tools + build Vite + verifikasi manifest build.
    print('(f) gerbang rilis: npm run check + npm run build + verifikasi manifest build:')
    run(['npm', 'run', 'check'], dry)
    run(['npm', 'run', 'build'], dry)
    if dry:
        print('  [DRY-RUN] verifikasi manifest build dilewati (tidak ada build)')
    else:
        verify_build_manifest()

    # (g) ringkasan
    print(f'\n{"[DRY-RUN] Rencana selesai" if dry else "Selesai"}: '
          f'{old} -> {new}')
    if not dry:
        print('Semua gerbang lolos (check-tools + build + manifest build). '
              'Siap commit/push.')
    else:
        print('Tidak ada file yang diubah. Jalankan tanpa --dry-run untuk '
              'mengeksekusi.')


if __name__ == '__main__':
    main()
