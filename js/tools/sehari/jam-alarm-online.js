import { h as T, p2 } from '../../core.js';

export const meta = { id: 'jam-alarm-online', name: 'Jam Alarm Online', cat: 'sehari', icon: '⏰', desc: 'Pasang alarm di jam tertentu. Saat waktunya tiba, alarm berbunyi dan layar berkedip, walau kamu sedang membuka tab lain.', keywords: 'alarm,jam alarm,pengingat,bangun,waktu,beep', since: '6.18.0' };

// Milidetik sampai alarm berikutnya pada jam:menit yang ditentukan.
// Bila jam itu sudah lewat hari ini, alarm dijadwalkan besok.
export function msMenujuAlarm(jam, menit, sekarang) {
  const now = sekarang instanceof Date ? sekarang : new Date();
  const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), jam, menit, 0, 0);
  let sisa = target.getTime() - now.getTime();
  if (sisa <= 0) sisa += 24 * 60 * 60 * 1000;
  return sisa;
}

export function formatSisa(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const j = Math.floor(total / 3600), m = Math.floor((total % 3600) / 60), d = total % 60;
  return p2(j) + ':' + p2(m) + ':' + p2(d);
}

export function render(root) {
  root.appendChild(T.el('<p class="hint">Alarm ini bunyi dari halaman ini, jadi biarkan tab ini tetap terbuka. Bunyinya pakai speaker perangkatmu, tanpa perlu izin apa-apa.</p>'));

  const jamI = T.input('time', '', '07:00');
  const labelI = T.input('text', 'cth: Bangun tidur (boleh kosong)', '');
  const disp = T.el('<div class="big center" style="font-size:40px">--:--:--</div>');
  const statusBox = T.out();
  let timer = null, bunyiTimer = null, kedipTimer = null, judulAsli = '';
  let targetMs = 0, labelAktif = '';

  function bersihkanBunyi() {
    if (bunyiTimer) { clearInterval(bunyiTimer); bunyiTimer = null; }
    if (kedipTimer) { clearInterval(kedipTimer); kedipTimer = null; }
    try { if (judulAsli) document.title = judulAsli; } catch (e) {}
  }

  function hentikan() {
    if (timer) { clearInterval(timer); timer = null; }
    bersihkanBunyi();
  }

  function bunyi() {
    // Pola bunyi berulang: tiga nada naik, jeda, ulang.
    try {
      T.beep(880, 0.25, 'sine');
      T.beep(1046, 0.25, 'sine', 0.3);
      T.beep(1318, 0.4, 'sine', 0.6);
    } catch (e) {}
    try { if (navigator.vibrate) navigator.vibrate([300, 150, 300]); } catch (e) {}
  }

  function berbunyi() {
    hentikan();
    disp.textContent = '⏰ Waktunya!';
    T.show(statusBox, '<p class="center"><b>' + T.esc(labelAktif || 'Alarm') + '</b> bunyi sekarang. Tekan "Matikan alarm" untuk berhenti.</p>');
    try {
      judulAsli = document.title;
      let nyala = false;
      kedipTimer = setInterval(() => {
        nyala = !nyala;
        document.title = nyala ? '⏰ ALARM: ' + (labelAktif || 'Waktunya!') : judulAsli;
      }, 900);
    } catch (e) {}
    bunyi();
    bunyiTimer = setInterval(bunyi, 2500);
  }

  function mulai() {
    const v = String(jamI.value || '').trim();
    const m = v.match(/^(\d{1,2}):(\d{2})/);
    if (!m) { T.toast('Pilih jam alarmnya dulu'); return; }
    const jam = parseInt(m[1], 10), menit = parseInt(m[2], 10);
    if (jam > 23 || menit > 59) { T.toast('Jamnya tidak benar'); return; }
    hentikan();
    labelAktif = labelI.value.trim();
    targetMs = Date.now() + msMenujuAlarm(jam, menit, new Date());
    const perbarui = () => {
      const sisa = targetMs - Date.now();
      if (sisa <= 0) { berbunyi(); return; }
      disp.textContent = formatSisa(sisa);
    };
    T.show(statusBox, '<p class="center mut">Alarm dipasang untuk jam ' + p2(jam) + ':' + p2(menit) + (labelAktif ? ' (' + T.esc(labelAktif) + ')' : '') + '. Biarkan tab ini terbuka.</p>');
    perbarui();
    timer = setInterval(perbarui, 1000);
  }

  function batal() {
    hentikan();
    disp.textContent = '--:--:--';
    T.show(statusBox, '<p class="center mut">Alarm dimatikan.</p>');
  }

  T.onLeave(hentikan);

  root.append(
    T.field('Jam alarm', jamI),
    T.field('Nama alarm (opsional)', labelI),
    disp,
    T.row(
      T.btn('Pasang alarm', mulai, true),
      T.btn('Matikan alarm', batal),
      T.btn('Tes bunyi', () => { bunyi(); T.toast('Itu bunyi alarmnya'); }),
    ),
    statusBox,
  );
}
