import { h as T, utils } from '../../core.js';

// Logika murni (bisa di-test di Node).
// Angka GB per jam adalah perkiraan umum (kualitas video menentukan) dan
// semuanya bisa diubah di tool.
utils.PRESET_KUOTA = [
  { nama: 'YouTube 480p', gb: 0.5 },
  { nama: 'YouTube 720p', gb: 1.5 },
  { nama: 'YouTube 1080p', gb: 3.0 },
  { nama: 'TikTok / Reels', gb: 0.9 },
  { nama: 'Instagram', gb: 0.7 },
  { nama: 'Streaming film 720p', gb: 1.5 },
  { nama: 'Musik streaming', gb: 0.15 },
  { nama: 'Video call', gb: 0.5 },
  { nama: 'Game online', gb: 0.1 },
  { nama: 'Chat dan browsing', gb: 0.05 }
];
utils.hitungKuota = function (daftar, hari) {
  const h = Math.max(0, Number(hari) || 0);
  let perHari = 0;
  const rincian = (daftar || []).map((d) => {
    const jam = Math.max(0, Number(d.jam) || 0);
    const gb = Math.max(0, Number(d.gb) || 0);
    const total = jam * gb;
    perHari += total;
    return { nama: d.nama, jam, gb, total };
  }).filter((r) => r.total > 0);
  return { rincian, perHari, perBulan: perHari * h };
};

export const meta = {"id": "kuota-internet", "name": "Hitung Kuota Internet", "cat": "sehari", "icon": "📶", "desc": "Berapa GB kuota yang habis tiap bulan dari kebiasaanmu?", "keywords": "kuota,internet,data,gb,youtube,tiktok,paket data", "since": "6.11.0"};

export function render(root) {
  const hari = T.input('text', 'Contoh: 30', '30'); hari.inputMode = 'decimal';
  const box = T.out();
  const baris = utils.PRESET_KUOTA.map((p) => {
    const jam = T.input('text', '0', ''); jam.inputMode = 'decimal';
    const gb = T.input('text', String(p.gb), String(p.gb)); gb.inputMode = 'decimal';
    return { nama: p.nama, jam, gb };
  });

  function calc() {
    const r = utils.hitungKuota(baris.map((b) => ({ nama: b.nama, jam: T.num(b.jam.value), gb: T.num(b.gb.value) })), T.num(hari.value));
    if (r.rincian.length === 0) { T.show(box, '<div class="hint">Isi dulu jam per hari di minimal satu aktivitas.</div>'); return; }
    let rows = '';
    r.rincian.forEach((d) => {
      rows += `<tr><td style="padding:6px 8px;border-bottom:1px solid #2a2a2a">${d.nama}</td>` +
        `<td style="padding:6px 8px;border-bottom:1px solid #2a2a2a;text-align:right">${T.fmt(d.jam)} jam/hari</td>` +
        `<td style="padding:6px 8px;border-bottom:1px solid #2a2a2a;text-align:right">${T.fmt(Math.round(d.total * 100) / 100)} GB/hari</td></tr>`;
    });
    T.show(box,
      `<div class="kv"><span>Pemakaian per hari</span><b>${T.fmt(Math.round(r.perHari * 100) / 100)} GB</b></div>` +
      `<div class="kv"><span>Perkiraan per bulan (${T.num(hari.value) || 30} hari)</span><b style="color:#fff">${T.fmt(Math.round(r.perBulan * 10) / 10)} GB</b></div>` +
      `<table style="width:100%;border-collapse:collapse;font-size:13px;margin-top:6px">` + rows + `</table>` +
      `<div class="hint">Angka GB per jam adalah perkiraan umum dan bisa diubah di kolom kanan. Kualitas video paling menentukan: YouTube 1080p bisa 2 kali lipat 720p. Aplikasi yang berjalan di latar belakang (update otomatis, cadangan foto) tidak dihitung di sini.</div>`
    );
  }

  root.appendChild(T.el('<p class="note">Isi berapa jam per hari untuk tiap aktivitas. Angka GB per jam bisa diubah bila kamu tahu pemakaian aslinya.</p>'));
  baris.forEach((b) => {
    root.appendChild(T.grid2(
      T.field(b.nama + ' (jam per hari)', b.jam),
      T.field('GB per jam', b.gb)
    ));
  });
  root.appendChild(T.field('Jumlah hari dalam sebulan', hari));
  root.appendChild(T.btn('Hitung', calc, true));
  root.appendChild(box);
}
