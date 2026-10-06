import { h as T, utils, beep } from '../../core.js?v=6.9.5';

export const meta = {"id": "respons-insiden", "name": "Respons Insiden", "cat": "keamanan", "icon": "🚨", "desc": "Panduan langkah demi langkah saat akun sosmed, email, atau e-wallet diretas.", "keywords": "akun diretas,hack,respons insiden,keamanan,2fa,password,panduan"};

export const LANGKAH = [
  { judul: 'Putus sesi aktif peretas', icon: '🛑',
    isi: 'Buka pengaturan keamanan akun (dari perangkat lain yang aman) → pilih "Keluar dari semua perangkat / End all sessions". Untuk e-wallet: bekukan akun sementara lewat aplikasi atau hubungi call center resmi. Ini memutus akses peretas yang sedang login.',
    tips: 'Jangan cuma ganti password — sesi login lama peretas bisa tetap aktif kalau tidak diputus manual.' },
  { judul: 'Ganti password dari perangkat bersih', icon: '🔑',
    isi: 'Ganti password memakai perangkat yang kamu yakini bersih (bukan HP yang mungkin terinfeksi). Buat password baru yang panjang & unik — jangan daur ulang password lama atau variasinya.',
    tips: 'Gunakan frasa sandi: 4+ kata acak, mis. "kucing-terbang-makan-rendang". Jauh lebih kuat & mudah diingat daripada "P@ssw0rd123".' },
  { judul: 'Nyalakan verifikasi 2 langkah (2FA)', icon: '🛡️',
    isi: 'Aktifkan 2FA di akun tersebut. Prioritas: aplikasi autentikator (Google/Microsoft Authenticator) > SMS. Simpan kode cadangan di tempat aman (tulis di kertas, simpan di dompet).',
    tips: '2FA via SMS lebih lemah (bisa dibajak lewat SIM-swap), tapi tetap jauh lebih baik daripada tanpa 2FA sama sekali.' },
  { judul: 'Amankan email pemulihan', icon: '📧',
    isi: 'Email adalah "kunci utama" semua akunmu. Cek: (1) password email diganti juga, (2) tidak ada aturan forward/filter aneh yang dibuat peretas, (3) nomor HP & email pemulihan masih milikmu.',
    tips: 'Peretas sering menyisipkan rule "teruskan semua email ke alamat saya" agar bisa reset password akun lain tanpa kamu sadari. Cek menu Filter/Forwarding!' },
  { judul: 'Lapor ke platform resmi', icon: '📢',
    isi: 'Laporkan lewat kanal BANTUAN RESMI aplikasi/situsnya (menu Help > Report hacked account). Jangan percaya "CS" yang menghubungimu via DM — itu sering penipu kedua yang memanfaatkan kepanikanmu.',
    tips: 'Siapkan bukti: tanggal kejadian, tangkapan layar aktivitas aneh, dan identitas (KTP) bila diminta verifikasi resmi.' },
  { judul: 'Beri tahu kontak & pantau', icon: '👥',
    isi: 'Umumkan ke teman/keluarga bahwa akunmu diretas — peretas sering menyamar jadi kamu untuk menipu kontakmu ("pinjam uang dulu"). Pantau 1–2 minggu: mutasi bank, tagihan aneh, dan email reset password yang tidak kamu minta.',
    tips: 'Minta 1–2 orang terdekat ikut memantau: kalau ada yang chat "kamu" minta uang, mereka bisa langsung mengingatkan yang lain.' },
];

