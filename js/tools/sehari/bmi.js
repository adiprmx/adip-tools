import { h as T, utils, esc } from '../../core.js?v=6.12.2';

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

// Mifflin-St Jeor (1990) — rumus BMR bawaan.
utils.bmr = function (gender, beratKg, tinggiCm, umur) {
    const g = String(gender || '').toLowerCase().trim();
    const isMale = /^(pria|laki|laki-laki|male|m|l)$/.test(g);
    const b = Number(beratKg), h = Number(tinggiCm), u = Number(umur);
    if (!(b > 0) || !(h > 0) || !(u > 0)) return NaN;
    return Math.round(10 * b + 6.25 * h - 5 * u + (isMale ? 5 : -161));
  };

// Harris-Benedict revisi (Roza & Shizgal, 1984).
// Pria: 88,362 + 13,397 x kg + 4,799 x cm - 5,677 x umur
// Wanita: 447,593 + 9,247 x kg + 3,098 x cm - 4,330 x umur
utils.bmrHarris = function (pria, beratKg, tinggiCm, umur) {
    const b = Number(beratKg), h = Number(tinggiCm), u = Number(umur);
    if (!(b > 0) || !(h > 0) || !(u > 0)) return NaN;
    return pria
      ? Math.round(88.362 + 13.397 * b + 4.799 * h - 5.677 * u)
      : Math.round(447.593 + 9.247 * b + 3.098 * h - 4.330 * u);
  };

// Katch-McArdle: BMR = 370 + 21,6 x massa tanpa lemak (kg).
// Massa tanpa lemak = berat x (1 - kadar lemak / 100).
utils.bmrKatch = function (beratKg, kadarLemakPct) {
    const b = Number(beratKg), f = Number(kadarLemakPct);
    if (!(b > 0) || !(f >= 2 && f < 70)) return NaN;
    return Math.round(370 + 21.6 * b * (1 - f / 100));
  };

// Kadar lemak tubuh metode US Navy (Hodgdon & Beckett, 1984).
// Semua ukuran dalam inci (cm dibagi 2,54), logaritma basis 10.
// Pria: 86,010 x log10(pinggang-leher) - 70,041 x log10(tinggi) + 36,76
// Wanita: 163,205 x log10(pinggang+pinggul-leher) - 97,684 x log10(tinggi) - 78,387
utils.bodyFatNavy = function (pria, tinggiCm, leherCm, pinggangCm, pinggulCm) {
    const h = Number(tinggiCm) / 2.54;
    const le = Number(leherCm) / 2.54;
    const pg = Number(pinggangCm) / 2.54;
    if (!(h > 0) || !(le > 0) || !(pg > le)) return NaN;
    if (pria) {
      return 86.010 * Math.log10(pg - le) - 70.041 * Math.log10(h) + 36.76;
    }
    const pu = Number(pinggulCm) / 2.54;
    if (!(pu > 0) || !(pg + pu - le > 0)) return NaN;
    return 163.205 * Math.log10(pg + pu - le) - 97.684 * Math.log10(h) - 78.387;
  };

// Kategori kadar lemak (American Council on Exercise).
function kategoriLemak(pct, pria) {
  if (pria) {
    if (pct < 6) return 'Sangat rendah (atlet elit)';
    if (pct < 14) return 'Atlet';
    if (pct < 18) return 'Bugar';
    if (pct < 25) return 'Rata-rata';
    return 'Di atas rata-rata';
  }
  if (pct < 14) return 'Sangat rendah (atlet elit)';
  if (pct < 21) return 'Atlet';
  if (pct < 25) return 'Bugar';
  if (pct < 32) return 'Rata-rata';
  return 'Di atas rata-rata';
}

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

// Pembagian makro (protein 4 kkal/g, karbo 4 kkal/g, lemak 9 kkal/g).
// Patokan umum: jaga berat 30/40/30, turun BB 35/35/30, naik BB 25/50/25.
function makro(kkal, p, k, l) {
  return {
    protein: Math.round(kkal * p / 100 / 4),
    karbo: Math.round(kkal * k / 100 / 4),
    lemak: Math.round(kkal * l / 100 / 9),
  };
}

