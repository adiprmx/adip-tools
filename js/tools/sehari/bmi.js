import { h as T, utils, esc } from '../../core.js?v=6.11.5';

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

// Berat ideal (kg) dari tinggi badan:
// - Devine (1974): pria 50 + 2,3 per inci di atas 5 kaki; wanita 45,5 + 2,3
// - Hamwi (1964): pria 48 + 2,7 per inci di atas 5 kaki; wanita 45,5 + 2,2
// - Broca: pria tinggi - 100; wanita (tinggi - 100) x 0,9
function beratIdeal(tinggiCm, pria) {
  const inci = tinggiCm / 2.54 - 60;
  const devine = (pria ? 50 : 45.5) + 2.3 * inci;
  const hamwi = (pria ? 48 : 45.5) + (pria ? 2.7 : 2.2) * inci;
  const broca = pria ? tinggiCm - 100 : (tinggiCm - 100) * 0.9;
  return { devine, hamwi, broca };
}

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
      const b = T.num(berat.value), h = T.num(tinggi.value);
      const r = utils.bmi(b, h);
      const bmr = utils.bmr(gender.value, b, h, T.num(umur.value));
      if (!r || isNaN(bmr)) { T.show(box, '<span class="err">Isi berat, tinggi, dan umur dengan angka yang valid.</span>'); return; }
      const tdee = Math.round(bmr * Number(aktif.value));
      const warna = r.kategori === 'Normal' ? 'ok' : (r.kategori.indexOf('Obesitas') === 0 ? 'err' : 'warn');
      const ideal = beratIdeal(h, gender.value === 'pria');
      const bmiPrime = r.bmi / 25;
      const ponderal = b / Math.pow(h / 100, 3);
      const rentangNormal = (18.5 * Math.pow(h / 100, 2)).toFixed(1) + ' - ' + (22.9 * Math.pow(h / 100, 2)).toFixed(1) + ' kg';
      const mark = (cond) => cond ? ' <b>&larr; kamu di sini</b>' : '';
      T.show(box,
        '<div class="center"><div class="dim">Indeks Massa Tubuh</div>' +
        '<div class="big">' + r.bmi.toFixed(1) + '</div>' +
        '<div class="' + warna + '"><b>' + esc(r.kategori) + '</b></div>' +
        '<div class="hint">Standar WHO untuk Asia</div></div>' +
        '<div class="kv"><span class="k">BMR (kalori basal)</span><span class="v">' + T.fmt(bmr) + ' kkal/hari</span></div>' +
        '<div class="kv"><span class="k">TDEE (kebutuhan harian)</span><span class="v">' + T.fmt(tdee) + ' kkal/hari</span></div>' +
        '<div class="kv"><span class="k">Target turun BB (~0,5 kg/minggu)</span><span class="v">' + T.fmt(tdee - 500) + ' kkal/hari</span></div>' +
        '<div class="kv"><span class="k">Target naik BB (~0,5 kg/minggu)</span><span class="v">' + T.fmt(tdee + 500) + ' kkal/hari</span></div>' +
        '<div class="dim" style="margin-top:12px">Berat ideal dari tinggi badan</div>' +
        '<div class="kv"><span class="k">Devine (1974)</span><span class="v">' + ideal.devine.toFixed(1) + ' kg</span></div>' +
        '<div class="kv"><span class="k">Hamwi (1964)</span><span class="v">' + ideal.hamwi.toFixed(1) + ' kg</span></div>' +
        '<div class="kv"><span class="k">Broca</span><span class="v">' + ideal.broca.toFixed(1) + ' kg</span></div>' +
        '<div class="kv"><span class="k">Rentang berat untuk BMI normal Asia (18,5-22,9)</span><span class="v">' + rentangNormal + '</span></div>' +
        '<div class="dim" style="margin-top:12px">Ukuran lain</div>' +
        '<div class="kv"><span class="k">BMI Prime (BMI dibagi 25)</span><span class="v">' + bmiPrime.toFixed(2) + '</span></div>' +
        '<div class="kv"><span class="k">Ponderal Index (berat dibagi tinggi pangkat 3)</span><span class="v">' + ponderal.toFixed(1) + ' kg/m&sup3;</span></div>' +
        '<div class="dim" style="margin-top:12px">Kategori WHO global</div>' +
        '<div class="kv"><span class="k">Kurus</span><span class="v">di bawah 18,5' + mark(r.bmi < 18.5) + '</span></div>' +
        '<div class="kv"><span class="k">Normal</span><span class="v">18,5 - 24,9' + mark(r.bmi >= 18.5 && r.bmi < 25) + '</span></div>' +
        '<div class="kv"><span class="k">Kelebihan berat</span><span class="v">25 - 29,9' + mark(r.bmi >= 25 && r.bmi < 30) + '</span></div>' +
        '<div class="kv"><span class="k">Obesitas</span><span class="v">30 ke atas' + mark(r.bmi >= 30) + '</span></div>' +
        '<div class="dim" style="margin-top:12px">Kategori Asia-Pasifik (dipakai Kemenkes)</div>' +
        '<div class="kv"><span class="k">Kurus</span><span class="v">di bawah 18,5' + mark(r.bmi < 18.5) + '</span></div>' +
        '<div class="kv"><span class="k">Normal</span><span class="v">18,5 - 22,9' + mark(r.bmi >= 18.5 && r.bmi < 23) + '</span></div>' +
        '<div class="kv"><span class="k">Kelebihan berat</span><span class="v">23 - 24,9' + mark(r.bmi >= 23 && r.bmi < 25) + '</span></div>' +
        '<div class="kv"><span class="k">Obesitas I</span><span class="v">25 - 29,9' + mark(r.bmi >= 25 && r.bmi < 30) + '</span></div>' +
        '<div class="kv"><span class="k">Obesitas II</span><span class="v">30 ke atas' + mark(r.bmi >= 30) + '</span></div>' +
        '<div class="hint">BMI Prime di bawah 1 artinya di bawah batas atas normal global (25). Ponderal Index normal umumnya 11-15. ' +
        'Batas Asia lebih rendah karena risiko penyakit pada orang Asia naik di BMI yang lebih rendah. BMI tidak membedakan otot dan lemak, jadi atlet berotot bisa terbaca berlebih. ' +
        'Ini perkiraan umum, bukan pengganti saran dokter.</div>');
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
