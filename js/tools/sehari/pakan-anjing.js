import { h as T, kv, utils } from '../../core.js';

// Porsi makan anjing dari kebutuhan kalori. RER = 70 x berat^0,75,
// lalu dikali faktor sesuai umur dan kondisi (NRC 2006, WSAVA).
utils.pakanAnjing = function (beratKg, faktor, kkalPer100g) {
  const b = Number(beratKg), f = Number(faktor), e = Number(kkalPer100g);
  if (!(b > 0) || !(f > 0) || !(e > 0)) return null;
  const rer = 70 * Math.pow(b, 0.75);
  const mer = rer * f;
  const gram = mer / (e / 100);
  return { rer: Math.round(rer), mer: Math.round(mer), gram: Math.round(gram) };
};

export const meta = {"id": "pakan-anjing", "name": "Porsi Makan Anjing", "cat": "sehari", "icon": "🦴", "desc": "Porsi makan harian anjing dalam gram dan kalori, dari berat dan aktivitas. Kalori harian tetap dihitung walau kalori pakan belum tahu.", "keywords": "anjing,makan,porsi,gram,kalori,pakan,berat,rer,mer,kkal", "since": "6.11.0"};
export function render(root) {
  const berat = T.input('text', 'Contoh: 20 atau 12,5', '20');
  berat.inputMode = 'decimal';
  const status = T.select([
    ['3', 'Anak anjing di bawah 4 bulan'],
    ['2', 'Anak anjing 4 bulan sampai dewasa'],
    ['1.6', 'Dewasa sudah steril, aktivitas biasa'],
    ['1.8', 'Dewasa belum steril, aktivitas biasa'],
    ['1.4', 'Dewasa sudah steril, kurang gerak'],
    ['2', 'Dewasa sangat aktif atau kerja'],
    ['1', 'Lagi turun berat (pakai berat target)'],
  ], '1.6');
  const kkal = T.input('text', 'Contoh: 350', '350');
  kkal.inputMode = 'decimal';
  const box = T.out();

  const hitung = () => {
    const b = T.num(berat.value);
    const eKosong = kkal.value.trim() === '';
    const e = T.num(kkal.value);
    const f = Number(status.value);
    if (!(b > 0)) { T.show(box, '<span class="err">Isi berat anjing dengan angka, contoh: 20 atau 12,5.</span>'); return; }
    if (b > 120) { T.show(box, '<span class="err">Berat anjing di atas 120 kg jarang terjadi. Cek lagi angkanya.</span>'); return; }
    if (!eKosong && !(e > 0)) { T.show(box, '<span class="err">Isi kalori pakan dengan angka, contoh: 350. Angkanya ada di kemasan pakan.</span>'); return; }
    // Kalori pakan belum tahu: tampilkan kebutuhan kalori hariannya saja
    // (fungsi dari Kalori Harian Hewan) tanpa porsi gram.
    if (eKosong) {
      const rer = 70 * Math.pow(b, 0.75);
      const mer = rer * f;
      T.show(box,
        '<div class="center"><div class="dim">Kebutuhan kalori per hari</div>' +
        '<div class="big">' + T.fmt(Math.round(mer)) + ' kkal</div></div>' +
        kv('Kalori saat istirahat', T.fmt(Math.round(rer)) + ' kkal per hari') +
        kv('Faktor kondisi', 'x ' + T.fmt(f)) +
        kv('Camilan maksimal', 'Sekitar ' + T.fmt(Math.round(mer * 0.1)) + ' kkal per hari (10% dari total)') +
        '<p class="hint">Isi kalori pakan (kkal per 100 gram, ada di kemasan) untuk melihat porsinya dalam gram. Hitungan memakai rumus NRC 2006 dan WSAVA: kalori istirahat 70 x berat^0,75, dikali faktor sesuai kondisi. Kebutuhan tiap hewan bisa beda sampai 30% dari angka ini, jadi pantau berat badannya tiap beberapa minggu. Kalau pilih turun berat, isi berat targetnya, bukan berat sekarang. Ini panduan umum. Untuk keputusan medis, konsultasikan ke dokter hewan.</p>');
      return;
    }
    const r = utils.pakanAnjing(b, f, e);
    const perMakan = Math.round(r.gram / 2);
    T.show(box,
      '<div class="center"><div class="dim">Porsi makan per hari</div>' +
      '<div class="big">' + T.fmt(r.gram) + ' gram</div>' +
      '<div class="dim">Sekitar ' + T.fmt(perMakan) + ' gram tiap kali makan, 2 kali sehari</div></div>' +
      kv('Kalori yang dibutuhkan', T.fmt(r.mer) + ' kkal per hari') +
      kv('Kalori saat istirahat', T.fmt(r.rer) + ' kkal per hari') +
      kv('Faktor kondisi', 'x ' + T.fmt(f)) +
      kv('Camilan maksimal', 'Sekitar ' + T.fmt(Math.round(r.mer * 0.1)) + ' kkal per hari (10% dari total)') +
      '<p class="hint">Hitungan memakai rumus NRC 2006 dan WSAVA: kalori istirahat 70 x berat^0,75, dikali faktor sesuai kondisi. Kalori pakan lihat di kemasan, biasanya 300-400 kkal per 100 gram untuk pakan kering. Kalau pilih turun berat, isi berat targetnya, bukan berat sekarang. Ini panduan umum. Untuk keputusan medis, konsultasikan ke dokter hewan.</p>');
  };

  root.appendChild(T.grid2(
    T.field('Berat anjing (kg)', berat),
    T.field('Kalori pakan (kkal per 100 gram)', kkal, 'Angkanya ada di kemasan pakan. Kosongkan bila belum tahu — kalori harian tetap dihitung.'),
  ));
  root.appendChild(T.field('Umur dan kondisi', status));
  root.appendChild(T.btn('Hitung Porsi', hitung, true));
  root.appendChild(box);
  T.show(box, '<p class="hint">Isi berat anjing dan kalori pakannya, lalu tekan Hitung Porsi.</p>');
}
