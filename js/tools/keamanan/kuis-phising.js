import { h as T, utils, beep, actx, onLeave } from '../../core.js?v=6.8.0';

export const meta = {"id": "kuis-phising", "name": "Kuis Phising", "cat": "keamanan", "icon": "🎣", "desc": "Uji kemampuanmu membedakan email asli vs phising.", "keywords": "phising,phishing,kuis,email,keamanan,edukasi"};

// jawab: 'phising' | 'asli' — tiap soal WAJIB punya kunci & penjelasan.
export const SOAL = [
  { dari: 'Bank BCA', email: 'info@bca.co.id', subjek: 'Notifikasi transaksi kartu debit', isi: 'Yth. Nasabah, telah terjadi transaksi Rp1.250.000 di kartu debit Anda. Jika bukan Anda, segera hubungi Halo BCA 1500888. Jangan balas email ini.', jawab: 'asli', jelas: 'Domain pengirim resmi (bca.co.id), tidak meminta klik link atau data pribadi — hanya mengarahkan ke nomor resmi bank.' },
  { dari: 'BCA Security', email: 'security@bca-verifikasi.com', subjek: 'URGENT: Akun Anda Akan Diblokir!', isi: 'Akun m-BCA Anda terdeteksi login mencurigakan. Klik http://bca-verifikasi.com/login untuk verifikasi dalam 24 jam atau akun diblokir permanen.', jawab: 'phising', jelas: 'Domain palsu (bca-verifikasi.com ≠ bca.co.id), pakai link http (bukan https), dan menekan rasa panik dengan ancaman blokir — ciri khas phising.' },
  { dari: 'Google', email: 'no-reply@accounts.google.com', subjek: 'Peringatan keamanan: login baru', isi: 'Kami mendeteksi login baru ke akun Google Anda dari perangkat Chrome di Jakarta. Jika ini bukan Anda, tinjau aktivitas di myaccount.google.com.', jawab: 'asli', jelas: 'Domain resmi Google, tidak ada lampiran atau link mencurigakan, dan hanya meminta memeriksa lewat situs resmi yang kamu kunjungi sendiri.' },
  { dari: 'DANA Rewards', email: 'promo@dana-rewards-id.net', subjek: '🎉 Selamat! Anda Menang Rp10 Juta', isi: 'Anda terpilih sebagai pemenang undian DANA! Klaim hadiah dengan mengisi data + kode OTP yang kami kirim ke nomor Anda.', jawab: 'phising', jelas: 'Domain aneh (dana-rewards-id.net), iming-iming hadiah besar, dan meminta kode OTP — perusahaan resmi TIDAK PERNAH meminta OTP lewat email.' },
  { dari: 'Tokopedia', email: 'noreply@tokopedia.com', subjek: 'Pesanan #INV/2026/X/12345 telah dikirim', isi: 'Pesanan Anda sudah dikirim via JNE dengan nomor resi 8829102341. Lacak statusnya di aplikasi Tokopedia.', jawab: 'asli', jelas: 'Domain resmi tokopedia.com, isi spesifik (nomor invoice & resi), tidak meminta data atau klik link aneh.' },
  { dari: 'WhatsApp Support', email: 'support@whatsapp-verification.org', subjek: 'Verifikasi akun WhatsApp Anda', isi: 'Akun WhatsApp Anda akan dinonaktifkan. Unduh file verifikasi terlampir (whatsapp-verify.apk) dan instal untuk mempertahankan akun.', jawab: 'phising', jelas: 'Domain .org palsu, WhatsApp tidak pernah mengirim file .apk lewat email — lampiran aplikasi = hampir pasti malware.' },
  { dari: 'Netflix', email: 'info@mailer.netflix.com', subjek: 'Pembayaran langganan Anda gagal', isi: 'Kami tidak dapat memproses pembayaran bulan ini. Perbarui metode pembayaran Anda di netflix.com (buka lewat aplikasi, jangan dari link email).', jawab: 'asli', jelas: 'Subdomain resmi mailer.netflix.com dan emailnya justru menyuruh buka lewat aplikasi sendiri, bukan lewat link — perilaku aman.' },
  { dari: 'Netflix Billing', email: 'billing@netflix-payment.xyz', subjek: 'Akun Netflix Ditangguhkan — Bayar Sekarang', isi: 'Langganan Anda ditangguhkan. Klik https://netflix-payment.xyz/bayar untuk mengaktifkan kembali dan hindari denda.', jawab: 'phising', jelas: 'Domain .xyz tidak resmi, link mengarah ke situs tiruan untuk mencuri data kartu — selalu ketik netflix.com manual, jangan klik link tagihan.' },
];

export function nilaiJawaban(soal, tebakan) {
  return soal.jawab === tebakan;
}

