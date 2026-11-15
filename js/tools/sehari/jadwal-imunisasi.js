import { h as T, utils, p2 } from '../../core.js?v=6.12.1';

// Jadwal Imunisasi Anak IDAI 2024 (0-18 tahun), ringkas.
// umurBulan: usia pemberian dalam bulan. gratis = vaksin program pemerintah.
utils.JADWAL_IMUNISASI = [
  { vaksin: 'Hepatitis B (HB-0)', umurBulan: 0, gratis: true, ket: 'Diberikan segera setelah lahir, sebelum pulang dari fasilitas kesehatan.' },
  { vaksin: 'BCG', umurBulan: 0, gratis: true, ket: 'Melindungi dari TBC berat. Bekas suntikan di lengan atas bisa membekas, itu normal.' },
  { vaksin: 'Polio 0', umurBulan: 0, gratis: true, ket: 'Tetes pertama, diberikan bersamaan dengan HB-0.' },
  { vaksin: 'DPT-HB-Hib 1', umurBulan: 2, gratis: true, ket: 'Melindungi dari difteri, pertusis, tetanus, hepatitis B, dan Hib.' },
  { vaksin: 'Polio 1', umurBulan: 2, gratis: true, ket: 'Tetes kedua.' },
  { vaksin: 'PCV 1', umurBulan: 2, gratis: true, ket: 'Melindungi dari pneumonia dan radang otak akibat pneumokokus.' },
  { vaksin: 'Rotavirus 1', umurBulan: 2, gratis: false, ket: 'Melindungi dari diare berat akibat rotavirus.' },
  { vaksin: 'DPT-HB-Hib 2', umurBulan: 3, gratis: true, ket: 'Lanjutan dosis kedua.' },
  { vaksin: 'Polio 2', umurBulan: 3, gratis: true, ket: 'Tetes ketiga.' },
  { vaksin: 'Rotavirus 2', umurBulan: 4, gratis: false, ket: 'Lanjutan dosis kedua.' },
  { vaksin: 'DPT-HB-Hib 3', umurBulan: 4, gratis: true, ket: 'Lanjutan dosis ketiga.' },
  { vaksin: 'Polio 3', umurBulan: 4, gratis: true, ket: 'Tetes keempat.' },
  { vaksin: 'PCV 2', umurBulan: 4, gratis: true, ket: 'Lanjutan dosis kedua.' },
  { vaksin: 'Rotavirus 3', umurBulan: 6, gratis: false, ket: 'Dosis ketiga (tergantung merek vaksin, ada yang cukup 2 dosis).' },
  { vaksin: 'PCV 3', umurBulan: 6, gratis: true, ket: 'Lanjutan dosis ketiga.' },
  { vaksin: 'Influenza (tahunan)', umurBulan: 6, gratis: false, ket: 'Mulai usia 6 bulan, diulang tiap tahun.' },
  { vaksin: 'Campak-Rubela (MR) 1', umurBulan: 9, gratis: true, ket: 'Melindungi dari campak dan rubela.' },
  { vaksin: 'PCV booster', umurBulan: 12, gratis: true, ket: 'Penguat PCV di usia 12 bulan.' },
  { vaksin: 'DPT-HB-Hib booster', umurBulan: 18, gratis: true, ket: 'Penguat di usia 18 bulan.' },
  { vaksin: 'Campak-Rubela (MR) 2', umurBulan: 18, gratis: true, ket: 'Penguat MR di usia 18 bulan.' },
  { vaksin: 'Tifoid', umurBulan: 24, gratis: false, ket: 'Melindungi dari demam tifoid, diulang tiap 3 tahun.' },
  { vaksin: 'DPT booster (5 tahun)', umurBulan: 60, gratis: true, ket: 'Penguat sebelum masuk sekolah.' },
  { vaksin: 'Campak-Rubela (MR) booster (5 tahun)', umurBulan: 60, gratis: true, ket: 'Penguat sebelum masuk sekolah.' },
  { vaksin: 'HPV', umurBulan: 108, gratis: true, ket: 'Untuk anak perempuan usia 9-14 tahun, program pemerintah (kelas 5-6 SD).' },
  { vaksin: 'Td/Tdap (10 tahun)', umurBulan: 120, gratis: true, ket: 'Penguat tetanus-difteri di usia 10 tahun.' }
];
utils.tanggalImunisasi = function (tglLahirISO, umurBulan) {
  const d = new Date(tglLahirISO + 'T00:00:00');
  if (isNaN(d.getTime())) return null;
  d.setMonth(d.getMonth() + umurBulan);
  return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
};
utils.labelUmur = function (bulan) {
  if (bulan === 0) return 'Saat lahir';
  if (bulan < 12) return bulan + ' bulan';
  const thn = Math.floor(bulan / 12), sisa = bulan % 12;
  return thn + ' tahun' + (sisa ? ' ' + sisa + ' bulan' : '');
};

