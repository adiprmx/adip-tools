import { h as T, utils, beep, onLeave } from '../../core.js?v=6.9.5';

export const meta = {"id":"audit-hp","name":"Audit Keamanan HP","cat":"keamanan","icon":"📱","desc":"Checklist 12 poin keamanan HP dengan skor 0–100 + saran perbaikan.","keywords":"audit,keamanan,hp,android,checklist,skor,2fa,backup,privasi"};

// bobot total = 100
export const ITEMS = [
  { t: 'Kunci layar aktif', d: 'PIN / pola / sidik jari / face unlock — HP terkunci otomatis saat tidak dipakai.', b: 10,
    saran: 'Aktifkan kunci layar di Pengaturan → Keamanan. Pilih PIN 6 digit atau biometrik, dan set kunci otomatis ≤ 1 menit.' },
  { t: 'OS & aplikasi selalu update', d: 'Update menambal celah keamanan yang dieksploitasi malware.', b: 10,
    saran: 'Cek Pengaturan → Pembaruan perangkat lunak. Aktifkan update otomatis untuk OS dan aplikasi.' },
  { t: '2FA aktif di akun penting', d: 'Verifikasi 2 langkah di Google/Apple, email, bank, dan e-wallet.', b: 10,
    saran: 'Aktifkan 2FA di akun Google (myaccount.google.com), Apple ID, dan semua aplikasi bank/e-wallet. Pakai aplikasi authenticator, bukan SMS bila memungkinkan.' },
  { t: 'Tidak instal APK dari luar toko resmi', d: 'File .apk dari chat/situs acak adalah jalur utama malware pencuri SMS banking.', b: 9,
    saran: 'Hanya instal dari Play Store / App Store. Matikan "instal aplikasi tidak dikenal" di Pengaturan → Keamanan.' },
  { t: 'Izin aplikasi dibatasi', d: 'Aplikasi senter tidak butuh akses kontak & SMS.', b: 9,
    saran: 'Cek Pengaturan → Privasi → Izin. Cabut izin lokasi, SMS, kontak, dan mikrofon dari aplikasi yang tidak butuh.' },
  { t: 'Backup data rutin', d: 'Foto, kontak & chat penting tersimpan di cloud / perangkat lain.', b: 8,
    saran: 'Aktifkan backup otomatis (Google Drive / iCloud). Kalau HP hilang/ransomware, datamu tetap selamat.' },
  { t: 'Enkripsi perangkat aktif', d: 'Data di HP tidak bisa dibaca bila HP dicuri & dibongkar.', b: 8,
    saran: 'HP modern umumnya terenkripsi otomatis saat kunci layar aktif. Pastikan kunci layar selalu menyala.' },
  { t: 'Find My Device aktif', d: 'Bisa melacak, mengunci, atau menghapus HP dari jarak jauh.', b: 8,
    saran: 'Aktifkan Find My Device (Android) / Find My (iPhone) dan pastikan akun terhubung.' },
  { t: 'Waspada WiFi publik', d: 'Tidak auto-join WiFi gratis; hindari transaksi bank di WiFi umum.', b: 7,
    saran: 'Matikan "sambung otomatis ke WiFi terbuka". Untuk transaksi penting, pakai data seluler sendiri.' },
  { t: 'Notifikasi layar kunci disembunyikan', d: 'Kode OTP di notifikasi tidak terlihat saat HP terkunci.', b: 7,
    saran: 'Set notifikasi layar kunci ke "sembunyikan konten sensitif" di Pengaturan → Notifikasi.' },
  { t: 'Tidak di-root / jailbreak', d: 'Root membuka seluruh sistem — malware jadi jauh lebih berbahaya.', b: 7,
    saran: 'Jangan root/jailbreak HP harianmu. Aplikasi bank pun biasanya menolak berjalan di HP yang di-root.' },
  { t: 'Rutin cek aktivitas akun', d: 'Meninjau sesi login & perangkat terhubung minimal sebulan sekali.', b: 7,
    saran: 'Cek "perangkat Anda" di akun Google/Apple dan riwayat login bank. Keluarkan sesi yang tidak dikenal.' },
];

const LS_KEY = 'adipTools_auditHp_v1';

