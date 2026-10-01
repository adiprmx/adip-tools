import { h as T, utils, p2, parseISO, todayISO } from '../../core.js?v=5.0.0';

export const meta = {"id": "age-calc", "name": "Kalkulator Umur", "cat": "sehari", "icon": "🎂", "desc": "Umur presisi tahun-bulan-hari."};

export function render(root) {

    const lahir = T.input('date', 'Tanggal lahir', '2000-01-01');
    const ref = T.input('date', 'Tanggal acuan', todayISO());
    const box = T.out();
    const hitung = () => {
      const r = utils.ageParts(lahir.value, ref.value);
      if (!r) { T.show(box, '<span class="err">Tanggal lahir harus sebelum tanggal acuan.</span>'); return; }
      const totalBulan = r.tahun * 12 + r.bulan;
      const totalMinggu = Math.floor(r.totalHari / 7);
      // ulang tahun berikutnya
      const refD = parseISO(ref.value), lahirD = parseISO(lahir.value);
      let y = refD.getUTCFullYear();
      let next = new Date(Date.UTC(y, lahirD.getUTCMonth(), lahirD.getUTCDate()));
      if (isNaN(next.getTime()) || next < refD) {
        y += 1;
        next = new Date(Date.UTC(y, lahirD.getUTCMonth(), lahirD.getUTCDate()));
      }
      if (isNaN(next.getTime())) next = new Date(Date.UTC(y, 1, 28)); // 29 Feb -> 28 Feb
      const sisa = Math.round((next - refD) / 86400000);
      const tglNext = next.getUTCDate() + '/' + (next.getUTCMonth() + 1) + '/' + next.getUTCFullYear();
      T.show(box,
        '<div class="center"><div class="big">' + r.tahun + ' thn ' + r.bulan + ' bln ' + r.hari + ' hari</div></div>' +
        '<div class="kv"><span class="k">Total hari</span><span class="v">' + T.fmt(r.totalHari) + ' hari</span></div>' +
        '<div class="kv"><span class="k">Total bulan</span><span class="v">' + T.fmt(totalBulan) + ' bulan</span></div>' +
        '<div class="kv"><span class="k">Total minggu</span><span class="v">' + T.fmt(totalMinggu) + ' minggu</span></div>' +
        '<div class="kv"><span class="k">Ulang tahun ke-' + (r.tahun + 1) + '</span><span class="v">' + tglNext + ' (' + (sisa === 0 ? 'hari ini! 🎉' : sisa + ' hari lagi') + ')</span></div>');
    };
    root.appendChild(T.grid2(T.field('Tanggal lahir', lahir), T.field('Tanggal acuan', ref)));
    root.appendChild(T.btn('Hitung', hitung, true));
    root.appendChild(box);
    hitung();
  
}
