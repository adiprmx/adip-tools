import { h as T, utils } from '../../core.js?v=6.7.0';

export const meta = {"id": "iuran-bpjs", "name": "Iuran BPJS Kesehatan", "cat": "indonesia", "icon": "🏥", "desc": "Hitung iuran BPJS Kesehatan per bulan & per tahun.", "keywords": "bpjs,kesehatan,iuran,kelas,jkn,jaminan"};
export function render(root) {
  const KELAS = {
    '1': ['Kelas 1', 150000],
    '2': ['Kelas 2', 100000],
    '3': ['Kelas 3', 35000],
  };
  const kelasSel = T.select(
    Object.entries(KELAS).map(([v, [l, tarif]]) => [v, l + ' — ' + T.rp(tarif) + '/jiwa/bln']),
    '2'
  );
  const jiwa = T.input('number', 'Contoh: 4', '4');
  jiwa.min = '1';
  const box = T.out();
  const hitung = () => {
    const [label, tarif] = KELAS[kelasSel.value] || KELAS['2'];
    const n = Math.max(1, Math.floor(T.num(jiwa.value) || 0));
    if (!n) { T.show(box, '<p class="hint">Isi jumlah jiwanya dulu ya.</p>'); return; }
    const perBulan = tarif * n;
    const perTahun = perBulan * 12;
    T.show(box,
      '<div class="big center">' + T.rp(perBulan) + ' <span class="mut" style="font-size:15px">/ bulan</span></div>' +
      '<p class="center">' + T.rp(perTahun) + ' <span class="mut">/ tahun</span></p>' +
      '<p class="center hint">' + T.esc(label) + ' × ' + n + ' jiwa</p>' +
      '<p class="hint">Pakai tarif standar: Kelas 1 Rp150.000, Kelas 2 Rp100.000, Kelas 3 Rp35.000 per jiwa per bulan. Buat angka resmi yang berlaku untuk kamu, cek aplikasi Mobile JKN ya.</p>');
  };
  kelasSel.addEventListener('change', hitung);
  jiwa.addEventListener('input', hitung);
  root.appendChild(T.field('Kelas BPJS', kelasSel));
  root.appendChild(T.field('Jumlah jiwa (termasuk kamu)', jiwa));
  root.appendChild(T.row(T.btn('Hitung iuran', hitung, true)));
  root.appendChild(box);
  hitung();
}
