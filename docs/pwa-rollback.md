# Runbook Rollback PWA — Adip Tools

Prosedur mematikan/mengembalikan PWA (service worker + cache) bila terjadi
masalah di produksi. Berlaku sejak v6.20.0 (PWA pertama situs ini).

Sumber prosedur: rencana Fase 9 (rollback 3 lapis + prosedur SW khusus),
diterjemahkan ke keadaan ronde v6.20.0 — lihat catatan keterbatasan di §5.

## 0. Prinsip yang tidak boleh dilanggar

**JANGAN sekadar menghapus file `sw.js` (atau `sw-*.js`) dari deploy.**

Service worker yang sudah terpasang di perangkat pengguna TIDAK hilang saat
filenya dihapus dari server. Pengguna lama akan terus memakai SW lama +
cache lamanya — mereka terjebak di versi basi tanpa jalan keluar, dan
setiap deploy berikutnya tidak akan pernah sampai ke mereka. Satu-satunya
cara yang benar: **deploy versi SW yang melakukan unregister pada dirinya
sendiri + menghapus semua cache**, lalu biarkan browser pengguna mengambil
SW unregister itu.

## 1. Kapan runbook ini dipakai

| Gejala | Tindakan |
|---|---|
| Cache basi menimpa rilis baru (pengguna melihat versi lama walau sudah reload) | §2 (naikkan versi cache) — biasanya cukup, tanpa rollback penuh |
| SW menyajikan halaman/tool rusak, atau SW error berulang di banyak perangkat | §3 (rollback SW penuh) |
| PWA bermasalah parah dan perlu dimatikan total sementara | §3, lalu §4 |
| Rilis v6.20.0+ gagal total (bukan hanya SW) | §4 (rollback kode) + §3 bila SW sudah sempat terpasang di pengguna |

## 2. Insiden cache basi (perbaikan ringan, tanpa rollback)

1. Naikkan versi cache: bump `VERSION` (di `js/manifest.js` via
   `scripts/bump-version.py`, sumber versi tunggal — JANGAN baca/ubah
   `package.json` untuk versi) sehingga nama cache berubah
   (mis. `adip-tools-precache-6.20.0` → `...-6.20.1`).
2. Deploy seperti biasa. SW baru menghapus cache lama di event `activate`
   (mekanisme bawaan desain v6.20.0).
