import { h as T } from '../../core.js?v=6.9.5';

export const meta = {"id": "jadwal-piket-harian", "name": "Generator Jadwal Piket", "cat": "produktivitas", "icon": "🗓️", "desc": "Susun jadwal piket harian otomatis.", "keywords": "piket,jadwal,giliran,kelas,kantor", "file": "tools/produktivitas/jadwal-piket-harian.js"};

const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

const fmtTgl = (d) => HARI[d.getDay()] + ', ' + d.getDate() + ' ' + BULAN[d.getMonth()] + ' ' + d.getFullYear();

export function render(root) {
  const daftar = T.ta(6, 'Satu nama per baris…\ncth:\nBudi\nSari\nAndi\nDewi');
  const mulai = T.input('date', '', new Date().toISOString().slice(0, 10));
  const jmlHari = T.input('text', 'cth: 14', '14');
  jmlHari.inputMode = 'numeric';
  const skipWknd = T.el('<label style="display:flex;gap:8px;align-items:center;font-size:14px"><input type="checkbox"> Lewati Sabtu & Minggu</label>');

  const box = T.out();
  let hasilTeks = '';

  const buat = () => {
    const nama = daftar.value.split('\n').map((s) => s.trim()).filter(Boolean);
    if (nama.length < 2) { T.show(box, '<p class="warn">Isi minimal 2 nama dulu ya.</p>'); return; }
    const n = Math.floor(T.num(jmlHari.value));
    if (!(n >= 1)) { T.show(box, '<p class="warn">Jumlah hari minimal 1.</p>'); return; }
    const tgl0 = new Date(mulai.value + 'T00:00:00');
    if (isNaN(tgl0.getTime())) { T.show(box, '<p class="warn">Tanggal mulai tidak valid.</p>'); return; }
    const lewati = skipWknd.querySelector('input').checked;

    const baris = [];
    const d = new Date(tgl0);
    let gilir = 0;
    let guard = 0;
    while (baris.length < n && guard++ < 2000) {
      const wd = d.getDay();
      if (!(lewati && (wd === 0 || wd === 6))) {
        baris.push({ tgl: new Date(d), nama: nama[gilir % nama.length] });
        gilir++;
      }
      d.setDate(d.getDate() + 1);
    }

    let html = '<table style="width:100%;font-size:14px;border-collapse:collapse;margin-top:8px">';
    html += '<tr><th style="text-align:left;padding:6px 4px;border-bottom:1px solid #ffffff20">Tanggal</th><th style="text-align:right;padding:6px 4px;border-bottom:1px solid #ffffff20">Piket</th></tr>';
    baris.forEach((b) => {
      html += '<tr><td style="padding:6px 4px;border-bottom:1px solid #ffffff10">' + T.esc(fmtTgl(b.tgl)) + '</td>' +
        '<td style="padding:6px 4px;border-bottom:1px solid #ffffff10;text-align:right;font-weight:600">' + T.esc(b.nama) + '</td></tr>';
    });
    html += '</table>';
    hasilTeks = '🗓️ JADWAL PIKET\n' + baris.map((b) => '• ' + fmtTgl(b.tgl) + ' → ' + b.nama).join('\n');
    T.show(box, '<p class="mut" style="font-size:13px">' + baris.length + ' hari · ' + nama.length + ' orang bergiliran</p>' + html);
    box.appendChild(T.row(T.copyBtn(() => hasilTeks, '📋 Salin Hasil')));
  };

  root.appendChild(T.field('Daftar nama', daftar, 'Satu nama per baris. Minimal 2 nama.'));
  root.appendChild(T.field('Tanggal mulai', mulai));
  root.appendChild(T.field('Jumlah hari piket', jmlHari));
  root.appendChild(skipWknd);
  root.appendChild(T.row(T.btn('Buat Jadwal', buat, true)));
  root.appendChild(box);
}
