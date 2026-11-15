# Kebijakan Privasi Adip Tools

**Berlaku sejak: 15 November 2026** · **Versi situs: 6.12.0** · **Situs: https://tools.adipmusic.my.id**

Dokumen ini ditulis dengan bahasa sehari-hari dan berdasarkan cara kerja situs yang sebenarnya (diperiksa langsung dari kode sumber, November 2026). Bukan dokumen templat.

## Intinya

- Semua tools jalan **di browser kamu**. File, foto, dan teks yang kamu olah **tidak diunggah ke server kami**.
- Situs ini **tanpa akun, tanpa daftar, tanpa login**. Kami tidak meminta nama, email, atau nomor HP.
- **Satu-satunya data yang dikirim ke server kami adalah kata yang kamu ketik di kolom pencarian** — untuk fitur "Sering dicari" (penjelasan lengkap di bagian 3).
- Beberapa tools memang butuh layanan luar (misalnya cek kurs atau cuaca). Untuk tools itu, browser kamu menghubungi layanan luar tersebut **langsung**, dan hanya mengirim data yang memang dibutuhkan tool itu (misalnya kata kunci atau nama kota). Detailnya di bagian 4.
- Situs ini **tidak memakai cookie** dan **tidak memakai layanan analitik** (misalnya Google Analytics).

## 1. Cara kerja situs ini

Adip Tools adalah situs statis berisi 588 tools gratis. Semua perhitungan, konversi, edit foto, dan kompresi video dilakukan oleh browser di perangkatmu sendiri, memakai kode JavaScript yang dimuat dari situs ini dan dari CDN (jaringan pengiriman file) publik.

Karena tidak ada akun, kami tidak punya cara untuk tahu siapa kamu. Kami juga tidak bisa mengaitkan aktivitas di situs ini dengan identitas siapa pun.

## 2. Data yang TIDAK kami kumpulkan

- **File yang kamu unggah ke sebuah tool** (foto, video, PDF, dokumen, dan sebagainya) tidak pernah dikirim ke server kami. File dibaca dan diproses di perangkatmu, lalu hasilnya diunduh kembali dari perangkatmu.
- **Teks yang kamu ketik di dalam tool** (misalnya teks untuk dihitung, di-hash, atau dienkripsi) tidak dikirim ke server kami.
- **Catatan dan sandi** di tool Brankas Sandi dan Catatan Terkunci disimpan terenkripsi di perangkatmu sendiri (lihat bagian 5).
- **Foto dan video** yang diproses tool ffmpeg (konversi, kompres, potong) diproses 100% di browser. Mesin ffmpeg (~31 MB) diunduh sekali dari CDN jsDelivr ke browsermu, lalu filemu tidak keluar dari perangkat.
- **Kamera, mikrofon, dan lokasi** hanya dipakai bila kamu menekan tombol yang memintanya, dan datanya diproses di perangkatmu (pengecualian lokasi ada di bagian 4).

## 3. Satu-satunya data yang dikirim ke server kami: kata pencarian

Saat kamu mengetik di kolom pencarian situs (atau menekan Enter), kata pencarianmu dikirim ke database kami (Supabase) dan disimpan di tabel log pencarian. Tujuannya satu: menampilkan daftar **"Sering dicari"** (tools yang paling banyak dicari pengunjung).

Yang dikirim:

- **Kata pencariannya saja**, diubah ke huruf kecil, maksimal 80 karakter. Contoh: kamu mengetik "kompres pdf" → yang tersimpan hanya teks `kompres pdf`.
- Tidak ada nama, email, alamat IP, atau pengenal lain yang kami simpan bersama kata itu — memang tidak ada kolomnya, dan situs ini tidak punya sistem akun.

Kapan dikirim: saat kamu berhenti mengetik sejenak di kolom pencarian (sekitar 1,2 detik), dan saat kamu menekan Enter. Kata yang diketik di dalam sebuah tool (bukan di kolom pencarian situs) tidak dikirim ke mana-mana.

## 4. Data yang dikirim ke layanan pihak ketiga

Beberapa tools tidak bisa jalan tanpa data dari luar. Untuk tools ini, **browser kamu menghubungi layanan luar itu langsung** — datanya tidak lewat server kami, dan kami tidak melihatnya. Yang dikirim hanya yang dibutuhkan tool itu:

