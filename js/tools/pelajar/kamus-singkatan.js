import { h as T, utils } from '../../core.js';

export const meta = {"id": "kamus-singkatan", "name": "Kamus Singkatan Indonesia", "cat": "pelajar", "icon": "📖", "desc": "Cari arti singkatan Indonesia yang sering muncul di dokumen, sekolah, dan berita.", "keywords": "singkatan,akronim,kamus,arti,kepanjangan,indonesia,dokumen", "since": "6.19.0"};

// Bank singkatan, ditulis dari pengetahuan umum. Format:
// [singkatan, kepanjangan, kategori, catatan opsional]
export const SINGKATAN = [
  // Umum
  ['dll.', 'dan lain-lain', 'umum', ''],
  ['dsb.', 'dan sebagainya', 'umum', ''],
  ['dst.', 'dan seterusnya', 'umum', ''],
  ['dkk.', 'dan kawan-kawan', 'umum', ''],
  ['yth.', 'yang terhormat', 'umum', 'dipakai di awal surat'],
  ['ybs.', 'yang bersangkutan', 'umum', ''],
  ['a.n.', 'atas nama', 'umum', ''],
  ['u.b.', 'untuk beliau', 'umum', 'di surat resmi'],
  ['u.p.', 'untuk perhatian', 'umum', 'di sampul surat'],
  ['ttd.', 'tertanda / tanda tangan', 'umum', ''],
  ['no.', 'nomor', 'umum', ''],
  ['tgl.', 'tanggal', 'umum', ''],
  ['bln.', 'bulan', 'umum', ''],
  ['thn.', 'tahun', 'umum', ''],
  ['jml.', 'jumlah', 'umum', ''],
  ['sda.', 'sumber daya alam', 'umum', ''],
  ['sdm.', 'sumber daya manusia', 'umum', ''],
  ['KTP', 'Kartu Tanda Penduduk', 'umum', ''],
  ['KK', 'Kartu Keluarga', 'umum', ''],
  ['WIB', 'Waktu Indonesia Barat', 'umum', 'GMT+7'],
  ['WITA', 'Waktu Indonesia Tengah', 'umum', 'GMT+8'],
  ['WIT', 'Waktu Indonesia Timur', 'umum', 'GMT+9'],
  ['RT', 'Rukun Tetangga', 'umum', ''],
  ['RW', 'Rukun Warga', 'umum', ''],
  // Pemerintahan
  ['RI', 'Republik Indonesia', 'pemerintahan', ''],
  ['NKRI', 'Negara Kesatuan Republik Indonesia', 'pemerintahan', ''],
  ['UUD', 'Undang-Undang Dasar', 'pemerintahan', 'UUD 1945'],
  ['DPR', 'Dewan Perwakilan Rakyat', 'pemerintahan', ''],
  ['MPR', 'Majelis Permusyawaratan Rakyat', 'pemerintahan', ''],
  ['DPD', 'Dewan Perwakilan Daerah', 'pemerintahan', ''],
  ['DPRD', 'Dewan Perwakilan Rakyat Daerah', 'pemerintahan', ''],
  ['MA', 'Mahkamah Agung', 'pemerintahan', 'jangan tertukar dengan MA (Madrasah Aliyah)'],
  ['MK', 'Mahkamah Konstitusi', 'pemerintahan', ''],
  ['KY', 'Komisi Yudisial', 'pemerintahan', ''],
  ['KPK', 'Komisi Pemberantasan Korupsi', 'pemerintahan', ''],
  ['KPU', 'Komisi Pemilihan Umum', 'pemerintahan', ''],
  ['Bawaslu', 'Badan Pengawas Pemilihan Umum', 'pemerintahan', ''],
  ['TNI', 'Tentara Nasional Indonesia', 'pemerintahan', ''],
  ['Polri', 'Kepolisian Negara Republik Indonesia', 'pemerintahan', ''],
  ['Kemenag', 'Kementerian Agama', 'pemerintahan', ''],
  ['Kemenkes', 'Kementerian Kesehatan', 'pemerintahan', ''],
  ['Kemenkeu', 'Kementerian Keuangan', 'pemerintahan', ''],
  ['Kemensos', 'Kementerian Sosial', 'pemerintahan', ''],
  ['Kemenhub', 'Kementerian Perhubungan', 'pemerintahan', ''],
  ['Kemkomdigi', 'Kementerian Komunikasi dan Digital', 'pemerintahan', ''],
  ['Kemendikdasmen', 'Kementerian Pendidikan Dasar dan Menengah', 'pemerintahan', ''],
  ['Pemprov', 'Pemerintah Provinsi', 'pemerintahan', ''],
  ['Pemkot', 'Pemerintah Kota', 'pemerintahan', ''],
  ['Pemkab', 'Pemerintah Kabupaten', 'pemerintahan', ''],
  ['Pemda', 'Pemerintah Daerah', 'pemerintahan', ''],
  ['BPS', 'Badan Pusat Statistik', 'pemerintahan', ''],
  ['BKN', 'Badan Kepegawaian Negara', 'pemerintahan', ''],
  ['Bappenas', 'Badan Perencanaan Pembangunan Nasional', 'pemerintahan', ''],
  ['KUA', 'Kantor Urusan Agama', 'pemerintahan', ''],
  // Pendidikan
  ['SD', 'Sekolah Dasar', 'pendidikan', ''],
  ['SMP', 'Sekolah Menengah Pertama', 'pendidikan', ''],
  ['SMA', 'Sekolah Menengah Atas', 'pendidikan', ''],
  ['SMK', 'Sekolah Menengah Kejuruan', 'pendidikan', ''],
  ['MI', 'Madrasah Ibtidaiyah', 'pendidikan', 'setara SD'],
  ['MTs', 'Madrasah Tsanawiyah', 'pendidikan', 'setara SMP'],
  ['MA', 'Madrasah Aliyah', 'pendidikan', 'setara SMA; jangan tertukar dengan MA (Mahkamah Agung)'],
  ['PTN', 'Perguruan Tinggi Negeri', 'pendidikan', ''],
  ['PTS', 'Perguruan Tinggi Swasta', 'pendidikan', ''],
  ['S1', 'Strata 1 (sarjana)', 'pendidikan', ''],
  ['S2', 'Strata 2 (magister)', 'pendidikan', ''],
  ['S3', 'Strata 3 (doktor)', 'pendidikan', ''],
  ['D3', 'Diploma 3', 'pendidikan', ''],
  ['IPK', 'Indeks Prestasi Kumulatif', 'pendidikan', ''],
  ['IPS', 'Indeks Prestasi Semester', 'pendidikan', ''],
  ['KKN', 'Kuliah Kerja Nyata', 'pendidikan', ''],
  ['PKL', 'Praktik Kerja Lapangan', 'pendidikan', 'juga berarti Pedagang Kaki Lima'],
  ['OSIS', 'Organisasi Siswa Intra Sekolah', 'pendidikan', ''],
  ['UTBK', 'Ujian Tulis Berbasis Komputer', 'pendidikan', 'seleksi masuk PTN'],
  ['SNBP', 'Seleksi Nasional Berdasarkan Prestasi', 'pendidikan', ''],
  ['SNBT', 'Seleksi Nasional Berdasarkan Tes', 'pendidikan', ''],
  ['MPLS', 'Masa Pengenalan Lingkungan Sekolah', 'pendidikan', ''],
  ['CPNS', 'Calon Pegawai Negeri Sipil', 'pendidikan', ''],
  ['PNS', 'Pegawai Negeri Sipil', 'pendidikan', ''],
  ['PPPK', 'Pegawai Pemerintah dengan Perjanjian Kerja', 'pendidikan', ''],
  ['ASN', 'Aparatur Sipil Negara', 'pendidikan', ''],
  ['SKD', 'Seleksi Kompetensi Dasar', 'pendidikan', 'tahap seleksi CPNS'],
  ['SKB', 'Seleksi Kompetensi Bidang', 'pendidikan', 'tahap seleksi CPNS'],
  ['TOEFL', 'Test of English as a Foreign Language', 'pendidikan', 'tes bahasa Inggris'],
  ['IELTS', 'International English Language Testing System', 'pendidikan', 'tes bahasa Inggris'],
  // Teknologi
  ['HP', 'Handphone (telepon genggam)', 'teknologi', ''],
  ['WA', 'WhatsApp', 'teknologi', ''],
  ['IG', 'Instagram', 'teknologi', ''],
  ['AI', 'Artificial Intelligence (kecerdasan buatan)', 'teknologi', ''],
  ['IT', 'Information Technology (teknologi informasi)', 'teknologi', ''],
  ['URL', 'Uniform Resource Locator', 'teknologi', 'alamat halaman web'],
  ['HTML', 'HyperText Markup Language', 'teknologi', 'bahasa dasar halaman web'],
  ['CSS', 'Cascading Style Sheets', 'teknologi', 'pengatur tampilan web'],
  ['JS', 'JavaScript', 'teknologi', 'bahasa pemrograman web'],
  ['API', 'Application Programming Interface', 'teknologi', 'penghubung antar program'],
  ['CPU', 'Central Processing Unit', 'teknologi', 'prosesor'],
  ['RAM', 'Random Access Memory', 'teknologi', 'memori kerja'],
  ['ROM', 'Read-Only Memory', 'teknologi', 'memori baca saja'],
  ['USB', 'Universal Serial Bus', 'teknologi', 'colokan serbaguna'],
  ['WiFi', 'Wireless Fidelity', 'teknologi', 'internet nirkabel'],
  ['GPS', 'Global Positioning System', 'teknologi', 'penentu lokasi'],
  ['SIM', 'Subscriber Identity Module', 'teknologi', 'kartu SIM; jangan tertukar dengan SIM (Surat Izin Mengemudi)'],
  ['OTP', 'One-Time Password', 'teknologi', 'kode sekali pakai'],
  ['PIN', 'Personal Identification Number', 'teknologi', 'kode rahasia angka'],
  ['PDF', 'Portable Document Format', 'teknologi', 'format dokumen'],
  ['JPEG', 'Joint Photographic Experts Group', 'teknologi', 'format foto'],
  ['PNG', 'Portable Network Graphics', 'teknologi', 'format gambar'],
  ['QR', 'Quick Response', 'teknologi', 'kode QR'],
  ['CCTV', 'Closed-Circuit Television', 'teknologi', 'kamera pengawas'],
  ['LED', 'Light-Emitting Diode', 'teknologi', 'lampu diode'],
  ['LCD', 'Liquid Crystal Display', 'teknologi', 'layar kristal cair'],
  ['AC', 'Air Conditioner (pendingin ruangan)', 'teknologi', ''],
  // Kesehatan
  ['RS', 'Rumah Sakit', 'kesehatan', ''],
  ['RSUD', 'Rumah Sakit Umum Daerah', 'kesehatan', ''],
  ['Puskesmas', 'Pusat Kesehatan Masyarakat', 'kesehatan', ''],
  ['Posyandu', 'Pos Pelayanan Terpadu', 'kesehatan', 'layanan kesehatan ibu dan anak'],
  ['IGD', 'Instalasi Gawat Darurat', 'kesehatan', ''],
  ['UGD', 'Unit Gawat Darurat', 'kesehatan', ''],
  ['ICU', 'Intensive Care Unit (ruang perawatan intensif)', 'kesehatan', ''],
  ['BPJS', 'Badan Penyelenggara Jaminan Sosial', 'kesehatan', ''],
  ['JKN', 'Jaminan Kesehatan Nasional', 'kesehatan', ''],
  ['KIS', 'Kartu Indonesia Sehat', 'kesehatan', ''],
  ['ASI', 'Air Susu Ibu', 'kesehatan', ''],
  ['KB', 'Keluarga Berencana', 'kesehatan', ''],
  ['HIV', 'Human Immunodeficiency Virus', 'kesehatan', 'virus penyebab AIDS'],
  ['AIDS', 'Acquired Immune Deficiency Syndrome', 'kesehatan', ''],
  ['DBD', 'Demam Berdarah Dengue', 'kesehatan', ''],
  ['TBC', 'Tuberkulosis', 'kesehatan', ''],
  ['ISPA', 'Infeksi Saluran Pernapasan Akut', 'kesehatan', ''],
  ['BMI', 'Body Mass Index (indeks massa tubuh)', 'kesehatan', ''],
  ['KIA', 'Kesehatan Ibu dan Anak', 'kesehatan', ''],
  // Keuangan
  ['ATM', 'Anjungan Tunai Mandiri', 'keuangan', ''],
  ['NPWP', 'Nomor Pokok Wajib Pajak', 'keuangan', ''],
  ['PPh', 'Pajak Penghasilan', 'keuangan', ''],
  ['PPN', 'Pajak Pertambahan Nilai', 'keuangan', ''],
  ['KPR', 'Kredit Pemilikan Rumah', 'keuangan', ''],
  ['KUR', 'Kredit Usaha Rakyat', 'keuangan', ''],
  ['UMKM', 'Usaha Mikro, Kecil, dan Menengah', 'keuangan', ''],
  ['BUMN', 'Badan Usaha Milik Negara', 'keuangan', ''],
  ['BUMD', 'Badan Usaha Milik Daerah', 'keuangan', ''],
  ['APBN', 'Anggaran Pendapatan dan Belanja Negara', 'keuangan', ''],
  ['APBD', 'Anggaran Pendapatan dan Belanja Daerah', 'keuangan', ''],
  ['OJK', 'Otoritas Jasa Keuangan', 'keuangan', ''],
  ['BI', 'Bank Indonesia', 'keuangan', 'bank sentral'],
  ['LPS', 'Lembaga Penjamin Simpanan', 'keuangan', ''],
  ['QRIS', 'Quick Response Code Indonesian Standard', 'keuangan', 'kode QR pembayaran'],
  ['DP', 'Down Payment (uang muka)', 'keuangan', ''],
  ['THR', 'Tunjangan Hari Raya', 'keuangan', ''],
  ['UMP', 'Upah Minimum Provinsi', 'keuangan', ''],
  ['UMK', 'Upah Minimum Kabupaten/Kota', 'keuangan', ''],
  // Transportasi
  ['SIM', 'Surat Izin Mengemudi', 'transportasi', 'jangan tertukar dengan SIM (kartu SIM)'],
  ['STNK', 'Surat Tanda Nomor Kendaraan', 'transportasi', ''],
  ['BPKB', 'Buku Pemilik Kendaraan Bermotor', 'transportasi', ''],
  ['KRL', 'Kereta Rel Listrik', 'transportasi', ''],
  ['MRT', 'Mass Rapid Transit (Moda Raya Terpadu)', 'transportasi', ''],
  ['LRT', 'Light Rail Transit (Lintas Rel Terpadu)', 'transportasi', ''],
  ['KAI', 'Kereta Api Indonesia', 'transportasi', 'PT Kereta Api Indonesia'],
  ['SPBU', 'Stasiun Pengisian Bahan Bakar Umum', 'transportasi', 'pom bensin'],
  ['BBM', 'Bahan Bakar Minyak', 'transportasi', ''],
  ['LPG', 'Liquefied Petroleum Gas (gas elpiji)', 'transportasi', ''],
  ['PLN', 'Perusahaan Listrik Negara', 'transportasi', 'listrik'],
  ['PDAM', 'Perusahaan Daerah Air Minum', 'transportasi', 'air bersih'],
];

