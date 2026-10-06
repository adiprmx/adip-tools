import { h as T, utils, beep, onLeave } from '../../core.js?v=6.9.5';

export const meta = {"id":"simulasi-otp-scam","name":"Simulator Scam OTP","cat":"keamanan","icon":"💬","desc":"Simulasi chat: 'CS bank' minta kode OTP. Uji pilihanmu, aman tanpa risiko.","keywords":"otp,scam,simulasi,chat,edukasi,keamanan,bank,social engineering"};

// tiap langkah: pesan scammer + daftar pilihan (label, poin 0-2, feedback)
export const NASKAH = [
  { dari: 'CS Bank', teks: 'Halo, saya Rina dari layanan pelanggan Bank. Kami mendeteksi upaya login mencurigakan di m-banking Bapak/Ibu dari perangkat asing. Untuk mengamankan akun, saya butuh kode OTP yang baru saja masuk ke SMS Anda.',
    opsi: [
      { label: '📩 Berikan kode OTP-nya', poin: 0, fb: '⛔ BAHAYA! Kode OTP = kunci rekeningmu. Begitu diberikan, saldo bisa dikuras dalam hitungan detik dan tidak bisa dibatalkan.' },
      { label: '❓ Kenapa bank minta OTP? Bukannya rahasia?', poin: 1, fb: '👍 Pertanyaan bagus — memang OTP itu rahasia dan bank asli tidak pernah memintanya. Tapi penipu bisa berdalih meyakinkan; cara paling aman tetap akhiri percakapan.' },
      { label: '🛑 Tolak. Saya hubungi bank langsung lewat nomor resmi', poin: 2, fb: '✅ TEPAT! Ini satu-satunya respons aman: tutup chat, lalu hubungi bank lewat nomor/aplikasi resmi yang kamu buka sendiri.' },
    ] },
  { dari: 'CS Bank', teks: 'Mohon pengertiannya, ini prosedur darurat. Kalau Bapak/Ibu tidak verifikasi dalam 5 menit, rekening akan DIBLOKIR otomatis dan dana ditahan 30 hari.',
    opsi: [
      { label: '😨 Panik & berikan OTP biar tidak diblokir', poin: 0, fb: '⛔ Itu yang mereka mau: kamu panik lalu bertindak tanpa berpikir. Ancaman blokir dadakan = ciri khas penipu. Bank asli tidak memblokir sepihak lewat WA.' },
      { label: '⏸️ Minta waktu berpikir dulu', poin: 1, fb: '🙂 Menunda itu lebih baik daripada panik, tapi penipu akan terus menekanmu. Jangan lanjutkan percakapan — akhiri saja.' },
      { label: '📵 Blokir nomor ini & lapor ke bank resmi', poin: 2, fb: '✅ SEMPURNA. Penekanan waktu ("5 menit!") adalah senjata utama social engineering. Blokir, lalu verifikasi mandiri lewat kanal resmi.' },
    ] },
  { dari: 'CS Bank', teks: 'Baik, sebagai alternatif Bapak/Ibu cukup sebutkan 3 digit CVV di belakang kartu debit. Itu saja, tidak perlu OTP.',
    opsi: [
      { label: '💳 Berikan CVV-nya', poin: 0, fb: '⛔ CVV sama berbahayanya dengan OTP — dengan nomor kartu + CVV, penipu bisa belanja online atas namamu. Jangan pernah berikan ke siapa pun.' },
      { label: '🔎 Cek dulu nomor pengirimnya ke situs bank', poin: 1, fb: '👍 Niat memverifikasi itu bagus, tapi jangan sambil terus ngobrol dengan penipunya. Akhiri dulu, verifikasi kemudian.' },
      { label: '🚫 Tidak! Saya tutup chat ini sekarang', poin: 2, fb: '✅ BENAR. Mau OTP, CVV, PIN, atau password — semuanya dilarang keras dibagikan. Tidak ada "alternatif" yang aman.' },
    ] },
  { dari: 'CS Bank', teks: 'Terakhir, untuk membuktikan Anda pemilik sah, sebutkan PIN m-banking Anda. Data kami tunjukkan PIN Anda diawali angka 4, betul?',
    opsi: [
      { label: '😲 Kok tahu?! Lalu sebutkan PIN lengkap', poin: 0, fb: '⛔ Itu tebakan / info bocor — jangan terpancing! PIN lengkap + data lain = akses penuh ke rekeningmu. Segera ganti PIN & lapor bank.' },
      { label: '🤔 Ragu-ragu, tidak menjawab', poin: 1, fb: '🙂 Diam lebih baik daripada menjawab, tapi keraguanmu bisa dimanfaatkan ("tenang, ini prosedur resmi kok"). Tegas akhiri percakapan.' },
      { label: '📞 Tutup & telepon Halo Bank dari aplikasi resmi', poin: 2, fb: '✅ TEPAT SEKALI. Tidak ada verifikasi sah yang meminta PIN. Selalu inisiatif menghubungi sendiri — jangan pernah lewat nomor yang menghubungi duluan.' },
    ] },
];

const SKOR_MAKS = NASKAH.reduce((a, s) => a + Math.max(...s.opsi.map(o => o.poin)), 0);