3. Verifikasi di perangkat uji: buka situs → terima update ("Ada versi
   baru" → Muat ulang) → pastikan tool menampilkan versi BARU
   (cek nomor versi di footer / `GET_VERSION` via konsol).
4. Bila pengguna masih melihat versi lama setelah langkah ini, lanjut ke §3.

## 3. Rollback SW penuh (unregister + hapus cache)

Tujuan akhir: semua perangkat pengguna kembali ke mode pra-PWA (situs
normal tanpa SW, tanpa cache offline), dan tidak ada SW lama yang tertinggal.

### Langkah 1 — Buat deploy "SW unregister"

Buat commit di branch rollback (JANGAN force-push ke main; revert/branch
biasa) yang mengganti isi `public/sw.js` menjadi SW unregister minimal:

```js
/* SW unregister darurat — menghapus semua cache lalu mencopot diri.
   Deploy ini SEMENTARA (lihat Langkah 3). */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(names.map((n) => caches.delete(n)));
      await self.registration.unregister();
      // RED1-08: claim dulu agar matchAll menemukan klien di semua
      // browser (tanpa claim, navigate() hanya terbukti di Chromium);
      // includeUncontrolled mencakup klien yang belum dikontrol SW ini.
      await self.clients.claim();
      const clients = await self.clients.matchAll({ includeUncontrolled: true });
      clients.forEach((c) => c.navigate(c.url));
    })(),
  );
});
```

**WAJIB dalam SATU deploy yang sama (RED1-08):** nonaktifkan registrasi SW
di `js/pwa.js` di commit/deploy yang SAMA dengan SW unregister ini
(mis. buat `registerSW()` langsung `return` di baris pertama, atau cabut
pemanggilan registrasi dari `onLoad`) — JANGAN menunggu Langkah 3. Bila
registrasi tetap hidup, setiap kunjungan me-register ulang SW unregister
lalu meng-unregister lagi (1 fetch `sw.js` + 1 siklus
install/activate/unregister per kunjungan selama jendela 7 hari —
terbukti poc-09 Red-1). Menonaktifkan registrasi di deploy yang sama
menghilangkan churn itu: kunjungan berikut tidak lagi menyentuh `sw.js`.

Catatan penting:

- **Nama file + URL harus SAMA** (`/sw.js`, scope yang sama) — kalau tidak,
  browser tidak menganggap ini update SW lama dan unregister tidak terjadi.
- **Header `Cache-Control: no-cache` untuk `sw*.js` WAJIB tetap ada** di
  deploy ini (blok headers `vercel.json`) — kalau SW unregister ikut
  ter-cache, pengguna tidak pernah menerimanya.
- Modul `sw-runtime.js` / `sw-cdn.js` / `sw-update.js` / `sw-quota.js`
  TIDAK perlu diubah — SW unregister tidak memanggil `importScripts`.
- Jangan hapus `public/manifest.webmanifest` di langkah ini: instalasi
  dan SW adalah gerbang terpisah (aplikasi terinstal tetap jalan tanpa SW,
  hanya tanpa offline). Menghapus manifest di tengah jalan hanya menambah
  variabel. Bila memang ingin mematikan instalasi juga, hapus manifest +
  link-nya di Langkah 3, setelah unregister tersebar.

### Langkah 2 — Deploy + tunggu penyebaran

1. Deploy branch rollback ke produksi (Vercel — host produksi; GitHub Pages
   hanya preview). Vercel instant rollback BUKAN pengganti langkah ini:
   rollback ke commit pra-PWA mengembalikan "tidak ada file SW", yang
   justru kondisi terlarang di §0.
2. **Tunggu.** SW unregister hanya sampai ke pengguna saat mereka membuka
   situs (browser memeriksa update SW tiap kunjungan, karena header
   no-cache). Pengguna yang tidak membuka situs tidak akan ter-unregister
   — itu wajar dan tidak bisa dipaksa dari server. Beri waktu minimal
   **7 hari** sebelum menganggap penyebaran selesai (pengguna aktif harian
   akan kena dalam 1–2 hari; pengguna jarang membuka lebih lama).
3. Selama masa tunggu, pantau: tidak ada laporan baru "versi lama / tool
   rusak", dan cek di perangkat uji bahwa setelah buka situs, SW hilang
   dari DevTools → Application → Service Workers dan Cache Storage kosong.

### Langkah 3 — Bersihkan

Setelah masa tunggu:

1. Hapus file SW (`public/sw.js` + `public/sw-*.js`) + (bila PWA
   dimatikan total) manifest + link manifest + UI install/update —
   lewat commit revert biasa ke main, atau lanjutkan dengan rilis
   perbaikan. (Registrasi SW di `js/pwa.js` SUDAH dinonaktifkan di
   Langkah 1 — jangan dihidupkan lagi di sini.)
2. Deploy. Verifikasi mode pra-PWA (lihat §6).
3. Laporkan ke owner: kronologi, apa yang dikembalikan, apa yang belum
   pulih (mis. pengguna yang belum membuka situs sejak deploy unregister
   masih memakai SW lama sampai kunjungan berikutnya). **Jangan rollback
   diam-diam.**

## 4. Rollback kode (Lapis 2)

Bila masalahnya bukan hanya SW (rilis rusak secara umum):

1. Revert commit bermasalah (commit revert biasa, JANGAN force-push),
   atau Vercel instant rollback ke deployment sehat terakhir.
2. **Bila SW sudah sempat terpasang di pengguna** (rilis bermasalah sempat
   live > beberapa jam), rollback kode SAJA tidak cukup — SW lama di
   perangkat pengguna tetap hidup. Jalankan §3 (deploy SW unregister)
   SETELAH rollback kode, lalu §3 Langkah 3.
3. Verifikasi ZB-1 lolos TANPA SW (mode pra-PWA) — lihat §6.

## 5. Keterbatasan yang diketahui (dicatat jujur)

- **TIDAK ADA kill-switch tanpa deploy.** Rollback Lapis 1 rencana Fase 9
  mengasumsikan flag `site_flags` untuk mematikan fitur tanpa deploy.
  Tabel itu adalah produk Fase 4 (admin) yang BELUM dibangun — ronde
  v6.20.0 tidak punya kill-switch. Satu-satunya cara mematikan PWA adalah
  deploy (§3/§4). Konsekuensi: waktu respons rollback = waktu deploy +
  waktu penyebaran ke perangkat pengguna (§3 Langkah 2), bukan hitungan
  menit.
- **Rollback data (Lapis 3) TIDAK BERLAKU.** F11 (PWA inti) tidak menambah
  tabel server dan tidak menyentuh data pengguna di server — tidak ada
  data yang perlu di-restore. Yang dihapus hanya cache di perangkat
  pengguna (dapat dibangun ulang dengan membuka tool lagi saat online).
  Favorit/riwayat (`localStorage` `adip_fav`/`adip_recent`) TIDAK
  disentuh rollback SW — rollback server tidak pernah menyentuh
  localStorage pengguna.
- **Pengguna yang tidak pernah kembali tidak bisa dipaksa.** SW unregister
  hanya bekerja saat pengguna membuka situs. Pengguna yang membuka situs
  setelah Langkah 3 selesai (file SW sudah dihapus) akan tetap memakai
  SW lama + cache lama sampai... tidak ada jalan keluar dari server.
  Mitigasi: JANGAN mempersingkat masa tunggu §3 Langkah 2; bila insiden
  besar, umumkan ke pengguna agar membuka situs (memicu update SW).
- **Dua deploy berturut-turut.** Prosedur §3 butuh dua deploy (unregister,
  lalu bersih-bersih). Jangan menggabungkannya menjadi satu deploy
  "hapus file SW" — itu justru kondisi terlarang §0. Penonaktifan
  registrasi di `js/pwa.js` adalah bagian dari deploy PERTAMA (Langkah 1),
  bukan deploy kedua — lihat RED1-08.

## 6. Verifikasi pasca-rollback (wajib)

Dilakukan tim verifikasi (P16 di ronde v6.20.0; di luar ronde, siapa pun
yang menjalankan rollback):

1. **Sapu route tanpa SW (ZB-1 mode pra-PWA):** di profil browser bersih
   (tanpa SW terpasang), semua route tool terbuka: HTTP 200, ter-render,
   nol chunk gagal dimuat. Target: 1.299 tool / 1.330 route, nol gagal.
2. **Perangkat uji yang tadinya punya SW:** buka situs → DevTools →
   Application → Service Workers: kosong; Cache Storage: kosong (atau
   hanya cache baru pasca-rollback); situs memuat versi terbaru.
3. **Fungsi tanpa login (ZB-4):** seluruh tool berfungsi penuh tanpa akun
   setelah rollback — rollback tidak boleh mengunci apa pun di balik login
   (tidak ada login di situs ini).
4. **Tanpa regresi performa kasat mata (ZB-6):** muat pertama tidak lebih
   lambat dari baseline pra-PWA secara kasat mata; bila ragu, bandingkan
   dengan deployment pra-PWA.
5. Bila salah satu cek gagal: JANGAN nyatakan rollback selesai — perbaiki
   sampai lolos, atau ulangi prosedur. Gerbang yang gagal tidak boleh
   dilonggarkan.

## 7. Referensi

- Rencana Fase 9: rollback 3 lapis + prosedur SW khusus (D3 §3, §Fase 9),
  gerbang ZB-1/ZB-4/ZB-6 (D3 §2).
- Keputusan ronde v6.20.0: `~/workspace/adip-tools-upgrade/pwa-v6200/roster.md`
  (D-PWA-01 s.d. D-PWA-11; D-PWA-09: produksi = Vercel).
- Recon: `r12-history.md` (§2.5 rollback Fase 9, §4.3d tanpa kill-switch),
  `r4-offline-audit.md` (partisi kelas offline).
- Nama cache v6.20.0: `adip-tools-precache-6.20.0`,
  `adip-tools-runtime-6.20.0`, `adip-tools-cdn-v1`.
