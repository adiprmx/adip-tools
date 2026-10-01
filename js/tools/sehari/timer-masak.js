import { h as T, num, p2 } from '../../core.js?v=6.6.0';

export const meta = {"id": "timer-masak", "name": "Timer Masak", "cat": "sehari", "icon": "🍜", "desc": "Timer masak dengan preset telur, mie, nasi — bunyi saat matang.", "keywords": "timer,masak,telur,mie,nasi,countdown,pengingat"};

export function render(root) {

    const PRESETS = [
      ['Telur ½ matang', 6],
      ['Telur matang', 10],
      ['Mie instan', 3],
      ['Nasi', 25],
    ];

    const customI = T.input('number', 'cth: 15', '');
    const disp = T.el('<div class="big center" style="font-size:56px">--:--</div>');
    const labelBox = T.out();
    let timer = null, sisa = 0, namaAktif = '';

    const hentikan = () => { if (timer) { clearInterval(timer); timer = null; } };

    const gambar = () => {
      disp.textContent = p2(Math.floor(sisa / 60)) + ':' + p2(sisa % 60);
    };

    const selesai = () => {
      hentikan();
      disp.textContent = 'Matang!';
      T.show(labelBox, '<p class="center">🎉 <b>' + T.esc(namaAktif) + '</b> udah mateng — angkat sekarang, jangan sampai kebablasan!</p>');
      try {
        T.beep(880, 0.3, 'sine');
        T.beep(880, 0.3, 'sine', 0.4);
        T.beep(1174, 0.5, 'sine', 0.8);
      } catch (e) {}
      if (navigator.vibrate) { try { navigator.vibrate([200, 100, 200, 100, 400]); } catch (e) {} }
    };

    const mulai = (menit, nama) => {
      const m = num(menit);
      if (!isFinite(m) || m <= 0 || m > 600) { T.toast('Durasi harus 1–600 menit'); return; }
      hentikan();
      sisa = Math.round(m * 60);
      namaAktif = nama;
      T.show(labelBox, '<p class="center mut">⏳ ' + T.esc(nama) + ' — lagi jalan…</p>');
      gambar();
      timer = setInterval(() => {
        sisa -= 1;
        if (sisa <= 0) { selesai(); return; }
        gambar();
      }, 1000);
    };

    const batal = () => {
      hentikan();
      disp.textContent = '--:--';
      T.show(labelBox, '<p class="center mut">Timer dibatalkan. Masak apa lagi nih?</p>');
    };

    T.onLeave(hentikan);

    root.appendChild(T.el('<p class="note">Masak sambil scroll HP aman — <b>timer yang jagain</b>, mateng langsung bunyi.</p>'));
    root.appendChild(T.grid2(...PRESETS.map(([nama, mnt]) => T.btn(nama + ' (' + mnt + ' mnt)', () => mulai(mnt, nama)))));
    root.appendChild(T.field('Atau custom (menit)', customI, 'Durasi sendiri sesuai kebutuhan.'));
    root.appendChild(T.row(T.btn('Mulai Custom', () => mulai(customI.value, 'Timer custom'), true), T.btn('Batal', batal)));
    root.appendChild(disp);
    root.appendChild(labelBox);
}
