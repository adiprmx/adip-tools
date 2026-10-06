import { h as T, utils, beep, onLeave } from '../../core.js?v=6.9.5';

export const meta = {"id":"kamus-penipuan","name":"Kamus Modus Penipuan","cat":"keamanan","icon":"📖","desc":"Kenali 8 modus penipuan populer di Indonesia: ciri-ciri & cara menghindarnya.","keywords":"penipuan,scam,modus,edukasi,keamanan,phising,otp,apk,pinjol"};

export const MODUS = [
  { nama: 'OTP Palsu / Social Engineering', ikon: '🔑',
    ciri: ['Mengaku CS bank, kurir, atau "pusat bantuan" lewat WA/telepon.', 'Meminta kode OTP, PIN, atau CVV yang masuk ke SMS kamu.', 'Menekan dengan rasa panik: "akun akan diblokir dalam 10 menit!".'],
    hindar: ['Bank asli TIDAK PERNAH meminta OTP lewat telepon/WA.', 'Jangan pernah berikan kode OTP ke siapa pun — itu kunci rekeningmu.', 'Tutup telepon, hubungi nomor resmi bank dari situsnya langsung.'] },
  { nama: 'Undangan / File APK', ikon: '📦',
    ciri: ['Menerima file "UndanganPernikahan.apk" atau "Paket.apk" via WA.', 'Diminta menginstal aplikasi di luar Play Store.', 'Setelah instal, SMS banking dibajak & saldo raib.'],
    hindar: ['JANGAN instal file .apk dari chat — blokir & hapus.', 'Aktifkan Play Protect & hanya instal dari toko resmi.', 'Kalau terlanjur instal: aktifkan mode pesawat, uninstall, ganti PIN & lapor bank.'] },
  { nama: 'Kurir Paket Fiktif', ikon: '🚚',
    ciri: ['SMS/WA "Paket Anda tertahan, klik link untuk bayar ongkir".', 'Link mengarah ke situs tiruan jasa kirim.', 'Diminta isi data kartu / transfer "biaya admin".'],
    hindar: ['Cek resi langsung di aplikasi/situs resmi jasa kirim.', 'Jasa kirim tidak pernah menagih via link chat.', 'Jangan klik link dari nomor tak dikenal.'] },
  { nama: 'Giveaway / Hadiah Palsu', ikon: '🎁',
    ciri: ['DM "Selamat! Anda menang Rp10 juta" dari akun tiruan artis/brand.', 'Diminta bayar "pajak hadiah" / isi data + OTP.', 'Akun centang biru palsu atau nama mirip (official_ vs official).'],
    hindar: ['Tidak ada hadiah gratis yang meminta kamu membayar dulu.', 'Cek akun resmi dari situs brand-nya, bukan dari DM.', 'Laporkan & blokir akunnya.'] },
  { nama: 'Pinjol Ilegal', ikon: '💸',
    ciri: ['Iklan pinjaman cair 5 menit tanpa syarat di medsos.', 'Bunga & denda tidak jelas, tenor sangat pendek.', 'Teror: sebar data pribadi & hubungi semua kontakmu.'],
    hindar: ['Cek daftar pinjol legal di situs OJK (ojk.go.id) sebelum meminjam.', 'Jangan beri akses kontak/galeri ke aplikasi pinjaman.', 'Laporkan pinjol ilegal ke OJK / Satgas PASTI.'] },
  { nama: 'Trading / Investasi Bodong', ikon: '📈',
    ciri: ['Iming-iming profit tetap 10–20% per bulan, "pasti untung".', 'Disuruh deposit ke rekening pribadi / "mentor".', 'Awalnya bisa withdraw kecil (umpan), lalu dana dikunci.'],
    hindar: ['Ingat: return tinggi = risiko tinggi. Profit "pasti" = bendera merah.', 'Cek izin di Bappebti/OJK sebelum setor dana.', 'Jangan transfer ke rekening atas nama pribadi.'] },
  { nama: 'Love Scam / Romance Scam', ikon: '💔',
    ciri: ['Kenalan romantis online yang terlalu sempurna & cepat sayang.', 'Selalu ada alasan tidak bisa video call / ketemu.', 'Ujung-ujungnya minta transfer: "tiket", "bea cukai", "modal usaha".'],
    hindar: ['Jangan kirim uang ke orang yang belum pernah kamu temui.', 'Cek foto profilnya dengan reverse image search.', 'Ceritakan ke teman/keluarga — sudut pandang luar melihat lebih jernih.'] },
  { nama: 'Segitiga Marketplace', ikon: '🔺',
    ciri: ['Penjual mengarahkan transaksi keluar aplikasi ("biar bebas ongkir").', 'Diminta transfer ke rekening yang beda nama dengan toko.', 'Barang tidak dikirim; penjual asli tidak tahu-menahu.'],
    hindar: ['Selalu transaksi di DALAM aplikasi marketplace (ada proteksi).', 'Jangan transfer ke rekening pribadi yang diarahkan via chat.', 'Waspada harga jauh di bawah pasaran.'] },
];

export function render(root) {
  const box = T.out();
  const cari = T.input('text', '🔍 Cari modus, misal: otp, apk, pinjol…');
  cari.style.marginBottom = '10px';
  root.append(
    T.el('<p class="dim" style="font-size:13px">Kenali polanya sebelum jadi korban. Klik kartu untuk melihat cara menghindar.</p>'),
    cari, box
  );

  function tampilkan(q) {
    const s = (q || '').toLowerCase().trim();
    const hasil = MODUS.filter(m =>
      !s || m.nama.toLowerCase().includes(s) ||
      m.ciri.join(' ').toLowerCase().includes(s) ||
      m.hindar.join(' ').toLowerCase().includes(s)
    );
    if (!hasil.length) {
      T.show(box, '<div class="dim" style="font-size:13px;padding:16px;text-align:center">Tidak ada modus yang cocok dengan pencarianmu.<br>Coba kata kunci lain.</div>');
      return;
    }
    let html = '';
    hasil.forEach((m, i) => {
      html += '<details style="border:1px solid #ffffff20;border-radius:10px;padding:12px;margin-bottom:10px;background:#18181b">' +
        '<summary style="cursor:pointer;font-size:14px;list-style:none"><span style="font-size:18px;margin-right:8px">' + m.ikon + '</span><b>' + T.esc(m.nama) + '</b>' +
        '<span class="dim" style="float:right;font-size:11px;margin-top:4px">buka ▾</span></summary>' +
        '<div style="margin-top:10px;font-size:13px;line-height:1.7">' +
        '<div style="margin-bottom:8px"><b style="color:#fbbf24">⚠️ Ciri-ciri:</b><ul style="margin:6px 0;padding-left:20px;color:#d4d4d8">' +
        m.ciri.map(c => '<li>' + T.esc(c) + '</li>').join('') + '</ul></div>' +
        '<div><b style="color:#22c55e">🛡️ Cara menghindar:</b><ul style="margin:6px 0;padding-left:20px;color:#d4d4d8">' +
        m.hindar.map(c => '<li>' + T.esc(c) + '</li>').join('') + '</ul></div>' +
        '</div></details>';
    });
    T.show(box, html);
    try { beep(660, 0.06, 'sine'); } catch (e) {}
  }

  cari.addEventListener('input', () => tampilkan(cari.value));
  tampilkan('');
}
