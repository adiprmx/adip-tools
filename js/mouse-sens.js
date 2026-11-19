// Tabel yaw game + rumus cm/360: modul bersama (kanonis, G4 C1G4-R).
// Dikonsolidasi dari fun/kalkulator-cm360.js + fun/kalkulator-edpi.js +
// fun/konverter-sensitivitas-mouse.js (G4 B17): YAW dan cm360
// byte-identik di ketiganya. Komentar di kode sumber ketiga file itu
// sendiri menandai keduanya sebagai kandidat konsolidasi C1G4-R.
// yaw = derajat per hitungan mouse pada sens 1 (nilai komunitas;
// `yakin: false` = nilai perkiraan, ditandai '*' di UI).
export const YAW = {
  cs2: { nama: 'CS2', yaw: 0.022, yakin: true },
  valorant: { nama: 'Valorant', yaw: 0.06996, yakin: true },
  apex: { nama: 'Apex Legends', yaw: 0.022, yakin: true },
  overwatch2: { nama: 'Overwatch 2', yaw: 0.0066, yakin: true },
  pubg: { nama: 'PUBG', yaw: 0.022, yakin: true },
  r6: { nama: 'Rainbow Six Siege', yaw: 0.0022, yakin: false },
  fortnite: { nama: 'Fortnite (%)', yaw: 0.000914, yakin: false, persen: true },
  cod: { nama: 'Call of Duty', yaw: 0.0066, yakin: false },
};

// cm/360 dari DPI, sens, dan yaw. Murni.
export function cm360(dpi, sens, yaw) {
  if (!(dpi > 0) || !(sens > 0) || !(yaw > 0)) return NaN;
  return (2.54 * 360) / (dpi * sens * yaw);
}
