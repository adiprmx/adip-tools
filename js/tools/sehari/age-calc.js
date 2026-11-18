import { h as T, utils, p2, parseISO, todayISO } from '../../core.js';

// Logika murni (bisa di-test di Node) — dipertahankan dari kalkulator-umur.
utils.hitungUmur = function (tglStr, nowMs) {
  const lahir = new Date(tglStr + 'T00:00:00');
  if (isNaN(lahir)) return null;
  const now = nowMs ? new Date(nowMs) : new Date();
  if (lahir > now) return null;
  let y = now.getFullYear() - lahir.getFullYear();
  let m = now.getMonth() - lahir.getMonth();
  let d = now.getDate() - lahir.getDate();
  if (d < 0) { m--; d += new Date(now.getFullYear(), now.getMonth(), 0).getDate(); }
  if (m < 0) { y--; m += 12; }
  const totalDays = Math.floor((now - lahir) / 86400000);
  const next = new Date(lahir);
  next.setFullYear(now.getFullYear());
  if (next < now) next.setFullYear(now.getFullYear() + 1);
  const sisaUltah = Math.ceil((next - now) / 86400000);
  return {
    tahun: y, bulan: m, hari: d,
    totalHari: totalDays,
    totalMinggu: Math.floor(totalDays / 7),
    totalBulan: y * 12 + m,
    sisaUltah
  };
};

export const meta = {"id": "age-calc", "name": "Kalkulator Umur", "cat": "sehari", "icon": "🎂", "desc": "Hitung umur persis hari ini atau di tanggal yang kamu pilih: tahun, bulan, hari + hitung mundur ultah.", "keywords": "umur,usia,lahir,tanggal,ulang tahun,ultah,age,tanggal lahir"};
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
    root.appendChild(T.grid2(T.field('Tanggal lahir', lahir), T.field('Tanggal hitung', ref)));
    root.appendChild(T.btn('Hitung', hitung, true));
    root.appendChild(box);
    hitung();
  
}
