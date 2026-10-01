import { h as T, utils, esc } from '../../core.js?v=6.2.0';

utils.bmi = function (beratKg, tinggiCm) {
    const b = Number(beratKg), h = Number(tinggiCm);
    if (!(b > 0) || !(h > 0)) return null;
    const v = b / Math.pow(h / 100, 2);
    let kategori;
    if (v < 18.5) kategori = 'Kurus (underweight)';
    else if (v < 23) kategori = 'Normal';
    else if (v < 25) kategori = 'Kelebihan berat (overweight)';
    else if (v < 30) kategori = 'Obesitas I';
    else kategori = 'Obesitas II';
    return { bmi: Math.round(v * 10) / 10, kategori };
  };

utils.bmr = function (gender, beratKg, tinggiCm, umur) {
    const g = String(gender || '').toLowerCase().trim();
    const isMale = /^(pria|laki|laki-laki|male|m|l)$/.test(g);
    const b = Number(beratKg), h = Number(tinggiCm), u = Number(umur);
    if (!(b > 0) || !(h > 0) || !(u > 0)) return NaN;
    return Math.round(10 * b + 6.25 * h - 5 * u + (isMale ? 5 : -161));
  };

export const meta = {"id": "bmi", "name": "BMI & Kalori", "cat": "sehari", "icon": "⚕️", "desc": "BMI + estimasi kebutuhan kalori.", "keywords": "bmi,berat,badan,diet,kalori"};
export function render(root) {

    const berat = T.input('number', 'Berat badan (kg)', '65');
    const tinggi = T.input('number', 'Tinggi badan (cm)', '165');
    const umur = T.input('number', 'Umur (tahun)', '25');
    const gender = T.select([['pria', 'Pria'], ['wanita', 'Wanita']]);
    const aktif = T.select([
      ['1.2', 'Jarang gerak (kantoran)'],
      ['1.375', 'Ringan (olahraga 1-3x/minggu)'],
      ['1.55', 'Sedang (olahraga 3-5x/minggu)'],
      ['1.725', 'Berat (olahraga 6-7x/minggu)'],
      ['1.9', 'Atlet / fisik sangat berat'],
    ], '1.375');
    const box = T.out();
    const hitung = () => {
      const r = utils.bmi(T.num(berat.value), T.num(tinggi.value));
      const bmr = utils.bmr(gender.value, T.num(berat.value), T.num(tinggi.value), T.num(umur.value));
      if (!r || isNaN(bmr)) { T.show(box, '<span class="err">Isi berat, tinggi, dan umur dengan angka yang valid.</span>'); return; }
      const tdee = Math.round(bmr * Number(aktif.value));
      const warna = r.kategori === 'Normal' ? 'ok' : (r.kategori.indexOf('Obesitas') === 0 ? 'err' : 'warn');
      T.show(box,
        '<div class="center"><div class="dim">Indeks Massa Tubuh</div>' +
        '<div class="big">' + r.bmi.toFixed(1) + '</div>' +
        '<div class="' + warna + '"><b>' + esc(r.kategori) + '</b></div>' +
        '<div class="hint">Standar WHO untuk Asia</div></div>' +
        '<div class="kv"><span class="k">BMR (kalori basal)</span><span class="v">' + T.fmt(bmr) + ' kkal/hari</span></div>' +
        '<div class="kv"><span class="k">TDEE (kebutuhan harian)</span><span class="v">' + T.fmt(tdee) + ' kkal/hari</span></div>' +
        '<div class="kv"><span class="k">Target turun BB (~0,5 kg/minggu)</span><span class="v">' + T.fmt(tdee - 500) + ' kkal/hari</span></div>' +
        '<div class="kv"><span class="k">Target naik BB (~0,5 kg/minggu)</span><span class="v">' + T.fmt(tdee + 500) + ' kkal/hari</span></div>' +
        '<div class="hint">Estimasi kasar untuk panduan umum, bukan pengganti saran dokter/ahli gizi.</div>');
    };
    root.appendChild(T.grid2(
      T.field('Berat badan (kg)', berat),
      T.field('Tinggi badan (cm)', tinggi),
      T.field('Umur (tahun)', umur),
      T.field('Jenis kelamin', gender),
    ));
    root.appendChild(T.field('Tingkat aktivitas', aktif));
    root.appendChild(T.btn('Hitung', hitung, true));
    root.appendChild(box);
    hitung();
  
}
