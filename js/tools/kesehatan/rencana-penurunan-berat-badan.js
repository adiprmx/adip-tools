import { h as T, esc, utils } from '../../core.js';

// Rencana penurunan berat badan: dari berat sekarang dan berat target,
// dihitung berapa minggu yang dibutuhkan pada laju yang dipilih, defisit
// kalori harian, dan target kalori harian.
// 1 kg lemak tubuh setara sekitar 7.700 kkal, jadi defisit harian =
// laju (kg/minggu) x 7.700 / 7. Kebutuhan kalori harian (TDEE) dari BMR
// Mifflin-St Jeor dikali faktor aktivitas. Laju yang umum dianggap aman
// adalah 0,5 sampai 1 kg per minggu.
export function bmrMifflin(beratKg, tinggiCm, umur, wanita) {
  const b = 10 * beratKg + 6.25 * tinggiCm - 5 * umur;
  return wanita ? b - 161 : b + 5;
}

export function hitungRencana(berat, target, tinggi, umur, wanita, faktorAktivitas, laju) {
  const turun = berat - target;
  const minggu = turun / laju;
  const defisitHarian = (laju * 7700) / 7;
  const tdee = bmrMifflin(berat, tinggi, umur, wanita) * faktorAktivitas;
  const targetKalori = tdee - defisitHarian;
  const bmiSekarang = berat / Math.pow(tinggi / 100, 2);
  const bmiTarget = target / Math.pow(tinggi / 100, 2);
  return { turun, minggu, defisitHarian, tdee, targetKalori, bmiSekarang, bmiTarget };
}
utils.bmrMifflin = bmrMifflin;
utils.hitungRencana = hitungRencana;