export const meta = {"id": "bmi", "name": "BMI & Kalori", "cat": "sehari", "icon": "⚕️", "desc": "BMI + estimasi kebutuhan kalori.", "keywords": "bmi,berat,badan,diet,kalori"};
export function render(root) {

    const berat = T.input('number', 'Berat badan (kg)', '65');
    const tinggi = T.input('number', 'Tinggi badan (cm)', '165');
    const umur = T.input('number', 'Umur (tahun)', '25');
    const gender = T.select([['pria', 'Pria'], ['wanita', 'Wanita']]);
    const rumus = T.select([
      ['mifflin', 'Mifflin-St Jeor (paling umum dipakai)'],
      ['harris', 'Harris-Benedict revisi 1984'],
      ['katch', 'Katch-McArdle (dari massa tanpa lemak)'],
    ], 'mifflin');
    const aktif = T.select([
      ['1.2', 'Jarang gerak (kantoran)'],
      ['1.375', 'Ringan (olahraga 1-3x/minggu)'],
      ['1.55', 'Sedang (olahraga 3-5x/minggu)'],
      ['1.725', 'Berat (olahraga 6-7x/minggu)'],
      ['1.9', 'Atlet / fisik sangat berat'],
    ], '1.375');
    const lemakManual = T.input('number', 'Kadar lemak (%) bila tahu, cth: 22', '');
    const leher = T.input('number', 'Lingkar leher (cm)', '');
    const pinggang = T.input('number', 'Lingkar pinggang (cm)', '');
    const pinggul = T.input('number', 'Lingkar pinggul (cm)', '');
    const box = T.out();
    const fPinggul = T.field('Lingkar pinggul (cm)', pinggul, 'Diukur di bagian pinggul terlebar.');
    const aturPinggul = () => { fPinggul.style.display = gender.value === 'wanita' ? '' : 'none'; };
    gender.addEventListener('change', aturPinggul);

    const hitung = () => {
      const b = T.num(berat.value), h = T.num(tinggi.value);
      const pria = gender.value === 'pria';
      const r = utils.bmi(b, h);
      const umurN = T.num(umur.value);
      const bmrMifflin = utils.bmr(gender.value, b, h, umurN);
      const bmrHarris = utils.bmrHarris(pria, b, h, umurN);
      if (!r || isNaN(bmrMifflin)) { T.show(box, '<span class="err">Isi berat, tinggi, dan umur dengan angka yang valid.</span>'); return; }

      // Kadar lemak: isi manual diutamakan, kalau kosong dihitung dari
      // ukuran lingkar (metode US Navy) bila lengkap.
      let lemakPct = T.num(lemakManual.value);
      let lemakSumber = '';
      if (!(lemakPct >= 2 && lemakPct < 70)) {
        const navy = utils.bodyFatNavy(pria, h, T.num(leher.value), T.num(pinggang.value), T.num(pinggul.value));
        if (!isNaN(navy) && navy >= 2 && navy < 70) { lemakPct = Math.round(navy * 10) / 10; lemakSumber = ' (metode US Navy)'; }
        else lemakPct = NaN;
      } else lemakSumber = ' (diisi manual)';
      const bmrKatch = isNaN(lemakPct) ? NaN : utils.bmrKatch(b, lemakPct);

      let bmr = bmrMifflin, rumusPakai = 'Mifflin-St Jeor';
      if (rumus.value === 'harris') { bmr = bmrHarris; rumusPakai = 'Harris-Benedict revisi'; }
      else if (rumus.value === 'katch') {
        if (isNaN(bmrKatch)) {
          T.show(box, '<span class="warn">Katch-McArdle butuh kadar lemak tubuh. Isi kadar lemak (%) atau ukuran lingkar leher &amp; pinggang (wanita: + pinggul) di bawah.</span>');
          return;
        }
        bmr = bmrKatch; rumusPakai = 'Katch-McArdle';
      }
      const tdee = Math.round(bmr * Number(aktif.value));
      const targetTurun = Math.max(1200, tdee - 500);
      const targetNaik = tdee + 500;
      const warna = r.kategori === 'Normal' ? 'ok' : (r.kategori.indexOf('Obesitas') === 0 ? 'err' : 'warn');
      const ideal = beratIdeal(h, pria);
      const bmiPrime = r.bmi / 25;
      const ponderal = b / Math.pow(h / 100, 3);
      const rentangNormal = (18.5 * Math.pow(h / 100, 2)).toFixed(1) + ' - ' + (22.9 * Math.pow(h / 100, 2)).toFixed(1) + ' kg';
      const mark = (cond) => cond ? ' <b>&larr; kamu di sini</b>' : '';

      let lemakHtml = '';
      if (!isNaN(lemakPct)) {
        const massaLemak = b * lemakPct / 100;
        lemakHtml =
          '<div class="dim" style="margin-top:12px">Kadar lemak tubuh' + lemakSumber + '</div>' +
          '<div class="kv"><span class="k">Kadar lemak</span><span class="v">' + lemakPct.toFixed(1) + '% (' + kategoriLemak(lemakPct, pria) + ')</span></div>' +
          '<div class="kv"><span class="k">Massa lemak</span><span class="v">' + massaLemak.toFixed(1) + ' kg</span></div>' +
          '<div class="kv"><span class="k">Massa tanpa lemak</span><span class="v">' + (b - massaLemak).toFixed(1) + ' kg</span></div>';
      }

      const mJaga = makro(tdee, 30, 40, 30);
      const mTurun = makro(targetTurun, 35, 35, 30);
      const mNaik = makro(targetNaik, 25, 50, 25);
      const makroBaris = (label, m) =>
        '<div class="kv"><span class="k">' + label + '</span><span class="v">Protein ' + m.protein + ' g · Karbo ' + m.karbo + ' g · Lemak ' + m.lemak + ' g</span></div>';

      T.show(box,
        '<div class="center"><div class="dim">Indeks Massa Tubuh</div>' +
        '<div class="big">' + r.bmi.toFixed(1) + '</div>' +
        '<div class="' + warna + '"><b>' + esc(r.kategori) + '</b></div>' +
        '<div class="hint">Standar WHO untuk Asia</div></div>' +
        '<div class="dim" style="margin-top:12px">Kalori basal (BMR) — 3 rumus</div>' +
        '<div class="kv"><span class="k">Mifflin-St Jeor' + (rumus.value === 'mifflin' ? ' (dipakai)' : '') + '</span><span class="v">' + T.fmt(bmrMifflin) + ' kkal/hari</span></div>' +
        '<div class="kv"><span class="k">Harris-Benedict revisi 1984' + (rumus.value === 'harris' ? ' (dipakai)' : '') + '</span><span class="v">' + T.fmt(bmrHarris) + ' kkal/hari</span></div>' +
        '<div class="kv"><span class="k">Katch-McArdle' + (rumus.value === 'katch' ? ' (dipakai)' : '') + '</span><span class="v">' + (isNaN(bmrKatch) ? 'butuh kadar lemak' : T.fmt(bmrKatch) + ' kkal/hari') + '</span></div>' +
        '<div class="kv"><span class="k">TDEE (kebutuhan harian, ' + rumusPakai + ')</span><span class="v">' + T.fmt(tdee) + ' kkal/hari</span></div>' +
        '<div class="kv"><span class="k">Target turun BB (~0,5 kg/minggu)</span><span class="v">' + T.fmt(targetTurun) + ' kkal/hari</span></div>' +
        '<div class="kv"><span class="k">Target naik BB (~0,5 kg/minggu)</span><span class="v">' + T.fmt(targetNaik) + ' kkal/hari</span></div>' +
        '<div class="dim" style="margin-top:12px">Pembagian makro per hari (protein / karbo / lemak)</div>' +
        makroBaris('Jaga berat (' + T.fmt(tdee) + ' kkal)', mJaga) +
        makroBaris('Turun BB (' + T.fmt(targetTurun) + ' kkal)', mTurun) +
        makroBaris('Naik BB (' + T.fmt(targetNaik) + ' kkal)', mNaik) +
        lemakHtml +
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
        'Ketiga rumus BMR biasanya beda beberapa persen — itu wajar, semuanya perkiraan (umumnya akurat ±10%). Katch-McArdle paling cocok bila kadar lemakmu terukur akurat. ' +
        'Metode US Navy memakai meteran, akurasinya sekitar ±3-4% dibanding timbangan khusus. ' +
        'Ini perkiraan umum, bukan pengganti saran dokter.</div>');
    };
    root.appendChild(T.grid2(
      T.field('Berat badan (kg)', berat),
      T.field('Tinggi badan (cm)', tinggi),
      T.field('Umur (tahun)', umur),
      T.field('Jenis kelamin', gender),
    ));
    root.appendChild(T.field('Rumus kalori basal', rumus, 'Mifflin paling umum dipakai. Katch-McArdle butuh kadar lemak tubuh.'));
    root.appendChild(T.field('Tingkat aktivitas', aktif));
    root.appendChild(T.el('<p class="mut" style="margin:14px 0 6px;font-weight:600">Kadar lemak (opsional, untuk Katch-McArdle &amp; info lemak tubuh)</p>'));
    root.appendChild(T.field('Kadar lemak tubuh (%) bila sudah tahu', lemakManual, 'Misal dari timbangan badan atau hasil ukur klinik. Bila kosong, dihitung dari ukuran lingkar di bawah.'));
    root.appendChild(T.grid2(
      T.field('Lingkar leher (cm)', leher, 'Di bawah jakun, meteran jangan ditekan.'),
      T.field('Lingkar pinggang (cm)', pinggang, 'Pria: setinggi pusar. Wanita: bagian pinggang tersempit.')
    ));
    root.appendChild(fPinggul);
    root.appendChild(T.btn('Hitung', hitung, true));
    root.appendChild(box);
    aturPinggul();
    hitung();
  
}
