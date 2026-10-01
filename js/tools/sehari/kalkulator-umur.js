import { h as T, utils, onLeave } from '../../core.js?v=6.8.0';

// Logika murni (bisa di-test di Node)
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

export const meta = {"id": "kalkulator-umur", "name": "Kalkulator Umur", "cat": "sehari", "icon": "🎂", "desc": "Hitung umur persis: tahun, bulan, hari + total hari & hitung mundur ultah", "keywords": "umur,usia,ulang tahun,ultah,age,tanggal lahir"};

export function render(root) {
  const tgl = T.input('date', 'Tanggal lahir', '');
  const box = T.out();
  const btn = T.btn('Hitung Umur', calc, true);

  function calc() {
    const r = utils.hitungUmur(tgl.value);
    if (!r) { T.show(box, '<div class="hint">⚠️ Isi tanggal lahir yang valid (tidak boleh di masa depan).</div>'); return; }
    T.show(box, `
      <div class="big">${r.tahun} <span style="font-size:14px">tahun</span> ${r.bulan} <span style="font-size:14px">bulan</span> ${r.hari} <span style="font-size:14px">hari</span></div>
      <div class="kv"><span>Total bulan</span><b>${r.totalBulan.toLocaleString('id-ID')}</b></div>
      <div class="kv"><span>Total minggu</span><b>${r.totalMinggu.toLocaleString('id-ID')}</b></div>
      <div class="kv"><span>Total hari</span><b>${r.totalHari.toLocaleString('id-ID')}</b></div>
      <div class="kv"><span>Ulang tahun berikutnya</span><b>${r.sisaUltah === 0 ? '🎉 Hari ini!' : r.sisaUltah + ' hari lagi'}</b></div>`);
  }
  btn.addEventListener('click', calc);
  onLeave(root, () => {});
  root.appendChild(T.field('Tanggal lahir', tgl));
  root.appendChild(btn);
  root.appendChild(box);
}
