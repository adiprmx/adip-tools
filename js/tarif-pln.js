// Tarif listrik PLN — SATU sumber kebenaran untuk tagihan-listrik,
// token-listrik, dan kalkulator-biaya-cas-mobil-listrik (v6.21.0).
// Sebelumnya tabel yang sama diduplikasi di ketiga file dan sudah menyimpang
// (default PPJ 3% vs 0%, token-listrik tanpa stempel tanggal).
//
// Tarif Triwulan IV 2026 (Oktober–Desember 2026), berlaku s.d. 31 Desember
// 2026, Permen ESDM 7/2024. Diverifikasi 20 November 2026 dari pemberitaan
// penetapan ESDM/PLN (RCTI+, FORTUNE Indonesia, Bank Mega, Aktualita):
// R-1 450 VA subsidi Rp415; R-1 900 VA subsidi Rp605; R-1 900 VA RTM
// Rp1.352; R-1 1.300/2.200 VA Rp1.444,70; R-2/R-3 3.500 VA ke atas
// Rp1.699,53; B-2 Rp1.444,70; I-3 Rp1.114,74; I-4 Rp996,74 per kWh.
// SPKLU Rp2.466,78/kWh (maksimum, Permen ESDM 1/2023, tarif L × 1,5) +
// biaya layanan fast maks Rp25.000 / ultra fast maks Rp57.000 per sesi
// (Kepmen ESDM 182.K/2023) — diverifikasi 20 November 2026.
//
// Tarif Triwulan I 2027 (Januari–Maret 2027) BELUM diumumkan saat modul ini
// ditulis — pengumuman resmi ESDM biasanya keluar menjelang akhir Desember
// 2026. JANGAN karang angka: perbarui modul ini begitu pengumuman resmi
// terbit, dan ketiga tool ikut berubah otomatis.

// Periode tarif yang dipakai angka-angka di bawah ini.
export const TARIF_PLN_PERIODE = 'Triwulan IV 2026';
export const TARIF_PLN_BERLAKU = 'Berlaku Oktober–Desember 2026 (sampai 31 Desember 2026)';
export const TARIF_PLN_DICEK = '20 November 2026';
// Catatan jujur untuk UI: tarif triwulan berikutnya belum terbit.
export const TARIF_PLN_CATATAN_Q1 =
  'Tarif Januari–Maret 2027 belum diumumkan pemerintah (biasanya keluar akhir Desember 2026).';

// Tarif per kWh (Rp), kunci = kode golongan PLN.
export const TARIF_PLN = {
  r1_450: 415, // R-1/TR 450 VA (subsidi)
  r1_900_subsidi: 605, // R-1/TR 900 VA (subsidi)
  r1_900_rtm: 1352, // R-1/TR 900 VA nonsubsidi (Rumah Tangga Mampu)
  r1_1300_2200: 1444.7, // R-1/TR 1.300 & 2.200 VA
  r2_r3: 1699.53, // R-2/TR 3.500–5.500 VA & R-3/TR 6.600 VA ke atas
  b2: 1444.7, // B-2/TR bisnis 6.600 VA–200 kVA
  i3: 1114.74, // I-3/TM industri di atas 200 kVA
  i4: 996.74, // I-4/TT industri besar 30.000 kVA ke atas
  spklu: 2466.78, // SPKLU (layanan khusus, maksimum)
};

// Biaya layanan SPKLU per sesi (Rp, maksimum — ada SPKLU yang gratis).
export const SPKLU_FEE = { fast: 25000, ultra: 57000 };

// PPJ (Pajak Penerangan Jalan): 3–10% tergantung daerah, default 3%
// (nilai yang paling umum dipakai; user bisa mengubahnya di tiap tool).
export const PPJ_DEFAULT = 3;
export const PPJ_KETERANGAN = '3–10% tergantung daerah — bisa diubah';
