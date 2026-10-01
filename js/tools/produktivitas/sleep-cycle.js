import { h as T, utils, esc, p2 } from '../../core.js?v=5.0.1';

function fmtHM(min) {
    min = ((Math.round(min) % 1440) + 1440) % 1440;
    return p2(Math.floor(min / 60)) + ':' + p2(min % 60);
  }

function toMin(hm) {
    const m = /^(\d{1,2}):(\d{2})$/.exec(String(hm || '').trim());
    if (!m) return NaN;
    return (+m[1]) * 60 + (+m[2]);
  }

utils.sleepOptions = function (mode, jamAcuan) {
    const ref = toMin(jamAcuan);
    if (isNaN(ref)) return [];
    const out = [];
    if (mode === 'now') {
      const start = ref + 15; // +15 menit waktu tertidur
      [3, 4, 5, 6].forEach((n) => out.push(fmtHM(start + n * 90)));
    } else {
      [4, 5, 6].forEach((n) => out.push(fmtHM(ref - 15 - n * 90)));
    }
    return out;
  };

export const meta = {"id": "sleep-cycle", "name": "Siklus Tidur", "cat": "produktivitas", "icon": "😴", "desc": "Jam bangun ideal per 90 menit."};

export function render(root) {

    const mode = T.select([['now', '😴 Saya mau tidur sekarang'], ['wake', '⏰ Saya harus bangun jam…']], 'now');
    const jamBangun = T.input('time', 'Jam bangun', '06:00');
    const box = T.out();
    const siklusOf = { 3: '3 siklus', 4: '4 siklus', 5: '5 siklus', 6: '6 siklus' };
    const hitung = () => {
      const jamList = mode.value === 'now'
        ? utils.sleepOptions('now', (() => { const d = new Date(); return p2(d.getHours()) + ':' + p2(d.getMinutes()); })())
        : utils.sleepOptions('wake', jamBangun.value || '06:00');
      if (!jamList.length) { T.show(box, '<span class="err">Isi jam dengan format HH:MM.</span>'); return; }
      const siklus = mode.value === 'now' ? [3, 4, 5, 6] : [4, 5, 6];
      let html = mode.value === 'now'
        ? '<div class="dim" style="margin-bottom:6px">Kalau tidur sekarang, bangunlah di jam ini (sudah termasuk ±15 menit waktu tertidur):</div>'
        : '<div class="dim" style="margin-bottom:6px">Supaya bangun jam <b>' + esc(jamBangun.value || '06:00') + '</b> dengan segar, tidurlah di jam ini:</div>';
      jamList.forEach((j, i) => {
        const dur = (siklus[i] * 1.5).toFixed(1).replace('.', ',');
        const rekom = (siklus[i] === 5 || siklus[i] === 6) ? ' <span class="ok">⭐ ideal</span>' : '';
        html += '<div class="kv"><span class="k">' + siklusOf[siklus[i]] + ' (' + dur + ' jam)</span><span class="v big" style="font-size:20px">' + j + '</span></div>' + (rekom ? '<div class="hint" style="margin:-4px 0 4px;text-align:right">' + rekom.trim() + '</div>' : '');
      });
      html += '<div class="hint">Satu siklus tidur ≈ 90 menit. Bangun di akhir siklus bikin badan terasa lebih segar.</div>';
      T.show(box, html);
    };
    const jamWrap = T.el('<div></div>');
    const paintMode = () => {
      jamWrap.innerHTML = '';
      if (mode.value === 'wake') jamWrap.appendChild(T.field('Jam bangun yang diinginkan', jamBangun));
      hitung();
    };
    mode.addEventListener('change', paintMode);
    jamBangun.addEventListener('change', hitung);
    root.appendChild(T.field('Mode', mode));
    root.appendChild(jamWrap);
    root.appendChild(box);
    paintMode();
  
}
