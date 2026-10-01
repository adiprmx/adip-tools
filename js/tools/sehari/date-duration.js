import { h as T, utils, p2, parseISO, todayISO } from '../../core.js?v=6.8.0';

export const meta = {"id": "date-duration", "name": "Durasi Tanggal", "cat": "sehari", "icon": "📅", "desc": "Durasi antara dua tanggal.", "keywords": "tanggal,durasi,selisih,hari"};
export function render(root) {

    const dari = T.input('date', 'Tanggal awal', todayISO());
    const sampai = T.input('date', 'Tanggal akhir', todayISO());
    const cekKerja = document.createElement('input');
    cekKerja.type = 'checkbox'; cekKerja.checked = true; cekKerja.id = 'dd-kj';
    const box = T.out();
    const hitung = () => {
      const a = parseISO(dari.value), b = parseISO(sampai.value);
      if (!a || !b) { T.show(box, '<span class="err">Isi kedua tanggal dengan benar.</span>'); return; }
      const awal = a < b ? a : b, akhir = a < b ? b : a;
      const totalHari = Math.round((akhir - awal) / 86400000);
      const minggu = Math.floor(totalHari / 7), sisaHari = totalHari % 7;
      let html =
        '<div class="center"><div class="big">' + T.fmt(totalHari) + ' hari</div></div>' +
        '<div class="kv"><span class="k">Minggu</span><span class="v">' + minggu + ' minggu ' + sisaHari + ' hari</span></div>' +
        '<div class="kv"><span class="k">Bulan (perkiraan)</span><span class="v">± ' + (totalHari / 30.44).toFixed(1) + ' bulan</span></div>' +
        '<div class="kv"><span class="k">Tahun (perkiraan)</span><span class="v">± ' + (totalHari / 365.25).toFixed(2) + ' tahun</span></div>';
      if (cekKerja.checked) {
        let kerja = 0;
        for (let t = awal.getTime(); t < akhir.getTime(); t += 86400000) {
          const w = new Date(t).getUTCDay();
          if (w >= 1 && w <= 5) kerja++;
        }
        html += '<div class="kv"><span class="k">Hari kerja (Senin-Jumat)</span><span class="v">' + T.fmt(kerja) + ' hari</span></div>';
      }
      T.show(box, html);
    };
    root.appendChild(T.grid2(T.field('Tanggal awal', dari), T.field('Tanggal akhir', sampai)));
    const lbl = T.el('<label style="display:flex;gap:8px;align-items:center;font-size:14px;margin:4px 0 10px"></label>');
    lbl.appendChild(cekKerja);
    lbl.appendChild(document.createTextNode('Hitung hari kerja (Senin-Jumat)'));
    root.appendChild(lbl);
    root.appendChild(T.btn('Hitung', hitung, true));
    root.appendChild(box);
    hitung();
  
}
