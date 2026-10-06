import { h as T, utils, beep } from '../../core.js?v=6.9.5';

export const meta = {"id": "kuis-soceng", "name": "Kuis Rekayasa Sosial", "cat": "keamanan", "icon": "🎭", "desc": "Uji kewaspadaanmu: kenali 8 trik rekayasa sosial di telepon, SMS, chat & QR.", "keywords": "rekayasa sosial,social engineering,kuis,penipuan,telepon,sms,whatsapp,keamanan,edukasi"};

// jawab: 'bahaya' | 'aman' — tiap soal WAJIB punya kunci & penjelasan.
export const SOAL = [
  { situasi: '📞 Telepon dari "CS Bank"', isi: '"Selamat siang, saya Rudi dari bank. Sistem kami mendeteksi aktivitas mencurigakan di rekening Bapak. Demi keamanan, mohon sebutkan kode OTP yang baru saja dikirim ke HP Bapak agar akun tidak dibekukan."', jawab: 'bahaya', jelas: 'Bank ASLI tidak pernah meminta OTP atau PIN lewat telepon. Penipu menciptakan kepanikan ("akun dibekukan") agar kamu buru-buru menyerahkan kode.' },
  { situasi: '💬 SMS tak dikenal', isi: '"[JNE] Paket Anda tertahan di gudang karena bea cukai Rp15.000 belum dibayar. Segera bayar di jne-paket-id.com/bayar agar paket dikirim hari ini."', jawab: 'bahaya', jelas: 'Domain jne-paket-id.com BUKAN situs resmi JNE. Modusnya: link palsu yang mencuri data kartu / memasang malware. Cek status paket hanya lewat aplikasi resmi.' },
  { situasi: '💬 Chat WhatsApp nomor baru', isi: '"Halo nak, ini Mama. HP mama rusak jadi pakai nomor baru. Tolong belikan pulsa Rp100 ribu ke nomor ini ya, mama lagi di jalan. Nanti mama ganti."', jawab: 'bahaya', jelas: 'Klasik "mama minta pulsa". Selalu verifikasi lewat panggilan suara/video ke nomor LAMA yang kamu kenal sebelum transfer apapun.' },
  { situasi: '📸 DM Instagram', isi: '"🎉 SELAMAT! Kamu terpilih sebagai pemenang GIVEAWAY iPhone 17 Pro dari akun kami! Isi form ini (nama, alamat, no. HP) + bayar ongkir Rp50rb untuk klaim hadiahmu."', jawab: 'bahaya', jelas: 'Giveaway asli tidak meminta data pribadi lengkap apalagi "biaya ongkir" di muka. Itu pancingan untuk mencuri data + uangmu.' },
  { situasi: '🏪 QRIS di warung', isi: 'Di meja kasir warung langgananmu ada stiker QRIS baru yang ditempel MENUTUPI QR lama. Kasir tidak sadar. Kamu hendak bayar Rp25.000 dengan scan QR itu.', jawab: 'bahaya', jelas: 'Modus "QR ditempel": penipu menimpa QR merchant dengan QR miliknya. Selalu cek nama merchant yang muncul di aplikasi sebelum bayar — kalau beda, jangan lanjutkan.' },
  { situasi: '✈️ Telegram: tawaran kerja', isi: '"Kami dari perusahaan e-commerce butuh freelancer. Tugas mudah: like & follow akun, gaji Rp300rb/hari. Untuk aktivasi akun kerja, deposit Rp200rb dulu (nanti dikembalikan + bonus)."', jawab: 'bahaya', jelas: 'Pekerjaan asli TIDAK PERNAH meminta deposit di muka. "Tugas mudah gaji besar" = umpan; depositnya yang mereka incar.' },
  { situasi: '📞 Telepon dari "Bank"', isi: '"Halo, kami dari bank. Terlihat ada percobaan login aneh di akun Bapak. Kami TIDAK butuh password atau OTP Bapak — silakan ganti password lewat aplikasi resmi bank, atau datang ke cabang terdekat."', jawab: 'aman', jelas: 'Ini perilaku penelepon yang benar: tidak meminta data rahasia apapun dan mengarahkanmu ke kanal resmi. Tetap waspada, tapi skenario ini aman.' },
  { situasi: '📲 Notifikasi aplikasi bank', isi: 'Aplikasi m-banking resmimu menampilkan: "Login baru terdeteksi dari perangkat lain di Surabaya. Jika ini bukan Anda, segera amankan akun lewat menu Pengaturan > Keamanan di aplikasi ini."', jawab: 'aman', jelas: 'Notifikasi dari aplikasi resmi yang menyuruhmu bertindak DI DALAM aplikasi itu sendiri = aman. Yang berbahaya adalah yang menyuruh klik link / hubungi nomor dari pesan.' },
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
      '<div style="font-size:14px;margin-bottom:10px"><b>' + T.esc(s.situasi) + '</b></div>' +
      '<div style="font-size:13px;line-height:1.7;color:#d4d4d8;border-top:1px solid #ffffff10;padding-top:10px;font-style:italic">"' + T.esc(s.isi) + '"</div></div>' +
      '<div style="font-size:14px;margin:14px 0 6px"><b>Situasi ini…</b></div>'
    );
    const bB = T.btn('⚠️ Berbahaya', () => jawab('bahaya'), true);
    const bA = T.btn('🛡️ Aman', () => jawab('aman'), false);
    const btnRow = T.row(bB, bA);
    box.appendChild(btnRow);
  }

  function jawab(tebakan) {
    if (terkunci) return;
    terkunci = true;
    const s = SOAL[idx];
    const benar = nilaiJawaban(s, tebakan);
    if (benar) { skor++; try { beep(880, 0.12, 'sine'); } catch (e) {} }
    else { try { beep(220, 0.2, 'square'); } catch (e) {} }
    const labelJawab = s.jawab === 'bahaya' ? 'BERBAHAYA ⚠️ (rekayasa sosial)' : 'AMAN 🛡️';
    const fb = T.el('<div style="margin-top:12px;border-radius:10px;padding:12px;font-size:13px;line-height:1.6;border:1px solid ' +
      (benar ? '#22c55e' : '#ef4444') + ';background:' + (benar ? 'rgba(34,197,94,.08)' : 'rgba(239,68,68,.08)') + '">' +
      (benar ? '✅ <b>Benar!</b> Situasi ini <b>' + labelJawab + '</b>.' : '❌ <b>Kurang tepat.</b> Situasi ini sebenarnya <b>' + labelJawab + '</b>.') +
      '<br><span class="dim">💡 ' + T.esc(s.jelas) + '</span></div>');
    box.appendChild(fb);
    const lanjut = T.btn(idx < SOAL.length - 1 ? 'Soal berikutnya →' : 'Lihat hasil 🏁', () => { idx++; idx < SOAL.length ? kartu() : hasil(); }, true);
    const wr = T.el('<div style="margin-top:10px"></div>');
    wr.appendChild(lanjut);
    box.appendChild(wr);
  }

  function hasil() {
    const persen = Math.round(skor / SOAL.length * 100);
    const pesan = persen === 100 ? '🏆 Sempurna! Kamu sulit dimanipulasi. Pertahankan kewaspadaanmu.'
      : persen >= 75 ? '👍 Bagus! Tinggal sedikit lagi menuju detektor rekayasa sosial andal.'
      : persen >= 50 ? '🙂 Lumayan, tapi masih ada celah. Pelajari lagi pola-pola di atas.'
      : '⚠️ Hati-hati! Kamu rentan kena rekayasa sosial. Ingat 3 jurus: verifikasi identitas, jangan terburu-buru, jangan pernah kasih OTP/PIN.';
    T.show(box,
      '<div style="text-align:center;padding:20px 10px">' +
      '<div style="font-size:44px">' + (persen >= 75 ? '🛡️' : '🎭') + '</div>' +
      '<div style="font-size:22px;margin:10px 0"><b>Skor: ' + skor + '/' + SOAL.length + ' (' + persen + '%)</b></div>' +
      '<div style="font-size:13.5px;line-height:1.7;max-width:420px;margin:0 auto">' + T.esc(pesan) + '</div></div>' +
      '<div style="border:1px solid #ffffff20;border-radius:10px;padding:12px;font-size:12.5px;line-height:1.7;margin-top:8px">' +
      '<b>🛡️ Jurus anti-rekayasa sosial:</b><br>1. <b>Verifikasi identitas</b> — telepon balik lewat nomor resmi, bukan nomor penelepon.<br>' +
      '2. Waspadai <b>tekanan waktu & emosi</b> ("segera!", "mama butuh!").<br>' +
      '3. <b>Jangan pernah</b> berikan OTP, PIN, atau password ke siapapun.<br>' +
      '4. Cek <b>nama merchant</b> di aplikasi sebelum bayar QRIS.</div>'
    );
    const ulang = T.btn('🔄 Ulangi kuis', () => { idx = 0; skor = 0; kartu(); });
    const wr = T.el('<div style="margin-top:12px;text-align:center"></div>');
    wr.appendChild(ulang);
    box.appendChild(wr);
  }

  root.append(
    T.el('<p class="dim" style="font-size:13px">Baca tiap skenario (telepon, SMS, chat, QR — <b>bukan email</b>), tebak apakah <b>berbahaya</b> atau <b>aman</b>, lalu lihat penjelasannya.</p>'),
    box
  );
  kartu();
}