| Tool / kelompok | Layanan luar | Yang dikirim |
|---|---|---|
| Kurs, cuaca, gempa, jadwal salat, harga crypto, dan tools "Live API" lainnya | API publik masing-masing (mis. Open-Meteo, BMKG, CoinGecko, Aladhan) | Hanya parameter yang dibutuhkan, mis. nama kota, kode mata uang, atau kata kunci pencarian |
| Terbit & Terbenam (mode lokasi) | api.sunrise-sunset.org | Koordinat lintang-bujur dari GPS perangkatmu |
| Tes GPS | Tidak ada (lokal); tautan ke Google Maps / OpenStreetMap hanya dibuka bila kamu mengekliknya | Koordinat hanya terkirim ke layanan peta itu bila kamu mengeklik tautannya |
| Arah Kiblat | Tidak ada — dihitung lokal dari GPS | Tidak ada |
| Danbooru Search | danbooru.donmai.us | Tag pencarian yang kamu ketik |
| Anime Discover | api.waifu.im, NEKOSBEST | Pilihan kategori (mode selalu SFW — lihat bagian 7) |
| AI Image, Novel Cover, Cari Fakta | Puter (puter.com), Pollinations | Prompt/teks yang kamu tulis; untuk AI Image, juga gambar referensi bila kamu mengunggahnya. Akun yang dipakai adalah akun Puter milikmu sendiri |
| Foto to Link | catbox.moe | **File gambarnya diunggah ke catbox.moe dan jadi tautan publik.** Tool ini sudah menampilkan peringatan di layarnya: jangan unggah foto pribadi/rahasia |
| Hapus Background | Model AI diunduh dari staticimgly.com; foto diproses lokal di browser | Foto tidak diunggah ke mana-mana |
| GenMail (email sementara) | api.guerrillamail.com | Nama email yang kamu pilih; isi email dibaca dari layanan itu |
| Tes Token Bot Telegram, Lihat Update Telegram | api.telegram.org | Token bot yang kamu tempel (hanya dipakai saat itu juga, tidak disimpan) |
| ElevenLabs Studio, Document AI, APOD Harian | ElevenLabs, OpenAI / Pollinations, NASA | API key milikmu + teks/gambar yang kamu proses. API key disimpan di perangkatmu (bagian 5) dan hanya dikirim ke penyedia layanannya |
| Cek IP, DNS Lookup, Cek Nawala, Website Scanner | ipwho.is, ipapi.co, dns.google, dll. | Alamat IP / nama domain yang kamu cek |
| Ambil Kode Halaman, Website Scanner | Layanan proxy publik (Jina Reader, AllOrigins, CorsAnyway) | Alamat URL yang kamu minta diambil — proxy tersebut bisa melihat URL itu |

Perlu diingat: layanan pihak ketiga di atas punya kebijakan privasi masing-masing. Kami tidak mengendalikan apa yang mereka lakukan dengan data yang mereka terima.

## 5. Yang tersimpan di perangkatmu (localStorage)

Situs ini memakai **localStorage** — tempat simpan kecil di browsermu — supaya pengaturanmu tidak hilang saat halaman ditutup. Isinya tidak pernah dikirim ke server kami. Yang disimpan:

- **Favorit** (`adip_fav`): daftar tool favoritmu, maksimal 50.
- **Terakhir dibuka** (`adip_recent`): 20 tool terakhir yang kamu buka.
- **Pengaturan tiap tool**: misalnya persentase BPJS di Kalkulator Gaji, kota terakhir di tool cuaca, atau isi daftar belanja. Total 104 file tool memakai localStorage untuk keperluan seperti ini.
- **API key milikmu** (`adipTools_key_...`): bila kamu memakai tool yang butuh API key sendiri (ElevenLabs, Document AI, APOD), key itu disimpan di browser ini saja, dan hanya dikirim ke penyedia layanannya. Kamu bisa menghapusnya dari dalam tool itu.
- **Brankas Sandi & Catatan Terkunci**: isinya disimpan **terenkripsi (AES)** di perangkatmu dan hanya bisa dibuka dengan kata sandi yang kamu buat. Kami tidak punya salinannya dan tidak bisa membukanya — bila kata sandinya hilang, isinya tidak bisa dipulihkan.

**Cookie:** situs ini sendiri tidak memasang cookie. **SessionStorage dan IndexedDB** tidak dipakai oleh kode situs ini (beberapa library pihak ketiga yang dimuat tool tertentu bisa memakai penyimpanan browser untuk cache internalnya).

