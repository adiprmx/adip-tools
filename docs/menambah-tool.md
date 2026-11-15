# Menambah Tool Baru

Panduan ini untuk yang mau menambah satu tool ke Adip Tools. Gambaran umum proyek ada di [README.md](../README.md); arsitektur di [arsitektur.md](arsitektur.md).

## Aturan dasar

1. **Satu tool = satu file** di `js/tools/<kategori>/<id>.js`.
2. **`id` = nama file** tanpa `.js`, dan **`cat` = nama folder**. `sync-manifest.js` menolak kalau tidak cocok.
3. **Tool dilarang mengimpor tool lain.** Fungsi bersama taruh di `js/core.js`.
4. **Semua teks pengguna berbahasa Indonesia sehari-hari**, tanpa istilah teknis. Semua angka yang tampil harus hasil hitungan/data nyata — dilarang angka contoh yang seolah nyata.
5. **Escape semua input pengguna** sebelum dimasukkan ke HTML (`T.esc(...)`).

## Langkah-langkah

### 1. Pilih kategori

15 kategori yang ada (folder di `js/tools/`): `bisnis`, `converter`, `desain`, `developer`, `fakesos`, `fun`, `gambar`, `indonesia`, `keamanan`, `liveapi`, `musik`, `pelajar`, `produktivitas`, `sehari`, `teks`.

Kategori baru butuh perubahan di tiga tempat sekaligus (label di `js/app.js` `CATS`, label di `scripts/gen-tools-md.py` `CAT_LABEL`, ikon di `js/app.js` `CAT_ICON`) — jadi sebisa mungkin pakai kategori yang ada.

### 2. Buat file tool

Template minimal (contoh nyata: `js/tools/teks/balik-teks.js`):

```js
import { h as T, utils } from '../../core.js?v=6.12.0';

export const meta = {
  id: "hitung-ongkir-contoh",
  name: "Hitung Ongkir",
  cat: "sehari",
  icon: "📦",
  desc: "Perkiraan ongkir dari berat paket dan jarak.",
  keywords: "ongkir,ekspedisi,paket,berat,jarak",
  since: "6.12.0",
};

export function render(root, onLeave, T, m) {
  const inp = T.input('number', 'Berat paket (kg)');
  const box = T.out();
  const btn = T.btn('Hitung', () => {
    const kg = T.num(inp.value);
    if (!(kg > 0)) { T.toast('Isi berat paket dulu'); return; }
    T.show(box, '<p class="big">' + T.esc('Rp ' + (kg * 10000)) + '</p>');
  }, true);
  root.append(T.field('Berat paket', inp), btn, box);
}
```

Catatan template:

- **`?v=6.12.0` di import core.js wajib ada** dan harus sama dengan versi saat ini — ini cache-buster. `bump-version.py` menyapunya otomatis saat bump versi, jadi pakai versi yang sedang berlaku saat menulis file.
- **`since`** (opsional): isi dengan versi saat tool ditambahkan. Tool dengan `since` sama dengan versi berjalan mendapat badge "BARU" di beranda.
- **`keywords`**: kata kunci pencarian, pisahkan koma. Pengguna mencari dengan kata sehari-hari, jadi tulis sinonimnya juga.
- **`render(root, onLeave, T, m)`**: `root` elemen wadah, `onLeave` untuk mendaftarkan fungsi bersih-bersih saat pengguna pindah halaman (hentikan timer, tutup stream, revoke URL objek), `T` namespace helper, `m` entri manifest tool ini.

### 3. Helper yang tersedia (`T`, dari `js/core.js`)

| Helper | Guna |
|---|---|
| `T.el(html)`, `T.esc(s)` | Buat elemen dari HTML; escape teks pengguna |
| `T.btn(label, onClick, primary)` | Tombol (`primary=true` = tombol utama) |
| `T.input(type, placeholder, value)` | Input teks/angka/tanggal |
| `T.select(pairs, value)` | Dropdown dari pasangan `[value, label]` |
| `T.ta(rows, placeholder, value)` | Textarea |
| `T.field(label, inputEl, hint)` | Bungkus input + label + petunjuk |
| `T.out()`, `T.show(box, html)`, `T.hide(box)` | Kotak hasil (tersembunyi sampai ada hasil) |
| `T.copy(text)`, `T.copyBtn(text)` | Salin ke clipboard |
| `T.dl(nama, isi, mime)`, `T.dlBtn(...)` | Unduh file hasil |
| `T.toast(pesan)` | Notifikasi singkat |
| `T.fmt(n)`, `T.rp(n)`, `T.num(v)` | Format angka Indonesia, Rupiah, parsing angka |
| `T.row(...)`, `T.grid2(...)` | Layout baris / dua kolom |
| `T.calcResult(o)`, `T.nextSteps(items)` | Pola kartu hasil + langkah berikutnya |
| `T.zipFiles(files)`, `T.dlZip(...)`, `T.zipBtn(...)` | Unduh banyak file sebagai ZIP |
| `T.onLeave(fn)` | Daftarkan bersih-bersih saat halaman ditinggalkan |