export function render(root) {
  let centang = {};
  try { centang = JSON.parse(localStorage.getItem(LS_KEY) || '{}'); } catch (e) { centang = {}; }
  const box = T.out();
  const hasilBox = T.out();

  function simpan() {
    try { localStorage.setItem(LS_KEY, JSON.stringify(centang)); } catch (e) {}
  }

  function hitung() {
    let skor = 0;
    ITEMS.forEach((it, i) => { if (centang[i]) skor += it.b; });
    return skor;
  }

  function tampilkan() {
    let html = '';
    ITEMS.forEach((it, i) => {
      const on = !!centang[i];
      html += '<label style="display:flex;gap:10px;align-items:flex-start;border:1px solid ' + (on ? '#22c55e55' : '#ffffff20') +
        ';border-radius:10px;padding:11px 12px;margin-bottom:8px;background:' + (on ? 'rgba(34,197,94,.06)' : '#18181b') + ';cursor:pointer">' +
        '<input type="checkbox" data-i="' + i + '" ' + (on ? 'checked' : '') + ' style="margin-top:3px;accent-color:#22c55e;width:17px;height:17px;flex-shrink:0">' +
        '<span style="font-size:13px;line-height:1.55"><b>' + T.esc(it.t) + '</b> <span class="dim">(+ ' + it.b + ')</span><br>' +
        '<span class="dim">' + T.esc(it.d) + '</span></span></label>';
    });
    T.show(box, html);
    box.querySelectorAll('input[type=checkbox]').forEach(cb => {
      cb.addEventListener('change', () => {
        centang[cb.dataset.i] = cb.checked;
        simpan();
        try { beep(cb.checked ? 880 : 440, 0.07, 'sine'); } catch (e) {}
        tampilkan();
      });
    });
    ringkas();
  }

  function ringkas() {
    const skor = hitung();
    const done = Object.values(centang).filter(Boolean).length;
    const kurang = ITEMS.map((it, i) => ({ it, i })).filter(x => !centang[x.i]);
    const emoji = skor >= 85 ? '🛡️' : skor >= 60 ? '🙂' : skor >= 40 ? '😐' : '⚠️';
    const nilai = skor >= 85 ? 'Sangat aman' : skor >= 60 ? 'Cukup aman' : skor >= 40 ? 'Rentan' : 'Berbahaya';
    let html = '<div style="text-align:center;padding:16px 8px;border:1px solid #ffffff20;border-radius:12px;background:#18181b;margin-bottom:12px">' +
      '<div style="font-size:38px">' + emoji + '</div>' +
      '<div style="font-size:24px;margin:8px 0"><b>' + skor + '/100</b></div>' +
      '<div class="dim" style="font-size:12.5px">' + done + '/' + ITEMS.length + ' checklist • ' + nilai + '</div>' +
      '<div style="height:8px;border-radius:99px;background:#27272a;margin-top:10px;overflow:hidden">' +
      '<div style="height:100%;width:' + skor + '%;border-radius:99px;background:' + (skor >= 85 ? '#22c55e' : skor >= 60 ? '#fbbf24' : '#ef4444') + ';transition:width .3s"></div></div></div>';
    if (kurang.length) {
      html += '<div style="font-size:13px;margin-bottom:8px"><b>🔧 Yang perlu diperbaiki (' + kurang.length + '):</b></div>';
      kurang.forEach(x => {
        html += '<div style="border:1px solid #ffffff20;border-radius:10px;padding:10px 12px;margin-bottom:8px;background:#18181b;font-size:12.5px;line-height:1.6">' +
          '<b>❌ ' + T.esc(x.it.t) + '</b><br><span class="dim">💡 ' + T.esc(x.it.saran) + '</span></div>';
      });
    } else {
      html += '<div style="border:1px solid #22c55e;border-radius:10px;padding:12px;font-size:13px;text-align:center;background:rgba(34,197,94,.08)">🎉 Semua checklist terpenuhi! HP-mu dalam kondisi sangat aman. Pertahankan.</div>';
    }
    T.show(hasilBox, html);
  }

  root.append(
    T.el('<p class="dim" style="font-size:13px">Centang yang sudah kamu lakukan. Skor dihitung otomatis (total 100) + saran perbaikan untuk yang belum. Pilihanmu tersimpan di HP ini.</p>'),
    hasilBox, box
  );
  const reset = T.btn('🔄 Reset checklist', () => { centang = {}; simpan(); tampilkan(); });
  const wr = T.el('<div style="margin-top:4px;margin-bottom:16px"></div>');
  wr.appendChild(reset);
  root.append(wr);
  tampilkan();
}
