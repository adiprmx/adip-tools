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
      ['Cireng', 'Jajanan aci goreng yang kenyal'],
      ['Cilok', 'Jajanan aci tusuk dari Bandung'],
      ['Batagor', 'Bakso tahu goreng khas Bandung'],
      ['Siomay', 'Dimsum isi ayam atau ikan'],
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
      ['Hercules', 'Pahlawan kuat dalam mitologi Yunani'],
      ['Sultan', 'Gelar penguasa kerajaan'],
      ['Prabu', 'Gelar raja dalam bahasa Jawa'],
      ['Maharaja', 'Raja agung'],
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
      ['Yuki', 'Salju dalam bahasa Jepang'],
      ['Hana', 'Bunga dalam bahasa Jepang'],
      ['Mawar', 'Bunga mawar'],
      ['Anggun', 'Elok dan menawan'],
    ],
    unik: [
      ['Wasabi', 'Pasta pedas hijau dari Jepang'],
      ['Suki', 'Kesayangan dalam bahasa Jepang'],
      ['Kiko', 'Nama dari Jepang'],
      ['Zuzu', 'Nama pendek yang mudah diingat'],
      ['Piko', 'Nama pendek yang ringan'],
      ['Miko', 'Nama dari Jepang'],
      ['Kuro', 'Hitam dalam bahasa Jepang'],
      ['Shiro', 'Putih dalam bahasa Jepang'],
      ['Yuzu', 'Buah jeruk dari Jepang'],
      ['Miso', 'Pasta kedelai fermentasi dari Jepang'],
      ['Pudding', 'Puding, makanan penutup yang lembut'],
      ['Waffle', 'Wafel, kue panggang berkotak-kotak'],
    ],
  },
  anjing: {
    lucu: [
      ['Brownie', 'Kue cokelat panggang'],
      ['Choco', 'Cokelat'],
      ['Biscuit', 'Biskuit dalam bahasa Inggris'],
      ['Nugget', 'Potongan ayam goreng kecil'],
      ['Donat', 'Kue donat berlubang'],
      ['Popcorn', 'Berondong jagung'],
      ['Karamel', 'Gula yang dimasak sampai kecokelatan'],
      ['Marshmallow', 'Permen kenyal yang lembut'],
      ['Pretzel', 'Roti pretzel yang gurih'],
      ['Cupcake', 'Kue mangkuk kecil'],
      ['Nacho', 'Keripik tortilla dari Meksiko'],
      ['Taco', 'Makanan lipat isi daging dari Meksiko'],
    ],
    gagah: [
      ['Rocky', 'Kuat seperti batu karang'],
      ['Max', 'Terbesar dalam bahasa Latin'],
      ['Bruno', 'Cokelat atau perisai dalam bahasa Jerman'],
      ['Rex', 'Raja dalam bahasa Latin'],
      ['Thor', 'Dewa petir dalam mitologi Nordik'],
      ['Zeus', 'Dewa langit dalam mitologi Yunani'],
      ['Ares', 'Dewa perang dalam mitologi Yunani'],
      ['Odin', 'Dewa utama dalam mitologi Nordik'],
      ['Atlas', 'Raksasa penopang langit dalam mitologi Yunani'],
      ['Apollo', 'Dewa matahari dalam mitologi Yunani'],
      ['Hector', 'Pahlawan Troya dalam mitologi Yunani'],
      ['Sparta', 'Kota prajurit di Yunani kuno'],
    ],
    manis: [
      ['Daisy', 'Bunga aster'],
      ['Rosie', 'Mawar'],
      ['Lulu', 'Nama pendek yang manis'],
      ['Molly', 'Nama yang hangat dan akrab'],
      ['Coco', 'Dari kakao atau kelapa'],
      ['Mimi', 'Nama pendek yang manis'],
      ['Poppy', 'Bunga poppy'],
      ['Ruby', 'Batu permata merah'],
      ['Pearl', 'Mutiara'],
      ['Ivy', 'Tanaman rambat ivy'],
      ['Gigi', 'Nama pendek yang ceria'],
      ['Lily', 'Bunga lili'],
    ],
    unik: [
      ['Koda', 'Teman dalam bahasa suku Sioux'],
      ['Ziggy', 'Nama pendek yang mudah diingat'],
      ['Pip', 'Nama pendek yang ringan'],
      ['Bingo', 'Nama permainan yang ramai'],
      ['Jazz', 'Aliran musik jazz'],
      ['Echo', 'Gema'],
      ['Pixel', 'Titik kecil pembentuk gambar di layar'],
      ['Turbo', 'Cepat seperti mesin turbo'],
      ['Comet', 'Komet, benda langit berekor'],
      ['Rocket', 'Roket'],
      ['Banjo', 'Alat musik petik banjo'],
      ['Zorro', 'Tokoh pahlawan bertopeng'],
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
    html += '<p class="hint">Tekan lagi untuk nama yang lain. Nama yang pendek dan jelas biasanya lebih cepat dikenali hewan.</p>';
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
