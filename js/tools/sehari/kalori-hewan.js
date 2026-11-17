import { h as T, kv, utils } from '../../core.js';

// Kebutuhan kalori harian hewan. RER = 70 x berat^0,75, lalu dikali
// faktor sesuai umur dan kondisi (NRC 2006, WSAVA).
utils.kaloriHewan = function (beratKg, faktor) {
  const b = Number(beratKg), f = Number(faktor);
  if (!(b > 0) || !(f > 0)) return null;
  const rer = 70 * Math.pow(b, 0.75);
  return { rer: Math.round(rer), mer: Math.round(rer * f), faktor: f };
};

const STATUS = {
  kucing: [
    ['2.5', 'Anak kucing (di bawah 1 tahun)'],
    ['1.2', 'Dewasa sudah steril, di dalam rumah'],
    ['1.4', 'Dewasa sudah steril, aktif atau sering keluar'],
    ['1.4', 'Dewasa belum steril'],
    ['1', 'Dewasa kurang gerak'],
    ['0.8', 'Lagi turun berat (pakai berat target)'],
  ],
  anjing: [
    ['3', 'Anak anjing di bawah 4 bulan'],
    ['2', 'Anak anjing 4 bulan sampai dewasa'],
    ['1.6', 'Dewasa sudah steril, aktivitas biasa'],
    ['1.8', 'Dewasa belum steril, aktivitas biasa'],
    ['1.4', 'Dewasa sudah steril, kurang gerak'],
    ['2', 'Dewasa sangat aktif atau kerja'],
    ['1', 'Lagi turun berat (pakai berat target)'],
  ],
};

export const meta = {"id": "kalori-hewan", "name": "Kalori Harian Hewan", "cat": "sehari", "icon": "🔥", "desc": "Kebutuhan kalori harian kucing dan anjing dari berat dan kondisinya.", "keywords": "kalori,hewan,kucing,anjing,rer,mer,kkal,berat", "since": "6.11.0"};
export function render(root) {
  const jenis = T.select([['kucing', 'Kucing'], ['anjing', 'Anjing']], 'kucing');
  const berat = T.input('text', 'Contoh: 4 atau 20', '4');
  berat.inputMode = 'decimal';
  const status = T.select(STATUS.kucing, '1.2');
  const box = T.out();

  const aturStatus = () => {
    const daftar = STATUS[jenis.value];
    status.innerHTML = '';
    daftar.forEach(([v, l]) => {
      const o = document.createElement('option');
      o.value = v; o.textContent = l;
      status.appendChild(o);
    });
    status.value = jenis.value === 'anjing' ? '1.6' : '1.2';
    if (jenis.value === 'anjing' && berat.value === '4') berat.value = '20';
    if (jenis.value === 'kucing' && berat.value === '20') berat.value = '4';
  };
  jenis.addEventListener('change', aturStatus);

  const hitung = () => {
    const b = T.num(berat.value);
    if (!(b > 0)) { T.show(box, '<span class="err">Isi berat hewan dengan angka, contoh: 4 untuk kucing atau 20 untuk anjing.</span>'); return; }
    const batas = jenis.value === 'kucing' ? 15 : 120;
    if (b > batas) { T.show(box, '<span class="err">Berat di atas ' + batas + ' kg jarang terjadi untuk ' + jenis.value + '. Cek lagi angkanya.</span>'); return; }
    const r = utils.kaloriHewan(b, Number(status.value));
    T.show(box,
      '<div class="center"><div class="dim">Kebutuhan kalori per hari</div>' +
      '<div class="big">' + T.fmt(r.mer) + ' kkal</div></div>' +
      kv('Kalori saat istirahat', T.fmt(r.rer) + ' kkal per hari') +
      kv('Faktor kondisi', 'x ' + T.fmt(r.faktor)) +
      kv('Camilan maksimal', 'Sekitar ' + T.fmt(Math.round(r.mer * 0.1)) + ' kkal per hari (10% dari total)') +
      '<p class="hint">Hitungan memakai rumus NRC 2006 dan WSAVA: kalori istirahat 70 x berat^0,75, dikali faktor sesuai kondisi. Kebutuhan tiap hewan bisa beda sampai 30% dari angka ini, jadi pantau berat badannya tiap beberapa minggu. Kalau pilih turun berat, isi berat targetnya, bukan berat sekarang. Ini panduan umum. Untuk keputusan medis, konsultasikan ke dokter hewan.</p>');
  };

  root.appendChild(T.grid2(
    T.field('Jenis hewan', jenis),
    T.field('Berat (kg)', berat),
  ));
  root.appendChild(T.field('Umur dan kondisi', status));
  root.appendChild(T.btn('Hitung Kalori', hitung, true));
  root.appendChild(box);
  T.show(box, '<p class="hint">Pilih jenis, isi berat, lalu tekan Hitung Kalori.</p>');
}