export const KATEGORI = [
  ['semua', 'Semua kategori'],
  ['umum', 'Umum'],
  ['pemerintahan', 'Pemerintahan'],
  ['pendidikan', 'Pendidikan'],
  ['teknologi', 'Teknologi'],
  ['kesehatan', 'Kesehatan'],
  ['keuangan', 'Keuangan'],
  ['transportasi', 'Transportasi & Utilitas'],
];

export function cariSingkatan(q, kat) {
  const kata = String(q || '').trim().toLowerCase();
  return SINGKATAN.filter(([s, p, k]) => {
    if (kat && kat !== 'semua' && k !== kat) return false;
    if (!kata) return true;
    return s.toLowerCase().includes(kata) || p.toLowerCase().includes(kata);
  });
}

export function render(root) {
  const cariI = T.input('text', 'Cari singkatan atau kepanjangannya, mis. KTP', '');
  const katI = T.select(KATEGORI, 'semua');
  const box = T.out();

  const tampil = () => {
    const hasil = cariSingkatan(cariI.value, katI.value);
    let h = '<p class="dim">' + hasil.length + ' singkatan ditemukan dari ' + SINGKATAN.length + ' entri.</p>';
    if (!hasil.length) {
      h += '<p class="hint">Tidak ketemu. Coba kata kunci lain, atau cek kategorinya. Singkatan yang kamu cari mungkin belum ada di kamus ini.</p>';
      T.show(box, h);
      return;
    }
    hasil.forEach(([s, p, k, c]) => {
      const katLabel = (KATEGORI.find(([v]) => v === k) || [])[1] || k;
      h += '<div class="kv"><span class="k"><b>' + T.esc(s) + '</b><br/><span class="dim" style="font-size:11px">' + T.esc(katLabel) + '</span></span>' +
        '<span class="v">' + T.esc(p) + (c ? '<br/><span class="dim" style="font-size:12px">' + T.esc(c) + '</span>' : '') +
        ' <button type="button" class="btn" data-salin="' + T.esc(s + ': ' + p) + '" style="padding:2px 8px;font-size:11px;margin-left:4px">Salin</button></span></div>';
    });
    T.show(box, h);
    box.querySelectorAll('[data-salin]').forEach((b) => {
      b.addEventListener('click', () => { T.copy(b.getAttribute('data-salin')); b.textContent = '✓ Tersalin'; });
    });
  };

  cariI.addEventListener('input', tampil);
  katI.addEventListener('change', tampil);

  root.appendChild(T.el('<p class="note">' + SINGKATAN.length + ' singkatan Indonesia yang paling sering muncul. Ketik singkatannya atau kepanjangannya untuk mencari.</p>'));
  root.appendChild(T.grid2(T.field('Cari', cariI), T.field('Kategori', katI)));
  root.appendChild(box);
  tampil();
}
