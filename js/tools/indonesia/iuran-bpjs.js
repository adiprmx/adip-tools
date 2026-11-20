import { h as T, utils } from '../../core.js';

// Tarif iuran BPJS Kesehatan peserta mandiri (PBPU/Bukan Pekerja) — dicek
// 20 Nov 2026, masih berlaku (Perpres 64/2020; Perpres 59/2024):
// Kelas 1 Rp150.000, Kelas 2 Rp100.000, Kelas 3 Rp42.000 per jiwa/bulan —
// kelas 3 disubsidi pemerintah Rp7.000, jadi peserta membayar Rp35.000.
// STATUS KRIS: Perpres 59/2024 memerintahkan sistem Kelas Rawat Inap
// Standar (KRIS) menggantikan kelas 1/2/3 untuk rawat inap, dan iuran baru
// seharusnya ditetapkan paling lambat 1 Jul 2025 — sampai pengecekan
// terakhir (Okt 2026) belum ada aturan baru yang menetapkan iuran pengganti,
// jadi tarif kelas di bawah ini masih yang berlaku. Cek ulang berkala.
export const TARIF_BPJS_KES = {
  '1': { label: 'Kelas 1', tarif: 150000, bayar: 150000 },
  '2': { label: 'Kelas 2', tarif: 100000, bayar: 100000 },
  '3': { label: 'Kelas 3', tarif: 42000, bayar: 35000, subsidi: 7000 },
};
utils.tarifBpjsKesehatan = TARIF_BPJS_KES;

// Logika murni (bisa di-test di Node): iuran yang dibayar peserta.
export function hitungIuranBpjs(kelas, jiwa) {
  const k = TARIF_BPJS_KES[String(kelas)] || TARIF_BPJS_KES['2'];
  const n = Math.max(1, Math.floor(Number(jiwa) || 0));
  if (!(n > 0)) return null;
  const perBulan = k.bayar * n;
  return { label: k.label, tarif: k.tarif, bayar: k.bayar, jiwa: n, perBulan, perTahun: perBulan * 12 };
}
utils.hitungIuranBpjs = hitungIuranBpjs;

export const meta = {"id": "iuran-bpjs", "name": "Iuran BPJS Kesehatan", "cat": "indonesia", "icon": "🏥", "desc": "Hitung iuran BPJS Kesehatan per bulan & per tahun.", "keywords": "bpjs,kesehatan,iuran,kelas,jkn,jaminan"};
export function render(root) {
  const kelasSel = T.select(
    Object.entries(TARIF_BPJS_KES).map(([v, k]) => [v, k.label + ' — ' + T.rp(k.bayar) + '/jiwa/bln']),
    '2'
  );
  const jiwa = T.input('number', 'Contoh: 4', '4');
  jiwa.min = '1';
  const box = T.out();
  const hitung = () => {
    const n = Math.max(1, Math.floor(T.num(jiwa.value) || 0));
    if (!n) { T.show(box, '<p class="hint">Isi jumlah jiwanya dulu ya.</p>'); return; }
    const r = hitungIuranBpjs(kelasSel.value, n);
    const subsidiTxt = kelasSel.value === '3'
      ? '<p class="center hint">Tarif kelas 3 sebenarnya ' + T.rp(r.tarif) + '/jiwa, tapi pemerintah bantu ' + T.rp(7000) + ' jadi kamu bayar ' + T.rp(r.bayar) + '.</p>'
      : '';
    T.show(box,
      '<div class="big center">' + T.rp(r.perBulan) + ' <span class="mut" style="font-size:15px">/ bulan</span></div>' +
      '<p class="center">' + T.rp(r.perTahun) + ' <span class="mut">/ tahun</span></p>' +
      '<p class="center hint">' + T.esc(r.label) + ' × ' + n + ' jiwa</p>' +
      subsidiTxt +
      '<p class="hint">Pakai tarif standar: Kelas 1 Rp150.000, Kelas 2 Rp100.000, Kelas 3 Rp35.000 (dari tarif Rp42.000, disubsidi Rp7.000) per jiwa per bulan — dicek 20 Nov 2026, masih berlaku. Pemerintah sedang menyiapkan sistem kamar standar (KRIS) pengganti kelas 1/2/3, tapi sampai sekarang belum ada tarif baru yang ditetapkan, jadi tarif di atas masih dipakai. Buat angka resmi yang berlaku untuk kamu, cek aplikasi Mobile JKN ya.</p>');
  };
  kelasSel.addEventListener('change', hitung);
  jiwa.addEventListener('input', hitung);
  root.appendChild(T.field('Kelas BPJS', kelasSel));
  root.appendChild(T.field('Jumlah jiwa (termasuk kamu)', jiwa));
  root.appendChild(T.row(T.btn('Hitung iuran', hitung, true)));
  root.appendChild(box);
  hitung();
}
