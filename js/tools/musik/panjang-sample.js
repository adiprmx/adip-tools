import { h as T, utils } from '../../core.js?v=6.5.0';

export const meta = {"id": "panjang-sample", "name": "Panjang Sample", "cat": "musik", "icon": "🎚️", "desc": "Bar × BPM jadi detik, atau sebaliknya.", "keywords": "sample,bar,bpm,durasi,detik,loop,musik"};
export function render(root) {

    const MODE = [['keDetik', '⏱️ Bar → Detik'], ['keBar', '🎚️ Detik → Bar']];
    let mode = 'keDetik';
    let bpm = '128', bar = '4', beats = '4', target = '10';
    try {
      const s = JSON.parse(localStorage.getItem('panjangSample') || '{}');
      if (s.bpm) bpm = s.bpm; if (s.bar) bar = s.bar; if (s.beats) beats = s.beats; if (s.target) target = s.target;
      if (s.mode === 'keBar') mode = 'keBar';
    } catch (e) { /* abaikan */ }
    const simpan = () => {
      try { localStorage.setItem('panjangSample', JSON.stringify({ mode, bpm, bar, beats, target })); } catch (e) { /* abaikan */ }
    };

    const btnDetik = T.btn(MODE[0][1], null);
    const btnBar = T.btn(MODE[1][1], null);
    const barTab = T.el('<div style="display:flex;gap:8px;margin-bottom:12px"></div>');
    barTab.appendChild(btnDetik); barTab.appendChild(btnBar);
    btnDetik.style.flex = '1'; btnBar.style.flex = '1';

    const box = T.out();
    const wadah = T.el('<div></div>');

    const angka = (v) => T.num(v);
    const fmtID = (n, des) => (+n).toFixed(des == null ? 2 : des).replace('.', ',');

    const renderMode = () => {
      btnDetik.classList.toggle('primary', mode === 'keDetik');
      btnBar.classList.toggle('primary', mode === 'keBar');
      wadah.innerHTML = '';
      T.hide(box);
      if (mode === 'keDetik') {
        const iBpm = T.input('number', 'cth: 128', bpm);
        const iBar = T.input('number', 'cth: 4', bar);
        const iBeats = T.input('number', 'cth: 4', beats);
        [iBpm, iBar, iBeats].forEach((i) => i.addEventListener('input', hitungDetik));
        wadah.appendChild(T.field('Tempo (BPM)', iBpm));
        wadah.appendChild(T.field('Jumlah bar', iBar));
        wadah.appendChild(T.field('Ketuk per bar', iBeats, 'Umumnya 4. Waltz pakai 3.'));
        const hitungDetik = () => {
          bpm = iBpm.value; bar = iBar.value; beats = iBeats.value; simpan();
          const b = angka(bpm), n = angka(bar), k = angka(beats);
          if (!(b > 0) || !(n > 0) || !(k > 0)) {
            T.show(box, '<p class="center mut">Isi ketiga kolomnya dulu dengan angka yang masuk akal.</p>');
            return;
          }
          const detik = (n * k * 60) / b; // rumus inti
          const mnt = Math.floor(detik / 60), dtk = detik % 60;
          T.show(box,
            '<div class="big center" style="font-size:34px">' + fmtID(detik) + ' <span class="mut" style="font-size:15px">detik</span></div>' +
            '<p class="center">' + mnt + ':' + String(Math.floor(dtk)).padStart(2, '0') + ' menit · ' + fmtID(detik * 1000, 0) + ' ms</p>' +
            '<p class="center hint">1 bar = ' + fmtID((k * 60) / b) + ' detik · 1 ketuk = ' + fmtID(60 / b) + ' detik</p>');
        };
        hitungDetik();
      } else {
        const iTarget = T.input('number', 'cth: 10', target);
        const iBpm = T.input('number', 'cth: 128', bpm);
        const iBeats = T.input('number', 'cth: 4', beats);
        [iTarget, iBpm, iBeats].forEach((i) => i.addEventListener('input', hitungBar));
        wadah.appendChild(T.field('Target durasi (detik)', iTarget, 'Misal: butuh loop yang pas 10 detik.'));
        wadah.appendChild(T.field('Tempo (BPM)', iBpm));
        wadah.appendChild(T.field('Ketuk per bar', iBeats));
        const hitungBar = () => {
          target = iTarget.value; bpm = iBpm.value; beats = iBeats.value; simpan();
          const t = angka(target), b = angka(bpm), k = angka(beats);
          if (!(t > 0) || !(b > 0) || !(k > 0)) {
            T.show(box, '<p class="center mut">Isi ketiga kolomnya dulu dengan angka yang masuk akal.</p>');
            return;
          }
          const perlu = (t * b) / (k * 60); // rumus inti (kebalikan)
          const bulat = Math.ceil(perlu);
          const aktual = (bulat * k * 60) / b;
          T.show(box,
            '<div class="big center" style="font-size:34px">' + fmtID(perlu) + ' <span class="mut" style="font-size:15px">bar</span></div>' +
            '<p class="center">Dibulatkan ke atas: <b>' + bulat + ' bar</b> = ' + fmtID(aktual) + ' detik pas</p>' +
            '<p class="center hint">Rumus: bar × ketuk × 60 ÷ BPM = detik</p>');
        };
        hitungBar();
      }
    };

    btnDetik.addEventListener('click', () => { mode = 'keDetik'; simpan(); renderMode(); });
    btnBar.addEventListener('click', () => { mode = 'keBar'; simpan(); renderMode(); });

    root.appendChild(barTab);
    root.appendChild(wadah);
    root.appendChild(box);
    renderMode();

}
