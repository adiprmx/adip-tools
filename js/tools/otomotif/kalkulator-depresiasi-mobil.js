import { h as T, utils, money, kv } from '../../core.js';

// Perkiraan harga mobil bekas dari harga baru. Tahun pertama turun paling
// besar, tahun berikutnya turun lebih pelan. Nilai = harga baru x (1 - turun
// tahun pertama) x (1 - turun per tahun) ^ (umur - 1). Persentase bawaan
// per merek adalah perkiraan pasar Indonesia dan BISA DIUBAH bebas:
// merek Jepang populer 15% lalu 10%/tahun, merek Jepang lain 18% lalu 12%,
// Eropa 25% lalu 15%, Cina dan Korea 20% lalu 13%. Harga asli tergantung
// kondisi, kilometer, warna, dan permintaan pasar.
const MEREK = {
  populer: { label: 'Merek Jepang populer (Toyota, Daihatsu, Honda)', p1: 15, p2: 10 },
  jepang: { label: 'Merek Jepang lain (Suzuki, Mitsubishi, Nissan)', p1: 18, p2: 12 },
  eropa: { label: 'Merek Eropa (BMW, Mercedes, VW)', p1: 25, p2: 15 },
  asia: { label: 'Merek Cina / Korea (Wuling, Chery, Hyundai, Kia)', p1: 20, p2: 13 },
};
export function hitungDepresiasi(harga, umur, p1, p2) {
  const h = Math.max(0, Number(harga) || 0);
  const u = Math.max(0, Number(umur) || 0);
  const a = Math.max(0, Math.min(99, Number(p1) || 0)) / 100;
  const b = Math.max(0, Math.min(99, Number(p2) || 0)) / 100;
  const nilai = u <= 0 ? h : u <= 1 ? h * (1 - a) : h * (1 - a) * Math.pow(1 - b, u - 1);
  const riwayat = [];
  let v = h;
  for (let t = 0; t <= Math.floor(u); t++) {
    if (t > 0) v = t === 1 ? h * (1 - a) : v * (1 - b);
    riwayat.push({ tahun: t, nilai: Math.round(v) });
  }
  return { nilai: Math.round(nilai), turun: Math.round(h - nilai), persenTurun: h > 0 ? (h - nilai) / h * 100 : 0, riwayat };
}
utils.depresiasiMobil = hitungDepresiasi;

export const meta = {"id": "kalkulator-depresiasi-mobil", "name": "Kalkulator Depresiasi Mobil", "cat": "otomotif", "icon": "🚗", "desc": "Perkiraan harga jual mobil bekas dari harga baru, umur, dan mereknya.", "keywords": "mobil,bekas,depresiasi,harga jual,penyusutan,umur,merek,second", "since": "6.17.0"};
export function render(root) {
  const hargaI = money(null, 'cth: 300000000');
  const umurI = T.input('text', 'cth: 3', '3'); umurI.inputMode = 'decimal';
  const merekSel = T.select(Object.keys(MEREK).map((k) => [k, MEREK[k].label]), 'populer');
  const p1I = T.input('text', 'cth: 15', '15'); p1I.inputMode = 'decimal';
  const p2I = T.input('text', 'cth: 10', '10'); p2I.inputMode = 'decimal';
  const box = T.out();
  let persenDiubah = false;
  [p1I, p2I].forEach((i) => i.addEventListener('input', () => { persenDiubah = true; }));
  merekSel.addEventListener('change', () => {
    const mk = MEREK[merekSel.value] || MEREK.populer;
    if (!persenDiubah) {
      p1I.value = String(mk.p1);
      p2I.value = String(mk.p2);
    }
    hitung();
  });

  const hitung = () => {
    const harga = T.num(hargaI.value) || 0;
    const umur = T.num(umurI.value);
    if (!(harga > 0)) { T.hide(box); return; }
    if (!isFinite(umur) || umur < 0) { T.show(box, '<p class="warn">Umur mobil harus angka 0 atau lebih.</p>'); return; }
    const r = hitungDepresiasi(harga, umur, T.num(p1I.value), T.num(p2I.value));
    let tabel = '';
    if (r.riwayat.length > 1) {
      tabel = '<h3 style="font-size:14px;margin:12px 0 4px">Perkiraan harga per tahun</h3>' +
        r.riwayat.map((x) => kv(x.tahun === 0 ? 'Baru' : 'Umur ' + x.tahun + ' tahun', T.rp(x.nilai))).join('');
    }
    T.show(box,
      '<div class="big">' + T.rp(r.nilai) + '</div>' +
      '<p class="center mut">Perkiraan harga jual di umur ' + String(umur).replace('.', ',') + ' tahun.</p>' +
      kv('Harga baru', T.rp(harga)) +
      kv('Nilai yang hilang', T.rp(r.turun) + ' (' + T.fmt(Math.round(r.persenTurun * 10) / 10) + '%)') +
      tabel +
      '<p class="hint">Ini perkiraan pasar, bukan harga pasti. Mobil yang terawat, kilometer rendah, dan warna populer bisa laku lebih tinggi; mobil bekas tabrakan, banjir, atau pajak mati bisa jauh lebih rendah. Persentase di atas bisa diubah sesuai pengamatanmu di pasar mobil bekas.</p>');
  };
  [hargaI, umurI, p1I, p2I].forEach((i) => i.addEventListener('input', hitung));

  root.appendChild(T.el('<p class="note">Mobil baru langsung turun harganya begitu keluar dealer. Masukkan harga baru dan umurnya untuk memperkirakan harga jualnya sekarang.</p>'));
  root.appendChild(T.field('Harga baru (Rp)', hargaI));
  root.appendChild(T.grid2(
    T.field('Umur mobil (tahun)', umurI, 'Boleh desimal, contoh: 2,5'),
    T.field('Merek', merekSel)
  ));
  root.appendChild(T.grid2(
    T.field('Turun tahun pertama (%)', p1I, 'Terisi otomatis sesuai merek, bisa diubah'),
    T.field('Turun per tahun berikutnya (%)', p2I, 'Terisi otomatis sesuai merek, bisa diubah')
  ));
  root.appendChild(box);
  hitung();
}