export function render(root) {
  const done = new Array(LANGKAH.length).fill(false);
  const box = T.out();
  const barWrap = T.el(
    '<div style="margin-bottom:14px">' +
    '<div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:6px"><span class="dim">Progres pemulihan</span><span id="ri-persen"><b>0%</b></span></div>' +
    '<div style="height:10px;border-radius:6px;background:#27272a;overflow:hidden">' +
    '<div id="ri-bar" style="height:100%;width:0%;border-radius:6px;background:#22c55e;transition:width .35s ease"></div>' +
    '</div></div>'
  );
  const list = T.el('<div></div>');

  function persen() {
    const n = done.filter(Boolean).length;
    return Math.round(n / LANGKAH.length * 100);
  }

  function updateBar() {
    const p = persen();
    const bar = barWrap.querySelector('#ri-bar');
    const lbl = barWrap.querySelector('#ri-persen');
    if (bar) bar.style.width = p + '%';
    if (lbl) lbl.innerHTML = '<b>' + p + '%</b>';
    if (p === 100) {
      try { beep(880, 0.15, 'sine'); setTimeout(() => beep(1175, 0.2, 'sine'), 160); } catch (e) {}
      T.show(selesai,
        '<div style="text-align:center;padding:18px 10px;border:1px solid #22c55e;border-radius:12px;background:rgba(34,197,94,.07)">' +
        '<div style="font-size:40px">🎉</div>' +
        '<div style="font-size:16px;margin:8px 0"><b>Semua langkah selesai!</b></div>' +
        '<div class="dim" style="font-size:13px;line-height:1.7;max-width:440px;margin:0 auto">Akunmu jauh lebih aman sekarang. Tetap pantau 1–2 minggu ke depan, dan jadikan 2FA + password unik sebagai kebiasaan di SEMUA akun pentingmu. 💪</div></div>'
      );
    } else {
      T.show(selesai, '');
    }
  }

  function kartu(i) {
    const s = LANGKAH[i];
    const card = T.el(
      '<div style="border:1px solid #ffffff20;border-radius:12px;padding:14px;background:#18181b;margin-bottom:10px;transition:border-color .25s,opacity .25s" data-i="' + i + '">' +
      '<label style="display:flex;gap:10px;align-items:flex-start;cursor:pointer">' +
      '<input type="checkbox" style="width:20px;height:20px;margin-top:2px;accent-color:#22c55e;flex-shrink:0;cursor:pointer">' +
      '<span><span style="font-size:14px"><b>' + s.icon + ' Langkah ' + (i + 1) + ': ' + T.esc(s.judul) + '</b></span>' +
      '<span class="dim" style="display:block;font-size:13px;line-height:1.7;margin-top:6px">' + T.esc(s.isi) + '</span>' +
      '<span style="display:block;font-size:12.5px;line-height:1.6;margin-top:8px;color:#a1a1aa">💡 <b>Tips:</b> ' + T.esc(s.tips) + '</span></span>' +
      '</label></div>'
    );
    const cb = card.querySelector('input');
    cb.addEventListener('change', () => {
      done[i] = cb.checked;
      card.style.borderColor = cb.checked ? '#22c55e' : '#ffffff20';
      card.style.opacity = cb.checked ? '0.75' : '1';
      try { beep(cb.checked ? 660 : 330, 0.08, 'sine'); } catch (e) {}
      updateBar();
    });
    return card;
  }

  const selesai = T.out();

  LANGKAH.forEach((_, i) => list.appendChild(kartu(i)));

  const reset = T.btn('🔄 Ulangi dari awal', () => {
    done.fill(false);
    list.querySelectorAll('input[type=checkbox]').forEach(cb => { cb.checked = false; });
    list.querySelectorAll('[data-i]').forEach(c => { c.style.borderColor = '#ffffff20'; c.style.opacity = '1'; });
    updateBar();
  });

  const resetWrap = T.el('<div style="margin-top:12px;text-align:center"></div>');
  resetWrap.appendChild(reset);

  root.append(
    T.el('<p class="dim" style="font-size:13px">Akun diretas? <b>Tetap tenang.</b> Kerjakan 6 langkah ini <b>berurutan</b> — centang tiap langkah yang sudah selesai. Berlaku untuk akun sosmed, email, & e-wallet.</p>'),
    box
  );
  box.appendChild(barWrap);
  box.appendChild(list);
  box.appendChild(selesai);
  box.appendChild(resetWrap);
}
