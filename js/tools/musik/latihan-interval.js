import { h as T, utils } from '../../core.js?v=6.6.0';

export const meta = {"id": "latihan-interval", "name": "Latihan Interval", "cat": "musik", "icon": "👂", "desc": "Asah kuping: tebak jarak 2 nada dalam 10 ronde.", "keywords": "interval,ear training,telinga,nada,musik,latihan"};

export function render(root) {

    // [semiton, nama Indonesia]
    const INTERVAL = [
      [0, 'Prime (Unison)'],
      [1, 'Sekun Minor'],
      [2, 'Sekun Mayor'],
      [3, 'Ters Minor'],
      [4, 'Ters Mayor'],
      [5, 'Kwart Murni'],
      [7, 'Kwint Murni'],
      [12, 'Oktaf'],
    ];
    const RONDE = 10;

    const box = T.out();
    let ronde = 0, benar = 0, kunci = null, midi1 = 0, midi2 = 0, terkunci = false;

    let timerBersih = null;
    T.onLeave(() => { if (timerBersih) { clearTimeout(timerBersih); timerBersih = null; } });

    const freq = (midi) => 440 * Math.pow(2, (midi - 69) / 12);
    const mainNada = (midi, tunda) => {
      try {
        const c = T.actx();
        const t = c.currentTime + (tunda || 0);
        const o = c.createOscillator(), g = c.createGain();
        o.type = 'sine'; o.frequency.value = freq(midi);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.45, t + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.8);
        o.connect(g); g.connect(c.destination);
        o.start(t); o.stop(t + 0.9);
      } catch (e) { /* abaikan */ }
    };
    const putarPasangan = () => { mainNada(midi1, 0); mainNada(midi2, 0.7); };

    const acak = (arr) => arr.slice().sort(() => Math.random() - 0.5);

    const rondeBaru = () => {
      terkunci = false;
      kunci = INTERVAL[Math.floor(Math.random() * INTERVAL.length)];
      midi1 = 60 + Math.floor(Math.random() * 12);   // nada dasar acak C4–B4
      midi2 = midi1 + kunci[0];
      T.show(box, '');
      box.appendChild(T.el('<p class="center mut">Ronde ' + (ronde + 1) + ' / ' + RONDE + ' · Skor: ' + benar + '</p>'));
      box.appendChild(T.el('<p class="big center" style="font-size:17px;line-height:1.6">Dengarkan dua nada ini,<br>lalu tebak intervalnya 👇</p>'));
      const bar = T.el('<div style="display:flex;gap:8px;justify-content:center;margin:14px 0;flex-wrap:wrap"></div>');
      bar.appendChild(T.btn('🔊 Putar', () => putarPasangan(), true));
      bar.appendChild(T.btn('🔁 Putar Ulang', () => putarPasangan()));
      box.appendChild(bar);
      const grid = T.el('<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"></div>');
      acak(INTERVAL).forEach(([semi, nama]) => {
        const b = T.btn(nama, () => jawab(semi, b));
        b.style.textAlign = 'center';
        b.dataset.semi = semi;
        grid.appendChild(b);
      });
      box.appendChild(grid);
      putarPasangan();
    };

    const jawab = (semi, tombol) => {
      if (terkunci) return;
      terkunci = true;
      const ok = semi === kunci[0];
      if (ok) {
        benar++;
        T.beep(660, 0.1); T.beep(880, 0.15, 'sine', 0.1);
        tombol.style.borderColor = '#22c55e';
      } else {
        T.beep(220, 0.2, 'sawtooth');
        tombol.style.borderColor = '#ef4444';
        [...box.querySelectorAll('button')].forEach((b) => {
          if (+b.dataset.semi === kunci[0]) b.style.borderColor = '#22c55e';
        });
      }
      box.appendChild(T.el(
        '<p class="center" style="margin-top:14px;line-height:1.6">' +
        (ok ? '✅ <b>Betul!</b> Itu ' + T.esc(kunci[1]) + '.' : '❌ Kurang tepat. Jawabannya: <b>' + T.esc(kunci[1]) + '</b>.') +
        '</p>'));
      const lanjut = T.btn(ronde + 1 < RONDE ? 'Ronde Berikutnya ➡️' : 'Lihat Hasil 🏁', () => {
        ronde++;
        if (ronde < RONDE) rondeBaru();
        else tampilHasil();
      }, true);
      const bar2 = T.el('<div style="display:flex;justify-content:center;margin-top:12px"></div>');
      bar2.appendChild(lanjut);
      box.appendChild(bar2);
    };

    const tampilHasil = () => {
      let icon, pesan;
      if (benar >= 9)      { icon = '🦻'; pesan = 'Kuping dewa! Kamu dengerin nada kayak baca chat — langsung paham. Siap jadi anak band beneran.'; }
      else if (benar >= 7) { icon = '🎧'; pesan = 'Kupingmu tajam! Tinggal diasah dikit lagi, interval-interval susah bakal gampang.'; }
      else if (benar >= 5) { icon = '🙂'; pesan = 'Lumayan! Dasarnya udah ada, tinggal latihan rutin biar makin peka.'; }
      else if (benar >= 3) { icon = '🎵'; pesan = 'Masih meraba-raba nih. Coba main lagi, tiap ronde kupingmu belajar.'; }
      else                 { icon = '🔇'; pesan = 'Waduh, kupingnya masih pemanasan 😅. Santai, semua musisi hebat mulai dari sini juga. Gas lagi!'; }
      T.show(box, '');
      box.appendChild(T.el('<p class="center mut">Skor akhirmu…</p>'));
      box.appendChild(T.el('<p class="big center" style="font-size:52px;line-height:1;margin:8px 0">' + benar + '<span style="font-size:24px">/' + RONDE + '</span></p>'));
      box.appendChild(T.el('<div class="big center" style="font-size:44px">' + icon + '</div>'));
      box.appendChild(T.el('<p class="center" style="line-height:1.7;max-width:420px;margin:0 auto">' + T.esc(pesan) + '</p>'));
      const bar = T.el('<div style="display:flex;gap:8px;margin-top:16px;flex-wrap:wrap;justify-content:center"></div>');
      bar.appendChild(T.btn('🔁 Main Lagi', () => { ronde = 0; benar = 0; rondeBaru(); }, true));
      bar.appendChild(T.copyBtn(() => 'Skor Latihan Interval: ' + benar + '/' + RONDE + ' ' + icon + ' (ADIP Tools)', '📋 Salin Skor'));
      box.appendChild(bar);
    };

    root.appendChild(box);
    root.appendChild(T.el('<p class="hint center" style="margin-top:10px">10 ronde · nada dasar diacak tiap ronde · 8 pilihan interval dari prime sampai oktaf.</p>'));
    rondeBaru();

}
