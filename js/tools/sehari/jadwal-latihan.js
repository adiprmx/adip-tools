import { h as T, utils } from '../../core.js?v=6.7.0';

export const meta = {"id":"jadwal-latihan","name":"Jadwal Latihan","cat":"sehari","icon":"🏋️","desc":"Susun jadwal latihan mingguanmu, Senin sampai Minggu.","keywords":"jadwal,latihan,workout,gym,fitness,minggu,olahraga,lengan,dada,kaki"};

const HARI = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
const JENIS = [
  ['istirahat', '😴 Istirahat'],
  ['dada', '💪 Dada'],
  ['punggung', '🔙 Punggung'],
  ['kaki', '🦵 Kaki'],
  ['bahu-lengan', '🏋️ Bahu + Lengan'],
  ['lari', '🏃 Lari / Kardio'],
];
const labelJenis = (v) => (JENIS.find((j) => j[0] === v) || JENIS[0])[1];

export function render(root) {
  const KEY = 'adip-tools:jadwal-latihan';
  let jadwal = {};
  try { jadwal = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { jadwal = {}; }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(jadwal)); } catch (e) {} };

  // Index hari ini: Senin=0 ... Minggu=6
  const hariIni = (new Date().getDay() + 6) % 7;

  root.appendChild(T.el('<p class="hint">Atur tiap hari mau latihan apa. Otomatis kesimpan — buka lagi minggu depan tinggal pakai. Hari ini ditandai biar nggak lupa. 💪</p>'));

  const form = T.el('<div></div>');
  HARI.forEach((h, i) => {
    const sel = T.select(JENIS, jadwal[h] || 'istirahat');
    sel.style.marginTop = '4px';
    if (i === hariIni) sel.style.borderColor = '#4ade80';
    sel.addEventListener('change', () => {
      jadwal[h] = sel.value;
      save(); draw();
    });
    const lbl = h + (i === hariIni ? ' <span class="ok" style="font-size:11px">· hari ini</span>' : '');
    const f = T.el('<div class="fld" style="margin-bottom:10px"></div>');
    f.innerHTML = '<label>' + lbl + '</label>';
    f.appendChild(sel);
    form.appendChild(f);
  });
  root.appendChild(form);

  const sumBox = T.el('<div class="card" hidden style="margin:14px 0"></div>');
  root.appendChild(sumBox);
  const wrap = T.el('<div></div>');
  root.appendChild(wrap);

  const draw = () => {
    const rows = HARI.map((h, i) => {
      const v = jadwal[h] || 'istirahat';
      const isRest = v === 'istirahat';
      const today = i === hariIni ? ' style="background:#4ade8012"' : '';
      return '<tr' + today + '>' +
        '<td style="padding:8px;border-bottom:1px solid #ffffff14;white-space:nowrap">' + h +
        (i === hariIni ? ' <span class="ok" style="font-size:11px">· hari ini</span>' : '') + '</td>' +
        '<td style="padding:8px;border-bottom:1px solid #ffffff14">' + (isRest ? '<span class="mut">' + labelJenis(v) + '</span>' : '<b>' + labelJenis(v) + '</b>') + '</td></tr>';
    }).join('');

    wrap.innerHTML =
      '<table style="width:100%;border-collapse:collapse;font-size:13px">' +
      '<thead><tr><th style="text-align:left;padding:8px;border-bottom:1px solid #ffffff30">Hari</th>' +
      '<th style="text-align:left;padding:8px;border-bottom:1px solid #ffffff30">Menu</th></tr></thead>' +
      '<tbody>' + rows + '</tbody></table>';

    const latihan = HARI.filter((h) => (jadwal[h] || 'istirahat') !== 'istirahat').length;
    const istirahat = 7 - latihan;
    sumBox.hidden = false;
    let saran = '';
    if (latihan === 0) saran = 'Semua hari istirahat? Badanmu juga butuh gerak dikit, coba selipin 2-3 hari latihan ringan. 🙂';
    else if (latihan >= 6) saran = 'Hati-hati overtraining — badan tumbuh pas istirahat, bukan pas latihan. Kasih minimal 1-2 hari jeda ya.';
    else if (istirahat >= 2) saran = 'Bagus, seimbang. Jadwal segini aman buat jangka panjang. 🔥';
    else saran = 'Jadwalmu lumayan padat. Pastikan tidur cukup biar recovery-nya jalan.';
    sumBox.innerHTML =
      '<div class="kv"><span class="k">🏃 Hari latihan</span><span class="v">' + latihan + ' hari</span></div>' +
      '<div class="kv"><span class="k">😴 Hari istirahat</span><span class="v">' + istirahat + ' hari</span></div>' +
      '<div class="hint" style="margin-top:6px">' + saran + '</div>';
  };

  draw();
}