**Cara menghapus semuanya:** hapus data situs untuk tools.adipmusic.my.id lewat pengaturan browsermu (menu "Hapus data penjelajahan" → pilih situs ini). Favorit, riwayat, dan pengaturanmu ikut terhapus.

## 6. Kamera, mikrofon, dan lokasi

Beberapa tools memakai perangkat kerasmu: Tes Kamera, Tes Webcam, Pemindai QR (kamera), Perekam Suara, Tuner Gitar, Tes Mikrofon (mikrofon), serta Tes GPS, Arah Kiblat, dan Terbit & Terbenam (lokasi).

- Browser selalu **meminta izinmu dulu** sebelum fitur ini aktif. Bila kamu menolak, tool itu tidak jalan — tidak ada data yang diambil diam-diam.
- Rekaman suara, gambar kamera, dan hasil tes **diproses di perangkatmu dan tidak dikirim ke server kami**.
- Pengecualian: tool Terbit & Terbenam mengirim koordinatmu ke api.sunrise-sunset.org (lihat bagian 4).

## 7. Anak-anak dan konten dewasa

Situs ini ditujukan untuk umum. Satu-satunya tool yang bisa menampilkan konten dewasa adalah **Danbooru Search**:

- Mode default-nya adalah **Mode Aman (SFW)** — hasil pencarian dibatasi ke ilustrasi aman.
- Mode **NSFW (18+)** hanya bisa dibuka setelah kamu menekan tombol konfirmasi "Saya 18+ — Lanjutkan" di layar peringatan konten dewasa. Tanpa konfirmasi itu, mode NSFW tidak aktif.
- Tool Anime Discover selalu dalam mode SFW (dibatasi oleh parameter `is_nsfw=false` ke penyedia API-nya).
- Tool gambar AI (AI Image, Novel Cover) memakai moderasi dari penyedia layanannya: prompt yang melanggar aturan keamanan penyedia akan ditolak.

## 8. CDN dan library pihak ketiga

Agar tools bisa jalan, browsermu mengunduh library dari CDN publik: **jsDelivr, cdnjs (Cloudflare), unpkg, esm.sh**, dan **js.puter.com** (untuk SDK Puter). Saat mengunduh file dari CDN, penyedia CDN tersebut melihat alamat IP dan info browser standar — sama seperti saat kamu membuka halaman web mana pun. Daftar lengkap library dan lisensinya ada di file [LICENSES.md](LICENSES.md).

Fonta situs (Bricolage Grotesque) di-host sendiri dari domain situs ini, bukan dari Google Fonts — jadi tidak ada permintaan ke Google saat halaman dimuat.

## 9. Hakmu dan cara meminta penghapusan

- **Data di perangkatmu** (favorit, riwayat, pengaturan, API key): kamu bisa menghapusnya sendiri lewat pengaturan browser (bagian 5).
- **Log kata pencarian** (bagian 3): karena log itu hanya berisi kata pencarian tanpa identitas apa pun, kami tidak bisa mengetahui kata mana yang milikmu. Bila kamu merasa ada kata pencarian yang perlu dihapus, hubungi kami (bagian 11) dan sebutkan kata serta perkiraan waktunya — kami akan menghapus entri yang cocok.
- Situs ini tidak punya akun, jadi tidak ada proses "hapus akun".

## 10. Perubahan kebijakan

Bila cara situs ini menangani data berubah (misalnya ada tool baru yang mengirim data ke layanan baru), halaman ini akan diperbarui dan tanggal berlakunya diubah. Perubahan besar akan dicatat di file `update.md` situs ini.

## 11. Kontak dan laporan

> **[PERLU DIISI OWNER — belum ada kanal kontak di repo situs ini.]**
> Sebelum kebijakan ini diterbitkan ke publik, isi bagian ini dengan alamat email atau akun Telegram resmi pengelola Adip Tools, supaya pengunjung bisa melapor soal privasi, meminta penghapusan log pencarian, atau melaporkan tool yang bermasalah.

---

*Dokumen ini disusun dari pemeriksaan langsung terhadap kode sumber Adip Tools v6.11.5 (15 November 2026) dan bukan nasihat hukum. Bila situs ini dipakai untuk keperluan komersial atau mengumpulkan data dalam skala besar, pertimbangkan peninjauan oleh pihak yang memahami UU Pelindungan Data Pribadi (UU PDP) Indonesia.*