export function render(root) {
  let idx = 0, skor = 0;
  const box = T.out();

  function bubble(pengirim, teks, kanan) {
    return '<div style="display:flex;justify-content:' + (kanan ? 'flex-end' : 'flex-start') + ';margin-bottom:8px">' +
      '<div style="max-width:85%;border-radius:12px;padding:10px 12px;font-size:13px;line-height:1.6;' +
      (kanan ? 'background:#3b82f6;color:#fff' : 'background:#27272a;border:1px solid #ffffff20') + '">' +
      (kanan ? '' : '<div class="dim" style="font-size:11px;margin-bottom:4px">📞 ' + T.esc(pengirim) + ' <span style="color:#ef4444">• nomor tak dikenal</span></div>') +
      T.esc(teks) + '</div></div>';
  }

  function langkah() {
    const s = NASKAH[idx];
    let html = '<div class="dim" style="font-size:12px;margin-bottom:8px">Langkah ' + (idx + 1) + ' dari ' + NASKAH.length + ' • Poin: ' + skor + '</div>';
    for (let i = 0; i <= idx; i++) html += bubble(NASKAH[i].dari, NASKAH[i].teks, false);
    html += '<div style="font-size:14px;margin:12px 0 6px"><b>Responsmu:</b></div>';
    T.show(box, html);
    s.opsi.forEach(o => {
      const b = T.btn(o.label, () => pilih(o), false);
      b.style.display = 'block'; b.style.width = '100%'; b.style.marginBottom = '8px'; b.style.textAlign = 'left';
      box.appendChild(b);
    });
  }

  function pilih(o) {
    skor += o.poin;
    try { beep(o.poin === 2 ? 880 : o.poin === 1 ? 660 : 220, 0.15, o.poin === 0 ? 'square' : 'sine'); } catch (e) {}
    let html = '<div class="dim" style="font-size:12px;margin-bottom:8px">Langkah ' + (idx + 1) + ' dari ' + NASKAH.length + ' • Poin: ' + skor + '</div>';
    for (let i = 0; i <= idx; i++) html += bubble(NASKAH[i].dari, NASKAH[i].teks, false);
    html += bubble('Kamu', o.label, true);
    const warna = o.poin === 2 ? '#22c55e' : o.poin === 1 ? '#fbbf24' : '#ef4444';
    html += '<div style="margin:10px 0;border-radius:10px;padding:12px;font-size:13px;line-height:1.7;border:1px solid ' + warna + ';background:' + warna + '14">' + T.esc(o.fb) + '</div>';
    T.show(box, html);
    const lanjut = T.btn(idx < NASKAH.length - 1 ? 'Lanjut →' : 'Lihat hasil 🏁', () => { idx++; idx < NASKAH.length ? langkah() : hasil(); }, true);
    const wr = T.el('<div style="margin-top:10px"></div>');
    wr.appendChild(lanjut);
    box.appendChild(wr);
  }

  function hasil() {
    const persen = Math.round(skor / SKOR_MAKS * 100);
    const pesan = persen === 100 ? '🏆 Sempurna! Kamu tidak bisa dikelabui modus OTP. Pertahankan.'
      : persen >= 62 ? '👍 Bagus! Kamu waspada, tapi tetap ingat: satu-satunya respons aman adalah mengakhiri percakapan.'
      : '⚠️ Berbahaya! Dalam simulasi ini saldomu sudah raib. Ingat aturan emasnya di bawah ini.';
    T.show(box,
      '<div style="text-align:center;padding:20px 10px">' +
      '<div style="font-size:44px">' + (persen >= 62 ? '🛡️' : '💸') + '</div>' +
      '<div style="font-size:22px;margin:10px 0"><b>Skor: ' + skor + '/' + SKOR_MAKS + ' (' + persen + '%)</b></div>' +
      '<div style="font-size:13.5px;line-height:1.7;max-width:420px;margin:0 auto">' + T.esc(pesan) + '</div></div>' +
      '<div style="border:1px solid #ffffff20;border-radius:10px;padding:12px;font-size:12.5px;line-height:1.7;margin-top:8px">' +
      '<b>🔑 Aturan emas OTP:</b><br>1. Bank / e-wallet / marketplace asli <b>TIDAK PERNAH</b> meminta OTP, PIN, CVV, atau password lewat telepon, WA, SMS, atau email.<br>' +
      '2. Kode OTP yang masuk ke HP-mu = <b>tanda tangan digitalmu</b>. Memberikannya = menyetujui transaksi.<br>' +
      '3. Kalau dihubungi "CS": <b>tutup</b>, lalu hubungi nomor resmi dari situs/aplikasi bank yang kamu buka sendiri.<br>' +
      '4. Waspadai <b>tekanan waktu</b> ("5 menit!") — itu senjata penipu agar kamu panik.</div>'
    );
    const ulang = T.btn('🔄 Ulangi simulasi', () => { idx = 0; skor = 0; langkah(); });
    const wr = T.el('<div style="margin-top:12px;text-align:center"></div>');
    wr.appendChild(ulang);
    box.appendChild(wr);
  }

  root.append(
    T.el('<p class="dim" style="font-size:13px">💬 Simulasi chat <b>100% aman</b> — tidak ada data asli yang diminta. Pilih responsmu di tiap langkah, lalu lihat penjelasannya.</p>'),
    box
  );
  langkah();
}
