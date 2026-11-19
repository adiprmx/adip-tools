import { h as T, kv, errBox } from '../../core.js';

// Patokan umum katering per orang dewasa untuk satu kali makan berat:
// beras 100 g (jadi nasi matang sekitar 200 g), lauk protein 150 g,
// sayur 100 g, buah 100 g. Camilan saja: 150 g per orang. Minuman:
// 300 ml ditambah 150 ml per jam acara. Anak dihitung setengah porsi.
// Semua hasil ditambah cadangan 10% dan dibulatkan ke atas.
export const PATOKAN = {
  beras: 100, // gram per orang
  lauk: 150,
  sayur: 100,
  buah: 100,
  camilan: 150,
  minumDasar: 300, // ml
  minumPerJam: 150, // ml
};

export function hitungPesta(tamu, anak, jam, jenis) {
  const dewasa = Math.max(0, tamu - anak);
  const porsi = dewasa + anak * 0.5;
  // Cadangan 10% dihitung sebagai x11/10 (bukan x1,1) supaya nilai bulat
  // tetap bulat dan tidak kelebihan karena galat float; ceil dikurangi
  // epsilon kecil sebagai pengaman.
  const atas = (v) => Math.ceil(v - 1e-9);
  const r = { porsi, dewasa, anak };
  if (jenis === 'berat' || jenis === 'prasmanan') {
    r.berasKg = atas((porsi * PATOKAN.beras * 11 / 10) / 100) / 10;
    r.laukKg = atas((porsi * PATOKAN.lauk * 11 / 10) / 100) / 10;
    r.sayurKg = atas((porsi * PATOKAN.sayur * 11 / 10) / 100) / 10;
    r.buahKg = atas((porsi * PATOKAN.buah * 11 / 10) / 100) / 10;
  }
  if (jenis === 'camilan' || jenis === 'prasmanan') {
    r.camilanKg = atas((porsi * PATOKAN.camilan * 11 / 10) / 100) / 10;
  }
  const ml = (PATOKAN.minumDasar + PATOKAN.minumPerJam * jam) * porsi * 11 / 10;
  r.minumanL = atas(ml / 100) / 10;
  r.gelas = Math.ceil(tamu * (1 + jam / 2));
  r.piring = tamu;
  r.esKg = atas((tamu * 0.25 * 11 / 10) * 10) / 10;
  return r;
}

export const meta = { "id": "kalkulator-jumlah-makanan-pesta", "name": "Kalkulator Jumlah Makanan Pesta", "cat": "masak", "icon": "🎉", "desc": "Perkirakan beras, lauk, sayur, camilan, dan minuman untuk acara sesuai jumlah tamu.", "keywords": "pesta,acara,katering,jumlah makanan,tamu,prasmanan,nasi,beras", "since": "6.18.0" };

export function render(root) {
  const tamu = T.input('number', 'Jumlah tamu', '50');
  const anak = T.input('number', 'Di antaranya anak-anak', '10');
  const jam = T.input('number', 'Lama acara (jam)', '3');
  const jenis = T.select([['berat', 'Makan berat'], ['camilan', 'Camilan saja'], ['prasmanan', 'Prasmanan (berat + camilan)']], 'berat');
  const box = T.out();

  const hitung = () => {
    const t = T.num(tamu.value);
    const a = T.num(anak.value);
    const j = T.num(jam.value);
    if (!(t >= 1 && t <= 10000)) {
      T.show(box, errBox('Isi jumlah tamu antara 1 sampai 10.000.'));
      return;
    }
    if (!(a >= 0 && a <= t)) {
      T.show(box, errBox('Jumlah anak tidak boleh lebih dari jumlah tamu.'));
      return;
    }
    if (!(j >= 0.5 && j <= 12)) {
      T.show(box, errBox('Isi lama acara antara 0,5 sampai 12 jam.'));
      return;
    }
    const r = hitungPesta(t, a, j, jenis.value);
    let baris = '';
    if (r.berasKg != null) {
      baris += kv('Beras', T.fmt(r.berasKg) + ' kg') + kv('Lauk utama', T.fmt(r.laukKg) + ' kg') +
        kv('Sayur', T.fmt(r.sayurKg) + ' kg') + kv('Buah', T.fmt(r.buahKg) + ' kg');
    }
    if (r.camilanKg != null) baris += kv('Camilan', T.fmt(r.camilanKg) + ' kg');
    baris += kv('Minuman (total)', T.fmt(r.minumanL) + ' liter') +
      kv('Gelas sekali pakai', T.fmt(r.gelas) + ' buah') +
      kv('Piring', T.fmt(r.piring) + ' buah') +
      kv('Es batu', T.fmt(r.esKg) + ' kg');
    T.show(box,
      '<div class="center"><div class="dim">Untuk ' + t + ' tamu (' + r.dewasa + ' dewasa, ' + a + ' anak)</div>' +
      '<div class="big">' + r.porsi.toFixed(1).replace('.', ',') + ' porsi</div>' +
      '<div class="dim">Anak dihitung setengah porsi, sudah termasuk cadangan 10%</div></div>' +
      baris +
      '<p class="hint">Patokan per orang dewasa: beras 100 gram, lauk 150 gram, sayur 100 gram, buah 100 gram, ' +
      'camilan 150 gram, minuman 300 ml ditambah 150 ml per jam acara. Ini patokan umum katering, sesuaikan dengan ' +
      'selera tamu dan menumu. Bila ada tamu yang makan banyak atau menunya sedikit, siapkan lebih.</p>');
  };

  root.appendChild(T.grid2(
    T.field('Jumlah tamu', tamu),
    T.field('Di antaranya anak-anak', anak, 'Anak dihitung setengah porsi.'),
  ));
  root.appendChild(T.grid2(
    T.field('Lama acara (jam)', jam),
    T.field('Jenis hidangan', jenis),
  ));
  root.appendChild(T.btn('Hitung kebutuhan', hitung, true));
  root.appendChild(box);
  hitung();
}
