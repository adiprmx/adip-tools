// Parser + format durasi screen time: modul bersama (kanonis, G4 C1G4-R).
// Dikonsolidasi dari fakesos/fake-screen-time-android.js +
// fakesos/fake-screen-time-iphone.js (G4 B15): keempat fungsi byte-identik
// (hanya komentar yang berbeda). WARNA_APP dan SAMPLE_APPS dibiarkan lokal
// (warna Android vs iOS berbeda; sampel Chrome vs Safari berbeda).
// fmtDurasi di sini ("3 j 24 mnt", dijepit >= 0) BERBEDA dari
// utils.fmtDurasi ("3 jam 24 menit", tanpa jepit); keduanya dipertahankan.
export function parseApps(text) {
  const out = [];
  String(text).split('\n').forEach((raw) => {
    const line = raw.trim();
    if (!line) return;
    const p = line.lastIndexOf('|');
    const nama = p < 0 ? line : line.slice(0, p).trim();
    const menit = p < 0 ? 0 : Math.max(0, Math.round(Number(String(line.slice(p + 1)).replace(/[^0-9]/g, '')) || 0));
    if (nama) out.push({ nama, menit });
  });
  return out;
}

export function parseMinggu(text) {
  const out = [];
  String(text).split('\n').forEach((raw) => {
    const line = raw.trim();
    if (!line) return;
    const p = line.lastIndexOf('|');
    const hari = p < 0 ? line : line.slice(0, p).trim();
    const menit = p < 0 ? 0 : Math.max(0, Math.round(Number(String(line.slice(p + 1)).replace(/[^0-9]/g, '')) || 0));
    if (hari) out.push({ hari, menit });
  });
  return out;
}

export function totalMenit(apps) {
  return apps.reduce((a, b) => a + (b.menit || 0), 0);
}

export function fmtDurasi(menit) {
  const m = Math.max(0, Math.round(Number(menit) || 0)) + 0;
  const j = Math.floor(m / 60);
  const s = m % 60;
  if (j === 0) return s + ' mnt';
  if (s === 0) return j + ' j';
  return j + ' j ' + s + ' mnt';
}
