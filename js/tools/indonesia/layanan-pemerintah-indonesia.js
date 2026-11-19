import { h as T } from '../../core.js';

// Direktori layanan pemerintah Indonesia. Semua tautan adalah domain resmi
// instansi, dicek masih aktif pada 19 November 2026 (cekbansos dan Prakerja
// tidak bisa dibuka dari jaringan ini, tapi domainnya terkonfirmasi resmi
// dari sumber pemberitaan dan situs pemerintah).
export const LAYANAN = [
  { nama: 'Cek Bansos', instansi: 'Kementerian Sosial', url: 'https://cekbansos.kemensos.go.id', kat: 'Bantuan', desk: 'Cek apakah namamu terdaftar sebagai penerima bantuan sosial (PKH, BPNT, dan lainnya).', cat: 'Situs resmi Kemensos. Bila sulit dibuka, coba lagi di lain waktu.' },
  { nama: 'BPJS Kesehatan', instansi: 'BPJS Kesehatan', url: 'https://bpjs-kesehatan.go.id', kat: 'Kesehatan', desk: 'Info JKN, cek iuran, faskes, dan layanan Mobile JKN.', cat: '' },
  { nama: 'SATUSEHAT', instansi: 'Kementerian Kesehatan', url: 'https://satusehat.kemkes.go.id', kat: 'Kesehatan', desk: 'Platform kesehatan nasional: rekam medis, vaksin, dan layanan kesehatan.', cat: '' },
  { nama: 'BPJS Ketenagakerjaan', instansi: 'BPJS Ketenagakerjaan', url: 'https://www.bpjsketenagakerjaan.go.id', kat: 'Ketenagakerjaan', desk: 'Jaminan kecelakaan kerja, kematian, hari tua, pensiun, dan kehilangan pekerjaan.', cat: '' },
  { nama: 'Prakerja', instansi: 'Kementerian Ketenagakerjaan', url: 'https://prakerja.go.id', kat: 'Ketenagakerjaan', desk: 'Program pelatihan kerja dengan insentif. Gelombang baru belum dibuka sejak 2024, program sedang dialihkan ke Kemnaker.', cat: 'Per November 2026 belum ada gelombang baru. Hati-hati situs palsu yang mengatasnamakan Prakerja.' },
  { nama: 'Dukcapil', instansi: 'Kementerian Dalam Negeri', url: 'https://dukcapil.kemendagri.go.id', kat: 'Kependudukan', desk: 'Layanan KTP, KK, akta kelahiran, dan dokumen kependudukan lainnya.', cat: '' },
  { nama: 'DJP Online', instansi: 'Direktorat Jenderal Pajak', url: 'https://djponline.pajak.go.id', kat: 'Pajak', desk: 'Lapor SPT, bayar pajak, dan cek NPWP secara online.', cat: '' },
  { nama: 'Imigrasi', instansi: 'Direktorat Jenderal Imigrasi', url: 'https://www.imigrasi.go.id', kat: 'Imigrasi', desk: 'Permohonan paspor, perpanjangan, dan layanan keimigrasian lainnya.', cat: '' },
  { nama: 'Samsat Digital (SIGNAL)', instansi: 'Korlantas Polri', url: 'https://samsatdigital.id', kat: 'Kendaraan', desk: 'Bayar pajak kendaraan bermotor tahunan secara online.', cat: '' },
  { nama: 'SIM Digital', instansi: 'Korlantas Polri', url: 'https://digitalkorlantas.id', kat: 'Kendaraan', desk: 'Perpanjangan SIM A dan SIM C secara online.', cat: '' },
  { nama: 'OSS (Perizinan Usaha)', instansi: 'Kementerian Investasi/BKPM', url: 'https://oss.go.id', kat: 'Usaha', desk: 'Buat NIB dan urus izin usaha secara online, termasuk UMKM.', cat: '' },
  { nama: 'KIP Kuliah', instansi: 'Kemendiktisaintek', url: 'https://kip-kuliah.kemdiktisaintek.go.id', kat: 'Pendidikan', desk: 'Bantuan biaya kuliah untuk mahasiswa dari keluarga kurang mampu.', cat: '' },
  { nama: 'LPDP', instansi: 'Kementerian Keuangan', url: 'https://lpdp.kemenkeu.go.id', kat: 'Pendidikan', desk: 'Beasiswa pendidikan jenjang magister dan doktor, dalam dan luar negeri.', cat: '' },
  { nama: 'LAPOR!', instansi: 'Kementerian PANRB', url: 'https://www.lapor.go.id', kat: 'Pengaduan', desk: 'Sampaikan pengaduan dan aspirasi soal layanan pemerintah.', cat: '' },
  { nama: 'PLN', instansi: 'PT PLN (Persero)', url: 'https://www.pln.co.id', kat: 'Listrik', desk: 'Cek tagihan listrik, beli token, pasang baru, dan tambah daya.', cat: '' },
  { nama: 'Cek BPOM', instansi: 'Badan POM', url: 'https://cekbpom.pom.go.id', kat: 'Kesehatan', desk: 'Cek nomor izin edar obat, makanan, dan kosmetik.', cat: '' },
  { nama: 'e-Meterai', instansi: 'Perum Peruri', url: 'https://e-meterai.co.id', kat: 'Dokumen', desk: 'Beli dan bubuhkan meterai elektronik pada dokumen.', cat: '' },
];

