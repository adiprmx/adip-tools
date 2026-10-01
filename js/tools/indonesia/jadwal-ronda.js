import { h as T, utils, beep, actx, onLeave } from '../../core.js?v=6.8.0';

export const meta = {"id": "jadwal-ronda", "name": "Jadwal Ronda", "cat": "indonesia", "icon": "🌙", "desc": "Generate jadwal ronda malam 14 hari: rotasi otomatis warga per malam.", "keywords": "ronda,siskamling,jaga,malam,warga,jadwal,rotasi,keamanan"};
export function render(root) {
  const KEY = 'jadwal-ronda-config';
  const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const pad2 = (n) => String(n).padStart(2, '0');
  const todayISO = () => { const d = new Date(); return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); };

  let cfg = null;
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (s && typeof s === 'object' && Array.isArray(s.nama)) cfg = s;
  } catch (e) { /* abaikan */ }
  if (!cfg) cfg = { nama: ['Warga 1', 'Warga 2', 'Warga 3', 'Warga 4'], mulai: todayISO(), perMalam: 2 };
  if (!cfg.mulai) cfg.mulai = todayISO();
  if (!(cfg.perMalam > 0)) cfg.perMalam = 2;
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(cfg)); } catch (e) { /* abaikan */ } };

  const ta = T.ta(6, 'Satu nama per baris…\ncth:\nBudi\nAgus\nSlamet', cfg.nama.join('\n'));
  const tglI = T.input('date', '', cfg.mulai);
  const perI = T.input('number', 'cth: 2', String(cfg.perMalam)); perI.inputMode = 'numeric';
  const outBox = T.out();

  const getNama = () => ta.value.split('\n').map((s) => s.trim()).filter(Boolean);

  const generate = () => {
    const nama = getNama();
    const per = Math.floor(T.num(perI.value) || 0);
    if (!tglI.value) { T.show(outBox, '<p class="warn">Pilih tanggal mulai dulu.</p>'); return; }
    if (!nama.length) { T.show(outBox, '<p class="warn">Isi minimal 1 nama warga.</p>'); return; }
    if (!(per >= 1)) { T.show(outBox, '<p class="warn">Jumlah orang per malam minimal 1.</p>'); return; }

    cfg.nama = nama; cfg.mulai = tglI.value; cfg.perMalam = per; save();

    const [y0, m0, d0] = tglI.value.split('-').map(Number);
    let tr = '';
    const txtRows = [];
    for (let d = 0; d < 14; d++) {
      const dt = new Date(y0, m0 - 1, d0 + d);
      const tglStr = pad2(dt.getDate()) + '/' + pad2(dt.getMonth() + 1);
      const hari = HARI[dt.getDay()];
      const tim = [];
      for (let i = 0; i < per; i++) tim.push(nama[(d * per + i) % nama.length]);
      tr += '<tr style="border-top:1px solid var(--line)"><td style="padding:8px;white-space:nowrap">' + tglStr + '</td>' +
        '<td style="padding:8px">' + hari + '</td>' +
        '<td style="padding:8px">' + tim.map((n) => T.esc(n)).join(', ') + '</td></tr>';
      txtRows.push(tglStr + ' (' + hari + '): ' + tim.join(', '));
    }
    const tblHtml = '<div style="overflow-x:auto;margin-bottom:12px"><table style="border-collapse:collapse;font-size:13px;min-width:100%">' +
      '<tr><th style="text-align:left;padding:8px">Tanggal</th><th style="text-align:left;padding:8px">Hari</th><th style="text-align:left;padding:8px">Petugas ronda</th></tr>' +
      tr + '</table></div>';
    const txt = 'Jadwal Ronda Siskamling (14 hari, mulai ' + tglI.value + ', ' + per + ' orang/malam)\n\n' + txtRows.join('\n');
    T.show(outBox,
      '<p class="hint" style="margin-bottom:10px">Rotasi otomatis ' + nama.length + ' warga, ' + per + ' orang per malam selama 14 hari.</p>' +
      tblHtml +
      '<div id="ronda-copy-slot"></div>');
    outBox.querySelector('#ronda-copy-slot').appendChild(T.copyBtn(() => txt, 'Salin jadwal'));
    beep(560, 0.08, 'sine');
  };

  root.appendChild(T.el('<p class="note">Susun jadwal ronda/siskamling 14 hari ke depan. Tulis daftar warga, pilih tanggal mulai, dan sistem mengatur rotasinya otomatis.</p>'));
  root.appendChild(T.field('Daftar nama warga (satu per baris)', ta));
  root.appendChild(T.grid2(T.field('Tanggal mulai', tglI), T.field('Orang per malam', perI)));
  root.appendChild(T.row(T.btn('Buat jadwal ronda', generate, true)));
  root.appendChild(outBox);

  [ta, tglI, perI].forEach((el) => el.addEventListener('input', () => {
    cfg.nama = getNama(); cfg.mulai = tglI.value;
    const p = Math.floor(T.num(perI.value) || 0); if (p > 0) cfg.perMalam = p;
    save();
  }));
}
