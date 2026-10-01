import { h as T, utils, todayISO } from '../../core.js?v=6.6.0';

export const meta = {"id": "jadwal-shift", "name": "Jadwal Shift", "cat": "indonesia", "icon": "🔄", "desc": "Susun jadwal shift karyawan: definisikan pola, rotasi otomatis per tanggal.", "keywords": "jadwal,shift,karyawan,kerja,roster,piket,rotasi,giliran"};
export function render(root) {
  const KEY = 'jadwal-shift-config';
  const DEFAULT_POLA = [
    { kode: 'P', label: 'Pagi', jam: '08.00–16.00' },
    { kode: 'S', label: 'Siang', jam: '14.00–22.00' },
    { kode: 'M', label: 'Malam', jam: '22.00–08.00' },
    { kode: 'L', label: 'Libur', jam: '—' },
  ];
  const HARI = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  let cfg = null;
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (s && Array.isArray(s.pola) && s.pola.length && Array.isArray(s.karyawan) && s.karyawan.length) cfg = s;
  } catch (e) { /* abaikan */ }
  if (!cfg) cfg = { pola: DEFAULT_POLA.map((p) => ({ ...p })), karyawan: ['Andi', 'Budi', 'Citra'] };
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(cfg)); } catch (e) { /* abaikan */ } };

  const polaBox = T.el('<div></div>');
  const kryBox = T.el('<div></div>');
  const tglI = T.input('date', '', todayISO());
  const hariI = T.input('number', 'cth: 30', '30'); hariI.inputMode = 'numeric';
  const outBox = T.out();

  const renderPola = () => {
    polaBox.innerHTML = '';
    cfg.pola.forEach((p, i) => {
      const w = T.el('<div style="display:flex;gap:8px;margin-bottom:8px;align-items:center"></div>');
      const kode = T.input('text', 'Kode', p.kode); kode.style.flex = '0 0 64px'; kode.maxLength = 3;
      const label = T.input('text', 'Nama shift', p.label); label.style.flex = '1';
      const jam = T.input('text', 'Jam', p.jam); jam.style.flex = '1.4';
      const del = T.btn('✕', () => { if (cfg.pola.length > 1) { cfg.pola.splice(i, 1); save(); renderPola(); } else T.toast('Minimal 1 shift'); });
      del.style.flexShrink = '0';
      kode.addEventListener('input', () => { p.kode = kode.value.trim().toUpperCase() || '?'; save(); });
      label.addEventListener('input', () => { p.label = label.value.trim(); save(); });
      jam.addEventListener('input', () => { p.jam = jam.value.trim(); save(); });
      w.appendChild(kode); w.appendChild(label); w.appendChild(jam); w.appendChild(del);
      polaBox.appendChild(w);
    });
    polaBox.appendChild(T.btn('＋ Tambah shift', () => {
      cfg.pola.push({ kode: 'X', label: 'Shift baru', jam: '' });
      save(); renderPola();
    }));
  };

  const renderKry = () => {
    kryBox.innerHTML = '';
    cfg.karyawan.forEach((n, i) => {
      const w = T.el('<div style="display:flex;gap:8px;margin-bottom:8px;align-items:center"></div>');
      const inp = T.input('text', 'Nama karyawan', n); inp.style.flex = '1';
      const del = T.btn('✕', () => { if (cfg.karyawan.length > 1) { cfg.karyawan.splice(i, 1); save(); renderKry(); } else T.toast('Minimal 1 karyawan'); });
      del.style.flexShrink = '0';
      inp.addEventListener('input', () => { cfg.karyawan[i] = inp.value; save(); });
      w.appendChild(inp); w.appendChild(del);
      kryBox.appendChild(w);
    });
    kryBox.appendChild(T.btn('＋ Tambah karyawan', () => {
      cfg.karyawan.push('');
      save(); renderKry();
    }));
  };

  const pad2 = (n) => String(n).padStart(2, '0');

  const generate = () => {
    const pola = cfg.pola.filter((p) => p.kode && p.kode.trim());
    const kry = cfg.karyawan.map((k) => String(k).trim()).filter(Boolean);
    if (!tglI.value) { T.show(outBox, '<p class="warn">Pilih tanggal mulai dulu.</p>'); return; }
    const nHari = Math.floor(T.num(hariI.value) || 0);
    if (!(nHari >= 1 && nHari <= 365)) { T.show(outBox, '<p class="warn">Jumlah hari harus 1–365.</p>'); return; }
    if (!pola.length || !kry.length) { T.show(outBox, '<p class="warn">Isi minimal 1 shift dan 1 nama karyawan.</p>'); return; }

    const [y0, m0, d0] = tglI.value.split('-').map(Number);
    const th = '<tr><th style="text-align:left;padding:8px;position:sticky;left:0;background:#1c1a17">Tanggal</th>' +
      '<th style="text-align:left;padding:8px">Hari</th>' +
      kry.map((k) => '<th style="text-align:center;padding:8px;min-width:76px">' + T.esc(k) + '</th>').join('') + '</tr>';
    let tr = '';
    const txtRows = [];
    for (let d = 0; d < nHari; d++) {
      const dt = new Date(y0, m0 - 1, d0 + d);
      const tglStr = pad2(dt.getDate()) + '/' + pad2(dt.getMonth() + 1);
      const hari = HARI[dt.getDay()];
      const cells = kry.map((k, ki) => {
        const s = pola[(d + ki) % pola.length];
        const libur = /^l(ibur)?$/i.test(s.kode) || /^libur$/i.test(s.label);
        return '<td style="text-align:center;padding:8px;font-weight:700;' + (libur ? 'color:var(--faint)' : '') + '" title="' + T.esc(s.label + (s.jam ? ' (' + s.jam + ')' : '')) + '">' + T.esc(s.kode) + '</td>';
      }).join('');
      tr += '<tr style="border-top:1px solid var(--line)"><td style="padding:8px;white-space:nowrap;position:sticky;left:0;background:#1c1a17">' + tglStr + '</td>' +
        '<td style="padding:8px">' + hari + '</td>' + cells + '</tr>';
      txtRows.push(tglStr + ' ' + hari + '  |  ' + kry.map((k, ki) => k + ': ' + pola[(d + ki) % pola.length].kode).join('  |  '));
    }
    const legend = pola.map((s) => '<span style="display:inline-block;margin:0 8px 6px 0;font-size:12.5px"><b>' + T.esc(s.kode) + '</b> = ' + T.esc(s.label) + (s.jam ? ' (' + T.esc(s.jam) + ')' : '') + '</span>').join('');
    const tblHtml = '<div style="overflow-x:auto;margin-bottom:12px"><table style="border-collapse:collapse;font-size:13px;min-width:100%">' + th + tr + '</table></div>';
    const txt = 'Jadwal Shift (' + nHari + ' hari, mulai ' + tglI.value + ')\n\n' + txtRows.join('\n');
    T.show(outBox,
      '<p class="hint" style="margin-bottom:10px"><b>Legenda:</b><br/>' + legend + '</p>' +
      tblHtml +
      '<div id="shift-copy-slot"></div>');
    outBox.querySelector('#shift-copy-slot').appendChild(T.copyBtn(() => txt, 'Salin jadwal (teks)'));
  };

  root.appendChild(T.el('<p class="note">Atur pola shift sekali, daftar nama karyawan, terus generate — rotasinya jalan otomatis tiap hari. Config tersimpan di HP kamu.</p>'));
  root.appendChild(T.el('<p class="mut" style="margin:14px 0 6px;font-weight:600">Pola shift</p>'));
  root.appendChild(polaBox);
  root.appendChild(T.el('<p class="mut" style="margin:14px 0 6px;font-weight:600">Karyawan</p>'));
  root.appendChild(kryBox);
  root.appendChild(T.el('<p class="mut" style="margin:14px 0 6px;font-weight:600">Periode</p>'));
  root.appendChild(T.grid2(T.field('Tanggal mulai', tglI), T.field('Jumlah hari', hariI)));
  root.appendChild(T.row(T.btn('Buat jadwal', generate, true)));
  root.appendChild(outBox);
  renderPola();
  renderKry();
}