export function render(root) {
  let idx = 0, skor = 0, terkunci = false;
  const box = T.out();

  function kartu() {
    terkunci = false;
    const s = SOAL[idx];
    T.show(box,
      '<div class="dim" style="font-size:12px;margin-bottom:8px">Soal ' + (idx + 1) + ' dari ' + SOAL.length + ' • Skor: ' + skor + '</div>' +
      '<div style="border:1px solid #ffffff20;border-radius:12px;padding:14px;background:#18181b">' +
      '<div style="font-size:14px;margin-bottom:2px"><b>' + T.esc(s.dari) + '</b></div>' +
      '<div class="dim" style="font-size:12px;margin-bottom:8px;font-family:monospace;word-break:break-all">&lt;' + T.esc(s.email) + '&gt;</div>' +
      '<div style="font-size:13px;margin-bottom:8px"><b>Subjek:</b> ' + T.esc(s.subjek) + '</div>' +
      '<div style="font-size:13px;line-height:1.6;color:#d4d4d8;border-top:1px solid #ffffff10;padding-top:10px">' + T.esc(s.isi) + '</div></div>' +
      '<div style="font-size:14px;margin:14px 0 6px"><b>Email ini…</b></div>'
    );
    const bP = T.btn('🎣 Phising', () => jawab('phising'), true);
    const bA = T.btn('✅ Asli', () => jawab('asli'), false);
    const btnRow = T.row(bP, bA);
    box.appendChild(btnRow);
  }

  function jawab(tebakan) {
    if (terkunci) return;
    terkunci = true;
    const s = SOAL[idx];
    const benar = nilaiJawaban(s, tebakan);
    if (benar) { skor++; try { beep(880, 0.12, 'sine'); } catch (e) {} }
    else { try { beep(220, 0.2, 'square'); } catch (e) {} }
    const fb = T.el('<div style="margin-top:12px;border-radius:10px;padding:12px;font-size:13px;line-height:1.6;border:1px solid ' +
      (benar ? '#22c55e' : '#ef4444') + ';background:' + (benar ? 'rgba(34,197,94,.08)' : 'rgba(239,68,68,.08)') + '">' +
      (benar ? '✅ <b>Benar!</b> Ini memang email <b>' + T.esc(s.jawab) + '</b>.' : '❌ <b>Kurang tepat.</b> Ini sebenarnya email <b>' + T.esc(s.jawab) + '</b>.') +
      '<br><span class="dim">💡 ' + T.esc(s.jelas) + '</span></div>');
    box.appendChild(fb);
    const lanjut = T.btn(idx < SOAL.length - 1 ? 'Soal berikutnya →' : 'Lihat hasil 🏁', () => { idx++; idx < SOAL.length ? kartu() : hasil(); }, true);
    const wr = T.el('<div style="margin-top:10px"></div>');
    wr.appendChild(lanjut);
    box.appendChild(wr);
  }

  function hasil() {
    const persen = Math.round(skor / SOAL.length * 100);
    const pesan = persen === 100 ? '🏆 Sempurna! Kamu sulit dikelabui. Pertahankan kewaspadaanmu.'
      : persen >= 75 ? '👍 Bagus! Tinggal sedikit lagi menuju detektor phising andal.'
      : persen >= 50 ? '🙂 Lumayan, tapi masih ada celah. Pelajari lagi ciri-ciri phising di atas.'
      : '⚠️ Hati-hati! Kamu rentan kena phising. Ingat 3 jurus: cek domain pengirim, jangan klik link panik, jangan pernah kasih OTP.';
    T.show(box,
      '<div style="text-align:center;padding:20px 10px">' +
      '<div style="font-size:44px">' + (persen >= 75 ? '🛡️' : '🎣') + '</div>' +
      '<div style="font-size:22px;margin:10px 0"><b>Skor: ' + skor + '/' + SOAL.length + ' (' + persen + '%)</b></div>' +
      '<div style="font-size:13.5px;line-height:1.7;max-width:420px;margin:0 auto">' + T.esc(pesan) + '</div></div>' +
      '<div style="border:1px solid #ffffff20;border-radius:10px;padding:12px;font-size:12.5px;line-height:1.7;margin-top:8px">' +
      '<b>🛡️ Jurus anti-phising:</b><br>1. Selalu cek <b>domain</b> pengirim (bca.co.id vs bca-verifikasi.com).<br>' +
      '2. Waspadai rasa <b>panik/terburu-buru</b> ("24 jam atau diblokir").<br>' +
      '3. Jangan klik link tagihan — <b>ketik alamat situs manual</b>.<br>' +
      '4. Perusahaan resmi <b>tidak pernah</b> meminta OTP/kata sandi via email.</div>'
    );
    const ulang = T.btn('🔄 Ulangi kuis', () => { idx = 0; skor = 0; kartu(); });
    const wr = T.el('<div style="margin-top:12px;text-align:center"></div>');
    wr.appendChild(ulang);
    box.appendChild(wr);
  }

  root.append(
    T.el('<p class="dim" style="font-size:13px">Baca tiap contoh email, tebak apakah <b>phising</b> atau <b>asli</b>, lalu lihat penjelasannya. Fokus ke alamat pengirimnya!</p>'),
    box
  );
  kartu();
}
