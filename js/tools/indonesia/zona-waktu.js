import { h as T, utils, kv } from '../../core.js?v=6.0.1';

export const meta = {"id": "zona-waktu", "name": "Konverter Zona Waktu", "cat": "indonesia", "icon": "🕐", "desc": "WIB, WITA, WIT + kota dunia.", "keywords": "waktu,zona,wib,wita,wit,jam"};
export function render(root) {

    const jam = T.input('time', '', '12:00');
    const asal = T.select([['WIB', 'WIB (UTC+7)'], ['WITA', 'WITA (UTC+8)'], ['WIT', 'WIT (UTC+9)']], 'WIB');
    const box = T.out();
    const ZONES = [
      ['WIB', 'Asia/Jakarta'], ['WITA', 'Asia/Makassar'], ['WIT', 'Asia/Jayapura'],
      ['Singapura', 'Asia/Singapore'], ['Tokyo', 'Asia/Tokyo'], ['Seoul', 'Asia/Seoul'],
      ['Dubai', 'Asia/Dubai'], ['London', 'Europe/London'], ['Paris', 'Europe/Paris'],
      ['New York', 'America/New_York'], ['Los Angeles', 'America/Los_Angeles'], ['Sydney', 'Australia/Sydney'],
    ];
    const hitung = () => {
      if (!jam.value) { T.hide(box); return; }
      const [hh, mm] = jam.value.split(':').map(Number);
      const off = { WIB: 7, WITA: 8, WIT: 9 }[asal.value] || 7;
      const now = new Date();
      const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), hh - off, mm || 0));
      const f = (tz) => {
        try {
          return new Intl.DateTimeFormat('id-ID', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: tz }).format(d);
        } catch (e) { return '-'; }
      };
      T.show(box,
        '<p class="mut" style="font-size:13px">Jam <b>' + T.esc(jam.value) + ' ' + T.esc(asal.value) + '</b> sama dengan:</p>' +
        ZONES.map(([label, tz]) => kv(label, '<b>' + T.esc(f(tz)) + '</b>')).join('') +
        '<p class="hint">Kota dunia mengikuti daylight saving time (DST) otomatis bila berlaku. WIB/WITA/WIT tidak memakai DST.</p>');
    };
    jam.addEventListener('change', hitung);
    asal.addEventListener('change', hitung);
    root.appendChild(T.grid2(T.field('Jam', jam), T.field('Zona asal', asal)));
    root.appendChild(T.row(T.btn('Konversi', hitung, true)));
    root.appendChild(box);
  
}
