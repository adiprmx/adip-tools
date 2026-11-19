// Adip Tools — receiver pratinjau HTML user (G-2, v6.19.1).
// Dulu script inline di public/preview.html; dipindah ke file eksternal
// same-origin (FIX-1, 19 Nov 2026) supaya lolos irisan dua policy CSP yang
// berlaku di /preview.html (policy utama tanpa 'unsafe-inline' + policy
// khusus preview). Isi logika TIDAK berubah dari versi inline-nya.
// Dimuat dari preview.html via <script src="preview.js"></script> (blocking,
// tanpa defer/async — perilaku urut eksekusi sama seperti inline).
(function () {
  'use strict';
  // Origin yang diharapkan: origin URL halaman ini sendiri. Di dalam frame
  // sandbox-opak, location.origin bernilai "null", tapi location.href tetap
  // terbaca (dokumen sendiri), jadi turunkan origin dari href.
  var expectedOrigin = '';
  try { expectedOrigin = new URL(location.href).origin; } catch (e) { expectedOrigin = ''; }
  var token = '';
  try { token = new URLSearchParams(location.search).get('t') || ''; } catch (e) { token = ''; }

  var inner = null;   // iframe srcdoc dalam (tempat HTML user ditulis)
  var innerMode = ''; // 'preview' | 'render'

  function ensureInner(mode) {
    if (inner && innerMode === mode) return inner;
    if (inner) inner.remove();
    innerMode = mode;
    inner = document.createElement('iframe');
    inner.id = 'pv';
    // R-01 (Blue-B, 19 Nov 2026): iframe dalam SELALU opak — tanpa
    // allow-same-origin di mode apa pun. Dulu mode render memakai
    // allow-same-origin; dengan frame luar yang kini opak, flag itu akan
    // membuat kode user satu origin (opak) dengan dokumen host ini dan
    // bisa membaca DOM host + token di query-nya. Capture piksel yang
    // dibelanya terbukti tidak jalan di browser mana pun (P2 §8.1).
    inner.setAttribute('sandbox', 'allow-scripts');
    inner.setAttribute('referrerpolicy', 'no-referrer');
    document.body.appendChild(inner);
    return inner;
  }

  // Terima HTML hanya dari parent (embed) / opener (tab baru) yang originnya
  // sama + tokennya cocok. Pesan lain diabaikan diam-diam.
  window.addEventListener('message', function (ev) {
    if (!ev || !ev.data || ev.data.type !== 'at-preview') return;
    if (ev.origin !== expectedOrigin) return;
    if (!token || ev.data.token !== token) return;
    if (window.parent !== window && ev.source !== window.parent) return;
    var mode = ev.data.mode === 'render' ? 'render' : 'preview';
    var f = ensureInner(mode);
    f.srcdoc = typeof ev.data.html === 'string' ? ev.data.html : '';
  });

  // Beri tahu parent bahwa host sudah siap menerima HTML. Kirim dulu ke
  // parent/opener, BARU putuskan opener (balasan parent tidak butuh opener).
  var target = window.parent !== window ? window.parent : window.opener;
  if (target) {
    try { target.postMessage({ type: 'at-preview-ready', token: token }, expectedOrigin || '*'); } catch (e) { /* abaikan */ }
  }
  try { if (window.opener) window.opener = null; } catch (e) { /* abaikan */ }
})();
