// ADIP Tools — konfigurasi Vite (P0-A, v6.14.0).
//
// Arsitektur: SPA hash-routing vanilla ESM, TANPA framework. Vite hanya
// membundel + memberi hash nama file (menggantikan ?v= manual); 627 tool
// tetap file vanilla JS yang dimuat on-demand lewat import.meta.glob
// di js/app.js (satu chunk ber-hash per tool).
//
// Keputusan kunci (alasan lengkap: ~/workspace/adip-tools-upgrade/
// v6.14.0/p0-eval.md + p0-setup.md):
//   - base './' (RELATIF, wajib): preview GitHub Pages hidup di subpath
//     /adip-tools/ sementara produksi Vercel di domain root. Path absolut
//     '/assets/...' 404 di preview (bug nyata 15 Nov 2026 di ffmpeg).
//     JANGAN ganti ke '/' tanpa memindahkan preview ke domain root.
//   - manifest: true — dist/.vite/manifest.json memetakan tiap file
//     sumber ke hasil build ber-hash (dipakai sapu route A11 + audit).
//   - CSS: 6 stylesheet index.html dibundel Vite sesuai urutan <link>
//     (cascade tidak berubah), diminifikasi esbuild.
//   - Worker ffmpeg: js/ffmpeg-loader.js memakai `?worker&url` agar
//     worker.js + import relatifnya dibundel jadi satu file ber-hash.
import { defineConfig } from 'vite';

export default defineConfig({
  // URL relatif untuk semua aset (lihat catatan base di atas).
  base: './',
  // File statis yang disalin verbatim ke dist/: robots.txt, sitemap.xml,
  // llms.txt, .nojekyll. Generator sitemap/llms menulis ke public/
  // (scripts/gen-sitemap.js, scripts/gen-llms-txt.js).
  publicDir: 'public',
  build: {
    outDir: 'dist',
    // Peta sumber -> hasil build ber-hash (audit + sapu route).
    manifest: true,
    // Minifikasi default esbuild (JS + CSS). Target default Vite
    // ('baseline-widely-available'): Chrome 107+, Safari 16+, Firefox 104+.
    rollupOptions: {
      output: {
        // Nama chunk mudah dilacak ke file sumbernya:
        //   assets/kpr-<hash>.js, assets/index-<hash>.js, dst.
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
  server: {
    // Port default 5173; untuk tes lokal pakai --port (mis. 8931).
    // HMR aktif default (WebSocket); edit shell/CSS ter-apply tanpa
    // reload penuh. Edit file tool memicu reload halaman (app.js tidak
    // memanggil import.meta.hot.accept untuk chunk tool — disengaja:
    // state tool di-render ulang dari nol supaya tidak setengah jalan).
  },
});
