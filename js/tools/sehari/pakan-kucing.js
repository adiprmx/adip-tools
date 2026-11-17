import { h as T, kv, utils } from '../../core.js';

// Porsi makan kucing dari kebutuhan kalori. RER = 70 x berat^0,75,
// lalu dikali faktor sesuai umur dan kondisi (NRC 2006, WSAVA).
utils.pakanKucing = function (beratKg, faktor, kkalPer100g) {
  const b = Number(beratKg), f = Number(faktor), e = Number(kkalPer100g);
  if (!(b > 0) || !(f > 0) || !(e > 0)) return null;
  const rer = 70 * Math.pow(b, 0.75);
  const mer = rer * f;
  const gram = mer / (e / 100);
  return { rer: Math.round(rer), mer: Math.round(mer), gram: Math.round(gram) };
};

export const meta = {"id": "pakan-kucing", "name": "Porsi Makan Kucing", "cat": "sehari", "icon": "🍽️", "desc": "Porsi makan harian kucing dalam gram dan kalori, dari berat dan aktivitas.", "keywords": "kucing,makan,porsi,gram,kalori,pakan,berat", "since": "6.11.0"};
export function render(root) {
  const berat = T.input('text', 'Contoh: 4 atau 4,5', '4');
  berat.inputMode = 'decimal';
  const status = T.select([
    ['2.5', 'Anak kucing (di bawah 1 tahun)'],
    ['1.2', 'Dewasa sudah steril, di dalam rumah'],
    ['1.4', 'Dewasa sudah steril, aktif atau sering keluar'],
    ['1.4', 'Dewasa belum steril'],
    ['1.1', 'Senior (di atas 10 tahun), sudah steril'],
    ['0.8', 'Lagi turun berat (pakai berat target)'],
  ], '1.2');
  const kkal = T.input('text', 'Contoh: 360', '360');
  kkal.inputMode = 'decimal';
  const box = T.out();

  const hitung = () => {
    const b = T.num(berat.value);
    const e = T.num(kkal.value);
    if (!(b > 0)) { T.show(box, '<span class="err">Isi berat kucing dengan angka, contoh: 4 atau 4,5.</span>'); return; }
    if (b > 15) { T.show(box, '<span class="err">Berat kucing di atas 15 kg jarang terjadi. Cek lagi angkanya.</span>'); return; }
    if (!(e > 0)) { T.show(box, '<span class="err">Isi kalori pakan dengan angka, contoh: 360. Angkanya ada di kemasan pakan.</span>'); return; }
    const r = utils.pakanKucing(b, Number(status.value), e);
    const perMakan = Math.round(r.gram / 2);
    T.show(box,
      '<div class="center"><div class="dim">Porsi makan per hari</div>' +
      '<div class="big">' + T.fmt(r.gram) + ' gram</div>' +
      '<div class="dim">Sekitar ' + T.fmt(perMakan) + ' gram tiap kali makan, 2 kali sehari</div></div>' +
      kv('Kalori yang dibutuhkan', T.fmt(r.mer) + ' kkal per hari') +
      kv('Kalori saat istirahat', T.fmt(r.rer) + ' kkal per hari') +
      kv('Camilan maksimal', 'Sekitar ' + T.fmt(Math.round(r.mer * 0.1)) + ' kkal per hari (10% dari total)') +
      '<p class="hint">Hitungan memakai rumus NRC 2006 dan WSAVA: kalori istirahat 70 x berat^0,75, dikali faktor sesuai kondisi. Kalori pakan lihat di kemasan, biasanya 350-400 kkal per 100 gram untuk pakan kering. Kalau pilih turun berat, isi berat targetnya, bukan berat sekarang. Ini panduan umum. Untuk keputusan medis, konsultasikan ke dokter hewan.</p>');
  };

  root.appendChild(T.grid2(
    T.field('Berat kucing (kg)', berat),
    T.field('Kalori pakan (kkal per 100 gram)', kkal, 'Angkanya ada di kemasan pakan.'),
  ));
  root.appendChild(T.field('Umur dan kondisi', status));
  root.appendChild(T.btn('Hitung Porsi', hitung, true));
  root.appendChild(box);
  T.show(box, '<p class="hint">Isi berat kucing dan kalori pakannya, lalu tekan Hitung Porsi.</p>');
}
