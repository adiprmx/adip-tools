import { h as T, esc, utils } from '../../core.js';

// Relative Fat Mass (RFM), Woolcott dan Bergman 2018 (Scientific Reports):
// pria:   RFM = 64 - (20 x tinggi / lingkar pinggang)
// wanita: RFM = 76 - (20 x tinggi / lingkar pinggang)
// Tinggi dan pinggang dalam satuan yang sama (cm). Batas obesitas dari
// studi yang sama: 30% untuk pria dan 40% untuk wanita.
export function rfm(tinggiCm, pinggangCm, wanita) {
  const rasio = tinggiCm / pinggangCm;
  return (wanita ? 76 : 64) - 20 * rasio;
}

export function batasObesitasRfm(wanita) {
  return wanita ? 40 : 30;
}

export function statusRfm(nilai, wanita) {
  const batas = batasObesitasRfm(wanita);
  if (nilai >= batas) return ['Di atas batas obesitas', 'Nilaimu melewati batas obesitas untuk ' + (wanita ? 'wanita' : 'pria') + ' (' + batas + '%). Sebaiknya diskusikan dengan dokter.', 'err'];
  if (nilai >= batas - 5) return ['Mendekati batas obesitas', 'Nilaimu tinggal sedikit lagi menyentuh batas obesitas (' + batas + '%). Jaga pola makan dan gerak harianmu.', 'warn'];
  return ['Di bawah batas obesitas', 'Nilaimu masih di bawah batas obesitas untuk ' + (wanita ? 'wanita' : 'pria') + ' (' + batas + '%).', 'ok'];
}
utils.rfm = rfm;
utils.statusRfm = statusRfm;

export const meta = {"id": "kalkulator-rfm", "name": "Kalkulator RFM (Lemak Tubuh)", "cat": "kesehatan", "icon": "📏", "desc": "Perkiraan persen lemak tubuh dari tinggi badan dan lingkar pinggang, dengan rumus Relative Fat Mass (RFM).", "keywords": "rfm,relative fat mass,lemak tubuh,persen lemak,lingkar pinggang,obesitas,woolcott", "since": "6.19.0"};
export function render(root) {
  const tinggi = T.input('number', 'Tinggi badan (cm)', '170');
  const pinggang = T.input('number', 'Lingkar pinggang (cm)', '85');
  const gender = T.select([['pria', 'Pria'], ['wanita', 'Wanita']], 'pria');
  const box = T.out();

  const hitung = () => {
    const t = T.num(tinggi.value);
    const p = T.num(pinggang.value);
    if (!(t >= 100 && t <= 250)) {
      T.show(box, '<span class="err">Isi tinggi badan antara 100 sampai 250 cm.</span>');
      return;
    }
    if (!(p >= 40 && p <= 200)) {
      T.show(box, '<span class="err">Isi lingkar pinggang antara 40 sampai 200 cm.</span>');
      return;
    }
    const wanita = gender.value === 'wanita';
    const nilai = rfm(t, p, wanita);
    const st = statusRfm(nilai, wanita);
    T.show(box,
      '<div class="center"><div class="dim">Perkiraan lemak tubuh (RFM)</div>' +
      '<div class="big">' + utils.fmtDes(nilai, 1) + '%</div>' +
      '<div class="' + st[2] + '"><b>' + esc(st[0]) + '</b></div></div>' +
      '<div class="kv"><span class="k">Batas obesitas untuk ' + (wanita ? 'wanita' : 'pria') + '</span><span class="v">' + batasObesitasRfm(wanita) + '%</span></div>' +
      '<div class="kv"><span class="k">Artinya</span><span class="v">' + esc(st[1]) + '</span></div>' +
      '<p class="hint">Cara ukur pinggang: pita meteran di sekeliling perut setinggi pusar, sejajar lantai, setelah buang napas biasa. ' +
      'RFM adalah perkiraan, BUKAN diagnosis dan bukan pengukuran lemak langsung seperti DEXA. ' +
      'Hasil bisa meleset untuk atlet berotot besar, ibu hamil, atau orang dengan kondisi perut tertentu. ' +
      'Bila nilaimu di atas batas obesitas, konsultasi ke dokter untuk penilaian yang lebih lengkap.</p>');
  };

  root.appendChild(T.grid2(
    T.field('Tinggi badan (cm)', tinggi),
    T.field('Lingkar pinggang (cm)', pinggang, 'Ukur di pusar, pita sejajar lantai.'),
  ));
  root.appendChild(T.field('Jenis kelamin', gender));
  root.appendChild(T.btn('Hitung', hitung, true));
  root.appendChild(box);
  hitung();
}
