// Loader kecil untuk pengujian Node: abaikan query cache-buster (?v=x.y.z)
// pada import antar-file lokal, dan stub query worker Vite (?worker&url)
// yang tidak dipahami Node. Browser/Vite menangani query ini secara native.
export async function resolve(specifier, context, nextResolve) {
  // Vite: `import url from './worker.js?worker&url'` mengembalikan URL file
  // worker hasil build. Node tidak bisa me-resolve query itu (dan worker.js
  // memakai `self` di top-level, tidak ada di Node) — kembalikan modul stub
  // berisi string URL palsu; check-tools/sync-manifest tidak pernah
  // memanggil loadFFmpeg(), jadi nilai stub tidak pernah dipakai.
  if (specifier.includes('?worker')) {
    return { url: 'data:text/javascript,export default "vite-worker-stub";', shortCircuit: true };
  }
  const clean = specifier.replace(/\?v=[\d.]+$/, '');
  if (clean !== specifier) return nextResolve(clean, context);
  return nextResolve(specifier, context);
}
