import { h as T, utils, errBox, esc, kvRows, tabs } from '../../core.js?v=5.2.0';

const DOW_ID = { 0: 'Minggu', 1: 'Senin', 2: 'Selasa', 3: 'Rabu', 4: 'Kamis', 5: 'Jumat', 6: 'Sabtu', 7: 'Minggu' };

const MON_ID = { 1: 'Januari', 2: 'Februari', 3: 'Maret', 4: 'April', 5: 'Mei', 6: 'Juni', 7: 'Juli', 8: 'Agustus', 9: 'September', 10: 'Oktober', 11: 'November', 12: 'Desember' };

const pad2 = (n) => String(n).padStart(2, '0');

function cronList(f, unit, names) {
    const items = f.split(',').map((x) => {
      let m = x.match(/^\*\/(\d+)$/);
      if (m) return 'setiap ' + m[1];
      m = x.match(/^(\d+)-(\d+)$/);
      if (m) {
        const a = names ? names[+m[1]] || m[1] : m[1];
        const b = names ? names[+m[2]] || m[2] : m[2];
        return (unit ? unit + ' ' : '') + a + ' sampai ' + b;
      }
      m = x.match(/^\d+$/);
      if (m) return (unit ? unit + ' ' : '') + (names ? names[+x] || x : x);
      return x;
    });
    return items.join(', ');
  }

function cronToId(cron) {
    const presets = {
      '@yearly': 'setiap tahun (1 Januari jam 00:00)', '@annually': 'setiap tahun (1 Januari jam 00:00)',
      '@monthly': 'setiap bulan (tanggal 1 jam 00:00)', '@weekly': 'setiap minggu (Minggu jam 00:00)',
      '@daily': 'setiap hari jam 00:00', '@midnight': 'setiap hari jam 00:00',
      '@hourly': 'setiap jam (menit ke-0)', '@reboot': 'saat komputer/server dinyalakan ulang'
    };
    const c = String(cron == null ? '' : cron).trim().toLowerCase();
    if (presets[c]) return presets[c];
    const f = c.split(/\s+/);
    if (f.length !== 5 || !f.every((x) => /^[0-9*,\-\/]+$/.test(x)))
      return 'Ekspresi cron tidak valid (format: menit jam tanggal bulan hari).';
    const mi = f[0], hr = f[1], dom = f[2], mon = f[3], dow = f[4];
    let when;
    if (mi === '*' && hr === '*') when = 'setiap menit';
    else if (/^\*\/\d+$/.test(mi) && hr === '*') when = 'setiap ' + mi.slice(2) + ' menit';
    else if (/^\*\/\d+$/.test(hr) && mi === '0') when = 'setiap ' + hr.slice(2) + ' jam';
    else if (/^\d+$/.test(mi) && /^\d+$/.test(hr)) when = 'setiap hari jam ' + pad2(hr) + ':' + pad2(mi);
    else if (/^\d+$/.test(mi) && hr === '*') when = 'setiap jam, menit ke-' + mi;
    else if (/^\*\/\d+$/.test(mi) && /^\d+(-\d+)?$/.test(hr)) when = 'setiap ' + mi.slice(2) + ' menit, jam ' + hr;
    else when = 'menit "' + mi + '", jam "' + hr + '"';
    const parts = [when];
    if (dom !== '*') parts.push(cronList(dom, 'tanggal'));
    if (mon !== '*') parts.push(cronList(mon, 'bulan', MON_ID));
    if (dow !== '*') parts.push(cronList(dow, 'hari', DOW_ID));
    return parts.join(', ');
  }

export const meta = {"id": "cron", "name": "Cron Parser & Builder", "cat": "developer", "icon": "⏰", "desc": "Terjemahkan & susun cron expression.", "keywords": "cron,jadwal,server"};
export function render(root) {

    const pInput = T.input('text', 'misal: */5 * * * *', '*/5 * * * *');
    const pBox = T.out();
    const parsePage = T.el('<div></div>');
    parsePage.appendChild(T.field('Ekspresi cron (5 field)', pInput));
    parsePage.appendChild(T.row(T.btn('Terjemahkan', () => {
      const c = pInput.value.trim();
      if (!c) { T.show(pBox, errBox('Isi dulu cron-nya.')); return; }
      const f = c.split(/\s+/);
      const detail = f.length === 5
        ? kvRows([['Menit', f[0]], ['Jam', f[1]], ['Tanggal', f[2]], ['Bulan', f[3]], ['Hari', f[4]]])
        : '';
      T.show(pBox, '<div style="font-size:15px;margin-bottom:10px">🗓️ ' + esc(cronToId(c)) + '</div>' + detail);
    }, true)));
    parsePage.appendChild(pBox);

    const bMin = T.select([['*', 'setiap menit'], ['*/5', 'tiap 5 menit'], ['*/10', 'tiap 10 menit'], ['*/15', 'tiap 15 menit'], ['*/30', 'tiap 30 menit'], ['0', 'menit ke-0'], ['15', 'menit ke-15'], ['30', 'menit ke-30'], ['45', 'menit ke-45']], '0');
    const bHr = T.select([['*', 'setiap jam'], ['*/2', 'tiap 2 jam'], ['*/6', 'tiap 6 jam'], ['0', '00:00'], ['6', '06:00'], ['8', '08:00'], ['9', '09:00'], ['12', '12:00'], ['17', '17:00'], ['18', '18:00'], ['20', '20:00'], ['23', '23:00']], '8');
    const bDom = T.select([['*', 'setiap tanggal'], ['1', 'tanggal 1'], ['15', 'tanggal 15'], ['*/2', 'tiap 2 hari']], '*');
    const bMon = T.select([['*', 'setiap bulan'], ['1', 'Jan'], ['2', 'Feb'], ['3', 'Mar'], ['4', 'Apr'], ['5', 'Mei'], ['6', 'Jun'], ['7', 'Jul'], ['8', 'Agu'], ['9', 'Sep'], ['10', 'Okt'], ['11', 'Nov'], ['12', 'Des']], '*');
    const bDow = T.select([['*', 'setiap hari'], ['0', 'Minggu'], ['1', 'Senin'], ['2', 'Selasa'], ['3', 'Rabu'], ['4', 'Kamis'], ['5', 'Jumat'], ['6', 'Sabtu']], '*');
    const bBox = T.out();
    const bPage = T.el('<div hidden></div>');
    bPage.appendChild(T.grid2(T.field('Menit', bMin), T.field('Jam', bHr)));
    bPage.appendChild(T.grid2(T.field('Tanggal', bDom), T.field('Bulan', bMon)));
    bPage.appendChild(T.field('Hari', bDow));
    bPage.appendChild(T.row(T.btn('Buat Cron', () => {
      const c = [bMin.value, bHr.value, bDom.value, bMon.value, bDow.value].join(' ');
      T.show(bBox, '<div style="font-size:15px;font-family:monospace;margin-bottom:8px">' + esc(c) + '</div><div>🗓️ ' + esc(cronToId(c)) + '</div>');
    }, true), T.copyBtn(() => [bMin.value, bHr.value, bDom.value, bMon.value, bDow.value].join(' '), 'Salin Cron')));
    bPage.appendChild(bBox);

    root.appendChild(tabs([['Terjemahkan', 0], ['Susun', 1]], [parsePage, bPage]));
    root.appendChild(parsePage);
    root.appendChild(bPage);
  
}
