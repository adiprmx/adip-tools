import { h as T, kv, utils } from '../../core.js?v=6.13.0';

const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const fmtTgl = (d) => HARI[d.getUTCDay()] + ', ' + d.getUTCDate() + ' ' + BULAN[d.getUTCMonth()] + ' ' + d.getUTCFullYear();
const parseTgl = (s) => { const p = String(s || '').split('-').map(Number); if (p.length !== 3 || p.some(isNaN)) return null; const d = new Date(Date.UTC(p[0], p[1] - 1, p[2])); return isNaN(d.getTime()) ? null : d; };
const tambahHari = (d, n) => { const x = new Date(d.getTime()); x.setUTCDate(x.getUTCDate() + n); return x; };
const tambahBulan = (d, n) => { const x = new Date(d.getTime()); x.setUTCMonth(x.getUTCMonth() + n); return x; };
const hariIni = () => { const n = new Date(); return new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate())); };

// Jadwal vaksin anak anjing, panduan AAHA 2022: DHPP 3 dosis tiap 3-4
// minggu dari umur 6-8 minggu, dosis terakhir di umur 16 minggu atau
// lebih, rabies sekali di umur 12-16 minggu, pengulangan di umur 1 tahun.
utils.jadwalVaksinAnjing = function (isoLahir, isoHariIni) {
  const lahir = parseTgl(isoLahir);
  const today = isoHariIni ? parseTgl(isoHariIni) : hariIni();
  if (!lahir || !today) return null;
  const rows = [
    { nama: 'DHPP dosis 1', tgl: tambahHari(lahir, 56), ket: 'Vaksin pertama, umur 8 minggu. Melindungi dari distemper, hepatitis, parainfluenza, dan parvo.' },
    { nama: 'DHPP dosis 2', tgl: tambahHari(lahir, 84), ket: 'Vaksin kedua, umur 12 minggu.' },
    { nama: 'DHPP dosis 3', tgl: tambahHari(lahir, 112), ket: 'Vaksin ketiga, umur 16 minggu. Ini dosis paling penting.' },
    { nama: 'Rabies', tgl: tambahHari(lahir, 112), ket: 'Satu kali, umur 16 minggu. Bisa mulai dari umur 12 minggu. Wajib di banyak daerah.' },
    { nama: 'Leptospirosis dosis 1 (bila disarankan)', tgl: tambahHari(lahir, 84), ket: 'Vaksin tambahan, umur 12 minggu. AAHA memasukkannya sebagai vaksin inti sejak 2024.' },
    { nama: 'Leptospirosis dosis 2 (bila disarankan)', tgl: tambahHari(lahir, 112), ket: 'Lanjutan leptospirosis, 2-4 minggu setelah dosis pertama.' },
    { nama: 'Pengulangan 1 tahun', tgl: tambahBulan(lahir, 12), ket: 'Pengulangan DHPP dan rabies saat umur sekitar 1 tahun.' },
    { nama: 'DHPP lanjutan', tgl: tambahBulan(lahir, 48), ket: 'Setelah pengulangan 1 tahun, DHPP diulang tiap 3 tahun. Rabies ikut aturan daerah, tiap 1-3 tahun.' },
  ];
  rows.forEach((r) => {
    const sisa = Math.round((r.tgl - today) / 86400000);
    r.sisa = sisa;
    r.status = sisa < 0 ? 'lewat' : sisa <= 14 ? 'segera' : 'nanti';
  });
  return rows;
};

export const meta = {"id": "jadwal-vaksin-anjing", "name": "Jadwal Vaksin Anjing", "cat": "sehari", "icon": "🩺", "desc": "Jadwal vaksin DHPP dan rabies anak anjing dari tanggal lahir.", "keywords": "anjing,vaksin,dhpp,rabies,jadwal,anak anjing,leptospirosis", "since": "6.11.0"};
export function render(root) {
  const tgl = T.input('date');
  const box = T.out();

  const hitung = () => {
    const lahir = parseTgl(tgl.value);
    if (!lahir) { T.show(box, '<span class="err">Pilih tanggal lahir anjing dulu.</span>'); return; }
    if (lahir > hariIni()) { T.show(box, '<span class="err">Tanggal lahirnya masih di masa depan. Cek lagi tanggalnya.</span>'); return; }
    const rows = utils.jadwalVaksinAnjing(tgl.value);
    let html = '<div class="center"><div class="dim">Jadwal vaksin dari tanggal lahir</div>' +
      '<div class="big">' + fmtTgl(lahir) + '</div></div>';
    rows.forEach((r) => {
      const cls = r.status === 'lewat' ? 'err' : r.status === 'segera' ? 'warn' : 'ok';
      const label = r.status === 'lewat' ? 'Sudah lewat' : r.status === 'segera' ? 'Waktunya dekat' : 'Akan datang';
      html += '<div class="kv"><span class="k">' + r.nama + '<br><span class="dim">' + r.ket + '</span></span>' +
        '<span class="v">' + fmtTgl(r.tgl) + '<br><span class="' + cls + '">' + label + '</span></span></div>';
    });
    html += '<p class="hint">Jadwal mengikuti panduan AAHA 2022. Kalau anjingmu sudah dewasa dan belum pernah vaksin, dokter hewan akan buatkan jadwal dari awal. Ini panduan umum. Untuk keputusan medis, konsultasikan ke dokter hewan.</p>';
    T.show(box, html);
  };
  tgl.addEventListener('change', hitung);

  root.appendChild(T.field('Tanggal lahir anjing', tgl));
  root.appendChild(T.btn('Lihat Jadwal', hitung, true));
  root.appendChild(box);
  T.show(box, '<p class="hint">Pilih tanggal lahir anjing, lalu tekan Lihat Jadwal.</p>');
}