export const meta = {"id": "jadwal-imunisasi", "name": "Jadwal Imunisasi Anak", "cat": "sehari", "icon": "💉", "desc": "Jadwal imunisasi lengkap dari lahir sampai 18 tahun.", "keywords": "imunisasi,vaksin,anak,bayi,idai,bcg,dpt,polio,mr,hpv", "since": "6.11.0"};

export function render(root) {
  const lahir = T.input('date', '', '');
  const box = T.out();
  const KUNCI = 'at-imunisasi-sudah';
  let sudah = {};
  try { sudah = JSON.parse(localStorage.getItem(KUNCI) || '{}'); } catch (e) { sudah = {}; }

  function simpan() {
    try { localStorage.setItem(KUNCI, JSON.stringify(sudah)); } catch (e) { /* abaikan */ }
  }

  function tampil() {
    if (!lahir.value) { T.show(box, '<div class="hint">Isi dulu tanggal lahir anak.</div>'); return; }
    const hariIni = new Date().toISOString().slice(0, 10);
    const kunciAnak = lahir.value;
    sudah[kunciAnak] = sudah[kunciAnak] || {};
    let rows = '';
    let berikutnya = null;
    utils.JADWAL_IMUNISASI.forEach((j, i) => {
      const tgl = utils.tanggalImunisasi(lahir.value, j.umurBulan);
      const done = !!sudah[kunciAnak][i];
      const lewat = tgl < hariIni;
      if (!done && !berikutnya) berikutnya = j.vaksin;
      const status = done
        ? '<span style="color:#4ade80">Sudah</span>'
        : (lewat ? '<span style="color:#facc15">Sudah lewat, segera susulkan</span>' : '<span style="color:#a1a1aa">Akan datang</span>');
      rows += `<tr><td style="padding:8px;border-bottom:1px solid #2a2a2a;vertical-align:top">` +
        `<input type="checkbox" data-i="${i}" ${done ? 'checked' : ''} style="width:18px;height:18px;cursor:pointer"></td>` +
        `<td style="padding:8px;border-bottom:1px solid #2a2a2a;vertical-align:top"><b>${j.vaksin}</b>` +
        (j.gratis ? ' <span style="font-size:11px;color:#4ade80">gratis di posyandu</span>' : '') +
        `<br><span style="font-size:12px;color:#a1a1aa">${j.ket}</span></td>` +
        `<td style="padding:8px;border-bottom:1px solid #2a2a2a;vertical-align:top;white-space:nowrap">${utils.labelUmur(j.umurBulan)}<br><span style="font-size:12px;color:#a1a1aa">${tgl}</span></td>` +
        `<td style="padding:8px;border-bottom:1px solid #2a2a2a;vertical-align:top">${status}</td></tr>`;
    });
    T.show(box,
      (berikutnya ? `<div class="note">Imunisasi berikutnya: <b>${berikutnya}</b></div>` : `<div class="note">Semua jadwal sudah dicentang. Periksa lagi bila ada jadwal tahunan seperti influenza dan tifoid.</div>`) +
      `<table style="width:100%;border-collapse:collapse;font-size:13px"><tr>` +
      `<td style="padding:8px;border-bottom:1px solid #3a3a3a;color:#999"></td>` +
      `<td style="padding:8px;border-bottom:1px solid #3a3a3a;color:#999">Vaksin</td>` +
      `<td style="padding:8px;border-bottom:1px solid #3a3a3a;color:#999">Usia</td>` +
      `<td style="padding:8px;border-bottom:1px solid #3a3a3a;color:#999">Status</td></tr>` + rows + `</table>` +
      `<div class="hint">Jadwal mengikuti rekomendasi IDAI 2024. Centang vaksin yang sudah diberikan, centang tersimpan di HP ini. Jadwal bisa disesuaikan dokter anak, dan jadwal yang terlewat umumnya masih bisa disusulkan (catch-up). Vaksin bertanda gratis tersedia di posyandu dan puskesmas.</div>`
    );
    box.querySelectorAll('input[type="checkbox"]').forEach((c) => {
      c.addEventListener('change', () => {
        sudah[kunciAnak][c.dataset.i] = c.checked;
        simpan();
        tampil();
      });
    });
  }

  root.appendChild(T.el('<p class="note">Masukkan tanggal lahir anak untuk melihat seluruh jadwal imunisasi dari lahir sampai 18 tahun.</p>'));
  root.appendChild(T.field('Tanggal lahir anak', lahir));
  root.appendChild(T.btn('Tampilkan jadwal', tampil, true));
  root.appendChild(box);
}
