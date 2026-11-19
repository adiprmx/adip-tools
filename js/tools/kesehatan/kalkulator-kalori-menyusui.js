import { h as T, esc, utils } from '../../core.js';

// Kebutuhan kalori saat menyusui: kalori harian (TDEE) ditambah kalori
// ekstra untuk memproduksi ASI.
//   BMR wanita (Mifflin-St Jeor, 1990):
//     10 x berat (kg) + 6,25 x tinggi (cm) - 5 x umur - 161
//   TDEE = BMR x faktor aktivitas (1,2 ringan; 1,375 sedang;
//     1,55 aktif; 1,725 sangat aktif)
//   Tambahan menyusui (WHO/FAO): +500 kkal/hari untuk ASI eksklusif
//     0-6 bulan, +400 kkal/hari untuk ASI campuran 6-12 bulan.
export const TAMBAHAN_MENYUSUI = {
  eksklusif: { kkal: 500, label: 'ASI eksklusif (0-6 bulan)' },
  campuran: { kkal: 400, label: 'ASI + MPASI (6-12 bulan)' },
};

export function hitungKaloriMenyusui(beratKg, tinggiCm, umur, faktorAktivitas, fase) {
  if (!(beratKg > 0) || !(tinggiCm > 0) || !(umur > 0) || !(faktorAktivitas > 0)) return null;
  const t = TAMBAHAN_MENYUSUI[fase];
  if (!t) return null;
  const bmr = 10 * beratKg + 6.25 * tinggiCm - 5 * umur - 161;
  const tdee = bmr * faktorAktivitas;
  return { bmr, tdee, tambahan: t.kkal, total: tdee + t.kkal };
}

export const meta = { "id": "kalkulator-kalori-menyusui", "name": "Kalkulator Kalori Menyusui", "cat": "kesehatan", "icon": "🤱", "desc": "Berapa kalori yang kamu butuhkan setiap hari saat menyusui, dari berat badan, tinggi, umur, dan aktivitasmu.", "keywords": "kalori menyusui,menyusui,asi,laktasi,ibu menyusui,kalori,mpasi", "since": "6.19.0" };

export function render(root) {
  const berat = T.input('number', 'Berat badan (kg)', '60');
  const tinggi = T.input('number', 'Tinggi badan (cm)', '160');
  const umur = T.input('number', 'Umur (tahun)', '30');
  const aktivitas = T.select([
    ['1.2', 'Ringan (kebanyakan duduk)'],
    ['1.375', 'Sedang (gerak ringan 1-3 hari/minggu)'],
    ['1.55', 'Aktif (gerak sedang 3-5 hari/minggu)'],
    ['1.725', 'Sangat aktif (gerak berat hampir tiap hari)'],
  ], '1.2');
  const fase = T.select([
    ['eksklusif', 'ASI eksklusif (bayi 0-6 bulan)'],
    ['campuran', 'ASI + MPASI (bayi 6-12 bulan)'],
  ], 'eksklusif');
  const box = T.out();

  const hitung = () => {
    const bb = T.num(berat.value);
    const tb = T.num(tinggi.value);
    const u = T.num(umur.value);
    if (!(bb >= 30 && bb <= 200)) {
      T.show(box, '<span class="err">Isi berat badan antara 30 sampai 200 kg.</span>');
      return;
    }
    if (!(tb >= 120 && tb <= 220)) {
      T.show(box, '<span class="err">Isi tinggi badan antara 120 sampai 220 cm.</span>');
      return;
    }
    if (!(u >= 15 && u <= 60)) {
      T.show(box, '<span class="err">Isi umur antara 15 sampai 60 tahun.</span>');
      return;
    }
    const r = hitungKaloriMenyusui(bb, tb, u, Number(aktivitas.value), fase.value);
    T.show(box,
      '<div class="center"><div class="dim">Kebutuhan kalorimu saat menyusui</div>' +
      '<div class="big">' + T.fmt(Math.round(r.total)) + ' kkal/hari</div>' +
      '<div class="dim" style="margin-top:6px">Termasuk tambahan untuk memproduksi ASI</div></div>' +
      '<div class="kv"><span class="k">Kalori basal (BMR)</span><span class="v">' + T.fmt(Math.round(r.bmr)) + ' kkal/hari</span></div>' +
      '<div class="kv"><span class="k">Kalori harian tanpa menyusui (TDEE)</span><span class="v">' + T.fmt(Math.round(r.tdee)) + ' kkal/hari</span></div>' +
      '<div class="kv"><span class="k">Tambahan menyusui (' + esc(TAMBAHAN_MENYUSUI[fase.value].label) + ')</span><span class="v">+' + T.fmt(r.tambahan) + ' kkal/hari</span></div>' +
      '<div class="dim" style="margin-top:12px">Yang perlu diperhatikan</div>' +
      '<div class="kv"><span class="k">Minum</span><span class="v">Minum lebih banyak dari biasanya. ASI sebagian besar air.</span></div>' +
      '<div class="kv"><span class="k">Makan</span><span class="v">Utamakan makanan bergizi seimbang: protein, sayur, buah, dan lemak sehat.</span></div>' +
      '<div class="kv"><span class="k">Diet ketat</span><span class="v">Hindari mengurangi makan drastis saat menyusui. Produksi ASI bisa terganggu.</span></div>' +
      '<p class="hint">Rumus: BMR Mifflin-St Jeor dikali faktor aktivitas, ditambah 500 kkal (ASI eksklusif) atau 400 kkal (ASI campuran) per hari sesuai WHO/FAO. ' +
      'Kebutuhan tiap ibu berbeda tergantung produksi ASI dan kondisi badan. Ini perkiraan buat belajar, bukan diagnosis. Kalau berat badanmu turun drastis atau ASImu berkurang, cek ke dokter atau konselor laktasi.</p>');
  };

  root.appendChild(T.grid2(
    T.field('Berat badan (kg)', berat),
    T.field('Tinggi badan (cm)', tinggi),
    T.field('Umur (tahun)', umur),
    T.field('Seberapa aktif kamu?', aktivitas),
    T.field('Fase menyusui', fase),
  ));
  root.appendChild(T.btn('Hitung', hitung, true));
  root.appendChild(box);
  hitung();
}
