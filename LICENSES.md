# Lisensi Pihak Ketiga (Adip Tools)

**Versi situs: 6.12.0** · **Disusun: 15 November 2026** · **Sumber verifikasi: metadata resmi registry npm (registry.npmjs.org) per paket dan versi yang dipakai, plus README upstream untuk paket yang metadatanya tidak menyebut lisensi.**

Semua lisensi di bawah ini diverifikasi satu per satu pada tanggal di atas — bukan dari hafalan. Bila versi library di-upgrade, lisensi wajib dicek ulang.

## Kode Adip Tools sendiri

Kode situs ini (HTML, CSS, dan JavaScript di repo ini, termasuk 1.262 tool) **belum punya file LICENSE**. Artinya: hak cipta atas kode tersebut tetap pada pemiliknya dan tidak ada izin penggunaan yang dinyatakan secara tertulis. Bila pemilik ingin kode ini dipakai ulang orang lain, tambahkan file `LICENSE` di root repo (misalnya MIT atau Apache-2.0).

## FFmpeg / ffmpeg.wasm

Dipakai tool video & audio (konversi, kompres, potong, ekstrak audio). Loader: `js/ffmpeg-loader.js`.

| Komponen | Versi | Lisensi | Cara dipakai |
|---|---|---|---|
| `@ffmpeg/ffmpeg` (wrapper JS) | 0.12.15 | **MIT** | Dimuat saat runtime dari CDN jsDelivr (`cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.15/dist/esm/index.js`) — tidak di-vendor |
| `@ffmpeg/core` (mesin FFmpeg WebAssembly, ~31 MB) | 0.12.10 | **GPL-2.0-or-later** | Dimuat saat runtime dari CDN jsDelivr (`@ffmpeg/core@0.12.10/dist/esm/ffmpeg-core.js` + `ffmpeg-core.wasm`) — tidak di-vendor |
| File worker ESM di-vendor: `js/ffmpeg-worker/worker.js`, `js/ffmpeg-worker/const.js`, `js/ffmpeg-worker/errors.js` | salinan persis dari `@ffmpeg/ffmpeg@0.12.15` dist/esm | **MIT** (ffmpeg.wasm) | Di-vendor same-origin karena Worker lintas-origin ditolak browser; header tiap file sudah mencantumkan sumber CDN-nya |

**Catatan GPL:** `@ffmpeg/core` 0.12.10 adalah build FFmpeg yang menyertakan encoder berlisensi GPL (antara lain `libx264` dan `libmp3lame` — lihat daftar encoder di header `js/ffmpeg-loader.js`), sehingga paket ini berlisensi GPL-2.0-or-later menurut metadata npm resminya. Core dimuat dari CDN saat runtime dan tidak di-vendor ke repo ini; kewajiban GPL (misalnya penyediaan kode sumber terkait) berlaku sesuai ketentuan lisensinya — situs ini hanya menautkan ke build upstream yang sudah diterbitkan.

## @imgly/background-removal — AGPL-3.0 (PENTING)

| Komponen | Versi | Lisensi | Cara dipakai |
|---|---|---|---|
| `@imgly/background-removal` | 1.7.0 | **AGPL-3.0** | Dimuat saat runtime dari jsDelivr (`@imgly/background-removal@1.7.0/+esm`, cadangan esm.sh) oleh `imglyRemoval()` di `js/core.js`; dipakai tool Hapus Background & Nexora AutoCut |
| Model AI + file WASM | 1.7.0 | AGPL-3.0 (bagian dari proyek yang sama) | Diunduh dari `staticimgly.com/@imgly/background-removal-data/1.7.0/dist/` saat tool dipakai |
| `onnxruntime-web` (peer dependency, mesin inferensi ONNX) | 1.21.0 | **MIT** | Ikut dimuat sebagai dependensi runtime |

**Dua hal yang wajib diketahui:**

1. Metadata npm paket ini hanya menulis `"license": "SEE LICENSE IN LICENSE.md"`. Isi `LICENSE.md` dan README upstream (github.com/imgly/background-removal-js) menyatakan software ini **gratis di bawah lisensi AGPL** — AGPL-3.0. Ini bukan MIT.
2. **Komentar di `js/core.js` (~baris 1122) saat ini salah menulis "(MIT, …)" untuk paket ini.** Komentar itu perlu dikoreksi (di luar kewenangan dokumen ini — file ini hanya membuat daftar baru, tidak mengedit file lama). AGPL-3.0 punya kewajiban copyleft jaringan (pasal 13): bila software AGPL dipakai untuk melayani pengunjung lewat jaringan, kode sumber yang bersangkutan wajib tersedia bagi pengunjung. IMG.LY juga menawarkan lisensi komersial (support@img.ly) sebagai alternatif. Keputusan soal ini ada di pemilik situs.

## Puter.js SDK

| Komponen | Versi | Lisensi | Cara dipakai |
|---|---|---|---|
| Puter.js SDK (`js.puter.com/v2/`) | v2 (jalur unversioned) | **Apache-2.0** | Dimuat saat runtime dari `https://js.puter.com/v2/` oleh tool AI Image (dan utilitas Puter di `js/core.js`) |

Pernyataan lisensi resmi dari README repo HeyPuter/puter: *"This repository is licensed under AGPL-3.0; However, our SDK (puter.js) is also available under Apache 2.0, as indicated by the license file in that section (packages/puter-js) of this repository."* Jadi: platform Puter = AGPL-3.0, SDK Puter.js yang dipakai situs ini = Apache-2.0.

