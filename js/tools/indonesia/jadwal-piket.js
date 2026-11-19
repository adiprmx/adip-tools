import { h as T, utils, beep, actx, onLeave, todayISO } from '../../core.js';

export const meta = {"id": "jadwal-piket", "name": "Jadwal Piket", "cat": "indonesia", "icon": "🧹", "desc": "Rotasi piket harian: pilih hari aktif, atur jumlah hari, tampilkan jadwal ke depan.", "keywords": "piket,jadwal,bersih,sekolah,kantor,giliran,rotasi,hari,harian,generator"};
export function render(root) {
  const KEY = 'jadwal-piket-config';
  const HARI_IDX = [1, 2, 3, 4, 5, 6, 0]; // Senin..Minggu
  const HARI_LABEL = { 0: 'Min', 1: 'Sen', 2: 'Sel', 3: 'Rab', 4: 'Kam', 5: 'Jum', 6: 'Sab' };
  const HARI_PENUH = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const pad2 = (n) => String(n).padStart(2, '0');
  // todayISO dari core.js.

  let cfg = null;
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (s && typeof s === 'object' && Array.isArray(s.nama)) cfg = s;
  } catch (e) { /* abaikan */ }
  if (!cfg) cfg = { nama: ['Andi', 'Budi', 'Citra'], aktif: [1, 2, 3, 4, 5], mulai: todayISO(), jumlah: 14, hitung: 'kalender' };
  if (!cfg.mulai) cfg.mulai = todayISO();
  if (!cfg.jumlah) cfg.jumlah = 14;
  if (!cfg.hitung) cfg.hitung = 'kalender';
  if (!Array.isArray(cfg.aktif) || !cfg.aktif.length) cfg.aktif = [1, 2, 3, 4, 5];
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(cfg)); } catch (e) { /* abaikan */ } };

  const ta = T.ta(5, 'Satu nama per baris…\ncth:\nAndi\nBudi\nCitra', cfg.nama.join('\n'));
  const tglI = T.input('date', '', cfg.mulai);
  const jmlHari = T.input('text', 'cth: 14', String(cfg.jumlah));
  jmlHari.inputMode = 'numeric';
  const hitungSel = T.select([
    ['kalender', 'Kalender — hitung semua tanggal, hari libur ikut tampil'],
    ['piket', 'Hari piket saja — hanya hari aktif yang dijadwalkan'],
  ], cfg.hitung);
  const hariBox = T.el('<div style="display:flex;flex-wrap:wrap;gap:8px;margin:6px 0 4px"></div>');
  const checks = {};
  HARI_IDX.forEach((idx) => {
    const lab = T.el('<label style="display:inline-flex;align-items:center;gap:6px;font-size:13px;cursor:pointer;border:1px solid var(--line);border-radius:8px;padding:7px 12px"></label>');
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = cfg.aktif.indexOf(idx) !== -1;
    cb.addEventListener('change', () => {
      const set = HARI_IDX.filter((h) => checks[h].checked);
      if (!set.length) { cb.checked = true; T.toast('Minimal 1 hari aktif'); return; }
      cfg.aktif = set; save();
    });
    checks[idx] = cb;
    lab.appendChild(cb);
    lab.appendChild(T.el('<span>' + HARI_LABEL[idx] + '</span>'));
    hariBox.appendChild(lab);
  });

  const outBox = T.out();
  const getNama = () => ta.value.split('\n').map((s) => s.trim()).filter(Boolean);
  const getAktif = () => HARI_IDX.filter((h) => checks[h].checked);

  const preset = (arr) => {
    HARI_IDX.forEach((h) => { checks[h].checked = arr.indexOf(h) !== -1; });
    cfg.aktif = arr.slice(); save();
  };

  const generate = () => {
    const nama = getNama();
    const aktif = getAktif();
    if (!tglI.value) { T.show(outBox, '<p class="warn">Pilih tanggal mulai dulu.</p>'); return; }
    if (!nama.length) { T.show(outBox, '<p class="warn">Isi minimal 1 nama.</p>'); return; }
    if (!aktif.length) { T.show(outBox, '<p class="warn">Pilih minimal 1 hari aktif.</p>'); return; }
    cfg.nama = nama; cfg.mulai = tglI.value;
    const n = Math.floor(T.num(jmlHari.value));
    if (!(n >= 1)) { T.show(outBox, '<p class="warn">Jumlah hari minimal 1.</p>'); return; }
    const modeHitung = hitungSel.value;
    cfg.jumlah = n; cfg.hitung = modeHitung; save();

    const [y0, m0, d0] = tglI.value.split('-').map(Number);
    let tr = '';
    const txtRows = [];
    let k = 0;
    let d = 0, guard = 0;
    // Kalender: jendela n tanggal (hari tidak aktif tampil sebagai —).
    // Hari piket: jalan sampai n hari aktif terjadwal (hari tidak aktif dilewati).
    while ((modeHitung === 'kalender' ? d < n : k < n) && guard++ < 2000) {
      const dt = new Date(y0, m0 - 1, d0 + d);
      d++;
      const dow = dt.getDay();
      const tglStr = pad2(dt.getDate()) + '/' + pad2(dt.getMonth() + 1);
      const hari = HARI_PENUH[dow];
      if (aktif.indexOf(dow) === -1) {
        if (modeHitung === 'piket') continue;
        tr += '<tr style="border-top:1px solid var(--line);opacity:.45"><td style="padding:8px;white-space:nowrap">' + tglStr + '</td>' +
          '<td style="padding:8px">' + hari + '</td><td style="padding:8px" class="mut">—</td></tr>';
        txtRows.push(tglStr + ' (' + hari + '): —');
        continue;
      }
      const orang = nama[k % nama.length]; k++;
      tr += '<tr style="border-top:1px solid var(--line)"><td style="padding:8px;white-space:nowrap">' + tglStr + '</td>' +
        '<td style="padding:8px">' + hari + '</td>' +
        '<td style="padding:8px;font-weight:600">' + T.esc(orang) + '</td></tr>';
      txtRows.push(tglStr + ' (' + hari + '): ' + orang);
    }
    const tblHtml = '<div style="overflow-x:auto;margin-bottom:12px"><table style="border-collapse:collapse;font-size:13px;min-width:100%">' +
      '<tr><th style="text-align:left;padding:8px">Tanggal</th><th style="text-align:left;padding:8px">Hari</th><th style="text-align:left;padding:8px">Petugas piket</th></tr>' +
      tr + '</table></div>';
    const txt = 'Jadwal Piket (' + n + (modeHitung === 'piket' ? ' hari piket' : ' hari') + ', mulai ' + tglI.value + ')\n\n' + txtRows.join('\n');
    T.show(outBox,
      '<p class="hint" style="margin-bottom:10px">Rotasi ' + nama.length + ' orang pada hari: ' + aktif.map((a) => HARI_LABEL[a]).join(', ') + '.</p>' +
      tblHtml +
      '<div id="piket-copy-slot"></div>');
    outBox.querySelector('#piket-copy-slot').appendChild(T.copyBtn(() => txt, 'Salin jadwal'));
    beep(560, 0.08, 'sine');
  };

  root.appendChild(T.el('<p class="note">Susun jadwal piket harian. Pilih hari aktif (bisa Senin–Jumat, tambah Sabtu, atau semua hari), atur berapa hari, lalu sistem merotasi nama otomatis.</p>'));
  root.appendChild(T.field('Daftar nama (satu per baris)', ta));
  root.appendChild(T.el('<p class="mut" style="margin:14px 0 6px;font-weight:600">Hari aktif</p>'));
  root.appendChild(hariBox);
  root.appendChild(T.row(
    T.btn('Senin–Jumat', () => preset([1, 2, 3, 4, 5])),
    T.btn('Senin–Sabtu', () => preset([1, 2, 3, 4, 5, 6])),
    T.btn('Setiap hari', () => preset([0, 1, 2, 3, 4, 5, 6]))
  ));
  root.appendChild(T.grid2(T.field('Tanggal mulai', tglI), T.field('Jumlah hari', jmlHari)));
  root.appendChild(T.field('Hitung hari sebagai', hitungSel));
  root.appendChild(T.row(T.btn('Buat jadwal piket', generate, true)));
  root.appendChild(outBox);

  [ta, tglI, jmlHari].forEach((el) => el.addEventListener('input', () => { cfg.nama = getNama(); cfg.mulai = tglI.value; cfg.jumlah = Math.floor(T.num(jmlHari.value)) || 14; save(); }));
  hitungSel.addEventListener('change', () => { cfg.hitung = hitungSel.value; save(); });
}