export function cariLayanan(kueri) {
  const q = (kueri || '').trim().toLowerCase();
  if (!q) return LAYANAN;
  return LAYANAN.filter((l) =>
    l.nama.toLowerCase().includes(q) || l.instansi.toLowerCase().includes(q) ||
    l.kat.toLowerCase().includes(q) || l.desk.toLowerCase().includes(q));
}

export const meta = { "id": "layanan-pemerintah-indonesia", "name": "Layanan Pemerintah Indonesia", "cat": "indonesia", "icon": "🇮🇩", "desc": "Direktori tautan resmi layanan pemerintah: bansos, BPJS, pajak, paspor, SIM, dan lainnya.", "keywords": "pemerintah,layanan pemerintah,bansos,bpjs,pajak,paspor,sim,dukcapil,oss,lapor", "since": "6.18.0" };

export function render(root) {
  const cari = T.input('text', 'Cari layanan, misal bansos atau pajak', '');
  const box = T.out();

  const tampilkan = () => {
    const hasil = cariLayanan(cari.value);
    if (hasil.length === 0) {
      T.show(box, '<p class="hint">Tidak ada layanan yang cocok dengan "' + T.esc(cari.value) + '". Coba kata lain.</p>');
      return;
    }
    const cards = hasil.map((l) =>
      '<div class="card" style="margin-bottom:10px"><p style="font-weight:700;margin:0 0 2px">' +
      '<a href="' + T.esc(l.url) + '" target="_blank" rel="noopener">' + T.esc(l.nama) + '</a></p>' +
      '<p class="dim" style="font-size:13px;margin:0 0 4px">' + T.esc(l.instansi) + ' - ' + T.esc(l.kat) + '</p>' +
      '<p class="hint" style="margin:0">' + T.esc(l.desk) + (l.cat ? ' ' + T.esc(l.cat) : '') + '</p></div>').join('');
    T.show(box, cards +
      '<p class="hint">Semua tautan di atas adalah situs resmi instansi, dicek 19 November 2026. ' +
      'Hati-hati dengan situs palsu: pastikan alamatnya sesuai dengan yang tertulis di sini sebelum memasukkan data pribadi.</p>');
  };

  cari.addEventListener('input', tampilkan);
  root.appendChild(T.field('Cari layanan', cari));
  root.appendChild(box);
  tampilkan();
}
