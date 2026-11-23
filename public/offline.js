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
 *
 * S-U4 (v6.22.0): + renderOfflineTools() — daftar tool dari
 * riwayat/favorit perangkat ini yang chunk-nya terverifikasi ada
 * di runtime cache (tautan), sisanya teks biasa. Tanpa data =
 * seksi tetap tersembunyi, tanpa klaim palsu.
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
      if (status) status.textContent = 'Internet kembali. Memuat ulang…';
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

  // S-U4 (v6.22.0): daftar tool yang masih bisa dibuka offline.
  // HANYA data nyata dari perangkat ini: riwayat (adip_recent) +
  // favorit (adip_fav) dari localStorage, dicocokkan dengan isi
  // Cache Storage (chunk tool bernama assets/<id>-<hash>.js).
  // - Chunk ketemu di cache -> tautan, "Tersimpan di HP kamu".
  // - Tidak ketemu -> teks biasa (bukan tautan mati) + keterangan
  //   perlu internet. Tautan yang pasti gagal tidak ditampilkan.
  // - Cache Storage tidak bisa dibaca -> tampilkan riwayat sebagai
  //   tautan dengan label jujur "Mungkin masih bisa dibuka offline."
  // - Tanpa riwayat/favorit -> seksi tetap tersembunyi (tidak ada
  //   konten palsu). DOM dibangun via createElement + textContent,
  //   bukan innerHTML (id tersimpan tidak pernah jadi HTML).
  function humanizeId(id) {
    return id.split('-').map(function (w) {
      return w ? w.charAt(0).toUpperCase() + w.slice(1) : w;
    }).join(' ');
  }

  // Baca satu daftar store.js: [{id, t}] atau format lama [id].
  // Entri rusak dibuang; duplikat dihapus (yang pertama menang).
  function readStoredList(key) {
    var out = [];
    var seen = {};
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return out;
      var parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return out;
      for (var i = 0; i < parsed.length; i++) {
        var x = parsed[i];
        var id = typeof x === 'string' ? x : (x && typeof x.id === 'string' ? x.id : null);
        if (!id || seen[id]) continue;
        seen[id] = true;
        out.push(id);
      }
    } catch (e) {
      return out;
    }
    return out;
  }

  // Id tool yang chunk-nya ada di runtime cache. null = Cache
  // Storage tidak bisa dibaca (mode privat ketat / API gagal).
  // Nama cache runtime berversi (adip-tools-runtime-<versi>),
  // jadi semua cache ber-prefix itu diperiksa.
  function getCachedToolIds() {
    if (typeof caches === 'undefined' || !caches.keys) {
      return Promise.resolve(null);
    }
    return caches.keys().then(function (names) {
      var runtime = names.filter(function (n) {
        return n.indexOf('adip-tools-runtime-') === 0;
      });
      if (runtime.length === 0) return {};
      return Promise.all(runtime.map(function (name) {
        return caches.open(name).then(function (cache) {
          return cache.keys();
        }).catch(function () { return []; });
      })).then(function (keyLists) {
        var ids = {};
        var re = /^(.+)-[A-Za-z0-9_-]{8}\.js$/;
        for (var i = 0; i < keyLists.length; i++) {
          var keys = keyLists[i];
          for (var j = 0; j < keys.length; j++) {
            var url = keys[j].url || '';
            var base = url.split('/').pop().split('?')[0];
            var m = re.exec(base);
            if (m) ids[m[1]] = true;
          }
        }
        return ids;
      });
    }).catch(function () { return null; });
  }

  function renderOfflineTools() {
    var section = document.getElementById('offlineTools');
    var titleEl = document.getElementById('offlineToolsTitle');
    var noteEl = document.getElementById('offlineToolsNote');
    var listEl = document.getElementById('offlineToolsList');
    var subEl = document.getElementById('offlineToolsSub');
    var plainEl = document.getElementById('offlineToolsPlain');
    if (!section || !titleEl || !noteEl || !listEl || !subEl || !plainEl) return;

    // Riwayat dulu (paling baru di depan), lalu favorit yang belum
    // masuk daftar.
    var combined = [];
    var seen = {};
    var recents = readStoredList('adip_recent');
    var favs = readStoredList('adip_fav');
    var i;
    for (i = 0; i < recents.length; i++) {
      if (!seen[recents[i]]) { seen[recents[i]] = true; combined.push(recents[i]); }
    }
    for (i = 0; i < favs.length; i++) {
      if (!seen[favs[i]]) { seen[favs[i]] = true; combined.push(favs[i]); }
    }
    if (combined.length === 0) return;

    function addLink(id) {
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.href = './#/t/' + encodeURIComponent(id);
      a.textContent = humanizeId(id);
      li.appendChild(a);
      listEl.appendChild(li);
    }

    function addPlain(id) {
      var li = document.createElement('li');
      var span = document.createElement('span');
      span.className = 'plain';
      span.textContent = humanizeId(id);
      li.appendChild(span);
      plainEl.appendChild(li);
    }

    getCachedToolIds().then(function (cached) {
      if (cached === null) {
        // Tidak bisa memastikan: tampilkan riwayat sebagai tautan
        // dengan label jujur, bukan klaim tersimpan.
        titleEl.textContent = 'Baru saja dibuka';
        noteEl.textContent = 'Mungkin masih bisa dibuka offline.';
        combined.slice(0, 6).forEach(addLink);
        section.hidden = false;
        return;
      }
      var ok = [];
      var missing = [];
      for (var k = 0; k < combined.length; k++) {
        if (cached[combined[k]]) ok.push(combined[k]);
        else missing.push(combined[k]);
      }
      if (ok.length > 0) {
        titleEl.textContent = 'Tersimpan di HP kamu';
        noteEl.textContent = 'Tool ini bisa dibuka tanpa internet.';
        ok.slice(0, 6).forEach(addLink);
        if (missing.length > 0) {
          subEl.textContent = 'Belum tersimpan, perlu internet untuk dibuka lagi.';
          subEl.hidden = false;
          missing.slice(0, 4).forEach(addPlain);
        }
      } else {
        titleEl.textContent = 'Baru saja dibuka';
        noteEl.textContent = 'Belum tersimpan di HP kamu, jadi perlu internet untuk dibuka lagi.';
        missing.slice(0, 6).forEach(addPlain);
      }
      section.hidden = false;
    });
  }

  renderOfflineTools();
})();
