import { h as T, utils, kv } from '../../core.js';

export const meta = {"id": "kalkulator-wacc", "name": "Kalkulator WACC", "cat": "bisnis", "icon": "⚖️", "desc": "Rata-rata tertimbang biaya modal perusahaan dari utang dan saham.", "keywords": "wacc,biaya modal,utang,ekuitas,saham,capex,diskonto,perusahaan,keuangan", "since": "6.19.0"};

const nol = (x) => (x === 0 ? 0 : x);
const fmtP = (x, d) => nol(x).toFixed(d == null ? 2 : d).replace('.', ',') + '%';

/* WACC = (E/V) x Re + (D/V) x Rd x (1 - pajak).
   Re = biaya ekuitas (%), Rd = bunga utang (%), pajak dalam persen,
   E = nilai ekuitas, D = nilai utang. Hasil dalam persen.
   Null bila input tidak valid. */
export function hitungWacc(ekuitas, utang, biayaEkuitas, bungaUtang, pajakPersen) {
  const e = Number(ekuitas), d = Number(utang);
  const re = Number(biayaEkuitas), rd = Number(bungaUtang), t = Number(pajakPersen);
  if (![e, d, re, rd, t].every(isFinite)) return null;
  if (e < 0 || d < 0 || e + d <= 0 || t < 0 || t >= 100) return null;
  const v = e + d;
  const wacc = (e / v) * re + (d / v) * rd * (1 - t / 100);
  if (!Number.isFinite(wacc)) return null;
  return {
    wacc,
    bobotEkuitas: (e / v) * 100,
    bobotUtang: (d / v) * 100,
    biayaUtangSetelahPajak: rd * (1 - t / 100),
  };
}
utils.wacc = hitungWacc;

export function render(root) {
  const ekuitasI = T.input('text', 'cth: 600000000', '');
  const utangI = T.input('text', 'cth: 400000000', '');
  const reI = T.input('text', 'cth: 12', '');
  const rdI = T.input('text', 'cth: 8', '');
  const pajakI = T.input('text', 'cth: 22', '22');
  const box = T.out();

  const hitung = () => {
    const ekuitas = T.num(ekuitasI.value);
    const utang = T.num(utangI.value);
    const re = T.num(reI.value);
    const rd = T.num(rdI.value);
    const pajak = T.num(pajakI.value);
    if (!isFinite(ekuitas) || ekuitas < 0) { T.show(box, '<div class="err">Isi nilai ekuitas (modal pemilik) dengan angka 0 atau lebih.</div>'); return; }
    if (!isFinite(utang) || utang < 0) { T.show(box, '<div class="err">Isi nilai utang dengan angka 0 atau lebih.</div>'); return; }
    if (ekuitas + utang <= 0) { T.show(box, '<div class="err">Ekuitas dan utang tidak boleh dua-duanya 0.</div>'); return; }
    if (!isFinite(re)) { T.show(box, '<div class="err">Isi biaya ekuitas dengan angka, misal hasil yang diminta pemegang saham.</div>'); return; }
    if (!isFinite(rd) || rd < 0) { T.show(box, '<div class="err">Isi bunga utang dengan angka 0 atau lebih.</div>'); return; }
    if (!isFinite(pajak) || pajak < 0 || pajak >= 100) { T.show(box, '<div class="err">Isi tarif pajak antara 0 sampai di bawah 100 persen.</div>'); return; }
    const hasil = hitungWacc(ekuitas, utang, re, rd, pajak);
    if (hasil === null) { T.show(box, '<div class="err">Angkanya terlalu besar untuk dihitung. Coba pakai angka yang lebih kecil.</div>'); return; }
    T.show(box,
      '<div class="big center">' + fmtP(hasil.wacc) + '</div>' +
      '<p class="center">WACC (biaya modal rata-rata)</p>' +
      kv('Bobot ekuitas', fmtP(hasil.bobotEkuitas)) +
      kv('Bobot utang', fmtP(hasil.bobotUtang)) +
      kv('Biaya ekuitas', fmtP(re)) +
      kv('Biaya utang setelah pajak', fmtP(hasil.biayaUtangSetelahPajak)) +
      '<p class="info">Proyek baru sebaiknya menghasilkan di atas ' + fmtP(hasil.wacc) + ' per tahun, karena di bawah itu proyek tidak menutup biaya modal perusahaan.</p>' +
      '<p class="hint">Rumusnya: (bobot ekuitas x biaya ekuitas) + (bobot utang x bunga utang x (1 - tarif pajak)). Bunga utang dikurangi pajak karena bunga bisa mengurangi pajak perusahaan. WACC dipakai sebagai tingkat diskonto untuk menilai proyek baru.</p>');
  };

  root.appendChild(T.el('<p class="note">WACC itu rata-rata biaya yang harus dibayar perusahaan untuk memakai modalnya, dari dua sumber: modal pemilik (ekuitas) dan pinjaman (utang). Makin besar porsi utang yang murah, makin rendah WACC-nya.</p>'));
  root.appendChild(T.field('Nilai ekuitas (Rp)', ekuitasI, 'Modal dari pemilik atau pemegang saham.'));
  root.appendChild(T.field('Nilai utang (Rp)', utangI, 'Total pinjaman perusahaan yang berbunga.'));
  root.appendChild(T.field('Biaya ekuitas (% per tahun)', reI, 'Hasil yang diminta pemegang saham, misal dari hitungan CAPM.'));
  root.appendChild(T.field('Bunga utang (% per tahun)', rdI, 'Rata-rata bunga pinjaman perusahaan.'));
  root.appendChild(T.field('Tarif pajak (%)', pajakI, 'Tarif pajak penghasilan perusahaan. Default 22%.'));
  root.appendChild(T.row(T.btn('Hitung WACC', hitung, true)));
  root.appendChild(box);
}
