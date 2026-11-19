/* public/offline.js — skrip halaman offline Adip Tools (PWA v6.20.0).
 *
 * Dipindah dari <script> inline di offline.html (RED1-09, Blue R1):
 * skrip inline diblokir bila CSP dienforce (script-src 'self' tanpa
 * 'unsafe-inline') — tombol "Coba lagi" + auto-reload akan mati
 * diam-diam saat CSP ditegakkan kelak. File eksternal same-origin
 * diizinkan script-src 'self' di kedua mode CSP.
 *
 * File ini WAJIB di-precache (STATIC_SHELL di
 * scripts/gen-sw-precache.js) — halaman offline harus jalan penuh
 * tanpa jaringan, termasuk skripnya.
 *
 * Fungsi dipertahankan penuh dari versi inline: tombol "Coba lagi"
 * (reload) + auto-reload saat event `online` + teks status.
 */
(function () {
  'use strict';
  var retry = document.getElementById('retry');
  if (retry) {
    retry.addEventListener('click', function () {
      location.reload();
    });
  }
  // Auto-reload saat 'online' — TAPI diverifikasi dulu (BLUE-01,
  // ditemukan saat validasi RED1-06): Chromium bisa memancarkan event
  // 'online' PALSU saat navigasi dilayani SW dari cache selagi
  // benar-benar offline (terbukti blue-nav-instr: 'online' menyala di
  // tengah goto offline, lalu 'offline' menyusul). Reload buta akan
  // membunuh navigasi yang sedang berjalan — halaman me-reload URL
  // lama, bukan tujuan (goto mengembalikan null, URL basi).
  // Jadi: uji konektivitas nyata dulu dengan fetch no-store ke URL
  // cache-busting. SW tidak pernah menyajikan URL ini dari cache
  // (tanpa ekstensi aset + no-store = pass-through murni), sehingga
  // fetch yang BERHASIL (status berapa pun, termasuk 404) membuktikan
  // ada koneksi, dan fetch yang GAGAL/timeout membuktikan masih
  // offline. Hanya reload bila terbukti online; bila tidak, tetap di
  // kartu offline tanpa reload sia-sia.
  var verifying = false;
  window.addEventListener('online', function () {
    if (verifying) return;
    verifying = true;
    var done = false;
    var timer = null;
    var finish = function (isOnline) {
      if (done) return;
      done = true;
      verifying = false;
      if (timer !== null) clearTimeout(timer);
      if (!isOnline) return;
      var status = document.getElementById('status');
      if (status) status.textContent = 'Internet kembali — memuat ulang…';
      location.reload();
    };
    timer = setTimeout(function () { finish(false); }, 3000);
    try {
      fetch('./__online-probe?x=' + Date.now(), { cache: 'no-store' })
        .then(function () { finish(true); })
        .catch(function () { finish(false); });
    } catch (e) {
      finish(false);
    }
  });
})();