## Library lain via CDN

Semua library di bawah ini dimuat saat runtime dari CDN (jsDelivr, cdnjs, unpkg, atau esm.sh) hanya saat tool yang membutuhkannya dibuka — tidak ada yang di-vendor ke repo ini, kecuali file worker ffmpeg di atas. Lisensi diverifikasi dari metadata npm resmi per versi yang dipakai.

| Library | Versi dipakai | Lisensi | Dipakai untuk |
|---|---|---|---|
| pdf-lib | 1.17.1 | MIT | Edit/gabung PDF (PDF Lab, dll.) |
| pdfjs-dist (Mozilla PDF.js) | 3.11.174 | Apache-2.0 | Baca/render PDF |
| jspdf | 2.5.1 | MIT | Buat PDF (CV, struk, dll.) |
| html2canvas | 1.4.1 | MIT | Tangkap elemen halaman jadi gambar |
| qrcode | 1.4.4 | MIT | Buat kode QR |
| jsbarcode | 3.11.6 | MIT | Buat barcode |
| jsQR | 1.4.0 | Apache-2.0 | Baca kode QR dari gambar/kamera |
| jszip | 3.10.1 / 3.10.2 | **MIT OR GPL-3.0-or-later** (lisensi ganda — pemakai boleh memilih syarat MIT) | Buat/baca file ZIP |
| heic2any | 0.0.4 | MIT | Konversi foto HEIC/HEIF |
| utif (UTIF.js) | 3 / 3.1.0 | MIT | Dekode TIFF |
| opentype.js | 1.3.4 | MIT | Baca font (Text to Vector) |
| mp4-muxer | 5.2.2 | MIT | Rakit file MP4 (perekam layar) — catatan: upstream menyatakan paket ini deprecated, digantikan Mediabunny |
| @mediapipe/tasks-vision | 0.10.14 | Apache-2.0 | Visi komputer (deteksi, segmentasi) |
| @mediapipe/selfie_segmentation | 0.1 (minor mengambang) | Apache-2.0 | Segmentasi selfie (Blur Foto, Crop Pas Foto) |
| bcryptjs | 2.4.3 | MIT | Hash bcrypt |
| crypto-js | 4.2.0 | MIT | Hash & enkripsi (AES, MD5, SHA) — catatan: upstream menyatakan pengembangan aktif dihentikan (unmaintained) |
| js-yaml | 4.1.0 | MIT | Parser YAML |
| exifreader | 4.23.5 | **MPL-2.0** | Baca metadata EXIF foto |
| smol-toml | 1.3.1 | **BSD-3-Clause** | Parser TOML |
| tesseract.js | 5 (minor mengambang; diverifikasi di 5.1.1) | Apache-2.0 | OCR (baca teks dari gambar) |
| fast-xml-parser | 4.5.7 | MIT | Parser XML |
| jquery | 3.7.1 | MIT | DOM (dipakai tool Live API tertentu) |
| marked | 12.0.2 | MIT | Render Markdown |
| three | 0.160.0 | MIT | Grafis 3D (tool globe/posisi ISS) |
| @cadit-app/potrace-ts | 1.3.0 | MIT | Bitmap → vektor SVG (via esm.sh) |
| js-sha3 | 0.9.3 | MIT | Hash SHA-3/Keccak |

## Fonta

| Fonta | Sumber | Lisensi |
|---|---|---|
| Bricolage Grotesque (fonta utama situs, di-host sendiri di `css/fonts/bricolage-grotesque.woff2`) | Google Fonts (karya Mathieu Triay / Atelier Triay) | **SIL Open Font License 1.1 (OFL-1.1)** |
| Poppins, Inter, Exo, Lexend, Montserrat, Plus Jakarta Sans (dipakai tool Text to Vector) | Paket `@fontsource/*` versi 5.3.0 via jsDelivr | **OFL-1.1** (keenam paket terverifikasi satu per satu dari registry npm) |

## Konten dari API & layanan luar (bukan kode)

- **DiceBear** (tool Avatar Studio): tiap gaya avatar punya lisensinya sendiri — lihat https://www.dicebear.com/licenses/ (tautan ini juga sudah dicantumkan di dalam tool-nya).
- **Danbooru** (tool Danbooru Search): ilustrasi adalah karya para artist-nya masing-masing; tool menampilkan tautan "Sumber" ke halaman asli tiap gambar. Memakai ulang gambar tunduk pada ketentuan pemegang haknya.
- **Data API publik** (kurs, cuaca, jadwal salat, dsb.): data berasal dari penyedia masing-masing dan tunduk pada ketentuan penyedia tersebut.

## Catatan versi mengambang

Tiga dependensi tidak di-pin ke versi patch secara penuh, sehingga versi persis yang dimuat bisa berubah tanpa perubahan kode situs ini:

- `tesseract.js@5` (major saja) — diverifikasi Apache-2.0 di 5.1.1.
- `utif@3` di satu tool (mayor saja; tool lain memakai 3.1.0) — MIT.
- `@mediapipe/selfie_segmentation@0.1` (minor saja) — Apache-2.0.

Disarankan mem-pin ketiganya ke versi penuh saat ada kesempatan, supaya daftar ini tetap akurat.

---

*Dokumen ini disusun dari pemeriksaan langsung terhadap kode sumber Adip Tools v6.11.5 dan metadata lisensi resmi tiap paket (15 November 2026). Dokumen ini adalah atribusi, bukan nasihat hukum.*
