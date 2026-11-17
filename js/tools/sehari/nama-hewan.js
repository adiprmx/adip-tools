import { h as T, kv, utils } from '../../core.js';

// Nama hewan peliharaan beserta artinya. Arti nama diambil dari arti
// kata yang umum dikenal (bahasa Latin, Swahili, Jepang, Italia, dan lain-lain).
const NAMA = {
  kucing: {
    lucu: [
      ['Mochi', 'Kue beras Jepang yang kenyal dan lembut'],
      ['Boba', 'Bola tapioka di minuman boba'],
      ['Oreo', 'Biskuit cokelat berlapis krim putih'],
      ['Cimol', 'Jajanan aci goreng dari Bandung'],
      ['Milo', 'Minuman cokelat malt'],
      ['Tofu', 'Tahu dalam bahasa Inggris'],
      ['Nori', 'Rumput laut kering dari Jepang'],
      ['Kopi', 'Minuman kopi'],
    ],
    gagah: [
      ['Simba', 'Singa dalam bahasa Swahili'],
      ['Leo', 'Singa dalam bahasa Latin'],
      ['Raja', 'Pemimpin kerajaan'],
      ['Kaisar', 'Gelar pemimpin kekaisaran'],
      ['Titan', 'Raksasa dalam mitologi Yunani'],
      ['Arjuna', 'Ksatria dalam pewayangan'],
      ['Bima', 'Ksatria dalam pewayangan'],
      ['Gatotkaca', 'Ksatria dalam pewayangan'],
    ],
    manis: [
      ['Luna', 'Bulan dalam bahasa Latin'],
      ['Bella', 'Cantik dalam bahasa Italia'],
      ['Momo', 'Buah persik dalam bahasa Jepang'],
      ['Cinta', 'Kasih sayang'],
      ['Bunga', 'Bunga'],
      ['Melati', 'Bunga melati'],
      ['Sakura', 'Bunga sakura dari Jepang'],
      ['Kiki', 'Nama pendek yang ceria'],
    ],
    unik: [
      ['Wasabi', 'Pasta pedas hijau dari Jepang'],
      ['Suki', 'Kesayangan dalam bahasa Jepang'],
      ['Kiko', 'Nama dari Jepang'],
      ['Zuzu', 'Nama pendek yang mudah diingat'],
      ['Piko', 'Nama pendek yang ringan'],
      ['Miko', 'Nama dari Jepang'],
      ['Nori', 'Rumput laut kering dari Jepang'],
      ['Tofu', 'Tahu dalam bahasa Inggris'],
    ],
  },
  anjing: {
    lucu: [
      ['Boba', 'Bola tapioka di minuman boba'],
      ['Brownie', 'Kue cokelat panggang'],
      ['Oreo', 'Biskuit cokelat berlapis krim putih'],
      ['Milo', 'Minuman cokelat malt'],
      ['Choco', 'Cokelat'],
      ['Biscuit', 'Biskuit dalam bahasa Inggris'],
      ['Nugget', 'Potongan ayam goreng kecil'],
      ['Kiko', 'Nama dari Jepang'],
    ],
    gagah: [
      ['Rocky', 'Kuat seperti batu karang'],
      ['Max', 'Terbesar dalam bahasa Latin'],
      ['Bruno', 'Cokelat atau perisai dalam bahasa Jerman'],
      ['Rex', 'Raja dalam bahasa Latin'],
      ['Thor', 'Dewa petir dalam mitologi Nordik'],
      ['Zeus', 'Dewa langit dalam mitologi Yunani'],
      ['Bima', 'Ksatria dalam pewayangan'],
      ['Arjuna', 'Ksatria dalam pewayangan'],
    ],
    manis: [
      ['Bella', 'Cantik dalam bahasa Italia'],
      ['Luna', 'Bulan dalam bahasa Latin'],
      ['Daisy', 'Bunga aster'],
      ['Rosie', 'Mawar'],
      ['Lulu', 'Nama pendek yang manis'],
      ['Molly', 'Nama yang hangat dan akrab'],
      ['Coco', 'Dari kakao atau kelapa'],
      ['Mimi', 'Nama pendek yang manis'],
    ],
    unik: [
      ['Koda', 'Teman dalam bahasa suku Sioux'],
      ['Ziggy', 'Nama pendek yang mudah diingat'],
      ['Pip', 'Nama pendek yang ringan'],
      ['Mochi', 'Kue beras Jepang yang kenyal dan lembut'],
      ['Tofu', 'Tahu dalam bahasa Inggris'],
      ['Wasabi', 'Pasta pedas hijau dari Jepang'],
      ['Nori', 'Rumput laut kering dari Jepang'],
      ['Bingo', 'Nama permainan yang ramai'],
    ],
  },
};
utils.namaHewan = function (jenis, sifat, jumlah) {
  const daftar = (NAMA[jenis] && NAMA[jenis][sifat]) || [];
  if (!daftar.length) return null;
  const salin = daftar.slice();
  const hasil = [];
  const n = Math.min(Number(jumlah) || 5, salin.length);
  while (hasil.length < n && salin.length) {
    hasil.push(salin.splice(Math.floor(Math.random() * salin.length), 1)[0]);
  }
  return hasil;
};

export const meta = {"id": "nama-hewan", "name": "Generator Nama Hewan", "cat": "sehari", "icon": "🏷️", "desc": "Nama hewan peliharaan acak beserta artinya, sesuai jenis dan sifatnya.", "keywords": "nama,hewan,kucing,anjing,generator,arti nama", "since": "6.11.0"};
export function render(root) {
  const jenis = T.select([
    ['kucing', 'Kucing'],
    ['anjing', 'Anjing'],
  ], 'kucing');
  const sifat = T.select([
    ['lucu', 'Lucu'],
    ['gagah', 'Gagah'],
    ['manis', 'Manis'],
    ['unik', 'Unik'],
  ], 'lucu');
  const box = T.out();

  const acak = () => {
    const hasil = utils.namaHewan(jenis.value, sifat.value, 5);
    if (!hasil) { T.show(box, '<span class="err">Pilihan jenis atau sifatnya tidak dikenal. Coba lagi.</span>'); return; }
    let html = '<div class="center"><div class="dim">5 nama untuk ' + (jenis.value === 'kucing' ? 'kucing' : 'anjing') + ' ' + sifat.value + '</div></div>';
    hasil.forEach((h) => { html += kv(h[0], h[1]); });
    html += '<p class="hint">Tekan lagi untuk nama yang lain. Nama yang pendek dan jelas biasanya lebih cepat dikenali hewan.</p>' +
      '<p class="hint">Ini panduan umum. Untuk keputusan medis, konsultasikan ke dokter hewan.</p>';
    T.show(box, html);
  };

  root.appendChild(T.grid2(
    T.field('Jenis hewan', jenis),
    T.field('Sifat yang dicari', sifat),
  ));
  root.appendChild(T.btn('Acak Nama', acak, true));
  root.appendChild(box);
  T.show(box, '<p class="hint">Pilih jenis dan sifat, lalu tekan Acak Nama.</p>');
}
