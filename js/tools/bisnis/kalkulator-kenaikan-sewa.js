import { h as T, utils, kv } from '../../core.js';

// Kenaikan sewa: sewa baru setelah naik, plus proyeksi tiap tahun bila
// kenaikan yang sama berulang. Mode persen: sewa naik sekian persen dari
// sewa tahun sebelumnya (majemuk). Mode nominal: sewa naik sekian rupiah
// tiap tahun (tetap).
export function hitungKenaikanSewa(sewa, nilai, mode, tahun) {
  const s = Number(sewa);
  const v = Number(nilai);
  const n = Math.floor(Number(tahun));
  if (![s, v, n].every(isFinite) || s <= 0 || v < 0 || n < 1 || n > 30) return null;
  const proyeksi = [];
  let jalan = s;
  for (let t = 1; t <= n; t++) {
    const naik = mode === 'nominal' ? v : jalan * v / 100;
    jalan += naik;
    proyeksi.push({ tahun: t, sewa: jalan, naik });
  }
  const totalTambahan = proyeksi.reduce((a, p) => a + (p.sewa - s) * 12, 0);
  return {
    sewaBaru: proyeksi[0].sewa,
    kenaikanPertama: proyeksi[0].naik,
    sewaAkhir: jalan,
    totalTambahan,
    proyeksi,
  };
}
utils.kenaikanSewa = hitungKenaikanSewa;

export const meta = {"id": "kalkulator-kenaikan-sewa", "name": "Kalkulator Kenaikan Sewa", "cat": "bisnis", "icon": "🏘️", "desc": "Berapa sewa barumu setelah naik, dan berapa jadinya dalam beberapa tahun.", "keywords": "sewa,kenaikan sewa,kos,kontrakan,apartemen,ruko,properti,naik,bulanan", "since": "6.18.0"};
export function render(root) {
  const sewaI = T.input('text', 'cth: 2500000', ''); sewaI.inputMode = 'decimal';
  const modeSel = T.select([['persen', 'Naik sekian persen'], ['nominal', 'Naik sekian rupiah']], 'persen');
  const nilaiI = T.input('text', 'cth: 10', ''); nilaiI.inputMode = 'decimal';
  const tahunI = T.input('text', 'cth: 3', ''); tahunI.inputMode = 'decimal';
  const box = T.out();

  const hitung = () => {
    const sewa = T.num(sewaI.value);
    const nilai = T.num(nilaiI.value);
    const tahun = T.num(tahunI.value);
    if (!isFinite(sewa) || sewa <= 0) {
      T.show(box, '<div class="err">Sewa sekarang harus diisi angka lebih dari 0.</div>');
      return;
    }
    if (!isFinite(nilai) || nilai < 0) {
      T.show(box, '<div class="err">Kenaikan harus diisi angka 0 atau lebih.</div>');
      return;
    }
    if (!isFinite(tahun) || tahun < 1 || tahun > 30 || Math.floor(tahun) !== tahun) {
      T.show(box, '<div class="err">Lama proyeksi harus bilangan bulat antara 1 sampai 30 tahun.</div>');
      return;
    }
    const r = hitungKenaikanSewa(sewa, nilai, modeSel.value, tahun);
    if (!r) {
      T.show(box, '<div class="err">Angkanya tidak bisa dihitung. Cek lagi yang kamu isi.</div>');
      return;
    }
    const baris = r.proyeksi.map((p) =>
      '<tr><td style="padding:6px 8px">Tahun ke-' + p.tahun + '</td><td style="padding:6px 8px;text-align:right">' + T.rp(Math.round(p.sewa)) + '</td><td style="padding:6px 8px;text-align:right">+' + T.rp(Math.round(p.naik)) + '</td></tr>').join('');
    T.show(box,
      '<div class="big">' + T.rp(Math.round(r.sewaBaru)) + '<span style="font-size:13px;font-weight:400"> / bulan</span></div>' +
      '<p class="center mut">Sewa baru setelah naik ' + (modeSel.value === 'persen' ? String(nilai).replace('.', ',') + '%' : T.rp(Math.round(nilai))) + '.</p>' +
      kv('Sewa sekarang', T.rp(Math.round(sewa)) + ' / bulan') +
      kv('Naik tahun pertama', '+' + T.rp(Math.round(r.kenaikanPertama)) + ' / bulan') +
      kv('Sewa tahun ke-' + tahun, T.rp(Math.round(r.sewaAkhir)) + ' / bulan') +
      kv('Tambahan total selama ' + tahun + ' tahun', T.rp(Math.round(r.totalTambahan))) +
      '<div style="overflow-x:auto;margin-top:12px"><table style="width:100%;border-collapse:collapse;font-size:13px"><tr><th style="text-align:left;padding:6px 8px;border-bottom:1px solid rgba(255,255,255,.15)">Tahun</th><th style="text-align:right;padding:6px 8px;border-bottom:1px solid rgba(255,255,255,.15)">Sewa / bulan</th><th style="text-align:right;padding:6px 8px;border-bottom:1px solid rgba(255,255,255,.15)">Naik</th></tr>' + baris + '</table></div>' +
      '<p class="hint">' + (modeSel.value === 'persen' ? 'Mode persen memakai kenaikan majemuk: tiap tahun naik dari sewa tahun sebelumnya, jadi kenaikannya membesar tiap tahun.' : 'Mode nominal memakai kenaikan tetap tiap tahun.') + ' Kenaikan sewa yang wajar biasanya mengikuti inflasi dan harga sewa di sekitar lokasi.</p>');
  };

  root.appendChild(T.el('<p class="note">Mau menaikkan sewa kos, kontrakan, atau ruko? Masukkan sewa sekarang dan besar kenaikannya, dan lihat sewa baru plus proyeksinya beberapa tahun ke depan.</p>'));
  root.appendChild(T.field('Sewa sekarang (Rp / bulan)', sewaI));
  root.appendChild(T.field('Cara naik', modeSel));
  root.appendChild(T.field('Besar kenaikan (% atau Rp / tahun)', nilaiI, 'Isi persen bila mode persen, isi rupiah bila mode nominal'));
  root.appendChild(T.field('Lama proyeksi (tahun)', tahunI));
  root.appendChild(T.row(T.btn('Hitung sewa baru', hitung, true)));
  root.appendChild(box);
}
