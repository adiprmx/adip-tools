// Harga BBM — SATU sumber kebenaran untuk kalkulator-konsumsi-bbm,
// kalkulator-biaya-komuter, biaya-aus-kendaraan-per-km,
// perencana-road-trip, dan kalkulator-biaya-cas-mobil-listrik (v6.21.0).
// Sebelumnya harga default Pertalite Rp10.000/liter tersebar di kelima
// file dan sudah menyimpang (sebagian bertanggal 2 September 2026,
// sebagian tanpa tanggal sama sekali).
//
// Harga Pertalite Rp10.000/liter berlaku sejak 2 September 2026
// (Pertamina). Diverifikasi ulang Q5 v6.21.0 pada 20 November 2026:
// Pertalite TETAP Rp10.000 (aktualita.co 20 Nov 2026; petabbm.id dicek
// 20 Nov 09:30 WIB; FORTUNE Nov 2026; CNBC via lapor.co.id 17 Nov 2026)
// — Pertamina tidak menyesuaikan harga November 2026, dan Menteri ESDM
// menjamin harga BBM subsidi tidak naik sampai 31 Desember 2026.
// Harga BBM bisa berubah sewaktu-waktu mengikuti kebijakan
// pemerintah/Pertamina — perbarui HANYA modul ini, dan kelima tool ikut
// berubah otomatis. Verifikasi: mypertamina.id / situs Pertamina.
// JANGAN karang angka: bila harga berubah, cek sumber resmi dulu.

// Harga Pertalite per liter (Rp).
export const HARGA_BBM_PERTALITE = 10000;
// Tanggal mulai berlakunya harga di atas.
export const HARGA_BBM_TANGGAL = '2 September 2026';
// Label siap tampil di UI ("Pertalite Rp10.000/liter, berlaku sejak 2 September 2026").
export const HARGA_BBM_LABEL = 'Pertalite Rp10.000/liter (berlaku sejak 2 September 2026)';
export const HARGA_BBM_SUMBER = 'Pertamina (mypertamina.id)';