function tglIndo(d) {
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

export const meta = {"id": "rencana-penurunan-berat-badan", "name": "Rencana Penurunan Berat Badan", "cat": "kesehatan", "icon": "📉", "desc": "Rencana turun berat badan: berapa minggu sampai target, defisit kalori harian, dan target kalori yang aman.", "keywords": "penurunan berat badan,turun berat badan,diet,defisit kalori,rencana diet,target berat badan,tdee", "since": "6.19.0"};
export function render(root) {
  const berat = T.input('number', 'Berat sekarang (kg)', '80');
  const target = T.input('number', 'Berat target (kg)', '70');
  const tinggi = T.input('number', 'Tinggi badan (cm)', '170');
  const umur = T.input('number', 'Umur (tahun)', '30');
  const gender = T.select([['pria', 'Pria'], ['wanita', 'Wanita']], 'pria');
  const aktivitas = T.select([
    ['1.2', 'Jarang gerak (duduk seharian)'],
    ['1.375', 'Ringan (olahraga 1-3x seminggu)'],
    ['1.55', 'Sedang (olahraga 3-5x seminggu)'],
    ['1.725', 'Berat (olahraga 6-7x seminggu)'],
    ['1.9', 'Sangat berat (kerja fisik + olahraga)'],
  ], '1.375');
  const laju = T.select([
    ['0.25', '0,25 kg per minggu (pelan)'],
    ['0.5', '0,5 kg per minggu (disarankan)'],
    ['0.75', '0,75 kg per minggu'],
    ['1', '1 kg per minggu (maksimal yang aman)'],
  ], '0.5');
  const box = T.out();

  const hitung = () => {
    const br = T.num(berat.value);
    const tg = T.num(target.value);
    const tgCm = T.num(tinggi.value);
    const um = T.num(umur.value);
    if (!(br >= 30 && br <= 300)) {
      T.show(box, '<span class="err">Isi berat sekarang antara 30 sampai 300 kg.</span>');
      return;
    }
    if (!(tg >= 25 && tg <= 300)) {
      T.show(box, '<span class="err">Isi berat target antara 25 sampai 300 kg.</span>');
      return;
    }
    if (tg >= br) {
      T.show(box, '<span class="err">Berat target harus lebih ringan dari berat sekarang. Tool ini untuk menurunkan berat badan.</span>');
      return;
    }
    if (!(tgCm >= 100 && tgCm <= 250)) {
      T.show(box, '<span class="err">Isi tinggi badan antara 100 sampai 250 cm.</span>');
      return;
    }
    if (!(um >= 18 && um <= 100)) {
      T.show(box, '<span class="err">Rencana ini untuk dewasa. Isi umur antara 18 sampai 100 tahun.</span>');
      return;
    }
    const wanita = gender.value === 'wanita';
    const r = hitungRencana(br, tg, tgCm, um, wanita, Number(aktivitas.value), Number(laju.value));
    const tglTarget = new Date();
    tglTarget.setDate(tglTarget.getDate() + Math.round(r.minggu * 7));
    const batasBawah = wanita ? 1200 : 1500;
    const terlaluRendah = r.targetKalori < batasBawah;
    T.show(box,
      '<div class="center"><div class="dim">Perkiraan waktu sampai target</div>' +
      '<div class="big">' + utils.fmtDes(r.minggu, 1) + ' minggu</div>' +
      '<div class="dim">sekitar tanggal ' + esc(tglIndo(tglTarget)) + '</div></div>' +
      '<div class="kv"><span class="k">Berat yang harus turun</span><span class="v">' + utils.fmtDes(r.turun, 1) + ' kg</span></div>' +
      '<div class="kv"><span class="k">Defisit kalori harian</span><span class="v">' + T.fmt(Math.round(r.defisitHarian)) + ' kkal/hari</span></div>' +
      '<div class="kv"><span class="k">Kebutuhan kalori harianmu (TDEE)</span><span class="v">' + T.fmt(Math.round(r.tdee)) + ' kkal/hari</span></div>' +
      '<div class="kv"><span class="k">Target makan harian</span><span class="v"><b>' + T.fmt(Math.round(r.targetKalori)) + ' kkal/hari</b></span></div>' +
      '<div class="kv"><span class="k">BMI sekarang ke BMI target</span><span class="v">' + utils.fmtDes(r.bmiSekarang, 1) + ' ke ' + utils.fmtDes(r.bmiTarget, 1) + '</span></div>' +
      (terlaluRendah
        ? '<p class="err">Target kalorimu di bawah ' + T.fmt(batasBawah) + ' kkal/hari. Makan sekecil itu berisiko kekurangan gizi. Pilih laju yang lebih pelan, atau konsultasi ke dokter atau ahli gizi sebelum mulai.</p>'
        : '') +
      '<p class="hint">Angka ini perkiraan dari rumus, BUKAN diagnosis dan bukan resep diet. Berat badan nyata bisa naik turun karena air, otot, dan hormon, jadi timbang seminggu sekali di waktu yang sama. ' +
      'Turun lebih dari 1 kg per minggu umumnya tidak disarankan tanpa pengawasan tenaga kesehatan. ' +
      'Bila kamu punya diabetes, gangguan makan, sedang hamil atau menyusui, atau minum obat rutin, konsultasi dulu ke dokter atau ahli gizi.</p>');
  };

  root.appendChild(T.grid2(
    T.field('Berat sekarang (kg)', berat),
    T.field('Berat target (kg)', target),
  ));
  root.appendChild(T.grid2(
    T.field('Tinggi badan (cm)', tinggi),
    T.field('Umur (tahun)', umur),
  ));
  root.appendChild(T.grid2(
    T.field('Jenis kelamin', gender),
    T.field('Seberapa aktif kamu', aktivitas),
  ));
  root.appendChild(T.field('Seberapa cepat mau turun', laju, '0,5 kg per minggu adalah laju yang paling sering disarankan.'));
  root.appendChild(T.btn('Buat rencana', hitung, true));
  root.appendChild(box);
  hitung();
}
