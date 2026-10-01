import { h as T, utils } from '../../core.js?v=6.0.0';

export const meta = {"id": "reaction", "name": "Tes Refleks", "cat": "fun", "icon": "⚡", "desc": "Ukur kecepatan refleks.", "keywords": "refleks,reaksi,cepat,tes"};
export function render(root) {

    const area = T.el('<div class="out center" style="min-height:150px;display:flex;flex-direction:column;justify-content:center;cursor:pointer;user-select:none"></div>');
    const statBox = T.out();
    let state = 'idle', t0 = 0, timer = null, tries = [];
    T.onLeave(() => { if (timer) clearTimeout(timer); });
    const paint = (bg, teks, sub) => {
      area.style.background = bg;
      area.innerHTML = '<div class="big">' + teks + '</div>' + (sub ? '<div class="dim" style="margin-top:6px">' + sub + '</div>' : '');
    };
    const ringkas = () => {
      const ok = tries.filter((x) => x != null);
      if (tries.length >= 5) {
        const avg = ok.length ? Math.round(ok.reduce((a, b) => a + b, 0) / ok.length) : 0;
        const best = ok.length ? Math.min.apply(null, ok) : null;
        T.show(statBox,
          '<div class="center"><div class="dim">5 percobaan selesai!</div>' +
          (ok.length
            ? '<div class="kv"><span class="k">Rata-rata</span><span class="v">' + avg + ' ms</span></div>' +
              '<div class="kv"><span class="k">Terbaik</span><span class="v">' + best + ' ms</span></div>'
            : '<div class="err">Semua percobaan gagal. Coba lagi lebih sabar 😅</div>') + '</div>');
        tries = [];
        paint('#222', 'Klik area ini untuk mulai lagi', '5 percobaan selesai');
        T.beep(880, 0.2);
      } else if (ok.length) {
        const best = Math.min.apply(null, ok);
        T.show(statBox, '<div class="dim center">Percobaan ' + tries.length + '/5 · terbaik: <b>' + best + ' ms</b></div>');
      }
    };
    const mulai = () => {
      state = 'wait';
      paint('#3a0d0d', 'Tunggu…', 'Jangan klik dulu!');
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        state = 'ready';
        paint('#0d3a1a', 'KLIK!', 'Sekarang!');
        t0 = performance.now();
      }, 1000 + Math.random() * 3000);
    };
    area.addEventListener('click', () => {
      if (state === 'idle') { mulai(); return; }
      if (state === 'wait') {
        clearTimeout(timer);
        state = 'idle';
        tries.push(null);
        paint('#222', 'Terlalu cepat! 😅', 'Klik "Mulai" untuk coba lagi');
        T.show(statBox, '<div class="err center">Gagal, klik sebelum hijau. Percobaan ' + tries.length + '/5.</div>');
        ringkas();
        return;
      }
      if (state === 'ready') {
        const ms = Math.round(performance.now() - t0);
        state = 'idle';
        tries.push(ms);
        paint('#222', ms + ' ms', ms < 250 ? 'Cepat banget! ⚡' : ms < 400 ? 'Lumayan!' : 'Bisa lebih cepat lagi');
        ringkas();
      }
    });
    root.appendChild(T.el('<div class="hint" style="margin-bottom:8px">Klik area di bawah untuk mulai. Begitu berubah hijau, klik secepat mungkin! 5x percobaan.</div>'));
    root.appendChild(area);
    root.appendChild(statBox);
    T.hide(statBox);
    paint('#222', 'Klik area ini untuk mulai', 'Uji kecepatan refleksmu');
  
}
