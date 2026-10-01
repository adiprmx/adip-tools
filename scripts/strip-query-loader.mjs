// Loader kecil untuk pengujian Node: abaikan query cache-buster (?v=x.y.z)
// pada import antar-file lokal. Browser menangani query string secara native.
export async function resolve(specifier, context, nextResolve) {
  const clean = specifier.replace(/\?v=[\d.]+$/, '');
  if (clean !== specifier) return nextResolve(clean, context);
  return nextResolve(specifier, context);
}
