import { h as T, kv, utils } from '../../core.js?v=6.12.1';

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

export const meta = {"id": "pakan-anjing", "name": "Porsi Makan Anjing", "cat": "sehari", "icon": "🦴", "desc": "Porsi makan harian anjing dalam gram dan kalori, dari berat dan aktivitas.", "keywords": "anjing,makan,porsi,gram,kalori,pakan,berat", "since": "6.11.0"};
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
    const e = T.num(kkal.value);
    if (!(b > 0)) { T.show(box, '<span class="err">Isi berat anjing dengan angka, contoh: 20 atau 12,5.</span>'); return; }
    if (b > 120) { T.show(box, '<span class="err">Berat anjing di atas 120 kg jarang terjadi. Cek lagi angkanya.</span>'); return; }
    if (!(e > 0)) { T.show(box, '<span class="err">Isi kalori pakan dengan angka, contoh: 350. Angkanya ada di kemasan pakan.</span>'); return; }
    const r = utils.pakanAnjing(b, Number(status.value), e);
    const perMakan = Math.round(r.gram / 2);
    T.show(box,
      '<div class="center"><div class="dim">Porsi makan per hari</div>' +
      '<div class="big">' + T.fmt(r.gram) + ' gram</div>' +
      '<div class="dim">Sekitar ' + T.fmt(perMakan) + ' gram tiap kali makan, 2 kali sehari</div></div>' +
      kv('Kalori yang dibutuhkan', T.fmt(r.mer) + ' kkal per hari') +
      kv('Kalori saat istirahat', T.fmt(r.rer) + ' kkal per hari') +
      kv('Camilan maksimal', 'Sekitar ' + T.fmt(Math.round(r.mer * 0.1)) + ' kkal per hari (10% dari total)') +
      '<p class="hint">Hitungan memakai rumus NRC 2006 dan WSAVA: kalori istirahat 70 x berat^0,75, dikali faktor sesuai kondisi. Kalori pakan lihat di kemasan, biasanya 300-400 kkal per 100 gram untuk pakan kering. Kalau pilih turun berat, isi berat targetnya, bukan berat sekarang. Ini panduan umum. Untuk keputusan medis, konsultasikan ke dokter hewan.</p>');
  };

  root.appendChild(T.grid2(
    T.field('Berat anjing (kg)', berat),
    T.field('Kalori pakan (kkal per 100 gram)', kkal, 'Angkanya ada di kemasan pakan.'),
  ));
  root.appendChild(T.field('Umur dan kondisi', status));
  root.appendChild(T.btn('Hitung Porsi', hitung, true));
  root.appendChild(box);
  T.show(box, '<p class="hint">Isi berat anjing dan kalori pakannya, lalu tekan Hitung Porsi.</p>');
}
