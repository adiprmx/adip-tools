import { h as T, utils, beep, onLeave } from '../../core.js?v=6.9.5';

export const meta = {"id":"tebak-url-palsu","name":"Tebak URL Palsu","cat":"keamanan","icon":"🔗","desc":"Kuis 8 soal: tebak URL asli atau palsu dari tampilannya.","keywords":"url,kuis,phising,typosquatting,edukasi,keamanan,link"};

// jawab: 'asli' | 'palsu' — tiap soal WAJIB punya kunci & penjelasan.
export const SOAL = [
  { url: 'https://www.bca.co.id/id/informasi', jawab: 'asli', jelas: 'Domain resmi bca.co.id, HTTPS aktif, struktur path wajar. Ini situs asli BCA.' },
  { url: 'https://bca-verifikasi.net/login', jawab: 'palsu', jelas: 'Typosquatting: "bca-verifikasi.net" BUKAN bca.co.id. Penipu menempelkan nama bank ke domain milik mereka.' },
  { url: 'https://tokopedia.com.e-promo.xyz/checkout', jawab: 'palsu', jelas: 'Jebakan subdomain: domain aslinya adalah e-promo.xyz — "tokopedia.com" hanya subdomain di depannya. Baca domain dari kanan sebelum tanda /.' },
  { url: 'https://accounts.google.com/signin', jawab: 'asli', jelas: 'Domain resmi accounts.google.com dengan HTTPS. Selalu perhatikan domain penuhnya, bukan cuma kata "google".' },
  { url: 'http://dana.id.verifikasi-akun.com', jawab: 'palsu', jelas: 'Dua bendera merah: pakai http (bukan https) DAN domain aslinya verifikasi-akun.com. Situs resmi DANA adalah dana.id.' },
  { url: 'https://www.go0gle.com', jawab: 'palsu', jelas: 'Typosquatting klasik: huruf "o" diganti angka "0" (go0gle). Sekilas mirip, tapi domain berbeda total.' },
  { url: 'https://www.tokopedia.com', jawab: 'asli', jelas: 'Domain resmi tokopedia.com, HTTPS, tanpa embel-embel subdomain aneh. Aman.' },
  { url: 'https://www.аррӏе.com/id', jawab: 'palsu', jelas: 'IDN homograph: terlihat seperti "apple.com", tapi hurufnya memakai karakter Cyrillic (а, р) yang mirip Latin. Browser modern menandai ini sebagai punycode (xn--). Waspada URL yang "terlihat benar" tapi aneh saat di-copy.' },
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
      '<div style="border:1px solid #ffffff20;border-radius:12px;padding:16px;background:#18181b;text-align:center">' +
      '<div class="dim" style="font-size:11px;margin-bottom:6px">URL berikut…</div>' +
      '<div style="font-family:monospace;font-size:14px;word-break:break-all;line-height:1.6;color:#e4e4e7">' + T.esc(s.url) + '</div></div>' +
      '<div style="font-size:14px;margin:14px 0 6px"><b>Menurutmu, URL ini…</b></div>'
    );
    const bA = T.btn('✅ Asli', () => jawab('asli'), true);
    const bP = T.btn('🎣 Palsu', () => jawab('palsu'), false);
    box.appendChild(T.row(bA, bP));
  }

  function jawab(tebakan) {
    if (terkunci) return;
    terkunci = true;
    const s = SOAL[idx];
    const benar = nilaiJawaban(s, tebakan);
    if (benar) { skor++; try { beep(880, 0.12, 'sine'); } catch (e) {} }
    else { try { beep(220, 0.2, 'square'); } catch (e) {} }
    const fb = T.el('<div style="margin-top:12px;border-radius:10px;padding:12px;font-size:13px;line-height:1.7;border:1px solid ' +
      (benar ? '#22c55e' : '#ef4444') + ';background:' + (benar ? 'rgba(34,197,94,.08)' : 'rgba(239,68,68,.08)') + '">' +
      (benar ? '✅ <b>Benar!</b> URL ini memang <b>' + T.esc(s.jawab) + '</b>.' : '❌ <b>Kurang tepat.</b> URL ini sebenarnya <b>' + T.esc(s.jawab) + '</b>.') +
      '<br><span class="dim">💡 ' + T.esc(s.jelas) + '</span></div>');
    box.appendChild(fb);
    const lanjut = T.btn(idx < SOAL.length - 1 ? 'Soal berikutnya →' : 'Lihat hasil 🏁', () => { idx++; idx < SOAL.length ? kartu() : hasil(); }, true);
    const wr = T.el('<div style="margin-top:10px"></div>');
    wr.appendChild(lanjut);
    box.appendChild(wr);
  }

  function hasil() {
    const persen = Math.round(skor / SOAL.length * 100);
    const pesan = persen === 100 ? '🏆 Sempurna! Matamu tajam membedakan URL asli vs palsu.'
      : persen >= 75 ? '👍 Bagus! Hampir semua jebakan URL berhasil kamu hindari.'
      : persen >= 50 ? '🙂 Lumayan, tapi jebakan subdomain & typosquatting masih lolos. Pelajari triknya di bawah.'
      : '⚠️ Hati-hati! Kamu mudah terkecoh URL palsu. Hafalkan 4 trik di bawah sebelum klik link apa pun.';
    T.show(box,
      '<div style="text-align:center;padding:20px 10px">' +
      '<div style="font-size:44px">' + (persen >= 75 ? '🛡️' : '🔗') + '</div>' +
      '<div style="font-size:22px;margin:10px 0"><b>Skor: ' + skor + '/' + SOAL.length + ' (' + persen + '%)</b></div>' +
      '<div style="font-size:13.5px;line-height:1.7;max-width:420px;margin:0 auto">' + T.esc(pesan) + '</div></div>' +
      '<div style="border:1px solid #ffffff20;border-radius:10px;padding:12px;font-size:12.5px;line-height:1.8;margin-top:8px">' +
      '<b>🔍 4 trik baca URL:</b><br>1. <b>Baca domain dari kanan</b> sebelum tanda / — <span style="font-family:monospace">tokopedia.com.e-promo.xyz</span> itu milik e-promo.xyz.<br>' +
      '2. <b>Typosquatting</b>: perhatikan huruf yang diganti (o→0, l→I) — <span style="font-family:monospace">go0gle.com</span> ≠ google.com.<br>' +
      '3. <b>http vs https</b>: situs login/bank wajib https (gembok). http saja = data bisa disadap.<br>' +
      '4. <b>IDN homograph</b>: huruf asing yang mirip Latin (а Cyrillic vs a). Kalau ragu, ketik alamat manual jangan klik link.</div>'
    );
    const ulang = T.btn('🔄 Ulangi kuis', () => { idx = 0; skor = 0; kartu(); });
    const wr = T.el('<div style="margin-top:12px;text-align:center"></div>');
    wr.appendChild(ulang);
    box.appendChild(wr);
  }

  root.append(
    T.el('<p class="dim" style="font-size:13px">Perhatikan tiap URL baik-baik, tebak <b>asli</b> atau <b>palsu</b>. Fokus ke bagian domainnya!</p>'),
    box
  );
  kartu();
}