Helper lain yang sering dipakai (impor langsung dari `core.js`): `utils` (tempat fungsi hitung bersama, mis. `utils.bmi`), `kv(k, v)` (baris kunci-nilai), `LOCAL_NOTE` (teks standar "Semua diproses 100% lokal…").

Lihat daftar lengkap di `export const h` (`js/core.js`, sekitar baris 272) dan contoh pemakaian di tool yang sudah ada.

### 4. Pola yang wajib diikuti

- **Hasil muncul setelah aksi** (tombol "Hitung"/"Buat"), atau otomatis saat mengetik untuk tool teks sederhana. Kotak hasil (`T.out()`) tersembunyi sampai ada hasil.
- **Validasi input di depan**: angka harus `> 0`, teks tidak boleh kosong. Pesan error memakai `T.toast(...)` dengan bahasa biasa ("Isi berat paket dulu"), bukan kode error.
- **Tool yang memproses file** (gambar, PDF, video): proses 100% di browser, tampilkan `LOCAL_NOTE`, dan jangan pernah mengirim file ke server mana pun.
- **Tool Live API** (kategori `liveapi`): `fetch()` ke API publik langsung dari browser, pakai timeout, dan tampilkan pesan gagal yang jelas kalau API tidak bisa dijangkau. Jangan pernah menaruh API key di kode.
- **Tool video/audio** (ffmpeg): jangan mengimpor ffmpeg langsung — pakai `js/ffmpeg-loader.js` (`loadFFmpeg()`), yang sudah menangani CDN, worker same-origin, dan cache instance. Contoh: `js/tools/converter/video-ke-mp3.js`.
- **Bersihkan sumber daya** lewat `onLeave`: `setInterval`, `MediaStream`, `AudioContext`, `URL.createObjectURL` wajib dilepas saat pengguna pindah halaman.

### 5. Regenerasi manifest + daftar tool

```bash
node scripts/sync-manifest.js <versi-saat-ini>   # js/manifest.js
python3 scripts/gen-tools-md.py                  # TOOLS.md
```

Jangan edit `js/manifest.js` atau `TOOLS.md` manual — keduanya file generate. `sync-manifest.js` mengimpor **semua** file tool, jadi error sintaks di satu file akan menggagalkan seluruh proses (itu sengaja: penanda dini).

### 6. Validasi

```bash
node scripts/check-tools.js
```

Yang dicek: tiap entri manifest punya file, tiap file ada di manifest (tidak ada file yatim), tiap file mengekspor `{ meta, render }`, dan semua import statis bisa di-resolve. Wajib lolos sebelum commit/push.

Lalu uji manual di browser lokal: buka `#/t/<id-tool>`, cek tampilannya di lebar HP (360px), isi input aneh (kosong, nol, negatif, teks di kolom angka), dan pastikan tidak ada error di console.

## Checklist sebelum selesai

- [ ] File di `js/tools/<kategori>/<id>.js`, `meta.id` = nama file, `meta.cat` = folder
- [ ] Import core.js memakai `?v=<versi-saat-ini>`
- [ ] `meta` lengkap: id, name, cat, icon, desc, keywords (+ `since` untuk tool baru)
- [ ] Input pengguna di-escape (`T.esc`) sebelum masuk HTML
- [ ] Copy Indonesia sehari-hari, tanpa istilah teknis, tanpa angka karangan
- [ ] Timer/stream/object URL dibersihkan lewat `onLeave`
- [ ] `sync-manifest.js` + `gen-tools-md.py` sudah dijalankan
- [ ] `check-tools.js` lolos
- [ ] Diuji manual di browser (HP 360px + desktop)
